# Kiểm không đổi nghĩa: actors

- Item đã kiểm: 3 (ACT-001, ACT-002, ACT-003)
- Chỗ bị đánh dấu: 4 (cao: 0, thấp: 4)

| # | ID | Section | Ô sheet (trích) | Câu mới (trích) | Vấn đề | Mức | Đề xuất sửa |
|---|---|---|---|---|---|---|---|
| 1 | ACT-001 | Permissions / Capabilities 3 | — (dòng thêm theo BLK-021; sheet UC-007 2A: "Hệ thống hỏi lại, sau đó quay lại bước 2."; UC-023 3A: "Hệ thống báo và hỏi người dùng có mở rộng phạm vi không.") | "Trả lời hoặc hủy khi hệ thống hỏi lại (UC-001, UC-002, UC-004, UC-007, UC-023)." | thông tin không truy được | thấp | Vế "hủy" gắn với UC-007 và UC-023, nhưng cả sheet lẫn file Use Case đã dịch đều không có nhánh hủy ở hai Use Case này. BLK-053 chỉ thêm nhánh hủy cho UC-001 và UC-002, còn UC-004 2A đã có sẵn trong sheet. Đề xuất: "Trả lời khi hệ thống hỏi lại (UC-001, UC-002, UC-004, UC-007, UC-023); hủy khi được hỏi lại (UC-001, UC-002, UC-004)." |
| 2 | ACT-002 | Permissions / Capabilities 1 | "Chỉ trả kết quả; không trực tiếp thay đổi bản đã chấp nhận, vì kết quả phải qua bước kiểm tra (R-033)." | "Trả kết quả tạo hoặc sửa nội dung deck cho hệ thống (UC-001, …)." | đổi nghĩa | thấp | Giữ, vì Quyết định của BLK-021 đã thêm "Hỏi lại người dùng … (UC-002)" nên câu "Chỉ trả kết quả" không còn đúng. Ý giới hạn vẫn còn ở dòng 3 (đúng chữ Quyết định của BLK-037) và ở danh sách đóng theo GACT-08. Log đã ghi (Không áp rõ 1), nhưng việc bỏ chữ "Chỉ" vẫn cần người dùng xác nhận vì không có ô Quyết định nào nói trực tiếp. |
| 3 | ACT-002 | Ghi chú (bỏ section) | "Là nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về." | — (bỏ) | thiếu ý | thấp | Giữ việc bỏ, vì GX-12 (`Ghi chú` không tóm tắt section khác) và GACT-07 (nhóm Use Case do công cụ sinh). Ngoài ra, vế "tải về" mâu thuẫn với UC-008 bước 4 (tạo file không qua AI, BR-006) và Ghi chú 2 của UC-014. Căn cứ để bỏ là tiêu chí, không phải quyết định ở DECISIONS, APPLY hay BLOCKERS, nên cần người dùng xác nhận. |
| 4 | ACT-003 | Permissions / Capabilities | Sheet UC-020 2A: "Xóa tài khoản còn deck: Hệ thống báo các deck sẽ bị xóa theo và yêu cầu xác nhận." | "1. Xem danh sách tài khoản (UC-020). … 5. Xóa tài khoản (UC-020)." | thiếu ý | thấp | BLK-021 yêu cầu đồng bộ với mọi Use Case chưa Deprecated. ACT-001 đã có dòng tương ứng (Permissions 6: chọn tiếp tục hoặc hủy khi hệ thống cảnh báo, kèm UC-018 3A), còn ACT-003 thì chưa. Đề xuất thêm: "6. Xác nhận xóa tài khoản còn deck sau khi hệ thống báo các deck sẽ bị xóa theo (UC-020)." Có thể chờ đối chiếu UC-020 với Needs 1 ("không can thiệp vào nội dung deck"; xem mục Cần sửa ở loại khác 5 của rewrite log). |

## Đã kiểm, không đánh dấu

- ACT-001 Goal, Needs 3, Knowledge 2 và Permissions 1, 5: đây là thay thuật ngữ theo glossary ("ý định", "tài liệu có sẵn", "bản chờ duyệt", "deck dùng được" theo P1c) và thay đại từ theo GX-17. Có trong log.
- ACT-001 Permissions 4, 6–20: khớp danh sách của Quyết định BLK-021 và các bước trong `use-cases.json`. Đã đối chiếu từng ID Use Case. Việc bỏ Permissions gốc 4 cũng theo BLK-021.
- ACT-001 Constraints 1–3: đúng chữ Quyết định BLK-036. Phạm vi V1 theo Q3. Các chỗ bỏ "chuyên nghiệp", "thời gian thực", "Canva hay Figma" đều nằm trong câu của ô Quyết định.
- ACT-001 Notes 1: chuyển sang `source: ["DOC-001"]`.
- ACT-002 Needs → FILL_LATER: theo APPLY mục 3 và BLK-037.
- ACT-002 `Hành vi lỗi` 1–4: theo P1a/BLK-001 (gộp "chậm" vào "quá thời gian") và BLK-047 ("lỗi kết nối"). Constraints 1 bỏ D-011 theo BLK-030. Permissions 2 và 3 đúng chữ BLK-021 và BLK-037. Danh sách UC ở Permissions 1 bỏ UC-003, UC-014 và thêm UC-007 (BLK-022). Log đã ghi lý do.
- ACT-003: chỉ tách câu và thêm chủ ngữ. Permissions 1 theo BLK-021.
- `status: Active` của cả 3 actor lấy từ status cấp sheet "Actors | Active" (PLAN.md mục 1). `kind` thay cột Type theo GACT-02.
- Câu được viết lại nào cũng có trong rewrite log. File log không có phần "Sửa của agent chính".
