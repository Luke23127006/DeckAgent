import { RequestValidationError } from '@deckagent/host-contracts'

export const CLIENT_ERROR_CODES = [
  'APPROVAL_CONFLICT',
  'APPROVAL_NOT_FOUND',
  'ATTACHMENT_CONFLICT',
  'ATTACHMENT_COUNT_EXCEEDED',
  'ATTACHMENT_NOT_FOUND',
  'ATTACHMENT_NOT_READY',
  'ATTACHMENT_NOT_SAVED',
  'ATTACHMENT_REJECTED',
  'ATTACHMENT_TOO_LARGE',
  'ATTACHMENT_TYPE_UNSUPPORTED',
  'ATTACHMENT_UNREADABLE',
  'AUTH_REQUIRED',
  'BRIEF_LOCKED',
  'BRIEF_PROPOSAL_REQUIRED',
  'BRIEF_REPAIR_LIMIT',
  'BRIEF_STALE',
  'CATALOG_UNAVAILABLE',
  'CHANGES_CONNECTION_LOST',
  'CHANGES_REQUEST_FAILED',
  'CHAT_UNREADABLE',
  'CONFIRMATION_CONFLICT',
  'CONNECTION_LOST',
  'CONTEXT_LIMIT',
  'CONTEXT_SUMMARY_FAILED',
  'CREDENTIAL_NOT_SAVED',
  'CREDENTIAL_STORE_UNAVAILABLE',
  'DESIGN_LAYOUT_INCOMPATIBLE',
  'DRAFT_CONFLICT',
  'DRAFT_NOT_SAVED',
  'DRAFT_TOO_LARGE',
  'GENERATION_FAILED',
  'GENERATION_INCOMPLETE',
  'HOST_BUSY',
  'HOST_CLOSED',
  'HOST_REQUEST_FAILED',
  'HOST_RESTARTED',
  'HOST_STOPPED',
  'IMAGE_INPUT_UNAVAILABLE',
  'IMAGE_PREPARATION_REQUIRED',
  'INVALID_PROVIDER',
  'INVALID_REQUEST',
  'INVALID_RESPONSE',
  'MODEL_NOT_SELECTABLE',
  'NEW_ENDPOINT_REQUIRES_KEY',
  'NO_SELECTABLE_MODEL',
  'OUTLINE_REPAIR_LIMIT',
  'OUTLINE_STALE',
  'OUTLINE_UNAVAILABLE',
  'PARSING_LIMIT_EXCEEDED',
  'PREFERENCES_STALE',
  'PROTOCOL_IMMUTABLE',
  'PROVIDER_AUTH',
  'PROVIDER_BUSY',
  'PROVIDER_CHECK_FAILED',
  'PROVIDER_HTTP',
  'PROVIDER_ID_TAKEN',
  'PROVIDER_KEY_REQUIRED',
  'PROVIDER_KEY_REFUSED',
  'PROVIDER_KEY_UNAVAILABLE',
  'PROVIDER_MODEL_UNAVAILABLE',
  'PROVIDER_NAME_EXISTS',
  'PROVIDER_NO_ANSWER',
  'PROVIDER_NOT_FOUND',
  'PROVIDER_RATE_LIMIT',
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNSUPPORTED',
  'PROVIDERS_STALE',
  'REQUEST_CLOSED',
  'REQUEST_EMPTY',
  'REQUEST_FAILED',
  'REQUEST_NOT_FOUND',
  'REQUEST_NOT_SAVED',
  'REQUEST_TEXT_TOO_LONG',
  'REQUEST_TIMEOUT',
  'REQUESTS_UNAVAILABLE',
  'RESEARCH_FREE_ONLY',
  'RESEARCH_IMAGE_ARGUMENTS_INVALID',
  'RESEARCH_IMAGE_CONTEXT_REQUIRED',
  'RESEARCH_IMAGE_SELECTION_STALE',
  'RESEARCH_KEY_REJECTED',
  'RESEARCH_KEY_UNAVAILABLE',
  'RESEARCH_NOT_SAVED',
  'RESEARCH_QUOTA_EXHAUSTED',
  'RESEARCH_UNAVAILABLE',
  'RUNTIME_CONFIG_UNSAFE',
  'RUNTIME_FAILED',
  'RUNTIME_INCOMPLETE',
  'RUNTIME_PROTOCOL',
  'RUNTIME_UNAVAILABLE',
  'RUNTIME_VERSION_UNSUPPORTED',
  'SESSION_BUSY',
  'SESSION_NOT_FOUND',
  'SESSION_UNAVAILABLE',
  'SETTINGS_REQUEST_FAILED',
  'SLIDE_CORRECTION_LIMIT',
  'SOURCE_CHANGED',
  'SOURCE_UNAVAILABLE',
  'UPLOAD_CANCELLED',
  'WORKSPACES_STALE',
  'WORKSPACE_DEFAULT',
  'WORKSPACE_FOLDER_IN_USE',
  'WORKSPACE_FOLDER_INVALID',
  'WORKSPACE_FOLDER_REFUSED',
  'WORKSPACE_FOLDER_REQUIRED',
  'WORKSPACE_FOLDER_UNREADABLE',
  'WORKSPACE_NAME_EMPTY',
  'WORKSPACE_NAME_TOO_LONG',
  'WORKSPACE_NOT_FOUND',
  'WORKSPACE_REQUEST_ACTIVE',
] as const

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number]

export interface ApiClientConfig {
  readonly origin: string
  readonly token: string
}

export interface SseFrameOptions {
  readonly maxBufferBytes: number
  readonly lostError: ClientErrorCode
  readonly invalidError: ClientErrorCode
  readonly eventName: string
}

/** A refused Host call: `code` is a stable union member; `detail` holds only safe facts such as a field name. */
export class ApiClientError extends Error {
  readonly code: ClientErrorCode
  readonly status: number
  readonly detail: Readonly<Record<string, string | boolean>>

  constructor(code: ClientErrorCode, status: number, detail: Readonly<Record<string, string | boolean>> = {}) {
    super(code)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.detail = detail
  }
}

let config: ApiClientConfig = { origin: '', token: '' }

/** Reads the `token` parameter of the URL fragment. The fragment never goes to the Host. */
export function readTokenFromHash(hash: string): string {
  return new URLSearchParams(hash.replace(/^#/, '')).get('token') ?? ''
}

/** Stores the origin and the token once, before the first request. */
export function configureApiClient(next: ApiClientConfig): void {
  config = next
}

export function getApiClientConfig(): ApiClientConfig {
  return config
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isClientErrorCode(value: unknown): value is ClientErrorCode {
  return typeof value === 'string' && (CLIENT_ERROR_CODES as readonly string[]).includes(value)
}

/** Sends an authenticated request: credentials never enter a query string, a referrer or a redirect. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('authorization', `Bearer ${config.token}`)
  return fetch(`${config.origin}${path}`, {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    headers,
  })
}

/** Turns a refused Host reply into a typed client error. */
export async function readApiError(response: Response): Promise<ApiClientError> {
  const value: unknown = await response.json().catch(() => undefined)
  const error = isRecord(value) && isRecord(value.error) ? value.error : undefined
  const detail: Record<string, string | boolean> = {}
  if (error && isRecord(error.detail))
    for (const [key, item] of Object.entries(error.detail))
      if (typeof item === 'string' || typeof item === 'boolean') detail[key] = item
  const code = isClientErrorCode(error?.code)
    ? error.code
    : response.status === 401
      ? 'AUTH_REQUIRED'
      : 'HOST_REQUEST_FAILED'
  return new ApiClientError(code, response.status, detail)
}

/** Fetches JSON, refuses an unknown error code and turns a malformed body into `INVALID_RESPONSE`. */
export async function apiJson<T>(path: string, decode: (value: unknown) => T, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init)
  if (!response.ok) throw await readApiError(response)
  let value: unknown
  try {
    value = await response.json()
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', response.status)
  }
  try {
    return decode(value)
  } catch (error) {
    if (error instanceof RequestValidationError || (error instanceof Error && error.message === 'INVALID_RESPONSE'))
      throw new ApiClientError('INVALID_RESPONSE', response.status)
    throw error
  }
}

/** Reads `event: <name>` frames from a text/event-stream response and yields the `data:` payload of each frame. */
export async function* readSseFrames(response: Response, options: SseFrameOptions): AsyncGenerator<string> {
  if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream'))
    throw new ApiClientError(options.invalidError, response.status)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const eventLine = `event: ${options.eventName}`
  let buffer = ''
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) throw new ApiClientError(options.lostError, response.status)
      buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
      if (buffer.length > options.maxBufferBytes) throw new ApiClientError(options.invalidError, response.status)
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        // A frame can start with its id line, so each line of the frame is checked.
        if (frame.split('\n').includes(eventLine))
          yield frame
            .split('\n')
            .filter(line => line.startsWith('data: '))
            .map(line => line.slice(6))
            .join('\n')
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    // Cancelling a read-only stream cannot change the Host-owned outcome.
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
