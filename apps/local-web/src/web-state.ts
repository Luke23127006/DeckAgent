import { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { WebPreferences, WebSession } from '@deckagent/host-api'
import type { ChatSummary, ModelSelection } from '@deckagent/session-persistence'

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
    throw new HttpError(400, 'INVALID_SELECTION')
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
  ) {
    this.db = new DatabaseSync(path)
    try {
      const owner = Number(this.db.prepare('PRAGMA application_id').get()!.application_id)
      const version = Number(this.db.prepare('PRAGMA user_version').get()!.user_version)
      const fresh =
        owner === 0 &&
        version === 0 &&
        !this.db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()
      if (!fresh && (owner !== 0x44415742 || version !== 1)) throw new HttpError(500, 'SETTINGS_SCHEMA')
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;')
      // Requests and activities moved to Session persistence (B02); older files keep their unused tables unchanged.
      if (fresh) this.db.exec(`
        CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT;
        PRAGMA application_id=1145132866; PRAGMA user_version=1;`)
      // Added after schema version 1 shipped: created on demand so existing data files keep working.
      this.db.exec('CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT')
      this.db.prepare('SELECT id, payload FROM providers LIMIT 0').all()
      if (this.db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok')
        throw new HttpError(500, 'SETTINGS_STORAGE')
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.close()
      throw error
    }
  }

  preferences(): WebPreferences {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key='theme'").get()
    return { theme: row?.value === 'light' || row?.value === 'dark' ? row.value : 'system' }
  }

  savePreferences(value: unknown): WebPreferences {
    if (!record(value) || Object.keys(value).some(key => key !== 'theme') || (value.theme !== 'light' && value.theme !== 'dark' && value.theme !== 'system'))
      throw new HttpError(400, 'INVALID_REQUEST')
    this.db.prepare("INSERT INTO preferences (key, value) VALUES ('theme', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(value.theme)
    return this.preferences()
  }

  /** FR-053: the most recent choice of a model in any chat, kept across restarts. */
  rememberSelection(value: ModelSelection): void {
    this.db
      .prepare("INSERT INTO preferences (key, value) VALUES ('lastSelection', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
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

  /** Browser projection of a chat. A chat with no user message yet is shown as a new chat. */
  project(chat: ChatSummary, hasSlides: boolean): WebSession {
    return {
      sessionId: chat.sessionId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messageCount,
      workspaceId: chat.workspaceId,
      readable: chat.readable,
      title: chat.title || 'New chat',
      hasSlides,
      selectable: this.selectable(chat.selection),
      ...(chat.selection ? { selection: chat.selection } : {}),
      ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),
    }
  }

  close(): void {
    this.db.close()
  }
}
