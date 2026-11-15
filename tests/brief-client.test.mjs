import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'node:http'
import { BriefClient, decodeBriefView } from '../packages/client/runtime/lib/index.js'
import { resolveDesign } from '../packages/presentation/design/lib/index.js'
import { brief } from './fixtures/brief.mjs'

test('Brief client authenticates reads/writes and rejects cross-Chat, malformed or inconsistent projections', async t => {
  const valid = {
    sessionId: 'chat',
    version: 1,
    locked: false,
    current: {
      sessionId: 'chat',
      briefId: 'brief-00000000-0000-0000-0000-000000000001',
      version: 1,
      createdAt: new Date().toISOString(),
      draft: brief(),
      design: resolveDesign(),
    },
    sourceStates: [],
  }
  let value = valid
  const server = createServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer fixture-token') {
      res.writeHead(401).end('{}')
      return
    }
    if (req.method === 'PUT') {
      let body = ''
      for await (const chunk of req) body += chunk
      assert.deepEqual(JSON.parse(body), { expectedVersion: 0, draft: brief() })
    }
    assert.match(req.url, /^\/api\/sessions\/chat\/brief(?:\/versions\/1)?$/)
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(value))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise(resolve => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  )
  const origin = `http://127.0.0.1:${server.address().port}`
  const client = new BriefClient(origin, 'fixture-token')
  assert.deepEqual(await client.snapshot('chat'), valid)
  assert.deepEqual(await client.snapshot('chat', 1), valid)
  assert.deepEqual(await client.save('chat', 0, brief()), valid)
  await assert.rejects(new BriefClient(origin, 'wrong').snapshot('chat'), /AUTH_REQUIRED/)
  for (const invalid of [
    { ...valid, sessionId: 'other' },
    { ...valid, version: 2 },
    { ...valid, sourceStates: [{}] },
    { ...valid, current: null },
    { ...valid, current: { ...valid.current, sessionId: 'other' } },
    {
      ...valid,
      current: { ...valid.current, draft: { ...brief(), sources: { ...brief().sources, modelKnowledge: 'yes' } } },
    },
    { ...valid, current: { ...valid.current, draft: { ...brief(), secret: 'rejected field' } } },
    { ...valid, current: { ...valid.current, design: null } },
    { ...valid, current: { ...valid.current, design: { ...valid.current.design, theme: {} } } },
  ]) {
    value = invalid
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
    assert.throws(() => decodeBriefView(invalid, 'chat'), /INVALID_RESPONSE/)
  }
})
