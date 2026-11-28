import type { DatabaseSync } from 'node:sqlite'
import {
  type BackgroundId,
  backgroundIds,
  decodeModelSelection,
  type ModelSelection,
  type WebPreferences,
} from '@deckagent/host-contracts'
import { SettingsError } from './settings.errors.ts'

/** The preferences that one write changes. */
export interface PreferencesChange {
  readonly theme?: WebPreferences['theme']
  readonly background?: BackgroundId
}

function isBackground(value: unknown): value is BackgroundId {
  return typeof value === 'string' && (backgroundIds as readonly string[]).includes(value)
}

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
    const rows = this.db.prepare("SELECT key, value FROM preferences WHERE key IN ('theme', 'background')").all()
    const stored = (key: string): unknown => rows.find(row => row.key === key)?.value
    const theme = stored('theme')
    const background = stored('background')
    return {
      theme: theme === 'light' || theme === 'dark' ? theme : 'system',
      // `/theme.js` writes this value into the page, so a stored value outside the list is never returned.
      background: isBackground(background) ? background : 'none',
      version: this.preferencesVersion(),
    }
  }

  /** Saves the preferences that `change` contains. The other preferences keep their saved values. */
  savePreferences(change: PreferencesChange, expectedVersion: number): WebPreferences {
    this.db.exec('BEGIN IMMEDIATE')
    let version: number
    try {
      if (this.preferencesVersion() !== expectedVersion) throw new SettingsError('PREFERENCES_STALE')
      const save = this.db.prepare(
        'INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      )
      if (change.theme !== undefined) save.run('theme', change.theme)
      if (change.background !== undefined) save.run('background', change.background)
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
    return this.preferences()
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
