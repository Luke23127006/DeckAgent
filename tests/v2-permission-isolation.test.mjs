import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, link, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ToolRegistry } from '../packages/agent/runtime/lib/index.js'
import { registerFileTools } from '../packages/tools/filesystem/lib/index.js'

test('approval cannot authorize sibling Chat data, links, traversal or original-file writes', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-permission-isolation-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const work = join(dir, 'work'),
    root = join(work, 'x'),
    sibling = join(work, 'y'),
    source = join(dir, 'source')
  await mkdir(root, { recursive: true })
  await mkdir(sibling)
  await mkdir(source)
  await writeFile(join(sibling, 'secret.txt'), 'Other Chat')
  await writeFile(join(source, 'original.txt'), 'Original')
  await symlink(sibling, join(dir, 'alias'), process.platform === 'win32' ? 'junction' : 'dir')
  await link(join(sibling, 'secret.txt'), join(dir, 'linked.txt'))
  const registry = new ToolRegistry()
  let approvals = 0
  const files = await registerFileTools(registry, {
    root,
    sourceRoot: source,
    blockedRoots: [work],
    authorizeRead: async () => {
      approvals++
    },
  })
  t.after(files.dispose)
  const execute = (name, args) =>
    registry.execute({ id: 'call', name, arguments: args }, files.names, new AbortController().signal)
  for (const path of [join(sibling, 'secret.txt'), join(dir, 'alias', 'secret.txt'), join(dir, 'linked.txt')])
    assert.equal((await execute('read_file', { path, scope: 'external' })).isError, true)
  assert.equal((await execute('read_file', { path: '../y/secret.txt' })).isError, true)
  assert.equal((await execute('write_file', { path: join(source, 'new.txt'), content: 'overwrite' })).isError, true)
  assert.equal((await execute('write_file', { path: '../source/original.txt', content: 'overwrite' })).isError, true)
  assert.equal(approvals, 0, 'Hard boundaries must never offer approval')
  assert.equal(await readFile(join(source, 'original.txt'), 'utf8'), 'Original')
  assert.equal((await execute('write_file', { path: 'draft.txt', content: 'Private draft' })).isError, false)
})

test('a file replaced while approval waits is not read under the old approval', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-permission-race-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const root = join(dir, 'work'),
    target = join(dir, 'outside.txt')
  await mkdir(root)
  await writeFile(target, 'Original')
  const registry = new ToolRegistry()
  const files = await registerFileTools(registry, {
    root,
    blockedRoots: [root],
    authorizeRead: async () => {
      await rename(target, join(dir, 'old.txt'))
      await writeFile(target, 'Substitution')
    },
  })
  t.after(files.dispose)
  const result = await registry.execute(
    { id: 'read', name: 'read_file', arguments: { path: target, scope: 'external' } },
    files.names,
    new AbortController().signal,
  )
  assert.equal(result.isError, true)
  assert.equal(result.content.includes('Substitution'), false)
})
