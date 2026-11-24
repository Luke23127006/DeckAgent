import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import { ApprovalLog } from './approvals.ts'
import type { AttachmentLog } from './attachments.ts'
import type {
  ActivityRecord,
  ActivityStatus,
  Message,
  ModelSelection,
  RequestEvent,
  RequestEventBody,
  RequestRecord,
  ResearchSource,
  RuntimeBinding,
  TerminalStatus,
} from './contracts.ts'
import {
  activeRequestFilter,
  activeRequestFor,
  assembleRequestText,
  listRequests,
  readRequest,
  readRequestActivities,
  readRequestEvents,
  requireRequest,
} from './request-queries.ts'
import {
  readResearchSources,
  readSourceCatalogue,
  reserveResearchAttempt,
  saveResearchResults,
  saveSourceRead,
} from './request-sources.ts'
import { requestCodePattern, requestIdPattern, validateEvent } from './request-validation.ts'
import { deleteRuntimeBinding, readRuntimeBinding, saveRuntimeBinding } from './runtime-bindings.ts'

export { summarizedNotice } from './request-queries.ts'

interface Access {
  run<T>(operation: () => T): T
  transaction<T>(operation: () => T): T
  appendMessages(sessionId: string, messages: readonly Message[]): void
  messageCount(sessionId: string): number
}

/**
 * Requests, their ordered events and native session bindings of chats. One owner for request state:
 * the Host's request controller writes through here, the browser reads through the Host.
 */
export class RequestLog {
  readonly approvals: ApprovalLog
  constructor(
    private readonly db: DatabaseSync,
    private readonly access: Access,
    private readonly attachments: AttachmentLog,
  ) {
    this.approvals = new ApprovalLog(db, {
      run: operation => this.access.run(operation),
      transaction: operation => this.access.transaction(operation),
      assertActive: requestId => {
        const request = requireRequest(this.db, requestId)
        if (request.status !== 'active' && request.status !== 'waiting_approval')
          throw new SessionError('REQUEST_CLOSED', 'The request has ended')
      },
      insert: (requestId, event) => this.insert(requestId, event, new Date().toISOString()),
    })
  }

  /**
   * Admission: the user's message and the active request are saved in one transaction.
   * A chat that already has an active request refuses a second one (FR-014).
   */
  admit(input: {
    readonly publicResearch?: boolean
    readonly requestId: string
    readonly sessionId: string
    readonly input: string
    readonly selection: ModelSelection
    readonly attachmentIds?: readonly string[]
  }): RequestRecord {
    return this.access.transaction(() => {
      if (!requestIdPattern.test(input.requestId)) throw new SessionError('SESSION_CONFIG', 'Invalid request ID')
      if (!this.db.prepare('SELECT 1 FROM sessions WHERE id = ?').get(input.sessionId))
        throw new SessionError('SESSION_NOT_FOUND', 'Session does not exist')
      if (
        this.db.prepare(`SELECT 1 FROM requests WHERE session_id = ? AND ${activeRequestFilter}`).get(input.sessionId)
      )
        throw new SessionError('REQUEST_ACTIVE', 'The chat already has an active request')
      const historyStart = this.access.messageCount(input.sessionId)
      const ids = input.attachmentIds ?? []
      if (new Set(ids).size !== ids.length) throw new SessionError('INVALID_REQUEST', 'Attachment IDs must be unique')
      const attachments = ids.map(attachmentId => {
        const item = this.attachments.get(input.sessionId, attachmentId)
        if (item.state === 'rejected')
          throw new SessionError('ATTACHMENT_REJECTED', 'Remove the rejected attachment before sending')
        if (item.state !== 'ready') throw new SessionError('ATTACHMENT_NOT_READY', 'Wait for attachment preparation')
        const attachmentRow = this.db.prepare('SELECT request_id FROM attachments WHERE id = ?').get(attachmentId)
        if (!attachmentRow) throw new SessionError('ATTACHMENT_NOT_FOUND', 'Attachment does not exist')
        if (attachmentRow.request_id !== null)
          throw new SessionError('ATTACHMENT_CONFLICT', 'Attachment already belongs to a sent request')
        return item
      })
      this.access.appendMessages(input.sessionId, [
        { role: 'user', content: input.input, ...(attachments.length ? { attachments } : {}) },
      ])
      const now = new Date().toISOString()
      this.db
        .prepare(
          `INSERT INTO requests (id, session_id, status, provider, model, history_start, started_at) VALUES (?, ?, 'active', ?, ?, ?, ?)`,
        )
        .run(input.requestId, input.sessionId, input.selection.provider, input.selection.model, historyStart, now)
      const sequence = this.access.messageCount(input.sessionId)
      this.db
        .prepare('INSERT INTO request_research (request_id, selected) VALUES (?, ?)')
        .run(input.requestId, input.publicResearch === true ? 1 : 0)
      for (const attachmentId of ids)
        this.db
          .prepare('UPDATE attachments SET request_id = ?, message_sequence = ? WHERE id = ?')
          .run(input.requestId, sequence, attachmentId)
      this.insert(input.requestId, { kind: 'status', status: 'active' }, now)
      return requireRequest(this.db, input.requestId)
    })
  }

  /** Persist one event of an active request. A request that ended accepts no more writes. */
  append(requestId: string, event: RequestEventBody): RequestEvent {
    validateEvent(event)
    return this.access.transaction(() => {
      const request = requireRequest(this.db, requestId)
      if (request.status !== 'active' && request.status !== 'waiting_approval')
        throw new SessionError('REQUEST_CLOSED', 'The request has ended')
      if (event.kind === 'status' || event.kind === 'approval')
        throw new SessionError('REQUEST_EVENT', 'Status and approvals are owned by Host operations')
      return this.insert(requestId, event, new Date().toISOString())
    })
  }

  /**
   * End an active request once. Running activities settle (`stopped` after Stop, otherwise `failed`),
   * saved text becomes the assistant message (marked interrupted unless completed), and the status event is last.
   * Returns the events written, or `undefined` when the request had already ended.
   */
  finish(requestId: string, status: TerminalStatus, errorCode?: string): readonly RequestEvent[] | undefined {
    if (errorCode !== undefined && !requestCodePattern.test(errorCode))
      throw new SessionError('REQUEST_EVENT', 'Invalid error code')
    return this.access.transaction(() => this.settle(requestId, status, errorCode))
  }

  /** Host start: every request left active by an earlier run did not finish. Nothing is started again (FR-019). */
  interruptActive(): number {
    return this.access.transaction(() => {
      const rows = this.db.prepare(`SELECT id FROM requests WHERE ${activeRequestFilter}`).all()
      for (const row of rows) this.settle(String(row.id), 'interrupted', 'HOST_RESTARTED')
      return rows.length
    })
  }

  get(requestId: string): RequestRecord | undefined {
    return this.access.run(() => readRequest(this.db, requestId))
  }

  /** Requests of a chat, oldest first. */
  list(sessionId: string): readonly RequestRecord[] {
    return this.access.run(() => listRequests(this.db, sessionId))
  }

  /** The active request of a chat, if any. */
  activeFor(sessionId: string): string | undefined {
    return this.access.run(() => activeRequestFor(this.db, sessionId))
  }

  /** Events after a cursor, in order. A reconnecting reader passes its last sequence and misses nothing. */
  events(requestId: string, after = 0): readonly RequestEvent[] {
    return this.access.run(() => readRequestEvents(this.db, requestId, after))
  }

  /** Latest state of each activity of a chat's requests, in the order the activities happened. */
  activities(sessionId: string): readonly ActivityRecord[] {
    return this.access.run(() => readRequestActivities(this.db, sessionId))
  }

  /** The assistant text saved so far: each text part once, in the order parts first appeared. */
  text(requestId: string): string {
    return this.access.run(() => assembleRequestText(this.db, requestId))
  }

  binding(sessionId: string): RuntimeBinding | undefined {
    return this.access.run(() => readRuntimeBinding(this.db, sessionId))
  }

  /** Saved only for a completed request of the same chat. */
  bind(binding: RuntimeBinding): void {
    this.access.transaction(() => saveRuntimeBinding(this.db, binding))
  }

  /** The native session no longer matches the chat; the chat and its history stay. */
  unbind(sessionId: string): void {
    this.access.run(() => deleteRuntimeBinding(this.db, sessionId))
  }

  /** Records the exact bytes returned, keeping private origins out of tool results. */
  sourceCatalogue(sessionId: string) {
    return this.access.run(() => readSourceCatalogue(this.db, sessionId))
  }

  recordSourceRead(
    requestId: string,
    value: {
      readonly origin: string
      readonly label: string
      readonly fingerprint: string
      readonly lineCount: number
      readonly kind: 'project-file' | 'approved-file'
    },
  ) {
    return this.access.transaction(() => saveSourceRead(this.db, requestId, value))
  }

  /** Counts an attempt before any network I/O; ended or unselected requests cannot reserve one. */
  reserveResearch(requestId: string, sessionId: string): void {
    this.access.transaction(() => reserveResearchAttempt(this.db, requestId, sessionId))
  }

  recordResearch(
    requestId: string,
    sessionId: string,
    query: string,
    result: {
      readonly requestId?: string
      readonly results: readonly { readonly title: string; readonly url: string; readonly content: string }[]
    },
  ): readonly ResearchSource[] {
    return this.access.transaction(() => saveResearchResults(this.db, requestId, sessionId, query, result))
  }

  researchSources(sessionId: string): readonly ResearchSource[] {
    return this.access.run(() => readResearchSources(this.db, sessionId))
  }

  private settle(
    requestId: string,
    status: TerminalStatus,
    errorCode: string | undefined,
  ): readonly RequestEvent[] | undefined {
    const request = requireRequest(this.db, requestId)
    if (request.status !== 'active' && request.status !== 'waiting_approval') return undefined
    const now = new Date().toISOString()
    const written: RequestEvent[] = [...this.approvals.cancelPending(requestId)]
    const settled: ActivityStatus = status === 'completed' ? 'completed' : status === 'stopped' ? 'stopped' : 'failed'
    const running = new Map<string, Extract<RequestEventBody, { kind: 'activity' }>>()
    for (const event of this.events(requestId)) {
      if (event.kind !== 'activity') continue
      if (event.status === 'running')
        running.set(event.id, {
          kind: 'activity',
          id: event.id,
          label: event.label,
          type: event.type,
          status: 'running',
        })
      else running.delete(event.id)
    }
    for (const activity of running.values()) written.push(this.insert(requestId, { ...activity, status: settled }, now))
    const refused = this.approvals.refusedTargets(requestId)
    if (refused.length)
      written.push(
        this.insert(
          requestId,
          {
            kind: 'text',
            part: 'host-refused-work',
            text: `Không thực hiện vì bạn đã từ chối: ${refused.join('; ')}.`,
          },
          now,
        ),
      )
    const text = assembleRequestText(this.db, requestId)
    if (text.trim())
      this.access.appendMessages(request.sessionId, [
        status === 'completed'
          ? { role: 'assistant', content: text }
          : { role: 'assistant', content: text, interrupted: true },
      ])
    this.db
      .prepare('UPDATE requests SET status = ?, ended_at = ?, error_code = ? WHERE id = ?')
      .run(status, now, errorCode ?? null, requestId)
    written.push(this.insert(requestId, { kind: 'status', status, ...(errorCode ? { errorCode } : {}) }, now))
    return written
  }

  private insert(requestId: string, event: RequestEventBody, timestamp: string): RequestEvent {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(sequence), 0) AS last FROM request_events WHERE request_id = ?')
      .get(requestId)
    if (!row) throw new SessionError('SESSION_STORAGE', 'Cannot read request event sequence')
    const sequence = Number(row.last) + 1
    this.db
      .prepare('INSERT INTO request_events (request_id, sequence, created_at, payload) VALUES (?, ?, ?, ?)')
      .run(requestId, sequence, timestamp, JSON.stringify(event))
    return { ...event, requestId, sequence, timestamp }
  }
}
