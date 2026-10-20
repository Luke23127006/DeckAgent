import type { ModelEvent, ModelRequest } from '@deckagent/agent-runtime'
import { args, array, data, index, json, object, protocolError, string } from './wire.ts'

export function anthropicBody(request: ModelRequest): Record<string, unknown> {
  const messages: { role: string; content: unknown[] }[] = []
  const system: string[] = []
  for (const message of request.messages) {
    if (message.role === 'system') { system.push(message.content); continue }
    const role = message.role === 'assistant' ? 'assistant' : 'user'
    let content: unknown[]
    if (message.role === 'tool') content = [{ type: 'tool_result', tool_use_id: message.toolCallId, content: message.content, is_error: message.isError }]
    else if (message.role === 'assistant') {
      const state = message.providerState?.provider === request.selection.provider && message.providerState.model === request.selection.model ? message.providerState.data : undefined
      if (state && typeof state === 'object' && !Array.isArray(state) && state.protocol === 'anthropic-messages') content = array(state.content)
      else content = [
        ...(message.content ? [{ type: 'text', text: message.content }] : []),
        ...(message.toolCalls ?? []).map(call => ({ type: 'tool_use', id: call.id, name: call.name, input: call.arguments })),
      ]
    } else content = [{ type: 'text', text: message.content }]
    if (!content.length) continue
    const previous = messages.at(-1)
    if (previous?.role === role) previous.content.push(...content)
    else messages.push({ role, content: [...content] })
  }
  return {
    model: request.selection.model, stream: true, messages,
    ...(system.length ? { system: system.join('\n\n') } : {}),
    ...(request.tools.length ? { tools: request.tools.map(tool => ({ name: tool.name, description: tool.description, input_schema: tool.parameters })) } : {}),
  }
}

export async function* anthropicEvents(source: AsyncIterable<string>): AsyncGenerator<ModelEvent> {
  const blocks = new Map<number, { block: Record<string, unknown>; input: string; closed: boolean }>()
  let started = false
  let stopped = false
  let finish: string | undefined
  for await (const raw of source) {
    const packet = object(json(raw))
    if (stopped || packet.type === 'error') protocolError()
    if (packet.type === 'ping') continue
    if (packet.type === 'message_start') {
      if (started) protocolError()
      started = true
    } else if (!started) protocolError()
    else if (packet.type === 'content_block_start') {
      const key = index(packet.index)
      if (blocks.has(key) || finish) protocolError()
      const block = structuredClone(object(packet.content_block))
      if (!['text', 'tool_use', 'thinking', 'redacted_thinking'].includes(string(block.type))) protocolError()
      blocks.set(key, { block, input: '', closed: false })
      if (block.type === 'text' && block.text) yield { type: 'text-delta', text: string(block.text) }
    } else if (packet.type === 'content_block_delta') {
      const entry = blocks.get(index(packet.index))
      if (!entry || entry.closed || finish) protocolError()
      const delta = object(packet.delta)
      if (entry.block.type === 'text' && delta.type === 'text_delta') {
        const text = string(delta.text)
        entry.block.text = string(entry.block.text) + text
        yield { type: 'text-delta', text }
      } else if (entry.block.type === 'tool_use' && delta.type === 'input_json_delta') {
        entry.input += string(delta.partial_json)
        if (entry.input.length > 1_048_576) protocolError()
      } else if (entry.block.type === 'thinking' && delta.type === 'thinking_delta') {
        entry.block.thinking = string(entry.block.thinking) + string(delta.thinking)
      } else if (entry.block.type === 'thinking' && delta.type === 'signature_delta') {
        entry.block.signature = string(entry.block.signature) + string(delta.signature)
      } else protocolError()
    } else if (packet.type === 'content_block_stop') {
      const entry = blocks.get(index(packet.index))
      if (!entry || entry.closed) protocolError()
      entry.closed = true
      if (entry.block.type === 'tool_use' && entry.input) entry.block.input = args(json(entry.input))
    } else if (packet.type === 'message_delta') {
      const delta = object(packet.delta)
      if (delta.stop_reason != null) {
        if (finish) protocolError()
        finish = string(delta.stop_reason)
      }
    } else if (packet.type === 'message_stop') { stopped = true }
    else protocolError()
  }
  const content = [...blocks].sort(([a], [b]) => a - b).map(([, entry]) => {
    if (!entry.closed) protocolError()
    return entry.block
  })
  const calls = content.filter(block => block.type === 'tool_use')
  if (!started || !stopped || !['end_turn', 'stop_sequence', 'tool_use'].includes(finish ?? '') || (finish === 'tool_use') !== (calls.length > 0)) protocolError()
  yield { type: 'provider-state', state: { protocol: 'anthropic-messages', content: data(content) } }
  for (const call of calls) yield { type: 'tool-call', call: { id: string(call.id), name: string(call.name), arguments: args(call.input) } }
  yield { type: 'finish', reason: calls.length ? 'tool-calls' : 'stop' }
}
