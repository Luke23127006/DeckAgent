# Deck Artifacts & Revisions

**Architecture source:** [ADR-0005](../adr/0005-deck-artifacts-revisions.md). Đây là logical design cho Implementation Plan, chưa phải SQL/file-layout specification.

## 1. Ownership và storage

```text
DeckAgent Chat (SQLite) -- 0..1 --> Deck (SQLite)
                                      |-- Outline/confirmation + format lock
                                      |-- Template/theme snapshot
                                      |-- Slides (ordered, stable IDs)
                                      |     +-- Published revision metadata (SQLite)
                                      |             +-- Source/assets (application-managed files)
                                      +-- Provenance refs / publication receipts

OpenCode `opencode run`
  -> request-scoped MCP tool -> DeckAgent Host validation
  -> stage + validate artifact -> publish revision -> UI event/preview

User project folder: read-only source, NOT output storage.
```

SQLite là source of truth cho identity, state và current revision; filesystem giữ source/assets theo logical artifact reference. OpenCode session files không phải deck source of truth.

## 2. Domain contracts

| Contract | Trách nhiệm | Rule/Spec |
|---|---|---|
| `DeckSnapshot` | Deck ID, locked format, confirmed outline, ordered Slide IDs và current revisions | UC-001, FR-116 |
| `ArtifactManifest` | Format, source reference, assets, preview compatibility; source path không phải arbitrary OS path từ model | BR-011, FR-022 |
| `PublishedRevision` | Immutable source, timestamp, provenance, theme reference/snapshot | FR-025, FR-106, FR-138 |
| `stageArtifact` | Nhận output vào app-managed staging; kiểm tra nội dung và format | FR-092 |
| `publishSlide` | Host kiểm tra permissions, scope, phase, revision, publication ID; atomic current pointer | FR-003, FR-027, FR-025 |
| `getSlideContent` | Chỉ trả bản finished/published tương ứng revision đã lưu | FR-023, FR-025 |

API names là tên logical để lập plan; implementation có thể dùng tên khác, nhưng không được đổi guarantees.

## 3. Generation flow

1. User confirm **current Outline** và brief. Host lưu confirmation đúng outline/version (FR-003).
2. Khi slide generation bắt đầu, Host lock `generationFormat` của Deck (FR-116) và snapshot theme/template đã chọn.
3. OpenCode gọi DeckAgent tool để tạo từng slide. Tool ghi vào staging; chưa thay current revision.
4. Domain validator kiểm tra phạm vi và các known blocking faults theo FR-092. Khi đạt, Host publish một immutable revision, update DB current pointer và event.
5. UI tiếp tục hiển thị slide đang xem, bổ sung từng slide finished; pending/incomplete không được coi là finished (FR-023/025).

## 4. Editing flow

1. User request xác định slide/region scope. Nếu không rõ, hỏi clarification trước khi mutate (UC-002, FR-031).
2. Host xác định allowed Slide IDs/regions cho request và `expectedRevision` từng slide.
3. Tool tạo source mới **chỉ** cho target scope; staging/validation/publish theo cùng boundary như Generation.
4. Không thay các slides ngoài scope. Nếu Stop/Fail giữa quá trình, giữ những revisions đã commit; slide đang dở dùng last-good revision (FR-025/027).
5. Report changed/add slide IDs và provenance theo FR-029/138.

## 5. Persistence/recovery và UI

- SQLite commit chỉ định version current; staging files không xuất hiện trong preview. Publication cùng ID/payload retry trả receipt cũ; payload khác với cùng ID bị reject.
- Nếu process crash sau khi stage file nhưng trước publish: file còn ở staging, không phải current. Có thể cleanup/reconcile sau restart.
- Nếu DB đã commit nhưng event chưa gửi: UI reload đọc snapshot và persisted events (ADR-0004). Không tạo thêm revision chỉ để làm mới UI.
- Preview chỉ đọc artifact thuộc Deck/Chat đang được phép; validate paths và cách nhúng assets. Không lấy arbitrary path từ CLI output.
- Deck theme đã lưu không đổi khi Design System source bị sửa/xóa (FR-106).

## 6. Reuse và build dependencies

- **OpenDesign**: học cách tách project files khỏi SQLite metadata, manifest validation và preview boundary; không copy multi-artifact/cloud features ngoài scope.
- **DeckAgent `clean-main`**: tận dụng `DeckService` contracts, `OutlineStorage`, HTML policy, immutable revisions, optimistic concurrency và idempotent receipts sau review; **legacy có HTML blob trong SQLite**, trong khi target theo ADR-0001 lưu generated files trong app-managed filesystem, vì vậy cần migration/adaptation chứ không copy nguyên.
- **Must exist before Generation:** Storage (ADR-0001), Chat/Request IDs (ADR-0002/0004), tool authorization (ADR-0003), minimum Theme/Template contract, confirmed Outline và artifact domain.
- **Can follow later:** non-HTML adapters, advanced editing, export (đang backlog), richer preview/asset handling.

**Acceptance evidence của các builds tương ứng:** một Chat/Deck, generated slide xuất hiện sau publish; Stop giữ last-good revision; stale revision/out-of-scope rejects; không ghi user project folder; persisted reopen; provenance; theme snapshot; lock format qua follow-up.
