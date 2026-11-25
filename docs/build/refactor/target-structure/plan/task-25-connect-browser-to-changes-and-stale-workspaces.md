# Task 25: Connect the Browser to /api/changes and handle WORKSPACES_STALE

Read this file to learn the steps of Task 25, which connects the Browser to `GET /api/changes`, refreshes the workspace list on a newer `version`, and handles `WORKSPACES_STALE`.

After Task 24, the Local Host serves `GET /api/changes` for the `workspaces` topic and returns `409 WORKSPACES_STALE` on an old `expectedVersion`. This task adds `ChangeClient` and `ChangeWatcher` to the Browser so one SSE connection watches Host-scoped change notices and reads the workspace list again when a newer `version` arrives. It also handles `WORKSPACES_STALE` in `workspace-view.ts`: the Browser reads the list again, shows the new list and shows a message, and does not send the write again.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/transport/index.ts` (6 lines)
- `apps/web/src/browser/transport/deck-client.ts` (lines 160-176)
- `apps/web/src/browser/features/deck/deck-model.ts` (lines 100-134)
- `apps/web/src/browser/features/workspaces/workspace-view.ts` (lines 14-48 and 220-245)
- `apps/web/src/browser/boot.ts` (lines 1-35 and 370-393)
- `apps/web/tests/fixtures/browser-driver.mjs` (11 lines)

**Files:**

- Create: `apps/web/src/browser/transport/change-client.ts`
- Create: `apps/web/src/browser/change-watcher.ts`
- Create: `apps/web/tests/change-watcher.test.mjs`
- Change (edit script): `apps/web/src/browser/transport/index.ts`, `apps/web/tests/fixtures/browser-driver.mjs`, `apps/web/src/browser/features/workspaces/workspace-view.ts`, `apps/web/src/browser/boot.ts`, `package.json`, `e2e/browser-smoke.test.mjs`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-25-connect-browser-to-changes-and-stale-workspaces.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-25-connect-browser-to-changes-and-stale-workspaces.md`

**Interfaces:**

- Uses: `ChangeNotice` and `decodeChangeNotice` from `@deckagent/host-contracts`. `fetchAuthorized` and `readSseFrames` from `apps/web/src/browser/transport/http.ts`.
- Produces:
  - In `apps/web/src/browser/transport/change-client.ts`: `ChangeClient` with `watch(signal: AbortSignal): AsyncGenerator<ChangeNotice>`. Exported from `apps/web/src/browser/transport/index.ts` and `apps/web/tests/fixtures/browser-driver.mjs`.
  - In `apps/web/src/browser/change-watcher.ts`: `ChangeWatcher` with `start(): void` and `close(): void`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 3 prints a line that starts with a file name and `expected`.
- A test suite in Step 4 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of Step 2 are part of the code.
- Change the code of Step 2. When `build` or `lint` reports an error in it, STOP.
- Change a file in `apps/host/` or `packages/`.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/web/src/browser/transport/index.ts apps/web/src/browser/features/workspaces/workspace-view.ts apps/web/src/browser/boot.ts apps/web/tests/fixtures/browser-driver.mjs`

Expected: PASS. Four lines, in this order: `6`, `367`, `393`, `11`.

- [ ] **Step 2: Write the new Browser files and unit test**

Write each file below with the exact content.

`apps/web/src/browser/transport/change-client.ts`:

```ts
import { decodeChangeNotice } from '@deckagent/host-contracts'
import type { ChangeNotice } from '@deckagent/host-contracts'
import { fetchAuthorized, readSseFrames } from './http.ts'

/** Streams Host-scoped invalidation notices from GET /api/changes. */
export class ChangeClient {
  constructor(
    private readonly origin: string,
    private readonly token: string,
  ) {}

  async *watch(signal: AbortSignal): AsyncGenerator<ChangeNotice> {
    const response = await fetchAuthorized(this.origin, this.token, '/api/changes', { signal })
    if (!response.ok) throw new Error(response.status === 401 ? 'AUTH_REQUIRED' : 'CHANGES_REQUEST_FAILED')
    const frames = readSseFrames(response, {
      maxBufferBytes: 65536,
      lostError: 'CHANGES_CONNECTION_LOST',
      invalidError: 'INVALID_RESPONSE',
      eventName: 'change',
      matchMode: 'prefix',
    })
    for await (const data of frames) yield decodeChangeNotice(JSON.parse(data))
  }
}
```

`apps/web/src/browser/change-watcher.ts`:

```ts
import type { ChangeNotice } from '@deckagent/host-contracts'
import type { ChangeClient } from './transport/index.ts'

export interface ChangeWatcherOptions {
  readonly client: Pick<ChangeClient, 'watch'>
  readonly onNotice: (notice: ChangeNotice) => Promise<void> | void
  readonly retryBaseMs?: number
  readonly retryMaxMs?: number
}

/** Keeps one SSE connection to GET /api/changes and reconnects after a drop. */
export class ChangeWatcher {
  private control: AbortController | undefined

  constructor(private readonly options: ChangeWatcherOptions) {}

  start(): void {
    if (this.control && !this.control.signal.aborted) return
    const control = new AbortController()
    this.control = control
    void this.follow(control.signal)
  }

  close(): void {
    this.control?.abort()
    this.control = undefined
  }

  private async follow(signal: AbortSignal): Promise<void> {
    const base = this.options.retryBaseMs ?? 500
    const max = this.options.retryMaxMs ?? 10000
    let retry = base
    while (!signal.aborted) {
      try {
        for await (const notice of this.options.client.watch(signal)) {
          if (signal.aborted) return
          retry = base
          await this.options.onNotice(notice)
        }
      } catch (error) {
        if (signal.aborted) return
        if (error instanceof Error && error.message === 'AUTH_REQUIRED') return
      }
      await new Promise<void>(resolve => {
        const done = () => {
          clearTimeout(timer)
          signal.removeEventListener('abort', done)
          resolve()
        }
        const timer = setTimeout(done, retry)
        signal.addEventListener('abort', done, { once: true })
      })
      retry = Math.min(retry * 2, max)
    }
  }
}
```

`apps/web/tests/change-watcher.test.mjs`:

```js
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { ChangeWatcher } from '../lib/browser-types/change-watcher.js'
import { ChangeClient } from './fixtures/browser-driver.mjs'

async function until(check) {
  for (let i = 0; i < 100; i += 1) {
    if (check()) return
    await delay(10)
  }
  assert.fail('Condition did not settle')
}

test('ChangeClient.watch reads fragmented change frames, ignores heartbeats and rejects malformed data', async t => {
  let mode = 'valid'
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    if (mode === 'invalid') {
      res.end('event: change\ndata: {"topic":"unknown","key":"host","version":1}\n\n')
      return
    }
    const payload = Buffer.from(
      ': heartbeat\n\nevent: change\ndata: {"topic":"workspaces","key":"host","version":0}\n\nevent: change\ndata: {"topic":"workspaces","key":"host","version":2}\n\n',
    )
    res.write(payload.subarray(0, 40))
    setImmediate(() => res.end(payload.subarray(40)))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(
    () =>
      new Promise(resolve => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )

  const client = new ChangeClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  const received = []
  await assert.rejects(async () => {
    for await (const notice of client.watch(new AbortController().signal)) received.push(notice)
  }, /CHANGES_CONNECTION_LOST/)
  assert.deepEqual(received, [
    { topic: 'workspaces', key: 'host', version: 0 },
    { topic: 'workspaces', key: 'host', version: 2 },
  ])

  mode = 'invalid'
  await assert.rejects(async () => {
    for await (const notice of client.watch(new AbortController().signal)) {
      assert.fail(`Yielded malformed notice: ${JSON.stringify(notice)}`)
    }
  }, /INVALID_RESPONSE/)
})

test('ChangeWatcher delivers notices, reconnects after a drop and stops on close', async t => {
  let connections = 0
  const notices = []
  const watcher = new ChangeWatcher({
    retryBaseMs: 10,
    retryMaxMs: 20,
    client: {
      async *watch(signal) {
        connections += 1
        yield { topic: 'workspaces', key: 'host', version: connections }
        if (connections === 1) throw new Error('CHANGES_CONNECTION_LOST')
        await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
      },
    },
    onNotice: notice => {
      notices.push(notice)
    },
  })
  t.after(() => watcher.close())
  watcher.start()
  await until(() => notices.length === 2)
  assert.equal(connections, 2)
  assert.deepEqual(notices, [
    { topic: 'workspaces', key: 'host', version: 1 },
    { topic: 'workspaces', key: 'host', version: 2 },
  ])
  watcher.close()
})

test('ChangeWatcher stops reconnecting after AUTH_REQUIRED', async t => {
  let connections = 0
  const watcher = new ChangeWatcher({
    retryBaseMs: 10,
    retryMaxMs: 20,
    client: {
      async *watch() {
        connections += 1
        throw new Error('AUTH_REQUIRED')
      },
    },
    onNotice: () => {},
  })
  t.after(() => watcher.close())
  watcher.start()
  await delay(60)
  assert.equal(connections, 1)
})
```

- [ ] **Step 3: Run the edit script**

Save the script below as `deckagent-task25-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository.

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

edit('apps/web/src/browser/transport/index.ts', [
  [
    "export { ConfirmationClient } from './confirmation-client.ts'\n",
    "export { ConfirmationClient } from './confirmation-client.ts'\nexport { ChangeClient } from './change-client.ts'\n",
    1,
  ],
])

edit('apps/web/tests/fixtures/browser-driver.mjs', [
  [
    '  BriefClient,\n  ConfirmationClient,\n',
    '  BriefClient,\n  ChangeClient,\n  ConfirmationClient,\n',
    1,
  ],
])

edit('apps/web/src/browser/features/workspaces/workspace-view.ts', [
  [
    "    case 'WORKSPACE_NOT_FOUND':\n      return 'Workspace này không còn được thiết lập. Danh sách đã được làm mới.'\n",
    "    case 'WORKSPACE_NOT_FOUND':\n      return 'Workspace này không còn được thiết lập. Danh sách đã được làm mới.'\n    case 'WORKSPACES_STALE':\n      return 'Danh sách workspace vừa thay đổi ở nơi khác. Danh sách đã được làm mới, hãy kiểm tra rồi thử lại.'\n",
    1,
  ],
  [
    "      if (reason instanceof Error && reason.message === 'WORKSPACE_NOT_FOUND')\n        management.workspaces().then(\n          next => {\n            state.list = next\n            renderWorkspaceList(dom, state)\n          },\n          () => {},\n        )\n",
    "      if (\n        reason instanceof Error &&\n        (reason.message === 'WORKSPACE_NOT_FOUND' || reason.message === 'WORKSPACES_STALE')\n      )\n        management.workspaces().then(\n          async next => {\n            state.list = next\n            renderWorkspaceList(dom, state)\n            await changed(next, false)\n          },\n          () => {},\n        )\n",
    1,
  ],
])

edit('apps/web/src/browser/boot.ts', [
  [
    '  BriefClient,\n  ConfirmationClient,\n',
    '  BriefClient,\n  ChangeClient,\n  ConfirmationClient,\n',
    1,
  ],
  [
    "import { createRequestRunner, sendBlocked } from './request-runner.ts'\n",
    "import { createRequestRunner, sendBlocked } from './request-runner.ts'\nimport { ChangeWatcher } from './change-watcher.ts'\n",
    1,
  ],
  [
    'const deckClient = new DeckClient(location.origin, token)\n',
    'const deckClient = new DeckClient(location.origin, token)\nconst changeClient = new ChangeClient(location.origin, token)\n',
    1,
  ],
  [
    'const navigation = createChatNavigation({\n',
    "const changeWatcher = new ChangeWatcher({\n  client: changeClient,\n  onNotice: async notice => {\n    if (notice.topic !== 'workspaces' || notice.key !== 'host') return\n    if (notice.version <= navigation.workspaces.version) return\n    const next = await management.workspaces()\n    if (next.version < navigation.workspaces.version) return\n    navigation.workspaces = next\n    workspaceUI.update(next)\n    navigation.renderChats()\n    controls()\n  },\n})\nconst navigation = createChatNavigation({\n",
    1,
  ],
  [
    '    deckModel.close()\n  },\n',
    '    deckModel.close()\n    changeWatcher.close()\n  },\n',
    1,
  ],
  [
    'run(navigation.start())\n',
    'run(\n  navigation.start().then(() => {\n    changeWatcher.start()\n  }),\n)\n',
    1,
  ],
])

edit('package.json', [
  [
    '"test:local-web": "node --test apps/web/tests/web-session.test.mjs apps/host/tests/web-management.test.mjs",',
    '"test:local-web": "node --test apps/web/tests/web-session.test.mjs apps/host/tests/web-management.test.mjs apps/web/tests/change-watcher.test.mjs",',
    1,
  ],
])

const extraBrowserSmokeTest = `
test('Browser updates workspaces from /api/changes and handles WORKSPACES_STALE without retrying', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-workspace-changes-'))
  let app, session
  t.after(async () => {
    try {
      await closeBrowser(session)
      if (app) await app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  const project = join(dir, 'Dự án từ tab khác')
  await mkdir(project, { recursive: true })
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: join(dir, 'home') })
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: \`\${app.origin}/#token=\${app.token}\` })
  await eventually(
    () =>
      evaluate(
        \`!!document.querySelector('.workspace-controls select option') && !!document.querySelector('.chat-navigation nav button[aria-current=true]')\`,
      ),
    'Browser boot failed',
  )

  const api = async (path, method = 'GET', body) => {
    const response = await fetch(\`\${app.origin}/api/\${path}\`, {
      method,
      headers: { authorization: \`Bearer \${app.token}\`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, data: await response.json() }
  }

  const added = await api('workspaces', 'POST', { folder: project, expectedVersion: 0 })
  assert.equal(added.status, 200)
  const addedId = added.data.selectedId
  await eventually(
    () =>
      evaluate(
        \`document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent === 'Dự án từ tab khác'\`,
      ),
    'Browser did not refresh workspace list after /api/changes notice',
  )

  const renamed = await api(\`workspaces/\${addedId}\`, 'PUT', { name: 'Tên mới bên ngoài', expectedVersion: 1 })
  assert.equal(renamed.status, 200)
  await eventually(
    () =>
      evaluate(
        \`document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent === 'Tên mới bên ngoài'\`,
      ),
    'Browser did not show renamed workspace after second /api/changes notice',
  )

  await evaluate(\`{
    const original = window.fetch;
    window.__workspaceWrites = 0;
    window.__workspaceReads = 0;
    window.fetch = async (url, init) => {
      const target = String(url);
      if (target.endsWith('/api/workspaces') && (!init?.method || init.method === 'GET')) {
        window.__workspaceReads += 1;
      }
      if (target.endsWith('/api/workspaces/\${addedId}') && init?.method === 'PUT') {
        window.__workspaceWrites += 1;
        const parsed = JSON.parse(String(init.body));
        return original(url, { ...init, body: JSON.stringify({ ...parsed, expectedVersion: 0 }) });
      }
      return original(url, init);
    };
  } true\`)

  await evaluate(\`document.querySelector('[data-action=rename-workspace]').click(); true\`)
  await eventually(() => evaluate(\`document.querySelector('.workspace-dialog').open\`), 'Rename dialog did not open')
  await evaluate(
    \`document.querySelector('.workspace-dialog input').value = 'Tên bị cũ'; document.querySelector('.workspace-dialog form').requestSubmit(); true\`,
  )
  await eventually(
    () =>
      evaluate(
        \`document.querySelector('.workspace-dialog [role=alert]').textContent.includes('Danh sách workspace vừa thay đổi ở nơi khác') && window.__workspaceReads >= 1\`,
      ),
    'WORKSPACES_STALE message or list refresh did not appear',
  )
  assert.equal(await evaluate(\`window.__workspaceWrites\`), 1, 'Browser must not resend the stale write')
  assert.equal(await evaluate(\`document.querySelector('.workspace-dialog').open\`), true)
  assert.equal(
    await evaluate(\`document.querySelector('.workspace-controls select').selectedOptions[0]?.textContent\`),
    'Tên mới bên ngoài',
  )
})
`
writeFileSync(
  'e2e/browser-smoke.test.mjs',
  readFileSync('e2e/browser-smoke.test.mjs', 'utf8').replace(/\r\n/g, '\n') + extraBrowserSmokeTest,
)

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`task25-edits: ${changed} files changed, 0 failures`)
```

Run from the repository root: `node <temporary folder>/deckagent-task25-edits.mjs`

Expected: PASS. The output is `task25-edits: 5 files changed, 0 failures`.

- [ ] **Step 4: Build and run the checks**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `corepack pnpm@11.28.5 exec biome format apps/web/src/browser/transport/change-client.ts apps/web/src/browser/transport/index.ts apps/web/src/browser/change-watcher.ts apps/web/src/browser/features/workspaces/workspace-view.ts apps/web/src/browser/boot.ts apps/web/tests/change-watcher.test.mjs apps/web/tests/fixtures/browser-driver.mjs`

Expected: PASS. The output contains `No fixes applied` and does not contain `format ━`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:local-web`

Expected: PASS. The output contains `# pass 11` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:tools-browser`

Expected: PASS. The output contains `# pass 19` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:local-foundation`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:http-edge`

Expected: PASS. The output contains `# pass 12` and `# fail 0`.

Run: `corepack pnpm@11.28.5 test:browser-smoke`

Expected: PASS. The output contains `# pass 14` and `# fail 0`. When this suite fails one time, run it one more time. When it fails two times, STOP.

- [ ] **Step 5: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths in any order, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
 M apps/web/src/browser/boot.ts
?? apps/web/src/browser/change-watcher.ts
 M apps/web/src/browser/features/workspaces/workspace-view.ts
?? apps/web/src/browser/transport/change-client.ts
 M apps/web/src/browser/transport/index.ts
?? apps/web/tests/change-watcher.test.mjs
 M apps/web/tests/fixtures/browser-driver.mjs
 M e2e/browser-smoke.test.mjs
 M package.json
```

- [ ] **Step 6: Write the report file**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 25 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-25-connect-browser-to-changes-and-stale-workspaces.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-25-connect-browser-to-changes-and-stale-workspaces.md` with:
   - H1 `# Task 25: Connect the Browser to /api/changes and handle WORKSPACES_STALE report` and the purpose line `Read this file to learn how the Browser watches /api/changes and handles WORKSPACES_STALE, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command.
   - What the commands do not prove: `/api/changes` carries the `workspaces` topic only. Other Host topics (`providers`, `preferences`) join the same stream when their modules move in later Phase 3 revisions.
3. Add a row for Task 25 in `docs/build/refactor/target-structure/reports/README.md`. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

- [ ] **Step 7: Commit and push**

Do this step only when Steps 1 to 6 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`:

   ```text
   - Connect the Browser to `GET /api/changes` through one `ChangeWatcher`, refresh the workspace list on a newer `workspaces` version, and handle `WORKSPACES_STALE` by refreshing the list and showing a message without retrying the write. Task 25 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 7 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "feat: watch Host change notices and handle stale workspace writes in Browser"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start the next task until a person approves the report.
