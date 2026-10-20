import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { RuntimeError } from '@deckagent/agent-runtime'
import type { Message, ModelSelection, SessionStore } from '@deckagent/agent-runtime'
import { validateMessage } from './message.ts'
import { initialize } from './schema.ts'

export interface SessionInfo {
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly selection?: ModelSelection
  readonly messageCount: number
}

/** Local durable storage. The application owns close(), after Runtime disposal. */
export class SqliteSessionStore implements SessionStore {
  private readonly db: DatabaseSync
  private closed = false

  constructor(path: string) {
    let db: DatabaseSync | undefined
    try {
      if (!path.trim() || path === ':memory:') throw new RuntimeError('SESSION_CONFIG', 'A durable database file path is required')
      mkdirSync(dirname(path), { recursive: true })
      db = new DatabaseSync(path)
      initialize(db)
      this.db = db
    } catch (error) {
      db?.close()
      if (error instanceof RuntimeError) throw error
      throw new RuntimeError('SESSION_STORAGE', 'Cannot open Session database. Check the data directory, file integrity and write permissions')
    }
  }

  async open(sessionId: string): Promise<void> {
    this.access(() => this.ensure(sessionId))
  }

  /** Bind the app's model choice once; existing conversations cannot silently change it. */
  async bind(sessionId: string, selection: ModelSelection): Promise<SessionInfo> {
    return this.access(() => this.transaction(() => {
      if (!selection.provider.trim() || !selection.model.trim()) throw new RuntimeError('SESSION_CONFIG', 'Provider and model are required')
      this.ensure(sessionId)
      const current = this.info(sessionId)!
      if (current.selection && (current.selection.provider !== selection.provider || current.selection.model !== selection.model)) {
        throw new RuntimeError('SESSION_CONFLICT', 'Session uses a different provider or model. Choose another session ID')
      }
      this.db.prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?').run(selection.provider, selection.model, sessionId)
      return this.info(sessionId)!
    }))
  }

  async getInfo(sessionId: string): Promise<SessionInfo | undefined> {
    return this.access(() => { this.validateId(sessionId); return this.info(sessionId) })
  }

  async list(): Promise<readonly SessionInfo[]> {
    return this.access(() => this.db.prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id').all().map(row => this.info(String(row.id))!))
  }

  async read(sessionId: string): Promise<readonly Message[]> {
    return this.access(() => {
      this.requireSession(sessionId)
      return this.db.prepare('SELECT payload FROM messages WHERE session_id = ? ORDER BY sequence').all(sessionId)
        .map(row => {
          try {
            const message: unknown = JSON.parse(String(row.payload))
            validateMessage(message)
            return message
          } catch { throw new RuntimeError('SESSION_CORRUPT', 'Stored message does not match the supported Session format') }
        })
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
    if (this.closed) throw new RuntimeError('SESSION_CLOSED', 'Session storage is closed')
    try { return operation() }
    catch (error) {
      if (error instanceof RuntimeError) throw error
      throw new RuntimeError('SESSION_STORAGE', 'Session storage operation failed')
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

  private validateId(sessionId: string): void {
    if (typeof sessionId !== 'string' || !sessionId.trim()) throw new RuntimeError('SESSION_CONFIG', 'Session ID must not be empty')
  }

  private ensure(sessionId: string): void {
    this.validateId(sessionId)
    const now = new Date().toISOString()
    this.db.prepare('INSERT INTO sessions (id, created_at, updated_at) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING').run(sessionId, now, now)
  }

  private requireSession(sessionId: string): void {
    this.validateId(sessionId)
    if (!this.info(sessionId)) throw new RuntimeError('SESSION_NOT_FOUND', 'Session does not exist')
  }

  private info(sessionId: string): SessionInfo | undefined {
    const row = this.db.prepare(`SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s WHERE id = ?`).get(sessionId)
    if (!row) return undefined
    return {
      sessionId: String(row.id), createdAt: String(row.created_at), updatedAt: String(row.updated_at), messageCount: Number(row.message_count),
      ...(row.provider !== null ? { selection: { provider: String(row.provider), model: String(row.model) } } : {}),
    }
  }
}
