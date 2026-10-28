import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { ChatPermission, PermissionPreset, StepApproval, ApprovalDecision } from '@deckagent/host-api'
import { record } from './web-state.ts'

export function permissionPreset(value: unknown): PermissionPreset {
  if (value !== 'workspace-access' && value !== 'provided-materials-only')
    throw new HttpError(400, 'INVALID_PERMISSION')
  return value
}

/** App-local permission persistence; model text never enters this mutation boundary. */
export class PermissionStore {
  constructor(private readonly db: DatabaseSync) {
    db.exec(`CREATE TABLE IF NOT EXISTS chat_permissions (session_id TEXT PRIMARY KEY, preset TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS permission_grants (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL, revoked_at TEXT) STRICT;
      CREATE TABLE IF NOT EXISTS permission_defaults (id INTEGER PRIMARY KEY CHECK(id=1), preset TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS approval_decisions (approval_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, request_id TEXT NOT NULL, payload TEXT NOT NULL, decision TEXT NOT NULL) STRICT;`)
  }
  defaultPreset(): PermissionPreset {
    return permissionPreset(
      this.db.prepare('SELECT preset FROM permission_defaults WHERE id=1').get()?.preset ?? 'workspace-access',
    )
  }
  setDefault(value: unknown): PermissionPreset {
    if (!record(value) || Object.keys(value).length !== 1) throw new HttpError(400, 'INVALID_PERMISSION')
    const preset = permissionPreset(value.preset)
    this.db
      .prepare('INSERT INTO permission_defaults VALUES (1,?) ON CONFLICT(id) DO UPDATE SET preset=excluded.preset')
      .run(preset)
    return preset
  }
  create(sessionId: string): void {
    this.db
      .prepare('INSERT INTO chat_permissions VALUES (?,?) ON CONFLICT(session_id) DO NOTHING')
      .run(sessionId, this.defaultPreset())
  }
  get(sessionId: string): ChatPermission {
    return {
      sessionId,
      preset: permissionPreset(
        this.db.prepare('SELECT preset FROM chat_permissions WHERE session_id=?').get(sessionId)?.preset ??
          'workspace-access',
      ),
      grants: this.db
        .prepare('SELECT * FROM permission_grants WHERE session_id=? ORDER BY created_at,id')
        .all(sessionId)
        .map(row => ({
          grantId: String(row.id),
          target: String(row.target),
          action: 'read',
          scope: 'file',
          createdAt: String(row.created_at),
          ...(row.revoked_at === null ? {} : { revokedAt: String(row.revoked_at) }),
        })),
    }
  }
  save(sessionId: string, value: unknown): ChatPermission {
    if (!record(value) || Object.keys(value).length !== 1) throw new HttpError(400, 'INVALID_PERMISSION')
    const preset = permissionPreset(value.preset)
    this.db
      .prepare('INSERT INTO chat_permissions VALUES (?,?) ON CONFLICT(session_id) DO UPDATE SET preset=excluded.preset')
      .run(sessionId, preset)
    return this.get(sessionId)
  }
  revoke(sessionId: string, grantId: string): ChatPermission {
    const result = this.db
      .prepare('UPDATE permission_grants SET revoked_at=? WHERE id=? AND session_id=? AND revoked_at IS NULL')
      .run(new Date().toISOString(), grantId, sessionId)
    if (!result.changes) throw new HttpError(409, 'GRANT_UNAVAILABLE')
    return this.get(sessionId)
  }
  answer(approval: StepApproval, decision: ApprovalDecision): void {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      this.db
        .prepare('INSERT INTO approval_decisions VALUES (?,?,?,?,?)')
        .run(approval.approvalId, approval.sessionId, approval.requestId, JSON.stringify(approval), decision)
      if (decision === 'scope')
        this.db
          .prepare('INSERT INTO permission_grants VALUES (?,?,?,?,NULL)')
          .run(randomUUID(), approval.sessionId, approval.target, new Date().toISOString())
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
}
