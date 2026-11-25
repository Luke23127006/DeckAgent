import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HttpError, startHost } from '@deckagent/host-api'
import type { WebSettings } from '@deckagent/host-contracts'
import { SessionError, SqliteSessionStore } from '@deckagent/session-persistence'
import type { ModelSelection } from '@deckagent/session-persistence'
import { MemoryDraftStore } from './draft-store.ts'
import { WorkspaceRegistry } from '@deckagent/workspace-registry'
import { DeckStore, deckFailureMessage } from '@deckagent/deck'
import { HtmlFormatAdapter, validateLegacySlideHtml } from '@deckagent/html-format'
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
import { WebState } from './web-state.ts'
import { createChatOperations } from './features/chats/index.ts'
import { createWorkspaceOperations } from './features/workspaces/index.ts'
import { attachmentManagement, chatManagement, mapApplicationFailure, workspaceManagement } from './local-transport.ts'
import { ProviderStore } from './features/providers/index.ts'
import type { ProviderConnection, ProviderStoreOptions } from './features/providers/index.ts'
import { createRequestRuntime } from './features/requests/index.ts'
import { listModels } from './integrations/providers/index.ts'
import { defaultCredentialStore } from './integrations/credentials/index.ts'
import type { CredentialStore } from './integrations/credentials/index.ts'
import { OpenCodeRuntime, findExecutable } from './integrations/opencode/index.ts'
import type { OpenCodeOptions } from './integrations/opencode/index.ts'
import { sampleAssets } from './sample-slides.ts'
import { outlineStyle } from './outline-style.ts'
import { StorageError, prepareStorage, resolveStorageRoot } from './storage-root.ts'
import { ManagedAttachments, AttachmentService } from './features/attachments/index.ts'
import { prepareSourceTools } from './features/sources/index.ts'
import { attachmentStyle } from './attachment-style.ts'
import { ResearchService } from './features/research/index.ts'
import { TavilyClient } from './integrations/research/index.ts'
import { researchStyle } from './research-style.ts'
import {
  BriefService,
  ConfirmationService,
  DeckWorkflow,
  GenerationWorkflow,
  WebImageResearch,
  generationReport,
} from './features/deck/index.ts'
import { CommonsImages, PublicImageReader } from './integrations/images/index.ts'
import type { ImageLookup } from './integrations/images/index.ts'
import { artifactRenderer } from './integrations/rendering/index.ts'
import type { RequestRuntime } from '@deckagent/host-api'

export { StorageError, resolveStorageRoot } from './storage-root.ts'
export type { ProviderConnection } from './features/providers/index.ts'

export interface LocalWebOptions {
  /** Controlled image transport/DNS seams for tests; production pins public DNS addresses. */
  readonly imageAccess?: { readonly fetch: typeof fetch; readonly resolve?: ImageLookup }
  /** Tests may replace generation; production uses the same isolated CLI with confirmed phase tools. */
  readonly generationRuntime?: RequestRuntime
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
  /** Developer override. Otherwise use DECKAGENT_OPENCODE, app resources, installed runtime, then PATH. */
  readonly openCode?: OpenCodeOptions
  /** Defaults to the protected store of this OS. Tests may give their own. */
  readonly credentials?: CredentialStore
  /** Tests replace the provider check and catalog lookup; production calls the provider. */
  readonly providerAccess?: Pick<ProviderStoreOptions, 'check' | 'catalog'>
  /** Controlled HTTP seam for research tests. Production always uses fixed Tavily endpoints. */
  readonly researchAccess?: { readonly fetch: typeof fetch; readonly key?: string }
}

/**
 * Composition owns startup and cleanup: Application Storage, Workspace registry, chats, decks,
 * settings, the OpenCode runtime adapter, then the Host. No model runs at startup; a request starts one OpenCode run.
 */
export async function startLocalWeb(options: LocalWebOptions = {}) {
  const initial = options.selection ? { ...options.selection } : undefined
  const layout = await prepareStorage(options.dataDir ?? resolveStorageRoot())
  const commonsImages = new CommonsImages(options.imageAccess?.fetch)
  let registry: WorkspaceRegistry | undefined
  let sessions: SqliteSessionStore | undefined
  let decks: DeckStore | undefined
  let web: WebState | undefined
  let providers: ProviderStore | undefined
  let preparation: AttachmentService | undefined
  let artifactAttachments: ManagedAttachments | undefined
  let imageResearch: WebImageResearch | undefined
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
      const sessionStore = sessions
      decks = new DeckStore(join(layout.databases, 'decks.sqlite'), {
        formats: [new HtmlFormatAdapter()],
        legacyHtmlPolicy: validateLegacySlideHtml,
        researchImage: (_id, query, signal) => commonsImages.find(query, signal),
        artifactRoot: join(layout.files, 'decks'),
        renderCheck: artifactRenderer(join(layout.files, 'runtime', 'artifact-check')),
        preparedImage: async (id, attachmentId, signal) => {
          const item = sessionStore.attachments.get(id, attachmentId)
          if (
            !artifactAttachments ||
            !item.source ||
            !item.fingerprint ||
            !item.parsedFingerprint ||
            !item.detectedType?.startsWith('image/') ||
            !sessionStore.attachments.sent(id).some(a => a.attachmentId === attachmentId)
          )
            throw new SessionError('ATTACHMENT_UNREADABLE', 'The selected image is unavailable')
          const parsed = await artifactAttachments.prepared(id, attachmentId, signal)
          const part = parsed.parts.find(p => p.type === 'image')
          if (!part || part.type !== 'image')
            throw new SessionError('ATTACHMENT_UNREADABLE', 'The selected image has no prepared pixels')
          return {
            bytes: Buffer.from(part.data, 'base64'),
            source: item.source,
            originalDigest: item.fingerprint,
            parsedDigest: item.parsedFingerprint,
          }
        },
        activeRequest: (id, requestId) => {
          const request = sessionStore.requests.get(requestId)
          return request?.sessionId === id && ['active', 'waiting_approval'].includes(request.status)
        },
      })
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
    presentation.reconcileGenerations((id, requestId) => store.requests.get(requestId)?.sessionId === id)
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
        check:
          options.providerAccess?.check ??
          (async (endpoint, key) => {
            await listModels(endpoint, key, { pages: 1 })
          }),
        catalog:
          options.providerAccess?.catalog ??
          ((endpoint, key, signal) => listModels(endpoint, key, { signal, timeoutMs: 30_000 })),
        modelsRemoved: async (provider, models) => {
          await store.clearSelections(provider, models)
        },
      },
    )
    providers = catalog
    await catalog.load(options.connections, initial)
    const openCode = new OpenCodeRuntime(
      await findExecutable(
        options.openCode?.executable ?? (process.env.DECKAGENT_OPENCODE?.trim() || undefined),
        process.env,
        options.openCode?.resourceDir ?? fileURLToPath(new URL('../resources/opencode/', import.meta.url)),
      ),
      join(layout.files, 'runtime', 'opencode'),
      {
        read: sessionId => store.read(sessionId),
        requests: sessionId => store.requests.list(sessionId),
        request: requestId => store.requests.get(requestId),
        binding: sessionId => store.requests.binding(sessionId),
        bind: binding => store.requests.bind(binding),
        unbind: sessionId => store.requests.unbind(sessionId),
      },
      options.openCode,
    )
    await openCode.initialize()
    const runtime = createRequestRuntime({
      sessions: store,
      providers: catalog,
      runtime: openCode,
    })
    const settings = (): WebSettings => ({
      research: research.settings(),
      providers: catalog.providerSettings(),
      persistentKeys: catalog.persistentKeys,
      builtIns: catalog.builtIns,
      runtime: openCode.availability(),
    })
    const drafts = new MemoryDraftStore()
    const research = new ResearchService(
      state.db,
      options.credentials ?? defaultCredentialStore(layout.root),
      store,
      options.researchAccess ? options.researchAccess.key : process.env.TAVILY_API_KEY,
      new TavilyClient(options.researchAccess?.fetch),
    )
    const images = new WebImageResearch(
      research,
      commonsImages,
      new PublicImageReader(options.imageAccess?.fetch, options.imageAccess?.resolve),
    )
    imageResearch = images
    // Reconcile managed staging before the Host accepts requests. No upload endpoint is enabled yet.
    const attachments = await ManagedAttachments.open(layout.files, store.attachments, drafts)
    artifactAttachments = attachments
    const inputs = new AttachmentService(store, drafts, attachments)
    preparation = inputs
    const requestStore = inputs.requestStore()
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
        body:
          style +
          outlineStyle +
          deckResizeStyle +
          composerStyle +
          presentationStyle +
          activityStyle +
          motionStyle +
          attachmentStyle +
          researchStyle,
      },
    }
    const clientDir = join(dirname(fileURLToPath(import.meta.url)), 'browser')
    for (const name of await readdir(clientDir)) {
      if (/^[\w-]+\.js$/.test(name))
        assets[`/client/${name}`] = {
          contentType: 'text/javascript; charset=utf-8',
          body: await readFile(join(clientDir, name), 'utf8'),
        }
    }
    const workspaceOps = createWorkspaceOperations(workspaces, store)
    const chatOps = createChatOperations(store, workspaces, state, presentation, drafts)
    const briefs = new BriefService(presentation, store)
    const host = await startHost({
      mapApplicationFailure,
      failureMessage: deckFailureMessage,
      confirmations: new ConfirmationService(
        presentation,
        store,
        briefs,
        options.generationRuntime ?? new GenerationWorkflow(runtime, store),
      ),
      briefs,
      decks: presentation,
      outlines: presentation,
      assets,
      requests: {
        closingText: (sessionId, requestId, status) => generationReport(presentation, sessionId, requestId, status),
        store: requestStore,
        runtime: new DeckWorkflow(
          runtime,
          presentation,
          store,
          briefs,
          options.generationRuntime ?? new GenerationWorkflow(runtime, store),
          images,
        ),
        prepareTools: async (sessionId, attachmentIds, publicResearch) =>
          prepareSourceTools({
            sessionId,
            store,
            registry: workspaces,
            dataRoot: layout.root,
            home: options.home ?? homedir(),
            attachments,
            research: await research.prepare(publicResearch === true),
            ...(attachmentIds === undefined ? {} : { attachmentIds }),
          }),
      },
      attachments: attachmentManagement(inputs),
      ...(options.port === undefined ? {} : { port: options.port }),
      readHistory: id => store.read(id),
      management: {
        research: {
          save: value => research.save(value),
          remove: () => research.remove(),
          sources: async id => {
            if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
            return store.requests.researchSources(id)
          },
        },
        preferences: { get: async () => state.preferences(), save: async value => state.savePreferences(value) },
        settings: async () => settings(),
        saveProvider: (id, value) => catalog.save(id, value),
        deleteProvider: id => catalog.remove(id),
        catalog: id => catalog.catalog(id),
        ...chatManagement(chatOps),
        activities: async id => {
          if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
          return store.requests.activities(id)
        },
        requests: async id => {
          if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND')
          return store.requests.list(id)
        },
        workspaces: workspaceManagement(workspaceOps),
        drafts: {
          get: id => inputs.draft(id),
          save: (id, value) => inputs.save(id, value),
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
            await commonsImages.close()
            await images.close()
            await inputs.close()
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
    await commonsImages.close()
    await imageResearch?.close()
    await preparation?.close()
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
