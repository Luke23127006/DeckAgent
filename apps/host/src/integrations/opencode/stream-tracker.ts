import { summarizedNotice } from '@deckagent/session-persistence'
import type { RequestRun, RuntimeEvent, RuntimeOutcome } from '@deckagent/host-api'
import { errorCode, isContextOverflow, parseEvent } from './events.ts'
import type { OpenCodeEvent } from './events.ts'
import type { ProcessResult } from './process.ts'

export interface AttemptResult {
  readonly outcome: RuntimeOutcome
  readonly nativeSessionId?: string
  readonly noWork: boolean
}

export interface AttemptTimer {
  readonly signal: AbortSignal
  readonly local: AbortController
  timedOut(): boolean
  cleanup(): void
}

/** One attempt clock; an approval wait pauses it and a later resume keeps the remaining time. */
export function createAttemptTimer(timeoutMs: number, run: RequestRun): AttemptTimer {
  const local = new AbortController()
  let timedOut = false
  let remaining = timeoutMs
  let started = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  const arm = () => {
    started = Date.now()
    timer = setTimeout(() => {
      timedOut = true
      local.abort()
    }, remaining)
  }
  arm()
  let waiting = false
  const unsubscribeWait = run.onApprovalWait?.(value => {
    if (value === waiting) return
    waiting = value
    if (value) {
      clearTimeout(timer)
      remaining = Math.max(1, remaining - (Date.now() - started))
    } else arm()
  })
  return {
    signal: AbortSignal.any([run.signal, local.signal]),
    local,
    timedOut: () => timedOut,
    cleanup() {
      clearTimeout(timer)
      unsubscribeWait?.()
    },
  }
}

export interface StreamTracker {
  onLine(value: unknown): void
  finalize(aborted: boolean, timedOut: boolean): Promise<void>
  classify(result: ProcessResult, runAborted: boolean, timedOut: boolean, localAborted: boolean): AttemptResult
}

type SummaryState = 'none' | 'waiting' | 'writing'

/** Reads the CLI event stream into request events and compacts the conversation around a context overflow (FR-079). */
class StreamTracking implements StreamTracker {
  private nativeSessionId: string | undefined
  private steps = 0
  private modelSteps = 0
  private modelActivity: string | undefined
  private finishReason: string | undefined
  private failure: string | undefined
  private protocolError = false
  private summary: SummaryState = 'none'
  private summaryMessage: string | undefined
  private summaryActivity = ''
  private overflows = 0
  private summaries = 0
  private writes: Promise<void> = Promise.resolve()
  private readonly assistantMessages = new Set<string>()
  private readonly texts = new Map<string, string>()
  private readonly tools = new Map<string, string>()
  constructor(
    private readonly run: RequestRun,
    private readonly abortLocal: () => void,
  ) {}
  onLine(value: unknown): void {
    const event = parseEvent(value)
    if (!event) {
      this.protocolError = true
      this.abortLocal()
      return
    }
    if (event.sessionId && !this.nativeSessionId) this.nativeSessionId = event.sessionId
    if (event.sessionId && event.sessionId !== this.nativeSessionId) {
      this.protocolError = true
      this.abortLocal()
      return
    }
    if (event.type === 'step_start') this.startStep(event)
    else if (event.type === 'step_finish') this.finishStep(event)
    else if (event.type === 'text') this.saveText(event)
    else if (event.type === 'tool') this.recordTool(event)
    else if (event.type === 'error') this.failEvent(event)
  }
  async finalize(aborted: boolean, timedOut: boolean): Promise<void> {
    // A summary not written ends the request even when the CLI said nothing more (FR-079, as UC-003 A11).
    if (this.summary !== 'none' && !this.failure && !aborted && !timedOut) {
      this.failure = 'CONTEXT_SUMMARY_FAILED'
      this.endSummary('failed')
    }
    await this.writes
  }
  classify(result: ProcessResult, runAborted: boolean, timedOut: boolean, localAborted: boolean): AttemptResult {
    // Work was done when a step ran or the native session already took part in a summary: never retried elsewhere.
    const noWork = this.steps === 0 && this.overflows === 0
    const failed = (code: string): AttemptResult => ({ outcome: { status: 'failed', errorCode: code }, noWork })
    if (runAborted) return failed('STOPPED')
    if (timedOut) return failed('REQUEST_TIMEOUT')
    if (result.startFailed) return { outcome: { status: 'failed', errorCode: 'RUNTIME_UNAVAILABLE' }, noWork: true }
    if (this.protocolError || result.malformed) return failed('RUNTIME_PROTOCOL')
    if (localAborted) return failed('REQUEST_NOT_SAVED')
    if (this.failure) return failed(this.failure)
    // OpenCode 1.19.5 exits 1 after any reported error, including an overflow it then summarized and recovered from.
    if (result.code !== 0 && !(result.code === 1 && this.summaries > 0)) return failed('RUNTIME_FAILED')
    // Exit 0 alone is not completion: the last step must have finished with a final answer, in a known native session.
    if (!this.steps || !this.finishReason || this.finishReason === 'tool-calls' || !this.nativeSessionId)
      return failed('RUNTIME_INCOMPLETE')
    return { outcome: { status: 'completed' }, nativeSessionId: this.nativeSessionId, noWork: false }
  }
  private emit(event: RuntimeEvent): void {
    // A refused write (the request ended or could not be saved) stops the run.
    this.writes = this.writes.then(() => this.run.emit(event)).catch(() => this.abortLocal())
  }
  private activity(id: string, label: string, status: 'running' | 'completed' | 'failed'): void {
    this.emit({ kind: 'activity', id, label, type: 'model', status })
  }
  private ofSummary(messageId: string | undefined): boolean {
    return (
      this.summary === 'writing' &&
      (this.summaryMessage === undefined || messageId === undefined || messageId === this.summaryMessage)
    )
  }
  private endSummary(status: 'completed' | 'failed'): void {
    this.activity(this.summaryActivity, 'Conversation summary', status)
    this.summary = 'none'
    this.summaryMessage = undefined
  }
  private startStep(event: Extract<OpenCodeEvent, { type: 'step_start' }>): void {
    this.steps++
    if (event.messageId) this.assistantMessages.add(event.messageId)
    if (this.summary === 'waiting') {
      this.summary = 'writing'
      this.summaryMessage = event.messageId
      return
    }
    if (this.ofSummary(event.messageId)) return
    this.modelSteps++
    this.modelActivity = `model-${this.modelSteps}`
    this.activity(this.modelActivity, 'Model response', 'running')
  }
  private finishStep(event: Extract<OpenCodeEvent, { type: 'step_finish' }>): void {
    if (this.ofSummary(event.messageId)) {
      if (event.reason === 'error' || event.reason === 'content-filter') {
        this.failure ??= 'CONTEXT_SUMMARY_FAILED'
        this.endSummary('failed')
        return
      }
      this.summaries++
      this.endSummary('completed')
      // Said once per request: the model now reads a summary in place of the conversation before it.
      if (this.summaries === 1) this.emit({ kind: 'notice', code: summarizedNotice })
      return
    }
    this.finishReason = event.reason
    if (this.modelActivity) this.activity(this.modelActivity, 'Model response', 'completed')
    this.modelActivity = undefined
  }
  private saveText(event: Extract<OpenCodeEvent, { type: 'text' }>): void {
    // The summary is what the model reads, not the reply; the user keeps the whole conversation (FR-079).
    if (this.ofSummary(event.messageId)) return
    // A text part of a user message (such as OpenCode's own "continue" note after a summary) is not the reply.
    if (event.messageId && !this.assistantMessages.has(event.messageId)) return
    // Repeated frames of a part replace it; identical frames are not saved twice.
    if (this.texts.get(event.partId) === event.text) return
    this.texts.set(event.partId, event.text)
    this.emit({ kind: 'text', part: event.partId, text: event.text })
  }
  private recordTool(event: Extract<OpenCodeEvent, { type: 'tool' }>): void {
    // Native tools are denied in this build: a denied call is a failed activity, not a failed request (FR-070).
    if (this.tools.get(event.callId) === event.status) return
    this.tools.set(event.callId, event.status)
    // Host tools publish their own activities at the authorization boundary; ignore duplicate CLI records.
    if (!event.tool.startsWith('deckagent_'))
      this.emit({ kind: 'activity', id: `tool-${event.callId}`, label: event.tool, type: 'tool', status: event.status })
  }
  private failEvent(event: Extract<OpenCodeEvent, { type: 'error' }>): void {
    if (isContextOverflow(event) && this.summary === 'none') {
      // The call was refused as too long; OpenCode summarizes and answers again.
      this.overflows++
      this.finishReason = undefined
      if (this.modelActivity) this.activity(this.modelActivity, 'Model response', 'failed')
      this.modelActivity = undefined
      this.summary = 'waiting'
      this.summaryActivity = `summary-${this.overflows}`
      this.activity(this.summaryActivity, 'Conversation summary', 'running')
      return
    }
    // An error while summarizing: the summary could not be written and the request does not finish.
    if (this.summary !== 'none') {
      this.failure ??= isContextOverflow(event) ? 'CONTEXT_SUMMARY_FAILED' : errorCode(event)
      this.endSummary('failed')
      return
    }
    this.failure ??= errorCode(event)
  }
}

export function createStreamTracker(run: RequestRun, abortLocal: () => void): StreamTracker {
  return new StreamTracking(run, abortLocal)
}
