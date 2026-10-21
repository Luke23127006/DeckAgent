import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import { ModelProviders } from '../packages/llm/providers/lib/index.js'

test('changing provider preserves tool transcript context without forwarding foreign signatures or replaying native tool calls', async t => {
  const received = []
  const server = createServer(async (req, res) => {
    let input = ''
    for await (const chunk of req) input += chunk
    received.push(JSON.parse(input))
    const events = req.url.startsWith('/gemini/')
      ? [{ candidates: [{ content: { role: 'model', parts: [{ text: 'OK' }] }, finishReason: 'STOP' }] }]
      : req.url.startsWith('/anthropic/')
        ? [
            { type: 'message_start', message: { role: 'assistant', content: [] } },
            { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
            { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'OK' } },
            { type: 'content_block_stop', index: 0 },
            { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
            { type: 'message_stop' },
          ]
        : [{ choices: [{ index: 0, delta: { content: 'OK' }, finish_reason: 'stop' }] }, '[DONE]']
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.end(events.map(event => `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\n\n`).join(''))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const providers = new ModelProviders([
    { id: 'chat', protocol: 'chat-completions', baseUrl: `${base}/chat` },
    { id: 'anthropic', protocol: 'anthropic-messages', baseUrl: `${base}/anthropic` },
    { id: 'gemini', protocol: 'gemini', baseUrl: `${base}/gemini` },
  ])
  const messages = [
    { role: 'user', content: 'Create a file' },
    {
      role: 'assistant',
      content: '',
      toolCalls: [
        { id: 'old-call', name: 'write_file', arguments: { path: 'created.html', content: '<h1>Created</h1>' } },
      ],
      providerState: {
        provider: 'old-google',
        model: 'old-model',
        data: {
          protocol: 'gemini',
          parts: [{ thoughtSignature: 'old-opaque-signature', functionCall: { name: 'write_file', args: {} } }],
          callIds: ['old-call'],
        },
      },
    },
    { role: 'tool', name: 'write_file', toolCallId: 'old-call', isError: false, content: 'File created in workspace' },
    { role: 'assistant', content: 'Created your file' },
    { role: 'user', content: 'Now explain it' },
  ]
  const original = structuredClone(messages)
  for (const provider of ['chat', 'anthropic', 'gemini']) {
    const events = await Array.fromAsync(
      providers.stream({
        selection: { provider, model: 'new-model' },
        messages,
        tools: [],
        signal: new AbortController().signal,
      }),
    )
    assert.equal(events.at(-1).reason, 'stop')
  }
  for (const payload of received) {
    const wire = JSON.stringify(payload)
    assert.equal(wire.includes('old-opaque-signature'), false)
    assert.equal(wire.includes('Earlier tool call: write_file'), true)
    assert.equal(wire.includes('File created in workspace'), true)
    assert.equal(wire.includes('tool_calls'), false)
    assert.equal(wire.includes('functionCall'), false)
    assert.equal(wire.includes('tool_use'), false)
  }
  assert.deepEqual(messages, original, 'Switching providers must not rewrite durable history')
})
