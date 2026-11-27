import { randomUUID } from 'node:crypto'
import { DeckError, interviewState, validateBriefDraft } from '@deckagent/deck'
import type { DeckStore, BriefDraft, BoundOutlineDraft } from '@deckagent/deck'
import type { PreparedRequest, RequestRun, RequestRuntime, RuntimeOutcome } from '@deckagent/host-api'
import type { AgentRequest } from '@deckagent/host-contracts'
import type { DeckSessionStore } from './ports.ts'
import type { BriefCoordinator } from './brief-coordinator.ts'
import { DeckWorkflowFailure } from './failures.ts'
import { buildDeckInstructions, buildDeckWorkflowContext, emptyBriefDraft } from './deck-prompts.ts'
import { executeGenerationRun } from './generation-execution.ts'
import { createDeckImageReview, createDeckToolSession } from './deck-tool-session.ts'
import type { DeckImageReview, DeckToolSession } from './deck-tool-session.ts'
import type { WebImageResearch } from './image-research.ts'

type DeckCommand = NonNullable<AgentRequest['deck']>

const unchangedOutlineText =
  'Giữ nguyên Outline và Brief. Chưa tạo slide. Câu hỏi hoặc yêu cầu cần làm rõ không tạo phiên bản mới.'

/** App composition adds only collecting/reviewing capabilities to the existing runtime. No confirmation or publication. */
export class DeckWorkflow implements RequestRuntime {
  constructor(
    private readonly runtime: RequestRuntime,
    private readonly decks: DeckStore,
    private readonly sessions: DeckSessionStore,
    private readonly briefs: BriefCoordinator,
    private readonly generationRuntime?: RequestRuntime,
    private readonly imageResearch?: WebImageResearch,
  ) {}

  prepare(request: AgentRequest): Promise<PreparedRequest> {
    if (request.continueDeck) return this.prepareContinuation(request)
    if (!request.deck) return this.runtime.prepare(request)
    return this.prepareDeckCommand(request, request.deck)
  }

  private async prepareContinuation(request: AgentRequest): Promise<PreparedRequest> {
    const generation = this.decks.generation(request.sessionId)
    if (!generation || generation.state !== 'incomplete') throw new DeckWorkflowFailure('GENERATION_INCOMPLETE')
    if (!this.generationRuntime) throw new DeckWorkflowFailure('GENERATION_UNAVAILABLE')
    const publicResearch = (await this.briefs.get(request.sessionId)).current?.draft.sources.publicResearch === true
    const prepared = await this.generationRuntime.prepare({ ...request, publicResearch })
    return {
      publicResearch,
      selection: prepared.selection,
      start: run => {
        this.decks.continueGeneration(run.sessionId, run.requestId, prepared.selection)
        return executeGenerationRun(
          this.decks,
          prepared,
          run.sessionId,
          generation.receipt.intentId,
          run.requestId,
          run,
        )
      },
    }
  }

  private async prepareDeckCommand(request: AgentRequest, command: DeckCommand): Promise<PreparedRequest> {
    const snapshot = await this.briefs.get(request.sessionId)
    if (snapshot.locked) throw new DeckWorkflowFailure('BRIEF_LOCKED')
    if (snapshot.version !== command.expectedBriefVersion) throw new DeckWorkflowFailure('BRIEF_STALE')
    const outlines = this.decks.outlineSnapshot(request.sessionId)
    const current = outlines.proposals.find(p => p.outlineId === outlines.currentId)
    if (
      command.expectedOutline === null
        ? !!current
        : !current ||
          current.outlineId !== command.expectedOutline.outlineId ||
          current.version !== command.expectedOutline.version
    )
      throw new DeckWorkflowFailure('OUTLINE_STALE')
    if (['question', 'clarify', 'revise', 'restore'].includes(command.action) && !current)
      throw new DeckWorkflowFailure('OUTLINE_NOT_FOUND', undefined, 'current-outline-required')
    const restoreTarget = outlines.proposals.find(p => p.outlineId === command.restoreOutlineId && p.brief)
    const restored = command.action === 'restore' ? restoreTarget : undefined
    if (command.action === 'restore' && !restored?.brief)
      throw new DeckWorkflowFailure('OUTLINE_NOT_FOUND', undefined, 'restore-outline-missing')
    const base = restored?.brief?.draft ?? snapshot.current?.draft ?? emptyBriefDraft()
    const choice = command.sourceChoice ?? {
      material: base.sources.material || !!request.attachmentIds?.length,
      modelKnowledge: base.sources.modelKnowledge,
      publicResearch: request.publicResearch === true || base.sources.publicResearch,
    }
    const initial = validateBriefDraft({
      ...base,
      ...(command.formatChoice ? { requestedFormat: 'html', generationFormat: 'html' } : {}),
      sources: { ...base.sources, ...choice },
      images: { ...base.images, ...(command.imageProviderChoice ? { provider: command.imageProviderChoice } : {}) },
    })
    if (restored) this.briefs.verify(request.sessionId, initial)
    const prepared = await this.runtime.prepare(request)
    const restoredDraft: BoundOutlineDraft | undefined = restored && {
      overview: restored.overview,
      revisionSuggestions: restored.revisionSuggestions ?? [],
      slides: restored.slides.map(s => ({ ...s, blocks: s.blocks ?? [], sources: s.sources ?? [] })),
    }
    return {
      selection: prepared.selection,
      start: run => this.start(request, command, initial, prepared, run, restoredDraft),
    }
  }

  private async start(
    request: AgentRequest,
    command: DeckCommand,
    initial: BriefDraft,
    prepared: PreparedRequest,
    run: RequestRun,
    restored: BoundOutlineDraft | undefined,
  ): Promise<RuntimeOutcome> {
    const readOnly = command.action === 'question' || command.action === 'clarify'
    const previousOutline = this.decks.outlineSnapshot(run.sessionId).proposals.find(p => p.status === 'current')
    const review = await createDeckImageReview(
      this.decks,
      this.imageResearch,
      command,
      initial,
      previousOutline,
      restored,
      run,
    )
    const proposals = this.decks.outlineSnapshot(request.sessionId).proposals
    const expectedProposal = proposals.find(p => p.outlineId === command.expectedOutline?.outlineId) ?? null
    const context = buildDeckWorkflowContext(command, initial, previousOutline, review, expectedProposal)
    const instructions = buildDeckInstructions(context)
    const session = createDeckToolSession({
      briefs: this.briefs,
      command,
      context,
      initial,
      prepared,
      publicResearch: request.publicResearch === true,
      readOnly,
      review,
      run,
      sessionId: request.sessionId,
    })
    const state = session.state
    const outcome =
      (command.action === 'skip' && state.staged && !interviewState(state.staged).readyForOutline) || restored
        ? { status: 'completed' as const }
        : await prepared.start({ ...run, instructions, ...(session.tools ? { tools: session.tools } : {}) })
    if (run.signal.aborted) return outcome
    if (state.briefRepairLimit) return { status: 'failed', errorCode: 'BRIEF_REPAIR_LIMIT' }
    if (state.outlineRepairLimit) return { status: 'failed', errorCode: 'OUTLINE_REPAIR_LIMIT' }
    if (outcome.status !== 'completed') return outcome
    if (state.outlineError) return { status: 'failed', errorCode: state.outlineError }
    await session.runImageRecovery(instructions)
    return this.settleOutcome(request, command, readOnly, session, review, run, outcome)
  }

  private async settleOutcome(
    request: AgentRequest,
    command: DeckCommand,
    readOnly: boolean,
    session: DeckToolSession,
    review: DeckImageReview,
    run: RequestRun,
    outcome: RuntimeOutcome,
  ): Promise<RuntimeOutcome> {
    const state = session.state
    if (run.signal.aborted) return outcome
    if (state.imageToolError) return { status: 'failed', errorCode: state.imageToolError }
    if (
      !readOnly &&
      !state.proposalChanged &&
      !state.rejected &&
      command.action === 'revise' &&
      command.expectedOutline
    ) {
      await run.emit({ kind: 'text', part: 'deck-workflow-result', text: unchangedOutlineText })
      return outcome
    }
    if (!readOnly && (!state.staged || state.rejected))
      return { status: 'failed', errorCode: 'BRIEF_PROPOSAL_REQUIRED' }
    if (!readOnly && state.staged && interviewState(state.staged).readyForOutline && !state.outline)
      return { status: 'failed', errorCode: 'OUTLINE_PROPOSAL_REQUIRED' }
    if (!readOnly && state.staged) {
      const committed = await this.commitProposal(request, command, state.staged, state.outline, review, run)
      return committed ?? outcome
    }
    return outcome
  }

  private async commitProposal(
    request: AgentRequest,
    command: DeckCommand,
    staged: BriefDraft,
    outline: BoundOutlineDraft | undefined,
    review: DeckImageReview,
    run: RequestRun,
  ): Promise<RuntimeOutcome | undefined> {
    try {
      this.briefs.verify(request.sessionId, staged)
      const history = await this.sessions.read(request.sessionId)
      run.signal.throwIfAborted()
      const proposal = {
        requestId: run.requestId,
        responseIndex: history.filter(m => m.role !== 'system').length,
        expectedBriefVersion: command.expectedBriefVersion,
        expectedOutline: command.expectedOutline,
        draft: staged,
        ...(outline ? { outline } : {}),
        ...(command.restoreOutlineId ? { restoredFrom: command.restoreOutlineId } : {}),
      }
      const hasImages =
        staged.template?.version !== 1 && outline?.slides.some(s => s.blocks.some(b => b.kind === 'web-image'))
      const imageActivity = `prepare-images-${randomUUID()}`
      const imageEvent = (status: 'running' | 'completed' | 'failed') =>
        run.emit({ kind: 'activity', id: imageActivity, label: 'prepare_slide_images', type: 'tool', status })
      let preparation: object | undefined
      if (hasImages) await imageEvent('running')
      try {
        const restoreId = review.restored ? command.restoreOutlineId : undefined
        preparation = outline
          ? await this.decks.prepareOutlineImages(
              request.sessionId,
              proposal,
              run.signal,
              review.restored && restoreId
                ? async need => this.decks.restoredOutlineImage(request.sessionId, restoreId, need.needId)
                : review.imageReview?.resolve,
            )
          : undefined
        if (hasImages) await imageEvent('completed')
      } catch (error) {
        if (hasImages) await imageEvent('failed')
        throw error
      }
      run.signal.throwIfAborted()
      this.decks.commitBriefProposal(request.sessionId, proposal, preparation)
      const state = interviewState(staged)
      const current = this.decks.outlineSnapshot(request.sessionId).proposals.at(-1)
      await run.emit({
        kind: 'text',
        part: 'deck-workflow-result',
        text:
          outline && current
            ? `Đã lưu Outline mới với ${outline.slides.length} slide dự kiến. Chưa tạo slide.\nThay đổi đầy đủ: ${JSON.stringify(current.changes)}\n${this.decks
                .imageBlockers(request.sessionId)
                .map(b => b.message)
                .join('\n')}\n${state.notice}`
            : `${state.questions.map(q => `${q.prompt}${q.suggestions.length ? ` Gợi ý: ${q.suggestions.join('; ')}.` : ''}`).join('\n')}\n${state.blockers.map(b => b.message).join('\n')}\n${state.notice}`,
      })
      return undefined
    } catch (error) {
      return { status: 'failed', errorCode: error instanceof DeckError ? error.code : 'BRIEF_NOT_SAVED' }
    }
  }
}
