# Request Events & Lifecycle

**Authority:** [ADR-0004](../adr/0004-request-events-lifecycle.md)  
**Dependencies:** [Session](session.md), [Tools & Permissions](tools-permissions.md), [Data](data.md)

## 1. End-to-end flow

```text
UI gửi request
  -> Host validate Chat, model, inputs và one-active-request
  -> SQLite: lưu user message + Request(active)
  -> OpenCode CLI Adapter: start `opencode run --format json`
  -> JSON event parser + MCP tool callbacks
  -> Host Event Adapter: normalize/sanitize, sequence, persist
  -> UI: local API event stream / reconnect replay
  -> Host: evaluate result + persisted artifacts
  -> SQLite: terminal state + final activities
  -> UI: final request status
```

Local Web UI là **consumer**, không sở hữu execution. Đóng UI không stop Host. Chỉ user Stop hoặc Host/process failure thay đổi lifecycle.

## 2. Minimal contracts

| Entity | Required fields / semantics |
|---|---|
| **Request** | `requestId`, `chatId`, `selectedModel`, `status`, `startedAt`, `endedAt?`, sanitized `error?`; `run/executionId` để trace CLI; durable identity. |
| **Activity/Event** | `eventId`, `requestId`, monotonically increasing `sequence`, `timestamp`, `kind`, `status?`, sanitized `detail`; read/replay theo sequence. |
| **Runtime event input** | JSON records từ OpenCode stdout (`step_start`, `step_finish`, `text`, `error`, native `sessionID` khi có); tool activity từ MCP. Không persist raw lines mặc định. |
| **UI read API** | Snapshot Request + activities từ SQLite; subscribe incremental changes theo cursor `(requestId, sequence)`. Gap/reconnect phải lấy lại records, không đoán. |
| **Stop API** | `requestId` + caller context; Host abort CLI, revoke MCP, settle running activities. Không cho mutation sau Stop. |

**Không chốt ngay:** cụ thể endpoint route, SSE vs transport đang có trong Local Web, bảng SQL và interface TypeScript. Chọn khi implement Host/UI adapter để tránh thêm abstraction không cần thiết. Contract observable phải giống nhau.

## 3. Request state machine

```text
created/admitted -> active -----> completed
                     |  |  |
                     |  |  +----> failed
                     |  +-------> stopped (user Stop)
                     +----------> interrupted (Host exits/restarts)
                     |
                     +--> waiting_approval --> active (allow/refuse step)
                                |                 
                                +--> stopped (Stop while waiting)
```

- `created/admitted` là bước transaction nhập request, không nhất thiết là UI status riêng.
- `waiting_approval` **vẫn active** theo FR-014/076, chặn request thứ hai cùng Chat.
- Câu hỏi làm rõ kết thúc request hiện tại (không phải waiting_approval); user trả lời bằng request mới.
- `failed` và `interrupted` cùng hiển thị *did not finish* theo FR-019; có thể giữ reason khác nhau. Không coi restart là một Stop do user chủ động.
- Terminal states không tự chuyển về active. Follow-up là request mới, có thể dùng OpenCode native session resume khi hợp lệ.

## 4. Event mapping & consistency

| Runtime / Host event | Product view |
|---|---|
| CLI `step_start`, `step_finish` | Model activity started/completed; chỉ phát activity thật sự quan sát được. |
| CLI `text` | Assistant content (buffer/delta theo parser); tránh nhân đôi text khi có nhiều event frames. |
| CLI `error` hoặc bất thường process | Error evidence; Host quyết định request failed hay recoverable. |
| MCP tool call/result | Tool activity running/completed/failed, cùng identity từ dispatch. |
| User approval pending/decision | Approval activity + Request waiting/active. Quyền per-step theo ADR-0003. |
| Stop, CLI exit, crash/restart | Host xác định terminal status, đóng các activity đang chạy. |

**Consistency rules:** Persist before publish; events ordered by sequence per Request; transaction bảo đảm không duplicate terminal transition; late events sau terminal không thay đổi product state; output không hoàn thành không replace stable deck/outline; lỗi một tool không tự đóng Request.

## 5. Test scope trong builds

- **Foundation/Chat:** request admission, one active per Chat, persisted event replay/reconnect, independent Chat isolation.
- **CLI integration:** JSON event parsing, malformed/partial output, process exit, error sanitization, native execution ID association.
- **Tools/permissions:** approval waiting, refuse/allow once, Stop abort + deny late writes; UI disconnect không revoke request.
- **Deck generation/editing:** partial finished slides được giữ, incomplete generation không publish như complete; request outcome bám vào domain state.
- **Restart recovery:** active request được đánh dấu chưa hoàn thành, no auto retry; activities và finished work vẫn đọc được.

## Reference

- [OpenDesign: CLI event parsing](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/json-event-stream.ts)
- [OpenDesign: persisted event batches](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/db.ts)
- [DeckAgent POC: JSON events](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/agent.ts)
