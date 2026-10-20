import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';
import { prepareChat } from '../apps/agent-runtime/lib/types/setup.js';
import { WindowsCredentialVault } from '../apps/agent-runtime/lib/types/credentials.js';
import { TerminalPrompts } from '../apps/agent-runtime/lib/types/terminal.js';

async function workspace(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-setup-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
async function endpoint(t, handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}
function reply(res, text = 'OK') {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  res.end(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
}
function prompts(answers) {
  return {
    async ask() { assert.ok(answers.length, 'unexpected setup question'); return answers.shift(); },
    info() {}, signal: new AbortController().signal,
  };
}

test('first launch guides model selection, checks the endpoint and remembers defaults for the next launch', async t => {
  const dir = await workspace(t);
  let hits = 0;
  const baseUrl = await endpoint(t, (req, res) => { hits++; reply(res); });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl }] }));
  const first = await prepareChat({ dataDir: dir, configPath, environment: {}, prompts: prompts(['1', 'selected-model']) });
  assert.deepEqual(first.selection, { provider: 'local', model: 'selected-model' });
  assert.equal(hits, 1);
  const second = await prepareChat({ dataDir: dir, environment: {} });
  assert.deepEqual(second.selection, { provider: 'local', model: 'selected-model' });
  assert.equal(hits, 1, 'saved configuration enters chat without another setup request');
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'profile.json'), 'utf8')).selection, first.selection);
});

test('Windows credentials survive reopening as DPAPI ciphertext and are bound to their endpoint', { skip: process.platform !== 'win32', timeout: 15000 }, async t => {
  const dir = await workspace(t);
  const connection = { id: 'custom', protocol: 'chat-completions', baseUrl: 'https://api.example.test/v1', apiKeyEnv: 'TEST_TOKEN' };
  const credential = randomUUID();
  const first = new WindowsCredentialVault(dir);
  await first.write(connection, credential);
  const second = new WindowsCredentialVault(dir);
  assert.equal(await second.read(connection), credential);
  assert.equal(await second.read({ ...connection, baseUrl: 'https://another.example.test/v1' }), undefined);
  const files = await readdir(join(dir, 'credentials'));
  assert.equal(files.length, 1);
  assert.equal((await readFile(join(dir, 'credentials', files[0]))).includes(Buffer.from(credential)), false);
});

test('setup saves an opted-in key separately and the next launch authenticates without environment setup', { skip: process.platform !== 'win32', timeout: 15000 }, async t => {
  const dir = await workspace(t);
  const credential = randomUUID();
  const requests = [];
  const baseUrl = await endpoint(t, (req, res) => { requests.push(req.headers.authorization); reply(res); });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }] }));
  const io = prompts(['1', 'selected-model', credential, 'c']);
  await prepareChat({ dataDir: dir, configPath, environment: {}, prompts: io });
  const saved = await readFile(join(dir, 'profile.json'), 'utf8');
  assert.equal(saved.includes(credential), false);
  const restarted = await prepareChat({ dataDir: dir, environment: {} });
  await Array.fromAsync(restarted.providers.stream({ selection: restarted.selection, messages: [{ role: 'user', content: 'Hello' }], tools: [], signal: new AbortController().signal }));
  assert.deepEqual(requests, [`Bearer ${credential}`, `Bearer ${credential}`]);
});

test('terminal key input is hidden and cannot be recalled into the next answer', async t => {
  const input = new PassThrough();
  const output = new PassThrough();
  let printed = '';
  output.on('data', part => { printed += part; });
  const terminal = new TerminalPrompts(input, output);
  t.after(() => { terminal.close(); input.destroy(); output.destroy(); });
  const credential = randomUUID();
  const answer = terminal.ask('API key: ', true);
  const beforeTyping = printed.length;
  input.write(credential + '\r');
  assert.equal(await answer, credential);
  assert.equal(printed.slice(beforeTyping), '\n');
  const next = terminal.ask('Next: ');
  input.write('\x1b[A\r');
  assert.equal(await next, '');
  assert.equal(printed.includes(credential), false);
  assert.match(printed, /API key:/);
});

test('a user can configure another compatible endpoint without editing JSON', async t => {
  const dir = await workspace(t);
  const baseUrl = await endpoint(t, (req, res) => reply(res));
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'example', protocol: 'gemini', baseUrl: 'https://example.test' }] }));
  const result = await prepareChat({ dataDir: dir, configPath, environment: {}, prompts: prompts(['2', '1', baseUrl, 'k', 'custom-model']) });
  assert.equal(result.selection.model, 'custom-model');
  const saved = JSON.parse(await readFile(join(dir, 'profile.json'), 'utf8'));
  assert.equal(saved.connections[0].protocol, 'chat-completions');
  assert.equal(saved.connections[0].baseUrl, baseUrl);
});

test('failed authentication can be corrected inside setup before any defaults are saved', async t => {
  const dir = await workspace(t);
  const bad = randomUUID(), good = randomUUID();
  let hits = 0;
  const baseUrl = await endpoint(t, (req, res) => {
    hits++;
    if (req.headers.authorization === `Bearer ${good}`) reply(res);
    else { res.writeHead(401); res.end('sensitive provider body'); }
  });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }] }));
  const vault = { available: true, async read() {}, async write() { assert.fail('user declined saving credentials'); } };
  const result = await prepareChat({ dataDir: dir, configPath, environment: {}, vault,
    prompts: prompts(['1', 'model', bad, 'k', '1', good, 'k']),
  });
  assert.equal(hits, 2);
  assert.equal(result.selection.model, 'model');
  assert.equal((await readFile(join(dir, 'profile.json'), 'utf8')).includes(good), false);
});

function launch(t, dir, args = []) {
  const child = spawn(process.execPath, ['tests/fixtures/interactive-chat.mjs', '--data-dir', dir, ...args], {
    env: { ...process.env, DECKAGENT_PROVIDER: '', DECKAGENT_MODEL: '', DECKAGENT_MODELS_CONFIG: '', DECKAGENT_SETUP_TEST_TOKEN: '' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let output = '', errors = '', cursor = 0;
  let ended = false;
  child.stdout.on('data', part => { output += part; });
  child.stderr.on('data', part => { errors += part; });
  const closed = once(child, 'close').then(([code]) => { ended = true; return code; });
  return {
    child, closed, output: () => output, errors: () => errors,
    async waitFor(text) {
      while (!output.slice(cursor).includes(text)) {
        if (ended) throw new Error('CLI exited before: ' + text + '\n' + errors);
        await Promise.race([once(child.stdout, 'data'), closed]);
      }
      cursor = output.indexOf(text, cursor) + text.length;
    },
  };
}

test('interactive CLI sets up once, chats immediately and restores the same Session in a second process', { skip: process.platform !== 'win32', timeout: 20000 }, async t => {
  const dir = await workspace(t);
  const credential = randomUUID();
  const received = [];
  const baseUrl = await endpoint(t, async (req, res) => {
    let raw = '';
    for await (const part of req) raw += part;
    received.push({ auth: req.headers.authorization, body: JSON.parse(raw) });
    reply(res, received.length === 1 ? 'OK' : 'DA-4821');
  });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'DECKAGENT_SETUP_TEST_TOKEN' }] }));
  const first = launch(t, dir, ['--config', configPath]);
  await first.waitFor('Provider (số hoặc connection ID): ');
  first.child.stdin.write('1\r');
  await first.waitFor('Model ID: ');
  first.child.stdin.write('local-model\r');
  await first.waitFor('API key (ẩn khi nhập): ');
  first.child.stdin.write(credential + '\r');
  await first.waitFor('mặc định k): ');
  first.child.stdin.write('c\r');
  await first.waitFor('You: ');
  const sessionId = first.output().match(/Session: (chat-[\w-]+)/)?.[1];
  assert.ok(sessionId, 'starting without --session creates and prints a durable Session ID');
  first.child.stdin.write('Mã dự án là DA-4821\r');
  await first.waitFor('Assistant: DA-4821');
  await first.waitFor('You: ');
  first.child.stdin.write('/exit\r');
  assert.equal(await first.closed, 0, first.errors());
  assert.equal(first.output().includes(credential), false);
  const second = launch(t, dir, ['--session', sessionId]);
  await second.waitFor('You: ');
  assert.equal(second.output().includes('Model ID:'), false);
  assert.equal(second.output().includes('API key'), false);
  second.child.stdin.write('Mã dự án là gì?\r');
  await second.waitFor('Assistant: DA-4821');
  await second.waitFor('You: ');
  second.child.stdin.write('/exit\r');
  assert.equal(await second.closed, 0, second.errors());
  assert.equal(received.length, 3);
  assert.ok(received.every(req => req.auth === `Bearer ${credential}`));
  assert.deepEqual(received[2].body.messages.slice(-3), [
    { role: 'user', content: 'Mã dự án là DA-4821' }, { role: 'assistant', content: 'DA-4821' }, { role: 'user', content: 'Mã dự án là gì?' },
  ]);
  const fresh = launch(t, dir);
  await fresh.waitFor('You: ');
  assert.equal(fresh.output().includes('Model ID:'), false);
  assert.equal(fresh.output().includes('API key'), false);
  assert.notEqual(fresh.output().match(/Session: (chat-[\w-]+)/)?.[1], sessionId);
  fresh.child.stdin.write('/exit\r');
  assert.equal(await fresh.closed, 0, fresh.errors());
  assert.equal(received.length, 3, 'normal startup does not perform a hidden API request');
});

test('declining to save a key keeps it in this run only and existing environment credentials take precedence', async t => {
  const dir = await workspace(t);
  const credential = randomUUID(), replacement = randomUUID();
  const auth = [];
  const baseUrl = await endpoint(t, (req, res) => { auth.push(req.headers.authorization); reply(res); });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }] }));
  const vault = { available: true, async read() {}, async write() { assert.fail('user declined saving'); } };
  await prepareChat({ dataDir: dir, configPath, environment: {}, vault, prompts: prompts(['1', 'model', credential, 'k']) });
  await assert.rejects(prepareChat({ dataDir: dir, environment: {}, vault }), { code: 'PROVIDER_CREDENTIALS' });
  const fromEnv = await prepareChat({ dataDir: dir, environment: { TEST_TOKEN: replacement }, vault: {
    ...vault, async read() { assert.fail('environment key must take precedence'); },
  } });
  await Array.fromAsync(fromEnv.providers.stream({ selection: fromEnv.selection, messages: [{ role: 'user', content: 'Hello' }], tools: [], signal: new AbortController().signal }));
  assert.deepEqual(auth, [`Bearer ${credential}`, `Bearer ${replacement}`]);
  assert.equal((await readdir(dir)).includes('credentials'), false);
});

test('noninteractive startup fails clearly when setup is required and does not send a request', async t => {
  const dir = await workspace(t);
  await assert.rejects(prepareChat({ dataDir: dir, environment: {} }), { code: 'CLI_CONFIG' });
  await assert.rejects(prepareChat({ dataDir: dir, environment: {}, setup: true }), { code: 'CLI_CONFIG' });
  assert.deepEqual(await readdir(dir), []);
});

test('cancelling failed reconfiguration preserves the previously usable profile without leaking provider bodies', async t => {
  const dir = await workspace(t);
  let hits = 0;
  const baseUrl = await endpoint(t, (req, res) => {
    if (++hits === 1) reply(res);
    else { res.writeHead(503); res.end('private-provider-details'); }
  });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl }] }));
  await prepareChat({ dataDir: dir, configPath, environment: {}, prompts: prompts(['1', 'working-model']) });
  const before = await readFile(join(dir, 'profile.json'));
  let printed = '';
  await assert.rejects(prepareChat({ dataDir: dir, configPath, environment: {}, setup: true, prompts: {
    ...prompts(['1', 'another-model', '0']), info(message) { printed += message; },
  } }), { code: 'CLI_CANCELLED' });
  assert.deepEqual(await readFile(join(dir, 'profile.json')), before);
  assert.equal(printed.includes('private-provider-details'), false);
  assert.match(printed, /PROVIDER_HTTP/);
});

test('unsupported or malformed local profiles are reported safely and never reset implicitly', async t => {
  const dir = await workspace(t);
  const path = join(dir, 'profile.json');
  const content = '{"version":99,"private":"sensitive-profile-content"}';
  await writeFile(path, content);
  await assert.rejects(prepareChat({ dataDir: dir, environment: {} }), error => error.code === 'CLI_CONFIG' && !error.message.includes('sensitive-profile-content'));
  assert.equal(await readFile(path, 'utf8'), content);
});

test('Ctrl+C during hidden input cancels setup and releases the terminal', async t => {
  const input = new PassThrough(), output = new PassThrough();
  const terminal = new TerminalPrompts(input, output);
  t.after(() => { terminal.close(); input.destroy(); output.destroy(); });
  const question = terminal.ask('API key: ', true);
  input.write('\x03');
  await assert.rejects(question, { code: 'CLI_CANCELLED' });
  assert.equal(terminal.signal.aborted, true);
});

test('changing the default custom endpoint preserves the connection used by older Sessions', async t => {
  const dir = await workspace(t);
  let hitsA = 0, hitsB = 0;
  const urlA = await endpoint(t, (req, res) => { hitsA++; reply(res); });
  const urlB = await endpoint(t, (req, res) => { hitsB++; reply(res); });
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'example', protocol: 'chat-completions', baseUrl: 'https://example.test' }] }));
  const first = await prepareChat({ dataDir: dir, configPath, environment: {}, prompts: prompts(['2', '1', urlA, 'k', 'model']) });
  await prepareChat({ dataDir: dir, configPath, setup: true, environment: {}, prompts: prompts(['2', '1', urlB, 'k', 'model']) });
  const resumed = await prepareChat({ dataDir: dir, sessionSelection: first.selection, environment: {} });
  await Array.fromAsync(resumed.providers.stream({ selection: resumed.selection, messages: [{ role: 'user', content: 'Resume' }], tools: [], signal: new AbortController().signal }));
  assert.deepEqual([hitsA, hitsB], [2, 1]);
});

test('cancellation while unlocking saved credentials prevents entering chat', async t => {
  const dir = await workspace(t);
  const credential = randomUUID();
  const baseUrl = await endpoint(t, (req, res) => reply(res));
  const configPath = join(dir, 'models.json');
  await writeFile(configPath, JSON.stringify({ connections: [{ id: 'local', protocol: 'chat-completions', baseUrl, apiKeyEnv: 'TEST_TOKEN' }] }));
  await prepareChat({ dataDir: dir, configPath, environment: { TEST_TOKEN: credential }, prompts: prompts(['1', 'model']) });
  const abort = new AbortController();
  const io = { ...prompts([]), signal: abort.signal };
  await assert.rejects(prepareChat({ dataDir: dir, environment: {}, prompts: io, vault: {
    available: true, async read() { abort.abort(); return credential; }, async write() { assert.fail('cancelled'); },
  } }), { code: 'CLI_CANCELLED' });
});
