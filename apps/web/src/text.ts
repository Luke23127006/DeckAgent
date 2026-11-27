import type { ClientErrorCode } from './api/client.ts'

/** Shell copy of the React app. Every user-visible string of new React code lives here. */
export const appText = {
  appName: 'DeckAgent',
  loadingWorkspace: 'Đang mở không gian làm việc…',
  missingChat: 'Không tìm thấy chat này. Đã chuyển về màn hình chính.',
} as const

/** One Vietnamese label for each client error code. A raw Host message never becomes UI copy. */
export const errorText: Readonly<Record<ClientErrorCode, string>> = {
  APPROVAL_CONFLICT: 'Bước này đã có quyết định',
  APPROVAL_NOT_FOUND: 'Không tìm thấy bước cần cấp quyền',
  ATTACHMENT_CONFLICT: 'Tệp đã thay đổi',
  ATTACHMENT_COUNT_EXCEEDED: 'Quá nhiều tệp trong bản nháp',
  ATTACHMENT_NOT_FOUND: 'Không tìm thấy tệp trong chat này',
  ATTACHMENT_NOT_READY: 'Tệp đang được chuẩn bị',
  ATTACHMENT_NOT_SAVED: 'Chưa lưu được tệp',
  ATTACHMENT_REJECTED: 'Bản nháp có tệp chưa dùng được',
  ATTACHMENT_TOO_LARGE: 'Tệp quá lớn',
  ATTACHMENT_TYPE_UNSUPPORTED: 'Định dạng tệp chưa được nhận',
  ATTACHMENT_UNREADABLE: 'Không đọc được tệp',
  AUTH_REQUIRED: 'Kết nối này đã hết hiệu lực',
  BRIEF_LOCKED: 'Brief đã khóa cho deck đã xác nhận',
  BRIEF_PROPOSAL_REQUIRED: 'Chưa lưu được Brief',
  BRIEF_REPAIR_LIMIT: 'Chưa chuẩn bị được Brief hợp lệ',
  BRIEF_STALE: 'Brief đã thay đổi',
  CATALOG_UNAVAILABLE: 'Chưa đọc được danh sách model',
  CHANGES_CONNECTION_LOST: 'Kết nối cập nhật đã gián đoạn',
  CHANGES_REQUEST_FAILED: 'Chưa mở được kênh cập nhật',
  CHAT_UNREADABLE: 'Không mở được chat này',
  CONFIRMATION_CONFLICT: 'Lần xác nhận không khớp đề xuất hiện tại',
  CONNECTION_LOST: 'Kết nối bị gián đoạn',
  CONTEXT_LIMIT: 'Hội thoại vượt quá ngữ cảnh của model',
  CONTEXT_SUMMARY_FAILED: 'Không tóm tắt được hội thoại',
  CREDENTIAL_NOT_SAVED: 'Chưa lưu được key',
  CREDENTIAL_STORE_UNAVAILABLE: 'Chưa mở được kho lưu key',
  DESIGN_LAYOUT_INCOMPATIBLE: 'Nội dung chưa phù hợp với layout',
  DRAFT_CONFLICT: 'Bản nháp đã thay đổi',
  DRAFT_NOT_SAVED: 'Chưa lưu được bản nháp',
  DRAFT_TOO_LARGE: 'Bản nháp quá dài',
  GENERATION_FAILED: 'Chưa tạo xong deck',
  GENERATION_INCOMPLETE: 'Deck chưa hoàn tất',
  HOST_BUSY: 'DeckAgent đang chạy nhiều yêu cầu',
  HOST_CLOSED: 'DeckAgent đã dừng',
  HOST_REQUEST_FAILED: 'Yêu cầu tới Host không thành công',
  HOST_RESTARTED: 'Yêu cầu chưa xong khi DeckAgent dừng',
  HOST_STOPPED: 'Yêu cầu chưa xong khi DeckAgent dừng',
  IMAGE_INPUT_UNAVAILABLE: 'Model hoặc kết nối không nhận nội dung ảnh',
  IMAGE_PREPARATION_REQUIRED: 'Chưa chuẩn bị đủ ảnh bắt buộc',
  INVALID_PROVIDER: 'Cấu hình provider chưa hợp lệ',
  INVALID_REQUEST: 'Yêu cầu chưa hợp lệ',
  INVALID_RESPONSE: 'Chưa đọc được dữ liệu từ Host',
  MODEL_NOT_SELECTABLE: 'Model không còn chọn được',
  NEW_ENDPOINT_REQUIRES_KEY: 'Endpoint mới cần key',
  NO_SELECTABLE_MODEL: 'Chat chưa có model để chạy',
  OUTLINE_REPAIR_LIMIT: 'Chưa chuẩn bị được Outline hợp lệ',
  OUTLINE_STALE: 'Outline đã thay đổi',
  OUTLINE_UNAVAILABLE: 'Chưa tải được Outline',
  PARSING_LIMIT_EXCEEDED: 'Tệp vượt giới hạn đọc an toàn',
  PREFERENCES_STALE: 'Cài đặt hiển thị đã thay đổi',
  PROTOCOL_IMMUTABLE: 'Không đổi được protocol của provider đã lưu',
  PROVIDER_AUTH: 'Nhà cung cấp model từ chối key hoặc model',
  PROVIDER_BUSY: 'Provider đang bận',
  PROVIDER_CHECK_FAILED: 'Chưa kiểm tra được provider',
  PROVIDER_HTTP: 'Nhà cung cấp model báo lỗi',
  PROVIDER_ID_TAKEN: 'Provider này đã tồn tại',
  PROVIDER_KEY_REQUIRED: 'Cần key cho provider',
  PROVIDER_KEY_REFUSED: 'Provider từ chối key',
  PROVIDER_KEY_UNAVAILABLE: 'Key đã lưu không dùng được',
  PROVIDER_MODEL_UNAVAILABLE: 'Provider không tìm thấy model',
  PROVIDER_NAME_EXISTS: 'Tên provider đã có',
  PROVIDER_NO_ANSWER: 'Provider không trả lời',
  PROVIDER_NOT_FOUND: 'Không tìm thấy provider',
  PROVIDER_RATE_LIMIT: 'Đã đạt giới hạn sử dụng của nhà cung cấp',
  PROVIDER_TIMEOUT: 'Nhà cung cấp model phản hồi quá lâu',
  PROVIDER_UNSUPPORTED: 'Cấu hình provider chưa được hỗ trợ',
  PROVIDERS_STALE: 'Danh sách provider đã thay đổi',
  REQUEST_CLOSED: 'Yêu cầu đã kết thúc',
  REQUEST_EMPTY: 'Chưa có nội dung để gửi',
  REQUEST_FAILED: 'Yêu cầu chưa hoàn tất',
  REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu',
  REQUEST_NOT_SAVED: 'Không lưu được công việc của yêu cầu',
  REQUEST_TEXT_TOO_LONG: 'Yêu cầu quá dài',
  REQUEST_TIMEOUT: 'Yêu cầu chạy quá lâu',
  REQUESTS_UNAVAILABLE: 'Chưa thể gửi yêu cầu',
  RESEARCH_FREE_ONLY: 'Research chỉ nhận gói miễn phí',
  RESEARCH_IMAGE_ARGUMENTS_INVALID: 'Lệnh tìm hoặc chọn ảnh chưa hợp lệ',
  RESEARCH_IMAGE_CONTEXT_REQUIRED: 'Chưa khôi phục được trạng thái tìm ảnh',
  RESEARCH_IMAGE_SELECTION_STALE: 'Vị trí hoặc lựa chọn ảnh đã thay đổi',
  RESEARCH_KEY_REJECTED: 'Tavily từ chối key',
  RESEARCH_KEY_UNAVAILABLE: 'Chưa đọc được key research',
  RESEARCH_NOT_SAVED: 'Chưa lưu được key research',
  RESEARCH_QUOTA_EXHAUSTED: 'Không còn quota miễn phí',
  RESEARCH_UNAVAILABLE: 'Chưa dùng được research',
  RUNTIME_CONFIG_UNSAFE: 'OpenCode không chạy với cấu hình an toàn',
  RUNTIME_FAILED: 'Yêu cầu chưa hoàn tất',
  RUNTIME_INCOMPLETE: 'Model chưa trả lời xong',
  RUNTIME_PROTOCOL: 'Không đọc được kết quả của OpenCode',
  RUNTIME_UNAVAILABLE: 'Runtime OpenCode đi kèm chưa sẵn sàng',
  RUNTIME_VERSION_UNSUPPORTED: 'Phiên bản OpenCode CLI không được hỗ trợ',
  SESSION_BUSY: 'Chat đang có yêu cầu hoạt động',
  SESSION_NOT_FOUND: 'Không tìm thấy chat',
  SESSION_UNAVAILABLE: 'Chat này chưa dùng được',
  SETTINGS_REQUEST_FAILED: 'Chưa đọc được cài đặt',
  SLIDE_CORRECTION_LIMIT: 'Slide đã hết lượt sửa trong yêu cầu này',
  SOURCE_CHANGED: 'Nguồn đã thay đổi',
  SOURCE_UNAVAILABLE: 'Không đọc được nguồn',
  UPLOAD_CANCELLED: 'Việc tải tệp đã dừng',
  WORKSPACES_STALE: 'Danh sách workspace đã thay đổi',
  WORKSPACE_DEFAULT: 'Không xóa được workspace mặc định',
  WORKSPACE_FOLDER_IN_USE: 'Thư mục đang được workspace khác dùng',
  WORKSPACE_FOLDER_INVALID: 'Đường dẫn workspace chưa hợp lệ',
  WORKSPACE_FOLDER_REFUSED: 'Không có quyền đọc thư mục workspace',
  WORKSPACE_FOLDER_REQUIRED: 'Chưa chọn thư mục workspace',
  WORKSPACE_FOLDER_UNREADABLE: 'Không đọc được thư mục workspace',
  WORKSPACE_NAME_EMPTY: 'Tên workspace đang trống',
  WORKSPACE_NAME_TOO_LONG: 'Tên workspace quá dài',
  WORKSPACE_NOT_FOUND: 'Không tìm thấy workspace',
  WORKSPACE_REQUEST_ACTIVE: 'Workspace có yêu cầu đang chạy',
}

export function formatClientError(code: ClientErrorCode): string {
  return errorText[code]
}
export const settingsText = {
  protocols: {
    'chat-completions': 'OpenAI Chat Completions',
    responses: 'OpenAI Responses',
    'anthropic-messages': 'Anthropic Messages',
    gemini: 'Google Gemini',
  },
  title: 'Cài đặt model',
  back: 'Quay lại chat',
  loading: 'Đang đọc cài đặt…',
  retry: 'Thử lại',
  custom: 'Custom model API',
  savedProviders: 'Provider đã lưu',
  addProvider: 'Thêm provider',
  providerId: 'Provider ID',
  name: 'Tên hiển thị',
  protocol: 'API protocol',
  url: 'Base URL',
  key: 'API key',
  removeKey: 'Gỡ key đã lưu',
  models: 'Model ID',
  save: 'Lưu provider',
  remove: 'Xóa cấu hình',
  catalog: 'Lấy model catalog',
  saved: 'Đã lưu cấu hình. Chọn model trong chat để sử dụng.',
  keyHelp: 'Để trống để giữ key đã lưu. Key không được hiển thị lại sau khi lưu.',
  keyAvailable: 'Có key',
  keyUnavailable: 'Key đã lưu không dùng được',
  noKey: 'Chưa có key',
  noKeyStore: 'Máy này chưa có kho lưu key được bảo vệ. Provider không cần key vẫn dùng được.',
  discard: 'Bỏ các thay đổi chưa lưu?',
  confirmRemove: 'Xóa provider này? Lịch sử chat vẫn được giữ.',
  theme: 'Giao diện',
  light: 'Sáng',
  dark: 'Tối',
  system: 'Hệ thống',
  catalogHelp: 'Catalog không bảo đảm quyền truy cập hoặc tương thích. Bạn có thể nhập model ID bằng tay.',
} as const

const workspaceRefusals: Readonly<Record<string, string>> = {
  'drive-root': 'đây là thư mục gốc của ổ đĩa',
  system: 'đây là thư mục hệ thống của Windows, hoặc chứa thư mục đó',
  'user-folder': 'đây là thư mục người dùng của bạn',
  'key-folder': 'thư mục này chứa khóa hoặc thông tin đăng nhập',
  'deckagent-data': 'thư mục này chứa, hoặc nằm trong, dữ liệu của DeckAgent',
}

export const workspaceText = {
  label: 'Workspace',
  defaultSuffix: ' · mặc định',
  checkFolderSuffix: ' · cần kiểm tra thư mục',
  defaultTitle: 'Workspace mặc định, không có thư mục dự án',
  add: '+ Thư mục',
  addTitle: 'Thêm workspace cho một thư mục',
  rename: 'Đổi tên',
  relink: 'Đổi thư mục',
  remove: 'Gỡ',
  removeTitle: 'Gỡ workspace',
  adopt: 'Dùng thư mục này',
  save: 'Lưu',
  cancel: 'Hủy',
  renameHeading: 'Đổi tên workspace',
  renameHelp: 'Tên dài tối đa 100 ký tự. Đổi tên giữ nguyên thư mục dự án và các chat.',
  nameLabel: 'Tên workspace',
  addHeading: 'Thêm workspace cho một thư mục',
  relinkHeading: 'Chọn thư mục khác cho workspace',
  folderHelp:
    'Nhập đường dẫn đầy đủ của thư mục trên máy này. DeckAgent không đọc file nào của thư mục khi thiết lập, không gửi gì tới model và không ghi gì vào thư mục.',
  folderLabel: 'Đường dẫn thư mục',
  confirmRemove: (name: string) =>
    `Gỡ workspace “${name}”? Thư mục dự án và mọi file trong đó được giữ nguyên. Các chat của workspace được giữ lại trong nhóm “Chat chưa nhóm”, cùng hội thoại, deck và model đã chọn.`,
  /** FR-074 and FR-142: name the workspace and say what the user does next; name no unknown cause. */
  unreadableFolder: (name: string) =>
    `Workspace “${name}”: không đọc được các file của thư mục dự án. Hãy đưa thư mục trở lại, cấp lại quyền đọc, hoặc chọn thư mục khác. Các chat vẫn mở được.`,
  differentFolder: (name: string) =>
    `Workspace “${name}”: ở vị trí của thư mục dự án giờ là một thư mục khác. DeckAgent không đọc file nào của thư mục đó. Các chat vẫn mở được.`,
} as const

/** User-facing text for a refused workspace change: what failed and what to do next. Never a raw message. */
export function workspaceErrorText(code: ClientErrorCode, detail: Readonly<Record<string, string | boolean>>): string {
  switch (code) {
    case 'WORKSPACE_FOLDER_REQUIRED':
      return 'Chưa chọn thư mục. Không có workspace nào được thiết lập.'
    case 'WORKSPACE_FOLDER_INVALID':
      return 'Hãy nhập đường dẫn đầy đủ tới thư mục, ví dụ C:\\Users\\ten\\Documents\\du-an.'
    case 'WORKSPACE_FOLDER_UNREADABLE':
      return 'Không đọc được thư mục này. Kiểm tra đường dẫn và quyền truy cập, hoặc chọn thư mục khác.'
    case 'WORKSPACE_FOLDER_REFUSED': {
      const why = typeof detail.reason === 'string' ? workspaceRefusals[detail.reason] : undefined
      const inside =
        detail.allowInside === true ? ' Bạn có thể chọn một thư mục bên trong nó.' : ' Hãy chọn thư mục khác.'
      return `Thư mục này không thể là thư mục dự án${why ? `: ${why}` : ''}.${inside}`
    }
    case 'WORKSPACE_FOLDER_IN_USE':
      return typeof detail.workspaceName === 'string'
        ? `Workspace “${detail.workspaceName}” đang dùng thư mục này. Hãy chọn workspace đó, hoặc chọn thư mục khác.`
        : 'Một workspace khác đang dùng thư mục này. Hãy chọn workspace đó, hoặc chọn thư mục khác.'
    case 'WORKSPACE_DEFAULT':
      return 'Workspace mặc định không có thư mục dự án và không gỡ được.'
    case 'WORKSPACE_NAME_EMPTY':
      return 'Tên workspace cần ít nhất một ký tự. Tên cũ được giữ nguyên.'
    case 'WORKSPACE_NAME_TOO_LONG':
      return 'Tên workspace dài tối đa 100 ký tự. Tên cũ được giữ nguyên.'
    case 'WORKSPACE_NOT_FOUND':
      return 'Workspace này không còn được thiết lập. Danh sách đã được làm mới.'
    case 'WORKSPACES_STALE':
      return 'Danh sách workspace vừa thay đổi ở nơi khác. Danh sách đã được làm mới, hãy kiểm tra rồi thử lại.'
    default:
      return 'Không thay đổi được workspace. Kiểm tra kết nối với DeckAgent rồi thử lại.'
  }
}

export const chatListText = {
  searchPlaceholder: 'Tìm chat theo từ…',
  searchLabel: 'Tìm chat trước theo từ',
  noMatch: 'Không có chat nào khớp với các từ đã nhập.',
  empty: 'Chưa có chat trước.',
  ungrouped: 'Chat chưa nhóm',
  unknownTime: 'Chưa rõ thời gian cập nhật',
  unreadable: 'Không mở được chat này',
  slidesUnknown: 'Chưa rõ slide',
  hasSlides: 'Có slide',
  noSlides: 'Chưa có slide',
  unreadableName: 'Chat không đọc được',
  newChat: 'Chat mới',
  untitled: 'Chat chưa có tên',
  working: ' · Đang làm việc…',
} as const
