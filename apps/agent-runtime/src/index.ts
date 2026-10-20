import { Context } from '@deepseek-ai/cordis'
import { MemorySessionStore, RuntimeError, ToolRegistry, runtimePlugin } from '@deckagent/agent-runtime'
import type { ModelAdapter, RuntimePluginConfig, SessionStore } from '@deckagent/agent-runtime'

export interface AgentApplicationOptions extends RuntimePluginConfig {
  model: ModelAdapter
  sessions?: SessionStore
  tools?: ToolRegistry
}

/** Application composition. B supplies a real model; C may supply durable storage. */
export async function startAgentRuntime(options: AgentApplicationOptions) {
  const ctx = new Context()
  try {
    if (!options.model || typeof options.model.stream !== 'function') {
      throw new RuntimeError('INVALID_CONFIG', 'A ModelAdapter is required')
    }
    ctx.provide('agentModel', options.model)
    ctx.provide('agentSessions', options.sessions ?? new MemorySessionStore())
    ctx.provide('agentTools', options.tools ?? new ToolRegistry())
    await ctx.plugin(runtimePlugin, {
      ...(options.systemPrompt === undefined ? {} : { systemPrompt: options.systemPrompt }),
      ...(options.maxSteps === undefined ? {} : { maxSteps: options.maxSteps }),
    })
    if (!ctx.get('agentRuntime')) throw new RuntimeError('BOOT_FAILED', 'Agent Runtime did not activate')
    return ctx
  } catch (error) {
    await ctx.fiber.dispose()
    throw error
  }
}
