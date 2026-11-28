import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { DeckError, isRecord, validId } from './errors.ts'
import type { OutlineDraft, OutlineProposal, OutlineSnapshot, OutlineTarget } from './outline-contracts.ts'
import { validateBoundOutline } from './bound-outline.ts'
import { BriefStorage } from './brief-store.ts'

function text(value: unknown, limit: number): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= limit
}

function proposalStatus(
  outlineId: string,
  cancelled: unknown,
  currentId: string | null,
  confirmedId: string | null,
): OutlineProposal['status'] {
  if (outlineId === confirmedId) return 'confirmed'
  if (cancelled) return 'cancelled'
  return outlineId === currentId ? 'current' : 'superseded'
}

/** Model-authored content only. Host generates identities and binds Session/request/history. */
export function validateOutlineDraft(value: unknown): OutlineDraft {
  if (
    !isRecord(value) ||
    Object.keys(value).some(key => !['overview', 'slides'].includes(key)) ||
    !text(value.overview, 4000) ||
    !Array.isArray(value.slides) ||
    !value.slides.length ||
    value.slides.length > 100
  )
    throw new DeckError('OUTLINE_INVALID')
  const slides = value.slides.map((slide: unknown) => {
    if (
      !isRecord(slide) ||
      Object.keys(slide).some(key => !['title', 'content'].includes(key)) ||
      !text(slide.title, 300) ||
      !text(slide.content, 8000)
    )
      throw new DeckError('OUTLINE_INVALID')
    return { title: slide.title, content: slide.content }
  })
  const result = { overview: value.overview, slides }
  if (Buffer.byteLength(JSON.stringify(result)) > 128 * 1024) throw new DeckError('OUTLINE_INVALID')
  return result
}

/** Internal storage; DeckStore owns transactions so confirmation and Deck creation are atomic. */
export class OutlineStorage {
  constructor(
    private readonly db: DatabaseSync,
    private readonly briefs: BriefStorage,
  ) {}

  snapshot(sessionId: string): OutlineSnapshot {
    const head = this.db.prepare('SELECT * FROM outline_heads WHERE session_id=?').get(sessionId)
    const currentId = head?.current_id == null ? null : String(head.current_id)
    const confirmedId = head?.confirmed_id == null ? null : String(head.confirmed_id)
    const proposals: OutlineProposal[] = this.db
      .prepare('SELECT * FROM outline_proposals WHERE session_id=? ORDER BY version')
      .all(sessionId)
      .map(row => {
        const detail = this.db
          .prepare('SELECT payload FROM outline_details WHERE session_id=? AND outline_id=?')
          .get(sessionId, String(row.outline_id))
        if (!detail) return this.decodeLegacyProposalRow(row, currentId, confirmedId)
        try {
          return this.decodeBoundProposalRow(sessionId, row, String(detail.payload), currentId, confirmedId)
        } catch {
          throw new DeckError('DECK_CORRUPT')
        }
      })
    return { sessionId, active: !!head, version: Number(head?.version ?? 0), currentId, confirmedId, proposals }
  }

  private decodeBoundProposalRow(
    sessionId: string,
    row: Record<string, unknown>,
    detailPayload: string,
    currentId: string | null,
    confirmedId: string | null,
  ): OutlineProposal {
    const v: unknown = JSON.parse(detailPayload)
    if (
      !isRecord(v) ||
      !isRecord(v.brief) ||
      !validId(v.brief.briefId) ||
      !Number.isSafeInteger(v.brief.version) ||
      Number(v.brief.version) < 1 ||
      !isRecord(v.changes) ||
      typeof v.changes.orderChanged !== 'boolean' ||
      typeof v.changes.overviewChanged !== 'boolean' ||
      typeof v.changes.suggestionsChanged !== 'boolean' ||
      (v.previousOutlineId !== undefined && !validId(v.previousOutlineId)) ||
      (v.restoredFrom !== undefined && !validId(v.restoredFrom))
    )
      throw new DeckError('DECK_CORRUPT')

    const draft = validateBoundOutline({
      overview: v.overview,
      slides: v.slides,
      revisionSuggestions: v.revisionSuggestions,
    })
    const strings = (value: unknown): string[] => {
      if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) throw new DeckError('DECK_CORRUPT')
      return value
    }
    const brief = this.briefs.version(sessionId, v.brief.briefId, Number(v.brief.version))
    const outlineId = String(row.outline_id)
    return {
      outlineId,
      version: Number(row.version),
      requestId: String(row.request_id),
      responseIndex: Number(row.response_index),
      overview: draft.overview,
      slides: draft.slides.map(s => {
        if (!s.slideId) throw new DeckError('DECK_CORRUPT')
        return { ...s, slideId: s.slideId }
      }),
      brief,
      revisionSuggestions: draft.revisionSuggestions,
      changes: {
        overviewChanged: v.changes.overviewChanged,
        suggestionsChanged: v.changes.suggestionsChanged,
        briefFields: strings(v.changes.briefFields),
        added: strings(v.changes.added),
        removed: strings(v.changes.removed),
        changed: strings(v.changes.changed),
        orderChanged: v.changes.orderChanged,
      },
      ...(typeof v.previousOutlineId === 'string' ? { previousOutlineId: v.previousOutlineId } : {}),
      ...(typeof v.restoredFrom === 'string' ? { restoredFrom: v.restoredFrom } : {}),
      status: proposalStatus(outlineId, row.cancelled, currentId, confirmedId),
    }
  }

  private decodeLegacyProposalRow(
    row: Record<string, unknown>,
    currentId: string | null,
    confirmedId: string | null,
  ): OutlineProposal {
    const draft = validateOutlineDraft(JSON.parse(String(row.payload)))
    const outlineId = String(row.outline_id)
    return {
      outlineId,
      version: Number(row.version),
      requestId: String(row.request_id),
      responseIndex: Number(row.response_index),
      overview: draft.overview,
      slides: draft.slides.map((slide, index) => ({ ...slide, slideId: `slide-${index + 1}` })),
      status: proposalStatus(outlineId, row.cancelled, currentId, confirmedId),
    }
  }

  begin(sessionId: string): void {
    this.db.prepare('INSERT OR IGNORE INTO outline_heads VALUES(?,0,NULL,NULL)').run(sessionId)
  }

  propose(
    sessionId: string,
    input: { readonly requestId: string; readonly responseIndex: number; readonly draft: OutlineDraft },
  ): OutlineProposal {
    if (!validId(input.requestId) || !Number.isSafeInteger(input.responseIndex) || input.responseIndex < 0)
      throw new DeckError('OUTLINE_INVALID')

    const draft = validateOutlineDraft(input.draft)
    if (this.db.prepare('SELECT 1 FROM decks WHERE session_id=?').get(sessionId))
      throw new DeckError('OUTLINE_READ_ONLY')

    const state = this.snapshot(sessionId)
    if (state.proposals.length >= 100) throw new DeckError('OUTLINE_LIMIT')
    if (state.proposals.some(p => p.requestId === input.requestId)) throw new DeckError('OUTLINE_REQUEST_CONFLICT')

    const outlineId = randomUUID(),
      version = state.version + 1

    this.db
      .prepare('INSERT INTO outline_proposals VALUES(?,?,?,?,?,?,0)')
      .run(sessionId, outlineId, version, input.requestId, input.responseIndex, JSON.stringify(draft))

    this.db
      .prepare(`INSERT INTO outline_heads VALUES(?,?,?,NULL)
      ON CONFLICT(session_id) DO UPDATE SET version=excluded.version,current_id=excluded.current_id`)
      .run(sessionId, version, outlineId)

    const created = this.snapshot(sessionId).proposals.at(-1)
    if (!created) throw new DeckError('DECK_CORRUPT')

    return created
  }

  current(sessionId: string, target: OutlineTarget): OutlineProposal {
    const state = this.snapshot(sessionId)
    if (state.confirmedId) throw new DeckError('OUTLINE_ALREADY_CONFIRMED')
    const proposal = state.proposals.find(p => p.outlineId === state.currentId)
    if (
      !proposal ||
      !validId(target.outlineId) ||
      proposal.outlineId !== target.outlineId ||
      proposal.version !== target.version
    )
      throw new DeckError('OUTLINE_STALE')
    return proposal
  }

  confirm(sessionId: string, target: OutlineTarget): void {
    const proposal = this.current(sessionId, target)
    this.db
      .prepare('UPDATE outline_heads SET confirmed_id=?,version=version+1 WHERE session_id=?')
      .run(proposal.outlineId, sessionId)
  }

  cancel(sessionId: string, target: OutlineTarget): void {
    const proposal = this.current(sessionId, target)
    if (proposal.brief) throw new DeckError('OUTLINE_CANCELLATION_UNAVAILABLE')
    this.db
      .prepare('UPDATE outline_proposals SET cancelled=1 WHERE session_id=? AND outline_id=?')
      .run(sessionId, proposal.outlineId)
    this.db.prepare('UPDATE outline_heads SET current_id=NULL,version=version+1 WHERE session_id=?').run(sessionId)
  }
}
