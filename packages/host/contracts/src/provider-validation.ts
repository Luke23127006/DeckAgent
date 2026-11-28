import { z } from 'zod'
import { RequestValidationError } from './request-validation.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const saveProviderBodySchema = z.looseObject({
  expectedVersion: nonNegativeInt,
})

const removeProviderBodySchema = z.strictObject({
  expectedVersion: nonNegativeInt,
})

function invalidBody(): never {
  throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
}

export function decodeProviderSaveBody(value: unknown): {
  readonly provider: Readonly<Record<string, unknown>>
  readonly expectedVersion: number
} {
  const parsed = saveProviderBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  const { expectedVersion, ...provider } = parsed.data
  return { provider, expectedVersion }
}

export function decodeProviderRemoveBody(value: unknown): { readonly expectedVersion: number } {
  const parsed = removeProviderBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}
