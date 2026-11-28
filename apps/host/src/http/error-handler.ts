import type { ServerResponse } from 'node:http'
import { RunFailure } from '../runs/ports.ts'
import { HttpError } from './http-error.ts'
import type { HostOptions, HttpFailureResponse } from './http.types.ts'

type KnownRunFailureCode =
  | 'HOST_CLOSED'
  | 'HOST_BUSY'
  | 'RUNTIME_UNAVAILABLE'
  | 'RUNTIME_VERSION_UNSUPPORTED'
  | 'REQUEST_NOT_FOUND'
  | 'APPROVAL_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'RUN_OWNER_BUSY'
  | 'SESSION_BUSY'
  | 'GENERATION_LINK_CONFLICT'
  | 'APPROVAL_CONFLICT'
  | 'REQUEST_CLOSED'
  | 'DRAFT_CONFLICT'
  | 'ATTACHMENT_REJECTED'
  | 'ATTACHMENT_NOT_READY'
  | 'ATTACHMENT_COUNT_EXCEEDED'
  | 'REQUEST_EMPTY'
  | 'REQUEST_NOT_SAVED'
  | 'GENERATION_LINK_FAILED'

const runFailureStatuses: Readonly<Record<KnownRunFailureCode, number>> = {
  HOST_CLOSED: 503,
  HOST_BUSY: 429,
  RUNTIME_UNAVAILABLE: 503,
  RUNTIME_VERSION_UNSUPPORTED: 503,
  REQUEST_NOT_FOUND: 404,
  APPROVAL_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  RUN_OWNER_BUSY: 409,
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

function isKnownRunFailureCode(code: string): code is KnownRunFailureCode {
  return Object.hasOwn(runFailureStatuses, code)
}

function mapRunFailure(error: unknown): HttpFailureResponse | undefined {
  if (!(error instanceof RunFailure)) return undefined
  const status = isKnownRunFailureCode(error.code) ? runFailureStatuses[error.code] : 500
  return {
    status,
    code: error.code,
    ...(error.detail ? { detail: error.detail } : {}),
  }
}

export function writeRouteError(res: ServerResponse, error: unknown, options: HostOptions): void {
  if (res.headersSent) {
    res.destroy()
    return
  }

  const mapped = options.mapApplicationFailure?.(error) ?? mapRunFailure(error)
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
