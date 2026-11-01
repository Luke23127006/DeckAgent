import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { runOpenCode } from '../apps/local-web/lib/types/opencode/process.js'

function run(script, event) {
  return runOpenCode(process.execPath, ['-e', script], {
    cwd: tmpdir(),
    env: process.env,
    signal: AbortSignal.timeout(10000),
    event,
  })
}

test('JSON process accepts split lines and rejects malformed, truncated and oversized streams', async () => {
  const events = []
  await run(`process.stdout.write('{"type":'); setTimeout(() => process.stdout.write('"text"}\\n'), 10)`, e =>
    events.push(e),
  )
  assert.deepEqual(events, [{ type: 'text' }])
  await assert.rejects(
    run(`console.log('not JSON')`, () => {}),
    /execution failed/,
  )
  await assert.rejects(
    run(`process.stdout.write('{"type":"text"}')`, () => {}),
    /execution failed/,
  )
  await assert.rejects(
    run(`process.stdout.write('x'.repeat(4000001))`, () => {}),
    /execution failed/,
  )
})

test('process start and parser failures never expose child stderr or raw JSON', async () => {
  await assert.rejects(
    run(`console.error('PRIVATE_TEST_MARKER'); console.log('PRIVATE_TEST_MARKER')`, () => {}),
    error => {
      assert.equal(error.message.includes('PRIVATE_TEST_MARKER'), false)
      return true
    },
  )
})

test('Stop awaits Windows process-tree termination, including a child process', {
  skip: process.platform !== 'win32',
  timeout: 15000,
}, async () => {
  const abort = new AbortController()
  let pids
  const result = await runOpenCode(
    process.execPath,
    [
      '-e',
      `
    const {spawn} = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore',windowsHide:true});
    console.log(JSON.stringify({parent:process.pid,child:child.pid}));
    setInterval(()=>{},1000);
  `,
    ],
    {
      cwd: tmpdir(),
      env: process.env,
      signal: abort.signal,
      event(value) {
        pids = value
        abort.abort()
      },
    },
  )
  assert.ok(pids?.parent && pids?.child)
  assert.notEqual(result.code, 0)
  for (const pid of [pids.parent, pids.child]) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
})
