# Rewrite log: use-cases (Pha B, bước B4)

Item đã viết (24): UC-001, UC-002, UC-003, UC-004, UC-005, UC-007, UC-008, UC-009, UC-010, UC-011, UC-012, UC-013, UC-014, UC-015, UC-016, UC-017, UC-018, UC-019, UC-020, UC-021, UC-022, UC-023, UC-024, UC-025.

## Quy ước áp chung

1. Tên sản phẩm và tính năng của bên khác viết trong backtick (BLK-069), ở mọi section của 24 item, ví dụ `Claude Design`, `Gamma Agent`, `Brand Kit`, `PowerPoint`, `Word`, `Excel`, `Google Slides`. Chỉ đổi định dạng, không đổi chữ; không ghi từng dòng ở bảng dưới.
2. Item Draft (UC-009, UC-010, UC-016, UC-018, UC-019, UC-020) chỉ qua gate cấu trúc: giữ nguyên câu sheet, kể cả "kết thúc UC", "sau đó", "tiếp tục bước", nhánh thiếu điểm kết thúc (PLAN.md mục 5, dịch thử UC-020). Chỉ đổi tiêu đề theo PLAN.md mục 4, "DeckAgent" → "Hệ thống" (BLK-068) và mã GL- ở UC-010.
3. UC-005 (Deprecated) chỉ dịch hình thức (GX-15): không đổi chữ, chỉ thêm backtick; xóa section `Câu hỏi mở` trống (template ghi "Xóa section nếu trống"); giữ heading `Bảo đảm tối thiểu` trống như cách C-001, A-023 giữ section trống.
4. Item Proposed và Active: "kết thúc UC" → "kết thúc Use Case"; "sau đó quay lại bước X" và "tiếp tục bước X" → "quay lại bước X", theo đúng ba dạng điểm kết thúc của GUC-10. Mỗi dòng đổi đều ghi ở bảng dưới.
5. `Bảo đảm tối thiểu` của 23 item không Closed để `<!-- điền sau: FILL_LATER -->` (FILL_LATER.md mục use-cases). Riêng UC-008 có thêm điều 1 chuyển từ Postconditions 2 (PLAN.md mục 4, FILL_LATER.md).
6. Section `Câu hỏi mở`, `Ghi chú` trống thì xóa theo template: UC-001, UC-004, UC-005, UC-008, UC-013, UC-014, UC-015 (Câu hỏi mở); UC-015 (Ghi chú).
7. Nơi xử lý của câu hỏi mở viết "(nơi xử lý: <ID>)", theo dạng của BLK-063.

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| UC-001 | title | Tạo deck mới chỉ từ yêu cầu gõ trong chat, không có file | Người dùng tạo deck mới chỉ từ yêu cầu gõ trong chat, không kèm tài liệu có sẵn | GUC-01, GX-07, PLAN.md mục 4 |
| UC-001 | Tình huống | Tôi cần 8 slide giới thiệu dự án cho buổi họp nhóm chiều nay nhưng chưa có tài liệu nào. Tôi muốn gõ vài câu mô tả và nhận ngay một deck để sửa tiếp. | Tôi có buổi họp nhóm chiều nay cần 8 slide giới thiệu dự án nhưng chưa có tài liệu nào, tôi muốn gõ vài câu mô tả và nhận một deck, để sửa tiếp. | GUC-04, GX-08 ("ngay") |
| UC-001 | Alternative 1A | 1A. Người dùng tải lên một file cùng yêu cầu: Chuyển sang UC-002. | 1A. Người dùng tải lên một file cùng yêu cầu: Hệ thống chuyển sang UC-002. | GUC-10, GX-16 |
| UC-001 | Alternative 3A | 3A. Không xác định được chủ đề hoặc mục đích của deck: Hệ thống hỏi lại người dùng, sau đó quay lại bước 3. | 3A. Hệ thống không xác định được chủ đề hoặc mục đích của deck: Hệ thống hỏi lại người dùng, quay lại bước 3. | GUC-10, GX-16, GX-08 |
| UC-001 | Alternative 3B | — (thêm mới) | 3B. Người dùng hủy khi được hỏi lại ở 3A: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case. | BLK-053 (P6) |
| UC-001 | Alternative 4A | 4A. Người dùng dừng lượt xử lý AI: Hệ thống dừng, không tạo deck, kết thúc UC. | 4A. Người dùng dừng lượt xử lý AI: Hệ thống dừng, không tạo deck (BR-010), kết thúc Use Case. | GUC-10, GUC-15, BLK-035 (BR-010 sở hữu vòng đời bản deck; PLAN.md ghi BR-014, mục 2 của BR-014 rút về BR-010) |
| UC-001 | Alternative 4B | 4B. AI lỗi hoặc quá thời gian: Hệ thống báo lỗi và gợi ý thử lại, không tạo deck, kết thúc UC. | 4B. ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032: Hệ thống báo lỗi và gợi ý thử lại, không tạo deck (BR-010), kết thúc Use Case. | BLK-047, BLK-001 (P1a), GUC-11, GUC-10 |
| UC-001 | Alternative 4C | — (tách từ 4B gốc) | 4C. ACT-002 trả lỗi thay vì kết quả, hoặc Hệ thống không kết nối được ACT-002 (R-032): Hệ thống báo lỗi và gợi ý thử lại, không tạo deck (BR-010), kết thúc Use Case. | BLK-047 (P6), `Hành vi lỗi` 2 của ACT-002, GUC-11 |
| UC-001 | Alternative 5A | 5A. Kết quả không qua kiểm tra: Hệ thống không hiển thị deck, báo lỗi và cho thử lại, kết thúc UC. | 5A. Kết quả không qua kiểm tra kết quả (R-033), gồm kết quả sai định dạng: Hệ thống không hiển thị deck, báo lỗi và cho thử lại, kết thúc Use Case. | BLK-047, GUC-15, GUC-10 |
| UC-001 | Postconditions 1 | Deck là bản đã chấp nhận đầu tiên của lần làm việc. | Deck là bản đã chấp nhận đầu tiên của lần làm việc (BR-010). | GUC-15, PLAN.md mục 4 |
| UC-001 | Ghi chú 3 | — (thêm mới) | Thay đổi hành vi giữa các phiên bản model (`Hành vi lỗi` 4 của ACT-002) không có nhánh: Hệ thống không phát hiện được thay đổi này trong một lượt xử lý AI; kết quả sai vẫn bị chặn ở kiểm tra kết quả (R-033). | BLK-047 (P6), GUC-12 |
| UC-002 | title | Tạo deck mới từ một tài liệu có sẵn (Word, PDF, TXT/Markdown, text dán vào, nội dung PPTX) | Người dùng tạo deck mới từ một tài liệu có sẵn | GUC-01, PLAN.md mục 4 (thuật ngữ "tài liệu có sẵn" đã định nghĩa 5 loại) |
| UC-002 | Tình huống | Tôi có một báo cáo Word 15 trang về kết quả quý. Tôi muốn AI biến nó thành deck khoảng 10 slide để đi họp, và số liệu trên slide phải khớp với báo cáo. | Tôi có một báo cáo `Word` 15 trang về kết quả quý, tôi muốn AI biến báo cáo đó thành deck khoảng 10 slide có số liệu trên slide khớp với báo cáo, để đi họp. | GUC-04, GX-17 ("nó") |
| UC-002 | Main Flow 2 | Hệ thống kiểm tra loại file và kích thước. | Hệ thống kiểm tra loại file và giới hạn đầu vào của R-003. | BLK-011 (P1b: giới hạn gồm dung lượng, số trang, số slide, số ký tự; nhánh 2B tham chiếu R-003) |
| UC-002 | Main Flow 3 | Hệ thống đọc nội dung tài liệu và chỉ dùng nó làm dữ liệu, không coi là yêu cầu. | Hệ thống đọc nội dung tài liệu và chỉ dùng nội dung tài liệu làm dữ liệu, không coi là yêu cầu (BR-008). | GX-17, GUC-15, PLAN.md mục 4 |
| UC-002 | Main Flow 6 | Hệ thống kiểm tra kết quả, gồm việc số liệu khớp với tài liệu. | Hệ thống kiểm tra kết quả, gồm việc số liệu khớp với tài liệu (BR-002). | GUC-15, PLAN.md mục 4 |
| UC-002 | Alternative 1A | 1A. Người dùng tải lên từ 2 file trở lên: Hệ thống báo mỗi deck chỉ dùng một tài liệu và yêu cầu chọn một file, sau đó quay lại bước 1. | 1A. Người dùng tải lên từ 2 file trở lên: Hệ thống báo mỗi deck chỉ dùng một tài liệu (BR-009) và yêu cầu chọn một file, quay lại bước 1. | GUC-15, GUC-10, PLAN.md mục 4 |
| UC-002 | Alternative 2A | 2A. File là ảnh, Excel/CSV, link web hoặc PDF scan: Hệ thống báo chưa nhận loại file này và liệt kê 5 loại đang nhận, sau đó quay lại bước 1. | 2A. File là ảnh, `Excel`/CSV hoặc link web: Hệ thống báo chưa nhận loại file này và liệt kê 5 loại đang nhận, quay lại bước 1. | BLK-049 (bỏ "PDF scan"), GUC-10 |
| UC-002 | Alternative 2B | 2B. File vượt giới hạn kích thước: Hệ thống báo giới hạn, sau đó quay lại bước 1. | 2B. File vượt giới hạn của R-003: Hệ thống báo giới hạn, quay lại bước 1. | BLK-011 (P1b), GUC-10 |
| UC-002 | Alternative 3A | 3A. Không đọc được file (file hỏng, PDF không có text layer): Hệ thống báo lỗi kèm cách xử lý, sau đó quay lại bước 1. | 3A. Hệ thống không đọc được file (file hỏng): Hệ thống báo lỗi kèm cách xử lý, quay lại bước 1. | BLK-049 (bỏ "PDF không có text layer"), GX-16, GUC-10 |
| UC-002 | Alternative 3B | — (thêm mới) | 3B. File PDF không có text layer: Hệ thống báo chưa nhận PDF không có text layer và liệt kê 5 loại tài liệu đang nhận (R-003), quay lại bước 1. | BLK-049 (P6, phương án C) |
| UC-002 | Alternative 4A | 4A. Yêu cầu không nêu mục đích hoặc audience và tài liệu cũng không cho biết: Hệ thống hỏi lại người dùng, sau đó quay lại bước 4. | 4A. Yêu cầu không nêu mục đích hoặc audience và tài liệu cũng không cho biết: Hệ thống hỏi lại người dùng, quay lại bước 4. | GUC-10 |
| UC-002 | Alternative 4B | — (thêm mới) | 4B. Người dùng hủy khi được hỏi lại ở 4A: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case. | BLK-053 (P6) |
| UC-002 | Alternative 5A | 5A. Tài liệu không có thông tin cho một nội dung người dùng yêu cầu: AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung, rồi tiếp tục bước 5. | 5A. Tài liệu không có thông tin cho một nội dung người dùng yêu cầu: AI hỏi người dùng hoặc đánh dấu nội dung đó là do AI bổ sung (R-008), quay lại bước 5. | BLK-045 (P2), GUC-10 |
| UC-002 | Alternative 5B | 5B. Người dùng dừng lượt xử lý AI: Hệ thống dừng, không tạo deck, kết thúc UC. | 5B. Người dùng dừng lượt xử lý AI: Hệ thống dừng, không tạo deck (BR-010), kết thúc Use Case. | GUC-10, GUC-15, BLK-035 |
| UC-002 | Alternative 5C | 5C. AI lỗi hoặc quá thời gian: Hệ thống báo lỗi và gợi ý thử lại, không tạo deck, kết thúc UC. | 5C. ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032: Hệ thống báo lỗi và gợi ý thử lại, không tạo deck (BR-010), kết thúc Use Case. | BLK-047, BLK-001 (P1a), GUC-11, GUC-10 |
| UC-002 | Alternative 5D | — (tách từ 5C gốc) | 5D. ACT-002 trả lỗi thay vì kết quả, hoặc Hệ thống không kết nối được ACT-002 (R-032): Hệ thống báo lỗi và gợi ý thử lại, không tạo deck (BR-010), kết thúc Use Case. | BLK-047 (P6), `Hành vi lỗi` 2 của ACT-002 |
| UC-002 | Alternative 5E | — (thêm mới) | 5E. Người dùng hủy khi được hỏi lại ở 5A: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case. | BLK-053 (P6) |
| UC-002 | Alternative 6A | 6A. Kết quả không qua kiểm tra: Hệ thống không hiển thị deck, báo lỗi và cho thử lại, kết thúc UC. | 6A. Kết quả không qua kiểm tra kết quả (R-033), gồm kết quả sai định dạng: Hệ thống không hiển thị deck, báo lỗi và cho thử lại, kết thúc Use Case. | BLK-047, GUC-15, GUC-10 |
| UC-002 | Postconditions 1 | Deck là bản đã chấp nhận đầu tiên của lần làm việc. | Deck là bản đã chấp nhận đầu tiên của lần làm việc (BR-010). | GUC-15 (khớp UC-001) |
| UC-002 | Postconditions 2 | Mọi số liệu lấy từ tài liệu khớp với tài liệu (P1). | Mọi số liệu lấy từ tài liệu khớp với tài liệu (BR-002). | GUC-15, GX-10, PLAN.md mục 4 |
| UC-002 | Postconditions 3 | Nội dung AI bổ sung được đánh dấu khác với nội dung lấy từ tài liệu. | Nội dung AI bổ sung được đánh dấu khác với nội dung lấy từ tài liệu (BR-002). | GUC-15, PLAN.md mục 4 |
| UC-002 | Câu hỏi mở 1 (gốc) | Giới hạn kích thước và số trang của tài liệu là bao nhiêu? | — (bỏ) | BLK-011 (P1b) |
| UC-002 | Câu hỏi mở 1 (gốc 2) | Tiêu chí đo “thông tin quan trọng” của P1 là gì? (W-032) | Tiêu chí đo “thông tin quan trọng” của `P1` là gì? (nơi xử lý: R-007) | GUC-18, PLAN.md mục 4, BLK-063 |
| UC-002 | Ghi chú 2 | PPTX ở UC này chỉ được lấy nội dung; giữ bố cục thuộc UC-003. | PPTX ở Use Case này chỉ được lấy nội dung; giữ bố cục thuộc UC-003 (BR-009). | GUC-15, PLAN.md mục 4 |
| UC-002 | Ghi chú 3 | Ảnh nhúng trong tài liệu chưa được dùng lại (L-001). | Hệ thống chưa dùng lại ảnh nhúng trong tài liệu. | PLAN.md mục 4 (bỏ L-001), GX-16 |
| UC-002 | Ghi chú 4 | — (thêm mới) | Thay đổi hành vi giữa các phiên bản model (`Hành vi lỗi` 4 của ACT-002) không có nhánh: Hệ thống không phát hiện được thay đổi này trong một lượt xử lý AI; kết quả sai vẫn bị chặn ở kiểm tra kết quả (R-033). | BLK-047 (P6), GUC-12 |
| UC-003 | title | Mở file PPTX có sẵn để AI sửa tiếp, giữ nguyên bố cục gốc | Người dùng mở deck có sẵn để AI sửa tiếp, giữ nguyên bố cục gốc | GUC-01, GX-07 ("deck có sẵn") |
| UC-003 | Tình huống | Tôi có deck bán hàng làm năm ngoái theo mẫu của công ty. Tôi muốn AI cập nhật số liệu mới nhưng giữ nguyên bố cục và màu sắc đã được duyệt. | Tôi có deck bán hàng làm năm ngoái theo mẫu của công ty, tôi muốn AI cập nhật số liệu mới nhưng giữ nguyên bố cục và màu sắc đã được duyệt, để tiếp tục sửa deck đó bằng AI mà không phải làm lại bố cục. | GUC-04 (vế "để" lấy từ Mục tiêu, PLAN.md mục 4) |
| UC-003 | Alternative 1A | 1A. File vượt giới hạn kích thước: Hệ thống báo giới hạn, kết thúc UC. | 1A. File vượt giới hạn của R-003: Hệ thống báo giới hạn, kết thúc Use Case. | BLK-011 (P1b), GUC-10 |
| UC-003 | Alternative 2A | 2A. Không đọc được file: Hệ thống báo lỗi, kết thúc UC. | 2A. Hệ thống không đọc được file: Hệ thống báo lỗi, kết thúc Use Case. | GX-16, GUC-10 |
| UC-003 | Câu hỏi mở 1 | Những thành phần PPTX nào bắt buộc phải giữ được khi UC này quay lại phạm vi? | Những thành phần PPTX nào bắt buộc phải giữ được khi Use Case này quay lại phạm vi? (nơi xử lý: R-005) | GUC-18, PLAN.md mục 4 |
| UC-003 | Ghi chú 1 | Khác UC-002: UC này giữ bố cục; UC-002 chỉ lấy nội dung và tạo bố cục mới. | Khác UC-002: Use Case này giữ bố cục; UC-002 chỉ lấy nội dung và tạo bố cục mới (BR-009). | GUC-15, PLAN.md mục 4 |
| UC-004 | title | Yêu cầu AI sửa lại cả deck (độ dài, giọng văn, thứ tự, nội dung) | Người dùng yêu cầu AI sửa cả deck | GUC-01, GX-07 ("sửa cả deck"), GX-08 (danh sách thiếu 3 trong 7 loại sửa) |
| UC-004 | Tình huống | Deck vừa tạo có 14 slide và giọng văn quá học thuật. Tôi muốn AI rút còn 10 slide và viết lại cho quản lý không chuyên đọc hiểu. | Tôi có deck vừa tạo gồm 14 slide với giọng văn quá học thuật, tôi muốn AI rút còn 10 slide và viết lại, để quản lý không chuyên đọc hiểu được. | GUC-04 |
| UC-004 | Main Flow 3 (gốc 2') | 2'. Nếu yêu cầu không bị từ chối ở 2C và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào chưa hoàn tất, hệ thống đạt ranh giới commit. Nếu đang có bản chờ duyệt, hệ thống chấp nhận bản đó theo BR-010 và lấy ràng buộc của nó làm baseline; sau đó áp dụng ràng buộc của yêu cầu mới. | 3. Hệ thống đạt ranh giới commit và áp dụng ràng buộc của yêu cầu mới (BR-010). | BLK-035 (P3), GUC-08 (đánh số, bỏ "nếu") |
| UC-004 | Main Flow 4 (gốc 3) | 3. AI sửa cả deck, giữ các ràng buộc của người dùng còn hiệu lực và dùng tài liệu có sẵn (nếu có) làm căn cứ; hệ thống hiển thị tiến độ (UC-014). | 4. AI sửa cả deck, giữ các ràng buộc của người dùng còn hiệu lực (BR-003) và dùng tài liệu có sẵn của lần làm việc làm căn cứ khi lần làm việc có tài liệu có sẵn; hệ thống hiển thị tiến độ (UC-014). | GUC-08 (bỏ "nếu"), BLK-043 (tham chiếu BR-003) |
| UC-004 | Main Flow 7 (gốc 6) | 6. Người dùng xem trước (UC-015), sau đó giữ hoặc bỏ bản chờ duyệt. | 7. Người dùng xem trước bản chờ duyệt (UC-015). | BLK-050 (P6: Use Case kết thúc khi người dùng xem trước bản chờ duyệt) |
| UC-004 | Alternative 1A | 1A. Người dùng gửi yêu cầu sửa khi đang xem bản chờ duyệt: Bản chờ duyệt vẫn giữ nguyên trong các bước hỏi lại, cảnh báo hoặc xác nhận của yêu cầu mới. Nếu người dùng hủy hoặc yêu cầu bị từ chối trước bước 2', bản chờ duyệt vẫn là bản chờ duyệt và UC kết thúc. Việc chấp nhận chỉ diễn ra tại bước 2'. | — (bỏ) | BLK-035 (P3) |
| UC-004 | Alternative 2A | 2A. Không xác định được người dùng muốn sửa gì: Hệ thống hỏi lại. Nếu người dùng cung cấp đủ thông tin, quay lại bước 2. Nếu người dùng hủy, bản chờ duyệt (nếu có) vẫn là bản chờ duyệt và UC kết thúc. | 2A. Hệ thống không xác định được người dùng muốn sửa gì: Hệ thống hỏi lại người dùng; người dùng cung cấp đủ thông tin, quay lại bước 2. | GUC-10 (mỗi dòng một điểm kết thúc), GX-16 |
| UC-004 | Alternative 2D | — (tách từ 2A gốc, vế hủy) | 2D. Người dùng hủy khi được hỏi lại ở 2A: Hệ thống giữ bản chờ duyệt (nếu có) là bản chờ duyệt (BR-010), kết thúc Use Case. | GUC-10, GUC-15, BLK-035 |
| UC-004 | Alternative 2B | 2B. Yêu cầu nhắm vào một slide cụ thể: Hệ thống báo việc sửa là cố gắng, không đảm bảo và các slide khác có thể bị thay đổi (BR-011). Người dùng chọn tiếp tục hoặc hủy. Nếu tiếp tục, quay lại bước 2' để đạt ranh giới commit. Nếu hủy, deck và ràng buộc giữ nguyên; bản chờ duyệt (nếu có) vẫn là bản chờ duyệt và UC kết thúc. | 2B. Yêu cầu nhắm vào một slide cụ thể: Hệ thống báo việc sửa là cố gắng, không đảm bảo và các slide khác có thể bị thay đổi (BR-011); người dùng chọn tiếp tục, quay lại bước 3. | GUC-10, BLK-035 (bước 2' thành bước 3) |
| UC-004 | Alternative 2E | — (tách từ 2B gốc, vế hủy) | 2E. Người dùng chọn hủy sau thông báo ở 2B: Hệ thống giữ nguyên deck và ràng buộc; bản chờ duyệt (nếu có) vẫn là bản chờ duyệt (BR-010), kết thúc Use Case. | GUC-10, GUC-15, BLK-035 |
| UC-004 | Alternative 2C | 2C. Yêu cầu thuộc loại V1 chưa làm được (sửa một thành phần, thêm hình ảnh, dịch deck): Hệ thống báo giới hạn, không sửa deck; bản chờ duyệt (nếu có) vẫn là bản chờ duyệt; kết thúc UC. | 2C. Yêu cầu thuộc loại V1 chưa làm được (sửa một thành phần, thêm hình ảnh, dịch deck): Hệ thống báo giới hạn (BR-013), không sửa deck; bản chờ duyệt (nếu có) vẫn là bản chờ duyệt, kết thúc Use Case. | GUC-15, GUC-10, PLAN.md mục 4 |
| UC-004 | Alternative 4A (gốc 3A) | 3A. Người dùng dừng lượt xử lý AI: Hệ thống dừng; deck quay về bản đã chấp nhận tại bước 2' nếu bước đó đã xảy ra, không quay về bản cũ hơn; các ràng buộc mới của yêu cầu này bị hủy khi rollback và tập ràng buộc quay về baseline của bản đó; kết thúc UC. | 4A. Người dùng dừng lượt xử lý AI: Hệ thống dừng; deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit (BR-010), kết thúc Use Case. | BLK-035 (P3), GUC-10, đánh số theo bước mới |
| UC-004 | Alternative 4B (gốc 3B) | 3B. AI lỗi hoặc quá thời gian: Hệ thống báo lỗi và gợi ý thử lại; deck quay về bản đã chấp nhận tại bước 2' nếu bước đó đã xảy ra, không quay về bản cũ hơn; các ràng buộc mới của yêu cầu này bị hủy khi rollback và tập ràng buộc quay về baseline của bản đó; kết thúc UC. | 4B. ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032: Hệ thống báo lỗi và gợi ý thử lại; deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit (BR-010), kết thúc Use Case. | BLK-047, BLK-001 (P1a), BLK-035, GUC-11 |
| UC-004 | Alternative 4C | — (tách từ 3B gốc) | 4C. ACT-002 trả lỗi thay vì kết quả, hoặc Hệ thống không kết nối được ACT-002 (R-032): Hệ thống báo lỗi và gợi ý thử lại; deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit (BR-010), kết thúc Use Case. | BLK-047 (P6), BLK-035 |
| UC-004 | Alternative 5A (gốc 4A) | 4A. Kết quả không qua kiểm tra: Hệ thống không hiển thị kết quả, báo lỗi; deck quay về bản đã chấp nhận tại bước 2' nếu bước đó đã xảy ra, không quay về bản cũ hơn; các ràng buộc mới của yêu cầu này bị hủy khi rollback và tập ràng buộc quay về baseline của bản đó; kết thúc UC. | 5A. Kết quả không qua kiểm tra kết quả (R-033), gồm kết quả sai định dạng: Hệ thống không hiển thị kết quả, báo lỗi; deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit (BR-010), kết thúc Use Case. | BLK-047, BLK-035, GUC-10 |
| UC-004 | Alternative 7A (gốc 6A) | 6A. Người dùng bỏ bản chờ duyệt: Chuyển sang UC-013. | 7A. Người dùng bỏ bản chờ duyệt: Hệ thống chuyển sang UC-013. | GX-16, đánh số theo bước mới |
| UC-004 | Postconditions 1 | — (thêm mới) | Kết quả sửa được hiển thị dưới dạng bản chờ duyệt và người dùng đã xem trước bản chờ duyệt đó (UC-015). | BLK-050 (P6: "bản chờ duyệt được hiển thị") |
| UC-004 | Postconditions 2 (gốc 1, vế đầu gốc 2) | 1. Nếu bản chờ duyệt được người dùng giữ hoặc được chấp nhận tại ranh giới commit để bắt đầu một lượt sửa tiếp, bản đó trở thành bản đã chấp nhận mới theo BR-010. 2. Khi bản chờ duyệt được chấp nhận, ràng buộc của nó trở thành tập ràng buộc của bản đã chấp nhận; … | 2. Bản chờ duyệt có trước yêu cầu sửa này, nếu lần làm việc có bản đó, đã trở thành bản đã chấp nhận tại ranh giới commit cùng tập ràng buộc của bản đó (BR-010). | BLK-050, BLK-035 (Postconditions 1–2 tham chiếu BR-010; vế "giữ" là hành động sau khi Use Case kết thúc), GX-17 |
| UC-004 | Postconditions 3 (vế sau gốc 2) | … ràng buộc của yêu cầu sửa mới chỉ được giữ lại nếu lượt sửa tạo được bản chờ duyệt thành công. | 3. Ràng buộc của yêu cầu sửa này được giữ cùng bản chờ duyệt mới (BR-010). | BLK-035, GUC-13 (điều đúng khi thành công) |
| UC-004 | Postconditions 4 (gốc 3) | 3. Khi kết quả sửa mới trở thành bản chờ duyệt, bản đã chấp nhận làm cơ sở cho lượt sửa đó vẫn quay lại được một bước. | 4. Bản đã chấp nhận làm cơ sở cho lượt sửa này vẫn quay lại được một bước. | BLK-050 (giữ Postconditions 3) |
| UC-004 | Câu hỏi mở 1 | Ràng buộc của người dùng hết hiệu lực khi nào, và xử lý thế nào khi hai ràng buộc mâu thuẫn? (A-013) | — (bỏ) | BLK-043 (P2) |
| UC-004 | Ghi chú 1 | Không cam kết chỉ sửa đúng một slide. | Hệ thống không cam kết chỉ sửa đúng một slide. | GX-16 |
| UC-004 | Ghi chú 2 | Sửa cục bộ (UC-023), thêm slide hoặc hình ảnh (UC-024) và dịch deck (UC-025) là UC riêng. | Sửa cục bộ (UC-023), thêm slide hoặc hình ảnh (UC-024) và dịch deck (UC-025) là Use Case riêng. | Quy ước áp chung 4 (không viết tắt UC) |
| UC-004 | Ghi chú 4 | — (thêm mới) | Thay đổi hành vi giữa các phiên bản model (`Hành vi lỗi` 4 của ACT-002) không có nhánh: Hệ thống không phát hiện được thay đổi này trong một lượt xử lý AI; kết quả sai vẫn bị chặn ở kiểm tra kết quả (R-033). | BLK-047 (P6), GUC-12 |
| UC-007 | title | Đưa một deck mẫu để AI học theo cấu trúc hoặc cách trình bày | Người dùng đưa một deck mẫu để AI học theo cấu trúc hoặc cách trình bày | GUC-01 |
| UC-007 | Tình huống | Tôi thích cách chia phần và bố cục của deck tổng kết năm ngoái. Tôi muốn deck mới đi theo cấu trúc đó nhưng nội dung là của dự án mới. | Tôi có deck tổng kết năm ngoái với cách chia phần và bố cục tôi thích, tôi muốn AI học theo cấu trúc của deck đó, để deck mới đi theo cấu trúc đó nhưng nội dung là của dự án mới. | GUC-04 |
| UC-007 | Alternative 2A | 2A. Người dùng không nói rõ muốn học theo phần nào: Hệ thống hỏi lại, sau đó quay lại bước 2. | 2A. Người dùng không nói rõ muốn học theo phần nào: Hệ thống hỏi lại người dùng, quay lại bước 2. | GUC-10, GX-08 |
| UC-007 | Alternative 2B | 2B. Phần người dùng muốn học theo chưa làm được: Hệ thống báo giới hạn và bỏ qua phần đó, tiếp tục bước 3. | 2B. Phần người dùng muốn học theo chưa làm được: Hệ thống báo giới hạn (BR-013) và bỏ qua phần đó, quay lại bước 3. | GUC-15, GUC-10, PLAN.md mục 4 |
| UC-007 | Câu hỏi mở 1 | Deck mẫu có được là file PDF hoặc ảnh chụp slide không? | Deck mẫu có được là file PDF hoặc ảnh chụp slide không? (nơi xử lý: R-010) | GUC-18, PLAN.md mục 4 |
| UC-007 | Ghi chú 2 | Còn ở mức thăm dò. | Use Case này còn ở mức thăm dò. | GX-16 |
| UC-008 | title | Tải deck về máy dạng PPTX hoặc PDF | Người dùng tải deck về máy dạng PPTX, PDF, PNG hoặc SVG | Q1 (APPLY.md mục 2), GUC-01 |
| UC-008 | Tình huống | Deck đã ổn và chiều nay tôi phải trình bày trên máy phòng họp. Tôi muốn tải file PPTX để chỉnh thêm vài chỗ trong PowerPoint, và một bản PDF để gửi trước cho sếp. | Tôi có deck đã ổn cho buổi trình bày chiều nay trên máy phòng họp, tôi muốn tải về một file PPTX và một bản PDF, để chỉnh thêm vài chỗ trong `PowerPoint` và gửi trước bản PDF cho sếp. | GUC-04, PLAN.md mục 5 |
| UC-008 | Mục tiêu | Người dùng có file PPTX hoặc PDF đúng với deck đã xem trước, dùng được ngoài DeckAgent. | Người dùng có file theo định dạng đã chọn, đúng với deck đã xem trước, để dùng ngoài Hệ thống. | Q1 (APPLY.md mục 2), GX-08 ("dùng được"), BLK-068 |
| UC-008 | Trigger | Người dùng chọn tải về và chọn định dạng. | Người dùng mở xem trước deck hiện tại (UC-015). | BLK-051 (P6) |
| UC-008 | Main Flow 2 | Người dùng chọn tải về và chọn PPTX hoặc PDF. | Người dùng chọn tải về và chọn một trong 4 định dạng của D-031. | Q1 (APPLY.md mục 2) |
| UC-008 | Main Flow 4 | Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung. | Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung (BR-006). | GUC-15, PLAN.md mục 5 |
| UC-008 | Main Flow 5 | Hệ thống kiểm tra file mở được. | Hệ thống kiểm tra file mở được (R-027). | BLK-044 (Q2: R-027 có Acceptance "mở được" riêng cho từng định dạng), GUC-15 |
| UC-008 | Main Flow 6 | Người dùng nhận file. | Người dùng nhận file; với PNG và SVG, file nhận được là một file .zip. | Q1 (APPLY.md mục 2) |
| UC-008 | Alternative 6A (gốc Main Flow 7) | 7. Nếu file được tạo từ bản chờ duyệt, bản đó trở thành bản đã chấp nhận (BR-010). | 6A. File được tạo từ bản chờ duyệt: Hệ thống chuyển bản chờ duyệt thành bản đã chấp nhận (BR-010), kết thúc Use Case. | GUC-08 (bỏ "nếu"), GUC-10, PLAN.md mục 5 |
| UC-008 | Alternative 1A | 1A. Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa (UC-004), kết thúc UC. | 1A. Người dùng gửi yêu cầu sửa thay vì chọn tải về: Hệ thống chuyển sang UC-004. | BLK-051 (P6) |
| UC-008 | Alternative 3A | 3A. Định dạng không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi; người dùng chọn tiếp tục hoặc hủy. Nếu hủy, bản chờ duyệt vẫn là bản chờ duyệt, kết thúc UC. | 3A. Định dạng đã chọn không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi (BR-013); người dùng chọn tiếp tục, quay lại bước 4. | GUC-10 (mỗi dòng một điểm kết thúc), GUC-15 |
| UC-008 | Alternative 3B | — (tách từ 3A gốc, vế hủy) | 3B. Người dùng chọn hủy sau danh sách ở 3A: Hệ thống giữ bản chờ duyệt là bản chờ duyệt (BR-010), kết thúc Use Case. | GUC-10, GUC-15 |
| UC-008 | Alternative 4A | 4A. Tạo file thất bại hoặc file không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc UC. | 4A. Hệ thống tạo file thất bại: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case. | GUC-11 (hai điều kiện ở hai bước), GUC-10 |
| UC-008 | Alternative 5A | — (tách từ 4A gốc) | 5A. File vừa tạo không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case. | GUC-11, PLAN.md mục 5 |
| UC-008 | Postconditions 1 | File được tạo từ đúng bản người dùng đã xem trước. | File được tạo từ đúng bản người dùng đã xem trước (BR-006). | GUC-15 |
| UC-008 | Postconditions 2 | Bản chờ duyệt (nếu có) chỉ trở thành bản đã chấp nhận khi tải về thành công. | Bản người dùng đã tải về là bản đã chấp nhận (BR-010). | GUC-13 (vế đúng khi thành công), PLAN.md mục 5 |
| UC-008 | Bảo đảm tối thiểu 1 | (vế "chỉ khi tải về thành công" của Postconditions 2) | Bản chờ duyệt chỉ trở thành bản đã chấp nhận khi tải về thành công (BR-010). | GUC-14, FILL_LATER.md (UC-008), PLAN.md mục 5 |
| UC-008 | Postconditions 3 | File PPTX và PDF giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (P5). | File tải về giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (R-025). | Q1 (APPLY.md mục 2) |
| UC-008 | Postconditions 4 | Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint. | Chữ, hình khối và bảng trong file PPTX sửa được trong `PowerPoint`. | Q2 (giữ ý), PLAN.md mục 5 |
| UC-008 | Ghi chú 3 (gốc Postconditions 5) | File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc. | File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc (BR-012). | GUC-13, GX-10, PLAN.md mục 5 |
| UC-008 | Câu hỏi mở 1 | Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice? | — (bỏ) | Q2, BLK-044 |
| UC-008 | Ghi chú 1 | V1 chỉ có hai định dạng PPTX và PDF. | V1 có 4 định dạng tải về (D-031); đẩy deck lên `Google Drive` thuộc release Later (R-058). | Q1 (APPLY.md mục 2) |
| UC-008 | Ghi chú 2 | Chỉnh tay chuyên sâu làm trong PowerPoint sau khi tải về, nên PPTX phải sửa được. | Chỉnh tay chuyên sâu làm trong `PowerPoint` sau khi tải về, nên file PPTX phải sửa được. | PLAN.md mục 5 |
| UC-008 | Ghi chú 4 | — (thêm mới) | V1 không dừng được lượt tạo file tải về (D-029). | BLK-048 (P6) |
| UC-009 | title | Đăng nhập vào tài khoản DeckAgent | Người dùng đăng nhập vào tài khoản DeckAgent | GUC-01, PLAN.md mục 4 |
| UC-009 | Tình huống | Tôi dùng DeckAgent trên máy công ty và máy ở nhà. … | Tôi dùng Hệ thống trên máy công ty và máy ở nhà. … | BLK-068 |
| UC-009 | Trigger | Người dùng mở DeckAgent khi chưa đăng nhập. | Người dùng mở Hệ thống khi chưa đăng nhập. | BLK-068 |
| UC-009 | Main Flow 1 | Người dùng mở DeckAgent. | Người dùng mở Hệ thống. | BLK-068 |
| UC-009 | Ghi chú 1 | Chỉ cần khi DeckAgent có tài khoản; V1 chạy trên máy người dùng và không có tài khoản. | Chỉ cần khi Hệ thống có tài khoản; V1 chạy trên máy người dùng và không có tài khoản. | BLK-068 |
| UC-010 | title | Đăng xuất, hoặc bị đăng xuất khi hết hạn đăng nhập | Người dùng đăng xuất, hoặc bị đăng xuất khi phiên đăng nhập hết hạn | GUC-01, GX-07 ("phiên đăng nhập") |
| UC-010 | Ghi chú 1 | Chỉ cần khi DeckAgent có tài khoản. | Chỉ cần khi Hệ thống có tài khoản. | BLK-068 |
| UC-010 | Ghi chú 2 | “Phiên đăng nhập” khác “lần làm việc” (GL-012, GL-013). | “Phiên đăng nhập” khác “lần làm việc” (glossary.md). | PLAN.md mục 4 (glossary không giữ ID GL-) |
| UC-011 | title | Bắt đầu deck mới (deck chưa tải về sẽ bị mất) | Người dùng bắt đầu deck mới (deck chưa tải về sẽ bị mất) | GUC-01 |
| UC-011 | Tình huống | Tôi vừa làm xong deck cho môn A và muốn chuyển sang deck cho môn B. Tôi cần được nhắc nếu deck môn A chưa tải về, vì ứng dụng không lưu lại. | Tôi có deck cho môn A vừa làm xong và muốn chuyển sang deck cho môn B, tôi muốn được nhắc khi deck môn A chưa tải về, để không mất deck môn A vì ứng dụng không lưu lại. | GUC-04 |
| UC-011 | Main Flow 3 | Hệ thống cảnh báo deck chưa tải về sẽ bị mất và không mở lại được. | Hệ thống cảnh báo deck chưa tải về sẽ bị mất và không mở lại được (BR-012). | GUC-15, PLAN.md mục 4 |
| UC-011 | Alternative 1A | 1A. AI đang chạy lượt xử lý: Hệ thống yêu cầu chờ hoặc dừng lượt xử lý trước (UC-014), sau đó quay lại bước 1. | 1A. AI đang chạy lượt xử lý: Hệ thống yêu cầu chờ hoặc dừng lượt xử lý trước (UC-014, BR-014), quay lại bước 1. | GUC-10, GUC-15, PLAN.md mục 4 |
| UC-011 | Alternative 1B | 1B. Người dùng tải lại trang hoặc đóng ứng dụng: Trình duyệt hiển thị cảnh báo rời trang nếu deck chưa tải về. | 1B. Người dùng tải lại trang hoặc đóng ứng dụng khi deck chưa tải về bản mới nhất: Trình duyệt hiển thị cảnh báo rời trang (R-045); người dùng xác nhận, lần làm việc kết thúc, kết thúc Use Case. | BLK-052 (P6) |
| UC-011 | Alternative 1C | — (thêm mới) | 1C. Người dùng hủy ở cảnh báo rời trang: Lần làm việc hiện tại giữ nguyên, kết thúc Use Case. | BLK-052 (P6) |
| UC-011 | Alternative 2A | 2A. Chưa có deck, hoặc bản mới nhất đã được tải về: Hệ thống bỏ qua bước 3 và 4. | 2A. Lần làm việc chưa có deck, hoặc bản mới nhất đã được tải về: Hệ thống bỏ qua bước 3 và 4, quay lại bước 5. | GUC-10, GX-16 |
| UC-011 | Alternative 3A | 3A. Người dùng chọn tải về trước: Chuyển sang UC-008, sau đó quay lại bước 1. | 3A. Người dùng chọn tải về trước: Hệ thống thực hiện UC-008, quay lại bước 1. | GUC-10, GX-16 |
| UC-011 | Alternative 4A | 4A. Người dùng hủy: Lần làm việc hiện tại giữ nguyên, kết thúc UC. | 4A. Người dùng hủy: Lần làm việc hiện tại giữ nguyên, kết thúc Use Case. | GUC-10 |
| UC-011 | Postconditions 2 | Deck chưa tải về chỉ mất sau khi người dùng đã được cảnh báo và xác nhận. | Deck chưa tải về chỉ mất sau khi người dùng đã được cảnh báo và xác nhận (BR-012). | GUC-15, PLAN.md mục 4 |
| UC-011 | Câu hỏi mở 1 | Tài liệu có sẵn và file tạm của lần làm việc cũ có bị xóa khỏi máy ngay không? (R-042) | Tài liệu có sẵn và file tạm của lần làm việc cũ có bị xóa khỏi máy ngay không? (nơi xử lý: R-042) | GUC-18, PLAN.md mục 4 |
| UC-011 | Ghi chú 2 | Muốn dùng lại một deck trong V1: tải về PPTX (UC-008) rồi đưa file đó vào UC-002. | Người dùng muốn dùng lại một deck trong V1 thì tải về PPTX (UC-008) rồi đưa file đó vào UC-002. | GX-16 |
| UC-011 | Ghi chú 3 | (Quan hệ UC) Liên quan: UC-014 (dừng lượt xử lý AI đang chạy) | Liên quan UC-014: dừng lượt xử lý AI đang chạy (nhánh 1A). | GX-12 (Ghi chú giải thích `related`), PLAN.md mục 4 |
| UC-012 | title | Lấy deck đã làm trước đó làm điểm xuất phát cho deck mới | Người dùng lấy deck đã lưu làm điểm xuất phát cho deck mới | GUC-01, PLAN.md mục 4 (khớp R-049) |
| UC-012 | Tình huống | Tháng trước tôi đã làm deck báo cáo tháng 8. Tôi muốn dùng nó làm khung cho báo cáo tháng 9 mà không làm hỏng bản tháng 8. | Tôi có deck báo cáo tháng 8 đã làm tháng trước, tôi muốn dùng deck đó làm khung mà không làm hỏng bản tháng 8, để làm báo cáo tháng 9. | GUC-04, GX-17 |
| UC-012 | Preconditions 1 | DeckAgent lưu được deck qua nhiều lần làm việc (R-048). | Hệ thống lưu được deck qua nhiều lần làm việc (R-048). | BLK-068 |
| UC-012 | Preconditions 2 | Deck gốc còn tồn tại. | — (bỏ) | GUC-07 (nhánh 1A kiểm lại), PLAN.md mục 4 |
| UC-012 | Alternative 1A | 1A. Deck gốc đã bị xóa: Hệ thống báo, kết thúc UC. | 1A. Deck gốc đã bị xóa: Hệ thống báo, kết thúc Use Case. | GUC-10 |
| UC-012 | Alternative 2A | 2A. Tạo bản sao thất bại: Hệ thống báo lỗi, lần làm việc hiện tại không đổi, kết thúc UC. | 2A. Tạo bản sao thất bại: Hệ thống báo lỗi, lần làm việc hiện tại không đổi, kết thúc Use Case. | GUC-10 |
| UC-012 | Câu hỏi mở 1 | Bản sao có mang theo ràng buộc của người dùng và lịch sử các bản của deck gốc không? | Bản sao có mang theo ràng buộc của người dùng và lịch sử các bản của deck gốc không? (nơi xử lý: R-049) | GUC-18, PLAN.md mục 4 |
| UC-012 | Ghi chú 1 | Cần lưu deck qua nhiều lần làm việc, V1 chưa có. | Use Case này cần lưu deck qua nhiều lần làm việc; V1 chưa có. | GX-16 |
| UC-013 | title | Bỏ lần sửa vừa rồi của AI, quay về bản trước đó | Người dùng bỏ bản chờ duyệt để quay về bản đã chấp nhận trước lần sửa | GUC-01, GX-07, PLAN.md mục 4 |
| UC-013 | Tình huống | Tôi bảo AI viết lại cho ngắn gọn nhưng kết quả mất luôn hai slide số liệu tôi cần. Tôi muốn quay về bản ngay trước đó. | Tôi có deck vừa được AI viết lại cho ngắn gọn nhưng kết quả mất luôn hai slide số liệu tôi cần, tôi muốn quay về bản trước lần sửa đó, để không mất công việc trước đó. | GUC-04 (vế "để" lấy từ Mục tiêu), GX-08 ("ngay") |
| UC-013 | Preconditions 1 | Có bản chờ duyệt. | — (bỏ; section Preconditions xóa vì trống) | GUC-07 (nhánh 1A kiểm lại), PLAN.md mục 4 |
| UC-013 | Alternative 1A | 1A. Không còn bản chờ duyệt (…): Hệ thống báo không còn lần sửa nào để bỏ, kết thúc UC. | 1A. Không còn bản chờ duyệt (…): Hệ thống báo không còn lần sửa nào để bỏ, kết thúc Use Case. | GUC-10 |
| UC-013 | Postconditions 3 | Người dùng gửi được yêu cầu sửa khác. | — (bỏ) | GUC-13 ("có thể làm gì tiếp"), PLAN.md mục 4 |
| UC-013 | Ghi chú 1 | Chỉ quay lại được một bước; xem và khôi phục nhiều bản cũ là UC-022. | Người dùng chỉ quay lại được một bước; xem và khôi phục nhiều bản cũ là UC-022. | GX-16 |
| UC-014 | title | Xem AI đang làm tới đâu và dừng giữa chừng | Người dùng theo dõi tiến độ lượt xử lý và dừng lượt xử lý AI giữa chừng | GUC-01, GX-07, PLAN.md mục 4 |
| UC-014 | Tình huống | AI tạo deck đã hơn một phút và tôi nhận ra mình gõ nhầm chủ đề. Tôi muốn biết nó đang làm gì và dừng ngay để gõ lại. | Tôi có lượt xử lý AI tạo deck đã chạy hơn một phút và nhận ra mình gõ nhầm chủ đề, tôi muốn biết AI đang làm gì và dừng lượt xử lý đó, để gõ lại yêu cầu. | GUC-04, GX-17 ("nó"), GX-08 ("ngay") |
| UC-014 | Mục tiêu | Người dùng biết AI đang ở bước nào, biết phải làm gì khi có lỗi và dừng được khi cần. | Người dùng biết AI đang ở bước nào, biết phải làm gì khi có lỗi và dừng được lượt xử lý AI trước khi lượt đó xong. | GX-08 ("khi cần"), PLAN.md mục 4 (lấy từ R-046) |
| UC-014 | Alternative 2A | 2A. Người dùng dừng lượt xử lý AI tạo hoặc sửa deck: Hệ thống dừng, không tạo bản mới, bản đã chấp nhận giữ nguyên, kết thúc UC. | 2A. Người dùng dừng lượt xử lý AI tạo hoặc sửa deck: Hệ thống dừng và kết thúc lượt xử lý ở trạng thái Đã dừng, không tạo bản mới, bản đã chấp nhận giữ nguyên (BR-010), kết thúc Use Case. | BLK-001 (P1a: trạng thái kết thúc), GUC-15, BLK-035, GUC-10 |
| UC-014 | Alternative 2B | 2B. AI lỗi hoặc quá thời gian: Hệ thống kết thúc lượt xử lý ở trạng thái lỗi, báo lỗi kèm bước người dùng có thể làm tiếp, kết thúc UC. | 2B. ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032: Hệ thống kết thúc lượt xử lý ở trạng thái Lỗi, báo lỗi kèm bước người dùng có thể làm tiếp, kết thúc Use Case. | BLK-047, BLK-001 (P1a), GUC-11, GUC-10 |
| UC-014 | Alternative 2C | 2C. Người dùng gửi yêu cầu mới khi lượt xử lý đang chạy: Hệ thống yêu cầu chờ hoặc dừng lượt hiện tại (BR-014), sau đó quay lại bước 2. | 2C. Người dùng gửi yêu cầu mới khi lượt xử lý đang chạy: Hệ thống yêu cầu chờ hoặc dừng lượt hiện tại (BR-014), quay lại bước 2. | GUC-10 |
| UC-014 | Alternative 2D | — (tách từ 2B gốc) | 2D. ACT-002 trả lỗi thay vì kết quả, hoặc Hệ thống không kết nối được ACT-002 (R-032): Hệ thống kết thúc lượt xử lý ở trạng thái Lỗi, báo lỗi kèm bước người dùng có thể làm tiếp, kết thúc Use Case. | BLK-047 (P6) |
| UC-014 | Postconditions 1 | Lượt xử lý kết thúc ở một trong ba trạng thái: xong, đã dừng hoặc lỗi. | Lượt xử lý kết thúc ở một trong ba trạng thái: Hoàn tất, Đã dừng hoặc Lỗi. | BLK-001 (P1a) |
| UC-014 | Câu hỏi mở 1 | Lượt tạo file tải về có cần dừng được không? | — (bỏ) | BLK-048 (P6) |
| UC-014 | Câu hỏi mở 2 | Ngưỡng quá thời gian là bao nhiêu? (đặt sau benchmark, D-011) | — (bỏ) | BLK-001 (P1a), BLK-030 (D-011 đã xóa) |
| UC-014 | Ghi chú 1 | — (thêm mới) | V1 không dừng được lượt tạo file tải về (D-029). | BLK-048 (P6) |
| UC-014 | Ghi chú 2 | — (thêm mới) | Nhánh 2B và 2D chỉ áp cho lượt xử lý AI tạo hoặc sửa deck, không áp cho lượt tạo file tải về. | BLK-048 (lời gọi của agent chính), GUC-16 (giới hạn phạm vi ghi ở Ghi chú) |
| UC-014 | Ghi chú 3 | — (thêm mới) | Kết quả sai định dạng (`Hành vi lỗi` 3 của ACT-002) không có nhánh ở Use Case này: nhánh kiểm tra kết quả (R-033) của Use Case gọi UC-014 xử lý trường hợp này. | BLK-047 ("sai định dạng" thuộc nhánh R-033), GUC-12 (lý do bỏ qua) |
| UC-014 | Ghi chú 4 | — (thêm mới) | Thay đổi hành vi giữa các phiên bản model (`Hành vi lỗi` 4 của ACT-002) không có nhánh: Hệ thống không phát hiện được thay đổi này trong một lượt xử lý AI; kết quả sai vẫn bị chặn ở kiểm tra kết quả (R-033). | BLK-047 (P6), GUC-12 |
| UC-015 | title | Xem trước deck ngay trong ứng dụng | Người dùng xem trước deck trong DeckAgent trước khi giữ, sửa hoặc tải về | GUC-01, GX-08 ("ngay"), PLAN.md mục 4 |
| UC-015 | Tình huống | AI vừa sửa xong deck. Tôi muốn lướt qua từng slide để xem đã đúng ý chưa trước khi giữ hoặc tải về. | Tôi có deck AI vừa sửa xong, tôi muốn lướt qua từng slide, để xem deck đã đúng ý chưa trước khi giữ hoặc tải về. | GUC-04 |
| UC-015 | Trigger | Lượt tạo, sửa hoặc bỏ lần sửa hoàn tất; hoặc người dùng mở xem trước. | Hệ thống hoàn tất lượt tạo, sửa hoặc bỏ lần sửa, hoặc người dùng mở xem trước. | GUC-06 (bắt đầu bằng chủ ngữ) |
| UC-015 | Alternative 1A | 1A. Không hiển thị được deck: Hệ thống báo lỗi, deck không thay đổi, kết thúc UC. | 1A. Hệ thống không dựng được bản xem trước của deck: Hệ thống báo lỗi, deck không thay đổi, kết thúc Use Case. | GUC-11, GUC-10, PLAN.md mục 4 |
| UC-015 | Alternative 1B | 1B. Có thành phần không hiển thị được: Hệ thống đánh dấu thành phần bị ảnh hưởng, tiếp tục bước 2. | 1B. Có thành phần không hiển thị được: Hệ thống đánh dấu thành phần bị ảnh hưởng, quay lại bước 2. | GUC-10 |
| UC-015 | Ghi chú 1 | Xem trước là căn cứ để người dùng quyết định trước khi tải về. | — (bỏ; section Ghi chú xóa vì trống) | GX-12 (lặp Mục tiêu), PLAN.md mục 4 |
| UC-016 | title | Duyệt và sửa dàn ý trước khi AI tạo cả deck | Người dùng duyệt và sửa dàn ý trước khi AI tạo cả deck | GUC-01 |
| UC-017 | title | Chọn theme hoặc bộ nhận diện (màu, font, logo) cho cả deck | Người dùng chọn theme hoặc bộ nhận diện cho cả deck | GUC-01, PLAN.md mục 4 |
| UC-017 | Tình huống | Deck gửi khách hàng phải dùng màu xanh và logo của công ty. Tôi muốn chọn bộ nhận diện một lần và mọi slide tự theo. | Tôi có deck gửi khách hàng phải dùng màu xanh và logo của công ty, tôi muốn chọn bộ nhận diện một lần, để mọi slide tự theo bộ nhận diện đó. | GUC-04 |
| UC-017 | Mục tiêu | Mọi slide trong deck dùng thống nhất một theme hoặc bộ nhận diện người dùng chọn. | Người dùng chỉ chọn theme hoặc bộ nhận diện một lần cho cả deck. | GUC-05 (không lặp Postconditions 1), PLAN.md mục 4 |
| UC-017 | Preconditions 1 | Theme có trong danh sách của DeckAgent, hoặc người dùng cung cấp màu, font và logo. | Theme có trong danh sách của Hệ thống, hoặc người dùng cung cấp màu, font và logo. | BLK-068 |
| UC-017 | Main Flow 4 | Người dùng xem trước (UC-015), sau đó giữ hoặc bỏ. | Người dùng xem trước (UC-015), rồi giữ hoặc bỏ. | GX-08 ("sau đó") |
| UC-017 | Alternative 1A | 1A. Font hoặc logo không dùng được: Hệ thống báo và dùng theme mặc định cho phần đó, tiếp tục bước 2. | 1A. Font hoặc logo không dùng được: Hệ thống báo và dùng theme mặc định cho phần đó, quay lại bước 2. | GUC-10 |
| UC-017 | Postconditions 1 | Mọi slide dùng cùng một theme. | Mọi slide dùng cùng một theme (BR-017). | GUC-15, PLAN.md mục 4 |
| UC-017 | Câu hỏi mở 1 | Chỉ có theme dựng sẵn hay cho người dùng tự tạo bộ nhận diện? | Chỉ có theme dựng sẵn hay cho người dùng tự tạo bộ nhận diện? (nơi xử lý: R-047) | GUC-18, PLAN.md mục 4 |
| UC-017 | Câu hỏi mở 2 | Có nhận template PPTX làm bộ nhận diện không? | Có nhận file PPTX của tổ chức làm bộ nhận diện không? (nơi xử lý: R-047) | GX-07 ("template"), PLAN.md mục 4, GUC-18 |
| UC-017 | Ghi chú 1 | Nhu cầu đổi phong cách cả deck đang được theo dõi ở L-002. | Đổi phong cách cả deck không thuộc Use Case này. | PLAN.md mục 4, assess-use-cases.md mục 5 (bỏ L-002); xem Không áp rõ 6 |
| UC-018 | title | Xem và xóa các tài liệu đã tải lên | Người dùng xem và xóa các tài liệu đã tải lên | GUC-01 |
| UC-018 | Tình huống | … tôi muốn chắc chắn file đó bị xóa khỏi DeckAgent. | … tôi muốn chắc chắn file đó bị xóa khỏi Hệ thống. | BLK-068 |
| UC-018 | Mục tiêu | Người dùng biết DeckAgent đang giữ tài liệu nào của mình và xóa được chúng. | Người dùng biết Hệ thống đang giữ tài liệu nào của mình và xóa được chúng. | BLK-068 |
| UC-018 | Preconditions 1 | DeckAgent lưu tài liệu qua nhiều lần làm việc (R-048). | Hệ thống lưu tài liệu qua nhiều lần làm việc (R-048). | BLK-068 |
| UC-018 | Câu hỏi mở 1 | DeckAgent giữ tài liệu mặc định bao lâu? | Hệ thống giữ tài liệu mặc định bao lâu? | BLK-068 |
| UC-019 | title | Chia sẻ deck qua link hoặc trình chiếu trong trình duyệt | Người dùng chia sẻ deck qua link hoặc trình chiếu trong trình duyệt | GUC-01 |
| UC-019 | Preconditions 2 | DeckAgent được host trên internet. | Hệ thống được host trên internet. | BLK-068 |
| UC-019 | Ghi chú 1 | Cần host DeckAgent trên internet; V1 không có. | Cần host Hệ thống trên internet; V1 không có. | BLK-068 |
| UC-020 | Mục tiêu | Quản trị viên kiểm soát ai được dùng DeckAgent. | Quản trị viên kiểm soát ai được dùng Hệ thống. | BLK-068 |
| UC-020 | Câu hỏi mở 1 | Quản trị tài khoản làm trong DeckAgent hay qua hệ thống bên ngoài? | Quản trị tài khoản làm trong Hệ thống hay qua hệ thống bên ngoài? | BLK-068 |
| UC-020 | Ghi chú 1 | Chỉ cần khi DeckAgent có tài khoản. | Chỉ cần khi Hệ thống có tài khoản. | BLK-068 |
| UC-021 | title | Mở lại deck đã làm ở lần dùng trước | Người dùng mở lại deck đã lưu từ lần làm việc trước | GUC-01, GX-07 ("lần làm việc"), PLAN.md mục 4 |
| UC-021 | Tình huống | Hôm qua tôi làm dở deck cho buổi thuyết trình thứ Hai. Hôm nay tôi muốn mở lại đúng chỗ đó để làm tiếp. | Tôi có deck làm dở hôm qua cho buổi thuyết trình thứ Hai, tôi muốn mở lại đúng chỗ đó, để làm tiếp. | GUC-04 |
| UC-021 | Preconditions 1 | DeckAgent lưu được deck qua nhiều lần làm việc (R-048). | Hệ thống lưu được deck qua nhiều lần làm việc (R-048). | BLK-068 |
| UC-021 | Alternative 1A | 1A. Người dùng đổi tên deck: Hệ thống cập nhật tên, sau đó quay lại bước 1. | 1A. Người dùng đổi tên deck: Hệ thống cập nhật tên, quay lại bước 1. | GUC-10 |
| UC-021 | Alternative 1B | 1B. Người dùng xóa deck: Hệ thống yêu cầu xác nhận, xóa deck cùng tài liệu liên quan, sau đó quay lại bước 1. | 1B. Người dùng xóa deck: Hệ thống yêu cầu xác nhận, xóa deck cùng tài liệu liên quan, quay lại bước 1. | GUC-10 |
| UC-021 | Alternative 3A | 3A. Không khôi phục được deck: Hệ thống báo lỗi, sau đó quay lại bước 1. | 3A. Hệ thống không khôi phục được deck: Hệ thống báo lỗi, quay lại bước 1. | GX-16, GUC-10 |
| UC-021 | Câu hỏi mở 1 | Một lần làm việc chứa một hay nhiều deck? | Một lần làm việc chứa một hay nhiều deck? (nơi xử lý: R-048) | GUC-18, PLAN.md mục 4 |
| UC-021 | Câu hỏi mở 2 | Có thùng rác để khôi phục deck đã xóa không? | Có thùng rác để khôi phục deck đã xóa không? (nơi xử lý: R-048) | GUC-18, PLAN.md mục 4 |
| UC-021 | Ghi chú 1 | Cần mở lại D-027. | Use Case này cần mở lại D-027. | GX-16 |
| UC-022 | title | Xem các bản cũ và khôi phục một bản bất kỳ | Người dùng xem lịch sử các bản đã chấp nhận và khôi phục một bản | GUC-01, GX-08 ("bất kỳ"), PLAN.md mục 4 |
| UC-022 | Tình huống | Qua 5 lần sửa, tôi nhận ra bản ở lần sửa thứ 2 là tốt nhất. Tôi muốn quay về đúng bản đó. | Tôi có deck đã qua 5 lần sửa và bản ở lần sửa thứ 2 là tốt nhất, tôi muốn quay về đúng bản đó, để dùng lại bản tốt nhất, không chỉ bản trước lần sửa gần nhất. | GUC-04 (vế "để" lấy từ Mục tiêu) |
| UC-022 | Mục tiêu | Người dùng quay về bất kỳ bản đã chấp nhận nào trước đây, không chỉ bản ngay trước. | Người dùng quay về một bản đã chấp nhận trong lịch sử, không chỉ bản trước lần sửa gần nhất. | GX-08 ("bất kỳ", "ngay"), PLAN.md mục 4 |
| UC-022 | Alternative 4A | 4A. Khôi phục thất bại: Hệ thống báo lỗi, bản đã chấp nhận hiện tại giữ nguyên, kết thúc UC. | 4A. Khôi phục thất bại: Hệ thống báo lỗi, bản đã chấp nhận hiện tại giữ nguyên (BR-010), kết thúc Use Case. | GUC-15 (PLAN.md ghi BR-005; BR-005 đã xóa, chuyển sang BR-010 theo CX-1), GUC-10 |
| UC-022 | Câu hỏi mở 1 | Hệ thống giữ tối đa bao nhiêu bản? | Hệ thống giữ tối đa bao nhiêu bản? (nơi xử lý: R-016) | GUC-18, PLAN.md mục 4 |
| UC-022 | Ghi chú 1 | Mở rộng của UC-013, vốn chỉ quay lại một bước. | Use Case này mở rộng UC-013; UC-013 chỉ quay lại được một bước. | GX-16 |
| UC-023 | title | Yêu cầu AI chỉ sửa một slide hoặc một thành phần, không đụng phần còn lại | Người dùng yêu cầu AI sửa cục bộ một slide hoặc một thành phần | GUC-01, GX-07 ("sửa cục bộ"), PLAN.md mục 4 |
| UC-023 | Tình huống | Deck đã ổn, chỉ có biểu đồ ở slide 6 ghi sai năm. Tôi muốn AI sửa đúng chỗ đó và chắc chắn 11 slide còn lại không bị đổi. | Tôi có deck đã ổn, chỉ có biểu đồ ở slide 6 ghi sai năm, tôi muốn AI sửa đúng chỗ đó, để chắc chắn 11 slide còn lại không bị đổi. | GUC-04 |
| UC-023 | Main Flow 5 | Người dùng xem trước bản chờ duyệt, sau đó giữ hoặc bỏ. | Người dùng xem trước bản chờ duyệt, rồi giữ hoặc bỏ. | GX-08 ("sau đó") |
| UC-023 | Alternative 3A | 3A. Yêu cầu cần đổi cả phần ngoài phạm vi: Hệ thống báo và hỏi người dùng có mở rộng phạm vi không. | 3A. Yêu cầu cần đổi cả phần ngoài phạm vi: Hệ thống báo và hỏi người dùng có mở rộng phạm vi không (BR-004). | GUC-15, PLAN.md mục 4 |
| UC-023 | Alternative 3B | 3B. Sửa thất bại: Hệ thống báo lỗi, phần ngoài phạm vi không bị ảnh hưởng, bản đã chấp nhận giữ nguyên, kết thúc UC. | 3B. Sửa thất bại: Hệ thống báo lỗi, phần ngoài phạm vi không bị ảnh hưởng, bản đã chấp nhận giữ nguyên (BR-010), kết thúc Use Case. | GUC-15 (PLAN.md ghi BR-005; chuyển sang BR-010 theo CX-1), GUC-10 |
| UC-023 | Alternative 4A | 4A. Phát hiện phần ngoài phạm vi bị đổi: Hệ thống không hiển thị kết quả, báo lỗi, kết thúc UC. | 4A. Hệ thống phát hiện phần ngoài phạm vi bị đổi: Hệ thống không hiển thị kết quả, báo lỗi, kết thúc Use Case. | GX-16, GUC-10 |
| UC-023 | Alternative 5A | 5A. Người dùng bỏ bản chờ duyệt: Chuyển sang UC-013. | 5A. Người dùng bỏ bản chờ duyệt: Hệ thống chuyển sang UC-013. | GX-16, GUC-10 |
| UC-023 | Postconditions 1 | Chỉ phần trong phạm vi đã chọn bị thay đổi. | Chỉ phần trong phạm vi đã chọn bị thay đổi (BR-004). | GUC-15, PLAN.md mục 4 |
| UC-023 | Ghi chú 2 | Mở lại nếu nhiều người dùng cần sửa đúng một slide (L-002). | Mở lại Use Case này nếu nhiều người dùng cần sửa đúng một slide. | PLAN.md mục 4 (bỏ L-002), GX-16 |
| UC-024 | title | Thêm, xóa, sắp xếp slide và chèn hình ảnh vào deck | Người dùng thêm, xóa, sắp xếp slide và chèn hình ảnh vào deck | GUC-01 |
| UC-024 | Tình huống | Tôi muốn thêm một slide ảnh chụp sản phẩm sau slide 3 và đưa slide kết luận lên trước phần hỏi đáp. | Tôi có deck cần đổi cấu trúc slide, tôi muốn thêm một slide ảnh chụp sản phẩm sau slide 3 và đưa slide kết luận lên trước phần hỏi đáp, để không phải chuyển sang công cụ khác. | GUC-04 (vế "để" lấy từ Mục tiêu) |
| UC-024 | Alternative 2A | 2A. Thao tác thất bại: Hệ thống báo lỗi, bản đã chấp nhận giữ nguyên, kết thúc UC. | 2A. Thao tác thất bại: Hệ thống báo lỗi, bản đã chấp nhận giữ nguyên (BR-010), kết thúc Use Case. | GUC-15 (PLAN.md ghi BR-005; chuyển sang BR-010 theo CX-1), GUC-10 |
| UC-024 | Câu hỏi mở 1 | Hiểu ảnh, dùng ảnh làm asset và dùng lại ảnh nhúng trong tài liệu sẽ mở theo thứ tự nào? (L-001) | Hiểu ảnh, dùng ảnh làm asset và dùng lại ảnh nhúng trong tài liệu sẽ mở theo thứ tự nào? (nơi xử lý: R-017) | PLAN.md mục 4 (bỏ L-001), GUC-18 |
| UC-024 | Ghi chú 1 | Thay cho UC-006 đã xóa; ID UC-006 không dùng lại. | Use Case này thay cho UC-006 đã xóa; ID UC-006 không dùng lại. | GX-16 |
| UC-025 | title | Dịch cả deck sang ngôn ngữ khác | Người dùng dịch cả deck sang ngôn ngữ khác | GUC-01 |
| UC-025 | Tình huống | Deck tiếng Việt đã xong, tuần sau tôi phải trình bày cho đối tác Nhật. Tôi muốn có bản tiếng Anh giữ nguyên số liệu và bố cục vẫn đọc được. | Tôi có deck tiếng Việt đã xong, tôi muốn có bản tiếng Anh giữ nguyên số liệu và bố cục vẫn đọc được, để trình bày cho đối tác Nhật vào tuần sau. | GUC-04 |
| UC-025 | Preconditions 2 | Ngôn ngữ đích có trong danh sách của DeckAgent. | Ngôn ngữ đích có trong danh sách của Hệ thống. | BLK-068 |
| UC-025 | Main Flow 4 | Người dùng xem trước bản chờ duyệt, sau đó giữ hoặc bỏ. | Người dùng xem trước bản chờ duyệt, rồi giữ hoặc bỏ. | GX-08 ("sau đó") |
| UC-025 | Alternative 4A | 4A. Người dùng bỏ bản chờ duyệt: Chuyển sang UC-013. | 4A. Người dùng bỏ bản chờ duyệt: Hệ thống chuyển sang UC-013. | GX-16, GUC-10 |
| UC-025 | Câu hỏi mở 1 | Font, bố cục và định dạng tải về cho từng ngôn ngữ được kiểm chứng thế nào? | Font, bố cục và định dạng tải về cho từng ngôn ngữ được kiểm chứng thế nào? (nơi xử lý: R-044) | GUC-18, PLAN.md mục 4 |
| UC-025 | Ghi chú 1 | Đã chắc chắn là capability tương lai, không còn là câu hỏi có cần hay không. | Dịch cả deck đã chắc chắn là capability tương lai, không còn là câu hỏi có cần hay không. | GX-16 |

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| 24 item | Tình huống, Goal / Outcome, Trigger, Preconditions, Main Flow, Alternative / Failure Flows, Postconditions, Open Questions, Product Reference, Ghi chú | Tình huống, Mục tiêu, Trigger, Preconditions, Main Flow, Alternative / Failure Flows, Postconditions, Câu hỏi mở, Sản phẩm tham khảo, Ghi chú (GX-06) |
| UC-004 | Main Flow bước 4, 5 | Main Flow bước 5, 6 (đánh số lại sau khi bước 2' thành bước 3; chữ không đổi) |
| UC-008 | Main Flow bước 7 | Alternative / Failure Flows 6A (có viết lại, xem bảng trên) |
| UC-008 | Postconditions 2 (vế "chỉ khi tải về thành công") | Bảo đảm tối thiểu 1 (có viết lại, xem bảng trên) |
| UC-008 | Postconditions 5 | Ghi chú 3 (có viết lại, xem bảng trên) |
| UC-011 | Quan hệ UC (lời giải thích của "Liên quan: UC-014") | Ghi chú 3 (có viết lại, xem bảng trên) |

## Sửa quan hệ

Không có. Frontmatter giữ đúng quan hệ khung B3 đã ghi; `title` viết lại theo PLAN.md mục 4 (GUC-01) và ghi ở bảng trên. Các cặp `related` ghi ở hai phía nằm ở mục Không áp rõ 1.

## Cần sửa ở loại khác

1. BR-010 (business-rules): các nhánh sau nay chỉ tham chiếu "BR-010", không kèm số điều, nên `Bảng chuyển trạng thái` cần có dòng tương ứng: lượt tạo đầu tiên bị dừng, quá thời gian, lỗi kết nối hoặc không qua kiểm tra thì không tạo bản (UC-001 4A–5A, UC-002 5B–6A); hủy ở bước hỏi lại hoặc cảnh báo trước ranh giới commit (UC-004 2D, 2E); dừng, lỗi, không qua kiểm tra sau ranh giới commit (UC-004 4A–5A); hủy hoặc thất bại khi tải về (UC-008 3B, 4A, 5A); khôi phục, sửa cục bộ, thao tác slide thất bại (UC-022 4A, UC-023 3B, UC-024 2A).
2. BR-010 (business-rules): `use_cases` chưa có UC-023, UC-024, nay hai Use Case này tham chiếu BR-010 thay cho BR-005 (PLAN.md mục 4 ghi BR-005; CX-1). Cân nhắc thêm.
3. BR-014 (business-rules): UC-011 nhánh 1A tham chiếu BR-014 (PLAN.md mục 4) nhưng `use_cases` của BR-014 không có UC-011.
4. BR-013 (business-rules): UC-007 nhánh 2B tham chiếu BR-013 (PLAN.md mục 4) nhưng `use_cases` của BR-013 không có UC-007.
5. R-003 (requirements): UC-002 bước 2 và nhánh 2B, UC-003 nhánh 1A ghi "giới hạn của R-003". `Miền đầu vào` của R-003 cần đủ bốn giới hạn của P1b, gồm PPTX ≤ 50 slide cho UC-003.
6. R-032 (requirements): nhánh quá thời gian của UC-001 (4B), UC-002 (5C), UC-004 (4B), UC-014 (2B) không ghi số; R-032 cần nêu ngưỡng riêng cho lượt tạo (UC-001, UC-002) và lượt sửa (UC-004). Nhánh lỗi kết nối (UC-001 4C, UC-002 5D, UC-004 4C, UC-014 2D) tham chiếu R-032 cho cả "trả lỗi thay vì kết quả" và "không kết nối được".
7. R-033 (requirements): nhánh kiểm tra kết quả của UC-001, UC-002, UC-004 ghi "gồm kết quả sai định dạng". Acceptance của R-033 nên có một case kết quả sai định dạng, cạnh case kết quả hỏng của BLK-059.
8. ACT-001 (actors, đã dịch): Permissions 3 "Trả lời hoặc hủy khi hệ thống hỏi lại" ghi UC-007, UC-023; hai Use Case Proposed này chỉ có nhánh trả lời (UC-007 2A, UC-023 3A), chưa có nhánh hủy (BLK-053 chỉ áp UC-001, UC-002). Nhánh hủy có ở UC-001 3B, UC-002 4B và 5E, UC-004 2D.
9. ACT-002 (actors, đã dịch): Permissions 1 không ghi UC-003 và UC-014, khớp nội dung hiện tại của hai Use Case này (UC-003 không có bước AI; UC-014 chỉ có nhánh lỗi). Không cần sửa nếu Không áp rõ 7 giữ nguyên `supporting_actors`.
10. Glossary (B5): UC-004 dùng "ranh giới commit" và "tập ràng buộc"; UC-002, UC-004, UC-014 dùng tên ba trạng thái kết thúc "Hoàn tất", "Đã dừng", "Lỗi" của lượt xử lý AI. Nên có thuật ngữ cho các cụm này (FILL_LATER.md đã ghi hai cụm đầu).

## Không áp rõ

1. **`related` ghi ở cả hai phía (GX-05).** Khung B3 giữ cả hai phía cho 6 cặp: UC-005↔UC-008, UC-007↔UC-017, UC-009↔UC-020, UC-010↔UC-014, UC-011↔UC-014, UC-015↔UC-019. UC-015 còn có `related: [UC-004, UC-008, UC-013]` trùng `include` từ phía kia (cột "Dẫn tới" của sheet).
   - Phương án: (a) giữ như khung (đã làm, vì không có quyết định đổi quan hệ cho Use Case); (b) giữ ở item có ID nhỏ hơn và bỏ UC-004, UC-008, UC-013 khỏi `UC-015.related` (assess-use-cases.md mục 6 ý 3, PLAN.md mục 4 dòng UC-008, UC-015).
   - Đề xuất: (b), sửa ở script khung hoặc ở B6, vì GX-05 là CI.
2. **Điểm kết thúc "tiếp tục bước X".** GUC-10 chỉ cho ba dạng "quay lại bước X", "kết thúc Use Case", "chuyển sang UC-xxx"; PLAN.md mục 4 và dịch thử UC-008 dùng "tiếp tục bước X". Đã viết "quay lại bước X" cả khi nhánh nối vào bước sau (UC-002 5A, UC-004 2B, UC-007 2B, UC-008 3A, UC-011 2A, UC-015 1B, UC-017 1A).
   - Phương án: (a) giữ "quay lại bước X" (đã làm); (b) thêm "tiếp tục bước X" vào dạng của GUC-10 rồi đổi các dòng trên.
   - Đề xuất: (b), vì "quay lại" bước sau dễ đọc nhầm; cần sửa `_CRITERIA.md`.
3. **UC-020 nhánh 2A (xóa tài khoản thì xóa deck theo).** Lệch với ACT-003 Needs 1 ("không can thiệp vào nội dung deck") và Câu hỏi mở 2 của chính UC-020. Giữ nguyên chữ sheet (Draft).
   - Phương án: (a) giữ tới khi UC-020 lên Proposed; (b) viết lại 2A theo câu trả lời của Câu hỏi mở 2.
   - Đề xuất: (a); trả lời Câu hỏi mở 2 trước khi UC-020 lên Proposed.
4. **UC-019 vai "Người xem".** Bước 3 và Postconditions dùng vai chưa có Actor. Giữ nguyên chữ sheet (Draft).
   - Phương án: (a) thêm Actor người xem khi UC-019 lên Proposed; (b) tách phần người xem thành Use Case riêng; (c) viết lại bước 3 theo kết quả quan sát được của người dùng.
   - Đề xuất: (a) hoặc (b), quyết khi UC-019 lên Proposed (UC-019 còn gộp hai mục tiêu, GUC-03).
5. **UC-013 không còn Precondition.** Bỏ Precondition 1 theo GUC-07 làm section trống; template không ghi "Xóa section nếu trống" cho Preconditions. Đã xóa section (assess-use-cases.md mục 6 ý 13).
   - Phương án: (a) xóa section (đã làm); (b) giữ heading trống.
   - Đề xuất: (a); Preconditions không thuộc `required_sections`.
6. **UC-017 Ghi chú 1.** Sheet: "Nhu cầu đổi phong cách cả deck đang được theo dõi ở L-002." Bỏ L-002 thì câu không còn nơi theo dõi; đã dùng câu của assess-use-cases.md mục 5 "Đổi phong cách cả deck không thuộc Use Case này", hơi khác nghĩa (giới hạn phạm vi thay vì việc đang theo dõi).
   - Phương án: (a) giữ câu mới; (b) "Nhu cầu đổi phong cách cả deck chưa có Use Case." ; (c) bỏ dòng.
   - Đề xuất: (a), cần người dùng xác nhận.
7. **UC-003 `supporting_actors: [ACT-002]`.** Không bước nào của UC-003 cho ACT-002 làm việc; bước sửa đi qua UC-004 (rewrite-log-actors.md, Cần sửa ở loại khác 1). Giữ như khung.
   - Phương án: (a) giữ, ghi lý do khi UC-003 lên Active; (b) bỏ ACT-002 (đổi quan hệ).
   - Đề xuất: (b) khi UC-003 quay lại phạm vi; hiện UC-003 ở Proposed nên GUC-12 chưa áp.
8. **UC-011 Câu hỏi mở 1.** BLK-060 đã quyết "File tạm bị xóa khi lần làm việc kết thúc" (R-042). Câu hỏi có thể đã có trả lời một phần; đã giữ câu với nơi xử lý R-042.
   - Phương án: (a) giữ (đã làm); (b) bỏ câu hỏi nếu R-042 coi tài liệu có sẵn là file tạm.
   - Đề xuất: (b) sau khi R-042 được viết ở bước requirements.
9. **UC-001 Postconditions 3 "Deck có nhiều slide".** P1e bỏ điều kiện "nhiều slide" ở R-006 nhưng không nhắc UC-001. Giữ chữ sheet.
   - Phương án: (a) giữ; (b) đổi thành "Deck xem trước được." cho khớp P1e.
   - Đề xuất: (b), cần người dùng xác nhận vì đổi Postconditions của item Active.
10. **UC-004 Postconditions sau BLK-050, BLK-035.** Ô Quyết định ghi "Postconditions 1 chuyển thành tham chiếu BR-010" mà không cho câu. Đã viết Postconditions 2–3 thành điều đúng lúc Use Case kết thúc (bản chờ duyệt trước đó đã được chấp nhận tại ranh giới commit; ràng buộc mới đi cùng bản chờ duyệt mới), kèm BR-010.
    - Phương án: (a) giữ cách viết này; (b) chỉ ghi một dòng tóm tắt "vòng đời bản chờ duyệt theo BR-010" (khó kiểm chứng, GUC-13).
    - Đề xuất: (a); người dùng duyệt trong diff.
11. **BR-010 hay BR-014 cho "không tạo deck" khi dừng hoặc lỗi.** PLAN.md mục 4 ghi BR-014 cho UC-001 4A, 4B và UC-014 2A; BLK-035 rút BR-014 mục 2 về tóm tắt kèm BR-010. Đã tham chiếu BR-010 (item sở hữu, GX-10); BR-014 vẫn dùng cho "mỗi lúc một lượt" (UC-011 1A, UC-014 2C).
    - Đề xuất: giữ.
12. **UC-014 Postconditions 1–2 đúng ở mọi nhánh.** Hai điều này giống Bảo đảm tối thiểu hơn Postconditions (GUC-13); FILL_LATER.md chỉ gợi ý chuyển, không phải quyết định. Giữ ở Postconditions.
    - Phương án: (a) giữ; (b) chuyển sang Bảo đảm tối thiểu, Postconditions còn "Lượt xử lý kết thúc ở trạng thái Hoàn tất".
    - Đề xuất: (b) khi điền Bảo đảm tối thiểu.

## Sửa của agent chính sau khi subagent trả về

| ID | Chỗ sửa | Trước | Sau | Lý do |
|---|---|---|---|---|
| UC-017 | Ghi chú 1 | Đổi phong cách cả deck không thuộc Use Case này. | Kết luận về nhu cầu đổi phong cách cả deck nằm ở D-025. | Câu của subagent đổi nghĩa (sheet: "đang được theo dõi ở L-002"); P8 BLK-062: kết luận của L-002 nằm ở D-025 |
| UC-008 | `related` | [UC-005] | [] | GX-05: cặp UC-005 ↔ UC-008 ghi ở cả hai phía; giữ phía ID nhỏ hơn |
| UC-017 | `related` | [UC-007] | [] | GX-05: giữ ở UC-007 |
| UC-020 | `related` | [UC-009] | [] | GX-05: giữ ở UC-009 |
| UC-014 | `related` | [UC-010, UC-011] | [] | GX-05: giữ ở UC-010, UC-011 |
| UC-019 | `related` | [UC-008, UC-015] | [UC-008] | GX-05: cặp UC-015 ↔ UC-019 giữ ở UC-015 |
| UC-015 | `related` | [UC-004, UC-008, UC-013, UC-019] | [UC-019] | GX-05: UC-004, UC-008, UC-013 đã `include` UC-015; `related` ở UC-015 là chiều ngược của cùng quan hệ |

## Áp trả lời CX-4…CX-8 của người dùng (agent chính, 2026-10-05)

Xem `APPLY.md` mục 8. File sửa: UC-002 (nhánh 4A "mục đích hoặc audience" → "chủ đề hoặc mục đích" (R-002); thêm Ghi chú 3; CX-5); UC-022 nhánh 4A, UC-024 nhánh 2A (bỏ "(BR-010)"; CX-8).
