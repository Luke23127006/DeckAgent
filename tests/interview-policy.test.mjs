import assert from 'node:assert/strict'
import test from 'node:test'
import { interviewState, skipInterview } from '../packages/presentation/deck/lib/index.js'

test('skip keeps unknown topic and sources blocked, records assumptions, and preserves unavailable format/images', () => {
  const empty = {
    requirements: ['Keep the user requirement'],
    answers: [],
    assumptions: [],
    sources: { material: false, modelKnowledge: false, publicResearch: false, refs: [] },
    images: { mode: 'none', attachmentIds: [], unmetRequirements: [] },
  }
  assert.equal(interviewState(empty).questions.length, 10)
  const skipped = skipInterview(empty)
  assert.equal(skipped.topic, undefined)
  assert.deepEqual(
    interviewState(skipped).questions.map(q => q.topic),
    ['topic', 'sources'],
  )
  assert.deepEqual(skipped.requirements, empty.requirements)
  assert.equal(skipped.sources.modelKnowledge, false)
  assert.equal(skipped.sources.publicResearch, false)
  assert.ok(
    interviewState({
      ...skipped,
      sources: { ...skipped.sources, material: true },
      images: { mode: 'attachments', attachmentIds: [], unmetRequirements: [] },
    }).blockers.some(b => b.code === 'IMAGES_UNAVAILABLE'),
  )
  const unsupported = skipInterview({
    ...empty,
    topic: 'Climate',
    requestedFormat: 'pptx',
    images: { mode: 'unavailable', attachmentIds: [], unmetRequirements: ['Generate a new photo'] },
  })
  assert.equal(unsupported.requestedFormat, 'pptx')
  assert.equal(unsupported.generationFormat, undefined)
  assert.equal(unsupported.images.mode, 'unavailable')
  assert.deepEqual(
    interviewState(unsupported, true).blockers.map(b => b.code),
    ['SOURCE_CHOICE_REQUIRED', 'FORMAT_UNAVAILABLE', 'IMAGES_UNAVAILABLE', 'SOURCE_UNAVAILABLE'],
  )
})
