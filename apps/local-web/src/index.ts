import { mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { createHash } from 'node:crypto'
import type { ModelAdapter, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { startHost } from '@deckagent/host-api'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { page, style, deckResizeStyle, composerStyle, presentationStyle, activityStyle } from './ui-assets.ts'
import { WebState } from './web-state.ts'
import { ProviderStore } from './provider-settings.ts'
import { sampleAssets } from './sample-slides.ts'
import { DeckService } from '@deckagent/deck'
import type { ConfirmedDeckPlan } from '@deckagent/deck'
import { openWebRequest } from './web-request.ts'
import { outlineStyle } from './outline-style.ts'
export { importLegacyProfile, LegacyImportError } from './legacy-import.ts'

export interface LocalWebOptions {
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
    await state.reconcileWorkspaces()
    const catalog = new ProviderStore(state.db, options.model && initial ? { model: options.model, selection: initial } : undefined)
    providers = catalog
    await catalog.load(options.connections, initial)
    const assets: Record<string, { contentType: string; body: string }> = {
      ...sampleAssets,
      '/': { contentType: 'text/html; charset=utf-8', body: page },
      '/style.css': { contentType: 'text/css; charset=utf-8', body: style + outlineStyle + deckResizeStyle + composerStyle + presentationStyle + activityStyle },
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
      decks: presentation,
      outlines: presentation,
      assets,
      ...(options.port === undefined ? {} : { port: options.port }),
      async finishRequest(_request, requestId, result) {
        const finalize = finalizers.get(requestId)
        try { await finalize?.(result) } finally { finalizers.delete(requestId) }
      },
      async openAgent(sessionId, requestId, request) {
        if (!(await store.getInfo(sessionId)) && initial) await store.bind(sessionId, initial)
        const info = await store.getInfo(sessionId)
        const source = info?.workspaceId ? await state.workspaces.source(info.workspaceId) : undefined
        const privateRoot = join(workspace, createHash('sha256').update(sessionId).digest('hex'), requestId)
        await mkdir(privateRoot, { recursive: true, mode: 0o700 })
        const agent = await openWebRequest({ request, requestId, workspace: privateRoot, ...source, store, presentation, state, catalog })
        finalizers.set(requestId, result => agent.finish(result))
        return agent
      },
      requestState: async snapshot => state.requestState(snapshot),
      readHistory: id => store.read(id),
      management: {
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
        })), createSession: value => state.create(value),
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
              try { presentation.close() } finally { try { state.close() } finally { store.close() } }
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
      try { decks?.close() } finally { try { web?.close() } finally { sessions?.close() } }
    }
    throw error
  }
}
