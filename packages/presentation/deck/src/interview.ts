import type { BriefDraft, InterviewTopic } from './contracts.ts'
import { validateBriefDraft } from './brief-store.ts'
import type { InterviewState } from './contracts.ts'

const questions: readonly [InterviewTopic, string, readonly string[]][] = [
  ['topic', 'Bạn muốn trình bày chủ đề gì?', []],
  ['audience', 'Bài trình bày dành cho ai?', ['Người mới tìm hiểu', 'Người có chuyên môn']],
  ['duration', 'Bạn dự kiến trình bày trong bao lâu?', ['5 phút', '10 phút', '20 phút']],
  ['purpose', 'Bạn muốn người nghe hiểu hoặc làm gì sau bài trình bày?', ['Giới thiệu', 'Giải thích', 'Đề xuất']],
  [
    'sources',
    'Bạn cho phép dùng những nguồn nào?',
    ['Tài liệu bạn gửi', 'Kiến thức chung của mô hình', 'Tìm nguồn công khai (chỉ miễn phí)'],
  ],
  ['language', 'Bạn muốn nội dung dùng ngôn ngữ nào?', ['Tiếng Việt', 'English']],
  ['images', 'Bạn cần ảnh nào trong bài trình bày?', ['Không cần ảnh', 'Dùng ảnh đã đính kèm']],
  ['format', 'Bạn muốn tạo ở định dạng nào? Hiện có HTML để xem trực tiếp trong Preview.', ['HTML']],
  ['template', 'Bạn muốn dùng template nào?', ['HTML Basic']],
  ['design-system', 'Bạn muốn dùng Design System nào?', ['DeckAgent Neutral']],
]

export function interviewState(input: unknown, unavailableSources = false): InterviewState {
  const d = validateBriefDraft(input)
  const answered = (topic: InterviewTopic) => d.answers.some(a => a.topic === topic)
  const known: Record<InterviewTopic, boolean> = {
    topic: !!d.topic,
    audience: !!d.audience || answered('audience'),
    duration: !!d.durationMinutes || answered('duration'),
    purpose: !!d.purpose || answered('purpose'),
    sources: d.sources.refs.length > 0 || d.sources.modelKnowledge || d.sources.publicResearch,
    language: !!d.language || answered('language'),
    images: answered('images') || d.images.mode === 'attachments',
    format: d.generationFormat === 'html' && (!d.requestedFormat || d.requestedFormat === 'html'),
    template: !!d.template,
    'design-system': !!d.designSystem,
  }
  const blockers = [
    ...(!d.topic ? [{ code: 'TOPIC_REQUIRED', message: 'Cần biết chủ đề trước khi lập Outline.' }] : []),
    ...(!known.sources
      ? [
          {
            code: 'SOURCE_CHOICE_REQUIRED',
            message: 'Hãy chọn nguồn; bỏ qua câu hỏi không cấp quyền dùng kiến thức mô hình hoặc research.',
          },
        ]
      : []),
    ...(d.requestedFormat && d.requestedFormat !== 'html'
      ? [
          {
            code: 'FORMAT_UNAVAILABLE',
            message: `Chưa tạo được định dạng ${d.requestedFormat}. Hiện có HTML; cần bạn chọn lại.`,
          },
        ]
      : []),
    ...(d.images.mode === 'unavailable' || (d.images.mode === 'attachments' && !d.images.attachmentIds.length)
      ? [
          {
            code: 'IMAGES_UNAVAILABLE',
            message: 'Hiện chỉ dùng ảnh đã đính kèm. Cần bạn chọn cách xử lý yêu cầu ảnh chưa đáp ứng.',
          },
        ]
      : []),
    ...(unavailableSources
      ? [
          {
            code: 'SOURCE_UNAVAILABLE',
            message: 'Có nguồn không còn khả dụng. Hãy chọn lại nguồn hoặc bổ sung tài liệu.',
          },
        ]
      : []),
  ]
  const missing = questions
    .filter(([topic]) => !known[topic])
    .map(([topic, prompt, suggestions]) => ({
      topic,
      prompt,
      suggestions,
      required: ['topic', 'sources', 'format'].includes(topic),
    }))
  return {
    questions: missing,
    blockers,
    readyForOutline: !missing.length && !blockers.length,
    skipAllowed: true,
    notice: 'Bạn có thể bỏ qua các câu hỏi còn lại và thêm yêu cầu khác. Chưa tạo slide trước khi xác nhận Outline.',
  }
}

/** Skip records uncertainty, and never enables a source choice or replaces an unsupported request. */
export function skipInterview(input: unknown): BriefDraft {
  const draft = validateBriefDraft(input)
  const missing = interviewState(draft).questions
  const answers = [...draft.answers]
  const assumptions = [...draft.assumptions]
  for (const { topic } of missing) {
    if (
      ['topic', 'sources', 'format'].includes(topic) &&
      (topic !== 'format' || (draft.requestedFormat && draft.requestedFormat !== 'html'))
    )
      continue
    if (!answers.some(a => a.topic === topic)) answers.push({ topic, value: 'Skipped by user' })
    const note = `Interview ${topic} was skipped; no specific requirement was supplied.`
    if (!assumptions.includes(note)) assumptions.push(note)
  }
  return validateBriefDraft({
    ...draft,
    answers,
    assumptions,
    ...(!draft.generationFormat && (!draft.requestedFormat || draft.requestedFormat === 'html')
      ? { generationFormat: 'html' }
      : {}),
    ...(!draft.template ? { template: { id: 'html-basic', version: 2 } } : {}),
    ...(!draft.designSystem ? { designSystem: { id: 'deckagent-neutral', version: 1 } } : {}),
  })
}
