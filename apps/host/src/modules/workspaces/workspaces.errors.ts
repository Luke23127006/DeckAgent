import type { HttpErrorDetail, HttpFailureResponse } from '../../http/route-helpers.ts'
import type { FolderRefusal } from './workspace.types.ts'

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
  | 'WORKSPACES_STALE'
  | 'WORKSPACE_REQUEST_ACTIVE'
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

const workspaceStatus: Readonly<Record<WorkspaceErrorCode, number>> = {
  WORKSPACE_NOT_FOUND: 404,
  WORKSPACE_DEFAULT: 409,
  WORKSPACE_FOLDER_REQUIRED: 400,
  WORKSPACE_FOLDER_INVALID: 400,
  WORKSPACE_FOLDER_UNREADABLE: 422,
  WORKSPACE_FOLDER_REFUSED: 422,
  WORKSPACE_FOLDER_IN_USE: 409,
  WORKSPACE_NAME_EMPTY: 400,
  WORKSPACE_NAME_TOO_LONG: 400,
  WORKSPACES_STALE: 409,
  WORKSPACE_REQUEST_ACTIVE: 409,
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

/** Safe details only: a workspace name or a refusal reason, never a path. */
export function mapWorkspaceError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof WorkspaceError)) return undefined
  const { workspaceName, reason, allowInside } = error.detail
  const detail: HttpErrorDetail = {
    ...(workspaceName === undefined ? {} : { workspaceName }),
    ...(reason === undefined ? {} : { reason }),
    ...(allowInside === undefined ? {} : { allowInside }),
  }
  return {
    status: workspaceStatus[error.code],
    code: error.code,
    ...(Object.keys(detail).length > 0 ? { detail } : {}),
  }
}
