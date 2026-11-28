// Checks the shared HTTP behavior of the Local Host: security headers, origin and Host checks,
// path matching, JSON body limits, the SSE stream limit and the client parse error handler.
// Environment: the real Local Host from startLocalWeb with a temporary data folder. No fake replaces
// a Host module. The requests use node:http and node:net, because fetch cannot set the Host header
// and cannot send bytes that are not HTTP.
// Run: corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 test:http-edge
// Expected results: the behavior table of
// docs/build/refactor/target-structure/reports/task-10-diagnose-shared-http-behavior.md and the route
// facts of docs/build/refactor/target-structure/reports/task-09-inventory-http-routes.md. Project
// Structure rule 5 of "Trong lúc chuyển" keeps this HTTP contract during the move to Express.
// Failure check: changing 'no-store' to 'no-cache' in setSecurityHeaders failed the first test, and
// changing 'streams.size >= 64' to 'streams.size >= 65' in openSseStream failed the stream test.
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { request } from 'node:http'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '@deckagent/host'

const POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src blob: data:; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"

async function startHostForTest(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-http-edge-'))
  const app = await startLocalWeb({ dataDir: join(dir, 'data') })
  t.after(async () => {
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  return app
}

function send(app, { method = 'GET', path, headers = {}, body }) {
  const { port, host } = new URL(app.origin)
  const all = { host, authorization: `Bearer ${app.token}`, ...headers }
  for (const name of Object.keys(all)) if (all[name] === null) delete all[name]
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method, path, headers: all }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }),
      )
    })
    req.on('error', reject)
    req.end(body)
  })
}

function errorCode(response) {
  return JSON.parse(response.text).error.code
}

async function createSession(app) {
  const created = await send(app, {
    method: 'POST',
    path: '/api/sessions',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  assert.equal(created.status, 201)
  return JSON.parse(created.text).sessionId
}

test('API and page responses carry the four security headers and no X-Powered-By or ETag', async t => {
  const app = await startHostForTest(t)
  for (const response of [
    await send(app, { path: '/api/sessions' }),
    await send(app, { path: '/', headers: { authorization: null } }),
  ]) {
    assert.equal(response.status, 200)
    assert.equal(response.headers['cache-control'], 'no-store')
    assert.equal(response.headers['x-content-type-options'], 'nosniff')
    assert.equal(response.headers['referrer-policy'], 'no-referrer')
    assert.equal(response.headers['content-security-policy'], POLICY)
    assert.equal(response.headers['x-powered-by'], undefined)
    assert.equal(response.headers.etag, undefined)
  }
})

test('A request with a foreign Host header or a foreign Origin header gets 403 ORIGIN_DENIED', async t => {
  const app = await startHostForTest(t)
  const foreignHost = await send(app, { path: '/api/sessions', headers: { host: 'example.test' } })
  assert.equal(foreignHost.status, 403)
  assert.equal(errorCode(foreignHost), 'ORIGIN_DENIED')
  const foreignOrigin = await send(app, { path: '/api/sessions', headers: { origin: 'http://example.test' } })
  assert.equal(foreignOrigin.status, 403)
  assert.equal(errorCode(foreignOrigin), 'ORIGIN_DENIED')
})

test('A request with a query string gets 400 INVALID_REQUEST', async t => {
  const app = await startHostForTest(t)
  const response = await send(app, { path: '/api/sessions?view=all' })
  assert.equal(response.status, 400)
  assert.deepEqual(JSON.parse(response.text), {
    error: { code: 'INVALID_REQUEST', message: 'Request could not be completed' },
  })
})

test('HEAD and OPTIONS requests get 404, and OPTIONS gets no Allow header', async t => {
  const app = await startHostForTest(t)
  assert.equal((await send(app, { method: 'HEAD', path: '/api/sessions' })).status, 404)
  assert.equal((await send(app, { method: 'HEAD', path: '/', headers: { authorization: null } })).status, 404)
  const options = await send(app, { method: 'OPTIONS', path: '/api/sessions' })
  assert.equal(options.status, 404)
  assert.equal(errorCode(options), 'NOT_FOUND')
  assert.equal(options.headers.allow, undefined)
})

test('Path matching is exact: a trailing slash or other letter case gets 404 NOT_FOUND as JSON', async t => {
  const app = await startHostForTest(t)
  for (const path of ['/api/sessions/', '/api/Sessions', '/API/sessions']) {
    const response = await send(app, { path })
    assert.equal(response.status, 404, path)
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8', path)
    assert.deepEqual(
      JSON.parse(response.text),
      { error: { code: 'NOT_FOUND', message: 'Request could not be completed' } },
      path,
    )
  }
})

test('A chat ID of 100 word characters reaches the route, and 101 characters or a %20 does not', async t => {
  const app = await startHostForTest(t)
  const reached = await send(app, { path: `/api/sessions/${'a'.repeat(100)}/history` })
  assert.equal(reached.status, 404)
  assert.equal(errorCode(reached), 'SESSION_NOT_FOUND')
  for (const path of [`/api/sessions/${'a'.repeat(101)}/history`, '/api/sessions/a%20b/history']) {
    const response = await send(app, { path })
    assert.equal(response.status, 404, path)
    assert.equal(errorCode(response), 'NOT_FOUND', path)
  }
})

test('A JSON route rejects a body that is not application/json with 415 JSON_REQUIRED', async t => {
  const app = await startHostForTest(t)
  const response = await send(app, {
    method: 'POST',
    path: '/api/sessions',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  })
  assert.equal(response.status, 415)
  assert.equal(errorCode(response), 'JSON_REQUIRED')
})

test('A JSON body of 262144 bytes reaches the route, and 262145 bytes gets 413 REQUEST_TOO_LARGE', async t => {
  const app = await startHostForTest(t)
  const atLimit = JSON.stringify('a'.repeat(262142))
  assert.equal(Buffer.byteLength(atLimit), 262144)
  const reached = await send(app, {
    method: 'POST',
    path: '/api/sessions',
    headers: { 'content-type': 'application/json' },
    body: atLimit,
  })
  assert.equal(reached.status, 400)
  assert.equal(errorCode(reached), 'INVALID_SESSION')
  const overLimit = JSON.stringify('a'.repeat(262143))
  assert.equal(Buffer.byteLength(overLimit), 262145)
  const rejected = await send(app, {
    method: 'POST',
    path: '/api/sessions',
    headers: { 'content-type': 'application/json' },
    body: overLimit,
  })
  assert.equal(rejected.status, 413)
  assert.equal(errorCode(rejected), 'REQUEST_TOO_LARGE')
})

test('A JSON body that does not parse gets 400 INVALID_REQUEST', async t => {
  const app = await startHostForTest(t)
  const response = await send(app, {
    method: 'POST',
    path: '/api/sessions',
    headers: { 'content-type': 'application/json' },
    body: '{',
  })
  assert.equal(response.status, 400)
  assert.equal(errorCode(response), 'INVALID_REQUEST')
})

test('An upload with two expectedRevision fields gets 400 INVALID_REQUEST', async t => {
  const app = await startHostForTest(t)
  const sessionId = await createSession(app)
  const field = '--b\r\nContent-Disposition: form-data; name="expectedRevision"\r\n\r\n0\r\n'
  const response = await send(app, {
    method: 'POST',
    path: `/api/sessions/${sessionId}/attachments`,
    headers: { 'content-type': 'multipart/form-data; boundary=b' },
    body: `${field}${field}--b--\r\n`,
  })
  assert.equal(response.status, 400)
  assert.equal(errorCode(response), 'INVALID_REQUEST')
})

test('A deck stream opens with event-stream headers, and the 65th open stream gets 429 TOO_MANY_STREAMS', async t => {
  const app = await startHostForTest(t)
  const sessionId = await createSession(app)
  const { port, host } = new URL(app.origin)
  const open = () =>
    new Promise((resolve, reject) => {
      const req = request(
        {
          host: '127.0.0.1',
          port,
          path: `/api/sessions/${sessionId}/deck/events`,
          headers: { host, authorization: `Bearer ${app.token}` },
        },
        res => resolve({ req, res }),
      )
      req.on('error', reject)
      req.end()
    })
  const streams = []
  t.after(() => {
    for (const stream of streams) stream.req.destroy()
  })
  for (let index = 0; index < 64; index += 1) streams.push(await open())
  const first = streams[0].res
  assert.equal(first.statusCode, 200)
  assert.equal(first.headers['content-type'], 'text/event-stream')
  assert.equal(first.headers['x-accel-buffering'], 'no')
  assert.equal(first.headers['cache-control'], 'no-store')
  const extra = await open()
  const chunks = []
  extra.res.on('data', chunk => chunks.push(chunk))
  await new Promise(resolve => extra.res.on('end', resolve))
  assert.equal(extra.res.statusCode, 429)
  assert.equal(JSON.parse(Buffer.concat(chunks).toString('utf8')).error.code, 'TOO_MANY_STREAMS')
})

test('Bytes that are not HTTP close the connection with no response bytes', async t => {
  const app = await startHostForTest(t)
  const socket = connect(Number(new URL(app.origin).port), '127.0.0.1')
  const received = []
  socket.on('data', chunk => received.push(chunk))
  await new Promise(resolve => socket.once('connect', resolve))
  socket.write('NOT A REQUEST\r\n\r\n')
  await new Promise(resolve => socket.once('close', resolve))
  assert.equal(Buffer.concat(received).length, 0)
})
