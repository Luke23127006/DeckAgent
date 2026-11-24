import { DeckError } from '@deckagent/deck'
import { HttpError } from '@deckagent/host-api'
import type {
  AttachmentManagement,
  HttpErrorDetail,
  HttpFailureResponse,
  WebManagement,
  WorkspaceManagement,
} from '@deckagent/host-api'
import { SessionError } from '@deckagent/session-persistence'
import { WorkspaceError } from '@deckagent/workspace-registry'
import { DraftError } from './draft-store.ts'
import { AttachmentFailure } from './features/attachments/index.ts'
import { ChatWorkflowError } from './features/chats/index.ts'
import type { ChatOperations, ChatWorkflowErrorCode } from './features/chats/index.ts'
import { DeckWorkflowFailure } from './features/deck/index.ts'
import { ProviderFailure } from './features/providers/index.ts'
import { RequestPreparationFailure } from './features/requests/index.ts'
import type { RequestPreparationFailureCode } from './features/requests/index.ts'
import { ResearchFailure } from './features/research/index.ts'
import { SourceToolFailure } from './features/sources/index.ts'
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

const providerStatus: Readonly<Record<string, number>> = {
  INVALID_PROVIDER: 400,
  PROVIDER_KEY_REQUIRED: 400,
  PROVIDER_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  PROVIDER_KEY_UNAVAILABLE: 409,
  PROVIDER_ID_TAKEN: 409,
  PROVIDER_NAME_EXISTS: 409,
  PROTOCOL_IMMUTABLE: 409,
  NEW_ENDPOINT_REQUIRES_KEY: 409,
  PROVIDER_KEY_REFUSED: 422,
  PROVIDER_CHECK_FAILED: 422,
  CREDENTIAL_STORE_UNAVAILABLE: 422,
  CATALOG_UNAVAILABLE: 502,
  PROVIDER_NO_ANSWER: 504,
  SETTINGS_STORAGE: 500,
  CREDENTIAL_NOT_SAVED: 500,
  CREDENTIAL_UNAVAILABLE: 500,
}

const requestPreparationStatus: Readonly<Record<RequestPreparationFailureCode, number>> = {
  SESSION_NOT_FOUND: 404,
  CHAT_UNREADABLE: 409,
  NO_SELECTABLE_MODEL: 409,
  SESSION_UNAVAILABLE: 500,
  RUNTIME_UNAVAILABLE: 503,
  RUNTIME_VERSION_UNSUPPORTED: 503,
}

const researchStatus: Readonly<Record<string, number>> = {
  INVALID_REQUEST: 400,
  SOURCE_ARGUMENTS_INVALID: 400,
  RESEARCH_KEY_UNAVAILABLE: 503,
  RESEARCH_KEY_REJECTED: 503,
  RESEARCH_QUOTA_EXHAUSTED: 503,
  RESEARCH_FREE_ONLY: 503,
  RESEARCH_RESPONSE_TOO_LARGE: 503,
  RESEARCH_UNAVAILABLE: 503,
  RESEARCH_NOT_SAVED: 500,
}

const attachmentStatus: Readonly<Record<string, number>> = {
  INVALID_REQUEST: 400,
  SESSION_NOT_FOUND: 404,
  ATTACHMENT_NOT_FOUND: 404,
  DRAFT_CONFLICT: 409,
  ATTACHMENT_CONFLICT: 409,
  ATTACHMENT_NOT_READY: 409,
  ATTACHMENT_REJECTED: 409,
  UPLOAD_CANCELLED: 409,
  DRAFT_TOO_LARGE: 413,
  ATTACHMENT_TOO_LARGE: 413,
  ATTACHMENT_COUNT_EXCEEDED: 413,
  PARSING_LIMIT_EXCEEDED: 413,
  ATTACHMENT_TYPE_UNSUPPORTED: 415,
  ATTACHMENT_UNREADABLE: 422,
  HOST_BUSY: 429,
  HOST_CLOSED: 503,
  ATTACHMENT_NOT_SAVED: 500,
}

const sourceToolStatus: Readonly<Record<string, number>> = {
  SOURCE_ARGUMENTS_INVALID: 400,
  TOOL_NOT_ALLOWED: 403,
  SESSION_NOT_FOUND: 404,
  ATTACHMENT_NOT_FOUND: 404,
}

const deckWorkflowStatus = (error: DeckWorkflowFailure): number => {
  if (error.code === 'OUTLINE_NOT_FOUND') return error.reason === 'restore-outline-missing' ? 404 : 409
  if (error.code === 'BRIEF_INVALID' || error.code === 'CONFIRMATION_INVALID' || error.code.startsWith('DESIGN_'))
    return 400
  if (error.code === 'SESSION_NOT_FOUND' || error.code === 'SOURCE_NOT_FOUND' || error.code === 'BRIEF_NOT_FOUND')
    return 404
  if (
    [
      'BRIEF_LOCKED',
      'BRIEF_STALE',
      'OUTLINE_STALE',
      'OUTLINE_ALREADY_CONFIRMED',
      'SESSION_BUSY',
      'GENERATION_INCOMPLETE',
      'CONFIRMATION_CONFLICT',
      'SOURCE_UNAVAILABLE',
      'GENERATION_MODEL_CHANGED',
    ].includes(error.code)
  )
    return 409
  if (error.code === 'GENERATION_UNAVAILABLE') return 503
  return 500
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
  if (error instanceof ProviderFailure) {
    return {
      status: providerStatus[error.code] ?? 500,
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof RequestPreparationFailure) {
    return {
      status: requestPreparationStatus[error.code],
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof ResearchFailure) {
    return {
      status: researchStatus[error.code] ?? 500,
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof AttachmentFailure) {
    return {
      status: attachmentStatus[error.code] ?? 500,
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof SourceToolFailure) {
    return {
      status: sourceToolStatus[error.code] ?? 500,
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof DeckError) {
    if (
      error.code === 'OUTLINE_STALE' ||
      error.code === 'OUTLINE_ALREADY_CONFIRMED' ||
      error.code === 'OUTLINE_READ_ONLY' ||
      error.code === 'OUTLINE_LIMIT'
    ) {
      return { status: 409, code: error.code }
    }
    if (error.code === 'DECK_CONTENT_NOT_FOUND') {
      return { status: 404, code: error.code }
    }
  }
  if (error instanceof DeckWorkflowFailure) {
    return {
      status: deckWorkflowStatus(error),
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  }
  if (error instanceof DraftError) {
    const status = error.code === 'DRAFT_TOO_LARGE' ? 413 : error.code === 'DRAFT_CONFLICT' ? 409 : 400
    return { status, code: error.code }
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

async function toAttachmentHttpError<T>(work: Promise<T>): Promise<T> {
  try {
    return await work
  } catch (error) {
    if (error instanceof AttachmentFailure)
      throw new HttpError(attachmentStatus[error.code] ?? 500, error.code, error.detail)
    throw error
  }
}

export function attachmentManagement(service: AttachmentManagement): AttachmentManagement {
  return {
    get maxBytes() {
      return service.maxBytes
    },
    get maxFiles() {
      return service.maxFiles
    },
    upload: input => toAttachmentHttpError(service.upload(input)),
    get: (id, attachmentId) => toAttachmentHttpError(service.get(id, attachmentId)),
    remove: (id, attachmentId, expectedRevision) =>
      toAttachmentHttpError(service.remove(id, attachmentId, expectedRevision)),
    preview: (id, attachmentId, signal) => toAttachmentHttpError(service.preview(id, attachmentId, signal)),
  }
}
