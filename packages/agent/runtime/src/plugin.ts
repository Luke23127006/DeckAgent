import type { Context } from '@deepseek-ai/cordis'
import type { ModelAdapter, SessionStore } from './contracts.ts'
import { AgentRuntime } from './agent-runtime.ts'
import type { ToolRegistry } from './tool-registry.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    agentModel: ModelAdapter
    agentSessions: SessionStore
    agentTools: ToolRegistry
    agentRuntime: AgentRuntime
  }
}

export interface RuntimePluginConfig {
  systemPrompt?: string
  maxSteps?: number
}

/** Cordis owns service wiring and disposal; the turn engine is framework-independent. */
export const runtimePlugin = {
  name: 'deckagent-agent-runtime',
  inject: ['agentModel', 'agentSessions', 'agentTools'],
  apply(ctx: Context, config: RuntimePluginConfig = {}) {
    const runtime = new AgentRuntime({
      model: ctx.agentModel, sessions: ctx.agentSessions, tools: ctx.agentTools, ...config,
    })
    ctx.provide('agentRuntime', runtime)
    ctx.fiber.effect(() => () => runtime.dispose())
  },
}
