import { z } from 'zod'
import type { ChatDraft } from './management.ts'
import type { AttachmentView, HistoryMessage, RequestSnapshot, StoredActivity, StoredRequest } from './requests.ts'
import { decodeApprovalView, decodeAttachment } from './request-validation.ts'
import { entityId, errorCode, nonNegativeInt } from './validation-primitives.ts'

const requestStatus = z.enum(['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted'])
const selectionSchema = z.object({ provider: z.string(), model: z.string() })

const snapshotSchema = z.object({
  requestId: entityId,
  sessionId: entityId,
  status: requestStatus,
  text: z.string(),
  sequence: nonNegativeInt,
  errorCode: errorCode.optional(),
  pendingApproval: z.unknown().optional(),
})

const historySchema = z.array(
  z.object({
    role: z.enum(['user', 'assistant', 'tool']),
    content: z.string(),
    interrupted: z.literal(true).optional(),
    toolCallId: z.string().min(1).max(2000).optional(),
    name: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,64}$/)
      .optional(),
    isError: z.boolean().optional(),
    attachments: z.array(z.unknown()).optional(),
  }),
)

const requestsSchema = z.array(
  z.object({
    requestId: z.string(),
    sessionId: z.string(),
    status: requestStatus,
    selection: selectionSchema,
    historyStart: z.number().int().refine(Number.isSafeInteger),
    startedAt: z.string(),
    endedAt: z.string().optional(),
    lastSequence: z.number(),
    errorCode: errorCode.optional(),
    summarized: z.literal(true).optional(),
    publicResearch: z.boolean().optional(),
  }),
)

const activitiesSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    requestId: z.string(),
    sequence: z.number(),
    type: z.enum(['model', 'tool']),
    status: z.enum(['running', 'completed', 'failed', 'stopped']),
  }),
)

const draftSchema = z.object({
  sessionId: z.string(),
  text: z.string(),
  revision: nonNegativeInt.optional(),
  attachmentIds: z.array(z.string()).optional(),
  attachments: z.array(z.unknown()).optional(),
})

const researchSourcesSchema = z.array(
  z.object({
    title: z.string(),
    url: z.string().regex(/^https?:\/\//),
    content: z.string(),
    sourceId: z.string(),
    retrievedAt: z.string(),
  }),
)

/** One saved research excerpt of a chat. */
export interface ResearchSource {
  readonly title: string
  readonly url: string
  readonly content: string
  readonly sourceId: string
  readonly retrievedAt: string
}

function decode<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('INVALID_RESPONSE')
  return result.data
}

/** Decodes the request snapshot of `POST /api/requests`, `GET /api/requests/:id` and the stop reply. */
export function decodeRequestSnapshot(value: unknown): RequestSnapshot {
  const data = decode(snapshotSchema, value)
  const pending =
    data.pendingApproval === null || data.pendingApproval === undefined
      ? data.pendingApproval
      : decodeApprovalView(data.pendingApproval)
  if (pending && (pending.requestId !== data.requestId || pending.state !== 'pending'))
    throw new Error('INVALID_RESPONSE')
  return {
    requestId: data.requestId,
    sessionId: data.sessionId,
    status: data.status,
    text: data.text,
    sequence: data.sequence,
    ...(data.errorCode === undefined ? {} : { errorCode: data.errorCode }),
    ...(pending === undefined ? {} : { pendingApproval: pending }),
  }
}

/** Decodes the public history of `GET /api/sessions/:sessionId/history`. */
export function decodeHistory(value: unknown): readonly HistoryMessage[] {
  return decode(historySchema, value).map(message => {
    if (message.interrupted && message.role !== 'assistant') throw new Error('INVALID_RESPONSE')
    if (
      message.role !== 'tool' &&
      (message.toolCallId !== undefined || message.name !== undefined || message.isError !== undefined)
    )
      throw new Error('INVALID_RESPONSE')
    if (message.attachments !== undefined && message.role !== 'user') throw new Error('INVALID_RESPONSE')
    return {
      role: message.role,
      content: message.content,
      ...(message.attachments ? { attachments: message.attachments.map(decodeAttachment) } : {}),
      ...(message.interrupted ? { interrupted: true as const } : {}),
      ...(message.toolCallId === undefined ? {} : { toolCallId: message.toolCallId }),
      ...(message.name === undefined ? {} : { name: message.name }),
      ...(message.isError === undefined ? {} : { isError: message.isError }),
    }
  })
}

/** Decodes the saved requests of `GET /api/sessions/:sessionId/requests`. */
export function decodeStoredRequests(value: unknown): readonly StoredRequest[] {
  return decode(requestsSchema, value).map(item => ({
    requestId: item.requestId,
    sessionId: item.sessionId,
    status: item.status,
    selection: item.selection,
    historyStart: item.historyStart,
    startedAt: item.startedAt,
    lastSequence: item.lastSequence,
    ...(item.publicResearch === undefined ? {} : { publicResearch: item.publicResearch }),
    ...(item.endedAt === undefined ? {} : { endedAt: item.endedAt }),
    ...(item.errorCode === undefined ? {} : { errorCode: item.errorCode }),
    ...(item.summarized ? { summarized: true as const } : {}),
  }))
}

/** Decodes the saved activities of `GET /api/sessions/:sessionId/activities`. */
export function decodeStoredActivities(value: unknown): readonly StoredActivity[] {
  return decode(activitiesSchema, value)
}

/** Decodes the draft of chat `sessionId`. The attachment ids and the attachments must name the same files in order. */
export function decodeChatDraft(value: unknown, sessionId: string): ChatDraft {
  const data = decode(draftSchema, value)
  if (data.sessionId !== sessionId) throw new Error('INVALID_RESPONSE')
  if (data.revision === undefined && data.attachmentIds === undefined && data.attachments === undefined)
    return { sessionId, text: data.text }
  if (data.revision === undefined || !data.attachmentIds || !data.attachments) throw new Error('INVALID_RESPONSE')
  const attachments = data.attachments.map(decodeAttachment)
  const ids = data.attachmentIds
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== attachments.length ||
    ids.some((id, index) => id !== attachments[index]?.attachmentId)
  )
    throw new Error('INVALID_RESPONSE')
  return { sessionId, text: data.text, revision: data.revision, attachmentIds: ids, attachments }
}

/** Decodes the reply of an attachment upload: the new attachment and the draft that holds it. */
export function decodeAttachmentUpload(
  value: unknown,
  sessionId: string,
): { readonly attachment: AttachmentView; readonly draft: ChatDraft } {
  const data = decode(z.object({ attachment: z.unknown(), draft: z.unknown() }), value)
  return { attachment: decodeAttachment(data.attachment), draft: decodeChatDraft(data.draft, sessionId) }
}

/** Decodes the text preview of an attachment. */
export function decodePreviewText(value: unknown): string {
  return decode(z.object({ text: z.string() }), value).text
}

/** Decodes the saved research excerpts of `GET /api/sessions/:sessionId/research-sources`. */
export function decodeResearchSources(value: unknown): readonly ResearchSource[] {
  return decode(researchSourcesSchema, value)
}
