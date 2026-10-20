import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { RuntimeError } from '@deckagent/agent-runtime'
import type { SetupPrompts } from './setup.ts'

/** One setup reader. Secrets are neither echoed nor kept in readline history. */
export class TerminalPrompts implements SetupPrompts {
  private readonly abort = new AbortController()
  private readonly lines: ReturnType<typeof createInterface>
  private hidden = false
  private readonly interrupt = () => { this.abort.abort(); this.lines.close() }

  constructor(input: NodeJS.ReadableStream = process.stdin, private readonly output: NodeJS.WritableStream = process.stdout) {
    const echo = new Writable({ write: (chunk, _encoding, done) => {
      if (!this.hidden) this.output.write(chunk)
      done()
    } })
    this.lines = createInterface({ input, output: echo, terminal: true, historySize: 0 })
    this.lines.on('SIGINT', this.interrupt)
    this.lines.on('close', () => this.abort.abort())
    process.on('SIGINT', this.interrupt)
  }

  get signal(): AbortSignal { return this.abort.signal }
  info(message: string): void { this.output.write(message + '\n') }

  async ask(label: string, secret = false): Promise<string> {
    this.hidden = secret
    if (secret) this.output.write(label)
    try { return await this.lines.question(label, { signal: this.signal }) }
    catch { throw new RuntimeError('CLI_CANCELLED', 'Đã hủy thiết lập chat') }
    finally {
      this.hidden = false
      if (secret) this.output.write('\n')
    }
  }

  close(): void {
    process.off('SIGINT', this.interrupt)
    this.lines.close()
  }
}
