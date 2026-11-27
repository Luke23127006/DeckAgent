import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { migrateChatsDatabase } from './chats.migrations.ts'
import { DatabaseError } from './records.ts'

/** Shared SQLite connection for chats, attachments and runs with re-entrant transactions and post-commit hooks. */
export class ChatDatabase {
  readonly db: DatabaseSync
  private depth = 0
  private callbacks: (() => void)[] = []
  private closed = false

  constructor(path: string) {
    let db: DatabaseSync | undefined
    try {
      if (!path.trim() || path === ':memory:')
        throw new DatabaseError('SESSION_CONFIG', 'A durable database file path is required')
      mkdirSync(dirname(path), { recursive: true })
      db = new DatabaseSync(path)
      migrateChatsDatabase(db)
      this.db = db
    } catch (error) {
      db?.close()
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError(
        'SESSION_STORAGE',
        'Cannot open chat database. Check the data directory, file integrity and write permissions',
      )
    }
  }

  run<T>(op: () => T): T {
    if (this.closed) throw new DatabaseError('SESSION_CLOSED', 'Chat storage is closed')
    try {
      return op()
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('SESSION_STORAGE', 'Chat storage operation failed')
    }
  }

  transaction<T>(op: () => T): T {
    return this.run(() => {
      if (this.depth === 0) {
        this.callbacks = []
        this.db.exec('BEGIN IMMEDIATE')
      }
      this.depth++
      let result: T
      try {
        result = op()
      } catch (error) {
        this.depth--
        if (this.depth === 0) {
          this.callbacks = []
          this.db.exec('ROLLBACK')
        }
        throw error
      }
      this.depth--
      if (this.depth === 0) {
        try {
          this.db.exec('COMMIT')
        } catch (error) {
          this.callbacks = []
          this.db.exec('ROLLBACK')
          throw error
        }
        const pending = this.callbacks
        this.callbacks = []
        for (const callback of pending) callback()
      }
      return result
    })
  }

  afterCommit(callback: () => void): void {
    if (this.depth > 0) this.callbacks.push(callback)
    else callback()
  }

  close(): void {
    if (this.closed) return
    this.db.close()
    this.closed = true
  }
}
