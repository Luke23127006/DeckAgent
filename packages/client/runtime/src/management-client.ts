import type {
  ProviderSettings,
  ProviderTemplate,
  StoredActivity,
  StoredRequest,
  WebPreferences,
  WebSession,
  WebSettings,
  WorkspaceList,
  WorkspaceView,
} from '@deckagent/host-api'
import type { ProviderProtocol, RequestStatus } from '@deckagent/host-api'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function invalid(): never {
  throw new Error('INVALID_RESPONSE')
}

const protocols: readonly ProviderProtocol[] = ['chat-completions', 'responses', 'anthropic-messages', 'gemini']
const requestStatuses: readonly RequestStatus[] = ['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted']
function protocol(value: unknown): ProviderProtocol {
  return protocols.find(item => item === value) ?? invalid()
}
function selection(value: unknown): { provider: string; model: string } | undefined {
  if (value === undefined) return undefined
  if (!object(value) || typeof value.provider !== 'string' || typeof value.model !== 'string') invalid()
  return { provider: value.provider, model: value.model }
}

function provider(value: unknown): ProviderSettings {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    typeof value.displayName !== 'string' ||
    typeof value.baseUrl !== 'string' ||
    typeof value.hasKey !== 'boolean' ||
    typeof value.keyAvailable !== 'boolean' ||
    typeof value.builtIn !== 'boolean' ||
    !Array.isArray(value.models)
  )
    invalid()
  return {
    id: value.id,
    displayName: value.displayName,
    baseUrl: value.baseUrl,
    hasKey: value.hasKey,
    keyAvailable: value.keyAvailable,
    builtIn: value.builtIn,
    protocol: protocol(value.protocol),
    models: value.models.map(item => (typeof item === 'string' ? item : invalid())),
  }
}

function session(value: unknown): WebSession {
  if (
    !object(value) ||
    typeof value.sessionId !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.messageCount !== 'number' ||
    typeof value.selectable !== 'boolean' ||
    (value.activeRequestId !== undefined && typeof value.activeRequestId !== 'string') ||
    (value.title !== undefined && typeof value.title !== 'string') ||
    (value.hasSlides !== undefined && typeof value.hasSlides !== 'boolean') ||
    (value.workspaceId !== null && typeof value.workspaceId !== 'string') ||
    typeof value.readable !== 'boolean'
  )
    invalid()
  const chosen = value.selection
  if (
    chosen !== undefined &&
    (!object(chosen) || typeof chosen.provider !== 'string' || typeof chosen.model !== 'string')
  )
    invalid()
  const removed = selection(value.removedSelection)
  return {
    ...(removed ? { removedSelection: removed } : {}),
    sessionId: value.sessionId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    messageCount: value.messageCount,
    ...(typeof value.title === 'string' ? { title: value.title } : {}),
    ...(typeof value.hasSlides === 'boolean' ? { hasSlides: value.hasSlides } : {}),
    selectable: value.selectable,
    workspaceId: typeof value.workspaceId === 'string' ? value.workspaceId : null,
    readable: value.readable === true,
    ...(value.hasDraft === true ? { hasDraft: true } : {}),
    ...(object(chosen) && typeof chosen.provider === 'string' && typeof chosen.model === 'string'
      ? { selection: { provider: chosen.provider, model: chosen.model } }
      : {}),
    ...(typeof value.activeRequestId === 'string' ? { activeRequestId: value.activeRequestId } : {}),
  }
}

const workspaceStatuses = ['none', 'available', 'unreadable', 'different-folder'] as const

function workspaceList(value: unknown): WorkspaceList {
  if (!object(value) || typeof value.selectedId !== 'string' || !Array.isArray(value.workspaces)) invalid()
  return {
    selectedId: value.selectedId,
    workspaces: value.workspaces.map((item: unknown): WorkspaceView => {
      if (
        !object(item) ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        (item.folder !== null && typeof item.folder !== 'string') ||
        typeof item.isDefault !== 'boolean' ||
        !workspaceStatuses.some(status => status === item.folderStatus)
      )
        invalid()
      return {
        id: item.id,
        name: item.name,
        folder: typeof item.folder === 'string' ? item.folder : null,
        isDefault: item.isDefault,
        folderStatus: workspaceStatuses.find(status => status === item.folderStatus)!,
      }
    }),
  }
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
]

/** Validates management responses separately from request streaming. */
export class ManagementClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(path: string, method = 'GET', value?: unknown): Promise<unknown> {
    const response = await fetch(`${this.origin}/api/${path}`, {
      method,
      credentials: 'omit',
      redirect: 'error',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    if (!response.ok) {
      const data: unknown = await response.json().catch(() => undefined)
      const error = object(data) && object(data.error) ? data.error : undefined
      const code = error && typeof error.code === 'string' && allowedCodes.includes(error.code) ? error.code : 'SETTINGS_REQUEST_FAILED'
      const detail: Record<string, string | boolean> = {}
      if (error && object(error.detail) && code !== 'SETTINGS_REQUEST_FAILED')
        for (const [key, item] of Object.entries(error.detail))
          if (typeof item === 'string' || typeof item === 'boolean') detail[key] = item
      throw new ManagementError(code, detail)
    }
    return response.json()
  }

  async settings(): Promise<WebSettings> {
    const data = await this.request('settings')
    if (
      !object(data) ||
      !Array.isArray(data.providers) ||
      !Array.isArray(data.builtIns) ||
      typeof data.persistentKeys !== 'boolean' ||
      !object(data.runtime) ||
      typeof data.runtime.available !== 'boolean' ||
      (data.runtime.reason !== undefined && typeof data.runtime.reason !== 'string')
    )
      invalid()
    const builtIns = data.builtIns.map((item: unknown): ProviderTemplate => {
      if (
        !object(item) ||
        typeof item.id !== 'string' ||
        typeof item.displayName !== 'string' ||
        typeof item.baseUrl !== 'string' ||
        !Array.isArray(item.needs) ||
        item.needs.some(need => need !== 'key' && need !== 'baseUrl')
      )
        invalid()
      return { id: item.id, displayName: item.displayName, baseUrl: item.baseUrl, protocol: protocol(item.protocol),
        needs: item.needs.map(need => (need === 'key' ? 'key' : 'baseUrl')) }
    })
    return { providers: data.providers.map(provider), persistentKeys: data.persistentKeys, builtIns,
      runtime: { available: data.runtime.available, ...(typeof data.runtime.reason === 'string' ? { reason: data.runtime.reason } : {}) } }
  }

  /** Saves the interface theme on the Host, so it survives a change of local port. */
  async saveTheme(theme: WebPreferences['theme']): Promise<WebPreferences['theme']> {
    const data = await this.request('preferences', 'PUT', { theme })
    if (!object(data) || (data.theme !== 'light' && data.theme !== 'dark' && data.theme !== 'system')) invalid()
    return data.theme
  }

  async sessions(): Promise<readonly WebSession[]> {
    const data = await this.request('sessions')
    if (!Array.isArray(data)) invalid()
    return data.map(session)
  }

  async create(selection?: { provider: string; model: string }): Promise<WebSession> {
    return session(await this.request('sessions', 'POST', selection ? { selection } : {}))
  }

  async select(id: string, value: { provider: string; model: string }): Promise<WebSession> {
    return session(await this.request(`sessions/${encodeURIComponent(id)}/selection`, 'PUT', value))
  }

  /** Earlier chats whose name or conversation holds every word. */
  async search(words: string): Promise<readonly WebSession[]> {
    const data = await this.request('sessions/search', 'POST', { words })
    if (!Array.isArray(data)) invalid()
    return data.map(session)
  }

  async draft(id: string): Promise<string> {
    const data = await this.request(`sessions/${encodeURIComponent(id)}/draft`)
    if (!object(data) || typeof data.text !== 'string') invalid()
    return data.text
  }

  async saveDraft(id: string, text: string): Promise<void> {
    await this.request(`sessions/${encodeURIComponent(id)}/draft`, 'PUT', { text })
  }

  async workspaces(): Promise<WorkspaceList> {
    return workspaceList(await this.request('workspaces'))
  }

  async addWorkspace(folder: string): Promise<WorkspaceList> {
    return workspaceList(await this.request('workspaces', 'POST', { folder }))
  }

  async selectWorkspace(id: string): Promise<WorkspaceList> {
    return workspaceList(await this.request('workspaces/selected', 'PUT', { id }))
  }

  async renameWorkspace(id: string, name: string): Promise<WorkspaceList> {
    return workspaceList(await this.request(`workspaces/${encodeURIComponent(id)}`, 'PUT', { name }))
  }

  async relinkWorkspace(id: string, folder: string): Promise<WorkspaceList> {
    return workspaceList(await this.request(`workspaces/${encodeURIComponent(id)}/folder`, 'PUT', { folder }))
  }

  async removeWorkspace(id: string): Promise<WorkspaceList> {
    return workspaceList(await this.request(`workspaces/${encodeURIComponent(id)}`, 'DELETE'))
  }

  async save(
    id: string,
    value: { displayName: string; protocol: string; baseUrl: string; models: readonly string[]; key?: string; new?: boolean },
  ): Promise<void> {
    await this.request(`providers/${encodeURIComponent(id)}`, 'PUT', value)
  }

  async remove(id: string): Promise<void> {
    await this.request(`providers/${encodeURIComponent(id)}`, 'DELETE')
  }

  async catalog(id: string): Promise<readonly string[]> {
    const data = await this.request(`providers/${encodeURIComponent(id)}/catalog`)
    if (!Array.isArray(data)) invalid()
    return data.map(item => (typeof item === 'string' ? item : invalid()))
  }

  async activities(id: string): Promise<readonly StoredActivity[]> {
    const data = await this.request(`sessions/${encodeURIComponent(id)}/activities`)
    if (!Array.isArray(data)) invalid()
    return data.map((item: unknown): StoredActivity => {
      if (
        !object(item) ||
        typeof item.id !== 'string' ||
        typeof item.label !== 'string' ||
        typeof item.requestId !== 'string' ||
        typeof item.sequence !== 'number' ||
        (item.type !== 'model' && item.type !== 'tool') ||
        (item.status !== 'running' && item.status !== 'completed' && item.status !== 'failed' && item.status !== 'stopped')
      )
        invalid()
      return { id: item.id, label: item.label, requestId: item.requestId, sequence: item.sequence, type: item.type, status: item.status }
    })
  }

  async requests(id: string): Promise<readonly StoredRequest[]> {
    const data = await this.request(`sessions/${encodeURIComponent(id)}/requests`)
    if (!Array.isArray(data)) invalid()
    return data.map((value: unknown): StoredRequest => {
      if (
        !object(value) ||
        typeof value.requestId !== 'string' ||
        typeof value.sessionId !== 'string' ||
        typeof value.startedAt !== 'string' ||
        (value.endedAt !== undefined && typeof value.endedAt !== 'string') ||
        typeof value.lastSequence !== 'number' ||
        (value.summarized !== undefined && value.summarized !== true) ||
        !Number.isSafeInteger(value.historyStart) ||
        (value.errorCode !== undefined && (typeof value.errorCode !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(value.errorCode)))
      )
        invalid()
      const status = requestStatuses.find(item => item === value.status) ?? invalid()
      return {
        requestId: value.requestId,
        sessionId: value.sessionId,
        status,
        selection: selection(value.selection) ?? invalid(),
        historyStart: Number(value.historyStart),
        startedAt: value.startedAt,
        lastSequence: value.lastSequence,
        ...(typeof value.endedAt === 'string' ? { endedAt: value.endedAt } : {}),
        ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
        ...(value.summarized === true ? { summarized: true as const } : {}),
      }
    })
  }
}