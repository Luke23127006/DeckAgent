import assert from 'node:assert/strict'
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
  stat,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import fsPromises from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerFileTools, createWorkspaceReader } from '../packages/tools/filesystem/lib/index.js'

async function fixture(t, sourceAlias = false) {
  const base = await mkdtemp(join(tmpdir(), 'deckagent-isolation-'))
  t.after(() => rm(base, { recursive: true, force: true }))
  let sourceRoot = join(base, 'project')
  const root = join(base, 'chat-x')
  const other = join(base, 'chat-y')
  await Promise.all([mkdir(sourceRoot), mkdir(root), mkdir(other)])
  await writeFile(join(sourceRoot, 'report.md'), 'Project report')
  await writeFile(join(other, 'private.md'), 'Private chat Y')
  if (sourceAlias) {
    const alias = join(base, 'project-alias')
    await symlink(sourceRoot, alias, process.platform === 'win32' ? 'junction' : 'dir')
    sourceRoot = alias
  }
  const registry = new ToolRegistry()
  const registration = await registerFileTools(registry, { root, sourceRoot })
  t.after(() => registration.dispose())
  const execute = (name, args) =>
    registry.execute({ id: 'test', name, arguments: args }, registration.names, new AbortController().signal)
  return { base, root, sourceRoot, other, execute }
}

test('a Chat reads project sources but writes and publishes only through its private work root', async t => {
  const { root, sourceRoot, execute } = await fixture(t)
  assert.equal((await execute('read_file', { path: 'report.md', scope: 'source' })).content, 'Project report')
  assert.equal((await execute('write_file', { path: 'slide.html', content: '<h1>Private draft</h1>' })).isError, false)
  assert.equal(
    await (await createWorkspaceReader({ root }))('slide.html', new AbortController().signal),
    '<h1>Private draft</h1>',
  )
  assert.equal(
    (await execute('write_file', { path: 'report.md', scope: 'source', content: 'overwrite' })).isError,
    true,
  )
  assert.deepEqual(await readdir(sourceRoot), ['report.md'])
  assert.equal(await readFile(join(sourceRoot, 'report.md'), 'utf8'), 'Project report')
})

test('private Chat roots cannot discover or read sibling Chat files through either scope', async t => {
  const { root, other, sourceRoot, execute } = await fixture(t)
  await symlink(other, join(root, 'sibling'), process.platform === 'win32' ? 'junction' : 'dir')
  await link(join(other, 'private.md'), join(sourceRoot, 'linked.md'))
  for (const args of [
    { path: '../chat-y/private.md' },
    { path: other + '/private.md' },
    { path: 'sibling/private.md' },
    { path: '../chat-y/private.md', scope: 'source' },
    { path: 'linked.md', scope: 'source' },
    { path: 'private.md', scope: 'other-chat' },
  ]) {
    const result = await execute('read_file', args)
    assert.equal(result.isError, true)
    assert.equal(result.content.includes('Private chat Y'), false)
  }
  assert.equal((await execute('write_file', { path: 'sibling/new.md', content: 'denied' })).isError, true)
  assert.deepEqual(await readdir(other), ['private.md'])
})

test('moving and replacing a source folder revokes old access without substituting a same-name file', async t => {
  const { base, sourceRoot, execute } = await fixture(t)
  const moved = join(base, 'moved-project')
  await rename(sourceRoot, moved)
  assert.equal((await execute('read_file', { path: 'report.md', scope: 'source' })).isError, true)
  await mkdir(sourceRoot)
  await writeFile(join(sourceRoot, 'report.md'), 'Wrong replacement')
  const replacement = await execute('read_file', { path: 'report.md', scope: 'source' })
  assert.equal(replacement.isError, true)
  assert.equal(replacement.content.includes('Wrong replacement'), false)
  await rm(sourceRoot, { recursive: true })
  await rename(moved, sourceRoot)
  assert.equal((await execute('read_file', { path: 'report.md', scope: 'source' })).content, 'Project report')
})

test('a Workspace registry identity rejects a folder replaced before a request starts', async t => {
  const { root, sourceRoot, base } = await fixture(t)
  const { dev, ino } = await stat(sourceRoot)
  await rename(sourceRoot, join(base, 'old-project'))
  await mkdir(sourceRoot)
  await writeFile(join(sourceRoot, 'report.md'), 'Wrong replacement')
  await assert.rejects(
    registerFileTools(new ToolRegistry(), { root, sourceRoot, sourceIdentity: { dev, ino } }),
    /Workspace changed/,
  )
})

test('removing a source grant leaves private drafts readable without granting the old folder', async t => {
  const { root, sourceRoot, execute } = await fixture(t)
  await execute('write_file', { path: 'slide.html', content: '<h1>Saved work</h1>' })
  const registry = new ToolRegistry()
  const registration = await registerFileTools(registry, { root })
  t.after(() => registration.dispose())
  const call = args =>
    registry.execute(
      { id: 'read', name: 'read_file', arguments: args },
      registration.names,
      new AbortController().signal,
    )
  assert.equal((await call({ path: 'slide.html' })).content, '<h1>Saved work</h1>')
  assert.equal((await call({ path: 'report.md', scope: 'source' })).isError, true)
  assert.deepEqual(await readdir(sourceRoot), ['report.md'])
})

test('overlapping project/work roots and source symlink escapes are rejected', async t => {
  const { root, sourceRoot, other, execute } = await fixture(t)
  await symlink(other, join(sourceRoot, 'escape'), process.platform === 'win32' ? 'junction' : 'dir')
  assert.equal((await execute('read_file', { path: 'escape/private.md', scope: 'source' })).isError, true)
  for (const options of [
    { root, sourceRoot: root },
    { root, sourceRoot: join(root, 'nested') },
    { root: join(sourceRoot, 'nested'), sourceRoot },
  ]) {
    await mkdir(options.root, { recursive: true })
    await mkdir(options.sourceRoot, { recursive: true })
    await assert.rejects(registerFileTools(new ToolRegistry(), options), /separate/)
  }
})

test('a private work root replaced after validation cannot receive or expose content', async t => {
  const { root, base, execute } = await fixture(t)
  await rename(root, join(base, 'old-chat-x'))
  await mkdir(root)
  await writeFile(join(root, 'secret'), 'Wrong work root')
  assert.equal((await execute('read_file', { path: 'secret' })).isError, true)
  assert.equal((await execute('write_file', { path: 'slide.html', content: 'denied' })).isError, true)
  assert.deepEqual(await readdir(root), ['secret'])
})

for (const sourceAlias of [false, true])
  test(`a source file substituted between validation and open is not returned to the Agent${sourceAlias ? ' through a folder alias' : ''}`, async t => {
    const { sourceRoot, execute } = await fixture(t, sourceAlias)
    const target = join(await realpath(sourceRoot), 'report.md')
    const originalOpen = fsPromises.open
    let injected = false
    t.mock.method(fsPromises, 'open', async (path, ...args) => {
      if (!injected && path === target) {
        injected = true
        await rename(path, join(sourceRoot, 'original-report.md'))
        await writeFile(path, 'Substituted private content')
      }
      return originalOpen(path, ...args)
    })
    syncBuiltinESMExports()
    try {
      const result = await execute('read_file', { path: 'report.md', scope: 'source' })
      assert.equal(injected, true)
      assert.equal(result.isError, true)
      assert.equal(result.content.includes('Substituted private content'), false)
    } finally {
      t.mock.restoreAll()
      syncBuiltinESMExports()
    }
  })
