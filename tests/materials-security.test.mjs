import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, readFile, rm, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-security-'))
  const source = join(root, 'source')
  await mkdir(source)
  await writeFile(join(source, 'notes.txt'), 'REFERENCE_SOURCE_FACT')
  const model = {
    async *stream(request) {
      const manifest = /Host-authorized material manifest: (\[.*?\])\./s.exec(
        request.messages.find(m => m.role === 'system')?.content,
      )?.[1]
      if (manifest && request.messages.at(-1).role === 'user') {
        yield {
          type: 'tool-call',
          call: {
            id: `material-${request.messages.length}`,
            name: 'read_material',
            arguments: {
              materialId:
                /READ_ID=([\w-]+)/.exec(request.messages.at(-1).content)?.[1] ?? JSON.parse(manifest)[0].materialId,
            },
          },
        }
        yield { type: 'finish', reason: 'tool-calls' }
      } else {
        yield { type: 'text-delta', text: 'DONE' }
        yield { type: 'finish', reason: 'stop' }
      }
    },
  }
  const options = {
    dataDir: join(root, 'data'),
    materials: { maxFileBytes: 1024, maxAttachments: 2 },
    model,
    selection: { provider: 'fixture', model: 'material' },
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  return {
    root,
    source,
    options,
    get client() {
      return new HostClient(app.origin, app.token)
    },
    async api(path, method = 'GET', value, name) {
      const res = await fetch(`${app.origin}/api/${path}`, {
        method,
        headers: {
          authorization: `Bearer ${app.token}`,
          'content-type': name ? 'application/octet-stream' : 'application/json',
          ...(name ? { 'x-file-name': encodeURIComponent(name) } : {}),
        },
        ...(value === undefined ? {} : { body: name ? value : JSON.stringify(value) }),
      })
      return { status: res.status, data: await res.json() }
    },
    async restart() {
      await app.close()
      app = await startLocalWeb(options)
    },
  }
}
test('rejected, oversized, foreign, duplicate and excess material IDs cannot start work', async t => {
  const ctx = await fixture(t)
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection })).data.sessionId
  const bad = await ctx.api(`sessions/${chat}/attachments`, 'POST', 'not a PDF', 'bad.pdf')
  assert.equal(bad.data.status, 'rejected')
  assert.equal(
    (await ctx.api('requests', 'POST', { sessionId: chat, input: '', attachmentIds: [bad.data.materialId] })).status,
    409,
  )
  const big = await ctx.api(`sessions/${chat}/attachments`, 'POST', 'x'.repeat(1025), 'big.txt')
  assert.equal(big.data.status, 'rejected')
  assert.equal(big.data.reason, 'MATERIAL_FILE_LIMIT')
  const files = []
  for (let i = 0; i < 3; i++)
    files.push((await ctx.api(`sessions/${chat}/attachments`, 'POST', 'safe', `file${i}.txt`)).data.materialId)
  assert.equal(
    (await ctx.api('requests', 'POST', { sessionId: chat, input: 'read', attachmentIds: files })).status,
    400,
  )
  assert.equal(
    (await ctx.api('requests', 'POST', { sessionId: chat, input: 'read', attachmentIds: [files[0], files[0]] })).status,
    400,
  )
  assert.deepEqual(await ctx.client.history(chat), [])
  assert.equal((await ctx.api(`sessions/${chat}/attachments`, 'POST', 'safe', '../escape.txt')).status, 400)
})
test('named reference uses current approval; replacing its file is rejected at the read boundary', {
  timeout: 15000,
}, async t => {
  const ctx = await fixture(t)
  const workspace = (await ctx.api('workspaces', 'POST', { projectFolder: ctx.source })).data
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection, workspaceId: workspace.id })).data
    .sessionId
  const ref = (await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'notes.txt' })).data
  assert.equal(ref.kind, 'reference')
  assert.equal((await ctx.api(`sessions/${chat}/materials`)).data.items.filter(m => m.kind === 'attachment').length, 0)
  await ctx.api(`sessions/${chat}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  const accepted = await ctx.client.send({ sessionId: chat, input: '', referenceIds: [ref.materialId] })
  let approval
  for (let i = 0; i < 100; i++) {
    approval = (await ctx.client.snapshot(accepted.requestId)).approval
    if (approval) break
    await delay(10)
  }
  assert.ok(approval, 'Naming a reference must not grant Provided Materials Only access')
  await rename(join(ctx.source, 'notes.txt'), join(ctx.source, 'original.txt'))
  await writeFile(join(ctx.source, 'notes.txt'), 'REPLACEMENT_PRIVATE')
  await ctx.api(`requests/${accepted.requestId}/approval`, 'POST', {
    sessionId: chat,
    approvalId: approval.approvalId,
    version: approval.version,
    replyId: 'once',
    decision: 'once',
  })
  let final
  for await (const snapshot of ctx.client.watch(accepted.requestId)) final = snapshot
  assert.equal(final.status, 'completed', final.result?.error?.code)
  const history = await ctx.client.history(chat)
  assert.ok(history.some(m => m.role === 'tool' && m.isError))
  assert.equal(
    history.some(m => m.content.includes('REPLACEMENT_PRIVATE')),
    false,
  )
  assert.equal(await readFile(join(ctx.source, 'original.txt'), 'utf8'), 'REFERENCE_SOURCE_FACT')
  await ctx.restart()
  assert.equal(
    (await ctx.api('requests', 'POST', { sessionId: chat, input: 'Read', referenceIds: [ref.materialId] })).status,
    409,
  )
})
test('repointed workspace cannot substitute a same-name file for a captured reference', async t => {
  const ctx = await fixture(t)
  const workspace = (await ctx.api('workspaces', 'POST', { projectFolder: ctx.source })).data
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection, workspaceId: workspace.id })).data
    .sessionId
  const ref = (await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'notes.txt' })).data
  const other = join(ctx.root, 'other')
  await mkdir(other)
  await writeFile(join(other, 'notes.txt'), 'UNRELATED')
  await ctx.api(`workspaces/${workspace.id}`, 'PUT', { projectFolder: other })
  assert.equal(
    (await ctx.api('requests', 'POST', { sessionId: chat, input: '', referenceIds: [ref.materialId] })).status,
    409,
  )
  assert.deepEqual(await ctx.client.history(chat), [])
})

test('enabling the separate store preserves old Chat history; a foreign material schema fails without rewriting it', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-old-profile-'))
  const options = {
    dataDir: root,
    selection: { provider: 'fixture', model: 'legacy' },
    model: {
      async *stream() {
        yield { type: 'text-delta', text: 'KEEP_OLD_HISTORY' }
        yield { type: 'finish', reason: 'stop' }
      },
    },
  }
  let app = await startLocalWeb(options)
  let client = new HostClient(app.origin, app.token)
  const accepted = await client.send({ sessionId: 'old', input: 'Existing profile' })
  for await (const _snapshot of client.watch(accepted.requestId)) {
    /* Drain. */
  }
  const history = await client.history('old')
  await app.close()
  app = await startLocalWeb({ ...options, materials: { maxFileBytes: 1024, maxAttachments: 2 } })
  client = new HostClient(app.origin, app.token)
  assert.deepEqual(await client.history('old'), history)
  await app.close()
  const materialDb = join(root, 'materials.sqlite')
  const db = new DatabaseSync(materialDb)
  db.exec('PRAGMA user_version=999')
  db.close()
  const sha = async path =>
    createHash('sha256')
      .update(await readFile(path))
      .digest('hex')
  const before = await sha(materialDb)
  await assert.rejects(
    startLocalWeb({ ...options, materials: { maxFileBytes: 1024, maxAttachments: 2 } }),
    /Unknown material schema/,
  )
  assert.equal(await sha(materialDb), before)
  app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  assert.deepEqual(await new HostClient(app.origin, app.token).history('old'), history)
})

test('folder references list names only under Workspace Access and create no folder approval grant', async t => {
  const ctx = await fixture(t)
  await mkdir(join(ctx.source, 'notes'))
  await writeFile(join(ctx.source, 'notes', 'inside.txt'), 'UNREAD_FOLDER_CONTENT')
  const workspace = (await ctx.api('workspaces', 'POST', { projectFolder: ctx.source })).data
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection, workspaceId: workspace.id })).data
    .sessionId
  const ref = (await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'notes' })).data
  const read = async () => {
    const accepted = await ctx.client.send({ sessionId: chat, input: '', referenceIds: [ref.materialId] })
    for await (const _snapshot of ctx.client.watch(accepted.requestId)) {
      /* Drain. */
    }
    return (await ctx.client.history(chat)).filter(m => m.role === 'tool').at(-1)
  }
  const listed = await read()
  assert.match(listed.content, /inside.txt/)
  assert.equal(listed.content.includes('UNREAD_FOLDER_CONTENT'), false)
  await ctx.api(`sessions/${chat}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  const unavailable = await read()
  assert.equal(unavailable.content.includes('inside.txt'), false)
  assert.match(unavailable.content, /NAME_AN_EXACT_FILE_FOR_APPROVAL/)
  assert.deepEqual((await ctx.api(`sessions/${chat}/permissions`)).data.grants, [])
  const missing = (await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'missing.txt' })).data
  assert.equal(missing.status, 'rejected')
  await ctx.api(`workspaces/${workspace.id}`, 'DELETE')
  const refs = (await ctx.api(`sessions/${chat}/materials`)).data.items
  assert.equal(refs.find(item => item.materialId === ref.materialId).status, 'rejected')
})
test('root replacement during approval is refused even when the original file inode is moved into it', async t => {
  const ctx = await fixture(t)
  await mkdir(join(ctx.source, 'nested'))
  await writeFile(join(ctx.source, 'nested', 'notes.txt'), 'NESTED_SOURCE_FACT')
  const workspace = (await ctx.api('workspaces', 'POST', { projectFolder: ctx.source })).data
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection, workspaceId: workspace.id })).data
    .sessionId
  const ref = (await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'nested/notes.txt' })).data
  await ctx.api(`sessions/${chat}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  const accepted = await ctx.client.send({ sessionId: chat, input: '', referenceIds: [ref.materialId] })
  let approval
  for (let i = 0; i < 100; i++) {
    approval = (await ctx.client.snapshot(accepted.requestId)).approval
    if (approval) break
    await delay(10)
  }
  assert.ok(approval)
  const moved = join(ctx.root, 'moved-source')
  await rename(ctx.source, moved)
  await mkdir(ctx.source)
  await rename(join(moved, 'nested'), join(ctx.source, 'nested'))
  await ctx.api(`requests/${accepted.requestId}/approval`, 'POST', {
    sessionId: chat,
    approvalId: approval.approvalId,
    version: approval.version,
    replyId: 'once',
    decision: 'once',
  })
  for await (const _snapshot of ctx.client.watch(accepted.requestId)) {
    /* Drain. */
  }
  assert.equal((await ctx.client.history(chat)).filter(m => m.role === 'tool').at(-1).isError, true)
})

test('read_material rejects an unsubmitted draft ID even when it belongs to the same Chat', async t => {
  const ctx = await fixture(t)
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection })).data.sessionId
  const supplied = (await ctx.api(`sessions/${chat}/attachments`, 'POST', 'SUPPLIED', 'one.txt')).data
  const draft = (await ctx.api(`sessions/${chat}/attachments`, 'POST', 'UNSUBMITTED_PRIVATE', 'two.txt')).data
  const accepted = await ctx.client.send({
    sessionId: chat,
    input: `READ_ID=${draft.materialId}`,
    attachmentIds: [supplied.materialId],
  })
  for await (const _snapshot of ctx.client.watch(accepted.requestId)) {
    /* Drain. */
  }
  const history = await ctx.client.history(chat)
  assert.ok(history.some(m => m.role === 'tool' && m.isError && m.content.includes('MATERIAL_UNAVAILABLE')))
  assert.equal(
    history.some(m => m.content.includes('UNSUBMITTED_PRIVATE')),
    false,
  )
  assert.equal((await ctx.api(`sessions/${chat}/attachments/${draft.materialId}`, 'DELETE')).status, 200)
})
test('failed blob creation leaves an explicitly rejected material, not a ready or stuck preparation', async t => {
  const ctx = await fixture(t)
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection })).data.sessionId
  const path = join(ctx.options.dataDir, 'materials'),
    backup = join(ctx.options.dataDir, 'materials-backup')
  await rename(path, backup)
  await writeFile(path, 'fixture obstruction')
  try {
    const upload = await ctx.api(`sessions/${chat}/attachments`, 'POST', 'safe', 'notes.txt')
    assert.equal(upload.data.status, 'rejected')
    assert.equal(upload.data.reason, 'MATERIAL_STORAGE_FAILED')
    assert.equal((await ctx.api(`sessions/${chat}/materials`)).data.items[0].status, 'rejected')
  } finally {
    await rm(path)
    await rename(backup, path)
  }
})
test('attachment count applies to new material; a previously sent ID does not consume it again', async t => {
  const ctx = await fixture(t)
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection })).data.sessionId
  const ids = []
  for (let i = 0; i < 3; i++)
    ids.push((await ctx.api(`sessions/${chat}/attachments`, 'POST', `content${i}`, `file${i}.txt`)).data.materialId)
  const first = await ctx.client.send({ sessionId: chat, input: 'First material', attachmentIds: [ids[0]] })
  for await (const _snapshot of ctx.client.watch(first.requestId)) {
    /* Drain. */
  }
  const next = await ctx.client.send({
    sessionId: chat,
    input: 'Two new materials and the earlier one',
    attachmentIds: ids,
  })
  for await (const _snapshot of ctx.client.watch(next.requestId)) {
    /* Drain. */
  }
  assert.equal(
    (await ctx.api(`sessions/${chat}/materials`)).data.items.every(item => item.sent === true),
    true,
  )
})

test('a default Chat reports a missing project folder before reference reading or approval', async t => {
  const ctx = await fixture(t)
  const chat = (await ctx.api('sessions', 'POST', { selection: ctx.options.selection })).data.sessionId
  await ctx.api(`sessions/${chat}/permissions`, 'PUT', { preset: 'provided-materials-only' })
  const result = await ctx.api(`sessions/${chat}/references`, 'POST', { path: 'notes.txt' })
  assert.equal(result.status, 409)
  assert.equal(result.data.error.code, 'MATERIAL_REFERENCE_WORKSPACE_REQUIRED')
  assert.deepEqual(await ctx.client.history(chat), [])
})
