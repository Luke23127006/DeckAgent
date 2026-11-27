import type { ServerResponse } from 'node:http'
import { HttpError } from './http-error.ts'
import type { HostOptions } from './contracts.ts'

export function writeRouteError(res: ServerResponse, error: unknown, options: HostOptions): void {
  if (res.headersSent) {
    res.destroy()
    return
  }
  const mapped = options.mapApplicationFailure?.(error)
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
