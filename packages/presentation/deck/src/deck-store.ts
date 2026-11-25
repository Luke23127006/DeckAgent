import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ArtifactDescriptor, SlideDocument } from '@deckagent/presentation-document'
import { ArtifactFileStore } from './artifact-fs.ts'
import { ArtifactReadback } from './artifact-readback.ts'
import { ArtifactStaging } from './artifact-stage.ts'
import { ArtifactStorage } from './artifact-store.ts'
import type { BriefProposalInput, BriefRecord, BriefSnapshot } from './brief-contracts.ts'
import { BriefStorage } from './brief-store.ts'
import { DeckAuthoring } from './deck-authoring.ts'
import type { AuthoringHost } from './deck-authoring.ts'
import type {
  ConfirmedDeckPlan,
  DeckChange,
  DeckReader,
  DeckSnapshot,
  PublishedSlide,
  PublishSlide,
  SlideContent,
} from './deck-contracts.ts'
import { GenerationWorkflow } from './deck-generation.ts'
import type { GenerationHost } from './deck-generation.ts'
import { createGenerationCapability, publishLegacySlide } from './deck-publication.ts'
import type { PublicationHost } from './deck-publication.ts'
import { DeckReads } from './deck-reads.ts'
import type { ReadHost } from './deck-reads.ts'
import { DeckRuntime } from './deck-runtime.ts'
import { DeckError } from './errors.ts'
import type {
  ConfirmationReceipt,
  ContentProvenance,
  DeckOptions,
  GenerationCapability,
  GenerationGrant,
  GenerationSnapshot,
  ImageResolver,
  PreparedResearchImage,
} from './generation-contracts.ts'
import { GenerationStorage } from './generation-store.ts'
import { PreparedImageStore } from './image-store.ts'
import type {
  BoundOutlineInput,
  OutlineDraft,
  OutlineProposal,
  OutlineSnapshot,
  OutlineTarget,
} from './outline-contracts.ts'
import { OutlineStorage } from './outline-store.ts'
import { initialize } from './schema.ts'

type DeckHost = PublicationHost & GenerationHost & AuthoringHost

/** One authoritative deck per Session. Own close() after Host/Agent teardown.
 * All methods are synchronous so a committed state and its notice have one order.
 */
export class DeckStore implements DeckReader {
  private readonly db: DatabaseSync
  private readonly briefs: BriefStorage
  private readonly outlines: OutlineStorage
  private readonly generations: GenerationStorage
  private readonly artifacts: ArtifactStorage
  private readonly images: PreparedImageStore
  private readonly readback: ArtifactReadback
  private readonly listeners = new Map<string, Set<(change: DeckChange) => void>>()
  private readonly publicationsInFlight = new Map<string, Promise<PublishedSlide>>()
  private readonly authoring: DeckAuthoring
  private readonly workflow: GenerationWorkflow
  private readonly reads: DeckReads
  private readonly runtime: DeckRuntime
  private readonly host: DeckHost

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
    this.runtime = new DeckRuntime(this.db, this.listeners)
    this.host = this.createHost()
    this.reads = new DeckReads(this.createReadHost())
    this.authoring = new DeckAuthoring(this.host)
    this.workflow = new GenerationWorkflow(this.host)
  }

  private createHost(): DeckHost {
    return {
      db: this.db,
      briefs: this.briefs,
      outlines: this.outlines,
      images: this.images,
      generations: this.generations,
      artifacts: this.artifacts,
      options: this.options,
      publicationsInFlight: this.publicationsInFlight,
      granted: grant => this.workflow.granted(grant),
      snapshot: sessionId => this.reads.snapshot(sessionId),
      hasGeneration: sessionId => this.reads.generation(sessionId) !== null,
      insertPlan: (sessionId, plan) => this.authoring.insertPlan(sessionId, plan),
      access: operation => this.runtime.access(operation),
      asyncAccess: operation => this.runtime.asyncAccess(operation),
      transaction: operation => this.runtime.transaction(operation),
      notify: (sessionId, version) => this.runtime.notify(sessionId, version),
    }
  }

  private createReadHost(): ReadHost {
    return {
      db: this.db,
      generations: this.generations,
      readback: this.readback,
      listeners: this.listeners,
      access: operation => this.runtime.access(operation),
    }
  }

  /** Trusted compatibility import for operator-controlled TASK-005 fixtures only. */
  confirm(sessionId: string, plan: ConfirmedDeckPlan): void {
    this.authoring.confirm(sessionId, plan)
  }

  outlineSnapshot(sessionId: string): OutlineSnapshot {
    return this.authoring.outlineSnapshot(sessionId)
  }

  briefSnapshot(sessionId: string): BriefSnapshot {
    return this.authoring.briefSnapshot(sessionId)
  }

  briefVersion(sessionId: string, briefId: string, version: number): BriefRecord {
    return this.authoring.briefVersion(sessionId, briefId, version)
  }

  saveBrief(sessionId: string, input: { readonly expectedVersion: number; readonly draft: unknown }): BriefRecord {
    return this.authoring.saveBrief(sessionId, input)
  }

  proposeBoundOutline(sessionId: string, input: BoundOutlineInput): OutlineProposal {
    return this.authoring.proposeBoundOutline(sessionId, input)
  }

  /** Atomically saves a completed request's staged Brief/Outline before Session terminal status. */
  async prepareOutlineImages(
    sessionId: string,
    input: BriefProposalInput,
    signal: AbortSignal,
    resolver?: ImageResolver,
  ): Promise<object> {
    return this.authoring.prepareOutlineImages(sessionId, input, signal, resolver)
  }

  reserveImageSearch(sessionId: string, requestId: string): void {
    this.authoring.reserveImageSearch(sessionId, requestId)
  }

  outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array {
    return this.authoring.outlineImagePreview(sessionId, outlineId, needId)
  }

  restoredOutlineImage(sessionId: string, outlineId: string, needId: string): PreparedResearchImage {
    return this.authoring.restoredOutlineImage(sessionId, outlineId, needId)
  }

  imageBlockers(sessionId: string): readonly { code: string; message: string }[] {
    return this.authoring.imageBlockers(sessionId)
  }

  commitBriefProposal(sessionId: string, input: BriefProposalInput, preparedImages?: object): BriefRecord {
    return this.authoring.commitBriefProposal(sessionId, input, preparedImages)
  }

  beginOutline(sessionId: string): void {
    this.authoring.beginOutline(sessionId)
  }

  generation(sessionId: string): GenerationSnapshot | null {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      return this.reads.generation(sessionId)
    })
  }

  confirmGeneration(
    sessionId: string,
    value: unknown,
    selection: GenerationSnapshot['selection'],
  ): ConfirmationReceipt {
    return this.workflow.confirmGeneration(sessionId, value, selection)
  }

  /** A user-admitted new request continues only missing slides; confirmation and first start stay immutable. */
  continueGeneration(sessionId: string, requestId: string, selection: GenerationSnapshot['selection']): void {
    this.workflow.continueGeneration(sessionId, requestId, selection)
  }

  admitGeneration(sessionId: string, intentId: string, requestId: string): void {
    this.workflow.admitGeneration(sessionId, intentId, requestId)
  }

  startGeneration(sessionId: string, intentId: string, requestId: string): GenerationGrant {
    return this.workflow.startGeneration(sessionId, intentId, requestId)
  }

  finishGeneration(
    sessionId: string,
    intentId: string,
    requestId: string,
    outcome: 'completed' | 'failed' | 'stopped' | 'interrupted',
  ): void {
    this.workflow.finishGeneration(sessionId, intentId, requestId, outcome)
  }

  reconcileGenerations(requestExists?: (sessionId: string, requestId: string) => boolean): void {
    this.workflow.reconcileGenerations(requestExists)
  }

  generationCapability(grant: GenerationGrant, signal: AbortSignal): GenerationCapability {
    return createGenerationCapability(this.host, grant, signal)
  }

  proposeOutline(
    sessionId: string,
    input: { readonly requestId: string; readonly responseIndex: number; readonly draft: OutlineDraft },
  ): OutlineProposal {
    return this.authoring.proposeOutline(sessionId, input)
  }

  currentOutline(sessionId: string, target: OutlineTarget): OutlineProposal {
    return this.authoring.currentOutline(sessionId, target)
  }

  confirmOutline(sessionId: string, target: OutlineTarget): void {
    this.authoring.confirmOutline(sessionId, target)
  }

  cancelOutline(sessionId: string, target: OutlineTarget): void {
    this.authoring.cancelOutline(sessionId, target)
  }

  snapshot(sessionId: string): DeckSnapshot {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      return this.reads.snapshot(sessionId)
    })
  }

  publish(sessionId: string, input: PublishSlide, signal?: AbortSignal): PublishedSlide {
    return publishLegacySlide(this.host, sessionId, input, signal)
  }

  provenance(sessionId: string, slideId: string, revision: number): readonly ContentProvenance[] {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      this.runtime.id(slideId)
      return this.reads.provenance(sessionId, slideId, revision)
    })
  }

  slideMetadata(
    sessionId: string,
    slideId: string,
    revision: number,
  ): Pick<SlideContent, 'provenance' | 'notes' | 'imageCredits' | 'imageOmissions'> {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      this.runtime.id(slideId)
      return this.reads.slideMetadata(sessionId, slideId, revision)
    })
  }

  content(sessionId: string, slideId: string, revision: number): SlideContent {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      this.runtime.id(slideId)
      return this.reads.content(sessionId, slideId, revision)
    })
  }

  nativeArtifact(
    sessionId: string,
    slideId: string,
    revision: number,
  ): { bytes: Uint8Array; descriptor: ArtifactDescriptor; document?: SlideDocument } {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      this.runtime.id(slideId)
      return this.reads.nativeArtifact(sessionId, slideId, revision)
    })
  }

  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void {
    return this.runtime.access(() => {
      this.runtime.id(sessionId)
      return this.reads.subscribe(sessionId, listener)
    })
  }

  close(): void {
    this.runtime.close()
  }
}
