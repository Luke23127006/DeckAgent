import { AttachmentError, attachmentErrorCode } from './attachments.errors.ts'
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { link, lstat, mkdir, open, readdir, realpath, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import type { MemoryDraftStore } from './draft.store.ts'

/** One saved attachment as the attachment log returns it. */
export interface AttachmentRecordView {
  readonly attachmentId: string
  readonly name: string
  readonly state: 'preparing' | 'ready' | 'rejected'
  readonly byteSize: number
  readonly detectedType?: string
  readonly rejectionCode?: string
  readonly fingerprint?: string
  readonly parsedFingerprint?: string
  readonly source?: {
    readonly sourceId: string
    readonly version: number
    readonly kind: 'attachment'
    readonly label: string
  }
  readonly preparation?: {
    readonly parserVersion: string
    readonly capabilities: readonly string[]
    readonly completeness: 'complete' | 'partial'
    readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
  }
}

/** The attachment rows of the session database. `AttachmentLog` implements it. */
export interface AttachmentLogPort {
  create(sessionId: string, name: string): AttachmentRecordView
  get(sessionId: string, attachmentId: string): AttachmentRecordView
  received(
    sessionId: string,
    attachmentId: string,
    value: { readonly byteSize: number; readonly fingerprint: string },
  ): void
  reject(sessionId: string, attachmentId: string, code: string): AttachmentRecordView
  removeUnsent(sessionId: string, attachmentId: string): void
  unsent(): readonly { readonly sessionId: string; readonly attachmentId: string }[]
  retainedIds(): readonly string[]
}

export interface AttachmentLocationData {
  readonly kind: 'lines' | 'page' | 'slide' | 'image'
  readonly start?: number
  readonly end?: number
  readonly page?: number
  readonly slide?: number
  readonly part?: string
  readonly entry?: string
}

export type AttachmentPartData =
  | { readonly type: 'text'; readonly text: string; readonly location: AttachmentLocationData }
  | {
      readonly type: 'image'
      readonly data: string
      readonly mimeType: 'image/png'
      readonly location: AttachmentLocationData
      readonly width: number
      readonly height: number
    }

/** Prepared attachment content as the attachment parser returns it. */
export interface ParsedAttachmentData {
  readonly mediaType: string
  readonly parserVersion: string
  readonly capabilities: readonly string[]
  readonly completeness: 'complete' | 'partial'
  readonly parts: readonly AttachmentPartData[]
  readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
}

export interface AttachmentUpload {
  readonly sessionId: string
  readonly name: string
  readonly expectedRevision: number
  readonly bytes: AsyncIterable<Uint8Array>
  /** Required technical bound supplied by admission; no product default is invented here. */
  readonly maxBytes: number
  readonly signal: AbortSignal
}

const fileId = /^att-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
type Extension = 'part' | 'bin' | 'parsed' | 'parsed-part'
const maxStoredBytes = 20 * 1024 * 1024
const parsedByteLimit = 96 * 1024 * 1024

/** The rejection codes that a failed upload may show; a Node `fs` code never becomes one. */
const storageDomainCodes = new Set([
  'INVALID_REQUEST',
  'SESSION_NOT_FOUND',
  'ATTACHMENT_NOT_FOUND',
  'DRAFT_CONFLICT',
  'ATTACHMENT_CONFLICT',
  'ATTACHMENT_NOT_READY',
  'UPLOAD_CANCELLED',
  'DRAFT_TOO_LARGE',
  'ATTACHMENT_TOO_LARGE',
  'PARSING_LIMIT_EXCEEDED',
  'ATTACHMENT_UNREADABLE',
  'ATTACHMENT_NOT_SAVED',
])

export function isParsedAttachmentData(value: unknown): value is ParsedAttachmentData {
  if (!value || typeof value !== 'object') return false
  if (
    !('mediaType' in value) ||
    typeof value.mediaType !== 'string' ||
    !('parserVersion' in value) ||
    typeof value.parserVersion !== 'string'
  )
    return false
  if (
    !('capabilities' in value) ||
    !Array.isArray(value.capabilities) ||
    !value.capabilities.every(item => typeof item === 'string')
  )
    return false
  if (!('completeness' in value) || !['complete', 'partial'].includes(String(value.completeness))) return false
  if (
    !('omitted' in value) ||
    !Array.isArray(value.omitted) ||
    !value.omitted.every(item => item && typeof item === 'object' && typeof item.code === 'string')
  )
    return false
  if (!('parts' in value) || !Array.isArray(value.parts)) return false

  return value.parts.every((part: unknown) => {
    if (
      !part ||
      typeof part !== 'object' ||
      !('location' in part) ||
      !part.location ||
      typeof part.location !== 'object' ||
      !('kind' in part.location)
    )
      return false
    if (!['lines', 'page', 'slide', 'image'].includes(String(part.location.kind)) || !('type' in part)) return false
    return part.type === 'text'
      ? 'text' in part && typeof part.text === 'string'
      : part.type === 'image' &&
          'data' in part &&
          typeof part.data === 'string' &&
          'mimeType' in part &&
          part.mimeType === 'image/png' &&
          'width' in part &&
          typeof part.width === 'number' &&
          'height' in part &&
          typeof part.height === 'number'
  })
}

function nextChunk(iterator: AsyncIterator<Uint8Array>, signal: AbortSignal): Promise<IteratorResult<Uint8Array>> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      signal.removeEventListener('abort', abort)
      reject(signal.reason)
      return
    }
    Promise.resolve()
      .then(() => iterator.next())
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
}

function rejectionCode(error: unknown) {
  if (error instanceof AttachmentError) return error.code
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string')
    return storageDomainCodes.has(error.code) ? attachmentErrorCode(error.code) : undefined
  return undefined
}

/** Managed bytes only. File preparation and HTTP admission belong to their later owners. */
export class AttachmentFileStore {
  private readonly uploads = new Map<string, { readonly abort: AbortController; readonly done: Promise<void> }>()

  private constructor(
    private readonly root: string,
    private readonly log: AttachmentLogPort,
    private readonly drafts: MemoryDraftStore,
  ) {}

  /** Call once at Host startup, before any request or upload. Unsent drafts do not survive Host restart. */
  static async open(filesRoot: string, log: AttachmentLogPort, drafts: MemoryDraftStore): Promise<AttachmentFileStore> {
    try {
      await mkdir(filesRoot, { recursive: true })
      const parent = await realpath(filesRoot)
      const root = join(parent, 'attachments')
      await mkdir(root, { recursive: true })
      if ((await lstat(root)).isSymbolicLink() || (await realpath(root)) !== root)
        throw new AttachmentError('ATTACHMENT_NOT_SAVED', 'Managed attachment storage is unavailable')
      const files = new AttachmentFileStore(root, log, drafts)
      await files.recover()
      return files
    } catch (error) {
      if (error instanceof AttachmentError) throw error
      throw new AttachmentError(
        'ATTACHMENT_NOT_SAVED',
        'Cannot open attachment storage. Check the data folder permissions',
      )
    }
  }

  async receive(input: AttachmentUpload): Promise<AttachmentRecordView> {
    input.signal.throwIfAborted()
    if (!Number.isSafeInteger(input.maxBytes) || input.maxBytes < 0)
      throw new AttachmentError('INVALID_REQUEST', 'A finite attachment byte limit is required')

    const draft = this.drafts.snapshot(input.sessionId)
    if (draft.revision !== input.expectedRevision)
      throw new AttachmentError('DRAFT_CONFLICT', 'Reload the draft before adding a file')

    const item = this.log.create(input.sessionId, input.name)

    try {
      this.drafts.save(
        input.sessionId,
        { text: draft.text, attachmentIds: [...draft.attachmentIds, item.attachmentId] },
        draft.revision,
      )
    } catch (error) {
      this.log.removeUnsent(input.sessionId, item.attachmentId)
      throw error
    }

    const abort = new AbortController()
    const signal = AbortSignal.any([input.signal, abort.signal])
    let settle = () => {}
    const done = new Promise<void>(resolve => {
      settle = resolve
    })
    this.uploads.set(item.attachmentId, { abort, done })

    try {
      await this.checkRoot()
      const stage = this.path(item.attachmentId, 'part')
      const iterator = input.bytes[Symbol.asyncIterator]()
      const file = await open(stage, 'wx', 0o600)
      const hash = createHash('sha256')
      let byteSize = 0
      try {
        while (true) {
          const chunk = await nextChunk(iterator, signal)
          if (chunk.done) break
          const bytes = chunk.value
          signal.throwIfAborted()
          if (!(bytes instanceof Uint8Array)) throw new AttachmentError('INVALID_REQUEST', 'Upload must contain bytes')
          byteSize += bytes.byteLength
          if (!Number.isSafeInteger(byteSize) || byteSize > input.maxBytes)
            throw new AttachmentError('ATTACHMENT_TOO_LARGE', 'The file exceeds the configured byte limit')
          await file.writeFile(bytes, { signal })
          hash.update(bytes)
        }
        await file.sync()
      } finally {
        // A producer waiting forever must not delay cancellation or keep the managed file open.
        void Promise.resolve()
          .then(() => iterator.return?.())
          .catch(() => {})
        await file.close()
      }
      signal.throwIfAborted()
      await this.checkRoot()
      // Exclusive publication: never overwrite an existing managed object, including a symlink.
      await link(stage, this.path(item.attachmentId, 'bin'))
      await unlink(stage)
      signal.throwIfAborted()
      this.log.received(input.sessionId, item.attachmentId, { byteSize, fingerprint: hash.digest('hex') })
      return this.log.get(input.sessionId, item.attachmentId)
    } catch (error) {
      // Keep a visible rejection in the current draft. Recovery retries any failed file cleanup.
      await this.erase(item.attachmentId).catch(() => {})
      const code = signal.aborted ? 'UPLOAD_CANCELLED' : (rejectionCode(error) ?? 'ATTACHMENT_NOT_SAVED')
      this.log.reject(input.sessionId, item.attachmentId, code)
      this.drafts.touch(input.sessionId)
      throw new AttachmentError(code, 'The attachment was not saved. Remove it from the draft and try again')
    } finally {
      this.uploads.delete(item.attachmentId)
      settle()
    }
  }

  async read(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<Buffer> {
    signal.throwIfAborted()
    const item = this.log.get(sessionId, attachmentId)
    if (!item.fingerprint || item.state === 'rejected')
      throw new AttachmentError('ATTACHMENT_UNREADABLE', 'Attachment bytes are unavailable')
    return this.readStored(attachmentId, 'bin', item.fingerprint, maxStoredBytes, signal, item.byteSize)
  }

  async savePrepared(
    sessionId: string,
    attachmentId: string,
    value: ParsedAttachmentData,
    signal: AbortSignal,
  ): Promise<string> {
    const item = this.log.get(sessionId, attachmentId)
    if (item.state !== 'preparing' || !item.fingerprint || !isParsedAttachmentData(value))
      throw new AttachmentError('ATTACHMENT_NOT_READY', 'Preparation is no longer pending')

    await this.read(sessionId, attachmentId, signal)
    const bytes = Buffer.from(JSON.stringify(value))
    if (bytes.length > parsedByteLimit)
      throw new AttachmentError('PARSING_LIMIT_EXCEEDED', 'Prepared content exceeds its storage budget')

    await this.checkRoot()
    signal.throwIfAborted()

    const stage = this.path(attachmentId, 'parsed-part')
    const file = await open(stage, 'wx', 0o600)

    try {
      await file.writeFile(bytes, { signal })
      await file.sync()
    } finally {
      await file.close()
    }

    signal.throwIfAborted()

    await this.checkRoot()
    await link(stage, this.path(attachmentId, 'parsed'))
    await unlink(stage)
    signal.throwIfAborted()

    return createHash('sha256').update(bytes).digest('hex')
  }

  async prepared(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<ParsedAttachmentData> {
    const item = this.log.get(sessionId, attachmentId)
    if (item.state !== 'ready' || !item.parsedFingerprint || !item.preparation)
      throw new AttachmentError('ATTACHMENT_UNREADABLE', 'No saved preparation is available')

    await this.read(sessionId, attachmentId, signal)
    const bytes = await this.readStored(attachmentId, 'parsed', item.parsedFingerprint, parsedByteLimit, signal)
    let value: unknown

    try {
      value = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw new AttachmentError('ATTACHMENT_UNREADABLE', 'Saved preparation cannot be read')
    }

    if (
      !isParsedAttachmentData(value) ||
      value.parserVersion !== item.preparation.parserVersion ||
      value.mediaType !== item.detectedType
    )
      throw new AttachmentError('ATTACHMENT_UNREADABLE', 'Saved preparation does not match its receipt')

    return value
  }

  private async readStored(
    attachmentId: string,
    extension: Extension,
    fingerprint: string,
    limit: number,
    signal: AbortSignal,
    expectedSize?: number,
  ): Promise<Buffer> {
    try {
      await this.checkRoot()
      const path = this.path(attachmentId, extension)
      const before = await lstat(path)
      if (
        !before.isFile() ||
        before.isSymbolicLink() ||
        before.nlink !== 1 ||
        before.size > limit ||
        (expectedSize !== undefined && before.size !== expectedSize)
      )
        throw new Error('Invalid managed file')
      const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
      try {
        const current = await file.stat()
        if (
          current.dev !== before.dev ||
          current.ino !== before.ino ||
          current.nlink !== 1 ||
          current.size !== before.size
        )
          throw new Error('Managed file changed')
        const bytes = Buffer.alloc(before.size)
        let offset = 0
        while (offset < bytes.length) {
          signal.throwIfAborted()
          const result = await file.read(bytes, offset, bytes.length - offset, offset)
          if (!result.bytesRead) throw new Error('Truncated managed file')
          offset += result.bytesRead
        }
        signal.throwIfAborted()
        if (
          (await file.stat()).size !== before.size ||
          createHash('sha256').update(bytes).digest('hex') !== fingerprint
        )
          throw new Error('Managed content changed')
        return bytes
      } finally {
        await file.close()
      }
    } catch (error) {
      if (signal.aborted) signal.throwIfAborted()
      if (error instanceof AttachmentError) throw error
      throw new AttachmentError(
        'ATTACHMENT_UNREADABLE',
        'The saved attachment is missing or changed. Keep the data and provide the file again',
      )
    }
  }

  async remove(sessionId: string, attachmentId: string, expectedRevision: number): Promise<void> {
    this.log.get(sessionId, attachmentId)
    if (this.drafts.snapshot(sessionId).revision !== expectedRevision)
      throw new AttachmentError('DRAFT_CONFLICT', 'Reload the draft before removing a file')

    const upload = this.uploads.get(attachmentId)
    if (upload) {
      upload.abort.abort()
      await upload.done
    }

    const draft = this.drafts.snapshot(sessionId)
    if (draft.revision !== expectedRevision)
      throw new AttachmentError('DRAFT_CONFLICT', 'Reload the draft before removing a file')
    if (!draft.attachmentIds.includes(attachmentId))
      throw new AttachmentError('ATTACHMENT_CONFLICT', 'The file is not in this draft')

    // Remove the database reference first. A failed unlink leaves only a recoverable orphan.
    this.log.removeUnsent(sessionId, attachmentId)

    this.drafts.save(
      sessionId,
      { text: draft.text, attachmentIds: draft.attachmentIds.filter(id => id !== attachmentId) },
      draft.revision,
    )

    await this.erase(attachmentId)
  }

  /** A conditional draft save already removed membership; historical objects still refuse deletion. */
  async discardUnsent(sessionId: string, attachmentId: string): Promise<void> {
    if (this.drafts.snapshot(sessionId).attachmentIds.includes(attachmentId))
      throw new AttachmentError('ATTACHMENT_CONFLICT', 'Remove draft membership first')
    this.log.removeUnsent(sessionId, attachmentId)
    await this.erase(attachmentId)
  }

  private path(id: string, extension: Extension): string {
    if (!fileId.test(id)) throw new AttachmentError('ATTACHMENT_NOT_FOUND', 'Attachment is unavailable')
    return join(this.root, `${id}.${extension}`)
  }

  private async checkRoot(): Promise<void> {
    const stat = await lstat(this.root)
    if (!stat.isDirectory() || stat.isSymbolicLink() || (await realpath(this.root)) !== this.root)
      throw new AttachmentError(
        'ATTACHMENT_NOT_SAVED',
        'Managed attachment storage changed. Restart with a safe data folder',
      )
  }

  private async erase(id: string): Promise<void> {
    await this.checkRoot()
    for (const extension of ['part', 'bin', 'parsed', 'parsed-part'] as const) {
      await unlink(this.path(id, extension)).catch(error => {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
      })
    }
  }

  private async recover(): Promise<void> {
    await this.checkRoot()
    for (const item of this.log.unsent()) {
      await this.erase(item.attachmentId)
      this.log.removeUnsent(item.sessionId, item.attachmentId)
    }
    const retained = new Set(this.log.retainedIds())
    for (const name of await readdir(this.root)) {
      const match = /^(att-[a-f0-9-]{36})\.(part|bin|parsed|parsed-part)$/.exec(name)
      const id = match?.[1]
      if (match && id && fileId.test(id) && (!retained.has(id) || match[2] === 'part' || match[2] === 'parsed-part')) {
        await this.checkRoot()
        await unlink(join(this.root, name))
      }
    }
  }
}
