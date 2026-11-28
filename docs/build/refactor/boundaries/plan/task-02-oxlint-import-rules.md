# Task 2: Add oxlint import restriction rules and negative fixture tests

Read this file to learn the steps of Task 2, which adds boundary import rules to `.oxlintrc.json` and adds negative fixture tests in `tests/oxlint-boundaries.test.mjs`.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/project-structure.md` (lines 118-163)
- `.oxlintrc.json`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `.oxlintrc.json` (entire file)
- Create: `tests/oxlint-boundaries.test.mjs`
- Change: this task file, for its completion checkboxes only.

**Interfaces:**
- Uses: `.oxlintrc.json` with `typescript/ban-ts-comment` and `typescript/no-explicit-any` set to `error`.
- Produces: `.oxlintrc.json` with `overrides` that enforce import restrictions for `apps/`, `packages/`, browser code, `packages/host/contracts/src/` and `packages/host/api/src/lifecycle/`.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment that breaks `docs/conventions/code.md`, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Write the failing negative fixture tests**

Create `tests/oxlint-boundaries.test.mjs` with this content:

```js
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'

const oxlintBin = resolve(process.platform === 'win32' ? 'node_modules/.bin/oxlint.cmd' : 'node_modules/.bin/oxlint')
const configPath = resolve('.oxlintrc.json')

function lintFixture(relativePath, code) {
  const root = mkdtempSync(join(tmpdir(), 'deckagent-oxlint-'))
  try {
    const file = join(root, relativePath)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, code, 'utf8')
    const result = spawnSync(oxlintBin, ['-c', configPath, file], {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    return { status: result.status, output: `${result.stdout}\n${result.stderr}` }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('rejects private src and lib subpath imports in apps and packages', () => {
  const result = lintFixture(
    'apps/web/src/index.ts',
    "import { x } from '@deckagent/deck/src/internal'\nimport { y } from '@deckagent/host-api/lib/index.js'\nconsole.log(x, y)\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /no-restricted-imports/)
  assert.match(result.output, /Import another package through its public exports only\./)
})

test('rejects both node builtin and private subpath in browser files', () => {
  const result = lintFixture(
    'apps/web/src/browser/boot.ts',
    "import fs from 'node:fs'\nimport { x } from '@deckagent/deck/src/internal'\nconsole.log(fs, x)\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /Browser code must not import Node-only modules\./)
  assert.match(result.output, /Import another package through its public exports only\./)
})

test('rejects host-api and deck imports in target browser directory', () => {
  const result = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import { startHost } from '@deckagent/host-api'\nconsole.log(startHost)\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /Browser code must not import Local Host or domain packages\./)
})

test('rejects node builtin imports in legacy client runtime directory', () => {
  const result = lintFixture(
    'packages/client/runtime/src/sample.ts',
    "import { readFile } from 'node:fs/promises'\nconsole.log(readFile)\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /Browser code must not import Node-only modules\./)
})

test('rejects runtime imports inside packages/host/contracts', () => {
  const result = lintFixture(
    'packages/host/contracts/src/wire.ts',
    "import { createServer } from 'node:http'\nimport { startHost } from '@deckagent/host-api'\nconsole.log(createServer, startHost)\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /Host contracts must not import runtime implementations\./)
})

test('rejects HTTP transport imports inside Request Lifecycle', () => {
  const result = lintFixture(
    'packages/host/api/src/lifecycle/controller.ts',
    "import type { ServerResponse } from 'node:http'\nimport { HttpError } from '../http-error.ts'\nexport type T = [ServerResponse, typeof HttpError]\n",
  )
  assert.equal(result.status, 1)
  assert.match(result.output, /Request Lifecycle must not import HTTP transport modules\./)
})

test('accepts valid public package imports and allowed browser imports', () => {
  const appResult = lintFixture(
    'apps/web/src/index.ts',
    "import { startHost } from '@deckagent/host-api'\nconsole.log(startHost)\n",
  )
  assert.equal(appResult.status, 0, appResult.output)

  const browserResult = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import type { AgentRequest } from '@deckagent/host-contracts'\nexport type Req = AgentRequest\n",
  )
  assert.equal(browserResult.status, 0, browserResult.output)
})
```

- [x] **Step 2: Run the test and check that it fails**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs`
Expected: FAIL. The output contains `not ok 1 - rejects private src and lib subpath imports in apps and packages`.

- [x] **Step 3: Update `.oxlintrc.json` with the import restriction overrides**

Replace `.oxlintrc.json` with this exact content:

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "error"
  },
  "rules": {
    "eslint/no-shadow": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/prefer-add-event-listener": "off",
    "typescript/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": true,
        "ts-ignore": true,
        "ts-nocheck": true
      }
    ],
    "typescript/no-explicit-any": "error"
  },
  "overrides": [
    {
      "files": ["**/apps/**/*.{ts,tsx,js,mjs,cjs}", "**/packages/**/*.{ts,tsx,js,mjs,cjs}"],
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
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["**/packages/client/runtime/src/**/*.{ts,tsx,js,mjs,cjs}"],
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
                "group": ["node:*", "node:*/*"],
                "message": "Browser code must not import Node-only modules."
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["**/apps/web/src/browser/**/*.{ts,tsx,js,mjs,cjs}"],
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
                "group": ["node:*", "node:*/*"],
                "message": "Browser code must not import Node-only modules."
              },
              {
                "group": [
                  "@deckagent/host-api",
                  "@deckagent/session-persistence",
                  "@deckagent/workspace-registry",
                  "@deckagent/file-tools",
                  "@deckagent/deck",
                  "@deckagent/deck/*",
                  "@deckagent/html-format",
                  "@deckagent/pptx-format"
                ],
                "message": "Browser code must not import Local Host or domain packages."
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["**/packages/host/contracts/src/**/*.{ts,tsx,js,mjs,cjs}"],
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
                  "node:*",
                  "node:*/*",
                  "@deckagent/host-api",
                  "@deckagent/browser-runtime",
                  "@deckagent/session-persistence",
                  "@deckagent/workspace-registry",
                  "@deckagent/file-tools",
                  "@deckagent/deck",
                  "@deckagent/deck/*",
                  "@deckagent/html-format",
                  "@deckagent/pptx-format"
                ],
                "message": "Host contracts must not import runtime implementations."
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["**/packages/host/api/src/lifecycle/**/*.{ts,tsx,js,mjs,cjs}"],
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
                  "node:http",
                  "node:https",
                  "../http-error*",
                  "./http-error*",
                  "../deck-routes*",
                  "../multipart*",
                  "../transport/*"
                ],
                "message": "Request Lifecycle must not import HTTP transport modules."
              }
            ]
          }
        ]
      }
    }
  ]
}
```

- [x] **Step 4: Run the fixture tests and the full repository lint**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`
Expected: PASS. The command exits with code 0 and prints `Found 0 warnings and 0 errors.`.

- [x] **Step 5: Report and stop**

Send this report:
- Files changed: list of paths
- Commands run, with the last 20 lines of output of each command
- Items that a decision table sent to the report (write `None`)
- What the commands do not prove
