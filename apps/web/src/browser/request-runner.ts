import type {
  ApprovalView,
  ConfirmationTarget,
  OutlineProposal,
  RequestSnapshot,
  RequestStatus,
  WebSession,
  WebSettings,
} from '@deckagent/host-contracts'
import { isActive } from './transport/index.ts'
import { HostRequestError } from './transport/index.ts'
import type { ConfirmationClient, HostClient, ManagementClient } from './transport/index.ts'
import { failureFeedback } from './features/requests/index.ts'
import type { ShellDom } from './shell-dom.ts'
import type { ConversationView } from './features/chats/index.ts'
import type { DeckModel, DeckWorkflowView } from './features/deck/index.ts'
import type { researchView } from './features/research/index.ts'
import type { DraftSync } from './draft-sync.ts'
import type { ChatNavigation } from './chat-navigation.ts'

/** Why Send is not offered for the open chat (FR-046, UC-003 A17); `undefined` when it is. The draft is always kept. */
export function sendBlocked(session: WebSession | undefined, settings: WebSettings): string | undefined {
  if (!settings.runtime.available) {
    const feedback = failureFeedback(settings.runtime.reason)
    return `${feedback.label}. ${feedback.detail}`
  }
  if (!session || session.selectable) return undefined
  if (!settings.providers.length)
    return 'Chưa có provider nào. Thêm provider và model trong Cài đặt model để gửi yêu cầu. Bản nháp được giữ nguyên.'
  if (!settings.providers.some(provider => provider.models.length))
    return 'Chưa thêm model nào. Thêm model trong Cài đặt model để gửi yêu cầu. Bản nháp được giữ nguyên.'
  const removed = session.removedSelection ?? session.selection
  if (removed)
    return `Model ${removed.model} đã bị gỡ; chat này chưa có model. Hãy chọn model khác để gửi. Hệ thống không tự chọn model.`
  return 'Chat này chưa chọn model. Hãy chọn model để gửi yêu cầu. Bản nháp được giữ nguyên.'
}

export interface RequestRunnerOptions {
  readonly shell: ShellDom
  readonly client: HostClient
  readonly management: ManagementClient
  readonly confirmations: ConfirmationClient
  readonly deckModel: DeckModel
  readonly timeline: ConversationView
  readonly workflow: DeckWorkflowView
  readonly research: ReturnType<typeof researchView>
  readonly draftSync: DraftSync
  readonly navigation: ChatNavigation
  readonly sending: Set<string>
  readonly run: (work: Promise<void>) => void
  readonly changed: () => void
  readonly requestLimit: number
}

export class RequestRunner {
  readonly stopping = new Set<string>()
  private readonly confirmationTargets = new Map<string, ConfirmationTarget>()
  private watch: AbortController | undefined
  private polling = false
  private disposed = false
  private timer: ReturnType<typeof setInterval> | undefined

  constructor(private readonly options: RequestRunnerOptions) {
    this.timer = setInterval(() => this.poll(), 750)
  }

  /**
   * Follows a request through the Host's saved events: the first connection replays from the start, a reconnect
   * continues after the last sequence, so nothing is missed or counted twice (FR-068). Leaving stops nothing.
   */
  async follow(id: string, sessionId: string, expected: number): Promise<void> {
    this.watch?.abort()
    const control = new AbortController()
    this.watch = control
    const parts = new Map<string, string>()
    let state: RequestStatus = 'active'
    let errorCode: string | undefined
    let cursor = 0
    let failures = 0
    let pendingApproval: ApprovalView | null = null
    const isCurrent = () => this.options.navigation.generation === expected
    const show = () =>
      this.options.timeline.snapshot({
        requestId: id,
        sessionId,
        status: state,
        text: [...parts.values()].filter(text => text.trim()).join('\n\n'),
        sequence: cursor,
        pendingApproval,
        ...(errorCode ? { errorCode } : {}),
      })
    while (!control.signal.aborted && isCurrent() && isActive(state)) {
      try {
        for await (const event of this.options.client.watch(id, control.signal, cursor)) {
          if (this.options.navigation.generation !== expected) return
          cursor = event.sequence
          failures = 0
          if (event.kind === 'text') parts.set(event.part, event.text)
          else if (event.kind === 'activity')
            this.options.timeline.activity({
              requestId: id,
              sequence: event.sequence,
              id: event.id,
              label: event.label,
              type: event.type,
              status: event.status,
            })
          else if (event.kind === 'status') {
            state = event.status
            errorCode = event.errorCode
            if (!isActive(state)) pendingApproval = null
          } else if (event.kind === 'approval')
            pendingApproval = event.approval.state === 'pending' ? event.approval : null
          else if (event.kind === 'notice' && event.code === 'CONVERSATION_SUMMARIZED')
            this.options.timeline.summarized(id)
          show()
        }
      } catch (error) {
        if (control.signal.aborted || this.options.navigation.generation !== expected) return
        if (error instanceof HostRequestError && error.message === 'REQUEST_NOT_FOUND') return
        this.options.timeline.connectionLost(id)
        failures++
        await new Promise(resolve => setTimeout(resolve, Math.min(5000, 500 * failures)))
      }
    }
    if (control.signal.aborted || this.options.navigation.generation !== expected) return
    await this.finishFollow(id, sessionId, expected)
  }

  private async finishFollow(id: string, sessionId: string, expected: number): Promise<void> {
    try {
      await Promise.all([
        this.options.navigation.showHistory(sessionId, expected),
        this.options.navigation.showActivities(sessionId, expected),
        this.options.navigation.showOutlines(sessionId, expected),
      ])
      await this.options.navigation.refresh()
    } finally {
      // A saved terminal event ends this request even if a later projection read fails.
      if (this.options.navigation.generation === expected) {
        const current = this.options.navigation.current
        if (current?.sessionId === sessionId && current.activeRequestId === id) {
          const { activeRequestId: _ended, ...rest } = current
          this.options.navigation.current = rest
        }
        this.options.changed()
      }
    }
  }

  stopActiveRequest(): void {
    const current = this.options.navigation.current
    const id = current?.activeRequestId
    if (!id || this.stopping.has(id)) return
    this.stopping.add(id)
    this.options.changed()
    // The Host saves the stop at once (NFR-011); the stream then reports it, and this snapshot covers a lost stream.
    this.options.run(
      this.options.client
        .stop(id)
        .then(snapshot => {
          this.options.timeline.snapshot(snapshot)
        })
        .finally(() => {
          this.stopping.delete(id)
          this.options.changed()
        }),
    )
  }

  async submitRequest(text: string, skip = false, continueDeck = false): Promise<void> {
    const shell = this.options.shell
    const navigation = this.options.navigation
    const current = navigation.current
    if (!current || (continueDeck ? shell.retryGeneration.disabled : shell.submit.disabled)) return
    const draftFor = (id: string) => this.options.draftSync.getDraftState(id)
    if (continueDeck && draftFor(current.sessionId)?.attachments?.length) {
      shell.status.hidden = false
      shell.status.dataset.kind = 'error'
      shell.status.textContent =
        'Hãy gửi hoặc gỡ tệp đang soạn trước khi tiếp tục deck đã xác nhận. Bản nháp được giữ nguyên.'
      return
    }
    if (!text.trim() && !draftFor(current.sessionId)?.attachments?.length) return
    if ([...text].length > this.options.requestLimit) {
      shell.status.hidden = false
      shell.status.dataset.kind = 'error'
      shell.status.textContent = 'Yêu cầu quá dài. Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.'
      return
    }
    const id = current.sessionId
    const expected = navigation.generation
    const command = continueDeck ? undefined : this.options.workflow.command(skip)
    const publicResearch = command?.sourceChoice?.publicResearch ?? this.options.research.enabled(id) === true
    this.options.sending.add(id)
    this.options.changed()
    shell.status.textContent = 'Đang gửi'
    shell.status.hidden = false
    shell.status.dataset.kind = 'sending'
    try {
      // A refused send leaves the draft unchanged; only an accepted request empties the composer.
      if (!(await this.options.draftSync.flushDraft(id))) return
      const accepted: RequestSnapshot = await this.send(id, text, continueDeck, command, publicResearch)
      if (navigation.generation === expected && navigation.current) {
        if (shell.input.value === text) {
          shell.input.value = ''
          this.options.draftSync.clearMirror(id)
        }
        navigation.current = { ...navigation.current, activeRequestId: accepted.requestId }
        this.options.timeline.snapshot(accepted)
        shell.status.hidden = true
        this.options.changed()
      }
      await Promise.all([
        navigation.refresh(),
        navigation.showHistory(id, expected),
        navigation.showActivities(id, expected),
      ])
      if (navigation.generation === expected) this.options.run(this.follow(accepted.requestId, id, expected))
    } finally {
      this.options.sending.delete(id)
      this.options.changed()
    }
  }

  private send(
    id: string,
    text: string,
    continueDeck: boolean,
    command: ReturnType<DeckWorkflowView['command']>,
    publicResearch: boolean,
  ): Promise<RequestSnapshot> {
    return this.options.draftSync.enqueueDraft(id, async () => {
      const draft = this.options.draftSync.getDraftState(id)
      const draftRevision = draft?.revision
      const attachmentIds = draft?.attachmentIds ?? []
      const consumesDraft = draftRevision !== undefined && (!continueDeck || draft?.text === text)
      const accepted = await this.options.client.send({
        sessionId: id,
        input: text,
        ...(continueDeck ? { continueDeck: true as const } : {}),
        publicResearch,
        ...(command ? { deck: command } : {}),
        ...(!consumesDraft ? {} : { draftRevision, attachmentIds }),
      })
      if (consumesDraft)
        this.options.draftSync.receiveDraft(
          { sessionId: id, text: '', revision: draftRevision + 1, attachmentIds: [], attachments: [] },
          true,
        )
      return accepted
    })
  }

  async confirmOutline(proposal: OutlineProposal): Promise<void> {
    const navigation = this.options.navigation
    const current = navigation.current
    if (!current || current.activeRequestId || this.options.sending.has(current.sessionId)) return
    if (
      this.options.shell.input.value.trim() ||
      this.options.draftSync.getDraftState(current.sessionId)?.attachments?.length
    ) {
      this.options.shell.status.hidden = false
      this.options.shell.status.textContent =
        'Bạn còn nội dung hoặc tệp chưa gửi. Hãy gửi yêu cầu sửa hoặc xóa bản nháp trước khi xác nhận đúng Outline đang hiển thị.'
      return
    }
    if (!proposal.brief || navigation.outlineState?.currentId !== proposal.outlineId) throw new Error('OUTLINE_STALE')
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
    const navigation = this.options.navigation
    const current = navigation.current
    if (!current || current.activeRequestId || this.options.sending.has(current.sessionId)) return
    const id = current.sessionId
    const expected = navigation.generation
    this.options.sending.add(id)
    this.options.changed()
    try {
      if (!(await this.options.draftSync.flushDraft(id))) return
      const draft = await this.options.management.draftState(id)
      if (draft.text.trim() || draft.attachmentIds?.length) throw new Error('DRAFT_CONFLICT')
      const accepted = await this.options.confirmations.confirm(id, {
        confirmationId: target.confirmationId,
        outlineId: target.outlineId,
        outlineVersion: target.outlineVersion,
        briefId: target.briefId,
        briefVersion: target.briefVersion,
      })
      if (navigation.generation !== expected || navigation.current?.sessionId !== id) return
      this.options.timeline.snapshot(accepted.request)
      if (isActive(accepted.request.status))
        navigation.current = { ...navigation.current, activeRequestId: accepted.request.requestId }
      await navigation.showOutlines(id, expected)
      await navigation.refresh()
      if (isActive(accepted.request.status)) this.options.run(this.follow(accepted.request.requestId, id, expected))
    } catch (error) {
      await navigation.showOutlines(id, expected)
      await navigation.refresh()
      const active = navigation.current
      if (navigation.generation === expected && active?.sessionId === id && active.activeRequestId)
        this.options.run(this.follow(active.activeRequestId, id, expected))
      this.options.shell.status.hidden = false
      this.options.shell.status.textContent =
        'Chưa xác nhận được kết quả tạo deck. Kiểm tra kết nối và Outline hiện tại trước khi thử lại; các slide đã lưu vẫn được giữ.'
      throw error
    } finally {
      this.options.sending.delete(id)
      this.options.changed()
    }
  }

  private poll(): void {
    const navigation = this.options.navigation
    const current = navigation.current
    const retryGeneration = this.options.shell.retryGeneration
    const saved = this.options.deckModel.state.snapshot
    retryGeneration.hidden =
      saved?.sessionId !== current?.sessionId ||
      !saved?.generation ||
      !['pending', 'incomplete'].includes(saved.generation.state)
    retryGeneration.disabled = !!current?.activeRequestId || (!!current && this.options.sending.has(current.sessionId))
    if (!current?.activeRequestId || this.polling || this.disposed) return
    this.polling = true
    const id = current.sessionId
    const expected = navigation.generation
    this.options.run(
      Promise.all([navigation.showActivities(id, expected), navigation.showOutlines(id, expected)])
        .then(() => {})
        .catch(() => {
          if (navigation.generation === expected && navigation.current?.activeRequestId)
            this.options.timeline.connectionLost(navigation.current.activeRequestId)
        })
        .finally(() => {
          this.polling = false
        }),
    )
  }

  abortWatch(): void {
    this.watch?.abort()
  }

  dispose(): void {
    this.disposed = true
    if (this.timer !== undefined) clearInterval(this.timer)
    this.timer = undefined
    this.abortWatch()
  }
}

export const createRequestRunner = (options: RequestRunnerOptions): RequestRunner => new RequestRunner(options)
