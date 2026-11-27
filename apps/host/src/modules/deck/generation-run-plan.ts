import { DeckError } from '@deckagent/deck'
import type { DeckStore, GenerationCapability, GenerationGrant } from '@deckagent/deck'
import type { AgentRequest, ModelSelection } from '@deckagent/host-contracts'
import type { RequestRun, RequestTools } from '@deckagent/host-api'
import type { AgentRuntime, RunLifecycleContext, RunPlan, RunResult, ToolContext, ToolSet } from '../../runs/index.ts'
import type { DeckSessionStore } from './ports.ts'
import { DeckWorkflowFailure } from './failures.ts'
import { sourceKindsForBrief } from './deck-prompts.ts'
import { buildGenerationContext, buildGenerationInstructions, generationToolSchemas } from './generation-prompts.ts'
import { createGenerationTools } from './generation-tools.ts'
import { generationReport } from './generation-report.ts'

export interface GenerationSourceToolsPort {
  prepare(
    sessionId: string,
    sourceKinds: readonly import('../../runs/index.ts').SourceKind[],
    publicResearch: boolean,
  ): Promise<ToolSet>
}
export interface GenerationOverrideRun extends RequestRun {
  readonly generation: GenerationGrant
  readonly presentation: GenerationCapability
}
export interface GenerationRuntimeOverride {
  prepare(request: AgentRequest): Promise<{
    readonly selection: ModelSelection
    start(
      run: GenerationOverrideRun,
    ): Promise<
      { readonly status: 'completed'; commit?(): void } | { readonly status: 'failed'; readonly errorCode: string }
    >
  }>
}
export interface GenerationPlanDependencies {
  readonly decks: DeckStore
  readonly sessions: DeckSessionStore
  readonly sourceTools: GenerationSourceToolsPort
  readonly generationRuntime?: GenerationRuntimeOverride
}
export interface GenerationPlanInput {
  readonly request: AgentRequest
  readonly selection: ModelSelection
  readonly intentId: string
  readonly requestId: string
  readonly continuation?: boolean
}
const portableOnly = ['read_slide_draft', 'record_slide_content', 'validate_slide']
function failure(result: RunResult, code: string): RunResult {
  return { status: 'failed', usage: result.usage, error: { category: 'runtime-failed', code } }
}
export async function createGenerationRunPlan(
  deps: GenerationPlanDependencies,
  options: GenerationPlanInput,
): Promise<{ readonly plan: RunPlan; readonly runtime?: AgentRuntime }> {
  const { request, selection, intentId, requestId } = options
  const sessionId = request.sessionId
  const brief = deps.decks.briefSnapshot(sessionId).current?.draft
  if (!brief) throw new DeckWorkflowFailure('BRIEF_NOT_FOUND')
  const publicResearch = brief.sources.publicResearch
  const prepared = await deps.generationRuntime?.prepare({ ...request, publicResearch })
  let lifecycle: RunLifecycleContext | undefined
  let grant: GenerationGrant | undefined
  let capability: GenerationCapability | undefined
  let finished = false
  const finish = (status: 'completed' | 'failed' | 'stopped' | 'interrupted') => {
    if (finished) return
    deps.decks.finishGeneration(sessionId, intentId, requestId, status)
    finished = true
  }
  const plan: RunPlan = {
    owner: { kind: 'chat', id: sessionId },
    requestId,
    input: request.input,
    selection: prepared?.selection ?? selection,
    stepLimit: 'none',
    grants: { publicResearch, sourceKinds: [] },
    async beforeRun(ctx) {
      lifecycle = ctx
      try {
        if (options.continuation) deps.decks.continueGeneration(sessionId, requestId, plan.selection)
        grant = deps.decks.startGeneration(sessionId, intentId, requestId)
        capability = deps.decks.generationCapability(grant, ctx.signal)
      } catch {
        finish(ctx.signal.aborted ? 'stopped' : 'failed')
        throw new DeckWorkflowFailure('GENERATION_FAILED')
      }
    },
    contributions: [
      {
        name: 'deck-generation',
        async contribute() {
          if (!lifecycle || !grant || !capability) throw new DeckWorkflowFailure('GENERATION_GRANT_REQUIRED')
          const runContext = lifecycle
          const cap = capability
          const confirmed = cap.plan()
          const frozen = confirmed.outline.brief?.draft
          if (!frozen) throw new DeckWorkflowFailure('BRIEF_NOT_FOUND')
          const selected = (sourceId: string, version: number) =>
            frozen.sources.refs.some(r => r.sourceId === sourceId && r.version === version)
          const files = deps.sessions.requests
            .sourceCatalogue(sessionId)
            .filter(s => frozen.sources.material && selected(s.sourceId, s.version))
          const attachments = deps.sessions.attachments
            .sent(sessionId)
            .filter(a => frozen.sources.material && a.source && selected(a.source.sourceId, a.source.version))
          const research = deps.sessions.requests
            .researchSources(sessionId)
            .filter(s => selected(s.sourceId, s.version) && (frozen.sources.material || frozen.sources.publicResearch))
          const source = await deps.sourceTools.prepare(sessionId, sourceKindsForBrief(frozen), publicResearch)
          let execution: ToolContext | undefined
          const sourceTools: RequestTools = {
            context: source.context,
            manifest: source.manifest,
            schemas: source.schemas,
            call: (name, args) => {
              if (!execution) throw new DeckWorkflowFailure('GENERATION_GRANT_REQUIRED')
              return source.executor.execute(name, args, execution)
            },
          }
          const run: GenerationOverrideRun = {
            requestId,
            sessionId,
            signal: runContext.signal,
            emit: runContext.emit,
            generation: grant,
            presentation: cap,
            tools: sourceTools,
          }
          const portable = confirmed.generation.design.template.version >= 2
          const context = buildGenerationContext(confirmed, files, attachments, research)
          const tools = createGenerationTools({
            run,
            capability: cap,
            context,
            schemas: generationToolSchemas.filter(s => portable || !portableOnly.includes(s.name)),
            files,
            attachments,
            research,
            brief: frozen,
            portable,
            selected,
          })
          return {
            instructions: [buildGenerationInstructions(confirmed, context, portable)],
            tools: {
              context: tools.context,
              manifest: tools.manifest,
              schemas: tools.schemas,
              executor: {
                async execute(name, args, ctx) {
                  execution = ctx
                  try {
                    return await tools.call(name, args)
                  } finally {
                    execution = undefined
                  }
                },
              },
            },
          }
        },
      },
    ],
    async finalize(result, ctx) {
      try {
        finish(ctx.signal.aborted ? 'stopped' : result.status)
        if (result.status === 'completed' && deps.decks.generation(sessionId)?.state !== 'generated')
          return failure(result, 'GENERATION_INCOMPLETE')
        return result
      } catch (error) {
        return failure(result, error instanceof DeckError ? error.code : 'GENERATION_FAILED')
      }
    },
    closingText(status) {
      finish(status)
      return generationReport(deps.decks, sessionId, requestId, status)
    },
  }
  if (!prepared) return { plan }
  const runtime: AgentRuntime = {
    name: 'deck-generation-override',
    availability: async () => ({ available: true }),
    async run(input, sink) {
      if (!grant || !capability)
        return {
          status: 'failed',
          usage: { modelCalls: 0 },
          error: { category: 'runtime-failed', code: 'GENERATION_GRANT_REQUIRED' },
        }
      const outcome = await prepared.start({
        requestId: input.requestId,
        sessionId: input.owner.id,
        signal: input.signal,
        emit: sink.emit,
        generation: grant,
        presentation: capability,
        ...(input.tools ? { tools: input.tools } : {}),
        instructions: input.instructions.join('\n'),
        onApprovalWait: input.onApprovalWait,
      })
      return outcome.status === 'completed'
        ? { ...outcome, usage: { modelCalls: 0 } }
        : { status: 'failed', usage: { modelCalls: 0 }, error: { category: 'runtime-failed', code: outcome.errorCode } }
    },
  }
  return { plan, runtime }
}
