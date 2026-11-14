import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import type { AttachmentRecord, AttachmentPreparation } from './contracts.ts'

export function isAttachmentPreparation(value: unknown): value is AttachmentPreparation {
  if (
    !value ||
    typeof value !== 'object' ||
    !('parserVersion' in value) ||
    typeof value.parserVersion !== 'string' ||
    !/^[a-zA-Z0-9_.-]{1,80}$/.test(value.parserVersion)
  )
    return false
  if (
    !('capabilities' in value) ||
    !Array.isArray(value.capabilities) ||
    value.capabilities.length > 32 ||
    !value.capabilities.every(item => typeof item === 'string' && /^[a-z0-9-]{1,80}$/.test(item))
  )
    return false
  if (!('completeness' in value) || !['complete', 'partial'].includes(String(value.completeness))) return false
  return (
    'omitted' in value &&
    Array.isArray(value.omitted) &&
    value.omitted.length <= 1000 &&
    value.omitted.every(
      item =>
        item &&
        typeof item === 'object' &&
        typeof item.code === 'string' &&
        /^[A-Z_]{1,64}$/.test(item.code) &&
        (item.entry === undefined || (typeof item.entry === 'string' && item.entry.length <= 512)),
    )
  )
}

interface Access {
  run<T>(operation: () => T): T
  transaction<T>(operation: () => T): T
}

/** Chat-owned metadata; callers make bytes durable before recording their fingerprint. */
export class AttachmentLog {
  constructor(
    private readonly db: DatabaseSync,
    private readonly access: Access,
  ) {}

  create(sessionId: string, name: string): AttachmentRecord {
    return this.access.transaction(() => {
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        /[\\/]/.test(name) ||
        [...name].some(character => character.charCodeAt(0) < 32)
      )
        throw new SessionError('INVALID_REQUEST', 'Use a file name without a path')
      if (!this.db.prepare('SELECT 1 FROM sessions WHERE id = ?').get(sessionId))
        throw new SessionError('SESSION_NOT_FOUND', 'Chat does not exist')
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
      if (!row) throw new SessionError('ATTACHMENT_NOT_FOUND', 'Attachment is not available in this chat')
      const source = this.db
        .prepare('SELECT * FROM sources WHERE attachment_id = ? AND session_id = ?')
        .get(attachmentId, sessionId)
      const state = row.state
      if (state !== 'preparing' && state !== 'ready' && state !== 'rejected')
        throw new SessionError('SESSION_CORRUPT', 'Attachment state is unreadable')
      let prepared: unknown
      try {
        prepared = row.preparation === null ? undefined : JSON.parse(String(row.preparation))
      } catch {
        throw new SessionError('SESSION_CORRUPT', 'Attachment preparation is unreadable')
      }
      if (prepared !== undefined && !isAttachmentPreparation(prepared))
        throw new SessionError('SESSION_CORRUPT', 'Attachment preparation is unreadable')
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
        throw new SessionError('ATTACHMENT_CONFLICT', 'Attachment bytes are already settled')
      if (!Number.isSafeInteger(value.byteSize) || value.byteSize < 0 || !/^[a-f0-9]{64}$/.test(value.fingerprint))
        throw new SessionError('INVALID_REQUEST', 'Invalid attachment receipt')
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
        throw new SessionError('ATTACHMENT_NOT_READY', 'Attachment bytes must be saved before admission')
      if (typeof detectedType !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(detectedType))
        throw new SessionError('INVALID_REQUEST', 'A detected media type is required')
      if (prepared && (!isAttachmentPreparation(prepared) || !/^[a-f0-9]{64}$/.test(prepared.parsedFingerprint)))
        throw new SessionError('INVALID_REQUEST', 'Invalid preparation receipt')
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
      if (item.state !== 'preparing') throw new SessionError('ATTACHMENT_CONFLICT', 'Attachment is already settled')
      if (!/^[A-Z][A-Z0-9_]{0,63}$/.test(code)) throw new SessionError('INVALID_REQUEST', 'Invalid rejection code')
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
        throw new SessionError('ATTACHMENT_CONFLICT', 'Sent attachments cannot be removed from a draft')
      this.db.prepare('DELETE FROM sources WHERE attachment_id = ?').run(attachmentId)
      this.db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId)
    })
  }
}
