import { constants, realpathSync } from 'node:fs'
import { access, opendir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import type { FolderRefusal } from './contracts.ts'
import { WorkspaceError } from './contracts.ts'

export interface FolderPolicyOptions {
  /** The user's own folder (BR-019 V-3, V-4). */
  readonly home: string
  /** DeckAgent's own data folder (BR-019 V-5). Already canonical. */
  readonly dataRoot: string
  /** Defaults to `process.platform`; Windows compares paths without case. */
  readonly platform?: NodeJS.Platform
  /** BR-019 V-2, closed list. Defaults to the Windows system folders on Windows and none elsewhere. */
  readonly systemFolders?: readonly string[]
}

export interface FolderIdentity {
  /** Canonical path, links followed. */
  readonly path: string
  readonly dev: string
  readonly ino: string
}

const windowsSystemFolders = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)']
const keyFolders = ['.ssh', '.aws', '.gnupg', '.kube', '.docker']
const pathLimit = 4096

/** BR-019: folders refused as a project folder, compared after links are followed. */
export class FolderPolicy {
  private readonly paths: typeof path.win32
  private readonly windows: boolean
  private readonly systemFolders: readonly string[]

  constructor(private readonly options: FolderPolicyOptions) {
    this.windows = (options.platform ?? process.platform) === 'win32'
    this.paths = this.windows ? path.win32 : path.posix
    this.systemFolders = options.systemFolders ?? (this.windows ? windowsSystemFolders : [])
    // Compare existing policy roots in the same canonical form as inspected folders.
    // Missing roots retain their lexical policy (including platform-only policy checks).
    if ((options.platform ?? process.platform) === process.platform) {
      this.options = {
        ...options,
        home: this.canonicalRoot(options.home),
        dataRoot: this.canonicalRoot(options.dataRoot),
      }
    }
  }

  private canonicalRoot(folder: string): string {
    try {
      // promises.realpath uses the native resolver too; Windows short names must expand identically.
      return realpathSync.native(folder)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return folder
      throw error
    }
  }

  /** Refusal of a canonical folder path, or undefined when the folder may be a project folder. */
  refusal(folder: string): { readonly reason: FolderRefusal; readonly allowInside: boolean } | undefined {
    const target = this.key(folder)
    if (this.paths.parse(target).root === target) return { reason: 'drive-root', allowInside: true }
    for (const system of this.systemFolders.map(item => this.key(item))) {
      if (this.inside(system, target)) return { reason: 'system', allowInside: false }
      if (this.inside(target, system)) return { reason: 'system', allowInside: true }
    }
    // Every value refuses on its own (BR-019); the order only picks the most specific reason to show.
    const data = this.key(this.options.dataRoot)
    if (this.inside(data, target)) return { reason: 'deckagent-data', allowInside: false }
    const home = this.key(this.options.home)
    if (keyFolders.some(name => this.inside(this.key(this.paths.join(home, name)), target)))
      return { reason: 'key-folder', allowInside: false }
    if (target === home) return { reason: 'user-folder', allowInside: true }
    if (this.inside(target, data)) return { reason: 'deckagent-data', allowInside: true }
    return undefined
  }

  /** Whether `child` is `parent` or inside it, on this policy's platform. */
  contains(parent: string, child: string): boolean {
    return this.inside(this.key(parent), this.key(child))
  }

  same(first: string, second: string): boolean {
    return this.key(first) === this.key(second)
  }

  /**
   * Canonical path and identity of a readable folder. Reads no entry and no file content:
   * the read check opens the folder handle and closes it at once.
   */
  async inspect(value: unknown): Promise<FolderIdentity> {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim()))
      throw new WorkspaceError('WORKSPACE_FOLDER_REQUIRED', 'No folder was chosen')
    if (typeof value !== 'string' || value.length > pathLimit || value.includes('\0') || !this.paths.isAbsolute(value))
      throw new WorkspaceError('WORKSPACE_FOLDER_INVALID', 'The folder must be given as a full path')
    let canonical: string
    try {
      canonical = await realpath(this.paths.resolve(value))
    } catch {
      throw new WorkspaceError('WORKSPACE_FOLDER_UNREADABLE', 'The folder cannot be read')
    }
    const refused = this.refusal(canonical)
    if (refused) throw new WorkspaceError('WORKSPACE_FOLDER_REFUSED', 'The folder cannot be a project folder', refused)
    return this.identity(canonical)
  }

  /** Identity of the folder at a stored canonical place, without the refusal rules. */
  async identity(canonical: string): Promise<FolderIdentity> {
    try {
      const info = await stat(canonical, { bigint: true })
      if (!info.isDirectory()) throw new Error('Not a folder')
      await access(canonical, constants.R_OK)
      const handle = await opendir(canonical)
      await handle.close()
      return { path: canonical, dev: String(info.dev), ino: String(info.ino) }
    } catch {
      throw new WorkspaceError('WORKSPACE_FOLDER_UNREADABLE', 'The folder cannot be read')
    }
  }

  /** Comparison key of a path: normalized, no trailing separator, without case on Windows. */
  key(value: string): string {
    const normalized = this.paths.normalize(value)
    const root = this.paths.parse(normalized).root
    const trimmed = normalized.length > root.length ? normalized.replace(/[\\/]+$/, '') : normalized
    return this.windows ? trimmed.toLowerCase() : trimmed
  }

  private inside(parent: string, child: string): boolean {
    const relative = this.paths.relative(parent, child)
    return (
      relative === '' ||
      (relative !== '..' && !relative.startsWith(`..${this.paths.sep}`) && !this.paths.isAbsolute(relative))
    )
  }
}
