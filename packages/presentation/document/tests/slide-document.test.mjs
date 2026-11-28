import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeSlideDocument, documentText } from '../lib/index.js'

test('portable slide content roundtrips independently of HTML and rejects native fields or duplicate nodes', () => {
  const document = {
    schemaVersion: 1,
    slideId: 'slide-test',
    title: 'Environment',
    layoutIntent: 'two-column',
    nodes: [
      { id: 'point-one', kind: 'bullets', items: ['Protect forests', 'Reduce waste'] },
      { id: 'picture', kind: 'image', assetId: 'asset-image', caption: 'Forest' },
    ],
    provenance: [],
    notes: 'Explain each action.',
  }
  assert.deepEqual(decodeSlideDocument(document), document)
  assert.deepEqual(documentText(document), ['Environment', 'Protect forests', 'Reduce waste', 'Forest'])
  for (const broken of [
    { ...document, html: '<h1>Hidden native dependency</h1>' },
    { ...document, nodes: [...document.nodes, document.nodes[0]] },
    { ...document, nodes: [{ id: 'image', kind: 'image', query: 'forest' }] },
  ])
    assert.throws(() => decodeSlideDocument(broken), { code: 'SLIDE_DOCUMENT_INVALID' })
})
