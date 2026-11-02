import type { ModelConnection } from '@deckagent/model-providers'
import { HttpError } from '@deckagent/host-api'

type Options = Pick<
  ModelConnection,
  'timeoutMs' | 'maxOutputTokens' | 'temperature' | 'tokenLimitField' | 'reasoningOptions'
>

/** Keep connection defaults that older configs supply but the settings form does not edit. */
export function generationOptions(value: unknown): Options {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(500, 'SETTINGS_STORAGE')
  const invalid = () => {
    throw new HttpError(500, 'SETTINGS_STORAGE')
  }
  const timeoutMs = 'timeoutMs' in value ? value.timeoutMs : undefined
  const maxOutputTokens = 'maxOutputTokens' in value ? value.maxOutputTokens : undefined
  const temperature = 'temperature' in value ? value.temperature : undefined
  const tokenLimitField = 'tokenLimitField' in value ? value.tokenLimitField : undefined
  if (timeoutMs !== undefined && typeof timeoutMs !== 'number') invalid()
  if (maxOutputTokens !== undefined && typeof maxOutputTokens !== 'number') invalid()
  if (temperature !== undefined && typeof temperature !== 'number') invalid()
  if (tokenLimitField !== undefined && tokenLimitField !== 'max_tokens' && tokenLimitField !== 'max_completion_tokens')
    invalid()
  const raw = 'reasoningOptions' in value ? value.reasoningOptions : undefined
  const reasoningOptions: { label: string; apiValue: string }[] = []
  if (raw !== undefined) {
    if (!Array.isArray(raw)) throw new HttpError(500, 'SETTINGS_STORAGE')
    for (const option of raw) {
      if (
        !option ||
        typeof option !== 'object' ||
        typeof option.label !== 'string' ||
        typeof option.apiValue !== 'string'
      )
        throw new HttpError(500, 'SETTINGS_STORAGE')
      reasoningOptions.push({ label: option.label, apiValue: option.apiValue })
    }
  }
  return {
    ...(typeof timeoutMs === 'number' ? { timeoutMs } : {}),
    ...(typeof maxOutputTokens === 'number' ? { maxOutputTokens } : {}),
    ...(typeof temperature === 'number' ? { temperature } : {}),
    ...(tokenLimitField === 'max_tokens' || tokenLimitField === 'max_completion_tokens' ? { tokenLimitField } : {}),
    ...(raw !== undefined ? { reasoningOptions } : {}),
  }
}
