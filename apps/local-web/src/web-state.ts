import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import type { ActivityEvent, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import { HttpError } from '@deckagent/host-api'
import type { StoredActivity, StoredRequest, WebSession, WebSettings } from '@deckagent/host-api'
import type { SqliteSessionStore, SessionInfo } from '@deckagent/session-persistence'

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

/** Web-only metadata stays outside the Agent file grant and provider prompt history. */
export class WebState {
  readonly db: DatabaseSync

  constructor(
    path: string,
    private readonly sessions: SqliteSessionStore,
    private readonly settings: () => WebSettings,
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
      if (fresh) this.db.exec(`
        CREATE TABLE providers (id TEXT PRIMARY KEY, payload TEXT NOT NULL) STRICT;
        CREATE TABLE activities (
          sequence INTEGER PRIMARY KEY, session_id TEXT NOT NULL, request_id TEXT NOT NULL,
          activity_id TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(request_id, activity_id)
        ) STRICT;
        CREATE TABLE requests (sequence INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, session_id TEXT NOT NULL, payload TEXT NOT NULL) STRICT;
        PRAGMA application_id=1145132866; PRAGMA user_version=1;`)
      this.db.prepare('SELECT id, payload FROM providers LIMIT 0').all()
      this.db.prepare('SELECT sequence, session_id, request_id, activity_id, payload FROM activities LIMIT 0').all()
      this.db.prepare('SELECT sequence, id, session_id, payload FROM requests LIMIT 0').all()
      // No work is replayed after restart. Preserve uncertainty instead of inventing success.
      this.db
        .prepare(
          "UPDATE activities SET payload=json_set(payload, '$.status', 'unknown') WHERE json_extract(payload, '$.status')='running'",
        )
        .run()
      this.db
        .prepare(
          "UPDATE requests SET payload=json_set(payload, '$.status', 'unknown') WHERE json_extract(payload, '$.status')='running'",
        )
        .run()
      if (this.db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok')
        throw new HttpError(500, 'SETTINGS_STORAGE')
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.close()
      throw error
    }
  }

  selectable(value: ModelSelection | undefined): boolean {
    return (
      !!value &&
      this.settings().providers.some(
        provider => provider.id === value.provider && provider.models.includes(value.model),
      )
    )
  }

  private project(info: SessionInfo): WebSession {
    return { ...info, selectable: this.selectable(info.selection) }
  }

  async list(): Promise<readonly WebSession[]> {
    return (await this.sessions.list()).map(info => this.project(info))
  }

  async create(value: unknown): Promise<WebSession> {
    if (!record(value) || Object.keys(value).some(key => key !== 'selection'))
      throw new HttpError(400, 'INVALID_SESSION')
    const chosen = value.selection === undefined ? undefined : selection(value.selection)
    if (chosen && !this.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
    const sessionId = `chat-${randomUUID()}`
    await this.sessions.open(sessionId)
    if (chosen) await this.sessions.select(sessionId, chosen)
    return this.project((await this.sessions.getInfo(sessionId))!)
  }

  async select(id: string, value: unknown): Promise<WebSession> {
    const chosen = selection(value)
    if (!this.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
    if (!(await this.sessions.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
    return this.project(await this.sessions.select(id, chosen))
  }

  saveActivity(sessionId: string, requestId: string, event: ActivityEvent): void {
    this.db
      .prepare(`INSERT INTO activities(session_id, request_id, activity_id, payload) VALUES (?, ?, ?, ?)
      ON CONFLICT(request_id, activity_id) DO UPDATE SET payload=excluded.payload`)
      .run(sessionId, requestId, event.id, JSON.stringify(event))
  }

  startRequest(sessionId: string, requestId: string, chosen: ModelSelection, historyStart: number): void {
    this.db
      .prepare('INSERT INTO requests(id, session_id, payload) VALUES (?, ?, ?)')
      .run(requestId, sessionId, JSON.stringify({ requestId, selection: chosen, status: 'running', historyStart }))
  }

  finishRequest(requestId: string, result: TurnResult): void {
    this.db
      .prepare("UPDATE requests SET payload=json_set(payload, '$.status', ?, '$.errorCode', ?) WHERE id=?")
      .run(result.status, result.status === 'completed' ? null : result.error.code, requestId)
  }

  requests(id: string): readonly StoredRequest[] {
    return this.db
      .prepare('SELECT payload FROM requests WHERE session_id=? ORDER BY sequence')
      .all(id)
      .map(row => {
        const value: unknown = JSON.parse(String(row.payload))
        if (
          !record(value) ||
          typeof value.requestId !== 'string' ||
          !record(value.selection) ||
          typeof value.selection.provider !== 'string' ||
          typeof value.selection.model !== 'string' ||
          (value.status !== 'running' &&
            value.status !== 'completed' &&
            value.status !== 'failed' &&
            value.status !== 'cancelled' &&
            value.status !== 'unknown') ||
          (value.errorCode != null && (typeof value.errorCode !== 'string' || !/^[A-Z_]{1,64}$/.test(value.errorCode))) ||
          (value.historyStart !== undefined && (typeof value.historyStart !== 'number' || !Number.isSafeInteger(value.historyStart) || value.historyStart < 0))
        )
          throw new HttpError(500, 'ACTIVITY_STORAGE')
        return {
          requestId: value.requestId,
          selection: { provider: value.selection.provider, model: value.selection.model },
          status: value.status,
          ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
          ...(typeof value.historyStart === 'number' ? { historyStart: value.historyStart } : {}),
        }
      })
  }

  activities(id: string): readonly StoredActivity[] {
    return this.db
      .prepare('SELECT sequence, request_id, payload FROM activities WHERE session_id=? ORDER BY sequence')
      .all(id)
      .map(row => {
        const event: unknown = JSON.parse(String(row.payload))
        if (
          !record(event) ||
          typeof event.id !== 'string' ||
          typeof event.label !== 'string' ||
          (event.kind !== 'model' && event.kind !== 'tool') ||
          (event.status !== 'running' &&
            event.status !== 'completed' &&
            event.status !== 'failed' &&
            event.status !== 'stopped' &&
            event.status !== 'unknown')
        )
          throw new HttpError(500, 'ACTIVITY_STORAGE')
        return {
          id: event.id,
          label: event.label,
          kind: event.kind,
          status: event.status,
          requestId: String(row.request_id),
          sequence: Number(row.sequence),
        }
      })
  }

  close(): void {
    this.db.close()
  }
}
