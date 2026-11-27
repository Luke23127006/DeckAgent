import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { SQLOutputValue } from 'node:sqlite'
import type { PublishChange } from '@deckagent/host-contracts'
import { defaultWorkspaceId } from './workspace.types.ts'
import type { FolderStatus, Workspace, WorkspaceState } from './workspace.types.ts'
import { FolderPolicy } from './folder-policy.ts'
import type { FolderPolicyOptions } from './folder-policy.ts'
import { nameFromFolder, nameFromUser } from './workspace-name.ts'
import { WorkspaceError } from './workspaces.errors.ts'
import { migrateWorkspacesDatabase } from './workspaces.migrations.ts'

export interface WorkspaceStoreOptions extends FolderPolicyOptions {
  /** SQLite file inside DeckAgent Application Storage. */
  readonly path: string
  /** Name the system gives the default workspace on first start (FR-072). */
  readonly defaultName?: string
  /** Optional change notice publisher called after a committed write. */
  readonly publish?: PublishChange
}

export interface AddResult {
  readonly workspace: Workspace
  /** `existing`: the folder already had a workspace (UC-013 A1). `moved`: the folder of a workspace was found at a new place. */
  readonly outcome: 'created' | 'existing' | 'moved'
}

type Row = Record<string, SQLOutputValue>

/**
 * The single Workspace registry. Stores folder references and identity, never folder contents:
 * no operation reads a file of a project folder or writes anything into it.
 */
export class SqliteWorkspaceStore {
  private readonly db: DatabaseSync
  private readonly policy: FolderPolicy
  private readonly publish: PublishChange | undefined
  private closed = false

  constructor(options: WorkspaceStoreOptions) {
    this.policy = new FolderPolicy(options)
    this.publish = options.publish
    let db: DatabaseSync | undefined
    try {
      mkdirSync(dirname(options.path), { recursive: true })
      db = new DatabaseSync(options.path)
      migrateWorkspacesDatabase(db, options.defaultName ?? 'Workspace mặc định')
      this.db = db
    } catch (error) {
      db?.close()
      if (error instanceof WorkspaceError) throw error
      throw new WorkspaceError(
        'WORKSPACE_STORAGE',
        'Cannot open Workspace database. Check the data directory, file integrity and write permissions',
      )
    }
  }

  version(): number {
    return this.access(() => this.currentVersion())
  }

  /** Every workspace that is set up: the default workspace first, then in the order they were set up. */
  async list(): Promise<readonly WorkspaceState[]> {
    const rows = this.access(() =>
      this.db
        .prepare('SELECT * FROM workspaces WHERE removed_at IS NULL ORDER BY is_default DESC, created_at, id')
        .all(),
    )
    return Promise.all(rows.map(async row => ({ ...this.workspace(row), folderStatus: await this.status(row) })))
  }

  async get(id: string): Promise<WorkspaceState> {
    const row = this.access(() => this.row(id))
    return { ...this.workspace(row), folderStatus: await this.status(row) }
  }

  activeIds(): readonly string[] {
    return this.access(() =>
      this.db
        .prepare('SELECT id FROM workspaces WHERE removed_at IS NULL')
        .all()
        .map(row => String(row.id)),
    )
  }

  /** Canonical project folders of every workspace that is set up. */
  folders(): readonly string[] {
    return this.access(() =>
      this.db
        .prepare('SELECT folder FROM workspaces WHERE removed_at IS NULL AND folder IS NOT NULL')
        .all()
        .map(row => String(row.folder)),
    )
  }

  /** The workspace in use: the one chosen last when still set up, otherwise the default workspace (FR-072). */
  selectedId(): string {
    return this.access(() => {
      const row = this.db.prepare("SELECT value FROM registry_state WHERE key = 'selected'").get()
      const id = row ? String(row.value) : defaultWorkspaceId
      return this.db.prepare('SELECT id FROM workspaces WHERE id = ? AND removed_at IS NULL').get(id)
        ? id
        : defaultWorkspaceId
    })
  }

  /** Switching asks for no folder and reads no file (UC-013 A7). */
  select(id: string, expectedVersion?: number): Workspace {
    const { workspace, version } = this.access(() =>
      this.transaction(() => {
        const next = this.bumpVersion(expectedVersion)
        const row = this.row(id)
        this.setSelected(id)
        return { workspace: this.workspace(row), version: next }
      }),
    )
    this.publishVersion(version)
    return workspace
  }

  /** Set up a workspace for a readable folder and make it the workspace in use (UC-013 S2, A1, FR-071). */
  async add(folder: unknown, expectedVersion?: number): Promise<AddResult> {
    const identity = await this.policy.inspect(folder)
    const key = this.policy.key(identity.path)
    // A folder is the same folder by identity, not by place: a different folder now at the place of a
    // workspace's folder gets a workspace of its own, and that workspace keeps reporting it (FR-142).
    const same = this.access(() =>
      this.db
        .prepare('SELECT * FROM workspaces WHERE removed_at IS NULL AND dev = ? AND ino = ? ORDER BY created_at, id')
        .all(identity.dev, identity.ino),
    )
    let moved: Row | undefined
    for (const row of same) {
      if (String(row.folder_key) === key || (await this.status(row)) === 'available') {
        const version = this.access(() =>
          this.transaction(() => {
            const next = this.bumpVersion(expectedVersion)
            this.setSelected(String(row.id))
            return next
          }),
        )
        this.publishVersion(version)
        return { workspace: this.workspace(row), outcome: 'existing' }
      }
      moved ??= row
    }
    if (moved) {
      const { row, version } = this.access(() =>
        this.transaction(() => {
          const next = this.bumpVersion(expectedVersion)
          this.db
            .prepare('UPDATE workspaces SET folder = ?, folder_key = ? WHERE id = ?')
            .run(identity.path, key, String(moved.id))
          this.setSelected(String(moved.id))
          return { row: this.row(String(moved.id)), version: next }
        }),
      )
      this.publishVersion(version)
      return { workspace: this.workspace(row), outcome: 'moved' }
    }
    const id = `workspace-${randomUUID()}`
    const name = nameFromFolder(basename(identity.path), 'Workspace')
    const { row, version } = this.access(() =>
      this.transaction(() => {
        const next = this.bumpVersion(expectedVersion)
        this.db
          .prepare(
            'INSERT INTO workspaces (id, name, folder, folder_key, dev, ino, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          )
          .run(id, name, identity.path, key, identity.dev, identity.ino, new Date().toISOString())
        this.setSelected(id)
        return { row: this.row(id), version: next }
      }),
    )
    this.publishVersion(version)
    return { workspace: this.workspace(row), outcome: 'created' }
  }

  /** FR-141: the default workspace included; two workspaces may share a name. A refused name changes nothing. */
  rename(id: string, name: unknown, expectedVersion?: number): Workspace {
    const value = nameFromUser(name)
    const { workspace, version } = this.access(() =>
      this.transaction(() => {
        const next = this.bumpVersion(expectedVersion)
        this.row(id)
        this.db.prepare('UPDATE workspaces SET name = ? WHERE id = ?').run(value, id)
        return { workspace: this.workspace(this.row(id)), version: next }
      }),
    )
    this.publishVersion(version)
    return workspace
  }

  /**
   * FR-083: choose another folder for a workspace other than the default. Keeps its ID, name and chats.
   * Choosing the folder now at the stored place takes it over (FR-142).
   */
  async relink(id: string, folder: unknown, expectedVersion?: number): Promise<Workspace> {
    this.access(() => {
      this.assertVersion(expectedVersion)
      this.mutable(id)
    })
    const identity = await this.policy.inspect(folder)
    const key = this.policy.key(identity.path)
    const { workspace, version } = this.access(() =>
      this.transaction(() => {
        const next = this.bumpVersion(expectedVersion)
        this.mutable(id)
        const other = this.db
          .prepare('SELECT name FROM workspaces WHERE removed_at IS NULL AND dev = ? AND ino = ? AND id != ?')
          .get(identity.dev, identity.ino, id)
        if (other)
          throw new WorkspaceError('WORKSPACE_FOLDER_IN_USE', 'Another workspace has this folder', {
            workspaceName: String(other.name),
          })
        this.db
          .prepare('UPDATE workspaces SET folder = ?, folder_key = ?, dev = ?, ino = ? WHERE id = ?')
          .run(identity.path, key, identity.dev, identity.ino, id)
        return { workspace: this.workspace(this.row(id)), version: next }
      }),
    )
    this.publishVersion(version)
    return workspace
  }

  /**
   * FR-073: removes the workspace record only. Changes no folder or file. The caller makes its chats ungrouped.
   * When it was the workspace in use, the default workspace becomes the workspace in use.
   */
  remove(id: string, expectedVersion?: number, options?: { readonly publish?: boolean }): number {
    const version = this.access(() =>
      this.transaction(() => {
        const next = this.bumpVersion(expectedVersion)
        this.mutable(id)
        this.db.prepare('UPDATE workspaces SET removed_at = ? WHERE id = ?').run(new Date().toISOString(), id)
        const selected = this.db.prepare("SELECT value FROM registry_state WHERE key = 'selected'").get()
        if (!selected || String(selected.value) === id) this.setSelected(defaultWorkspaceId)
        return next
      }),
    )
    if (options?.publish !== false) this.publishVersion(version)
    return version
  }

  publishVersion(version: number): void {
    this.publish?.({ topic: 'workspaces', key: 'host', version })
  }

  /** Whether `path` is inside, or holds, the project folder of a workspace that is set up. */
  overlapsFolder(path: string): boolean {
    return this.folders().some(folder => this.policy.contains(folder, path) || this.policy.contains(path, folder))
  }

  close(): void {
    if (this.closed) return
    this.db.close()
    this.closed = true
  }

  private async status(row: Row): Promise<FolderStatus> {
    if (row.folder === null) return 'none'
    try {
      const current = await this.policy.identity(String(row.folder))
      return current.dev === String(row.dev) && current.ino === String(row.ino) ? 'available' : 'different-folder'
    } catch {
      return 'unreadable'
    }
  }

  private workspace(row: Row): Workspace {
    return {
      id: String(row.id),
      name: String(row.name),
      folder: row.folder === null ? null : String(row.folder),
      isDefault: Number(row.is_default) === 1,
    }
  }

  private row(id: string): Row {
    if (typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id))
      throw new WorkspaceError('WORKSPACE_NOT_FOUND', 'Workspace is not set up')
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id = ? AND removed_at IS NULL').get(id)
    if (!row) throw new WorkspaceError('WORKSPACE_NOT_FOUND', 'Workspace is not set up')
    return row
  }

  private mutable(id: string): void {
    if (Number(this.row(id).is_default) === 1)
      throw new WorkspaceError('WORKSPACE_DEFAULT', 'The default workspace has no project folder and is never removed')
  }

  private currentVersion(): number {
    const row = this.db.prepare("SELECT version FROM change_versions WHERE topic = 'workspaces' AND key = 'host'").get()
    if (!row) throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace version row is missing')
    return Number(row.version)
  }

  private assertVersion(expectedVersion?: number): number {
    const current = this.currentVersion()
    if (expectedVersion !== undefined && current !== expectedVersion) {
      throw new WorkspaceError('WORKSPACES_STALE', 'Workspace list changed. Refresh and try again')
    }
    return current
  }

  private bumpVersion(expectedVersion?: number): number {
    const next = this.assertVersion(expectedVersion) + 1
    this.db.prepare("UPDATE change_versions SET version = ? WHERE topic = 'workspaces' AND key = 'host'").run(next)
    return next
  }

  private setSelected(id: string): void {
    this.db
      .prepare(
        "INSERT INTO registry_state (key, value) VALUES ('selected', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .run(id)
  }

  private access<T>(operation: () => T): T {
    if (this.closed) throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace storage is closed')
    try {
      return operation()
    } catch (error) {
      if (error instanceof WorkspaceError) throw error
      throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace storage operation failed')
    }
  }

  private transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const result = operation()
      this.db.exec('COMMIT')
      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }
}
