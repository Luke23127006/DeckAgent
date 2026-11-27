import type { WorkspaceList } from '@deckagent/host-contracts'
import type { SqliteWorkspaceStore } from './workspaces.store.ts'
import { WorkspaceError } from './workspaces.errors.ts'

export interface WorkspaceChats {
  hasActiveRequest(workspaceId: string): Promise<boolean>
  ungroup(workspaceId: string): Promise<void>
}

/** Coordinates workspace store changes with active-request checks and chat ungrouping. */
export class WorkspaceService {
  constructor(
    private readonly store: SqliteWorkspaceStore,
    private readonly chats: WorkspaceChats,
  ) {}

  async list(): Promise<WorkspaceList> {
    return this.listWorkspaces()
  }

  async add(folder: unknown, expectedVersion: number): Promise<WorkspaceList> {
    await this.store.add(folder, expectedVersion)
    return this.listWorkspaces()
  }

  async select(id: string, expectedVersion: number): Promise<WorkspaceList> {
    this.store.select(id, expectedVersion)
    return this.listWorkspaces()
  }

  async rename(id: string, name: unknown, expectedVersion: number): Promise<WorkspaceList> {
    this.store.rename(id, name, expectedVersion)
    return this.listWorkspaces()
  }

  async relink(id: string, folder: unknown, expectedVersion: number): Promise<WorkspaceList> {
    await this.requireNoActiveRequest(id)
    await this.store.relink(id, folder, expectedVersion)
    return this.listWorkspaces()
  }

  async remove(id: string, expectedVersion: number): Promise<WorkspaceList> {
    await this.requireNoActiveRequest(id)
    const version = this.store.remove(id, expectedVersion, { publish: false })
    await this.chats.ungroup(id)
    this.store.publishVersion(version)
    return this.listWorkspaces()
  }

  private async listWorkspaces(): Promise<WorkspaceList> {
    return {
      workspaces: await this.store.list(),
      selectedId: this.store.selectedId(),
      version: this.store.version(),
    }
  }

  // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
  private async requireNoActiveRequest(workspaceId: string): Promise<void> {
    if (await this.chats.hasActiveRequest(workspaceId))
      throw new WorkspaceError('WORKSPACE_REQUEST_ACTIVE', 'Workspace has an active request')
  }
}
