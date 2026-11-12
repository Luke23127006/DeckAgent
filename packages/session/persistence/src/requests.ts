import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import { randomUUID } from 'node:crypto'
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
  RequestStatus,
  RuntimeBinding,
  TerminalStatus,
} from './contracts.ts'

const statuses: readonly RequestStatus[] = [
  'active',
  'waiting_approval',
  'completed',
  'failed',
  'stopped',
  'interrupted',
]
const activityStatuses: readonly ActivityStatus[] = ['running', 'completed', 'failed', 'stopped']
const code = /^[A-Z][A-Z0-9_]{0,63}$/
const id = /^[\w.:-]{1,200}$/

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Only the documented shapes are saved; anything else is refused instead of stored as an opaque blob. */
export function validateEvent(value: unknown): asserts value is RequestEventBody {
  let valid = false
  if (record(value)) {
    const keys = Object.keys(value)
    if (value.kind === 'status')
      valid =
        statuses.includes(value.status as RequestStatus) &&
        keys.every(key => ['kind', 'status', 'errorCode'].includes(key)) &&
        (value.errorCode === undefined || (typeof value.errorCode === 'string' && code.test(value.errorCode)))
    if (value.kind === 'activity')
      valid =
        keys.every(key => ['kind', 'id', 'label', 'type', 'status'].includes(key)) &&
        typeof value.id === 'string' &&
        id.test(value.id) &&
        typeof value.label === 'string' &&
        value.label.length > 0 &&
        value.label.length <= 100 &&
        (value.type === 'model' || value.type === 'tool') &&
        activityStatuses.includes(value.status as ActivityStatus)
    if (value.kind === 'text')
      valid =
        keys.every(key => ['kind', 'part', 'text'].includes(key)) &&
        typeof value.part === 'string' &&
        id.test(value.part) &&
        typeof value.text === 'string' &&
        value.text.length <= 1_000_000
    if (value.kind === 'notice')
      valid =
        keys.every(key => ['kind', 'code'].includes(key)) && typeof value.code === 'string' && code.test(value.code)
  }
  if (record(value) && value.kind === 'approval' && record(value.approval)) {
    const approval = value.approval
    valid =
      Object.keys(value).every(key => ['kind', 'approval'].includes(key)) &&
      Object.keys(approval).every(key =>
        ['approvalId', 'requestId', 'operation', 'target', 'reason', 'state'].includes(key),
      ) &&
      typeof approval.approvalId === 'string' &&
      id.test(approval.approvalId) &&
      typeof approval.requestId === 'string' &&
      id.test(approval.requestId) &&
      approval.operation === 'read-file' &&
      typeof approval.target === 'string' &&
      approval.target.length > 0 &&
      approval.target.length <= 4096 &&
      typeof approval.reason === 'string' &&
      approval.reason.length > 0 &&
      approval.reason.length <= 500 &&
      ['pending', 'allowed', 'refused', 'cancelled'].includes(String(approval.state))
  }
  if (!valid) throw new SessionError('REQUEST_EVENT', 'Request event does not match the supported format')
}

const active = "status IN ('active','waiting_approval')"

/** Notice a runtime saves when the conversation before the request was summarized for the model (FR-079). */
export const summarizedNotice = 'CONVERSATION_SUMMARIZED'

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
        const request = this.require(requestId)
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
    readonly requestId: string
    readonly sessionId: string
    readonly input: string
    readonly selection: ModelSelection
    readonly attachmentIds?: readonly string[]
  }): RequestRecord {
    return this.access.transaction(() => {
      if (!id.test(input.requestId)) throw new SessionError('SESSION_CONFIG', 'Invalid request ID')
      if (!this.db.prepare('SELECT 1 FROM sessions WHERE id = ?').get(input.sessionId))
        throw new SessionError('SESSION_NOT_FOUND', 'Session does not exist')
      if (this.db.prepare(`SELECT 1 FROM requests WHERE session_id = ? AND ${active}`).get(input.sessionId))
        throw new SessionError('REQUEST_ACTIVE', 'The chat already has an active request')
      const historyStart = this.access.messageCount(input.sessionId)
      const ids = input.attachmentIds ?? []
      if (new Set(ids).size !== ids.length) throw new SessionError('INVALID_REQUEST', 'Attachment IDs must be unique')
      const attachments = ids.map(attachmentId => {
        const item = this.attachments.get(input.sessionId, attachmentId)
        if (item.state === 'rejected')
          throw new SessionError('ATTACHMENT_REJECTED', 'Remove the rejected attachment before sending')
        if (item.state !== 'ready') throw new SessionError('ATTACHMENT_NOT_READY', 'Wait for attachment preparation')
        if (this.db.prepare('SELECT request_id FROM attachments WHERE id = ?').get(attachmentId)!.request_id !== null)
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
      for (const attachmentId of ids)
        this.db
          .prepare('UPDATE attachments SET request_id = ?, message_sequence = ? WHERE id = ?')
          .run(input.requestId, sequence, attachmentId)
      this.insert(input.requestId, { kind: 'status', status: 'active' }, now)
      return this.require(input.requestId)
    })
  }

  /** Persist one event of an active request. A request that ended accepts no more writes. */
  append(requestId: string, event: RequestEventBody): RequestEvent {
    validateEvent(event)
    return this.access.transaction(() => {
      const request = this.require(requestId)
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
    if (errorCode !== undefined && !code.test(errorCode)) throw new SessionError('REQUEST_EVENT', 'Invalid error code')
    return this.access.transaction(() => this.settle(requestId, status, errorCode))
  }

  /** Host start: every request left active by an earlier run did not finish. Nothing is started again (FR-019). */
  interruptActive(): number {
    return this.access.transaction(() => {
      const rows = this.db.prepare(`SELECT id FROM requests WHERE ${active}`).all()
      for (const row of rows) this.settle(String(row.id), 'interrupted', 'HOST_RESTARTED')
      return rows.length
    })
  }

  get(requestId: string): RequestRecord | undefined {
    return this.access.run(() => this.read(requestId))
  }

  /** Requests of a chat, oldest first. */
  list(sessionId: string): readonly RequestRecord[] {
    return this.access.run(() =>
      this.db
        .prepare('SELECT id FROM requests WHERE session_id = ? ORDER BY rowid')
        .all(sessionId)
        .map(row => this.read(String(row.id))!),
    )
  }

  /** The active request of a chat, if any. */
  activeFor(sessionId: string): string | undefined {
    return this.access.run(() => {
      const row = this.db.prepare(`SELECT id FROM requests WHERE session_id = ? AND ${active}`).get(sessionId)
      return row ? String(row.id) : undefined
    })
  }

  /** Events after a cursor, in order. A reconnecting reader passes its last sequence and misses nothing. */
  events(requestId: string, after = 0): readonly RequestEvent[] {
    return this.access.run(() =>
      this.db
        .prepare(
          'SELECT sequence, created_at, payload FROM request_events WHERE request_id = ? AND sequence > ? ORDER BY sequence',
        )
        .all(requestId, after)
        .map(row => this.event(requestId, row)),
    )
  }

  /** Latest state of each activity of a chat's requests, in the order the activities happened. */
  activities(sessionId: string): readonly ActivityRecord[] {
    return this.access.run(() => {
      const latest = new Map<string, ActivityRecord>()
      for (const row of this.db
        .prepare(`SELECT e.request_id, e.sequence, e.created_at, e.payload FROM request_events e
        JOIN requests r ON r.id = e.request_id WHERE r.session_id = ? ORDER BY r.rowid, e.sequence`)
        .all(sessionId)) {
        const event = this.event(String(row.request_id), row)
        if (event.kind !== 'activity') continue
        const key = `${event.requestId}/${event.id}`
        const first = latest.get(key)?.sequence ?? event.sequence
        latest.set(key, {
          requestId: event.requestId,
          sequence: first,
          id: event.id,
          label: event.label,
          type: event.type,
          status: event.status,
        })
      }
      // A Map keeps first-insertion order: requests oldest first, activities in the order they started.
      return [...latest.values()]
    })
  }

  /** The assistant text saved so far: each text part once, in the order parts first appeared. */
  text(requestId: string): string {
    return this.access.run(() => this.assemble(requestId))
  }

  binding(sessionId: string): RuntimeBinding | undefined {
    return this.access.run(() => {
      const row = this.db.prepare('SELECT * FROM runtime_bindings WHERE session_id = ?').get(sessionId)
      if (!row) return undefined
      return {
        sessionId,
        nativeSessionId: String(row.native_session_id),
        selection: { provider: String(row.provider), model: String(row.model) },
        context: String(row.context),
        lastRequestId: String(row.last_request_id),
      }
    })
  }

  /** Saved only for a completed request of the same chat. */
  bind(binding: RuntimeBinding): void {
    this.access.transaction(() => {
      const request = this.require(binding.lastRequestId)
      if (request.sessionId !== binding.sessionId || request.status !== 'completed')
        throw new SessionError(
          'SESSION_CONFLICT',
          'A native session binds only to a completed request of the same chat',
        )
      if (!/^[\w.-]{1,200}$/.test(binding.nativeSessionId))
        throw new SessionError('SESSION_CONFIG', 'Invalid native session ID')
      this.db
        .prepare(`INSERT INTO runtime_bindings (session_id, native_session_id, provider, model, context, last_request_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (session_id) DO UPDATE SET native_session_id = excluded.native_session_id,
        provider = excluded.provider, model = excluded.model, context = excluded.context, last_request_id = excluded.last_request_id,
        updated_at = excluded.updated_at`)
        .run(
          binding.sessionId,
          binding.nativeSessionId,
          binding.selection.provider,
          binding.selection.model,
          binding.context,
          binding.lastRequestId,
          new Date().toISOString(),
        )
    })
  }

  /** The native session no longer matches the chat; the chat and its history stay. */
  unbind(sessionId: string): void {
    this.access.run(() => {
      this.db.prepare('DELETE FROM runtime_bindings WHERE session_id = ?').run(sessionId)
    })
  }

  private settle(
    requestId: string,
    status: TerminalStatus,
    errorCode: string | undefined,
  ): readonly RequestEvent[] | undefined {
    const request = this.require(requestId)
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
    const text = this.assemble(requestId)
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

  /** Records the exact bytes returned, keeping private origins out of tool results. */
  sourceCatalogue(sessionId: string) {
    return this.access.run(() =>
      this.db
        .prepare(`SELECT s.source_id, s.version, s.kind, s.label FROM source_reads s
      WHERE s.session_id = ? AND s.version = (SELECT MAX(v.version) FROM source_reads v WHERE v.session_id = s.session_id AND v.origin = s.origin)
      ORDER BY s.source_id`)
        .all(sessionId)
        .map(row => ({
          sourceId: String(row.source_id),
          version: Number(row.version),
          kind: String(row.kind),
          label: String(row.label),
        })),
    )
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
    return this.access.transaction(() => {
      const request = this.require(requestId)
      if (request.status !== 'active') throw new SessionError('REQUEST_CLOSED', 'The request is not executing')
      if (
        !value.origin ||
        value.origin.length > 4096 ||
        !value.label ||
        value.label.length > 4096 ||
        !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
        !Number.isSafeInteger(value.lineCount) ||
        value.lineCount < 1 ||
        (value.kind !== 'project-file' && value.kind !== 'approved-file')
      )
        throw new SessionError('INVALID_REQUEST', 'Invalid source receipt')
      const previous = this.db
        .prepare('SELECT * FROM source_reads WHERE session_id = ? AND origin = ? ORDER BY version DESC LIMIT 1')
        .get(request.sessionId, value.origin)
      const sourceId = previous ? String(previous.source_id) : `src-${randomUUID()}`
      let version = previous ? Number(previous.version) : 0
      if (!previous || previous.fingerprint !== value.fingerprint) {
        version++
        this.db
          .prepare(
            'INSERT INTO source_reads (source_id, version, session_id, origin, label, fingerprint, line_count, kind, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .run(
            sourceId,
            version,
            request.sessionId,
            value.origin,
            value.label,
            value.fingerprint,
            value.lineCount,
            value.kind,
            requestId,
          )
      }
      return {
        sourceId,
        version,
        kind: value.kind,
        label: value.label,
        location: { kind: 'lines' as const, start: 1, end: value.lineCount },
      }
    })
  }

  private assemble(requestId: string): string {
    const parts = new Map<string, string>()
    for (const event of this.events(requestId)) if (event.kind === 'text') parts.set(event.part, event.text)
    return [...parts.values()].filter(text => text.trim()).join('\n\n')
  }

  private insert(requestId: string, event: RequestEventBody, timestamp: string): RequestEvent {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(sequence), 0) AS last FROM request_events WHERE request_id = ?')
      .get(requestId)!
    const sequence = Number(row.last) + 1
    this.db
      .prepare('INSERT INTO request_events (request_id, sequence, created_at, payload) VALUES (?, ?, ?, ?)')
      .run(requestId, sequence, timestamp, JSON.stringify(event))
    return { ...event, requestId, sequence, timestamp }
  }

  private event(requestId: string, row: Record<string, unknown>): RequestEvent {
    let body: unknown
    try {
      body = JSON.parse(String(row.payload))
      validateEvent(body)
    } catch {
      throw new SessionError('SESSION_CORRUPT', 'Stored request event does not match the supported format')
    }
    return { ...body, requestId, sequence: Number(row.sequence), timestamp: String(row.created_at) }
  }

  private require(requestId: string): RequestRecord {
    const request = this.read(requestId)
    if (!request) throw new SessionError('REQUEST_NOT_FOUND', 'Request does not exist')
    return request
  }

  private read(requestId: string): RequestRecord | undefined {
    const row = this.db
      .prepare(`SELECT r.*, (SELECT COALESCE(MAX(sequence), 0) FROM request_events e WHERE e.request_id = r.id) AS last_sequence,
      EXISTS (SELECT 1 FROM request_events e WHERE e.request_id = r.id AND json_extract(e.payload, '$.kind') = 'notice'
        AND json_extract(e.payload, '$.code') = '${summarizedNotice}') AS summarized
      FROM requests r WHERE id = ?`)
      .get(requestId)
    if (!row) return undefined
    const status = String(row.status) as RequestStatus
    if (!statuses.includes(status)) throw new SessionError('SESSION_CORRUPT', 'Stored request has an unknown status')
    return {
      requestId: String(row.id),
      sessionId: String(row.session_id),
      status,
      selection: { provider: String(row.provider), model: String(row.model) },
      historyStart: Number(row.history_start),
      startedAt: String(row.started_at),
      ...(row.ended_at === null ? {} : { endedAt: String(row.ended_at) }),
      ...(row.error_code === null ? {} : { errorCode: String(row.error_code) }),
      lastSequence: Number(row.last_sequence),
      ...(Number(row.summarized) ? { summarized: true as const } : {}),
    }
  }
}
