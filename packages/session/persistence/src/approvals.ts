import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import type { ApprovalView, RequestEvent, RequestEventBody } from './contracts.ts'

interface Access {
  transaction<T>(operation: () => T): T
  run<T>(operation: () => T): T
  assertActive(requestId: string): void
  insert(requestId: string, event: RequestEventBody): RequestEvent
}

export class ApprovalLog {
  constructor(
    private readonly db: DatabaseSync,
    private readonly access: Access,
  ) {}

  create(
    requestId: string,
    step: { readonly key: string; readonly operation: 'read-file'; readonly target: string; readonly reason: string },
  ) {
    return this.access.transaction(() => {
      this.access.assertActive(requestId)
      if (
        !/^[a-f0-9]{64}$/.test(step.key) ||
        step.operation !== 'read-file' ||
        typeof step.target !== 'string' ||
        !step.target.trim() ||
        step.target.length > 4096 ||
        typeof step.reason !== 'string' ||
        !step.reason.trim() ||
        step.reason.length > 500
      )
        throw new SessionError('INVALID_REQUEST', 'Invalid approval step')
      const refused = this.db
        .prepare("SELECT id FROM request_approvals WHERE request_id = ? AND step_key = ? AND state = 'refused' LIMIT 1")
        .get(requestId, step.key)
      if (refused) return { approval: this.get(requestId, String(refused.id)), events: [] }
      if (this.pending(requestId)) throw new SessionError('APPROVAL_CONFLICT', 'A step is already waiting for approval')
      const id = `approval-${randomUUID()}`
      this.db
        .prepare(
          "INSERT INTO request_approvals (id, request_id, step_key, operation, target, reason, state) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
        )
        .run(id, requestId, step.key, step.operation, step.target, step.reason)
      this.db.prepare("UPDATE requests SET status = 'waiting_approval' WHERE id = ?").run(requestId)
      const approval = this.get(requestId, id)
      return {
        approval,
        events: [
          this.access.insert(requestId, { kind: 'status', status: 'waiting_approval' }),
          this.access.insert(requestId, { kind: 'approval', approval }),
        ],
      }
    })
  }

  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse') {
    return this.access.transaction(() => {
      const approval = this.get(requestId, approvalId)
      this.access.assertActive(requestId)
      if (decision !== 'allow-once' && decision !== 'refuse')
        throw new SessionError('INVALID_REQUEST', 'Invalid approval decision')
      const state = decision === 'allow-once' ? 'allowed' : 'refused'
      if (approval.state === state) return { approval, events: [] }
      if (approval.state !== 'pending') throw new SessionError('APPROVAL_CONFLICT', 'The step already has a decision')
      this.db.prepare('UPDATE request_approvals SET state = ? WHERE id = ?').run(state, approvalId)
      this.db.prepare("UPDATE requests SET status = 'active' WHERE id = ?").run(requestId)
      const saved = this.get(requestId, approvalId)
      return {
        approval: saved,
        events: [
          this.access.insert(requestId, { kind: 'approval', approval: saved }),
          this.access.insert(requestId, { kind: 'status', status: 'active' }),
        ],
      }
    })
  }

  pending(requestId: string): ApprovalView | undefined {
    return this.access.run(() => {
      const row = this.db
        .prepare("SELECT id FROM request_approvals WHERE request_id = ? AND state = 'pending'")
        .get(requestId)
      return row ? this.get(requestId, String(row.id)) : undefined
    })
  }

  /** Called inside the request terminal transaction, never as an independent permission grant. */
  cancelPending(requestId: string): readonly RequestEvent[] {
    const item = this.pending(requestId)
    if (!item) return []
    this.db.prepare("UPDATE request_approvals SET state = 'cancelled' WHERE id = ?").run(item.approvalId)
    return [this.access.insert(requestId, { kind: 'approval', approval: this.get(requestId, item.approvalId) })]
  }

  refusedTargets(requestId: string): readonly string[] {
    return this.db
      .prepare("SELECT DISTINCT target FROM request_approvals WHERE request_id = ? AND state = 'refused'")
      .all(requestId)
      .map(row => String(row.target))
  }

  private get(requestId: string, approvalId: string): ApprovalView {
    const row = this.db
      .prepare('SELECT * FROM request_approvals WHERE id = ? AND request_id = ?')
      .get(approvalId, requestId)
    if (!row) throw new SessionError('APPROVAL_NOT_FOUND', 'Approval is unavailable in this request')
    const state = row.state
    if (state !== 'pending' && state !== 'allowed' && state !== 'refused' && state !== 'cancelled')
      throw new SessionError('SESSION_CORRUPT', 'Approval state is unreadable')
    return {
      approvalId,
      requestId,
      operation: 'read-file',
      target: String(row.target),
      reason: String(row.reason),
      state,
    }
  }
}
