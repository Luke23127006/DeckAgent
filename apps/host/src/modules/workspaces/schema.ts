import type { DatabaseSync } from 'node:sqlite'
import { WorkspaceError, defaultWorkspaceId } from './contracts.ts'

const applicationId = 0x44415753 // DAWS; distinguishes this file from another application's SQLite database.
const schemaVersion = 1

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
        PRAGMA application_id = ${applicationId};
        PRAGMA user_version = ${schemaVersion};
      `)
      db.prepare('INSERT INTO workspaces (id, name, is_default, created_at) VALUES (?, ?, 1, ?)').run(
        defaultWorkspaceId,
        defaultName,
        new Date().toISOString(),
      )
      db.prepare("INSERT INTO registry_state (key, value) VALUES ('selected', ?)").run(defaultWorkspaceId)
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
    if (
      !db
        .prepare('SELECT id FROM workspaces WHERE id = ? AND is_default = 1 AND removed_at IS NULL')
        .get(defaultWorkspaceId)
    )
      throw new WorkspaceError('WORKSPACE_STORAGE', 'Workspace database has no default workspace')
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
}
