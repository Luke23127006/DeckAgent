import { createHash } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { reviewLayouts } from '@deckagent/design'
import type { BriefProposalInput, BriefRecord, BriefSnapshot } from './brief-contracts.ts'
import type { BriefStorage } from './brief-store.ts'
import { saveBoundOutline } from './bound-outline.ts'
import type { ConfirmedDeckPlan } from './deck-contracts.ts'
import { DeckError, validId } from './errors.ts'
import type { DeckOptions, ImageResolver, PreparedResearchImage } from './generation-contracts.ts'
import { deckVersion } from './generation-store.ts'
import type { PreparedImageStore } from './image-store.ts'
import type {
  BoundOutlineInput,
  OutlineDraft,
  OutlineProposal,
  OutlineSnapshot,
  OutlineTarget,
} from './outline-contracts.ts'
import type { OutlineStorage } from './outline-store.ts'

/** Internal context that DeckStore exposes to the Brief, Outline and image authoring workflow. */
export interface AuthoringHost {
  readonly db: DatabaseSync
  readonly briefs: BriefStorage
  readonly outlines: OutlineStorage
  readonly images: PreparedImageStore
  readonly options: DeckOptions
  access<T>(operation: () => T): T
  transaction<T>(operation: () => T): T
  notify(sessionId: string, version: number): void
  notifyBrief(sessionId: string, version: number): void
  notifyOutline(sessionId: string, version: number): void
}

function requireId(value: string): void {
  if (!validId(value)) throw new DeckError('DECK_INVALID_ID')
}

/**
 * Authoring write path: Brief and Outline proposals, the image preparation that binds to them, and
 * Deck plan creation. It runs before any generation grant exists.
 */
export class DeckAuthoring {
  constructor(private readonly host: AuthoringHost) {}

  /** Trusted compatibility import for operator-controlled TASK-005 fixtures only. */
  confirm(sessionId: string, plan: ConfirmedDeckPlan): void {
    const host = this.host
    host.access(() => {
      requireId(sessionId)
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
      const version = host.transaction(() => this.insertPlan(sessionId, plan))
      if (version !== null) host.notify(sessionId, version)
    })
  }

  outlineSnapshot(sessionId: string): OutlineSnapshot {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      const snapshot = host.outlines.snapshot(sessionId)
      return {
        ...snapshot,
        proposals: snapshot.proposals.map(p =>
          p.brief
            ? {
                ...p,
                imageReview: host.images.imageReview(sessionId, p),
                layoutIssues: p.brief.design
                  ? reviewLayouts(
                      p.slides.map(s => ({ title: s.title, blocks: s.blocks ?? [] })),
                      p.brief.design.template,
                    )
                  : [],
              }
            : p,
        ),
      }
    })
  }

  briefSnapshot(sessionId: string): BriefSnapshot {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      return host.briefs.snapshot(sessionId)
    })
  }

  briefVersion(sessionId: string, briefId: string, version: number): BriefRecord {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      requireId(briefId)
      if (!Number.isSafeInteger(version) || version < 1) throw new DeckError('BRIEF_NOT_FOUND')
      return host.briefs.version(sessionId, briefId, version)
    })
  }

  saveBrief(sessionId: string, input: { readonly expectedVersion: number; readonly draft: unknown }): BriefRecord {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      const record = host.transaction(() => host.briefs.save(sessionId, input))
      host.notifyBrief(sessionId, record.version)
      return record
    })
  }

  proposeBoundOutline(sessionId: string, input: BoundOutlineInput): OutlineProposal {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      const proposal = host.transaction(() => {
        const brief = host.briefs.snapshot(sessionId).current
        if (!brief) throw new DeckError('BRIEF_INCOMPLETE')
        return saveBoundOutline(host.db, sessionId, input, brief, host.outlines.snapshot(sessionId))
      })
      host.notifyOutline(sessionId, proposal.version)
      return proposal
    })
  }

  /** Atomically saves a completed request's staged Brief/Outline before Session terminal status. */
  async prepareOutlineImages(
    sessionId: string,
    input: BriefProposalInput,
    signal: AbortSignal,
    resolver?: ImageResolver,
  ): Promise<object> {
    requireId(sessionId)
    return this.host.images.prepareImages(sessionId, input, signal, resolver)
  }

  reserveImageSearch(sessionId: string, requestId: string): void {
    const host = this.host
    host.access(() =>
      host.transaction(() => {
        requireId(sessionId)
        requireId(requestId)
        host.images.reserveImageSearch(sessionId, requestId)
      }),
    )
  }

  outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      return host.images.imagePreview(sessionId, this.findOutline(sessionId, outlineId), needId)
    })
  }

  restoredOutlineImage(sessionId: string, outlineId: string, needId: string): PreparedResearchImage {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      return host.images.restoredImage(sessionId, this.findOutline(sessionId, outlineId), needId)
    })
  }

  private findOutline(sessionId: string, outlineId: string): OutlineProposal {
    const outline = this.host.outlines.snapshot(sessionId).proposals.find(p => p.outlineId === outlineId)
    if (!outline) throw new DeckError('DECK_CONTENT_NOT_FOUND')
    return outline
  }

  imageBlockers(sessionId: string): readonly { code: string; message: string }[] {
    const host = this.host
    return host.access(() => {
      const state = host.outlines.snapshot(sessionId)
      const outline = state.proposals.find(p => p.outlineId === state.currentId)
      return outline ? host.images.imageBlockers(sessionId, outline) : []
    })
  }

  commitBriefProposal(sessionId: string, input: BriefProposalInput, preparedImages?: object): BriefRecord {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      requireId(input.requestId)
      let fresh = false
      let outlineVersion: number | undefined
      const brief = host.transaction(() => {
        const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex')
        const receipt = host.db.prepare('SELECT * FROM brief_request_receipts WHERE request_id=?').get(input.requestId)
        if (receipt) {
          if (receipt.session_id !== sessionId || receipt.fingerprint !== fingerprint)
            throw new DeckError('BRIEF_REQUEST_CONFLICT')
          return host.briefs.version(sessionId, String(receipt.brief_id), Number(receipt.version))
        }
        const state = host.outlines.snapshot(sessionId)
        const current = state.proposals.find(p => p.outlineId === state.currentId)
        if (
          input.expectedOutline === null
            ? !!current
            : !current ||
              current.outlineId !== input.expectedOutline.outlineId ||
              current.version !== input.expectedOutline.version
        )
          throw new DeckError('OUTLINE_STALE')
        const brief = host.briefs.save(sessionId, { expectedVersion: input.expectedBriefVersion, draft: input.draft })
        fresh = true
        if (input.outline !== undefined) {
          const outline = saveBoundOutline(
            host.db,
            sessionId,
            {
              requestId: input.requestId,
              responseIndex: input.responseIndex,
              expectedOutline: input.expectedOutline,
              expectedBrief: { briefId: brief.briefId, version: brief.version },
              draft: input.outline,
              ...(input.restoredFrom ? { restoredFrom: input.restoredFrom } : {}),
            },
            brief,
            state,
          )
          host.images.commitImages(sessionId, input, outline, preparedImages)
          outlineVersion = outline.version
        }
        host.db
          .prepare('INSERT INTO brief_request_receipts VALUES(?,?,?,?,?)')
          .run(input.requestId, sessionId, brief.briefId, brief.version, fingerprint)
        return brief
      })
      if (fresh) {
        host.notifyBrief(sessionId, brief.version)
        if (outlineVersion !== undefined) host.notifyOutline(sessionId, outlineVersion)
      }
      return brief
    })
  }

  beginOutline(sessionId: string): void {
    const host = this.host
    host.access(() => {
      requireId(sessionId)
      host.outlines.begin(sessionId)
    })
  }

  proposeOutline(
    sessionId: string,
    input: { readonly requestId: string; readonly responseIndex: number; readonly draft: OutlineDraft },
  ): OutlineProposal {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      const proposal = host.transaction(() => host.outlines.propose(sessionId, input))
      host.notifyOutline(sessionId, proposal.version)
      return proposal
    })
  }

  currentOutline(sessionId: string, target: OutlineTarget): OutlineProposal {
    const host = this.host
    return host.access(() => {
      requireId(sessionId)
      return host.outlines.current(sessionId, target)
    })
  }

  confirmOutline(sessionId: string, target: OutlineTarget): void {
    const host = this.host
    host.access(() => {
      requireId(sessionId)
      const versions = host.transaction(() => {
        const proposal = host.outlines.current(sessionId, target)
        if (proposal.brief) throw new DeckError('DECK_CONFIRMATION_REQUIRED')
        this.insertPlan(sessionId, proposal)
        host.outlines.confirm(sessionId, target)
        const head = host.db.prepare('SELECT version FROM outline_heads WHERE session_id=?').get(sessionId)
        if (!head) throw new DeckError('DECK_CORRUPT')
        return { deckVersion: deckVersion(host.db, sessionId), outlineVersion: Number(head.version) }
      })
      host.notifyOutline(sessionId, versions.outlineVersion)
      host.notify(sessionId, versions.deckVersion)
    })
  }

  cancelOutline(sessionId: string, target: OutlineTarget): void {
    const host = this.host
    host.access(() => {
      requireId(sessionId)
      const version = host.transaction(() => {
        host.outlines.cancel(sessionId, target)
        const head = host.db.prepare('SELECT version FROM outline_heads WHERE session_id=?').get(sessionId)
        if (!head) throw new DeckError('DECK_CORRUPT')
        return Number(head.version)
      })
      host.notifyOutline(sessionId, version)
    })
  }

  insertPlan(sessionId: string, plan: ConfirmedDeckPlan): number | null {
    const host = this.host
    const normalized = JSON.stringify({
      outlineId: plan.outlineId,
      slides: plan.slides.map(s => ({ slideId: s.slideId, title: s.title })),
    })
    const existing = host.db.prepare('SELECT plan FROM decks WHERE session_id=?').get(sessionId)
    if (existing) {
      if (existing.plan !== normalized) throw new DeckError('DECK_PLAN_CONFLICT')
      return null
    }
    host.db.prepare('INSERT INTO decks VALUES(?,?,?,1)').run(sessionId, plan.outlineId, normalized)
    const insert = host.db.prepare('INSERT INTO slides(session_id,slide_id,title,position) VALUES(?,?,?,?)')
    plan.slides.forEach((s, i) => {
      insert.run(sessionId, s.slideId, s.title, i)
    })
    return deckVersion(host.db, sessionId)
  }
}
