import type { HttpFailureResponse } from '../../http/route-helpers.ts'
import { ChatWorkflowError, type ChatWorkflowErrorCode } from './chats.service.ts'

const chatStatus: Readonly<Record<ChatWorkflowErrorCode, number>> = {
  SESSION_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  CHAT_UNREADABLE: 409,
  DRAFT_TOO_LARGE: 413,
  SESSION_BUSY: 409,
  NO_SELECTABLE_MODEL: 409,
  SESSION_UNAVAILABLE: 500,
  RUNTIME_UNAVAILABLE: 503,
  RUNTIME_VERSION_UNSUPPORTED: 503,
}

export function mapChatFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ChatWorkflowError)) return undefined
  return { status: chatStatus[error.code], code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
}
