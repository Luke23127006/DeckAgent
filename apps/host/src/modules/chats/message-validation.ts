import { z } from 'zod'

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

function isJsonValue(value: unknown, parents = new Set<object>()): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || parents.has(value) || Object.getOwnPropertySymbols(value).length) return false
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false

  parents.add(value)
  const result = Array.isArray(value)
    ? Object.keys(value).length === value.length && Array.from(value).every(item => isJsonValue(item, parents))
    : Object.values(value).every(item => isJsonValue(item, parents))
  parents.delete(value)
  return result
}

function isJsonRecord(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && isJsonValue(value)
}

const nonEmptyString = z.string().refine(value => value.trim().length > 0)
const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/)
const jsonValueSchema = z.custom<JsonValue>(isJsonValue)
const jsonRecordSchema = z.custom<Record<string, JsonValue>>(isJsonRecord)

const attachmentPreparationSchema = z.strictObject({
  parserVersion: z.string().regex(/^[a-zA-Z0-9_.-]{1,80}$/),
  capabilities: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(32),
  completeness: z.enum(['complete', 'partial']),
  omitted: z
    .array(
      z.strictObject({
        code: z.string().regex(/^[A-Z_]{1,64}$/),
        entry: z.string().max(512).exactOptional(),
      }),
    )
    .max(1000),
})

const attachmentSourceSchema = z.strictObject({
  sourceId: nonEmptyString,
  version: z.literal(1),
  kind: z.literal('attachment'),
  label: nonEmptyString,
})

const messageAttachmentSchema = z.strictObject({
  attachmentId: z.string().regex(/^att-[a-f0-9-]{36}$/),
  name: nonEmptyString,
  state: z.literal('ready'),
  byteSize: z.number().int().min(0).refine(Number.isSafeInteger),
  detectedType: nonEmptyString,
  fingerprint: sha256Hex,
  source: attachmentSourceSchema,
  preparation: attachmentPreparationSchema.exactOptional(),
  parsedFingerprint: sha256Hex.exactOptional(),
})

const toolCallSchema = z.strictObject({
  id: nonEmptyString,
  name: nonEmptyString,
  arguments: jsonRecordSchema,
})

const providerStateSchema = z.strictObject({
  provider: nonEmptyString,
  model: nonEmptyString,
  data: jsonValueSchema,
})

const systemMessageSchema = z.strictObject({
  role: z.literal('system'),
  content: z.string(),
})

const userMessageSchema = z.strictObject({
  role: z.literal('user'),
  content: z.string(),
  attachments: z.array(messageAttachmentSchema).min(1).exactOptional(),
})

const assistantMessageSchema = z.strictObject({
  role: z.literal('assistant'),
  content: z.string(),
  toolCalls: z.array(toolCallSchema).exactOptional(),
  interrupted: z.literal(true).exactOptional(),
  providerState: providerStateSchema.exactOptional(),
})

const toolMessageSchema = z.strictObject({
  role: z.literal('tool'),
  content: z.string(),
  toolCallId: nonEmptyString,
  name: nonEmptyString,
  isError: z.boolean(),
})

export const messageSchema = z.discriminatedUnion('role', [
  systemMessageSchema,
  userMessageSchema,
  assistantMessageSchema,
  toolMessageSchema,
])

export type Message = z.infer<typeof messageSchema>

/** Validate before JSON encoding so unsupported values cannot silently disappear. */
export function decodeMessage(value: unknown): Message {
  if (!isJsonValue(value)) throw new Error('INVALID_MESSAGE')
  const parsed = messageSchema.safeParse(value)
  if (!parsed.success) throw new Error('INVALID_MESSAGE')
  return parsed.data
}
