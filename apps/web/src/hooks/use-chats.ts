import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { chatsKeys, listChats, searchChats } from '../api/chats.ts'
import { workspacesKeys } from '../api/workspaces.ts'

/** Reads every saved chat. A `chats` change notice refreshes the list. */
export function useChats() {
  return useQuery({ queryKey: chatsKeys.list, queryFn: ({ signal }) => listChats(signal) })
}

/** Reads the chats that hold `words`. An empty string reads nothing. New words keep the last result until the reply. */
export function useChatSearch(words: string) {
  return useQuery({
    queryKey: chatsKeys.search(words),
    queryFn: ({ signal }) => searchChats(words, signal),
    enabled: words.length > 0,
    placeholderData: keepPreviousData,
  })
}

/** Returns a function that marks the chat list and the workspace list as stale. */
export function useRefreshChatList(): () => void {
  const cache = useQueryClient()
  return useCallback(() => {
    void cache.invalidateQueries({ queryKey: chatsKeys.all })
    void cache.invalidateQueries({ queryKey: workspacesKeys.all })
  }, [cache])
}
