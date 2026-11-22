import type { BriefRecord, BriefSourceRef } from '@deckagent/deck'
import { element } from './dom.ts'

const fieldLabels: Readonly<Record<string, string>> = {
  topic: 'Chủ đề',
  audience: 'Người nghe',
  duration: 'Thời lượng',
  durationMinutes: 'Thời lượng (phút)',
  purpose: 'Mục tiêu',
  language: 'Ngôn ngữ',
  images: 'Ảnh',
  format: 'Định dạng',
  requestedFormat: 'Định dạng yêu cầu',
  generationFormat: 'Định dạng tạo slide',
  template: 'Template',
  'design-system': 'Design System',
  designSystem: 'Design System',
  proposedSlideCount: 'Số slide dự kiến',
  sources: 'Nguồn',
  requirements: 'Yêu cầu',
  assumptions: 'Giả định',
  answers: 'Câu trả lời',
  themeOverrides: 'Tùy chỉnh theme',
}

export function briefFieldLabel(field: string): string {
  return fieldLabels[field] ?? field
}

export function sourceReferences(refs: readonly BriefSourceRef[]): HTMLDetailsElement {
  const detail = element('details')
  detail.append(element('summary', `Tham chiếu nguồn đã lưu (${refs.length})`))
  const labels = {
    attachment: 'Tài liệu đính kèm',
    'project-file': 'Tệp trong project',
    'approved-file': 'Tệp được cấp quyền',
    research: 'Nguồn công khai',
  }
  for (const ref of refs) detail.append(element('p', `${labels[ref.kind]} · ${ref.sourceId} · v${ref.version}`))
  return detail
}

/** The reviewed record, without exposing storage fields as the primary reading surface. */
export function briefDetails(
  brief: BriefRecord,
  title = `Brief gắn với đề xuất v${brief.version}`,
): HTMLDetailsElement {
  const record = element('details')
  record.append(element('summary', title))
  const draft = brief.draft
  if (draft.presenterNotes) record.append(element('p', 'Ghi chú người trình bày: có yêu cầu.'))
  for (const [key, value] of Object.entries(draft))
    if (typeof value === 'string' || typeof value === 'number')
      record.append(element('p', `${briefFieldLabel(key)}: ${value}`))
  for (const requirement of draft.requirements) record.append(element('p', `Yêu cầu: ${requirement}`))
  for (const assumption of draft.assumptions) record.append(element('p', `Giả định: ${assumption}`))
  for (const answer of draft.answers) record.append(element('p', `${briefFieldLabel(answer.topic)}: ${answer.value}`))
  const selectedSources = [
    ...(draft.sources.material ? ['tài liệu của chat'] : []),
    ...(draft.sources.modelKnowledge ? ['kiến thức chung của mô hình'] : []),
    ...(draft.sources.publicResearch ? ['tìm nguồn công khai'] : []),
  ]
  record.append(element('p', `Nguồn được phép: ${selectedSources.join(', ') || 'Chưa chọn'}.`))
  const imageLabels = {
    none: 'Không dùng ảnh',
    attachments: 'Dùng ảnh đính kèm',
    'public-research': draft.images.provider
      ? `Ảnh web từ ${draft.images.provider === 'commons' ? 'Wikimedia Commons' : 'Tavily · chỉ miễn phí'}; truy vấn ảnh được gửi tới dịch vụ này.`
      : 'Ảnh web; xem nguồn được lưu cùng từng ảnh. Phiên bản Brief này chưa ghi riêng dịch vụ tìm ảnh.',
    unavailable: 'Yêu cầu ảnh chưa đáp ứng',
  }
  record.append(element('p', `Ảnh: ${imageLabels[draft.images.mode]}`))
  if (draft.sources.refs.length) record.append(sourceReferences(draft.sources.refs))
  if (brief.design) {
    const design = brief.design
    record.append(
      element(
        'p',
        `Template: ${design.template.id === 'html-basic' ? 'HTML Basic' : design.template.id} · Design System: ${design.designSystem.id === 'deckagent-neutral' ? 'DeckAgent Neutral' : design.designSystem.id}`,
      ),
    )
    const technical = element('details')
    technical.append(element('summary', 'Chi tiết theme và phiên bản'))
    technical.append(
      element(
        'p',
        `${design.template.id}@${design.template.version} · ${design.designSystem.id}@${design.designSystem.version}`,
      ),
    )
    for (const [role, value] of Object.entries(design.theme)) technical.append(element('p', `${role}: ${value}`))
    record.append(technical)
  }
  for (const need of draft.images.unmetRequirements) record.append(element('p', `Ảnh chưa đáp ứng: ${need}`))
  return record
}
