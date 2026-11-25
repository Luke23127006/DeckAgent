import type {
  ApprovalView,
  HistoryMessage,
  RequestSnapshot,
  RequestStatus,
  StoredActivity,
  StoredRequest,
} from '@deckagent/host-contracts'
import { button, element } from '../../dom.ts'
import { isActive } from '../../transport/index.ts'
import { failureFeedback, offersSettings, requestFeedback } from '../requests/index.ts'
import { messageContent } from './message-content.ts'

interface ActivityRow {
  readonly node: HTMLDetailsElement
  readonly summary: HTMLElement
  readonly detail: HTMLElement
}

const outcomes: Readonly<Record<string, string>> = {
  running: 'đang chạy',
  completed: 'hoàn tất',
  failed: 'thất bại',
  stopped: 'đã dừng',
}

const activityNames: Readonly<Record<string, string>> = {
  'Model response': 'Phản hồi model',
  'Conversation summary': 'Tóm tắt hội thoại',
  list_sources: 'Liệt kê nguồn project',
  read_source: 'Đọc nguồn project',
  read_external: 'Đọc file ngoài phạm vi',
  read_attachment: 'Đọc tệp đính kèm',
  research_public: 'Tìm nguồn công khai',
  stage_brief: 'Đề xuất Brief',
  stage_outline: 'Đề xuất Outline',
  read_generation_plan: 'Đọc kế hoạch đã xác nhận',
  begin_slide: 'Chuẩn bị slide',
  read_slide_draft: 'Xem bản nháp slide',
  record_slide_content: 'Ghi nhận nội dung slide',
  record_slide_provenance: 'Ghi nhận nguồn nội dung',
  find_slide_image: 'Tìm ảnh minh họa',
  prepare_slide_images: 'Chuẩn bị ảnh cho Outline',
  search_slide_images: 'Tìm ảnh theo nội dung slide',
  select_slide_image: 'Chọn và kiểm tra ảnh',
  recover_slide_images: 'Tìm và chuẩn bị ảnh còn thiếu',
  validate_slide: 'Kiểm tra bản nháp slide',
  append_slide: 'Soạn nội dung slide',
  attach_slide_image: 'Thêm ảnh đã chọn',
  publish_slide: 'Kiểm tra và lưu slide',
  discard_slide: 'Bỏ bản slide chưa hoàn tất',
}

/** Callbacks the conversation view supplies to a request row. */
export interface RequestRowHooks {
  retry(text: string): void
  settings(): void
  draft(): string
  approve?(requestId: string, approvalId: string, decision: 'allow-once' | 'refuse'): Promise<void>
}

/** Stable DOM nodes of one request record; reuse preserves focus and expansion between updates. */
export class RequestRow {
  readonly node = element('details', undefined, 'request-record')
  readonly revision = element('span', undefined, 'request-rev')
  readonly status = element('span', undefined, 'request-state')
  readonly count = element('span', undefined, 'activity-count')
  readonly model = element('p', undefined, 'request-model')
  readonly feedback = element('p', undefined, 'request-feedback')
  readonly diagnostic = element('details', undefined, 'request-diagnostic')
  readonly diagnosticCode = element('p')
  readonly reply = element('div', undefined, 'request-live-reply')
  readonly empty = element('p', 'Chưa ghi nhận hoạt động.')
  readonly list = element('div', undefined, 'activity-list')
  readonly activities = new Map<string, ActivityRow>()
  readonly actions = element('div', undefined, 'request-actions')
  readonly approval = element('section', undefined, 'step-approval')
  replyText = ''
  actionsKey = ''
  approvalKey = ''

  constructor(id: string) {
    this.node.dataset.requestId = id
    this.revision.setAttribute('role', 'img')
    this.status.setAttribute('role', 'status')
    this.reply.hidden = true
    this.reply.setAttribute('aria-live', 'polite')
    this.actions.hidden = true
    this.approval.hidden = true
    this.approval.setAttribute('aria-label', 'Cấp quyền cho một bước')
    const summary = element('summary')
    summary.append(this.revision, this.status, this.count)
    this.diagnostic.append(element('summary', 'Chi tiết kỹ thuật'), this.diagnosticCode)
    this.node.append(summary, this.feedback, this.approval, this.actions)
    this.node.append(this.model, this.diagnostic, this.empty, this.list)
  }
}

export const createRequestRow = (id: string): RequestRow => new RequestRow(id)

export function updateRequestActions(
  row: RequestRow,
  state: RequestStatus,
  errorCode: string | undefined,
  stored: StoredRequest | undefined,
  original: HistoryMessage | undefined,
  hooks: RequestRowHooks | undefined,
): void {
  const actionsKey = `${state}|${errorCode ?? ''}|${stored?.historyStart ?? ''}`
  if (row.actionsKey === actionsKey) return
  row.actionsKey = actionsKey
  const controls: HTMLElement[] = []
  const note = element('p', undefined, 'request-action-note')
  note.setAttribute('role', 'status')
  if ((state === 'failed' || state === 'interrupted') && offersSettings(errorCode))
    controls.push(button('Mở Cài đặt model', () => hooks?.settings()))
  if ((state === 'failed' || state === 'interrupted') && original?.role === 'user' && original.content) {
    const text = original.content
    // A draft in the composer is never replaced by one click: the first click asks, the second (same draft) replaces.
    let askedAbout: string | undefined
    controls.push(
      button('Đưa lại yêu cầu vào ô nhập', () => {
        const draft = hooks?.draft().trim() ?? ''
        if (draft && draft !== text.trim() && askedAbout !== draft) {
          askedAbout = draft
          note.textContent = 'Ô nhập đang có bản nháp. Bấm lại để thay bằng yêu cầu này.'
          return
        }
        askedAbout = undefined
        hooks?.retry(text)
        note.textContent = 'Đã đưa vào ô nhập. Nhấn Enter để gửi.'
      }),
    )
  }
  row.actions.replaceChildren(...controls, ...(controls.length ? [note] : []))
  row.actions.hidden = controls.length === 0
}

export function updateRequestActivities(row: RequestRow, records: readonly StoredActivity[]): void {
  for (const entry of records) {
    let activity = row.activities.get(entry.id)
    if (!activity) {
      const node = element('details', undefined, 'activity-detail')
      node.dataset.activityId = entry.id
      const summary = element('summary')
      const detail = element('p')
      node.append(summary, detail)
      activity = { node, summary, detail }
      row.activities.set(entry.id, activity)
      row.list.append(node)
    }
    const outcome = outcomes[entry.status] ?? entry.status
    activity.node.dataset.status = entry.status
    const name = activityNames[entry.label] ?? entry.label
    const text = `${name} · ${outcome}`
    if (activity.summary.textContent !== text) activity.summary.textContent = text
    const detail =
      entry.type === 'tool'
        ? `${name} · ${outcome}.${entry.status === 'failed' ? ' Bước này không được thực hiện; yêu cầu vẫn tiếp tục.' : ''}`
        : `${name} · ${outcome}.`
    if (activity.detail.textContent !== detail) activity.detail.textContent = detail
  }
}

export function updateApprovalCard(
  row: RequestRow,
  pending: ApprovalView | null,
  active: boolean,
  hooks: RequestRowHooks | undefined,
): void {
  if (!active || !pending || pending.state !== 'pending') {
    row.approval.hidden = true
    row.approvalKey = ''
    row.approval.replaceChildren()
    return
  }
  row.approval.hidden = false
  if (row.approvalKey === pending.approvalId) return
  row.approvalKey = pending.approvalId
  row.approval.dataset.approvalId = pending.approvalId
  const feedback = element('p')
  feedback.setAttribute('role', 'status')
  const decide = async (decision: 'allow-once' | 'refuse') => {
    allow.disabled = true
    refuse.disabled = true
    feedback.textContent = 'Đang lưu quyết định…'
    try {
      if (!hooks?.approve) throw new Error('APPROVAL_UNAVAILABLE')
      await hooks.approve(pending.requestId, pending.approvalId, decision)
    } catch {
      feedback.textContent =
        'Chưa xác nhận được kết quả. Kiểm tra kết nối hoặc trạng thái yêu cầu rồi thử lại; bạn vẫn có thể dừng.'
      allow.disabled = false
      refuse.disabled = false
    }
  }
  const allow = button('Cho phép một lần', () => {
    void decide('allow-once')
  })
  const refuse = button('Từ chối', () => {
    void decide('refuse')
  })
  row.approval.replaceChildren(
    element('strong', 'Đang chờ bạn cấp quyền'),
    element('p', 'Bước: đọc một file'),
    element('p', pending.target, 'approval-target'),
    element('p', pending.reason),
    allow,
    refuse,
    feedback,
  )
}

export function updateRequestRow(
  row: RequestRow,
  state: RequestStatus,
  live: RequestSnapshot | undefined,
  stored: StoredRequest | undefined,
  records: readonly StoredActivity[],
  disconnected: boolean,
  original: HistoryMessage | undefined,
  hooks: RequestRowHooks | undefined,
): void {
  const errorCode = live && !isActive(live.status) ? live.errorCode : (stored?.errorCode ?? live?.errorCode)
  const feedback = requestFeedback(state, errorCode, records, disconnected)
  if (row.feedback.textContent !== feedback.detail) row.feedback.textContent = feedback.detail
  row.node.dataset.toolErrors = String(feedback.toolErrors)
  const diagnostic = state === 'stopped' || state === 'completed' ? undefined : failureFeedback(errorCode).code
  row.diagnostic.hidden = !diagnostic
  if (diagnostic) row.diagnosticCode.textContent = `Mã lỗi: ${diagnostic}`
  if (row.status.textContent !== feedback.label) row.status.textContent = feedback.label
  row.node.dataset.status = state
  updateApprovalCard(row, live?.pendingApproval ?? null, isActive(state), hooks)
  // Live steps: open while the request runs, closed again as soon as it ends.
  if (isActive(state) && row.node.dataset.live !== '1') {
    row.node.dataset.live = '1'
    row.node.open = true
  } else if (!isActive(state) && row.node.dataset.live === '1') {
    delete row.node.dataset.live
    row.node.open = false
  }
  // The reply as it arrives; once the request ends, the saved conversation shows it instead.
  const partial = isActive(state) ? (live?.text ?? '') : ''
  row.reply.hidden = !partial
  if (row.replyText !== partial) {
    row.reply.replaceChildren(messageContent(partial))
    row.replyText = partial
  }
  updateRequestActions(row, state, errorCode, stored, original, hooks)
  row.model.hidden = !stored
  if (stored) {
    const model = `Model: ${stored.selection.provider} / ${stored.selection.model}`
    if (row.model.textContent !== model) row.model.textContent = model
  }
  const count = `${records.length} hoạt động`
  if (row.count.textContent !== count) row.count.textContent = count
  row.empty.hidden = records.length > 0
  updateRequestActivities(row, records)
}
