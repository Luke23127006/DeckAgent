import { DeckError } from '@deckagent/deck'
import type { BriefDraft } from '@deckagent/deck'
import type { AgentRequest } from '@deckagent/host-contracts'
import type { SourceKind } from '../../../runs/index.ts'

type DeckCommand = NonNullable<AgentRequest['deck']>

export function emptyBriefDraft(): BriefDraft {
  return {
    requirements: [],
    answers: [],
    assumptions: [],
    sources: { material: false, modelKnowledge: false, publicResearch: false, refs: [] },
    images: { mode: 'none', attachmentIds: [], unmetRequirements: [] },
  }
}

const choiceIssue = (code: string, path: string, message: string, expected: string) => [
  { code, path, message, expected },
]

const throwChoice = (code: string, path: string, message: string, expected: string): never => {
  throw new DeckError(code, choiceIssue(code, path, message, expected))
}

export function assertBriefChoices(draft: BriefDraft, initial: BriefDraft, command: DeckCommand): void {
  if (
    command.formatChoice &&
    (draft.generationFormat !== 'html' || (draft.requestedFormat !== undefined && draft.requestedFormat !== 'html'))
  )
    throwChoice(
      'FORMAT_CHOICE_REQUIRED',
      'generationFormat',
      'The user selected HTML for this request.',
      'Use generationFormat html and canonical requestedFormat html.',
    )

  if (command.imageChoice && draft.images.mode !== command.imageChoice) throw new DeckError('IMAGE_CHOICE_REQUIRED')
  if ((draft.images.provider ?? 'tavily') !== (initial.images.provider ?? 'tavily'))
    throw new DeckError('IMAGE_CHOICE_REQUIRED')

  if (
    draft.template?.version === 1 &&
    command.imageProviderChoice === 'tavily' &&
    draft.images.mode === 'public-research'
  )
    throwChoice(
      'IMAGE_CHOICE_REQUIRED',
      'template',
      'Tavily candidate review requires HTML Basic version 2 or later. Keep the legacy Commons path only with an explicit Commons choice.',
      'Choose HTML Basic version 2 or later for Tavily, or Commons for the pinned legacy template.',
    )

  if (
    draft.images.mode === 'public-research' &&
    initial.images.mode !== 'public-research' &&
    command.imageChoice !== 'public-research'
  )
    throw new DeckError('IMAGE_CHOICE_REQUIRED')
  if (
    initial.requestedFormat &&
    initial.requestedFormat !== 'html' &&
    draft.requestedFormat !== initial.requestedFormat
  )
    throw new DeckError('FORMAT_CHOICE_REQUIRED')
  if (initial.images.mode === 'unavailable' && draft.images.mode !== 'unavailable' && !command.imageChoice)
    throw new DeckError('IMAGE_CHOICE_REQUIRED')

  if (
    ['material', 'modelKnowledge', 'publicResearch'].some(
      k =>
        Object.entries(initial.sources).find(([key]) => key === k)?.[1] !==
        Object.entries(draft.sources).find(([key]) => key === k)?.[1],
    )
  )
    throwChoice(
      'SOURCE_CHOICE_REQUIRED',
      'sources',
      'Source flags differ from the Host-admitted choices.',
      'Keep the three source flags from the supplied Brief context. A schema repair does not change permissions.',
    )
}

export function sourceKindsForBrief(brief: BriefDraft): readonly SourceKind[] {
  if (brief.sources.material) return ['workspace-files', 'attachments', 'research']
  return brief.sources.publicResearch ? ['research'] : []
}
