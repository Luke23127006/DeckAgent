import { randomUUID } from 'node:crypto'
import { mkdir, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

/** DeckAgent Application Storage: SQLite files and managed files, never inside a project folder (ADR-0001). */
export interface StorageLayout {
  readonly root: string
  readonly databases: string
  readonly files: string
}

export type StorageErrorCode =
  | 'STORAGE_UNWRITABLE'
  | 'STORAGE_NOT_DIRECTORY'
  | 'STORAGE_CORRUPT'
  | 'STORAGE_INSIDE_WORKSPACE'

/** Each code has a fixed message that says what failed and what the user does next. No path is included. */
const messages: Readonly<Record<StorageErrorCode, string>> = {
  STORAGE_UNWRITABLE:
    'DeckAgent cannot write its data folder. Check the permissions of the folder, or start with --data-dir <folder>.',
  STORAGE_NOT_DIRECTORY:
    'The DeckAgent data location is not a folder. Remove the file in its way, or start with --data-dir <folder>.',
  STORAGE_CORRUPT:
    'DeckAgent cannot read its saved data. The files were kept unchanged. Keep a copy of the data folder, or start with --data-dir <folder>.',
  STORAGE_INSIDE_WORKSPACE:
    'The DeckAgent data folder is inside, or holds, the project folder of a workspace. Start with --data-dir <folder> outside every project folder.',
}

export class StorageError extends Error {
  constructor(public readonly code: StorageErrorCode) {
    super(messages[code])
    this.name = 'StorageError'
  }
}

export interface StorageRootInput {
  /** `--data-dir` */
  readonly flag?: string | undefined
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly platform?: NodeJS.Platform
  readonly home?: string
}

/** `--data-dir`, then `DECKAGENT_DATA_DIR`, then the app-data folder of the OS. Independent of the current directory. */
export function resolveStorageRoot(input: StorageRootInput = {}): string {
  const env = input.env ?? process.env
  const platform = input.platform ?? process.platform
  const paths = platform === 'win32' ? path.win32 : path.posix
  const home = input.home ?? homedir()
  const chosen = input.flag?.trim() || env.DECKAGENT_DATA_DIR?.trim()
  if (chosen) return paths.resolve(chosen)
  if (platform === 'win32')
    return paths.join(env.LOCALAPPDATA?.trim() || paths.join(home, 'AppData', 'Local'), 'DeckAgent')
  if (platform === 'darwin') return paths.join(home, 'Library', 'Application Support', 'DeckAgent')
  return paths.join(env.XDG_DATA_HOME?.trim() || paths.join(home, '.local', 'share'), 'deckagent')
}

/** Create or open the storage root with separate database and managed-file folders. Writes nothing outside it. */
export async function prepareStorage(root: string): Promise<StorageLayout> {
  const existing = await stat(root).catch(() => undefined)
  if (existing && !existing.isDirectory()) throw new StorageError('STORAGE_NOT_DIRECTORY')
  try {
    await mkdir(root, { recursive: true })
    const canonical = await realpath(root)
    const layout = { root: canonical, databases: path.join(canonical, 'db'), files: path.join(canonical, 'files') }
    for (const folder of [layout.databases, layout.files]) {
      const info = await stat(folder).catch(() => undefined)
      if (info && !info.isDirectory()) throw new StorageError('STORAGE_NOT_DIRECTORY')
      await mkdir(folder, { recursive: true })
    }
    const probe = path.join(layout.databases, `.write-check-${randomUUID()}`)
    await writeFile(probe, '', { flag: 'wx' })
    await rm(probe, { force: true })
    return layout
  } catch (error) {
    if (error instanceof StorageError) throw error
    throw new StorageError('STORAGE_UNWRITABLE')
  }
}
