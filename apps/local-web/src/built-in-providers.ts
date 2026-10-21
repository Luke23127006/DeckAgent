import type { ProviderTemplate } from '@deckagent/host-api'

/** Compatibility IDs/endpoints already used by config/models.example.json. No default model IDs are invented. */
export const builtInProviders: readonly ProviderTemplate[] = [
  { id: 'openai', displayName: 'OpenAI', protocol: 'chat-completions', baseUrl: 'https://api.openai.com/v1' },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    protocol: 'anthropic-messages',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'google',
    displayName: 'Google Gemini',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  { id: 'deepseek', displayName: 'DeepSeek', protocol: 'chat-completions', baseUrl: 'https://api.deepseek.com' },
]
