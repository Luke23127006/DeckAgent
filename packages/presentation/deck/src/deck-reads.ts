import type { DatabaseSync } from 'node:sqlite'
import type { ArtifactDescriptor, SlideDocument } from '@deckagent/presentation-document'
import type { ArtifactReadback } from './artifact-readback.ts'
import type { DeckChange, DeckReader, DeckSnapshot, SlideContent } from './deck-contracts.ts'
import { DeckError } from './errors.ts'
import type { ContentProvenance, GenerationSnapshot } from './generation-contracts.ts'
import type { GenerationStorage } from './generation-store.ts'

/** Internal context that DeckStore exposes to the published-state read path. */
export interface ReadHost {
  readonly db: DatabaseSync
  readonly generations: GenerationStorage
  readonly readback: ArtifactReadback
  readonly listeners: Map<string, Set<(change: DeckChange) => void>>
  access<T>(operation: () => T): T
}

/** Published-state reads: Deck metadata, slide content and change subscriptions. */
export class DeckReads implements DeckReader {
  constructor(private readonly host: ReadHost) {}

  generation(sessionId: string): GenerationSnapshot | null {
    const host = this.host
    return host.access(() => host.generations.get(sessionId))
  }

  snapshot(sessionId: string): DeckSnapshot {
    const host = this.host
    return host.access(() => {
      // A read transaction also keeps separate-process commits from splitting metadata.
      host.db.exec('BEGIN')
      try {
        const deck = host.db.prepare('SELECT outline_id,version FROM decks WHERE session_id=?').get(sessionId)
        const slides = host.db.prepare('SELECT * FROM slides WHERE session_id=? ORDER BY position').all(sessionId)
        const generation = host.generations.get(sessionId)
        const result: DeckSnapshot = {
          ...(generation ? { generation } : {}),
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
        host.db.exec('COMMIT')
        return result
      } catch (error) {
        host.db.exec('ROLLBACK')
        throw error
      }
    })
  }

  /** Source metadata readback without loading HTML or image bytes, including during Stop. */
  provenance(sessionId: string, slideId: string, revision: number): readonly ContentProvenance[] {
    const host = this.host
    return host.access(() => {
      const row = this.artifactRow(sessionId, slideId, revision)
      return row ? host.readback.provenance(row) : []
    })
  }

  slideMetadata(
    sessionId: string,
    slideId: string,
    revision: number,
  ): Pick<SlideContent, 'provenance' | 'notes' | 'imageCredits' | 'imageOmissions'> {
    const host = this.host
    return host.access(() => {
      const row = this.artifactRow(sessionId, slideId, revision)
      if (!row) return {}
      const notes = host.readback.notes(row)
      return {
        provenance: host.readback.provenance(row),
        ...host.readback.imageMetadata(row),
        ...(notes ? { notes } : {}),
      }
    })
  }

  content(sessionId: string, slideId: string, revision: number): SlideContent {
    const host = this.host
    return host.access(() => {
      if (!Number.isSafeInteger(revision) || revision < 1) throw new DeckError('DECK_CONTENT_NOT_FOUND')

      const row = host.db
        .prepare('SELECT html FROM revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      if (!row) throw new DeckError('DECK_CONTENT_NOT_FOUND')

      const artifact = this.artifactRow(sessionId, slideId, revision)
      if (!artifact) return { sessionId, slideId, revision, html: String(row.html) }

      const notes = host.readback.notes(artifact)
      return {
        sessionId,
        slideId,
        revision,
        html: host.readback.content(artifact),
        provenance: host.readback.provenance(artifact),
        ...host.readback.metadata(artifact),
        ...host.readback.imageMetadata(artifact),
        ...(notes ? { notes } : {}),
      }
    })
  }

  nativeArtifact(
    sessionId: string,
    slideId: string,
    revision: number,
  ): { bytes: Uint8Array; descriptor: ArtifactDescriptor; document?: SlideDocument } {
    const host = this.host
    return host.access(() => {
      if (!Number.isSafeInteger(revision) || revision < 1) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      const row = this.artifactRow(sessionId, slideId, revision)
      if (!row) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      return host.readback.native(row)
    })
  }

  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void {
    const host = this.host
    return host.access(() => {
      let set = host.listeners.get(sessionId)
      if (!set) {
        set = new Set()
        host.listeners.set(sessionId, set)
      }
      set.add(listener)
      return () => {
        set.delete(listener)
        if (!set.size) host.listeners.delete(sessionId)
      }
    })
  }

  private artifactRow(sessionId: string, slideId: string, revision: number): Record<string, unknown> | undefined {
    return this.host.db
      .prepare('SELECT * FROM artifact_revisions WHERE session_id=? AND slide_id=? AND revision=?')
      .get(sessionId, slideId, revision)
  }
}
