import { createHash, randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { HttpError } from '@deckagent/host-api'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import type { CredentialStore } from './credential-store.ts'
import { TavilyClient } from './tavily.ts'
import { record } from './web-state.ts'

interface Configuration {
  readonly revision: string
  readonly reference?: string
  readonly disabled?: true
  readonly environment?: true
}

/** Web configuration owns references only; immutable request capabilities retain the admitted key. */
export class ResearchService {
  private queue: Promise<void> = Promise.resolve()
  private settingsQueue: Promise<void> = Promise.resolve()
  private readonly client: TavilyClient

  constructor(
    private readonly db: DatabaseSync,
    private readonly credentials: CredentialStore,
    private readonly store: SqliteSessionStore,
    private readonly environmentKey: string | undefined,
    fetcher?: typeof fetch,
  ) {
    this.client = new TavilyClient(fetcher)
  }

  private configuration(): Configuration {
    const row = this.db.prepare("SELECT value FROM preferences WHERE key = 'research'").get()
    if (row) {
      try {
        const value: unknown = JSON.parse(String(row.value))
        if (record(value) && typeof value.revision === 'string') {
          if (value.disabled === true) return { revision: value.revision, disabled: true }
          if (value.environment === true) return { revision: value.revision, environment: true }
          if (typeof value.reference === 'string' && /^cred-[a-f0-9-]{36}$/.test(value.reference))
            return { revision: value.revision, reference: value.reference }
        }
      } catch {
        /* Fail closed on damaged configuration. */
      }
      throw new HttpError(500, 'RESEARCH_UNAVAILABLE')
    }
    return {
      revision: createHash('sha256')
        .update(this.environmentKey ?? 'no-key')
        .digest('hex'),
    }
  }

  settings() {
    const config = this.configuration()
    return {
      provider: 'tavily' as const,
      configured: !config.disabled && !!(config.reference || this.environmentKey),
      environmentKey: !!this.environmentKey,
      freeOnly: true as const,
    }
  }

  private async key(config: Configuration): Promise<string> {
    if (config.disabled) throw new HttpError(503, 'RESEARCH_UNAVAILABLE')
    try {
      const key = config.reference ? await this.credentials.read(config.reference) : this.environmentKey
      if (!key?.trim() || key.length > 4096) throw new Error()
      return key
    } catch {
      throw new HttpError(503, 'RESEARCH_KEY_UNAVAILABLE')
    }
  }

  private async change(operation: () => Promise<void>) {
    const work = this.settingsQueue.then(operation)
    this.settingsQueue = work.catch(() => {})
    return work
  }

  async save(value: unknown) {
    if (
      !record(value) ||
      Object.keys(value).some(key => !['key', 'useEnvironment'].includes(key)) ||
      (value.useEnvironment !== true &&
        (typeof value.key !== 'string' || !value.key.trim() || value.key.length > 4096)) ||
      (value.useEnvironment === true && value.key !== undefined)
    )
      throw new HttpError(400, 'INVALID_REQUEST')
    await this.change(async () => {
      const key = value.useEnvironment === true ? this.environmentKey : String(value.key)
      if (!key) throw new HttpError(503, 'RESEARCH_KEY_UNAVAILABLE')
      await this.client.check(key, AbortSignal.timeout(15_000))
      const previous = this.configuration()
      let reference: string | undefined
      try {
        if (value.useEnvironment !== true) reference = await this.credentials.save(key)
        this.db
          .prepare(
            "INSERT INTO preferences (key, value) VALUES ('research', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          )
          .run(JSON.stringify({ revision: randomUUID(), ...(reference ? { reference } : { environment: true }) }))
      } catch {
        if (reference) await this.credentials.remove(reference).catch(() => {})
        throw new HttpError(500, 'RESEARCH_NOT_SAVED')
      }
      if (previous.reference) await this.credentials.remove(previous.reference).catch(() => {})
    })
  }

  async remove() {
    await this.change(async () => {
      const previous = this.configuration()
      this.db
        .prepare(
          "INSERT INTO preferences (key, value) VALUES ('research', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(JSON.stringify({ revision: randomUUID(), disabled: true }))
      if (previous.reference) await this.credentials.remove(previous.reference).catch(() => {})
    })
  }

  async prepare(selected: boolean) {
    if (!selected) return undefined
    const config = this.configuration()
    const key = await this.key(config)
    return {
      revision: config.revision,
      search: async (query: string, requestId: string, sessionId: string, signal: AbortSignal) => {
        // Reserve outside the queue: waiting, failed and cancelled attempts never replenish a budget.
        signal.throwIfAborted()
        this.store.requests.reserveResearch(requestId, sessionId)
        const work = this.queue.then(async () => {
          signal.throwIfAborted()
          if (query.includes(key)) throw new HttpError(400, 'SOURCE_ARGUMENTS_INVALID')
          const result = await this.client.search(key, query, signal)
          signal.throwIfAborted()
          if (JSON.stringify(result).includes(key)) throw new HttpError(503, 'RESEARCH_UNAVAILABLE')
          return this.store.requests.recordResearch(requestId, sessionId, query, result)
        })
        this.queue = work.then(
          () => {},
          () => {},
        )
        return work
      },
    }
  }
}
