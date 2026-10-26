import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentRuntime, MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js';
import { ModelProviders } from '../packages/llm/providers/lib/index.js';

async function server(t, handler) {
  const instance = createServer(handler);
  instance.listen(0, '127.0.0.1');
  await once(instance, 'listening');
  t.after(() => { instance.closeAllConnections(); instance.close(); });
  return `http://127.0.0.1:${instance.address().port}`;
}
async function body(request) {
  let text = '';
  for await (const part of request) text += part;
  return JSON.parse(text);
}
function sse(response, events) {
  response.writeHead(200, { 'content-type': 'text/event-stream' });
  response.end(events.map(event => `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\r\n\r\n`).join(''));
}
const request = (provider = 'my-api') => ({
  selection: { provider, model: 'chosen-model' }, messages: [{ role: 'user', content: 'Hello' }],
  tools: [], signal: new AbortController().signal,
});
const chunk = (delta, finish_reason = null) => ({ choices: [{ index: 0, delta, finish_reason }] });

test('configured connection routes an explicit model and streams normalized text', async t => {
  const credential = randomUUID();
  let received;
  const baseUrl = await server(t, async (req, res) => {
    received = { path: req.url, auth: req.headers.authorization, body: await body(req) };
    sse(res, [chunk({ content: 'Xin ' }), chunk({ content: 'chào' }), chunk({}, 'stop'), '[DONE]']);
  });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment: { TEST_TOKEN: credential } });
  assert.deepEqual(await Array.fromAsync(model.stream(request())), [
    { type: 'text-delta', text: 'Xin ' }, { type: 'text-delta', text: 'chào' }, { type: 'finish', reason: 'stop' },
  ]);
  assert.equal(received.path, '/chat/completions');
  assert.equal(received.auth, `Bearer ${credential}`);
  assert.equal(received.body.model, 'chosen-model');
  assert.equal(received.body.stream, true);
  assert.equal(received.body.tools, undefined);
});

test('Anthropic tool round-trip preserves thinking signatures and pairs the real tool result', async t => {
  const received = [];
  const credential = randomUUID();
  const baseUrl = await server(t, async (req, res) => {
    received.push({ headers: req.headers, path: req.url, body: await body(req) });
    if (received.length === 1) sse(res, [
      { type: 'message_start', message: { role: 'assistant', content: [] } },
      { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'internal' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'opaque-signature' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'call-anthropic', name: 'noop', input: {} } },
      { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"value":' } },
      { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"DeckAgent"}' } },
      { type: 'content_block_stop', index: 1 },
      { type: 'message_delta', delta: { stop_reason: 'tool_use' } }, { type: 'message_stop' },
    ]);
    else sse(res, [
      { type: 'message_start', message: { role: 'assistant', content: [] } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Done' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn' } }, { type: 'message_stop' },
    ]);
  });
  const tools = new ToolRegistry();
  tools.register({ name: 'noop', description: 'Echo', parameters: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'], additionalProperties: false }, execute: async args => args.value });
  const runtime = new AgentRuntime({
    model: new ModelProviders([{ id: 'claude', protocol: 'anthropic-messages', baseUrl, apiKeyEnv: 'TEST_TOKEN', maxOutputTokens: 128 }], { environment: { TEST_TOKEN: credential } }),
    sessions: new MemorySessionStore(), tools, systemPrompt: 'Be helpful',
  });
  t.after(() => runtime.dispose());
  const agent = await runtime.createAgent({ sessionId: 'anthropic', selection: { provider: 'claude', model: 'selected-claude' }, tools: ['noop'] });
  assert.deepEqual(await agent.send('Use noop'), { status: 'completed', text: 'Done', steps: 2 });
  assert.equal(received[0].path, '/messages');
  assert.equal(received[0].headers['x-api-key'], credential);
  assert.equal(received[0].headers['anthropic-version'], '2023-06-01');
  assert.equal(received[0].body.system, 'Be helpful');
  assert.equal(received[0].body.model, 'selected-claude');
  assert.equal(received[0].body.max_tokens, 128);
  assert.equal(received[0].body.tools[0].input_schema.additionalProperties, false);
  assert.deepEqual(received[1].body.messages[1].content[0], { type: 'thinking', thinking: 'internal', signature: 'opaque-signature' });
  assert.deepEqual(received[1].body.messages[2], { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'call-anthropic', content: 'DeckAgent', is_error: false }] });
  assert.equal(JSON.stringify(await agent.history()).includes(credential), false);
});

test('Gemini tool round-trip replays the exact signed parts and sends its API key as a header', async t => {
  const received = [];
  const credential = randomUUID();
  const signedParts = [{ functionCall: { name: 'noop', args: { value: 'DeckAgent' }, id: 'gemini-wire-id' }, thoughtSignature: 'signature-data' }];
  const baseUrl = await server(t, async (req, res) => {
    received.push({ path: req.url, headers: req.headers, body: await body(req) });
    sse(res, [{ candidates: [{ index: 0, content: { role: 'model', parts: received.length === 1 ? signedParts : [{ text: 'Done' }] }, finishReason: 'STOP' }] }]);
  });
  const tools = new ToolRegistry();
  tools.register({ name: 'noop', description: 'Echo', parameters: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'], additionalProperties: false }, execute: async args => args.value });
  const runtime = new AgentRuntime({
    model: new ModelProviders([{ id: 'google', protocol: 'gemini', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment: { TEST_TOKEN: credential } }),
    sessions: new MemorySessionStore(), tools, systemPrompt: 'Be helpful',
  });
  t.after(() => runtime.dispose());
  const agent = await runtime.createAgent({ sessionId: 'gemini', selection: { provider: 'google', model: 'selected-gemini' }, tools: ['noop'] });
  assert.deepEqual(await agent.send('Use noop'), { status: 'completed', text: 'Done', steps: 2 });
  assert.equal(received[0].path, '/models/selected-gemini:streamGenerateContent?alt=sse');
  assert.equal(received[0].headers['x-goog-api-key'], credential);
  assert.deepEqual(received[0].body.systemInstruction, { parts: [{ text: 'Be helpful' }] });
  assert.equal(received[0].body.tools[0].functionDeclarations[0].parametersJsonSchema.additionalProperties, false);
  assert.deepEqual(received[1].body.contents[1], { role: 'model', parts: signedParts });
  assert.deepEqual(received[1].body.contents[2], { role: 'user', parts: [{ functionResponse: { name: 'noop', id: 'gemini-wire-id', response: { output: 'DeckAgent' } } }] });
  assert.equal(JSON.stringify(await agent.history()).includes(credential), false);
});

test('manual chat CLI accepts consecutive turns and sends earlier history to the selected endpoint', async t => {
  const received = [];
  const baseUrl = await server(t, async (req, res) => {
    received.push(await body(req));
    sse(res, [chunk({ content: received.length === 1 ? 'First answer' : 'Second answer' }), chunk({}, 'stop'), '[DONE]']);
  });
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-chat-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const config = join(dir, 'models.json');
  await writeFile(config, JSON.stringify({ connections: [{ id: 'custom', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }] }));
  const child = spawn(process.execPath, ['apps/agent-runtime/lib/chat.js', '--data-dir', dir, '--config', config, '--provider', 'custom', '--model', 'my-model'], {
    env: { ...process.env, TEST_TOKEN: randomUUID() }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let output = '';
  let errors = '';
  child.stdout.on('data', part => { output += part; });
  child.stderr.on('data', part => { errors += part; });
  child.stdin.end('Hello\nRemember the first turn\n/exit\n');
  const [exitCode] = await once(child, 'close');
  assert.equal(exitCode, 0, errors);
  assert.match(output, /First answer/);
  assert.match(output, /Second answer/);
  assert.equal(received.length, 2);
  assert.deepEqual(received[1].messages.slice(-3), [
    { role: 'user', content: 'Hello' }, { role: 'assistant', content: 'First answer' },
    { role: 'user', content: 'Remember the first turn' },
  ]);
  assert.equal(received[1].model, 'my-model');
});

test('Chat Completions assembles parallel tool arguments and retains reasoning only for the same model connection', async t => {
  const received = [];
  const baseUrl = await server(t, async (req, res) => {
    received.push(await body(req));
    if (received.length === 1) sse(res, [
      chunk({ reasoning_content: 'opaque reasoning' }),
      chunk({ tool_calls: [{ index: 1, id: 'call-two', type: 'function', function: { name: 'noop', arguments: '{"value":' } }, { index: 0, id: 'call-one', type: 'function', function: { name: 'noop', arguments: '{"value":"one"}' } }] }),
      chunk({ tool_calls: [{ index: 1, function: { arguments: '"two"}' } }] }),
      chunk({}, 'tool_calls'), '[DONE]',
    ]);
    else sse(res, [chunk({ content: 'Done' }), chunk({}, 'stop'), '[DONE]']);
  });
  const tools = new ToolRegistry();
  tools.register({ name: 'noop', description: 'Echo', parameters: { type: 'object', properties: { value: { type: 'string' } }, required: ['value'], additionalProperties: false }, execute: async args => args.value });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl }, { id: 'another', protocol: 'chat-completions', baseUrl }]);
  const sessions = new MemorySessionStore();
  const runtime = new AgentRuntime({ model, sessions, tools });
  t.after(() => runtime.dispose());
  const agent = await runtime.createAgent({ sessionId: 'chat-tools', selection: request().selection, tools: ['noop'] });
  assert.equal((await agent.send('Use tools')).status, 'completed');
  assert.equal(received[1].messages[1].reasoning_content, 'opaque reasoning');
  assert.deepEqual(received[1].messages.slice(-2), [
    { role: 'tool', content: 'one', tool_call_id: 'call-one' }, { role: 'tool', content: 'two', tool_call_id: 'call-two' },
  ]);
  const history = await agent.history();
  await Array.fromAsync(model.stream({ ...request('another'), messages: history }));
  assert.equal(received[2].messages[1].reasoning_content, undefined);
  await Array.fromAsync(model.stream({ ...request(), selection: { provider: 'my-api', model: 'different-model' }, messages: history }));
  assert.equal(received[3].messages[1].reasoning_content, undefined);
});

test('per-connection generation options support the Chat Completions token field without changing Runtime', async t => {
  let received;
  const baseUrl = await server(t, async (req, res) => {
    received = await body(req);
    sse(res, [chunk({ content: 'ok' }), chunk({}, 'stop'), '[DONE]']);
  });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, maxOutputTokens: 200, tokenLimitField: 'max_completion_tokens' }]);
  await Array.fromAsync(model.stream(request()));
  assert.equal(received.max_completion_tokens, 200);
  assert.equal(received.max_tokens, undefined);
});

test('SSE handles UTF-8, CRLF and multiline frames split across HTTP chunks', async t => {
  const baseUrl = await server(t, async (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8' });
    const bytes = Buffer.from(`: keepalive\r\ndata: {"choices":\r\ndata: [{"index":0,"delta":{"content":"Tiếng Việt"},"finish_reason":null}]}\r\n\r\ndata: ${JSON.stringify(chunk({}, 'stop'))}\r\n\r\ndata: {"choices":[],"usage":{"total_tokens":3}}\r\n\r\ndata: [DONE]\r\n\r\n`);
    for (let i = 0; i < bytes.length; i++) {
      res.write(bytes.subarray(i, i + 1));
      if (i % 7 === 0) await new Promise(resolve => setImmediate(resolve));
    }
    res.end();
  });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl }]);
  const output = await Array.fromAsync(model.stream(request()));
  assert.equal(output.filter(event => event.type === 'text-delta').map(event => event.text).join(''), 'Tiếng Việt');
  assert.deepEqual(output.at(-1), { type: 'finish', reason: 'stop' });
});

test('only the selected connection needs credentials, and missing or unknown selection fails before HTTP', async t => {
  let hits = 0;
  const baseUrl = await server(t, (_req, res) => { hits++; sse(res, [chunk({ content: 'ok' }), chunk({}, 'stop'), '[DONE]']); });
  const model = new ModelProviders([
    { id: 'my-api', protocol: 'chat-completions', baseUrl },
    { id: 'private', protocol: 'anthropic-messages', baseUrl, apiKeyEnv: 'UNSET_KEY' },
  ], { environment: {} });
  await assert.rejects(Array.fromAsync(model.stream(request('unknown'))), { code: 'PROVIDER_NOT_FOUND' });
  await assert.rejects(Array.fromAsync(model.stream(request('private'))), { code: 'PROVIDER_CREDENTIALS' });
  assert.equal(hits, 0);
  await Array.fromAsync(model.stream(request()));
  assert.equal(hits, 1);
});

test('configuration rejects plaintext credentials, ambiguous endpoints and invalid generation options', () => {
  const base = { id: 'my-api', protocol: 'chat-completions', baseUrl: 'https://example.invalid/v1' };
  for (const connection of [
    { ...base, apiKey: randomUUID() }, { ...base, baseUrl: 'https://user:password@example.invalid' },
    { ...base, baseUrl: 'https://example.invalid?key=secret' }, { ...base, baseUrl: 'http://example.invalid' },
    { ...base, protocol: 'unknown' }, { ...base, timeoutMs: 0 }, { ...base, temperature: NaN },
    { ...base, apiKeyEnv: 123 }, { ...base, maxOutputTokens: -1 },
    { ...base, protocol: 'gemini', tokenLimitField: 'max_tokens' },
  ]) assert.throws(() => new ModelProviders([connection]), { code: 'PROVIDER_CONFIG' });
  assert.throws(() => new ModelProviders([base, base]), { code: 'PROVIDER_CONFIG' });
});

test('HTTP errors expose stable codes without copying provider bodies or credentials into history', async t => {
  const credential = randomUUID();
  let status = 401;
  const baseUrl = await server(t, (_req, res) => { res.writeHead(status); res.end(`echoed secret ${credential}`); });
  const runtime = new AgentRuntime({
    model: new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment: { TEST_TOKEN: credential } }),
    sessions: new MemorySessionStore(),
  });
  t.after(() => runtime.dispose());
  const agent = await runtime.createAgent({ sessionId: 'errors', selection: request().selection });
  for (const [httpStatus, code] of [[401, 'PROVIDER_AUTH'], [403, 'PROVIDER_AUTH'], [429, 'PROVIDER_RATE_LIMIT'], [500, 'PROVIDER_HTTP']]) {
    status = httpStatus;
    const result = await agent.send('Hello');
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, code);
    assert.equal(JSON.stringify(result).includes(credential), false);
    assert.equal(JSON.stringify(await agent.history()).includes(credential), false);
  }
});

test('redirects never forward a credential to another endpoint', async t => {
  let targetHits = 0;
  const target = await server(t, (_req, res) => { targetHits++; res.end(); });
  const baseUrl = await server(t, (_req, res) => { res.writeHead(307, { location: target }); res.end(); });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment: { TEST_TOKEN: randomUUID() } });
  await assert.rejects(Array.fromAsync(model.stream(request())), { code: 'PROVIDER_NETWORK' });
  assert.equal(targetHits, 0);
});

test('invalid JSON, missing terminal events, truncated output and malformed tool arguments fail closed', async t => {
  let responseEvents;
  const baseUrl = await server(t, (_req, res) => sse(res, responseEvents));
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl }]);
  for (const events of [
    ['not-json'], [chunk({ content: 'partial' })], [chunk({}, 'stop')],
    [chunk({}, 'length'), '[DONE]'], [chunk({}, 'content_filter'), '[DONE]'],
    [chunk({ tool_calls: [{ index: 0, id: 'broken', function: { name: 'noop', arguments: '{bad' } }] }), chunk({}, 'tool_calls'), '[DONE]'],
    [chunk({ tool_calls: [{ index: 0, id: 'broken', function: { name: 'noop', arguments: '[]' } }] }), chunk({}, 'tool_calls'), '[DONE]'],
    [chunk({}, 'stop'), chunk({ content: 'after finish' }), '[DONE]'],
  ]) {
    responseEvents = events;
    await assert.rejects(Array.fromAsync(model.stream(request())), { code: 'MODEL_PROTOCOL' });
  }
});

test('cancellation aborts an open HTTP stream, keeps partial text, and permits the next turn', async t => {
  let hits = 0;
  let streamOpened;
  const opened = new Promise(resolve => { streamOpened = resolve; });
  const baseUrl = await server(t, (_req, res) => {
    hits++;
    if (hits === 1) {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(`data: ${JSON.stringify(chunk({ content: 'partial' }))}\n\n`);
    } else sse(res, [chunk({ content: 'recovered' }), chunk({}, 'stop'), '[DONE]']);
  });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl }]);
  const runtime = new AgentRuntime({
    model: { async *stream(req) { for await (const event of model.stream(req)) { yield event; if (event.type === 'text-delta') streamOpened(); } } },
    sessions: new MemorySessionStore(),
  });
  t.after(() => runtime.dispose());
  const agent = await runtime.createAgent({ sessionId: 'cancel', selection: request().selection });
  const abort = new AbortController();
  const active = agent.send('Hello', { signal: abort.signal });
  await opened;
  abort.abort();
  const result = await active;
  assert.equal(result.status, 'cancelled');
  assert.equal(result.text, 'partial');
  assert.deepEqual((await agent.history()).at(-1), { role: 'assistant', content: 'partial', interrupted: true });
  assert.equal((await agent.send('Try again')).text, 'recovered');
});

test('timeout and disconnected streams produce actionable sanitized failures', async t => {
  const baseUrl = await server(t, (_req, res) => { res.writeHead(200, { 'content-type': 'text/event-stream' }); res.flushHeaders(); });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, timeoutMs: 100 }]);
  await assert.rejects(Array.fromAsync(model.stream(request())), { code: 'PROVIDER_TIMEOUT' });
  const disconnected = await server(t, (req, _res) => req.socket.destroy());
  const offline = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl: disconnected }]);
  await assert.rejects(Array.fromAsync(offline.stream(request())), { code: 'PROVIDER_NETWORK' });
});

test('credential changes are picked up on the next request without altering history or connection config', async t => {
  const environment = { TEST_TOKEN: randomUUID() };
  const auth = [];
  const baseUrl = await server(t, (req, res) => { auth.push(req.headers.authorization); sse(res, [chunk({}, 'stop'), '[DONE]']); });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment });
  const first = environment.TEST_TOKEN;
  await Array.fromAsync(model.stream(request()));
  environment.TEST_TOKEN = randomUUID();
  await Array.fromAsync(model.stream(request()));
  assert.deepEqual(auth, [`Bearer ${first}`, `Bearer ${environment.TEST_TOKEN}`]);
});

test('native protocol errors and incomplete streams never become successful turns', async t => {
  let responseEvents;
  const baseUrl = await server(t, (_req, res) => sse(res, responseEvents));
  for (const [protocol, events] of [
    ['anthropic-messages', [{ type: 'error', error: { message: 'untrusted detail' } }]],
    ['anthropic-messages', [{ type: 'message_start' }, { type: 'message_delta', delta: { stop_reason: 'max_tokens' } }, { type: 'message_stop' }]],
    ['anthropic-messages', [{ type: 'message_start' }, { type: 'message_delta', delta: { stop_reason: 'end_turn' } }]],
    ['gemini', [{ promptFeedback: { blockReason: 'SAFETY' } }]],
    ['gemini', [{ candidates: [{ index: 0, content: { parts: [{ text: 'truncated' }] }, finishReason: 'MAX_TOKENS' }] }]],
    ['gemini', [{ candidates: [{ index: 0, content: { parts: [{ text: 'incomplete' }] } }] }]],
  ]) {
    responseEvents = events;
    const model = new ModelProviders([{ id: 'my-api', protocol, baseUrl }]);
    await assert.rejects(Array.fromAsync(model.stream(request())), { code: 'MODEL_PROTOCOL' });
  }
});

test('one-shot CLI reports failure without printing provider bodies, raw config errors or secrets', async t => {
  const credential = randomUUID();
  const baseUrl = await server(t, (_req, res) => { res.writeHead(401); res.end(`echo ${credential}`); });
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-config-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const config = join(dir, 'models.json');
  const connection = { id: 'my-api', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' };
  const run = async (connections, environment = { TEST_TOKEN: credential }) => {
    await writeFile(config, JSON.stringify({ connections }));
    const child = spawn(process.execPath, ['apps/agent-runtime/lib/chat.js', '--data-dir', dir, '--config', config, '--provider', 'my-api', '--model', 'test-model', '--prompt', 'Hello'], {
      env: { ...process.env, ...environment }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(() => child.kill());
    let output = '';
    child.stdout.on('data', part => { output += part; });
    child.stderr.on('data', part => { output += part; });
    const [code] = await once(child, 'close');
    assert.equal(code, 1);
    assert.equal(output.includes(credential), false);
    return output;
  };
  assert.match(await run([connection]), /PROVIDER_AUTH/);
  assert.match(await run([connection], { TEST_TOKEN: '' }), /PROVIDER_CREDENTIALS/);
  assert.match(await run([{ ...connection, apiKey: credential }]), /PROVIDER_CONFIG/);
});

test('manual tool check prints an actual execution trace and completes the HTTP tool round-trip', async t => {
  let hits = 0;
  const baseUrl = await server(t, async (req, res) => {
    const incoming = await body(req);
    hits++;
    if (hits === 1) {
      assert.equal(incoming.tools[0].function.name, 'noop');
      sse(res, [chunk({ tool_calls: [{ index: 0, id: 'manual-call', type: 'function', function: { name: 'noop', arguments: '{"value":"DeckAgent"}' } }] }), chunk({}, 'tool_calls'), '[DONE]']);
    } else {
      assert.deepEqual(incoming.messages.at(-1), { role: 'tool', content: 'DeckAgent', tool_call_id: 'manual-call' });
      sse(res, [chunk({ content: 'Echo completed' }), chunk({}, 'stop'), '[DONE]']);
    }
  });
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-tools-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const config = join(dir, 'models.json');
  await writeFile(config, JSON.stringify({ connections: [{ id: 'custom', protocol: 'chat-completions', baseUrl }] }));
  const child = spawn(process.execPath, ['apps/agent-runtime/lib/chat.js', '--data-dir', dir, '--config', config, '--provider', 'custom', '--model', 'my-model', '--tools', '--prompt', 'Use noop'], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  let output = '';
  let errors = '';
  child.stdout.on('data', part => { output += part; });
  child.stderr.on('data', part => { errors += part; });
  const [code] = await once(child, 'close');
  assert.equal(code, 0, errors);
  assert.equal(hits, 2);
  assert.match(output, /Tool noop: DeckAgent/);
  assert.match(output, /Assistant: Echo completed/);
});

test('certificate failures give a safe TLS diagnosis and system CA hint instead of a generic network error', async t => {
  const credential = randomUUID();
  let causeCode = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError(`untrusted error body ${credential}`, { cause: { code: causeCode, message: credential } });
  });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl: 'https://example.invalid/v1' }]);
  for (const code of ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID']) {
    causeCode = code;
    await assert.rejects(Array.fromAsync(model.stream(request())), error => {
      assert.equal(error.code, 'PROVIDER_TLS');
      assert.match(error.message, /certificate/i);
      assert.match(error.message, /--use-system-ca/);
      assert.equal(error.message.includes(credential), false);
      return true;
    });
  }
  causeCode = `ENOTFOUND ${credential}`;
  await assert.rejects(Array.fromAsync(model.stream(request())), error => {
    assert.equal(error.code, 'PROVIDER_NETWORK');
    assert.equal(error.message.includes(credential), false);
    return true;
  });
});

test('network failures report a safe code and distinguish connecting from reading the stream', async t => {
  const credential = randomUUID();
  let failure = new TypeError(`unsafe details ${credential}`, { cause: { code: 'ECONNRESET', message: credential } });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw failure; });
  const model = new ModelProviders([{ id: 'my-api', protocol: 'chat-completions', baseUrl: 'https://example.invalid/v1' }]);
  await assert.rejects(Array.fromAsync(model.stream(request())), error => {
    assert.equal(error.code, 'PROVIDER_NETWORK');
    assert.match(error.message, /request.*ECONNRESET/);
    assert.equal(error.message.includes(credential), false);
    return true;
  });
  failure = new TypeError(credential, { cause: { code: `ECONNRESET ${credential}` } });
  await assert.rejects(Array.fromAsync(model.stream(request())), error => {
    assert.equal(error.code, 'PROVIDER_NETWORK');
    assert.equal(error.message.includes(credential), false);
    return true;
  });
  fetchMock.mock.mockImplementation(async () => new Response(new ReadableStream({
    start(controller) { controller.error(new TypeError(credential, { cause: { code: 'UND_ERR_SOCKET', message: credential } })); },
  }), { headers: { 'content-type': 'text/event-stream' } }));
  await assert.rejects(Array.fromAsync(model.stream(request())), error => {
    assert.equal(error.code, 'PROVIDER_NETWORK');
    assert.match(error.message, /stream.*UND_ERR_SOCKET/);
    assert.equal(error.message.includes(credential), false);
    return true;
  });
});

test('copied credentials with invisible, Unicode or whitespace characters fail before creating an HTTP request', async t => {
  let hits = 0;
  const baseUrl = await server(t, (_req, res) => { hits++; sse(res, [chunk({}, 'stop'), '[DONE]']); });
  const environment = { TEST_TOKEN: '' };
  const model = new ModelProviders([{ id: 'my-api', protocol: 'gemini', baseUrl, apiKeyEnv: 'TEST_TOKEN' }], { environment });
  for (const value of [`\u200b${randomUUID()}`, `\u201c${randomUUID()}\u201d`, ` ${randomUUID()}`, `${randomUUID()} `, `${randomUUID()}\t`]) {
    environment.TEST_TOKEN = value;
    await assert.rejects(Array.fromAsync(model.stream(request())), error => {
      assert.equal(error.code, 'PROVIDER_CREDENTIALS');
      assert.match(error.message, /ASCII|whitespace/);
      assert.equal(error.message.includes(value), false);
      return true;
    });
  }
  assert.equal(hits, 0);
});
