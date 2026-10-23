import type { HistoryMessage, StoredActivity, StoredRequest } from '@deckagent/host-api'

const errors: Readonly<Record<string, readonly [string, string]>> = {
  REQUEST_FAILED: ['Yêu cầu chưa hoàn tất', 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.'],
  TURN_FAILED: ['Yêu cầu chưa hoàn tất', 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.'],
  MODEL_PROTOCOL: ['Không sử dụng được phản hồi model', 'Kiểm tra phần đã lưu trước khi gửi yêu cầu khác.'],
  TOOL_FAILED: ['Lần gọi công cụ chưa thành công', 'Xem kết quả đã lưu bên dưới. Không coi thay đổi là đã thành công.'],
  CLEANUP_FAILED: ['Không kết thúc được yêu cầu an toàn', 'Kiểm tra phần đã lưu và khởi động lại Host trước khi tiếp tục.'],
  REQUEST_FINALIZATION_FAILED: ['Không lưu được kết quả yêu cầu', 'Kết nối lại để đọc phần đã lưu. Kết quả thao tác cuối chưa được xác nhận.'],
  PROVIDER_HTTP: ['Yêu cầu tới provider thất bại', 'Kiểm tra kết nối và cấu hình provider rồi gửi yêu cầu mới. Hệ thống không tự thử lại.'],
  PROVIDER_NETWORK: ['Không kết nối được provider', 'Kiểm tra kết nối và Base URL rồi gửi yêu cầu mới.'],
  PROVIDER_TIMEOUT: ['Provider phản hồi quá lâu', 'Kiểm tra kết nối rồi gửi yêu cầu mới khi sẵn sàng.'],
  PROVIDER_TLS: ['Không thiết lập được kết nối bảo mật', 'Kiểm tra URL provider và chứng chỉ hệ thống.'],
  PROVIDER_AUTH: ['Provider từ chối truy cập', 'Kiểm tra API key và quyền dùng model trong Cài đặt model.'],
  PROVIDER_CREDENTIALS: ['Cần API key', 'Nhập API key hợp lệ trong Cài đặt model.'],
  PROVIDER_RATE_LIMIT: ['Đã đạt giới hạn sử dụng của provider', 'Chờ hoặc kiểm tra giới hạn tài khoản trước khi gửi yêu cầu mới. Model không tự thay đổi.'],
  MODEL_NOT_SELECTABLE: ['Model không còn chọn được', 'Chọn model khác trong chat này. Chưa gửi yêu cầu.'],
  AUTH_REQUIRED: ['Kết nối này đã hết hiệu lực', 'Mở lại trình duyệt từ Host đang chạy.'],
  SESSION_BUSY: ['Chat đang có yêu cầu hoạt động', 'Đợi hoàn tất hoặc dừng yêu cầu trước khi gửi yêu cầu khác.'],
  OUTLINE_STALE: ['Outline đã thay đổi', 'Xem đề xuất hiện tại trước khi xác nhận.'],
  OUTLINE_ALREADY_CONFIRMED: ['Outline đã được xác nhận', 'Mở deck đã lưu. Hệ thống không xác nhận lại.'],
  DECK_INCOMPLETE: ['Bản nháp chưa sẵn sàng', 'Một số slide chưa được lưu. Phần hoàn tất vẫn được giữ; gửi yêu cầu mới để tiếp tục.'],
  EDIT_INCOMPLETE: ['Chưa hoàn tất thay đổi', 'Một số slide yêu cầu sửa chưa được lưu. Các bản đã lưu vẫn được giữ; gửi yêu cầu mới với phạm vi rõ ràng.'],
  SLIDE_SCOPE_DENIED: ['Không được phép lưu slide ngoài phạm vi', 'Gửi yêu cầu mới nêu số slide hoặc tiêu đề chính xác. Không có bước xin quyền Host riêng.'],
  SLIDE_UNSAFE_HTML: ['Bản nháp slide cần sửa', 'Nội dung chưa đáp ứng quy tắc HTML/CSS tĩnh. Bản sửa phải được lưu hợp lệ trước khi hiện trong deck.'],
  SLIDE_REVISION_CONFLICT: ['Bản slide đã lưu vừa thay đổi', 'Đọc bản mới nhất trước khi sửa tiếp.'],
  SLIDE_IDENTITY_INVALID: ['Không xác định được slide', 'Dùng slide thuộc deck đã xác nhận trong chat này.'],
  STEP_LIMIT: ['Đã đạt giới hạn số bước của lượt', 'Kiểm tra phần đã lưu và gửi yêu cầu mới cho phần chưa hoàn tất.'],
}

/** Raw provider/error messages never become UI copy. Unknown codes use a fixed fallback. */
export function failureFeedback(code?: string) {
  const known = typeof code === 'string' && Object.hasOwn(errors, code) ? errors[code] : undefined
  return { label: known?.[0] ?? 'Yêu cầu chưa hoàn tất',
    detail: known?.[1] ?? 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
    code: known ? code : undefined }
}

export function requestFeedback(state: StoredRequest['status'], errorCode: string | undefined,
  records: readonly StoredActivity[], tools: readonly HistoryMessage[], disconnected: boolean) {
  const saved = new Set<string>()
  for (const tool of tools) {
    if (tool.name !== 'publish_slide' || tool.isError !== false) continue
    try {
      const receipt = JSON.parse(tool.content)
      if (receipt && typeof receipt.slideId === 'string' && typeof receipt.sessionId === 'string' && receipt.deckId === receipt.sessionId &&
        Number.isSafeInteger(receipt.revision) && receipt.revision > 0 && Number.isSafeInteger(receipt.version) && receipt.version > 0)
        saved.add(receipt.slideId)
    } catch { /* A publication count requires a valid receipt, never model prose. */ }
  }
  const toolErrors = records.some(entry => entry.kind === 'tool' && entry.status === 'failed') || tools.some(tool => tool.isError === true)
  const savedText = saved.size ? `Đã lưu cập nhật ${saved.size} slide` : ''
  let label: string
  let detail = savedText ? `${savedText}. ` : ''
  if (state === 'running') {
    const current = records.findLast(entry => entry.status === 'running')
    const phases: Readonly<Record<string, string>> = { propose_outline: 'Đang chuẩn bị outline', publish_slide: 'Đang lưu slide',
      read_slide: 'Đang đọc slide đã lưu', write_file: 'Đang ghi bản nháp', read_file: 'Đang đọc tài liệu trong workspace' }
    label = disconnected ? 'Kết nối bị gián đoạn' : current?.kind === 'model' ? 'Đang chờ model'
      : current && Object.hasOwn(phases, current.label) ? phases[current.label]! : 'Đang làm việc…'
    detail += disconnected ? 'Tiến độ không được cập nhật trực tiếp. Kết nối lại để đọc trạng thái đã lưu; hệ thống không phát lại công việc.' : 'Yêu cầu vẫn đang hoạt động.'
  } else if (state === 'completed') {
    label = `Lượt đã kết thúc${toolErrors ? ' · có lỗi công cụ cần kiểm tra' : savedText ? ` · ${savedText}` : ''}`
    detail += toolErrors ? 'Có lần gọi công cụ thất bại. Kiểm tra phản hồi và hoạt động; lượt kết thúc không chứng minh mọi thay đổi đã thành công.'
      : 'Lượt đã kết thúc. Chỉ biên nhận lưu hợp lệ xác nhận cập nhật slide; file nháp chưa phải kết quả đã xuất bản.'
  } else if (state === 'cancelled') {
    label = 'Đã dừng'
    detail += 'Phần hoàn tất được giữ; slide đang sửa dở giữ bản đã lưu trước đó. Hệ thống không tự tiếp tục.'
  } else if (state === 'unknown') {
    label = 'Công việc bị gián đoạn · kết quả chưa xác nhận'
    detail += 'Phần đã lưu được giữ. Hệ thống không tự tiếp tục; hãy gửi yêu cầu mới.'
  } else {
    const failure = failureFeedback(errorCode)
    label = failure.label
    detail += `${failure.detail} Phần hoàn tất vẫn được giữ; hệ thống không tự tiếp tục.`
  }
  return { label, detail, toolErrors }
}
