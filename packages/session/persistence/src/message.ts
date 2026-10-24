import { RuntimeError } from '@deckagent/agent-runtime'
import type { Message } from '@deckagent/agent-runtime'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function nonempty(value: unknown): value is string { return typeof value === 'string' && Boolean(value.trim()) }
function keys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key))
}
function json(value: unknown, parents = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || parents.has(value) || Object.getOwnPropertySymbols(value).length) return false
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false
  parents.add(value)
  const result = Array.isArray(value)
    ? Object.keys(value).length === value.length && Array.from(value).every(item => json(item, parents))
    : Object.values(value).every(item => json(item, parents))
  parents.delete(value)
  return result
}

/** Validate before JSON encoding so unsupported values cannot silently disappear. */
export function validateMessage(value: unknown): asserts value is Message {
  let valid = false
  if (record(value) && typeof value.content === 'string' && json(value)) {
    if (value.role === 'user' || value.role === 'system') valid = keys(value, ['role', 'content'])
    if (value.role === 'tool') valid = keys(value, ['role', 'content', 'toolCallId', 'name', 'isError'])
      && nonempty(value.toolCallId) && nonempty(value.name) && typeof value.isError === 'boolean'
    if (value.role === 'assistant') {
      valid = keys(value, ['role', 'content', 'toolCalls', 'interrupted', 'providerState'])
        && (!('interrupted' in value) || value.interrupted === true)
        && (!('toolCalls' in value) || (Array.isArray(value.toolCalls) && value.toolCalls.every(call =>
          record(call) && keys(call, ['id', 'name', 'arguments']) && nonempty(call.id) && nonempty(call.name) && record(call.arguments))))
      if ('providerState' in value) {
        const state = value.providerState
        valid = valid && record(state) && keys(state, ['provider', 'model', 'data'])
          && nonempty(state.provider) && nonempty(state.model) && 'data' in state
      }
    }
  }
  if (!valid) throw new RuntimeError('SESSION_MESSAGE', 'Message does not match the supported Session format')
}
