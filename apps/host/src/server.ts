import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AttachmentParser, attachmentLimits } from './tools/index.ts'
import type { HostOptions, HostRouteContext } from '@deckagent/host-api'
import { createChangeFeed, type ChangeFeed } from './http/change-feed.ts'
import { startHost, type StartHostOptions } from './http/start-host.ts'
import type { WebSettings } from '@deckagent/host-contracts'
import { SessionError, SqliteSessionStore, type ModelSelection } from '@deckagent/session-persistence'
import { MemoryDraftStore } from './modules/attachments/index.ts'
import {
  WorkspaceRegistry,
  createWorkspaceOperations,
  createWorkspaceRoutes,
  mapWorkspaceFailure,
} from './modules/workspaces/index.ts'
import { DeckStore, deckFailureMessage, type ConfirmedDeckPlan } from '@deckagent/deck'
import { HtmlFormatAdapter, validateLegacySlideHtml } from '@deckagent/html-format'
import { loadWebAssets } from '@deckagent/local-web'
import { WebState, selection, mapWebStateFailure } from './web-state.ts'
import {
  createChatOperations,
  createConversationContribution,
  createChatRequestOperations,
  createRequestRoutes,
  readChatSelection,
  createChatRoutes,
  createWorkspaceChats,
  mapChatFailure,
  type ChatMarks,
} from './modules/chats/index.ts'
import { RunController } from './runs/lifecycle/index.ts'
import { RunFailure } from './runs/ports.ts'
import type { RunRecord, RunStore } from './runs/ports.ts'
import {
  ProviderConfigurations,
  SqliteProviderStore,
  createProviderRoutes,
  listModels,
  mapProviderFailure,
  type ProviderConfigurationsOptions,
  type ProviderConnection,
} from './modules/providers/index.ts'
import { defaultCredentialStore, type CredentialStore } from './credential-store.ts'
import { OpenCodeAgentRuntime, findExecutable, type OpenCodeOptions } from './runtimes/opencode/index.ts'
import { StorageError, prepareStorage, resolveStorageRoot, type StorageLayout } from './storage-root.ts'
import {
  AttachmentCoordinator,
  ManagedAttachments,
  createAttachmentRoutes,
  mapAttachmentFailure,
} from './modules/attachments/index.ts'
import { prepareSourceTools, createSourceToolsContribution, mapSourceToolFailure } from './tools/index.ts'
import {
  ResearchCoordinator,
  SqliteResearchStore,
  TavilyClient,
  createResearchRoutes,
  mapResearchFailure,
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
  readonly providerAccess?: Pick<ProviderConfigurationsOptions, 'check' | 'catalog'>
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
  readonly providers: ProviderConfigurations
  readonly runtime: OpenCodeAgentRuntime
  readonly research: ResearchCoordinator
  readonly images: WebImageResearch
  readonly inputs: AttachmentCoordinator
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
      sessions = new SqliteSessionStore(join(layout.databases, 'sessions.sqlite'), {
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
  changeFeed: ChangeFeed,
): Promise<RuntimeLayer> {
  const { sessions, web } = storage
  const initial = options.selection ? { ...options.selection } : undefined
  const providers = new ProviderConfigurations(new SqliteProviderStore(web.db), credentials, {
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
    {
      binding: ownerKey => {
        const binding = sessions.requests.binding(ownerKey.slice(5))
        if (!binding) return undefined
        const { sessionId: _sessionId, ...fields } = binding
        return { ...fields, ownerKey }
      },
      bind: binding => {
        const { ownerKey, ...fields } = binding
        sessions.requests.bind({ ...fields, sessionId: ownerKey.slice(5) })
      },
      unbind: ownerKey => sessions.requests.unbind(ownerKey.slice(5)),
      lastCompletedRequestId: (ownerKey, currentRequestId) =>
        sessions.requests
          .list(ownerKey.slice(5))
          .filter(item => item.requestId !== currentRequestId)
          .at(-1)?.requestId,
    },
    options.openCode,
  )
  await openCode.availability()
  const research = new ResearchCoordinator(
    new SqliteResearchStore(web.db),
    credentials,
    sessions,
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
    providers,
    runtime: openCode,
    research,
    images,
    inputs: new AttachmentCoordinator(sessions, drafts, attachments, new AttachmentParser(), attachmentLimits),
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
  attachments: ManagedAttachments,
  drafts: MemoryDraftStore,
  assets: NonNullable<HostOptions['assets']>,
  changeFeed: ChangeFeed,
): StartHostOptions {
  const { sessions, web, decks, registry } = storage
  const briefs = new BriefCoordinator(decks, sessions)
  const projectRecord = (record: ReturnType<typeof sessions.requests.get>): RunRecord | undefined => {
    if (!record) return undefined
    const { sessionId, ...fields } = record
    return { ...fields, owner: { kind: 'chat', id: sessionId } }
  }
  const runStore: RunStore = {
    approvals: sessions.requests.approvals,
    admit: input => {
      const { owner, ...fields } = input
      try {
        const saved = runtime.inputs.admitDraft({ ...fields, sessionId: owner.id }, admitted =>
          sessions.requests.admit(admitted),
        )
        return { ...saved, owner }
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? error.code : undefined
        if (
          typeof code === 'string' &&
          [
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
    append: (id, event) => sessions.requests.append(id, event),
    finish: (id, status, code) => sessions.requests.finish(id, status, code),
    get: id => projectRecord(sessions.requests.get(id)),
    events: (id, after) => sessions.requests.events(id, after),
    text: id => sessions.requests.text(id),
    activeFor: owner => sessions.requests.activeFor(owner.id),
  }
  const sourceOptions = {
    store: sessions,
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
    contributions: [createConversationContribution(id => sessions.read(id)), sourceToolsContribution],
    hasTools: true,
  })
  const generationDependencies = {
    decks,
    sessions,
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
  const prepareGeneration = async (request: import('@deckagent/host-contracts').AgentRequest) => {
    if (runtime.generationRuntime) {
      await runtime.research.prepare(request.publicResearch === true)
      const prepared = await runtime.generationRuntime.prepare(request)
      overrideSelections.add(JSON.stringify(prepared.selection))
      return { selection: prepared.selection, override: prepared }
    }
    const selected = await readChatSelection({ sessions, providers: runtime.providers }, request.sessionId)
    const availability = await runtime.runtime.availability()
    if (!availability.available) throw new RunFailure(availability.code, availability.detail)
    await runtime.research.prepare(request.publicResearch === true)
    return { selection: selected }
  }
  const requests = createChatRequestOperations({
    sessions,
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
          plan: await createDeckRunPlan({ decks, sessions, briefs, imageResearch: runtime.images }, request, selected),
        }
      },
    },
  })
  const deckOps = createDeckOperations(
    decks,
    briefs,
    new ConfirmationCoordinator(decks, sessions, briefs, runs, generationDependencies, prepareGeneration),
  )

  return {
    mapApplicationFailure: error =>
      mapRunFailure(error) ??
      mapWorkspaceFailure(error) ??
      mapChatFailure(error) ??
      mapProviderFailure(error) ??
      mapAttachmentFailure(error) ??
      mapResearchFailure(error) ??
      mapDeckFailure(error) ??
      mapSourceToolFailure(error) ??
      mapWebStateFailure(error) ??
      (error instanceof SessionError
        ? error.code === 'SESSION_NOT_FOUND'
          ? { status: 404, code: 'SESSION_NOT_FOUND' }
          : error.code === 'SESSION_CORRUPT'
            ? { status: 409, code: 'CHAT_UNREADABLE' }
            : error.code === 'DRAFT_TOO_LARGE'
              ? { status: 413, code: 'DRAFT_TOO_LARGE' }
              : undefined
        : undefined),
    failureMessage: deckFailureMessage,
    assets,
    onClose: () => runs.close(),
    omitLegacyRoutes: true,
    maxAttachments: runtime.inputs.maxFiles,
    ...(options.port === undefined ? {} : { port: options.port }),
    readHistory: id => sessions.read(id),
    routes: [
      createWorkspaceRoutes(createWorkspaceOperations(registry, createWorkspaceChats(sessions))),
      createChatRoutes(createChatOperations(sessions, registry, web, chatMarks(decks, drafts)), selection),
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
      (context: HostRouteContext) => createRequestRoutes(requests, runtime.inputs.maxFiles, context.streams),
    ],
    changes: {
      feed: changeFeed,
      hostTopics: [
        { topic: 'workspaces', version: () => registry.version() },
        { topic: 'chats', version: () => sessions.chatsVersion() },
        { topic: 'providers', version: () => runtime.providers.version() },
        { topic: 'preferences', version: () => web.preferencesVersion() },
      ],
      sessionExists: async id => !!(await sessions.getInfo(id)),
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
