import { decodeAttachment } from '@deckagent/host-contracts'
import type {
  ChatDraft,
  ProviderProtocol,
  ProviderSettings,
  StoredActivity,
  StoredRequest,
  WebSession,
  WebSettings,
  WorkspaceList,
} from '@deckagent/host-contracts'
import { isRecord } from './http.ts'

function invalid(): never {
  throw new Error('INVALID_RESPONSE')
}

function decodeResearchSettings(value: unknown): NonNullable<WebSettings['research']> {
  if (
    !isRecord(value) ||
    value.provider !== 'tavily' ||
    typeof value.configured !== 'boolean' ||
    typeof value.environmentKey !== 'boolean' ||
    value.freeOnly !== true
  )
    invalid()
  return { provider: 'tavily', configured: value.configured, environmentKey: value.environmentKey, freeOnly: true }
}
const protocols: readonly ProviderProtocol[] = ['chat-completions', 'responses', 'anthropic-messages', 'gemini']
const requestStatuses = ['active', 'waiting_approval', 'completed', 'failed', 'stopped', 'interrupted'] as const
function protocol(value: unknown): ProviderProtocol {
  return protocols.find(item => item === value) ?? invalid()
}
function selection(value: unknown): { provider: string; model: string } | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || typeof value.provider !== 'string' || typeof value.model !== 'string') invalid()
  return { provider: value.provider, model: value.model }
}
function provider(value: unknown): ProviderSettings {
  if (
    !isRecord(value) ||
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

export function decodeSettings(value: unknown): WebSettings {
  if (
    !isRecord(value) ||
    !Array.isArray(value.providers) ||
    !Array.isArray(value.builtIns) ||
    typeof value.persistentKeys !== 'boolean' ||
    typeof value.providersVersion !== 'number' ||
    !Number.isSafeInteger(value.providersVersion) ||
    value.providersVersion < 0 ||
    !isRecord(value.runtime) ||
    typeof value.runtime.available !== 'boolean' ||
    (value.runtime.reason !== undefined && typeof value.runtime.reason !== 'string')
  )
    invalid()
  const builtIns = value.builtIns.map((item: unknown) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.displayName !== 'string' ||
      typeof item.baseUrl !== 'string' ||
      !Array.isArray(item.needs) ||
      item.needs.some(need => need !== 'key' && need !== 'baseUrl')
    )
      invalid()
    return {
      id: item.id,
      displayName: item.displayName,
      baseUrl: item.baseUrl,
      protocol: protocol(item.protocol),
      needs: item.needs.map(need => (need === 'key' ? 'key' : 'baseUrl')),
    }
  })
  return {
    providers: value.providers.map(provider),
    providersVersion: value.providersVersion,
    ...(value.research === undefined ? {} : { research: decodeResearchSettings(value.research) }),
    persistentKeys: value.persistentKeys,
    builtIns,
    runtime: {
      available: value.runtime.available,
      ...(typeof value.runtime.reason === 'string' ? { reason: value.runtime.reason } : {}),
    },
  }
}
export function decodeSession(value: unknown): WebSession {
  if (
    !isRecord(value) ||
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
  if (chosen !== undefined && !isRecord(chosen)) invalid()
  if (isRecord(chosen) && (typeof chosen.provider !== 'string' || typeof chosen.model !== 'string')) invalid()
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
    ...(isRecord(chosen) && typeof chosen.provider === 'string' && typeof chosen.model === 'string'
      ? { selection: { provider: chosen.provider, model: chosen.model } }
      : {}),
    ...(typeof value.activeRequestId === 'string' ? { activeRequestId: value.activeRequestId } : {}),
  }
}
const workspaceStatuses = ['none', 'available', 'unreadable', 'different-folder'] as const
export function decodeWorkspaceList(value: unknown): WorkspaceList {
  if (
    !isRecord(value) ||
    typeof value.selectedId !== 'string' ||
    typeof value.version !== 'number' ||
    !Number.isSafeInteger(value.version) ||
    value.version < 0 ||
    !Array.isArray(value.workspaces)
  )
    invalid()
  return {
    selectedId: value.selectedId,
    version: value.version,
    workspaces: value.workspaces.map((item: unknown) => {
      if (
        !isRecord(item) ||
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        (item.folder !== null && typeof item.folder !== 'string') ||
        typeof item.isDefault !== 'boolean'
      )
        invalid()
      const folderStatus = workspaceStatuses.find(status => status === item.folderStatus) ?? invalid()
      return {
        id: item.id,
        name: item.name,
        folder: typeof item.folder === 'string' ? item.folder : null,
        isDefault: item.isDefault,
        folderStatus,
      }
    }),
  }
}
export function decodeResearchSources(
  value: unknown,
): readonly { title: string; url: string; content: string; sourceId: string; retrievedAt: string }[] {
  if (!Array.isArray(value)) invalid()
  return value.map(item => {
    if (
      !isRecord(item) ||
      typeof item.title !== 'string' ||
      typeof item.url !== 'string' ||
      typeof item.content !== 'string' ||
      typeof item.sourceId !== 'string' ||
      typeof item.retrievedAt !== 'string' ||
      !/^https?:\/\//.test(item.url)
    )
      invalid()
    return {
      title: item.title,
      url: item.url,
      content: item.content,
      sourceId: item.sourceId,
      retrievedAt: item.retrievedAt,
    }
  })
}
export function decodeTheme(value: unknown): 'light' | 'dark' | 'system' {
  if (!isRecord(value) || (value.theme !== 'light' && value.theme !== 'dark' && value.theme !== 'system')) invalid()
  return value.theme
}
export function decodeActivities(value: unknown): readonly StoredActivity[] {
  if (!Array.isArray(value)) invalid()
  return value.map((item: unknown): StoredActivity => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.label !== 'string' ||
      typeof item.requestId !== 'string' ||
      typeof item.sequence !== 'number' ||
      (item.type !== 'model' && item.type !== 'tool') ||
      (item.status !== 'running' &&
        item.status !== 'completed' &&
        item.status !== 'failed' &&
        item.status !== 'stopped')
    )
      invalid()
    return {
      id: item.id,
      label: item.label,
      requestId: item.requestId,
      sequence: item.sequence,
      type: item.type,
      status: item.status,
    }
  })
}
export function decodeRequests(value: unknown): readonly StoredRequest[] {
  if (!Array.isArray(value)) invalid()
  return value.map((item: unknown): StoredRequest => {
    if (
      !isRecord(item) ||
      typeof item.requestId !== 'string' ||
      typeof item.sessionId !== 'string' ||
      typeof item.startedAt !== 'string' ||
      (item.endedAt !== undefined && typeof item.endedAt !== 'string') ||
      typeof item.lastSequence !== 'number' ||
      (item.summarized !== undefined && item.summarized !== true) ||
      (item.publicResearch !== undefined && typeof item.publicResearch !== 'boolean') ||
      !Number.isSafeInteger(item.historyStart) ||
      (item.errorCode !== undefined &&
        (typeof item.errorCode !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(item.errorCode)))
    )
      invalid()
    const status = requestStatuses.find(status => status === item.status) ?? invalid()
    return {
      requestId: item.requestId,
      sessionId: item.sessionId,
      status,
      selection: selection(item.selection) ?? invalid(),
      historyStart: Number(item.historyStart),
      startedAt: item.startedAt,
      ...(typeof item.publicResearch === 'boolean' ? { publicResearch: item.publicResearch } : {}),
      lastSequence: item.lastSequence,
      ...(typeof item.endedAt === 'string' ? { endedAt: item.endedAt } : {}),
      ...(typeof item.errorCode === 'string' ? { errorCode: item.errorCode } : {}),
      ...(item.summarized === true ? { summarized: true as const } : {}),
    }
  })
}
export function decodeDraft(value: unknown, id: string): ChatDraft {
  if (!isRecord(value) || value.sessionId !== id || typeof value.text !== 'string') invalid()
  if (value.revision === undefined && value.attachmentIds === undefined && value.attachments === undefined)
    return { sessionId: id, text: value.text }
  if (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0) invalid()
  if (!Array.isArray(value.attachmentIds) || !Array.isArray(value.attachments)) invalid()
  const attachments = value.attachments.map(decodeAttachment)
  const ids = value.attachmentIds.map((item: unknown) => (typeof item === 'string' ? item : invalid()))
  if (
    new Set(ids).size !== ids.length ||
    ids.length !== attachments.length ||
    ids.some((item, index) => item !== attachments[index]?.attachmentId)
  )
    invalid()
  return { sessionId: id, text: value.text, revision: value.revision, attachmentIds: ids, attachments }
}
export function decodeCatalog(value: unknown): readonly string[] {
  if (!Array.isArray(value)) invalid()
  return value.map(item => (typeof item === 'string' ? item : invalid()))
}
export function decodePreviewText(value: unknown): string {
  if (!isRecord(value) || typeof value.text !== 'string') invalid()
  return value.text
}
