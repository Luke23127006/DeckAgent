import {
  decodeChat,
  decodeChatList,
  decodeHistory,
  decodeStoredActivities,
  decodeStoredRequests,
} from '@deckagent/host-contracts'
import type { ModelSelection } from '@deckagent/host-contracts'
import { apiJson } from './client.ts'

/** Keys of the chat list. Each key starts with `chats`, so a `chats` notice invalidates all of them. */
export const chatsKeys = {
  all: ['chats'] as const,
  list: ['chats', 'list'] as const,
  search: (words: string) => ['chats', 'search', words] as const,
}

function chatPath(sessionId: string, part: string): string {
  return `/api/sessions/${encodeURIComponent(sessionId)}/${part}`
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

/** Creates an empty chat in the workspace in use. The Host gives it the most recent model choice (FR-053). */
export function createChat() {
  return apiJson('/api/sessions', decodeChat, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
}

/** Saves the model choice of one chat. The choice starts no request. */
export function selectModel(sessionId: string, selection: ModelSelection) {
  return apiJson(chatPath(sessionId, 'selection'), decodeChat, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(selection),
  })
}

/** Reads the public history of one chat. */
export function readHistory(sessionId: string) {
  return apiJson(chatPath(sessionId, 'history'), decodeHistory)
}

/** Reads the saved requests of one chat. */
export function listRequests(sessionId: string) {
  return apiJson(chatPath(sessionId, 'requests'), decodeStoredRequests)
}

/** Reads the saved activities of one chat. */
export function listActivities(sessionId: string) {
  return apiJson(chatPath(sessionId, 'activities'), decodeStoredActivities)
}
