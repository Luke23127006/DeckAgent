import type { DatabaseSync } from 'node:sqlite'
import { runOwnerKey } from '../runs/ports.ts'
import { DatabaseError } from './records.ts'
import type { RuntimeBinding } from './records.ts'
import { requireRequest } from './request-queries.ts'

export function readRuntimeBinding(db: DatabaseSync, ownerKey: string): RuntimeBinding | undefined {
  const row = db.prepare('SELECT * FROM runtime_bindings WHERE owner_key = ?').get(ownerKey)
  if (!row) return undefined
  return {
    ownerKey,
    nativeSessionId: String(row.native_session_id),
    selection: { provider: String(row.provider), model: String(row.model) },
    context: String(row.context),
    lastRequestId: String(row.last_request_id),
  }
}

export function saveRuntimeBinding(db: DatabaseSync, binding: RuntimeBinding): void {
  const request = requireRequest(db, binding.lastRequestId)
  if (runOwnerKey(request.owner) !== binding.ownerKey || request.status !== 'completed')
    throw new DatabaseError('SESSION_CONFLICT', 'A native session binds only to a completed request of the same owner')
  if (!/^[\w.-]{1,200}$/.test(binding.nativeSessionId))
    throw new DatabaseError('SESSION_CONFIG', 'Invalid native session ID')
  db.prepare(`INSERT INTO runtime_bindings (owner_key, native_session_id, provider, model, context, last_request_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (owner_key) DO UPDATE SET native_session_id = excluded.native_session_id,
        provider = excluded.provider, model = excluded.model, context = excluded.context, last_request_id = excluded.last_request_id,
        updated_at = excluded.updated_at`).run(
    binding.ownerKey,
    binding.nativeSessionId,
    binding.selection.provider,
    binding.selection.model,
    binding.context,
    binding.lastRequestId,
    new Date().toISOString(),
  )
}

export function deleteRuntimeBinding(db: DatabaseSync, ownerKey: string): void {
  db.prepare('DELETE FROM runtime_bindings WHERE owner_key = ?').run(ownerKey)
}
