import { DeckError, validateConfirmation } from '@deckagent/deck'
import type { DeckStore, ConfirmationReceipt } from '@deckagent/deck'
import { RequestFailure } from '@deckagent/host-api'
import type { RequestAdmission, RequestRuntime } from '@deckagent/host-api'
import type { AgentRequest, ConfirmationResult, RequestSnapshot } from '@deckagent/host-contracts'
import type { DeckSessionStore } from './ports.ts'
import { RequestPreparationFailure } from '../../features/requests/index.ts'
import type { BriefCoordinator } from './brief-coordinator.ts'
import { executeGenerationRun } from './generation-execution.ts'
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
    private readonly runtime?: RequestRuntime,
  ) {}

  async confirm(
    sessionId: string,
    value: unknown,
    submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>,
  ): Promise<ConfirmationResult> {
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
      return await this.admitConfirmedGeneration(sessionId, target, this.decks.generation(sessionId), submit)
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
    submit: (request: AgentRequest, options: RequestAdmission) => Promise<RequestSnapshot>,
  ): Promise<ConfirmationResult> {
    const view = await this.briefs.get(sessionId)
    if (view.sourceStates.some(s => s.status === 'unavailable')) throw new DeckWorkflowFailure('SOURCE_UNAVAILABLE')
    if (
      !old &&
      (!view.current || view.current.briefId !== target.briefId || view.current.version !== target.briefVersion)
    )
      throw new DeckWorkflowFailure('BRIEF_STALE')
    if (this.sessions.requests.activeFor(sessionId)) throw new DeckWorkflowFailure('SESSION_BUSY')
    if (!this.runtime) throw new DeckWorkflowFailure('GENERATION_UNAVAILABLE')
    const request: AgentRequest = {
      sessionId,
      input: 'Generate the explicitly confirmed Outline.',
      publicResearch: view.current?.draft.sources.publicResearch === true,
    }
    const prepared = await this.runtime.prepare(request)
    if (
      old &&
      (old.selection.provider !== prepared.selection.provider || old.selection.model !== prepared.selection.model)
    )
      throw new DeckWorkflowFailure('GENERATION_MODEL_CHANGED')
    const receipt: ConfirmationReceipt = this.decks.confirmGeneration(sessionId, target, prepared.selection)
    const admitted = await submit(request, {
      requestId: receipt.requestId,
      admitted: () => {
        try {
          this.decks.admitGeneration(sessionId, receipt.intentId, receipt.requestId)
        } catch (error) {
          this.decks.finishGeneration(sessionId, receipt.intentId, receipt.requestId, 'failed')
          throw error
        }
      },
      prepared: {
        selection: prepared.selection,
        start: run => executeGenerationRun(this.decks, prepared, sessionId, receipt.intentId, receipt.requestId, run),
      },
    })
    return { receipt, request: admitted }
  }

  private rethrowConfirmationError(error: unknown): never {
    if (
      error instanceof DeckWorkflowFailure ||
      error instanceof RequestFailure ||
      error instanceof RequestPreparationFailure ||
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
