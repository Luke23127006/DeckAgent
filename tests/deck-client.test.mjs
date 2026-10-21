import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'
import { DeckClient } from '../packages/client/runtime/lib/index.js'

test('Deck client authenticates SSE, decodes fragmented frames and rejects malformed or cross-Session state', async t => {
  let malformed = false,
    wrong = false
  const server = createServer((req, res) => {
    assert.equal(req.headers.authorization, 'Bearer fixture-token')
    assert.equal(req.url.includes('token'), false)
    if (req.url.endsWith('/events')) {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      const frame = Buffer.from('event: deck-changed\r\ndata: {"sessionId":"chat","deckId":"chat","version":2}\r\n\r\n')
      res.write(frame.subarray(0, 22))
      setImmediate(() => res.end(frame.subarray(22)))
      return
    }
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        sessionId: wrong ? 'other' : 'chat',
        deckId: 'chat',
        outlineId: 'outline',
        version: 2,
        slides: [{ slideId: 'one', title: 'First', order: 0, status: 'published', revision: malformed ? 0 : 1 }],
      }),
    )
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    return new Promise(resolve => server.close(resolve))
  })
  const client = new DeckClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  assert.equal((await client.snapshot('chat')).slides[0].revision, 1)
  const changes = client.watch('chat', new AbortController().signal)
  assert.deepEqual((await changes.next()).value, { sessionId: 'chat', deckId: 'chat', version: 2 })
  await assert.rejects(changes.next(), /DECK_CONNECTION_LOST/)
  malformed = true
  await assert.rejects(client.snapshot('chat'), /INVALID_DECK_RESPONSE/)
  malformed = false
  wrong = true
  await assert.rejects(client.snapshot('chat'), /INVALID_DECK_RESPONSE/)
})
