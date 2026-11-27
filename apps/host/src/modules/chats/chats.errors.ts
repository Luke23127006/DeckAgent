import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type ChatErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'MODEL_NOT_SELECTABLE'
  | 'CHAT_UNREADABLE'
  | 'DRAFT_TOO_LARGE'
  | 'SESSION_BUSY'
  | 'NO_SELECTABLE_MODEL'
  | 'SESSION_UNAVAILABLE'
  | 'RUNTIME_UNAVAILABLE'
  | 'RUNTIME_VERSION_UNSUPPORTED'

type ChatErrorDetail = Readonly<Record<string, string | boolean>>

export class ChatError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    readonly detail?: ChatErrorDetail,
  ) {
    super(code)
    this.name = 'ChatError'
  }
}

const chatStatus: Readonly<Record<ChatErrorCode, number>> = {
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

export function mapChatError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof ChatError)) return undefined
  return { status: chatStatus[error.code], code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
}
