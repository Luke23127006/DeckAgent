import type { DeckStore } from '@deckagent/deck'
import type { TerminalStatus } from '@deckagent/host-contracts'

/** Counts and origins come from published revisions, never a model's success claim. */
export function generationReport(
  decks: DeckStore,
  sessionId: string,
  requestId: string,
  status: TerminalStatus,
): string | undefined {
  const generation = decks.generation(sessionId)
  if (!generation || (generation.activeRequestId ?? generation.receipt.requestId) !== requestId) return undefined

  const snapshot = decks.snapshot(sessionId)
  const saved = snapshot.slides.filter(s => s.revision > 0)
  const complete = status === 'completed' && saved.length === snapshot.slides.length
  const lines = [
    `Saved ${saved.length}/${snapshot.slides.length} slides. ${complete ? 'The deck is complete.' : 'The deck is not complete. DeckAgent keeps the saved slides. DeckAgent did not check the saved slides for consistency with each other.'}`,
  ]
  const outline = decks.outlineSnapshot(sessionId).proposals.find(p => p.outlineId === snapshot.outlineId)
  const brief = outline?.brief?.draft

  for (const slide of snapshot.slides) {
    if (!slide.revision) {
      lines.push(`- ${slide.title}: not complete.`)
      continue
    }
    try {
      const metadata = decks.slideMetadata(sessionId, slide.slideId, slide.revision)
      const provenance = metadata.provenance ?? []
      const sources = [
        ...new Set(
          provenance.map(p =>
            p.source
              ? `${p.label} (${p.location})`
              : p.origin === 'general-knowledge'
                ? 'general knowledge of the model'
                : 'unknown source',
          ),
        ),
      ]
      const placeholders = provenance.filter(p => p.kind === 'placeholder').map(p => p.text)
      lines.push(
        `- ${slide.title}: ${outline?.slides.find(s => s.slideId === slide.slideId)?.content ?? 'saved'}; sources: ${sources.join('; ') || 'no saved sources'}.${placeholders.length ? ` Placeholder: ${placeholders.join('; ')}.` : ''}`,
      )
      if (metadata.notes) lines.push(`  Presenter notes: saved for ${slide.title}.`)
      for (const credit of metadata.imageCredits ?? [])
        lines.push(
          `  Image: ${credit.url}; author: ${credit.author}; license: ${credit.license}${credit.unknownLicense ? ' (license unknown)' : ''}.`,
        )
      for (const query of metadata.imageOmissions ?? []) lines.push(`  Removed optional image: ${query}.`)
    } catch {
      lines.push(`- ${slide.title}: the saved revision cannot be read. The sources are unknown.`)
    }
  }

  lines.push(`Assumptions: ${brief?.assumptions.join('; ') || 'No assumptions recorded.'}`)
  for (const need of brief?.images.unmetRequirements ?? []) lines.push(`Image not met: ${need}`)
  lines.push('The recorded sources do not prove that all facts are verified.')

  return lines.join('\n')
}
