import { DeckError, ImagePreparationError } from '@deckagent/deck'
import type {
  ImageAttempt,
  ImageCredit,
  ImageNeed,
  ImageSelection,
  OutlineImageReview,
  PreparedResearchImage,
} from '@deckagent/deck'
import { ImageReadError, ImageSourceError, imageSource } from './images/index.ts'
import type { CommonsCandidate } from './images/index.ts'
import type { ImageSearchCandidate } from '../research/index.ts'
import { ResearchError } from '../research/index.ts'
import type { WebImageResearch } from './image-research.ts'

const code = (error: unknown) =>
  error instanceof DeckError || error instanceof ResearchError ? error.code : 'RESEARCH_IMAGE_UNAVAILABLE'

export interface Candidate extends ImageSearchCandidate {
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
  readonly attemptLog: ImageAttempt[]
  version: number
  selecting: boolean
  searches: number
}
interface RankedChoice {
  readonly candidate: Candidate
  readonly reason: string
}
interface PreparedChoice {
  readonly credit: ImageCredit
  readonly selection: ImageSelection
}

/** Request-scoped candidates and selections; no URL, licence or selected model is supplied by a tool. */
export class ImageReviewRun {
  private readonly states = new Map<string, NeedState>()
  private readonly pagesCache = new Map<string, Promise<Buffer>>()
  constructor(
    private readonly service: WebImageResearch,
    private readonly signal: AbortSignal,
    private readonly reserve: () => void,
    private readonly previous: readonly OutlineImageReview[],
    private readonly retained?: (needId: string) => Promise<PreparedResearchImage>,
  ) {}
  private state(need: ImageNeed): NeedState {
    return {
      need,
      candidates: [],
      query: need.query,
      attempts: 0,
      searches: 0,
      attemptLog: [],
      version: 0,
      selecting: false,
    }
  }
  /** Resume local progress without spending a search or reviving candidates from another request. */
  async resume(needs: readonly ImageNeed[]) {
    if (needs.length > 32) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    for (const need of needs) {
      const state = this.state(need)
      const previous = this.previous.find(n => n.needId === need.needId)
      state.failure = 'RESEARCH_IMAGE_SELECTION_REQUIRED'
      this.states.set(need.needId, state)
      if (previous?.status === 'prepared' && this.retained) {
        try {
          state.selected = await this.retained(need.needId)
          delete state.failure
        } catch {
          this.signal.throwIfAborted()
          state.failure = 'RESEARCH_IMAGE_SELECTION_REQUIRED'
        }
      }
      this.signal.throwIfAborted()
    }
    return this.snapshot()
  }
  async stage(needs: readonly ImageNeed[]) {
    if (needs.length > 32) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    const ids = new Set(needs.map(n => n.needId))
    for (const id of this.states.keys()) if (!ids.has(id)) this.states.delete(id)
    for (const need of needs) {
      if (this.states.has(need.needId)) continue
      const state = this.state(need)
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
      ...(state.selected ? { credit: state.selected.credit, selection: state.selected.selection } : {}),
      failure: state.failure ?? null,
      previousFailure: this.previous.find(n => n.needId === state.need.needId)?.failure ?? null,
      attempts: [...state.attemptLog],
      remainingSelections: Math.max(0, 4 - state.attempts),
      remainingSearches: Math.max(0, 2 - state.searches),
      candidates: state.candidates.map(c => ({
        candidateId: c.candidateId,
        title: c.title,
        description: c.description,
        sourceUrl: c.sourceUrl ?? null,
        sourcePages: c.sourcePages ?? [],
        imageUrl: c.imageUrl,
        license: c.commons?.credit.license ?? (imageSource(c).pexels ? 'Pexels' : 'unverified'),
      })),
    }
  }
  async search(needId: string, query: string) {
    this.signal.throwIfAborted()
    const state = this.states.get(needId)
    if (!state || !query.trim() || query.length > 500) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    if (state.searches >= 2) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    state.searches++
    const version = ++state.version
    delete state.selected
    state.candidates.length = 0
    state.query = query
    try {
      this.reserve()
      const candidates = await this.service.candidates(state.need, query, this.signal)
      this.signal.throwIfAborted()
      if (version !== state.version || this.states.get(needId) !== state)
        throw new DeckError('RESEARCH_IMAGE_SELECTION_STALE')
      const excluded = state.need.replace ? this.previous.flatMap(r => (r.selection ? [r.selection.imageUrl] : [])) : []
      state.candidates.push(...candidates.filter(c => !excluded.includes(c.imageUrl)))
      state.failure = state.candidates.length ? 'RESEARCH_IMAGE_SELECTION_REQUIRED' : 'RESEARCH_IMAGE_NO_MATCH'
    } catch (error) {
      this.signal.throwIfAborted()
      if (state.version !== version || this.states.get(needId) !== state)
        throw new DeckError('RESEARCH_IMAGE_SELECTION_STALE')
      state.failure = code(error)
    }
    return this.view(state)
  }
  pending() {
    return [...this.states.values()].filter(s => !s.selected).map(s => this.view(s))
  }
  snapshot() {
    return [...this.states.values()].map(s => this.view(s))
  }
  async select(
    needId: string,
    candidateId: string,
    reason: string,
    alternatives: readonly { readonly candidateId: string; readonly reason: string }[] = [],
  ) {
    this.signal.throwIfAborted()
    const state = this.states.get(needId)
    if (!state) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    const choices = this.resolveRankedChoices(state, candidateId, reason, alternatives)
    if (state.attempts >= 4) throw new DeckError('RESEARCH_IMAGE_BUDGET')
    if (state.selecting) throw new DeckError('RESEARCH_IMAGE_SELECTION_BUSY')
    state.selecting = true
    const version = state.version
    delete state.selected
    try {
      for (const choice of choices) {
        if (state.attempts >= 4) break
        try {
          const prepared = await this.attemptChoice(state, version, choice)
          return {
            needId,
            status: 'prepared',
            credit: prepared.credit,
            selection: prepared.selection,
            attempts: state.attemptLog,
          }
        } catch (error) {
          this.signal.throwIfAborted()
          if (state.version !== version || this.states.get(needId) !== state)
            throw new ImagePreparationError('RESEARCH_IMAGE_SELECTION_STALE', [...state.attemptLog])
          if (this.recordAttemptFailure(state, choice.candidate, error) === 'RESEARCH_IMAGE_SELECTION_STALE') break
        }
      }
      throw new ImagePreparationError(state.failure ?? 'RESEARCH_IMAGE_SELECTION_REQUIRED', [...state.attemptLog])
    } finally {
      state.selecting = false
    }
  }
  resolve = async (need: ImageNeed): Promise<PreparedResearchImage> => {
    this.signal.throwIfAborted()
    const state = this.states.get(need.needId)
    if (!state?.selected)
      throw new ImagePreparationError(state?.failure ?? 'RESEARCH_IMAGE_SELECTION_REQUIRED', state?.attemptLog ?? [])
    return state.selected
  }
  private resolveRankedChoices(
    state: NeedState,
    candidateId: string,
    reason: string,
    alternatives: readonly { readonly candidateId: string; readonly reason: string }[],
  ): readonly RankedChoice[] {
    const candidate = state.candidates.find(c => c.candidateId === candidateId)
    if (
      !candidate ||
      !reason.trim() ||
      reason.length > 1000 ||
      alternatives.length > 2 ||
      alternatives.some(
        a => !a.reason.trim() || a.reason.length > 1000 || !state.candidates.some(c => c.candidateId === a.candidateId),
      ) ||
      new Set([candidateId, ...alternatives.map(a => a.candidateId)]).size !== alternatives.length + 1
    )
      throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    const choices: RankedChoice[] = [{ candidate, reason }]
    for (const alternative of alternatives) {
      const resolved = state.candidates.find(c => c.candidateId === alternative.candidateId)
      if (!resolved) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
      choices.push({ candidate: resolved, reason: alternative.reason })
    }
    return choices
  }
  private async attemptChoice(state: NeedState, version: number, choice: RankedChoice): Promise<PreparedChoice> {
    const candidate = choice.candidate
    state.attempts++
    const image = await this.service.prepare(candidate, this.signal, this.pagesCache)
    this.signal.throwIfAborted()
    if (state.version !== version || this.states.get(state.need.needId) !== state)
      throw new DeckError('RESEARCH_IMAGE_SELECTION_STALE')
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
      reason: choice.reason,
      evidence: 'metadata',
      policy: 'web-images-v2',
    }
    state.attemptLog.push({
      candidateId: candidate.candidateId,
      imageUrl: candidate.imageUrl,
      code: 'IMAGE_PREPARED',
      checks: [],
    })
    state.selected = { ...image, selection, attempts: [...state.attemptLog] }
    delete state.failure
    return { credit: image.credit, selection }
  }
  private recordAttemptFailure(state: NeedState, candidate: Candidate, error: unknown): string {
    state.failure = error instanceof Error && error.name === 'TimeoutError' ? 'RESEARCH_IMAGE_TIMEOUT' : code(error)
    state.attemptLog.push({
      candidateId: candidate.candidateId,
      imageUrl: candidate.imageUrl,
      code: state.failure,
      checks:
        error instanceof ImageSourceError
          ? error.checks
          : error instanceof ImageReadError
            ? [
                {
                  sourceUrl: imageSource(candidate).downloadUrl ?? candidate.imageUrl,
                  code: error.code,
                  ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
                },
              ]
            : [],
    })
    return state.failure
  }
}
