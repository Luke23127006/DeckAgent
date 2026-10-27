import type { HistoryMessage, RequestSnapshot, StoredActivity, StoredRequest } from '@deckagent/host-api'
import { element } from './dom.ts'
import type { OutlineSnapshot } from '@deckagent/deck'
import { OutlineView } from './outline-view.ts'
import type { OutlineAction } from './outline-view.ts'
import { failureFeedback, requestFeedback } from './request-feedback.ts'

interface ActivityRow {
  readonly node: HTMLDetailsElement
  readonly summary: HTMLElement
  readonly detail: HTMLElement
  readonly output: HTMLElement
}

interface RequestRow {
  readonly node: HTMLDetailsElement
  readonly status: HTMLElement
  readonly count: HTMLElement
  readonly model: HTMLElement
  readonly feedback: HTMLElement
  readonly diagnostic: HTMLElement
  readonly recoveryDetails: HTMLDetailsElement
  readonly recovery: HTMLElement
  readonly empty: HTMLElement
  readonly list: HTMLElement
  readonly activities: Map<string, ActivityRow>
  readonly notice: HTMLElement
}

/** Owns one scrollable conversation. Stable DOM nodes preserve focus and expansion during polling. */
export class ConversationView {
  private history: readonly HistoryMessage[] = []
  private requests: readonly StoredRequest[] = []
  private activities: readonly StoredActivity[] = []
  private readonly live = new Map<string, RequestSnapshot>()
  private readonly disconnected = new Set<string>()
  private readonly rows = new Map<string, RequestRow>()
  private readonly messages = new Map<number, { value: HistoryMessage; node: HTMLElement }>()
  private outlines: OutlineSnapshot | undefined
  private readonly outlineView: OutlineView

  constructor(private readonly container: HTMLElement, action?: OutlineAction, revise?: () => void, private readonly dock?: HTMLElement) {
    this.outlineView = new OutlineView(action, revise, dock)
  }

  setOutlines(snapshot: OutlineSnapshot): void {
    if (this.outlines?.sessionId === snapshot.sessionId && this.outlines.version > snapshot.version) return
    this.outlines = snapshot
    if (this.dock) this.dock.hidden = !snapshot.proposals.some(proposal => proposal.status === 'current')
    this.render()
  }

  setOutlineBusy(busy: boolean): void { this.outlineView.setBusy(busy) }

  reset(): void {
    this.history = []
    this.requests = []
    this.activities = []
    this.live.clear()
    this.disconnected.clear()
    this.rows.clear()
    this.messages.clear()
    this.outlines = undefined
    this.outlineView.reset()
    if (this.dock) { this.dock.replaceChildren(); this.dock.hidden = true }
    this.container.replaceChildren()
  }

  setHistory(history: readonly HistoryMessage[]): void {
    this.history = history
    this.render()
  }

  setRecords(requests: readonly StoredRequest[], activities: readonly StoredActivity[]): void {
    // These logs are append-only. Ignore older in-flight polling responses regressing terminal work.
    const knownRequests = new Map(this.requests.map(request => [request.requestId, request]))
    for (const request of requests) {
      const previous = knownRequests.get(request.requestId)
      if (previous?.revision !== undefined && request.revision !== undefined && previous.revision > request.revision) continue
      if (!previous || previous.status === 'running' || previous.status === 'awaiting_user' || (request.status !== 'running' && request.status !== 'awaiting_user'))
        knownRequests.set(request.requestId, request)
    }
    this.requests = [...knownRequests.values()]
    const knownActivities = new Map(this.activities.map(activity => [`${activity.requestId}/${activity.id}`, activity]))
    for (const activity of activities) {
      const key = `${activity.requestId}/${activity.id}`
      const previous = knownActivities.get(key)
      if (!previous || previous.status === 'running' || activity.status !== 'running')
        knownActivities.set(key, activity)
    }
    this.activities = [...knownActivities.values()].sort((a, b) => a.sequence - b.sequence)
    this.render()
  }

  snapshot(value: RequestSnapshot): void {
    const previous = this.live.get(value.requestId)
    if (previous?.revision !== undefined && value.revision !== undefined && previous.revision > value.revision) return
    if (previous && previous.status !== 'running' && previous.status !== 'awaiting_user' &&
      (value.status === 'running' || value.status === 'awaiting_user')) return
    this.live.set(value.requestId, value)
    this.disconnected.delete(value.requestId)
    this.render()
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
    const status = element('span', undefined, 'request-state')
    status.setAttribute('role', 'status')
    const count = element('span', undefined, 'activity-count')
    summary.append(status, count)
    const model = element('p', undefined, 'request-model')
    const feedback = element('p', undefined, 'request-feedback')
    const diagnostic = element('p', undefined, 'request-diagnostic')
    const recoveryDetails = element('details', undefined, 'request-recovery-details')
    const recovery = element('pre', undefined, 'activity-output')
    recoveryDetails.append(element('summary', 'Chi tiết khôi phục đã lưu'), recovery)
    recoveryDetails.hidden = true
    const empty = element('p', 'Chưa ghi nhận hoạt động.')
    const list = element('div', undefined, 'activity-list')
    node.append(summary, feedback, model, diagnostic, recoveryDetails, empty, list)
    // Native details defaults to collapsed for both running and completed requests.
    const notice = element('aside', '', 'request-notice')
    notice.setAttribute('role', 'note')
    notice.hidden = true
    row = { node, status, count, model, feedback, diagnostic, recoveryDetails, recovery, empty, list, activities: new Map(), notice }
    this.rows.set(id, row)
    return row
  }

  private updateRequest(id: string, stored: StoredRequest | undefined): RequestRow {
    const row = this.requestRow(id)
    const live = this.live.get(id)
    // A terminal snapshot cannot be regressed by an older polling response.
    const newest = live && stored && live.revision !== undefined && stored.revision !== undefined
      ? live.revision >= stored.revision ? live.status : stored.status : undefined
    const state = newest ?? (live && live.status !== 'running' && live.status !== 'awaiting_user' ? live.status
      : stored && stored.status !== 'running' && stored.status !== 'awaiting_user' ? stored.status : (live?.status ?? stored?.status ?? 'unknown')
    )
    const errorCode = live?.result && live.result.status === 'failed' ? live.result.error.code : stored?.errorCode
    const records = this.activities.filter(activity => activity.requestId === id)
    const tools = this.history.filter(message => message.role === 'tool' && message.toolCallId &&
      records.some(entry => entry.id === `tool-${message.toolCallId}` && entry.label === message.name))
    const feedback = requestFeedback(state, errorCode, records, tools, this.disconnected.has(id))
    const { label } = feedback
    if (row.feedback.textContent !== feedback.detail) row.feedback.textContent = feedback.detail
    row.notice.hidden = state === 'running' || state === 'awaiting_user' || state === 'completed'
    row.notice.dataset.status = state
    const summaryText = `${feedback.label}. ${feedback.detail}`
    if (row.notice.textContent !== summaryText) row.notice.textContent = summaryText
    row.node.dataset.toolErrors = String(feedback.toolErrors)
    const diagnostic = failureFeedback(errorCode).code
    row.diagnostic.hidden = !diagnostic
    if (diagnostic) row.diagnostic.textContent = `Mã lỗi: ${diagnostic}`
    const notice = stored?.noticeIndex === undefined ? undefined : this.history[stored.noticeIndex]
    row.recoveryDetails.hidden = notice?.role !== 'assistant' || state === 'completed' || state === 'running'
    if (!row.recoveryDetails.hidden && row.recovery.textContent !== notice?.content) row.recovery.textContent = notice?.content ?? ''
    if (row.status.textContent !== label) row.status.textContent = label
    row.node.dataset.status = state
    row.model.hidden = !stored
    if (stored) {
      const model = `Model: ${stored.selection.provider} / ${stored.selection.model}`
      if (row.model.textContent !== model) row.model.textContent = model
    }
    const count = ` · ${records.length} hoạt động`
    if (row.count.textContent !== count) row.count.textContent = count
    row.empty.hidden = records.length > 0
    for (const entry of records) {
      let activity = row.activities.get(entry.id)
      if (!activity) {
        const node = element('details', undefined, 'activity-detail')
        node.dataset.activityId = entry.id
        const summary = element('summary')
        const detail = element('p')
        const output = element('pre', undefined, 'activity-output')
        output.hidden = true
        node.append(summary, detail, output)
        activity = { node, summary, detail, output }
        row.activities.set(entry.id, activity)
        row.list.append(node)
      }
      const outcome = entry.status === 'unknown' ? 'Outcome unconfirmed' : entry.status
      const elapsed = entry.startedAt === undefined ? undefined : entry.endedAt !== undefined
        ? Math.max(0, entry.endedAt - entry.startedAt) : entry.status === 'running' ? Math.max(0, Date.now() - entry.startedAt) : undefined
      const text = `${entry.label} · ${outcome}${elapsed === undefined ? '' : ` · ${(elapsed / 1000).toFixed(1)}s`}`
      if (activity.summary.textContent !== text) activity.summary.textContent = text
      const tool = this.history.find(message => message.role === 'tool' && message.toolCallId &&
        `tool-${message.toolCallId}` === entry.id && message.name === entry.label)
      let detail = `${entry.kind === 'tool' ? 'Tool execution' : 'Model response'} · ${outcome}.`
      if (tool?.isError) {
        let code: string | undefined
        try { code = JSON.parse(tool.content)?.error?.code } catch { /* Raw output stays in the text-only detail. */ }
        const failure = failureFeedback(code)
        detail = `${failure.label}. ${failure.detail}`
      }
      if (activity.detail.textContent !== detail) activity.detail.textContent = detail
      activity.output.hidden = !tool
      if (tool && activity.output.textContent !== tool.content) activity.output.textContent = tool.content
    }
    return row
  }

  private message(index: number, value: HistoryMessage): HTMLElement | undefined {
    if (value.role === 'assistant' && !value.content) return undefined
    if (value.role === 'assistant' && this.requests.some(request => request.noticeIndex === index &&
      request.status !== 'running' && request.status !== 'completed')) return undefined
    if (value.role === 'tool' && value.toolCallId && this.activities.some(entry => entry.id === `tool-${value.toolCallId}` && entry.label === value.name)) return undefined
    let item = this.messages.get(index)
    if (!item || item.value.role !== value.role || item.value.content !== value.content) {
      const node = value.role === 'tool' ? element('details', undefined, 'unassigned-tool-output') : element('article', undefined, `message ${value.role}`)
      if (value.role === 'tool') node.append(element('summary', 'Kết quả công cụ · chưa xác định được yêu cầu'), element('pre', value.content, 'activity-output'))
      else node.append(
        element('small', value.role === 'assistant' ? 'DeckAgent' : value.role === 'user' ? 'You' : 'Tool result'),
        element('p', value.content),
      )
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
    for (const id of ids) {
      const request = stored.get(id)
      const start = request?.historyStart
      // Legacy records lack an anchor. Keep them after history without guessing a user turn.
      const position =
        start === undefined
          ? this.history.length
          : Math.min(start + (this.history[start]?.role === 'user' ? 1 : 0), this.history.length)
      const items = positions.get(position) ?? []
      const row = this.updateRequest(id, request)
      items.push(row.node)
      if (!row.notice.hidden) items.push(row.notice)
      positions.set(position, items)
    }
    const nodes: HTMLElement[] = []
    for (let index = 0; index <= this.history.length; index++) {
      nodes.push(...(positions.get(index) ?? []))
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
