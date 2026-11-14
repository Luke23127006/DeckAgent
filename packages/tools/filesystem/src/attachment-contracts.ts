export const attachmentLimits = Object.freeze({
  files: 10,
  bytes: 20 * 1024 * 1024,
  expandedBytes: 64 * 1024 * 1024,
  entryBytes: 16 * 1024 * 1024,
  entries: 200,
  pages: 200,
  pixels: 16_000_000,
  imageSide: 1600,
  // Base64 tool output must fit the pinned CLI's bounded JSON event stream.
  imageBytes: 256 * 1024,
  textBytes: 2 * 1024 * 1024,
  preparationMs: 30_000,
})

/** Versioned with the extraction behavior; historical results never acquire new capabilities implicitly. */
export const attachmentParserVersion = 'b03-parser-v1'

export interface AttachmentLocation {
  readonly kind: 'lines' | 'page' | 'slide' | 'image'
  readonly start?: number
  readonly end?: number
  readonly page?: number
  readonly slide?: number
  readonly part?: string
  readonly entry?: string
}

export type AttachmentPart =
  | { readonly type: 'text'; readonly text: string; readonly location: AttachmentLocation }
  | {
      readonly type: 'image'
      readonly data: string
      readonly mimeType: 'image/png'
      readonly location: AttachmentLocation
      readonly width: number
      readonly height: number
    }

export interface ParsedAttachment {
  readonly mediaType: string
  readonly parserVersion: string
  readonly capabilities: readonly string[]
  readonly completeness: 'complete' | 'partial'
  readonly parts: readonly AttachmentPart[]
  readonly omitted: readonly { readonly code: string; readonly entry?: string }[]
}

export interface AttachmentParseInput {
  readonly name: string
  readonly bytes: Uint8Array
  readonly signal: AbortSignal
}
