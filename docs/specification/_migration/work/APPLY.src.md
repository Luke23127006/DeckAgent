# Áp quyết định xuống item (Pha B, bước B2)

File này là đầu vào của B3 và B4. Nguồn quyết định: `DECISIONS.md`; ô Quyết định của từng blocker ở `BLOCKERS.md`. Trả lời của người dùng cho 3 điểm cần xem (2026-10-05) nằm ở mục 7; mục 7 cũng là nguồn quyết định cho B3–B7.

## 1. Status thay đổi so với sheet

| Item | Status trong sheet | Status sau migrate | Căn cứ |
|---|---|---|---|
| {R-026} | Active | Proposed | {P2}, {BLK-002} |
| {R-028} | Active | Proposed | {P2}, {BLK-002} |
| {R-010} | Proposed | Draft | {P2}, {BLK-061} |
| {C-003} | Active | Retired | {Q1} |
| {D-026} | Active | Superseded, `superseded_by` trỏ {D-031} | {Q1} |
| {A-023} | Open | Retired | {Q1}: giả định chỉ đúng khi V1 có 2 định dạng |

Mọi item khác giữ status của sheet. {BR-005} bị xóa theo trả lời {CX-1} (mục 5).

## 2. Thay đổi theo Q1

Đã tìm trong mọi ô của 7 loại item và glossary các chữ: "định dạng", PNG, SVG, Google, Slides, "chỉ xem", PPTX đi cùng PDF, "tải về" đi cùng PPTX hoặc PDF. Ngoài các item trong ví dụ của đề bài, tìm thêm được {UC-015}, {GL-017}, {D-009}, {A-029}, {UC-011}, {UC-012}, {UC-017}, {R-049}, {UC-009}.

| Item | Nội dung hiện tại (sheet) | Thay đổi theo Q1 |
|---|---|---|
| {D-031} (mới) | Không có | Decision: (1) V1 tải về 4 định dạng: PPTX, sửa được trong Microsoft PowerPoint; PDF, để in, lưu trữ, chia sẻ; PNG, mỗi slide một ảnh, đóng gói thành file .zip; SVG, mỗi slide một ảnh vector, đóng gói thành file .zip. (2) Release Later: đẩy deck vào Google Drive của người dùng dưới dạng file Google Slides; người dùng đăng nhập Google để cấp quyền. Context: {D-026} chỉ có 2 định dạng; advisor khuyến khích thêm định dạng khi khả thi (lấy từ Lý do 3 của {C-003}). Rationale: danh sách lấy theo benchmark Napkin AI (hộp thoại Export All Slides của Napkin AI gồm PowerPoint, Google Slides, PDF, PNGs, SVGs); danh sách là lựa chọn của team, không phải yêu cầu áp từ môn học hay advisor. Reopen When theo mục 7. Chi tiết field ở mục 4 |
| {D-026} | Active. Decision 1 "V1 tải về 2 định dạng: PPTX (sửa được) và PDF (chỉ xem)"; mục 3 "mức tương thích PPTX được học từ implementation" | Superseded, `superseded_by: [D-031]`. Nội dung giữ nguyên ({GX-15}) |
| {C-003} | Active. "Project phải hỗ trợ tải deck về nhiều định dạng theo yêu cầu của đồ án" | Retired. Ghi chú thêm: "Retired 2026-10-03: danh sách định dạng tải về là lựa chọn của team ({D-031}), không phải giới hạn áp từ bên ngoài." Lý do 2 chuyển sang Ghi chú theo {BLK-038}. Bỏ quan hệ `constraints → C-003` ở {UC-008}, {R-020}, {R-025}, {R-026}, {R-027}, {R-028}, {R-039} ({GX-04}, {P4}). {D-026} đã đóng nên giữ quan hệ cũ |
| {A-023} | Open. "Hai định dạng, một sửa được và một chỉ xem, cho phép V1 chứng minh việc tải về từ đầu tới cuối…" | Retired. Ghi chú thêm: "Retired 2026-10-03: V1 tải về 4 định dạng ({D-031}); giả định về 2 định dạng không còn làm chỗ dựa." Bỏ `assumptions → A-023` ở {R-020}, {R-025}, {R-026}, {R-027}, {R-028}. {D-016}, {D-026} đã đóng nên giữ |
| {UC-008} | Title "Tải deck về máy dạng PPTX hoặc PDF". Mục tiêu "file PPTX hoặc PDF". Bước 2 "chọn PPTX hoặc PDF". Bước 6 "Người dùng nhận file". Postconditions 3 "File PPTX và PDF giữ facts…". Câu hỏi mở 1 về ứng dụng kiểm chứng PPTX. Ghi chú 1 "V1 chỉ có hai định dạng PPTX và PDF". `constraints`: C-002, C-003, C-004 | Title "Tải deck về máy dạng PPTX, PDF, PNG hoặc SVG". Mục tiêu "file theo định dạng đã chọn". Bước 2 "chọn một trong 4 định dạng của {D-031}". Bước 6 "Người dùng nhận file; với PNG và SVG là một file .zip". Postconditions 3 "File tải về giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck ({R-025})". Postconditions 4 giữ ("sửa được trong PowerPoint", {Q2}). Bỏ Câu hỏi mở 1 ({Q2}). Ghi chú 1 "V1 có 4 định dạng tải về ({D-031}); đẩy deck lên Google Drive thuộc release Later ({R-058})". Bỏ `constraints: C-003` |
| {R-020} | `source` có D-026; `assumptions` A-023; `constraints` C-003 | Bỏ quan hệ tới {C-003}, {A-023}. `source` giữ D-026 (tham chiếu được trỏ tới item đã đóng), thêm D-031. Câu Yêu cầu không đổi theo Q1 (vế 2 bỏ theo {BLK-019}) |
| {R-025} | Tên "Nhất quán nội dung giữa PPTX và PDF". Acceptance 1 "File PPTX và PDF của cùng một bản đã chấp nhận…" | Tên "Nhất quán nội dung giữa các định dạng tải về". Acceptance 1: các file tải về ở 4 định dạng của {D-031}, từ cùng một bản người dùng đang xem trước, giữ cùng facts, số liệu, thứ tự và ý nghĩa, theo {BR-007}. Giữ Active. Thêm D-031 vào `source` |
| {R-026} | "…khi định dạng tải về không giữ được một phần deck". Ghi chú "Chấp nhận khác biệt giữa PPTX và PDF nếu dự đoán được" | Proposed ({P2}). Danh sách phần bị mất hoặc đổi ghi "Chưa chốt" cho từng định dạng PPTX, PDF, PNG, SVG. Ghi chú: "Chấp nhận khác biệt giữa các định dạng của {D-031} khi đã báo người dùng" |
| {R-027} | "DeckAgent phải tạo file PPTX và PDF hợp lệ, mở và dùng được trong môi trường đích." Acceptance 2 "Cam kết tương thích với từng ứng dụng cụ thể chưa được chốt" | Yêu cầu: "DeckAgent phải tạo file tải về hợp lệ ở mỗi định dạng của D-031." Acceptance riêng từng định dạng: (1) file PPTX mở và sửa được chữ, hình khối và bảng trong Microsoft PowerPoint ({Q2}); (2) file PDF mở được bằng trình xem PDF; (3) file .zip PNG chứa mỗi slide một ảnh PNG kích thước 1920×1080 px `[tạm 2026-10-03 · xem lại: buổi thử người dùng đầu tiên có người mở file PNG tải về]`, mỗi ảnh mở được bằng trình duyệt; (4) file .zip SVG chứa mỗi slide một ảnh SVG, mỗi ảnh mở được bằng trình duyệt. Bỏ Acceptance 2 cũ. Giữ Active |
| {R-028} | "…khớp với file người dùng sẽ tải về, trong giới hạn của định dạng." Acceptance "…bản xem trước đã chấp nhận và file PPTX/PDF…" | Proposed ({P2}). "bản người dùng đang xem trước" ({BLK-023}); so với file của cả 4 định dạng; danh sách khác biệt cho phép ghi "Chưa chốt" |
| {R-039} | Bối cảnh "Yêu cầu đồ án khuyến khích hỗ trợ nhiều định dạng (C-003)." | Bối cảnh: "Danh sách định dạng tải về là lựa chọn của team ({D-031}) và đã mở rộng một lần, từ 2 lên 4 định dạng." Bỏ `constraints: C-003` |
| {BR-006} | Exceptions "Định dạng đích được làm mất phần nó không thể hiện được, nếu…(BR-013)" | Viết theo {BLK-002}; áp cho cả 4 định dạng. Không có chữ riêng của Q1 |
| {BR-007} | "Khi cùng một deck được tải về nhiều định dạng…" | Thêm ID: "…nhiều định dạng ({D-031})…". Phạm vi nhất quán áp cho cả 4 định dạng |
| {C-004} | Review Trigger "Review khi danh sách định dạng tải về hoặc khả năng của chúng thay đổi." | Thêm ID: "…danh sách định dạng tải về ({D-031})…" |
| {A-016} | Review Trigger "Yêu cầu đồ án, kỳ vọng người dùng hoặc một định dạng cụ thể đòi hỏi độ giống hình ảnh cao hơn…". Ghi chú 2 "V1 không yêu cầu PPTX và PDF giống nhau từng pixel" | Ghi chú 2 bỏ ({BLK-039}, {D-009} sở hữu). Vế chuyển sang Ghi chú theo {BLK-065} bỏ "Yêu cầu đồ án" vì {C-003} đã Retired: "Xem lại phạm vi khi kỳ vọng người dùng hoặc một định dạng tải về của {D-031} đòi hỏi độ giống hình ảnh cao hơn độ giống ý nghĩa, hoặc một định dạng cần contract riêng." |
| {A-022} | Ghi chú 1 "D-026 giữ PPTX là định dạng sửa được nhưng chưa chốt mức tương thích với từng ứng dụng" | Ghi chú: "PPTX là định dạng sửa được của V1 ({D-031}); ứng dụng kiểm chứng là Microsoft PowerPoint ({R-027})." ({Q2}) |
| {GL-017} | "Xuất deck thành file PPTX hoặc PDF để dùng ngoài DeckAgent." | "Xuất deck thành file theo một định dạng của {D-031} (PPTX, PDF, PNG, SVG) để dùng ngoài DeckAgent." |
| {D-009} | Reopen When "… hoặc yêu cầu đồ án thay đổi." | Reopen When: "Khi một định dạng hoặc use case cụ thể cần độ giống hình ảnh hoặc hành vi cao hơn, hoặc danh sách định dạng tải về của {D-031} thay đổi." (trả lời {CX-3}) |
| {UC-015} | Postconditions 1 "…khớp với file tải về, trong giới hạn của định dạng ({R-028})" | Không đổi chữ. {R-028} nay ở Proposed, nên danh sách khác biệt mà Postconditions này dựa vào còn "Chưa chốt" (ghi ở mục 3) |
| {R-058} (mới) | Không có | Requirement Later, Proposed: đẩy deck lên Google Drive dạng Google Slides. Câu hỏi mở theo Q1. Chi tiết ở mục 4 |
| {A-029}, {UC-011}, {UC-012}, {UC-017}, {R-049} | Nhắc "tải về PPTX" để giữ deck hoặc dùng lại deck | Không đổi: PPTX vẫn thuộc V1 |
| {UC-009} | Câu hỏi mở "Đăng nhập bằng … tài khoản Google?" | Không đổi. Liên quan việc đăng nhập Google của {R-058} (Later) |

## 3. Kiểm mâu thuẫn khi áp nhiều chính sách cho cùng item

| Item | Chính sách áp vào | Kết quả |
|---|---|---|
| {R-026} | {P2} (Proposed, danh sách "Chưa chốt"), {Q1} (4 định dạng), {P5} (bỏ vế trùng), {P6} (bắt buộc báo người dùng) | Không mâu thuẫn. {Q1} không đòi {R-026} ở Active; danh sách của cả 4 định dạng cùng "Chưa chốt". Ví dụ trong đề bài không thành mâu thuẫn |
| {R-028} | {P2}, {Q1}, {P6} | Không mâu thuẫn, cùng lý do như {R-026} |
| {R-025} | {P2} (trỏ {BR-007}, giữ Active), {Q1} (4 định dạng), {P6}, {P3} ({BR-007} sở hữu quy tắc) | Không mâu thuẫn |
| {R-027} | {Q1} (Acceptance từng định dạng, ảnh PNG), {Q2} (PowerPoint), {P4} (bỏ {A-005}) | Không mâu thuẫn |
| Ảnh PNG 1920×1080 | {P0} cấm ngưỡng tạm cho sự thật bên ngoài, lấy {Q1} làm ví dụ; đề bài Pha B đặt ngưỡng tạm cho ảnh PNG | Không mâu thuẫn: quyết định cuối của {Q1} xác định danh sách định dạng là lựa chọn của team, không còn là sự thật bên ngoài |
| {R-030} | {P1a} (2 giây), {P5} (tách), {P7} ("phải") | Không mâu thuẫn: 2 giây thuộc {R-030}; danh sách lỗi thường gặp thuộc {R-057} |
| {D-030} | {P1d} (Reopen When), {P3} {BLK-034} (rút về tối đa 3 vế), {P3} {BLK-041} (Decision giữ nguyên) | Mâu thuẫn bề ngoài, đã giải: {BLK-041} giữ Decision nguyên vì Requirement sở hữu phần trùng, nhưng phần trùng của {R-024} và {R-031} với {D-030} đã chuyển về {BR-010} theo {BLK-033}. {BLK-034} nêu đích danh {D-030}, nên áp {BLK-034}. Câu Decision 7 câu hiện tại cũng trượt {GD-01} |
| {D-007}, {D-009}, {D-024}, {D-025}, {D-027}, {D-029} | {BLK-034} (Decision giữ lựa chọn và tóm tắt kèm ID rule), {BLK-041} (không viết lại Decision) | Đã giải: giữ nguyên chữ câu Decision, chỉ thêm ID rule trong ngoặc. Đạt cả hai |
| {D-009} | {P1d} (Reopen When "{C-003} thay đổi"), {Q1} ({C-003} Retired) | Mâu thuẫn, đã giải theo trả lời {CX-3}: vế mới trỏ {D-031} |
| {BR-005} | {P3} {BLK-033}, {BLK-035} (rút về tóm tắt kèm ID {BR-010}), ngoại lệ của {P3} (không tự xóa) | Không còn nội dung riêng; đã giải theo trả lời {CX-1}: xóa {BR-005}, chuyển quan hệ sang {BR-010} |
| Ngưỡng tạm của {P1} | {P0} (nhãn phải có ngày và sự kiện xem lại) | `DECISIONS.md` chỉ cho sự kiện xem lại của {P1b}; đã giải theo trả lời {CX-2}: bảng sự kiện ở mục 7 |
| {UC-008} | {Q1}, {Q2}, {P6} ({BLK-051}, {BLK-048}), {P4} (bỏ {C-003}) | Không mâu thuẫn |
| {ACT-002} | {P1a} (trỏ {R-032}), {P6} {BLK-021} (thêm "hỏi lại người dùng"), {BLK-037}, {BLK-047} | Không mâu thuẫn. Section `Needs / Pain Points` trống sau khi Needs 1 chuyển sang `Hành vi lỗi` và Needs 2 bị bỏ: giữ heading, thân "điền sau" như Pha A đã ghi |
| {R-042} | {P2} {BLK-060} (một luồng được phép), {Q1} (luồng Google ở Later) | Không mâu thuẫn: luồng Google chỉ thêm khi {R-058} vào release, theo câu hỏi mở của {R-058} |
| {UC-015}, {UC-008} nhánh 3A | {P2} hạ {R-028}, {R-026} xuống Proposed; hai Use Case giữ Active | Không mâu thuẫn theo {GX-04} vì Proposed còn hiệu lực. Lưu ý: điều kiện "định dạng không giữ được một phần deck" vẫn tạo lại được trong test bằng deck có thành phần mà định dạng không thể hiện |
| {R-010} → Draft | {GX-04} | Không item Active nào dựa vào {R-010} |
| Thuật ngữ "deck dùng được" | {P1c} (dùng thuật ngữ thay cách nói định tính), {GX-08} (Lint cảnh báo "dùng được") | Không chặn: {GX-08} là Lint. Ghi vào việc của validator: bỏ qua cụm là thuật ngữ trong glossary |

## 4. ID mới

Thứ tự cấp số: {P5} trước, {Q1} sau. Mỗi ID tiếp số sau ID lớn nhất của loại đó trong sheet (R-054, D-030). Không dùng lại ID đã nghỉ.

| ID | Từ đâu | Tên ngắn | Status / scope | Field và quan hệ |
|---|---|---|---|---|
| {R-055} | Tách từ {R-014} ({P5}) | Thay hình ảnh trong slide | Proposed / Later | `type: Functional`, `verification: test`, `area: [Editing, Core]`; `source: [R-014, DOC-001, D-015]`; `use_cases: [UC-024]`; `depends_on: [R-006]` (chép từ {R-014}) |
| {R-056} | Tách từ {R-018} ({P5}) | Tìm hình minh họa có sẵn | Proposed / Later | `type: Functional`, `verification: test`, `area: [Assets, AI, Data]`; `source: [R-018, DOC-001, D-025]` (L-002 thay bằng D-025 theo {BLK-062}); `use_cases: [UC-024]`; `depends_on: [R-006]`; câu thoát theo {BLK-014} |
| {R-057} | Tách từ {R-030} ({P5}) | Thông báo lỗi kèm bước làm tiếp theo | Active / V1 | `type: Quality`, `verification: test`, `area: [Web, AI, Reliability]`; `source: [R-030, DOC-001]`; `use_cases: [UC-001, UC-002, UC-004, UC-014]`; `business_rules: [BR-013]` (chuyển từ {R-030}); dùng "phải" ({P7}); danh sách lỗi thường gặp của {P1a} |
| {D-031} | {Q1} | Bốn định dạng tải về của V1 | Active | `date: 2026-10-03`, `decided_by: Duy` (người ghi các Decision khác trong sheet); `source: [D-026, Benchmark Napkin AI 2026-10-03]`; `addresses: [R-020, R-025, R-026, R-027, R-028]` và `shapes: [BR-006, BR-013, R-058]` (chép quan hệ của {D-026}, thêm {R-058}); `assumptions: [A-022]`; `documents: []`. `documents` để trống, ghi vào `_FILL_LATER.md`: "Lưu ảnh chụp hoặc ghi chú benchmark Napkin AI thành tài liệu có DOC-ID, rồi trỏ D-031 tới đó." Reopen When theo mục 7 |
| {R-058} | {Q1} | Đẩy deck lên Google Drive | Proposed / Later | `type: Functional`, `verification: test`, `inputs: false`, `area: [Export]`; `source: [D-031]`; `use_cases: [UC-008]`. Câu hỏi mở: khi đưa vào release, phải mở lại {D-027} và thêm luồng Google vào {R-042} |

Phần còn lại của item gốc sau khi tách: {R-014} giữ thêm, xóa, nhân bản, sắp xếp slide; {R-018} giữ tạo hình mới; {R-030} giữ hiển thị tiến độ, bỏ `business_rules: [BR-013]` (chuyển sang {R-057}).

## 5. Danh sách xóa cuối cùng

| ID | Lý do | Nguồn quyết định |
|---|---|---|
| {A-001} | Giả định về cách team làm việc (Sprint 1) | Pha A, quyết định 2 |
| {A-002} | Giả định về development flow của team | Pha A, quyết định 2 |
| {A-003} | Giả định về GitHub của team | Pha A, quyết định 2 |
| {A-004} | Giả định về Architecture hiện tại của team | Pha A, quyết định 2 |
| {A-005} | Giả định về cách team test | Pha A, quyết định 2; {P4} {BLK-029} |
| {A-006} | Giả định về Skill của Agent | Pha A, quyết định 2 |
| {D-001} | Phạm vi Sprint 1 | Pha A, quyết định 2 |
| {D-002} | Chọn GitHub | Pha A, quyết định 2 |
| {D-003} | Quy trình PR | Pha A, quyết định 2 |
| {D-004} | Cách ràng buộc Agent | Pha A, quyết định 2 |
| {D-005} | Yêu cầu với tài liệu Architecture | Pha A, quyết định 2 |
| {D-018} | Cách tổ chức delivery | Pha A, quyết định 2 |
| {D-023} | Điểm dừng Sprint 2 | Pha A, quyết định 2 |
| {C-006} | Quy tắc quy trình, thay bằng ngưỡng tạm | {P0}, {P4} {BLK-030} |
| {C-007} | Quy tắc quy trình, thay bằng ngưỡng tạm | {P0}, {P4} {BLK-030} |
| {D-011} | Quy tắc quy trình, thay bằng ngưỡng tạm | {P0}, {P4} {BLK-030} |
| {D-010} | Meta về cách phân loại item trong spec | {P4} {BLK-031} |
| {D-028} | Quy trình research; danh sách 4 lỗi chuyển sang {R-021} | {P4} {BLK-032} |
| {R-041} | Nội dung thuộc {D-015} | {P5} {BLK-020} |
| {BR-005} | Không còn nội dung riêng sau khi {BR-010} sở hữu vòng đời bản deck | {P3}, trả lời {CX-1} |
| {GL-025} | Thuật ngữ vận hành dự án; glossary không giữ ID thuật ngữ nên không vào `_RETIRED_IDS.md` | Pha A, quyết định 2 |

Tổng: 20 ID item vào `_RETIRED_IDS.md`, cộng 1 thuật ngữ.

## 6. Quan hệ thay đổi so với `relations.json`

Bỏ:
1. Mọi quan hệ có nguồn hoặc đích là item trong mục 5.
2. `constraints → C-001` ở {R-014}, {R-015}, {R-029}, {D-006}, {D-015} ({BLK-025}).
3. `constraints → C-005` ở {R-003}, {R-004}, {R-005}, {R-010}, {R-017} ({BLK-026}).
4. `constraints → C-003` ở {UC-008}, {R-020}, {R-025}, {R-026}, {R-027}, {R-028}, {R-039} ({Q1}).
5. `assumptions → A-023` ở {R-020}, {R-025}, {R-026}, {R-027}, {R-028} ({Q1}).
6. `use_cases → UC-018` ở {R-042} ({BLK-028}).
7. `business_rules → BR-013` ở {R-030} (chuyển sang {R-057}).
8. Mã L-001, L-002, W-026 trong `source` ({BLK-062}).

Thêm:
1. `constraints: [C-002]` ở {D-015} ({BLK-020}).
2. `business_rules: [BR-010]` ở {R-011}, {R-024}, {R-046} ({BLK-033}).
3. `supporting_actors: [ACT-002]` ở {UC-007} ({BLK-022}).
4. `superseded_by: [D-031]` ở {D-026} ({Q1}).
5. Quan hệ của 5 ID mới (mục 4).
6. `source` thêm D-031 ở {R-020}, {R-025}, {R-026}, {R-027}, {R-028}, {R-039}, {UC-008} ({Q1}).

Theo trả lời {CX-1}: quan hệ trỏ tới {BR-005} chuyển sang {BR-010}: `business_rules` của {R-031} (đã có {BR-010}), {R-032}; `shapes` của {D-025}, {D-030} (đã có {BR-010}). Thêm {UC-014} vào `use_cases` của {BR-010}. Hai ghi chú của {BR-005} chuyển sang `Ghi chú` của {BR-010}.

`Requirement chính` của Decision vẫn ánh xạ sang `addresses` như quyết định 4 của Pha A; bảng cần duyệt nằm ở `PLAN.md` mục 6.

## 7. Trả lời của người dùng cho 3 điểm cần xem (2026-10-05)

1. {CX-1}: xóa {BR-005}, đưa vào danh sách ID đã nghỉ; chuyển mọi quan hệ đang trỏ tới {BR-005} sang {BR-010}; thêm {UC-014} vào `use_cases` của {BR-010}; chuyển hai ghi chú của {BR-005} sang `Ghi chú` của {BR-010}.
2. {CX-2}: dùng bảng sự kiện xem lại dưới đây. Ngày đặt mọi ngưỡng tạm là 2026-10-03. Nhãn: `[tạm 2026-10-03 · xem lại: <sự kiện>]`.
3. {CX-3}: Reopen When của {D-009} dùng vế "…, hoặc danh sách định dạng tải về của {D-031} thay đổi."
4. Bổ sung cho {D-031}:
   - `source: [D-026, Benchmark Napkin AI 2026-10-03]`. Chuỗi `Benchmark Napkin AI 2026-10-03` là mã nguồn: hộp thoại Export All Slides của Napkin AI gồm PowerPoint, Google Slides, PDF, PNGs, SVGs. Không tạo tài liệu benchmark.
   - Reopen When: "Buổi thử người dùng đầu tiên với ≥ 5 người thuộc nhóm {ACT-001} cho thấy ≥ 2/5 người cần một định dạng ngoài danh sách, hoặc {R-058} được đưa vào release V1." Hai con số trong câu này là ngưỡng tạm của quy trình kiểm chứng chung, nên mang nhãn của nhóm đó.
   - `documents` để trống. `_FILL_LATER.md` ghi: "Lưu ảnh chụp hoặc ghi chú benchmark Napkin AI thành tài liệu có DOC-ID, rồi trỏ D-031 tới đó."
5. Mọi mục trong phần "Kết quả B2 để bạn duyệt cùng" của báo cáo cần xem: người dùng đồng ý.

### Sự kiện xem lại của ngưỡng tạm

| Nhóm ngưỡng | Item chứa ngưỡng | Ngưỡng tạm | Sự kiện xem lại |
|---|---|---|---|
| Thời gian của lượt xử lý AI | {R-032}, {R-030} | 180 giây lượt tạo, 120 giây lượt sửa; thử lại tối đa 1 lần; 2 giây | lần chạy đầu tiên của bộ đánh giá chung (60 lượt) có số đo thời gian lượt tạo và lượt sửa |
| Giới hạn đầu vào | {R-003} | 20 MB; 50 trang; 50 slide; 100.000 ký tự | lần benchmark đầu tiên với tài liệu thật |
| Bộ đánh giá chung và ngưỡng chất lượng | {R-007}, {R-009}, {R-021} | 10 tài liệu mẫu, 10 yêu cầu, 3 lần chạy; ≥ 90%; ≤ 1%; ≥ 80% đạt ≥ 2 điểm | lần chạy đầu tiên của bộ đánh giá chung (60 lượt) |
| Buổi thử không cần trợ giúp | {R-029} | 5 người; ≥ 4/5; ≤ 15 phút | buổi thử đầu tiên với 5 người không chuyên thiết kế |
| Quy trình kiểm chứng chung | 15 Assumption của {P1d}; Reopen When của {D-006}, {D-014}, {D-017}, {D-025}, {D-030}, {D-031} | ≥ 5 người; Invalidated ≥ 2/5; Supported ≤ 1/5 | buổi thử người dùng đầu tiên với ≥ 5 người thuộc nhóm {ACT-001} |
| Benchmark độ khó | {A-018} | ≥ 2 lần | lần chạy đầu tiên của bộ đánh giá chung (60 lượt) |
| Gán nhãn loại yêu cầu sửa | {A-019} | 30 yêu cầu; ≥ 80% | lần gán nhãn đầu tiên cho 30 yêu cầu sửa |
| Kích thước ảnh PNG | {R-027} | 1920×1080 px | buổi thử người dùng đầu tiên có người mở file PNG tải về |
