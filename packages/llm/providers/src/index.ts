import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelAdapter, ModelEvent, ModelRequest, ModelSelection } from '@deckagent/agent-runtime'
import { chatBody, chatEvents } from './chat-completions.ts'
import { anthropicBody, anthropicEvents } from './anthropic-messages.ts'
import { geminiBody, geminiEvents } from './gemini.ts'
import { events } from './wire.ts'

export interface ModelConnection {
  readonly id: string
  readonly protocol: 'chat-completions' | 'anthropic-messages' | 'gemini'
  /** API root, e.g. https://api.openai.com/v1; endpoint suffix is added by adapter. */
  readonly baseUrl: string
  /** Name of an environment variable, never the key itself. Omit for a no-auth endpoint. */
  readonly apiKeyEnv?: string
  readonly timeoutMs?: number
  readonly maxOutputTokens?: number
  /** Chat Completions endpoints differ in which token limit field they accept. */
  readonly tokenLimitField?: 'max_tokens' | 'max_completion_tokens'
  readonly temperature?: number
}

function invalidConfig(): never {
  throw new RuntimeError('PROVIDER_CONFIG', 'Invalid model connection configuration')
}

const certificateCodes = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID',
])
const networkCodes = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
  'EHOSTUNREACH', 'ENETUNREACH', 'EACCES', 'EPERM', 'EPIPE',
  'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET', 'UND_ERR_RESPONSE_STATUS_CODE', 'ERR_INVALID_CHAR',
  'ERR_ENCODING_INVALID_ENCODED_DATA', 'Z_DATA_ERROR',
])

/** Copy only recognized diagnostic labels, never exception messages, URLs or headers. */
function transportCode(error: unknown): string | undefined {
  let current = error
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const code = 'code' in current ? current.code : undefined
    if (typeof code === 'string' && (certificateCodes.has(code) || networkCodes.has(code))) return code
    current = 'cause' in current ? current.cause : undefined
  }
  return undefined
}

export class ModelProviders implements ModelAdapter {
  private readonly connections = new Map<string, ModelConnection>()
  private readonly environment: Readonly<Record<string, string | undefined>>

  constructor(connections: readonly ModelConnection[], options: { environment?: Readonly<Record<string, string | undefined>> } = {}) {
    this.environment = options.environment ?? process.env
    if (!Array.isArray(connections) || !connections.length) invalidConfig()
    for (const connection of connections) {
      if (!connection || typeof connection.id !== 'string' || !/^[\w.-]+$/.test(connection.id) || this.connections.has(connection.id)
        || !['chat-completions', 'anthropic-messages', 'gemini'].includes(connection.protocol) || typeof connection.baseUrl !== 'string') invalidConfig()
      if (Object.keys(connection).some(key => !['id', 'protocol', 'baseUrl', 'apiKeyEnv', 'timeoutMs', 'maxOutputTokens', 'tokenLimitField', 'temperature'].includes(key))) invalidConfig()
      if (connection.tokenLimitField !== undefined && (connection.protocol !== 'chat-completions' || !['max_tokens', 'max_completion_tokens'].includes(connection.tokenLimitField))) invalidConfig()
      let url: URL
      try { url = new URL(connection.baseUrl) } catch { invalidConfig() }
      if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:'
        && !(url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)))) invalidConfig()
      if (connection.apiKeyEnv !== undefined && (typeof connection.apiKeyEnv !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(connection.apiKeyEnv))) invalidConfig()
      for (const key of ['timeoutMs', 'maxOutputTokens'] as const) {
        if (connection[key] !== undefined && (!Number.isSafeInteger(connection[key]) || connection[key]! < 1 || connection[key]! > 2_147_483_647)) invalidConfig()
      }
      if (connection.temperature !== undefined && (!Number.isFinite(connection.temperature) || connection.temperature < 0 || connection.temperature > 2)) invalidConfig()
      this.connections.set(connection.id, structuredClone(connection))
    }
  }

  /** Validate selection and credential availability without making a network request. */
  validateSelection(selection: ModelSelection): void {
    this.resolve(selection)
  }

  private resolve(selection: ModelSelection): { connection: ModelConnection; credential: string | undefined } {
    if (typeof selection.model !== 'string' || !selection.model.trim()) invalidConfig()
    const connection = this.connections.get(selection.provider)
    if (!connection) throw new RuntimeError('PROVIDER_NOT_FOUND', 'Selected model connection is not configured')
    const credential = connection.apiKeyEnv ? this.environment[connection.apiKeyEnv] : undefined
    if (connection.apiKeyEnv && !credential?.trim()) {
      throw new RuntimeError('PROVIDER_CREDENTIALS', 'Set the configured API key environment variable before sending a message')
    }
    if (credential !== undefined && !/^[\x21-\x7e]+$/.test(credential)) {
      throw new RuntimeError('PROVIDER_CREDENTIALS', 'API key must contain printable ASCII characters without whitespace. Copy the original key again; remove invisible characters or surrounding quotes')
    }
    if (connection.protocol === 'gemini' && !/^[A-Za-z0-9._-]+$/.test(selection.model)) {
      throw new RuntimeError('PROVIDER_CONFIG', 'Gemini selection.model must be a model ID without models/ prefix')
    }
    return { connection, credential }
  }

  async *stream(request: ModelRequest): AsyncGenerator<ModelEvent> {
    const { connection, credential } = this.resolve(request.selection)
    const timeout = AbortSignal.timeout(connection.timeoutMs ?? 120_000)
    const signal = AbortSignal.any([request.signal, timeout])
    let response: Response | undefined
    let phase: 'request' | 'stream' = 'request'
    try {
      signal.throwIfAborted()
      const anthropic = connection.protocol === 'anthropic-messages'
      const gemini = connection.protocol === 'gemini'
      const payload = gemini ? geminiBody(request) : anthropic ? anthropicBody(request) : chatBody(request)
      if (anthropic) payload.max_tokens = connection.maxOutputTokens ?? 4096
      else if (!gemini && connection.maxOutputTokens !== undefined) payload[connection.tokenLimitField ?? 'max_tokens'] = connection.maxOutputTokens
      if (gemini) {
        if (connection.maxOutputTokens !== undefined || connection.temperature !== undefined) payload.generationConfig = {
          ...(connection.maxOutputTokens !== undefined ? { maxOutputTokens: connection.maxOutputTokens } : {}),
          ...(connection.temperature !== undefined ? { temperature: connection.temperature } : {}),
        }
      } else if (connection.temperature !== undefined) payload.temperature = connection.temperature
      const endpoint = gemini ? `models/${encodeURIComponent(request.selection.model)}:streamGenerateContent?alt=sse`
        : anthropic ? 'messages' : 'chat/completions'
      response = await fetch(`${connection.baseUrl.replace(/\/+$/, '')}/${endpoint}`, {
        method: 'POST', headers: {
          'content-type': 'application/json', ...(anthropic ? { 'anthropic-version': '2023-06-01' } : {}),
          ...(credential ? gemini ? { 'x-goog-api-key': credential } : anthropic ? { 'x-api-key': credential } : { authorization: `Bearer ${credential}` } : {}),
        },
        body: JSON.stringify(payload), signal, redirect: 'error',
      })
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'PROVIDER_AUTH'
          : response.status === 429 ? 'PROVIDER_RATE_LIMIT' : 'PROVIDER_HTTP'
        throw new RuntimeError(code, `Model API request failed (HTTP ${response.status})`)
      }
      phase = 'stream'
      yield* (gemini ? geminiEvents(events(response)) : anthropic ? anthropicEvents(events(response)) : chatEvents(events(response)))
    } catch (error) {
      if (request.signal.aborted) throw new RuntimeError('ABORTED', 'Model request cancelled')
      if (timeout.aborted) throw new RuntimeError('PROVIDER_TIMEOUT', 'Model API request timed out')
      if (error instanceof RuntimeError) throw error
      const code = transportCode(error)
      if (code && certificateCodes.has(code)) {
        throw new RuntimeError('PROVIDER_TLS', 'Model API certificate verification failed. Check certificate trust/expiry; for a trusted OS CA, restart Node.js with --use-system-ca')
      }
      throw new RuntimeError('PROVIDER_NETWORK', `Model API ${phase} failed${code ? ` (${code})` : ' (no recognized transport code)'}`)
    } finally {
      await response?.body?.cancel().catch(() => {})
    }
  }
}
