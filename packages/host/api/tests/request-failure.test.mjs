/**
 * Tests: RequestController operation errors are RequestFailure instances independent of HTTP.
 * Environment: real SqliteSessionStore in a temporary directory; fake RequestRuntime replacing only the runtime boundary.
 * Fault check: omitting the closed-state guard in RequestController.submit causes submit to invoke runtime.prepare and admit a request, failing assert.rejects and prepares === 0.
 * Run: node --test --test-reporter=tap packages/host/api/tests/request-failure.test.mjs
 * Expected values source: docs/conventions/project-structure.md (Request Lifecycle independence from HTTP) and docs/UCs/requests.md (FR-019).
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
