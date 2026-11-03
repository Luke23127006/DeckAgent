import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient } from '../packages/client/runtime/lib/index.js'
import { documentFixtures } from './fixtures/material-documents.mjs'

test('live Gemini interprets PNG/JPEG through the declared image-capable Host path', {
  skip: process.env.DECKAGENT_MATERIALS_LIVE !== '1',
  timeout: 210000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-images-live-'))
  const model = process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite'
  const app = await startLocalWeb({
    dataDir: root,
    materials: { maxFileBytes: 1024 * 1024, maxAttachments: 3 },
    openCode: {
      executable: resolve(
        process.env.DECKAGENT_OPENCODE_EXECUTABLE ??
          '.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe',
      ),
    },
    selection: { provider: 'google', model },
    connections: [
      {
        id: 'google',
        protocol: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyEnv: 'GEMINI_API_KEY',
      },
    ],
  })
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, method, body, name) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${app.token}`,
        'content-type': name ? 'application/octet-stream' : 'application/json',
        ...(name ? { 'x-file-name': name } : {}),
      },
      body: name ? body : JSON.stringify(body),
    })
    assert.ok(response.ok, `Host HTTP ${response.status}`)
    return response.json()
  }
  await api('providers/google', 'PUT', {
    displayName: 'Google',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [model],
    modelMetadata: [{ provider: 'google', model, inputModalities: ['text', 'image'] }],
  })
  const sessionId = (await api('sessions', 'POST', { selection: { provider: 'google', model } })).sessionId
  const fixtures = documentFixtures()
  const png = await api(`sessions/${sessionId}/attachments`, 'POST', fixtures['red.png'], 'input-one.png')
  const jpeg = await api(`sessions/${sessionId}/attachments`, 'POST', fixtures['red.jpeg'], 'input-two.jpeg')
  assert.equal(png.status, 'ready')
  assert.equal(jpeg.status, 'ready')
  const client = new HostClient(app.origin, app.token)
  const accepted = await client.send({
    sessionId,
    attachmentIds: [png.materialId, jpeg.materialId],
    input:
      'Describe the dominant visible color in each supplied image. Answer briefly in English; do not infer color from filenames or invent visual content.',
  })
  let final
  for await (const snapshot of client.watch(accepted.requestId)) final = snapshot
  assert.equal(final.status, 'completed', final.result?.error?.code)
  assert.match(final.result.text, /red/i)
})
