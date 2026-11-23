import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeDesignSnapshot,
  findCompatibleLayouts,
  resolveDesign,
} from '../packages/presentation/design/lib/index.js'

test('each catalog layout admits its content at capacity and refuses excess or duplicate blocks', () => {
  const image = { kind: 'image', attachmentId: 'att-00000000-0000-0000-0000-000000000001', caption: 'c'.repeat(160) }
  const cases = [
    ['cover', [{ kind: 'subtitle', text: 's'.repeat(160) }], [{ kind: 'subtitle', text: 's'.repeat(161) }]],
    ['section', [{ kind: 'lead', text: 'l'.repeat(240) }], [{ kind: 'lead', text: 'l'.repeat(241) }]],
    [
      'title-body',
      [{ kind: 'bullets', items: Array(5).fill('b'.repeat(140)) }],
      [{ kind: 'bullets', items: Array(6).fill('b') }],
    ],
    [
      'two-column',
      [{ kind: 'columns', columns: Array.from({ length: 2 }, () => ({ bullets: Array(3).fill('b'.repeat(120)) })) }],
      [{ kind: 'columns', columns: Array.from({ length: 3 }, () => ({ bullets: ['b'] })) }],
    ],
    [
      'key-figures',
      [
        { kind: 'metrics', items: Array.from({ length: 3 }, () => ({ value: 'v'.repeat(24), label: 'l'.repeat(80) })) },
        { kind: 'source-note', text: 'n'.repeat(160) },
      ],
      [{ kind: 'metrics', items: Array.from({ length: 4 }, () => ({ value: '1', label: 'label' })) }],
    ],
    [
      'image-text',
      [image, { kind: 'bullets', items: Array(3).fill('b'.repeat(140)) }],
      [
        { ...image, caption: 'c'.repeat(161) },
        { kind: 'bullets', items: ['b'] },
      ],
    ],
  ]
  for (const [id, blocks, excess] of cases) {
    assert.deepEqual(
      findCompatibleLayouts({ title: 't'.repeat(80), blocks }, { id: 'html-basic', version: 2 }).candidates.map(
        x => x.id,
      ),
      [id],
    )
    for (const plan of [
      { title: 't'.repeat(81), blocks },
      { title: 't', blocks: excess },
      { title: 't', blocks: [...blocks, ...blocks] },
    ])
      assert.equal(findCompatibleLayouts(plan, { id: 'html-basic', version: 2 }).fallbackAllowed, true, id)
  }
  assert.throws(() => findCompatibleLayouts({ title: 't', blocks: [{ kind: 'bullets', items: [] }] }), {
    code: 'DESIGN_CONTENT_INVALID',
  })
})

test('snapshot round trips preserve overrides without applying catalog defaults and detect tampering', () => {
  const snapshot = resolveDesign({ overrides: { 'type.body': 28, 'color.accent': '#112233' } })
  assert.deepEqual(decodeDesignSnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot)
  assert.equal(resolveDesign().theme['type.body'], 24)
  assert.throws(() => decodeDesignSnapshot({ ...snapshot, theme: { ...snapshot.theme, 'type.body': 30 } }), {
    code: 'DESIGN_SNAPSHOT_INVALID',
  })
  assert.throws(() => resolveDesign({ template: { id: 'html-basic', version: 99 } }), {
    code: 'DESIGN_TEMPLATE_NOT_FOUND',
  })
  assert.throws(() => resolveDesign({ designSystem: { id: 'missing', version: 1 } }), {
    code: 'DESIGN_SYSTEM_NOT_FOUND',
  })
  for (const value of [null, -1, 0, NaN, Infinity])
    assert.throws(() => resolveDesign({ overrides: { 'type.body': value } }), { code: 'DESIGN_THEME_INVALID' })
})

test('offline catalog resolves accepted defaults and retains an immutable effective snapshot', async () => {
  const { resolveDesign, listDesignSystems, listTemplates } = await import(
    '../packages/presentation/design/lib/index.js'
  )
  const selection = { format: 'html', overrides: { 'color.accent': '#CC3311' } }
  const snapshot = resolveDesign(selection)
  assert.equal(snapshot.designSystem.id, 'deckagent-neutral')
  assert.equal(snapshot.template.id, 'html-basic')
  assert.equal(snapshot.theme['color.accent'], '#CC3311')
  assert.equal(snapshot.theme['type.body'], 24)
  assert.equal(snapshot.viewport.width, 1280)
  assert.equal(snapshot.viewport.height, 720)
  selection.overrides['color.accent'] = '#000000'
  assert.equal(snapshot.theme['color.accent'], '#CC3311')
  assert.ok(Object.isFrozen(snapshot.theme))
  assert.equal(listDesignSystems()[0].theme['color.accent'], '#2563EB')
  assert.equal(listTemplates('html')[0].layouts.length, 7)
  assert.equal(listTemplates('html').find(t => t.version === 1).layouts.length, 6)
  assert.equal(snapshot.template.version, 3)
  assert.throws(() => resolveDesign({ format: 'pptx' }), { code: 'DESIGN_FORMAT_UNAVAILABLE' })
  assert.throws(() => resolveDesign({ format: 'html', template: { id: 'missing', version: 1 } }), {
    code: 'DESIGN_TEMPLATE_NOT_FOUND',
  })
})

test('layout candidates count actual Unicode content and allow fallback only when no built-in fits', async () => {
  const design = await import('../packages/presentation/design/lib/index.js')
  const plan = { title: 'Tiêu đề', blocks: [{ kind: 'bullets', items: ['😀'.repeat(140)] }] }
  assert.deepEqual(
    design.findCompatibleLayouts(plan).candidates.map(x => x.id),
    ['title-body'],
  )
  assert.throws(() => design.resolveLayout(plan, 'custom'), { code: 'DESIGN_LAYOUT_INCOMPATIBLE' })
  const tooLong = { ...plan, blocks: [{ kind: 'bullets', items: ['😀'.repeat(141)] }] }
  assert.equal(design.findCompatibleLayouts(tooLong).fallbackAllowed, false)
  assert.throws(() => design.resolveLayout(tooLong, 'custom'), { code: 'DESIGN_LAYOUT_INCOMPATIBLE' })
  assert.equal(design.findCompatibleLayouts(tooLong, { id: 'html-basic', version: 2 }).fallbackAllowed, true)
  assert.equal(design.resolveLayout(tooLong, 'custom', { id: 'html-basic', version: 2 }).kind, 'custom')
  assert.throws(() => design.resolveLayout(tooLong, 'title-body'), { code: 'DESIGN_LAYOUT_INCOMPATIBLE' })
  assert.throws(() => design.findCompatibleLayouts({ title: 'T', blocks: [{ kind: 'script', text: 'x' }] }), {
    code: 'DESIGN_CONTENT_INVALID',
  })
  const incomplete = { ...design.listDesignSystems()[0].theme }
  delete incomplete['color.text']
  assert.throws(() => design.validateTheme(incomplete), { code: 'DESIGN_THEME_INVALID' })
  assert.throws(() => design.resolveDesign({ overrides: { 'font.body': 'Uninstalled remote font' } }), {
    code: 'DESIGN_FONT_UNAVAILABLE',
  })
  assert.throws(() => design.resolveDesign({ overrides: { 'color.extra': '#123456' } }), {
    code: 'DESIGN_THEME_INVALID',
  })
})
