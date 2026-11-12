import type { ProviderTemplate } from '@deckagent/host-api'

/**
 * Built-in providers of BR-005 (V-1, V-6): stable IDs in every release. Each needs a key; its base URL is fixed,
 * because BR-006 V-1 does not yet allow changing it. No default model ID is invented.
 */
export const builtInProviders: readonly ProviderTemplate[] = [
  { id: 'openai', displayName: 'OpenAI', protocol: 'chat-completions', baseUrl: 'https://api.openai.com/v1', needs: ['key'] },
  { id: 'anthropic', displayName: 'Anthropic', protocol: 'anthropic-messages', baseUrl: 'https://api.anthropic.com/v1', needs: ['key'] },
  { id: 'google', displayName: 'Google Gemini', protocol: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', needs: ['key'] },
  { id: 'deepseek', displayName: 'DeepSeek', protocol: 'chat-completions', baseUrl: 'https://api.deepseek.com', needs: ['key'] },
]
