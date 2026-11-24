import type { WorkspaceList } from '@deckagent/host-contracts'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import type { WorkspaceRegistry } from '@deckagent/workspace-registry'
import { WorkspaceWorkflowError } from './contracts.ts'
import type { WorkspaceOperations } from './contracts.ts'

export { WorkspaceWorkflowError } from './contracts.ts'
export type { WorkspaceOperations, WorkspaceWorkflowErrorCode } from './contracts.ts'

/** Coordinates workspace registry changes with active-request checks and chat ungrouping. */
export function createWorkspaceOperations(
  registry: WorkspaceRegistry,
  sessions: SqliteSessionStore,
): WorkspaceOperations {
  const listWorkspaces = async (): Promise<WorkspaceList> => ({
    workspaces: await registry.list(),
    selectedId: registry.selectedId(),
  })

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  const requireNoActiveRequest = async (workspaceId: string): Promise<void> => {
    const chats = (await sessions.list()).filter(chat => chat.workspaceId === workspaceId)
    if (chats.some(chat => sessions.requests.activeFor(chat.sessionId)))
      throw new WorkspaceWorkflowError('WORKSPACE_REQUEST_ACTIVE')
  }

  return {
    list: () => listWorkspaces(),
    add: async folder => {
      await registry.add(folder)
      return listWorkspaces()
    },
    select: async id => {
      registry.select(id)
      return listWorkspaces()
    },
    rename: async (id, name) => {
      registry.rename(id, name)
      return listWorkspaces()
    },
    relink: async (id, folder) => {
      await requireNoActiveRequest(id)
      await registry.relink(id, folder)
      return listWorkspaces()
    },
    remove: async id => {
      await requireNoActiveRequest(id)
      registry.remove(id)
      await sessions.ungroup(id)
      return listWorkspaces()
    },
  }
}
