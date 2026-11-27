/**
 * The structured events of `opencode run --format json` that DeckAgent reads. Every other field, and any event of
 * another type, is ignored: raw runtime output is input to the Host, never a product record or UI payload.
 */
export type OpenCodeEvent =
  | { readonly type: 'step_start'; readonly sessionId?: string; readonly messageId?: string }
  | {
      readonly type: 'text'
      readonly sessionId?: string
      readonly messageId?: string
      readonly partId: string
      readonly text: string
    }
  | { readonly type: 'step_finish'; readonly sessionId?: string; readonly messageId?: string; readonly reason?: string }
  | {
      readonly type: 'tool'
      readonly sessionId?: string
      readonly callId: string
      readonly tool: string
      readonly status: 'running' | 'completed' | 'failed'
    }
  | {
      readonly type: 'error'
      readonly sessionId?: string
      readonly name?: string
      readonly statusCode?: number
      readonly imageUnsupported?: true
    }
  | { readonly type: 'other'; readonly sessionId?: string }

/**
 * The provider said the conversation does not fit the model's context. With auto compaction (1.19.5), OpenCode
 * reports this error, writes a summary in a new assistant message and goes on; a second one while summarizing
 * means the summary could not be written.
 */
export function isContextOverflow(event: OpenCodeEvent): boolean {
  return event.type === 'error' && event.name === 'ContextOverflowError'
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const nativeId = /^[\w.-]{1,200}$/

/** `undefined` for a value that is not an event object at all; the adapter treats it as a protocol failure. */
export function parseEvent(value: unknown): OpenCodeEvent | undefined {
  if (!record(value) || typeof value.type !== 'string') return undefined
  const sessionId = typeof value.sessionID === 'string' && nativeId.test(value.sessionID) ? value.sessionID : undefined
  const base = sessionId ? { sessionId } : {}
  const part = record(value.part) ? value.part : undefined
  // Parts carry the native message they belong to: assistant steps have a step_start, user parts never do.
  const message =
    part && typeof part.messageID === 'string' && nativeId.test(part.messageID) ? { messageId: part.messageID } : {}
  switch (value.type) {
    case 'step_start':
      return { type: 'step_start', ...base, ...message }
    case 'text': {
      if (!part || typeof part.text !== 'string') return { type: 'other', ...base }
      const partId = typeof part.id === 'string' && nativeId.test(part.id) ? part.id : 'text'
      return { type: 'text', ...base, ...message, partId, text: part.text }
    }
    case 'step_finish':
      return {
        type: 'step_finish',
        ...base,
        ...message,
        ...(part && typeof part.reason === 'string' ? { reason: part.reason } : {}),
      }
    case 'tool_use': {
      if (!part) return { type: 'other', ...base }
      const state = record(part.state) ? part.state : undefined
      const status = state?.status === 'completed' ? 'completed' : state?.status === 'error' ? 'failed' : 'running'
      const callId =
        typeof part.callID === 'string' && nativeId.test(part.callID)
          ? part.callID
          : typeof part.id === 'string' && nativeId.test(part.id)
            ? part.id
            : 'call'
      const tool = typeof part.tool === 'string' && /^[\w.-]{1,64}$/.test(part.tool) ? part.tool : 'tool'
      return { type: 'tool', ...base, callId, tool, status }
    }
    case 'error': {
      const error = record(value.error) ? value.error : undefined
      const data = error && record(error.data) ? error.data : undefined
      const status = data?.statusCode
      const explanation = [data?.message, data?.responseBody].filter(item => typeof item === 'string').join(' ')
      const imageUnsupported =
        /image|vision|multimodal/i.test(explanation) &&
        /not support|unsupported|cannot (?:read|process)|only supports? text/i.test(explanation)
      return {
        type: 'error',
        ...base,
        ...(imageUnsupported ? { imageUnsupported: true as const } : {}),
        ...(error && typeof error.name === 'string' && /^\w{1,64}$/.test(error.name) ? { name: error.name } : {}),
        ...(typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599
          ? { statusCode: status }
          : {}),
      }
    }
    default:
      return { type: 'other', ...base }
  }
}

/** A product error code from runtime evidence. Provider messages are never copied (they can echo keys). */
export function errorCode(event: Extract<OpenCodeEvent, { type: 'error' }>): string {
  if (event.statusCode === 401 || event.statusCode === 403 || event.name === 'ProviderAuthError') return 'PROVIDER_AUTH'
  if (event.statusCode === 429) return 'PROVIDER_RATE_LIMIT'
  if (event.name && /context|overflow/i.test(event.name)) return 'CONTEXT_LIMIT'
  if (event.imageUnsupported) return 'IMAGE_INPUT_UNAVAILABLE'
  if (event.statusCode === 404) return 'PROVIDER_MODEL_UNAVAILABLE'
  if (event.statusCode !== undefined) return 'PROVIDER_HTTP'
  return 'RUNTIME_FAILED'
}
