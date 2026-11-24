import { randomUUID } from 'node:crypto'
import type { ProviderProtocol } from '@deckagent/host-api'
import type { ProviderRunSettings } from '../provider-settings.ts'

/** Only SDK packages bundled with the pinned CLI. A user-given ID never becomes a package or native provider name. */
const packages: Readonly<Record<ProviderProtocol, string>> = {
  'chat-completions': '@ai-sdk/openai-compatible',
  responses: '@ai-sdk/openai',
  'anthropic-messages': '@ai-sdk/anthropic',
  gemini: '@ai-sdk/google',
}

/** The single provider and model the run may use: `deckagent/selected`. */
export const selector = 'deckagent/selected'
/** Environment variable that carries the key into the run; the configuration only refers to it. */
export const keyVariable = 'DECKAGENT_PROVIDER_KEY'
/**
 * Placeholder replaced after encoding with `{env:DECKAGENT_PROVIDER_KEY}`. Random per process, so no value a user
 * gives (such as a model ID) can equal it and be turned into the key reference.
 */
export const keyPlaceholder = `__DECKAGENT_KEY_${randomUUID().replaceAll('-', '')}__`

export class UnsupportedProviderError extends Error {
  constructor() {
    super('The selected provider settings are not supported by the pinned OpenCode runtime')
    this.name = 'UnsupportedProviderError'
  }
}

/**
 * Maps the frozen settings of one request to an OpenCode provider block. An unsupported combination is refused,
 * never replaced by another provider or model.
 */
export function providerConfiguration(settings: ProviderRunSettings) {
  if (!Object.hasOwn(packages, settings.protocol) || !settings.model.trim()) throw new UnsupportedProviderError()
  // Without a key the SDKs of these protocols refuse to send; a custom API without a key uses Chat Completions.
  if (!settings.key && settings.protocol !== 'chat-completions') throw new UnsupportedProviderError()
  return {
    deckagent: {
      npm: packages[settings.protocol],
      name: 'DeckAgent selected provider',
      env: [],
      whitelist: ['selected'],
      options: {
        baseURL: settings.baseUrl.replace(/\/+$/, ''),
        ...(settings.key ? { apiKey: keyPlaceholder } : {}),
        timeout: 300000,
        setCacheKey: false,
      },
      models: {
        selected: {
          id: settings.model,
          name: settings.model,
          tool_call: true,
          // Permit image transport from Host MCP tools. This does not verify the remote model's vision capability;
          // the selected provider may refuse the input, and no model or source is substituted.
          modalities: { input: ['text', 'image'], output: ['text'] },
          temperature: false,
          reasoning: false,
          limit: { context: 0, output: settings.protocol === 'anthropic-messages' ? 4096 : 32000 },
          options: settings.protocol === 'responses' ? { store: false } : {},
        },
      },
    },
  }
}
