import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DeckStore, validateBriefDraft, briefJsonSchema } from '../lib/index.js'
import { DatabaseSync } from 'node:sqlite'

import { brief } from './fixtures/brief.mjs'

test('Brief validation reports every independent field error without guessing omitted answers', () => {
  const input = {
    ...brief(),
    proposedSlideCount: 7,
    template: { id: 'html-basic', version: 2 },
    requestedFormat: 'HTML',
    durationMinutes: null,
    themeOverrides: null,
  }
  assert.throws(
    () => validateBriefDraft(input),
    error => {
      assert.equal(error.code, 'BRIEF_INVALID')
      assert.deepEqual(
        new Set(error.issues.map(issue => issue.path)),
        new Set(['requestedFormat', 'durationMinutes', 'themeOverrides']),
      )
      assert.ok(error.issues.every(issue => issue.message && issue.expected))
      return true
    },
  )
  assert.equal(input.requestedFormat, 'HTML')
  assert.equal(input.durationMinutes, null)
  const corrected = { ...input, requestedFormat: 'html' }
  delete corrected.durationMinutes
  delete corrected.themeOverrides
  const accepted = validateBriefDraft(corrected)
  assert.equal(accepted.proposedSlideCount, 7)
  assert.equal(accepted.durationMinutes, undefined)
  assert.equal(accepted.sources.publicResearch, false)
})

test('the public browser-safe Brief contract reports nested fields and never echoes rejected values', () => {
  const input = {
    ...brief(),
    requirements: [''],
    answers: [{ topic: 'wrong-topic', value: 'private-value-do-not-echo' }],
    sources: { ...brief().sources, publicResearch: 'private-value-do-not-echo' },
    themeOverrides: { 'color.accent': 'private-value-do-not-echo' },
  }
  assert.equal(briefJsonSchema.properties.durationMinutes.type, 'number')
  assert.equal(briefJsonSchema.properties.generationFormat.const, 'html')
  assert.equal(briefJsonSchema.required.includes('durationMinutes'), false)
  assert.equal(briefJsonSchema.additionalProperties, false)
  assert.equal(
    new RegExp(briefJsonSchema.properties.themeOverrides.properties['color.accent'].pattern).test('#AABBCC'),
    true,
  )
  assert.throws(
    () => validateBriefDraft(input),
    error => {
      const paths = error.issues.map(i => i.path)
      for (const path of [
        'requirements[0]',
        'answers[0].topic',
        'sources.publicResearch',
        'themeOverrides["color.accent"]',
      ])
        assert.ok(paths.includes(path), JSON.stringify(paths))
      assert.equal(JSON.stringify(error.issues).includes('private-value-do-not-echo'), false)
      return true
    },
  )
})

test('Brief diagnostics collect independent catalog and theme failures alongside structural errors', () => {
  assert.throws(
    () =>
      validateBriefDraft({
        ...brief(),
        requestedFormat: 'HTML',
        durationMinutes: null,
        template: { id: 'missing-template', version: 1 },
        designSystem: { id: 'missing-system', version: 1 },
        themeOverrides: { 'color.accent': 'invalid', 'font.body': 'Unavailable font' },
      }),
    error => {
      const paths = new Set(error.issues.map(i => i.path))
      for (const path of [
        'requestedFormat',
        'durationMinutes',
        'template',
        'designSystem',
        'themeOverrides["color.accent"]',
        'themeOverrides["font.body"]',
      ])
        assert.ok(paths.has(path), JSON.stringify([...paths]))
      return true
    },
  )
})

test('Brief versions preserve explicit source choices and isolate immutable history by Chat across restart', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deckagent-brief-'))
  let deck = new DeckStore(join(dir, 'decks.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.equal(deck.briefSnapshot('a').current, null)
  const input = brief()
  const first = deck.saveBrief('a', { expectedVersion: 0, draft: input })
  input.sources.publicResearch = true
  assert.equal(first.draft.sources.publicResearch, false)
  assert.equal(deck.briefSnapshot('b').current, null)
  assert.throws(() => deck.saveBrief('a', { expectedVersion: 0, draft: input }), { code: 'BRIEF_STALE' })
  const next = deck.saveBrief('a', { expectedVersion: 1, draft: input })
  assert.equal(next.briefId, first.briefId)
  assert.equal(next.version, 2)
  deck.close()
  deck = new DeckStore(join(dir, 'decks.sqlite'))
  assert.equal(deck.briefSnapshot('a').current.draft.sources.publicResearch, true)
  assert.equal(deck.briefVersion('a', first.briefId, 1).draft.sources.publicResearch, false)
  assert.throws(() => deck.briefVersion('b', first.briefId, 1), { code: 'BRIEF_NOT_FOUND' })
  deck.confirm('a', { outlineId: 'confirmed', slides: [{ slideId: 's1', title: 'Title' }] })
  assert.throws(() => deck.saveBrief('a', { expectedVersion: 2, draft: brief() }), { code: 'BRIEF_LOCKED' })
})

test('invalid Brief updates roll back, partial collecting state remains partial, and unsupported format is preserved', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-validate-'))
  const deck = new DeckStore(join(dir, 'decks.sqlite'))
  t.after(async () => {
    deck.close()
    await rm(dir, { recursive: true, force: true })
  })
  const partial = {
    requirements: [],
    assumptions: [],
    answers: [],
    sources: { material: false, modelKnowledge: false, publicResearch: false, refs: [] },
    images: { mode: 'none', attachmentIds: [], unmetRequirements: [] },
  }
  const first = deck.saveBrief('chat', { expectedVersion: 0, draft: partial })
  assert.equal(first.design, null)
  assert.equal(first.draft.topic, undefined)
  for (const invalid of [
    { ...partial, sources: { ...partial.sources, modelKnowledge: 'yes' } },
    {
      ...partial,
      answers: [
        { topic: 'sources', value: 'No' },
        { topic: 'sources', value: 'Yes' },
      ],
    },
    { ...partial, requestedFormat: 'pptx', generationFormat: 'html' },
    { ...partial, topic: 'x'.repeat(128 * 1024) },
    { ...partial, secret: 'unknown property' },
    { ...partial, template: null },
    { ...partial, themeOverrides: null },
    { ...partial, images: { mode: 'unavailable', attachmentIds: [], unmetRequirements: [] } },
  ])
    assert.throws(() => deck.saveBrief('chat', { expectedVersion: 1, draft: invalid }))
  assert.deepEqual(deck.briefSnapshot('chat').current, first)
  const next = deck.saveBrief('chat', { expectedVersion: 1, draft: { ...partial, requestedFormat: 'pptx' } })
  assert.equal(next.design, null)
  assert.equal(next.draft.generationFormat, undefined)
})

test('v2 migration preserves published Deck and Outline without inventing a Brief or changing history', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-v2-'))
  const path = join(dir, 'decks.sqlite')
  const db = new DatabaseSync(path)
  db.exec(await readFile(new URL('./fixtures/deck-v1.sql', import.meta.url), 'utf8'))
  db.exec(`CREATE TABLE outline_heads(session_id TEXT PRIMARY KEY,version INTEGER NOT NULL,current_id TEXT,confirmed_id TEXT) STRICT;
    CREATE TABLE outline_proposals(session_id TEXT NOT NULL,outline_id TEXT NOT NULL,version INTEGER NOT NULL,request_id TEXT NOT NULL,response_index INTEGER NOT NULL,payload TEXT NOT NULL,cancelled INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(session_id,outline_id),UNIQUE(session_id,version),UNIQUE(session_id,request_id)) STRICT;
    PRAGMA user_version=2;`)
  db.prepare('INSERT INTO outline_heads VALUES(?,?,?,NULL)').run('review', 1, 'proposal')
  const outline = { overview: 'Saved outline', slides: [{ title: 'Intro', content: 'Keep this text' }] }
  db.prepare('INSERT INTO outline_proposals VALUES(?,?,?,?,?,?,0)').run(
    'review',
    'proposal',
    1,
    'request',
    1,
    JSON.stringify(outline),
  )
  db.close()
  const deck = new DeckStore(path)
  t.after(async () => {
    deck.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.equal(deck.content('legacy', 'intro', 1).html, '<h1>Legacy content</h1>')
  assert.equal(deck.outlineSnapshot('review').proposals[0].slides[0].content, 'Keep this text')
  assert.equal(deck.briefSnapshot('review').current, null)
  assert.equal(deck.briefSnapshot('legacy').current, null)
  assert.equal(deck.briefSnapshot('legacy').locked, true)
  deck.saveBrief('review', { expectedVersion: 0, draft: brief() })
  assert.equal(deck.outlineSnapshot('review').currentId, 'proposal')
})

test('persisted theme corruption is reported without repairing historical content', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'brief-corrupt-'))
  const path = join(dir, 'decks.sqlite')
  let deck = new DeckStore(path)
  deck.saveBrief('chat', { expectedVersion: 0, draft: brief() })
  deck.close()
  const db = new DatabaseSync(path)
  db.exec(`UPDATE brief_versions SET design=json_set(design,'$.theme."type.body"',99)`)
  db.close()
  deck = new DeckStore(path)
  t.after(async () => {
    deck.close()
    await rm(dir, { recursive: true, force: true })
  })
  assert.throws(() => deck.briefSnapshot('chat'), { code: 'DECK_CORRUPT' })
})
