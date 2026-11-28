import { decodeBriefView } from '@deckagent/host-contracts'
import { fetchAuthorized, isRecord } from './http.mjs'
const text = v => typeof v === 'string' && !!v.trim() && v.isWellFormed()
const strings = v => Array.isArray(v) && v.every(text)
export class BriefClient {
  origin
  token
  constructor(origin, token) {
    this.origin = origin
    this.token = token
  }
  async request(sessionId, version, input) {
    const response = await fetchAuthorized(
      this.origin,
      this.token,
      `/api/sessions/${encodeURIComponent(sessionId)}/brief${version === undefined ? '' : `/versions/${version}`}`,
      {
        method: input ? 'PUT' : 'GET',
        headers: input ? { 'content-type': 'application/json' } : {},
        signal: AbortSignal.timeout(15000),
        ...(input ? { body: JSON.stringify(input) } : {}),
      },
    )
    if (!response.ok) {
      if (response.status === 401) throw new Error('AUTH_REQUIRED')
      const value = await response.json().catch(() => null)
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
        isRecord(value) &&
          isRecord(value.error) &&
          typeof value.error.code === 'string' &&
          codes.includes(value.error.code)
          ? value.error.code
          : 'BRIEF_UNAVAILABLE',
      )
    }
    const view = decodeBriefView(await response.json(), sessionId)
    if (version !== undefined && view.version !== version) throw new Error('INVALID_RESPONSE')
    return view
  }
  snapshot(sessionId, version) {
    return this.request(sessionId, version)
  }
  save(sessionId, expectedVersion, draft) {
    return this.request(sessionId, undefined, { expectedVersion, draft })
  }
  async interview(sessionId) {
    const response = await fetchAuthorized(
      this.origin,
      this.token,
      `/api/sessions/${encodeURIComponent(sessionId)}/interview`,
      { signal: AbortSignal.timeout(15000) },
    )
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'BRIEF_UNAVAILABLE')
    const value = await response.json()
    if (!isRecord(value) || !isRecord(value.state)) throw new Error('INVALID_RESPONSE')
    const s = value.state
    if (
      !Array.isArray(s.questions) ||
      !Array.isArray(s.blockers) ||
      typeof s.readyForOutline !== 'boolean' ||
      typeof s.skipAllowed !== 'boolean' ||
      !text(s.notice)
    )
      throw new Error('INVALID_RESPONSE')
    const questions = s.questions.map(q => {
      if (!isRecord(q) || !text(q.prompt) || !strings(q.suggestions) || typeof q.required !== 'boolean')
        throw new Error('INVALID_RESPONSE')
      const topic = [
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
      ].find(t => t === q.topic)
      if (!topic) throw new Error('INVALID_RESPONSE')
      return { topic, prompt: q.prompt, suggestions: q.suggestions, required: q.required }
    })
    const blockers = s.blockers.map(b => {
      if (!isRecord(b) || !text(b.code) || !text(b.message)) throw new Error('INVALID_RESPONSE')
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
