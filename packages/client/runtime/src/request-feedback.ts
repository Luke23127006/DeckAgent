import type { RequestStatus, StoredActivity } from '@deckagent/host-api'

const errors: Readonly<Record<string, readonly [string, string]>> = {
  CHAT_UNREADABLE: ['Không mở được chat này', 'Dữ liệu đã lưu của chat không đọc được. Chat vẫn được giữ trong danh sách; chat bạn đang mở không thay đổi.'],
  SESSION_NOT_FOUND: ['Không tìm thấy chat', 'Chat này không còn trong dữ liệu của DeckAgent. Danh sách chat đã được làm mới.'],
  REQUESTS_UNAVAILABLE: ['Chưa thể gửi yêu cầu', 'DeckAgent chưa kết nối runtime. Bản nháp được giữ nguyên.'],
  RUNTIME_UNAVAILABLE: ['Chưa tìm thấy OpenCode CLI', 'Cài OpenCode CLI đúng phiên bản rồi khởi động lại DeckAgent với --opencode <đường dẫn>. Bản nháp được giữ nguyên.'],
  RUNTIME_VERSION_UNSUPPORTED: ['Phiên bản OpenCode CLI không được hỗ trợ', 'Cài đúng phiên bản OpenCode CLI mà DeckAgent hỗ trợ rồi khởi động lại DeckAgent. Bản nháp được giữ nguyên.'],
  RUNTIME_CONFIG_UNSAFE: ['OpenCode không chạy với cấu hình an toàn', 'DeckAgent đã dừng trước khi gọi model vì công cụ hoặc plugin không bị chặn. Kiểm tra phiên bản OpenCode CLI.'],
  RUNTIME_PROTOCOL: ['Không đọc được kết quả của OpenCode', 'Phần đã lưu được giữ. Kiểm tra phiên bản OpenCode CLI rồi gửi yêu cầu mới.'],
  RUNTIME_INCOMPLETE: ['Model chưa trả lời xong', 'Phần đã lưu được giữ. Gửi yêu cầu mới khi sẵn sàng; hệ thống không tự thử lại.'],
  RUNTIME_FAILED: ['Yêu cầu chưa hoàn tất', 'OpenCode dừng khi chưa xong. Kiểm tra kết nối và cài đặt model rồi gửi yêu cầu mới.'],
  REQUEST_TIMEOUT: ['Yêu cầu chạy quá lâu', 'Phần đã lưu được giữ. Kiểm tra kết nối rồi gửi yêu cầu mới.'],
  REQUEST_NOT_SAVED: ['Không lưu được công việc của yêu cầu', 'DeckAgent đã dừng yêu cầu để không mất dữ liệu. Trạng thái đã lưu cuối cùng được giữ.'],
  HOST_RESTARTED: ['Yêu cầu chưa xong khi DeckAgent dừng', 'Phần đã lưu được giữ. Hệ thống không tự chạy lại; hãy gửi yêu cầu mới.'],
  HOST_STOPPED: ['Yêu cầu chưa xong khi DeckAgent dừng', 'Phần đã lưu được giữ. Hệ thống không tự chạy lại; hãy gửi yêu cầu mới.'],
  CONTEXT_LIMIT: ['Hội thoại vượt quá ngữ cảnh của model', 'Toàn bộ hội thoại vẫn được giữ. Hãy mở chat mới hoặc chọn model có ngữ cảnh lớn hơn.'],
  // FR-079: the summary could not be written; the request does not finish and the conversation stays as it was.
  CONTEXT_SUMMARY_FAILED: ['Không tóm tắt được hội thoại', 'Hội thoại dài hơn ngữ cảnh của model và không tóm tắt được. Hội thoại được giữ nguyên. Hãy chọn model có ngữ cảnh lớn hơn cho chat này hoặc mở chat mới.'],
  NO_SELECTABLE_MODEL: ['Chat chưa có model để chạy', 'Chọn một model trong chat này, hoặc thêm provider và model trong Cài đặt model. Bản nháp được giữ nguyên.'],
  PROVIDER_KEY_UNAVAILABLE: ['Key đã lưu không dùng được', 'Nhập lại key trong Cài đặt model. Bản nháp được giữ nguyên.'],
  PROVIDER_UNSUPPORTED: ['Cấu hình provider chưa được hỗ trợ', 'Kiểm tra API protocol và key trong Cài đặt model. Hệ thống không tự đổi model.'],
  PROVIDER_MODEL_UNAVAILABLE: ['Provider không tìm thấy model', 'Kiểm tra model ID trong Cài đặt model. Hệ thống không tự đổi model.'],
  REQUEST_TEXT_TOO_LONG: ['Yêu cầu quá dài', 'Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.'],
  HOST_BUSY: ['DeckAgent đang chạy nhiều yêu cầu', 'Đợi một yêu cầu kết thúc rồi gửi lại.'],
  REQUEST_FAILED: ['Yêu cầu chưa hoàn tất', 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.'],
  PROVIDER_HTTP: ['Nhà cung cấp model báo lỗi', 'Kiểm tra kết nối và cấu hình trong Cài đặt model rồi gửi lại. Hệ thống không tự thử lại.'],
  PROVIDER_TIMEOUT: ['Nhà cung cấp model phản hồi quá lâu', 'Kiểm tra kết nối rồi gửi yêu cầu mới khi sẵn sàng.'],
  PROVIDER_AUTH: ['Nhà cung cấp model từ chối key hoặc model', 'Kiểm tra API key và quyền dùng model trong Cài đặt model.'],
  PROVIDER_RATE_LIMIT: ['Đã đạt giới hạn sử dụng của nhà cung cấp', 'Chờ hoặc kiểm tra giới hạn tài khoản trước khi gửi yêu cầu mới. Model không tự thay đổi.'],
  MODEL_NOT_SELECTABLE: ['Model không còn chọn được', 'Chọn model khác trong chat này. Chưa gửi yêu cầu.'],
  AUTH_REQUIRED: ['Kết nối này đã hết hiệu lực', 'Mở lại trình duyệt từ Host đang chạy.'],
  SESSION_BUSY: ['Chat đang có yêu cầu hoạt động', 'Đợi hoàn tất hoặc dừng yêu cầu trước khi gửi yêu cầu khác.'],
  WORKSPACE_REQUEST_ACTIVE: ['Workspace có yêu cầu đang chạy', 'Đợi yêu cầu kết thúc hoặc dừng nó trước. Không yêu cầu nào bị dừng.'],
}

/** Raw provider/error messages never become UI copy. Unknown codes use a fixed fallback. */
export function failureFeedback(code?: string) {
  const known = typeof code === 'string' && Object.hasOwn(errors, code) ? errors[code] : undefined
  return { label: known?.[0] ?? 'Yêu cầu chưa hoàn tất',
    detail: known?.[1] ?? 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
    code: known ? code : undefined }
}

/** The settings shortcut is offered only when the failure copy itself sends the user to settings. */
export function offersSettings(code?: string): boolean {
  return /cài đặt model/i.test(failureFeedback(code).detail)
}

/** What the request row says. Stopped is not failure (FR-018); not finished says why when it is known (FR-019). */
export function requestFeedback(state: RequestStatus, errorCode: string | undefined, records: readonly StoredActivity[], disconnected: boolean) {
  const toolErrors = records.some(entry => entry.type === 'tool' && entry.status === 'failed')
  let label: string
  let detail: string
  if (state === 'active' || state === 'waiting_approval') {
    const current = records.findLast(entry => entry.status === 'running')
    label = disconnected ? 'Kết nối bị gián đoạn' : current?.type === 'model' ? 'Đang chờ model trả lời' : 'Đang làm việc…'
    detail = disconnected ? 'Tiến độ không được cập nhật trực tiếp. Yêu cầu vẫn chạy trong DeckAgent; đang kết nối lại để đọc phần đã lưu.'
      : 'Yêu cầu vẫn đang hoạt động. Bạn có thể dừng yêu cầu.'
  } else if (state === 'completed') {
    label = `Đã xong${toolErrors ? ' · có bước không thực hiện được' : ''}`
    detail = toolErrors ? 'Có bước công cụ thất bại; yêu cầu vẫn kết thúc. Kiểm tra phản hồi bên dưới.' : 'Yêu cầu đã xong. Bạn có thể gửi yêu cầu mới.'
  } else if (state === 'stopped') {
    label = 'Đã dừng'
    detail = 'Bạn đã dừng yêu cầu. Phần đã hoàn tất được giữ; hệ thống không tự tiếp tục.'
  } else {
    const failure = failureFeedback(errorCode)
    label = `Chưa xong · ${failure.label}`
    detail = `${failure.detail} Phần hoàn tất vẫn được giữ; hệ thống không tự chạy lại.`
  }
  return { label, detail, toolErrors }
}
