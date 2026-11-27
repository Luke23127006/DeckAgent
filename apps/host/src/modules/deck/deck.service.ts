import { randomUUID } from 'node:crypto'
import type { DeckStore } from '@deckagent/deck'
import type {
  AgentRequest,
  BriefView,
  ConfirmationResult,
  DeckChange,
  DeckSnapshot,
  InterviewState,
  ModelSelection,
  OutlineSnapshot,
  SlideContent,
} from '@deckagent/host-contracts'
import type { RunPlan, RunStartOptions, RuntimeAvailability } from '../../runs/ports.ts'
import { BriefWorkflow } from './brief/brief-workflow.ts'
import { createDeckRunPlan } from './brief/deck-run-plan.ts'
import { DeckWorkflowError } from './deck.errors.ts'
import { GenerationConfirmation } from './generation/generation-confirmation.ts'
import { createGenerationRunPlan } from './generation/generation-run-plan.ts'
import type { GenerationRuntimeOverride, GenerationSourceToolsPort } from './generation/generation-run-plan.ts'
import type { WebImageResearch } from './images/index.ts'
import type { DeckAttachments, DeckChats, DeckRuns, DeckRunStarter } from './ports.ts'

export interface DeckServiceDependencies {
  readonly decks: DeckStore
  readonly chats: DeckChats
  readonly attachments: DeckAttachments
  readonly runs: DeckRuns
  readonly runStarter: DeckRunStarter
  readonly sourceTools: GenerationSourceToolsPort
  readonly imageResearch?: WebImageResearch
  readSelection(sessionId: string): Promise<ModelSelection>
  runtimeAvailability(): Promise<RuntimeAvailability>
  preflightResearch(publicResearch: boolean): Promise<void>
  onOverrideSelection?(selection: ModelSelection): void
  readonly generationRuntime?: GenerationRuntimeOverride
}

/** Owns deck brief, interview, confirmation, generation planning and deck read use cases. */
export class DeckService {
  private readonly decks: DeckStore
  private readonly chats: DeckChats
  private readonly imageResearch: WebImageResearch | undefined
  private readonly briefs: BriefWorkflow
  private readonly confirmations: GenerationConfirmation
  private readonly generationDeps: {
    readonly decks: DeckStore
    readonly attachments: DeckAttachments
    readonly runs: DeckRuns
    readonly sourceTools: GenerationSourceToolsPort
    readonly generationRuntime?: GenerationRuntimeOverride
  }

  constructor(deps: DeckServiceDependencies) {
    this.decks = deps.decks
    this.chats = deps.chats
    this.imageResearch = deps.imageResearch
    this.briefs = new BriefWorkflow(deps.decks, deps.chats, deps.attachments, deps.runs)
    this.generationDeps = {
      decks: deps.decks,
      attachments: deps.attachments,
      runs: deps.runs,
      sourceTools: deps.sourceTools,
      ...(deps.generationRuntime ? { generationRuntime: deps.generationRuntime } : {}),
    }
    this.confirmations = new GenerationConfirmation(
      deps.decks,
      deps.runs,
      this.briefs,
      deps.runStarter,
      this.generationDeps,
      {
        readSelection: sessionId => deps.readSelection(sessionId),
        runtimeAvailability: () => deps.runtimeAvailability(),
        preflightResearch: publicResearch => deps.preflightResearch(publicResearch),
        ...(deps.onOverrideSelection ? { onOverrideSelection: deps.onOverrideSelection } : {}),
        ...(deps.generationRuntime ? { generationRuntime: deps.generationRuntime } : {}),
      },
    )
  }

  confirm(sessionId: string, value: unknown): Promise<ConfirmationResult> {
    return this.confirmations.confirm(sessionId, value)
  }

  interview(sessionId: string): Promise<{ readonly brief: BriefView; readonly state: InterviewState }> {
    return this.briefs.interview(sessionId)
  }

  getBrief(sessionId: string, version?: number): Promise<BriefView> {
    return this.briefs.get(sessionId, version)
  }

  saveBrief(sessionId: string, value: unknown): Promise<BriefView> {
    return this.briefs.save(sessionId, value)
  }

  async prepareRun(
    request: AgentRequest,
    selected: ModelSelection,
  ): Promise<{ readonly plan: RunPlan; readonly options?: RunStartOptions }> {
    if (request.continueDeck) {
      const generation = this.decks.generation(request.sessionId)
      if (!generation || generation.state !== 'incomplete') throw new DeckWorkflowError('GENERATION_INCOMPLETE')
      const prepared = await createGenerationRunPlan(this.generationDeps, {
        request,
        selection: selected,
        intentId: generation.receipt.intentId,
        requestId: `req-${randomUUID()}`,
        continuation: true,
      })
      return { plan: prepared.plan, ...(prepared.runtime ? { options: { runtime: prepared.runtime } } : {}) }
    }
    return {
      plan: await createDeckRunPlan(
        {
          decks: this.decks,
          chats: this.chats,
          briefs: this.briefs,
          ...(this.imageResearch ? { imageResearch: this.imageResearch } : {}),
        },
        request,
        selected,
      ),
    }
  }

  snapshot(sessionId: string): DeckSnapshot {
    return this.decks.snapshot(sessionId)
  }

  content(sessionId: string, slideId: string, revision: number): SlideContent {
    return this.decks.content(sessionId, slideId, revision)
  }

  subscribe(sessionId: string, listener: (change: DeckChange) => void): () => void {
    return this.decks.subscribe(sessionId, listener)
  }

  outlineImagePreview(sessionId: string, outlineId: string, needId: string): Uint8Array {
    return this.decks.outlineImagePreview(sessionId, outlineId, needId)
  }

  outlineSnapshot(sessionId: string): OutlineSnapshot {
    return this.decks.outlineSnapshot(sessionId)
  }
}
