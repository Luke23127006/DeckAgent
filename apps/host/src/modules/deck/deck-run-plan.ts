import { randomUUID } from 'node:crypto'
import { DeckError, interviewState, skipInterview, validateBriefDraft } from '@deckagent/deck'
import type { DeckStore, BriefDraft, BoundOutlineDraft } from '@deckagent/deck'
import type { RunTools } from '../../runs/ports.ts'
import type { DeckToolRun } from './deck-tool-session.ts'
import type { AgentRequest, ModelSelection } from '@deckagent/host-contracts'
import type { RunPlan, RunResult, ToolSet } from '../../runs/index.ts'
import type { DeckSessionStore } from './ports.ts'
import type { BriefCoordinator } from './brief-coordinator.ts'
import { DeckWorkflowFailure } from './failures.ts'
import {
  buildDeckInstructions,
  buildDeckWorkflowContext,
  buildRecoveryInstructions,
  emptyBriefDraft,
  sourceKindsForBrief,
} from './deck-prompts.ts'
import { createDeckImageReview, createDeckToolSession } from './deck-tool-session.ts'
import type { DeckImageReview, DeckToolSession, DeckImageRecovery } from './deck-tool-session.ts'
import type { WebImageResearch } from './image-research.ts'

type DeckCommand = NonNullable<AgentRequest['deck']>
export interface DeckPlanDependencies {
  readonly decks: DeckStore
  readonly sessions: DeckSessionStore
  readonly briefs: BriefCoordinator
  readonly imageResearch?: WebImageResearch
}
const unchangedOutlineText =
  'Giữ nguyên Outline và Brief. Chưa tạo slide. Câu hỏi hoặc yêu cầu cần làm rõ không tạo phiên bản mới.'
function failed(result: RunResult, code: string): RunResult {
  return { status: 'failed', usage: result.usage, error: { category: 'runtime-failed', code } }
}
function toolSet(tools: RunTools): ToolSet {
  return {
    context: tools.context,
    manifest: tools.manifest,
    schemas: tools.schemas,
    executor: { execute: (name, args) => tools.call(name, args) },
  }
}
export async function createDeckRunPlan(
  deps: DeckPlanDependencies,
  request: AgentRequest,
  selection: ModelSelection,
): Promise<RunPlan> {
  const command = request.deck
  if (!command) throw new DeckWorkflowFailure('OUTLINE_NOT_FOUND')
  const snapshot = await deps.briefs.get(request.sessionId)
  if (snapshot.locked) throw new DeckWorkflowFailure('BRIEF_LOCKED')
  if (snapshot.version !== command.expectedBriefVersion) throw new DeckWorkflowFailure('BRIEF_STALE')
  const outlines = deps.decks.outlineSnapshot(request.sessionId)
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
  if (restored) deps.briefs.verify(request.sessionId, initial)
  const restoredDraft: BoundOutlineDraft | undefined = restored && {
    overview: restored.overview,
    revisionSuggestions: restored.revisionSuggestions ?? [],
    slides: restored.slides.map(s => ({ ...s, blocks: s.blocks ?? [], sources: s.sources ?? [] })),
  }

  const readOnly = command.action === 'question' || command.action === 'clarify'
  let session: DeckToolSession | undefined
  let review: DeckImageReview | undefined
  let run: DeckToolRun | undefined
  let instructions = ''
  let recovery: DeckImageRecovery | undefined
  const baseTools: RunTools = {
    context: 'deck-staging',
    manifest: '',
    schemas: [],
    call: async () => ({ isError: true, content: [{ type: 'text', text: 'TOOL_NOT_ALLOWED' }] }),
  }
  const plan: RunPlan = {
    owner: { kind: 'chat', id: request.sessionId },
    input: request.input,
    selection,
    grants: {
      publicResearch: initial.sources.publicResearch && request.publicResearch === true,
      sourceKinds: sourceKindsForBrief(initial),
    },
    stepLimit: 8,
    skipRuntime:
      !!restoredDraft || (command.action === 'skip' && !interviewState(skipInterview(initial)).readyForOutline),
    async beforeRun(ctx) {
      run = {
        requestId: ctx.requestId,
        sessionId: request.sessionId,
        signal: ctx.signal,
        emit: ctx.emit,
        tools: baseTools,
      }
      const previous = deps.decks.outlineSnapshot(request.sessionId).proposals.find(p => p.status === 'current')
      review = await createDeckImageReview(
        deps.decks,
        deps.imageResearch,
        command,
        initial,
        previous,
        restoredDraft,
        run,
      )
      const expected = outlines.proposals.find(p => p.outlineId === command.expectedOutline?.outlineId) ?? null
      const context = buildDeckWorkflowContext(command, initial, previous, review, expected)
      instructions = buildDeckInstructions(context)
      session = createDeckToolSession({
        briefs: deps.briefs,
        command,
        context,
        initial,
        publicResearch: request.publicResearch === true,
        readOnly,
        review,
        run,
        sessionId: request.sessionId,
      })
    },
    contributions: [
      {
        name: 'deck-review',
        async contribute() {
          if (!session?.tools) throw new DeckWorkflowFailure('BRIEF_PROPOSAL_REQUIRED')
          return { instructions: [instructions], tools: toolSet(session.tools) }
        },
      },
    ],
    async next(result) {
      if (
        result.status !== 'completed' ||
        !session ||
        session.state.briefRepairLimit ||
        session.state.outlineRepairLimit ||
        session.state.outlineError
      )
        return undefined
      recovery = await session.prepareImageRecovery()
      if (!recovery || !session.tools) return undefined
      const tools = session.tools
      return {
        owner: plan.owner,
        input: request.input,
        selection,
        grants: { publicResearch: false, sourceKinds: [] },
        stepLimit: 8,
        contributions: [
          {
            name: 'deck-image-recovery',
            async contribute() {
              return {
                instructions: [buildRecoveryInstructions(instructions, recovery?.recovery ?? '')],
                tools: toolSet({
                  ...tools,
                  context: `${tools.context}|image-recovery`,
                  schemas: tools.schemas.filter(s => ['search_slide_images', 'select_slide_image'].includes(s.name)),
                }),
              }
            },
          },
        ],
      }
    },
    async finalize(result) {
      if (!session || !review || !run) return failed(result, 'BRIEF_PROPOSAL_REQUIRED')
      if (recovery) await recovery.settle(result.status === 'completed')
      const state = session.state
      if (run.signal.aborted) return result
      if (state.briefRepairLimit) return failed(result, 'BRIEF_REPAIR_LIMIT')
      if (state.outlineRepairLimit) return failed(result, 'OUTLINE_REPAIR_LIMIT')
      if (result.status !== 'completed' && !recovery) return result
      if (state.outlineError) return failed(result, state.outlineError)
      if (state.imageToolError) return failed(result, state.imageToolError)
      if (
        !readOnly &&
        !state.proposalChanged &&
        !state.rejected &&
        command.action === 'revise' &&
        command.expectedOutline
      ) {
        await run.emit({ kind: 'text', part: 'deck-workflow-result', text: unchangedOutlineText })
        return result
      }
      if (!readOnly && (!state.staged || state.rejected)) return failed(result, 'BRIEF_PROPOSAL_REQUIRED')
      if (!readOnly && state.staged && interviewState(state.staged).readyForOutline && !state.outline)
        return failed(result, 'OUTLINE_PROPOSAL_REQUIRED')
      if (!readOnly && state.staged) {
        const failure = await commitProposal(deps, request, command, state.staged, state.outline, review, run)
        if (failure?.status === 'failed') return failed(result, failure.errorCode)
      }
      return recovery
        ? {
            status: 'completed',
            usage: result.usage,
            ...(result.status === 'completed' && result.commit ? { commit: result.commit } : {}),
          }
        : result
    },
  }
  return plan
}
async function commitProposal(
  deps: DeckPlanDependencies,
  request: AgentRequest,
  command: DeckCommand,
  staged: BriefDraft,
  outline: BoundOutlineDraft | undefined,
  review: DeckImageReview,
  run: DeckToolRun,
): Promise<{ readonly status: 'failed'; readonly errorCode: string } | undefined> {
  try {
    deps.briefs.verify(request.sessionId, staged)
    const history = await deps.sessions.read(request.sessionId)
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
        ? await deps.decks.prepareOutlineImages(
            request.sessionId,
            proposal,
            run.signal,
            review.restored && restoreId
              ? async need => deps.decks.restoredOutlineImage(request.sessionId, restoreId, need.needId)
              : review.imageReview?.resolve,
          )
        : undefined
      if (hasImages) await imageEvent('completed')
    } catch (error) {
      if (hasImages) await imageEvent('failed')
      throw error
    }
    run.signal.throwIfAborted()
    deps.decks.commitBriefProposal(request.sessionId, proposal, preparation)
    const state = interviewState(staged)
    const current = deps.decks.outlineSnapshot(request.sessionId).proposals.at(-1)
    await run.emit({
      kind: 'text',
      part: 'deck-workflow-result',
      text:
        outline && current
          ? `Đã lưu Outline mới với ${outline.slides.length} slide dự kiến. Chưa tạo slide.\nThay đổi đầy đủ: ${JSON.stringify(current.changes)}\n${deps.decks
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
