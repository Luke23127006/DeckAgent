import assert from 'node:assert/strict'
import test from 'node:test'
import { HtmlFormatAdapter, inspectControlledLayout } from '../lib/index.js'
import { listTemplates } from '@deckagent/design'
import { browserSession } from '../../../../scripts/lib/browser-session.mjs'
import { layoutFixtures } from '../../../../scripts/lib/layout-fixtures.mjs'

test('seven controlled layouts keep real text and images legible in their own regions', { timeout: 60000 }, async t => {
  const browser = await browserSession()
  t.after(() => browser.close())
  const adapter = new HtmlFormatAdapter()
  const fixtures = await layoutFixtures({
    imagePaths: [
      new URL('../../../../apps/host/tests/fixtures/attachments/sample.png', import.meta.url),
      new URL('../../../../apps/host/tests/fixtures/attachments/sample.jpg', import.meta.url),
    ],
  })
  const phrase = length => 'Bảo vệ môi trường bằng hành động thiết thực mỗi ngày. '.repeat(12).slice(0, length)
  const capacities = listTemplates('html').find(t => t.version === 3).layouts
  const boundary = fixtures.map(f => {
    const capacity = capacities.find(c => c.id === f.layoutId).capacity
    const nodes = f.document.nodes.map(n => {
      if (n.kind === 'bullets')
        return { ...n, items: Array.from({ length: capacity.maxBullets }, () => phrase(capacity.bullet)) }
      if (n.kind === 'image') return { ...n, caption: phrase(capacity.caption) }
      if (n.kind === 'columns')
        return {
          ...n,
          columns: n.columns.map(() => ({
            bullets: Array.from({ length: capacity.maxBullets }, () => phrase(capacity.bullet)),
          })),
        }
      if (n.kind === 'metrics')
        return {
          ...n,
          items: Array.from({ length: 3 }, () => ({ value: phrase(capacity.value), label: phrase(capacity.label) })),
        }
      return { ...n, text: phrase(capacity[n.kind === 'source-note' ? 'note' : n.kind]) }
    })
    return { ...f, name: f.name + '-capacity', document: { ...f.document, title: phrase(capacity.title), nodes } }
  })
  const unevenPair = structuredClone(fixtures.find(f => f.layoutId === 'image-pair'))
  unevenPair.name = 'image-pair-uneven-captions'
  unevenPair.document.nodes[0].caption = phrase(100)
  unevenPair.document.nodes[1].caption = 'Biển'
  const portraitData = await browser.evaluate(
    `(()=>{const c=document.createElement('canvas');c.width=600;c.height=1000;const x=c.getContext('2d');x.fillStyle='#256c78';x.fillRect(0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1]})()`,
  )
  const portrait = structuredClone(fixtures.find(f => f.layoutId === 'image-text'))
  portrait.name = 'image-text-portrait'
  portrait.assets[0].bytes = Buffer.from(portraitData, 'base64')
  portrait.assets[0].byteSize = portrait.assets[0].bytes.length
  for (const context of [...fixtures, ...boundary, unevenPair, portrait]) {
    const built = adapter.build(adapter.context(context).starter, context)
    await browser.page(built.preview)
    assert.equal(await browser.evaluate(`(${inspectControlledLayout.toString()})()`), undefined, context.name)
    const geometry = await browser.evaluate(`(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
      const title=document.querySelector('h1');const content=document.querySelector('.da3-composition');
      const range=document.createRange();range.selectNodeContents(document.body);
      return {title:rect(title),content:content?rect(content):null,images:[...document.images].map(rect),
        columns:[...document.querySelectorAll('.da3-column-grid>ul')].map(rect),
        captions:[...document.querySelectorAll('figcaption')].map(rect),
        bodyWidth:document.body.scrollWidth,bodyHeight:document.body.scrollHeight,
        bodyFont:getComputedStyle(document.body).fontSize,titleFont:getComputedStyle(title).fontSize,
        words:[...document.querySelectorAll('li,p,strong')].map(rect)};
    })()`)
    assert.equal(geometry.bodyWidth, 1280, context.name)
    assert.equal(geometry.bodyHeight, 720, context.name)
    assert.equal(geometry.bodyFont, '24px')
    assert.equal(geometry.titleFont, '48px')
    for (const r of [...geometry.words, ...geometry.images, ...geometry.captions]) {
      assert.ok(
        r.width > 0 && r.height > 0 && r.x >= 31 && r.y >= 31 && r.right <= 1249 && r.bottom <= 689,
        `${context.name}: ${JSON.stringify(r)}`,
      )
    }
    if (geometry.content) assert.ok(geometry.title.bottom + 20 <= geometry.content.y, context.name)
    if (context.layoutId === 'image-text') {
      assert.equal(geometry.images.length, 1)
      assert.ok(geometry.images[0].width >= 650 && geometry.images[0].height >= 320, JSON.stringify(geometry))
      assert.ok(geometry.images[0].x > 450)
    }
    if (context.layoutId === 'image-pair') {
      assert.equal(geometry.images.length, 2)
      const [a, b] = geometry.images
      assert.ok(
        Math.abs(a.y - b.y) < 2 &&
          Math.abs(a.width - b.width) < 2 &&
          Math.abs(a.height - b.height) < 2 &&
          a.right + 20 <= b.x,
      )
      assert.ok(a.height >= 240 && b.height >= 240)
    }
    if (context.layoutId === 'two-column') {
      const [a, b] = geometry.columns
      assert.ok(
        a.right + 32 <= b.x && Math.abs(a.width - b.width) < 2 && Math.abs(a.y - b.y) < 2,
        `Two columns must start at the same height: ${JSON.stringify([a, b])}`,
      )
    }
  }
  const imageContext = fixtures.find(f => f.layoutId === 'image-text')
  await browser.page(adapter.build(adapter.context(imageContext).starter, imageContext).preview)
  await browser.evaluate(`document.querySelector('img').style.width='80px';true`)
  assert.equal((await browser.evaluate(`(${inspectControlledLayout.toString()})()`)).code, 'ARTIFACT_LAYOUT_GEOMETRY')
})
