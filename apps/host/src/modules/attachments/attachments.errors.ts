import type { HttpFailureResponse } from '@deckagent/host-api'
import { AttachmentFailure } from './attachments.service.ts'
import { DraftError } from './draft.store.ts'

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

export function mapAttachmentFailure(error: unknown): HttpFailureResponse | undefined {
  if (error instanceof AttachmentFailure)
    return {
      status: attachmentStatus[error.code] ?? 500,
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    }
  if (error instanceof DraftError) {
    const status = error.code === 'DRAFT_TOO_LARGE' ? 413 : error.code === 'DRAFT_CONFLICT' ? 409 : 400
    return { status, code: error.code }
  }
  return undefined
}
