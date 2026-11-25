import { createHash } from 'node:crypto'
import { DesignError, reviewLayouts } from '@deckagent/design'
import { FormatError } from '@deckagent/presentation-document'
export { decodeSlideDocument, documentText, FormatError } from '@deckagent/presentation-document'
export type {
  SlideDocument,
  FormatAdapter,
  ArtifactDescriptor,
  ValidationIssue,
} from '@deckagent/presentation-document'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DeckError, validId } from './errors.ts'
import type {
  ConfirmedDeckPlan,
  DeckChange,
  DeckPublisher,
  DeckReader,
  DeckSnapshot,
  PublishedSlide,
  PublishSlide,
  SlideContent,
} from './deck-contracts.ts'
import { initialize } from './schema.ts'
import { OutlineStorage } from './outline-store.ts'
import { BriefStorage } from './brief-store.ts'
import { saveBoundOutline } from './bound-outline.ts'
import { GenerationStorage, validateConfirmation, sameConfirmation, deckVersion } from './generation-store.ts'
import { interviewState } from './interview.ts'
import { ArtifactStorage } from './artifact-store.ts'
import { ArtifactFileStore } from './artifact-fs.ts'
import { ArtifactStaging } from './artifact-stage.ts'
import { PreparedImageStore } from './image-store.ts'
import { ArtifactReadback } from './artifact-readback.ts'
import type { ArtifactPublication, ArtifactAsset, StageChunk, StageStatus } from './generation-contracts.ts'
import type { GenerationCapability } from './generation-contracts.ts'
export type { GenerationCapability } from './generation-contracts.ts'
export type { ContentProvenance } from './generation-contracts.ts'
export type { PreparedResearchImage, ImageCredit } from './generation-contracts.ts'
export type { ImageNeed, ImageResolver, ImageSelection, OutlineImageReview } from './generation-contracts.ts'
export type { ImageAttempt, ImageSourceCheck } from './generation-contracts.ts'
export { ImagePreparationError } from './errors.ts'
export { outlineImageNeeds } from './image-store.ts'
export type {
  ArtifactPublication,
  ArtifactAsset,
  PreparedImageAsset,
  StageChunk,
  StageStatus,
} from './generation-contracts.ts'
import type { ConfirmationReceipt, GenerationSnapshot, GenerationGrant, DeckOptions } from './generation-contracts.ts'
export { validateConfirmation } from './generation-store.ts'
export type {
  ConfirmationReceipt,
  ConfirmationTarget,
  GenerationSnapshot,
  GenerationGrant,
  DeckOptions,
} from './generation-contracts.ts'
import type { BoundOutlineInput } from './outline-contracts.ts'
import type { BriefProposalInput } from './brief-contracts.ts'
export { validateBoundOutline } from './bound-outline.ts'
export type { BoundOutlineDraft, BoundOutlineInput, OutlineChanges } from './outline-contracts.ts'
export type { BriefProposalInput } from './brief-contracts.ts'
export type { ContentBlock } from '@deckagent/design'
import type { BriefRecord, BriefSnapshot } from './brief-contracts.ts'
export { validateBriefDraft } from './brief-store.ts'
export { interviewState, skipInterview } from './interview.ts'
export type { InterviewState } from './brief-contracts.ts'
export type { BriefDraft, BriefRecord, BriefSnapshot, BriefSourceRef, InterviewTopic } from './brief-contracts.ts'
export type { DesignSnapshot, CatalogRef, ThemeValues } from '@deckagent/design'
import type { OutlineDraft, OutlineProposal, OutlineSnapshot, OutlineTarget } from './outline-contracts.ts'

import { deckFailureMessage } from './errors.ts'
export { DeckError, deckFailureMessage } from './errors.ts'
export { validateOutlineDraft } from './outline-store.ts'
export type {
  OutlineDraft,
  OutlineProposal,
  OutlineReader,
  OutlineSnapshot,
  OutlineTarget,
} from './outline-contracts.ts'
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
} from './deck-contracts.ts'

/** One authoritative deck per Session. Own close() after Host/Agent teardown.
 * All methods are synchronous so a committed state and its notice have one order.
 */
export class DeckService implements DeckReader, DeckPublisher {
  private readonly db: DatabaseSync
  private readonly outlines: OutlineStorage
  private readonly briefs: BriefStorage
  private readonly generations: GenerationStorage
  private readonly artifacts: ArtifactStorage
  private readonly images: PreparedImageStore
  private readonly readback: ArtifactReadback
  private readonly grants = new WeakSet<object>()
  private readonly publicationsInFlight = new Map<string, Promise<PublishedSlide>>()
  private closed = false
  private readonly listeners = new Map<string, Set<(change: DeckChange) => void>>()

  constructor(
    path: string,
    private readonly options: DeckOptions = {},
  ) {
    let db: DatabaseSync | undefined
    try {
      if (!path.trim() || path === ':memory:') throw new DeckError('DECK_CONFIG')
      mkdirSync(dirname(path), { recursive: true })
      db = new DatabaseSync(path)
      initialize(db)
      this.db = db
      this.briefs = new BriefStorage(db)
      this.outlines = new OutlineStorage(db, this.briefs)
      this.generations = new GenerationStorage(db)
      const formats = options.formats ?? []
      const formatMap = new Map(formats.map(format => [format.id, format]))
      if (formatMap.size !== formats.length) throw new DeckError('FORMAT_DUPLICATE')
      const files = new ArtifactFileStore(options.artifactRoot)
      this.images = new PreparedImageStore(db, files, options)
      const staging = new ArtifactStaging(files, this.images, formatMap)
      this.readback = new ArtifactReadback(db, files, formatMap)
      this.artifacts = new ArtifactStorage(files, staging, formatMap, options)
      if (files.root) this.readback.recover()
    } catch (error) {
      db?.close()
      throw error instanceof DeckError ? error : new DeckError('DECK_STORAGE')
    }
  }

  /** Trusted compatibility import for operator-controlled TASK-005 fixtures only. */
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
      const changed = this.transaction(() => this.insertPlan(sessionId, plan))
      if (changed) this.notify(sessionId, 1)
    })
  }

  outlineSnapshot(sessionId: string): OutlineSnapshot {
    return this.access(() => {
      this.id(sessionId)
      const snapshot = this.outlines.snapshot(sessionId)
      return {
        ...snapshot,
        proposals: snapshot.proposals.map(p =>
          p.brief
            ? {
                ...p,
                imageReview: this.images.imageReview(sessionId, p),
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
    return this.access(() => {
      this.id(sessionId)
      return this.briefs.snapshot(sessionId)
    })
  }

  briefVersion(sessionId: string, briefId: string, version: number): BriefRecord {
    return this.access(() => {
      this.id(sessionId)
      this.id(briefId)
      if (!Number.isSafeInteger(version) || version < 1) throw new DeckError('BRIEF_NOT_FOUND')
      return this.briefs.version(sessionId, briefId, version)
    })
  }

  saveBrief(sessionId: string, input: { readonly expectedVersion: number; readonly draft: unknown }): BriefRecord {
    return this.access(() => {
      this.id(sessionId)
      return this.transaction(() => this.briefs.save(sessionId, input))
    })
  }

  proposeBoundOutline(sessionId: string, input: BoundOutlineInput): OutlineProposal {
    return this.access(() => {
      this.id(sessionId)
      return this.transaction(() => {
        const brief = this.briefs.snapshot(sessionId).current
        if (!brief) throw new DeckError('BRIEF_INCOMPLETE')
        return saveBoundOutline(this.db, sessionId, input, brief, this.outlines.snapshot(sessionId))
      })
    })
  }

  /** Atomically saves a completed request's staged Brief/Outline before Session terminal status. */
  async prepareOutlineImages(
    sessionId: string,
    input: BriefProposalInput,
    signal: AbortSignal,
    resolver?: import('./generation-contracts.ts').ImageResolver,
  ): Promise<object> {
    this.id(sessionId)
    return this.images.prepareImages(sessionId, input, signal, resolver)
  }
  reserveImageSearch(sessionId: string, requestId: string): void {
    this.access(() =>
      this.transaction(() => {
        this.id(sessionId)
        this.id(requestId)
        this.images.reserveImageSearch(sessionId, requestId)
      }),
    )
  }
  outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array {
    return this.access(() => {
      this.id(sessionId)
      const outline = this.outlines.snapshot(sessionId).proposals.find(p => p.outlineId === outlineId)
      if (!outline) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      return this.images.imagePreview(sessionId, outline, needId)
    })
  }
  restoredOutlineImage(
    sessionId: string,
    outlineId: string,
    needId: string,
  ): import('./generation-contracts.ts').PreparedResearchImage {
    return this.access(() => {
      this.id(sessionId)
      const outline = this.outlines.snapshot(sessionId).proposals.find(p => p.outlineId === outlineId)
      if (!outline) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      return this.images.restoredImage(sessionId, outline, needId)
    })
  }
  imageBlockers(sessionId: string): readonly { code: string; message: string }[] {
    return this.access(() => {
      const state = this.outlines.snapshot(sessionId)
      const outline = state.proposals.find(p => p.outlineId === state.currentId)
      return outline ? this.images.imageBlockers(sessionId, outline) : []
    })
  }
  commitBriefProposal(sessionId: string, input: BriefProposalInput, preparedImages?: object): BriefRecord {
    return this.access(() => {
      this.id(sessionId)
      this.id(input.requestId)
      return this.transaction(() => {
        const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex')
        const receipt = this.db.prepare('SELECT * FROM brief_request_receipts WHERE request_id=?').get(input.requestId)
        if (receipt) {
          if (receipt.session_id !== sessionId || receipt.fingerprint !== fingerprint)
            throw new DeckError('BRIEF_REQUEST_CONFLICT')
          return this.briefs.version(sessionId, String(receipt.brief_id), Number(receipt.version))
        }
        const state = this.outlines.snapshot(sessionId)
        const current = state.proposals.find(p => p.outlineId === state.currentId)
        if (
          input.expectedOutline === null
            ? !!current
            : !current ||
              current.outlineId !== input.expectedOutline.outlineId ||
              current.version !== input.expectedOutline.version
        )
          throw new DeckError('OUTLINE_STALE')
        const brief = this.briefs.save(sessionId, { expectedVersion: input.expectedBriefVersion, draft: input.draft })
        if (input.outline !== undefined) {
          const outline = saveBoundOutline(
            this.db,
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
          this.images.commitImages(sessionId, input, outline, preparedImages)
        }
        this.db
          .prepare('INSERT INTO brief_request_receipts VALUES(?,?,?,?,?)')
          .run(input.requestId, sessionId, brief.briefId, brief.version, fingerprint)
        return brief
      })
    })
  }

  beginOutline(sessionId: string): void {
    this.access(() => {
      this.id(sessionId)
      this.outlines.begin(sessionId)
    })
  }

  generation(sessionId: string): GenerationSnapshot | null {
    return this.access(() => {
      this.id(sessionId)
      return this.generations.get(sessionId)
    })
  }

  confirmGeneration(
    sessionId: string,
    value: unknown,
    selection: GenerationSnapshot['selection'],
  ): ConfirmationReceipt {
    return this.access(() => {
      this.id(sessionId)
      const target = validateConfirmation(value)
      let fresh = false
      const receipt = this.transaction(() => {
        const old = this.generations.get(sessionId)
        if (old) {
          if (!sameConfirmation(old.receipt, target)) throw new DeckError('CONFIRMATION_CONFLICT')
          return old.receipt
        }
        const p = this.outlines.current(sessionId, { outlineId: target.outlineId, version: target.outlineVersion })
        const b = this.briefs.snapshot(sessionId).current
        if (
          !b ||
          !p.brief ||
          b.briefId !== target.briefId ||
          b.version !== target.briefVersion ||
          p.brief.briefId !== b.briefId ||
          p.brief.version !== b.version
        )
          throw new DeckError('BRIEF_STALE')
        if (!interviewState(b.draft).readyForOutline || !b.design || !p.slides.length)
          throw new DeckError('BRIEF_INCOMPLETE')
        if (b.design.template.id === 'html-basic' && b.design.template.version === 3) {
          const issues = reviewLayouts(
            p.slides.map(s => ({ title: s.title, blocks: s.blocks ?? [] })),
            b.design.template,
          )
          if (issues.length) throw new DeckError('DESIGN_LAYOUT_INCOMPATIBLE', issues)
        }
        if (this.images.imageBlockers(sessionId, p).length) throw new DeckError('IMAGE_PREPARATION_REQUIRED')
        this.insertPlan(sessionId, p)
        this.outlines.confirm(sessionId, p)
        fresh = true
        return this.generations.insert(sessionId, target, b, selection)
      })
      if (fresh) this.notify(sessionId, 1)
      return receipt
    })
  }

  /** A user-admitted new request continues only missing slides; confirmation and first start stay immutable. */
  continueGeneration(sessionId: string, requestId: string, selection: GenerationSnapshot['selection']): void {
    const version = this.access(() => {
      this.id(requestId)
      return this.transaction(() =>
        this.generations.continueActive(sessionId, requestId, selection, this.options.activeRequest),
      )
    })
    this.notify(sessionId, version)
  }

  admitGeneration(sessionId: string, intentId: string, requestId: string): void {
    const version = this.access(() =>
      this.transaction(() => this.generations.admit(sessionId, intentId, requestId, this.options.activeRequest)),
    )
    this.notify(sessionId, version)
  }

  startGeneration(sessionId: string, intentId: string, requestId: string): GenerationGrant {
    return this.access(() => {
      const { grant, version } = this.transaction(() =>
        this.generations.start(sessionId, intentId, requestId, this.options.activeRequest),
      )
      this.grants.add(grant)
      this.notify(sessionId, version)
      return grant
    })
  }

  finishGeneration(
    sessionId: string,
    intentId: string,
    requestId: string,
    outcome: 'completed' | 'failed' | 'stopped' | 'interrupted',
  ): void {
    const version = this.access(() =>
      this.transaction(() => this.generations.finish(sessionId, intentId, requestId, outcome)),
    )
    this.notify(sessionId, version ?? deckVersion(this.db, sessionId))
  }

  reconcileGenerations(requestExists?: (sessionId: string, requestId: string) => boolean): void {
    this.access(() => this.transaction(() => this.generations.reconcile(requestExists)))
  }

  private granted(grant: GenerationGrant): { generation: GenerationSnapshot; outline: OutlineProposal } {
    if (!grant || !this.grants.has(grant)) throw new DeckError('GENERATION_GRANT_INVALID')
    const generation = this.generations.get(grant.sessionId)
    if (
      !generation ||
      generation.state !== 'generating' ||
      generation.receipt.intentId !== grant.intentId ||
      (generation.activeRequestId ?? generation.receipt.requestId) !== grant.requestId ||
      !this.options.activeRequest?.(grant.sessionId, grant.requestId)
    )
      throw new DeckError('GENERATION_REQUEST_INACTIVE')
    const outline = this.outlines
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

  beginStage(grant: GenerationGrant, slideId: string, layoutId: string): StageStatus {
    return this.access(() => {
      const { generation, outline } = this.granted(grant)
      const slide = outline.slides.find(s => s.slideId === slideId)
      if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
      return this.artifacts.begin(grant, slide, layoutId, generation)
    })
  }

  generationCapability(grant: GenerationGrant, signal: AbortSignal): GenerationCapability {
    this.access(() => this.granted(grant))
    const check = () => {
      signal.throwIfAborted()
      this.access(() => this.granted(grant))
    }
    return Object.freeze({
      document: (stageId: string, document: import('@deckagent/presentation-document').SlideDocument) => {
        check()
        return this.access(() => this.artifacts.setDocument(grant, stageId, document))
      },
      draft: (stageId: string) => {
        check()
        return this.access(() => this.artifacts.draft(grant, stageId))
      },
      validate: async (input: ArtifactPublication) => {
        check()
        try {
          const { generation, outline } = this.access(() => this.granted(grant))
          const slide = outline.slides.find(s => s.slideId === input.slideId)
          if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
          const artifact = await this.artifacts.prepare(grant, input, slide, generation, check, signal, true)
          this.artifacts.removeValidationArtifact(artifact)
          return []
        } catch (error) {
          signal.throwIfAborted()
          if (error instanceof FormatError)
            return error.issues.length
              ? error.issues
              : [{ code: error.code, path: 'draft', message: deckFailureMessage(error.code) ?? error.code }]
          throw error
        }
      },
      plan: () => {
        check()
        return { ...this.access(() => this.granted(grant)), slides: this.snapshot(grant.sessionId).slides }
      },
      begin: (slideId: string, layoutId: string) => {
        check()
        const generation = this.generations.get(grant.sessionId)!
        if (
          generation.activeRequestId &&
          this.snapshot(grant.sessionId).slides.some(s => s.slideId === slideId && s.revision > 0)
        )
          throw new DeckError('SLIDE_REVISION_CONFLICT')
        return this.beginStage(grant, slideId, layoutId)
      },
      append: (stageId: string, chunk: StageChunk) => {
        check()
        return this.appendStage(grant, stageId, chunk)
      },
      provenance: (
        stageId: string,
        records: readonly import('./generation-contracts.ts').ContentProvenance[],
        notes?: string,
      ) => {
        check()
        this.artifacts.setProvenance(grant, stageId, records, notes)
      },
      discard: (stageId: string) => {
        check()
        this.access(() => this.artifacts.discard(grant, stageId))
      },
      image: (stageId: string, slideId: string, attachmentId: string) => {
        check()
        return this.attachStageImage(grant, stageId, slideId, attachmentId, signal)
      },
      researchImage: (stageId: string, slideId: string, query: string) =>
        this.asyncAccess(() => {
          check()
          const { generation, outline } = this.granted(grant)
          if (outline.brief?.draft.images.mode !== 'public-research') throw new DeckError('IMAGE_CHOICE_REQUIRED')
          const slide = outline.slides.find(s => s.slideId === slideId)
          if (!slide || generation.state !== 'generating') throw new DeckError('DECK_SLIDE_NOT_FOUND')
          const limit = Math.max(
            1,
            outline.slides.flatMap(s => s.blocks ?? []).filter(b => b.kind === 'web-image').length * 2,
          )
          return this.artifacts.researchImage(grant, stageId, slide, query, limit, check, signal)
        }),
      publish: (input: ArtifactPublication) => {
        check()
        return this.publishArtifact(grant, input, signal)
      },
    })
  }

  appendStage(grant: GenerationGrant, stageId: string, chunk: StageChunk): StageStatus {
    return this.access(() => {
      this.granted(grant)
      return this.artifacts.append(grant, stageId, chunk)
    })
  }

  async attachStageImage(
    grant: GenerationGrant,
    stageId: string,
    slideId: string,
    attachmentId: string,
    signal: AbortSignal,
  ): Promise<ArtifactAsset> {
    const { outline } = this.access(() => this.granted(grant))
    const slide = outline.slides.find(s => s.slideId === slideId)
    if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
    return this.asyncAccess(() =>
      this.artifacts.asset(grant, stageId, attachmentId, slide, () => this.access(() => this.granted(grant)), signal),
    )
  }

  async publishArtifact(
    grant: GenerationGrant,
    input: ArtifactPublication,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<PublishedSlide> {
    return this.asyncAccess(() => {
      this.granted(grant)
      const key = JSON.stringify([grant.intentId, grant.requestId, input])
      const old = this.publicationsInFlight.get(key)
      if (old) return old
      const work = (async () => {
        try {
          return await this.publishArtifactFromStage(grant, input, signal)
        } finally {
          this.publicationsInFlight.delete(key)
        }
      })()
      this.publicationsInFlight.set(key, work)
      return work
    })
  }

  private async publishArtifactFromStage(
    grant: GenerationGrant,
    input: ArtifactPublication,
    signal: AbortSignal,
  ): Promise<PublishedSlide> {
    const { generation, outline } = this.access(() => this.granted(grant))
    signal.throwIfAborted()
    if (
      !input ||
      Object.keys(input).some(k => !['stageId', 'slideId', 'expectedRevision', 'publicationId'].includes(k)) ||
      !validId(input.stageId) ||
      !validId(input.slideId) ||
      !validId(input.publicationId) ||
      !Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 0
    )
      throw new DeckError('DECK_INVALID_PUBLICATION')
    const slide = outline.slides.find(s => s.slideId === input.slideId)
    if (!slide) throw new DeckError('DECK_SLIDE_NOT_FOUND')
    const prior = this.access(() =>
      this.db
        .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
        .get(grant.sessionId, input.publicationId),
    )
    if (prior) {
      if (prior.fingerprint !== this.artifacts.receiptFingerprint(grant, input, generation, slide))
        throw new DeckError('DECK_PUBLICATION_CONFLICT')
      const saved: unknown = JSON.parse(String(prior.receipt))
      if (
        !saved ||
        typeof saved !== 'object' ||
        !('version' in saved) ||
        !Number.isSafeInteger(saved.version) ||
        Number(saved.version) < 2
      )
        throw new DeckError('DECK_CORRUPT')
      return {
        sessionId: grant.sessionId,
        deckId: grant.sessionId,
        slideId: input.slideId,
        revision: input.expectedRevision + 1,
        version: Number(saved.version),
      }
    }
    const artifact = await this.artifacts.prepare(
      grant,
      input,
      slide,
      generation,
      () => this.access(() => this.granted(grant)),
      signal,
    )
    const receipt = this.access(() =>
      this.transaction(() => {
        this.granted(grant)
        signal.throwIfAborted()
        const concurrent = this.db
          .prepare('SELECT fingerprint,receipt FROM publications WHERE session_id=? AND publication_id=?')
          .get(grant.sessionId, input.publicationId)
        if (concurrent) {
          if (concurrent.fingerprint !== artifact.fingerprint) throw new DeckError('DECK_PUBLICATION_CONFLICT')
          const saved: unknown = JSON.parse(String(concurrent.receipt))
          if (!saved || typeof saved !== 'object' || !('version' in saved) || !Number.isSafeInteger(saved.version))
            throw new DeckError('DECK_CORRUPT')
          return {
            sessionId: grant.sessionId,
            deckId: grant.sessionId,
            slideId: input.slideId,
            revision: input.expectedRevision + 1,
            version: Number(saved.version),
          }
        }
        const row = this.db
          .prepare('SELECT revision FROM slides WHERE session_id=? AND slide_id=?')
          .get(grant.sessionId, input.slideId)
        if (!row || row.revision !== input.expectedRevision) throw new DeckError('DECK_CONFLICT')
        const version =
          Number(this.db.prepare('SELECT version FROM decks WHERE session_id=?').get(grant.sessionId)!.version) + 1
        const revision = input.expectedRevision + 1
        const result = {
          sessionId: grant.sessionId,
          deckId: grant.sessionId,
          slideId: input.slideId,
          revision,
          version,
        }
        this.db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(grant.sessionId, input.slideId, revision, '')
        this.db
          .prepare('INSERT INTO artifact_revisions VALUES(?,?,?,?,?,?)')
          .run(grant.sessionId, input.slideId, revision, artifact.artifactId, artifact.digest, artifact.manifest)
        this.db
          .prepare('UPDATE slides SET revision=? WHERE session_id=? AND slide_id=?')
          .run(revision, grant.sessionId, input.slideId)
        this.db.prepare('UPDATE decks SET version=? WHERE session_id=?').run(version, grant.sessionId)
        this.db
          .prepare('INSERT INTO publications VALUES(?,?,?,?)')
          .run(grant.sessionId, input.publicationId, artifact.fingerprint, JSON.stringify(result))
        return result
      }),
    )
    this.artifacts.published(grant, input.stageId)
    this.notify(grant.sessionId, receipt.version)
    return receipt
  }

  /** Called by Host only after a successful completed response, never by a model tool. */
  proposeOutline(
    sessionId: string,
    input: { readonly requestId: string; readonly responseIndex: number; readonly draft: OutlineDraft },
  ): OutlineProposal {
    return this.access(() => {
      this.id(sessionId)
      return this.transaction(() => this.outlines.propose(sessionId, input))
    })
  }

  currentOutline(sessionId: string, target: OutlineTarget): OutlineProposal {
    return this.access(() => {
      this.id(sessionId)
      return this.outlines.current(sessionId, target)
    })
  }

  confirmOutline(sessionId: string, target: OutlineTarget): void {
    this.access(() => {
      this.id(sessionId)
      this.transaction(() => {
        const proposal = this.outlines.current(sessionId, target)
        if (proposal.brief) throw new DeckError('DECK_CONFIRMATION_REQUIRED')
        this.insertPlan(sessionId, proposal)
        this.outlines.confirm(sessionId, target)
      })
      this.notify(sessionId, 1)
    })
  }

  cancelOutline(sessionId: string, target: OutlineTarget): void {
    this.access(() => {
      this.id(sessionId)
      this.transaction(() => this.outlines.cancel(sessionId, target))
    })
  }

  private insertPlan(sessionId: string, plan: ConfirmedDeckPlan): boolean {
    const normalized = JSON.stringify({
      outlineId: plan.outlineId,
      slides: plan.slides.map(s => ({ slideId: s.slideId, title: s.title })),
    })
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
          ...(this.generations.get(sessionId) ? { generation: this.generations.get(sessionId)! } : {}),
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
      if (!this.options.legacyHtmlPolicy) throw new DeckError('DECK_CONFIG')
      try {
        this.options.legacyHtmlPolicy(input.html)
      } catch (error) {
        if (error instanceof FormatError && error.code === 'DECK_UNSAFE_HTML') throw new DeckError('DECK_UNSAFE_HTML')
        throw error
      }
      if (this.generations.get(sessionId)) throw new DeckError('GENERATION_GRANT_REQUIRED')
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

  /** Source metadata readback without loading HTML or image bytes, including during Stop. */
  provenance(
    sessionId: string,
    slideId: string,
    revision: number,
  ): readonly import('./generation-contracts.ts').ContentProvenance[] {
    return this.access(() => {
      this.id(sessionId)
      this.id(slideId)
      const row = this.db
        .prepare('SELECT manifest FROM artifact_revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      return row ? this.readback.provenance(row) : []
    })
  }

  slideMetadata(
    sessionId: string,
    slideId: string,
    revision: number,
  ): Pick<SlideContent, 'provenance' | 'notes' | 'imageCredits' | 'imageOmissions'> {
    return this.access(() => {
      this.id(sessionId)
      this.id(slideId)
      const row = this.db
        .prepare('SELECT manifest FROM artifact_revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      return row
        ? {
            provenance: this.readback.provenance(row),
            ...this.readback.imageMetadata(row),
            ...(this.readback.notes(row) ? { notes: this.readback.notes(row)! } : {}),
          }
        : {}
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
      const artifact = this.db
        .prepare('SELECT * FROM artifact_revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      if (artifact)
        return {
          sessionId,
          slideId,
          revision,
          html: this.readback.content(artifact),
          provenance: this.readback.provenance(artifact),
          ...this.readback.metadata(artifact),
          ...this.readback.imageMetadata(artifact),
          ...(this.readback.notes(artifact) ? { notes: this.readback.notes(artifact)! } : {}),
        }
      return { sessionId, slideId, revision, html: String(row.html) }
    })
  }
  nativeArtifact(
    sessionId: string,
    slideId: string,
    revision: number,
  ): {
    bytes: Uint8Array
    descriptor: import('@deckagent/presentation-document').ArtifactDescriptor
    document?: import('@deckagent/presentation-document').SlideDocument
  } {
    return this.access(() => {
      this.id(sessionId)
      this.id(slideId)
      if (!Number.isSafeInteger(revision) || revision < 1) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      const row = this.db
        .prepare('SELECT * FROM artifact_revisions WHERE session_id=? AND slide_id=? AND revision=?')
        .get(sessionId, slideId, revision)
      if (!row) throw new DeckError('DECK_CONTENT_NOT_FOUND')
      return this.readback.native(row)
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
      if (error instanceof DesignError) throw new DeckError(error.code)
      if (error instanceof FormatError && !(error instanceof DeckError)) throw new DeckError(error.code, error.issues)
      throw error instanceof DeckError || (error instanceof Error && error.name === 'AbortError')
        ? error
        : new DeckError('DECK_STORAGE')
    }
  }
  private async asyncAccess<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      return this.access(() => {
        throw error
      })
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
