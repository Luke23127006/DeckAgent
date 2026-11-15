import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { decodeDesignSnapshot } from '@deckagent/design'
import { DeckError, validId } from './contracts.ts'
import type { ConfirmationTarget, ConfirmationReceipt, GenerationSnapshot, BriefRecord } from './contracts.ts'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
export function validateConfirmation(value: unknown): ConfirmationTarget {
  if (
    !object(value) ||
    Object.keys(value).length !== 5 ||
    Object.keys(value).some(
      k => !['confirmationId', 'outlineId', 'outlineVersion', 'briefId', 'briefVersion'].includes(k),
    ) ||
    !validId(value.confirmationId) ||
    !validId(value.outlineId) ||
    !validId(value.briefId) ||
    !Number.isSafeInteger(value.outlineVersion) ||
    Number(value.outlineVersion) < 1 ||
    !Number.isSafeInteger(value.briefVersion) ||
    Number(value.briefVersion) < 1
  )
    throw new DeckError('CONFIRMATION_INVALID')
  return {
    confirmationId: value.confirmationId,
    outlineId: value.outlineId,
    outlineVersion: Number(value.outlineVersion),
    briefId: value.briefId,
    briefVersion: Number(value.briefVersion),
  }
}
export function sameConfirmation(a: ConfirmationTarget, b: ConfirmationTarget): boolean {
  return (
    a.confirmationId === b.confirmationId &&
    a.outlineId === b.outlineId &&
    a.outlineVersion === b.outlineVersion &&
    a.briefId === b.briefId &&
    a.briefVersion === b.briefVersion
  )
}

export class GenerationStorage {
  constructor(private readonly db: DatabaseSync) {}

  get(sessionId: string): GenerationSnapshot | null {
    const row = this.db.prepare('SELECT * FROM generation_intents WHERE session_id=?').get(sessionId)
    if (!row) return null
    try {
      const value: unknown = JSON.parse(String(row.payload))
      if (
        !object(value) ||
        !object(value.receipt) ||
        !object(value.selection) ||
        typeof value.selection.provider !== 'string' ||
        !value.selection.provider ||
        typeof value.selection.model !== 'string' ||
        !value.selection.model
      )
        throw new DeckError('DECK_CORRUPT')
      const r = value.receipt
      const target = validateConfirmation({
        confirmationId: r.confirmationId,
        outlineId: r.outlineId,
        outlineVersion: r.outlineVersion,
        briefId: r.briefId,
        briefVersion: r.briefVersion,
      })
      const design = decodeDesignSnapshot(value.design)
      if (
        r.sessionId !== sessionId ||
        r.deckId !== sessionId ||
        r.intentId !== row.intent_id ||
        r.requestId !== row.request_id ||
        !validId(r.intentId) ||
        !validId(r.requestId) ||
        r.fingerprint !== design.fingerprint ||
        typeof r.createdAt !== 'string' ||
        !Number.isFinite(Date.parse(r.createdAt))
      )
        throw new DeckError('DECK_CORRUPT')
      const state = (['pending', 'admitted', 'generating', 'generated', 'incomplete'] as const).find(
        s => s === row.state,
      )
      if (
        !state ||
        (row.started_at !== null &&
          (typeof row.started_at !== 'string' || !Number.isFinite(Date.parse(row.started_at))))
      )
        throw new DeckError('DECK_CORRUPT')
      return {
        receipt: {
          ...target,
          sessionId,
          deckId: sessionId,
          intentId: r.intentId,
          requestId: r.requestId,
          fingerprint: r.fingerprint,
          createdAt: r.createdAt,
        },
        state,
        startedAt: row.started_at === null ? null : String(row.started_at),
        formatLocked: row.started_at !== null,
        format: 'html',
        design,
        selection: { provider: value.selection.provider, model: value.selection.model },
      }
    } catch {
      throw new DeckError('DECK_CORRUPT')
    }
  }

  insert(
    sessionId: string,
    target: ConfirmationTarget,
    brief: BriefRecord,
    selection: GenerationSnapshot['selection'],
  ): ConfirmationReceipt {
    if (
      !brief.design ||
      typeof selection?.provider !== 'string' ||
      !selection.provider.trim() ||
      typeof selection.model !== 'string' ||
      !selection.model.trim()
    )
      throw new DeckError('CONFIRMATION_INVALID')
    const receipt: ConfirmationReceipt = {
      ...target,
      sessionId,
      deckId: sessionId,
      intentId: `intent-${randomUUID()}`,
      requestId: `req-${randomUUID()}`,
      fingerprint: brief.design.fingerprint,
      createdAt: new Date().toISOString(),
    }
    this.db.prepare("INSERT INTO generation_intents VALUES(?,?,?,'pending',NULL,?)").run(
      sessionId,
      receipt.intentId,
      receipt.requestId,
      JSON.stringify({
        receipt,
        design: brief.design,
        selection: { provider: selection.provider, model: selection.model },
      }),
    )
    return receipt
  }
}
