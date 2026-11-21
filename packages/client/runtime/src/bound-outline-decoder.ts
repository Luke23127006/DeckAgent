import type { OutlineProposal, BriefSourceRef, ContentBlock } from '@deckagent/deck'
import { decodeBriefView } from './brief-client.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const id = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))
const invalid = (): never => {
  throw new Error('INVALID_RESPONSE')
}
function block(v: unknown): ContentBlock {
  if (!object(v)) return invalid()
  if (
    ['subtitle', 'lead', 'text', 'source-note'].some(k => k === v.kind) &&
    text(v.text) &&
    only(v, ['kind', 'text'])
  ) {
    const kind = (['subtitle', 'lead', 'text', 'source-note'] as const).find(k => k === v.kind)
    if (!kind) return invalid()
    return { kind, text: v.text }
  }
  if (v.kind === 'bullets' && only(v, ['kind', 'items']) && strings(v.items) && v.items.length)
    return { kind: 'bullets', items: v.items }
  if (
    v.kind === 'web-image' &&
    only(v, ['kind', 'query', 'caption', 'required']) &&
    text(v.query) &&
    v.query.length <= 500 &&
    (v.caption === undefined || text(v.caption)) &&
    (v.required === undefined || typeof v.required === 'boolean')
  )
    return {
      kind: 'web-image',
      query: v.query,
      ...(typeof v.caption === 'string' ? { caption: v.caption } : {}),
      ...(typeof v.required === 'boolean' ? { required: v.required } : {}),
    }
  if (
    v.kind === 'image' &&
    only(v, ['kind', 'attachmentId', 'caption']) &&
    typeof v.attachmentId === 'string' &&
    /^att-[a-f0-9-]{36}$/.test(v.attachmentId) &&
    (v.caption === undefined || text(v.caption))
  )
    return {
      kind: 'image',
      attachmentId: v.attachmentId,
      ...(typeof v.caption === 'string' ? { caption: v.caption } : {}),
    }
  if (v.kind === 'columns' && only(v, ['kind', 'columns']) && Array.isArray(v.columns) && v.columns.length)
    return {
      kind: 'columns',
      columns: v.columns.map((c: unknown) => {
        if (!object(c) || !only(c, ['bullets']) || !strings(c.bullets) || !c.bullets.length) return invalid()
        return { bullets: c.bullets }
      }),
    }
  if (v.kind === 'metrics' && only(v, ['kind', 'items']) && Array.isArray(v.items) && v.items.length)
    return {
      kind: 'metrics',
      items: v.items.map((m: unknown) => {
        if (!object(m) || !only(m, ['value', 'label']) || !text(m.value) || !text(m.label)) return invalid()
        return { value: m.value, label: m.label }
      }),
    }
  return invalid()
}
function source(v: unknown): BriefSourceRef {
  if (
    !object(v) ||
    !only(v, ['sourceId', 'version', 'kind']) ||
    typeof v.sourceId !== 'string' ||
    !/^src-[a-f0-9-]{36}$/.test(v.sourceId) ||
    typeof v.version !== 'number' ||
    !Number.isSafeInteger(v.version) ||
    v.version < 1
  )
    return invalid()
  const kind = (['attachment', 'project-file', 'approved-file', 'research'] as const).find(k => k === v.kind)
  if (!kind) return invalid()
  return { sourceId: v.sourceId, version: v.version, kind }
}

/** Additive decoder; legacy proposals retain their original contract. */
export function decodeBoundProposal(v: Record<string, unknown>, sessionId: string): OutlineProposal {
  if (
    !id(v.outlineId) ||
    !id(v.requestId) ||
    typeof v.version !== 'number' ||
    !Number.isSafeInteger(v.version) ||
    v.version < 1 ||
    typeof v.responseIndex !== 'number' ||
    !Number.isSafeInteger(v.responseIndex) ||
    v.responseIndex < 0 ||
    !text(v.overview) ||
    !Array.isArray(v.slides) ||
    !v.slides.length ||
    !strings(v.revisionSuggestions) ||
    !object(v.brief) ||
    !object(v.brief.draft) ||
    !object(v.brief.draft.sources) ||
    !Array.isArray(v.brief.draft.sources.refs) ||
    !object(v.changes)
  )
    return invalid()
  const status = (['current', 'superseded', 'confirmed'] as const).find(k => k === v.status)
  if (
    !status ||
    typeof v.changes.orderChanged !== 'boolean' ||
    typeof v.changes.overviewChanged !== 'boolean' ||
    typeof v.changes.suggestionsChanged !== 'boolean' ||
    !strings(v.changes.briefFields) ||
    !strings(v.changes.added) ||
    !strings(v.changes.removed) ||
    !strings(v.changes.changed) ||
    (v.previousOutlineId !== undefined && !id(v.previousOutlineId)) ||
    (v.restoredFrom !== undefined && !id(v.restoredFrom))
  )
    return invalid()
  const brief = decodeBriefView(
    {
      sessionId,
      version: v.brief.version,
      current: v.brief,
      locked: false,
      sourceStates: v.brief.draft.sources.refs.map(source => ({ source, status: 'recorded' })),
    },
    sessionId,
  ).current
  if (!brief) return invalid()
  const slides = v.slides.map((s: unknown) => {
    if (
      !object(s) ||
      !id(s.slideId) ||
      !text(s.title) ||
      !text(s.content) ||
      !Array.isArray(s.blocks) ||
      !Array.isArray(s.sources)
    )
      return invalid()
    const sources = s.sources.map(source)
    if (
      sources.some(
        r =>
          !brief.draft.sources.refs.some(
            b => b.sourceId === r.sourceId && b.version === r.version && b.kind === r.kind,
          ),
      )
    )
      return invalid()
    return { slideId: s.slideId, title: s.title, content: s.content, blocks: s.blocks.map(block), sources }
  })
  if (new Set(slides.map(s => s.slideId)).size !== slides.length) return invalid()
  return {
    outlineId: v.outlineId,
    requestId: v.requestId,
    version: v.version,
    responseIndex: v.responseIndex,
    overview: v.overview,
    status,
    slides,
    brief,
    revisionSuggestions: v.revisionSuggestions,
    changes: {
      overviewChanged: v.changes.overviewChanged,
      suggestionsChanged: v.changes.suggestionsChanged,
      briefFields: v.changes.briefFields,
      added: v.changes.added,
      removed: v.changes.removed,
      changed: v.changes.changed,
      orderChanged: v.changes.orderChanged,
    },
    ...(typeof v.previousOutlineId === 'string' ? { previousOutlineId: v.previousOutlineId } : {}),
    ...(typeof v.restoredFrom === 'string' ? { restoredFrom: v.restoredFrom } : {}),
  }
}
