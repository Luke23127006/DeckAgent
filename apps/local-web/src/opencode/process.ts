import { spawn } from 'node:child_process'
import { join } from 'node:path'

/** The POC is pinned to the Windows binary verified by the feasibility spike. */
export function runOpenCode(
  executable: string,
  args: readonly string[],
  options: {
    cwd: string
    env: NodeJS.ProcessEnv
    signal: AbortSignal
    input?: string
    event?: (value: unknown) => void
  },
): Promise<{ code: number | null; stdout: string }> {
  return new Promise((resolve, reject) => {
    if (options.signal.aborted) {
      reject(new Error('Stopped'))
      return
    }
    const child = spawn(executable, [...args], {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = '',
      pending = '',
      malformed = false,
      killFailed = false
    let killing: Promise<void> | undefined
    const stop = () => {
      if (child.pid === undefined) return
      killing ??= new Promise<void>(done => {
        const killer = spawn(
          join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe'),
          ['/PID', String(child.pid), '/T', '/F'],
          { windowsHide: true, stdio: 'ignore' },
        )
        killer.on('error', () => {
          killFailed = true
          done()
        })
        killer.on('close', code => {
          killFailed = code !== 0
          done()
        })
      })
    }
    options.signal.addEventListener('abort', stop, { once: true })
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (data: string) => {
      if (malformed || options.signal.aborted) return
      if (stdout.length + data.length > 4_000_000) {
        malformed = true
        stop()
        return
      }
      stdout += data
      if (!options.event) return
      pending += data
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      for (const line of lines)
        if (line.trim()) {
          try {
            options.event(JSON.parse(line))
          } catch {
            malformed = true
            stop()
            return
          }
        }
    })
    // Provider errors can contain credentials. Never publish or persist raw stderr.
    child.stderr.resume()
    child.stdin.on('error', () => {})
    child.on('error', () => {
      options.signal.removeEventListener('abort', stop)
      reject(new Error('OpenCode could not start'))
    })
    child.on('close', async code => {
      options.signal.removeEventListener('abort', stop)
      await killing
      if (malformed || (options.event && pending.trim()) || killFailed) {
        reject(new Error('OpenCode execution failed'))
        return
      }
      resolve({ code, stdout })
    })
    child.stdin.end(options.input ?? '')
    if (options.signal.aborted) stop()
  })
}
