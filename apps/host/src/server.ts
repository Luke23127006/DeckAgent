import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HostOptions, RequestRuntime } from '@deckagent/host-api'
import { createChangeFeed, type ChangeFeed } from './http/change-feed.ts'
import { startHost, type StartHostOptions } from './http/start-host.ts'
import type { WebSettings } from '@deckagent/host-contracts'
import { SessionError, SqliteSessionStore, type ModelSelection } from '@deckagent/session-persistence'
import { MemoryDraftStore } from './draft-store.ts'
import {
  WorkspaceRegistry,
  createWorkspaceOperations,
  createWorkspaceRoutes,
  mapWorkspaceFailure,
} from './modules/workspaces/index.ts'
import { DeckStore, deckFailureMessage, type ConfirmedDeckPlan } from '@deckagent/deck'
import { HtmlFormatAdapter, validateLegacySlideHtml } from '@deckagent/html-format'
import { loadWebAssets } from '@deckagent/local-web'
import { WebState, selection } from './web-state.ts'
import {
  createChatOperations,
  createChatRoutes,
  createWorkspaceChats,
  mapChatFailure,
  type ChatMarks,
} from './modules/chats/index.ts'
import { attachmentManagement, mapApplicationFailure, sessionReadManagement } from './local-transport.ts'
import { ProviderStore, type ProviderConnection, type ProviderStoreOptions } from './features/providers/index.ts'
import { createRequestRuntime } from './features/requests/index.ts'
import { listModels } from './integrations/providers/index.ts'
import { defaultCredentialStore, type CredentialStore } from './integrations/credentials/index.ts'
import { OpenCodeRuntime, findExecutable, type OpenCodeOptions } from './integrations/opencode/index.ts'
import { StorageError, prepareStorage, resolveStorageRoot, type StorageLayout } from './storage-root.ts'
import { AttachmentCoordinator, ManagedAttachments } from './features/attachments/index.ts'
import { prepareSourceTools } from './features/sources/index.ts'
import { ResearchCoordinator } from './features/research/index.ts'
import { TavilyClient } from './integrations/research/index.ts'
import {
  BriefCoordinator,
  ConfirmationCoordinator,
  DeckWorkflow,
  GenerationWorkflow,
  WebImageResearch,
  generationReport,
} from './features/deck/index.ts'
import { CommonsImages, PublicImageReader, type ImageLookup } from './integrations/images/index.ts'
import { artifactRenderer, type ArtifactRenderer } from './integrations/rendering/index.ts'

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

interface StorageLayer {
  readonly registry: WorkspaceRegistry
  readonly sessions: SqliteSessionStore
  readonly decks: DeckStore
  readonly web: WebState
  bindSelectability(isSelectable: (value: ModelSelection) => boolean): void
}

interface RuntimeLayer {
  readonly providers: ProviderStore
  readonly runtime: RequestRuntime
  readonly research: ResearchCoordinator
  readonly images: WebImageResearch
  readonly inputs: AttachmentCoordinator
  readonly generationRuntime: RequestRuntime
  readonly settings: () => WebSettings
}

/** Closes every resource even after a failure, then reports the first failure. */
async function closeResources(closers: readonly (() => Promise<void> | void)[]): Promise<void> {
  const failures: unknown[] = []
  for (const close of closers) {
    try {
      await close()
    } catch (error) {
      failures.push(error)
    }
  }
  if (failures.length > 0) throw failures[0]
}

function createPreparedImageReader(sessions: SqliteSessionStore, getAttachments: () => ManagedAttachments | undefined) {
  return async (id: string, attachmentId: string, signal: AbortSignal) => {
    const item = sessions.attachments.get(id, attachmentId)
    const files = getAttachments()
    if (
      !files ||
      !item.source ||
      !item.fingerprint ||
      !item.parsedFingerprint ||
      !item.detectedType?.startsWith('image/') ||
      !sessions.attachments.sent(id).some(a => a.attachmentId === attachmentId)
    )
      throw new SessionError('ATTACHMENT_UNREADABLE', 'The selected image is unavailable')
    const parsed = await files.prepared(id, attachmentId, signal)
    const part = parsed.parts.find(p => p.type === 'image')
    if (!part || part.type !== 'image')
      throw new SessionError('ATTACHMENT_UNREADABLE', 'The selected image has no prepared pixels')
    return {
      bytes: Buffer.from(part.data, 'base64'),
      source: item.source,
      originalDigest: item.fingerprint,
      parsedDigest: item.parsedFingerprint,
    }
  }
}

function createDeckStore(
  layout: StorageLayout,
  sessions: SqliteSessionStore,
  renderer: ArtifactRenderer,
  commonsImages: CommonsImages,
  getAttachments: () => ManagedAttachments | undefined,
): DeckStore {
  return new DeckStore(join(layout.databases, 'decks.sqlite'), {
    formats: [new HtmlFormatAdapter()],
    legacyHtmlPolicy: validateLegacySlideHtml,
    researchImage: (_id, query, signal) => commonsImages.find(query, signal),
    artifactRoot: join(layout.files, 'decks'),
    renderCheck: (html, requiredText, signal) => renderer.render(html, requiredText, signal),
    preparedImage: createPreparedImageReader(sessions, getAttachments),
    activeRequest: (id, requestId) => {
      const request = sessions.requests.get(requestId)
      return request?.sessionId === id && ['active', 'waiting_approval'].includes(request.status)
    },
  })
}

async function openStorageLayer(
  layout: StorageLayout,
  options: LocalWebOptions,
  renderer: ArtifactRenderer,
  commonsImages: CommonsImages,
  getAttachments: () => ManagedAttachments | undefined,
  changeFeed: ChangeFeed,
): Promise<StorageLayer> {
  const initial = options.selection ? { ...options.selection } : undefined
  let isSelectable: (value: ModelSelection) => boolean = () => false
  let registry: WorkspaceRegistry | undefined
  let sessions: SqliteSessionStore | undefined
  let decks: DeckStore | undefined
  let web: WebState | undefined
  try {
    try {
      registry = new WorkspaceRegistry({
        path: join(layout.databases, 'workspaces.sqlite'),
        home: options.home ?? homedir(),
        dataRoot: layout.root,
        publish: changeFeed.publish,
      })
    } catch {
      throw new StorageError('STORAGE_CORRUPT')
    }
    // Checked before any other database is created: app data never goes into a registered project folder.
    if (registry.overlapsFolder(layout.root)) throw new StorageError('STORAGE_INSIDE_WORKSPACE')
    try {
      sessions = new SqliteSessionStore(join(layout.databases, 'sessions.sqlite'))
      decks = createDeckStore(layout, sessions, renderer, commonsImages, getAttachments)
      web = new WebState(join(layout.databases, 'web.sqlite'), value => isSelectable(value))
    } catch {
      // A damaged or foreign file is kept unchanged; nothing is reset or recreated in its place.
      throw new StorageError('STORAGE_CORRUPT')
    }
    const store = sessions
    const presentation = decks
    const state = web
    // A request that was active when DeckAgent stopped did not finish; it is shown so and never started again (FR-019).
    store.requests.interruptActive()
    presentation.reconcileGenerations((id, requestId) => store.requests.get(requestId)?.sessionId === id)
    // A remove interrupted between the registry and the chats is completed here: no chat is lost or hidden.
    await store.ungroupExcept(registry.activeIds())
    for (const plan of options.confirmedDecks ?? []) {
      if (!(await store.getInfo(plan.sessionId))) {
        if (initial) await store.bind(plan.sessionId, initial)
        else await store.open(plan.sessionId)
      }
      presentation.confirm(plan.sessionId, plan)
    }
    return {
      registry,
      sessions: store,
      decks: presentation,
      web: state,
      bindSelectability(value) {
        isSelectable = value
      },
    }
  } catch (error) {
    try {
      await closeResources([() => web?.close(), () => decks?.close(), () => sessions?.close(), () => registry?.close()])
    } catch {
      // The startup failure stays the caller's error; a cleanup failure must not replace it.
    }
    throw error
  }
}

async function createRuntimeLayer(
  layout: StorageLayout,
  options: LocalWebOptions,
  storage: StorageLayer,
  commonsImages: CommonsImages,
  attachments: ManagedAttachments,
  drafts: MemoryDraftStore,
  credentials: CredentialStore,
): Promise<RuntimeLayer> {
  const { sessions, web } = storage
  const initial = options.selection ? { ...options.selection } : undefined
  const providers = new ProviderStore(web.db, credentials, {
    check:
      options.providerAccess?.check ??
      (async (endpoint, key) => {
        await listModels(endpoint, key, { pages: 1 })
      }),
    catalog:
      options.providerAccess?.catalog ??
      ((endpoint, key, signal) => listModels(endpoint, key, { signal, timeoutMs: 30_000 })),
    modelsRemoved: async (provider, models) => {
      await sessions.clearSelections(provider, models)
    },
  })
  storage.bindSelectability(value => providers.selectable(value))
  await providers.load(options.connections, initial)
  const openCode = new OpenCodeRuntime(
    await findExecutable(
      options.openCode?.executable ?? (process.env.DECKAGENT_OPENCODE?.trim() || undefined),
      process.env,
      options.openCode?.resourceDir ?? fileURLToPath(new URL('../resources/opencode/', import.meta.url)),
    ),
    join(layout.files, 'runtime', 'opencode'),
    {
      read: sessionId => sessions.read(sessionId),
      requests: sessionId => sessions.requests.list(sessionId),
      request: requestId => sessions.requests.get(requestId),
      binding: sessionId => sessions.requests.binding(sessionId),
      bind: binding => sessions.requests.bind(binding),
      unbind: sessionId => sessions.requests.unbind(sessionId),
    },
    options.openCode,
  )
  await openCode.initialize()
  const runtime = createRequestRuntime({ sessions, providers, runtime: openCode })
  const research = new ResearchCoordinator(
    web.db,
    credentials,
    sessions,
    options.researchAccess ? options.researchAccess.key : process.env.TAVILY_API_KEY,
    new TavilyClient(options.researchAccess?.fetch),
  )
  const images = new WebImageResearch(
    research,
    commonsImages,
    new PublicImageReader(options.imageAccess?.fetch, options.imageAccess?.resolve),
  )
  return {
    providers,
    runtime,
    research,
    images,
    inputs: new AttachmentCoordinator(sessions, drafts, attachments),
    generationRuntime: options.generationRuntime ?? new GenerationWorkflow(runtime, sessions),
    settings: () => ({
      research: research.settings(),
      providers: providers.providerSettings(),
      persistentKeys: providers.persistentKeys,
      builtIns: providers.builtIns,
      runtime: openCode.availability(),
    }),
  }
}

function chatMarks(decks: DeckStore, drafts: MemoryDraftStore): ChatMarks {
  return {
    hasSlides: id => decks.snapshot(id).slides.some(slide => slide.revision > 0),
    hasDraft: id => drafts.get(id).trim() !== '' || drafts.snapshot(id).attachmentIds.length > 0,
  }
}

function createHostOptions(
  layout: StorageLayout,
  options: LocalWebOptions,
  storage: StorageLayer,
  runtime: RuntimeLayer,
  attachments: ManagedAttachments,
  drafts: MemoryDraftStore,
  assets: NonNullable<HostOptions['assets']>,
  changeFeed: ChangeFeed,
): StartHostOptions {
  const { sessions, web, decks, registry } = storage
  const briefs = new BriefCoordinator(decks, sessions)
  return {
    mapApplicationFailure: error => mapWorkspaceFailure(error) ?? mapChatFailure(error) ?? mapApplicationFailure(error),
    failureMessage: deckFailureMessage,
    confirmations: new ConfirmationCoordinator(decks, sessions, briefs, runtime.generationRuntime),
    briefs,
    decks,
    outlines: decks,
    assets,
    requests: {
      closingText: (sessionId, requestId, status) => generationReport(decks, sessionId, requestId, status),
      store: runtime.inputs.requestStore(),
      runtime: new DeckWorkflow(runtime.runtime, decks, sessions, briefs, runtime.generationRuntime, runtime.images),
      prepareTools: async (sessionId, attachmentIds, publicResearch) =>
        prepareSourceTools({
          sessionId,
          store: sessions,
          registry,
          dataRoot: layout.root,
          home: options.home ?? homedir(),
          attachments,
          research: await runtime.research.prepare(publicResearch === true),
          ...(attachmentIds === undefined ? {} : { attachmentIds }),
        }),
    },
    attachments: attachmentManagement(runtime.inputs),
    ...(options.port === undefined ? {} : { port: options.port }),
    readHistory: id => sessions.read(id),
    routes: [
      createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions))),
      createChatRoutes(createChatOperations(sessions, registry, web, chatMarks(decks, drafts)), selection),
    ],
    changes: { feed: changeFeed, hostTopics: [{ topic: 'workspaces', version: () => registry.version() }] },
    management: {
      ...sessionReadManagement(sessions, runtime.research),
      preferences: { get: async () => web.preferences(), save: async value => web.savePreferences(value) },
      settings: async () => runtime.settings(),
      saveProvider: (id, value) => runtime.providers.save(id, value),
      deleteProvider: id => runtime.providers.remove(id),
      catalog: id => runtime.providers.catalog(id),
      drafts: { get: id => runtime.inputs.draft(id), save: (id, value) => runtime.inputs.save(id, value) },
    },
  }
}

/**
 * Composition owns startup and cleanup: Application Storage, Workspace registry, chats, decks,
 * settings, the OpenCode runtime adapter, then the Host. No model runs at startup; a request starts one OpenCode run.
 */
export async function startLocalWeb(options: LocalWebOptions = {}) {
  const layout = await prepareStorage(options.dataDir ?? resolveStorageRoot())
  const commonsImages = new CommonsImages(options.imageAccess?.fetch)
  const renderer = artifactRenderer(join(layout.files, 'runtime', 'artifact-check'))
  const drafts = new MemoryDraftStore()
  const changeFeed = createChangeFeed()
  let opened: StorageLayer | undefined
  let runtime: RuntimeLayer | undefined
  let attachments: ManagedAttachments | undefined
  let host: Awaited<ReturnType<typeof startHost>> | undefined
  let closing: Promise<void> | undefined
  const closers: (() => Promise<void> | void)[] = [
    () => opened?.registry.close(),
    () => opened?.sessions.close(),
    () => opened?.web.close(),
    () => opened?.decks.close(),
    () => runtime?.providers.close(),
    () => runtime?.inputs.close(),
    () => runtime?.images.close(),
    () => commonsImages.close(),
    () => renderer.close(),
    () => host?.close(),
  ]
  try {
    opened = await openStorageLayer(layout, options, renderer, commonsImages, () => attachments, changeFeed)
    const storage = opened
    const credentials = options.credentials ?? defaultCredentialStore(layout.root)
    attachments = await ManagedAttachments.open(layout.files, storage.sessions.attachments, drafts)
    runtime = await createRuntimeLayer(layout, options, storage, commonsImages, attachments, drafts, credentials)
    const assets = await loadWebAssets(() => storage.web.preferences().theme)
    host = await startHost(
      createHostOptions(layout, options, storage, runtime, attachments, drafts, assets, changeFeed),
    )
    return {
      origin: host.origin,
      token: host.token,
      /** Application Storage root actually in use (canonical). */
      dataDir: layout.root,
      close(): Promise<void> {
        closing ??= closeResources(closers.toReversed())
        return closing
      },
    }
  } catch (error) {
    await closeResources(closers.toReversed())
    throw error
  }
}
