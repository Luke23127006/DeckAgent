import { z } from 'zod'
import { isDesignSnapshot } from './brief-validation.ts'
import type { DesignSnapshot } from './brief.ts'
import type { ConfirmationReceipt, GenerationSnapshot } from './deck.ts'
import { entityId, invalidGenerationResponse, isoTimestamp, positiveInt, sha256Hex } from './validation-primitives.ts'

const receiptSchema = z.object({
  sessionId: z.string(),
  deckId: z.string(),
  confirmationId: entityId,
  outlineId: entityId,
  briefId: entityId,
  intentId: entityId,
  requestId: entityId,
  outlineVersion: positiveInt,
  briefVersion: positiveInt,
  fingerprint: sha256Hex,
  createdAt: isoTimestamp,
})

const generationSchema = z.object({
  format: z.literal('html'),
  design: z.custom<DesignSnapshot>(isDesignSnapshot),
  selection: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
  }),
  formatLocked: z.boolean(),
  activeRequestId: entityId.optional(),
  startedAt: isoTimestamp.nullable(),
  state: z.enum(['pending', 'admitted', 'generating', 'generated', 'incomplete']),
  receipt: receiptSchema,
})

function buildReceipt(data: z.infer<typeof receiptSchema>, sessionId: string): ConfirmationReceipt {
  if (data.sessionId !== sessionId || data.deckId !== sessionId) return invalidGenerationResponse()
  return {
    sessionId,
    deckId: sessionId,
    confirmationId: data.confirmationId,
    outlineId: data.outlineId,
    briefId: data.briefId,
    intentId: data.intentId,
    requestId: data.requestId,
    outlineVersion: data.outlineVersion,
    briefVersion: data.briefVersion,
    fingerprint: data.fingerprint,
    createdAt: data.createdAt,
  }
}

export function decodeGeneration(value: unknown, sessionId: string): GenerationSnapshot {
  const parsed = generationSchema.safeParse(value)
  if (!parsed.success) return invalidGenerationResponse()

  const data = parsed.data
  const receipt = buildReceipt(data.receipt, sessionId)
  if (
    receipt.fingerprint !== data.design.fingerprint ||
    data.formatLocked !== (data.startedAt !== null) ||
    (['pending', 'admitted'].includes(data.state) && data.startedAt !== null && !data.activeRequestId) ||
    (['generating', 'generated'].includes(data.state) && data.startedAt === null)
  ) {
    return invalidGenerationResponse()
  }

  return {
    receipt,
    ...(data.activeRequestId !== undefined ? { activeRequestId: data.activeRequestId } : {}),
    state: data.state,
    format: 'html',
    design: data.design,
    formatLocked: data.formatLocked,
    startedAt: data.startedAt,
    selection: data.selection,
  }
}
