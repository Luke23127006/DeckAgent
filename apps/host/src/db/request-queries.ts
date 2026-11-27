import type { DatabaseSync } from 'node:sqlite'
import type { RunOwner } from '../runs/ports.ts'
import { DatabaseError } from './records.ts'
import type { ActivityRecord, RequestEvent, RequestRecord } from './records.ts'
import { isRequestStatus, validateEvent } from './request-validation.ts'

export const activeRequestFilter = "status IN ('active','waiting_approval')"

/** Notice a runtime saves when the conversation before the request was summarized for the model (FR-079). */
export const summarizedNotice = 'CONVERSATION_SUMMARIZED'

function readOwner(row: Record<string, unknown>): RunOwner {
  if (row.owner_kind !== 'chat') throw new DatabaseError('SESSION_CORRUPT', 'Stored request has an unknown owner kind')
  return { kind: 'chat', id: String(row.owner_id) }
}

export function readRequest(db: DatabaseSync, requestId: string): RequestRecord | undefined {
  const row = db
    .prepare(`SELECT r.*, (SELECT COALESCE(MAX(sequence), 0) FROM request_events e WHERE e.request_id = r.id) AS last_sequence,
      EXISTS (SELECT 1 FROM request_events e WHERE e.request_id = r.id AND json_extract(e.payload, '$.kind') = 'notice'
        AND json_extract(e.payload, '$.code') = '${summarizedNotice}') AS summarized
      FROM requests r WHERE id = ?`)
    .get(requestId)
  if (!row) return undefined
  if (!isRequestStatus(row.status)) throw new DatabaseError('SESSION_CORRUPT', 'Stored request has an unknown status')
  return {
    requestId: String(row.id),
    publicResearch:
      db.prepare('SELECT selected FROM request_research WHERE request_id = ?').get(requestId)?.selected === 1,
    owner: readOwner(row),
    status: row.status,
    selection: { provider: String(row.provider), model: String(row.model) },
    historyStart: Number(row.history_start),
    startedAt: String(row.started_at),
    ...(row.ended_at === null ? {} : { endedAt: String(row.ended_at) }),
    ...(row.error_code === null ? {} : { errorCode: String(row.error_code) }),
    lastSequence: Number(row.last_sequence),
    ...(Number(row.summarized) ? { summarized: true as const } : {}),
  }
}

export function requireRequest(db: DatabaseSync, requestId: string): RequestRecord {
  const request = readRequest(db, requestId)
  if (!request) throw new DatabaseError('REQUEST_NOT_FOUND', 'Request does not exist')
  return request
}

export function listRequests(db: DatabaseSync, owner: RunOwner): readonly RequestRecord[] {
  const records: RequestRecord[] = []
  for (const row of db
    .prepare('SELECT id FROM requests WHERE owner_kind = ? AND owner_id = ? ORDER BY rowid')
    .all(owner.kind, owner.id)) {
    const record = readRequest(db, String(row.id))
    if (record) records.push(record)
  }
  return records
}

export function activeRequestFor(db: DatabaseSync, owner: RunOwner): string | undefined {
  const row = db
    .prepare(`SELECT id FROM requests WHERE owner_kind = ? AND owner_id = ? AND ${activeRequestFilter}`)
    .get(owner.kind, owner.id)
  return row ? String(row.id) : undefined
}

export function readRequestEvent(requestId: string, row: Record<string, unknown>): RequestEvent {
  let body: unknown
  try {
    body = JSON.parse(String(row.payload))
    validateEvent(body)
  } catch {
    throw new DatabaseError('SESSION_CORRUPT', 'Stored request event does not match the supported format')
  }
  return { ...body, requestId, sequence: Number(row.sequence), timestamp: String(row.created_at) }
}

export function readRequestEvents(db: DatabaseSync, requestId: string, after = 0): readonly RequestEvent[] {
  return db
    .prepare(
      'SELECT sequence, created_at, payload FROM request_events WHERE request_id = ? AND sequence > ? ORDER BY sequence',
    )
    .all(requestId, after)
    .map(row => readRequestEvent(requestId, row))
}

export function readRequestActivities(db: DatabaseSync, owner: RunOwner): readonly ActivityRecord[] {
  const latest = new Map<string, ActivityRecord>()
  for (const row of db
    .prepare(`SELECT e.request_id, e.sequence, e.created_at, e.payload FROM request_events e
        JOIN requests r ON r.id = e.request_id WHERE r.owner_kind = ? AND r.owner_id = ? ORDER BY r.rowid, e.sequence`)
    .all(owner.kind, owner.id)) {
    const event = readRequestEvent(String(row.request_id), row)
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
}

export function assembleRequestText(db: DatabaseSync, requestId: string): string {
  const parts = new Map<string, string>()
  for (const event of readRequestEvents(db, requestId)) {
    if (event.kind === 'text') parts.set(event.part, event.text)
  }
  return [...parts.values()].filter(text => text.trim()).join('\n\n')
}
