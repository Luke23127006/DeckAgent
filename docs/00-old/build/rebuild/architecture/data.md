# Data Architecture — DeckAgent

**Decision source:** [ADR-0001 — Local Storage & Data Ownership](../adr/0001-local-storage.md)  
**Status:** Storage boundaries đã chốt; schema/API chi tiết sẽ xác định trong Foundation.

## 1. Data ownership

```text
DeckAgent Local Host
  |
  +-- Application Storage (managed by DeckAgent)
  |     +-- SQLite
  |     |     Workspace / Chat / Request / Message / Activity
  |     |     Outline / Deck / Slide / Revision metadata
  |     |     Provider settings metadata / OpenCode execution mapping
  |     +-- Managed files
  |           Attachments / Generated artifacts / Assets / intermediates
  |
  +-- OpenCode CLI (`opencode run`)
  |     +-- Runtime-native session/execution state (its own lifecycle)
  |
  +-- Workspace folder reference ---> User project folder
                                READ ONLY for DeckAgent operations
                                No app DB, chats, decks or generated files
```

**Workspace** là logical grouping + folder reference. **Chat** là một conversation độc lập, với tối đa một Deck. Một Workspace có nhiều Chat; Chat có thể trở thành ungrouped mà không mất data. OpenCode native session là runtime execution detail, không thay thế Chat ID.

## 2. Data boundaries

| Dữ liệu | Owner / location | Persistence rule |
|---|---|---|
| Workspace registry / folder refs | Application SQLite | Remove Workspace không xóa Chat/Deck; normalize và validate folder path. |
| Chat, messages, drafts, request/activity history | Application SQLite | Persist qua restart; unfinished request không auto-resume. |
| Outline, brief, confirmation và deck revisions | SQLite metadata + managed files nếu cần | Confirmed outline/finished slides giữ lại sau Stop/Fail. |
| Slide source, images, attachments, assets | Application-managed files | SQLite lưu stable IDs, paths/refs, version và status; tránh dangling references. |
| Provider/model metadata | Application SQLite | Không đưa credentials vào logs hoặc plain UI output. Secret storage implementation là decision riêng. |
| OpenCode runtime sessions/executions | OpenCode-managed state + mapping trong SQLite | Native ID phải map về Chat/Request; không coi native files là source of truth của DeckAgent. |
| Project folder | Outside application storage | Chỉ đọc khi được quyền; không ghi generated output hoặc state vào đây. |

## 3. Integration contracts tối thiểu

- **Storage initialization:** App tạo/open managed root, SQLite và schema version; DB errors được phản hồi rõ, không silently reset dữ liệu.
- **Atomic domain update:** Multi-record changes trong DB transaction. Với file+DB, ghi file an toàn rồi commit metadata; có cleanup/recovery cho interrupted operations.
- **Identity:** Stable Workspace ID / Chat ID / Request ID / Deck ID. Folder path không phải Workspace ID. DeckAgent request ID khác OpenCode execution/session ID.
- **Lifecycle:** UI reconnect đọc saved state từ Host; Stop/Fail không xóa completed slides; unfinished work được hiển thị rõ.
- **Protection:** File paths phải nằm trong managed root; kiểm tra symlinks/path traversal và read-only rule cho source folder; không sao chép key vào artifacts/logs.
- **Migration:** Mỗi schema change có migration và test từ database version trước đó.

## 4. Build consequences

**Foundation:** tạo storage boundary và schema migration, entity IDs, Workspace/Chat persistence smoke test.  
**Chat + Runtime:** request/activity persistence, Chat ↔ OpenCode mapping, restart handling.  
**Outline/Generation:** outline/deck revisions và managed artifact writes.  
**Workspace:** relink/remove, ungrouped chats, source folder access enforcement.  
**Editing:** scoped revisions, crash/partial update handling.

Không copy schema OpenDesign; schema chỉ gồm entities DeckAgent thực sự cần theo `docs/spec`.
