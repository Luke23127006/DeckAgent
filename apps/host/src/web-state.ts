import { DatabaseSync } from 'node:sqlite'
import type { WebPreferences } from '@deckagent/host-contracts'
import type { ModelSelection } from '@deckagent/session-persistence'

export type WebStateErrorCode =
  | 'INVALID_SELECTION'
  | 'INVALID_REQUEST'
  | 'SETTINGS_SCHEMA'
  | 'SETTINGS_STORAGE'
  | 'PREFERENCES_STALE'

const applicationId = 1145132866
const schemaVersion = 3

const changeVersionsTable = `
  CREATE TABLE change_versions (
    topic TEXT NOT NULL,
    key TEXT NOT NULL,
    version INTEGER NOT NULL CHECK (version >= 0),
    PRIMARY KEY (topic, key)
  ) STRICT;
  INSERT INTO change_versions (topic, key, version) VALUES ('providers', 'host', 0);
  INSERT INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0);
`

export class WebStateError extends Error {
  constructor(readonly code: WebStateErrorCode) {
    super(code)
  }
}

export function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function selection(value: unknown): ModelSelection {
  if (
    !record(value) ||
    Object.keys(value).some(key => !['provider', 'model'].includes(key)) ||
    typeof value.provider !== 'string' ||
    typeof value.model !== 'string' ||
    !/^[\w.-]{1,100}$/.test(value.provider) ||
    !value.model.trim() ||
    value.model.length > 200
  ) {
    throw new WebStateError('INVALID_SELECTION')
  }
  return { provider: value.provider, model: value.model }
}

/**
 * Web UI projection, preferences and the provider metadata table. Workspaces belong to the Workspace registry;
 * chats, requests and their events to Session persistence; this file keeps no second registry of any of them.
 */
export class WebState {
  readonly db: DatabaseSync

  constructor(
    path: string,
    private readonly isSelectable: (selection: ModelSelection) => boolean,
    private readonly onPreferencesChanged?: (version: number) => void,
  ) {
    this.db = new DatabaseSync(path)
    try {
      const ownerRow = this.db.prepare('PRAGMA application_id').get()
      const versionRow = this.db.prepare('PRAGMA user_version').get()
      if (!ownerRow || !versionRow) throw new WebStateError('SETTINGS_SCHEMA')
      const owner = Number(ownerRow.application_id)
      const version = Number(versionRow.user_version)
      const fresh =
        owner === 0 &&
        version === 0 &&
        !this.db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
      if (!fresh && (owner !== applicationId || (version !== 1 && version !== 2 && version !== schemaVersion)))
        throw new WebStateError('SETTINGS_SCHEMA')
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;')
      // Requests and activities moved to Session persistence (B02); older files keep their unused tables unchanged.
      if (fresh)
        this.db.exec(`
        CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT;
        ${changeVersionsTable}
        PRAGMA application_id=${applicationId}; PRAGMA user_version=${schemaVersion};`)
      else if (version === 1)
        this.db.exec(`
        ${changeVersionsTable}
        PRAGMA user_version=${schemaVersion};`)
      else if (version === 2)
        this.db.exec(`
        INSERT OR IGNORE INTO change_versions (topic, key, version) VALUES ('preferences', 'host', 0);
        PRAGMA user_version=${schemaVersion};`)
      // Added after schema version 1 shipped: created on demand so existing data files keep working.
      this.db.exec('CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT')
      this.db.prepare('SELECT id, payload FROM providers LIMIT 0').all()
      this.db.prepare('SELECT topic, key, version FROM change_versions LIMIT 0').all()
      if (this.db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw new WebStateError('SETTINGS_STORAGE')
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.close()
      throw error
    }
  }

  preferencesVersion(): number {
    const row = this.db
      .prepare("SELECT version FROM change_versions WHERE topic = 'preferences' AND key = 'host'")
      .get()
    return row ? Number(row.version) : 0
  }

  preferences(): WebPreferences {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key='theme'").get()
    return {
      theme: row?.value === 'light' || row?.value === 'dark' ? row.value : 'system',
      version: this.preferencesVersion(),
    }
  }

  savePreferences(theme: WebPreferences['theme'], expectedVersion: number): WebPreferences {
    this.db.exec('BEGIN IMMEDIATE')
    let version: number
    try {
      if (this.preferencesVersion() !== expectedVersion) throw new WebStateError('PREFERENCES_STALE')
      this.db
        .prepare(
          "INSERT INTO preferences (key, value) VALUES ('theme', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(theme)
      this.db
        .prepare("UPDATE change_versions SET version = version + 1 WHERE topic = 'preferences' AND key = 'host'")
        .run()
      version = this.preferencesVersion()
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
    this.onPreferencesChanged?.(version)
    return { theme, version }
  }

  /** FR-053: the most recent choice of a model in any chat, kept across restarts. */
  rememberSelection(value: ModelSelection): void {
    this.db
      .prepare(
        "INSERT INTO preferences (key, value) VALUES ('lastSelection', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run(JSON.stringify({ provider: value.provider, model: value.model }))
  }

  /** The most recent choice when it is still selectable; otherwise none. No earlier choice is tried. */
  lastSelection(): ModelSelection | undefined {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key='lastSelection'").get()
    if (!row) return undefined
    try {
      const value = selection(JSON.parse(String(row.value)))
      return this.selectable(value) ? value : undefined
    } catch {
      return undefined
    }
  }

  selectable(value: ModelSelection | undefined): boolean {
    return !!value && this.isSelectable(value)
  }

  close(): void {
    this.db.close()
  }
}

export function mapWebStateFailure(error: unknown): { readonly status: number; readonly code: string } | undefined {
  if (!(error instanceof WebStateError)) return undefined
  const status =
    error.code === 'PREFERENCES_STALE'
      ? 409
      : error.code === 'INVALID_SELECTION' || error.code === 'INVALID_REQUEST'
        ? 400
        : 500
  return { status, code: error.code }
}
