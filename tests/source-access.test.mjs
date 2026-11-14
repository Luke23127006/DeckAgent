import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import * as files from '../packages/tools/filesystem/lib/index.js'

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-sources-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  for (const name of ['project', 'other', 'data']) await mkdir(join(dir, name))
  await writeFile(join(dir, 'project', 'notes.txt'), 'first\nsecond\n')
  await writeFile(join(dir, 'outside.txt'), 'outside')
  await writeFile(join(dir, 'other', 'private.txt'), 'other chat')
  return { dir, project: join(dir, 'project'), deniedRoots: [join(dir, 'other'), join(dir, 'data')] }
}

test('source access separates project reads, one-step outside approval and permanent denies without writes', async t => {
  const f = await fixture(t)
  const access = await files.createSourceAccess({ root: f.project, deniedRoots: f.deniedRoots })
  const signal = new AbortController().signal
  assert.equal((await access.list('', signal)).entries[0].name, 'notes.txt')
  const read = await access.planRead('notes.txt', false, signal)
  assert.equal(read.decision, 'allow')
  assert.equal((await read.read(signal)).text, 'first\nsecond\n')
  const outside = await access.planRead(join(f.dir, 'outside.txt'), true, signal)
  assert.equal(outside.decision, 'ask')
  assert.equal((await outside.read(signal)).text, 'outside')
  await assert.rejects(access.planRead('../outside.txt', false, signal), { code: 'SOURCE_ACCESS_DENIED' })
  await assert.rejects(access.planRead(join(f.dir, 'other', 'private.txt'), true, signal), { code: 'SOURCE_ACCESS_DENIED' })
  assert.equal(await readFile(join(f.project, 'notes.txt'), 'utf8'), 'first\nsecond\n')
})

test('ungrouped access has no cwd fallback; links and root replacement cannot widen a grant', async t => {
  const f = await fixture(t)
  const signal = new AbortController().signal
  const empty = await files.createSourceAccess({ deniedRoots: f.deniedRoots })
  await assert.rejects(empty.planRead('notes.txt', false, signal), { code: 'SOURCE_UNAVAILABLE' })
  assert.equal((await empty.planRead(join(f.dir, 'outside.txt'), true, signal)).decision, 'ask')
  await symlink(join(f.dir, 'other'), join(f.project, 'escape'), process.platform === 'win32' ? 'junction' : 'dir')
  const access = await files.createSourceAccess({ root: f.project, deniedRoots: f.deniedRoots })
  await assert.rejects(access.planRead('escape/private.txt', false, signal), { code: 'SOURCE_ACCESS_DENIED' })
  const plan = await access.planRead('notes.txt', false, signal)
  await rename(f.project, join(f.dir, 'moved'))
  await mkdir(f.project)
  await writeFile(join(f.project, 'notes.txt'), 'replacement')
  await assert.rejects(plan.read(signal), { code: 'SOURCE_CHANGED' })
})

test('an approved plan cannot read replaced content or a target newly denied while waiting', async t => {
  const f = await fixture(t)
  const denied = [...f.deniedRoots]
  const access = await files.createSourceAccess({ deniedRoots: () => denied })
  const signal = new AbortController().signal
  const plan = await access.planRead(join(f.dir, 'outside.txt'), true, signal)
  await writeFile(join(f.dir, 'outside.txt'), 'changed content')
  await assert.rejects(plan.read(signal), { code: 'SOURCE_CHANGED' })
  const next = await access.planRead(join(f.dir, 'outside.txt'), true, signal)
  denied.push(f.dir)
  await assert.rejects(next.read(signal), { code: 'SOURCE_ACCESS_DENIED' })
})
