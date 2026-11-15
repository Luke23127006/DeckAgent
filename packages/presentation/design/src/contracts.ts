export interface CatalogRef {
  readonly id: string
  readonly version: number
}
export interface ThemeValues {
  readonly 'color.background': string
  readonly 'color.surface': string
  readonly 'color.text': string
  readonly 'color.muted': string
  readonly 'color.accent': string
  readonly 'color.onAccent': string
  readonly 'color.border': string
  readonly 'font.heading': string
  readonly 'font.body': string
  readonly 'type.display': number
  readonly 'type.heading': number
  readonly 'type.body': number
  readonly 'type.caption': number
  readonly 'space.unit': number
  readonly 'type.lineHeight': number
}
export interface DesignSystem extends CatalogRef {
  readonly name: string
  readonly theme: ThemeValues
  readonly rules: readonly string[]
  readonly brandAssets: readonly string[]
}
export interface Layout {
  readonly id: 'cover' | 'section' | 'title-body' | 'two-column' | 'key-figures' | 'image-text'
  readonly contentKinds: readonly ContentBlock['kind'][]
  readonly capacity: Readonly<Record<string, number>>
}
export interface Template extends CatalogRef {
  readonly name: string
  readonly format: 'html'
  readonly layouts: readonly Layout[]
}
export interface DesignSnapshot {
  readonly format: 'html'
  readonly designSystem: CatalogRef
  readonly template: CatalogRef
  readonly theme: ThemeValues
  readonly rules: readonly string[]
  readonly brandAssets: readonly string[]
  readonly viewport: { readonly width: 1280; readonly height: 720 }
  readonly fingerprint: string
}
export type ContentBlock =
  | { readonly kind: 'subtitle' | 'lead' | 'text' | 'source-note'; readonly text: string }
  | { readonly kind: 'bullets'; readonly items: readonly string[] }
  | { readonly kind: 'columns'; readonly columns: readonly { readonly bullets: readonly string[] }[] }
  | { readonly kind: 'metrics'; readonly items: readonly { readonly value: string; readonly label: string }[] }
  | { readonly kind: 'image'; readonly attachmentId: string; readonly caption?: string }
export interface SlideContentPlan {
  readonly title: string
  readonly blocks: readonly ContentBlock[]
}
export class DesignError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'DesignError'
  }
}
