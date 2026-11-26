import { ManagementError } from '../../transport/index.ts'

/** What failed and what to do next. Provider messages are never shown (they can echo a key). */
export function saveFailure(error: unknown): string {
  const code = error instanceof Error ? error.message : ''
  const detail = error instanceof ManagementError ? error.detail : {}
  if (code === 'PROVIDER_ID_TAKEN')
    return `Provider ID này đã thuộc về ${typeof detail.provider === 'string' ? detail.provider : 'một cấu hình khác'}${detail.builtIn ? ' (provider có sẵn)' : ''}. Hãy chọn provider ID khác. Chưa lưu gì.`
  if (code === 'PROVIDER_KEY_REQUIRED') return 'Provider này cần key. Nhập key của tài khoản bạn. Chưa lưu gì.'
  if (code === 'PROVIDER_KEY_REFUSED')
    return 'Provider từ chối key hoặc quyền truy cập. Kiểm tra key rồi lưu lại. Chưa lưu gì; key đã lưu trước đó được giữ.'
  if (code === 'PROVIDER_NO_ANSWER')
    return `Provider không trả lời${detail.reason === 'certificate' ? ' (chứng chỉ bảo mật không hợp lệ)' : ''}. Kiểm tra Base URL và kết nối mạng. Chưa lưu gì.`
  if (code === 'PROVIDER_CHECK_FAILED')
    return `Provider không chấp nhận lần kiểm tra${detail.reason === 'rate-limit' ? ' (đã đạt giới hạn sử dụng)' : typeof detail.reason === 'string' && detail.reason.startsWith('http-') ? ` (HTTP ${detail.reason.slice(5)})` : ''}. Kiểm tra Base URL và API protocol. Chưa lưu gì.`
  if (code === 'CREDENTIAL_STORE_UNAVAILABLE')
    return 'Máy này không có nơi lưu key được bảo vệ mà DeckAgent hỗ trợ. Key không được lưu dạng văn bản thường. Chưa lưu gì.'
  if (code === 'CREDENTIAL_NOT_SAVED') return 'Không lưu được key vào nơi lưu key của máy. Chưa lưu gì; thử lại.'
  if (code === 'PROVIDER_BUSY') return 'Provider đang được sử dụng. Đợi yêu cầu kết thúc trước khi xóa.'
  if (code === 'NEW_ENDPOINT_REQUIRES_KEY')
    return 'Nhập key cho Base URL mới hoặc chọn gỡ key đã lưu. Key cũ không được gửi tới địa chỉ mới.'
  if (code === 'PROVIDER_NAME_EXISTS') return 'Hãy chọn tên hiển thị không trùng.'
  if (code === 'PROTOCOL_IMMUTABLE') return 'Không đổi được API protocol của cấu hình đã lưu. Hãy tạo cấu hình mới.'
  if (code === 'INVALID_PROVIDER' && detail.field === 'providerId')
    return 'Provider ID chỉ nhận chữ không dấu, số, dấu chấm, gạch dưới và gạch nối; không có dấu cách. Ví dụ: river-ai. Tên hiển thị vẫn có thể là River AI.'
  if (code === 'INVALID_PROVIDER')
    return 'Thông tin chưa hợp lệ. Base URL phải là HTTPS, hoặc HTTP tới chính máy này. Chưa lưu gì.'
  if (code === 'AUTH_REQUIRED')
    return 'Phiên kết nối Host không còn hợp lệ (AUTH_REQUIRED). Mở lại liên kết do Host hiện tại cung cấp rồi thử lại.'
  if (code === 'PROVIDERS_STALE')
    return 'Cấu hình provider vừa thay đổi ở nơi khác. Cài đặt đã được làm mới, hãy kiểm tra rồi thử lại. Chưa lưu gì.'
  if (code === 'SETTINGS_REQUEST_FAILED')
    return 'Host không xử lý được yêu cầu lưu (SETTINGS_REQUEST_FAILED). Kiểm tra kết nối và mở lại cài đặt trước khi thử lại.'
  if (code === 'CATALOG_UNAVAILABLE')
    return 'Chưa lấy được model catalog (CATALOG_UNAVAILABLE). Bạn vẫn có thể nhập model ID bằng tay; cấu hình đã lưu được giữ.'
  if (code === 'INVALID_RESPONSE')
    return 'Chưa đọc được phản hồi hợp lệ từ Host (INVALID_RESPONSE). Mở lại cài đặt để kiểm tra kết quả đã lưu.'
  return 'Chưa xác nhận được kết quả lưu. Kiểm tra kết nối và mở lại cài đặt để đối chiếu trước khi thử lại.'
}
