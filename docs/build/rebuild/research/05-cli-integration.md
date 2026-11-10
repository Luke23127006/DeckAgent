# CLI Integration Validation — DeckAgent

**Status:** Source review complete; chưa thực thi runtime tests trong bước này.  
**Ngày:** 2026-11-10  
**Reference:** `Luke23127006/DeckAgent` branch `feat/v2-opencode` , commit `5bd9c17e0054ded8bdb92e6c0e5193d09e75ca37` .  
**Baseline sản phẩm:** `clean-main` , commit `a0d204a613d0decab2d627a9d5868d9c9e162b9e` .

## 1. Kết quả cần dùng

Đã chọn `opencode run` làm Runtime integration cho DeckAgent local-first. Source `feat/v2-opencode` chứng minh đã có một CLI Adapter, MCP Bridge, phần mapping events và test fixtures. **Không copy nguyên implementation**: adapter cũ còn bám vào `@deckagent/agent-runtime` , một số test chỉ dùng fixtures, và khả năng chạy trên OS khác Windows chưa được xác nhận.

Tài liệu phân biệt:
* **Observed in source**: hành vi được xác nhận khi đọc code.
* **Recorded evidence**: test results do repository ghi lại, không phải test được chạy trong bước này.
* **Not verified**: cần chứng minh trước khi dùng cho build mới.

## 2. Luồng execution hiện có

 `Local Web → Host/openWebRequest → OpenCodeAgentHandle → spawn(opencode run --format json) → OpenCode Agent Loop → MCP Bridge → DeckAgent ToolRegistry → Deck/Files → Host/UI`

| Khả năng | Observed in source | Giới hạn / cần kiểm chứng |
|---|---|---|
| CLI execution | `process.ts` spawn binary, truyền prompt qua stdin, parse JSON lines từ stdout, bỏ raw stderr. `agent.ts` kiểm tra binary/version/config trước khi chạy. | Có pin Windows x64 OpenCode `1.19.5` và SHA256; chưa có OS matrix. Spawn và các preflight per-request có overhead. |
| Session & History | Mỗi `send()` tạo một native session mới; DeckAgent SessionStore là durable history, `history.ts` đưa conversation thành quoted JSON trong prompt. Native ID chỉ dùng để ghi execution mapping. | **Không native resume**. Context guard là 4 MB transport, không phải token budget. Chi phí prompt dài và continuity qua nhiều turn cần đo lại. |
| MCP tools | `mcp-bridge.ts` mở HTTP MCP trên `127.0.0.1` , cấp bearer token riêng cho request, list tools theo allowlist, gọi ToolRegistry để thực thi. | MCP server cục bộ không phải OS sandbox. Cần đánh giá auth/permission và lifecycle độc lập với legacy ToolRegistry. |
| Permissions & Stop | `config.ts` default deny và allow `deckagent_*` , tắt project config/default plugins, audit resolved config. `process.ts` dùng `taskkill /T /F` khi Abort trên Windows; bridge revoke tools. | Cần thử Stop lúc tool đang chạy, late mutation, lỗi kill và restart. Không áp dụng nguyên `taskkill` cho Linux/macOS. |
| Events | `agent.ts` map `step_start` , `step_finish` , `text` , `error` sang model activities, text và error code. MCP Bridge tạo tool activities. | **Chưa có token streaming UI**; test event fidelity với partial/malformed output, stop, retries và activity ordering. |

Nguồn chính: [agent.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/agent.ts), [process.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/process.ts), [config.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/config.ts), [history.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/history.ts), [mcp-bridge.ts](https://github.com/Luke23127006/DeckAgent/blob/5bd9c17/apps/local-web/src/opencode/mcp-bridge.ts).

## 3. Điểm học được từ OpenDesign

OpenDesign dùng CLI runtime definitions. OpenCode definition chạy `opencode run --format json` , truyền prompt qua stdin, parse JSON event stream và lấy `sessionID` để tiếp tục qua `-s <id>` ở turn sau. Đây là **một cơ chế khác** với `feat/v2-opencode` (fresh native session mỗi send). Source tham khảo: [OpenDesign opencode definition](https://github.com/nexu-io/open-design/blob/main/apps/daemon/src/runtimes/defs/opencode.ts).

**Kết luận kiểm chứng:** Native resume là capability có source reference; chưa xác nhận behavior với DeckAgent-specific permissions, Stop, Chat isolation hoặc model switch. Không tự coi đây là quyết định đổi session architecture.

## 4. Reuse boundary cho build mới

| Nguồn | Xử lý | Lý do |
|---|---|---|
| `opencode/process.ts` | **Adapt** | Process execution, stdin/stdout parsing, cancellation có giá trị; cần tách Windows-specific handling. |
| `opencode/config.ts` | **Adapt** | Config isolation và permission preflight có giá trị; cần kiểm chứng với binary/version được chọn. |
| `opencode/mcp-bridge.ts` | **Adapt** | Giữ pattern MCP per-request + allowlist; chuyển dependencies sang tool contracts mới. |
| `opencode/agent.ts` | **Reference / Rebuild** | Luồng orchestration hữu ích nhưng gắn `AgentHandle` , `SessionStore` , `ToolRegistry` cũ. |
| `opencode/history.ts` | **Reference** | Chỉ phục vụ chiến lược fresh-session; không mặc định tái sử dụng nếu chọn native resume. |
| `opencode/provider.ts` | **Reference / Adapt** | Có mapping provider protocols và options, nhưng phụ thuộc catalog/legacy contracts. |
| `apps/local-web/src/web-request.ts` | **Do not port wholesale** | Chứa Cordis runtime path và product orchestration cũ; UI/product behavior phải theo `clean-main/docs/spec` . |
| `tests/opencode-*` | **Reuse as test ideas** | Fixture/CLI/live tests có value; cần viết lại theo architecture và spec mới. |

## . Handoff → Implementation Plan

* **Đã chốt:** CLI `opencode run`; local clone/install/run; giữ UI của `clean-main`; không giữ Cordis/custom Agent Loop trong target architecture;  `clean-main/docs/spec` là product goal.
* **Chưa được phép giả định:** Native resume đã đáp ứng DeckAgent; multi-OS hoạt động; event streaming đầy đủ; legacy MCP/Host implementation có thể copy nguyên.
* **Đầu vào Build Plan:** Luồng execution ở mục 2, reuse boundary mục 4 và CLI-01–06. Implementation và Testing có thể song song theo contracts; mỗi build chỉ merge khi behavior theo spec và các runtime checks liên quan đạt.

**Scope của bước này:** Chỉ đọc source GitHub và evidence đã commit. Không sửa repo, không chạy binary/live tests, không commit/push.
