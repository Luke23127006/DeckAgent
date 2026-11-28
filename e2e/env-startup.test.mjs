import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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

test('Local Web opens the management API with missing or malformed environment keys so Settings can repair them', {
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
    const child = spawn(
      process.execPath,
      [
        '--env-file-if-exists=.env',
        '--use-system-ca',
        join(root, 'apps/host/lib/cli.js'),
        '--config',
        config,
        '--provider',
        'fixture',
        '--model',
        'fixture',
        '--data-dir',
        join(dir, 'data'),
        '--no-open',
      ],
      {
        cwd: dir,
        windowsHide: true,
        env: { ...process.env, DECKAGENT_TEST_TOKEN: value },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    const closed = once(child, 'close')
    t.after(() => child.kill())
    let output = ''
    child.stderr.on('data', bytes => {
      output += bytes
    })
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Local Web did not start')), 5000)
      child.stdout.on('data', bytes => {
        output += bytes
        const match = /Local Host: (http:\/\/127\.0\.0\.1:\d+)/.exec(output)
        if (match) {
          clearTimeout(timer)
          resolve(match[1])
        }
      })
      child.once('close', () => {
        clearTimeout(timer)
        reject(new Error('Local Web exited before Settings could open'))
      })
    })
    assert.equal((await fetch(origin)).status, 200)
    assert.equal(
      (await fetch(`${origin}/api/settings`)).status,
      401,
      'Settings still require the browser capability token',
    )
    if (value) assert.equal(output.includes(value), false)
    child.kill()
    await closed
  }
})

test('Local Web shows help when no .env exists', { timeout: 10000 }, async t => {
  const dir = await directory(t)
  const output = await launch(t, dir, 'web', ['--help'])
  assert.equal(output.code, 0)
})
