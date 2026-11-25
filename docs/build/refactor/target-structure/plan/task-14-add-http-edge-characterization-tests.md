# Task 14: Add the HTTP edge characterization tests

Read this file to learn the steps of Task 14, which adds black-box tests for the shared HTTP behavior that no test checks today.

The report of Task 10 lists 21 shared behaviors with `Not found` in the `Tests` column. The report of Task 9 lists path facts that Express 5 can change. Examples are a trailing slash, letter case and the character class of a path parameter. The move to Express can drop such a behavior with no failed test. This task adds one test file that checks these behaviors on the current server. The tests must pass before any Express change. A later task runs the same file without changes to its expected values.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `docs/conventions/testware.md`
- `packages/host/api/src/index.ts` (147 lines)
- `packages/host/api/src/transport/http-io.ts` (45 lines)
- `packages/host/api/src/transport/sse.ts` (16 lines)
- `e2e/local-web.test.mjs` (lines 1-40)

**Files:**

- Create: `e2e/http-edge.test.mjs`
- Change: `package.json` (section `scripts`, one new line)
- Change, then restore in Step 5: `packages/host/api/src/index.ts` (line 39) and `packages/host/api/src/transport/sse.ts` (line 5)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-14-add-http-edge-characterization-tests.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-14-add-http-edge-characterization-tests.md`

**Interfaces:**

- Uses: `startLocalWeb({ dataDir })` from `@deckagent/local-web`. It returns `{ origin, token, close() }`.
- Produces: the test file `e2e/http-edge.test.mjs` with 12 tests, and the script `test:http-edge` in `package.json` with the value `node --test e2e/http-edge.test.mjs`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- A test fails in Step 4. The test records the current behavior, so a failure means that the current behavior is different from the reports of Tasks 9 and 10. Do not change the test.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The header comment of the test file in Step 2 is part of the file.
- Commit or push.
- Change an expected value in the test file.
- Keep a change in `packages/host/api/src/` after Step 5.

## Behaviors that this task does not test

| Behavior (Task 10 ID) | Reason |
| --- | --- |
| `requestTimeout` and `headersTimeout` of 10000 ms (B13, B14) | A test must wait 10 seconds of real time. Testware forbids a fixed wait. |
| Heartbeat every 15000 ms (B35) | Same reason. |
| `500 HOST_ERROR` (B31) | No HTTP request can make a route throw an unknown error. |
| Field size, part count and header pair limits of multipart (B39, B40, B41) | The rule for `expectedRevision` rejects the same inputs with the same `400 INVALID_REQUEST`. A black-box test cannot see which check rejected the input. |

- [ ] **Step 1: Check the start state**

Run: `wc -l packages/host/api/src/index.ts packages/host/api/src/transport/http-io.ts packages/host/api/src/transport/sse.ts && git status --short`

Expected: PASS. The line counts are `147`, `45` and `16`, and `git status --short` prints no line.

- [ ] **Step 2: Create `e2e/http-edge.test.mjs`**

Write the text below as the complete file. Do not copy the outer fence.

````js
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
import { startLocalWeb } from '@deckagent/local-web'

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
````

Add this line to the `scripts` section of `package.json`, directly after the line of `test:env-startup`:

```json
    "test:http-edge": "node --test e2e/http-edge.test.mjs",
```

- [ ] **Step 3: Build and lint**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

- [ ] **Step 4: Run the tests and make sure that they pass on the current server**

Run: `corepack pnpm@11.28.5 test:http-edge`

Expected: PASS. The output contains `# pass 12` and `# fail 0`.

This test records the current behavior, so it passes before a code change. Step 5 proves that two of the tests can fail.

- [ ] **Step 5: Make sure that the tests can fail, then restore the code**

Make these two temporary changes:

1. In `packages/host/api/src/index.ts` line 39, change `res.setHeader('cache-control', 'no-store')` to `res.setHeader('cache-control', 'no-cache')`.
2. In `packages/host/api/src/transport/sse.ts` line 5, change `streams.size >= 64` to `streams.size >= 65`.

Run: `corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 test:http-edge`

Expected: FAIL in two tests. The output contains `not ok 1 - API and page responses carry the four security headers and no X-Powered-By or ETag`, `not ok 11 - A deck stream opens with event-stream headers, and the 65th open stream gets 429 TOO_MANY_STREAMS`, `# pass 10` and `# fail 2`.

Restore the two files:

Run: `git checkout -- packages/host/api/src/index.ts packages/host/api/src/transport/sse.ts && corepack pnpm@11.28.5 build && corepack pnpm@11.28.5 test:http-edge`

Expected: PASS. The output contains `# pass 12` and `# fail 0`.

- [ ] **Step 6: Check the changed files**

Run: `git status --short`

Expected: PASS. The output has these lines and no other line outside `docs/build/refactor/target-structure/`: ` M package.json` and `?? e2e/http-edge.test.mjs`.

- [ ] **Step 7: Write the report file and stop**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 14 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-14-add-http-edge-characterization-tests.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-14-add-http-edge-characterization-tests.md` with:
   - H1 `# Task 14: Add the HTTP edge characterization tests report` and the purpose line `Read this file to learn which shared HTTP behaviors the new tests check, and the proof that the tests can fail.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command, including the failed run of Step 5.
   - The behaviors that the task does not test, copied from the table in this file.
   - What the commands do not prove: the tests check one request for each behavior. They do not prove the behavior for each route. Step 5 breaks two behaviors only, so it proves that two of the 12 tests can fail.
3. Add a row for Task 14 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-14-add-http-edge-characterization-tests.md`. Expected: the output contains `0 violations`.
5. Mark Step 7 as `- [x]`.

**STOP** and send the report summary. Do not start Task 15 until a person approves the report.
