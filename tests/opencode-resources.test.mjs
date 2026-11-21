import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { startLocalWeb } from '../apps/local-web/lib/index.js'

test('a dependency installation supplies the pinned runtime without a global OpenCode or an override', {
  skip: process.platform !== 'win32' || process.arch !== 'x64',
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-installed-runtime-'))
  const previous = {
    PATH: process.env.PATH,
    Path: process.env.Path,
    DECKAGENT_OPENCODE: process.env.DECKAGENT_OPENCODE,
  }
  let app
  t.after(async () => {
    if (app) await app.close()
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
    await rm(dir, { recursive: true, force: true })
  })
  process.env.PATH = ''
  delete process.env.Path
  delete process.env.DECKAGENT_OPENCODE
  app = await startLocalWeb({ dataDir: dir, openCode: { resourceDir: join(dir, 'no-resources') } })
  const settings = await (
    await fetch(`${app.origin}/api/settings`, {
      headers: { authorization: `Bearer ${app.token}` },
    })
  ).json()
  assert.deepEqual(settings.runtime, { available: true })
})

test('release resources contain the pinned executable, its digest and license, and can be prepared twice', {
  skip: process.platform !== 'win32' || process.arch !== 'x64',
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-packaged-runtime-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const target = join(dir, 'opencode')
  const args = ['scripts/package-opencode.mjs', '--output', target]
  await promisify(execFile)(process.execPath, args, { windowsHide: true })
  const manifest = JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8'))
  assert.equal(manifest.version, '1.19.5')
  assert.equal(manifest.platform, 'win32')
  assert.equal(manifest.arch, 'x64')
  assert.equal(manifest.binary, 'bin/opencode.exe')
  const binary = await readFile(join(target, manifest.binary))
  assert.equal(createHash('sha256').update(binary).digest('hex'), manifest.sha256)
  assert.match(await readFile(join(target, 'LICENSE'), 'utf8'), /Copyright \(c\) 2025 opencode/)
  const repeat = await promisify(execFile)(process.execPath, args, { windowsHide: true })
  assert.match(repeat.stdout, /already prepared/)
  let app = await startLocalWeb({ dataDir: join(dir, 'data'), openCode: { resourceDir: target } })
  const settings = async () =>
    (
      await fetch(`${app.origin}/api/settings`, {
        headers: { authorization: `Bearer ${app.token}` },
      })
    ).json()
  try {
    assert.deepEqual((await settings()).runtime, { available: true })
  } finally {
    await app.close()
  }
  await writeFile(join(target, 'manifest.json'), JSON.stringify({ ...manifest, sha256: '0'.repeat(64) }))
  app = await startLocalWeb({ dataDir: join(dir, 'data'), openCode: { resourceDir: target } })
  try {
    assert.deepEqual(
      (await settings()).runtime,
      { available: false, reason: 'RUNTIME_UNAVAILABLE' },
      'A damaged bundled executable must not silently fall back to the workspace/global runtime',
    )
  } finally {
    await app.close()
  }
  await assert.rejects(
    promisify(execFile)(process.execPath, args, { windowsHide: true }),
    /not the pinned resource set/,
  )
  assert.equal(
    JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8')).sha256,
    '0'.repeat(64),
    'Resource preparation must not overwrite a different existing destination',
  )
})

test('startup reports a broken explicit override before sending and does not fall back to the installed runtime', {
  timeout: 15000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-runtime-health-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  for (const [executable, reason] of [
    [process.execPath, 'RUNTIME_VERSION_UNSUPPORTED'],
    [join(dir, 'missing.exe'), 'RUNTIME_UNAVAILABLE'],
  ]) {
    const app = await startLocalWeb({ dataDir: dir, openCode: { executable } })
    try {
      const settings = await (
        await fetch(`${app.origin}/api/settings`, {
          headers: { authorization: `Bearer ${app.token}` },
        })
      ).json()
      assert.deepEqual(settings.runtime, { available: false, reason })
    } finally {
      await app.close()
    }
  }
})
