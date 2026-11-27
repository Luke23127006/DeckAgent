import { DeckError, validateConfirmation } from '@deckagent/deck'
import type { DeckStore, ConfirmationReceipt } from '@deckagent/deck'
import type { AgentRequest, ConfirmationResult } from '@deckagent/host-contracts'
import { RunFailure } from '../../../runs/ports.ts'
import { ResearchError } from '../../research/index.ts'
import type { BriefWorkflow } from '../brief/brief-workflow.ts'
import { DeckWorkflowError, deckWorkflowErrorCode } from '../deck.errors.ts'
import type { DeckRuns, DeckRunStarter } from '../ports.ts'
import { SelectionPassthrough, prepareGeneration } from './generation-preparation.ts'
import type { GenerationPreparationDependencies } from './generation-preparation.ts'
import { createGenerationRunPlan } from './generation-run-plan.ts'
import type { GenerationPlanDependencies } from './generation-run-plan.ts'

type ConfirmationTarget = ReturnType<typeof validateConfirmation>
type Generation = ReturnType<DeckStore['generation']>

/** Serializes confirmation and generation admission per chat without exposing a confirmation tool to models. */
export class GenerationConfirmation {
  private readonly queues = new Map<string, Promise<void>>()

  constructor(
    private readonly decks: DeckStore,
    private readonly runs: DeckRuns,
    private readonly briefs: BriefWorkflow,
    private readonly runStarter: DeckRunStarter,
    private readonly generation: GenerationPlanDependencies,
    private readonly preparation: GenerationPreparationDependencies,
  ) {}

  async confirm(sessionId: string, value: unknown): Promise<ConfirmationResult> {
    const previous = this.queues.get(sessionId) ?? Promise.resolve()
    let release = () => {}
    const pending = new Promise<void>(resolve => {
      release = resolve
    })
    const tail = previous.then(() => pending)
    this.queues.set(sessionId, tail)
    await previous
    try {
      const target = validateConfirmation(value)
      const existing = this.findExistingConfirmation(sessionId, target)
      if (existing) return existing
      return await this.admitConfirmedGeneration(sessionId, target, this.decks.generation(sessionId))
    } catch (error) {
      return this.rethrowConfirmationError(error)
    } finally {
      release()
      if (this.queues.get(sessionId) === tail) this.queues.delete(sessionId)
    }
  }

  private findExistingConfirmation(sessionId: string, target: ConfirmationTarget): ConfirmationResult | undefined {
    const old = this.decks.generation(sessionId)
    if (!old) return undefined
    if (
      ['confirmationId', 'outlineId', 'outlineVersion', 'briefId', 'briefVersion'].some(
        k =>
          Object.entries(target).find(([key]) => key === k)?.[1] !==
          Object.entries(old.receipt).find(([key]) => key === k)?.[1],
      )
    )
      throw new DeckWorkflowError('CONFIRMATION_CONFLICT')
    const request = this.runs.get(old.receipt.requestId)
    if (!request) return undefined
    return {
      receipt: old.receipt,
      request: {
        requestId: request.requestId,
        sessionId,
        status: request.status,
        text: this.runs.text(request.requestId),
        sequence: request.lastSequence,
        ...(request.errorCode ? { errorCode: request.errorCode } : {}),
      },
    }
  }

  private async admitConfirmedGeneration(
    sessionId: string,
    target: ConfirmationTarget,
    old: Generation,
  ): Promise<ConfirmationResult> {
    const view = await this.briefs.get(sessionId)
    if (view.sourceStates.some(s => s.status === 'unavailable')) throw new DeckWorkflowError('SOURCE_UNAVAILABLE')
    if (
      !old &&
      (!view.current || view.current.briefId !== target.briefId || view.current.version !== target.briefVersion)
    )
      throw new DeckWorkflowError('BRIEF_STALE')
    if (this.runs.activeFor({ kind: 'chat', id: sessionId })) throw new DeckWorkflowError('SESSION_BUSY')
    const request: AgentRequest = {
      sessionId,
      input: 'Generate the explicitly confirmed Outline.',
      publicResearch: view.current?.draft.sources.publicResearch === true,
    }
    const prepared = await prepareGeneration(this.preparation, request)
    const selection = prepared.selection
    if (old && (old.selection.provider !== selection.provider || old.selection.model !== selection.model))
      throw new DeckWorkflowError('GENERATION_MODEL_CHANGED')
    const receipt: ConfirmationReceipt = this.decks.confirmGeneration(sessionId, target, selection)
    const override = prepared.override
    const built = await createGenerationRunPlan(
      override ? { ...this.generation, generationRuntime: { prepare: async () => override } } : this.generation,
      {
        request,
        selection,
        intentId: receipt.intentId,
        requestId: receipt.requestId,
      },
    )
    const admitted = await this.runStarter.start(built.plan, {
      ...(built.runtime ? { runtime: built.runtime } : {}),
      onAdmitted: () => {
        try {
          this.decks.admitGeneration(sessionId, receipt.intentId, receipt.requestId)
        } catch (error) {
          this.decks.finishGeneration(sessionId, receipt.intentId, receipt.requestId, 'failed')
          throw error
        }
      },
    })
    const { owner, ...fields } = admitted
    return { receipt, request: { ...fields, sessionId: owner.id } }
  }

  private rethrowConfirmationError(error: unknown): never {
    if (error instanceof SelectionPassthrough) throw error.original
    if (error instanceof RunFailure && error.code === 'RUN_OWNER_BUSY') throw new DeckWorkflowError('SESSION_BUSY')
    if (
      error instanceof DeckWorkflowError ||
      error instanceof RunFailure ||
      error instanceof ResearchError ||
      (error instanceof Error &&
        'status' in error &&
        typeof error.status === 'number' &&
        'code' in error &&
        typeof error.code === 'string')
    )
      throw error
    if (error instanceof DeckError)
      throw new DeckWorkflowError(deckWorkflowErrorCode(error.code) ?? 'CONFIRMATION_UNAVAILABLE')
    throw new DeckWorkflowError('CONFIRMATION_UNAVAILABLE')
  }
}
