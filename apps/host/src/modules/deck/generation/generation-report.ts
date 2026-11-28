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
    `Đã lưu ${saved.length}/${snapshot.slides.length} slide. ${complete ? 'Đã hoàn tất deck.' : 'Deck chưa hoàn tất; các slide đã lưu được giữ lại. Các slide đã lưu chưa được kiểm tra để thống nhất với nhau.'}`,
  ]
  const outline = decks.outlineSnapshot(sessionId).proposals.find(p => p.outlineId === snapshot.outlineId)
  const brief = outline?.brief?.draft

  for (const slide of snapshot.slides) {
    if (!slide.revision) {
      lines.push(`- ${slide.title}: chưa hoàn tất.`)
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
                ? 'kiến thức chung của model'
                : 'chưa rõ nguồn',
          ),
        ),
      ]
      const placeholders = provenance.filter(p => p.kind === 'placeholder').map(p => p.text)
      lines.push(
        `- ${slide.title}: ${outline?.slides.find(s => s.slideId === slide.slideId)?.content ?? 'đã lưu'}; nguồn: ${sources.join('; ') || 'chưa lưu nguồn'}.${placeholders.length ? ` Placeholder: ${placeholders.join('; ')}.` : ''}`,
      )
      if (metadata.notes) lines.push(`  Ghi chú người trình bày: đã lưu cho ${slide.title}.`)
      for (const credit of metadata.imageCredits ?? [])
        lines.push(
          `  Ảnh: ${credit.url}; tác giả: ${credit.author}; giấy phép: ${credit.license}${credit.unknownLicense ? ' (chưa rõ giấy phép)' : ''}.`,
        )
      for (const query of metadata.imageOmissions ?? []) lines.push(`  Đã bỏ ảnh tùy chọn: ${query}.`)
    } catch {
      lines.push(`- ${slide.title}: revision đã lưu không đọc được; chưa xác định được nguồn.`)
    }
  }

  lines.push(`Giả định: ${brief?.assumptions.join('; ') || 'Không có giả định được ghi nhận.'}`)
  for (const need of brief?.images.unmetRequirements ?? []) lines.push(`Ảnh chưa đáp ứng: ${need}`)
  lines.push('Nguồn ghi nhận không phải bằng chứng rằng mọi dữ kiện đã được kiểm chứng.')

  return lines.join('\n')
}
