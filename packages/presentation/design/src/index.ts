import { createHash } from 'node:crypto'
import { DesignError } from './contracts.ts'
import type {
  CatalogRef,
  ContentBlock,
  DesignSnapshot,
  DesignSystem,
  SlideContentPlan,
  Template,
  ThemeValues,
  LayoutIssue,
} from './contracts.ts'
export { DesignError } from './contracts.ts'
export type { WebImageIntent } from './contracts.ts'
export type {
  CatalogRef,
  ContentBlock,
  DesignSnapshot,
  DesignSystem,
  Layout,
  SlideContentPlan,
  Template,
  ThemeValues,
  LayoutIssue,
} from './contracts.ts'

function immutable<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child)
    Object.freeze(value)
  }
  return value
}
const system: DesignSystem = immutable({
  id: 'deckagent-neutral',
  version: 1,
  name: 'DeckAgent Neutral',
  theme: {
    'color.background': '#FFFFFF',
    'color.surface': '#F1F5F9',
    'color.text': '#0F172A',
    'color.muted': '#475569',
    'color.accent': '#2563EB',
    'color.onAccent': '#FFFFFF',
    'color.border': '#CBD5E1',
    'font.heading': 'system-ui, sans-serif',
    'font.body': 'system-ui, sans-serif',
    'type.display': 48,
    'type.heading': 36,
    'type.body': 24,
    'type.caption': 16,
    'space.unit': 8,
    'type.lineHeight': 1.35,
  },
  rules: [
    'Keep content readable with little decoration.',
    'Use accent colour deliberately.',
    'Do not invent theme roles or conceal missing content.',
  ],
  brandAssets: [],
})
const template: Template = immutable({
  id: 'html-basic',
  version: 1,
  name: 'HTML Basic',
  format: 'html',
  layouts: [
    { id: 'cover', contentKinds: ['subtitle'], capacity: { title: 80, subtitle: 160 } },
    { id: 'section', contentKinds: ['lead'], capacity: { title: 80, lead: 240 } },
    { id: 'title-body', contentKinds: ['bullets'], capacity: { title: 80, minBullets: 1, maxBullets: 5, bullet: 140 } },
    {
      id: 'two-column',
      contentKinds: ['columns'],
      capacity: { title: 80, columns: 2, minBullets: 1, maxBullets: 3, bullet: 120 },
    },
    {
      id: 'key-figures',
      contentKinds: ['metrics', 'source-note'],
      capacity: { title: 80, minMetrics: 1, maxMetrics: 3, value: 24, label: 80, note: 160 },
    },
    {
      id: 'image-text',
      contentKinds: ['image', 'bullets'],
      capacity: { title: 80, images: 1, minBullets: 1, maxBullets: 3, bullet: 140, caption: 160 },
    },
  ],
})
const templateV2: Template = immutable({
  ...template,
  version: 2,
  layouts: [
    ...template.layouts,
    {
      id: 'image-pair',
      contentKinds: ['image', 'bullets'],
      capacity: { title: 80, images: 2, minBullets: 1, maxBullets: 2, bullet: 140, caption: 160 },
    },
  ],
})
const templateV3: Template = immutable({
  ...templateV2,
  version: 3,
  layouts: templateV2.layouts.map(layout => ({
    ...layout,
    contentKinds: layout.id === 'section' ? ['lead', 'text'] : layout.contentKinds,
    capacity: {
      ...layout.capacity,
      ...(layout.id === 'section' ? { lead: 180, text: 300 } : {}),
      ...(layout.id === 'image-text' ? { bullet: 100, caption: 120 } : {}),
      ...(layout.id === 'image-pair' ? { bullet: 90, caption: 100 } : {}),
    },
  })),
})
function selectedTemplate(value: unknown): Template {
  if (value === undefined) return templateV3
  if (isRecord(value) && only(value, ['id', 'version']) && value.id === template.id) {
    if (value.version === 1) return template
    if (value.version === 2) return templateV2
    if (value.version === 3) return templateV3
  }
  throw new DesignError('DESIGN_TEMPLATE_NOT_FOUND')
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function listDesignSystems(): readonly DesignSystem[] {
  return [system]
}
export function listTemplates(format: string): readonly Template[] {
  if (format !== 'html') throw new DesignError('DESIGN_FORMAT_UNAVAILABLE')
  return [templateV3, templateV2, template]
}
function reference(value: unknown, expected: CatalogRef, code: string): void {
  if (
    value !== undefined &&
    (!isRecord(value) ||
      Object.keys(value).some(k => !['id', 'version'].includes(k)) ||
      value.id !== expected.id ||
      value.version !== expected.version)
  )
    throw new DesignError(code)
}
export function validateTheme(value: unknown): ThemeValues {
  if (!isRecord(value) || Object.keys(value).length !== Object.keys(system.theme).length)
    throw new DesignError('DESIGN_THEME_INVALID')
  const result = { ...system.theme }
  for (const role of Object.keys(system.theme) as (keyof ThemeValues)[]) {
    const item = value[role]
    if (!Object.hasOwn(value, role)) throw new DesignError('DESIGN_THEME_INVALID')
    if (role.startsWith('color.')) {
      if (typeof item !== 'string' || !/^#[a-f0-9]{6}$/i.test(item)) throw new DesignError('DESIGN_THEME_INVALID')
    } else if (role.startsWith('font.')) {
      if (item !== 'system-ui, sans-serif') throw new DesignError('DESIGN_FONT_UNAVAILABLE')
    } else if (typeof item !== 'number' || !Number.isFinite(item) || item <= 0)
      throw new DesignError('DESIGN_THEME_INVALID')
    Object.assign(result, { [role]: item })
  }
  return immutable(result)
}
export function resolveDesign(value: unknown = {}): DesignSnapshot {
  if (
    !isRecord(value) ||
    Object.keys(value).some(k => !['format', 'designSystem', 'template', 'overrides'].includes(k))
  )
    throw new DesignError('DESIGN_SELECTION_INVALID')
  if (value.format !== undefined && value.format !== 'html') throw new DesignError('DESIGN_FORMAT_UNAVAILABLE')
  reference(value.designSystem, system, 'DESIGN_SYSTEM_NOT_FOUND')
  const chosenTemplate = selectedTemplate(value.template)
  if (
    value.overrides !== undefined &&
    (!isRecord(value.overrides) || Object.keys(value.overrides).some(k => !Object.hasOwn(system.theme, k)))
  )
    throw new DesignError('DESIGN_THEME_INVALID')
  const theme = validateTheme({ ...system.theme, ...(isRecord(value.overrides) ? value.overrides : {}) })
  const snapshot = {
    format: 'html' as const,
    designSystem: { id: system.id, version: system.version },
    template: { id: chosenTemplate.id, version: chosenTemplate.version },
    theme,
    rules: [...system.rules],
    brandAssets: [],
    viewport: { width: 1280 as const, height: 720 as const },
  }
  return immutable({ ...snapshot, fingerprint: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex') })
}

/** Decode an existing snapshot without resolving it against today's mutable selection. */
export function decodeDesignSnapshot(value: unknown): DesignSnapshot {
  const invalid = (): never => {
    throw new DesignError('DESIGN_SNAPSHOT_INVALID')
  }
  if (
    !isRecord(value) ||
    !only(value, ['format', 'designSystem', 'template', 'theme', 'rules', 'brandAssets', 'viewport', 'fingerprint']) ||
    value.format !== 'html' ||
    !isRecord(value.designSystem) ||
    !isRecord(value.template) ||
    !isRecord(value.viewport) ||
    value.viewport.width !== 1280 ||
    value.viewport.height !== 720 ||
    !only(value.viewport, ['width', 'height']) ||
    !Array.isArray(value.rules) ||
    !value.rules.every(text) ||
    !Array.isArray(value.brandAssets) ||
    value.brandAssets.length !== 0
  )
    return invalid()
  const ref = (v: Record<string, unknown>): CatalogRef => {
    if (
      !only(v, ['id', 'version']) ||
      typeof v.id !== 'string' ||
      !/^[a-z0-9-]{1,100}$/.test(v.id) ||
      !Number.isSafeInteger(v.version) ||
      Number(v.version) < 1
    )
      return invalid()
    return { id: v.id, version: Number(v.version) }
  }
  const snapshot = {
    format: 'html' as const,
    designSystem: ref(value.designSystem),
    template: ref(value.template),
    theme: validateTheme(value.theme),
    rules: value.rules.map(String),
    brandAssets: [],
    viewport: { width: 1280 as const, height: 720 as const },
  }
  const fingerprint = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')
  if (value.fingerprint !== fingerprint) return invalid()
  return immutable({ ...snapshot, fingerprint })
}

const only = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every(key => keys.includes(key))
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.isWellFormed()
const texts = (value: unknown): value is string[] => Array.isArray(value) && value.length > 0 && value.every(text)

export function validateContentPlan(value: unknown): SlideContentPlan {
  const invalid = (): never => {
    throw new DesignError('DESIGN_CONTENT_INVALID')
  }
  if (!isRecord(value) || !only(value, ['title', 'blocks']) || !text(value.title) || !Array.isArray(value.blocks))
    return invalid()
  try {
    if (Buffer.byteLength(JSON.stringify(value)) > 256 * 1024) return invalid()
  } catch {
    return invalid()
  }
  const blocks = value.blocks.map((block: unknown): ContentBlock => {
    if (!isRecord(block)) return invalid()
    if (block.kind === 'subtitle' || block.kind === 'lead' || block.kind === 'text' || block.kind === 'source-note') {
      if (!only(block, ['kind', 'text']) || !text(block.text)) return invalid()
      return { kind: block.kind, text: block.text }
    }
    if (block.kind === 'bullets') {
      if (!only(block, ['kind', 'items']) || !texts(block.items)) return invalid()
      return { kind: block.kind, items: [...block.items] }
    }
    if (block.kind === 'columns') {
      if (!only(block, ['kind', 'columns']) || !Array.isArray(block.columns) || !block.columns.length) return invalid()
      return {
        kind: block.kind,
        columns: block.columns.map((column: unknown) => {
          if (!isRecord(column) || !only(column, ['bullets']) || !texts(column.bullets)) return invalid()
          return { bullets: [...column.bullets] }
        }),
      }
    }
    if (block.kind === 'metrics') {
      if (!only(block, ['kind', 'items']) || !Array.isArray(block.items) || !block.items.length) return invalid()
      return {
        kind: block.kind,
        items: block.items.map((item: unknown) => {
          if (!isRecord(item) || !only(item, ['value', 'label']) || !text(item.value) || !text(item.label))
            return invalid()
          return { value: item.value, label: item.label }
        }),
      }
    }
    if (block.kind === 'web-image') {
      if (
        !only(block, ['kind', 'query', 'caption', 'required', 'intent', 'provider', 'replace']) ||
        !text(block.query) ||
        block.query.length > 500 ||
        (block.caption !== undefined && !text(block.caption)) ||
        (block.required !== undefined && typeof block.required !== 'boolean') ||
        (block.replace !== undefined && typeof block.replace !== 'boolean') ||
        (block.provider !== undefined && !['tavily', 'commons'].includes(String(block.provider))) ||
        (block.intent !== undefined &&
          (!isRecord(block.intent) ||
            !only(block.intent, ['subject', 'role', 'mustInclude', 'mustAvoid', 'aspect']) ||
            !text(block.intent.subject) ||
            block.intent.subject.length > 500 ||
            !text(block.intent.role) ||
            block.intent.role.length > 500 ||
            !Array.isArray(block.intent.mustInclude) ||
            block.intent.mustInclude.length > 10 ||
            !block.intent.mustInclude.every((v: unknown) => text(v) && v.length <= 300) ||
            !Array.isArray(block.intent.mustAvoid) ||
            block.intent.mustAvoid.length > 10 ||
            !block.intent.mustAvoid.every((v: unknown) => text(v) && v.length <= 300) ||
            !['landscape', 'portrait', 'square', 'any'].includes(String(block.intent.aspect))))
      )
        return invalid()
      return {
        kind: 'web-image' as const,
        query: block.query,
        ...(typeof block.caption === 'string' ? { caption: block.caption } : {}),
        ...(typeof block.required === 'boolean' ? { required: block.required } : {}),
        ...(typeof block.replace === 'boolean' ? { replace: block.replace } : {}),
        ...(block.provider === 'tavily' || block.provider === 'commons' ? { provider: block.provider } : {}),
        ...(block.intent ? { intent: block.intent as unknown as import('./contracts.ts').WebImageIntent } : {}),
      }
    }
    if (block.kind === 'image') {
      if (
        !only(block, ['kind', 'attachmentId', 'caption']) ||
        typeof block.attachmentId !== 'string' ||
        !/^att-[a-f0-9-]{36}$/.test(block.attachmentId) ||
        (block.caption !== undefined && !text(block.caption))
      )
        return invalid()
      return {
        kind: block.kind,
        attachmentId: block.attachmentId,
        ...(typeof block.caption === 'string' ? { caption: block.caption } : {}),
      }
    }
    return invalid()
  })
  return immutable({ title: value.title, blocks })
}

export function findCompatibleLayouts(
  input: unknown,
  templateRef?: CatalogRef,
): { readonly candidates: readonly Template['layouts'][number][]; readonly fallbackAllowed: boolean } {
  const template = selectedTemplate(templateRef)
  const plan = validateContentPlan(input)
  const length = (value: string) => [...value].length
  const candidates = template.layouts.filter(layout => {
    const c = layout.capacity
    if (
      length(plan.title) > c.title! ||
      plan.blocks.some(block => !layout.contentKinds.includes(block.kind === 'web-image' ? 'image' : block.kind))
    )
      return false
    const count = (kind: ContentBlock['kind']) =>
      plan.blocks.filter(b => (b.kind === 'web-image' ? 'image' : b.kind) === kind).length
    const bulletsFit = (items: readonly string[]) =>
      items.length >= c.minBullets! && items.length <= c.maxBullets! && items.every(item => length(item) <= c.bullet!)
    if (layout.id === 'cover')
      return count('subtitle') <= 1 && plan.blocks.every(b => 'text' in b && length(b.text) <= c.subtitle!)
    if (layout.id === 'section')
      if (template.version >= 3)
        return (
          count('lead') <= 1 &&
          count('text') <= 1 &&
          plan.blocks.length >= 1 &&
          plan.blocks.every(b => 'text' in b && length(b.text) <= (b.kind === 'lead' ? c.lead! : c.text!))
        )
    if (layout.id === 'section')
      return plan.blocks.length === 1 && plan.blocks.every(b => 'text' in b && length(b.text) <= c.lead!)
    if (layout.id === 'title-body')
      return plan.blocks.length === 1 && plan.blocks.every(b => b.kind === 'bullets' && bulletsFit(b.items))
    if (layout.id === 'two-column')
      return (
        plan.blocks.length === 1 &&
        plan.blocks.every(
          b =>
            b.kind === 'columns' && b.columns.length === c.columns && b.columns.every(col => bulletsFit(col.bullets)),
        )
      )
    if (layout.id === 'key-figures')
      return (
        count('metrics') === 1 &&
        count('source-note') <= 1 &&
        plan.blocks.every(b =>
          b.kind === 'metrics'
            ? b.items.length >= c.minMetrics! &&
              b.items.length <= c.maxMetrics! &&
              b.items.every(item => length(item.value) <= c.value! && length(item.label) <= c.label!)
            : 'text' in b && length(b.text) <= c.note!,
        )
      )
    return (
      count('image') === c.images &&
      (layout.id === 'image-pair' ? count('bullets') <= 1 : count('bullets') === 1) &&
      plan.blocks.every(b =>
        b.kind === 'image' || b.kind === 'web-image'
          ? !b.caption || length(b.caption) <= c.caption!
          : b.kind === 'bullets' && bulletsFit(b.items),
      )
    )
  })
  return immutable({ candidates, fallbackAllowed: candidates.length === 0 && template.version < 3 })
}

export function resolveLayout(plan: unknown, id: string, templateRef?: CatalogRef) {
  const result = findCompatibleLayouts(plan, templateRef)
  if (id === 'custom' && result.fallbackAllowed) return immutable({ kind: 'custom' as const })
  const layout = result.candidates.find(layout => layout.id === id)
  if (!layout) throw new DesignError('DESIGN_LAYOUT_INCOMPATIBLE')
  return immutable({ kind: 'built-in' as const, layout })
}

/** One catalog assessment serves model staging, confirmation and browser review. No rejected text is returned. */
export function reviewLayouts(slides: readonly SlideContentPlan[], templateRef?: CatalogRef): readonly LayoutIssue[] {
  if (selectedTemplate(templateRef).version < 3) return []
  const issues: LayoutIssue[] = []
  for (const [slideIndex, input] of slides.entries()) {
    const plan = validateContentPlan({ title: input.title, blocks: input.blocks })
    const result = findCompatibleLayouts(plan, templateRef)
    if (result.candidates.length || result.fallbackAllowed) continue
    // Project only content shape to find the layout whose field capacities explain the rejection.
    const shape: SlideContentPlan = {
      title: 'X',
      blocks: plan.blocks.map(block => {
        if (block.kind === 'bullets') return { ...block, items: block.items.map(() => 'X') }
        if (block.kind === 'columns')
          return { ...block, columns: block.columns.map(c => ({ bullets: c.bullets.map(() => 'X') })) }
        if (block.kind === 'metrics') return { ...block, items: block.items.map(() => ({ value: 'X', label: 'X' })) }
        if (block.kind === 'image' || block.kind === 'web-image')
          return { ...block, ...(block.caption ? { caption: 'X' } : {}) }
        return { ...block, text: 'X' }
      }),
    }
    const matches = findCompatibleLayouts(shape, templateRef)
      .candidates.map(layout => {
        const found: LayoutIssue[] = [],
          capacity = layout.capacity
        const check = (text: string, limit: number | undefined, path: string) => {
          const actual = [...text].length
          if (limit !== undefined && actual > limit)
            found.push({
              code: 'DESIGN_LAYOUT_INCOMPATIBLE',
              slideIndex,
              layoutId: layout.id,
              path: `slides[${slideIndex}].${path}`,
              actual,
              limit,
              message: 'The content exceeds the selected layout field capacity.',
              expected: `At most ${limit} Unicode characters. Rephrase while preserving required meaning; do not truncate or change image/source choices.`,
            })
        }
        check(plan.title, capacity.title, 'title')
        for (const [i, block] of plan.blocks.entries()) {
          const path = `blocks[${i}]`
          if (block.kind === 'bullets') {
            for (const [j, text] of block.items.entries()) check(text, capacity.bullet, `${path}.items[${j}]`)
          } else if (block.kind === 'columns') {
            for (const [j, col] of block.columns.entries())
              for (const [k, text] of col.bullets.entries())
                check(text, capacity.bullet, `${path}.columns[${j}].bullets[${k}]`)
          } else if (block.kind === 'metrics')
            block.items.forEach((item, j) => {
              check(item.value, capacity.value, `${path}.items[${j}].value`)
              check(item.label, capacity.label, `${path}.items[${j}].label`)
            })
          else if (block.kind === 'image' || block.kind === 'web-image') {
            if (block.caption) check(block.caption, capacity.caption, `${path}.caption`)
          } else check(block.text, capacity[block.kind === 'source-note' ? 'note' : block.kind], `${path}.text`)
        }
        return found
      })
      .toSorted((a, b) => a.length - b.length)
    issues.push(
      ...(matches[0]?.length
        ? matches[0]
        : [
            {
              code: 'DESIGN_LAYOUT_INCOMPATIBLE' as const,
              slideIndex,
              path: `slides[${slideIndex}].blocks`,
              message: 'No controlled layout fits these content kinds or counts.',
              expected:
                'Use the supplied catalog content kinds and counts. Preserve required content, images and slide count.',
            },
          ]),
    )
    if (issues.length >= 32) break
  }
  return immutable(issues.slice(0, 32))
}
