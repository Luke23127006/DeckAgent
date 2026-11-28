// Tests: .oxlintrc.json import boundary rules and TypeScript safety rules.
// Environment: real oxlint binary spawned against temporary fixture files and the real .oxlintrc.json config (no mocked linter).
// Faults caught with this driver:
// - Removing http/app restrictions failed four route and error mapper tests.
// - node:fs/promises bypassed node:* in packages/client/runtime/src; test failed until node:*/* was added to .oxlintrc.json.
// - @ts-expect-error with description bypassed default typescript/ban-ts-comment; test failed until ts-expect-error: true was set.
// - Allowing @deckagent/* again in the apps/web/src override made each workspace package test in apps/web/src fail.
// - Each apps/web/src folder test failed before the Browser folder overrides existed in .oxlintrc.json.
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
    'apps/host/src/cli.ts',
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

test('rejects both node builtin and private subpath in apps/web/src', () => {
  const result = lintFixture(
    'apps/web/src/routes.tsx',
    "import fs from 'node:fs'\nimport { x } from '@deckagent/host-contracts/src/internal'\nconsole.log(fs, x)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 2)
  assert.match(result.diagnostics[0].help, /Browser code must not import Node-only modules\./)
  assert.match(result.diagnostics[1].help, /Import another package through its public exports only\./)
})

for (const specifier of [
  '@deckagent/host',
  '@deckagent/deck',
  '@deckagent/presentation-document',
  '@deckagent/design',
]) {
  test(`rejects ${specifier} import in apps/web/src`, () => {
    const result = lintFixture('apps/web/src/routes.tsx', `import { x } from '${specifier}'\nconsole.log(x)\n`)
    assert.equal(result.status, 1)
    assert.equal(result.diagnostics.length, 1)
    assert.ok(result.diagnostics[0].message.includes(specifier), result.diagnostics[0].message)
    assert.match(
      result.diagnostics[0].help,
      /Browser code imports only @deckagent\/host-contracts from the workspace\./,
    )
  })
}

test('rejects node:fs/promises subpath import in apps/web/src', () => {
  const result = lintFixture(
    'apps/web/src/text.ts',
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

test('rejects @deckagent/host import inside packages/host/contracts/src', () => {
  const result = lintFixture(
    'packages/host/contracts/src/wire.ts',
    "import { startHost } from '@deckagent/host'\nconsole.log(startHost)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/host/)
  assert.match(result.diagnostics[0].help, /Host contracts must not import runtime implementations\./)
})

test('rejects node:http import inside apps/host/src/runs/lifecycle', () => {
  const result = lintFixture(
    'apps/host/src/runs/lifecycle/controller.ts',
    "import type { ServerResponse } from 'node:http'\nexport type T = ServerResponse\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /node:http/)
  assert.match(
    result.diagnostics[0].help,
    /Agent core runs\/ must not import modules, HTTP, SQL, tools or concrete runtimes\./,
  )
})

test('rejects relative http-error import inside apps/host/src/runs/lifecycle', () => {
  const result = lintFixture(
    'apps/host/src/runs/lifecycle/controller.ts',
    "import { HttpError } from '../../http/http-error.ts'\nexport type T = typeof HttpError\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /\.\.\/\.\.\/http\/http-error\.ts/)
  assert.match(
    result.diagnostics[0].help,
    /Agent core runs\/ must not import modules, HTTP, SQL, tools or concrete runtimes\./,
  )
})

test('rejects relative http-error import inside apps/host/src/runs/run-controller.ts', () => {
  const result = lintFixture(
    'apps/host/src/runs/run-controller.ts',
    "import { HttpError } from '../http/http-error.ts'\nexport type T = typeof HttpError\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /\.\.\/http\/http-error\.ts/)
  assert.match(
    result.diagnostics[0].help,
    /Agent core runs\/ must not import modules, HTTP, SQL, tools or concrete runtimes\./,
  )
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
    'apps/host/src/cli.ts',
    "import { startHost } from '@deckagent/host'\nconsole.log(startHost)\n",
  )
  assert.equal(appResult.status, 0, appResult.output)
  assert.deepEqual(appResult.diagnostics, [])

  const browserResult = lintFixture(
    'apps/web/src/api/client.ts',
    "import type { AgentRequest } from '@deckagent/host-contracts'\nexport type Req = AgentRequest\n",
  )
  assert.equal(browserResult.status, 0, browserResult.output)
  assert.deepEqual(browserResult.diagnostics, [])
})

test('rejects feature, integration and store imports inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/app.ts',
    [
      "import { createChatOperations } from '../features/chats/index.ts'",
      "import { OpenCodeRuntime } from '../integrations/opencode/index.ts'",
      "import { MemoryDraftStore } from '../draft-store.ts'",
      "import { mapApplicationFailure } from '../runs/index.ts'",
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
      "import { SessionDatabase } from '../db/index.ts'",
      "import { DeckStore } from '@deckagent/deck'",
      'console.log(DatabaseSync, SessionDatabase, DeckStore)',
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

test('accepts local route helpers, Express and Node HTTP imports inside apps/host/src/http', () => {
  const result = lintFixture(
    'apps/host/src/http/start-host.ts',
    [
      "import { createServer } from 'node:http'",
      "import { json } from './route-helpers.ts'",
      "import express from 'express'",
      'console.log(createServer, json, express)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 0)
  assert.equal(result.diagnostics.length, 0)

  const errorHandlerAllowed = lintFixture(
    'apps/host/src/http/error-handler.ts',
    "import { RunFailure } from '../runs/ports.ts'\nconsole.log(RunFailure)\n",
  )
  assert.equal(errorHandlerAllowed.status, 0, errorHandlerAllowed.output)
  assert.equal(errorHandlerAllowed.diagnostics.length, 0)

  const errorHandlerDenied = lintFixture(
    'apps/host/src/http/error-handler.ts',
    [
      "import { RunController } from '../runs/lifecycle/index.ts'",
      "import { prepareStorage } from '../storage/index.ts'",
      'console.log(RunController, prepareStorage)',
      '',
    ].join('\n'),
  )
  assert.equal(errorHandlerDenied.status, 1)
  assert.equal(errorHandlerDenied.diagnostics.length, 2)
  assert.equal(errorHandlerDenied.diagnostics[0].code, 'eslint(no-restricted-imports)')
  assert.equal(errorHandlerDenied.diagnostics[1].code, 'eslint(no-restricted-imports)')

  const appStorageDenied = lintFixture(
    'apps/host/src/http/app.ts',
    "import { prepareStorage } from '../storage/index.ts'\nconsole.log(prepareStorage)\n",
  )
  assert.equal(appStorageDenied.status, 1)
  assert.equal(appStorageDenied.diagnostics.length, 1)
  assert.equal(appStorageDenied.diagnostics[0].code, 'eslint(no-restricted-imports)')
})

test('storage/ rejects modules, HTTP, runs, runtimes, tools, db, Express and SQLite', () => {
  const denied = lintFixture(
    'apps/host/src/storage/storage-root.ts',
    [
      "import { ChatService } from '../modules/chats/index.ts'",
      "import { createHttpApp } from '../http/app.ts'",
      "import { RunController } from '../runs/index.ts'",
      "import { OpenCodeAgentRuntime } from '../runtimes/opencode/index.ts'",
      "import { AttachmentParser } from '../tools/index.ts'",
      "import { ChatDatabase } from '../db/index.ts'",
      "import express from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      'console.log(ChatService, createHttpApp, RunController, OpenCodeAgentRuntime, AttachmentParser, ChatDatabase, express, DatabaseSync)',
      '',
    ].join('\n'),
  )
  assert.equal(denied.status, 1)
  assert.equal(denied.diagnostics.length, 8)
  for (const diagnostic of denied.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.match(diagnostic.help, /Application storage layer storage\/ must not import/)
  }
})

test('rejects Express, SQL, the HTTP edge and Host tools inside a runtime adapter', () => {
  const result = lintFixture(
    'apps/host/src/runtimes/opencode/runtime.ts',
    [
      "import express from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { createHttpApp } from '../../http/app.ts'",
      "import { prepareSourceTools } from '../../tools/index.ts'",
      'console.log(express, DatabaseSync, createHttpApp, prepareSourceTools)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 4)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.equal(diagnostic.help, 'A runtime adapter must not import Express, SQL, HTTP edge or Host tools directly.')
  }
})

test('rejects a runtime import inside apps/host/src/http and inside a module', () => {
  const http = lintFixture(
    'apps/host/src/http/app.ts',
    "import { OpenCodeRuntime } from '../runtimes/opencode/index.ts'\nconsole.log(OpenCodeRuntime)\n",
  )
  assert.equal(http.status, 1)
  assert.equal(http.diagnostics.length, 1)
  assert.match(http.diagnostics[0].help, /The HTTP edge must not import module services, stores or storage\./)

  const moduleIndex = lintFixture(
    'apps/host/src/modules/workspaces/index.ts',
    "import { OpenCodeRuntime } from '../../runtimes/opencode/index.ts'\nconsole.log(OpenCodeRuntime)\n",
  )
  assert.equal(moduleIndex.status, 1)
  assert.equal(moduleIndex.diagnostics.length, 1)
  assert.match(
    moduleIndex.diagnostics[0].help,
    /A module must not import the store of another module, a storage package or the HTTP edge\./,
  )
})

test('rejects a store, migrations, the SQL driver and another module store inside a module routes file', () => {
  const result = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import { SqliteWorkspaceStore } from './workspaces.store.ts'",
      "import { migrateWorkspacesDatabase } from './workspaces.migrations.ts'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { ChatStore } from '../chats/chats.store.ts'",
      'console.log(SqliteWorkspaceStore, migrateWorkspacesDatabase, DatabaseSync, ChatStore)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 4)
  const help = result.diagnostics.map(diagnostic => diagnostic.help).toSorted()
  assert.match(help[0], /A module must not import the store of another module, a storage package or the HTTP edge\./)
  assert.match(help[1], /A module route must not import a store or the SQL driver\./)
  assert.match(help[2], /A module route must not import a store or the SQL driver\./)
  assert.match(help[3], /A module route must not import a store or the SQL driver\./)
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
      "import { SessionDatabase } from '../../db/index.ts'",
      "import { createHttpApp } from '../../http/app.ts'",
      'console.log(ChatStore, SessionDatabase, createHttpApp)',
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

test('accepts the service, route helpers and Express inside a module routes file, and SQL inside a store file', () => {
  const routes = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.routes.ts',
    [
      "import type { WorkspaceService } from './workspaces.service.ts'",
      "import { json } from '../../http/route-helpers.ts'",
      "import { Router } from 'express'",
      'export const value: WorkspaceService | undefined = undefined',
      'console.log(json, Router)',
      '',
    ].join('\n'),
  )
  assert.equal(routes.status, 0)
  assert.equal(routes.diagnostics.length, 0)
  const store = lintFixture(
    'apps/host/src/modules/workspaces/workspaces.store.ts',
    "import { DatabaseSync } from 'node:sqlite'\nimport { migrateWorkspacesDatabase } from './workspaces.migrations.ts'\nconsole.log(DatabaseSync, migrateWorkspacesDatabase)\n",
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
      "import { SessionDatabase } from '../../db/index.ts'",
      "import { prepareSourceTools } from '../../tools/index.ts'",
      "import { Router } from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      'console.log(SessionDatabase, prepareSourceTools, Router, DatabaseSync)',
      '',
    ].join('\n'),
  )
  assert.equal(denied.status, 1)
  assert.equal(denied.diagnostics.length, 4)
  for (const diagnostic of denied.diagnostics) assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
  for (const name of ['../../db/index.ts', '../../tools/index.ts', 'express', 'node:sqlite'])
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
      "import { SessionDatabase } from '../../db/index.ts'",
      'console.log(readFile, SessionDatabase)',
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
      "import type { AttachmentPart } from '../sources/attachment.types.ts'",
      'console.log(createSourceAccess)',
      'export type Part = AttachmentPart',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 0, result.output)
  assert.deepEqual(result.diagnostics, [])
})

test('agent core runs rejects modules, runtimes, Express, SQL, HTTP and storage', () => {
  const result = lintFixture(
    'apps/host/src/runs/preparation/index.ts',
    [
      "import { createChatOperations } from '../../modules/chats/index.ts'",
      "import { OpenCodeRuntime } from '../../runtimes/opencode/index.ts'",
      "import express from 'express'",
      "import { DatabaseSync } from 'node:sqlite'",
      "import { createServer } from 'node:http'",
      "import { SessionDatabase } from '../../db/index.ts'",
      'console.log(createChatOperations, OpenCodeRuntime, express, DatabaseSync, createServer, SessionDatabase)',
      '',
    ].join('\n'),
  )
  assert.equal(result.status, 1, result.output)
  assert.equal(result.diagnostics.length, 6)
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.equal(diagnostic.help, 'Agent core runs/ must not import modules, HTTP, SQL, tools or concrete runtimes.')
  }
})

test('runtime adapter rejects a module import and accepts the runs port', () => {
  const denied = lintFixture(
    'apps/host/src/runtimes/opencode/provider.ts',
    "import type { ProviderRunSettings } from '../../modules/providers/index.ts'\nexport type Settings = ProviderRunSettings\n",
  )
  assert.equal(denied.status, 1, denied.output)
  assert.equal(denied.diagnostics.length, 1)
  assert.equal(denied.diagnostics[0].code, 'eslint(no-restricted-imports)')
  assert.match(denied.diagnostics[0].message, /\.\.\/\.\.\/modules\/providers\/index\.ts/)
  assert.equal(
    denied.diagnostics[0].help,
    'A runtime adapter must not import Express, SQL, HTTP edge or Host tools directly.',
  )

  const allowed = lintFixture(
    'apps/host/src/runtimes/opencode/provider.ts',
    "import type { ProviderRunSettings } from '../../runs/ports.ts'\nexport type Settings = ProviderRunSettings\n",
  )
  assert.equal(allowed.status, 0, allowed.output)
  assert.deepEqual(allowed.diagnostics, [])
})

for (const module of ['chats', 'deck']) {
  for (const suffix of ['routes', 'errors']) {
    test(`${module} ${suffix} imports route helpers and rejects HTTP composition`, () => {
      const allowed = lintFixture(
        `apps/host/src/modules/${module}/fixture.${suffix}.ts`,
        "import { json } from '../../http/route-helpers.ts'\nconsole.log(json)\n",
      )
      assert.equal(allowed.status, 0, allowed.output)
      for (const file of ['app', 'start-host', 'error-handler', 'change-feed']) {
        const denied = lintFixture(
          `apps/host/src/modules/${module}/fixture.${suffix}.ts`,
          `import { value } from '../../http/${file}.ts'\nconsole.log(value)\n`,
        )
        assert.equal(denied.status, 1, denied.output)
        assert.equal(denied.diagnostics[0].code, 'eslint(no-restricted-imports)')
      }
    })
  }
  test(`${module} service rejects route helpers`, () => {
    const denied = lintFixture(
      `apps/host/src/modules/${module}/fixture.service.ts`,
      "import { json } from '../../http/route-helpers.ts'\nconsole.log(json)\n",
    )
    assert.equal(denied.status, 1, denied.output)
    assert.equal(denied.diagnostics[0].code, 'eslint(no-restricted-imports)')
  })
}

test('database layer db/ rejects modules, HTTP, runs implementation, runtimes, tools and Express', () => {
  const denied = lintFixture(
    'apps/host/src/db/run-store.ts',
    [
      "import { SqliteChatStore } from '../modules/chats/index.ts'",
      "import { createHttpApp } from '../http/app.ts'",
      "import { RunController } from '../runs/lifecycle/index.ts'",
      "import { OpenCodeAgentRuntime } from '../runtimes/opencode/index.ts'",
      "import { prepareSourceTools } from '../tools/index.ts'",
      "import express from 'express'",
      'console.log(SqliteChatStore, createHttpApp, RunController, OpenCodeAgentRuntime, prepareSourceTools, express)',
      '',
    ].join('\n'),
  )
  assert.equal(denied.status, 1, denied.output)
  assert.equal(denied.diagnostics.length, 6)
  for (const diagnostic of denied.diagnostics) {
    assert.equal(diagnostic.code, 'eslint(no-restricted-imports)')
    assert.equal(
      diagnostic.help,
      'Database layer db/ must not import modules, HTTP, runs implementation, runtimes, tools or Express.',
    )
  }

  const allowed = lintFixture(
    'apps/host/src/db/run-store.ts',
    "import type { RunOwner } from '../runs/ports.ts'\nexport type Owner = RunOwner\n",
  )
  assert.equal(allowed.status, 0, allowed.output)
  assert.deepEqual(allowed.diagnostics, [])
})

test('module routes and services reject ../../db/index.ts while module stores accept it', () => {
  for (const file of ['apps/host/src/modules/chats/chats.routes.ts', 'apps/host/src/modules/chats/chats.service.ts']) {
    const denied = lintFixture(
      file,
      "import { SessionDatabase } from '../../db/index.ts'\nconsole.log(SessionDatabase)\n",
    )
    assert.equal(denied.status, 1, denied.output)
    assert.equal(denied.diagnostics.length, 1)
    assert.equal(denied.diagnostics[0].code, 'eslint(no-restricted-imports)')
    assert.match(denied.diagnostics[0].message, /\.\.\/\.\.\/db\/index\.ts/)
  }

  const allowed = lintFixture(
    'apps/host/src/modules/chats/chats.store.ts',
    "import { SessionDatabase } from '../../db/index.ts'\nconsole.log(SessionDatabase)\n",
  )
  assert.equal(allowed.status, 0, allowed.output)
  assert.deepEqual(allowed.diagnostics, [])
})

test('rejects a const enum', () => {
  const result = lintFixture(
    'apps/host/src/sample.ts',
    'const enum Phase {\n  Draft,\n}\nexport const first = Phase.Draft\n',
  )
  assert.equal(result.status, 1)
  assert.deepEqual(
    result.diagnostics.map(d => d.code),
    ['oxc(no-const-enum)'],
  )
})

const restrictedHelps = result =>
  result.diagnostics
    .filter(d => d.code === 'eslint(no-restricted-imports)')
    .map(d => d.help)
    .toSorted()

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
  for (const path of [
    'apps/web/src/components/request-row.tsx',
    'apps/web/src/layouts/app-shell.tsx',
    'apps/web/src/contexts/workspace-context.tsx',
  ]) {
    const result = lintFixture(
      path,
      "import { a } from '../pages/chat/chat-page.tsx'\nimport { b } from '../api/chats.ts'\nexport const all = [a, b]\n",
    )
    assert.equal(result.status, 1, path)
    assert.deepEqual(
      restrictedHelps(result),
      [
        'Shared code must not import a page. Move the shared code to src/components/.',
        'UI code must not call src/api/. Read and write server data through a hook in src/hooks/.',
      ],
      path,
    )
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
    'export const RequestRow = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />\n',
  )
  assert.equal(result.status, 1)
  assert.deepEqual(result.diagnostics.map(d => d.code).toSorted(), ['react(no-danger)', 'unicorn(filename-case)'])
})

test('browser folders accept the allowed data flow and main.tsx accepts mocks', () => {
  const fixtures = [
    [
      'apps/web/src/pages/chat/chat-page.tsx',
      "import { useChats } from '../../hooks/use-chats.ts'\nimport { Button } from '../../components/ui/button.tsx'\nimport type { AgentRequest } from '@deckagent/host-contracts'\nimport { useState } from 'react'\nexport const all = [useChats, Button, useState]\nexport type R = AgentRequest\n",
    ],
    [
      'apps/web/src/hooks/use-chats.ts',
      "import { listChats } from '../api/chats.ts'\nimport { useQuery } from '@tanstack/react-query'\nexport const all = [listChats, useQuery]\n",
    ],
    [
      'apps/web/src/main.tsx',
      "import { worker } from '../mocks/browser.ts'\nimport { createRoot } from 'react-dom/client'\nexport const all = [worker, createRoot]\n",
    ],
  ]
  for (const [path, code] of fixtures) {
    const result = lintFixture(path, code)
    assert.equal(result.status, 0, result.output)
    assert.deepEqual(result.diagnostics, [], path)
  }
})
