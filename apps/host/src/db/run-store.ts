import type { DatabaseSync } from 'node:sqlite'
import type { RunOwner, RunStore } from '../runs/ports.ts'
import { ApprovalLog } from './approvals.ts'
import { DatabaseError } from './records.ts'
import type {
  ActivityRecord,
  ActivityStatus,
  ModelSelection,
  RequestEvent,
  RequestEventBody,
  RequestRecord,
  ResearchSource,
  RuntimeBinding,
  TerminalStatus,
} from './records.ts'
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
import type { ChatDatabase } from './chat-database.ts'

export { summarizedNotice } from './request-queries.ts'

export interface RunAdmitInput {
  readonly publicResearch?: boolean
  readonly requestId: string
  readonly owner: RunOwner
  readonly input: string
  readonly selection: ModelSelection
  readonly attachmentIds?: readonly string[]
  readonly draftRevision?: number
}

export interface RunStoreHooks {
  beforeAdmit?(input: RunAdmitInput): { readonly historyStart: number; readonly messageSequence?: number }
  afterAdmit?(input: RunAdmitInput, messageSequence: number | undefined): void
  onSettle?(owner: RunOwner, status: TerminalStatus, text: string): void
}

function parseOwnerKey(ownerKey: string): { readonly kind: string; readonly id: string } | undefined {
  const index = ownerKey.indexOf(':')
  if (index <= 0 || index === ownerKey.length - 1) return undefined
  return { kind: ownerKey.slice(0, index), id: ownerKey.slice(index + 1) }
}

/**
 * Durable run store backed by `ChatDatabase` (schema v9). Owns `requests`, `request_events`,
 * `request_approvals`, `runtime_bindings`, `source_reads`, `request_research` and `research_sources`.
 */
export class SqliteRunStore implements RunStore {
  private readonly db: DatabaseSync
  readonly approvals: ApprovalLog

  constructor(
    private readonly sessionDb: ChatDatabase,
    private readonly hooks: RunStoreHooks = {},
  ) {
    this.db = sessionDb.db
    this.approvals = new ApprovalLog(this.db, {
      run: operation => this.sessionDb.run(operation),
      transaction: operation => this.sessionDb.transaction(operation),
      assertActive: requestId => {
        const request = requireRequest(this.db, requestId)
        if (request.status !== 'active' && request.status !== 'waiting_approval')
          throw new DatabaseError('REQUEST_CLOSED', 'The request has ended')
      },
      insert: (requestId, event) => this.insert(requestId, event, new Date().toISOString()),
    })
  }

  /**
   * Admission: runs `beforeAdmit`, inserts the active run, runs `afterAdmit`, and saves the initial status event
   * inside one `ChatDatabase` transaction. One active run is allowed per `(owner_kind, owner_id)`.
   */
  admit(input: RunAdmitInput): RequestRecord {
    return this.sessionDb.transaction(() => {
      if (!requestIdPattern.test(input.requestId)) throw new DatabaseError('SESSION_CONFIG', 'Invalid request ID')
      if (
        this.db
          .prepare(`SELECT 1 FROM requests WHERE owner_kind = ? AND owner_id = ? AND ${activeRequestFilter}`)
          .get(input.owner.kind, input.owner.id)
      )
        throw new DatabaseError('RUN_OWNER_BUSY', 'The run owner already has an active request')
      const prepared = this.hooks.beforeAdmit?.(input) ?? { historyStart: 0 }
      const now = new Date().toISOString()
      this.db
        .prepare(
          `INSERT INTO requests (id, owner_kind, owner_id, status, provider, model, history_start, started_at) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`,
        )
        .run(
          input.requestId,
          input.owner.kind,
          input.owner.id,
          input.selection.provider,
          input.selection.model,
          prepared.historyStart,
          now,
        )
      this.db
        .prepare('INSERT INTO request_research (request_id, selected) VALUES (?, ?)')
        .run(input.requestId, input.publicResearch === true ? 1 : 0)
      this.hooks.afterAdmit?.(input, prepared.messageSequence)
      this.insert(input.requestId, { kind: 'status', status: 'active' }, now)
      return requireRequest(this.db, input.requestId)
    })
  }

  /** Persist one event of an active request. A request that ended accepts no more writes. */
  append(requestId: string, event: RequestEventBody): RequestEvent {
    validateEvent(event)
    return this.sessionDb.transaction(() => {
      const request = requireRequest(this.db, requestId)
      if (request.status !== 'active' && request.status !== 'waiting_approval')
        throw new DatabaseError('REQUEST_CLOSED', 'The request has ended')
      if (event.kind === 'status' || event.kind === 'approval')
        throw new DatabaseError('REQUEST_EVENT', 'Status and approvals are owned by Host operations')
      return this.insert(requestId, event, new Date().toISOString())
    })
  }

  /** End an active request once, settling activities, assistant text and terminal status in one transaction. */
  finish(requestId: string, status: TerminalStatus, errorCode?: string): readonly RequestEvent[] | undefined {
    if (errorCode !== undefined && !requestCodePattern.test(errorCode))
      throw new DatabaseError('REQUEST_EVENT', 'Invalid error code')
    return this.sessionDb.transaction(() => this.settle(requestId, status, errorCode))
  }

  /** Host start: every request left active by an earlier run did not finish. Nothing is started again (FR-019). */
  interruptActive(): number {
    return this.sessionDb.transaction(() => {
      const rows = this.db.prepare(`SELECT id FROM requests WHERE ${activeRequestFilter}`).all()
      for (const row of rows) this.settle(String(row.id), 'interrupted', 'HOST_RESTARTED')
      return rows.length
    })
  }

  get(requestId: string): RequestRecord | undefined {
    return this.sessionDb.run(() => readRequest(this.db, requestId))
  }

  list(owner: RunOwner): readonly RequestRecord[] {
    return this.sessionDb.run(() => listRequests(this.db, owner))
  }

  activeFor(owner: RunOwner): string | undefined {
    return this.sessionDb.run(() => activeRequestFor(this.db, owner))
  }

  events(requestId: string, after = 0): readonly RequestEvent[] {
    return this.sessionDb.run(() => readRequestEvents(this.db, requestId, after))
  }

  activities(owner: RunOwner): readonly ActivityRecord[] {
    return this.sessionDb.run(() => readRequestActivities(this.db, owner))
  }

  text(requestId: string): string {
    return this.sessionDb.run(() => assembleRequestText(this.db, requestId))
  }

  binding(ownerKey: string): RuntimeBinding | undefined {
    return this.sessionDb.run(() => readRuntimeBinding(this.db, ownerKey))
  }

  bind(binding: RuntimeBinding): void {
    this.sessionDb.transaction(() => saveRuntimeBinding(this.db, binding))
  }

  unbind(ownerKey: string): void {
    this.sessionDb.run(() => deleteRuntimeBinding(this.db, ownerKey))
  }

  lastCompletedRequestId(ownerKey: string, currentRequestId: string): string | undefined {
    return this.sessionDb.run(() => {
      const owner = parseOwnerKey(ownerKey)
      if (!owner) return undefined
      const row = this.db
        .prepare(
          'SELECT id FROM requests WHERE owner_kind = ? AND owner_id = ? AND id != ? ORDER BY rowid DESC LIMIT 1',
        )
        .get(owner.kind, owner.id, currentRequestId)
      return row ? String(row.id) : undefined
    })
  }

  sourceCatalogue(sessionId: string) {
    return this.sessionDb.run(() => readSourceCatalogue(this.db, sessionId))
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
    return this.sessionDb.transaction(() => saveSourceRead(this.db, requestId, value))
  }

  reserveResearch(requestId: string, sessionId: string): void {
    this.sessionDb.transaction(() => reserveResearchAttempt(this.db, requestId, sessionId))
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
    return this.sessionDb.transaction(() => saveResearchResults(this.db, requestId, sessionId, query, result))
  }

  researchSources(sessionId: string): readonly ResearchSource[] {
    return this.sessionDb.run(() => readResearchSources(this.db, sessionId))
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
    if (text.trim()) this.hooks.onSettle?.(request.owner, status, text)
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
    if (!row) throw new DatabaseError('SESSION_STORAGE', 'Cannot read request event sequence')
    const sequence = Number(row.last) + 1
    this.db
      .prepare('INSERT INTO request_events (request_id, sequence, created_at, payload) VALUES (?, ?, ?, ?)')
      .run(requestId, sequence, timestamp, JSON.stringify(event))
    return { ...event, requestId, sequence, timestamp }
  }
}
