# W-027 — Bản pilot gửi team review

**Mở `index.html`.** Không chạy server, không cần Figma và không cần mở các tài liệu lịch sử. Thời gian review đề xuất: **5–7 phút**.

**Đọc cái gì?** Chỉ hai tình huống: (1) UC-002 source thiếu chi phí → clarification → user bỏ mục chi phí → kết quả Accepted; (2) UC-004 B Pending → request mới chưa rõ → Cancel **hoặc** Confirm/commit rồi operation thất bại. Đây là UI **mô phỏng hành vi**, không phải thiết kế UI final.

**Team cần phản hồi:** Diễn giải hai flow có khớp UC/REQ không? Mốc implicit acceptance và recovery có đúng không? Clarification khi source gap nên xử lý ra sao? Ghi comment trực tiếp theo tên UC / bước.

**Coverage:** ĐÂY LÀ PILOT REVIEW, không phải W-027 Done. UC-013 có ảnh hỗ trợ; UC-015 được minh họa qua preview nhưng chưa có walkthrough riêng. UC-001/008/011/014 chưa có walkthrough; error/recovery của UC-001/002/004 chưa được hoàn thiện đầy đủ cho acceptance criteria.

**Evidence:** Gamma/Napkin do user chụp, được đặt trong phần tùy chọn cuối viewer, dùng để đối chiếu pattern outline review, không làm requirement mới cho DeckAgent. File gốc và artifact lớn trước đây vẫn nằm trong ZIP đã cung cấp/backup của user; không đưa vào bản pilot này.
