import type { ToolRegistry } from '@deckagent/agent-runtime'
import { createWorkspaceReader } from '@deckagent/file-tools'
import type { DeckPublisher } from '@deckagent/deck'
export { registerProposeOutline } from './propose-outline.ts'

/** Scope belongs to Host, never to model arguments. Tool has no confirmation capability. */
export async function registerPublishSlide(
  registry: ToolRegistry,
  options: {
    readonly root: string
    readonly sessionId: string
    readonly decks: Pick<DeckPublisher, 'publish'>
  },
): Promise<() => void> {
  const read = await createWorkspaceReader({ root: options.root })
  return registry.register({
    name: 'publish_slide',
    description:
      'Publish a finished static HTML/CSS workspace draft to a planned slide of the confirmed outline. No scripts, embeds, links or external assets. Use the current slide revision and a unique publicationId; retry identical input with the same publicationId after an unknown outcome.',
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
      return JSON.stringify(
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
      )
    },
  })
}
