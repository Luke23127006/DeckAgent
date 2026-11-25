# Task 22: Add the folder-level rules for apps/host/src/modules

Read this file to learn the steps of Task 22, which adds the import rules for `apps/host/src/modules/` and proves that each rule rejects a wrong import.

After Task 21, `apps/host/src/modules/workspaces/` is the first module, and no check enforces the module rules of Project Structure. This task adds three `no-restricted-imports` overrides to `.oxlintrc.json`, and two rules to `scripts/check-boundaries.mjs`. Each rule has a negative fixture. The task also deletes the old rules for the package `@deckagent/workspace-registry`, which Task 21 deleted. It changes no production code.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`
- `docs/conventions/project-structure.md` (sections `## Dependency rules` and `## Enforcement`)
- `.oxlintrc.json` (202 lines)
- `scripts/check-boundaries.mjs` (lines 33-95, 180-200 and 395-490)
- `tests/oxlint-boundaries.test.mjs` (lines 1-40)
- `tests/check-boundaries.test.mjs` (lines 1-40 and 190-230)

**Files:**

- Change (edit script): `.oxlintrc.json`, `scripts/check-boundaries.mjs`, `tests/oxlint-boundaries.test.mjs`, `tests/check-boundaries.test.mjs`, `docs/conventions/project-structure.md`
- Change: `CHANGELOG.md`
- Change: `docs/build/refactor/target-structure/plan/README.md`
- Change: `docs/build/refactor/target-structure/plan/task-22-add-module-folder-rules.md`
- Change: `docs/build/refactor/target-structure/reports/README.md`
- Create: `docs/build/refactor/target-structure/reports/task-22-add-module-folder-rules.md`

**Interfaces:**

- Uses: `lintFixture(relativePath, code)` in `tests/oxlint-boundaries.test.mjs`. It returns `{ status, diagnostics: [{ code, message, help }], output }`. `findings(files)` and `checkBoundaries({ workspaces, files, tsconfigPaths })` in `tests/check-boundaries.test.mjs`. `findCycles`, `describeCycle` and `stripExtension` in `scripts/check-boundaries.mjs`.
- Produces:
  - Three overrides in `.oxlintrc.json`, in this order: `**/apps/host/src/modules/**/*.{ts,tsx,mts,cts,js,mjs,cjs}`, `**/apps/host/src/modules/*/*.routes.ts` and `**/apps/host/src/modules/*/*.service.ts`. A later override replaces the patterns of an earlier override for the same file, so each override repeats the groups of the earlier overrides.
  - The check rules `module-private-import` and `module-cycle` in `scripts/check-boundaries.mjs`, and the function `moduleOfPath(value)`.
  - The pattern `../modules/**` in the override for `apps/host/src/http/`.

**STOP when:**

- The output of a command does not match `Expected`.
- A file is different from the description in this task. For example, a line count in `Read first` is different.
- The task needs a decision that this task does not contain.
- The same step failed two times.
- The edit script in Step 3 prints a line that starts with a file name and `expected`.
- `corepack pnpm@11.28.5 lint` or `check:boundaries` reports a violation in the current code after Step 3. The rules must pass on the code of Task 21.

**Forbidden:**

- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Change a file in `apps/` or `packages/`.
- Keep the changes of Step 5 after the step. Step 5 restores both files.
- Commit when a STOP condition occurred. Push with `--force`, or skip a hook with `--no-verify`.

## Module rules

The edit script of Step 3 adds these rules. Use the table to review the script. Do not change the script.

| Files | Rejected imports | Rule source in Project Structure |
| --- | --- | --- |
| Every file in `apps/host/src/modules/` | `../*/*.store.ts` (the store of another module), `../../http/**`, `../../local-transport.ts`, `@deckagent/session-persistence`, `@deckagent/file-tools`, `@deckagent/deck`, `@deckagent/deck/*` | Service of a module: not the store of another module. Store of a module: not Express, not a service |
| `apps/host/src/modules/*/*.routes.ts` | The imports of the first row, and `./*.store.ts`, `./schema.ts`, `node:sqlite` | Route of a module: not the store, not the SQL driver |
| `apps/host/src/modules/*/*.service.ts` | The imports of the first row, and `express`, `express/*`, `node:sqlite` | Service of a module: not Express |
| A file outside `apps/host/src/modules/<name>/` | A file of `apps/host/src/modules/<name>/` other than `index.ts` (`module-private-import`) | A module uses only the public operations of another module |
| The modules in `apps/host/src/modules/` | A dependency cycle between two or more modules (`module-cycle`) | The module graph has no cycle |
| `apps/host/src/http/` | `../modules/**` | `http/` does not import module services or stores |

- [ ] **Step 1: Check the start state**

Run: `git status --short`

Expected: PASS. No line.

Run: `git ls-files apps/host/src/modules/workspaces`

Expected: PASS. Nine lines: `contracts.ts`, `folder-policy.ts`, `index.ts`, `schema.ts`, `workspace-name.ts`, `workspaces.errors.ts`, `workspaces.routes.ts`, `workspaces.service.ts` and `workspaces.store.ts` in `apps/host/src/modules/workspaces/`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 39` and `# fail 0`.

Run: `git grep -c "workspace-registry\|workspace/registry" -- .oxlintrc.json scripts/check-boundaries.mjs`

Expected: PASS. Two lines: `.oxlintrc.json:3` and `scripts/check-boundaries.mjs:1`.

- [ ] **Step 2: Build**

Run: `corepack pnpm@11.28.5 build`

Expected: PASS. The command exits with code 0.

- [ ] **Step 3: Run the edit script**

Save the script below as `deckagent-module-rules-edits.mjs` in the temporary folder of the system (`$env:TEMP` in PowerShell, `$TEMP` in Git Bash), outside the repository. The script checks the number of matches of each text before it replaces the text. It adds the new tests at the end of the two test files.

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

const privateGroup = `              {
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
`

const moduleGroup = `              {
                "group": [
                  "../*/*.store.ts",
                  "../../http/**",
                  "../../local-transport.ts",
                  "@deckagent/session-persistence",
                  "@deckagent/file-tools",
                  "@deckagent/deck",
                  "@deckagent/deck/*"
                ],
                "message": "A module must not import the store of another module, a storage package or the HTTP edge. Use the public operation of the other module, and wire it in server.ts."
              }`

const override = (files, extraGroup) => `    {
      "files": ["${files}"],
      "rules": {
        "eslint/no-restricted-imports": [
          "error",
          {
            "patterns": [
${privateGroup}${moduleGroup}${extraGroup}
            ]
          }
        ]
      }
    },
`

const routesGroup = `,
              {
                "group": ["./*.store.ts", "./schema.ts", "node:sqlite"],
                "message": "A module route must not import a store or the SQL driver. Call the service of the module."
              }`

const serviceGroup = `,
              {
                "group": ["express", "express/*", "node:sqlite"],
                "message": "A module service must not import Express or the SQL driver. The routes file owns HTTP, and the store file owns SQL."
              }`

const moduleOverrides =
  override('**/apps/host/src/modules/**/*.{ts,tsx,mts,cts,js,mjs,cjs}', '') +
  override('**/apps/host/src/modules/*/*.routes.ts', routesGroup) +
  override('**/apps/host/src/modules/*/*.service.ts', serviceGroup)

edit('.oxlintrc.json', [
  ['                  "@deckagent/workspace-registry",\n', '', 3],
  [
    '                  "../features/**",\n                  "../integrations/**",\n',
    '                  "../features/**",\n                  "../modules/**",\n                  "../integrations/**",\n',
    1,
  ],
  [
    '    {\n      "files": ["**/packages/host/contracts/src/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],',
    `${moduleOverrides}    {\n      "files": ["**/packages/host/contracts/src/**/*.{ts,tsx,mts,cts,js,mjs,cjs}"],`,
    1,
  ],
])

edit('scripts/check-boundaries.mjs', [
  ["  'packages/session/persistence',\n  'packages/workspace/registry',\n", "  'packages/session/persistence',\n", 1],
  [
    'const integrationOfPath = value => {',
    'const moduleOfPath = value => {\n  const match = /^apps\\/host\\/src\\/modules\\/([^/]+)\\//.exec(value)\n  return match === null ? null : match[1]\n}\n\nconst integrationOfPath = value => {',
    1,
  ],
  ['  const browserFeatureEdges = []\n', '  const browserFeatureEdges = []\n  const moduleEdges = []\n', 1],
  [
    '    const sourceIntegration = productionSource ? integrationOfPath(file.path) : null\n',
    '    const sourceIntegration = productionSource ? integrationOfPath(file.path) : null\n    const sourceModule = productionSource ? moduleOfPath(file.path) : null\n',
    1,
  ],
  [
    '      if (targetWorkspace !== undefined) {\n        packageEdges.push([owner.name, targetWorkspace.name])\n      }\n',
    "      const targetModule = resolved === null ? null : moduleOfPath(resolved)\n      if (targetModule !== null && sourceModule !== targetModule) {\n        const publicEntry = `apps/host/src/modules/${targetModule}/index`\n        if (stripExtension(resolved) !== publicEntry) {\n          add(\n            file.path,\n            line,\n            'module-private-import',\n            `Code outside module \"${targetModule}\" must not import \"${resolved}\". Import the public index of module \"${targetModule}\".`,\n          )\n        }\n        if (sourceModule !== null) moduleEdges.push([sourceModule, targetModule])\n      }\n\n      if (targetWorkspace !== undefined) {\n        packageEdges.push([owner.name, targetWorkspace.name])\n      }\n",
    1,
  ],
  [
    '  return violations.toSorted(\n',
    "  const modules = [...new Set(files.map(file => moduleOfPath(file.path)).filter(name => name !== null))]\n  for (const cycle of findCycles(modules, moduleEdges)) {\n    add(\n      `apps/host/src/modules/${cycle[0]}`,\n      1,\n      'module-cycle',\n      `Module dependency cycle: ${describeCycle(cycle)}. Break the cycle by changing ownership.`,\n    )\n  }\n\n  return violations.toSorted(\n",
    1,
  ],
])

const boundaryTests = `
test('checkBoundaries rejects private import into a module from a feature and from another module', () => {
  const files = [
    {
      path: 'apps/host/src/features/chats/index.ts',
      content: "import { WorkspaceRegistry } from '../../modules/workspaces/workspaces.store.ts'\\n",
    },
    {
      path: 'apps/host/src/modules/sources/sources.service.ts',
      content: "import { FolderPolicy } from '../workspaces/folder-policy.ts'\\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\\n' },
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', content: 'export class FolderPolicy {}\\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/features/chats/index.ts', line: 1, rule: 'module-private-import' },
    { path: 'apps/host/src/modules/sources/sources.service.ts', line: 1, rule: 'module-private-import' },
  ])
})

test('checkBoundaries accepts a module index import and an import inside the same module', () => {
  const files = [
    {
      path: 'apps/host/src/features/chats/index.ts',
      content: "import type { WorkspaceLookup } from '../../modules/workspaces/index.ts'\\n",
    },
    {
      path: 'apps/host/src/modules/workspaces/index.ts',
      content: "export { WorkspaceRegistry } from './workspaces.store.ts'\\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\\n' },
  ]
  assert.deepEqual(findings(files), [])
})

test('checkBoundaries detects a module cycle separately from feature cycles', () => {
  const files = [
    { path: 'apps/host/src/modules/a/index.ts', content: "import { b } from '../b/index.ts'\\n" },
    { path: 'apps/host/src/modules/b/index.ts', content: "import { a } from '../a/index.ts'\\n" },
  ]
  const result = checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths: {} })
  assert.deepEqual(
    result.map(({ path, line, rule }) => ({ path, line, rule })),
    [{ path: 'apps/host/src/modules/a', line: 1, rule: 'module-cycle' }],
  )
  assert.match(result[0].message, /a -> b -> a/)
})
`

const lintTests = `
test('rejects a store, the SQL driver and another module store inside a module routes file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import { WorkspaceRegistry } from './workspaces.store.ts'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { ChatStore } from '../chats/chats.store.ts'",
      'console.log(WorkspaceRegistry, DatabaseSync, ChatStore)',
      '',
    ].join('\\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  const help = result.diagnostics.map(diagnostic => diagnostic.help).toSorted()
  assert.match(help[0], /A module must not import the store of another module, a storage package or the HTTP edge\\./)
  assert.match(help[1], /A module route must not import a store or the SQL driver\\./)
  assert.match(help[2], /A module route must not import a store or the SQL driver\\./)
})

test('rejects Express and the SQL driver inside a module service file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.service.ts',
    ["import { Router } from 'express'", "import { DatabaseSync } from 'node:sqlite'", 'console.log(Router, DatabaseSync)', ''].join(
      '\\n',
    ),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 2)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /A module service must not import Express or the SQL driver\\./)
  }
})

test('rejects another module store, a storage package and the HTTP edge inside a module', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/index.ts',
    [
      "import { ChatStore } from '../chats/chats.store.ts'",
      "import { SqliteSessionStore } from '@deckagent/session-persistence'",
      "import { createHttpApp } from '../../http/app.ts'",
      'console.log(ChatStore, SqliteSessionStore, createHttpApp)',
      '',
    ].join('\\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(
      diagnostic.help,
      /A module must not import the store of another module, a storage package or the HTTP edge\\./,
    )
  }
})

test('rejects a module import inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/app.ts',
    "import { createWorkspaceRoutes } from '../modules/workspaces/index.ts'\\nconsole.log(createWorkspaceRoutes)\\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].help, /The HTTP edge must not import module services, stores or storage\\./)
})

test('accepts the service, the Host API and Express inside a module routes file, and SQL inside a store file', () => {
  const routes = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import type { WorkspaceOperations } from './workspaces.service.ts'",
      "import { json } from '@deckagent/host-api'",
      "import { Router } from 'express'",
      'export const value: WorkspaceOperations | undefined = undefined',
      'console.log(json, Router)',
      '',
    ].join('\\n'),
  )
  assert.equal(routes.status, 0)
  assert.equal(routes.diagnostics.length, 0)
  const store = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.store.ts',
    "import { DatabaseSync } from 'node:sqlite'\\nimport { initialize } from './schema.ts'\\nconsole.log(DatabaseSync, initialize)\\n",
  )
  assert.equal(store.status, 0)
  assert.equal(store.diagnostics.length, 0)
})
`

for (const [file, added] of [
  ['tests/check-boundaries.test.mjs', boundaryTests],
  ['tests/oxlint-boundaries.test.mjs', lintTests],
]) {
  writeFileSync(file, readFileSync(file, 'utf8').replace(/\r\n/g, '\n') + added)
  changed += 1
}

edit('docs/conventions/project-structure.md', [
  [
    '| Feature, Browser feature và integration không lộ private implementation; Browser transport không import Browser UI feature | `check:boundaries` (`feature-private-import`, `browser-feature-private-import`, `browser-transport-ui-import`, `integration-private-import`) | Rule theo folder cho `apps/host/src/modules/` và `apps/web/src/api/` |',
    '| Feature, Browser feature, integration và module không lộ private implementation; Browser transport không import Browser UI feature | `check:boundaries` (`feature-private-import`, `browser-feature-private-import`, `browser-transport-ui-import`, `integration-private-import`, `module-private-import`) | Rule theo folder cho `apps/web/src/api/` |',
    1,
  ],
  [
    '| Package graph, feature graph và Browser feature graph không có vòng | `check:boundaries` (`package-cycle`, `feature-cycle`, `browser-feature-cycle`) | Module graph trong `apps/host/src/modules/` không có vòng |',
    '| Package graph, feature graph, Browser feature graph và module graph trong `apps/host/src/modules/` không có vòng | `check:boundaries` (`package-cycle`, `feature-cycle`, `browser-feature-cycle`, `module-cycle`) | — |',
    1,
  ],
  [
    '| `http/` không import feature, integration, store hoặc storage package | `oxlint` (`no-restricted-imports`) cho `apps/host/src/http/` | — |',
    '| `http/` không import feature, module, integration, store hoặc storage package | `oxlint` (`no-restricted-imports`) cho `apps/host/src/http/` | — |',
    1,
  ],
  [
    '| Route không import store hoặc SQL driver. Service không import Express. Module không import store của module khác | — | `oxlint` (`no-restricted-imports`) theo folder, mỗi rule có negative fixture |',
    '| Route không import store hoặc SQL driver. Service không import Express hoặc SQL driver. Module không import store của module khác, storage package hoặc `http/` | `oxlint` (`no-restricted-imports`) cho `apps/host/src/modules/`, `*.routes.ts` và `*.service.ts` | — |',
    1,
  ],
])

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`module-rules-edits: ${changed} files changed, 0 failures`)
```

Run from the repository root: `node <temporary folder>/deckagent-module-rules-edits.mjs`

Expected: PASS. The output is `module-rules-edits: 5 files changed, 0 failures`.

- [ ] **Step 4: Run the checks**

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`

Expected: PASS. The command exits with code 0.

Run: `corepack pnpm@11.28.5 check:boundaries`

Expected: PASS. The output contains `check-boundaries: 0 violation(s)`.

Run: `git grep -c "workspace-registry\|workspace/registry" -- .oxlintrc.json scripts/check-boundaries.mjs`

Expected: PASS. The command prints no line and exits with code 1.

Run: `corepack pnpm@11.28.5 check:docs`

Expected: PASS. The output contains `0 error(s)`.

- [ ] **Step 5: Prove that the rules reject wrong imports**

Save the script below as `deckagent-module-rules-mutant.mjs` in the temporary folder of the system. With the argument `break`, the script copies `.oxlintrc.json` and `scripts/check-boundaries.mjs` to the temporary folder, and then changes each `apps/host/src/modules/` path of the new rules to `apps/host/src/nomodules/` and deletes `"../modules/**",`. With the argument `restore`, it copies the two files back.

```js
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const files = ['.oxlintrc.json', 'scripts/check-boundaries.mjs']
const backup = file => join(tmpdir(), `deckagent-mutant-${file.replaceAll('/', '-')}`)
const mode = process.argv[2]
if (mode === 'break') {
  for (const file of files) {
    copyFileSync(file, backup(file))
    const text = readFileSync(file, 'utf8')
      .replaceAll('apps/host/src/modules/', 'apps/host/src/nomodules/')
      .replaceAll('apps\\/host\\/src\\/modules\\/', 'apps\\/host\\/src\\/nomodules\\/')
      .replace('"../modules/**",', '')
    writeFileSync(file, text)
  }
  console.log('mutant: 2 files broken')
} else if (mode === 'restore') {
  for (const file of files) copyFileSync(backup(file), file)
  console.log('mutant: 2 files restored')
} else {
  console.error('mutant: give the argument break or restore')
  process.exit(1)
}
```

Run: `node <temporary folder>/deckagent-module-rules-mutant.mjs break`

Expected: PASS. The output is `mutant: 2 files broken`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS for this step. The output contains `# fail 6`. These tests fail: `checkBoundaries rejects private import into a module from a feature and from another module`, `checkBoundaries detects a module cycle separately from feature cycles`, `rejects a store, the SQL driver and another module store inside a module routes file`, `rejects Express and the SQL driver inside a module service file`, `rejects another module store, a storage package and the HTTP edge inside a module` and `rejects a module import inside apps/host/src/http`. The two tests that start with `accepts` pass.

Run: `node <temporary folder>/deckagent-module-rules-mutant.mjs restore`

Expected: PASS. The output is `mutant: 2 files restored`.

Run: `node --test tests/oxlint-boundaries.test.mjs tests/check-boundaries.test.mjs`

Expected: PASS. The output contains `# pass 47` and `# fail 0`.

- [ ] **Step 6: Check the changed paths**

Run: `git status --short`

Expected: PASS. The output has these lines in any order, and other lines only for files in `docs/build/refactor/target-structure/` and for `CHANGELOG.md`:

```text
 M .oxlintrc.json
 M docs/conventions/project-structure.md
 M scripts/check-boundaries.mjs
 M tests/check-boundaries.test.mjs
 M tests/oxlint-boundaries.test.mjs
```

- [ ] **Step 7: Write the report file**

1. Mark Steps 1 to 6 as `- [x]` in this file. Change the Task 22 row in `docs/build/refactor/target-structure/plan/README.md` to `Done` and add `([report](../reports/task-22-add-module-folder-rules.md))` after the task link.
2. Create `docs/build/refactor/target-structure/reports/task-22-add-module-folder-rules.md` with:
   - H1 `# Task 22: Add the folder-level rules for apps/host/src/modules report` and the purpose line `Read this file to learn which import rules apply in apps/host/src/modules, and the proof that each rule rejects a wrong import.`
   - Files changed: the list of files.
   - Commands run, with exit codes and key output of each command. Write each command that you ran in another form, for example in PowerShell.
   - The names of the tests that failed in Step 5.
   - What the commands do not prove: the oxlint rules match file names and import paths. A store file with another name than `<name>.store.ts`, or an import through a re-export, is not in the rules. `check:boundaries` reads relative imports only, so an import of a module through a package name is not in `module-private-import`.
3. Add a row for Task 22 in `docs/build/refactor/target-structure/reports/README.md`, with the same columns as the Task 20 row. Run `corepack pnpm@11.28.5 check:docs`. Expected: the output contains `0 error(s)`.
4. Run the STE linter from Global Constraints on the report file. Expected: the output contains `0 violations`.
5. Mark Step 7 as `- [x]`.

- [ ] **Step 8: Commit and push**

Do this step only when Steps 1 to 7 passed and no STOP condition occurred.

1. Add this line under `## [Unreleased]` and `### Added` in `CHANGELOG.md`:

   ```text
   - Add the folder-level import rules for `apps/host/src/modules/`: three `no-restricted-imports` overrides for module files, routes files and service files, and the `check:boundaries` rules `module-private-import` and `module-cycle`, each with a negative fixture. Task 22 is `Done` in `docs/build/refactor/target-structure/plan/`.
   ```

2. Mark Step 8 as `- [x]` in this file.
3. Run: `git add -A`
4. Run: `git commit -m "test: add the folder-level import rules for apps/host/src/modules"`

   Expected: PASS. The command exits with code 0. When a hook fails, STOP. Do not run the commit again with `--no-verify`.

5. Run: `git push`

   Expected: PASS. The output contains `refactor -> refactor`. When Git rejects the push, STOP. Do not use `--force`.

6. Run: `git status --short`

   Expected: PASS. No line.

**STOP** and send the report summary with the commit hash. Do not start the next task until a person approves the report.
