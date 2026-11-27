import type { HttpErrorDetail, HttpFailureResponse } from '../../http/route-helpers.ts'
import { WorkspaceError } from './contracts.ts'
import { WorkspaceWorkflowError } from './workspaces.service.ts'

const workspaceStatus: Readonly<Record<WorkspaceError['code'], number>> = {
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
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

/** Safe details only: a workspace name or a refusal reason, never a path. */
function mapWorkspaceError(error: WorkspaceError): HttpFailureResponse {
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

export function mapWorkspaceFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof WorkspaceWorkflowError) return { status: 409, code: error.code }
  if (error instanceof WorkspaceError) return mapWorkspaceError(error)
  return undefined
}
