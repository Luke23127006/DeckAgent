import type { AgentRequest, HistoryMessage, RequestReply, RequestSnapshot, WebSession, WebSettings, WorkspaceList } from '@deckagent/host-api'
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
import { questionView } from './question-view.ts'
import { themeControl } from './theme.ts'
import { initMotion } from './motion.ts'
import { workspaceView } from './workspace-view.ts'

/**
 * No Agent runtime is connected in this build (B01): the Host refuses every request, so the composer
 * keeps drafts but offers no send. The OpenCode runtime connects in B02.
 */
const requestsAvailable = false
const requestsUnavailableText = 'Chưa thể gửi yêu cầu trong bản này: DeckAgent chưa kết nối runtime tạo slide. Bạn vẫn soạn được bản nháp, tạo và mở lại chat.'

const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
const client = new HostClient(location.origin, token)
const management = new ManagementClient(location.origin, token)
const outlines = new OutlineClient(location.origin, token)
let outlineState: OutlineSnapshot | undefined
const root = document.querySelector<HTMLElement>('#app')!
root.replaceChildren()
const navigation = element('aside', undefined, 'chat-navigation')
const chats = element('nav')
chats.setAttribute('aria-label', 'Lịch sử chat')
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
model.setAttribute('aria-label', 'Model đã chọn')
const status = element('p', '', 'request-status')
status.setAttribute('role', 'status')
status.hidden = true
const messages = element('div', undefined, 'messages')
messages.setAttribute('aria-label', 'Hội thoại')
const outlineDock = element('section', undefined, 'outline-dock')
outlineDock.hidden = true
const questionUI = questionView(answer => run(replyToQuestion(answer)))
const timeline = new ConversationView(messages, (type, proposal) => {
  run(submitRequest(type === 'confirm' ? 'Xác nhận outline' : 'Hủy outline', {
    outlineAction: { type, outlineId: proposal.outlineId, version: proposal.version },
  }))
}, () => {
  if (!input.value) input.value = 'Sửa outline: '
  input.focus()
  input.setSelectionRange(input.value.length, input.value.length)
}, outlineDock, {
  retry: text => { input.value = text; input.focus(); input.setSelectionRange(text.length, text.length); saveDraft(); controls() },
  settings: () => run(settingsUI.open()),
  draft: () => input.value,
  viewSlide: slideId => { showDeck(); deckModel.select(slideId) },
})
const form = element('form', undefined, 'composer')
form.noValidate = true
form.dataset.slot = 'request'
const input = element('textarea')
input.name = 'input'
input.required = true
input.placeholder = 'Nhập hoặc dán yêu cầu của bạn…'
input.setAttribute('aria-label', 'Nội dung yêu cầu')
const submit = element('button', '', 'send-action')
submit.setAttribute('aria-label', 'Gửi yêu cầu')
submit.title = 'Gửi yêu cầu (Enter)'
submit.type = 'submit'
submit.disabled = true
const createPresentation = button('Đề xuất outline', () => {
  if (input.reportValidity()) run(submitRequest(input.value, { presentation: true }))
})
createPresentation.disabled = true
const stopRequest = button('Dừng', () => {
  if (current?.activeRequestId) run(client.stop(current.activeRequestId).then(() => {}))
})
stopRequest.className = 'stop-action'
stopRequest.setAttribute('aria-label', 'Dừng yêu cầu')
stopRequest.title = 'Dừng yêu cầu'
stopRequest.hidden = true
const deck = element('aside', undefined, 'deck-sidebar')
deck.hidden = true
mountDeckTab(deck)
const publishedDeck = element('aside', undefined, 'deck-sidebar published-deck-sidebar')
publishedDeck.hidden = true
const deckModel = mountDeckCanvas(publishedDeck, new DeckClient(location.origin, token), () => { deck.hidden = true; openDeck.hidden = true })
let current: WebSession | undefined
let waiting: RequestSnapshot | undefined
let pendingReply: { key: string; value: RequestReply } | undefined
let settings: WebSettings = { providers: [], persistentKeys: false, builtIns: [] }
let sessions: readonly WebSession[] = []
let workspaces: WorkspaceList = { workspaces: [], selectedId: 'default' }
let searchWords = ''
let searchResults: Set<string> | undefined
let watch: AbortController | undefined
let generation = 0
const sending = new Set<string>()
const selecting = new Set<string>()
const drafts = new Map<string, string>()
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

// The Host keeps the draft of each chat (FR-038): a reload and every open interface see the same draft.
// `drafts` only mirrors what this page last read or typed; it is not a second store.
const pendingDrafts = new Map<string, ReturnType<typeof setTimeout>>()
function saveDraft() {
  if (!current) return
  const id = current.sessionId
  drafts.set(id, input.value)
  clearTimeout(pendingDrafts.get(id))
  pendingDrafts.set(id, setTimeout(() => { void flushDraft(id) }, 250))
}
async function flushDraft(id: string) {
  const timer = pendingDrafts.get(id)
  if (timer === undefined) return
  clearTimeout(timer)
  pendingDrafts.delete(id)
  try { await management.saveDraft(id, drafts.get(id) ?? '') } catch {
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent = 'Chưa lưu được bản nháp vào DeckAgent. Kiểm tra kết nối; nội dung vẫn còn trong ô soạn thảo.'
  }
}
async function readDraft(id: string): Promise<string> {
  await flushDraft(id)
  const text = await management.draft(id)
  drafts.set(id, text)
  return text
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
    status.title = feedback.code ? `Mã lỗi: ${feedback.code}` : ''
  })
}
function controls() {
  const question = waiting?.sessionId === current?.sessionId && waiting?.requestId === current?.activeRequestId ? waiting?.question : undefined
  stopRequest.hidden = !current?.activeRequestId
  submit.hidden = !!current?.activeRequestId && !question
  for (const item of chats.querySelectorAll('button')) item.disabled = switchingBlocked() || creating
  newChatButton.disabled = switchingBlocked() || creating
  model.disabled = !current || selecting.has(current.sessionId) || opening !== undefined || creating
  workspaceUI.setBusy(opening !== undefined || creating)
  unavailable.hidden = requestsAvailable
  submit.disabled =
    !requestsAvailable ||
    !current ||
    creating ||
    reconnecting ||
    opening !== undefined ||
    sending.has(current.sessionId) ||
    selecting.has(current.sessionId) ||
    (!!current.activeRequestId && !question) ||
    (!current.selectable && !question)
  createPresentation.disabled = submit.disabled
  submit.setAttribute('aria-disabled', String(submit.disabled || !input.value.trim() || input.value.length > 16000))
  createPresentation.hidden = !!outlineState?.active || !!deckModel.state.snapshot?.outlineId
  timeline.setOutlineBusy(submit.disabled || !!current?.activeRequestId)
  questionUI.update(question, submit.disabled)
  timeline.setQuestion(question?.prompt)
  input.placeholder = question ? 'Nhập câu trả lời của bạn…' : 'Nhập hoặc dán yêu cầu của bạn…'
  picker.update(settings, !!current?.activeRequestId)
  title.textContent = chatTitle
  title.title = chatTitle
  const active = !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
  headerState.textContent = question ? 'Đang chờ bạn trả lời' : current?.activeRequestId ? 'Đang làm việc' : active ? 'Đang gửi…'
    : outlineState?.proposals.some(proposal => proposal.status === 'current') ? 'Chờ xác nhận outline' : ''
  const outlinePending = !!outlineState?.proposals.some(proposal => proposal.status === 'current')
  headerState.dataset.waiting = String(!!question || (!active && outlinePending))
  navigationHint.hidden = !active || chats.hidden
  welcome.hidden = historyPresent || active || !current || opening !== undefined
  messages.hidden = !welcome.hidden
  openDeck.hidden = (!outlineState?.confirmedId && !(deckModel.state.snapshot?.sessionId === current?.sessionId && deckModel.state.snapshot?.outlineId)) || !publishedDeck.hidden
  fitInput()
  // Only a saved model that can no longer be used needs a notice; with no model chosen yet the picker already says so.
  if (!current?.selectable && !current?.activeRequestId && current?.selection) {
    status.hidden = false
    status.dataset.kind = 'setup'
    status.textContent = `Model ${current.selection.model} không còn chọn được. Hãy chọn model khác.`
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
function chatButton(session: WebSession) {
  const item = button('', () =>
    run(open(session)),
  )
  const updated = element('time')
  updated.dateTime = session.updatedAt
  const date = new Date(session.updatedAt)
  updated.textContent = Number.isNaN(date.getTime()) ? 'Chưa rõ thời gian cập nhật' : date.toLocaleString('vi-VN')
  const slides = !session.readable ? 'Không mở được chat này' : session.hasSlides === undefined ? 'Chưa rõ slide' : session.hasSlides ? 'Có slide' : 'Chưa có slide'
  const name = !session.readable ? 'Chat không đọc được' : !session.messageCount ? 'Chat mới' : session.title ?? 'Chat chưa có tên'
  item.append(element('strong', name), updated, element('small', `${slides}${session.activeRequestId ? ' · Đang làm việc…' : ''}`))
  item.title = `${name} · ${updated.textContent} · ${slides}`
  item.dataset.sessionId = session.sessionId
  if (!session.readable) item.dataset.unreadable = 'true'
  item.setAttribute('aria-current', String(session.sessionId === current?.sessionId))
  item.disabled = switchingBlocked()
  return item
}
function renderChats() {
  chats.replaceChildren()
  const listed = (session: WebSession) => session.sessionId === current?.sessionId || session.messageCount || session.selection || session.hasSlides
    || !session.readable || session.hasDraft || drafts.get(session.sessionId)?.trim()
  const found = searchResults
  const visible = sessions.filter(session => (found ? found.has(session.sessionId) : listed(session)))
  // Keep each chat where it is when opened; a new chat has the newest time, so it still lists first.
  visible.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.sessionId.localeCompare(b.sessionId))
  // UC-006 S1: the chats of the workspace in use, and the ungrouped chats apart from them, whichever workspace is in use.
  const grouped = visible.filter(session => session.workspaceId === workspaces.selectedId)
  const ungrouped = visible.filter(session => session.workspaceId === null)
  if (!grouped.length && !ungrouped.length)
    chats.append(element('p', found ? 'Không có chat nào khớp với các từ đã nhập.' : 'Chưa có chat trước.'))
  for (const session of grouped) chats.append(chatButton(session))
  if (ungrouped.length) {
    chats.append(element('h3', 'Chat chưa nhóm', 'chat-group-heading'))
    for (const session of ungrouped) chats.append(chatButton(session))
  }
}
async function refresh() {
  const [nextSettings, nextSessions, nextWorkspaces] = await Promise.all([management.settings(), management.sessions(), management.workspaces()])
  settings = nextSettings
  sessions = nextSessions
  workspaces = nextWorkspaces
  workspaceUI.update(workspaces)
  if (current) current = sessions.find(session => session.sessionId === current?.sessionId) ?? current
  if (searchWords) searchResults = new Set((await management.search(searchWords)).map(session => session.sessionId))
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
      waiting = snapshot.status === 'awaiting_user' ? snapshot : undefined
      controls()
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
  if (current) { saveDraft(); await flushDraft(current.sessionId) }
  const loaded = await Promise.all([client.history(session.sessionId), management.activities(session.sessionId),
    management.requests(session.sessionId), outlines.snapshot(session.sessionId), readDraft(session.sessionId)])
  if (generation !== previousGeneration || (switching && switchingBlocked())) return
  input.value = loaded[4]
  generation++
  watch?.abort()
  if (current?.sessionId !== session.sessionId) { timeline.reset(); outlineState = undefined }
  current = session
  const pending = loaded[2].find(request => request.requestId === session.activeRequestId && request.status === 'awaiting_user')
  waiting = pending?.question ? { requestId: pending.requestId, sessionId: session.sessionId, status: 'awaiting_user', question: pending.question } : undefined
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
  // An empty current chat of the workspace in use is reused; a new chat always joins the workspace in use.
  if (current && !historyPresent && current.workspaceId === workspaces.selectedId) { input.focus(); return }
  creating = true
  controls()
  try {
    // FR-053: the Host gives the new chat the most recent model choice of any chat, when still selectable.
    const created = await management.create()
    await refresh()
    await open(created)
  } finally { creating = false; controls() }
}
const settingsUI = settingsPanel(management, refresh, root, () => input.focus())
const workspaceUI = workspaceView(management, root, async (next, reloadChats) => {
  // Switching or adding keeps the open chat and its draft; only the list of earlier chats changes.
  workspaces = next
  if (reloadChats) await refresh()
  else renderChats()
  controls()
})
const search = element('form', undefined, 'chat-search')
search.setAttribute('role', 'search')
const searchInput = element('input')
searchInput.type = 'search'
searchInput.placeholder = 'Tìm chat theo từ…'
searchInput.setAttribute('aria-label', 'Tìm chat trước theo từ')
search.append(searchInput)
let searchTimer: ReturnType<typeof setTimeout> | undefined
function findChats() {
  const words = searchInput.value.trim()
  searchWords = words
  if (!words) { searchResults = undefined; renderChats(); return }
  run(management.search(words).then(found => {
    // FR-134: keep the words; show only the chats that hold them.
    if (searchWords !== words) return
    searchResults = new Set(found.map(session => session.sessionId))
    renderChats()
  }))
}
searchInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(findChats, 200) })
search.addEventListener('submit', event => { event.preventDefault(); clearTimeout(searchTimer); findChats() })
const unavailable = element('p', requestsUnavailableText, 'requests-unavailable')
unavailable.setAttribute('role', 'note')
const picker = modelPicker(model, () => run(settingsUI.open()), () => run(settingsUI.open(true)))
function switchingBlocked(): boolean {
  return opening !== undefined || !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
}
const newChatButton = button('Chat mới', () => run(newChat()))
newChatButton.dataset.action = 'new-chat'
newChatButton.title = 'Chat mới'
const navigationHint = element('p', 'Hãy đợi yêu cầu kết thúc hoặc dừng yêu cầu trước khi đổi chat.', 'navigation-hint')
navigationHint.hidden = true
const recents = button('Gần đây', () => {
  chats.hidden = !chats.hidden
  recents.setAttribute('aria-expanded', String(!chats.hidden))
  controls()
})
recents.className = 'recents-toggle'
recents.setAttribute('aria-expanded', 'true')
// On a phone the chat list starts folded so the conversation owns the first screen.
const compactNavigation = matchMedia('(max-width:720px)')
const foldRecents = () => { chats.hidden = compactNavigation.matches; recents.setAttribute('aria-expanded', String(!chats.hidden)) }
foldRecents()
compactNavigation.addEventListener('change', () => { foldRecents(); controls() })
recents.setAttribute('aria-controls', 'recent-chats')
chats.id = 'recent-chats'
// The chat list can be hidden to a narrow rail; the choice is a per-browser layout convenience.
const navToggle = button('', () => setNavigation(root.dataset.nav !== 'collapsed'))
navToggle.className = 'nav-toggle'
function setNavigation(collapse: boolean, remember = true) {
  if (collapse) root.dataset.nav = 'collapsed'
  else delete root.dataset.nav
  const label = collapse ? 'Hiện danh sách chat' : 'Ẩn danh sách chat'
  navToggle.setAttribute('aria-expanded', String(!collapse))
  navToggle.setAttribute('aria-label', label)
  navToggle.title = label
  if (remember) try { localStorage.setItem('deckagent-nav', collapse ? 'collapsed' : 'open') } catch { /* Optional layout preference. */ }
}
let storedNavigation: string | null = null
try { storedNavigation = localStorage.getItem('deckagent-nav') } catch { /* Optional layout preference. */ }
setNavigation(storedNavigation === 'collapsed', false)
const navTop = element('div', undefined, 'nav-top')
navTop.append(element('div', 'DeckAgent', 'wordmark'), navToggle)
// Settings, theme, reconnect and developer tools live in one menu at the bottom of the sidebar, like the Claude app.
const accountMenu = element('div', undefined, 'account-menu')
accountMenu.id = 'account-menu'
accountMenu.setAttribute('role', 'menu')
accountMenu.setAttribute('aria-label', 'Cài đặt và công cụ')
accountMenu.hidden = true
const accountTrigger = button('', () => (accountMenu.hidden ? openAccountMenu() : closeAccountMenu()))
accountTrigger.className = 'account-trigger'
accountTrigger.title = 'Cài đặt'
accountTrigger.setAttribute('aria-haspopup', 'menu')
accountTrigger.setAttribute('aria-controls', 'account-menu')
accountTrigger.setAttribute('aria-expanded', 'false')
accountTrigger.append(element('span', undefined, 'account-avatar'), element('span', 'Cài đặt', 'account-label'))
function openAccountMenu() {
  accountMenu.hidden = false
  accountTrigger.setAttribute('aria-expanded', 'true')
  const box = accountTrigger.getBoundingClientRect()
  const width = Math.min(280, innerWidth - 16)
  accountMenu.style.width = `${width}px`
  accountMenu.style.left = `${Math.max(8, Math.min(box.left, innerWidth - width - 8))}px`
  accountMenu.dataset.side = box.top > innerHeight / 2 ? 'above' : 'below'
  if (accountMenu.dataset.side === 'above') { accountMenu.style.top = ''; accountMenu.style.bottom = `${innerHeight - box.top + 8}px` }
  else { accountMenu.style.bottom = ''; accountMenu.style.top = `${box.bottom + 8}px` }
}
function closeAccountMenu(restoreFocus = false) {
  if (accountMenu.hidden) return
  accountMenu.hidden = true
  accountTrigger.setAttribute('aria-expanded', 'false')
  if (restoreFocus) accountTrigger.focus()
}
// The menu closes on Escape and on any press outside it, like the model popover.
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAccountMenu(true) })
document.addEventListener('pointerdown', event => {
  if (!accountMenu.hidden && !accountMenu.contains(event.target as Node) && !accountTrigger.contains(event.target as Node)) closeAccountMenu()
})
const themeSection = element('div', undefined, 'menu-section')
themeSection.append(element('span', 'Giao diện'), themeControl(management))
accountMenu.append(
  element('p', 'Chạy trên máy của bạn', 'menu-note'),
  Object.assign(button('Cài đặt model', () => { closeAccountMenu(); run(settingsUI.open()) }), { className: 'settings-open', title: 'Cài đặt model' }),
  themeSection,
)
navigation.append(
  navTop,
  workspaceUI.node,
  newChatButton,
  navigationHint,
  recents,
  search,
  chats,
  accountTrigger,
  accountMenu,
)
const headingText = element('div', undefined, 'chat-heading')
headingText.append(title, headerState)
function showDeck() { deck.hidden = true; publishedDeck.hidden = false; openDeck.hidden = true }
const openDeck = button('Mở deck', showDeck)
openDeck.hidden = true
const headingActions = element('div', undefined, 'chat-heading-actions')
headingActions.append(openDeck)
heading.append(headingText, headingActions)
const reconnect = button('Kết nối lại / đọc lịch sử', () => {
  closeAccountMenu()
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
accountMenu.append(reconnect)
const composerActions = element('div', undefined, 'composer-actions')
const composerControls = element('div', undefined, 'composer-controls')
const attachment = button('+', () => {})
attachment.disabled = true
attachment.className = 'attachment-action'
attachment.title = 'Đính kèm tệp chưa được hỗ trợ trong bản này'
attachment.setAttribute('aria-label', 'Đính kèm tệp chưa được hỗ trợ')
composerControls.append(attachment, createPresentation)
const primaryAction = element('div', undefined, 'composer-primary')
primaryAction.append(picker.node, submit, stopRequest)
composerActions.append(composerControls, primaryAction)
form.append(unavailable, input, composerActions)
input.addEventListener('input', () => { saveDraft(); controls() })
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (!submit.disabled && input.value.trim()) form.requestSubmit()
  }
})
const dock = element('div', undefined, 'composer-dock')
dock.append(questionUI.node, outlineDock, form)
conversation.append(heading, status, welcome, messages, dock)
root.prepend(navigation, conversation, deck, publishedDeck)
initMotion(root)
// Mobile navigation wraps as history/status changes; reserve its actual height for the chat.
const navigationSize = new ResizeObserver(() => root.style.setProperty('--navigation-height', `${navigation.getBoundingClientRect().height}px`))
navigationSize.observe(navigation)
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
  if (waiting?.question && current.activeRequestId === waiting.requestId) {
    if (!extra.outlineAction) await replyToQuestion({ type: 'text', text })
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
    if (generation === expected) run(follow(accepted.requestId, id, expected))
  } catch (error) {
    try { await showOutlines(id, expected) } catch { /* Keep the last saved outline if reconnect also fails. */ }
    throw error
  } finally {
    sending.delete(id)
    controls()
  }
}

async function replyToQuestion(answer: RequestReply['answer']): Promise<void> {
  if (!current || !waiting?.question || submit.disabled || waiting.sessionId !== current.sessionId) return
  const id = current.sessionId, expected = generation, snapshot = waiting, question = waiting.question
  const key = JSON.stringify([id, question.questionId, question.version, answer])
  if (pendingReply?.key !== key) pendingReply = { key, value: { sessionId: id, questionId: question.questionId,
    version: question.version, replyId: crypto.randomUUID(), answer } }
  sending.add(id)
  controls()
  try {
    const accepted = await client.reply(snapshot.requestId, pendingReply.value)
    if (generation !== expected) return
    pendingReply = undefined
    waiting = undefined
    timeline.snapshot(accepted)
    if (answer.type === 'text' && input.value === answer.text) { input.value = ''; saveDraft() }
    controls()
    await Promise.all([refresh(), showHistory(id, expected), showActivities(id, expected)])
    if (generation === expected) run(follow(accepted.requestId, id, expected))
  } finally { sending.delete(id); controls() }
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
    if (current) { saveDraft(); void flushDraft(current.sessionId) }
    navigationSize.disconnect()
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
// Another open interface may have changed the draft of this chat; show the Host's draft when this one is idle.
window.addEventListener('focus', () => {
  const id = current?.sessionId
  if (!id || pendingDrafts.has(id) || document.activeElement === input) return
  management.draft(id).then(text => {
    if (current?.sessionId !== id || pendingDrafts.has(id) || input.value === text) return
    drafts.set(id, text)
    input.value = text
    controls()
  }, () => { /* The draft on screen stays; the next save reports a lost connection. */ })
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
