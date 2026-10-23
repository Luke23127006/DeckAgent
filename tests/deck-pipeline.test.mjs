import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckClient, HostClient } from '../packages/client/runtime/lib/index.js'

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
      '--workspace',
      join(dir, 'workspace'),
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
  const decks = new DeckService(join(dir, 'data', 'decks.sqlite'))
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
test('Agent publishes through SSE/snapshot/content; drafts stay private and revision survives Host restart', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-pipeline-'))
  const options = {
    workspace: join(dir, 'workspace'),
    dataDir: join(dir, 'data'),
    confirmedDecks: [confirmed],
    selection: { provider: 'fixture', model: 'model' },
    model: {
      async *stream(request) {
        const last = request.messages.at(-1)
        if (last.role === 'user') {
          assert.ok(request.tools.some(tool => tool.name === 'publish_slide'))
          yield {
            type: 'tool-call',
            call: {
              id: 'draft',
              name: 'write_file',
              arguments: { path: 'slide.html', content: '<style>h1{color:green}</style><h1>Published slide</h1>' },
            },
          }
        } else if (last.role === 'tool' && last.name === 'write_file') {
          assert.equal(last.isError, false)
          yield {
            type: 'tool-call',
            call: {
              id: 'publish',
              name: 'publish_slide',
              arguments: {
                outlineId: 'outline-1',
                slideId: 'intro',
                expectedRevision: 0,
                publicationId: 'first',
                path: 'slide.html',
              },
            },
          }
        } else {
          assert.equal(last.isError, false)
          yield { type: 'text-delta', text: 'Slide published' }
          yield { type: 'finish', reason: 'stop' }
          return
        }
        yield { type: 'finish', reason: 'tool-calls' }
      },
    },
  }
  let app = await startLocalWeb(options)
  const abort = new AbortController()
  t.after(async () => {
    abort.abort()
    await app.close()
    await rm(dir, { recursive: true, force: true })
  })
  let deck = new DeckClient(app.origin, app.token)
  assert.equal((await fetch(`${app.origin}/api/sessions/pipeline/deck`)).status, 401)
  const original = await deck.snapshot('pipeline')
  assert.deepEqual(
    original.slides.map(s => s.status),
    ['pending', 'pending'],
  )
  const changes = deck.watch('pipeline', abort.signal)
  assert.equal((await changes.next()).value.version, 1)
  const change = changes.next()
  const chat = new HostClient(app.origin, app.token)
  const accepted = await chat.send({ sessionId: 'pipeline', input: 'Publish slide 1' })
  let completed
  for await (const state of chat.watch(accepted.requestId)) completed = state
  assert.equal(completed.status, 'completed')
  assert.equal((await change).value.version, 2)
  const snapshot = await deck.snapshot('pipeline')
  assert.deepEqual(
    snapshot.slides.map(s => [s.status, s.revision]),
    [
      ['published', 1],
      ['pending', 0],
    ],
  )
  assert.match((await deck.content('pipeline', 'intro', 1)).html, /Published slide/)
  assert.match(await readFile(join(dir, 'workspace', 'slide.html'), 'utf8'), /Published slide/)
  assert.equal((await fetch(`${app.origin}/slide.html`)).status, 404)
  await assert.rejects(deck.content('other-chat', 'intro', 1))
  await assert.rejects(deck.content('pipeline', 'later', 1))
  await changes.return()
  await app.close()
  app = await startLocalWeb(options)
  deck = new DeckClient(app.origin, app.token)
  assert.deepEqual(await deck.snapshot('pipeline'), snapshot)
  assert.match((await deck.content('pipeline', 'intro', 1)).html, /Published slide/)
  const reconnect = deck.watch('pipeline', abort.signal)
  assert.equal((await reconnect.next()).value.version, 2)
  await reconnect.return()
})
