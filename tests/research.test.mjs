import assert from 'node:assert/strict'
import test from 'node:test'
import * as app from '../apps/local-web/lib/index.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startApp, finished, filesContaining, waitFor, MemoryCredentials } from './fixtures/b02-helpers.mjs'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { DatabaseSync } from 'node:sqlite'

const freeUsage = { key: { usage: 0, limit: null }, account: { current_plan: 'Researcher', plan_usage: 0, plan_limit: 1000, paygo_usage: 0, paygo_limit: null } }
test('research accepts only free accounts and checks usage before bounded basic search', async () => {
  const calls = []
  let usage = freeUsage
  const client = new app.TavilyClient(async (url, init) => {
    calls.push({ url, init })
    return Response.json(url.endsWith('/usage') ? usage : { request_id: 'test-call', results: [{ title: 'Public source', url: 'https://example.org/report', content: 'Known source content.' }] })
  })
  const signal = new AbortController().signal
  const result = await client.search('test-key', 'public topic', signal)
  assert.equal(result.results[0].content, 'Known source content.')
  assert.deepEqual(calls.map(x => new URL(x.url).pathname), ['/usage', '/search'])
  const sent = JSON.parse(calls[1].init.body)
  assert.equal(sent.search_depth, 'basic')
  assert.equal(sent.max_results, 5)
  assert.equal(sent.auto_parameters, false)
  usage = { ...freeUsage, account: { ...freeUsage.account, current_plan: 'Project' } }
  await assert.rejects(client.search('test-key', 'public topic', signal), { code: 'RESEARCH_FREE_ONLY' })
  assert.equal(calls.filter(x => x.url.endsWith('/search')).length, 1)
})

test('free-only search rejects quota, malformed metadata, redirects, oversized responses and unsafe URLs', async () => {
  for (const account of [
    { ...freeUsage.account, plan_usage: 1000 },
    { ...freeUsage.account, paygo_limit: 100 },
    { ...freeUsage.account, paygo_usage: 1 },
    { ...freeUsage.account, current_plan: 'unknown' },
    {},
  ]) {
    let searches = 0
    const client = new app.TavilyClient(async url => { if (url.endsWith('/search')) searches++; return Response.json({ ...freeUsage, account }) })
    await assert.rejects(client.search('fixture-key', 'public topic', new AbortController().signal))
    assert.equal(searches, 0)
  }
  for (const response of [
    () => new Response('do not expose fixture-key', { status: 401 }),
    () => new Response('redirect', { status: 302 }),
    () => Response.json({ results: [{ title: 'unsafe', url: 'javascript:alert(1)', content: 'unsafe' }] }),
    () => new Response('x'.repeat(256 * 1024 + 1)),
  ]) {
    const client = new app.TavilyClient(async url => url.endsWith('/usage') ? Response.json(freeUsage) : response())
    await assert.rejects(client.search('fixture-key', 'public topic', new AbortController().signal), error => !error.message.includes('fixture-key'))
  }
})

test('research choice and attempt budget are durable, isolated and revoked at terminal state; v6 migrates', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-research-budget-'))
  const path = join(dir, 'sessions.sqlite')
  let store = new SqliteSessionStore(path)
  t.after(async () => { store.close(); await rm(dir, { recursive: true, force: true }) })
  await store.open('a'); await store.open('b')
  store.close()
  const old = new DatabaseSync(path)
  old.exec('DROP TABLE research_sources; DROP TABLE request_research; PRAGMA user_version=6;')
  old.close()
  store = new SqliteSessionStore(path)
  store.requests.admit({ requestId: 'off', sessionId: 'b', input: 'off', selection: { provider: 'p', model: 'm' } })
  assert.throws(() => store.requests.reserveResearch('off', 'b'), { code: 'RESEARCH_NOT_SELECTED' })
  store.requests.admit({ requestId: 'on', sessionId: 'a', input: 'on', publicResearch: true, selection: { provider: 'p', model: 'm' } })
  assert.throws(() => store.requests.reserveResearch('on', 'b'))
  store.requests.reserveResearch('on', 'a')
  store.requests.reserveResearch('on', 'a')
  store.close(); store = new SqliteSessionStore(path)
  store.requests.reserveResearch('on', 'a')
  assert.throws(() => store.requests.reserveResearch('on', 'a'), { code: 'RESEARCH_BUDGET_EXHAUSTED' })
  assert.equal(store.requests.get('on').publicResearch, true)
  store.requests.finish('on', 'stopped')
  assert.throws(() => store.requests.recordResearch('on', 'a', 'query', { results: [] }), { code: 'REQUEST_CLOSED' })
})

test('research is opt-in through Host, retains exact sources across restart and keeps keys private', { timeout: 30000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-research-'))
  const secret = 'secret-research-fixture-9234'
  const credentials = new MemoryCredentials()
  let searches = 0
  let accountUsage = freeUsage
  const options = { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] }, researchAccess: { key: secret, fetch: async (url, init) => {
    if (init.headers.Authorization === 'Bearer invalid-key') return new Response('invalid-key must not leak', { status: 401 })
    if (url.endsWith('/usage')) return Response.json(accountUsage)
    searches++
    return Response.json({ request_id: 'public-search-123', results: [{ title: 'Source title', url: 'https://example.org/facts', content: 'Public fact: the number is 482.' }] })
  } } }
  let f = await startApp(dir, { options, credentials })
  t.after(async () => { await f.app.close(); await rm(dir, { recursive: true, force: true }) })
  assert.equal((await f.call('research', 'PUT', { useEnvironment: true })).status, 200)
  assert.equal((await f.call('research', 'PUT', { key: secret })).status, 200)
  const savedReferences = [...credentials.values.keys()]
  const rejected = await f.call('research', 'PUT', { key: 'invalid-key' })
  assert.equal(rejected.status, 503)
  assert.equal(JSON.stringify(rejected.data).includes('invalid-key'), false)
  assert.deepEqual([...credentials.values.keys()], savedReferences)
  assert.equal((await f.call('providers/test', 'PUT', { displayName: 'Fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:9/v1', key: 'model-fixture', models: ['model-a'], new: true })).status, 200)
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const off = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research]' })
  await finished(f.client, off.requestId)
  assert.equal(searches, 0)
  const on = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research]', publicResearch: true })
  await finished(f.client, on.requestId)
  assert.equal(searches, 1)
  const sources = (await f.call('sessions/' + chat.sessionId + '/research-sources')).data
  assert.equal(sources[0].content, 'Public fact: the number is 482.')
  assert.equal(sources[0].url, 'https://example.org/facts')
  assert.equal(sources[0].providerRequestId, 'public-search-123')
  const other = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  assert.deepEqual((await f.call('sessions/' + other.sessionId + '/research-sources')).data, [])
  assert.equal((await f.call('sessions/absent/research-sources')).status, 404)
  assert.equal(JSON.stringify((await f.call('settings')).data).includes(secret), false)
  assert.deepEqual(await filesContaining(join(dir, 'data'), secret), [])
  await f.app.close()
  f = await startApp(dir, { options, credentials })
  assert.deepEqual((await f.call('sessions/' + chat.sessionId + '/research-sources')).data, sources)
  const reread = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research-read] ' + sources[0].sourceId })
  await finished(f.client, reread.requestId)
  assert.ok((await f.client.history(chat.sessionId)).at(-1).content.includes('Public fact: the number is 482.'))
  assert.equal(searches, 1, 'Reading a saved source must not access Tavily')
  const foreign = await f.client.send({ sessionId: other.sessionId, input: '[mcp-research-read] ' + sources[0].sourceId })
  await finished(f.client, foreign.requestId)
  assert.equal((await f.client.history(other.sessionId)).at(-1).content.includes('Public fact: the number is 482.'), false)
  const budget = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research] [research-budget]', publicResearch: true })
  await finished(f.client, budget.requestId)
  assert.equal(searches, 4, 'Only three more searches may leave the Host')
  assert.ok((await f.client.history(chat.sessionId)).at(-1).content.includes('RESEARCH_BUDGET_EXHAUSTED'))
  accountUsage = { ...freeUsage, account: { ...freeUsage.account, current_plan: 'Project' } }
  assert.equal((await f.call('research', 'PUT', { key: 'replacement-must-not-be-saved' })).status, 503)
  assert.equal((await f.call('settings')).data.research.configured, true)
  const paid = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research]', publicResearch: true })
  await finished(f.client, paid.requestId)
  assert.equal(searches, 4)
  assert.ok((await f.client.history(chat.sessionId)).at(-1).content.includes('RESEARCH_FREE_ONLY'))
  assert.equal((await f.call('research', 'DELETE')).status, 200)
  await assert.rejects(f.client.send({ sessionId: chat.sessionId, input: '[mcp-research]', publicResearch: true }), /RESEARCH_UNAVAILABLE/)
  assert.deepEqual(await filesContaining(join(dir, 'data'), 'replacement-must-not-be-saved'), [])
})

test('Stop aborts research network work and prevents late sources from being committed', { timeout: 30000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-research-stop-'))
  let started = false, aborted = false
  const f = await startApp(dir, { options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] }, researchAccess: { key: 'stop-key', fetch: async (url, init) => {
    if (url.endsWith('/usage')) return Response.json(freeUsage)
    started = true
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => { aborted = true; reject(init.signal.reason) }, { once: true }))
  } } } })
  t.after(async () => { await f.app.close(); await rm(dir, { recursive: true, force: true }) })
  await f.call('providers/test', 'PUT', { displayName: 'Fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:9/v1', key: 'fixture', models: ['model-a'], new: true })
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-research]', publicResearch: true })
  await waitFor(() => started)
  assert.equal((await f.client.stop(accepted.requestId)).status, 'stopped')
  await waitFor(() => aborted)
  assert.deepEqual((await f.call('sessions/' + chat.sessionId + '/research-sources')).data, [])
})
