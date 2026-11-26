import type { ChangeNotice } from '@deckagent/host-contracts'
import type { ChangeClient } from './transport/index.ts'

export interface ChangeWatcherOptions {
  readonly client: Pick<ChangeClient, 'watch'>
  readonly onNotice: (notice: ChangeNotice) => Promise<void> | void
  readonly retryBaseMs?: number
  readonly retryMaxMs?: number
}

/** Keeps one SSE connection to GET /api/changes and reconnects after a drop. */
export class ChangeWatcher {
  private control: AbortController | undefined

  constructor(private readonly options: ChangeWatcherOptions) {}

  start(): void {
    if (this.control && !this.control.signal.aborted) return
    const control = new AbortController()
    this.control = control
    void this.follow(control.signal)
  }

  close(): void {
    this.control?.abort()
    this.control = undefined
  }

  private async follow(signal: AbortSignal): Promise<void> {
    const base = this.options.retryBaseMs ?? 500
    const max = this.options.retryMaxMs ?? 10000
    let retry = base
    while (!signal.aborted) {
      try {
        for await (const notice of this.options.client.watch(signal)) {
          if (signal.aborted) return
          retry = base
          await this.options.onNotice(notice)
        }
      } catch (error) {
        if (signal.aborted) return
        if (error instanceof Error && error.message === 'AUTH_REQUIRED') return
      }
      await new Promise<void>(resolve => {
        const done = () => {
          clearTimeout(timer)
          signal.removeEventListener('abort', done)
          resolve()
        }
        const timer = setTimeout(done, retry)
        signal.addEventListener('abort', done, { once: true })
      })
      retry = Math.min(retry * 2, max)
    }
  }
}
