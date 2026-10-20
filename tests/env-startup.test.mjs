import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

async function launch(t, cwd, script, args, extra = {}) {
  const environment = { ...process.env }
  for (const name of ['DECKAGENT_TEST_TOKEN', 'DECKAGENT_PROVIDER', 'DECKAGENT_MODEL', 'DECKAGENT_MODELS_CONFIG'])
    delete environment[name]
  const command = manifest.scripts[script]
    .split(' ')
    .slice(1)
    .map(arg => (arg.startsWith('apps/') ? join(root, arg) : arg))
  const child = spawn(process.execPath, [...command, ...args], {
    cwd,
    env: { ...environment, ...extra },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  t.after(() => child.kill())
  let stdout = '',
    stderr = ''
  child.stdout.on('data', bytes => {
    stdout += bytes
  })
  child.stderr.on('data', bytes => {
    stderr += bytes
  })
  child.stdin.end()
  const [code] = await once(child, 'close')
  return { code, stdout, stderr }
}

async function directory(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-env-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}

test('chat command loads .env credentials and terminal environment takes precedence without leaking either', {
  timeout: 15000,
}, async t => {
  const dir = await directory(t)
  const received = []
  const server = createServer(async (req, res) => {
    for await (const _chunk of req) {
      /* Drain the model request. */
    }
    received.push(req.headers.authorization)
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.end('data: {"choices":[{"index":0,"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n')
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
  const config = join(dir, 'models.json')
  await writeFile(
    config,
    JSON.stringify({
      connections: [
        {
          id: 'fixture',
          protocol: 'chat-completions',
          baseUrl: `http://127.0.0.1:${server.address().port}`,
          apiKeyEnv: 'DECKAGENT_TEST_TOKEN',
        },
      ],
    }),
  )
  await writeFile(join(dir, '.env'), 'DECKAGENT_TEST_TOKEN=fixture-dotenv-value\n')
  const args = ['--config', config, '--provider', 'fixture', '--model', 'fixture', '--prompt', 'Hello']
  const dotenv = await launch(t, dir, 'chat', args)
  assert.equal(dotenv.code, 0, dotenv.stderr)
  const terminal = await launch(t, dir, 'chat', args, { DECKAGENT_TEST_TOKEN: 'fixture-terminal-value' })
  assert.equal(terminal.code, 0)
  assert.deepEqual(received, ['Bearer fixture-dotenv-value', 'Bearer fixture-terminal-value'])
  const emptyTerminal = await launch(t, dir, 'chat', args, { DECKAGENT_TEST_TOKEN: '' })
  assert.equal(emptyTerminal.code, 1)
  assert.equal(received.length, 2, 'an explicitly empty terminal variable must not fall back to .env')
  for (const output of [dotenv, terminal]) {
    assert.equal((output.stdout + output.stderr).includes('fixture-dotenv-value'), false)
    assert.equal((output.stdout + output.stderr).includes('fixture-terminal-value'), false)
  }
})

test('Local Web rejects missing and malformed credentials before opening a browser or creating data', {
  timeout: 15000,
}, async t => {
  const dir = await directory(t)
  const config = join(dir, 'models.json')
  await writeFile(
    config,
    JSON.stringify({
      connections: [
        { id: 'fixture', protocol: 'gemini', baseUrl: 'http://127.0.0.1:1', apiKeyEnv: 'DECKAGENT_TEST_TOKEN' },
      ],
    }),
  )
  for (const value of ['', 'fixture invalid value']) {
    await writeFile(join(dir, '.env'), `DECKAGENT_TEST_TOKEN="${value}"\n`)
    // A file as workspace also prevents browser launch on the pre-fix path.
    const output = await launch(t, dir, 'start:local-web', [
      '--config',
      config,
      '--provider',
      'fixture',
      '--model',
      'fixture',
      '--workspace',
      config,
      '--data-dir',
      join(dir, 'data'),
    ])
    assert.equal(output.code, 1)
    assert.match(output.stderr, /PROVIDER_CREDENTIALS/)
    assert.match(output.stderr, /\.env/)
    if (value) assert.equal((output.stdout + output.stderr).includes(value), false)
    await assert.rejects(readFile(join(dir, 'data', 'sessions.sqlite')), { code: 'ENOENT' })
  }
})

test('both commands still show help when no .env exists', { timeout: 10000 }, async t => {
  const dir = await directory(t)
  for (const script of ['chat', 'start:local-web']) {
    const output = await launch(t, dir, script, ['--help'])
    assert.equal(output.code, 0)
  }
})
