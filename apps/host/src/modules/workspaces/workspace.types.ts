/** Workspace types. A Workspace groups chats and refers to one project folder; it never holds app data. */
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
