import { z } from 'zod'
import type { AgentRequest, ApprovalView, AttachmentView, DeckRequest, RequestEvent } from './requests.ts'
import {
  attachmentId,
  entityId,
  errorCode,
  invalidResponse,
  nonNegativeInt,
  positiveInt,
} from './validation-primitives.ts'

export type RequestValidationCode =
  | 'INVALID_REQUEST'
  | 'INVALID_SESSION'
  | 'INVALID_SELECTION'
  | 'REQUEST_EMPTY'
  | 'REQUEST_TEXT_TOO_LONG'

export class RequestValidationError extends Error {
  public readonly code: RequestValidationCode

  constructor(code: RequestValidationCode, message: string) {
    super(message)
    this.name = 'RequestValidationError'
    this.code = code
  }
}

const requestTextLimit = 16000

const approvalViewSchema = z.object({
  approvalId: entityId,
  requestId: entityId,
  operation: z.literal('read-file'),
  target: z.string().min(1).max(4096),
  reason: z.string().min(1).max(500),
  state: z.enum(['pending', 'allowed', 'refused', 'cancelled']),
})

const attachmentSchema = z.object({
  attachmentId,
  name: z.string().refine(s => !!s.trim()),
  state: z.enum(['preparing', 'ready', 'rejected']),
  byteSize: nonNegativeInt,
  detectedType: z.string().optional(),
  rejectionCode: errorCode.optional(),
  preparation: z
    .object({
      parserVersion: z.string(),
      capabilities: z.array(z.string()),
      completeness: z.enum(['complete', 'partial']),
      omitted: z.array(z.object({ code: errorCode, entry: z.string().optional() })),
    })
    .optional(),
  source: z
    .object({
      sourceId: z.string().min(1),
      version: positiveInt,
      kind: z.literal('attachment'),
      label: z.string(),
    })
    .optional(),
})

const requestEventBase = {
  requestId: entityId,
  sequence: positiveInt,
  timestamp: z.string(),
}

const requestEventSchema = z.discriminatedUnion('kind', [
  z.object({
    ...requestEventBase,
    kind: z.literal('status'),
    status: z.enum(['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted']),
    errorCode: errorCode.optional(),
  }),
  z.object({
    ...requestEventBase,
    kind: z.literal('activity'),
    id: z.string(),
    label: z.string(),
    type: z.enum(['model', 'tool']),
    status: z.enum(['running', 'completed', 'failed', 'stopped']),
  }),
  z.object({
    ...requestEventBase,
    kind: z.literal('text'),
    part: z.string(),
    text: z.string(),
  }),
  z.object({
    ...requestEventBase,
    kind: z.literal('notice'),
    code: errorCode,
  }),
  z.object({
    ...requestEventBase,
    kind: z.literal('approval'),
    approval: approvalViewSchema,
  }),
])

const deckRequestSchema = z.strictObject({
  action: z.enum(['collect', 'skip', 'revise', 'question', 'clarify', 'restore']),
  expectedBriefVersion: nonNegativeInt,
  expectedOutline: z.strictObject({ outlineId: entityId, version: positiveInt }).nullable(),
  restoreOutlineId: entityId.optional(),
  formatChoice: z.literal('html').optional(),
  imageChoice: z.enum(['none', 'attachments', 'public-research']).optional(),
  imageProviderChoice: z.enum(['tavily', 'commons']).optional(),
  sourceChoice: z
    .strictObject({
      material: z.boolean(),
      modelKnowledge: z.boolean(),
      publicResearch: z.boolean(),
    })
    .optional(),
})

const agentRequestSchema = z.strictObject({
  sessionId: entityId,
  input: z.string(),
  attachmentIds: z.array(attachmentId).optional(),
  draftRevision: nonNegativeInt.optional(),
  publicResearch: z.boolean().optional(),
  deck: deckRequestSchema.optional(),
  continueDeck: z.literal(true).optional(),
})

const approvalDecisionBodySchema = z.strictObject({
  decision: z.enum(['allow-once', 'refuse']),
})

function buildApprovalView(data: z.infer<typeof approvalViewSchema>): ApprovalView {
  return {
    approvalId: data.approvalId,
    requestId: data.requestId,
    operation: data.operation,
    target: data.target,
    reason: data.reason,
    state: data.state,
  }
}

export function decodeAttachment(value: unknown): AttachmentView {
  const parsed = attachmentSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  const data = parsed.data
  return {
    attachmentId: data.attachmentId,
    name: data.name,
    state: data.state,
    byteSize: data.byteSize,
    ...(data.detectedType !== undefined ? { detectedType: data.detectedType } : {}),
    ...(data.rejectionCode !== undefined ? { rejectionCode: data.rejectionCode } : {}),
    ...(data.source !== undefined ? { source: data.source } : {}),
    ...(data.preparation !== undefined
      ? {
          preparation: {
            parserVersion: data.preparation.parserVersion,
            capabilities: data.preparation.capabilities,
            completeness: data.preparation.completeness,
            omitted: data.preparation.omitted.map(item => ({
              code: item.code,
              ...(item.entry !== undefined ? { entry: item.entry } : {}),
            })),
          },
        }
      : {}),
  }
}

/** Only the documented event shapes; anything else is a broken stream, never rendered. */
export function requestEvent(value: unknown): RequestEvent {
  const parsed = requestEventSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  const data = parsed.data
  const base = { requestId: data.requestId, sequence: data.sequence, timestamp: data.timestamp }
  if (data.kind === 'status') {
    return {
      ...base,
      kind: 'status',
      status: data.status,
      ...(data.errorCode !== undefined ? { errorCode: data.errorCode } : {}),
    }
  }
  if (data.kind === 'approval') {
    if (data.approval.requestId !== data.requestId) return invalidResponse()
    return { ...base, kind: 'approval', approval: buildApprovalView(data.approval) }
  }
  return data
}

function decodeDeckRequest(deck: z.infer<typeof deckRequestSchema>): DeckRequest {
  if (deck.restoreOutlineId !== undefined && deck.action !== 'restore') {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  if (deck.imageProviderChoice !== undefined && deck.imageChoice !== 'public-research') {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  return {
    action: deck.action,
    expectedBriefVersion: deck.expectedBriefVersion,
    expectedOutline: deck.expectedOutline,
    ...(deck.formatChoice !== undefined ? { formatChoice: deck.formatChoice } : {}),
    ...(deck.imageChoice !== undefined ? { imageChoice: deck.imageChoice } : {}),
    ...(deck.imageProviderChoice !== undefined ? { imageProviderChoice: deck.imageProviderChoice } : {}),
    ...(deck.restoreOutlineId !== undefined ? { restoreOutlineId: deck.restoreOutlineId } : {}),
    ...(deck.sourceChoice !== undefined ? { sourceChoice: deck.sourceChoice } : {}),
  }
}

export function decodeAgentRequest(value: unknown, maxAttachments: number): AgentRequest {
  const parsed = agentRequestSchema.safeParse(value)
  if (!parsed.success) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  const data = parsed.data
  if (
    data.continueDeck === true &&
    (data.deck !== undefined || (data.attachmentIds !== undefined && data.attachmentIds.length > 0))
  ) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  const deck = data.deck !== undefined ? decodeDeckRequest(data.deck) : undefined
  const ids = data.attachmentIds
  if (ids !== undefined && (ids.length > maxAttachments || new Set(ids).size !== ids.length)) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  if (!data.input.trim() && !(ids !== undefined && ids.length > 0)) {
    throw new RequestValidationError('REQUEST_EMPTY', 'Request input is empty')
  }
  if ([...data.input].length > requestTextLimit) {
    throw new RequestValidationError('REQUEST_TEXT_TOO_LONG', 'Request input exceeds the character limit')
  }
  if (!data.input.isWellFormed()) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  return {
    ...(data.continueDeck === true ? { continueDeck: true } : {}),
    ...(deck !== undefined ? { deck } : {}),
    sessionId: data.sessionId,
    input: data.input,
    ...(data.publicResearch !== undefined ? { publicResearch: data.publicResearch } : {}),
    ...(ids !== undefined ? { attachmentIds: ids } : {}),
    ...(data.draftRevision !== undefined ? { draftRevision: data.draftRevision } : {}),
  }
}

export function decodeApprovalDecisionBody(value: unknown): { readonly decision: 'allow-once' | 'refuse' } {
  const parsed = approvalDecisionBodySchema.safeParse(value)
  if (!parsed.success) {
    throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
  }
  return parsed.data
}
