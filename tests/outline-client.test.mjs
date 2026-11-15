import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { OutlineClient } from '../packages/client/runtime/lib/index.js'
import { resolveDesign } from '../packages/presentation/design/lib/index.js'
import { brief } from './fixtures/brief.mjs'

test('modern Outline decoder preserves Brief and structured content but rejects broken bindings', async t => {
  const briefRecord = {
    sessionId: 'chat',
    briefId: 'brief-00000000-0000-0000-0000-000000000001',
    version: 1,
    createdAt: new Date().toISOString(),
    draft: brief(),
    design: resolveDesign(),
  }
  const proposal = {
    outlineId: 'proposal',
    version: 1,
    requestId: 'request',
    responseIndex: 1,
    overview: 'Plan',
    status: 'current',
    brief: briefRecord,
    revisionSuggestions: ['Explain briefly'],
    changes: {
      briefFields: ['topic'],
      added: ['slide-1'],
      removed: [],
      changed: [],
      orderChanged: false,
      overviewChanged: true,
      suggestionsChanged: true,
    },
    slides: [
      {
        slideId: 'slide-1',
        title: 'First',
        content: 'Purpose',
        blocks: [{ kind: 'bullets', items: ['Purpose'] }],
        sources: [],
      },
    ],
  }
  let value = {
    sessionId: 'chat',
    active: true,
    version: 1,
    currentId: 'proposal',
    confirmedId: null,
    proposals: [proposal],
  }
  const server = createServer((_req, res) =>
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(value)),
  )
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(
    () =>
      new Promise(resolve => {
        server.closeAllConnections()
        server.close(resolve)
      }),
  )
  const client = new OutlineClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  assert.deepEqual((await client.snapshot('chat')).proposals[0], proposal)
  for (const broken of [
    { ...proposal, brief: { ...briefRecord, sessionId: 'other' } },
    { ...proposal, slides: [{ ...proposal.slides[0], blocks: [{ kind: 'script', text: 'bad' }] }] },
    {
      ...proposal,
      slides: [
        {
          ...proposal.slides[0],
          sources: [{ sourceId: 'src-00000000-0000-0000-0000-000000000001', version: 1, kind: 'attachment' }],
        },
      ],
    },
    { ...proposal, changes: { ...proposal.changes, orderChanged: 'yes' } },
  ]) {
    value = { ...value, proposals: [broken] }
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
  }
})

test('Outline client authenticates reads and rejects malformed, inconsistent and cross-Session proposals', async t => {
  const valid = {
    sessionId: 'chat',
    active: true,
    version: 1,
    currentId: 'proposal',
    confirmedId: null,
    proposals: [
      {
        outlineId: 'proposal',
        version: 1,
        requestId: 'request',
        responseIndex: 1,
        status: 'current',
        overview: 'A proposal',
        slides: [{ slideId: 'slide-1', title: 'First', content: 'A detailed plan, with no checked facts claimed.' }],
      },
    ],
  }
  let value = valid
  const server = createServer((req, res) => {
    assert.equal(req.url, '/api/sessions/chat/outline')
    if (req.headers.authorization !== 'Bearer fixture-token') {
      res.writeHead(401).end('{}')
      return
    }
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
  const client = new OutlineClient(origin, 'fixture-token')
  assert.deepEqual(await client.snapshot('chat'), valid)
  await assert.rejects(new OutlineClient(origin, 'wrong').snapshot('chat'), /AUTH_REQUIRED/)
  for (const invalid of [
    { ...valid, sessionId: 'other' },
    { ...valid, active: false },
    { ...valid, currentId: 'missing' },
    { ...valid, confirmedId: 'proposal' },
    { ...valid, proposals: [...valid.proposals, ...valid.proposals] },
    { ...valid, proposals: [{ ...valid.proposals[0], version: 2 }] },
    { ...valid, proposals: [{ ...valid.proposals[0], responseIndex: -1 }] },
    { ...valid, proposals: [{ ...valid.proposals[0], slides: [{ slideId: 'one', title: 'Title only' }] }] },
  ]) {
    value = invalid
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
  }
})
