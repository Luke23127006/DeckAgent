# Task 15: Move the Node code of the web app into apps/host

Read this file to learn the steps of Task 15, which moves all Node code of `apps/web/src/` into the new application `apps/host/` and fixes every caller.

After this task, `apps/web/` holds the Browser code and one Node file that loads the Browser assets. `apps/host/` holds the composition root `src/server.ts`, the command line `src/cli.ts` and the folders `features/` and `integrations/` with the same names as before. The HTTP server stays in `packages/host/api/`. A later revision moves it to `apps/host/src/http/` and replaces the routing with Express. This task changes no behavior. It changes paths, package names and the asset loader signature only.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/codebase-design/SKILL.md`
- `docs/conventions/project-structure.md` (section `## Trong lúc chuyển`)
- `docs/conventions/testware.md`
- `apps/web/src/index.ts` (391 lines, lines 1-12 and 370-378)
- `apps/web/src/ui-assets.ts` (309 lines, lines 1-4 and 273-309)
- `apps/web/package.json` (32 lines)
- `scripts/build-workspace.mjs` (93 lines)

**Files:**

- Create: `apps/host/package.json`, `apps/host/tsconfig.json`
- Move with `git mv` (Step 2): `apps/web/src/index.ts` to `apps/host/src/server.ts`. `apps/web/src/{cli.ts,draft-store.ts,local-transport.ts,storage-root.ts,web-state.ts}`, `apps/web/src/features/` and `apps/web/src/integrations/` to the same names in `apps/host/src/`. `apps/web/src/ui-assets.ts` to `apps/web/src/index.ts`. `apps/web/OPENCODE-LICENSE` to `apps/host/OPENCODE-LICENSE`. The 11 test files and 3 fixture files of the [Test move table](#test-move-table) to `apps/host/tests/`.
- Change: `apps/host/src/server.ts`, `apps/host/src/cli.ts`, `apps/web/src/index.ts`, `apps/web/package.json`, `apps/web/tsconfig.json`
- Change: the moved test files and fixtures in `apps/host/tests/`
- Change: each file in `e2e/` that the edit script changes (Step 4 lists them)
- Change: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.gitignore`
- Change: `scripts/build-workspace.mjs`, `scripts/package-opencode.mjs`, `scripts/check-boundaries.mjs`, `tests/check-boundaries.test.mjs`
- Change: `docs/conventions/project-structure.md` (mapping table of `## Trong lúc chuyển`), `docs/architecture/10-agent-core.md` (paths only)
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-15-move-node-code-to-apps-host.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-15-move-node-code-to-apps-host.md`

**Interfaces:**

- Uses: `startLocalWeb`, `LocalWebOptions`, `StorageError`, `resolveStorageRoot` and `ProviderConnection` from `apps/web/src/index.ts` (before the move). `loadWebAssets(clientDir: string, getTheme: () => WebPreferences['theme'])` from `apps/web/src/ui-assets.ts` (before the move).
- Produces:
  - The workspace package `@deckagent/host` in `apps/host/`, with the entry `lib/server.js` and the extra entry `lib/cli.js`. It exports `startLocalWeb`, `LocalWebOptions`, `StorageError`, `resolveStorageRoot` and `ProviderConnection`, with the same signatures.
  - `@deckagent/local-web` in `apps/web/`, with the entry `lib/index.js`. It exports `loadWebAssets(getTheme: () => WebPreferences['theme']): Promise<Record<string, { contentType: string; body: string; sandboxed?: boolean }>>`. The function reads the Browser files from the folder `browser` next to `lib/index.js`. The other exports of `ui-assets.ts` stay.
  - The start command `node apps/host/lib/cli.js` in the scripts `web` and `start:local`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 4 prints a line that starts with a file name and `expected`.
- A suite in Step 7 fails, and the report of Task 12 shows `PASS` for the suite.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.
- Change an expected value in a test. This task changes import paths, file paths in comments and the start path in tests only.
- Leave a re-export file at an old path.
- Add a package to `apps/host/package.json` that the package file in Step 3 does not list, or change a version in `pnpm-lock.yaml`. Step 5 changes only the `importers` section.
- Change `scripts/scan-module-design.mjs`. Its path groups still name the old paths. The report records this.

## Test move table

A test file moves to `apps/host/tests/` when it imports Host code: a path under `../lib/types/`, the file `../lib/index.js` or the fixture `b02-helpers.mjs`. The other test files stay in `apps/web/tests/`.

| Moves to `apps/host/tests/` | Stays in `apps/web/tests/` |
| --- | --- |
| `brief-host.test.mjs`, `commons-images.test.mjs`, `draft-store.test.mjs`, `image-research.test.mjs`, `mcp-bridge.test.mjs`, `opencode-adapter.test.mjs`, `opencode-resources.test.mjs`, `research.test.mjs`, `research-image-generation.test.mjs`, `wait-for.test.mjs`, `web-management.test.mjs` | `brief-client.test.mjs`, `browser-runtime.test.mjs`, `deck-client.test.mjs`, `deck-model.test.mjs`, `layout-review.test.mjs`, `outline-client.test.mjs`, `web-session.test.mjs` |
| `fixtures/b02-helpers.mjs`, `fixtures/fake-opencode.mjs`, `fixtures/wait-for.mjs` | `fixtures/browser-driver.mjs` |

- [x] **Step 1: Check the start state**

Run: `git status --short && wc -l apps/web/src/index.ts apps/web/src/ui-assets.ts apps/web/package.json scripts/build-workspace.mjs && grep -c "@deckagent/local-web" e2e/*.test.mjs | grep -vc ":0$"`

Expected: PASS. `git status --short` prints no line. The line counts are `391`, `309`, `32` and `93`. The last line is `12`: eleven e2e files from the report of Task 11 and `e2e/http-edge.test.mjs`. FAIL: `git status --short` prints a line. A person must commit the work of Tasks 13 and 14 first.

- [x] **Step 2: Move the files**

Run each command from the repository root, in this order. Each command stops at the first error (`set -e`).

```bash
set -e
mkdir -p apps/host/src apps/host/tests/fixtures
git mv apps/web/src/index.ts apps/host/src/server.ts
for f in cli.ts draft-store.ts local-transport.ts storage-root.ts web-state.ts features integrations; do git mv apps/web/src/$f apps/host/src/$f; done
git mv apps/web/src/ui-assets.ts apps/web/src/index.ts
git mv apps/web/OPENCODE-LICENSE apps/host/OPENCODE-LICENSE
for t in brief-host commons-images draft-store image-research mcp-bridge opencode-adapter opencode-resources research research-image-generation wait-for web-management; do git mv apps/web/tests/$t.test.mjs apps/host/tests/$t.test.mjs; done
for f in b02-helpers fake-opencode wait-for; do git mv apps/web/tests/fixtures/$f.mjs apps/host/tests/fixtures/$f.mjs; done
```

Run: `git status --short | grep -c "^R"`

Expected: PASS. The output is `74`.

- [x] **Step 3: Create the package files of `apps/host`**

Write the text below as the complete file `apps/host/package.json`:

```json
{
  "name": "@deckagent/host",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "lib/server.js",
  "types": "lib/types/server.d.ts",
  "exports": {
    ".": {
      "types": "./lib/types/server.d.ts",
      "default": "./lib/server.js"
    }
  },
  "dependencies": {
    "@deckagent/deck": "workspace:*",
    "@deckagent/design": "workspace:*",
    "@deckagent/file-tools": "workspace:*",
    "@deckagent/host-api": "workspace:*",
    "@deckagent/host-contracts": "workspace:*",
    "@deckagent/html-format": "workspace:*",
    "@deckagent/local-web": "workspace:*",
    "@deckagent/presentation-document": "workspace:*",
    "@deckagent/session-persistence": "workspace:*",
    "@deckagent/workspace-registry": "workspace:*",
    "@modelcontextprotocol/sdk": "1.26.0"
  },
  "optionalDependencies": {
    "opencode-windows-x64": "1.19.5"
  }
}
```

Write the text below as the complete file `apps/host/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib/types"
  },
  "include": [
    "src"
  ],
  "references": [
    { "path": "../../packages/presentation/deck" },
    { "path": "../../packages/presentation/design" },
    { "path": "../../packages/presentation/document" },
    { "path": "../../packages/presentation/html" },
    { "path": "../../packages/tools/filesystem" },
    { "path": "../../packages/host/api" },
    { "path": "../../packages/host/contracts" },
    { "path": "../../packages/session/persistence" },
    { "path": "../../packages/workspace/registry" },
    { "path": "../web" }
  ]
}
```

- [x] **Step 4: Run the edit script**

Save the script below as `/tmp/deckagent-move-edits.mjs`, outside the repository. Each edit replaces an exact text and checks the number of matches first. When a count is different, the script prints the file, the expected count and the found count, and exits with code 1.

```js
import { readFileSync, writeFileSync } from 'node:fs'

const failures = []
function edit(file, pairs) {
  let text = readFileSync(file, 'utf8')
  for (const [from, to, count] of pairs) {
    const found = text.split(from).length - 1
    if (found !== count) {
      failures.push(`${file}: expected ${count} of ${JSON.stringify(from)}, found ${found}`)
      continue
    }
    text = text.split(from).join(to)
  }
  writeFileSync(file, text)
}

edit('apps/host/src/server.ts', [
  ["import { dirname, join } from 'node:path'\n", "import { join } from 'node:path'\n", 1],
  ["import { loadWebAssets } from './ui-assets.ts'\n", "import { loadWebAssets } from '@deckagent/local-web'\n", 1],
  ["    const clientDir = join(dirname(fileURLToPath(import.meta.url)), 'browser')\n", '', 1],
  ['await loadWebAssets(clientDir, () =>', 'await loadWebAssets(() =>', 1],
])

edit('apps/host/src/cli.ts', [["from './index.ts'\n", "from './server.ts'\n", 2]])

edit('apps/web/src/index.ts', [
  [
    "import { join } from 'node:path'\n",
    "import { dirname, join } from 'node:path'\nimport { fileURLToPath } from 'node:url'\n",
    1,
  ],
  [
    'export async function loadWebAssets(\n  clientDir: string,\n  getTheme: () => WebPreferences[\'theme\'],\n): Promise<Record<string, { contentType: string; body: string; sandboxed?: boolean }>> {\n',
    "export async function loadWebAssets(\n  getTheme: () => WebPreferences['theme'],\n): Promise<Record<string, { contentType: string; body: string; sandboxed?: boolean }>> {\n  const clientDir = join(dirname(fileURLToPath(import.meta.url)), 'browser')\n",
    1,
  ],
])

const movedTests = [
  'brief-host',
  'commons-images',
  'draft-store',
  'image-research',
  'mcp-bridge',
  'opencode-adapter',
  'opencode-resources',
  'research',
  'research-image-generation',
  'wait-for',
  'web-management',
]
const rootScripts = movedTests.map(name => [
  `apps/web/tests/${name}.test.mjs`,
  `apps/host/tests/${name}.test.mjs`,
  name === 'commons-images' || name === 'image-research' ? 2 : 1,
])
edit('package.json', [
  ...rootScripts,
  ['apps/web/lib/cli.js', 'apps/host/lib/cli.js', 2],
  [
    '    "@deckagent/file-tools": "workspace:*",\n    "@deckagent/host-api": "workspace:*",\n',
    '    "@deckagent/file-tools": "workspace:*",\n    "@deckagent/host": "workspace:*",\n    "@deckagent/host-api": "workspace:*",\n',
    1,
  ],
])

edit('apps/web/package.json', [
  [
    '  "dependencies": {\n    "@deckagent/deck": "workspace:*",\n    "@deckagent/design": "workspace:*",\n    "@deckagent/html-format": "workspace:*",\n    "@deckagent/file-tools": "workspace:*",\n    "@deckagent/host-api": "workspace:*",\n    "@deckagent/host-contracts": "workspace:*",\n    "@deckagent/presentation-document": "workspace:*",\n    "@deckagent/session-persistence": "workspace:*",\n    "@deckagent/workspace-registry": "workspace:*",\n    "@modelcontextprotocol/sdk": "1.26.0"\n  },\n',
    '  "dependencies": {\n    "@deckagent/host-contracts": "workspace:*",\n    "@deckagent/presentation-document": "workspace:*"\n  },\n',
    1,
  ],
  [
    '  "devDependencies": {\n    "animejs": "4.5.0"\n  },\n  "optionalDependencies": {\n    "opencode-windows-x64": "1.19.5"\n  }\n',
    '  "devDependencies": {\n    "animejs": "4.5.0"\n  }\n',
    1,
  ],
])

edit('apps/web/tsconfig.json', [
  [
    '  "references": [\n    { "path": "../../packages/presentation/html" },\n    { "path": "../../packages/presentation/design" },\n    { "path": "../../packages/tools/filesystem" },\n    { "path": "../../packages/presentation/deck" },\n    {\n      "path": "../../packages/host/api"\n    },\n    {\n      "path": "../../packages/host/contracts"\n    },\n    {\n      "path": "./tsconfig.browser.json"\n    },\n    {\n      "path": "../../packages/session/persistence"\n    },\n    {\n      "path": "../../packages/workspace/registry"\n    }\n  ]\n',
    '  "references": [\n    {\n      "path": "../../packages/host/contracts"\n    },\n    {\n      "path": "./tsconfig.browser.json"\n    }\n  ]\n',
    1,
  ],
])

edit('tsconfig.json', [
  [
    '    {\n      "path": "apps/web"\n    },\n',
    '    {\n      "path": "apps/web"\n    },\n    {\n      "path": "apps/host"\n    },\n',
    1,
  ],
])

edit('scripts/build-workspace.mjs', [
  ["  '@deckagent/local-web': ['lib/types/cli.js'],\n", "  '@deckagent/host': ['lib/types/cli.js'],\n", 1],
  [
    "}\n\nconst discovered = discoverWorkspacePackages()",
    "}\n\n// An application whose public entry is not lib/types/index.js names its entry here.\nconst mainEntries = {\n  '@deckagent/host': 'lib/types/server.js',\n}\n\nconst discovered = discoverWorkspacePackages()",
    1,
  ],
  ["    entry: ['lib/types/index.js'],\n", "    entry: [mainEntries[pkg.name] ?? 'lib/types/index.js'],\n", 1],
])

edit('scripts/package-opencode.mjs', [
  ["new URL('../apps/web/', import.meta.url)", "new URL('../apps/host/', import.meta.url)", 1],
  ['defaults to apps/web/resources/opencode', 'defaults to apps/host/resources/opencode', 1],
])

edit('.gitignore', [['/apps/web/resources/opencode/\n', '/apps/host/resources/opencode/\n', 1]])

const hostTestFiles = [...movedTests.map(name => `apps/host/tests/${name}.test.mjs`)]
for (const file of hostTestFiles) {
  const text = readFileSync(file, 'utf8')
  const pairs = []
  for (const [from, to] of [
    ["'../lib/index.js'", "'../lib/server.js'"],
    ["'./fixtures/browser-driver.mjs'", "'../../web/tests/fixtures/browser-driver.mjs'"],
    ['apps/web/tests/', 'apps/host/tests/'],
  ]) {
    const count = text.split(from).length - 1
    if (count > 0) pairs.push([from, to, count])
  }
  edit(file, pairs)
}
edit('apps/host/tests/fixtures/b02-helpers.mjs', [
  ["'../../lib/index.js'", "'../../lib/server.js'", 1],
  ["'./browser-driver.mjs'", "'../../../web/tests/fixtures/browser-driver.mjs'", 1],
])

const e2eFiles = readFileSync(0, 'utf8').split('\n').filter(Boolean)
for (const file of e2eFiles) {
  const text = readFileSync(file, 'utf8')
  const pairs = []
  for (const [from, to] of [
    ['../apps/web/tests/fixtures/b02-helpers.mjs', '../apps/host/tests/fixtures/b02-helpers.mjs'],
    ['../apps/web/tests/fixtures/fake-opencode.mjs', '../apps/host/tests/fixtures/fake-opencode.mjs'],
    ["'@deckagent/local-web'", "'@deckagent/host'"],
    ['apps/web/lib/cli.js', 'apps/host/lib/cli.js'],
  ]) {
    const count = text.split(from).length - 1
    if (count > 0) pairs.push([from, to, count])
  }
  if (pairs.length > 0) edit(file, pairs)
}

edit('e2e/local-foundation.test.mjs', [
  [
    "  for (const name of ['index.js', 'cli.js']) {\n    const bundle = await readFile(join(root, 'apps', 'web', 'lib', name), 'utf8')\n",
    "  for (const name of ['server.js', 'cli.js']) {\n    const bundle = await readFile(join(root, 'apps', 'host', 'lib', name), 'utf8')\n",
    1,
  ],
  ["join(root, 'apps', 'web', 'package.json')", "join(root, 'apps', 'host', 'package.json')", 1],
  [
    "join(root, 'apps', 'web', 'src', 'features', 'sources', 'source-tools.ts')",
    "join(root, 'apps', 'host', 'src', 'features', 'sources', 'source-tools.ts')",
    1,
  ],
])

const keep ="    { path: 'apps/web/src/features/chats/index.ts', content: 'export const chat = () => 1\\n' },"
edit('scripts/check-boundaries.mjs', [
  [String.raw`/^apps\/web\/src\/features\/`, String.raw`/^apps\/host\/src\/features\/`, 1],
  [String.raw`/^apps\/web\/src\/integrations\/`, String.raw`/^apps\/host\/src\/integrations\/`, 1],
  ['`apps/web/src/features/', '`apps/host/src/features/', 2],
  ['`apps/web/src/integrations/', '`apps/host/src/integrations/', 1],
])
edit('tests/check-boundaries.test.mjs', [
  [
    "  { dir: 'apps/web', name: '@deckagent/web', exports: { '.': './lib/index.js' } },\n",
    "  { dir: 'apps/web', name: '@deckagent/web', exports: { '.': './lib/index.js' } },\n  { dir: 'apps/host', name: '@deckagent/host', exports: { '.': './lib/server.js' } },\n",
    1,
  ],
  [
    "      path: 'apps/web/src/index.ts',\n      content: \"import { startHost }",
    "      path: 'apps/host/src/server.ts',\n      content: \"import { startHost }",
    1,
  ],
  [keep, '@@KEEP@@', 1],
  ['apps/web/src/features/', 'apps/host/src/features/', 14],
  ['apps/web/src/integrations/', 'apps/host/src/integrations/', 2],
  ['@@KEEP@@', keep, 1],
])

edit('docs/conventions/project-structure.md', [
  ['| `apps/web/src/local-transport.ts` | Error handler', '| `apps/host/src/local-transport.ts` | Error handler', 1],
  ['| `apps/web/src/features/<name>/` | `apps/host/src/modules/<name>/` |', '| `apps/host/src/features/<name>/` | `apps/host/src/modules/<name>/` |', 1],
  ['| `apps/web/src/integrations/opencode/` |', '| `apps/host/src/integrations/opencode/` |', 1],
  ['| `apps/web/src/integrations/{images,', '| `apps/host/src/integrations/{images,', 1],
  ['| `apps/web/src/index.ts` | `apps/host/src/server.ts` |\n', '', 1],
  ['| `apps/web/src/browser/**`, `apps/web/src/ui-assets.ts` |', '| `apps/web/src/browser/**`, `apps/web/src/index.ts` |', 1],
])
edit('docs/architecture/10-agent-core.md', [
  ['apps/web/src/index.ts', 'apps/host/src/server.ts', 1],
  ['apps/web/src/features/', 'apps/host/src/features/', 1],
  ['apps/web/src/integrations/', 'apps/host/src/integrations/', 3],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`move-edits: ${e2eFiles.length} e2e files checked, 0 failures`)
```

Run: `ls e2e/*.mjs | node /tmp/deckagent-move-edits.mjs`

Expected: PASS. The output is `move-edits: 27 e2e files checked, 0 failures`. FAIL: a line that starts with a file name and `expected`. Write the line in the report and STOP.

Run: `grep -rln "@deckagent/local-web\|apps/web/tests/fixtures/b02-helpers\|apps/web/tests/fixtures/fake-opencode\|apps/web/lib/cli.js" e2e apps/host/tests; echo "exit=$?"; grep -c "apps/web/lib/cli.js" package.json`

Expected: PASS. The output is `exit=1` and then `0`. No e2e file and no moved test names the old package or the old fixture paths, and no script starts the old command line.

- [x] **Step 5: Link the new workspace package**

Run: `corepack pnpm@11.28.5 install --offline`

Expected: PASS. The output contains `+ @deckagent/host 0.0.0 <- apps\host` or `+ @deckagent/host 0.0.0 <- apps/host`, and the command exits with code 0.

Run: `git diff --stat pnpm-lock.yaml`

Expected: PASS. The output is `pnpm-lock.yaml | 25 ++++++++++++++++++++-----`. The diff changes the `importers` entries of `.` (root), `apps/host` and `apps/web` only.

- [x] **Step 6: Build and run the checks**

Run: `rm -rf apps/web/lib apps/host/lib && corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0. The old `apps/web/lib/` folder can hold compiled files from before the move, so the command deletes it first.

Run: `ls apps/host/lib/server.js apps/host/lib/cli.js apps/web/lib/index.js apps/web/lib/browser/boot.js`

Expected: PASS. The output lists the four files.

Run: `corepack pnpm@11.28.5 lint && corepack pnpm@11.28.5 check:boundaries && node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`, `# pass 35` and `# fail 0`.

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

- [x] **Step 7: Run the non-live suites**

Run each command below in order. For each command, write the exit code and the `# pass` and `# fail` lines in the report.

| Suite | Command | Expected |
| --- | --- | --- |
| test:http-edge | `corepack pnpm@11.28.5 test:http-edge` | `# pass 12`, `# fail 0` |
| test:tools-browser | `corepack pnpm@11.28.5 test:tools-browser` | `# pass 14`, `# fail 0` |
| test:local-web | `corepack pnpm@11.28.5 test:local-web` | `# pass 8`, `# fail 0` |
| test:local-foundation | `corepack pnpm@11.28.5 test:local-foundation` | `# pass 43`, `# fail 0` |
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
| test:browser-smoke | `corepack pnpm@11.28.5 test:browser-smoke` | `# pass 13`, `# fail 0` |
| test:env-startup | `corepack pnpm@11.28.5 test:env-startup` | `# pass 2`, `# fail 0` |

The numbers other than `test:http-edge` come from the report of Task 12. When a command fails, run it one more time. When it fails two times, STOP.

- [x] **Step 8: Check the changed paths**

Run: `git status --short | grep -v "^R  " | cut -c4- | grep -v "^apps/\|^e2e/\|^docs/build/refactor/target-structure/"`

Expected: PASS. The output is these 10 lines in any order: `.gitignore`, `docs/architecture/10-agent-core.md`, `docs/conventions/project-structure.md`, `package.json`, `pnpm-lock.yaml`, `scripts/build-workspace.mjs`, `scripts/check-boundaries.mjs`, `scripts/package-opencode.mjs`, `tests/check-boundaries.test.mjs` and `tsconfig.json`. FAIL: another path.

Run: `ls apps/web/src`

Expected: PASS. The output is `browser` and `index.ts`.

- [x] **Step 9: Write the report file and stop**

1. Mark Steps 1 to 8 as `- [x]` in this file. Change the Task 15 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-15-move-node-code-to-apps-host.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-15-move-node-code-to-apps-host.md` with:
   - H1 `# Task 15: Move the Node code of the web app into apps/host report` and the purpose line `Read this file to learn which files moved to apps/host, which callers changed and the result of each check after the move.`
   - Files changed: the moved files as groups, and the changed files.
   - Commands run, with exit codes and key output of each command.
   - The suite table from Step 7.
   - Paths that still name the old place: `scripts/scan-module-design.mjs` and the plan and research files in `docs/build/`.
   - What the commands do not prove: the suites prove the same behavior through the tests that exist. `start:local` and `package:opencode` did not run. A path that the code builds at run time can still point to `apps/web/`.
3. Add a row for Task 15 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 1 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run `python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/target-structure/reports/task-15-move-node-code-to-apps-host.md`. Expected: the output contains `0 violations`.
5. Mark Step 9 as `- [x]`.

**STOP** and send the report summary. Do not start Task 16 until a person approves the report.
