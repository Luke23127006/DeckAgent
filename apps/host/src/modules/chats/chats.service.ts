import type { ConversationMessage, RunContribution, RunPlan, RunSnapshot, RunStartOptions } from '../../runs/ports.ts'
import { RunFailure } from '../../runs/ports.ts'
import type {
  AgentRequest,
  ApprovalView,
  AttachmentView,
  ModelSelection,
  RequestEvent,
  RequestSnapshot,
  StoredActivity,
  StoredRequest,
  WebSession,
} from '@deckagent/host-contracts'
import type { WorkspaceChats, WorkspaceLookup } from '../workspaces/index.ts'

export type ChatWorkflowErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'MODEL_NOT_SELECTABLE'
  | 'CHAT_UNREADABLE'
  | 'DRAFT_TOO_LARGE'
  | 'SESSION_BUSY'
  | 'NO_SELECTABLE_MODEL'
  | 'SESSION_UNAVAILABLE'
  | 'RUNTIME_UNAVAILABLE'
  | 'RUNTIME_VERSION_UNSUPPORTED'

type ChatWorkflowErrorDetail = Readonly<Record<string, string | boolean>>

export class ChatWorkflowError extends Error {
  constructor(
    readonly code: ChatWorkflowErrorCode,
    readonly detail?: ChatWorkflowErrorDetail,
  ) {
    super(code)
  }
}

/** One saved chat as the chat store reads it. */
export interface ChatRecord {
  readonly sessionId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly messageCount: number
  readonly workspaceId: string | null
  readonly selection?: ModelSelection
  readonly removedSelection?: ModelSelection
  readonly title: string
  readonly readable: boolean
}

/** The chat part of the session database. `SqliteSessionStore` implements it. */
export interface ChatStore {
  getInfo(sessionId: string): Promise<unknown>
  read(sessionId: string): Promise<readonly ChatHistoryMessage[]>
  chats(): Promise<readonly ChatRecord[]>
  list(): Promise<readonly { readonly sessionId: string; readonly workspaceId: string | null }[]>
  create(workspaceId: string, selection?: ModelSelection): Promise<{ readonly sessionId: string }>
  select(sessionId: string, selection: ModelSelection): Promise<unknown>
  search(words: string, chatIds: readonly string[]): Promise<readonly string[]>
  ungroup(workspaceId: string): Promise<void>
  readonly requests: {
    activeFor(sessionId: string): string | undefined
    activities(sessionId: string): readonly StoredActivity[]
    list(sessionId: string): readonly StoredRequest[]
  }
}

/** The model choice rules of the Browser settings. `WebState` implements it. */
export interface ChatModels {
  lastSelection(): ModelSelection | undefined
  selectable(value: ModelSelection | undefined): boolean
  rememberSelection(value: ModelSelection): void
}

/** Marks that other stores own. */
export interface ChatMarks {
  hasSlides(sessionId: string): boolean
  hasDraft(sessionId: string): boolean
}

export interface ChatOperations {
  history(id: string): Promise<readonly ChatHistoryMessage[]>
  activities(id: string): Promise<readonly StoredActivity[]>
  requests(id: string): Promise<readonly StoredRequest[]>
  create(selection?: ModelSelection): Promise<WebSession>
  selectModel(id: string, selection: ModelSelection): Promise<WebSession>
  list(): Promise<readonly WebSession[]>
  search(words: string): Promise<readonly WebSession[]>
}

export function createWorkspaceChats(store: ChatStore): WorkspaceChats {
  return {
    hasActiveRequest: async workspaceId =>
      (await store.list())
        .filter(chat => chat.workspaceId === workspaceId)
        .some(chat => store.requests.activeFor(chat.sessionId)),
    ungroup: workspaceId => store.ungroup(workspaceId),
  }
}

/** Browser projection of a chat. A chat with no user message yet is shown as a new chat. */
function projectChat(chat: ChatRecord, models: ChatModels, marks: ChatMarks): WebSession {
  return {
    sessionId: chat.sessionId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messageCount,
    workspaceId: chat.workspaceId,
    readable: chat.readable,
    title: chat.title || 'New chat',
    hasSlides: chat.readable && marks.hasSlides(chat.sessionId),
    selectable: models.selectable(chat.selection),
    ...(chat.selection ? { selection: chat.selection } : {}),
    ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),
    hasDraft: marks.hasDraft(chat.sessionId),
  }
}

/** Coordinates chat creation, model selection, listing, search, and Browser projection. */
export function createChatOperations(
  store: ChatStore,
  registry: WorkspaceLookup,
  models: ChatModels,
  marks: ChatMarks,
): ChatOperations {
  const project = (chat: ChatRecord): WebSession => projectChat(chat, models, marks)
  const withActive = (session: WebSession): WebSession => {
    const activeRequestId = store.requests.activeFor(session.sessionId)
    return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
  }

  const chat = async (id: string): Promise<WebSession> => {
    const found = (await store.chats()).find(item => item.sessionId === id)
    if (!found) throw new ChatWorkflowError('SESSION_NOT_FOUND')
    return project(found)
  }

  return {
    async history(id) {
      return (await store.read(id)).filter(message => message.role !== 'system').map(projectHistoryMessage)
    },
    async activities(id: string): Promise<readonly StoredActivity[]> {
      if (!(await store.getInfo(id))) throw new ChatWorkflowError('SESSION_NOT_FOUND')
      return store.requests.activities(id)
    },
    async requests(id: string): Promise<readonly StoredRequest[]> {
      if (!(await store.getInfo(id))) throw new ChatWorkflowError('SESSION_NOT_FOUND')
      return store.requests.list(id)
    },
    async create(chosen?: ModelSelection): Promise<WebSession> {
      // FR-053: without an explicit choice, the most recent model choice in any chat when still selectable.
      const resolved = chosen === undefined ? models.lastSelection() : chosen
      if (resolved && !models.selectable(resolved)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      const created = await store.create(registry.selectedId(), resolved)
      return chat(created.sessionId)
    },
    async selectModel(id: string, chosen: ModelSelection): Promise<WebSession> {
      if (!models.selectable(chosen)) throw new ChatWorkflowError('MODEL_NOT_SELECTABLE')
      await store.select(id, chosen)
      models.rememberSelection(chosen)
      return chat(id)
    },
    list: async () => (await store.chats()).map(project).map(withActive),
    async search(words: string): Promise<readonly WebSession[]> {
      const chats = await store.chats()
      const found = new Set(
        await store.search(
          words,
          chats.map(item => item.sessionId),
        ),
      )
      return chats
        .filter(item => found.has(item.sessionId))
        .map(project)
        .map(withActive)
    },
  }
}

function projectHistoryMessage(message: ChatHistoryMessage) {
  return {
    role: message.role,
    content: message.content,
    ...(message.role === 'user' && message.attachments
      ? {
          attachments: message.attachments.map(item => ({
            attachmentId: item.attachmentId,
            name: item.name,
            state: item.state,
            byteSize: item.byteSize,
            ...(item.detectedType ? { detectedType: item.detectedType } : {}),
            ...(item.rejectionCode ? { rejectionCode: item.rejectionCode } : {}),
            ...(item.preparation ? { preparation: item.preparation } : {}),
            ...(item.source
              ? {
                  source: {
                    sourceId: item.source.sourceId,
                    version: item.source.version,
                    kind: item.source.kind,
                    label: item.source.label,
                  },
                }
              : {}),
          })),
        }
      : {}),
    ...(message.role === 'assistant' && message.interrupted ? { interrupted: true } : {}),
    ...(message.role === 'tool'
      ? { toolCallId: message.toolCallId, name: message.name, isError: message.isError === true }
      : {}),
  }
}

export interface ChatHistoryMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool'
  readonly content: string
  readonly interrupted?: boolean
  readonly toolCallId?: string
  readonly name?: string
  readonly isError?: boolean
  readonly attachments?: readonly AttachmentView[]
}

export interface ChatRequestOperations {
  submit(request: AgentRequest): Promise<RequestSnapshot>
  get(requestId: string): RequestSnapshot
  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView
  events(requestId: string, after: number): readonly RequestEvent[]
  stop(requestId: string): RequestSnapshot
  subscribe(listener: (event: RequestEvent) => void): () => void
}

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
  readonly sessions: {
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

export function createConversationContribution(
  readMessages: (id: string) => Promise<readonly ChatHistoryMessage[]>,
): RunContribution {
  return {
    name: 'conversation',
    async contribute(context) {
      if (context.owner.kind !== 'chat') return {}
      const messages: ConversationMessage[] = []
      for (const message of await readMessages(context.owner.id)) {
        if (message.role !== 'user' && message.role !== 'assistant') continue
        messages.push({
          role: message.role,
          content: message.content,
          ...(message.role === 'assistant' && message.interrupted ? { unfinished: true } : {}),
          ...(message.role === 'user' && message.attachments?.length
            ? { attachments: message.attachments.map(item => ({ attachmentId: item.attachmentId, name: item.name })) }
            : {}),
        })
      }
      return { resources: [{ kind: 'conversation', messages }] }
    },
  }
}

function projectRequest(snapshot: RunSnapshot): RequestSnapshot {
  const { owner, ...fields } = snapshot
  return { ...fields, sessionId: owner.id }
}

export function createChatRequestOperations(deps: ChatRequestDependencies): ChatRequestOperations {
  return {
    async submit(request) {
      const selected = await readChatSelection(deps, request.sessionId)
      const prepared =
        request.deck || request.continueDeck
          ? await deps.deckPlanner.prepare(request, selected)
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
      await deps.preflightResearch(prepared.plan.grants.publicResearch)
      try {
        return projectRequest(
          await deps.runs.start(prepared.plan, {
            ...prepared.options,
            ...(request.attachmentIds === undefined ? {} : { attachmentIds: request.attachmentIds }),
            ...(request.draftRevision === undefined ? {} : { draftRevision: request.draftRevision }),
          }),
        )
      } catch (error) {
        if (error instanceof RunFailure && error.code === 'RUN_OWNER_BUSY') throw new ChatWorkflowError('SESSION_BUSY')
        throw error
      }
    },
    get: id => projectRequest(deps.runs.get(id)),
    stop: id => projectRequest(deps.runs.stop(id)),
    decide: (id, approval, decision) => deps.runs.decide(id, approval, decision),
    events: (id, after) => deps.runs.events(id, after),
    subscribe: listener => deps.runs.subscribe(listener),
  }
}

export async function readChatSelection(
  deps: Pick<ChatRequestDependencies, 'sessions' | 'providers'>,
  sessionId: string,
): Promise<ModelSelection> {
  const info = await deps.sessions.getInfo(sessionId).catch(() => undefined)
  if (!info) throw new ChatWorkflowError('SESSION_NOT_FOUND')
  try {
    await deps.sessions.read(sessionId)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'SESSION_CORRUPT')
      throw new ChatWorkflowError('CHAT_UNREADABLE')
    throw new ChatWorkflowError('SESSION_UNAVAILABLE')
  }
  const configured = deps.providers.providerSettings()
  if (!info.selection || !deps.providers.selectable(info.selection)) {
    const reason = !configured.length
      ? 'no-provider'
      : !configured.some(provider => provider.models.length)
        ? 'no-model'
        : info.selection || info.removedSelection
          ? 'model-removed'
          : 'no-selection'
    throw new ChatWorkflowError('NO_SELECTABLE_MODEL', { reason })
  }
  return info.selection
}
