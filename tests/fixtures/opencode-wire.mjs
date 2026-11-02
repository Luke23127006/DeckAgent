import { createServer } from 'node:http'

/** External provider fixture only. Never use its output as live-model evidence. */
export async function openWireFixture(protocol, handle) {
  const requests = []
  const server = createServer(async (req, res) => {
    try {
      let raw = ''
      for await (const chunk of req) {
        raw += chunk
        if (raw.length > 6000000) {
          req.destroy()
          return
        }
      }
      const body = JSON.parse(raw)
      requests.push({ path: req.url, body })
      await handle(body, res, requests.length)
    } catch {
      if (!res.headersSent) res.writeHead(500).end()
    }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  return {
    requests,
    baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
    protocol,
    async close() {
      server.closeAllConnections()
      await new Promise(done => server.close(done))
    },
  }
}

export function replyChat(res, { text = '', call } = {}) {
  const delta = call
    ? {
        role: 'assistant',
        tool_calls: [
          {
            index: 0,
            id: 'native-fixture-call',
            type: 'function',
            function: { name: call.name, arguments: JSON.stringify(call.arguments) },
          },
        ],
      }
    : { role: 'assistant', content: text }
  const chunks = [
    {
      id: 'fixture',
      object: 'chat.completion.chunk',
      created: 1,
      model: 'fixture',
      choices: [{ index: 0, delta, finish_reason: null }],
    },
    {
      id: 'fixture',
      object: 'chat.completion.chunk',
      created: 1,
      model: 'fixture',
      choices: [{ index: 0, delta: {}, finish_reason: call ? 'tool_calls' : 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
    },
  ]
  res
    .writeHead(200, { 'content-type': 'text/event-stream' })
    .end(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n')
}

export function replyWire(res, protocol, { text = '', call } = {}) {
  if (protocol === 'chat-completions') return replyChat(res, { text, ...(call ? { call } : {}) })
  let packets
  if (protocol === 'gemini')
    packets = [
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [call ? { functionCall: { name: call.name, args: call.arguments } } : { text }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 2, totalTokenCount: 12 },
      },
    ]
  else if (protocol === 'anthropic-messages')
    packets = [
      {
        type: 'message_start',
        message: {
          id: 'fixture',
          type: 'message',
          role: 'assistant',
          model: 'fixture',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      },
      {
        type: 'content_block_start',
        index: 0,
        content_block: call
          ? { type: 'tool_use', id: 'native-fixture-call', name: call.name, input: {} }
          : { type: 'text', text: '' },
      },
      {
        type: 'content_block_delta',
        index: 0,
        delta: call
          ? { type: 'input_json_delta', partial_json: JSON.stringify(call.arguments) }
          : { type: 'text_delta', text },
      },
      { type: 'content_block_stop', index: 0 },
      {
        type: 'message_delta',
        delta: { stop_reason: call ? 'tool_use' : 'end_turn', stop_sequence: null },
        usage: { output_tokens: 2 },
      },
      { type: 'message_stop' },
    ]
  else {
    const item = call
      ? {
          id: 'fc_fixture',
          type: 'function_call',
          call_id: 'native-fixture-call',
          name: call.name,
          arguments: JSON.stringify(call.arguments),
          status: 'completed',
        }
      : {
          id: 'msg_fixture',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text, annotations: [] }],
          status: 'completed',
        }
    packets = [
      {
        type: 'response.created',
        response: { id: 'resp_fixture', model: 'fixture', created_at: 1, status: 'in_progress', output: [] },
      },
      {
        type: 'response.output_item.added',
        output_index: 0,
        item: call ? { ...item, arguments: '' } : { ...item, content: [] },
      },
      call
        ? { type: 'response.function_call_arguments.delta', item_id: item.id, output_index: 0, delta: item.arguments }
        : { type: 'response.output_text.delta', item_id: item.id, output_index: 0, content_index: 0, delta: text },
      { type: 'response.output_item.done', output_index: 0, item },
      {
        type: 'response.completed',
        response: {
          id: 'resp_fixture',
          model: 'fixture',
          created_at: 1,
          status: 'completed',
          output: [item],
          usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 },
        },
      },
    ]
  }
  res
    .writeHead(200, { 'content-type': 'text/event-stream' })
    .end(
      packets
        .map(packet => `${packet.type ? `event: ${packet.type}\n` : ''}data: ${JSON.stringify(packet)}\n\n`)
        .join(''),
    )
}
