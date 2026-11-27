import type { WorkspaceList } from '@deckagent/host-contracts'
import type { WorkspaceRegistry } from './workspaces.store.ts'
import { WorkspaceError } from './workspaces.errors.ts'

export interface WorkspaceChats {
  hasActiveRequest(workspaceId: string): Promise<boolean>
  ungroup(workspaceId: string): Promise<void>
}

export interface WorkspaceOperations {
  list(): Promise<WorkspaceList>
  add(folder: unknown, expectedVersion: number): Promise<WorkspaceList>
  select(id: string, expectedVersion: number): Promise<WorkspaceList>
  rename(id: string, name: unknown, expectedVersion: number): Promise<WorkspaceList>
  relink(id: string, folder: unknown, expectedVersion: number): Promise<WorkspaceList>
  remove(id: string, expectedVersion: number): Promise<WorkspaceList>
}

/** Coordinates workspace registry changes with active-request checks and chat ungrouping. */
export function createWorkspaceOperations(registry: WorkspaceRegistry, chats: WorkspaceChats): WorkspaceOperations {
  const listWorkspaces = async (): Promise<WorkspaceList> => ({
    workspaces: await registry.list(),
    selectedId: registry.selectedId(),
    version: registry.version(),
  })

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  const requireNoActiveRequest = async (workspaceId: string): Promise<void> => {
    if (await chats.hasActiveRequest(workspaceId))
      throw new WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')
  }

  return {
    list: () => listWorkspaces(),
    add: async (folder, expectedVersion) => {
      await registry.add(folder, expectedVersion)
      return listWorkspaces()
    },
    select: async (id, expectedVersion) => {
      registry.select(id, expectedVersion)
      return listWorkspaces()
    },
    rename: async (id, name, expectedVersion) => {
      registry.rename(id, name, expectedVersion)
      return listWorkspaces()
    },
    relink: async (id, folder, expectedVersion) => {
      await requireNoActiveRequest(id)
      await registry.relink(id, folder, expectedVersion)
      return listWorkspaces()
    },
    remove: async (id, expectedVersion) => {
      await requireNoActiveRequest(id)
      const version = registry.remove(id, expectedVersion, { publish: false })
      await chats.ungroup(id)
      registry.publishVersion(version)
      return listWorkspaces()
    },
  }
}
