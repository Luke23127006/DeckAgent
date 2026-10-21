import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import { ModelProviders } from '../packages/llm/providers/lib/index.js'

test('model catalogs use protocol auth and pagination without selecting or invoking a model', async t => {
  const received = []
  const server = createServer((req, res) => {
    received.push({
      path: req.url,
      method: req.method,
      auth: req.headers.authorization,
      google: req.headers['x-goog-api-key'],
      anthropic: req.headers['x-api-key'],
    })
    res.setHeader('content-type', 'application/json')
    if (req.url.startsWith('/gemini/'))
      res.end(
        JSON.stringify(
          req.url.includes('pageToken=next')
            ? { models: [{ name: 'models/g-two', supportedGenerationMethods: ['generateContent'] }] }
            : {
                models: [
                  { name: 'models/g-one', supportedGenerationMethods: ['generateContent'] },
                  { name: 'models/embedding', supportedGenerationMethods: ['embedContent'] },
                ],
                nextPageToken: 'next',
              },
        ),
      )
    else if (req.url.startsWith('/anthropic/'))
      res.end(
        JSON.stringify(
          req.url.includes('after_id=a-one')
            ? { data: [{ id: 'a-two' }], has_more: false }
            : { data: [{ id: 'a-one' }], has_more: true, last_id: 'a-one' },
        ),
      )
    else res.end(JSON.stringify({ data: [{ id: 'c-one' }, { id: 'c-one' }, { id: 'c-two' }] }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const providers = new ModelProviders(
    [
      { id: 'chat', protocol: 'chat-completions', baseUrl: `${base}/chat`, apiKeyEnv: 'KEY' },
      { id: 'anthropic', protocol: 'anthropic-messages', baseUrl: `${base}/anthropic`, apiKeyEnv: 'KEY' },
      { id: 'gemini', protocol: 'gemini', baseUrl: `${base}/gemini`, apiKeyEnv: 'KEY' },
    ],
    { environment: { KEY: 'fixture-catalog-key' } },
  )
  assert.deepEqual(await providers.listModels('chat'), ['c-one', 'c-two'])
  assert.deepEqual(await providers.listModels('anthropic'), ['a-one', 'a-two'])
  assert.deepEqual(await providers.listModels('gemini'), ['g-one', 'g-two'])
  assert.equal(received.length, 5)
  assert.ok(received.every(request => request.method === 'GET' && !request.path.includes('fixture-catalog-key')))
  assert.equal(received[0].auth, 'Bearer fixture-catalog-key')
  assert.equal(received[1].anthropic, 'fixture-catalog-key')
  assert.equal(received[3].google, 'fixture-catalog-key')
})
