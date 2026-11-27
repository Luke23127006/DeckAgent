import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { createServer, type ServerResponse } from 'node:http'
import { createHostRoutes, type HostOptions, type HostRouteRegistrar } from '@deckagent/host-api'
import { createHttpApp } from './app.ts'
import { createChangeRoutes, type ChangeFeed, type HostChangeTopic, type SessionChangeTopic } from './change-feed.ts'

function isRouter(entry: HostRouteRegistrar): entry is Router {
  return 'handle' in entry && typeof entry.handle === 'function'
}

export interface StartHostOptions extends HostOptions {
  readonly onClose?: () => Promise<void> | void
  readonly omitLegacyRoutes?: boolean
  readonly changes?: {
    readonly feed: ChangeFeed
    readonly hostTopics: readonly HostChangeTopic[]
    readonly sessionTopics?: readonly SessionChangeTopic[]
    readonly sessionExists?: (sessionId: string) => Promise<boolean>
  }
}

/** Loopback-only, authenticated HTTP/SSE boundary. Disconnect never cancels a request. */
export async function startHost(options: StartHostOptions) {
  const token = randomBytes(32).toString('hex')
  const routes = options.omitLegacyRoutes
    ? (() => {
        const router = Router({ caseSensitive: true, strict: true })
        const streams = new Set<ServerResponse>()
        for (const entry of options.routes ?? []) router.use(isRouter(entry) ? entry : entry({ streams }))
        return { router, streams, close: async () => {} }
      })()
    : createHostRoutes(options)
  if (options.changes) {
    routes.router.use(
      createChangeRoutes(options.changes.feed, options.changes.hostTopics, routes.streams, {
        topics: options.changes.sessionTopics ?? [],
        ...(options.changes.sessionExists ? { exists: options.changes.sessionExists } : {}),
      }),
    )
  }
  let origin = ''
  let closing: Promise<void> | undefined
  const app = createHttpApp({
    options,
    token,
    router: routes.router,
    origin: () => origin,
    closing: () => closing !== undefined,
  })
  const server = createServer(app)
  server.requestTimeout = 10000
  server.headersTimeout = 10000
  server.on('clientError', (_error, socket) => socket.destroy())

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(options.port ?? 0, '127.0.0.1', () => {
        server.off('error', reject)
        resolve()
      })
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Host failed to listen')
    origin = `http://127.0.0.1:${address.port}`
  } catch (error) {
    server.close()
    throw error
  }

  return {
    origin,
    token,
    close(): Promise<void> {
      closing ??= (async () => {
        const stopped = new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve())),
        )
        for (const stream of routes.streams) stream.end()
        server.closeAllConnections()
        await Promise.all([stopped, routes.close(), options.onClose?.()])
      })()
      return closing
    },
  }
}
