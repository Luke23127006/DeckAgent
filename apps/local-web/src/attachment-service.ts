import { AttachmentParser, SourceError, attachmentLimits } from '@deckagent/file-tools'
import type { AttachmentManagement, AttachmentView, ChatDraft, RequestStore } from '@deckagent/host-api'
import { HttpError } from '@deckagent/host-api'
import { SessionError } from '@deckagent/session-persistence'
import type { AttachmentRecord, MemoryDraftStore, SqliteSessionStore } from '@deckagent/session-persistence'
import type { ManagedAttachments } from './managed-attachments.ts'

export function attachmentView(item: AttachmentRecord): AttachmentView {
  return {
    attachmentId: item.attachmentId,
    name: item.name,
    state: item.state,
    byteSize: item.byteSize,
    ...(item.detectedType ? { detectedType: item.detectedType } : {}),
    ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
    ...(item.source ? { source: item.source } : {}),
    ...(item.preparation ? { preparation: item.preparation } : {}),
  }
}

function safeError(error: unknown): never {
  if (error instanceof HttpError) throw error
  if (error instanceof SessionError || error instanceof SourceError) {
    const code = error.code
    const status =
      code === 'SESSION_NOT_FOUND' || code === 'ATTACHMENT_NOT_FOUND'
        ? 404
        : [
              'DRAFT_CONFLICT',
              'ATTACHMENT_CONFLICT',
              'ATTACHMENT_NOT_READY',
              'ATTACHMENT_REJECTED',
              'UPLOAD_CANCELLED',
            ].includes(code)
          ? 409
          : ['DRAFT_TOO_LARGE', 'ATTACHMENT_TOO_LARGE', 'ATTACHMENT_COUNT_EXCEEDED', 'PARSING_LIMIT_EXCEEDED'].includes(
                code,
              )
            ? 413
            : code === 'ATTACHMENT_TYPE_UNSUPPORTED'
              ? 415
              : code === 'ATTACHMENT_UNREADABLE'
                ? 422
                : code === 'HOST_BUSY'
                  ? 429
                  : code === 'INVALID_REQUEST'
                    ? 400
                    : 500
    throw new HttpError(status, status === 500 ? 'ATTACHMENT_NOT_SAVED' : code)
  }
  throw new HttpError(500, 'ATTACHMENT_NOT_SAVED')
}

/** The existing storage owners remain private; every public operation binds the owning Chat. */
export class AttachmentService implements AttachmentManagement {
  readonly maxBytes = attachmentLimits.bytes
  readonly maxFiles = attachmentLimits.files
  private readonly parser = new AttachmentParser()
  private readonly preparing = new Map<string, { readonly abort: AbortController; readonly work: Promise<void> }>()
  private closed = false

  constructor(
    private readonly store: SqliteSessionStore,
    private readonly drafts: MemoryDraftStore,
    private readonly files: ManagedAttachments,
  ) {}

  private async chat(id: string): Promise<void> {
    if (!(await this.store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
  }

  async draft(id: string): Promise<ChatDraft> {
    await this.chat(id)
    return this.snapshot(id)
  }

  private snapshot(id: string): ChatDraft {
    const draft = this.drafts.snapshot(id)
    return {
      sessionId: id,
      ...draft,
      attachments: draft.attachmentIds.map(item => attachmentView(this.store.attachments.get(id, item))),
    }
  }

  async save(id: string, input: unknown): Promise<ChatDraft> {
    await this.chat(id)
    if (
      !input ||
      typeof input !== 'object' ||
      !('text' in input) ||
      typeof input.text !== 'string' ||
      !input.text.isWellFormed() ||
      Object.keys(input).some(key => !['text', 'attachmentIds', 'expectedRevision'].includes(key))
    )
      throw new HttpError(400, 'INVALID_REQUEST')
    const current = this.drafts.snapshot(id)
    const expected = 'expectedRevision' in input ? input.expectedRevision : current.revision
    if (expected !== current.revision) throw new HttpError(409, 'DRAFT_CONFLICT')
    const ids: unknown = 'attachmentIds' in input ? input.attachmentIds : current.attachmentIds
    if (!Array.isArray(ids) || ids.some(item => typeof item !== 'string') || new Set(ids).size !== ids.length)
      throw new HttpError(400, 'INVALID_REQUEST')
    const selected: string[] = []
    for (const item of ids) {
      if (typeof item !== 'string' || !current.attachmentIds.includes(item))
        throw new HttpError(404, 'ATTACHMENT_NOT_FOUND')
      selected.push(item)
    }
    const removed = current.attachmentIds.filter(item => !selected.includes(item))
    for (const item of removed) await this.cancel(item)
    try {
      this.drafts.save(id, { text: input.text, attachmentIds: selected }, current.revision)
      for (const item of removed) await this.files.discardUnsent(id, item)
      return this.snapshot(id)
    } catch (error) {
      safeError(error)
    }
  }

  async upload(input: Parameters<AttachmentManagement['upload']>[0]) {
    await this.chat(input.sessionId)
    if (this.drafts.snapshot(input.sessionId).attachmentIds.length >= attachmentLimits.files)
      throw new HttpError(413, 'ATTACHMENT_COUNT_EXCEEDED')
    let received: AttachmentRecord | undefined
    try {
      const item = await this.files.receive({ ...input, maxBytes: this.maxBytes })
      received = item
      await input.complete
      input.signal.throwIfAborted()
      if (!this.drafts.snapshot(input.sessionId).attachmentIds.includes(item.attachmentId))
        throw new HttpError(409, 'ATTACHMENT_CONFLICT')
      const abort = new AbortController()
      const work = this.prepare(input.sessionId, item.attachmentId, abort.signal)
      this.preparing.set(item.attachmentId, { abort, work })
      void work.finally(() => this.preparing.delete(item.attachmentId))
      return { attachment: attachmentView(item), draft: this.snapshot(input.sessionId) }
    } catch (error) {
      if (received) {
        try {
          if (this.store.attachments.get(input.sessionId, received.attachmentId).state === 'preparing')
            this.store.attachments.reject(input.sessionId, received.attachmentId, 'UPLOAD_CANCELLED')
        } catch {
          /* A concurrent explicit removal may already have deleted the unsent record. */
        }
      }
      safeError(error)
    }
  }

  private async prepare(id: string, attachmentId: string, signal: AbortSignal): Promise<void> {
    try {
      const item = this.store.attachments.get(id, attachmentId)
      const bytes = await this.files.read(id, attachmentId, signal)
      const parsed = await this.parser.parse({ name: item.name, bytes, signal })
      const parsedFingerprint = await this.files.savePrepared(id, attachmentId, parsed, signal)
      signal.throwIfAborted()
      this.store.attachments.ready(id, attachmentId, parsed.mediaType, {
        parserVersion: parsed.parserVersion,
        capabilities: parsed.capabilities,
        completeness: parsed.completeness,
        omitted: parsed.omitted,
        parsedFingerprint,
      })
    } catch (error) {
      const code = signal.aborted
        ? 'UPLOAD_CANCELLED'
        : error instanceof SessionError || error instanceof SourceError
          ? error.code
          : 'ATTACHMENT_UNREADABLE'
      try {
        if (this.store.attachments.get(id, attachmentId).state === 'preparing')
          this.store.attachments.reject(id, attachmentId, code)
      } catch {
        /* Removal or shutdown may already have settled the item. */
      }
    }
  }

  async get(id: string, attachmentId: string): Promise<AttachmentView> {
    await this.chat(id)
    try {
      return attachmentView(this.store.attachments.get(id, attachmentId))
    } catch (error) {
      safeError(error)
    }
  }

  private async cancel(attachmentId: string): Promise<void> {
    const job = this.preparing.get(attachmentId)
    if (job) {
      job.abort.abort()
      await job.work
    }
  }

  async remove(id: string, attachmentId: string, expectedRevision: number): Promise<ChatDraft> {
    await this.chat(id)
    try {
      this.store.attachments.get(id, attachmentId)
      if (this.drafts.snapshot(id).revision !== expectedRevision) throw new HttpError(409, 'DRAFT_CONFLICT')
      await this.cancel(attachmentId)
      await this.files.remove(id, attachmentId, expectedRevision)
      return this.snapshot(id)
    } catch (error) {
      safeError(error)
    }
  }

  async preview(id: string, attachmentId: string, signal: AbortSignal) {
    await this.chat(id)
    try {
      const parsed = await this.files.prepared(id, attachmentId, signal)
      const first = parsed.parts[0]
      if (parsed.mediaType.startsWith('image/') && first?.type === 'image')
        return { body: Buffer.from(first.data, 'base64'), contentType: 'image/png' }
      const text = parsed.parts
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n')
        .slice(0, 64 * 1024)
      return {
        body: Buffer.from(
          JSON.stringify({ text, completeness: parsed.completeness, omitted: parsed.omitted, previewOnly: true }),
        ),
        contentType: 'application/json; charset=utf-8',
      }
    } catch (error) {
      safeError(error)
    }
  }

  requestStore(): RequestStore {
    const log = this.store.requests
    return {
      approvals: log.approvals,
      admit: input => {
        const draft = this.drafts.snapshot(input.sessionId)
        if (input.draftRevision !== undefined && (input.draftRevision !== draft.revision || input.input !== draft.text))
          throw new HttpError(409, 'DRAFT_CONFLICT')
        if (draft.attachmentIds.length > attachmentLimits.files) throw new HttpError(413, 'ATTACHMENT_COUNT_EXCEEDED')
        for (const id of draft.attachmentIds) {
          const item = this.store.attachments.get(input.sessionId, id)
          if (item.state !== 'ready')
            throw new HttpError(409, item.state === 'rejected' ? 'ATTACHMENT_REJECTED' : 'ATTACHMENT_NOT_READY')
        }
        const ids = input.attachmentIds ?? []
        if (ids.length !== draft.attachmentIds.length || ids.some(id => !draft.attachmentIds.includes(id)))
          throw new HttpError(409, 'DRAFT_CONFLICT')
        if (ids.length && input.draftRevision === undefined) throw new HttpError(409, 'DRAFT_CONFLICT')
        if (!input.input.trim() && !ids.length) throw new HttpError(400, 'REQUEST_EMPTY')
        const admitted = log.admit(input)
        if (input.draftRevision !== undefined) this.drafts.clear(input.sessionId, input.draftRevision)
        return admitted
      },
      append: (id, event) => log.append(id, event),
      finish: (id, status, code) => log.finish(id, status, code),
      get: id => log.get(id),
      events: (id, after) => log.events(id, after),
      text: id => log.text(id),
      activeFor: id => log.activeFor(id),
    }
  }

  async close(): Promise<void> {
    this.closed = true
    for (const item of this.preparing.values()) item.abort.abort()
    await this.parser.close()
    await Promise.allSettled([...this.preparing.values()].map(item => item.work))
  }
}
