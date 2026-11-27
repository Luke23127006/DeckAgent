import { createHash, randomUUID } from 'node:crypto'
import { DeckError } from '@deckagent/deck'
import type {
  ImageNeed,
  ImageCredit,
  PreparedResearchImage,
  OutlineImageReview,
  ImageSourceCheck,
} from '@deckagent/deck'
import { ResearchError } from '../../research/index.ts'
import type { ResearchService } from '../../research/index.ts'
import type { ImageParserPort } from '../ports.ts'
import type { CommonsImages, CommonsCandidate } from './commons-images.ts'
import { imagePageCredit } from './image-credit.ts'
import { ImageReviewRun } from './image-review-run.ts'
import type { Candidate } from './image-review-run.ts'
import { ImageSourceError, imageSource } from './image-source.ts'
import { ImageReadError, PublicImageReader } from './public-image-reader.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const code = (error: unknown) =>
  error instanceof DeckError || error instanceof ResearchError ? error.code : 'RESEARCH_IMAGE_UNAVAILABLE'

type SourceResolution =
  | { readonly kind: 'credit'; readonly credit: ImageCredit }
  | { readonly kind: 'image'; readonly image: PreparedResearchImage }

export class WebImageResearch {
  constructor(
    private readonly research: Pick<ResearchService, 'imageSearch'>,
    private readonly commons: CommonsImages,
    private readonly parser: ImageParserPort,
    private readonly reader = new PublicImageReader(),
  ) {}
  close() {
    return this.parser.close()
  }
  open(
    signal: AbortSignal,
    reserve: () => void,
    previous: readonly OutlineImageReview[] = [],
    retained?: (needId: string) => Promise<PreparedResearchImage>,
  ) {
    return new ImageReviewRun(this, signal, reserve, previous, retained)
  }
  async candidates(need: ImageNeed, query: string, signal: AbortSignal): Promise<readonly Candidate[]> {
    const entries =
      need.provider === 'commons'
        ? (await this.commons.candidates(query, signal)).map(c => ({ ...c, commons: c }))
        : await this.research.imageSearch(query, signal)
    return entries.map(c => {
      const source = imageSource(c)
      return {
        ...c,
        ...(source.sourceUrl ? { sourceUrl: source.sourceUrl } : {}),
        candidateId: `candidate-${randomUUID()}`,
      }
    })
  }
  async prepare(
    candidate: Candidate,
    signal: AbortSignal,
    pagesCache = new Map<string, Promise<Buffer>>(),
  ): Promise<PreparedResearchImage> {
    const operation = AbortSignal.any([signal, AbortSignal.timeout(20000)])
    if (candidate.commons) return this.prepareCommonsCandidate(candidate.commons, operation)
    const pexels = imageSource(candidate).pexels
    if (pexels) return this.downloadAndNormalize(candidate, pexels, operation)
    const source = await this.resolveSourceCredit(candidate, pagesCache, operation)
    return source.kind === 'image' ? source.image : this.downloadAndNormalize(candidate, source.credit, operation)
  }
  private prepareCommonsCandidate(commons: CommonsCandidate, operation: AbortSignal): Promise<PreparedResearchImage> {
    if (
      commons.credit.unknownLicense ||
      (commons.credit.license === 'CC BY' && commons.credit.author === 'Chưa rõ tác giả')
    )
      throw new DeckError('RESEARCH_IMAGE_LICENSE_REQUIRED')
    return this.commons.prepare(commons, operation)
  }
  private async resolveSourceCredit(
    candidate: Candidate,
    pagesCache: Map<string, Promise<Buffer>>,
    operation: AbortSignal,
  ): Promise<SourceResolution> {
    const resolved = imageSource(candidate)
    const pages = [...new Set([...(resolved.sourceUrl ? [resolved.sourceUrl] : []), ...(candidate.sourcePages ?? [])])]
    const checks: ImageSourceCheck[] = []
    for (const sourceUrl of pages.slice(0, 3)) {
      try {
        const source = new URL(sourceUrl)
        if (source.hostname === 'commons.wikimedia.org' && source.pathname.startsWith('/wiki/File:')) {
          const title = decodeURIComponent(source.pathname.slice('/wiki/'.length))
          const entries = await this.commons.candidates('', operation, title)
          // Only authoritative metadata for this exact image establishes its source identity.
          const entry = entries.find(
            c =>
              c.imageUrl === candidate.imageUrl ||
              c.originalUrl === candidate.imageUrl ||
              (resolved.commonsFile !== undefined && imageSource(c).commonsFile === resolved.commonsFile),
          )
          if (entry) return { kind: 'image', image: await this.prepareCommonsCandidate(entry, operation) }
          checks.push({ sourceUrl, code: 'RESEARCH_IMAGE_LICENSE_REQUIRED' })
          continue
        }
        const page = await this.readCachedPage(sourceUrl, pagesCache, operation)
        let failure = 'RESEARCH_IMAGE_LICENSE_REQUIRED'
        const credit = imagePageCredit(page.toString('utf8'), candidate.imageUrl, sourceUrl, rejected => {
          failure = rejected
        })
        if (credit) return { kind: 'credit', credit }
        checks.push({ sourceUrl, code: failure })
      } catch (error) {
        operation.throwIfAborted()
        checks.push({
          sourceUrl,
          code: code(error),
          ...(error instanceof ImageReadError && error.httpStatus !== undefined
            ? { httpStatus: error.httpStatus }
            : {}),
        })
      }
    }
    const failure =
      checks.find(c => c.code === 'RESEARCH_IMAGE_LICENSE_UNSUPPORTED' || c.code === 'RESEARCH_IMAGE_AUTHOR_REQUIRED')
        ?.code ??
      checks.find(c => c.code === 'RESEARCH_IMAGE_LICENSE_REQUIRED')?.code ??
      checks[0]?.code ??
      'RESEARCH_IMAGE_SOURCE_UNRESOLVED'
    throw new ImageSourceError(failure, checks)
  }
  private readCachedPage(
    sourceUrl: string,
    pagesCache: Map<string, Promise<Buffer>>,
    operation: AbortSignal,
  ): Promise<Buffer> {
    let pending = pagesCache.get(sourceUrl)
    if (pending) return pending
    if (pagesCache.size >= 25) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    pending = this.reader.read(sourceUrl, operation, 512 * 1024, ['text/html', 'application/xhtml+xml'])
    pagesCache.set(sourceUrl, pending)
    void pending.catch(() => {
      if (pagesCache.get(sourceUrl) === pending) pagesCache.delete(sourceUrl)
    })
    return pending
  }
  private async downloadAndNormalize(
    candidate: Candidate,
    credit: ImageCredit,
    operation: AbortSignal,
  ): Promise<PreparedResearchImage> {
    const bytes = await this.reader.read(
      imageSource(candidate).downloadUrl ?? candidate.imageUrl,
      operation,
      8 * 1024 * 1024,
      ['image/png', 'image/jpeg'],
    )
    const parsed = await this.parser
      .parse({ name: bytes[0] === 137 ? 'web.png' : 'web.jpg', bytes, signal: operation })
      .catch((error: unknown) => {
        operation.throwIfAborted()
        throw new DeckError(
          object(error) && error.code === 'PARSING_LIMIT_EXCEEDED'
            ? 'RESEARCH_IMAGE_NORMALIZATION_LIMIT'
            : 'RESEARCH_IMAGE_DECODE_FAILED',
        )
      })
    const image = parsed.parts.find(p => p.type === 'image')
    if (!image || image.type !== 'image' || !('data' in image) || typeof image.data !== 'string')
      throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
    operation.throwIfAborted()
    const normalized = Buffer.from(image.data, 'base64')
    return {
      bytes: normalized,
      source: { sourceId: `src-${randomUUID()}`, version: 1, kind: 'research' },
      originalDigest: hash(bytes),
      parsedDigest: hash(normalized),
      credit,
    }
  }
}
