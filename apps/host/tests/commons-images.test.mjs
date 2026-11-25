import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { CommonsImages } from '../lib/types/integrations/images/index.js'

const png = await readFile(new URL('../../../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url))
const page = (license, url = 'https://upload.wikimedia.org/wikipedia/commons/example.png') => ({
  title: 'File:Example.png',
  imageinfo: [
    {
      thumburl: url,
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.png',
      extmetadata: {
        Artist: { value: 'Example author' },
        LicenseShortName: { value: license },
        LicenseUrl: { value: license === 'CC BY 4.0' ? 'https://creativecommons.org/licenses/by/4.0/' : '' },
      },
    },
  ],
})

test('public images retain attribution, use only fixed Commons hosts and reject disallowed licences', async t => {
  const seen = []
  const images = new CommonsImages(async (url, options) => {
    seen.push({ url: String(url), options })
    return String(url).startsWith('https://commons.wikimedia.org/w/api.php?')
      ? Response.json({ query: { pages: [page('CC BY-NC 4.0'), page('CC BY 4.0')] } })
      : new Response(png, { headers: { 'content-type': 'image/png' } })
  })
  t.after(() => images.close())
  const result = await images.find('solar energy', new AbortController().signal)
  assert.equal(result.credit.license, 'CC BY')
  assert.equal(result.credit.author, 'Example author')
  assert.equal(result.credit.unknownLicense, false)
  assert.equal(result.bytes.readUInt32BE(0), 0x89504e47)
  assert.equal(seen.length, 2)
  assert.ok(seen.every(({ options }) => !new Headers(options.headers).has('authorization')))
})

test('known prohibited licences and unsafe image destinations are not fetched', async t => {
  let calls = 0
  const images = new CommonsImages(async () => {
    calls++
    return Response.json({ query: { pages: [page('CC BY-SA 4.0'), page('CC BY 4.0', 'http://127.0.0.1/private')] } })
  })
  t.after(() => images.close())
  await assert.rejects(images.find('solar', new AbortController().signal), { code: 'RESEARCH_IMAGE_UNAVAILABLE' })
  assert.equal(calls, 1)
})

test('unknown licences remain explicitly unknown rather than being reported as accepted', async t => {
  const images = new CommonsImages(async url =>
    String(url).includes('/w/api.php?')
      ? Response.json({ query: { pages: [page('')] } })
      : new Response(png, { headers: { 'content-type': 'image/png' } }),
  )
  t.after(() => images.close())
  assert.equal((await images.find('solar', new AbortController().signal)).credit.unknownLicense, true)
})

test('Commons thumbnail host is accepted and contradictory prohibited licence metadata is rejected', async t => {
  const prohibited = page('CC BY-SA 4.0')
  prohibited.imageinfo[0].extmetadata.LicenseUrl.value = 'https://creativecommons.org/publicdomain/zero/1.0/'
  const seen = []
  const images = new CommonsImages(async url => {
    seen.push(String(url))
    return String(url).includes('/w/api.php?')
      ? Response.json({
          query: {
            pages: [prohibited, page('CC BY 4.0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/example.png')],
          },
        })
      : new Response(png, { headers: { 'content-type': 'image/png' } })
  })
  t.after(() => images.close())
  assert.equal((await images.find('solar', new AbortController().signal)).credit.license, 'CC BY')
  assert.ok(seen[1].startsWith('https://thumb.wikimedia.org/'))
})
