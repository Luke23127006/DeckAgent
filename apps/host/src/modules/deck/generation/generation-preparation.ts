import type { AgentRequest, ModelSelection } from '@deckagent/host-contracts'
import { RunFailure } from '../../../runs/ports.ts'
import type { RuntimeAvailability } from '../../../runs/ports.ts'
import type { GenerationRuntimeOverride, PreparedGenerationRuntime } from './generation-run-plan.ts'

export interface GenerationPreparationDependencies {
  readSelection(sessionId: string): Promise<ModelSelection>
  runtimeAvailability(): Promise<RuntimeAvailability>
  preflightResearch(publicResearch: boolean): Promise<void>
  onOverrideSelection?(selection: ModelSelection): void
  readonly generationRuntime?: GenerationRuntimeOverride
}

export interface PreparedGeneration {
  readonly selection: ModelSelection
  readonly override?: PreparedGenerationRuntime
}

/** Preserves typed chat-selection errors through confirmation error translation without importing the chats module. */
export class SelectionPassthrough extends Error {
  constructor(readonly original: unknown) {
    super('SELECTION_PASSTHROUGH')
    this.name = 'SelectionPassthrough'
  }
}

export async function prepareGeneration(
  deps: GenerationPreparationDependencies,
  request: AgentRequest,
): Promise<PreparedGeneration> {
  if (deps.generationRuntime) {
    await deps.preflightResearch(request.publicResearch === true)
    const prepared = await deps.generationRuntime.prepare(request)
    deps.onOverrideSelection?.(prepared.selection)
    return { selection: prepared.selection, override: prepared }
  }
  let selected: ModelSelection
  try {
    selected = await deps.readSelection(request.sessionId)
  } catch (error) {
    if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
      throw new SelectionPassthrough(error)
    }
    throw error
  }
  const availability = await deps.runtimeAvailability()
  if (!availability.available) throw new RunFailure(availability.code, availability.detail)
  await deps.preflightResearch(request.publicResearch === true)
  return { selection: selected }
}
