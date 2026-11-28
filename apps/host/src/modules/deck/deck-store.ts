import { DeckStore } from '@deckagent/deck'
import { HtmlFormatAdapter, validateLegacySlideHtml } from '@deckagent/html-format'
import type { PublishChange } from '@deckagent/host-contracts'
import type { CommonsImages } from './images/index.ts'
import type { ArtifactRenderer } from './rendering/index.ts'

type PreparedImageReader = NonNullable<NonNullable<ConstructorParameters<typeof DeckStore>[1]>['preparedImage']>

export interface DeckStoreDependencies {
  readonly databasePath: string
  readonly artifactRoot: string
  readonly renderer: ArtifactRenderer
  readonly commonsImages: CommonsImages
  readonly publishChange: PublishChange
  readonly preparedImage: PreparedImageReader
  activeRequest(sessionId: string, requestId: string): boolean
}

/** Creates the durable `DeckStore` with Host HTML rendering, image lookup and change notices. */
export function createDeckStore(deps: DeckStoreDependencies): DeckStore {
  return new DeckStore(deps.databasePath, {
    formats: [new HtmlFormatAdapter()],
    onDeckChanged: (key, version) => deps.publishChange({ topic: 'deck', key, version }),
    onBriefChanged: (key, version) => deps.publishChange({ topic: 'brief', key, version }),
    onOutlineChanged: (key, version) => deps.publishChange({ topic: 'outline', key, version }),
    legacyHtmlPolicy: validateLegacySlideHtml,
    researchImage: (_id, query, signal) => deps.commonsImages.find(query, signal),
    artifactRoot: deps.artifactRoot,
    renderCheck: (html, requiredText, signal) => deps.renderer.render(html, requiredText, signal),
    preparedImage: (id, attachmentId, signal) => deps.preparedImage(id, attachmentId, signal),
    activeRequest: (id, requestId) => deps.activeRequest(id, requestId),
  })
}
