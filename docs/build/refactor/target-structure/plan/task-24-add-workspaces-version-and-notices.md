# Task 24: Add version, schema 2 upgrade, expectedVersion and ChangeFeed wiring to the workspaces module

Read this file to learn the steps of Task 24, which adds schema 2, `version`, `expectedVersion`, `WORKSPACES_STALE` and `ChangeFeed` notices to the `workspaces` module.

After Task 23, `@deckagent/host-contracts` exports the change notice types and workspace body decoders, and `apps/host/src/http/` provides `ChangeFeed` and `GET /api/changes`. This task upgrades `workspaces.sqlite` from schema 1 to schema 2 in one transaction and adds `version` and `expectedVersion` to the module and `WorkspaceList`. It wires `ChangeFeed` in `server.ts`, updates the Browser client calls and existing tests, and deletes the one type assertion in `folder-policy.ts`.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `apps/host/src/modules/workspaces/contracts.ts` (56 lines)
- `apps/host/src/modules/workspaces/schema.ts` (60 lines)
- `apps/host/src/modules/workspaces/workspaces.store.ts` (289 lines)
- `apps/host/src/modules/workspaces/workspaces.service.ts` (64 lines)
- `apps/host/src/modules/workspaces/workspaces.routes.ts` (59 lines)
- `apps/host/src/modules/workspaces/workspaces.errors.ts` (38 lines)
- `apps/host/src/modules/workspaces/folder-policy.ts` (lines 45-60)
- `apps/host/src/server.ts` (lines 1-25, 155-180 and 300-394)
- `packages/host/contracts/src/management.ts` (lines 65-85)

**Files:**

- Change (complete files): `apps/host/src/modules/workspaces/contracts.ts`, `apps/host/src/modules/workspaces/schema.ts`, `apps/host/src/modules/workspaces/workspaces.store.ts`, `apps/host/src/modules/workspaces/workspaces.service.ts`, `apps/host/src/modules/workspaces/workspaces.routes.ts`, `apps/host/src/modules/workspaces/workspaces.errors.ts`
- Change (edit script): `apps/host/src/modules/workspaces/folder-policy.ts`, `packages/host/contracts/src/management.ts`, `apps/host/src/server.ts`, `apps/web/src/browser/transport/management-decoders.ts`, `apps/web/src/browser/transport/management-client.ts`, `apps/web/src/browser/chat-navigation.ts`, `apps/web/src/browser/features/workspaces/workspace-view.ts`, `apps/host/tests/workspace-registry.test.mjs`, `e2e/local-foundation.test.mjs`, `e2e/model-requests.test.mjs`, `apps/host/tests/brief-host.test.mjs`, `e2e/generation-bridge.test.mjs`, `e2e/source-requests.test.mjs`, `e2e/opencode-source-live.test.mjs`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-24-add-workspaces-version-and-notices.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-24-add-workspaces-version-and-notices.md`

**Interfaces:**

- Uses: `PublishChange`, `RequestValidationError`, `decodeWorkspaceAddBody`, `decodeWorkspaceSelectBody`, `decodeWorkspaceRenameBody`, `decodeWorkspaceRelinkBody` and `decodeWorkspaceRemoveBody` from `@deckagent/host-contracts`. `createChangeFeed` from `apps/host/src/http/change-feed.ts`. `startHost` with `StartHostOptions.changes` from `apps/host/src/http/start-host.ts`.
- Produces:
  - `WorkspaceList` in `@deckagent/host-contracts` adds `readonly version: number`.
  - `WorkspaceErrorCode` adds `'WORKSPACES_STALE'`, mapped to HTTP status `409`.
  - `WorkspaceRegistryOptions` adds optional `readonly publish?: PublishChange`.
  - `WorkspaceRegistry` adds `version(): number` and `publishVersion(version: number): void`. Its write methods take optional `expectedVersion?: number`, and `remove` takes optional `{ readonly publish?: boolean }` and returns `number`.
  - `WorkspaceOperations` write methods take `expectedVersion: number`.
  - `ManagementClient` workspace write methods take `expectedVersion: number`, and `allowedCodes` includes `'WORKSPACES_STALE'`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 3 prints a line that starts with a file name and `expected`.
- A suite in Step 5 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of Step 2 are part of the code.
- Change the code of Step 2. When `build` or `lint` reports an error in it, STOP.
- Change a file in `docs/architecture/`.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/host/src/modules/workspaces/contracts.ts apps/host/src/modules/workspaces/schema.ts apps/host/src/modules/workspaces/workspaces.store.ts apps/host/src/modules/workspaces/workspaces.service.ts apps/host/src/modules/workspaces/workspaces.routes.ts apps/host/src/modules/workspaces/workspaces.errors.ts apps/host/src/server.ts`

Expected: PASS. Seven lines, in this order: `56`, `60`, `289`, `64`, `59`, `38`, `394`.

- [ ] **Step 2: Write the updated workspaces module files**

Write each file below with the exact content.

`apps/host/src/modules/workspaces/contracts.ts`:

```ts
/** Workspace contracts. A Workspace groups chats and refers to one project folder; it never holds app data. */
export const defaultWorkspaceId = 'default'

/**
 * - `none`: no project folder (the default workspace).
 * - `available`: the folder the user chose is at its place and can be read.
 * - `unreadable`: nothing readable is at the place, for example it was moved or access was taken away (FR-074).
 * - `different-folder`: the place holds a folder that is not the one the user chose (FR-142).
 */
export type FolderStatus = 'none' | 'available' | 'unreadable' | 'different-folder'

export interface Workspace {
  readonly id: string
  readonly name: string
  /** Canonical path of the project folder; `null` for the default workspace. */
  readonly folder: string | null
  readonly isDefault: boolean
}

export interface WorkspaceState extends Workspace {
  readonly folderStatus: FolderStatus
}

export type FolderRefusal = 'drive-root' | 'system' | 'user-folder' | 'key-folder' | 'deckagent-data'

export type WorkspaceErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_DEFAULT'
  | 'WORKSPACE_FOLDER_REQUIRED'
  | 'WORKSPACE_FOLDER_INVALID'
  | 'WORKSPACE_FOLDER_UNREADABLE'
  | 'WORKSPACE_FOLDER_REFUSED'
  | 'WORKSPACE_FOLDER_IN_USE'
  | 'WORKSPACE_NAME_EMPTY'
  | 'WORKSPACE_NAME_TOO_LONG'
  | 'WORKSPACES_STALE'
  | 'WORKSPACE_STORAGE'
  | 'WORKSPACE_SCHEMA'

export interface WorkspaceErrorDetail {
  /** Name of the workspace that already has the folder. */
  readonly workspaceName?: string
  readonly reason?: FolderRefusal
  /** True when a folder inside the refused one may be chosen. */
  readonly allowInside?: boolean
}

export class WorkspaceError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    message: string,
    public readonly detail: WorkspaceErrorDetail = {},
  ) {
    super(message)
    this.name = 'WorkspaceError'
  }
}
```

`apps/host/src/modules/workspaces/schema.ts`:

```ts
import type { DatabaseSync } from 'node:sqlite'
import { WorkspaceError, defaultWorkspaceId } from './contracts.ts'

const applicationId = 0x44415753 // DAWS; distinguishes this file from another application's SQLite database.
const schemaVersion = 2

const changeVersionsTable = `
  CREATE TABLE change_versions (
    topic TEXT NOT NULL,
    key TEXT NOT NULL,
    version INTEGER NOT NULL CHECK (version >= 0),
    PRIMARY KEY (topic, key)
  ) STRICT;
  INSERT INTO change_versions (topic, key, version) VALUES ('workspaces', 'host', 0);
`

export function initialize(db: DatabaseSync, defaultName: string): void {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; BEGIN IMMEDIATE;')
  try {
    const version = Number(db.prepare('PRAGMA user_version').get()!.user_version)
    const owner = Number(db.prepare('PRAGMA application_id').get()!.application_id)
    if (
      version === 0 &&
      owner === 0 &&
      !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
    ) {
      db.exec(`
        CREATE TABLE workspaces (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, folder TEXT, folder_key TEXT, dev TEXT, ino TEXT,
          is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
          created_at TEXT NOT NULL, removed_at TEXT,
          CHECK ((folder IS NULL) = (folder_key IS NULL) AND (folder IS NULL) = (dev IS NULL) AND (folder IS NULL) = (ino IS NULL)),
          CHECK (is_default = 0 OR (folder IS NULL AND removed_at IS NULL))
        ) STRICT;
        CREATE INDEX workspace_identity ON workspaces(dev, ino) WHERE removed_at IS NULL;
        CREATE TABLE registry_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
        ${changeVersionsTable}
        PRAGMA application_id = ${applicationId};
        PRAGMA user_version = ${schemaVersion};
      `)
      db.prepare('INSERT INTO workspaces (id, name, is_default, created_at) VALUES (?, ?, 1, ?)').run(
        defaultWorkspaceId,
        defaultName,
        new Date().toISOString(),
      )
      db.prepare("INSERT INTO registry_state (key, value) VALUES ('selected', ?)").run(defaultWorkspaceId)
    } else if (version === 1 && owner === applicationId) {
      db.exec(`
        ${changeVersionsTable}
        PRAGMA user_version = ${schemaVersion};
      `)
    } else if (version !== schemaVersion || owner !== applicationId) {
      throw new WorkspaceError(
        'WORKSPACE_SCHEMA',
        'Unsupported Workspace database format. Keep the file and use a compatible version or another data directory',
      )
    }
    if (db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok')
      throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace database failed its integrity check')
    db.prepare(
      'SELECT id, name, folder, folder_key, dev, ino, is_default, created_at, removed_at FROM workspaces LIMIT 0',
    ).all()
    db.prepare('SELECT key, value FROM registry_state LIMIT 0').all()
    db.prepare('SELECT topic, key, version FROM change_versions LIMIT 0').all()
    if (
      !db
        .prepare('SELECT id FROM workspaces WHERE id = ? AND is_default = 1 AND removed_at IS NULL')
        .get(defaultWorkspaceId)
    )
      throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace database has no default workspace')
    if (!db.prepare("SELECT version FROM change_versions WHERE topic = 'workspaces' AND key = 'host'").get())
      throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace database has no version row')
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
}
```

`apps/host/src/modules/workspaces/workspaces.store.ts`:

```ts
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { SQLOutputValue } from 'node:sqlite'
import type { PublishChange } from '@deckagent/host-contracts'
import { WorkspaceError, defaultWorkspaceId } from './contracts.ts'
import type { FolderStatus, Workspace, WorkspaceState } from './contracts.ts'
import { FolderPolicy } from './folder-policy.ts'
import type { FolderPolicyOptions } from './folder-policy.ts'
import { nameFromFolder, nameFromUser } from './workspace-name.ts'
import { initialize } from './schema.ts'

export interface WorkspaceRegistryOptions extends FolderPolicyOptions {
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
export class WorkspaceRegistry {
  private readonly db: DatabaseSync
  private readonly policy: FolderPolicy
  private readonly publish: PublishChange | undefined
  private closed = false

  constructor(options: WorkspaceRegistryOptions) {
    this.policy = new FolderPolicy(options)
    this.publish = options.publish
    let db: DatabaseSync | undefined
    try {
      mkdirSync(dirname(options.path), { recursive: true })
      db = new DatabaseSync(options.path)
      initialize(db, options.defaultName ?? 'Workspace mặc định')
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
    const row = this.db
      .prepare("SELECT version FROM change_versions WHERE topic = 'workspaces' AND key = 'host'")
      .get()
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
```

`apps/host/src/modules/workspaces/workspaces.service.ts`:

```ts
import type { WorkspaceList } from '@deckagent/host-contracts'
import type { WorkspaceRegistry } from './workspaces.store.ts'

type WorkspaceWorkflowErrorCode = 'WORKSPACE_REQUEST_ACTIVE'

export class WorkspaceWorkflowError extends Error {
  constructor(readonly code: WorkspaceWorkflowErrorCode) {
    super(code)
  }
}

export interface WorkspaceChats {
  hasActiveRequest(workspaceId: string): Promise<boolean>
  ungroup(workspaceId: string): Promise<void>
}

export interface WorkspaceOperations {
  list(): Promise<WorkspaceList>
  add(folder: unknown, expectedVersion: number): Promise<WorkspaceList>
  select(id: string, expectedVersion: number): Promise<WorkspaceList>
  rename(id: string, name: unknown, expectedVersion: number): Promise<WorkspaceList>
  relink(id: string, folder: unknown, expectedVersion: number): Promise<WorkspaceList>
  remove(id: string, expectedVersion: number): Promise<WorkspaceList>
}

/** Coordinates workspace registry changes with active-request checks and chat ungrouping. */
export function createWorkspaceOperations(registry: WorkspaceRegistry, chats: WorkspaceChats): WorkspaceOperations {
  const listWorkspaces = async (): Promise<WorkspaceList> => ({
    workspaces: await registry.list(),
    selectedId: registry.selectedId(),
    version: registry.version(),
  })

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  const requireNoActiveRequest = async (workspaceId: string): Promise<void> => {
    if (await chats.hasActiveRequest(workspaceId)) throw new WorkspaceWorkflowError('WORKSPACE_REQUEST_ACTIVE')
  }

  return {
    list: () => listWorkspaces(),
    add: async (folder, expectedVersion) => {
      await registry.add(folder, expectedVersion)
      return listWorkspaces()
    },
    select: async (id, expectedVersion) => {
      registry.select(id, expectedVersion)
      return listWorkspaces()
    },
    rename: async (id, name, expectedVersion) => {
      registry.rename(id, name, expectedVersion)
      return listWorkspaces()
    },
    relink: async (id, folder, expectedVersion) => {
      await requireNoActiveRequest(id)
      await registry.relink(id, folder, expectedVersion)
      return listWorkspaces()
    },
    remove: async (id, expectedVersion) => {
      await requireNoActiveRequest(id)
      const version = registry.remove(id, expectedVersion, { publish: false })
      await chats.ungroup(id)
      registry.publishVersion(version)
      return listWorkspaces()
    },
  }
}
```

`apps/host/src/modules/workspaces/workspaces.routes.ts`:

```ts
import { HttpError, json, param, params, readJson, route } from '@deckagent/host-api'
import {
  RequestValidationError,
  decodeWorkspaceAddBody,
  decodeWorkspaceRelinkBody,
  decodeWorkspaceRemoveBody,
  decodeWorkspaceRenameBody,
  decodeWorkspaceSelectBody,
} from '@deckagent/host-contracts'
import { Router } from 'express'
import type { WorkspaceOperations } from './workspaces.service.ts'

function parseBody<T>(decode: (value: unknown) => T, value: unknown): T {
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError) throw new HttpError(400, error.code)
    throw error
  }
}

export function createWorkspaceRoutes(workspaces: WorkspaceOperations): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/workspaces',
    route(async (_req, res) => {
      json(res, 200, await workspaces.list())
    }),
  )
  router.post(
    '/api/workspaces',
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceAddBody, await readJson(req))
      json(res, 200, await workspaces.add(body.folder, body.expectedVersion))
    }),
  )
  router.put(
    '/api/workspaces/selected',
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceSelectBody, await readJson(req))
      json(res, 200, await workspaces.select(body.id, body.expectedVersion))
    }),
  )
  const notSelected = params({ workspaceId: /^(?!selected$)[\w-]{1,100}$/ })
  router.put(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRenameBody, await readJson(req))
      json(res, 200, await workspaces.rename(param(req, 'workspaceId'), body.name, body.expectedVersion))
    }),
  )
  router.delete(
    '/api/workspaces/:workspaceId',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRemoveBody, await readJson(req))
      json(res, 200, await workspaces.remove(param(req, 'workspaceId'), body.expectedVersion))
    }),
  )
  router.put(
    '/api/workspaces/:workspaceId/folder',
    notSelected,
    route(async (req, res) => {
      const body = parseBody(decodeWorkspaceRelinkBody, await readJson(req))
      json(res, 200, await workspaces.relink(param(req, 'workspaceId'), body.folder, body.expectedVersion))
    }),
  )
  return router
}
```

`apps/host/src/modules/workspaces/workspaces.errors.ts`:

```ts
import type { HttpErrorDetail, HttpFailureResponse } from '@deckagent/host-api'
import { WorkspaceError } from './contracts.ts'
import { WorkspaceWorkflowError } from './workspaces.service.ts'

const workspaceStatus: Readonly<Record<WorkspaceError['code'], number>> = {
  WORKSPACE_NOT_FOUND: 404,
  WORKSPACE_DEFAULT: 409,
  WORKSPACE_FOLDER_REQUIRED: 400,
  WORKSPACE_FOLDER_INVALID: 400,
  WORKSPACE_FOLDER_UNREADABLE: 422,
  WORKSPACE_FOLDER_REFUSED: 422,
  WORKSPACE_FOLDER_IN_USE: 409,
  WORKSPACE_NAME_EMPTY: 400,
  WORKSPACE_NAME_TOO_LONG: 400,
  WORKSPACES_STALE: 409,
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

/** Safe details only: a workspace name or a refusal reason, never a path. */
function mapWorkspaceError(error: WorkspaceError): HttpFailureResponse {
  const { workspaceName, reason, allowInside } = error.detail
  const detail: HttpErrorDetail = {
    ...(workspaceName === undefined ? {} : { workspaceName }),
    ...(reason === undefined ? {} : { reason }),
    ...(allowInside === undefined ? {} : { allowInside }),
  }
  return {
    status: workspaceStatus[error.code],
    code: error.code,
    ...(Object.keys(detail).length > 0 ? { detail } : {}),
  }
}

export function mapWorkspaceFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof WorkspaceWorkflowError) return { status: 409, code: error.code }
  if (error instanceof WorkspaceError) return mapWorkspaceError(error)
  return undefined
}
```

- [ ] **Step 3: Run the edit script**

Save the script below as `deckagent-task24-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
let changed = 0
function edit(file, pairs) {
  const original = readFileSync(file, 'utf8')
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  let text = original.replace(/\r\n/g, '\n')
  for (const [from, to, count] of pairs) {
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from.slice(0, 60))}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, eol === '\n' ? text : text.replace(/\n/g, eol))
  changed += 1
}

edit('apps/host/src/modules/workspaces/folder-policy.ts', [
  [
    "      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return folder\n",
    "      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return folder\n",
    1,
  ],
])

edit('packages/host/contracts/src/management.ts', [
  [
    'export interface WorkspaceList {\n  readonly workspaces: readonly WorkspaceView[]\n  /** The workspace in use. */\n  readonly selectedId: string\n}\n',
    'export interface WorkspaceList {\n  readonly workspaces: readonly WorkspaceView[]\n  /** The workspace in use. */\n  readonly selectedId: string\n  readonly version: number\n}\n',
    1,
  ],
])

edit('apps/host/src/server.ts', [
  [
    "import { startHost } from './http/start-host.ts'\n",
    "import { createChangeFeed, type ChangeFeed } from './http/change-feed.ts'\nimport { startHost, type StartHostOptions } from './http/start-host.ts'\n",
    1,
  ],
  [
    'async function openStorageLayer(\n  layout: StorageLayout,\n  options: LocalWebOptions,\n  renderer: ArtifactRenderer,\n  commonsImages: CommonsImages,\n  getAttachments: () => ManagedAttachments | undefined,\n): Promise<StorageLayer> {\n',
    'async function openStorageLayer(\n  layout: StorageLayout,\n  options: LocalWebOptions,\n  renderer: ArtifactRenderer,\n  commonsImages: CommonsImages,\n  getAttachments: () => ManagedAttachments | undefined,\n  changeFeed: ChangeFeed,\n): Promise<StorageLayer> {\n',
    1,
  ],
  [
    "      registry = new WorkspaceRegistry({\n        path: join(layout.databases, 'workspaces.sqlite'),\n        home: options.home ?? homedir(),\n        dataRoot: layout.root,\n      })\n",
    "      registry = new WorkspaceRegistry({\n        path: join(layout.databases, 'workspaces.sqlite'),\n        home: options.home ?? homedir(),\n        dataRoot: layout.root,\n        publish: changeFeed.publish,\n      })\n",
    1,
  ],
  [
    "function createHostOptions(\n  layout: StorageLayout,\n  options: LocalWebOptions,\n  storage: StorageLayer,\n  runtime: RuntimeLayer,\n  attachments: ManagedAttachments,\n  drafts: MemoryDraftStore,\n  assets: NonNullable<HostOptions['assets']>,\n): HostOptions {\n",
    "function createHostOptions(\n  layout: StorageLayout,\n  options: LocalWebOptions,\n  storage: StorageLayer,\n  runtime: RuntimeLayer,\n  attachments: ManagedAttachments,\n  drafts: MemoryDraftStore,\n  assets: NonNullable<HostOptions['assets']>,\n  changeFeed: ChangeFeed,\n): StartHostOptions {\n",
    1,
  ],
  [
    '    routes: [createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions)))],\n',
    "    routes: [createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions)))],\n    changes: { feed: changeFeed, hostTopics: [{ topic: 'workspaces', version: () => registry.version() }] },\n",
    1,
  ],
  [
    '  const drafts = new MemoryDraftStore()\n',
    '  const drafts = new MemoryDraftStore()\n  const changeFeed = createChangeFeed()\n',
    1,
  ],
  [
    '    opened = await openStorageLayer(layout, options, renderer, commonsImages, () => attachments)\n',
    '    opened = await openStorageLayer(layout, options, renderer, commonsImages, () => attachments, changeFeed)\n',
    1,
  ],
  [
    '    host = await startHost(createHostOptions(layout, options, storage, runtime, attachments, drafts, assets))\n',
    '    host = await startHost(\n      createHostOptions(layout, options, storage, runtime, attachments, drafts, assets, changeFeed),\n    )\n',
    1,
  ],
])

edit('apps/web/src/browser/transport/management-decoders.ts', [
  [
    'export function decodeWorkspaceList(value: unknown): WorkspaceList {\n  if (!isRecord(value) || typeof value.selectedId !== \'string\' || !Array.isArray(value.workspaces)) invalid()\n  return {\n    selectedId: value.selectedId,\n',
    'export function decodeWorkspaceList(value: unknown): WorkspaceList {\n  if (\n    !isRecord(value) ||\n    typeof value.selectedId !== \'string\' ||\n    typeof value.version !== \'number\' ||\n    !Number.isSafeInteger(value.version) ||\n    value.version < 0 ||\n    !Array.isArray(value.workspaces)\n  )\n    invalid()\n  return {\n    selectedId: value.selectedId,\n    version: value.version,\n',
    1,
  ],
])

edit('apps/web/src/browser/transport/management-client.ts', [
  [
    "  'WORKSPACE_NAME_TOO_LONG',\n]",
    "  'WORKSPACE_NAME_TOO_LONG',\n  'WORKSPACES_STALE',\n]",
    1,
  ],
  [
    "  async addWorkspace(folder: string): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request('workspaces', 'POST', { folder }))\n  }\n  async selectWorkspace(id: string): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request('workspaces/selected', 'PUT', { id }))\n  }\n  async renameWorkspace(id: string, name: string): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request(`workspaces/${encodeURIComponent(id)}`, 'PUT', { name }))\n  }\n  async relinkWorkspace(id: string, folder: string): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request(`workspaces/${encodeURIComponent(id)}/folder`, 'PUT', { folder }))\n  }\n  async removeWorkspace(id: string): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request(`workspaces/${encodeURIComponent(id)}`, 'DELETE'))\n  }\n",
    "  async addWorkspace(folder: string, expectedVersion: number): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request('workspaces', 'POST', { folder, expectedVersion }))\n  }\n  async selectWorkspace(id: string, expectedVersion: number): Promise<WorkspaceList> {\n    return decodeWorkspaceList(await this.request('workspaces/selected', 'PUT', { id, expectedVersion }))\n  }\n  async renameWorkspace(id: string, name: string, expectedVersion: number): Promise<WorkspaceList> {\n    return decodeWorkspaceList(\n      await this.request(`workspaces/${encodeURIComponent(id)}`, 'PUT', { name, expectedVersion }),\n    )\n  }\n  async relinkWorkspace(id: string, folder: string, expectedVersion: number): Promise<WorkspaceList> {\n    return decodeWorkspaceList(\n      await this.request(`workspaces/${encodeURIComponent(id)}/folder`, 'PUT', { folder, expectedVersion }),\n    )\n  }\n  async removeWorkspace(id: string, expectedVersion: number): Promise<WorkspaceList> {\n    return decodeWorkspaceList(\n      await this.request(`workspaces/${encodeURIComponent(id)}`, 'DELETE', { expectedVersion }),\n    )\n  }\n",
    1,
  ],
])

edit('apps/web/src/browser/chat-navigation.ts', [
  [
    "  workspaces: WorkspaceList = { workspaces: [], selectedId: 'default' }\n",
    "  workspaces: WorkspaceList = { workspaces: [], selectedId: 'default', version: 0 }\n",
    1,
  ],
])

edit('apps/web/src/browser/features/workspaces/workspace-view.ts', [
  [
    '  change(() => management.removeWorkspace(selected.id), true)\n',
    '  change(() => management.removeWorkspace(selected.id, state.list.version), true)\n',
    1,
  ],
  [
    '        ? management.renameWorkspace(target.id, text)\n        : target.kind === \'relink\'\n          ? management.relinkWorkspace(target.id, text.trim())\n          : management.addWorkspace(text.trim()),\n',
    '        ? management.renameWorkspace(target.id, text, state.list.version)\n        : target.kind === \'relink\'\n          ? management.relinkWorkspace(target.id, text.trim(), state.list.version)\n          : management.addWorkspace(text.trim(), state.list.version),\n',
    1,
  ],
  [
    '    if (selected && folder) change(() => management.relinkWorkspace(selected.id, folder), false)\n',
    '    if (selected && folder) change(() => management.relinkWorkspace(selected.id, folder, state.list.version), false)\n',
    1,
  ],
  [
    '    if (id !== state.list.selectedId) change(() => management.selectWorkspace(id), false)\n',
    '    if (id !== state.list.selectedId) change(() => management.selectWorkspace(id, state.list.version), false)\n',
    1,
  ],
  [
    "    list: { workspaces: [], selectedId: 'default' },\n",
    "    list: { workspaces: [], selectedId: 'default', version: 0 },\n",
    1,
  ],
])

edit('apps/host/tests/workspace-registry.test.mjs', [
  [
    "import { join, parse, sep } from 'node:path'\nimport test from 'node:test'\n",
    "import { join, parse, sep } from 'node:path'\nimport { DatabaseSync } from 'node:sqlite'\nimport test from 'node:test'\n",
    1,
  ],
])

const extraRegistryTests = `
test('schema 1 workspaces.sqlite upgrades to schema 2 in place while keeping workspaces and selection', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const dbPath = join(dataRoot, 'db', 'workspaces.sqlite')
  await mkdir(join(dataRoot, 'db'), { recursive: true })
  const project = await folder(dir, 'legacy-project')
  const v1 = new DatabaseSync(dbPath)
  v1.exec(\`
    CREATE TABLE workspaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, folder TEXT, folder_key TEXT, dev TEXT, ino TEXT,
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      created_at TEXT NOT NULL, removed_at TEXT,
      CHECK ((folder IS NULL) = (folder_key IS NULL) AND (folder IS NULL) = (dev IS NULL) AND (folder IS NULL) = (ino IS NULL)),
      CHECK (is_default = 0 OR (folder IS NULL AND removed_at IS NULL))
    ) STRICT;
    CREATE INDEX workspace_identity ON workspaces(dev, ino) WHERE removed_at IS NULL;
    CREATE TABLE registry_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    PRAGMA application_id = 1145132883;
    PRAGMA user_version = 1;
  \`)
  v1.prepare(
    "INSERT INTO workspaces (id, name, is_default, created_at) VALUES ('default', 'Default', 1, '2026-01-01T00:00:00.000Z')",
  ).run()
  v1.prepare(
    "INSERT INTO workspaces (id, name, folder, folder_key, dev, ino, is_default, created_at) VALUES ('ws-1', 'Legacy', ?, ?, '1', '2', 0, '2026-01-02T00:00:00.000Z')",
  ).run(project, project)
  v1.prepare("INSERT INTO registry_state (key, value) VALUES ('selected', 'ws-1')").run()
  v1.close()

  const registry = new WorkspaceRegistry({ path: dbPath, home, dataRoot })
  t.after(() => registry.close())
  assert.equal(registry.version(), 0)
  assert.equal(registry.selectedId(), 'ws-1')
  assert.deepEqual(
    (await registry.list()).map(item => [item.id, item.name]),
    [
      ['default', 'Default'],
      ['ws-1', 'Legacy'],
    ],
  )
  registry.rename('ws-1', 'Upgraded', 0)
  assert.equal(registry.version(), 1)
  registry.close()

  const check = new DatabaseSync(dbPath)
  assert.equal(Number(check.prepare('PRAGMA user_version').get().user_version), 2)
  check.close()
})

test('every workspace write increments version inside a transaction and publishes notices after commit', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const notices = []
  const registry = new WorkspaceRegistry({
    path: join(dataRoot, 'db', 'workspaces.sqlite'),
    home,
    dataRoot,
    publish: notice => notices.push(notice),
  })
  t.after(() => registry.close())
  assert.equal(registry.version(), 0)

  const firstDir = await folder(dir, 'first')
  const secondDir = await folder(dir, 'second')
  const added = await registry.add(firstDir, 0)
  assert.equal(registry.version(), 1)
  registry.select('default', 1)
  assert.equal(registry.version(), 2)
  const existing = await registry.add(firstDir, 2)
  assert.equal(existing.outcome, 'existing')
  assert.equal(registry.version(), 3)
  registry.rename(added.workspace.id, 'First Renamed', 3)
  assert.equal(registry.version(), 4)
  await registry.relink(added.workspace.id, secondDir, 4)
  assert.equal(registry.version(), 5)
  const movedDir = join(dir, 'second-moved')
  await rename(secondDir, movedDir)
  const moved = await registry.add(movedDir, 5)
  assert.equal(moved.outcome, 'moved')
  assert.equal(registry.version(), 6)

  const removedVersion = registry.remove(added.workspace.id, 6, { publish: false })
  assert.equal(removedVersion, 7)
  assert.equal(registry.version(), 7)
  assert.equal(notices.length, 6)
  registry.publishVersion(removedVersion)
  assert.deepEqual(
    notices,
    [1, 2, 3, 4, 5, 6, 7].map(version => ({ topic: 'workspaces', key: 'host', version })),
  )
})

test('stale expectedVersion throws WORKSPACES_STALE, changes no row and publishes no notice', async t => {
  const { dir, home, dataRoot } = await setup(t)
  const notices = []
  const registry = new WorkspaceRegistry({
    path: join(dataRoot, 'db', 'workspaces.sqlite'),
    home,
    dataRoot,
    publish: notice => notices.push(notice),
  })
  t.after(() => registry.close())
  const one = await folder(dir, 'one')
  const two = await folder(dir, 'two')
  const added = await registry.add(one, 0)
  assert.equal(registry.version(), 1)
  notices.length = 0

  assert.throws(() => registry.select('default', 0), { code: 'WORKSPACES_STALE' })
  await assert.rejects(registry.add(two, 0), { code: 'WORKSPACES_STALE' })
  assert.throws(() => registry.rename(added.workspace.id, 'Nope', 0), { code: 'WORKSPACES_STALE' })
  await assert.rejects(registry.relink(added.workspace.id, two, 0), { code: 'WORKSPACES_STALE' })
  assert.throws(() => registry.remove(added.workspace.id, 0), { code: 'WORKSPACES_STALE' })
  assert.equal(registry.version(), 1)
  assert.equal(registry.selectedId(), added.workspace.id)
  assert.deepEqual(notices, [])
})
`
writeFileSync(
  'apps/host/tests/workspace-registry.test.mjs',
  readFileSync('apps/host/tests/workspace-registry.test.mjs', 'utf8').replace(/\r\n/g, '\n') + extraRegistryTests,
)

edit('e2e/local-foundation.test.mjs', [
  [
    "  const added = (await call('workspaces', 'POST', { folder: await project('Dự án') })).data\n",
    "  assert.equal(first.version, 0)\n  const added = (await call('workspaces', 'POST', { folder: await project('Dự án'), expectedVersion: first.version })).data\n",
    1,
  ],
  [
    "  const id = (await call('workspaces', 'POST', { folder })).data.selectedId\n  await call('workspaces/selected', 'PUT', { id: 'default' })\n  const twice = (await call('workspaces', 'POST', { folder: `${folder}\\\\.` })).data\n  assert.equal(twice.selectedId, id, 'The folder that already has a workspace makes it the workspace in use')\n  assert.equal(twice.workspaces.length, 2)\n  const chat = (await call('sessions', 'POST', {})).data\n  await call(`sessions/${chat.sessionId}/draft`, 'PUT', { text: 'kept' })\n  const relinked = (await call(`workspaces/${id}/folder`, 'PUT', { folder: other })).data\n  assert.equal(relinked.workspaces.find(item => item.id === id).folder.endsWith('other'), true)\n  assert.equal(\n    (await call('sessions')).data.find(item => item.sessionId === chat.sessionId).workspaceId,\n    id,\n    'Relink keeps the chats',\n  )\n  const inUse = await call(`workspaces/default/folder`, 'PUT', { folder })\n  assert.deepEqual([inUse.status, inUse.data.error.code], [409, 'WORKSPACE_DEFAULT'])\n  const second = (await call('workspaces', 'POST', { folder })).data.selectedId\n  const conflict = await call(`workspaces/${second}/folder`, 'PUT', { folder: other })\n  assert.deepEqual(\n    [conflict.status, conflict.data.error.code, conflict.data.error.detail.workspaceName],\n    [409, 'WORKSPACE_FOLDER_IN_USE', 'project'],\n  )\n  await call('workspaces/selected', 'PUT', { id })\n  const removed = (await call(`workspaces/${id}`, 'DELETE')).data\n  assert.equal(\n    removed.selectedId,\n    'default',\n    'Removing the workspace in use makes the default workspace the workspace in use',\n  )\n  const ungrouped = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)\n  assert.equal(ungrouped.workspaceId, null, 'Its chat becomes an ungrouped chat')\n  assert.equal((await call(`sessions/${chat.sessionId}/draft`)).data.text, 'kept')\n  assert.deepEqual((await call(`workspaces/${id}`, 'DELETE')).data.error.code, 'WORKSPACE_NOT_FOUND')\n",
    "  const firstAdd = (await call('workspaces', 'POST', { folder, expectedVersion: 0 })).data\n  const id = firstAdd.selectedId\n  const selectedDefault = (await call('workspaces/selected', 'PUT', { id: 'default', expectedVersion: firstAdd.version })).data\n  const twice = (await call('workspaces', 'POST', { folder: `${folder}\\\\.`, expectedVersion: selectedDefault.version })).data\n  assert.equal(twice.selectedId, id, 'The folder that already has a workspace makes it the workspace in use')\n  assert.equal(twice.workspaces.length, 2)\n  const chat = (await call('sessions', 'POST', {})).data\n  await call(`sessions/${chat.sessionId}/draft`, 'PUT', { text: 'kept' })\n  const relinked = (await call(`workspaces/${id}/folder`, 'PUT', { folder: other, expectedVersion: twice.version })).data\n  assert.equal(relinked.workspaces.find(item => item.id === id).folder.endsWith('other'), true)\n  assert.equal(\n    (await call('sessions')).data.find(item => item.sessionId === chat.sessionId).workspaceId,\n    id,\n    'Relink keeps the chats',\n  )\n  const inUse = await call(`workspaces/default/folder`, 'PUT', { folder, expectedVersion: relinked.version })\n  assert.deepEqual([inUse.status, inUse.data.error.code], [409, 'WORKSPACE_DEFAULT'])\n  const secondAdd = (await call('workspaces', 'POST', { folder, expectedVersion: relinked.version })).data\n  const second = secondAdd.selectedId\n  const conflict = await call(`workspaces/${second}/folder`, 'PUT', { folder: other, expectedVersion: secondAdd.version })\n  assert.deepEqual(\n    [conflict.status, conflict.data.error.code, conflict.data.error.detail.workspaceName],\n    [409, 'WORKSPACE_FOLDER_IN_USE', 'project'],\n  )\n  const reselected = (await call('workspaces/selected', 'PUT', { id, expectedVersion: secondAdd.version })).data\n  const removed = (await call(`workspaces/${id}`, 'DELETE', { expectedVersion: reselected.version })).data\n  assert.equal(\n    removed.selectedId,\n    'default',\n    'Removing the workspace in use makes the default workspace the workspace in use',\n  )\n  const ungrouped = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)\n  assert.equal(ungrouped.workspaceId, null, 'Its chat becomes an ungrouped chat')\n  assert.equal((await call(`sessions/${chat.sessionId}/draft`)).data.text, 'kept')\n  assert.deepEqual(\n    (await call(`workspaces/${id}`, 'DELETE', { expectedVersion: removed.version })).data.error.code,\n    'WORKSPACE_NOT_FOUND',\n  )\n",
    1,
  ],
  [
    "  const id = (await call('workspaces', 'POST', { folder })).data.selectedId\n",
    "  const id = (await call('workspaces', 'POST', { folder, expectedVersion: 0 })).data.selectedId\n",
    1,
  ],
  [
    "  const refused = await call('workspaces', 'POST', { folder: join(dir, 'does-not-exist') })\n",
    "  const refused = await call('workspaces', 'POST', { folder: join(dir, 'does-not-exist'), expectedVersion: 1 })\n",
    1,
  ],
  [
    "  const reason = await call('workspaces', 'POST', { folder: options.dataDir })\n",
    "  const reason = await call('workspaces', 'POST', { folder: options.dataDir, expectedVersion: 1 })\n",
    1,
  ],
  [
    "  const name = await call(`workspaces/${id}`, 'PUT', { name: 'y'.repeat(101) })\n",
    "  const name = await call(`workspaces/${id}`, 'PUT', { name: 'y'.repeat(101), expectedVersion: 1 })\n",
    1,
  ],
  [
    "  assert.equal((await api(app)('workspaces', 'POST', { folder: outer })).status, 200)\n",
    "  assert.equal((await api(app)('workspaces', 'POST', { folder: outer, expectedVersion: 0 })).status, 200)\n",
    1,
  ],
])

const extraFoundationTest = `
test('workspace routes check expectedVersion, return 409 WORKSPACES_STALE and publish change notices after ungroup', async t => {
  const { start, project } = await area(t)
  const app = await start()
  const call = api(app)
  const folder = await project('noticed')

  const missingVersion = await call('workspaces', 'POST', { folder })
  assert.deepEqual([missingVersion.status, missingVersion.data.error.code], [400, 'INVALID_REQUEST'])

  const streamControl = new AbortController()
  t.after(() => streamControl.abort())
  const streamResponse = await fetch(\`\${app.origin}/api/changes\`, {
    headers: { authorization: \`Bearer \${app.token}\` },
    signal: streamControl.signal,
  })
  assert.equal(streamResponse.status, 200)
  const reader = streamResponse.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const nextNotice = async () => {
    while (true) {
      const boundary = buffer.indexOf('\\n\\n')
      if (boundary >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        if (frame.startsWith('event: change\\ndata: ')) return JSON.parse(frame.slice('event: change\\ndata: '.length))
        continue
      }
      const part = await reader.read()
      if (part.done) throw new Error('Stream ended')
      buffer += decoder.decode(part.value, { stream: true }).replace(/\\r\\n/g, '\\n')
    }
  }

  assert.deepEqual(await nextNotice(), { topic: 'workspaces', key: 'host', version: 0 })

  const added = await call('workspaces', 'POST', { folder, expectedVersion: 0 })
  assert.equal(added.status, 200)
  assert.equal(added.data.version, 1)
  assert.deepEqual(await nextNotice(), { topic: 'workspaces', key: 'host', version: 1 })

  const stale = await call(\`workspaces/\${added.data.selectedId}\`, 'PUT', { name: 'Old', expectedVersion: 0 })
  assert.deepEqual([stale.status, stale.data.error.code], [409, 'WORKSPACES_STALE'])

  const chat = (await call('sessions', 'POST', {})).data
  assert.equal(chat.workspaceId, added.data.selectedId)

  const noticeAfterRemove = nextNotice()
  const removed = await call(\`workspaces/\${added.data.selectedId}\`, 'DELETE', { expectedVersion: 1 })
  assert.equal(removed.status, 200)
  assert.equal(removed.data.version, 2)
  assert.deepEqual(await noticeAfterRemove, { topic: 'workspaces', key: 'host', version: 2 })
  const sessionsAfterNotice = (await call('sessions')).data
  assert.equal(sessionsAfterNotice.find(item => item.sessionId === chat.sessionId).workspaceId, null)
})
`
writeFileSync(
  'e2e/local-foundation.test.mjs',
  readFileSync('e2e/local-foundation.test.mjs', 'utf8').replace(/\r\n/g, '\n') + extraFoundationTest,
)

edit('e2e/model-requests.test.mjs', [
  [
    "  const added = (await call('workspaces', 'POST', { folder: project })).data\n",
    "  const added = (await call('workspaces', 'POST', { folder: project, expectedVersion: 0 })).data\n",
    1,
  ],
  [
    "  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE')).data.error.code, 'WORKSPACE_REQUEST_ACTIVE')\n",
    "  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE', { expectedVersion: added.version })).data.error.code, 'WORKSPACE_REQUEST_ACTIVE')\n",
    1,
  ],
  [
    "    (await call(`workspaces/${workspaceId}/folder`, 'PUT', { folder: moved })).data.error.code,\n",
    "    (await call(`workspaces/${workspaceId}/folder`, 'PUT', { folder: moved, expectedVersion: added.version })).data.error.code,\n",
    1,
  ],
  [
    "  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE')).status, 200)\n",
    "  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE', { expectedVersion: added.version })).status, 200)\n",
    1,
  ],
])

edit('apps/host/tests/brief-host.test.mjs', [
  [
    "  await f.call('workspaces', 'POST', { folder: project })\n",
    "  await f.call('workspaces', 'POST', { folder: project, expectedVersion: 0 })\n",
    1,
  ],
])

edit('e2e/generation-bridge.test.mjs', [
  [
    "  assert.equal((await f.call('workspaces', 'POST', { folder: project })).status, 200)\n",
    "  assert.equal((await f.call('workspaces', 'POST', { folder: project, expectedVersion: 0 })).status, 200)\n",
    1,
  ],
])

edit('e2e/source-requests.test.mjs', [
  [
    "  assert.equal((await f.call('workspaces', 'POST', { folder: f.source })).status, 200)\n",
    "  assert.equal((await f.call('workspaces', 'POST', { folder: f.source, expectedVersion: 0 })).status, 200)\n",
    1,
  ],
])

edit('e2e/opencode-source-live.test.mjs', [
  [
    "  await api('workspaces', 'POST', { folder: project })\n",
    "  await api('workspaces', 'POST', { folder: project, expectedVersion: 0 })\n",
    1,
  ],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`task24-edits: ${changed} files changed, 0 failures`)
```

Run from the repository root: `node <temporary folder>/deckagent-task24-edits.mjs`

Expected: PASS. The output is `task24-edits: 14 files changed, 0 failures`.

- [ ] **Step 4: Build and run the checks**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 exec biome format apps/host/src/modules apps/host/src/server.ts packages/host/contracts/src/management.ts apps/web/src/browser/transport/management-decoders.ts apps/web/src/browser/transport/management-client.ts apps/web/src/browser/chat-navigation.ts apps/web/src/browser/features/workspaces/workspace-view.ts apps/host/tests/workspace-registry.test.mjs apps/host/tests/brief-host.test.mjs`

Expected: PASS. The output contains `No fixes applied` and does not contain `format ━`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `git grep -n "function field(" -- apps/host/src/modules/workspaces`

Expected: PASS. The command prints no line and exits with code 1.

Run: `git grep -n " as " -- apps/host/src/modules/workspaces/folder-policy.ts`

Expected: PASS. The command prints no line and exits with code 1.

- [ ] **Step 5: Run the non-live suites**

Run each command below in order. For each command, write the exit code and the `# pass` and `# fail` lines in the report. When a command fails, run it one more time. When it fails two times, STOP.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 8`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 47`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 13`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [ ] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths in any order, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
 M apps/host/src/modules/workspaces/contracts.ts
 M apps/host/src/modules/workspaces/folder-policy.ts
 M apps/host/src/modules/workspaces/schema.ts
 M apps/host/src/modules/workspaces/workspaces.errors.ts
 M apps/host/src/modules/workspaces/workspaces.routes.ts
 M apps/host/src/modules/workspaces/workspaces.service.ts
 M apps/host/src/modules/workspaces/workspaces.store.ts
 M apps/host/src/server.ts
 M apps/host/tests/brief-host.test.mjs
 M apps/host/tests/workspace-registry.test.mjs
 M apps/web/src/browser/chat-navigation.ts
 M apps/web/src/browser/features/workspaces/workspace-view.ts
 M apps/web/src/browser/transport/management-client.ts
 M apps/web/src/browser/transport/management-decoders.ts
 M e2e/generation-bridge.test.mjs
 M e2e/local-foundation.test.mjs
 M e2e/model-requests.test.mjs
 M e2e/opencode-source-live.test.mjs
 M e2e/source-requests.test.mjs
 M packages/host/contracts/src/management.ts
```

- [ ] **Step 7: Write the report file**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 24 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-24-add-workspaces-version-and-notices.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-24-add-workspaces-version-and-notices.md` with:
   - H1 `# Task 24: Add version, schema 2 upgrade, expectedVersion and ChangeFeed wiring to the workspaces module report` and the purpose line `Read this file to learn how the workspaces module upgrades to schema 2, checks expectedVersion and publishes change notices, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - The suite table from Step 5.
   - What the commands do not prove: the Browser does not open `/api/changes` yet and does not show the `WORKSPACES_STALE` message yet. Task 25 adds that Browser behavior and its real-browser test.
3. Add a row for Task 24 in `docs/build/refactor/target-structure/reports/README.md`. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 7 as `- [x]`.

- [ ] **Step 8: Commit and push**

Do this step only when Steps 1 to 7 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`:

   ```text
   - Upgrade `workspaces.sqlite` to schema 2 with `change_versions`, check `expectedVersion` (`409 WORKSPACES_STALE`) inside transactions, replace `field` in `workspaces.routes.ts` with Zod body decoders, and publish `workspaces` notices on `GET /api/changes` after commit and chat ungrouping. Task 24 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 8 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "feat: add version, schema 2 upgrade and change notices to workspaces"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start Task 25 until a person approves the report.
