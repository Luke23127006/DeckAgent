import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { finished, startApp, waitFor } from './fixtures/b02-helpers.mjs'

async function fixture(t, extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-source-requests-'))
  const source = join(dir, 'project')
  await mkdir(source)
  await writeFile(join(source, 'notes.txt'), 'project marker')
  const outside = join(dir, 'outside.txt')
  await writeFile(outside, 'outside marker')
  const state = await startApp(dir, { ...extra, options: { providerAccess: { check: async () => {}, catalog: async () => ['model-a'] } } })
  t.after(async () => { await state.app.close(); await rm(dir, { recursive: true, force: true }) })
  const saved = await state.call('providers/test', 'PUT', { displayName: 'Fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:9/v1', key: 'fixture', models: ['model-a'], new: true })
  assert.equal(saved.status, 200)
  return { ...state, dir, source, outside }
}

test('Host-scoped MCP reads project sources, refuses native writes and leaves the source folder unchanged', { timeout: 30000 }, async t => {
  const f = await fixture(t)
  assert.equal((await f.call('workspaces', 'POST', { folder: f.source })).status, 200)
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-read]' })
  const events = await finished(f.client, accepted.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events.at(-1)))
  assert.ok((await f.client.history(chat.sessionId)).at(-1).content.includes('project marker'))
  assert.ok(events.some(event => event.kind === 'activity' && event.type === 'tool' && event.status === 'completed'))
  const forbidden = await f.client.send({ sessionId: chat.sessionId, input: '[mcp-forbidden]' })
  await finished(f.client, forbidden.requestId)
  assert.ok((await f.client.history(chat.sessionId)).at(-1).content.includes('TOOL_NOT_ALLOWED'))
  assert.equal(await readFile(join(f.source, 'notes.txt'), 'utf8'), 'project marker')
})

test('outside reads ask per step and refusal does not reprompt the same denied step', { timeout: 30000 }, async t => {
  const f = await fixture(t)
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: `[mcp-twice] ${f.outside}` })
  const pending = await waitFor(async () => (await f.client.snapshot(accepted.requestId)).pendingApproval)
  assert.equal((await f.client.snapshot(accepted.requestId)).status, 'waiting_approval')
  await f.client.decide(accepted.requestId, pending.approvalId, 'allow-once')
  const next = await waitFor(async () => { const item = (await f.client.snapshot(accepted.requestId)).pendingApproval; return item?.approvalId !== pending.approvalId ? item : undefined })
  await f.client.decide(accepted.requestId, next.approvalId, 'refuse')
  const events = await finished(f.client, accepted.requestId)
  assert.equal(events.at(-1).status, 'completed')
  assert.equal(events.filter(event => event.kind === 'approval' && event.approval.state === 'pending').length, 2)
  const history = (await f.client.history(chat.sessionId)).at(-1).content
  assert.ok(history.includes('outside marker'))
  assert.ok(history.includes('Không thực hiện vì bạn đã từ chối'))
})

test('Stop while approval is pending cancels it and rejects a late decision', { timeout: 30000 }, async t => {
  const f = await fixture(t)
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: `[mcp-external] ${f.outside}` })
  const pending = await waitFor(async () => (await f.client.snapshot(accepted.requestId)).pendingApproval)
  assert.equal((await f.client.stop(accepted.requestId)).status, 'stopped')
  await assert.rejects(f.client.decide(accepted.requestId, pending.approvalId, 'allow-once'), /REQUEST_CLOSED/)
  assert.equal((await f.client.snapshot(accepted.requestId)).pendingApproval, null)
})

test('approval waiting pauses model timeout, which resumes after the decision', { timeout: 30000 }, async t => {
  const f = await fixture(t, { openCode: { timeoutMs: 2000 } })
  const chat = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data
  const accepted = await f.client.send({ sessionId: chat.sessionId, input: `[hang]\n[mcp-external] ${f.outside}` })
  const pending = await waitFor(async () => (await f.client.snapshot(accepted.requestId)).pendingApproval)
  await new Promise(resolve => setTimeout(resolve, 2500))
  assert.equal((await f.client.snapshot(accepted.requestId)).status, 'waiting_approval')
  await f.client.decide(accepted.requestId, pending.approvalId, 'allow-once')
  const events = await finished(f.client, accepted.requestId)
  assert.equal(events.at(-1).status, 'failed')
  assert.equal(events.at(-1).errorCode, 'REQUEST_TIMEOUT')
})
