import { RuntimeError } from './contracts.ts'
import type { Message, ToolCall, ToolDefinition, ToolSchema } from './contracts.ts'
import { ToolFailure, TOOL_RECOVERY_TEXT } from './tool-failure.ts'

type ToolMessage = Extract<Message, { role: 'tool' }>
interface Entry { schema: ToolSchema; execute: ToolDefinition['execute'] }

/**
 * Fixed, registry-authored failure text keyed by a stable code. Tool failure results
 * never carry raw exception messages or untrusted codes (CQC-009); these strings are
 * the only text that may be published to the model or session history.
 */
const TOOL_FAILURE_TEXT: Readonly<Record<string, string>> = {
  TOOL_ABORTED: 'Tool was interrupted; its outcome may be unknown',
  TOOL_NOT_ALLOWED: 'Tool is not allowed for this Agent',
  TOOL_NOT_FOUND: 'Tool is not registered',
  INVALID_TOOL_INPUT: 'Tool arguments do not match the schema',
  INVALID_TOOL_RESULT: 'Tool result must be a string',
  TOOL_FAILED: 'Tool failed',
  TOOL_NOT_STARTED: 'Turn was cancelled before this tool started',
  ...TOOL_RECOVERY_TEXT,
}

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
    if (signal.aborted) return this.failure(call, 'TOOL_ABORTED')
    if (!allowed.includes(call.name)) return this.failure(call, 'TOOL_NOT_ALLOWED')
    const entry = this.tools.get(call.name)
    if (!entry) return this.failure(call, 'TOOL_NOT_FOUND')
    const args = call.arguments
    if (!args || typeof args !== 'object' || Array.isArray(args)
      || (Object.getPrototypeOf(args) !== Object.prototype && Object.getPrototypeOf(args) !== null)) {
      return this.failure(call, 'INVALID_TOOL_INPUT')
    }
    const { properties, required = [] } = entry.schema.parameters
    if (required.some(key => !Object.hasOwn(args, key))
      || Object.entries(args).some(([key, value]) => !Object.hasOwn(properties, key)
        || typeof value !== properties[key]?.type || (typeof value === 'number' && !Number.isFinite(value)))) {
      return this.failure(call, 'INVALID_TOOL_INPUT')
    }
    let content: unknown
    try {
      content = await entry.execute(structuredClone(args), { signal })
    } catch (error) {
      // Tool execution is an untrusted boundary: a tool may throw any error, including
      // a RuntimeError whose code or message is not safe. Only explicit ToolFailure
      // codes use registry-authored text; raw error messages are never forwarded.
      return this.failure(call, signal.aborted ? 'TOOL_ABORTED' : error instanceof ToolFailure ? error.code : 'TOOL_FAILED')
    }
    if (signal.aborted) return this.failure(call, 'TOOL_ABORTED')
    if (typeof content !== 'string') return this.failure(call, 'INVALID_TOOL_RESULT')
    return { role: 'tool', toolCallId: call.id, name: call.name, content, isError: false }
  }

  failure(call: ToolCall, code: string): ToolMessage {
    // Only registry-authored codes may be published; an unknown code (or a prototype
    // key such as `constructor`/`__proto__`) collapses to TOOL_FAILED so a raw or
    // spoofed value never reaches the model or session history.
    const safe = Object.hasOwn(TOOL_FAILURE_TEXT, code) ? code : 'TOOL_FAILED'
    return { role: 'tool', toolCallId: call.id, name: call.name, isError: true, content: JSON.stringify({ error: { code: safe, message: TOOL_FAILURE_TEXT[safe] } }) }
  }
}
