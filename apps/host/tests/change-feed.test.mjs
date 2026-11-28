import assert from 'node:assert/strict'
import { request } from 'node:http'
import test from 'node:test'
import { createChangeFeed } from '../lib/types/http/change-feed.js'
import { startHost } from '../lib/types/http/start-host.js'

function openStream(host, path = '/api/changes', headers = {}) {
  const { port, host: hostHeader } = new URL(host.origin)
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        path,
        headers: { host: hostHeader, authorization: `Bearer ${host.token}`, ...headers },
      },
      res => resolve({ req, res }),
    )
    req.on('error', reject)
    req.end()
  })
}

function readNextEvent(res) {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const onData = chunk => {
      buffer += chunk.toString('utf8')
      const boundary = buffer.indexOf('\n\n')
      if (boundary < 0) return
      cleanup()
      resolve(buffer.slice(0, boundary))
    }
    const onEnd = () => {
      cleanup()
      reject(new Error('Stream ended before event'))
    }
    const onError = error => {
      cleanup()
      reject(error)
    }
    const cleanup = () => {
      res.off('data', onData)
      res.off('end', onEnd)
      res.off('error', onError)
    }
    res.on('data', onData)
    res.once('end', onEnd)
    res.once('error', onError)
  })
}

test('createChangeFeed routes by topic and key, removes a throwing listener and honors unsubscribe', () => {
  const feed = createChangeFeed()
  const received = []
  let badCalls = 0
  feed.subscribe('workspaces', 'host', () => {
    badCalls += 1
    throw new Error('listener boom')
  })
  const unsubscribe = feed.subscribe('workspaces', 'host', notice => received.push(notice))
  const other = []
  feed.subscribe('providers', 'host', notice => other.push(notice))

  feed.publish({ topic: 'workspaces', key: 'host', version: 1 })
  feed.publish({ topic: 'workspaces', key: 'host', version: 2 })
  unsubscribe()
  feed.publish({ topic: 'workspaces', key: 'host', version: 3 })

  assert.equal(badCalls, 1)
  assert.deepEqual(received, [
    { topic: 'workspaces', key: 'host', version: 1 },
    { topic: 'workspaces', key: 'host', version: 2 },
  ])
  assert.deepEqual(other, [])
})

test('GET /api/changes requires auth, sends initial topic versions and streams published notices', async t => {
  const feed = createChangeFeed()
  let version = 3
  const host = await startHost({
    readHistory: async () => [],
    changes: { feed, hostTopics: [{ topic: 'workspaces', version: () => version }] },
  })
  t.after(() => host.close())

  const unauth = await fetch(`${host.origin}/api/changes`)
  assert.equal(unauth.status, 401)

  const stream = await openStream(host)
  t.after(() => stream.req.destroy())
  assert.equal(stream.res.statusCode, 200)
  assert.equal(stream.res.headers['content-type'], 'text/event-stream')

  const initialFrame = await readNextEvent(stream.res)
  assert.equal(initialFrame, 'event: change\ndata: {"topic":"workspaces","key":"host","version":3}')

  const nextPromise = readNextEvent(stream.res)
  version = 4
  feed.publish({ topic: 'workspaces', key: 'host', version: 4 })
  assert.equal(await nextPromise, 'event: change\ndata: {"topic":"workspaces","key":"host","version":4}')
})

test('GET /api/sessions/:sessionId/changes checks auth and existence, sends initial versions, isolates keys and shares the 64-stream limit', async t => {
  const feed = createChangeFeed()
  const versions = new Map([['chat-a', 2]])
  const host = await startHost({
    readHistory: async () => [],
    changes: {
      feed,
      hostTopics: [{ topic: 'workspaces', version: () => 0 }],
      sessionExists: async id => id === 'chat-a',
      sessionTopics: [{ topic: 'draft', version: id => versions.get(id) ?? 0 }],
    },
  })
  t.after(() => host.close())

  assert.equal((await fetch(`${host.origin}/api/sessions/chat-a/changes`)).status, 401)
  const missing = await fetch(`${host.origin}/api/sessions/missing/changes`, {
    headers: { authorization: `Bearer ${host.token}` },
  })
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error.code, 'SESSION_NOT_FOUND')

  const stream = await openStream(host, '/api/sessions/chat-a/changes')
  t.after(() => stream.req.destroy())
  assert.equal(stream.res.statusCode, 200)
  assert.equal(await readNextEvent(stream.res), 'event: change\ndata: {"topic":"draft","key":"chat-a","version":2}')

  const next = readNextEvent(stream.res)
  feed.publish({ topic: 'draft', key: 'chat-b', version: 1 })
  feed.publish({ topic: 'draft', key: 'chat-a', version: 3 })
  assert.equal(await next, 'event: change\ndata: {"topic":"draft","key":"chat-a","version":3}')
})

test('GET /api/changes shares the 64-stream limit and rejects the 65th stream with 429 TOO_MANY_STREAMS', async t => {
  const feed = createChangeFeed()
  const host = await startHost({
    readHistory: async () => [],
    changes: { feed, hostTopics: [{ topic: 'workspaces', version: () => 0 }] },
  })
  t.after(() => host.close())

  const streams = []
  t.after(() => {
    for (const stream of streams) stream.req.destroy()
  })
  for (let index = 0; index < 64; index += 1) streams.push(await openStream(host))
  assert.equal(streams[0].res.statusCode, 200)

  const extra = await openStream(host)
  const chunks = []
  extra.res.on('data', chunk => chunks.push(chunk))
  await new Promise(resolve => extra.res.on('end', resolve))
  assert.equal(extra.res.statusCode, 429)
  assert.equal(JSON.parse(Buffer.concat(chunks).toString('utf8')).error.code, 'TOO_MANY_STREAMS')
})
