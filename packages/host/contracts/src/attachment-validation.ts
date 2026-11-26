import { z } from 'zod'
import { RequestValidationError } from './request-validation.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const draftSaveBodySchema = z.strictObject({
  text: z.string().refine(s => s.isWellFormed()),
  expectedRevision: nonNegativeInt,
  attachmentIds: z
    .array(z.string())
    .refine(items => new Set(items).size === items.length)
    .optional(),
})

const attachmentRemoveBodySchema = z.strictObject({
  expectedRevision: nonNegativeInt,
})

function invalidBody(): never {
  throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
}

export interface DraftSaveBody {
  readonly text: string
  readonly expectedRevision: number
  readonly attachmentIds?: readonly string[]
}

export function decodeDraftSaveBody(value: unknown): DraftSaveBody {
  const parsed = draftSaveBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  const { text, expectedRevision, attachmentIds } = parsed.data
  return { text, expectedRevision, ...(attachmentIds === undefined ? {} : { attachmentIds }) }
}

export function decodeAttachmentRemoveBody(value: unknown): { readonly expectedRevision: number } {
  const parsed = attachmentRemoveBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}
