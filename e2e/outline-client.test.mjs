import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { OutlineClient } from './fixtures/browser-driver/index.mjs'
import { resolveDesign } from '@deckagent/design'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'
import { DeckStore } from '@deckagent/deck'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('saved web-image Outlines remain readable and malformed image blocks are rejected', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'web-outline-decoder-'))
  const decks = new DeckStore(join(dir, 'decks.sqlite'))
  t.after(async () => {
    decks.close()
    await rm(dir, { recursive: true, force: true })
  })
  const saved = decks.saveBrief('chat', {
    expectedVersion: 0,
    draft: {
      ...brief(),
      proposedSlideCount: 1,
      sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      images: { mode: 'public-research', attachmentIds: [], unmetRequirements: [] },
    },
  })
  decks.proposeBoundOutline('chat', {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: saved.briefId, version: 1 },
    draft: {
      overview: 'Web illustration',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Forest',
          content: 'Explain',
          sources: [],
          blocks: [
            { kind: 'web-image', query: 'forest ecosystem', caption: 'Forest', required: true },
            { kind: 'web-image', query: 'ocean ecosystem', required: false },
          ],
        },
      ],
    },
  })
  let value = decks.outlineSnapshot('chat')
  const valid = structuredClone(value)
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
  assert.deepEqual(await client.snapshot('chat'), valid)
  const issue = {
    code: 'DESIGN_LAYOUT_INCOMPATIBLE',
    slideIndex: 0,
    path: 'slides[0].blocks[0].caption',
    message: 'Caption too long',
    expected: 'Shorten caption',
    layoutId: 'image-pair',
    actual: 111,
    limit: 100,
  }
  value = structuredClone(valid)
  value.proposals[0].layoutIssues = [issue]
  assert.deepEqual((await client.snapshot('chat')).proposals[0].layoutIssues, [issue])
  for (const malformed of [
    null,
    { ...issue, slideIndex: 1 },
    { ...issue, actual: 90 },
    { ...issue, limit: undefined },
    { ...issue, path: 'slides[1].title' },
    { ...issue, layoutId: 'invented' },
    { ...issue, message: '' },
  ]) {
    value = structuredClone(valid)
    value.proposals[0].layoutIssues = [malformed]
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
  }
  value = structuredClone(valid)
  delete value.proposals[0].layoutIssues
  assert.equal(
    (await client.snapshot('chat')).proposals[0].layoutIssues,
    undefined,
    'Older Host responses remain readable',
  )
  for (const block of [
    { kind: 'web-image', query: '' },
    { kind: 'web-image', query: 'x'.repeat(501) },
    { kind: 'web-image', query: 'forest', required: 'yes' },
    { kind: 'web-image', query: 'forest', url: 'https://example.org/image.png' },
  ]) {
    value = structuredClone(valid)
    value.proposals[0].slides[0].blocks = [block]
    await assert.rejects(client.snapshot('chat'), /INVALID_RESPONSE/)
  }
})

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
