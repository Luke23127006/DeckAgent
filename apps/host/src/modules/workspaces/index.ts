import type { SqliteWorkspaceStore } from './workspaces.store.ts'

export { SqliteWorkspaceStore } from './workspaces.store.ts'
export { WorkspaceService } from './workspaces.service.ts'
export type { WorkspaceChats } from './workspaces.service.ts'
export { createWorkspaceRoutes } from './workspaces.routes.ts'
export { mapWorkspaceError } from './workspaces.errors.ts'

export type WorkspaceLookup = Pick<SqliteWorkspaceStore, 'selectedId' | 'get' | 'folders'>
