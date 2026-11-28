import { randomUUID } from 'node:crypto'
import type { ApprovalView, RequestEvent, TerminalStatus } from '@deckagent/host-contracts'
import { createRunBudget } from '../budget/index.ts'
import type {
  AgentRuntime,
  ApprovalStep,
  ProviderResolver,
  ProviderRunSettings,
  RunBudgetLimits,
  RunContribution,
  RunEvent,
  RunInput,
  RunLifecycleContext,
  RunOwner,
  RunPlan,
  RunRecord,
  RunResult,
  RunSink,
  RunSnapshot,
  RunStartOptions,
  RunStore,
  RunTools,
  RunUsage,
  ToolResult,
} from '../ports.ts'
import { RunFailure, runOwnerKey } from '../ports.ts'
import { prepareRunInput } from '../preparation/index.ts'

interface Execution {
  readonly requestId: string
  readonly owner: RunOwner
  readonly abort: AbortController
  readonly closingText?: (status: TerminalStatus) => string | undefined
  /** Set once the terminal status is saved: every later runtime write is refused. */
  ended: boolean
  work: Promise<void>
  toolQueue: Promise<void>
  waiting?: { readonly approvalId: string; readonly resolve: (allowed: boolean) => void }
  readonly waitListeners: Set<(waiting: boolean) => void>
}

export interface RunControllerOptions {
  readonly store: RunStore
  readonly admit?: (input: Parameters<RunStore['admit']>[0], persist: RunStore['admit']) => RunRecord
  readonly runtime: AgentRuntime
  readonly providers: ProviderResolver
  readonly contributions?: readonly RunContribution[]
  readonly budget?: RunBudgetLimits
  readonly hasTools?: boolean
}

/** How long a new run waits for a stopped execution to release its owner. */
const releaseWait = 5000

const maxBusyOwners = 16

const admitPassthroughCodes = new Set([
  'SESSION_NOT_FOUND',
  'DRAFT_CONFLICT',
  'ATTACHMENT_COUNT_EXCEEDED',
  'ATTACHMENT_REJECTED',
  'ATTACHMENT_NOT_READY',
  'REQUEST_EMPTY',
])

function errorCodeOf(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined
}

function mapAdmitError(error: unknown): RunFailure {
  const code = errorCodeOf(error)
  if (code === 'REQUEST_ACTIVE' || code === 'RUN_OWNER_BUSY') return new RunFailure('RUN_OWNER_BUSY')
  if (code && admitPassthroughCodes.has(code)) return new RunFailure(code)
  return new RunFailure('REQUEST_NOT_SAVED')
}

/**
 * Host authority for the run lifecycle (ADR-001, ADR-002): admission with one active run for each owner,
 * persist-then-publish events, approvals, Stop, budget, multi-pass plans and the terminal status.
 * The runtime and the modules only supply evidence.
 */
export class RunController {
  private readonly executions = new Map<string, Execution>()
  /** Owners whose execution has not settled yet, including a stopped one whose process is still ending. */
  private readonly busy = new Map<string, Execution>()
  private readonly admitting = new Set<string>()
  private readonly listeners = new Set<(event: RequestEvent) => void>()
  private closed = false

  constructor(private readonly options: RunControllerOptions) {}

  async start(plan: RunPlan, options?: RunStartOptions): Promise<RunSnapshot> {
    if (this.closed) throw new RunFailure('HOST_CLOSED')

    if (plan.requestId) {
      const saved = this.options.store.get(plan.requestId)
      if (saved) {
        if (saved.owner.kind !== plan.owner.kind || saved.owner.id !== plan.owner.id)
          throw new RunFailure('GENERATION_LINK_CONFLICT')
        return this.get(plan.requestId)
      }
    }

    const key = runOwnerKey(plan.owner)
    if (this.admitting.has(key)) throw new RunFailure('RUN_OWNER_BUSY')

    this.admitting.add(key)

    try {
      const previous = this.busy.get(key)
      if (previous && !previous.ended) throw new RunFailure('RUN_OWNER_BUSY')
      // A stopped run already shows as stopped; its process gets a short time to end before the owner runs again.
      if (previous)
        await Promise.race([previous.work, new Promise(resolve => setTimeout(resolve, releaseWait).unref())])
      if (this.busy.has(key)) throw new RunFailure('RUN_OWNER_BUSY')
      if (this.options.store.activeFor(plan.owner)) throw new RunFailure('RUN_OWNER_BUSY')
      if (this.busy.size >= maxBusyOwners) throw new RunFailure('HOST_BUSY')
      const runtime = options?.runtime ?? this.options.runtime
      let provider: ProviderRunSettings | undefined
      if (!plan.skipRuntime) {
        const availability = await runtime.availability()
        if (!availability.available) throw new RunFailure(availability.code, availability.detail)
        provider = await this.options.providers.resolve(plan.selection)
        if (this.closed) throw new RunFailure('HOST_CLOSED')
      }
      const requestId = plan.requestId ?? `req-${randomUUID()}`
      const admitInput = {
        requestId,
        owner: plan.owner,
        input: plan.input,
        selection: plan.selection,
        ...(plan.grants.publicResearch ? { publicResearch: true } : {}),
        ...(options?.attachmentIds === undefined ? {} : { attachmentIds: options.attachmentIds }),
        ...(options?.draftRevision === undefined ? {} : { draftRevision: options.draftRevision }),
      }
      let admitted: RunRecord
      try {
        admitted = this.options.admit
          ? this.options.admit(admitInput, input => this.options.store.admit(input))
          : this.options.store.admit(admitInput)
      } catch (error) {
        throw mapAdmitError(error)
      }
      try {
        options?.onAdmitted?.()
      } catch {
        this.options.store.finish(requestId, 'failed', 'GENERATION_LINK_FAILED')
        throw new RunFailure('GENERATION_LINK_FAILED')
      }
      const execution: Execution = {
        requestId,
        owner: plan.owner,
        abort: new AbortController(),
        ...(plan.closingText ? { closingText: plan.closingText } : {}),
        ended: false,
        work: Promise.resolve(),
        toolQueue: Promise.resolve(),
        waitListeners: new Set(),
      }
      this.executions.set(requestId, execution)
      this.busy.set(key, execution)
      for (const event of this.options.store.events(requestId)) this.publish(event)
      execution.work = this.run(execution, plan, runtime, provider)
      return {
        requestId,
        owner: plan.owner,
        status: admitted.status,
        text: '',
        sequence: admitted.lastSequence,
      }
    } finally {
      this.admitting.delete(key)
    }
  }

  get(requestId: string): RunSnapshot {
    const request = this.options.store.get(requestId)
    if (!request) throw new RunFailure('REQUEST_NOT_FOUND')
    return {
      requestId,
      owner: request.owner,
      status: request.status,
      ...(request.errorCode ? { errorCode: request.errorCode } : {}),
      text: this.options.store.text(requestId),
      sequence: request.lastSequence,
      ...(this.options.hasTools === true
        ? { pendingApproval: this.options.store.approvals?.pending(requestId) ?? null }
        : {}),
    }
  }

  decide(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): ApprovalView {
    const approvals = this.options.store.approvals
    if (!approvals) throw new RunFailure('APPROVAL_NOT_FOUND')
    try {
      const change = approvals.decide(requestId, approvalId, decision)
      for (const event of change.events) this.publish(event)
      const execution = this.executions.get(requestId)
      if (execution?.waiting?.approvalId === approvalId) {
        const waiter = execution.waiting
        delete execution.waiting
        this.notifyWaiters(execution, false)
        waiter.resolve(change.approval.state === 'allowed')
      }
      return change.approval
    } catch (error) {
      const code = errorCodeOf(error)
      if (code === 'APPROVAL_NOT_FOUND' || code === 'REQUEST_NOT_FOUND') throw new RunFailure('APPROVAL_NOT_FOUND')
      if (code === 'APPROVAL_CONFLICT' || code === 'REQUEST_CLOSED') throw new RunFailure(code)
      const execution = this.executions.get(requestId)
      if (execution && !execution.ended) this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
      throw new RunFailure('REQUEST_NOT_SAVED')
    }
  }

  events(requestId: string, after: number): readonly RequestEvent[] {
    if (!this.options.store.get(requestId)) throw new RunFailure('REQUEST_NOT_FOUND')
    return this.options.store.events(requestId, after)
  }

  /** The active run of an owner, as saved. */
  active(owner: RunOwner): string | undefined {
    return this.options.store.activeFor(owner)
  }

  /**
   * User Stop: takes effect at once even when the runtime sends nothing (NFR-011). The terminal status is saved first,
   * so the execution's later events are refused; then its process is ended.
   */
  stop(requestId: string): RunSnapshot {
    const execution = this.executions.get(requestId)
    if (!execution) {
      if (!this.options.store.get(requestId)) throw new RunFailure('REQUEST_NOT_FOUND')
      return this.get(requestId)
    }
    if (!execution.ended) {
      this.end(execution, 'stopped')
      execution.abort.abort()
    }
    return this.get(requestId)
  }

  subscribe(listener: (event: RequestEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Host shutdown: active work did not finish and is never resumed (FR-019). */
  async close(): Promise<void> {
    this.closed = true
    for (const execution of this.executions.values()) {
      if (!execution.ended) this.end(execution, 'interrupted', 'HOST_STOPPED')
      execution.abort.abort()
    }
    await Promise.all([...this.executions.values()].map(execution => execution.work))
  }

  private async run(
    execution: Execution,
    plan: RunPlan,
    runtime: AgentRuntime,
    provider: ProviderRunSettings | undefined,
  ): Promise<void> {
    const budget = createRunBudget(this.options.budget, () => execution.abort.abort())
    let result: RunResult = { status: 'completed', usage: budget.latest() }

    try {
      let current = plan
      for (;;) {
        await current.beforeRun?.(this.lifecycleContext(execution))
        if (execution.ended) break
        if (!current.skipRuntime) {
          const prepared = await prepareRunInput({
            plan: current,
            requestId: execution.requestId,
            signal: execution.abort.signal,
            registered: this.options.contributions ?? [],
            providers: provider ? { resolve: async () => provider } : this.options.providers,
            approve: step => this.approve(execution, step),
            onApprovalWait: listener => {
              execution.waitListeners.add(listener)
              listener(!!execution.waiting)
              return () => execution.waitListeners.delete(listener)
            },
          })
          const input: RunInput = prepared.tools
            ? { ...prepared, tools: this.toolCapability(execution, prepared.tools) }
            : prepared
          result = await runtime.run(input, this.sink(execution, budget.record))
        } else {
          result = { status: 'completed', usage: budget.latest() }
        }
        if (execution.ended || result.status !== 'completed') break
        const next = await current.next?.(result, this.lifecycleContext(execution))
        if (!next) break
        current = next
      }
      const finalize = plan.finalize ?? current.finalize
      if (finalize && !execution.ended) result = await finalize(result, this.lifecycleContext(execution))
    } catch (error) {
      if (!execution.ended)
        result = {
          status: 'failed',
          usage: budget.latest(),
          error: { category: 'runtime-failed', code: error instanceof RunFailure ? error.code : 'RUNTIME_FAILED' },
        }
    }

    if (!execution.ended) {
      const saved =
        result.status === 'completed'
          ? this.end(execution, 'completed')
          : this.end(execution, 'failed', result.error.code)
      if (saved && result.status === 'completed') {
        try {
          result.commit?.()
        } catch {
          /* The native session is not kept; the next run starts a new one. */
        }
      }
    }

    const key = runOwnerKey(execution.owner)
    if (this.busy.get(key) === execution) this.busy.delete(key)

    // Keep a bounded number of settled executions; saved records remain readable from the store.
    if (this.executions.size > 256)
      for (const [id, item] of this.executions) {
        if (item.ended && !this.busy.has(runOwnerKey(item.owner))) {
          this.executions.delete(id)
          break
        }
      }
  }

  private sink(execution: Execution, record: (total: RunUsage) => void): RunSink {
    return {
      emit: event => this.writeEvent(execution, event),
      usage: total => record(total),
    }
  }

  /** Saves the terminal status once, then publishes it. Returns false when the run had already ended. */
  private end(execution: Execution, status: TerminalStatus, errorCode?: string): boolean {
    execution.ended = true
    const waiting = execution.waiting
    delete execution.waiting
    waiting?.resolve(false)
    let written: readonly RequestEvent[] | undefined

    try {
      const text = execution.closingText?.(status)
      if (text)
        this.publish(this.options.store.append(execution.requestId, { kind: 'text', part: 'generation-summary', text }))
    } catch {
      if (status === 'completed') {
        status = 'failed'
        errorCode = 'REQUEST_NOT_SAVED'
      }
    }

    try {
      written = this.options.store.finish(execution.requestId, status, errorCode)
    } catch {
      written = undefined
    }

    for (const event of written ?? []) this.publish(event)

    execution.abort.abort()
    return !!written
  }

  private publish(event: RequestEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        /* One broken stream does not affect the run or other streams. */
      }
    }
  }

  private notifyWaiters(execution: Execution, waiting: boolean): void {
    for (const listener of execution.waitListeners) {
      try {
        listener(waiting)
      } catch {
        /* An observer cannot grant or refuse a step. */
      }
    }
  }

  private lifecycleContext(execution: Execution): RunLifecycleContext {
    return {
      owner: execution.owner,
      requestId: execution.requestId,
      signal: execution.abort.signal,
      emit: event => this.writeEvent(execution, event),
    }
  }

  private async writeEvent(execution: Execution, event: RunEvent): Promise<void> {
    if (execution.ended) throw new Error('Request ended')
    let saved: RequestEvent
    try {
      saved = this.options.store.append(execution.requestId, event)
    } catch (error) {
      // A write the Host cannot save stops the work instead of continuing unrecorded (UC-003 A50).
      if (!execution.ended) this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
      throw error
    }
    this.publish(saved)
  }

  private async approve(execution: Execution, step: ApprovalStep): Promise<boolean> {
    const approvals = this.options.store.approvals
    if (execution.ended || execution.abort.signal.aborted || !approvals) return false

    let change: ReturnType<NonNullable<RunStore['approvals']>['create']>

    try {
      change = approvals.create(execution.requestId, step)
    } catch {
      this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
      throw new RunFailure('REQUEST_NOT_SAVED')
    }

    if (change.approval.state === 'refused') return false

    const allowed = new Promise<boolean>(resolve => {
      execution.waiting = { approvalId: change.approval.approvalId, resolve }
    })
    this.notifyWaiters(execution, true)

    for (const event of change.events) this.publish(event)

    return allowed
  }

  private toolCapability(execution: Execution, tools: RunTools): RunTools {
    const failure = (code: string): ToolResult => ({ isError: true, content: [{ type: 'text', text: code }] })
    return {
      context: tools.context,
      manifest: tools.manifest,
      schemas: tools.schemas,
      call: (name, args) => {
        const work = execution.toolQueue.then(async () => {
          if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
          if (!tools.schemas.some(tool => tool.name === name)) return failure('TOOL_NOT_ALLOWED')
          const activityId = `tool-${randomUUID()}`
          const emit = (status: 'running' | 'completed' | 'failed') => {
            if (execution.ended) return
            this.publish(
              this.options.store.append(execution.requestId, {
                kind: 'activity',
                id: activityId,
                label: name,
                type: 'tool',
                status,
              }),
            )
          }
          try {
            emit('running')
            const result = await tools.call(name, args)
            if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
            emit(result.isError ? 'failed' : 'completed')
            return result
          } catch (error) {
            if (execution.ended || execution.abort.signal.aborted) return failure('REQUEST_CLOSED')
            const code = errorCodeOf(error)
            if (code === 'SESSION_STORAGE' || code === 'SESSION_CLOSED' || code === 'SESSION_CORRUPT') {
              this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
              return failure('REQUEST_NOT_SAVED')
            }
            try {
              emit('failed')
            } catch {
              this.end(execution, 'failed', 'REQUEST_NOT_SAVED')
            }
            return failure(code && /^SOURCE_[A-Z_]+$/.test(code) ? code : 'TOOL_FAILED')
          }
        })
        execution.toolQueue = work.then(
          () => {},
          () => {},
        )
        return work
      },
    }
  }
}
