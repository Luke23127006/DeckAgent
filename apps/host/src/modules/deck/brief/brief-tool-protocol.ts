import { DeckError } from '@deckagent/deck'
import type { BriefDraft, BoundOutlineDraft } from '@deckagent/deck'
import type { ToolResult } from '../../../runs/ports.ts'
import { DeckWorkflowError } from '../deck.errors.ts'
import type { ImageReviewRun } from '../images/index.ts'

export interface BriefFailureState {
  staged: BriefDraft | undefined
  outline: BoundOutlineDraft | undefined
  briefFailures: number
  briefRepairLimit: boolean
  outlineFailures: number
  outlineRepairLimit: boolean
  outlineError: string | undefined
  imageToolError: string | undefined
}

export function deckToolResult(value: unknown, isError = false): ToolResult {
  return {
    isError,
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
  }
}

export function decodeDeckToolArgs(args: unknown): unknown {
  if (
    !args ||
    typeof args !== 'object' ||
    Array.isArray(args) ||
    !('json' in args) ||
    typeof args.json !== 'string' ||
    Object.keys(args).some(k => k !== 'json') ||
    Buffer.byteLength(args.json) > 128 * 1024
  )
    throw new DeckError('BRIEF_INVALID', [
      {
        code: 'BRIEF_INVALID',
        path: 'json',
        message: 'The tool expects one JSON string within 128 KiB.',
        expected: 'Arguments {json: JSON.stringify(brief)} using the supplied schema.',
      },
    ])
  try {
    return JSON.parse(args.json)
  } catch {
    throw new DeckError('BRIEF_INVALID', [
      {
        code: 'BRIEF_INVALID',
        path: 'json',
        message: 'The json field is not valid JSON.',
        expected: 'A JSON string containing the complete object, without Markdown fences.',
      },
    ])
  }
}

const codeOf = (error: unknown, fallback: string) =>
  error instanceof DeckError || error instanceof DeckWorkflowError ? error.code : fallback

const repairInfo = (failures: number) => ({
  remaining: Math.max(0, 3 - failures),
  maxRepairs: 2,
  retryable: failures < 3,
})

const issuesOf = (error: unknown, code: string, path: string, message: string, expected: string) =>
  error instanceof DeckError && error.issues.length ? error.issues : [{ code, path, message, expected }]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function deckRepairLimitResult(state: BriefFailureState): ToolResult | undefined {
  if (state.briefRepairLimit)
    return deckToolResult(
      {
        code: 'BRIEF_REPAIR_LIMIT',
        issues: [
          {
            code: 'BRIEF_REPAIR_LIMIT',
            path: 'brief',
            message: 'The request exhausted its Brief repairs. No staged proposal will be committed.',
          },
        ],
        repair: { remaining: 0, maxRepairs: 2, retryable: false },
      },
      true,
    )
  if (state.outlineRepairLimit)
    return deckToolResult(
      { code: 'OUTLINE_REPAIR_LIMIT', repair: { remaining: 0, maxRepairs: 2, retryable: false } },
      true,
    )
  return undefined
}

export type ImageToolCall =
  | { readonly kind: 'search'; readonly query: string }
  | {
      readonly kind: 'select'
      readonly candidateId: string
      readonly reason: string
      readonly alternatives: readonly { readonly candidateId: string; readonly reason: string }[]
    }

export function decodeImageToolCall(name: string, value: Record<string, unknown>): ImageToolCall {
  if (name === 'search_slide_images') {
    if (typeof value.query !== 'string' || Object.keys(value).some(k => !['needId', 'query'].includes(k)))
      throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    return { kind: 'search', query: value.query }
  }
  if (
    typeof value.candidateId !== 'string' ||
    typeof value.reason !== 'string' ||
    Object.keys(value).some(k => !['needId', 'candidateId', 'reason', 'alternatives'].includes(k))
  )
    throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
  const list = 'alternatives' in value ? value.alternatives : []
  if (!Array.isArray(list) || list.length > 2) throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
  const alternatives = list.map(alternative => {
    if (
      !isRecord(alternative) ||
      typeof alternative.candidateId !== 'string' ||
      typeof alternative.reason !== 'string' ||
      Object.keys(alternative).some(k => !['candidateId', 'reason'].includes(k))
    )
      throw new DeckError('RESEARCH_IMAGE_ARGUMENTS_INVALID')
    return { candidateId: alternative.candidateId, reason: alternative.reason }
  })
  return { kind: 'select', candidateId: value.candidateId, reason: value.reason, alternatives }
}

export function recordDeckToolFailure(
  name: string,
  error: unknown,
  state: BriefFailureState,
  imageReview: ImageReviewRun | undefined,
): ToolResult {
  if (name === 'stage_brief') {
    state.staged = undefined
    state.outline = undefined
    state.briefFailures++
    state.briefRepairLimit = state.briefFailures >= 3
    const code = state.briefRepairLimit ? 'BRIEF_REPAIR_LIMIT' : codeOf(error, 'BRIEF_INVALID')
    const issues = issuesOf(
      error,
      code,
      'brief',
      'The proposed Brief does not match the schema or Host-admitted choices.',
      'Use the supplied schema, source choices and catalog. Do not grant access or replace user selections.',
    )
    return deckToolResult({ code, issues, repair: repairInfo(state.briefFailures) }, true)
  }
  if (name === 'stage_outline') {
    state.outlineFailures++
    state.outlineRepairLimit = state.outlineFailures >= 3
    const code = state.outlineRepairLimit ? 'OUTLINE_REPAIR_LIMIT' : codeOf(error, 'OUTLINE_INVALID')
    state.outlineError = code
    const issues = issuesOf(
      error,
      code,
      'outline',
      'The proposed Outline does not match its schema or admitted choices.',
      'Use the supplied Outline schema and catalog. Keep required content and admitted choices.',
    )
    return deckToolResult({ code, issues, repair: repairInfo(state.outlineFailures) }, true)
  }
  return imageFailure(error, state, imageReview)
}

function imageFailure(error: unknown, state: BriefFailureState, imageReview: ImageReviewRun | undefined): ToolResult {
  const code = codeOf(error, 'RESEARCH_IMAGE_UNAVAILABLE')
  if (
    [
      'RESEARCH_IMAGE_CONTEXT_REQUIRED',
      'RESEARCH_IMAGE_SELECTION_STALE',
      'RESEARCH_IMAGE_ARGUMENTS_INVALID',
      'IMAGE_CHOICE_REQUIRED',
    ].includes(code)
  )
    state.imageToolError = code
  const notice =
    code === 'RESEARCH_IMAGE_CONTEXT_REQUIRED'
      ? 'No working image context exists. Stage a ready Brief and Outline first. This is a workflow error, not a search with no results.'
      : code === 'RESEARCH_IMAGE_SELECTION_STALE' || code === 'RESEARCH_IMAGE_ARGUMENTS_INVALID'
        ? 'Use the current imageNeeds and search for new candidate IDs. Historical IDs are not current. A tool error is not an empty search result.'
        : 'Choose an untried relevant candidate or refine the query within remaining budgets. Keep required image positions.'
  return deckToolResult({ code, imageNeeds: imageReview?.snapshot() ?? [], notice }, true)
}
