import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { SessionError } from './contracts.ts'
import type { ChatSummary, Message, ModelSelection, SessionInfo } from './contracts.ts'
import { chatMatches, chatTitle, searchWords, validateMessage } from './message.ts'
import { defaultWorkspaceId, initialize } from './schema.ts'

export type { ChatSummary, JsonValue, Message, ModelSelection, ProviderState, SessionInfo, ToolCall } from './contracts.ts'
export { SessionError } from './contracts.ts'
export { chatTitle } from './message.ts'
export { MemoryDraftStore, draftLimit } from './draft-store.ts'

/** Local durable storage of chats and their conversations. The application owns close(). */
export class SqliteSessionStore {
  private readonly db: DatabaseSync
  private closed = false

  constructor(path: string) {
    let db: DatabaseSync | undefined
    try {
      if (!path.trim() || path === ':memory:') throw new SessionError('SESSION_CONFIG', 'A durable database file path is required')
      mkdirSync(dirname(path), { recursive: true })
      db = new DatabaseSync(path)
      initialize(db)
      this.db = db
    } catch (error) {
      db?.close()
      if (error instanceof SessionError) throw error
      throw new SessionError('SESSION_STORAGE', 'Cannot open Session database. Check the data directory, file integrity and write permissions')
    }
  }

  /** Create an empty chat if absent; otherwise open its existing history. New chats join the default workspace. */
  async open(sessionId: string): Promise<void> {
    this.access(() => this.ensure(sessionId, defaultWorkspaceId))
  }

  /** A new chat: its own ID, no conversation, in the given workspace. Takes nothing from another chat. */
  async create(workspaceId: string, selection?: ModelSelection): Promise<SessionInfo> {
    return this.access(() => this.transaction(() => {
      if (!workspaceId.trim()) throw new SessionError('SESSION_CONFIG', 'Workspace ID must not be empty')
      if (selection) this.validateSelection(selection)
      const sessionId = `chat-${randomUUID()}`
      this.ensure(sessionId, workspaceId)
      if (selection) this.db.prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?').run(selection.provider, selection.model, sessionId)
      return this.info(sessionId)!
    }))
  }

  /** Bind the app's model choice once; existing conversations cannot silently change it. */
  async bind(sessionId: string, selection: ModelSelection): Promise<SessionInfo> {
    return this.access(() => this.transaction(() => {
      this.validateSelection(selection)
      this.ensure(sessionId, defaultWorkspaceId)
      const current = this.info(sessionId)!
      if (current.selection && (current.selection.provider !== selection.provider || current.selection.model !== selection.model)) {
        throw new SessionError('SESSION_CONFLICT', 'Session uses a different provider or model. Choose another session ID')
      }
      this.db.prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?').run(selection.provider, selection.model, sessionId)
      return this.info(sessionId)!
    }))
  }

  async getInfo(sessionId: string): Promise<SessionInfo | undefined> {
    return this.access(() => { this.validateId(sessionId); return this.info(sessionId) })
  }

  /** Web selection affects future requests only; callers capture it at request admission. */
  async select(sessionId: string, selection: ModelSelection): Promise<SessionInfo> {
    return this.access(() => this.transaction(() => {
      this.requireSession(sessionId)
      this.validateSelection(selection)
      this.db.prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?').run(selection.provider, selection.model, sessionId)
      return this.info(sessionId)!
    }))
  }

  async list(): Promise<readonly SessionInfo[]> {
    return this.access(() => this.db.prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id').all().map(row => this.info(String(row.id))!))
  }

  /** Every chat with its name. A chat whose saved work cannot be read stays listed as unreadable. */
  async chats(): Promise<readonly ChatSummary[]> {
    return this.access(() => this.db.prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id').all().map(row => {
      const info = this.info(String(row.id))!
      try {
        return { ...info, title: chatTitle(this.messages(info.sessionId)), readable: true }
      } catch (error) {
        if (error instanceof SessionError && error.code === 'SESSION_CORRUPT') return { ...info, title: '', readable: false }
        throw error
      }
    }))
  }

  /**
   * Chats among `chatIds` whose name or own conversation holds every word.
   * Each chat is matched against its own history only; unreadable chats never match.
   */
  async search(words: string, chatIds: readonly string[]): Promise<readonly string[]> {
    return this.access(() => {
      const terms = searchWords(words)
      return chatIds.filter(id => {
        this.validateId(id)
        if (!this.info(id)) return false
        try {
          const history = this.messages(id)
          return chatMatches(chatTitle(history), history, terms)
        } catch (error) {
          if (error instanceof SessionError && error.code === 'SESSION_CORRUPT') return false
          throw error
        }
      })
    })
  }

  /** Chats of a removed workspace become ungrouped, with their conversations and selected models. */
  async ungroup(workspaceId: string): Promise<void> {
    this.access(() => { this.db.prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?').run(workspaceId) })
  }

  /** Startup reconciliation: a chat of a workspace that is no longer set up becomes ungrouped. */
  async ungroupExcept(workspaceIds: readonly string[]): Promise<void> {
    this.access(() => this.transaction(() => {
      const keep = new Set(workspaceIds)
      const update = this.db.prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?')
      for (const row of this.db.prepare('SELECT DISTINCT workspace_id FROM sessions WHERE workspace_id IS NOT NULL').all()) {
        if (!keep.has(String(row.workspace_id))) update.run(String(row.workspace_id))
      }
    }))
  }

  async read(sessionId: string): Promise<readonly Message[]> {
    return this.access(() => {
      this.requireSession(sessionId)
      return this.messages(sessionId)
    })
  }

  async append(sessionId: string, messages: readonly Message[]): Promise<void> {
    this.access(() => this.transaction(() => {
      this.requireSession(sessionId)
      const row = this.db.prepare('SELECT COALESCE(MAX(sequence), 0) AS last FROM messages WHERE session_id = ?').get(sessionId)!
      let sequence = Number(row.last)
      const insert = this.db.prepare('INSERT INTO messages (session_id, sequence, payload) VALUES (?, ?, ?)')
      for (const message of messages) {
        validateMessage(message)
        insert.run(sessionId, ++sequence, JSON.stringify(message))
      }
      if (messages.length) this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)
    }))
  }

  close(): void {
    if (this.closed) return
    this.db.close()
    this.closed = true
  }

  private access<T>(operation: () => T): T {
    if (this.closed) throw new SessionError('SESSION_CLOSED', 'Session storage is closed')
    try { return operation() }
    catch (error) {
      if (error instanceof SessionError) throw error
      throw new SessionError('SESSION_STORAGE', 'Session storage operation failed')
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

  private messages(sessionId: string): readonly Message[] {
    return this.db.prepare('SELECT payload FROM messages WHERE session_id = ? ORDER BY sequence').all(sessionId)
      .map(row => {
        try {
          const message: unknown = JSON.parse(String(row.payload))
          validateMessage(message)
          return message
        } catch { throw new SessionError('SESSION_CORRUPT', 'Stored message does not match the supported Session format') }
      })
  }

  private validateSelection(selection: ModelSelection): void {
    if (!selection.provider.trim() || !selection.model.trim()) throw new SessionError('SESSION_CONFIG', 'Provider and model are required')
  }

  private validateId(sessionId: string): void {
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new SessionError('SESSION_CONFIG', 'Session ID must not be empty')
  }

  private ensure(sessionId: string, workspaceId: string): void {
    this.validateId(sessionId)
    const now = new Date().toISOString()
    this.db.prepare('INSERT INTO sessions (id, created_at, updated_at, workspace_id) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING')
      .run(sessionId, now, now, workspaceId)
  }

  private requireSession(sessionId: string): void {
    this.validateId(sessionId)
    if (!this.info(sessionId)) throw new SessionError('SESSION_NOT_FOUND', 'Session does not exist')
  }

  private info(sessionId: string): SessionInfo | undefined {
    const row = this.db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s WHERE id = ?`).get(sessionId)
    if (!row) return undefined
    return {
      sessionId: String(row.id), createdAt: String(row.created_at), updatedAt: String(row.updated_at), messageCount: Number(row.message_count),
      workspaceId: row.workspace_id === null ? null : String(row.workspace_id),
      ...(row.provider !== null ? { selection: { provider: String(row.provider), model: String(row.model) } } : {}),
    }
  }
}
