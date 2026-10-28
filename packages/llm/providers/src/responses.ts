import type { ModelEvent, ModelRequest } from '@deckagent/agent-runtime'
import { args, json, object, protocolError, string } from './wire.ts'

/** Stateless transcript replay keeps tool calls paired with outputs after restart. */
export function responsesBody(request: ModelRequest): Record<string, unknown> {
  const input: unknown[] = []
  for (const message of request.messages) {
    if (message.role === 'tool') {
      input.push({ type: 'function_call_output', call_id: message.toolCallId, output: message.content })
    } else if (message.role === 'assistant') {
      const state =
        message.providerState?.provider === request.selection.provider &&
        message.providerState.model === request.selection.model
          ? message.providerState.data
          : undefined
      if (
        state &&
        typeof state === 'object' &&
        !Array.isArray(state) &&
        state.protocol === 'responses' &&
        Array.isArray(state.output)
      )
        input.push(...state.output)
      else {
        if (message.content) input.push({ role: 'assistant', content: message.content })
        for (const call of message.toolCalls ?? [])
          input.push({
            type: 'function_call',
            call_id: call.id,
            name: call.name,
            arguments: JSON.stringify(call.arguments),
          })
      }
    } else input.push({ role: message.role, content: message.content })
  }
  return {
    model: request.selection.model,
    stream: true,
    store: false,
    include: ['reasoning.encrypted_content'],
    input,
    ...(request.tools.length
      ? {
          tools: request.tools.map(tool => ({
            type: 'function',
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            strict: false,
          })),
        }
      : {}),
  }
}

export async function* responsesEvents(source: AsyncIterable<string>): AsyncGenerator<ModelEvent> {
  const calls: { id: string; name: string; arguments: string }[] = []
  const output: unknown[] = []
  let completed = false
  for await (const raw of source) {
    const event = object(json(raw))
    if (completed || event.type === 'response.failed' || event.type === 'response.incomplete' || event.type === 'error')
      protocolError()
    if (event.type === 'response.output_text.delta') yield { type: 'text-delta', text: string(event.delta) }
    else if (event.type === 'response.output_item.done') {
      const item = object(event.item)
      if (item.type === 'function_call') {
        const call = { id: string(item.call_id), name: string(item.name), arguments: string(item.arguments) }
        if (
          !call.id ||
          !call.name ||
          call.arguments.length > 1_048_576 ||
          calls.some(previous => previous.id === call.id)
        )
          protocolError()
        calls.push(call)
      } else if (item.type !== 'reasoning' && item.type !== 'message') protocolError()
      if (
        item.type === 'message' &&
        Array.isArray(item.content) &&
        item.content.some(part => part && typeof part === 'object' && !Array.isArray(part) && part.type === 'refusal')
      )
        protocolError()
      output.push(structuredClone(item))
    } else if (event.type === 'response.completed') {
      if (object(event.response).status !== 'completed') protocolError()
      completed = true
    }
  }
  if (!completed) protocolError()
  if (output.length) yield { type: 'provider-state', state: { protocol: 'responses', output: output as never } }
  for (const call of calls)
    yield { type: 'tool-call', call: { id: call.id, name: call.name, arguments: args(json(call.arguments)) } }
  yield { type: 'finish', reason: calls.length ? 'tool-calls' : 'stop' }
}
