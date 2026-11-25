import type { PreparedRequest, RequestRun, RequestRuntime, RuntimeOutcome } from '@deckagent/host-api'
import type { AgentRequest } from '@deckagent/host-contracts'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import { buildGenerationContext, buildGenerationInstructions, generationToolSchemas } from './generation-prompts.ts'
import { createGenerationTools } from './generation-tools.ts'

const portableOnly = ['read_slide_draft', 'record_slide_content', 'validate_slide']

/** Adds generation capabilities to the same isolated CLI, only after Host confirmation. */
export class GenerationWorkflow implements RequestRuntime {
  constructor(
    private readonly runtime: RequestRuntime,
    private readonly sessions: SqliteSessionStore,
  ) {}

  async prepare(request: AgentRequest): Promise<PreparedRequest> {
    const prepared = await this.runtime.prepare(request)
    return {
      selection: prepared.selection,
      start: async run => this.startRun(prepared, run),
    }
  }

  private async startRun(prepared: PreparedRequest, run: RequestRun): Promise<RuntimeOutcome> {
    const cap = run.presentation
    if (!cap || !run.generation) return { status: 'failed', errorCode: 'GENERATION_GRANT_REQUIRED' }
    const plan = cap.plan()
    const briefRecord = plan.outline.brief
    if (!briefRecord) return { status: 'failed', errorCode: 'BRIEF_NOT_FOUND' }
    const brief = briefRecord.draft
    const portable = plan.generation.design.template.version >= 2
    const selected = (id: string, version: number) =>
      brief.sources.refs.some(r => r.sourceId === id && r.version === version)
    const files = this.sessions.requests
      .sourceCatalogue(run.sessionId)
      .filter(s => brief.sources.material && selected(s.sourceId, s.version))
    const attachments = this.sessions.attachments
      .sent(run.sessionId)
      .filter(a => a.source && selected(a.source.sourceId, a.source.version) && brief.sources.material)
    const research = this.sessions.requests
      .researchSources(run.sessionId)
      .filter(s => selected(s.sourceId, s.version) && (brief.sources.material || brief.sources.publicResearch))
    const context = buildGenerationContext(plan, files, attachments, research)
    const instructions = buildGenerationInstructions(plan, context, portable)
    const tools = createGenerationTools({
      run,
      capability: cap,
      context,
      schemas: generationToolSchemas.filter(s => portable || !portableOnly.includes(s.name)),
      files,
      attachments,
      research,
      brief,
      portable,
      selected,
    })
    return prepared.start({ ...run, tools, instructions })
  }
}
