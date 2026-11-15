import type { BriefDraft, BriefSourceRef, DesignSnapshot } from '@deckagent/deck'
import type { BriefView } from '@deckagent/host-api'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)
const only = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every(k => keys.includes(k))
const reference = (v: unknown) =>
  object(v) && only(v, ['id', 'version']) && text(v.id) && integer(v.version) && v.version > 0
const source = (v: unknown): v is BriefSourceRef =>
  object(v) &&
  only(v, ['sourceId', 'version', 'kind']) &&
  typeof v.sourceId === 'string' &&
  /^src-[a-f0-9-]{36}$/.test(v.sourceId) &&
  integer(v.version) &&
  v.version > 0 &&
  ['attachment', 'project-file', 'approved-file', 'research'].some(k => k === v.kind)
const topics = [
  'topic',
  'audience',
  'duration',
  'purpose',
  'sources',
  'language',
  'images',
  'format',
  'template',
  'design-system',
]
const colors = [
  'color.background',
  'color.surface',
  'color.text',
  'color.muted',
  'color.accent',
  'color.onAccent',
  'color.border',
]
const fonts = ['font.heading', 'font.body']
const numbers = ['type.display', 'type.heading', 'type.body', 'type.caption', 'space.unit', 'type.lineHeight']
function theme(v: unknown, partial = false): boolean {
  if (!object(v) || !only(v, [...colors, ...fonts, ...numbers])) return false
  if (!partial && Object.keys(v).length !== colors.length + fonts.length + numbers.length) return false
  return Object.entries(v).every(([k, value]) =>
    colors.includes(k)
      ? typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value)
      : fonts.includes(k)
        ? text(value)
        : typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
}
export function isDesignSnapshot(v: unknown): v is DesignSnapshot {
  return (
    object(v) &&
    only(v, ['format', 'designSystem', 'template', 'theme', 'rules', 'brandAssets', 'viewport', 'fingerprint']) &&
    v.format === 'html' &&
    reference(v.designSystem) &&
    reference(v.template) &&
    theme(v.theme) &&
    strings(v.rules) &&
    Array.isArray(v.brandAssets) &&
    v.brandAssets.length === 0 &&
    object(v.viewport) &&
    only(v.viewport, ['width', 'height']) &&
    v.viewport.width === 1280 &&
    v.viewport.height === 720 &&
    typeof v.fingerprint === 'string' &&
    /^[a-f0-9]{64}$/.test(v.fingerprint)
  )
}
function draft(v: unknown): v is BriefDraft {
  if (
    !object(v) ||
    !only(v, [
      'topic',
      'audience',
      'durationMinutes',
      'purpose',
      'language',
      'requirements',
      'answers',
      'assumptions',
      'sources',
      'images',
      'proposedSlideCount',
      'requestedFormat',
      'generationFormat',
      'template',
      'designSystem',
      'themeOverrides',
    ])
  )
    return false
  if (
    ['topic', 'audience', 'purpose', 'language', 'requestedFormat'].some(k => v[k] !== undefined && !text(v[k])) ||
    (v.durationMinutes !== undefined &&
      (typeof v.durationMinutes !== 'number' || !Number.isFinite(v.durationMinutes) || v.durationMinutes <= 0)) ||
    (v.proposedSlideCount !== undefined && (!integer(v.proposedSlideCount) || v.proposedSlideCount < 1))
  )
    return false
  if (
    !strings(v.requirements) ||
    !strings(v.assumptions) ||
    !Array.isArray(v.answers) ||
    !v.answers.every(
      a => object(a) && only(a, ['topic', 'value']) && topics.some(k => k === a.topic) && text(a.value),
    ) ||
    new Set(v.answers.map(a => a.topic)).size !== v.answers.length
  )
    return false
  const s = v.sources,
    i = v.images
  if (
    !object(s) ||
    !only(s, ['material', 'modelKnowledge', 'publicResearch', 'refs']) ||
    ['material', 'modelKnowledge', 'publicResearch'].some(k => typeof s[k] !== 'boolean') ||
    !Array.isArray(s.refs) ||
    !s.refs.every(source) ||
    new Set(s.refs.map(r => `${r.sourceId}:${r.version}:${r.kind}`)).size !== s.refs.length ||
    s.refs.some(r => (r.kind === 'research' ? !s.material && !s.publicResearch : !s.material))
  )
    return false
  if (
    !object(i) ||
    !only(i, ['mode', 'attachmentIds', 'unmetRequirements']) ||
    !['none', 'attachments', 'unavailable'].some(k => k === i.mode) ||
    !Array.isArray(i.attachmentIds) ||
    !i.attachmentIds.every(id => typeof id === 'string' && /^att-[a-f0-9-]{36}$/.test(id)) ||
    new Set(i.attachmentIds).size !== i.attachmentIds.length ||
    !strings(i.unmetRequirements) ||
    (i.mode !== 'attachments' && i.attachmentIds.length > 0) ||
    (i.mode === 'attachments' && !s.material) ||
    (i.mode === 'unavailable' && !i.unmetRequirements.length)
  )
    return false
  return (
    (v.generationFormat === undefined || v.generationFormat === 'html') &&
    !(v.requestedFormat !== undefined && v.requestedFormat !== 'html' && v.generationFormat !== undefined) &&
    (v.template === undefined || reference(v.template)) &&
    (v.designSystem === undefined || reference(v.designSystem)) &&
    (v.themeOverrides === undefined || theme(v.themeOverrides, true))
  )
}

/** Browser-safe structural decoding; selection policy, source access and snapshot integrity belong to Host. */
export function decodeBriefView(v: unknown, sessionId: string): BriefView {
  const invalid = (): never => {
    throw new Error('INVALID_RESPONSE')
  }
  if (
    !object(v) ||
    !only(v, ['sessionId', 'version', 'current', 'locked', 'sourceStates']) ||
    v.sessionId !== sessionId ||
    !integer(v.version) ||
    typeof v.locked !== 'boolean' ||
    !Array.isArray(v.sourceStates)
  )
    return invalid()
  const c = v.current
  if (c === null) {
    if (v.version !== 0 || v.sourceStates.length) return invalid()
    return { sessionId, version: 0, current: null, locked: v.locked, sourceStates: [] }
  }
  if (
    !object(c) ||
    !only(c, ['sessionId', 'briefId', 'version', 'createdAt', 'draft', 'design']) ||
    c.sessionId !== sessionId ||
    typeof c.briefId !== 'string' ||
    !/^brief-[a-f0-9-]{36}$/.test(c.briefId) ||
    c.version !== v.version ||
    !v.version ||
    typeof c.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(c.createdAt)) ||
    !draft(c.draft) ||
    (c.design !== null && !isDesignSnapshot(c.design)) ||
    (c.draft.generationFormat === 'html') !== (c.design !== null)
  )
    return invalid()
  const refs = c.draft.sources.refs
  if (v.sourceStates.length !== refs.length) return invalid()
  const sourceStates = v.sourceStates.map((state: unknown, index) => {
    const ref = refs[index]!
    if (
      !object(state) ||
      !only(state, ['source', 'status']) ||
      !source(state.source) ||
      !['recorded', 'unavailable'].some(k => k === state.status) ||
      state.source.sourceId !== ref.sourceId ||
      state.source.version !== ref.version ||
      state.source.kind !== ref.kind
    )
      return invalid()
    return {
      source: state.source,
      status: state.status === 'recorded' ? ('recorded' as const) : ('unavailable' as const),
    }
  })
  return {
    sessionId,
    version: v.version,
    locked: v.locked,
    current: {
      sessionId,
      briefId: c.briefId,
      version: v.version,
      createdAt: c.createdAt,
      draft: c.draft,
      design: c.design,
    },
    sourceStates,
  }
}

export class BriefClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(
    sessionId: string,
    version?: number,
    input?: { expectedVersion: number; draft: BriefDraft },
  ): Promise<BriefView> {
    const response = await fetch(
      `${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/brief${version === undefined ? '' : `/versions/${version}`}`,
      {
        method: input ? 'PUT' : 'GET',
        headers: { authorization: `Bearer ${this.token}`, ...(input ? { 'content-type': 'application/json' } : {}) },
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        ...(input ? { body: JSON.stringify(input) } : {}),
      },
    )
    if (!response.ok) {
      if (response.status === 401) throw new Error('AUTH_REQUIRED')
      const value: unknown = await response.json().catch(() => null)
      const codes = [
        'BRIEF_INVALID',
        'BRIEF_STALE',
        'BRIEF_LOCKED',
        'BRIEF_NOT_FOUND',
        'SESSION_BUSY',
        'SESSION_NOT_FOUND',
        'SOURCE_NOT_FOUND',
        'DESIGN_FORMAT_UNAVAILABLE',
        'DESIGN_TEMPLATE_NOT_FOUND',
        'DESIGN_SYSTEM_NOT_FOUND',
        'DESIGN_THEME_INVALID',
        'DESIGN_FONT_UNAVAILABLE',
      ]
      throw new Error(
        object(value) && object(value.error) && typeof value.error.code === 'string' && codes.includes(value.error.code)
          ? value.error.code
          : 'BRIEF_UNAVAILABLE',
      )
    }
    const view = decodeBriefView(await response.json(), sessionId)
    if (version !== undefined && view.version !== version) throw new Error('INVALID_RESPONSE')
    return view
  }

  snapshot(sessionId: string, version?: number): Promise<BriefView> {
    return this.request(sessionId, version)
  }
  save(sessionId: string, expectedVersion: number, draft: BriefDraft): Promise<BriefView> {
    return this.request(sessionId, undefined, { expectedVersion, draft })
  }

  async interview(sessionId: string): Promise<{ brief: BriefView; state: import('@deckagent/deck').InterviewState }> {
    const response = await fetch(`${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/interview`, {
      headers: { authorization: `Bearer ${this.token}` },
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'BRIEF_UNAVAILABLE')
    const value: unknown = await response.json()
    if (!object(value) || !object(value.state)) throw new Error('INVALID_RESPONSE')
    const s = value.state
    if (
      !Array.isArray(s.questions) ||
      !Array.isArray(s.blockers) ||
      typeof s.readyForOutline !== 'boolean' ||
      typeof s.skipAllowed !== 'boolean' ||
      !text(s.notice)
    )
      throw new Error('INVALID_RESPONSE')
    const questions = s.questions.map((q: unknown) => {
      if (!object(q) || !text(q.prompt) || !strings(q.suggestions) || typeof q.required !== 'boolean')
        throw new Error('INVALID_RESPONSE')
      const topic = (
        [
          'topic',
          'audience',
          'duration',
          'purpose',
          'sources',
          'language',
          'images',
          'format',
          'template',
          'design-system',
        ] as const
      ).find(t => t === q.topic)
      if (!topic) throw new Error('INVALID_RESPONSE')
      return { topic, prompt: q.prompt, suggestions: q.suggestions, required: q.required }
    })
    const blockers = s.blockers.map((b: unknown) => {
      if (!object(b) || !text(b.code) || !text(b.message)) throw new Error('INVALID_RESPONSE')
      return { code: b.code, message: b.message }
    })
    if (
      (s.readyForOutline && (questions.length || blockers.length)) ||
      new Set(questions.map(q => q.topic)).size !== questions.length
    )
      throw new Error('INVALID_RESPONSE')
    return {
      brief: decodeBriefView(value.brief, sessionId),
      state: { questions, blockers, readyForOutline: s.readyForOutline, skipAllowed: s.skipAllowed, notice: s.notice },
    }
  }
}
