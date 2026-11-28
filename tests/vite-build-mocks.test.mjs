// What this file checks: a production Vite build rejects a chunk that includes a module from mocks/ or msw.
// Environment: node:test runs one real Vite build in a temporary directory. There is no network and no fake.
// How to run: node --test --test-reporter=tap tests/vite-build-mocks.test.mjs
// Expected result: the build rejects with "forbidden mock module". The task that owns this test is docs/build/refactor/web-react/plan/task-04-configure-vite-tailwind-and-shadcn.md.
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { build } from '../apps/web/node_modules/vite/dist/node/index.js'
import { forbidMocksInBuild } from '../apps/web/vite.config.ts'

test('forbidMocksInBuild rejects chunks that include mocks or msw', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-vite-mocks-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  await mkdir(join(dir, 'mocks'), { recursive: true })
  await writeFile(join(dir, 'mocks', 'browser.js'), 'export const mockFlag = true\n')
  await writeFile(join(dir, 'entry.js'), "import { mockFlag } from './mocks/browser.js'\nconsole.log(mockFlag)\n")
  await assert.rejects(
    build({
      root: dir,
      logLevel: 'silent',
      plugins: [forbidMocksInBuild()],
      build: { write: false, rollupOptions: { input: join(dir, 'entry.js') } },
    }),
    /forbidden mock module/i,
  )
})
