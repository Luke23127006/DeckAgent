import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { documentFixtures } from './fixtures/material-documents.mjs'

const enabled = process.env.DECKAGENT_MATERIALS_LIVE === '1'
test('live Gemini reads supplied facts into Vietnamese/English outlines and published slides', {
  skip: !enabled,
  timeout: 600000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-material-live-'))
  const model = process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite'
  const options = {
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
  }
  const app = await startLocalWeb(options)
  t.after(async () => {
    await app.close()
    await rm(root, { recursive: true, force: true })
  })
  const api = async (path, method = 'GET', body, fileName) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${app.token}`,
        'content-type': fileName ? 'application/octet-stream' : 'application/json',
        ...(fileName ? { 'x-file-name': fileName } : {}),
      },
      ...(body === undefined ? {} : { body: fileName ? body : JSON.stringify(body) }),
    })
    assert.ok(response.ok, `Host HTTP ${response.status}`)
    return response.json()
  }
  const finish = async request => {
    const client = new HostClient(app.origin, app.token)
    const accepted = await client.send(request)
    let final
    for await (const snapshot of client.watch(accepted.requestId)) final = snapshot
    assert.equal(final.status, 'completed', final.result?.error?.code)
    return final.result.text
  }
  const fixtures = documentFixtures()
  for (const [language, name] of [
    ['Vietnamese', 'notes.docx'],
    ['English', 'notes.pdf'],
  ]) {
    const sessionId = (await api('sessions', 'POST', { selection: options.selection })).sessionId
    const material = await api(`sessions/${sessionId}/attachments`, 'POST', fixtures[name], name)
    assert.equal(material.status, 'ready', material.reason)
    await finish({
      sessionId,
      attachmentIds: [material.materialId],
      presentation: true,
      input: `Read the attached source with read_material. Propose exactly TWO slides in ${language} about its recycling facts. Preserve the source identifier exactly as it appears in the document and use its actual facts. All details are supplied. No images, no external research. Propose now, wait for my confirmation.`,
    })
    const outline = await api(`sessions/${sessionId}/outline`)
    assert.equal(outline.confirmedId, null)
    const proposal = outline.proposals.at(-1)
    assert.equal(proposal.slides.length, 2)
    assert.match(JSON.stringify(proposal), /RECYCLE_FACT_42/)
    const history = await new HostClient(app.origin, app.token).history(sessionId)
    assert.ok(
      history.some(m => m.role === 'tool' && m.name === 'read_material' && m.content.includes('RECYCLE_FACT_42')),
    )
    await finish({
      sessionId,
      input: 'Confirm outline',
      outlineAction: { type: 'confirm', outlineId: proposal.outlineId, version: proposal.version },
    })
    const decks = new DeckClient(app.origin, app.token)
    const snapshot = await decks.snapshot(sessionId)
    assert.deepEqual(
      snapshot.slides.map(s => s.status),
      ['published', 'published'],
    )
    const content = await Promise.all(snapshot.slides.map(s => decks.content(sessionId, s.slideId, s.revision)))
    assert.match(JSON.stringify(content), /RECYCLE_FACT_42/)
    assert.match(JSON.stringify(content), language === 'Vietnamese' ? /giấy/i : /paper/i)
    t.diagnostic(`PASS supplied source -> ${language} outline -> confirm -> two slides`)
  }
})
