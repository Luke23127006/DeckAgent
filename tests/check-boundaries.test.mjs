/**
 * Tests: scripts/check-boundaries.mjs AST import extraction, dependency boundary rules, cycle detection, and report formatting.
 * Environment: pure in-memory workspace snapshots parsed with the real TypeScript compiler API (no mocked parser or disk I/O).
 * Faults caught during mutant verification:
 * - Removing isTestFile guard caused packages/presentation/html/tests/html-template-v3.test.mjs importing @deckagent/deck to fail with format-adapter-dependency.
 * - Removing escapesBrowserIntoHost check caused the Browser-to-Local-Host relative import test to fail.
 * - Removing the dynamic import() branch in extractImports caused the dynamic private import test to fail.
 * Run: node --test --test-reporter=tap tests/check-boundaries.test.mjs
 * Expected values source: docs/conventions/project-structure.md (Dependency rules) and docs/build/refactor/boundaries/plan/task-03-boundary-checker.md.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkBoundaries, extractImports, formatReport } from '../scripts/check-boundaries.mjs'

const baseWorkspaces = [
  { dir: 'apps/web', name: '@deckagent/web', exports: { '.': './lib/index.js' } },
  { dir: 'apps/host', name: '@deckagent/host', exports: { '.': './lib/server.js' } },
  { dir: 'packages/host/api', name: '@deckagent/host-api', exports: { '.': './lib/index.js' } },
  { dir: 'packages/host/contracts', name: '@deckagent/host-contracts', exports: { '.': './lib/index.js' } },
  {
    dir: 'packages/presentation/deck',
    name: '@deckagent/deck',
    exports: { '.': './lib/index.js' },
  },
  { dir: 'packages/presentation/design', name: '@deckagent/design', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/document', name: '@deckagent/presentation-document', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/html', name: '@deckagent/html-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/pptx', name: '@deckagent/pptx-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/session/persistence', name: '@deckagent/session-persistence', exports: { '.': './lib/index.js' } },
  { dir: 'packages/workspace/registry', name: '@deckagent/workspace-registry', exports: { '.': './lib/index.js' } },
  { dir: 'packages/tools/filesystem', name: '@deckagent/file-tools', exports: { '.': './lib/index.js' } },
]

const findings = (files, tsconfigPaths = {}) =>
  checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths }).map(({ path, line, rule }) => ({
    path,
    line,
    rule,
  }))

test('extractImports ignores imports inside comments and strings', () => {
  const source = [
    "// import x from '@deckagent/deck/src/internal'",
    "const text = \"import y from 'node:fs'\"",
    "import { ok } from '@deckagent/design'",
    "export { ok } from '@deckagent/presentation-document'",
    "const lazy = () => import('@deckagent/host-contracts')",
  ].join('\n')
  assert.deepEqual(extractImports('apps/web/src/index.ts', source), [
    { line: 3, specifier: '@deckagent/design' },
    { line: 4, specifier: '@deckagent/presentation-document' },
    { line: 5, specifier: '@deckagent/host-contracts' },
  ])
})

test('checkBoundaries accepts valid production and owner-local test imports', () => {
  const files = [
    {
      path: 'apps/host/src/server.ts',
      content: "import { startHost } from '@deckagent/host-api'\nimport { run } from './features/deck/index.ts'\n",
    },
    { path: 'apps/web/src/browser/transport/client.ts', content: "import type { Req } from '@deckagent/host-contracts'\n" },
    { path: 'apps/host/src/features/deck/index.ts', content: "import { load } from '../research/index.ts'\nexport const run = () => load()\n" },
    { path: 'apps/host/src/features/research/index.ts', content: 'export const load = () => 1\n' },
    {
      path: 'packages/presentation/html/src/index.ts',
      content: "import { d } from '@deckagent/design'\nimport { doc } from '@deckagent/presentation-document'\n",
    },
    {
      path: 'packages/presentation/html/tests/html-template-v3.test.mjs',
      content: "import { DeckStore } from '@deckagent/deck'\n",
    },
  ]
  const tsconfigPaths = { '@deckagent/deck': ['./packages/presentation/deck/src/index.ts'] }
  assert.deepEqual(findings(files, tsconfigPaths), [])
})

test('checkBoundaries still rejects private package imports inside owner tests', () => {
  const files = [
    {
      path: 'packages/presentation/html/tests/html-template-v3.test.mjs',
      content: "import { DeckStore } from '@deckagent/deck/src/internal'\n",
    },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/presentation/html/tests/html-template-v3.test.mjs', line: 1, rule: 'private-package-import' },
  ])
})

test('checkBoundaries rejects dynamic import of private package path', () => {
  const files = [
    { path: 'apps/web/src/index.ts', content: "export const f = () => import('@deckagent/deck/src/internal.ts')\n" },
  ]
  assert.deepEqual(findings(files), [{ path: 'apps/web/src/index.ts', line: 1, rule: 'private-package-import' }])
})

test('checkBoundaries rejects undeclared subpath and cross-workspace relative import', () => {
  const files = [
    { path: 'apps/web/src/a.ts', content: "import { x } from '@deckagent/deck/secret'\n" },
    { path: 'apps/web/src/b.ts', content: "import { y } from '../../../packages/presentation/deck/src/index.ts'\n" },
    { path: 'packages/presentation/deck/src/index.ts', content: 'export const y = 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/web/src/a.ts', line: 1, rule: 'private-package-import' },
    { path: 'apps/web/src/b.ts', line: 1, rule: 'private-package-import' },
  ])
})

test('checkBoundaries rejects tsconfig alias to private file', () => {
  const tsconfigPaths = {
    '@deckagent/deck/internal': ['./packages/presentation/deck/src/schema.ts'],
  }
  assert.deepEqual(findings([], tsconfigPaths), [
    { path: 'tsconfig.base.json', line: 1, rule: 'tsconfig-private-alias' },
  ])
})

test('checkBoundaries rejects node builtin, host package, and Local Host relative imports in browser code', () => {
  const files = [
    {
      path: 'apps/web/src/browser/boot.ts',
      content: [
        "import fs from 'node:fs'",
        "import { h } from '@deckagent/host-api'",
        "import { chat } from '../features/chats/index.ts'",
      ].join('\n'),
    },
    { path: 'apps/web/src/features/chats/index.ts', content: 'export const chat = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/web/src/browser/boot.ts', line: 1, rule: 'browser-node-import' },
    { path: 'apps/web/src/browser/boot.ts', line: 2, rule: 'browser-node-import' },
    { path: 'apps/web/src/browser/boot.ts', line: 3, rule: 'browser-node-import' },
  ])
})

test('checkBoundaries rejects runtime imports in host contracts', () => {
  const files = [
    { path: 'packages/host/contracts/src/index.ts', content: "import { startHost } from '@deckagent/host-api'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/host/contracts/src/index.ts', line: 1, rule: 'contracts-runtime-import' },
  ])
})

test('checkBoundaries rejects transport imports in Request Lifecycle', () => {
  const files = [
    { path: 'packages/host/api/src/request-controller.ts', content: "import { HttpError } from './http-error.ts'\n" },
    { path: 'packages/host/api/src/http-error.ts', content: 'export class HttpError extends Error {}\n' },
    { path: 'packages/host/api/src/lifecycle/controller.ts', content: "import http from 'node:http'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/host/api/src/lifecycle/controller.ts', line: 1, rule: 'lifecycle-transport-import' },
    { path: 'packages/host/api/src/request-controller.ts', line: 1, rule: 'lifecycle-transport-import' },
  ])
})

test('checkBoundaries rejects deck importing concrete format adapter', () => {
  const files = [
    {
      path: 'packages/presentation/deck/src/artifact-store.ts',
      content: "import { HtmlFormatAdapter } from '@deckagent/html-format'\n",
    },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/presentation/deck/src/artifact-store.ts', line: 1, rule: 'deck-concrete-adapter' },
  ])
})

test('checkBoundaries rejects format adapter importing outside design and document', () => {
  const files = [
    { path: 'packages/presentation/html/src/index.ts', content: "import { DeckStore } from '@deckagent/deck'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/presentation/html/src/index.ts', line: 1, rule: 'format-adapter-dependency' },
  ])
})

test('checkBoundaries rejects package importing app and domain importing host runtime', () => {
  const files = [
    { path: 'packages/host/api/src/index.ts', content: "import { app } from '@deckagent/web'\n" },
    { path: 'packages/session/persistence/src/index.ts', content: "import { startHost } from '@deckagent/host-api'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/host/api/src/index.ts', line: 1, rule: 'package-app-dependency' },
    { path: 'packages/session/persistence/src/index.ts', line: 1, rule: 'domain-runtime-dependency' },
  ])
})

test('checkBoundaries rejects private import across features', () => {
  const files = [
    { path: 'apps/host/src/features/deck/workflow.ts', content: "import { helper } from '../research/tavily.ts'\n" },
    { path: 'apps/host/src/features/research/tavily.ts', content: 'export const helper = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/features/deck/workflow.ts', line: 1, rule: 'feature-private-import' },
  ])
})

test('checkBoundaries detects a package cycle and reports lowest directory', () => {
  const files = [
    { path: 'packages/presentation/design/src/index.ts', content: "import { a } from '@deckagent/presentation-document'\n" },
    { path: 'packages/presentation/document/src/index.ts', content: "import { b } from '@deckagent/design'\n" },
  ]
  const result = checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths: {} })
  assert.deepEqual(
    result.map(({ path, line, rule }) => ({ path, line, rule })),
    [{ path: 'packages/presentation/design', line: 1, rule: 'package-cycle' }],
  )
  assert.match(result[0].message, /@deckagent\/design -> @deckagent\/presentation-document -> @deckagent\/design/)
})

test('checkBoundaries detects a three-way feature cycle with full chain', () => {
  const files = [
    { path: 'apps/host/src/features/a/index.ts', content: "import { b } from '../b/index.ts'\n" },
    { path: 'apps/host/src/features/b/index.ts', content: "import { c } from '../c/index.ts'\n" },
    { path: 'apps/host/src/features/c/index.ts', content: "import { a } from '../a/index.ts'\n" },
  ]
  const result = checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths: {} })
  assert.deepEqual(
    result.map(({ path, line, rule }) => ({ path, line, rule })),
    [{ path: 'apps/host/src/features/a', line: 1, rule: 'feature-cycle' }],
  )
  assert.match(result[0].message, /a -> b -> c -> a/)
})

test('checkBoundaries rejects private import across browser features', () => {
  const files = [
    {
      path: 'apps/web/src/browser/features/chats/conversation-view.ts',
      content: "import { model } from '../deck/deck-model.ts'\n",
    },
    { path: 'apps/web/src/browser/features/deck/deck-model.ts', content: 'export const model = 1\n' },
  ]
  assert.deepEqual(findings(files), [
    {
      path: 'apps/web/src/browser/features/chats/conversation-view.ts',
      line: 1,
      rule: 'browser-feature-private-import',
    },
  ])
})

test('checkBoundaries detects a browser feature cycle separately from host features', () => {
  const files = [
    { path: 'apps/web/src/browser/features/a/index.ts', content: "import { b } from '../b/index.ts'\n" },
    { path: 'apps/web/src/browser/features/b/index.ts', content: "import { a } from '../a/index.ts'\n" },
  ]
  const result = checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths: {} })
  assert.deepEqual(
    result.map(({ path, line, rule }) => ({ path, line, rule })),
    [{ path: 'apps/web/src/browser/features/a', line: 1, rule: 'browser-feature-cycle' }],
  )
  assert.match(result[0].message, /a -> b -> a/)
})

test('checkBoundaries rejects browser transport importing browser UI features', () => {
  const files = [
    {
      path: 'apps/web/src/browser/transport/host-client.ts',
      content: "import { render } from '../features/chats/index.ts'\n",
    },
    { path: 'apps/web/src/browser/features/chats/index.ts', content: 'export const render = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/web/src/browser/transport/host-client.ts', line: 1, rule: 'browser-transport-ui-import' },
  ])
})

test('checkBoundaries rejects private import into integrations', () => {
  const files = [
    {
      path: 'apps/host/src/features/research/research-service.ts',
      content: "import { search } from '../../integrations/research/tavily.ts'\n",
    },
    { path: 'apps/host/src/integrations/research/tavily.ts', content: 'export const search = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/features/research/research-service.ts', line: 1, rule: 'integration-private-import' },
  ])
})

test('checkBoundaries rejects unresolved relative import in production source', () => {
  const files = [
    { path: 'apps/host/src/features/chats/index.ts', content: "import { missing } from './missing-module.ts'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/features/chats/index.ts', line: 1, rule: 'unresolved-internal-import' },
  ])
})

test('checkBoundaries accepts public browser feature and integration index imports', () => {
  const files = [
    {
      path: 'apps/web/src/browser/features/chats/conversation-view.ts',
      content: "import { deck } from '../deck/index.ts'\n",
    },
    { path: 'apps/web/src/browser/features/deck/index.ts', content: 'export const deck = 1\n' },
    {
      path: 'apps/host/src/features/research/research-service.ts',
      content: "import { search } from '../../integrations/research/index.ts'\n",
    },
    { path: 'apps/host/src/integrations/research/index.ts', content: 'export const search = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [])
})

test('formatReport formats per-violation lines and summarizes by rule', () => {
  const text = formatReport([
    { path: 'a.ts', line: 1, rule: 'deck-concrete-adapter', message: 'msg1' },
    { path: 'b.ts', line: 2, rule: 'deck-concrete-adapter', message: 'msg2' },
  ])
  assert.equal(
    text,
    [
      'a.ts:1 deck-concrete-adapter msg1',
      'b.ts:2 deck-concrete-adapter msg2',
      'deck-concrete-adapter: 2',
      'check-boundaries: 2 violation(s)',
      '',
    ].join('\n'),
  )
})

test('checkBoundaries rejects private import into a module from a feature and from another module', () => {
  const files = [
    {
      path: 'apps/host/src/features/chats/index.ts',
      content: "import { WorkspaceRegistry } from '../../modules/workspaces/workspaces.store.ts'\n",
    },
    {
      path: 'apps/host/src/modules/sources/sources.service.ts',
      content: "import { FolderPolicy } from '../workspaces/folder-policy.ts'\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\n' },
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', content: 'export class FolderPolicy {}\n' },
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
      content: "import type { WorkspaceLookup } from '../../modules/workspaces/index.ts'\n",
    },
    {
      path: 'apps/host/src/modules/workspaces/index.ts',
      content: "export { WorkspaceRegistry } from './workspaces.store.ts'\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\n' },
  ]
  assert.deepEqual(findings(files), [])
})

test('checkBoundaries detects a module cycle separately from feature cycles', () => {
  const files = [
    { path: 'apps/host/src/modules/a/index.ts', content: "import { b } from '../b/index.ts'\n" },
    { path: 'apps/host/src/modules/b/index.ts', content: "import { a } from '../a/index.ts'\n" },
  ]
  const result = checkBoundaries({ workspaces: baseWorkspaces, files, tsconfigPaths: {} })
  assert.deepEqual(
    result.map(({ path, line, rule }) => ({ path, line, rule })),
    [{ path: 'apps/host/src/modules/a', line: 1, rule: 'module-cycle' }],
  )
  assert.match(result[0].message, /a -> b -> a/)
})
