import type { ConfirmationReceipt, ConfirmationTarget, GenerationSnapshot } from '@deckagent/deck'
import type { ConfirmationResult } from '@deckagent/host-api'
import { isDesignSnapshot } from './brief-client.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const id = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
const invalid = (): never => {
  throw new Error('INVALID_GENERATION_RESPONSE')
}
function receipt(v: unknown, sessionId: string): ConfirmationReceipt {
  if (
    !object(v) ||
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
export function decodeGeneration(v: unknown, sessionId: string): GenerationSnapshot {
  if (
    !object(v) ||
    v.format !== 'html' ||
    !isDesignSnapshot(v.design) ||
    !object(v.selection) ||
    typeof v.selection.provider !== 'string' ||
    !v.selection.provider ||
    typeof v.selection.model !== 'string' ||
    !v.selection.model ||
    typeof v.formatLocked !== 'boolean' ||
    (v.startedAt !== null && (typeof v.startedAt !== 'string' || !Number.isFinite(Date.parse(v.startedAt))))
  )
    return invalid()
  const r = receipt(v.receipt, sessionId)
  const state = (['pending', 'admitted', 'generating', 'generated', 'incomplete'] as const).find(s => s === v.state)
  if (
    !state ||
    r.fingerprint !== v.design.fingerprint ||
    v.formatLocked !== (v.startedAt !== null) ||
    (['pending', 'admitted'].includes(state) && v.startedAt !== null) ||
    (['generating', 'generated'].includes(state) && v.startedAt === null)
  )
    return invalid()
  return {
    receipt: r,
    state,
    format: 'html',
    design: v.design,
    formatLocked: v.formatLocked,
    startedAt: v.startedAt,
    selection: { provider: v.selection.provider, model: v.selection.model },
  }
}

export class ConfirmationClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}
  async confirm(sessionId: string, target: ConfirmationTarget): Promise<ConfirmationResult> {
    const response = await fetch(`${this.origin}/api/sessions/${encodeURIComponent(sessionId)}/deck/confirm`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(target),
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    const v: unknown = await response.json()
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
          : object(v) && object(v.error) && typeof v.error.code === 'string' && codes.includes(v.error.code)
            ? v.error.code
            : 'CONFIRMATION_UNAVAILABLE',
      )
    }
    if (!object(v) || !object(v.request)) return invalid()
    const r = receipt(v.receipt, sessionId),
      q = v.request
    const status = (['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted'] as const).find(
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
