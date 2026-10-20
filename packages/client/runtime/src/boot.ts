import { HostClient, LayoutSlots } from './index.ts'

const root = document.querySelector<HTMLElement>('#app')!
const client = new HostClient(location.origin, new URLSearchParams(location.hash.slice(1)).get('token') ?? '')
const slots = new LayoutSlots(root)
const form = document.createElement('form')
const session = document.createElement('input')
session.name = 'session'
session.setAttribute('aria-label', 'Session ID')
session.value = sessionStorage.getItem('deckagent-session') ?? `chat-${crypto.randomUUID()}`
const input = document.createElement('textarea')
input.name = 'input'
input.setAttribute('aria-label', 'Agent request')
input.placeholder = 'Ask the Agent to create a new HTML file in the workspace.'
input.required = true
const submit = document.createElement('button')
submit.textContent = 'Send request'
const reconnect = document.createElement('button')
reconnect.type = 'button'
reconnect.textContent = 'Reconnect / read history'
form.append(session, input, submit, reconnect)
const status = document.createElement('p')
status.setAttribute('role', 'status')
status.textContent = 'Ready'
const history = document.createElement('pre')
history.setAttribute('aria-label', 'Session history')
const unmount = [slots.mount('request', form), slots.mount('status', status), slots.mount('history', history)]
let watching: AbortController | undefined
let pending = false

async function restore() {
  history.textContent = (await client.history(session.value))
    .map(message => `${message.role}: ${message.content}`)
    .join('\n\n')
}

async function follow(id: string) {
  watching?.abort()
  const control = new AbortController()
  watching = control
  try {
    for await (const snapshot of client.watch(id, control.signal)) {
      status.textContent =
        snapshot.status +
        (snapshot.result && snapshot.result.status !== 'completed' ? `: ${snapshot.result.error.code}` : '')
      if (snapshot.status !== 'running') {
        sessionStorage.removeItem('deckagent-request')
        await restore()
      }
    }
  } catch {
    if (!control.signal.aborted) status.textContent = 'Connection lost. Use reconnect to read the current state.'
  }
}

form.addEventListener('submit', event => {
  event.preventDefault()
  if (pending) return
  pending = true
  submit.disabled = true
  session.disabled = true
  const send = async () => {
    try {
      status.textContent = 'Sending'
      sessionStorage.setItem('deckagent-session', session.value)
      const accepted = await client.send({ sessionId: session.value, input: input.value })
      sessionStorage.setItem('deckagent-request', accepted.requestId)
      await follow(accepted.requestId)
    } catch {
      status.textContent = 'Request failed. Check Host configuration or reconnect.'
    } finally {
      pending = false
      submit.disabled = false
      session.disabled = false
    }
  }
  // send renders its failures and always restores controls.
  send().catch(() => {
    status.textContent = 'Browser storage is unavailable'
  })
})
reconnect.addEventListener('click', () => {
  const id = sessionStorage.getItem('deckagent-request')
  const work = id ? follow(id) : restore()
  work.catch(() => {
    status.textContent = 'Unable to restore this Session'
  })
})
const active = sessionStorage.getItem('deckagent-request')
if (active)
  follow(active).catch(() => {
    status.textContent = 'Unable to reconnect'
  })
window.addEventListener(
  'pagehide',
  () => {
    watching?.abort()
    for (const remove of unmount) remove()
  },
  { once: true },
)
