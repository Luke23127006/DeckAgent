import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { materialBrowser, eventually } from './fixtures/material-browser.mjs'
import { openWireFixture, replyChat } from './fixtures/opencode-wire.mjs'

test('browser manually compacts without losing its draft or readable conversation', {
  skip: process.env.DECKAGENT_OPENCODE_CLI_TESTS !== '1',
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-browser-'))
  let calls = 0,
    fail = false
  const wire = await openWireFixture('chat-completions', (_body, res) => {
    calls++
    if (fail) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: 'Fixture unavailable' } }))
      return
    }
    replyChat(res, { text: 'Keep SOURCE_42 and only edit slide 2. Earlier outcomes are unconfirmed.' })
  })
  const selection = { provider: 'fixture', model: 'context-browser' }
  const app = await startLocalWeb({
    dataDir: root,
    selection,
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: wire.baseUrl }],
    openCode: {
      executable: resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
    },
  })
  const teardown = []
  t.after(async () => {
    for (const close of teardown) await close()
    await app.close()
    await wire.close()
    await rm(root, { recursive: true, force: true })
  })
  const response = await fetch(`${app.origin}/api/sessions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ selection }),
  })
  const chat = await response.json()
  const seed = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  await seed.append(chat.sessionId, [
    { role: 'user', content: 'SOURCE_42; only edit slide 2. '.repeat(80) },
    { role: 'assistant', content: 'Original history remains readable.' },
  ])
  seed.close()
  const client = new HostClient(app.origin, app.token)
  const history = await client.history(chat.sessionId)
  const { evaluate } = await materialBrowser(
    { after: close => teardown.push(close) },
    root,
    `${app.origin}/#token=${app.token}`,
  )
  await eventually(
    () =>
      evaluate(
        `!!document.querySelector('[data-session-id="${chat.sessionId}"]') && !document.querySelector('[data-session-id="${chat.sessionId}"]').disabled`,
      ),
    'Chat navigation not ready',
  )
  await evaluate(`document.querySelector('[data-session-id="${chat.sessionId}"]').click(); true`)
  await eventually(
    () =>
      evaluate(
        `document.querySelector('.messages')?.textContent.includes('Original history remains readable.') && !document.querySelector('.context-meter button')?.disabled`,
      ),
    'Context action missing',
  )
  await evaluate(
    `const input=document.querySelector('.composer textarea'); input.value='KEEP_UNSENT_DRAFT'; input.dispatchEvent(new Event('input')); true`,
  )
  await eventually(
    () => evaluate(`!document.querySelector('.context-meter button')?.disabled`),
    'Draft context measurement did not finish',
  )
  assert.equal(calls, 0, 'Showing context must not start inference')
  await evaluate(`document.querySelector('.context-meter button').click(); true`)
  await eventually(
    () => evaluate(`document.querySelector('.context-meter')?.textContent.includes('Đã Compact')`),
    'Checkpoint location not shown',
  )
  assert.equal(calls, 1)
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'KEEP_UNSENT_DRAFT')
  assert.equal(
    await evaluate(`document.querySelector('.messages').textContent.includes('Original history remains readable.')`),
    true,
  )
  assert.deepEqual(await client.history(chat.sessionId), history)
  await evaluate(`location.reload(); true`)
  await eventually(
    () => evaluate(`document.querySelector('.context-meter')?.textContent.includes('Đã Compact')`),
    'Checkpoint not restored',
  )
  assert.equal(calls, 1, 'Reload must not replay compact')
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'KEEP_UNSENT_DRAFT')
  fail = true
  await eventually(
    () => evaluate(`!document.querySelector('.context-meter button')?.disabled`),
    'Compact not idle after reload',
  )
  await evaluate(`document.querySelector('.context-meter button').click(); true`)
  await eventually(
    () =>
      evaluate(`document.querySelector('.context-meter [role="status"]')?.textContent.includes('Không Compact được')`),
    'Compact failure has no actionable message',
  )
  assert.equal(await evaluate(`document.querySelector('.composer textarea').value`), 'KEEP_UNSENT_DRAFT')
  assert.deepEqual(await client.history(chat.sessionId), history)
})
