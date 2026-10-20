import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AgentRuntime, MemorySessionStore, ToolRegistry } from '../packages/agent/runtime/lib/index.js';
import { ScriptedModel, textReply, callReply, noopTool } from './fixtures/agent-runtime.mjs';
import { startAgentRuntime } from '../apps/agent-runtime/lib/index.js';

test('an Agent sends the system prompt and user history to a model and saves the response', { timeout: 5000 }, async () => {
  const requests = [];
  const model = {
    async *stream(request) {
      requests.push(request);
      yield { type: 'text-delta', text: 'Hello ' };
      yield { type: 'text-delta', text: 'DeckAgent' };
      yield { type: 'finish', reason: 'stop' };
    },
  };
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), systemPrompt: 'You are DeckAgent.' });
  try {
    const agent = await runtime.createAgent({ sessionId: 'chat-1', selection: { provider: 'fake', model: 'scripted' } });
    const result = await agent.send('Hello');
    assert.equal(result.status, 'completed');
    assert.equal(result.text, 'Hello DeckAgent');
    assert.deepEqual(requests[0].selection, { provider: 'fake', model: 'scripted' });
    assert.deepEqual(requests[0].messages, [
      { role: 'system', content: 'You are DeckAgent.' },
      { role: 'user', content: 'Hello' },
    ]);
    assert.deepEqual(await agent.history(), [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hello DeckAgent' },
    ]);
    assert.equal(agent.status, 'idle');
  } finally {
    await runtime.dispose();
  }
});

test('Cordis injects the runtime dependencies and unload drains live model work', { timeout: 5000 }, async () => {
  const started = Promise.withResolvers();
  let exited = false;
  const model = {
    async *stream({ signal }) {
      started.resolve();
      try {
        await new Promise((_, reject) => {
          if (signal.aborted) reject(signal.reason);
          else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      } finally { exited = true; }
    },
  };
  const ctx = await startAgentRuntime({ model });
  try {
    const runtime = ctx.agentRuntime;
    const agent = await runtime.createAgent({ sessionId: 'cordis-chat', selection: { provider: 'fake', model: 'scripted' } });
    const pending = agent.send('Wait for cancellation');
    await started.promise;
    await ctx.fiber.dispose();
    assert.equal((await pending).status, 'cancelled');
    assert.equal(exited, true);
    assert.equal(agent.status, 'disposed');
    assert.equal(ctx.get('agentRuntime'), undefined);
    await assert.rejects(runtime.createAgent({ sessionId: 'new', selection: { provider: 'fake', model: 'scripted' } }), { code: 'RUNTIME_DISPOSED' });
    await ctx.fiber.dispose();
  } finally { await ctx.fiber.dispose(); }
});

test('the real tool registry executes a call and the next model request receives the paired result', { timeout: 5000 }, async () => {
  const model = new ScriptedModel([
    callReply({ id: 'echo-1', name: 'noop', arguments: { value: 'DeckAgent' } }),
    textReply('Tool returned DeckAgent'),
  ]);
  const tools = new ToolRegistry();
  tools.register(noopTool());
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), tools });
  try {
    const agent = await runtime.createAgent({ sessionId: 'tool-chat', selection: { provider: 'fake', model: 'scripted' }, tools: ['noop'] });
    assert.deepEqual(await agent.send('Echo DeckAgent'), { status: 'completed', text: 'Tool returned DeckAgent', steps: 2 });
    assert.equal(model.requests[0].tools[0].name, 'noop');
    assert.deepEqual(model.requests[1].messages.slice(-2), [
      { role: 'assistant', content: '', toolCalls: [{ id: 'echo-1', name: 'noop', arguments: { value: 'DeckAgent' } }] },
      { role: 'tool', toolCallId: 'echo-1', name: 'noop', content: 'DeckAgent', isError: false },
    ]);
  } finally { await runtime.dispose(); }
});

test('a cancelled stream keeps delivered text in history and accepts a later turn', { timeout: 5000 }, async () => {
  const started = Promise.withResolvers();
  let call = 0;
  const model = {
    async *stream({ signal }) {
      if (++call === 1) {
        yield { type: 'text-delta', text: 'Partial answer' };
        started.resolve();
        await new Promise((_, reject) => {
          if (signal.aborted) reject(signal.reason);
          else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      } else yield* textReply('Next answer');
    },
  };
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore() });
  try {
    const agent = await runtime.createAgent({ sessionId: 'cancel-chat', selection: { provider: 'fake', model: 'scripted' } });
    const control = new AbortController();
    const pending = agent.send('Start', { signal: control.signal });
    await started.promise;
    control.abort();
    assert.equal((await pending).status, 'cancelled');
    assert.deepEqual((await agent.history()).at(-1), { role: 'assistant', content: 'Partial answer', interrupted: true });
    assert.equal((await agent.send('Continue')).text, 'Next answer');
  } finally { await runtime.dispose(); }
});

for (const scenario of [
  { name: 'wrong input type', args: { value: 42 }, allowed: ['noop'], code: 'INVALID_TOOL_INPUT' },
  { name: 'missing required input', args: {}, allowed: ['noop'], code: 'INVALID_TOOL_INPUT' },
  { name: 'extra input field', args: { value: 'x', unexpected: true }, allowed: ['noop'], code: 'INVALID_TOOL_INPUT' },
  { name: 'tool outside Agent allowlist', args: { value: 'x' }, allowed: [], code: 'TOOL_NOT_ALLOWED' },
]) {
  test(`dispatch rejects ${scenario.name} and sends the failure back to the model`, { timeout: 5000 }, async () => {
    let executed = false;
    const tools = new ToolRegistry();
    tools.register({ ...noopTool(), async execute() { executed = true; return 'must not run'; } });
    const model = new ScriptedModel([callReply({ id: 'invalid-call', name: 'noop', arguments: scenario.args }), textReply('Input was refused')]);
    const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), tools });
    try {
      const agent = await runtime.createAgent({ sessionId: 'invalid-tool-chat', selection: { provider: 'fake', model: 'scripted' }, tools: scenario.allowed });
      assert.equal((await agent.send('Try the tool')).status, 'completed');
      const result = model.requests[1].messages.at(-1);
      assert.equal(result.isError, true);
      assert.equal(JSON.parse(result.content).error.code, scenario.code);
      assert.equal(executed, false);
    } finally { await runtime.dispose(); }
  });
}

test('tool exceptions become paired error results rather than breaking the model history', { timeout: 5000 }, async () => {
  const tools = new ToolRegistry();
  tools.register({ ...noopTool(), async execute() { throw new Error('Tool unavailable'); } });
  const model = new ScriptedModel([callReply({ id: 'broken-tool', name: 'noop', arguments: { value: 'x' } }), textReply('The operation failed')]);
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), tools });
  try {
    const agent = await runtime.createAgent({ sessionId: 'broken-tool-chat', selection: { provider: 'fake', model: 'scripted' }, tools: ['noop'] });
    assert.equal((await agent.send('Try')).status, 'completed');
    const result = model.requests[1].messages.at(-1);
    assert.equal(result.toolCallId, 'broken-tool');
    assert.deepEqual(JSON.parse(result.content), { error: { code: 'TOOL_FAILED', message: 'Tool unavailable' } });
  } finally { await runtime.dispose(); }
});

test('a step limit stops a repeating model after settling every requested tool call', { timeout: 5000 }, async () => {
  const tools = new ToolRegistry();
  tools.register(noopTool());
  const model = new ScriptedModel([
    callReply({ id: 'repeat-1', name: 'noop', arguments: { value: 'one' } }),
    callReply({ id: 'repeat-2', name: 'noop', arguments: { value: 'two' } }),
    textReply('Must not be requested'),
  ]);
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), tools, maxSteps: 2 });
  try {
    const agent = await runtime.createAgent({ sessionId: 'limited-chat', selection: { provider: 'fake', model: 'scripted' }, tools: ['noop'] });
    const result = await agent.send('Repeat');
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, 'STEP_LIMIT');
    assert.equal(model.requests.length, 2);
    assert.deepEqual((await agent.history()).filter(message => message.role === 'tool').map(message => message.toolCallId), ['repeat-1', 'repeat-2']);
  } finally { await runtime.dispose(); }
});

test('a model failure closes the active turn and a new request can run', { timeout: 5000 }, async () => {
  const model = new ScriptedModel([new Error('Model unavailable'), textReply('Recovered')]);
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore() });
  try {
    const agent = await runtime.createAgent({ sessionId: 'model-error-chat', selection: { provider: 'fake', model: 'scripted' } });
    const failed = await agent.send('First');
    assert.equal(failed.status, 'failed');
    assert.equal(failed.error.message, 'Model unavailable');
    assert.equal(agent.status, 'idle');
    assert.equal((await agent.send('Second')).text, 'Recovered');
  } finally { await runtime.dispose(); }
});

for (const [name, events] of [
  ['missing finish', [{ type: 'text-delta', text: 'Incomplete' }]],
  ['mismatched finish', [{ type: 'finish', reason: 'tool-calls' }]],
  ['event after finish', [...textReply('Complete'), { type: 'text-delta', text: 'Invalid' }]],
  ['duplicate call ids', callReply({ id: 'duplicate', name: 'noop', arguments: {} }, { id: 'duplicate', name: 'noop', arguments: {} })],
]) {
  test(`malformed model output fails the turn: ${name}`, { timeout: 5000 }, async () => {
    const runtime = new AgentRuntime({ model: new ScriptedModel([events]), sessions: new MemorySessionStore() });
    try {
      const agent = await runtime.createAgent({ sessionId: 'bad-model-chat', selection: { provider: 'fake', model: 'scripted' } });
      const result = await agent.send('Try');
      assert.equal(result.status, 'failed');
      assert.equal(result.error.code, 'MODEL_PROTOCOL');
      assert.ok(!(await agent.history()).some(message => message.role === 'assistant' && message.toolCalls?.length));
    } finally { await runtime.dispose(); }
  });
}

test('registration refuses schema keywords that dispatch does not validate', () => {
  const tools = new ToolRegistry();
  const definition = noopTool();
  definition.parameters.properties.value.minLength = 5;
  assert.throws(() => tools.register(definition), { code: 'INVALID_TOOL' });
});

test('one session rejects overlapping turns and duplicate live handles', { timeout: 5000 }, async () => {
  const started = Promise.withResolvers();
  const model = {
    async *stream({ signal }) {
      started.resolve();
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
  };
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore() });
  try {
    const options = { sessionId: 'busy-chat', selection: { provider: 'fake', model: 'scripted' } };
    const agent = await runtime.createAgent(options);
    const control = new AbortController();
    const pending = agent.send('First', { signal: control.signal });
    await started.promise;
    assert.equal(agent.status, 'running');
    await assert.rejects(agent.send('Overlapping'), { code: 'SESSION_BUSY' });
    await assert.rejects(runtime.createAgent(options), { code: 'SESSION_BUSY' });
    control.abort();
    assert.equal((await pending).status, 'cancelled');
    assert.equal(agent.status, 'idle');
  } finally { await runtime.dispose(); }
});

test('Agent tool access is isolated and releasing a handle preserves unmodifiable session snapshots', { timeout: 5000 }, async () => {
  const model = new ScriptedModel([textReply('Scoped'), textReply('Plain'), textReply('Reopened')]);
  const tools = new ToolRegistry();
  tools.register(noopTool());
  const sessions = new MemorySessionStore();
  const runtime = new AgentRuntime({ model, sessions, tools });
  try {
    const scoped = await runtime.createAgent({ sessionId: 'scoped', selection: { provider: 'fake', model: 'scripted' }, tools: ['noop'] });
    const plain = await runtime.createAgent({ sessionId: 'plain', selection: { provider: 'fake', model: 'scripted' } });
    await scoped.send('First');
    await plain.send('Second');
    assert.deepEqual(model.requests[0].tools.map(tool => tool.name), ['noop']);
    assert.deepEqual(model.requests[1].tools, []);
    const snapshot = await scoped.history();
    snapshot[0].content = 'Tampered';
    model.requests[0].messages[0].content = 'Tampered request';
    assert.equal((await scoped.history())[0].content, 'First');
    await scoped.dispose();
    const reopened = await runtime.createAgent({ sessionId: 'scoped', selection: { provider: 'fake', model: 'next-model' } });
    await scoped.dispose();
    await assert.rejects(scoped.send('Invalid'), { code: 'AGENT_DISPOSED' });
    assert.equal((await reopened.send('Continue')).text, 'Reopened');
    assert.equal(model.requests[2].messages[0].content, 'First');
    assert.equal(model.requests[2].selection.model, 'next-model');
  } finally { await runtime.dispose(); }
});

test('cancelling an active tool settles all call IDs and never starts the remaining tools', { timeout: 5000 }, async () => {
  const started = Promise.withResolvers();
  let secondStarted = false;
  const tools = new ToolRegistry();
  tools.register({
    name: 'wait', description: 'Wait until cancellation.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute(_args, { signal }) {
      started.resolve();
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
      return 'Must not finish';
    },
  });
  tools.register({ ...noopTool(), async execute() { secondStarted = true; return 'Must not run'; } });
  const model = new ScriptedModel([callReply(
    { id: 'waiting-call', name: 'wait', arguments: {} },
    { id: 'skipped-call', name: 'noop', arguments: { value: 'x' } },
  )]);
  const runtime = new AgentRuntime({ model, sessions: new MemorySessionStore(), tools });
  try {
    const agent = await runtime.createAgent({ sessionId: 'cancel-tool-chat', selection: { provider: 'fake', model: 'scripted' }, tools: ['wait', 'noop'] });
    const pending = agent.send('Run both');
    await started.promise;
    await agent.dispose();
    assert.equal((await pending).status, 'cancelled');
    assert.equal(secondStarted, false);
    const results = (await agent.history()).filter(message => message.role === 'tool');
    assert.deepEqual(results.map(message => [message.toolCallId, JSON.parse(message.content).error.code]), [
      ['waiting-call', 'TOOL_ABORTED'], ['skipped-call', 'TOOL_NOT_STARTED'],
    ]);
  } finally { await runtime.dispose(); }
});

test('application boot rejects a missing ModelAdapter', async () => {
  await assert.rejects(startAgentRuntime({ model: undefined }), { code: 'INVALID_CONFIG' });
});

test('Runtime disposal waits for an opening Session before the app can close storage', { timeout: 5000 }, async () => {
  const started = Promise.withResolvers();
  const release = Promise.withResolvers();
  const memory = new MemorySessionStore();
  const runtime = new AgentRuntime({ model: new ScriptedModel([]), sessions: {
    async open(id) { started.resolve(); await release.promise; await memory.open(id); },
    read: id => memory.read(id), append: (id, messages) => memory.append(id, messages),
  } });
  const opening = runtime.createAgent({ sessionId: 'opening', selection: { provider: 'test', model: 'test' } });
  const rejected = assert.rejects(opening, { code: 'RUNTIME_DISPOSED' });
  await started.promise;
  let disposed = false;
  const disposal = runtime.dispose().then(() => { disposed = true; });
  try {
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(disposed, false);
  } finally { release.resolve(); await disposal; await rejected; }
  assert.deepEqual(await memory.read('opening'), []);
});

test('Runtime disposal drains other Agents even if one storage write rejects', { timeout: 5000 }, async () => {
  const bothStarted = Promise.withResolvers();
  const releaseSlow = Promise.withResolvers();
  let started = 0;
  const model = {
    async *stream({ signal }) {
      yield { type: 'text-delta', text: 'Partial' };
      if (++started === 2) bothStarted.resolve();
      await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    },
  };
  const memory = new MemorySessionStore();
  const sessions = {
    open: id => memory.open(id), read: id => memory.read(id),
    async append(id, messages) {
      if (messages[0]?.role === 'assistant') {
        if (id === 'broken-storage') throw new Error('Storage unavailable');
        await releaseSlow.promise;
      }
      await memory.append(id, messages);
    },
  };
  const runtime = new AgentRuntime({ model, sessions });
  const first = await runtime.createAgent({ sessionId: 'broken-storage', selection: { provider: 'fake', model: 'scripted' } });
  const second = await runtime.createAgent({ sessionId: 'slow-storage', selection: { provider: 'fake', model: 'scripted' } });
  const pending = Promise.allSettled([first.send('First'), second.send('Second')]);
  await bothStarted.promise;
  let settled = false;
  const disposal = runtime.dispose().finally(() => { settled = true; });
  const rejected = assert.rejects(disposal, /Storage unavailable|Agent disposal failed/);
  await new Promise(resolve => setImmediate(resolve));
  const settledBeforeDrain = settled;
  releaseSlow.resolve();
  await rejected;
  await pending;
  assert.equal(settledBeforeDrain, false);
});
