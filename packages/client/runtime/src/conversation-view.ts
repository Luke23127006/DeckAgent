import type { HistoryMessage, RequestSnapshot, RequestStatus, StoredActivity, StoredRequest } from '@deckagent/host-api'
import { button, element } from './dom.ts'
import type { OutlineSnapshot } from '@deckagent/deck'
import { OutlineView } from './outline-view.ts'
import type { OutlineAction } from './outline-view.ts'
import { isActive } from './host-client.ts'
import { failureFeedback, offersSettings, requestFeedback } from './request-feedback.ts'
import type { ApprovalView } from '@deckagent/host-api'

interface ActivityRow {
  readonly node: HTMLDetailsElement
  readonly summary: HTMLElement
  readonly detail: HTMLElement
}

const outcomes: Readonly<Record<string, string>> = {
  running: 'đang chạy',
  completed: 'hoàn tất',
  failed: 'thất bại',
  stopped: 'đã dừng',
}

const activityNames: Readonly<Record<string, string>> = {
  'Model response': 'Phản hồi model',
  'Conversation summary': 'Tóm tắt hội thoại',
  list_sources: 'Liệt kê nguồn project',
  read_source: 'Đọc nguồn project',
  read_external: 'Đọc file ngoài phạm vi',
  read_attachment: 'Đọc tệp đính kèm',
  research_public: 'Tìm nguồn công khai',
}

/** FR-079: where the summary the model reads starts. Every message above it stays readable here. */
const summaryBoundary =
  'Hội thoại phía trên đã được tóm tắt vì dài hơn ngữ cảnh của model. Từ đây, model đọc bản tóm tắt thay cho các tin nhắn phía trên; bạn vẫn đọc được toàn bộ.'

interface RequestRow {
  readonly node: HTMLDetailsElement
  readonly revision: HTMLElement
  readonly status: HTMLElement
  readonly count: HTMLElement
  readonly model: HTMLElement
  readonly feedback: HTMLElement
  readonly diagnostic: HTMLElement
  readonly diagnosticCode: HTMLElement
  readonly reply: HTMLElement
  readonly empty: HTMLElement
  readonly list: HTMLElement
  readonly activities: Map<string, ActivityRow>
  readonly actions: HTMLElement
  actionsKey: string
  readonly approval: HTMLElement
  approvalKey: string
}

/** Owns one scrollable conversation. Stable DOM nodes preserve focus and expansion during updates. */
export class ConversationView {
  private history: readonly HistoryMessage[] = []
  private requests: readonly StoredRequest[] = []
  private activities: readonly StoredActivity[] = []
  private readonly live = new Map<string, RequestSnapshot>()
  private readonly disconnected = new Set<string>()
  private readonly rows = new Map<string, RequestRow>()
  private readonly messages = new Map<number, { value: HistoryMessage; node: HTMLElement }>()
  private readonly summarizedLive = new Set<string>()
  private readonly boundaries = new Map<string, HTMLElement>()
  private outlines: OutlineSnapshot | undefined
  private readonly outlineView: OutlineView

  constructor(
    private readonly container: HTMLElement,
    action?: OutlineAction,
    revise?: () => void,
    private readonly dock?: HTMLElement,
    private readonly hooks?: {
      retry(text: string): void
      settings(): void
      draft(): string
      approve?(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): Promise<void>
      previewAttachment?(item: NonNullable<HistoryMessage['attachments']>[number]): void
    },
  ) {
    this.outlineView = new OutlineView(action, revise, dock)
  }

  setOutlines(snapshot: OutlineSnapshot): void {
    if (this.outlines?.sessionId === snapshot.sessionId && this.outlines.version > snapshot.version) return
    this.outlines = snapshot
    if (this.dock) this.dock.hidden = !snapshot.proposals.some(proposal => proposal.status === 'current')
    this.render()
  }

  setOutlineBusy(busy: boolean): void {
    this.outlineView.setBusy(busy)
  }

  reset(): void {
    this.history = []
    this.requests = []
    this.activities = []
    this.live.clear()
    this.disconnected.clear()
    this.rows.clear()
    this.messages.clear()
    this.summarizedLive.clear()
    this.boundaries.clear()
    this.outlines = undefined
    this.outlineView.reset()
    if (this.dock) {
      this.dock.replaceChildren()
      this.dock.hidden = true
    }
    this.container.replaceChildren()
  }

  setHistory(history: readonly HistoryMessage[]): void {
    this.history = history
    this.render()
  }

  setRecords(requests: readonly StoredRequest[], activities: readonly StoredActivity[]): void {
    // Saved records only move forward: an older response never turns an ended request active again.
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
    this.activities = [...knownActivities.values()].sort((a, b) =>
      a.requestId === b.requestId ? a.sequence - b.sequence : a.requestId < b.requestId ? -1 : 1,
    )
    this.render()
  }

  /** Live state of a request from the Host's event stream. */
  snapshot(value: RequestSnapshot): void {
    const previous = this.live.get(value.requestId)
    if (previous && !isActive(previous.status) && isActive(value.status)) return
    if (previous && previous.sequence > value.sequence) return
    this.live.set(value.requestId, value)
    this.disconnected.delete(value.requestId)
    this.render()
  }

  /** One activity update from the event stream; the saved list replaces it on the next read. */
  activity(value: StoredActivity): void {
    this.setRecords([], [value])
  }

  /** The event stream said this request's conversation was summarized for the model; saved records say it after reload. */
  summarized(id: string): void {
    if (this.summarizedLive.has(id)) return
    this.summarizedLive.add(id)
    this.render()
  }

  private boundary(id: string): HTMLElement {
    let node = this.boundaries.get(id)
    if (!node) {
      node = element('p', summaryBoundary, 'summary-boundary')
      node.setAttribute('role', 'note')
      node.dataset.requestId = id
      this.boundaries.set(id, node)
    }
    return node
  }

  connectionLost(id: string): void {
    this.disconnected.add(id)
    this.render()
  }

  private requestRow(id: string): RequestRow {
    let row = this.rows.get(id)
    if (row) return row
    const node = element('details', undefined, 'request-record')
    node.dataset.requestId = id
    const summary = element('summary')
    const revision = element('span', undefined, 'request-rev')
    revision.setAttribute('role', 'img')
    const status = element('span', undefined, 'request-state')
    status.setAttribute('role', 'status')
    const count = element('span', undefined, 'activity-count')
    summary.append(revision, status, count)
    const model = element('p', undefined, 'request-model')
    const feedback = element('p', undefined, 'request-feedback')
    const diagnostic = element('details', undefined, 'request-diagnostic')
    const diagnosticCode = element('p')
    diagnostic.append(element('summary', 'Chi tiết kỹ thuật'), diagnosticCode)
    const reply = element('p', undefined, 'request-live-reply')
    reply.hidden = true
    reply.setAttribute('aria-live', 'polite')
    const empty = element('p', 'Chưa ghi nhận hoạt động.')
    const list = element('div', undefined, 'activity-list')
    const actions = element('div', undefined, 'request-actions')
    actions.hidden = true
    const approval = element('section', undefined, 'step-approval')
    approval.hidden = true
    approval.setAttribute('aria-label', 'Cấp quyền cho một bước')
    node.append(summary, feedback, approval, actions, model, diagnostic, empty, list)
    row = {
      node,
      revision,
      status,
      count,
      model,
      feedback,
      diagnostic,
      diagnosticCode,
      reply,
      empty,
      list,
      activities: new Map(),
      actions,
      actionsKey: '',
      approval,
      approvalKey: '',
    }
    this.rows.set(id, row)
    return row
  }

  private state(id: string, stored: StoredRequest | undefined): RequestStatus {
    const live = this.live.get(id)
    // A terminal status cannot be regressed by an older response.
    if (live && !isActive(live.status)) return live.status
    if (stored && !isActive(stored.status)) return stored.status
    return live?.status ?? stored?.status ?? 'active'
  }

  private updateRequest(id: string, stored: StoredRequest | undefined): RequestRow {
    const row = this.requestRow(id)
    const live = this.live.get(id)
    const state = this.state(id, stored)
    const errorCode = live && !isActive(live.status) ? live.errorCode : (stored?.errorCode ?? live?.errorCode)
    const records = this.activities.filter(activity => activity.requestId === id)
    const feedback = requestFeedback(state, errorCode, records, this.disconnected.has(id))
    if (row.feedback.textContent !== feedback.detail) row.feedback.textContent = feedback.detail
    row.node.dataset.toolErrors = String(feedback.toolErrors)
    const diagnostic = state === 'stopped' || state === 'completed' ? undefined : failureFeedback(errorCode).code
    row.diagnostic.hidden = !diagnostic
    if (diagnostic) row.diagnosticCode.textContent = `Mã lỗi: ${diagnostic}`
    if (row.status.textContent !== feedback.label) row.status.textContent = feedback.label
    row.node.dataset.status = state
    this.updateApproval(row, live?.pendingApproval ?? null, isActive(state))
    // Live steps: open while the request runs, closed again as soon as it ends.
    if (isActive(state) && row.node.dataset.live !== '1') {
      row.node.dataset.live = '1'
      row.node.open = true
    } else if (!isActive(state) && row.node.dataset.live === '1') {
      delete row.node.dataset.live
      row.node.open = false
    }
    // The reply as it arrives; once the request ends, the saved conversation shows it instead.
    const partial = isActive(state) ? (live?.text ?? '') : ''
    row.reply.hidden = !partial
    if (row.reply.textContent !== partial) row.reply.textContent = partial
    const actionsKey = `${state}|${errorCode ?? ''}|${stored?.historyStart ?? ''}`
    if (row.actionsKey !== actionsKey) {
      row.actionsKey = actionsKey
      const original = stored === undefined ? undefined : this.history[stored.historyStart]
      const controls: HTMLElement[] = []
      const note = element('p', undefined, 'request-action-note')
      note.setAttribute('role', 'status')
      if ((state === 'failed' || state === 'interrupted') && offersSettings(errorCode))
        controls.push(button('Mở Cài đặt model', () => this.hooks?.settings()))
      if ((state === 'failed' || state === 'interrupted') && original?.role === 'user' && original.content) {
        const text = original.content
        // A draft in the composer is never replaced by one click: the first click asks, the second (same draft) replaces.
        let askedAbout: string | undefined
        controls.push(
          button('Đưa lại yêu cầu vào ô nhập', () => {
            const draft = this.hooks?.draft().trim() ?? ''
            if (draft && draft !== text.trim() && askedAbout !== draft) {
              askedAbout = draft
              note.textContent = 'Ô nhập đang có bản nháp. Bấm lại để thay bằng yêu cầu này.'
              return
            }
            askedAbout = undefined
            this.hooks?.retry(text)
            note.textContent = 'Đã đưa vào ô nhập. Nhấn Enter để gửi.'
          }),
        )
      }
      row.actions.replaceChildren(...controls, ...(controls.length ? [note] : []))
      row.actions.hidden = controls.length === 0
    }
    row.model.hidden = !stored
    if (stored) {
      const model = `Model: ${stored.selection.provider} / ${stored.selection.model}`
      if (row.model.textContent !== model) row.model.textContent = model
    }
    const count = `${records.length} hoạt động`
    if (row.count.textContent !== count) row.count.textContent = count
    row.empty.hidden = records.length > 0
    for (const entry of records) {
      let activity = row.activities.get(entry.id)
      if (!activity) {
        const node = element('details', undefined, 'activity-detail')
        node.dataset.activityId = entry.id
        const summary = element('summary')
        const detail = element('p')
        node.append(summary, detail)
        activity = { node, summary, detail }
        row.activities.set(entry.id, activity)
        row.list.append(node)
      }
      const outcome = outcomes[entry.status] ?? entry.status
      activity.node.dataset.status = entry.status
      const name = activityNames[entry.label] ?? entry.label
      const text = `${name} · ${outcome}`
      if (activity.summary.textContent !== text) activity.summary.textContent = text
      const detail =
        entry.type === 'tool'
          ? `${name} · ${outcome}.${entry.status === 'failed' ? ' Bước này không được thực hiện; yêu cầu vẫn tiếp tục.' : ''}`
          : `${name} · ${outcome}.`
      if (activity.detail.textContent !== detail) activity.detail.textContent = detail
    }
    return row
  }

  private updateApproval(row: RequestRow, pending: ApprovalView | null, active: boolean): void {
    if (!active || !pending || pending.state !== 'pending') {
      row.approval.hidden = true
      row.approvalKey = ''
      row.approval.replaceChildren()
      return
    }
    row.approval.hidden = false
    if (row.approvalKey === pending.approvalId) return
    row.approvalKey = pending.approvalId
    row.approval.dataset.approvalId = pending.approvalId
    const feedback = element('p')
    feedback.setAttribute('role', 'status')
    const decide = async (decision: 'allow-once' | 'refuse') => {
      allow.disabled = true
      refuse.disabled = true
      feedback.textContent = 'Đang lưu quyết định…'
      try {
        if (!this.hooks?.approve) throw new Error('APPROVAL_UNAVAILABLE')
        await this.hooks.approve(pending.requestId, pending.approvalId, decision)
      } catch {
        feedback.textContent =
          'Chưa xác nhận được kết quả. Kiểm tra kết nối hoặc trạng thái yêu cầu rồi thử lại; bạn vẫn có thể dừng.'
        allow.disabled = false
        refuse.disabled = false
      }
    }
    const allow = button('Cho phép một lần', () => {
      void decide('allow-once')
    })
    const refuse = button('Từ chối', () => {
      void decide('refuse')
    })
    row.approval.replaceChildren(
      element('strong', 'Đang chờ bạn cấp quyền'),
      element('p', 'Bước: đọc một file'),
      element('p', pending.target, 'approval-target'),
      element('p', pending.reason),
      allow,
      refuse,
      feedback,
    )
  }

  private message(index: number, value: HistoryMessage): HTMLElement | undefined {
    if (value.role === 'assistant' && !value.content) return undefined
    if (
      value.role === 'tool' &&
      value.toolCallId &&
      this.activities.some(entry => entry.id === `tool-${value.toolCallId}` && entry.label === value.name)
    )
      return undefined
    let item = this.messages.get(index)
    if (
      !item ||
      item.value.role !== value.role ||
      item.value.content !== value.content ||
      JSON.stringify(item.value.attachments) !== JSON.stringify(value.attachments) ||
      item.value.interrupted !== value.interrupted
    ) {
      const node =
        value.role === 'tool'
          ? element('details', undefined, 'unassigned-tool-output')
          : element('article', undefined, `message ${value.role}`)
      if (value.role === 'tool')
        node.append(
          element('summary', 'Kết quả công cụ · chưa xác định được yêu cầu'),
          element('pre', value.content, 'activity-output'),
        )
      else {
        node.setAttribute('aria-label', value.role === 'assistant' ? 'DeckAgent' : 'Bạn')
        node.append(element('p', value.content))
        if (value.role === 'user' && value.attachments?.length) {
          const attachments = element('div', undefined, 'message-attachments')
          for (const attachment of value.attachments)
            attachments.append(button(attachment.name, () => this.hooks?.previewAttachment?.(attachment)))
          node.append(attachments)
        }
        // FR-019: a reply of a request that did not finish is kept, and says so.
        if (value.interrupted) {
          node.dataset.interrupted = 'true'
          node.append(element('small', 'Phần trả lời chưa xong', 'message-note'))
        }
      }
      item = { value, node }
      this.messages.set(index, item)
    }
    return item.node
  }

  private render(): void {
    const top = this.container.scrollTop
    const followBottom = this.container.scrollHeight - this.container.clientHeight - top < 48
    const stored = new Map(this.requests.map(request => [request.requestId, request]))
    const ids = [...new Set([...stored.keys(), ...this.live.keys()])]
    const positions = new Map<number, HTMLElement[]>()
    const boundaries = new Map<number, HTMLElement[]>()
    for (const id of ids) {
      const request = stored.get(id)
      const start = request?.historyStart
      // A live request not yet saved in the list shows after the conversation.
      const position =
        start === undefined
          ? this.history.length
          : Math.min(start + (this.history[start]?.role === 'user' ? 1 : 0), this.history.length)
      const items = positions.get(position) ?? []
      const row = this.updateRequest(id, request)
      row.node.dataset.publicResearch = String(request?.publicResearch === true)
      row.node.title = request?.publicResearch ? 'Yêu cầu cho phép tìm nguồn công khai qua Tavily' : ''
      const number = String(ids.indexOf(id) + 1)
      if (row.revision.textContent !== number) {
        row.revision.textContent = number
        row.revision.setAttribute('aria-label', `Yêu cầu ${number}`)
      }
      items.push(row.node)
      if (!row.reply.hidden) items.push(row.reply)
      positions.set(position, items)
      // The summary covers everything before this request: the boundary sits right above its user message.
      if (request?.summarized || this.summarizedLive.has(id)) {
        const at = start === undefined ? this.history.length : start
        const before = boundaries.get(at) ?? []
        before.push(this.boundary(id))
        boundaries.set(at, before)
      }
    }
    // The newest request that did not finish opens once so its explanation and next step are visible.
    const newest = ids.at(-1) === undefined ? undefined : this.rows.get(ids.at(-1)!)
    if (
      newest &&
      (newest.node.dataset.status === 'failed' || newest.node.dataset.status === 'interrupted') &&
      newest.node.dataset.opened !== newest.node.dataset.status
    ) {
      newest.node.dataset.opened = newest.node.dataset.status
      newest.node.open = true
    }
    const nodes: HTMLElement[] = []
    for (let index = 0; index <= this.history.length; index++) {
      nodes.push(...(positions.get(index) ?? []))
      nodes.push(...(boundaries.get(index) ?? []))
      const value = this.history[index]
      if (value) {
        const node = this.message(index, value)
        if (node) {
          nodes.push(node)
          const proposal = this.outlines?.proposals.find(p => p.responseIndex === index)
          if (proposal && value.role === 'assistant') {
            const outline = this.outlineView.render(proposal)
            if (outline.parentElement !== node) node.append(outline)
          }
        }
      }
    }
    for (const [index, node] of nodes.entries()) {
      const before = this.container.children[index] ?? null
      if (node !== before) this.container.insertBefore(node, before)
    }
    while (this.container.children.length > nodes.length) this.container.lastElementChild!.remove()
    this.container.scrollTop = followBottom ? this.container.scrollHeight : top
  }
}
