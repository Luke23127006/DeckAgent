# Task 5: Fix portable-generation-http timeout, harden scanner tests, and check Phase 1 exit gate

Read this file to fix the portable-generation-http timeout, harden scanner unit tests, and check all non-live suites for Phase 1 exit.

**Read first:**

- [Global Constraints](README.md#global-constraints) in `README.md`
- `e2e/portable-generation-http.test.mjs` (lines 1-85)
- `apps/web/tests/fixtures/b02-helpers.mjs` (lines 62-86)
- `tests/scan-module-design.test.mjs` (lines 1-176)
- `package.json` (lines 7-45)

**Files:**

- Change: `e2e/portable-generation-http.test.mjs`
- Change: `tests/scan-module-design.test.mjs`
- Change: this task file, for completion checkboxes only

**Interfaces:**

- Uses: `startApp` `extra.openCode` override in `apps/web/tests/fixtures/b02-helpers.mjs` (line 73), `corepack pnpm@11.28.5 build`, `lint`, `check:docs`, `check:boundaries`, `biome format`, root `tests/*.test.mjs`, and all 18 non-live `test:*` scripts in `package.json`.
- Produces: passing `e2e/portable-generation-http.test.mjs` with `openCode: { timeoutMs: 120000 }`, strengthened unit tests in `tests/scan-module-design.test.mjs`, and full Phase 1 exit check evidence.

**STOP when:**

- The output of a command does not match `Expected`.
- Any test file or suite fails or reports a skipped test (`# skipped` greater than 0).
- A file differs from the target text in Steps 1 or 2.
- The task needs a decision that this task does not contain.
- The same step fails two times.

**Forbidden:**

- Change any production source file under `apps/` or `packages/`, or change `apps/web/tests/fixtures/b02-helpers.mjs` or `scripts/scan-module-design.mjs`.
- Remove, skip, or weaken any test or check.
- Run live network suites (`test:research-live`, `test:opencode-live`).
- Commit or push.

- [x] **Step 1: Override `openCode.timeoutMs` in `e2e/portable-generation-http.test.mjs`**

In `e2e/portable-generation-http.test.mjs` (lines 19-21), add `openCode: { timeoutMs: 120000 },` inside the `startApp(dir, { ... })` call:

Target:
```js
    const f = await startApp(dir, {
      options: {
        providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
```

Replacement:
```js
    const f = await startApp(dir, {
      openCode: { timeoutMs: 120000 },
      options: {
        providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
```

Expected: Only one line changes in `e2e/portable-generation-http.test.mjs`. `apps/web/tests/fixtures/b02-helpers.mjs` keeps its `30000` ms default.

- [x] **Step 2: Close the four coverage gaps and formatting issue in `tests/scan-module-design.test.mjs`**

Update `tests/scan-module-design.test.mjs` with these four exact replacements:

1. Remove the unused `AREA_ORDER` import (lines 10-17):

Target:
```js
import {
  AREA_ORDER,
  analyzeSourceFile,
  analyzeTestFile,
  classifyArea,
  computeCoChangePairs,
  formatScanReport,
} from '../scripts/scan-module-design.mjs'
```

Replacement:
```js
import {
  analyzeSourceFile,
  analyzeTestFile,
  classifyArea,
  computeCoChangePairs,
  formatScanReport,
} from '../scripts/scan-module-design.mjs'
```

2. Remove `AREA_ORDER.length` constant assertion and test `.ts` and `.tsx` exclusions inside `/lib/`, `/tests/`, and `/node_modules/` in Test 1 (lines 19-40):

Target:
```js
test('classifyArea maps all 14 production areas and excludes build, test, and script paths', () => {
  assert.equal(AREA_ORDER.length, 14)
  assert.equal(classifyArea('apps/web/src/browser/boot.ts'), 'apps/web/src/browser/')
  assert.equal(classifyArea('apps/web/src/features/deck/deck-workflow.ts'), 'apps/web/src/features/')
  assert.equal(classifyArea('apps/web/src/integrations/opencode/runtime.ts'), 'apps/web/src/integrations/')
  assert.equal(classifyArea('apps/web/src/index.ts'), 'apps/web/src/')
  assert.equal(classifyArea('packages/presentation/deck/src/index.ts'), 'packages/presentation/deck/')
  assert.equal(classifyArea('packages/session/persistence/src/index.ts'), 'packages/session/persistence/')
  assert.equal(classifyArea('packages/host/api/src/index.ts'), 'packages/host/api/')
  assert.equal(classifyArea('packages/host/contracts/src/validation.ts'), 'packages/host/contracts/')
  assert.equal(classifyArea('packages/tools/filesystem/src/index.ts'), 'packages/tools/filesystem/')
  assert.equal(classifyArea('packages/presentation/html/src/index.ts'), 'packages/presentation/html/')
  assert.equal(classifyArea('packages/workspace/registry/src/index.ts'), 'packages/workspace/registry/')
  assert.equal(classifyArea('packages/presentation/design/src/index.ts'), 'packages/presentation/design/')
  assert.equal(classifyArea('packages/presentation/document/src/index.ts'), 'packages/presentation/document/')
  assert.equal(classifyArea('packages/presentation/pptx/src/index.ts'), 'packages/presentation/pptx/')
  assert.equal(classifyArea('apps/web/lib/index.js'), null)
  assert.equal(classifyArea('apps/web/tests/web-session.test.mjs'), null)
  assert.equal(classifyArea('packages/host/api/tests/host-api.test.mjs'), null)
  assert.equal(classifyArea('e2e/portable-generation-http.test.mjs'), null)
  assert.equal(classifyArea('scripts/check-boundaries.mjs'), null)
})
```

Replacement:
```js
test('classifyArea maps all 14 production areas and excludes build, test, and script paths', () => {
  assert.equal(classifyArea('apps/web/src/browser/boot.ts'), 'apps/web/src/browser/')
  assert.equal(classifyArea('apps/web/src/features/deck/deck-workflow.ts'), 'apps/web/src/features/')
  assert.equal(classifyArea('apps/web/src/integrations/opencode/runtime.ts'), 'apps/web/src/integrations/')
  assert.equal(classifyArea('apps/web/src/index.ts'), 'apps/web/src/')
  assert.equal(classifyArea('packages/presentation/deck/src/index.ts'), 'packages/presentation/deck/')
  assert.equal(classifyArea('packages/session/persistence/src/index.ts'), 'packages/session/persistence/')
  assert.equal(classifyArea('packages/host/api/src/index.ts'), 'packages/host/api/')
  assert.equal(classifyArea('packages/host/contracts/src/validation.ts'), 'packages/host/contracts/')
  assert.equal(classifyArea('packages/tools/filesystem/src/index.ts'), 'packages/tools/filesystem/')
  assert.equal(classifyArea('packages/presentation/html/src/index.ts'), 'packages/presentation/html/')
  assert.equal(classifyArea('packages/workspace/registry/src/index.ts'), 'packages/workspace/registry/')
  assert.equal(classifyArea('packages/presentation/design/src/index.ts'), 'packages/presentation/design/')
  assert.equal(classifyArea('packages/presentation/document/src/index.ts'), 'packages/presentation/document/')
  assert.equal(classifyArea('packages/presentation/pptx/src/index.ts'), 'packages/presentation/pptx/')
  assert.equal(classifyArea('apps/web/lib/index.js'), null)
  assert.equal(classifyArea('apps/web/lib/index.ts'), null)
  assert.equal(classifyArea('apps/web/src/lib/generated.ts'), null)
  assert.equal(classifyArea('apps/web/tests/helper.ts'), null)
  assert.equal(classifyArea('packages/host/api/tests/fixture.tsx'), null)
  assert.equal(classifyArea('packages/host/api/node_modules/pkg/index.ts'), null)
  assert.equal(classifyArea('e2e/portable-generation-http.test.mjs'), null)
  assert.equal(classifyArea('scripts/check-boundaries.mjs'), null)
})
```

3. Use single quotes on the `wrapper` literal in Test 3 (line 81) to match Biome formatting:

Target:
```js
  const wrapper = "export const decode = (value: unknown) => value\n"
```

Replacement:
```js
  const wrapper = 'export const decode = (value: unknown) => value\n'
```

4. Replace Tests 5 and 6 (lines 115-176) to check multi-pair co-change sorting and full Markdown table rows:

Target:
```js
test('computeCoChangePairs excludes commits over maxFilesPerCommit and sorts deterministically', () => {
  const bulkCommit = Array.from({ length: 21 }, (_, index) => `apps/web/src/file-${index}.ts`)
  const commits = [
    bulkCommit,
    bulkCommit,
    bulkCommit,
    ['apps/web/src/a.ts', 'apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/c.ts'],
  ]

  const pairs = computeCoChangePairs(commits, { maxFilesPerCommit: 20, minCount: 3 })
  assert.deepEqual(pairs, [{ files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 3 }])
})

test('formatScanReport outputs deterministic Markdown tables for areas, testware, and co-changes', () => {
  const report = formatScanReport({
    areas: [
      {
        area: 'packages/presentation/deck/',
        files: 2,
        lines: 520,
        filesOver400: 1,
        functionsOver80: 1,
        smallNonBarrelFiles: 0,
        typeAssertions: 2,
        serviceSymbols: 1,
        maxExports: 16,
      },
    ],
    files: [
      {
        path: 'packages/presentation/deck/src/index.ts',
        area: 'packages/presentation/deck/',
        lines: 500,
        isBarrel: false,
        exportCount: 16,
        longFunctions: [{ name: 'DeckService.run', line: 10, lines: 90 }],
        typeAssertions: [{ line: 20, text: 'x as string' }],
        serviceSymbols: [{ name: 'DeckService', line: 5 }],
      },
    ],
    tests: [
      {
        path: 'e2e/sample.test.mjs',
        group: 'e2e/',
        lines: 40,
        hasTopHeader: false,
        fixedTimeouts: [12],
        scriptsLibImports: ['../scripts/lib/browser-session.mjs'],
      },
    ],
    coChanges: [{ files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 4 }],
  })

  assert.equal(report.includes('# Module Design Quantitative Scan'), true)
  assert.equal(report.includes('packages/presentation/deck/'), true)
  assert.equal(report.includes('DeckService.run'), true)
  assert.equal(report.includes('e2e/sample.test.mjs'), true)
  assert.equal(report.includes('apps/web/src/a.ts <-> apps/web/src/b.ts'), true)
})
```

Replacement:
```js
test('computeCoChangePairs excludes commits over maxFilesPerCommit and sorts deterministically', () => {
  const bulkCommit = Array.from({ length: 21 }, (_, index) => `apps/web/src/file-${index}.ts`)
  const commits = [
    bulkCommit,
    bulkCommit,
    bulkCommit,
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/c.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/c.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/d.ts'],
    ['apps/web/src/d.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/d.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/b.ts', 'apps/web/src/a.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/b.ts'],
    ['apps/web/src/a.ts', 'apps/web/src/c.ts'],
  ]

  const pairs = computeCoChangePairs(commits, { maxFilesPerCommit: 20, minCount: 3 })
  assert.deepEqual(pairs, [
    { files: ['apps/web/src/b.ts', 'apps/web/src/c.ts'], count: 4 },
    { files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 3 },
    { files: ['apps/web/src/a.ts', 'apps/web/src/d.ts'], count: 3 },
  ])
})

test('formatScanReport outputs deterministic Markdown tables for areas, testware, and co-changes', () => {
  const report = formatScanReport({
    areas: [
      {
        area: 'packages/presentation/deck/',
        files: 2,
        lines: 520,
        filesOver400: 1,
        functionsOver80: 1,
        smallNonBarrelFiles: 0,
        typeAssertions: 2,
        serviceSymbols: 1,
        maxExports: 16,
      },
    ],
    files: [
      {
        path: 'packages/presentation/deck/src/index.ts',
        area: 'packages/presentation/deck/',
        lines: 500,
        isBarrel: false,
        exportCount: 16,
        longFunctions: [{ name: 'DeckService.run', line: 10, lines: 90 }],
        typeAssertions: [{ line: 20, text: 'x as string' }],
        serviceSymbols: [{ name: 'DeckService', line: 5 }],
      },
    ],
    tests: [
      {
        path: 'e2e/sample.test.mjs',
        group: 'e2e/',
        lines: 40,
        hasTopHeader: false,
        fixedTimeouts: [12],
        scriptsLibImports: ['../scripts/lib/browser-session.mjs'],
      },
    ],
    coChanges: [{ files: ['apps/web/src/a.ts', 'apps/web/src/b.ts'], count: 4 }],
  })

  const lines = report.split('\n')
  assert.equal(lines[0], '# Module Design Quantitative Scan')
  assert.equal(lines.includes('| packages/presentation/deck/ | 2 | 520 | 1 | 1 | 0 | 2 | 1 | 16 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | packages/presentation/deck/ | 500 | 16 | 1 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | 10 | DeckService.run | 90 |'), true)
  assert.equal(lines.includes('| packages/presentation/deck/src/index.ts | 5 | DeckService |'), true)
  assert.equal(lines.includes('| e2e/ | 1 | 40 | 1 | 1 | 1 |'), true)
  assert.equal(
    lines.includes('| e2e/sample.test.mjs | e2e/ | 40 | no | 12 | ../scripts/lib/browser-session.mjs |'),
    true,
  )
  assert.equal(lines.includes('| apps/web/src/a.ts <-> apps/web/src/b.ts | 4 |'), true)
})
```

Expected: The updated tests close all four coverage limits from the Task 1 report and match Biome formatting.

- [x] **Step 3: Build and check targeted timeout and scanner tests**

Run these commands in order (run browser-spawning tests outside the Windows sandbox when the sandbox blocks local browser launch with `ARTIFACT_RENDERER_FAILED` or `EPERM`):

1. `corepack pnpm@11.28.5 build`
2. `node --test --test-reporter=tap tests/scan-module-design.test.mjs`
3. `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs`
4. `node --test --test-reporter=tap e2e/portable-generation-http.test.mjs`
5. `corepack pnpm@11.28.5 test:images`
6. `corepack pnpm@11.28.5 test:generation-publication`

Expected: Every command exits with code 0, `# fail 0`, and `# skipped 0`. Record the exact `v2` and `v3` `duration_ms` values from both isolated runs and from both suites to measure headroom against `120000` ms.

- [x] **Step 4: Run static checks and all five root tool test files**

Run these commands:

1. `corepack pnpm@11.28.5 lint`
2. `corepack pnpm@11.28.5 check:docs`
3. `corepack pnpm@11.28.5 check:boundaries`
4. `corepack pnpm@11.28.5 exec biome format tests/scan-module-design.test.mjs`
5. `node --test --test-reporter=tap tests/check-boundaries.test.mjs tests/check-docs.test.mjs tests/oxlint-boundaries.test.mjs tests/post-edit-hook.test.mjs tests/scan-module-design.test.mjs`

Expected: Every command exits with code 0. `lint` reports `0 warnings and 0 errors`. `check:docs` reports `0 error(s)`. `check:boundaries` reports `0 violation(s)`. `biome format` reports 0 errors. Root tool tests report `# fail 0` and `# skipped 0`.

- [x] **Step 5: Run all remaining non-live test suites for Phase 1 exit**

Run each remaining non-live test script in `package.json` (run outside the Windows sandbox only when `EPERM`, `EBUSY`, or local browser launch blocks it):

1. `corepack pnpm@11.28.5 test:session-persistence`
2. `corepack pnpm@11.28.5 test:tools-browser`
3. `corepack pnpm@11.28.5 test:env-startup`
4. `corepack pnpm@11.28.5 test:local-web`
5. `corepack pnpm@11.28.5 test:local-foundation`
6. `corepack pnpm@11.28.5 test:model-requests`
7. `corepack pnpm@11.28.5 test:opencode-resources`
8. `corepack pnpm@11.28.5 test:source-permissions`
9. `corepack pnpm@11.28.5 test:attachments`
10. `corepack pnpm@11.28.5 test:browser-smoke`
11. `corepack pnpm@11.28.5 test:research`
12. `corepack pnpm@11.28.5 test:slide-pipeline`
13. `corepack pnpm@11.28.5 test:outline-workflow`
14. `corepack pnpm@11.28.5 test:brief-foundation`
15. `corepack pnpm@11.28.5 test:deck-review`
16. `corepack pnpm@11.28.5 test:layouts`

Expected: Every command exits with code 0 and reports `# fail 0` and `# skipped 0`.

- [ ] **Step 6: Check git diff scope**

Run:
1. `git status --short`
2. `git diff -- e2e/portable-generation-http.test.mjs`

Expected: PASS. Only `e2e/portable-generation-http.test.mjs`, `tests/scan-module-design.test.mjs`, and this task file show new modifications from Task 5. The diff on `e2e/portable-generation-http.test.mjs` shows only the single `+      openCode: { timeoutMs: 120000 },` line.

- [ ] **Step 7: Report and stop**

Send this report, then STOP:
- Files changed (`e2e/portable-generation-http.test.mjs`, `tests/scan-module-design.test.mjs`, and this task file)
- Check summary table covering `build`, `lint`, `check:docs`, `check:boundaries`, `biome format`, the 5 root tool tests, and all 18 non-live `test:*` suites (`Command | Exit code | # tests | # pass | # fail | # skipped`)
- Measured `v2` and `v3` `duration_ms` values for `e2e/portable-generation-http.test.mjs` across Isolated #1, Isolated #2, `test:images`, and `test:generation-publication`, plus margin under `120000` ms
- Note whether `test:generation-publication` total runtime exceeds the 2-minute CI step timeout in `.github/workflows/workspace.yml` (line 141) so the owner can track it separately
- What the checks do not prove: non-live runs use local fixtures and do not exercise live OpenCode or live Tavily providers (`test:opencode-live`, `test:research-live`)
