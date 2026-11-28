import type {
  AttachmentView,
  ChangeNotice,
  ChatDraft,
  ConfirmationTarget,
  DeckRequest,
  DeckSnapshot,
  HistoryMessage,
  ModelSelection,
  OutlineProposal,
  OutlineSnapshot,
  RequestSnapshot,
  StoredActivity,
  StoredRequest,
  WebSession,
  WebSettings,
  WorkspaceList,
} from '@deckagent/host-contracts'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  chatsKeys,
  createChat,
  listActivities,
  listChats,
  listRequests,
  readHistory,
  selectModel,
} from '../api/chats.ts'
import { ApiClientError } from '../api/client.ts'
import { confirmOutline, readOutlines } from '../api/deck.ts'
import * as drafts from '../api/drafts.ts'
import { getSettings, providersKeys } from '../api/providers.ts'
import { decideApproval, isActive, readRequest, sendRequest, stopRequest } from '../api/requests.ts'
import { getWorkspaces, workspacesKeys } from '../api/workspaces.ts'
import { conversationText, failureFeedback } from '../text.ts'
import { useChatNotices } from './use-chat-notices.ts'
import { useChats } from './use-chats.ts'
import { useRequestStream } from './use-request-stream.ts'
import { useSettings } from './use-settings.ts'
import type { RequestStreamTarget } from './use-request-stream.ts'

/** The longest request text in code points. */
export const requestLimit = 16000

/** The deck screens of the open chat: the Brief workflow and the published deck. The conversation calls this port. */
export interface ConversationDeck {
  readonly briefVersion: number | undefined
  readonly preparingDeck: boolean
  readonly deck: DeckSnapshot | undefined
  openChat(sessionId: string): void
  openWorkflow(sessionId: string): Promise<void>
  refreshWorkflow(sessionId: string): Promise<void>
  requestRevision(): void
  /** The deck part of a request, or `undefined` for a chat request. `proposal` is the current Outline. */
  command(skip: boolean, proposal: OutlineProposal | undefined): DeckRequest | undefined
}

export interface ConversationStatus {
  readonly text: string
  readonly kind?: 'error' | 'sending'
  readonly title?: string
}

export interface AttachmentPreview {
  readonly name: string
  readonly text?: string
  readonly imageUrl?: string
}

export interface ConversationOptions {
  readonly initialSessionId?: string
  readonly openSettings: (sessionId?: string) => void
  readonly missingChat: () => void
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

function errorCode(error: unknown): string {
  if (error instanceof ApiClientError) return error.code
  return error instanceof Error ? error.message : ''
}

/** Why Send is not offered for the open chat (FR-046, UC-003 A17); `undefined` when it is. The draft is always kept. */
export function sendBlocked(chat: WebSession | undefined, settings: WebSettings): string | undefined {
  if (!settings.runtime.available) {
    const feedback = failureFeedback(settings.runtime.reason)
    return `${feedback.label}. ${feedback.detail}`
  }

  if (!chat || chat.selectable) return undefined
  if (!settings.providers.length) return conversationText.noProviders
  if (!settings.providers.some(provider => provider.models.length)) return conversationText.noModels
  const removed = chat.removedSelection ?? chat.selection

  if (removed) return conversationText.removedModel(removed.model)

  return conversationText.noModel
}

/**
 * The open chat and its work: history, requests, activities, the draft and the Outline snapshot. The Host owns each
 * value; this object keeps the last read and the live state of the stream, and guards each read with a generation, so
 * that a late reply of another chat never changes the open chat.
 */
export class Conversation<D extends ConversationDeck = ConversationDeck> {
  version = 0
  input: HTMLTextAreaElement | null = null
  currentId: string | undefined
  private chatEntry: WebSession | undefined
  activeRequestId: string | undefined
  private readonly endedRequests = new Set<string>()
  history: readonly HistoryMessage[] = []
  requests: readonly StoredRequest[] = []
  activities: readonly StoredActivity[] = []
  readonly live = new Map<string, RequestSnapshot>()
  readonly disconnected = new Set<string>()
  readonly summarized = new Set<string>()
  outlines: OutlineSnapshot | undefined
  historyPresent = false
  chatTitle: string = conversationText.newChat
  opening: number | undefined
  creating = false
  generation = 0
  reconnecting = false
  readonly sending = new Set<string>()
  readonly selecting = new Set<string>()
  readonly stopping = new Set<string>()
  status: ConversationStatus | undefined
  preview: AttachmentPreview | undefined
  private readonly research = new Map<string, boolean>()
  private readonly confirmationTargets = new Map<string, ConfirmationTarget>()
  private readonly listeners = new Set<() => void>()
  private disposed = false
  private polling = false
  // The draft mirror: what this page last read or typed for each chat. It is not a second store (FR-038).
  private readonly drafts = new Map<string, string>()
  private readonly draftStates = new Map<string, ChatDraft>()
  private readonly draftWork = new Map<string, Promise<void>>()
  private readonly pendingDrafts = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly pendingNotices = new Map<string, number>()
  private readonly noticeVersions = new Map<string, number>()
  private readonly syncingNotices = new Set<string>()
  private readonly attachmentBusy = new Set<string>()

  readonly deck: D

  constructor(
    private readonly cache: QueryClient,
    createDeck: (owner: Conversation<D>) => D,
    private readonly options: ConversationOptions,
  ) {
    this.deck = createDeck(this)
  }

  /** The composer gives its text field. */
  attachInput(node: HTMLTextAreaElement): void {
    this.input = node
  }

  detachInput(node: HTMLTextAreaElement): void {
    if (this.input === node) this.input = null
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getVersion = (): number => this.version

  changed(): void {
    if (this.disposed) return
    this.version++
    for (const listener of this.listeners) listener()
  }

  get settings(): WebSettings {
    return this.cache.getQueryData<WebSettings>(providersKeys.settings) ?? emptySettings()
  }

  get chats(): readonly WebSession[] {
    return this.cache.getQueryData<readonly WebSession[]>(chatsKeys.list) ?? []
  }

  get workspaces(): WorkspaceList | undefined {
    return this.cache.getQueryData<WorkspaceList>(workspacesKeys.all)
  }

  /** The open chat as the chat list shows it, with the request that is active now. */
  get current(): WebSession | undefined {
    if (!this.currentId) return undefined
    const listed = this.chats.find(chat => chat.sessionId === this.currentId) ?? this.chatEntry
    if (!listed) return undefined
    const { activeRequestId: _listed, ...rest } = listed
    return this.activeRequestId ? { ...rest, activeRequestId: this.activeRequestId } : rest
  }

  get text(): string {
    return this.input?.value ?? ''
  }

  private setText(value: string): void {
    if (this.input && this.input.value !== value) this.input.value = value
  }

  setStatus(status: ConversationStatus | undefined): void {
    this.status = status
    this.changed()
  }

  run(work: Promise<void>): void {
    work.catch((error: unknown) => {
      if (this.disposed) return
      const feedback = failureFeedback(errorCode(error))
      this.setStatus({
        text: `${feedback.label}. ${feedback.detail}`,
        kind: 'error',
        ...(feedback.code ? { title: conversationText.errorCode(feedback.code) } : {}),
      })
    })
  }

  /** Only an open or a send in progress blocks switching. A running request keeps going in the Host (UC-003 A13). */
  switchingBlocked(): boolean {
    return this.opening !== undefined || (!!this.currentId && this.sending.has(this.currentId))
  }

  get locked(): boolean {
    return this.switchingBlocked() || this.creating
  }

  get busy(): boolean {
    return this.opening !== undefined || this.creating
  }

  /** The chats with draft text that this tab has not saved yet. The chat list keeps them listed. */
  draftIds(): readonly string[] {
    return this.chats.filter(chat => this.hasDraftText(chat.sessionId)).map(chat => chat.sessionId)
  }

  draft(): ChatDraft | undefined {
    return this.currentId ? this.draftStates.get(this.currentId) : undefined
  }

  attachmentsBusy(): boolean {
    return !!this.currentId && this.attachmentBusy.has(this.currentId)
  }

  researchEnabled(): boolean {
    return !!this.currentId && this.research.get(this.currentId) === true
  }

  setResearch(enabled: boolean): void {
    if (!this.currentId) return
    this.research.set(this.currentId, enabled)
    this.changed()
  }

  /** Why Send is unavailable now, as a list of conditions. The composer shows the text of `sendBlocked`. */
  submitDisabled(): boolean {
    const current = this.current
    const draft = this.draft()
    return (
      !!sendBlocked(current, this.settings) ||
      !current ||
      this.creating ||
      this.reconnecting ||
      this.opening !== undefined ||
      this.sending.has(current.sessionId) ||
      this.selecting.has(current.sessionId) ||
      this.attachmentsBusy() ||
      (draft?.attachments?.some(item => item.state !== 'ready') ?? false) ||
      !!this.activeRequestId
    )
  }

  /** The Outline proposal that is current now. */
  currentProposal(): OutlineProposal | undefined {
    return this.outlines?.proposals.find(proposal => proposal.outlineId === this.outlines?.currentId)
  }

  /** A request is active or a send is in progress for the open chat. */
  working(): boolean {
    return !!this.activeRequestId || (!!this.currentId && this.sending.has(this.currentId))
  }

  private describeHistory(history: readonly HistoryMessage[]): void {
    this.historyPresent = history.length > 0
    const user = history.find(message => message.role === 'user')
    const name = user?.content.replace(/\s+/g, ' ').trim() || user?.attachments?.[0]?.name
    this.chatTitle = name ? (name.length > 64 ? `${name.slice(0, 64)}…` : name) : conversationText.newChat
  }

  /** Reads the settings, the chat list and the workspace list again. */
  async refresh(): Promise<void> {
    await Promise.all([
      this.cache.fetchQuery({ queryKey: providersKeys.settings, queryFn: () => getSettings(), staleTime: 0 }),
      this.cache.fetchQuery({ queryKey: chatsKeys.list, queryFn: () => listChats(), staleTime: 0 }),
      this.cache.fetchQuery({ queryKey: workspacesKeys.all, queryFn: () => getWorkspaces(), staleTime: 0 }),
    ])
    this.adoptListedRequest()
    this.changed()
  }

  /** A request that another interface started for the open chat shows here too. */
  adoptListedRequest(): void {
    const listed = this.chats.find(chat => chat.sessionId === this.currentId)
    if (listed) this.chatEntry = listed
    const id = listed?.activeRequestId
    if (id && !this.activeRequestId && !this.endedRequests.has(id) && this.opening === undefined) {
      this.activeRequestId = id
      this.changed()
    }
  }

  async showHistory(id: string, expected: number): Promise<void> {
    const history = await readHistory(id)
    if (this.generation !== expected) return
    this.history = history
    this.describeHistory(history)
    this.changed()
  }

  async showActivities(id: string, expected: number): Promise<void> {
    const [entries, requests] = await Promise.all([listActivities(id), listRequests(id)])
    if (this.generation !== expected) return
    this.setRecords(requests, entries)
  }

  async showOutlines(id: string, expected: number): Promise<void> {
    const next = await readOutlines(id)
    if (this.generation !== expected || this.currentId !== id) return
    if (this.outlines?.sessionId === id && this.outlines.version > next.version) return
    this.outlines = next
    await this.deck.refreshWorkflow(id)
    this.changed()
  }

  /** Saved records only move forward: an older response never turns an ended request active again. */
  setRecords(requests: readonly StoredRequest[], activities: readonly StoredActivity[]): void {
    const knownRequests = new Map(this.requests.map(request => [request.requestId, request]))

    for (const request of requests) {
      const previous = knownRequests.get(request.requestId)
      if (!previous || isActive(previous.status) || !isActive(request.status))
        knownRequests.set(request.requestId, request)
    }

    this.requests = [...knownRequests.values()]
    const knownActivities = new Map(this.activities.map(activity => [`${activity.requestId}/${activity.id}`, activity]))

    for (const activity of activities) {
      const key = `${activity.requestId}/${activity.id}`
      const previous = knownActivities.get(key)
      if (!previous || previous.status === 'running' || activity.status !== 'running')
        knownActivities.set(key, { ...activity, sequence: previous?.sequence ?? activity.sequence })
    }

    this.activities = [...knownActivities.values()].toSorted((a, b) =>
      a.requestId === b.requestId ? a.sequence - b.sequence : a.requestId < b.requestId ? -1 : 1,
    )

    this.changed()
  }

  /** The live state of a request from the stream or a reply of the Host. */
  snapshot(value: RequestSnapshot): void {
    const previous = this.live.get(value.requestId)
    if (previous && !isActive(previous.status) && isActive(value.status)) return
    if (previous && previous.sequence > value.sequence) return
    this.live.set(value.requestId, value)
    this.disconnected.delete(value.requestId)
    this.changed()
  }

  private resetRecords(): void {
    this.history = []
    this.requests = []
    this.activities = []
    this.live.clear()
    this.disconnected.clear()
    this.summarized.clear()
    this.outlines = undefined
  }

  async open(listed: WebSession): Promise<void> {
    this.closePreview()
    const id = listed.sessionId
    const switching = this.currentId !== id
    if (switching && this.switchingBlocked()) return

    // Read everything before replacing current state. A failed open leaves the old chat intact.
    const previousGeneration = this.generation

    if (this.currentId) {
      this.saveDraft()
      await this.flushDraft(this.currentId)
    }

    const [history, activities, requests, outlines, text] = await Promise.all([
      readHistory(id),
      listActivities(id),
      listRequests(id),
      readOutlines(id),
      this.readDraft(id),
    ])
    if (this.generation !== previousGeneration || (switching && this.switchingBlocked())) return

    this.setText(text)
    this.generation++
    if (switching) this.resetRecords()
    // The saved records say whether a request is active now; the list entry may be older.
    this.activeRequestId = requests.find(request => isActive(request.status))?.requestId
    this.currentId = id
    this.chatEntry = listed
    this.deck.openChat(id)

    try {
      sessionStorage.setItem('deckagent-session', id)
    } catch {
      /* The chat can still be selected from the list. */
    }

    const expected = this.generation
    this.opening = expected
    this.status = undefined
    if (this.activeRequestId)
      this.snapshot({ requestId: this.activeRequestId, sessionId: id, status: 'active', text: '', sequence: 0 })
    this.history = history
    this.describeHistory(history)
    this.setRecords(requests, activities)
    this.outlines = outlines
    this.changed()
    await this.deck.openWorkflow(id)
    if (this.opening === expected) this.opening = undefined
    this.changed()
  }

  async newChat(): Promise<void> {
    if (this.switchingBlocked() || this.creating) return

    // An empty current chat of the workspace in use is reused; a new chat always joins the workspace in use.
    const current = this.current
    if (current && !this.historyPresent && current.workspaceId === (this.workspaces?.selectedId ?? 'default')) {
      this.input?.focus()
      return
    }

    this.creating = true
    this.changed()

    try {
      // FR-053: the Host gives the new chat the most recent model choice of any chat, when still selectable.
      const created = await createChat()
      await this.refresh()
      await this.open(created)
    } finally {
      this.creating = false
      this.changed()
    }
  }

  /** Opens the chat of the URL, or the remembered chat, or starts a new chat. */
  async start(): Promise<void> {
    await this.refresh()
    if (this.disposed) return

    const wanted = this.options.initialSessionId
    if (wanted !== undefined) {
      const target = this.chats.find(chat => chat.sessionId === wanted)
      if (!target) {
        this.options.missingChat()
        return
      }
      await this.open(target)
      return
    }

    let remembered: string | null = null

    try {
      remembered = sessionStorage.getItem('deckagent-session')
    } catch {
      /* The list stays available. */
    }

    const previous = this.chats.find(chat => chat.sessionId === remembered)
    if (previous) await this.open(previous)
    else await this.newChat()
  }

  async reconnect(): Promise<void> {
    if (this.reconnecting) return
    this.reconnecting = true
    this.changed()
    const expected = this.generation
    try {
      await this.refresh()
      const current = this.current
      if (current && this.generation === expected) await this.open(current)
    } finally {
      this.reconnecting = false
      this.changed()
    }
  }

  async openSettings(): Promise<void> {
    const id = this.currentId
    if (id) {
      this.saveDraft()
      if (!(await this.flushDraft(id))) return
    }
    this.options.openSettings(id)
  }

  async chooseModel(selection: ModelSelection): Promise<void> {
    const id = this.currentId
    if (!id || this.selecting.has(id)) return
    this.selecting.add(id)
    this.changed()
    try {
      await selectModel(id, selection)
      await this.refresh()
      if (this.currentId === id) this.status = undefined
    } finally {
      this.selecting.delete(id)
      this.changed()
    }
  }

  // The request stream of the open chat.

  /** The request that the stream follows now. */
  streamTarget(): RequestStreamTarget | undefined {
    if (!this.activeRequestId || !this.currentId || this.opening !== undefined) return undefined
    return { requestId: this.activeRequestId, sessionId: this.currentId, generation: this.generation }
  }

  isStreamCurrent(target: RequestStreamTarget): boolean {
    return !this.disposed && this.generation === target.generation
  }

  activity(value: StoredActivity): void {
    this.setRecords([], [value])
  }

  markSummarized(id: string): void {
    if (this.summarized.has(id)) return
    this.summarized.add(id)
    this.changed()
  }

  connectionLost(id: string): void {
    this.disconnected.add(id)
    this.changed()
  }

  /** The stream saw the end of the request. The saved records replace the live state. */
  async finish(target: RequestStreamTarget): Promise<void> {
    const { requestId, sessionId, generation } = target
    this.endedRequests.add(requestId)
    try {
      await Promise.all([
        this.showHistory(sessionId, generation),
        this.showActivities(sessionId, generation),
        this.showOutlines(sessionId, generation),
      ])
      await this.refresh()
    } finally {
      // A saved terminal event ends this request even if a later read fails.
      if (this.generation === generation && this.currentId === sessionId && this.activeRequestId === requestId)
        this.activeRequestId = undefined
      this.changed()
    }
  }

  /** Reads the activities and the Outline while a request runs. */
  poll(): void {
    const id = this.currentId
    if (!id || !this.activeRequestId || this.polling || this.disposed) return
    this.polling = true
    const expected = this.generation
    this.run(
      Promise.all([this.showActivities(id, expected), this.showOutlines(id, expected)])
        .then(() => {})
        .catch(() => {
          if (this.generation === expected && this.activeRequestId) this.connectionLost(this.activeRequestId)
        })
        .finally(() => {
          this.polling = false
        }),
    )
  }

  stop(): void {
    const id = this.activeRequestId
    if (!id || this.stopping.has(id)) return
    this.stopping.add(id)
    this.changed()
    // The Host saves the stop at once (NFR-011); the stream then reports it, and this snapshot covers a lost stream.
    this.run(
      stopRequest(id)
        .then(value => this.snapshot(value))
        .finally(() => {
          this.stopping.delete(id)
          this.changed()
        }),
    )
  }

  async approve(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): Promise<void> {
    await decideApproval(requestId, approvalId, decision)
    const saved = await readRequest(requestId)
    if (this.currentId === saved.sessionId) this.snapshot(saved)
  }

  // Sending.

  async submit(text: string, skip = false, continueDeck = false): Promise<void> {
    const current = this.current
    if (!current || (continueDeck ? this.continueDisabled() : this.submitDisabled())) return

    const id = current.sessionId
    if (continueDeck && this.draftStates.get(id)?.attachments?.length) {
      this.setStatus({ text: conversationText.sendOrRemoveFiles, kind: 'error' })
      return
    }

    if (!text.trim() && !this.draftStates.get(id)?.attachments?.length) return

    if ([...text].length > requestLimit) {
      this.setStatus({ text: conversationText.tooLong, kind: 'error' })
      return
    }

    const expected = this.generation
    const command = continueDeck ? undefined : this.deck.command(skip, this.currentProposal())
    const publicResearch = command?.sourceChoice?.publicResearch ?? this.research.get(id) === true
    this.sending.add(id)
    this.status = { text: conversationText.sending, kind: 'sending' }
    this.changed()

    try {
      // A refused send leaves the draft unchanged; only an accepted request empties the composer.
      if (!(await this.flushDraft(id))) return
      const accepted = await this.enqueueDraft(id, async () => {
        const draft = this.draftStates.get(id)
        const draftRevision = draft?.revision
        const consumesDraft = draftRevision !== undefined && (!continueDeck || draft?.text === text)
        const reply = await sendRequest({
          sessionId: id,
          input: text,
          ...(continueDeck ? { continueDeck: true as const } : {}),
          publicResearch,
          ...(command ? { deck: command } : {}),
          ...(consumesDraft ? { draftRevision, attachmentIds: draft?.attachmentIds ?? [] } : {}),
        })

        if (consumesDraft)
          this.receiveDraft(
            { sessionId: id, text: '', revision: draftRevision + 1, attachmentIds: [], attachments: [] },
            true,
          )

        return reply
      })
      if (this.generation === expected && this.currentId === id) {
        if (this.text === text) {
          this.setText('')
          this.drafts.set(id, '')
        }
        this.activeRequestId = accepted.requestId
        this.snapshot(accepted)
        this.status = undefined
        this.changed()
      }
      await Promise.all([this.refresh(), this.showHistory(id, expected), this.showActivities(id, expected)])
    } finally {
      this.sending.delete(id)
      this.changed()
    }
  }

  /** The continue control of an unfinished deck is unavailable while a request runs or a send is in progress. */
  continueDisabled(): boolean {
    return this.working()
  }

  skipQuestions(): void {
    if (this.text.trim() || this.draft()?.attachments?.length) {
      this.setStatus({ text: conversationText.sendBeforeSkip })
      return
    }
    this.run(this.submit(conversationText.skipInput, true))
  }

  /** Adds a suggested answer of the Brief interview to the draft. */
  appendAnswer(text: string): void {
    const value = this.text
    this.setText(`${value}${value.trim() ? '\n' : ''}${text}`)
    this.input?.focus()
    this.saveDraft()
    this.changed()
  }

  /** Selects a revision of the current Outline, and adds `text` to the draft when it is given. */
  revise(text?: string): void {
    this.deck.requestRevision()
    if (text) {
      const value = this.text
      this.setText(value.trim() ? `${value}\n\n${text}` : text)
      this.saveDraft()
      this.changed()
    }
    this.input?.focus()
  }

  /** Puts the text of a failed request into the composer. */
  retry(text: string): void {
    this.setText(text)
    this.input?.focus()
    this.input?.setSelectionRange(text.length, text.length)
    this.saveDraft()
    this.changed()
  }

  continueDeck(): void {
    const saved = this.deck.deck?.generation
    const id = this.currentId
    if (!saved || id !== saved.receipt.sessionId) return
    if (saved.state === 'pending') this.run(this.confirmTarget(saved.receipt))
    else if (saved.state === 'incomplete')
      this.run(this.submit(this.text.trim() ? this.text : conversationText.continueInput, false, true))
  }

  async confirmOutline(proposal: OutlineProposal): Promise<void> {
    const current = this.current
    if (!current || this.activeRequestId || this.sending.has(current.sessionId)) return

    if (this.text.trim() || this.draftStates.get(current.sessionId)?.attachments?.length) {
      this.setStatus({ text: conversationText.unsentBeforeConfirm })
      return
    }

    if (!proposal.brief || this.outlines?.currentId !== proposal.outlineId) throw new Error('OUTLINE_STALE')

    const id = current.sessionId
    const key = `${id}/${proposal.outlineId}/${proposal.version}/${proposal.brief.version}`

    let target = this.confirmationTargets.get(key)
    if (!target) {
      let confirmationId: string | null = null
      try {
        confirmationId = sessionStorage.getItem(`confirmation:${key}`)
      } catch {
        /* Optional reload retry identity. */
      }
      target = {
        confirmationId: confirmationId ?? crypto.randomUUID(),
        outlineId: proposal.outlineId,
        outlineVersion: proposal.version,
        briefId: proposal.brief.briefId,
        briefVersion: proposal.brief.version,
      }
      this.confirmationTargets.set(key, target)
      try {
        sessionStorage.setItem(`confirmation:${key}`, target.confirmationId)
      } catch {
        /* In-memory retries remain idempotent. */
      }
    }

    await this.confirmTarget(target)
  }

  async confirmTarget(target: ConfirmationTarget): Promise<void> {
    const current = this.current
    if (!current || this.activeRequestId || this.sending.has(current.sessionId)) return

    const id = current.sessionId
    const expected = this.generation
    this.sending.add(id)
    this.changed()

    try {
      if (!(await this.flushDraft(id))) return
      const draft = await drafts.readDraft(id)
      if (draft.text.trim() || draft.attachmentIds?.length) throw new Error('DRAFT_CONFLICT')
      const accepted = await confirmOutline(id, target)
      if (this.generation !== expected || this.currentId !== id) return
      this.snapshot(accepted.request)
      if (isActive(accepted.request.status)) this.activeRequestId = accepted.request.requestId
      await this.showOutlines(id, expected)
      await this.refresh()
    } catch (error) {
      await this.showOutlines(id, expected)
      await this.refresh()
      this.status = { text: conversationText.confirmFailed }
      throw error
    } finally {
      this.sending.delete(id)
      this.changed()
    }
  }

  // The draft that the Host keeps for each chat (FR-038).

  hasDraftText(id: string): boolean {
    return !!this.drafts.get(id)?.trim()
  }

  private enqueueDraft<T>(id: string, action: () => Promise<T>): Promise<T> {
    const work = (this.draftWork.get(id) ?? Promise.resolve()).then(action)
    this.draftWork.set(
      id,
      work.then(
        () => {},
        () => {},
      ),
    )
    return work
  }

  private receiveDraft(draft: ChatDraft, acknowledgedText = false): void {
    const before = this.draftStates.get(draft.sessionId)
    if (before?.revision !== undefined && draft.revision !== undefined && draft.revision < before.revision) return

    if (!acknowledgedText && before && draft.text !== before.text && draft.text !== this.drafts.get(draft.sessionId)) {
      // A read must not take a newer revision while the editor keeps older text.
      this.setStatus({ text: conversationText.draftChanged, kind: 'error' })
      return
    }

    const attachments = draft.attachments?.map(item => {
      const known = before?.attachments?.find(previous => previous.attachmentId === item.attachmentId)
      return known && known.state !== 'preparing' && item.state === 'preparing' ? known : item
    })
    this.draftStates.set(draft.sessionId, { ...draft, ...(attachments ? { attachments } : {}) })
    if (this.currentId === draft.sessionId) this.changed()
  }

  /** A newer `draft` notice of the open chat. The editor takes the new text only when it holds no unsaved edit. */
  async onDraftNotice(id: string, version: number): Promise<void> {
    if (this.disposed || this.currentId !== id || version <= (this.noticeVersions.get(id) ?? -1)) return
    if (this.attachmentBusy.has(id) || this.pendingDrafts.has(id) || this.syncingNotices.has(id)) {
      this.pendingNotices.set(id, Math.max(version, this.pendingNotices.get(id) ?? -1))
      return
    }
    this.syncingNotices.add(id)
    try {
      const draft = await drafts.readDraft(id)
      this.noticeVersions.set(id, Math.max(version, this.noticeVersions.get(id) ?? -1))
      if (
        this.currentId === id &&
        !this.pendingDrafts.has(id) &&
        this.text === (this.draftStates.get(id)?.text ?? '')
      ) {
        this.drafts.set(id, draft.text)
        this.setText(draft.text)
        this.receiveDraft(draft, true)
      } else this.receiveDraft(draft, false)
    } finally {
      this.syncingNotices.delete(id)
      this.drainPendingNotice(id)
    }
  }

  /** Keeps the typed text and saves it after a short pause. */
  saveDraft(): void {
    const id = this.currentId
    if (!id) return
    this.drafts.set(id, this.text)
    clearTimeout(this.pendingDrafts.get(id))
    this.pendingDrafts.set(
      id,
      setTimeout(() => {
        void this.flushDraft(id)
      }, 250),
    )
  }

  async flushDraft(id: string): Promise<boolean> {
    try {
      const timer = this.pendingDrafts.get(id)
      if (timer === undefined) {
        await this.draftWork.get(id)
        return true
      }
      clearTimeout(timer)
      this.pendingDrafts.delete(id)
      try {
        const text = this.drafts.get(id) ?? ''
        await this.enqueueDraft(id, async () => {
          const revision = this.draftStates.get(id)?.revision
          if (revision === undefined) throw new Error('DRAFT_CONFLICT')
          this.receiveDraft(await drafts.saveDraft(id, text, revision), true)
        })
        return true
      } catch (error) {
        this.setStatus({
          text: errorCode(error) === 'DRAFT_CONFLICT' ? conversationText.draftChanged : conversationText.draftNotSaved,
          kind: 'error',
        })
        return false
      }
    } finally {
      this.drainPendingNotice(id)
    }
  }

  private async readDraft(id: string): Promise<string> {
    if (!(await this.flushDraft(id))) throw new Error('DRAFT_NOT_SAVED')
    const draft = await drafts.readDraft(id)
    this.receiveDraft(draft, true)
    this.drafts.set(id, draft.text)
    return draft.text
  }

  async uploadAttachments(files: readonly File[]): Promise<void> {
    const id = this.currentId
    if (!id || this.attachmentBusy.has(id)) return
    this.attachmentBusy.add(id)
    this.changed()
    try {
      if (!(await this.flushDraft(id))) return
      for (const file of files)
        await this.enqueueDraft(id, async () => {
          const revision = this.draftStates.get(id)?.revision
          if (revision === undefined) throw new Error('DRAFT_CONFLICT')
          this.receiveDraft((await drafts.uploadAttachment(id, file, revision)).draft)
        })
      await this.refresh()
    } catch (error) {
      this.receiveDraft(await drafts.readDraft(id))
      throw error
    } finally {
      this.attachmentBusy.delete(id)
      this.changed()
      this.drainPendingNotice(id)
    }
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    const id = this.currentId
    if (!id || this.attachmentBusy.has(id)) return
    this.attachmentBusy.add(id)
    this.changed()
    try {
      if (!(await this.flushDraft(id))) return
      await this.enqueueDraft(id, async () => {
        const revision = this.draftStates.get(id)?.revision
        if (revision === undefined) throw new Error('DRAFT_CONFLICT')
        this.receiveDraft(await drafts.removeAttachment(id, attachmentId, revision))
      })
      await this.refresh()
    } catch (error) {
      const draft = await drafts.readDraft(id).catch(() => undefined)
      if (draft) this.receiveDraft(draft)
      throw error
    } finally {
      this.attachmentBusy.delete(id)
      this.changed()
      this.drainPendingNotice(id)
    }
  }

  async previewAttachment(item: AttachmentView): Promise<void> {
    const id = this.currentId
    if (!id) return

    const preview = await drafts.previewAttachment(id, item.attachmentId)
    if (this.currentId !== id) return

    this.closePreview()

    this.preview =
      typeof preview === 'string'
        ? { name: item.name, text: preview }
        : { name: item.name, imageUrl: URL.createObjectURL(preview) }

    this.changed()
  }

  closePreview(): void {
    if (!this.preview) return
    if (this.preview.imageUrl) URL.revokeObjectURL(this.preview.imageUrl)
    this.preview = undefined
    this.changed()
  }

  private drainPendingNotice(id: string): void {
    const pending = this.pendingNotices.get(id)
    if (pending === undefined) return
    this.pendingNotices.delete(id)
    void this.onDraftNotice(id, pending)
  }

  /** A change notice of the open chat. */
  async onNotice(notice: ChangeNotice): Promise<void> {
    const id = this.currentId
    if (!id || notice.key !== id) return
    if (notice.topic === 'draft') return this.onDraftNotice(id, notice.version)

    if (notice.topic === 'brief') {
      if (this.deck.briefVersion === undefined || notice.version <= this.deck.briefVersion) return
      await this.deck.refreshWorkflow(id)
      this.changed()
      return
    }

    if (notice.topic !== 'outline') return
    if (this.outlines?.sessionId !== id || notice.version <= this.outlines.version) return

    return this.showOutlines(id, this.generation)
  }

  /** Saves the typed draft when the page goes away. */
  leave(): void {
    if (!this.currentId) return
    this.saveDraft()
    void this.flushDraft(this.currentId)
  }

  /** Starts or restarts the object after a mount. */
  activate(): void {
    this.disposed = false
  }

  dispose(): void {
    this.disposed = true
    for (const timer of this.pendingDrafts.values()) clearTimeout(timer)
    if (this.preview?.imageUrl) URL.revokeObjectURL(this.preview.imageUrl)
  }
}

/**
 * Owns the open chat for the conversation screen: it starts the chat of the URL, follows the active request through
 * the request stream hook, reads the change notices of the chat and polls the activities while a request runs.
 */
export function useConversation<D extends ConversationDeck>(
  createDeck: (owner: Conversation<D>) => D,
  options: ConversationOptions,
): Conversation<D> {
  const cache = useQueryClient()
  const [conversation] = useState(() => new Conversation(cache, createDeck, options))
  useSyncExternalStore(conversation.subscribe, conversation.getVersion)

  useEffect(() => {
    conversation.activate()
    conversation.run(conversation.start())
    const onPageHide = () => conversation.leave()
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) location.reload()
    }
    const timer = setInterval(() => conversation.poll(), 750)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      conversation.leave()
      conversation.dispose()
    }
  }, [conversation])

  // The screen shows the settings and the chat list, and a newer chat list can show a request that another
  // interface started for the open chat.
  useSettings()
  const chats = useChats().data
  useEffect(() => {
    if (chats) conversation.adoptListedRequest()
  }, [conversation, chats])

  useChatNotices(conversation.currentId, notice => conversation.onNotice(notice))
  useRequestStream(conversation.streamTarget(), {
    snapshot: (target, value) => {
      if (conversation.isStreamCurrent(target)) conversation.snapshot(value)
    },
    activity: (target, value) => {
      if (conversation.isStreamCurrent(target)) conversation.activity(value)
    },
    summarized: target => {
      if (conversation.isStreamCurrent(target)) conversation.markSummarized(target.requestId)
    },
    connectionLost: target => {
      if (conversation.isStreamCurrent(target)) conversation.connectionLost(target.requestId)
    },
    ended: target => {
      if (conversation.isStreamCurrent(target)) conversation.run(conversation.finish(target))
    },
  })
  return conversation
}
