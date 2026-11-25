import { randomUUID } from 'node:crypto'
import { decodeArtifactDescriptor, documentText, requiredSlideText } from '@deckagent/presentation-document'
import type { SlideDocument, FormatAdapter, BuiltArtifact } from '@deckagent/presentation-document'
import { DeckError, isRecord, sha256Hex, validId } from './errors.ts'
import type {
  ArtifactAsset,
  ArtifactPublication,
  ContentProvenance,
  DeckOptions,
  GenerationGrant,
  GenerationSnapshot,
  PreparedResearchImage,
  StageChunk,
  StageStatus,
} from './generation-contracts.ts'
import type { OutlineProposal } from './outline-contracts.ts'
import { ArtifactFileStore, hashMismatch, isValidImageCredit, isValidPngBytes, parseJsonObject } from './artifact-fs.ts'
import type { ArtifactStaging, Stage } from './artifact-stage.ts'

export interface PreparedArtifact {
  readonly artifactId: string
  readonly digest: string
  readonly manifest: string
  readonly fingerprint: string
}

function stagedState(stage: Stage): string {
  return sha256Hex(JSON.stringify([stage.digest, stage.assets, stage.document, stage.provenance, stage.notes]))
}

/** Managed immutable files only. DeckStore owns metadata transactions and active-grant checks. */
export class ArtifactStorage {
  private readonly imageAttempts = new WeakMap<GenerationGrant, number>()
  private readonly researchImages = new WeakMap<GenerationGrant, Map<string, Promise<PreparedResearchImage>>>()
  constructor(
    private readonly files: ArtifactFileStore,
    private readonly staging: ArtifactStaging,
    private readonly formats: ReadonlyMap<string, FormatAdapter>,
    private readonly options: DeckOptions,
  ) {}
  begin(
    grant: GenerationGrant,
    slide: OutlineProposal['slides'][number],
    layoutId: string,
    generation: GenerationSnapshot,
  ): StageStatus {
    return this.staging.begin(grant, slide, layoutId, generation)
  }
  setDocument(grant: GenerationGrant, stageId: string, document: SlideDocument): void {
    this.staging.setDocument(grant, stageId, document)
  }
  draft(grant: GenerationGrant, stageId: string): StageStatus {
    return this.staging.draft(grant, stageId)
  }
  append(grant: GenerationGrant, stageId: string, chunk: StageChunk): StageStatus {
    return this.staging.append(grant, stageId, chunk)
  }
  setProvenance(grant: GenerationGrant, stageId: string, records: readonly ContentProvenance[], notes?: string): void {
    this.staging.setProvenance(grant, stageId, records, notes)
  }
  published(grant: GenerationGrant, stageId: string): void {
    this.staging.published(grant, stageId)
  }
  discard(grant: GenerationGrant, stageId: string): void {
    this.staging.discard(grant, stageId)
  }
  async asset(
    grant: GenerationGrant,
    stageId: string,
    attachmentId: string,
    slide: OutlineProposal['slides'][number],
    check: () => void,
    signal: AbortSignal,
  ): Promise<ArtifactAsset> {
    const stage = this.staging.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    const preparedImage = this.options.preparedImage
    if (
      stage.slideId !== slide.slideId ||
      !(slide.blocks ?? []).some(b => b.kind === 'image' && b.attachmentId === attachmentId) ||
      !preparedImage
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    const old = stage.assets.find(a => a.attachmentId === attachmentId)
    if (old) return old
    if (stage.documentAuthored) throw new DeckError('STAGE_DOCUMENT_FINALIZED')
    if (stage.finalized) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const image = await preparedImage(grant.sessionId, attachmentId, signal)
    signal.throwIfAborted()
    check()
    this.staging.stage(grant, stageId)
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const bytes = Buffer.from(image.bytes)
    if (
      !isValidPngBytes(bytes) ||
      stage.assets.reduce((n, a) => n + a.byteSize, 0) + bytes.length > 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(image.originalDigest) ||
      !/^[a-f0-9]{64}$/.test(image.parsedDigest) ||
      !(slide.sources ?? []).some(
        s => s.sourceId === image.source.sourceId && s.version === image.source.version && s.kind === image.source.kind,
      )
    )
      throw new DeckError('ARTIFACT_ASSET_INVALID')
    const asset: ArtifactAsset = {
      assetId: `asset-${randomUUID()}`,
      attachmentId,
      source: { sourceId: image.source.sourceId, version: image.source.version, kind: image.source.kind },
      digest: sha256Hex(bytes),
      originalDigest: image.originalDigest,
      parsedDigest: image.parsedDigest,
      byteSize: bytes.length,
    }
    this.files.write(`${asset.assetId}.png`, bytes)
    stage.assets.push(asset)
    if (stage.generation.design.template.version >= 2) this.staging.documentFromPlan(stage)
    return { ...asset }
  }
  async researchImage(
    grant: GenerationGrant,
    stageId: string,
    slide: OutlineProposal['slides'][number],
    query: string,
    limit: number,
    check: () => unknown,
    signal: AbortSignal,
  ): Promise<ArtifactAsset> {
    const stage = this.staging.stage(grant, stageId)
    if (
      stage.slideId !== slide.slideId ||
      !slide.blocks?.some(b => b.kind === 'web-image' && b.query === query) ||
      !this.options.researchImage
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    const old = stage.assets.find(a => a.webQuery === query)
    if (old) return old
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const image = await this.loadCachedResearchImage(grant, slide, query, limit, signal)
    signal.throwIfAborted()
    check()
    this.staging.stage(grant, stageId)
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const registered = stage.assets.find(a => a.webQuery === query)
    if (registered) return { ...registered }
    const bytes = Buffer.from(image.bytes)
    try {
      this.assertResearchImage(stage, image, bytes)
    } catch (error) {
      this.dropCachedResearchImage(grant, slide, query)
      throw error
    }
    const asset: ArtifactAsset = {
      assetId: `asset-${randomUUID()}`,
      webQuery: query,
      source: image.source,
      digest: sha256Hex(bytes),
      originalDigest: image.originalDigest,
      parsedDigest: image.parsedDigest,
      byteSize: bytes.length,
      credit: { ...image.credit },
    }
    this.files.write(`${asset.assetId}.png`, bytes)
    stage.assets.push(asset)
    if (stage.generation.design.template.version >= 2) this.staging.documentFromPlan(stage)
    return { ...asset }
  }
  private assertResearchImage(stage: Stage, image: PreparedResearchImage, bytes: Buffer): void {
    if (
      !isValidPngBytes(bytes) ||
      stage.assets.reduce((sum, a) => sum + a.byteSize, 0) + bytes.length > 1024 * 1024 ||
      image.source.kind !== 'research' ||
      !validId(image.source.sourceId) ||
      !/^[a-f0-9]{64}$/.test(image.originalDigest) ||
      hashMismatch(image.parsedDigest, bytes) ||
      !isValidImageCredit(image.credit)
    )
      throw new DeckError('ARTIFACT_ASSET_INVALID')
  }
  private async loadCachedResearchImage(
    grant: GenerationGrant,
    slide: OutlineProposal['slides'][number],
    query: string,
    limit: number,
    signal: AbortSignal,
  ): Promise<PreparedResearchImage> {
    let cached = this.researchImages.get(grant)
    if (!cached) {
      cached = new Map()
      this.researchImages.set(grant, cached)
      const grantCache = cached
      signal.addEventListener('abort', () => grantCache.clear(), { once: true })
    }
    const cache = cached
    const key = JSON.stringify([slide.slideId, query])
    let work = cache.get(key)
    if (!work) {
      const research = this.options.researchImage
      if (!research) throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
      const attempts = this.imageAttempts.get(grant) ?? 0
      if (attempts >= limit) throw new DeckError('RESEARCH_IMAGE_BUDGET')
      this.imageAttempts.set(grant, attempts + 1)
      // A layout retry copies the same normalized image into a new stage, without another external lookup.
      work = research(grant.sessionId, query, signal)
        .then(image => ({
          ...image,
          bytes: Buffer.from(image.bytes),
          source: { ...image.source },
          credit: { ...image.credit },
        }))
        .catch(error => {
          cache.delete(key)
          throw error
        })
      cache.set(key, work)
    }
    return work
  }
  private dropCachedResearchImage(
    grant: GenerationGrant,
    slide: OutlineProposal['slides'][number],
    query: string,
  ): void {
    this.researchImages.get(grant)?.delete(JSON.stringify([slide.slideId, query]))
  }
  private assertStageReadyForBuild(
    stage: Stage,
    input: ArtifactPublication,
    slide: OutlineProposal['slides'][number],
    generation: GenerationSnapshot,
    validationOnly: boolean,
  ): void {
    if (validationOnly && generation.design.template.version >= 2 && ++stage.validations > 3)
      throw new DeckError('SLIDE_CORRECTION_LIMIT')
    if (generation.design.template.version >= 2 && stage.validations > 3) throw new DeckError('SLIDE_CORRECTION_LIMIT')
    if (generation.design.template.version >= 2 && ++stage.buildAttempts > 4)
      throw new DeckError('SLIDE_CORRECTION_LIMIT')
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    if (!stage.finalized || stage.slideId !== input.slideId) throw new DeckError('STAGE_INCOMPLETE')
    if (
      stage.document &&
      documentText(stage.document).some(
        text => !stage.provenance.some(p => p.text.replace(/\s+/g, ' ').includes(text.replace(/\s+/g, ' '))),
      )
    )
      throw new DeckError('PROVENANCE_REQUIRED', [
        {
          code: 'PROVENANCE_REQUIRED',
          path: 'document.provenance',
          message: 'Record the origin of every title, text item and caption before validation/publication.',
        },
      ])
    if (
      slide.blocks?.some(
        (b, index) =>
          (b.kind === 'web-image' &&
            b.required !== false &&
            !stage.assets.some(a => this.staging.matchesNeed(stage, a, index, b.query))) ||
          (b.kind === 'image' && !stage.assets.some(a => a.attachmentId === b.attachmentId)),
      )
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
  }
  async prepare(
    grant: GenerationGrant,
    input: ArtifactPublication,
    slide: OutlineProposal['slides'][number],
    generation: GenerationSnapshot,
    check: () => void,
    signal: AbortSignal,
    validationOnly = false,
  ): Promise<PreparedArtifact> {
    const stage = this.staging.stage(grant, input.stageId)
    this.assertStageReadyForBuild(stage, input, slide, generation, validationOnly)
    const source = this.staging.source(stage)
    if (sha256Hex(source) !== stage.digest) throw new DeckError('ARTIFACT_CORRUPT')
    const adapter = this.formats.get(generation.format)
    if (!adapter) throw new DeckError('FORMAT_UNAVAILABLE')
    const checkedState = stagedState(stage)
    const artifact = await adapter.build(source, this.staging.context(stage, generation))
    return this.verifyBuiltArtifact(grant, input, slide, stage, generation, artifact, checkedState, check, signal)
  }
  private async verifyBuiltArtifact(
    grant: GenerationGrant,
    input: ArtifactPublication,
    slide: OutlineProposal['slides'][number],
    stage: Stage,
    generation: GenerationSnapshot,
    artifact: BuiltArtifact,
    checkedState: string,
    check: () => void,
    signal: AbortSignal,
  ): Promise<PreparedArtifact> {
    const descriptor = decodeArtifactDescriptor(artifact.descriptor)
    stage.descriptor = descriptor
    if (descriptor.format !== generation.format) throw new DeckError('ARTIFACT_DESCRIPTOR_INVALID')
    const document = Buffer.from(artifact.bytes)
    signal.throwIfAborted()
    check()
    if (artifact.preview !== undefined) {
      if (!this.options.renderCheck) throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
      await this.options.renderCheck(
        artifact.preview,
        [
          ...requiredSlideText(slide),
          ...(stage.document ? documentText(stage.document) : []),
          ...stage.provenance.map(p => p.text),
        ],
        signal,
      )
    }
    signal.throwIfAborted()
    check()
    this.staging.stage(grant, input.stageId)
    if (stagedState(stage) !== checkedState) throw new DeckError('STAGE_CHANGED')
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    const artifactId = `artifact-${randomUUID()}`
    this.files.write(`${artifactId}.${descriptor.extension}`, document)
    const manifest = this.manifest(stage, generation, slide)
    return {
      artifactId,
      digest: sha256Hex(document),
      manifest,
      fingerprint: sha256Hex(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest])),
    }
  }
  private manifest(stage: Stage, generation: GenerationSnapshot, slide: OutlineProposal['slides'][number]): string {
    return JSON.stringify({
      policyVersion: stage.descriptor?.policyVersion ?? 'b04-artifact-v1',
      ...(stage.descriptor ? { artifact: stage.descriptor } : {}),
      ...(stage.document ? { document: stage.document } : {}),
      sourceDigest: stage.digest,
      assets: stage.assets,
      design: generation.design,
      layoutId: stage.layoutId,
      requestId: stage.grant.requestId,
      intentId: stage.grant.intentId,
      sourceRefs: slide.sources ?? [],
      provenance: stage.provenance,
      imageOmissions: (slide.blocks ?? []).flatMap((b, index) =>
        b.kind === 'web-image' && !stage.assets.some(a => this.staging.matchesNeed(stage, a, index, b.query))
          ? [b.query]
          : [],
      ),
      ...(stage.notes ? { notes: stage.notes } : {}),
    })
  }
  receiptFingerprint(
    grant: GenerationGrant,
    input: ArtifactPublication,
    generation: GenerationSnapshot,
    slide: OutlineProposal['slides'][number],
  ): string {
    const stage = this.staging.stage(grant, input.stageId)
    const manifest = this.manifest(stage, generation, slide)
    return sha256Hex(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest]))
  }
  removeValidationArtifact(artifact: PreparedArtifact): void {
    const manifest = parseJsonObject(artifact.manifest)
    const descriptor = manifest.artifact
    const extension = isRecord(descriptor) && typeof descriptor.extension === 'string' ? descriptor.extension : 'html'
    this.files.remove(`${artifact.artifactId}.${extension}`)
  }
}
