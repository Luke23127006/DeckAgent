import type { UserQuestion } from '@deckagent/host-api'

/** Validate the Host projection before rendering any interactive reply controls. */
export function userQuestion(value: unknown): UserQuestion {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
    !('questionId' in value) || typeof value.questionId !== 'string' || !/^[\w-]{1,100}$/.test(value.questionId) ||
    !('version' in value) || typeof value.version !== 'number' || !Number.isSafeInteger(value.version) || value.version < 1 ||
    !('prompt' in value) || typeof value.prompt !== 'string' || !value.prompt.trim() || value.prompt.length > 4000 ||
    !('allowSkip' in value) || typeof value.allowSkip !== 'boolean' ||
    !('options' in value) || !Array.isArray(value.options) || value.options.length > 6 ||
    value.options.some(option => typeof option !== 'string' || !option.trim() || option.length > 500) ||
    new Set(value.options).size !== value.options.length) throw new Error('INVALID_RESPONSE')
  return { questionId: value.questionId, version: value.version, prompt: value.prompt, allowSkip: value.allowSkip,
    options: value.options.map(option => String(option)) }
}
