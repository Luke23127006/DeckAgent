import { RuntimeError } from './contracts.ts'
import type { Message, ToolCall, ToolDefinition, ToolSchema } from './contracts.ts'

type ToolMessage = Extract<Message, { role: 'tool' }>
interface Entry { schema: ToolSchema; execute: ToolDefinition['execute'] }

/** Real dispatch with explicit Agent allowlists and a small, validated schema subset. */
export class ToolRegistry {
  private readonly tools = new Map<string, Entry>()

  register(tool: ToolDefinition): () => void {
    if (typeof tool.name !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(tool.name)
      || typeof tool.description !== 'string' || !tool.description.trim() || typeof tool.execute !== 'function') {
      throw new RuntimeError('INVALID_TOOL', 'Tool needs a valid name and description')
    }
    if (this.tools.has(tool.name)) throw new RuntimeError('DUPLICATE_TOOL', `Tool ${tool.name} is registered`)
    const { parameters } = tool
    if (!parameters || parameters.type !== 'object' || parameters.additionalProperties !== false
      || Object.keys(parameters).some(key => !['type', 'properties', 'required', 'additionalProperties'].includes(key))
      || !parameters.properties || typeof parameters.properties !== 'object' || Array.isArray(parameters.properties)
      || Object.values(parameters.properties).some(field => !field || typeof field !== 'object'
        || Object.keys(field).some(key => key !== 'type') || !['string', 'number', 'boolean'].includes(field.type))
      || (parameters.required !== undefined && (!Array.isArray(parameters.required)
        || new Set(parameters.required).size !== parameters.required.length
        || parameters.required.some(key => typeof key !== 'string' || !Object.hasOwn(parameters.properties, key))))) {
      throw new RuntimeError('INVALID_TOOL', 'Supported parameters are closed objects with primitive fields')
    }
    const entry = {
      schema: structuredClone({ name: tool.name, description: tool.description, parameters }),
      execute: tool.execute,
    }
    this.tools.set(tool.name, entry)
    return () => { if (this.tools.get(tool.name) === entry) this.tools.delete(tool.name) }
  }

  schemas(names: readonly string[]): readonly ToolSchema[] {
    return names.map(name => {
      const entry = this.tools.get(name)
      if (!entry) throw new RuntimeError('TOOL_NOT_FOUND', `Tool ${name} is not registered`)
      return structuredClone(entry.schema)
    })
  }

  async execute(call: ToolCall, allowed: readonly string[], signal: AbortSignal): Promise<ToolMessage> {
    try {
      signal.throwIfAborted()
      if (!allowed.includes(call.name)) throw new RuntimeError('TOOL_NOT_ALLOWED', `Tool ${call.name} is not allowed for this Agent`)
      const entry = this.tools.get(call.name)
      if (!entry) throw new RuntimeError('TOOL_NOT_FOUND', `Tool ${call.name} is not registered`)
      const args = call.arguments
      if (!args || typeof args !== 'object' || Array.isArray(args)
        || (Object.getPrototypeOf(args) !== Object.prototype && Object.getPrototypeOf(args) !== null)) {
        throw new RuntimeError('INVALID_TOOL_INPUT', 'Tool arguments must be a plain object')
      }
      const { properties, required = [] } = entry.schema.parameters
      if (required.some(key => !Object.hasOwn(args, key))
        || Object.entries(args).some(([key, value]) => !Object.hasOwn(properties, key)
          || typeof value !== properties[key]?.type || (typeof value === 'number' && !Number.isFinite(value)))) {
        throw new RuntimeError('INVALID_TOOL_INPUT', `Arguments do not match ${call.name}'s schema`)
      }
      const content = await entry.execute(structuredClone(args), { signal })
      signal.throwIfAborted()
      if (typeof content !== 'string') throw new RuntimeError('INVALID_TOOL_RESULT', 'Tool result must be a string')
      return { role: 'tool', toolCallId: call.id, name: call.name, content, isError: false }
    } catch (error) {
      return this.failure(call, signal.aborted ? 'TOOL_ABORTED' : error instanceof RuntimeError ? error.code : 'TOOL_FAILED',
        signal.aborted ? 'Tool was interrupted; its outcome may be unknown' : error instanceof Error ? error.message : 'Tool failed')
    }
  }

  failure(call: ToolCall, code: string, message: string): ToolMessage {
    return { role: 'tool', toolCallId: call.id, name: call.name, isError: true, content: JSON.stringify({ error: { code, message } }) }
  }
}
