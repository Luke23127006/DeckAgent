import type { AgentRequest, HistoryMessage, RequestReply, RequestSnapshot, WebSession, WebSettings, WorkspaceList } from '@deckagent/host-api'
import type { OutlineSnapshot } from '@deckagent/deck'
import { HostClient } from './host-client.ts'
import { ManagementClient } from './management-client.ts'
import { button, element, icon, iconButton } from './dom.ts'
import { modelPicker } from './model-picker.ts'
import { settingsPanel } from './settings-panel.ts'
import { mountDeckTab } from './deck-tab.ts'
import { ConversationView } from './conversation-view.ts'
import { DeckClient } from './deck-client.ts'
import { mountDeckCanvas } from './deck-canvas.ts'
import { OutlineClient } from './outline-client.ts'
import { failureFeedback } from './request-feedback.ts'
import { questionView } from './question-view.ts'
import { backgroundControl } from './background-control.ts'
import { backgroundFrom, createBackdrop } from './background.ts'
import { mountNavResizer } from './nav-resizer.ts'
import { themeControl } from './theme.ts'
import { tooltip } from './tooltip.ts'
import { initMotion } from './motion.ts'
import { workspaceHome } from './workspace-home.ts'
import { folderIcon, workspaceView } from './workspace-view.ts'

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
// A chat of a workspace names its workspace before its title, like a project chat of Claude; a chat of no workspace does not.
const place = element('span', undefined, 'chat-place')
const placeName = element('span', '', 'chat-place-name')
place.append(icon(folderIcon), placeName)
place.hidden = true
const headerState = element('small', '', 'chat-state')
headerState.setAttribute('aria-live', 'polite')
const welcome = element('section', undefined, 'welcome')
welcome.hidden = true
const pageView = workspaceHome((id, x, y) => workspaceUI.menuFor(id, x, y))
// Names the workspace of a chat with no conversation yet, when it is open outside the page of the workspace.
const welcomeWorkspace = element('p', '', 'welcome-workspace')
welcomeWorkspace.hidden = true
welcome.append(welcomeWorkspace, element('h2', 'Hãy mô tả deck bạn muốn'),
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
/**
 * A new chat that the Host has not made yet, like the new chat of ChatGPT: it is not listed, and the Host makes it at
 * the first character of its draft, so the draft is kept from then on (FR-038). `workspaceId` is the workspace it
 * joins; `null` for a chat of no workspace. Never set together with `current`.
 */
let pending: { readonly workspaceId: string | null } | undefined
/**
 * The workspace whose page shows in the main view, like the project page of ChatGPT, with the composer under its name.
 * The page stays while the user types its first chat (made at the first character); opening a chat or sending leaves it.
 */
let page: string | undefined
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
/** A reload while a new chat waits opens a new chat again, not the chat that was open before it. */
function forget() {
  try {
    sessionStorage.removeItem('deckagent-session')
  } catch {
    /* Optional: a reload then opens the chat remembered before. */
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
  for (const item of chats.querySelectorAll<HTMLButtonElement>('button[data-session-id]')) item.disabled = switchingBlocked() || creating
  for (const item of pageView.node.querySelectorAll<HTMLButtonElement>('button[data-chat-id]')) item.disabled = switchingBlocked() || creating
  newChatButton.disabled = switchingBlocked() || creating
  model.disabled = (!current && !pending) || (!!current && selecting.has(current.sessionId)) || opening !== undefined || creating
  workspaceUI.setBusy(opening !== undefined || creating)
  unavailable.hidden = requestsAvailable
  submit.disabled =
    !requestsAvailable ||
    (!current && !pending) ||
    creating ||
    reconnecting ||
    opening !== undefined ||
    (!!current && (sending.has(current.sessionId) || selecting.has(current.sessionId))) ||
    (!!current?.activeRequestId && !question) ||
    (!!current && !current.selectable && !question)
  createPresentation.disabled = submit.disabled
  submit.setAttribute('aria-disabled', String(submit.disabled || !input.value.trim() || input.value.length > 16000))
  createPresentation.hidden = !!outlineState?.active || !!deckModel.state.snapshot?.outlineId
  timeline.setOutlineBusy(submit.disabled || !!current?.activeRequestId)
  questionUI.update(question, submit.disabled)
  timeline.setQuestion(question?.prompt)
  const shown = page === undefined ? undefined : workspaces.workspaces.find(item => item.id === page)
  input.placeholder = question
    ? 'Nhập câu trả lời của bạn…'
    : shown
      ? `Chat mới trong ${shown.name}`
      : 'Nhập hoặc dán yêu cầu của bạn…'
  picker.update(settings, !!current?.activeRequestId)
  title.textContent = chatTitle
  title.title = chatTitle
  const active = !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
  headerState.textContent = question ? 'Đang chờ bạn trả lời' : current?.activeRequestId ? 'Đang làm việc' : active ? 'Đang gửi…'
    : outlineState?.proposals.some(proposal => proposal.status === 'current') ? 'Chờ xác nhận outline' : ''
  const outlinePending = !!outlineState?.proposals.some(proposal => proposal.status === 'current')
  headerState.dataset.waiting = String(!!question || (!active && outlinePending))
  navigationHint.hidden = !active || chats.hidden
  // The page of a workspace takes the place of the chat header, the welcome and the conversation.
  heading.hidden = !!shown
  pageView.node.hidden = !shown
  workspaceUI.setHome(shown?.id)
  placeDock(!!shown)
  welcome.hidden = !!shown || historyPresent || active || (!current && !pending) || opening !== undefined
  // The workspace of the open chat, or of the waiting new chat; nothing for a chat of no workspace.
  const homeId = current ? current.workspaceId : (pending?.workspaceId ?? null)
  const home = homeId ? workspaces.workspaces.find(item => item.id === homeId) : undefined
  placeName.textContent = home?.name ?? ''
  place.title = home ? `Workspace “${home.name}”` : ''
  place.hidden = !home
  welcomeWorkspace.textContent = home ? `Trong workspace “${home.name}”` : ''
  welcomeWorkspace.hidden = !home
  messages.hidden = !!shown || !welcome.hidden
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
/** What the chat lists say of a chat: its name, and whether it has slides. */
function describeChat(session: WebSession): { name: string; slides: string } {
  return {
    name: !session.readable ? 'Chat không đọc được' : !session.messageCount ? 'Chat mới' : session.title ?? 'Chat chưa có tên',
    slides: !session.readable ? 'Không mở được chat này' : session.hasSlides === undefined ? 'Chưa rõ slide' : session.hasSlides ? 'Có slide' : 'Chưa có slide',
  }
}
function chatButton(session: WebSession) {
  const item = button('', () =>
    run(open(session)),
  )
  const updated = element('time')
  updated.dateTime = session.updatedAt
  const date = new Date(session.updatedAt)
  updated.textContent = Number.isNaN(date.getTime()) ? 'Chưa rõ thời gian cập nhật' : date.toLocaleString('vi-VN')
  const { name, slides } = describeChat(session)
  item.append(element('strong', name), updated, element('small', `${slides}${session.activeRequestId ? ' · Đang làm việc…' : ''}`))
  item.title = `${name} · ${updated.textContent} · ${slides}`
  item.dataset.sessionId = session.sessionId
  if (!session.readable) item.dataset.unreadable = 'true'
  item.setAttribute('aria-current', String(session.sessionId === current?.sessionId))
  item.disabled = switchingBlocked()
  return item
}
/** A chat that lists: the open one, and those with a conversation, a model, slides or a draft. */
function listed(session: WebSession): boolean {
  return session.sessionId === current?.sessionId || !!session.messageCount || !!session.selection || !!session.hasSlides
    || !session.readable || !!session.hasDraft || !!drafts.get(session.sessionId)?.trim()
}
// Keep each chat where it is when opened; a new chat has the newest time, so it still lists first.
function newestFirst(a: WebSession, b: WebSession): number {
  return b.updatedAt.localeCompare(a.updatedAt) || a.sessionId.localeCompare(b.sessionId)
}
/** The chats the tree can show: those that list, or the matches of a search. */
function visibleChats(): WebSession[] {
  const found = searchResults
  return sessions.filter(session => (found ? found.has(session.sessionId) : listed(session))).sort(newestFirst)
}
/** One row of the chat list on the page of a workspace: name, slides and draft, and the day of the last change. */
function pageChatButton(session: WebSession): HTMLElement {
  const item = button('', () => run(open(session)))
  item.dataset.chatId = session.sessionId
  const { name, slides } = describeChat(session)
  const text = element('span', undefined, 'workspace-home-chat-text')
  text.append(element('strong', name), element('small', `${slides}${session.hasDraft ? ' · Có bản nháp' : ''}`))
  const updated = element('time')
  updated.dateTime = session.updatedAt
  const date = new Date(session.updatedAt)
  updated.textContent = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  item.append(text, updated)
  item.title = name
  item.disabled = switchingBlocked() || creating
  return item
}
/** Draws the page of the workspace whose page shows. The chat that the page composer is typing is not listed yet. */
function renderPage() {
  const shown = page === undefined ? undefined : workspaces.workspaces.find(item => item.id === page)
  if (!shown) return
  const typing = current?.sessionId
  pageView.update(
    shown,
    sessions
      .filter(session => session.workspaceId === shown.id && session.sessionId !== typing && listed(session))
      .sort(newestFirst)
      .map(pageChatButton),
  )
}
/**
 * The composer sits under the name of the workspace on its page, and at the foot of the conversation otherwise.
 * It moves only when the view changes: moving a focused text box takes the focus away from it.
 */
function placeDock(onPage: boolean) {
  const target = onPage ? pageView.slot : conversation
  if (dock.parentElement === target) return
  const focused = dock.contains(document.activeElement)
  target.append(dock)
  if (focused) input.focus()
}
/** One group of the tree: the chats of a workspace, or the ungrouped chats for `null`. */
function chatRows(workspaceId: string | null): HTMLElement[] {
  return visibleChats()
    .filter(session => session.workspaceId === workspaceId)
    .map(chatButton)
}
function renderChats() {
  workspaceUI.refresh()
  renderPage()
}
async function refresh() {
  const [nextSettings, nextSessions, nextWorkspaces] = await Promise.all([management.settings(), management.sessions(), management.workspaces()])
  settings = nextSettings
  sessions = nextSessions
  workspaces = nextWorkspaces
  followWorkspace()
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
  pending = undefined
  page = undefined
  const asking = loaded[2].find(request => request.requestId === session.activeRequestId && request.status === 'awaiting_user')
  waiting = asking?.question ? { requestId: asking.requestId, sessionId: session.sessionId, status: 'awaiting_user', question: asking.question } : undefined
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
/**
 * Shows a new chat of a workspace, or of none for `null`, without making it: the Host makes it at the first character
 * of the draft (`materialize`). The chat that was open keeps its draft, and stays listed when it has one.
 */
async function startPending(workspaceId: string | null) {
  if (switchingBlocked() || creating) return
  if (!settingsUI.leave()) return
  // A second press on the same new chat makes nothing.
  if (pending?.workspaceId === workspaceId) { input.focus(); return }
  picker.close()
  if (current) { saveDraft(); await flushDraft(current.sessionId) }
  if (switchingBlocked() || creating) return
  generation++
  watch?.abort()
  timeline.reset()
  outlineState = undefined
  deckModel.close()
  publishedDeck.hidden = true
  current = undefined
  waiting = undefined
  pending = { workspaceId }
  // A new chat of a workspace shows on the page of that workspace; a chat of no workspace on the plain new chat.
  page = workspaceId ?? undefined
  input.value = ''
  describeHistory([])
  forget()
  status.hidden = true
  renderModels()
  renderChats()
  input.focus()
}
/**
 * Makes the waiting new chat on the Host, once, with `selection` when the user chose a model first. Text typed while
 * the Host makes it stays in the composer and becomes the draft of the chat. Returns the chat, or nothing when there
 * is no waiting chat or another call is making it.
 */
async function materialize(selection?: { provider: string; model: string }): Promise<WebSession | undefined> {
  const target = pending
  if (!target || creating) return undefined
  creating = true
  controls()
  try {
    // The Host puts a chat in the workspace in use, which another open interface may have changed.
    if (target.workspaceId !== null && target.workspaceId !== workspaces.selectedId) {
      workspaces = await management.selectWorkspace(target.workspaceId)
      workspaceUI.update(workspaces)
    }
    // FR-053: with no selection, the Host gives the chat the most recent model choice of any chat, when still selectable.
    const created = await management.create(selection, target.workspaceId === null ? { ungrouped: true } : {})
    if (pending !== target) return undefined
    adopt(created)
    await refresh()
    return current
  } finally {
    creating = false
    // A failed attempt leaves the new chat waiting; the picker goes back to no choice.
    if (pending) renderModels()
    else controls()
  }
}
/**
 * A waiting new chat of a workspace joins the workspace in use: after a switch, or after its own workspace was
 * removed and the default one is in use. It never names a workspace that is gone. A chat of no workspace stays so.
 */
function followWorkspace() {
  const inUse = workspaces.selectedId
  if (pending?.workspaceId != null && pending.workspaceId !== inUse) pending = { workspaceId: inUse }
  // The page of a workspace that is gone or no longer in use gives way: to the page of the workspace in use while its
  // chat is not made yet, or else to the chat that the composer of the page made.
  if (page !== undefined && page !== inUse) page = pending ? inUse : undefined
}
/** The chat the Host just made becomes the open chat. Not `open()`: that reads the draft back and would drop typed text. */
function adopt(created: WebSession) {
  pending = undefined
  current = created
  remember(created.sessionId)
  deckModel.open(created.sessionId)
  saveDraft()
}
const settingsUI = settingsPanel(management, refresh, root, () => input.focus())
/** The "new chat" button of a workspace row: the workspace becomes the one in use, and a new chat of it waits. */
async function newChatIn(id: string) {
  if (creating) return
  if (id !== workspaces.selectedId) {
    workspaces = await management.selectWorkspace(id)
    workspaceUI.update(workspaces)
    renderChats()
    controls()
  }
  // While a request runs, the workspace still becomes the one in use, and the open chat stays (FR-071).
  if (!switchingBlocked()) await startPending(id)
}
const workspaceUI = workspaceView(
  management,
  root,
  async (next, reloadChats) => {
    // Switching or adding keeps the open chat and its draft; only the list of earlier chats changes.
    workspaces = next
    followWorkspace()
    if (reloadChats) await refresh()
    else renderChats()
    controls()
  },
  id => run(newChatIn(id)),
  { rows: chatRows, searching: () => searchResults !== undefined },
  // A workspace set up by name or for a folder opens a new chat of it; no chat is made until the user types.
  id => run(startPending(id)),
)
// The tree of workspaces with their chats fills the list area of the sidebar.
chats.append(workspaceUI.node)
const search = element('form', undefined, 'chat-search')
search.setAttribute('role', 'search')
const searchInput = element('input')
searchInput.type = 'search'
searchInput.placeholder = 'Tìm chat theo từ…'
searchInput.setAttribute('aria-label', 'Tìm chat trước theo từ')
// The field grows out of the search icon in the sidebar header (see `searchButton`); it is closed until then.
// The icon inside the open field sits where the header icon was; pressing it again closes the field.
const searchToggle = iconButton('Đóng tìm kiếm', ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'm21 21-4.34-4.34'], () => closeSearch(true))
searchToggle.className = 'nav-icon search-toggle'
search.dataset.open = 'false'
search.append(searchInput, searchToggle)
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
// Like ChatGPT, the `Chat mới` button starts a chat that belongs to no workspace; the button of a workspace row starts one in it.
const newChatButton = button('Chat mới', () => run(startPending(null)))
newChatButton.dataset.action = 'new-chat'
newChatButton.title = 'Chat mới'
const navigationHint = element('p', 'Hãy đợi yêu cầu kết thúc hoặc dừng yêu cầu trước khi đổi chat.', 'navigation-hint')
navigationHint.hidden = true
// The shortcut works without being shown.
newChatButton.setAttribute('aria-keyshortcuts', 'Control+Shift+O')
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
    event.preventDefault()
    if (!newChatButton.disabled) run(startPending(null))
  }
})
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
// The search icon opens a field that grows out of it. The chat list opens too, so the matches show.
const searchButton = iconButton('Tìm chat', ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'm21 21-4.34-4.34'], () => openSearch())
searchButton.setAttribute('aria-expanded', 'false')
searchButton.setAttribute('aria-controls', 'chat-search')
search.id = 'chat-search'
function openSearch() {
  if (root.dataset.nav === 'collapsed') setNavigation(false)
  search.dataset.open = 'true'
  searchButton.setAttribute('aria-expanded', 'true')
  searchInput.focus()
}
/** Closing clears the words, so the list never stays filtered by a field that is out of sight. */
function closeSearch(restoreFocus: boolean) {
  search.dataset.open = 'false'
  searchButton.setAttribute('aria-expanded', 'false')
  if (searchInput.value) {
    searchInput.value = ''
    clearTimeout(searchTimer)
    findChats()
  }
  if (restoreFocus) searchButton.focus()
}
searchInput.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); closeSearch(true) } })
search.addEventListener('focusout', event => {
  if (!search.contains(event.relatedTarget as Node | null) && !searchInput.value.trim()) closeSearch(false)
})
searchButton.className = 'nav-icon nav-search'
tooltip(searchButton, 'Tìm chat')
const navActions = element('div', undefined, 'nav-actions')
navActions.append(searchButton, navToggle)
navTop.append(element('div', 'DeckAgent', 'wordmark'), navActions, search)
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
const backdrop = createBackdrop()
// `/theme.js` already set the saved choice before first paint; this draws it.
const initialBackground = backgroundFrom(document.documentElement.dataset.background)
backdrop.set(initialBackground)
const backgroundSection = element('div', undefined, 'menu-section')
backgroundSection.append(element('span', 'Nền'), backgroundControl(management, backdrop, initialBackground))
accountMenu.append(
  element('p', 'Chạy trên máy của bạn', 'menu-note'),
  Object.assign(button('Cài đặt model', () => { closeAccountMenu(); run(settingsUI.open()) }), { className: 'settings-open', title: 'Cài đặt model' }),
  themeSection,
  backgroundSection,
)
navigation.append(
  navTop,
  newChatButton,
  navigationHint,
  chats,
  accountTrigger,
  accountMenu,
)
const headingText = element('div', undefined, 'chat-heading')
headingText.append(place, title, headerState)
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
input.addEventListener('input', () => {
  // The first character of a waiting new chat makes it; from then on its draft is kept like any other.
  if (pending && input.value.trim()) run(materialize().then(() => {}))
  saveDraft()
  controls()
})
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (!submit.disabled && input.value.trim()) form.requestSubmit()
  }
})
const dock = element('div', undefined, 'composer-dock')
dock.append(questionUI.node, outlineDock, form)
conversation.append(heading, status, pageView.node, welcome, messages, dock)
root.prepend(navigation, conversation, deck, publishedDeck)
mountNavResizer(navigation, root)
initMotion(root)
// Mobile navigation wraps as history/status changes; reserve its actual height for the chat.
const navigationSize = new ResizeObserver(() => root.style.setProperty('--navigation-height', `${navigation.getBoundingClientRect().height}px`))
navigationSize.observe(navigation)
/** The model that an option of the picker stands for; nothing for the empty option or a malformed value. */
function chosenModel(text: string): { provider: string; model: string } | undefined {
  if (!text) return undefined
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || !('provider' in value) || !('model' in value)) return undefined
    return typeof value.provider === 'string' && typeof value.model === 'string'
      ? { provider: value.provider, model: value.model }
      : undefined
  } catch {
    return undefined
  }
}
model.addEventListener('change', () => {
  if (model.value === '__settings') {
    model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
    run(settingsUI.open())
    return
  }
  const choice = chosenModel(model.value)
  if (!choice) return
  // Choosing a model for a waiting new chat makes the chat with that model.
  if (!current) {
    if (pending) run(materialize(choice).then(() => {}))
    return
  }
  const id = current.sessionId
  selecting.add(id)
  model.disabled = true
  controls()
  run(
    (async () => {
      try {
        await management.select(id, choice)
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
  if (submit.disabled || (!current && !pending)) return
  if (!text.trim()) return
  if (text.length > 16000) {
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent = 'Yêu cầu quá dài. Hãy rút gọn nội dung trước khi gửi.'
    return
  }
  // The first request of a waiting new chat makes the chat first.
  const fresh = !current
  const chat = current ?? (await materialize())
  if (!chat) return
  // A chat made just now has no model that can be used: the picker and the status say so.
  if (fresh && !chat.selectable) { controls(); return }
  // Sending leaves the page of the workspace for the conversation of the chat, like ChatGPT.
  if (page !== undefined) { page = undefined; controls() }
  if (waiting?.question && chat.activeRequestId === waiting.requestId) {
    if (!extra.outlineAction) await replyToQuestion({ type: 'text', text })
    return
  }
  const id = chat.sessionId,
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
    else await startPending(null)
  })(),
)
