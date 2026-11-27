import type { ServerResponse } from 'node:http'
import type { AttachmentView } from '@deckagent/host-contracts'
import type { Router } from 'express'
import type { HttpErrorDetail } from './http-error.ts'

/** Saved conversation message as the Host reads it. */
export interface HostMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
  readonly content: string
  readonly interrupted?: boolean
  readonly toolCallId?: string
  readonly name?: string
  readonly isError?: boolean
  readonly attachments?: readonly AttachmentView[]
}

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
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<
    Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>
  >
}

export interface HostRouteContext {
  readonly streams: Set<ServerResponse>
}

export type HostRouteRegistrar = Router | ((context: HostRouteContext) => Router)
