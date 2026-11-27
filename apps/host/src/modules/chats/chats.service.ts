import type { AttachmentChats } from '../attachments/index.ts'
import type { RunOwner } from '../../runs/ports.ts'
import type {
  AttachmentView,
  ModelSelection,
  StoredActivity,
  StoredRequest,
  WebSession,
} from '@deckagent/host-contracts'
import type { WorkspaceChats, WorkspaceLookup } from '../workspaces/index.ts'
import { ChatError } from './chats.errors.ts'

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

/** The chat part of the session database. `SqliteChatStore` implements it. */
export interface ChatStore {
  getInfo(sessionId: string): Promise<unknown>
  read(sessionId: string): Promise<readonly ChatHistoryMessage[]>
  chats(): Promise<readonly ChatRecord[]>
  list(): Promise<readonly { readonly sessionId: string; readonly workspaceId: string | null }[]>
  create(workspaceId: string, selection?: ModelSelection): Promise<{ readonly sessionId: string }>
  select(sessionId: string, selection: ModelSelection): Promise<unknown>
  search(words: string, chatIds: readonly string[]): Promise<readonly string[]>
  ungroup(workspaceId: string): Promise<void>
}

/** One stored request of a chat, with the run owner that the run store keeps. */
export type ChatRunRecord = Omit<StoredRequest, 'sessionId'> & { readonly owner: RunOwner }

/** The runs of a chat as the run store reads them. */
export interface ChatRuns {
  activeFor(owner: RunOwner): string | undefined
  activities(owner: RunOwner): readonly StoredActivity[]
  list(owner: RunOwner): readonly ChatRunRecord[]
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

/** Coordinates chat creation, model selection, listing, search, and Browser projection. */
export class ChatService implements WorkspaceChats, AttachmentChats {
  constructor(
    private readonly store: ChatStore,
    private readonly runs: ChatRuns,
    private readonly registry: WorkspaceLookup,
    private readonly models: ChatModels,
    private readonly marks: ChatMarks,
  ) {}

  getInfo(id: string): Promise<unknown> {
    return this.store.getInfo(id)
  }

  async hasActiveRequest(workspaceId: string): Promise<boolean> {
    return (await this.store.list())
      .filter(chat => chat.workspaceId === workspaceId)
      .some(chat => this.runs.activeFor({ kind: 'chat', id: chat.sessionId }))
  }

  ungroup(workspaceId: string): Promise<void> {
    return this.store.ungroup(workspaceId)
  }

  async history(id: string): Promise<readonly ChatHistoryMessage[]> {
    return (await this.store.read(id)).filter(message => message.role !== 'system').map(projectHistoryMessage)
  }

  async activities(id: string): Promise<readonly StoredActivity[]> {
    if (!(await this.store.getInfo(id))) throw new ChatError('SESSION_NOT_FOUND')
    return this.runs.activities({ kind: 'chat', id })
  }

  async requests(id: string): Promise<readonly StoredRequest[]> {
    if (!(await this.store.getInfo(id))) throw new ChatError('SESSION_NOT_FOUND')
    return this.runs.list({ kind: 'chat', id }).map(toChatRequest)
  }

  async create(chosen?: ModelSelection): Promise<WebSession> {
    // FR-053: without an explicit choice, the most recent model choice in any chat when still selectable.
    const resolved = chosen === undefined ? this.models.lastSelection() : chosen
    if (resolved && !this.models.selectable(resolved)) throw new ChatError('MODEL_NOT_SELECTABLE')
    const created = await this.store.create(this.registry.selectedId(), resolved)
    return this.chat(created.sessionId)
  }

  async selectModel(id: string, chosen: ModelSelection): Promise<WebSession> {
    if (!this.models.selectable(chosen)) throw new ChatError('MODEL_NOT_SELECTABLE')
    await this.store.select(id, chosen)
    this.models.rememberSelection(chosen)
    return this.chat(id)
  }

  async list(): Promise<readonly WebSession[]> {
    return (await this.store.chats()).map(chat => this.withActive(this.project(chat)))
  }

  async search(words: string): Promise<readonly WebSession[]> {
    const chats = await this.store.chats()
    const found = new Set(
      await this.store.search(
        words,
        chats.map(item => item.sessionId),
      ),
    )
    return chats.filter(item => found.has(item.sessionId)).map(chat => this.withActive(this.project(chat)))
  }

  /** Browser projection of a chat. A chat with no user message yet is shown as a new chat. */
  private project(chat: ChatRecord): WebSession {
    return {
      sessionId: chat.sessionId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messageCount,
      workspaceId: chat.workspaceId,
      readable: chat.readable,
      title: chat.title || 'New chat',
      hasSlides: chat.readable && this.marks.hasSlides(chat.sessionId),
      selectable: this.models.selectable(chat.selection),
      ...(chat.selection ? { selection: chat.selection } : {}),
      ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),
      hasDraft: this.marks.hasDraft(chat.sessionId),
    }
  }

  private withActive(session: WebSession): WebSession {
    const activeRequestId = this.runs.activeFor({ kind: 'chat', id: session.sessionId })
    return { ...session, ...(activeRequestId ? { activeRequestId } : {}) }
  }

  private async chat(id: string): Promise<WebSession> {
    const found = (await this.store.chats()).find(item => item.sessionId === id)
    if (!found) throw new ChatError('SESSION_NOT_FOUND')
    return this.project(found)
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

/** Replaces the run owner of a stored request with the chat that owns it. */
export function toChatRequest<T extends { readonly owner: RunOwner }>(
  value: T,
): Omit<T, 'owner'> & { readonly sessionId: string } {
  const { owner, ...fields } = value
  return { ...fields, sessionId: owner.id }
}
