import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
async function eventually(operation, message, { retries = 200, intervalMs = 50 } = {}) {
  for (let i = 0; i < retries; i++) {
    const value = await operation()
    if (value) return value
    await delay(intervalMs)
  }
  throw new Error(message)
}

async function waitForBrowserPort(profile, browser) {
  return eventually(async () => {
    if (browser.exitCode !== null) throw new Error(`Browser exited before startup (exit ${browser.exitCode})`)
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0] } catch { return undefined }
  }, 'Browser did not start', { retries: 600 })
}

async function browserPath() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      /* Try another installed browser. */
    }
  }
  throw new Error('Chrome/Edge required; set CHROME_BIN to its executable')
}

async function resizeDeck(protocol, evaluate, selector, width, { releaseOnly = false } = {}) {
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`)
  const start = await evaluate(`(() => {
    const panel = document.querySelector(${JSON.stringify(selector)});
    const divider = panel.querySelector('[role=separator]').getBoundingClientRect();
    return { x: divider.x + divider.width / 2, y: divider.y + 80, width: panel.getBoundingClientRect().width };
  })()`)
  const end = start.x + start.width - width
  await protocol.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: start.x, y: start.y })
  if (releaseOnly) {
    // Register before pointerdown installs the resizer's window listener. Move the native mouse
    // normally, but omit that DOM move from the resizer; teleporting CDP mouseReleased across
    // an out-of-process iframe can lose pointerup before it reaches the page.
    await evaluate(`window.addEventListener('pointermove', event => event.stopImmediatePropagation(), {capture: true, once: true})`)
  }
  await protocol.call('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', buttons: 1, clickCount: 1 })
  assert.equal(await evaluate(`document.querySelector('.deck-resize-overlay') !== null`), true, `Divider must capture drag at ${JSON.stringify(start)}`)
  await evaluate(`new Promise(resolve=>requestAnimationFrame(resolve))`)
  assert.equal(await evaluate(`document.elementFromPoint(Math.max(1,Math.min(${end},innerWidth-1)),${start.y})?.classList.contains('deck-resize-overlay')`), true, 'Overlay must cover slide iframe hit targets')
  await protocol.call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end, y: start.y, button: 'left', buttons: 1 })
  await evaluate(`new Promise(resolve=>requestAnimationFrame(resolve))`)
  if (releaseOnly) {
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().width`), start.width, 'Omitted move must not resize before pointerup')
  }
  await protocol.call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end, y: start.y, button: 'left', buttons: 0, clickCount: 1 })
  await eventually(() => evaluate(`document.querySelector('.deck-resize-overlay') === null`), `Resize overlay must be removed after dragging (${JSON.stringify({ start, end, releaseOnly })})`)
  assert.equal(await evaluate(`document.body.classList.contains('deck-resizing')`), false, 'Dragging must restore the cursor and iframe interaction')
}

async function connect(url) {
  const socket = new WebSocket(url)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let next = 0
  const pending = new Map()
  socket.addEventListener('message', event => {
    const response = JSON.parse(String(event.data))
    const waiter = pending.get(response.id)
    if (!waiter) return
    pending.delete(response.id)
    clearTimeout(waiter.timeout)
    if (response.error) waiter.reject(new Error('Browser protocol failed'))
    else waiter.resolve(response.result)
  })
  socket.addEventListener('close', () => {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timeout)
      waiter.reject(new Error('Browser closed'))
    }
    pending.clear()
  })
  return {
    call(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        const id = ++next
        const timeout = setTimeout(() => {
          pending.delete(id)
          reject(new Error('Browser command timed out'))
        }, 10000)
        pending.set(id, { resolve, reject, timeout })
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      })
    },
    close: () => socket.close(),
  }
}


async function openBrowser(dir, width = 1600, height = 1000) {
  const profile = join(dir, 'chrome')
  const browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  const protocol = await connect(target.webSocketDebuggerUrl)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(`Browser script failed: ${JSON.stringify(result.exceptionDetails)}`)
    return result.result.value
  }
  return { browser, protocol, evaluate }
}

async function closeBrowser(session) {
  if (!session) return
  await session.protocol.call('Browser.close').catch(() => {})
  session.protocol.close()
  if (session.browser.exitCode === null) session.browser.kill()
}

// A provider bootstrapped from configuration makes a model selectable without any request being sent.
const fixtureProvider = model => ({
  selection: { provider: 'fixture', model },
  connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:1' }],
})

async function requestCount(app, sessionId) {
  return (await (await fetch(`${app.origin}/api/sessions/${sessionId}/requests`, { headers: { authorization: `Bearer ${app.token}` } })).json()).length
}

// B02: requests run through the OpenCode CLI; the fake CLI fixture stands in for it (never live-model evidence).
const fakeOpenCode = dir => ({ executable: process.execPath, launcherArgs: [fileURLToPath(new URL('./fixtures/fake-opencode.mjs', import.meta.url)), join(dir, 'opencode.log')],
  version: 'fake-1.0.0' })

async function modelsEndpoint() {
  const server = createServer((req, res) => {
    if (req.url === '/v1/models') res.writeHead(200, { 'content-type': 'application/json' }).end('{"data":[{"id":"wizard-model"}]}')
    else res.writeHead(404).end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { baseUrl: `http://127.0.0.1:${server.address().port}/v1`, close: () => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }) }
}

test('interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat', { timeout: 60000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-interactive-'))
  let app, session
  const endpoint = await modelsEndpoint()
  t.after(async () => {
    await closeBrowser(session)
    await app?.close()
    await endpoint.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({ dataDir: join(dir, 'data'), ...fixtureProvider('interactive'), openCode: fakeOpenCode(dir) })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])')`), 'Welcome missing')
  const send = `document.querySelector('.composer [aria-label="Gửi yêu cầu"]')`
  const note = `document.querySelector('.requests-unavailable')`
  // FR-046: no selected model, no Send, and the composer says why.
  await eventually(() => evaluate(`${note}.checkVisibility() && ${note}.textContent.includes('chưa chọn model')`), 'No reason shown for a chat without a model')
  assert.equal(await evaluate(`${send}.disabled`), true)
  assert.equal(await evaluate(`!!document.querySelector('[aria-label="Chọn model"]')`), true, 'The composer must offer the provider/model popover')
  await eventually(() => evaluate(`document.querySelector('[aria-label="Chọn model"]')?.disabled === false`), 'Chat not ready for model selection')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.model-options button')`), 'Model popover empty')
  await evaluate(`document.querySelector('.model-options button').click(); true`)
  await eventually(() => evaluate(`!document.querySelector('.composer select').disabled && document.querySelector('.composer select').value !== ''`), 'Selection not saved')
  const chatId = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  assert.equal(await requestCount(app, chatId), 0, 'Selecting a model must not start work')
  await eventually(() => evaluate(`!${send}.disabled && !${note}.checkVisibility()`), 'Send not offered after choosing a model')
  // Send with Enter: the reply, its activity and the finished state appear.
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Xin chào'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))} true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.message.assistant')].some(n=>n.textContent.includes('Echo 1: Xin chào'))`), 'Reply not shown')
  await eventually(() => evaluate(`document.querySelector('.request-record[data-status=completed] .request-state')?.textContent.startsWith('Đã xong')`), 'Completed state not shown')
  assert.equal(await evaluate(`document.querySelector('.activity-detail summary').textContent`), 'Phản hồi model · hoàn tất')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), '', 'An accepted request empties the composer')
  assert.equal(await requestCount(app, chatId), 1)
  // A request that hangs: live text shows, a reload does not stop it, Stop does at once.
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Wait [hang]'; ta.dispatchEvent(new Event('input')); document.querySelector('.composer').requestSubmit()} true`)
  await eventually(() => evaluate(`document.querySelector('.request-live-reply')?.textContent === 'Partial answer before Stop'`), 'Live reply not shown')
  assert.equal(await evaluate(`document.querySelector('.stop-action').checkVisibility() && document.querySelector('.send-action').hidden`), true)
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Next draft while running'; ta.dispatchEvent(new Event('input'))} true`)
  await delay(400)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.stop-action')?.checkVisibility() === true`), 'Reload lost the running request')
  await eventually(() => evaluate(`document.querySelector('.request-live-reply')?.textContent === 'Partial answer before Stop'`), 'Reload lost the live reply')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Next draft while running', 'The draft survives the reload')
  // Going to another chat stops nothing (UC-003 A13); coming back shows the request still running.
  await evaluate(`document.querySelector('[data-action=new-chat]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]')?.dataset.sessionId !== ${JSON.stringify(chatId)}`),
    'Another chat could not be opened while a request runs')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${chatId}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.stop-action')?.checkVisibility() === true && document.querySelector('.composer textarea').value === 'Next draft while running'`),
    'Returning lost the running request or its draft')
  await evaluate(`document.querySelector('.stop-action').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.request-record[data-status=stopped] .request-state')?.textContent === 'Đã dừng'`), 'Stop not shown')
  await eventually(() => evaluate(`[...document.querySelectorAll('.message.assistant[data-interrupted=true]')].some(n=>n.textContent.includes('Partial answer before Stop'))`), 'Finished text not kept after Stop')
  await eventually(() => evaluate(`!${send}.hidden && !${send}.disabled`), 'Send not offered again after Stop')
  assert.equal(await requestCount(app, chatId), 2)
  // FR-079: the runtime summarized the conversation; the boundary sits right above the request's own message and
  // every earlier message stays readable.
  const boundary = `(()=>{const b=document.querySelector('.summary-boundary');const next=b?.nextElementSibling;return !!b&&b.checkVisibility()&&b.textContent.includes('đã được tóm tắt')&&next?.matches('.message.user')&&next.textContent.includes('Dài [overflow]')&&[...document.querySelectorAll('.message.user')].some(n=>n.textContent.includes('Xin chào'))})()`
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Dài [overflow]'; ta.dispatchEvent(new Event('input')); document.querySelector('.composer').requestSubmit()} true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.message.assistant')].some(n=>n.textContent.includes('Echo 1: Dài [overflow]'))`), 'Reply after the summary not shown')
  await eventually(() => evaluate(boundary), 'Summary boundary not shown above the request')
  assert.equal(await evaluate(`document.body.textContent.includes('SUMMARY-TEXT-FOR-THE-MODEL')`), false, 'The summary the model reads is not shown as a reply')
  await evaluate(`{const draftInput=document.querySelector('.composer textarea'); draftInput.value='Draft before reload';draftInput.dispatchEvent(new Event('input'))} true`)
  await delay(400)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Draft before reload'`), 'Reload lost the draft')
  await eventually(() => evaluate(boundary), 'Summary boundary lost after reload')
  assert.equal(await evaluate(`document.querySelector('.composer select').value.includes('interactive')`), true, 'The chat keeps its selected model')
  await evaluate(`document.querySelector('.nav-toggle').click(); true`)
  assert.equal(await evaluate(`document.querySelector('#app').dataset.nav`), 'collapsed', 'The toggle hides the chat list to a rail')
  await eventually(() => evaluate(`Math.round(document.querySelector('.chat-navigation').getBoundingClientRect().width) === 64`), 'Collapsed list is a narrow rail (after its short width transition)')
  await evaluate(`document.querySelector('.nav-toggle').click(); true`)
  assert.equal(await evaluate(`document.querySelector('#app').dataset.nav === undefined && document.querySelector('.chat-navigation nav').checkVisibility()`), true, 'The toggle restores the chat list')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('.model-manage').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').open`), 'Settings missing')
  assert.equal(await evaluate(`document.querySelector('dialog').matches(':modal')`), true, 'Settings is a popup over the chat')
  await evaluate(`document.querySelector('[aria-label="Display name"]').value='Unsaved';document.querySelector('[aria-label="Display name"]').dispatchEvent(new Event('input',{bubbles:true}));window.confirm=()=>false;document.querySelector('.settings-back').click();true`)
  assert.equal(await evaluate(`document.querySelector('dialog').open`), true, 'Declining discard must keep Settings open')
  await evaluate(`window.confirm=()=>true;document.querySelector('.settings-back').click();true`)
  await eventually(() => evaluate(`!document.querySelector('dialog').open`), 'Settings did not close after discard')
  // The quick wizard: a provider that does not answer is refused with a reason; one that answers is saved.
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('[aria-label="Thêm provider"]').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').matches(':modal')`), 'Quick provider wizard did not open')
  await evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Tiếp tục →').click();document.querySelector('[aria-label="Provider ID"]').value='wizard-api';document.querySelector('[aria-label="Display name"]').value='Wizard API';document.querySelector('[aria-label="Base URL"]').value='http://127.0.0.1:1/v1';document.querySelector('dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.settings-body [role=status]').textContent.includes('không trả lời')`), 'A silent provider was not refused with a reason')
  assert.equal(await evaluate(`document.querySelector('.settings-header h2').textContent.includes('2/3')`), true, 'A failed check does not advance')
  await evaluate(`document.querySelector('[aria-label="Base URL"]').value=${JSON.stringify(endpoint.baseUrl)};document.querySelector('dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.settings-header h2').textContent.includes('3/3')`), 'Wizard did not save the connection and advance')
  await evaluate(`document.querySelector('[aria-label="Thêm bằng model ID"]').value='wizard-model';document.querySelector('.manual-model-row button').click();document.querySelector('dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.composer select').textContent.includes('wizard-model')`), 'Wizard did not save model IDs')
  await evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Xong').click();true`)
  await eventually(() => evaluate(`!document.querySelector('dialog').open`), 'Wizard did not return to chat')
  assert.equal(await evaluate(`document.querySelector('.composer select').value.includes('interactive')`), true, 'Adding a provider must not change the selected model')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Draft before reload', 'Settings keeps the draft')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`)
  assert.equal(await evaluate(`document.querySelector('.conversation').getBoundingClientRect().width >= 360`), true, 'Mobile chat must wrap below the rail with usable width')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();true`)
  assert.equal(await evaluate(`(() => {const panel=document.querySelector('.model-popover');const box=panel.getBoundingClientRect();return panel.checkVisibility()&&box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight;})()`), true, 'Model popover must remain visible inside mobile viewport')
  assert.equal(await requestCount(app, chatId), 3, 'Reload, Settings and the model popover start no work')
})

test('Deck Canvas renders saved revisions, keeps selection and restores content after Host restart', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-canvas-browser-'))
  let app, session
  t.after(async () => {
    try {
      await closeBrowser(session)
      await app?.close()
    } finally { await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) }
  })
  // Seeded state stands in for decks that a later build publishes through the Agent runtime.
  const database = join(dir, 'data', 'db')
  const chats = new SqliteSessionStore(join(database, 'sessions.sqlite'))
  for (const [id, text] of [['browser-deck', 'Publish slide 1 first'], ['large-deck', 'A long deck']]) {
    await chats.bind(id, { provider: 'fixture', model: 'canvas' })
    await chats.append(id, [{ role: 'user', content: text }, { role: 'assistant', content: `Saved ${id}` }])
  }
  chats.close()
  const decks = new DeckService(join(database, 'decks.sqlite'))
  decks.confirm('browser-deck', { outlineId: 'confirmed', slides: [{ slideId: 'intro', title: 'Introduction' }, { slideId: 'second', title: 'Second' }, { slideId: 'draft', title: 'Unpublished' }] })
  decks.confirm('large-deck', { outlineId: 'large', slides: Array.from({ length: 60 }, (_, index) => ({ slideId: `slide-${index}`, title: `Long deck slide ${index + 1}` })) })
  for (const slideId of ['intro', 'second'])
    decks.publish('browser-deck', { outlineId: 'confirmed', slideId, expectedRevision: 0, publicationId: `publish-${slideId}`,
      html: `<style>body{background:#eef4dd}h1{color:rgb(0, 100, 0)}</style><h1>${slideId} published</h1>` })
  decks.close()
  const options = { dataDir: join(dir, 'data'), ...fixtureProvider('canvas') }
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb(options)
  const navigate = async () => {
    await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [data-session-id="browser-deck"]'))`), 'Fixture Session missing')
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [aria-current=true]'))`), 'Initial chat did not finish opening')
    await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
    await eventually(() => evaluate(`!!document.querySelector('.published-deck-sidebar .deck-slide-list [title*="Unpublished"]')`), 'Deck plan missing')
  }
  await navigate()
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] small').textContent`), 'Có slide', 'The chat list says the chat has slides')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').srcdoc.includes('intro published')`), 'Saved content missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-progress').textContent`), '2/3 slide đã lưu')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-placeholder').hidden`), true)
  assert.equal(await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(button=>button.textContent==='Trước').disabled`), true, 'Previous must be disabled at the first slide')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').getBoundingClientRect().top >= document.querySelector('.deck-stage').getBoundingClientRect().bottom`), true, 'The slide filmstrip must sit under the canvas')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').getAttribute('sandbox')`), '')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').contentDocument === null`), true)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [aria-current=true]').getAttribute('aria-label')`), '1. Introduction · Bản 1')
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Sau').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').srcdoc.includes('second published')`), 'Slide navigation failed')
  await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [data-status=pending]').click(); true`)
  assert.equal(await evaluate(`!document.querySelector('.published-deck-sidebar .deck-placeholder').hidden && document.querySelector('.published-deck-sidebar .deck-stage iframe').hidden`), true, 'Selecting pending must show a placeholder without old HTML')
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(button=>button.textContent==='Trước').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').srcdoc.includes('second published')`), 'Returning from pending lost the saved slide')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="large-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').children.length === 60`), 'Large deck did not load')
  assert.equal(await evaluate(`(() => { const strip=document.querySelector('.published-deck-sidebar .deck-slide-list'); const stage=document.querySelector('.deck-stage'); return strip.getBoundingClientRect().height <= 130 && strip.scrollWidth>strip.clientWidth && stage.getBoundingClientRect().height>=180 && stage.getBoundingClientRect().bottom<=strip.getBoundingClientRect().top; })()`), true, 'Large decks must scroll the filmstrip sideways without crowding out the canvas')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe')?.srcdoc.includes('second published')`), 'Returning from large deck lost selection')
  const savedModel = await evaluate(`document.querySelector('.conversation select').value`)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.dataset.action==='new-chat').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').children.length === 0 && document.querySelector('.conversation select').value === ''`), 'Empty chat did not open independently')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe')?.srcdoc.includes('second published')`), 'History did not restore the deck and its selected slide')
  assert.equal(await evaluate(`document.querySelector('.conversation select').value`), savedModel, 'History must restore its own model')
  assert.equal(await requestCount(app, 'browser-deck'), 0, 'Opening earlier chats must not send a request')
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 640)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '640px')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar input[type=range]') === null`), true, 'Width slider must be removed')
  await protocol.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft' })
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '656px', 'Focused divider must support keyboard resizing')
  await protocol.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft' })
  await protocol.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' })
  await protocol.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' })
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '640px')
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 1100)
  assert.equal(await evaluate(`document.querySelector('.conversation').getBoundingClientRect().width >= 320`), true, 'Dragging must preserve usable chat width')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').getBoundingClientRect().width <= 1000`), true)
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 200)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '320px')
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 1100)
  // The release coordinate must win even when Chrome omits the final pointermove.
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 200, { releaseOnly: true })
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '320px', 'Pointer release must commit the final position without a preceding move')
  await resizeDeck(protocol, evaluate, '.published-deck-sidebar', 640)
  // Fullscreen needs a real user gesture; a scripted click() carries no activation.
  const presentButton = await evaluate(`(() => { const r=[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Trình chiếu').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`)
  await protocol.call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...presentButton })
  await protocol.call('Input.dispatchMouseEvent', { type: 'mousePressed', ...presentButton, button: 'left', buttons: 1, clickCount: 1 })
  await protocol.call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...presentButton, button: 'left', clickCount: 1 })
  await eventually(() => evaluate('Boolean(document.fullscreenElement)'), 'Published deck fullscreen failed')
  const presenting = `(() => { const p=document.fullscreenElement; const r=p.querySelector('.deck-stage iframe').getBoundingClientRect(); const hidden=selector => getComputedStyle(p.querySelector(selector)).display==='none'; return { ok: p.dataset.presenting==='true' && hidden('header') && hidden('.deck-slide-list') && !p.querySelector('.deck-exit').hidden && Math.abs(r.width/r.height-16/9)<.02 && r.width<=innerWidth && r.height<=innerHeight, presenting: p.dataset.presenting, header: hidden('header'), list: hidden('.deck-slide-list'), exit: !p.querySelector('.deck-exit').hidden, w: r.width, h: r.height, iw: innerWidth, ih: innerHeight }; })()`
  // `presenting` is set by the fullscreenchange handler, which runs after fullscreenElement exists.
  let layout
  await eventually(async () => {
    layout = await evaluate(presenting)
    return layout.ok
  }, 'Presentation mode did not settle').catch(() => {})
  assert.equal(layout.ok, true, `Presentation mode must hide the panel chrome and keep the slide 16:9 inside the screen: ${JSON.stringify(layout)}`)
  await evaluate(`document.fullscreenElement.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true})); true`)
  await eventually(() => evaluate(`document.fullscreenElement.querySelector('.deck-stage iframe').srcdoc.includes('intro published')`), 'Arrow keys must move between slides while presenting')
  await eventually(() => evaluate(`document.fullscreenElement.dataset.idle==='true' && getComputedStyle(document.fullscreenElement.querySelector('.deck-controls')).opacity==='0'`), 'Presentation controls must fade after the pointer rests')
  await evaluate('document.exitFullscreen(); true')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-panel').dataset.presenting==='false' && !document.querySelector('.published-deck-sidebar header').hidden`), 'Leaving presentation must restore the panel')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe')?.srcdoc.includes('intro published')`), 'Reload did not restore published content')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '640px', 'Dragged width must survive reload')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 680, height: 1000, deviceScaleFactor: 1, mobile: false })
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.published-deck-sidebar [role=separator]')).display`), 'none', 'Stacked mobile layout must hide horizontal resizing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').getBoundingClientRect().width <= innerWidth`), true)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await app.close()
  app = await startLocalWeb(options)
  await navigate()
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] strong').textContent`), 'Publish slide 1 first', 'History title must survive Host restart')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] small').textContent`), 'Có slide', 'Published state must survive Host restart')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-stage iframe').srcdoc.includes('intro published')`), 'Host restart lost slide content')
  const slideFrame = await eventually(async () => {
    const tree = await protocol.call('Page.getFrameTree')
    const child = tree.frameTree.childFrames?.find(frame => frame.frame.url === 'about:srcdoc')
    if (child) return { frameId: child.frame.id }
    const targets = await protocol.call('Target.getTargets')
    const target = targets.targetInfos.find(info => info.type === 'iframe' && info.url === 'about:srcdoc')
    return target ? { targetId: target.targetId } : undefined
  }, 'Rendered iframe missing')
  let contextId, sessionId
  if (slideFrame.targetId) sessionId = (await protocol.call('Target.attachToTarget', { targetId: slideFrame.targetId, flatten: true })).sessionId
  else contextId = (await protocol.call('Page.createIsolatedWorld', { frameId: slideFrame.frameId, worldName: 'deck-verification' })).executionContextId
  const rendered = await eventually(async () => {
    const result = await protocol.call('Runtime.evaluate', { expression: `document.querySelector('h1') && ({text:document.body.textContent,color:getComputedStyle(document.querySelector('h1')).color})`, ...(contextId ? { contextId } : {}), returnByValue: true }, sessionId)
    return result.result.value?.text.includes('intro published') ? result.result.value : undefined
  }, 'Published HTML did not render')
  assert.match(rendered.text, /intro published/)
  assert.equal(rendered.color, 'rgb(0, 100, 0)', 'Static inline CSS must render under CSP')
  await protocol.call('Page.captureScreenshot', { format: 'png' }).then(async result => {
    await writeFile(process.env.DECKAGENT_CANVAS_SCREENSHOT ?? join(dir, 'canvas.png'), Buffer.from(result.data, 'base64'))
  })
})

async function tree(folder) {
  const entries = []
  for (const name of (await readdir(folder)).sort()) {
    const info = await stat(join(folder, name))
    entries.push([name, info.size, info.mtimeMs, info.isDirectory() ? await tree(join(folder, name)) : null])
  }
  return entries
}

test('step approval survives reload and chat switching; refusal continues and Stop cancels a pending step', { timeout: 60000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-browser-approval-'))
  let app, session
  t.after(async () => { await closeBrowser(session); await app?.close(); await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) })
  const outside = join(dir, 'outside.txt')
  await writeFile(outside, 'outside browser marker')
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: dir, ...fixtureProvider('approval'), openCode: fakeOpenCode(dir) })
  const api = async (path, method = 'GET', body) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    assert.equal(response.ok, true)
    return response.json()
  }
  const chat = await api('sessions', 'POST', { selection: { provider: 'fixture', model: 'approval' } })
  const other = await api('sessions', 'POST', { selection: { provider: 'fixture', model: 'approval' } })
  const request = await api('requests', 'POST', { sessionId: chat.sessionId, input: `[mcp-external] ${outside}` })
  await eventually(async () => (await api(`requests/${request.requestId}`)).pendingApproval, 'Approval was not saved')
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  const visit = async id => {
    await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
    await eventually(() => evaluate(`!!document.querySelector('.chat-navigation button[data-session-id="${id}"]')`), 'Chat list missing')
    await evaluate(`document.querySelector('.chat-navigation button[data-session-id="${id}"]').click(); true`)
  }
  await visit(chat.sessionId)
  const visible = `document.querySelector('.step-approval:not([hidden])')`
  await eventually(() => evaluate(`!!${visible}`), 'Saved approval did not appear')
  assert.equal(await evaluate(`${visible}.textContent.includes('outside.txt')`), true)
  assert.equal(await evaluate(`document.querySelector('[aria-label="Dừng yêu cầu"]').hidden`), false)
  await evaluate(`document.querySelector('.chat-navigation button[data-session-id="${other.sessionId}"]').click(); true`)
  await eventually(() => evaluate(`!${visible}`), 'Approval leaked into another chat')
  await evaluate(`document.querySelector('.chat-navigation button[data-session-id="${chat.sessionId}"]').click(); true`)
  await eventually(() => evaluate(`!!${visible}`), 'Approval lost on chat switch')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`!!${visible}`), 'Approval lost on reload')
  await evaluate(`Array.from(${visible}.querySelectorAll('button')).find(button => button.textContent === 'Từ chối').click(); true`)
  await eventually(async () => (await api(`requests/${request.requestId}`)).status === 'completed', 'Refused request did not continue')
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('Không thực hiện vì bạn đã từ chối')`), 'Refusal missing from saved closing reply')
  const next = await api('requests', 'POST', { sessionId: chat.sessionId, input: `[mcp-external] ${outside}` })
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`!!${visible}`), 'Next approval missing')
  await evaluate(`document.querySelector('[aria-label="Dừng yêu cầu"]').click(); true`)
  await eventually(async () => (await api(`requests/${next.requestId}`)).status === 'stopped', 'Stop failed during approval')
  await eventually(() => evaluate(`!${visible}`), 'Cancelled approval controls remained visible')
})

test('real browser boots without a model: workspaces, chats, search, drafts and an unreadable chat', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-browser-'))
  let app, session
  t.after(async () => {
    try {
      await closeBrowser(session)
      if (app) await app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  const project = join(dir, 'Dự án tái chế')
  await mkdir(join(project, '.hidden'), { recursive: true })
  await writeFile(join(project, 'notes.md'), '# Notes')
  const before = await tree(project)
  // Seeded history stands in for requests that a later build sends.
  const database = join(dir, 'data', 'db')
  const chats = new SqliteSessionStore(join(database, 'sessions.sqlite'))
  await chats.open('recycling')
  await chats.append('recycling', [{ role: 'user', content: 'Kế hoạch tái chế cho trường' }, { role: 'assistant', content: 'Đã lưu dàn ý về giấy và nhựa' }])
  await chats.open('budget')
  await chats.append('budget', [{ role: 'user', content: 'Ngân sách quý ba' }])
  await chats.open('damaged')
  await chats.append('damaged', [{ role: 'user', content: 'Will be damaged' }])
  chats.close()
  const raw = new DatabaseSync(join(database, 'sessions.sqlite'))
  raw.prepare("UPDATE messages SET payload='{broken' WHERE session_id='damaged'").run()
  raw.close()
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: join(dir, 'home') })
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])') && !!document.querySelector('.chat-navigation nav button[aria-current=true]')`), 'Browser boot failed')
  assert.equal(await evaluate(`document.querySelector('.conversation-header h1').textContent`), 'Chat mới')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').getBoundingClientRect().height < 95`), true, 'Empty Composer must be compact')
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Gửi yêu cầu"]').disabled && document.querySelector('.requests-unavailable').checkVisibility()`), true,
    'Send is unavailable and the composer says why')
  assert.equal(await evaluate(`[...document.querySelectorAll('.workspace-controls select option')].map(o=>o.textContent).join('|')`), 'Workspace mặc định · mặc định',
    'First start uses the default workspace and asks for no folder')
  assert.equal(await evaluate(`[...document.querySelectorAll('.chat-navigation nav button strong')].map(n=>n.textContent).includes('Kế hoạch tái chế cho trường')`), true,
    'Earlier chats from before the start are listed and named from their content')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation [data-session-id="damaged"] strong').textContent`), 'Chat không đọc được',
    'A chat whose saved work cannot be read stays listed')
  const firstChat = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Nháp A'; ta.dispatchEvent(new Event('input'))} true`)
  // UC-006 A3: the damaged chat is not opened; the current chat and its draft stay.
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="damaged"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.conversation > [role=status]').hidden === false && document.querySelector('.conversation > [role=status]').textContent.includes('Không mở được chat này')`), 'Unreadable chat was not reported')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`), firstChat)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Nháp A')
  assert.equal(await evaluate(`!!document.querySelector('.chat-navigation [data-session-id="damaged"]')`), true, 'The unreadable chat is not removed')
  // FR-134: find by words of the name or the conversation.
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value='nhựa'; s.form.requestSubmit()} true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].map(b=>b.dataset.sessionId).join() === 'recycling'`), 'Search did not find the chat by its conversation')
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value='không có từ này'; s.form.requestSubmit()} true`)
  await eventually(() => evaluate(`document.querySelector('.chat-navigation nav').textContent.includes('Không có chat nào khớp')`), 'No-match message missing')
  assert.equal(await evaluate(`document.querySelector('.chat-search input').value`), 'không có từ này', 'The search keeps the words')
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value=''; s.dispatchEvent(new Event('input'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-session-id="budget"]')`), 'Clearing the search did not restore the list')
  // UC-013 A9 and BR-019: a refused folder sets up no workspace.
  await evaluate(`document.querySelector('[data-action=add-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog').open`), 'Workspace dialog did not open')
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(parse(dir).root)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('thư mục gốc của ổ đĩa')`), 'Drive root was not refused with its reason')
  assert.equal(await evaluate(`document.querySelectorAll('.workspace-controls select option').length`), 1)
  // UC-013 S2: set up a workspace for a folder; it becomes the workspace in use; the open chat and draft stay.
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(project)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`!document.querySelector('.workspace-dialog').open && document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent === 'Dự án tái chế'`), 'Workspace was not set up and selected')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]')`), null, 'The list shows the chats of the workspace in use')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Nháp A', 'Adding a workspace keeps the open chat and its draft')
  // UC-012: a new chat joins the workspace in use, with an empty draft.
  await evaluate(`document.querySelector('[data-action=new-chat]').click(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation nav button[aria-current=true]') && document.querySelector('.composer textarea').value === ''`), 'New chat did not open in the workspace')
  const projectChat = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  assert.notEqual(projectChat, firstChat)
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Nháp B'; ta.dispatchEvent(new Event('input'))} true`)
  // UC-013 A7: switch back to the default workspace; then open the first chat with its own draft.
  await evaluate(`{const sel=document.querySelector('.workspace-controls select'); sel.value='default'; sel.dispatchEvent(new Event('change'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-session-id="${firstChat}"]')`), 'Switching workspace did not show its chats')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Nháp B', 'Switching keeps the open chat and its draft')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${firstChat}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Nháp A'`), 'Draft A did not come back with its chat')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Nháp A'`), 'Reload lost the draft of the open chat')
  // FR-141: rename with whitespace dropped.
  await evaluate(`{const sel=document.querySelector('.workspace-controls select'); sel.value=[...sel.options].find(o=>o.textContent.startsWith('Dự án')).value; sel.dispatchEvent(new Event('change'))} true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent === 'Dự án tái chế'`), 'Workspace not selected again')
  await evaluate(`document.querySelector('[data-action=rename-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog').open`), 'Rename dialog did not open')
  await evaluate(`document.querySelector('.workspace-dialog input').value='   '; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('ít nhất một ký tự')`), 'Empty name was not refused')
  await evaluate(`document.querySelector('.workspace-dialog input').value='  Dự án Việt  '; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent === 'Dự án Việt'`), 'Rename failed')
  // UC-013 A2: remove after confirm; its chats become ungrouped; the default workspace is in use.
  await evaluate(`window.confirm=()=>true; document.querySelector('[data-action=remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-controls select').value === 'default'`), 'Default workspace not in use after remove')
  await eventually(() => evaluate(`(() => { const heading=[...document.querySelectorAll('.chat-navigation nav h3')].find(h=>h.textContent==='Chat chưa nhóm'); return !!heading && !!heading.parentElement.querySelector('[data-session-id="${projectChat}"]') })()`), 'Chat of the removed workspace is not ungrouped')
  assert.deepEqual(await tree(project), before, 'No file of the project folder was created, changed or deleted')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${projectChat}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Nháp B'`), 'Ungrouped chat lost its draft')
  assert.equal(await evaluate(`document.querySelector('.workspace-controls select').value`), 'default', 'Opening an ungrouped chat keeps the workspace in use')
  // The sample deck panel keeps its sandbox; samples are served with a sandbox CSP.
  await evaluate(`document.querySelector('.published-deck-sidebar').hidden=true; document.querySelector('.deck-sidebar').hidden=false; true`)
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar iframe').getAttribute('sandbox')`), '')
  const sample = await fetch(`${app.origin}/samples/2.html`)
  assert.match(sample.headers.get('content-security-policy'), /^sandbox;/)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 900, height: 600, deviceScaleFactor: 1, mobile: false })
  assert.equal(await evaluate(`(() => { const box=document.querySelector('.composer').getBoundingClientRect(); return box.bottom<=innerHeight && box.left>=0 && box.right<=innerWidth; })()`), true, 'Compact Composer must remain usable in a narrow, short window')
  if (process.env.DECKAGENT_BROWSER_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_BROWSER_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  for (const id of ['recycling', 'budget', firstChat, projectChat]) assert.equal(await requestCount(app, id), 0, 'No step sent a request')
})
