import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckClient } from '../packages/client/runtime/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'

const confirmed = {
  sessionId: 'pipeline',
  outlineId: 'outline-1',
  slides: [
    { slideId: 'intro', title: 'Introduction' },
    { slideId: 'later', title: 'Later' },
  ],
}

test('CLI imports the explicit confirmed-deck fixture without a model or cloud request', {
  timeout: 10000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-deck-cli-'))
  const child = spawn(
    process.execPath,
    [
      'apps/local-web/lib/cli.js',
      '--confirmed-deck',
      'config/deck.confirmed.example.json',
      '--data-dir',
      join(dir, 'data'),
      '--no-open',
    ],
    {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, DECKAGENT_PROVIDER: '', DECKAGENT_MODEL: '' },
    },
  )
  const closed = once(child, 'exit')
  t.after(async () => {
    child.kill()
    await closed
    await rm(dir, { recursive: true, force: true })
  })
  let output = ''
  await Promise.race([
    new Promise(resolve =>
      child.stdout.on('data', chunk => {
        output += chunk.toString()
        if (output.includes('Browser opening disabled')) resolve()
      }),
    ),
    closed.then(() => {
      throw new Error('CLI exited before Host startup')
    }),
  ])
  assert.match(output, /DeckAgent Local Host: http:\/\/127\.0\.0\.1:/)
  assert.doesNotMatch(output, /token=/)
  child.kill()
  await closed
  const decks = new DeckService(join(dir, 'data', 'db', 'decks.sqlite'))
  try {
    assert.deepEqual(
      decks.snapshot('task-005-demo').slides.map(s => [s.slideId, s.status]),
      [
        ['intro', 'pending'],
        ['summary', 'pending'],
      ],
    )
  } finally {
    decks.close()
  }
})

test('A saved deck reads through Host snapshot, content and events; the chat says it has slides; restart keeps it', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-pipeline-'))
  const database = join(dir, 'data', 'db')
  // Seeded state stands in for a deck that a later build publishes through the Agent runtime.
  const seededChats = new SqliteSessionStore(join(database, 'sessions.sqlite'))
  await seededChats.open('pipeline')
  await seededChats.append('pipeline', [{ role: 'user', content: 'Two slides please' }])
  seededChats.close()
  const seeded = new DeckService(join(database, 'decks.sqlite'))
  seeded.confirm('pipeline', confirmed)
  seeded.publish('pipeline', {
    outlineId: 'outline-1',
    slideId: 'intro',
    expectedRevision: 0,
    publicationId: 'first',
    html: '<style>h1{color:green}</style><h1>Published slide</h1>',
  })
  seeded.close()
  const options = { dataDir: join(dir, 'data') }
  let app = await startLocalWeb(options)
  const abort = new AbortController()
  t.after(async () => {
    abort.abort()
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  let deck = new DeckClient(app.origin, app.token)
  assert.equal((await fetch(`${app.origin}/api/sessions/pipeline/deck`)).status, 401)
  const snapshot = await deck.snapshot('pipeline')
  assert.deepEqual(
    snapshot.slides.map(s => [s.status, s.revision]),
    [
      ['published', 1],
      ['pending', 0],
    ],
  )
  assert.match((await deck.content('pipeline', 'intro', 1)).html, /Published slide/)
  await assert.rejects(deck.content('other-chat', 'intro', 1))
  await assert.rejects(deck.content('pipeline', 'later', 1))
  const sessions = await (
    await fetch(`${app.origin}/api/sessions`, { headers: { authorization: `Bearer ${app.token}` } })
  ).json()
  assert.equal(sessions.find(session => session.sessionId === 'pipeline').hasSlides, true)
  await app.close()
  app = await startLocalWeb(options)
  deck = new DeckClient(app.origin, app.token)
  assert.deepEqual(await deck.snapshot('pipeline'), snapshot)
  assert.match((await deck.content('pipeline', 'intro', 1)).html, /Published slide/)
  const reconnect = deck.watch('pipeline', abort.signal)
  assert.equal((await reconnect.next()).value.version, snapshot.version)
  await reconnect.return()
})
