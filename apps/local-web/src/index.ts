import { mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { RuntimeError, ToolRegistry, runtimePlugin } from '@deckagent/agent-runtime'
import type { ModelAdapter, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { registerFileTools } from '@deckagent/file-tools'
import { HttpError, startHost } from '@deckagent/host-api'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { page, style } from './ui-assets.ts'
import { WebState } from './web-state.ts'
import { ProviderStore } from './provider-settings.ts'
import { sampleAssets } from './sample-slides.ts'
import { DeckService } from '@deckagent/deck'
import type { ConfirmedDeckPlan } from '@deckagent/deck'
import { registerPublishSlide } from '@deckagent/presentation-tools'

export interface LocalWebOptions {
  /** Trusted test/manual plans only; no model-facing confirmation bypass. */
  readonly confirmedDecks?: readonly (ConfirmedDeckPlan & { readonly sessionId: string })[]
  readonly model?: ModelAdapter
  readonly selection?: ModelSelection
  readonly connections?: readonly ModelConnection[]
  readonly workspace: string
  readonly dataDir: string
  readonly port?: number
}

/** Composition owns Host -> Agent -> tools -> storage cleanup in that order. */
export async function startLocalWeb(options: LocalWebOptions) {
  const initial = options.selection ? { ...options.selection } : undefined
  await mkdir(resolve(options.workspace), { recursive: true })
  await mkdir(resolve(options.dataDir), { recursive: true })
  const workspace = await realpath(resolve(options.workspace))
  const dataDir = await realpath(resolve(options.dataDir))
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
    const state: WebState = new WebState(join(dataDir, 'web.sqlite'), store, () => catalog.snapshot())
    web = state
    const catalog = new ProviderStore(state.db, options.model && initial ? { model: options.model, selection: initial } : undefined)
    providers = catalog
    await catalog.load(options.connections, initial)
    const assets: Record<string, { contentType: string; body: string }> = {
      ...sampleAssets,
      '/': { contentType: 'text/html; charset=utf-8', body: page },
      '/style.css': { contentType: 'text/css; charset=utf-8', body: style },
    }
    const clientDir = dirname(fileURLToPath(import.meta.resolve('@deckagent/browser-runtime')))
    for (const name of await readdir(clientDir)) {
      if (/^[\w-]+\.js$/.test(name))
        assets[`/client/${name}`] = {
          contentType: 'text/javascript; charset=utf-8',
          body: await readFile(join(clientDir, name), 'utf8'),
        }
    }
    const host = await startHost({
      decks: presentation,
      assets,
      ...(options.port === undefined ? {} : { port: options.port }),
      async openAgent(sessionId, requestId) {
        let info = await store.getInfo(sessionId)
        // Compatibility for TASK-003 clients sending a fresh ID with an explicit CLI default.
        if (!info && initial) info = await store.bind(sessionId, initial)
        if (!info?.selection || !state.selectable(info.selection)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
        const chosen = info.selection
        let captured: ReturnType<ProviderStore['capture']>
        try { captured = catalog.capture(chosen) }
        catch (error) {
          if (error instanceof RuntimeError && error.code === 'PROVIDER_CREDENTIALS') throw new HttpError(409, 'PROVIDER_CREDENTIALS')
          throw error
        }
        const ctx = new Context()
        const scopedTools = new ToolRegistry()
        let scopedFiles: Awaited<ReturnType<typeof registerFileTools>> | undefined
        let removePublish: (() => void) | undefined
        try {
          scopedFiles = await registerFileTools(scopedTools, { root: workspace })
          removePublish = await registerPublishSlide(scopedTools, { root: workspace, sessionId, decks: presentation })
          ctx.provide('agentModel', captured.model)
          ctx.provide('agentSessions', store)
          ctx.provide('agentTools', scopedTools)
          const deck = presentation.snapshot(sessionId)
          const instructions = deck.outlineId
            ? `Host-confirmed slide plan: ${JSON.stringify(deck)}. Write static HTML/CSS as a new workspace draft, then use publish_slide for its planned slide ID with expectedRevision and a unique publicationId. No scripts, links, embeds or external assets. A draft is not published until publish_slide succeeds.`
            : 'This chat has no Host-confirmed slide plan. Do not build or publish presentation slides. The outline confirmation workflow is not available yet.'
          await ctx.plugin(runtimePlugin, { systemPrompt: `You are DeckAgent. Use read_file and write_file only within the granted workspace. Write drafts as new files; do not overwrite existing files. ${instructions}` })
          const agent = await ctx.agentRuntime.createAgent({ sessionId, selection: chosen, tools: [...scopedFiles.names, ...(deck.outlineId ? ['publish_slide'] : [])] })
          return {
            sessionId, get status() { return agent.status }, history: () => agent.history(),
            send: async (input, control) => {
              const historyStart = (await agent.history()).filter(message => message.role !== 'system').length
              state.startRequest(sessionId, requestId, chosen, historyStart)
              let result: TurnResult
              try {
                result = await agent.send(input, { ...control, onActivity: async event => {
                  state.saveActivity(sessionId, requestId, event)
                  await control?.onActivity?.(event)
                } })
              } catch {
                result = { status: 'failed', text: '', steps: 0, error: { code: 'REQUEST_FAILED', message: 'Request failed' } }
              }
              state.finishRequest(requestId, result)
              return result
            },
            dispose: async () => { try { await ctx.fiber.dispose() } finally { removePublish?.(); scopedFiles?.dispose(); captured.release() } },
          }
        } catch (error) {
          try { await ctx.fiber.dispose() } finally { removePublish?.(); scopedFiles?.dispose(); captured.release() }
          throw error
        }
      },
      readHistory: id => store.read(id),
      management: {
        settings: async () => catalog.snapshot(),
        saveProvider: (id, value) => catalog.save(id, value),
        deleteProvider: id => catalog.remove(id),
        catalog: id => catalog.catalog(id),
        sessions: () => state.list(), createSession: value => state.create(value),
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
