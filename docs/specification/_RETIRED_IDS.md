# ID đã nghỉ

ID trong bảng này không được dùng lại cho item mới (GX-01). Validator đọc cột `ID` của bảng.

Tất cả ID dưới đây nghỉ khi migrate spec từ Google Sheet sang thư mục này (2026-10-05). Item đã đóng nhưng vẫn giữ để truy vết (Retired, Deprecated, Superseded) không nằm ở đây; file của chúng vẫn còn trong folder của loại item.

| ID | Tên hoặc nội dung chính | Lý do nghỉ |
|---|---|---|
| A-001 | Phạm vi V1 được làm rõ trong Sprint 1 | Giả định về cách team làm việc, không phải sản phẩm |
| A-002 | Team dùng chung một development flow | Giả định về cách team làm việc |
| A-003 | GitHub hỗ trợ rule cho branch, PR và CI | Giả định về công cụ của team |
| A-004 | Architecture hiện tại chuẩn hóa được thành baseline | Giả định về kế hoạch kỹ thuật của team |
| A-005 | Tập trung Testing vào critical behavior là đủ | Giả định về chiến lược Testing của team; không Requirement nào mất lý do tồn tại khi giả định này sai |
| A-006 | Chọn lọc Skill lấy từ bên ngoài | Giả định về công cụ phát triển của team |
| BR-005 | Luôn giữ được bản dùng được gần nhất | Không còn nội dung riêng sau khi BR-010 sở hữu toàn bộ vòng đời bản deck; quan hệ chuyển sang BR-010 |
| C-006 | Chưa coi lựa chọn implementation nào là bắt buộc | Quy tắc quy trình ra quyết định; thay bằng ngưỡng tạm (`_COMMON_CRITERIA.md` mục 7) |
| C-007 | Không đặt ngưỡng định lượng trước benchmark | Quy tắc quy trình; thay bằng ngưỡng tạm (`_COMMON_CRITERIA.md` mục 7) |
| D-001 | Sprint 1 làm baseline và setup | Quyết định về lịch làm việc của team |
| D-002 | GitHub là nơi lưu code, PR, CI | Quyết định về công cụ của team |
| D-003 | Mọi thay đổi vào main đi qua PR | Quyết định về quy trình của team |
| D-004 | Cách ràng buộc Agent khi phát triển | Quyết định về công cụ phát triển của team |
| D-005 | Tài liệu Architecture phải có dependency, boundary, contract | Quyết định về tài liệu của team |
| D-010 | Cách phân loại "nhiều định dạng" trong spec | Quyết định về cách phân loại item, không phải về sản phẩm |
| D-011 | Không chốt cơ chế hay ngưỡng khi chưa có evidence | Quy tắc quy trình; thay bằng ngưỡng tạm (`_COMMON_CRITERIA.md` mục 7) |
| D-018 | V1 chạy theo Hybrid mode | Quyết định về cách tổ chức delivery của team |
| D-023 | Sprint 2 dừng ở Architecture Decision | Quyết định về lịch làm việc của team |
| D-028 | Khi nào tiêu chí chất lượng thành Hard Gate | Quy trình research; danh sách 4 lỗi tối thiểu chuyển sang R-021 |
| R-041 | Không xây editor chỉnh slide chuyên nghiệp | Nội dung là lựa chọn của team, do D-015 sở hữu; Requirement không có nhóm "constraint" |
