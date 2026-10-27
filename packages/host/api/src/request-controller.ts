import { randomUUID } from 'node:crypto'
import { DeckError } from '@deckagent/deck'
import type { TurnResult } from '@deckagent/agent-runtime'
import type { AgentRequest, HostOptions, RequestAgent, RequestReply, RequestSnapshot } from './contracts.ts'
import { questionDraft } from './request-reply.ts'
import { HttpError } from './http-error.ts'
export { HttpError } from './http-error.ts'

const active = (snapshot: RequestSnapshot) => snapshot.status === 'running' || snapshot.status === 'awaiting_user'

interface RequestEntry {
  snapshot: RequestSnapshot
  readonly abort: AbortController
  work: Promise<void>
  resume?: (input: string) => void
  readonly replies: Map<string, { payload: string; receipt: RequestSnapshot }>
}

/** In-memory request retention is bounded; durable conversation stays in SessionStore. */
export class RequestController {
  private readonly entries = new Map<string, RequestEntry>()
  private readonly busy = new Set<string>()
  private readonly listeners = new Set<(snapshot: RequestSnapshot) => void>()
  private closed = false
  private cleanupFailed = false
  private workspaceChanges = 0

  constructor(private readonly openAgent: HostOptions['openAgent'], private readonly finishRequest?: HostOptions['finishRequest'],
    private readonly requestState?: HostOptions['requestState']) {}

  async submit(request: AgentRequest): Promise<RequestSnapshot> {
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
    if (this.workspaceChanges) throw new HttpError(409, 'WORKSPACE_BUSY')
    if (this.busy.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
    if (this.busy.size >= 16) throw new HttpError(429, 'HOST_BUSY')
    while (this.entries.size >= 128) {
      const oldest = [...this.entries].find(([, entry]) => !active(entry.snapshot))
      if (!oldest) throw new HttpError(429, 'HOST_BUSY')
      this.entries.delete(oldest[0])
    }
    this.busy.add(request.sessionId)
    const entry: RequestEntry = {
      snapshot: { requestId: randomUUID(), sessionId: request.sessionId, status: 'running', revision: 1 },
      abort: new AbortController(),
      work: Promise.resolve(),
      replies: new Map(),
    }
    this.entries.set(entry.snapshot.requestId, entry)
    // Store admission work before awaiting: shutdown must also drain openAgent().
    let admit!: () => void
    entry.work = new Promise<void>(resolve => {
      admit = resolve
    })
    let agent: RequestAgent
    try {
      agent = await this.openAgent(request.sessionId, entry.snapshot.requestId, request)
    } catch (error) {
      this.busy.delete(request.sessionId)
      this.entries.delete(entry.snapshot.requestId)
      admit()
      if (error instanceof HttpError) throw error
      if (error instanceof DeckError && ['OUTLINE_STALE', 'OUTLINE_ALREADY_CONFIRMED', 'OUTLINE_READ_ONLY', 'OUTLINE_LIMIT'].includes(error.code))
        throw new HttpError(409, error.code)
      throw new HttpError(409, 'SESSION_UNAVAILABLE')
    }
    if (this.closed) entry.abort.abort()
    const accepted = structuredClone(entry.snapshot)
    const execution = this.run(entry, request, agent)
    // run handles all failures as safe outcomes, including handle disposal.
    entry.work = execution
    execution.then(admit, admit)
    return accepted
  }

  get(id: string): RequestSnapshot {
    const entry = this.entries.get(id)
    if (!entry) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    return structuredClone(entry.snapshot)
  }

  active(sessionId: string): string | undefined {
    return [...this.entries.values()].find(entry => entry.snapshot.sessionId === sessionId && active(entry.snapshot))?.snapshot.requestId
  }

  reply(id: string, reply: RequestReply): RequestSnapshot {
    const entry = this.entries.get(id)
    if (!entry) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    if (this.closed || entry.abort.signal.aborted || reply.sessionId !== entry.snapshot.sessionId) throw new HttpError(409, 'REPLY_STALE')
    const payload = JSON.stringify(reply)
    const previous = entry.replies.get(reply.replyId)
    if (previous) {
      if (previous.payload !== payload) throw new HttpError(409, 'REPLY_CONFLICT')
      return structuredClone(previous.receipt)
    }
    const question = entry.snapshot.question
    if (entry.snapshot.status !== 'awaiting_user' || !entry.resume || !question ||
      question.questionId !== reply.questionId || question.version !== reply.version) throw new HttpError(409, 'REPLY_STALE')
    const answer = reply.answer
    const input = answer.type === 'text' ? answer.text : answer.type === 'skip' ? 'Bỏ qua câu hỏi này' : question.options[answer.index]
    if (!input || (answer.type === 'skip' && !question.allowSkip)) throw new HttpError(400, 'INVALID_REPLY')
    entry.snapshot = { requestId: id, sessionId: reply.sessionId, status: 'running', revision: (entry.snapshot.revision ?? 0) + 1 }
    const receipt = structuredClone(entry.snapshot)
    entry.replies.set(reply.replyId, { payload, receipt })
    // A bounded receipt cache is sufficient: evicted question IDs can never become current again.
    if (entry.replies.size > 128) entry.replies.delete(entry.replies.keys().next().value!)
    entry.resume(input)
    delete entry.resume
    return receipt
  }

  stop(id: string): RequestSnapshot {
    const entry = this.entries.get(id)
    if (!entry) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    if (active(entry.snapshot)) entry.abort.abort()
    // Admission and finalization still own the Session lock until run settles.
    return structuredClone(entry.snapshot)
  }

  subscribe(listener: (snapshot: RequestSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async close(): Promise<void> {
    this.closed = true
    for (const entry of this.entries.values()) entry.abort.abort()
    await Promise.all([...this.entries.values()].map(entry => entry.work))
    if (this.cleanupFailed) throw new Error('Agent cleanup failed')
  }

  /** Reserve Chat admission while its Workspace setup changes, including async folder checks. */
  async withIdleSessions<T>(ids: readonly string[], operation: () => Promise<T>): Promise<T> {
    if (ids.some(id => this.busy.has(id))) throw new HttpError(409, 'WORKSPACE_BUSY')
    this.workspaceChanges++
    for (const id of ids) this.busy.add(id)
    try { return await operation() }
    finally { this.workspaceChanges--; for (const id of ids) this.busy.delete(id) }
  }

  private async run(entry: RequestEntry, request: AgentRequest, agent: RequestAgent): Promise<void> {
    let result: TurnResult
    let steps = 0
    try {
      let input = request.input
      let version = 0
      while (true) {
        entry.abort.signal.throwIfAborted()
        result = await agent.send(input, { signal: entry.abort.signal })
        steps += result.steps
        const draft = result.status === 'completed' ? agent.question?.() : undefined
        if (!draft) break
        const next: RequestSnapshot = { requestId: entry.snapshot.requestId, sessionId: request.sessionId, status: 'awaiting_user', revision: (entry.snapshot.revision ?? 0) + 1,
          question: { ...questionDraft(draft), questionId: randomUUID(), version: ++version } }
        await this.requestState?.(next)
        entry.abort.signal.throwIfAborted()
        input = await new Promise<string>((resolve, reject) => {
          const abort = () => { delete entry.resume; reject(new Error('Stopped')) }
          entry.abort.signal.addEventListener('abort', abort, { once: true })
          entry.resume = value => { entry.abort.signal.removeEventListener('abort', abort); resolve(value) }
          entry.snapshot = next
          for (const listener of this.listeners) listener(structuredClone(next))
        })
        await this.requestState?.(entry.snapshot)
        for (const listener of this.listeners) listener(structuredClone(entry.snapshot))
      }
      result = { ...result, steps }
    } catch {
      result = entry.abort.signal.aborted
        ? { status: 'cancelled', text: '', steps, error: { code: 'ABORTED', message: 'Request stopped' } }
        : { status: 'failed', text: '', steps, error: { code: 'REQUEST_FAILED', message: 'Request failed' } }
    }
    try {
      await agent.dispose()
    } catch {
      this.cleanupFailed = true
      result = {
        status: 'failed',
        text: result.text,
        steps: result.steps,
        error: { code: 'CLEANUP_FAILED', message: 'Agent cleanup failed' },
      }
    }
    try {
      await this.finishRequest?.(request, entry.snapshot.requestId, result)
    } catch {
      result = { status: 'failed', text: result.text, steps: result.steps,
        error: { code: 'REQUEST_FINALIZATION_FAILED', message: 'Request state could not be saved' } }
    }
    entry.snapshot = { requestId: entry.snapshot.requestId, sessionId: request.sessionId, status: result.status, result, revision: (entry.snapshot.revision ?? 0) + 1 }
    this.busy.delete(entry.snapshot.sessionId)
    for (const listener of this.listeners) listener(structuredClone(entry.snapshot))
  }
}
