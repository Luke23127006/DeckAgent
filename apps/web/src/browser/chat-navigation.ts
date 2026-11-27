import type { HistoryMessage, OutlineSnapshot, WebSession, WebSettings, WorkspaceList } from '@deckagent/host-contracts'
import { isActive } from './transport/index.ts'
import type { HostClient, ManagementClient, OutlineClient } from './transport/index.ts'
import { element } from './dom.ts'
import type { ShellDom } from './shell-dom.ts'
import type { ConversationView } from './features/chats/index.ts'
import type { DeckModel, DeckWorkflowView } from './features/deck/index.ts'
import type { modelPicker } from './features/providers/index.ts'
import type { DraftSync } from './draft-sync.ts'

export interface ChatNavigationOptions {
  readonly shell: ShellDom
  readonly client: HostClient
  readonly management: ManagementClient
  readonly outlines: OutlineClient
  readonly picker: ReturnType<typeof modelPicker>
  readonly timeline: ConversationView
  readonly workflow: DeckWorkflowView
  readonly deckModel: DeckModel
  readonly draftSync: DraftSync
  readonly sending: ReadonlySet<string>
  readonly run: (work: Promise<void>) => void
  readonly changed: () => void
  readonly onSessionOpen?: (sessionId: string) => void
  /** Runs after each read of the chat list, so that the React chat list reads it again. */
  readonly onRefreshed?: () => void
  readonly follow: (id: string, sessionId: string, expected: number) => Promise<void>
}

function emptySettings(): WebSettings {
  return {
    providers: [],
    providersVersion: 0,
    preferencesVersion: 0,
    persistentKeys: false,
    builtIns: [],
    runtime: { available: false },
  }
}

export class ChatNavigation {
  sessions: readonly WebSession[] = []
  workspaces: WorkspaceList = { workspaces: [], selectedId: 'default', version: 0 }
  settings: WebSettings = emptySettings()
  current: WebSession | undefined
  outlineState: OutlineSnapshot | undefined
  historyPresent = false
  chatTitle = 'Chat mới'
  opening: number | undefined
  creating = false
  generation = 0

  constructor(private readonly options: ChatNavigationOptions) {}

  /** Only an open or a send in progress blocks switching. A running request keeps going in the Host (UC-003 A13). */
  switchingBlocked(): boolean {
    const current = this.current
    return this.opening !== undefined || (!!current && this.options.sending.has(current.sessionId))
  }

  describeHistory(history: readonly HistoryMessage[]): void {
    this.historyPresent = history.length > 0
    const first = history
      .find(message => message.role === 'user')
      ?.content.replace(/\s+/g, ' ')
      .trim()
    const attachmentTitle = history.find(message => message.role === 'user')?.attachments?.[0]?.name
    const displayTitle = first || attachmentTitle
    this.chatTitle = displayTitle
      ? displayTitle.length > 64
        ? `${displayTitle.slice(0, 64)}…`
        : displayTitle
      : 'Chat mới'
  }

  renderModels(): void {
    const model = this.options.shell.model
    model.replaceChildren(new Option('Chọn model', ''))
    for (const provider of this.settings.providers) {
      const group = element('optgroup')
      group.label = provider.displayName
      for (const id of provider.models)
        group.append(new Option(id, JSON.stringify({ provider: provider.id, model: id })))
      model.append(group)
    }
    model.append(new Option('Thêm hoặc quản lý model…', '__settings'))
    const current = this.current
    model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
    this.options.changed()
  }

  /** The chats with draft text that this tab has not saved yet. The React chat list keeps them listed. */
  draftIds(): readonly string[] {
    return this.sessions
      .filter(session => this.options.draftSync.hasDraftText(session.sessionId))
      .map(session => session.sessionId)
  }

  async refresh(): Promise<void> {
    const [nextSettings, nextSessions, nextWorkspaces] = await Promise.all([
      this.options.management.settings(),
      this.options.management.sessions(),
      this.options.management.workspaces(),
    ])
    this.settings = nextSettings
    this.sessions = nextSessions
    if (nextWorkspaces.version >= this.workspaces.version) this.workspaces = nextWorkspaces
    const current = this.current
    if (current) this.current = this.sessions.find(session => session.sessionId === current.sessionId) ?? current
    this.renderModels()
    this.options.onRefreshed?.()
  }

  async showHistory(id: string, expected: number): Promise<void> {
    const history = await this.options.client.history(id)
    if (this.generation !== expected) return
    this.options.timeline.setHistory(history)
    this.describeHistory(history)
    this.options.changed()
  }

  async showActivities(id: string, expected: number): Promise<void> {
    const [entries, requests] = await Promise.all([
      this.options.management.activities(id),
      this.options.management.requests(id),
    ])
    if (this.generation !== expected) return
    this.options.timeline.setRecords(requests, entries)
  }

  async showOutlines(id: string, expected: number): Promise<void> {
    const next = await this.options.outlines.snapshot(id)
    if (this.generation !== expected || this.current?.sessionId !== id) return
    if (this.outlineState?.sessionId === id && this.outlineState.version > next.version) return
    this.outlineState = next
    this.options.timeline.setOutlines(next)
    await this.options.workflow.refresh(id)
    this.options.changed()
  }

  async open(listed: WebSession): Promise<void> {
    this.options.draftSync.closePreview()
    let session = listed
    const switching = this.current?.sessionId !== session.sessionId
    if (switching && this.switchingBlocked()) return
    this.options.picker.close()
    // Read everything before replacing current state. A failed open leaves the old chat intact.
    const previousGeneration = this.generation
    if (this.current) {
      this.options.draftSync.saveDraft()
      await this.options.draftSync.flushDraft(this.current.sessionId)
    }
    const loaded = await Promise.all([
      this.options.client.history(session.sessionId),
      this.options.management.activities(session.sessionId),
      this.options.management.requests(session.sessionId),
      this.options.outlines.snapshot(session.sessionId),
      this.options.draftSync.readDraft(session.sessionId),
    ])
    if (this.generation !== previousGeneration || (switching && this.switchingBlocked())) return
    this.options.shell.input.value = loaded[4]
    this.generation++
    if (this.current?.sessionId !== session.sessionId) {
      this.options.timeline.reset()
      this.outlineState = undefined
    }
    // The saved records say whether a request is active now; the list entry may be older.
    const activeRequestId = loaded[2].find(request => isActive(request.status))?.requestId
    const { activeRequestId: _listedRequest, ...rest } = listed
    session = { ...rest, ...(activeRequestId ? { activeRequestId } : {}) }
    this.current = session
    this.options.deckModel.open(session.sessionId)
    this.options.onSessionOpen?.(session.sessionId)
    try {
      sessionStorage.setItem('deckagent-session', session.sessionId)
    } catch {
      /* Session can still be selected from History. */
    }
    const expected = this.generation
    this.opening = expected
    this.renderModels()
    this.options.shell.status.hidden = true
    if (session.activeRequestId)
      this.options.timeline.snapshot({
        requestId: session.activeRequestId,
        sessionId: session.sessionId,
        status: 'active',
        text: '',
        sequence: 0,
      })
    this.options.changed()
    this.options.timeline.setHistory(loaded[0])
    this.describeHistory(loaded[0])
    this.options.timeline.setRecords(loaded[2], loaded[1])
    this.outlineState = loaded[3]
    this.options.timeline.setOutlines(loaded[3])
    await this.options.workflow.open(session.sessionId)
    if (this.opening === expected) this.opening = undefined
    this.options.changed()
    if (session.activeRequestId && this.generation === expected)
      this.options.run(this.options.follow(session.activeRequestId, session.sessionId, expected))
  }

  async newChat(): Promise<void> {
    if (this.switchingBlocked() || this.creating) return
    // An empty current chat of the workspace in use is reused; a new chat always joins the workspace in use.
    const current = this.current
    if (current && !this.historyPresent && current.workspaceId === this.workspaces.selectedId) {
      this.options.shell.input.focus()
      return
    }
    this.creating = true
    this.options.changed()
    try {
      // FR-053: the Host gives the new chat the most recent model choice of any chat, when still selectable.
      const created = await this.options.management.create()
      await this.refresh()
      await this.open(created)
    } finally {
      this.creating = false
      this.options.changed()
    }
  }

  /** Loads the saved list and opens the remembered chat, or starts a new one. */
  async start(): Promise<void> {
    await this.refresh()
    let remembered: string | null = null
    try {
      remembered = sessionStorage.getItem('deckagent-session')
    } catch {
      /* History remains available. */
    }
    const previous = this.sessions.find(session => session.sessionId === remembered)
    if (previous) await this.open(previous)
    else await this.newChat()
  }

}

export const createChatNavigation = (options: ChatNavigationOptions): ChatNavigation => new ChatNavigation(options)
