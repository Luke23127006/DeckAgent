import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import type { RuntimeBinding } from './contracts.ts'
import { requireRequest } from './request-queries.ts'

export function readRuntimeBinding(db: DatabaseSync, sessionId: string): RuntimeBinding | undefined {
  const row = db.prepare('SELECT * FROM runtime_bindings WHERE session_id = ?').get(sessionId)
  if (!row) return undefined
  return {
    sessionId,
    nativeSessionId: String(row.native_session_id),
    selection: { provider: String(row.provider), model: String(row.model) },
    context: String(row.context),
    lastRequestId: String(row.last_request_id),
  }
}

export function saveRuntimeBinding(db: DatabaseSync, binding: RuntimeBinding): void {
  const request = requireRequest(db, binding.lastRequestId)
  if (request.sessionId !== binding.sessionId || request.status !== 'completed')
    throw new SessionError('SESSION_CONFLICT', 'A native session binds only to a completed request of the same chat')
  if (!/^[\w.-]{1,200}$/.test(binding.nativeSessionId))
    throw new SessionError('SESSION_CONFIG', 'Invalid native session ID')
  db.prepare(`INSERT INTO runtime_bindings (session_id, native_session_id, provider, model, context, last_request_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (session_id) DO UPDATE SET native_session_id = excluded.native_session_id,
        provider = excluded.provider, model = excluded.model, context = excluded.context, last_request_id = excluded.last_request_id,
        updated_at = excluded.updated_at`).run(
    binding.sessionId,
    binding.nativeSessionId,
    binding.selection.provider,
    binding.selection.model,
    binding.context,
    binding.lastRequestId,
    new Date().toISOString(),
  )
}

export function deleteRuntimeBinding(db: DatabaseSync, sessionId: string): void {
  db.prepare('DELETE FROM runtime_bindings WHERE session_id = ?').run(sessionId)
}
