/**
 * Tests: waitFor returns the first truthy condition result and propagates errors thrown by the condition.
 * Environment: pure Node.js unit test with in-memory condition callbacks and no external services or fake clocks.
 * Run: node --test --test-reporter=tap apps/host/tests/wait-for.test.mjs
 * Expected values source: docs/conventions/testware.md (deterministic condition-based waits).
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { waitFor } from './fixtures/wait-for.mjs'

test('waitFor returns the value that satisfies the condition', async () => {
  const values = [undefined, undefined, { state: 'ready' }]
  let calls = 0
  const value = await waitFor(() => {
    calls++
    return values.shift()
  })
  assert.deepEqual(value, { state: 'ready' })
  assert.equal(calls, 3)
})

test('waitFor propagates condition errors', async () => {
  await assert.rejects(
    waitFor(() => {
      throw new Error('fixture-read-failed')
    }),
    { message: 'fixture-read-failed' },
  )
})
