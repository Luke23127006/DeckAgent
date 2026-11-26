# Task 29: Refresh the Browser chat list from chats notices

Read this file to learn the steps of Task 29, which makes the Browser read the chat list again when `GET /api/changes` sends a newer `chats` notice.

The Browser holds one `ChangeWatcher` in `apps/web/src/browser/boot.ts`. Today it handles the topic `workspaces` only. The reply of `GET /api/sessions` has no `version`, so the Browser keeps the version of the last `chats` notice that it handled. After this task, a notice with a higher version runs `navigation.refresh()` and then `controls()`. The first notice of each connection also runs one refresh. A `chats` notice does not open a chat and does not change the chat that is open.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `apps/web/src/browser/boot.ts` (lines 95-150)
- `apps/web/src/browser/chat-navigation.ts` (lines 95-175)
- `e2e/browser-smoke.test.mjs` (lines 1-60, 187-250 and the last test)

**Files:**

- Change (edit script): `apps/web/src/browser/boot.ts`, `e2e/browser-smoke.test.mjs`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-29-refresh-browser-chat-list-from-notices.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-29-refresh-browser-chat-list-from-notices.md`

**Interfaces:**

- Uses: `ChangeWatcher` with `onNotice(notice: ChangeNotice)` in `apps/web/src/browser/change-watcher.ts`. `navigation.refresh(): Promise<void>` in `apps/web/src/browser/chat-navigation.ts`. The notice `{ topic: 'chats', key: 'host', version }` of `GET /api/changes`.
- Produces: no new export.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in Step 1 is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 2 prints a line that contains `expected 1 match`.
- A command of Step 4 gives another `# fail` count than `Expected`.
- A suite in Step 5 fails two times.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`. The comments in the code of this task are part of the code.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.
- Change an expected value of an existing test.
- Change the edit script of Step 2. When `build` or `lint` reports an error in the result, STOP.
- Add a `version` to the reply of `GET /api/sessions`.

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git grep -n "^| 28 | Done" -- docs/build/refactor/target-structure/plan/README.md`

Expected: PASS. One line.

Run: `node -e "for (const f of process.argv.slice(1)) console.log(require('fs').readFileSync(f, 'utf8').split(/\r?\n/).length - 1, f)" apps/web/src/browser/boot.ts e2e/browser-smoke.test.mjs`

Expected: PASS. Two lines, in this order: `414`, `2475`.

Run: `git grep -n "topic: 'chats'" -- apps/host/src/server.ts`

Expected: PASS. Two lines.

- [ ] **Step 2: Run the edit script**

Write the script below to `C:/Users/Duy/AppData/Local/Temp/deckagent-task29-edits.mjs`.

```js
import { readFileSync, writeFileSync } from 'node:fs'

let changed = 0
let failures = 0

function edit(path, pairs) {
  let text = readFileSync(path, 'utf8')
  for (const [before, after] of pairs) {
    const count = text.split(before).length - 1
    if (count !== 1) {
      console.log(`${path} expected 1 match, found ${count}: ${before.slice(0, 60)}`)
      failures += 1
      continue
    }
    text = text.replace(before, () => after)
  }
  writeFileSync(path, text)
  changed += 1
}

edit('apps/web/src/browser/boot.ts', [
  [
    "const changeWatcher = new ChangeWatcher({\n  client: changeClient,\n  onNotice: async notice => {\n    if (notice.topic !== 'workspaces' || notice.key !== 'host') return\n",
    "// The chat list has no version in its reply, so the last chats notice that this tab handled is kept here.\nlet chatsVersion = -1\nconst changeWatcher = new ChangeWatcher({\n  client: changeClient,\n  onNotice: async notice => {\n    if (notice.key !== 'host') return\n    if (notice.topic === 'chats') {\n      if (notice.version <= chatsVersion) return\n      await navigation.refresh()\n      chatsVersion = notice.version\n      controls()\n      return\n    }\n    if (notice.topic !== 'workspaces') return\n",
  ],
])

const smoke = 'e2e/browser-smoke.test.mjs'
writeFileSync(
  smoke,
  `${readFileSync(smoke, 'utf8')}
test('Browser shows a chat that another client creates, from the chats notice of /api/changes', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-chat-changes-'))
  let app, session
  t.after(async () => {
    try {
      await closeBrowser(session)
      if (app) await app.close()
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    }
  })
  session = await openBrowser(dir)
  const { protocol, evaluate } = session
  app = await startLocalWeb({ dataDir: join(dir, 'data'), home: join(dir, 'home'), ...fixtureProvider('chats') })
  await protocol.call('Page.enable')
  await protocol.call('Page.navigate', { url: \`\${app.origin}/#token=\${app.token}\` })
  await eventually(
    () => evaluate(\`!!document.querySelector('.chat-navigation nav button[aria-current=true]')\`),
    'Browser boot failed',
  )
  await evaluate(\`{
    const original = window.fetch;
    window.__chatListReads = 0;
    window.fetch = async (url, init) => {
      if (String(url).endsWith('/api/sessions') && (!init?.method || init.method === 'GET')) window.__chatListReads += 1;
      return original(url, init);
    };
  } true\`)

  const response = await fetch(\`\${app.origin}/api/sessions\`, {
    method: 'POST',
    headers: { authorization: \`Bearer \${app.token}\`, 'content-type': 'application/json' },
    body: JSON.stringify({ selection: { provider: 'fixture', model: 'chats' } }),
  })
  assert.equal(response.status, 201)
  const created = await response.json()
  await eventually(
    () => evaluate(\`!!document.querySelector('.chat-navigation nav button[data-session-id="\${created.sessionId}"]')\`),
    'Browser did not show the chat of another client after the chats notice',
  )
  assert.ok((await evaluate('window.__chatListReads')) >= 1, 'Browser must read the chat list again')
  assert.equal(
    await evaluate(\`document.querySelector('.chat-navigation nav button[aria-current=true]').dataset.sessionId === '\${created.sessionId}'\`),
    false,
    'A chats notice must not open the new chat',
  )
})
`,
)
changed += 1

console.log(`task29-edits: ${changed} files changed, ${failures} failures`)
```

Run: `node C:/Users/Duy/AppData/Local/Temp/deckagent-task29-edits.mjs`

Expected: PASS. The output is `task29-edits: 2 files changed, 0 failures`, and no line contains `expected 1 match`.

- [ ] **Step 3: Build and check**

Run: `corepack pnpm@11.28.5 exec biome format apps/web/src/browser/boot.ts`

Expected: PASS. The output contains `No fixes applied`.

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

- [ ] **Step 4: Make sure that the new test fails without the change of boot.ts**

Run these commands in order. Each `Expected` is for the command just before it.

1. `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs`. Expected: PASS. The output contains `# pass 1` and `# fail 0`.
2. `git stash push -- apps/web/src/browser/boot.ts`. Expected: exit code 0.
3. `corepack pnpm@11.28.5 build`. Expected: exit code 0.
4. `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs`. Expected: FAIL. The output contains `# fail 1` and `Browser did not show the chat of another client after the chats notice`.
5. `git stash pop`. Expected: exit code 0.
6. `corepack pnpm@11.28.5 build`. Expected: exit code 0.
7. `node --test --test-name-pattern "chats notice" e2e/browser-smoke.test.mjs`. Expected: PASS. The output contains `# pass 1` and `# fail 0`.

When `git stash pop` fails, STOP.

- [ ] **Step 5: Run every suite**

Run each command of the table. `test:browser-smoke` has two host timing flakes that earlier reports record: the test `Create deck UI collects missing answers, revises, confirms once, previews and reopens published slides` and the test `interactive composer: model choice, Send, live reply and Stop survive a reload; drafts stay per chat`. When one of these two tests is the only failed test, run the suite one more time. When the second run also fails, STOP.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 19`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 11`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 51`, `# fail 0` |
| test:model-requests | `corepack pnpm@11.28.5 test:model-requests` | `# pass 29`, `# fail 0` |
| test:source-permissions | `corepack pnpm@11.28.5 test:source-permissions` | `# pass 11`, `# fail 0` |
| test:attachments | `corepack pnpm@11.28.5 test:attachments` | `# pass 29`, `# fail 0` |
| test:research | `corepack pnpm@11.28.5 test:research` | `# pass 5`, `# fail 0` |
| test:images | `corepack pnpm@11.28.5 test:images` | `# pass 39`, `# fail 0` |
| test:outline-workflow | `corepack pnpm@11.28.5 test:outline-workflow` | `# pass 6`, `# fail 0` |
| test:brief-foundation | `corepack pnpm@11.28.5 test:brief-foundation` | `# pass 15`, `# fail 0` |
| test:deck-review | `corepack pnpm@11.28.5 test:deck-review` | `# pass 21`, `# fail 0` |
| test:generation-publication | `corepack pnpm@11.28.5 test:generation-publication` | `# pass 72`, `# fail 0` |
| test:slide-pipeline | `corepack pnpm@11.28.5 test:slide-pipeline` | `# pass 7`, `# fail 0` |
| test:session-persistence | `corepack pnpm@11.28.5 test:session-persistence` | `# pass 7`, `# fail 0` |
| test:opencode-resources | `corepack pnpm@11.28.5 test:opencode-resources` | `# pass 3`, `# fail 0` |
| test:layouts | `corepack pnpm@11.28.5 test:layouts` | `# pass 10`, `# fail 0` |
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 15`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

- [ ] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these paths, and other paths only in `docs/build/refactor/target-structure/` and `CHANGELOG.md`:

```text
 M apps/web/src/browser/boot.ts
 M e2e/browser-smoke.test.mjs
```

- [ ] **Step 7: Write the report file**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 29 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-29-refresh-browser-chat-list-from-notices.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-29-refresh-browser-chat-list-from-notices.md` with:
   - The H1 `# Task 29: Refresh the Browser chat list from chats notices report` and the purpose line `Read this file to learn how the Browser reads the chat list again after a newer chats notice, and the result of each check.`
   - Files changed: the list of files.
   - Commands run, with the exit code and the key output of each command.
   - The suite table of the suite step.
   - What the commands do not prove. Include at least: the new test proves one chat that another client creates. It does not prove a model change, a message or an ungroup from another client. The first notice of each connection runs one extra read of the list.
3. Add a row for Task 29 in `docs/build/refactor/target-structure/reports/README.md`.
4. Run `corepack pnpm@11.28.5 check:docs`. Expected: PASS. The output contains `0 error(s)`.
5. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-29-refresh-browser-chat-list-from-notices.md`. When `python` is not available, run the same script with `python3` or `python3.12`. Expected: PASS. The output contains `0 violations`.
6. Mark Step 7 as `- [x]`.

- [ ] **Step 8: Commit and push**

Do this step only when Steps 1 to 7 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`, as the first line of the list:

   ```text
   - Read the chat list again in the Browser when `GET /api/changes` sends a newer `chats` notice, without opening a chat. Task 29 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 8 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "feat: refresh the Browser chat list from chats notices"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start the next revision until a person approves the report.
