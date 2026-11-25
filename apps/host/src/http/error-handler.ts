import type { ServerResponse } from 'node:http'
import { HttpError, RequestFailure, type HostOptions, type HttpFailureResponse } from '@deckagent/host-api'

const requestFailureStatus: Readonly<Record<string, number>> = {
  HOST_CLOSED: 503,
  HOST_BUSY: 429,
  REQUEST_NOT_FOUND: 404,
  APPROVAL_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  SESSION_BUSY: 409,
  GENERATION_LINK_CONFLICT: 409,
  APPROVAL_CONFLICT: 409,
  REQUEST_CLOSED: 409,
  DRAFT_CONFLICT: 409,
  ATTACHMENT_REJECTED: 409,
  ATTACHMENT_NOT_READY: 409,
  ATTACHMENT_COUNT_EXCEEDED: 413,
  REQUEST_EMPTY: 400,
  REQUEST_NOT_SAVED: 500,
  GENERATION_LINK_FAILED: 500,
}

function requestFailureResponse(error: RequestFailure): HttpFailureResponse {
  return { status: requestFailureStatus[error.code] ?? 500, code: error.code }
}

export function writeRouteError(res: ServerResponse, error: unknown, options: HostOptions): void {
  if (res.headersSent) {
    res.destroy()
    return
  }
  const mapped =
    error instanceof RequestFailure ? requestFailureResponse(error) : options.mapApplicationFailure?.(error)
  const known = error instanceof HttpError
  const status = mapped ? mapped.status : known ? error.status : 500
  const code = mapped ? mapped.code : known ? error.code : 'HOST_ERROR'
  const detail = mapped?.detail ?? (known ? error.detail : undefined)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(
    JSON.stringify({
      error: {
        code,
        message: options.failureMessage?.(mapped || known ? code : '') ?? 'Request could not be completed',
        ...(detail ? { detail } : {}),
      },
    }),
  )
}
