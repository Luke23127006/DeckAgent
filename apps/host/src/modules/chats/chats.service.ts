import type { ModelSelection, WebSession } from '@deckagent/host-contracts'
import type { WorkspaceChats, WorkspaceLookup } from '../workspaces/index.ts'

export type ChatWorkflowErrorCode = 'SESSION_NOT_FOUND' | 'MODEL_NOT_SELECTABLE' | 'CHAT_UNREADABLE' | 'DRAFT_TOO_LARGE'

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
  chats(): Promise<readonly ChatRecord[]>
  list(): Promise<readonly { readonly sessionId: string; readonly workspaceId: string | null }[]>
  create(workspaceId: string, selection?: ModelSelection): Promise<{ readonly sessionId: string }>
  select(sessionId: string, selection: ModelSelection): Promise<unknown>
  search(words: string, chatIds: readonly string[]): Promise<readonly string[]>
  ungroup(workspaceId: string): Promise<void>
  readonly requests: { activeFor(sessionId: string): string | undefined }
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
