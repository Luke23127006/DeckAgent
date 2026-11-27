import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WorkspaceList } from '@deckagent/host-contracts'
import { ApiClientError } from '../api/client.ts'
import type { ClientErrorCode } from '../api/client.ts'
import { chatsKeys } from '../api/chats.ts'
import { changeWorkspaces, getWorkspaces, workspacesKeys } from '../api/workspaces.ts'
import type { WorkspaceChange } from '../api/workspaces.ts'

export type { WorkspaceChange }

/** The code and the safe detail of a refused workspace write. */
export interface WorkspaceFailure {
  readonly code: ClientErrorCode
  readonly detail: Readonly<Record<string, string | boolean>>
}

/** Reads the workspace list. A `workspaces` change notice refreshes it. */
export function useWorkspaces() {
  return useQuery({ queryKey: workspacesKeys.all, queryFn: ({ signal }) => getWorkspaces(signal) })
}

/**
 * Sends one workspace write. A success stores the returned list. A stale or missing workspace refreshes the list.
 * A removal also refreshes the chats, because the chats of the removed workspace become ungrouped.
 */
export function useWorkspaceChange() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: changeWorkspaces,
    onSuccess: async (next, change) => {
      cache.setQueryData<WorkspaceList>(workspacesKeys.all, previous =>
        previous && previous.version > next.version ? previous : next,
      )
      if (change.kind === 'remove') await cache.invalidateQueries({ queryKey: chatsKeys.all })
    },
    onError: async error => {
      if (error instanceof ApiClientError && (error.code === 'WORKSPACES_STALE' || error.code === 'WORKSPACE_NOT_FOUND'))
        await cache.invalidateQueries({ queryKey: workspacesKeys.all })
    },
  })
}

/** Converts a mutation error to the code and the detail that the workspace text needs. */
export function workspaceFailure(error: unknown): WorkspaceFailure {
  return error instanceof ApiClientError
    ? { code: error.code, detail: error.detail }
    : { code: 'HOST_REQUEST_FAILED', detail: {} }
}
