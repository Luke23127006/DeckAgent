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
} from './contracts.ts'
import { compileArtifact, materializeArtifact, requiredSlideText } from './artifact-policy.ts'

const digest = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
interface Stage {
  readonly stageId: string
  readonly grant: GenerationGrant
  readonly slideId: string
  readonly layoutId: string
  readonly chunks: { readonly digest: string; readonly final: boolean; readonly bytes: number }[]
  readonly assets: ArtifactAsset[]
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
  private readonly stages = new Map<string, Stage>()
  private readonly root: string | undefined
  constructor(
    private readonly db: DatabaseSync,
    private readonly options: DeckOptions,
  ) {
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
      !/^(?:stage-[a-f0-9-]{36}-\d{1,2}\.part|artifact-[a-f0-9-]{36}\.html|asset-[a-f0-9-]{36}\.png)$/.test(name)
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
  private status(stage: Stage): StageStatus {
    return {
      stageId: stage.stageId,
      nextSequence: stage.chunks.length,
      finalized: stage.finalized,
      digest: stage.digest,
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
    const stage: Stage = {
      stageId: `stage-${randomUUID()}`,
      grant,
      slideId: slide.slideId,
      layoutId,
      chunks: [],
      assets: [],
      finalized: false,
      digest: null,
      published: false,
    }
    this.stages.set(stage.stageId, stage)
    return this.status(stage)
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
    return { ...asset }
  }

  async prepare(
    grant: GenerationGrant,
    input: ArtifactPublication,
    slide: OutlineProposal['slides'][number],
    generation: GenerationSnapshot,
    check: () => void,
    signal: AbortSignal,
  ): Promise<PreparedArtifact> {
    const stage = this.stage(grant, input.stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    if (!stage.finalized || stage.slideId !== input.slideId) throw new DeckError('STAGE_INCOMPLETE')
    if (!this.options.renderCheck) throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
    const source = this.source(stage)
    if (digest(source) !== stage.digest) throw new DeckError('ARTIFACT_CORRUPT')
    const document = compileArtifact(source, generation.design, stage.assets)
    const materialized = materializeArtifact(
      document,
      stage.assets.map(a => ({ assetId: a.assetId, bytes: this.read(`${a.assetId}.png`, a.digest, 256 * 1024) })),
    )
    signal.throwIfAborted()
    check()
    await this.options.renderCheck(materialized, requiredSlideText(slide), signal)
    signal.throwIfAborted()
    check()
    this.stage(grant, input.stageId)
    if (stage.published) throw new DeckError('STAGE_ALREADY_PUBLISHED')
    const artifactId = `artifact-${randomUUID()}`
    this.write(`${artifactId}.html`, document)
    const manifest = JSON.stringify({
      policyVersion: 'b04-artifact-v1',
      sourceDigest: stage.digest,
      assets: stage.assets,
      design: generation.design,
      layoutId: stage.layoutId,
      requestId: grant.requestId,
      intentId: grant.intentId,
      sourceRefs: slide.sources ?? [],
    })
    return {
      artifactId,
      digest: digest(document),
      manifest,
      fingerprint: digest(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest])),
    }
  }
  receiptFingerprint(
    grant: GenerationGrant,
    input: ArtifactPublication,
    generation: GenerationSnapshot,
    slide: OutlineProposal['slides'][number],
  ): string {
    const stage = this.stage(grant, input.stageId)
    const manifest = JSON.stringify({
      policyVersion: 'b04-artifact-v1',
      sourceDigest: stage.digest,
      assets: stage.assets,
      design: generation.design,
      layoutId: stage.layoutId,
      requestId: grant.requestId,
      intentId: grant.intentId,
      sourceRefs: slide.sources ?? [],
    })
    return digest(JSON.stringify([input.slideId, input.expectedRevision, stage.digest, manifest]))
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
    const document = this.read(`${String(row.artifact_id)}.html`, String(row.digest), 2 * 1024 * 1024).toString('utf8')
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
    return materializeArtifact(document, assets)
  }
  recover(): void {
    if (!this.root) return
    const keep = new Set<string>()
    for (const row of this.db.prepare('SELECT artifact_id,manifest FROM artifact_revisions').all()) {
      keep.add(`${String(row.artifact_id)}.html`)
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
        !/^(?:stage-[a-f0-9-]{36}-\d{1,2}\.part|artifact-[a-f0-9-]{36}\.html|asset-[a-f0-9-]{36}\.png)$/.test(name) ||
        keep.has(name)
      )
        continue
      const path = this.path(name)
      if (!lstatSync(path).isSymbolicLink() && existsSync(path)) unlinkSync(path)
    }
  }
}
