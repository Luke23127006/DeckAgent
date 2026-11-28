import { z } from 'zod'
import { RequestValidationError } from './request-validation.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const addWorkspaceBodySchema = z.strictObject({
  folder: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const selectWorkspaceBodySchema = z.strictObject({
  id: z.string(),
  expectedVersion: nonNegativeInt,
})

const renameWorkspaceBodySchema = z.strictObject({
  name: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const relinkWorkspaceBodySchema = z.strictObject({
  folder: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const removeWorkspaceBodySchema = z.strictObject({
  expectedVersion: nonNegativeInt,
})

function invalidBody(): never {
  throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
}

export function decodeWorkspaceAddBody(value: unknown): {
  readonly folder: unknown
  readonly expectedVersion: number
} {
  const parsed = addWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { folder: parsed.data.folder, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceSelectBody(value: unknown): { readonly id: string; readonly expectedVersion: number } {
  const parsed = selectWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}

export function decodeWorkspaceRenameBody(value: unknown): {
  readonly name: unknown
  readonly expectedVersion: number
} {
  const parsed = renameWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { name: parsed.data.name, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceRelinkBody(value: unknown): {
  readonly folder: unknown
  readonly expectedVersion: number
} {
  const parsed = relinkWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { folder: parsed.data.folder, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceRemoveBody(value: unknown): { readonly expectedVersion: number } {
  const parsed = removeWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}
