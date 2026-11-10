# ADR-0001 — Local Storage & Data Ownership

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-01  
**Scope:** DeckAgent local-first rebuild

## Context

DeckAgent chạy trên máy người dùng. Workspace tham chiếu một project folder, nhưng DeckAgent **không được ghi** Chat, Deck hoặc file trung gian vào project folder đó. Chat phải còn sau restart; remove Workspace không xóa Chat/Deck mà chuyển thành ungrouped (UC-013, UC-006, BR-004). Outline, slide đã hoàn thành và request history phải có persisted state (UC-001, UC-003).

OpenDesign hiện sử dụng `better-sqlite3` làm local database cho projects/conversations/messages/runtime metadata và filesystem riêng cho project files/artifacts. Database có WAL, foreign keys, migrations. Đây là mô hình tham khảo, **không copy schema hoặc project-folder behaviors** vì OpenDesign cho phép sửa file của imported projects, còn DeckAgent không được ghi vào source folder.

Legacy DeckAgent đã có `packages/session/persistence/src/index.ts` dùng `node:sqlite` cho SessionStore. Có thể reuse kiến thức/schema migration, nhưng không giữ `@deckagent/agent-runtime` dependency.

## Decision

1. **SQLite** là database cho DeckAgent application data có cấu trúc: Workspace registry, Chat, Request, Messages/Activities, Outline/Brief metadata, Deck/Slide metadata, revision records, settings không nhạy cảm và mappings đến OpenCode executions.
2. **Application-managed filesystem** giữ file lớn hoặc file dạng artifact: slide sources, generated assets, attachments được quản lý, preview/export intermediates khi cần. SQLite giữ ID, metadata và file references; không đặt toàn bộ binary artifacts trong database theo mặc định.
3. Cả database và managed files nằm trong **DeckAgent Application Storage** trên máy người dùng; tách biệt hoàn toàn với folder mà Workspace trỏ đến. Project folder chỉ là source để đọc trong phạm vi quyền được cấp. Đăng ký workspace không tự đọc hoặc sửa nội dung folder.
4. **DeckAgent là source of truth cho product state** (Workspace, Chat, Deck, request status). OpenCode giữ runtime-native state của riêng nó. Không coi OpenCode session files là database thay thế Chat/Deck.
5. Database phải có **schema version + migrations**, foreign-key enforcement và transaction cho các thay đổi liên quan nhiều records. Các lần ghi artifacts cần có cơ chế tránh metadata trỏ tới file chưa ghi xong; quy trình recovery phân biệt unfinished request với finished work.
6. **Không tự xóa Chat/Deck theo thời gian**. Remove Workspace giữ Chat/Deck dưới dạng ungrouped. Một Chat gắn tối đa một Deck theo spec hiện tại.

**Chưa chốt ở ADR này:** thư viện SQLite (`node:sqlite` vs `better-sqlite3`), absolute data directory per OS, full SQL schema, backup UX, artifact serialization và encryption implementation. Các chi tiết đó thuộc Foundation/related builds và phải tuân theo ownership đã chốt; chỉ cần ADR mới nếu thay đổi ranh giới kiến trúc này.

## Rationale

- SQLite phù hợp ứng dụng local single-user; không cần vận hành database server.
- Structured records có transaction và query rõ ràng; artifacts lớn/đa định dạng phù hợp filesystem.
- App storage độc lập source folder đáp ứng Workspace behavior và tránh Agent ghi đè tài liệu người dùng.
- Reuse pattern đã được OpenDesign triển khai, đồng thời có điểm reuse từ legacy DeckAgent.

## Consequences

- Foundation cần khởi tạo Application Storage, SQLite schema/migration và managed-file root.
- Workspace folder reference phải được validate/canonicalize; tuyệt đối không dùng project folder làm application data root.
- Các build Chat, Request, Outline, Deck và Design System cùng dùng storage contracts; UI chỉ gọi Host, không trực tiếp chạm SQLite.
- CLI integration lưu execution/session mapping trong application database nhưng không sao chép toàn bộ runtime internals.
- Cần test restart persistence, orphaned/ungrouped chats, DB migration, partial writes, path traversal và không mutate project folder.

## Evidence

- [OpenDesign `apps/daemon/src/db.ts` @ aae63c8](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/db.ts) — SQLite (`better-sqlite3`), WAL, foreign keys, migrations, projects/conversations/messages/session records.
- [OpenDesign `apps/daemon/src/projects.ts` @ aae63c8](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/projects.ts) — filesystem project content; khác biệt với DeckAgent source folder read-only.
- [OpenDesign architecture](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/docs/architecture.md) — daemon-owned storage root; SQLite + project files.
- [Legacy DeckAgent SessionStore](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/packages/session/persistence/src/index.ts) — `node:sqlite` and persistent messages.
- [DeckAgent UC-013](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-013.md), [UC-006](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases/UC-006.md), [BR-004](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-004.md).
