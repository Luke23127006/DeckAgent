import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { decodeDesignSnapshot } from '@deckagent/design'
import { DeckError, isRecord, validId } from './errors.ts'
import type { BriefRecord } from './brief-contracts.ts'
import type {
  ConfirmationTarget,
  ConfirmationReceipt,
  GenerationGrant,
  GenerationSnapshot,
} from './generation-contracts.ts'

export function validateConfirmation(value: unknown): ConfirmationTarget {
  if (
    !isRecord(value) ||
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

export function deckVersion(db: DatabaseSync, sessionId: string): number {
  const row = db.prepare('SELECT version FROM decks WHERE session_id=?').get(sessionId)
  if (!row) throw new DeckError('DECK_CORRUPT')
  return Number(row.version)
}

export class GenerationStorage {
  constructor(private readonly db: DatabaseSync) {}

  get(sessionId: string): GenerationSnapshot | null {
    const row = this.db.prepare('SELECT * FROM generation_intents WHERE session_id=?').get(sessionId)
    if (!row) return null
    try {
      const value: unknown = JSON.parse(String(row.payload))
      if (
        !isRecord(value) ||
        !isRecord(value.receipt) ||
        !isRecord(value.selection) ||
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
        (value.activeRequestId !== undefined && !validId(value.activeRequestId)) ||
        (row.started_at !== null &&
          (typeof row.started_at !== 'string' || !Number.isFinite(Date.parse(row.started_at))))
      )
        throw new DeckError('DECK_CORRUPT')
      return {
        ...(typeof value.activeRequestId === 'string' ? { activeRequestId: value.activeRequestId } : {}),
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

  continueActive(
    sessionId: string,
    requestId: string,
    selection: GenerationSnapshot['selection'],
    activeRequest?: (sessionId: string, requestId: string) => boolean,
  ): number {
    const generation = this.get(sessionId)
    if (!generation) throw new DeckError('GENERATION_NOT_FOUND')
    if (generation.state !== 'incomplete') throw new DeckError('GENERATION_ALREADY_STARTED')
    if (!activeRequest?.(sessionId, requestId)) throw new DeckError('GENERATION_REQUEST_INACTIVE')
    if (!selection.provider || !selection.model) throw new DeckError('CONFIRMATION_INVALID')

    const row = this.db.prepare('SELECT payload FROM generation_intents WHERE session_id=?').get(sessionId)
    if (!row) throw new DeckError('GENERATION_NOT_FOUND')

    const payload: unknown = JSON.parse(String(row.payload))
    if (!isRecord(payload)) throw new DeckError('DECK_CORRUPT')

    this.db
      .prepare("UPDATE generation_intents SET state='admitted',payload=? WHERE session_id=?")
      .run(JSON.stringify({ ...payload, activeRequestId: requestId, selection }), sessionId)

    this.db.prepare('UPDATE decks SET version=version+1 WHERE session_id=?').run(sessionId)
    return deckVersion(this.db, sessionId)
  }

  admit(
    sessionId: string,
    intentId: string,
    requestId: string,
    activeRequest?: (sessionId: string, requestId: string) => boolean,
  ): number {
    const g = this.get(sessionId)
    if (!g || g.receipt.intentId !== intentId || (g.activeRequestId ?? g.receipt.requestId) !== requestId)
      throw new DeckError('GENERATION_NOT_FOUND')
    if (!activeRequest?.(sessionId, requestId)) throw new DeckError('GENERATION_REQUEST_INACTIVE')
    if (g.state !== 'pending') throw new DeckError('GENERATION_ALREADY_ADMITTED')
    this.db.prepare("UPDATE generation_intents SET state='admitted' WHERE session_id=?").run(sessionId)
    this.db.prepare('UPDATE decks SET version=version+1 WHERE session_id=?').run(sessionId)
    return deckVersion(this.db, sessionId)
  }

  start(
    sessionId: string,
    intentId: string,
    requestId: string,
    activeRequest?: (sessionId: string, requestId: string) => boolean,
  ): { readonly grant: GenerationGrant; readonly version: number } {
    if (!activeRequest?.(sessionId, requestId)) throw new DeckError('GENERATION_REQUEST_INACTIVE')

    const g = this.get(sessionId)
    if (!g || g.receipt.intentId !== intentId || (g.activeRequestId ?? g.receipt.requestId) !== requestId)
      throw new DeckError('GENERATION_NOT_FOUND')
    if (g.state !== 'admitted' || (g.startedAt && !g.activeRequestId)) throw new DeckError('GENERATION_ALREADY_STARTED')

    this.db
      .prepare("UPDATE generation_intents SET state='generating',started_at=COALESCE(started_at,?) WHERE session_id=?")
      .run(new Date().toISOString(), sessionId)

    this.db.prepare('UPDATE decks SET version=version+1 WHERE session_id=?').run(sessionId)
    return { grant: Object.freeze({ sessionId, intentId, requestId }), version: deckVersion(this.db, sessionId) }
  }

  finish(
    sessionId: string,
    intentId: string,
    requestId: string,
    outcome: 'completed' | 'failed' | 'stopped' | 'interrupted',
  ): number | null {
    const g = this.get(sessionId)
    if (!g || g.receipt.intentId !== intentId || (g.activeRequestId ?? g.receipt.requestId) !== requestId)
      throw new DeckError('GENERATION_NOT_FOUND')
    if (g.state === 'generated' || g.state === 'incomplete') return null

    const unfinished = this.db.prepare('SELECT 1 FROM slides WHERE session_id=? AND revision=0').get(sessionId)

    this.db
      .prepare('UPDATE generation_intents SET state=? WHERE session_id=?')
      .run(outcome === 'completed' && g.startedAt && !unfinished ? 'generated' : 'incomplete', sessionId)

    this.db.prepare('UPDATE decks SET version=version+1 WHERE session_id=?').run(sessionId)
    return deckVersion(this.db, sessionId)
  }

  reconcile(requestExists?: (sessionId: string, requestId: string) => boolean): void {
    for (const row of this.db
      .prepare(
        "SELECT session_id,request_id,state FROM generation_intents WHERE state IN ('pending','admitted','generating')",
      )
      .all()) {
      if (row.state === 'pending' && !requestExists?.(String(row.session_id), String(row.request_id))) continue
      this.db.prepare("UPDATE generation_intents SET state='incomplete' WHERE session_id=?").run(String(row.session_id))
      this.db.prepare('UPDATE decks SET version=version+1 WHERE session_id=?').run(String(row.session_id))
    }
  }
}
