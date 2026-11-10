# Session & History Architecture — DeckAgent

**Decision:** [ADR-0002](../adr/0002-chat-session-history.md)  
**Storage boundary:** [ADR-0001](../adr/0001-local-storage.md)

## 1. Ownership

```text
DeckAgent UI
   | read saved Chat/Request/Activity, subscribe to active status
   v
DeckAgent Host
   |-- SQLite: Chat, Request, Message, Activity, Draft, Deck
   |-- Session mapping: Chat ID -> OpenCode native session ID + guards
   |-- Request lifecycle: one active request per Chat; Stop/recovery
   |
   +--> CLI Adapter
           |-- First turn: opencode run --format json
           |-- Next valid turn: opencode run --format json -s <sessionID>
           |-- Parse runtime events, capture sessionID, stop subprocess
           +--> OpenCode native session/context storage
```

**DeckAgent** sở hữu Chat/history và product state. **OpenCode** sở hữu native execution/session/context. Native session là implementation detail, không được dùng thay Chat ID hoặc thay persisted conversation.

## 2. Contracts tối thiểu

| Operation | Application rule | Runtime action |
|---|---|---|
| New Chat | Tạo Chat ID, empty conversation/deck/draft; không lấy data từ Chat cũ | Chưa tạo session tới khi cần chạy request |
| Send | Lưu Request và inputs; kiểm tra đúng model, không có request active | Start `opencode run`; lần đầu không `-s`, tiếp theo resume khi guards PASS |
| Event | Ghi status/activity có thứ tự để UI reconnect đọc lại | Parse CLI structured events; không lấy raw stdout làm product history |
| Complete | Commit result + status, finished artifacts; binding gắn completed turn mới nhất | Capture session ID, kết thúc process |
| Stop/Fail | Giữ finished work, ghi stopped/unfinished và không auto-retry | Abort/revoke, stop process và tool admission |
| UI reconnect | Trả lại persisted Chat, activities và current running status; không stop request | Không tạo run mới |
| Host restart | Mark abandoned active requests unfinished; giữ Chat/Deck | Không tự resume unfinished execution |
| Native session invalid | Giữ toàn bộ Chat/product history; cập nhật binding chỉ khi có valid new session | Start fresh native session, seed context an toàn khi cần |
| Context full | Full Chat vẫn readable; summary boundary thể hiện trong Chat | Compaction/summarization phải thỏa UC-003 A52 |

## 3. Resume guard

Trước mỗi request, đối chiếu session binding với: `chatId`, provider/model (và reasoning/config nếu ảnh hưởng context), cwd/execution context, last completed assistant turn, cùng tool/permission boundary. Nếu session không khớp hoặc native data mất, không dùng `-s` trên session đó. **Tool grants luôn được xác định lại theo request**, không tin quyền đã tồn tại trong native session.

Cần lưu session mapping, status, timestamps và invalidation reason. Không cần chốt column names hay SQL schema chi tiết tại bước này.

## 4. Build & Test implications

- **Foundation + Chat:** persistent Chat/Request/Activity identities, one-active-request-per-Chat, isolation giữa Chats.
- **CLI integration:** fresh turn, native `-s` resume, invalidation/reseed, structured event mapping, Stop.
- **Recovery:** browser reload ≠ Host restart; app restart không tự thực thi request unfinished.
- **Context:** giữ nguyên visible history khi runtime compact; bảo vệ outline/brief/deck/attachments.

**Expected tests:** hai turns cùng Chat; restart giữa turns; switch model; hai Chats không cross-talk; Stop giữa tool write; missing native session; full history readable sau compaction; stale authorization không thể cấp quyền ghi.

**Scope:** Tài liệu architecture contract, chưa phải SQL schema hoặc code implementation. CLI behavior được xác minh qua source OpenDesign, chưa chạy live tests trong phiên này.
