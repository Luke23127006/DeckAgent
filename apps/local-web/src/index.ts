import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError, startHost } from '@deckagent/host-api'
import type { RequestStore, WebSession, WebSettings, WorkspaceList, WorkspaceManagement } from '@deckagent/host-api'
import { MemoryDraftStore, SessionError, SqliteSessionStore } from '@deckagent/session-persistence'
import type { ChatSummary, ModelSelection } from '@deckagent/session-persistence'
import { WorkspaceError, WorkspaceRegistry } from '@deckagent/workspace-registry'
import { DeckService } from '@deckagent/deck'
import type { ConfirmedDeckPlan } from '@deckagent/deck'
import {
  page,
  style,
  deckResizeStyle,
  composerStyle,
  presentationStyle,
  activityStyle,
  motionStyle,
  themeBootstrap,
} from './ui-assets.ts'
import { WebState, record, selection } from './web-state.ts'
import { ProviderStore } from './provider-settings.ts'
import type { ProviderConnection, ProviderStoreOptions } from './provider-settings.ts'
import { defaultCredentialStore } from './credential-store.ts'
import type { CredentialStore } from './credential-store.ts'
import { OpenCodeRuntime, findExecutable } from './opencode/runtime.ts'
import type { OpenCodeOptions } from './opencode/runtime.ts'
import { sampleAssets } from './sample-slides.ts'
import { outlineStyle } from './outline-style.ts'
import { StorageError, prepareStorage, resolveStorageRoot } from './storage-root.ts'
import { ManagedAttachments } from './managed-attachments.ts'
import { prepareSourceTools } from './source-tools.ts'

export { ManagedAttachments } from './managed-attachments.ts'
export { prepareSourceTools } from './source-tools.ts'
export { openToolBridge } from './opencode/mcp-bridge.ts'
export type { AttachmentUpload } from './managed-attachments.ts'

export { StorageError, resolveStorageRoot } from './storage-root.ts'
export type { StorageErrorCode, StorageLayout } from './storage-root.ts'
export {
  CredentialError,
  ProtectedFileCredentialStore,
  UnavailableCredentialStore,
  defaultCredentialStore,
} from './credential-store.ts'
export type { CredentialStore } from './credential-store.ts'
export type { ProviderConnection, ProviderStoreOptions } from './provider-settings.ts'
export { pinnedVersion } from './opencode/config.ts'
export type { OpenCodeOptions } from './opencode/runtime.ts'

export interface LocalWebOptions {
  /** Trusted test/manual plans only; no model-facing confirmation bypass. */
  readonly confirmedDecks?: readonly (ConfirmedDeckPlan & { readonly sessionId: string })[]
  readonly selection?: ModelSelection
  /** Startup connections (CLI flags). Their keys stay in environment variables and are never saved. */
  readonly connections?: readonly ProviderConnection[]
  /** Application Storage root. Defaults to `resolveStorageRoot()`. */
  readonly dataDir?: string
  readonly port?: number
  /** The user's own folder for the project-folder rules (BR-019). Defaults to the OS home folder. */
  readonly home?: string
  /** The OpenCode CLI. Defaults: `DECKAGENT_OPENCODE`, else `opencode` on PATH; pinned version. */
  readonly openCode?: OpenCodeOptions
  /** Defaults to the protected store of this OS. Tests may give their own. */
  readonly credentials?: CredentialStore
  /** Tests replace the provider check and catalog lookup; production calls the provider. */
  readonly providerAccess?: Pick<ProviderStoreOptions, 'check' | 'catalog'>
}

const workspaceStatus: Readonly<Record<WorkspaceError['code'], number>> = {
  WORKSPACE_NOT_FOUND: 404,
  WORKSPACE_DEFAULT: 409,
  WORKSPACE_FOLDER_REQUIRED: 400,
  WORKSPACE_FOLDER_INVALID: 400,
  WORKSPACE_FOLDER_UNREADABLE: 422,
  WORKSPACE_FOLDER_REFUSED: 422,
  WORKSPACE_FOLDER_IN_USE: 409,
  WORKSPACE_NAME_EMPTY: 400,
  WORKSPACE_NAME_TOO_LONG: 400,
  WORKSPACE_STORAGE: 500,
  WORKSPACE_SCHEMA: 500,
}

/** Workspace failures become HTTP errors with safe details only: a workspace name or a refusal reason, never a path. */
async function workspaceCall<T>(operation: () => T | Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!(error instanceof WorkspaceError)) throw error
    const { workspaceName, reason, allowInside } = error.detail
    throw new HttpError(workspaceStatus[error.code], error.code, {
      ...(workspaceName === undefined ? {} : { workspaceName }),
      ...(reason === undefined ? {} : { reason }),
      ...(allowInside === undefined ? {} : { allowInside }),
    })
  }
}

async function chatCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof SessionError && error.code === 'SESSION_NOT_FOUND')
      throw new HttpError(404, 'SESSION_NOT_FOUND')
    if (error instanceof SessionError && error.code === 'SESSION_CORRUPT') throw new HttpError(409, 'CHAT_UNREADABLE')
    if (error instanceof SessionError && error.code === 'DRAFT_TOO_LARGE') throw new HttpError(413, 'DRAFT_TOO_LARGE')
    throw error
  }
}

function body(value: unknown, key: string): unknown {
  if (!record(value) || Object.keys(value).some(name => name !== key)) throw new HttpError(400, 'INVALID_REQUEST')
  return value[key]
}

/**
 * Composition owns startup and cleanup: Application Storage, Workspace registry, chats, decks,
 * settings, the OpenCode runtime adapter, then the Host. No model runs at startup; a request starts one OpenCode run.
 */
export async function startLocalWeb(options: LocalWebOptions = {}) {
  const initial = options.selection ? { ...options.selection } : undefined
  const layout = await prepareStorage(options.dataDir ?? resolveStorageRoot())
  let registry: WorkspaceRegistry | undefined
  let sessions: SqliteSessionStore | undefined
  let decks: DeckService | undefined
  let web: WebState | undefined
  let providers: ProviderStore | undefined
  try {
    try {
      registry = new WorkspaceRegistry({
        path: join(layout.databases, 'workspaces.sqlite'),
        home: options.home ?? homedir(),
        dataRoot: layout.root,
      })
    } catch {
      throw new StorageError('STORAGE_CORRUPT')
    }
    // Checked before any other database is created: app data never goes into a registered project folder.
    if (registry.overlapsFolder(layout.root)) throw new StorageError('STORAGE_INSIDE_WORKSPACE')
    try {
      sessions = new SqliteSessionStore(join(layout.databases, 'sessions.sqlite'))
      decks = new DeckService(join(layout.databases, 'decks.sqlite'))
      web = new WebState(join(layout.databases, 'web.sqlite'), value => catalog.selectable(value))
    } catch {
      // A damaged or foreign file is kept unchanged; nothing is reset or recreated in its place.
      throw new StorageError('STORAGE_CORRUPT')
    }
    const workspaces = registry
    const store = sessions
    const presentation = decks
    const state: WebState = web
    // A request that was active when DeckAgent stopped did not finish; it is shown so and never started again (FR-019).
    store.requests.interruptActive()
    // A remove interrupted between the registry and the chats is completed here: no chat is lost or hidden.
    await store.ungroupExcept(workspaces.activeIds())
    for (const plan of options.confirmedDecks ?? []) {
      if (!(await store.getInfo(plan.sessionId))) {
        if (initial) await store.bind(plan.sessionId, initial)
        else await store.open(plan.sessionId)
      }
      presentation.confirm(plan.sessionId, plan)
    }
    const catalog: ProviderStore = new ProviderStore(
      state.db,
      options.credentials ?? defaultCredentialStore(layout.root),
      {
        ...options.providerAccess,
        modelsRemoved: async (provider, models) => {
          await store.clearSelections(provider, models)
        },
      },
    )
    providers = catalog
    await catalog.load(options.connections, initial)
    const runtime = new OpenCodeRuntime(
      await findExecutable(options.openCode?.executable ?? process.env.DECKAGENT_OPENCODE?.trim() ?? undefined),
      join(layout.files, 'runtime', 'opencode'),
      store,
      catalog,
      options.openCode,
    )
    const settings = (): WebSettings => ({
      providers: catalog.providerSettings(),
      persistentKeys: catalog.persistentKeys,
      builtIns: catalog.builtIns,
      runtime: runtime.availability(),
    })
    const requestStore: RequestStore = store.requests
    // UC-013 A5: a workspace with an active request in one of its chats is not removed or moved; no request is stopped.
    const requireNoActiveRequest = async (workspaceId: string) => {
      const chats = (await store.list()).filter(chat => chat.workspaceId === workspaceId)
      if (chats.some(chat => store.requests.activeFor(chat.sessionId)))
        throw new HttpError(409, 'WORKSPACE_REQUEST_ACTIVE')
    }
    const drafts = new MemoryDraftStore()
    // Reconcile managed staging before the Host accepts requests. No upload endpoint is enabled yet.
    const attachments = await ManagedAttachments.open(layout.files, store.attachments, drafts)
    const assets: Record<string, { contentType: string; body: string }> = {
      ...sampleAssets,
      '/': { contentType: 'text/html; charset=utf-8', body: page },
      // Read per request so the saved choice is applied before first paint, whatever the origin.
      '/theme.js': {
        contentType: 'text/javascript; charset=utf-8',
        get body() {
          return themeBootstrap(state.preferences().theme)
        },
      },
      '/style.css': {
        contentType: 'text/css; charset=utf-8',
        body: style + outlineStyle + deckResizeStyle + composerStyle + presentationStyle + activityStyle + motionStyle,
      },
    }
    const clientDir = dirname(fileURLToPath(import.meta.resolve('@deckagent/browser-runtime')))
    for (const name of await readdir(clientDir)) {
      if (/^[\w-]+\.js$/.test(name))
        assets[`/client/${name}`] = {
          contentType: 'text/javascript; charset=utf-8',
          body: await readFile(join(clientDir, name), 'utf8'),
        }
    }
    const project = (chat: ChatSummary): WebSession => ({
      ...state.project(
        chat,
        chat.readable && presentation.snapshot(chat.sessionId).slides.some(slide => slide.revision > 0),
      ),
      hasDraft: drafts.get(chat.sessionId).trim() !== '',
    })
    const chat = async (id: string): Promise<WebSession> => {
      const found = (await store.chats()).find(item => item.sessionId === id)
      if (!found) throw new HttpError(404, 'SESSION_NOT_FOUND')
      return project(found)
    }
    const listWorkspaces = async (): Promise<WorkspaceList> => ({
      workspaces: await workspaces.list(),
      selectedId: workspaces.selectedId(),
    })
    const workspaceManagement: WorkspaceManagement = {
      list: () => workspaceCall(listWorkspaces),
      add: value =>
        workspaceCall(async () => {
          await workspaces.add(body(value, 'folder'))
          return listWorkspaces()
        }),
      select: value =>
        workspaceCall(async () => {
          const id = body(value, 'id')
          if (typeof id !== 'string') throw new HttpError(400, 'INVALID_REQUEST')
          workspaces.select(id)
          return listWorkspaces()
        }),
      rename: (id, value) =>
        workspaceCall(async () => {
          workspaces.rename(id, body(value, 'name'))
          return listWorkspaces()
        }),
      relink: (id, value) =>
        workspaceCall(async () => {
          await requireNoActiveRequest(id)
          await workspaces.relink(id, body(value, 'folder'))
          return listWorkspaces()
        }),
      remove: id =>
        workspaceCall(async () => {
          await requireNoActiveRequest(id)
          workspaces.remove(id)
          await store.ungroup(id)
          return listWorkspaces()
        }),
    }
    const host = await startHost({
      decks: presentation,
      outlines: presentation,
      assets,
      requests: {
        store: requestStore,
        runtime,
        prepareTools: sessionId =>
          prepareSourceTools({
            sessionId,
            store,
            registry: workspaces,
            dataRoot: layout.root,
            home: options.home ?? homedir(),
            attachments,
          }),
      },
      ...(options.port === undefined ? {} : { port: options.port }),
      readHistory: id => chatCall(() => store.read(id)),
      management: {
        preferences: { get: async () => state.preferences(), save: async value => state.savePreferences(value) },
        settings: async () => settings(),
        saveProvider: (id, value) => catalog.save(id, value),
        deleteProvider: id => catalog.remove(id),
        catalog: id => catalog.catalog(id),
        sessions: async () => (await store.chats()).map(project),
        async createSession(value) {
          if (!record(value) || Object.keys(value).some(key => key !== 'selection'))
            throw new HttpError(400, 'INVALID_SESSION')
          // FR-053: without an explicit choice, the most recent model choice in any chat when still selectable.
          const chosen = value.selection === undefined ? state.lastSelection() : selection(value.selection)
          if (chosen && !state.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
          const created = await store.create(workspaces.selectedId(), chosen)
          return chat(created.sessionId)
        },
        async selectModel(id, value) {
          const chosen = selection(value)
          if (!state.selectable(chosen)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
          await chatCall(() => store.select(id, chosen))
          state.rememberSelection(chosen)
          return chat(id)
        },
        activities: id =>
          chatCall(async () => {
            if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
            return store.requests.activities(id)
          }),
        requests: id =>
          chatCall(async () => {
            if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
            return store.requests.list(id)
          }),
        workspaces: workspaceManagement,
        async searchSessions(value) {
          const words = body(value, 'words')
          if (typeof words !== 'string' || words.length > 500) throw new HttpError(400, 'INVALID_REQUEST')
          const chats = await store.chats()
          const found = new Set(
            await store.search(
              words,
              chats.map(item => item.sessionId),
            ),
          )
          return chats.filter(item => found.has(item.sessionId)).map(project)
        },
        drafts: {
          get: id =>
            chatCall(async () => {
              if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
              return { sessionId: id, text: drafts.get(id) }
            }),
          save: (id, value) =>
            chatCall(async () => {
              const text = body(value, 'text')
              if (typeof text !== 'string') throw new HttpError(400, 'INVALID_REQUEST')
              if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
              return { sessionId: id, text: drafts.set(id, text) }
            }),
        },
      },
    })
    let closing: Promise<void> | undefined
    return {
      origin: host.origin,
      token: host.token,
      /** Application Storage root actually in use (canonical). */
      dataDir: layout.root,
      close(): Promise<void> {
        closing ??= (async () => {
          try {
            await host.close()
          } finally {
            try {
              await catalog.close()
            } finally {
              try {
                presentation.close()
              } finally {
                try {
                  state.close()
                } finally {
                  try {
                    store.close()
                  } finally {
                    workspaces.close()
                  }
                }
              }
            }
          }
        })()
        return closing
      },
    }
  } catch (error) {
    try {
      await providers?.close()
    } finally {
      try {
        decks?.close()
      } finally {
        try {
          web?.close()
        } finally {
          try {
            sessions?.close()
          } finally {
            registry?.close()
          }
        }
      }
    }
    throw error
  }
}
