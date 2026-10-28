import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export interface LegacyImportOptions {
  /** Explicit stopped V1 profile. No disk discovery or automatic import. */
  readonly source: string
  /** A new application profile; an existing directory is never replaced. */
  readonly target: string
}

export interface LegacyImportResult {
  readonly backup: string
  readonly imported: boolean
}

export class LegacyImportError extends Error {
  constructor(
    readonly code: string,
    readonly backup?: string,
  ) {
    super(
      'Legacy import failed. Stop all writers, keep the original profile and backup, and retry with a new target directory.',
    )
  }
}

interface Entry {
  readonly path: string
  readonly directory: boolean
  readonly size: number
  readonly hash?: string
}

const markerName = '.legacy-import.json'

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

async function scan(root: string): Promise<readonly Entry[]> {
  const entries: Entry[] = []
  async function walk(path: string) {
    const info = await lstat(join(root, path))
    if (info.isSymbolicLink() || (!info.isDirectory() && !info.isFile()) || (info.isFile() && info.nlink !== 1))
      throw new LegacyImportError('LEGACY_UNSAFE_FILE')
    if (info.isDirectory()) {
      if (path) entries.push({ path, directory: true, size: 0 })
      for (const name of (await readdir(join(root, path))).sort()) await walk(join(path, name))
    } else {
      // A live or unclean SQLite profile must be closed/recovered by its original app first.
      if (/\.sqlite-(wal|shm|journal)$/.test(path)) throw new LegacyImportError('LEGACY_PROFILE_ACTIVE')
      const handle = await open(join(root, path), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
      try {
        const opened = await handle.stat()
        if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== info.dev || opened.ino !== info.ino)
          throw new LegacyImportError('LEGACY_SOURCE_CHANGED')
        const hash = createHash('sha256')
        const buffer = Buffer.alloc(64 * 1024)
        for (;;) {
          const { bytesRead } = await handle.read(buffer)
          if (!bytesRead) break
          hash.update(buffer.subarray(0, bytesRead))
        }
        const after = await handle.stat()
        if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs)
          throw new LegacyImportError('LEGACY_SOURCE_CHANGED')
        entries.push({ path, directory: false, size: opened.size, hash: hash.digest('hex') })
      } finally {
        await handle.close()
      }
    }
  }
  await walk('')
  return entries
}

async function copy(root: string, target: string, entries: readonly Entry[]): Promise<void> {
  for (const entry of entries) {
    const destination = join(target, entry.path)
    if (entry.directory) {
      await mkdir(destination, { mode: 0o700 })
      continue
    }
    const source = await open(join(root, entry.path), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    try {
      const info = await source.stat()
      if (!info.isFile() || info.nlink !== 1) throw new LegacyImportError('LEGACY_UNSAFE_FILE')
      const output = await open(destination, 'wx', 0o600)
      try {
        const hash = createHash('sha256')
        const buffer = Buffer.alloc(64 * 1024)
        let size = 0
        for (;;) {
          const { bytesRead } = await source.read(buffer)
          if (!bytesRead) break
          const chunk = buffer.subarray(0, bytesRead)
          hash.update(chunk)
          size += bytesRead
          let offset = 0
          while (offset < bytesRead) offset += (await output.write(chunk, offset)).bytesWritten
        }
        if (size !== entry.size || hash.digest('hex') !== entry.hash)
          throw new LegacyImportError('LEGACY_SOURCE_CHANGED')
        await output.sync()
      } finally {
        await output.close()
      }
    } finally {
      await source.close()
    }
  }
}

function validateDatabase(path: string, owner: number, versions: readonly number[]): void {
  let db: DatabaseSync | undefined
  try {
    db = new DatabaseSync(path, { readOnly: true })
    if (
      Number(db.prepare('PRAGMA application_id').get()!.application_id) !== owner ||
      !versions.includes(Number(db.prepare('PRAGMA user_version').get()!.user_version)) ||
      db.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok' ||
      db.prepare('PRAGMA foreign_key_check').get()
    )
      throw new LegacyImportError('LEGACY_DATABASE_INVALID')
  } catch {
    throw new LegacyImportError('LEGACY_DATABASE_INVALID')
  } finally {
    db?.close()
  }
}

/** Offline, non-destructive import. A failed stage leaves its backup and original available for recovery. */
export async function importLegacyProfile(options: LegacyImportOptions): Promise<LegacyImportResult> {
  let backup: string | undefined
  let stage: string | undefined
  try {
    if (!options.source.trim() || !options.target.trim()) throw new LegacyImportError('LEGACY_PATH_INVALID')
    const sourceInfo = await lstat(resolve(options.source))
    if (!sourceInfo.isDirectory() || sourceInfo.isSymbolicLink()) throw new LegacyImportError('LEGACY_PATH_INVALID')
    const source = await realpath(resolve(options.source))
    const requested = resolve(options.target)
    if (contains(source, requested) || contains(requested, source)) throw new LegacyImportError('LEGACY_PATH_OVERLAP')
    await mkdir(dirname(requested), { recursive: true, mode: 0o700 })
    const target = join(await realpath(dirname(requested)), basename(requested))
    if (contains(source, target) || contains(target, source)) throw new LegacyImportError('LEGACY_PATH_OVERLAP')
    if (await exists(target)) {
      if ((await lstat(target)).isSymbolicLink()) throw new LegacyImportError('LEGACY_TARGET_EXISTS')
      try {
        const value: unknown = JSON.parse(await readFile(join(target, markerName), 'utf8'))
        if (
          value &&
          typeof value === 'object' &&
          'version' in value &&
          value.version === 1 &&
          'source' in value &&
          value.source === source &&
          'backup' in value &&
          typeof value.backup === 'string' &&
          dirname(value.backup) === dirname(target) &&
          basename(value.backup).startsWith(`.${basename(target)}-backup-`) &&
          (await exists(value.backup))
        )
          return { imported: false, backup: value.backup }
      } catch {
        /* An incomplete marker is never authority to replace existing work. */
      }
      throw new LegacyImportError('LEGACY_TARGET_EXISTS')
    }
    const entries = await scan(source)
    if (!entries.some(entry => entry.path === 'sessions.sqlite' && !entry.directory))
      throw new LegacyImportError('LEGACY_DATABASE_MISSING')
    if (entries.some(entry => entry.path === markerName)) throw new LegacyImportError('LEGACY_ALREADY_IMPORTED')
    const suffix = randomUUID()
    backup = join(dirname(target), `.${basename(target)}-backup-${suffix}`)
    stage = join(dirname(target), `.${basename(target)}-stage-${suffix}`)
    await mkdir(backup, { mode: 0o700 })
    await copy(source, backup, entries)
    await mkdir(stage, { mode: 0o700 })
    await copy(backup, stage, entries)
    for (const [name, owner, versions] of [
      ['sessions.sqlite', 0x44414754, [1, 2, 3]],
      ['web.sqlite', 0x44415742, [1, 2]],
      ['decks.sqlite', 1145128004, [1, 2]],
    ] as const) {
      if (await exists(join(stage, name))) validateDatabase(join(stage, name), owner, versions)
    }
    if (JSON.stringify(await scan(source)) !== JSON.stringify(entries))
      throw new LegacyImportError('LEGACY_SOURCE_CHANGED')
    await writeFile(join(stage, markerName), JSON.stringify({ version: 1, source, backup }), {
      flag: 'wx',
      mode: 0o600,
    })
    // The stage and destination share a parent, so install is one filesystem rename.
    if (await exists(target)) throw new LegacyImportError('LEGACY_TARGET_EXISTS')
    await rename(stage, target)
    stage = undefined
    return { imported: true, backup }
  } catch (error) {
    if (error instanceof LegacyImportError) throw new LegacyImportError(error.code, backup)
    throw new LegacyImportError('LEGACY_IMPORT_FAILED', backup)
  } finally {
    // Only the unique staging directory created by this invocation can be removed.
    if (stage) await rm(stage, { recursive: true, force: true })
  }
}
