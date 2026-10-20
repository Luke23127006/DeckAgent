import type { JsonValue, ModelEvent, ModelRequest } from '@deckagent/agent-runtime'
import { args, array, index, json, object, protocolError, string } from './wire.ts'

export function chatBody(request: ModelRequest): Record<string, unknown> {
  return {
    model: request.selection.model, stream: true,
    messages: request.messages.map(message => {
      if (message.role === 'tool') return { role: 'tool', content: message.content, tool_call_id: message.toolCallId }
      if (message.role !== 'assistant') return { role: message.role, content: message.content }
      const state = message.providerState?.provider === request.selection.provider && message.providerState.model === request.selection.model ? message.providerState.data : undefined
      const reasoning = state && typeof state === 'object' && !Array.isArray(state) && state.protocol === 'chat-completions' ? state.reasoning_content : undefined
      return {
        role: 'assistant', content: message.content,
        ...(typeof reasoning === 'string' ? { reasoning_content: reasoning } : {}),
        ...(message.toolCalls?.length ? { tool_calls: message.toolCalls.map(call => ({
          id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })) } : {}),
      }
    }),
    ...(request.tools.length ? { tools: request.tools.map(tool => ({ type: 'function', function: tool })) } : {}),
  }
}

export async function* chatEvents(source: AsyncIterable<string>): AsyncGenerator<ModelEvent> {
  const calls = new Map<number, { id: string; name: string; input: string }>()
  let finish: string | undefined
  let reasoning = ''
  let done = false
  for await (const raw of source) {
    if (raw === '[DONE]') { done = true; break }
    const packet = object(json(raw))
    if (packet.error) protocolError()
    for (const entry of array(packet.choices)) {
      const choice = object(entry)
      if (choice.index !== 0 || finish) protocolError()
      const delta = object(choice.delta)
      if (delta.refusal) protocolError()
      if (delta.content != null) yield { type: 'text-delta', text: string(delta.content) }
      if (delta.reasoning_content != null) reasoning += string(delta.reasoning_content)
      if (delta.tool_calls != null) for (const item of array(delta.tool_calls)) {
        const part = object(item)
        const key = index(part.index)
        let call = calls.get(key)
        if (!call) { call = { id: '', name: '', input: '' }; calls.set(key, call) }
        if (part.id != null) call.id += string(part.id)
        if (part.type != null && part.type !== 'function') protocolError()
        if (part.function != null) {
          const fn = object(part.function)
          if (fn.name != null) call.name += string(fn.name)
          if (fn.arguments != null) call.input += string(fn.arguments)
          if (call.input.length > 1_048_576) protocolError()
        }
      }
      if (choice.finish_reason != null) finish = string(choice.finish_reason)
    }
  }
  if (!done || !['stop', 'tool_calls'].includes(finish ?? '') || (finish === 'tool_calls') !== (calls.size > 0)) protocolError()
  if (reasoning) yield { type: 'provider-state', state: { protocol: 'chat-completions', reasoning_content: reasoning } satisfies JsonValue }
  for (const [, call] of [...calls].sort(([a], [b]) => a - b)) {
    if (!call.id || !call.name) protocolError()
    yield { type: 'tool-call', call: { id: call.id, name: call.name, arguments: args(json(call.input)) } }
  }
  yield { type: 'finish', reason: calls.size ? 'tool-calls' : 'stop' }
}
