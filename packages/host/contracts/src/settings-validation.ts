import { z } from 'zod'
import { providerProtocols } from './management.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const providerSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  protocol: z.enum(providerProtocols),
  baseUrl: z.string(),
  models: z.array(z.string()),
  hasKey: z.boolean(),
  keyAvailable: z.boolean(),
  builtIn: z.boolean(),
})

const settingsSchema = z.object({
  providers: z.array(providerSchema),
  providersVersion: nonNegativeInt,
  preferencesVersion: nonNegativeInt,
  persistentKeys: z.boolean(),
  builtIns: z.array(
    z.object({
      id: z.string(),
      displayName: z.string(),
      protocol: z.enum(providerProtocols),
      baseUrl: z.string(),
      needs: z.array(z.enum(['key', 'baseUrl'])),
    }),
  ),
  runtime: z.object({ available: z.boolean(), reason: z.string().optional() }),
  research: z
    .object({
      provider: z.literal('tavily'),
      configured: z.boolean(),
      environmentKey: z.boolean(),
      freeOnly: z.literal(true),
    })
    .optional(),
})

const preferencesSchema = z.object({ theme: z.enum(['light', 'dark', 'system']), version: nonNegativeInt })

function decode<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('INVALID_RESPONSE')
  return result.data
}

export function decodeSettings(value: unknown) {
  return decode(settingsSchema, value)
}

export function decodePreferences(value: unknown) {
  return decode(preferencesSchema, value)
}

export function decodeCatalog(value: unknown) {
  return decode(z.array(z.string()), value)
}

export function decodeSettingsSaved(value: unknown) {
  return decode(z.object({ saved: z.literal(true) }), value)
}
