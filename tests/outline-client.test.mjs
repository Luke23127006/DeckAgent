import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { OutlineClient } from '../packages/client/runtime/lib/index.js'

test('Outline client authenticates reads and rejects malformed, inconsistent and cross-Session proposals', async t => {
  const valid = { sessionId: 'chat', active: true, version: 1, currentId: 'proposal', confirmedId: null, proposals: [{
    outlineId: 'proposal', version: 1, requestId: 'request', responseIndex: 1, status: 'current', overview: 'A proposal',
    slides: [{ slideId: 'slide-1', title: 'First', content: 'A detailed plan, with no checked facts claimed.' }],
  }] }
  let value = valid
  const server = createServer((req, res) => {
    assert.equal(req.url, '/api/sessions/chat/outline')
    if (req.headers.authorization !== 'Bearer fixture-token') { res.writeHead(401).end('{}'); return }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(value))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))
  const origin = `http://127.0.0.1:${server.address().port}`
  const client = new OutlineClient(origin, 'fixture-token')
  assert.deepEqual(await client.snapshot('chat'), valid)
  await assert.rejects(new OutlineClient(origin, 'wrong').snapshot('chat'), /AUTH_REQUIRED/)
  for (const invalid of [
    { ...valid, sessionId: 'other' }, { ...valid, active: false }, { ...valid, currentId: 'missing' },
    { ...valid, confirmedId: 'proposal' }, { ...valid, proposals: [...valid.proposals, ...valid.proposals] },
    { ...valid, proposals: [{ ...valid.proposals[0], version: 2 }] },
    { ...valid, proposals: [{ ...valid.proposals[0], responseIndex: -1 }] },
    { ...valid, proposals: [{ ...valid.proposals[0], slides: [{ slideId: 'one', title: 'Title only' }] }] },
  ]) {
    value = invalid
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
  }
})
