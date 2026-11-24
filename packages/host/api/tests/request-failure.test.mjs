/**
 * Tests: RequestController operation errors are RequestFailure instances independent of HTTP.
 * Environment: real SqliteSessionStore in a temporary directory; fake RequestRuntime replacing only the runtime boundary.
 * Run: node --test --test-reporter=tap packages/host/api/tests/request-failure.test.mjs
 * Expected values source: docs/build/refactor/boundaries/plan/task-07-separate-lifecycle-errors.md (Step 1).
 */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { RequestController, RequestFailure } from '../lib/index.js'

test('closed Request Lifecycle refuses work with an operation error', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-request-failure-'))
  const store = new SqliteSessionStore(join(dir, 'sessions.sqlite'))
  t.after(async () => {
    store.close()
    await rm(dir, { recursive: true, force: true })
  })
  const chat = await store.create('default', { provider: 'fixture', model: 'fixture-model' })
  let prepares = 0
  const runtime = {
    async prepare() {
      prepares++
      return {
        selection: { provider: 'fixture', model: 'fixture-model' },
        async start() {
          return { status: 'completed' }
        },
      }
    },
  }
  const controller = new RequestController(store.requests, runtime)
  await controller.close()
  await assert.rejects(
    controller.submit({ sessionId: chat.sessionId, input: 'hello' }),
    error => {
      assert.equal(error instanceof RequestFailure, true)
      assert.equal(error.code, 'HOST_CLOSED')
      return true
    },
  )
  assert.equal(prepares, 0)
  assert.deepEqual(store.requests.list(chat.sessionId), [])
})
