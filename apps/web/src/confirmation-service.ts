import { DeckError, validateConfirmation } from '@deckagent/deck'
import type { DeckService, ConfirmationReceipt } from '@deckagent/deck'
import { HttpError } from '@deckagent/host-api'
import type {
  AgentRequest,
  RequestAdmission,
  RequestRuntime,
  RequestSnapshot,
  ConfirmationResult,
} from '@deckagent/host-api'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import type { BriefService } from './brief-service.ts'

/** Serializes confirmation/admission per Chat without giving model tools a confirmation capability. */
export class ConfirmationService {
  private readonly queues = new Map<string, Promise<void>>()
  constructor(
    private readonly decks: DeckService,
    private readonly sessions: SqliteSessionStore,
    private readonly briefs: BriefService,
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
      const old = this.decks.generation(sessionId)
      if (old) {
        if (
          ['confirmationId', 'outlineId', 'outlineVersion', 'briefId', 'briefVersion'].some(
            k =>
              Object.entries(target).find(([key]) => key === k)?.[1] !==
              Object.entries(old.receipt).find(([key]) => key === k)?.[1],
          )
        )
          throw new HttpError(409, 'CONFIRMATION_CONFLICT')
        const request = this.sessions.requests.get(old.receipt.requestId)
        if (request)
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
      const view = await this.briefs.get(sessionId)
      if (view.sourceStates.some(s => s.status === 'unavailable')) throw new HttpError(409, 'SOURCE_UNAVAILABLE')
      if (
        !old &&
        (!view.current || view.current.briefId !== target.briefId || view.current.version !== target.briefVersion)
      )
        throw new HttpError(409, 'BRIEF_STALE')
      if (this.sessions.requests.activeFor(sessionId)) throw new HttpError(409, 'SESSION_BUSY')
      if (!this.runtime) throw new HttpError(503, 'GENERATION_UNAVAILABLE')
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
        throw new HttpError(409, 'GENERATION_MODEL_CHANGED')
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
          start: async run => {
            try {
              const grant = this.decks.startGeneration(sessionId, receipt.intentId, receipt.requestId)
              const outcome = await prepared.start({
                ...run,
                generation: grant,
                presentation: this.decks.generationCapability(grant, run.signal),
              })
              this.decks.finishGeneration(
                sessionId,
                receipt.intentId,
                receipt.requestId,
                run.signal.aborted ? 'stopped' : outcome.status,
              )
              if (outcome.status === 'completed' && this.decks.generation(sessionId)?.state !== 'generated')
                return { status: 'failed', errorCode: 'GENERATION_INCOMPLETE' }
              return outcome
            } catch {
              this.decks.finishGeneration(
                sessionId,
                receipt.intentId,
                receipt.requestId,
                run.signal.aborted ? 'stopped' : 'failed',
              )
              return { status: 'failed', errorCode: 'GENERATION_FAILED' }
            }
          },
        },
      })
      return { receipt, request: admitted }
    } catch (error) {
      if (error instanceof HttpError) throw error
      if (error instanceof DeckError)
        throw new HttpError(
          error.code === 'CONFIRMATION_INVALID'
            ? 400
            : error.code === 'DECK_STORAGE' || error.code === 'DECK_CORRUPT'
              ? 500
              : 409,
          error.code,
        )
      throw new HttpError(500, 'CONFIRMATION_UNAVAILABLE')
    } finally {
      release()
      if (this.queues.get(sessionId) === tail) this.queues.delete(sessionId)
    }
  }
}
