# TASK-002-A — Agent Runtime do DeckAgent tự xây

Ngày cập nhật: 20-10-2026. Task owner chốt chỉ reuse Cordis và giữ cấu trúc
`packages/` + `apps/`. Đây là contract ban đầu phục vụ TASK-002-A/B/C; các thiết
kế sâu hơn của toàn bộ V1 vẫn cần thống nhất khi triển khai từng group.

## Phạm vi và vị trí code

| Thành phần | Vị trí / trách nhiệm |
| --- | --- |
| Runtime | `packages/agent/runtime/src/agent-runtime.ts`: quản lý live Agents, lượt chạy, model steps, tool calls và disposal |
| Contracts | `packages/agent/runtime/src/contracts.ts`: messages, model stream, Session Store, tool schema và kết quả lượt chạy |
| Tools | `packages/agent/runtime/src/tool-registry.ts`: đăng ký, kiểm tra schema/input, kiểm soát allowlist và dispatch |
| Session | `packages/agent/runtime/src/memory-session.ts`: lịch sử trong bộ nhớ, đọc/ghi bằng bản sao |
| Prompt | `packages/agent/runtime/src/prompt.ts`: system prompt cấu hình hiện tại + lịch sử Session |
| Cordis | `packages/agent/runtime/src/plugin.ts`: dependency injection và cleanup |
| Application | `apps/agent-runtime/src/index.ts`: khởi động và nối các implementations |
| Chat CLI | `apps/agent-runtime/src/chat.ts`: provider thật của B và SQLite Session Store của C; fake model demo đã bỏ |

`@deckagent/agent-runtime` là package private trong workspace. `apps/` và
`packages/` là quy ước tổ chức của DeckAgent, không phải yêu cầu của Cordis.
Chỉ bộ Cordis vendor hiện có được reuse; Harness không dùng types, vòng lặp,
Session, Tool Runtime, provider hay app-boot của DeepSeek.

## Public interface cho application

```typescript
const ctx = await startAgentRuntime({ model, sessions, tools, systemPrompt })
const agent = await ctx.agentRuntime.createAgent({
  sessionId: 'chat-1',
  selection: { provider: 'example-provider', model: 'example-model' },
  tools: ['noop'],
})
const result = await agent.send('Hello', { signal })
const history = await agent.history()
await agent.dispose()
await ctx.fiber.dispose()
```

`model` là bắt buộc. `sessions` mặc định dùng `MemorySessionStore`; `tools`
mặc định là registry rỗng. `systemPrompt` có thể bỏ trống, `maxSteps` mặc định
là 8 và phải là số nguyên dương. Application tự viết boot trực tiếp bằng
`new Context()` và `ctx.plugin()`, không đọc YAML hoặc tự tải `.env`.

Cordis services là `agentModel`, `agentSessions`, `agentTools`, `agentRuntime`.
Runtime plugin inject ba dependencies đầu; khi unload, nó hủy và chờ work đang
chạy và Session đang mở kết thúc. Plugin không sở hữu việc đóng provider hay backend bên ngoài;
chủ sở hữu các dependencies đó phải giữ chúng hoạt động cho tới khi Runtime
đã drain. `ModelAdapter` và tool executor phải phản hồi `AbortSignal`.

Mỗi Session chỉ có một live Agent trong một Runtime. Mỗi Agent chỉ chạy một
lượt tại một thời điểm; request trùng bị reject với `SESSION_BUSY`. Không tự
queue request mới. Dispose handle giữ history và giải phóng live identity, nên
có thể mở lại cùng Session trong Host hiện tại. Dispose root cũng dispose tất
cả handles; không có model call mới sau khi Runtime đã dispose.

## TASK-002-B — Model Adapter và credentials

B triển khai `ModelAdapter.stream(request): AsyncIterable<ModelEvent>`.
`request` chứa selection `{ provider, model }`, messages, tool schemas và signal.
Credentials do adapter/application configuration sở hữu, không thêm vào messages,
Session history, tool arguments hoặc logs.

Các events của một model step:

- `text-delta`: một phần text.
- `tool-call`: một call hoàn chỉnh `{ id, name, arguments }`; adapter phải ghép
  argument deltas và parse JSON của provider trước khi yield event này.
- `provider-state` (tùy chọn, bổ sung trong TASK-002-B): JSON metadata riêng của
  giao thức, ví dụ thought signatures. Runtime gắn `{ provider, model }` đang
  chọn và lưu thành `assistant.providerState` khi step hoàn tất. Adapter chỉ
  replay state khi cả connection ID, model và protocol khớp; không đưa credentials
  vào state. UI chỉ hiển thị content, không hiển thị metadata này.
- `finish`: đúng một event cuối với reason `stop` hoặc `tool-calls`.

`stop` không kèm tool calls; `tool-calls` phải có ít nhất một call. Không yield
events sau finish. IDs của tool calls phải không trùng trong history Session.
Lỗi provider được throw để Runtime đóng lượt với trạng thái `failed`; B phải
chuẩn hóa thông báo lỗi để không lộ credentials. Model fixture chỉ còn trong
tests; CLI chat yêu cầu provider thật.

Implementation B và hướng dẫn chat thật ở [Model Providers](task-002-b-model-providers.md).
`ModelProviders` chọn adapter theo protocol của connection cấu hình; không thêm
nhánh xử lý từng vendor vào Runtime.

## TASK-002-C — Session Store và persistence

C triển khai ba phương thức async của `SessionStore`:

- `open(sessionId)`: tạo Session rỗng nếu chưa có; mở history nếu đã có.
- `read(sessionId)`: trả snapshot của messages theo đúng thứ tự.
- `append(sessionId, messages)`: bổ sung toàn bộ batch theo thứ tự, hoặc reject
  mà không ghi một phần batch.

Messages gồm `user`, `assistant` và `tool`; tool result tham chiếu đúng
`toolCallId`. Assistant message chứa calls được ghi trước khi thực thi tools;
mỗi result được ghi trước khi chạy call tiếp theo. System prompt được application
cung cấp cho mỗi request, không được Memory Store tự lưu. Model selection thuộc
live Agent options; CLI của C lưu thêm selection trong metadata riêng của backend
để mở lại đúng model. Ba phương thức SessionStore của Runtime giữ nguyên.

C phải round-trip nguyên vẹn `assistant.providerState` nếu có, cùng content và
tool calls, để model tiếp tục tool calling với reasoning metadata/signatures.
Trường này là tùy chọn: histories và adapters cũ không cần thêm state. Đây không
phải credentials hay metadata dùng để tự chọn model khi khôi phục Session.

Memory Store sao chép dữ liệu khi append và read; nó không persist qua Host
restart. Nó không phải Session Event Log hoặc Session Projection đầy đủ. Không
có locking giữa nhiều Host processes trong implementation A.

TASK-002-C bổ sung [SQLite store và cách mở lại Session](task-002-c-session-persistence.md)
trong `packages/session/persistence`; CLI inject backend này, bind selection trước
khi tạo Agent và đóng store sau Cordis disposal. Memory Store vẫn dùng cho tests
và caller không inject backend. Backend mới không nhập SQLite vào Runtime.

## Tools, kết quả và giới hạn

Tool có name, description, parameters và `execute(args, { signal })` trả string.
Schema được hỗ trợ ở phiên bản này là object đóng (`additionalProperties: false`),
properties kiểu `string`/`number`/`boolean`, với danh sách `required` tùy chọn.
Schema chứa keywords chưa hỗ trợ bị từ chối khi đăng ký; không quảng bá constraints
mà dispatch không kiểm tra. Nested schemas, binary content và output DTOs chưa
được định nghĩa trong contract này.

Agent chỉ thấy và gọi được các tên trong allowlist `tools` của chính nó. Runtime
chạy calls tuần tự, ghép result vào history, rồi gọi model tiếp. Tool không được
phép, input sai hoặc tool throw tạo error result để model xử lý; không gọi
executor nếu quyền hoặc input không hợp lệ.

`send()` trả `completed`, `failed` hoặc `cancelled`, kèm text và số model steps;
lỗi có code/message. Những lỗi admission như Agent đã dispose hoặc Session đang
bận bị reject. Lỗi storage cũng có thể reject; backend phải đáp ứng batch contract.
Stream sai protocol và vượt `maxSteps` kết thúc lượt bằng failure.

Khi stream bị ngắt, text đã nhận được giữ bằng assistant message có
`interrupted: true`. Khi tool đang chạy bị hủy, result ghi `TOOL_ABORTED` (outcome
có thể chưa biết); các calls còn lại ghi `TOOL_NOT_STARTED`. Runtime không tự
retry thao tác. Đây là cơ chế hủy cơ bản, chưa nghiệm thu recovery/crash semantics
của TASK-007 hoặc sandbox/permissions của File Tools trong TASK-003.

## Chạy và nghiệm thu

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test:agent-runtime
pnpm test:session-persistence
pnpm chat --help
pnpm test:foundation
pnpm start:foundation
```

PowerShell có thể dùng `pnpm.cmd` khi chặn shim `.ps1`. Toolchain giữ Node
`^22.19.0 || >=24.0.0`, pnpm `11.28.5`. Tests chạy local không cần API key;
chat thủ công cần provider/key theo [README](../../README.md).
Các checks và revision thực tế nằm trong [progress dashboard](PROGRESS.md).
Group TASK-002 chỉ DONE sau khi tích hợp provider thật của B, storage của C,
kiểm tra restart và Gate 002 PASS trên cùng dev baseline.
