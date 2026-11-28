# Task 1: Add the Browser folder rules

Read this file to learn the steps of Task 1, which adds the oxlint folder rules for the new Browser folders in `apps/web/`.

**Type:** Code

**Read first:**
- [Global Constraints and Task protocol](README.md#global-constraints) in `README.md`
- `.oxlintrc.json` (the override for `**/apps/web/src/browser/**`)
- `tests/oxlint-boundaries.test.mjs` (the helper `lintFixture` and the header comment)
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `.oxlintrc.json` (the array `overrides`)
- Test: `tests/oxlint-boundaries.test.mjs`

**Interfaces:**
- Produces: oxlint overrides for `apps/web/src/{pages,components,layouts,contexts,hooks,api,editor,styles}/`, `apps/web/src/{routes,text}.{ts,tsx}`, `apps/web/src/main.tsx` and `apps/web/mocks/`.

**STOP when:** `corepack pnpm@11.28.5 lint` reports a diagnostic in a file that exists in the repository.

**Forbidden:** Do not change the existing overrides.

## Pattern groups

Each group is one object `{ "group": [...], "message": "..." }` in `patterns`.

| Name | `group` | `message` |
| --- | --- | --- |
| PRIVATE | `@deckagent/*/src/*`, `@deckagent/*/lib/*`, `**/packages/*/*/src/*`, `**/packages/*/*/lib/*`, `**/apps/*/src/*`, `**/apps/*/lib/*` | `Import another package through its public exports only.` |
| NODE | `node:*`, `node:*/*` | `Browser code must not import Node-only modules.` |
| WORKSPACE | `@deckagent/*`, `!@deckagent/host-contracts` | `Browser code imports only @deckagent/host-contracts from the workspace.` |
| MOCKS | `**/mocks`, `**/mocks/**`, `msw`, `msw/*` | `Product code must not import development mocks or MSW. Only src/main.tsx starts the mocks.` |
| NO_API | `**/api`, `**/api/**`, `@/api`, `@/api/*` | `UI code must not call src/api/. Read and write server data through a hook in src/hooks/.` |
| NO_PAGES | `**/pages/**`, `@/pages/*` | `Shared code must not import a page. Move the shared code to src/components/.` |
| NO_VIEW | `**/components/**`, `@/components/*`, `**/layouts/**`, `@/layouts/*` | `A hook must not import a component or a layout. Keep JSX out of src/hooks/.` |
| NO_REACT | `react`, `react/*`, `react-dom`, `react-dom/*`, `@tanstack/*` | `src/api/ and src/editor/ must not import React or TanStack Query. Keep them free of UI code.` |
| NO_UI | `**/pages/**`, `**/components/**`, `**/layouts/**`, `**/hooks/**`, `**/contexts/**`, `@/pages/*`, `@/components/*`, `@/layouts/*`, `@/hooks/*`, `@/contexts/*` | `src/api/ and src/editor/ must not import UI code.` |
| EDITOR_API | `**/api`, `**/api/**`, `@/api`, `@/api/*` | `src/editor/ must not call the Host. A page sends editor writes through a mutation hook.` |

## Overrides

Add these overrides at the end of `overrides`, in this order. Each rule value is `["error", { "patterns": [<groups>] }]` for `eslint/no-restricted-imports`. Each glob ends with `.{ts,tsx,mts,cts,js,mjs,cjs}` where the table gives `*`.

| `files` | Rules |
| --- | --- |
| `**/apps/web/src/{pages,components,layouts,contexts,hooks,api,editor,styles}/**/*`, `**/apps/web/src/routes.*`, `**/apps/web/src/text.*` | PRIVATE, NODE, WORKSPACE, MOCKS |
| `**/apps/web/src/pages/**/*` | PRIVATE, NODE, WORKSPACE, MOCKS, NO_API |
| `**/apps/web/src/{components,layouts,contexts}/**/*` | PRIVATE, NODE, WORKSPACE, MOCKS, NO_API, NO_PAGES |
| `**/apps/web/src/hooks/**/*` | PRIVATE, NODE, WORKSPACE, MOCKS, NO_PAGES, NO_VIEW |
| `**/apps/web/src/api/**/*` | PRIVATE, NODE, WORKSPACE, MOCKS, NO_REACT, NO_UI |
| `**/apps/web/src/editor/**/*` | PRIVATE, NODE, WORKSPACE, MOCKS, NO_REACT, NO_UI, EDITOR_API |
| `**/apps/web/src/main.tsx` | PRIVATE, NODE, WORKSPACE |
| `**/apps/web/src/**/*`, `**/apps/web/mocks/**/*` | `"plugins": ["react"]`, `"react/no-danger": "error"`, `"react/react-in-jsx-scope": "off"` (the rule is for React before version 17), `"unicorn/filename-case": ["error", { "case": "kebabCase" }]`. No `no-restricted-imports` |

- [x] **Step 1: Write the failing tests**

Add these tests at the end of `tests/oxlint-boundaries.test.mjs`. Add this line to the list of faults in the header comment: `- Each apps/web/src folder test failed before the Browser folder overrides existed in .oxlintrc.json.`

```js
const restrictedHelps = result =>
  result.diagnostics.filter(d => d.code === 'eslint(no-restricted-imports)').map(d => d.help).toSorted()

test('browser pages reject src/api, Node modules, domain packages and mocks', () => {
  const result = lintFixture(
    'apps/web/src/pages/chat/chat-page.tsx',
    "import { a } from '../../api/chats.ts'\nimport { b } from '@/api/chats'\nimport { c } from 'node:path'\nimport { d } from '@deckagent/design'\nimport { e } from '../../../mocks/handlers.ts'\nexport const all = [a, b, c, d, e]\n",
  )
  assert.equal(result.status, 1)
  assert.deepEqual(restrictedHelps(result), [
    'Browser code imports only @deckagent/host-contracts from the workspace.',
    'Browser code must not import Node-only modules.',
    'Product code must not import development mocks or MSW. Only src/main.tsx starts the mocks.',
    'UI code must not call src/api/. Read and write server data through a hook in src/hooks/.',
    'UI code must not call src/api/. Read and write server data through a hook in src/hooks/.',
  ])
})

test('browser components, layouts and contexts reject pages and src/api', () => {
  for (const path of ['apps/web/src/components/request-row.tsx', 'apps/web/src/layouts/app-shell.tsx', 'apps/web/src/contexts/workspace-context.tsx']) {
    const result = lintFixture(path, "import { a } from '../pages/chat/chat-page.tsx'\nimport { b } from '../api/chats.ts'\nexport const all = [a, b]\n")
    assert.equal(result.status, 1, path)
    assert.deepEqual(restrictedHelps(result), [
      'Shared code must not import a page. Move the shared code to src/components/.',
      'UI code must not call src/api/. Read and write server data through a hook in src/hooks/.',
    ], path)
  }
})

test('browser hooks reject pages, components and layouts', () => {
  const result = lintFixture(
    'apps/web/src/hooks/use-chats.ts',
    "import { a } from '../pages/chat/chat-page.tsx'\nimport { b } from '../components/request-row.tsx'\nimport { c } from '../layouts/app-shell.tsx'\nexport const all = [a, b, c]\n",
  )
  assert.equal(result.status, 1)
  assert.deepEqual(restrictedHelps(result), [
    'A hook must not import a component or a layout. Keep JSX out of src/hooks/.',
    'A hook must not import a component or a layout. Keep JSX out of src/hooks/.',
    'Shared code must not import a page. Move the shared code to src/components/.',
  ])
})

test('browser api rejects React, TanStack Query, UI code and Node modules', () => {
  const result = lintFixture(
    'apps/web/src/api/chats.ts',
    "import { a } from 'react'\nimport { b } from '@tanstack/react-query'\nimport { c } from '../hooks/use-chats.ts'\nimport { d } from 'node:fs'\nexport const all = [a, b, c, d]\n",
  )
  assert.equal(result.status, 1)
  assert.deepEqual(restrictedHelps(result), [
    'Browser code must not import Node-only modules.',
    'src/api/ and src/editor/ must not import React or TanStack Query. Keep them free of UI code.',
    'src/api/ and src/editor/ must not import React or TanStack Query. Keep them free of UI code.',
    'src/api/ and src/editor/ must not import UI code.',
  ])
})

test('browser editor rejects React and src/api', () => {
  const result = lintFixture(
    'apps/web/src/editor/deck-model.ts',
    "import { a } from 'react-dom'\nimport { b } from '../api/deck.ts'\nexport const all = [a, b]\n",
  )
  assert.equal(result.status, 1)
  assert.deepEqual(restrictedHelps(result), [
    'src/api/ and src/editor/ must not import React or TanStack Query. Keep them free of UI code.',
    'src/editor/ must not call the Host. A page sends editor writes through a mutation hook.',
  ])
})

test('browser files reject a PascalCase file name and dangerouslySetInnerHTML', () => {
  const result = lintFixture(
    'apps/web/src/components/RequestRow.tsx',
    "export const RequestRow = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />\n",
  )
  assert.equal(result.status, 1)
  assert.deepEqual(result.diagnostics.map(d => d.code).toSorted(), ['react(no-danger)', 'unicorn(filename-case)'])
})

test('browser folders accept the allowed data flow and main.tsx accepts mocks', () => {
  const fixtures = [
    ['apps/web/src/pages/chat/chat-page.tsx', "import { useChats } from '../../hooks/use-chats.ts'\nimport { Button } from '../../components/ui/button.tsx'\nimport type { AgentRequest } from '@deckagent/host-contracts'\nimport { useState } from 'react'\nexport const all = [useChats, Button, useState]\nexport type R = AgentRequest\n"],
    ['apps/web/src/hooks/use-chats.ts', "import { listChats } from '../api/chats.ts'\nimport { useQuery } from '@tanstack/react-query'\nexport const all = [listChats, useQuery]\n"],
    ['apps/web/src/main.tsx', "import { worker } from '../mocks/browser.ts'\nimport { createRoot } from 'react-dom/client'\nexport const all = [worker, createRoot]\n"],
  ]
  for (const [path, code] of fixtures) {
    const result = lintFixture(path, code)
    assert.equal(result.status, 0, result.output)
    assert.deepEqual(result.diagnostics, [], path)
  }
})
```

- [x] **Step 2: Run the tests and make sure that they fail**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs`
Expected: FAIL. The six `browser ... reject` tests fail. The test `browser folders accept the allowed data flow and main.tsx accepts mocks` passes.

- [x] **Step 3: Add the overrides to `.oxlintrc.json`**

Add the overrides of the table [Overrides](#overrides) with the groups of the table [Pattern groups](#pattern-groups).

- [x] **Step 4: Run the tests and the lint**

Run: `node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs`
Expected: PASS. The output contains `# fail 0`.

Run: `corepack pnpm@11.28.5 lint`
Expected: exit code 0.

- [x] **Step 5: Write the report file and stop**

Do the step `Write the report file and stop` of the Task protocol.
