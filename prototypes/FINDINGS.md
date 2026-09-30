# W-027 — Ba điểm cần team xác nhận

## Pilot UC-002: Source gap
**Scenario:** report Thư viện sẻ chia không chứa chi phí triển khai, nhưng user yêu cầu đưa chi phí vào slide. **Mô phỏng:** DeckAgent phát hiện gap → hỏi user → user chọn bỏ chi phí → generate + validation → deck đầu tiên Accepted.

**Behavior xác định từ baseline:** Source gap không phải validation failure; output cần giữ facts từ nguồn. **UX chưa chốt:** Giao diện hỏi lại và điều kiện cho phép AI-added content. **Câu hỏi:** Khi nào cần clarification; nếu AI bổ sung thông tin thì phải có permission/disclosure như thế nào? **Reference có hạn chế:** Gamma/Napkin cho duyệt outline trước generation; không chứng minh họ xử lý source gap như DeckAgent.

## Pilot UC-004: Clarification, Cancel và commit
**Scenario:** A Accepted 6 slides, B Pending 4 slides. User yêu cầu refine tiếp nhưng chưa rõ. Nhánh A: Cancel clarification → A Accepted + B Pending. Nhánh B: user làm rõ và commit lượt mới → B trở thành Accepted baseline; tác vụ tạo C thất bại → giữ B Accepted, không có Pending C.

**Behavior xác định từ baseline:** Không implicit accept trong clarification; chỉ accept khi commit AI operation mới. **UX chưa chốt:** Bước xác nhận/hiển thị thông báo (modal, inline...). **Câu hỏi:** Viewer có giúp phân biệt Cancel request mới và UC-013 Discard Pending không? Mốc commit/recovery có được minh họa đúng không?

## Giới hạn của pilot
Đây là bước **xác nhận format và cách hiểu behavior**, không phải kiểm chứng trọn vẹn cả 8 UC. Chưa chứng minh xung đột requirement mới. Error/recovery UC-001/002/004 và walkthrough độc lập UC-001/008/011/014 cần hoàn thành ở phase sau. Không tự suy luận nguyên nhân thiết kế của Gamma/Napkin; không copy features chưa có trong scope DeckAgent.
