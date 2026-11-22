import { createHash, randomUUID } from 'node:crypto'
import { AttachmentParser } from '@deckagent/file-tools'
import { DeckError } from '@deckagent/deck'
import type { ImageNeed, ImageCredit, ImageSelection, PreparedResearchImage, OutlineImageReview } from '@deckagent/deck'
import { HttpError } from '@deckagent/host-api'
import type { ResearchService } from './research-service.ts'
import type { CommonsImages, CommonsCandidate } from './commons-images.ts'
import { PublicImageReader } from './public-image-reader.ts'
import type { ImageSearchCandidate } from './tavily.ts'
import { imageSource } from './image-source.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const code = (error: unknown) =>
  error instanceof DeckError || error instanceof HttpError ? error.code : 'RESEARCH_IMAGE_UNAVAILABLE'
interface Candidate extends ImageSearchCandidate {
  readonly candidateId: string
  readonly commons?: CommonsCandidate
}
interface NeedState {
  readonly need: ImageNeed
  readonly candidates: Candidate[]
  query: string
  failure?: string
  selected?: PreparedResearchImage
  attempts: number
  searches: number
}

/** Only image-specific, matching ImageObject metadata can establish a broad-web licence. */
export function imagePageCredit(html: string, imageUrl: string, sourceUrl: string): ImageCredit | undefined {
  const items: unknown[] = []
  for (const match of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi,
  )) {
    try {
      items.push(JSON.parse(match[1]!))
    } catch {
      /* Malformed metadata gives no licence. */
    }
  }
  let count = 0
  const visit = (item: unknown, depth: number): ImageCredit | undefined => {
    if (++count > 500 || depth > 10) return undefined
    if (Array.isArray(item)) {
      for (const child of item) {
        const credit = visit(child, depth + 1)
        if (credit) return credit
      }
      return undefined
    }
    if (!object(item)) return undefined
    const type = item['@type']
    if (
      (type === 'ImageObject' || (Array.isArray(type) && type.includes('ImageObject'))) &&
      (item.contentUrl === imageUrl || item.url === imageUrl) &&
      typeof item.license === 'string'
    ) {
      const link = item.license
      const license: ImageCredit['license'] | undefined =
        /^https:\/\/creativecommons\.org\/licenses\/by\/[1-4]\.\d\/?$/.test(link)
          ? 'CC BY'
          : /^https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/.test(link)
            ? 'CC0'
            : /^https:\/\/creativecommons\.org\/publicdomain\/mark\/1\.0\/?$/.test(link)
              ? 'public-domain'
              : undefined
      const author =
        typeof item.creator === 'string'
          ? item.creator
          : object(item.creator) && typeof item.creator.name === 'string'
            ? item.creator.name
            : typeof item.author === 'string'
              ? item.author
              : object(item.author) && typeof item.author.name === 'string'
                ? item.author.name
                : ''
      if (license && (author.trim() || license !== 'CC BY'))
        return {
          url: sourceUrl,
          license,
          licenseUrl: link,
          unknownLicense: false,
          author: author.slice(0, 1000) || 'Public domain',
          retrievedAt: new Date().toISOString(),
        }
    }
    for (const child of Object.values(item)) {
      const credit = visit(child, depth + 1)
      if (credit) return credit
    }
    return undefined
  }
  return visit(items, 0)
}

export class WebImageResearch {
  private readonly parser = new AttachmentParser()
  constructor(
    private readonly research: Pick<ResearchService, 'imageSearch'>,
    private readonly commons: CommonsImages,
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
    return entries.map(c => ({ ...c, candidateId: `candidate-${randomUUID()}` }))
  }
  async prepare(candidate: Candidate, signal: AbortSignal): Promise<PreparedResearchImage> {
    const operation = AbortSignal.any([signal, AbortSignal.timeout(20000)])
    const resolved = imageSource(candidate)
    if (candidate.commons) {
      if (
        candidate.commons.credit.unknownLicense ||
        (candidate.commons.credit.license === 'CC BY' && candidate.commons.credit.author === 'Chưa rõ tác giả')
      )
        throw new DeckError('RESEARCH_IMAGE_LICENSE_REQUIRED')
      return this.commons.prepare(candidate.commons, operation)
    }
    let credit: ImageCredit | undefined = resolved.pexels
    const pages = resolved.sourceUrl ? [resolved.sourceUrl] : (candidate.sourcePages ?? [])
    for (const sourceUrl of pages.slice(0, 2)) {
      if (credit) break
      try {
        const source = new URL(sourceUrl)
        if (source.hostname === 'commons.wikimedia.org' && source.pathname.startsWith('/wiki/File:')) {
          const title = decodeURIComponent(source.pathname.slice('/wiki/'.length))
          const entries = await this.commons.candidates('', operation, title)
          // Only authoritative metadata for this exact image establishes its source identity.
          const entry = entries.find(
            c =>
              c.sourceUrl === sourceUrl && (c.imageUrl === candidate.imageUrl || c.originalUrl === candidate.imageUrl),
          )
          if (
            entry &&
            !entry.credit.unknownLicense &&
            (entry.credit.license !== 'CC BY' || entry.credit.author !== 'Chưa rõ tác giả')
          )
            return this.commons.prepare(entry, operation)
        } else {
          const page = await this.reader.read(sourceUrl, operation, 512 * 1024, ['text/html', 'application/xhtml+xml'])
          credit = imagePageCredit(page.toString('utf8'), candidate.imageUrl, sourceUrl)
          if (credit) break
        }
      } catch {
        operation.throwIfAborted()
      }
    }
    if (!credit) throw new DeckError('RESEARCH_IMAGE_LICENSE_REQUIRED')
    const bytes = await this.reader.read(candidate.imageUrl, operation, 8 * 1024 * 1024, ['image/png', 'image/jpeg'])
    const parsed = await this.parser.parse({ name: bytes[0] === 137 ? 'web.png' : 'web.jpg', bytes, signal: operation })
    const image = parsed.parts.find(p => p.type === 'image')
    if (!image || image.type !== 'image') throw new DeckError('RESEARCH_IMAGE_UNAVAILABLE')
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

/** Request-scoped candidates and selections; no URL, licence or selected model is supplied by a tool. */
export class ImageReviewRun {
  private readonly states = new Map<string, NeedState>()
  constructor(
    private readonly service: WebImageResearch,
    private readonly signal: AbortSignal,
    private readonly reserve: () => void,
    private readonly previous: readonly OutlineImageReview[],
    private readonly retained?: (needId: string) => Promise<PreparedResearchImage>,
  ) {}
  async stage(needs: readonly ImageNeed[]) {
    if (needs.length > 32) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    const ids = new Set(needs.map(n => n.needId))
    for (const id of this.states.keys()) if (!ids.has(id)) this.states.delete(id)
    for (const need of needs) {
      if (this.states.has(need.needId)) continue
      const state: NeedState = { need, candidates: [], query: need.query, attempts: 0, searches: 0 }
      this.states.set(need.needId, state)
      if (
        !need.replace &&
        this.retained &&
        this.previous.some(n => n.needId === need.needId && n.status === 'prepared' && n.selection)
      ) {
        try {
          state.selected = await this.retained(need.needId)
          this.signal.throwIfAborted()
          continue
        } catch {
          this.signal.throwIfAborted()
        }
      }
      await this.search(need.needId, need.query)
    }
    return [...this.states.values()].map(s => this.view(s))
  }
  private view(state: NeedState) {
    return {
      ...state.need,
      query: state.query,
      status: state.selected ? 'prepared' : 'unavailable',
      failure: state.failure ?? null,
      candidates: state.candidates.map(c => ({
        candidateId: c.candidateId,
        title: c.title,
        description: c.description,
        sourceUrl: c.sourceUrl ?? null,
        imageUrl: c.imageUrl,
        license: c.commons?.credit.license ?? 'unverified',
      })),
    }
  }
  async search(needId: string, query: string) {
    this.signal.throwIfAborted()
    const state = this.states.get(needId)
    if (!state || !query.trim() || query.length > 500) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    if (state.searches >= 2) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    state.searches++
    delete state.selected
    state.candidates.length = 0
    state.query = query
    try {
      this.reserve()
      const candidates = await this.service.candidates(state.need, query, this.signal)
      this.signal.throwIfAborted()
      const excluded = state.need.replace ? this.previous.flatMap(r => (r.selection ? [r.selection.imageUrl] : [])) : []
      state.candidates.push(...candidates.filter(c => !excluded.includes(c.imageUrl)))
      state.failure = state.candidates.length ? 'RESEARCH_IMAGE_SELECTION_REQUIRED' : 'RESEARCH_IMAGE_NO_MATCH'
    } catch (error) {
      this.signal.throwIfAborted()
      state.failure = code(error)
    }
    return this.view(state)
  }
  async select(needId: string, candidateId: string, reason: string) {
    this.signal.throwIfAborted()
    const state = this.states.get(needId),
      candidate = state?.candidates.find(c => c.candidateId === candidateId)
    if (!state || !candidate || !reason.trim() || reason.length > 1000)
      throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    if (state.attempts >= 2) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    state.attempts++
    delete state.selected
    try {
      const image = await this.service.prepare(candidate, this.signal)
      this.signal.throwIfAborted()
      if (
        [...this.states.values()].some(
          s =>
            s !== state &&
            s.need.slideIndex === state.need.slideIndex &&
            s.selected &&
            (s.selected.parsedDigest === image.parsedDigest || s.selected.selection?.imageUrl === candidate.imageUrl),
        )
      )
        throw new DeckError('RESEARCH_IMAGE_DUPLICATE')
      if (state.need.replace && this.previous.some(n => n.digest === image.parsedDigest))
        throw new DeckError('RESEARCH_IMAGE_DUPLICATE')
      const selection: ImageSelection = {
        provider: state.need.provider,
        query: state.query,
        imageUrl: candidate.imageUrl,
        description: candidate.description,
        reason,
        evidence: 'metadata',
        policy: 'web-images-v1',
      }
      state.selected = { ...image, selection }
      delete state.failure
      return { needId, status: 'prepared', credit: image.credit, selection }
    } catch (error) {
      this.signal.throwIfAborted()
      state.failure = code(error)
      throw error
    }
  }
  resolve = async (need: ImageNeed): Promise<PreparedResearchImage> => {
    this.signal.throwIfAborted()
    const state = this.states.get(need.needId)
    if (!state?.selected) throw new DeckError(state?.failure ?? 'RESEARCH_IMAGE_SELECTION_REQUIRED')
    return state.selected
  }
}
