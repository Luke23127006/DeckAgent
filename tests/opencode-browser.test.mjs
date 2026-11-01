import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'

async function eventually(read, message) {
  for (let attempt = 0; attempt < 600; attempt++) {
    const value = await read()
    if (value) return value
    await delay(50)
  }
  throw new Error(message)
}

test('OpenCode browser shows completion, Stop and reload without replay (provider fixture)', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-opencode-browser-'))
  let hold = false,
    providerRequests = 0,
    app,
    browser,
    socket
  const server = createServer(async (req, res) => {
    for await (const _chunk of req) {
      /* Never retain request bodies. */
    }
    providerRequests++
    if (hold) return
    res.writeHead(200, { 'content-type': 'text/event-stream' }).end(
      `data: ${JSON.stringify({
        candidates: [
          { content: { role: 'model', parts: [{ text: 'OPENCODE_BROWSER_RESPONSE' }] }, finishReason: 'STOP' },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      })}\n\n`,
    )
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const previous = process.env.DECKAGENT_BROWSER_FIXTURE_KEY
  process.env.DECKAGENT_BROWSER_FIXTURE_KEY = 'NOT_A_CREDENTIAL'
  t.after(async () => {
    socket?.close()
    if (browser && browser.exitCode === null) {
      const closed = once(browser, 'exit')
      browser.kill()
      await closed
    }
    await app?.close()
    server.closeAllConnections()
    await new Promise(done => server.close(done))
    if (previous === undefined) delete process.env.DECKAGENT_BROWSER_FIXTURE_KEY
    else process.env.DECKAGENT_BROWSER_FIXTURE_KEY = previous
    await rm(root, { recursive: true, force: true })
  })
  app = await startLocalWeb({
    dataDir: join(root, 'data'),
    workspace: join(root, 'work'),
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
    selection: { provider: 'google', model: 'gemini-3.1-flash-lite' },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: `http://127.0.0.1:${server.address().port}/v1beta`,
        apiKeyEnv: 'DECKAGENT_BROWSER_FIXTURE_KEY',
      },
    ],
  })
  let executable
  for (const candidate of [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean)) {
    try {
      await access(candidate)
      executable = candidate
      break
    } catch {
      /* Try the next installed browser. */
    }
  }
  assert.ok(executable, 'Chrome/Edge required; set CHROME_BIN')
  const profile = join(root, 'browser')
  browser = spawn(
    executable,
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
    { windowsHide: true, stdio: 'ignore' },
  )
  const port = await eventually(async () => {
    try {
      return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
    } catch {
      return undefined
    }
  }, 'Browser did not start')
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((done, reject) => {
    socket.addEventListener('open', done, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let next = 0
  const pending = new Map()
  socket.addEventListener('message', event => {
    const response = JSON.parse(String(event.data)),
      waiter = pending.get(response.id)
    if (!waiter) return
    pending.delete(response.id)
    clearTimeout(waiter.timeout)
    if (response.error) waiter.reject(new Error('Browser protocol failed'))
    else waiter.resolve(response.result)
  })
  const call = (method, params = {}) =>
    new Promise((resolveCall, reject) => {
      const id = ++next,
        timeout = setTimeout(() => {
          pending.delete(id)
          reject(new Error('Browser command timed out'))
        }, 10000)
      pending.set(id, { resolve: resolveCall, reject, timeout })
      socket.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async expression => {
    const value = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (value.exceptionDetails) throw new Error('Browser evaluation failed')
    return value.result.value
  }
  await call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.composer select')?.options.length>1 && !document.querySelector('.composer select').disabled && !!document.querySelector('.chat-navigation [aria-current=true]')`,
      ),
    'Composer unavailable',
  )
  await evaluate(
    `document.querySelector('.composer select').selectedIndex=1;document.querySelector('.composer select').dispatchEvent(new Event('change'));true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.composer [aria-label="Send request"]').disabled===false`),
    'Model selection was not saved',
  )
  await evaluate(
    `document.querySelector('.composer textarea').value='OPENCODE_BROWSER_INPUT';document.querySelector('.composer textarea').dispatchEvent(new Event('input'));document.querySelector('.composer').requestSubmit();true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.messages').textContent.includes('OPENCODE_BROWSER_RESPONSE')`),
    'CLI response missing',
  )
  await eventually(
    () => evaluate(`document.querySelector('.request-record')?.dataset.status==='completed'`),
    'Request did not complete',
  )
  hold = true
  await evaluate(
    `document.querySelector('.composer textarea').value='Stop this request';document.querySelector('.composer textarea').dispatchEvent(new Event('input'));document.querySelector('.composer').requestSubmit();true`,
  )
  await eventually(() => evaluate(`document.querySelector('[aria-label="Stop"]')?.hidden===false`), 'Stop unavailable')
  await evaluate(`document.querySelector('[aria-label="Stop"]').click();true`)
  await eventually(
    () => evaluate(`[...document.querySelectorAll('.request-record')].at(-1)?.dataset.status==='cancelled'`),
    'Stop did not finish',
  )
  await evaluate(
    `document.querySelector('.composer textarea').value='Next draft';document.querySelector('.composer textarea').dispatchEvent(new Event('input'));true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.composer [aria-label="Send request"]').disabled===false`),
    'Stop did not release Composer',
  )
  const count = providerRequests
  await call('Page.reload')
  await eventually(
    () => evaluate(`document.querySelector('.messages')?.textContent.includes('OPENCODE_BROWSER_RESPONSE')`),
    'History not restored',
  )
  await delay(1000)
  assert.equal(providerRequests, count, 'Reload must not start inference')
  assert.equal(
    await evaluate(`document.querySelector('.messages').textContent.split('OPENCODE_BROWSER_RESPONSE').length-1`),
    1,
  )
  for (const waiter of pending.values()) clearTimeout(waiter.timeout)
})
