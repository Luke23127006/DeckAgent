import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import test from 'node:test'
import { startLocalWeb } from '../apps/local-web/lib/index.js'
import { DeckService } from '../packages/presentation/deck/lib/index.js'
import { DeckClient } from '../packages/client/runtime/lib/index.js'
import { materialBrowser, eventually } from './fixtures/material-browser.mjs'

test('visual editor previews/saves Vietnamese layout, keeps stale draft and opaque frames; no resource fetch', {
  timeout: 90000,
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'deckagent-direct-browser-'))
  let resourceFetches = 0
  const probe = createServer((_req, res) => {
    resourceFetches++
    res.end('UNEXPECTED')
  })
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
  const app = await startLocalWeb({
    dataDir: root,
    selection: { provider: 'fixture', model: 'test' },
    model: {
      async *stream() {
        yield { type: 'finish', reason: 'stop' }
      },
    },
    confirmedDecks: [
      {
        sessionId: 'edit-chat',
        outlineId: 'outline',
        slides: [
          { slideId: 'one', title: 'Slide One' },
          { slideId: 'two', title: 'Slide Two' },
        ],
      },
    ],
  })
  const seed = new DeckService(join(root, 'decks.sqlite'))
  const first = '<h1>KEEP_SLIDE_ONE</h1>',
    second = `<style>body{background-image:url(http://127.0.0.1:${probe.address().port}/canary)}</style><h1 class="title">Slide 2 original</h1><!--KEEP--><p>UNCHANGED_SAME_SLIDE</p>`
  for (const [slideId, html] of [
    ['one', first],
    ['two', second],
  ])
    seed.publish('edit-chat', { outlineId: 'outline', slideId, expectedRevision: 0, publicationId: slideId, html })
  seed.close()
  const teardown = []
  t.after(async () => {
    for (const close of teardown) await close()
    await app.close()
    await new Promise(resolve => probe.close(resolve))
    await rm(root, { recursive: true, force: true })
  })
  const client = new DeckClient(app.origin, app.token)
  const { evaluate, call } = await materialBrowser(
    { after: close => teardown.push(close) },
    root,
    `${app.origin}/#token=${app.token}`,
  )
  await call('Emulation.setDeviceMetricsOverride', { width: 1365, height: 1100, deviceScaleFactor: 1, mobile: false })
  await eventually(
    () =>
      evaluate(
        `!!document.querySelector('[data-session-id="edit-chat"]')&&!document.querySelector('[data-session-id="edit-chat"]').disabled`,
      ),
    'Chat not ready',
  )
  await evaluate(`document.querySelector('[data-session-id="edit-chat"]').click();true`)
  await eventually(
    () => evaluate(`document.querySelectorAll('[aria-label="Slides"] button').length===2`),
    'Deck not ready',
  )
  await evaluate(`document.querySelectorAll('[aria-label="Slides"] button')[1].click();true`)
  await eventually(() => evaluate(`!document.querySelector('.slide-editor>button').disabled`), 'Edit unavailable')
  assert.equal(await evaluate(`document.querySelector('.slide-editor>div').getBoundingClientRect().height`), 0)
  await evaluate(`document.querySelector('.slide-editor>button').click();true`)
  await eventually(
    () => evaluate(`document.querySelector('[aria-label="Nội dung"]')?.value==='Slide 2 original'`),
    'Editor document not ready',
  )
  await evaluate(
    `const text=document.querySelector('[aria-label="Nội dung"]');text.value='Tái chế trực tiếp';text.dispatchEvent(new Event('input'));const font=document.querySelector('[aria-label="Cỡ chữ (px)"]');font.value='28';font.dispatchEvent(new Event('input'));const align=document.querySelector('[aria-label="Căn lề"]');align.value='center';align.dispatchEvent(new Event('input'));true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('.slide-editor iframe').srcdoc.includes('font-size:28px!important')`),
    'Preview did not update',
  )
  assert.equal((await client.snapshot('edit-chat')).slides[1].revision, 1)
  assert.equal(await evaluate(`document.querySelector('.slide-editor iframe').getAttribute('sandbox')`), '')
  assert.equal(await evaluate(`document.querySelector('iframe[title="Published slide"]').getAttribute('sandbox')`), '')
  await call('Page.enable')
  const diagnostic = await call('Target.getTargets')
  await evaluate(`document.querySelector('.slide-editor').scrollIntoView({block:'start'});true`)
  const shot = await call('Page.captureScreenshot', { format: 'png' })
  await writeFile('.local-only/task006-editor-preview.png', Buffer.from(shot.data, 'base64'))
  let rendered
  for (const info of diagnostic.targetInfos.filter(info => info.type === 'iframe' && info.url === 'about:srcdoc')) {
    const target = await call('Target.attachToTarget', { targetId: info.targetId, flatten: true })
    const value = await call(
      'Runtime.evaluate',
      {
        expression: `JSON.stringify({text:document.querySelector('h1')?.textContent,size:document.querySelector('h1')?getComputedStyle(document.querySelector('h1')).fontSize:null,align:document.querySelector('h1')?getComputedStyle(document.querySelector('h1')).textAlign:null})`,
        returnByValue: true,
      },
      target.sessionId,
    )
    const observed = JSON.parse(value.result.value)
    if (observed.text === 'Tái chế trực tiếp') rendered = observed
  }
  assert.deepEqual(rendered, { text: 'Tái chế trực tiếp', size: '28px', align: 'center' })
  await evaluate(`document.querySelector('[aria-label="Lưu slide"]').click();true`)
  await eventually(async () => (await client.snapshot('edit-chat')).slides[1].revision === 2, 'Save missing')
  const saved = (await client.content('edit-chat', 'two', 2)).html
  assert.ok(saved.includes('<!--KEEP--><p>UNCHANGED_SAME_SLIDE</p>'))
  assert.equal((await client.content('edit-chat', 'one', 1)).html, first)
  await eventually(
    () =>
      evaluate(
        `!document.querySelector('[aria-label="Nội dung"]').disabled&&document.querySelector('.slide-editor [role="status"]').textContent.includes('Đã lưu')`,
      ),
    'Editor did not finish save',
  )
  await evaluate(
    `const input=document.querySelector('[aria-label="Nội dung"]');input.value='KEEP_UNSAVED_CONFLICT';input.dispatchEvent(new Event('input'));true`,
  )
  const current = await client.editableSlide('edit-chat', 'two'),
    p = current.nodes.find(node => node.text === 'UNCHANGED_SAME_SLIDE')
  await client.editSlide('edit-chat', {
    outlineId: 'outline',
    slideId: 'two',
    expectedRevision: 2,
    baseHash: current.baseHash,
    editId: 'concurrent',
    operations: [{ nodeId: p.nodeId, text: 'CONCURRENT_CHANGE' }],
  })
  await eventually(
    () => evaluate(`document.querySelector('.slide-editor [role="status"]').textContent.includes('bản mới')`),
    'Stale edit warning missing',
  )
  await evaluate(`document.querySelector('[aria-label="Lưu slide"]').click();true`)
  await eventually(
    () => evaluate(`document.querySelector('.slide-editor [role="status"]').textContent.includes('chưa ghi đè')`),
    'Stale save feedback missing',
  )
  assert.equal(await evaluate(`document.querySelector('[aria-label="Nội dung"]').value`), 'KEEP_UNSAVED_CONFLICT')
  assert.equal((await client.snapshot('edit-chat')).slides[1].revision, 3)
  assert.ok((await client.content('edit-chat', 'two', 3)).html.includes('CONCURRENT_CHANGE'))
  await evaluate(`location.reload();true`)
  await eventually(
    () => evaluate(`document.querySelectorAll('[aria-label="Slides"] button').length===2`),
    'Deck reopen missing',
  )
  await evaluate(
    `document.querySelectorAll('[aria-label="Slides"] button')[1].click();document.querySelector('.slide-editor>button').click();true`,
  )
  await eventually(
    () => evaluate(`document.querySelector('[aria-label="Nội dung"]')?.value==='Tái chế trực tiếp'`),
    'Saved content not reopened',
  )
  assert.equal(resourceFetches, 0, 'Neither original nor draft preview may fetch external CSS resources')
})
