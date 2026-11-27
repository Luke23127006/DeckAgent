import type {
  AgentRequest,
  ApprovalView,
  ModelSelection,
  RequestEvent,
  RequestSnapshot,
} from '@deckagent/host-contracts'
import type { RunPlan, RunSnapshot, RunStartOptions } from '../../runs/ports.ts'
import { RunFailure } from '../../runs/ports.ts'
import { ChatError } from './chats.errors.ts'
import { toChatRequest, type ChatHistoryMessage } from './chats.service.ts'

export interface ChatRunOperations {
  start(plan: RunPlan, options?: RunStartOptions): Promise<RunSnapshot>
  get(requestId: string): RunSnapshot
  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView
  events(requestId: string, after: number): readonly RequestEvent[]
  stop(requestId: string): RunSnapshot
  subscribe(listener: (event: RequestEvent) => void): () => void
}

export interface DeckRunPlanner {
  prepare(
    request: AgentRequest,
    selection: ModelSelection,
  ): Promise<{ readonly plan: RunPlan; readonly options?: RunStartOptions }>
}

export interface ChatRequestDependencies {
  readonly chats: {
    getInfo(
      id: string,
    ): Promise<{ readonly selection?: ModelSelection; readonly removedSelection?: ModelSelection } | undefined>
    read(id: string): Promise<readonly ChatHistoryMessage[]>
  }
  readonly providers: {
    providerSettings(): readonly { readonly models: readonly string[] }[]
    selectable(value: ModelSelection): boolean
  }
  readonly runs: ChatRunOperations
  readonly deckPlanner: DeckRunPlanner
  preflightResearch(selected: boolean): Promise<void>
}

/** Admits, reads and stops requests of a chat, and names the reason when a chat cannot start one. */
export class ChatRequestService {
  constructor(private readonly deps: ChatRequestDependencies) {}

  async readSelection(sessionId: string): Promise<ModelSelection> {
    const info = await this.deps.chats.getInfo(sessionId).catch(() => undefined)
    if (!info) throw new ChatError('SESSION_NOT_FOUND')
    try {
      await this.deps.chats.read(sessionId)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'SESSION_CORRUPT')
        throw new ChatError('CHAT_UNREADABLE')
      throw new ChatError('SESSION_UNAVAILABLE')
    }
    const configured = this.deps.providers.providerSettings()
    if (!info.selection || !this.deps.providers.selectable(info.selection)) {
      const reason = !configured.length
        ? 'no-provider'
        : !configured.some(provider => provider.models.length)
          ? 'no-model'
          : info.selection || info.removedSelection
            ? 'model-removed'
            : 'no-selection'
      throw new ChatError('NO_SELECTABLE_MODEL', { reason })
    }
    return info.selection
  }

  async submit(request: AgentRequest): Promise<RequestSnapshot> {
    const selected = await this.readSelection(request.sessionId)
    const prepared =
      request.deck || request.continueDeck
        ? await this.deps.deckPlanner.prepare(request, selected)
        : {
            plan: {
              owner: { kind: 'chat' as const, id: request.sessionId },
              input: request.input,
              selection: selected,
              grants: {
                publicResearch: request.publicResearch === true,
                sourceKinds: ['workspace-files', 'attachments', 'research'] as const,
              },
              stepLimit: 8,
              contributions: [],
            },
          }
    await this.deps.preflightResearch(prepared.plan.grants.publicResearch)
    try {
      return toChatRequest(
        await this.deps.runs.start(prepared.plan, {
          ...prepared.options,
          ...(request.attachmentIds === undefined ? {} : { attachmentIds: request.attachmentIds }),
          ...(request.draftRevision === undefined ? {} : { draftRevision: request.draftRevision }),
        }),
      )
    } catch (error) {
      if (error instanceof RunFailure && error.code === 'RUN_OWNER_BUSY') throw new ChatError('SESSION_BUSY')
      throw error
    }
  }

  get(requestId: string): RequestSnapshot {
    return toChatRequest(this.deps.runs.get(requestId))
  }

  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView {
    return this.deps.runs.decide(requestId, approvalId, decision)
  }

  events(requestId: string, after: number): readonly RequestEvent[] {
    return this.deps.runs.events(requestId, after)
  }

  stop(requestId: string): RequestSnapshot {
    return toChatRequest(this.deps.runs.stop(requestId))
  }

  subscribe(listener: (event: RequestEvent) => void): () => void {
    return this.deps.runs.subscribe(listener)
  }
}
