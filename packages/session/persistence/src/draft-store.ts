import { SessionError } from './contracts.ts'
import type { DraftSnapshot } from './contracts.ts'

export const draftLimit = 16_000

/**
 * The draft of each chat while DeckAgent runs (FR-038): every open interface reads the same draft,
 * a reload keeps it, and it is not kept after DeckAgent stops. Each chat has its own entry.
 */
export class MemoryDraftStore {
  private readonly drafts = new Map<string, DraftSnapshot>()

  get(chatId: string): string {
    return this.snapshot(chatId).text
  }

  set(chatId: string, text: string): string {
    if (typeof text !== 'string' || [...text].length > draftLimit)
      throw new SessionError('DRAFT_TOO_LARGE', 'Draft is longer than the supported limit')
    const current = this.snapshot(chatId)
    this.save(chatId, { ...current, text }, current.revision)
    return text
  }

  snapshot(chatId: string): DraftSnapshot {
    return structuredClone(this.drafts.get(chatId) ?? { text: '', attachmentIds: [], revision: 0 })
  }

  save(
    chatId: string,
    value: { readonly text: string; readonly attachmentIds: readonly string[] },
    expectedRevision: number,
  ): DraftSnapshot {
    const current = this.snapshot(chatId)
    if (expectedRevision !== current.revision)
      throw new SessionError('DRAFT_CONFLICT', 'The draft changed. Reload it before saving')
    if (typeof value.text !== 'string' || [...value.text].length > draftLimit)
      throw new SessionError('DRAFT_TOO_LARGE', 'Draft is longer than the supported limit')
    if (
      !Array.isArray(value.attachmentIds) ||
      new Set(value.attachmentIds).size !== value.attachmentIds.length ||
      value.attachmentIds.some(id => typeof id !== 'string' || !/^att-[a-f0-9-]{36}$/.test(id))
    )
      throw new SessionError('INVALID_REQUEST', 'Invalid draft attachment references')
    const next = { text: value.text, attachmentIds: [...value.attachmentIds], revision: current.revision + 1 }
    this.drafts.set(chatId, next)
    return structuredClone(next)
  }

  /** Only the exact submitted draft may be cleared; a newer draft is left intact. */
  clear(chatId: string, expectedRevision: number): boolean {
    if (this.snapshot(chatId).revision !== expectedRevision) return false
    this.save(chatId, { text: '', attachmentIds: [] }, expectedRevision)
    return true
  }
}
