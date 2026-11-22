import assert from 'node:assert/strict'
import test from 'node:test'
import { TavilyClient } from '../apps/local-web/lib/index.js'
import { WebImageResearch, PublicImageReader, imagePageCredit } from '../apps/local-web/lib/index.js'
import { DeckService, outlineImageNeeds } from '../packages/presentation/deck/lib/index.js'
import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const png = await readFile(new URL('./fixtures/attachments/sample.png', import.meta.url))
const digest = createHash('sha256').update(png).digest('hex')
const credit = { url: 'https://photos.example/solar', author: 'Photographer', license: 'CC BY',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', unknownLicense: false, retrievedAt: '2026-11-22T00:00:00Z' }
const prepared = { bytes: png, source: { sourceId: 'src-00000000-0000-4000-8000-000000000000', kind: 'research', version: 1 },
  originalDigest: digest, parsedDigest: digest, credit }
const outline = { overview: 'Renewable energy', revisionSuggestions: [], slides: [{
  title: 'Solar energy', content: 'Solar panels convert sunlight', sources: [], blocks: [{
    kind: 'web-image', query: 'energy', provider: 'commons', intent: { subject: 'Solar panels',
      role: 'Show photovoltaic panels', mustInclude: ['panels'], mustAvoid: ['wind turbines'], aspect: 'landscape' },
  }],
}] }
const candidates = [
  { imageUrl: 'https://photos.example/wind.png', sourceUrl: 'https://photos.example/wind', title: 'Wind turbines', description: 'Wind farm', credit },
  { imageUrl: 'https://photos.example/solar.png', sourceUrl: 'https://photos.example/solar', title: 'Solar panels', description: 'Photovoltaic panels on a roof', credit },
]
function service(t, entries = candidates) {
  const downloads = []
  const commons = { candidates: async () => entries, prepare: async c => { downloads.push(c.imageUrl); return prepared } }
  const images = new WebImageResearch({ imageSearch: async () => entries }, commons)
  t.after(() => images.close())
  let attempts = 0
  const run = images.open(AbortSignal.timeout(5000), () => { if (++attempts > 5) throw Object.assign(new Error(), { code: 'budget' }) })
  return { images, run, downloads, attempts: () => attempts }
}

test('image search retains page association and descriptions without granting text research', async () => {
  const calls = []
  const client = new TavilyClient(async (url, init) => {
    calls.push({ url, init })
    if (String(url).endsWith('/usage')) return Response.json({
      account: { current_plan: 'Researcher', paygo_usage: 0, paygo_limit: 0, plan_usage: 0, plan_limit: 1000 },
      key: { usage: 0, limit: null },
    })
    return Response.json({ images: [{ url: 'https://photos.example/orphan.jpg', description: 'No page' }], results: [{
      title: 'Solar panels', url: 'https://photos.example/solar', content: 'Not retained as text research',
      images: [{ url: 'https://photos.example/solar.jpg', description: 'Solar panels on a roof' }],
    }] })
  })
  const result = await client.images('test-key', 'solar panels', AbortSignal.timeout(1000))
  assert.equal(result.length, 2)
  assert.equal(result[0].sourceUrl, 'https://photos.example/solar')
  assert.equal(result[0].description, 'Solar panels on a roof')
  assert.equal(result[1].sourceUrl, undefined)
  assert.equal('content' in result[0], false)
  const body = JSON.parse(calls[1].init.body)
  assert.equal(body.include_images, true)
  assert.equal(body.include_image_descriptions, true)
  assert.equal(body.auto_parameters, false)
})

test('a real candidate must be selected; first downloadable but irrelevant image is never substituted', async t => {
  const f = service(t)
  const [need] = await f.run.stage(outlineImageNeeds(outline))
  assert.equal(f.downloads.length, 0)
  await assert.rejects(f.run.resolve(need), { code: 'RESEARCH_IMAGE_SELECTION_REQUIRED' })
  await assert.rejects(f.run.select(need.needId, 'invented-id', 'Matches'), { code: 'RESEARCH_IMAGE_ARGUMENTS_INVALID' })
  const selected = await f.run.select(need.needId, need.candidates[1].candidateId, 'Photovoltaic panels match the slide; wind turbines do not.')
  assert.equal(selected.selection.evidence, 'metadata')
  assert.deepEqual(f.downloads, ['https://photos.example/solar.png'])
  assert.equal((await f.run.resolve(need)).selection.imageUrl, 'https://photos.example/solar.png')
})

test('intent changes invalidate selection; the same query cannot pin an old image', async t => {
  const f = service(t), [need] = await f.run.stage(outlineImageNeeds(outline))
  await f.run.select(need.needId, need.candidates[1].candidateId, 'Panels match')
  const changed = structuredClone(outline)
  changed.slides[0].blocks.push({ kind: 'bullets', items: ['New slide context'] })
  assert.notEqual(outlineImageNeeds(changed)[0].needId, need.needId)
  changed.slides[0].blocks.pop()
  changed.slides[0].blocks[0].intent.role = 'Show solar cell manufacturing'
  const [replacement] = await f.run.stage(outlineImageNeeds(changed))
  assert.notEqual(replacement.needId, need.needId)
  await assert.rejects(f.run.resolve(replacement), { code: 'RESEARCH_IMAGE_SELECTION_REQUIRED' })
  await assert.rejects(f.run.select(need.needId, need.candidates[0].candidateId, 'Stale'), { code: 'RESEARCH_IMAGE_ARGUMENTS_INVALID' })
})

test('two image roles with the same query stay distinct and duplicate image bytes are rejected', async t => {
  const f = service(t), pair = structuredClone(outline)
  pair.slides[0].blocks.push({ ...pair.slides[0].blocks[0], caption: 'A second view' })
  const needs = await f.run.stage(outlineImageNeeds(pair))
  assert.notEqual(needs[0].needId, needs[1].needId)
  await f.run.select(needs[0].needId, needs[0].candidates[1].candidateId, 'Solar view')
  await assert.rejects(f.run.select(needs[1].needId, needs[1].candidates[0].candidateId, 'Another view'), { code: 'RESEARCH_IMAGE_DUPLICATE' })
  await assert.rejects(f.run.resolve(needs[1]), { code: 'RESEARCH_IMAGE_DUPLICATE' })
})

test('unknown licences are blocked in reviewed plans; failed selections do not choose alternatives', async t => {
  const f = service(t, [{ ...candidates[0], credit: { ...credit, license: 'unknown', unknownLicense: true } }])
  const [need] = await f.run.stage(outlineImageNeeds(outline))
  await assert.rejects(f.run.select(need.needId, need.candidates[0].candidateId, 'Relevant'), { code: 'RESEARCH_IMAGE_LICENSE_REQUIRED' })
  assert.equal(f.downloads.length, 0)
})

test('licence evidence must identify the exact image and an accepted licence', () => {
  const html = object => `<script type="application/ld+json">${JSON.stringify(object)}</script>`
  const item = { '@type': 'ImageObject', contentUrl: 'https://photos.example/solar.png', creator: { name: 'Author' }, license: credit.licenseUrl }
  assert.equal(imagePageCredit(html(item), item.contentUrl, credit.url).license, 'CC BY')
  assert.equal(imagePageCredit(html({ ...item, contentUrl: 'https://photos.example/other.png' }), item.contentUrl, credit.url), undefined)
  assert.equal(imagePageCredit(html({ ...item, license: 'https://creativecommons.org/licenses/by-sa/4.0/' }), item.contentUrl, credit.url), undefined)
  assert.equal(imagePageCredit(html({ ...item, '@type': 'Article' }), item.contentUrl, credit.url), undefined)
})

test('a top-level Pexels stock image resolves its source and retains its platform licence without scraping a blocked page', async t => {
  const reads = []
  const images = new WebImageResearch({ imageSearch: async () => [] }, { candidates: async () => [] }, {
    read: async (url, _signal, _limit, types) => {
      reads.push(url)
      assert.ok(types.includes('image/jpeg'), 'Only the public stock asset is downloaded')
      return png
    },
  })
  t.after(() => images.close())
  const result = await images.prepare({
    candidateId: 'captured-pexels', imageUrl: 'https://images.pexels.com/photos/12067501/pexels-photo-12067501.jpeg',
    title: '', description: 'Green tree canopy',
  }, AbortSignal.timeout(5000))
  assert.equal(result.credit.license, 'Pexels')
  assert.equal(result.credit.url, 'https://www.pexels.com/photo/12067501/')
  assert.equal(result.credit.licenseUrl, 'https://www.pexels.com/license/')
  assert.equal(result.credit.evidence, 'pexels-cdn')
  assert.equal(reads.length, 1)
})

test('private addresses, mixed DNS answers and redirects into private networks are refused before connection', async () => {
  let calls = 0
  const reader = new PublicImageReader(async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/internal' } }) },
    async host => host === 'mixed.example' ? [{ address: '8.8.8.8', family: 4 }, { address: '10.1.1.1', family: 4 }] : [{ address: '8.8.8.8', family: 4 }])
  for (const url of ['https://127.1/x', 'https://[::ffff:127.0.0.1]/x', 'https://mixed.example/x', 'http://8.8.8.8/x', 'https://u:p@8.8.8.8/x'])
    await assert.rejects(reader.read(url, AbortSignal.timeout(1000), 100, ['image/png']), { code: 'RESEARCH_IMAGE_UNAVAILABLE' })
  assert.equal(calls, 0)
  await assert.rejects(reader.read('https://public.example/x', AbortSignal.timeout(1000), 100, ['image/png']), { code: 'RESEARCH_IMAGE_UNAVAILABLE' })
  assert.equal(calls, 1)
})

test('image attempts persist through restart and cannot be borrowed by another chat', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'image-budget-'))
  let decks = new DeckService(join(dir, 'deck.sqlite'))
  t.after(async () => { decks.close(); await rm(dir, { recursive: true, force: true }) })
  for (let i = 0; i < 5; i++) decks.reserveImageSearch('chat', 'request')
  decks.close()
  decks = new DeckService(join(dir, 'deck.sqlite'))
  assert.throws(() => decks.reserveImageSearch('chat', 'request'), { code: 'RESEARCH_IMAGE_BUDGET' })
  assert.throws(() => decks.reserveImageSearch('other-chat', 'request'), { code: 'RESEARCH_IMAGE_BUDGET' })
})

test('unchanged reviewed images are retained offline while replacement excludes prior URLs and bytes', async t => {
  const f = service(t), [need] = outlineImageNeeds(outline)
  const prior = { needId: need.needId, slideIndex: 0, blockIndex: 0, required: true, status: 'prepared', digest,
    selection: { provider: 'commons', query: 'energy', imageUrl: candidates[1].imageUrl, reason: 'Panels', description: 'Panels', evidence: 'metadata', policy: 'web-images-v1' } }
  let searches = 0
  const saved = { ...prepared, selection: prior.selection }
  const retained = f.images.open(AbortSignal.timeout(5000), () => { searches++ }, [prior], async () => saved)
  const [state] = await retained.stage([need])
  assert.equal(state.status, 'prepared')
  assert.equal(searches, 0)
  assert.equal((await retained.resolve(need)).parsedDigest, digest)
  const replacementOutline = structuredClone(outline)
  replacementOutline.slides[0].blocks[0].replace = true
  const [replacement] = await retained.stage(outlineImageNeeds(replacementOutline))
  assert.equal(searches, 1)
  assert.deepEqual(replacement.candidates.map(c => c.imageUrl), [candidates[0].imageUrl])
  await assert.rejects(retained.select(replacement.needId, replacement.candidates[0].candidateId, 'Alternative'), { code: 'RESEARCH_IMAGE_DUPLICATE' })
})

test('Stop while DNS is pending exits promptly and never connects', async () => {
  let calls = 0
  const reader = new PublicImageReader(async () => { calls++; throw new Error('No connection expected') }, () => new Promise(() => {}))
  const controller = new AbortController()
  const pending = reader.read('https://public.example/image.png', controller.signal, 100, ['image/png'])
  controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(calls, 0)
})

test('oversized or invalid content types fail without returning image bytes', async () => {
  for (const response of [new Response('not an image', { headers: { 'content-type': 'text/html' } }),
    new Response('too large', { headers: { 'content-type': 'image/png' } })]) {
    const reader = new PublicImageReader(async () => response, async () => [{ address: '8.8.8.8', family: 4 }])
    await assert.rejects(reader.read('https://public.example/image.png', AbortSignal.timeout(1000), 2, ['image/png']), { code: 'RESEARCH_IMAGE_UNAVAILABLE' })
  }
})

test('Stop after an image download starts prevents a completed selection from becoming available', async t => {
  let release
  const pending = new Promise(resolve => { release = resolve })
  const images = new WebImageResearch({ imageSearch: async () => [] }, {
    candidates: async () => candidates, prepare: async () => { await pending; return prepared },
  })
  t.after(() => images.close())
  const controller = new AbortController(), run = images.open(controller.signal, () => {})
  const [need] = await run.stage(outlineImageNeeds(outline))
  const selecting = run.select(need.needId, need.candidates[1].candidateId, 'Panels')
  controller.abort()
  release()
  await assert.rejects(selecting, { name: 'AbortError' })
  await assert.rejects(run.resolve(need), { name: 'AbortError' })
})

test('schema 8 migration preserves the exact legacy prepared-image payload', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'image-migration-')), path = join(dir, 'deck.sqlite')
  let decks = new DeckService(path)
  decks.close()
  const old = new DatabaseSync(path)
  old.exec('ALTER TABLE prepared_images RENAME COLUMN image_key TO query; DROP TABLE image_search_attempts; PRAGMA user_version=8; PRAGMA foreign_keys=OFF')
  const payload = '{"query":"forest","failure":"ARTIFACT_ASSET_UNAVAILABLE"}'
  old.prepare('INSERT INTO prepared_images VALUES(?,?,?,?)').run('chat', 'outline', 'forest', payload)
  // The migration verifies foreign keys, so also provide a valid historical Outline parent.
  old.prepare('INSERT INTO outline_proposals VALUES(?,?,?,?,?,?,?)').run('chat', 'outline', 1, 'request', 1, '{}', 0)
  old.close()
  decks = new DeckService(path)
  t.after(async () => { decks.close(); await rm(dir, { recursive: true, force: true }) })
  const db = new DatabaseSync(path)
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 9)
  assert.equal(db.prepare('SELECT payload FROM prepared_images WHERE image_key=?').get('forest').payload, payload)
  db.close()
})
