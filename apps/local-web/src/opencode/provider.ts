import { RuntimeError } from '@deckagent/agent-runtime'
import type { ModelSelection } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import type { ModelDescriptor } from '@deckagent/host-api'

export interface OpenCodeProvider {
  readonly selection?: ModelSelection
  readonly protocol?: ModelConnection['protocol']
  readonly baseUrl: string
  readonly model: string
  readonly key?: string
  readonly maxOutputTokens?: number
  readonly temperature?: number
  readonly timeoutMs?: number
  readonly tokenLimitField?: ModelConnection['tokenLimitField']
  readonly reasoningEffort?: string
  readonly contextWindow?: number
}

const packages = {
  'chat-completions': '@ai-sdk/openai-compatible',
  responses: '@ai-sdk/openai',
  'anthropic-messages': '@ai-sdk/anthropic',
  gemini: '@ai-sdk/google',
} as const
const efforts = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh'])
const unsupported = () => {
  throw new RuntimeError(
    'OPENCODE_UNSUPPORTED_OPTION',
    'This model option is not mapped to the pinned OpenCode runtime. Change the model settings or use the legacy backend.',
  )
}

/** A request snapshot, not a replacement provider catalog or credential store. */
export function captureProvider(
  connection: ModelConnection,
  chosen: ModelSelection,
  key: string | undefined,
  metadata?: ModelDescriptor,
): OpenCodeProvider {
  const choices = metadata?.reasoningOptions ?? connection.reasoningOptions
  const reasoningEffort =
    chosen.reasoningLevel === undefined
      ? undefined
      : choices?.find(option => option.label === chosen.reasoningLevel)?.apiValue
  if (chosen.reasoningLevel !== undefined && !reasoningEffort) unsupported()
  const snapshot: OpenCodeProvider = {
    selection: { ...chosen },
    protocol: connection.protocol,
    baseUrl: connection.baseUrl,
    model: chosen.model,
    ...(key ? { key } : {}),
    ...(metadata?.maxOutputTokens !== undefined || connection.maxOutputTokens !== undefined
      ? { maxOutputTokens: metadata?.maxOutputTokens ?? connection.maxOutputTokens! }
      : {}),
    ...(connection.temperature !== undefined ? { temperature: connection.temperature } : {}),
    ...(connection.timeoutMs !== undefined ? { timeoutMs: connection.timeoutMs } : {}),
    ...(connection.tokenLimitField !== undefined ? { tokenLimitField: connection.tokenLimitField } : {}),
    ...(reasoningEffort ? { reasoningEffort } : {}),
    ...(metadata?.contextWindow !== undefined ? { contextWindow: metadata.contextWindow } : {}),
  }
  providerConfiguration(snapshot)
  return snapshot
}

/** Only bundled SDKs; user IDs never become npm packages or native provider selectors. */
export function providerConfiguration(provider: OpenCodeProvider) {
  const protocol = provider.protocol ?? 'gemini'
  if (!Object.hasOwn(packages, protocol)) unsupported()
  if (!provider.model.trim()) unsupported()
  if (
    provider.contextWindow !== undefined &&
    (!Number.isSafeInteger(provider.contextWindow) || provider.contextWindow < 1)
  )
    unsupported()
  if (
    provider.maxOutputTokens !== undefined &&
    (!Number.isSafeInteger(provider.maxOutputTokens) ||
      provider.maxOutputTokens < 1 ||
      provider.maxOutputTokens > 32000)
  )
    unsupported()
  if (
    provider.temperature !== undefined &&
    (!Number.isFinite(provider.temperature) || provider.temperature < 0 || provider.temperature > 2)
  )
    unsupported()
  if (
    provider.timeoutMs !== undefined &&
    (!Number.isSafeInteger(provider.timeoutMs) || provider.timeoutMs < 1 || provider.timeoutMs > 180000)
  )
    unsupported()
  if (
    provider.tokenLimitField !== undefined &&
    (protocol !== 'chat-completions' || provider.tokenLimitField !== 'max_tokens')
  )
    unsupported()
  if (provider.reasoningEffort !== undefined && (protocol !== 'responses' || !efforts.has(provider.reasoningEffort)))
    unsupported()
  // The bundled Responses SDK omits temperature for reasoning calls.
  if (provider.reasoningEffort !== undefined && provider.temperature !== undefined) unsupported()
  const reasoningModel =
    (provider.model.includes('gpt-5') && !provider.model.includes('gpt-5-chat')) ||
    /(?:^|\/)o[134](?:[-.]|$)/.test(provider.model)
  if (provider.temperature !== undefined && protocol === 'responses' && reasoningModel) unsupported()
  const url = new URL(provider.baseUrl)
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== 'https:' &&
      !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))
  )
    unsupported()
  // Pinned compatible SDK drops Google's tool thought signatures. Do not permit a
  // write/tool side effect before the next API round rejects the missing signature.
  if (
    protocol === 'chat-completions' &&
    url.hostname === 'generativelanguage.googleapis.com' &&
    /\/openai$/.test(url.pathname.replace(/\/+$/, '')) &&
    /^gemini-3(?:[.-]|$)/.test(provider.model)
  )
    throw new RuntimeError(
      'OPENCODE_UNSUPPORTED_PROVIDER',
      'Use the native Gemini protocol for this model; its Chat-compatible route cannot preserve tool signatures in the pinned runtime.',
    )
  if (provider.key !== undefined && !/^[\x21-\x7e]+$/.test(provider.key))
    throw new RuntimeError('PROVIDER_CREDENTIALS', 'Enter a valid API key without whitespace.')
  if (!provider.key && protocol !== 'chat-completions')
    throw new RuntimeError('PROVIDER_CREDENTIALS', 'The selected OpenCode protocol requires an API key.')
  return {
    selector: 'deckagent/selected',
    providers: {
      deckagent: {
        npm: packages[protocol],
        name: 'DeckAgent captured connection',
        env: [],
        whitelist: ['selected'],
        options: {
          baseURL: provider.baseUrl.replace(/\/+$/, ''),
          ...(provider.key ? { apiKey: provider.key } : {}),
          timeout: provider.timeoutMs ?? 120000,
          setCacheKey: false,
        },
        models: {
          selected: {
            id: provider.model,
            name: provider.model,
            tool_call: true,
            temperature: provider.temperature !== undefined,
            reasoning: false,
            limit: {
              context: provider.contextWindow ?? 0,
              output: provider.maxOutputTokens ?? (protocol === 'anthropic-messages' ? 4096 : 32000),
            },
            options: {
              ...(provider.reasoningEffort ? { reasoningEffort: provider.reasoningEffort } : {}),
              ...(protocol === 'responses' ? { store: false } : {}),
            },
          },
        },
      },
    },
    agent: { ...(provider.temperature !== undefined ? { temperature: provider.temperature } : {}) },
  }
}
