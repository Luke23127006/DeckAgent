import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { startAgentRuntime } from '../apps/agent-runtime/lib/index.js';
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js';

async function database(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-sessions-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return join(dir, 'nested', 'sessions.sqlite');
}

test('a conversation and its model selection survive closing and reopening storage', async t => {
  const path = await database(t);
  const first = new SqliteSessionStore(path);
  const info = await first.bind('chat-01', { provider: 'google', model: 'chosen-model' });
  await first.append('chat-01', [{ role: 'user', content: 'Xin chào' }, { role: 'assistant', content: 'Hello' }]);
  first.close();
  const second = new SqliteSessionStore(path);
  try {
    await second.open('chat-01');
    assert.deepEqual(await second.read('chat-01'), [{ role: 'user', content: 'Xin chào' }, { role: 'assistant', content: 'Hello' }]);
    const restored = await second.getInfo('chat-01');
    assert.deepEqual(restored.selection, { provider: 'google', model: 'chosen-model' });
    assert.equal(restored.createdAt, info.createdAt);
    assert.equal(restored.messageCount, 2);
    assert.ok(restored.updatedAt >= info.createdAt);
    assert.deepEqual(await second.list(), [restored]);
  } finally { second.close(); }
});

test('a failed append rolls back its entire batch and leaves metadata and later ordering intact', async t => {
  const path = await database(t);
  const store = new SqliteSessionStore(path);
  try {
    await store.open('atomic');
    await store.append('atomic', [{ role: 'user', content: 'Before' }]);
    const before = await store.getInfo('atomic');
    await assert.rejects(store.append('atomic', [
      { role: 'assistant', content: 'Must roll back' },
      { role: 'tool', content: 'Missing tool identity' },
    ]), { code: 'SESSION_MESSAGE' });
    assert.deepEqual(await store.read('atomic'), [{ role: 'user', content: 'Before' }]);
    assert.deepEqual(await store.getInfo('atomic'), before);
    await store.append('atomic', [{ role: 'assistant', content: 'After' }]);
    assert.deepEqual(await store.read('atomic'), [{ role: 'user', content: 'Before' }, { role: 'assistant', content: 'After' }]);
  } finally { store.close(); }
});

test('unsupported or unowned databases are refused without replacing their contents', async t => {
  const path = await database(t);
  await mkdir(dirname(path), { recursive: true });
  const external = new DatabaseSync(path);
  external.exec('CREATE TABLE important_data (value TEXT); INSERT INTO important_data VALUES (\'keep me\'); PRAGMA user_version = 2;');
  external.close();
  const before = await readFile(path);
  assert.throws(() => new SqliteSessionStore(path), { code: 'SESSION_SCHEMA' });
  assert.deepEqual(await readFile(path), before);
  const unknown = new DatabaseSync(path);
  unknown.exec('PRAGMA user_version = 0;');
  unknown.close();
  const unowned = await readFile(path);
  assert.throws(() => new SqliteSessionStore(path), { code: 'SESSION_SCHEMA' });
  assert.deepEqual(await readFile(path), unowned);
});

async function cli(t, dir, args, env = {}) {
  const child = spawn(process.execPath, ['apps/agent-runtime/lib/chat.js', '--data-dir', dir, ...args], {
    env: { ...process.env, DECKAGENT_PROVIDER: '', DECKAGENT_MODEL: '', ...env }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  child.stdin.end();
  const [code] = await once(child, 'close');
  return { code, stdout, stderr };
}

test('CLI resumes a signed tool conversation in another process and exposes history without credentials', { timeout: 15000 }, async t => {
  const path = await database(t);
  const dir = dirname(path);
  const received = [];
  const signed = [{ functionCall: { name: 'noop', args: { value: 'DeckAgent' }, id: 'wire-call' }, thoughtSignature: 'retained-signature' }];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const part of req) raw += part;
    received.push(JSON.parse(raw));
    const parts = received.length === 1 ? signed : [{ text: received.length === 2 ? 'Tool returned DeckAgent' : 'I remember DeckAgent' }];
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end(`data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }] })}\n\n`);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const config = join(dir, 'models.json');
  await mkdir(dir, { recursive: true });
  await writeFile(config, JSON.stringify({ connections: [{ id: 'google-test', protocol: 'gemini', baseUrl: `http://127.0.0.1:${server.address().port}`, apiKeyEnv: 'DECKAGENT_TEST_TOKEN' }] }));
  const first = await cli(t, dir, ['--config', config, '--provider', 'google-test', '--model', 'chosen-gemini', '--session', 'restart-chat', '--tools', '--prompt', 'Use noop'], { DECKAGENT_TEST_TOKEN: 'test-only-token' });
  assert.equal(first.code, 0, first.stderr);
  assert.match(first.stdout, /Tool noop: DeckAgent/);
  const second = await cli(t, dir, ['--config', config, '--session', 'restart-chat', '--tools', '--prompt', 'Remember our tool result'], {
    DECKAGENT_TEST_TOKEN: 'test-only-token', DECKAGENT_PROVIDER: 'another-default', DECKAGENT_MODEL: 'another-default',
  });
  assert.equal(second.code, 0, second.stderr);
  assert.match(second.stdout, /I remember DeckAgent/);
  assert.equal(received.length, 3);
  assert.deepEqual(received[2].contents[1], { role: 'model', parts: signed });
  assert.deepEqual(received[2].contents[2], { role: 'user', parts: [{ functionResponse: { name: 'noop', id: 'wire-call', response: { output: 'DeckAgent' } } }] });
  assert.equal(received[2].contents.at(-1).parts[0].text, 'Remember our tool result');
  const listed = await cli(t, dir, ['--config', 'missing.json', '--list-sessions'], { DECKAGENT_TEST_TOKEN: '' });
  assert.equal(listed.code, 0, listed.stderr);
  assert.deepEqual(JSON.parse(listed.stdout).map(info => [info.sessionId, info.messageCount, info.selection]), [
    ['restart-chat', 6, { provider: 'google-test', model: 'chosen-gemini' }],
  ]);
  const history = await cli(t, dir, ['--config', 'missing.json', '--session', 'restart-chat', '--history'], { DECKAGENT_TEST_TOKEN: '' });
  assert.equal(history.code, 0, history.stderr);
  const messages = JSON.parse(history.stdout);
  assert.equal(messages.length, 6);
  assert.deepEqual(messages[1].providerState.data.parts, signed);
  assert.equal(messages.at(-1).content, 'I remember DeckAgent');
  assert.equal(history.stdout.includes('test-only-token'), false);
  const conflict = await cli(t, dir, ['--config', 'missing.json', '--session', 'restart-chat', '--model', 'different-model', '--prompt', 'No request']);
  assert.equal(conflict.code, 1);
  assert.match(conflict.stderr, /SESSION_CONFLICT/);
  assert.equal(received.length, 3);
  const afterConflict = await cli(t, dir, ['--session', 'restart-chat', '--history']);
  assert.deepEqual(JSON.parse(afterConflict.stdout), messages);
});

test('all supported message fields round-trip exactly and read snapshots cannot change stored history', async t => {
  const path = await database(t);
  const store = new SqliteSessionStore(path);
  const messages = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'Unicode: tiếng Việt 🚀\nSecond line' },
    { role: 'assistant', content: '', toolCalls: [
      { id: 'call-one', name: 'noop', arguments: { value: 'DeckAgent', nested: { array: [null, 2, false] } } },
    ], providerState: { provider: 'google', model: 'chosen-model', data: { protocol: 'gemini', parts: [{ thoughtSignature: 'exact-signature' }] } } },
    { role: 'tool', content: 'Failure detail', toolCallId: 'call-one', name: 'noop', isError: true },
    { role: 'assistant', content: 'Partial text', interrupted: true, providerState: { provider: 'google', model: 'chosen-model', data: null } },
  ];
  await store.open('exact');
  await store.append('exact', messages);
  const snapshot = await store.read('exact');
  snapshot[2].toolCalls[0].arguments.value = 'Changed';
  messages[1].content = 'Caller changed its array';
  store.close();
  const reopened = new SqliteSessionStore(path);
  try {
    const restored = await reopened.read('exact');
    assert.equal(restored[1].content, 'Unicode: tiếng Việt 🚀\nSecond line');
    assert.equal(restored[2].toolCalls[0].arguments.value, 'DeckAgent');
    assert.deepEqual(restored.slice(2), [
      { role: 'assistant', content: '', toolCalls: [{ id: 'call-one', name: 'noop', arguments: { value: 'DeckAgent', nested: { array: [null, 2, false] } } }], providerState: { provider: 'google', model: 'chosen-model', data: { protocol: 'gemini', parts: [{ thoughtSignature: 'exact-signature' }] } } },
      { role: 'tool', content: 'Failure detail', toolCallId: 'call-one', name: 'noop', isError: true },
      { role: 'assistant', content: 'Partial text', interrupted: true, providerState: { provider: 'google', model: 'chosen-model', data: null } },
    ]);
  } finally { reopened.close(); }
});

test('Session identities are isolated, model binding is stable, and closed storage rejects new work', async t => {
  const store = new SqliteSessionStore(await database(t));
  try {
    await assert.rejects(store.open('  '), { code: 'SESSION_CONFIG' });
    await assert.rejects(store.read('missing'), { code: 'SESSION_NOT_FOUND' });
    await assert.rejects(store.append('missing', [{ role: 'user', content: 'Do not create' }]), { code: 'SESSION_NOT_FOUND' });
    assert.equal(await store.getInfo('missing'), undefined);
    await store.bind('../an-id-not-a-path', { provider: 'custom', model: 'model-one' });
    await store.open('empty');
    await store.append('../an-id-not-a-path', [{ role: 'user', content: 'Only this session' }]);
    await assert.rejects(store.bind('../an-id-not-a-path', { provider: 'custom', model: 'model-two' }), { code: 'SESSION_CONFLICT' });
    assert.deepEqual((await store.getInfo('../an-id-not-a-path')).selection, { provider: 'custom', model: 'model-one' });
    assert.deepEqual(await store.read('empty'), []);
    store.close();
    store.close();
    await assert.rejects(store.list(), { code: 'SESSION_CLOSED' });
    await assert.rejects(store.open('after-close'), { code: 'SESSION_CLOSED' });
  } finally { store.close(); }
});

test('non-JSON message data is rejected instead of being silently changed or dropped', async t => {
  const store = new SqliteSessionStore(await database(t));
  try {
    await store.open('invalid-json');
    for (const data of [undefined, NaN, Infinity, new Date(), [undefined], { value: undefined }, 1n]) {
      await assert.rejects(store.append('invalid-json', [{ role: 'assistant', content: '', providerState: { provider: 'custom', model: 'chosen-model', data } }]), { code: 'SESSION_MESSAGE' });
    }
    assert.deepEqual(await store.read('invalid-json'), []);
  } finally { store.close(); }
});

test('invalid files and corrupted message payloads fail safely without resetting data', async t => {
  const path = await database(t);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, 'not a database: untrusted-sensitive-details');
  assert.throws(() => new SqliteSessionStore(path), error => error.code === 'SESSION_STORAGE' && !error.message.includes('untrusted-sensitive-details'));
  assert.equal(await readFile(path, 'utf8'), 'not a database: untrusted-sensitive-details');
  const valid = join(dirname(path), 'valid.sqlite');
  const store = new SqliteSessionStore(valid);
  await store.open('damaged');
  await store.append('damaged', [{ role: 'user', content: 'Keep the row' }]);
  store.close();
  // Simulate an externally damaged file, then verify through the store's public interface.
  const external = new DatabaseSync(valid);
  external.prepare('UPDATE messages SET payload = ?').run('{bad json: untrusted-sensitive-details');
  external.close();
  const reopened = new SqliteSessionStore(valid);
  try {
    await assert.rejects(reopened.read('damaged'), error => error.code === 'SESSION_CORRUPT' && !error.message.includes('untrusted-sensitive-details'));
    assert.equal((await reopened.getInfo('damaged')).messageCount, 1);
  } finally { reopened.close(); }
});

test('Cordis shutdown drains an active turn before closing storage and preserves partial text after restart', { timeout: 5000 }, async t => {
  const path = await database(t);
  const store = new SqliteSessionStore(path);
  const delivered = Promise.withResolvers();
  const ctx = await startAgentRuntime({ sessions: store, model: {
    async *stream({ signal }) {
      yield { type: 'text-delta', text: 'Delivered before shutdown' };
      delivered.resolve();
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
  } });
  let turn;
  try {
    const agent = await ctx.get('agentRuntime').createAgent({ sessionId: 'shutdown', selection: { provider: 'local-test', model: 'test-model' } });
    turn = agent.send('Start');
    await delivered.promise;
  } finally { try { await ctx.fiber.dispose(); } finally { store.close(); } }
  assert.equal((await turn).status, 'cancelled');
  const reopened = new SqliteSessionStore(path);
  try {
    assert.deepEqual(await reopened.read('shutdown'), [
      { role: 'user', content: 'Start' }, { role: 'assistant', content: 'Delivered before shutdown', interrupted: true },
    ]);
  } finally { reopened.close(); }
});
