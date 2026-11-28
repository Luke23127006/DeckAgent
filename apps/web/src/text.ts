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

/** Label, detail and whether the text sends the user to model settings, for each failure code of a request. */
export const requestFailureText: Readonly<Record<string, readonly [string, string, boolean?]>> = {
  OUTLINE_REPAIR_LIMIT: [
    'Chưa chuẩn bị được Outline hợp lệ',
    'Đã hết hai lượt sửa tự động. Xem các vị trí còn lỗi trong phản hồi; Outline và ảnh đã lưu trước đó được giữ nguyên.',
  ],
  DESIGN_LAYOUT_INCOMPATIBLE: [
    'Nội dung chưa phù hợp với layout',
    'Sửa Outline để nội dung vừa một layout trong catalog trước khi xác nhận. Nội dung và tiến độ đã lưu được giữ nguyên.',
  ],
  BRIEF_REPAIR_LIMIT: [
    'Chưa chuẩn bị được Brief hợp lệ',
    'Đã hết hai lượt sửa tự động trong yêu cầu này. Xem các trường còn lỗi trong phản hồi; Brief và Outline đã lưu được giữ nguyên.',
  ],
  BRIEF_PROPOSAL_REQUIRED: [
    'Chưa lưu được Brief',
    'Model chưa gửi được Brief hợp lệ. Yêu cầu đã kết thúc; thông tin đã lưu trước đó được giữ nguyên.',
  ],
  IMAGE_PREPARATION_REQUIRED: [
    'Chưa chuẩn bị đủ ảnh bắt buộc',
    'Sửa Outline để đổi truy vấn ảnh, chọn ảnh khác hoặc xác nhận ảnh không bắt buộc, rồi xem lại trước khi xác nhận.',
  ],
  RESEARCH_IMAGE_CONTEXT_REQUIRED: [
    'Chưa khôi phục được trạng thái tìm ảnh',
    'Đọc lại Outline hiện tại rồi gửi yêu cầu tiếp tục. Tiến độ đã lưu được giữ nguyên; lượt này chưa tìm ảnh.',
  ],
  RESEARCH_IMAGE_SELECTION_STALE: [
    'Vị trí hoặc lựa chọn ảnh đã thay đổi',
    'Đọc lại Outline hiện tại rồi yêu cầu tiếp tục phần ảnh còn thiếu. Kết quả đã lưu được giữ nguyên.',
  ],
  RESEARCH_IMAGE_ARGUMENTS_INVALID: [
    'Lệnh tìm hoặc chọn ảnh chưa hợp lệ',
    'Lượt xử lý chưa hoàn tất. Tiến độ đã lưu được giữ nguyên; gửi yêu cầu mới để tiếp tục.',
  ],
  SLIDE_CORRECTION_LIMIT: [
    'Slide đã hết lượt sửa trong yêu cầu này',
    'Xem lỗi kiểm tra và các slide đã lưu. Hệ thống dừng để tránh lặp sửa vô hạn.',
  ],
  BRIEF_STALE: ['Brief đã thay đổi', 'Mở lại chat để đọc Brief hiện tại trước khi gửi lại. Bản nháp được giữ.'],
  OUTLINE_STALE: ['Outline đã thay đổi', 'Đọc đề xuất hiện tại trước khi sửa hoặc xác nhận lại.'],
  CONFIRMATION_CONFLICT: [
    'Lần xác nhận không khớp đề xuất hiện tại',
    'Mở lại chat để đọc Outline và kết quả đã lưu trước khi thử lại.',
  ],
  BRIEF_LOCKED: ['Brief đã khóa cho deck đã xác nhận', 'Xem các slide đã lưu. Tạo chat mới nếu cần một deck khác.'],
  GENERATION_INCOMPLETE: [
    'Deck chưa hoàn tất',
    'Xem các slide đã lưu trong Preview và phần lỗi của yêu cầu. Hệ thống không tự chạy tiếp.',
  ],
  GENERATION_FAILED: [
    'Chưa tạo xong deck',
    'Kiểm tra hoạt động công cụ và các slide đã lưu. Hệ thống không tự chạy tiếp.',
  ],
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
    'Runtime OpenCode đi kèm chưa sẵn sàng',
    'Cài lại dependencies hoặc khôi phục bộ cài DeckAgent rồi khởi động lại. Nếu đã chỉ định runtime riêng, kiểm tra đường dẫn đó. Bản nháp được giữ nguyên.',
  ],
  RUNTIME_VERSION_UNSUPPORTED: [
    'Phiên bản OpenCode CLI không được hỗ trợ',
    'Khôi phục runtime đi kèm DeckAgent rồi khởi động lại. Nếu đã chỉ định runtime riêng, kiểm tra phiên bản và khả năng chạy của nó. Bản nháp được giữ nguyên.',
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
    true,
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
    true,
  ],
  PROVIDER_KEY_UNAVAILABLE: [
    'Key đã lưu không dùng được',
    'Nhập lại key trong Cài đặt model. Bản nháp được giữ nguyên.',
    true,
  ],
  PROVIDER_UNSUPPORTED: [
    'Cấu hình provider chưa được hỗ trợ',
    'Kiểm tra API protocol và key trong Cài đặt model. Hệ thống không tự đổi model.',
    true,
  ],
  PROVIDER_MODEL_UNAVAILABLE: [
    'Provider không tìm thấy model',
    'Kiểm tra model ID trong Cài đặt model. Hệ thống không tự đổi model.',
    true,
  ],
  REQUEST_TEXT_TOO_LONG: ['Yêu cầu quá dài', 'Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.'],
  HOST_BUSY: ['DeckAgent đang chạy nhiều yêu cầu', 'Đợi một yêu cầu kết thúc rồi gửi lại.'],
  REQUEST_FAILED: [
    'Yêu cầu chưa hoàn tất',
    'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
    true,
  ],
  INVALID_RESPONSE: [
    'Chưa đọc được dữ liệu từ Host',
    'Tải lại giao diện hoặc kết nối lại để đọc phần đã lưu. Kiểm tra trạng thái yêu cầu trước khi gửi lại.',
  ],
  OUTLINE_UNAVAILABLE: [
    'Chưa tải được Outline',
    'Kết nối lại để đọc Outline đã lưu. Kiểm tra trạng thái yêu cầu trước khi gửi lại.',
  ],
  PROVIDER_HTTP: [
    'Nhà cung cấp model báo lỗi',
    'Kiểm tra kết nối và cấu hình trong Cài đặt model rồi gửi lại. Hệ thống không tự thử lại.',
    true,
  ],
  PROVIDER_TIMEOUT: ['Nhà cung cấp model phản hồi quá lâu', 'Kiểm tra kết nối rồi gửi yêu cầu mới khi sẵn sàng.'],
  PROVIDER_AUTH: [
    'Nhà cung cấp model từ chối key hoặc model',
    'Kiểm tra API key và quyền dùng model trong Cài đặt model.',
    true,
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

/** The text of a failure code. Raw provider or error messages never become UI copy; an unknown code uses a fixed text. */
export function failureFeedback(code?: string): {
  readonly label: string
  readonly detail: string
  readonly code: string | undefined
} {
  const known =
    typeof code === 'string' && Object.hasOwn(requestFailureText, code) ? requestFailureText[code] : undefined
  return {
    label: known?.[0] ?? 'Yêu cầu chưa hoàn tất',
    detail: known?.[1] ?? 'Kiểm tra phần đã lưu, kết nối và cài đặt model trước khi gửi yêu cầu mới.',
    code: known ? code : undefined,
  }
}

/** Whether the failure text of `code` sends the user to model settings. An unknown code does. */
export function failureOffersSettings(code?: string): boolean {
  if (typeof code === 'string' && Object.hasOwn(requestFailureText, code)) return requestFailureText[code]?.[2] === true
  return true
}

export const activityText = {
  outcomes: {
    running: 'đang chạy',
    completed: 'hoàn tất',
    failed: 'thất bại',
    stopped: 'đã dừng',
  } as Readonly<Record<string, string>>,
  names: {
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
  } as Readonly<Record<string, string>>,
  toolSkipped: ' Bước này không được thực hiện; yêu cầu vẫn tiếp tục.',
} as const

export const requestText = {
  waitingApproval: 'Đang chờ bạn cấp quyền',
  disconnected: 'Kết nối bị gián đoạn',
  waitingModel: 'Đang chờ model trả lời',
  working: 'Đang làm việc…',
  disconnectedDetail:
    'Tiến độ không được cập nhật trực tiếp. Yêu cầu vẫn chạy trong DeckAgent; đang kết nối lại để đọc phần đã lưu.',
  activeDetail: 'Yêu cầu vẫn đang hoạt động. Bạn có thể dừng yêu cầu.',
  done: 'Đã xong',
  doneWithToolErrors: ' · có bước không thực hiện được',
  doneDetail: 'Yêu cầu đã xong. Bạn có thể gửi yêu cầu mới.',
  doneToolErrorsDetail: 'Có bước công cụ thất bại; yêu cầu vẫn kết thúc. Kiểm tra phản hồi bên dưới.',
  stopped: 'Đã dừng',
  stoppedDetail: 'Bạn đã dừng yêu cầu. Phần đã hoàn tất được giữ; hệ thống không tự tiếp tục.',
  notFinished: 'Chưa xong · ',
  notFinishedSuffix: ' Phần hoàn tất vẫn được giữ; hệ thống không tự chạy lại.',
  number: (value: string) => `Yêu cầu ${value}`,
  publicResearch: 'Yêu cầu cho phép tìm nguồn công khai qua Tavily',
  model: (provider: string, model: string) => `Model: ${provider} / ${model}`,
  activities: (count: number) => `${count} hoạt động`,
  noActivity: 'Chưa ghi nhận hoạt động.',
  diagnostic: 'Chi tiết kỹ thuật',
  errorCode: (code: string) => `Mã lỗi: ${code}`,
  openSettings: 'Mở Cài đặt model',
  retry: 'Đưa lại yêu cầu vào ô nhập',
  retryAsk: 'Ô nhập đang có bản nháp. Bấm lại để thay bằng yêu cầu này.',
  retryDone: 'Đã đưa vào ô nhập. Nhấn Enter để gửi.',
  approvalLabel: 'Cấp quyền cho một bước',
  approvalTitle: 'Đang chờ bạn cấp quyền',
  approvalStep: 'Bước: đọc một file',
  allowOnce: 'Cho phép một lần',
  refuse: 'Từ chối',
  approvalSaving: 'Đang lưu quyết định…',
  approvalFailed:
    'Chưa xác nhận được kết quả. Kiểm tra kết nối hoặc trạng thái yêu cầu rồi thử lại; bạn vẫn có thể dừng.',
} as const

export const conversationText = {
  newChat: 'Chat mới',
  wordmark: 'DeckAgent',
  welcomeChat: 'Bạn muốn trao đổi điều gì?',
  welcomeChatDetail: 'Gửi tin nhắn hoặc thêm tài liệu. Chọn Tạo deck ở trên khi bạn muốn làm bài trình bày.',
  welcomeDeck: 'Hãy mô tả deck bạn muốn',
  welcomeDeckDetail:
    'Dán ghi chú hoặc ý tưởng của bạn. DeckAgent đề xuất Outline và Brief trước; chỉ tạo slide sau khi bạn xác nhận.',
  conversation: 'Hội thoại',
  working: 'Đang làm việc',
  sendingState: 'Đang gửi…',
  sending: 'Đang gửi',
  navigationHint: 'Yêu cầu vẫn chạy khi bạn mở chat khác; quay lại chat này để xem tiến độ.',
  recents: 'Gần đây',
  chatHistory: 'Lịch sử chat',
  hideList: 'Ẩn danh sách chat',
  showList: 'Hiện danh sách chat',
  settings: 'Cài đặt',
  menuLabel: 'Cài đặt và công cụ',
  menuNote: 'Chạy trên máy của bạn',
  modelSettings: 'Cài đặt model',
  theme: 'Giao diện',
  themeStale: 'Giao diện vừa thay đổi ở nơi khác. Đã cập nhật theo cài đặt mới nhất.',
  themeFailed: 'Không lưu được lựa chọn giao diện. Hãy thử lại.',
  reconnect: 'Kết nối lại / đọc lịch sử',
  openDeck: 'Mở deck',
  startGeneration: 'Thử bắt đầu tạo deck',
  continueGeneration: 'Tiếp tục tạo deck',
  startGenerationTitle: 'Thử bắt đầu với Outline đã xác nhận; không tạo một lần xác nhận mới.',
  continueInput: 'Tiếp tục hoàn thành các slide còn thiếu.',
  skipInput: 'Bỏ qua các câu hỏi còn lại; giữ các giới hạn nguồn đã chọn.',
  inputPlaceholder: 'Nhập hoặc dán yêu cầu của bạn…',
  inputLabel: 'Nội dung yêu cầu',
  send: 'Gửi yêu cầu',
  sendTitle: 'Gửi yêu cầu (Enter)',
  stop: 'Dừng',
  stopLabel: 'Dừng yêu cầu',
  summaryBoundary:
    'Hội thoại phía trên đã được tóm tắt vì dài hơn ngữ cảnh của model. Từ đây, model đọc bản tóm tắt thay cho các tin nhắn phía trên; bạn vẫn đọc được toàn bộ.',
  unassignedTool: 'Kết quả công cụ · chưa xác định được yêu cầu',
  assistant: 'DeckAgent',
  user: 'Bạn',
  interrupted: 'Phần trả lời chưa xong',
  errorCode: (code: string) => `Mã lỗi: ${code}`,
  tooLong: 'Yêu cầu quá dài. Hãy rút gọn nội dung trước khi gửi. Bản nháp được giữ nguyên.',
  sendOrRemoveFiles: 'Hãy gửi hoặc gỡ tệp đang soạn trước khi tiếp tục deck đã xác nhận. Bản nháp được giữ nguyên.',
  sendBeforeSkip: 'Hãy gửi câu trả lời hoặc tệp đang soạn trước khi bỏ qua các câu hỏi còn lại.',
  unsentBeforeConfirm:
    'Bạn còn nội dung hoặc tệp chưa gửi. Hãy gửi yêu cầu sửa hoặc xóa bản nháp trước khi xác nhận đúng Outline đang hiển thị.',
  confirmFailed:
    'Chưa xác nhận được kết quả tạo deck. Kiểm tra kết nối và Outline hiện tại trước khi thử lại; các slide đã lưu vẫn được giữ.',
  draftChanged:
    'Bản nháp đã đổi ở giao diện khác. Giữ nội dung đang soạn và mở lại chat để đối chiếu trước khi lưu hoặc gửi.',
  draftNotSaved: 'Chưa lưu được bản nháp vào DeckAgent. Kiểm tra kết nối; nội dung vẫn còn trong ô soạn thảo.',
  noProviders:
    'Chưa có provider nào. Thêm provider và model trong Cài đặt model để gửi yêu cầu. Bản nháp được giữ nguyên.',
  noModels: 'Chưa thêm model nào. Thêm model trong Cài đặt model để gửi yêu cầu. Bản nháp được giữ nguyên.',
  removedModel: (model: string) =>
    `Model ${model} đã bị gỡ; chat này chưa có model. Hãy chọn model khác để gửi. Hệ thống không tự chọn model.`,
  noModel: 'Chat này chưa chọn model. Hãy chọn model để gửi yêu cầu. Bản nháp được giữ nguyên.',
} as const

export const modelPickerText = {
  choose: 'Chọn model',
  none: 'Chưa có model',
  selected: 'Model đã chọn',
  manageOption: 'Thêm hoặc quản lý model…',
  panel: 'Provider và model',
  providers: 'Provider',
  manage: 'Cài đặt model',
  add: 'Thêm provider',
  running: 'Yêu cầu đang chạy giữ model cũ. Lựa chọn mới áp dụng cho yêu cầu kế tiếp.',
  noModelForProvider: 'Provider này chưa có model. Mở Cài đặt để thêm model ID.',
  noProvider: 'Chưa có provider. Bấm + để thêm cấu hình.',
} as const

export const attachmentText = {
  reasons: {
    ATTACHMENT_UNREADABLE: 'Không đọc được tệp. Kiểm tra tệp hoặc cung cấp bản có chữ.',
    ATTACHMENT_TYPE_UNSUPPORTED: 'Định dạng tệp chưa được nhận.',
    ATTACHMENT_TOO_LARGE: 'Tệp vượt 20 MiB. Hãy giảm dung lượng.',
    PARSING_LIMIT_EXCEEDED: 'Tệp vượt giới hạn đọc an toàn. Hãy chia tài liệu thành phần nhỏ hơn.',
    UPLOAD_CANCELLED: 'Việc chuẩn bị đã dừng. Bỏ tệp rồi thêm lại khi cần.',
    ATTACHMENT_NOT_SAVED: 'Chưa lưu được tệp. Kiểm tra dữ liệu local và thử lại.',
    HOST_BUSY: 'Đang có nhiều tệp được chuẩn bị. Hãy thử lại sau.',
  } as Readonly<Record<string, string>>,
  unusable: 'Tệp chưa dùng được. Bỏ tệp rồi thử lại.',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  partial: 'Sẵn sàng · đọc một phần',
  partialNote: 'Một phần đã được thu nhỏ hoặc chưa đọc được; model chỉ dùng phần tool trả về.',
  preview: 'Xem trước',
  remove: 'Bỏ tệp',
  saving: 'Đang lưu tệp vào bản nháp…',
  picker: 'Chọn tệp đính kèm',
  add: 'Đính kèm tệp',
  addTitle: 'Thêm tệp · tối đa 10 tệp, 20 MiB/tệp',
  draftFiles: 'Tệp của bản nháp',
  previewNote: 'Bản xem trước có giới hạn; phần chưa đọc hoặc đã thu nhỏ được báo trong trạng thái tệp.',
  closePreview: 'Đóng xem trước',
} as const

export const researchText = {
  choice: 'Tìm nguồn công khai',
  choiceTitle:
    'Query tìm kiếm được gửi tới Tavily và có thể chứa thông tin từ tài liệu. Tối đa 3 lượt/yêu cầu, chỉ dùng miễn phí.',
  info: 'Thông tin tìm nguồn',
  notConfigured: 'Chưa cấu hình',
  notConfiguredTitle: 'Chưa cấu hình tìm nguồn công khai. Mở cài đặt để kết nối Tavily.',
  settings: 'Cài đặt tìm kiếm',
  sources: 'Nguồn đã tìm',
  heading: 'Nguồn công khai · Tavily',
  intro:
    'Chỉ dùng gói miễn phí. Khi hết quota, research dừng. Query được gửi tới Tavily; không tự gửi toàn bộ file hoặc lịch sử. Giữ tài khoản ở gói Free và tắt PAYG trong dashboard Tavily.',
  key: 'Tavily API key',
  save: 'Kiểm tra và lưu key',
  saved: 'Đã kiểm tra và lưu key cho tài khoản miễn phí.',
  environment: 'Kiểm tra key từ .env',
  environmentSaved: 'Key môi trường hợp lệ, tài khoản miễn phí; không sao chép key vào database.',
  remove: 'Gỡ cấu hình research',
  removed: 'Đã tắt research. Request đã bắt đầu giữ cấu hình lúc gửi.',
  close: 'Đóng',
  openNote: 'Key đã lưu không bao giờ được hiện lại. Để dùng .env, bấm kiểm tra key môi trường.',
  reading: 'Đang đọc nguồn của Chat…',
  found: 'Các đoạn thực tế đã nhận; không phải toàn trang hay xác nhận tính đúng của nguồn.',
  none: 'Chat này chưa có nguồn research đã lưu.',
  failed: 'Không kết nối được Tavily. Kiểm tra mạng rồi thử lại; cấu hình cũ được giữ.',
  errors: {
    PREFERENCES_STALE:
      'Cài đặt tìm kiếm vừa thay đổi ở nơi khác. Đã tải lại trạng thái mới nhất. Hãy kiểm tra rồi thử lại.',
    RESEARCH_FREE_ONLY: 'Chỉ nhận tài khoản Tavily Researcher miễn phí, không có PAYG. Kiểm tra gói tại Tavily.',
    RESEARCH_QUOTA_EXHAUSTED:
      'Đã hết quota miễn phí hoặc không xác minh được hạn mức. Chờ quota mới; không nâng cấp tự động.',
    RESEARCH_KEY_REJECTED: 'Tavily từ chối key. Kiểm tra key rồi thử lại.',
    RESEARCH_KEY_UNAVAILABLE:
      'Chưa đọc được key. Thêm TAVILY_API_KEY vào .env rồi khởi động lại, hoặc lưu key tại đây.',
    RESEARCH_NOT_SAVED: 'Chưa lưu được key. Kiểm tra nơi lưu credentials hoặc dùng biến môi trường.',
  } as Readonly<Record<string, string>>,
} as const

/** The text of the deck screens: the Brief workflow, the Outline proposals, the published deck and the sample deck. */
export const deckText = {
  workflow: {
    label: 'Chuẩn bị deck',
    mode: 'Chế độ hội thoại',
    chatMode: 'Chat thông thường',
    deckMode: 'Tạo deck',
    material: 'Dùng tài liệu của chat',
    knowledge: 'Dùng kiến thức chung của mô hình',
    research: 'Tìm nguồn công khai (chỉ miễn phí)',
    researchTitle: 'Truy vấn được gửi tới Tavily và có thể chứa thông tin từ tài liệu; chỉ dùng quota miễn phí.',
    images: 'Lựa chọn ảnh',
    imagesTitle:
      'Truy vấn ảnh được gửi tới nguồn bạn chọn. Tavily dùng key và quota miễn phí; lựa chọn này không bật tìm nguồn văn bản.',
    imageOptions: [
      ['', 'Giữ yêu cầu ảnh hiện tại'],
      ['none', 'Không cần ảnh'],
      ['attachments', 'Dùng ảnh đã đính kèm'],
      ['public-research', 'Tìm ảnh web · Tavily · chỉ miễn phí'],
      ['commons', 'Tìm ảnh web · Wikimedia Commons'],
    ],
    format: 'Định dạng deck',
    formatOptions: [
      ['', 'Giữ yêu cầu định dạng hiện tại'],
      ['html', 'HTML · HTML Basic · DeckAgent Neutral'],
    ],
    action: 'Loại yêu cầu Outline',
    actionOptions: [
      ['revise', 'Trả lời / yêu cầu sửa Outline'],
      ['question', 'Chỉ hỏi về Outline'],
      ['clarify', 'Làm rõ yêu cầu'],
    ],
    questions: 'Câu hỏi cần bổ sung',
    blockers: 'Thông tin cần xử lý',
    skip: 'Bỏ qua câu hỏi còn lại',
    lockedSummary: 'Brief đã khóa cho deck này',
    summary: 'Brief hiện tại và giả định',
    currentSummary: (version: number) => `Brief hiện tại · v${version} và giả định`,
  },
  inputHints: {
    chat: 'Nhập tin nhắn của bạn…',
    collect: 'Mô tả deck hoặc trả lời các câu hỏi ở trên…',
    question: 'Nhập câu hỏi về Outline; nội dung sẽ được giữ nguyên…',
    clarify: 'Làm rõ yêu cầu trước khi sửa Outline…',
    revise: 'Mô tả thay đổi bạn muốn cho Outline hiện tại…',
  },
  brief: {
    fields: {
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
    } as Readonly<Record<string, string>>,
    sourceKinds: {
      attachment: 'Tài liệu đính kèm',
      'project-file': 'Tệp trong project',
      'approved-file': 'Tệp được cấp quyền',
      research: 'Nguồn công khai',
    },
    sourceReferences: (count: number) => `Tham chiếu nguồn đã lưu (${count})`,
    sourceReference: (kind: string, sourceId: string, version: number) => `${kind} · ${sourceId} · v${version}`,
    boundTitle: (version: number) => `Brief gắn với đề xuất v${version}`,
    presenterNotes: 'Ghi chú người trình bày: có yêu cầu.',
    field: (label: string, value: string | number) => `${label}: ${value}`,
    requirement: (value: string) => `Yêu cầu: ${value}`,
    assumption: (value: string) => `Giả định: ${value}`,
    material: 'tài liệu của chat',
    modelKnowledge: 'kiến thức chung của mô hình',
    publicResearch: 'tìm nguồn công khai',
    allowedSources: (sources: string) => `Nguồn được phép: ${sources || 'Chưa chọn'}.`,
    imageModes: {
      none: 'Không dùng ảnh',
      attachments: 'Dùng ảnh đính kèm',
      unavailable: 'Yêu cầu ảnh chưa đáp ứng',
    },
    webImages: (provider: 'commons' | 'tavily') =>
      `Ảnh web từ ${provider === 'commons' ? 'Wikimedia Commons' : 'Tavily · chỉ miễn phí'}; truy vấn ảnh được gửi tới dịch vụ này.`,
    webImagesUnknown: 'Ảnh web; xem nguồn được lưu cùng từng ảnh. Phiên bản Brief này chưa ghi riêng dịch vụ tìm ảnh.',
    images: (text: string) => `Ảnh: ${text}`,
    design: (template: string, designSystem: string) => `Template: ${template} · Design System: ${designSystem}`,
    templateNames: { 'html-basic': 'HTML Basic' } as Readonly<Record<string, string>>,
    designSystemNames: { 'deckagent-neutral': 'DeckAgent Neutral' } as Readonly<Record<string, string>>,
    technical: 'Chi tiết theme và phiên bản',
    versions: (template: string, templateVersion: string, system: string, systemVersion: string) =>
      `${template}@${templateVersion} · ${system}@${systemVersion}`,
    unmetImage: (need: string) => `Ảnh chưa đáp ứng: ${need}`,
  },
  outline: {
    label: 'Outline đề xuất',
    heading: 'Đề xuất outline',
    content: 'Nội dung dự kiến',
    expand: 'Mở chi tiết',
    collapse: 'Thu gọn',
    confirm: 'Xác nhận outline và tạo slide',
    revise: 'Yêu cầu sửa outline',
    view: 'Xem Outline đang xác nhận',
    cancel: 'Hủy outline',
    target: (version: number, slides: number, briefVersion?: number) =>
      `Outline v${version} · ${slides} slide${briefVersion === undefined ? '' : ` · Brief v${briefVersion}`}`,
    noSlidesYet: 'Chưa có slide nào được tạo cho đến khi bạn xác nhận.',
    orType: 'Hoặc gõ thay đổi bạn muốn vào khung bên dưới.',
    confirmed: 'Đã xác nhận · chỉ đọc',
    layoutBlocked: 'Chưa thể xác nhận · cần sửa nội dung cho phù hợp bố cục',
    imagesBlocked: (count: number) => `Chưa thể xác nhận · còn ${count} ảnh bắt buộc chưa chuẩn bị`,
    waiting: 'Hiện tại · chờ bạn xác nhận',
    cancelled: 'Đã hủy',
    superseded: 'Đề xuất cũ · không còn là hiện tại',
    layoutFields: { title: 'Tiêu đề', caption: 'Chú thích ảnh', content: 'Nội dung' },
    layoutLimit: (slide: number, field: string, actual: number, limit: number) =>
      `Slide ${slide} · ${field}: ${actual} ký tự, tối đa ${limit}. Yêu cầu sửa outline để diễn đạt gọn hơn và giữ ý chính.`,
    layoutMismatch: (slide: number) =>
      `Slide ${slide} · Nội dung chưa phù hợp bố cục. Yêu cầu sửa outline để sắp xếp lại nội dung và giữ các yêu cầu đã chọn.`,
    slideTitle: (index: number, title: string) => `${index}. ${title}`,
    attachedImage: (caption?: string) => `Ảnh đính kèm${caption ? `: ${caption}` : ''}`,
    webImage: (query: string, required: boolean) => `Ảnh web: ${query}${required ? ' (cần có)' : ' (tùy chọn)'}`,
    metric: (value: string, label: string) => `${value}: ${label}`,
    summary: (slides: number, briefVersion: number) => `${slides} slide · Brief v${briefVersion}`,
    suggestion: (text: string) => `Gợi ý sửa: ${text}`,
    changes: (added: number, removed: number, changed: number, reordered: boolean, fields: string) =>
      `Thay đổi: ${added} slide mới, ${removed} slide bỏ, ${changed} slide sửa. ${reordered ? 'Đổi thứ tự.' : ''} Brief: ${fields || 'giữ nguyên'}.`,
    allChanges: 'Toàn bộ thay đổi của đề xuất',
    changeKinds: { added: 'Thêm', removed: 'Bỏ', changed: 'Sửa' },
    change: (kind: string, title: string) => `${kind}: ${title}`,
    overviewChanges: (overview: boolean, suggestions: boolean) =>
      `Tổng quan: ${overview ? 'đã đổi' : 'giữ nguyên'} · Gợi ý sửa: ${suggestions ? 'đã đổi' : 'giữ nguyên'}`,
  },
  images: {
    prepared: 'Ảnh đã chuẩn bị · cần bạn duyệt trước khi tạo slide',
    requiredNote: ' Cần có ảnh trước khi xác nhận.',
    optionalNote: ' Slide sẽ bỏ phần ảnh này.',
    reason: (text: string) => `Lý do chọn: ${text}`,
    unverified: 'Đánh giá dựa trên mô tả nguồn; chưa kiểm chứng trực quan bằng model.',
    credit: (author: string, license: string) => `${author} · ${license}`,
    source: 'Xem trang nguồn',
    license: 'Điều kiện sử dụng ảnh',
    audit: (count: number) => `Lịch sử kiểm tra ảnh (${count} lần)`,
    check: (host: string, text: string, status?: number) => `${host}: ${text}${status ? ` (HTTP ${status})` : ''}`,
    unreadable: 'Không đọc được ảnh đã lưu. Sửa Outline để chọn lại ảnh.',
    replace: 'Tìm ảnh khác',
    replaceRequest: (slide: number, title: string, position: number) =>
      `Thay ảnh tại slide ${slide} “${title}”, vị trí ảnh ${position}. Giữ nội dung và các vị trí khác; đặt replace:true cho vị trí này và tìm ảnh khác phù hợp với vai trò.`,
    failures: {
      RESEARCH_IMAGE_LICENSE_REQUIRED: 'Chưa xác minh được giấy phép cho phép sử dụng ảnh.',
      RESEARCH_IMAGE_LICENSE_UNSUPPORTED: 'Giấy phép của ảnh chưa được hỗ trợ cho deck này.',
      RESEARCH_IMAGE_AUTHOR_REQUIRED: 'Ảnh yêu cầu ghi công nhưng chưa xác định được tác giả.',
      IMAGE_PREPARED: 'Đã chuẩn bị ảnh.',
      RESEARCH_IMAGE_SOURCE_UNRESOLVED: 'Chưa tìm được trang nguồn của ảnh.',
      RESEARCH_IMAGE_SOURCE_BLOCKED: 'Website chặn truy cập để kiểm tra nguồn ảnh.',
      RESEARCH_IMAGE_SOURCE_HTTP: 'Trang nguồn ảnh trả về lỗi HTTP.',
      RESEARCH_IMAGE_NETWORK: 'Không kết nối được tới nguồn ảnh.',
      RESEARCH_IMAGE_RESPONSE_TOO_LARGE: 'Dữ liệu nguồn ảnh vượt giới hạn tải.',
      RESEARCH_IMAGE_CONTENT_TYPE: 'Nguồn trả về định dạng không được hỗ trợ.',
      RESEARCH_IMAGE_TIMEOUT: 'Hết thời gian kiểm tra hoặc tải ảnh.',
      RESEARCH_IMAGE_NORMALIZATION_LIMIT: 'Ảnh vượt giới hạn xử lý. Chọn phiên bản nhỏ hơn hoặc ảnh khác.',
      RESEARCH_IMAGE_DECODE_FAILED: 'Không đọc được dữ liệu ảnh đã tải. Cần chọn ảnh khác.',
      RESEARCH_IMAGE_SELECTION_BUSY: 'Vị trí này đang được chọn ảnh. Chờ lượt đang chạy kết thúc.',
      RESEARCH_IMAGE_SELECTION_STALE: 'Yêu cầu ảnh đã thay đổi; cần chọn từ kết quả tìm mới.',
      RESEARCH_IMAGE_DUPLICATE: 'Ảnh trùng với vị trí ảnh khác; cần chọn ảnh khác.',
      RESEARCH_IMAGE_NO_MATCH: 'Chưa tìm được ảnh phù hợp với yêu cầu.',
      RESEARCH_IMAGE_SELECTION_REQUIRED: 'Chưa chọn được ảnh phù hợp.',
      RESEARCH_IMAGE_BUDGET: 'Đã đạt giới hạn tìm hoặc chọn ảnh của yêu cầu này.',
      RESEARCH_KEY_UNAVAILABLE: 'Chưa có API key Tavily. Thêm key trong Cài đặt hoặc chọn nguồn Commons.',
      RESEARCH_QUOTA_EXHAUSTED: 'Tavily đã hết quota miễn phí. Đổi nguồn hoặc thử lại khi có quota.',
      RESEARCH_FREE_ONLY: 'Cấu hình Tavily chưa đáp ứng chế độ chỉ miễn phí.',
      RESEARCH_KEY_REJECTED: 'Tavily từ chối API key. Kiểm tra key trong Cài đặt.',
      RESEARCH_UNAVAILABLE: 'Không kết nối được Tavily. Kiểm tra cấu hình, kết nối hoặc chọn nguồn Commons.',
    } as Readonly<Record<string, string>>,
    failure: 'Chưa chuẩn bị được ảnh. Đổi truy vấn hoặc cung cấp ảnh đính kèm.',
  },
  canvas: {
    label: 'Bộ slide',
    title: 'Bộ slide',
    present: 'Trình chiếu',
    close: 'Đóng',
    previous: 'Trước',
    next: 'Sau',
    restart: 'Về đầu',
    restartTitle: 'Về slide đầu tiên (R)',
    restartKey: 'R',
    exit: 'Thoát',
    slides: 'Danh sách slide',
    navigation: 'Điều hướng slide',
    frame: 'Slide đã lưu',
    noDeck: 'Chat này chưa có deck đã xác nhận',
    loading: 'Đang tải deck',
    progress: (published: number, total: number, generation: string) =>
      `${published}/${total} slide đã lưu${generation}`,
    generation: {
      pending: ' · Đã xác nhận, chưa xếp lịch',
      admitted: ' · Đang tạo',
      generating: ' · Đang tạo',
      generated: ' · Hoàn tất',
      incomplete: ' · Chưa hoàn tất, không tự chạy tiếp',
    },
    design: (template: string, designSystem: string, locked: boolean) =>
      `HTML · ${template} · ${designSystem}${locked ? ' · Đã khóa' : ''}`,
    connection: {
      connecting: 'Đang kết nối',
      live: 'Đã kết nối',
      reconnecting: 'Đang kết nối lại — hiển thị bản đã lưu gần nhất',
      error: 'Không tải được deck. Hãy kết nối lại.',
    },
    slideState: (pending: boolean, revision: number) => (pending ? 'Chưa tạo xong' : `Bản ${revision}`),
    slideLabel: (number: number, title: string, state: string) => `${number}. ${title} · ${state}`,
    slideShort: (number: number, pending: boolean) => `${number} · ${pending ? 'chưa tới' : 'xong'}`,
    position: (index: number, total: number) => `${index} / ${total}`,
    caption: (number: number, total: number, state: string) => `Slide ${number}/${total} · ${state}`,
    pendingSlide: 'Slide này chưa được tạo xong. Nội dung hoàn tất sẽ hiện ở đây sau khi được lưu.',
    loadFailed: 'Không tải được bản slide đã lưu. Hãy kết nối lại.',
    loadingSlide: 'Đang tải bản slide đã lưu…',
    noFullscreen: 'Trình duyệt không hỗ trợ trình chiếu toàn màn hình',
  },
  sample: {
    label: 'Deck mẫu',
    close: 'Đóng deck',
    frame: 'Slide mẫu',
    caption: (number: number) => `Slide ${number}/3 · Nội dung mẫu`,
    fullscreen: 'Toàn màn hình',
    noFullscreen: 'Trình duyệt không hỗ trợ toàn màn hình',
  },
  resizer: {
    label: 'Đổi kích thước bộ slide',
    title: 'Drag to resize presentation; use Left and Right arrow keys',
    value: (width: number) => `${width} pixels`,
  },
} as const
