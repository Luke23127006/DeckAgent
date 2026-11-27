import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { DatabaseError, defaultWorkspaceId } from '../../db/index.ts'
import type { AttachmentRecord, ChatSummary, ModelSelection, ChatDatabase, SessionInfo } from '../../db/index.ts'
import { chatMatches, chatTitle, searchWords } from './chat-text.ts'
import { decodeMessage, type Message } from './message-validation.ts'

export interface ChatStoreOptions {
  /** Called after a committed write that changed the chat list, with the new chats version. */
  readonly onChatsChanged?: (version: number) => void
}

function validateMessage(value: unknown): Message {
  try {
    return decodeMessage(value)
  } catch {
    throw new DatabaseError('SESSION_MESSAGE', 'Message does not match the supported Session format')
  }
}

/** Durable SQLite store owning `sessions`, `messages` and `change_versions` for the chats module. */
export class SqliteChatStore {
  private readonly db: DatabaseSync
  private readonly onChatsChanged: ((version: number) => void) | undefined

  constructor(
    private readonly sessionDb: ChatDatabase,
    options: ChatStoreOptions = {},
  ) {
    this.db = sessionDb.db
    this.onChatsChanged = options.onChatsChanged
  }

  /** Create an empty chat if absent; otherwise open its existing history. New chats join the default workspace. */
  async open(sessionId: string): Promise<void> {
    this.sessionDb.transaction(() => {
      if (this.ensure(sessionId, defaultWorkspaceId)) this.changedChats()
    })
  }

  /** The version of the chat list. Each committed write that changes the list increases it by one. */
  chatsVersion(): number {
    return this.sessionDb.run(() => this.readChatsVersion())
  }

  /** A new chat: its own ID, no conversation, in the given workspace. Takes nothing from another chat. */
  async create(workspaceId: string, selection?: ModelSelection): Promise<SessionInfo> {
    return this.sessionDb.transaction(() => {
      if (!workspaceId.trim()) throw new DatabaseError('SESSION_CONFIG', 'Workspace ID must not be empty')
      if (selection) this.validateSelection(selection)
      const sessionId = `chat-${randomUUID()}`
      this.ensure(sessionId, workspaceId)
      if (selection)
        this.db
          .prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?')
          .run(selection.provider, selection.model, sessionId)
      this.changedChats()
      return this.info(sessionId)!
    })
  }

  /** Bind the app's model choice once; existing conversations cannot silently change it. */
  async bind(sessionId: string, selection: ModelSelection): Promise<SessionInfo> {
    return this.sessionDb.transaction(() => {
      this.validateSelection(selection)
      this.ensure(sessionId, defaultWorkspaceId)
      const current = this.info(sessionId)!
      if (
        current.selection &&
        (current.selection.provider !== selection.provider || current.selection.model !== selection.model)
      ) {
        throw new DatabaseError(
          'SESSION_CONFLICT',
          'Session uses a different provider or model. Choose another session ID',
        )
      }
      this.db
        .prepare('UPDATE sessions SET provider = ?, model = ? WHERE id = ?')
        .run(selection.provider, selection.model, sessionId)
      this.changedChats()
      return this.info(sessionId)!
    })
  }

  async getInfo(sessionId: string): Promise<SessionInfo | undefined> {
    return this.sessionDb.run(() => {
      this.validateId(sessionId)
      return this.info(sessionId)
    })
  }

  /** Web selection affects future requests only; callers capture it at request admission. */
  async select(sessionId: string, selection: ModelSelection): Promise<SessionInfo> {
    return this.sessionDb.transaction(() => {
      this.requireSession(sessionId)
      this.validateSelection(selection)
      this.db
        .prepare(
          'UPDATE sessions SET provider = ?, model = ?, removed_provider = NULL, removed_model = NULL WHERE id = ?',
        )
        .run(selection.provider, selection.model, sessionId)
      this.changedChats()
      return this.info(sessionId)!
    })
  }

  async list(): Promise<readonly SessionInfo[]> {
    return this.sessionDb.run(() =>
      this.db
        .prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id')
        .all()
        .map(row => this.info(String(row.id))!),
    )
  }

  /** Every chat with its name. A chat whose saved work cannot be read stays listed as unreadable. */
  async chats(): Promise<readonly ChatSummary[]> {
    return this.sessionDb.run(() =>
      this.db
        .prepare('SELECT id FROM sessions ORDER BY updated_at DESC, id')
        .all()
        .map(row => {
          const info = this.info(String(row.id))!
          try {
            return { ...info, title: chatTitle(this.messages(info.sessionId)), readable: true }
          } catch (error) {
            if (error instanceof DatabaseError && error.code === 'SESSION_CORRUPT')
              return { ...info, title: '', readable: false }
            throw error
          }
        }),
    )
  }

  /**
   * Chats among `chatIds` whose name or own conversation holds every word.
   * Each chat is matched against its own history only; unreadable chats never match.
   */
  async search(words: string, chatIds: readonly string[]): Promise<readonly string[]> {
    return this.sessionDb.run(() => {
      const terms = searchWords(words)
      return chatIds.filter(id => {
        this.validateId(id)
        if (!this.info(id)) return false
        try {
          const history = this.messages(id)
          return chatMatches(chatTitle(history), history, terms)
        } catch (error) {
          if (error instanceof DatabaseError && error.code === 'SESSION_CORRUPT') return false
          throw error
        }
      })
    })
  }

  /** Chats of a removed workspace become ungrouped, with their conversations and selected models. */
  async ungroup(workspaceId: string): Promise<void> {
    this.sessionDb.transaction(() => {
      const result = this.db.prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?').run(workspaceId)
      if (Number(result.changes) > 0) this.changedChats()
    })
  }

  /** Startup reconciliation: a chat of a workspace that is no longer set up becomes ungrouped. */
  async ungroupExcept(workspaceIds: readonly string[]): Promise<void> {
    this.sessionDb.transaction(() => {
      const keep = new Set(workspaceIds)
      const update = this.db.prepare('UPDATE sessions SET workspace_id = NULL WHERE workspace_id = ?')
      let changed = false
      for (const row of this.db
        .prepare('SELECT DISTINCT workspace_id FROM sessions WHERE workspace_id IS NOT NULL')
        .all()) {
        if (!keep.has(String(row.workspace_id)) && Number(update.run(String(row.workspace_id)).changes) > 0)
          changed = true
      }
      if (changed) this.changedChats()
    })
  }

  async read(sessionId: string): Promise<readonly Message[]> {
    return this.sessionDb.run(() => {
      this.requireSession(sessionId)
      return this.messages(sessionId)
    })
  }

  async append(sessionId: string, messages: readonly Message[]): Promise<void> {
    this.sessionDb.transaction(() => {
      this.requireSession(sessionId)
      if (messages.some(message => message.role === 'user' && message.attachments !== undefined))
        throw new DatabaseError('INVALID_REQUEST', 'Send attachments through request admission')
      this.insertMessages(sessionId, messages)
    })
  }

  /**
   * Removed models (FR-059, FR-063): each chat that selected one has no selected model afterwards,
   * remembers which one was removed so it can say so (FR-065), and gets no other model by itself.
   * `models` undefined means every model of the provider configuration.
   */
  async clearSelections(provider: string, models?: readonly string[]): Promise<readonly string[]> {
    return this.sessionDb.transaction(() => {
      const rows = this.db
        .prepare('SELECT id, model FROM sessions WHERE provider = ?')
        .all(provider)
        .filter(row => !models || models.includes(String(row.model)))
      const update = this.db.prepare(
        'UPDATE sessions SET provider = NULL, model = NULL, removed_provider = ?, removed_model = ? WHERE id = ?',
      )
      for (const row of rows) update.run(provider, String(row.model), String(row.id))
      if (rows.length > 0) this.changedChats()
      return rows.map(row => String(row.id))
    })
  }

  requireSessionInTx(sessionId: string): void {
    this.requireSession(sessionId)
  }

  admitUserMessageInTx(
    sessionId: string,
    input: string,
    attachments: readonly AttachmentRecord[],
  ): { readonly historyStart: number; readonly messageSequence: number } {
    this.requireSession(sessionId)
    const historyStart = Number(
      this.db.prepare('SELECT COUNT(*) AS count FROM messages WHERE session_id = ?').get(sessionId)!.count,
    )
    const message = validateMessage({
      role: 'user',
      content: input,
      ...(attachments.length ? { attachments } : {}),
    })
    const messageSequence = this.insertMessages(sessionId, [message])
    return { historyStart, messageSequence }
  }

  appendAssistantMessageInTx(sessionId: string, text: string, interrupted: boolean): void {
    if (!text.trim()) return
    this.insertMessages(sessionId, [
      interrupted ? { role: 'assistant', content: text, interrupted: true } : { role: 'assistant', content: text },
    ])
  }

  private insertMessages(sessionId: string, messages: readonly Message[]): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(sequence), 0) AS last FROM messages WHERE session_id = ?')
      .get(sessionId)!
    let sequence = Number(row.last)
    const insert = this.db.prepare('INSERT INTO messages (session_id, sequence, payload) VALUES (?, ?, ?)')
    for (const message of messages) {
      const validated = validateMessage(message)
      insert.run(sessionId, ++sequence, JSON.stringify(validated))
    }
    if (messages.length) {
      this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), sessionId)
      this.changedChats()
    }
    return sequence
  }

  /** Increases the chats version in the current transaction and schedules the notice after commit. */
  private changedChats(): void {
    this.db.prepare("UPDATE change_versions SET version = version + 1 WHERE topic = 'chats' AND key = 'host'").run()
    const version = this.readChatsVersion()
    this.sessionDb.afterCommit(() => this.onChatsChanged?.(version))
  }

  private readChatsVersion(): number {
    const row = this.db.prepare("SELECT version FROM change_versions WHERE topic = 'chats' AND key = 'host'").get()
    if (!row) throw new DatabaseError('SESSION_CORRUPT', 'Session database has no chats version row')
    return Number(row.version)
  }

  private messages(sessionId: string): readonly Message[] {
    return this.db
      .prepare('SELECT payload FROM messages WHERE session_id = ? ORDER BY sequence')
      .all(sessionId)
      .map(row => {
        try {
          return decodeMessage(JSON.parse(String(row.payload)))
        } catch {
          throw new DatabaseError('SESSION_CORRUPT', 'Stored message does not match the supported Session format')
        }
      })
  }

  private validateSelection(selection: ModelSelection): void {
    if (!selection.provider.trim() || !selection.model.trim())
      throw new DatabaseError('SESSION_CONFIG', 'Provider and model are required')
  }

  private validateId(sessionId: string): void {
    if (typeof sessionId !== 'string' || !sessionId.trim())
      throw new DatabaseError('SESSION_CONFIG', 'Session ID must not be empty')
  }

  /** Inserts the chat when it is absent. Returns true when it inserted a row. */
  private ensure(sessionId: string, workspaceId: string): boolean {
    this.validateId(sessionId)
    const now = new Date().toISOString()
    const result = this.db
      .prepare(
        'INSERT INTO sessions (id, created_at, updated_at, workspace_id) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
      )
      .run(sessionId, now, now, workspaceId)
    return Number(result.changes) > 0
  }

  private requireSession(sessionId: string): void {
    this.validateId(sessionId)
    if (!this.info(sessionId)) throw new DatabaseError('SESSION_NOT_FOUND', 'Session does not exist')
  }

  private info(sessionId: string): SessionInfo | undefined {
    const row = this.db
      .prepare(`SELECT s.*, (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s WHERE id = ?`)
      .get(sessionId)
    if (!row) return undefined
    return {
      sessionId: String(row.id),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      messageCount: Number(row.message_count),
      workspaceId: row.workspace_id === null ? null : String(row.workspace_id),
      ...(row.provider !== null ? { selection: { provider: String(row.provider), model: String(row.model) } } : {}),
      ...(row.provider === null && row.removed_provider !== null
        ? { removedSelection: { provider: String(row.removed_provider), model: String(row.removed_model) } }
        : {}),
    }
  }
}
