import { decodeChatList } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

/** Keys of the chat list. Each key starts with `chats`, so a `chats` notice invalidates all of them. */
export const chatsKeys = {
  all: ['chats'] as const,
  list: ['chats', 'list'] as const,
  search: (words: string) => ['chats', 'search', words] as const,
}

/** Reads every saved chat from GET /api/sessions. */
export function listChats(signal?: AbortSignal) {
  return apiJson('/api/sessions', decodeChatList, { signal: signal ?? null })
}

/** Reads the chats that hold the given words (FR-134). */
export function searchChats(words: string, signal?: AbortSignal) {
  return apiJson('/api/sessions/search', decodeChatList, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ words }),
    signal: signal ?? null,
  })
}
