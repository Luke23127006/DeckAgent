import { ResearchFailure } from '../research/index.ts'
import { DeckError, validateConfirmation } from '@deckagent/deck'
import type { DeckStore, ConfirmationReceipt } from '@deckagent/deck'
import { RunFailure } from '../../runs/ports.ts'
import type { RunPlan, RunStartOptions, RunSnapshot } from '../../runs/ports.ts'
import type { AgentRequest, ConfirmationResult, ModelSelection } from '@deckagent/host-contracts'
import type { DeckSessionStore } from './ports.ts'
import { ChatError } from '../chats/index.ts'
import type { BriefCoordinator } from './brief-coordinator.ts'
import { createGenerationRunPlan } from './generation-run-plan.ts'
import type { GenerationPlanDependencies, PreparedGenerationRuntime } from './generation-run-plan.ts'
import { DeckWorkflowFailure } from './failures.ts'

type ConfirmationTarget = ReturnType<typeof validateConfirmation>
type Generation = ReturnType<DeckStore['generation']>

/** Serializes confirmation/admission per Chat without giving model tools a confirmation capability. */
export class ConfirmationCoordinator {
  private readonly queues = new Map<string, Promise<void>>()
  constructor(
    private readonly decks: DeckStore,
    private readonly sessions: DeckSessionStore,
    private readonly briefs: BriefCoordinator,
    private readonly runs: { start(plan: RunPlan, options?: RunStartOptions): Promise<RunSnapshot> },
    private readonly generation: GenerationPlanDependencies,
    private readonly prepare: (
      request: AgentRequest,
    ) => Promise<{ readonly selection: ModelSelection; readonly override?: PreparedGenerationRuntime }>,
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
      throw new DeckWorkflowFailure('CONFIRMATION_CONFLICT')
    const request = this.sessions.requests.get(old.receipt.requestId)
    if (!request) return undefined
    return {
      receipt: old.receipt,
      request: {
        requestId: request.requestId,
        sessionId,
        status: request.status,
        text: this.sessions.requests.text(request.requestId),
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
    if (view.sourceStates.some(s => s.status === 'unavailable')) throw new DeckWorkflowFailure('SOURCE_UNAVAILABLE')
    if (
      !old &&
      (!view.current || view.current.briefId !== target.briefId || view.current.version !== target.briefVersion)
    )
      throw new DeckWorkflowFailure('BRIEF_STALE')
    if (this.sessions.requests.activeFor(sessionId)) throw new DeckWorkflowFailure('SESSION_BUSY')
    const request: AgentRequest = {
      sessionId,
      input: 'Generate the explicitly confirmed Outline.',
      publicResearch: view.current?.draft.sources.publicResearch === true,
    }
    const preparation = await this.prepare(request)
    const selection = preparation.selection
    if (old && (old.selection.provider !== selection.provider || old.selection.model !== selection.model))
      throw new DeckWorkflowFailure('GENERATION_MODEL_CHANGED')
    const receipt: ConfirmationReceipt = this.decks.confirmGeneration(sessionId, target, selection)
    const override = preparation.override
    const prepared = await createGenerationRunPlan(
      override ? { ...this.generation, generationRuntime: { prepare: async () => override } } : this.generation,
      {
        request,
        selection,
        intentId: receipt.intentId,
        requestId: receipt.requestId,
      },
    )
    const admitted = await this.runs.start(prepared.plan, {
      ...(prepared.runtime ? { runtime: prepared.runtime } : {}),
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
    if (error instanceof RunFailure && error.code === 'RUN_OWNER_BUSY') throw new DeckWorkflowFailure('SESSION_BUSY')
    if (
      error instanceof DeckWorkflowFailure ||
      error instanceof RunFailure ||
      error instanceof ChatError ||
      error instanceof ResearchFailure ||
      (error instanceof Error &&
        'status' in error &&
        typeof error.status === 'number' &&
        'code' in error &&
        typeof error.code === 'string')
    )
      throw error
    if (error instanceof DeckError) throw new DeckWorkflowFailure(error.code)
    throw new DeckWorkflowFailure('CONFIRMATION_UNAVAILABLE')
  }
}
