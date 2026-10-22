import type { AgentRequest, HistoryMessage, WebSession, WebSettings } from '@deckagent/host-api'
import type { OutlineSnapshot } from '@deckagent/deck'
import { HostClient } from './host-client.ts'
import { ManagementClient } from './management-client.ts'
import { button, element, field } from './dom.ts'
import { settingsPanel } from './settings-panel.ts'
import { mountDeckTab } from './deck-tab.ts'
import { ConversationView } from './conversation-view.ts'
import { DeckClient } from './deck-client.ts'
import { mountDeckCanvas } from './deck-canvas.ts'
import { OutlineClient } from './outline-client.ts'

const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
const client = new HostClient(location.origin, token)
const management = new ManagementClient(location.origin, token)
const outlines = new OutlineClient(location.origin, token)
let outlineState: OutlineSnapshot | undefined
const root = document.querySelector<HTMLElement>('#app')!
const navigation = element('aside', undefined, 'chat-navigation')
const chats = element('nav')
chats.setAttribute('aria-label', 'Chat history')
const conversation = element('section', undefined, 'conversation')
const heading = element('header', undefined, 'conversation-header')
const title = element('h1', 'Your next idea starts here')
const headerState = element('small', '', 'chat-state')
headerState.setAttribute('aria-live', 'polite')
const welcome = element('section', undefined, 'welcome')
welcome.hidden = true
welcome.append(element('h2', 'Your next presentation starts here'),
  element('p', 'Describe your topic and audience below. Choose a model, then send a message or create a presentation.'))
const model = element('select')
model.disabled = true
model.setAttribute('aria-label', 'Selected model')
const status = element('p', '', 'request-status')
status.setAttribute('role', 'status')
status.hidden = true
const messages = element('div', undefined, 'messages')
messages.setAttribute('aria-label', 'Conversation')
const timeline = new ConversationView(messages, (type, proposal) => {
  run(submitRequest(type === 'confirm' ? 'Confirm outline' : 'Cancel outline', {
    outlineAction: { type, outlineId: proposal.outlineId, version: proposal.version },
  }))
}, () => {
  if (!input.value) input.value = 'Revise outline: '
  input.focus()
  input.setSelectionRange(input.value.length, input.value.length)
})
const form = element('form', undefined, 'composer')
form.dataset.slot = 'request'
const input = element('textarea')
input.name = 'input'
input.required = true
input.placeholder = 'What would you like to work on?'
input.setAttribute('aria-label', 'Agent request')
const submit = element('button', '↑', 'send-action')
submit.setAttribute('aria-label', 'Send request')
submit.title = 'Send request'
submit.type = 'submit'
submit.disabled = true
const createPresentation = button('Create presentation', () => {
  if (input.reportValidity()) run(submitRequest(input.value, { presentation: true }))
})
createPresentation.disabled = true
const stopRequest = button('■', () => {
  if (current?.activeRequestId) run(client.stop(current.activeRequestId).then(() => {}))
})
stopRequest.className = 'stop-action'
stopRequest.setAttribute('aria-label', 'Stop')
stopRequest.title = 'Stop request'
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
let polling = false
let disposed = false
let reconnecting = false
let opening: number | undefined
let historyPresent = false
let chatTitle = 'New chat'

function describeHistory(history: readonly HistoryMessage[]) {
  historyPresent = history.length > 0
  const first = history.find(message => message.role === 'user')?.content.replace(/\s+/g, ' ').trim()
  chatTitle = first ? (first.length > 64 ? `${first.slice(0, 64)}…` : first) : 'New chat'
}

function fitInput() {
  input.style.height = 'auto'
  input.style.height = `${Math.min(150, Math.max(58, input.scrollHeight))}px`
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
    status.textContent =
      code === 'PROVIDER_CREDENTIALS'
        ? 'Set a valid API key for this provider in Models & settings.'
        : code === 'MODEL_NOT_SELECTABLE'
          ? 'This model is no longer available. Choose another model.'
          : code === 'AUTH_REQUIRED'
            ? 'This connection expired. Reopen the browser from the running Host.'
              : code === 'OUTLINE_STALE'
                ? 'The outline changed. Review the current proposal before confirming.'
                : code === 'OUTLINE_ALREADY_CONFIRMED'
                  ? 'This outline is already confirmed. Read the saved deck; confirmation was not replayed.'
                  : 'Unable to complete this action. Check your connection or reopen Settings.'
  })
}
function controls() {
  stopRequest.hidden = !current?.activeRequestId
  submit.hidden = !!current?.activeRequestId
  for (const item of chats.querySelectorAll('button')) item.disabled = switchingBlocked()
  newChatButton.disabled = switchingBlocked()
  model.disabled = !current || selecting.has(current.sessionId)
  submit.disabled =
    !current ||
    reconnecting ||
    opening !== undefined ||
    sending.has(current.sessionId) ||
    selecting.has(current.sessionId) ||
    !!current.activeRequestId ||
    !current.selectable
  createPresentation.disabled = submit.disabled
  createPresentation.hidden = !!outlineState?.active || !!deckModel.state.snapshot?.outlineId
  timeline.setOutlineBusy(submit.disabled)
  title.textContent = chatTitle
  title.title = chatTitle
  const active = !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
  headerState.textContent = current?.activeRequestId ? 'Working' : active ? 'Sending…'
    : outlineState?.currentId ? 'Waiting for outline confirmation' : current?.selectable ? 'Ready' : 'Choose a model'
  welcome.hidden = historyPresent || active || !current || opening !== undefined
  messages.hidden = !welcome.hidden
  openDeck.hidden = !outlineState?.confirmedId && !(deckModel.state.snapshot?.sessionId === current?.sessionId && deckModel.state.snapshot?.outlineId)
  fitInput()
  if (!current?.selectable && !current?.activeRequestId) {
    status.hidden = false
    status.dataset.kind = 'setup'
    status.textContent = current?.selection
      ? `Model unavailable: ${current.selection.model}. Choose another model.`
      : 'Choose a model to send a request. You can add one in Settings.'
  } else if (status.dataset.kind === 'setup') {
    status.hidden = true
  }
}
function renderModels() {
  model.replaceChildren(new Option('Choose a model', ''))
  for (const provider of settings.providers) {
    const group = element('optgroup')
    group.label = provider.displayName
    for (const id of provider.models) group.append(new Option(id, JSON.stringify({ provider: provider.id, model: id })))
    model.append(group)
  }
  model.value = current?.selectable && current.selection ? JSON.stringify(current.selection) : ''
  controls()
}
function renderChats() {
  chats.replaceChildren()
  for (const session of sessions) {
    const item = button(`${session.selection?.model ?? 'New chat'} · ${session.messageCount} messages`, () =>
      run(open(session)),
    )
    item.title = session.sessionId
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
  // Read everything before replacing current state. A failed open leaves the old chat intact.
  const previousGeneration = generation
  const loaded = await Promise.all([client.history(session.sessionId), management.activities(session.sessionId),
    management.requests(session.sessionId), outlines.snapshot(session.sessionId)])
  if (generation !== previousGeneration || (switching && switchingBlocked())) return
  if (current) drafts.set(current.sessionId, input.value)
  input.value = drafts.get(session.sessionId) ?? ''
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
  if (switchingBlocked()) return
  const created = await management.create()
  await refresh()
  await open(created)
}
const settingsUI = settingsPanel(management, refresh)
function switchingBlocked(): boolean {
  return opening !== undefined || !!current?.activeRequestId || (!!current && sending.has(current.sessionId))
}
const newChatButton = button('New chat', () => run(newChat()))
const developerTools = element('details', undefined, 'developer-tools')
developerTools.append(element('summary', 'Developer tools'), button('Open sample deck', () => {
  publishedDeck.hidden = true
  deck.hidden = false
}))
navigation.append(
  element('div', 'DeckAgent', 'wordmark'),
  newChatButton,
  element('h2', 'History'),
  chats,
  button('Models & settings', () => run(settingsUI.open())),
  developerTools,
)
const headingText = element('div', undefined, 'chat-heading')
headingText.append(title, headerState)
const openDeck = button('Open deck', () => { deck.hidden = true; publishedDeck.hidden = false })
openDeck.hidden = true
const headingActions = element('div', undefined, 'chat-heading-actions')
const moreActions = element('details', undefined, 'chat-more-actions')
const moreSummary = element('summary', '⋯')
moreSummary.setAttribute('aria-label', 'More chat actions')
moreSummary.title = 'More chat actions'
moreActions.append(moreSummary)
headingActions.append(openDeck, moreActions)
heading.append(headingText, headingActions)
const reconnect = button('Reconnect / read history', () => {
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
const modelField = field('Model for next request', model)
modelField.className = 'composer-model'
composerControls.append(modelField, createPresentation)
const primaryAction = element('div', undefined, 'composer-primary')
primaryAction.append(submit, stopRequest)
composerActions.append(composerControls, primaryAction)
form.append(input, composerActions)
input.addEventListener('input', fitInput)
conversation.append(heading, status, welcome, messages, form)
root.replaceChildren(navigation, conversation, deck, publishedDeck)
model.addEventListener('change', () => {
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
  const id = current.sessionId,
    expected = generation
  const target = outlineState?.proposals.find(p => p.status === 'current')
  sending.add(id)
  controls()
  status.textContent = 'Sending'
  status.hidden = false
  status.dataset.kind = 'sending'
  try {
    const accepted = await client.send({ sessionId: id, input: text,
      ...(target && !extra.outlineAction ? { outlineTarget: { outlineId: target.outlineId, version: target.version } } : {}),
      ...extra })
    if (generation === expected && current) {
      if (!extra.outlineAction) input.value = ''
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
