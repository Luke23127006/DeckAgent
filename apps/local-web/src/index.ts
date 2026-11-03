import { mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import type { ModelAdapter, ModelSelection, TurnResult, Message } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { startHost, HttpError } from '@deckagent/host-api'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { page, style, deckResizeStyle, composerStyle, presentationStyle, activityStyle, permissionStyle } from './ui-assets.ts'
import { WebState } from './web-state.ts'
import { ProviderStore } from './provider-settings.ts'
import { PermissionStore } from './permission-store.ts'
import { sampleAssets } from './sample-slides.ts'
import { DeckService } from '@deckagent/deck'
import type { ConfirmedDeckPlan } from '@deckagent/deck'
import { openWebRequest } from './web-request.ts'
import { outlineStyle } from './outline-style.ts'
import type { OpenCodeOptions } from './opencode/agent.ts'
import { MaterialStore } from './materials/store.ts'
import type { MaterialLimits } from '@deckagent/host-api'
import { ContextStore } from './context/store.ts'
import { ContextService } from './context/service.ts'
export { importLegacyProfile, LegacyImportError } from './legacy-import.ts'

export interface LocalWebOptions {
  /** Explicit trial bounds, not product defaults. Intake stays disabled when absent. */
  readonly materials?: MaterialLimits
  /** Experimental opt-in; custom runtime remains the default. */
  readonly openCode?: OpenCodeOptions
  /** Trusted test/manual plans only; no model-facing confirmation bypass. */
  readonly confirmedDecks?: readonly (ConfirmedDeckPlan & { readonly sessionId: string })[]
  readonly model?: ModelAdapter
  readonly selection?: ModelSelection
  readonly connections?: readonly ModelConnection[]
  /** Private Agent work base, never a user project folder. */
  readonly workspace?: string
  readonly dataDir?: string
  readonly port?: number
}

/** Composition owns Host -> Agent -> tools -> storage cleanup in that order. */
export async function startLocalWeb(options: LocalWebOptions) {
  const initial = options.selection ? { ...options.selection } : undefined
  const dataPath = resolve(options.dataDir ?? join(homedir(), '.deckagent'))
  const workPath = resolve(options.workspace ?? join(dataPath, 'work'))
  await mkdir(workPath, { recursive: true, mode: 0o700 })
  await mkdir(dataPath, { recursive: true, mode: 0o700 })
  const workspace = await realpath(workPath)
  const dataDir = await realpath(dataPath)
  const dataRelative = relative(workspace, dataDir)
  const outside = dataRelative === '..' || dataRelative.startsWith(`..${sep}`) || isAbsolute(dataRelative)
  if (!outside) throw new Error('Host data must be outside the Agent workspace')
  let sessions: SqliteSessionStore | undefined
  let web: WebState | undefined
  let providers: ProviderStore | undefined
  let decks: DeckService | undefined
  let materials: MaterialStore | undefined
  let contexts: ContextStore | undefined
  try {
    sessions = new SqliteSessionStore(join(dataDir, 'sessions.sqlite'))
    const store = sessions
    const presentation = new DeckService(join(dataDir, 'decks.sqlite'))
    decks = presentation
    for (const plan of options.confirmedDecks ?? []) {
      if (!(await store.getInfo(plan.sessionId))) {
        if (initial) await store.bind(plan.sessionId, initial)
        else await store.open(plan.sessionId)
      }
      presentation.confirm(plan.sessionId, plan)
    }
    const state: WebState = new WebState(join(dataDir, 'web.sqlite'), store, () => catalog.snapshot(), [dataDir, workspace])
    web = state
    const permissions = new PermissionStore(state.db)
    if (options.materials) materials = await MaterialStore.create(dataDir, options.materials)
    const materialStore = materials
    const requireChat = async (id: string) => { if (!(await store.getInfo(id))) throw new HttpError(404, 'SESSION_NOT_FOUND') }
    await state.reconcileWorkspaces()
    const catalog = new ProviderStore(state.db, options.model && initial ? { model: options.model, selection: initial } : undefined)
    providers = catalog
    await catalog.load(options.connections, initial)
    if (options.openCode) contexts = new ContextStore(join(dataDir, 'context.sqlite'))
    const contextStore = contexts
    const contextState = (id: string) => ({ outline: presentation.outlineSnapshot(id), deck: presentation.snapshot(id), materials: materialStore?.list(id).filter(item => item.sent) ?? [] })
    const contextService = options.openCode && contextStore ? new ContextService({ contexts: contextStore, sessions: store, catalog,
      ...(materialStore ? { materials: materialStore } : {}), openCode: { ...options.openCode, root: join(dataDir, 'opencode') },
      authoritative: contextState }) : undefined
    const assets: Record<string, { contentType: string; body: string }> = {
      ...sampleAssets,
      '/': { contentType: 'text/html; charset=utf-8', body: page },
      '/style.css': { contentType: 'text/css; charset=utf-8', body: style + outlineStyle + deckResizeStyle + composerStyle + presentationStyle + activityStyle + permissionStyle },
    }
    const clientDir = dirname(fileURLToPath(import.meta.resolve('@deckagent/browser-runtime')))
    for (const name of await readdir(clientDir)) {
      if (/^[\w-]+\.js$/.test(name))
        assets[`/client/${name}`] = {
          contentType: 'text/javascript; charset=utf-8',
          body: await readFile(join(clientDir, name), 'utf8'),
        }
    }
    const finalizers = new Map<string, (result: TurnResult) => Promise<void>>()
    const host = await startHost({
      ...(contextService ? { context: { usage: (id: string, draft: unknown) => contextService.usage(id, draft) } } : {}),
      materials: {
        async list(id) {
          await requireChat(id)
          const info = await store.getInfo(id), source = info?.workspaceId ? await state.workspaces.source(info.workspaceId) : undefined
          const items = await Promise.all((materialStore?.list(id) ?? []).map(async item => {
            if (item.kind !== 'reference' || !materialStore) return item
            try { await materialStore.validateReference(id, item.materialId, source); return item }
            catch { return { ...item, status: 'rejected' as const, reason: 'MATERIAL_REFERENCE_UNAVAILABLE' } }
          }))
          return { enabled: !!materialStore, ...(materialStore ? { limits: materialStore.limits } : {}), items }
        },
        async upload(id, name, bytes, signal) { await requireChat(id); if (!materialStore) throw new HttpError(409, 'MATERIALS_DISABLED'); return materialStore.upload(id, name, bytes, signal) },
        async remove(id, materialId) { await requireChat(id); if (!materialStore) throw new HttpError(409, 'MATERIALS_DISABLED'); materialStore.remove(id, materialId) },
        async reference(id, value) { await requireChat(id); if (!materialStore) throw new HttpError(409, 'MATERIALS_DISABLED'); const info = await store.getInfo(id); const source = info?.workspaceId ? await state.workspaces.source(info.workspaceId) : undefined; return materialStore.reference(id, value, source) },
      },
      decks: presentation,
      outlines: presentation,
      assets,
      ...(options.port === undefined ? {} : { port: options.port }),
      async finishRequest(_request, requestId, result) {
        const finalize = finalizers.get(requestId)
        try { await finalize?.(result) } finally { finalizers.delete(requestId) }
      },
      async openAgent(sessionId, requestId, request, requestApproval) {
        if (request.contextAction === 'compact') {
          if (!contextService) throw new HttpError(409, 'CONTEXT_UNAVAILABLE')
          const compact = await contextService.open(sessionId, requestId)
          finalizers.set(requestId, compact.finish)
          return compact.agent
        }
        if (!(await store.getInfo(sessionId)) && initial) { await store.bind(sessionId, initial); permissions.create(sessionId) }
        const info = await store.getInfo(sessionId)
        const materialSnapshot = materialStore?.capture(request, requestId, false) ?? []
        if (request.attachmentIds?.length && !materialStore) throw new HttpError(409, 'MATERIALS_DISABLED')
        const hasImages = materialSnapshot.some(info => info.mediaType.startsWith('image/'))
        const provider = catalog.snapshot().providers.find(provider => provider.id === info?.selection?.provider)
        const imageInput = !!provider?.modelMetadata?.find(model => model.model === info?.selection?.model)?.inputModalities?.includes('image')
        if (hasImages && (!options.openCode || !imageInput || provider?.protocol !== 'gemini')) throw new HttpError(409, 'MATERIAL_IMAGE_INPUT_UNVERIFIED')
        const images = hasImages && materialStore ? await materialStore.imageBytes(sessionId, materialSnapshot) : []
        const source = info?.workspaceId ? await state.workspaces.source(info.workspaceId) : undefined
        for (const id of request.referenceIds ?? []) await materialStore?.validateReference(sessionId, id, source)
        const privateRoot = join(workspace, createHash('sha256').update(sessionId).digest('hex'), requestId)
        await mkdir(privateRoot, { recursive: true, mode: 0o700 })
        const newIds = new Set([...(request.attachmentIds ?? []), ...(request.referenceIds ?? [])])
        const names = materialSnapshot.filter(info => newIds.has(info.materialId)).map(info => info.originalName)
        const materialRequest = names.length ? { ...request, input: request.input.trim() ? `${request.input}\n[Tài liệu: ${JSON.stringify(names)}]` : names.join(', ') } : request
        const agent = await openWebRequest({ request: materialRequest, requestId, workspace: privateRoot, ...source, store, presentation, state, catalog,
          ...(contextStore && info?.selection ? { projectContext: (history: readonly Message[]) => contextStore.project(sessionId, info.selection!, history) } : {}),
          ...(contextStore && info?.selection ? { observePrompt: (bytes: number) => contextStore.observePrompt(sessionId, info.selection!, contextState(sessionId), bytes) } : {}),
          ...(materialStore && materialSnapshot.length ? { materials: { snapshot: materialSnapshot, images, read: (id, signal, authorize, path, allowFolderListing) => materialStore.read(sessionId, requestId, id, signal, { source, blockedRoots: [dataDir, workspace], authorize, ...(path ? { path } : {}), ...(allowFolderListing ? { allowFolderListing: true } : {}) }) } } : {}),
          ...(options.openCode ? { openCode: { ...options.openCode, root: join(dataDir, 'opencode') } } : {}),
          permission: permissions.get(sessionId), requestApproval, blockedRoots: [dataDir, workspace] })
        try { materialStore?.capture(request, requestId) } catch (error) { await agent.dispose(); throw error }
        finalizers.set(requestId, result => agent.finish(result))
        return agent
      },
      requestState: async snapshot => state.requestState(snapshot),
      approvalAnswered: async (approval, decision) => permissions.answer(approval, decision),
      readHistory: id => store.read(id),
      management: {
        permissions: async id => { await requireChat(id); return permissions.get(id) },
        savePermission: async (id, value) => { await requireChat(id); return permissions.save(id, value) },
        revokeGrant: async (id, grantId) => { await requireChat(id); return permissions.revoke(id, grantId) },
        defaultPermission: async () => permissions.defaultPreset(),
        saveDefaultPermission: async value => permissions.setDefault(value),
        workspaces: () => state.workspaces.list(),
        addWorkspace: value => state.workspaces.add(value),
        removeWorkspace: id => state.removeWorkspace(id),
        repointWorkspace: (id, value) => state.workspaces.repoint(id, value),
        settings: async () => catalog.snapshot(),
        saveProvider: async (id, value) => { await catalog.save(id, value); await state.reconcileSelections(id) },
        deleteProvider: async id => { await catalog.remove(id); await state.reconcileSelections(id) },
        catalog: id => catalog.catalog(id),
        sessions: async () => (await state.list()).map(session => ({ ...session,
          hasSlides: presentation.snapshot(session.sessionId).slides.some(slide => slide.revision > 0),
        })), createSession: async value => { const session = await state.create(value); permissions.create(session.sessionId); return session },
        selectModel: (id, value) => state.select(id, value),
        activities: async id => state.activities(id),
        requests: async id => state.requests(id),
      },
    })
    let closing: Promise<void> | undefined
    return {
      origin: host.origin,
      token: host.token,
      close(): Promise<void> {
        closing ??= (async () => {
          try {
            await host.close()
          } finally {
            try {
              await catalog.close()
            } finally {
              try { presentation.close() } finally { try { contexts?.close(); await materialStore?.close(); state.close() } finally { store.close() } }
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
      try { decks?.close() } finally { try { contexts?.close(); await materials?.close(); web?.close() } finally { sessions?.close() } }
    }
    throw error
  }
}
