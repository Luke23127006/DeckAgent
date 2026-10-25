# TASK-002-B — Model Providers và chat thủ công

Cập nhật: 20-10-2026. DeckAgent tự xây Harness; chỉ reuse bộ Cordis hiện có.
Task owner yêu cầu một lớp chung cho nhiều model, không gắn Runtime với một vendor.
Implementation local dùng `ModelAdapter` của TASK-002-A và native `fetch`, không
thêm SDK hoặc production dependency bên ngoài workspace.

## Thành phần và cách mở rộng

| Thành phần | Trách nhiệm |
| --- | --- |
| `packages/llm/providers/src/index.ts` | Public `ModelProviders`, cấu hình connections, chọn kết nối, đọc credentials và quản lý HTTP/timeout |
| `chat-completions.ts` | Messages/tools và SSE của Chat Completions; dùng chung cho endpoint tương thích, gồm OpenAI và DeepSeek |
| `anthropic-messages.ts` | System prompt, content blocks, tool_use/tool_result và thinking signatures của Messages |
| `gemini.ts` | Contents/parts, function calls/results và thought signatures của GenerateContent |
| `wire.ts` | SSE framing, UTF-8, ghép chunks và kiểm tra JSON |
| `apps/agent-runtime/src/chat.ts` | Setup hoặc đọc cấu hình đã lưu, nối Cordis Runtime và giao tiếp terminal |
| `config/models.example.json` | Ví dụ cấu hình bốn kết nối, chỉ chứa tên biến môi trường chứa key |

Luồng chạy: CLI đọc connection ID + model → `ModelProviders` chọn protocol → API
trả stream → adapter chuẩn hóa thành `ModelEvent` → Runtime lưu assistant,
thực thi tools được cho phép và gọi model tiếp nếu cần.

Một model mới dùng giao thức đã có chỉ cần đổi cấu hình và model ID. Một giao thức
mới cần thêm adapter trong package providers, không cần thay vòng lặp Runtime.
Không thể bảo đảm mọi model có cùng khả năng: model chat không hỗ trợ tool calling
vẫn có thể chat với tools tắt. Phạm vi hiện tại là text chat và function tools.

Ba protocol IDs ở đây là contract kỹ thuật của developer CLI. Connection IDs trong
file ví dụ là nhãn có thể đổi tùy ý; không chốt IDs built-in, danh sách default
models hoặc chính sách custom APIs của Settings UI. Các quyết định sản phẩm đó
vẫn pending trong business rules; UI chọn model thuộc TASK-004.

## Cấu hình kết nối

File JSON có đúng một trường `connections`, là mảng các objects:

| Trường | Ý nghĩa |
| --- | --- |
| `id` | ID duy nhất; chữ, số, dấu gạch dưới, gạch ngang hoặc dấu chấm. `selection.provider` phải khớp ID này |
| `protocol` | `chat-completions`, `anthropic-messages` hoặc `gemini` |
| `baseUrl` | API root, chưa có endpoint suffix. HTTPS; HTTP chỉ cho localhost/loopback. Không chứa user/password, query hoặc fragment |
| `apiKeyEnv` | Tên biến môi trường chứa key. Chỉ key của connection được chọn mới cần có. Bỏ trường này cho endpoint không yêu cầu authentication |
| `timeoutMs` | Timeout cho toàn bộ một model request/stream, mặc định 120000 ms; số nguyên dương |
| `maxOutputTokens` | Token limit tùy chọn. Messages mặc định 4096 vì API yêu cầu; Chat Completions/Gemini không gửi limit nếu bỏ trống |
| `tokenLimitField` | Chỉ Chat Completions: `max_tokens` mặc định hoặc `max_completion_tokens`; chọn theo endpoint/model. Chỉ được gửi khi có `maxOutputTokens` |
| `temperature` | Tùy chọn, từ 0 đến 2; chỉ đặt nếu model chấp nhận tham số này |

Các trường không hỗ trợ, gồm plaintext `apiKey`, bị từ chối. Có thể khai báo hai
connections cùng protocol với URL, key hoặc generation options khác nhau. Model
ID được chọn qua wizard/profile hoặc truyền rõ qua CLI/biến môi trường; Gemini nhận ID không có
tiền tố `models/`. Adapter không tự tìm model, đổi model hoặc fallback khi lỗi.

Ví dụ thêm endpoint Chat Completions tương thích vào `connections`:

```json
{
  "id": "my-api",
  "protocol": "chat-completions",
  "baseUrl": "https://your-api.example/v1",
  "apiKeyEnv": "MY_MODEL_API_KEY",
  "timeoutMs": 120000
}
```

Thay URL ví dụ bằng API root thật. Các APIs cần OAuth, Azure-specific routing,
headers riêng, Responses API, Gemini Interactions/Vertex hoặc protocol khác chưa
có adapter. Không suy ra khả năng tương thích chỉ từ tên model hoặc vendor.

## Chạy chat thật bằng PowerShell

Luồng user hiện tại là `pnpm.cmd chat`: app hướng dẫn setup nếu thiếu dữ liệu,
lưu defaults và tùy chọn lưu key mã hóa riêng trên Windows. [CLI onboarding](task-002-cli-onboarding.md)
mô tả precedence/profile/credentials. Adapter vẫn nhận credentials qua environment
được application inject, không thay ModelAdapter hoặc ghi key vào history.
Các lệnh bên dưới là cách cấu hình flags/environment cho developer.

Yêu cầu Node `^22.19.0 || >=24.0.0`, pnpm `11.28.5`. Tại repository root:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
pnpm.cmd chat --help
```

Chọn một connection trong file ví dụ; chỉ cấu hình key tương ứng:

| Connection ví dụ | Biến môi trường |
| --- | --- |
| `openai` | `OPENAI_API_KEY` |
| `deepseek` | `DEEPSEEK_API_KEY` |
| `anthropic` | `ANTHROPIC_API_KEY` |
| `google` | `GEMINI_API_KEY` |

Ví dụ với connection `openai`; nhập key ở prompt ẩn để không lưu key vào shell
command history. Đổi connection và tên biến key khi dùng API khác:

```powershell
$deckagentKey = Read-Host 'API key' -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $deckagentKey).Password
Remove-Variable deckagentKey
$env:DECKAGENT_PROVIDER = 'openai'
$env:DECKAGENT_MODEL = Read-Host 'Model ID được tài khoản của bạn hỗ trợ'
pnpm.cmd chat
```

Nếu gặp `PROVIDER_TLS` do Node chưa dùng CA đã được Windows tin cậy, bật system
CA cho process rồi chạy lại. Với Node 22.19 trở lên, hai cách tương đương:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
pnpm.cmd chat

# Hoặc chạy trực tiếp entrypoint đã build:
node --use-system-ca apps/agent-runtime/lib/chat.js --provider google --model $deckagentModel --tools
```

Ở lệnh trực tiếp, `$deckagentModel` là model ID bạn đã chọn. Node bổ sung CA từ
system store và vẫn xác minh chứng chỉ HTTPS; xem
[Node.js system CA](https://nodejs.org/download/release/v22.19.0/docs/api/cli.html#--use-system-ca).
Nếu lỗi do chứng chỉ hết hạn hoặc sai hostname, cần sửa chứng chỉ/endpoint tương ứng.

Nhập `Xin chào`, rồi hỏi tiếp về câu trước. CLI giữ history trong process, trả
`Assistant: ...` sau mỗi lượt hoàn tất. `/history` in role/content; `/exit` hoặc
Ctrl+C lúc idle thoát. Ctrl+C trong lượt chạy hủy request; có thể gửi tin mới sau
đó. EOF cũng đóng Runtime. Chưa hiển thị text theo từng token trong terminal.

Gửi một lượt và kiểm tra tool calling khi model có hỗ trợ:

```powershell
pnpm.cmd chat --prompt 'Trả lời ngắn bằng tiếng Việt'
pnpm.cmd chat --tools --prompt 'Gọi noop với value DeckAgent, rồi đọc lại kết quả'
Remove-Item Env:OPENAI_API_KEY
```

`--tools` chỉ đăng ký no-op echo; không truy cập filesystem hoặc shell. Dòng
`Tool noop: DeckAgent` chỉ xuất hiện khi executor thật sự chạy. Nếu chỉ có câu trả
lời của model mà không có dòng này, chưa chứng minh model đã gọi tool. Cấu hình
`--config`, `--provider`, `--model` ghi đè các biến tương ứng
`DECKAGENT_MODELS_CONFIG`, `DECKAGENT_PROVIDER`, `DECKAGENT_MODEL`. Không tự tải `.env`.

## Credentials, lỗi và lịch sử

Key được tra từ môi trường khi gửi mỗi request và đặt trong header của protocol.
Giá trị key phải là printable ASCII không có khoảng trắng. Key bị dính ký tự ẩn,
Unicode hoặc whitespace bị từ chối với `PROVIDER_CREDENTIALS` trước khi tạo HTTP
request; nhập lại giá trị key gốc từ nguồn cấp key.
Không thêm key vào messages, tool arguments, opaque state hoặc URL. Không log
HTTP bodies/raw exceptions; HTTP errors chỉ có status và mã ổn định. Redirect bị
từ chối để không chuyển credentials sang endpoint khác. Không tự retry.

| Mã lỗi | Hành động kiểm tra |
| --- | --- |
| `CLI_CONFIG` / `PROVIDER_CONFIG` | Kiểm tra JSON, arguments, ID, URL và generation options |
| `PROVIDER_NOT_FOUND` | Connection ID đã chọn có trong cấu hình không |
| `PROVIDER_CREDENTIALS` | Biến `apiKeyEnv` của connection đã chọn đã được đặt trong process chưa |
| `PROVIDER_AUTH` | API trả 401/403; kiểm tra key và quyền dùng API/model |
| `PROVIDER_RATE_LIMIT` | API trả 429; kiểm tra quota/rate limit ở provider |
| `PROVIDER_HTTP` | HTTP status khác; kiểm tra endpoint, model và cấu hình tại provider |
| `PROVIDER_TLS` | Kiểm tra certificate trust/expiry/hostname; CA được OS tin cậy có thể dùng `--use-system-ca` như hướng dẫn ở trên |
| `PROVIDER_NETWORK` / `PROVIDER_TIMEOUT` | Kiểm tra DNS, kết nối, proxy, redirect và timeout |
| `MODEL_PROTOCOL` | Stream, tool arguments hoặc finish reason không thuộc phần adapter hỗ trợ |
| `ABORTED` | Request bị hủy |

Thông báo `PROVIDER_NETWORK` phân biệt `request failed` (chưa có HTTP response
thành công) và `stream failed` (đã có response nhưng lỗi khi đọc/chuẩn hóa stream).
Nếu có mã transport đã biết, ví dụ `ECONNRESET` hoặc `UND_ERR_SOCKET`, thông báo
ghi đúng mã đó. Không sao chép raw error messages, URLs, headers hay mã tùy ý.
Khi cần chẩn đoán, chạy lại đúng lệnh và giữ dòng lỗi đã được chuẩn hóa này.

Runtime contract thêm event tùy chọn `provider-state` chứa JSON; khi step hoàn tất,
Runtime lưu `{ provider, model, data }` vào assistant message. Adapters cũ không
cần phát event này. Thinking signatures/parts và reasoning metadata được giữ
nguyên cho cùng connection/model/protocol; không in trong CLI history. Nếu step
lỗi giữa stream, chỉ partial text được lưu với `interrupted: true`, không tự
khôi phục reasoning hay retry tools. TASK-002-C phải persist nguyên trường tùy
chọn này cùng messages. [SQLite backend của C](task-002-c-session-persistence.md)
đã lưu nguyên state và selection riêng để CLI mở lại Session. `/history` tương
tác chỉ in content; flag `--history` của C in JSON đầy đủ gồm provider metadata.

## Kiểm thử và giới hạn nghiệm thu

```powershell
pnpm.cmd test:model-providers
pnpm.cmd test:agent-runtime
```

Provider tests dùng local HTTP servers, không cần key thật và không gọi cloud.
Chúng kiểm tra model/config/header mapping, text/SSE chunks, tool round-trips
của ba protocol, metadata replay, credentials isolation, lỗi/timeout/cancellation
và CLI nhiều lượt/one-shot failure. CI chạy cùng bộ checks local này.

Đã xác minh local: 21/21 provider/CLI tests và 22/22 Runtime tests PASS trên Windows
với Node 22.19.0/pnpm 11.28.5. Kết quả có revision và giới hạn nằm ở
[progress dashboard](PROGRESS.md). Ngày 20-10-2026, người dùng cung cấp terminal
output của Gemini `gemini-3.8-flash`: executor in `Tool noop: DeckAgent`, sau đó
assistant đọc lại kết quả thành công. Manual live round-trip này dùng connection
`google` với system CA; agent không nhận key hoặc chạy lại authenticated request.
Chưa live check các providers khác, Ctrl+C trực tiếp bằng bàn phím, hosted CI,
hoặc cloud history sau restart. C đã có process-restart check qua local HTTP.
Không có số đo latency; CLI vẫn chỉ in câu trả lời sau
khi turn hoàn tất. Kết quả này không chứng minh mọi model/provider đã tương thích.

Local implementation chưa phải task DONE hoặc Gate PASS. Gate 002 còn cần model
thật hoàn tất request và durable Session của TASK-002-C đọc lại sau Host restart
trên baseline tích hợp. Không commit key hoặc nội dung hội thoại nhạy cảm làm evidence.

## Tài liệu API dùng để đối chiếu

- [OpenAI Chat Completions streaming events](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events): content/tool deltas, call indices và finish reasons.
- [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/): giữ `reasoning_content` qua các requests khi dùng tools.
- [Anthropic Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming): content block lifecycle, partial JSON input và thinking/signature deltas.
- [Gemini GenerateContent reference](https://ai.google.dev/api/generate-content): stream endpoint, contents/parts, function response và `parametersJsonSchema`.
- [Gemini thought signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures): gửi lại signatures trong đúng response parts khi tiếp tục tool calling.

Các tài liệu xác định wire format; không thay thế live compatibility checks.
