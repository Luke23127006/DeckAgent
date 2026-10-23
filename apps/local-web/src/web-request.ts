import { Context } from '@deepseek-ai/cordis'
import { RuntimeError, ToolRegistry, runtimePlugin } from '@deckagent/agent-runtime'
import type { AgentHandle, SendOptions, TurnResult } from '@deckagent/agent-runtime'
import { registerFileTools } from '@deckagent/file-tools'
import { HttpError } from '@deckagent/host-api'
import type { AgentRequest, QuestionDraft, RequestAgent } from '@deckagent/host-api'
import type { DeckService, DeckSnapshot, OutlineDraft, OutlineProposal } from '@deckagent/deck'
import type { SqliteSessionStore } from '@deckagent/session-persistence'
import { registerProposeOutline, registerPublishSlide, registerReadSlide } from '@deckagent/presentation-tools'
import type { ProviderStore } from './provider-settings.ts'
import type { WebState } from './web-state.ts'
import { editingInstructions, editingScope } from './editing-workflow.ts'
import { presentationInstructions, reviewAction } from './outline-workflow.ts'
import { clarificationInstructions, registerOutlineInteraction } from './outline-interaction.ts'
import type { OutlineDecision } from './outline-interaction.ts'

interface WebRequestOptions {
  readonly request: AgentRequest
  readonly requestId: string
  readonly workspace: string
  readonly store: SqliteSessionStore
  readonly presentation: DeckService
  readonly state: WebState
  readonly catalog: ProviderStore
}

interface PreparedTurn {
  readonly agent: AgentHandle
  readonly deck: DeckSnapshot
  readonly scope: readonly string[]
  readonly editing: boolean
  readonly generating: boolean
  close(): Promise<void>
}

type Decision = OutlineDecision | { readonly kind: 'proposal'; readonly draft: OutlineDraft }

/** Host request owns model capture; each short-lived runtime owns exactly one model turn. */
export async function openWebRequest(options: WebRequestOptions): Promise<RequestAgent & { finish(result: TurnResult): Promise<void> }> {
  const { request, requestId, workspace, store, presentation, state, catalog } = options
  const sessionId = request.sessionId
  const info = await store.getInfo(sessionId)
  if (!info?.selection || !state.selectable(info.selection)) throw new HttpError(409, 'MODEL_NOT_SELECTABLE')
  const chosen = info.selection
  const outlineState = presentation.outlineSnapshot(sessionId)
  const action = reviewAction(request, outlineState)
  if (request.outlineTarget) presentation.currentOutline(sessionId, request.outlineTarget)
  const candidate = action.command && action.target ? presentation.currentOutline(sessionId, action.target) : undefined
  if (request.outlineAction && !candidate) throw new HttpError(409, 'OUTLINE_STALE')
  const firstConfirm = action.command === 'confirm' ? candidate : undefined
  let captured: ReturnType<ProviderStore['capture']>
  try { captured = catalog.capture(chosen) }
  catch (error) {
    if (error instanceof RuntimeError && error.code === 'PROVIDER_CREDENTIALS') throw new HttpError(409, 'PROVIDER_CREDENTIALS')
    throw error
  }
  let decision: Decision | undefined
  let invalidDecision = false
  let pendingQuestion: QuestionDraft | undefined
  let prepared: PreparedTurn | undefined
  let started = false
  let disposed = false
  let running = false
  let round = 0
  let noticeIndex: number | undefined
  const target = action.current
  const stagedDecision = (): Decision | undefined => decision
  const stage = (value: Decision) => {
    if (decision) { invalidDecision = true; throw new Error('Multiple decisions') }
    decision = value
  }

  async function prepare(input: string, confirming?: OutlineProposal, first = false): Promise<PreparedTurn> {
    const deck: DeckSnapshot = confirming ? { sessionId, deckId: sessionId, outlineId: confirming.outlineId, version: 1,
      slides: confirming.slides.map((slide, order) => ({ slideId: slide.slideId, title: slide.title, order, status: 'pending', revision: 0 })) }
      : presentation.snapshot(sessionId)
    const confirmed = confirming ?? outlineState.proposals.find(proposal => proposal.status === 'confirmed')
    const reviewing = !deck.outlineId && (request.presentation === true || presentation.outlineSnapshot(sessionId).active)
    const editing = !!deck.outlineId && !confirming
    const scope = editing ? editingScope(input, deck) : deck.slides.map(slide => slide.slideId)
    const ctx = new Context()
    const tools = new ToolRegistry()
    let files: Awaited<ReturnType<typeof registerFileTools>> | undefined
    const removers: (() => void)[] = []
    let closing: Promise<void> | undefined
    const close = () => closing ??= (async () => {
      try { await ctx.fiber.dispose() } finally { for (const remove of removers.reverse()) remove(); files?.dispose() }
    })()
    try {
      files = await registerFileTools(tools, { root: workspace })
      removers.push(await registerPublishSlide(tools, { root: workspace, sessionId, decks: presentation, allowedSlideIds: scope }))
      removers.push(registerReadSlide(tools, sessionId, presentation))
      removers.push(registerProposeOutline(tools, draft => stage({ kind: 'proposal', draft })))
      if (!deck.outlineId) removers.push(registerOutlineInteraction(tools, !!target, stage))
      ctx.provide('agentModel', captured.model)
      ctx.provide('agentSessions', store)
      ctx.provide('agentTools', tools)
      const instructions = editing
        ? `${editingInstructions(deck, scope, requestId)}\nConfirmed plan: ${JSON.stringify(confirmed ?? null)}\n${scope.length ? '' : 'No edits are authorized. Ask the user to name slide numbers, quote an exact slide title, say all slides, or continue unfinished slides. Change nothing.'}`
        : `${presentationInstructions(deck, confirmed ?? target, reviewing, requestId)}${deck.outlineId ? '' : `\n${clarificationInstructions}`}`
      await ctx.plugin(runtimePlugin, {
        maxSteps: Math.max(8, (editing ? 3 : 2) * scope.length + 5),
        systemPrompt: `You are DeckAgent. Work only within the granted workspace. Write drafts as new files; do not overwrite existing files. Slide HTML must omit all meta tags, including charset and viewport. Use static HTML/CSS only. If publish_slide rejects HTML, follow its diagnostic: write a corrected draft at a new path and publish that path, never repeat the rejected file unchanged. A scope rejection is not a request for manual Host permission: no such approval flow exists. Explain the saved result and ask for a clearly scoped new request instead. ${instructions}`,
      })
      const staticText = first && action.command === 'cancel' && candidate
        ? 'Outline cancelled. It stays in the conversation. Send a new request for a new proposal; no slides were built.'
        : first && action.command && !candidate
          ? 'There is no current outline to review. Ask for a presentation outline first, or open the existing deck. No outline action was applied.' : undefined
      const agent: AgentHandle = staticText ? { sessionId, status: 'idle', history: () => store.read(sessionId), dispose: async () => {},
        async send(text, control) {
          control?.signal?.throwIfAborted()
          if (action.command === 'cancel' && candidate) presentation.cancelOutline(sessionId, candidate)
          await store.append(sessionId, [{ role: 'user', content: text }, { role: 'assistant', content: staticText }])
          return { status: 'completed', text: staticText, steps: 0 }
        } }
        : await ctx.agentRuntime.createAgent({ sessionId, selection: chosen, tools: deck.outlineId
          ? [...files.names, 'read_slide', 'publish_slide']
          : [...(reviewing ? ['read_file'] : files.names), 'propose_outline', 'ask_clarification', ...(target ? ['review_outline'] : [])] })
      return { agent, deck, scope, editing, generating: !!confirming, close }
    } catch (error) { await close(); throw error }
  }

  async function execute(turn: PreparedTurn, input: string, control?: SendOptions, continuation = false): Promise<TurnResult> {
    const turnNumber = ++round
    let result: TurnResult
    try {
      result = await turn.agent.send(input, { ...control, ...(continuation ? { continuation: true as const } : {}), onActivity: async event => {
        // Model counters restart each turn; tool IDs already have runtime-enforced Session uniqueness.
        const entry = event.kind === 'model' ? { ...event, id: `turn-${turnNumber}-${event.id}` } : event
        state.saveActivity(sessionId, requestId, entry)
        await control?.onActivity?.(entry)
      } })
    } finally { await turn.close() }
    prepared = undefined
    if (invalidDecision && result.status === 'completed') result = { status: 'failed', text: result.text, steps: result.steps,
      error: { code: 'INTERACTION_INVALID', message: 'Conflicting outline decisions' } }
    if (turn.generating && result.status === 'completed' && presentation.snapshot(sessionId).slides.some(slide => slide.status === 'pending')) {
      const text = 'Generation ended before all planned slides were published. The draft is not ready; review the saved deck before retrying.'
      await store.append(sessionId, [{ role: 'assistant', content: text }])
      result = { status: 'failed', text, steps: result.steps, error: { code: 'DECK_INCOMPLETE', message: 'Some planned slides remain unpublished' } }
    }
    if (turn.editing && turn.scope.length && result.status === 'completed') {
      const saved = presentation.snapshot(sessionId)
      if (turn.scope.some(id => saved.slides.find(slide => slide.slideId === id)!.revision <= turn.deck.slides.find(slide => slide.slideId === id)!.revision))
        result = { status: 'failed', text: result.text, steps: result.steps, error: { code: 'EDIT_INCOMPLETE', message: 'Some requested slides were not published' } }
    }
    if (turn.deck.outlineId && result.status !== 'completed') {
      const saved = presentation.snapshot(sessionId)
      const changed = saved.slides.filter(slide => slide.revision > (turn.deck.slides.find(before => before.slideId === slide.slideId)?.revision ?? 0))
      const unfinished = saved.slides.filter(slide => slide.status === 'pending')
      const remaining = turn.scope.filter(id => !changed.some(slide => slide.slideId === id)).length
      const text = `${result.status === 'cancelled' ? 'Stopped' : 'Work did not finish'}. ${changed.length} slides published or changed in this request. ${remaining} requested slides were not changed. ${unfinished.length} planned slides remain unfinished.${unfinished.length ? ' The draft is not ready.' : ''} Finished revisions were kept; unfinished edits keep their last published revision. The deck may be inconsistent; consistency was not checked. Nothing will resume automatically.`
      await store.append(sessionId, [{ role: 'assistant', content: text }])
      noticeIndex = (await store.read(sessionId)).filter(message => message.role !== 'system').length - 1
      result = { ...result, text }
    }
    return result
  }

  try {
    prepared = await prepare(request.input, firstConfirm, true)
    if (firstConfirm) presentation.confirmOutline(sessionId, firstConfirm)
    else if (!prepared.deck.outlineId && (request.presentation || outlineState.active)) presentation.beginOutline(sessionId)
  } catch (error) { try { await prepared?.close() } finally { captured.release() }; throw error }

  return {
    sessionId, get status() { return disposed ? 'disposed' : running ? 'running' : 'idle' },
    history: () => store.read(sessionId), question: () => pendingQuestion,
    async send(input, control) {
      running = true
      try {
        if (!started) {
          const history = (await store.read(sessionId)).filter(message => message.role !== 'system')
          state.startRequest(sessionId, requestId, chosen, history.length)
          started = true
        }
        decision = undefined
        invalidDecision = false
        pendingQuestion = undefined
        prepared ??= await prepare(input)
        let result = await execute(prepared, input, control)
        if (result.status !== 'completed') return result
        const outcome = stagedDecision()
        if (outcome?.kind === 'question') {
          presentation.beginOutline(sessionId)
          pendingQuestion = outcome.question
        }
        if (outcome?.kind === 'review') {
          control?.signal?.throwIfAborted()
          if (!target) throw new Error('Missing review target')
          const current = presentation.currentOutline(sessionId, target)
          if (outcome.intent === 'cancel') {
            presentation.cancelOutline(sessionId, current)
            const text = 'Đã hủy outline. Chưa tạo slide nào; các đề xuất vẫn ở trong cuộc trò chuyện.'
            await store.append(sessionId, [{ role: 'assistant', content: text }])
            return { ...result, text }
          }
          prepared = await prepare(input, current)
          control?.signal?.throwIfAborted()
          presentation.confirmOutline(sessionId, current)
          decision = undefined
          const generation = await execute(prepared, input, control, true)
          result = { ...generation, steps: result.steps + generation.steps }
        }
        return result
      } finally { running = false }
    },
    async dispose() {
      if (disposed) return
      disposed = true
      try { await prepared?.close() } finally { captured.release() }
    },
    async finish(result) {
      try {
        if (decision?.kind === 'proposal' && result.status === 'completed') {
          const history = (await store.read(sessionId)).filter(message => message.role !== 'system')
          const response = history.at(-1)
          if (response?.role !== 'assistant' || !response.content.trim()) throw new Error('Outline response incomplete')
          state.finishRequest(requestId, result)
          presentation.proposeOutline(sessionId, { requestId, responseIndex: history.length - 1, draft: decision.draft })
        } else state.finishRequest(requestId, result, noticeIndex)
      } catch {
        state.finishRequest(requestId, { status: 'failed', text: result.text, steps: result.steps,
          error: { code: 'REQUEST_FINALIZATION_FAILED', message: 'Request state could not be saved' } }, noticeIndex)
        throw new Error('Request finalization failed')
      }
    },
  }
}
