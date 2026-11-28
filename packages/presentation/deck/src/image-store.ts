import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { ImageResolver, ArtifactAsset, PreparedResearchImage } from './generation-contracts.ts'
import type { BoundOutlineDraft, OutlineProposal } from './outline-contracts.ts'
import type { BriefProposalInput } from './brief-contracts.ts'
import type { ImageNeed, OutlineImageReview, DeckOptions } from './generation-contracts.ts'
import { DeckError, ImagePreparationError, sha256Hex, validId } from './errors.ts'
import {
  ArtifactFileStore,
  hashMismatch,
  isValidImageCredit,
  isValidPngBytes,
  parsePreparedRecord,
} from './artifact-fs.ts'
import type { PreparedRecord } from './artifact-fs.ts'
import { validateBriefDraft } from './brief-store.ts'
import { validateBoundOutline } from './bound-outline.ts'

/** Identity includes context and policy; a query alone never identifies a slide image. */
export function outlineImageNeeds(outline: BoundOutlineDraft | OutlineProposal): readonly ImageNeed[] {
  return outline.slides.flatMap((slide, slideIndex) =>
    (slide.blocks ?? []).flatMap((block, blockIndex) => {
      if (block.kind !== 'web-image') return []
      const context = {
        policy: 'web-images-v2',
        slideIndex,
        blockIndex,
        title: slide.title,
        content: slide.content,
        contextBlocks: (slide.blocks ?? []).filter(b => b.kind !== 'web-image' && b.kind !== 'image'),
        query: block.query,
        caption: block.caption ?? '',
        provider: block.provider ?? 'tavily',
        replace: block.replace === true,
        intent: block.intent ?? {
          subject: block.query,
          role: block.caption ?? slide.title,
          mustInclude: [],
          mustAvoid: [],
          aspect: 'any' as const,
        },
      }
      return [
        {
          ...context,
          needId: `need-${sha256Hex(JSON.stringify(context))}`,
          required: block.required !== false,
          replace: block.replace === true,
        },
      ]
    }),
  )
}

/** Owns the prepared_images rows and image_search_attempts budget that belong to one Outline. */
export class PreparedImageStore {
  private readonly preparations = new WeakMap<object, { fingerprint: string; records: PreparedRecord[] }>()

  constructor(
    private readonly db: DatabaseSync,
    private readonly files: ArtifactFileStore,
    private readonly options: DeckOptions,
  ) {}

  reserveImageSearch(sessionId: string, requestId: string): void {
    if (this.options.activeRequest && !this.options.activeRequest(sessionId, requestId))
      throw new DeckError('REQUEST_CLOSED')
    const previous = this.db
      .prepare('SELECT session_id,attempts FROM image_search_attempts WHERE request_id=?')
      .get(requestId)
    if (previous && (previous.session_id !== sessionId || Number(previous.attempts) >= 5))
      throw new DeckError('RESEARCH_IMAGE_BUDGET')
    this.db
      .prepare(
        `INSERT INTO image_search_attempts VALUES(?,?,1) ON CONFLICT(request_id) DO UPDATE SET attempts=attempts+1`,
      )
      .run(requestId, sessionId)
  }

  async prepareImages(
    sessionId: string,
    input: BriefProposalInput,
    signal: AbortSignal,
    resolver?: ImageResolver,
  ): Promise<object> {
    const brief = validateBriefDraft(input.draft)
    const outline = input.outline ? validateBoundOutline(input.outline) : undefined
    const needs = brief.template?.version === 1 || !outline ? [] : outlineImageNeeds(outline)
    if (needs.length && brief.images.mode !== 'public-research') throw new DeckError('IMAGE_CHOICE_REQUIRED')
    if (needs.length > 32) throw new DeckError('RESEARCH_IMAGE_BUDGET')

    const records: PreparedRecord[] = []
    for (const need of needs) records.push(await this.prepareSingleNeed(sessionId, input, need, signal, resolver))
    const token = Object.freeze({})
    this.preparations.set(token, { fingerprint: sha256Hex(JSON.stringify([sessionId, input])), records })

    return token
  }

  private async prepareSingleNeed(
    sessionId: string,
    input: BriefProposalInput,
    need: ImageNeed,
    signal: AbortSignal,
    resolver?: ImageResolver,
  ): Promise<PreparedRecord> {
    const { query, needId, slideIndex, blockIndex } = need
    const identity = { query, needId, slideIndex, blockIndex }
    signal.throwIfAborted()
    if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
      throw new DeckError('REQUEST_CLOSED')

    const previous = this.db
      .prepare('SELECT payload FROM prepared_images WHERE session_id=? AND image_key=? ORDER BY rowid DESC')
      .all(sessionId, needId)
      .map(r => parsePreparedRecord(r.payload))
      .find(r => r.asset)

    if (!resolver && !need.replace && previous?.asset) {
      try {
        this.files.read(`${previous.asset.assetId}.png`, previous.asset.digest, 256 * 1024)
        return { ...identity, asset: previous.asset }
      } catch {
        /* A new reviewed proposal is allowed to prepare a replacement, without changing old records. */
      }
    }

    try {
      const image = resolver ? await resolver(need, signal) : await this.research(sessionId, query, signal)
      signal.throwIfAborted()
      if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
        throw new DeckError('REQUEST_CLOSED')
      const bytes = Buffer.from(image.bytes)
      this.assertResearchAsset(image, bytes)
      const asset: ArtifactAsset = {
        assetId: `asset-${randomUUID()}`,
        webQuery: query,
        imageNeedId: needId,
        ...(image.selection ? { selection: { ...image.selection } } : {}),
        source: { ...image.source },
        credit: { ...image.credit },
        digest: sha256Hex(bytes),
        originalDigest: image.originalDigest,
        parsedDigest: image.parsedDigest,
        byteSize: bytes.length,
      }
      this.files.write(`${asset.assetId}.png`, bytes)
      return { ...identity, asset, ...(image.attempts ? { attempts: image.attempts } : {}) }
    } catch (error) {
      signal.throwIfAborted()
      if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
        throw new DeckError('REQUEST_CLOSED')
      return {
        ...identity,
        failure: error instanceof DeckError ? error.code : 'ARTIFACT_ASSET_UNAVAILABLE',
        ...(error instanceof ImagePreparationError ? { attempts: error.attempts } : {}),
      }
    }
  }

  private async research(sessionId: string, query: string, signal: AbortSignal): Promise<PreparedResearchImage> {
    const research = this.options.researchImage
    if (!research) throw new DeckError('ARTIFACT_ASSET_UNAVAILABLE')
    return research(sessionId, query, signal)
  }

  private assertResearchAsset(image: PreparedResearchImage, bytes: Buffer): void {
    if (
      !isValidPngBytes(bytes) ||
      hashMismatch(image.parsedDigest, bytes) ||
      !/^[a-f0-9]{64}$/.test(image.originalDigest) ||
      image.source.kind !== 'research' ||
      !validId(image.source.sourceId) ||
      !Number.isSafeInteger(image.source.version) ||
      image.source.version < 1 ||
      !isValidImageCredit(image.credit)
    )
      throw new DeckError('ARTIFACT_ASSET_INVALID')
  }

  commitImages(sessionId: string, input: BriefProposalInput, outline: OutlineProposal, token?: object): void {
    if (!token) return
    if (this.options.activeRequest && !this.options.activeRequest(sessionId, input.requestId))
      throw new DeckError('REQUEST_CLOSED')
    const prepared = this.preparations.get(token)
    if (!prepared || prepared.fingerprint !== sha256Hex(JSON.stringify([sessionId, input])))
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

  preparedRecord(
    sessionId: string,
    outlineId: string,
    slideId: string,
    blockIndex: number,
    query: string,
  ): PreparedRecord | undefined {
    const records = this.db
      .prepare('SELECT payload FROM prepared_images WHERE session_id=? AND outline_id=?')
      .all(sessionId, outlineId)
      .map(r => parsePreparedRecord(r.payload))
    return (
      records.find(r => r.needId && r.slideId === slideId && r.blockIndex === blockIndex) ??
      records.find(r => !r.needId && r.query === query)
    )
  }

  imageReview(sessionId: string, outline: OutlineProposal, verify = false): readonly OutlineImageReview[] {
    if ((outline.brief?.design?.template.version ?? 1) < 2) return []
    return outlineImageNeeds(outline).map(need => {
      const slide = outline.slides[need.slideIndex]
      if (!slide) throw new DeckError('DECK_CONTENT_NOT_FOUND')

      const row = this.preparedRecord(sessionId, outline.outlineId, slide.slideId, need.blockIndex, need.query)
      let available = false

      if (row?.asset)
        try {
          if (verify) this.files.read(`${row.asset.assetId}.png`, row.asset.digest, 256 * 1024)
          available = this.files.exists(`${row.asset.assetId}.png`)
        } catch {
          /* Kept for review. */
        }

      return {
        needId: row?.needId ?? need.needId,
        slideIndex: need.slideIndex,
        blockIndex: need.blockIndex,
        required: need.required,
        ...(row?.attempts ? { attempts: row.attempts } : {}),
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

  imagePreview(sessionId: string, outline: OutlineProposal, needId: string): Uint8Array {
    const need = this.imageReview(sessionId, outline).find(n => n.needId === needId && n.status === 'prepared')
    if (!need) throw new DeckError('DECK_CONTENT_NOT_FOUND')

    const slide = outline.slides[need.slideIndex]
    if (!slide) throw new DeckError('DECK_CONTENT_NOT_FOUND')

    const block = slide.blocks?.[need.blockIndex]
    const record = this.preparedRecord(
      sessionId,
      outline.outlineId,
      slide.slideId,
      need.blockIndex,
      block?.kind === 'web-image' ? block.query : '',
    )
    if (!record?.asset) throw new DeckError('DECK_CONTENT_NOT_FOUND')

    return this.files.read(`${record.asset.assetId}.png`, record.asset.digest, 256 * 1024)
  }

  restoredImage(sessionId: string, outline: OutlineProposal, needId: string): PreparedResearchImage {
    const need =
      this.imageReview(sessionId, outline).find(n => n.needId === needId && n.status === 'prepared') ??
      outlineImageNeeds(outline).find(n => n.needId === needId)
    if (!need) throw new DeckError('RESEARCH_IMAGE_SELECTION_REQUIRED')

    const slide = outline.slides[need.slideIndex]
    if (!slide) throw new DeckError('RESEARCH_IMAGE_SELECTION_REQUIRED')

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
      bytes: this.files.read(`${asset.assetId}.png`, asset.digest, 256 * 1024),
      source: asset.source,
      originalDigest: asset.originalDigest,
      parsedDigest: asset.parsedDigest,
      credit: asset.credit,
      selection: asset.selection,
      ...(record?.attempts ? { attempts: record.attempts } : {}),
    }
  }

  imageBlockers(sessionId: string, outline: OutlineProposal): readonly { code: string; message: string }[] {
    if ((outline.brief?.design?.template.version ?? 1) < 2) return []
    return this.imageReview(sessionId, outline, true)
      .filter(n => n.required && n.status !== 'prepared')
      .map(n => ({
        code: 'IMAGE_PREPARATION_REQUIRED',
        message: `Slide ${n.slideIndex + 1}: the image is not ready. Change the Outline to change the image or the query, or mark this image as optional.`,
      }))
  }
}
