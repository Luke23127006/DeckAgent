import { randomUUID } from 'node:crypto'
import type {
  AgentRequest,
  PreparedRequest,
  RequestEvent,
  RequestRuntime,
  RequestSnapshot,
  RequestStore,
  RuntimeEvent,
  RuntimeOutcome,
  StoredRequest,
  TerminalStatus,
} from './contracts.ts'
import { HttpError } from './http-error.ts'
import type { ApprovalStep, ApprovalView, PreparedTools, RequestTools, ToolResult } from './tool-contracts.ts'
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
  tools?: PreparedTools
  toolQueue: Promise<void>
  waiting?: { readonly approvalId: string; readonly resolve: (allowed: boolean) => void }
  readonly waitListeners: Set<(waiting: boolean) => void>
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

  constructor(
    private readonly store: RequestStore,
    private readonly runtime: RequestRuntime,
    private readonly prepareTools?: (
      sessionId: string,
      attachmentIds?: readonly string[],
      publicResearch?: boolean,
    ) => Promise<PreparedTools>,
  ) {}

  async submit(request: AgentRequest): Promise<RequestSnapshot> {
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
    if (this.admitting.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
    this.admitting.add(request.sessionId)
    try {
      const previous = this.busy.get(request.sessionId)
      if (previous && !previous.ended) throw new HttpError(409, 'SESSION_BUSY')
      // A stopped request already shows as stopped; its process gets a short time to end before the chat runs again.
      if (previous)
        await Promise.race([previous.work, new Promise(resolve => setTimeout(resolve, releaseWait).unref())])
      if (this.busy.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
      if (this.store.activeFor(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
      if (this.busy.size >= 16) throw new HttpError(429, 'HOST_BUSY')
      const prepared = await this.runtime.prepare(request)
      const tools = await this.prepareTools?.(request.sessionId, request.attachmentIds, request.publicResearch)
      if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
      const requestId = `req-${randomUUID()}`
      let admitted: StoredRequest
      try {
        admitted = this.store.admit({
          requestId,
          sessionId: request.sessionId,
          input: request.input,
          selection: prepared.selection,
          ...(request.publicResearch === undefined ? {} : { publicResearch: request.publicResearch }),
          ...(request.attachmentIds === undefined ? {} : { attachmentIds: request.attachmentIds }),
          ...(request.draftRevision === undefined ? {} : { draftRevision: request.draftRevision }),
        })
      } catch (error) {
        if (error instanceof HttpError) throw error
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
        if (code === 'REQUEST_ACTIVE') throw new HttpError(409, 'SESSION_BUSY')
        if (code === 'SESSION_NOT_FOUND') throw new HttpError(404, 'SESSION_NOT_FOUND')
        throw new HttpError(500, 'REQUEST_NOT_SAVED')
      }
      const execution: Execution = {
        requestId,
        sessionId: request.sessionId,
        abort: new AbortController(),
        ended: false,
        stopped: false,
        work: Promise.resolve(),
        toolQueue: Promise.resolve(),
        waitListeners: new Set(),
        ...(tools ? { tools } : {}),
      }
      this.executions.set(requestId, execution)
      this.busy.set(request.sessionId, execution)
      for (const event of this.store.events(requestId)) this.publish(event)
      execution.work = this.run(execution, prepared.start.bind(prepared))
      return {
        requestId,
        sessionId: request.sessionId,
        status: admitted.status,
        text: '',
        sequence: admitted.lastSequence,
      }
    } finally {
      this.admitting.delete(request.sessionId)
    }
  }

  get(requestId: string): RequestSnapshot {
    const request = this.store.get(requestId)
    if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    return {
      requestId,
      sessionId: request.sessionId,
      status: request.status,
      ...(request.errorCode ? { errorCode: request.errorCode } : {}),
      text: this.store.text(requestId),
      sequence: request.lastSequence,
      ...(this.prepareTools ? { pendingApproval: this.store.approvals?.pending(requestId) ?? null } : {}),
    }
  }

  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView {
    if (!this.store.approvals) throw new HttpError(404, 'APPROVAL_NOT_FOUND')
    try {
      const change = this.store.approvals.decide(requestId, approvalId, decision)
      for (const event of change.events) this.publish(event)
      const execution = this.executions.get(requestId)
      if (execution?.waiting?.approvalId === approvalId) {
        const waiter = execution.waiting
        delete execution.waiting
        for (const listener of execution.waitListeners) {
          try {
            listener(false)
          } catch {
            /* An observer cannot change a saved decision. */
          }
        }
        waiter.resolve(change.approval.state === 'allowed')
      }
      return change.approval
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
      if (code === 'APPROVAL_NOT_FOUND' || code === 'REQUEST_NOT_FOUND') throw new HttpError(404, 'APPROVAL_NOT_FOUND')
      if (code === 'APPROVAL_CONFLICT' || code === 'REQUEST_CLOSED') throw new HttpError(409, code)
      const execution = this.executions.get(requestId)
      if (execution && !execution.ended) this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
      throw new HttpError(500, 'REQUEST_NOT_SAVED')
    }
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
    return () => {
      this.listeners.delete(listener)
    }
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
        ...(execution.tools ? { tools: this.toolCapability(execution, execution.tools) } : {}),
        onApprovalWait: listener => {
          execution.waitListeners.add(listener)
          listener(!!execution.waiting)
          return () => {
            execution.waitListeners.delete(listener)
          }
        },
        emit: async (event: RuntimeEvent) => {
          if (execution.ended) throw new Error('Request ended')
          let saved: RequestEvent
          try {
            saved = this.store.append(execution.requestId, event)
          } catch (error) {
            // A write the Host cannot save stops the work instead of continuing unrecorded (UC-003 A50).
            if (!execution.ended) {
              this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
              execution.abort.abort()
            }
            throw error
          }
          this.publish(saved)
        },
      })
    } catch {
      outcome = { status: 'failed', errorCode: 'RUNTIME_FAILED' }
    }
    if (!execution.ended) {
      const saved =
        outcome.status === 'completed'
          ? this.end(execution, 'completed')
          : this.end(execution, 'failed', outcome.errorCode)
      if (saved && outcome.status === 'completed') {
        try {
          outcome.commit?.()
        } catch {
          /* The native session is not kept; the next request starts a new one. */
        }
      }
    }
    if (this.busy.get(execution.sessionId) === execution) this.busy.delete(execution.sessionId)
    // Keep a bounded number of settled executions; saved records remain readable from the store.
    if (this.executions.size > 256)
      for (const [id, item] of this.executions) {
        if (item.ended && !this.busy.has(item.sessionId)) {
          this.executions.delete(id)
          break
        }
      }
  }

  /** Saves the terminal status once, then publishes it. Returns false when the request had already ended. */
  private end(execution: Execution, status: TerminalStatus, errorCode?: string): boolean {
    execution.ended = true
    const waiting = execution.waiting
    delete execution.waiting
    waiting?.resolve(false)
    let written: readonly RequestEvent[] | undefined
    try {
      written = this.store.finish(execution.requestId, status, errorCode)
    } catch {
      written = undefined
    }
    for (const event of written ?? []) this.publish(event)
    execution.abort.abort()
    return !!written
  }

  private publish(event: RequestEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        /* One broken stream does not affect the request or other streams. */
      }
    }
  }

  private async approve(execution: Execution, step: ApprovalStep): Promise<boolean> {
    if (execution.ended || execution.abort.signal.aborted || !this.store.approvals) return false
    let change: ReturnType<NonNullable<RequestStore['approvals']>['create']>
    try {
      change = this.store.approvals.create(execution.requestId, step)
    } catch {
      this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
      execution.abort.abort()
      throw new Error('REQUEST_NOT_SAVED')
    }
    if (change.approval.state === 'refused') return false
    const allowed = new Promise<boolean>(resolve => {
      execution.waiting = { approvalId: change.approval.approvalId, resolve }
    })
    for (const listener of execution.waitListeners) {
      try {
        listener(true)
      } catch {
        /* An observer cannot grant or refuse a step. */
      }
    }
    for (const event of change.events) this.publish(event)
    return allowed
  }

  private toolCapability(execution: Execution, tools: PreparedTools): RequestTools {
    const failure = (code: string): ToolResult => ({ isError: true, content: [{ type: 'text', text: code }] })
    return {
      context: tools.context,
      manifest: tools.manifest,
      schemas: tools.schemas,
      call: (name, args) => {
        const work = execution.toolQueue.then(async () => {
          if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
          if (!tools.schemas.some(tool => tool.name === name)) return failure('TOOL_NOT_ALLOWED')
          const activityId = `tool-${randomUUID()}`
          const emit = (status: 'running' | 'completed' | 'failed') => {
            if (execution.ended) return
            const saved = this.store.append(execution.requestId, {
              kind: 'activity',
              id: activityId,
              label: name,
              type: 'tool',
              status,
            })
            this.publish(saved)
          }
          try {
            emit('running')
            const result = await tools.execute(name, args, {
              requestId: execution.requestId,
              sessionId: execution.sessionId,
              signal: execution.abort.signal,
              approve: step => this.approve(execution, step),
            })
            if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
            emit(result.isError ? 'failed' : 'completed')
            return result
          } catch (error) {
            if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
            const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
            if (code === 'SESSION_STORAGE' || code === 'SESSION_CLOSED' || code === 'SESSION_CORRUPT') {
              this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
              execution.abort.abort()
              return failure('REQUEST_NOT_SAVED')
            }
            try {
              emit('failed')
            } catch {
              this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
              execution.abort.abort()
            }
            return failure(typeof code === 'string' && /^SOURCE_[A-Z_]+$/.test(code) ? code : 'TOOL_FAILED')
          }
        })
        execution.toolQueue = work.then(
          () => {},
          () => {},
        )
        return work
      },
    }
  }
}
