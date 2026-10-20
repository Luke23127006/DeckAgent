# DeckAgent V1 — Progress

Dashboard giữ current state và handoff cần thiết; scope/acceptance criteria ở [parallel team plan](deckagent-parallel-team-implementation-plan.md), lý do và chuỗi giá trị ở [value-chain plan](deckagent-value-chain-implementation-plan.md). Gate 001–007 dưới đây thuộc parallel plan, không phải G1–G8 của value-chain plan. Không sao chép Jira hoặc lịch sử implementation vào đây.

## Current milestone và baseline — A cập nhật

| Mục | Hiện trạng |
| --- | --- |
| Mốc đang triển khai | M1 — Foundation / TASK-001; implementation A/B/C đã chạy local, chờ PR vào dev |
| Stable integration baseline | `NOT_VERIFIED` — chưa có Gate PASS kèm evidence; dev SHA: `UNKNOWN` |
| Snapshot đã kiểm tra | 20-10-2026, `feature/task-001-foundation` từ dev `51ecb14772c59bab6b608175491daaccdc5a2df6` + working-tree changes chưa commit |
| Phạm vi xác minh | Remote dev đã đối chiếu cùng SHA qua `git ls-remote`; candidate foundation chạy trên Windows và bản sao source sạch. Chưa có PR của session này; tiến độ ngoài session UNKNOWN |
| Đích ưu tiên theo plan | M6 — demo UC-001. Gate 007 cũng chưa đủ để kết luận toàn bộ V1 hoàn thành |

`UNKNOWN` = chưa biết thông tin; `NOT_VERIFIED` = chưa có evidence đủ để kết luận. Không suy ra “chưa bắt đầu” hay “đã xong” từ việc thiếu code trên một branch.

## Task Groups — A tổng hợp từ handoff và evidence

Trạng thái dùng: `NOT_VERIFIED`, `TODO` (owner xác nhận chưa bắt đầu), `IN_PROGRESS`, `BLOCKED`, `PR_OPEN`, `DONE`. Gate dùng `NOT_VERIFIED`, `FAIL`, `PASS`. **Subtask DONE** cần đầu ra đạt acceptance, PR đã merge vào `dev`, SHA và verification evidence. **Group DONE** cần cả ba subtasks DONE và Integration Gate PASS trên cùng baseline tích hợp. Merge PR không tự chứng minh Gate PASS.

| Group / milestone | Dependency | Status | Gate result / dev SHA / evidence |
| --- | --- | --- | --- |
| TASK-001 — Foundation (M1) | Không; upstream/toolchain ghi ở shared handoff | IN_PROGRESS | Gate 001 trên dev: NOT_VERIFIED / chưa merge; local candidate PASS, xem evidence bên dưới |
| TASK-002 — Agent + Session (M2) | Gate 001 PASS | NOT_VERIFIED | Gate 002: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-003 — Tools + Browser (M3) | Gate 002 PASS | NOT_VERIFIED | Gate 003: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-004 — Local Web (M4) | Gate 003 PASS | NOT_VERIFIED | Gate 004: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-005 — Slide Pipeline (M5) | Gate 004 PASS | NOT_VERIFIED | Gate 005: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-006 — UC-001 Demo (M6) | Gate 005 PASS | NOT_VERIFIED | Gate 006: NOT_VERIFIED / UNKNOWN / chưa có |
| TASK-007 — Recovery / History / Editing (M7) | Gate 006 PASS | NOT_VERIFIED | Gate 007: NOT_VERIFIED / UNKNOWN / chưa có |

## Parallel work và technical handoff — mỗi người sửa phần của mình

A/B/C là vai trò trong plan; danh tính và việc đang làm phải do thành viên xác nhận. Cột PR ghi link + open/merged/closed + merge SHA khi có; không điền branch dự kiến như branch đã tồn tại. Giữ evidence của subtask đã đóng bằng link PR, chỉ giữ handoff chi tiết cho việc đang làm hoặc vừa bàn giao.

### A — Platform / Host

- Thành viên / cập nhật: Codex triển khai TASK-001 theo yêu cầu task owner / 20-10-2026; danh tính ownership dài hạn UNKNOWN.
- Đang làm / branch / PR: TASK-001-A, chờ bàn giao / `feature/task-001-foundation` / chưa tạo PR.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-A | Workspace | IN_PROGRESS | Local checks PASS; chưa có PR/merge SHA |
| TASK-002-A | Agent Runtime | NOT_VERIFIED | UNKNOWN |
| TASK-003-A | File Tools + Safety | NOT_VERIFIED | UNKNOWN |
| TASK-004-A | Web Host | NOT_VERIFIED | UNKNOWN |
| TASK-005-A | Deck Service | NOT_VERIFIED | UNKNOWN |
| TASK-006-A | Outline State + Confirmation Guard | NOT_VERIFIED | UNKNOWN |
| TASK-007-A | Failure + Recovery | NOT_VERIFIED | UNKNOWN |

- Đã thực hiện local: root workspace, pnpm lockfile, TypeScript references, build script và `apps/foundation`; chưa DONE vì chưa merge.
- Contracts / assumptions: xem [provenance và fixture contract](../../UPSTREAM.md); foundation là boot smoke cho các nhóm sau.
- Verification: local candidate và bản sao source sạch PASS; xem evidence chung bên dưới.
- Blocker / lỗi còn lại: không còn blocker kỹ thuật cho local foundation; chờ PR/merge và Gate trên dev.
- Next action: review root config/lockfile và `.github/workflows/foundation.yml`, mở PR vào dev; sau merge ghi link CI push run PASS trên merge SHA để đóng Gate 001.

### B — Web / UX

- Thành viên / cập nhật: Codex triển khai TASK-001 theo yêu cầu task owner / 20-10-2026; danh tính ownership dài hạn UNKNOWN.
- Đang làm / branch / PR: TASK-001-B, chờ bàn giao / `feature/task-001-foundation` / chưa tạo PR.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-B | Cordis Boot Dependencies | IN_PROGRESS | Local checks PASS; chưa có PR/merge SHA |
| TASK-002-B | Model Providers + Credentials | NOT_VERIFIED | UNKNOWN |
| TASK-003-B | Host API | NOT_VERIFIED | UNKNOWN |
| TASK-004-B | Conversation + Settings UI | NOT_VERIFIED | UNKNOWN |
| TASK-005-B | Deck Client Model + Canvas | NOT_VERIFIED | UNKNOWN |
| TASK-006-B | Outline Conversation UI | NOT_VERIFIED | UNKNOWN |
| TASK-007-B | Chat + Deck History (UC-006) | NOT_VERIFIED | UNKNOWN |

- Đã thực hiện local: 11-package closure trong `vendor/*`, `packages/boot/app-boot`, `packages/util/*`; giữ nguyên source/identities/runtime contracts.
- Contracts / assumptions: inventory, source SHA, license và adaptations ở [UPSTREAM.md](../../UPSTREAM.md).
- Verification: typecheck/build/boot trên local candidate và bản sao sạch PASS; xem evidence chung.
- Blocker / lỗi còn lại: chưa test worker/profile APIs hoặc nền tảng khác; không chặn Gate 001 local.
- Next action: review provenance và dependency closure trước merge; mọi source divergence tương lai phải ghi lý do.

### C — Agent / Tools / Integration

- Thành viên / cập nhật: Codex triển khai TASK-001 theo yêu cầu task owner / 20-10-2026; danh tính ownership dài hạn UNKNOWN.
- Đang làm / branch / PR: TASK-001-C, chờ bàn giao / `feature/task-001-foundation` / chưa tạo PR.

| Subtask | Kết quả theo plan | Status | PR / evidence |
| --- | --- | --- | --- |
| TASK-001-C | Foundation Smoke Tests | IN_PROGRESS | 2 smoke tests PASS; chưa có PR/merge SHA |
| TASK-002-C | Session Persistence | NOT_VERIFIED | UNKNOWN |
| TASK-003-C | Browser Runtime | NOT_VERIFIED | UNKNOWN |
| TASK-004-C | Right Sidebar + Sample Deck Tab | NOT_VERIFIED | UNKNOWN |
| TASK-005-C | publish_slide Tool | NOT_VERIFIED | UNKNOWN |
| TASK-006-C | Agent Presentation Workflow | NOT_VERIFIED | UNKNOWN |
| TASK-007-C | Scoped Slide Editing (UC-002) | NOT_VERIFIED | UNKNOWN |

- Đã thực hiện local: provider/consumer fixture trong `packages/testing/foundation-fixture`, 2 integration smokes trong `tests/foundation.test.mjs`, negative config trong `apps/foundation/fixtures`.
- Contracts / assumptions: `foundationProbe`, `foundationGreeting`, `foundationReady` và cleanup ở [UPSTREAM.md](../../UPSTREAM.md).
- Verification: test đỏ trước implementation; 2/2 tests PASS sau build, gồm thiếu provider và repeated unload; bản sao sạch cũng PASS.
- Blocker / lỗi còn lại: chờ merge và kiểm thử trên dev; upstream full suite chưa chạy.
- Next action: chạy lại `pnpm test:foundation` trên dev sau merge; ghi đúng SHA/evidence để A đóng Gate 001.

## Shared handoff và verification — A duy trì, B/C gửi thay đổi qua handoff

**Đã xác minh trong candidate hiện tại:** [package.json](../../package.json), pnpm workspace/lockfile, TypeScript references và [build script](../../scripts/build-foundation.mjs) build 11 imported packages cùng fixture/application. [Foundation app](../../apps/foundation/src/index.ts) gọi app-boot thật; [smoke tests](../../tests/foundation.test.mjs) kiểm tra injection, cleanup và startup thiếu provider. [UX prototype](../design/UX-design/README.md) vẫn chỉ là mô phỏng UI. Candidate chưa merge vào dev.

**Contracts và quyết định TASK-001:** task owner cho phép triển khai kế hoạch cả group. [UPSTREAM.md](../../UPSTREAM.md) ghi source SHA `687f282e8625c6b8d11ff58211a90524be2e4317`, inventory, license, fixture contract và adaptations. Dùng pnpm `11.28.5`, Node theo upstream `^22.19.0 || >=24`; đã chạy bằng Node `22.19.0` cài local, không đổi Node toàn máy. Giữ nguyên imported src/exports/runtime dependencies; bỏ devDependencies chỉ phục vụ upstream tests, dùng build tools tại root. pnpm lockfile thay npm lockfile; giữ scripts OCR. Source closure gồm Loader/Include/Group và app-boot, không thêm Agent/Web. Boundary của nhóm tiếp theo và cơ chế tạo ảnh mới vẫn chưa chốt.

**CI:** [Foundation CI](../../.github/workflows/foundation.yml), job `Gate 001 (Windows)`, chạy trên PR vào dev/main, push dev/main và manual dispatch. Checks: frozen install → build/typecheck → integration smoke → boot/unload CLI → UX regression. Node 22.19.0, pnpm đọc từ package.json; run summary giữ SHA, kết quả và link evidence. PR run kiểm tra proposed merge; chỉ dùng push run PASS trên merged dev SHA để đóng Gate 001. GitHub-hosted run hiện `NOT_VERIFIED`; workflow chưa push. Không tự cập nhật dashboard hay thay branch protection.

| Evidence | Ngày / revision / môi trường | Check và kết quả | Giới hạn / lỗi còn lại |
| --- | --- | --- | --- |
| Git/source baseline | 20-10-2026 / Codex / dev `51ecb14772c59bab6b608175491daaccdc5a2df6` + candidate chưa commit | `git ls-remote origin refs/heads/dev` và upstream HEAD khớp SHA đã ghi; branch `feature/task-001-foundation` | Remote các branch/PR khác UNKNOWN; chưa có merge SHA candidate |
| Foundation local candidate | 20-10-2026 / Codex / cùng base + working-tree changes / Windows x64 PowerShell, Node 22.19.0, pnpm 11.28.5 | `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:foundation` → PASS, 2/2 tests; `pnpm start:foundation` → greeting, provider/consumer cleanup, exit 0. Chạy lại trên bản sao source sạch không có node_modules/lib cũng PASS | Peer cycle Cordis/Include kế thừa upstream; warning thiếu foundationGreeting là expected trong negative test. Không có missing-module error chưa giải thích. Worker/profile APIs và hệ điều hành khác chưa test |
| Compatibility và provenance | Cùng ngày/base + candidate / Node 22.19.0, Windows | `node tests/ux-02-prototype.test.cjs` → PASS, 64 presets; `pnpm ocr --version` → 1.12.7; đối chiếu bytes 55 source files/11 packages và tsconfigs với pinned snapshot → khớp; manifests chỉ khác devDependencies đã ghi. Local doc links và `git diff --check` PASS | Chưa chạy upstream full suite; kiểm tra whitespace riêng cho file authored chưa tracked |
| Foundation CI configuration | 20-10-2026 / Codex / cùng base + working-tree changes | `actionlint` 1.7.12 và PowerShell parser cho mọi run step → PASS. Chạy lại đủ frozen install, build, 2/2 smoke tests, CLI boot/unload và UX regression 64 presets trên source copy sạch ở Windows → PASS | GitHub-hosted execution NOT_VERIFIED đến khi push/mở PR; không dùng local validation để đóng Gate trên dev |
| Gate 001 integrated / Gates 002–007 | NOT_VERIFIED | Chưa chạy trên dev chứa candidate; model thật, persistence và Web end-to-end chưa chạy | Chờ PR/merge và chạy lại Gate 001 trên đúng dev SHA; không nâng stable baseline |

Khi đóng Gate, thay nội dung evidence của Gate tương ứng bằng: **ngày + người chạy + dev SHA + môi trường/toolchain + lệnh hoặc bước manual + expected/actual + PASS/FAIL + link log/artifact + lỗi/giới hạn còn lại**. Đối chiếu toàn bộ tiêu chí Gate trong parallel plan; thiếu check thì giữ `NOT_VERIFIED`. Chỉ nâng stable baseline tới SHA đã PASS; giữ baseline PASS trước đó nếu tích hợp mới FAIL. Dùng check thực sự tồn tại ở thời điểm đó, không bịa lệnh CI/build hoặc ghi secrets vào evidence.

## Cập nhật và tiếp tục session

1. **Bắt đầu subtask:** đọc dashboard trên `dev` mới nhất có thể xác minh, kiểm tra checkout/status và Gate dependency. Cập nhật đúng phần A/B/C: tên, ngày, subtask, branch tạo từ `dev`, status, files sở hữu, contract/mock và next action. Trong cùng group có thể làm song song qua contracts/mocks đã chốt; chỉ merge phần phụ thuộc baseline tiếp theo sau Gate trước PASS.
2. **Hoàn thành PR:** mỗi subtask thông thường có một feature branch và một PR vào `dev`; hiện không yêu cầu approval. Ghi PR link/trạng thái, commit đã test, kết quả và phần còn thiếu trong phần mình. PR mở dùng `PR_OPEN`; sau merge xác minh merge SHA và acceptance trước `DONE`. A tổng hợp group; không đánh dấu Gate bằng trạng thái PR.
3. **Gặp blocker hoặc kết thúc session:** ghi phần đã làm, file/điểm tiếp tục, assumption, lỗi tái hiện, người cần hỗ trợ và một next action cụ thể. Dùng `BLOCKED` khi có blocker đã biết; không biến UNKNOWN thành blocker suy đoán. Thay handoff cũ khi hết hữu ích.
4. **Đóng Gate:** A tổng hợp evidence từ A/B/C trên `dev`, cập nhật đúng hàng group, shared handoff và stable baseline. Chỉ gọi group `DONE` khi đủ điều kiện ở trên. Sau toàn bộ V1 được nghiệm thu mới có PR tổng `dev` → `main`; Gate 006/007 không tự đóng V1.

Mỗi người chủ yếu sửa section của mình; A giữ các phần chung. Trước merge, đồng bộ dashboard với `dev`, giải quyết conflict theo timestamp/SHA/evidence và giữ cập nhật của người khác; không ghi đè cả file. Session Codex mới đọc rule → dashboard → subtask/plan và code liên quan, xác minh branch/SHA/PR, rồi tiếp tục từ next action. Nếu thiếu thông tin, giữ `UNKNOWN`/`NOT_VERIFIED` và xác nhận với owner; không suy đoán từ branch cục bộ.
