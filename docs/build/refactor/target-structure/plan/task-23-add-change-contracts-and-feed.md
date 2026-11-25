# Task 23: Add the change notice contracts, workspace body schemas and Host ChangeFeed

Read this file to learn the steps of Task 23, which adds the change notice contracts, the workspace body Zod decoders, and the Host `ChangeFeed` with `GET /api/changes`.

Revision 3c adds `version` and change notices to the `workspaces` module. Before the store and routes use them, the shared contracts package needs the `ChangeNotice` types and decoders, and the workspace write body Zod decoders. The HTTP edge also needs `ChangeFeed` and the SSE route `GET /api/changes` wired into `startHost` with the shared `streams` set. This task changes no existing workspace route or `WorkspaceList` shape, so every existing test keeps passing.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/codebase-design/SKILL.md`
- `packages/host/contracts/src/index.ts` (57 lines)
- `packages/host/contracts/src/validation-primitives.ts` (36 lines)
- `packages/host/contracts/tests/validation.test.mjs` (283 lines)
- `packages/host/api/src/index.ts` (71 lines)
- `apps/host/src/http/start-host.ts` (55 lines)
- `packages/host/api/src/transport/deck-routes.ts` (47 lines)

**Files:**

- Create: `packages/host/contracts/src/changes.ts`
- Create: `packages/host/contracts/src/workspace-validation.ts`
- Create: `apps/host/src/http/change-feed.ts`
- Create: `apps/host/tests/change-feed.test.mjs`
- Change (edit script): `packages/host/contracts/src/index.ts`, `packages/host/contracts/tests/validation.test.mjs`, `packages/host/api/src/index.ts`, `apps/host/src/http/start-host.ts`, `package.json`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-23-add-change-contracts-and-feed.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-23-add-change-contracts-and-feed.md`

**Interfaces:**

- Uses: `nonNegativeInt` and `invalidResponse` from `packages/host/contracts/src/validation-primitives.ts`. `RequestValidationError` from `packages/host/contracts/src/request-validation.ts`. `openSseStream` from `packages/host/api/src/transport/sse.ts`. `createHostRoutes`, `route` and `HostOptions` from `@deckagent/host-api`.
- Produces:
  - In `@deckagent/host-contracts`: types `ChangeTopic`, `ChangeNotice`, `PublishChange`, and functions `decodeChangeNotice`, `decodeWorkspaceAddBody`, `decodeWorkspaceSelectBody`, `decodeWorkspaceRenameBody`, `decodeWorkspaceRelinkBody` and `decodeWorkspaceRemoveBody`.
  - In `@deckagent/host-api`: export `openSseStream`.
  - In `apps/host/src/http/change-feed.ts`: interfaces `ChangeFeed` and `HostChangeTopic`, and functions `createChangeFeed(): ChangeFeed` and `createChangeRoutes(feed: ChangeFeed, hostTopics: readonly HostChangeTopic[], streams: Set<ServerResponse>): Router`.
  - In `apps/host/src/http/start-host.ts`: `StartHostOptions` extending `HostOptions` with optional `changes?: { readonly feed: ChangeFeed; readonly hostTopics: readonly HostChangeTopic[] }`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 3 prints a line that starts with a file name and `expected`.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of Step 2 are part of the code.
- Change `WorkspaceList` or any file in `apps/host/src/modules/workspaces/` in this task.
- Change the code of Step 2. When `build` or `lint` reports an error in it, STOP.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" packages/host/contracts/src/index.ts packages/host/contracts/src/validation-primitives.ts packages/host/contracts/tests/validation.test.mjs packages/host/api/src/index.ts apps/host/src/http/start-host.ts`

Expected: PASS. Five lines, in this order: `57`, `36`, `283`, `71`, `55`.

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 test:tools-browser`

Expected: PASS. The output contains `# pass 14` and `# fail 0`.

- [ ] **Step 2: Write the new source and test files**

Write each file below with the exact content.

`packages/host/contracts/src/changes.ts`:

```ts
import { z } from 'zod'
import { invalidResponse, nonNegativeInt } from './validation-primitives.ts'

export type ChangeTopic =
  | 'deck'
  | 'brief'
  | 'outline'
  | 'draft'
  | 'chats'
  | 'workspaces'
  | 'providers'
  | 'preferences'

export interface ChangeNotice {
  readonly topic: ChangeTopic
  readonly key: string
  readonly version: number
}

export type PublishChange = (notice: ChangeNotice) => void

const changeTopicSchema = z.enum([
  'deck',
  'brief',
  'outline',
  'draft',
  'chats',
  'workspaces',
  'providers',
  'preferences',
])

const changeNoticeSchema = z.strictObject({
  topic: changeTopicSchema,
  key: z.string().min(1).max(200),
  version: nonNegativeInt,
})

export function decodeChangeNotice(value: unknown): ChangeNotice {
  const parsed = changeNoticeSchema.safeParse(value)
  if (!parsed.success) return invalidResponse()
  return parsed.data
}
```

`packages/host/contracts/src/workspace-validation.ts`:

```ts
import { z } from 'zod'
import { RequestValidationError } from './request-validation.ts'
import { nonNegativeInt } from './validation-primitives.ts'

const addWorkspaceBodySchema = z.strictObject({
  folder: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const selectWorkspaceBodySchema = z.strictObject({
  id: z.string(),
  expectedVersion: nonNegativeInt,
})

const renameWorkspaceBodySchema = z.strictObject({
  name: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const relinkWorkspaceBodySchema = z.strictObject({
  folder: z.unknown().optional(),
  expectedVersion: nonNegativeInt,
})

const removeWorkspaceBodySchema = z.strictObject({
  expectedVersion: nonNegativeInt,
})

function invalidBody(): never {
  throw new RequestValidationError('INVALID_REQUEST', 'Request payload is invalid')
}

export function decodeWorkspaceAddBody(value: unknown): {
  readonly folder: unknown
  readonly expectedVersion: number
} {
  const parsed = addWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { folder: parsed.data.folder, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceSelectBody(value: unknown): { readonly id: string; readonly expectedVersion: number } {
  const parsed = selectWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}

export function decodeWorkspaceRenameBody(value: unknown): {
  readonly name: unknown
  readonly expectedVersion: number
} {
  const parsed = renameWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { name: parsed.data.name, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceRelinkBody(value: unknown): {
  readonly folder: unknown
  readonly expectedVersion: number
} {
  const parsed = relinkWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return { folder: parsed.data.folder, expectedVersion: parsed.data.expectedVersion }
}

export function decodeWorkspaceRemoveBody(value: unknown): { readonly expectedVersion: number } {
  const parsed = removeWorkspaceBodySchema.safeParse(value)
  if (!parsed.success) invalidBody()
  return parsed.data
}
```

`apps/host/src/http/change-feed.ts`:

```ts
import type { ServerResponse } from 'node:http'
import { openSseStream, route } from '@deckagent/host-api'
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

export function createChangeFeed(): ChangeFeed {
  const listeners = new Map<string, Set<(notice: ChangeNotice) => void>>()
  const slot = (topic: ChangeTopic, key: string) => `${topic}\0${key}`
  return {
    publish(notice) {
      const bucket = listeners.get(slot(notice.topic, notice.key))
      if (!bucket) return
      for (const listener of [...bucket]) {
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

/** Streams Host-scoped invalidation notices on GET /api/changes. Every connect starts at each topic's current version. */
export function createChangeRoutes(
  feed: ChangeFeed,
  hostTopics: readonly HostChangeTopic[],
  streams: Set<ServerResponse>,
): Router {
  const router = Router({ caseSensitive: true, strict: true })
  router.get(
    '/api/changes',
    route((_req, res) => {
      const send = (notice: ChangeNotice) => {
        if (res.destroyed || res.writableEnded) return
        if (!res.write(`event: change\ndata: ${JSON.stringify(notice)}\n\n`)) res.end()
      }
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
  return router
}
```

`apps/host/tests/change-feed.test.mjs`:

```js
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
```

- [ ] **Step 3: Run the edit script**

Save the script below as `deckagent-task23-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
let changed = 0
function edit(file, pairs) {
  const original = readFileSync(file, 'utf8')
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  let text = original.replace(/\r\n/g, '\n')
  for (const [from, to, count] of pairs) {
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from.slice(0, 60))}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, eol === '\n' ? text : text.replace(/\n/g, eol))
  changed += 1
}

edit('packages/host/contracts/src/index.ts', [
  [
    "export { decodeGeneration } from './generation-validation.ts'\n",
    "export { decodeGeneration } from './generation-validation.ts'\nexport { decodeChangeNotice, type ChangeNotice, type ChangeTopic, type PublishChange } from './changes.ts'\nexport {\n  decodeWorkspaceAddBody,\n  decodeWorkspaceRelinkBody,\n  decodeWorkspaceRemoveBody,\n  decodeWorkspaceRenameBody,\n  decodeWorkspaceSelectBody,\n} from './workspace-validation.ts'\n",
    1,
  ],
])

edit('packages/host/contracts/tests/validation.test.mjs', [
  [
    "  decodeBriefView,\n  decodeGeneration,\n  requestEvent,\n",
    "  decodeBriefView,\n  decodeChangeNotice,\n  decodeGeneration,\n  decodeWorkspaceAddBody,\n  decodeWorkspaceRelinkBody,\n  decodeWorkspaceRemoveBody,\n  decodeWorkspaceRenameBody,\n  decodeWorkspaceSelectBody,\n  requestEvent,\n",
    1,
  ],
])

const extraValidationTests = `
test('decodeChangeNotice accepts valid notices and rejects malformed shapes with INVALID_RESPONSE', () => {
  assert.deepEqual(decodeChangeNotice({ topic: 'workspaces', key: 'host', version: 0 }), {
    topic: 'workspaces',
    key: 'host',
    version: 0,
  })
  for (const bad of [
    null,
    { topic: 'unknown', key: 'host', version: 0 },
    { topic: 'workspaces', key: '', version: 0 },
    { topic: 'workspaces', key: 'host', version: -1 },
    { topic: 'workspaces', key: 'host', version: 1.5 },
    { topic: 'workspaces', key: 'host', version: 0, extra: true },
  ]) {
    assert.throws(() => decodeChangeNotice(bad), { message: 'INVALID_RESPONSE' })
  }
})

test('workspace body decoders enforce expectedVersion and strict keys while keeping domain fields unchecked', () => {
  assert.deepEqual(decodeWorkspaceAddBody({ folder: '/project', expectedVersion: 0 }), {
    folder: '/project',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeWorkspaceAddBody({ expectedVersion: 1 }), { folder: undefined, expectedVersion: 1 })
  assert.deepEqual(decodeWorkspaceAddBody({ folder: 42, expectedVersion: 2 }), { folder: 42, expectedVersion: 2 })
  assert.deepEqual(decodeWorkspaceSelectBody({ id: 'default', expectedVersion: 0 }), {
    id: 'default',
    expectedVersion: 0,
  })
  assert.deepEqual(decodeWorkspaceRenameBody({ name: 'x'.repeat(101), expectedVersion: 3 }), {
    name: 'x'.repeat(101),
    expectedVersion: 3,
  })
  assert.deepEqual(decodeWorkspaceRelinkBody({ folder: '/other', expectedVersion: 4 }), {
    folder: '/other',
    expectedVersion: 4,
  })
  assert.deepEqual(decodeWorkspaceRemoveBody({ expectedVersion: 5 }), { expectedVersion: 5 })

  for (const call of [
    () => decodeWorkspaceAddBody({ folder: '/project' }),
    () => decodeWorkspaceAddBody({ folder: '/project', expectedVersion: -1 }),
    () => decodeWorkspaceAddBody({ folder: '/project', expectedVersion: 0, extra: 1 }),
    () => decodeWorkspaceSelectBody({ id: 1, expectedVersion: 0 }),
    () => decodeWorkspaceSelectBody({ id: 'default' }),
    () => decodeWorkspaceRenameBody({ name: 'ok', expectedVersion: 1.2 }),
    () => decodeWorkspaceRelinkBody({ folder: '/a', expectedVersion: 0, extra: true }),
    () => decodeWorkspaceRemoveBody({}),
    () => decodeWorkspaceRemoveBody({ expectedVersion: 0, extra: true }),
  ]) {
    assert.throws(call, error => error instanceof RequestValidationError && error.code === 'INVALID_REQUEST')
  }
})
`
writeFileSync(
  'packages/host/contracts/tests/validation.test.mjs',
  readFileSync('packages/host/contracts/tests/validation.test.mjs', 'utf8').replace(/\r\n/g, '\n') + extraValidationTests,
)

edit('packages/host/api/src/index.ts', [
  [
    "export { param, params, route } from './transport/route-params.ts'\n",
    "export { param, params, route } from './transport/route-params.ts'\nexport { openSseStream } from './transport/sse.ts'\n",
    1,
  ],
])

edit('apps/host/src/http/start-host.ts', [
  [
    "import { createHttpApp } from './app.ts'\n",
    "import { createHttpApp } from './app.ts'\nimport { createChangeRoutes, type ChangeFeed, type HostChangeTopic } from './change-feed.ts'\n\nexport interface StartHostOptions extends HostOptions {\n  readonly changes?: {\n    readonly feed: ChangeFeed\n    readonly hostTopics: readonly HostChangeTopic[]\n  }\n}\n",
    1,
  ],
  [
    'export async function startHost(options: HostOptions) {\n  const token = randomBytes(32).toString(\'hex\')\n  const routes = createHostRoutes(options)\n',
    'export async function startHost(options: StartHostOptions) {\n  const token = randomBytes(32).toString(\'hex\')\n  const routes = createHostRoutes(options)\n  if (options.changes) {\n    routes.router.use(createChangeRoutes(options.changes.feed, options.changes.hostTopics, routes.streams))\n  }\n',
    1,
  ],
])

edit('package.json', [
  [
    '"test:tools-browser": "node --test packages/host/contracts/tests/validation.test.mjs apps/host/tests/http-server.test.mjs apps/web/tests/browser-runtime.test.mjs e2e/local-web.test.mjs",',
    '"test:tools-browser": "node --test packages/host/contracts/tests/validation.test.mjs apps/host/tests/http-server.test.mjs apps/host/tests/change-feed.test.mjs apps/web/tests/browser-runtime.test.mjs e2e/local-web.test.mjs",',
    1,
  ],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`task23-edits: ${changed} files changed, 0 failures`)
```

Run from the repository root: `node <temporary folder>/deckagent-task23-edits.mjs`

Expected: PASS. The output is `task23-edits: 5 files changed, 0 failures`.

- [ ] **Step 4: Build and run the checks**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 exec biome format packages/host/contracts/src/changes.ts packages/host/contracts/src/workspace-validation.ts packages/host/contracts/src/index.ts packages/host/contracts/tests/validation.test.mjs packages/host/api/src/index.ts apps/host/src/http/change-feed.ts apps/host/src/http/start-host.ts apps/host/tests/change-feed.test.mjs`

Expected: PASS. The output contains `No fixes applied` and does not contain `format ━`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:tools-browser`

Expected: PASS. The output contains `# pass 19` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:http-edge`

Expected: PASS. The output contains `# pass 12` and `# fail 0`.

- [ ] **Step 5: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths in any order, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
 M apps/host/src/http/start-host.ts
?? apps/host/src/http/change-feed.ts
?? apps/host/tests/change-feed.test.mjs
 M package.json
 M packages/host/api/src/index.ts
?? packages/host/contracts/src/changes.ts
 M packages/host/contracts/src/index.ts
?? packages/host/contracts/src/workspace-validation.ts
 M packages/host/contracts/tests/validation.test.mjs
```

- [ ] **Step 6: Write the report file**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 23 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-23-add-change-contracts-and-feed.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-23-add-change-contracts-and-feed.md` with:
   - H1 `# Task 23: Add the change notice contracts, workspace body schemas and Host ChangeFeed report` and the purpose line `Read this file to learn which change notice contracts, workspace body schemas and Host ChangeFeed code Task 23 added, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove: `startLocalWeb` does not wire `ChangeFeed` yet, and `workspaces.routes.ts` does not call the new body decoders yet. Task 24 wires them into the `workspaces` module.
3. Add a row for Task 23 in `docs/build/refactor/target-structure/reports/README.md`. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

- [ ] **Step 7: Commit and push**

Do this step only when Steps 1 to 6 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`:

   ```text
   - Add `ChangeTopic`, `ChangeNotice`, `PublishChange`, `decodeChangeNotice` and workspace body Zod decoders to `@deckagent/host-contracts`, plus `ChangeFeed` and `GET /api/changes` in `apps/host/src/http/`. Task 23 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 7 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "feat: add change notice contracts, workspace body schemas and Host ChangeFeed"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start Task 24 until a person approves the report.
