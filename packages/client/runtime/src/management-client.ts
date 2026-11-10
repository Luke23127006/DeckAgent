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
import { userQuestion } from './user-question.ts'

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function invalid(): never {
  throw new Error('INVALID_RESPONSE')
}

function provider(value: unknown): ProviderSettings {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    typeof value.displayName !== 'string' ||
    typeof value.baseUrl !== 'string' ||
    typeof value.hasKey !== 'boolean' ||
    typeof value.keyAvailable !== 'boolean' ||
    !Array.isArray(value.models) ||
    (value.protocol !== 'gemini' && value.protocol !== 'chat-completions' && value.protocol !== 'anthropic-messages')
  )
    invalid()
  return {
    id: value.id,
    displayName: value.displayName,
    baseUrl: value.baseUrl,
    hasKey: value.hasKey,
    keyAvailable: value.keyAvailable,
    protocol: value.protocol,
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
  return {
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
      typeof data.persistentKeys !== 'boolean'
    )
      invalid()
    const builtIns = data.builtIns.map((item: unknown): ProviderTemplate => {
      if (
        !object(item) ||
        typeof item.id !== 'string' ||
        typeof item.displayName !== 'string' ||
        typeof item.baseUrl !== 'string' ||
        (item.protocol !== 'gemini' && item.protocol !== 'chat-completions' && item.protocol !== 'anthropic-messages')
      )
        invalid()
      return { id: item.id, displayName: item.displayName, baseUrl: item.baseUrl, protocol: item.protocol }
    })
    return { providers: data.providers.map(provider), persistentKeys: data.persistentKeys, builtIns }
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
    value: { displayName: string; protocol: string; baseUrl: string; models: readonly string[]; key?: string },
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
    return data.map((item: unknown) => {
      if (
        !object(item) ||
        typeof item.id !== 'string' ||
        typeof item.label !== 'string' ||
        typeof item.requestId !== 'string' ||
        typeof item.sequence !== 'number' ||
        (item.kind !== 'model' && item.kind !== 'tool') ||
        (item.status !== 'running' &&
          item.status !== 'completed' &&
          item.status !== 'failed' &&
          item.status !== 'stopped' &&
          item.status !== 'unknown')
      )
        invalid()
      return {
        id: item.id,
        label: item.label,
        requestId: item.requestId,
        sequence: item.sequence,
        kind: item.kind,
        status: item.status,
      }
    })
  }

  async requests(id: string): Promise<readonly StoredRequest[]> {
    const data = await this.request(`sessions/${encodeURIComponent(id)}/requests`)
    if (!Array.isArray(data)) invalid()
    return data.map((value: unknown) => {
      if (
        !object(value) ||
        typeof value.requestId !== 'string' ||
        !object(value.selection) ||
        typeof value.selection.provider !== 'string' ||
        typeof value.selection.model !== 'string' ||
        (value.status !== 'running' &&
          value.status !== 'awaiting_user' &&
          value.status !== 'completed' &&
          value.status !== 'failed' &&
          value.status !== 'cancelled' &&
          value.status !== 'unknown') ||
        (value.errorCode !== undefined &&
          (typeof value.errorCode !== 'string' || !/^[A-Z_]{1,64}$/.test(value.errorCode))) ||
        (value.historyStart !== undefined && (typeof value.historyStart !== 'number' || !Number.isSafeInteger(value.historyStart) || value.historyStart < 0)) ||
        (value.noticeIndex !== undefined && (typeof value.noticeIndex !== 'number' || !Number.isSafeInteger(value.noticeIndex) || value.noticeIndex < 0))
      )
        invalid()
      if (value.status === 'awaiting_user' && value.question === undefined) invalid()
      return {
        requestId: value.requestId,
        selection: { provider: value.selection.provider, model: value.selection.model },
        status: value.status,
        ...(value.question === undefined ? {} : { question: userQuestion(value.question) }),
        ...(typeof value.errorCode === 'string' ? { errorCode: value.errorCode } : {}),
        ...(typeof value.historyStart === 'number' ? { historyStart: value.historyStart } : {}),
        ...(typeof value.noticeIndex === 'number' ? { noticeIndex: value.noticeIndex } : {}),
      }
    })
  }
}
