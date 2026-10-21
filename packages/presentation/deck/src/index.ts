import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DeckError, validId } from './contracts.ts'
import type {
  ConfirmedDeckPlan,
  DeckChange,
  DeckPublisher,
  DeckReader,
  DeckSnapshot,
  PublishedSlide,
  PublishSlide,
  SlideContent,
} from './contracts.ts'
import { validateSlideHtml } from './html-policy.ts'
import { initialize } from './schema.ts'

export { DeckError } from './contracts.ts'
export type {
  ConfirmedDeckPlan,
  DeckChange,
  DeckPublisher,
  DeckReader,
  DeckSnapshot,
  DeckSlide,
  PublishedSlide,
  PublishSlide,
  SlideContent,
} from './contracts.ts'

/** One authoritative deck per Session. Own close() after Host/Agent teardown.
 * All methods are synchronous so a committed state and its notice have one order.
 */
export class DeckService implements DeckReader, DeckPublisher {
  private readonly db: DatabaseSync
  private closed = false
  private readonly listeners = new Map<string, Set<(change: DeckChange) => void>>()

  constructor(path: string) {
    let db: DatabaseSync | undefined
    try {
      if (!path.trim() || path === ':memory:') throw new DeckError('DECK_CONFIG')
      mkdirSync(dirname(path), { recursive: true })
      db = new DatabaseSync(path)
      initialize(db)
      this.db = db
    } catch (error) {
      db?.close()
      throw error instanceof DeckError ? error : new DeckError('DECK_STORAGE')
    }
  }

  /** TASK-006 will call this after its own confirmation workflow. Currently Host fixtures only. */
  confirm(sessionId: string, plan: ConfirmedDeckPlan): void {
    this.access(() => {
      this.id(sessionId)
      if (
        !plan ||
        !validId(plan.outlineId) ||
        !Array.isArray(plan.slides) ||
        !plan.slides.length ||
        plan.slides.length > 100 ||
        plan.slides.some(
          s => !s || !validId(s.slideId) || typeof s.title !== 'string' || !s.title.trim() || s.title.length > 300,
        ) ||
        new Set(plan.slides.map(s => s.slideId)).size !== plan.slides.length
      )
        throw new DeckError('DECK_INVALID_PLAN')
      const normalized = JSON.stringify({
        outlineId: plan.outlineId,
        slides: plan.slides.map(s => ({ slideId: s.slideId, title: s.title })),
      })
      const changed = this.transaction(() => {
        const existing = this.db.prepare('SELECT plan FROM decks WHERE session_id=?').get(sessionId)
        if (existing) {
          if (existing.plan !== normalized) throw new DeckError('DECK_PLAN_CONFLICT')
          return false
        }
        this.db.prepare('INSERT INTO decks VALUES(?,?,?,1)').run(sessionId, plan.outlineId, normalized)
        const insert = this.db.prepare('INSERT INTO slides(session_id,slide_id,title,position) VALUES(?,?,?,?)')
        plan.slides.forEach((s, i) => {
          insert.run(sessionId, s.slideId, s.title, i)
        })
        return true
      })
      if (changed) this.notify(sessionId, 1)
    })
  }

  snapshot(sessionId: string): DeckSnapshot {
    return this.access(() => {
      this.id(sessionId)
      // A read transaction also keeps separate-process commits from splitting metadata.
      this.db.exec('BEGIN')
      try {
        const deck = this.db.prepare('SELECT outline_id,version FROM decks WHERE session_id=?').get(sessionId)
        const slides = this.db.prepare('SELECT * FROM slides WHERE session_id=? ORDER BY position').all(sessionId)
        const result: DeckSnapshot = {
          sessionId,
          deckId: sessionId,
          outlineId: deck ? String(deck.outline_id) : null,
          version: deck ? Number(deck.version) : 0,
          slides: slides.map(s => ({
            slideId: String(s.slide_id),
            title: String(s.title),
            order: Number(s.position),
            revision: Number(s.revision),
            status: Number(s.revision) ? 'published' : 'pending',
          })),
        }
        this.db.exec('COMMIT')
        return result
      } catch (error) {
        this.db.exec('ROLLBACK')
        throw error
      }
    })
  }

  publish(sessionId: string, input: PublishSlide, signal?: AbortSignal): PublishedSlide {
    signal?.throwIfAborted()
    return this.access(() => {
      this.id(sessionId)
      if (
        !input ||
        !validId(input.slideId) ||
        !validId(input.outlineId) ||
        !validId(input.publicationId) ||
        !Number.isSafeInteger(input.expectedRevision) ||
        input.expectedRevision < 0
      )
        throw new DeckError('DECK_INVALID_PUBLICATION')
      validateSlideHtml(input.html)
      const fingerprint = createHash('sha256')
        .update(JSON.stringify([input.outlineId, input.slideId, input.expectedRevision, input.html]))
        .digest('hex')
      let fresh = false
      const receipt = this.transaction(() => {
        const old = this.db
          .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
          .get(sessionId, input.publicationId)
        if (old) {
          if (old.fingerprint !== fingerprint) throw new DeckError('DECK_PUBLICATION_CONFLICT')
          const saved: unknown = JSON.parse(String(old.receipt))
          if (
            !saved ||
            typeof saved !== 'object' ||
            !('sessionId' in saved) ||
            saved.sessionId !== sessionId ||
            !('deckId' in saved) ||
            saved.deckId !== sessionId ||
            !('slideId' in saved) ||
            saved.slideId !== input.slideId ||
            !('revision' in saved) ||
            saved.revision !== input.expectedRevision + 1 ||
            !('version' in saved) ||
            typeof saved.version !== 'number' ||
            !Number.isSafeInteger(saved.version) ||
            saved.version < 2
          )
            throw new DeckError('DECK_CORRUPT')
          return {
            sessionId,
            deckId: sessionId,
            slideId: input.slideId,
            revision: input.expectedRevision + 1,
            version: saved.version,
          }
        }
        const deck = this.db.prepare('SELECT outline_id,version FROM decks WHERE session_id=?').get(sessionId)
        if (!deck) throw new DeckError('DECK_NOT_CONFIRMED')
        if (deck.outline_id !== input.outlineId) throw new DeckError('DECK_OUTLINE_MISMATCH')
        const slide = this.db
          .prepare('SELECT revision FROM slides WHERE session_id=? AND slide_id=?')
          .get(sessionId, input.slideId)
        if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
        if (Number(slide.revision) !== input.expectedRevision) throw new DeckError('DECK_CONFLICT')
        const revision = input.expectedRevision + 1
        const version = Number(deck.version) + 1
        const result = { sessionId, deckId: sessionId, slideId: input.slideId, revision, version }
        this.db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(sessionId, input.slideId, revision, input.html)
        this.db
          .prepare('UPDATE slides SET revision=? WHERE session_id=? AND slide_id=?')
          .run(revision, sessionId, input.slideId)
        this.db.prepare('UPDATE decks SET version=? WHERE session_id=?').run(version, sessionId)
        this.db
          .prepare('INSERT INTO publications VALUES(?,?,?,?)')
          .run(sessionId, input.publicationId, fingerprint, JSON.stringify(result))
        signal?.throwIfAborted()
        fresh = true
        return result
      })
      if (fresh) this.notify(sessionId, receipt.version)
      return receipt
    })
  }

  content(sessionId: string, slideId: string, revision: number): SlideContent {
    return this.access(() => {
      this.id(sessionId)
      this.id(slideId)
      if (!Number.isSafeInteger(revision) || revision < 1) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      const row = this.db
        .prepare('SELECT html FROM revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      if (!row) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      return { sessionId, slideId, revision, html: String(row.html) }
    })
  }

  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void {
    return this.access(() => {
      this.id(sessionId)
      let set = this.listeners.get(sessionId)
      if (!set) {
        set = new Set()
        this.listeners.set(sessionId, set)
      }
      set.add(listener)
      return () => {
        set.delete(listener)
        if (!set.size) this.listeners.delete(sessionId)
      }
    })
  }

  close(): void {
    if (this.closed) return
    this.db.close()
    this.closed = true
    this.listeners.clear()
  }

  private id(value: string): void {
    if (!validId(value)) throw new DeckError('DECK_INVALID_ID')
  }
  private access<T>(operation: () => T): T {
    if (this.closed) throw new DeckError('DECK_CLOSED')
    try {
      return operation()
    } catch (error) {
      throw error instanceof DeckError || (error instanceof Error && error.name === 'AbortError')
        ? error
        : new DeckError('DECK_STORAGE')
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
  private notify(sessionId: string, version: number): void {
    for (const listener of this.listeners.get(sessionId) ?? []) {
      try {
        listener({ sessionId, deckId: sessionId, version })
      } catch {
        // A failed transport observer cannot undo a commit. Reconnect reads current state.
        this.listeners.get(sessionId)?.delete(listener)
      }
    }
  }
}
