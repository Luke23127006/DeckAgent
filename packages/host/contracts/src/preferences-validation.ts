import { z } from 'zod'
import { RequestValidationError } from './request-validation.ts'
import { nonNegativeInt } from './validation-primitives.ts'

export type ResearchSaveBody = ({ readonly key: string } | { readonly useEnvironment: true }) & {
  readonly expectedVersion: number
}

export interface PreferencesSaveBody {
  readonly theme: 'light' | 'dark' | 'system'
  readonly expectedVersion: number
}

const preferencesSaveBody = z.strictObject({
  theme: z.enum(['light', 'dark', 'system']),
  expectedVersion: nonNegativeInt,
})
const researchSaveBody = z.union([
  z.strictObject({
    key: z
      .string()
      .min(1)
      .max(4096)
      .refine(s => s.trim().length > 0),
    expectedVersion: nonNegativeInt,
  }),
  z.strictObject({ useEnvironment: z.literal(true), expectedVersion: nonNegativeInt }),
])
const researchRemoveBody = z.strictObject({ expectedVersion: nonNegativeInt })

function invalidBody(): never {
  throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
}

export function decodePreferencesSaveBody(value: unknown): PreferencesSaveBody {
  const parsed = preferencesSaveBody.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}

export function decodeResearchSaveBody(value: unknown): ResearchSaveBody {
  const parsed = researchSaveBody.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}

export function decodeResearchRemoveBody(value: unknown): { readonly expectedVersion: number } {
  const parsed = researchRemoveBody.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}
