import { HttpError } from '@deckagent/host-api'
import type { HttpErrorDetail, HttpFailureResponse, WebManagement, WorkspaceManagement } from '@deckagent/host-api'
import { SessionError } from '@deckagent/session-persistence'
import { WorkspaceError } from '@deckagent/workspace-registry'
import { ChatWorkflowError } from './features/chats/index.ts'
import type { ChatOperations, ChatWorkflowErrorCode } from './features/chats/index.ts'
import { WorkspaceWorkflowError } from './features/workspaces/index.ts'
import type { WorkspaceOperations } from './features/workspaces/index.ts'
import { WebStateError, record, selection } from './web-state.ts'

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
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

const chatStatus: Readonly<Record<ChatWorkflowErrorCode, number>> = {
  SESSION_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  CHAT_UNREADABLE: 409,
  DRAFT_TOO_LARGE: 413,
}

function body(value: unknown, key: string): unknown {
  if (!record(value) || Object.keys(value).some(name => name !== key)) throw new HttpError(400, 'INVALID_REQUEST')
  return value[key]
}

/** Maps application workflow and domain failures to HTTP responses without exposing internal details. */
export function mapApplicationFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof WorkspaceWorkflowError) {
    return { status: 409, code: error.code }
  }
  if (error instanceof WorkspaceError) {
    // Safe details only: a workspace name or a refusal reason, never a path.
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
  if (error instanceof ChatWorkflowError) {
    return {
      status: chatStatus[error.code],
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof SessionError) {
    if (error.code === 'SESSION_NOT_FOUND') return { status: 404, code: 'SESSION_NOT_FOUND' }
    if (error.code === 'SESSION_CORRUPT') return { status: 409, code: 'CHAT_UNREADABLE' }
    if (error.code === 'DRAFT_TOO_LARGE') return { status: 413, code: 'DRAFT_TOO_LARGE' }
    return undefined
  }
  if (error instanceof WebStateError) {
    const status = error.code === 'INVALID_SELECTION' || error.code === 'INVALID_REQUEST' ? 400 : 500
    return { status, code: error.code }
  }
  return undefined
}

export function workspaceManagement(operations: WorkspaceOperations): WorkspaceManagement {
  return {
    list: () => operations.list(),
    add: value => operations.add(body(value, 'folder')),
    select: value => {
      const id = body(value, 'id')
      if (typeof id !== 'string') throw new HttpError(400, 'INVALID_REQUEST')
      return operations.select(id)
    },
    rename: (id, value) => operations.rename(id, body(value, 'name')),
    relink: (id, value) => operations.relink(id, body(value, 'folder')),
    remove: id => operations.remove(id),
  }
}

export function chatManagement(
  operations: ChatOperations,
): Pick<WebManagement, 'sessions' | 'createSession' | 'selectModel' | 'searchSessions'> {
  return {
    sessions: () => operations.list(),
    createSession: value => {
      if (!record(value) || Object.keys(value).some(key => key !== 'selection'))
        throw new HttpError(400, 'INVALID_SESSION')
      const chosen = value.selection === undefined ? undefined : selection(value.selection)
      return operations.create(chosen)
    },
    selectModel: (id, value) => operations.selectModel(id, selection(value)),
    searchSessions: value => {
      const words = body(value, 'words')
      if (typeof words !== 'string' || words.length > 500) throw new HttpError(400, 'INVALID_REQUEST')
      return operations.search(words)
    },
  }
}
