import { ToolFailure } from '@deckagent/agent-runtime'
import type { ToolRegistry } from '@deckagent/agent-runtime'
import { createWorkspaceReader } from '@deckagent/file-tools'
import type { DeckPublisher, DeckReader } from '@deckagent/deck'
import { DeckError } from '@deckagent/deck'
export { registerProposeOutline } from './propose-outline.ts'

/** Scope belongs to Host, never to model arguments. Tool has no confirmation capability. */
export async function registerPublishSlide(
  registry: ToolRegistry,
  options: {
    readonly root: string
    readonly sessionId: string
    readonly decks: Pick<DeckPublisher, 'publish'>
    readonly allowedSlideIds?: readonly string[]
  },
): Promise<() => void> {
  const read = await createWorkspaceReader({ root: options.root })
  return registry.register({
    name: 'publish_slide',
    description:
      'Publish a finished static HTML/CSS workspace draft to a planned slide of the confirmed outline. No meta tags (including charset/viewport), scripts, embeds, links or external assets. Use the current slide revision and a unique publicationId; retry identical input with the same publicationId only after an unknown outcome. On HTML rejection, write corrected HTML to a new path before publishing again.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        outlineId: { type: 'string' },
        slideId: { type: 'string' },
        path: { type: 'string' },
        expectedRevision: { type: 'number' },
        publicationId: { type: 'string' },
      },
      required: ['outlineId', 'slideId', 'path', 'expectedRevision', 'publicationId'],
    },
    async execute(args, { signal }) {
      if (options.allowedSlideIds && !options.allowedSlideIds.includes(String(args.slideId))) throw new ToolFailure('SLIDE_SCOPE_DENIED')
      const html = await read(args.path, signal)
      signal.throwIfAborted()
      // Registry validates primitive types; service validates identity, revision and HTML.
      if (
        typeof args.outlineId !== 'string' ||
        typeof args.slideId !== 'string' ||
        typeof args.publicationId !== 'string' ||
        typeof args.expectedRevision !== 'number'
      )
        throw new Error('Invalid publication')
      try { return JSON.stringify(
        options.decks.publish(
          options.sessionId,
          {
            outlineId: args.outlineId,
            slideId: args.slideId,
            publicationId: args.publicationId,
            expectedRevision: args.expectedRevision,
            html,
          },
          signal,
        ),
      ) } catch (error) {
        if (error instanceof DeckError) {
          if (error.code === 'DECK_UNSAFE_HTML') throw new ToolFailure('SLIDE_UNSAFE_HTML')
          if (['DECK_CONFLICT', 'DECK_PUBLICATION_CONFLICT'].includes(error.code)) throw new ToolFailure('SLIDE_REVISION_CONFLICT')
          if (['DECK_NOT_CONFIRMED', 'DECK_OUTLINE_MISMATCH', 'DECK_SLIDE_NOT_FOUND', 'DECK_INVALID_PUBLICATION'].includes(error.code)) throw new ToolFailure('SLIDE_IDENTITY_INVALID')
        }
        throw error
      }
    },
  })
}

/** Published content comes from durable Deck storage, never a mutable workspace draft. */
export function registerReadSlide(registry: ToolRegistry, sessionId: string, decks: DeckReader): () => void {
  return registry.register({
    name: 'read_slide',
    description: 'Read the current published HTML revision of a slide in this chat.',
    parameters: { type: 'object', additionalProperties: false, properties: { slideId: { type: 'string' } }, required: ['slideId'] },
    async execute(args, { signal }) {
      signal.throwIfAborted()
      const slide = decks.snapshot(sessionId).slides.find(item => item.slideId === args.slideId)
      if (!slide || slide.status !== 'published') throw new Error('No published slide')
      return JSON.stringify(decks.content(sessionId, slide.slideId, slide.revision))
    },
  })
}
