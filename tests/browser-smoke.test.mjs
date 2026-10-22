import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { workflowModel } from './fixtures/outline-workflow.mjs'

async function eventually(operation, message) {
  for (let i = 0; i < 200; i++) {
    const value = await operation()
    if (value) return value
    await delay(50)
  }
  throw new Error(message)
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
  const port = await eventually(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0] } catch { return undefined }
  }, 'Browser did not start')
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
  await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Model not selected')
  await evaluate(`document.querySelector('.composer textarea').value='Create two slides about recycling';[...document.querySelectorAll('.composer button')].find(b=>b.textContent==='Create presentation').click();true`)
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=current]') && !document.querySelector('.composer button').disabled`), 'Current outline missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').hidden`), true)
  assert.equal(await evaluate(`document.querySelectorAll('.outline-proposal .planned-slide').length`), 2)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 0)
  const before = modelCalls
  await evaluate(`[...document.querySelectorAll('.outline-viewing button')].find(b=>b.textContent==='Expand all').click();document.querySelector('.planned-slide summary').focus();true`)
  await delay(950)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 2)
  assert.equal(await evaluate(`document.activeElement===document.querySelector('.planned-slide summary')`), true)
  assert.equal(modelCalls, before, 'Viewing detail must send no Agent request')
  assert.equal(await evaluate(`document.querySelectorAll('.request-record').length`), 1)
  if (process.env.DECKAGENT_OUTLINE_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_OUTLINE_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  await evaluate(`[...document.querySelectorAll('.outline-actions button')].find(b=>b.textContent==='Confirm outline').click();true`)
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=confirmed]') && document.querySelector('.published-deck-sidebar .deck-slide-list')?.textContent.includes('Revision 1')`), 'First slide missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').hidden`), false)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').textContent.includes('Pending')`), true)
  assert.equal(await evaluate(`document.querySelector('.outline-proposal .outline-actions').hidden`), true)
  assert.equal(await evaluate(`document.querySelectorAll('.planned-slide[open]').length`), 2, 'Confirmation preserves reading state')
  await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list button').click();true`)
  releaseSecond()
  await eventually(() => evaluate(`document.querySelectorAll('.request-record[data-status=completed]').length===2 && !document.querySelector('.composer button').disabled`), 'Confirmation request did not finish')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar [aria-current=true]').textContent`), '1. Why recycle · Revision 1')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').textContent.includes('Pending')`), false)
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Local rules were not checked')`), true)
  if (process.env.DECKAGENT_WORKFLOW_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_WORKFLOW_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.outline-proposal[data-status=confirmed]') && document.querySelector('.published-deck-sidebar .deck-slide-list')?.textContent.includes('Revision 1')`), 'Reload lost confirmed outline/deck')
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
  const port = await eventually(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0] } catch { return undefined }
  }, 'Browser did not start')
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
    confirmedDecks: [{ sessionId: 'browser-deck', outlineId: 'confirmed', slides: [{ slideId: 'intro', title: 'Introduction' }, { slideId: 'second', title: 'Second' }, { slideId: 'draft', title: 'Unpublished' }] }],
    selection: { provider: 'fixture', model: 'canvas' },
    model: { async *stream(request) {
      const user = [...request.messages].reverse().find(m => m.role === 'user').content
      const slideId = user.includes('first') ? 'intro' : 'second'
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
    await eventually(() => evaluate(`Boolean([...document.querySelectorAll('.chat-navigation button')].find(b=>b.title==='browser-deck'))`), 'Fixture Session missing')
    await eventually(() => evaluate(`Boolean(document.querySelector('.chat-navigation [aria-current=true]'))`), 'Initial chat did not finish opening')
    await evaluate(`[...document.querySelectorAll('.chat-navigation button')].find(b=>b.title==='browser-deck').click(); true`)
    await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').textContent.includes('Unpublished')`), 'Deck plan missing')
  }
  await navigate()
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').hidden`), true)
  const send = async text => {
    await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Composer unavailable')
    await evaluate(`document.querySelector('.composer textarea').value=${JSON.stringify(text)}; document.querySelector('.composer').requestSubmit(); true`)
  }
  await send('Publish slide 1 first')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('intro published')`), 'First published content missing')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').getAttribute('sandbox')`), '')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').contentDocument === null`), true)
  await send('Publish slide 2 second')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list').textContent.includes('2. Second · Revision 1')`), 'Second publication did not arrive over SSE')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar .deck-slide-list [aria-current=true]').textContent`), '1. Introduction · Revision 1')
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('PRIVATE DRAFT')`), false)
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Next').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe').srcdoc.includes('second published')`), 'Slide navigation failed')
  const savedModel = await evaluate(`document.querySelector('.conversation select').value`)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='New chat').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').children.length === 0 && document.querySelector('.conversation select').value === ''`), 'Empty chat did not open independently')
  await evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].find(button=>button.title==='browser-deck').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe')?.srcdoc.includes('second published')`), 'History did not restore the deck and its selected slide')
  assert.equal(await evaluate(`document.querySelector('.conversation select').value`), savedModel, 'History must restore its own model')
  assert.equal((await (await fetch(`${app.origin}/api/sessions/browser-deck/requests`, { headers: { authorization: `Bearer ${app.token}` } })).json()).length, 2, 'History must not send a new request')
  await evaluate(`const w=document.querySelector('.published-deck-sidebar input[type=range]'); w.value='640'; w.dispatchEvent(new Event('input')); true`)
  assert.equal(await evaluate(`document.querySelector('.published-deck-sidebar').style.width`), '640px')
  await evaluate(`[...document.querySelectorAll('.published-deck-sidebar button')].find(b=>b.textContent==='Fullscreen').click(); true`)
  await eventually(() => evaluate('Boolean(document.fullscreenElement)'), 'Published deck fullscreen failed')
  await evaluate('document.exitFullscreen(); true')
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.published-deck-sidebar iframe')?.srcdoc.includes('intro published')`), 'Reload did not restore published content')
  await app.close()
  app = await startLocalWeb(options)
  await navigate()
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
  const port = await eventually(async () => {
    try {
      return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
    } catch {
      return undefined
    }
  }, 'Browser did not start')
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
        if (request.messages.at(-1).content === 'Stop fixture') {
          await new Promise((_, reject) => {
            if (request.signal.aborted) reject(request.signal.reason)
            else request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
          })
        }
        if (request.messages.at(-1).role === 'tool') {
          yield { type: 'text-delta', text: request.messages.at(-1).isError ? 'Write denied' : 'Browser HTML created' }
          yield { type: 'finish', reason: 'stop' }
        } else {
          await modelReady
          yield {
            type: 'tool-call',
            call: {
              id: `browser-file-${request.messages.length}`,
              name: 'write_file',
              arguments: {
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
  await evaluate(`document.querySelector('.conversation select').selectedIndex=1; document.querySelector('.conversation select').dispatchEvent(new Event('change')); true`)
  await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Model selection was not saved')
  await evaluate(
    `document.querySelector('.composer textarea').value='Create HTML'; document.querySelector('.composer').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages .request-record')?.dataset.status === 'running'`),
    'Browser did not show running status',
  )
  assert.equal(await evaluate(`Boolean(document.querySelector('.conversation > .activities'))`), false, 'Activity must not reserve a separate footer below chat')
  assert.equal(await evaluate(`Boolean(document.querySelector('.messages .request-record'))`), true, 'Each request must have an inline activity record')
  await eventually(() => evaluate(`document.querySelector('.request-record').previousElementSibling?.textContent.includes('Create HTML')`), 'Request record is not anchored to its user message')
  await eventually(() => evaluate(`document.querySelector('.request-record .activity-count').textContent.includes('1 activity')`), 'Running activity count did not update')
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), false, 'Running request defaults to collapsed')
  assert.equal(await evaluate(`document.querySelector('.request-record').getBoundingClientRect().height <= 48`), true, 'Collapsed activity should occupy a single line')
  assert.equal(await evaluate(`document.querySelector('.messages').clientHeight >= document.querySelector('.conversation').clientHeight * .5`), true, 'Chat should retain most available vertical space')
  const requestsBeforeViewing = modelRequests
  assert.equal(await evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].every(button => button.disabled)`), true, 'History must be disabled while work runs')
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'New chat').disabled`), true)
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
  assert.equal(await evaluate(`document.querySelector('.request-record .request-state').textContent`), 'Completed')
  await eventually(() => evaluate(`document.querySelector('.request-record .activity-count').textContent.includes('3 activities')`), 'Completed activity count was not retained')
  assert.equal(await evaluate(`document.querySelector('.request-record').open`), false, 'Completion must not force activity details open')
  assert.equal(await evaluate(`document.querySelector('.conversation > [role=status]').hidden`), true, 'Request status must appear once, in its record')
  assert.equal(await readFile(join(dir, 'workspace', 'browser.html'), 'utf8'), '<h1>Browser round-trip</h1>')
  await protocol.call('Page.reload')
  await eventually(() => evaluate('Boolean(document.querySelector("form"))'), 'Browser reload failed')
  await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Restored Composer is not ready')
  await evaluate(`document.querySelector('#reconnect').click(); true`)
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`),
    'Browser history restore failed',
  )
  await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Composer is not ready for the next request')
  await evaluate(
    `document.querySelector('.composer textarea').value='Write outside'; document.querySelector('.composer').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('Write denied')`),
    'Browser did not show denied tool result',
  )
  await assert.rejects(readFile(join(dir, 'outside.html')), { code: 'ENOENT' })
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.textContent.includes('write_file · failed')`), 'Failed tool activity was not recorded')
  assert.equal(await evaluate(`document.querySelectorAll('.request-record').length`), 2, 'Each turn must have exactly one record')
  assert.equal(await evaluate(`[...document.querySelectorAll('.request-record')].at(-1).previousElementSibling.textContent.includes('Write outside')`), true, 'Follow-up request must keep its own conversation position')
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Open sample deck').click(); true`)
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').hidden`), false)
  assert.equal(await evaluate(`document.querySelector('iframe').getAttribute('sandbox')`), '')
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Next').click(); true`)
  assert.match(await evaluate(`document.querySelector('.slide-caption').textContent`), /Slide 2 of 3/)
  await evaluate(`const width=document.querySelector('input[type=range]'); width.value='640'; width.dispatchEvent(new Event('input')); true`)
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').style.width`), '640px')
  assert.equal(await evaluate(`document.querySelector('iframe').contentDocument === null`), true, 'Sandboxed slide must not expose an accessible same-origin document')
  const sample = await fetch(`${app.origin}/samples/2.html`)
  assert.match(sample.headers.get('content-security-policy'), /^sandbox;/)
  assert.match(await sample.text(), /One thought/)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Fullscreen').click(); true`)
  await eventually(() => evaluate(`Boolean(document.fullscreenElement)`), 'Deck fullscreen failed')
  await evaluate(`document.exitFullscreen(); true`)
  await protocol.call('Page.reload')
  await eventually(() => evaluate(`document.querySelector('.slide-caption')?.textContent.includes('Slide 2 of 3')`), 'Sample navigation state was not restored')
  assert.equal(await evaluate(`document.querySelector('.deck-sidebar').style.width`), '640px')
  await eventually(() => evaluate(`document.querySelector('.composer textarea') !== null`), 'Composer did not return after reload')
  await evaluate(`document.querySelector('.composer textarea').value='Keep my draft'; [...document.querySelectorAll('button')].find(button=>button.textContent==='Models & settings').click(); true`)
  await eventually(() => evaluate(`document.querySelector('dialog').open`), 'Settings did not open')
  await evaluate(`document.querySelector('[aria-label="Provider ID"]').value='sample-api'; document.querySelector('[aria-label="Display name"]').value='Sample API'; document.querySelector('[aria-label="Base URL"]').value='http://127.0.0.1:1'; document.querySelector('[aria-label="API key"]').value='fixture-browser-key'; document.querySelector('[aria-label="Added model IDs"]').value='sample-model'; document.querySelector('dialog form').requestSubmit(); true`)
  await eventually(() => evaluate(`document.querySelector('dialog [role=status]').textContent.includes('Provider saved')`), 'Settings save failed')
  assert.equal(await evaluate(`document.querySelector('[aria-label="API key"]').value`), '')
  assert.equal(await evaluate(`document.querySelector('dialog').textContent.includes('fixture-browser-key')`), false)
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Close settings').click(); true`)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft')
  const requestCount = modelRequests
  await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='New chat').click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').children.length === 0`), 'New chat did not open')
  await evaluate(`[...document.querySelectorAll('.chat-navigation nav button')].find(button=>button.textContent.includes('messages')&&!button.textContent.includes('0 messages')).click(); true`)
  await eventually(() => evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`), 'History did not reopen the right chat')
  assert.equal(modelRequests, requestCount, 'Opening Settings/new chat/history must not start Agent work')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft', 'History must restore the draft of its own chat')
  await evaluate(`window.task007Fetch=window.fetch; window.fetch=(url,options)=>String(url).endsWith('/history')?Promise.resolve(new Response('{}',{status:503})):window.task007Fetch(url,options); [...document.querySelectorAll('.chat-navigation nav button')].find(button=>button.textContent.includes('0 messages')).click(); true`)
  await eventually(() => evaluate(`document.querySelector('.conversation > [role=status]').hidden === false`), 'Failed history open was not reported')
  assert.equal(await evaluate(`document.querySelector('.messages').textContent.includes('Browser HTML created')`), true, 'Failed open must preserve the current conversation')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'Keep my draft', 'Failed open must preserve the current draft')
  await evaluate(`window.fetch=window.task007Fetch; delete window.task007Fetch; true`)
  assert.equal(modelRequests, requestCount, 'Failed history open must not start work')
  await evaluate(`document.querySelector('.composer textarea').value='Stop fixture'; document.querySelector('.composer').requestSubmit(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Stop')?.hidden === false`), 'Stop did not become available')
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent === 'Stop').click(); true`)
  await eventually(() => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.dataset.status === 'cancelled'`), 'Stop did not terminate the request')
  await eventually(() => evaluate(`!document.querySelector('.composer button').disabled`), 'Stop did not release the Composer')
  assert.equal(await evaluate(`document.querySelector('.composer button').getBoundingClientRect().bottom <= innerHeight`), true, 'Composer must remain visible while conversation history scrolls')
  if (process.env.DECKAGENT_BROWSER_SCREENSHOT) {
    const shot = await protocol.call('Page.captureScreenshot', { format: 'png' })
    await writeFile(process.env.DECKAGENT_BROWSER_SCREENSHOT, Buffer.from(shot.data, 'base64'))
  }
})
