import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelConnection } from './index.ts'

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function invalid(): never {
  throw new RuntimeError('MODEL_PROTOCOL', 'Invalid model catalog response')
}

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) invalid()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.byteLength
      if (bytes > 1024 * 1024) invalid()
      chunks.push(part.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally {
    // Response body cancellation cannot change a parsed catalog or its failure.
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

/** One explicit catalog lookup, bounded to ten pages and 1000 unique IDs. */
export async function listModels(
  connection: ModelConnection,
  credential: string | undefined,
  signal: AbortSignal,
): Promise<readonly string[]> {
  const gemini = connection.protocol === 'gemini'
  const anthropic = connection.protocol === 'anthropic-messages'
  const ids = new Set<string>()
  let cursor: string | undefined
  const seenCursors = new Set<string>()
  try {
    for (let page = 0; page < 10; page++) {
      const url = new URL(`${connection.baseUrl.replace(/\/+$/, '')}/models`)
      if (cursor) url.searchParams.set(gemini ? 'pageToken' : 'after_id', cursor)
      const response = await fetch(url, {
        signal,
        redirect: 'error',
        headers: {
          ...(anthropic ? { 'anthropic-version': '2023-06-01' } : {}),
          ...(credential
            ? gemini
              ? { 'x-goog-api-key': credential }
              : anthropic
                ? { 'x-api-key': credential }
                : { authorization: `Bearer ${credential}` }
            : {}),
        },
      })
      if (!response.ok) {
        // No raw provider error body reaches the UI, even when it echoes credentials.
        await response.body?.cancel()
        throw new RuntimeError(
          response.status === 401 || response.status === 403
            ? 'PROVIDER_AUTH'
            : response.status === 429
              ? 'PROVIDER_RATE_LIMIT'
              : 'PROVIDER_HTTP',
          'Cannot load model catalog',
        )
      }
      const data = await boundedJson(response)
      if (!record(data)) invalid()
      const entries = gemini ? data.models : data.data
      if (entries !== undefined && !Array.isArray(entries)) invalid()
      for (const entry of entries ?? []) {
        if (!record(entry)) invalid()
        const raw = gemini ? entry.name : entry.id
        if (typeof raw !== 'string') invalid()
        if (
          gemini &&
          (!Array.isArray(entry.supportedGenerationMethods) ||
            !entry.supportedGenerationMethods.includes('generateContent'))
        )
          continue
        const id = gemini ? raw.replace(/^models\//, '') : raw
        if (!/^[\x21-\x7e]{1,200}$/.test(id)) invalid()
        ids.add(id)
        if (ids.size > 1000) invalid()
      }
      const next = gemini ? data.nextPageToken : anthropic && data.has_more === true ? data.last_id : undefined
      if (next === undefined || next === '') return [...ids]
      if (typeof next !== 'string' || next.length > 2048 || seenCursors.has(next)) invalid()
      seenCursors.add(next)
      cursor = next
    }
    throw new RuntimeError('MODEL_PROTOCOL', 'Model catalog exceeds the supported page limit. Add models by ID instead')
  } catch (error) {
    if (error instanceof RuntimeError) throw error
    throw new RuntimeError(
      signal.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK',
      'Cannot load model catalog. Add models by ID instead',
    )
  }
}
