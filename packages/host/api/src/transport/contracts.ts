import type { ServerResponse } from 'node:http'
import type { AgentRequest, AttachmentView, RequestSnapshot, TerminalStatus } from '@deckagent/host-contracts'
import type { RequestStore } from '@deckagent/session-persistence'
import type { Router } from 'express'
import type { RequestAdmission, RequestRuntime } from '../lifecycle/contracts.ts'
import type { PreparedTools } from '../lifecycle/tool-contracts.ts'
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
  readonly mapApplicationFailure?: (error: unknown) => HttpFailureResponse | undefined
  readonly failureMessage?: (code: string) => string | undefined
  /** Absent while no Agent runtime is connected: `POST /api/requests` is refused with `REQUESTS_UNAVAILABLE`. */
  readonly requests?: {
    /** Host-owned summary derived from committed product state, including explicit Stop. */
    readonly closingText?: (sessionId: string, requestId: string, status: TerminalStatus) => string | undefined
    readonly store: RequestStore
    readonly runtime: RequestRuntime
    readonly prepareTools?: (
      sessionId: string,
      attachmentIds?: readonly string[],
      publicResearch?: boolean,
    ) => Promise<PreparedTools>
  }
  readonly readHistory: (sessionId: string) => Promise<readonly HostMessage[]>
  readonly port?: number
  readonly routes?: readonly HostRouteRegistrar[]
  /** Files that one request may carry. Feeds request admission and the attachment routes. */
  readonly maxAttachments?: number
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<
    Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>
  >
}

export interface HostRouteContext {
  readonly streams: Set<ServerResponse>
  readonly submit?: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>
}

export type HostRouteRegistrar = Router | ((context: HostRouteContext) => Router)
