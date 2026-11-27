import type {
  ApprovalView,
  ModelSelection,
  ProviderProtocol,
  RequestEvent,
  RequestEventBody,
  RequestStatus,
  TerminalStatus,
} from '@deckagent/host-contracts'

export type RunOwnerKind = 'chat'

export const summarizedNotice = 'CONVERSATION_SUMMARIZED'

export interface RunOwner {
  readonly kind: RunOwnerKind
  readonly id: string
}

export function runOwnerKey(owner: RunOwner): string {
  return `${owner.kind}:${owner.id}`
}

export type SourceKind = 'workspace-files' | 'attachments' | 'research'

export interface RunGrants {
  readonly publicResearch: boolean
  readonly sourceKinds: readonly SourceKind[]
}

export interface RunPlan {
  readonly owner: RunOwner
  /** ID đã cấp trước, ví dụ khi xác nhận deck. Khi không có, runs/ tạo ID. */
  readonly requestId?: string
  readonly input: string
  readonly selection: ModelSelection
  readonly grants: RunGrants
  readonly stepLimit: number | 'none'
  readonly contributions: readonly RunContribution[]
  /** Một pass không gọi runtime, ví dụ lệnh deck `restore`. */
  readonly skipRuntime?: boolean
  beforeRun?(context: RunLifecycleContext): Promise<void>
  next?(result: RunResult, context?: RunLifecycleContext): Promise<RunPlan | undefined>
  finalize?(result: RunResult, context: RunLifecycleContext): Promise<RunResult>
  closingText?(status: TerminalStatus): string | undefined
}

export interface RunLifecycleContext {
  readonly owner: RunOwner
  readonly requestId: string
  readonly signal: AbortSignal
  emit(event: RunEvent): Promise<void>
}

export interface RunStartOptions {
  readonly attachmentIds?: readonly string[]
  readonly draftRevision?: number
  readonly onAdmitted?: () => void
  readonly runtime?: AgentRuntime
}

export interface RunSnapshot {
  readonly requestId: string
  readonly owner: RunOwner
  readonly status: RequestStatus
  readonly errorCode?: string
  readonly text: string
  readonly sequence: number
  readonly pendingApproval?: ApprovalView | null
}

export interface PreparationContext {
  readonly owner: RunOwner
  readonly requestId: string
  readonly grants: RunGrants
  readonly signal: AbortSignal
}

export interface RunContribution {
  readonly name: string
  contribute(context: PreparationContext): Promise<RunParts>
}

export interface RunParts {
  readonly instructions?: readonly string[]
  readonly tools?: ToolSet
  readonly resources?: readonly RunResource[]
}

export interface ConversationMessage {
  readonly role: 'user' | 'assistant'
  readonly content: string
  readonly unfinished?: true
  readonly attachments?: readonly { readonly attachmentId: string; readonly name: string }[]
}

export type RunResource = { readonly kind: 'conversation'; readonly messages: readonly ConversationMessage[] }

export interface ApprovalStep {
  readonly key: string
  readonly operation: 'read-file'
  readonly target: string
  readonly reason: string
}

export interface ToolSchema {
  readonly name: string
  readonly description: string
  readonly inputSchema: {
    readonly type: 'object'
    readonly properties: Readonly<Record<string, { readonly type: 'string'; readonly description?: string }>>
    readonly required: readonly string[]
    readonly additionalProperties: false
  }
}

export interface ToolResult {
  readonly isError: boolean
  readonly content: readonly (
    | { readonly type: 'text'; readonly text: string }
    | { readonly type: 'image'; readonly data: string; readonly mimeType: string }
  )[]
}

export interface ToolContext {
  readonly owner: RunOwner
  readonly requestId: string
  readonly signal: AbortSignal
  approve(step: ApprovalStep): Promise<boolean>
}

export interface ToolExecutor {
  execute(name: string, args: unknown, context: ToolContext): Promise<ToolResult>
}

export interface ToolSet {
  readonly context: string
  readonly manifest: string
  readonly schemas: readonly ToolSchema[]
  readonly executor: ToolExecutor
}

export interface RunTools {
  readonly context: string
  readonly manifest: string
  readonly schemas: readonly ToolSchema[]
  call(name: string, args: unknown): Promise<ToolResult>
}

/** The provider settings a run is admitted with, frozen at admission (FR-042). Host-only: it holds the key. */
export interface ProviderRunSettings {
  readonly provider: string
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
  readonly model: string
  readonly key?: string
}

export interface ProviderResolver {
  resolve(selection: ModelSelection): Promise<ProviderRunSettings>
}

export interface RunInput {
  readonly owner: RunOwner
  readonly requestId: string
  readonly provider: ProviderRunSettings
  readonly instructions: readonly string[]
  readonly tools?: RunTools
  readonly resources: readonly RunResource[]
  readonly stepLimit: number | 'none'
  readonly signal: AbortSignal
  onApprovalWait(listener: (waiting: boolean) => void): () => void
}

export type RunEvent = Exclude<RequestEventBody, { readonly kind: 'status' | 'approval' }>

export interface RunUsage {
  readonly modelCalls: number
  readonly inputTokens?: number
  readonly outputTokens?: number
}

export interface RunSink {
  emit(event: RunEvent): Promise<void>
  usage(total: RunUsage): void
}

export type RunErrorCategory =
  | 'provider-auth'
  | 'provider-rate-limit'
  | 'provider-quota'
  | 'provider-network'
  | 'provider-model'
  | 'provider-other'
  | 'context-limit'
  | 'input-unsupported'
  | 'content-blocked'
  | 'timeout'
  | 'stopped'
  | 'runtime-unavailable'
  | 'runtime-config'
  | 'runtime-protocol'
  | 'runtime-incomplete'
  | 'runtime-failed'

export interface RunError {
  readonly category: RunErrorCategory
  readonly code: string
}

export type RunResult =
  | { readonly status: 'completed'; readonly usage: RunUsage; commit?(): void }
  | { readonly status: 'failed'; readonly usage: RunUsage; readonly error: RunError }

export type RuntimeAvailability =
  | { readonly available: true }
  | {
      readonly available: false
      readonly code: string
      readonly detail?: Readonly<Record<string, string | boolean>>
    }

export interface AgentRuntime {
  readonly name: string
  availability(): Promise<RuntimeAvailability>
  run(input: RunInput, sink: RunSink): Promise<RunResult>
}

export interface RunBudgetLimits {
  readonly modelCalls?: number
  readonly inputTokens?: number
  readonly outputTokens?: number
}

export type RunBudgetReason = 'model-calls' | 'input-tokens' | 'output-tokens'

export interface RunBudgetTracker {
  record(total: RunUsage): void
  latest(): RunUsage
  exceeded(): RunBudgetReason | undefined
}

export interface RunRecord {
  readonly publicResearch?: boolean
  readonly requestId: string
  readonly owner: RunOwner
  readonly status: RequestStatus
  readonly selection: ModelSelection
  readonly historyStart: number
  readonly startedAt: string
  readonly endedAt?: string
  readonly errorCode?: string
  readonly lastSequence: number
  readonly summarized?: true
}

export interface RunStore {
  readonly approvals?: {
    create(
      requestId: string,
      step: ApprovalStep,
    ): { readonly approval: ApprovalView; readonly events: readonly RequestEvent[] }
    decide(
      requestId: string,
      approvalId: string,
      decision: 'allow-once' | 'refuse',
    ): { readonly approval: ApprovalView; readonly events: readonly RequestEvent[] }
    pending(requestId: string): ApprovalView | undefined
  }
  admit(input: {
    readonly publicResearch?: boolean
    readonly requestId: string
    readonly owner: RunOwner
    readonly input: string
    readonly selection: ModelSelection
    readonly attachmentIds?: readonly string[]
    readonly draftRevision?: number
  }): RunRecord
  append(requestId: string, event: RunEvent): RequestEvent
  finish(requestId: string, status: TerminalStatus, errorCode?: string): readonly RequestEvent[] | undefined
  get(requestId: string): RunRecord | undefined
  events(requestId: string, after?: number): readonly RequestEvent[]
  text(requestId: string): string
  activeFor(owner: RunOwner): string | undefined
}

export class RunFailure extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'RunFailure'
  }
}
