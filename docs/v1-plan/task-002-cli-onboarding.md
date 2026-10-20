# TASK-002 — CLI setup lần đầu và chat bằng cấu hình đã lưu

Cập nhật: 20-10-2026. Task owner yêu cầu `pnpm.cmd chat` hướng dẫn thiết lập
nếu thiếu cấu hình và vào chat ngay khi đã đủ. Đây là phần application của
TASK-002-B/C, không thay Runtime/ModelAdapter/SessionStore hoặc chốt Settings Web
của TASK-004.

## Luồng khởi động

Trong terminal tương tác, app hỏi phần còn thiếu: provider, model ID, key.
Danh sách provider lấy từ connection template; có lựa chọn endpoint khác theo
ba protocol hiện có. Endpoint khác hỏi chuẩn API, API root URL và có yêu cầu key
không. Không tự đoán model catalog hoặc bảo đảm mọi model hỗ trợ tools.

Key được nhập ẩn, không nằm trong readline history. Thứ tự lấy key là environment
→ key mã hóa đúng connection → hidden input. Chọn lưu key là tùy chọn, mặc định
không. App không ghi User/System environment của Windows.

Khi có setup, app gửi một request nhỏ `Reply only OK.` với tools tắt để kiểm tra
API/model/credentials; request này không được lưu vào Session. Lỗi cho phép sửa
key, model hoặc provider/endpoint ngay trong wizard. Chỉ lưu profile/key sau khi
check thành công. Hủy trong bước hỏi/kiểm tra kết nối giữ profile cũ. Profile sai format/version
báo lỗi và hướng dẫn `--setup`, không tự reset.

Khi profile/key đã đủ, startup không gửi request kiểm tra ngầm. Key bị thu hồi
sẽ được phát hiện khi chat; dùng `--setup` để kiểm tra/sửa hoặc đặt environment
key mới. Format key đúng chưa chứng minh quyền dùng model.

## Dữ liệu local

Paths tính theo `--data-dir`, mặc định `.deckagent` ở current directory:

| File | Contract |
| --- | --- |
| `profile.json` | JSON version 1: `version`, `connections` và `selection: { provider, model }`; không chứa key |
| `credentials/<sha256>.dpapi` | Bytes mã hóa bằng Windows DPAPI CurrentUser; không có plaintext fallback |
| `sessions.sqlite` | Giữ nguyên [Session Persistence contract](task-002-c-session-persistence.md) |

Profile giữ các connections đã chọn để mở lại Sessions cũ sau khi đổi default.
Connections theo [Model Providers contract](task-002-b-model-providers.md), chỉ
có `apiKeyEnv`, không có `apiKey`. Custom connection qua wizard có ID suy ra từ
protocol/URL để đổi endpoint không âm thầm đổi kết nối của Session cũ. Với JSON
developer truyền qua `--config`, developer vẫn phải giữ ID cùng ý nghĩa.

Settings ghi temporary file cùng directory rồi rename. Key được mã hóa trước
khi ghi, kể cả temporary file. Định danh credential gắn ID/protocol/API root/tên
biến key. Đổi endpoint không tự đọc key của endpoint cũ. App gọi PowerShell/.NET
ProtectedData bằng script cố định, truyền dữ liệu qua stdin; key không nằm trong
command arguments. Không đọc hoặc thay credentials của ứng dụng khác.

DPAPI gắn với Windows user/máy hiện tại. Trên OS khác, environment/key trong lần
chạy vẫn dùng được; wizard chưa hỗ trợ lưu key. Nếu không đọc được ciphertext,
terminal tương tác cho nhập lại; không tự ghi plaintext. `.deckagent/` được Git
bỏ qua. Không lưu key trong profile, Session DB, tool arguments hoặc logs.

## Precedence và tương thích CLI

- Session hiện có dùng selection đã lưu. Flags khác selection bị từ chối;
  menu retry cũng không đổi provider/model của Session này.
- Session mới: flags → environment defaults → profile selection. Không lấy
  model mặc định của provider khác khi chỉ đổi provider.
- `--config`/`DECKAGENT_MODELS_CONFIG` ưu tiên hơn profile. Connection được chọn
  qua wizard thành công được giữ trong profile.
- `--setup` dùng riêng với `--session`, `--prompt`, `--provider`, `--model`.
  Có thể đi cùng `--config`, `--data-dir`, `--tools`.
- Non-TTY hoặc `--prompt` không mở wizard; dùng profile/flags/environment và
  encrypted key nếu có. Thiếu dữ liệu thì báo lỗi, không chờ input từ pipeline.
- Help/list/history không mở setup hoặc gọi API. Đọc history không cần key/config.

`--session` không bật tính năng lưu: mọi chat đều dùng SQLite. Không truyền ID
thì tạo ID mới và in ở dòng Session. Dùng lại ID để tiếp tục; `chat` không ID mở
hội thoại mới. Root script `chat` đã bật `--use-system-ca`.

## Files và kiểm chứng

| File trong `apps/agent-runtime/src/` | Trách nhiệm |
| --- | --- |
| `setup.ts` | Resolve defaults/config, wizard, retry, API check và profile |
| `terminal.ts` | Prompt có thể hủy, ẩn key và tắt readline history |
| `credentials.ts` | DPAPI credential vault cho Windows |
| `local-files.ts` | Đọc local file và ghi atomic, lỗi không lộ nội dung |
| `chat.ts` | Chọn interactive/noninteractive, gọi setup rồi boot Runtime/Session |

```powershell
pnpm.cmd build
pnpm.cmd test:chat-setup
pnpm.cmd test:model-providers
pnpm.cmd test:session-persistence
```

14 setup tests kiểm tra defaults, DPAPI thật trên Windows, opt-in/out, environment
precedence, key không echo/recall, custom endpoints, retry 401, cancel giữ profile,
noninteractive startup, profile sai version, hủy khi đang đọc credentials và kết nối Session cũ sau đổi default.
Test subprocess dùng streams giả lập TTY để setup → chat → thoát → mở lại Session
tự sinh → mở chat mới không flags. Provider adapter thật nối HTTP local; không
cần hoặc nhận API key thật.

Kết quả/revision ở [PROGRESS.md](PROGRESS.md). Chưa có authenticated cloud setup/
restart check của agent hoặc thao tác bàn phím người dùng trên terminal thực.
Hosted CI chưa xác minh; local tests không tự đóng Integration Gate 002 trên dev.
