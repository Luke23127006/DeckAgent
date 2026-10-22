import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { DeckError, validId } from './contracts.ts'
import type { OutlineDraft, OutlineProposal, OutlineSnapshot, OutlineTarget } from './contracts.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function text(value: unknown, limit: number): value is string {
  return typeof value === 'string' && !!value.trim() && value.length <= limit
}

/** Model-authored content only. Host generates identities and binds Session/request/history. */
export function validateOutlineDraft(value: unknown): OutlineDraft {
  if (!object(value) || Object.keys(value).some(key => !['overview', 'slides'].includes(key)) ||
    !text(value.overview, 4000) || !Array.isArray(value.slides) || !value.slides.length || value.slides.length > 100)
    throw new DeckError('OUTLINE_INVALID')
  const slides = value.slides.map((slide: unknown) => {
    if (!object(slide) || Object.keys(slide).some(key => !['title', 'content'].includes(key)) ||
      !text(slide.title, 300) || !text(slide.content, 8000)) throw new DeckError('OUTLINE_INVALID')
    return { title: slide.title, content: slide.content }
  })
  const result = { overview: value.overview, slides }
  if (Buffer.byteLength(JSON.stringify(result)) > 128 * 1024) throw new DeckError('OUTLINE_INVALID')
  return result
}

/** Internal storage; DeckService owns transactions so confirmation and Deck creation are atomic. */
export class OutlineStorage {
  constructor(private readonly db: DatabaseSync) {}

  snapshot(sessionId: string): OutlineSnapshot {
    const head = this.db.prepare('SELECT * FROM outline_heads WHERE session_id=?').get(sessionId)
    const currentId = head?.current_id == null ? null : String(head.current_id)
    const confirmedId = head?.confirmed_id == null ? null : String(head.confirmed_id)
    const proposals: OutlineProposal[] = this.db.prepare(
      'SELECT * FROM outline_proposals WHERE session_id=? ORDER BY version',
    ).all(sessionId).map(row => {
      const draft = validateOutlineDraft(JSON.parse(String(row.payload)))
      const outlineId = String(row.outline_id)
      return { outlineId, version: Number(row.version), requestId: String(row.request_id),
        responseIndex: Number(row.response_index), overview: draft.overview,
        slides: draft.slides.map((slide, index) => ({ ...slide, slideId: `slide-${index + 1}` })),
        status: outlineId === confirmedId ? 'confirmed' : row.cancelled ? 'cancelled' :
          outlineId === currentId ? 'current' : 'superseded' }
    })
    return { sessionId, active: !!head, version: Number(head?.version ?? 0), currentId, confirmedId, proposals }
  }

  begin(sessionId: string): void {
    this.db.prepare('INSERT OR IGNORE INTO outline_heads VALUES(?,0,NULL,NULL)').run(sessionId)
  }

  propose(sessionId: string, input: { readonly requestId: string; readonly responseIndex: number; readonly draft: OutlineDraft }): OutlineProposal {
    if (!validId(input.requestId) || !Number.isSafeInteger(input.responseIndex) || input.responseIndex < 0)
      throw new DeckError('OUTLINE_INVALID')
    const draft = validateOutlineDraft(input.draft)
    if (this.db.prepare('SELECT 1 FROM decks WHERE session_id=?').get(sessionId)) throw new DeckError('OUTLINE_READ_ONLY')
    const state = this.snapshot(sessionId)
    if (state.proposals.length >= 100) throw new DeckError('OUTLINE_LIMIT')
    if (state.proposals.some(p => p.requestId === input.requestId)) throw new DeckError('OUTLINE_REQUEST_CONFLICT')
    const outlineId = randomUUID(), version = state.version + 1
    this.db.prepare('INSERT INTO outline_proposals VALUES(?,?,?,?,?,?,0)')
      .run(sessionId, outlineId, version, input.requestId, input.responseIndex, JSON.stringify(draft))
    this.db.prepare(`INSERT INTO outline_heads VALUES(?,?,?,NULL)
      ON CONFLICT(session_id) DO UPDATE SET version=excluded.version,current_id=excluded.current_id`)
      .run(sessionId, version, outlineId)
    return this.snapshot(sessionId).proposals.at(-1)!
  }

  current(sessionId: string, target: OutlineTarget): OutlineProposal {
    const state = this.snapshot(sessionId)
    if (state.confirmedId) throw new DeckError('OUTLINE_ALREADY_CONFIRMED')
    const proposal = state.proposals.find(p => p.outlineId === state.currentId)
    if (!proposal || !validId(target.outlineId) || proposal.outlineId !== target.outlineId || proposal.version !== target.version)
      throw new DeckError('OUTLINE_STALE')
    return proposal
  }

  confirm(sessionId: string, target: OutlineTarget): void {
    const proposal = this.current(sessionId, target)
    this.db.prepare('UPDATE outline_heads SET confirmed_id=?,version=version+1 WHERE session_id=?')
      .run(proposal.outlineId, sessionId)
  }

  cancel(sessionId: string, target: OutlineTarget): void {
    const proposal = this.current(sessionId, target)
    this.db.prepare('UPDATE outline_proposals SET cancelled=1 WHERE session_id=? AND outline_id=?').run(sessionId, proposal.outlineId)
    this.db.prepare('UPDATE outline_heads SET current_id=NULL,version=version+1 WHERE session_id=?').run(sessionId)
  }
}
