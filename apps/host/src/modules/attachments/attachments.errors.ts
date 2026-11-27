import type { HttpFailureResponse } from '../../http/route-helpers.ts'

export type AttachmentErrorCode =
  | 'INVALID_REQUEST'
  | 'SESSION_NOT_FOUND'
  | 'ATTACHMENT_NOT_FOUND'
  | 'DRAFT_CONFLICT'
  | 'ATTACHMENT_CONFLICT'
  | 'ATTACHMENT_NOT_READY'
  | 'ATTACHMENT_REJECTED'
  | 'UPLOAD_CANCELLED'
  | 'DRAFT_TOO_LARGE'
  | 'ATTACHMENT_TOO_LARGE'
  | 'ATTACHMENT_COUNT_EXCEEDED'
  | 'PARSING_LIMIT_EXCEEDED'
  | 'ATTACHMENT_TYPE_UNSUPPORTED'
  | 'ATTACHMENT_UNREADABLE'
  | 'HOST_BUSY'
  | 'HOST_CLOSED'
  | 'ATTACHMENT_NOT_SAVED'
  | 'REQUEST_EMPTY'

type AttachmentErrorDetail = Readonly<Record<string, string | boolean>>

export class AttachmentError extends Error {
  readonly detail?: AttachmentErrorDetail

  constructor(
    readonly code: AttachmentErrorCode,
    messageOrDetail?: string | AttachmentErrorDetail,
  ) {
    super(typeof messageOrDetail === 'string' ? messageOrDetail : code)
    this.name = 'AttachmentError'
    if (typeof messageOrDetail === 'object') this.detail = messageOrDetail
  }
}

const attachmentStatus: Readonly<Record<AttachmentErrorCode, number>> = {
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
  REQUEST_EMPTY: 500,
}

export function attachmentErrorCode(value: unknown): AttachmentErrorCode | undefined {
  if (typeof value !== 'string' || !Object.hasOwn(attachmentStatus, value)) return undefined
  return Object.keys(attachmentStatus).find((code): code is AttachmentErrorCode => code === value)
}

export function mapAttachmentError(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof AttachmentError)) return undefined
  return { status: attachmentStatus[error.code], code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
}
