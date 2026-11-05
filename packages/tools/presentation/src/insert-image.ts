import { ToolFailure } from '@deckagent/agent-runtime'
import type { ToolRegistry } from '@deckagent/agent-runtime'
import { DeckError, parseImageInsert } from '@deckagent/deck'
import type { DeckImageEditor, ImageAsset } from '@deckagent/deck'
export function registerImageAssets(registry: ToolRegistry, assets: readonly ImageAsset[]): () => void {
  return registry.register({
    name: 'list_image_assets',
    description:
      'List only already verified image assets owned by this Chat, with source provenance. This never fetches URLs or grants network access. For new images ask the user to import a public PNG/JPEG URL in the image panel.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    async execute(_args, { signal }) {
      signal.throwIfAborted()
      return JSON.stringify(assets)
    },
  })
}
export function registerInsertImage(
  registry: ToolRegistry,
  options: {
    readonly sessionId: string
    readonly editor: DeckImageEditor
    readonly allowedSlideIds: readonly string[]
  },
): () => void {
  const allowed = new Set(options.allowedSlideIds)
  return registry.register({
    name: 'insert_image',
    description:
      'Append an existing owned image asset to exactly one Host-authorized published slide, keeping original HTML. Read current revision first. Never pass URLs, src or HTML; use assetId from the Host manifest. Retry identical publicationId only after unknown outcome.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        outlineId: { type: 'string' },
        slideId: { type: 'string' },
        expectedRevision: { type: 'number' },
        assetId: { type: 'string' },
        publicationId: { type: 'string' },
        alt: { type: 'string' },
      },
      required: ['outlineId', 'slideId', 'expectedRevision', 'assetId', 'publicationId', 'alt'],
    },
    async execute(args, { signal }) {
      signal.throwIfAborted()
      if (!allowed.has(String(args.slideId))) throw new ToolFailure('SLIDE_SCOPE_DENIED')
      try {
        return JSON.stringify(options.editor.insertImage(options.sessionId, parseImageInsert(args), signal))
      } catch (error) {
        if (error instanceof DeckError) {
          if (['DECK_CONFLICT', 'DECK_PUBLICATION_CONFLICT'].includes(error.code))
            throw new ToolFailure('SLIDE_REVISION_CONFLICT')
          if (['DECK_IMAGE_REFERENCE', 'DECK_ASSET_UNAVAILABLE'].includes(error.code))
            throw new ToolFailure('IMAGE_ASSET_UNAVAILABLE')
        }
        throw new ToolFailure('SLIDE_IDENTITY_INVALID')
      }
    },
  })
}
