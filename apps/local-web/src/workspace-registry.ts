import { randomUUID } from 'node:crypto'
import { access, realpath, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { Workspace } from '@deckagent/host-api'

interface Folder {
  readonly path: string
  readonly dev: number
  readonly ino: number
}

function inside(parent: string, child: string): boolean {
  const path = relative(parent, child)
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}

/** Workspace setup stores folder identity, never folder contents. Owned by Local Web. */
export class WorkspaceRegistry {
  constructor(
    private readonly db: DatabaseSync,
    private readonly internalRoots: readonly string[],
  ) {
    db.exec(`CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, path TEXT, device REAL, inode REAL, removed INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    CREATE UNIQUE INDEX IF NOT EXISTS workspace_folder ON workspaces(path) WHERE removed=0 AND path IS NOT NULL;
    INSERT INTO workspaces(id,name) VALUES ('default','Default Workspace') ON CONFLICT(id) DO NOTHING;`)
  }

  exists(id: string): boolean {
    return !!this.db.prepare('SELECT id FROM workspaces WHERE id=? AND removed=0').get(id)
  }

  removed(): readonly string[] {
    return this.db
      .prepare('SELECT id FROM workspaces WHERE removed=1')
      .all()
      .map(row => String(row.id))
  }

  async list(): Promise<readonly Workspace[]> {
    return Promise.all(
      this.db
        .prepare("SELECT id FROM workspaces WHERE removed=0 ORDER BY id != 'default', name, id")
        .all()
        .map(row => this.get(String(row.id))),
    )
  }

  async get(id: string): Promise<Workspace> {
    const row = this.row(id)
    if (row.path === null) return { id, name: String(row.name), state: 'available' }
    const available = await this.source(id)
    return { id, name: String(row.name), projectFolder: String(row.path), state: available ? 'available' : 'missing' }
  }

  async source(
    id: string,
  ): Promise<
    { readonly sourceRoot: string; readonly sourceIdentity: { readonly dev: number; readonly ino: number } } | undefined
  > {
    const row = this.row(id)
    if (row.path === null) return undefined
    try {
      const folder = await this.folder(String(row.path))
      if (folder.path !== row.path || folder.dev !== row.device || folder.ino !== row.inode) return undefined
      return { sourceRoot: folder.path, sourceIdentity: { dev: folder.dev, ino: folder.ino } }
    } catch {
      return undefined
    }
  }

  async add(value: unknown): Promise<Workspace> {
    const input = this.input(value)
    const folder = await this.folder(input.projectFolder)
    const duplicate = this.db.prepare('SELECT id FROM workspaces WHERE path=? AND removed=0').get(folder.path)
    if (duplicate) return this.get(String(duplicate.id))
    const id = `workspace-${randomUUID()}`
    this.db
      .prepare('INSERT INTO workspaces(id,name,path,device,inode) VALUES (?,?,?,?,?)')
      .run(id, input.name ?? (basename(folder.path) || 'Workspace'), folder.path, folder.dev, folder.ino)
    return this.get(id)
  }

  remove(id: string): void {
    this.mutable(id)
    this.db.prepare('UPDATE workspaces SET removed=1 WHERE id=?').run(id)
  }

  async repoint(id: string, value: unknown): Promise<Workspace> {
    this.mutable(id)
    const folder = await this.folder(this.input(value, false).projectFolder)
    this.mutable(id)
    const duplicate = this.db
      .prepare('SELECT id FROM workspaces WHERE path=? AND removed=0 AND id != ?')
      .get(folder.path, id)
    if (duplicate) throw new HttpError(409, 'WORKSPACE_FOLDER_IN_USE')
    this.db
      .prepare('UPDATE workspaces SET path=?,device=?,inode=? WHERE id=?')
      .run(folder.path, folder.dev, folder.ino, id)
    return this.get(id)
  }

  private row(id: string) {
    if (!/^[\w-]{1,100}$/.test(id)) throw new HttpError(400, 'INVALID_WORKSPACE')
    const row = this.db.prepare('SELECT * FROM workspaces WHERE id=? AND removed=0').get(id)
    if (!row) throw new HttpError(404, 'WORKSPACE_NOT_FOUND')
    return row
  }

  private mutable(id: string): void {
    this.row(id)
    if (id === 'default') throw new HttpError(409, 'WORKSPACE_DEFAULT')
  }

  private input(value: unknown, allowName = true): { projectFolder: string; name?: string } {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('projectFolder' in value) ||
      typeof value.projectFolder !== 'string' ||
      !value.projectFolder.trim() ||
      value.projectFolder.length > 4096 ||
      value.projectFolder.includes('\0') ||
      !isAbsolute(value.projectFolder) ||
      Object.keys(value).some(key => key !== 'projectFolder' && !(allowName && key === 'name')) ||
      ('name' in value && (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100))
    )
      throw new HttpError(400, 'INVALID_WORKSPACE')
    return {
      projectFolder: value.projectFolder,
      ...('name' in value && typeof value.name === 'string' ? { name: value.name.trim() } : {}),
    }
  }

  private async folder(path: string): Promise<Folder> {
    try {
      const canonical = await realpath(resolve(path))
      if (this.internalRoots.some(root => inside(root, canonical) || inside(canonical, root)))
        throw new HttpError(409, 'WORKSPACE_STORAGE_OVERLAP')
      const info = await stat(canonical)
      if (!info.isDirectory()) throw new Error('Not a directory')
      await access(canonical, constants.R_OK)
      return { path: canonical, dev: info.dev, ino: info.ino }
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(400, 'WORKSPACE_FOLDER_UNAVAILABLE')
    }
  }
}
