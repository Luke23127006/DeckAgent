import type { AgentRequest, HistoryMessage, WebSession, WebSettings } from '@deckagent/host-api'
import type { OutlineSnapshot } from '@deckagent/deck'
import { HostClient } from './host-client.ts'
import { ManagementClient } from './management-client.ts'
import { button, element } from './dom.ts'
import { modelPicker } from './model-picker.ts'
import { settingsPanel } from './settings-panel.ts'
import { mountDeckTab } from './deck-tab.ts'
import { ConversationView } from './conversation-view.ts'
import { DeckClient } from './deck-client.ts'
import { mountDeckCanvas } from './deck-canvas.ts'
import { OutlineClient } from './outline-client.ts'
import { failureFeedback } from './request-feedback.ts'

const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
const client = new HostClient(location.origin, token)
const management = new ManagementClient(location.origin, token)
const outlines = new OutlineClient(location.origin, token)
let outlineState: OutlineSnapshot | undefined
const root = document.querySelector<HTMLElement>('#app')!
root.replaceChildren()
const navigation = element('aside', undefined, 'chat-navigation')
const chats = element('nav')
chats.setAttribute('aria-label', 'Chat history')
const conversation = element('section', undefined, 'conversation')
const heading = element('header', undefined, 'conversation-header')
const title = element('h1', 'Chat mới')
const headerState = element('small', '', 'chat-state')
headerState.setAttribute('aria-live', 'polite')
const welcome = element('section', undefined, 'welcome')
welcome.hidden = true
welcome.append(element('h2', 'Hãy mô tả deck bạn muốn'),
  element('p', 'Dán ghi chú hoặc ý tưởng của bạn. DeckAgent đề xuất outline trước. Chưa có slide nào được tạo cho đến khi bạn xác nhận outline.'))
const model = element('select')
model.disabled = true
model.setAttribute('aria-label', 'Selected model')
const status = element('p', '', 'request-status')
status.setAttribute('role', 'status')
status.hidden = true
const messages = element('div', undefined, 'messages')
messages.setAttribute('aria-label', 'Conversation')
const outlineDock = element('section', undefined, 'outline-dock')
outlineDock.hidden = true
const timeline = new ConversationView(messages, (type, proposal) => {
  run(submitRequest(type === 'confirm' ? 'Xác nhận outline' : 'Hủy outline', {
    outlineAction: { type, outlineId: proposal.outlineId, version: proposal.version },
  }))
}, () => {
  if (!input.value) input.value = 'Sửa outline: '
  input.focus()
  input.setSelectionRange(input.value.length, input.value.length)
}, outlineDock)
const form = element('form', undefined, 'composer')
form.noValidate = true
form.dataset.slot = 'request'
const input = element('textarea')
input.name = 'input'
input.required = true
input.placeholder = 'Nhập hoặc dán yêu cầu của bạn…'
input.setAttribute('aria-label', 'Agent request')
const submit = element('button', '↑', 'send-action')
submit.setAttribute('aria-label', 'Send request')
submit.title = 'Gửi yêu cầu (Enter)'
submit.type = 'submit'
submit.disabled = true
const createPresentation = button('Đề xuất outline', () => {
  if (input.reportValidity()) run(submitRequest(input.value, { presentation: true }))
})
createPresentation.disabled = true
const stopRequest = button('■', () => {
  if (current?.activeRequestId) run(client.stop(current.activeRequestId).then(() => {}))
})
stopRequest.className = 'stop-action'
stopRequest.setAttribute('aria-label', 'Stop')
stopRequest.title = 'Dừng yêu cầu'
stopRequest.hidden = true
const deck = element('aside', undefined, 'deck-sidebar')
deck.hidden = true
mountDeckTab(deck)
const publishedDeck = element('aside', undefined, 'deck-sidebar published-deck-sidebar')
publishedDeck.hidden = true
const deckModel = mountDeckCanvas(publishedDeck, new DeckClient(location.origin, token), () => { deck.hidden = true; openDeck.hidden = false })
let current: WebSession | undefined
let settings: WebSettings = { providers: [], persistentKeys: false, builtIns: [] }
let sessions: readonly WebSession[] = []
let watch: AbortController | undefined
let generation = 0
const sending = new Set<string>()
const selecting = new Set<string>()
const drafts = new Map<string, string>()
let recentModels: { provider: string; model: string }[] = []
try {
  const saved: unknown = JSON.parse(sessionStorage.getItem('deckagent-recent-models') ?? '[]')
  if (Array.isArray(saved)) recentModels = saved.filter(value => value && typeof value === 'object' &&
    typeof value.provider === 'string' && typeof value.model === 'string').slice(-100)
} catch { /* Optional tab-local preferences; Host remains the source of selectable models. */ }
let polling = false
let disposed = false
let reconnecting = false
let opening: number | undefined
let creating = false
let historyPresent = false
let chatTitle = 'Chat mới'

function describeHistory(history: readonly HistoryMessage[]) {
  historyPresent = history.length > 0
  const first = history.find(message => message.role === 'user')?.content.replace(/\s+/g, ' ').trim()
  chatTitle = first ? (first.length > 64 ? `${first.slice(0, 64)}…` : first) : 'Chat mới'
}

function fitInput() {
  input.style.height = 'auto'
  input.style.height = `${Math.min(180, Math.max(44, input.scrollHeight))}px`
}

function saveDraft() {
  if (!current) return
  drafts.set(current.sessionId, input.value)
  try {
    const key = `deckagent-draft:${current.sessionId}`
    if (input.value) sessionStorage.setItem(key, input.value)
    else sessionStorage.removeItem(key)
  } catch { /* Drafts still survive switching chats within this page. */ }
}
function readDraft(id: string): string {
  if (drafts.has(id)) return drafts.get(id)!
  let saved = ''
  try { saved = sessionStorage.getItem(`deckagent-draft:${id}`) ?? '' } catch { /* Optional tab-local recovery. */ }
  drafts.set(id, saved)
  return saved
}
function rememberModel(value: { provider: string; model: string }) {
  recentModels = recentModels.filter(item => item.provider !== value.provider || item.model !== value.model).concat(value).slice(-100)
  try { sessionStorage.setItem('deckagent-recent-models', JSON.stringify(recentModels)) } catch { /* Optional tab-local preference. */ }
}

function remember(id: string) {
  try {
    sessionStorage.setItem('deckagent-session', id)
  } catch {
    /* Session can still be selected from History. */
  }
}
function run(work: Promise<void>) {
  work.catch(error => {
    status.hidden = false
    status.dataset.kind = 'error'
    const code = error instanceof Error ? error.message : ''
    const feedback = failureFeedback(code)
    status.textContent = `${feedback.label}. ${feedback.detail}`
    status.title = feedback.code ? `Error code: ${feedback.code}` : ''
  })
}
function controls() {
  stopRequest.hidden = !current?.activeRequestId
  submit.hidden = !!current?.activeRequestId
  for (const item of chats.querySelectorAll('button')) item.disabled = switchingBlocked() || creating
  newChatButton.disabled = switchingBlocked() || creating
  model.disabled = !current || selecting.has(current.sessionId) || opening !== undefined || creating
  submit.disabled =
    !current ||
    creating ||
    reconnecting ||
    opening !== undefined ||
    sending.has(current.sessionId) ||
    selecting.has(current.sessionId) ||
    !!current.activeRequestId ||
    !current.selectable
  createPresentation.disabled = submit.disabled
  submit.setAttribute('aria-disabled', String(submit.disabled || !input.value.trim() || input.value.length > 16000))
  createPresentation.hidden = !!outlineState?.active || !!deckModel.state.snapshot?.outlineId
  timeline.setOutlineBusy(submit.disabled)
  picker.update(settings, !!current?.activeRequestId)
  title.textContent = chatTitle
  title.title = chatTitle
  const active = !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
  headerState.textContent = current?.activeRequestId ? 'Đang làm việc' : active ? 'Đang gửi…'
    : outlineState?.proposals.some(proposal => proposal.status === 'current') ? 'Chờ xác nhận outline' : current?.selectable ? '' : 'Chọn model để bắt đầu'
  navigationHint.hidden = !active
  welcome.hidden = historyPresent || active || !current || opening !== undefined
  messages.hidden = !welcome.hidden
  openDeck.hidden = !outlineState?.confirmedId && !(deckModel.state.snapshot?.sessionId === current?.sessionId && deckModel.state.snapshot?.outlineId)
  fitInput()
  if (!current?.selectable && !current?.activeRequestId) {
    status.hidden = false
    status.dataset.kind = 'setup'
    status.textContent = current?.selection
      ? `Model ${current.selection.model} không còn chọn được. Hãy chọn model khác.`
      : 'Chọn model để gửi yêu cầu. Bạn có thể thêm model trong Cài đặt.'
  } else if (status.dataset.kind === 'setup') {
    status.hidden = true
  }
}
function renderModels() {
  model.replaceChildren(new Option('Chọn model', ''))
  for (const provider of settings.providers) {
    const group = element('optgroup')
    group.label = provider.displayName
    for (const id of provider.models) group.append(new Option(id, JSON.stringify({ provider: provider.id, model: id })))
    model.append(group)
  }
  model.append(new Option('Thêm hoặc quản lý model…', '__settings'))
  model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
  controls()
}
function renderChats() {
  chats.replaceChildren()
  const visible = sessions.filter(session => session.sessionId === current?.sessionId || session.messageCount || session.selection || session.hasSlides || readDraft(session.sessionId).trim())
  visible.sort((a, b) => a.sessionId === current?.sessionId ? -1 : b.sessionId === current?.sessionId ? 1 : b.updatedAt.localeCompare(a.updatedAt))
  if (!visible.length) chats.append(element('p', 'Chưa có chat trước.'))
  for (const session of visible) {
    const item = button('', () =>
      run(open(session)),
    )
    const updated = element('time')
    updated.dateTime = session.updatedAt
    const date = new Date(session.updatedAt)
    updated.textContent = Number.isNaN(date.getTime()) ? 'Updated time unavailable' : date.toLocaleString()
    const slides = session.hasSlides === undefined ? 'Slides unknown' : session.hasSlides ? 'Has slides' : 'No slides yet'
    item.append(element('strong', !session.messageCount ? 'Chat mới' : session.title ?? 'Chat chưa có tên'), updated,
      element('small', `${slides}${session.activeRequestId ? ' · Working…' : ''}`))
    item.title = `${session.title ?? 'Chat mới'} · ${updated.textContent} · ${slides}\n${session.sessionId}`
    item.dataset.sessionId = session.sessionId
    item.setAttribute('aria-current', String(session.sessionId === current?.sessionId))
    item.disabled = switchingBlocked()
    chats.append(item)
  }
}
async function refresh() {
  const [nextSettings, nextSessions] = await Promise.all([management.settings(), management.sessions()])
  settings = nextSettings
  sessions = nextSessions
  if (current) current = sessions.find(session => session.sessionId === current?.sessionId) ?? current
  renderModels()
  renderChats()
}
async function showHistory(id: string, expected: number) {
  const history = await client.history(id)
  if (generation !== expected) return
  timeline.setHistory(history)
  describeHistory(history)
  controls()
}
async function showActivities(id: string, expected: number) {
  const [entries, requests] = await Promise.all([management.activities(id), management.requests(id)])
  if (generation !== expected) return
  timeline.setRecords(requests, entries)
}
async function showOutlines(id: string, expected: number) {
  const next = await outlines.snapshot(id)
  if (generation !== expected || current?.sessionId !== id) return
  if (outlineState?.sessionId === id && outlineState.version > next.version) return
  outlineState = next
  timeline.setOutlines(next)
  controls()
}
async function follow(id: string, sessionId: string, expected: number) {
  watch?.abort()
  const control = new AbortController()
  watch = control
  try {
    for await (const snapshot of client.watch(id, control.signal)) {
      if (generation !== expected) return
      timeline.snapshot(snapshot)
      status.hidden = true
      if (snapshot.status !== 'running') {
        await Promise.all([showHistory(sessionId, expected), showActivities(sessionId, expected), showOutlines(sessionId, expected)])
        await refresh()
      }
    }
  } catch {
    if (!control.signal.aborted && generation === expected) {
      timeline.connectionLost(id)
      try {
        await Promise.all([refresh(), showHistory(sessionId, expected), showActivities(sessionId, expected), showOutlines(sessionId, expected)])
      } catch {
        // The inline record keeps the last known outcome and offers reconnect; no work is replayed.
      }
    }
  }
}
async function open(session: WebSession) {
  const switching = current?.sessionId !== session.sessionId
  if (switching && switchingBlocked()) return
  if (switching && !settingsUI.leave()) return
  picker.close()
  // Read everything before replacing current state. A failed open leaves the old chat intact.
  const previousGeneration = generation
  const loaded = await Promise.all([client.history(session.sessionId), management.activities(session.sessionId),
    management.requests(session.sessionId), outlines.snapshot(session.sessionId)])
  if (generation !== previousGeneration || (switching && switchingBlocked())) return
  if (current) saveDraft()
  input.value = readDraft(session.sessionId)
  generation++
  watch?.abort()
  if (current?.sessionId !== session.sessionId) { timeline.reset(); outlineState = undefined }
  current = session
  deckModel.open(session.sessionId)
  remember(session.sessionId)
  const expected = generation
  opening = expected
  renderModels()
  renderChats()
  status.hidden = true
  if (session.activeRequestId)
    timeline.snapshot({ requestId: session.activeRequestId, sessionId: session.sessionId, status: 'running' })
  controls()
  timeline.setHistory(loaded[0])
  describeHistory(loaded[0])
  timeline.setRecords(loaded[2], loaded[1])
  outlineState = loaded[3]
  timeline.setOutlines(loaded[3])
  if (opening === expected) opening = undefined
  controls()
  if (session.activeRequestId && generation === expected)
    run(follow(session.activeRequestId, session.sessionId, expected))
}
async function newChat() {
  if (switchingBlocked() || creating) return
  if (!settingsUI.leave()) return
  if (current && !historyPresent) { input.focus(); return }
  const selection = [...recentModels].reverse().find(item => settings.providers.some(provider =>
    provider.id === item.provider && provider.models.includes(item.model)))
  creating = true
  controls()
  try {
    const created = await management.create(selection)
    await refresh()
    await open(created)
  } finally { creating = false; controls() }
}
const settingsUI = settingsPanel(management, refresh, root, () => input.focus())
const picker = modelPicker(model, () => run(settingsUI.open()), () => run(settingsUI.open(true)))
function switchingBlocked(): boolean {
  return opening !== undefined || !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
}
const newChatButton = button('+  Chat mới', () => run(newChat()))
newChatButton.dataset.action = 'new-chat'
const navigationHint = element('p', 'Hãy đợi yêu cầu kết thúc hoặc dừng yêu cầu trước khi đổi chat.', 'navigation-hint')
navigationHint.hidden = true
const recents = button('Gần đây ⌄', () => {
  chats.hidden = !chats.hidden
  recents.setAttribute('aria-expanded', String(!chats.hidden))
})
recents.className = 'recents-toggle'
recents.setAttribute('aria-expanded', 'true')
recents.setAttribute('aria-controls', 'recent-chats')
chats.id = 'recent-chats'
const developerTools = element('details', undefined, 'developer-tools')
developerTools.append(element('summary', 'Công cụ phát triển'), button('Mở deck mẫu', () => {
  publishedDeck.hidden = true
  deck.hidden = false
}))
navigation.append(
  element('div', 'DeckAgent', 'wordmark'),
  newChatButton,
  navigationHint,
  recents,
  chats,
  button('⚙  Cài đặt model', () => run(settingsUI.open())),
  developerTools,
)
const headingText = element('div', undefined, 'chat-heading')
headingText.append(title, headerState)
const openDeck = button('Mở deck', () => { deck.hidden = true; publishedDeck.hidden = false })
openDeck.hidden = true
const headingActions = element('div', undefined, 'chat-heading-actions')
const moreActions = element('details', undefined, 'chat-more-actions')
const moreSummary = element('summary', '⋯')
moreSummary.setAttribute('aria-label', 'More chat actions')
moreSummary.title = 'More chat actions'
moreActions.append(moreSummary)
headingActions.append(openDeck, moreActions)
heading.append(headingText, headingActions)
const reconnect = button('Kết nối lại / đọc lịch sử', () => {
  if (reconnecting) return
  reconnecting = true
  controls()
  const expected = generation
  run(
    (async () => {
      try {
        await refresh()
        if (current && generation === expected) await open(current)
      } finally {
        reconnecting = false
        controls()
      }
    })(),
  )
})
reconnect.id = 'reconnect'
moreActions.append(reconnect)
const composerActions = element('div', undefined, 'composer-actions')
const composerControls = element('div', undefined, 'composer-controls')
const attachment = button('+', () => {})
attachment.disabled = true
attachment.className = 'attachment-action'
attachment.title = 'Đính kèm tệp chưa được hỗ trợ trong bản này'
attachment.setAttribute('aria-label', 'Đính kèm tệp chưa được hỗ trợ')
composerControls.append(attachment)
moreActions.append(createPresentation)
const primaryAction = element('div', undefined, 'composer-primary')
primaryAction.append(picker.node, submit, stopRequest)
composerActions.append(composerControls, primaryAction)
form.append(input, composerActions)
input.addEventListener('input', () => { saveDraft(); controls() })
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (!submit.disabled && input.value.trim()) form.requestSubmit()
  }
})
const dock = element('div', undefined, 'composer-dock')
dock.append(outlineDock, form)
conversation.append(heading, status, welcome, messages, dock)
root.prepend(navigation, conversation, deck, publishedDeck)
model.addEventListener('change', () => {
  if (model.value === '__settings') {
    model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
    run(settingsUI.open())
    return
  }
  if (!model.value || !current) return
  const id = current.sessionId
  selecting.add(id)
  model.disabled = true
  controls()
  run(
    (async () => {
      try {
        const value: unknown = JSON.parse(model.value)
        if (
          !value ||
          typeof value !== 'object' ||
          !('provider' in value) ||
          !('model' in value) ||
          typeof value.provider !== 'string' ||
          typeof value.model !== 'string'
        )
          return
        await management.select(id, { provider: value.provider, model: value.model })
        rememberModel({ provider: value.provider, model: value.model })
        await refresh()
        if (current?.sessionId === id) status.hidden = true
      } finally {
        selecting.delete(id)
        model.disabled = false
        controls()
      }
    })(),
  )
})
form.addEventListener('submit', event => {
  event.preventDefault()
  run(submitRequest(input.value))
})
async function submitRequest(text: string, extra: Omit<AgentRequest, 'sessionId' | 'input'> = {}): Promise<void> {
  if (submit.disabled || !current) return
  if (!text.trim()) return
  if (text.length > 16000) {
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent = 'Yêu cầu quá dài. Hãy rút gọn nội dung trước khi gửi.'
    return
  }
  const id = current.sessionId,
    expected = generation
  const target = outlineState?.proposals.find(p => p.status === 'current')
  sending.add(id)
  controls()
  status.textContent = 'Đang gửi'
  status.hidden = false
  status.dataset.kind = 'sending'
  try {
    const accepted = await client.send({ sessionId: id, input: text,
      ...(target && !extra.outlineAction ? { outlineTarget: { outlineId: target.outlineId, version: target.version } } : {}),
      ...extra })
    if (generation === expected && current) {
      if (!extra.outlineAction && input.value === text) { input.value = ''; saveDraft() }
      current = { ...current, activeRequestId: accepted.requestId }
      timeline.snapshot(accepted)
      status.hidden = true
      controls()
    }
    await Promise.all([refresh(), showHistory(id, expected), showActivities(id, expected), showOutlines(id, expected)])
    if (generation === expected) await follow(accepted.requestId, id, expected)
  } catch (error) {
    try { await showOutlines(id, expected) } catch { /* Keep the last saved outline if reconnect also fails. */ }
    throw error
  } finally {
    sending.delete(id)
    controls()
  }
}
const timer = setInterval(() => {
  if (!current?.activeRequestId || polling || disposed) return
  polling = true
  const id = current.sessionId,
    expected = generation
  run(
    Promise.all([showActivities(id, expected), showOutlines(id, expected)])
      .then(() => {})
      .catch(() => {
        if (generation === expected && current?.activeRequestId) timeline.connectionLost(current.activeRequestId)
      })
      .finally(() => {
        polling = false
      }),
  )
}, 750)
window.addEventListener(
  'pagehide',
  () => {
    saveDraft()
    disposed = true
    clearInterval(timer)
    deckModel.close()
    watch?.abort()
  },
  { once: true },
)
window.addEventListener('pageshow', event => {
  if (event.persisted) location.reload()
})
run(
  (async () => {
    await refresh()
    let remembered: string | null = null
    try {
      remembered = sessionStorage.getItem('deckagent-session')
    } catch {
      /* History remains available. */
    }
    const previous = sessions.find(session => session.sessionId === remembered)
    if (previous) await open(previous)
    else await newChat()
  })(),
)
