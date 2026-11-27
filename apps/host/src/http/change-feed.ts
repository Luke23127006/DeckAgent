import type { ServerResponse } from 'node:http'
import { HttpError, openSseStream, param, params, route } from './route-helpers.ts'
import type { ChangeNotice, ChangeTopic, PublishChange } from '@deckagent/host-contracts'
import { Router } from 'express'

export interface ChangeFeed {
  readonly publish: PublishChange
  subscribe(topic: ChangeTopic, key: string, listener: (notice: ChangeNotice) => void): () => void
}

export interface HostChangeTopic {
  readonly topic: ChangeTopic
  version(): number
}

export interface SessionChangeTopic {
  readonly topic: ChangeTopic
  version(sessionId: string): number
}

export interface SessionChangeRoutesOptions {
  readonly topics: readonly SessionChangeTopic[]
  readonly exists?: (sessionId: string) => Promise<boolean>
}

export function createChangeFeed(): ChangeFeed {
  const listeners = new Map<string, Set<(notice: ChangeNotice) => void>>()
  const slot = (topic: ChangeTopic, key: string) => `${topic}\0${key}`
  return {
    publish(notice) {
      const bucket = listeners.get(slot(notice.topic, notice.key))
      if (!bucket) return
      for (const listener of Array.from(bucket)) {
        try {
          listener(notice)
        } catch {
          bucket.delete(listener)
        }
      }
      if (bucket.size === 0) listeners.delete(slot(notice.topic, notice.key))
    },
    subscribe(topic, key, listener) {
      const id = slot(topic, key)
      let bucket = listeners.get(id)
      if (!bucket) {
        bucket = new Set()
        listeners.set(id, bucket)
      }
      bucket.add(listener)
      return () => {
        bucket.delete(listener)
        if (bucket.size === 0) listeners.delete(id)
      }
    },
  }
}

function writeNotice(res: ServerResponse, notice: ChangeNotice): void {
  if (res.destroyed || res.writableEnded) return
  if (!res.write(`event: change\ndata: ${JSON.stringify(notice)}\n\n`)) res.end()
}

/** Streams Host-scoped invalidation notices on GET /api/changes. Every connect starts at each topic's current version. */
export function createChangeRoutes(
  feed: ChangeFeed,
  hostTopics: readonly HostChangeTopic[],
  streams: Set<ServerResponse>,
  session?: SessionChangeRoutesOptions,
): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/changes',
    route((_req, res) => {
      const send = (notice: ChangeNotice) => writeNotice(res, notice)
      const unsubscribes = hostTopics.map(entry => feed.subscribe(entry.topic, 'host', send))
      const unsubscribeAll = () => {
        for (const unsubscribe of unsubscribes) unsubscribe()
      }
      try {
        const initial: ChangeNotice[] = hostTopics.map(entry => ({
          topic: entry.topic,
          key: 'host',
          version: entry.version(),
        }))
        openSseStream(res, streams, unsubscribeAll)
        for (const notice of initial) send(notice)
      } catch (error) {
        unsubscribeAll()
        throw error
      }
    }),
  )
  if (session) {
    router.get(
      '/api/sessions/:sessionId/changes',
      params({ sessionId: /^[\w-]{1,100}$/ }),
      route(async (req, res) => {
        const sessionId = param(req, 'sessionId')
        if (session.exists && !(await session.exists(sessionId))) throw new HttpError(404, 'SESSION_NOT_FOUND')
        const send = (notice: ChangeNotice) => writeNotice(res, notice)
        const unsubscribes = session.topics.map(entry => feed.subscribe(entry.topic, sessionId, send))
        const unsubscribeAll = () => {
          for (const unsubscribe of unsubscribes) unsubscribe()
        }
        try {
          const initial: ChangeNotice[] = session.topics.map(entry => ({
            topic: entry.topic,
            key: sessionId,
            version: entry.version(sessionId),
          }))
          openSseStream(res, streams, unsubscribeAll)
          for (const notice of initial) send(notice)
        } catch (error) {
          unsubscribeAll()
          throw error
        }
      }),
    )
  }
  return router
}
