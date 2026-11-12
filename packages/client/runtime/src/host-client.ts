import type {
  AgentRequest,
  AttachmentView,
  HistoryMessage,
  RequestEvent,
  RequestSnapshot,
  RequestStatus,
} from '@deckagent/host-api'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const statuses: readonly RequestStatus[] = [
  'active',
  'waiting_approval',
  'completed',
  'failed',
  'stopped',
  'interrupted',
]
const code = /^[A-Z][A-Z0-9_]{0,63}$/
const requestId = /^[\w-]{1,100}$/

function historyAttachment(value: unknown): AttachmentView {
  if (
    !object(value) ||
    typeof value.attachmentId !== 'string' ||
    !/^att-[a-f0-9-]{36}$/.test(value.attachmentId) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !['preparing', 'ready', 'rejected'].includes(String(value.state)) ||
    typeof value.byteSize !== 'number' ||
    !Number.isSafeInteger(value.byteSize) ||
    value.byteSize < 0 ||
    (value.detectedType !== undefined && typeof value.detectedType !== 'string') ||
    (value.rejectionCode !== undefined && (typeof value.rejectionCode !== 'string' || !code.test(value.rejectionCode)))
  )
    throw new Error('INVALID_RESPONSE')
  const state = value.state
  if (state !== 'preparing' && state !== 'ready' && state !== 'rejected') throw new Error('INVALID_RESPONSE')
  let source: AttachmentView['source']
  if (value.source !== undefined) {
    const item = value.source
    if (
      !object(item) ||
      typeof item.sourceId !== 'string' ||
      !item.sourceId ||
      typeof item.version !== 'number' ||
      !Number.isSafeInteger(item.version) ||
      item.version < 1 ||
      item.kind !== 'attachment' ||
      typeof item.label !== 'string'
    )
      throw new Error('INVALID_RESPONSE')
    source = { sourceId: item.sourceId, version: item.version, kind: 'attachment', label: item.label }
  }
  return {
    attachmentId: value.attachmentId,
    name: value.name,
    state,
    byteSize: value.byteSize,
    ...(typeof value.detectedType === 'string' ? { detectedType: value.detectedType } : {}),
    ...(typeof value.rejectionCode === 'string' ? { rejectionCode: value.rejectionCode } : {}),
    ...(source ? { source } : {}),
  }
}

/** Whether a request still holds its chat's active slot. */
export function isActive(status: RequestStatus): boolean {
  return status === 'active' || status === 'waiting_approval'
}

function status(value: unknown): RequestStatus {
  const found = statuses.find(item => item === value)
  if (!found) throw new Error('INVALID_RESPONSE')
  return found
}

function snapshot(value: unknown): RequestSnapshot {
  if (
    !object(value) ||
    typeof value.requestId !== 'string' ||
    !requestId.test(value.requestId) ||
    typeof value.sessionId !== 'string' ||
    !/^[\w-]{1,100}$/.test(value.sessionId) ||
    typeof value.text !== 'string' ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 0 ||
    (value.errorCode !== undefined && (typeof value.errorCode !== 'string' || !code.test(value.errorCode)))
  )
    throw new Error('INVALID_RESPONSE')
  return {
    requestId: value.requestId,
    sessionId: value.sessionId,
    status: status(value.status),
    text: value.text,
    sequence: value.sequence,
    ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
  }
}

/** Only the documented event shapes; anything else is a broken stream, never rendered. */
export function requestEvent(value: unknown): RequestEvent {
  if (
    !object(value) ||
    typeof value.requestId !== 'string' ||
    !requestId.test(value.requestId) ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.timestamp !== 'string'
  )
    throw new Error('INVALID_RESPONSE')
  const base = { requestId: value.requestId, sequence: value.sequence, timestamp: value.timestamp }
  if (value.kind === 'status') {
    if (value.errorCode !== undefined && (typeof value.errorCode !== 'string' || !code.test(value.errorCode)))
      throw new Error('INVALID_RESPONSE')
    return {
      ...base,
      kind: 'status',
      status: status(value.status),
      ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
    }
  }
  if (
    value.kind === 'activity' &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (value.type === 'model' || value.type === 'tool') &&
    ['running', 'completed', 'failed', 'stopped'].includes(String(value.status))
  )
    return {
      ...base,
      kind: 'activity',
      id: value.id,
      label: value.label,
      type: value.type,
      status: value.status as 'running' | 'completed' | 'failed' | 'stopped',
    }
  if (value.kind === 'text' && typeof value.part === 'string' && typeof value.text === 'string')
    return { ...base, kind: 'text', part: value.part, text: value.text }
  if (value.kind === 'notice' && typeof value.code === 'string' && code.test(value.code))
    return { ...base, kind: 'notice', code: value.code }
  throw new Error('INVALID_RESPONSE')
}

/** A refused Host call: `message` is the stable code; `detail` holds only safe facts such as a reason word. */
export class HostRequestError extends Error {
  constructor(
    code: string,
    readonly detail: Readonly<Record<string, string | boolean>> = {},
  ) {
    super(code)
    this.name = 'HostRequestError'
  }
}

const allowed = [
  'AUTH_REQUIRED',
  'SESSION_BUSY',
  'HOST_BUSY',
  'HOST_CLOSED',
  'MODEL_NOT_SELECTABLE',
  'NO_SELECTABLE_MODEL',
  'PROVIDER_KEY_UNAVAILABLE',
  'RUNTIME_UNAVAILABLE',
  'RUNTIME_VERSION_UNSUPPORTED',
  'REQUEST_NOT_FOUND',
  'REQUEST_NOT_SAVED',
  'REQUEST_TEXT_TOO_LONG',
  'CHAT_UNREADABLE',
  'SESSION_NOT_FOUND',
  'SESSION_UNAVAILABLE',
  'REQUESTS_UNAVAILABLE',
  'INVALID_REQUEST',
]

/** Uses fetch for authenticated SSE: credentials never enter query strings or history. */
export class HostClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.origin}${path}`, {
      ...init,
      redirect: 'error',
      credentials: 'omit',
      headers: { ...init.headers, authorization: `Bearer ${this.token}` },
    })
    if (!response.ok) {
      const data: unknown = await response.json().catch(() => undefined)
      const error = object(data) && object(data.error) ? data.error : undefined
      const known = error && typeof error.code === 'string' && allowed.includes(error.code) ? error.code : undefined
      const detail: Record<string, string | boolean> = {}
      if (known && error && object(error.detail))
        for (const [key, item] of Object.entries(error.detail))
          if (typeof item === 'string' || typeof item === 'boolean') detail[key] = item
      throw new HostRequestError(known ?? (response.status === 401 ? 'AUTH_REQUIRED' : 'HOST_REQUEST_FAILED'), detail)
    }
    return response
  }

  async send(request: AgentRequest): Promise<RequestSnapshot> {
    return snapshot(
      await (
        await this.request('/api/requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request),
        })
      ).json(),
    )
  }

  async snapshot(id: string): Promise<RequestSnapshot> {
    return snapshot(await (await this.request(`/api/requests/${encodeURIComponent(id)}`)).json())
  }

  async stop(id: string): Promise<RequestSnapshot> {
    return snapshot(
      await (await this.request(`/api/requests/${encodeURIComponent(id)}/stop`, { method: 'POST' })).json(),
    )
  }

  async history(id: string): Promise<readonly HistoryMessage[]> {
    const data: unknown = await (await this.request(`/api/sessions/${encodeURIComponent(id)}/history`)).json()
    if (!Array.isArray(data)) throw new Error('INVALID_RESPONSE')
    return data.map((message: unknown): HistoryMessage => {
      if (
        !object(message) ||
        (message.role !== 'user' && message.role !== 'assistant' && message.role !== 'tool') ||
        typeof message.content !== 'string' ||
        (message.interrupted !== undefined && (message.role !== 'assistant' || message.interrupted !== true)) ||
        (message.toolCallId !== undefined &&
          (message.role !== 'tool' ||
            typeof message.toolCallId !== 'string' ||
            !message.toolCallId ||
            message.toolCallId.length > 2000)) ||
        (message.name !== undefined &&
          (message.role !== 'tool' ||
            typeof message.name !== 'string' ||
            !/^[A-Za-z0-9_-]{1,64}$/.test(message.name))) ||
        (message.isError !== undefined && (message.role !== 'tool' || typeof message.isError !== 'boolean'))
      )
        throw new Error('INVALID_RESPONSE')
      if (message.attachments !== undefined && (message.role !== 'user' || !Array.isArray(message.attachments)))
        throw new Error('INVALID_RESPONSE')
      return {
        role: message.role,
        content: message.content,
        ...(Array.isArray(message.attachments) ? { attachments: message.attachments.map(historyAttachment) } : {}),
        ...(message.interrupted === true ? { interrupted: true as const } : {}),
        ...(typeof message.toolCallId === 'string' ? { toolCallId: message.toolCallId } : {}),
        ...(typeof message.name === 'string' ? { name: message.name } : {}),
        ...(typeof message.isError === 'boolean' ? { isError: message.isError } : {}),
      }
    })
  }

  /**
   * Saved events after `after`, then live ones, until the request ends. A dropped connection throws
   * `CONNECTION_LOST`; calling again with the last sequence continues with no gap and no repeat.
   */
  async *watch(id: string, signal?: AbortSignal, after = 0): AsyncIterable<RequestEvent> {
    const response = await this.request(`/api/requests/${encodeURIComponent(id)}/events`, {
      headers: after ? { 'last-event-id': String(after) } : {},
      ...(signal ? { signal } : {}),
    })
    if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream'))
      throw new Error('INVALID_RESPONSE')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let last = after
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) {
          // The Host ends the stream after a terminal status or under back-pressure; only the first is an end.
          throw new Error('CONNECTION_LOST')
        }
        buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
        if (buffer.length > 4 * 1024 * 1024) throw new Error('INVALID_RESPONSE')
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          if (frame.split('\n').includes('event: request')) {
            const data = frame
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6))
              .join('\n')
            const event = requestEvent(JSON.parse(data))
            if (event.requestId !== id) throw new Error('INVALID_RESPONSE')
            if (event.sequence > last) {
              last = event.sequence
              yield event
              if (event.kind === 'status' && !isActive(event.status)) return
            }
          }
          boundary = buffer.indexOf('\n\n')
        }
      }
    } finally {
      // Stream cancellation cannot change the Host-owned request's outcome.
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
}
