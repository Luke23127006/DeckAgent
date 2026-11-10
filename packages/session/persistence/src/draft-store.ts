import { SessionError } from './contracts.ts'

export const draftLimit = 16_000

/**
 * The draft of each chat while DeckAgent runs (FR-038): every open interface reads the same draft,
 * a reload keeps it, and it is not kept after DeckAgent stops. Each chat has its own entry.
 */
export class MemoryDraftStore {
  private readonly drafts = new Map<string, string>()

  get(chatId: string): string {
    return this.drafts.get(chatId) ?? ''
  }

  set(chatId: string, text: string): string {
    if (typeof text !== 'string' || [...text].length > draftLimit)
      throw new SessionError('DRAFT_TOO_LARGE', 'Draft is longer than the supported limit')
    if (text) this.drafts.set(chatId, text)
    else this.drafts.delete(chatId)
    return text
  }
}
