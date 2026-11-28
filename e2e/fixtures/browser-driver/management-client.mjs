import { decodeAttachment } from '@deckagent/host-contracts'
import { fetchAuthorized, isRecord, readJsonError } from './http.mjs'
import {
  decodeActivities,
  decodeCatalog,
  decodeDraft,
  decodePreviewText,
  decodeRequests,
  decodeResearchSources,
  decodeSession,
  decodeSettings,
  decodePreferences,
  decodeWorkspaceList,
} from './management-decoders.mjs'
function invalid() {
  throw new Error('INVALID_RESPONSE')
}
/** A refused management request: `message` is the stable error code; `detail` holds only safe facts. */
export class ManagementError extends Error {
  detail
  constructor(code, detail = {}) {
    super(code)
    this.detail = detail
    this.name = 'ManagementError'
  }
}
const allowedCodes = [
  'RESEARCH_UNAVAILABLE',
  'RESEARCH_KEY_UNAVAILABLE',
  'RESEARCH_KEY_REJECTED',
  'RESEARCH_FREE_ONLY',
  'RESEARCH_QUOTA_EXHAUSTED',
  'RESEARCH_NOT_SAVED',
  'DRAFT_CONFLICT',
  'ATTACHMENT_NOT_FOUND',
  'ATTACHMENT_CONFLICT',
  'ATTACHMENT_NOT_READY',
  'ATTACHMENT_REJECTED',
  'ATTACHMENT_TOO_LARGE',
  'ATTACHMENT_COUNT_EXCEEDED',
  'ATTACHMENT_TYPE_UNSUPPORTED',
  'ATTACHMENT_UNREADABLE',
  'ATTACHMENT_NOT_SAVED',
  'PARSING_LIMIT_EXCEEDED',
  'UPLOAD_CANCELLED',
  'HOST_BUSY',
  'INVALID_PROVIDER',
  'PROVIDER_ID_TAKEN',
  'PROVIDER_KEY_REQUIRED',
  'PROVIDER_KEY_REFUSED',
  'PROVIDER_NO_ANSWER',
  'PROVIDER_CHECK_FAILED',
  'PROVIDER_NOT_FOUND',
  'CREDENTIAL_STORE_UNAVAILABLE',
  'CREDENTIAL_NOT_SAVED',
  'CATALOG_UNAVAILABLE',
  'WORKSPACE_REQUEST_ACTIVE',
  'MODEL_NOT_SELECTABLE',
  'PROVIDER_NAME_EXISTS',
  'PROVIDERS_STALE',
  'PREFERENCES_STALE',
  'PROTOCOL_IMMUTABLE',
  'NEW_ENDPOINT_REQUIRES_KEY',
  'PROVIDER_BUSY',
  'AUTH_REQUIRED',
  'SESSION_NOT_FOUND',
  'CHAT_UNREADABLE',
  'DRAFT_TOO_LARGE',
  'WORKSPACE_NOT_FOUND',
  'WORKSPACE_DEFAULT',
  'WORKSPACE_FOLDER_REQUIRED',
  'WORKSPACE_FOLDER_INVALID',
  'WORKSPACE_FOLDER_UNREADABLE',
  'WORKSPACE_FOLDER_REFUSED',
  'WORKSPACE_FOLDER_IN_USE',
  'WORKSPACE_NAME_EMPTY',
  'WORKSPACE_NAME_TOO_LONG',
  'WORKSPACES_STALE',
]
/** Validates management responses separately from request streaming. */
export class ManagementClient {
  origin
  token
  constructor(origin, token) {
    this.origin = origin
    this.token = token
  }
  async request(path, method = 'GET', value) {
    const response = await fetchAuthorized(this.origin, this.token, `/api/${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    if (!response.ok) {
      const { code, detail } = await readJsonError(response, allowedCodes, 'SETTINGS_REQUEST_FAILED', {
        includeDetail: true,
        fallback401: false,
      })
      throw new ManagementError(code, detail)
    }
    return response.json()
  }
  async settings() {
    return decodeSettings(await this.request('settings'))
  }
  async saveResearch(value, expectedVersion) {
    await this.request('research', 'PUT', { ...value, expectedVersion })
  }
  async removeResearch(expectedVersion) {
    await this.request('research', 'DELETE', { expectedVersion })
  }
  async researchSources(id) {
    return decodeResearchSources(await this.request(`sessions/${encodeURIComponent(id)}/research-sources`))
  }
  async preferences() {
    return decodePreferences(await this.request('preferences'))
  }
  async saveTheme(theme, expectedVersion) {
    return decodePreferences(await this.request('preferences', 'PUT', { theme, expectedVersion }))
  }
  async sessions() {
    const data = await this.request('sessions')
    if (!Array.isArray(data)) invalid()
    return data.map(decodeSession)
  }
  async create(selection) {
    return decodeSession(await this.request('sessions', 'POST', selection ? { selection } : {}))
  }
  async select(id, value) {
    return decodeSession(await this.request(`sessions/${encodeURIComponent(id)}/selection`, 'PUT', value))
  }
  async draftState(id) {
    return decodeDraft(await this.request(`sessions/${encodeURIComponent(id)}/draft`), id)
  }
  async saveDraftState(id, text, expectedRevision) {
    return decodeDraft(
      await this.request(`sessions/${encodeURIComponent(id)}/draft`, 'PUT', { text, expectedRevision }),
      id,
    )
  }
  async attachmentRequest(path, init = {}) {
    const response = await fetchAuthorized(this.origin, this.token, `/api/${path}`, init)
    if (!response.ok) {
      const { code } = await readJsonError(response, allowedCodes, 'SETTINGS_REQUEST_FAILED', {
        includeDetail: false,
        fallback401: false,
      })
      throw new ManagementError(code)
    }
    return response
  }
  async uploadAttachment(id, file, expectedRevision) {
    const body = new FormData()
    body.append('expectedRevision', String(expectedRevision))
    body.append('file', file)
    const response = await this.attachmentRequest(`sessions/${encodeURIComponent(id)}/attachments`, {
      method: 'POST',
      body,
    })
    const value = await response.json()
    if (!isRecord(value)) invalid()
    return { attachment: decodeAttachment(value.attachment), draft: decodeDraft(value.draft, id) }
  }
  async removeAttachment(id, attachmentId, expectedRevision) {
    const path = `sessions/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`
    const response = await this.attachmentRequest(path, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expectedRevision }),
    })
    return decodeDraft(await response.json(), id)
  }
  async previewAttachment(id, attachmentId) {
    const response = await this.attachmentRequest(
      `sessions/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/preview`,
    )
    if (response.headers.get('content-type') === 'image/png') return response.blob()
    return decodePreviewText(await response.json())
  }
  async workspaces() {
    return decodeWorkspaceList(await this.request('workspaces'))
  }
  async save(id, value, expectedVersion) {
    if (!/^[\w.-]{1,100}$/.test(id)) throw new ManagementError('INVALID_PROVIDER', { field: 'providerId' })
    await this.request(`providers/${encodeURIComponent(id)}`, 'PUT', { ...value, expectedVersion })
  }
  async remove(id, expectedVersion) {
    await this.request(`providers/${encodeURIComponent(id)}`, 'DELETE', { expectedVersion })
  }
  async catalog(id) {
    return decodeCatalog(await this.request(`providers/${encodeURIComponent(id)}/catalog`))
  }
  async activities(id) {
    return decodeActivities(await this.request(`sessions/${encodeURIComponent(id)}/activities`))
  }
  async requests(id) {
    return decodeRequests(await this.request(`sessions/${encodeURIComponent(id)}/requests`))
  }
}
