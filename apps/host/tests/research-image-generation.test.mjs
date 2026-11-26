import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckStore } from '@deckagent/deck'
import { DeckClient } from '../../web/tests/fixtures/browser-driver.mjs'
import { startApp, MemoryCredentials, finished, runs } from './fixtures/b02-helpers.mjs'
import { brief } from '../../../packages/presentation/deck/tests/fixtures/brief.mjs'

test('web-image generation saves attribution and separate presenter notes, then reopens offline without replay', {
  timeout: 60000,
}, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'web-image-generation-'))
  const credentials = new MemoryCredentials()
  const png = await readFile(
    new URL('../../../packages/tools/filesystem/tests/fixtures/attachments/sample.png', import.meta.url),
  )
  let offline = false
  let imageCalls = 0
  const options = {
    credentials,
    options: {
      providerAccess: { check: async () => {}, catalog: async () => ['model-a'] },
      imageAccess: {
        fetch: async url => {
          assert.equal(offline, false, 'Saved slides must not fetch their web images again')
          imageCalls++
          if (String(url).startsWith('https://commons.wikimedia.org/w/api.php?')) {
            assert.equal(new URL(url).searchParams.get('gsrsearch'), 'solar energy filetype:bitmap')
            return Response.json({
              query: {
                pages: [
                  {
                    imageinfo: [
                      {
                        thumburl: 'https://upload.wikimedia.org/wikipedia/commons/fixture.png',
                        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Fixture.png',
                        extmetadata: {
                          Artist: { value: 'Fixture photographer' },
                          LicenseShortName: { value: 'CC BY 4.0' },
                          LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' },
                        },
                      },
                    ],
                  },
                ],
              },
            })
          }
          assert.equal(String(url), 'https://upload.wikimedia.org/wikipedia/commons/fixture.png')
          return new Response(png, { headers: { 'content-type': 'image/png' } })
        },
      },
    },
  }
  let f = await startApp(dir, options)
  t.after(async () => {
    await f.app.close()
    await rm(dir, { recursive: true, force: true })
  })
  await f.call('providers/test', 'PUT', {
    displayName: 'Fixture',
    protocol: 'chat-completions',
    baseUrl: 'http://127.0.0.1:1/v1',
    key: 'fixture',
    models: ['model-a'],
    new: true,
    expectedVersion: (await f.call('settings')).data.providersVersion,
  })
  const id = (await f.call('sessions', 'POST', { selection: { provider: 'test', model: 'model-a' } })).data.sessionId
  const decks = new DeckStore(join(dir, 'data', 'db', 'decks.sqlite'))
  const b = decks.saveBrief(id, {
    expectedVersion: 0,
    draft: {
      ...brief(),
      proposedSlideCount: 1,
      purpose: 'Explain',
      presenterNotes: true,
      answers: [{ topic: 'images', value: 'Use public Commons images' }],
      sources: { material: false, modelKnowledge: true, publicResearch: false, refs: [] },
      images: { mode: 'public-research', attachmentIds: [], unmetRequirements: [] },
    },
  })
  const outline = decks.proposeBoundOutline(id, {
    requestId: 'review',
    responseIndex: 1,
    expectedOutline: null,
    expectedBrief: { briefId: b.briefId, version: b.version },
    draft: {
      overview: 'Solar',
      revisionSuggestions: [],
      slides: [
        {
          title: 'Solar',
          content: 'Explain',
          blocks: [
            { kind: 'bullets', items: ['Explain'] },
            { kind: 'web-image', query: 'solar energy', required: true },
          ],
          sources: [],
        },
      ],
    },
  })
  decks.close()
  await writeFile(`${f.log}.generation.json`, '{}')
  const result = await f.call(`sessions/${id}/deck/confirm`, 'POST', {
    confirmationId: 'solar',
    outlineId: outline.outlineId,
    outlineVersion: 1,
    briefId: b.briefId,
    briefVersion: 1,
  })
  assert.equal(result.status, 200, JSON.stringify(result.data))
  const events = await finished(f.client, result.data.request.requestId)
  assert.equal(events.at(-1).status, 'completed', JSON.stringify(events))
  const client = new DeckClient(f.app.origin, f.app.token)
  const slide = (await client.snapshot(id)).slides[0]
  const content = await client.content(id, slide.slideId, 1)
  assert.match(content.html, /data:image\/png;base64,/)
  assert.equal(content.imageCredits[0].author, 'Fixture photographer')
  assert.equal(content.imageCredits[0].license, 'CC BY')
  assert.deepEqual(content.imageOmissions, [])
  assert.match(content.notes, /Present Solar/)
  assert.equal(content.html.includes(content.notes), false)
  assert.ok(events.some(e => e.kind === 'text' && e.text.includes('Fixture photographer') && e.text.includes('CC BY')))
  assert.equal(imageCalls, 2)
  const before = runs(f.log).length
  await f.app.close()
  offline = true
  f = await startApp(dir, options)
  const reopened = new DeckClient(f.app.origin, f.app.token)
  assert.deepEqual(await reopened.content(id, slide.slideId, 1), content)
  assert.equal(runs(f.log).length, before)
  assert.equal(imageCalls, 2)
})
