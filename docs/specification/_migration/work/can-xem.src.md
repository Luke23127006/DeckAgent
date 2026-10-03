# Pha B dừng ở bước B2: 3 điểm cần bạn quyết định

## Bối cảnh

Pha B chuyển spec của DeckAgent từ Google Sheet cũ sang file Markdown trong `docs/specification/`, theo các quyết định bạn đã ghi ở `DECISIONS.md` (10 chính sách {P0} tới {P9} và 3 câu hỏi lẻ {Q1}, {Q2}, {Q3}).

Đã xong và đã commit trên branch `spec/migrate-sheet` (chưa push):
1. B0: chuẩn bị, ghi tiến độ.
2. B1: sửa bộ tiêu chí để chấp nhận ngưỡng tạm ({P0}); thêm thuật ngữ "deck dùng được" vào glossary ({P1c}); sửa quy ước đọc glossary ({P9}).
3. B2: điền ô Quyết định cho cả 69 blocker; áp {Q1} lên từng item; kiểm mâu thuẫn; lập danh sách ID mới và danh sách xóa.

B2 gặp 3 điểm không áp rõ được từ `DECISIONS.md`. Theo quy trình đã thống nhất, Pha B dừng ở đây. **Chưa có file item nào được sinh ra.**

**Cách trả lời:** với mỗi điểm, ghi một dòng, ví dụ "{CX-1}: xóa", "{CX-2}: đồng ý bảng đề xuất", "{CX-3}: thay bằng Decision định dạng mới". Nếu bạn sửa nội dung, ghi nội dung mới.

## {CX-1}

**Vấn đề.** {P3} giao toàn bộ vòng đời bản deck (khi nào một bản được chấp nhận, khôi phục khi lỗi, dừng, bỏ) cho {BR-010}, dưới dạng một bảng chuyển trạng thái. Theo {BLK-033} và {BLK-035}, {BR-005} phải rút về một câu tóm tắt kèm ID của {BR-010}.

Sau khi rút gọn, {BR-005} không còn quy tắc nào của riêng nó:
1. Câu Rule hiện tại: "Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, hệ thống phải giữ hoặc khôi phục bản đã chấp nhận gần nhất." Mọi trường hợp trong câu này đều là một dòng trong bảng chuyển trạng thái của {BR-010}.
2. Phần còn lại chỉ là ghi chú: "cách khôi phục có thể khác nhau theo loại lượt xử lý, không bắt buộc snapshot hay diff" và "không yêu cầu Undo nhiều bước".

`DECISIONS.md` ({P3}, mục Ngoại lệ) yêu cầu đánh dấu CẦN XEM trong trường hợp này, không tự xóa.

**Đang có quan hệ trỏ tới {BR-005}:**
1. Áp lên 6 Use Case: {UC-001}, {UC-002}, {UC-004}, {UC-008}, {UC-013}, {UC-014}.
2. {R-031} và {R-032} ghi {BR-005} trong `business_rules`.
3. {D-025} và {D-030} ghi {BR-005} trong `shapes`.

**Phương án**
- **Xóa {BR-005}** và đưa ID vào danh sách ID đã nghỉ. Chuyển mọi quan hệ ở trên sang {BR-010}. {BR-010} hiện chưa áp lên {UC-014}, nên thêm {UC-014} vào `use_cases` của {BR-010}. Hai ghi chú chuyển sang `Ghi chú` của {BR-010}. Ưu: mỗi quy tắc có đúng một nơi sở hữu ({GX-10}). Nhược: thêm một ID đã nghỉ; mất tên ngắn "luôn giữ được bản dùng được gần nhất" như một cam kết dễ nhớ.
- **Giữ {BR-005} ở Active dưới dạng tóm tắt.** Rule viết thành: "Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, bản đã chấp nhận gần nhất được giữ theo bảng chuyển trạng thái của {BR-010}." Quan hệ giữ nguyên. Ưu: không đổi ID; Use Case vẫn trỏ được tới một cam kết ngắn trong `Bảo đảm tối thiểu`. Nhược: một Business Rule không có nội dung riêng; ai sửa {BR-010} phải nhớ xem lại {BR-005}.

**Đề xuất:** xóa {BR-005}. Lý do: {P3} đã chọn {BR-010} làm nơi sở hữu duy nhất của vòng đời bản deck, và `Bảo đảm tối thiểu` của Use Case được phép tham chiếu thẳng {BR-010}.

## {CX-2}

**Vấn đề.** {P0} quy định mọi ngưỡng tạm phải có nhãn `[tạm <ngày> · xem lại: <sự kiện quan sát được>]`. Thiếu sự kiện xem lại thì con số bị coi là chưa chốt, và item Active chứa con số đó trượt {GX-09}.

`DECISIONS.md` chỉ ghi sự kiện xem lại cho giới hạn đầu vào ({P1b}: "lần benchmark đầu tiên với tài liệu thật"). Các ngưỡng tạm khác chưa có sự kiện xem lại. Ngày đặt ngưỡng dùng 2026-10-03, ngày bạn điền `DECISIONS.md`.

**Đề xuất sự kiện xem lại cho từng nhóm ngưỡng:**

| Nhóm ngưỡng | Item chứa ngưỡng | Ngưỡng tạm | Sự kiện xem lại đề xuất |
|---|---|---|---|
| Thời gian của lượt xử lý AI | {R-032}, {R-030} | quá thời gian 180 giây cho lượt tạo, 120 giây cho lượt sửa; thử lại tối đa 1 lần; hiển thị bước đang chạy khi lượt chạy quá 2 giây | lần chạy đầu tiên của bộ đánh giá chung (60 lượt) có số đo thời gian lượt tạo và lượt sửa |
| Giới hạn đầu vào | {R-003} | 20 MB; 50 trang; 50 slide; 100.000 ký tự | lần benchmark đầu tiên với tài liệu thật (đã có trong `DECISIONS.md`, không cần trả lời) |
| Bộ đánh giá chung và ngưỡng chất lượng | {R-007}, {R-009}, {R-021} | 10 tài liệu mẫu, 10 yêu cầu, 3 lần chạy; ≥ 90% lượt; ≤ 1% số liệu sai; ≥ 80% lượt đạt ≥ 2 điểm | lần chạy đầu tiên của bộ đánh giá chung (60 lượt) |
| Buổi thử không cần trợ giúp | {R-029} | 5 người; ≥ 4/5 người hoàn thành; ≤ 15 phút | buổi thử đầu tiên với 5 người không chuyên thiết kế |
| Quy trình kiểm chứng chung của Assumption và Reopen When | 15 Assumption của {P1d}; Reopen When của {D-006}, {D-014}, {D-017}, {D-025}, {D-030} | ≥ 5 người; Invalidated khi ≥ 2/5; Supported khi ≤ 1/5 | buổi thử người dùng đầu tiên với ≥ 5 người thuộc nhóm {ACT-001} |
| Benchmark độ khó của lượt xử lý | {A-018} | nhóm khó gấp ≥ 2 lần nhóm dễ | lần chạy đầu tiên của bộ đánh giá chung |
| Gán nhãn loại yêu cầu sửa | {A-019} | 30 yêu cầu; đồng thuận ≥ 80% | lần gán nhãn đầu tiên cho 30 yêu cầu sửa |
| Kích thước ảnh PNG khi tải về | {R-027} | 1920×1080 px mỗi slide | buổi thử người dùng đầu tiên có người mở file PNG tải về |

**Phương án**
- **Dùng bảng đề xuất trên.**
- **Dùng một sự kiện chung cho mọi ngưỡng**, ví dụ "kết thúc V1". Gọn hơn, nhưng mọi ngưỡng chỉ được xem lại một lần, ở cuối.
- **Bạn sửa từng dòng.**

**Đề xuất:** dùng bảng đề xuất. Mỗi sự kiện là lần đầu tiên có dữ liệu thật cho đúng con số đó, nên con số được xem lại sớm nhất có thể.

## {CX-3}

**Vấn đề.** Hai quyết định cho kết quả trái nhau ở cùng một chỗ:
1. {P1d} sửa Reopen When của {D-009}: đổi vế "yêu cầu đồ án thay đổi" thành "{C-003} thay đổi".
2. {Q1} chuyển {C-003} sang Retired, vì danh sách định dạng nay là lựa chọn của team, không còn là giới hạn áp từ bên ngoài.

Một Constraint đã Retired không còn "thay đổi" được nữa, nên vế mới của Reopen When không bao giờ xảy ra.

Reopen When hiện tại của {D-009}: "Khi một định dạng hoặc use case cụ thể cần độ giống hình ảnh hoặc hành vi cao hơn, hoặc yêu cầu đồ án thay đổi."

**Phương án**
- **Thay bằng Decision định dạng mới:** "…, hoặc danh sách định dạng tải về của {D-031} thay đổi." {D-031} là Decision mới tạo theo {Q1}, sở hữu danh sách 4 định dạng.
- **Bỏ vế đó:** Reopen When chỉ còn "Khi một định dạng hoặc use case cụ thể cần độ giống hình ảnh hoặc hành vi cao hơn."
- **Giữ "{C-003} thay đổi"** như {P1d} ghi. Vế này không bao giờ xảy ra.

**Đề xuất:** thay bằng Decision định dạng mới. Khi danh sách định dạng đổi (ví dụ thêm Google Slides), đó đúng là lúc cần xem lại việc ưu tiên ý nghĩa hơn độ giống pixel.

## Kết quả B2 để bạn duyệt cùng

Phần này không cần trả lời nếu bạn đồng ý. Chi tiết nằm ở `docs/specification/_migration/APPLY.md` và ô Quyết định trong `docs/specification/_migration/BLOCKERS.md`.

### Status thay đổi so với sheet

1. {R-026}: Active → Proposed ({P2}).
2. {R-028}: Active → Proposed ({P2}).
3. {R-010}: Proposed → Draft ({P2}).
4. {C-003}: Active → Retired ({Q1}).
5. {D-026}: Active → Superseded, thay bằng {D-031} ({Q1}).
6. {A-023}: Open → Retired. Đây là giả định chỉ đúng khi V1 có 2 định dạng, nên chuyển theo {Q1}.

### ID mới, theo thứ tự cấp số

1. {R-055}: Proposed, release Later.
2. {R-056}: Proposed, release Later.
3. {R-057}: Active, V1.
4. {D-031}: Active.
5. {R-058}: Proposed, release Later.

### Danh sách xóa cuối cùng: 19 ID item và 1 thuật ngữ

1. Item vận hành dự án (từ Pha A): {A-001}, {A-002}, {A-003}, {A-004}, {A-005}, {A-006}, {D-001}, {D-002}, {D-003}, {D-004}, {D-005}, {D-018}, {D-023}.
2. Theo {P4}: {C-006}, {C-007}, {D-011}, {D-010}, {D-028}.
3. Theo {P5}: {R-041}.
4. Thuật ngữ: {GL-025}. Glossary không giữ ID thuật ngữ, nên dòng này không vào danh sách ID đã nghỉ.

{BR-005} thành ID thứ 20 nếu {CX-1} chọn xóa.

### Thay đổi chính theo {Q1}

1. {D-031} sở hữu danh sách 4 định dạng của V1 (PPTX, PDF, PNG, SVG) và việc đẩy deck lên Google Drive ở release Later. Context ghi "advisor khuyến khích thêm định dạng"; Rationale ghi "lấy theo benchmark Napkin AI".
2. {R-027} có Acceptance riêng cho từng định dạng:
   - PPTX mở và sửa được chữ, hình khối và bảng trong Microsoft PowerPoint ({Q2});
   - PDF mở được bằng trình xem PDF;
   - PNG và SVG: một file .zip, mỗi slide một ảnh, mỗi ảnh mở được bằng trình duyệt;
   - ảnh PNG 1920×1080 px, ngưỡng tạm.
3. {R-025} và {BR-007}: phạm vi nhất quán áp cho cả 4 định dạng.
4. {R-026} và {R-028}: danh sách phần bị mất hoặc đổi ghi "Chưa chốt" cho cả 4 định dạng.
5. {UC-008} đổi tên, bước chọn định dạng, bước nhận file (.zip cho PNG và SVG), Postconditions và Ghi chú. Câu hỏi mở về ứng dụng kiểm chứng bị bỏ ({Q2}).
6. {A-016}, {A-022}, {R-039}, {C-004}, {GL-017} sửa câu cho khớp 4 định dạng.
7. Bỏ quan hệ tới {C-003} ở 7 item và quan hệ tới {A-023} ở 5 item, vì item Active không được dựa vào item đã đóng ({GX-04}).

### Mâu thuẫn bề ngoài, đã tự giải

1. **{R-026}.** Đề bài nêu ví dụ: {P2} hạ {R-026} xuống Proposed, còn {Q1} cần {R-026} cho 4 định dạng. Hai việc không trái nhau. {Q1} không đòi {R-026} ở Active, và danh sách của cả 4 định dạng cùng ghi "Chưa chốt".
2. **{D-030}.** {BLK-034} rút câu Decision từ 7 câu về tối đa 3 vế, còn {BLK-041} nói "giữ nguyên Decision". {BLK-041} giữ Decision nguyên vì Requirement đã sở hữu phần trùng. Nhưng phần trùng của {R-024} và {R-031} với {D-030} đã chuyển về {BR-010} theo {BLK-033}, còn {BLK-034} nêu đích danh {D-030}. Vì vậy tôi áp {BLK-034}. Câu Decision 7 câu hiện tại cũng trượt {GD-01}.
3. **{D-007}, {D-009}, {D-024}, {D-025}, {D-027}, {D-029}.** {BLK-034} muốn Decision "giữ lựa chọn và tóm tắt kèm ID rule", còn {BLK-041} muốn "không viết lại Decision". Tôi giữ nguyên chữ câu Decision và chỉ thêm ID rule trong ngoặc, nên đạt cả hai.
4. **Ảnh PNG.** {P0} cấm ngưỡng tạm cho sự thật bên ngoài và lấy {Q1} làm ví dụ. Nhưng quyết định cuối của {Q1} xác định danh sách định dạng là lựa chọn của team, nên đặt ngưỡng tạm cho ảnh PNG không trái {P0}.

### Chỗ tôi tự chọn khi `DECISIONS.md` không nói

1. **{D-031}:**
   - status Active, ngày 2026-10-03;
   - `decided_by: Duy`, theo người ghi các Decision khác trong sheet;
   - quan hệ chép từ {D-026} và thêm {R-058};
   - để trống `documents` và Reopen When, ghi vào danh sách điền sau, vì repo chưa có tài liệu benchmark Napkin AI.
2. **{R-058}:** `type: Functional`, trỏ Use Case {UC-008}, `source` là {D-031}.
3. **Kích thước ảnh PNG** đặt trong {R-027}, vì đây là điều kiện để file PNG hợp lệ.
4. **{A-018} và {A-019}:** `DECISIONS.md` chỉ cho ngưỡng Supported. Tôi đặt Invalidated là đủ mẫu mà không đạt ngưỡng Supported.
5. **Trigger mới của {UC-008}** ({BLK-051}): "Người dùng mở xem trước deck hiện tại." Bạn duyệt câu này trong diff ở B4.
6. **{R-057}** nhận quan hệ tới {BR-013} từ {R-030}, vì quy tắc "báo giới hạn thay vì bỏ qua âm thầm" thuộc phần thông báo lỗi.
