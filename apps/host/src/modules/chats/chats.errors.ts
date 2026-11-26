import type { HttpFailureResponse } from '@deckagent/host-api'
import { ChatWorkflowError, type ChatWorkflowErrorCode } from './chats.service.ts'

const chatStatus: Readonly<Record<ChatWorkflowErrorCode, number>> = {
  SESSION_NOT_FOUND: 404,
  MODEL_NOT_SELECTABLE: 409,
  CHAT_UNREADABLE: 409,
  DRAFT_TOO_LARGE: 413,
}

export function mapChatFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ChatWorkflowError)) return undefined
  return { status: chatStatus[error.code], code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
}
