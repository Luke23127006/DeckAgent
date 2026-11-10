/** Workspace contracts. A Workspace groups chats and refers to one project folder; it never holds app data. */
export const defaultWorkspaceId = 'default'

/**
 * - `none`: no project folder (the default workspace).
 * - `available`: the folder the user chose is at its place and can be read.
 * - `unreadable`: nothing readable is at the place, for example it was moved or access was taken away (FR-074).
 * - `different-folder`: the place holds a folder that is not the one the user chose (FR-142).
 */
export type FolderStatus = 'none' | 'available' | 'unreadable' | 'different-folder'

export interface Workspace {
  readonly id: string
  readonly name: string
  /** Canonical path of the project folder; `null` for the default workspace. */
  readonly folder: string | null
  readonly isDefault: boolean
}

export interface WorkspaceState extends Workspace {
  readonly folderStatus: FolderStatus
}

export type FolderRefusal = 'drive-root' | 'system' | 'user-folder' | 'key-folder' | 'deckagent-data'

export type WorkspaceErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'WORKSPACE_DEFAULT'
  | 'WORKSPACE_FOLDER_REQUIRED'
  | 'WORKSPACE_FOLDER_INVALID'
  | 'WORKSPACE_FOLDER_UNREADABLE'
  | 'WORKSPACE_FOLDER_REFUSED'
  | 'WORKSPACE_FOLDER_IN_USE'
  | 'WORKSPACE_NAME_EMPTY'
  | 'WORKSPACE_NAME_TOO_LONG'
  | 'WORKSPACE_STORAGE'
  | 'WORKSPACE_SCHEMA'

export interface WorkspaceErrorDetail {
  /** Name of the workspace that already has the folder. */
  readonly workspaceName?: string
  readonly reason?: FolderRefusal
  /** True when a folder inside the refused one may be chosen. */
  readonly allowInside?: boolean
}

export class WorkspaceError extends Error {
  constructor(
    public readonly code: WorkspaceErrorCode,
    message: string,
    public readonly detail: WorkspaceErrorDetail = {},
  ) {
    super(message)
    this.name = 'WorkspaceError'
  }
}
