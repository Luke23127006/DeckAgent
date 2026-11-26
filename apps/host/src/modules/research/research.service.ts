import { createHash, randomUUID } from 'node:crypto'
import type { CredentialStore } from '../../credential-store.ts'
import { TavilyError, type TavilyClient, type ResearchResult } from './tavily.ts'
import type { SqliteResearchStore } from './research.store.ts'

export interface ResearchSourceRecord {
  readonly sourceId: string
  readonly version: 1
  readonly kind: 'research'
  readonly provider: 'tavily'
  readonly query: string
  readonly title: string
  readonly url: string
  readonly content: string
  readonly partial: true
  readonly fingerprint: string
  readonly retrievedAt: string
  readonly providerRequestId?: string
  readonly location: { readonly kind: 'research-result'; readonly start: 0; readonly end: number }
}

export interface ResearchSessionStore {
  getInfo(sessionId: string): Promise<unknown>
  readonly requests: {
    reserveResearch(requestId: string, sessionId: string): void
    recordResearch(
      requestId: string,
      sessionId: string,
      query: string,
      result: ResearchResult,
    ): readonly ResearchSourceRecord[]
    researchSources(sessionId: string): readonly ResearchSourceRecord[]
  }
}

export interface ResearchSettings {
  readonly provider: 'tavily'
  readonly configured: boolean
  readonly environmentKey: boolean
  readonly freeOnly: true
}

type ResearchSaveInput = { readonly key: string } | { readonly useEnvironment: true }

export interface ResearchOperations {
  save(value: ResearchSaveInput, expectedVersion: number): Promise<void>
  remove(expectedVersion: number): Promise<void>
  sources(sessionId: string): Promise<readonly ResearchSourceRecord[]>
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

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
    private readonly store: SqliteResearchStore,
    private readonly credentials: CredentialStore,
    private readonly sessions: ResearchSessionStore,
    private readonly environmentKey: string | undefined,
    private readonly client: Pick<TavilyClient, 'check' | 'search' | 'images'>,
    private readonly onPreferencesChanged?: (version: number) => void,
  ) {}

  private configuration(): Configuration {
    const payload = this.store.read()
    if (payload !== undefined) {
      try {
        const value: unknown = JSON.parse(payload)
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

  settings(): ResearchSettings {
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

  async save(value: ResearchSaveInput, expectedVersion: number) {
    await this.change(async () => {
      if (expectedVersion !== this.store.version()) throw new ResearchFailure('PREFERENCES_STALE')
      const key = 'useEnvironment' in value ? this.environmentKey : value.key
      if (!key) throw new ResearchFailure('RESEARCH_KEY_UNAVAILABLE')
      try {
        await this.client.check(key, AbortSignal.timeout(15_000))
      } catch (error) {
        if (error instanceof TavilyError) throw new ResearchFailure(error.code)
        throw error
      }
      const previous = this.configuration()
      let reference: string | undefined
      let version: number | undefined
      try {
        if (!('useEnvironment' in value)) reference = await this.credentials.save(key)
        version = this.store.put(
          JSON.stringify({ revision: randomUUID(), ...(reference ? { reference } : { environment: true }) }),
          expectedVersion,
        )
      } catch {
        if (reference) await this.credentials.remove(reference).catch(() => {})
        throw new ResearchFailure('RESEARCH_NOT_SAVED')
      }
      if (version === undefined) {
        if (reference) await this.credentials.remove(reference).catch(() => {})
        throw new ResearchFailure('PREFERENCES_STALE')
      }
      this.onPreferencesChanged?.(version)
      if (previous.reference) await this.credentials.remove(previous.reference).catch(() => {})
    })
  }

  async remove(expectedVersion: number) {
    await this.change(async () => {
      if (expectedVersion !== this.store.version()) throw new ResearchFailure('PREFERENCES_STALE')
      const previous = this.configuration()
      const version = this.store.put(JSON.stringify({ revision: randomUUID(), disabled: true }), expectedVersion)
      if (version === undefined) throw new ResearchFailure('PREFERENCES_STALE')
      this.onPreferencesChanged?.(version)
      if (previous.reference) await this.credentials.remove(previous.reference).catch(() => {})
    })
  }

  async sources(sessionId: string): Promise<readonly ResearchSourceRecord[]> {
    if (!(await this.sessions.getInfo(sessionId))) throw new ResearchFailure('SESSION_NOT_FOUND')
    return this.sessions.requests.researchSources(sessionId)
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
        this.sessions.requests.reserveResearch(requestId, sessionId)
        const work = this.queue.then(async () => {
          signal.throwIfAborted()
          if (query.includes(key)) throw new ResearchFailure('SOURCE_ARGUMENTS_INVALID')
          const result = await this.client.search(key, query, signal).catch(error => {
            if (error instanceof TavilyError) throw new ResearchFailure(error.code)
            throw error
          })
          signal.throwIfAborted()
          if (JSON.stringify(result).includes(key)) throw new ResearchFailure('RESEARCH_UNAVAILABLE')
          return this.sessions.requests.recordResearch(requestId, sessionId, query, result)
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
