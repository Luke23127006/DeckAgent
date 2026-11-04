import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
export async function eventually(operation, message) {
  for (let i = 0; i < 400; i++) {
    const result = await operation()
    if (result) return result
    await delay(50)
  }
  throw new Error(message)
}
export async function materialBrowser(t, root, url) {
  let executable
  for (const path of [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium',
  ].filter(Boolean)) {
    try {
      await access(path)
      executable = path
      break
    } catch {
      /* Next installed browser. */
    }
  }
  if (!executable) throw new Error('Chrome/Edge required')
  const profile = join(root, 'browser')
  const browser = spawn(
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
  let socket
  const pending = new Map()
  t.after(async () => {
    socket?.close()
    for (const item of pending.values()) {
      clearTimeout(item.timeout)
      item.reject(new Error('Browser closing'))
    }
    if (browser.exitCode === null) {
      const closed = once(browser, 'exit')
      browser.kill()
      await closed
    }
  })
  const port = await eventually(async () => {
    try {
      return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
    } catch {
      return undefined
    }
  }, 'Browser did not start')
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  socket.addEventListener('message', event => {
    const value = JSON.parse(String(event.data)),
      item = pending.get(value.id)
    if (!item) return
    pending.delete(value.id)
    clearTimeout(item.timeout)
    if (value.error) item.reject(new Error(`Browser protocol error: ${item.method} (${value.error.code})`))
    else item.resolve(value.result)
  })
  const call = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++sequence,
        timeout = setTimeout(() => {
          pending.delete(id)
          reject(new Error('Browser command timeout'))
        }, 10000)
      pending.set(id, { resolve, reject, timeout, method })
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    })
  const evaluate = async expression => {
    const value = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (value.exceptionDetails) throw new Error('Browser evaluation failed')
    return value.result.value
  }
  await call('Page.navigate', { url })
  return { evaluate, call }
}
