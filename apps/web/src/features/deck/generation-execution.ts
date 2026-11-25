import { createHash } from 'node:crypto'
import type { DeckStore } from '@deckagent/deck'
import type { PreparedRequest, RequestRun, RequestTools, RuntimeOutcome } from '@deckagent/host-api'
import { buildRecoveryInstructions } from './deck-prompts.ts'

/**
 * Runs one admitted generation and records its terminal intent state. A start failure never escapes to the caller,
 * so the Host reports `GENERATION_FAILED` instead of an unhandled error.
 */
export async function executeGenerationRun(
  decks: DeckStore,
  prepared: PreparedRequest,
  sessionId: string,
  intentId: string,
  requestId: string,
  run: RequestRun,
): Promise<RuntimeOutcome> {
  try {
    const grant = decks.startGeneration(sessionId, intentId, requestId)
    const outcome = await prepared.start({
      ...run,
      generation: grant,
      presentation: decks.generationCapability(grant, run.signal),
    })
    decks.finishGeneration(sessionId, intentId, requestId, run.signal.aborted ? 'stopped' : outcome.status)
    if (outcome.status === 'completed' && decks.generation(sessionId)?.state !== 'generated')
      return { status: 'failed', errorCode: 'GENERATION_INCOMPLETE' }
    return outcome
  } catch {
    decks.finishGeneration(sessionId, intentId, requestId, run.signal.aborted ? 'stopped' : 'failed')
    return { status: 'failed', errorCode: 'GENERATION_FAILED' }
  }
}

const recoveryTools = ['select_slide_image', 'search_slide_images']

/** Runs the single Host image recovery pass with only the image selection tools and a fresh tool context. */
export function executeRecoveryRun(
  prepared: PreparedRequest,
  run: RequestRun,
  tools: RequestTools,
  instructions: string,
  recovery: string,
): Promise<RuntimeOutcome> {
  return prepared.start({
    ...run,
    instructions: buildRecoveryInstructions(instructions, recovery),
    tools: {
      ...tools,
      context: createHash('sha256').update(`${tools.context}|image-recovery|${recovery}`).digest('hex'),
      schemas: tools.schemas.filter(s => recoveryTools.includes(s.name)),
    },
  })
}
