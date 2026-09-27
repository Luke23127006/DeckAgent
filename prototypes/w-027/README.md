# DeckAgent exploratory V0 — Phase 2 review

**Đã mở rộng core journey với các tình huống Phase 2. W-027 chưa Done:** Later storyboards của Phase 3 vẫn còn lại. Các tình huống dưới đây là mô phỏng để quan sát behavior và thảo luận UX; chưa chứng minh AI, validation hoặc output quality thật.

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
| AI generation/refinement | Deck dựng sẵn; bảy refinement cơ bản và bốn câu mẫu clarification/constraint/best effort; chỉ nhận nguyên câu mẫu |
| Brief | Được lưu trong phiên để thử thao tác; deck luôn về Thư viện sẻ chia; không sinh nội dung theo topic tùy ý |
| Constraints | Audience được lấy bằng heuristic hoặc clarification; language/tone/length khởi đầu cố định theo fixture, hiển thị trong workspace |
| Source | Optional pasted text hoặc một file. File chỉ lấy tên/extension, không đọc bytes; pasted source không được phân tích. Nguồn mẫu khớp dữ liệu deck; source tùy ý có disclosure rõ |
| Validation | Pass hoặc chặn candidate sai số liệu, mất constraint, slide rỗng theo bộ chọn demo; chưa có detector hoặc quality rubric tự động |
| PPTX/PDF export | Success, timeout, invalid output, degradation disclosure và retry mô phỏng từ accepted deck; không tạo PPTX/PDF thật |
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

Evidence: UC-001/002; R-001/R-002/R-003/R-004; D-024. Source gaps và processing failures được mở bằng các scenario F1–F3 bên dưới.

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

## Phase 2 — Scenario guide

Mở **Tình huống demo · Phase 2** ngay dưới header. Bộ chọn chỉ điều khiển kết quả giả lập của lần thao tác tiếp theo; mỗi lựa chọn lỗi tự về **Thông thường/Thành công** sau khi được dùng. Muốn lặp lại lỗi, chọn lại. Retry thành công ở lần kế tiếp là kịch bản dựng sẵn, không phải cam kết retry policy của product. Nút **Bắt đầu lại** cũng reset các bộ chọn.

Các nghĩa vụ giữ state, constraints, nguồn và output theo UC/REQ/D là đã xác nhận. Dialog, bộ chọn, vị trí thông báo, nút retry/continue và các fixture cụ thể là **đề xuất prototype**.

| Scenario | Cách chạy | Kết quả và recovery cần quan sát | Evidence |
| --- | --- | --- | --- |
| F1 — Source gap | Brief mẫu → Dán văn bản → nguồn mẫu. Chọn Source **Thiếu dữ liệu chi phí**, rồi tạo draft | Tình huống mẫu cần đánh giá chi phí nhưng nguồn không có. Quay lại sửa nguồn/yêu cầu, hoặc tiếp tục với phần thiếu được ghi rõ trong note và slide Giới hạn. Không thêm con số hoặc kết luận chi phí | UC-002; R-007/R-008; D-024 |
| F2a — Source processing bị gián đoạn | Chọn nguồn mẫu và Source **Xử lý nguồn bị gián đoạn** → tạo draft | Chưa generate, giữ input; sửa nguồn hoặc retry cùng source. Retry thành công giả lập. Không âm thầm bỏ source | UC-002; R-030–R-032 |
| F2b — Source ngoài boundary | Có một source, chọn **PDF scan ngoài boundary** → tạo draft | Không cung cấp nút retry thành công với scan. Quay lại thay nguồn duy nhất bằng text/source phù hợp; có thể chuyển Dán văn bản và dùng nguồn mẫu. Không mô phỏng OCR | UC-002; D-024 |
| F3 — Instruction trong source | Có nguồn mẫu, chọn **Có instruction trong source mẫu** → tạo draft → tiếp tục | Dialog cho xem câu nguồn giả lập yêu cầu đổi 120 thành 999. Deck vẫn dùng 120; note phân biệt source với instruction. Đây là minh họa expected boundary, không phải security test của một AI/parser thật | UC-002; R-004/R-007/R-043; BR-008 |
| F4 — Generation fail | Generation **Lỗi xử lý / timeout** → tạo draft | Operation dừng, không candidate/working/accepted; brief/source còn giữ. Quay lại sửa yêu cầu hoặc thử lại → valid working, export vẫn chờ Accept | UC-001; R-030–R-033 |
| F5 — Generation validation fail | Generation **Validation: sai số liệu** (dùng nguồn mẫu), hoặc **Validation: slide rỗng** | Hiển thị candidate bị chặn và lý do: 90 bị đổi thành 900, hoặc slide 2 rỗng. Candidate không trở thành working; chưa có gì để Accept/export. Sửa input hoặc retry | UC-001/002; R-007/R-021/R-033; D-028 |
| F6 — Refinement fail/validation fail | Tạo và Accept v1; rút gọn thành v2 nhưng chưa Accept. Chọn Refinement **timeout**, **mất constraint** hoặc **slide rỗng**; gửi câu mẫu Trang trọng hơn | Working v2, accepted v1 và constraints trước operation giữ nguyên. Timeout không có candidate; validation chặn candidate mới. Giữ yêu cầu trong ô nhập để sửa hoặc retry. Retry sinh working mới, vẫn cần Accept; Reject phục hồi theo A1/A2 | UC-004/006; R-024/R-030–R-033; D-025 |
| F7 — Clarification, conflict, constraint lifetime | Trong panel refinement mở **Thử clarification & constraint**. Thử lần lượt Yêu cầu mơ hồ, Constraint xung đột, Hủy giới hạn độ dài; gửi từng câu mẫu | Clarify mức rút gọn; yêu cầu thêm slide nhưng giữ số slide phải được user làm rõ trước. Hủy length chỉ bỏ constraint đó. Các lượt khác giữ audience/language/tone; nội dung cũ không đổi khi chỉ hủy constraint. Có thể Cancel/Reject theo assumption | UC-004/006; R-002/R-024; D-025 |
| F8 — Slide-targeted best effort | Chọn **Nhắm slide kết quả**, gửi yêu cầu; đọc disclosure rồi tiếp tục | Không guarantee locality. Fixture sửa tiêu đề kết quả và slide thảo luận; xem lại toàn deck rồi Accept/Reject. Không mở direct editing | UC-004; R-011/R-013; D-014/D-025 |
| F9 — Export failure và retry | Có accepted và có thể có pending working. Mở export; chọn timeout hoặc invalid output rồi PPTX/PDF | Không có download/biên nhận thành công khi fail. Retry giữ đúng format và accepted version của lần xuất bị lỗi; không regenerate. Có thể chọn format khác. JSON receipt thành công phải khớp accepted, không lấy pending result | UC-008; R-020/R-025/R-027/R-028/R-031/R-032; D-026; DOC-004 AC-09 |
| F10 — Format limitation/degradation | Export → **Khác biệt định dạng được thông báo** → PPTX hoặc PDF | PPTX: ví dụ giả định font thay thế có thể đổi xuống dòng; không cho phép severe clipping. PDF: static capability, không chỉnh như slide objects. User chọn tiếp tục hoặc format khác. Receipt ghi disclosure đã xác nhận; chưa có compatibility check thật | UC-008; R-026/R-027; D-009/D-026/D-028 |

**Đọc state:** progress dialog và bộ chọn demo hiển thị `candidate / working / accepted`. Khi lỗi, dialog giữ cause và state sau operation. Candidate thất bại bị loại; không có đường Accept candidate lỗi. IDs có thể nhảy số do các lần thử thất bại; đây là nhãn quan sát prototype, không phải version-history feature.

**Ranh giới recovery:** lỗi kỹ thuật giữ working trước thao tác và accepted độc lập, kể cả khi working chưa Accept. User Reject là lựa chọn khác: quay về accepted hoặc fallback trước lần Accept đầu theo A1. Không tự đồng nhất failure với Reject.

## Use Case Coverage Matrix tại checkpoint Phase 2

| UC | Scope | Đã có | Còn lại / giới hạn |
| --- | --- | --- | --- |
| UC-001 | V1 Core | C1/C2 + F4/F5: prompt, clarification, generation, preview, failure/validation/retry | Các kết quả đều fixture; không chứng minh generation quality |
| UC-002 | V1 Core | C2 + F1–F3/F5: source, gaps, source/instruction distinction, processing failure, scan boundary/replacement | Không parse hoặc kiểm tra file thật; chỉ một source/deck |
| UC-003 | Later | Chỉ ghi nhận trong matrix này | Storyboard import → working artifact → refine → export, preservation limitation |
| UC-004 | V1 Core | C3/C5 + F6–F8: repeated refinement, constraints, clarification/conflict/cancellation, Accept/Reject, failures, best effort | Acceptance/constraint lifetime assumptions cần team review; chưa có AI tự do |
| UC-005 | Later | Chỉ ghi nhận trong matrix này | Storyboard select → direct edit → preview, unsupported fallback |
| UC-006 | V1 Partial | C3 + F6/F7: thêm/bớt/reorder qua AI giả lập, failures/recovery và length conflict dùng chung flow | Assets deferred representation ở Phase 3 |
| UC-007 | Later/Exploratory | Chỉ ghi nhận trong matrix này | Storyboard reference role → generation/refinement → preview |
| UC-008 | V1 Core | C1/C4 + F9/F10: accepted-state PPTX/PDF, failure/invalid output, degradation disclosure, retry và JSON receipt | Không có export engine/file PPTX/PDF thật; không chứng minh output fidelity |

Không đánh dấu W-027 Done: UC Later và assets deferred chưa có storyboard. Phase 3 chưa được triển khai trong lần mở rộng Phase 2 này.

## Prototype assumptions và câu hỏi mở

| ID local | Giả định đang chạy | Câu hỏi cho team |
| --- | --- | --- |
| A1 | Nếu chưa Accept, Reject về previous valid working draft; nếu đã Accept, về latest accepted | Khi đã thử nhiều unaccepted results, user muốn quay về đâu? |
| A2 | Reject khôi phục nội dung và constraints cùng nhau | User constraints có cần lifetime độc lập với deck không? |
| A3 | Export được phép khi có pending result; dùng latest accepted và disclosure trong panel | Nên cho xuất bản cũ hay yêu cầu xử lý pending result trước? |
| A4 | Audience thiếu thì clarification theo heuristic từ khóa; các trường khác theo fixture | Khi nào cần hỏi, khi nào nên tạo draft trước? |
| A5 | Preview + refinement cùng workspace; thumbnails chỉ navigation | Panel cố định hay chỉ mở khi refine? |
| A6 | Một mock deck duy nhất; matching nguyên câu mẫu | Scenario nào nên bổ sung sau khi team hiểu core flow? |
| A7 | Failed candidate bị loại; technical failure giữ prior working và accepted riêng biệt | Cần hiển thị candidate bị chặn chi tiết đến đâu? Những lỗi nào cho phép sửa yêu cầu, retry hoặc phải đổi input? F4–F6 |
| A8 | Source gap có hai lựa chọn sửa input hoặc tiếp tục có disclosure; nguồn scan phải thay | Cách trình bày attribution/gaps có đủ rõ? Có cần thêm luồng user bổ sung bằng chứng không? F1–F3; R-008 |
| A9 | Bộ chọn chỉ gây lỗi một lần; retry kế tiếp thành công | Đây chỉ là cơ chế demo. Timeout, retry policy và automatic repair chưa quyết định; không được suy ra từ V0. F4–F6/F9 |
| A10 | Conflict được hỏi bằng lựa chọn rõ; cancel constraint là câu mẫu; targeted request có confirm trước chạy | Team muốn clarification ở bước nào, disclosure thế nào, và có cần confirm mọi targeted request không? F7/F8 |
| A11 | Degradation có disclosure và nút tiếp tục; severe clipping vẫn bị coi là failure | Loại degradation nào cần chặn hoặc chỉ thông báo? Cần evidence từ artifact thật, chưa baseline app compatibility. F10 |

Feedback chưa có từ team. Ghi sau walkthrough theo mẫu: **Scenario — observation — UC/R/D — idea — Open / thử phương án / team đã quyết định**. Chấp nhận prototype không tự phê duyệt các giả định thành product rules.

## Kiểm tra

Không cần dependency cho prototype hoặc state tests:

```powershell
node prototypes/w-027/tests/state.test.cjs
node --check prototypes/w-027/app.js
node --check prototypes/w-027/fixtures.js
```

State tests bảo vệ validation/acceptance, accepted export, reject và isolation của exported receipt. Chạy test bằng lệnh trực tiếp để không cần test-runner child process.

State regression của Phase 2 kiểm tra failed candidate không làm mất prior working, constraints, accepted hoặc đích Reject trước lần Accept đầu.

Đã chạy walkthrough tự động trên Chromium: preview/navigation, bảy refinement mẫu, nhiều lượt chỉnh, Accept/Reject, export PPTX/PDF từ accepted state khi có pending result, đọc biên nhận JSON, source/clarification và viewport mobile 390px. Không ghi nhận JavaScript error hoặc horizontal overflow toàn trang ở viewport mobile đã kiểm tra. Đây là kiểm tra prototype, không chứng minh quality của generation, validation hoặc export thật.

Nếu máy có Python Playwright và Chromium, có thể chạy lại bằng `python -B prototypes/w-027/tests/browser_smoke.py`. Tool này chỉ phục vụ kiểm tra, không cần để mở prototype; sẽ ghi lại ảnh trong `review/`.

Walkthrough Phase 2: `python -B prototypes/w-027/tests/phase2_smoke.py`. Kiểm tra F1–F10, failure state trước/sau Accept, request retention, retry export từ đúng accepted version khi có pending result, clarification/constraint cancellation và best-effort disclosure. Đây không phải bộ test production.

Ảnh review: [Màn bắt đầu](review/01-start.png) · [Workspace](review/02-workspace.png) · [Export](review/03-export.png) · [Mobile](review/04-mobile-workspace.png).

Ảnh Phase 2: [Generation failure](review/06-generation-failure.png) · [Source gap](review/07-source-gap.png) · [Validation failure](review/08-validation-failure.png) · [Mobile failure](review/09-mobile-failure.png) · [Export failure](review/10-export-failure.png).

## Context và inspiration

- [Project context](../../project_context.md), [AGENTS.md](../../AGENTS.md).
- Snapshot dùng: `2026-09-27T06:17:21.304770Z`; D-024–D-028, UC-001–UC-008; snapshot không bị sửa.
- [DOC-004](../../docs/architecture/architecture-acceptance-criteria.md), AC-04–AC-10: state/constraints/recovery/validation. Đây là criteria, không phải Architecture Decision.
- [Gamma Create with Agent](https://help.gamma.app/en/articles/15002203-how-do-i-create-with-agent-in-gamma): prompt, contextual clarification, conversational refinement.
- [Beautiful.ai creation](https://support.beautiful.ai/hc/en-us/articles/12885226948109-Creating-a-presentation-with-AI): preview structure và chỉnh nội dung bằng AI. Outline-first chưa được đưa thành required step của DeckAgent.

Tất cả file trong thư mục này là prototype artifacts. Không dùng state representation ở đây như product schema hoặc contract.
