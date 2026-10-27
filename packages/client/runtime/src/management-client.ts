import type {
  ProviderSettings,
  ProviderTemplate,
  StoredActivity,
  StoredRequest,
  WebSession,
  WebSettings,
  Workspace,
  RequestSummary,
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
    (value.workspaceId !== undefined && typeof value.workspaceId !== 'string')
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
    ...(typeof value.workspaceId === 'string' ? { workspaceId: value.workspaceId } : {}),
    ...(value.latestRequest === undefined ? {} : { latestRequest: requestSummary(value.latestRequest) }),
    selectable: value.selectable,
    ...(object(chosen) && typeof chosen.provider === 'string' && typeof chosen.model === 'string'
      ? { selection: { provider: chosen.provider, model: chosen.model } }
      : {}),
    ...(typeof value.activeRequestId === 'string' ? { activeRequestId: value.activeRequestId } : {}),
  }
}

function requestSummary(value: unknown): RequestSummary {
  if (
    !object(value) ||
    typeof value.requestId !== 'string' ||
    !/^[\w-]{1,100}$/.test(value.requestId) ||
    typeof value.sequence !== 'number' ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1 ||
    (value.revision !== undefined &&
      (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0)) ||
    (value.status !== 'running' &&
      value.status !== 'awaiting_user' &&
      value.status !== 'completed' &&
      value.status !== 'cancelled' &&
      value.status !== 'failed' &&
      value.status !== 'unknown')
  )
    invalid()
  return {
    requestId: value.requestId,
    status: value.status,
    sequence: value.sequence,
    ...(typeof value.revision === 'number' ? { revision: value.revision } : {}),
  }
}

function workspace(value: unknown): Workspace {
  if (
    !object(value) ||
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.name !== 'string' ||
    (value.state !== 'available' && value.state !== 'missing') ||
    (value.projectFolder !== undefined && typeof value.projectFolder !== 'string')
  )
    invalid()
  return {
    id: value.id,
    name: value.name,
    state: value.state,
    ...(typeof value.projectFolder === 'string' ? { projectFolder: value.projectFolder } : {}),
  }
}

/** Validates management responses separately from request streaming. */
export class ManagementClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  private async request(path: string, method = 'GET', value?: unknown, optional = false): Promise<unknown> {
    const response = await fetch(`${this.origin}/api/${path}`, {
      method,
      credentials: 'omit',
      redirect: 'error',
      headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    })
    if (optional && response.status === 404) return undefined
    if (!response.ok) {
      const data: unknown = await response.json()
      const allowed = [
        'INVALID_PROVIDER',
        'MODEL_NOT_SELECTABLE',
        'PROVIDER_NAME_EXISTS',
        'PROTOCOL_IMMUTABLE',
        'NEW_ENDPOINT_REQUIRES_KEY',
        'PROVIDER_BUSY',
        'AUTH_REQUIRED',
        'INVALID_WORKSPACE',
        'WORKSPACE_NOT_FOUND',
        'WORKSPACE_BUSY',
        'WORKSPACE_DEFAULT',
        'WORKSPACE_FOLDER_EXISTS',
        'WORKSPACE_FOLDER_IN_USE',
        'WORKSPACE_FOLDER_UNAVAILABLE',
        'WORKSPACE_STORAGE_OVERLAP',
      ]
      const code =
        object(data) && object(data.error) && typeof data.error.code === 'string' && allowed.includes(data.error.code)
          ? data.error.code
          : 'SETTINGS_REQUEST_FAILED'
      throw new Error(code)
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

  async sessions(): Promise<readonly WebSession[]> {
    const data = await this.request('sessions')
    if (!Array.isArray(data)) invalid()
    return data.map(session)
  }

  async create(selection?: { provider: string; model: string }, workspaceId?: string): Promise<WebSession> {
    return session(
      await this.request('sessions', 'POST', {
        ...(selection ? { selection } : {}),
        ...(workspaceId ? { workspaceId } : {}),
      }),
    )
  }

  async workspaces(): Promise<readonly Workspace[] | undefined> {
    const data = await this.request('workspaces', 'GET', undefined, true)
    if (data === undefined) return undefined
    if (!Array.isArray(data)) invalid()
    return data.map(workspace)
  }

  async addWorkspace(projectFolder: string): Promise<Workspace> {
    return workspace(await this.request('workspaces', 'POST', { projectFolder }))
  }

  async removeWorkspace(id: string): Promise<void> {
    await this.request(`workspaces/${encodeURIComponent(id)}`, 'DELETE')
  }

  async repointWorkspace(id: string, projectFolder: string): Promise<Workspace> {
    return workspace(await this.request(`workspaces/${encodeURIComponent(id)}`, 'PUT', { projectFolder }))
  }

  async select(id: string, value: { provider: string; model: string }): Promise<WebSession> {
    return session(await this.request(`sessions/${encodeURIComponent(id)}/selection`, 'PUT', value))
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
        (item.startedAt !== undefined &&
          (typeof item.startedAt !== 'number' || !Number.isFinite(item.startedAt) || item.startedAt < 0)) ||
        (item.endedAt !== undefined &&
          (typeof item.endedAt !== 'number' || !Number.isFinite(item.endedAt) || item.endedAt < 0)) ||
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
        ...(typeof item.startedAt === 'number' ? { startedAt: item.startedAt } : {}),
        ...(typeof item.endedAt === 'number' ? { endedAt: item.endedAt } : {}),
      }
    })
  }

  async requests(id: string): Promise<readonly StoredRequest[]> {
    const data = await this.request(`sessions/${encodeURIComponent(id)}/requests`)
    if (!Array.isArray(data)) invalid()
    return data.map((value: unknown) => {
      if (
        !object(value) ||
        (value.revision !== undefined &&
          (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0)) ||
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
        (value.historyStart !== undefined &&
          (typeof value.historyStart !== 'number' ||
            !Number.isSafeInteger(value.historyStart) ||
            value.historyStart < 0)) ||
        (value.noticeIndex !== undefined &&
          (typeof value.noticeIndex !== 'number' || !Number.isSafeInteger(value.noticeIndex) || value.noticeIndex < 0))
      )
        invalid()
      if (value.status === 'awaiting_user' && value.question === undefined) invalid()
      return {
        requestId: value.requestId,
        ...(typeof value.revision === 'number' ? { revision: value.revision } : {}),
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
