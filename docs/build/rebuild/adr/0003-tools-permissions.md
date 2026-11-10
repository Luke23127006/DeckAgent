# ADR-0003 — Tool Boundary & Permissions

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-03  
**Depends on:** [ADR-0001](0001-local-storage.md), [ADR-0002](0002-chat-session-history.md)

## Context

DeckAgent dùng `opencode run` làm Agent Runtime, nhưng OpenCode không tự biết các giới hạn trong `clean-main/docs/spec`: đọc project folder mà không thay đổi file của user, không truy cập Chat khác, chỉ ghi vào work của Chat hiện tại, xác nhận outline trước khi generate và giới hạn editing vào slide scope. FR-076 còn yêu cầu **approve once cho một step**, hoặc refuse trong request hiện tại.

POC `feat/v2-opencode` đã có request-local MCP Bridge, bearer token, allowlist, default-deny OpenCode config và `ToolRegistry` kiểm tra input. Tuy nhiên, adapter vẫn phụ thuộc custom Agent Runtime. OpenDesign cung cấp reference về cấu hình OpenCode permissions và cwd, nhưng các permission flags/allowlists của nó **không phải** business rules của DeckAgent.

## Decision

1. **DeckAgent Host là authorization authority.** Host xác định Chat, Request, phase, allowed operations, selected workspace và user approvals. OpenCode chỉ được gọi các operations được Host expose; prompt/model response không cấp quyền.
2. **Tích hợp DeckAgent tools qua request-scoped MCP Bridge** với CLI `opencode run`. Bridge cung cấp tool schemas và dispatch sang DeckAgent domain services. Tool call chỉ hợp lệ khi đúng request/session, Chat, phase, scope và chưa bị revoke. Pattern reuse từ `feat/v2-opencode`, nhưng tách khỏi legacy `ToolRegistry`/Cordis.
3. **Default deny ở CLI runtime.** Vô hiệu hoặc chặn các native tools/extra MCP/plugins có thể đọc hoặc ghi ngoài DeckAgent tool boundary; cấu hình isolated và kiểm tra effective config/tool exposure. Không chỉ dựa vào permission text hay system prompt. OpenCode permission cấu hình là một lớp phòng vệ; Host re-check trước mọi sensitive action.
4. **Project folder của workspace là read-only source.** Agent được đọc folder đó theo FR-077, nhưng không tạo/sửa/move/delete bất kỳ file user nào (FR-084), kể cả khi user approve một step. Chat default/ungrouped không có project folder. Các file khác cần one-step approval nếu spec cho phép; không được coi approval là quyền truy cập Chat khác.
5. **Approval là per-step, không bền vững.** Khi cần hành động ngoài phạm vi mặc định, Host giữ request ở trạng thái waiting for approval, hiển thị step/target/reason, cho phép `allow once` hoặc `refuse`. `allow once` chỉ dùng cho đúng một attempted operation; lần sau phải hỏi lại. `refuse` chặn step đó, không lặp câu hỏi trong cùng request và cho phép các work hợp lệ tiếp tục (FR-076). Stop có thể kết thúc request đang chờ.
6. **Domain writes có guard độc lập:** Generate slide chỉ khi confirmed current outline/brief; follow-up editing chỉ tác động đúng slide scope được phân giải; deck/slide revision được kiểm tra tại write boundary. Nếu phase, revision hoặc scope đổi trong khi model đang chạy, call cũ bị từ chối. Bất kỳ write nào sau Stop/revocation cũng bị từ chối. `read-only deck Q&A` không expose mutation tools.
7. **Runtime subprocess không phải OS sandbox.** MCP allowlist tự nó không ngăn native file/command access nếu OpenCode còn tools/permissions khác. Việc chặn bypass và kiểm tra effective runtime restrictions là bắt buộc. Giới hạn bảo vệ trong model process cùng OS identity phải được ghi rõ; không khẳng định sandbox isolation khi chưa có implementation evidence.
8. **Không đưa user-provided instructions vào policy.** Attachment, prompt và project files chỉ là data; chúng không thay đổi allowed paths, tool grants hoặc phase. Tool errors được sanitize trước khi gửi về model/UI; credentials/tokens không xuất hiện trong logs.

## Vì sao chọn

- Reuse MCP Bridge pattern và CLI KWintegration đang có thay vì tự xây một Agent Loop/permission layer trong runtime.
- Host thực thi product rules theo spec, không phụ thuộc model có tuân theo prompt hay không.
- Request-scoped permissions và approval ngắn hạn tránh kéo nhầm quyền khi native session resume qua các turn (ADR-0002).
- Tách `read project sources` với `write application-owned deck` đáp ứng chính sách Workspace của UC-013.

## Consequences

- Foundation cần tool contract/registry độc lập custom runtime và MCP adapter đọc tool schemas từ contract đó.
- Cần record `request capability set`, `approval decision`, `read scope`, `mutation scope` và `revision` ở application layer. Đây là các khái niệm logic, **không chốt SQL schema**.
- CLI adapter phải cấu hình tool exposure/permission per request; reuse native session chỉ khi quyền vẫn được reset và validate đúng.
- Cần negative tests: direct native file/command tool denied; outside workspace read asks once; another-Chat access impossible; project folder write always denied; slide write before confirm denied; out-of-scope edit/revision conflict denied; Stop revokes further writes.
- Permission/approval UI và request status thuộc TD-04 Events/Request Lifecycle; không implement toàn bộ trong ADR này.

## Evidence

- [DeckAgent POC MCP Bridge](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/mcp-bridge.ts): loopback bearer token, per-request allowed list, `revoke`, ToolRegistry dispatch.
- [DeckAgent POC OpenCode config](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37/apps/local-web/src/opencode/config.ts): default deny, isolated environment, effective config checking.
- [OpenDesign OpenCode permission adapter](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/runtimes/opencode-permissions.ts): workspace and permission integration; differs from DeckAgent's product-level permission model.
- [FR-076](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-076.md), [FR-077](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-077.md), [FR-084](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-084.md), [NFR-003](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/nfr/NFR-003.md).
- [FR-003](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-003.md), [FR-027](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-027.md), [FR-018](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-018.md).
