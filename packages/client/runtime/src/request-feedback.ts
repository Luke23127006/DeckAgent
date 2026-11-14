import type { RequestStatus, StoredActivity } from '@deckagent/host-api'

const errors: Readonly<Record<string, readonly [string, string]>> = {
  RESEARCH_UNAVAILABLE: [
    'Chưa dùng được research',
    'Kiểm tra cấu hình Tavily hoặc bỏ chọn nguồn công khai rồi gửi lại. Bản nháp được giữ.',
  ],
  RESEARCH_KEY_UNAVAILABLE: ['Chưa đọc được key research', 'Cấu hình Tavily trong Cài đặt tìm kiếm rồi thử lại.'],
  RESEARCH_KEY_REJECTED: ['Tavily từ chối key', 'Kiểm tra key trong Cài đặt tìm kiếm rồi thử lại.'],
  RESEARCH_FREE_ONLY: [
    'Research chỉ nhận gói miễn phí',
    'Giữ Tavily ở gói Researcher, tắt PAYG; ứng dụng không tự nâng cấp.',
  ],
  RESEARCH_QUOTA_EXHAUSTED: [
    'Không còn quota miễn phí',
    'Chờ quota mới hoặc bỏ chọn research. Không chuyển sang dịch vụ trả phí.',
  ],
  IMAGE_INPUT_UNAVAILABLE: [
    'Model hoặc kết nối không nhận nội dung ảnh',
    'Tệp đã gửi được giữ. Chọn model nhận ảnh hoặc cung cấp bản có chữ rồi gửi yêu cầu mới; hệ thống không tự chạy OCR hay đổi model.',
  ],
  DRAFT_CONFLICT: [
    'Bản nháp đã thay đổi',
    'Giữ nội dung đang soạn, mở lại chat để đối chiếu bản mới nhất rồi gửi lại.',
  ],
  DRAFT_NOT_SAVED: ['Chưa lưu được bản nháp', 'Kiểm tra kết nối. Nội dung đang soạn được giữ để thử lại.'],
  ATTACHMENT_NOT_FOUND: [
    'Không tìm thấy tệp trong chat này',
    'Mở lại chat để đọc trạng thái mới nhất; thêm lại tệp khi cần.',
  ],
  ATTACHMENT_NOT_READY: ['Tệp đang được chuẩn bị', 'Chờ tệp sẵn sàng hoặc bỏ tệp khỏi bản nháp.'],
  ATTACHMENT_REJECTED: ['Bản nháp có tệp chưa dùng được', 'Xem lý do tại tệp, rồi bỏ hoặc thay tệp trước khi gửi.'],
  ATTACHMENT_COUNT_EXCEEDED: [
    'Quá nhiều tệp trong bản nháp',
    'Mỗi yêu cầu nhận tối đa 10 tệp mới. Bỏ bớt tệp rồi thử lại.',
  ],
  ATTACHMENT_TOO_LARGE: ['Tệp quá lớn', 'Mỗi tệp nhận tối đa 20 MiB. Giảm dung lượng rồi thêm lại.'],
  ATTACHMENT_UNREADABLE: [
    'Không đọc được tệp',
    'Kiểm tra tài liệu hoặc cung cấp bản có lớp chữ; bản này chưa chạy OCR riêng.',
  ],
  ATTACHMENT_TYPE_UNSUPPORTED: ['Định dạng tệp chưa được nhận', 'Dùng TXT, MD, PDF, DOCX, PNG, JPEG, PPTX hoặc ZIP.'],
  ATTACHMENT_NOT_SAVED: [
    'Chưa lưu được tệp',
    'Kiểm tra thư mục dữ liệu và kết nối. Các phần khác của bản nháp được giữ.',
  ],
  PARSING_LIMIT_EXCEEDED: ['Tệp vượt giới hạn đọc an toàn', 'Chia tài liệu thành phần nhỏ hơn rồi thêm lại.'],
  UPLOAD_CANCELLED: ['Việc tải tệp đã dừng', 'Bỏ tệp chưa hoàn tất rồi thêm lại khi cần.'],
  REQUEST_EMPTY: ['Chưa có nội dung để gửi', 'Nhập yêu cầu hoặc thêm ít nhất một tệp sẵn sàng.'],
  APPROVAL_NOT_FOUND: [
    'Không tìm thấy bước cần cấp quyền',
    'Mở lại chat để đọc trạng thái mới nhất; không có quyền mới nào được cấp.',
  ],
  APPROVAL_CONFLICT: [
    'Bước này đã có quyết định',
    'Một giao diện khác có thể đã trả lời. Đọc lại trạng thái yêu cầu trước khi tiếp tục.',
  ],
  REQUEST_CLOSED: [
    'Yêu cầu đã kết thúc',
    'Không thể cấp thêm quyền cho yêu cầu này. Gửi yêu cầu mới nếu vẫn cần công việc đó.',
  ],
  SOURCE_CHANGED: [
    'Nguồn đã thay đổi',
    'Đường dẫn hoặc file không còn khớp với quyền đang có. Kiểm tra nguồn rồi gửi yêu cầu mới.',
  ],
  SOURCE_UNAVAILABLE: [
    'Không đọc được nguồn',
    'Kiểm tra file hoặc project folder của workspace. Không có file khác được dùng thay thế.',
  ],
  CHAT_UNREADABLE: [
    'Không mở được chat này',
    'Dữ liệu đã lưu của chat không đọc được. Chat vẫn được giữ trong danh sách; chat bạn đang mở không thay đổi.',
  ],
  SESSION_NOT_FOUND: [
    'Không tìm thấy chat',
    'Chat này không còn trong dữ liệu của DeckAgent. Danh sách chat đã được làm mới.',
  ],
  REQUESTS_UNAVAILABLE: ['Chưa thể gửi yêu cầu', 'DeckAgent chưa kết nối runtime. Bản nháp được giữ nguyên.'],
  RUNTIME_UNAVAILABLE: [
    'Chưa tìm thấy OpenCode CLI',
    'Cài OpenCode CLI đúng phiên bản rồi khởi động lại DeckAgent với --opencode <đường dẫn>. Bản nháp được giữ nguyên.',
  ],
  RUNTIME_VERSION_UNSUPPORTED: [
    'Phiên bản OpenCode CLI không được hỗ trợ',
    'Cài đúng phiên bản OpenCode CLI mà DeckAgent hỗ trợ rồi khởi động lại DeckAgent. Bản nháp được giữ nguyên.',
  ],
  RUNTIME_CONFIG_UNSAFE: [
    'OpenCode không chạy với cấu hình an toàn',
    'DeckAgent đã dừng trước khi gọi model vì công cụ hoặc plugin không bị chặn. Kiểm tra phiên bản OpenCode CLI.',
  ],
  RUNTIME_PROTOCOL: [
    'Không đọc được kết quả của OpenCode',
    'Phần đã lưu được giữ. Kiểm tra phiên bản OpenCode CLI rồi gửi yêu cầu mới.',
  ],
  RUNTIME_INCOMPLETE: [
    'Model chưa trả lời xong',
    'Phần đã lưu được giữ. Gửi yêu cầu mới khi sẵn sàng; hệ thống không tự thử lại.',
  ],
  RUNTIME_FAILED: [
    'Yêu cầu chưa hoàn tất',
    'OpenCode dừng khi chưa xong. Kiểm tra kết nối và cài đặt model rồi gửi yêu cầu mới.',
  ],
  REQUEST_TIMEOUT: ['Yêu cầu chạy quá lâu', 'Phần đã lưu được giữ. Kiểm tra kết nối rồi gửi yêu cầu mới.'],
  REQUEST_NOT_SAVED: [
    'Không lưu được công việc của yêu cầu',
    'DeckAgent đã dừng yêu cầu để không mất dữ liệu. Trạng thái đã lưu cuối cùng được giữ.',
  ],
  HOST_RESTARTED: [
    'Yêu cầu chưa xong khi DeckAgent dừng',
    'Phần đã lưu được giữ. Hệ thống không tự chạy lại; hãy gửi yêu cầu mới.',
  ],
  HOST_STOPPED: [
    'Yêu cầu chưa xong khi DeckAgent dừng',
    'Phần đã lưu được giữ. Hệ thống không tự chạy lại; hãy gửi yêu cầu mới.',
  ],
  CONTEXT_LIMIT: [
    'Hội thoại vượt quá ngữ cảnh của model',
    'Toàn bộ hội thoại vẫn được giữ. Hãy mở chat mới hoặc chọn model có ngữ cảnh lớn hơn.',
  ],
  // FR-079: the summary could not be written; the request does not finish and the conversation stays as it was.
  CONTEXT_SUMMARY_FAILED: [
    'Không tóm tắt được hội thoại',
    'Hội thoại dài hơn ngữ cảnh của model và không tóm tắt được. Hội thoại được giữ nguyên. Hãy chọn model có ngữ cảnh lớn hơn cho chat này hoặc mở chat mới.',
  ],
  NO_SELECTABLE_MODEL: [
    'Chat chưa có model để chạy',
    'Chọn một model trong chat này, hoặc thêm provider và model trong Cài đặt model. Bản nháp được giữ nguyên.',
  ],
  PROVIDER_KEY_UNAVAILABLE: [
    'Key đã lưu không dùng được',
    'Nhập lại key trong Cài đặt model. Bản nháp được giữ nguyên.',
  ],
  PROVIDER_UNSUPPORTED: [
    'Cấu hình provider chưa được hỗ trợ',
    'Kiểm tra API protocol và key trong Cài đặt model. Hệ thống không tự đổi model.',
  ],
  PROVIDER_MODEL_UNAVAILABLE: [
    'Provider không tìm thấy model',
    'Kiểm tra model ID trong Cài đặt model. Hệ thống không tự đổi model.',
  ],
  REQUEST_TEXT_TOO_LONG: ['Yêu cầu quá dài', 'Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.'],
  HOST_BUSY: ['DeckAgent đang chạy nhiều yêu cầu', 'Đợi một yêu cầu kết thúc rồi gửi lại.'],
  REQUEST_FAILED: [
    'Yêu cầu chưa hoàn tất',
    'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
  ],
  PROVIDER_HTTP: [
    'Nhà cung cấp model báo lỗi',
    'Kiểm tra kết nối và cấu hình trong Cài đặt model rồi gửi lại. Hệ thống không tự thử lại.',
  ],
  PROVIDER_TIMEOUT: ['Nhà cung cấp model phản hồi quá lâu', 'Kiểm tra kết nối rồi gửi yêu cầu mới khi sẵn sàng.'],
  PROVIDER_AUTH: [
    'Nhà cung cấp model từ chối key hoặc model',
    'Kiểm tra API key và quyền dùng model trong Cài đặt model.',
  ],
  PROVIDER_RATE_LIMIT: [
    'Đã đạt giới hạn sử dụng của nhà cung cấp',
    'Chờ hoặc kiểm tra giới hạn tài khoản trước khi gửi yêu cầu mới. Model không tự thay đổi.',
  ],
  MODEL_NOT_SELECTABLE: ['Model không còn chọn được', 'Chọn model khác trong chat này. Chưa gửi yêu cầu.'],
  AUTH_REQUIRED: ['Kết nối này đã hết hiệu lực', 'Mở lại trình duyệt từ Host đang chạy.'],
  SESSION_BUSY: ['Chat đang có yêu cầu hoạt động', 'Đợi hoàn tất hoặc dừng yêu cầu trước khi gửi yêu cầu khác.'],
  WORKSPACE_REQUEST_ACTIVE: [
    'Workspace có yêu cầu đang chạy',
    'Đợi yêu cầu kết thúc hoặc dừng nó trước. Không yêu cầu nào bị dừng.',
  ],
}

/** Raw provider/error messages never become UI copy. Unknown codes use a fixed fallback. */
export function failureFeedback(code?: string) {
  const known = typeof code === 'string' && Object.hasOwn(errors, code) ? errors[code] : undefined
  return {
    label: known?.[0] ?? 'Yêu cầu chưa hoàn tất',
    detail: known?.[1] ?? 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
    code: known ? code : undefined,
  }
}

/** The settings shortcut is offered only when the failure copy itself sends the user to settings. */
export function offersSettings(code?: string): boolean {
  return /cài đặt model/i.test(failureFeedback(code).detail)
}

/** What the request row says. Stopped is not failure (FR-018); not finished says why when it is known (FR-019). */
export function requestFeedback(
  state: RequestStatus,
  errorCode: string | undefined,
  records: readonly StoredActivity[],
  disconnected: boolean,
) {
  const toolErrors = records.some(entry => entry.type === 'tool' && entry.status === 'failed')
  let label: string
  let detail: string
  if (state === 'active' || state === 'waiting_approval') {
    const current = records.findLast(entry => entry.status === 'running')
    label = disconnected
      ? 'Kết nối bị gián đoạn'
      : state === 'waiting_approval'
        ? 'Đang chờ bạn cấp quyền'
        : current?.type === 'model'
          ? 'Đang chờ model trả lời'
          : 'Đang làm việc…'
    detail = disconnected
      ? 'Tiến độ không được cập nhật trực tiếp. Yêu cầu vẫn chạy trong DeckAgent; đang kết nối lại để đọc phần đã lưu.'
      : 'Yêu cầu vẫn đang hoạt động. Bạn có thể dừng yêu cầu.'
  } else if (state === 'completed') {
    label = `Đã xong${toolErrors ? ' · có bước không thực hiện được' : ''}`
    detail = toolErrors
      ? 'Có bước công cụ thất bại; yêu cầu vẫn kết thúc. Kiểm tra phản hồi bên dưới.'
      : 'Yêu cầu đã xong. Bạn có thể gửi yêu cầu mới.'
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
