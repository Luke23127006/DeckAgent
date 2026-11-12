import { randomUUID } from 'node:crypto'
import type {
  AgentRequest, PreparedRequest, RequestEvent, RequestRuntime, RequestSnapshot, RequestStore, RuntimeEvent, RuntimeOutcome, StoredRequest,
  TerminalStatus,
} from './contracts.ts'
import { HttpError } from './http-error.ts'
export { HttpError } from './http-error.ts'

interface Execution {
  readonly requestId: string
  readonly sessionId: string
  readonly abort: AbortController
  /** Set once the terminal status is saved: every later runtime write is refused. */
  ended: boolean
  /** The user asked to stop (distinguishes Stop from failure and shutdown). */
  stopped: boolean
  work: Promise<void>
}

/** How long a new request waits for a stopped execution to release its chat. */
const releaseWait = 5000

/**
 * Host authority for the request lifecycle (ADR-0004): admission with one active request per chat,
 * persist-then-publish events, Stop, and terminal status. The runtime only supplies evidence.
 */
export class RequestController {
  private readonly executions = new Map<string, Execution>()
  /** Chats whose execution has not settled yet, including a stopped one whose process is still ending. */
  private readonly busy = new Map<string, Execution>()
  private readonly admitting = new Set<string>()
  private readonly listeners = new Set<(event: RequestEvent) => void>()
  private closed = false

  constructor(private readonly store: RequestStore, private readonly runtime: RequestRuntime) {}

  async submit(request: AgentRequest): Promise<RequestSnapshot> {
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
    if (this.admitting.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
    this.admitting.add(request.sessionId)
    try {
      const previous = this.busy.get(request.sessionId)
      if (previous && !previous.ended) throw new HttpError(409, 'SESSION_BUSY')
      // A stopped request already shows as stopped; its process gets a short time to end before the chat runs again.
      if (previous) await Promise.race([previous.work, new Promise(resolve => setTimeout(resolve, releaseWait).unref())])
      if (this.busy.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
      if (this.store.activeFor(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
      if (this.busy.size >= 16) throw new HttpError(429, 'HOST_BUSY')
      const prepared = await this.runtime.prepare(request)
      if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
      const requestId = `req-${randomUUID()}`
      let admitted: StoredRequest
      try {
        admitted = this.store.admit({ requestId, sessionId: request.sessionId, input: request.input, selection: prepared.selection })
      } catch (error) {
        if (error instanceof HttpError) throw error
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
        if (code === 'REQUEST_ACTIVE') throw new HttpError(409, 'SESSION_BUSY')
        if (code === 'SESSION_NOT_FOUND') throw new HttpError(404, 'SESSION_NOT_FOUND')
        throw new HttpError(500, 'REQUEST_NOT_SAVED')
      }
      const execution: Execution = { requestId, sessionId: request.sessionId, abort: new AbortController(), ended: false, stopped: false, work: Promise.resolve() }
      this.executions.set(requestId, execution)
      this.busy.set(request.sessionId, execution)
      for (const event of this.store.events(requestId)) this.publish(event)
      execution.work = this.run(execution, prepared.start.bind(prepared))
      return { requestId, sessionId: request.sessionId, status: admitted.status, text: '', sequence: admitted.lastSequence }
    } finally {
      this.admitting.delete(request.sessionId)
    }
  }

  get(requestId: string): RequestSnapshot {
    const request = this.store.get(requestId)
    if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    return { requestId, sessionId: request.sessionId, status: request.status, ...(request.errorCode ? { errorCode: request.errorCode } : {}),
      text: this.store.text(requestId), sequence: request.lastSequence }
  }

  events(requestId: string, after: number): readonly RequestEvent[] {
    if (!this.store.get(requestId)) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    return this.store.events(requestId, after)
  }

  /** The active request of a chat, as saved. */
  active(sessionId: string): string | undefined {
    return this.store.activeFor(sessionId)
  }

  /**
   * User Stop: takes effect at once even when the runtime sends nothing (NFR-011). The terminal status is saved first,
   * so the execution's later events are refused; then its process is ended.
   */
  stop(requestId: string): RequestSnapshot {
    const execution = this.executions.get(requestId)
    if (!execution) {
      if (!this.store.get(requestId)) throw new HttpError(404, 'REQUEST_NOT_FOUND')
      return this.get(requestId)
    }
    if (!execution.ended) {
      execution.stopped = true
      this.end(execution, 'stopped')
      execution.abort.abort()
    }
    return this.get(requestId)
  }

  subscribe(listener: (event: RequestEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Host shutdown: active work did not finish and is never resumed (FR-019). */
  async close(): Promise<void> {
    this.closed = true
    for (const execution of this.executions.values()) {
      if (!execution.ended) this.end(execution, 'interrupted', 'HOST_STOPPED')
      execution.abort.abort()
    }
    await Promise.all([...this.executions.values()].map(execution => execution.work))
  }

  private async run(execution: Execution, start: PreparedRequest['start']): Promise<void> {
    let outcome: RuntimeOutcome
    try {
      outcome = await start({
        requestId: execution.requestId,
        sessionId: execution.sessionId,
        signal: execution.abort.signal,
        emit: async (event: RuntimeEvent) => {
          if (execution.ended) throw new Error('Request ended')
          let saved: RequestEvent
          try {
            saved = this.store.append(execution.requestId, event)
          } catch (error) {
            // A write the Host cannot save stops the work instead of continuing unrecorded (UC-003 A50).
            if (!execution.ended) { this.end(execution, 'failed', 'REQUEST_NOT_SAVED'); execution.abort.abort() }
            throw error
          }
          this.publish(saved)
        },
      })
    } catch {
      outcome = { status: 'failed', errorCode: 'RUNTIME_FAILED' }
    }
    if (!execution.ended) {
      const saved = outcome.status === 'completed' ? this.end(execution, 'completed') : this.end(execution, 'failed', outcome.errorCode)
      if (saved && outcome.status === 'completed') {
        try { outcome.commit?.() } catch { /* The native session is not kept; the next request starts a new one. */ }
      }
    }
    if (this.busy.get(execution.sessionId) === execution) this.busy.delete(execution.sessionId)
    // Keep a bounded number of settled executions; saved records remain readable from the store.
    if (this.executions.size > 256) for (const [id, item] of this.executions) {
      if (item.ended && !this.busy.has(item.sessionId)) { this.executions.delete(id); break }
    }
  }

  /** Saves the terminal status once, then publishes it. Returns false when the request had already ended. */
  private end(execution: Execution, status: TerminalStatus, errorCode?: string): boolean {
    execution.ended = true
    let written: readonly RequestEvent[] | undefined
    try {
      written = this.store.finish(execution.requestId, status, errorCode)
    } catch {
      written = undefined
    }
    for (const event of written ?? []) this.publish(event)
    return !!written
  }

  private publish(event: RequestEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* One broken stream does not affect the request or other streams. */ }
    }
  }
}
