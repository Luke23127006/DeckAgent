import type {
  HistoryMessage,
  OutlineSnapshot,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
} from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'
import { OutlineView } from '../deck/index.ts'
import type { OutlineAction } from '../deck/index.ts'
import { messageContent } from './message-content.ts'
import { isActive } from '../../transport/index.ts'
import { createRequestRow, updateRequestRow, type RequestRow } from './request-row.ts'

/** FR-079: where the summary the model reads starts. Every message above it stays readable here. */
const summaryBoundary =
  'Hội thoại phía trên đã được tóm tắt vì dài hơn ngữ cảnh của model. Từ đây, model đọc bản tóm tắt thay cho các tin nhắn phía trên; bạn vẫn đọc được toàn bộ.'

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
    revise?: (text?: string) => void,
    private readonly dock?: HTMLElement,
    private readonly hooks?: {
      retry(text: string): void
      settings(): void
      draft(): string
      approve?(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): Promise<void>
      previewAttachment?(item: NonNullable<HistoryMessage['attachments']>[number]): void
      previewOutlineImage?(sessionId: string, outlineId: string, needId: string): Promise<Blob>
    },
  ) {
    this.outlineView = new OutlineView(action, revise, dock, hooks?.previewOutlineImage)
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
    this.activities = [...knownActivities.values()].toSorted((a, b) =>
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
    if (!row) {
      row = createRequestRow(id)
      this.rows.set(id, row)
    }
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
    const records = this.activities.filter(activity => activity.requestId === id)
    const original = stored === undefined ? undefined : this.history[stored.historyStart]
    updateRequestRow(row, state, live, stored, records, this.disconnected.has(id), original, this.hooks)
    return row
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
        node.append(value.role === 'assistant' ? messageContent(value.content) : element('p', value.content))
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
    const lastId = ids.at(-1)
    const newest = lastId === undefined ? undefined : this.rows.get(lastId)
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
    while (this.container.children.length > nodes.length) {
      const tail = this.container.lastElementChild
      if (!tail) break
      tail.remove()
    }
    this.container.scrollTop = followBottom ? this.container.scrollHeight : top
  }
}
