import { createHash, randomUUID } from 'node:crypto'
import {
  constants,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { resolveLayout } from '@deckagent/design'
import { DeckError, validId } from './contracts.ts'
import type {
  ArtifactAsset,
  ArtifactPublication,
  DeckOptions,
  GenerationGrant,
  GenerationSnapshot,
  OutlineProposal,
  StageChunk,
  StageStatus,
  BriefProposalInput,
  OutlineProposal as SavedOutline,
} from './contracts.ts'
import { HtmlFormatAdapter } from '@deckagent/html-format'
import {
  decodeSlideDocument,
  documentText,
  decodeArtifactDescriptor,
  requiredSlideText,
} from '@deckagent/presentation-document'
import type {
  SlideDocument,
  SlideNode,
  FormatAdapter,
  FormatContext,
  ArtifactDescriptor,
} from '@deckagent/presentation-document'
import { validateProvenance } from './provenance.ts'
import type { ContentProvenance } from './contracts.ts'
import { validateBriefDraft } from './brief-store.ts'
import { validateBoundOutline } from './bound-outline.ts'
import { outlineImageNeeds } from './image-needs.ts'
import type { ImageResolver, OutlineImageReview } from './contracts.ts'

interface PreparedRecord {
  query: string
  needId?: string
  slideIndex?: number
  blockIndex?: number
  slideId?: string
  asset?: ArtifactAsset
  failure?: string
}

const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const hashMismatch = (expected: string, bytes: Uint8Array) =>
  !/^[a-f0-9]{64}$/.test(expected) || digest(bytes) !== expected
interface Stage {
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
export interface PreparedArtifact {
  readonly artifactId: string
  readonly digest: string
  readonly manifest: string
  readonly fingerprint: string
}

/** Managed immutable files only. DeckService owns metadata transactions and active-grant checks. */
export class ArtifactStorage {
  private readonly preparations = new WeakMap<object, { fingerprint: string; records: PreparedRecord[] }>()
  private readonly stageAttempts = new WeakMap<GenerationGrant, Map<string, number>>()
  private readonly formats: ReadonlyMap<string, FormatAdapter>
  private readonly stages = new Map<string, Stage>()
  private readonly imageAttempts = new WeakMap<GenerationGrant, number>()
  private readonly researchImages = new WeakMap<
    GenerationGrant,
    Map<string, Promise<import('./contracts.ts').PreparedResearchImage>>
  >()
  private readonly root: string | undefined
  constructor(
    private readonly db: DatabaseSync,
    private readonly options: DeckOptions,
  ) {
    const formats = options.formats ?? [new HtmlFormatAdapter()]
    this.formats = new Map(formats.map(format => [format.id, format]))
    if (this.formats.size !== formats.length) throw new DeckError('FORMAT_DUPLICATE')
    if (!options.artifactRoot) return
    const root = resolve(options.artifactRoot)
    let existing = root
    while (!existsSync(existing)) {
      const parent = dirname(existing)
      if (parent === existing) throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
      existing = parent
    }
    if (lstatSync(existing).isSymbolicLink() || realpathSync(existing) !== existing)
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    mkdirSync(root, { recursive: true })
    if (lstatSync(root).isSymbolicLink() || realpathSync(root) !== root)
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    this.root = root
    this.recover()
  }
  private path(name: string): string {
    if (
      !this.root ||
      lstatSync(this.root).isSymbolicLink() ||
      realpathSync(this.root) !== this.root ||
      !/^(?:stage-[a-f0-9-]{36}-\d{1,2}\.part|artifact-[a-f0-9-]{36}\.[a-z0-9]{1,10}|asset-[a-f0-9-]{36}\.png)$/.test(
        name,
      )
    )
      throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
    return join(this.root, name)
  }
  private write(name: string, bytes: string | Uint8Array): void {
    const file = openSync(this.path(name), 'wx', 0o600)
    try {
      writeFileSync(file, bytes)
      fsyncSync(file)
    } finally {
      closeSync(file)
    }
  }
  private read(name: string, fingerprint: string, limit: number): Buffer {
    const path = this.path(name),
      stat = lstatSync(path)
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > limit) throw new DeckError('ARTIFACT_CORRUPT')
    const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
    try {
      const bytes = readFileSync(fd)
      if (bytes.length > limit || digest(bytes) !== fingerprint) throw new DeckError('ARTIFACT_CORRUPT')
      return bytes
    } finally {
      closeSync(fd)
    }
  }
  private stage(grant: GenerationGrant, stageId: string): Stage {
    const stage = this.stages.get(stageId)
    if (!stage || stage.grant !== grant) throw new DeckError('STAGE_NOT_FOUND')
    return stage
  }
  async prepareImages(
    sessionId: string,
    input: BriefProposalInput,
    signal: AbortSignal,
    resolver?: ImageResolver,
  ): Promise<object> {
    const records: PreparedRecord[] = []
    const brief = validateBriefDraft(input.draft),
      outline = input.outline ? validateBoundOutline(input.outline) : undefined
    const needs = brief.template?.version === 1 || !outline ? [] : outlineImageNeeds(outline)
    if (needs.length && brief.images.mode !== 'public-research') throw new DeckError('IMAGE_CHOICE_REQUIRED')
    if (needs.length > 32) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    for (const need of needs) {
      const { query, needId, slideIndex, blockIndex } = need
      const identity = { query, needId, slideIndex, blockIndex }
      signal.throwIfAborted()
      if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
        throw new DeckError('REQUEST_CLOSED')
      const previous = this.db
        .prepare('SELECT payload FROM prepared_images WHERE session_id=? AND image_key=? ORDER BY rowid DESC')
        .all(sessionId, needId)
        .map(r => JSON.parse(String(r.payload)))
        .find(r => r.asset)
      if (!resolver && !need.replace && previous?.asset) {
        try {
          this.read(`${previous.asset.assetId}.png`, previous.asset.digest, 256 * 1024)
          records.push({ ...identity, asset: previous.asset })
          continue
        } catch {
          /* A new reviewed proposal is allowed to prepare a replacement, without changing old records. */
        }
      }
      try {
        if (!resolver && !this.options.researchImage) throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
        const image = resolver
          ? await resolver(need, signal)
          : await this.options.researchImage!(sessionId, query, signal)
        signal.throwIfAborted()
        if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
          throw new DeckError('REQUEST_CLOSED')
        const bytes = Buffer.from(image.bytes)
        if (
          bytes.length > 256 * 1024 ||
          !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
          hashMismatch(image.parsedDigest, bytes) ||
          !/^[a-f0-9]{64}$/.test(image.originalDigest) ||
          image.source.kind !== 'research' ||
          !validId(image.source.sourceId) ||
          !Number.isSafeInteger(image.source.version) ||
          image.source.version < 1 ||
          !['public-domain', 'CC0', 'CC BY', 'unknown'].includes(image.credit.license) ||
          image.credit.unknownLicense !== (image.credit.license === 'unknown') ||
          !image.credit.url.startsWith('https://') ||
          !image.credit.author ||
          typeof image.credit.licenseUrl !== 'string' ||
          typeof image.credit.retrievedAt !== 'string'
        )
          throw new DeckError('ARTIFACT_ASSET_INVALID')
        const asset: ArtifactAsset = {
          assetId: `asset-${randomUUID()}`,
          webQuery: query,
          imageNeedId: needId,
          ...(image.selection ? { selection: { ...image.selection } } : {}),
          source: { ...image.source },
          credit: { ...image.credit },
          digest: digest(bytes),
          originalDigest: image.originalDigest,
          parsedDigest: image.parsedDigest,
          byteSize: bytes.length,
        }
        this.write(`${asset.assetId}.png`, bytes)
        records.push({ ...identity, asset })
      } catch (error) {
        signal.throwIfAborted()
        if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
          throw new DeckError('REQUEST_CLOSED')
        records.push({ ...identity, failure: error instanceof DeckError ? error.code : 'ARTIFACT_ASSET_UNAVAILABLE' })
      }
    }
    const token = Object.freeze({})
    this.preparations.set(token, { fingerprint: digest(JSON.stringify([sessionId, input])), records })
    return token
  }
  commitImages(sessionId: string, input: BriefProposalInput, outline: SavedOutline, token?: object): void {
    if (!token) return
    if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
      throw new DeckError('REQUEST_CLOSED')
    const prepared = this.preparations.get(token)
    if (!prepared || prepared.fingerprint !== digest(JSON.stringify([sessionId, input])))
      throw new DeckError('IMAGE_PREPARATION_STALE')
    for (const record of prepared.records)
      this.db.prepare('INSERT INTO prepared_images VALUES(?,?,?,?)').run(
        sessionId,
        outline.outlineId,
        record.needId ?? record.query,
        JSON.stringify({
          ...record,
          ...(record.slideIndex === undefined ? {} : { slideId: outline.slides[record.slideIndex]?.slideId }),
        }),
      )
  }
  private preparedRecord(
    sessionId: string,
    outlineId: string,
    slideId: string,
    blockIndex: number,
    query: string,
  ): PreparedRecord | undefined {
    const records = this.db
      .prepare('SELECT payload FROM prepared_images WHERE session_id=? AND outline_id=?')
      .all(sessionId, outlineId)
      .map(r => JSON.parse(String(r.payload)) as PreparedRecord)
    return (
      records.find(r => r.needId && r.slideId === slideId && r.blockIndex === blockIndex) ??
      records.find(r => !r.needId && r.query === query)
    )
  }
  imageReview(sessionId: string, outline: SavedOutline, verify = false): readonly OutlineImageReview[] {
    if ((outline.brief?.design?.template.version ?? 1) < 2) return []
    return outlineImageNeeds(outline).map(need => {
      const slide = outline.slides[need.slideIndex]!
      const row = this.preparedRecord(sessionId, outline.outlineId, slide.slideId, need.blockIndex, need.query)
      let available = false
      if (row?.asset)
        try {
          if (verify) this.read(`${row.asset.assetId}.png`, row.asset.digest, 256 * 1024)
          available = existsSync(this.path(`${row.asset.assetId}.png`))
        } catch {
          /* Kept for review. */
        }
      return {
        needId: row?.needId ?? need.needId,
        slideIndex: need.slideIndex,
        blockIndex: need.blockIndex,
        required: need.required,
        status: available ? ('prepared' as const) : ('unavailable' as const),
        ...(available && row?.asset
          ? {
              digest: row.asset.parsedDigest,
              ...(row.asset.credit ? { credit: row.asset.credit } : {}),
              ...(row.asset.selection ? { selection: row.asset.selection } : {}),
            }
          : { failure: row?.failure ?? 'RESEARCH_IMAGE_SELECTION_REQUIRED' }),
      }
    })
  }
  imagePreview(sessionId: string, outline: SavedOutline, needId: string): Uint8Array {
    const need = this.imageReview(sessionId, outline).find(n => n.needId === needId && n.status === 'prepared')
    if (!need) throw new DeckError('DECK_CONTENT_NOT_FOUND')
    const slide = outline.slides[need.slideIndex]!
    const block = slide.blocks?.[need.blockIndex]
    const record = this.preparedRecord(
      sessionId,
      outline.outlineId,
      slide.slideId,
      need.blockIndex,
      block?.kind === 'web-image' ? block.query : '',
    )
    if (!record?.asset) throw new DeckError('DECK_CONTENT_NOT_FOUND')
    return this.read(`${record.asset.assetId}.png`, record.asset.digest, 256 * 1024)
  }
  restoredImage(
    sessionId: string,
    outline: SavedOutline,
    needId: string,
  ): import('./contracts.ts').PreparedResearchImage {
    const need = this.imageReview(sessionId, outline).find(n => n.needId === needId && n.status === 'prepared')
    if (!need) throw new DeckError('RESEARCH_IMAGE_SELECTION_REQUIRED')
    const slide = outline.slides[need.slideIndex]!
    const block = slide.blocks?.[need.blockIndex]
    const record = this.preparedRecord(
      sessionId,
      outline.outlineId,
      slide.slideId,
      need.blockIndex,
      block?.kind === 'web-image' ? block.query : '',
    )
    const asset = record?.asset
    if (!asset?.credit || asset.credit.unknownLicense || !asset.selection)
      throw new DeckError('RESEARCH_IMAGE_SELECTION_REQUIRED')
    return {
      bytes: this.read(`${asset.assetId}.png`, asset.digest, 256 * 1024),
      source: asset.source,
      originalDigest: asset.originalDigest,
      parsedDigest: asset.parsedDigest,
      credit: asset.credit,
      selection: asset.selection,
    }
  }
  imageBlockers(sessionId: string, outline: SavedOutline): readonly { code: string; message: string }[] {
    if ((outline.brief?.design?.template.version ?? 1) < 2) return []
    return this.imageReview(sessionId, outline, true)
      .filter(n => n.required && n.status !== 'prepared')
      .map(n => ({
        code: 'IMAGE_PREPARATION_REQUIRED',
        message: `Slide ${n.slideIndex + 1}: chưa chuẩn bị được ảnh. Sửa Outline để đổi ảnh, truy vấn hoặc xác nhận ảnh này không bắt buộc.`,
      }))
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
    if (!this.root) throw new DeckError('ARTIFACT_STORAGE_UNAVAILABLE')
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
          const asset = this.preparedRecord(
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
            const bytes = this.read(`${asset.assetId}.png`, asset.digest, 256 * 1024)
            const copy = { ...asset, assetId: `asset-${randomUUID()}` }
            this.write(`${copy.assetId}.png`, bytes)
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
  private context(stage: Stage, generation: GenerationSnapshot): FormatContext {
    return {
      design: generation.design,
      layoutId: stage.layoutId,
      assets: stage.assets.map(a => ({
        assetId: a.assetId,
        byteSize: a.byteSize,
        bytes: this.read(`${a.assetId}.png`, a.digest, 256 * 1024),
      })),
      ...(stage.document ? { document: stage.document } : {}),
    }
  }
  private matchesNeed(stage: Stage, asset: ArtifactAsset, index: number, query: string): boolean {
    const record = this.preparedRecord(
      stage.grant.sessionId,
      stage.generation.receipt.outlineId,
      stage.slideId,
      index,
      query,
    )
    return asset.imageNeedId ? asset.imageNeedId === record?.needId : asset.webQuery === query
  }
  private documentFromPlan(stage: Stage): void {
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
    const fingerprint = digest(value.text),
      old = stage.chunks[value.sequence]
    if (old) {
      if (old.digest !== fingerprint || old.final !== value.final) throw new DeckError('STAGE_CHUNK_CONFLICT')
      return this.status(stage)
    }
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    if (stage.finalized || value.sequence !== stage.chunks.length) throw new DeckError('STAGE_SEQUENCE_CONFLICT')
    if (stage.chunks.reduce((n, c) => n + c.bytes, 0) + Buffer.byteLength(value.text) > 256 * 1024)
      throw new DeckError('STAGE_SOURCE_TOO_LARGE')
    this.write(`${stage.stageId}-${value.sequence}.part`, value.text)
    stage.chunks.push({ digest: fingerprint, final: value.final, bytes: Buffer.byteLength(value.text) })
    if (value.final) {
      stage.finalized = true
      stage.digest = digest(this.source(stage))
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

  provenance(row: Record<string, unknown>): readonly ContentProvenance[] {
    const manifest = JSON.parse(String(row.manifest))
    return manifest.provenance === undefined ? [] : validateProvenance(manifest.provenance)
  }

  notes(row: Record<string, unknown>): string | undefined {
    const notes: unknown = JSON.parse(String(row.manifest)).notes
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 16000))
      throw new DeckError('ARTIFACT_CORRUPT')
    return notes as string | undefined
  }

  private source(stage: Stage): string {
    return Buffer.concat(
      stage.chunks.map((c, i) => this.read(`${stage.stageId}-${i}.part`, c.digest, 8 * 1024)),
    ).toString('utf8')
  }

  async asset(
    grant: GenerationGrant,
    stageId: string,
    attachmentId: string,
    slide: OutlineProposal['slides'][number],
    check: () => void,
    signal: AbortSignal,
  ): Promise<ArtifactAsset> {
    const stage = this.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    if (
      stage.slideId !== slide.slideId ||
      !(slide.blocks ?? []).some(b => b.kind === 'image' && b.attachmentId === attachmentId) ||
      !this.options.preparedImage
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    const old = stage.assets.find(a => a.attachmentId === attachmentId)
    if (old) return old
    if (stage.documentAuthored) throw new DeckError('STAGE_DOCUMENT_FINALIZED')
    if (stage.finalized) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const image = await this.options.preparedImage(grant.sessionId, attachmentId, signal)
    signal.throwIfAborted()
    check()
    this.stage(grant, stageId)
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const bytes = Buffer.from(image.bytes)
    if (
      !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.length > 256 * 1024 ||
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
      digest: digest(bytes),
      originalDigest: image.originalDigest,
      parsedDigest: image.parsedDigest,
      byteSize: bytes.length,
    }
    this.write(`${asset.assetId}.png`, bytes)
    stage.assets.push(asset)
    if (stage.generation.design.template.version >= 2) this.documentFromPlan(stage)
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
    const stage = this.stage(grant, stageId)
    if (
      stage.slideId !== slide.slideId ||
      !slide.blocks?.some(b => b.kind === 'web-image' && b.query === query) ||
      !this.options.researchImage
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    const old = stage.assets.find(a => a.webQuery === query)
    if (old) return old
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    let cache = this.researchImages.get(grant)
    if (!cache) {
      cache = new Map()
      this.researchImages.set(grant, cache)
      signal.addEventListener('abort', () => cache!.clear(), { once: true })
    }
    const key = JSON.stringify([slide.slideId, query])
    let work = cache.get(key)
    if (!work) {
      const attempts = this.imageAttempts.get(grant) ?? 0
      if (attempts >= limit) throw new DeckError('RESEARCH_IMAGE_BUDGET')
      this.imageAttempts.set(grant, attempts + 1)
      // A layout retry copies the same normalized image into a new stage, without another external lookup.
      work = this.options
        .researchImage(grant.sessionId, query, signal)
        .then(image => ({
          ...image,
          bytes: Buffer.from(image.bytes),
          source: { ...image.source },
          credit: { ...image.credit },
        }))
        .catch(error => {
          cache!.delete(key)
          throw error
        })
      cache.set(key, work)
    }
    const image = await work
    signal.throwIfAborted()
    check()
    this.stage(grant, stageId)
    if (stage.finalized || stage.published) throw new DeckError('STAGE_ASSETS_FINALIZED')
    const registered = stage.assets.find(a => a.webQuery === query)
    if (registered) return { ...registered }
    const bytes = Buffer.from(image.bytes)
    if (
      !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.length > 256 * 1024 ||
      stage.assets.reduce((sum, a) => sum + a.byteSize, 0) + bytes.length > 1024 * 1024 ||
      image.source.kind !== 'research' ||
      !validId(image.source.sourceId) ||
      !/^[a-f0-9]{64}$/.test(image.originalDigest) ||
      hashMismatch(image.parsedDigest, bytes) ||
      !['public-domain', 'CC0', 'CC BY', 'unknown'].includes(image.credit.license) ||
      image.credit.unknownLicense !== (image.credit.license === 'unknown') ||
      !image.credit.url.startsWith('https://') ||
      !image.credit.author
    ) {
      cache.delete(key)
      throw new DeckError('ARTIFACT_ASSET_INVALID')
    }
    const asset: ArtifactAsset = {
      assetId: `asset-${randomUUID()}`,
      webQuery: query,
      source: image.source,
      digest: digest(bytes),
      originalDigest: image.originalDigest,
      parsedDigest: image.parsedDigest,
      byteSize: bytes.length,
      credit: { ...image.credit },
    }
    this.write(`${asset.assetId}.png`, bytes)
    stage.assets.push(asset)
    if (stage.generation.design.template.version >= 2) this.documentFromPlan(stage)
    return { ...asset }
  }

  imageMetadata(row: Record<string, unknown>): {
    imageCredits: import('./contracts.ts').ImageCredit[]
    imageOmissions: string[]
  } {
    const manifest = JSON.parse(String(row.manifest))
    if (
      !Array.isArray(manifest.assets) ||
      (manifest.imageOmissions !== undefined &&
        (!Array.isArray(manifest.imageOmissions) ||
          manifest.imageOmissions.some((q: unknown) => typeof q !== 'string')))
    )
      throw new DeckError('ARTIFACT_CORRUPT')
    const imageCredits = manifest.assets.flatMap((a: ArtifactAsset) => (a.credit ? [a.credit] : []))
    for (const c of imageCredits)
      if (
        !c ||
        typeof c.url !== 'string' ||
        !c.url.startsWith('https://') ||
        typeof c.author !== 'string' ||
        !['public-domain', 'CC0', 'CC BY', 'unknown'].includes(c.license) ||
        typeof c.licenseUrl !== 'string' ||
        c.unknownLicense !== (c.license === 'unknown') ||
        typeof c.retrievedAt !== 'string'
      )
        throw new DeckError('ARTIFACT_CORRUPT')
    return { imageCredits, imageOmissions: manifest.imageOmissions ?? [] }
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
    const stage = this.stage(grant, input.stageId)
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
    const source = this.source(stage)
    if (
      slide.blocks?.some(
        (b, index) =>
          (b.kind === 'web-image' &&
            b.required !== false &&
            !stage.assets.some(a => this.matchesNeed(stage, a, index, b.query))) ||
          (b.kind === 'image' && !stage.assets.some(a => a.attachmentId === b.attachmentId)),
      )
    )
      throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    if (digest(source) !== stage.digest) throw new DeckError('ARTIFACT_CORRUPT')
    const adapter = this.formats.get(generation.format)
    if (!adapter) throw new DeckError('FORMAT_UNAVAILABLE')
    const stagedState = () =>
      digest(JSON.stringify([stage.digest, stage.assets, stage.document, stage.provenance, stage.notes]))
    const checkedState = stagedState()
    const artifact = await adapter.build(source, this.context(stage, generation))
    stage.descriptor = decodeArtifactDescriptor(artifact.descriptor)
    if (stage.descriptor.format !== generation.format) throw new DeckError('ARTIFACT_DESCRIPTOR_INVALID')
    const document = Buffer.from(artifact.bytes)
    signal.throwIfAborted()
    check()
    if (artifact.preview !== undefined) {
      if (!this.options.renderCheck) throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
      await this.options.renderCheck(
        artifact.preview ?? '',
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
    this.stage(grant, input.stageId)
    if (stagedState() !== checkedState) throw new DeckError('STAGE_CHANGED')
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    const artifactId = `artifact-${randomUUID()}`
    this.write(`${artifactId}.${artifact.descriptor.extension}`, document)
    const manifest = this.manifest(stage, generation, slide)
    return {
      artifactId,
      digest: digest(document),
      manifest,
      fingerprint: digest(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest])),
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
        b.kind === 'web-image' && !stage.assets.some(a => this.matchesNeed(stage, a, index, b.query)) ? [b.query] : [],
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
    const stage = this.stage(grant, input.stageId)
    const manifest = this.manifest(stage, generation, slide)
    return digest(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest]))
  }
  removeValidationArtifact(artifact: PreparedArtifact): void {
    const manifest = JSON.parse(artifact.manifest)
    unlinkSync(this.path(`${artifact.artifactId}.${manifest.artifact?.extension ?? 'html'}`))
  }
  published(grant: GenerationGrant, stageId: string): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) return
    for (let i = 0; i < stage.chunks.length; i++) unlinkSync(this.path(`${stage.stageId}-${i}.part`))
    // Keep an in-memory receipt description so an identical publish retry can be checked without staged bytes.
    stage.published = true
  }
  discard(grant: GenerationGrant, stageId: string): void {
    const stage = this.stage(grant, stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    for (let i = 0; i < stage.chunks.length; i++) unlinkSync(this.path(`${stage.stageId}-${i}.part`))
    for (const a of stage.assets) unlinkSync(this.path(`${a.assetId}.png`))
    this.stages.delete(stageId)
  }
  content(row: Record<string, unknown>): string {
    const raw: unknown = JSON.parse(String(row.manifest))
    if (!raw || typeof raw !== 'object' || !('assets' in raw) || !Array.isArray(raw.assets))
      throw new DeckError('ARTIFACT_CORRUPT')
    const assets = raw.assets.map((a: unknown) => {
      if (
        !a ||
        typeof a !== 'object' ||
        !('assetId' in a) ||
        !validId(a.assetId) ||
        !('digest' in a) ||
        typeof a.digest !== 'string'
      )
        throw new DeckError('ARTIFACT_CORRUPT')
      return { assetId: a.assetId, bytes: this.read(`${a.assetId}.png`, a.digest, 256 * 1024) }
    })
    const descriptor = this.metadata(row).artifact
    const bytes = this.read(
      `${String(row.artifact_id)}.${descriptor?.extension ?? 'html'}`,
      String(row.digest),
      2 * 1024 * 1024,
    )
    const format = this.formats.get(descriptor?.format ?? 'html')
    if (!format) throw new DeckError('FORMAT_UNAVAILABLE')
    const preview = format.read(
      bytes,
      assets.map(a => ({ ...a, byteSize: a.bytes.length })),
    )
    if (typeof preview !== 'string') throw new DeckError('ARTIFACT_PREVIEW_UNAVAILABLE')
    return preview
  }
  native(row: Record<string, unknown>): {
    bytes: Uint8Array
    descriptor: ArtifactDescriptor
    document?: SlideDocument
  } {
    const metadata = this.metadata(row)
    const descriptor = metadata.artifact ?? {
      format: 'html',
      mediaType: 'text/html',
      extension: 'html',
      policyVersion: 'b04-artifact-v1',
      template: JSON.parse(String(row.manifest)).design.template,
    }
    return {
      bytes: this.read(`${String(row.artifact_id)}.${descriptor.extension}`, String(row.digest), 2 * 1024 * 1024),
      descriptor,
      ...(metadata.document ? { document: metadata.document } : {}),
    }
  }
  metadata(row: Record<string, unknown>): { document?: SlideDocument; artifact?: ArtifactDescriptor } {
    const manifest = JSON.parse(String(row.manifest))
    const document = manifest.document ? decodeSlideDocument(manifest.document) : undefined
    const artifact = manifest.artifact ? decodeArtifactDescriptor(manifest.artifact) : undefined
    if (
      (document &&
        (artifact?.documentVersion !== document.schemaVersion ||
          (row.slide_id !== undefined && document.slideId !== row.slide_id))) ||
      (artifact?.documentVersion && !document)
    )
      throw new DeckError('ARTIFACT_CORRUPT')
    return { ...(document ? { document } : {}), ...(artifact ? { artifact } : {}) }
  }
  recover(): void {
    if (!this.root) return
    const keep = new Set<string>()
    for (const row of this.db.prepare('SELECT payload FROM prepared_images').all()) {
      const record = JSON.parse(String(row.payload))
      if (record.asset) keep.add(`${record.asset.assetId}.png`)
    }
    for (const row of this.db.prepare('SELECT artifact_id,manifest FROM artifact_revisions').all()) {
      keep.add(`${String(row.artifact_id)}.${this.metadata(row).artifact?.extension ?? 'html'}`)
      const v: unknown = JSON.parse(String(row.manifest))
      if (!v || typeof v !== 'object' || !('assets' in v) || !Array.isArray(v.assets))
        throw new DeckError('ARTIFACT_CORRUPT')
      for (const a of v.assets) {
        if (!a || typeof a !== 'object' || !('assetId' in a) || typeof a.assetId !== 'string')
          throw new DeckError('ARTIFACT_CORRUPT')
        keep.add(`${a.assetId}.png`)
      }
    }
    for (const name of readdirSync(this.root)) {
      if (
        !/^(?:stage-[a-f0-9-]{36}-\d{1,2}\.part|artifact-[a-f0-9-]{36}\.[a-z0-9]{1,10}|asset-[a-f0-9-]{36}\.png)$/.test(
          name,
        ) ||
        keep.has(name)
      )
        continue
      const path = this.path(name)
      if (!lstatSync(path).isSymbolicLink() && existsSync(path)) unlinkSync(path)
    }
  }
}
