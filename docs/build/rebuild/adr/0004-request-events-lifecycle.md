# ADR-0004 — Request Lifecycle & Events

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-04  
**Depends on:** [ADR-0001](0001-local-storage.md), [ADR-0002](0002-chat-session-history.md), [ADR-0003](0003-tools-permissions.md)

## Context

DeckAgent chạy `opencode run --format json` như một local subprocess. UI phải hiển thị trạng thái request và activities theo thứ tự; đóng/reload UI không dừng request, nhưng Host restart không được tự chạy lại request chưa hoàn thành. Activity đã lưu phải đọc lại được khi mở Chat. OpenCode CLI event và CLI exit code không trực tiếp đại diện cho trạng thái sản phẩm.

`feat/v2-opencode` đã parse CLI JSON lines và map một phần `step_start`, `step_finish`, `text`, `error`; OpenDesign có event parser, SQLite event batches và restart reconciliation. Chỉ reuse các ranh giới này, không mang cả streaming/analytics framework của OpenDesign sang DeckAgent.

## Decision

1. **DeckAgent Host là authority cho Request lifecycle.** Request được tạo và lưu trước khi bắt đầu subprocess. Mỗi Chat có tối đa một Request active (FR-014). User request/attachments và activity records thuộc product storage; OpenCode runtime events chỉ là input.
2. **Dùng một Event Adapter** chuyển OpenCode JSON stream + MCP tool callbacks thành product events có `requestId`, `sequence`, `kind`, `status`, `timestamp` và sanitized `payload`. Không đưa raw provider stderr, API keys, MCP bearer tokens hoặc event blobs không kiểm soát vào SQLite/UI.
3. **Persist trước, publish sau.** Host lưu activities và request state trong SQLite; sau đó gửi update tới Local Web UI qua existing local API/stream boundary. UI có thể đọc snapshot + ordered events theo cursor khi reconnect, không cần dựa vào memory của browser hay CLI process.
4. **Phân biệt Request status với Activity status.** Request: `active`, `waiting_approval`, `completed`, `failed`, `stopped`, `interrupted`. Activity: `running`, `completed`, `failed`, `stopped`. Một activity fail **không tự động** làm Request fail (FR-070). `waiting_approval` vẫn chiếm active slot; câu hỏi làm rõ kết thúc request và câu trả lời là request mới.
5. **Terminal state do Host quyết định từ nhiều bằng chứng.** CLI exit 0 một mình không chứng minh deck/slide hoàn thành; phải kiểm tra execution outcome và product writes. `completed` chỉ khi request thực sự đáp ứng completion contract. `failed`/`interrupted` giữ finished work nhưng không publish incomplete result thành stable state. `stopped` là user Stop, khác failure.
6. **Stop có hiệu lực ở Host.** User Stop → Host hủy execution, revoke request-scoped MCP grants và chặn thêm writes; các activity còn running được kết thúc với trạng thái stopped. Không tự resume Request đã stop; native OpenCode session resume trong ADR-0002 chỉ dành cho **turn mới**, không phải tiếp tục request đã bị Stop.
7. **UI disconnect không chấm dứt work.** Khi Host còn chạy, Chat switch, UI reload hoặc mất kết nối không abort CLI process. Reconnect lấy persisted snapshot và events; stream live tiếp tục từ cursor, tránh duplicate records.
8. **Host restart recovery:** mọi Request chưa terminal ở lần chạy trước được đánh dấu `interrupted`/`not finished` khi khởi động, không tự chạy lại. Giữ user message, event log và finished artifacts. Không hiển thị lại như request đang chạy nếu không có active process.
9. **Không tự thêm retry/queue nền.** Retry chỉ là request mới theo product behavior. Cơ chế event ordering, durable status và reconnect đủ cho MVP; không cần event bus/analytics pipeline độc lập.

## Rationale

- Persisted product event stream cho phép UI hiển thị activities sau reload/restart và test event fidelity theo FR-068/070.
- Host state machine ngăn việc xem CLI event/exit là product success, nhất là generation/editing bị dừng giữa chừng.
- Reuse parser/lifecycle pattern từ OpenDesign, nhưng giữ implementation phù hợp local-first MVP.

## Consequences

- Cần `requestId` bền vững, sequence tăng theo request và cách lưu terminal state/activities dưới transaction. Đây là **logical contract**, chưa chốt schema SQL hay transport path.
- Event Adapter cần xử lý incomplete JSON lines, invalid event, duplicate/late messages, stream kết thúc bất ngờ và các tool events đến từ MCP Bridge. Raw CLI payload không được xem là UI API.
- Request/Activity state transitions và domain tool mutations cần dùng một source of truth. Event callbacks không được bypass permission checks của ADR-0003.
- Tests cần chứng minh: ordered replay; một active Request per Chat; UI disconnect không stop; Stop chặn late writes; provider error; partial result persistence; interrupted Request khi Host restart; no automatic retry.

## Evidence

- [DeckAgent spec FR-012](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-012.md), [FR-014](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-014.md), [FR-018](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-018.md), [FR-019](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-019.md), [FR-068](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-068.md), [FR-070](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-070.md).
- [DeckAgent POC agent.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/agent.ts), [process.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/process.ts) — JSON stream, tool events, Stop and completion handling.
- [OpenDesign JSON event adapter](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/json-event-stream.ts), [SQLite event persistence](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/db.ts), [restart recovery](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/run-restart-recovery.ts).
