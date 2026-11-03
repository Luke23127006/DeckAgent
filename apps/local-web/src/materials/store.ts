import { randomUUID, createHash } from 'node:crypto'
import type { Stats } from 'node:fs'
import { mkdir, open, rename, lstat, realpath, opendir } from 'node:fs/promises'
import { join, resolve, relative, isAbsolute, basename } from 'node:path'
import { readApprovedBytes } from '@deckagent/file-tools'
import { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { AgentRequest, MaterialInfo, MaterialLimits } from '@deckagent/host-api'
import { extractMaterial } from './parser.ts'
import type { Extraction } from './parser.ts'

/** Bytes never use client filenames as paths. Existing profile databases remain untouched. */
export class MaterialStore {
  private readonly shutdown = new AbortController()
  private readonly uploads = new Set<Promise<MaterialInfo>>()
  private closing: Promise<void> | undefined
  private constructor(
    private readonly db: DatabaseSync,
    private readonly root: string,
    readonly limits: MaterialLimits,
  ) {}
  static async create(profile: string, limits: MaterialLimits): Promise<MaterialStore> {
    if (
      !Number.isSafeInteger(limits.maxFileBytes) ||
      limits.maxFileBytes < 1 ||
      limits.maxFileBytes > 20 * 1024 * 1024 ||
      !Number.isSafeInteger(limits.maxAttachments) ||
      limits.maxAttachments < 1 ||
      limits.maxAttachments > 10
    )
      throw new Error('Explicit measured-candidate material limits required')
    const root = join(profile, 'materials')
    await mkdir(root, { recursive: true, mode: 0o700 })
    if ((await lstat(root)).isSymbolicLink()) throw new Error('Unsafe material storage')
    const db = new DatabaseSync(join(profile, 'materials.sqlite'))
    try {
      const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id)
      const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
      const fresh =
        owner === 0 &&
        version === 0 &&
        !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
      if (!fresh && (owner !== 0x44414d54 || version !== 1)) throw new Error('Unknown material schema')
      db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE')
      if (fresh)
        db.exec(`CREATE TABLE materials(id TEXT PRIMARY KEY, session_id TEXT NOT NULL, info TEXT NOT NULL, extraction TEXT, hash TEXT) STRICT;
        CREATE TABLE request_materials(request_id TEXT NOT NULL, session_id TEXT NOT NULL, material_id TEXT NOT NULL, info TEXT NOT NULL, PRIMARY KEY(request_id,material_id)) STRICT;
        CREATE TABLE material_references(id TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT;
        PRAGMA application_id=1145130324; PRAGMA user_version=1;`)
      db.exec(
        "UPDATE materials SET info=json_set(info,'$.status','rejected','$.reason','MATERIAL_UPLOAD_INTERRUPTED') WHERE json_extract(info,'$.status')='preparing'",
      )
      if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok') throw new Error('Material storage failed')
      db.exec('COMMIT')
      return new MaterialStore(db, root, { ...limits })
    } catch (error) {
      db.close()
      throw error
    }
  }
  list(sessionId: string): readonly MaterialInfo[] {
    return this.db
      .prepare('SELECT info FROM materials WHERE session_id=? ORDER BY rowid')
      .all(sessionId)
      .map(row => {
        const info: MaterialInfo = JSON.parse(String(row.info))
        return {
          ...info,
          sent: !!this.db.prepare('SELECT 1 FROM request_materials WHERE material_id=? LIMIT 1').get(info.materialId),
        }
      })
  }
  get(sessionId: string, id: string): MaterialInfo {
    const row = this.db.prepare('SELECT info FROM materials WHERE id=? AND session_id=?').get(id, sessionId)
    if (!row) throw new HttpError(404, 'MATERIAL_NOT_FOUND')
    return JSON.parse(String(row.info))
  }
  upload(
    sessionId: string,
    name: string,
    stream: AsyncIterable<Uint8Array>,
    signal: AbortSignal,
  ): Promise<MaterialInfo> {
    if (this.shutdown.signal.aborted) return Promise.reject(new HttpError(503, 'MATERIALS_CLOSED'))
    if (this.uploads.size >= 2) return Promise.reject(new HttpError(429, 'MATERIAL_UPLOAD_BUSY'))
    const work = this.doUpload(sessionId, name, stream, AbortSignal.any([signal, this.shutdown.signal]))
    this.uploads.add(work)
    void work.finally(() => this.uploads.delete(work)).catch(() => {})
    return work
  }
  private async doUpload(
    sessionId: string,
    name: string,
    stream: AsyncIterable<Uint8Array>,
    signal: AbortSignal,
  ): Promise<MaterialInfo> {
    if (!name || name.length > 255 || /[/\\]/u.test(name) || [...name].some(character => character.charCodeAt(0) < 32))
      throw new HttpError(400, 'MATERIAL_INVALID_NAME')
    const id = randomUUID(),
      staging = join(this.root, `${id}.upload`)
    let info: MaterialInfo = {
      materialId: id,
      sessionId,
      originalName: name,
      kind: 'attachment',
      status: 'preparing',
      mediaType: 'application/octet-stream',
      sizeBytes: 0,
      warnings: [],
    }
    this.db.prepare('INSERT INTO materials VALUES(?,?,?,NULL,NULL)').run(id, sessionId, JSON.stringify(info))
    let file: Awaited<ReturnType<typeof open>> | undefined
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      file = await open(staging, 'wx', 0o600)
      for await (const chunk of stream) {
        signal.throwIfAborted()
        size += chunk.length
        if (size > this.limits.maxFileBytes) throw new Error('MATERIAL_FILE_LIMIT')
        await file.writeFile(chunk)
        chunks.push(chunk)
      }
      await file.sync()
      await file.close()
      const bytes = Buffer.concat(chunks, size)
      const extraction = await extractMaterial(name, bytes, signal)
      signal.throwIfAborted()
      await rename(staging, join(this.root, id))
      info = {
        ...info,
        status: 'ready',
        sizeBytes: size,
        mediaType: extraction.mediaType,
        warnings: extraction.warnings,
      }
      this.db
        .prepare('UPDATE materials SET info=?,extraction=?,hash=? WHERE id=?')
        .run(JSON.stringify(info), JSON.stringify(extraction), createHash('sha256').update(bytes).digest('hex'), id)
    } catch (error) {
      info = {
        ...info,
        status: 'rejected',
        sizeBytes: size,
        reason:
          error instanceof Error && /^MATERIAL_[A-Z_]+$/.test(error.message)
            ? error.message
            : 'MATERIAL_STORAGE_FAILED',
      }
      this.db.prepare('UPDATE materials SET info=? WHERE id=?').run(JSON.stringify(info), id)
    } finally {
      if (file) await file.close().catch(() => {})
    }
    return info
  }
  remove(sessionId: string, id: string): void {
    this.get(sessionId, id)
    if (this.db.prepare('SELECT 1 FROM request_materials WHERE material_id=?').get(id))
      throw new HttpError(409, 'MATERIAL_ALREADY_SENT')
    // Unlink metadata only. Retain bytes until an explicit garbage collection policy exists.
    this.db.prepare('DELETE FROM materials WHERE id=? AND session_id=?').run(id, sessionId)
  }
  async reference(sessionId: string, value: unknown, source: SourceIdentity | undefined): Promise<MaterialInfo> {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('path' in value) ||
      typeof value.path !== 'string' ||
      Object.keys(value).length !== 1
    )
      throw new HttpError(400, 'MATERIAL_INVALID_REFERENCE')
    if (!source) throw new HttpError(409, 'MATERIAL_REFERENCE_WORKSPACE_REQUIRED')
    const path = this.relativePath(value.path)
    const target = join(source.sourceRoot, path)
    let stat: Stats
    try {
      await this.noAliases(source.sourceRoot, path)
      stat = await lstat(target)
    } catch {
      const info: MaterialInfo = {
        materialId: randomUUID(),
        sessionId,
        originalName: path,
        kind: 'reference',
        mediaType: 'application/octet-stream',
        sizeBytes: 0,
        status: 'rejected',
        reason: 'MATERIAL_REFERENCE_UNAVAILABLE',
        warnings: [],
      }
      this.db
        .prepare('INSERT INTO materials VALUES(?,?,?,NULL,NULL)')
        .run(info.materialId, sessionId, JSON.stringify(info))
      return info
    }
    if ((!stat.isFile() && !stat.isDirectory()) || (stat.isFile() && stat.nlink !== 1))
      throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    const materialId = randomUUID()
    const info: MaterialInfo = {
      materialId,
      sessionId,
      originalName: path,
      kind: 'reference',
      mediaType: stat.isDirectory() ? 'inode/directory' : 'application/octet-stream',
      sizeBytes: stat.size,
      status: 'ready',
      warnings: ['REFERENCE_REVALIDATED_ON_READ'],
    }
    this.db.exec('BEGIN IMMEDIATE')
    try {
      this.db.prepare('INSERT INTO materials VALUES(?,?,?,NULL,NULL)').run(materialId, sessionId, JSON.stringify(info))
      this.db
        .prepare('INSERT INTO material_references VALUES(?,?)')
        .run(
          materialId,
          JSON.stringify({ ...source, path, dev: stat.dev, ino: stat.ino, directory: stat.isDirectory() }),
        )
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
    return info
  }
  private relativePath(path: string): string {
    if (
      !path ||
      path.length > 2000 ||
      isAbsolute(path) ||
      path
        .split(/[/\\]/)
        .some(
          part =>
            !part ||
            part === '.' ||
            part === '..' ||
            /[<>:"|?*]/u.test(part) ||
            [...part].some(character => character.charCodeAt(0) < 32),
        )
    )
      throw new HttpError(400, 'MATERIAL_INVALID_REFERENCE')
    return path
  }
  private async noAliases(root: string, path: string): Promise<void> {
    let current = root
    if ((await realpath(root)) !== root) throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    for (const part of path.split(/[/\\]/)) {
      current = join(current, part)
      if ((await lstat(current)).isSymbolicLink()) throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    }
  }
  async validateReference(
    sessionId: string,
    id: string,
    source: SourceIdentity | undefined,
  ): Promise<ReferenceIdentity> {
    const info = this.get(sessionId, id)
    const row = this.db.prepare('SELECT payload FROM material_references WHERE id=?').get(id)
    if (info.kind !== 'reference' || !row || !source) throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    const ref: ReferenceIdentity = JSON.parse(String(row.payload))
    if (
      JSON.stringify(ref.sourceIdentity) !== JSON.stringify(source.sourceIdentity) ||
      ref.sourceRoot !== source.sourceRoot
    )
      throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    try {
      const root = await lstat(source.sourceRoot)
      if (!root.isDirectory() || root.dev !== ref.sourceIdentity.dev || root.ino !== ref.sourceIdentity.ino)
        throw new Error('Changed source root')
      await this.noAliases(source.sourceRoot, ref.path)
      const stat = await lstat(join(source.sourceRoot, ref.path))
      if (stat.dev !== ref.dev || stat.ino !== ref.ino || (stat.isFile() && stat.nlink !== 1))
        throw new Error('Changed reference')
    } catch {
      throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
    }
    return ref
  }
  capture(request: AgentRequest, requestId: string, commit = true): readonly MaterialInfo[] {
    const ids = request.attachmentIds ?? []
    if (new Set(ids).size !== ids.length) throw new HttpError(400, 'MATERIAL_COUNT_LIMIT')
    const current = ids.map(id => {
      const info = this.get(request.sessionId, id)
      if (info.kind !== 'attachment') throw new HttpError(400, 'MATERIAL_INVALID_REFERENCE')
      return info
    })
    const newCount = current.filter(
      info => !this.db.prepare('SELECT 1 FROM request_materials WHERE material_id=? LIMIT 1').get(info.materialId),
    ).length
    if (newCount > this.limits.maxAttachments) throw new HttpError(400, 'MATERIAL_COUNT_LIMIT')
    for (const id of request.referenceIds ?? []) {
      const info = this.get(request.sessionId, id)
      if (info.kind !== 'reference' || current.some(item => item.materialId === id))
        throw new HttpError(400, 'MATERIAL_INVALID_REFERENCE')
      current.push(info)
    }
    const previous = this.db
      .prepare('SELECT DISTINCT material_id FROM request_materials WHERE session_id=?')
      .all(request.sessionId)
      .map(row => this.get(request.sessionId, String(row.material_id)))
    const captured = [...new Map([...previous, ...current].map(info => [info.materialId, info])).values()]
    if (captured.some(info => info.status !== 'ready')) throw new HttpError(409, 'MATERIAL_NOT_READY')
    if (!commit) return captured
    this.db.exec('BEGIN IMMEDIATE')
    try {
      for (const info of captured)
        this.db
          .prepare('INSERT INTO request_materials VALUES(?,?,?,?)')
          .run(requestId, request.sessionId, info.materialId, JSON.stringify(info))
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
    return captured
  }
  async read(
    sessionId: string,
    requestId: string,
    id: string,
    signal: AbortSignal,
    context?: {
      readonly source: SourceIdentity | undefined
      readonly blockedRoots: readonly string[]
      readonly authorize: (path: string, signal: AbortSignal) => Promise<void>
      readonly path?: string
      readonly allowFolderListing?: boolean
    },
  ): Promise<Extraction> {
    if (
      !this.db
        .prepare('SELECT 1 FROM request_materials WHERE request_id=? AND session_id=? AND material_id=?')
        .get(requestId, sessionId, id)
    )
      throw new HttpError(404, 'MATERIAL_NOT_FOUND')
    if (this.get(sessionId, id).kind === 'reference') {
      if (!context) throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
      const ref = await this.validateReference(sessionId, id, context.source)
      if (ref.directory && !context.path) {
        if (!context.allowFolderListing)
          return {
            mediaType: 'inode/directory',
            text: '',
            warnings: ['NAME_AN_EXACT_FILE_FOR_APPROVAL; NO_FOLDER_GRANT_CREATED'],
          }
        const directory = await opendir(join(ref.sourceRoot, ref.path))
        const entries: string[] = []
        for await (const entry of directory) {
          signal.throwIfAborted()
          if (entries.length >= 100) throw new Error('MATERIAL_TEXT_LIMIT')
          if (!entry.isSymbolicLink() && (entry.isFile() || entry.isDirectory()))
            entries.push(`${entry.name}${entry.isDirectory() ? '/' : ''}`)
        }
        await this.validateReference(sessionId, id, context.source)
        return {
          mediaType: 'inode/directory',
          text: `Direct entries (names only):\n${entries.join('\n')}`,
          warnings: ['USE_READ_MATERIAL_PATH_FOR_AN_EXACT_CHILD_FILE; NOT_RECURSIVE; NO_CONTENT_READ'],
        }
      }
      if (
        !ref.directory &&
        context.path &&
        this.relativePath(context.path).split(/[/\\]/).join('/') !== ref.path.split(/[/\\]/).join('/')
      )
        throw new HttpError(400, 'MATERIAL_INVALID_REFERENCE')
      const target = ref.directory
        ? resolve(ref.sourceRoot, ref.path, this.relativePath(context.path!))
        : join(ref.sourceRoot, ref.path)
      if (isAbsolute(relative(ref.sourceRoot, target)) || relative(ref.sourceRoot, target).startsWith('..'))
        throw new HttpError(409, 'MATERIAL_REFERENCE_UNAVAILABLE')
      const bytes = await readApprovedBytes(
        target,
        signal,
        context.blockedRoots,
        async (path, control) => {
          await context.authorize(path, control)
          await this.validateReference(sessionId, id, context.source)
        },
        20 * 1024 * 1024, // Independent reference-read safety bound, not the attachment size policy.
      )
      return extractMaterial(basename(target), bytes, signal)
    }
    const row = this.db.prepare('SELECT extraction FROM materials WHERE id=? AND session_id=?').get(id, sessionId)
    if (!row?.extraction) throw new HttpError(409, 'MATERIAL_NOT_READY')
    return JSON.parse(String(row.extraction))
  }
  async imageBytes(
    sessionId: string,
    infos: readonly MaterialInfo[],
  ): Promise<readonly { readonly bytes: Uint8Array; readonly mediaType: 'image/png' | 'image/jpeg' }[]> {
    const images: { bytes: Uint8Array; mediaType: 'image/png' | 'image/jpeg' }[] = []
    for (const info of infos) {
      if (info.mediaType !== 'image/png' && info.mediaType !== 'image/jpeg') continue
      if (info.kind !== 'attachment') throw new HttpError(409, 'MATERIAL_IMAGE_INPUT_UNVERIFIED')
      this.get(sessionId, info.materialId)
      const path = join(this.root, info.materialId)
      const expected = await lstat(path)
      const file = await open(path, 'r')
      try {
        const stat = await file.stat()
        if (
          expected.isSymbolicLink() ||
          !stat.isFile() ||
          stat.nlink !== 1 ||
          stat.dev !== expected.dev ||
          stat.ino !== expected.ino ||
          stat.size > this.limits.maxFileBytes
        )
          throw new Error('Changed material')
        const bytes = await file.readFile()
        const hash = this.db
          .prepare('SELECT hash FROM materials WHERE id=? AND session_id=?')
          .get(info.materialId, sessionId)?.hash
        if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Changed material')
        images.push({ bytes, mediaType: info.mediaType })
      } finally {
        await file.close()
      }
    }
    return images
  }
  close(): Promise<void> {
    this.closing ??= (async () => {
      this.shutdown.abort()
      await Promise.allSettled([...this.uploads])
      this.db.close()
    })()
    return this.closing
  }
}

export interface SourceIdentity {
  readonly sourceRoot: string
  readonly sourceIdentity: { readonly dev: number; readonly ino: number }
}
interface ReferenceIdentity extends SourceIdentity {
  readonly path: string
  readonly dev: number
  readonly ino: number
  readonly directory: boolean
}
