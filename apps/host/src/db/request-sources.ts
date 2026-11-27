import { createHash, randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import type { ResearchSource } from './contracts.ts'
import { requireRequest } from './request-queries.ts'
import { parseResearchSource } from './request-validation.ts'

export function readSourceCatalogue(db: DatabaseSync, sessionId: string) {
  return db
    .prepare(`SELECT s.source_id, s.version, s.kind, s.label FROM source_reads s
      WHERE s.session_id = ? AND s.version = (SELECT MAX(v.version) FROM source_reads v WHERE v.session_id = s.session_id AND v.origin = s.origin)
      ORDER BY s.source_id`)
    .all(sessionId)
    .map(row => ({
      sourceId: String(row.source_id),
      version: Number(row.version),
      kind: String(row.kind),
      label: String(row.label),
    }))
}

export function saveSourceRead(
  db: DatabaseSync,
  requestId: string,
  value: {
    readonly origin: string
    readonly label: string
    readonly fingerprint: string
    readonly lineCount: number
    readonly kind: 'project-file' | 'approved-file'
  },
) {
  const request = requireRequest(db, requestId)
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
  const previous = db
    .prepare('SELECT * FROM source_reads WHERE session_id = ? AND origin = ? ORDER BY version DESC LIMIT 1')
    .get(request.owner.id, value.origin)
  const sourceId = previous ? String(previous.source_id) : `src-${randomUUID()}`
  let version = previous ? Number(previous.version) : 0
  if (!previous || previous.fingerprint !== value.fingerprint) {
    version++
    db.prepare(
      'INSERT INTO source_reads (source_id, version, session_id, origin, label, fingerprint, line_count, kind, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      sourceId,
      version,
      request.owner.id,
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
}

export function reserveResearchAttempt(db: DatabaseSync, requestId: string, sessionId: string): void {
  const request = requireRequest(db, requestId)
  if (request.owner.kind !== 'chat' || request.owner.id !== sessionId || request.status !== 'active')
    throw new SessionError('REQUEST_CLOSED', 'Request is not active')
  const row = db.prepare('SELECT selected, attempts FROM request_research WHERE request_id = ?').get(requestId)
  if (!row || row.selected !== 1) throw new SessionError('RESEARCH_NOT_SELECTED', 'Public research was not selected')
  if (Number(row.attempts) >= 3) throw new SessionError('RESEARCH_BUDGET_EXHAUSTED', 'Search budget reached')
  db.prepare('UPDATE request_research SET attempts = attempts + 1 WHERE request_id = ?').run(requestId)
}

export function saveResearchResults(
  db: DatabaseSync,
  requestId: string,
  sessionId: string,
  query: string,
  result: {
    readonly requestId?: string
    readonly results: readonly { readonly title: string; readonly url: string; readonly content: string }[]
  },
): readonly ResearchSource[] {
  const request = requireRequest(db, requestId)
  const row = db.prepare('SELECT selected, attempts FROM request_research WHERE request_id = ?').get(requestId)
  if (
    request.owner.kind !== 'chat' ||
    request.owner.id !== sessionId ||
    request.status !== 'active' ||
    row?.selected !== 1 ||
    Number(row.attempts) < 1
  )
    throw new SessionError('REQUEST_CLOSED', 'Research is not authorized')
  if (
    !query.trim() ||
    query.length > 1000 ||
    result.results.length > 5 ||
    result.results.some(item => item.title.length > 300 || item.url.length > 2048 || item.content.length > 6000)
  )
    throw new SessionError('INVALID_REQUEST', 'Invalid research result')
  return result.results.map(item => {
    const source: ResearchSource = {
      ...item,
      sourceId: `src-${randomUUID()}`,
      version: 1,
      kind: 'research',
      provider: 'tavily',
      query,
      partial: true,
      fingerprint: createHash('sha256').update(item.content).digest('hex'),
      retrievedAt: new Date().toISOString(),
      ...(result.requestId ? { providerRequestId: result.requestId } : {}),
      location: { kind: 'research-result', start: 0, end: item.content.length },
    }
    db.prepare('INSERT INTO research_sources (id, request_id, session_id, payload) VALUES (?, ?, ?, ?)').run(
      source.sourceId,
      requestId,
      sessionId,
      JSON.stringify(source),
    )
    return source
  })
}

export function readResearchSources(db: DatabaseSync, sessionId: string): readonly ResearchSource[] {
  return db
    .prepare('SELECT payload FROM research_sources WHERE session_id = ? ORDER BY rowid')
    .all(sessionId)
    .map(row => parseResearchSource(String(row.payload)))
}
