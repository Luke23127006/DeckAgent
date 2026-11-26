import type { DeckReader, InterviewState, OutlineReader } from '@deckagent/deck'
import type {
  AgentRequest,
  AttachmentView,
  BriefView,
  ChatDraft,
  ConfirmationResult,
  RequestSnapshot,
  StoredActivity,
  StoredRequest,
  TerminalStatus,
  WebPreferences,
  WebSettings,
} from '@deckagent/host-contracts'
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
  readonly confirmations?: {
    confirm(
      sessionId: string,
      value: unknown,
      submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>,
    ): Promise<ConfirmationResult>
  }
  readonly briefs?: BriefManagement
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
  readonly management?: WebManagement
  readonly routes?: readonly Router[]
  readonly attachments?: AttachmentManagement
  readonly decks?: DeckReader
  readonly outlines?: OutlineReader
  /** Fixed trusted assets only. Workspace files are never exposed over HTTP. */
  readonly assets?: Readonly<
    Record<string, { readonly contentType: string; readonly body: string; readonly sandboxed?: boolean }>
  >
}

export interface BriefManagement {
  interview?(sessionId: string): Promise<{ readonly brief: BriefView; readonly state: InterviewState }>
  get(sessionId: string, version?: number): Promise<BriefView>
  save(sessionId: string, value: unknown): Promise<BriefView>
}

export interface AttachmentManagement {
  readonly maxBytes: number
  readonly maxFiles: number
  upload(input: {
    readonly sessionId: string
    readonly name: string
    readonly expectedRevision: number
    readonly bytes: AsyncIterable<Uint8Array>
    readonly signal: AbortSignal
    readonly complete?: Promise<void>
  }): Promise<{ readonly attachment: AttachmentView; readonly draft: ChatDraft }>
  get(sessionId: string, attachmentId: string): Promise<AttachmentView>
  remove(sessionId: string, attachmentId: string, expectedRevision: number): Promise<ChatDraft>
  preview(
    sessionId: string,
    attachmentId: string,
    signal: AbortSignal,
  ): Promise<{ readonly body: Uint8Array; readonly contentType: string }>
}

/** Management inputs are untrusted JSON; application validates before mutating storage. */
export interface WebManagement {
  readonly research?: {
    save(value: unknown): Promise<void>
    remove(): Promise<void>
    sources(sessionId: string): Promise<unknown>
  }
  /** Optional: an older application without it simply has no `/api/preferences`. */
  readonly preferences?: {
    get(): Promise<WebPreferences>
    save(value: unknown): Promise<WebPreferences>
  }
  settings(): Promise<WebSettings>
  saveProvider(id: string, value: unknown): Promise<void>
  deleteProvider(id: string): Promise<void>
  catalog(id: string): Promise<readonly string[]>
  activities(id: string): Promise<readonly StoredActivity[]>
  requests(id: string): Promise<readonly StoredRequest[]>
  readonly drafts?: {
    get(sessionId: string): Promise<ChatDraft>
    save(sessionId: string, value: unknown): Promise<ChatDraft>
  }
}
