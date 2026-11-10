# ADR-0002 — Chat, OpenCode Session & History

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-02  
**Depends on:** [ADR-0001](0001-local-storage.md)

## Context

DeckAgent là local-first app. Người dùng có thể quay lại Chat cũ và đọc conversation/deck sau restart (UC-006), xem request đang chạy khi reload UI (UC-003 A13), và thấy request chưa xong sau khi app restart mà **không tự chạy lại** (UC-003 A11). Chat có tối đa một Deck (UC-012). Mọi thay đổi của model, permission hoặc workspace không được tự chuyển quyền giữa requests.

OpenDesign dùng OpenCode CLI `opencode run --format json`, capture `sessionID` và tiếp tục bằng `-s <id>` ở turn sau. Nó lưu `agent_sessions` liên kết `conversation_id` với native `session_id`, kèm model, cwd và last_message_id để tránh resume từ session không còn khớp conversation.

POC `feat/v2-opencode` lại tạo **native session mới cho mỗi send**, chuyển saved messages thành quoted context prompt. Cách này chứng minh CLI có thể nhận context, nhưng lặp transcript và không tận dụng native resume.

## Decision

1. **DeckAgent Chat là product identity ổn định.** Chat ID, Request ID, messages, activities, drafts và Deck được lưu ở Application SQLite. UI đọc history từ DeckAgent Host, không đọc trực tiếp OpenCode native files.
2. **Sử dụng OpenCode native session resume** cho các turn tiếp theo của *cùng Chat*, thông qua `opencode run -s <native-session-id>`. Turn đầu tạo native session do OpenCode cấp; DeckAgent capture ID từ structured events rồi lưu Chat ↔ Session mapping. Giữ `opencode run` là runtime integration đã chọn.
3. **Resume chỉ dùng khi session còn phù hợp.** Phải kiểm tra ít nhất Chat identity, current model/provider, execution directory/context, và continuity của completed turn. Nếu khác hoặc session không dùng được, khởi tạo native session mới cho Chat; DeckAgent vẫn giữ product history và chỉ seed context cần thiết theo current spec. Không dùng stale session dù OpenCode cho phép resume.
4. **Không resume một unfinished request sau app restart.** Khi Host khởi động lại, request trước đó còn active được đánh dấu `unfinished/failed` theo lifecycle contract, giữ saved activities và completed artifacts. Không tự gọi lại `opencode run` hoặc replay tool calls.
5. **UI reload khác Host restart.** Khi local Host vẫn sống, request tiếp tục chạy; UI lấy current state và events từ Host. Chat switch không stop request đang hoạt động. Mỗi Chat chỉ có tối đa một active request; các Chat khác có request độc lập.
6. **History và runtime context là hai tầng khác nhau.** DeckAgent giữ đầy đủ conversation cho UI, kể cả khi OpenCode tự compact context. Khi context quá dài, ứng dụng phải bảo đảm UC-003 A52: thông báo summary boundary, giữ full history readable và không làm mất brief/outline/deck/attachments. Cách kích hoạt compaction cụ thể thuộc runtime integration implementation, phải có test theo spec.
7. **Permission không kế thừa ngầm từ native session.** Mỗi request được Host xác định allowed tools/phase/working directory và kiểm tra lại trước các thao tác ghi. Native session chỉ là execution continuity, không phải source of truth cho authorization.

## Vì sao chọn

- Dùng native resume có sẵn trong OpenCode và đã được OpenDesign tích hợp, không tự viết lại Agent Loop hoặc resend transcript cho mọi turn.
- Tách application history khỏi runtime context giúp giữ dữ liệu sau restart, đổi model và lỗi của runtime.
- Resume guard tránh dùng nhầm context/model hoặc quyền từ execution trước.
- Khớp UC-003, UC-006 và storage ownership trong ADR-0001.

## Consequences

- Foundation/Chat cần `chat`, `request`, `message`, `activity` và `runtime_session_binding` (tên logic, **không phải SQL schema đã chốt**), với stable IDs và request state.
- CLI adapter phải capture `sessionID`, hỗ trợ `-s` có điều kiện và báo rõ khi session bị reset; không phụ thuộc hoàn toàn vào legacy `history.ts`.
- Khi invalidating native session, **không xóa Chat**; phải xác định seed-context policy và cách tránh replay tool calls.
- Request lifecycle/Events architecture (TD-04) chịu trách nhiệm atomicity của persisted activity và recovery state.
- Model switch, workspace relink, Stop/restart và context compaction cần regression tests; native resume cụ thể của version đã pin cần kiểm chứng trong implementation, không tạo gate nghiên cứu độc lập.

## Evidence

- [OpenDesign OpenCode CLI adapter](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/defs/opencode.ts) — session capture và `-s`.
- [OpenDesign DB schema and guards](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/db.ts) — `conversations`, `agent_sessions`, resume identity guard (model/cwd/last_message_id).
- [DeckAgent POC `agent.ts`](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/agent.ts) — fresh native session per send.
- [DeckAgent POC `history.ts`](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/history.ts) — quoted transcript, context byte limit.
- [UC-003](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-003.md), [UC-006](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-006.md), [UC-012](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-012.md).
