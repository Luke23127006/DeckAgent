# Đánh giá: requirements

Nguồn: `items/requirements.json` (54 item: 28 Active, 21 Proposed, 5 Draft). Cả 54 item được A2 xếp `product`, nên không có item `XÓA`.
Đối chiếu GX-10 dùng `items/business-rules.json`, `items/decisions.json`. Quan hệ lấy từ `relations.json` (đã lật chiều).

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| R-001 | BLOCKER | Đưa điều kiện lên đầu câu theo EARS (GR-01, GR-03). Thay "thành trạng thái các bước sau dùng được" bằng "để các bước tạo và sửa sau đọc được", lấy từ Acceptance 2 (GX-08). "yêu cầu riêng" là cụm mở (GX-08) → R-L04. Viết Acceptance ở thể chủ động (GX-16). Rút gọn short_name (GR-16) | R-L04 |
| R-002 | BLOCKER | Viết theo mẫu "Nếu … thì DeckAgent … hỏi lại" (GR-01, GR-03). Item Active dùng "nên" và "có thể" (GR-02) → R-L01. Điều kiện "thông tin có thể làm deck đi sai hướng" chưa có danh sách (GX-08, GR-03) → R-L11. Viết Acceptance ở thể chủ động (GX-16) | R-L01, R-L11 |
| R-003 | BLOCKER | Giữ nguyên câu Yêu cầu, vì việc liệt kê đối tượng được GR-04 cho phép. Ghi chú bỏ "(L-001)" và giữ phần text. Viết Acceptance ở thể chủ động (GX-16). Trùng D-024 mục 1 (GX-10) → R-L18. Dựa vào C-005 đã Retired → G-03 | R-L18, G-03 |
| R-004 | BLOCKER | Chuyển Acceptance 3 ("chưa bắt buộc trong V1") sang Ghi chú, vì đó là giới hạn phạm vi (GR-07, GX-12). Acceptance 2 là câu phủ định (GR-12): gợi ý `verification: inspection`. Rút gọn short_name (GR-16). Trùng BR-001 → R-L16; trùng D-007 → R-L18. Dựa vào C-005 → G-03 | R-L16, R-L18, G-03 |
| R-005 | VIẾT-LẠI | Viết Acceptance ở thể chủ động, chủ ngữ là người dùng (GX-16, GR-07). Phần còn lại chỉ chuyển vào template | — |
| R-006 | BLOCKER | Viết theo EARS: "Khi người dùng gửi yêu cầu tạo deck, DeckAgent phải…" (GR-01, GR-03). "nhiều slide" trong Acceptance 1 không có mốc (GX-08) → R-L12. Viết Acceptance ở thể chủ động (GX-16). Giữ Ghi chú định nghĩa "hoàn chỉnh" làm lưu ý khi đọc | R-L12 |
| R-007 | BLOCKER | Chuyển điều kiện "Bắt buộc đạt khi deck được tạo từ tài liệu có sẵn" từ Ghi chú vào đầu câu Yêu cầu (GR-03, GX-12). Tiêu chí đo đang chờ W-032 (GX-09, GR-10) → R-L02, R-L19. Trùng BR-002 mục 1 → R-L16. Acceptance 3 trùng R-008 → R-L17. `source` có D-028 → G-06. `assumptions` có A-005 → G-07 | R-L02, R-L16, R-L17, R-L19, G-06, G-07 |
| R-008 | BLOCKER | Viết theo mẫu "Nếu tài liệu có sẵn không có căn cứ cho nội dung được yêu cầu thì DeckAgent phải…" (GR-01, GR-03). "Hỏi lại hoặc đánh dấu" là hai cách đáp ứng cùng một năng lực, giữ nguyên. Cách hiển thị chưa chốt (GX-09) → R-L03. Trùng BR-002 mục 2 → R-L16. Rút gọn short_name (GR-16) | R-L03, R-L16 |
| R-009 | BLOCKER | Viết theo EARS: "Khi tạo hoặc sửa deck, DeckAgent phải…" (GR-01). Acceptance "thể hiện mục đích, audience…" chỉ phán được bằng ý kiến chủ quan (GR-07) → R-L02. Chuyển "P2 User Intent Fidelity" từ Ghi chú sang `source` dưới dạng `DOC-001 P2` (GX-11, GX-12) | R-L02 |
| R-010 | BLOCKER | Thay "nó" bằng "deck mẫu" (GX-17). Viết Acceptance ở thể chủ động (GX-16). Ghi chú "Còn ở mức thăm dò" trái với nghĩa của Proposed → R-L20 | R-L20 |
| R-011 | BLOCKER | Viết theo EARS: "Khi người dùng mô tả thay đổi trong chat, DeckAgent phải…" (GR-01). Acceptance 1 và 3 trùng D-025 mục 1 và 3 → R-L18. Acceptance 2 trùng BR-010 mục 2, Acceptance 3 trùng BR-011 → R-L16. Loại sửa "trau chuốt" trùng R-013 → R-L17. Rút gọn short_name (GR-16) | R-L16, R-L17, R-L18 |
| R-012 | BLOCKER | Câu "phạm vi hệ thống công bố hỗ trợ" trong Acceptance là câu thoát (GR-11) → R-L10. Chuyển "P4 Safe Refinement" từ Ghi chú sang `source` dưới dạng `DOC-001 P4` (GX-12) | R-L10 |
| R-013 | BLOCKER | Chuyển "(gọn hơn, rõ hơn, chuyên nghiệp hơn)" ra khỏi Yêu cầu và đưa vào Bối cảnh làm ví dụ về yêu cầu của người dùng (GX-08). Viết theo EARS: "Khi người dùng yêu cầu trau chuốt cả deck…" (GR-01). Acceptance 2 trùng R-031; phần "trau chuốt" trùng R-011 → R-L17 | R-L17 |
| R-014 | BLOCKER | Một câu chứa năm hành vi: thêm, xóa, nhân bản, sắp xếp slide và thay hình ảnh (GR-04) → R-L13. "Các thao tác trên" là cụm thay thế (GX-17). Rút gọn short_name; tên hiện tại thiếu "nhân bản" (GR-16, GX-13) | R-L13 |
| R-015 | BLOCKER | "lỗi đơn giản" và "editor chuyên nghiệp" là từ mơ hồ (GX-08). Acceptance "danh sách thao tác … được công bố" không có danh sách (GR-11) → R-L10 | R-L10 |
| R-016 | BLOCKER | Viết theo mẫu "Nếu lần sửa không như ý hoặc thất bại thì…" (GR-01, GR-03). "bản gần đây còn dùng được" là cụm mơ hồ (GX-08). "trong phạm vi hệ thống hỗ trợ" là câu thoát (GR-11) → R-L10 | R-L10 |
| R-017 | VIẾT-LẠI | Viết theo mẫu "Khi người dùng cung cấp hình ảnh…" (GR-01, GR-03). Viết Acceptance ở thể chủ động (GX-16). Bỏ L-001 khỏi `source`, vì vẫn còn `DOC-001 FR17`. Ghi chú bỏ ID L-001 và giữ phần text | — |
| R-018 | BLOCKER | "Tạo" và "tìm" là hai hành vi khác nhau (GR-04) → R-L13. "khi deck cần" (GX-08) và "các loại hình được công bố" (GR-11) → R-L10. Bỏ L-002 khỏi `source`, vì vẫn còn `DOC-001 FR18` | R-L10, R-L13 |
| R-019 | VIẾT-LẠI | Đưa điều kiện lên đầu câu theo EARS (GR-01, GR-03). Bỏ Ghi chú vì lặp Bối cảnh (GX-12). Viết Acceptance dạng kịch bản (GR-07) | — |
| R-020 | BLOCKER | Câu có hai hành vi nối bằng ";": tạo file từ bản đang xem trước, và thời điểm bản chờ duyệt thành bản đã chấp nhận (GR-04) → R-L13. Trùng BR-006 và BR-010 mục 3c, 6 → R-L16. Giữ Ghi chú lịch sử làm lưu ý khi đọc | R-L13, R-L16 |
| R-021 | BLOCKER | "mức dùng được", "nghiêm trọng", "rõ ràng", "tối thiểu" là từ mơ hồ (GX-08). Ngưỡng đang chờ W-032 (GX-09, GR-09) → R-L02, R-L19. Chuyển Acceptance 2 sang `Đo lường` dưới dạng "Ngưỡng đạt: Chưa chốt" (chỉ chuyển chỗ). Acceptance 1 trùng D-028 Rationale 1 → R-L18. Text và `source` trích D-028 → G-06. Có A-005 → G-07 | R-L02, R-L18, R-L19, G-06, G-07 |
| R-022 | BLOCKER | "hạn chế" là từ mơ hồ (GX-08). "trong các trường hợp kiểm tra được" là câu thoát (GR-11) → R-L10. Trùng BR-004 → R-L16; trùng R-023 → R-L17. Chuyển P4 từ Ghi chú sang `source` (GX-12) | R-L10, R-L16, R-L17 |
| R-023 | BLOCKER | "trong giới hạn hệ thống hỗ trợ" là câu thoát (GR-11) → R-L10. Trùng BR-004 → R-L16; trùng R-022 → R-L17. Rút gọn short_name (GR-16) | R-L10, R-L16, R-L17 |
| R-024 | BLOCKER | Dịch thử ở mục 4. Viết theo EARS (GR-01, GR-03). Thay "trạng thái đã chấp nhận", "baseline", "rollback" bằng thuật ngữ glossary (GX-07). Tách Acceptance 2 thành hai điều (GX-14). Chuyển Ghi chú sang Câu hỏi mở. Thời hạn và xung đột của ràng buộc còn mở → R-L04. Acceptance 2–4 trùng BR-010 và D-030 → R-L16, R-L18. Có A-005 → G-07 | R-L04, R-L16, R-L18, G-07 |
| R-025 | BLOCKER | "trong giới hạn của từng định dạng" là câu thoát (GR-11) → R-L09. "của cùng một bản đã chấp nhận" lệch với R-020 → R-L14. Trùng BR-007 → R-L16. Chuyển "(P5)" sang `source` dưới dạng `DOC-001 P5` (GX-12). Có D-028 → G-06; có A-005 → G-07 | R-L09, R-L14, R-L16, G-06, G-07 |
| R-026 | BLOCKER | "cách dự đoán được" và "trường hợp mất hoặc đổi đã biết" chưa có danh sách (GX-08, GR-11) → R-L09. Hai hành vi "xử lý" và "báo" (GR-04) → R-L13. Acceptance 2 cho phép "hoặc hệ thống ghi lại", lệch với Yêu cầu và BR-013 → R-L15. Trùng BR-013 → R-L16. Rút gọn short_name (GR-16) | R-L09, R-L13, R-L15, R-L16 |
| R-027 | BLOCKER | "môi trường đích", "dùng được", "luồng làm việc được V1 kiểm chứng" (GX-08, GR-11). Acceptance 2 ghi "chưa được chốt" (GX-09) → R-L05. Có A-005 → G-07. Area `CI` nằm ngoài enum → G-11 | R-L05, G-07, G-11 |
| R-028 | BLOCKER | "trong giới hạn của định dạng" và "trong phạm vi đã kiểm chứng" là câu thoát (GR-11) → R-L09. "bản xem trước đã chấp nhận" lệch với R-020 → R-L14. Ghi chú bỏ ID W-032 và giữ phần text. Có D-028 → G-06; có A-005 → G-07 | R-L09, R-L14, G-06, G-07 |
| R-029 | BLOCKER | "deck dùng được" và "kiến thức chỉnh slide chuyên nghiệp" là cụm mơ hồ (GX-08) → R-L02. Gợi ý `verification: demonstration`. Dựa vào C-001 đã Retired → G-02 | R-L02, G-02 |
| R-030 | BLOCKER | Item Active dùng "nên" (GR-02) → R-L01. Hai hành vi có điều kiện khác nhau (GR-04) → R-L13. "kéo dài" và "lỗi thường gặp" không có mốc hay danh sách (GX-08) → R-L08. Có C-007 → G-04. Rút gọn short_name (GR-16) | R-L01, R-L08, R-L13, G-04 |
| R-031 | BLOCKER | Thay "không qua kiểm tra" bằng "không qua kiểm tra kết quả" (GX-07). Acceptance 1 trùng BR-005 và BR-010 mục 7; Acceptance 2 trùng BR-010 mục 5 → R-L16. Trùng D-030 → R-L18. Trùng R-046 Acceptance 2 → R-L17. Có A-005 → G-07 | R-L16, R-L17, R-L18, G-07 |
| R-032 | BLOCKER | Ngưỡng quá thời gian và số lần thử lại "chưa được chốt" (GX-09). "trạng thái xác định" chưa có danh sách trạng thái (GX-08) → R-L08. Acceptance 2 trùng BR-005 → R-L16. Có C-007 và text trích D-011 → G-04; có A-005 → G-07; area `Infra` → G-11. Rút gọn short_name (GR-16) | R-L08, R-L16, G-04, G-07, G-11 |
| R-033 | BLOCKER | Thay "nó" bằng "kết quả đó" (GX-17). Dùng thuật ngữ "kiểm tra kết quả" (GX-07). Cách kiểm tra "chưa quyết định" (GX-09) → R-L06. Có A-005 → G-07. Rút gọn short_name (GR-16) | R-L06, G-07 |
| R-034 | BLOCKER | "các loại sửa cục bộ đã công bố" là câu thoát (GR-11) → R-L10. Viết Acceptance ở thể chủ động (GX-16) | R-L10 |
| R-035 | BLOCKER | "tương xứng", "luôn", "chất lượng bắt buộc không giảm" là cụm mơ hồ (GX-08) → R-L10. Có C-007 → G-04; area `Infra` → G-11. Rút gọn short_name (GR-16) | R-L10, G-04, G-11 |
| R-036 | BLOCKER | Viết lại thành "Với mỗi lượt xử lý AI, DeckAgent nên ghi lại…" (GR-01). Viết Acceptance ở thể chủ động (GX-16). Có C-007 → G-04 | G-04 |
| R-037 | BLOCKER | "tài nguyên chính", "cách xác định", "dự đoán được" là cụm mơ hồ (GX-08). Giá trị giới hạn chờ benchmark; ở Proposed được ghi "Chưa chốt" → R-L08. `source` có D-011, có C-007 → G-04; area `Infra` → G-11 | R-L08, G-04, G-11 |
| R-038 | BLOCKER | "sửa rộng" và "chủ yếu" là từ mơ hồ (GX-08) → R-L10. Bối cảnh bỏ ID L-001. Ghi chú bỏ W-028 và giữ "không phải acceptance của V1". Gợi ý `verification: analysis` | R-L10 |
| R-039 | BLOCKER | "chủ yếu" là từ mơ hồ (GX-08) → R-L10. Ghi chú bỏ W-028 và giữ phần text. Gợi ý `verification: analysis` | R-L10 |
| R-040 | BLOCKER | "hạn chế", "sâu" (GX-08) và "trong phạm vi hỗ trợ" (GR-11) → R-L10. Ghi chú bỏ W-028. Rút gọn short_name (GR-16) | R-L10 |
| R-041 | BLOCKER | Type = `Constraint` → G-01. Từ "chuyên nghiệp" (GX-08) và câu phủ định (GR-12) để xử lý sau G-01. Trùng D-006 và D-015 → R-L18. Có C-001 → G-02; có A-004, UC-005 → G-08; UC ghi "Liên quan: R-041" → G-09; area `Schedule` → G-11 | R-L18, G-01, G-02, G-08, G-09, G-11 |
| R-042 | BLOCKER | "ngoài những gì thiết kế cho phép" là câu thoát (GR-11), và việc gửi nội dung cho nhà cung cấp AI còn chờ xem xét (GX-09) → R-L07. Ghi chú trỏ W-028 → R-L19. Câu phủ định được giữ vì là yêu cầu bảo mật (GR-12). Dựa vào UC-018 (Draft) → G-10; area `Infra` → G-11 | R-L07, R-L19, G-10, G-11 |
| R-043 | BLOCKER | Gần như trùng nguyên văn BR-008 → R-L16. Acceptance phủ định được giữ vì là bảo mật (GR-12). Rút gọn short_name (GR-16). `Đo lường` theo GR-10 → FILL_LATER | R-L16 |
| R-044 | VIẾT-LẠI | Viết theo EARS: "Khi người dùng yêu cầu dịch cả deck, DeckAgent nên…" (GR-01). Chuyển Acceptance 2 (điều để chốt sau) sang Câu hỏi mở (GR-07). Bỏ W-026 khỏi `source`, vì vẫn còn D-025 | — |
| R-045 | BLOCKER | Viết Acceptance dạng kịch bản (GR-07). Bỏ Ghi chú quy trình "Duy cập nhật sau" (GX-12). Trùng BR-012 mục 2 → R-L16. Rút gọn short_name (GR-16) | R-L16 |
| R-046 | BLOCKER | Thay "baseline" bằng "bản đã chấp nhận làm cơ sở" (GX-07, cùng cách viết với BR-010). Acceptance 2 trùng BR-010 mục 5, Acceptance 3 trùng BR-014 mục 2 → R-L16. Acceptance 2 trùng R-031 → R-L17. Trùng D-029 → R-L18 | R-L16, R-L17, R-L18 |
| R-047 | BLOCKER | Viết Acceptance ở thể chủ động (GX-16). Bỏ L-002 khỏi `source` và bỏ ID khỏi Ghi chú. Acceptance 2 trùng BR-017 → R-L16 | R-L16 |
| R-048 | VIẾT-LẠI | Rút gọn short_name (GR-16). Viết Acceptance ở thể chủ động (GX-16). Đổi "tài liệu" thành "tài liệu có sẵn" cho thống nhất với BR-012 (GX-07) | — |
| R-049 | BLOCKER | Acceptance 2 trùng BR-015 → R-L16. `source` chỉ có "Benchmark 27/09/2026" (GX-11, xem mục 6) | R-L16 |
| R-050 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template (dịch thử ở mục 4) | — |
| R-051 | BLOCKER | Item Draft: chỉ chuyển vào template. Area `Infra` → G-11 | G-11 |
| R-052 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template | — |
| R-053 | BLOCKER | Item Draft: chỉ chuyển vào template. Area `Infra` → G-11 | G-11 |
| R-054 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template | — |

## 2. Blocker cục bộ

### R-L01 · TRANG_THAI · Requirement Active dùng "nên" hoặc "có thể"
- Item: R-002, R-030
- Tiêu chí: GR-02, GX-09
- Hiện trạng: R-002 "DeckAgent nên hỏi lại người dùng khi yêu cầu thiếu thông tin có thể làm deck đi sai hướng…"; R-030 "DeckAgent nên hiển thị tiến độ của lượt xử lý kéo dài…". Cả hai đang ở Active, scope V1.
- Điều chưa biết hoặc cần chọn: hai hành vi này là bắt buộc (thiếu thì test trượt) hay chỉ là mong muốn. Đổi "nên" thành "phải" là đổi mức cam kết.
- Phương án:
  - A. Đổi thành "phải" và giữ Active (vẫn chịu các blocker khác của từng item: R-L11, R-L08, R-L13).
  - B. Giữ "nên" và hạ cả hai xuống Proposed.
  - C. Quyết định riêng từng item.
- Đề xuất: A, vì cả hai đều có Acceptance dạng bắt buộc, thuộc V1, và R-046 (Active) đang `depends_on` R-030. Hạ R-030 xuống Proposed sẽ làm một item Active dựa vào item chưa sẵn sàng nghiệm thu.
- Quyết định:

### R-L02 · TRANG_THAI · Tiêu chí chất lượng của deck và của kết quả AI đang chờ nghiên cứu (W-032)
- Item: R-007, R-009, R-021, R-029
- Tiêu chí: GX-09, GR-07, GR-09, GR-10, GX-08
- Hiện trạng:
  - R-007 Ghi chú: "Tiêu chí đo chi tiết do W-032 nghiên cứu."
  - R-021 Acceptance: "…chữ không đọc được hoặc bị cắt nghiêm trọng, mạch trình bày gãy rõ ràng… 2. Ngưỡng cỡ chữ, mật độ, tương phản, độ nhất quán, độ phủ và mạch lạc do W-032 nghiên cứu." D-028 Rationale 2 cũng ghi "Chưa chốt ngưỡng: … mức nghiêm trọng".
  - R-009 Acceptance: "Deck … thể hiện mục đích, audience và bối cảnh người dùng đã nêu, ví dụ ở độ sâu kỹ thuật hoặc giọng văn." Câu này không phán được nếu không có rubric.
  - R-029: "deck dùng được", "không cần kiến thức chỉnh slide chuyên nghiệp".
- Điều chưa biết hoặc cần chọn: ngưỡng và cách chấm (tập đánh giá, rubric, số lần chạy, tỷ lệ đạt) cho bốn item này chưa có trong sheet. Bịa ra thì trái GR-09 ("không đặt số khi chưa có dữ liệu").
- Phương án:
  - A. Giữ Active, người dùng cung cấp ngay ngưỡng và rubric.
  - B. Hạ cả bốn xuống Proposed, giữ scope V1. `Đo lường` ghi "Ngưỡng đạt: Chưa chốt (nơi xử lý: xem R-L19)".
  - C. Giữ Active cho phần đã chốt (R-007: số liệu khớp tuyệt đối; R-021: 4 lỗi của D-028), tách phần ngưỡng chưa chốt thành requirement Proposed mới (tạo ID mới).
- Đề xuất: B. Đây là đúng tình huống mà `_COMMON_CRITERIA.md` mục 1 mô tả: item thuộc release hiện tại nhưng ở Proposed vì ngưỡng nghiệm thu chưa chốt. Không chọn C, vì ngay 4 lỗi của D-028 cũng còn "nghiêm trọng" chưa có ngưỡng. Kết quả còn phụ thuộc G-06 (D-028) và G-07 (A-005).
- Quyết định:

### R-L03 · TRANG_THAI · Cách cho người dùng thấy nội dung do AI bổ sung
- Item: R-008
- Tiêu chí: GX-09, GR-05
- Hiện trạng: Ghi chú "Cách hiển thị phần AI bổ sung chưa được chốt." Acceptance 2 "Người dùng thấy được phần nào do AI bổ sung, hoặc được hỏi trước khi AI bổ sung."
- Điều chưa biết hoặc cần chọn: điều chưa chốt là quyết định thiết kế giao diện (nằm ngoài requirement theo GR-05) hay là một phần của tiêu chí đạt.
- Phương án:
  - A. Giữ Active. Coi cách hiển thị là quyết định thiết kế; Acceptance chỉ đòi có dấu hiệu phân biệt quan sát được. Ghi chú đổi thành "Cách hiển thị là quyết định thiết kế, không thuộc requirement này."
  - B. Hạ xuống Proposed, đưa câu hỏi "DeckAgent cho thấy phần AI bổ sung bằng cách nào?" vào Câu hỏi mở.
- Đề xuất: A, vì Acceptance 2 đã phán được đúng sai mà không cần biết cách hiển thị. Ghi thêm cách hiển thị vào requirement thì vi phạm GR-05.
- Quyết định:

### R-L04 · TRANG_THAI · Loại, thời hạn và xung đột của ràng buộc của người dùng
- Item: R-001, R-024
- Tiêu chí: GX-09, GX-08, GR-08
- Hiện trạng:
  - R-001: "(chủ đề, mục đích, audience, ngôn ngữ, độ dài, yêu cầu riêng)". "yêu cầu riêng" là cụm mở.
  - R-024 Ghi chú: "Thời hạn và cách xử lý xung đột giữa các loại ràng buộc còn mở (A-013)…"
  - BR-003 Exceptions: "…cách phân biệt sẽ được định nghĩa sau."
- Điều chưa biết hoặc cần chọn: (1) danh sách đầy đủ các loại ràng buộc mà tester phải kiểm; (2) khi nào một ràng buộc hết hiệu lực, ngoài trường hợp người dùng đổi hoặc hủy; (3) quy tắc khi hai ràng buộc xung đột. Thiếu (2) và (3) thì không phán được Acceptance 1 của R-024.
- Phương án:
  - A. Hạ R-024 xuống Proposed và đưa (2), (3) vào Câu hỏi mở (nơi xử lý: A-013). R-001 giữ Active nếu người dùng thay được "yêu cầu riêng" bằng danh sách cụ thể; nếu không thì hạ cùng R-024.
  - B. Giữ cả hai ở Active, người dùng chốt ngay (1), (2), (3).
  - C. Giữ Active, thu hẹp R-024: "ràng buộc còn hiệu lực cho tới khi người dùng đổi hoặc hủy", xung đột để ngoài phạm vi. Cách này đổi nghĩa so với BR-003 Exceptions, nên cần người dùng xác nhận.
- Đề xuất: A. A-013 ghi rõ câu hỏi "cố ý để mở". Đây là thông tin chưa chốt ảnh hưởng hành vi bắt buộc, nên không được ở Active (GX-09). Nên gộp với blocker của business-rules về BR-003 Exceptions.
- Quyết định:

### R-L05 · TRANG_THAI · Môi trường đích và mức tương thích của file tải về
- Item: R-027
- Tiêu chí: GX-09, GX-08, GR-11
- Hiện trạng: "…hợp lệ, mở và dùng được trong môi trường đích." Acceptance: "1. … dùng được trong luồng làm việc được V1 kiểm chứng. 2. Cam kết tương thích với từng ứng dụng cụ thể chưa được chốt trước implementation." D-026 mục 3 chọn học mức tương thích từ implementation.
- Điều chưa biết hoặc cần chọn: "môi trường đích" gồm ứng dụng nào và phiên bản nào; "dùng được" kiểm bằng gì (mở không lỗi, sửa được chữ…).
- Phương án:
  - A. Hạ xuống Proposed. Câu hỏi mở về danh sách ứng dụng đích, nơi xử lý theo D-026 mục 3.
  - B. Giữ Active, người dùng chốt ngay danh sách ứng dụng đích tối thiểu (ví dụ một trình xem PDF và một ứng dụng mở PPTX cụ thể).
  - C. Giữ Active, thu hẹp Yêu cầu thành "file hợp lệ theo đặc tả định dạng", kiểm bằng validator, và bỏ vế "dùng được trong môi trường đích". Đây là đổi nghĩa.
- Đề xuất: A, vì D-026 đã cố ý không chốt tương thích trước implementation. Giữ Active là trái với chính decision đó.
- Quyết định:

### R-L06 · TRANG_THAI · Kiểm tra kết quả AI chưa định nghĩa
- Item: R-033
- Tiêu chí: GX-09, GR-07
- Hiện trạng: Ghi chú "Cách kiểm tra cụ thể chưa quyết định; kiến trúc phải làm bước này kiểm chứng được." Acceptance "Mỗi loại lượt xử lý có bước kiểm tra kết quả tương ứng trước khi kết quả được hiển thị."
- Điều chưa biết hoặc cần chọn: requirement đòi phải có bước kiểm tra (kiểm được bằng cách đưa vào một kết quả hỏng), hay đòi cả nội dung bước kiểm tra (kết quả nào là hỏng).
- Phương án:
  - A. Giữ Active. Acceptance viết lại dạng "Khi kết quả AI không qua kiểm tra kết quả, kết quả đó không trở thành bản chờ duyệt hay bản đã chấp nhận". Danh sách điều kiện kiểm để Decision hoặc thiết kế quyết định. Ghi chú giữ vế "cách kiểm tra là quyết định thiết kế".
  - B. Hạ xuống Proposed tới khi có danh sách điều kiện kiểm cho từng loại lượt xử lý.
- Đề xuất: A, vì Acceptance phán được bằng cách tiêm kết quả hỏng, không cần biết cơ chế (GR-05). Phương án A chỉ viết lại, không thêm thông tin.
- Quyết định:

### R-L07 · TRANG_THAI · Luồng nào được phép đưa nội dung người dùng ra ngoài
- Item: R-042
- Tiêu chí: GR-11, GX-09, GR-12
- Hiện trạng: "…không để lộ tài liệu và nội dung người dùng qua log, file tạm hoặc xử lý bên ngoài, ngoài những gì thiết kế cho phép." Ghi chú "…việc gửi nội dung cho nhà cung cấp AI vẫn phải được W-028 xem xét."
- Điều chưa biết hoặc cần chọn: danh sách luồng được phép mang nội dung người dùng ra ngoài (ví dụ: gửi tới nhà cung cấp AI qua ACT-002). Không có danh sách này thì requirement không bao giờ fail (GR-11).
- Phương án:
  - A. Hạ xuống Proposed. Câu hỏi mở về danh sách luồng được phép (nơi xử lý: xem R-L19).
  - B. Giữ Active, người dùng liệt kê ngay các luồng được phép, thay cho cụm "ngoài những gì thiết kế cho phép".
- Đề xuất: B nếu người dùng trả lời được ngay. Ứng dụng V1 chạy trên máy người dùng (D-027), nên danh sách có thể chỉ gồm luồng gửi tới nhà cung cấp AI. Nếu không trả lời được thì chọn A. Kết quả còn phụ thuộc G-10.
- Quyết định:

### R-L08 · SO_LIEU · Ngưỡng thời gian và danh sách lỗi của lượt xử lý
- Item: R-030, R-032 (Active); R-037 (Proposed)
- Tiêu chí: GX-09, GX-08, GR-09
- Hiện trạng:
  - R-032 Ghi chú: "Ngưỡng quá thời gian và số lần thử lại chưa được chốt (D-011)." Acceptance: "trạng thái lượt xử lý xác định", nhưng chưa có danh sách trạng thái.
  - R-030: "lượt xử lý kéo dài", "Lỗi thường gặp có thông báo…".
  - R-037 Ghi chú: "Giá trị giới hạn chỉ đặt sau benchmark (D-011)."
- Điều chưa biết hoặc cần chọn: thời gian tối đa của một lượt xử lý; số lần thử lại; mốc thời gian để tính là "kéo dài"; danh sách "lỗi thường gặp"; danh sách trạng thái kết thúc của lượt xử lý; các giới hạn tài nguyên của R-037.
- Phương án:
  - A. Người dùng cung cấp ngay các con số và danh sách, giữ R-030, R-032 ở Active.
  - B. Hạ R-030, R-032 xuống Proposed, ghi "Chưa chốt (benchmark theo D-011)". R-037 ghi tương tự.
  - C. Giữ Active với giá trị tạm do người dùng đặt, kèm Review Trigger khi có benchmark.
- Đề xuất: B, vì sheet ghi rõ ngưỡng chỉ đặt sau benchmark, và GR-09 cấm đặt số khi chưa có dữ liệu. Nơi xử lý phụ thuộc G-04 (D-011 là sản phẩm hay quy trình). Nếu chọn B thì R-046 (Active) sẽ dựa vào R-030 (Proposed); xem R-L01.
- Quyết định:

### R-L09 · SO_LIEU · "Giới hạn của định dạng" khi tải về chưa được định nghĩa
- Item: R-025, R-026, R-028
- Tiêu chí: GR-11, GX-08, GX-09
- Hiện trạng:
  - R-025 Acceptance: "…giữ cùng facts, số liệu, thứ tự và ý nghĩa, trong giới hạn của từng định dạng."
  - R-028: "…khớp với file người dùng sẽ tải về, trong giới hạn của định dạng." Acceptance: "…không khác nhau, trong phạm vi đã kiểm chứng."
  - R-026: "xử lý theo cách dự đoán được"; "Mỗi trường hợp mất hoặc đổi đã biết có cách xử lý xác định."
- Điều chưa biết hoặc cần chọn: giới hạn của PPTX và PDF được định nghĩa ở đâu; danh sách các trường hợp mất hoặc đổi đã biết; phạm vi kiểm chứng của R-028.
- Phương án:
  - A. Thay "trong giới hạn của từng định dạng" ở R-025 bằng tham chiếu BR-007 (không bắt buộc giống về pixel, font, khả năng sửa, tương tác, animation). Với R-026 và R-028, danh sách mất hoặc đổi đã biết ghi "Chưa chốt" và hạ hai item này xuống Proposed tới khi có evidence implementation (D-026 mục 3).
  - B. Giữ cả ba ở Active, người dùng cung cấp ngay danh sách mất hoặc đổi theo từng định dạng và phạm vi kiểm chứng.
  - C. Hạ cả ba xuống Proposed.
- Đề xuất: A. BR-007 đã định nghĩa phần không bắt buộc giống nhau giữa các định dạng, nên R-025 đạt được chỉ bằng cách trỏ ID. Danh sách mất hoặc đổi thì D-026 đã chọn học từ implementation. Dùng BR-007 cho R-028 (xem trước so với file) là mở rộng nghĩa, nên không đề xuất.
- Quyết định:

### R-L10 · SO_LIEU · Câu thoát "đã công bố / hệ thống hỗ trợ" ở các requirement Later
- Item: R-012, R-015, R-016, R-018, R-022, R-023, R-034, R-035, R-038, R-039, R-040 (đều Proposed, scope Later)
- Tiêu chí: GR-11, GX-08 (cả hai áp từ Proposed)
- Hiện trạng (trích):
  - R-012 "phạm vi hệ thống công bố hỗ trợ"
  - R-015 "một danh sách thao tác sửa trực tiếp được công bố"
  - R-016 "bản gần đây còn dùng được", "trong phạm vi hệ thống hỗ trợ"
  - R-018 "khi deck cần", "các loại hình được công bố"
  - R-022 "hạn chế", "trong các trường hợp kiểm tra được"
  - R-023 "trong giới hạn hệ thống hỗ trợ"
  - R-034 "các loại sửa cục bộ đã công bố"
  - R-035 "tương xứng", "chất lượng bắt buộc không giảm"
  - R-038 "sửa rộng", "chủ yếu chỉ đụng tới"
  - R-039 "chủ yếu chỉ đụng tới"
  - R-040 "hạn chế … phụ thuộc sâu", "trong phạm vi hỗ trợ"
- Điều chưa biết hoặc cần chọn: các danh sách và giới hạn này chưa có ở đâu. Câu hỏi chung là: với requirement Later, có được ghi "Chưa chốt" kèm Câu hỏi mở thay cho câu thoát hay không.
- Phương án:
  - A. Thay câu thoát bằng "Chưa chốt", đưa câu hỏi tương ứng vào Câu hỏi mở. Nơi xử lý ghi FILL_LATER (ví dụ: khi UC-023 hoặc năng lực đó quay lại phạm vi).
  - B. Người dùng định nghĩa ngay từng danh sách và giới hạn.
  - C. Hạ các item này xuống Draft (Draft chỉ chịu gate cấu trúc).
- Đề xuất: A, vì mức Proposed cho phép "Chưa chốt" kèm nơi xử lý, và các item này chưa thuộc V1. Với R-038, R-039, R-040 (khả năng mở rộng, gợi ý `verification: analysis`) có thể chọn C, vì Ghi chú ghi "không phải acceptance của V1".
- Quyết định:

### R-L11 · SO_LIEU · Thông tin nào thiếu thì DeckAgent phải hỏi lại
- Item: R-002
- Tiêu chí: GR-03, GX-08, GR-08
- Hiện trạng: Yêu cầu "khi yêu cầu thiếu thông tin có thể làm deck đi sai hướng". Acceptance 1 chỉ nêu một trường hợp: "Khi không xác định được chủ đề hoặc mục đích của deck…"
- Điều chưa biết hoặc cần chọn: danh sách thông tin mà thiếu thì bắt buộc hỏi lại. Lấy Acceptance 1 làm điều kiện đầy đủ là thu hẹp nghĩa của Yêu cầu.
- Phương án:
  - A. Điều kiện hỏi lại = thiếu chủ đề hoặc thiếu mục đích (đúng như Acceptance 1, khớp R-006 Acceptance 1).
  - B. Người dùng bổ sung thêm thông tin vào danh sách (ví dụ: audience, ngôn ngữ).
- Đề xuất: A, vì đây là điều duy nhất sheet đã nêu cụ thể và R-006 dùng cùng điều kiện. Vẫn cần người dùng xác nhận là không có thêm trường hợp nào.
- Quyết định:

### R-L12 · SO_LIEU · Số slide tối thiểu của một deck hoàn chỉnh
- Item: R-006
- Tiêu chí: GX-08, GR-07
- Hiện trạng: Acceptance 1 "…hệ thống tạo deck có nhiều slide và xem trước được."
- Điều chưa biết hoặc cần chọn: "nhiều slide" là bao nhiêu.
- Phương án:
  - A. "≥ 2 slide" (cách hiểu tối thiểu của "nhiều").
  - B. Bỏ điều kiện số slide, chỉ giữ "xem trước được, sửa và tải về được" (đúng Ghi chú định nghĩa "hoàn chỉnh").
  - C. Người dùng đặt một số tối thiểu khác.
- Đề xuất: B, vì Ghi chú của chính R-006 định nghĩa "hoàn chỉnh" bằng xem trước, sửa và tải về, không bằng số slide.
- Quyết định:

### R-L13 · TACH_ITEM · Requirement gộp nhiều hành vi
- Item: R-014, R-018, R-020, R-026, R-030
- Tiêu chí: GR-04
- Hiện trạng và đề xuất từng item:

| Item | Status | Các hành vi đang gộp | Đề xuất |
|---|---|---|---|
| R-014 | Proposed | thêm, xóa, nhân bản, sắp xếp slide; thay hình ảnh | Tách 2: thao tác trên slide (thêm, xóa, nhân bản, sắp xếp) và thay hình ảnh. Bốn thao tác đầu cùng đối tượng là slide, nên coi là liệt kê thao tác của một năng lực |
| R-018 | Proposed | tạo hình mới; tìm hình có sẵn | Tách 2: tạo và tìm |
| R-020 | Active | tạo file từ bản đang xem trước; bản chờ duyệt thành bản đã chấp nhận khi tải về thành công | Không tách: bỏ vế 2 và Acceptance 3, trỏ BR-010 mục 3c, 6 (gắn với R-L16) |
| R-026 | Active | xử lý theo cách dự đoán được; báo người dùng | Không tách: giữ "báo người dùng" làm hành vi; "xử lý dự đoán được" thuộc danh sách của R-L09 |
| R-030 | Active | hiển thị tiến độ của lượt xử lý kéo dài; cho biết bước tiếp theo khi có lỗi | Tách 2: tiến độ và lỗi. R-046 đang `depends_on` R-030 vì phần tiến độ (UC-014) |

- Điều chưa biết hoặc cần chọn: có tạo ID mới cho các phần tách hay không. Với R-020, R-026, có chấp nhận bỏ vế thay vì tách hay không.
- Phương án:
  - A. Làm theo cột Đề xuất: tạo ID mới cho R-014, R-018, R-030 (3 ID mới); R-020, R-026 bỏ vế, không tách.
  - B. Không tách item nào, chấp nhận Lint GR-04 cảnh báo, ghi lý do trong Ghi chú.
  - C. Tách tất cả 5 item.
- Đề xuất: A. Hai vế của R-030 có điều kiện khác nhau và đạt hoặc trượt độc lập, đúng ví dụ GR-04 trong `_CRITERIA.md`. R-020 vế 2 đã có chủ sở hữu ở BR-010.
- Quyết định:

### R-L14 · MAU_THUAN_QH · R-025, R-028 vẫn nói "bản đã chấp nhận" sau khi R-020 đổi sang tải về từ bản đang xem trước
- Item: R-025, R-028 (`depends_on` R-020); R-020; BR-006
- Tiêu chí: GR-15
- Hiện trạng:
  - R-020 (đổi ngày 27/09/2026): "tạo file tải về từ đúng bản người dùng đang xem trước; nếu đó là bản chờ duyệt…"
  - R-025: "…giữa các định dạng tải về của cùng một bản đã chấp nhận."
  - R-028 Acceptance: "…giữa bản xem trước đã chấp nhận và file PPTX/PDF tương ứng…"
- Điều chưa biết hoặc cần chọn: R-025 và R-028 có áp cho file tải về từ một bản chờ duyệt hay không. Theo BR-010 mục 3c, bản đó chỉ thành bản đã chấp nhận khi tải về thành công, nên có hai cách hiểu.
- Phương án:
  - A. Đổi "bản đã chấp nhận" ở R-025, R-028 thành "bản người dùng đang xem trước" để khớp R-020 và BR-006.
  - B. Giữ nguyên: hai requirement chỉ áp cho bản đã chấp nhận. File tải về từ bản chờ duyệt không có cam kết nhất quán.
- Đề xuất: A. Ghi chú của R-020 cho thấy R-020 đổi sau, còn R-025, R-028 có vẻ chưa cập nhật theo. Phương án B để lại một luồng tải về không có cam kết P5.
- Quyết định:

### R-L15 · MAU_THUAN_QH · R-026 Acceptance 2 yếu hơn Yêu cầu và BR-013
- Item: R-026, BR-013 (R-026 `business_rules` có BR-013)
- Tiêu chí: GR-15, GR-07
- Hiện trạng: Yêu cầu "…và báo cho người dùng khi định dạng tải về không giữ được một phần deck." Acceptance 2 "Người dùng được báo, hoặc hệ thống ghi lại, phần bị mất hoặc đổi." BR-013 "…hệ thống phải báo giới hạn thay vì bỏ qua âm thầm…"
- Điều chưa biết hoặc cần chọn: chỉ ghi log mà không báo người dùng thì có đạt không.
- Phương án:
  - A. Bỏ "hoặc hệ thống ghi lại": bắt buộc báo người dùng, khớp Yêu cầu và BR-013.
  - B. Giữ "hoặc ghi lại", đồng thời sửa Yêu cầu và xem lại BR-013.
- Đề xuất: A, vì Yêu cầu, Bối cảnh ("người dùng cần biết phần nào đã đổi") và BR-013 đều đòi báo người dùng.
- Quyết định:

### R-L16 · TRUNG_SO_HUU · Requirement và Business Rule phát biểu cùng một quy định
- Item: các cặp trong bảng
- Tiêu chí: GX-10, GR-15
- Hiện trạng:

| Requirement (phần) | Business Rule (phần) | Nội dung trùng |
|---|---|---|
| R-004 | BR-001 | Vai trò của file theo mục đích, không theo đuôi file |
| R-007 | BR-002 mục 1 | Giữ đúng facts, số liệu, ý nghĩa, trích dẫn từ tài liệu |
| R-008 | BR-002 mục 2, Exceptions | Không trình bày nội dung AI bổ sung như lấy từ tài liệu |
| R-011 Acc 2 | BR-010 mục 2 | Mỗi lần sửa tạo một bản chờ duyệt |
| R-011 Acc 3 | BR-011 | Báo sửa theo slide là cố gắng, không đảm bảo |
| R-020 vế 1, Acc 1–2 | BR-006 | Tải về từ đúng bản đang xem trước, AI không tạo lại |
| R-020 vế 2, Acc 3 | BR-010 mục 3c, 6 | Bản chờ duyệt thành bản đã chấp nhận khi tải về thành công |
| R-022, R-023 | BR-004 | Không thay đổi ngoài phạm vi sửa |
| R-024 Yêu cầu, Acc 1 | BR-003 | Ràng buộc còn hiệu lực qua các lần sửa |
| R-024 Acc 2–4 | BR-010 mục 4–5 | Ràng buộc tại ranh giới commit |
| R-025 | BR-007 | Giữ facts, số liệu, thứ tự, ý nghĩa giữa các định dạng |
| R-026 | BR-013 | Báo phần không giữ được khi tải về |
| R-031 Acc 1 | BR-005, BR-010 mục 7 | Quay về bản đã chấp nhận khi bỏ hoặc thất bại |
| R-031 Acc 2 | BR-010 mục 5 | Quay về bản đã chấp nhận tại ranh giới commit |
| R-032 Acc 2 | BR-005 | Deck vẫn khôi phục được khi lỗi |
| R-043 | BR-008 | Gần như nguyên văn |
| R-045 | BR-012 mục 2 | Cảnh báo trước khi mất deck chưa tải về |
| R-046 Acc 2 | BR-010 mục 5 | Quay về bản đã chấp nhận tại ranh giới commit khi dừng |
| R-046 Acc 3 | BR-014 mục 2 | Lượt bị dừng không tạo bản mới |
| R-047 Acc 2 | BR-017 | Mọi slide cùng theme, giữ qua sửa và tải về |
| R-049 Acc 2 | BR-015 | Sửa bản sao không làm đổi deck gốc |

- Điều chưa biết hoặc cần chọn: bên nào sở hữu nội dung quy định. Có thể chọn một nguyên tắc chung rồi chỉnh riêng từng dòng.
- Phương án:
  - A. BR sở hữu quy tắc. R giữ câu Yêu cầu nêu hành vi quan sát được và Acceptance để kiểm chứng, trỏ BR qua `business_rules`. Chỗ R đang chép chi tiết của BR (R-020 vế 2, R-024 Acc 2–4, R-031 Acc 2, R-046 Acc 2–3) được thay bằng tóm tắt kèm ID BR. Cần thêm quan hệ còn thiếu: R-024→BR-010, R-046→BR-010, R-011→BR-010.
  - B. R sở hữu. BR bỏ phần trùng, chỉ giữ Exceptions và chi tiết mà R không có. BR nào không còn gì (có thể BR-008, BR-006) thì xóa, thành blocker XOA_ITEM.
  - C. Quyết định riêng từng dòng.
- Đề xuất: A. Bảng mục 1 và GR-15 trong `_CRITERIA.md` cho phép BR chi tiết hơn R, và BR áp cho nhiều UC. R vẫn có Acceptance riêng nên vẫn kiểm chứng được. Nên gộp với blocker tương ứng của business-rules. Không tính R-051 Acc 2 ↔ BR-018, vì R-051 là Draft và GX-10 chỉ áp từ Proposed.
- Quyết định:

### R-L17 · TRUNG_SO_HUU · Requirement trùng requirement khác
- Item: các cặp trong bảng
- Tiêu chí: GX-10, GR-15
- Hiện trạng:

| Item A (phần) | Item B (phần) | Nội dung trùng | Đề xuất sở hữu |
|---|---|---|---|
| R-007 Acc 3 | R-008 | Nội dung AI bổ sung không được trình bày như lấy từ tài liệu | R-008; R-007 bỏ Acc 3, Ghi chú trỏ R-008 |
| R-011 Acc 1 (loại "trau chuốt") | R-013 | Trau chuốt cả deck | R-013 sở hữu chi tiết; R-011 Acc 1 ghi "trau chuốt (R-013)" |
| R-013 Acc 2 | R-031 Acc 1 | Khôi phục bản đã chấp nhận khi bỏ bản chờ duyệt | R-031; R-013 bỏ Acc 2 |
| R-022 | R-023 | Không đổi phần ngoài phạm vi sửa; R-023 là trường hợp riêng cho deck có sẵn | R-022 sở hữu nguyên tắc; R-023 chỉ giữ phần "thuộc tính của deck có sẵn" |
| R-046 Acc 2 | R-031 Acc 2 | Quay về bản đã chấp nhận tại ranh giới commit khi lượt bị dừng | R-031; R-046 tóm tắt kèm ID |

- Điều chưa biết hoặc cần chọn: item nào sở hữu từng phần; có gộp item hay không.
- Phương án:
  - A. Làm theo cột "Đề xuất sở hữu": bỏ phần trùng ở một bên, thay bằng tham chiếu ID.
  - B. Gộp item (ví dụ gộp R-013 vào R-011, R-023 vào R-022). Cách này xóa ID, nên cần thêm quyết định XOA_ITEM.
  - C. Giữ cả hai, chấp nhận trùng.
- Đề xuất: A, vì không xóa ID nào, và mỗi item vẫn còn một năng lực riêng.
- Quyết định:

### R-L18 · TRUNG_SO_HUU · Requirement trùng Decision
- Item: các cặp trong bảng
- Tiêu chí: GX-10
- Hiện trạng:

| Requirement (phần) | Decision (phần) | Nội dung trùng |
|---|---|---|
| R-003 | D-024 mục 1 | 5 loại tài liệu có sẵn (gần như nguyên văn) |
| R-004 | D-007 | Vai trò file theo mục đích |
| R-011 Acc 1, Acc 3 | D-025 mục 1, mục 3 | 7 loại sửa; sửa theo slide là cố gắng |
| R-021 Acc 1 | D-028 Rationale 1 | 4 lỗi tối thiểu |
| R-024 Acc 2–4, R-031 Acc 2 | D-030 | Ranh giới commit và việc khôi phục |
| R-041 | D-006, D-015 | Không xây editor chuyên nghiệp |
| R-046 | D-029 | Dừng lượt xử lý, không đổi bản đã chấp nhận |

- Điều chưa biết hoặc cần chọn: Decision có phải tuân GX-10 như các item quy định khác, hay được coi là bản ghi lựa chọn tại một thời điểm.
- Phương án:
  - A. R sở hữu quy định. D giữ nguyên làm bản ghi lựa chọn và lý do (Nygard, GX-15 tinh thần không viết lại lịch sử). R ghi D trong `source`, D trỏ R qua `addresses`/`shapes`. Không viết lại D.
  - B. D sở hữu. R chỉ tóm tắt kèm ID D. Cách này làm R mất Acceptance tự đứng, trái GR-07.
  - C. Viết lại phần phát biểu hành vi trong D thành tóm tắt kèm ID R.
- Đề xuất: A. Decision ghi vì sao chọn, Requirement ghi hệ thống phải làm gì. Các cặp trên đều đã có D trong `source` của R hoặc R trong "Requirement chính" của D. Nên gộp với blocker tương ứng của decisions. R-041 phụ thuộc G-01; R-021 phụ thuộc G-06.
- Quyết định:

### R-L19 · THAM_CHIEU_LOAI_CU · Mã task W-xxx đang làm nơi xử lý cho điều chưa chốt
- Item: R-007 (Ghi chú, W-032), R-021 (Acceptance Note, W-032), R-042 (Ghi chú, W-028)
- Tiêu chí: GX-09 (câu hỏi mở phải có nơi xử lý: task, issue hoặc decision)
- Hiện trạng: "Tiêu chí đo chi tiết do W-032 nghiên cứu"; "Ngưỡng … do W-032 nghiên cứu"; "…vẫn phải được W-028 xem xét".
- Điều chưa biết hoặc cần chọn: bỏ W-xxx thì mất nơi xử lý của điều chưa chốt. Câu hỏi là spec dạng file trỏ tới task bằng gì.
- Phương án:
  - A. Giữ mã W-xxx dạng text làm nơi xử lý trong `Câu hỏi mở` / `Đo lường` (ví dụ "Chưa chốt (task W-032)"). Validator coi W-xxx là mã ngoài spec, không kiểm tồn tại.
  - B. Thay bằng issue GitHub tương ứng (cần người dùng cho số issue).
  - C. Bỏ mã, chỉ ghi "chờ nghiên cứu tiêu chí chất lượng". Cách này không đạt GX-09, vì thiếu nơi xử lý.
- Đề xuất: A. `_CRITERIA.md` GR-09 dùng chính dạng "Chưa chốt (benchmark ở task #142)". W-xxx là task của project, không phải item spec. Nên gộp với các loại khác cũng dùng W-xxx làm nơi xử lý (ví dụ UC-002 Open Questions W-032).
- Quyết định:

### R-L20 · TRANG_THAI · R-010 ở Proposed nhưng ghi "còn ở mức thăm dò"
- Item: R-010
- Tiêu chí: `_COMMON_CRITERIA.md` mục 1 (Proposed = đã cam kết thuộc sản phẩm; Draft = chưa chắc thuộc sản phẩm)
- Hiện trạng: Status Proposed; Ghi chú "1. Còn ở mức thăm dò."
- Điều chưa biết hoặc cần chọn: R-010 đã được cam kết thuộc sản phẩm hay chưa.
- Phương án:
  - A. Hạ xuống Draft, bỏ Ghi chú vì status đã thể hiện ý này.
  - B. Giữ Proposed, bỏ Ghi chú "còn ở mức thăm dò".
- Đề xuất: A, vì Ghi chú nói đúng nghĩa của Draft. Khác với R-021, nơi chỉ một khía cạnh (thẩm mỹ) còn thăm dò.
- Quyết định:

## 3. FILL_LATER
Mọi item đều thiếu `verification` và `inputs` (sheet không có). `Miền đầu vào` chỉ bắt buộc khi `verification: test` và `inputs: true`, từ Proposed. `Đo lường` theo GR-09 (mức độ) và GR-10 (kết quả do AI sinh).

| ID | Field/Section | Gợi ý |
|---|---|---|
| R-001 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu nêu hoặc không nêu từng loại ràng buộc (danh sách chờ R-L04). Đo lường (GR-10): bộ yêu cầu mẫu, số lần chạy, tỷ lệ ghi nhận đúng |
| R-002 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu thiếu chủ đề / thiếu mục đích / đủ cả hai (chờ R-L11). Đo lường (GR-10): tỷ lệ hỏi lại đúng trên bộ yêu cầu thiếu thông tin |
| R-003 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: hợp lệ = 5 loại; không hợp lệ = loại khác, PDF không có text layer (chuyển từ Yêu cầu và Acceptance 2). Biên kích thước và số trang chưa có trong sheet (xem mục 6) |
| R-004 | verification; inputs | gợi ý: inspection (Acceptance 2 là câu phủ định; trong V1 chỉ có một vai trò, theo BR-001 Exceptions); inputs: true |
| R-005 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: file PPTX là deck có sẵn |
| R-006 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu có hoặc không kèm tài liệu có sẵn (chuyển từ Yêu cầu). Đo lường (GR-10): tỷ lệ tạo được deck xem trước được trên bộ yêu cầu mẫu |
| R-007 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: 5 loại tài liệu (R-003). Đo lường (GR-10): validator tự động so số liệu trên slide với tài liệu; Ngưỡng đạt: Chưa chốt (R-L02, R-L19) |
| R-008 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: nội dung được yêu cầu có hoặc không có căn cứ trong tài liệu. Đo lường (GR-10): tỷ lệ nội dung AI bổ sung được đánh dấu hoặc hỏi trước |
| R-009 | verification; inputs; Đo lường | gợi ý: test bằng rubric, hoặc demonstration; inputs: true. Đo lường (GR-10): rubric chấm độ sâu kỹ thuật và giọng văn theo audience (chờ R-L02) |
| R-010 | verification; inputs | gợi ý: test; inputs: true (deck mẫu và phần muốn học theo) |
| R-011 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: hợp lệ = 7 loại sửa của D-025 (chuyển từ Acceptance 1); yêu cầu nhắm vào một slide. Đo lường (GR-10): tỷ lệ lần sửa đúng loại trên bộ yêu cầu mẫu |
| R-012 | verification; inputs; Đo lường | gợi ý: test; inputs: true. Đo lường (GR-10): tỷ lệ xác định đúng phạm vi |
| R-013 | verification; inputs | gợi ý: test; inputs: false |
| R-014 | verification; inputs | gợi ý: test; inputs: true (vị trí slide, hình ảnh thay thế) |
| R-015 | verification; inputs | gợi ý: test; inputs: true |
| R-016 | verification; inputs | gợi ý: test; inputs: false |
| R-017 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: loại file hình ảnh chưa có trong sheet |
| R-018 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-10) nếu tạo hình bằng AI |
| R-019 | verification; inputs | gợi ý: test; inputs: false |
| R-020 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: định dạng ∈ {PPTX, PDF} (theo D-026); bản đang xem trước là bản đã chấp nhận hoặc bản chờ duyệt |
| R-021 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-09, GR-10): Scale = số deck mắc ít nhất một trong 4 lỗi (chuyển từ Acceptance 1); Ngưỡng đạt: Chưa chốt (chuyển từ Acceptance 2; R-L02, R-L19) |
| R-022 | verification; inputs; Đo lường | gợi ý: test; inputs: true. Đo lường (GR-10): tỷ lệ lần sửa không đổi phần ngoài phạm vi |
| R-023 | verification; inputs | gợi ý: test; inputs: true |
| R-024 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu sửa có hoặc không nêu ràng buộc mới; bị hủy, bị từ chối hoặc qua ranh giới commit. Đo lường (GR-10): tỷ lệ deck giữ đúng ràng buộc sau N lần sửa |
| R-025 | verification; inputs | gợi ý: test; inputs: false |
| R-026 | verification; inputs | gợi ý: test; inputs: false |
| R-027 | verification; inputs | gợi ý: test; inputs: false (danh sách ứng dụng đích chờ R-L05) |
| R-028 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-09) nếu "khớp bố cục" được đo theo mức độ |
| R-029 | verification; inputs | gợi ý: demonstration với người dùng không có kỹ năng thiết kế; inputs: false |
| R-030 | verification; inputs | gợi ý: test; inputs: false |
| R-031 | verification; inputs | gợi ý: test; inputs: false |
| R-032 | verification; inputs | gợi ý: test bằng cách tiêm lỗi và quá thời gian của dịch vụ ngoài; inputs: false |
| R-033 | verification; inputs | gợi ý: test bằng cách tiêm kết quả AI hỏng; inputs: false |
| R-034 | verification; inputs | gợi ý: test; inputs: false |
| R-035 | verification; inputs; Đo lường | gợi ý: analysis hoặc test; inputs: false. Đo lường (GR-09): mức tính toán theo nhóm lượt xử lý; Ngưỡng: Chưa chốt |
| R-036 | verification; inputs | gợi ý: test hoặc inspection; inputs: false |
| R-037 | verification; inputs; Đo lường | gợi ý: test; inputs: true (giá trị giới hạn cấu hình). Ngưỡng: Chưa chốt (benchmark, chuyển từ Ghi chú) |
| R-038 | verification; inputs | gợi ý: analysis; inputs: false |
| R-039 | verification; inputs | gợi ý: analysis; inputs: false |
| R-040 | verification; inputs | gợi ý: analysis; inputs: false |
| R-041 | verification; inputs | gợi ý: inspection; inputs: false (phụ thuộc G-01) |
| R-042 | verification; inputs | gợi ý: test (quét log, file tạm, lưu lượng ra ngoài) kèm inspection; inputs: false |
| R-043 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: tài liệu có hoặc không chứa câu lệnh cài sẵn. Đo lường (GR-10): bộ tài liệu tấn công, số lần chạy, tỷ lệ AI không làm theo lệnh cài sẵn |
| R-044 | verification; inputs; Đo lường; Câu hỏi mở (nơi xử lý) | gợi ý: test; inputs: true (ngôn ngữ đích). Đo lường (GR-10): giữ ý nghĩa và số liệu. Nơi xử lý của câu hỏi về font, bố cục, độ trung thực (chuyển từ Acceptance 2) chưa có |
| R-045 | verification; inputs | gợi ý: test; inputs: false |
| R-046 | verification; inputs | gợi ý: test; inputs: false |
| R-047 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: theme có sẵn; bộ nhận diện gồm màu, font, logo (chuyển từ Acceptance 1); biên chưa có |
| R-048 | verification; inputs | gợi ý: test; inputs: false |
| R-049 | verification; inputs | gợi ý: test; inputs: false |
| R-050 | verification; inputs | gợi ý: test; inputs: true |
| R-051 | verification; inputs | gợi ý: test; inputs: true |
| R-052 | verification; inputs | gợi ý: test; inputs: false |
| R-053 | verification; inputs | gợi ý: test; inputs: false |
| R-054 | verification; inputs | gợi ý: test; inputs: false |

## 4. Dịch thử

### R-050 (đơn giản)

#### Bản gốc
- ID: R-050
- Tên ngắn: Duyệt dàn ý trước khi tạo deck
- Scope: Later
- Status: Draft
- Type: Functional
- Yêu cầu: DeckAgent có thể cho người dùng xem và sửa dàn ý trước khi AI tạo cả deck.
- Bối cảnh / Lý do: Sửa dàn ý nhanh hơn nhiều so với tạo lại cả deck khi cấu trúc sai.
- Acceptance Note: 1. Người dùng xem và sửa được dàn ý trước khi tạo deck. 2. Deck được tạo theo dàn ý đã xác nhận.
- Ghi chú: 1. Ý tưởng từ benchmark, chưa có trong DOC-001.
- Căn cứ: Benchmark 27/09/2026
- Area: Planning, AI, Web
- Depends On (IDs): R-001
- Related Work (IDs): (trống). Related Tests: (trống).
- Quan hệ lật (relations.json): `use_cases` UC-016 (từ Use Cases.Related Requirements).

#### Bản dịch
```markdown
---
id: R-050
short_name: "Duyệt dàn ý trước khi tạo deck"
type: Functional
status: Draft
scope: Later
verification:             # FILL_LATER (gợi ý: test)
inputs:                   # FILL_LATER (gợi ý: true — dàn ý do người dùng sửa)
area: [Planning, AI, Web]
source: ["Benchmark 27/09/2026"]
use_cases: [UC-016]
business_rules: []
constraints: []
assumptions: []
depends_on: [R-001]
---

## Yêu cầu

DeckAgent có thể cho người dùng xem và sửa dàn ý trước khi AI tạo cả deck.

## Bối cảnh / Lý do

Sửa dàn ý nhanh hơn nhiều so với tạo lại cả deck khi cấu trúc sai.

## Miền đầu vào

<!-- FILL_LATER -->

## Đo lường

<!-- FILL_LATER -->

## Acceptance

1. Người dùng xem và sửa được dàn ý trước khi tạo deck.
2. Deck được tạo theo dàn ý đã xác nhận.

## Câu hỏi mở

<!-- Không có nội dung: xóa section theo _TEMPLATE.md -->

## Ghi chú

1. Ý tưởng từ benchmark, chưa có trong DOC-001.
```

#### Thay đổi
1. Chuyển ID, Tên ngắn, Status, Scope, Type, Area sang frontmatter. Type `Functional` thuộc nhóm hành vi (GR-14); 3 giá trị Area đều có trong enum (GX-02).
2. Thêm `verification`, `inputs` để trống kèm gợi ý, vì sheet không có (FILL_LATER, quyết định 3).
3. `source` lấy nguyên mã "Benchmark 27/09/2026" (GX-11; xem mục 6 về việc chuẩn hóa mã).
4. `use_cases: [UC-016]` lấy từ relations.json (lật từ Use Cases.Related Requirements, GX-05). `depends_on` lấy từ cột Depends On.
5. Bỏ Related Work, Related Tests (trống).
6. Không viết lại câu nào. Item Draft chỉ chịu gate cấu trúc; GR-01, GR-02, GX-12, GX-16 áp từ Proposed hoặc Active. "có thể" hợp lệ ở Draft (GR-02).
7. Thêm `Miền đầu vào`, `Đo lường` với FILL_LATER; `Câu hỏi mở` không có nội dung nên xóa khi ghi file thật.

### R-024 (nhiều chỗ viết lại)

#### Bản gốc
- ID: R-024
- Tên ngắn: Giữ ràng buộc của người dùng qua các lần sửa
- Scope: V1
- Status: Active
- Type: Quality
- Yêu cầu: DeckAgent phải tiếp tục áp dụng ràng buộc của người dùng còn hiệu lực qua các lần sửa, cho tới khi người dùng đổi hoặc hủy.
- Bối cảnh / Lý do: Qua nhiều lần sửa, audience, ngôn ngữ hay độ dài người dùng đã nêu không được tự biến mất.
- Acceptance Note:
  1. Sau nhiều lần sửa liên tiếp, ràng buộc còn hiệu lực vẫn đúng trên deck.
  2. Trước ranh giới commit của một yêu cầu sửa mới, các ràng buộc mới của yêu cầu đó không được áp dụng vào trạng thái đã chấp nhận. Nếu yêu cầu bị hủy hoặc bị từ chối trước thời điểm này, các ràng buộc mới không được giữ lại.
  3. Tại ranh giới commit, ràng buộc của bản chờ duyệt (nếu có) trở thành tập ràng buộc của bản đã chấp nhận trước khi ràng buộc của yêu cầu mới được áp dụng.
  4. Nếu lượt sửa sau commit bị dừng, lỗi hoặc kết quả không qua kiểm tra, các ràng buộc mới của yêu cầu đó bị hủy khi rollback; hệ thống khôi phục tập ràng buộc của bản đã chấp nhận tại ranh giới commit và không quay về baseline cũ hơn.
- Ghi chú: 1. Thời hạn và cách xử lý xung đột giữa các loại ràng buộc còn mở (A-013), không chặn W-028.
- Căn cứ: DOC-001 NFR-Q05, D-025, D-030
- Area: Core, Planning, AI
- Depends On (IDs): R-001, R-011
- Related Work (IDs): W-002, W-028, W-032. Related Tests: (trống).
- Quan hệ lật (relations.json): `use_cases` UC-001, UC-004; `business_rules` BR-003; `assumptions` A-005, A-009, A-013.

#### Bản dịch
```markdown
---
id: R-024
short_name: "Giữ ràng buộc của người dùng khi sửa"
type: Quality
status: Active            # <!-- BLOCKER R-L04 --> giữ Active hay hạ Proposed
scope: V1
verification:             # FILL_LATER (gợi ý: test)
inputs:                   # FILL_LATER (gợi ý: true — yêu cầu sửa có nêu ràng buộc)
area: [Core, Planning, AI]
source: [DOC-001 NFR-Q05, D-025, D-030]
use_cases: [UC-001, UC-004]
business_rules: [BR-003]  # <!-- BLOCKER R-L16 --> thêm BR-010 nếu chọn phương án A
constraints: []
assumptions: [A-005, A-009, A-013]   # <!-- BLOCKER G-07 --> A-005 là assumption về project
depends_on: [R-001, R-011]
---

## Yêu cầu

Khi DeckAgent thực hiện một lần sửa deck, DeckAgent phải áp dụng mỗi ràng buộc của người dùng còn hiệu lực cho tới khi người dùng đổi hoặc hủy ràng buộc đó. <!-- BLOCKER R-L04 --> <!-- BLOCKER R-L16 -->

## Bối cảnh / Lý do

Audience, ngôn ngữ hay độ dài người dùng đã nêu không được tự biến mất qua nhiều lần sửa.

## Miền đầu vào

<!-- FILL_LATER -->

## Đo lường

<!-- FILL_LATER -->

## Acceptance

1. Cho deck có ràng buộc của người dùng còn hiệu lực, khi người dùng sửa deck nhiều lần liên tiếp mà không đổi hoặc hủy ràng buộc đó, thì deck sau mỗi lần sửa vẫn thỏa ràng buộc đó.
2. Cho một yêu cầu sửa mới chưa đạt ranh giới commit, thì tập ràng buộc của bản đã chấp nhận chưa chứa ràng buộc mới của yêu cầu đó. <!-- BLOCKER R-L16 --> <!-- BLOCKER R-L18 -->
3. Cho một yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, thì DeckAgent không giữ lại ràng buộc mới của yêu cầu đó. <!-- BLOCKER R-L16 --> <!-- BLOCKER R-L18 -->
4. Cho một bản chờ duyệt đang có, khi yêu cầu sửa mới đạt ranh giới commit, thì tập ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận trước khi DeckAgent áp dụng ràng buộc của yêu cầu mới. <!-- BLOCKER R-L16 --> <!-- BLOCKER R-L18 -->
5. Cho một lượt sửa đã qua ranh giới commit, khi lượt đó bị dừng, lỗi hoặc kết quả không qua kiểm tra kết quả, thì DeckAgent hủy ràng buộc mới của yêu cầu đó và khôi phục tập ràng buộc của bản đã chấp nhận tại ranh giới commit, không khôi phục về bản đã chấp nhận cũ hơn. <!-- BLOCKER R-L16 --> <!-- BLOCKER R-L18 -->

## Câu hỏi mở

1. Ràng buộc của người dùng hết hiệu lực khi nào, ngoài trường hợp người dùng đổi hoặc hủy, và DeckAgent xử lý xung đột giữa các loại ràng buộc thế nào? (A-013) <!-- BLOCKER R-L04 -->
```

#### Thay đổi
1. Rút short_name từ 10 xuống 8 tiếng, vẫn giữ thuật ngữ "ràng buộc của người dùng" (GR-16, GX-07).
2. Đưa điều kiện "Khi DeckAgent thực hiện một lần sửa deck" lên đầu câu theo EARS (GR-01, GR-03). Đổi "tiếp tục áp dụng … qua các lần sửa" thành "áp dụng … cho tới khi", cùng nghĩa. Thêm "ràng buộc đó" sau "đổi hoặc hủy" cho rõ tân ngữ (GX-17).
3. Viết Acceptance 1 dạng Cho / Khi / Thì (GR-07). Đổi "vẫn đúng trên deck" thành "deck … vẫn thỏa", có chủ ngữ rõ (GX-16). Điều kiện "mà không đổi hoặc hủy" lấy từ câu Yêu cầu, không phải thông tin mới.
4. Tách Acceptance 2 gốc thành điều 2 và 3, vì gốc có hai điều kiện và hai kết quả (GX-14, GR-07).
5. Đổi "trạng thái đã chấp nhận" thành "tập ràng buộc của bản đã chấp nhận". Glossary ghi "accepted state" là "Không dùng" và dùng "bản đã chấp nhận" (GX-07).
6. Đổi "(nếu có)" thành điều kiện tường minh "Cho một bản chờ duyệt đang có" (GX-08, GR-03).
7. Đổi "rollback" thành "khôi phục"; "baseline cũ hơn" thành "bản đã chấp nhận cũ hơn", theo cách viết của BR-010 mục 8 (GX-07).
8. Đổi "không qua kiểm tra" thành "không qua kiểm tra kết quả", dùng thuật ngữ glossary (GX-07).
9. Đổi "Nếu lượt sửa sau commit…" thành "Cho một lượt sửa đã qua ranh giới commit…", để thống nhất một cụm "ranh giới commit" (GX-07).
10. Chuyển Ghi chú (thời hạn, xung đột, A-013) sang `Câu hỏi mở`, viết dạng câu hỏi có "?" (GX-09, GX-12). Bỏ "không chặn W-028", vì đó là ghi chú quy trình (mục 5). `Ghi chú` trống nên xóa.
11. Tách `Căn cứ` thành danh sách `source`. Lấy `use_cases`, `business_rules`, `assumptions` từ relations.json (GX-05). Bỏ Related Work.
12. Gắn marker blocker: R-L04 (status và Câu hỏi mở), R-L16 (Yêu cầu trùng BR-003; Acceptance 2–5 trùng BR-010 mục 4–5), R-L18 (Acceptance 2–5 trùng D-030), G-07 (A-005).
13. Chưa sửa và chưa giải quyết được: `Bối cảnh / Lý do` gần như lặp câu Yêu cầu (GR-06), nhưng sheet không có lý do khác nên không viết thêm. Acceptance 3 là câu phủ định (GR-12), giữ vì không có cách quan sát thay thế trong sheet.

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| R-003.Ghi chú | L-001 | Giữ làm text: giữ danh sách "OCR, XLSX/CSV, … chưa thuộc V1", bỏ "(L-001)" |
| R-007.Ghi chú | W-032 | Blocker R-L19 (nơi xử lý của tiêu chí đo chưa chốt) |
| R-017.Ghi chú | L-001 | Giữ làm text: "… dùng lại ảnh nhúng chưa thuộc phạm vi", bỏ ID |
| R-017.Căn cứ | L-001 | Bỏ: `source` vẫn còn `DOC-001 FR17` |
| R-018.Căn cứ | L-002 | Bỏ: `source` vẫn còn `DOC-001 FR18` |
| R-021.Acceptance Note | W-032 | Blocker R-L19 (nơi xử lý của ngưỡng chưa chốt) |
| R-024.Ghi chú | W-028 | Bỏ: "không chặn W-028" là ghi chú quy trình |
| R-028.Ghi chú | W-032 | Giữ làm text: "Kiến trúc phải cho quan sát được bố cục và file tải về để kiểm chứng requirement này", bỏ ID |
| R-038.Bối cảnh / Lý do | L-001 | Giữ làm text: "Sau V1 sẽ mở thêm loại tài liệu", bỏ ID |
| R-038.Ghi chú | W-028 | Giữ làm text: "Không phải acceptance của V1", bỏ "Kiến trúc vẫn cân nhắc qua W-028" |
| R-039.Ghi chú | W-028 | Giữ làm text: như R-038 |
| R-040.Ghi chú | W-028 | Giữ làm text: như R-038 |
| R-042.Ghi chú | W-028 | Blocker R-L19 (nơi xử lý của câu hỏi về việc gửi nội dung cho nhà cung cấp AI; gắn với R-L07) |
| R-044.Căn cứ | W-026 | Bỏ: `source` vẫn còn D-025, và D-025 Rationale 4 ghi chính nội dung này |
| R-047.Ghi chú | L-002 | Giữ làm text: "Nhu cầu đổi phong cách cả deck còn là câu hỏi mở", bỏ ID |
| R-047.Căn cứ | L-002 | Bỏ: `source` còn "Benchmark 27/09/2026" (xem mục 6) |

## 6. Ghi chú cho agent chính
1. **Đếm và phân nhóm.** Đủ 54 item: CẤU-TRÚC 3, VIẾT-LẠI 5, BLOCKER 46, XÓA 0. Ba item CẤU-TRÚC đều là Draft. Nếu áp GX-16 (thể chủ động) chặt với Acceptance, gần như mọi item Proposed và Active đều cần viết lại ít nhất một câu.
2. **Đo lường theo GR-10.** `Đo lường` là section mới. Tôi xếp vào FILL_LATER theo quyết định 3 và 6, không tạo blocker TRANG_THAI riêng cho việc thiếu tỷ lệ đạt GR-10 ở các item Active có kết quả do AI sinh: R-001, R-002, R-006, R-007, R-008, R-009, R-011, R-013, R-021, R-024, R-043. Nếu agent chính coi tỷ lệ đạt GR-10 là điều kiện GX-09 cho Active, các item này phải gộp vào R-L02 (cùng câu hỏi: chờ bộ đánh giá).
3. **Miền đầu vào của R-003.** Khi điền FILL_LATER, R-003 (Active, inputs: true) cần biên kích thước hoặc số trang tài liệu. Sheet không có số này. Lúc đó sẽ thành một blocker SO_LIEU kiểu "giới hạn kích thước tài liệu đầu vào". Tôi chưa tạo, vì section đang để trống theo quyết định 3.
4. **short_name (GR-16).** 16 tên vượt 8 tiếng nếu đếm theo khoảng trắng: R-001, R-004, R-008, R-011, R-014, R-023, R-024, R-026, R-030, R-032, R-033, R-035, R-040, R-043, R-045, R-048. Tiếng Việt đếm "từ" theo tiếng hay theo từ ghép là chưa rõ. Tôi giả định Lint đếm theo khoảng trắng, nên ghi "rút gọn short_name". Việc này được phép theo quyết định 5.
5. **`source` không có ID.** R-049, R-050, R-052, R-053, R-054 chỉ có "Benchmark 27/09/2026"; R-047 chỉ còn mã này sau khi bỏ L-002. Tôi coi đây là mã nguồn có ngày (GX-11), nhưng nên chuẩn hóa thành một mã thống nhất (ví dụ `BENCH-2026-09-27`). Tôi không tự đổi.
6. **Mã DOC-001 P1–P5.** Ghi chú R-009 (P2), R-012 và R-022 (P4), cùng Acceptance R-025 (P5) đang dùng mã này như nguồn. Tôi đề xuất chuyển sang `source` dạng `DOC-001 Px` (chuyển chỗ, GX-12), giống cách BR-002 và BR-003 đang ghi.
7. **"ranh giới commit".** Cụm này được BR-010, D-030, R-024, R-031, R-046 dùng nhưng không có trong glossary. Gợi ý cho bước glossary: thêm thuật ngữ này. "audience" cũng chưa có trong glossary.
8. **Gộp với loại khác.**
   - R-L04 gộp với blocker của business-rules về BR-003 Exceptions ("cách phân biệt sẽ được định nghĩa sau").
   - R-L16 là cùng một câu hỏi với phía business-rules (GX-10 giữa R và BR).
   - R-L18 là cùng một câu hỏi với phía decisions (Decision có chịu GX-10 không).
   - R-L19 gộp với các loại khác dùng W-xxx làm nơi xử lý (ví dụ UC-002 Open Questions W-032).
   - R-L02 và R-L08 phụ thuộc G-06 (D-028) và G-04 (D-011).
9. **Phụ thuộc giữa blocker.**
   - Nếu R-L01 chọn B, hoặc R-L08 chọn B (hạ R-030), thì R-046 (Active) sẽ `depends_on` một item Proposed. Proposed vẫn có hiệu lực nên không vi phạm GX-04, nhưng R-046 nên được xem lại.
   - R-L13 với R-030 (tách) cũng ảnh hưởng `depends_on` của R-046.
10. **Item Draft.** Không áp GX-10, GR-04, GR-11 cho R-050 đến R-054, vì các tiêu chí này áp từ Proposed. R-051 Acceptance 2 trùng BR-018, và R-051, R-053 gộp nhiều hành vi; cần xử lý khi các item này lên Proposed.
11. **Type.** R-030, R-031, R-032, R-033 có type Quality nhưng mô tả hành vi; chúng đều trỏ Use Case nên GR-13 không bị ảnh hưởng. Tôi không đề xuất đổi type, vì không có tiêu chí nào bắt buộc.
12. **Ghi chú chứa quy định.** R-028 Ghi chú ("Kiến trúc phải cho quan sát được…") và R-033 Ghi chú ("kiến trúc phải làm bước này kiểm chứng được") đang chứa quy định về khả năng kiểm chứng của kiến trúc (GX-12). Tôi giữ làm text. Agent chính nên cân nhắc chuyển sang D-028, hoặc sang một requirement về testability.
