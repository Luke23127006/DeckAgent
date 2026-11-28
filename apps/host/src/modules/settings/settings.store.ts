import type { DatabaseSync } from 'node:sqlite'
import { decodeModelSelection, type ModelSelection, type WebPreferences } from '@deckagent/host-contracts'
import { SettingsError } from './settings.errors.ts'

/** Durable SQLite store for Host preferences and last model selection in `web.sqlite`. */
export class SqliteSettingsStore {
  constructor(
    private readonly db: DatabaseSync,
    private readonly onPreferencesChanged?: (version: number) => void,
  ) {}

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
      if (this.preferencesVersion() !== expectedVersion) throw new SettingsError('PREFERENCES_STALE')
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

  readLastSelection(): ModelSelection | undefined {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key='lastSelection'").get()
    if (!row) return undefined
    try {
      return decodeModelSelection(JSON.parse(String(row.value)))
    } catch {
      return undefined
    }
  }
}
