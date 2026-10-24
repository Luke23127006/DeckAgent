import type { QuestionDraft, RequestReply, UserQuestion } from './contracts.ts'
import { HttpError } from './http-error.ts'

const id = /^[\w-]{1,100}$/
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function questionDraft(value: unknown): QuestionDraft {
  if (!object(value) || typeof value.prompt !== 'string' || !value.prompt.trim() || value.prompt.length > 4000 ||
    typeof value.allowSkip !== 'boolean' || !Array.isArray(value.options) || value.options.length > 6 ||
    value.options.some(option => typeof option !== 'string' || !option.trim() || option.length > 500) ||
    new Set(value.options).size !== value.options.length) throw new Error('Invalid question')
  return { prompt: value.prompt, options: value.options.map(option => String(option)), allowSkip: value.allowSkip }
}

export function validateUserQuestion(value: unknown): UserQuestion {
  if (!object(value) || typeof value.questionId !== 'string' || !id.test(value.questionId) ||
    typeof value.version !== 'number' || !Number.isSafeInteger(value.version) || value.version < 1) throw new Error('Invalid question')
  return { ...questionDraft(value), questionId: value.questionId, version: value.version }
}

export function requestReply(value: unknown): RequestReply {
  if (!object(value) || typeof value.sessionId !== 'string' || !id.test(value.sessionId) ||
    typeof value.questionId !== 'string' || !id.test(value.questionId) ||
    typeof value.replyId !== 'string' || !id.test(value.replyId) ||
    typeof value.version !== 'number' || !Number.isSafeInteger(value.version) || value.version < 1 ||
    Object.keys(value).some(key => !['sessionId', 'questionId', 'version', 'replyId', 'answer'].includes(key)) ||
    !object(value.answer)) throw new HttpError(400, 'INVALID_REPLY')
  const base = { sessionId: value.sessionId, questionId: value.questionId, version: value.version, replyId: value.replyId }
  const answer = value.answer
  if (answer.type === 'text' && typeof answer.text === 'string' && answer.text.trim() && answer.text.length <= 16000 &&
    Object.keys(answer).every(key => ['type', 'text'].includes(key))) return { ...base, answer: { type: 'text', text: answer.text } }
  if (answer.type === 'option' && typeof answer.index === 'number' && Number.isSafeInteger(answer.index) && answer.index >= 0 &&
    Object.keys(answer).every(key => ['type', 'index'].includes(key))) return { ...base, answer: { type: 'option', index: answer.index } }
  if (answer.type === 'skip' && Object.keys(answer).length === 1) return { ...base, answer: { type: 'skip' } }
  throw new HttpError(400, 'INVALID_REPLY')
}
