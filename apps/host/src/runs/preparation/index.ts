import { createHash } from 'node:crypto'
import type {
  ApprovalStep,
  PreparationContext,
  ProviderResolver,
  RunContribution,
  RunInput,
  RunPlan,
  RunResource,
  RunTools,
  ToolContext,
  ToolResult,
  ToolSet,
} from '../ports.ts'
import { RunFailure } from '../ports.ts'

function mergeTools(sets: readonly ToolSet[], context: ToolContext): RunTools | undefined {
  if (!sets.length) return undefined
  const names = new Set<string>()
  for (const set of sets) {
    for (const schema of set.schemas) {
      if (names.has(schema.name)) throw new RunFailure('TOOL_NAME_CONFLICT')
      names.add(schema.name)
    }
  }
  return {
    context: createHash('sha256')
      .update(sets.map(set => set.context).join('\u0000'))
      .digest('hex'),
    manifest: sets
      .map(set => set.manifest)
      .filter(manifest => manifest.length > 0)
      .join('\n\n'),
    schemas: sets.flatMap(set => set.schemas),
    async call(name: string, args: unknown): Promise<ToolResult> {
      const set = sets.find(candidate => candidate.schemas.some(schema => schema.name === name))
      if (!set) throw new RunFailure('TOOL_NOT_ALLOWED')
      return set.executor.execute(name, args, context)
    },
  }
}

export async function prepareRunInput(options: {
  readonly plan: RunPlan
  readonly requestId: string
  readonly signal: AbortSignal
  readonly registered: readonly RunContribution[]
  readonly providers: ProviderResolver
  readonly approve: (step: ApprovalStep) => Promise<boolean>
  readonly onApprovalWait: (listener: (waiting: boolean) => void) => () => void
}): Promise<RunInput> {
  const { plan, requestId, signal, registered, providers, approve, onApprovalWait } = options
  const preparation: PreparationContext = { owner: plan.owner, requestId, grants: plan.grants, signal }
  const instructions: string[] = []
  const resources: RunResource[] = []
  const toolSets: ToolSet[] = []

  for (const contribution of [...registered, ...plan.contributions]) {
    const parts = await contribution.contribute(preparation)
    instructions.push(...(parts.instructions ?? []))
    resources.push(...(parts.resources ?? []))
    if (parts.tools) toolSets.push(parts.tools)
  }

  const tools = mergeTools(toolSets, { owner: plan.owner, requestId, signal, approve })
  return {
    owner: plan.owner,
    requestId,
    provider: await providers.resolve(plan.selection),
    instructions,
    ...(tools ? { tools } : {}),
    resources,
    stepLimit: plan.stepLimit,
    signal,
    onApprovalWait,
  }
}
