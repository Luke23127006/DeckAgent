import { randomUUID } from 'node:crypto'
import type { ModelEvent, ModelRequest } from '@deckagent/agent-runtime'
import { args, array, data, json, object, protocolError, string } from './wire.ts'

export function geminiBody(request: ModelRequest): Record<string, unknown> {
  const contents: { role: string; parts: unknown[] }[] = []
  const system: { text: string }[] = []
  const wireCalls = new Map<string, Record<string, unknown>>()
  for (const message of request.messages) {
    if (message.role === 'system') { system.push({ text: message.content }); continue }
    const role = message.role === 'assistant' ? 'model' : 'user'
    let parts: unknown[]
    if (message.role === 'tool') {
      const original = wireCalls.get(message.toolCallId)
      parts = [{ functionResponse: {
        name: message.name, ...(original?.id != null ? { id: original.id } : {}),
        response: message.isError ? { error: message.content } : { output: message.content },
      } }]
    } else if (message.role === 'assistant') {
      const state = message.providerState?.provider === request.selection.provider && message.providerState.model === request.selection.model ? message.providerState.data : undefined
      if (state && typeof state === 'object' && !Array.isArray(state) && state.protocol === 'gemini') {
        parts = array(state.parts)
        const ids = array(state.callIds)
        let callIndex = 0
        for (const raw of parts) {
          const part = object(raw)
          if (part.functionCall) wireCalls.set(string(ids[callIndex++]), object(part.functionCall))
        }
      } else parts = [
        ...(message.content ? [{ text: message.content }] : []),
        ...(message.toolCalls ?? []).map(call => ({ functionCall: { name: call.name, args: call.arguments } })),
      ]
    } else parts = [{ text: message.content }]
    if (!parts.length) continue
    const previous = contents.at(-1)
    if (previous?.role === role) previous.parts.push(...parts)
    else contents.push({ role, parts: [...parts] })
  }
  return {
    contents, ...(system.length ? { systemInstruction: { parts: system } } : {}),
    ...(request.tools.length ? { tools: [{ functionDeclarations: request.tools.map(tool => ({
      name: tool.name, description: tool.description, parametersJsonSchema: tool.parameters,
    })) }] } : {}),
  }
}

export async function* geminiEvents(source: AsyncIterable<string>): AsyncGenerator<ModelEvent> {
  const parts: Record<string, unknown>[] = []
  let finish: string | undefined
  for await (const raw of source) {
    const packet = object(json(raw))
    if (packet.error || (packet.promptFeedback && object(packet.promptFeedback).blockReason)) protocolError()
    for (const item of array(packet.candidates ?? [])) {
      const candidate = object(item)
      if ((candidate.index !== undefined && candidate.index !== 0) || finish) protocolError()
      if (candidate.content) for (const rawPart of array(object(candidate.content).parts)) {
        const part = object(rawPart)
        if (!('text' in part) && !('functionCall' in part) && !('thoughtSignature' in part)) protocolError()
        parts.push(structuredClone(part))
        if (part.text != null && part.thought !== true) yield { type: 'text-delta', text: string(part.text) }
      }
      if (candidate.finishReason != null) finish = string(candidate.finishReason)
    }
  }
  if (finish !== 'STOP') protocolError()
  const calls = parts.filter(part => part.functionCall).map(part => object(part.functionCall))
  const callIds = calls.map(() => `gemini-${randomUUID()}`)
  yield { type: 'provider-state', state: { protocol: 'gemini', parts: data(parts), callIds } }
  for (const [i, call] of calls.entries()) yield { type: 'tool-call', call: { id: callIds[i]!, name: string(call.name), arguments: args(call.args ?? {}) } }
  yield { type: 'finish', reason: calls.length ? 'tool-calls' : 'stop' }
}
