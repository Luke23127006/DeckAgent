import type {
  HistoryMessage,
  RequestSnapshot,
  RequestStatus,
  WebSession,
  WebSettings,
  WorkspaceList,
} from '@deckagent/host-api'
import type { OutlineSnapshot } from '@deckagent/deck'
import { HostClient, HostRequestError, isActive } from './host-client.ts'
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
import { themeControl } from './theme.ts'
import { initMotion } from './motion.ts'
import { workspaceView } from './workspace-view.ts'
import type { ApprovalView } from '@deckagent/host-api'
import type { AttachmentView, ChatDraft } from '@deckagent/host-api'
import { AttachmentDraftView } from './attachment-view.ts'

/** Why Send is not offered for the open chat (FR-046, UC-003 A17); `undefined` when it is. The draft is always kept. */
function sendBlocked(session: WebSession | undefined, settings: WebSettings): string | undefined {
  if (!settings.runtime.available)
    return settings.runtime.reason === 'RUNTIME_UNAVAILABLE'
      ? 'Chưa gửi được yêu cầu: DeckAgent không tìm thấy OpenCode CLI. Cài OpenCode CLI rồi khởi động lại với --opencode <đường dẫn>. Bản nháp được giữ nguyên.'
      : 'Chưa gửi được yêu cầu: runtime chưa sẵn sàng. Bản nháp được giữ nguyên.'
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
welcome.append(
  element('h2', 'Hãy mô tả deck bạn muốn'),
  element(
    'p',
    'Dán ghi chú hoặc ý tưởng của bạn. DeckAgent đề xuất outline trước. Chưa có slide nào được tạo cho đến khi bạn xác nhận outline.',
  ),
)
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
// Outline confirmation and generation arrive with their builds (B04); this build sends generic chat requests only.
const timeline = new ConversationView(messages, undefined, undefined, outlineDock, {
  retry: text => {
    input.value = text
    input.focus()
    input.setSelectionRange(text.length, text.length)
    saveDraft()
    controls()
  },
  settings: () => run(settingsUI.open()),
  draft: () => input.value,
  previewAttachment: item => run(previewAttachment(item)),
  approve: async (requestId, approvalId, decision) => {
    await client.decide(requestId, approvalId, decision)
    const saved = await client.snapshot(requestId)
    if (current?.sessionId === saved.sessionId) timeline.snapshot(saved)
  },
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
const stopRequest = button('Dừng', () => {
  const id = current?.activeRequestId
  if (!id || stopping.has(id)) return
  stopping.add(id)
  controls()
  // The Host saves the stop at once (NFR-011); the stream then reports it, and this snapshot covers a lost stream.
  run(
    client
      .stop(id)
      .then(snapshot => {
        timeline.snapshot(snapshot)
      })
      .finally(() => {
        stopping.delete(id)
        controls()
      }),
  )
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
const deckModel = mountDeckCanvas(publishedDeck, new DeckClient(location.origin, token), () => {
  deck.hidden = true
  openDeck.hidden = true
})
let current: WebSession | undefined
let settings: WebSettings = { providers: [], persistentKeys: false, builtIns: [], runtime: { available: false } }
const stopping = new Set<string>()
let sessions: readonly WebSession[] = []
let workspaces: WorkspaceList = { workspaces: [], selectedId: 'default' }
let searchWords = ''
let searchResults: Set<string> | undefined
let watch: AbortController | undefined
let generation = 0
const sending = new Set<string>()
const selecting = new Set<string>()
const drafts = new Map<string, string>()
const draftStates = new Map<string, ChatDraft>()
const draftWork = new Map<string, Promise<void>>()
const attachmentBusy = new Set<string>()
let attachmentUI: AttachmentDraftView | undefined

function enqueueDraft<T>(id: string, action: () => Promise<T>): Promise<T> {
  const work = (draftWork.get(id) ?? Promise.resolve()).then(action)
  draftWork.set(
    id,
    work.then(
      () => {},
      () => {},
    ),
  )
  return work
}

function receiveDraft(draft: ChatDraft, acknowledgedText = false): void {
  const before = draftStates.get(draft.sessionId)
  if (before?.revision !== undefined && draft.revision !== undefined && draft.revision < before.revision) return
  if (!acknowledgedText && before && draft.text !== before.text && draft.text !== drafts.get(draft.sessionId)) {
    // Polling must not acquire a newer revision while silently retaining older text in the editor.
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent =
      'Bản nháp đã đổi ở giao diện khác. Giữ nội dung đang soạn và mở lại chat để đối chiếu trước khi lưu hoặc gửi.'
    return
  }
  const attachments = draft.attachments?.map(item => {
    const known = before?.attachments?.find(previous => previous.attachmentId === item.attachmentId)
    return known && known.state !== 'preparing' && item.state === 'preparing' ? known : item
  })
  draftStates.set(draft.sessionId, { ...draft, ...(attachments ? { attachments } : {}) })
  if (current?.sessionId === draft.sessionId) controls()
}
let polling = false
let disposed = false
let reconnecting = false
let opening: number | undefined
let creating = false
let historyPresent = false
let chatTitle = 'Chat mới'

function describeHistory(history: readonly HistoryMessage[]) {
  historyPresent = history.length > 0
  const first = history
    .find(message => message.role === 'user')
    ?.content.replace(/\s+/g, ' ')
    .trim()
  const attachmentTitle = history.find(message => message.role === 'user')?.attachments?.[0]?.name
  const displayTitle = first || attachmentTitle
  chatTitle = displayTitle ? (displayTitle.length > 64 ? `${displayTitle.slice(0, 64)}…` : displayTitle) : 'Chat mới'
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
  pendingDrafts.set(
    id,
    setTimeout(() => {
      void flushDraft(id)
    }, 250),
  )
}
async function flushDraft(id: string) {
  const timer = pendingDrafts.get(id)
  if (timer === undefined) {
    await draftWork.get(id)
    return true
  }
  clearTimeout(timer)
  pendingDrafts.delete(id)
  try {
    const text = drafts.get(id) ?? ''
    await enqueueDraft(id, async () => {
      const draft = await management.saveDraftState(id, text, draftStates.get(id)?.revision)
      receiveDraft(draft, true)
    })
    return true
  } catch {
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent = 'Chưa lưu được bản nháp vào DeckAgent. Kiểm tra kết nối; nội dung vẫn còn trong ô soạn thảo.'
    return false
  }
}
async function readDraft(id: string): Promise<string> {
  if (!(await flushDraft(id))) throw new Error('DRAFT_NOT_SAVED')
  const draft = await management.draftState(id)
  receiveDraft(draft, true)
  const text = draft.text
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

async function uploadAttachments(files: File[]): Promise<void> {
  const id = current?.sessionId
  if (!id || attachmentBusy.has(id)) return
  attachmentBusy.add(id)
  controls()
  try {
    if (!(await flushDraft(id))) return
    for (const file of files)
      await enqueueDraft(id, async () => {
        const draft = draftStates.get(id)
        if (draft?.revision === undefined) throw new Error('DRAFT_CONFLICT')
        const uploaded = await management.uploadAttachment(id, file, draft.revision)
        receiveDraft(uploaded.draft)
      })
    await refresh()
  } catch (error) {
    receiveDraft(await management.draftState(id))
    throw error
  } finally {
    attachmentBusy.delete(id)
    controls()
  }
}

async function removeAttachment(attachmentId: string): Promise<void> {
  const id = current?.sessionId
  if (!id || attachmentBusy.has(id)) return
  attachmentBusy.add(id)
  controls()
  try {
    if (!(await flushDraft(id))) return
    await enqueueDraft(id, async () => {
      const draft = draftStates.get(id)
      if (draft?.revision === undefined) throw new Error('DRAFT_CONFLICT')
      receiveDraft(await management.removeAttachment(id, attachmentId, draft.revision))
    })
    await refresh()
  } finally {
    attachmentBusy.delete(id)
    controls()
  }
}

let previewDialog: HTMLDialogElement | undefined
let previewUrl: string | undefined
function closePreview(): void {
  previewDialog?.remove()
  previewDialog = undefined
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = undefined
}

async function previewAttachment(item: AttachmentView): Promise<void> {
  const id = current?.sessionId
  if (!id) return
  const preview = await management.previewAttachment(id, item.attachmentId)
  if (current?.sessionId !== id) return
  closePreview()
  const dialog = element('dialog', undefined, 'attachment-preview')
  dialog.append(
    element('h2', item.name),
    element('p', 'Bản xem trước có giới hạn; phần chưa đọc hoặc đã thu nhỏ được báo trong trạng thái tệp.'),
  )
  if (typeof preview === 'string') dialog.append(element('pre', preview))
  else {
    previewUrl = URL.createObjectURL(preview)
    const image = element('img')
    image.src = previewUrl
    image.alt = item.name
    dialog.append(image)
  }
  dialog.append(
    button('Đóng xem trước', () => {
      dialog.close()
      closePreview()
    }),
  )
  dialog.addEventListener('close', closePreview, { once: true })
  document.body.append(dialog)
  previewDialog = dialog
  dialog.showModal()
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
  const activeId = current?.activeRequestId
  stopRequest.hidden = !activeId
  stopRequest.disabled = !!activeId && stopping.has(activeId)
  submit.hidden = !!activeId
  for (const item of chats.querySelectorAll('button')) item.disabled = switchingBlocked() || creating
  newChatButton.disabled = switchingBlocked() || creating
  model.disabled = !current || selecting.has(current.sessionId) || opening !== undefined || creating
  workspaceUI.setBusy(opening !== undefined || creating)
  // A chat without a selectable model keeps its draft and says why it cannot send (FR-046).
  const blocked = sendBlocked(current, settings)
  const draft = current ? draftStates.get(current.sessionId) : undefined
  const busy = !!current && attachmentBusy.has(current.sessionId)
  const invalidAttachments = draft?.attachments?.some(item => item.state !== 'ready') ?? false
  attachmentUI?.render(draft, busy)
  unavailable.hidden = !blocked || !!activeId
  if (blocked && unavailable.textContent !== blocked) unavailable.textContent = blocked
  submit.disabled =
    !!blocked ||
    !current ||
    creating ||
    reconnecting ||
    opening !== undefined ||
    sending.has(current.sessionId) ||
    selecting.has(current.sessionId) ||
    busy ||
    invalidAttachments ||
    !!activeId
  submit.setAttribute(
    'aria-disabled',
    String(
      submit.disabled || (!input.value.trim() && !draft?.attachments?.length) || [...input.value].length > requestLimit,
    ),
  )
  timeline.setOutlineBusy(true)
  picker.update(settings, !!activeId)
  title.textContent = chatTitle
  title.title = chatTitle
  const active = !!activeId || (!!current && sending.has(current.sessionId))
  headerState.textContent = activeId ? 'Đang làm việc' : active ? 'Đang gửi…' : ''
  headerState.dataset.waiting = 'false'
  navigationHint.hidden = !activeId || chats.hidden
  welcome.hidden = historyPresent || active || !current || opening !== undefined
  messages.hidden = !welcome.hidden
  openDeck.hidden =
    (!outlineState?.confirmedId &&
      !(deckModel.state.snapshot?.sessionId === current?.sessionId && deckModel.state.snapshot?.outlineId)) ||
    !publishedDeck.hidden
  fitInput()
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
  const item = button('', () => run(open(session)))
  const updated = element('time')
  updated.dateTime = session.updatedAt
  const date = new Date(session.updatedAt)
  updated.textContent = Number.isNaN(date.getTime()) ? 'Chưa rõ thời gian cập nhật' : date.toLocaleString('vi-VN')
  const slides = !session.readable
    ? 'Không mở được chat này'
    : session.hasSlides === undefined
      ? 'Chưa rõ slide'
      : session.hasSlides
        ? 'Có slide'
        : 'Chưa có slide'
  const name = !session.readable
    ? 'Chat không đọc được'
    : !session.messageCount
      ? 'Chat mới'
      : (session.title ?? 'Chat chưa có tên')
  item.append(
    element('strong', name),
    updated,
    element('small', `${slides}${session.activeRequestId ? ' · Đang làm việc…' : ''}`),
  )
  item.title = `${name} · ${updated.textContent} · ${slides}`
  item.dataset.sessionId = session.sessionId
  if (!session.readable) item.dataset.unreadable = 'true'
  item.setAttribute('aria-current', String(session.sessionId === current?.sessionId))
  item.disabled = switchingBlocked()
  return item
}
function renderChats() {
  chats.replaceChildren()
  const listed = (session: WebSession) =>
    session.sessionId === current?.sessionId ||
    session.messageCount ||
    session.selection ||
    session.hasSlides ||
    !session.readable ||
    session.hasDraft ||
    drafts.get(session.sessionId)?.trim()
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
  const [nextSettings, nextSessions, nextWorkspaces] = await Promise.all([
    management.settings(),
    management.sessions(),
    management.workspaces(),
  ])
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
/**
 * Follows a request through the Host's saved events: the first connection replays from the start, a reconnect
 * continues after the last sequence, so nothing is missed or counted twice (FR-068). Leaving stops nothing.
 */
async function follow(id: string, sessionId: string, expected: number) {
  watch?.abort()
  const control = new AbortController()
  watch = control
  const parts = new Map<string, string>()
  let state: RequestStatus = 'active'
  let errorCode: string | undefined
  let cursor = 0
  let failures = 0
  let pendingApproval: ApprovalView | null = null
  const show = () =>
    timeline.snapshot({
      requestId: id,
      sessionId,
      status: state,
      text: [...parts.values()].filter(text => text.trim()).join('\n\n'),
      sequence: cursor,
      pendingApproval,
      ...(errorCode ? { errorCode } : {}),
    })
  while (!control.signal.aborted && generation === expected && isActive(state)) {
    try {
      for await (const event of client.watch(id, control.signal, cursor)) {
        if (generation !== expected) return
        cursor = event.sequence
        failures = 0
        if (event.kind === 'text') parts.set(event.part, event.text)
        else if (event.kind === 'activity')
          timeline.activity({
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
        else if (event.kind === 'notice' && event.code === 'CONVERSATION_SUMMARIZED') timeline.summarized(id)
        show()
      }
    } catch (error) {
      if (control.signal.aborted || generation !== expected) return
      if (error instanceof HostRequestError && error.message === 'REQUEST_NOT_FOUND') return
      timeline.connectionLost(id)
      failures++
      await new Promise(resolve => setTimeout(resolve, Math.min(5000, 500 * failures)))
    }
  }
  if (control.signal.aborted || generation !== expected) return
  await Promise.all([
    showHistory(sessionId, expected),
    showActivities(sessionId, expected),
    showOutlines(sessionId, expected),
  ])
  await refresh()
  if (current?.sessionId === sessionId && current.activeRequestId === id) {
    const { activeRequestId: _ended, ...rest } = current
    current = rest
  }
  controls()
}
async function open(listed: WebSession) {
  closePreview()
  let session = listed
  const switching = current?.sessionId !== session.sessionId
  if (switching && switchingBlocked()) return
  if (switching && !settingsUI.leave()) return
  picker.close()
  // Read everything before replacing current state. A failed open leaves the old chat intact.
  const previousGeneration = generation
  if (current) {
    saveDraft()
    await flushDraft(current.sessionId)
  }
  const loaded = await Promise.all([
    client.history(session.sessionId),
    management.activities(session.sessionId),
    management.requests(session.sessionId),
    outlines.snapshot(session.sessionId),
    readDraft(session.sessionId),
  ])
  if (generation !== previousGeneration || (switching && switchingBlocked())) return
  input.value = loaded[4]
  generation++
  watch?.abort()
  if (current?.sessionId !== session.sessionId) {
    timeline.reset()
    outlineState = undefined
  }
  // The saved records say whether a request is active now; the list entry may be older.
  const activeRequestId = loaded[2].find(request => isActive(request.status))?.requestId
  const { activeRequestId: _listedRequest, ...rest } = listed
  session = { ...rest, ...(activeRequestId ? { activeRequestId } : {}) }
  current = session
  deckModel.open(session.sessionId)
  remember(session.sessionId)
  const expected = generation
  opening = expected
  renderModels()
  renderChats()
  status.hidden = true
  if (session.activeRequestId)
    timeline.snapshot({
      requestId: session.activeRequestId,
      sessionId: session.sessionId,
      status: 'active',
      text: '',
      sequence: 0,
    })
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
  if (current && !historyPresent && current.workspaceId === workspaces.selectedId) {
    input.focus()
    return
  }
  creating = true
  controls()
  try {
    // FR-053: the Host gives the new chat the most recent model choice of any chat, when still selectable.
    const created = await management.create()
    await refresh()
    await open(created)
  } finally {
    creating = false
    controls()
  }
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
  if (!words) {
    searchResults = undefined
    renderChats()
    return
  }
  run(
    management.search(words).then(found => {
      // FR-134: keep the words; show only the chats that hold them.
      if (searchWords !== words) return
      searchResults = new Set(found.map(session => session.sessionId))
      renderChats()
    }),
  )
}
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(findChats, 200)
})
search.addEventListener('submit', event => {
  event.preventDefault()
  clearTimeout(searchTimer)
  findChats()
})
const requestLimit = 16000
const unavailable = element('p', '', 'requests-unavailable')
unavailable.setAttribute('role', 'note')
const picker = modelPicker(
  model,
  () => run(settingsUI.open()),
  () => run(settingsUI.open(true)),
)
/** Only an open or a send in progress blocks switching. A running request keeps going in the Host (UC-003 A13). */
function switchingBlocked(): boolean {
  return opening !== undefined || (!!current && sending.has(current.sessionId))
}
const newChatButton = button('Chat mới', () => run(newChat()))
newChatButton.dataset.action = 'new-chat'
newChatButton.title = 'Chat mới'
const navigationHint = element(
  'p',
  'Yêu cầu vẫn chạy khi bạn mở chat khác; quay lại chat này để xem tiến độ.',
  'navigation-hint',
)
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
const foldRecents = () => {
  chats.hidden = compactNavigation.matches
  recents.setAttribute('aria-expanded', String(!chats.hidden))
}
foldRecents()
compactNavigation.addEventListener('change', () => {
  foldRecents()
  controls()
})
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
  if (remember)
    try {
      localStorage.setItem('deckagent-nav', collapse ? 'collapsed' : 'open')
    } catch {
      /* Optional layout preference. */
    }
}
let storedNavigation: string | null = null
try {
  storedNavigation = localStorage.getItem('deckagent-nav')
} catch {
  /* Optional layout preference. */
}
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
  if (accountMenu.dataset.side === 'above') {
    accountMenu.style.top = ''
    accountMenu.style.bottom = `${innerHeight - box.top + 8}px`
  } else {
    accountMenu.style.bottom = ''
    accountMenu.style.top = `${box.bottom + 8}px`
  }
}
function closeAccountMenu(restoreFocus = false) {
  if (accountMenu.hidden) return
  accountMenu.hidden = true
  accountTrigger.setAttribute('aria-expanded', 'false')
  if (restoreFocus) accountTrigger.focus()
}
// The menu closes on Escape and on any press outside it, like the model popover.
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeAccountMenu(true)
})
document.addEventListener('pointerdown', event => {
  if (
    !accountMenu.hidden &&
    !accountMenu.contains(event.target as Node) &&
    !accountTrigger.contains(event.target as Node)
  )
    closeAccountMenu()
})
const themeSection = element('div', undefined, 'menu-section')
themeSection.append(element('span', 'Giao diện'), themeControl(management))
accountMenu.append(
  element('p', 'Chạy trên máy của bạn', 'menu-note'),
  Object.assign(
    button('Cài đặt model', () => {
      closeAccountMenu()
      run(settingsUI.open())
    }),
    { className: 'settings-open', title: 'Cài đặt model' },
  ),
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
function showDeck() {
  deck.hidden = true
  publishedDeck.hidden = false
  openDeck.hidden = true
}
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
attachmentUI = new AttachmentDraftView({
  upload: files => run(uploadAttachments(files)),
  remove: id => run(removeAttachment(id)),
  preview: item => run(previewAttachment(item)),
})
const attachment = attachmentUI.trigger
composerControls.append(attachment)
const primaryAction = element('div', undefined, 'composer-primary')
primaryAction.append(picker.node, submit, stopRequest)
composerActions.append(composerControls, primaryAction)
form.append(unavailable, attachmentUI.node, attachmentUI.picker, input, composerActions)
input.addEventListener('input', () => {
  saveDraft()
  controls()
})
input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (!submit.disabled && (input.value.trim() || draftStates.get(current?.sessionId ?? '')?.attachments?.length))
      form.requestSubmit()
  }
})
const dock = element('div', undefined, 'composer-dock')
dock.append(outlineDock, form)
conversation.append(heading, status, welcome, messages, dock)
root.prepend(navigation, conversation, deck, publishedDeck)
initMotion(root)
// Mobile navigation wraps as history/status changes; reserve its actual height for the chat.
const navigationSize = new ResizeObserver(() =>
  root.style.setProperty('--navigation-height', `${navigation.getBoundingClientRect().height}px`),
)
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
async function submitRequest(text: string): Promise<void> {
  if (submit.disabled || !current) return
  if (!text.trim() && !draftStates.get(current.sessionId)?.attachments?.length) return
  if ([...text].length > requestLimit) {
    status.hidden = false
    status.dataset.kind = 'error'
    status.textContent = 'Yêu cầu quá dài. Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.'
    return
  }
  const id = current.sessionId,
    expected = generation
  sending.add(id)
  controls()
  status.textContent = 'Đang gửi'
  status.hidden = false
  status.dataset.kind = 'sending'
  try {
    // A refused send leaves the draft unchanged; only an accepted request empties the composer.
    if (!(await flushDraft(id))) return
    const accepted: RequestSnapshot = await enqueueDraft(id, async () => {
      const draft = draftStates.get(id)
      const accepted = await client.send({
        sessionId: id,
        input: text,
        ...(draft?.revision === undefined
          ? {}
          : { draftRevision: draft.revision, attachmentIds: draft.attachmentIds ?? [] }),
      })
      if (draft?.revision !== undefined)
        receiveDraft(
          { sessionId: id, text: '', revision: draft.revision + 1, attachmentIds: [], attachments: [] },
          true,
        )
      return accepted
    })
    if (generation === expected && current) {
      if (input.value === text) {
        input.value = ''
        drafts.set(id, '')
      }
      current = { ...current, activeRequestId: accepted.requestId }
      timeline.snapshot(accepted)
      status.hidden = true
      controls()
    }
    await Promise.all([refresh(), showHistory(id, expected), showActivities(id, expected)])
    if (generation === expected) run(follow(accepted.requestId, id, expected))
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
let checkingAttachments = false
const attachmentTimer = setInterval(() => {
  const id = current?.sessionId
  if (
    !id ||
    disposed ||
    checkingAttachments ||
    attachmentBusy.has(id) ||
    pendingDrafts.has(id) ||
    !draftStates.get(id)?.attachments?.some(item => item.state === 'preparing')
  )
    return
  checkingAttachments = true
  void management
    .draftState(id)
    .then(receiveDraft, () => {})
    .finally(() => {
      checkingAttachments = false
    })
}, 500)
window.addEventListener(
  'pagehide',
  () => {
    if (current) {
      saveDraft()
      void flushDraft(current.sessionId)
    }
    navigationSize.disconnect()
    disposed = true
    clearInterval(timer)
    clearInterval(attachmentTimer)
    closePreview()
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
  management.draftState(id).then(
    draft => {
      const text = draft.text
      if (current?.sessionId !== id || pendingDrafts.has(id)) return
      receiveDraft(draft, true)
      if (input.value === text) return
      drafts.set(id, text)
      input.value = text
      controls()
    },
    () => {
      /* The draft on screen stays; the next save reports a lost connection. */
    },
  )
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
