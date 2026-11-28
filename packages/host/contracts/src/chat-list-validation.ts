import { z } from 'zod'
import type { WebSession, WorkspaceList } from './management.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const selectionSchema = z.object({ provider: z.string(), model: z.string() })

const chatSchema = z.object({
  sessionId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messageCount: z.number(),
  selectable: z.boolean(),
  workspaceId: z.string().nullable(),
  readable: z.boolean(),
  activeRequestId: z.string().optional(),
  title: z.string().optional(),
  hasSlides: z.boolean().optional(),
  hasDraft: z.boolean().optional(),
  selection: selectionSchema.optional(),
  removedSelection: selectionSchema.optional().catch(undefined),
})

const workspaceListSchema = z.object({
  selectedId: z.string(),
  version: nonNegativeInt,
  workspaces: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      folder: z.string().nullable(),
      isDefault: z.boolean(),
      folderStatus: z.enum(['none', 'available', 'unreadable', 'different-folder']),
    }),
  ),
})

function decode<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error('INVALID_RESPONSE')
  return result.data
}

function toChat(chat: z.infer<typeof chatSchema>): WebSession {
  return {
    sessionId: chat.sessionId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messageCount,
    selectable: chat.selectable,
    workspaceId: chat.workspaceId,
    readable: chat.readable,
    ...(chat.title === undefined ? {} : { title: chat.title }),
    ...(chat.hasSlides === undefined ? {} : { hasSlides: chat.hasSlides }),
    ...(chat.hasDraft === true ? { hasDraft: true } : {}),
    ...(chat.selection ? { selection: chat.selection } : {}),
    ...(chat.removedSelection ? { removedSelection: chat.removedSelection } : {}),
    ...(chat.activeRequestId === undefined ? {} : { activeRequestId: chat.activeRequestId }),
  }
}

/** Decodes one chat of `GET /api/sessions` or `POST /api/sessions`. */
export function decodeChat(value: unknown): WebSession {
  return toChat(decode(chatSchema, value))
}

/** Decodes the chat list of `GET /api/sessions` and `POST /api/sessions/search`. */
export function decodeChatList(value: unknown): readonly WebSession[] {
  return decode(z.array(chatSchema), value).map(toChat)
}

/** Decodes the workspace list that each workspace read and write returns. */
export function decodeWorkspaceList(value: unknown): WorkspaceList {
  return decode(workspaceListSchema, value)
}
