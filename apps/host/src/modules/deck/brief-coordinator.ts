import { DeckError, validateBriefDraft, interviewState } from '@deckagent/deck'
import type { DeckStore, BriefDraft } from '@deckagent/deck'
import { DesignError } from '@deckagent/design'
import type { DeckSessionStore } from './ports.ts'
import type { BriefManagement } from '@deckagent/host-api'
import type { BriefView } from '@deckagent/host-contracts'
import { emptyBriefDraft } from './deck-prompts.ts'
import { DeckWorkflowFailure } from './failures.ts'

/** Composition verifies source ownership, without reading external files or granting research access. */
export class BriefCoordinator implements BriefManagement {
  constructor(
    private readonly decks: DeckStore,
    private readonly sessions: DeckSessionStore,
  ) {}

  private async chat(id: string) {
    if (!(await this.sessions.getInfo(id))) throw new DeckWorkflowFailure('SESSION_NOT_FOUND')
  }

  private sources(id: string) {
    return [
      ...this.sessions.attachments.sent(id).flatMap(item => (item.source ? [item.source] : [])),
      ...this.sessions.requests.sourceCatalogue(id),
      ...this.sessions.requests.researchSources(id),
    ]
  }

  verify(id: string, draft: BriefDraft) {
    const known = this.sources(id)
    for (const ref of draft.sources.refs)
      if (!known.some(item => item.sourceId === ref.sourceId && item.version === ref.version && item.kind === ref.kind))
        throw new DeckWorkflowFailure('SOURCE_NOT_FOUND')
    const images = this.sessions.attachments.sent(id)
    for (const attachmentId of draft.images.attachmentIds) {
      const item = images.find(item => item.attachmentId === attachmentId)
      const source = item?.source
      if (
        !item ||
        item.state !== 'ready' ||
        !item.detectedType?.startsWith('image/') ||
        !source ||
        !draft.sources.refs.some(
          ref => ref.sourceId === source.sourceId && ref.version === source.version && ref.kind === 'attachment',
        )
      )
        throw new DeckWorkflowFailure('SOURCE_NOT_FOUND')
    }
  }

  async interview(id: string) {
    const brief = await this.get(id)
    const draft = brief.current?.draft ?? emptyBriefDraft()
    const state = interviewState(
      draft,
      brief.sourceStates.some(s => s.status === 'unavailable'),
    )
    const images = this.decks.imageBlockers(id)
    return {
      brief,
      state: {
        ...state,
        blockers: [...state.blockers, ...images],
        readyForOutline: state.readyForOutline && !images.length,
      },
    }
  }

  private map(error: unknown): never {
    if (error instanceof DeckWorkflowFailure) throw error
    if (error instanceof DeckError || error instanceof DesignError) {
      throw new DeckWorkflowFailure(error.code)
    }
    throw new DeckWorkflowFailure('BRIEF_UNAVAILABLE')
  }

  async get(id: string, version?: number): Promise<BriefView> {
    await this.chat(id)
    try {
      const snapshot = this.decks.briefSnapshot(id)
      const current =
        version === undefined
          ? snapshot.current
          : snapshot.current
            ? this.decks.briefVersion(id, snapshot.current.briefId, version)
            : null
      if (version !== undefined && !current) throw new DeckError('BRIEF_NOT_FOUND')
      const known = this.sources(id)
      return {
        ...snapshot,
        version: current?.version ?? 0,
        current,
        sourceStates: (current?.draft.sources.refs ?? []).map(source => ({
          source,
          status: known.some(
            item => item.sourceId === source.sourceId && item.version === source.version && item.kind === source.kind,
          )
            ? 'recorded'
            : 'unavailable',
        })),
      }
    } catch (error) {
      this.map(error)
    }
  }

  async save(id: string, value: unknown): Promise<BriefView> {
    await this.chat(id)
    if (this.sessions.requests.activeFor(id)) throw new DeckWorkflowFailure('SESSION_BUSY')
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !('draft' in value) ||
      !('expectedVersion' in value) ||
      !Number.isSafeInteger(value.expectedVersion) ||
      Number(value.expectedVersion) < 0 ||
      Object.keys(value).some(key => !['draft', 'expectedVersion'].includes(key))
    )
      throw new DeckWorkflowFailure('BRIEF_INVALID')
    try {
      const draft = validateBriefDraft(value.draft)
      this.verify(id, draft)
      this.decks.saveBrief(id, { expectedVersion: Number(value.expectedVersion), draft })
      return this.get(id)
    } catch (error) {
      this.map(error)
    }
  }
}
