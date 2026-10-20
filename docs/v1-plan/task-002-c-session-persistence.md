# TASK-002-C — Session Persistence

Ngày cập nhật: 20-10-2026. Task owner đã chốt SQLite local, CLI mở lại Session
theo ID và bỏ fake model demo khỏi app. Đây là implementation cho Host local
của TASK-002; chưa xác lập kiến trúc lưu trữ cho mọi thành phần V1.

## Thành phần và quyền sở hữu

| Thành phần | Trách nhiệm |
| --- | --- |
| `packages/session/persistence` | Package private `@deckagent/session-persistence`; SQLite, metadata, định dạng messages và schema version |
| `apps/agent-runtime/src/chat.ts` | Chọn data directory, tạo/mở Session, kiểm tra model selection, inject store và đóng database |
| `packages/agent/runtime` | Dùng nguyên contract `SessionStore.open/read/append`; không import SQLite |
| `tests/session-persistence.test.mjs` | Kiểm tra store thật, CLI qua hai process và shutdown/reopen |

Dùng `node:sqlite` có sẵn trong Node; không thêm dependency ngoài workspace.
Node 22.19.0 đã được kiểm tra và có thể in ExperimentalWarning. Build/typecheck
giữ nguyên yêu cầu Node/pnpm trong manifest. Dữ liệu mặc định là
`.deckagent/sessions.sqlite`, được Git bỏ qua. `--data-dir` thay thư mục chứa DB;
ID Session là khóa trong DB, không được dùng làm đường dẫn file.

## Public interface và metadata

`new SqliteSessionStore(databasePath)` mở hoặc khởi tạo file. Store implements
[Runtime SessionStore contract](task-002-a-agent-runtime.md):

- `open(id)`: tạo Session rỗng nếu thiếu; mở lại không xóa history.
- `read(id)`: trả snapshot theo thứ tự đã ghi; ID chưa có trả `SESSION_NOT_FOUND`.
- `append(id, messages)`: ghi cả batch trong một transaction hoặc rollback toàn bộ.

Các phương thức bổ sung chỉ phục vụ application, không mở rộng Runtime contract:

- `bind(id, { provider, model })`: tạo Session hoặc gắn selection một lần. Lần
  gọi sau phải cùng selection; khác trả `SESSION_CONFLICT`, không đổi dữ liệu.
- `getInfo(id)`: trả metadata hoặc `undefined` nếu chưa có.
- `list()`: metadata các Sessions theo `updatedAt` giảm dần, rồi ID.
- `close()`: đóng kết nối, gọi nhiều lần được; thao tác sau đó trả `SESSION_CLOSED`.

`SessionInfo` chứa `sessionId`, `createdAt`, `updatedAt`, `messageCount` và
`selection` tùy chọn. Timestamps là UTC ISO strings; `createdAt` giữ nguyên,
`updatedAt` thay đổi cùng transaction append có dữ liệu. `open()` của contract
chung không yêu cầu selection; CLI gọi `bind()` trước khi tạo Agent.

CLI dùng selection đã lưu trước các defaults từ environment. Flags
`--provider`/`--model` truyền rõ phải khớp Session hiện có. Session mới lấy
selection từ flags hoặc environment. Connection JSON và credentials tiếp tục
thuộc Model Providers/application, không được sao chép vào metadata. CLI kiểm
tra config/credentials trước khi bind; không gọi API chỉ để mở store hoặc đọc history.

## Định dạng SQLite và atomicity

Database schema version 1 có application ID `0x44414754` và `PRAGMA user_version=1`:

| Bảng | Dữ liệu |
| --- | --- |
| `sessions` | `id` khóa chính, `created_at`, `updated_at`, `provider`, `model` |
| `messages` | khóa chính `(session_id, sequence)`, foreign key đến Session, `payload` JSON |

`sequence` bắt đầu từ 1 trong từng Session. Payload giữ nguyên Message contract:
system/user content; assistant content, toolCalls, interrupted và providerState;
tool content, toolCallId, name và isError. Reasoning metadata, signed parts và
thought signatures được giữ nguyên JSON để adapter replay đúng protocol.
Không ép mọi message thành role/content hoặc serialize thành text transcript.

Store kiểm tra Message shape và dữ liệu JSON trước từng insert trong transaction;
undefined, NaN, BigInt hoặc giá trị có thể bị JSON làm mất dữ liệu bị từ chối.
Append dùng `BEGIN IMMEDIATE`, thêm messages, cập nhật timestamp rồi commit.
Batch lỗi rollback cả messages và metadata. Foreign keys bật; WAL và
`synchronous=FULL` dùng cho các commits local. Đây là atomicity của batch, không
phải transaction bao trùm model request và side effects của tool.

Chỉ file SQLite rỗng chưa thuộc ứng dụng khác mới được khởi tạo schema. File có
version/application ID không hỗ trợ bị từ chối với `SESSION_SCHEMA`; không tự
reset, downgrade hoặc xóa file. Schema được khởi tạo trong transaction; schema
v1 hiện chưa có migration từ version cũ. Integrity/schema checks chạy khi mở,
payload được validate khi đọc; lỗi dữ liệu trả thông báo an toàn, không in raw
SQL/file content. Khi cần đổi schema sau này, thêm migration có test tương thích.

## Lifecycle và cleanup fake model

CLI sở hữu store, còn Cordis sở hữu Runtime. Khi thoát hoặc lỗi, CLI await
`ctx.fiber.dispose()` rồi mới `sessions.close()`, kể cả khi dispose reject.
Runtime disposal giờ chờ cả Sessions đang mở và turns đang chạy. Partial text
được Runtime ghi với `interrupted: true` trước khi graceful shutdown hoàn tất.

App đã bỏ `src/demo-model.ts`, `src/cli.ts` và root script `start:agent-runtime`.
Entrypoint chat là `pnpm.cmd chat`. `ScriptedModel` trong `tests/fixtures` và
`MemorySessionStore` vẫn phục vụ tests; API `startAgentRuntime()` vẫn cho phép
inject store và mặc định Memory Store khi caller không truyền. CLI chat luôn
truyền SQLite store. CLI tool round-trip được kiểm tra bằng provider adapter thật
nối local HTTP, thay kiểm tra chạy fake demo trước đây.

## Chạy và kiểm tra restart

Hướng dẫn nhập key, chọn model và các lỗi thường gặp ở
[README setup và manual test](../../README.md). Sau install/build, dùng terminal
đã cấu hình key để tạo Session:

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --provider google --model gemini-3.8-flash --session demo-01 --tools
```

Hoặc dùng `pnpm.cmd chat --session demo-01 --tools`: [setup lần đầu](task-002-cli-onboarding.md)
hỏi provider/model/key nếu thiếu, rồi nhớ cấu hình. Không truyền `--session` vẫn
lưu tự động với ID mới; flag này dùng để đặt ID hoặc mở lại, không bật/tắt persistence.

Chat rồi `/exit`; chạy lại bằng cùng data directory và config:

```powershell
node --use-system-ca apps/agent-runtime/lib/chat.js --session demo-01 --tools
```

Các lệnh chỉ đọc không cần key hoặc config:

```powershell
pnpm.cmd chat --list-sessions
pnpm.cmd chat --session demo-01 --history
```

`--history` in JSON đầy đủ cho developer, gồm metadata; `/history` trong chat chỉ
in role/content. History không gửi request mới. Khi dùng `--data-dir`/`--config`
riêng, truyền lại đường dẫn tương ứng khi mở lại. Dữ liệu này là hội thoại local;
không thêm nội dung nhạy cảm hoặc file database vào commit.

Checks tự động không cần API thật:

```powershell
pnpm.cmd build
pnpm.cmd test:session-persistence
pnpm.cmd test:agent-runtime
pnpm.cmd test:model-providers
```

9 persistence tests bao gồm close/reopen, atomic rollback, schema không tương
thích, exact message round-trip, snapshot/session isolation, JSON validation,
dữ liệu hỏng và Cordis shutdown. CLI test dùng hai process nối local Gemini
HTTP fixture: process đầu ghi user → tool call có signature → tool result →
assistant; process sau mở cùng ID và adapter gửi lại signed parts/tool response
đúng như trước. Process khác đọc history/list khi không có key/config. Test
cũng kiểm tra selection conflict không gửi thêm request hoặc thay history.

## Phạm vi nghiệm thu và handoff

- Một Host dùng dữ liệu local; chưa có lease ngăn hai Hosts chạy đồng thời
  trên cùng Session. SQLite transactions không thay thế khóa toàn bộ Agent turn.
- Giữ các batch đã commit sau restart; chưa tự hoàn tất turn/tool đang dở khi
  process bị kill, mất điện hoặc side effect đã xảy ra nhưng chưa lưu result.
  Không tự retry/re-execute tool; recovery nâng cao thuộc TASK-007.
- System prompt/tool allowlist/generation options/config path không nằm trong
  Session metadata v1. CLI dùng cấu hình hiện tại và cần `--tools` lại nếu dùng noop.
- Chưa có Web history, Deck persistence, event log/projection, backup UI hoặc export.
- Kết quả local và source-copy, revision và giới hạn ở [PROGRESS.md](PROGRESS.md).
  Chưa có authenticated cloud restart check cho C trong môi trường agent; manual
  live evidence trước đó của B chỉ chứng minh model/tool round-trip.
  Chưa merge/hosted CI; TASK-002-C giữ `IN_PROGRESS`, Gate 002 `NOT_VERIFIED`.

## Tài liệu đối chiếu

- [Node 22.19 SQLite API](https://nodejs.org/download/release/v22.19.0/docs/api/sqlite.html): DatabaseSync, prepared statements và lifecycle.
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html): BEGIN IMMEDIATE, commit và rollback.
- [SQLite PRAGMA](https://www.sqlite.org/pragma.html): user_version, application_id, foreign_keys và synchronous.
- [SQLite WAL](https://www.sqlite.org/wal.html): journal mode và phạm vi local filesystem.
