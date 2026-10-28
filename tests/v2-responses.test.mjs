import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import test from 'node:test'
import { ModelProviders } from '../packages/llm/providers/lib/index.js'

test('Responses streams a function call and sends its exact result on the next turn', async t => {
  const received = []
  const service = createServer(async (request, response) => {
    let raw = ''
    for await (const chunk of request) raw += chunk
    received.push({ path: request.url, body: JSON.parse(raw) })
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    const packets =
      received.length === 1
        ? [
            { type: 'response.output_item.done', item: { type: 'reasoning', id: 'rs_1', encrypted_content: 'opaque' } },
            {
              type: 'response.output_item.done',
              item: { type: 'function_call', call_id: 'call_1', name: 'echo', arguments: '{"value":"ok"}' },
            },
            { type: 'response.completed', response: { status: 'completed' } },
          ]
        : [
            { type: 'response.output_text.delta', delta: 'Done' },
            { type: 'response.completed', response: { status: 'completed' } },
          ]
    response.end(packets.map(packet => `data: ${JSON.stringify(packet)}\n\n`).join(''))
  })
  service.listen(0, '127.0.0.1')
  await once(service, 'listening')
  t.after(() => {
    service.closeAllConnections()
    service.close()
  })
  const adapter = new ModelProviders([
    { id: 'custom', protocol: 'responses', baseUrl: `http://127.0.0.1:${service.address().port}` },
  ])
  const selection = { provider: 'custom', model: 'model-x' }
  const tools = [
    {
      name: 'echo',
      description: 'Echo',
      parameters: { type: 'object', properties: { value: { type: 'string' } }, additionalProperties: false },
    },
  ]
  const signal = new AbortController().signal
  const first = await Array.fromAsync(
    adapter.stream({ selection, messages: [{ role: 'user', content: 'Echo' }], tools, signal }),
  )
  assert.deepEqual(first[0], {
    type: 'provider-state',
    state: {
      protocol: 'responses',
      output: [
        { type: 'reasoning', id: 'rs_1', encrypted_content: 'opaque' },
        { type: 'function_call', call_id: 'call_1', name: 'echo', arguments: '{"value":"ok"}' },
      ],
    },
  })
  assert.deepEqual(first.slice(1), [
    { type: 'tool-call', call: { id: 'call_1', name: 'echo', arguments: { value: 'ok' } } },
    { type: 'finish', reason: 'tool-calls' },
  ])
  const second = await Array.fromAsync(
    adapter.stream({
      selection,
      messages: [
        { role: 'user', content: 'Echo' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [first[1].call],
          providerState: { provider: 'custom', model: 'model-x', data: first[0].state },
        },
        { role: 'tool', toolCallId: 'call_1', name: 'echo', content: 'ok', isError: false },
      ],
      tools,
      signal,
    }),
  )
  assert.deepEqual(second, [
    { type: 'text-delta', text: 'Done' },
    { type: 'finish', reason: 'stop' },
  ])
  assert.equal(received[0].path, '/responses')
  assert.deepEqual(received[0].body.tools[0], {
    type: 'function',
    name: 'echo',
    description: 'Echo',
    parameters: tools[0].parameters,
    strict: false,
  })
  assert.deepEqual(received[1].body.input.at(-1), { type: 'function_call_output', call_id: 'call_1', output: 'ok' })
  assert.deepEqual(received[1].body.input.at(-2), {
    type: 'function_call',
    call_id: 'call_1',
    name: 'echo',
    arguments: '{"value":"ok"}',
  })
  assert.deepEqual(received[1].body.input.at(-3), { type: 'reasoning', id: 'rs_1', encrypted_content: 'opaque' })
})

test('Responses rejects incomplete, failed and malformed tool output before reporting success', async t => {
  let packets = []
  const service = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    response.end(packets.map(packet => `data: ${JSON.stringify(packet)}\n\n`).join(''))
  })
  service.listen(0, '127.0.0.1')
  await once(service, 'listening')
  t.after(() => {
    service.closeAllConnections()
    service.close()
  })
  const adapter = new ModelProviders([
    { id: 'custom', protocol: 'responses', baseUrl: `http://127.0.0.1:${service.address().port}` },
  ])
  for (const value of [
    [{ type: 'response.output_text.delta', delta: 'Partial' }],
    [{ type: 'response.failed', response: { error: { message: 'secret' } } }],
    [
      {
        type: 'response.output_item.done',
        item: { type: 'function_call', call_id: 'c', name: 'echo', arguments: '{broken' },
      },
      { type: 'response.completed', response: { status: 'completed' } },
    ],
    [{ type: 'response.completed', response: { status: 'incomplete' } }],
    [
      { type: 'response.output_item.done', item: { type: 'message', content: [{ type: 'refusal', refusal: 'No' }] } },
      { type: 'response.completed', response: { status: 'completed' } },
    ],
    [
      {
        type: 'response.output_item.done',
        item: { type: 'function_call', call_id: 'same', name: 'echo', arguments: '{}' },
      },
      {
        type: 'response.output_item.done',
        item: { type: 'function_call', call_id: 'same', name: 'echo', arguments: '{}' },
      },
      { type: 'response.completed', response: { status: 'completed' } },
    ],
  ]) {
    packets = value
    await assert.rejects(
      Array.fromAsync(
        adapter.stream({
          selection: { provider: 'custom', model: 'model-x' },
          messages: [{ role: 'user', content: 'Use tool' }],
          tools: [],
          signal: new AbortController().signal,
        }),
      ),
      { code: 'MODEL_PROTOCOL' },
    )
  }
})
