# DeckAgent

DeckAgent hướng tới việc tạo và chỉnh sửa presentation bằng hội thoại với AI.
Hiện phần lõi đã chạy qua **CLI trong terminal**: chat với model thật, gọi tool,
lưu lịch sử vào SQLite và mở lại hội thoại sau restart. Giao diện Web thuộc các task tiếp theo.

Hướng dẫn dưới đây dành cho **Windows PowerShell**, chạy tại thư mục gốc repo
(thư mục chứa `package.json`). Các lệnh dùng `node` và `pnpm.cmd` cài trên máy.

## 1. Chuẩn bị sau khi clone repo

Checkout branch/commit đã chứa TASK-002. Bản clone chỉ nhận được code đã commit và
push; kiểm tra hai file này đều trả về `True`:

```powershell
Test-Path .\apps\agent-runtime\src\chat.ts
Test-Path .\config\models.example.json
```

Nếu thiếu file, kiểm tra lại branch/commit với người bàn giao code trước khi tiếp tục.

Yêu cầu công cụ:

| Công cụ | Phiên bản |
| --- | --- |
| Node.js | `^22.19.0` hoặc `>=24.0.0`; các checks hiện tại đã chạy với Node `22.19.0` |
| pnpm | `11.28.5`, được ghi trong `package.json` |

```powershell
node --version
pnpm.cmd --version
```

Nếu chưa có pnpm, sau khi cài Node phù hợp, chạy:

```powershell
npm.cmd install --global pnpm@11.28.5
```

README dùng `pnpm.cmd` để tránh trường hợp PowerShell chặn shim `pnpm.ps1`.
Thư mục `trash/` là dữ liệu thử nghiệm cục bộ, được Git bỏ qua; người clone repo
dùng Node đã cài trên máy và không cần thư mục này.

## 2. Cài dependencies và build

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
```

Install tạo các thư mục `node_modules`; build kiểm tra TypeScript và tạo output
`lib/`. Kiểm tra CLI đã được build:

```powershell
Test-Path .\apps\agent-runtime\lib\chat.js
pnpm.cmd chat --help
```

`Test-Path` phải trả về `True`. Khi cập nhật source, chạy lại `pnpm.cmd build`
trước khi chạy CLI để dùng code mới.

## 3. Mở app và chat ngay

Sau khi install/build, chỉ cần chạy trong PowerShell:

```powershell
pnpm.cmd chat
```

Lần đầu, app hướng dẫn ngay trong terminal:

```text
Chào mừng đến DeckAgent! Thiết lập chat.
Chọn provider: Google Gemini / OpenAI / DeepSeek / Anthropic / Endpoint tương thích khác
Provider (số hoặc connection ID): ...
Model ID: ...
API key (ẩn khi nhập):
Lưu key mã hóa trên máy để dùng lần sau? (c/k, mặc định k): ...
Đang kiểm tra kết nối...
Kết nối thành công! Đã lưu cấu hình chat.
Connection: ...; model: .... Session: chat-...
You:
```

Nhập model ID tài khoản của bạn hỗ trợ. Nếu key đã có trong environment hoặc
đã lưu trước đó, app dùng lại và không hỏi nhập key. Chọn `c` để lưu key mã hóa
bằng Windows DPAPI cho tài khoản Windows hiện tại; chọn `k` để key chỉ dùng trong
lần chạy này. Không cần tự sửa JSON hoặc chạy lệnh đặt biến môi trường.
Trên hệ điều hành khác, hiện có thể dùng environment/key trong lần chạy;
chưa hỗ trợ lưu key mã hóa qua wizard.

Sau setup, gõ tin nhắn tại `You:`; `/exit` để thoát. Lần sau chạy lại cùng
`pnpm.cmd chat`: app vào chat bằng provider/model đã lưu, không kiểm tra API thêm
trước mỗi lần mở. Nếu chưa lưu key và environment không có key, app chỉ hỏi key.
Lệnh `chat` đã bật `--use-system-ca` để dùng CA được hệ điều hành tin cậy.

Khi kiểm tra kết nối thất bại, wizard cho sửa API key, model hoặc provider/endpoint.
Chỉ lưu cấu hình sau khi kết nối thành công; Ctrl+C hủy setup. Muốn thiết lập lại:

```powershell
pnpm.cmd chat --setup
```

Mỗi lần mở chat mới đều **tự lưu Session**, kể cả không truyền `--session`.
App in ID ở dòng `Session: ...`. Xem danh sách hoặc mở lại một ID đã lưu:

```powershell
pnpm.cmd chat --list-sessions
pnpm.cmd chat --session test-session
```

Thay `test-session` bằng ID có trong danh sách. Để test dễ nhớ, lần đầu chạy
`pnpm.cmd chat --session test-session`, nhắn `Mã dự án là DA-4821`, rồi `/exit`.
Chạy lại cùng lệnh và nhập `/history`, sau đó hỏi lại mã dự án. Cả hai lần phải
dùng cùng data directory. Không truyền ID thì app tạo hội thoại mới mỗi lần.

Cấu hình không bí mật nằm ở `.deckagent/profile.json`, key mã hóa ở
`.deckagent/credentials/`, hội thoại ở `.deckagent/sessions.sqlite`. Cả thư mục
được Git bỏ qua. `--data-dir` đổi nơi lưu cho cả ba; key mã hóa gắn với Windows
user/máy hiện tại. Chi tiết cho developer ở
[CLI onboarding](docs/v1-plan/task-002-cli-onboarding.md).

Các phần 4–10 bên dưới hướng dẫn cấu hình bằng flags/environment và kiểm tra API
chi tiết. Wizard cần terminal tương tác; khi chạy pipeline hoặc `--prompt`, app
dùng profile/flags/environment và báo lỗi nếu còn thiếu thông tin.

### Kiểm thử tự động, chưa cần API key thật

Chạy các kiểm thử local:

```powershell
pnpm.cmd test:foundation
pnpm.cmd test:agent-runtime
pnpm.cmd test:model-providers
pnpm.cmd test:session-persistence
pnpm.cmd test:chat-setup
```

Tại snapshot TASK-002-A/B/C ngày 20-10-2026, kết quả là 2 foundation tests,
22 Runtime tests, 21 provider/CLI tests, 9 persistence tests và 14 setup tests PASS. Tests dùng
SQLite tạm và HTTP server local, không cần key thật hoặc gọi cloud. Persistence
tests có trường hợp chạy hai process CLI riêng để kiểm tra mở lại hội thoại.
Evidence và trạng thái mới nhất ở
[PROGRESS.md](docs/v1-plan/PROGRESS.md).

Có thể chạy riêng smoke demo Cordis:

```powershell
pnpm.cmd start:foundation
```

Demo in `Hello, DeckAgent` rồi cleanup. Demo fake model đã được bỏ khỏi app;
fixture model chỉ còn trong tests. Để chat thủ công, cấu hình API thật ở các bước dưới.
Node 22.19.0 có thể in `ExperimentalWarning: SQLite is an experimental feature`;
đây là cảnh báo của `node:sqlite`, không phải lỗi kết nối API.

## 4. Hiểu file cấu hình và chọn provider/model

[config/models.example.json](config/models.example.json) là cấu hình mẫu, được CLI
dùng khi chưa có profile đã lưu hoặc khi cần connection ngoài profile. Có thể
chọn file khác bằng `--config`; file đó được ưu tiên hơn profile.

File này chứa connection ID, giao thức, URL và **tên biến môi trường chứa key**.
Ví dụ, connection `google` có:

```json
"apiKeyEnv": "GEMINI_API_KEY"
```

Nghĩa là CLI lấy key từ biến môi trường `GEMINI_API_KEY`, nếu đã có. Bạn cũng có
thể nhập/lưu key bằng wizard ở bước 3. Nếu dùng environment, làm theo bước 5;
giữ nguyên tên biến trong JSON.

| Connection ID trong file mẫu | Giao thức | Biến môi trường chứa key |
| --- | --- | --- |
| `google` | Gemini GenerateContent | `GEMINI_API_KEY` |
| `openai` | Chat Completions | `OPENAI_API_KEY` |
| `deepseek` | Chat Completions | `DEEPSEEK_API_KEY` |
| `anthropic` | Anthropic Messages | `ANTHROPIC_API_KEY` |

Chỉ cần key cho connection bạn chọn. Các lệnh phía dưới dùng `google` và model
`gemini-3.8-flash`, đã có kết quả manual thành công trong dự án. Bạn có thể thay
model ID bằng model được API/tài khoản của mình hỗ trợ. Với Gemini, xem cột
Endpoint trong [danh sách model](https://ai.google.dev/gemini-api/docs/models) và
dùng ID **không có tiền tố `models/`**. Connection IDs ở đây là nhãn cấu hình
developer; ứng dụng chưa tự chọn default model hoặc fallback sang model khác.

## 5. Nhập API key cho Gemini

Đây là cách cấu hình environment tùy chọn. Nếu đã nhập key qua wizard, có thể
bỏ qua phần này. Environment được ưu tiên hơn key mã hóa đã lưu trong app.

### Dùng trong PowerShell hiện tại

Copy nguyên **một dòng** dưới đây, nhấn Enter rồi nhập/dán giá trị key gốc tại
prompt ẩn. `Process` chỉ giữ key trong terminal hiện tại; đóng terminal thì mất.

```powershell
[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', [System.Net.NetworkCredential]::new('', (Read-Host 'Gemini API key' -AsSecureString)).Password, 'Process')
```

Kiểm tra định dạng mà không in key:

```powershell
[Environment]::GetEnvironmentVariable('GEMINI_API_KEY') -cmatch '\A[\x21-\x7E]+\z'
```

Kết quả cần là `True`: key có giá trị và chỉ chứa printable ASCII không có khoảng
trắng. Nếu `False`, nhập lại key gốc để loại bỏ ký tự ẩn/Unicode/whitespace bị dính
khi copy. `True` chỉ xác nhận định dạng; bước 6 mới kiểm tra key/model với API thật.

### Tùy chọn: lưu key cho những lần mở terminal sau

Dùng `User` nếu muốn lưu cho tài khoản Windows của mình. Chạy dòng thứ nhất để
nhập và lưu key; dòng thứ hai nạp key đã lưu vào terminal hiện tại để dùng ngay:

```powershell
[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', [System.Net.NetworkCredential]::new('', (Read-Host 'Gemini API key' -AsSecureString)).Password, 'User')
[Environment]::SetEnvironmentVariable('GEMINI_API_KEY', [Environment]::GetEnvironmentVariable('GEMINI_API_KEY', 'User'), 'Process')
```

Các process mở mới sau khi nhận môi trường cập nhật sẽ có biến này. Khi cần,
đóng/mở lại PowerShell; nếu dùng terminal trong VS Code, mở lại VS Code. Biến
`User` dùng chung cho các project chạy dưới tài khoản Windows đó và nằm ngoài repo.
CLI hiện không tự tải `.env`.

## 6. Test kết nối, key và model bằng một tin nhắn

Chạy trong terminal đã có key:

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --provider google --model gemini-3.8-flash --prompt 'Chỉ trả lời: Kết nối thành công.'
```

Mong đợi có dòng `Assistant: ...` trả lời và chương trình thoát. Câu trả lời thực
tế có thể thay đổi. Dòng `Connection: ...` chỉ thông báo cấu hình đã chọn;
đến khi có câu trả lời mới chứng minh lượt gọi model đã hoàn tất.

`--use-system-ca` giúp Node dùng thêm CA được hệ điều hành tin cậy và vẫn xác minh
chứng chỉ HTTPS. Flag này xử lý lỗi trust chain từng gặp trên máy Windows của
dự án; xem [Node.js system CA](https://nodejs.org/download/release/v22.19.0/docs/api/cli.html#--use-system-ca).

## 7. Test model gọi tool thật

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --provider google --model gemini-3.8-flash --tools --prompt 'Gọi noop với value DeckAgent rồi đọc lại kết quả.'
```

Mong đợi:

```text
Connection: google; model: gemini-3.8-flash. Session: chat-<id-tự-sinh>
History: SQLite (<đường-dẫn-data>). Resume with --session chat-<id-tự-sinh>
Tool noop: DeckAgent
Assistant: ...DeckAgent...
```

`Tool noop: DeckAgent` chỉ được in khi executor thật sự chạy. Sau đó model nhận
kết quả tool rồi tạo câu trả lời; phần `Assistant` có thể diễn đạt khác ví dụ.
Tool `noop` chỉ trả lại chuỗi đầu vào, không thao tác files hoặc shell.

## 8. Chat nhiều lượt trong terminal

Bỏ `--prompt` để mở chế độ tương tác:

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --provider google --model gemini-3.8-flash --session demo-01 --tools
```

Khi thấy `You:`, nhập các tin nhắn sau để thử nhớ ngữ cảnh:

```text
Mã dự án là DA-4821. Hãy ghi nhớ trong cuộc hội thoại này.
Mã dự án tôi vừa nói là gì?
```

Các lệnh nhập **tại `You:`**:

| Lệnh/thao tác | Hành vi |
| --- | --- |
| `/history` | In lịch sử role/content trong Session hiện tại |
| `/exit` | Đóng CLI |
| Ctrl+C khi đang chạy | Yêu cầu hủy lượt hiện tại |
| Ctrl+C khi idle | Thoát CLI |

CLI hiện chỉ in câu trả lời sau khi lượt hoàn tất, chưa hiển thị từng token hoặc
trạng thái chờ. Một lượt dùng tool có thể gọi API nhiều lần. Timeout mặc định là
120 giây cho **mỗi model request**, có thể đặt `timeoutMs` trong connection JSON.
Chỉ từ việc chưa có output chưa thể kết luận request bị treo.

Với `--session demo-01`, lịch sử được lưu vào Session có ID `demo-01`. Nếu bỏ
`--session`, CLI tạo ID mới và in ID đó để bạn dùng lại.

## 9. Mở lại hội thoại sau restart

Sau khi đã chat ở bước 8, nhập `/exit`, rồi chạy lệnh sau tại thư mục gốc repo:

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --session demo-01 --tools
```

CLI đọc provider/model đã lưu, nên bạn không cần nhập lại hai flags đó. Tại
`You:`, hỏi `Mã dự án tôi đã nói là gì?` để thử ngữ cảnh của hội thoại trước.
App dùng key trong environment hoặc key đã lưu mã hóa bằng wizard. Nếu thiếu,
app hỏi nhập key trong terminal tương tác. Nếu đã lưu environment ở `User`, có
thể nạp vào `Process` theo bước 5. Database không lưu key. Model có thể diễn đạt khác,
nên xem lịch sử bên dưới để kiểm tra trực tiếp dữ liệu đã được lưu.

Liệt kê Sessions và đọc toàn bộ messages **không cần API key, config hay gọi model**:

```powershell
pnpm.cmd chat --list-sessions
pnpm.cmd chat --session demo-01 --history
```

`--history` in JSON đầy đủ, có tool calls/results và provider metadata; `/history`
trong chat chỉ in role/content. Chỉ đọc Session chưa tồn tại trả `SESSION_NOT_FOUND`.
Chat với một ID chưa tồn tại tạo Session mới và yêu cầu provider/model.

Dữ liệu mặc định ở `.deckagent/sessions.sqlite`, tính từ thư mục bạn chạy lệnh.
Thư mục `.deckagent/` đã được Git bỏ qua. Muốn lưu nơi khác, thêm cùng một
`--data-dir` vào mọi lệnh tạo, mở lại, liệt kê và đọc lịch sử, ví dụ:

```powershell
pnpm.cmd chat --data-dir .deckagent/my-tests --list-sessions
```

Nếu chạy bằng flags với file cấu hình riêng, truyền lại `--config <file>` khi
chat. Connection đã chọn qua wizard được giữ trong profile để dùng lại. Session
chỉ lưu connection ID/model, không lưu config hoặc key. Connection ID phải giữ cùng ý
nghĩa trong file đó. Muốn đổi provider/model, chọn ID Session mới. Khi mở lại,
`--tools` vẫn cần được bật nếu muốn dùng `noop`.

Backend này phục vụ một Host với dữ liệu local; không chạy đồng thời nhiều CLI
trên cùng Session. Nó giữ lịch sử đã commit, chưa tự chạy tiếp tool bị ngắt do
kill process/mất điện. Chi tiết schema và phạm vi ở
[Session Persistence](docs/v1-plan/task-002-c-session-persistence.md).

## 10. Các lỗi thường gặp

| Triệu chứng/lỗi | Cách xử lý |
| --- | --- |
| Thiếu script `chat`, thiếu `src/chat.ts` hoặc config mẫu | Kiểm tra branch/commit có code TASK-002 đã được push chưa |
| Không nhận `node`/`pnpm.cmd`, hoặc sai Node engine | Cài đúng phiên bản ở bước 1, mở terminal mới và kiểm tra lại `--version` |
| Không tìm thấy `lib/chat.js` hoặc package nội bộ | Chạy lại install và build ở bước 2 |
| PowerShell chặn `pnpm.ps1` | Dùng `pnpm.cmd` như các lệnh trong README |
| `CLI_CONFIG` / `PROVIDER_CONFIG` | Kiểm tra JSON, connection ID, model ID và arguments; xem `pnpm.cmd chat --help` |
| Profile local không hợp lệ | Dùng `pnpm.cmd chat --setup` để thiết lập lại; app không tự xóa file lỗi |
| `CLI_CREDENTIALS` | Không đọc/lưu được key mã hóa; chạy trong terminal tương tác để nhập lại, hoặc dùng environment |
| `CLI_STORAGE` | Kiểm tra quyền đọc/ghi data directory và các file cấu hình/credentials |
| `PROVIDER_CREDENTIALS` | Kiểm tra tên `apiKeyEnv` và phép kiểm tra `True` ở bước 5; nhập lại key nếu sai định dạng |
| `PROVIDER_TLS` | Dùng `--use-system-ca`; nếu vẫn lỗi, kiểm tra certificate trust/expiry/hostname của endpoint |
| `PROVIDER_AUTH` | API trả 401/403; kiểm tra key và quyền truy cập API/model |
| `PROVIDER_RATE_LIMIT` | API trả 429; kiểm tra quota/rate limit của provider |
| `PROVIDER_HTTP` | Kiểm tra HTTP status, API root, model ID và generation options |
| `PROVIDER_NETWORK` | Giữ dòng lỗi có phase `request`/`stream` và mã transport nếu có để chẩn đoán; thông báo này không in key |
| `PROVIDER_TIMEOUT` | Request đã vượt timeout; kiểm tra kết nối và cấu hình `timeoutMs` |
| `SESSION_CONFLICT` | Provider/model truyền vào khác Session đã lưu; dùng ID Session mới |
| `SESSION_NOT_FOUND` | Kiểm tra ID và `--data-dir`; dùng `--list-sessions` để xem danh sách |
| `SESSION_SCHEMA` / `SESSION_CORRUPT` | Giữ nguyên dữ liệu; kiểm tra phiên bản app/file, hoặc chọn data directory khác để thử |
| `SESSION_STORAGE` | Kiểm tra quyền ghi, ổ đĩa, file SQLite và việc process khác giữ database |

## Cấu trúc code, CI và tài liệu

DeckAgent tự xây Agent Harness; Cordis quản lý composition và lifecycle. Cấu trúc
`apps/` + `packages/` là quy ước workspace của dự án, không phải yêu cầu của Cordis.

| Thư mục | Trách nhiệm |
| --- | --- |
| `vendor/` | Cordis và bộ dependencies/plugins đã pin; provenance ở [UPSTREAM.md](UPSTREAM.md) |
| `packages/agent/runtime/` | Agent loop, contracts, Tool Registry, Memory Session Store, prompt builder và Cordis plugin |
| `packages/llm/providers/` | Adapter theo giao thức API, credentials và HTTP/SSE |
| `packages/session/persistence/` | SQLite Session Store, metadata, schema version và atomic append |
| `apps/agent-runtime/` | Application composition, setup terminal, credentials mã hóa và chat có lưu/mở lại Session |
| `apps/foundation/` | Boot trực tiếp Cordis bằng `new Context()`/`ctx.plugin()` và smoke fixture |

[Foundation CI](.github/workflows/foundation.yml) chạy install, build/typecheck,
foundation tests, Runtime tests, local HTTP provider tests, Session/restart tests, CLI setup/DPAPI, foundation CLI và UX
prototype regression trên Windows cho PR/push vào `dev`/`main`. Summary ghi SHA và
kết quả từng check. Chỉ dùng evidence đạt yêu cầu trên merged `dev` để đóng Gate;
local tests hoặc một lần chat thành công không tự đóng Gate 002. Branch protection
được cấu hình riêng trong repository settings.

- [Progress và evidence](docs/v1-plan/PROGRESS.md): trạng thái các tasks, local checks và manual Gemini check do người dùng cung cấp.
- [Runtime contracts](docs/v1-plan/task-002-a-agent-runtime.md): model/storage/tool interfaces và giới hạn schema object đóng với primitive parameters.
- [Model Providers](docs/v1-plan/task-002-b-model-providers.md): cấu hình protocol, metadata/signatures, giới hạn và handoff cho persistence.
- [Session Persistence](docs/v1-plan/task-002-c-session-persistence.md): schema SQLite, metadata, lifecycle và kiểm tra restart.
- [CLI onboarding](docs/v1-plan/task-002-cli-onboarding.md): setup lần đầu, profile và credentials mã hóa trên Windows.
- [OpenCodeReview tooling](docs/tooling/open-code-review.md).
- [Shared agent skill maintenance](docs/agents/skill-maintenance.md).
