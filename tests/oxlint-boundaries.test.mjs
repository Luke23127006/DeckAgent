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
    "import { DeckService } from '@deckagent/deck'\nconsole.log(DeckService)\n",
  )
  assert.equal(result.status, 1)
  assert.equal(result.diagnostics.length, 1)
  assert.match(result.diagnostics[0].message, /@deckagent\/deck/)
  assert.match(result.diagnostics[0].help, /Browser code must not import Local Host or domain packages\./)
})

test('rejects node:fs/promises subpath import in legacy packages/client/runtime/src', () => {
  const result = lintFixture(
    'packages/client/runtime/src/sample.ts',
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

test('rejects @ts-expect-error with description and explicit any', () => {
  const result = lintFixture(
    'apps/web/src/sample.ts',
    '// @ts-expect-error reason\nexport const value: any = 1\n',
  )
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
