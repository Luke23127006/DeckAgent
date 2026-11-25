import type { DatabaseSync } from 'node:sqlite'
import { DesignError } from '@deckagent/design'
import { FormatError } from '@deckagent/presentation-document'
import type { DeckChange } from './deck-contracts.ts'
import { DeckError, validId } from './errors.ts'

/**
 * Owns the SQLite connection lifecycle, error mapping, transactions and change notification for one
 * Deck. Every store write runs inside access so a mapped DeckError is the only failure a caller sees.
 */
export class DeckRuntime {
  private closed = false

  constructor(
    private readonly db: DatabaseSync,
    private readonly listeners: Map<string, Set<(change: DeckChange) => void>>,
  ) {}

  id(value: string): void {
    if (!validId(value)) throw new DeckError('DECK_INVALID_ID')
  }

  access<T>(operation: () => T): T {
    if (this.closed) throw new DeckError('DECK_CLOSED')
    try {
      return operation()
    } catch (error) {
      if (error instanceof DesignError) throw new DeckError(error.code)
      if (error instanceof FormatError && !(error instanceof DeckError)) throw new DeckError(error.code, error.issues)
      throw error instanceof DeckError || (error instanceof Error && error.name === 'AbortError')
        ? error
        : new DeckError('DECK_STORAGE')
    }
  }

  async asyncAccess<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      return this.access(() => {
        throw error
      })
    }
  }

  transaction<T>(operation: () => T): T {
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

  notify(sessionId: string, version: number): void {
    for (const listener of this.listeners.get(sessionId) ?? []) {
      try {
        listener({ sessionId, deckId: sessionId, version })
      } catch {
        // A failed transport observer cannot undo a commit. Reconnect reads current state.
        this.listeners.get(sessionId)?.delete(listener)
      }
    }
  }

  close(): void {
    if (this.closed) return
    this.db.close()
    this.closed = true
    this.listeners.clear()
  }
}
