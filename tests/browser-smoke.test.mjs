import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'

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
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++next
        const timeout = setTimeout(() => {
          pending.delete(id)
          reject(new Error('Browser command timed out'))
        }, 10000)
        pending.set(id, { resolve, reject, timeout })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
    close: () => socket.close(),
  }
}

test('real browser boots, sends an Agent request, shows completion and restores history after reload', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-browser-'))
  let app
  let browser
  let protocol
  let releaseModel
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
    const result = await protocol.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error('Browser script failed')
    return result.result.value
  }
  app = await startLocalWeb({
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
    selection: { provider: 'fixture', model: 'browser' },
    model: {
      async *stream(request) {
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
  await protocol.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(() => evaluate('Boolean(document.querySelector("form"))'), 'Browser boot failed')
  await evaluate(
    `document.querySelector('input').value='real-browser'; document.querySelector('textarea').value='Create HTML'; document.querySelector('form').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('[role=status]').textContent === 'running'`),
    'Browser did not show running status',
  )
  await protocol.call('Page.reload')
  await eventually(
    () => evaluate(`document.querySelector('[role=status]')?.textContent === 'running'`),
    'Browser did not reconnect to active request',
  )
  releaseModel()
  await eventually(
    () => evaluate(`document.querySelector('pre').textContent.includes('Browser HTML created')`),
    'Browser did not show Agent result',
  )
  assert.equal(await evaluate(`document.querySelector('[role=status]').textContent`), 'completed')
  assert.equal(await readFile(join(dir, 'workspace', 'browser.html'), 'utf8'), '<h1>Browser round-trip</h1>')
  await protocol.call('Page.reload')
  await eventually(() => evaluate('Boolean(document.querySelector("form"))'), 'Browser reload failed')
  await evaluate(`document.querySelector('button[type=button]').click(); true`)
  await eventually(
    () => evaluate(`document.querySelector('pre').textContent.includes('Browser HTML created')`),
    'Browser history restore failed',
  )
  await evaluate(
    `document.querySelector('textarea').value='Write outside'; document.querySelector('form').requestSubmit(); true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('pre').textContent.includes('Write denied')`),
    'Browser did not show denied tool result',
  )
  await assert.rejects(readFile(join(dir, 'outside.html')), { code: 'ENOENT' })
})
