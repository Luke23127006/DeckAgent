import assert from 'node:assert/strict'
import { link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerFileTools } from '../packages/tools/filesystem/lib/index.js'

test('an allowed Agent can write and read an HTML draft inside its workspace', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-files-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const tools = new ToolRegistry()
  const registration = await registerFileTools(tools, { root })
  t.after(() => registration.dispose())
  const signal = new AbortController().signal
  const written = await tools.execute(
    { id: 'write', name: 'write_file', arguments: { path: 'slide.html', content: '<h1>DeckAgent</h1>' } },
    registration.names,
    signal,
  )
  assert.equal(written.isError, false)
  assert.equal(await readFile(join(root, 'slide.html'), 'utf8'), '<h1>DeckAgent</h1>')
  const result = await tools.execute(
    { id: 'read', name: 'read_file', arguments: { path: 'slide.html' } },
    registration.names,
    signal,
  )
  assert.equal(result.content, '<h1>DeckAgent</h1>')
})

test('paths outside the grant, Windows aliases and existing files cannot be written', async t => {
  const parent = await mkdtemp(join(tmpdir(), 'deckagent-policy-'))
  t.after(() => rm(parent, { recursive: true, force: true }))
  const root = join(parent, 'workspace')
  await mkdir(root)
  await writeFile(join(parent, 'outside.html'), 'original')
  await writeFile(join(root, 'existing.html'), 'keep')
  const registry = new ToolRegistry()
  const registration = await registerFileTools(registry, { root })
  t.after(() => registration.dispose())
  for (const path of [
    '../outside.html',
    '..\\outside.html',
    join(parent, 'outside.html'),
    'C:\\outside.html',
    '\\\\server\\share\\x',
    'C:relative',
    'file:stream',
    'NUL.html',
    'folder/../x',
    'x. ',
    'existing.html',
  ]) {
    const result = await registry.execute(
      { id: path, name: 'write_file', arguments: { path, content: 'changed' } },
      registration.names,
      new AbortController().signal,
    )
    assert.equal(result.isError, true, path)
    assert.equal(result.content.includes(parent), false)
  }
  assert.equal(await readFile(join(parent, 'outside.html'), 'utf8'), 'original')
  assert.equal(await readFile(join(root, 'existing.html'), 'utf8'), 'keep')
})

test('junctions, hard links, size limits and cancellation respect the workspace policy', async t => {
  const parent = await mkdtemp(join(tmpdir(), 'deckagent-links-'))
  t.after(() => rm(parent, { recursive: true, force: true }))
  const root = join(parent, 'workspace')
  const outside = join(parent, 'outside')
  await mkdir(root)
  await mkdir(outside)
  await writeFile(join(outside, 'secret'), 'outside data')
  await symlink(outside, join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir')
  await link(join(outside, 'secret'), join(root, 'hardlink'))
  await writeFile(join(root, 'huge'), Buffer.alloc(256 * 1024 + 1))
  const registry = new ToolRegistry()
  const registration = await registerFileTools(registry, { root })
  t.after(() => registration.dispose())
  const signal = new AbortController().signal
  for (const path of ['escape/secret', 'hardlink', 'huge']) {
    const result = await registry.execute(
      { id: 'read', name: 'read_file', arguments: { path } },
      registration.names,
      signal,
    )
    assert.equal(result.isError, true, path)
    assert.equal(result.content.includes('outside data'), false)
  }
  const deniedWrite = await registry.execute(
    { id: 'write', name: 'write_file', arguments: { path: 'escape/new.html', content: 'no' } },
    registration.names,
    signal,
  )
  assert.equal(deniedWrite.isError, true)
  await assert.rejects(readFile(join(outside, 'new.html')), { code: 'ENOENT' })
  const aborted = await registry.execute(
    { id: 'cancel', name: 'write_file', arguments: { path: 'cancelled', content: 'no' } },
    registration.names,
    AbortSignal.abort(),
  )
  assert.equal(aborted.isError, true)
  await assert.rejects(readFile(join(root, 'cancelled')), { code: 'ENOENT' })
  registration.dispose()
  assert.throws(() => registry.schemas(registration.names), { code: 'TOOL_NOT_FOUND' })
})
