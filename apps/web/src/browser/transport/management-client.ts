import { decodeAttachment } from '@deckagent/host-contracts'
import type {
  AttachmentView,
  ChatDraft,
  StoredActivity,
  StoredRequest,
  WebPreferences,
  WebSession,
  WebSettings,
  WorkspaceList,
} from '@deckagent/host-contracts'
import { fetchAuthorized, isRecord, readJsonError } from './http.ts'
import {
  decodeActivities,
  decodeCatalog,
  decodeDraft,
  decodePreviewText,
  decodeRequests,
  decodeResearchSources,
  decodeSession,
  decodeSettings,
  decodeTheme,
  decodeWorkspaceList,
} from './management-decoders.ts'

function invalid(): never {
  throw new Error('INVALID_RESPONSE')
}

/** A refused management request: `message` is the stable error code; `detail` holds only safe facts. */
export class ManagementError extends Error {
  constructor(
    code: string,
    readonly detail: Readonly<Record<string, string | boolean>> = {},
  ) {
    super(code)
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
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(path: string, method = 'GET', value?: unknown): Promise<unknown> {
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

  async settings(): Promise<WebSettings> {
    return decodeSettings(await this.request('settings'))
  }
  /** Saves the interface theme on the Host, so it survives a change of local port. */
  async saveResearch(value: { readonly key: string } | { readonly useEnvironment: true }): Promise<void> {
    await this.request('research', 'PUT', value)
  }
  async removeResearch(): Promise<void> {
    await this.request('research', 'DELETE')
  }
  async researchSources(
    id: string,
  ): Promise<readonly { title: string; url: string; content: string; sourceId: string; retrievedAt: string }[]> {
    return decodeResearchSources(await this.request(`sessions/${encodeURIComponent(id)}/research-sources`))
  }
  async saveTheme(theme: WebPreferences['theme']): Promise<WebPreferences['theme']> {
    return decodeTheme(await this.request('preferences', 'PUT', { theme }))
  }

  async sessions(): Promise<readonly WebSession[]> {
    const data = await this.request('sessions')
    if (!Array.isArray(data)) invalid()
    return data.map(decodeSession)
  }
  async create(selection?: { provider: string; model: string }): Promise<WebSession> {
    return decodeSession(await this.request('sessions', 'POST', selection ? { selection } : {}))
  }
  async select(id: string, value: { provider: string; model: string }): Promise<WebSession> {
    return decodeSession(await this.request(`sessions/${encodeURIComponent(id)}/selection`, 'PUT', value))
  }
  /** Earlier chats whose name or conversation holds every word. */
  async search(words: string): Promise<readonly WebSession[]> {
    const data = await this.request('sessions/search', 'POST', { words })
    if (!Array.isArray(data)) invalid()
    return data.map(decodeSession)
  }
  async draftState(id: string): Promise<ChatDraft> {
    return decodeDraft(await this.request(`sessions/${encodeURIComponent(id)}/draft`), id)
  }
  async saveDraftState(id: string, text: string, expectedRevision: number): Promise<ChatDraft> {
    return decodeDraft(
      await this.request(`sessions/${encodeURIComponent(id)}/draft`, 'PUT', { text, expectedRevision }),
      id,
    )
  }

  private async attachmentRequest(path: string, init: RequestInit = {}): Promise<Response> {
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
  async uploadAttachment(
    id: string,
    file: File,
    expectedRevision: number,
  ): Promise<{ readonly attachment: AttachmentView; readonly draft: ChatDraft }> {
    const body = new FormData()
    body.append('expectedRevision', String(expectedRevision))
    body.append('file', file)
    const response = await this.attachmentRequest(`sessions/${encodeURIComponent(id)}/attachments`, {
      method: 'POST',
      body,
    })
    const value: unknown = await response.json()
    if (!isRecord(value)) invalid()
    return { attachment: decodeAttachment(value.attachment), draft: decodeDraft(value.draft, id) }
  }
  async removeAttachment(id: string, attachmentId: string, expectedRevision: number): Promise<ChatDraft> {
    const path = `sessions/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`
    const response = await this.attachmentRequest(path, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expectedRevision }),
    })
    return decodeDraft(await response.json(), id)
  }
  async previewAttachment(id: string, attachmentId: string): Promise<Blob | string> {
    const response = await this.attachmentRequest(
      `sessions/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/preview`,
    )
    if (response.headers.get('content-type') === 'image/png') return response.blob()
    return decodePreviewText(await response.json())
  }

  async workspaces(): Promise<WorkspaceList> {
    return decodeWorkspaceList(await this.request('workspaces'))
  }
  async addWorkspace(folder: string, expectedVersion: number): Promise<WorkspaceList> {
    return decodeWorkspaceList(await this.request('workspaces', 'POST', { folder, expectedVersion }))
  }
  async selectWorkspace(id: string, expectedVersion: number): Promise<WorkspaceList> {
    return decodeWorkspaceList(await this.request('workspaces/selected', 'PUT', { id, expectedVersion }))
  }
  async renameWorkspace(id: string, name: string, expectedVersion: number): Promise<WorkspaceList> {
    return decodeWorkspaceList(
      await this.request(`workspaces/${encodeURIComponent(id)}`, 'PUT', { name, expectedVersion }),
    )
  }
  async relinkWorkspace(id: string, folder: string, expectedVersion: number): Promise<WorkspaceList> {
    return decodeWorkspaceList(
      await this.request(`workspaces/${encodeURIComponent(id)}/folder`, 'PUT', { folder, expectedVersion }),
    )
  }
  async removeWorkspace(id: string, expectedVersion: number): Promise<WorkspaceList> {
    return decodeWorkspaceList(
      await this.request(`workspaces/${encodeURIComponent(id)}`, 'DELETE', { expectedVersion }),
    )
  }

  async save(
    id: string,
    value: {
      displayName: string
      protocol: string
      baseUrl: string
      models: readonly string[]
      key?: string
      new?: boolean
    },
    expectedVersion: number,
  ): Promise<void> {
    if (!/^[\w.-]{1,100}$/.test(id)) throw new ManagementError('INVALID_PROVIDER', { field: 'providerId' })
    await this.request(`providers/${encodeURIComponent(id)}`, 'PUT', { ...value, expectedVersion })
  }
  async remove(id: string, expectedVersion: number): Promise<void> {
    await this.request(`providers/${encodeURIComponent(id)}`, 'DELETE', { expectedVersion })
  }
  async catalog(id: string): Promise<readonly string[]> {
    return decodeCatalog(await this.request(`providers/${encodeURIComponent(id)}/catalog`))
  }
  async activities(id: string): Promise<readonly StoredActivity[]> {
    return decodeActivities(await this.request(`sessions/${encodeURIComponent(id)}/activities`))
  }
  async requests(id: string): Promise<readonly StoredRequest[]> {
    return decodeRequests(await this.request(`sessions/${encodeURIComponent(id)}/requests`))
  }
}
