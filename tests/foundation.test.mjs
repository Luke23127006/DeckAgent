import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startFoundation } from '../apps/foundation/lib/index.js';

test('boot loads a provider, injects its service and cleans up on unload', { timeout: 15000 }, async () => {
  const events = [];
  const ctx = await startFoundation({ record: (event) => events.push(event) });
  try {
    assert.equal(ctx.get('foundationGreeting').greet('DeckAgent'), 'Hello, DeckAgent');
    assert.deepEqual(events, ['provider:ready', 'consumer:Hello, DeckAgent']);
  } finally {
    await ctx.fiber.dispose();
  }
  assert.equal(ctx.get('foundationGreeting'), undefined);
  assert.equal(ctx.get('foundationReady'), undefined);
  assert.equal(events.filter((event) => event === 'provider:cleanup').length, 1);
  assert.equal(events.filter((event) => event === 'consumer:cleanup').length, 1);
  await ctx.fiber.dispose();
  assert.equal(events.filter((event) => event === 'provider:cleanup').length, 1);
});

test('boot rejects a consumer whose required service is missing', { timeout: 15000 }, async () => {
  let unexpectedContext;
  try {
    await assert.rejects(async () => {
      unexpectedContext = await startFoundation(
        { record() {} },
        { withProvider: false },
      );
    }, /foundation-consumer/);
  } finally {
    await unexpectedContext?.fiber.dispose();
  }
});
