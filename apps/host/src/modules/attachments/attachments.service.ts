import type { AttachmentView, ChatDraft } from '@deckagent/host-contracts'
import type { MemoryDraftStore } from './draft.store.ts'
import type { AttachmentRecordView, ManagedAttachments, ParsedAttachmentData } from './attachments.store.ts'

export class AttachmentFailure extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'AttachmentFailure'
  }
}

/** The chat rows that the attachment operations read. `SqliteSessionStore` implements it. */
export interface AttachmentSessionStore {
  getInfo(id: string): Promise<unknown>
  readonly attachments: {
    get(sessionId: string, attachmentId: string): AttachmentRecordView
    ready(
      sessionId: string,
      attachmentId: string,
      detectedType: string,
      prepared?: NonNullable<AttachmentRecordView['preparation']> & { readonly parsedFingerprint: string },
    ): AttachmentRecordView
    reject(sessionId: string, attachmentId: string, code: string): AttachmentRecordView
  }
}

/** The attachment parser. `AttachmentParser` implements it. */
export interface AttachmentParserPort {
  parse(input: {
    readonly name: string
    readonly bytes: Uint8Array
    readonly signal: AbortSignal
  }): Promise<ParsedAttachmentData>
  close(): Promise<void>
}

/** Product limits of one draft. `attachmentLimits` supplies them. */
export interface AttachmentLimits {
  readonly files: number
  readonly bytes: number
}

export interface AttachmentUploadInput {
  readonly sessionId: string
  readonly name: string
  readonly expectedRevision: number
  readonly bytes: AsyncIterable<Uint8Array>
  readonly signal: AbortSignal
  readonly complete?: Promise<void>
}

export interface AttachmentPreview {
  readonly body: Uint8Array
  readonly contentType: string
}

/** What request admission reads from a draft before it saves a user message. */
export interface DraftAdmitInput {
  readonly sessionId: string
  readonly input: string
  readonly attachmentIds?: readonly string[]
  readonly draftRevision?: number
}

/** Attachment and draft operations that the routes call. */
export interface AttachmentOperations {
  readonly maxBytes: number
  readonly maxFiles: number
  draft(id: string): Promise<ChatDraft>
  save(id: string, input: unknown): Promise<ChatDraft>
  upload(input: AttachmentUploadInput): Promise<{ readonly attachment: AttachmentView; readonly draft: ChatDraft }>
  get(id: string, attachmentId: string): Promise<AttachmentView>
  remove(id: string, attachmentId: string, expectedRevision: number): Promise<ChatDraft>
  preview(id: string, attachmentId: string, signal: AbortSignal): Promise<AttachmentPreview>
}

function attachmentView(item: AttachmentRecordView): AttachmentView {
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

const knownAttachmentCodes = new Set([
  'SESSION_NOT_FOUND',
  'ATTACHMENT_NOT_FOUND',
  'DRAFT_CONFLICT',
  'ATTACHMENT_CONFLICT',
  'ATTACHMENT_NOT_READY',
  'ATTACHMENT_REJECTED',
  'UPLOAD_CANCELLED',
  'DRAFT_TOO_LARGE',
  'ATTACHMENT_TOO_LARGE',
  'ATTACHMENT_COUNT_EXCEEDED',
  'PARSING_LIMIT_EXCEEDED',
  'ATTACHMENT_TYPE_UNSUPPORTED',
  'ATTACHMENT_UNREADABLE',
  'HOST_BUSY',
  'INVALID_REQUEST',
])

function knownCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error) || typeof error.code !== 'string') return undefined
  return knownAttachmentCodes.has(error.code) ? error.code : undefined
}

function safeError(error: unknown): never {
  if (error instanceof AttachmentFailure) throw error
  const code = knownCode(error)
  if (code !== undefined) throw new AttachmentFailure(code)
  throw new AttachmentFailure('ATTACHMENT_NOT_SAVED')
}

/** The existing storage owners remain private; every public operation binds the owning Chat. */
export class AttachmentCoordinator implements AttachmentOperations {
  readonly maxBytes: number
  readonly maxFiles: number
  private readonly preparing = new Map<string, { readonly abort: AbortController; readonly work: Promise<void> }>()
  private closed = false

  constructor(
    private readonly store: AttachmentSessionStore,
    private readonly drafts: MemoryDraftStore,
    private readonly files: ManagedAttachments,
    private readonly parser: AttachmentParserPort,
    private readonly limits: AttachmentLimits,
  ) {
    this.maxBytes = limits.bytes
    this.maxFiles = limits.files
  }

  private async chat(id: string): Promise<void> {
    if (!(await this.store.getInfo(id))) throw new AttachmentFailure('SESSION_NOT_FOUND')
    if (this.closed) throw new AttachmentFailure('HOST_CLOSED')
  }

  async draft(id: string): Promise<ChatDraft> {
    await this.chat(id)
    return this.snapshot(id)
  }

  /** The draft change notice version of a chat. It changes on background settlement too. */
  draftVersion(id: string): number {
    return this.drafts.version(id)
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
      throw new AttachmentFailure('INVALID_REQUEST')
    const current = this.drafts.snapshot(id)
    const expected = 'expectedRevision' in input ? input.expectedRevision : current.revision
    if (expected !== current.revision) throw new AttachmentFailure('DRAFT_CONFLICT')
    const ids: unknown = 'attachmentIds' in input ? input.attachmentIds : current.attachmentIds
    if (!Array.isArray(ids) || ids.some(item => typeof item !== 'string') || new Set(ids).size !== ids.length)
      throw new AttachmentFailure('INVALID_REQUEST')
    const selected: string[] = []
    for (const item of ids) {
      if (typeof item !== 'string' || !current.attachmentIds.includes(item))
        throw new AttachmentFailure('ATTACHMENT_NOT_FOUND')
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

  async upload(
    input: AttachmentUploadInput,
  ): Promise<{ readonly attachment: AttachmentView; readonly draft: ChatDraft }> {
    await this.chat(input.sessionId)
    if (this.drafts.snapshot(input.sessionId).attachmentIds.length >= this.limits.files)
      throw new AttachmentFailure('ATTACHMENT_COUNT_EXCEEDED')
    let received: AttachmentRecordView | undefined
    try {
      const item = await this.files.receive({ ...input, maxBytes: this.maxBytes })
      received = item
      await input.complete
      input.signal.throwIfAborted()
      if (!this.drafts.snapshot(input.sessionId).attachmentIds.includes(item.attachmentId))
        throw new AttachmentFailure('ATTACHMENT_CONFLICT')
      const abort = new AbortController()
      const work = this.prepare(input.sessionId, item.attachmentId, abort.signal)
      this.preparing.set(item.attachmentId, { abort, work })
      void work.finally(() => this.preparing.delete(item.attachmentId))
      return { attachment: attachmentView(item), draft: this.snapshot(input.sessionId) }
    } catch (error) {
      if (received) {
        try {
          if (this.store.attachments.get(input.sessionId, received.attachmentId).state === 'preparing') {
            this.store.attachments.reject(input.sessionId, received.attachmentId, 'UPLOAD_CANCELLED')
            this.drafts.touch(input.sessionId)
          }
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
      this.drafts.touch(id)
    } catch (error) {
      const code = signal.aborted ? 'UPLOAD_CANCELLED' : (knownCode(error) ?? 'ATTACHMENT_UNREADABLE')
      try {
        if (this.store.attachments.get(id, attachmentId).state === 'preparing') {
          this.store.attachments.reject(id, attachmentId, code)
          this.drafts.touch(id)
        }
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
      if (this.drafts.snapshot(id).revision !== expectedRevision) throw new AttachmentFailure('DRAFT_CONFLICT')
      await this.cancel(attachmentId)
      await this.files.remove(id, attachmentId, expectedRevision)
      return this.snapshot(id)
    } catch (error) {
      safeError(error)
    }
  }

  async preview(id: string, attachmentId: string, signal: AbortSignal): Promise<AttachmentPreview> {
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

  /** Runs the draft checks of one admission, saves through `admit`, then clears the exact submitted draft. */
  admitDraft<TInput extends DraftAdmitInput, TResult>(input: TInput, admit: (input: TInput) => TResult): TResult {
    const draft = this.drafts.snapshot(input.sessionId)
    if (input.draftRevision !== undefined && (input.draftRevision !== draft.revision || input.input !== draft.text))
      throw new AttachmentFailure('DRAFT_CONFLICT')
    if (draft.attachmentIds.length > this.limits.files) throw new AttachmentFailure('ATTACHMENT_COUNT_EXCEEDED')
    for (const id of draft.attachmentIds) {
      const item = this.store.attachments.get(input.sessionId, id)
      if (item.state !== 'ready')
        throw new AttachmentFailure(item.state === 'rejected' ? 'ATTACHMENT_REJECTED' : 'ATTACHMENT_NOT_READY')
    }
    const ids = input.attachmentIds ?? []
    if (ids.length !== draft.attachmentIds.length || ids.some(id => !draft.attachmentIds.includes(id)))
      throw new AttachmentFailure('DRAFT_CONFLICT')
    if (ids.length && input.draftRevision === undefined) throw new AttachmentFailure('DRAFT_CONFLICT')
    if (!input.input.trim() && !ids.length) throw new AttachmentFailure('REQUEST_EMPTY')
    const admitted = admit(input)
    if (input.draftRevision !== undefined) this.drafts.clear(input.sessionId, input.draftRevision)
    return admitted
  }

  async close(): Promise<void> {
    this.closed = true
    for (const item of this.preparing.values()) item.abort.abort()
    await this.parser.close()
    await Promise.allSettled([...this.preparing.values()].map(item => item.work))
  }
}
