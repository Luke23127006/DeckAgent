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
} from './contracts.ts'
export { DesignError } from './contracts.ts'
export type {
  CatalogRef,
  ContentBlock,
  DesignSnapshot,
  DesignSystem,
  Layout,
  SlideContentPlan,
  Template,
  ThemeValues,
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

export function listDesignSystems(): readonly DesignSystem[] {
  return [system]
}
export function listTemplates(format: string): readonly Template[] {
  if (format !== 'html') throw new DesignError('DESIGN_FORMAT_UNAVAILABLE')
  return [template]
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
  reference(value.template, template, 'DESIGN_TEMPLATE_NOT_FOUND')
  if (
    value.overrides !== undefined &&
    (!isRecord(value.overrides) || Object.keys(value.overrides).some(k => !Object.hasOwn(system.theme, k)))
  )
    throw new DesignError('DESIGN_THEME_INVALID')
  const theme = validateTheme({ ...system.theme, ...(isRecord(value.overrides) ? value.overrides : {}) })
  const snapshot = {
    format: 'html' as const,
    designSystem: { id: system.id, version: system.version },
    template: { id: template.id, version: template.version },
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
  templateRef: CatalogRef = { id: template.id, version: template.version },
): { readonly candidates: readonly Template['layouts'][number][]; readonly fallbackAllowed: boolean } {
  reference(templateRef, template, 'DESIGN_TEMPLATE_NOT_FOUND')
  const plan = validateContentPlan(input)
  const length = (value: string) => [...value].length
  const candidates = template.layouts.filter(layout => {
    const c = layout.capacity
    if (length(plan.title) > c.title! || plan.blocks.some(block => !layout.contentKinds.includes(block.kind)))
      return false
    const count = (kind: ContentBlock['kind']) => plan.blocks.filter(b => b.kind === kind).length
    const bulletsFit = (items: readonly string[]) =>
      items.length >= c.minBullets! && items.length <= c.maxBullets! && items.every(item => length(item) <= c.bullet!)
    if (layout.id === 'cover')
      return count('subtitle') <= 1 && plan.blocks.every(b => 'text' in b && length(b.text) <= c.subtitle!)
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
      count('bullets') === 1 &&
      plan.blocks.every(b =>
        b.kind === 'image'
          ? !b.caption || length(b.caption) <= c.caption!
          : b.kind === 'bullets' && bulletsFit(b.items),
      )
    )
  })
  return immutable({ candidates, fallbackAllowed: candidates.length === 0 })
}

export function resolveLayout(plan: unknown, id: string, templateRef?: CatalogRef) {
  const result = findCompatibleLayouts(plan, templateRef)
  if (id === 'custom' && result.fallbackAllowed) return immutable({ kind: 'custom' as const })
  const layout = result.candidates.find(layout => layout.id === id)
  if (!layout) throw new DesignError('DESIGN_LAYOUT_INCOMPATIBLE')
  return immutable({ kind: 'built-in' as const, layout })
}
