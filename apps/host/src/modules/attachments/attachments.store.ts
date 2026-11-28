import { randomUUID } from 'node:crypto'
import { ChatDatabase } from '../../db/index.ts'
import { DatabaseError, isAttachmentPreparation } from '../../db/index.ts'
import type { AttachmentRecord, AttachmentPreparation } from '../../db/index.ts'

/** Chat-owned metadata; callers make bytes durable before recording their fingerprint. */
export class SqliteAttachmentStore {
  private readonly db
  private readonly access: ChatDatabase

  constructor(sessionDb: ChatDatabase) {
    this.db = sessionDb.db
    this.access = sessionDb
  }

  create(sessionId: string, name: string): AttachmentRecord {
    return this.access.transaction(() => {
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        /[\\/]/.test(name) ||
        [...name].some(character => character.charCodeAt(0) < 32)
      )
        throw new DatabaseError('INVALID_REQUEST', 'Use a file name without a path')
      if (!this.db.prepare('SELECT 1 FROM sessions WHERE id = ?').get(sessionId))
        throw new DatabaseError('SESSION_NOT_FOUND', 'Chat does not exist')
      const id = `att-${randomUUID()}`
      this.db
        .prepare("INSERT INTO attachments (id, session_id, name, state) VALUES (?, ?, ?, 'preparing')")
        .run(id, sessionId, name)
      return this.get(sessionId, id)
    })
  }

  get(sessionId: string, attachmentId: string): AttachmentRecord {
    return this.access.run(() => {
      const row = this.db
        .prepare('SELECT * FROM attachments WHERE id = ? AND session_id = ?')
        .get(attachmentId, sessionId)
      if (!row) throw new DatabaseError('ATTACHMENT_NOT_FOUND', 'Attachment is not available in this chat')

      const source = this.db
        .prepare('SELECT * FROM sources WHERE attachment_id = ? AND session_id = ?')
        .get(attachmentId, sessionId)
      const state = row.state
      if (state !== 'preparing' && state !== 'ready' && state !== 'rejected')
        throw new DatabaseError('SESSION_CORRUPT', 'Attachment state is unreadable')

      let prepared: unknown

      try {
        prepared = row.preparation === null ? undefined : JSON.parse(String(row.preparation))
      } catch {
        throw new DatabaseError('SESSION_CORRUPT', 'Attachment preparation is unreadable')
      }

      if (prepared !== undefined && !isAttachmentPreparation(prepared))
        throw new DatabaseError('SESSION_CORRUPT', 'Attachment preparation is unreadable')

      return {
        attachmentId,
        name: String(row.name),
        state,
        byteSize: Number(row.byte_size),
        ...(prepared === undefined ? {} : { preparation: prepared }),
        ...(row.parsed_fingerprint === null ? {} : { parsedFingerprint: String(row.parsed_fingerprint) }),
        ...(row.detected_type === null ? {} : { detectedType: String(row.detected_type) }),
        ...(row.rejection_code === null ? {} : { rejectionCode: String(row.rejection_code) }),
        ...(row.fingerprint === null ? {} : { fingerprint: String(row.fingerprint) }),
        ...(source
          ? {
              source: {
                sourceId: String(source.id),
                version: Number(source.version),
                kind: 'attachment' as const,
                label: String(source.label),
              },
            }
          : {}),
      }
    })
  }

  received(
    sessionId: string,
    attachmentId: string,
    value: { readonly byteSize: number; readonly fingerprint: string },
  ): void {
    this.access.transaction(() => {
      const item = this.get(sessionId, attachmentId)
      if (item.state !== 'preparing' || item.fingerprint)
        throw new DatabaseError('ATTACHMENT_CONFLICT', 'Attachment bytes are already settled')
      if (!Number.isSafeInteger(value.byteSize) || value.byteSize < 0 || !/^[a-f0-9]{64}$/.test(value.fingerprint))
        throw new DatabaseError('INVALID_REQUEST', 'Invalid attachment receipt')
      this.db
        .prepare('UPDATE attachments SET byte_size = ?, fingerprint = ? WHERE id = ?')
        .run(value.byteSize, value.fingerprint, attachmentId)
    })
  }

  /** Trusted parser admission only: this operation does not validate file types or product limits. */
  ready(
    sessionId: string,
    attachmentId: string,
    detectedType: string,
    prepared?: AttachmentPreparation & { readonly parsedFingerprint: string },
  ): AttachmentRecord {
    return this.access.transaction(() => {
      const item = this.get(sessionId, attachmentId)
      if (item.state !== 'preparing' || !item.fingerprint)
        throw new DatabaseError('ATTACHMENT_NOT_READY', 'Attachment bytes must be saved before admission')
      if (typeof detectedType !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(detectedType))
        throw new DatabaseError('INVALID_REQUEST', 'A detected media type is required')
      if (prepared && (!isAttachmentPreparation(prepared) || !/^[a-f0-9]{64}$/.test(prepared.parsedFingerprint)))
        throw new DatabaseError('INVALID_REQUEST', 'Invalid preparation receipt')

      this.db
        .prepare("UPDATE attachments SET state = 'ready', detected_type = ? WHERE id = ?")
        .run(detectedType, attachmentId)

      if (prepared) {
        const { parsedFingerprint, ...summary } = prepared
        this.db
          .prepare('UPDATE attachments SET preparation = ?, parsed_fingerprint = ? WHERE id = ?')
          .run(JSON.stringify(summary), parsedFingerprint, attachmentId)
      }

      this.db
        .prepare(
          'INSERT INTO sources (id, version, session_id, attachment_id, fingerprint, label) VALUES (?, 1, ?, ?, ?, ?)',
        )
        .run(`src-${randomUUID()}`, sessionId, attachmentId, item.fingerprint, item.name)

      return this.get(sessionId, attachmentId)
    })
  }

  reject(sessionId: string, attachmentId: string, code: string): AttachmentRecord {
    return this.access.transaction(() => {
      const item = this.get(sessionId, attachmentId)
      if (item.state !== 'preparing') throw new DatabaseError('ATTACHMENT_CONFLICT', 'Attachment is already settled')
      if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(code)) throw new DatabaseError('INVALID_REQUEST', 'Invalid rejection code')
      this.db
        .prepare("UPDATE attachments SET state = 'rejected', rejection_code = ? WHERE id = ?")
        .run(code, attachmentId)
      return this.get(sessionId, attachmentId)
    })
  }

  /** Startup cleanup sees only unsent records; committed associations are never candidates. */
  unsent(): readonly { readonly sessionId: string; readonly attachmentId: string }[] {
    return this.access.run(() =>
      this.db
        .prepare('SELECT session_id, id FROM attachments WHERE request_id IS NULL')
        .all()
        .map(row => ({ sessionId: String(row.session_id), attachmentId: String(row.id) })),
    )
  }

  retainedIds(): readonly string[] {
    return this.access.run(() =>
      this.db
        .prepare('SELECT id FROM attachments WHERE request_id IS NOT NULL')
        .all()
        .map(row => String(row.id)),
    )
  }

  sent(sessionId: string): readonly AttachmentRecord[] {
    return this.access.run(() =>
      this.db
        .prepare('SELECT id FROM attachments WHERE session_id = ? AND request_id IS NOT NULL ORDER BY rowid')
        .all(sessionId)
        .map(row => this.get(sessionId, String(row.id))),
    )
  }

  removeUnsent(sessionId: string, attachmentId: string): void {
    this.access.transaction(() => {
      this.get(sessionId, attachmentId)
      const row = this.db.prepare('SELECT request_id FROM attachments WHERE id = ?').get(attachmentId)!
      if (row.request_id !== null)
        throw new DatabaseError('ATTACHMENT_CONFLICT', 'Sent attachments cannot be removed from a draft')
      this.db.prepare('DELETE FROM sources WHERE attachment_id = ?').run(attachmentId)
      this.db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId)
    })
  }

  validateReadyInTx(sessionId: string, attachmentIds: readonly string[]): readonly AttachmentRecord[] {
    if (new Set(attachmentIds).size !== attachmentIds.length)
      throw new DatabaseError('INVALID_REQUEST', 'Attachment IDs must be unique')
    return attachmentIds.map(id => {
      const item = this.get(sessionId, id)
      if (item.state === 'rejected')
        throw new DatabaseError('ATTACHMENT_REJECTED', 'Remove the rejected attachment before sending')
      if (item.state !== 'ready') throw new DatabaseError('ATTACHMENT_NOT_READY', 'Wait for attachment preparation')
      const row = this.db.prepare('SELECT request_id FROM attachments WHERE id = ?').get(id)
      if (!row || row.request_id !== null)
        throw new DatabaseError('ATTACHMENT_CONFLICT', 'Attachment already belongs to a sent request')
      return item
    })
  }

  linkToRequestInTx(requestId: string, messageSequence: number | undefined, attachmentIds: readonly string[]): void {
    for (const id of attachmentIds)
      this.db
        .prepare('UPDATE attachments SET request_id = ?, message_sequence = ? WHERE id = ?')
        .run(requestId, messageSequence ?? null, id)
  }
}
