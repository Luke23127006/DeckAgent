import { fetchAuthorized, isRecord } from './http.mjs'
const id = v => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
const positive = v => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const invalid = () => {
  throw new Error('INVALID_GENERATION_RESPONSE')
}
function receipt(v, sessionId) {
  if (
    !isRecord(v) ||
    v.sessionId !== sessionId ||
    v.deckId !== sessionId ||
    !id(v.confirmationId) ||
    !id(v.outlineId) ||
    !id(v.briefId) ||
    !id(v.intentId) ||
    !id(v.requestId) ||
    !positive(v.outlineVersion) ||
    !positive(v.briefVersion) ||
    typeof v.fingerprint !== 'string' ||
    !/^[a-f0-9]{64}$/.test(v.fingerprint) ||
    typeof v.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(v.createdAt))
  )
    return invalid()
  return {
    sessionId,
    deckId: sessionId,
    confirmationId: v.confirmationId,
    outlineId: v.outlineId,
    briefId: v.briefId,
    intentId: v.intentId,
    requestId: v.requestId,
    outlineVersion: v.outlineVersion,
    briefVersion: v.briefVersion,
    fingerprint: v.fingerprint,
    createdAt: v.createdAt,
  }
}
export class ConfirmationClient {
  origin
  token
  constructor(origin, token) {
    this.origin = origin
    this.token = token
  }
  async confirm(sessionId, target) {
    const response = await fetchAuthorized(
      this.origin,
      this.token,
      `/api/sessions/${encodeURIComponent(sessionId)}/deck/confirm`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(target),
        signal: AbortSignal.timeout(15000),
      },
    )
    const v = await response.json()
    if (!response.ok) {
      const codes = [
        'CONFIRMATION_INVALID',
        'CONFIRMATION_CONFLICT',
        'GENERATION_UNAVAILABLE',
        'GENERATION_MODEL_CHANGED',
        'GENERATION_LINK_FAILED',
        'SOURCE_UNAVAILABLE',
        'BRIEF_STALE',
        'BRIEF_INCOMPLETE',
        'IMAGE_PREPARATION_REQUIRED',
        'DESIGN_LAYOUT_INCOMPATIBLE',
        'OUTLINE_STALE',
        'OUTLINE_ALREADY_CONFIRMED',
        'SESSION_BUSY',
        'REQUEST_NOT_SAVED',
        'NO_SELECTABLE_MODEL',
        'PROVIDER_KEY_UNAVAILABLE',
      ]
      throw new Error(
        response.status === 401
          ? 'AUTH_REQUIRED'
          : isRecord(v) && isRecord(v.error) && typeof v.error.code === 'string' && codes.includes(v.error.code)
            ? v.error.code
            : 'CONFIRMATION_UNAVAILABLE',
      )
    }
    if (!isRecord(v) || !isRecord(v.request)) return invalid()
    const r = receipt(v.receipt, sessionId),
      q = v.request
    const status = ['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted'].find(
      s => s === q.status,
    )
    if (
      !status ||
      q.sessionId !== sessionId ||
      q.requestId !== r.requestId ||
      typeof q.text !== 'string' ||
      typeof q.sequence !== 'number' ||
      !Number.isSafeInteger(q.sequence) ||
      q.sequence < 0 ||
      (q.errorCode !== undefined && (typeof q.errorCode !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(q.errorCode)))
    )
      return invalid()
    if (
      r.confirmationId !== target.confirmationId ||
      r.outlineId !== target.outlineId ||
      r.outlineVersion !== target.outlineVersion ||
      r.briefId !== target.briefId ||
      r.briefVersion !== target.briefVersion
    )
      return invalid()
    return {
      receipt: r,
      request: {
        requestId: r.requestId,
        sessionId,
        status,
        text: q.text,
        sequence: q.sequence,
        ...(typeof q.errorCode === 'string' ? { errorCode: q.errorCode } : {}),
      },
    }
  }
}
