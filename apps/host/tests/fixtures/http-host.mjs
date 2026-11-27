import { Router } from 'express'
import { startHost } from '../../lib/types/http/start-host.js'
import { HttpError, json, param, params, route, WORD_ID } from '../../lib/types/http/route-helpers.js'
import { RunController } from '../../lib/types/runs/lifecycle/index.js'
import { RunFailure } from '../../lib/types/runs/ports.js'
import { ChatService, createChatRequestRoutes } from '../../lib/types/modules/chats/index.js'
export { startHost, HttpError }

export async function startRequestHost({
  readHistory = async () => [],
  requests,
  maxAttachments = 0,
  routes = [],
  ...options
}) {
  const history = Router({ caseSensitive: true, strict: true })
  const chats = new ChatService({ read: readHistory }, {}, {}, {}, {})
  history.get(
    '/api/sessions/:sessionId/history',
    params({ sessionId: WORD_ID }),
    route(async (req, res) => {
      json(res, 200, await chats.history(param(req, 'sessionId')))
    }),
  )
  const statuses = {
    HOST_CLOSED: 503,
    HOST_BUSY: 429,
    REQUEST_NOT_FOUND: 404,
    APPROVAL_NOT_FOUND: 404,
    SESSION_NOT_FOUND: 404,
    RUN_OWNER_BUSY: 409,
    SESSION_BUSY: 409,
    REQUEST_CLOSED: 409,
    APPROVAL_CONFLICT: 409,
  }
  const mapApplicationFailure = error => {
    if (error instanceof RunFailure)
      return {
        status: statuses[error.code] ?? 500,
        code: error.code === 'RUN_OWNER_BUSY' ? 'SESSION_BUSY' : error.code,
        ...(error.detail ? { detail: error.detail } : {}),
      }
    return options.mapApplicationFailure?.(error)
  }
  if (!requests) {
    const unavailable = Router({ caseSensitive: true, strict: true })
    unavailable.post(
      '/api/requests',
      route(() => {
        throw new HttpError(503, 'REQUESTS_UNAVAILABLE')
      }),
    )
    return startHost({ ...options, mapApplicationFailure, routes: [history, ...routes, unavailable] })
  }
  const project = record => {
    if (!record) return undefined
    const { sessionId, ...rest } = record
    return { ...rest, owner: { kind: 'chat', id: sessionId } }
  }
  const store = requests.store
  const runs = new RunController({
    store: {
      approvals: store.approvals,
      admit: ({ owner, ...input }) => project(store.admit({ ...input, sessionId: owner.id })),
      append: (id, event) => store.append(id, event),
      finish: (id, status, code) => store.finish(id, status, code),
      get: id => project(store.get(id)),
      events: (id, after) => store.events(id, after),
      text: id => store.text(id),
      activeFor: owner => store.activeFor(owner.id),
    },
    providers: {
      resolve: async selection => ({ ...selection, protocol: 'chat-completions', baseUrl: 'http://127.0.0.1' }),
    },
    runtime: {
      name: 'fixture',
      availability: async () => ({ available: true }),
      run: async () => {
        throw new Error('Runtime missing')
      },
    },
  })
  const snapshot = value => {
    const { owner, ...rest } = value
    return { ...rest, sessionId: owner.id }
  }
  const operations = {
    async submit(request) {
      const prepared = await requests.runtime.prepare(request)
      const runtime = {
        name: 'fixture',
        availability: async () => ({ available: true }),
        async run(input, sink) {
          const outcome = await prepared.start({
            requestId: input.requestId,
            sessionId: input.owner.id,
            signal: input.signal,
            emit: sink.emit,
            ...(input.tools ? { tools: input.tools } : {}),
            instructions: input.instructions.join('\n'),
            onApprovalWait: input.onApprovalWait,
          })
          return outcome.status === 'completed'
            ? { ...outcome, usage: { modelCalls: 1 } }
            : {
                status: 'failed',
                usage: { modelCalls: 1 },
                error: { category: 'runtime-failed', code: outcome.errorCode },
              }
        },
      }
      return snapshot(
        await runs.start(
          {
            owner: { kind: 'chat', id: request.sessionId },
            input: request.input,
            selection: prepared.selection,
            grants: { publicResearch: false, sourceKinds: [] },
            contributions: [],
          },
          {
            runtime,
            ...(request.attachmentIds === undefined ? {} : { attachmentIds: request.attachmentIds }),
            ...(request.draftRevision === undefined ? {} : { draftRevision: request.draftRevision }),
          },
        ),
      )
    },
    get: id => snapshot(runs.get(id)),
    stop: id => snapshot(runs.stop(id)),
    decide: (id, approval, decision) => runs.decide(id, approval, decision),
    events: (id, after) => runs.events(id, after),
    subscribe: listener => runs.subscribe(listener),
  }
  return startHost({
    ...options,
    mapApplicationFailure,
    routes: [history, ...routes, context => createChatRequestRoutes(operations, maxAttachments, context.streams)],
    onClose: async () => {
      await runs.close()
      await options.onClose?.()
    },
  })
}
