# Blocker liên loại (bản đầy đủ, ID tạm G-xx; đánh số BLK ở A6)

### G-01 · DOI_LOAI · R-041 có type Constraint
- Item: R-041; D-006, D-011, D-015 (có `addresses: [R-041]`); C-002 (R-041 là Requirement duy nhất trỏ tới C-002, cần cho GC-07)
- Tiêu chí: GR-14, GX-02, GX-10, GC-07
- Hiện trạng: Type = `Constraint`. Yêu cầu: "DeckAgent phải đạt mục tiêu của V1 mà không cần xây một editor chỉnh slide chuyên nghiệp trong ứng dụng." Bối cảnh: "Thời gian và số người của đồ án có hạn và V1 ưu tiên tạo mới". Căn cứ: D-015, C-002.
- Điều chưa biết hoặc cần chọn: Requirement không có nhóm "constraint" (GR-14). Nội dung là giới hạn phạm vi, đã được D-006 và D-015 sở hữu như lựa chọn của team; C-001 cùng nội dung đã bị Retired vì "đây là lựa chọn của team, không phải giới hạn từ bên ngoài".
- Phương án:
  - A. Xóa R-041, đưa vào "ID đã nghỉ". Nội dung thuộc D-015 (lựa chọn) và C-002 (giới hạn nguồn lực).
  - B. Giữ R-041 là Requirement, đổi `type: Quality`, `verification: inspection` (kiểm phạm vi V1 không có editor chỉnh slide).
  - C. Chuyển thành Constraint mới (ID C-008) với `imposed_by` là nguồn lực đồ án.
- Đề xuất: A, vì cùng nội dung đã bị Retired khỏi Constraint với lý do là lựa chọn của team, và D-015 đang sở hữu lựa chọn đó (GX-10). Nếu chọn A thì G-08 tự hết, `addresses: [R-041]` của D-006, D-011, D-015 bị bỏ, và C-002 chỉ còn Use Case trỏ tới: C-002 (type Resource, nhóm dự án) khi đó trượt GC-07 (Lint) nếu không có Requirement hoặc Decision nào khác trỏ tới. Nếu chọn C thì `addresses` của 3 Decision trỏ sai loại và phải đổi sang `constraints`.
- Quyết định:

### G-02 · PHU_THUOC_DONG · Item Active dựa vào C-001 đã Retired
- Item: C-001; R-029, R-041, D-006, D-015 (Active); R-014, R-015 (Proposed, cùng câu hỏi)
- Tiêu chí: GX-04
- Hiện trạng: C-001 Ghi chú: "Retired ngày 27/09/2026: đây là lựa chọn của team, không phải giới hạn từ bên ngoài (OR-045); nội dung đã được ghi ở D-006 và D-015." Cột Related Requirements/Decisions của C-001 vẫn còn R-014, R-015, R-029, R-041, D-006, D-015.
- Điều chưa biết hoặc cần chọn: Giữ quan hệ `constraints → C-001` thì vi phạm GX-04.
- Phương án:
  - A. Bỏ quan hệ `constraints: [C-001]` ở cả 6 item. C-001 giữ Retired để truy vết.
  - B. Kích hoạt lại C-001 (Active) và giữ quan hệ.
  - C. Hạ R-029, R-041, D-006, D-015 về Proposed.
- Đề xuất: A, vì C-001 bị Retired có chủ đích và nội dung đã chuyển sang D-006, D-015.
- Quyết định:

### G-03 · PHU_THUOC_DONG · Item Active dựa vào C-005 đã Retired
- Item: C-005; R-003, R-004 (Active); R-005, R-010, R-017 (Proposed, cùng câu hỏi)
- Tiêu chí: GX-04, GX-10
- Hiện trạng: C-005 "Vai trò của file không được gán cứng theo loại file" ở trạng thái Retired, không ghi lý do retire. Cùng nội dung có ở D-007 (Active), BR-001 (Active) và R-004.
- Điều chưa biết hoặc cần chọn: Lý do C-005 bị Retired không có trong sheet. Giữ quan hệ thì vi phạm GX-04.
- Phương án:
  - A. Bỏ quan hệ `constraints: [C-005]` ở 5 Requirement; quy tắc do BR-001 sở hữu (R đã có thể trỏ BR-001 qua `business_rules`).
  - B. Kích hoạt lại C-005 và giữ quan hệ.
- Đề xuất: A, vì D-007 và BR-001 đang sở hữu nội dung này, và một lựa chọn của team không phải Constraint (GC-01).
- Quyết định:

### G-04 · XOA_ITEM · Quy tắc "chưa chốt cơ chế và ngưỡng khi chưa có evidence" (C-006, C-007, D-011)
- Item: C-006, C-007, D-011; quan hệ từ R-030, R-032, R-035, R-036, R-037 (→ C-007) và D-011 (→ C-006); text trích D-011 ở ACT-002, UC-014, R-032, R-037; R-037 có D-011 trong `source`
- Tiêu chí: GX-04, GC-01, GC-07, mục 1 của 07-decisions/_CRITERIA.md (quyết định về cách team làm việc)
- Hiện trạng: C-006 (Retired): "Các lựa chọn implementation như IR …, scene model, … chưa được coi là constraint hay giải pháp bắt buộc." C-007 (Retired): "Ngưỡng định lượng … không được đặt tùy ý trước khi có benchmark hoặc evidence." D-011 (Active): "Không chốt trước cơ chế Architecture hoặc ngưỡng định lượng khi chưa có acceptance criteria của V1, benchmark hoặc evidence trade-off."
- Điều chưa biết hoặc cần chọn: Ba item là quy tắc về cách team ra quyết định, không nói DeckAgent làm gì. Bộ tiêu chí mới đã chứa ý tương tự (GR-09: "không đặt số khi chưa có dữ liệu"; GC-04). Nhưng nhiều Requirement đang dựa vào C-007 (đã Retired, vi phạm GX-04) và trích D-011.
- Phương án:
  - A. Xóa cả ba (ID đã nghỉ). Bỏ quan hệ tới C-006, C-007. Text trích D-011 viết lại thành "chưa chốt" kèm nơi xử lý, không dùng ID.
  - B. Giữ C-006, C-007 ở Retired để truy vết, xóa D-011. Vẫn phải bỏ quan hệ R → C-007 vì GX-04.
  - C. Giữ D-011 là Decision sản phẩm (Active), giữ C-006, C-007 Retired, bỏ quan hệ R → C-007.
- Hệ quả phụ: A-018 chỉ được R-035, R-036, R-037 dựa vào. Nếu bỏ quan hệ của nhóm này thì A-018 vẫn còn (quan hệ `assumptions` không đổi), nhưng nếu các R đó bị hạ hay bỏ thì A-018 có thể không còn ai trỏ tới (GA-03). Nếu giữ D-011 hoặc D-028 (G-06) ở Active thì chúng chứa "chưa chốt", sẽ cần thêm blocker TRANG_THAI ở Pha B.
- Đề xuất: A, vì nội dung là quy trình của team và đã được GR-09 của bộ tiêu chí thay thế.
- Quyết định:

### G-05 · XOA_ITEM · D-010 phân loại khái niệm trong spec
- Item: D-010 (addresses tạm: R-020, R-025, R-026)
- Tiêu chí: mục 1 của 07-decisions/_CRITERIA.md, GX-10
- Hiện trạng: "Nhiều định dạng tải về là constraint của project; độ nhất quán giữa các định dạng là quality requirement; bản thân việc có nhiều định dạng không phải đóng góp của sản phẩm."
- Điều chưa biết hoặc cần chọn: D-010 quyết định cách xếp loại item, không quyết định hành vi sản phẩm. Sau migrate, hai nửa của D-010 đã được C-003 (Constraint) và R-025 (Quality) thể hiện.
- Phương án:
  - A. Xóa D-010 (ID đã nghỉ).
  - B. Giữ D-010, viết lại thành Decision về phạm vi: "V1 không coi nhiều định dạng tải về là giá trị của sản phẩm", với `shapes: [R-025]`.
- Đề xuất: A, vì nội dung đã nằm trong cách phân loại C-003 và R-025.
- Quyết định:

### G-06 · XOA_ITEM · D-028 khi nào tiêu chí chất lượng thành Hard Gate
- Item: D-028; R-007, R-021, R-025, R-028 (trích D-028 trong `source` hoặc text)
- Tiêu chí: mục 1 của 07-decisions/_CRITERIA.md, GD-01, GX-10
- Hiện trạng: Decision: "1. W-026 không tạo thêm Hard Gate chỉ vì research thấy một failure mode tồn tại. 2. Một tiêu chí chất lượng chỉ thành Hard Gate khi V1 baseline đã cam kết mức tối thiểu đó, hoặc tiêu chí thuộc P1 hay P5. 3. Phần còn thiếu evidence được giữ làm candidate criterion hoặc research gap cho W-032." Danh sách 4 lỗi tối thiểu đã có nguyên văn trong Acceptance Note của R-021.
- Điều chưa biết hoặc cần chọn: Vế 1 và 3 nói về việc research của team (W-026, W-032). Vế 2 là chính sách nghiệm thu chất lượng. Danh sách lỗi tối thiểu (nội dung sản phẩm) đã thuộc R-021.
- Phương án:
  - A. Xóa D-028. R-021 giữ danh sách lỗi tối thiểu; "D-028 đã chốt" trong R-021 viết lại không có ID; bỏ D-028 khỏi `source` của R-007, R-021, R-025, R-028.
  - B. Giữ D-028 chỉ với vế 2 (sản phẩm), bỏ vế 1 và 3. Bỏ vế là đổi nghĩa, nên cần người dùng duyệt.
  - C. Giữ D-028 nguyên ba vế; W-026, W-032 viết lại thành text.
- Đề xuất: A, vì phần sản phẩm đã nằm ở R-021 và phần còn lại là quy trình research.
- Quyết định:

### G-07 · PHU_THUOC_XOA · 9 Requirement dựa vào A-005 (giả định về chiến lược Testing)
- Item: A-005; R-007, R-021, R-024, R-025, R-027, R-028, R-031, R-032, R-033
- Tiêu chí: GX-04, GA-03, mục 1 của 03-assumptions/_CRITERIA.md
- Hiện trạng: A-005 "Tập trung Testing vào critical behavior và contract sẽ phát hiện được các lỗi nghiêm trọng mà chưa cần phủ test toàn hệ thống." Used By: 9 Requirement Active.
- Điều chưa biết hoặc cần chọn: A-005 là giả định về cách team test, nên bị xóa theo quyết định 2. Quan hệ `assumptions` nghĩa là "Requirement chỉ cần thiết khi assumption đúng", điều không đúng với 9 Requirement này: chúng vẫn cần dù chiến lược Testing đổi.
- Phương án:
  - A. Xóa A-005 và bỏ 9 quan hệ.
  - B. Giữ A-005 trong spec như assumption sản phẩm và giữ 9 quan hệ.
- Đề xuất: A, vì không Requirement nào trong 9 mất lý do tồn tại khi A-005 sai.
- Quyết định:

### G-08 · PHU_THUOC_DONG · R-041 dựa vào A-004 (Retired, project) và UC-005 (Deprecated)
- Item: R-041, A-004, UC-005
- Tiêu chí: GX-04
- Hiện trạng: A-004 Used By: R-041. UC-005 Related Requirements: R-015, R-041. A-004 Retired ("repo chưa có product code và chưa chọn Architecture nào"); UC-005 Deprecated.
- Điều chưa biết hoặc cần chọn: Chỉ còn ý nghĩa nếu G-01 không chọn xóa R-041.
- Phương án:
  - A. Bỏ quan hệ `R-041.assumptions → A-004` và `R-041.use_cases → UC-005`.
  - B. Hạ R-041 về Proposed và giữ quan hệ.
- Đề xuất: A, vì A-004 bị xóa (project) và UC-005 đã ngừng.
- Quyết định:

### G-10 · PHU_THUOC_DONG · R-042 dựa vào UC-018 đang Draft
- Item: R-042, UC-018
- Tiêu chí: GX-04
- Hiện trạng: UC-018 (Draft, Later) có Related Requirements R-042, R-048, R-052, nên R-042 (Active, V1) nhận `use_cases: [UC-018]`. Ghi chú UC-018: "Trong V1, việc không để lộ dữ liệu qua log và file tạm thuộc R-042."
- Điều chưa biết hoặc cần chọn: R-042 không cần UC-018 để có nghĩa; UC-018 chỉ ghi chú rằng R-042 sở hữu phần V1.
- Phương án:
  - A. Không ghi `R-042.use_cases → UC-018`. Ghi chú của UC-018 giữ câu tham chiếu R-042.
  - B. Ghi quan hệ và hạ R-042 về Proposed.
- Đề xuất: A.
- Quyết định:

### G-11 · SCHEMA · Area ngoài enum
- Item: R-027 (`CI`); R-032, R-035, R-037, R-042, R-051, R-053 (`Infra`); R-041 (`Schedule`)
- Tiêu chí: GX-02
- Hiện trạng: `schema.json` area có `CI/Infra`, không có `CI`, `Infra`, `Schedule`.
- Điều chưa biết hoặc cần chọn: Ánh xạ sang giá trị có sẵn hay mở rộng schema.
- Phương án:
  - A. `CI` và `Infra` → `CI/Infra`; bỏ `Schedule` (lịch trình là việc của dự án).
  - B. Thêm `CI`, `Infra`, `Schedule` vào `schema.json`.
- Đề xuất: A, vì `CI/Infra` đã gộp hai giá trị, và lịch trình không phải area của sản phẩm.
- Quyết định:
