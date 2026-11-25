import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { startLocalWeb } from '@deckagent/host'
import { DeckStore } from '@deckagent/deck'
import { SqliteSessionStore } from '@deckagent/session-persistence'
import { browserSession } from '../scripts/lib/browser-session.mjs'
import { brief } from '../packages/presentation/deck/tests/fixtures/brief.mjs'
import { setTimeout as delay } from 'node:timers/promises'

async function eventually(check, message) {
  for (let i = 0; i < 200; i++) {
    if (await check()) return
    await delay(25)
  }
  throw new Error(message)
}

test('a saved v3 Outline with all three images prepared blocks confirmation with the exact capacity reason until revised', {
  timeout: 45000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'layout-review-ui-'))
  let app, browser
  t.after(async () => {
    await browser?.close()
    await app?.close()
    await rm(dir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
  })
  const id = 'layout-review-chat',
    dataDir = join(dir, 'data')
  const sessions = new SqliteSessionStore(join(dataDir, 'db', 'sessions.sqlite'))
  await sessions.bind(id, { provider: 'fixture', model: 'workflow' })
  await sessions.append(id, [
    { role: 'user', content: 'Giới thiệu môi trường' },
    { role: 'assistant', content: 'Outline đã lưu' },
  ])
  sessions.close()
  const bytes = await readFile(new URL('../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
  const digest = createHash('sha256').update(bytes).digest('hex')
  const options = {
    artifactRoot: join(dataDir, 'files', 'decks'),
    researchImage: async (_session, query) => ({
      bytes,
      originalDigest: digest,
      parsedDigest: digest,
      source: { sourceId: 'src-00000000-0000-4000-8000-000000000000', version: 1, kind: 'research' },
      credit: {
        url: `https://photos.example/${query}`,
        author: 'Fixture',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        unknownLicense: false,
        retrievedAt: '2026-11-23T00:00:00Z',
      },
      selection: {
        provider: 'commons',
        query,
        imageUrl: `https://photos.example/${query}.png`,
        description: 'Fixture image',
        reason: 'Selected fixture',
        evidence: 'metadata',
        policy: 'web-images-v2',
      },
    }),
  }
  const draft = {
    ...brief(),
    template: { id: 'html-basic', version: 3 },
    purpose: 'Explain',
    proposedSlideCount: 6,
    sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
    images: { mode: 'public-research', provider: 'commons', attachmentIds: [], unmetRequirements: [] },
    answers: [{ topic: 'images', value: 'Required images' }],
  }
  const long =
    'Rừng và đại dương đều là những môi trường tự nhiên quan trọng, nuôi dưỡng sự sống và giữ cân bằng cho Trái Đất.'
  const outline = {
    overview: 'Môi trường',
    revisionSuggestions: [],
    slides: [
      ...Array.from({ length: 4 }, (_, i) => ({
        title: `Phần ${i + 1}`,
        content: 'Giữ nguyên',
        blocks: [{ kind: 'bullets', items: ['Giữ nguyên'] }],
        sources: [],
      })),
      {
        title: 'Rừng',
        content: 'Cây xanh',
        sources: [],
        blocks: [
          { kind: 'web-image', query: 'forest', required: true },
          { kind: 'bullets', items: ['Cây xanh'] },
        ],
      },
      {
        title: 'Rừng và đại dương',
        content: 'Hai hệ sinh thái',
        sources: [],
        blocks: [
          { kind: 'web-image', query: 'forest-pair', required: true },
          { kind: 'web-image', query: 'ocean', required: true },
          { kind: 'bullets', items: [long] },
        ],
      },
    ],
  }
  const decks = new DeckStore(join(dataDir, 'db', 'decks.sqlite'), options)
  const input = {
    requestId: 'saved-before-layout-check',
    responseIndex: 1,
    expectedBriefVersion: 0,
    expectedOutline: null,
    draft,
    outline,
  }
  const prepared = await decks.prepareOutlineImages(id, input, new AbortController().signal)
  decks.commitBriefProposal(id, input, prepared)
  const old = decks.outlineSnapshot(id).proposals.at(-1)
  assert.ok(old.imageReview.every(i => i.status === 'prepared'))
  decks.close()
  app = await startLocalWeb({
    dataDir,
    selection: { provider: 'fixture', model: 'workflow' },
    connections: [{ id: 'fixture', protocol: 'chat-completions', baseUrl: 'http://127.0.0.1:1' }],
  })
  browser = await browserSession()
  await browser.call('Network.setBlockedURLs', { urls: [] })
  await browser.call('Page.navigate', { url: `${app.origin}/#token=${app.token}` })
  await eventually(
    () =>
      browser.evaluate(`!!document.querySelector('.chat-navigation button[data-session-id="${id}"]:not(:disabled)')`),
    'Saved chat missing',
  )
  await browser.evaluate(`document.querySelector('.chat-navigation button[data-session-id="${id}"]').click();true`)
  await eventually(
    () => browser.evaluate(`!!document.querySelector('.outline-proposal[data-status=current]')`),
    'Saved Outline missing',
  )
  await eventually(
    () =>
      browser.evaluate(
        `document.querySelector('.outline-proposal[data-status=current] .outline-status').textContent.includes('bố cục')`,
      ),
    'Missing layout blocker',
  )
  assert.equal(await browser.evaluate(`document.querySelector('.outline-dock .outline-actions button').disabled`), true)
  const text = await browser.evaluate(`document.querySelector('.outline-proposal[data-status=current]').innerText`)
  assert.ok(text.includes('Slide 6') && text.includes('111') && text.includes('90'), text)
  await browser.call('Page.reload')
  await eventually(
    () =>
      browser.evaluate(
        `document.querySelector('.outline-proposal[data-status=current] .outline-status')?.textContent.includes('bố cục')`,
      ),
    'Reload lost layout blocker',
  )
  assert.equal(await browser.evaluate(`document.querySelector('.outline-dock .outline-actions button').disabled`), true)
  const updated = new DeckStore(join(dataDir, 'db', 'decks.sqlite'), options)
  const history = new SqliteSessionStore(join(dataDir, 'db', 'sessions.sqlite'))
  await history.append(id, [
    { role: 'user', content: 'Sửa nội dung cho vừa bố cục' },
    { role: 'assistant', content: 'Outline đã sửa' },
  ])
  history.close()
  const revised = {
    ...input,
    responseIndex: 3,
    requestId: 'reviewed-capacity-repair',
    expectedBriefVersion: 1,
    expectedOutline: { outlineId: old.outlineId, version: old.version },
    outline: structuredClone(outline),
  }
  revised.outline.slides[5].blocks[2].items[0] =
    'Rừng và đại dương nuôi dưỡng sự sống, góp phần giữ cân bằng môi trường.'
  const assets = await updated.prepareOutlineImages(id, revised, new AbortController().signal)
  updated.commitBriefProposal(id, revised, assets)
  assert.equal(updated.outlineSnapshot(id).proposals[0].slides[5].blocks[2].items[0], long)
  updated.close()
  await browser.call('Page.reload')
  await eventually(
    () =>
      browser.evaluate(
        `document.querySelector('.outline-proposal[data-status=current] .outline-status')?.textContent.includes('chờ bạn xác nhận')`,
      ),
    'Revised Outline not ready',
  )
  assert.equal(
    await browser.evaluate(`document.querySelector('.outline-dock .outline-actions button').disabled`),
    false,
  )
  const requests = await (
    await fetch(`${app.origin}/api/sessions/${id}/requests`, { headers: { authorization: `Bearer ${app.token}` } })
  ).json()
  assert.equal(requests.length, 0, 'Viewing and reloading do not start model or confirmation requests')
})
