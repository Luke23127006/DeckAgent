# Kiểm không đổi nghĩa: constraints

- Item đã kiểm: 5 (C-001, C-002, C-003, C-004, C-005). C-006, C-007 đã xóa theo BLK-030 (`APPLY.md` mục 5), không có file.
- Chỗ bị đánh dấu: 3 (cao: 0, thấp: 3)

| # | ID | Section | Ô sheet (trích) | Câu mới (trích) | Vấn đề | Mức | Đề xuất sửa |
|---|---|---|---|---|---|---|---|
| 1 | C-002 | Review Trigger | "Review nếu nguồn lực, thời gian hoặc phạm vi đồ án thay đổi **rõ rệt**." | "Nguồn lực, thời gian hoặc phạm vi của đồ án thay đổi." | đổi nghĩa: bỏ "rõ rệt" làm điều kiện review rộng hơn (mọi thay đổi, kể cả nhỏ, đều kích hoạt). Log dựa vào GC-06, GX-08 và PLAN.md mục 4; đó là tiêu chí và kế hoạch, không phải quyết định ở nguồn được phép. Review Trigger không phải hành vi, phạm vi hay tiêu chí đạt nên mức thấp | thấp | Giữ câu mới nếu người dùng xác nhận mọi thay đổi đều cần review (GX-08 cấm "rõ rệt" khi không có mốc). Nếu không, ghi lại mốc cụ thể do người dùng nêu, ví dụ thay đổi số thành viên hoặc hạn nộp đồ án |
| 2 | C-001 | Ghi chú 3 | "…không phải giới hạn từ bên ngoài (OR-045); nội dung đã được ghi ở D-006 và D-015." | "…không phải giới hạn từ bên ngoài; nội dung đã được ghi ở D-006 và D-015." | thiếu ý: bỏ ID tham chiếu OR-045. P8 chỉ cho bỏ mã L-, W-; căn cứ bỏ OR-045 chỉ có ở PLAN.md (mục 7, bảng mã cũ), không thuộc nguồn được phép. Ý của OR-045 vẫn còn trong câu | thấp | Giữ, vì OR-045 là quy tắc không migrate và ý của nó đã nằm trong câu. Cần ghi một quyết định ở nguồn được phép (ví dụ mở rộng P8 cho mã OR-). Nếu không có quyết định đó, trả lại "(OR-045)" dạng text như BLK-063 làm với W-xxx |
| 3 | C-001, C-002, C-003, C-004, C-005 | (không có section) | Cột Impacts, ví dụ C-002: "Architecture, phạm vi, chia Work, chọn công nghệ, mức tự xây hạ tầng"; C-004: "Thiết kế phần tải về, acceptance criteria, Testing, định nghĩa độ trung thực" | Không có | thiếu ý: 5 ô Impacts bị bỏ. Log ghi "bảng ánh xạ của Pha A", tức PLAN.md (bảng cột: Constraints / Impacts / bỏ); DECISIONS, APPLY và BLOCKERS không có quyết định bỏ cột này | thấp | Giữ, vì template Constraint không có section tương ứng và ảnh hưởng được tính từ quan hệ (GX-05). Cần xác nhận việc bỏ cột Impacts ở nguồn được phép (APPLY.md hoặc DECISIONS.md), vì cột này cũng bị bỏ ở loại assumptions |

## Đã kiểm, không đánh dấu

1. C-001: thay "DeckAgent" bằng "hệ thống" (BLK-068), thêm backtick cho tên sản phẩm (BLK-069), đổi ngày sang `2026-09-27` (GX-18). Đây đều là sửa hình thức. Bỏ cột Related Requirements và Related Decisions theo BLK-025; D-006 và D-015 vẫn có trong Ghi chú 3.
2. C-002 Constraint: đổi "các hệ thống con quá lớn" thành "một hệ thống con thuộc danh sách đóng", và Lý do 2 thành danh sách đóng 5 mục. Có căn cứ ở ô Quyết định của BLK-003 (P2). Chữ "tự xây" có trong ô Quyết định. Ghi chú 2 của sheet chuyển sang Lý do 3; đây là chuyển chỗ và giữ nguyên chữ.
3. C-003: chuyển Retired và thêm Ghi chú 3 theo Q1 (`APPLY.md` mục 1, 2); câu thêm khớp từng chữ với APPLY. Lý do 2 của sheet chuyển thành Ghi chú 2 "V1 tải về PPTX và PDF (D-026)." đúng chữ ô Quyết định của BLK-038. "hard acceptance" đổi thành "điều kiện nghiệm thu bắt buộc" là dịch thuật ngữ, giữ nghĩa.
4. C-004: vế "Các định dạng tải về có khả năng khác nhau" bỏ khỏi câu Constraint, nhưng ý vẫn còn ở Lý do 1. Lý do 1 dùng "ví dụ" thay cho "và các định dạng khác", nên danh sách vẫn mở như ở sheet. Lý do 2 chuyển thành Ghi chú 2 đúng chữ BLK-038. Ghi chú 1 trỏ BR-007, khớp đủ 5 thứ trong Rule của BR-007 ở sheet (pixel, font, khả năng sửa, tương tác, animation; "cùng một deck"), hợp GX-10. Review Trigger thêm D-031 theo `APPLY.md` mục 2.
5. C-005: không đổi câu nào.
6. Field `short_name` lấy theo PLAN.md mục 4. Không có tên nào thêm ý ngoài sheet.

## Quan sát ngoài phạm vi đổi nghĩa

1. Phần "Không áp rõ" mục 4 của rewrite log nói các item Closed (C-001, C-003, C-005) "giữ heading, thân trống" cho `Cách kiểm tuân thủ`. Nhưng cả ba file hiện không có section này. Log cũng không có phần "Sửa của agent chính" để ghi lại việc xóa.
