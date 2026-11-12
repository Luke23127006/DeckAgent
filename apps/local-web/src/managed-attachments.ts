import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { link, lstat, mkdir, open, readdir, realpath, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { SessionError } from '@deckagent/session-persistence'
import type { AttachmentLog, AttachmentRecord, MemoryDraftStore } from '@deckagent/session-persistence'

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

/** Managed bytes only. File preparation and HTTP admission belong to their later owners. */
export class ManagedAttachments {
  private readonly uploads = new Map<string, { readonly abort: AbortController; readonly done: Promise<void> }>()
  private constructor(
    private readonly root: string,
    private readonly log: AttachmentLog,
    private readonly drafts: MemoryDraftStore,
  ) {}

  /** Call once at Host startup, before any request or upload. Unsent drafts do not survive Host restart. */
  static async open(filesRoot: string, log: AttachmentLog, drafts: MemoryDraftStore): Promise<ManagedAttachments> {
    try {
      await mkdir(filesRoot, { recursive: true })
      const parent = await realpath(filesRoot)
      const root = join(parent, 'attachments')
      await mkdir(root, { recursive: true })
      if ((await lstat(root)).isSymbolicLink() || (await realpath(root)) !== root)
        throw new SessionError('ATTACHMENT_NOT_SAVED', 'Managed attachment storage is unavailable')
      const files = new ManagedAttachments(root, log, drafts)
      await files.recover()
      return files
    } catch (error) {
      if (error instanceof SessionError) throw error
      throw new SessionError(
        'ATTACHMENT_NOT_SAVED',
        'Cannot open attachment storage. Check the data folder permissions',
      )
    }
  }

  async receive(input: AttachmentUpload): Promise<AttachmentRecord> {
    input.signal.throwIfAborted()
    if (!Number.isSafeInteger(input.maxBytes) || input.maxBytes < 0)
      throw new SessionError('INVALID_REQUEST', 'A finite attachment byte limit is required')
    const draft = this.drafts.snapshot(input.sessionId)
    if (draft.revision !== input.expectedRevision)
      throw new SessionError('DRAFT_CONFLICT', 'Reload the draft before adding a file')
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
          if (!(bytes instanceof Uint8Array)) throw new SessionError('INVALID_REQUEST', 'Upload must contain bytes')
          byteSize += bytes.byteLength
          if (!Number.isSafeInteger(byteSize) || byteSize > input.maxBytes)
            throw new SessionError('ATTACHMENT_TOO_LARGE', 'The file exceeds the configured byte limit')
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
      const code = signal.aborted
        ? 'UPLOAD_CANCELLED'
        : error instanceof SessionError
          ? error.code
          : 'ATTACHMENT_NOT_SAVED'
      this.log.reject(input.sessionId, item.attachmentId, code)
      throw new SessionError(code, 'The attachment was not saved. Remove it from the draft and try again')
    } finally {
      this.uploads.delete(item.attachmentId)
      settle()
    }
  }

  async read(sessionId: string, attachmentId: string, signal: AbortSignal): Promise<Buffer> {
    signal.throwIfAborted()
    const item = this.log.get(sessionId, attachmentId)
    if (!item.fingerprint || item.state === 'rejected')
      throw new SessionError('ATTACHMENT_UNREADABLE', 'Attachment bytes are unavailable')
    try {
      await this.checkRoot()
      const path = this.path(attachmentId, 'bin')
      const before = await lstat(path)
      if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.size !== item.byteSize)
        throw new Error('Invalid managed file')
      const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
      try {
        const current = await file.stat()
        if (
          current.dev !== before.dev ||
          current.ino !== before.ino ||
          current.nlink !== 1 ||
          current.size !== item.byteSize
        )
          throw new Error('Managed file changed')
        const bytes = Buffer.alloc(item.byteSize)
        let offset = 0
        while (offset < bytes.length) {
          signal.throwIfAborted()
          const result = await file.read(bytes, offset, bytes.length - offset, offset)
          if (!result.bytesRead) throw new Error('Truncated managed file')
          offset += result.bytesRead
        }
        signal.throwIfAborted()
        if (
          (await file.stat()).size !== item.byteSize ||
          createHash('sha256').update(bytes).digest('hex') !== item.fingerprint
        )
          throw new Error('Managed content changed')
        return bytes
      } finally {
        await file.close()
      }
    } catch (error) {
      if (signal.aborted) signal.throwIfAborted()
      if (error instanceof SessionError) throw error
      throw new SessionError(
        'ATTACHMENT_UNREADABLE',
        'The saved attachment is missing or changed. Keep the data and provide the file again',
      )
    }
  }

  async remove(sessionId: string, attachmentId: string, expectedRevision: number): Promise<void> {
    this.log.get(sessionId, attachmentId)
    if (this.drafts.snapshot(sessionId).revision !== expectedRevision)
      throw new SessionError('DRAFT_CONFLICT', 'Reload the draft before removing a file')
    const upload = this.uploads.get(attachmentId)
    if (upload) {
      upload.abort.abort()
      await upload.done
    }
    const draft = this.drafts.snapshot(sessionId)
    if (draft.revision !== expectedRevision)
      throw new SessionError('DRAFT_CONFLICT', 'Reload the draft before removing a file')
    if (!draft.attachmentIds.includes(attachmentId))
      throw new SessionError('ATTACHMENT_CONFLICT', 'The file is not in this draft')
    // Remove the database reference first. A failed unlink leaves only a recoverable orphan.
    this.log.removeUnsent(sessionId, attachmentId)
    this.drafts.save(
      sessionId,
      { text: draft.text, attachmentIds: draft.attachmentIds.filter(id => id !== attachmentId) },
      draft.revision,
    )
    await this.erase(attachmentId)
  }

  private path(id: string, extension: 'part' | 'bin'): string {
    if (!fileId.test(id)) throw new SessionError('ATTACHMENT_NOT_FOUND', 'Attachment is unavailable')
    return join(this.root, `${id}.${extension}`)
  }

  private async checkRoot(): Promise<void> {
    const stat = await lstat(this.root)
    if (!stat.isDirectory() || stat.isSymbolicLink() || (await realpath(this.root)) !== this.root)
      throw new SessionError(
        'ATTACHMENT_NOT_SAVED',
        'Managed attachment storage changed. Restart with a safe data folder',
      )
  }

  private async erase(id: string): Promise<void> {
    await this.checkRoot()
    for (const extension of ['part', 'bin'] as const) {
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
      const match = /^(att-[a-f0-9-]{36})\.(part|bin)$/.exec(name)
      if (match && fileId.test(match[1]!) && (!retained.has(match[1]!) || match[2] === 'part')) {
        await this.checkRoot()
        await unlink(join(this.root, name))
      }
    }
  }
}
