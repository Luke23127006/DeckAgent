import { createHash, randomUUID } from 'node:crypto'
import {
  DeckError,
  interviewState,
  outlineImageNeeds,
  skipInterview,
  validateBriefDraft,
  validateBoundOutline,
} from '@deckagent/deck'
import type { BriefDraft, BoundOutlineDraft, DeckStore, OutlineImageReview } from '@deckagent/deck'
import { reviewLayouts } from '@deckagent/design'
import type { RunTools, ToolResult, ToolSchema } from '../../../runs/ports.ts'
import type { AgentRequest } from '@deckagent/host-contracts'
import type { DeckToolRun } from '../ports.ts'
import type { ImageReviewRun, WebImageResearch } from '../images/index.ts'
import type { BriefWorkflow } from './brief-workflow.ts'
import { buildDeckToolSchemas } from './brief-prompts.ts'
import { assertBriefChoices } from './brief-rules.ts'
import {
  decodeDeckToolArgs,
  decodeImageToolCall,
  deckRepairLimitResult,
  deckToolResult,
  recordDeckToolFailure,
} from './brief-tool-protocol.ts'
import type { BriefFailureState } from './brief-tool-protocol.ts'

type DeckCommand = NonNullable<AgentRequest['deck']>
type OutlineProposal = ReturnType<DeckStore['outlineSnapshot']>['proposals'][number]
type PendingImage = ReturnType<ImageReviewRun['pending']>[number]

export interface DeckStagingState extends BriefFailureState {
  proposalChanged: boolean
  rejected: boolean
  repairingImages: boolean
}

export interface DeckImageReview {
  readonly resumeImages: boolean
  readonly staged: BriefDraft | undefined
  readonly outline: BoundOutlineDraft | undefined
  readonly previousReviews: readonly OutlineImageReview[] | undefined
  readonly imageReview: ImageReviewRun | undefined
  readonly restored: BoundOutlineDraft | undefined
}

export interface DeckRunToolsOptions {
  readonly briefs: BriefWorkflow
  readonly command: DeckCommand
  readonly context: unknown
  readonly initial: BriefDraft
  readonly publicResearch: boolean
  readonly readOnly: boolean
  readonly review: DeckImageReview
  readonly run: DeckToolRun
  readonly sessionId: string
}

export interface DeckImageRecovery {
  readonly recovery: string
  settle(completed: boolean, threw?: boolean): Promise<void>
}

export interface DeckRunTools {
  readonly tools: RunTools | undefined
  readonly state: DeckStagingState
  prepareImageRecovery(): Promise<DeckImageRecovery | undefined>
}

const imageTools = ['search_slide_images', 'select_slide_image']
const stagingTools = ['stage_brief', 'stage_outline', ...imageTools]

const unrecoverableFailures = new Set(
  'RESEARCH_KEY_UNAVAILABLE RESEARCH_KEY_REJECTED RESEARCH_FREE_ONLY RESEARCH_QUOTA_EXHAUSTED RESEARCH_IMAGE_BUDGET'.split(
    ' ',
  ),
)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function createDeckRunTools(options: DeckRunToolsOptions): DeckRunTools {
  const state: DeckStagingState = {
    staged: options.review.staged,
    outline: options.review.outline,
    proposalChanged: options.command.action === 'skip' || !!options.review.restored,
    rejected: false,
    briefFailures: 0,
    briefRepairLimit: false,
    outlineFailures: 0,
    outlineRepairLimit: false,
    outlineError: undefined,
    imageToolError: undefined,
    repairingImages: false,
  }
  const tools = buildTools(options, state)
  return {
    tools,
    state,
    prepareImageRecovery: () => prepareImageRecovery(options, state, tools),
  }
}

export async function createDeckImageReview(
  decks: DeckStore,
  imageResearch: WebImageResearch | undefined,
  command: DeckCommand,
  initial: BriefDraft,
  previousOutline: OutlineProposal | undefined,
  restored: BoundOutlineDraft | undefined,
  run: DeckToolRun,
): Promise<DeckImageReview> {
  const readOnly = command.action === 'question' || command.action === 'clarify'
  const resumeImages =
    !readOnly &&
    !restored &&
    command.action === 'revise' &&
    initial.images.mode === 'public-research' &&
    initial.template?.version !== 1 &&
    (!command.imageChoice || command.imageChoice === 'public-research') &&
    previousOutline?.slides.some(s => s.blocks?.some(b => b.kind === 'web-image'))
  const staged: BriefDraft | undefined =
    command.action === 'skip' ? skipInterview(initial) : restored || resumeImages ? initial : undefined
  const outline: BoundOutlineDraft | undefined =
    restored ??
    (resumeImages && previousOutline
      ? {
          overview: previousOutline.overview,
          revisionSuggestions: previousOutline.revisionSuggestions ?? [],
          slides: previousOutline.slides.map(s => ({
            ...s,
            blocks: (s.blocks ?? []).map(b =>
              b.kind === 'web-image' ? { ...b, provider: initial.images.provider ?? 'tavily' } : b,
            ),
            sources: s.sources ?? [],
          })),
        }
      : undefined)
  const resumedNeeds = resumeImages && outline ? outlineImageNeeds(outline) : []
  const retainedIds = new Map(
    resumedNeeds.flatMap(need => {
      const previous = previousOutline?.imageReview?.find(
        n => n.slideIndex === need.slideIndex && n.blockIndex === need.blockIndex,
      )
      return previous ? [[need.needId, previous.needId] as const] : []
    }),
  )
  const previousReviews = previousOutline?.imageReview?.map(review => ({
    ...review,
    needId:
      resumedNeeds.find(n => n.slideIndex === review.slideIndex && n.blockIndex === review.blockIndex)?.needId ??
      review.needId,
  }))
  const imageReview = imageResearch?.open(
    run.signal,
    () => decks.reserveImageSearch(run.sessionId, run.requestId),
    previousReviews,
    previousOutline
      ? async needId =>
          decks.restoredOutlineImage(run.sessionId, previousOutline.outlineId, retainedIds.get(needId) ?? needId)
      : undefined,
  )
  if (resumeImages) await imageReview?.resume(resumedNeeds)

  return { resumeImages: resumeImages === true, staged, outline, previousReviews, imageReview, restored }
}

function buildTools(options: DeckRunToolsOptions, state: DeckStagingState): RunTools | undefined {
  const baseTools = options.run.tools
  if (!baseTools) return undefined
  const schemas = buildDeckToolSchemas(
    options.command.action,
    options.readOnly,
    !!options.review.restored,
    !!options.review.imageReview,
  )
  return {
    context: createHash('sha256')
      .update(`${baseTools.context}|${JSON.stringify(options.context)}`)
      .digest('hex'),
    manifest: baseTools.manifest,
    schemas: [...baseTools.schemas, ...schemas],
    call: (name, args) => callTool(name, args, options, state, schemas),
  }
}

async function callTool(
  name: string,
  args: unknown,
  options: DeckRunToolsOptions,
  state: DeckStagingState,
  schemas: readonly ToolSchema[],
): Promise<ToolResult> {
  const { run } = options
  if (run.signal.aborted) return deckToolResult('REQUEST_CLOSED', true)
  if (state.repairingImages && !imageTools.includes(name)) return deckToolResult('TOOL_NOT_ALLOWED', true)
  if (!stagingTools.includes(name)) return deckToolResult('TOOL_NOT_ALLOWED', true)
  if (!schemas.some(s => s.name === name)) return deckToolResult('TOOL_NOT_ALLOWED', true)

  const blocked = deckRepairLimitResult(state)
  if (blocked) return blocked

  try {
    const response = await dispatchStagingTool(name, args, options, state)
    return deckToolResult(response)
  } catch (error) {
    if (name === 'stage_brief' || name === 'stage_outline') state.rejected = true
    return recordDeckToolFailure(name, error, state, options.review.imageReview)
  }
}

async function dispatchStagingTool(
  name: string,
  args: unknown,
  options: DeckRunToolsOptions,
  state: DeckStagingState,
): Promise<unknown> {
  if (imageTools.includes(name)) return executeImageTool(name, args, state, options.review.imageReview)
  if (name === 'stage_brief')
    return executeStageBrief(args, options.command, options.initial, options.sessionId, options.briefs, state)
  return executeStageOutline(args, state, options.review.imageReview)
}

async function executeImageTool(
  name: string,
  args: unknown,
  state: DeckStagingState,
  imageReview: ImageReviewRun | undefined,
): Promise<unknown> {
  if (!state.staged || !state.outline || !imageReview) throw new DeckError('RESEARCH_IMAGE_CONTEXT_REQUIRED')
  if (state.staged.images.mode !== 'public-research') throw new DeckError('IMAGE_CHOICE_REQUIRED')

  const value = decodeDeckToolArgs(args)
  if (!isRecord(value) || typeof value.needId !== 'string') throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')

  const needId = value.needId
  if (!imageReview.snapshot().some(n => n.needId === needId)) throw new DeckError('RESEARCH_IMAGE_SELECTION_STALE')

  state.proposalChanged = true
  const call = decodeImageToolCall(name, value)
  const response =
    call.kind === 'search'
      ? await imageReview.search(needId, call.query)
      : await imageReview.select(needId, call.candidateId, call.reason, call.alternatives)
  state.imageToolError = undefined

  return response
}

function executeStageBrief(
  args: unknown,
  command: DeckCommand,
  initial: BriefDraft,
  sessionId: string,
  briefs: BriefWorkflow,
  state: DeckStagingState,
) {
  const draft = withImageProvider(validateBriefDraft(decodeDeckToolArgs(args)), initial)
  assertBriefChoices(draft, initial, command)
  if (command.action !== 'revise' && initial.requirements.some(r => !draft.requirements.includes(r)))
    throw new DeckError('BRIEF_REQUIREMENTS_LOST')

  briefs.verify(sessionId, draft)
  state.staged = draft
  state.proposalChanged = true
  state.outline = undefined
  state.rejected = false

  return interviewState(draft)
}

function withImageProvider(draft: BriefDraft, initial: BriefDraft): BriefDraft {
  if (draft.images.mode !== 'public-research' || draft.template?.version === 1) return draft
  return {
    ...draft,
    images: { ...draft.images, provider: draft.images.provider ?? initial.images.provider ?? 'tavily' },
  }
}

async function executeStageOutline(args: unknown, state: DeckStagingState, imageReview: ImageReviewRun | undefined) {
  const staged = state.staged
  if (!staged || !interviewState(staged).readyForOutline) throw new DeckError('BRIEF_INCOMPLETE')

  const outline = validateBoundOutline(decodeDeckToolArgs(args))
  const layoutIssues = reviewLayouts(outline.slides, staged.template)
  if (layoutIssues.length) throw new DeckError('DESIGN_LAYOUT_INCOMPATIBLE', layoutIssues)
  if (outline.slides.some(s => s.blocks.some(b => b.kind === 'web-image')) && staged.images.mode !== 'public-research')
    throw new DeckError('IMAGE_CHOICE_REQUIRED')

  const provider = staged.images.provider ?? 'tavily'
  if (outline.slides.some(s => s.blocks.some(b => b.kind === 'web-image' && b.provider && b.provider !== provider)))
    throw new DeckError('IMAGE_CHOICE_REQUIRED')

  const bound: BoundOutlineDraft = {
    ...outline,
    slides: outline.slides.map(s => ({
      ...s,
      blocks: s.blocks.map(b => (b.kind === 'web-image' ? { ...b, provider } : b)),
    })),
  }
  const imageNeeds =
    imageReview && staged.template?.version !== 1 && staged.images.mode === 'public-research'
      ? await imageReview.stage(outlineImageNeeds(bound))
      : []
  state.rejected = false
  state.outlineError = undefined
  state.proposalChanged = true
  state.outline = bound

  return {
    staged: true,
    imageNeeds,
    notice: 'Outline is staged, not confirmed. Select relevant image candidates before finishing. No slides exist.',
  }
}

function hasRecoverableImages(pendingImages: readonly PendingImage[]): boolean {
  return pendingImages.some(
    n =>
      n.remainingSelections > 0 &&
      (n.candidates.some(c => !n.attempts.some(a => a.candidateId === c.candidateId)) ||
        (n.remainingSearches > 0 && !unrecoverableFailures.has(n.failure ?? ''))),
  )
}

async function prepareImageRecovery(
  options: DeckRunToolsOptions,
  state: DeckStagingState,
  tools: RunTools | undefined,
): Promise<DeckImageRecovery | undefined> {
  const { run } = options
  const imageReview = options.review.imageReview
  const pending = imageReview?.pending().filter(n => n.required) ?? []
  if (
    options.readOnly ||
    options.review.restored ||
    state.rejected ||
    !state.proposalChanged ||
    !state.staged ||
    !state.outline ||
    !tools ||
    !hasRecoverableImages(pending)
  )
    return

  state.repairingImages = true
  const recovery = JSON.stringify({ outline: state.outline, imageNeeds: pending })
  const recoveryId = `image-recovery-${randomUUID()}`
  const activity = (status: 'running' | 'completed' | 'failed') =>
    run.emit({ kind: 'activity', id: recoveryId, label: 'recover_slide_images', type: 'tool', status })
  await activity('running')

  return {
    recovery,
    async settle(completed, threw = false) {
      if (run.signal.aborted) return
      if (threw) {
        await run.emit({ kind: 'notice', code: 'IMAGE_RECOVERY_INCOMPLETE' })
        return
      }
      if (!completed) await run.emit({ kind: 'notice', code: 'IMAGE_RECOVERY_INCOMPLETE' })
      await activity(imageReview?.pending().some(n => n.required) ? 'failed' : 'completed')
    },
  }
}
