import type { DeckStore } from '@deckagent/deck'
import type { WebSession } from '@deckagent/host-contracts'
import type { ChatSummary, ModelSelection, SqliteSessionStore } from '@deckagent/session-persistence'
import type { MemoryDraftStore } from '../../draft-store.ts'
import type { WorkspaceRegistry } from '@deckagent/workspace-registry'
import type { WebState } from '../../web-state.ts'
import { ChatWorkflowError } from './contracts.ts'
import type { ChatOperations } from './contracts.ts'

export { ChatWorkflowError } from './contracts.ts'
export type { ChatOperations, ChatWorkflowErrorCode, ChatWorkflowErrorDetail } from './contracts.ts'

/** Coordinates chat creation, model selection, listing, search, and Browser projection. */
export function createChatOperations(
  sessions: SqliteSessionStore,
  registry: WorkspaceRegistry,
  web: WebState,
  decks: DeckStore,
  drafts: MemoryDraftStore,
): ChatOperations {
  const project = (chat: ChatSummary): WebSession => ({
    ...web.project(chat, chat.readable && decks.snapshot(chat.sessionId).slides.some(slide => slide.revision > 0)),
    hasDraft: drafts.get(chat.sessionId).trim() !== '' || drafts.snapshot(chat.sessionId).attachmentIds.length > 0,
  })

  const chat = async (id: string): Promise<WebSession> => {
    const found = (await sessions.chats()).find(item => item.sessionId === id)
    if (!found) throw new ChatWorkflowError('SESSION_NOT_FOUND')
    return project(found)
  }

  return {
    async create(chosen?: ModelSelection): Promise<WebSession> {
      // FR-053: without an explicit choice, the most recent model choice in any chat when still selectable.
      const resolved = chosen === undefined ? web.lastSelection() : chosen
      if (resolved && !web.selectable(resolved)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      const created = await sessions.create(registry.selectedId(), resolved)
      return chat(created.sessionId)
    },
    async selectModel(id: string, chosen: ModelSelection): Promise<WebSession> {
      if (!web.selectable(chosen)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      await sessions.select(id, chosen)
      web.rememberSelection(chosen)
      return chat(id)
    },
    list: async () => (await sessions.chats()).map(project),
    async search(words: string): Promise<readonly WebSession[]> {
      const chats = await sessions.chats()
      const found = new Set(
        await sessions.search(
          words,
          chats.map(item => item.sessionId),
        ),
      )
      return chats.filter(item => found.has(item.sessionId)).map(project)
    },
  }
}
