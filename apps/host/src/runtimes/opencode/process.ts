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
const maxOutput = 16 * 1024 * 1024

/** Ends the process and every child it started. Windows: taskkill /T; elsewhere the process group. */
function killTree(pid: number): Promise<void> {
  if (process.platform === 'win32') {
    return new Promise(done => {
      const killer = spawn(
        join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe'),
        ['/PID', String(pid), '/T', '/F'],
        { windowsHide: true, stdio: 'ignore' },
      )
      killer.on('error', () => done())
      killer.on('close', () => done())
    })
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    /* Already ended. */
  }
  const force = setTimeout(() => {
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {
      /* Already ended. */
    }
  }, 2000)
  force.unref()
  return Promise.resolve()
}

function spawnCliProcess(executable: string, args: readonly string[], options: ProcessOptions) {
  return spawn(executable, [...args], {
    cwd: options.cwd,
    env: options.env,
    windowsHide: true,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
}

interface LineReader {
  push(data: string): void
  flush(): void
}

/** One parsed JSON value per line, and the guards that end the process when the framing or the size is wrong. */
function createLineReader(options: ProcessOptions, onMalformed: () => void): LineReader {
  const limit = options.maxOutputBytes ?? maxOutput
  let pending = ''
  let total = 0
  let malformed = false
  const fail = () => {
    if (malformed) return
    malformed = true
    onMalformed()
  }
  const line = (text: string) => {
    if (!text.trim() || !options.onLine) return
    let value: unknown
    try {
      value = JSON.parse(text)
    } catch {
      fail()
      return
    }
    options.onLine(value)
  }
  return {
    push(data: string) {
      if (malformed) return
      total += Buffer.byteLength(data)
      if (total > limit) {
        fail()
        return
      }
      pending += data
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      if (pending.length > maxLine) {
        fail()
        return
      }
      for (const text of lines) {
        if (malformed) return
        line(text)
      }
    },
    flush() {
      if (!malformed && pending.trim()) line(pending)
    },
  }
}

/**
 * Runs the CLI directly, never through a shell, so no argument is interpreted. stderr is drained and dropped:
 * provider errors there can hold credentials. Resolves once the process ended, or soon after it was killed.
 */
export function runProcess(
  executable: string,
  args: readonly string[],
  options: ProcessOptions,
): Promise<ProcessResult> {
  return new Promise(resolve => {
    if (options.signal.aborted) {
      resolve({ startFailed: false, code: null, malformed: false, killed: true, stdout: '' })
      return
    }
    let child: ReturnType<typeof spawn>
    try {
      child = spawnCliProcess(executable, args, options)
    } catch {
      resolve({ startFailed: true, code: null, malformed: false, killed: false, stdout: '' })
      return
    }
    const { stdin, stdout, stderr } = child
    let collected = ''
    let malformed = false
    let killed = false
    let settled = false
    let killing: Promise<void> | undefined
    const finish = (result: Omit<ProcessResult, 'stdout'>) => {
      if (settled) return
      settled = true
      options.signal.removeEventListener('abort', abort)
      resolve({ ...result, stdout: options.collect ? collected : '' })
    }
    const stop = () => {
      if (child.pid === undefined || killing) return
      killing = killTree(child.pid)
      // A process that ignores the kill still releases the request soon; its output is no longer read.
      setTimeout(() => finish({ startFailed: false, code: null, malformed, killed: true }), 3000).unref()
    }
    const abort = () => {
      killed = true
      stop()
    }
    if (!stdin || !stdout || !stderr) {
      finish({ startFailed: true, code: null, malformed: false, killed: false })
      return
    }
    options.signal.addEventListener('abort', abort, { once: true })
    const reader = createLineReader(options, () => {
      malformed = true
      stop()
    })
    stdout.setEncoding('utf8')
    stdout.on('data', (data: string) => {
      if (malformed || killed) return
      if (options.collect) collected += data
      reader.push(data)
    })
    stderr.resume()
    stdin.on('error', () => {})
    child.on('error', () => finish({ startFailed: true, code: null, malformed, killed }))
    child.on('close', code => {
      if (!malformed && !killed) reader.flush()
      void Promise.resolve(killing).then(() => finish({ startFailed: false, code, malformed, killed }))
    })
    stdin.end(options.input ?? '')
  })
}
