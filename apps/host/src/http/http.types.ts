import type { ServerResponse } from 'node:http'
import type { Router } from 'express'
import type { HttpErrorDetail } from './http-error.ts'

export interface HttpFailureResponse {
  readonly status: number
  readonly code: string
  readonly detail?: HttpErrorDetail
}

export interface HostOptions {
  readonly onClose?: () => Promise<void> | void
  readonly mapApplicationFailure?: (error: unknown) => HttpFailureResponse | undefined
  readonly failureMessage?: (code: string) => string | undefined
  readonly port?: number
  readonly routes?: readonly HostRouteRegistrar[]
  /** Serves the root document for GET paths that have no file extension and no reserved prefix. */
  readonly spaFallback?: boolean
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<
    Record<string, { readonly contentType: string; readonly body: string | Buffer; readonly sandboxed?: boolean }>
  >
}

export interface HostRouteContext {
  readonly streams: Set<ServerResponse>
}

export type HostRouteRegistrar = Router | ((context: HostRouteContext) => Router)
