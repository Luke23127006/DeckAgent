import type { HistoryMessage, RequestSnapshot, StoredActivity, StoredRequest } from '@deckagent/host-api'
import { element } from './dom.ts'

interface ActivityRow {
  readonly node: HTMLDetailsElement
  readonly summary: HTMLElement
  readonly detail: HTMLElement
}

interface RequestRow {
  readonly node: HTMLDetailsElement
  readonly status: HTMLElement
  readonly count: HTMLElement
  readonly model: HTMLElement
  readonly empty: HTMLElement
  readonly list: HTMLElement
  readonly activities: Map<string, ActivityRow>
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

  constructor(private readonly container: HTMLElement) {}

  reset(): void {
    this.history = []
    this.requests = []
    this.activities = []
    this.live.clear()
    this.disconnected.clear()
    this.rows.clear()
    this.messages.clear()
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
      if (!previous || previous.status === 'running' || request.status !== 'running')
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
    if (previous && previous.status !== 'running' && value.status === 'running') return
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
    const empty = element('p', 'No recorded activity.')
    const list = element('div', undefined, 'activity-list')
    node.append(summary, model, empty, list)
    // Native details defaults to collapsed for both running and completed requests.
    row = { node, status, count, model, empty, list, activities: new Map() }
    this.rows.set(id, row)
    return row
  }

  private updateRequest(id: string, stored: StoredRequest | undefined): RequestRow {
    const row = this.requestRow(id)
    const live = this.live.get(id)
    // A terminal snapshot cannot be regressed by an older polling response.
    const state = live && live.status !== 'running' ? live.status : (stored?.status ?? live?.status ?? 'unknown')
    const errorCode = live?.result && live.result.status === 'failed' ? live.result.error.code : stored?.errorCode
    const label =
      state === 'running'
        ? this.disconnected.has(id)
          ? 'Connection interrupted · Reconnect to read state'
          : 'Working…'
        : state === 'completed'
          ? 'Completed'
          : state === 'failed'
            ? `Failed${errorCode ? `: ${errorCode}` : ''}`
            : state === 'cancelled'
              ? 'Stopped'
              : 'Outcome unconfirmed after interruption'
    if (row.status.textContent !== label) row.status.textContent = label
    row.node.dataset.status = state
    row.model.hidden = !stored
    if (stored) {
      const model = `Model: ${stored.selection.provider} / ${stored.selection.model}`
      if (row.model.textContent !== model) row.model.textContent = model
    }
    const records = this.activities.filter(activity => activity.requestId === id)
    const count = ` · ${records.length} ${records.length === 1 ? 'activity' : 'activities'}`
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
      const outcome = entry.status === 'unknown' ? 'Outcome unconfirmed' : entry.status
      const text = `${entry.label} · ${outcome}`
      if (activity.summary.textContent !== text) activity.summary.textContent = text
      const detail = `${entry.kind === 'tool' ? 'Tool execution' : 'Model response'} · ${outcome}.`
      if (activity.detail.textContent !== detail) activity.detail.textContent = detail
    }
    return row
  }

  private message(index: number, value: HistoryMessage): HTMLElement | undefined {
    if (value.role === 'assistant' && !value.content) return undefined
    let item = this.messages.get(index)
    if (!item || item.value.role !== value.role || item.value.content !== value.content) {
      const node = element('article', undefined, `message ${value.role}`)
      node.append(
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
      items.push(this.updateRequest(id, request).node)
      positions.set(position, items)
    }
    const nodes: HTMLElement[] = []
    for (let index = 0; index <= this.history.length; index++) {
      nodes.push(...(positions.get(index) ?? []))
      const value = this.history[index]
      if (value) {
        const node = this.message(index, value)
        if (node) nodes.push(node)
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
