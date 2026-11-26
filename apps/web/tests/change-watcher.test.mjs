import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { ChangeWatcher } from '../lib/browser-types/change-watcher.js'
import { ChangeClient } from './fixtures/browser-driver.mjs'

async function until(check) {
  for (let i = 0; i < 100; i += 1) {
    if (check()) return
    await delay(10)
  }
  assert.fail('Condition did not settle')
}

test('ChangeClient.watch reads fragmented change frames, ignores heartbeats and rejects malformed data', async t => {
  let mode = 'valid'
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    if (mode === 'invalid') {
      res.end('event: change\ndata: {"topic":"unknown","key":"host","version":1}\n\n')
      return
    }
    const payload = Buffer.from(
      ': heartbeat\n\nevent: change\ndata: {"topic":"workspaces","key":"host","version":0}\n\nevent: change\ndata: {"topic":"workspaces","key":"host","version":2}\n\n',
    )
    res.write(payload.subarray(0, 40))
    setImmediate(() => res.end(payload.subarray(40)))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(
    () =>
      new Promise(resolve => {
        server.close(resolve)
        server.closeAllConnections()
      }),
  )

  const client = new ChangeClient(`http://127.0.0.1:${server.address().port}`, 'fixture-token')
  const received = []
  await assert.rejects(async () => {
    for await (const notice of client.watch(new AbortController().signal)) received.push(notice)
  }, /CHANGES_CONNECTION_LOST/)
  assert.deepEqual(received, [
    { topic: 'workspaces', key: 'host', version: 0 },
    { topic: 'workspaces', key: 'host', version: 2 },
  ])

  mode = 'invalid'
  await assert.rejects(async () => {
    for await (const notice of client.watch(new AbortController().signal)) {
      assert.fail(`Yielded malformed notice: ${JSON.stringify(notice)}`)
    }
  }, /INVALID_RESPONSE/)
})

test('ChangeWatcher delivers notices, reconnects after a drop and stops on close', async t => {
  let connections = 0
  const notices = []
  const watcher = new ChangeWatcher({
    retryBaseMs: 10,
    retryMaxMs: 20,
    client: {
      async *watch(signal) {
        connections += 1
        yield { topic: 'workspaces', key: 'host', version: connections }
        if (connections === 1) throw new Error('CHANGES_CONNECTION_LOST')
        await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
      },
    },
    onNotice: notice => {
      notices.push(notice)
    },
  })
  t.after(() => watcher.close())
  watcher.start()
  await until(() => notices.length === 2)
  assert.equal(connections, 2)
  assert.deepEqual(notices, [
    { topic: 'workspaces', key: 'host', version: 1 },
    { topic: 'workspaces', key: 'host', version: 2 },
  ])
  watcher.close()
})

test('ChangeWatcher stops reconnecting after AUTH_REQUIRED', async t => {
  let connections = 0
  const watcher = new ChangeWatcher({
    retryBaseMs: 10,
    retryMaxMs: 20,
    client: {
      async *watch() {
        connections += 1
        yield* []
        throw new Error('AUTH_REQUIRED')
      },
    },
    onNotice: () => {},
  })
  t.after(() => watcher.close())
  watcher.start()
  await delay(60)
  assert.equal(connections, 1)
})
