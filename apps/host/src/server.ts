import type { ContractSyncVerified } from './contract-sync.ts'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DeckStore, deckFailureMessage, type ConfirmedDeckPlan } from '@deckagent/deck'
import { ChatDatabase, SettingsDatabase, SqliteRunStore, type ModelSelection } from './db/index.ts'
import { createChangeFeed, type ChangeFeed } from './http/change-feed.ts'
import type { HostOptions, HostRouteContext } from './http/http.types.ts'
import { startHost, type StartHostOptions } from './http/start-host.ts'
import { loadWebDistAssets } from './http/web-assets.ts'
import {
  AttachmentError,
  AttachmentFileStore,
  AttachmentService,
  MemoryDraftStore,
  SqliteAttachmentStore,
  createAttachmentRoutes,
  mapAttachmentError,
} from './modules/attachments/index.ts'
import {
  ChatRequestService,
  ChatService,
  SqliteChatStore,
  createChatRequestRoutes,
  createChatRoutes,
  createConversationContribution,
  mapChatError,
  type ChatMarks,
  type ChatStoreOptions,
} from './modules/chats/index.ts'
import {
  CommonsImages,
  DeckService,
  DeckWorkflowError,
  PublicImageReader,
  WebImageResearch,
  artifactRenderer,
  createDeckRoutes,
  createDeckStore,
  mapDeckError,
  type ArtifactRenderer,
  type GenerationRuntimeOverride,
  type ImageLookup,
} from './modules/deck/index.ts'
import {
  ProviderService,
  SqliteProviderStore,
  createProviderRoutes,
  listModels,
  mapProviderError,
  type ProviderConnection,
  type ProviderServiceOptions,
} from './modules/providers/index.ts'
import {
  ResearchService,
  SqliteResearchStore,
  TavilyClient,
  createResearchRoutes,
  mapResearchError,
} from './modules/research/index.ts'
import {
  SettingsService,
  SqliteSettingsStore,
  createSettingsRoutes,
  mapSettingsError,
} from './modules/settings/index.ts'
import {
  SqliteWorkspaceStore,
  WorkspaceService,
  createWorkspaceRoutes,
  mapWorkspaceError,
} from './modules/workspaces/index.ts'
import { RunController, type PreparationContext } from './runs/index.ts'
import { OpenCodeAgentRuntime, findExecutable, type OpenCodeOptions } from './runtimes/opencode/index.ts'
import {
  StorageError,
  defaultCredentialStore,
  prepareStorage,
  resolveStorageRoot,
  type CredentialStore,
  type StorageLayout,
} from './storage/index.ts'
import {
  AttachmentParser,
  attachmentLimits,
  createSourceToolsContribution,
  mapSourceToolFailure,
  prepareSourceTools,
} from './tools/index.ts'

export { StorageError, resolveStorageRoot } from './storage/index.ts'
export type { ProviderConnection } from './modules/providers/index.ts'

const contractSync: ContractSyncVerified = true

export interface LocalWebOptions {
  /** Controlled image transport/DNS seams for tests; production pins public DNS addresses. */
  readonly imageAccess?: { readonly fetch: typeof fetch; readonly resolve?: ImageLookup }
  /** Tests may replace generation; production uses the same isolated CLI with confirmed phase tools. */
  readonly generationRuntime?: GenerationRuntimeOverride
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
  readonly providerAccess?: Pick<ProviderServiceOptions, 'check' | 'catalog'>
  /** Controlled HTTP seam for research tests. Production always uses fixed Tavily endpoints. */
  readonly researchAccess?: { readonly fetch: typeof fetch; readonly key?: string }
}

/** Wires the shared ChatDatabase with chat, attachment and run stores for atomic admission and settlement. */
function openChatStorage(path: string, options?: ChatStoreOptions) {
  const db = new ChatDatabase(path)
  const chats = new SqliteChatStore(db, options)
  const attachments = new SqliteAttachmentStore(db)
  const runs = new SqliteRunStore(db, {
    beforeAdmit: input => {
      chats.requireSessionInTx(input.owner.id)
      const ready = attachments.validateReadyInTx(input.owner.id, input.attachmentIds ?? [])
      return chats.admitUserMessageInTx(input.owner.id, input.input, ready)
    },
    afterAdmit: (input, messageSequence) => {
      if (input.attachmentIds?.length)
        attachments.linkToRequestInTx(input.requestId, messageSequence, input.attachmentIds)
    },
    onSettle: (owner, status, text) => {
      chats.appendAssistantMessageInTx(owner.id, text, status !== 'completed')
    },
  })
  return { db, chats, attachments, runs, close: () => db.close() }
}

type ChatStorage = ReturnType<typeof openChatStorage>

interface StorageLayer {
  readonly registry: SqliteWorkspaceStore
  readonly sessions: ChatStorage
  readonly decks: DeckStore
  readonly settingsDb: SettingsDatabase
  readonly settingsStore: SqliteSettingsStore
}

interface RuntimeLayer {
  readonly chats: ChatService
  readonly providers: ProviderService
  readonly runtime: OpenCodeAgentRuntime
  readonly research: ResearchService
  readonly images: WebImageResearch
  readonly inputs: AttachmentService
  readonly settings: SettingsService
  readonly generationRuntime?: GenerationRuntimeOverride
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

async function openStorageLayer(
  layout: StorageLayout,
  options: LocalWebOptions,
  renderer: ArtifactRenderer,
  commonsImages: CommonsImages,
  getAttachments: () => AttachmentService | undefined,
  changeFeed: ChangeFeed,
): Promise<StorageLayer> {
  const initial = options.selection ? { ...options.selection } : undefined
  let registry: SqliteWorkspaceStore | undefined
  let sessions: ChatStorage | undefined
  let decks: DeckStore | undefined
  let settingsDb: SettingsDatabase | undefined

  try {
    try {
      registry = new SqliteWorkspaceStore({
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
    let settingsStore: SqliteSettingsStore
    try {
      sessions = openChatStorage(join(layout.databases, 'sessions.sqlite'), {
        onChatsChanged: version => changeFeed.publish({ topic: 'chats', key: 'host', version }),
      })
      const openedSessions = sessions
      decks = createDeckStore({
        databasePath: join(layout.databases, 'decks.sqlite'),
        artifactRoot: join(layout.files, 'decks'),
        renderer,
        commonsImages,
        publishChange: changeFeed.publish,
        preparedImage: (id, attachmentId, signal) => {
          const service = getAttachments()
          if (!service) throw new AttachmentError('ATTACHMENT_UNREADABLE', 'The selected image is unavailable')
          return service.preparedImage(id, attachmentId, signal)
        },
        activeRequest: (id, requestId) => {
          const request = openedSessions.runs.get(requestId)
          return (
            request?.owner.kind === 'chat' &&
            request.owner.id === id &&
            ['active', 'waiting_approval'].includes(request.status)
          )
        },
      })
      settingsDb = new SettingsDatabase(join(layout.databases, 'web.sqlite'))
      settingsStore = new SqliteSettingsStore(settingsDb.db, version =>
        changeFeed.publish({ topic: 'preferences', key: 'host', version }),
      )
    } catch {
      // A damaged or foreign file is kept unchanged; nothing is reset or recreated in its place.
      throw new StorageError('STORAGE_CORRUPT')
    }
    const store = sessions
    const presentation = decks
    // A request that was active when DeckAgent stopped did not finish; it is shown so and never started again (FR-019).
    store.runs.interruptActive()
    presentation.reconcileGenerations((id, requestId) => {
      const request = store.runs.get(requestId)
      return request?.owner.kind === 'chat' && request.owner.id === id
    })
    // A remove interrupted between the registry and the chats is completed here: no chat is lost or hidden.
    await store.chats.ungroupExcept(registry.activeIds())
    for (const plan of options.confirmedDecks ?? []) {
      if (!(await store.chats.getInfo(plan.sessionId))) {
        if (initial) await store.chats.bind(plan.sessionId, initial)
        else await store.chats.open(plan.sessionId)
      }
      presentation.confirm(plan.sessionId, plan)
    }
    return {
      registry,
      sessions: store,
      decks: presentation,
      settingsDb,
      settingsStore,
    }
  } catch (error) {
    try {
      await closeResources([
        () => settingsDb?.close(),
        () => decks?.close(),
        () => sessions?.close(),
        () => registry?.close(),
      ])
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
  attachments: AttachmentFileStore,
  drafts: MemoryDraftStore,
  credentials: CredentialStore,
  changeFeed: ChangeFeed,
): Promise<RuntimeLayer> {
  const { sessions, settingsDb, settingsStore, decks, registry } = storage
  const initial = options.selection ? { ...options.selection } : undefined
  const providers = new ProviderService(new SqliteProviderStore(settingsDb.db), credentials, {
    check:
      options.providerAccess?.check ??
      (async (endpoint, key) => {
        await listModels(endpoint, key, { pages: 1 })
      }),
    catalog:
      options.providerAccess?.catalog ??
      ((endpoint, key, signal) => listModels(endpoint, key, { signal, timeoutMs: 30_000 })),
    modelsRemoved: async (provider, models) => {
      await sessions.chats.clearSelections(provider, models)
    },
    onProvidersChanged: version => changeFeed.publish({ topic: 'providers', key: 'host', version }),
  })
  await providers.load(options.connections, initial)
  const openCode = new OpenCodeAgentRuntime(
    await findExecutable(
      options.openCode?.executable ?? (process.env.DECKAGENT_OPENCODE?.trim() || undefined),
      process.env,
      options.openCode?.resourceDir ?? fileURLToPath(new URL('../resources/opencode/', import.meta.url)),
    ),
    join(layout.files, 'runtime', 'opencode'),
    sessions.runs,
    options.openCode,
  )
  await openCode.availability()
  let research: ResearchService | undefined
  const settings = new SettingsService(settingsStore, {
    providers,
    readResearch: () => {
      if (!research) throw new Error('Research service not initialized')
      return research.settings()
    },
    runtimeAvailability: () => openCode.availability(),
  })
  const chats = new ChatService(sessions.chats, sessions.runs, registry, settings, chatMarks(decks, drafts))

  research = new ResearchService(
    new SqliteResearchStore(settingsDb.db),
    credentials,
    chats,
    sessions.runs,
    options.researchAccess ? options.researchAccess.key : process.env.TAVILY_API_KEY,
    new TavilyClient(options.researchAccess?.fetch),
    version => changeFeed.publish({ topic: 'preferences', key: 'host', version }),
  )

  const images = new WebImageResearch(
    research,
    commonsImages,
    new AttachmentParser(),
    new PublicImageReader(options.imageAccess?.fetch, options.imageAccess?.resolve),
  )
  return {
    chats,
    providers,
    runtime: openCode,
    research,
    images,
    inputs: new AttachmentService(
      chats,
      sessions.attachments,
      drafts,
      attachments,
      new AttachmentParser(),
      attachmentLimits,
    ),
    settings,
    ...(options.generationRuntime ? { generationRuntime: options.generationRuntime } : {}),
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
  attachments: AttachmentFileStore,
  assets: NonNullable<HostOptions['assets']>,
  changeFeed: ChangeFeed,
): StartHostOptions {
  if (!contractSync) throw new Error('Contract sync failed')
  const { sessions, decks, registry } = storage
  const chats = runtime.chats
  const sourceOptions = {
    chats,
    attachmentRecords: sessions.attachments,
    runs: sessions.runs,
    registry,
    dataRoot: layout.root,
    home: options.home ?? homedir(),
    attachments,
  }
  const sourceToolsContribution = {
    name: 'source-tools',
    async contribute(context: PreparationContext) {
      const research = await runtime.research.prepare(context.grants.publicResearch)
      return createSourceToolsContribution({ ...sourceOptions, research }).contribute(context)
    },
  }
  const overrideSelections = new Set<string>()
  const runs = new RunController({
    store: sessions.runs,
    admit: (input, persist) => runtime.inputs.admitDraft({ ...input, sessionId: input.owner.id }, persist),
    runtime: runtime.runtime,
    providers: {
      resolve: async selected => {
        if (
          runtime.generationRuntime &&
          overrideSelections.has(JSON.stringify(selected)) &&
          !runtime.providers.selectable(selected)
        )
          return { ...selected, protocol: 'chat-completions', baseUrl: 'http://127.0.0.1' }
        return runtime.providers.runSettings(selected)
      },
    },
    contributions: [createConversationContribution(id => sessions.chats.read(id)), sourceToolsContribution],
    hasTools: true,
  })
  let requests: ChatRequestService | undefined
  const deck = new DeckService({
    decks,
    chats,
    attachments: runtime.inputs,
    runs: sessions.runs,
    runStarter: runs,
    imageResearch: runtime.images,
    sourceTools: {
      prepare: async (sessionId, sourceKinds, publicResearch) =>
        prepareSourceTools({
          ...sourceOptions,
          sessionId,
          sourceKinds,
          research: await runtime.research.prepare(publicResearch),
        }),
    },
    readSelection: sessionId => {
      if (!requests) throw new DeckWorkflowError('CONFIRMATION_UNAVAILABLE')
      return requests.readSelection(sessionId)
    },
    runtimeAvailability: () => runtime.runtime.availability(),
    preflightResearch: async publicResearch => {
      await runtime.research.prepare(publicResearch)
    },
    onOverrideSelection: selection => {
      overrideSelections.add(JSON.stringify(selection))
    },
    ...(runtime.generationRuntime ? { generationRuntime: runtime.generationRuntime } : {}),
  })
  requests = new ChatRequestService({
    chats: sessions.chats,
    providers: runtime.providers,
    runs,
    preflightResearch: async selected => {
      await runtime.research.prepare(selected)
    },
    deckPlanner: { prepare: (request, selected) => deck.prepareRun(request, selected) },
  })

  return {
    mapApplicationFailure: error =>
      mapWorkspaceError(error) ??
      mapChatError(error) ??
      mapProviderError(error) ??
      mapAttachmentError(error) ??
      mapResearchError(error) ??
      mapDeckError(error) ??
      mapSourceToolFailure(error) ??
      mapSettingsError(error),
    failureMessage: deckFailureMessage,
    assets,
    spaFallback: true,
    onClose: () => runs.close(),
    ...(options.port === undefined ? {} : { port: options.port }),
    routes: [
      createWorkspaceRoutes(new WorkspaceService(registry, chats)),
      createChatRoutes(chats),
      createProviderRoutes(runtime.providers),
      createAttachmentRoutes(runtime.inputs),
      createResearchRoutes(runtime.research),
      createSettingsRoutes(runtime.settings),
      (context: HostRouteContext) => createDeckRoutes(deck, context),
      (context: HostRouteContext) => createChatRequestRoutes(requests, runtime.inputs.maxFiles, context.streams),
    ],
    changes: {
      feed: changeFeed,
      hostTopics: [
        { topic: 'workspaces', version: () => registry.version() },
        { topic: 'chats', version: () => sessions.chats.chatsVersion() },
        { topic: 'providers', version: () => runtime.providers.version() },
        { topic: 'preferences', version: () => runtime.settings.preferencesVersion() },
      ],
      sessionExists: async id => !!(await sessions.chats.getInfo(id)),
      sessionTopics: [
        { topic: 'draft', version: id => runtime.inputs.draftVersion(id) },
        { topic: 'brief', version: id => storage.decks.briefHeadVersion(id) },
        { topic: 'outline', version: id => storage.decks.outlineHeadVersion(id) },
        { topic: 'deck', version: id => storage.decks.deckHeadVersion(id) },
      ],
    },
  }
}

/**
 * Composition owns startup and cleanup: Application Storage, Workspace registry, chats, decks,
 * settings, the OpenCode runtime adapter, then the Host. No model runs at startup; a request starts one OpenCode run.
 */
export async function startLocalWeb(options: LocalWebOptions = {}) {
  const layout = await prepareStorage(options.dataDir ?? resolveStorageRoot())
  const commonsImages = new CommonsImages(new AttachmentParser(), options.imageAccess?.fetch)
  const renderer = artifactRenderer(join(layout.files, 'runtime', 'artifact-check'))
  const changeFeed = createChangeFeed()
  const drafts = new MemoryDraftStore((key, version) => changeFeed.publish({ topic: 'draft', key, version }))
  let opened: StorageLayer | undefined
  let runtime: RuntimeLayer | undefined
  let attachments: AttachmentFileStore | undefined
  let host: Awaited<ReturnType<typeof startHost>> | undefined
  let closing: Promise<void> | undefined
  const closers: (() => Promise<void> | void)[] = [
    () => opened?.registry.close(),
    () => opened?.sessions.close(),
    () => opened?.settingsDb.close(),
    () => opened?.decks.close(),
    () => runtime?.providers.close(),
    () => runtime?.inputs.close(),
    () => runtime?.images.close(),
    () => commonsImages.close(),
    () => renderer.close(),
    () => host?.close(),
  ]

  try {
    opened = await openStorageLayer(layout, options, renderer, commonsImages, () => runtime?.inputs, changeFeed)
    const storage = opened
    const credentials = options.credentials ?? defaultCredentialStore(layout.root)
    attachments = await AttachmentFileStore.open(layout.files, storage.sessions.attachments, drafts)
    runtime = await createRuntimeLayer(
      layout,
      options,
      storage,
      commonsImages,
      attachments,
      drafts,
      credentials,
      changeFeed,
    )
    const assets = await loadWebDistAssets(fileURLToPath(new URL('../../web/dist', import.meta.url)), () =>
      storage.settingsStore.preferences(),
    )
    host = await startHost(createHostOptions(layout, options, storage, runtime, attachments, assets, changeFeed))
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
