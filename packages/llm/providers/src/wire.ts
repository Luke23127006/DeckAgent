import { RuntimeError } from '@deckagent/agent-runtime'
import type { JsonValue, ToolArguments } from '@deckagent/agent-runtime'

export function protocolError(): never {
  throw new RuntimeError('MODEL_PROTOCOL', 'Provider returned an unsupported or incomplete response')
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return protocolError()
  return value as Record<string, unknown>
}
export function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) return protocolError()
  return value
}
export function string(value: unknown): string {
  if (typeof value !== 'string') return protocolError()
  return value
}
export function index(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) return protocolError()
  return value as number
}
export function json(value: string): unknown {
  try { return JSON.parse(value) as unknown } catch { return protocolError() }
}
export function args(value: unknown): ToolArguments {
  return object(value) as ToolArguments
}
export function data(value: unknown): JsonValue {
  // Only parsed provider JSON / objects built from it enter opaque state.
  return structuredClone(value) as JsonValue
}

/** SSE framing is independent of provider events and HTTP chunk boundaries. */
export async function* events(response: Response): AsyncGenerator<string> {
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream') || !response.body) protocolError()
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let buffer = ''
  let lines: string[] = []
  let eventSize = 0
  try {
    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      buffer += decoder.decode(result.value, { stream: !done })
      if (buffer.length > 1_048_576) protocolError()
      while (true) {
        const match = /\r\n|\r|\n/.exec(buffer)
        if (!match || (!done && match[0] === '\r' && match.index === buffer.length - 1)) break
        const line = buffer.slice(0, match.index)
        buffer = buffer.slice(match.index + match[0].length)
        if (!line) {
          if (lines.length) yield lines.join('\n')
          lines = []
          eventSize = 0
        } else if (line.startsWith('data:')) {
          const part = line.slice(5).replace(/^ /, '')
          eventSize += part.length
          if (eventSize > 1_048_576) protocolError()
          lines.push(part)
        }
      }
    }
    // SSE dispatch requires a blank line; an unterminated final frame is invalid.
    if (buffer.trim() || lines.length) protocolError()
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
