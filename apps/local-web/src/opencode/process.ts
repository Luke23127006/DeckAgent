import { spawn } from 'node:child_process'
import { join } from 'node:path'

export interface ProcessResult {
  /** The executable could not be started (missing, not executable). */
  readonly startFailed: boolean
  readonly code: number | null
  /** A stdout line was not JSON, a line or the whole output was too large. */
  readonly malformed: boolean
  /** Ended by abort. */
  readonly killed: boolean
  /** Collected stdout, only when `collect` is set. Never logged or persisted. */
  readonly stdout: string
}

export interface ProcessOptions {
  readonly cwd: string
  readonly env: NodeJS.ProcessEnv
  readonly signal: AbortSignal
  /** Written to stdin, then closed. */
  readonly input?: string
  /** One parsed JSON value per stdout line, in order. */
  readonly onLine?: (value: unknown) => void
  readonly collect?: boolean
  readonly maxOutputBytes?: number
}

const maxLine = 2 * 1024 * 1024

/** Ends the process and every child it started. Windows: taskkill /T; elsewhere the process group. */
function killTree(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    return new Promise(done => {
      const killer = spawn(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe'), ['/PID', String(pid), '/T', '/F'],
        { windowsHide: true, stdio: 'ignore' })
      killer.on('error', () => done())
      killer.on('close', () => done())
    })
  }
  try { process.kill(-pid, 'SIGTERM') } catch { /* Already ended. */ }
  const force = setTimeout(() => { try { process.kill(-pid, 'SIGKILL') } catch { /* Already ended. */ } }, 2000)
  force.unref()
  return Promise.resolve()
}

/**
 * Runs the CLI directly, never through a shell, so no argument is interpreted. stderr is drained and dropped:
 * provider errors there can hold credentials. Resolves once the process ended, or soon after it was killed.
 */
export function runProcess(executable: string, args: readonly string[], options: ProcessOptions): Promise<ProcessResult> {
  return new Promise(resolve => {
    if (options.signal.aborted) {
      resolve({ startFailed: false, code: null, malformed: false, killed: true, stdout: '' })
      return
    }
    const limit = options.maxOutputBytes ?? 16 * 1024 * 1024
    let child: ReturnType<typeof spawn>
    try {
      child = spawn(executable, [...args], {
        cwd: options.cwd, env: options.env, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      })
    } catch {
      resolve({ startFailed: true, code: null, malformed: false, killed: false, stdout: '' })
      return
    }
    let pending = ''
    let stdout = ''
    let total = 0
    let malformed = false
    let killed = false
    let settled = false
    let killing: Promise<void> | undefined
    const finish = (result: Omit<ProcessResult, 'stdout'>) => {
      if (settled) return
      settled = true
      options.signal.removeEventListener('abort', abort)
      resolve({ ...result, stdout: options.collect ? stdout : '' })
    }
    const stop = () => {
      if (child.pid === undefined || killing) return
      killing = killTree(child.pid)
      // A process that ignores the kill still releases the request soon; its output is no longer read.
      setTimeout(() => finish({ startFailed: false, code: null, malformed, killed: true }), 3000).unref()
    }
    const abort = () => { killed = true; stop() }
    options.signal.addEventListener('abort', abort, { once: true })
    const line = (text: string) => {
      if (!text.trim() || !options.onLine) return
      let value: unknown
      try { value = JSON.parse(text) } catch { malformed = true; stop(); return }
      options.onLine(value)
    }
    child.stdout!.setEncoding('utf8')
    child.stdout!.on('data', (data: string) => {
      if (malformed || killed) return
      total += Buffer.byteLength(data)
      if (total > limit) { malformed = true; stop(); return }
      if (options.collect) stdout += data
      pending += data
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      if (pending.length > maxLine) { malformed = true; stop(); return }
      for (const text of lines) {
        if (malformed || killed) return
        line(text)
      }
    })
    child.stderr!.resume()
    child.stdin!.on('error', () => {})
    child.on('error', () => finish({ startFailed: true, code: null, malformed, killed }))
    child.on('close', code => {
      if (!malformed && !killed && pending.trim()) line(pending)
      void Promise.resolve(killing).then(() => finish({ startFailed: false, code, malformed, killed }))
    })
    child.stdin!.end(options.input ?? '')
  })
}
