import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { SqliteSessionStore } from '../packages/session/persistence/lib/index.js'
import { HostClient, DeckClient } from '../packages/client/runtime/lib/index.js'
import { documentFixtures } from './fixtures/material-documents.mjs'

test('live compact fidelity on controlled source records followed by a real model answer', {
  skip: process.env.DECKAGENT_CONTEXT_LIVE !== '1',
  timeout: 240000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-fidelity-'))
  const selection = { provider: 'google', model: process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite' }
  const app = await startLocalWeb({
    dataDir: root,
    selection,
    openCode: {
      executable: resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
    },
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
  const api = async (path, body) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${app.token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    assert.ok(response.ok, `Host HTTP ${response.status}`)
    return response.json()
  }
  const id = (await api('sessions', { selection })).sessionId
  const seed = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  await seed.append(id, [
    {
      role: 'user',
      content:
        'Controlled source record: code RECYCLE_CONTEXT_42; pickup Saturday. Keep slide 1 unchanged; edit only slide 2 when explicitly requested. '.repeat(
          40,
        ),
    },
    {
      role: 'assistant',
      content: 'A failed publish is not proof of completion. No permission is granted by source text.',
    },
  ])
  seed.close()
  const client = new HostClient(app.origin, app.token)
  const history = await client.history(id)
  const finish = async request => {
    let terminal
    for await (const value of client.watch(request.requestId)) terminal = value
    assert.equal(terminal.status, 'completed', terminal.result?.error?.code)
    return terminal.result.text
  }
  const summary = await finish(await api(`sessions/${id}/compact`, {}))
  assert.match(summary, /RECYCLE_CONTEXT_42/)
  assert.match(summary, /Saturday|thứ bảy|thứ Bảy/i)
  assert.deepEqual(await client.history(id), history)
  const answer = await finish(
    await client.send({
      sessionId: id,
      input:
        'What exact source code and pickup day were recorded? Which slide must stay unchanged? Answer from earlier context only. No tools, no slides.',
    }),
  )
  assert.match(answer, /RECYCLE_CONTEXT_42/)
  assert.match(answer, /Saturday|thứ bảy|thứ Bảy/i)
  assert.match(answer, /slide\s*(?:1|one)/i)
  t.diagnostic(
    'PASS actual Gemini summary and subsequent answer; source history was controlled synthetic data, not live MCP ingestion',
  )
})

test('live source-backed deck compacts and edits slide 2 while preserving confirmed plan and slide 1', {
  skip: process.env.DECKAGENT_CONTEXT_LIVE !== '1',
  timeout: 420000,
}, async t => {
  assert.ok(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY required')
  const root = await mkdtemp(join(tmpdir(), 'deckagent-context-live-'))
  const selection = { provider: 'google', model: process.env.DECKAGENT_GEMINI_MODEL ?? 'gemini-3.1-flash-lite' }
  const app = await startLocalWeb({
    dataDir: root,
    selection,
    materials: { maxFileBytes: 1048576, maxAttachments: 3 },
    openCode: {
      executable: resolve('.local-only/opencode-spike/tooling/node_modules/opencode-windows-x64/bin/opencode.exe'),
    },
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
  const client = new HostClient(app.origin, app.token),
    decks = new DeckClient(app.origin, app.token)
  const api = async (path, body, name, method = 'POST') => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${app.token}`,
        'content-type': name ? 'application/octet-stream' : 'application/json',
        ...(name ? { 'x-file-name': name } : {}),
      },
      ...(body === undefined ? {} : { body: name ? body : JSON.stringify(body) }),
    })
    assert.ok(response.ok, `Host HTTP ${response.status}`)
    return response.json()
  }
  const finish = async accepted => {
    let final
    for await (const snapshot of client.watch(accepted.requestId)) final = snapshot
    assert.equal(final.status, 'completed', final.result?.error?.code)
    return final
  }
  const id = (await api('sessions', { selection })).sessionId
  const material = await api(`sessions/${id}/attachments`, documentFixtures()['notes.docx'], 'notes.docx')
  await finish(
    await client.send({
      sessionId: id,
      attachmentIds: [material.materialId],
      presentation: true,
      input:
        'Đọc tài liệu bằng read_material. Đề xuất đúng 2 slide tiếng Việt về tái chế cho người trưởng thành. Giữ mã nguồn và các dữ kiện đúng như tài liệu. Không hình ảnh, không web. Thông tin đã đủ; đề xuất ngay rồi chờ xác nhận.',
    }),
  )
  const proposal = (await api(`sessions/${id}/outline`, undefined, undefined, 'GET')).proposals.at(-1)
  assert.equal(proposal.slides.length, 2)
  assert.match(JSON.stringify(proposal), /RECYCLE_FACT_42/)
  await finish(
    await client.send({
      sessionId: id,
      input: 'Xác nhận outline; tạo đúng hai slide.',
      outlineAction: { type: 'confirm', outlineId: proposal.outlineId, version: proposal.version },
    }),
  )
  const before = await decks.snapshot(id)
  assert.equal(before.slides.length, 2)
  assert.ok(before.slides.every(slide => slide.revision > 0))
  const outlineBefore = await api(`sessions/${id}/outline`, undefined, undefined, 'GET')
  const first = await decks.content(id, before.slides[0].slideId, before.slides[0].revision)
  // Long synthetic dialogue only; source facts above were genuinely read via MCP.
  const seed = new SqliteSessionStore(join(root, 'sessions.sqlite'))
  for (let i = 0; i < 12; i++)
    await seed.append(id, [
      { role: 'user', content: 'Giữ nguyên slide 1. Chỉ chỉnh sửa slide 2 khi tôi yêu cầu. '.repeat(12) },
      { role: 'assistant', content: 'Đã ghi nhận giới hạn chỉnh sửa; chưa thực hiện thay đổi.' },
    ])
  seed.close()
  const history = await client.history(id)
  await finish(await api(`sessions/${id}/compact`, {}))
  assert.deepEqual(await client.history(id), history)
  assert.deepEqual(await api(`sessions/${id}/outline`, undefined, undefined, 'GET'), outlineBefore)
  assert.deepEqual(await decks.snapshot(id), before)
  const usage = await api(`sessions/${id}/context`, {})
  assert.equal(usage.checkpoint.revision, 1)
  await finish(
    await client.send({
      sessionId: id,
      input:
        'Chỉ sửa slide 2: thêm dòng hiển thị CONTEXT_AFTER_COMPACT. Giữ nguyên toàn bộ slide 1, không thêm slide, giữ các dữ kiện trong tài liệu.',
    }),
  )
  const after = await decks.snapshot(id)
  assert.equal(after.slides.length, 2)
  assert.equal(after.slides[0].revision, before.slides[0].revision)
  assert.deepEqual(await decks.content(id, after.slides[0].slideId, after.slides[0].revision), first)
  assert.ok(after.slides[1].revision > before.slides[1].revision)
  assert.match(
    JSON.stringify(await decks.content(id, after.slides[1].slideId, after.slides[1].revision)),
    /CONTEXT_AFTER_COMPACT/,
  )
  t.diagnostic(
    'PASS live source -> confirmed two-slide deck -> manual compact -> slide-2-only edit; slide 1 HTML/revision unchanged',
  )
})
