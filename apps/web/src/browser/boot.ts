import type { WebSession } from '@deckagent/host-contracts'
import {
  BriefClient,
  ChangeClient,
  ConfirmationClient,
  DeckClient,
  HostClient,
  ManagementClient,
  OutlineClient,
} from './transport/index.ts'
import { button, element } from './dom.ts'
import { modelPicker, settingsPanel } from './features/providers/index.ts'
import { DeckWorkflowView, mountDeckCanvas, mountDeckTab } from './features/deck/index.ts'
import { ConversationView } from './features/chats/index.ts'
import { failureFeedback } from './features/requests/index.ts'
import { themeControl } from './theme.ts'
import { initMotion } from './motion.ts'
import { workspaceView } from './features/workspaces/index.ts'
import { AttachmentDraftView } from './features/attachments/index.ts'
import { researchView } from './features/research/index.ts'
import { createShellDom } from './shell-dom.ts'
import { createDraftSync } from './draft-sync.ts'
import { createChatNavigation } from './chat-navigation.ts'
import { createRequestRunner, sendBlocked } from './request-runner.ts'
import { ChangeWatcher } from './change-watcher.ts'
const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
const client = new HostClient(location.origin, token)
const management = new ManagementClient(location.origin, token)
const outlines = new OutlineClient(location.origin, token)
const briefs = new BriefClient(location.origin, token)
const confirmations = new ConfirmationClient(location.origin, token)
const deckClient = new DeckClient(location.origin, token)
const changeClient = new ChangeClient(location.origin, token)
const shell = createShellDom(() => controls())
const sending = new Set<string>()
const selecting = new Set<string>()
const requestLimit = 16000
let follow: (id: string, sessionId: string, expected: number) => Promise<void> = () => Promise.resolve()
let reconnecting = false
const workflow = new DeckWorkflowView(
  briefs,
  text => {
    shell.input.value = `${shell.input.value}${shell.input.value.trim() ? '\n' : ''}${text}`
    shell.input.focus()
    draftSync.saveDraft()
    controls()
  },
  () => {
    if (shell.input.value.trim() || draftSync.getDraftState(navigation.current?.sessionId ?? '')?.attachments?.length) {
      shell.status.hidden = false
      shell.status.textContent = 'Hãy gửi câu trả lời hoặc tệp đang soạn trước khi bỏ qua các câu hỏi còn lại.'
      return
    }
    run(runner.submitRequest('Bỏ qua các câu hỏi còn lại; giữ các giới hạn nguồn đã chọn.', true))
  },
  () => controls(),
)
const timeline = new ConversationView(
  shell.messages,
  (action, proposal) => {
    if (action === 'confirm') run(runner.confirmOutline(proposal))
  },
  text => {
    workflow.requestRevision()
    if (text) {
      shell.input.value = shell.input.value.trim() ? `${shell.input.value}\n\n${text}` : text
      draftSync.saveDraft()
      controls()
    }
    shell.input.focus()
  },
  shell.outlineDock,
  {
    retry: text => {
      shell.input.value = text
      shell.input.focus()
      shell.input.setSelectionRange(text.length, text.length)
      draftSync.saveDraft()
      controls()
    },
    settings: () => run(settingsUI.open()),
    draft: () => shell.input.value,
    previewAttachment: item => run(draftSync.previewAttachment(item)),
    previewOutlineImage: (sessionId, outlineId, needId) => client.outlineImage(sessionId, outlineId, needId),
    approve: async (requestId, approvalId, decision) => {
      await client.decide(requestId, approvalId, decision)
      const saved = await client.snapshot(requestId)
      if (navigation.current?.sessionId === saved.sessionId) timeline.snapshot(saved)
    },
  },
)
mountDeckTab(shell.deck)
const deckModel = mountDeckCanvas(shell.publishedDeck, deckClient, () => {
  shell.deck.hidden = true
  shell.openDeck.hidden = true
})
const settingsUI = settingsPanel(
  management,
  () => navigation.refresh(),
  shell.root,
  () => shell.input.focus(),
)
const workspaceUI = workspaceView(management, shell.root, async (next, reloadChats) => {
  // Switching or adding keeps the open chat and its draft; only the list of earlier chats changes.
  navigation.workspaces = next
  if (reloadChats) await navigation.refresh()
  else navigation.renderChats()
  controls()
})
const researchUI = researchView(
  management,
  shell.root,
  async () => {
    await navigation.refresh()
    controls()
  },
  () => navigation.current?.sessionId,
)
const picker = modelPicker(
  shell.model,
  () => run(settingsUI.open()),
  () => run(settingsUI.open(true)),
)
const draftSync = createDraftSync({
  management,
  input: shell.input,
  status: shell.status,
  currentSessionId: () => navigation.current?.sessionId,
  changed: () => controls(),
  refresh: () => navigation.refresh(),
})
let sessionWatcher: ChangeWatcher | undefined
let watchedSessionId: string | undefined

function openSessionChanges(sessionId: string): void {
  sessionWatcher?.close()
  watchedSessionId = sessionId
  const watcher = new ChangeWatcher({
    client: { watch: signal => changeClient.watchSession(sessionId, signal) },
    onNotice: notice => {
      if (watchedSessionId !== sessionId || notice.key !== sessionId || notice.topic !== 'draft') return
      return draftSync.onDraftNotice(sessionId, notice.version)
    },
  })
  sessionWatcher = watcher
  watcher.start()
}
// The chat list has no version in its reply, so the last chats notice that this tab handled is kept here.
let chatsVersion = -1
const changeWatcher = new ChangeWatcher({
  client: changeClient,
  onNotice: async notice => {
    if (notice.key !== 'host') return
    if (notice.topic === 'chats') {
      if (notice.version <= chatsVersion) return
      await navigation.refresh()
      chatsVersion = notice.version
      controls()
      return
    }
    if (notice.topic === 'providers') {
      if (notice.version <= navigation.settings.providersVersion) return
      await navigation.refresh()
      controls()
      return
    }
    if (notice.topic !== 'workspaces') return
    if (notice.version <= navigation.workspaces.version) return
    const next = await management.workspaces()
    if (next.version < navigation.workspaces.version) return
    navigation.workspaces = next
    workspaceUI.update(next)
    navigation.renderChats()
    controls()
  },
})
const navigation = createChatNavigation({
  shell,
  client,
  management,
  outlines,
  settingsUI,
  picker,
  timeline,
  workflow,
  deckModel,
  workspaceUI,
  draftSync,
  sending,
  run,
  changed: () => controls(),
  onSessionOpen: openSessionChanges,
  follow: (id, sessionId, expected) => follow(id, sessionId, expected),
})
const runner = createRequestRunner({
  shell,
  client,
  management,
  confirmations,
  deckModel,
  timeline,
  workflow,
  research: researchUI,
  draftSync,
  navigation,
  sending,
  run,
  changed: () => controls(),
  requestLimit,
})
follow = (id, sessionId, expected) => runner.follow(id, sessionId, expected)
const attachmentUI = new AttachmentDraftView({
  upload: files => run(draftSync.uploadAttachments(files)),
  remove: id => run(draftSync.removeAttachment(id)),
  preview: item => run(draftSync.previewAttachment(item)),
})
shell.navigation.insertBefore(workspaceUI.node, shell.newChatButton)
shell.conversation.insertBefore(workflow.node, shell.welcome)
shell.composerControls.append(attachmentUI.trigger, researchUI.control, researchUI.sources)
shell.primaryAction.prepend(picker.node)
shell.form.insertBefore(attachmentUI.node, shell.input)
shell.form.insertBefore(attachmentUI.picker, shell.input)
const settingsButton = button('Cài đặt model', () => {
  shell.closeAccountMenu()
  run(settingsUI.open())
})
settingsButton.className = 'settings-open'
settingsButton.title = 'Cài đặt model'
const themeSection = element('div', undefined, 'menu-section')
themeSection.append(element('span', 'Giao diện'), themeControl(management))
shell.accountMenu.append(
  element('p', 'Chạy trên máy của bạn', 'menu-note'),
  settingsButton,
  themeSection,
  researchUI.settings,
  shell.reconnect,
)
initMotion(shell.root)

function run(work: Promise<void>) {
  work.catch(error => {
    shell.status.hidden = false
    shell.status.dataset.kind = 'error'
    const code = error instanceof Error ? error.message : ''
    const feedback = failureFeedback(code)
    shell.status.textContent = `${feedback.label}. ${feedback.detail}`
    shell.status.title = feedback.code ? `Mã lỗi: ${feedback.code}` : ''
  })
}

function controls() {
  const current = navigation.current
  const activeId = current?.activeRequestId
  shell.stopRequest.hidden = !activeId
  shell.stopRequest.disabled = !!activeId && runner.stopping.has(activeId)
  shell.submit.hidden = !!activeId
  for (const item of shell.chats.querySelectorAll('button'))
    item.disabled = navigation.switchingBlocked() || navigation.creating
  shell.newChatButton.disabled = navigation.switchingBlocked() || navigation.creating
  shell.model.disabled =
    !current || selecting.has(current.sessionId) || navigation.opening !== undefined || navigation.creating
  workspaceUI.setBusy(navigation.opening !== undefined || navigation.creating)
  // A chat without a selectable model keeps its draft and says why it cannot send (FR-046).
  const blocked = sendBlocked(current, navigation.settings)
  const draft = current ? draftSync.getDraftState(current.sessionId) : undefined
  const busy = !!current && draftSync.isAttachmentBusy(current.sessionId)
  const invalidAttachments = draft?.attachments?.some(item => item.state !== 'ready') ?? false
  attachmentUI.render(draft, busy)
  shell.unavailable.hidden = !blocked || !!activeId
  if (blocked && shell.unavailable.textContent !== blocked) shell.unavailable.textContent = blocked
  shell.submit.disabled =
    !!blocked ||
    !current ||
    navigation.creating ||
    reconnecting ||
    navigation.opening !== undefined ||
    sending.has(current.sessionId) ||
    selecting.has(current.sessionId) ||
    busy ||
    invalidAttachments ||
    !!activeId
  shell.submit.setAttribute(
    'aria-disabled',
    String(
      shell.submit.disabled ||
        (!shell.input.value.trim() && !draft?.attachments?.length) ||
        [...shell.input.value].length > requestLimit,
    ),
  )
  timeline.setOutlineBusy(!!activeId || (!!current && sending.has(current.sessionId)))
  workflow.update(
    navigation.outlineState?.proposals.find(p => p.outlineId === navigation.outlineState?.currentId),
    !!activeId ||
      navigation.opening !== undefined ||
      navigation.creating ||
      (!!current && sending.has(current.sessionId)),
  )
  workflow.setResearchAvailable(navigation.settings.research?.configured === true)
  researchUI.update(navigation.settings, !!activeId)
  researchUI.control.hidden = workflow.preparingDeck
  updatePresentation(current, activeId)
  shell.fitInput()
}

function updatePresentation(current: WebSession | undefined, activeId: string | undefined): void {
  const welcomeHeading = workflow.preparingDeck ? 'Hãy mô tả deck bạn muốn' : 'Bạn muốn trao đổi điều gì?'
  const welcomeText = workflow.preparingDeck
    ? 'Dán ghi chú hoặc ý tưởng của bạn. DeckAgent đề xuất Outline và Brief trước; chỉ tạo slide sau khi bạn xác nhận.'
    : 'Gửi tin nhắn hoặc thêm tài liệu. Chọn Tạo deck ở trên khi bạn muốn làm bài trình bày.'
  if (shell.welcomeTitle.textContent !== welcomeHeading) shell.welcomeTitle.textContent = welcomeHeading
  if (shell.welcomeDetail.textContent !== welcomeText) shell.welcomeDetail.textContent = welcomeText
  shell.input.placeholder = workflow.inputHint
  picker.update(navigation.settings, !!activeId)
  shell.title.textContent = shell.title.title = navigation.chatTitle
  const active = !!activeId || (!!current && sending.has(current.sessionId))
  shell.headerState.textContent = activeId ? 'Đang làm việc' : active ? 'Đang gửi…' : ''
  shell.headerState.dataset.waiting = 'false'
  shell.navigationHint.hidden = !activeId || shell.chats.hidden
  shell.welcome.hidden = navigation.historyPresent || active || !current || navigation.opening !== undefined
  shell.messages.hidden = !shell.welcome.hidden
  shell.openDeck.hidden =
    (!navigation.outlineState?.confirmedId &&
      !(deckModel.state.snapshot?.sessionId === current?.sessionId && deckModel.state.snapshot?.outlineId)) ||
    !shell.publishedDeck.hidden
  const pendingGeneration =
    deckModel.state.snapshot?.sessionId === current?.sessionId ? deckModel.state.snapshot?.generation : undefined
  shell.retryGeneration.hidden = !pendingGeneration || !['pending', 'incomplete'].includes(pendingGeneration.state)
  shell.retryGeneration.textContent =
    pendingGeneration?.state === 'incomplete' ? 'Tiếp tục tạo deck' : 'Thử bắt đầu tạo deck'
  shell.retryGeneration.disabled = !!activeId || (!!current && sending.has(current.sessionId))
}

shell.model.addEventListener('change', () => {
  if (shell.model.value === '__settings') {
    const current = navigation.current
    shell.model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
    run(settingsUI.open())
    return
  }
  const current = navigation.current
  if (!shell.model.value || !current) return
  const id = current.sessionId
  selecting.add(id)
  shell.model.disabled = true
  controls()
  run(
    (async () => {
      try {
        const value: unknown = JSON.parse(shell.model.value)
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
        await navigation.refresh()
        if (navigation.current?.sessionId === id) shell.status.hidden = true
      } finally {
        selecting.delete(id)
        shell.model.disabled = false
        controls()
      }
    })(),
  )
})
shell.form.addEventListener('submit', event => {
  event.preventDefault()
  run(runner.submitRequest(shell.input.value))
})
shell.stopRequest.addEventListener('click', () => runner.stopActiveRequest())
shell.newChatButton.addEventListener('click', () => run(navigation.newChat()))
shell.retryGeneration.addEventListener('click', () => {
  const saved = deckModel.state.snapshot?.generation
  const current = navigation.current
  if (saved?.state === 'pending' && current?.sessionId === saved.receipt.sessionId)
    run(runner.confirmTarget(saved.receipt))
  else if (saved?.state === 'incomplete' && current?.sessionId === saved.receipt.sessionId)
    run(
      runner.submitRequest(
        shell.input.value.trim() ? shell.input.value : 'Tiếp tục hoàn thành các slide còn thiếu.',
        false,
        true,
      ),
    )
})
shell.reconnect.addEventListener('click', () => {
  shell.closeAccountMenu()
  if (reconnecting) return
  reconnecting = true
  controls()
  const expected = navigation.generation
  run(
    (async () => {
      try {
        await navigation.refresh()
        const current = navigation.current
        if (current && navigation.generation === expected) await navigation.open(current)
      } finally {
        reconnecting = false
        controls()
      }
    })(),
  )
})
shell.input.addEventListener('input', () => {
  draftSync.saveDraft()
  controls()
})
shell.input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (
      !shell.submit.disabled &&
      (shell.input.value.trim() || draftSync.getDraftState(navigation.current?.sessionId ?? '')?.attachments?.length)
    )
      shell.form.requestSubmit()
  }
})
window.addEventListener(
  'pagehide',
  () => {
    const current = navigation.current
    if (current) {
      draftSync.saveDraft()
      void draftSync.flushDraft(current.sessionId)
    }
    shell.dispose()
    runner.dispose()
    draftSync.dispose()
    navigation.dispose()
    deckModel.close()
    changeWatcher.close()
    sessionWatcher?.close()
  },
  { once: true },
)
window.addEventListener('pageshow', event => {
  if (event.persisted) location.reload()
})
run(
  navigation.start().then(() => {
    changeWatcher.start()
  }),
)
