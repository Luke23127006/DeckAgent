import type { WorkspaceRegistry } from './workspaces.store.ts'

export { WorkspaceRegistry } from './workspaces.store.ts'
export { createWorkspaceOperations } from './workspaces.service.ts'
export type { WorkspaceChats } from './workspaces.service.ts'
export { createWorkspaceRoutes } from './workspaces.routes.ts'
export { mapWorkspaceFailure } from './workspaces.errors.ts'

export type WorkspaceLookup = Pick<WorkspaceRegistry, 'selectedId' | 'get' | 'folders'>
