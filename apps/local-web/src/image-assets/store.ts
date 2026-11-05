import { randomUUID, createHash } from 'node:crypto'
import { mkdir, lstat, realpath, writeFile, rename, unlink, open } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { ImageAsset } from '@deckagent/deck'
import { extractMaterial } from '../materials/parser.ts'
import { fetchPublicImage } from './network.ts'
export type ImageFetcher = typeof fetchPublicImage
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

/** Immutable Chat assets; never a path supplied by a model or project folder. */
export class ImageAssetStore {
  private readonly shutdown = new AbortController()
  private readonly tasks = new Set<Promise<ImageAsset>>()
  private closed = false
  private constructor(
    private readonly db: DatabaseSync,
    private readonly root: string,
    private readonly fetchImage: ImageFetcher,
    readonly importEnabled: boolean,
  ) {}
  static async create(
    profile: string,
    options: { readonly fetchImage?: ImageFetcher; readonly enabled?: boolean } = {},
  ): Promise<ImageAssetStore> {
    const root = join(profile, 'image-assets')
    await mkdir(root, { recursive: true, mode: 0o700 })
    if ((await lstat(root)).isSymbolicLink() || (await realpath(root)) !== resolve(root))
      throw new Error('IMAGE_STORAGE')
    const db = new DatabaseSync(join(profile, 'assets.sqlite'))
    try {
      const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id),
        version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
      const fresh =
        owner === 0 &&
        version === 0 &&
        !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
      if (!fresh && (owner !== 0x4441494d || version !== 1)) throw new Error('IMAGE_SCHEMA')
      db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE')
      if (fresh)
        db.exec(
          'CREATE TABLE image_assets(id TEXT PRIMARY KEY,session_id TEXT NOT NULL,info TEXT NOT NULL) STRICT; PRAGMA application_id=1145129293; PRAGMA user_version=1;',
        )
      if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok') throw new Error('IMAGE_STORAGE')
      db.prepare('SELECT id,session_id,info FROM image_assets LIMIT 0').all()
      db.exec('COMMIT')
      return new ImageAssetStore(db, root, options.fetchImage ?? fetchPublicImage, options.enabled !== false)
    } catch (error) {
      db.close()
      throw error
    }
  }
  list(id: string): readonly ImageAsset[] {
    return this.db
      .prepare('SELECT id FROM image_assets WHERE session_id=? ORDER BY rowid')
      .all(id)
      .map(row => this.get(id, String(row.id)))
  }
  has(id: string, assetId: string): boolean {
    return !!this.db.prepare('SELECT 1 FROM image_assets WHERE session_id=? AND id=?').get(id, assetId)
  }
  get(id: string, assetId: string): ImageAsset {
    const row = this.db.prepare('SELECT info FROM image_assets WHERE session_id=? AND id=?').get(id, assetId)
    if (!row) throw new HttpError(404, 'IMAGE_UNAVAILABLE')
    const value: unknown = JSON.parse(String(row.info))
    if (
      !value ||
      typeof value !== 'object' ||
      !('assetId' in value) ||
      value.assetId !== assetId ||
      !('sessionId' in value) ||
      value.sessionId !== id ||
      !('mediaType' in value) ||
      !['image/png', 'image/jpeg'].includes(String(value.mediaType)) ||
      !('sizeBytes' in value) ||
      typeof value.sizeBytes !== 'number' ||
      value.sizeBytes < 1 ||
      value.sizeBytes > 5242880 ||
      !('width' in value) ||
      typeof value.width !== 'number' ||
      !('height' in value) ||
      typeof value.height !== 'number' ||
      !('sha256' in value) ||
      typeof value.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.sha256) ||
      !('sourceUrl' in value) ||
      typeof value.sourceUrl !== 'string' ||
      !('finalUrl' in value) ||
      typeof value.finalUrl !== 'string'
    )
      throw new HttpError(409, 'IMAGE_UNAVAILABLE')
    return {
      assetId,
      sessionId: id,
      mediaType: value.mediaType === 'image/png' ? 'image/png' : 'image/jpeg',
      sizeBytes: value.sizeBytes,
      width: value.width,
      height: value.height,
      sha256: value.sha256,
      sourceUrl: value.sourceUrl,
      finalUrl: value.finalUrl,
    }
  }
  import(id: string, value: unknown, signal: AbortSignal): Promise<ImageAsset> {
    if (!this.importEnabled) throw new HttpError(409, 'IMAGE_IMPORT_DISABLED')
    if (this.closed || this.tasks.size >= 2) throw new HttpError(429, 'IMAGE_BUSY')
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      Object.keys(value).length !== 1 ||
      !('url' in value) ||
      typeof value.url !== 'string'
    )
      throw new HttpError(400, 'INVALID_REQUEST')
    const combined = AbortSignal.any([signal, this.shutdown.signal, AbortSignal.timeout(20000)])
    const work = this.acquire(id, value.url, combined)
    this.tasks.add(work)
    void work.then(
      () => this.tasks.delete(work),
      () => this.tasks.delete(work),
    )
    return work
  }
  private async acquire(id: string, url: string, signal: AbortSignal): Promise<ImageAsset> {
    const assetId = randomUUID(),
      tmp = join(this.root, `${assetId}.tmp`),
      path = join(this.root, assetId)
    let committed = false
    try {
      if (this.list(id).length >= 20) throw new HttpError(413, 'IMAGE_LIMIT')
      const image = await this.fetchImage(url, signal)
      const parsed = await extractMaterial(image.mime === 'image/png' ? 'asset.png' : 'asset.jpg', image.bytes, signal)
      if (!parsed.imageSize || parsed.mediaType !== image.mime) throw new HttpError(422, 'IMAGE_FORMAT')
      signal.throwIfAborted()
      const info: ImageAsset = {
        assetId,
        sessionId: id,
        mediaType: image.mime,
        sizeBytes: image.bytes.length,
        width: parsed.imageSize.width,
        height: parsed.imageSize.height,
        sha256: hash(image.bytes),
        sourceUrl: image.sourceUrl,
        finalUrl: image.finalUrl,
      }
      await writeFile(tmp, image.bytes, { flag: 'wx', mode: 0o600 })
      signal.throwIfAborted()
      await rename(tmp, path)
      signal.throwIfAborted()
      this.db.exec('BEGIN IMMEDIATE')
      try {
        if (this.list(id).length >= 20) throw new HttpError(413, 'IMAGE_LIMIT')
        this.db.prepare('INSERT INTO image_assets VALUES(?,?,?)').run(assetId, id, JSON.stringify(info))
        signal.throwIfAborted()
        this.db.exec('COMMIT')
        committed = true
      } catch (error) {
        this.db.exec('ROLLBACK')
        throw error
      }
      return info
    } catch (error) {
      if (signal.aborted) throw signal.reason
      if (error instanceof HttpError) throw error
      throw new HttpError(422, 'IMAGE_FORMAT')
    } finally {
      await this.cleanup(committed ? [tmp] : [tmp, path])
    }
  }
  private async cleanup(files: readonly string[]): Promise<void> {
    for (const file of files) {
      if (dirname(file) !== this.root) throw new Error('IMAGE_STORAGE')
      await unlink(file).catch(error => {
        if (error.code !== 'ENOENT') throw error
      })
    }
  }
  async dataUrl(id: string, assetId: string): Promise<string> {
    const info = this.get(id, assetId),
      path = join(this.root, assetId)
    if (!/^[a-f0-9-]{36}$/.test(assetId)) throw new HttpError(404, 'IMAGE_UNAVAILABLE')
    try {
      const stat = await lstat(path)
      if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1 || stat.size !== info.sizeBytes)
        throw new Error('changed')
      const file = await open(path, 'r')
      try {
        const before = await file.stat()
        if (before.dev !== stat.dev || before.ino !== stat.ino) throw new Error('changed')
        const bytes = await file.readFile()
        const after = await file.stat()
        if (
          after.mtimeMs !== before.mtimeMs ||
          after.size !== info.sizeBytes ||
          after.nlink !== 1 ||
          hash(bytes) !== info.sha256
        )
          throw new Error('changed')
        return `data:${info.mediaType};base64,${bytes.toString('base64')}`
      } finally {
        await file.close()
      }
    } catch {
      throw new HttpError(409, 'IMAGE_UNAVAILABLE')
    }
  }
  async close() {
    if (this.closed) return
    this.closed = true
    this.shutdown.abort()
    await Promise.allSettled([...this.tasks])
    this.db.close()
  }
}
