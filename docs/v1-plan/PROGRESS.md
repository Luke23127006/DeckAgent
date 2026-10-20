# DeckAgent V1 — Progress

Dashboard giữ current state và handoff cần thiết; scope/acceptance criteria ở [parallel team plan](deckagent-parallel-team-implementation-plan.md), lý do và chuỗi giá trị ở [value-chain plan](deckagent-value-chain-implementation-plan.md). Gate 001–007 dưới đây thuộc parallel plan, không phải G1–G8 của value-chain plan. Không sao chép Jira hoặc lịch sử implementation vào đây.

## Current milestone và baseline — A cập nhật

| Mục | Hiện trạng |
| --- | --- |
| Mốc cần xác minh đầu tiên | M1 — Foundation / TASK-001; milestone nhóm đang thực sự triển khai: `UNKNOWN` |
| Stable integration baseline | `NOT_VERIFIED` — chưa có Gate PASS kèm evidence; dev SHA: `UNKNOWN` |
| Snapshot đã kiểm tra | 20-10-2026, local `main` tại `bfa50fb7225138d95afabdfbab3c39ed44477569`; working tree sạch trước khi tạo dashboard |
| Phạm vi xác minh | Source tracked trong checkout này và test UX-02; chưa xác minh remote `dev`, PR hoặc branch của các thành viên |
| Đích ưu tiên theo plan | M6 — demo UC-001. Gate 007 cũng chưa đủ để kết luận toàn bộ V1 hoàn thành |

`UNKNOWN` = chưa biết thông tin; `NOT_VERIFIED` = chưa có evidence đủ để kết luận. Không suy ra “chưa bắt đầu” hay “đã xong” từ việc thiếu code trên một branch.

## Task Groups — A tổng hợp từ handoff và evidence

Trạng thái dùng: `NOT_VERIFIED`, `TODO` (owner xác nhận chưa bắt đầu), `IN_PROGRESS`, `BLOCKED`, `PR_OPEN`, `DONE`. Gate dùng `NOT_VERIFIED`, `FAIL`, `PASS`. **Subtask DONE** cần đầu ra đạt acceptance, PR đã merge vào `dev`, SHA và verification evidence. **Group DONE** cần cả ba subtasks DONE và Integration Gate PASS trên cùng baseline tích hợp. Merge PR không tự chứng minh Gate PASS.

| Group / milestone | Dependency | Status | Gate result / dev SHA / evidence |
| --- | --- | --- | --- |
| TASK-001 — Foundation (M1) | Không; cần kickoff upstream/toolchain/ownership | NOT_VERIFIED | Gate 001: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-002 — Agent + Session (M2) | Gate 001 PASS | NOT_VERIFIED | Gate 002: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-003 — Tools + Browser (M3) | Gate 002 PASS | NOT_VERIFIED | Gate 003: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-004 — Local Web (M4) | Gate 003 PASS | NOT_VERIFIED | Gate 004: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-005 — Slide Pipeline (M5) | Gate 004 PASS | NOT_VERIFIED | Gate 005: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-006 — UC-001 Demo (M6) | Gate 005 PASS | NOT_VERIFIED | Gate 006: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-007 — Recovery / History / Editing (M7) | Gate 006 PASS | NOT_VERIFIED | Gate 007: NOT_VERIFIED / UNKNOWN / chưa có |

## Parallel work và technical handoff — mỗi người sửa phần của mình

A/B/C là vai trò trong plan; danh tính và việc đang làm phải do thành viên xác nhận. Cột PR ghi link + open/merged/closed + merge SHA khi có; không điền branch dự kiến như branch đã tồn tại. Giữ evidence của subtask đã đóng bằng link PR, chỉ giữ handoff chi tiết cho việc đang làm hoặc vừa bàn giao.

### A — Platform / Host

- Thành viên / cập nhật: `UNKNOWN` / chưa xác nhận.
- Đang làm / branch / PR: `UNKNOWN` / `UNKNOWN` / `UNKNOWN`.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-A | Workspace | NOT_VERIFIED | UNKNOWN |
| TASK-002-A | Agent Runtime | NOT_VERIFIED | UNKNOWN |
| TASK-003-A | File Tools + Safety | NOT_VERIFIED | UNKNOWN |
| TASK-004-A | Web Host | NOT_VERIFIED | UNKNOWN |
| TASK-005-A | Deck Service | NOT_VERIFIED | UNKNOWN |
| TASK-006-A | Outline State + Confirmation Guard | NOT_VERIFIED | UNKNOWN |
| TASK-007-A | Failure + Recovery | NOT_VERIFIED | UNKNOWN |

- Đã hoàn thành: `NOT_VERIFIED`; files/modules cần tiếp tục: `UNKNOWN`.
- Contracts / quyết định đã chốt (link + revision): `UNKNOWN`; assumptions cần kiểm chứng: `UNKNOWN`.
- Verification (ngày, SHA, môi trường, lệnh/scenario → kết quả, log): `NOT_VERIFIED`.
- Blocker / lỗi còn lại / người cần hỗ trợ: `UNKNOWN`.
- Next action: xác nhận trạng thái trên `dev` và PR thực tế; nếu chưa có foundation, kickoff TASK-001 với upstream SHA, Node/pnpm, thư mục sở hữu và fixture contract trước khi thiết lập workspace.

### B — Web / UX

- Thành viên / cập nhật: `UNKNOWN` / chưa xác nhận.
- Đang làm / branch / PR: `UNKNOWN` / `UNKNOWN` / `UNKNOWN`.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-B | Cordis Boot Dependencies | NOT_VERIFIED | UNKNOWN |
| TASK-002-B | Model Providers + Credentials | NOT_VERIFIED | UNKNOWN |
| TASK-003-B | Host API | NOT_VERIFIED | UNKNOWN |
| TASK-004-B | Conversation + Settings UI | NOT_VERIFIED | UNKNOWN |
| TASK-005-B | Deck Client Model + Canvas | NOT_VERIFIED | UNKNOWN |
| TASK-006-B | Outline Conversation UI | NOT_VERIFIED | UNKNOWN |
| TASK-007-B | Chat + Deck History (UC-006) | NOT_VERIFIED | UNKNOWN |

- Đã hoàn thành: `NOT_VERIFIED`; files/modules cần tiếp tục: `UNKNOWN`.
- Contracts / quyết định đã chốt (link + revision): `UNKNOWN`; assumptions cần kiểm chứng: `UNKNOWN`.
- Verification (ngày, SHA, môi trường, lệnh/scenario → kết quả, log): `NOT_VERIFIED`.
- Blocker / lỗi còn lại / người cần hỗ trợ: `UNKNOWN`.
- Next action: xác nhận subtask/branch/PR thực tế; nếu TASK-001 chưa triển khai, cùng A chốt upstream rồi trace Cordis/Loader/Include/Group/app-boot dependency closure, ghi provenance và yêu cầu root config để A tích hợp.

### C — Agent / Tools / Integration

- Thành viên / cập nhật: `UNKNOWN` / chưa xác nhận.
- Đang làm / branch / PR: `UNKNOWN` / `UNKNOWN` / `UNKNOWN`.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-C | Foundation Smoke Tests | NOT_VERIFIED | UNKNOWN |
| TASK-002-C | Session Persistence | NOT_VERIFIED | UNKNOWN |
| TASK-003-C | Browser Runtime | NOT_VERIFIED | UNKNOWN |
| TASK-004-C | Right Sidebar + Sample Deck Tab | NOT_VERIFIED | UNKNOWN |
| TASK-005-C | publish_slide Tool | NOT_VERIFIED | UNKNOWN |
| TASK-006-C | Agent Presentation Workflow | NOT_VERIFIED | UNKNOWN |
| TASK-007-C | Scoped Slide Editing (UC-002) | NOT_VERIFIED | UNKNOWN |

- Đã hoàn thành: `NOT_VERIFIED`; files/modules cần tiếp tục: `UNKNOWN`.
- Contracts / quyết định đã chốt (link + revision): `UNKNOWN`; assumptions cần kiểm chứng: `UNKNOWN`.
- Verification (ngày, SHA, môi trường, lệnh/scenario → kết quả, log): `NOT_VERIFIED`.
- Blocker / lỗi còn lại / người cần hỗ trợ: `UNKNOWN`.
- Next action: xác nhận subtask/branch/PR thực tế; nếu TASK-001 chưa triển khai, thống nhất fixture contract với A/B rồi chuẩn bị plugin smoke cho registration, injection, lifecycle/cleanup và checklist Windows theo Gate 001.

## Shared handoff và verification — A duy trì, B/C gửi thay đổi qua handoff

**Đã xác minh trong snapshot trên:** [package.json](../../package.json) và lockfile chỉ phục vụ tooling review; chưa có application build/test scripts hoặc monorepo runtime trong source tracked. [UX prototype và tài liệu](../design/UX-design/README.md) là mô phỏng UI, không chạy Agent Runtime. [Regression test](../../tests/ux-02-prototype.test.cjs) kiểm tra prototype bằng Node VM. Đây là tài nguyên tham khảo, chưa chứng minh TASK-001 hoặc TASK-004 hoàn tất.

**Contracts và quyết định:** workflow Git bên dưới đã được task owner cung cấp. Upstream SHA, application toolchain, fixture/service contracts và quyết định kỹ thuật implementation đã chốt: `UNKNOWN`. Các boundary/mock strategy trong plan vẫn cần kiểm chứng/chốt tại kickoff; không coi dashboard là phê duyệt kiến trúc. Khi chốt, ghi link tài liệu/PR + revision + tác động tới A/B/C ở đây, không chép lại contract. Cơ chế tạo ảnh mới vẫn chưa chốt theo plan; không tự thu hẹp scope V1.

| Evidence | Ngày / revision / môi trường | Check và kết quả | Giới hạn / lỗi còn lại |
| --- | --- | --- | --- |
| Snapshot repository | 20-10-2026 / `bfa50fb7225138d95afabdfbab3c39ed44477569` / Windows PowerShell | `git status --short --branch`, `git rev-parse HEAD`, `git ls-tree --name-only HEAD`, `git ls-files`; đọc manifest, prototype và test: checkout sạch, có docs/tooling/prototype | Chỉ local main; remote dev/PR và tiến độ cá nhân UNKNOWN |
| UX-02 regression | Cùng ngày/SHA / Windows, Node v22.17.1 | `node tests/ux-02-prototype.test.cjs` → exit 0, `Rendered presets: 64`, `UX-02 regression checks passed` | Chưa kiểm tra browser thủ công hoặc application integration; không có lỗi trong lần chạy test này |
| Application / Integration Gates | NOT_VERIFIED | Build, Cordis boot, model thật, persistence và end-to-end: chưa chạy; chưa có runner application trong checkout | Không đủ điều kiện kết luận PASS/FAIL; lỗi runtime UNKNOWN |

Khi đóng Gate, thay nội dung evidence của Gate tương ứng bằng: **ngày + người chạy + dev SHA + môi trường/toolchain + lệnh hoặc bước manual + expected/actual + PASS/FAIL + link log/artifact + lỗi/giới hạn còn lại**. Đối chiếu toàn bộ tiêu chí Gate trong parallel plan; thiếu check thì giữ `NOT_VERIFIED`. Chỉ nâng stable baseline tới SHA đã PASS; giữ baseline PASS trước đó nếu tích hợp mới FAIL. Dùng check thực sự tồn tại ở thời điểm đó, không bịa lệnh CI/build hoặc ghi secrets vào evidence.

## Cập nhật và tiếp tục session

1. **Bắt đầu subtask:** đọc dashboard trên `dev` mới nhất có thể xác minh, kiểm tra checkout/status và Gate dependency. Cập nhật đúng phần A/B/C: tên, ngày, subtask, branch tạo từ `dev`, status, files sở hữu, contract/mock và next action. Trong cùng group có thể làm song song qua contracts/mocks đã chốt; chỉ merge phần phụ thuộc baseline tiếp theo sau Gate trước PASS.
2. **Hoàn thành PR:** mỗi subtask thông thường có một feature branch và một PR vào `dev`; hiện không yêu cầu approval. Ghi PR link/trạng thái, commit đã test, kết quả và phần còn thiếu trong phần mình. PR mở dùng `PR_OPEN`; sau merge xác minh merge SHA và acceptance trước `DONE`. A tổng hợp group; không đánh dấu Gate bằng trạng thái PR.
3. **Gặp blocker hoặc kết thúc session:** ghi phần đã làm, file/điểm tiếp tục, assumption, lỗi tái hiện, người cần hỗ trợ và một next action cụ thể. Dùng `BLOCKED` khi có blocker đã biết; không biến UNKNOWN thành blocker suy đoán. Thay handoff cũ khi hết hữu ích.
4. **Đóng Gate:** A tổng hợp evidence từ A/B/C trên `dev`, cập nhật đúng hàng group, shared handoff và stable baseline. Chỉ gọi group `DONE` khi đủ điều kiện ở trên. Sau toàn bộ V1 được nghiệm thu mới có PR tổng `dev` → `main`; Gate 006/007 không tự đóng V1.

Mỗi người chủ yếu sửa section của mình; A giữ các phần chung. Trước merge, đồng bộ dashboard với `dev`, giải quyết conflict theo timestamp/SHA/evidence và giữ cập nhật của người khác; không ghi đè cả file. Session Codex mới đọc rule → dashboard → subtask/plan và code liên quan, xác minh branch/SHA/PR, rồi tiếp tục từ next action. Nếu thiếu thông tin, giữ `UNKNOWN`/`NOT_VERIFIED` và xác nhận với owner; không suy đoán từ branch cục bộ.
