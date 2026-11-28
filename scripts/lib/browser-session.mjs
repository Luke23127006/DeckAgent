import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

/** Local, network-blocked Chrome session for layout measurements and standalone gallery screenshots. */
export async function browserSession() {
  let executable
  for (const path of [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)) {
    try {
      await access(path)
      executable = path
      break
    } catch {
      /* Try the next installed browser. */
    }
  }
  if (!executable) throw new Error('Chrome/Edge required; set CHROME_BIN')
  const profile = await mkdtemp(join(tmpdir(), 'deck-layout-browser-'))
  const child = spawn(
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
  let browserError
  child.on('error', error => {
    browserError = error
  })
  const close = async () => {
    socket?.close()
    child.kill()
    await rm(profile, { recursive: true, force: true, maxRetries: 25, retryDelay: 100 })
  }
  try {
    let port
    for (let i = 0; i < 400; i++) {
      if (browserError) throw browserError
      if (child.exitCode !== null) throw new Error(`Chrome exited: ${child.exitCode}`)
      try {
        port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
        break
      } catch {
        await delay(25)
      }
    }
    if (!port) throw new Error('Chrome startup timed out')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
    const pending = new Map()
    let id = 0
    socket.addEventListener('message', event => {
      const reply = JSON.parse(String(event.data)),
        task = pending.get(reply.id)
      if (!task) return
      pending.delete(reply.id)
      clearTimeout(task.timer)
      if (reply.error) task.reject(new Error(JSON.stringify(reply.error)))
      else task.resolve(reply.result)
    })
    const call = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const key = ++id
        pending.set(key, {
          resolve,
          reject,
          timer: setTimeout(() => {
            pending.delete(key)
            reject(new Error(`Chrome timed out: ${method}`))
          }, 10000),
        })
        socket.send(JSON.stringify({ id: key, method, params }))
      })
    const evaluate = async expression => {
      const reply = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (reply.exceptionDetails) throw new Error(JSON.stringify(reply.exceptionDetails))
      return reply.result?.value
    }
    await call('Page.enable')
    await call('Network.enable')
    await call('Network.setBlockedURLs', { urls: ['http://*', 'https://*'] })
    const resize = (width = 1280, height = 720) =>
      call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await resize()
    return {
      call,
      evaluate,
      resize,
      close: async () => {
        await call('Browser.close').catch(() => {})
        await close()
      },
      page: async html => {
        const { frameTree } = await call('Page.getFrameTree')
        await call('Page.setDocumentContent', { frameId: frameTree.frame.id, html })
        await evaluate(
          `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true})()`,
        )
      },
    }
  } catch (error) {
    await close()
    throw error
  }
}
