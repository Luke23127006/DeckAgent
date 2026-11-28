import { z } from 'zod'
import type { ModelSelection } from './requests.ts'
import { RequestValidationError } from './request-validation.ts'

const modelSelectionSchema = z.strictObject({
  provider: z.string().regex(/^[\w.-]{1,100}$/),
  model: z
    .string()
    .max(200)
    .refine(value => value.trim().length > 0),
})

const chatCreateBodySchema = z.strictObject({
  selection: z.unknown().optional(),
})

const chatSearchBodySchema = z.strictObject({
  words: z.string().max(500),
})

export function decodeModelSelection(value: unknown): ModelSelection {
  const parsed = modelSelectionSchema.safeParse(value)
  if (!parsed.success) {
    throw new RequestValidationError('INVALID_SELECTION', 'Model selection payload is invalid')
  }
  return parsed.data
}

export function decodeChatCreateBody(value: unknown): { readonly selection?: ModelSelection } {
  const parsed = chatCreateBodySchema.safeParse(value)
  if (!parsed.success) {
    throw new RequestValidationError('INVALID_SESSION', 'Chat create payload is invalid')
  }
  return parsed.data.selection === undefined ? {} : { selection: decodeModelSelection(parsed.data.selection) }
}

export function decodeChatSearchBody(value: unknown): { readonly words: string } {
  const parsed = chatSearchBodySchema.safeParse(value)
  if (!parsed.success) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  return parsed.data
}
