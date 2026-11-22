# ADR-0005 — Deck Artifacts & Revisions

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-05  
**Depends on:** [ADR-0001](0001-local-storage.md), [ADR-0003](0003-tools-permissions.md), [ADR-0004](0004-request-events-lifecycle.md)

## Context

DeckAgent tạo một Deck gắn với Chat, có Outline đã confirm, nhiều Slides và các lần editing sau đó. UI phải hiển thị từng Slide đã hoàn thành, giữ kết quả tốt gần nhất sau Stop/Failure, chỉ sửa slides thuộc scope và giữ được source của content. `docs/spec` cũng yêu cầu **generation format được lock khi bắt đầu build slides**, không tự convert format (FR-116).

OpenDesign sử dụng project filesystem cho artifacts, có artifact manifest/validation, versions và preview. DeckAgent legacy đã có `DeckService` lưu deck/slide metadata, immutable HTML revisions và idempotent publication bằng SQLite. Cả hai là nguồn tham khảo; không được suy ra rằng mọi DeckAgent format đều là HTML.

## Decision

1. **DeckAgent Domain là authority của Deck/Slide.** OpenCode CLI + tools tạo nội dung, nhưng không tự quyết định Slide đã được publish hay mutation được phép. DeckAgent giữ Deck ID, Slide ID, order, current revision và artifact references. Một Chat có tối đa một Deck theo UC-012.
2. **Tách metadata khỏi source artifacts.** SQLite lưu Deck, Outline link, generation format, template/theme snapshot, Slide ordering/current revision, publication receipts và source/provenance references. Application-managed filesystem lưu generated source, assets và các tệp đủ lớn; **không ghi vào project folder** (ADR-0001, FR-084). Storage APIs chỉ nhận logical IDs/paths đã validate.
3. **Format-specific source + common artifact manifest.** Mỗi Deck lock `generationFormat` khi slide generation bắt đầu (FR-116). Manifest nêu format, từng Slide/Artifact, source path, revision và dependencies cần preview; format adapter chịu trách nhiệm materialize/preview. HTML là default theo BR-011, **không phải schema nội bộ cho mọi format**. Không tự động convert khi editing/export.
4. **Immutable published revision.** Mỗi Slide có stable identity và mỗi bản được hoàn thành là revision mới. Source mới được tạo ở staging, kiểm tra xong mới commit/publish. UI chỉ xem **current published revision**. Nếu build/edit bị Stop hoặc Failed, giữ revision đã hoàn thành trước đó; không đưa bản incomplete lên preview (FR-025).
5. **Host-enforced publication.** Mọi publish phải kiểm tra Chat/Deck, confirmed Outline (với initial generation), generation format, allowed Slide scope, expected revision, request state và permissions. Dùng optimistic concurrency (`expectedRevision`) và `publicationId` để idempotent retries. Khi Stop, tool không được publish late writes (ADR-0003/0004).
6. **Snapshot giữ nguyên ý nghĩa theo thời điểm.** Deck lưu theme/design-system values đã áp dụng, không tự cập nhật khi custom Design System bị sửa/xóa (FR-106). Lưu provenance tại lúc tạo/chỉnh Slide để Q&A đọc lại được (FR-138).
7. **Đặt giới hạn format đúng chỗ.** HTML pipeline có thể đi đầu trong build đầu tiên; support những format khác là trách nhiệm các build/format adapters tương ứng. ADR này **không chốt** rằng MVP hỗ trợ toàn bộ bảy categories của BR-011 và không chốt template list còn thiếu ở BR-018.

## Rationale

- Tách SQLite metadata và filesystem artifacts theo pattern đã có ở OpenDesign, đồng thời bảo vệ project folder theo spec DeckAgent.
- Stable Slide IDs + immutable revisions + atomic publication giúp giữ finished work khi process bị Stop/Fail và tránh sửa nhầm ngoài scope.
- Common manifest/format adapter bảo vệ khả năng mở rộng generation formats mà không biến HTML thành format duy nhất.
- Có thể reuse `DeckService` validation, Outline confirmation transaction, revision checks, publication receipts sau khi tách các coupling `Session`/legacy runtime. Không copy nguyên storage schema nếu chưa khớp với ownership hiện tại.

## Consequences / Implementation contracts

- Domain APIs tối thiểu: `getDeckSnapshot(chatId)`, `getSlideRevision(deckId, slideId, revision)`, `stageArtifact(requestId, ...)`, `publishSlide(requestId, expectedRevision, publicationId, ...)`.
- Các update metadata + pointer tới published artifact phải có một **commit boundary**: stage/validate file trước; DB commit publication; reconcile orphaned staged files sau crash. Không coi file đã ghi xong là published trước DB commit.
- Event thành công của slide chỉ phát sau publication commit (ADR-0004). UI đọc current revision từ Host, không tự xem raw staging files.
- Test bắt buộc khi build liên quan: confirmation gate, one-slide-at-a-time publish, Stop giữa build, last-good revision, idempotency, stale revision conflict, out-of-scope edits, no project-folder writes, theme snapshot và provenance.
- Exact file layout, SQL migrations, preview isolation và các format adapters khác HTML là **implementation details**, quyết định trong build sở hữu chúng; không tạo ADR riêng trừ khi thay đổi architecture boundary.

## Evidence

- [OpenDesign artifact manifest](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/artifacts/manifest.ts), [project files](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/projects.ts), [architecture](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/docs/architecture.md).
- [DeckAgent legacy DeckService](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/packages/presentation/deck/src/index.ts), [contracts](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/packages/presentation/deck/src/contracts.ts), [schema](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/packages/presentation/deck/src/schema.ts).
- DeckAgent spec: [FR-022](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-022.md), [FR-023](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-023.md), [FR-025](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-025.md), [FR-027](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-027.md), [FR-106](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-106.md), [FR-116](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-116.md), [FR-138](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-138.md), [BR-011](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-011.md).
