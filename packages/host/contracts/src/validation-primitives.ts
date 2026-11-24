import { z } from 'zod'

export const nonEmptyText = z
  .string()
  .min(1)
  .refine(s => !!s.trim() && s.isWellFormed())

export const entityId = z.string().regex(/^[\w-]{1,100}$/)

export const nonNegativeInt = z.number().int().min(0).refine(Number.isSafeInteger)

export const positiveInt = z.number().int().positive().refine(Number.isSafeInteger)

export const errorCode = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/)

export const attachmentId = z.string().regex(/^att-[a-f0-9-]{36}$/)

export const sourceId = z.string().regex(/^src-[a-f0-9-]{36}$/)

export const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/)

export const isoTimestamp = z.string().refine(s => Number.isFinite(Date.parse(s)))

export const briefSourceSchema = z.strictObject({
  sourceId,
  version: positiveInt,
  kind: z.enum(['attachment', 'project-file', 'approved-file', 'research']),
})

export function invalidResponse(): never {
  throw new Error('INVALID_RESPONSE')
}

export function invalidGenerationResponse(): never {
  throw new Error('INVALID_GENERATION_RESPONSE')
}
