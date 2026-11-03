import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'

test('material upload is Chat-owned, durable, usable without text and immutable after send', async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-materials-'))
  const options = {
    dataDir: root,
    materials: { maxFileBytes: 1024, maxAttachments: 2 },
    selection: { provider: 'fixture', model: 'material' },
    model: {
      async *stream(request) {
        const tool = request.tools.find(tool => tool.name === 'read_material')
        if (tool && request.messages.at(-1).role === 'user') {
          const id = /"materialId":"([\w-]+)"/.exec(request.messages.find(m => m.role === 'system')?.content)?.[1]
          yield { type: 'tool-call', call: { id: 'read', name: 'read_material', arguments: { materialId: id } } }
          yield { type: 'finish', reason: 'tool-calls' }
        } else {
          yield { type: 'text-delta', text: 'Material read' }
          yield { type: 'finish', reason: 'stop' }
        }
      },
    },
  }
  let app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body, raw = false) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${app.token}`,
        'content-type': raw ? 'application/octet-stream' : 'application/json',
        ...(raw ? { 'x-file-name': 'notes.txt' } : {}),
      },
      ...(body === undefined ? {} : { body: raw ? body : JSON.stringify(body) }),
    })
    return { status: response.status, data: await response.json() }
  }
  const x = (await api('sessions', 'POST', { selection: options.selection })).data.sessionId
  const y = (await api('sessions', 'POST', { selection: options.selection })).data.sessionId
  const uploaded = await api(`sessions/${x}/attachments`, 'POST', 'Vietnamese fact: tái chế giấy. MATERIAL_42', true)
  assert.equal(uploaded.status, 201)
  assert.equal(uploaded.data.status, 'ready', uploaded.data.reason)
  const materialId = uploaded.data.materialId
  await app.close()
  app = await startLocalWeb(options)
  assert.equal((await api(`sessions/${x}/materials`)).data.items[0].materialId, materialId)
  assert.equal((await api('requests', 'POST', { sessionId: y, input: '', attachmentIds: [materialId] })).status, 404)
  assert.equal((await api(`sessions/${y}/attachments/${materialId}`, 'DELETE')).status, 404)
  const client = new HostClient(app.origin, app.token)
  const request = await client.send({ sessionId: x, input: '', attachmentIds: [materialId] })
  let final
  for await (const snapshot of client.watch(request.requestId)) final = snapshot
  assert.equal(final.status, 'completed')
  assert.ok((await client.history(x)).some(m => m.role === 'tool' && m.content.includes('MATERIAL_42')))
  assert.equal((await api(`sessions/${x}/attachments/${materialId}`, 'DELETE')).status, 409)
  assert.equal((await api(`sessions/${x}/materials`)).data.items[0].status, 'ready')
})
