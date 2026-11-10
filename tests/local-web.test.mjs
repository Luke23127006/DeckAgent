import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { StorageError, startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

test('Local Web serves the page and fixed assets only; saved history survives a restart without a model', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-web-'))
  const apps = []
  t.after(async () => {
    for (const app of apps) await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  const dataDir = join(dir, 'data')
  // Seeded history stands in for a request that a later build sends.
  const seed = new SqliteSessionStore(join(dataDir, 'db', 'sessions.sqlite'))
  await seed.open('seeded')
  await seed.append('seeded', [
    { role: 'user', content: 'Draft a deck' },
    { role: 'assistant', content: 'Saved answer' },
  ])
  seed.close()
  const app = await startLocalWeb({ dataDir })
  apps.push(app)
  const page = await fetch(app.origin)
  assert.equal(page.status, 200)
  assert.match(await page.text(), /\/client\/boot\.js/)
  assert.equal((await fetch(`${app.origin}/slide.html`)).status, 404)
  assert.equal((await fetch(`${app.origin}/api/sessions`)).status, 401, 'the API needs the capability token')
  await app.close()
  const restarted = await startLocalWeb({ dataDir })
  apps.push(restarted)
  const history = await new HostClient(restarted.origin, restarted.token).history('seeded')
  assert.deepEqual(
    history.map(message => message.content),
    ['Draft a deck', 'Saved answer'],
  )
})

test('A data location that is a file fails clearly and is left unchanged', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-data-file-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const file = join(dir, 'not-a-folder')
  await writeFile(file, 'user content')
  await assert.rejects(
    startLocalWeb({ dataDir: file }),
    error => error instanceof StorageError && error.code === 'STORAGE_NOT_DIRECTORY' && !error.message.includes(dir),
  )
})
