import { randomUUID } from 'node:crypto'
import { DeckError } from '@deckagent/deck'
import type { AgentHandle, TurnResult } from '@deckagent/agent-runtime'
import type { AgentRequest, HostOptions, RequestSnapshot } from './contracts.ts'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
  }
}

interface RequestEntry {
  snapshot: RequestSnapshot
  readonly abort: AbortController
  work: Promise<void>
}

/** In-memory request retention is bounded; durable conversation stays in SessionStore. */
export class RequestController {
  private readonly entries = new Map<string, RequestEntry>()
  private readonly busy = new Set<string>()
  private readonly listeners = new Set<(snapshot: RequestSnapshot) => void>()
  private closed = false
  private cleanupFailed = false

  constructor(private readonly openAgent: HostOptions['openAgent'], private readonly finishRequest?: HostOptions['finishRequest']) {}

  async submit(request: AgentRequest): Promise<RequestSnapshot> {
    if (this.closed) throw new HttpError(503, 'HOST_CLOSED')
    if (this.busy.has(request.sessionId)) throw new HttpError(409, 'SESSION_BUSY')
    if (this.busy.size >= 16) throw new HttpError(429, 'HOST_BUSY')
    while (this.entries.size >= 128) {
      const oldest = [...this.entries].find(([, entry]) => entry.snapshot.status !== 'running')
      if (!oldest) throw new HttpError(429, 'HOST_BUSY')
      this.entries.delete(oldest[0])
    }
    this.busy.add(request.sessionId)
    const entry: RequestEntry = {
      snapshot: { requestId: randomUUID(), sessionId: request.sessionId, status: 'running' },
      abort: new AbortController(),
      work: Promise.resolve(),
    }
    this.entries.set(entry.snapshot.requestId, entry)
    // Store admission work before awaiting: shutdown must also drain openAgent().
    let admit!: () => void
    entry.work = new Promise<void>(resolve => {
      admit = resolve
    })
    let agent: AgentHandle
    try {
      agent = await this.openAgent(request.sessionId, entry.snapshot.requestId, request)
    } catch (error) {
      this.busy.delete(request.sessionId)
      this.entries.delete(entry.snapshot.requestId)
      admit()
      if (error instanceof HttpError) throw error
      if (error instanceof DeckError && ['OUTLINE_STALE', 'OUTLINE_ALREADY_CONFIRMED', 'OUTLINE_READ_ONLY', 'OUTLINE_LIMIT'].includes(error.code))
        throw new HttpError(409, error.code)
      throw new HttpError(409, 'SESSION_UNAVAILABLE')
    }
    if (this.closed) entry.abort.abort()
    const accepted = structuredClone(entry.snapshot)
    const execution = this.run(entry, request, agent)
    // run handles all failures as safe outcomes, including handle disposal.
    entry.work = execution
    execution.then(admit, admit)
    return accepted
  }

  get(id: string): RequestSnapshot {
    const entry = this.entries.get(id)
    if (!entry) throw new HttpError(404, 'REQUEST_NOT_FOUND')
    return structuredClone(entry.snapshot)
  }

  active(sessionId: string): string | undefined {
    return [...this.entries.values()].find(entry => entry.snapshot.sessionId === sessionId && entry.snapshot.status === 'running')?.snapshot.requestId
  }

  subscribe(listener: (snapshot: RequestSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async close(): Promise<void> {
    this.closed = true
    for (const entry of this.entries.values()) entry.abort.abort()
    await Promise.all([...this.entries.values()].map(entry => entry.work))
    if (this.cleanupFailed) throw new Error('Agent cleanup failed')
  }

  private async run(entry: RequestEntry, request: AgentRequest, agent: AgentHandle): Promise<void> {
    let result: TurnResult
    try {
      result = await agent.send(request.input, { signal: entry.abort.signal })
    } catch {
      result = { status: 'failed', text: '', steps: 0, error: { code: 'REQUEST_FAILED', message: 'Request failed' } }
    }
    try {
      await agent.dispose()
    } catch {
      this.cleanupFailed = true
      result = {
        status: 'failed',
        text: result.text,
        steps: result.steps,
        error: { code: 'CLEANUP_FAILED', message: 'Agent cleanup failed' },
      }
    }
    try {
      await this.finishRequest?.(request, entry.snapshot.requestId, result)
    } catch {
      result = { status: 'failed', text: result.text, steps: result.steps,
        error: { code: 'REQUEST_FINALIZATION_FAILED', message: 'Request state could not be saved' } }
    }
    entry.snapshot = { ...entry.snapshot, status: result.status, result }
    this.busy.delete(entry.snapshot.sessionId)
    for (const listener of this.listeners) listener(structuredClone(entry.snapshot))
  }
}
