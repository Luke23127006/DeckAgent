import { DeckError, validateBriefDraft, interviewState } from '@deckagent/deck'
import type { DeckStore, BriefDraft } from '@deckagent/deck'
import { DesignError } from '@deckagent/design'
import type { BriefView } from '@deckagent/host-contracts'
import type { DeckAttachments, DeckChats, DeckRuns } from '../ports.ts'
import { DeckWorkflowError, deckWorkflowErrorCode } from '../deck.errors.ts'
import { emptyBriefDraft } from './brief-rules.ts'

/** Verifies source ownership and manages brief reads, interview state and saves without granting external reads. */
export class BriefWorkflow {
  constructor(
    private readonly decks: DeckStore,
    private readonly chats: DeckChats,
    private readonly attachments: DeckAttachments,
    private readonly runs: DeckRuns,
  ) {}

  private async chat(id: string) {
    if (!(await this.chats.getInfo(id))) throw new DeckWorkflowError('SESSION_NOT_FOUND')
  }

  private sources(id: string) {
    return [
      ...this.attachments.sent(id).flatMap(item => (item.source ? [item.source] : [])),
      ...this.runs.sourceCatalogue(id),
      ...this.runs.researchSources(id),
    ]
  }

  verify(id: string, draft: BriefDraft) {
    const known = this.sources(id)
    for (const ref of draft.sources.refs)
      if (!known.some(item => item.sourceId === ref.sourceId && item.version === ref.version && item.kind === ref.kind))
        throw new DeckWorkflowError('SOURCE_NOT_FOUND')
    const images = this.attachments.sent(id)
    for (const attachmentId of draft.images.attachmentIds) {
      const item = images.find(entry => entry.attachmentId === attachmentId)
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
        throw new DeckWorkflowError('SOURCE_NOT_FOUND')
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
    if (error instanceof DeckWorkflowError) throw error
    if (error instanceof DeckError || error instanceof DesignError) {
      throw new DeckWorkflowError(deckWorkflowErrorCode(error.code) ?? 'BRIEF_UNAVAILABLE')
    }
    throw new DeckWorkflowError('BRIEF_UNAVAILABLE')
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
    if (this.runs.activeFor({ kind: 'chat', id })) throw new DeckWorkflowError('SESSION_BUSY')
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
      throw new DeckWorkflowError('BRIEF_INVALID')
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
