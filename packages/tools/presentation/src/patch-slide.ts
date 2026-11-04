import { ToolFailure } from '@deckagent/agent-runtime'
import type { ToolRegistry } from '@deckagent/agent-runtime'
import { DeckError, parseSlideEdit } from '@deckagent/deck'
import type { DeckEditor } from '@deckagent/deck'

export function registerPatchSlide(
  registry: ToolRegistry,
  options: { readonly sessionId: string; readonly editor: DeckEditor; readonly allowedSlideIds: readonly string[] },
): () => void {
  const allowed = new Set(options.allowedSlideIds)
  return registry.register({
    name: 'patch_slide',
    description:
      'Patch selected plain-text blocks/layout in a published slide, preserving other HTML bytes. First read_slide for editor node IDs and baseHash. edit is a JSON STRING {outlineId,slideId,expectedRevision,baseHash,editId,operations:[{nodeId,text?,layout?:{fontSize?,textAlign?,marginTop?,marginLeft?}}]}. fontSize integer px 8..144; margins -1000..1000; alignment left/center/right. Unique editId; retry identical input with that ID only after unknown outcome. No HTML, raw CSS, URLs, selectors or added elements.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: { edit: { type: 'string' } },
      required: ['edit'],
    },
    async execute(args, { signal }) {
      signal.throwIfAborted()
      if (typeof args.edit !== 'string' || args.edit.length > 262144) throw new ToolFailure('SLIDE_EDIT_INVALID')
      try {
        const input = parseSlideEdit(JSON.parse(args.edit))
        if (!allowed.has(input.slideId)) throw new ToolFailure('SLIDE_SCOPE_DENIED')
        return JSON.stringify(options.editor.editSlide(options.sessionId, input, signal))
      } catch (error) {
        if (error instanceof ToolFailure) throw error
        if (error instanceof DeckError) {
          if (['DECK_CONFLICT', 'DECK_PUBLICATION_CONFLICT'].includes(error.code))
            throw new ToolFailure('SLIDE_REVISION_CONFLICT')
          if (error.code === 'DECK_EDIT_UNSUPPORTED') throw new ToolFailure('SLIDE_EDIT_UNSUPPORTED')
          if (error.code === 'DECK_INVALID_EDIT') throw new ToolFailure('SLIDE_EDIT_INVALID')
          if (error.code === 'DECK_UNSAFE_HTML') throw new ToolFailure('SLIDE_UNSAFE_HTML')
          throw new ToolFailure('SLIDE_IDENTITY_INVALID')
        }
        throw new ToolFailure('SLIDE_EDIT_INVALID')
      }
    },
  })
}
