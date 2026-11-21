import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, parse } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { FolderPickerUnavailableError, startLocalWeb } from '../apps/local-web/lib/index.js'
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
/** Every chat the Host keeps, listed or not: a new chat that waits for its first character is not one of them. */
async function storedChats(app) {
  return (await fetch(`${app.origin}/api/sessions`, { headers: { authorization: `Bearer ${app.token}` } })).json()
}

test('interactive composer selects a model without work, offers no send in this build and keeps per-chat drafts on reload', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-interactive-'))
  let app, session
  t.after(async () => {
    await closeBrowser(session)
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({ dataDir: join(dir, 'data'), ...fixtureProvider('interactive') })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])')`), 'Welcome missing')
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.wordmark'),'::before').maskImage.includes('/client/Logo.png')`), true, 'The wordmark uses the supplied logo as its mask')
  await evaluate(`document.querySelector('.account-trigger').click(); true`)
  const logoPalettes = [
    ['none', '#F5A9E8', '#88C7FF', '#A73398', '#2465C6'],
    ['koi', '#9DE4C4', '#FF9677', '#237D65', '#C6462B'],
    ['rain', '#FFC17D', '#83C8FF', '#A65A17', '#286AAB'],
    ['forest', '#98E6A1', '#D9F581', '#237747', '#668C19'],
    ['stars', '#A8B5FF', '#E1D8FF', '#4053B3', '#7951A6'],
    ['sakura', '#FFD0E3', '#FF9FC3', '#AE386F', '#C64E78'],
  ]
  for (const [index, [id, darkStart, darkEnd, lightStart, lightEnd]] of logoPalettes.entries()) {
    await evaluate(`document.querySelectorAll('.background-control button')[${index}].click(); document.documentElement.dataset.theme='dark'; true`)
    await eventually(() => evaluate(`document.documentElement.style.getPropertyValue('--logo-gradient') === 'linear-gradient(135deg,${darkStart},${darkEnd})'`), `${id} dark logo colors did not apply`)
    await evaluate(`document.documentElement.dataset.theme='light'; true`)
    await eventually(() => evaluate(`document.documentElement.style.getPropertyValue('--logo-gradient') === 'linear-gradient(135deg,${lightStart},${lightEnd})'`), `${id} light logo colors did not apply`)
  }
  await protocol.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] })
  await evaluate(`delete document.documentElement.dataset.theme; true`)
  await eventually(() => evaluate(`document.documentElement.style.getPropertyValue('--logo-gradient') === 'linear-gradient(135deg,#FFD0E3,#FF9FC3)'`), 'System dark mode did not recolor the logo')
  await protocol.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] })
  await eventually(() => evaluate(`document.documentElement.style.getPropertyValue('--logo-gradient') === 'linear-gradient(135deg,#AE386F,#C64E78)'`), 'System light mode did not recolor the logo')
  await evaluate(`document.querySelectorAll('.background-control button')[0].click(); true`)
  // The first start shows a new chat that the Host has not made yet, like ChatGPT.
  assert.equal((await storedChats(app)).length, 0, 'Opening the interface makes no chat')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]')`), null, 'The new chat is not listed before it is made')
  assert.equal(await evaluate(`!!document.querySelector('[aria-label="Chọn model"]')`), true, 'The composer must offer the provider/model popover')
  await eventually(() => evaluate(`document.querySelector('[aria-label="Chọn model"]')?.disabled === false`), 'Chat not ready for model selection')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.model-options button')`), 'Model popover empty')
  await evaluate(`document.querySelector('.model-options button').click(); true`)
  await eventually(() => evaluate(`!document.querySelector('.composer select').disabled && document.querySelector('.composer select').value !== ''`), 'Selection not saved')
  // Choosing a model makes the waiting chat, with that model.
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation nav button[aria-current=true]')`), 'Choosing a model did not make the chat')
  const chatId = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  assert.equal((await storedChats(app)).length, 1, 'Choosing a model makes exactly one chat')
  assert.equal(await requestCount(app, chatId), 0, 'Selecting a model must not start work')
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Gửi yêu cầu"]').disabled`), true, 'Send is unavailable until a runtime is connected')
  assert.equal(await evaluate(`[...document.querySelectorAll('.composer-controls button')].find(b=>b.textContent==='Đề xuất outline').disabled`), true)
  assert.equal(await evaluate(`document.querySelector('.requests-unavailable').checkVisibility() && document.querySelector('.requests-unavailable').textContent.includes('Chưa thể gửi yêu cầu')`), true,
    'The composer says why a request cannot be sent')
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='A draft'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))} true`)
  await delay(300)
  assert.equal(await requestCount(app, chatId), 0, 'Enter must not send while requests are unavailable')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'A draft', 'Enter keeps the draft')
  await evaluate(`{const draftInput=document.querySelector('.composer textarea'); draftInput.value='Draft before reload';draftInput.dispatchEvent(new Event('input'))} true`)
  await delay(400)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Draft before reload'`), 'Reload lost the draft')
  assert.equal(await evaluate(`document.querySelector('.composer select').value.includes('interactive')`), true, 'The chat keeps its selected model')
  const before = await evaluate(`document.querySelectorAll('.chat-navigation button[data-session-id]').length`)
  // `Chat mới` shows a new chat of no workspace and makes nothing yet; the chat that holds a draft stays listed.
  const chatCount = () => evaluate(`document.querySelectorAll('.chat-navigation button[data-session-id]').length`)
  const kept = (await storedChats(app)).length
  await evaluate(`document.querySelector('[data-action=new-chat]').click();true`)
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])') && document.querySelector('.composer textarea').value === ''`), 'New chat did not show')
  assert.equal(await chatCount(), before, 'The new chat is not listed before its first character')
  assert.equal((await storedChats(app)).length, kept, 'Pressing `Chat mới` makes no chat')
  await evaluate(`document.querySelector('[data-action=new-chat]').click();true`)
  await delay(150)
  assert.equal((await storedChats(app)).length, kept, 'A second press makes no chat either')
  // Typing fast while the Host makes the chat makes one chat, under `Chat`, that keeps every character.
  await evaluate(`{const ta=document.querySelector('.composer textarea'); for (const text of ['N','Nh','Nháp','Nháp mới']) { ta.value=text; ta.dispatchEvent(new Event('input')) }} true`)
  await eventually(async () => (await chatCount()) === before + 1, 'Typing did not make the new chat')
  await eventually(() => evaluate(`!!document.querySelector('.chat-group button[data-session-id][aria-current=true]')`), 'The new chat is not a chat of no workspace')
  assert.equal(await evaluate(`document.querySelector('.chat-group .chat-group-heading').textContent`), 'Chat', 'Chats of no workspace list under `Chat`')
  assert.equal((await storedChats(app)).length, kept + 1, 'Typing makes exactly one chat')
  const typedChat = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  await delay(400)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Nháp mới'`), 'The draft typed while the chat was made was lost')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`), typedChat)
  // The chat with the draft opens again, with its draft.
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${chatId}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Draft before reload'`), 'The draft did not come back with its chat')
  await evaluate(`document.querySelector('.nav-toggle').click(); true`)
  assert.equal(await evaluate(`document.querySelector('#app').dataset.nav`), 'collapsed', 'The toggle hides the chat list to a rail')
  assert.equal(await evaluate(`document.querySelector('.nav-toggle').getAttribute('aria-expanded')`), 'false')
  await eventually(() => evaluate(`Math.round(document.querySelector('.chat-navigation').getBoundingClientRect().width) === 64`), 'Collapsed list is a narrow rail (after its short width transition)')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav').checkVisibility()`), false, 'Chat list is hidden when collapsed')
  assert.equal(await evaluate(`document.querySelector('[data-action=new-chat]').checkVisibility() && document.querySelector('.account-trigger').checkVisibility()`), true, 'New chat and settings stay reachable on the rail')
  assert.equal(await evaluate(`localStorage.getItem('deckagent-nav')`), 'collapsed')
  await evaluate(`document.querySelector('.nav-toggle').click(); true`)
  assert.equal(await evaluate(`document.querySelector('#app').dataset.nav === undefined && document.querySelector('.chat-navigation nav').checkVisibility()`), true, 'The toggle restores the chat list')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('.model-manage').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').open`), 'Settings missing')
  assert.equal(await evaluate(`document.querySelector('dialog').matches(':modal')`), true, 'Settings is a popup over the chat')
  await evaluate(`document.querySelector('[aria-label="Display name"]').value='Unsaved';document.querySelector('[aria-label="Display name"]').dispatchEvent(new Event('input',{bubbles:true}));window.confirm=()=>false;document.querySelector('.settings-back').click();true`)
  assert.equal(await evaluate(`document.querySelector('dialog').open`), true, 'Declining discard must keep Settings open')
  await evaluate(`window.confirm=()=>true;document.querySelector('.settings-back').click();true`)
  await eventually(() => evaluate(`!document.querySelector('dialog').open`), 'Settings did not close after discard')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('[aria-label="Thêm provider"]').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').matches(':modal')`), 'Quick provider wizard did not open')
  await evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Tiếp tục →').click();document.querySelector('[aria-label="Provider ID"]').value='wizard-api';document.querySelector('[aria-label="Display name"]').value='Wizard API';document.querySelector('[aria-label="Base URL"]').value='http://127.0.0.1:1';document.querySelector('dialog form').requestSubmit();true`)
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
  assert.equal(await requestCount(app, chatId), 0, 'Reload, new chat and Settings must not start work')
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
    // A first visit shows a new chat that is not made yet; a later one opens the chat it remembers.
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [aria-current=true]') || document.querySelector('.welcome:not([hidden])'))`), 'Initial chat did not finish opening')
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
  // The first start shows a new chat that is neither made nor listed yet.
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])') && !!document.querySelector('.chat-navigation [data-session-id="recycling"]')`), 'Browser boot failed')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]')`), null, 'The new chat is not listed before it is made')
  const seeded = (await storedChats(app)).length
  assert.equal(seeded, 3, 'Opening the interface makes no chat')
  assert.equal(await evaluate(`document.querySelector('.conversation-header h1').textContent`), 'Chat mới')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').getBoundingClientRect().height < 95`), true, 'Empty Composer must be compact')
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Gửi yêu cầu"]').disabled && document.querySelector('.requests-unavailable').checkVisibility()`), true,
    'Send is unavailable and the composer says why')
  assert.equal(await evaluate(`[...document.querySelectorAll('.workspace-row .workspace-name')].map(o=>o.textContent).join('|')`), 'Workspace mặc định',
    'First start uses the default workspace and asks for no folder')
  // The sidebar can be dragged wider, up to a quarter of the window (1600 px wide here), and back to its normal width.
  const navWidth = () => evaluate(`Math.round(document.querySelector('.chat-navigation').getBoundingClientRect().width)`)
  const divider = await evaluate(`Math.round(document.querySelector('.nav-resizer').getBoundingClientRect().left)`)
  const mouse = (type, x) => protocol.call('Input.dispatchMouseEvent', { type, x, y: 400, button: type === 'mouseMoved' ? 'none' : 'left', buttons: type === 'mouseReleased' ? 0 : 1, pointerType: 'mouse', clickCount: 1 })
  await mouse('mouseMoved', divider)
  await mouse('mousePressed', divider)
  await mouse('mouseMoved', divider + 120)
  assert.equal(await navWidth(), 236 + 120, 'Dragging the divider widens the sidebar')
  await mouse('mouseMoved', 1500)
  await mouse('mouseReleased', 1500)
  assert.equal(await navWidth(), 400, 'The sidebar stops at a quarter of the window')
  await evaluate(`document.querySelector('.nav-resizer').dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); true`)
  await eventually(async () => (await navWidth()) === 236, 'Double press did not restore the normal width')
  assert.equal(await evaluate(`[...document.querySelectorAll('.chat-navigation nav button strong')].map(n=>n.textContent).includes('Kế hoạch tái chế cho trường')`), true,
    'Earlier chats from before the start are listed and named from their content')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation [data-session-id="damaged"] strong').textContent`), 'Chat không đọc được',
    'A chat whose saved work cannot be read stays listed')
  // The first character makes the chat, a chat of no workspace like the one `Chat mới` starts.
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Nháp A'; ta.dispatchEvent(new Event('input'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-group button[data-session-id][aria-current=true]')`), 'Typing did not make the chat')
  const firstChat = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  assert.equal((await storedChats(app)).length, seeded + 1, 'Typing makes exactly one chat')
  // UC-006 A3: the damaged chat is not opened; the current chat and its draft stay.
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="damaged"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.conversation > [role=status]').hidden === false && document.querySelector('.conversation > [role=status]').textContent.includes('Không mở được chat này')`), 'Unreadable chat was not reported')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`), firstChat)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Nháp A')
  assert.equal(await evaluate(`!!document.querySelector('.chat-navigation [data-session-id="damaged"]')`), true, 'The unreadable chat is not removed')
  // FR-134: find by words of the name or the conversation.
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value='nhựa'; s.form.requestSubmit()} true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.chat-navigation button[data-session-id]')].map(b=>b.dataset.sessionId).join() === 'recycling'`), 'Search did not find the chat by its conversation')
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value='không có từ này'; s.form.requestSubmit()} true`)
  await eventually(() => evaluate(`document.querySelector('.chat-navigation nav').textContent.includes('Không có chat nào khớp')`), 'No-match message missing')
  assert.equal(await evaluate(`document.querySelector('.chat-search input').value`), 'không có từ này', 'The search keeps the words')
  await evaluate(`{const s=document.querySelector('.chat-search input'); s.value=''; s.dispatchEvent(new Event('input'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-session-id="budget"]')`), 'Clearing the search did not restore the list')
  // UC-013 A9 and BR-019: a refused folder sets up no workspace.
  await evaluate(`document.querySelector('[data-action=add-workspace]').click(); document.querySelector('[data-action=add-folder-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog').open`), 'Workspace dialog did not open')
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(parse(dir).root)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('thư mục gốc của ổ đĩa')`), 'Drive root was not refused with its reason')
  assert.equal(await evaluate(`document.querySelectorAll('.workspace-row').length`), 1)
  // UC-013 S2: set up a workspace for a folder; it becomes the workspace in use, and the view goes to its page, like the
  // project page of ChatGPT, with no chat made yet. The chat that was open keeps its draft and stays listed.
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(project)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`!document.querySelector('.workspace-dialog').open && document.querySelector('.workspace-row[aria-pressed=true] .workspace-name')?.textContent === 'Dự án tái chế'`), 'Workspace was not set up and selected')
  const pageShows = name => evaluate(`!document.querySelector('.workspace-home').hidden && document.querySelector('.workspace-home-name').textContent === ${JSON.stringify(name)} && !document.querySelector('.conversation-header').checkVisibility()`)
  await eventually(() => pageShows('Dự án tái chế'), 'Adding a workspace did not show its page')
  assert.equal(await evaluate(`document.querySelector('.workspace-home .composer textarea')?.placeholder`), 'Chat mới trong Dự án tái chế', 'The composer sits on the page and says where the chat goes')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), '', 'The composer of the page starts empty')
  assert.equal(await evaluate(`document.querySelector('.workspace-home-empty').checkVisibility()`), true, 'The page of a new workspace says it has no chats')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[data-home=true] .workspace-name').textContent`), 'Dự án tái chế', 'The sidebar marks the workspace whose page shows')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]')`), null, 'The new chat of the workspace is not listed before it is made')
  assert.equal((await storedChats(app)).length, seeded + 1, 'Adding a workspace makes no chat')
  // The tree lists the chats of every workspace under their own workspace: a new workspace has none, and the chat that was open stays under `Chat`.
  assert.equal(await evaluate(`document.querySelector('.workspace-item:has(.workspace-row[aria-pressed=true]) button[data-session-id]')`), null, 'A new workspace has no chats')
  assert.equal(await evaluate(`!!document.querySelector('.chat-group button[data-session-id="${firstChat}"]')`), true, 'The chat that was open stays listed')
  // The button of the workspace row keeps the same page and makes nothing; the first character makes the chat in that workspace.
  await evaluate(`document.querySelector('.workspace-item:has(.workspace-row[aria-pressed=true]) .workspace-new-chat').click(); true`)
  await delay(150)
  assert.equal((await storedChats(app)).length, seeded + 1, 'The new chat button of a workspace makes no chat')
  // Typing fast on the page keeps the page, the focus and every character; the composer does not move while typing.
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.focus(); for (const text of ['N','Nh','Nháp','Nháp B']) { ta.value=text; ta.dispatchEvent(new Event('input')) }} true`)
  await eventually(() => evaluate(`!!document.querySelector('.workspace-item:has(.workspace-row[aria-pressed=true]) button[data-session-id][aria-current=true]')`), 'Typing did not make the chat in the workspace')
  const projectChat = await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId`)
  assert.notEqual(projectChat, firstChat)
  assert.equal((await storedChats(app)).length, seeded + 2, 'Typing makes exactly one chat in the workspace')
  assert.deepEqual(await evaluate(`({ page: !document.querySelector('.workspace-home').hidden, focus: document.activeElement === document.querySelector('.composer textarea'), text: document.querySelector('.composer textarea').value })`),
    { page: true, focus: true, text: 'Nháp B' }, 'Typing on the page keeps the page and the focus')
  assert.equal(await evaluate(`document.querySelector('.workspace-home-chats [data-chat-id="${projectChat}"]')`), null, 'The page does not list the chat that its composer is typing')
  // Chats of no workspace are a section of their own: folding the workspaces keeps them in view.
  await evaluate(`document.querySelector('.workspace-head .workspace-toggle').click(); true`)
  assert.equal(await evaluate(`document.querySelector('.workspace-list').checkVisibility() === false && document.querySelector('.chat-group button[data-session-id="${firstChat}"]').checkVisibility()`), true,
    'Folding the workspaces does not hide the chats of no workspace')
  await evaluate(`document.querySelector('.workspace-head .workspace-toggle').click(); true`)
  // UC-013 A7: pressing the row of the default workspace shows its page, with its chats; the chat of the project stays listed.
  await evaluate(`document.querySelector('.workspace-row[data-workspace-id=default]').click(); true`)
  await eventually(() => pageShows('Workspace mặc định'), 'Pressing a workspace row did not show its page')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dataset.workspaceId`), 'default', 'The workspace of the page is the workspace in use')
  assert.equal(await evaluate(`!!document.querySelector('.chat-navigation [data-session-id="${projectChat}"]') && !!document.querySelector('.workspace-home-chats [data-chat-id="recycling"]')`), true,
    'The page lists the chats of its workspace, and the chat that was typed stays listed')
  // A chat opened from the page shows its conversation; the header names its workspace.
  await evaluate(`document.querySelector('.workspace-home-chats [data-chat-id="recycling"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-home').hidden && document.querySelector('.conversation-header h1').textContent.startsWith('Kế hoạch')`), 'A chat of the page did not open')
  assert.equal(await evaluate(`!document.querySelector('.chat-place').hidden && document.querySelector('.chat-place-name').textContent`), 'Workspace mặc định', 'The header names the workspace of the chat')
  // The chat of the project comes back with its draft; with no conversation yet, its welcome names its workspace.
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${projectChat}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Nháp B'`), 'Draft B did not come back with its chat')
  assert.equal(await evaluate(`document.querySelector('.chat-place-name').textContent`), 'Dự án tái chế')
  assert.equal(await evaluate(`document.querySelector('.welcome:not([hidden]) .welcome-workspace')?.textContent`), 'Trong workspace “Dự án tái chế”', 'The welcome names the workspace of the chat')
  // The first chat, of no workspace, comes back with its own draft and names no workspace.
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${firstChat}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Nháp A'`), 'Draft A did not come back with its chat')
  assert.equal(await evaluate(`document.querySelector('.chat-place').hidden && document.querySelector('.welcome-workspace').hidden`), true, 'A chat of no workspace names no workspace')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Nháp A'`), 'Reload lost the draft of the open chat')
  // FR-141: rename with whitespace dropped.
  await evaluate(`[...document.querySelectorAll('.workspace-row')].find(r=>r.textContent.startsWith('Dự án')).click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name')?.textContent === 'Dự án tái chế'`), 'Workspace not selected again')
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:40,clientY:150})); document.querySelector('[data-action=rename-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog').open`), 'Rename dialog did not open')
  await evaluate(`document.querySelector('.workspace-dialog input').value='   '; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('ít nhất một ký tự')`), 'Empty name was not refused')
  await evaluate(`document.querySelector('.workspace-dialog input').value='  Dự án Việt  '; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name')?.textContent === 'Dự án Việt'`), 'Rename failed')
  assert.equal(await evaluate(`document.querySelector('.workspace-home-name').textContent`), 'Dự án Việt', 'The page shows the new name')
  // The user places workspaces: by dragging a row, and by Alt with the arrow keys. Two workspaces exist here.
  const placed = () => evaluate(`[...document.querySelectorAll('.workspace-item')].map(li=>li.dataset.workspaceId).join('|')`)
  const original = await placed()
  const [firstId, secondId] = original.split('|')
  await evaluate(`(() => { const [from, to] = [...document.querySelectorAll('.workspace-item')].reverse(); const list = document.querySelector('.workspace-list'); const data = new DataTransfer(); const y = to.getBoundingClientRect().top + 2
    from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: data }))
    list.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientY: y, dataTransfer: data }))
    list.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientY: y, dataTransfer: data }))
    from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: data })) })(); true`)
  await eventually(async () => (await placed()) === `${secondId}|${firstId}`, 'Dragging the last workspace above the first did not reorder')
  await evaluate(`const row = document.querySelector('.workspace-row'); row.focus(); row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true })); true`)
  await eventually(async () => (await placed()) === original, 'Alt and the down arrow did not move the workspace down')
  // UC-013 A3 and FR-083: choose another folder; the workspace keeps its ID, name and chats.
  const moved = join(dir, 'Dự án đã chuyển')
  await mkdir(moved)
  const workspaceId = await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dataset.workspaceId`)
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:40,clientY:150})); document.querySelector('[data-action=relink-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog').open && document.querySelector('.workspace-dialog input').value.endsWith('Dự án tái chế')`), 'The folder dialog did not open with the current folder')
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(moved)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`!document.querySelector('.workspace-dialog').open && document.querySelector('.workspace-row[aria-pressed=true]').title.endsWith('Dự án đã chuyển')`), 'The workspace did not move to the other folder')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dataset.workspaceId`), workspaceId, 'Changing the folder keeps the workspace ID')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name').textContent`), 'Dự án Việt', 'Changing the folder keeps the name')
  assert.equal(await evaluate(`!!document.querySelector('.chat-navigation [data-session-id="${projectChat}"]')`), true, 'Changing the folder keeps the chats of the workspace')
  // UC-013 A2: remove after confirm; its chats become ungrouped; the default workspace is in use.
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:40,clientY:150})); document.querySelector('[data-action=remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-confirm').open`), 'The delete confirmation did not open')
  assert.equal(await evaluate(`document.querySelector('.workspace-confirm li:nth-child(2)').textContent.includes('giữ nguyên')`), true, 'The confirmation states that the folder stays')
  // Cancel keeps the workspace; Escape does not delete either.
  await evaluate(`[...document.querySelectorAll('.workspace-confirm button')].find(b=>b.textContent==='Hủy').click(); true`)
  await eventually(() => evaluate(`!document.querySelector('.workspace-confirm').open`), 'Cancel did not close the confirmation')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name')?.textContent`), 'Dự án Việt', 'Cancel keeps the workspace')
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:40,clientY:150})); document.querySelector('[data-action=remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-confirm').open`), 'The delete confirmation did not reopen')
  await evaluate(`document.querySelector('[data-action=confirm-remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true]')?.dataset.workspaceId === 'default' && !document.querySelector('.workspace-confirm').open`), 'Default workspace not in use after remove')
  await eventually(() => evaluate(`(() => { const heading=[...document.querySelectorAll('.chat-navigation nav h3')].find(h=>h.textContent==='Chat'); return !!heading && !!heading.closest('.chat-group').querySelector('[data-session-id="${projectChat}"]') })()`), 'Chat of the removed workspace is not ungrouped')
  assert.deepEqual(await tree(project), before, 'No file of the project folder was created, changed or deleted')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="${projectChat}"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer textarea').value === 'Nháp B'`), 'Ungrouped chat lost its draft')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]')?.dataset.workspaceId`), 'default', 'Opening an ungrouped chat keeps the workspace in use')
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

test('the folder dialog of the system adds a workspace and changes its folder; closing it changes nothing; without one the path is typed', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-picker-'))
  let app, session
  t.after(async () => {
    try {
      await closeBrowser(session)
      if (app) await app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  const first = join(dir, 'Báo cáo')
  const second = join(dir, 'Bài giảng')
  await mkdir(first)
  await mkdir(second)
  // The test stands in for the dialog: it answers with a folder, with null (the user closed it), or has none.
  let answer = 'unavailable'
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({
    dataDir: join(dir, 'data'),
    home: join(dir, 'home'),
    pickDirectory: async () => {
      if (answer === 'unavailable') throw new FolderPickerUnavailableError()
      if (answer === 'broken') throw new Error('no dialog')
      return answer
    },
  })
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('[data-action=add-workspace]')`), 'Browser boot failed')
  const rows = () => evaluate(`[...document.querySelectorAll('.workspace-row .workspace-name')].map(n => n.textContent).join('|')`)
  const add = () => evaluate(`document.querySelector('[data-action=add-workspace]').click(); document.querySelector('[data-action=add-folder-workspace]').click(); true`)
  const dialogOpen = () => evaluate(`document.querySelector('.workspace-dialog').open`)

  // The user closes the dialog: nothing is set up and no typing box opens (UC-013 A9).
  answer = null
  await add()
  await delay(500)
  assert.equal(await rows(), 'Workspace mặc định', 'Closing the folder dialog sets no workspace up')
  assert.equal(await dialogOpen(), false, 'Closing the folder dialog does not open the typing box')

  // The user chooses a folder: the workspace is set up and in use.
  answer = first
  await add()
  await eventually(async () => (await rows()) === 'Workspace mặc định|Báo cáo', 'The folder from the dialog did not become a workspace')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name').textContent`), 'Báo cáo')
  assert.equal(await dialogOpen(), false)
  // The view goes to the page of the workspace; no chat is made until the user types.
  const pageOf = () => evaluate(`document.querySelector('.workspace-home:not([hidden]) .workspace-home-name')?.textContent ?? ''`)
  await eventually(async () => (await pageOf()) === 'Báo cáo', 'Importing a folder did not show the page of the workspace')
  assert.equal((await storedChats(app)).length, 0, 'Importing a folder makes no chat')

  // Change the folder of that workspace through the dialog.
  answer = second
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 150 })); document.querySelector('[data-action=relink-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').title.endsWith('Bài giảng')`), 'The folder from the dialog did not replace the folder of the workspace')
  assert.equal(await dialogOpen(), false)
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name').textContent`), 'Báo cáo', 'Changing the folder keeps the name')

  // A dialog that does not open: the user types the full path instead.
  answer = 'broken'
  await add()
  await eventually(dialogOpen, 'The typing box did not open when the dialog failed')
  assert.equal(await evaluate(`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('hộp chọn thư mục')`), true, 'The box says why')
  await evaluate(`document.querySelector('.workspace-dialog input').value=${JSON.stringify(first)}; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(async () => !(await dialogOpen()) && (await rows()) === 'Workspace mặc định|Báo cáo|Báo cáo', 'The typed path did not set up a workspace')

  // A workspace with a name only: the plus button offers it next to the folder that exists.
  await evaluate(`document.querySelector('[data-action=add-workspace]').click(); document.querySelector('[data-action=new-workspace]').click(); true`)
  await eventually(dialogOpen, 'The name box did not open')
  assert.equal(await evaluate(`document.querySelector('.workspace-dialog h2').textContent`), 'Tạo workspace mới')
  await evaluate(`document.querySelector('.workspace-dialog input').value='Dự án mới'; document.querySelector('.workspace-dialog form').requestSubmit(); true`)
  await eventually(async () => !(await dialogOpen()) && (await rows()) === 'Workspace mặc định|Báo cáo|Báo cáo|Dự án mới', 'The workspace with a name only was not set up')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true] .workspace-name').textContent`), 'Dự án mới', 'The new workspace is the workspace in use')
  await eventually(async () => (await pageOf()) === 'Dự án mới', 'A workspace with a name only did not show its page')
  assert.equal((await storedChats(app)).length, 0, 'Setting up a workspace by name makes no chat')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').title`), 'Chưa gắn thư mục dự án')
  assert.equal(await evaluate(`!!document.querySelector('.workspace-row[aria-pressed=true] .workspace-flag')`), false, 'A workspace without a folder asks for no check')
  // A folder can be chosen for it later.
  const draft = join(dir, 'Bản thảo')
  await mkdir(draft)
  answer = draft
  // The options button of the page opens the menu of the workspace.
  await evaluate(`document.querySelector('.workspace-home-options').click(); true`)
  assert.equal(await evaluate(`document.querySelector('[data-action=relink-workspace]').checkVisibility() && document.querySelector('[data-action=relink-workspace]').textContent`), 'Chọn thư mục', 'The menu offers to choose the first folder')
  await evaluate(`document.querySelector('[data-action=relink-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').title.endsWith('Bản thảo')`), 'The folder was not chosen for the workspace')

  // The new chat of `Dự án mới` still waits. Removing that workspace moves the waiting chat to the workspace in use,
  // the default one, so the first character makes it there instead of failing on a workspace that is gone.
  await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 150 })); document.querySelector('[data-action=remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-confirm').open`), 'The delete confirmation did not open')
  await evaluate(`document.querySelector('[data-action=confirm-remove-workspace]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-row[aria-pressed=true]')?.dataset.workspaceId === 'default' && !document.querySelector('.workspace-confirm').open`), 'Default workspace not in use after remove')
  await eventually(async () => (await pageOf()) === 'Workspace mặc định', 'The waiting chat did not move to the page of the workspace in use')
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Sau khi xóa'; ta.dispatchEvent(new Event('input'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.workspace-item[data-workspace-id=default] button[data-session-id][aria-current=true]')`), 'The waiting chat was not made in the workspace in use')
  assert.equal((await storedChats(app)).length, 1, 'Typing makes exactly one chat')
  assert.equal(await evaluate(`document.querySelector('.conversation > [role=status]').hidden`), true, 'Making the chat reports no failure')

  // `Chat mới` shows a chat that belongs to no workspace, like ChatGPT, and the first character makes it; the workspace in use stays.
  const inUse = await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dataset.workspaceId`)
  await evaluate(`document.querySelector('[data-action=new-chat]').click(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])') && document.querySelector('.welcome-workspace').hidden && document.querySelector('.workspace-home').hidden`), 'The new chat of no workspace did not show')
  assert.equal((await storedChats(app)).length, 1, 'Pressing `Chat mới` makes no chat')
  await evaluate(`{const ta=document.querySelector('.composer textarea'); ta.value='Ý tưởng'; ta.dispatchEvent(new Event('input'))} true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-group button[data-session-id][aria-current=true]')`), 'The chat of no workspace was not created')
  assert.equal((await storedChats(app)).length, 2, 'Typing makes exactly one chat')
  assert.equal(await evaluate(`document.querySelector('.workspace-row[aria-pressed=true]').dataset.workspaceId`), inUse, 'The workspace in use does not change')
})
