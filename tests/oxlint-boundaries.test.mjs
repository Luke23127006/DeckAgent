// Tests: .oxlintrc.json import boundary rules and TypeScript safety rules.
// Environment: real oxlint binary spawned against temporary fixture files and the real .oxlintrc.json config (no mocked linter).
// Faults caught with this driver:
// - node:fs/promises bypassed node:* in packages/client/runtime/src; test failed until node:*/* was added to .oxlintrc.json.
// - @ts-expect-error with description bypassed default typescript/ban-ts-comment; test failed until ts-expect-error: true was set.
// - Removing @deckagent/deck from the apps/web/src/browser override caused the @deckagent/deck browser test to fail.
// Run: node --test --test-reporter=tap tests/oxlint-boundaries.test.mjs
// Expected values source: docs/conventions/project-structure.md (Dependency rules) and docs/conventions/code.md (TypeScript).
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
    const result = spawnSync(oxlintBin, ['-c', configPath, '--format=json', file], {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    })
    const parsed = JSON.parse(result.stdout)
    return {
      status: result.status,
      diagnostics: parsed.diagnostics.map(d => ({ code: d.code, message: d.message, help: d.help ?? '' })),
      output: `${result.stdout}\n${result.stderr}`,
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('rejects private src subpath import in apps', () => {
  const result = lintFixture(
    'apps/web/src/index.ts',
    "import { x } from '@deckagent/deck/src/internal'\nconsole.log(x)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.equal(result.diagnostics[0].code, 'eslint(no-restricted-imports)')
  assert.match(result.diagnostics[0].message, /@deckagent\/deck\/src\/internal/)
  assert.match(result.diagnostics[0].help, /Import another package through its public exports only\./)
})

test('rejects private lib subpath import in packages', () => {
  const result = lintFixture(
    'packages/host/api/src/index.ts',
    "import { y } from '@deckagent/deck/lib/index.js'\nconsole.log(y)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.equal(result.diagnostics[0].code, 'eslint(no-restricted-imports)')
  assert.match(result.diagnostics[0].message, /@deckagent\/deck\/lib\/index\.js/)
  assert.match(result.diagnostics[0].help, /Import another package through its public exports only\./)
})

test('rejects both node builtin and private subpath in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/boot.ts',
    "import fs from 'node:fs'\nimport { x } from '@deckagent/deck/src/internal'\nconsole.log(fs, x)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 2)
  assert.match(result.diagnostics[0].help, /Browser code must not import Node-only modules\./)
  assert.match(result.diagnostics[1].help, /Import another package through its public exports only\./)
})

test('rejects @deckagent/host-api import in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import { startHost } from '@deckagent/host-api'\nconsole.log(startHost)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/host-api/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Local Host or domain packages\./)
})

test('rejects @deckagent/deck import in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import { DeckStore } from '@deckagent/deck'\nconsole.log(DeckStore)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/deck/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Local Host or domain packages\./)
})

test('rejects node:fs/promises subpath import in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/sample.ts',
    "import { readFile } from 'node:fs/promises'\nconsole.log(readFile)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /node:fs\/promises/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Node-only modules\./)
})

test('rejects node:http import inside packages/host/contracts/src', () => {
  const result = lintFixture(
    'packages/host/contracts/src/wire.ts',
    "import { createServer } from 'node:http'\nconsole.log(createServer)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /node:http/)
  assert.match(result.diagnostics[0].help, /Host contracts must not import runtime implementations\./)
})

test('rejects @deckagent/host-api import inside packages/host/contracts/src', () => {
  const result = lintFixture(
    'packages/host/contracts/src/wire.ts',
    "import { startHost } from '@deckagent/host-api'\nconsole.log(startHost)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/host-api/)
  assert.match(result.diagnostics[0].help, /Host contracts must not import runtime implementations\./)
})

test('rejects node:http import inside packages/host/api/src/lifecycle', () => {
  const result = lintFixture(
    'packages/host/api/src/lifecycle/controller.ts',
    "import type { ServerResponse } from 'node:http'\nexport type T = ServerResponse\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /node:http/)
  assert.match(result.diagnostics[0].help, /Request Lifecycle must not import HTTP transport modules\./)
})

test('rejects relative http-error import inside packages/host/api/src/lifecycle', () => {
  const result = lintFixture(
    'packages/host/api/src/lifecycle/controller.ts',
    "import { HttpError } from '../http-error.ts'\nexport type T = typeof HttpError\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /\.\.\/http-error\.ts/)
  assert.match(result.diagnostics[0].help, /Request Lifecycle must not import HTTP transport modules\./)
})

test('rejects relative http-error import inside packages/host/api/src/request-controller.ts', () => {
  const result = lintFixture(
    'packages/host/api/src/request-controller.ts',
    "import { HttpError } from './http-error.ts'\nexport type T = typeof HttpError\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /\.\/http-error\.ts/)
  assert.match(result.diagnostics[0].help, /Request Lifecycle must not import HTTP transport modules\./)
})

test('rejects @ts-expect-error with description and explicit any', () => {
  const result = lintFixture('apps/web/src/sample.ts', '// @ts-expect-error reason\nexport const value: any = 1\n')
  assert.equal(result.status, 1)
  assert.deepEqual(
    result.diagnostics.map(d => d.code),
    ['typescript(ban-ts-comment)', 'typescript(no-explicit-any)'],
  )
})

test('accepts valid public package imports and allowed browser contract imports', () => {
  const appResult = lintFixture(
    'apps/web/src/index.ts',
    "import { startHost } from '@deckagent/host-api'\nconsole.log(startHost)\n",
  )
  assert.equal(appResult.status, 0, appResult.output)
  assert.deepEqual(appResult.diagnostics, [])

  const browserResult = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import type { AgentRequest } from '@deckagent/host-contracts'\nexport type Req = AgentRequest\n",
  )
  assert.equal(browserResult.status, 0, browserResult.output)
  assert.deepEqual(browserResult.diagnostics, [])
})

test('rejects @deckagent/host import in apps/web/src/browser', () => {
  const result = lintFixture(
    'apps/web/src/browser/transport/client.ts',
    "import { startLocalWeb } from '@deckagent/host'\nconsole.log(startLocalWeb)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/host/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Local Host or domain packages\./)
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
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 4)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /The HTTP edge must not import module services, stores or storage\./)
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
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /The HTTP edge must not import module services, stores or storage\./)
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
    ].join('\n'),
  )
  assert.equal(result.status, 0)
  assert.equal(result.diagnostics.length, 0)
})

test('rejects a store, the SQL driver and another module store inside a module routes file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import { WorkspaceRegistry } from './workspaces.store.ts'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { ChatStore } from '../chats/chats.store.ts'",
      'console.log(WorkspaceRegistry, DatabaseSync, ChatStore)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  const help = result.diagnostics.map(diagnostic => diagnostic.help).toSorted()
  assert.match(help[0], /A module must not import the store of another module, a storage package or the HTTP edge\./)
  assert.match(help[1], /A module route must not import a store or the SQL driver\./)
  assert.match(help[2], /A module route must not import a store or the SQL driver\./)
})

test('rejects Express and the SQL driver inside a module service file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.service.ts',
    [
      "import { Router } from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      'console.log(Router, DatabaseSync)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 2)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /A module service must not import Express or the SQL driver\./)
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
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 3)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(
      diagnostic.help,
      /A module must not import the store of another module, a storage package or the HTTP edge\./,
    )
  }
})

test('rejects a module import inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/app.ts',
    "import { createWorkspaceRoutes } from '../modules/workspaces/index.ts'\nconsole.log(createWorkspaceRoutes)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].help, /The HTTP edge must not import module services, stores or storage\./)
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
    ].join('\n'),
  )
  assert.equal(routes.status, 0)
  assert.equal(routes.diagnostics.length, 0)
  const store = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.store.ts',
    "import { DatabaseSync } from 'node:sqlite'\nimport { initialize } from './schema.ts'\nconsole.log(DatabaseSync, initialize)\n",
  )
  assert.equal(store.status, 0)
  assert.equal(store.diagnostics.length, 0)
})

test('deck services accept the deck package and reject storage packages, Express and SQL', () => {
  const allowed = lintFixture(
    'apps/host/src/modules/deck/deck.service.ts',
    "import { DeckStore } from '@deckagent/deck'\nconsole.log(DeckStore)\n",
  )
  assert.equal(allowed.status, 0, allowed.output)
  assert.deepEqual(allowed.diagnostics, [])
  const denied = lintFixture(
    'apps/host/src/modules/deck/deck.service.ts',
    [
      "import { SqliteSessionStore } from '@deckagent/session-persistence'",
      "import { prepareSourceTools } from '../../tools/index.ts'",
      "import { Router } from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      'console.log(SqliteSessionStore, prepareSourceTools, Router, DatabaseSync)',
      '',
    ].join('\n'),
  )
  assert.equal(denied.status, 1)
  assert.equal(denied.diagnostics.length, 4)
  for (const diagnostic of denied.diagnostics) assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
  for (const name of ['@deckagent/session-persistence', '../../tools/index.ts', 'express', 'node:sqlite'])
    assert.ok(
      denied.diagnostics.some(diagnostic => diagnostic.message.includes(name)),
      name,
    )
})

test('deck routes and other modules reject the deck package', () => {
  for (const path of ['apps/host/src/modules/deck/deck.routes.ts', 'apps/host/src/modules/workspaces/index.ts']) {
    const result = lintFixture(path, "import { DeckStore } from '@deckagent/deck'\nconsole.log(DeckStore)\n")
    assert.equal(result.status, 1, result.output)
    assert.equal(result.diagnostics.length, 1)
    assert.equal(result.diagnostics[0].code, 'eslint(no-restricted-imports)')
    assert.match(result.diagnostics[0].message, /@deckagent\/deck/)
  }
})

test('tool executors reject node:fs, module and storage imports', () => {
  const result = lintFixture(
    'apps/host/src/tools/executors/source-tools.ts',
    [
      "import { readFile } from 'node:fs/promises'",
      "import type { WorkspaceLookup } from '../../modules/workspaces/index.ts'",
      "import { SqliteSessionStore } from '@deckagent/session-persistence'",
      'console.log(readFile, SqliteSessionStore)',
      'export type Lookup = WorkspaceLookup',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1, result.output)
  assert.equal(result.diagnostics.length, 3)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.equal(
      diagnostic.help,
      'Tool executors must not import modules, HTTP, SQL or node:fs directly. Read files through tools/policy/.',
    )
  }
})

test('tool executors accept policy and source contracts', () => {
  const result = lintFixture(
    'apps/host/src/tools/executors/source-tools.ts',
    [
      "import { createSourceAccess } from '../policy/source-access.ts'",
      "import type { AttachmentPart } from '../sources/attachment-contracts.ts'",
      'console.log(createSourceAccess)',
      'export type Part = AttachmentPart',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 0, result.output)
  assert.deepEqual(result.diagnostics, [])
})
