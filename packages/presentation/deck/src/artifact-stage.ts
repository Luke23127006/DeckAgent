import { randomUUID } from 'node:crypto'
import { resolveLayout } from '@deckagent/design'
import { decodeSlideDocument, documentText, requiredSlideText } from '@deckagent/presentation-document'
import type {
  SlideDocument,
  SlideNode,
  FormatAdapter,
  FormatContext,
  ArtifactDescriptor,
} from '@deckagent/presentation-document'
import type {
  ArtifactAsset,
  ContentProvenance,
  GenerationGrant,
  GenerationSnapshot,
  StageChunk,
  StageStatus,
} from './generation-contracts.ts'
import type { OutlineProposal } from './outline-contracts.ts'
import { DeckError, sha256Hex } from './errors.ts'
import { ArtifactFileStore, validateProvenance } from './artifact-fs.ts'
import type { PreparedImageStore } from './image-store.ts'

export interface Stage {
  validations: number
  buildAttempts: number
  documentAuthored: boolean
  readonly stageId: string
  readonly grant: GenerationGrant
  readonly slideId: string
  readonly layoutId: string
  readonly chunks: { readonly digest: string; readonly final: boolean; readonly bytes: number }[]
  readonly assets: ArtifactAsset[]
  provenance: readonly ContentProvenance[]
  notes?: string
  document?: SlideDocument
  descriptor?: ArtifactDescriptor
  readonly generation: GenerationSnapshot
  readonly plan: OutlineProposal['slides'][number]
  finalized: boolean
  digest: string | null
  published: boolean
}

/** Owns open slide stages and their source chunks. DeckStore owns grant checks and transactions. */
export class ArtifactStaging {
  private readonly stageAttempts = new WeakMap<GenerationGrant, Map<string, number>>()
  private readonly stages = new Map<string, Stage>()

  constructor(
    private readonly files: ArtifactFileStore,
    private readonly images: PreparedImageStore,
    private readonly formats: ReadonlyMap<string, FormatAdapter>,
  ) {}

  stage(grant: GenerationGrant, stageId: string): Stage {
    const stage = this.stages.get(stageId)
    if (!stage || stage.grant !== grant) throw new DeckError('STAGE_NOT_FOUND')
    return stage
  }

  source(stage: Stage): string {
    return Buffer.concat(
      stage.chunks.map((c, i) => this.files.read(`${stage.stageId}-${i}.part`, c.digest, 8 * 1024)),
    ).toString('utf8')
  }

  context(stage: Stage, generation: GenerationSnapshot): FormatContext {
    return {
      design: generation.design,
      layoutId: stage.layoutId,
      assets: stage.assets.map(a => ({
        assetId: a.assetId,
        byteSize: a.byteSize,
        bytes: this.files.read(`${a.assetId}.png`, a.digest, 256 * 1024),
      })),
      ...(stage.document ? { document: stage.document } : {}),
    }
  }

  matchesNeed(stage: Stage, asset: ArtifactAsset, index: number, query: string): boolean {
    const record = this.images.preparedRecord(
      stage.grant.sessionId,
      stage.generation.receipt.outlineId,
      stage.slideId,
      index,
      query,
    )
    return asset.imageNeedId ? asset.imageNeedId === record?.needId : asset.webQuery === query
  }

  documentFromPlan(stage: Stage): void {
    const nodes: SlideNode[] = []
    ;(stage.plan.blocks ?? []).forEach((block, index) => {
      const id = `node-${index}`
      if (block.kind === 'web-image' || block.kind === 'image') {
        const asset = stage.assets.find(a =>
          block.kind === 'web-image'
            ? this.matchesNeed(stage, a, index, block.query)
            : a.attachmentId === block.attachmentId,
        )
        if (asset)
          nodes.push({
            id,
            kind: 'image',
            assetId: asset.assetId,
            ...(block.caption ? { caption: block.caption } : {}),
          })
        return
      }
      nodes.push({ id, ...block })
    })
    stage.document = decodeSlideDocument({
      schemaVersion: 1,
      slideId: stage.slideId,
      title: stage.plan.title,
      layoutIntent: stage.layoutId,
      nodes,
      provenance: stage.provenance,
      ...(stage.notes ? { notes: stage.notes } : {}),
    })
  }

  private status(stage: Stage): StageStatus {
    return {
      stageId: stage.stageId,
      nextSequence: stage.chunks.length,
      finalized: stage.finalized,
      digest: stage.digest,
      ...(stage.document
        ? {
            document: structuredClone(stage.document),
            assets: structuredClone(stage.assets),
            ...this.formats.get(stage.generation.format)?.context(this.context(stage, stage.generation)),
          }
        : {}),
    }
  }

  begin(
    grant: GenerationGrant,
    slide: OutlineProposal['slides'][number],
    layoutId: string,
    generation: GenerationSnapshot,
  ): StageStatus {
    if (!this.files.root) throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    if ([...this.stages.values()].filter(s => s.grant.requestId === grant.requestId && !s.published).length >= 2)
      throw new DeckError('STAGE_LIMIT')

    resolveLayout({ title: slide.title, blocks: slide.blocks }, layoutId, generation.design.template)

    if (generation.design.template.version >= 2) {
      let attempts = this.stageAttempts.get(grant)
      if (!attempts) {
        attempts = new Map()
        this.stageAttempts.set(grant, attempts)
      }
      const count = attempts.get(slide.slideId) ?? 0
      if (count >= 4) throw new DeckError('SLIDE_CORRECTION_LIMIT')
      attempts.set(slide.slideId, count + 1)
    }

    const stage: Stage = {
      stageId: `stage-${randomUUID()}`,
      grant,
      slideId: slide.slideId,
      layoutId,
      generation,
      plan: slide,
      chunks: [],
      assets: [],
      provenance: [],
      finalized: false,
      digest: null,
      published: false,
      validations: 0,
      buildAttempts: 0,
      documentAuthored: false,
    }
    this.stages.set(stage.stageId, stage)

    if (generation.design.template.version >= 2) {
      for (const [blockIndex, block] of (slide.blocks ?? []).entries())
        if (block.kind === 'web-image') {
          const asset = this.images.preparedRecord(
            grant.sessionId,
            generation.receipt.outlineId,
            slide.slideId,
            blockIndex,
            block.query,
          )?.asset
          if (asset) {
            if (
              stage.assets.some(a => (a.imageNeedId ? a.imageNeedId === asset.imageNeedId : a.webQuery === block.query))
            )
              continue
            const bytes = this.files.read(`${asset.assetId}.png`, asset.digest, 256 * 1024)
            const copy = { ...asset, assetId: `asset-${randomUUID()}` }
            this.files.write(`${copy.assetId}.png`, bytes)
            stage.assets.push(copy)
          } else if (block.required !== false) {
            this.stages.delete(stage.stageId)
            throw new DeckError('IMAGE_PREPARATION_REQUIRED')
          }
        }
      this.documentFromPlan(stage)
    }

    return this.status(stage)
  }

  setDocument(grant: GenerationGrant, stageId: string, input: SlideDocument): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')

    const document = decodeSlideDocument(input)
    if (
      document.slideId !== stage.slideId ||
      document.layoutIntent !== stage.layoutId ||
      document.nodes.some(n => n.kind === 'image' && !stage.assets.some(a => a.assetId === n.assetId))
    )
      throw new DeckError('SLIDE_DOCUMENT_SCOPE')
    if (stage.assets.some(a => !document.nodes.some(n => n.kind === 'image' && n.assetId === a.assetId)))
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')

    const actual = documentText(document).join('\n').replace(/\s+/g, ' ')
    if (requiredSlideText(stage.plan).some(text => !actual.includes(text.replace(/\s+/g, ' '))))
      throw new DeckError('ARTIFACT_REQUIRED_CONTENT_MISSING')

    const { notes: _notes, ...content } = document
    stage.document = { ...content, provenance: stage.provenance, ...(stage.notes ? { notes: stage.notes } : {}) }
    stage.documentAuthored = true
  }

  draft(grant: GenerationGrant, stageId: string): StageStatus {
    return this.status(this.stage(grant, stageId))
  }

  append(grant: GenerationGrant, stageId: string, value: StageChunk): StageStatus {
    const stage = this.stage(grant, stageId)
    if (
      !value ||
      Object.keys(value).some(k => !['sequence', 'text', 'final'].includes(k)) ||
      !Number.isSafeInteger(value.sequence) ||
      value.sequence < 0 ||
      value.sequence >= 64 ||
      typeof value.text !== 'string' ||
      !value.text.isWellFormed() ||
      !value.text.length ||
      typeof value.final !== 'boolean' ||
      Buffer.byteLength(value.text) > 8 * 1024 ||
      Buffer.byteLength(JSON.stringify(value)) > 64 * 1024
    )
      throw new DeckError('STAGE_CHUNK_INVALID')

    const fingerprint = sha256Hex(value.text),
      old = stage.chunks[value.sequence]

    if (old) {
      if (old.digest !== fingerprint || old.final !== value.final) throw new DeckError('STAGE_CHUNK_CONFLICT')
      return this.status(stage)
    }

    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    if (stage.finalized || value.sequence !== stage.chunks.length) throw new DeckError('STAGE_SEQUENCE_CONFLICT')
    if (stage.chunks.reduce((n, c) => n + c.bytes, 0) + Buffer.byteLength(value.text) > 256 * 1024)
      throw new DeckError('STAGE_SOURCE_TOO_LARGE')

    this.files.write(`${stage.stageId}-${value.sequence}.part`, value.text)
    stage.chunks.push({ digest: fingerprint, final: value.final, bytes: Buffer.byteLength(value.text) })

    if (value.final) {
      stage.finalized = true
      stage.digest = sha256Hex(this.source(stage))
    }

    return this.status(stage)
  }

  setProvenance(grant: GenerationGrant, stageId: string, records: readonly ContentProvenance[], notes?: string): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')

    const validated = validateProvenance(records)
    if (
      notes !== undefined &&
      (typeof notes !== 'string' || !notes.trim() || notes.length > 16000 || !notes.isWellFormed())
    )
      throw new DeckError('PROVENANCE_INVALID')

    stage.provenance = validated
    if (notes === undefined) delete stage.notes
    else stage.notes = notes

    if (stage.document) {
      const { notes: _old, ...document } = stage.document
      stage.document = { ...document, provenance: validated, ...(notes ? { notes } : {}) }
    }
  }

  published(grant: GenerationGrant, stageId: string): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) return
    for (let i = 0; i < stage.chunks.length; i++) this.files.remove(`${stage.stageId}-${i}.part`)
    // Keep an in-memory receipt description so an identical publish retry can be checked without staged bytes.
    stage.published = true
  }

  discard(grant: GenerationGrant, stageId: string): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    for (let i = 0; i < stage.chunks.length; i++) this.files.remove(`${stage.stageId}-${i}.part`)
    for (const a of stage.assets) this.files.remove(`${a.assetId}.png`)
    this.stages.delete(stageId)
  }
}
