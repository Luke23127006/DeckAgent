import type { ContractSyncVerified } from './contract-sync.ts'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AttachmentParser, attachmentLimits } from './tools/index.ts'
import type { HostOptions, HostRouteContext } from './http/contracts.ts'
import { createChangeFeed, type ChangeFeed } from './http/change-feed.ts'
import { startHost, type StartHostOptions } from './http/start-host.ts'
import type { WebSettings } from '@deckagent/host-contracts'
import { SessionDatabase, SessionError, SqliteRunStore, mapSessionFailure, type ModelSelection } from './db/index.ts'
import { MemoryDraftStore } from './modules/attachments/index.ts'
import {
  WorkspaceRegistry,
  createWorkspaceOperations,
  createWorkspaceRoutes,
  mapWorkspaceError,
} from './modules/workspaces/index.ts'
import { DeckStore, deckFailureMessage, type ConfirmedDeckPlan } from '@deckagent/deck'
import { HtmlFormatAdapter, validateLegacySlideHtml } from '@deckagent/html-format'
import { loadWebDistAssets } from './http/web-assets.ts'
import { WebState, mapWebStateFailure } from './web-state.ts'
import {
  ChatRequestService,
  ChatService,
  SqliteChatStore,
  createChatRequestRoutes,
  createConversationContribution,
  createChatRoutes,
  mapChatError,
  toChatRequest,
  type ChatMarks,
  type ChatStoreOptions,
} from './modules/chats/index.ts'
import { RunController } from './runs/lifecycle/index.ts'
import { RunFailure } from './runs/ports.ts'
import type { RunStore } from './runs/ports.ts'
import {
  ProviderService,
  SqliteProviderStore,
  createProviderRoutes,
  listModels,
  mapProviderError,
  type ProviderServiceOptions,
  type ProviderConnection,
} from './modules/providers/index.ts'
import { defaultCredentialStore, type CredentialStore } from './credential-store.ts'
import { OpenCodeAgentRuntime, findExecutable, type OpenCodeOptions } from './runtimes/opencode/index.ts'
import { StorageError, prepareStorage, resolveStorageRoot, type StorageLayout } from './storage-root.ts'
import {
  AttachmentService,
  AttachmentFileStore,
  SqliteAttachmentStore,
  createAttachmentRoutes,
  mapAttachmentError,
} from './modules/attachments/index.ts'
import { prepareSourceTools, createSourceToolsContribution, mapSourceToolFailure } from './tools/index.ts'
import {
  ResearchService,
  SqliteResearchStore,
  TavilyClient,
  createResearchRoutes,
  mapResearchError,
} from './modules/research/index.ts'
import { createSettingsRoutes } from './settings-routes.ts'
import {
  BriefCoordinator,
  DeckWorkflowFailure,
  createDeckOperations,
  createDeckRoutes,
  ConfirmationCoordinator,
  createDeckRunPlan,
  createGenerationRunPlan,
  WebImageResearch,
  CommonsImages,
  PublicImageReader,
  artifactRenderer,
  mapDeckFailure,
  type ImageLookup,
  type ArtifactRenderer,
  type GenerationRuntimeOverride,
} from './modules/deck/index.ts'

export { StorageError, resolveStorageRoot } from './storage-root.ts'
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

/** Composes the shared SessionDatabase, module stores and run store with atomic admission and settlement hooks. */
export function openSessionStorage(path: string, options?: ChatStoreOptions) {
  const db = new SessionDatabase(path)
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

type SessionStorage = ReturnType<typeof openSessionStorage>

interface StorageLayer {
  readonly registry: WorkspaceRegistry
  readonly sessions: SessionStorage
  readonly decks: DeckStore
  readonly web: WebState
  bindSelectability(isSelectable: (value: ModelSelection) => boolean): void
}

interface RuntimeLayer {
  readonly chats: ChatService
  readonly providers: ProviderService
  readonly runtime: OpenCodeAgentRuntime
  readonly research: ResearchService
  readonly images: WebImageResearch
  readonly inputs: AttachmentService
  readonly generationRuntime?: GenerationRuntimeOverride
  readonly settings: () => Promise<WebSettings>
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

function createPreparedImageReader(sessions: SessionStorage, getAttachments: () => AttachmentFileStore | undefined) {
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
  sessions: SessionStorage,
  renderer: ArtifactRenderer,
  commonsImages: CommonsImages,
  getAttachments: () => AttachmentFileStore | undefined,
  changeFeed: ChangeFeed,
): DeckStore {
  return new DeckStore(join(layout.databases, 'decks.sqlite'), {
    formats: [new HtmlFormatAdapter()],
    onDeckChanged: (key, version) => changeFeed.publish({ topic: 'deck', key, version }),
    onBriefChanged: (key, version) => changeFeed.publish({ topic: 'brief', key, version }),
    onOutlineChanged: (key, version) => changeFeed.publish({ topic: 'outline', key, version }),
    legacyHtmlPolicy: validateLegacySlideHtml,
    researchImage: (_id, query, signal) => commonsImages.find(query, signal),
    artifactRoot: join(layout.files, 'decks'),
    renderCheck: (html, requiredText, signal) => renderer.render(html, requiredText, signal),
    preparedImage: createPreparedImageReader(sessions, getAttachments),
    activeRequest: (id, requestId) => {
      const request = sessions.runs.get(requestId)
      return (
        request?.owner.kind === 'chat' &&
        request.owner.id === id &&
        ['active', 'waiting_approval'].includes(request.status)
      )
    },
  })
}

async function openStorageLayer(
  layout: StorageLayout,
  options: LocalWebOptions,
  renderer: ArtifactRenderer,
  commonsImages: CommonsImages,
  getAttachments: () => AttachmentFileStore | undefined,
  changeFeed: ChangeFeed,
): Promise<StorageLayer> {
  const initial = options.selection ? { ...options.selection } : undefined
  let isSelectable: (value: ModelSelection) => boolean = () => false
  let registry: WorkspaceRegistry | undefined
  let sessions: SessionStorage | undefined
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
      sessions = openSessionStorage(join(layout.databases, 'sessions.sqlite'), {
        onChatsChanged: version => changeFeed.publish({ topic: 'chats', key: 'host', version }),
      })
      decks = createDeckStore(layout, sessions, renderer, commonsImages, getAttachments, changeFeed)
      web = new WebState(
        join(layout.databases, 'web.sqlite'),
        value => isSelectable(value),
        version => changeFeed.publish({ topic: 'preferences', key: 'host', version }),
      )
    } catch {
      // A damaged or foreign file is kept unchanged; nothing is reset or recreated in its place.
      throw new StorageError('STORAGE_CORRUPT')
    }
    const store = sessions
    const presentation = decks
    const state = web
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
  attachments: AttachmentFileStore,
  drafts: MemoryDraftStore,
  credentials: CredentialStore,
  changeFeed: ChangeFeed,
): Promise<RuntimeLayer> {
  const { sessions, web, decks, registry } = storage
  const chats = new ChatService(sessions.chats, sessions.runs, registry, web, chatMarks(decks, drafts))
  const initial = options.selection ? { ...options.selection } : undefined
  const providers = new ProviderService(new SqliteProviderStore(web.db), credentials, {
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
  storage.bindSelectability(value => providers.selectable(value))
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
  const research = new ResearchService(
    new SqliteResearchStore(web.db),
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
    ...(options.generationRuntime ? { generationRuntime: options.generationRuntime } : {}),
    settings: async () => {
      const availability = await openCode.availability()
      return {
        research: research.settings(),
        providers: providers.providerSettings(),
        providersVersion: providers.version(),
        preferencesVersion: web.preferencesVersion(),
        persistentKeys: providers.persistentKeys,
        builtIns: providers.builtIns,
        runtime: availability.available ? { available: true } : { available: false, reason: availability.code },
      }
    },
  }
}

function chatMarks(decks: DeckStore, drafts: MemoryDraftStore): ChatMarks {
  return {
    hasSlides: id => decks.snapshot(id).slides.some(slide => slide.revision > 0),
    hasDraft: id => drafts.get(id).trim() !== '' || drafts.snapshot(id).attachmentIds.length > 0,
  }
}

function mapRunFailure(error: unknown) {
  if (!(error instanceof RunFailure)) return undefined
  const statuses: Readonly<Record<string, number>> = {
    HOST_CLOSED: 503,
    HOST_BUSY: 429,
    RUNTIME_UNAVAILABLE: 503,
    RUNTIME_VERSION_UNSUPPORTED: 503,
    REQUEST_NOT_FOUND: 404,
    APPROVAL_NOT_FOUND: 404,
    SESSION_NOT_FOUND: 404,
    RUN_OWNER_BUSY: 409,
    SESSION_BUSY: 409,
    GENERATION_LINK_CONFLICT: 409,
    APPROVAL_CONFLICT: 409,
    REQUEST_CLOSED: 409,
    DRAFT_CONFLICT: 409,
    ATTACHMENT_REJECTED: 409,
    ATTACHMENT_NOT_READY: 409,
    ATTACHMENT_COUNT_EXCEEDED: 413,
    REQUEST_EMPTY: 400,
    REQUEST_NOT_SAVED: 500,
    GENERATION_LINK_FAILED: 500,
  }
  return { status: statuses[error.code] ?? 500, code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
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
  const { sessions, web, decks, registry } = storage
  const chats = runtime.chats
  const chatSessions = {
    getInfo: (id: string) => sessions.chats.getInfo(id),
    read: (id: string) => sessions.chats.read(id),
    attachments: sessions.attachments,
    requests: {
      activeFor: (id: string) => sessions.runs.activeFor({ kind: 'chat', id }),
      get: (requestId: string) => {
        const record = sessions.runs.get(requestId)
        return record ? toChatRequest(record) : undefined
      },
      text: (requestId: string) => sessions.runs.text(requestId),
      sourceCatalogue: (id: string) => sessions.runs.sourceCatalogue(id),
      researchSources: (id: string) => sessions.runs.researchSources(id),
      recordSourceRead: (requestId: string, value: Parameters<SqliteRunStore['recordSourceRead']>[1]) =>
        sessions.runs.recordSourceRead(requestId, value),
    },
  }
  const briefs = new BriefCoordinator(decks, chatSessions)
  const runStore: RunStore = {
    approvals: sessions.runs.approvals,
    admit: input => {
      try {
        return runtime.inputs.admitDraft({ ...input, sessionId: input.owner.id }, admitted =>
          sessions.runs.admit({ ...input, ...admitted }),
        )
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? error.code : undefined
        if (
          typeof code === 'string' &&
          [
            'RUN_OWNER_BUSY',
            'REQUEST_ACTIVE',
            'SESSION_NOT_FOUND',
            'DRAFT_CONFLICT',
            'ATTACHMENT_COUNT_EXCEEDED',
            'ATTACHMENT_REJECTED',
            'ATTACHMENT_NOT_READY',
            'REQUEST_EMPTY',
          ].includes(code)
        )
          throw error
        throw new RunFailure('REQUEST_NOT_SAVED')
      }
    },
    append: (id, event) => sessions.runs.append(id, event),
    finish: (id, status, code) => sessions.runs.finish(id, status, code),
    get: id => sessions.runs.get(id),
    events: (id, after) => sessions.runs.events(id, after),
    text: id => sessions.runs.text(id),
    activeFor: owner => sessions.runs.activeFor(owner),
  }
  const sourceOptions = {
    store: chatSessions,
    registry,
    dataRoot: layout.root,
    home: options.home ?? homedir(),
    attachments,
  }
  const sourceToolsContribution = {
    name: 'source-tools',
    async contribute(context: import('./runs/ports.ts').PreparationContext) {
      const research = await runtime.research.prepare(context.grants.publicResearch)
      return createSourceToolsContribution({ ...sourceOptions, research }).contribute(context)
    },
  }
  const overrideSelections = new Set<string>()
  const runs = new RunController({
    store: runStore,
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
  const generationDependencies = {
    decks,
    sessions: chatSessions,
    sourceTools: {
      prepare: async (
        sessionId: string,
        sourceKinds: readonly import('./runs/ports.ts').SourceKind[],
        publicResearch: boolean,
      ) =>
        prepareSourceTools({
          ...sourceOptions,
          sessionId,
          sourceKinds,
          research: await runtime.research.prepare(publicResearch),
        }),
    },
    ...(runtime.generationRuntime ? { generationRuntime: runtime.generationRuntime } : {}),
  }
  const requests = new ChatRequestService({
    chats: sessions.chats,
    providers: runtime.providers,
    runs,
    preflightResearch: async selected => {
      await runtime.research.prepare(selected)
    },
    deckPlanner: {
      prepare: async (request, selected) => {
        if (request.continueDeck) {
          const generation = decks.generation(request.sessionId)
          if (!generation || generation.state !== 'incomplete') throw new DeckWorkflowFailure('GENERATION_INCOMPLETE')
          const prepared = await createGenerationRunPlan(generationDependencies, {
            request,
            selection: selected,
            intentId: generation.receipt.intentId,
            requestId: `req-${randomUUID()}`,
            continuation: true,
          })
          return { plan: prepared.plan, ...(prepared.runtime ? { options: { runtime: prepared.runtime } } : {}) }
        }
        return {
          plan: await createDeckRunPlan(
            { decks, sessions: chatSessions, briefs, imageResearch: runtime.images },
            request,
            selected,
          ),
        }
      },
    },
  })
  const prepareGeneration = async (request: import('@deckagent/host-contracts').AgentRequest) => {
    if (runtime.generationRuntime) {
      await runtime.research.prepare(request.publicResearch === true)
      const prepared = await runtime.generationRuntime.prepare(request)
      overrideSelections.add(JSON.stringify(prepared.selection))
      return { selection: prepared.selection, override: prepared }
    }
    const selected = await requests.readSelection(request.sessionId)
    const availability = await runtime.runtime.availability()
    if (!availability.available) throw new RunFailure(availability.code, availability.detail)
    await runtime.research.prepare(request.publicResearch === true)
    return { selection: selected }
  }
  const deckOps = createDeckOperations(
    decks,
    briefs,
    new ConfirmationCoordinator(decks, chatSessions, briefs, runs, generationDependencies, prepareGeneration),
  )

  return {
    mapApplicationFailure: error =>
      mapRunFailure(error) ??
      mapWorkspaceError(error) ??
      mapChatError(error) ??
      mapProviderError(error) ??
      mapAttachmentError(error) ??
      mapResearchError(error) ??
      mapDeckFailure(error) ??
      mapSourceToolFailure(error) ??
      mapWebStateFailure(error) ??
      mapSessionFailure(error),
    failureMessage: deckFailureMessage,
    assets,
    spaFallback: true,
    onClose: () => runs.close(),
    ...(options.port === undefined ? {} : { port: options.port }),
    routes: [
      createWorkspaceRoutes(createWorkspaceOperations(registry, chats)),
      createChatRoutes(chats),
      createProviderRoutes(runtime.providers),
      createAttachmentRoutes(runtime.inputs),
      createResearchRoutes(runtime.research),
      createSettingsRoutes({
        settings: async () => runtime.settings(),
        preferences: {
          get: async () => web.preferences(),
          save: async (theme, expectedVersion) => web.savePreferences(theme, expectedVersion),
        },
      }),
      (context: HostRouteContext) => createDeckRoutes(deckOps, context),
      (context: HostRouteContext) => createChatRequestRoutes(requests, runtime.inputs.maxFiles, context.streams),
    ],
    changes: {
      feed: changeFeed,
      hostTopics: [
        { topic: 'workspaces', version: () => registry.version() },
        { topic: 'chats', version: () => sessions.chats.chatsVersion() },
        { topic: 'providers', version: () => runtime.providers.version() },
        { topic: 'preferences', version: () => web.preferencesVersion() },
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
    const assets = await loadWebDistAssets(
      fileURLToPath(new URL('../../web/dist', import.meta.url)),
      () => storage.web.preferences().theme,
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
