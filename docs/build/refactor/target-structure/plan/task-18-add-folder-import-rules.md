# Task 18: Add the folder-level import rules for the HTTP edge and the Browser

Read this file to learn the steps of Task 18, which adds two `no-restricted-imports` rules, each with negative fixtures, and proves that each rule can fail.

TS-09 in Target Structure Criteria requires a tool check for each dependency rule. After Phase 2, two folders have a dependency rule and no check. `apps/host/src/http/` must not import feature code, integration code, stores or storage packages (`## Dependency rules` in Project Structure). Browser code in `apps/web/src/browser/` must not import the new Local Host package `@deckagent/host`. This task adds the two rules to `.oxlintrc.json`, adds four tests to `tests/oxlint-boundaries.test.mjs`, and records the checks in the enforcement table of Project Structure.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `docs/conventions/testware.md`
- `docs/conventions/project-structure.md` (sections `## Dependency rules` and `## Enforcement`)
- `.oxlintrc.json` (lines 1-90)
- `tests/oxlint-boundaries.test.mjs` (lines 1-60)

**Files:**

- Change: `.oxlintrc.json` (the Browser override, and one new override before the override of `packages/host/contracts/src`)
- Change: `tests/oxlint-boundaries.test.mjs` (four tests at the end of the file)
- Change: `docs/conventions/project-structure.md` (two rows of the enforcement table)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-18-add-folder-import-rules.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-18-add-folder-import-rules.md`

**Interfaces:**

- Uses: the test helper `lintFixture(relativePath, code)` in `tests/oxlint-boundaries.test.mjs`. It returns `{ status, diagnostics: [{ code, message, help }], output }`.
- Produces: an override in `.oxlintrc.json` for `**/apps/host/src/http/**/*.{ts,tsx,mts,cts,js,mjs,cjs}` with the message `The HTTP edge must not import module services, stores or storage. Register module routes and error maps in server.ts.`, and `@deckagent/host` in the Local Host group of the Browser override.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- `corepack pnpm@11.28.5 lint` reports an error in a file of `apps/host/src/http/`. The current code must obey the new rule.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Change the text of the rules or the tests in Step 2.
- Keep the temporary change of Step 4.

- [ ] **Step 1: Check the start state**

Run: `git status --short && node --test tests/oxlint-boundaries.test.mjs`

Expected: PASS. `git status --short` prints no line. The test output contains `# pass 13` and `# fail 0`.

- [ ] **Step 2: Run the edit script**

Save the script below as `deckagent-lint-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
function edit(file, pairs) {
  let text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  for (const [from, to, count] of pairs) {
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from.slice(0, 60))}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, text)
}

const httpOverride = `    {
      "files": ["**/apps/host/src/http/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],
      "rules": {
        "eslint/no-restricted-imports": [
          "error",
          {
            "patterns": [
              {
                "group": [
                  "@deckagent/*/src/*",
                  "@deckagent/*/lib/*",
                  "**/packages/*/*/src/*",
                  "**/packages/*/*/lib/*",
                  "**/apps/*/src/*",
                  "**/apps/*/lib/*"
                ],
                "message": "Import another package through its public exports only."
              },
              {
                "group": [
                  "../features/**",
                  "../integrations/**",
                  "../*-store.ts",
                  "../*-state.ts",
                  "../local-transport.ts",
                  "node:sqlite",
                  "@deckagent/session-persistence",
                  "@deckagent/workspace-registry",
                  "@deckagent/file-tools",
                  "@deckagent/deck",
                  "@deckagent/deck/*"
                ],
                "message": "The HTTP edge must not import module services, stores or storage. Register module routes and error maps in server.ts."
              }
            ]
          }
        ]
      }
    },
`

edit('.oxlintrc.json', [
  [
    '                "group": [\n                  "@deckagent/host-api",\n                  "@deckagent/session-persistence",',
    '                "group": [\n                  "@deckagent/host",\n                  "@deckagent/host-api",\n                  "@deckagent/session-persistence",',
    1,
  ],
  [
    '    {\n      "files": ["**/packages/host/contracts/src/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],',
    `${httpOverride}    {\n      "files": ["**/packages/host/contracts/src/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],`,
    1,
  ],
])

const newTests = `
test('rejects @deckagent/host import in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import { startLocalWeb } from '@deckagent/host'\\nconsole.log(startLocalWeb)\\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\\/host/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Local Host or domain packages\\./)
})

test('rejects feature, integration and store imports inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/app.ts',
    [
      "import { createChatOperations } from '../features/chats/index.ts'",
      "import { OpenCodeRuntime } from '../integrations/opencode/index.ts'",
      "import { MemoryDraftStore } from '../draft-store.ts'",
      "import { mapApplicationFailure } from '../local-transport.ts'",
      'console.log(createChatOperations, OpenCodeRuntime, MemoryDraftStore, mapApplicationFailure)',
      '',
    ].join('\\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 4)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /The HTTP edge must not import module services, stores or storage\\./)
  }
})

test('rejects storage package and node:sqlite imports inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/error-handler.ts',
    [
      "import { DatabaseSync } from 'node:sqlite'",
      "import { SqliteSessionStore } from '@deckagent/session-persistence'",
      "import { DeckStore } from '@deckagent/deck'",
      'console.log(DatabaseSync, SqliteSessionStore, DeckStore)',
      '',
    ].join('\\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /The HTTP edge must not import module services, stores or storage\\./)
  }
})

test('accepts the Host API, Express and Node HTTP imports inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/start-host.ts',
    [
      "import { createServer } from 'node:http'",
      "import { createHostRoutes } from '@deckagent/host-api'",
      "import express from 'express'",
      'console.log(createServer, createHostRoutes, express)',
      '',
    ].join('\\n'),
  )
  assert.equal(result.status, 0)
  assert.equal(result.diagnostics.length, 0)
})
`
const testFile = 'tests/oxlint-boundaries.test.mjs'
writeFileSync(testFile, readFileSync(testFile, 'utf8').replace(/\r\n/g, '\n') + newTests)

edit('docs/conventions/project-structure.md', [
  [
    '| Route không import store hoặc SQL driver. Service không import Express. Module không import store của module khác | — |',
    '| `http/` không import feature, integration, store hoặc storage package | `oxlint` (`no-restricted-imports`) cho `apps/host/src/http/` | — |\n| Route không import store hoặc SQL driver. Service không import Express. Module không import store của module khác | — |',
    1,
  ],
  [
    '| `apps/web/` chỉ import `packages/contracts/` | `check:boundaries` (`browser-node-import`) cho phần Node-only |',
    '| `apps/web/` chỉ import `packages/contracts/` | `check:boundaries` (`browser-node-import`) cho phần Node-only. `oxlint` (`no-restricted-imports`) chặn `@deckagent/host`, `@deckagent/host-api` và domain package trong `apps/web/src/browser/` |',
    1,
  ],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('lint-edits: 3 files changed, 0 failures')
```

Run from the repository root: `node <temporary folder>/deckagent-lint-edits.mjs`

Expected: PASS. The output is `lint-edits: 3 files changed, 0 failures`.

- [ ] **Step 3: Run the tests and the checks**

Run: `node --test tests/oxlint-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 17` and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)` and `0 error(s)`.

- [ ] **Step 4: Make sure that the new tests can fail, then restore the rules**

1. Copy `.oxlintrc.json` to `oxlintrc.backup.json` in the temporary folder of the system.
2. In `.oxlintrc.json`, change `"**/apps/host/src/http/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"` to `"**/apps/host/src/nohttp/**/*.ts"`.
3. In `.oxlintrc.json`, delete the line `"@deckagent/host",` in the Browser override. Do not delete the line `"@deckagent/host-api",`.

Run: `node --test tests/oxlint-boundaries.test.mjs`

Expected: FAIL in three tests. The output contains `not ok 14 - rejects @deckagent/host import in apps/web/src/browser`, `not ok 15 - rejects feature, integration and store imports inside apps/host/src/http`, `not ok 16 - rejects storage package and node:sqlite imports inside apps/host/src/http`, `# pass 14` and `# fail 3`.

4. Copy `oxlintrc.backup.json` from the temporary folder back to `.oxlintrc.json`.

Run: `node --test tests/oxlint-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 17` and `# fail 0`.

- [ ] **Step 5: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has ` M .oxlintrc.json`, ` M docs/conventions/project-structure.md` and ` M tests/oxlint-boundaries.test.mjs`, and other lines only for files in `docs/build/refactor/target-structure/`.

- [ ] **Step 6: Write the report file and stop**

1. Mark Steps 1 to 5 as `- [x]` in this file. Change the Task 18 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-18-add-folder-import-rules.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-18-add-folder-import-rules.md` with:
   - H1 `# Task 18: Add the folder-level import rules report` and the purpose line `Read this file to learn which import rules now guard the HTTP edge and the Browser, and the proof that each rule can fail.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command, including the failed run of Step 4.
   - What the commands do not prove: the rules check import paths only. A dynamic import with a computed path passes the rule. The rule for `apps/host/src/http/` does not check the code in `packages/host/api/src/transport/`, which Phase 3 moves.
3. Add a row for Task 18 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 6 as `- [x]`.

**STOP** and send the report summary. Do not start Task 19 until a person approves the report.
