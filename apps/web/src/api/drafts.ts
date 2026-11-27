import { decodeAttachmentUpload, decodeChatDraft, decodePreviewText } from '@deckagent/host-contracts'
import { ApiClientError, apiFetch, apiJson, readApiError } from './client.ts'

function draftPath(sessionId: string, part: string): string {
  return `/api/sessions/${encodeURIComponent(sessionId)}/${part}`
}

/** Reads the draft that the Host keeps for one chat (FR-038). */
export function readDraft(sessionId: string) {
  return apiJson(draftPath(sessionId, 'draft'), value => decodeChatDraft(value, sessionId))
}

/** Saves the draft text. A changed revision gets `DRAFT_CONFLICT`. */
export function saveDraft(sessionId: string, text: string, expectedRevision: number) {
  return apiJson(draftPath(sessionId, 'draft'), value => decodeChatDraft(value, sessionId), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, expectedRevision }),
  })
}

/** Adds one file to the draft. */
export function uploadAttachment(sessionId: string, file: File, expectedRevision: number) {
  const body = new FormData()
  body.append('expectedRevision', String(expectedRevision))
  body.append('file', file)
  return apiJson(draftPath(sessionId, 'attachments'), value => decodeAttachmentUpload(value, sessionId), {
    method: 'POST',
    body,
  })
}

/** Removes one file from the draft. */
export function removeAttachment(sessionId: string, attachmentId: string, expectedRevision: number) {
  return apiJson(
    draftPath(sessionId, `attachments/${encodeURIComponent(attachmentId)}`),
    value => decodeChatDraft(value, sessionId),
    {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expectedRevision }),
    },
  )
}

/** Reads the limited preview of one file: a PNG image or a text. */
export async function previewAttachment(sessionId: string, attachmentId: string): Promise<Blob | string> {
  const response = await apiFetch(draftPath(sessionId, `attachments/${encodeURIComponent(attachmentId)}/preview`))
  if (!response.ok) throw await readApiError(response)
  if (response.headers.get('content-type') === 'image/png') return response.blob()
  try {
    return decodePreviewText(await response.json())
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', response.status)
  }
}
