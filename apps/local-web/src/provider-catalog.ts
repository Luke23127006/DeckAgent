import type { ProviderProtocol } from '@deckagent/host-api'

export interface ProviderEndpoint {
  readonly protocol: ProviderProtocol
  readonly baseUrl: string
}

/** Why a check or a catalog lookup failed. Never holds a provider response body, a URL or a key. */
export type ProviderFailure =
  | 'PROVIDER_REFUSED_KEY'
  | 'PROVIDER_NO_ANSWER'
  | 'PROVIDER_RATE_LIMIT'
  | 'PROVIDER_HTTP'
  | 'PROVIDER_PROTOCOL'
  | 'PROVIDER_TLS'

export class ProviderCheckError extends Error {
  constructor(readonly code: ProviderFailure, readonly status?: number) {
    super(code)
    this.name = 'ProviderCheckError'
  }
}

const certificateCodes = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID',
])

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function transportCode(error: unknown): string | undefined {
  let current = error
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const code = 'code' in current ? current.code : undefined
    if (typeof code === 'string') return code
    current = 'cause' in current ? current.cause : undefined
  }
  return undefined
}

/** HTTPS, or HTTP to this computer only (a local model service); no credentials, query or fragment in the URL. */
export function validBaseUrl(value: string): boolean {
  let url: URL
  try { url = new URL(value) } catch { return false }
  return !url.username && !url.password && !url.search && !url.hash && value.length <= 2048 &&
    (url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)))
}

function headers(protocol: ProviderProtocol, key: string | undefined): Record<string, string> {
  const anthropic = protocol === 'anthropic-messages'
  return {
    ...(anthropic ? { 'anthropic-version': '2023-06-01' } : {}),
    ...(key ? protocol === 'gemini' ? { 'x-goog-api-key': key } : anthropic ? { 'x-api-key': key } : { authorization: `Bearer ${key}` } : {}),
  }
}

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new ProviderCheckError('PROVIDER_PROTOCOL')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.byteLength
      if (bytes > 1024 * 1024) throw new ProviderCheckError('PROVIDER_PROTOCOL')
      chunks.push(part.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (error) {
    if (error instanceof ProviderCheckError) throw error
    throw new ProviderCheckError('PROVIDER_PROTOCOL')
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

/**
 * Lists the provider's models (FR-058): at most ten pages and 1000 IDs. With `pages: 1` it is the key and
 * connection check before saving (FR-041); a provider that does not answer counts as a refusal.
 */
export async function listModels(endpoint: ProviderEndpoint, key: string | undefined, options: { signal?: AbortSignal; pages?: number; timeoutMs?: number } = {}): Promise<readonly string[]> {
  const signal = AbortSignal.any([AbortSignal.timeout(options.timeoutMs ?? 20_000), ...(options.signal ? [options.signal] : [])])
  const gemini = endpoint.protocol === 'gemini'
  const anthropic = endpoint.protocol === 'anthropic-messages'
  const ids = new Set<string>()
  const seen = new Set<string>()
  let cursor: string | undefined
  try {
    for (let page = 0; page < (options.pages ?? 10); page++) {
      const url = new URL(`${endpoint.baseUrl.replace(/\/+$/, '')}/models`)
      if (cursor) url.searchParams.set(gemini ? 'pageToken' : 'after_id', cursor)
      const response = await fetch(url, { signal, redirect: 'error', headers: headers(endpoint.protocol, key) })
      if (!response.ok) {
        // A provider error body can echo the key; it is never read.
        await response.body?.cancel().catch(() => {})
        throw new ProviderCheckError(response.status === 401 || response.status === 403 ? 'PROVIDER_REFUSED_KEY'
          : response.status === 429 ? 'PROVIDER_RATE_LIMIT' : 'PROVIDER_HTTP', response.status)
      }
      const data = await boundedJson(response)
      if (!record(data)) throw new ProviderCheckError('PROVIDER_PROTOCOL')
      const entries = gemini ? data.models : data.data
      if (entries !== undefined && !Array.isArray(entries)) throw new ProviderCheckError('PROVIDER_PROTOCOL')
      for (const entry of entries ?? []) {
        if (!record(entry)) throw new ProviderCheckError('PROVIDER_PROTOCOL')
        const raw = gemini ? entry.name : entry.id
        if (typeof raw !== 'string') throw new ProviderCheckError('PROVIDER_PROTOCOL')
        if (gemini && (!Array.isArray(entry.supportedGenerationMethods) || !entry.supportedGenerationMethods.includes('generateContent'))) continue
        const id = gemini ? raw.replace(/^models\//, '') : raw
        if (!/^[\x21-\x7e]{1,200}$/.test(id)) throw new ProviderCheckError('PROVIDER_PROTOCOL')
        ids.add(id)
        if (ids.size > 1000) throw new ProviderCheckError('PROVIDER_PROTOCOL')
      }
      const next = gemini ? data.nextPageToken : anthropic && data.has_more === true ? data.last_id : undefined
      if (next === undefined || next === '') return [...ids]
      if (typeof next !== 'string' || next.length > 2048 || seen.has(next)) throw new ProviderCheckError('PROVIDER_PROTOCOL')
      seen.add(next)
      cursor = next
    }
    return [...ids]
  } catch (error) {
    if (error instanceof ProviderCheckError) throw error
    const code = transportCode(error)
    throw new ProviderCheckError(code && certificateCodes.has(code) ? 'PROVIDER_TLS' : 'PROVIDER_NO_ANSWER')
  }
}
