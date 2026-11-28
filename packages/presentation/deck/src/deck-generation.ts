import type { DatabaseSync } from 'node:sqlite'
import { reviewLayouts } from '@deckagent/design'
import type { BriefStorage } from './brief-store.ts'
import type { ConfirmedDeckPlan } from './deck-contracts.ts'
import { DeckError, validId } from './errors.ts'
import type { ConfirmationReceipt, DeckOptions, GenerationGrant, GenerationSnapshot } from './generation-contracts.ts'
import type { GenerationStorage } from './generation-store.ts'
import { deckVersion, sameConfirmation, validateConfirmation } from './generation-store.ts'
import type { PreparedImageStore } from './image-store.ts'
import { interviewState } from './interview.ts'
import type { OutlineProposal } from './outline-contracts.ts'
import type { OutlineStorage } from './outline-store.ts'

/** Internal context that DeckStore exposes to the generation lifecycle workflow. */
export interface GenerationHost {
  readonly db: DatabaseSync
  readonly briefs: BriefStorage
  readonly outlines: OutlineStorage
  readonly images: PreparedImageStore
  readonly generations: GenerationStorage
  readonly options: DeckOptions
  access<T>(operation: () => T): T
  transaction<T>(operation: () => T): T
  insertPlan(sessionId: string, plan: ConfirmedDeckPlan): number | null
  notify(sessionId: string, version: number): void
  notifyBrief(sessionId: string, version: number): void
  notifyOutline(sessionId: string, version: number): void
}

/** Confirmation, admission and completion of one generation request. Grants never leave this module. */
export class GenerationWorkflow {
  private readonly grants = new WeakSet<object>()

  constructor(private readonly host: GenerationHost) {}

  confirmGeneration(
    sessionId: string,
    value: unknown,
    selection: GenerationSnapshot['selection'],
  ): ConfirmationReceipt {
    const host = this.host
    return host.access(() => {
      if (!validId(sessionId)) throw new DeckError('DECK_INVALID_ID')
      const target = validateConfirmation(value)
      const result = host.transaction(() => {
        const old = host.generations.get(sessionId)

        if (old) {
          if (!sameConfirmation(old.receipt, target)) throw new DeckError('CONFIRMATION_CONFLICT')
          return { receipt: old.receipt, fresh: false, deckVersion: 0, outlineVersion: 0 }
        }

        const proposal = host.outlines.current(sessionId, {
          outlineId: target.outlineId,
          version: target.outlineVersion,
        })
        const brief = host.briefs.snapshot(sessionId).current
        if (
          !brief ||
          !proposal.brief ||
          brief.briefId !== target.briefId ||
          brief.version !== target.briefVersion ||
          proposal.brief.briefId !== brief.briefId ||
          proposal.brief.version !== brief.version
        )
          throw new DeckError('BRIEF_STALE')
        if (!interviewState(brief.draft).readyForOutline || !brief.design || !proposal.slides.length)
          throw new DeckError('BRIEF_INCOMPLETE')

        this.assertLayoutsFit(brief, proposal)
        if (host.images.imageBlockers(sessionId, proposal).length) throw new DeckError('IMAGE_PREPARATION_REQUIRED')

        host.insertPlan(sessionId, proposal)
        host.outlines.confirm(sessionId, proposal)
        const receipt = host.generations.insert(sessionId, target, brief, selection)
        const head = host.db.prepare('SELECT version FROM outline_heads WHERE session_id=?').get(sessionId)
        if (!head) throw new DeckError('DECK_CORRUPT')

        return {
          receipt,
          fresh: true,
          deckVersion: deckVersion(host.db, sessionId),
          outlineVersion: Number(head.version),
        }
      })
      if (result.fresh) {
        host.notifyOutline(sessionId, result.outlineVersion)
        host.notify(sessionId, result.deckVersion)
      }
      return result.receipt
    })
  }

  private assertLayoutsFit(
    brief: NonNullable<ReturnType<BriefStorage['snapshot']>['current']>,
    proposal: OutlineProposal,
  ): void {
    if (!brief.design || brief.design.template.id !== 'html-basic' || brief.design.template.version !== 3) return
    const issues = reviewLayouts(
      proposal.slides.map(s => ({ title: s.title, blocks: s.blocks ?? [] })),
      brief.design.template,
    )
    if (issues.length) throw new DeckError('DESIGN_LAYOUT_INCOMPATIBLE', issues)
  }

  /** A user-admitted new request continues only missing slides; confirmation and first start stay immutable. */
  continueGeneration(sessionId: string, requestId: string, selection: GenerationSnapshot['selection']): void {
    const host = this.host
    const version = host.access(() => {
      if (!validId(requestId)) throw new DeckError('DECK_INVALID_ID')
      return host.transaction(() =>
        host.generations.continueActive(sessionId, requestId, selection, host.options.activeRequest),
      )
    })
    host.notify(sessionId, version)
  }

  admitGeneration(sessionId: string, intentId: string, requestId: string): void {
    const host = this.host
    const version = host.access(() =>
      host.transaction(() => host.generations.admit(sessionId, intentId, requestId, host.options.activeRequest)),
    )
    host.notify(sessionId, version)
  }

  startGeneration(sessionId: string, intentId: string, requestId: string): GenerationGrant {
    const host = this.host
    return host.access(() => {
      const { grant, version } = host.transaction(() =>
        host.generations.start(sessionId, intentId, requestId, host.options.activeRequest),
      )
      this.grants.add(grant)
      host.notify(sessionId, version)
      return grant
    })
  }

  finishGeneration(
    sessionId: string,
    intentId: string,
    requestId: string,
    outcome: 'completed' | 'failed' | 'stopped' | 'interrupted',
  ): void {
    const host = this.host
    const version = host.access(() =>
      host.transaction(() => host.generations.finish(sessionId, intentId, requestId, outcome)),
    )
    if (version !== null) host.notify(sessionId, version)
  }

  reconcileGenerations(requestExists?: (sessionId: string, requestId: string) => boolean): void {
    const host = this.host
    host.access(() => host.transaction(() => host.generations.reconcile(requestExists)))
  }

  granted(grant: GenerationGrant): { generation: GenerationSnapshot; outline: OutlineProposal } {
    const host = this.host
    if (!grant || !this.grants.has(grant)) throw new DeckError('GENERATION_GRANT_INVALID')

    const generation = host.generations.get(grant.sessionId)
    if (
      !generation ||
      generation.state !== 'generating' ||
      generation.receipt.intentId !== grant.intentId ||
      (generation.activeRequestId ?? generation.receipt.requestId) !== grant.requestId ||
      !host.options.activeRequest?.(grant.sessionId, grant.requestId)
    )
      throw new DeckError('GENERATION_REQUEST_INACTIVE')

    const outline = host.outlines
      .snapshot(grant.sessionId)
      .proposals.find(
        p =>
          p.outlineId === generation.receipt.outlineId &&
          p.version === generation.receipt.outlineVersion &&
          p.status === 'confirmed',
      )
    if (!outline || outline.brief?.design?.fingerprint !== generation.design.fingerprint)
      throw new DeckError('GENERATION_SCOPE_INVALID')

    return { generation, outline }
  }
}
