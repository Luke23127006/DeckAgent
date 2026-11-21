import type { DesignSnapshot } from '@deckagent/design'

export interface SourceReference {
  readonly sourceId: string
  readonly version: number
  readonly kind: 'attachment' | 'project-file' | 'approved-file' | 'research'
}
export interface ContentOrigin {
  readonly text: string
  readonly kind: 'fact' | 'wording' | 'placeholder'
  readonly origin: 'material' | 'research' | 'general-knowledge' | 'unknown'
  readonly source?: SourceReference
  readonly label?: string
  readonly location?: string
  readonly quote?: string
}
export type SlideNode = { readonly id: string } & (
  | { readonly kind: 'subtitle' | 'lead' | 'text' | 'source-note'; readonly text: string }
  | { readonly kind: 'bullets'; readonly items: readonly string[] }
  | { readonly kind: 'columns'; readonly columns: readonly { readonly bullets: readonly string[] }[] }
  | { readonly kind: 'metrics'; readonly items: readonly { readonly value: string; readonly label: string }[] }
  | { readonly kind: 'image'; readonly assetId: string; readonly caption?: string }
)
export interface SlideDocument {
  readonly schemaVersion: 1
  readonly slideId: string
  readonly title: string
  readonly layoutIntent: string
  readonly nodes: readonly SlideNode[]
  readonly provenance: readonly ContentOrigin[]
  readonly notes?: string
}
export interface ValidationIssue {
  readonly code: string
  readonly path: string
  readonly message: string
  readonly expected?: string
}
export class FormatError extends Error {
  constructor(
    readonly code: string,
    readonly issues: readonly ValidationIssue[] = [],
  ) {
    super(code)
    this.name = 'FormatError'
  }
}
export interface FormatAsset {
  readonly assetId: string
  readonly byteSize: number
  readonly bytes: Uint8Array
}
export interface ArtifactDescriptor {
  readonly format: string
  readonly mediaType: string
  readonly extension: string
  readonly policyVersion: string
  readonly documentVersion?: 1
  readonly template: { readonly id: string; readonly version: number }
}
export interface FormatContext {
  readonly design: DesignSnapshot
  readonly layoutId: string
  readonly assets: readonly FormatAsset[]
  readonly document?: SlideDocument
}
export interface BuiltArtifact {
  readonly bytes: Uint8Array
  readonly descriptor: ArtifactDescriptor
  readonly preview?: string
}
/** Native adapters have no request grant, publication pointer or filesystem authority. */
export interface FormatAdapter {
  readonly id: string
  context(input: FormatContext): { readonly starter: string; readonly rules: readonly string[] }
  build(source: string, input: FormatContext): BuiltArtifact | Promise<BuiltArtifact>
  read(bytes: Uint8Array, assets: readonly FormatAsset[]): string | Uint8Array
}
