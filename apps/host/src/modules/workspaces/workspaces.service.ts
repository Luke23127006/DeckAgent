import type { WorkspaceList } from '@deckagent/host-contracts'
import type { WorkspaceRegistry } from './workspaces.store.ts'

type WorkspaceWorkflowErrorCode = 'WORKSPACE_REQUEST_ACTIVE'

export class WorkspaceWorkflowError extends Error {
  constructor(readonly code: WorkspaceWorkflowErrorCode) {
    super(code)
  }
}

export interface WorkspaceChats {
  hasActiveRequest(workspaceId: string): Promise<boolean>
  ungroup(workspaceId: string): Promise<void>
}

export interface WorkspaceOperations {
  list(): Promise<WorkspaceList>
  add(folder: unknown): Promise<WorkspaceList>
  select(id: string): Promise<WorkspaceList>
  rename(id: string, name: unknown): Promise<WorkspaceList>
  relink(id: string, folder: unknown): Promise<WorkspaceList>
  remove(id: string): Promise<WorkspaceList>
}

/** Coordinates workspace registry changes with active-request checks and chat ungrouping. */
export function createWorkspaceOperations(registry: WorkspaceRegistry, chats: WorkspaceChats): WorkspaceOperations {
  const listWorkspaces = async (): Promise<WorkspaceList> => ({
    workspaces: await registry.list(),
    selectedId: registry.selectedId(),
  })

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  const requireNoActiveRequest = async (workspaceId: string): Promise<void> => {
    if (await chats.hasActiveRequest(workspaceId)) throw new WorkspaceWorkflowError('WORKSPACE_REQUEST_ACTIVE')
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
      await chats.ungroup(id)
      return listWorkspaces()
    },
  }
}
