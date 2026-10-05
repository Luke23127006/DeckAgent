# Pha B dừng sau bước B4: 5 điểm cần bạn quyết định

## Bối cảnh

Pha B chuyển spec của DeckAgent từ Google Sheet cũ sang file Markdown trong `docs/specification/`. Sau khi bạn trả lời {CX-1}, {CX-2}, {CX-3}, Pha B đã làm tiếp và commit trên branch `spec/migrate-sheet` (chưa push):

1. B3: sinh khung cho 141 file item (156 item của sheet, trừ 20 item bị xóa, cộng 5 ID mới).
2. B4: dịch nội dung cả 7 loại item, mỗi loại một subagent và một commit. Mọi chỗ viết lại câu được ghi trong `docs/specification/_migration/work/rewrite-log-<loại>.md`.

Khi dịch, 5 chỗ không áp rõ được từ `DECISIONS.md` và các câu trả lời trước. Mỗi chỗ hoặc mâu thuẫn với một quyết định khác, hoặc cần một hành vi mà sheet không có. Theo quy trình đã thống nhất, Pha B dừng ở đây, trước B5. Ở mỗi chỗ, file hiện giữ chữ gần nhất với sheet.

**Cách trả lời:** mỗi điểm một dòng, ví dụ "{CX-4}: ràng buộc cũ áp dụng lại". Nếu bạn sửa nội dung, ghi nội dung mới.

## {CX-4}

**Vấn đề.** {BLK-043} đặt hai quy tắc mới cho ràng buộc của người dùng, nay nằm ở {BR-003}:
1. Ràng buộc kèm cụm "chỉ lần này" chỉ áp cho một lần sửa, rồi hết hiệu lực.
2. Ràng buộc mới cùng loại, xung đột với ràng buộc đang có hiệu lực, thì thay ràng buộc cũ.

Hai quy tắc cho kết quả khác nhau khi gặp nhau. Ví dụ: ràng buộc đang có hiệu lực là "deck 10 slide"; người dùng gõ "chỉ lần này, rút còn 5 slide". Sau lần sửa đó, lần sửa kế tiếp có áp lại "10 slide" không?
- Theo quy tắc 2, "5 slide" đã thay "10 slide", nên "10 slide" mất.
- Theo quy tắc 1, "5 slide" hết hiệu lực sau lần sửa. Kết quả là deck không còn ràng buộc độ dài nào, điều người dùng có lẽ không muốn.

{R-024} có Acceptance 2 và 3 kiểm hai quy tắc này riêng rẽ, nên test của trường hợp trên không phán được. {BR-003} và {R-024} đều Active.

**Phương án**
- **Ràng buộc cũ áp dụng lại.** Ràng buộc "chỉ lần này" không thay ràng buộc đang có hiệu lực. Trong lần sửa đó, ràng buộc "chỉ lần này" được dùng; sau lần sửa, ràng buộc cũ áp dụng lại. {BR-003} thêm một mệnh đề và một `Bảng quyết định`; {R-024} thêm một Acceptance cho trường hợp này.
- **Cả hai mất.** Ràng buộc "chỉ lần này" thay ràng buộc cũ, rồi hết hiệu lực sau lần sửa; deck không còn ràng buộc loại đó. Cũng thêm mệnh đề và Acceptance như trên.

**Đề xuất:** ràng buộc cũ áp dụng lại, vì cụm "chỉ lần này" cho thấy người dùng muốn một ngoại lệ tạm thời, không muốn bỏ ràng buộc cũ.

## {CX-5}

**Vấn đề.** Theo {BLK-015}, {R-002} hỏi lại khi yêu cầu thiếu chủ đề hoặc thiếu mục đích của deck, và bạn đã xác nhận không có trường hợp nào khác. Nhưng nhánh 4A của {UC-002} trên sheet hỏi lại khi "Yêu cầu không nêu mục đích hoặc audience và tài liệu cũng không cho biết". Use Case hỏi về audience, Requirement không hỏi. Cả hai đều Active.

**Phương án**
- **Use Case khớp Requirement.** Nhánh 4A viết lại: "Yêu cầu không nêu chủ đề hoặc mục đích và tài liệu cũng không cho biết: Hệ thống hỏi lại người dùng ({R-002}), quay lại bước 4." Bỏ audience.
- **Requirement khớp Use Case.** {R-002} thêm audience vào điều kiện hỏi lại. Lựa chọn này sửa lại quyết định của {BLK-015}.
- **Giữ cả hai như sheet.** Hai item tiếp tục lệch nhau, người review sẽ nêu {GX-10}.

**Đề xuất:** Use Case khớp Requirement. Quyết định của {BLK-015} mới hơn sheet và đã nói rõ không có trường hợp khác.

## {CX-6}

**Vấn đề.** {P1d} đặt quy trình kiểm chứng chung cho 15 Assumption về người dùng: buổi thử với ≥ 5 người; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại; Supported nếu ≤ 1/5. Với đúng 5 người, hai ngưỡng phủ mọi kết quả. Với hơn 5 người thì có kết quả nằm giữa. Ví dụ, 2 trong 7 người là khoảng 29%: không ≥ 40%, cũng không ≤ 20%. `Cách kiểm chứng` phải nói cách xử lý kết quả nằm giữa ({GA-05}). Subagent hiện ghi "giữ Open", nhưng {P1d} không nói điều này.

**Phương án**
- **Tính theo tỷ lệ, kết quả nằm giữa thì giữ Open.** Invalidated khi tỷ lệ người cho thấy điều ngược lại ≥ 40%; Supported khi ≤ 20%; nằm giữa thì giữ Open và thử thêm người.
- **Mỗi buổi thử đúng 5 người.** Không có kết quả nằm giữa. Muốn thêm dữ liệu thì mở buổi thử mới, chấm riêng từng buổi.
- **Tính theo số người, không theo tỷ lệ.** Invalidated khi ≥ 2 người cho thấy điều ngược lại, bất kể tổng số người; ngược lại thì Supported.

**Đề xuất:** tính theo tỷ lệ, kết quả nằm giữa thì giữ Open. Cách này giữ nguyên hai ngưỡng của {P1d} và không kết luận khi evidence chưa rõ.

## {CX-7}

**Vấn đề.** {BLK-010} đặt ngưỡng cho {A-018}: Supported nếu thời gian hoặc chi phí trung bình của "nhóm lượt xử lý khó" gấp ≥ 2 lần "nhóm dễ". Không quyết định nào nói lượt xử lý nào thuộc nhóm khó, lượt nào thuộc nhóm dễ. Thiếu điều này thì không chia được bộ đánh giá chung thành hai nhóm, và không chạy được phép kiểm chứng. {A-018} đang Open, mức sẵn sàng tương đương Active.

**Phương án**
- **Bạn định nghĩa hai nhóm** theo loại lượt xử lý mà {A-019} liệt kê: sửa chữ, viết lại theo ý, chèn nội dung, trau chuốt cả deck, thiết kế. Ví dụ: nhóm dễ là sửa chữ và chèn nội dung; nhóm khó là trau chuốt cả deck và thiết kế. Bạn chọn loại nào vào nhóm nào.
- **Để điền sau.** `Cách kiểm chứng` của {A-018} ghi tiêu chí chia nhóm là "điền sau", đưa vào danh sách điền sau. Việc này làm khi {R-035} (mức tính toán theo độ khó, release Later) quay lại phạm vi.

**Đề xuất:** để điền sau. {A-018} chỉ có {R-035}, {R-036}, {R-037} dựa vào, đều ở release Later, nên V1 chưa cần kết luận {A-018}.

## {CX-8}

**Vấn đề.** Theo {CX-1}, mọi chỗ trỏ tới {BR-005} chuyển sang {BR-010}. Hai Use Case release Later trỏ {BR-005} cho trường hợp mà {BR-005} cũ không nói tới:
1. {UC-022} nhánh 4A: "Khôi phục thất bại: Hệ thống báo lỗi, bản đã chấp nhận hiện tại giữ nguyên". {BR-005} cũ chỉ nói lượt tạo, sửa hoặc tải về thất bại. `Ghi chú` của {BR-010} còn ghi việc khôi phục nhiều bản cũ thuộc {UC-022}, ngoài {BR-010}.
2. {UC-024} nhánh 2A: "Thao tác thất bại" (thêm, xóa, sắp xếp slide, thay hình). Subagent coi đó là một lần sửa và đã thêm một dòng vào bảng chuyển trạng thái của {BR-010}.

Cả hai Use Case đều ở Proposed, release Later.

**Phương án**
- **Bỏ trỏ {BR-010} ở cả hai nhánh** và bỏ dòng {UC-024} khỏi bảng của {BR-010}. Hành vi trong câu của nhánh giữ nguyên. Hai trường hợp được quyết khi {UC-022}, {UC-024} lên Active.
- **Giữ cả hai trỏ {BR-010}.** {BR-010} thêm dòng cho "khôi phục thất bại", và bỏ câu "ngoài {BR-010}" trong `Ghi chú`.
- **Giữ như subagent làm.** {UC-024} trỏ {BR-010}, còn {UC-022} bỏ trỏ.

**Đề xuất:** bỏ trỏ {BR-010} ở cả hai nhánh. {BR-010} là quy tắc lõi của V1; chỉ nên chứa dòng rút được từ sheet và quyết định đã có.

## Để bạn biết: chỗ đã tự giải trong B3 và B4

Phần này không cần trả lời nếu bạn đồng ý.

1. **Quan hệ `related` ghi ở cả hai phía** của 6 cặp Use Case, và {UC-015} ghi `related` ngược với `include` của {UC-004}, {UC-008}, {UC-013}. Hai việc này vi phạm {GX-05}. Tôi giữ ở phía ID nhỏ hơn và bỏ 3 quan hệ ngược ở {UC-015}.
2. **{R-015} bỏ quan hệ tới {UC-005}.** {UC-005} đã Deprecated; bỏ theo luật chung của {P4} (bỏ quan hệ tới item đã đóng).
3. **{D-008} và {D-016} (đã Superseded)** được điền `superseded_by` theo dữ liệu sheet; khung của B3 đã bỏ sót field này.
4. **Ba chỗ subagent đổi nghĩa, tôi đã sửa lại:**
   - {A-022}: giữ "không mở ổn định".
   - {UC-017}: Ghi chú trỏ {D-025} thay vì nói "không thuộc Use Case này".
   - {BR-010}: nhận thêm mã nguồn của {BR-005}.
5. **{R-007}, {R-009}, {R-021}:** Acceptance tách thành "một lượt đạt khi…" và "bộ đánh giá chung đạt ngưỡng của `Đo lường`". Câu Acceptance tuyệt đối của sheet trái với ngưỡng ≥ 90% và ≥ 80% của {P1c}.
6. **{R-058}:** thêm Acceptance "chưa đăng nhập Google thì Hệ thống yêu cầu đăng nhập". Suy ra từ {Q1} ("người dùng đăng nhập Google để cấp quyền").
7. **Mô tả bộ đánh giá chung** nằm ở {R-021}; {R-007}, {R-009} tóm tắt kèm ID {R-021}. Thư mục `tests/eval/` sẽ được tạo ở B5.
8. **Hai chỗ lệch của sheet giữ nguyên, chưa sửa:**
   - {UC-020} xóa deck khi xóa tài khoản, lệch với nhu cầu của {ACT-003};
   - vai "Người xem" ở {UC-019} chưa có Actor.

   Cả hai Use Case đều Draft.
