import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, lstat, realpath } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { DeckError } from '@deckagent/deck'

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export interface CdpConnection {
  call(
    method: string,
    params?: Record<string, unknown>,
    options?: { readonly sessionId?: string; readonly signal?: AbortSignal },
  ): Promise<unknown>
  close(): void
}

export interface ManagedBrowser {
  readonly child: ChildProcess
  readonly folder: string
  readonly cdp: CdpConnection
}

/** The first supported local Chromium executable; no download and no remote service. */
export async function executable(): Promise<string> {
  for (const path of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]) {
    try {
      await access(path)
      return path
    } catch {
      /* Next supported local browser. */
    }
  }
  throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
}

/** Only variables the browser needs to start; user credentials and proxy settings are not passed. */
export function rendererEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {}
  for (const key of [
    'PATH',
    'Path',
    'SystemRoot',
    'WINDIR',
    'SystemDrive',
    'COMSPEC',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'ProgramW6432',
    'PUBLIC',
    'ALLUSERSPROFILE',
    'PROGRAMDATA',
    'PROCESSOR_ARCHITECTURE',
    'NUMBER_OF_PROCESSORS',
    'OS',
    'USERNAME',
    'USERDOMAIN',
    'HOMEDRIVE',
    'HOMEPATH',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'HOME',
  ]) {
    if (process.env[key] !== undefined) env[key] = process.env[key]
  }
  return env
}

/** Rejects a root that is reached through a symbolic link; the nearest existing parent is checked too. */
export async function verifySafeRoot(root: string): Promise<void> {
  let existing = resolve(root)
  while (!(await lstat(existing).catch(() => undefined))) {
    const parent = dirname(existing)
    if (parent === existing) throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
    existing = parent
  }
  if ((await lstat(existing)).isSymbolicLink() || (await realpath(existing)) !== existing)
    throw new DeckError('ARTIFACT_RENDERER_UNAVAILABLE')
  await mkdir(root, { recursive: true })
}

interface Waiter {
  resolve(value: unknown): void
  reject(reason: unknown): void
  cleanup(): void
}

/** One browser-level socket that multiplexes every render session. */
export async function connectBrowser(url: string, onDisconnect: () => void): Promise<CdpConnection> {
  const socket = new WebSocket(url)
  const pending = new Map<number, Waiter>()
  let sequence = 0
  let disconnected = false
  const failPending = () => {
    for (const waiter of pending.values()) {
      waiter.cleanup()
      waiter.reject(new DeckError('ARTIFACT_RENDERER_FAILED'))
    }
    pending.clear()
  }
  const disconnect = () => {
    if (disconnected) return
    disconnected = true
    failPending()
    onDisconnect()
  }
  await new Promise<void>((done, reject) => {
    socket.addEventListener('open', () => done(), { once: true })
    socket.addEventListener('error', () => reject(new DeckError('ARTIFACT_RENDERER_FAILED')), { once: true })
    socket.addEventListener('close', () => reject(new DeckError('ARTIFACT_RENDERER_FAILED')), { once: true })
  })
  socket.addEventListener('message', event => {
    const value: unknown = JSON.parse(String(event.data))
    if (!object(value) || typeof value.id !== 'number') return
    const waiter = pending.get(value.id)
    if (!waiter) return
    pending.delete(value.id)
    waiter.cleanup()
    if (value.error) waiter.reject(new DeckError('ARTIFACT_RENDERER_FAILED'))
    else waiter.resolve(value.result)
  })
  socket.addEventListener('close', disconnect)
  socket.addEventListener('error', disconnect)
  return {
    call(method, params = {}, options = {}) {
      const { sessionId, signal } = options
      if (signal?.aborted) return Promise.reject(signal.reason ?? new DeckError('ARTIFACT_RENDERER_FAILED'))
      return new Promise((done, reject) => {
        const id = ++sequence
        const abort = () => {
          if (!pending.delete(id)) return
          signal?.removeEventListener('abort', abort)
          reject(signal?.reason ?? new DeckError('ARTIFACT_RENDERER_FAILED'))
        }
        signal?.addEventListener('abort', abort, { once: true })
        pending.set(id, {
          resolve: value => {
            signal?.removeEventListener('abort', abort)
            done(value)
          },
          reject: reason => {
            signal?.removeEventListener('abort', abort)
            reject(reason)
          },
          cleanup: () => signal?.removeEventListener('abort', abort),
        })
        socket.send(JSON.stringify({ id, ...(sessionId ? { sessionId } : {}), method, params }))
      })
    },
    close() {
      disconnect()
      socket.close()
    },
  }
}

async function removeFolder(folder: string, root: string): Promise<void> {
  if (resolve(folder).startsWith(resolve(root) + sep) && (await realpath(root).catch(() => null)) === resolve(root))
    await rm(folder, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(() => {})
}

/** Polls the port file the browser writes; a port is accepted only when it matches the CDP form. */
async function devtoolsPort(folder: string, child: ChildProcess, signal: AbortSignal): Promise<string> {
  let port = ''
  while (!port) {
    signal.throwIfAborted()
    if (child.exitCode !== null) throw new DeckError('ARTIFACT_RENDERER_FAILED')
    try {
      const value = (await readFile(join(folder, 'DevToolsActivePort'), 'utf8')).split('\n')[0] ?? ''
      if (/^\d{1,5}$/.test(value)) port = value
      else await delay(25, undefined, { signal })
    } catch {
      await delay(25, undefined, { signal })
    }
  }
  return port
}

/** Starts one hidden local browser that serves every render; the caller owns its disposal. */
export async function launchManagedBrowser(
  root: string,
  signal: AbortSignal,
  onExit: () => void,
): Promise<ManagedBrowser> {
  await verifySafeRoot(root)
  const folder = await mkdtemp(join(root, 'render-'))
  let child: ChildProcess | undefined
  let cdp: CdpConnection | undefined
  const abort = () => child?.kill()
  try {
    child = spawn(
      await executable(),
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--remote-debugging-port=0',
        `--user-data-dir=${folder}`,
        'about:blank',
      ],
      { windowsHide: true, stdio: 'ignore', env: rendererEnvironment() },
    )
    child.on('error', abort)
    signal.addEventListener('abort', abort, { once: true })
    const port = await devtoolsPort(folder, child, signal)
    const target: unknown = await (await fetch(`http://127.0.0.1:${port}/json/version`, { signal })).json()
    if (
      !object(target) ||
      typeof target.webSocketDebuggerUrl !== 'string' ||
      !target.webSocketDebuggerUrl.startsWith(`ws://127.0.0.1:${port}/devtools/browser/`)
    )
      throw new DeckError('ARTIFACT_RENDERER_FAILED')
    cdp = await connectBrowser(target.webSocketDebuggerUrl, onExit)
    child.once('exit', onExit)
    return { child, folder, cdp }
  } catch (error) {
    signal.removeEventListener('abort', abort)
    cdp?.close()
    if (child && child.exitCode === null) child.kill()
    await removeFolder(folder, root)
    if (error instanceof DeckError) throw error
    throw new DeckError('ARTIFACT_RENDERER_FAILED')
  }
}

function waitForExit(child: ChildProcess, ms: number): Promise<void> {
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise(done => {
    const timer = setTimeout(done, ms)
    child.once('exit', () => {
      clearTimeout(timer)
      done()
    })
  })
}

/** Ends the browser process and removes its profile directory under the verified root. */
export async function disposeManagedBrowser(browser: ManagedBrowser, root: string): Promise<void> {
  const { child, folder, cdp } = browser
  await cdp.call('Browser.close', {}, { signal: AbortSignal.timeout(2000) }).catch(() => {})
  cdp.close()
  if (child.exitCode === null) child.kill()
  await waitForExit(child, 2000)
  await removeFolder(folder, root)
}
