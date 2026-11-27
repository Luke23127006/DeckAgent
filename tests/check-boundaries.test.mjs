/**
 * Tests: scripts/check-boundaries.mjs AST import extraction, dependency boundary rules, cycle detection, and report formatting.
 * Environment: pure in-memory workspace snapshots parsed with the real TypeScript compiler API (no mocked parser or disk I/O).
 * Faults caught during mutant verification:
 * - Removing the runs directory from lifecycle enforcement failed the transport import test.
 * - Removing isTestFile guard caused packages/presentation/html/tests/html-template-v3.test.mjs importing @deckagent/deck to fail with format-adapter-dependency.
 * - Removing escapesBrowserIntoHost check caused the Browser-to-Local-Host relative import test to fail.
 * - The checker before Phase 7 of Browser in React (rule limited to apps/web/src/browser, design and presentation-document allowed) failed the browser-node-import test; so did each of these alone: adding design and presentation-document back to BROWSER_ALLOWED_PACKAGES, and setting BROWSER_DIRECTORIES back to apps/web/src/browser.
 * - Removing the dynamic import() branch in extractImports caused the dynamic private import test to fail.
 * - Renaming the typescript-enum rule ID caused the enum and const enum test to fail.
 * - Removing the branch for a Service or Store suffix outside its role file caused the role file rejection test to fail.
 * - Setting ROLE_FILE_MODULES to ['workspaces'] caused the role file acceptance test and two module import tests to fail.
 * - Removing attachments from ROLE_FILE_MODULES failed the attachments role test.
 * - Removing deck from ROLE_FILE_MODULES failed the deck role test.
 * Run: node --test --test-reporter=tap tests/check-boundaries.test.mjs
 * Expected values source: docs/conventions/project-structure.md (Dependency rules) and docs/build/refactor/boundaries/plan/task-03-boundary-checker.md.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkBoundaries, extractImports, formatReport } from '../scripts/check-boundaries.mjs'

const baseWorkspaces = [
  { dir: 'apps/web', name: '@deckagent/web', exports: { '.': './lib/index.js' } },
  { dir: 'apps/host', name: '@deckagent/host', exports: { '.': './lib/server.js' } },
  { dir: 'packages/host/contracts', name: '@deckagent/host-contracts', exports: { '.': './lib/index.js' } },
  {
    dir: 'packages/presentation/deck',
    name: '@deckagent/deck',
    exports: { '.': './lib/index.js' },
  },
  { dir: 'packages/presentation/design', name: '@deckagent/design', exports: { '.': './lib/index.js' } },
  {
    dir: 'packages/presentation/document',
    name: '@deckagent/presentation-document',
    exports: { '.': './lib/index.js' },
  },
  { dir: 'packages/presentation/html', name: '@deckagent/html-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/presentation/pptx', name: '@deckagent/pptx-format', exports: { '.': './lib/index.js' } },
  { dir: 'packages/workspace/registry', name: '@deckagent/workspace-registry', exports: { '.': './lib/index.js' } },
  { dir: 'packages/tools/filesystem', name: '@deckagent/file-tools', exports: { '.': './lib/index.js' } },
]

const findings = (files, tsconfigPaths = {}, roleFileModules) =>
  checkBoundaries({
    workspaces: baseWorkspaces,
    files,
    tsconfigPaths,
    ...(roleFileModules ? { roleFileModules } : {}),
  }).map(({ path, line, rule }) => ({
    path,
    line,
    rule,
  }))

test('extractImports ignores imports inside comments and strings', () => {
  const source = [
    "// import x from '@deckagent/deck/src/internal'",
    'const text = "import y from \'node:fs\'"',
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
      content: "import { startHost } from '@deckagent/host'\nimport { run } from './features/deck/index.ts'\n",
    },
    {
      path: 'apps/web/src/api/client.ts',
      content: "import type { Req } from '@deckagent/host-contracts'\n",
    },
    {
      path: 'apps/host/src/features/deck/index.ts',
      content: "import { load } from '../research/index.ts'\nexport const run = () => load()\n",
    },
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
    { path: 'apps/host/src/server.ts', content: "export const f = () => import('@deckagent/deck/src/internal.ts')\n" },
  ]
  assert.deepEqual(findings(files), [{ path: 'apps/host/src/server.ts', line: 1, rule: 'private-package-import' }])
})

test('checkBoundaries rejects undeclared subpath and cross-workspace relative import', () => {
  const files = [
    { path: 'apps/host/src/a.ts', content: "import { x } from '@deckagent/deck/secret'\n" },
    { path: 'apps/host/src/b.ts', content: "import { y } from '../../../packages/presentation/deck/src/index.ts'\n" },
    { path: 'packages/presentation/deck/src/index.ts', content: 'export const y = 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/a.ts', line: 1, rule: 'private-package-import' },
    { path: 'apps/host/src/b.ts', line: 1, rule: 'private-package-import' },
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

test('checkBoundaries rejects node builtin, workspace packages other than contracts, and Local Host relative imports in browser code, and accepts contracts, third-party and local imports', () => {
  const files = [
    {
      path: 'apps/web/src/hooks/use-boot.ts',
      content: [
        "import fs from 'node:fs'",
        "import { h } from '@deckagent/host'",
        "import { chat } from '../../../host/src/server.ts'",
        "import { decodeSlideDocument } from '@deckagent/presentation-document'",
        "import { resolveDesign } from '@deckagent/design'",
        "import { decodeChatList } from '@deckagent/host-contracts'",
        "import { useState } from 'react'",
        "import { api } from '../api/client.ts'",
      ].join('\n'),
    },
    { path: 'apps/host/src/server.ts', content: 'export const chat = () => 1\n' },
    { path: 'apps/web/src/api/client.ts', content: 'export const api = () => 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/web/src/hooks/use-boot.ts', line: 1, rule: 'browser-node-import' },
    { path: 'apps/web/src/hooks/use-boot.ts', line: 2, rule: 'browser-node-import' },
    { path: 'apps/web/src/hooks/use-boot.ts', line: 3, rule: 'browser-node-import' },
    { path: 'apps/web/src/hooks/use-boot.ts', line: 3, rule: 'private-package-import' },
    { path: 'apps/web/src/hooks/use-boot.ts', line: 4, rule: 'browser-node-import' },
    { path: 'apps/web/src/hooks/use-boot.ts', line: 5, rule: 'browser-node-import' },
  ])
})

test('checkBoundaries rejects runtime imports in host contracts', () => {
  const files = [
    { path: 'packages/host/contracts/src/index.ts', content: "import { startHost } from '@deckagent/host'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/host/contracts/src/index.ts', line: 1, rule: 'contracts-runtime-import' },
    { path: 'packages/host/contracts/src/index.ts', line: 1, rule: 'package-app-dependency' },
  ])
})

test('checkBoundaries rejects transport imports in Request Lifecycle', () => {
  const files = [
    { path: 'apps/host/src/runs/run-controller.ts', content: "import { HttpError } from '../http/http-error.ts'\n" },
    { path: 'apps/host/src/http/http-error.ts', content: 'export class HttpError extends Error {}\n' },
    { path: 'apps/host/src/runs/lifecycle/controller.ts', content: "import http from 'node:http'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/runs/lifecycle/controller.ts', line: 1, rule: 'lifecycle-transport-import' },
    { path: 'apps/host/src/runs/run-controller.ts', line: 1, rule: 'lifecycle-transport-import' },
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
    { path: 'packages/presentation/design/src/index.ts', content: "import { app } from '@deckagent/web'\n" },
    { path: 'packages/presentation/deck/src/index.ts', content: "import { startHost } from '@deckagent/host'\n" },
  ]
  assert.deepEqual(findings(files), [
    { path: 'packages/presentation/deck/src/index.ts', line: 1, rule: 'domain-runtime-dependency' },
    { path: 'packages/presentation/deck/src/index.ts', line: 1, rule: 'package-app-dependency' },
    { path: 'packages/presentation/design/src/index.ts', line: 1, rule: 'package-app-dependency' },
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
    {
      path: 'packages/presentation/design/src/index.ts',
      content: "import { a } from '@deckagent/presentation-document'\n",
    },
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

test('checkBoundaries rejects private import into a runtime and accepts its index', () => {
  const files = [
    {
      path: 'apps/host/src/features/requests/prepare-runtime.ts',
      content: "import { OpenCodeRuntime } from '../../runtimes/opencode/runtime.ts'\n",
    },
    { path: 'apps/host/src/runtimes/opencode/runtime.ts', content: 'export const OpenCodeRuntime = 1\n' },
    {
      path: 'apps/host/src/server.ts',
      content: "import { OpenCodeRuntime } from './runtimes/opencode/index.ts'\nconsole.log(OpenCodeRuntime)\n",
    },
    { path: 'apps/host/src/runtimes/opencode/index.ts', content: 'export const OpenCodeRuntime = 1\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/features/requests/prepare-runtime.ts', line: 1, rule: 'runtime-private-import' },
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

test('checkBoundaries accepts public integration index imports', () => {
  const files = [
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
      content: "import { SqliteWorkspaceStore } from '../../modules/workspaces/workspaces.store.ts'\n",
    },
    {
      path: 'apps/host/src/modules/sources/sources.service.ts',
      content: "import { FolderPolicy } from '../workspaces/folder-policy.ts'\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class SqliteWorkspaceStore {}\n' },
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
      content: "export { SqliteWorkspaceStore } from './workspaces.store.ts'\n",
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class SqliteWorkspaceStore {}\n' },
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

test('checkBoundaries rejects an enum and a const enum in source and test files', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/message.ts', content: "export enum Role {\n  User = 'user',\n}\n" },
    {
      path: 'packages/presentation/deck/src/state.ts',
      content: '\nconst enum Phase {\n  Draft,\n}\nexport const first = Phase.Draft\n',
    },
    { path: 'apps/host/tests/sample.test.ts', content: 'enum Local {\n  A,\n}\n' },
  ]
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/modules/chats/message.ts', line: 1, rule: 'typescript-enum' },
    { path: 'apps/host/tests/sample.test.ts', line: 1, rule: 'typescript-enum' },
    { path: 'packages/presentation/deck/src/state.ts', line: 2, rule: 'typescript-enum' },
  ])
})

test('checkBoundaries rejects role files without their role symbols in a listed module', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/chats.service.ts', content: 'export function createChatOperations() {}\n' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', content: 'export class ChatRecords {}\n' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', content: 'export function chatRouter() {}\n' },
    {
      path: 'apps/host/src/modules/chats/chats.errors.ts',
      content: 'export class ChatFailure extends Error {}\nexport function mapChatFailure() {}\n',
    },
    {
      path: 'apps/host/src/modules/chats/chat-text.ts',
      content: 'export class TitleService {}\nexport class TextStore {}\n',
    },
  ]
  assert.deepEqual(findings(files, {}, ['chats']), [
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
  assert.deepEqual(findings(files), [
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chat-text.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
  const workspaceFiles = [
    {
      path: 'apps/host/src/modules/workspaces/workspaces.service.ts',
      content: 'export function createWorkspaceOperations() {}\n',
    },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', content: 'export class WorkspaceRegistry {}\n' },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.routes.ts',
      content: 'export function workspaceRouter() {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.errors.ts',
      content: 'export class WorkspaceFailure extends Error {}\nexport function mapWorkspaceFailure() {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/folder-policy.ts',
      content: 'export class FolderService {}\nexport class FolderStore {}\n',
    },
  ]
  assert.deepEqual(findings(workspaceFiles), [
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/folder-policy.ts', line: 2, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/workspaces/workspaces.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
})

test('checkBoundaries accepts role symbols in a listed module and ignores modules outside the list', () => {
  const files = [
    { path: 'apps/host/src/modules/chats/chats.service.ts', content: 'export class ChatService {}\n' },
    { path: 'apps/host/src/modules/chats/chat-requests.service.ts', content: 'export class ChatRequestService {}\n' },
    { path: 'apps/host/src/modules/chats/chats.store.ts', content: 'export class SqliteChatStore {}\n' },
    { path: 'apps/host/src/modules/chats/draft.store.ts', content: 'export class MemoryDraftStore {}\n' },
    { path: 'apps/host/src/modules/chats/files.store.ts', content: 'export class ChatFileStore {}\n' },
    { path: 'apps/host/src/modules/chats/chats.routes.ts', content: 'export function createChatRoutes() {}\n' },
    {
      path: 'apps/host/src/modules/chats/chats.errors.ts',
      content: 'export class ChatError extends Error {}\nexport function mapChatError() {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.service.ts',
      content: 'export class WorkspaceService {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.store.ts',
      content: 'export class SqliteWorkspaceStore {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.routes.ts',
      content: 'export function createWorkspaceRoutes() {}\n',
    },
    {
      path: 'apps/host/src/modules/workspaces/workspaces.errors.ts',
      content: 'export class WorkspaceError extends Error {}\nexport function mapWorkspaceError() {}\n',
    },
    {
      path: 'apps/host/src/modules/billing/billing.service.ts',
      content: 'export function createBillingOperations() {}\n',
    },
  ]
  assert.deepEqual(findings(files, {}, ['chats', 'workspaces']), [])
  assert.deepEqual(findings(files), [])
})

test('checkBoundaries applies role symbol checks to attachments by default', () => {
  assert.deepEqual(
    findings([
      {
        path: 'apps/host/src/modules/attachments/attachments.service.ts',
        content: 'export class AttachmentCoordinator {}\n',
      },
      {
        path: 'apps/host/src/modules/attachments/attachments.store.ts',
        content: 'export class SqliteAttachmentLog {}\n',
      },
    ]),
    [
      { path: 'apps/host/src/modules/attachments/attachments.service.ts', line: 1, rule: 'role-file-symbol' },
      { path: 'apps/host/src/modules/attachments/attachments.store.ts', line: 1, rule: 'role-file-symbol' },
    ],
  )
})

test('checkBoundaries applies role symbol checks to providers and research by default', () => {
  const invalid = [
    {
      path: 'apps/host/src/modules/providers/providers.service.ts',
      content: 'export class ProviderConfigurations {}\n',
    },
    {
      path: 'apps/host/src/modules/providers/providers.errors.ts',
      content: 'export class ProviderFailure extends Error {}\nexport function mapProviderFailure() {}\n',
    },
    { path: 'apps/host/src/modules/research/research.service.ts', content: 'export class ResearchCoordinator {}\n' },
    { path: 'apps/host/src/modules/research/tavily.ts', content: 'export class TavilyService {}\n' },
  ]
  assert.deepEqual(findings(invalid), [
    { path: 'apps/host/src/modules/providers/providers.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/providers/providers.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/providers/providers.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/research/research.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/research/tavily.ts', line: 1, rule: 'role-file-symbol' },
  ])
  const valid = [
    { path: 'apps/host/src/modules/providers/providers.service.ts', content: 'export class ProviderService {}\n' },
    { path: 'apps/host/src/modules/providers/providers.store.ts', content: 'export class SqliteProviderStore {}\n' },
    {
      path: 'apps/host/src/modules/providers/providers.routes.ts',
      content: 'export function createProviderRoutes() {}\n',
    },
    {
      path: 'apps/host/src/modules/providers/providers.errors.ts',
      content: 'export class ProviderError extends Error {}\nexport function mapProviderError() {}\n',
    },
    { path: 'apps/host/src/modules/research/research.service.ts', content: 'export class ResearchService {}\n' },
    { path: 'apps/host/src/modules/research/research.store.ts', content: 'export class SqliteResearchStore {}\n' },
    {
      path: 'apps/host/src/modules/research/research.routes.ts',
      content: 'export function createResearchRoutes() {}\n',
    },
    {
      path: 'apps/host/src/modules/research/research.errors.ts',
      content: 'export class ResearchError extends Error {}\nexport function mapResearchError() {}\n',
    },
    { path: 'apps/host/src/modules/research/tavily.ts', content: 'export class TavilyClient {}\n' },
  ]
  assert.deepEqual(findings(valid), [])
})

test('checkBoundaries applies role symbol checks to deck by default', () => {
  const invalid = [
    { path: 'apps/host/src/modules/deck/deck.service.ts', content: 'export function createDeckOperations() {}\n' },
    {
      path: 'apps/host/src/modules/deck/deck.errors.ts',
      content: 'export class DeckWorkflowFailure extends Error {}\nexport function mapDeckFailure() {}\n',
    },
    { path: 'apps/host/src/modules/deck/deck.routes.ts', content: 'export function deckRouter() {}\n' },
    { path: 'apps/host/src/modules/deck/brief/brief-workflow.ts', content: 'export class BriefService {}\n' },
  ]
  assert.deepEqual(findings(invalid), [
    { path: 'apps/host/src/modules/deck/brief/brief-workflow.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/deck/deck.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/deck/deck.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/deck/deck.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/deck/deck.service.ts', line: 1, rule: 'role-file-symbol' },
  ])
  const valid = [
    { path: 'apps/host/src/modules/deck/deck.service.ts', content: 'export class DeckService {}\n' },
    { path: 'apps/host/src/modules/deck/deck.routes.ts', content: 'export function createDeckRoutes() {}\n' },
    {
      path: 'apps/host/src/modules/deck/deck.errors.ts',
      content: 'export class DeckWorkflowError extends Error {}\nexport function mapDeckError() {}\n',
    },
    { path: 'apps/host/src/modules/deck/brief/brief-workflow.ts', content: 'export class BriefWorkflow {}\n' },
  ]
  assert.deepEqual(findings(valid), [])
})

test('checkBoundaries applies role symbol checks to settings by default', () => {
  const invalid = [
    { path: 'apps/host/src/modules/settings/settings.service.ts', content: 'export function createSettings() {}\n' },
    { path: 'apps/host/src/modules/settings/settings.store.ts', content: 'export class WebState {}\n' },
    { path: 'apps/host/src/modules/settings/settings.routes.ts', content: 'export function settingsRouter() {}\n' },
    {
      path: 'apps/host/src/modules/settings/settings.errors.ts',
      content: 'export class WebStateFailure extends Error {}\nexport function mapWebStateFailure() {}\n',
    },
  ]
  assert.deepEqual(findings(invalid), [
    { path: 'apps/host/src/modules/settings/settings.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/settings/settings.errors.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/settings/settings.routes.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/settings/settings.service.ts', line: 1, rule: 'role-file-symbol' },
    { path: 'apps/host/src/modules/settings/settings.store.ts', line: 1, rule: 'role-file-symbol' },
  ])
  const valid = [
    { path: 'apps/host/src/modules/settings/settings.service.ts', content: 'export class SettingsService {}\n' },
    { path: 'apps/host/src/modules/settings/settings.store.ts', content: 'export class SqliteSettingsStore {}\n' },
    {
      path: 'apps/host/src/modules/settings/settings.routes.ts',
      content: 'export function createSettingsRoutes() {}\n',
    },
    {
      path: 'apps/host/src/modules/settings/settings.errors.ts',
      content: 'export class SettingsError extends Error {}\nexport function mapSettingsError() {}\n',
    },
  ]
  assert.deepEqual(findings(valid), [])
})
