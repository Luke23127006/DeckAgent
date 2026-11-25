import { createHash, randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import type { CredentialStore } from '../../integrations/credentials/index.ts'
import { TavilyError } from '../../integrations/research/index.ts'
import type { TavilyClient } from '../../integrations/research/index.ts'
import { record } from '../../web-state.ts'

export class ResearchFailure extends Error {
  constructor(
    readonly code: string,
    readonly detail?: Readonly<Record<string, string | boolean>>,
  ) {
    super(code)
    this.name = 'ResearchFailure'
  }
}

interface Configuration {
  readonly revision: string
  readonly reference?: string
  readonly disabled?: true
  readonly environment?: true
}

/** Web configuration owns references only; immutable request capabilities retain the admitted key. */
export class ResearchCoordinator {
  private queue: Promise<void> = Promise.resolve()
  private settingsQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly db: DatabaseSync,
    private readonly credentials: CredentialStore,
    private readonly store: SqliteSessionStore,
    private readonly environmentKey: string | undefined,
    private readonly client: Pick<TavilyClient, 'check' | 'search' | 'images'>,
  ) {}

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
      throw new ResearchFailure('RESEARCH_UNAVAILABLE')
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
    if (config.disabled) throw new ResearchFailure('RESEARCH_UNAVAILABLE')
    try {
      const key = config.reference ? await this.credentials.read(config.reference) : this.environmentKey
      if (!key?.trim() || key.length > 4096) throw new Error()
      return key
    } catch {
      throw new ResearchFailure('RESEARCH_KEY_UNAVAILABLE')
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
      throw new ResearchFailure('INVALID_REQUEST')
    await this.change(async () => {
      const key = value.useEnvironment === true ? this.environmentKey : String(value.key)
      if (!key) throw new ResearchFailure('RESEARCH_KEY_UNAVAILABLE')
      try {
        await this.client.check(key, AbortSignal.timeout(15_000))
      } catch (error) {
        if (error instanceof TavilyError) throw new ResearchFailure(error.code)
        throw error
      }
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
        throw new ResearchFailure('RESEARCH_NOT_SAVED')
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
          if (query.includes(key)) throw new ResearchFailure('SOURCE_ARGUMENTS_INVALID')
          const result = await this.client.search(key, query, signal).catch(error => {
            if (error instanceof TavilyError) throw new ResearchFailure(error.code)
            throw error
          })
          signal.throwIfAborted()
          if (JSON.stringify(result).includes(key)) throw new ResearchFailure('RESEARCH_UNAVAILABLE')
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

  /** Image-only capability: neither grants text research nor writes text source receipts. */
  async imageSearch(query: string, signal: AbortSignal) {
    const key = await this.key(this.configuration())
    if (query.includes(key)) throw new ResearchFailure('SOURCE_ARGUMENTS_INVALID')
    const work = this.queue.then(async () => {
      signal.throwIfAborted()
      const images = await this.client.images(key, query, signal).catch(error => {
        if (error instanceof TavilyError) throw new ResearchFailure(error.code)
        throw error
      })
      signal.throwIfAborted()
      if (JSON.stringify(images).includes(key)) throw new ResearchFailure('RESEARCH_UNAVAILABLE')
      return images
    })
    this.queue = work.then(
      () => {},
      () => {},
    )
    return work
  }
}
