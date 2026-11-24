import assert from 'node:assert/strict'
import test from 'node:test'
import { HtmlFormatAdapter } from '../lib/index.js'
import { resolveDesign } from '@deckagent/design'

test('executable HTML templates preserve portable content and validate against the shipped policy', async () => {
  const html = new HtmlFormatAdapter()
  for (const layoutId of ['cover', 'section', 'title-body', 'two-column', 'key-figures', 'image-text', 'image-pair']) {
    const document = {
      schemaVersion: 1,
      slideId: 'slide-template',
      title: 'Environment',
      layoutIntent: layoutId,
      nodes:
        layoutId === 'two-column'
          ? [{ id: 'columns', kind: 'columns', columns: [{ bullets: ['Forest'] }, { bullets: ['Ocean'] }] }]
          : [{ id: 'body', kind: 'bullets', items: ['Forest', 'Ocean'] }],
      provenance: [],
    }
    const context = {
      design: resolveDesign({ template: { id: 'html-basic', version: 2 } }),
      layoutId,
      document,
      assets: [],
    }
    const draft = html.context(context)
    const built = await html.build(draft.starter, context)
    assert.equal(built.descriptor.format, 'html')
    assert.match(built.preview, /Environment/)
    assert.match(built.preview, /Forest/)
  }
  const context = { design: resolveDesign(), layoutId: 'title-body', assets: [] }
  await assert.rejects(
    async () => html.build('<h1 style="border:1px solid red">Bad</h1>', context),
    error => error.code === 'ARTIFACT_UNSAFE_CSS' && error.issues.some(i => i.path.includes('border')),
  )
})

test('a second executable template consumes the same document contract without changing the workflow', async () => {
  const document = {
    schemaVersion: 1,
    slideId: 'second-template',
    title: 'Environment',
    layoutIntent: 'title-body',
    nodes: [{ id: 'body', kind: 'bullets', items: ['Forest', 'Ocean'] }],
    provenance: [],
  }
  const template = {
    id: 'html-compact-proof',
    version: 1,
    style: '.da-slide{display:flex;flex-direction:column;gap:12px}.da-body{display:block}',
  }
  const html = new HtmlFormatAdapter(template)
  const context = {
    design: { ...resolveDesign(), template: { id: template.id, version: template.version } },
    layoutId: 'title-body',
    document,
    assets: [],
  }
  assert.match(html.build(html.context(context).starter, context).preview, /gap:12px/)
  assert.throws(() => html.build(html.context(context).starter, { ...context, design: resolveDesign() }), {
    code: 'FORMAT_TEMPLATE_UNAVAILABLE',
  })
  assert.throws(
    () => html.build(html.context(context).starter.replace('Forest', 'Changed'), context),
    error => error.code === 'ARTIFACT_REQUIRED_CONTENT_MISSING' && error.issues[0].path === 'document.body',
  )
  assert.throws(() => html.build(html.context(context).starter + '<p>Unrecorded assertion</p>', context), {
    code: 'ARTIFACT_UNRECORDED_CONTENT',
  })
})
