export type TavilyErrorCode =
  | 'SOURCE_ARGUMENTS_INVALID'
  | 'RESEARCH_KEY_REJECTED'
  | 'RESEARCH_QUOTA_EXHAUSTED'
  | 'RESEARCH_UNAVAILABLE'
  | 'RESEARCH_RESPONSE_TOO_LARGE'
  | 'RESEARCH_FREE_ONLY'

export class TavilyError extends Error {
  constructor(readonly code: TavilyErrorCode) {
    super(code)
    this.name = 'TavilyError'
  }
}

export interface ResearchResult {
  readonly requestId?: string
  readonly results: readonly {
    readonly title: string
    readonly url: string
    readonly content: string
    readonly partial: boolean
  }[]
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const failure = (code: TavilyErrorCode = 'RESEARCH_UNAVAILABLE') => new TavilyError(code)

export interface ImageSearchCandidate {
  readonly imageUrl: string
  readonly sourceUrl?: string
  readonly sourcePages?: readonly string[]
  readonly title: string
  readonly description: string
}

/** Fixed endpoints, no redirects, no raw provider failures and no automatic paid fallback. */
export class TavilyClient {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async images(key: string, query: string, signal: AbortSignal): Promise<readonly ImageSearchCandidate[]> {
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
    if (!query.trim() || query.length > 500 || !query.isWellFormed()) throw new TavilyError('SOURCE_ARGUMENTS_INVALID')

    await this.check(key, deadline)
    const response = await this.json('search', key, deadline, {
      query,
      search_depth: 'basic',
      auto_parameters: false,
      max_results: 5,
      topic: 'general',
      include_answer: false,
      include_raw_content: false,
      include_images: true,
      include_image_descriptions: true,
      include_usage: true,
    })
    const safe = (v: unknown): v is string => {
      if (typeof v !== 'string' || v.length > 2048) return false
      try {
        const url = new URL(v)
        return url.protocol === 'https:' && !url.username && !url.password && !url.port
      } catch {
        return false
      }
    }
    const candidates: ImageSearchCandidate[] = []
    const add = (entry: unknown, page?: Record<string, unknown>) => {
      if (!record(entry) || !safe(entry.url) || candidates.some(c => c.imageUrl === entry.url)) return
      candidates.push({
        imageUrl: entry.url,
        ...(page && safe(page.url) ? { sourceUrl: page.url } : {}),
        ...(!page
          ? {
              sourcePages: Array.isArray(response.results)
                ? response.results
                    .filter(record)
                    .map(r => r.url)
                    .filter(safe)
                    .slice(0, 5)
                : [],
            }
          : {}),
        title: page && typeof page.title === 'string' ? page.title.slice(0, 300) : '',
        description: typeof entry.description === 'string' ? entry.description.slice(0, 1500) : '',
      })
    }
    if (!Array.isArray(response.results) || !Array.isArray(response.images)) throw failure()

    for (const page of response.results.slice(0, 5))
      if (record(page) && Array.isArray(page.images)) for (const entry of page.images.slice(0, 5)) add(entry, page)

    for (const entry of response.images.slice(0, 5)) add(entry)

    return candidates.slice(0, 5)
  }

  private async json(
    path: 'usage' | 'search',
    key: string,
    signal: AbortSignal,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    try {
      const response = await this.fetcher(`https://api.tavily.com/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        redirect: 'error',
        signal,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw failure(
          response.status === 401 || response.status === 403
            ? 'RESEARCH_KEY_REJECTED'
            : response.status === 432 || response.status === 433
              ? 'RESEARCH_QUOTA_EXHAUSTED'
              : 'RESEARCH_UNAVAILABLE',
        )
      }
      const reader = response.body?.getReader()
      if (!reader) throw failure()
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        for (;;) {
          signal.throwIfAborted()
          const part = await reader.read()
          if (part.done) break
          size += part.value.byteLength
          if (size > 256 * 1024) throw failure('RESEARCH_RESPONSE_TOO_LARGE')
          chunks.push(part.value)
        }
      } finally {
        await reader.cancel().catch(() => {})
      }
      const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!record(value)) throw failure()
      return value
    } catch (error) {
      signal.throwIfAborted()
      if (error instanceof TavilyError) throw error
      throw failure()
    }
  }

  async check(key: string, signal: AbortSignal) {
    const value = await this.json('usage', key, signal)
    const account = value.account
    const item = value.key
    if (
      !record(account) ||
      !record(item) ||
      account.current_plan !== 'Researcher' ||
      account.paygo_usage !== 0 ||
      (account.paygo_limit !== null && account.paygo_limit !== 0)
    )
      throw failure('RESEARCH_FREE_ONLY')

    const count = (n: unknown): n is number => Number.isSafeInteger(n) && Number(n) >= 0
    if (
      !count(account.plan_usage) ||
      !count(account.plan_limit) ||
      account.plan_limit > 1000 ||
      account.plan_limit <= account.plan_usage ||
      !count(item.usage) ||
      (item.limit !== null && (!count(item.limit) || item.limit <= item.usage))
    )
      throw failure('RESEARCH_QUOTA_EXHAUSTED')

    return {
      remaining: Math.min(
        account.plan_limit - account.plan_usage,
        item.limit === null ? 1000 : Number(item.limit) - item.usage,
      ),
    }
  }

  async search(key: string, query: string, signal: AbortSignal): Promise<ResearchResult> {
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
    if (!query.trim() || query.length > 1000 || !query.isWellFormed()) throw new TavilyError('SOURCE_ARGUMENTS_INVALID')

    await this.check(key, deadline)
    const response = await this.json('search', key, deadline, {
      query,
      search_depth: 'basic',
      auto_parameters: false,
      max_results: 5,
      topic: 'general',
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_usage: true,
    })
    if (!Array.isArray(response.results)) throw failure()

    const results: ResearchResult['results'][number][] = []
    for (const entry of response.results.slice(0, 5)) {
      if (
        !record(entry) ||
        typeof entry.title !== 'string' ||
        typeof entry.url !== 'string' ||
        typeof entry.content !== 'string'
      )
        throw failure()
      let url: URL
      try {
        url = new URL(entry.url)
      } catch {
        throw failure()
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || entry.url.length > 2048)
        throw failure()
      results.push({
        title: entry.title.slice(0, 300),
        url: entry.url,
        content: entry.content.slice(0, 6000),
        partial: true,
      })
    }

    return {
      ...(typeof response.request_id === 'string' && /^[\w-]{1,200}$/.test(response.request_id)
        ? { requestId: response.request_id }
        : {}),
      results,
    }
  }
}
