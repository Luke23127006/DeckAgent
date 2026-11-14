import type { AttachmentView, ChatDraft } from '@deckagent/host-api'
import { button, element } from './dom.ts'

const reasons: Readonly<Record<string, string>> = {
  ATTACHMENT_UNREADABLE: 'Không đọc được tệp. Kiểm tra tệp hoặc cung cấp bản có chữ.',
  ATTACHMENT_TYPE_UNSUPPORTED: 'Định dạng tệp chưa được nhận.',
  ATTACHMENT_TOO_LARGE: 'Tệp vượt 20 MiB. Hãy giảm dung lượng.',
  PARSING_LIMIT_EXCEEDED: 'Tệp vượt giới hạn đọc an toàn. Hãy chia tài liệu thành phần nhỏ hơn.',
  UPLOAD_CANCELLED: 'Việc chuẩn bị đã dừng. Bỏ tệp rồi thêm lại khi cần.',
  ATTACHMENT_NOT_SAVED: 'Chưa lưu được tệp. Kiểm tra dữ liệu local và thử lại.',
  HOST_BUSY: 'Đang có nhiều tệp được chuẩn bị. Hãy thử lại sau.',
}

export function attachmentReason(code?: string): string {
  return reasons[code ?? ''] ?? 'Tệp chưa dùng được. Bỏ tệp rồi thử lại.'
}

/** Metadata only; uploaded source strings enter text nodes, never HTML. */
export class AttachmentDraftView {
  readonly node = element('section', undefined, 'attachment-draft')
  readonly picker = element('input')
  readonly trigger: HTMLButtonElement
  private signature = ''

  constructor(actions: { upload(files: File[]): void; remove(id: string): void; preview(item: AttachmentView): void }) {
    this.picker.type = 'file'
    this.picker.accept = '.txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.pptx,.zip'
    this.picker.multiple = true
    this.picker.hidden = true
    this.picker.setAttribute('aria-label', 'Chọn tệp đính kèm')
    this.picker.addEventListener('change', () => {
      const files = Array.from(this.picker.files ?? [])
      this.picker.value = ''
      if (files.length) actions.upload(files)
    })
    this.trigger = button('+', () => this.picker.click())
    this.trigger.className = 'attachment-action'
    this.trigger.title = 'Thêm tệp · tối đa 10 tệp, 20 MiB/tệp'
    this.trigger.setAttribute('aria-label', 'Đính kèm tệp')
    this.node.setAttribute('aria-label', 'Tệp của bản nháp')
    this.node.setAttribute('aria-live', 'polite')
    this.node.hidden = true
    this.render = (draft, busy) => {
      this.trigger.disabled = !draft || busy
      const signature = JSON.stringify([draft?.sessionId, draft?.attachments, busy])
      if (signature === this.signature) return
      this.signature = signature
      const rows = (draft?.attachments ?? []).map(item => {
        const row = element('div', undefined, 'attachment-row')
        row.dataset.attachmentId = item.attachmentId
        row.dataset.state = item.state
        const label = element('span', item.name, 'attachment-name')
        const state =
          item.state === 'preparing'
            ? 'Đang chuẩn bị'
            : item.state === 'rejected'
              ? attachmentReason(item.rejectionCode)
              : item.preparation?.completeness === 'partial'
                ? 'Sẵn sàng · đọc một phần'
                : 'Sẵn sàng'
        row.append(label, element('small', state))
        if (item.preparation?.completeness === 'partial')
          row.append(element('small', 'Một phần đã được thu nhỏ hoặc chưa đọc được; model chỉ dùng phần tool trả về.'))
        const preview = button('Xem trước', () => actions.preview(item))
        preview.disabled = item.state !== 'ready'
        const remove = button('Bỏ tệp', () => actions.remove(item.attachmentId))
        remove.disabled = busy
        row.append(preview, remove)
        return row
      })
      this.node.replaceChildren(...rows)
      if (busy) this.node.append(element('p', 'Đang lưu tệp vào bản nháp…'))
      this.node.hidden = rows.length === 0 && !busy
    }
  }

  readonly render: (draft: ChatDraft | undefined, busy: boolean) => void
}
