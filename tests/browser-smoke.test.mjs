import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { workflowModel } from './fixtures/outline-workflow.mjs'
import { RuntimeError } from '../packages/agent/runtime/lib/index.js'

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

test('permission approval stays with its Chat across navigation and reload, and continuing grants can be revoked', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-permission-browser-'))
  const targetPath = join(dir, 'outside.txt')
  await writeFile(targetPath, 'Approved browser fixture')
  let app, browser, protocol
  t.after(async () => {
    if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
    if (browser && browser.exitCode === null) browser.kill()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const selection = { provider: 'fixture', model: 'permissions' }
  app = await startLocalWeb({ dataDir: join(dir,'data'), selection, model: { async *stream(request) {
    if (request.messages.at(-1).role === 'user') {
      yield { type: 'tool-call', call: { id: `read-${request.messages.length}`, name: 'read_file', arguments: { path: targetPath, scope: 'external' } } }
      yield { type: 'finish', reason: 'tool-calls' }
    } else { yield { type: 'text-delta', text: 'Permission step finished' }; yield { type: 'finish', reason: 'stop' } }
  } } })
  const api = async (path, method='GET', value) => {
    const response = await fetch(`${app.origin}/api/${path}`, { method, headers: { authorization: `Bearer ${app.token}`, 'content-type':'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }) })
    assert.ok(response.ok)
    return response.json()
  }
  const x = await api('sessions','POST',{selection}), y = await api('sessions','POST',{selection})
  browser = spawn(await browserPath(), ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${join(dir,'chrome')}`,'about:blank'], {stdio:'ignore',windowsHide:true})
  const port = await waitForBrowserPort(join(dir,'chrome'),browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true})
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const open = async id => {
    await evaluate(`document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(id)}]').click();true`)
    await eventually(() => evaluate(`document.querySelector('.chat-navigation [aria-current=true]')?.dataset.sessionId===${JSON.stringify(id)}`),'Chat did not open')
  }
  const send = async text => {
    await eventually(() => evaluate(`!document.querySelector('[aria-label="Send request"]').disabled`),'Composer unavailable')
    await evaluate(`(()=>{const input=document.querySelector('.composer textarea');input.value=${JSON.stringify(text)};input.dispatchEvent(new Event('input'));document.querySelector('.composer').requestSubmit();return true})()`)
  }
  await protocol.call('Page.navigate',{url:`${app.origin}/#token=${app.token}`})
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [aria-current=true]')`),'Initial Chat missing')
  await open(x.sessionId)
  await send('Read outside file')
  await eventually(() => evaluate(`!document.querySelector('.step-approval').hidden`),'Approval missing')
  assert.equal(await evaluate(`document.querySelector('.step-approval pre').textContent`),await realpath(targetPath))
  await evaluate(`window.oldApproval=document.querySelector('.step-approval button');(()=>{const input=document.querySelector('.composer textarea');input.value='Unsent draft';input.dispatchEvent(new Event('input'));return true})()`)
  await open(y.sessionId)
  assert.equal(await evaluate(`document.querySelector('.step-approval').hidden`),true)
  await evaluate(`window.oldApproval.click();true`)
  assert.equal((await api(`sessions/${x.sessionId}/requests`))[0].status,'awaiting_user')
  await open(x.sessionId)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.step-approval')?.hidden===false`),'Reload lost approval')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`),'Unsent draft')
  await evaluate(`document.querySelector('.step-approval button').click();true`)
  await eventually(() => evaluate(`document.querySelector('.step-approval').hidden && !document.querySelector('[aria-label="Send request"]').disabled`),'Denial did not resume request')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`),'Unsent draft')
  await send('Read again')
  await eventually(() => evaluate(`!document.querySelector('.step-approval').hidden`),'Second approval missing')
  await evaluate(`[...document.querySelectorAll('.step-approval button')].find(button=>button.textContent.includes('trong Chat')).click();true`)
  await eventually(() => evaluate(`document.querySelector('.step-approval').hidden && !!document.querySelector('.permission-picker button')`),'Continuing grant missing')
  await evaluate(`document.querySelector('.permission-picker').open=true;document.querySelector('.permission-picker button').click();true`)
  await eventually(async () => (await api(`sessions/${x.sessionId}/permissions`)).grants[0]?.revokedAt,'Grant not revoked')
  await evaluate(`(()=>{const select=document.querySelector('[aria-label="Chat permission"]');select.value='provided-materials-only';select.dispatchEvent(new Event('change'));return true})()`)
  await eventually(async () => (await api(`sessions/${x.sessionId}/permissions`)).preset==='provided-materials-only','Preset not saved')
  assert.equal((await api(`sessions/${y.sessionId}/permissions`)).preset,'workspace-access')
})

test('Chats and Workspaces remain navigable while work runs or awaits a reply', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-concurrent-browser-'))
  const hold = Promise.withResolvers()
  let app, browser, protocol
  let calls = 0
  t.after(async () => {
    hold.resolve()
    if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
    if (browser && browser.exitCode === null) browser.kill()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const selection = { provider: 'fixture', model: 'lifecycle' }
  app = await startLocalWeb({ dataDir: join(dir, 'data'), selection, model: { async *stream(request) {
    calls++
    const last = request.messages.at(-1)
    if (last.role === 'user' && last.content === 'X hold') {
      await Promise.race([hold.promise, new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }))])
      yield { type: 'text-delta', text: 'X finished in background' }
    } else if (last.role === 'user' && (last.content === 'X question' || last.content === 'Y question')) {
      yield { type: 'tool-call', call: { id: `ask-${request.messages.length}`, name: 'ask_clarification', arguments: {
        question: JSON.stringify({ prompt: `Question for ${last.content[0]} only?`, options: ['Answer X'], allowSkip: true }),
      } } }
      yield { type: 'finish', reason: 'tool-calls' }; return
    } else if (last.role === 'user' && last.content === 'Y finish') {
      yield { type: 'tool-call', call: { id: `missing-${request.messages.length}`, name: 'read_file', arguments: { path: 'missing.txt' } } }
      yield { type: 'finish', reason: 'tool-calls' }; return
    } else yield { type: 'text-delta', text: last.name === 'ask_clarification' ? 'Question for X only?' : last.content === 'Answer X' ? 'X answer received' : 'Y completed' }
    yield { type: 'finish', reason: 'stop' }
  } } })
  const api = async (path, method = 'GET', value) => {
    const response = await fetch(app.origin + path, { method,
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }) })
    assert.ok(response.ok)
    return response.json()
  }
  const x = await api('/api/sessions', 'POST', { selection })
  const y = await api('/api/sessions', 'POST', { selection })
  const project = join(dir, 'project')
  await mkdir(project)
  const workspace = await api('/api/workspaces', 'POST', { projectFolder: project })
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${join(dir, 'chrome')}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(join(dir, 'chrome'), browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const selected = id => evaluate(`document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(id)}]')?.getAttribute('aria-current')==='true'`)
  const open = async id => {
    await evaluate(`document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(id)}]').click();true`)
    await eventually(() => selected(id), 'Chat did not open')
  }
  const send = async text => {
    await eventually(() => evaluate(`!document.querySelector('[aria-label="Send request"]').disabled`), 'Composer not ready')
    await evaluate(`(()=>{const input=document.querySelector('.composer textarea');input.value=${JSON.stringify(text)};input.dispatchEvent(new Event('input'));document.querySelector('.composer').requestSubmit();return true})()`)
  }
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [aria-current=true]')`), 'Initial Chat missing')
  await open(x.sessionId)
  await send('X hold')
  await eventually(() => evaluate(`!!document.querySelector('.request-record[data-status=running]')`), 'X not running')
  const requestX = await evaluate(`document.querySelector('.request-record').dataset.requestId`)
  assert.equal(await evaluate(`document.querySelector('[data-action=new-chat]').disabled`), false, 'New Chat must remain available during X')
  await evaluate(`(()=>{const input=document.querySelector('.composer textarea');input.value='Draft X';input.dispatchEvent(new Event('input'));document.querySelector('[data-action=new-chat]').click();return true})()`)
  await eventually(() => evaluate(`document.querySelector('.chat-navigation [aria-current=true]')?.dataset.sessionId !== ${JSON.stringify(x.sessionId)}`), 'New Chat remained blocked')
  assert.equal((await api(`/api/requests/${requestX}`)).status, 'running')
  await open(y.sessionId)
  await send('Y finish')
  await eventually(() => evaluate(`!!document.querySelector('.request-record[data-status=completed]')`), 'Y did not finish independently')
  assert.equal(await evaluate(`!!document.querySelector('.activity-detail')`), true)
  const callsBeforeDetail = calls
  await evaluate(`document.querySelector('.request-record').open=true;document.querySelector('.activity-detail').open=true;true`)
  assert.equal(calls, callsBeforeDetail, 'Viewing detail starts no work')
  assert.equal((await api(`/api/requests/${requestX}`)).status, 'running')
  await evaluate(`(()=>{const picker=document.querySelector('[aria-label=Workspace]');picker.value=${JSON.stringify(workspace.id)};picker.dispatchEvent(new Event('change'));return true})()`)
  await eventually(() => evaluate(`document.querySelector('[aria-label=Workspace]').value===${JSON.stringify(workspace.id)}`), 'Workspace switch blocked')
  assert.equal((await api(`/api/requests/${requestX}`)).status, 'running')
  await evaluate(`(()=>{const picker=document.querySelector('[aria-label=Workspace]');picker.value='default';picker.dispatchEvent(new Event('change'));return true})()`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(x.sessionId)}]')`), 'Default history missing')
  hold.resolve()
  await eventually(() => evaluate(`document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(x.sessionId)}]')?.dataset.requestStatus==='completed'`), 'Background completion not reflected')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation [data-session-id=${JSON.stringify(x.sessionId)}]').dataset.unread`), 'true')
  await open(x.sessionId)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Draft X')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Y completed')`), false, 'Y output leaked into X')
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('X finished in background')`), 'X result not restored')
  await send('X question')
  await eventually(() => evaluate(`!document.querySelector('.clarification-question').hidden`), 'X question missing')
  await evaluate(`window.oldQuestionButton=document.querySelector('.clarification-question button');true`)
  await open(y.sessionId)
  assert.equal(await evaluate(`document.querySelector('.clarification-question').hidden`), true)
  await send('Y question')
  await eventually(() => evaluate(`document.querySelector('.clarification-question:not([hidden]) strong')?.textContent==='Question for Y only?'`), 'Y question missing')
  await evaluate(`window.oldQuestionButton.click();true`)
  assert.equal((await api(`/api/sessions/${x.sessionId}/requests`)).at(-1).status, 'awaiting_user', 'Detached reply must not answer another view')
  assert.equal((await api(`/api/sessions/${y.sessionId}/requests`)).at(-1).status, 'awaiting_user', 'Detached X reply must not answer Y question')
  await open(x.sessionId)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.clarification-question:not([hidden]) strong')?.textContent==='Question for X only?'`), 'Reload lost waiting question')
  await evaluate(`document.querySelector('.clarification-question button').click();true`)
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('X answer received')`), 'Reply did not resume X')
  assert.equal((await api(`/api/sessions/${y.sessionId}/history`)).some(message => message.content === 'Answer X'), false)
  await evaluate(`(()=>{const input=document.querySelector('.composer textarea');input.value='Second draft X';input.dispatchEvent(new Event('input'));return true})()`)
  await open(y.sessionId)
  await evaluate(`document.querySelector('[aria-label=Stop]').click();true`)
  await eventually(() => evaluate(`document.querySelectorAll('.request-record[data-status=cancelled]').length===1&&!document.querySelector('[aria-label="Send request"]').disabled`), 'Y Stop did not clear its waiting request')
  await evaluate(`window.originalLifecycleFetch=window.fetch;window.fetch=async(...args)=>{const response=await window.originalLifecycleFetch(...args);if(String(args[0]).endsWith('/api/requests')&&args[1]?.method==='POST'&&JSON.parse(args[1].body).input==='Y delayed'){window.receiptWaiting=true;await new Promise(resolve=>window.releaseReceipt=resolve);window.receiptReturned=true}return response};true`)
  await send('Y delayed')
  await eventually(() => evaluate(`window.receiptWaiting===true`), 'Delayed admission receipt was not held')
  await open(x.sessionId)
  await evaluate(`window.releaseReceipt();window.fetch=window.originalLifecycleFetch;true`)
  await eventually(() => evaluate(`window.receiptReturned===true`), 'Delayed receipt was not released')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Second draft X', 'Late Y receipt changed X draft')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Y delayed')`), false, 'Late Y receipt changed X history')
  await open(y.sessionId)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), '', 'Accepted background request must clear only its submitted draft')
})

test('workspace navigation creates owned Chats and keeps missing or removed folder history readable', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-workspace-browser-'))
  let app, browser, protocol
  t.after(async () => {
    if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
    if (browser && browser.exitCode === null) browser.kill()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const source = join(dir, 'project')
  await mkdir(source)
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'workspace' }, model: { async *stream() { yield { type: 'text-delta', text: 'Workspace reply' } } } })
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${join(dir, 'chrome')}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(join(dir, 'chrome'), browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('[data-action="add-workspace"]')`), 'Workspace controls missing')
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-session-id][aria-current="true"]')`), 'Initial Chat missing')
  await evaluate(`const draft=document.querySelector('.composer textarea');draft.value='Draft for Default';draft.dispatchEvent(new Event('input'));true`)
  await evaluate(`document.querySelector('[data-action="add-workspace"]').click();true`)
  await evaluate(`document.querySelector('[aria-label="Project folder path"]').value=${JSON.stringify(source)};document.querySelector('.workspace-dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('[aria-label="Workspace"]').selectedOptions[0].textContent.includes('project')`), 'Added workspace not selected')
  assert.equal(await evaluate(`document.querySelector('[aria-label="Send request"]').disabled`), true, 'Selected Workspace must not send into the previous Chat')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Draft for Default', 'Changing Workspace must preserve the previous Chat draft')
  await evaluate(`document.querySelector('[data-action="new-chat"]').click();true`)
  await eventually(() => evaluate(`document.querySelector('.chat-navigation nav [data-workspace-id]')?.dataset.workspaceId === document.querySelector('[aria-label="Workspace"]').value && !!document.querySelector('.chat-navigation nav [data-workspace-id] [data-session-id][aria-current="true"]') && !!document.querySelector('.welcome:not([hidden])')`), 'Owned chat missing')
  const chatId = await evaluate(`document.querySelector('.chat-navigation [data-session-id][aria-current="true"]').dataset.sessionId`)
  await evaluate(`const modelSelect=document.querySelector('.composer select');modelSelect.value=JSON.stringify({provider:'fixture',model:'workspace'});modelSelect.dispatchEvent(new Event('change'));true`)
  await eventually(() => evaluate(`!document.querySelector('[aria-label="Send request"]').disabled`), 'Model selection missing')
  await evaluate(`const ta=document.querySelector('.composer textarea');ta.value='Project request';ta.dispatchEvent(new Event('input'));document.querySelector('.composer').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('Workspace reply')`), 'Workspace request failed')
  await rename(source, join(dir, 'moved-project'))
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.workspace-notice')?.textContent.includes('không thể đọc')`), 'Missing folder notice absent')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Workspace reply')`), true, 'Missing folder must not hide conversation')
  const workspaceId = await evaluate(`document.querySelector('[aria-label="Workspace"]').value`)
  await evaluate(`document.querySelector('[data-action="repoint-workspace"]').click();document.querySelector('[aria-label="Project folder path"]').value=${JSON.stringify(join(dir, 'absent'))};document.querySelector('.workspace-dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.workspace-dialog [role="alert"]').textContent.includes('Không thể đọc thư mục')`), 'Invalid folder must explain how to recover')
  assert.equal(await evaluate(`document.querySelector('[aria-label="Workspace"]').value`), workspaceId)
  await evaluate(`document.querySelector('[aria-label="Project folder path"]').value=${JSON.stringify(join(dir, 'moved-project'))};document.querySelector('.workspace-dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`!document.querySelector('.workspace-dialog').open && document.querySelector('.workspace-notice').hidden`), 'Repoint must restore folder access')
  assert.equal(await evaluate(`document.querySelector('[aria-label="Workspace"]').value`), workspaceId, 'Repoint keeps Workspace identity')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation [data-session-id][aria-current="true"]').dataset.sessionId`), chatId, 'Repoint keeps Chat identity')
  await evaluate(`window.confirm=()=>false;document.querySelector('[data-action="remove-workspace"]').click();true`)
  assert.equal(await evaluate(`document.querySelector('[aria-label="Workspace"]').value !== 'default'`), true, 'Cancelled removal keeps workspace')
  await evaluate(`window.confirm=()=>true;document.querySelector('[data-action="remove-workspace"]').click();true`)
  await eventually(() => evaluate(`!!document.querySelector('.chat-navigation [data-workspace-id="ungrouped"] [data-session-id=${JSON.stringify(chatId)}]')`), 'Removed workspace Chat must stay ungrouped')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Workspace reply')`), true)
})

test('interactive composer selects a model without work, sends with Enter and preserves per-chat drafts on reload', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-interactive-'))
  let app, browser, protocol
  let calls = 0
  t.after(async () => {
    if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
    if (browser && browser.exitCode === null) browser.kill()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const profile = join(dir, 'chrome')
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'interactive' }, model: { async *stream() { calls++; yield { type: 'text-delta', text: 'Saved fixture reply' } } } })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!document.querySelector('.welcome:not([hidden])')`), 'Welcome missing')
  assert.equal(await evaluate(`!!document.querySelector('[aria-label="Chọn model"]')`), true, 'The composer must offer the provider/model popover')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.model-options button')`), 'Model popover empty')
  await evaluate(`document.querySelector('.model-options button').click(); true`)
  await eventually(() => evaluate(`!document.querySelector('.composer select').disabled && document.querySelector('.composer select').value !== ''`), 'Selection not saved')
  assert.equal(calls, 0, 'Selecting a model must not start work')
  await evaluate(`const ta=document.querySelector('.composer textarea'); ta.value='A draft'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true,cancelable:true})); ta.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true})); true`)
  await delay(100)
  assert.equal(calls, 0, 'Shift+Enter and IME Enter must not send')
  await evaluate(`document.querySelector('.composer textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('Saved fixture reply')`), 'Enter did not send')
  assert.equal(calls, 1)
  await evaluate(`const draftInput=document.querySelector('.composer textarea'); draftInput.value='Draft after reply';draftInput.dispatchEvent(new Event('input'));true`)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.composer textarea')?.value === 'Draft after reply'`), 'Reload lost the draft')
  await evaluate(`document.querySelector('[data-action=new-chat]').click();true`)
  await eventually(() => evaluate(`!document.querySelector('.welcome').hidden`), 'New chat did not open')
  assert.equal(await evaluate(`document.querySelector('.composer select').value.includes('interactive')`), true, 'New chat inherits the last selectable model in this tab')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), '')
  const before = await evaluate(`document.querySelectorAll('.chat-navigation nav button').length`)
  await evaluate(`document.querySelector('[data-action=new-chat]').click();true`)
  await delay(100)
  assert.equal(await evaluate(`document.querySelectorAll('.chat-navigation nav button').length`), before, 'New chat must not create duplicates while already empty')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('.model-manage').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').open`), 'Settings missing')
  assert.equal(await evaluate(`document.querySelector('dialog').matches(':modal')`), false, 'Settings is a workspace page')
  await evaluate(`document.querySelector('[aria-label="Display name"]').value='Unsaved';document.querySelector('[aria-label="Display name"]').dispatchEvent(new Event('input',{bubbles:true}));window.confirm=()=>false;document.querySelector('.settings-back').click();true`)
  assert.equal(await evaluate(`document.querySelector('dialog').open`), true, 'Declining discard must keep Settings open')
  await evaluate(`window.confirm=()=>true;document.querySelector('.settings-back').click();true`)
  await eventually(() => evaluate(`!document.querySelector('dialog').open`), 'Settings did not close after discard')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('[aria-label="Thêm provider"]').click();true`)
  await eventually(() => evaluate(`document.querySelector('dialog').matches(':modal')`), 'Quick provider wizard did not open')
  await evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Tiếp tục →').click();document.querySelector('[aria-label="Provider ID"]').value='wizard-api';document.querySelector('[aria-label="Display name"]').value='Wizard API';document.querySelector('[aria-label="API protocol"]').value='responses';document.querySelector('[aria-label="API protocol"]').dispatchEvent(new Event('change'));document.querySelector('[aria-label="Base URL"]').value='http://127.0.0.1:1';document.querySelector('dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`document.querySelector('.settings-header h2').textContent.includes('3/3')`), 'Wizard did not save the connection and advance')
  await evaluate(`document.querySelector('[aria-label="Thêm bằng model ID"]').value='wizard-model';document.querySelector('.manual-model-row button').click();document.querySelector('.model-metadata [aria-label="Display name"]').value='Wizard Model';document.querySelector('.model-metadata [aria-label="Display name"]').dispatchEvent(new Event('input'));document.querySelector('.model-metadata [aria-label^="Reasoning levels"]').value='Deep=high';document.querySelector('.model-metadata [aria-label^="Reasoning levels"]').dispatchEvent(new Event('input'));document.querySelector('dialog form').requestSubmit();true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.composer select option')].some(option=>option.value.includes('wizard-model'))`), 'Wizard did not save model IDs')
  await evaluate(`[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Xong').click();true`)
  await eventually(() => evaluate(`!document.querySelector('dialog').open`), 'Wizard did not return to chat')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.model-tabs button')].some(button=>button.textContent==='Wizard API')`), 'New provider absent from picker')
  await evaluate(`[...document.querySelectorAll('.model-tabs button')].find(button=>button.textContent==='Wizard API').click();true`)
  assert.equal(await evaluate(`[...document.querySelectorAll('.model-options button')].some(button=>button.textContent==='Wizard Model · Deep')`), true, 'Only configured model effort should appear')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();true`)
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();document.querySelector('.model-manage').click();true`)
  await eventually(() => evaluate(`document.querySelector('.settings-dialog').open`), 'Model settings did not open')
  await evaluate(`(()=>{const chooser=document.querySelector('[aria-label="Provider configuration"]');chooser.value='wizard-api';chooser.dispatchEvent(new Event('change'));const context=document.querySelector('.model-metadata [aria-label="Context window"]');context.value='10';context.dispatchEvent(new Event('input'));const output=document.querySelector('.model-metadata [aria-label="Max output tokens"]');output.value='20';output.dispatchEvent(new Event('input'));document.querySelector('.settings-dialog form').requestSubmit();return true})()`)
  await eventually(() => evaluate(`document.querySelector('.settings-body [role=status]').textContent.includes('max output')`), 'Invalid model metadata was not explained')
  assert.equal(await evaluate(`document.querySelector('.model-metadata [aria-label="Max output tokens"]').value`), '20', 'Failed save must preserve the draft')
  const savedWizard = await (await fetch(`${app.origin}/api/settings`, { headers: { authorization: `Bearer ${app.token}` } })).json()
  assert.equal(savedWizard.providers.find(provider => provider.id === 'wizard-api').modelMetadata[0].contextWindow, undefined, 'Failed save changed saved model settings')
  await evaluate(`window.confirm=()=>true;document.querySelector('.settings-back').click();true`)
  await eventually(() => evaluate(`!document.querySelector('.settings-dialog').open`), 'Model settings did not close')
  assert.equal(await evaluate(`document.querySelector('.composer select').value.includes('interactive')`), true, 'Adding a provider must not change the selected model')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`)
  assert.equal(await evaluate(`document.querySelector('.conversation').getBoundingClientRect().width >= 360`), true, 'Mobile chat must wrap below the rail with usable width')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click();true`)
  assert.equal(await evaluate(`(() => {const panel=document.querySelector('.model-popover');const box=panel.getBoundingClientRect();return panel.checkVisibility()&&box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight;})()`), true, 'Model popover must remain visible inside mobile viewport')
  assert.equal(calls, 1, 'New chat, reload and Settings must not start work')
})

test('clarification UI waits, restores after reload and answers without sending the unsent draft', { timeout: 45000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-question-browser-'))
  let app, browser, protocol
  let calls = 0
  const base = workflowModel()
  t.after(async () => {
    if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
    if (browser && browser.exitCode === null) browser.kill()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'question-ui' }, model: { async *stream(request) {
      calls++
      const last = request.messages.at(-1)
      if (last.role === 'user' && (last.content === 'Tạo bài trình bày' || last.content === 'Hỏi lại')) {
        yield { type: 'tool-call', call: { id: `ask-ui-${request.messages.length}`, name: 'ask_clarification', arguments: {
          question: JSON.stringify({ prompt: 'Bạn muốn nói về chủ đề gì?', options: ['Tái chế'], allowSkip: true }),
        } } }
        yield { type: 'finish', reason: 'tool-calls' }
      } else if (last.name === 'ask_clarification') {
        yield { type: 'text-delta', text: 'Bạn muốn nói về chủ đề gì?' }
        yield { type: 'finish', reason: 'stop' }
      } else yield* base.stream(request)
    } } })
  const profile = join(dir, 'chrome')
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  // Hold initial chat creation so the model catalog is visible before the chat is ready.
  await protocol.call('Page.enable')
  const startup = await protocol.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const startupFetch = window.fetch;
    window.fetch = async (...args) => {
      if (String(args[0]).endsWith('/api/sessions') && args[1]?.method === 'POST') {
        window.fetch = startupFetch;
        await new Promise(resolve => { window.releaseChatCreation = resolve; });
      }
      return startupFetch(...args);
    };
  ` })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`!!window.releaseChatCreation && !!document.querySelector('.composer select option[value]:not([value=""])')`), 'Startup gate or models missing')
  await protocol.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: startup.identifier })
  assert.equal(await evaluate(`document.querySelector('.composer select').disabled`), true, 'The catalog alone must not enable selection before the chat is ready')
  await evaluate(`window.releaseChatCreation(); delete window.releaseChatCreation; true`)
  await eventually(() => evaluate(`document.querySelector('[aria-label="Chọn model"]')?.disabled === false`), 'Chat not ready for model selection')
  await evaluate(`document.querySelector('[aria-label="Chọn model"]').click(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.model-options button')].some(button => button.textContent === 'question-ui' && !button.disabled)`), 'Clarification model missing')
  await evaluate(`[...document.querySelectorAll('.model-options button')].find(button => button.textContent === 'question-ui').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.composer select').value === JSON.stringify({provider:'fixture',model:'question-ui'}) && !document.querySelector('.composer select').disabled && !document.querySelector('[aria-label="Send request"]').disabled`), 'Clarification model selection not saved')
  assert.equal(calls, 0, 'Opening a chat and selecting a model must not start Agent work')
  await evaluate(`const ta=document.querySelector('.composer textarea'); ta.value='Tạo bài trình bày'; document.querySelector('.composer').requestSubmit(); true`)
  await eventually(() => evaluate(`!!document.querySelector('.clarification-question:not([hidden]) button')`), 'Question controls missing')
  const before = calls
  await delay(100)
  assert.equal(calls, before, 'Silence must not poll the model')
  assert.equal(await evaluate(`document.querySelector('.chat-state').textContent`), 'Đang chờ bạn trả lời')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  if (process.env.DECKAGENT_CLARIFICATION_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_CLARIFICATION_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  const geometry = await evaluate(`({question:document.querySelector('.clarification-question').getBoundingClientRect().toJSON(),composer:document.querySelector('.composer').getBoundingClientRect().toJSON(),width:innerWidth,height:innerHeight})`)
  assert.equal(geometry.question.left>=0 && geometry.question.right<=geometry.width && geometry.composer.bottom<=geometry.height, true, `Question and composer must stay usable: ${JSON.stringify(geometry)}`)
  await evaluate(`const savedDraft=document.querySelector('.composer textarea'); savedDraft.value='Giữ bản nháp này';savedDraft.dispatchEvent(new Event('input'));true`)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`!!document.querySelector('.clarification-question:not([hidden]) button:not(:disabled)')`), 'Reload lost the pending question')
  assert.equal(calls, before)
  await evaluate(`document.querySelector('.clarification-options button').click();true`)
  await eventually(async () => {
    const state = await evaluate(`({outline:!!document.querySelector('.outline-proposal'), status:document.querySelector('.request-record')?.dataset.status, feedback:document.querySelector('.conversation > [role=status]')?.textContent})`)
    if (state.status === 'failed') throw new Error(`Answer failed: ${JSON.stringify(state)}`)
    return state.outline && state.status === 'completed'
  }, 'Answer did not produce outline')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Giữ bản nháp này')
  assert.equal(await evaluate(`[...document.querySelectorAll('.message.user')].filter(node=>node.textContent.includes('Tái chế')).length`), 1)
  assert.equal(await evaluate(`document.querySelectorAll('.request-record').length`), 1)
  await evaluate(`const ta=document.querySelector('.composer textarea'); ta.value='Hỏi lại'; document.querySelector('.composer').requestSubmit();true`)
  await eventually(() => evaluate(`!!document.querySelector('.clarification-question:not([hidden]) button')`), 'Second question missing')
  await evaluate(`document.querySelector('[aria-label=Stop]').click();true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1).dataset.status==='cancelled'`), 'Stop did not end waiting')
  assert.equal(await evaluate(`document.querySelector('.clarification-question').hidden`), true)
})

test('outline conversation confirms in a new request, preserves viewing state and progressively opens the deck', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-outline-browser-'))
  let app, browser, protocol, releaseSecond
  const secondReady = new Promise(resolve => { releaseSecond = resolve })
  let modelCalls = 0
  const fixture = workflowModel(async (id, signal) => {
    if (id === 'slide-2') await Promise.race([secondReady, new Promise(resolve => {
      if (signal.aborted) resolve()
      else signal.addEventListener('abort', resolve, { once: true })
    })])
  })
  t.after(async () => {
    releaseSecond()
    try {
      if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
      if (browser && browser.exitCode === null) browser.kill()
      await app?.close()
    } finally { await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) }
  })
  const profile = join(dir, 'chrome')
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error('Browser script failed')
    return result.result.value
  }
  app = await startLocalWeb({ workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'outline' }, model: { async *stream(request) { modelCalls++; yield* fixture.stream(request) } } })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate(`document.querySelector('.conversation select')?.options.length > 1 && !document.querySelector('.conversation select').disabled`), 'Models did not load')
  await evaluate(`document.querySelector('.conversation select').selectedIndex=1;document.querySelector('.conversation select').dispatchEvent(new Event('change'));true`)
  await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Model not selected')
  await evaluate(`document.querySelector('.composer textarea').value='Create two slides about recycling';[...document.querySelectorAll('.chat-more-actions button')].find(b=>b.textContent==='Đề xuất outline').click();true`)
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=current]') && !document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Current outline missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').hidden`), true)
  assert.equal(await evaluate(`document.querySelectorAll('.outline-proposal .planned-slide').length`), 2)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 0)
  const before = modelCalls
  await evaluate(`[...document.querySelectorAll('.outline-viewing button')].find(b=>b.textContent==='Mở chi tiết').click();document.querySelector('.planned-slide summary').focus();true`)
  await delay(950)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 2)
  assert.equal(await evaluate(`document.activeElement===document.querySelector('.planned-slide summary')`), true)
  assert.equal(modelCalls, before, 'Viewing detail must send no Agent request')
  assert.equal(await evaluate(`document.querySelectorAll('.request-record').length`), 1)
  if (process.env.DECKAGENT_OUTLINE_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_OUTLINE_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  await evaluate(`[...document.querySelectorAll('.outline-dock .outline-actions button')].find(b=>b.textContent==='①  Xác nhận outline và tạo slide').click();true`)
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=confirmed]') && document.querySelector('.published-deck-sidebar .deck-slide-list [title$="Bản 1"]') !== null`), 'First slide missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').hidden`), false)
  assert.equal(await evaluate(`!!document.querySelector('.published-deck-sidebar .deck-slide-list [data-status=pending]')`), true)
  assert.equal(await evaluate(`document.querySelector('.outline-dock').hidden`), true)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 2, 'Confirmation preserves reading state')
  await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list button').click();true`)
  releaseSecond()
  await eventually(() => evaluate(`document.querySelectorAll('.request-record[data-status=completed]').length===2 && !document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Confirmation request did not finish')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar [aria-current=true]').getAttribute('aria-label')`), '1. Why recycle · Bản 1')
  assert.equal(await evaluate(`!!document.querySelector('.published-deck-sidebar .deck-slide-list [data-status=pending]')`), false)
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Local rules were not checked')`), true)
  assert.equal(await evaluate(`document.querySelector('.chat-state').textContent.includes('Chờ xác nhận outline')`), false, 'Confirmed decks must not keep asking for confirmation')
  if (process.env.DECKAGENT_WORKFLOW_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_WORKFLOW_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=confirmed]') && document.querySelector('.published-deck-sidebar .deck-slide-list [title$="Bản 1"]') !== null`), 'Reload lost confirmed outline/deck')
})

test('Deck Canvas renders published revisions over SSE, keeps selection and restores content after Host restart', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-canvas-browser-'))
  let app, browser, protocol
  t.after(async () => {
    try {
      if (protocol) { await protocol.call('Browser.close').catch(() => {}); protocol.close() }
      if (browser && browser.exitCode === null) browser.kill()
      await app?.close()
    } finally { await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }) }
  })
  const profile = join(dir, 'chrome')
  browser = spawn(await browserPath(), ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true })
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(`Browser script failed: ${result.exceptionDetails.text}`)
    return result.result.value
  }
  const options = {
    workspace: join(dir, 'workspace'), dataDir: join(dir, 'data'),
    confirmedDecks: [
      { sessionId: 'browser-deck', outlineId: 'confirmed', slides: [{ slideId: 'intro', title: 'Introduction' }, { slideId: 'second', title: 'Second' }, { slideId: 'draft', title: 'Unpublished' }] },
      { sessionId: 'large-deck', outlineId: 'large', slides: Array.from({ length: 60 }, (_, index) => ({ slideId: `slide-${index}`, title: `Long deck slide ${index + 1}` })) },
    ],
    selection: { provider: 'fixture', model: 'canvas' },
    model: { async *stream(request) {
      const user = [...request.messages].reverse().find(m => m.role === 'user').content
      if (user.includes('Force provider failure')) throw new RuntimeError('PROVIDER_HTTP', 'fixture-provider-body-must-stay-private')
      // Host task may contain older source material. Choose the currently granted ID, not a word in that material.
      const granted = /^Host-authorized slide IDs: (\[[^\n]*?\])\./m.exec(request.messages[0].content)
      const slideId = granted ? JSON.parse(granted[1])[0] : undefined
      assert.ok(slideId, 'Canvas fixture requires a Host-authorized target')
      const last = request.messages.at(-1)
      if (last.role === 'user') {
        yield { type: 'tool-call', call: { id: `write-${slideId}`, name: 'write_file', arguments: { path: `${slideId}.html`, content: `<style>body{background:#eef4dd}h1{color:rgb(0, 100, 0)}</style><h1>${slideId} published</h1>` } } }
      } else if (last.name === 'write_file') {
        yield { type: 'tool-call', call: { id: `publish-${slideId}`, name: 'publish_slide', arguments: { outlineId: 'confirmed', slideId, expectedRevision: 0, publicationId: `publish-${slideId}`, path: `${slideId}.html` } } }
      } else {
        yield { type: 'text-delta', text: `Published ${slideId}` }; yield { type: 'finish', reason: 'stop' }; return
      }
      yield { type: 'finish', reason: 'tool-calls' }
    } },
  }
  app = await startLocalWeb(options)
  await writeFile(join(dir, 'workspace', 'unpublished.html'), '<h1>PRIVATE DRAFT</h1>')
  const navigate = async () => {
    await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [data-session-id="browser-deck"]'))`), 'Fixture Session missing')
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [aria-current=true]'))`), 'Initial chat did not finish opening')
    await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
    await eventually(() => evaluate(`!!document.querySelector('.published-deck-sidebar .deck-slide-list [title*="Unpublished"]')`), 'Deck plan missing')
  }
  await navigate()
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] small').textContent`), 'No slides yet', 'A confirmed plan with pending slides is not a published deck')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').hidden`), true)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-placeholder').hidden`), false, 'Pending slides need a visible canvas placeholder')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-progress').textContent`), '0/3 slide đã lưu')
  assert.equal(await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(button=>button.textContent==='◀ Trước').disabled`), true, 'Previous must be disabled at the first slide')
  assert.equal(await evaluate(`document.querySelector('.deck-stage').getBoundingClientRect().bottom <= document.querySelector('.published-deck-sidebar .deck-slide-list').getBoundingClientRect().top`), true, 'Canvas must precede the slide strip')
  const send = async text => {
    await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Composer unavailable')
    await evaluate(`document.querySelector('.composer textarea').value=${JSON.stringify(text)}; document.querySelector('.composer').requestSubmit(); true`)
  }
  await send('Publish slide 1 first')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('intro published')`), 'First published content missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-progress').textContent`), '1/3 slide đã lưu')
  await eventually(() => evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] small').textContent === 'Has slides'`), 'History must reflect real publication')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-placeholder').hidden`), true)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').getAttribute('sandbox')`), '')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').contentDocument === null`), true)
  await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [aria-current=true]').focus(); true`)
  await send('Publish slide 2 second')
  await eventually(() => evaluate(`!!document.querySelector('.published-deck-sidebar .deck-slide-list [title="2. Second · Bản 1"]')`), 'Second publication did not arrive over SSE')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.querySelector('.request-state').textContent.includes('Đã lưu cập nhật 1 slide')`), 'Outcome must count this request publication receipt, not cumulative deck state')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [aria-current=true]').getAttribute('aria-label')`), '1. Introduction · Bản 1')
  assert.equal(await evaluate(`document.activeElement === document.querySelector('.published-deck-sidebar .deck-slide-list [aria-current=true]')`), true, 'Publication must preserve focus on slide controls')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-progress').textContent`), '2/3 slide đã lưu')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('PRIVATE DRAFT')`), false)
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Sau ▶').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('second published')`), 'Slide navigation failed')
  await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [data-status=pending]').click(); true`)
  assert.equal(await evaluate(`!document.querySelector('.published-deck-sidebar .deck-placeholder').hidden && document.querySelector('.published-deck-sidebar iframe').hidden`), true, 'Selecting pending must show a placeholder without old HTML')
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(button=>button.textContent==='◀ Trước').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('second published')`), 'Returning from pending lost the saved slide')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="large-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').children.length === 60`), 'Large deck did not load')
  assert.equal(await evaluate(`(() => { const strip=document.querySelector('.published-deck-sidebar .deck-slide-list'); const stage=document.querySelector('.deck-stage'); return strip.getBoundingClientRect().height <= 100 && strip.scrollWidth>strip.clientWidth && stage.getBoundingClientRect().height>=180 && stage.getBoundingClientRect().bottom<=strip.getBoundingClientRect().top; })()`), true, 'Large decks must scroll horizontally without crowding out the canvas')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe')?.srcdoc.includes('second published')`), 'Returning from large deck lost selection')
  const savedModel = await evaluate(`document.querySelector('.conversation select').value`)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.dataset.action==='new-chat').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').children.length === 0 && document.querySelector('.conversation select').value === ''`), 'Empty chat did not open independently')
  await evaluate(`document.querySelector('.chat-navigation [data-session-id="browser-deck"]').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe')?.srcdoc.includes('second published')`), 'History did not restore the deck and its selected slide')
  assert.equal(await evaluate(`document.querySelector('.conversation select').value`), savedModel, 'History must restore its own model')
  assert.equal((await (await fetch(`${app.origin}/api/sessions/browser-deck/requests`, { headers: { authorization: `Bearer ${app.token}` } })).json()).length, 2, 'History must not send a new request')
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
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Toàn màn hình').click(); true`)
  await eventually(() => evaluate('Boolean(document.fullscreenElement)'), 'Published deck fullscreen failed')
  await evaluate('document.exitFullscreen(); true')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe')?.srcdoc.includes('intro published')`), 'Reload did not restore published content')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '640px', 'Dragged width must survive reload')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 680, height: 1000, deviceScaleFactor: 1, mobile: false })
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.published-deck-sidebar [role=separator]')).display`), 'none', 'Stacked mobile layout must hide horizontal resizing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').getBoundingClientRect().width <= innerWidth`), true)
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await app.close()
  app = await startLocalWeb(options)
  await navigate()
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] strong').textContent`), 'Publish slide 1 first', 'History title must survive Host restart')
  assert.equal(await evaluate(`document.querySelector('.chat-navigation nav button[aria-current=true] small').textContent`), 'Has slides', 'Published state must survive Host restart')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('intro published')`), 'Host restart lost slide content')
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
  await send('Edit slide 2: Force provider failure')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.dataset.status === 'failed'`), 'Provider failure did not finish the turn')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).querySelector('.request-state').textContent`), 'Yêu cầu tới provider thất bại')
  assert.equal(await evaluate(`document.querySelector('.request-notice[data-status=failed]')?.checkVisibility()`), true, 'A failure must remain visible with Activity collapsed')
  assert.equal(await evaluate(`[...document.querySelectorAll('.messages > .message.assistant')].some(node => node.textContent.includes('Finished revisions were kept'))`), false, 'Verbose Host recovery notice must move into Activity')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).textContent.includes('PROVIDER_HTTP')`), true, 'Error code must remain available in details')
  assert.equal(await evaluate(`document.body.textContent.includes('fixture-provider-body-must-stay-private')`), false)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.querySelector('.request-recovery-details')?.textContent.includes('Finished revisions were kept')`), 'Reload must retain the full recovery notice inside its own Activity')
  await protocol.call('Page.captureScreenshot', { format: 'png' }).then(async result => {
    await writeFile(process.env.DECKAGENT_CANVAS_SCREENSHOT ?? join(dir, 'canvas.png'), Buffer.from(result.data, 'base64'))
  })
})

test('real browser boots, sends an Agent request, shows completion and restores history after reload', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-browser-'))
  let app
  let browser
  let protocol
  let releaseModel
  let modelRequests = 0
  const modelReady = new Promise(resolve => {
    releaseModel = resolve
  })
  t.after(async () => {
    releaseModel()
    try {
      if (protocol) {
        // Browser.close may close the transport before acknowledging the command.
        await protocol.call('Browser.close').catch(() => {})
        protocol.close()
      }
      if (browser && browser.exitCode === null) browser.kill()
      if (app) await app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  const profile = join(dir, 'chrome')
  browser = spawn(
    await browserPath(),
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true },
  )
  const port = await waitForBrowserPort(profile, browser)
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  protocol = await connect(target.webSocketDebuggerUrl)
  const evaluate = async expression => {
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true })
    if (result.exceptionDetails) throw new Error('Browser script failed')
    return result.result.value
  }
  app = await startLocalWeb({
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'browser' },
    model: {
      async *stream(request) {
        modelRequests++
        const forgedReceipt = request.messages.findLast(message => message.role === 'user')?.content === 'Read forged receipt'
        if (request.messages.at(-1).content === 'Stop fixture') {
          await new Promise((_, reject) => {
            if (request.signal.aborted) reject(request.signal.reason)
            else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
          })
        }
        if (forgedReceipt && request.messages.at(-1).name === 'write_file' && !request.messages.at(-1).isError) {
          yield { type: 'tool-call', call: { id: `read-receipt-${request.messages.length}`, name: 'read_file', arguments: { path: 'receipt.json' } } }
          yield { type: 'finish', reason: 'tool-calls' }
        } else if (request.messages.at(-1).role === 'tool') {
          yield { type: 'text-delta', text: request.messages.at(-1).isError ? 'Write denied' : 'Browser HTML created' }
          yield { type: 'finish', reason: 'stop' }
        } else {
          await modelReady
          yield {
            type: 'tool-call',
            call: {
              id: `browser-file-${request.messages.length}`,
              name: 'write_file',
              arguments: forgedReceipt ? { path: 'receipt.json', content: JSON.stringify({ sessionId: 'fake', deckId: 'fake', slideId: 'fake', version: 2, revision: 1 }) } : {
                path: request.messages.at(-1).content.includes('outside') ? '../outside.html' : 'browser.html',
                content: '<h1>Browser round-trip</h1>',
              },
            },
          }
          yield { type: 'finish', reason: 'tool-calls' }
        }
      },
    },
  })
  await protocol.call('Page.enable')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate('document.querySelector(".conversation select")?.options.length > 1 && !document.querySelector(".conversation select").disabled'), 'Browser boot failed')
  assert.equal(await evaluate(`document.querySelector('.composer select') !== null`), true, 'Model picker belongs in the Composer')
  assert.equal(await evaluate(`document.querySelector('.welcome').hidden`), false, 'Empty chat must show welcome state')
  assert.equal(await evaluate(`document.querySelector('.conversation-header h1').textContent`), 'Chat mới')
  assert.equal(await evaluate(`document.querySelector('.conversation-header').textContent.includes('Open sample deck')`), false, 'Sample tools must not crowd the chat header')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').getBoundingClientRect().height < 95`), true, 'Empty Composer must be compact')
  await evaluate(`document.querySelector('.conversation select').selectedIndex=1; document.querySelector('.conversation select').dispatchEvent(new Event('change')); true`)
  await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Model selection was not saved')
  await evaluate(
    `document.querySelector('.composer textarea').value='Create HTML'; document.querySelector('.composer').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages .request-record')?.dataset.status === 'running'`),
    'Browser did not show running status',
  )
  assert.equal(await evaluate(`document.querySelector('.welcome').hidden`), true, 'Welcome must disappear after sending')
  assert.equal(await evaluate(`document.querySelector('.conversation-header h1').textContent`), 'Create HTML', 'Header derives its title from saved user history')
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Send request"]').hidden && !document.querySelector('.composer [aria-label="Stop"]').hidden`), true, 'Stop replaces Send while active')
  await evaluate(`document.querySelector('.composer textarea').value='Next unsent request'; document.querySelector('.composer textarea').dispatchEvent(new Event('input')); true`)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').disabled`), false, 'Active work must allow drafting')
  assert.equal(await evaluate(`Boolean(document.querySelector('.conversation > .activities'))`), false, 'Activity must not reserve a separate footer below chat')
  assert.equal(await evaluate(`Boolean(document.querySelector('.messages .request-record'))`), true, 'Each request must have an inline activity record')
  await eventually(() => evaluate(`document.querySelector('.request-record').previousElementSibling?.textContent.includes('Create HTML')`), 'Request record is not anchored to its user message')
  await eventually(() => evaluate(`document.querySelector('.request-record .activity-count').textContent.includes('1 hoạt động')`), 'Running activity count did not update')
  await eventually(() => evaluate(`document.querySelector('.request-record .request-state').textContent === 'Đang chờ model'`), 'Phase must reflect actual running model activity')
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), false, 'Running request defaults to collapsed')
  assert.equal(await evaluate(`document.querySelector('.request-record').getBoundingClientRect().height <= 48`), true, 'Collapsed activity should occupy a single line')
  assert.equal(await evaluate(`document.querySelector('.messages').clientHeight >= document.querySelector('.conversation').clientHeight * .5`), true, 'Chat should retain most available vertical space')
  const requestsBeforeViewing = modelRequests
  assert.equal(await evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].every(button => !button.disabled)`), true, 'History must remain available while work runs')
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.dataset.action === 'new-chat').disabled`), false)
  await evaluate(`document.querySelector('.request-record > summary').click(); document.querySelector('.request-record > summary').focus(); true`)
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), true)
  await delay(900)
  assert.equal(await evaluate(`document.querySelector('.request-record').open && document.activeElement === document.querySelector('.request-record > summary')`), true, 'Polling must preserve expanded state and keyboard focus')
  await evaluate(`document.querySelector('.request-record > summary').click(); true`)
  await delay(900)
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), false, 'Polling must keep a running request collapsed')
  assert.equal(modelRequests, requestsBeforeViewing, 'Reading activities must not start Agent work')
  await protocol.call('Page.reload')
  await eventually(
    () => evaluate(`document.querySelector('.messages .request-record')?.dataset.status === 'running'`),
    'Browser did not reconnect to active request',
  )
  releaseModel()
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`),
    'Browser did not show Agent result',
  )
  assert.equal(await evaluate(`document.querySelector('.request-record .request-state').textContent`), 'Lượt đã kết thúc')
  await eventually(() => evaluate(`document.querySelector('.request-record .activity-count').textContent.includes('3 hoạt động')`), 'Completed activity count was not retained')
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), false, 'Completion must not force activity details open')
  assert.equal(await evaluate(`document.querySelector('.conversation > [role=status]').hidden`), true, 'Request status must appear once, in its record')
  const artifactOwner = await evaluate(`({ sessionId:document.querySelector('.chat-navigation [data-session-id][aria-current="true"]').dataset.sessionId, requestId:document.querySelector('.request-record').dataset.requestId })`)
  const chatRoot = createHash('sha256').update(artifactOwner.sessionId).digest('hex')
  assert.equal(await readFile(join(dir, 'workspace', chatRoot, artifactOwner.requestId, 'browser.html'), 'utf8'), '<h1>Browser round-trip</h1>')
  await assert.rejects(readFile(join(dir, 'workspace', 'browser.html')), { code: 'ENOENT' })
  assert.equal(await evaluate(`document.querySelectorAll('.messages > .message.tool').length`), 0, 'Tool output must move into expandable Activity rather than the main conversation')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record .activity-output')].some(node=>node.textContent.includes('File created in workspace'))`), 'Tool output must remain available in its own Activity')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record .activity-output')].find(node=>node.textContent.includes('File created in workspace')).checkVisibility()`), false, 'Raw output must be hidden while Activity is collapsed')
  const requestsBeforeOutput = modelRequests
  await evaluate(`document.querySelector('.request-record').open=true; [...document.querySelectorAll('.request-record .activity-detail')].find(node=>node.querySelector('summary').textContent.startsWith('write_file')).open=true; true`)
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record .activity-output')].find(node=>node.textContent.includes('File created in workspace')).checkVisibility()`), true, 'Opening Activity must reveal the preserved output')
  assert.equal(modelRequests, requestsBeforeOutput, 'Reading raw output must not start work')
  await evaluate(`document.querySelector('.request-record').open=false; true`)
  await protocol.call('Page.reload')
  await eventually(() => evaluate('Boolean(document.querySelector("form"))'), 'Browser reload failed')
  await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Restored Composer is not ready')
  await evaluate(`document.querySelector('#reconnect').click(); true`)
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`),
    'Browser history restore failed',
  )
  await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Composer is not ready for the next request')
  await evaluate(
    `document.querySelector('.composer textarea').value='Write outside'; document.querySelector('.composer').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('Write denied')`),
    'Browser did not show denied tool result',
  )
  await assert.rejects(readFile(join(dir, 'outside.html')), { code: 'ENOENT' })
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.textContent.includes('write_file · failed')`), 'Failed tool activity was not recorded')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1).querySelector('.request-state').textContent.includes('có lỗi công cụ cần kiểm tra')`), 'A completed turn must still disclose failed tool attempts')
  assert.equal(await evaluate(`document.querySelector('.request-record').textContent.includes('TOOL_FAILED')`), false, 'Failure output must not attach to an earlier request')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).textContent.includes('File created in workspace')`), false, 'Earlier success output must not attach to the failed turn')
  assert.equal(await evaluate(`document.querySelectorAll('.request-record').length`), 2, 'Each turn must have exactly one record')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).previousElementSibling.textContent.includes('Write outside')`), true, 'Follow-up request must keep its own conversation position')
  await evaluate(`document.querySelector('.developer-tools').open=true; [...document.querySelectorAll('button')].find(button=>button.textContent==='Mở deck mẫu').click(); true`)
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').hidden`), false)
  assert.equal(await evaluate(`document.querySelector('iframe').getAttribute('sandbox')`), '')
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Sau ▶').click(); true`)
  assert.match(await evaluate(`document.querySelector('.slide-caption').textContent`), /Slide 2\/3/)
  await resizeDeck(protocol, evaluate, '.deck-sidebar', 640)
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').style.width`), '640px')
  assert.equal(await evaluate(`document.querySelector('iframe').contentDocument === null`), true, 'Sandboxed slide must not expose an accessible same-origin document')
  const sample = await fetch(`${app.origin}/samples/2.html`)
  assert.match(sample.headers.get('content-security-policy'), /^sandbox;/)
  assert.match(await sample.text(), /One thought/)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Toàn màn hình').click(); true`)
  await eventually(() => evaluate(`Boolean(document.fullscreenElement)`), 'Deck fullscreen failed')
  await evaluate(`document.exitFullscreen(); true`)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.slide-caption')?.textContent.includes('Slide 2/3')`), 'Sample navigation state was not restored')
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').style.width`), '640px')
  await eventually(() => evaluate(`document.querySelector('.composer textarea') !== null`), 'Composer did not return after reload')
  const beforeSettingsSelection = await evaluate(`document.querySelector('.composer select').value`)
  await evaluate(`document.querySelector('.composer textarea').value='Keep my draft'; const select=document.querySelector('.composer select'); select.value='__settings'; select.dispatchEvent(new Event('change')); true`)
  await eventually(() => evaluate(`document.querySelector('dialog').open`), 'Settings did not open')
  assert.equal(await evaluate(`document.querySelector('.composer select').value`), beforeSettingsSelection, 'Settings entry must preserve model selection')
  assert.equal(await evaluate(`document.querySelectorAll('.provider-list button').length > 0 && document.querySelectorAll('.settings-section').length === 3`), true, 'Settings must group providers, connection, credentials and models')
  await evaluate(`document.querySelector('[aria-label="Provider ID"]').value='sample-api'; document.querySelector('[aria-label="Display name"]').value='Sample API'; document.querySelector('[aria-label="Base URL"]').value='http://127.0.0.1:1'; document.querySelector('[aria-label="API key"]').value='fixture-browser-key'; document.querySelector('[aria-label="Added model IDs"]').value='sample-model'; document.querySelector('dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('dialog [role=status]').textContent.includes('Đã lưu cấu hình')`), 'Settings save failed')
  assert.equal(await evaluate(`document.querySelector('[aria-label="API key"]').value`), '')
  assert.equal(await evaluate(`document.querySelector('dialog').textContent.includes('fixture-browser-key')`), false)
  assert.equal(await evaluate(`document.querySelector('.provider-list button[aria-pressed=true] strong')?.textContent`), 'Sample API', 'Saving keeps the edited provider selected')
  await evaluate(`document.querySelector('.provider-list button[data-provider="fixture"]').click(); true`)
  assert.equal(await evaluate(`document.querySelector('[aria-label="Provider ID"]').value`), 'fixture', 'Provider cards must select the matching configuration')
  assert.equal(await evaluate(`document.querySelector('[aria-label="API key"]').value`), '', 'Switching providers must never reveal a key')
  if (process.env.DECKAGENT_SETTINGS_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_SETTINGS_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.classList.contains('settings-back')).click(); true`)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft')
  const requestCount = modelRequests
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.dataset.action==='new-chat').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').children.length === 0`), 'New chat did not open')
  assert.equal(await evaluate(`!document.querySelector('.welcome').hidden && document.querySelector('.conversation-header h1').textContent === 'Chat mới'`), true)
  await evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].find(button=>button.querySelector('strong')?.textContent==='Create HTML').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`), 'History did not reopen the right chat')
  assert.equal(await evaluate(`document.querySelector('.conversation-header h1').textContent`), 'Create HTML', 'History must restore the title of its own chat')
  assert.equal(await evaluate(`(() => {const item=document.querySelector('.chat-navigation nav button[aria-current=true]'); return item.querySelector('time').dateTime.length>0 && item.querySelector('small').textContent==='No slides yet';})()`), true, 'History metadata must use stored time and published-slide state')
  assert.equal(modelRequests, requestCount, 'Opening Settings/new chat/history must not start Agent work')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft', 'History must restore the draft of its own chat')
  await evaluate(`window.task007Fetch=window.fetch; window.fetch=(url,options)=>String(url).endsWith('/history')?Promise.resolve(new Response('{}',{status:503})):window.task007Fetch(url,options); [...document.querySelectorAll('.chat-navigation nav button')].find(button=>button.querySelector('strong')?.textContent==='Chat mới').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.conversation > [role=status]').hidden === false`), 'Failed history open was not reported')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`), true, 'Failed open must preserve the current conversation')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft', 'Failed open must preserve the current draft')
  await evaluate(`window.fetch=window.task007Fetch; delete window.task007Fetch; true`)
  assert.equal(modelRequests, requestCount, 'Failed history open must not start work')
  await evaluate(`document.querySelector('.composer textarea').value='Stop fixture'; document.querySelector('.composer').requestSubmit(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Stop')?.hidden === false`), 'Stop did not become available')
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Stop').click(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.dataset.status === 'cancelled'`), 'Stop did not terminate the request')
  await eventually(() => evaluate(`!document.querySelector('.composer [aria-label="Send request"]').disabled`), 'Stop did not release the Composer')
  await evaluate(`document.querySelector('.composer textarea').value='Read forged receipt'; document.querySelector('.composer').requestSubmit(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.dataset.status === 'completed'`), 'Reading the fixture did not finish')
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1).textContent.includes('read_file')`), 'Read activity did not load')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).querySelector('.request-state').textContent`), 'Lượt đã kết thúc', 'A JSON file resembling a receipt must never count as a published slide')
  assert.equal(await evaluate(`document.querySelector('.composer [aria-label="Send request"]').getBoundingClientRect().bottom <= innerHeight`), true, 'Composer must remain visible while conversation history scrolls')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 900, height: 600, deviceScaleFactor: 1, mobile: false })
  assert.equal(await evaluate(`(() => { const box=document.querySelector('.composer').getBoundingClientRect(); return box.bottom<=innerHeight && box.left>=0 && box.right<=innerWidth; })()`), true, 'Compact Composer must remain usable in a narrow, short window')
  await protocol.call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false })
  if (process.env.DECKAGENT_BROWSER_SCREENSHOT) {
    await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`)
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_BROWSER_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  const beforeLegacy = modelRequests
  const legacy = await protocol.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalFetch=window.fetch;
    window.fetch=async (...args)=>{
      const response=await originalFetch(...args);
      if(!String(args[0]).endsWith('/history')||!response.ok)return response;
      const messages=await response.json();
      return new Response(JSON.stringify(messages.map(({role,content})=>({role,content}))),{headers:{'content-type':'application/json'}});
    };
  ` })
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelectorAll('.unassigned-tool-output').length > 0`), 'Legacy outputs must remain accessible without guessed Activity association')
  assert.equal(await evaluate(`[...document.querySelectorAll('.unassigned-tool-output')].every(node=>!node.open)`), true)
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record .activity-output')].some(node=>node.textContent.includes('File created in workspace'))`), false, 'Missing identity must never attach output to a guessed request')
  assert.equal(modelRequests, beforeLegacy, 'Restoring legacy history must not replay work')
  await protocol.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: legacy.identifier })
})
