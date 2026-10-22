import { mkdir, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { RuntimeError, ToolRegistry, runtimePlugin } from '@deckagent/agent-runtime'
import type { AgentHandle, ModelAdapter, ModelSelection, TurnResult } from '@deckagent/agent-runtime'
import type { ModelConnection } from '@deckagent/model-providers'
import { registerFileTools } from '@deckagent/file-tools'
import { HttpError, startHost } from '@deckagent/host-api'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { page, style, deckResizeStyle, composerStyle, presentationStyle, activityStyle } from './ui-assets.ts'
import { WebState } from './web-state.ts'
import { ProviderStore } from './provider-settings.ts'
import { sampleAssets } from './sample-slides.ts'
import { DeckService } from '@deckagent/deck'
import type { ConfirmedDeckPlan, OutlineDraft } from '@deckagent/deck'
import { registerProposeOutline, registerPublishSlide, registerReadSlide } from '@deckagent/presentation-tools'
import { editingInstructions, editingScope } from './editing-workflow.ts'
import { presentationInstructions, reviewAction } from './outline-workflow.ts'
import { outlineStyle } from './outline-style.ts'

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
        let info = await store.getInfo(sessionId)
        // Compatibility for TASK-003 clients sending a fresh ID with an explicit CLI default.
        if (!info && initial) info = await store.bind(sessionId, initial)
        if (!info?.selection || !state.selectable(info.selection)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
        const chosen = info.selection
        const outlineState = presentation.outlineSnapshot(sessionId)
        const action = reviewAction(request, outlineState)
        if (request.outlineTarget) presentation.currentOutline(sessionId, request.outlineTarget)
        const candidate = action.command && action.target ? presentation.currentOutline(sessionId, action.target) : undefined
        if (request.outlineAction && !candidate) throw new HttpError(409, 'OUTLINE_STALE')
        const confirming = action.command === 'confirm' ? candidate : undefined
        const staticText = action.command === 'cancel' && candidate
          ? 'Outline cancelled. It stays in the conversation. Send a new request for a new proposal; no slides were built.'
          : action.command && !candidate
            ? 'There is no current outline to review. Ask for a presentation outline first, or open the existing deck. No outline action was applied.' : undefined
        const deck = confirming ? {
          sessionId, deckId: sessionId, outlineId: confirming.outlineId, version: 1,
          slides: confirming.slides.map((slide, order) => ({ slideId: slide.slideId, title: slide.title, order,
            status: 'pending' as const, revision: 0 })),
        } : presentation.snapshot(sessionId)
        const confirmed = confirming ?? outlineState.proposals.find(p => p.status === 'confirmed')
        const reviewing = !deck.outlineId && (request.presentation === true || outlineState.active)
        const editing = !!deck.outlineId && !confirming
        const scope = editing ? editingScope(request.input, deck) : deck.slides.map(slide => slide.slideId)
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
        let removeProposal: (() => void) | undefined
        let removeRead: (() => void) | undefined
        let staged: OutlineDraft | undefined
        let noticeIndex: number | undefined
        try {
          scopedFiles = await registerFileTools(scopedTools, { root: workspace })
          removePublish = await registerPublishSlide(scopedTools, { root: workspace, sessionId, decks: presentation, allowedSlideIds: scope })
          removeRead = registerReadSlide(scopedTools, sessionId, presentation)
          removeProposal = registerProposeOutline(scopedTools, draft => {
            if (staged) throw new Error('Only one proposal per request')
            staged = draft
          })
          ctx.provide('agentModel', captured.model)
          ctx.provide('agentSessions', store)
          ctx.provide('agentTools', scopedTools)
          const instructions = editing
            ? `${editingInstructions(deck, scope, requestId)}\nConfirmed plan: ${JSON.stringify(confirmed ?? null)}\n${scope.length ? '' : 'No edits are authorized. Ask the user to name slide numbers, quote an exact slide title, say all slides, or continue unfinished slides. Change nothing.'}`
            : presentationInstructions(deck, confirmed ?? action.current, reviewing, requestId)
          await ctx.plugin(runtimePlugin, {
            maxSteps: Math.max(8, (editing ? 3 : 2) * scope.length + 5),
            systemPrompt: `You are DeckAgent. Work only within the granted workspace. Write drafts as new files; do not overwrite existing files. Slide HTML must omit all meta tags, including charset and viewport. Use static HTML/CSS only. If publish_slide rejects HTML, follow its diagnostic: write a corrected draft at a new path and publish that path, never repeat the rejected file unchanged. A scope rejection is not a request for manual Host permission: no such approval flow exists. Explain the saved result and ask for a clearly scoped new request instead. ${instructions}`,
          })
          const agent: AgentHandle = staticText ? {
            sessionId, status: 'idle', history: () => store.read(sessionId), dispose: async () => {},
            async send(input, control) {
              control?.signal?.throwIfAborted()
              if (action.command === 'cancel' && candidate) presentation.cancelOutline(sessionId, candidate)
              await store.append(sessionId, [{ role: 'user', content: input }, { role: 'assistant', content: staticText }])
              return { status: 'completed', text: staticText, steps: 0 }
            },
          } : await ctx.agentRuntime.createAgent({ sessionId, selection: chosen,
            tools: deck.outlineId ? [...scopedFiles.names, 'read_slide', 'publish_slide'] :
              reviewing ? ['read_file', 'propose_outline'] : [...scopedFiles.names, 'propose_outline'] })
          // Admission has validated/captured the model and created the handle under the Session lock.
          // No asynchronous operation follows confirmation before returning that admitted handle.
          if (confirming) presentation.confirmOutline(sessionId, confirming)
          else if (reviewing) presentation.beginOutline(sessionId)
          finalizers.set(requestId, async result => {
            try {
              if (staged && result.status === 'completed') {
                const history = (await store.read(sessionId)).filter(message => message.role !== 'system')
                const response = history.at(-1)
                if (response?.role !== 'assistant' || !response.content.trim()) throw new Error('Outline response incomplete')
                // Save successful request evidence before making the proposal confirmable.
                // A crash between these stores leaves text without a proposal, never an unfinished current outline.
                state.finishRequest(requestId, result)
                presentation.proposeOutline(sessionId, { requestId, responseIndex: history.length - 1, draft: staged })
              } else state.finishRequest(requestId, result, noticeIndex)
            } catch {
              state.finishRequest(requestId, { status: 'failed', text: result.text, steps: result.steps,
                error: { code: 'REQUEST_FINALIZATION_FAILED', message: 'Request state could not be saved' } }, noticeIndex)
              throw new Error('Request finalization failed')
            }
          })
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
                if (confirming && result.status === 'completed' && presentation.snapshot(sessionId).slides.some(slide => slide.status === 'pending')) {
                  const text = 'Generation ended before all planned slides were published. The draft is not ready; review the saved deck before retrying.'
                  await store.append(sessionId, [{ role: 'assistant', content: text }])
                  result = { status: 'failed', text, steps: result.steps,
                    error: { code: 'DECK_INCOMPLETE', message: 'Some planned slides remain unpublished' } }
                }
              } catch {
                result = { status: 'failed', text: '', steps: 0, error: { code: 'REQUEST_FAILED', message: 'Request failed' } }
              }
              if (editing && scope.length && result.status === 'completed') {
                const saved = presentation.snapshot(sessionId)
                const incomplete = scope.some(id => saved.slides.find(slide => slide.slideId === id)!.revision <= deck.slides.find(slide => slide.slideId === id)!.revision)
                if (incomplete) result = { status: 'failed', text: result.text, steps: result.steps,
                  error: { code: 'EDIT_INCOMPLETE', message: 'Some requested slides were not published' } }
              }
              if (deck.outlineId && result.status !== 'completed') {
                const saved = presentation.snapshot(sessionId)
                const changed = saved.slides.filter(slide => slide.revision > (deck.slides.find(before => before.slideId === slide.slideId)?.revision ?? 0))
                const unfinished = saved.slides.filter(slide => slide.status === 'pending')
                const remaining = scope.filter(id => !changed.some(slide => slide.slideId === id)).length
                const text = `${result.status === 'cancelled' ? 'Stopped' : 'Work did not finish'}. ${changed.length} slides published or changed in this request. ${remaining} requested slides were not changed. ${unfinished.length} planned slides remain unfinished.${unfinished.length ? ' The draft is not ready.' : ''} Finished revisions were kept; unfinished edits keep their last published revision. The deck may be inconsistent; consistency was not checked. Nothing will resume automatically.`
                await store.append(sessionId, [{ role: 'assistant', content: text }])
                noticeIndex = (await store.read(sessionId)).filter(message => message.role !== 'system').length - 1
                result = { ...result, text }
              }
              return result
            },
            dispose: async () => { try { await ctx.fiber.dispose() } finally { removeRead?.(); removeProposal?.(); removePublish?.(); scopedFiles?.dispose(); captured.release() } },
          }
        } catch (error) {
          try { await ctx.fiber.dispose() } finally { removeRead?.(); removeProposal?.(); removePublish?.(); scopedFiles?.dispose(); captured.release() }
          throw error
        }
      },
      readHistory: id => store.read(id),
      management: {
        settings: async () => catalog.snapshot(),
        saveProvider: (id, value) => catalog.save(id, value),
        deleteProvider: id => catalog.remove(id),
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
