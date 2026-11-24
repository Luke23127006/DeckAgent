import type { WorkspaceList } from '@deckagent/host-contracts'

export type WorkspaceWorkflowErrorCode = 'WORKSPACE_REQUEST_ACTIVE'

export class WorkspaceWorkflowError extends Error {
  constructor(readonly code: WorkspaceWorkflowErrorCode) {
    super(code)
  }
}

export interface WorkspaceOperations {
  list(): Promise<WorkspaceList>
  add(folder: unknown): Promise<WorkspaceList>
  select(id: string): Promise<WorkspaceList>
  rename(id: string, name: unknown): Promise<WorkspaceList>
  relink(id: string, folder: unknown): Promise<WorkspaceList>
  remove(id: string): Promise<WorkspaceList>
}
