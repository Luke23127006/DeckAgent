import type { AgentRequest, HistoryMessage, RequestReply, RequestSnapshot } from '@deckagent/host-api'
import { userQuestion } from './user-question.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function snapshot(value: unknown, requestId?: string, sessionId?: string): RequestSnapshot {
  if (
    !object(value) ||
    (value.revision !== undefined &&
      (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0)) ||
    typeof value.requestId !== 'string' ||
    !/^[\w-]+$/.test(value.requestId) ||
    typeof value.sessionId !== 'string' ||
    (requestId !== undefined && value.requestId !== requestId) ||
    (sessionId !== undefined && value.sessionId !== sessionId) ||
    !/^[\w-]{1,100}$/.test(value.sessionId) ||
    !['running', 'awaiting_user', 'completed', 'failed', 'cancelled'].includes(String(value.status))
  )
    throw new Error('INVALID_RESPONSE')
  const result = value.result
  const revision = typeof value.revision === 'number' ? { revision: value.revision } : {}
  if (value.status !== 'awaiting_user' && value.question !== undefined) throw new Error('INVALID_RESPONSE')
  if (value.status === 'awaiting_user') {
    if (result !== undefined) throw new Error('INVALID_RESPONSE')
    return {
      ...revision,
      requestId: value.requestId,
      sessionId: value.sessionId,
      status: 'awaiting_user',
      question: userQuestion(value.question),
    }
  }
  if (value.status === 'running') {
    if (result !== undefined) throw new Error('INVALID_RESPONSE')
    return { ...revision, requestId: value.requestId, sessionId: value.sessionId, status: 'running' }
  }
  if (
    !object(result) ||
    result.status !== value.status ||
    typeof result.text !== 'string' ||
    typeof result.steps !== 'number' ||
    !Number.isSafeInteger(result.steps) ||
    result.steps < 0
  )
    throw new Error('INVALID_RESPONSE')
  const base = { ...revision, requestId: value.requestId, sessionId: value.sessionId }
  if (result.status === 'completed')
    return { ...base, status: 'completed', result: { status: 'completed', text: result.text, steps: result.steps } }
  if (
    (result.status !== 'failed' && result.status !== 'cancelled') ||
    !object(result.error) ||
    typeof result.error.code !== 'string' ||
    !/^[A-Z_]{1,64}$/.test(result.error.code) ||
    typeof result.error.message !== 'string'
  )
    throw new Error('INVALID_RESPONSE')
  return {
    ...base,
    status: result.status,
    result: {
      status: result.status,
      text: result.text,
      steps: result.steps,
      error: { code: result.error.code, message: result.error.message },
    },
  }
}

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
      const data: unknown = await response.json()
      const allowed = [
        'AUTH_REQUIRED',
        'SESSION_BUSY',
        'MODEL_NOT_SELECTABLE',
        'PROVIDER_CREDENTIALS',
        'SESSION_UNAVAILABLE',
        'REQUEST_NOT_FOUND',
        'OUTLINE_STALE',
        'OUTLINE_ALREADY_CONFIRMED',
        'OUTLINE_READ_ONLY',
        'OUTLINE_LIMIT',
        'REPLY_STALE',
        'REPLY_CONFLICT',
        'INVALID_REPLY',
      ]
      const code =
        object(data) && object(data.error) && typeof data.error.code === 'string' && allowed.includes(data.error.code)
          ? data.error.code
          : response.status === 401
            ? 'AUTH_REQUIRED'
            : 'HOST_REQUEST_FAILED'
      throw new Error(code)
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
      undefined,
      request.sessionId,
    )
  }

  async snapshot(id: string): Promise<RequestSnapshot> {
    return snapshot(await (await this.request(`/api/requests/${encodeURIComponent(id)}`)).json(), id)
  }

  async reply(id: string, reply: RequestReply): Promise<RequestSnapshot> {
    return snapshot(
      await (
        await this.request(`/api/requests/${encodeURIComponent(id)}/reply`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(reply),
        })
      ).json(),
      id,
      reply.sessionId,
    )
  }

  async stop(id: string): Promise<RequestSnapshot> {
    return snapshot(
      await (await this.request(`/api/requests/${encodeURIComponent(id)}/stop`, { method: 'POST' })).json(),
      id,
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
      return {
        role: message.role,
        content: message.content,
        ...(typeof message.toolCallId === 'string' ? { toolCallId: message.toolCallId } : {}),
        ...(typeof message.name === 'string' ? { name: message.name } : {}),
        ...(typeof message.isError === 'boolean' ? { isError: message.isError } : {}),
      }
    })
  }

  /** Each connection starts with the current snapshot; reconnect does not replay work. */
  async *watch(id: string, signal?: AbortSignal): AsyncIterable<RequestSnapshot> {
    const response = await this.request(`/api/requests/${encodeURIComponent(id)}/events`, signal ? { signal } : {})
    if (!response.body || !response.headers.get('content-type')?.startsWith('text/event-stream'))
      throw new Error('INVALID_RESPONSE')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      while (true) {
        const part = await reader.read()
        if (part.done) throw new Error('CONNECTION_LOST')
        buffer += decoder.decode(part.value, { stream: true }).replace(/\r\n/g, '\n')
        if (buffer.length > 1024 * 1024) throw new Error('INVALID_RESPONSE')
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const frame = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          if (frame.startsWith('event: snapshot\n')) {
            const data = frame
              .split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.slice(6))
              .join('\n')
            const value = snapshot(JSON.parse(data), id)
            if (value.requestId !== id) throw new Error('INVALID_RESPONSE')
            yield value
            if (value.status !== 'running' && value.status !== 'awaiting_user') return
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
