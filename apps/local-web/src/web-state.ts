import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import type { ActivityEvent, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import { HttpError, validateUserQuestion } from '@deckagent/host-api'
import type { RequestSnapshot, StoredActivity, StoredRequest, WebSession, WebSettings } from '@deckagent/host-api'
import type { SqliteSessionStore, SessionInfo } from '@deckagent/session-persistence'
import { WorkspaceRegistry } from './workspace-registry.ts'

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
  readonly workspaces: WorkspaceRegistry

  constructor(
    path: string,
    private readonly sessions: SqliteSessionStore,
    private readonly settings: () => WebSettings,
    internalRoots: readonly string[] = [],
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
      if (fresh)
        this.db.exec(`
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
          "UPDATE requests SET payload=json_set(payload, '$.status', 'unknown', '$.revision', COALESCE(json_extract(payload,'$.revision'),0)+1) WHERE json_extract(payload, '$.status') IN ('running','awaiting_user')",
        )
        .run()
      if (this.db.prepare('PRAGMA quick_check').get()!.quick_check !== 'ok')
        throw new HttpError(500, 'SETTINGS_STORAGE')
      this.db.exec('COMMIT')
      this.workspaces = new WorkspaceRegistry(this.db, internalRoots)
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

  private async project(info: SessionInfo): Promise<WebSession> {
    const history = await this.sessions.read(info.sessionId)
    const first = history
      .find(message => message.role === 'user')
      ?.content.replace(/\s+/g, ' ')
      .trim()
    const title = first ? (first.length > 64 ? `${first.slice(0, 64)}…` : first) : 'New chat'
    const row = this.db
      .prepare('SELECT sequence,payload FROM requests WHERE session_id=? ORDER BY sequence DESC LIMIT 1')
      .get(info.sessionId)
    const latest = row ? this.readRequest(String(row.payload)) : undefined
    return {
      ...info,
      title,
      selectable: this.selectable(info.selection),
      ...(latest
        ? {
            latestRequest: {
              requestId: latest.requestId,
              status: latest.status,
              sequence: Number(row!.sequence),
              ...(latest.revision === undefined ? {} : { revision: latest.revision }),
            },
          }
        : {}),
    }
  }

  async list(): Promise<readonly WebSession[]> {
    return Promise.all((await this.sessions.list()).map(info => this.project(info)))
  }

  async create(value: unknown): Promise<WebSession> {
    if (
      !record(value) ||
      Object.keys(value).some(key => !['selection', 'workspaceId'].includes(key)) ||
      (value.workspaceId !== undefined && typeof value.workspaceId !== 'string')
    )
      throw new HttpError(400, 'INVALID_SESSION')
    const workspaceId = typeof value.workspaceId === 'string' ? value.workspaceId : 'default'
    if (!this.workspaces.exists(workspaceId)) throw new HttpError(404, 'WORKSPACE_NOT_FOUND')
    const chosen = value.selection === undefined ? undefined : selection(value.selection)
    if (chosen && !this.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
    const sessionId = `chat-${randomUUID()}`
    await this.sessions.open(sessionId)
    if (!this.workspaces.exists(workspaceId)) throw new HttpError(409, 'WORKSPACE_NOT_FOUND')
    await this.sessions.assignWorkspace(sessionId, workspaceId)
    if (chosen) await this.sessions.select(sessionId, chosen)
    return this.project((await this.sessions.getInfo(sessionId))!)
  }

  async select(id: string, value: unknown): Promise<WebSession> {
    const chosen = selection(value)
    if (!this.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
    if (!(await this.sessions.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
    return this.project(await this.sessions.select(id, chosen))
  }

  async reconcileWorkspaces(): Promise<void> {
    for (const id of this.workspaces.removed()) await this.sessions.detachWorkspace(id)
  }

  async removeWorkspace(id: string): Promise<void> {
    this.workspaces.remove(id)
    await this.sessions.detachWorkspace(id)
  }

  saveActivity(sessionId: string, requestId: string, event: ActivityEvent): void {
    const now = Date.now()
    const timing = event.status === 'running' ? { startedAt: now } : { endedAt: now }
    this.db
      .prepare(`INSERT INTO activities(session_id, request_id, activity_id, payload) VALUES (?, ?, ?, ?)
      ON CONFLICT(request_id, activity_id) DO UPDATE SET payload=json_set(excluded.payload,
        '$.startedAt', COALESCE(json_extract(activities.payload,'$.startedAt'),json_extract(excluded.payload,'$.startedAt')))`)
      .run(sessionId, requestId, event.id, JSON.stringify({ ...event, ...timing }))
  }

  startRequest(sessionId: string, requestId: string, chosen: ModelSelection, historyStart: number): void {
    this.db
      .prepare('INSERT INTO requests(id, session_id, payload) VALUES (?, ?, ?)')
      .run(
        requestId,
        sessionId,
        JSON.stringify({ requestId, selection: chosen, status: 'running', historyStart, revision: 1 }),
      )
  }

  finishRequest(requestId: string, result: TurnResult, noticeIndex?: number): void {
    this.db
      .prepare(
        "UPDATE requests SET payload=json_set(payload, '$.status', ?, '$.errorCode', ?, '$.noticeIndex', ?, '$.revision', COALESCE(json_extract(payload,'$.revision'),0)+1) WHERE id=?",
      )
      .run(result.status, result.status === 'completed' ? null : result.error.code, noticeIndex ?? null, requestId)
  }

  requestState(snapshot: RequestSnapshot): void {
    this.db
      .prepare(
        "UPDATE requests SET payload=json_set(payload, '$.status', ?, '$.question', json(?), '$.revision', ?) WHERE id=? AND session_id=?",
      )
      .run(
        snapshot.status,
        JSON.stringify(snapshot.question ?? null),
        snapshot.revision ?? 0,
        snapshot.requestId,
        snapshot.sessionId,
      )
  }

  requests(id: string): readonly StoredRequest[] {
    return this.db
      .prepare('SELECT payload FROM requests WHERE session_id=? ORDER BY sequence')
      .all(id)
      .map(row => this.readRequest(String(row.payload)))
  }

  private readRequest(payload: string): StoredRequest {
    const value: unknown = JSON.parse(payload)
    if (
      !record(value) ||
      (value.revision !== undefined &&
        (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0)) ||
      typeof value.requestId !== 'string' ||
      !record(value.selection) ||
      typeof value.selection.provider !== 'string' ||
      typeof value.selection.model !== 'string' ||
      (value.status !== 'running' &&
        value.status !== 'awaiting_user' &&
        value.status !== 'completed' &&
        value.status !== 'failed' &&
        value.status !== 'cancelled' &&
        value.status !== 'unknown') ||
      (value.errorCode != null && (typeof value.errorCode !== 'string' || !/^[A-Z_]{1,64}$/.test(value.errorCode))) ||
      (value.historyStart !== undefined &&
        (typeof value.historyStart !== 'number' ||
          !Number.isSafeInteger(value.historyStart) ||
          value.historyStart < 0)) ||
      (value.noticeIndex != null &&
        (typeof value.noticeIndex !== 'number' || !Number.isSafeInteger(value.noticeIndex) || value.noticeIndex < 0))
    )
      throw new HttpError(500, 'ACTIVITY_STORAGE')
    if (value.status === 'awaiting_user' && value.question == null) throw new HttpError(500, 'ACTIVITY_STORAGE')
    return {
      requestId: value.requestId,
      ...(typeof value.revision === 'number' ? { revision: value.revision } : {}),
      selection: { provider: value.selection.provider, model: value.selection.model },
      status: value.status,
      ...(value.question == null ? {} : { question: validateUserQuestion(value.question) }),
      ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
      ...(typeof value.historyStart === 'number' ? { historyStart: value.historyStart } : {}),
      ...(typeof value.noticeIndex === 'number' ? { noticeIndex: value.noticeIndex } : {}),
    }
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
          (event.startedAt != null &&
            (typeof event.startedAt !== 'number' || !Number.isFinite(event.startedAt) || event.startedAt < 0)) ||
          (event.endedAt != null &&
            (typeof event.endedAt !== 'number' || !Number.isFinite(event.endedAt) || event.endedAt < 0)) ||
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
          ...(typeof event.startedAt === 'number' ? { startedAt: event.startedAt } : {}),
          ...(typeof event.endedAt === 'number' ? { endedAt: event.endedAt } : {}),
        }
      })
  }

  close(): void {
    this.db.close()
  }
}
