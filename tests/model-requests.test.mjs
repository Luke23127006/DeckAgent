import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { defaultCredentialStore } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { MemoryCredentials, filesContaining, finished, listTree, providerFixture, runs, startApp, waitFor } from './fixtures/b02-helpers.mjs'

const key = 'sk-deckagent-test-KEY-7f3a9c'

async function workspace(t, prefix) {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  const cleanups = []
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup()
    await rm(dir, { recursive: true, force: true })
  })
  return { dir, cleanup: fn => cleanups.push(fn) }
}

/** A saved custom provider with two added models, and a chat that selected the first. */
async function configured(call, baseUrl, extra = {}) {
  const saved = await call('providers/fixture', 'PUT', { displayName: 'Fixture', protocol: 'chat-completions', baseUrl, models: ['model-a', 'model-b'], key, new: true, ...extra })
  assert.equal(saved.status, 200, JSON.stringify(saved.data))
  const chat = (await call('sessions', 'POST', {})).data
  assert.equal((await call(`sessions/${chat.sessionId}/selection`, 'PUT', { provider: 'fixture', model: 'model-a' })).status, 200)
  return chat
}

test('provider setup: checked before saving, failed checks save nothing, keys never come back', { timeout: 60000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-providers-')
  const current = { current: key }
  const provider = await providerFixture(current)
  cleanup(provider.close)
  const credentials = new MemoryCredentials()
  const { app, call } = await startApp(dir, { credentials })
  cleanup(() => app.close())
  const base = { displayName: 'Fixture', protocol: 'chat-completions', baseUrl: provider.baseUrl, models: ['model-a'], new: true }

  const refused = await call('providers/fixture', 'PUT', { ...base, key: 'sk-wrong-key' })
  assert.equal(refused.status, 422)
  assert.equal(refused.data.error.code, 'PROVIDER_KEY_REFUSED')
  assert.equal(JSON.stringify(refused.data).includes('sk-wrong-key'), false, 'The provider refusal text is never passed on')
  const silent = await call('providers/fixture', 'PUT', { ...base, baseUrl: 'http://127.0.0.1:1/v1', key })
  assert.equal(silent.data.error.code, 'PROVIDER_NO_ANSWER')
  assert.deepEqual((await call('settings')).data.providers, [], 'A failed check saves nothing')
  assert.equal(credentials.values.size, 0)

  const taken = await call('providers/openai', 'PUT', { ...base, key })
  assert.equal(taken.status, 409)
  assert.deepEqual(taken.data.error, { code: 'PROVIDER_ID_TAKEN', message: 'Request could not be completed', detail: { provider: 'OpenAI', builtIn: true } })
  const missing = await call('providers/google', 'PUT', { displayName: 'Google Gemini', protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: [], new: true })
  assert.equal(missing.data.error.code, 'PROVIDER_KEY_REQUIRED')
  assert.equal(missing.data.error.detail.missing, 'key')

  assert.equal((await call('providers/fixture', 'PUT', { ...base, key })).status, 200)
  const settings = (await call('settings')).data
  assert.deepEqual(settings.providers.map(item => [item.id, item.hasKey, item.keyAvailable, item.builtIn]), [['fixture', true, true, false]])
  assert.equal(JSON.stringify(settings).includes(key), false, 'No part of a saved key is returned (FR-040)')
  assert.deepEqual(settings.builtIns.map(item => item.id), ['openai', 'anthropic', 'google', 'deepseek'])
  assert.equal((await call('providers/fixture', 'PUT', { ...base, displayName: 'Again', key })).data.error.code, 'PROVIDER_ID_TAKEN')

  // A refused new key keeps the saved one (UC-005 A1/A6).
  const firstRef = [...credentials.values.keys()][0]
  assert.equal((await call('providers/fixture', 'PUT', { ...base, new: false, key: 'sk-rotated-wrong' })).data.error.code, 'PROVIDER_KEY_REFUSED')
  assert.deepEqual([...credentials.values.entries()], [[firstRef, key]])
  // Catalog, then a model by hand that the catalog does not hold; adding models runs no check and no model.
  assert.deepEqual((await call('providers/fixture/catalog')).data, ['model-a', 'model-b', 'model-c'])
  assert.equal((await call('providers/fixture', 'PUT', { ...base, new: false, models: ['model-a', 'hand-typed-model'] })).status, 200)
  await provider.close()
  const unavailable = await call('providers/fixture/catalog')
  assert.equal(unavailable.status, 502)
  assert.deepEqual(unavailable.data.error.detail, { reason: 'no-answer' })
  assert.equal((await call('providers/fixture', 'PUT', { ...base, new: false, models: ['model-a', 'hand-typed-model', 'another'] })).status, 200,
    'Manual model IDs stay possible without the catalog')
  assert.deepEqual((await call('settings')).data.providers[0].models, ['model-a', 'hand-typed-model', 'another'])

  // Delete: configuration, models and key leave DeckAgent.
  assert.equal((await call('providers/fixture', 'DELETE')).status, 200)
  assert.deepEqual((await call('settings')).data.providers, [])
  assert.equal(credentials.values.size, 0)
})

test('generic requests through the OpenCode CLI: admission, events, native resume and its guard', { timeout: 120000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-requests-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const { app, log, call, client } = await startApp(dir)
  cleanup(() => app.close())

  // FR-046: no model, no request; the draft stays.
  const bare = (await call('sessions', 'POST', {})).data
  await call(`sessions/${bare.sessionId}/draft`, 'PUT', { text: 'kept draft' })
  const refused = await call('requests', 'POST', { sessionId: bare.sessionId, input: 'hello' })
  assert.equal(refused.status, 409)
  assert.deepEqual(refused.data.error.detail, { reason: 'no-provider' })
  assert.equal((await call(`sessions/${bare.sessionId}/draft`)).data.text, 'kept draft')
  assert.deepEqual((await call(`sessions/${bare.sessionId}/history`)).data, [])
  assert.equal(runs(log).length, 0, 'No run starts without a model')

  const chat = await configured(call, provider.baseUrl)
  const settings = (await call('settings')).data
  assert.deepEqual(settings.runtime, { available: true })
  const first = await client.send({ sessionId: chat.sessionId, input: 'hello' })
  assert.equal(first.status, 'active')
  const events = await finished(client, first.requestId)
  assert.deepEqual(events.map(event => event.kind === 'status' ? `status:${event.status}` : event.kind === 'activity' ? `${event.id}:${event.status}` : event.kind),
    ['status:active', 'model-1:running', 'text', 'model-1:completed', 'status:completed'], 'The repeated text frame is saved once')
  assert.deepEqual((await client.history(chat.sessionId)), [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'Echo 1: hello' }])
  const requests = (await call(`sessions/${chat.sessionId}/requests`)).data
  assert.deepEqual(requests.map(item => [item.status, item.selection.model, item.historyStart]), [['completed', 'model-a', 0]])
  const [run1] = runs(log)
  assert.equal(run1.resume, null)
  assert.ok(run1.prompt.startsWith('Current Host source manifest (data, not permissions):'))
  assert.ok(run1.prompt.endsWith('\n\nhello'))
  assert.equal(run1.configHasKeyReference, true)
  assert.equal(run1.configHasLiteralKey, false, 'The key reaches the run through its environment only')
  assert.ok(run1.keySha)
  assert.ok(run1.cwd.startsWith(join(app.dataDir, 'files', 'runtime')), 'The run works in a managed folder, never a project folder')

  // Same chat and scope: resume with the current source manifest and new text, without replaying history.
  const second = await client.send({ sessionId: chat.sessionId, input: 'again' })
  await finished(client, second.requestId)
  const run2 = runs(log)[1]
  assert.ok(run2.resume?.startsWith('ses_'))
  assert.ok(run2.prompt.endsWith('\n\nagain'))
  assert.equal(run2.prompt.includes('Earlier conversation of this chat'), false)
  assert.equal((await client.history(chat.sessionId)).at(-1).content, 'Echo 2: again')

  // Another chat never shares the native session.
  const other = (await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'model-a' } })).data
  const elsewhere = await client.send({ sessionId: other.sessionId, input: 'separate' })
  await finished(client, elsewhere.requestId)
  const run3 = runs(log)[2]
  assert.equal(run3.resume, null)
  assert.notEqual(run3.cwd, run2.cwd)

  // A model change fails the resume guard: a new native session, seeded with the saved conversation, no tool replay.
  await call(`sessions/${chat.sessionId}/selection`, 'PUT', { provider: 'fixture', model: 'model-b' })
  const switched = await client.send({ sessionId: chat.sessionId, input: 'after switch' })
  const switchedEvents = await finished(client, switched.requestId)
  assert.ok(switchedEvents.some(event => event.kind === 'notice' && event.code === 'NEW_RUNTIME_SESSION'))
  const run4 = runs(log)[3]
  assert.equal(run4.resume, null)
  assert.ok(run4.prompt.includes('"content":"hello"') && run4.prompt.includes('Echo 2: again'))
  assert.ok(run4.prompt.endsWith("The user's new request:\nafter switch"))
  assert.equal((await client.history(chat.sessionId)).at(-1).content, 'Echo 1: after switch')
  assert.equal((await call(`sessions/${chat.sessionId}/requests`)).data.at(-1).selection.model, 'model-b')

  // A missing native session (expired upstream) starts a new one in the same request; history is kept.
  await rm(join(run4.cwd, '..', 'data', 'fake-opencode-sessions.json'))
  const recovered = await client.send({ sessionId: chat.sessionId, input: 'still there?' })
  const recoveredEvents = await finished(client, recovered.requestId)
  assert.equal(recoveredEvents.at(-1).status, 'completed')
  assert.deepEqual(runs(log).slice(4).map(entry => entry.resume === null), [false, true])
  assert.equal((await client.history(chat.sessionId)).length, 8)
})

test('FR-079: a conversation that outgrows the context is summarized by the runtime, the boundary is saved, history stays whole', { timeout: 120000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-summary-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const { app, log, call, client } = await startApp(dir)
  cleanup(() => app.close())
  const chat = await configured(call, provider.baseUrl)
  const shape = events => events.map(event => event.kind === 'status' ? `status:${event.status}${event.errorCode ? `:${event.errorCode}` : ''}`
    : event.kind === 'activity' ? `${event.id}:${event.status}` : event.kind === 'notice' ? `notice:${event.code}` : event.kind)
  await finished(client, (await client.send({ sessionId: chat.sessionId, input: 'hello' })).requestId)

  // Resumed native session overflows: the summary is written by OpenCode, the request is answered and completes,
  // although the CLI exits 1 after reporting the overflow.
  const long = await client.send({ sessionId: chat.sessionId, input: 'long [overflow]' })
  const longEvents = await finished(client, long.requestId)
  assert.deepEqual(shape(longEvents), ['status:active', 'model-1:running', 'model-1:failed', 'summary-1:running', 'summary-1:completed',
    'notice:CONVERSATION_SUMMARIZED', 'model-2:running', 'text', 'model-2:completed', 'status:completed'])
  assert.ok(runs(log)[1].resume?.startsWith('ses_'))
  const history = await client.history(chat.sessionId)
  assert.deepEqual(history.map(item => item.content), ['hello', 'Echo 1: hello', 'long [overflow]', 'Echo 2: long [overflow]'],
    'The user still reads the whole conversation; neither the summary nor the runtime\'s own note becomes a message')
  const records = (await call(`sessions/${chat.sessionId}/requests`)).data
  assert.deepEqual(records.map(item => item.summarized ?? false), [false, true], 'The boundary is saved with the request it starts at')
  assert.equal(records[1].historyStart, 2)

  // The summary cannot be written: the request does not finish, nothing is retried elsewhere, the conversation stays.
  const failing = await client.send({ sessionId: chat.sessionId, input: 'more [overflow-fail]' })
  const failingEvents = await finished(client, failing.requestId)
  assert.deepEqual(shape(failingEvents), ['status:active', 'model-1:running', 'model-1:failed', 'summary-1:running', 'summary-1:failed',
    'status:failed:CONTEXT_SUMMARY_FAILED'])
  assert.equal(runs(log).length, 3, 'A failed summary does not start another native session in the same request')
  assert.deepEqual((await client.history(chat.sessionId)).slice(0, 4), history)
  assert.equal((await call(`sessions/${chat.sessionId}/requests`)).data.at(-1).summarized, undefined)

  // The failed request breaks continuity: the next one starts a new native session seeded with the whole saved
  // conversation (no message dropped), and an overflow of that seed goes through the same summary path.
  const seeded = await client.send({ sessionId: chat.sessionId, input: 'seeded [overflow]' })
  const seededEvents = await finished(client, seeded.requestId)
  assert.equal(seededEvents.at(-1).status, 'completed')
  assert.ok(seededEvents.some(event => event.kind === 'notice' && event.code === 'CONVERSATION_SUMMARIZED'))
  const run4 = runs(log)[3]
  assert.equal(run4.resume, null)
  assert.ok(run4.prompt.includes('"content":"hello"') && run4.prompt.includes('more [overflow-fail]'))
  assert.equal(run4.prompt.includes('not included'), false)
  assert.equal((await client.history(chat.sessionId)).at(-1).content, 'Echo 1: seeded [overflow]')

  // NFR-006: the provider's overflow message echoed the key; nothing saved holds it.
  await app.close()
  assert.deepEqual(await filesContaining(join(dir, 'data'), key), [])
  assert.ok(!longEvents.concat(seededEvents).some(event => event.kind === 'text' && /SUMMARY-TEXT|Continue if/.test(event.text)),
    'The summary the model reads and the runtime\'s own note are not saved as the reply')
})

test('Stop, failures, reconnect and two chats at once', { timeout: 120000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-stop-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const { app, log, call, client } = await startApp(dir)
  cleanup(() => app.close())
  const chat = await configured(call, provider.baseUrl)

  // Stop a run that sends nothing more: shown at once, process ended, finished text kept, no more writes.
  const hung = await client.send({ sessionId: chat.sessionId, input: 'wait [hang]' })
  await waitFor(async () => (await client.snapshot(hung.requestId)).text)
  assert.equal((await client.send({ sessionId: chat.sessionId, input: 'second' }).catch(error => error.message)), 'SESSION_BUSY')
  const started = Date.now()
  const stopped = await client.stop(hung.requestId)
  assert.equal(stopped.status, 'stopped')
  assert.ok(Date.now() - started < 2000)
  const pid = runs(log).at(-1).pid
  await waitFor(() => { try { process.kill(pid, 0); return false } catch { return true } })
  const afterStop = (await finished(client, hung.requestId)).at(-1).sequence
  await new Promise(done => setTimeout(done, 300))
  assert.equal((await client.snapshot(hung.requestId)).sequence, afterStop, 'Nothing is written after Stop')
  assert.deepEqual((await call(`sessions/${chat.sessionId}/activities`)).data.map(item => item.status), ['stopped'])
  assert.deepEqual((await client.history(chat.sessionId)).at(-1), { role: 'assistant', content: 'Partial answer before Stop', interrupted: true })
  // A later request is new work: a new native session, not the stopped execution resumed.
  const next = await client.send({ sessionId: chat.sessionId, input: 'next' })
  assert.equal((await finished(client, next.requestId)).at(-1).status, 'completed')
  assert.equal(runs(log).at(-1).resume, null)

  for (const [marker, code] of [['[auth]', 'PROVIDER_AUTH'], ['[crash]', 'RUNTIME_FAILED'], ['[malformed]', 'RUNTIME_PROTOCOL'], ['[incomplete]', 'RUNTIME_INCOMPLETE']]) {
    const failed = await client.send({ sessionId: chat.sessionId, input: `try ${marker} [stderr-secret]` })
    const last = (await finished(client, failed.requestId)).at(-1)
    assert.deepEqual([last.status, last.errorCode], ['failed', code], marker)
  }
  // A denied native tool is a failed activity, not a failed request (FR-070).
  const tool = await client.send({ sessionId: chat.sessionId, input: 'read a file [tool]' })
  const toolEvents = await finished(client, tool.requestId)
  assert.equal(toolEvents.at(-1).status, 'completed')
  assert.ok(toolEvents.some(event => event.kind === 'activity' && event.id === 'tool-call_1' && event.status === 'failed'))

  // Reconnect: read part of the stream, drop it, continue from the cursor; nothing missing, nothing twice.
  const slow = await client.send({ sessionId: chat.sessionId, input: 'go [slow] [split]' })
  const seen = []
  for await (const event of client.watch(slow.requestId)) { seen.push(event); if (event.kind === 'text') break }
  for await (const event of client.watch(slow.requestId, undefined, seen.at(-1).sequence)) seen.push(event)
  assert.deepEqual(seen.map(event => event.sequence), seen.map((_, index) => index + 1))
  assert.equal(seen.at(-1).status, 'completed')

  // Two chats run at the same time.
  const other = (await call('sessions', 'POST', { selection: { provider: 'fixture', model: 'model-a' } })).data
  const [a, b] = await Promise.all([client.send({ sessionId: chat.sessionId, input: 'A [slow]' }), client.send({ sessionId: other.sessionId, input: 'B [slow]' })])
  const [endA, endB] = await Promise.all([finished(client, a.requestId), finished(client, b.requestId)])
  assert.deepEqual([endA.at(-1).status, endB.at(-1).status], ['completed', 'completed'])

  // NFR-006: the key reaches only the run; nothing DeckAgent saved holds it, although provider errors and stderr echoed it.
  await app.close()
  assert.deepEqual(await filesContaining(join(dir, 'data'), key), [])
})

test('Host restart: an active request is shown as not finished and never started again', { timeout: 60000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-restart-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const credentials = new MemoryCredentials()
  let { app, log, call, client } = await startApp(dir, { credentials })
  const chat = await configured(call, provider.baseUrl)
  const hung = await client.send({ sessionId: chat.sessionId, input: 'long [hang]' })
  await waitFor(async () => (await client.snapshot(hung.requestId)).text)
  await app.close()
  const count = runs(log).length
  ;({ app, call, client } = await startApp(dir, { credentials }))
  cleanup(() => app.close())
  const snapshot = await client.snapshot(hung.requestId)
  assert.deepEqual([snapshot.status, snapshot.errorCode], ['interrupted', 'HOST_STOPPED'])
  assert.equal((await call('sessions')).data.find(item => item.sessionId === chat.sessionId).activeRequestId, undefined)
  assert.deepEqual((await client.history(chat.sessionId)).map(message => message.content), ['long [hang]', 'Partial answer before Stop'])
  await new Promise(done => setTimeout(done, 300))
  assert.equal(runs(log).length, count, 'Nothing runs again after restart')

  // A crash leaves the request active in storage; the next start marks it not finished.
  await app.close()
  const store = new SqliteSessionStore(join(dir, 'data', 'db', 'sessions.sqlite'))
  store.requests.admit({ requestId: 'req-crashed', sessionId: chat.sessionId, input: 'crashed', selection: { provider: 'fixture', model: 'model-a' } })
  store.close()
  ;({ app, client } = await startApp(dir, { credentials }))
  const crashed = await client.snapshot('req-crashed')
  assert.deepEqual([crashed.status, crashed.errorCode], ['interrupted', 'HOST_RESTARTED'])
  assert.equal(runs(log).length, count)
})

test('workspace with an active request is not removed or moved; provider changes reach only later requests', { timeout: 60000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-workspace-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const project = join(dir, 'project')
  const moved = join(dir, 'moved')
  await mkdir(project)
  await mkdir(moved)
  await writeFile(join(project, 'notes.txt'), 'user file')
  const before = await listTree(project)
  const { app, log, call, client } = await startApp(dir)
  cleanup(() => app.close())
  const added = (await call('workspaces', 'POST', { folder: project })).data
  const workspaceId = added.selectedId
  const chat = await configured(call, provider.baseUrl)
  assert.equal((await call('sessions')).data.find(item => item.sessionId === chat.sessionId).workspaceId, workspaceId)
  const hung = await client.send({ sessionId: chat.sessionId, input: 'hold [hang]' })
  await waitFor(async () => (await client.snapshot(hung.requestId)).text)
  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE')).data.error.code, 'WORKSPACE_REQUEST_ACTIVE')
  assert.equal((await call(`workspaces/${workspaceId}/folder`, 'PUT', { folder: moved })).data.error.code, 'WORKSPACE_REQUEST_ACTIVE')
  assert.equal((await client.snapshot(hung.requestId)).status, 'active', 'The refusal stops no request (UC-013 A5)')

  // Removing the selected model during the run: the run keeps its settings; the chat has no selected model after.
  assert.equal((await call('providers/fixture', 'PUT', { displayName: 'Fixture', protocol: 'chat-completions', baseUrl: provider.baseUrl, models: ['model-b'] })).status, 200)
  const session = (await call('sessions')).data.find(item => item.sessionId === chat.sessionId)
  assert.equal(session.selection, undefined)
  assert.deepEqual(session.removedSelection, { provider: 'fixture', model: 'model-a' })
  assert.equal(session.selectable, false)
  assert.equal((await client.snapshot(hung.requestId)).status, 'active')
  await client.stop(hung.requestId)
  assert.equal((await call('requests', 'POST', { sessionId: chat.sessionId, input: 'x' })).data.error.detail.reason, 'model-removed')

  assert.equal((await call(`workspaces/${workspaceId}`, 'DELETE')).status, 200)
  assert.deepEqual(await listTree(project), before, 'Nothing was written into the project folder')
  assert.ok(runs(log).every(entry => !entry.cwd.startsWith(project)))
})

test('runtime missing, wrong version or unsafe configuration: clear refusal, chat records kept', { timeout: 60000 }, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-runtime-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const credentials = new MemoryCredentials()
  let { app, call, log, client } = await startApp(dir, { credentials, openCode: { executable: join(dir, 'no-opencode.exe'), launcherArgs: [] } })
  const chat = await configured(call, provider.baseUrl)
  assert.deepEqual((await call('settings')).data.runtime, { available: false, reason: 'RUNTIME_UNAVAILABLE' })
  const missing = await call('requests', 'POST', { sessionId: chat.sessionId, input: 'hello' })
  assert.deepEqual([missing.status, missing.data.error.code], [503, 'RUNTIME_UNAVAILABLE'])
  assert.deepEqual((await call(`sessions/${chat.sessionId}/history`)).data, [])
  await app.close()

  await writeFile(`${log}.mode.json`, JSON.stringify({ version: '0.0.1' }))
  ;({ app, call, client } = await startApp(dir, { credentials }))
  const wrong = await call('requests', 'POST', { sessionId: chat.sessionId, input: 'hello' })
  assert.deepEqual([wrong.status, wrong.data.error.code], [503, 'RUNTIME_VERSION_UNSUPPORTED'])
  await app.close()

  await writeFile(`${log}.mode.json`, JSON.stringify({ unsafe: true, version: 'fake-1.0.0' }))
  ;({ app, call, client } = await startApp(dir, { credentials }))
  cleanup(() => app.close())
  const unsafe = await client.send({ sessionId: chat.sessionId, input: 'hello' })
  const last = (await finished(client, unsafe.requestId)).at(-1)
  assert.deepEqual([last.status, last.errorCode], ['failed', 'RUNTIME_CONFIG_UNSAFE'])
  assert.equal(runs(log).length, 0, 'No model work starts when tools are not denied')
  assert.deepEqual((await client.history(chat.sessionId)).map(message => message.role), ['user'], 'The request stays in the chat')
})

test('Windows credential store: keys are kept protected under Application Storage, never in SQLite', {
  skip: process.platform !== 'win32', timeout: 90000,
}, async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-dpapi-')
  const provider = await providerFixture({ current: key })
  cleanup(provider.close)
  const data = join(dir, 'data')
  let { app, call } = await startApp(dir, { credentials: defaultCredentialStore(data) })
  await configured(call, provider.baseUrl)
  await app.close()
  assert.deepEqual(await filesContaining(data, key), [], 'Neither SQLite nor the credential file holds the key in plain text')
  assert.equal((await listTree(join(data, 'credentials'))).length, 1)
  ;({ app, call } = await startApp(dir, { credentials: defaultCredentialStore(data) }))
  cleanup(() => app.close())
  const settings = (await call('settings')).data
  assert.deepEqual(settings.providers.map(item => [item.hasKey, item.keyAvailable]), [[true, true]])
  assert.equal(settings.persistentKeys, true)
  assert.equal((await call('providers/fixture', 'DELETE')).status, 200)
  assert.deepEqual(await listTree(join(data, 'credentials')), [], 'Deleting the configuration deletes its key')
})

test('without a protected store a key is refused, never saved in plain text', async t => {
  const { dir, cleanup } = await workspace(t, 'deckagent-b02-nostore-')
  const provider = await providerFixture(undefined)
  cleanup(provider.close)
  const { app, call } = await startApp(dir, { credentials: defaultCredentialStore(join(dir, 'data'), 'linux') })
  cleanup(() => app.close())
  assert.equal((await call('settings')).data.persistentKeys, false)
  const refused = await call('providers/local', 'PUT', { displayName: 'Local', protocol: 'chat-completions', baseUrl: provider.baseUrl, models: ['m'], key, new: true })
  assert.equal(refused.data.error.code, 'CREDENTIAL_STORE_UNAVAILABLE')
  // A local model service without a key still works.
  assert.equal((await call('providers/local', 'PUT', { displayName: 'Local', protocol: 'chat-completions', baseUrl: provider.baseUrl, models: ['m'], new: true })).status, 200)
  await app.close()
  assert.deepEqual(await filesContaining(join(dir, 'data'), key), [])
})
