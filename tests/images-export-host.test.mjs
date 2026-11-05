import assert from 'node:assert/strict'
import test from 'node:test'
import { startHost } from '../packages/host/api/lib/index.js'

test('PDF API authenticates, rejects destination injection, and forwards disconnect cancellation before emitting bytes', async t => {
  let calls = 0,
    started,
    stopped
  const running = new Promise(resolve => {
      started = resolve
    }),
    cancelled = new Promise(resolve => {
      stopped = resolve
    })
  const host = await startHost({
    openAgent: async () => {
      throw Error('NO_MODEL_EXPECTED')
    },
    exportPdf: async (_id, signal) => {
      calls++
      started()
      await new Promise((_, reject) =>
        signal.addEventListener(
          'abort',
          () => {
            stopped()
            reject(signal.reason)
          },
          { once: true },
        ),
      )
      throw Error('UNREACHABLE')
    },
  })
  t.after(() => host.close())
  const url = `${host.origin}/api/sessions/chat/export-pdf`,
    headers = { authorization: `Bearer ${host.token}`, 'content-type': 'application/json' }
  assert.equal((await fetch(url, { method: 'POST', body: '{}' })).status, 401)
  assert.equal(
    (await fetch(url, { method: 'POST', headers, body: JSON.stringify({ outputPath: '../outside.pdf' }) })).status,
    400,
  )
  assert.equal(calls, 0)
  const abort = new AbortController(),
    request = fetch(url, { method: 'POST', headers, body: '{}', signal: abort.signal })
  await running
  abort.abort()
  await assert.rejects(request)
  await Promise.race([
    cancelled,
    new Promise((_, reject) => {
      const timer = setTimeout(() => reject(Error('Export did not receive disconnect abort')), 3000)
      timer.unref()
    }),
  ])
  assert.equal(calls, 1)
})
