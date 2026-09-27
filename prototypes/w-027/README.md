# DeckAgent exploratory V0 — core journey review

**Checkpoint Phase 1, chưa hoàn thành toàn bộ W-027.** Theo yêu cầu task owner, dừng để review core interaction trước khi triển khai đầy đủ failure scenarios và Later storyboards.

Prototype độc lập, dùng HTML/CSS/JavaScript thuần. Không có backend, AI, parser, persistence hay export engine thật. Layout và state simulation có thể thay đổi sau review; không phải Architecture Decision.

## Mở prototype

Mở trực tiếp [index.html](index.html) bằng Edge/Chrome/Firefox hiện đại. Không cần npm install, build hoặc account. Các script dùng đường dẫn tương đối và chạy qua `file://`.

Nếu muốn dùng local URL, chạy từ repository root:

```powershell
python -B -m http.server 8027 --bind 127.0.0.1 --directory prototypes/w-027
```

Mở <http://127.0.0.1:8027>. Dừng server bằng Ctrl+C. Đây chỉ là static server phục vụ file prototype. Có thể chia sẻ cả thư mục này dưới dạng ZIP hoặc repository artifact; giữ nguyên các file cạnh nhau.

## Những gì chạy thật và những gì giả lập

| Phần | Hiện trạng |
| --- | --- |
| Form, navigation, preview, slide overview, Accept/Reject | Interactive trong browser |
| AI generation/refinement | Deck dựng sẵn và bảy biến thể; chỉ nhận nguyên câu refinement mẫu |
| Brief | Được lưu trong phiên để thử thao tác; deck luôn về Thư viện sẻ chia; không sinh nội dung theo topic tùy ý |
| Constraints | Audience được lấy bằng heuristic hoặc clarification; language/tone/length khởi đầu cố định theo fixture, hiển thị trong workspace |
| Source | Optional pasted text hoặc một file. File chỉ lấy tên/extension, không đọc bytes; pasted source không được phân tích. Nguồn mẫu khớp dữ liệu deck; source tùy ý có disclosure rõ |
| Validation | Một bước chờ rồi pass giả lập; chưa có detector hoặc quality rubric tự động |
| PPTX/PDF export | Success UI mô phỏng từ accepted deck; không tạo PPTX/PDF giả có extension sai |
| Download | Biên nhận `.json` ghi format được chọn, accepted version và nội dung minh họa; ghi rõ không phải PPTX/PDF |
| Persistence | Trong memory của tab; reload/reset mất state theo giả định demo, không phải quyết định chi tiết về session lifecycle của product |

Tất cả số liệu là giả lập: 40 người tham gia, 120 lượt mượn, 90 đúng hạn, 30 trễ; 4 tuần. Không có dữ liệu chi phí hoặc hài lòng. Không gửi dữ liệu ra network. Không sử dụng external fonts, scripts hoặc images.

## Scenario guide

### C1 — Prompt → draft → accept → export

1. Chọn **Điền brief mẫu để bắt đầu**; để source là Không dùng nguồn.
2. Chọn **Tạo bản nháp**. Quan sát bước generation và validation mô phỏng.
3. Xem slide tiếp/trước, chọn thumbnail, chuyển **Toàn deck**.
4. Trước Accept, export chưa khả dụng; valid working draft không tự là accepted state.
5. Chọn **Chấp nhận bản này**. Mở **Xuất presentation**.
6. Chọn PowerPoint/PDF; panel ghi `v1` accepted. Tải biên nhận JSON nếu muốn đối chiếu.

Evidence: UC-001/008; R-006/R-019/R-020/R-033; D-026.

### C2 — Optional source và clarification

1. Bắt đầu lại. Nhập `Tạo báo cáo thử nghiệm Thư viện sẻ chia.` (chưa nêu audience).
2. Chọn Dán văn bản → **Dùng báo cáo nguồn mẫu**.
3. Tạo draft → trả lời audience trong dialog → tiếp tục.
4. Kiểm tra audience trong **Yêu cầu đang áp dụng** và attribution dưới preview.
5. Có thể thử chọn một file `.txt/.md/.pdf/.docx/.pptx`. V0 chỉ biểu diễn việc chọn source, không ingest file đó.

Evidence: UC-001/002; R-001/R-002/R-003/R-004; D-024. Source gaps và processing failures chuyên biệt chưa được mô phỏng ở checkpoint này.

### C3 — Nhiều lượt refinement và Reject

1. Từ draft đã Accept `v1`, chọn **Trang trọng hơn**, gửi nguyên câu mẫu.
2. Quan sát candidate/validation; `v2` là working result, accepted vẫn là `v1`.
3. Accept `v2`; chọn **Đổi mạch kể** và gửi. Kết quả ở `v3` có slide kết quả ngay sau mở đầu; tone trang trọng còn giữ.
4. Chọn **Bỏ lần sửa này**. Preview trở lại `v2`; export vẫn dùng `v2`.
5. Thử **Rút gọn** hoặc **Thêm nội dung** để thấy thay đổi structure và length. Chọn Accept/Reject để đối chiếu.
6. Câu yêu cầu tùy ý ngoài mẫu sẽ được báo chưa có mô phỏng, không trả canned result như thể AI hiểu.

Evidence: UC-004/006; R-011/R-013/R-024/R-031; D-025. Bảy câu mẫu đại diện length, tone, audience, flow/order, polish, broad content change, regeneration. Fixtures chỉ giúp hình dung behavior, không chứng minh AI quality.

### C4 — Export khi có refinement chưa accepted

1. Có `v1` đã Accept. Tạo `v2` mới, chưa Accept.
2. Mở export: panel phải ghi đang xuất `v1` và giải thích `v2` chưa được chấp nhận.
3. Xuất PPTX rồi PDF: cả hai receipts đều từ `v1`; export không regenerate hoặc thay accepted state.
4. Sau khi Accept `v2`, mở export lại: panel chuyển sang `v2`.

Evidence invariant: R-020/R-025/R-028. Interaction cho phép export bản accepted trong tình huống này là **assumption V0 cần review**.

### C5 — Reject trước lần Accept đầu tiên (assumption)

1. Tạo `v1`, chưa Accept; refine thành `v2`.
2. Reject `v2`: trở về `v1`, accepted vẫn trống, export chưa khả dụng.
3. Đây là one-step fallback của prototype; không có multi-step Undo/history.

Tình huống này chưa có semantics thống nhất giữa D-025/R-031 và derived diagrams. Không coi behavior V0 là product decision.

## Use Case Coverage Matrix tại checkpoint Phase 1

| UC | Scope | Đã có | Còn lại sau core review |
| --- | --- | --- | --- |
| UC-001 | V1 Core | C1/C2: prompt, clarification, generation, preview | Generation failure, validation failure |
| UC-002 | V1 Core | C2: optional source selection, disclosure mock processing, source fixture | Source gap, trust-boundary scenario, unprocessable source |
| UC-003 | Later | Chỉ ghi nhận trong matrix này | Storyboard import → working artifact → refine → export, preservation limitation |
| UC-004 | V1 Core | C3/C5: bảy refinement examples, multiple rounds, constraints, Accept/Reject | Refinement/validation failure, slide-targeted best-effort scenario |
| UC-005 | Later | Chỉ ghi nhận trong matrix này | Storyboard select → direct edit → preview, unsupported fallback |
| UC-006 | V1 Partial | C3: thêm/bớt/reorder qua AI giả lập | Assets deferred representation; failures theo UC-004 |
| UC-007 | Later/Exploratory | Chỉ ghi nhận trong matrix này | Storyboard reference role → generation/refinement → preview |
| UC-008 | V1 Core | C1/C4: accepted-state PPTX/PDF simulation, JSON receipt | Export failure/invalid output, degradation, retry |

Không đánh dấu W-027 Done: các UC Later chưa có storyboard và Phase 2 còn thiếu. Checkpoint này cố ý dành cho review core journey trước khi mở rộng, theo chỉ dẫn của task owner.

## Prototype assumptions và câu hỏi mở

| ID local | Giả định đang chạy | Câu hỏi cho team |
| --- | --- | --- |
| A1 | Nếu chưa Accept, Reject về previous valid working draft; nếu đã Accept, về latest accepted | Khi đã thử nhiều unaccepted results, user muốn quay về đâu? |
| A2 | Reject khôi phục nội dung và constraints cùng nhau | User constraints có cần lifetime độc lập với deck không? |
| A3 | Export được phép khi có pending result; dùng latest accepted và disclosure trong panel | Nên cho xuất bản cũ hay yêu cầu xử lý pending result trước? |
| A4 | Audience thiếu thì clarification theo heuristic từ khóa; các trường khác theo fixture | Khi nào cần hỏi, khi nào nên tạo draft trước? |
| A5 | Preview + refinement cùng workspace; thumbnails chỉ navigation | Panel cố định hay chỉ mở khi refine? |
| A6 | Một mock deck duy nhất; matching nguyên câu mẫu | Scenario nào nên bổ sung sau khi team hiểu core flow? |

Feedback chưa có từ team. Ghi sau walkthrough theo mẫu: **Scenario — observation — UC/R/D — idea — Open / thử phương án / team đã quyết định**. Chấp nhận prototype không tự phê duyệt các giả định thành product rules.

## Kiểm tra

Không cần dependency cho prototype hoặc state tests:

```powershell
node prototypes/w-027/tests/state.test.cjs
node --check prototypes/w-027/app.js
node --check prototypes/w-027/fixtures.js
```

State tests bảo vệ validation/acceptance, accepted export, reject và isolation của exported receipt. Chạy test bằng lệnh trực tiếp để không cần test-runner child process.

Đã chạy walkthrough tự động trên Chromium: preview/navigation, bảy refinement mẫu, nhiều lượt chỉnh, Accept/Reject, export PPTX/PDF từ accepted state khi có pending result, đọc biên nhận JSON, source/clarification và viewport mobile 390px. Không ghi nhận JavaScript error hoặc horizontal overflow toàn trang ở viewport mobile đã kiểm tra. Đây là kiểm tra prototype, không chứng minh quality của generation, validation hoặc export thật.

Nếu máy có Python Playwright và Chromium, có thể chạy lại bằng `python -B prototypes/w-027/tests/browser_smoke.py`. Tool này chỉ phục vụ kiểm tra, không cần để mở prototype; sẽ ghi lại ảnh trong `review/`.

Ảnh review: [Màn bắt đầu](review/01-start.png) · [Workspace](review/02-workspace.png) · [Export](review/03-export.png) · [Mobile](review/04-mobile-workspace.png).

## Context và inspiration

- [Project context](../../project_context.md), [AGENTS.md](../../AGENTS.md).
- Snapshot dùng: `2026-09-27T06:17:21.304770Z`; D-024–D-028, UC-001–UC-008; snapshot không bị sửa.
- [DOC-004](../../docs/architecture/architecture-acceptance-criteria.md), AC-04–AC-10: state/constraints/recovery/validation. Đây là criteria, không phải Architecture Decision.
- [Gamma Create with Agent](https://help.gamma.app/en/articles/15002203-how-do-i-create-with-agent-in-gamma): prompt, contextual clarification, conversational refinement.
- [Beautiful.ai creation](https://support.beautiful.ai/hc/en-us/articles/12885226948109-Creating-a-presentation-with-AI): preview structure và chỉnh nội dung bằng AI. Outline-first chưa được đưa thành required step của DeckAgent.

Tất cả file trong thư mục này là prototype artifacts. Không dùng state representation ở đây như product schema hoặc contract.
