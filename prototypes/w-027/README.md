# DeckAgent exploratory V0 — Phase 4 handoff

**Bắt đầu review tại [REVIEW.html](REVIEW.html).** Đã có representation cho cả tám Use Cases: interactive mock cho V1 Core/structure UC-006 và storyboard cho Later/assets deferred. [HANDOFF.md](HANDOFF.md) có checklist đối chiếu AC, cách nhận ZIP và nội dung bàn giao; [FEEDBACK.md](FEEDBACK.md) là mẫu ghi nhận buổi review. Không tự cập nhật W-027 thành Done. Các tình huống giúp quan sát behavior và thảo luận UX, chưa chứng minh AI, validation hoặc output quality thật.

Prototype độc lập, dùng HTML/CSS/JavaScript thuần. Không có backend, AI, parser, persistence hay export engine thật. Layout và state simulation có thể thay đổi sau review; không phải Architecture Decision.

## Mở prototype

Mở trực tiếp [index.html](index.html) bằng Edge/Chrome/Firefox hiện đại. Không cần npm install, build hoặc account. Các script dùng đường dẫn tương đối và chạy qua `file://`.

Mở **Later storyboards · Phase 3** ở đầu prototype, hoặc mở trực tiếp [storyboards.html](storyboards.html). Link từ V1 mở tab riêng để giữ working/accepted state đang demo. Quay lại tab V1 cũ để tiếp tục phiên đó; **Mở phiên V1 mới** trên trang storyboard sẽ tạo một phiên khác, không khôi phục phiên cũ.

Nếu muốn dùng local URL, chạy từ repository root:

```powershell
python -B -m http.server 8027 --bind 127.0.0.1 --directory prototypes/w-027
```

Mở <http://127.0.0.1:8027>. Dừng server bằng Ctrl+C. Đây chỉ là static server phục vụ file prototype. Có thể chia sẻ cả thư mục này dưới dạng ZIP hoặc repository artifact; giữ nguyên các file cạnh nhau.

Gói đã chuẩn bị: `artifacts/deckagent-w027-v0-review.zip`. Giải nén toàn bộ và mở `deckagent-w027-v0/REVIEW.html`; không cần repository để demo. Sau giải nén, có thể chạy server ngay trong thư mục chứa REVIEW.html với `python -B -m http.server 8027 --bind 127.0.0.1` (bỏ `--directory prototypes/w-027`). Đóng gói lại bằng `python -B prototypes/w-027/package_review.py` từ repository root; manifest trong ZIP và file `.zip.sha256` cạnh ZIP dùng để đối chiếu bản bàn giao.

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
| Later storyboards | Trang HTML/CSS tĩnh, điều hướng bằng anchor; các control trong wireframe chỉ là hình minh họa. Không import, direct edit, xử lý reference hoặc asset thật; không chia sẻ state với V1 |

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

## Phase 3 — Later storyboard guide

Actor chung: **ACT-001**. UC-003/005/007 là **Draft**, requirements về capability tương ứng vẫn Proposed/Later. UC-006 là Draft/V1 Partial: structure qua AI đã có trong V1, assets vẫn deferred. Tất cả lựa chọn bố cục, lời nhắc mẫu, đối chiếu trước/sau và fallback chưa được đặc tả đều gắn nhãn **Đề xuất minh họa V0** hoặc **Chưa chốt** trong artifact.

| Scenario / artifact thật | Walkthrough và trạng thái quan sát | Alternative/failure và giới hạn | Trace |
| --- | --- | --- | --- |
| [S1 — UC-003](storyboards.html#uc-003) | Existing presentation + intent → importing/preservation review → imported working artifact → refinement/editing → preview/export. Bốn khung minh họa input, đối chiếu, workspace và kết quả | Import/preservation không đủ phải báo giới hạn. Đề xuất dừng/đổi input/quay lại công cụ gốc; chưa chốt có được tiếp tục với degraded result không. PPTX-as-source không phải import working artifact | UC-003; R-005/R-012/R-019/R-022/R-023/R-024/R-031/R-034; D-013; A-011/A-012 |
| [S2 — UC-005](storyboards.html#uc-005) | Có editor/canvas supported → select content/object → direct modification → preview state mới. Ví dụ sửa tiêu đề chỉ là đề xuất, không chốt operation set | Unsupported → AI nếu capability cho phép hoặc external tool. Technical failure/commit/Undo còn thiếu semantics; không giả lập full history hay tự auto-accept manual edit | UC-005; R-014/R-015/R-016/R-019/R-029/R-031; D-015; A-010 |
| [S3 — assets UC-006](storyboards.html#uc-006-assets) | Có deck → yêu cầu reuse/generate visual → unsupported/deferred notice → đề xuất tiếp tục structure/content hoặc review/Accept/PPTX handoff. Các điểm nghiên cứu cho future asset flow được để dưới dạng placeholder | Không extract/reuse embedded image, không tạo ảnh hay quản lý asset trong V1. Chưa chốt supported types/role/recovery cho Later. R-018 có wording optional/V1 quality nhưng không supersede boundary hiện hành | UC-006; R-014/R-017/R-018/R-019/R-034; D-015/D-024/D-025; L-001/L-002 |
| [S4 — UC-007](storyboards.html#uc-007) | Artifact reference → role unclear/resolved → dùng cho generation/refinement → preview. Ví dụ tham khảo structure, không sao chép facts; role rõ có thể bỏ qua clarification | Role không rõ phải hỏi, không suy ra từ extension. Processing failure và constraint conflict chưa có policy; đưa câu hỏi và phương án thảo luận, không chọn solution | UC-007; R-003/R-004/R-010/R-017/R-024; D-007; A-014 |

**Cách demo:** đi S1 → S2 → S3 → S4 bằng các liên kết trên trang. Mỗi storyboard có actor/precondition, flow chính bằng khung đánh số, nhánh thay thế/failure và câu hỏi review. Các liên kết S1→S2→S3→S4 chỉ giúp đọc tài liệu, không biến bốn capability thành chuỗi bắt buộc của product.

**Shared experience:** preview, refinement và review/export có thể dùng chung ý tưởng trình bày. S1 có thể dẫn S2 khi direct editing được support; S4 có thể tham gia generation hoặc refinement. Những kết nối này không mở imported editing/reference trong UC-004 V1 và không chọn module/contract của hệ thống.

## Use Case Coverage Matrix — bản bàn giao V0

| UC | Scope | Đã có | Còn lại / giới hạn |
| --- | --- | --- | --- |
| UC-001 | V1 Core | C1/C2 + F4/F5: prompt, clarification, generation, preview, failure/validation/retry | Các kết quả đều fixture; không chứng minh generation quality |
| UC-002 | V1 Core | C2 + F1–F3/F5: source, gaps, source/instruction distinction, processing failure, scan boundary/replacement | Không parse hoặc kiểm tra file thật; chỉ một source/deck |
| UC-003 | Later | [S1](storyboards.html#uc-003): import → working artifact → refinement → preview/export; preservation limitation | Static storyboard; formats/preservation và recovery policy chưa baseline |
| UC-004 | V1 Core | C3/C5 + F6–F8: repeated refinement, constraints, clarification/conflict/cancellation, Accept/Reject, failures, best effort | Acceptance/constraint lifetime assumptions cần team review; chưa có AI tự do |
| UC-005 | Later | [S2](storyboards.html#uc-005): select → direct edit → preview; unsupported → AI/external tool | Static storyboard; operation types, commit và Undo chưa baseline |
| UC-006 | V1 Partial | C3 + F6/F7: structure qua AI, failures/recovery, length conflict; [S3](storyboards.html#uc-006-assets): assets deferred notice/fallback và research placeholders | Không triển khai assets; các operation future vẫn chưa được quyết định |
| UC-007 | Later/Exploratory | [S4](storyboards.html#uc-007): nhận reference → clarification role → generation/refinement → preview; failure/conflict questions | Static storyboard; reference fidelity và recovery chưa baseline |
| UC-008 | V1 Core | C1/C4 + F9/F10: accepted-state PPTX/PDF, failure/invalid output, degradation disclosure, retry và JSON receipt | Không có export engine/file PPTX/PDF thật; không chứng minh output fidelity |

Đã có artifact cho tất cả UC; representation không đồng nghĩa implementation capability. Handoff tổng thể cần team review và Artifact / Link trong W-027 trỏ đúng bản prototype được bàn giao trước khi Done. Lần này không sửa Project Hub hoặc tự đổi task status; không chọn Architecture.

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

### Câu hỏi bổ sung từ Phase 3

Các ID `P3-Qxx` dưới đây chỉ là ID local của prototype. Không phải Requirement/Decision mới. Tất cả đều **Open**; có thể khám phá khi review storyboard, cần làm rõ trước implementation capability Later tương ứng.

| ID / scenario | Câu hỏi | Vì sao cần biết / phương án để thảo luận | Evidence |
| --- | --- | --- | --- |
| P3-Q01 / S1 | Supported import formats/properties và preservation fidelity tới đâu? | Quyết định user có thể tin vào working artifact nào; chưa chọn format hay ngưỡng | R-005/R-023; D-013 |
| P3-Q02 / S1 | Fidelity không đủ thì chặn hay cho review bản suy giảm? Phục hồi về đâu? | Ảnh hưởng bước đầu journey và nguy cơ mất artifact. Không tự mặc định import thành công | UC-003; R-031; A-011/A-012 |
| P3-Q03 / S2 | Correction, object types và operation set tối thiểu? | Tránh biến lightweight edit thành full editor; có thể so với PPTX handoff | R-014/R-015; D-015; A-010 |
| P3-Q04 / S2 | Khi nào commit manual edit? Hủy/Accept/recovery ra sao? | Cần phân biệt draft đang sửa với kết quả user chấp nhận; không tự áp dụng semantics AI Reject | R-016/R-019/R-031 |
| P3-Q05 / S3 | User cần reuse image, embedded image hay generated visual trước? | Evidence sau demo quyết định ưu tiên, không promote tất cả vào V1 | R-017/R-018; L-001/L-002 |
| P3-Q06 / S3 | Role, types, scope, attribution và asset failure behavior? | Cần trước khi vẽ asset flow chi tiết; hiện chỉ placeholder cho các điểm chưa có quyết định | UC-006; R-017/R-034; D-024 |
| P3-Q07 / S4 | Reference types/roles và mức fidelity nào cần support? | Phân biệt tham khảo với copy-exactly, factual source và working artifact | R-004/R-010; D-007 |
| P3-Q08 / S4 | Reference conflict hoặc processing failure xử lý thế nào? | Có thể hỏi lại, bỏ phần không support hoặc dừng; chưa chọn policy | UC-007; R-024; A-014 |

## Kiểm tra

Kết quả kiểm tra bản bàn giao và giới hạn: [review/verification.md](review/verification.md). Trong ZIP đã giải nén, bỏ tiền tố `prototypes/w-027/` trong các lệnh dưới; ví dụ `node tests/state.test.cjs`.

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

Phase 3 đã kiểm tra trên Chromium desktop 1440px và mobile 390px: liên kết S1–S4 hoạt động, các khung là static, không tràn ngang ở các viewport đã kiểm tra. Mở storyboard ở tab riêng rồi quay lại vẫn giữ working/accepted state và có thể export bản accepted trong phiên V1 cũ. Không ghi nhận JavaScript error. Kiểm tra này xác nhận artifact/điều hướng, không xác nhận capability Later hoạt động.

Ảnh Phase 3: [Tổng quan](review/11-storyboards-overview.png) · [S1 Import](review/12-uc-003.png) · [S2 Direct edit](review/13-uc-005.png) · [S3 Assets](review/14-uc-006-assets.png) · [S4 Reference](review/15-uc-007.png) · [Mobile](review/16-storyboard-mobile.png).

## Context và inspiration

- Tài liệu trong repository, không đóng kèm ZIP: `project_context.md`, `AGENTS.md`.
- Snapshot dùng: `2026-09-27T06:17:21.304770Z`; D-024–D-028, UC-001–UC-008; snapshot không bị sửa.
- Phase 3 đối chiếu lại tại branch `W-027`, commit đầu turn `3a457f3161dafd049a5b150951247179919c8592`. Project Hub báo snapshot fresh, structural validation pass; không sync hoặc ghi lại snapshot. UC/REQ/D/L liên quan vẫn giữ boundary nêu trên.
- DOC-004 trong repository: `docs/architecture/architecture-acceptance-criteria.md`, AC-04–AC-10: state/constraints/recovery/validation. Đây là criteria, không phải Architecture Decision.
- [Gamma Create with Agent](https://help.gamma.app/en/articles/15002203-how-do-i-create-with-agent-in-gamma): prompt, contextual clarification, conversational refinement.
- [Beautiful.ai creation](https://support.beautiful.ai/hc/en-us/articles/12885226948109-Creating-a-presentation-with-AI): preview structure và chỉnh nội dung bằng AI. Outline-first chưa được đưa thành required step của DeckAgent.

Tất cả file trong thư mục này là prototype artifacts. Không dùng state representation ở đây như product schema hoặc contract.
