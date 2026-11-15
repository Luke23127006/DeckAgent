import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { validateContentPlan } from '@deckagent/design'
import { DeckError, validId } from './contracts.ts'
import type {
  BoundOutlineDraft,
  BoundOutlineInput,
  BriefRecord,
  OutlineProposal,
  OutlineChanges,
  OutlineSnapshot,
} from './contracts.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))

export function validateBoundOutline(value: unknown): BoundOutlineDraft {
  const invalid = (): never => {
    throw new DeckError('OUTLINE_INVALID')
  }
  if (
    !object(value) ||
    !only(value, ['overview', 'slides', 'revisionSuggestions']) ||
    !text(value.overview) ||
    !Array.isArray(value.revisionSuggestions) ||
    !value.revisionSuggestions.every(text) ||
    !Array.isArray(value.slides) ||
    !value.slides.length
  )
    return invalid()
  try {
    if (Buffer.byteLength(JSON.stringify(value)) > 128 * 1024) return invalid()
  } catch {
    return invalid()
  }
  const slides = value.slides.map((s: unknown) => {
    if (
      !object(s) ||
      !only(s, ['slideId', 'title', 'content', 'blocks', 'sources']) ||
      (s.slideId !== undefined && !validId(s.slideId)) ||
      !text(s.title) ||
      !text(s.content) ||
      !Array.isArray(s.sources)
    )
      return invalid()
    const content = validateContentPlan({ title: s.title, blocks: s.blocks })
    const kinds = ['attachment', 'project-file', 'approved-file', 'research'] as const
    const sources = s.sources.map((r: unknown) => {
      if (
        !object(r) ||
        !only(r, ['sourceId', 'version', 'kind']) ||
        typeof r.sourceId !== 'string' ||
        !/^src-[a-f0-9-]{36}$/.test(r.sourceId) ||
        !Number.isSafeInteger(r.version) ||
        Number(r.version) < 1
      )
        return invalid()
      const kind = kinds.find(k => k === r.kind)
      if (!kind) return invalid()
      return { sourceId: r.sourceId, version: Number(r.version), kind }
    })
    if (new Set(sources.map(r => `${r.sourceId}:${r.version}`)).size !== sources.length) return invalid()
    return {
      ...(typeof s.slideId === 'string' ? { slideId: s.slideId } : {}),
      title: content.title,
      content: s.content,
      blocks: content.blocks,
      sources,
    }
  })
  return { overview: value.overview, revisionSuggestions: [...value.revisionSuggestions], slides }
}

export function outlineChanges(
  previous: OutlineProposal | undefined,
  brief: BriefRecord,
  slides: OutlineProposal['slides'],
  overview: string,
  suggestions: readonly string[],
): OutlineChanges {
  const before = previous?.brief?.draft
  const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(brief.draft)])
  const a = before ? Object.entries(before) : []
  const b = Object.entries(brief.draft)
  const prior = previous?.slides ?? []
  const content = (s: OutlineProposal['slides'][number]) =>
    JSON.stringify({ title: s.title, content: s.content, blocks: s.blocks, sources: s.sources })
  const retainedBefore = prior.filter(s => slides.some(n => n.slideId === s.slideId)).map(s => s.slideId)
  const retainedAfter = slides.filter(s => prior.some(n => n.slideId === s.slideId)).map(s => s.slideId)
  return {
    overviewChanged: previous?.overview !== overview,
    suggestionsChanged: JSON.stringify(previous?.revisionSuggestions ?? []) !== JSON.stringify(suggestions),
    briefFields: [...fields]
      .filter(
        k => JSON.stringify(a.find(([key]) => key === k)?.[1]) !== JSON.stringify(b.find(([key]) => key === k)?.[1]),
      )
      .sort(),
    added: slides.filter(s => !prior.some(p => p.slideId === s.slideId)).map(s => s.slideId),
    removed: prior.filter(s => !slides.some(p => p.slideId === s.slideId)).map(s => s.slideId),
    changed: slides
      .filter(s => {
        const p = prior.find(p => p.slideId === s.slideId)
        return p && content(p) !== content(s)
      })
      .map(s => s.slideId),
    orderChanged: JSON.stringify(retainedBefore) !== JSON.stringify(retainedAfter),
  }
}

/** Runs inside DeckService's transaction; no Session storage or model transport dependency. */
export function saveBoundOutline(
  db: DatabaseSync,
  sessionId: string,
  input: BoundOutlineInput,
  brief: BriefRecord,
  state: OutlineSnapshot,
): OutlineProposal {
  if (!validId(input.requestId) || !Number.isSafeInteger(input.responseIndex) || input.responseIndex < 0)
    throw new DeckError('OUTLINE_INVALID')
  if (state.confirmedId || db.prepare('SELECT 1 FROM decks WHERE session_id=?').get(sessionId))
    throw new DeckError('OUTLINE_READ_ONLY')
  if (brief.briefId !== input.expectedBrief.briefId || brief.version !== input.expectedBrief.version)
    throw new DeckError('BRIEF_STALE')
  const previous = state.proposals.find(p => p.outlineId === state.currentId)
  if (
    input.expectedOutline === null
      ? !!previous
      : !previous ||
        previous.outlineId !== input.expectedOutline.outlineId ||
        previous.version !== input.expectedOutline.version
  )
    throw new DeckError('OUTLINE_STALE')
  if (state.proposals.some(p => p.requestId === input.requestId)) throw new DeckError('OUTLINE_REQUEST_CONFLICT')
  if (
    !brief.draft.topic ||
    brief.draft.generationFormat !== 'html' ||
    !brief.design ||
    (!brief.draft.sources.refs.length && !brief.draft.sources.modelKnowledge && !brief.draft.sources.publicResearch) ||
    brief.draft.images.mode === 'unavailable' ||
    (brief.draft.images.mode === 'attachments' && !brief.draft.images.attachmentIds.length)
  )
    throw new DeckError('BRIEF_INCOMPLETE')
  const draft = validateBoundOutline(input.draft)
  if (brief.draft.proposedSlideCount !== undefined && brief.draft.proposedSlideCount !== draft.slides.length)
    throw new DeckError('OUTLINE_SLIDE_COUNT_MISMATCH')
  const known = new Set(state.proposals.flatMap(p => p.slides.map(s => s.slideId)))
  const slides = draft.slides.map(s => {
    if (s.slideId && !known.has(s.slideId)) throw new DeckError('OUTLINE_SLIDE_NOT_FOUND')
    if (
      s.sources.some(
        r =>
          !brief.draft.sources.refs.some(
            k => k.sourceId === r.sourceId && k.version === r.version && k.kind === r.kind,
          ),
      )
    )
      throw new DeckError('OUTLINE_SOURCE_NOT_FOUND')
    if (s.blocks.some(b => b.kind === 'image' && !brief.draft.images.attachmentIds.includes(b.attachmentId)))
      throw new DeckError('OUTLINE_SOURCE_NOT_FOUND')
    return { ...s, slideId: s.slideId ?? `slide-${randomUUID()}` }
  })
  if (new Set(slides.map(s => s.slideId)).size !== slides.length) throw new DeckError('OUTLINE_INVALID')
  if (input.restoredFrom && !state.proposals.some(p => p.outlineId === input.restoredFrom))
    throw new DeckError('OUTLINE_NOT_FOUND')
  const proposal: OutlineProposal = {
    outlineId: randomUUID(),
    version: state.version + 1,
    requestId: input.requestId,
    responseIndex: input.responseIndex,
    overview: draft.overview,
    slides,
    status: 'current',
    brief,
    revisionSuggestions: draft.revisionSuggestions,
    changes: outlineChanges(previous, brief, slides, draft.overview, draft.revisionSuggestions),
    ...(previous ? { previousOutlineId: previous.outlineId } : {}),
    ...(input.restoredFrom ? { restoredFrom: input.restoredFrom } : {}),
  }
  db.prepare('INSERT INTO outline_proposals VALUES(?,?,?,?,?,?,0)').run(
    sessionId,
    proposal.outlineId,
    proposal.version,
    input.requestId,
    input.responseIndex,
    JSON.stringify({ overview: draft.overview, slides: slides.map(s => ({ title: s.title, content: s.content })) }),
  )
  db.prepare('INSERT INTO outline_details VALUES(?,?,?)').run(
    sessionId,
    proposal.outlineId,
    JSON.stringify({ ...proposal, brief: { briefId: brief.briefId, version: brief.version } }),
  )
  db.prepare(
    'INSERT INTO outline_heads VALUES(?,?,?,NULL) ON CONFLICT(session_id) DO UPDATE SET version=excluded.version,current_id=excluded.current_id',
  ).run(sessionId, proposal.version, proposal.outlineId)
  return proposal
}
