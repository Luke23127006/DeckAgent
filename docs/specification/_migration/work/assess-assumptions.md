# Đánh giá: assumptions

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| A-001 | XÓA | Phân loại `project` (A2): giả định về việc làm rõ phạm vi V1 trong Sprint 1. Status Supported có `source` DOC-002 nên đạt GA-07, nhưng không chuyển | — |
| A-002 | XÓA | `project`: development flow chung giữa các Agent. Không Requirement hay Decision nào dựa vào | — |
| A-003 | XÓA | `project`: rule GitHub cho branch, PR, CI. Không Requirement hay Decision nào dựa vào | — |
| A-004 | XÓA | `project`, Retired. Tham chiếu W-026, W-034, W-035 trong Ghi chú bỏ cùng item (mục 5). Quan hệ R-041 → A-004 xử lý ở G-08 | G-08 |
| A-005 | XÓA | `project`: chiến lược Testing. 9 Requirement Active đang dựa vào, xử lý ở G-07 | G-07 |
| A-006 | XÓA | `project`: chọn lọc Skill cho Agent. Không Requirement hay Decision nào dựa vào | — |
| A-007 | BLOCKER | Câu gộp ba đặc điểm của nhóm người dùng (trùng ACT-001, một vế trùng A-008) với lựa chọn "nên phục vụ" không bác bỏ được (GA-01, GA-02, GX-10) → A-L02; "chuyên sâu" (GX-08). Signpost: "khác rõ rệt" chưa có ngưỡng (GA-04) → A-L05; vế "team chọn nhóm người dùng hẹp hơn" là sự kiện quyết định, không phải dấu hiệu sai → A-L04. Ghi chú 3 bỏ tên nguồn DOC-001, DOC-002, giữ ý "chưa có evidence thực tế" (GX-12) | A-L01, A-L02, A-L04, A-L05 |
| A-008 | BLOCKER | "phần lớn" chưa có đại lượng nên câu chưa bác bỏ được (GA-01, GX-08) → A-L05. Signpost: "nhiều hơn" (GA-04) → A-L05; vế "AI-first không giảm được việc thủ công" đo hiệu quả của AI, không đo điều người dùng muốn → A-L04. Ghi chú 2: "nếu sai, mục tiêu và ranh giới V1 có thể phải mở lại" chuyển sang `Nếu sai` (GA-06); "Là nền của quyết định…" bỏ vì quan hệ D-006, D-012 → A-008 đã ghi (GX-12) | A-L01, A-L04, A-L05 |
| A-009 | BLOCKER | "hợp với người dùng" mơ hồ, câu chưa chỉ ra quan sát bác bỏ (GA-01, GX-08) → A-L05. Signpost tách 3 tín hiệu thành danh sách (GX-14); "gõ lại nhiều lần", "hiệu quả hơn" chưa có ngưỡng (GA-04) → A-L05. Ghi chú giữ (giới hạn phạm vi) | A-L01, A-L05 |
| A-010 | BLOCKER | Viết thành một giả thuyết, bỏ "có thể" (GA-01); "lỗi nhỏ" chưa có danh sách (GX-08) → A-L06. Signpost: "hiếm khi", "thường xuyên" (GA-04) → A-L06; vế "thường xuyên cần sửa trước khi tải về" là tín hiệu xác nhận → A-L04. Ghi chú: bỏ nguồn DOC-002 (GX-12); "không được kéo V1 sang xây editor web" là quy định của D-015 → A-L03; "Theo dõi cho UC-005" giữ làm text | A-L01, A-L03, A-L04, A-L06 |
| A-011 | BLOCKER | "nhu cầu cốt lõi" và "capability phụ" chưa có đại lượng (GA-01) → A-L09. Signpost: vế "nhu cầu sửa deck có sẵn lớn" là tín hiệu xác nhận, vế "chi phí… quá cao so với giá trị" là tín hiệu chi phí → A-L04; "lớn", "quá cao" (GA-04) → A-L09. Ghi chú giữ | A-L01, A-L04, A-L09 |
| A-012 | BLOCKER | Bỏ vế "nên DeckAgent cần đầu tư vào việc giữ nguyên phần ngoài phạm vi sửa" (quy định của R-022, GX-10) → A-L03; "thường xuyên" chưa có tần suất (GA-01, GX-08) → A-L10. Signpost: vế "trở thành vấn đề lớn" là tín hiệu xác nhận → A-L04; "lớn" → A-L10. Ghi chú giữ; "P4 Safe Refinement" giữ làm tên riêng | A-L01, A-L03, A-L04, A-L10 |
| A-013 | BLOCKER | Viết thành giả thuyết "nếu DeckAgent không giữ… thì trải nghiệm giảm", chủ động (GA-01, GX-16); vế "cần được giữ" và Ghi chú 1 phát biểu lại BR-003 → A-L03; "giảm rõ rệt" chưa có đại lượng (GA-01, GX-08) → A-L10. Review Trigger tách 2 tín hiệu (GX-14); "khi đó cần xác định thời hạn theo từng loại ràng buộc" chuyển sang `Nếu sai` (GA-06). Dịch thử ở mục 4 | A-L01, A-L03, A-L10 |
| A-014 | BLOCKER | "nhận được giá trị" chưa có đại lượng (GA-01) → A-L09. Signpost: "ít loại file", "độ phức tạp lớn mà ít giá trị" (GA-04) → A-L09; vế độ phức tạp là tín hiệu chi phí → A-L04. Ghi chú 1 đã tóm tắt D-007, D-024 kèm ID, giữ (GX-10) | A-L01, A-L04, A-L09 |
| A-015 | BLOCKER | Bỏ vế "nên DeckAgent phải phân biệt rõ…" (quy định của R-008) → A-L03; "tài liệu" → "tài liệu có sẵn" (GX-07); "quan tâm" chưa có đại lượng (GA-01) → A-L08. Signpost: "luồng tạo từ tài liệu ít được dùng" đo mức dùng, không đo điều người dùng coi trọng → A-L04; "tự do hơn dự kiến" → A-L08. Ghi chú 3 chuyển sang `Cách kiểm chứng` (một phần); "P1 Source Fidelity" giữ làm tên riêng (GL-L05) | A-L01, A-L03, A-L04, A-L08 |
| A-016 | BLOCKER | Câu so sánh hai mức coi trọng nhưng chưa có đại lượng (GA-01) → A-L08. Signpost: "Yêu cầu đồ án… đòi hỏi" và "một định dạng cần contract riêng" không phải dấu hiệu người dùng coi trọng khác → A-L04; "cao hơn" → A-L08. Ghi chú 2 "V1 không yêu cầu PPTX và PDF giống nhau từng pixel" là quy định của D-009 → A-L03 | A-L01, A-L03, A-L04, A-L08 |
| A-017 | BLOCKER | "đáng tin", "dùng được" (GA-01, GX-08) → A-L08. Signpost "khác nhau rõ rệt" (GA-04) → A-L08. Ghi chú 2: vế "nếu sai, luồng Xem trước → Giữ → Tải về phải thay đổi" chuyển sang `Nếu sai` (GA-06); vế còn lại giữ | A-L01, A-L08 |
| A-018 | BLOCKER | "khác nhau rõ ràng", "chất lượng bắt buộc" chưa có đại lượng (GA-01, GX-08) → A-L11. Review Trigger: "Sau benchmark về thời gian, chi phí, khả năng model và chất lượng" chuyển sang `Cách kiểm chứng` (một phần); 2 điều kiện bác bỏ giữ trong Signpost (GX-14), "lớn hơn lợi ích" → A-L11. Ghi chú 2 bỏ nguồn "Option B (AD6) trong DOC-001" (GX-12), giữ "không phải mục tiêu chính của V1" | A-L01, A-L11 |
| A-019 | BLOCKER | "phân biệt được rõ" chưa có đại lượng (GA-01, GX-08) → A-L11; danh sách 6 loại giữ nguyên. Signpost "quá mơ hồ", "không giúp" (GA-04) → A-L11. Ghi chú 2 bỏ tên nguồn DOC-001, giữ ý "mô hình tư duy hiện tại, chưa được chứng minh" (GX-12); Ghi chú 3 đã tóm tắt D-025 kèm ID, giữ | A-L01, A-L11 |
| A-020 | BLOCKER | "chỉnh tay chuyên sâu", "công cụ chuyên dụng" (GX-08) → A-L06. Signpost tách 3 tín hiệu (GX-14); "nhiều hơn dự kiến" → A-L06; "file PPTX bàn giao không dùng được" cùng câu hỏi với A-022 → A-L07. Ghi chú 2 bỏ (quan hệ D-015 → A-020 đã ghi, GX-12) | A-L01, A-L06, A-L07 |
| A-021 | BLOCKER | "mức dùng được" chưa có tiêu chí (GA-01, GX-08) → A-L06. Signpost "quá thường xuyên", "mất kiểm soát" (GA-04) → A-L06. Ghi chú phát biểu lại D-025 → tóm tắt kèm ID (GX-10) | A-L01, A-L06 |
| A-022 | BLOCKER | Bỏ vế "nhờ đó V1 không cần xây editor chuyên nghiệp" (quy định của D-015) → A-L03; "dùng được để bàn giao" chưa có ứng dụng đích và tiêu chí (GA-01) → A-L07. Signpost "mở ổn định", "khó sửa", "làm lại nhiều" (GA-04) → A-L07. Ghi chú 1 tóm tắt D-026 kèm ID; Ghi chú 2 chuyển sang `Cách kiểm chứng` (một phần) | A-L01, A-L03, A-L07 |
| A-023 | VIẾT-LẠI | Nêu tên PPTX, PDF thay cho "hai định dạng, một sửa được và một chỉ xem"; vế "dù tầm nhìn sản phẩm…" chuyển sang Ghi chú (GA-01). Signpost tách 2 sự kiện (GX-14), bỏ "ngay" (GX-08). Ghi chú phát biểu lại D-026 → tóm tắt kèm ID (GX-10). Dịch thử ở mục 4 | — |
| A-029 | BLOCKER | Giữ một item: vế "vì tải về PPTX giúp họ giữ…" là cơ chế của cùng giả thuyết (GA-02, mục 6). Signpost "thường mất", "thường cần quay lại" (GA-04) → A-L10. Ghi chú 2 "Nếu sai, cần mở R-048" chuyển sang `Nếu sai` (GA-06); Ghi chú 1 là lịch sử và quan hệ D-027 → bỏ (GX-12) | A-L01, A-L10 |

Quy tắc chung cho mọi item product (không lặp ở từng dòng): `short_name` đặt mới 3–8 từ (GA-08); `Căn cứ` → `source`; Impacts và Related Work (IDs) bỏ; Used By (IDs) lật sang field `assumptions` của Requirement hoặc Decision (GX-05); Review Trigger → `Signpost`; dòng "Ảnh hưởng V1: …" trong Ghi chú giữ làm giới hạn phạm vi, viết "Mức ảnh hưởng tới V1: …" (GX-12).

## 2. Blocker cục bộ

### A-L01 · TRANG_THAI · Assumption Open chưa có ngưỡng nhưng không có status mức thấp hơn
- Item: A-007, A-008, A-009, A-010, A-011, A-012, A-013, A-014, A-015, A-016, A-017, A-018, A-019, A-020, A-021, A-022, A-029 (17 item)
- Tiêu chí: GX-09, GA-01, GA-04, GA-05; `schema.json` (`item_types.assumption.statuses`); `03-assumptions/_CRITERIA.md` mục 3
- Hiện trạng: 17 item ở status Open, ánh xạ mức sẵn sàng `active`. Câu Assumption hoặc Signpost dùng từ không có mốc ("rõ rệt", "phần lớn", "thường xuyên", "dùng được", "quá cao"), nên chưa phán được Supported hay Invalidated. Con số thay thế không có trong sheet (A-L05 … A-L11). `schema.json` chỉ khai báo Open, Supported, Invalidated (`active`) và Retired (`closed`); Assumption không có status nào ở mức `proposed` để hạ xuống như các loại khác.
- Điều chưa biết hoặc cần chọn: giữ Open và bổ sung đủ ngưỡng trước khi migrate, hay thêm một status mức `proposed` cho Assumption.
- Phương án:
  - A. Giữ Open; trả lời hết A-L05 … A-L11 trước PR migrate.
  - B. Thêm vào `schema.json` một status mức `proposed`, `effective: true` (ví dụ `Proposed`), và sửa bảng vòng đời ở `03-assumptions/_CRITERIA.md` mục 3. Migrate 17 item ở status đó; chuyển lên Open khi có ngưỡng và `Cách kiểm chứng`. GX-04 của các Requirement và Decision Active vẫn đạt vì status mới còn hiệu lực.
  - C. Giữ Open và ghi ngoại lệ tạm cho PR migrate: 17 item trượt GA-01, GA-04, GA-05 tới khi bổ sung.
- Đề xuất: B, vì ngưỡng của các item này phụ thuộc vào nghiên cứu người dùng hoặc benchmark chưa thiết kế (D-026 còn cố ý để mức tương thích PPTX tới sau implementation). A buộc phải điền khoảng 17 bộ con số ngay; C làm mức `active` mất nghĩa. B cũng xử lý được việc section `Cách kiểm chứng` (bắt buộc từ `active`, tầng CI) sẽ để trống ở mọi item theo quyết định 3. Thay đổi này đụng `schema.json` và `_CRITERIA.md`, nên cần người dùng duyệt.
- Quyết định:

### A-L02 · TACH_ITEM · A-007 gộp mô tả nhóm người dùng với lựa chọn phân khúc
- Item: A-007 (liên quan A-008, ACT-001; được R-001, R-006, R-011, R-021, R-029 dựa vào)
- Tiêu chí: GA-01, GA-02, GX-10
- Hiện trạng: "Người dùng cá nhân muốn tạo và sửa deck chủ yếu bằng AI, không có kỹ năng thiết kế chuyên sâu nhưng vẫn muốn kiểm soát kết quả, là nhóm người dùng DeckAgent nên phục vụ."
- Điều chưa biết hoặc cần chọn: câu có bốn vế đúng sai độc lập:
  1. muốn tạo và sửa deck chủ yếu bằng AI, trùng khẳng định của A-008 ("Người dùng muốn AI làm phần lớn việc tạo và sửa deck");
  2. không có kỹ năng thiết kế chuyên sâu;
  3. vẫn muốn kiểm soát kết quả;
  4. "là nhóm người dùng DeckAgent nên phục vụ": lựa chọn của team, không bác bỏ được.

  Vế 1–3 cũng là mô tả của ACT-001 (Goal 2, Goal 3, Needs / Pain Points 2). Cần chọn A-007 khẳng định điều gì.
- Phương án:
  - A. Giữ một item, đổi câu thành một khẳng định về nhu cầu của nhóm người dùng mô tả ở ACT-001 (dạng "Người dùng cá nhân có đặc điểm như ACT-001 có nhu cầu tạo và sửa deck bằng DeckAgent", ngưỡng theo A-L05). Đặc điểm nhóm do ACT-001 sở hữu; vế 1 do A-008 sở hữu; vế 4 bỏ vì là lựa chọn, đã thể hiện qua việc ACT-001 là Primary Actor. Không tạo ID mới.
  - B. Tách: A-007 giữ vế 2, item mới cho vế 3; vế 1 gộp vào A-008; vế 4 bỏ. Tạo một ID mới và phải chia lại 5 Requirement đang dựa vào A-007.
  - C. Giữ nguyên câu (vi phạm GA-01, GA-02).
- Đề xuất: A, vì không tạo ID, bỏ trùng với A-008 và ACT-001 (GX-10), và để lại một khẳng định kiểm được bằng cùng loại quan sát mà Signpost hiện có đã nêu ("Phỏng vấn người dùng, usability test hoặc feedback cho thấy nhu cầu thực tế khác…").
- Quyết định:

### A-L03 · TRUNG_SO_HUU · Mệnh đề quy định nằm trong Assumption
- Item: A-010, A-012, A-013, A-015, A-016, A-022 (và item sở hữu ở bảng dưới)
- Tiêu chí: GX-10, GA-01 ("không phải mong muốn")
- Hiện trạng:

  | Item | Vị trí | Mệnh đề | Item sở hữu đề xuất |
  |---|---|---|---|
  | A-010 | Ghi chú 2 | "không được kéo V1 sang xây editor web" | D-015 |
  | A-012 | Assumption | "nên DeckAgent cần đầu tư vào việc giữ nguyên phần ngoài phạm vi sửa" | R-022 |
  | A-013 | Assumption | "Ý định và ràng buộc của người dùng (…) cần được giữ qua nhiều lần sửa" | BR-003 (R-024 cùng nội dung) |
  | A-013 | Ghi chú 1 | "ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck" | BR-003 |
  | A-015 | Assumption | "nên DeckAgent phải phân biệt rõ nội dung lấy từ tài liệu và nội dung do AI bổ sung" | R-008 |
  | A-016 | Ghi chú 2 | "V1 không yêu cầu PPTX và PDF giống nhau từng pixel" | D-009 |
  | A-022 | Assumption | "nhờ đó V1 không cần xây editor chuyên nghiệp trong ứng dụng" | D-015 (R-041 cùng nội dung, đang chờ G-01) |

- Điều chưa biết hoặc cần chọn: Assumption chỉ khẳng định điều team coi là đúng; hệ quả "DeckAgent phải / không cần…" là nội dung của Requirement, Business Rule hoặc Decision đang dựa vào assumption đó. Cần xác nhận bỏ các mệnh đề này khỏi Assumption và xác nhận item sở hữu.
- Phương án:
  - A. Bỏ mệnh đề khỏi section `Assumption` và `Ghi chú`; quan hệ dựa vào đã nằm ở phía item sở hữu. Ghi chú chỉ giữ một câu tóm tắt kèm ID sở hữu khi câu đó giúp đọc (ví dụ "Phạm vi editor của V1 do D-015 quy định").
  - B. Giữ nguyên trong Ghi chú nhưng thêm ID sở hữu; chỉ bỏ khỏi section `Assumption`.
  - C. Giữ nguyên (vi phạm GX-10).
- Đề xuất: A, vì phần khẳng định còn lại của từng item vẫn đủ nghĩa và bác bỏ được, còn mệnh đề quy định đã có chủ ở bảng trên. Với A-022, nếu G-01 giữ R-041 thì người dùng chọn D-015 hay R-041 làm item sở hữu.
- Quyết định:

### A-L04 · SCHEMA · Review Trigger chứa tín hiệu không cho thấy assumption sai
- Item: A-007, A-008, A-010, A-011, A-012, A-014, A-015, A-016
- Tiêu chí: GA-04; bảng ánh xạ cột (Review Trigger → `Signpost`)
- Hiện trạng: Review Trigger của sheet là "khi nào xem lại", còn `Signpost` là "dấu hiệu sớm cho thấy assumption đang sai". Các vế sau không phải dấu hiệu sai:

  | Item | Vế trong Review Trigger | Loại tín hiệu | Đã có ở Reopen When |
  |---|---|---|---|
  | A-007 | "team chọn nhóm người dùng hẹp hơn" | Sự kiện quyết định | — |
  | A-008 | "cách làm AI-first không giảm được việc thủ công" | Hiệu quả của AI, không phải điều người dùng muốn | D-006 (gần) |
  | A-010 | "người dùng thường xuyên cần sửa trước khi tải về" | Xác nhận assumption, gợi ý kéo vào V1 | D-015 (gần) |
  | A-011 | "nhu cầu sửa deck có sẵn lớn"; "chi phí nhập và giữ bố cục quá cao so với giá trị" | Xác nhận; chi phí | D-013 (vế đầu) |
  | A-012 | "thay đổi ngoài ý muốn trở thành vấn đề lớn" | Xác nhận, gợi ý kéo P4 vào V1 | D-017 (gần) |
  | A-014 | "xử lý nhiều vai trò tạo độ phức tạp lớn" | Chi phí | — |
  | A-015 | "luồng tạo từ tài liệu ít được dùng" | Mức dùng của luồng, không phải điều người dùng coi trọng | — |
  | A-016 | "Yêu cầu đồ án… đòi hỏi độ giống hình ảnh cao hơn"; "một định dạng cần contract riêng" | Sự kiện bên ngoài; thiết kế | D-009 (vế đầu) |

- Điều chưa biết hoặc cần chọn: các vế này đi đâu. Đưa nguyên vào `Signpost` là đổi nghĩa section; bỏ thì mất thông tin.
- Phương án:
  - A. Chuyển sang `Ghi chú` dạng "Xem lại phạm vi khi …" (việc để sau, GX-12). `Signpost` chỉ giữ vế cho thấy assumption sai.
  - B. Bỏ khỏi Assumption; vế đã có trong Reopen When của Decision dựa vào thì giữ ở Decision, vế chưa có thì bổ sung vào Reopen When của Decision tương ứng (đụng file decisions).
  - C. Giữ nguyên trong `Signpost` (vi phạm nghĩa của GA-04).
- Đề xuất: A, vì không mất thông tin và không đụng loại item khác. Có thể làm B sau khi decisions đã migrate.
- Quyết định:

### A-L05 · SO_LIEU · Đại lượng và ngưỡng cho assumption về nhóm người dùng và cách tương tác chính
- Item: A-007, A-008, A-009
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-007 Signpost "nhu cầu thực tế khác rõ rệt". A-008 "AI làm phần lớn việc tạo và sửa deck"; Signpost "muốn tự kiểm soát trực tiếp nhiều hơn". A-009 "cách tương tác chính hợp với người dùng"; Signpost "khó mô tả ý định…, phải gõ lại nhiều lần, hoặc cách tương tác khác hiệu quả hơn".
- Điều chưa biết hoặc cần chọn: với từng item, đại lượng đo (ví dụ tỷ lệ người tham gia, tỷ lệ thao tác giao cho AI, số lần gõ lại một yêu cầu) và ngưỡng làm assumption sai.
- Phương án:
  - A. Người dùng cung cấp đại lượng và ngưỡng cho từng item ngay.
  - B. Chưa có số: giữ chữ gốc kèm `<!-- BLOCKER A-L05 -->`, xử lý status theo A-L01, bổ sung khi lập kế hoạch nghiên cứu người dùng.
- Đề xuất: B nếu A-L01 chọn B; A nếu A-L01 chọn A.
- Quyết định:

### A-L06 · SO_LIEU · Ranh giới chỉnh sửa trong và ngoài DeckAgent
- Item: A-010, A-020, A-021
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-010 "tự sửa trực tiếp các lỗi nhỏ"; Signpost "hiếm khi cần sửa trực tiếp… hoặc thường xuyên cần sửa". A-020 "chỉnh tay chuyên sâu trong PowerPoint hoặc công cụ chuyên dụng"; Signpost "cần chỉnh trong ứng dụng nhiều hơn dự kiến". A-021 "đưa deck vừa tạo tới mức dùng được"; Signpost "sửa từng slide hoặc thành phần quá thường xuyên", "làm mất kiểm soát".
- Điều chưa biết hoặc cần chọn:
  1. danh sách loại lỗi tính là "lỗi nhỏ" (A-010);
  2. "chỉnh tay chuyên sâu" và "công cụ chuyên dụng" gồm những gì (A-020);
  3. tiêu chí "deck dùng được" (A-021; cùng cụm ở R-029, D-014, D-025, ACT-001);
  4. tần suất hoặc tỷ lệ làm assumption sai cho cả ba item.
- Phương án:
  - A. Người dùng cung cấp danh sách và ngưỡng ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo A-L01. Tiêu chí "deck dùng được" lấy theo blocker cùng câu hỏi ở requirements hoặc decisions nếu có.
- Đề xuất: B, và gộp ý 3 với blocker "deck dùng được" của loại khác (mục 6).
- Quyết định:

### A-L07 · SO_LIEU · Ứng dụng đích và mức tương thích của file PPTX bàn giao
- Item: A-022, A-020 (vế Signpost "file PPTX bàn giao không dùng được")
- Tiêu chí: GA-01, GA-04, GX-08, GX-09
- Hiện trạng: A-022 "File PPTX tải về dùng được để bàn giao sang chỉnh tay"; Signpost "không mở ổn định, khó sửa, mất cấu trúc slide, hoặc người dùng phải làm lại nhiều"; Ghi chú "D-026 giữ PPTX là định dạng sửa được nhưng chưa chốt mức tương thích với từng ứng dụng trước implementation".
- Điều chưa biết hoặc cần chọn: ứng dụng đích nào (ví dụ PowerPoint, Google Slides, Keynote) và tiêu chí "mở ổn định", "khó sửa", "làm lại nhiều". D-026 mục 3 cố ý để mức tương thích tới sau implementation và Testing.
- Phương án:
  - A. Chốt danh sách ứng dụng đích và tiêu chí ngay.
  - B. Theo D-026: chờ implementation; A-022 xử lý status theo A-L01.
- Đề xuất: B, vì D-026 (Active) đã quyết định không chốt trước Architecture; chọn A là mở lại D-026.
- Quyết định:

### A-L08 · SO_LIEU · Đại lượng cho assumption về độ trung thực đầu ra và xem trước
- Item: A-015, A-016, A-017
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-015 "Người dùng quan tâm tới việc giữ đúng thông tin từ tài liệu"; Signpost "chấp nhận AI bổ sung tự do hơn dự kiến". A-016 "coi trọng việc các file tải về giống nhau về ý nghĩa hơn là giống nhau về pixel…"; Signpost "đòi hỏi độ giống hình ảnh cao hơn". A-017 "Xem trước đáng tin để người dùng quyết định deck đã dùng được"; Signpost "khác nhau rõ rệt".
- Điều chưa biết hoặc cần chọn: đại lượng và ngưỡng cho từng item (ví dụ tỷ lệ người dùng xếp hạng ưu tiên, tỷ lệ người dùng đổi quyết định sau khi mở file tải về).
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo A-L01.
- Đề xuất: B nếu A-L01 chọn B; A nếu A-L01 chọn A.
- Quyết định:

### A-L09 · SO_LIEU · Đại lượng cho assumption về nhu cầu đầu vào
- Item: A-011, A-014
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-011 "Nhập và sửa tiếp deck có sẵn là nhu cầu cốt lõi, không chỉ là capability phụ"; Signpost "nhu cầu… lớn", "chi phí… quá cao so với giá trị". A-014 "Người dùng nhận được giá trị khi cùng một loại file được dùng với nhiều vai trò"; Signpost "chỉ cần ít loại file hoặc vai trò", "độ phức tạp lớn mà ít giá trị".
- Điều chưa biết hoặc cần chọn: đại lượng phân biệt "cốt lõi" với "phụ" (A-011) và đo "giá trị" của nhiều vai trò (A-014), cùng ngưỡng.
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo A-L01. Cả hai item đang "để sau" ở V1.
- Đề xuất: B, vì cả hai item có mức ảnh hưởng V1 là "để sau".
- Quyết định:

### A-L10 · SO_LIEU · Đại lượng cho assumption về giữ nguyên và giữ trạng thái
- Item: A-012, A-013, A-029
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-012 "là vấn đề người dùng gặp thường xuyên"; Signpost "vấn đề lớn". A-013 "nếu bị quên, trải nghiệm giảm rõ rệt". A-029 Signpost "thường mất deck ngoài ý muốn hoặc thường cần quay lại deck qua nhiều lần làm việc".
- Điều chưa biết hoặc cần chọn: tần suất làm A-012 đúng; đại lượng "trải nghiệm" và mức giảm (A-013); tần suất "thường" (A-029).
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo A-L01.
- Đề xuất: B nếu A-L01 chọn B; A nếu A-L01 chọn A.
- Quyết định:

### A-L11 · SO_LIEU · Tiêu chí benchmark cho phân loại lượt xử lý AI
- Item: A-018, A-019
- Tiêu chí: GA-01, GA-04, GA-05, GX-08
- Hiện trạng: A-018 "Các lượt xử lý AI có độ khó khác nhau rõ ràng… mà không giảm chất lượng bắt buộc"; Review Trigger "Sau benchmark về thời gian, chi phí, khả năng model và chất lượng; bị bác bỏ nếu khó phân loại độ khó hoặc chi phí phân loại lớn hơn lợi ích". A-019 "phân biệt được rõ"; Signpost "ranh giới giữa các nhóm quá mơ hồ".
- Điều chưa biết hoặc cần chọn: "khác nhau rõ ràng" và "phân biệt được rõ" đo bằng gì (ví dụ mức đồng thuận khi nhiều người gán nhãn); "chất lượng bắt buộc" theo tiêu chí nào; "khó phân loại" và "lớn hơn lợi ích" theo ngưỡng nào.
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chờ benchmark: giữ chữ gốc kèm marker, xử lý status theo A-L01.
- Đề xuất: B, vì chính sheet ghi assumption được kết luận "sau benchmark", và cả hai item có mức ảnh hưởng V1 là "để sau".
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
| A-007 | Cách kiểm chứng | gợi ý: phỏng vấn người dùng có đặc điểm như ACT-001; mẫu số = số người phỏng vấn; ngưỡng theo A-L05 |
| A-007 | Nếu sai | gợi ý: mở lại mô tả ACT-001 và D-012 |
| A-008 | Cách kiểm chứng | gợi ý: usability test luồng tạo và sửa deck; mẫu số = tổng thao tác tạo và sửa; tử số = thao tác người dùng giao cho AI; ngưỡng theo A-L05 |
| A-008 | Nếu sai | — (chuyển từ Ghi chú 2: "Mở lại mục tiêu và ranh giới V1") |
| A-009 | Cách kiểm chứng | gợi ý: usability test; mẫu số = số yêu cầu người dùng gõ; tử số = số yêu cầu phải gõ lại; ngưỡng theo A-L05 |
| A-009 | Nếu sai | gợi ý: mở lại D-014 để xét cách tương tác khác ngoài chat |
| A-010 | Cách kiểm chứng | gợi ý: user test; mẫu số = số lỗi nhỏ (danh sách theo A-L06) người dùng gặp; tử số = số lỗi người dùng chọn tự sửa trực tiếp |
| A-010 | Nếu sai | gợi ý: bỏ R-015 khỏi hướng sản phẩm |
| A-011 | Cách kiểm chứng | gợi ý: phỏng vấn hoặc dữ liệu sử dụng; tỷ lệ người dùng có nhu cầu sửa tiếp deck có sẵn; ngưỡng theo A-L09 |
| A-011 | Nếu sai | gợi ý: giữ D-013, bỏ hướng sửa tiếp deck có sẵn khỏi lộ trình |
| A-012 | Cách kiểm chứng | gợi ý: thí nghiệm sửa deck; mẫu số = số lần sửa; tử số = số lần sửa làm đổi phần ngoài phạm vi sửa mà người dùng coi là lỗi |
| A-012 | Nếu sai | gợi ý: hạ ưu tiên R-022, R-034 |
| A-013 | Cách kiểm chứng | gợi ý: so sánh hai bản sửa có giữ và không giữ ràng buộc của người dùng; đại lượng theo A-L10 |
| A-013 | Nếu sai | — (chuyển từ Review Trigger: "Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng") |
| A-014 | Cách kiểm chứng | gợi ý: tỷ lệ người dùng dùng cùng một loại file với hơn một vai trò; ngưỡng theo A-L09 |
| A-014 | Nếu sai | gợi ý: mở lại D-007 |
| A-015 | Cách kiểm chứng | Một phần chuyển từ Ghi chú 3: "Evidence đến từ test hoặc nghiên cứu người dùng thực tế". Còn thiếu mẫu số, cỡ mẫu, ngưỡng (A-L08) |
| A-015 | Nếu sai | gợi ý: mở lại D-017 về việc P1 Source Fidelity là điều kiện nghiệm thu bắt buộc |
| A-016 | Cách kiểm chứng | gợi ý: cho người dùng xếp hạng ưu tiên giữa giống nhau về ý nghĩa và giống nhau về hình ảnh; ngưỡng theo A-L08 |
| A-016 | Nếu sai | gợi ý: mở lại D-009 |
| A-017 | Cách kiểm chứng | gợi ý: usability test; mẫu số = số lần người dùng tải về sau khi xem trước; tử số = số lần người dùng đổi quyết định sau khi mở file tải về |
| A-017 | Nếu sai | — (chuyển từ Ghi chú 2: "Thay đổi luồng Xem trước → Giữ → Tải về") |
| A-018 | Cách kiểm chứng | Một phần chuyển từ Review Trigger: "Benchmark về thời gian, chi phí, khả năng model và chất lượng". Còn thiếu tập lượt xử lý, cỡ mẫu, ngưỡng (A-L11) |
| A-018 | Nếu sai | gợi ý: bỏ R-035 khỏi hướng đóng góp |
| A-019 | Cách kiểm chứng | gợi ý: nhiều người gán nhãn độc lập cùng một tập lượt xử lý vào 6 loại; đo mức đồng thuận; ngưỡng theo A-L11 |
| A-019 | Nếu sai | gợi ý: không dùng cách phân loại 6 loại cho Testing và R-035 |
| A-020 | Cách kiểm chứng | gợi ý: user test sau tải về; tỷ lệ người dùng hoàn tất chỉnh tay trong PowerPoint mà không quay lại DeckAgent; ngưỡng theo A-L06 |
| A-020 | Nếu sai | gợi ý: mở lại D-006, D-015 |
| A-021 | Cách kiểm chứng | gợi ý: tỷ lệ phiên đạt deck dùng được (tiêu chí theo A-L06) chỉ bằng sửa cả deck |
| A-021 | Nếu sai | gợi ý: mở lại D-014, D-025 để xét đưa sửa cục bộ vào V1 |
| A-022 | Cách kiểm chứng | Một phần chuyển từ Ghi chú 2: "Mức tương thích được học từ file thật". Còn thiếu ứng dụng đích, cỡ mẫu, ngưỡng (A-L07) |
| A-022 | Nếu sai | gợi ý: mở lại D-015, D-026 |
| A-023 | Cách kiểm chứng | gợi ý: chạy bộ test tải về của V1 trên PPTX và PDF; Supported khi mọi hành vi tải về của các Requirement dựa vào A-023 kiểm chứng được; Invalidated khi có ít nhất một hành vi không kiểm chứng được |
| A-023 | Nếu sai | gợi ý: mở lại D-026 để thêm định dạng tải về |
| A-029 | Cách kiểm chứng | gợi ý: user test; mẫu số = số người tham gia; tử số = số người mất deck ngoài ý muốn hoặc cần quay lại deck ở lần làm việc sau; ngưỡng theo A-L10 |
| A-029 | Nếu sai | — (chuyển từ Ghi chú 2: "Kích hoạt R-048 (lưu và mở lại deck qua nhiều lần làm việc)") |

## 4. Dịch thử

Không có item product nào thuộc nhóm `CẤU-TRÚC` (mục 6, ý 1). A-023 là item ít thay đổi nhất, nên dùng làm bản dịch đơn giản.

### A-023 (đơn giản)
#### Bản gốc
- ID: A-023
- Status: Open
- Assumption: "Hai định dạng, một sửa được và một chỉ xem, cho phép V1 chứng minh việc tải về từ đầu tới cuối và P5 Output Fidelity, dù tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng hơn."
- Impacts: "Phạm vi, tải về, Testing, Architecture"
- Review Trigger: "Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng ngay trong V1, hoặc PPTX và PDF không kiểm chứng được hành vi tải về cần có."
- Ghi chú: "1. D-026 đã chốt V1 đầu tiên dùng PPTX (sửa được) và PDF (chỉ xem); hỗ trợ thêm định dạng là hướng mở rộng."
- Căn cứ: "D-026"
- Used By (IDs): "R-020, R-025, R-026, R-027, R-028, D-016, D-026"
- Related Work (IDs): "W-001, W-003, W-026"

#### Bản dịch
```markdown
---
id: A-023
short_name: Hai định dạng tải về của V1
status: Open
source: [D-026]
---

## Assumption

Hai định dạng tải về PPTX (sửa được) và PDF (chỉ xem) cho phép V1 chứng minh việc tải về từ đầu tới cuối và P5 Output Fidelity.

## Signpost

1. Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng tải về trong V1.
2. Có hành vi tải về mà V1 cần có nhưng không kiểm chứng được bằng PPTX và PDF.

## Cách kiểm chứng

<!-- FILL_LATER -->

## Nếu sai

<!-- FILL_LATER -->

## Ghi chú

1. Tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng tải về hơn; V1 đầu tiên chỉ dùng PPTX và PDF theo D-026.
```

Quan hệ không ghi trong file A-023 (GX-05): R-020, R-025, R-026, R-027, R-028, D-016, D-026 mang `assumptions: [A-023]` ở file của mình.

#### Thay đổi
1. `short_name` đặt mới từ câu Assumption (GA-08).
2. "Hai định dạng, một sửa được và một chỉ xem" → nêu tên PPTX và PDF; tên lấy từ Review Trigger và Ghi chú của chính item, không thêm thông tin (GX-08, GX-17).
3. Vế "dù tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng hơn" chuyển từ `Assumption` sang `Ghi chú`, vì là giới hạn phạm vi, không phải điều được khẳng định (GA-01, GX-12).
4. Review Trigger → `Signpost`, tách thành danh sách 2 sự kiện (GA-04, GX-14); bỏ "ngay" (GX-08).
5. Ghi chú: câu phát biểu lại D-026 viết thành tóm tắt kèm ID sở hữu, gộp với vế ở thay đổi 3 (GX-10, GX-12).
6. `Căn cứ` → `source: [D-026]` (GX-11).
7. Impacts và Related Work (IDs) bỏ; Used By (IDs) lật sang `assumptions` của 7 item dựa vào (GX-05).
8. `Cách kiểm chứng`, `Nếu sai`: section mới, để `FILL_LATER` (quyết định 3; gợi ý ở mục 3).
9. Giữ một item dù câu nêu hai điều được chứng minh (tải về từ đầu tới cuối, P5 Output Fidelity), vì cả hai được kiểm bằng cùng bộ test tải về V1 trên PPTX và PDF (GA-02; mục 6, ý 7).

### A-013 (nhiều chỗ viết lại)
#### Bản gốc
- ID: A-013
- Status: Open
- Assumption: "Ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) cần được giữ qua nhiều lần sửa; nếu bị quên, trải nghiệm giảm rõ rệt."
- Impacts: "Mô hình trạng thái, quản lý context, hành vi khi sửa deck, Testing"
- Review Trigger: "Testing cho thấy không phải ràng buộc nào cũng cần giữ, hoặc giữ tất cả gây xung đột; khi đó cần xác định thời hạn theo từng loại ràng buộc."
- Ghi chú: "1. D-025 xác nhận ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck. 2. Câu hỏi OQ-04 về thời hạn và cách xử lý xung đột vẫn cố ý để mở vì chưa chặn Architecture."
- Căn cứ: "D-025"
- Used By (IDs): "R-001, R-009, R-024, D-017, D-025"
- Related Work (IDs): "W-001, W-003, W-026"

#### Bản dịch
```markdown
---
id: A-013
short_name: Quên ý định và ràng buộc làm giảm trải nghiệm
status: Open   # BLOCKER A-L01
source: [D-025]
---

## Assumption

Nếu DeckAgent không giữ ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) qua các lần sửa, trải nghiệm của người dùng giảm <!-- BLOCKER A-L10: đại lượng và mức giảm thay cho "rõ rệt" -->.

<!-- BLOCKER A-L03: vế gốc "cần được giữ qua nhiều lần sửa" là quy định của BR-003; chờ quyết định bỏ hay giữ -->

## Signpost

1. Kết quả test cho thấy có loại ràng buộc của người dùng không cần giữ qua các lần sửa.
2. Kết quả test cho thấy giữ mọi ràng buộc của người dùng qua các lần sửa gây xung đột giữa các ràng buộc.

## Cách kiểm chứng

<!-- FILL_LATER -->

## Nếu sai

1. Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng.

## Ghi chú

1. <!-- BLOCKER A-L03: Ghi chú gốc 1 "D-025 xác nhận ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck" phát biểu lại quy định của BR-003 -->
2. Thời hạn áp dụng và cách xử lý xung đột giữa các ràng buộc của người dùng cố ý để mở ở câu hỏi OQ-04, vì câu hỏi này chưa chặn Architecture.
```

Quan hệ không ghi trong file A-013 (GX-05): R-001, R-009, R-024, D-017, D-025 (lật từ Used By) và D-030 (đã có ở Assumption chính của D-030) mang `assumptions: [A-013]`.

#### Thay đổi
1. `short_name` đặt mới từ câu Assumption (GA-08).
2. Câu Assumption viết thành một giả thuyết "nếu… thì" kiểm bằng một phép quan sát (GA-01, GA-02). Vế "nếu bị quên" ở thể bị động đổi sang chủ ngữ DeckAgent, thể chủ động (GX-16). "nhiều lần sửa" → "các lần sửa".
3. "trải nghiệm giảm rõ rệt": "rõ rệt" chưa có đại lượng → marker A-L10 (GA-01, GX-08). Không tự đặt con số.
4. Vế "cần được giữ qua nhiều lần sửa" là quy định do BR-003 sở hữu (R-024 cùng nội dung) → marker A-L03, không tự bỏ (GX-10).
5. Review Trigger → `Signpost`, tách thành 2 tín hiệu (GA-04, GX-14). "Testing cho thấy" → "Kết quả test cho thấy"; "không phải ràng buộc nào cũng cần giữ" → "có loại ràng buộc… không cần giữ" (cùng nghĩa). "tất cả" → "mọi": Lint GX-08 sẽ cảnh báo, nhưng tín hiệu đúng là "giữ toàn bộ", nên giữ có chủ ý.
6. Vế "khi đó cần xác định thời hạn theo từng loại ràng buộc" là việc team sẽ làm khi assumption sai → chuyển từ Review Trigger sang `Nếu sai` (GA-06; áp tương tự quyết định 5).
7. Ghi chú 1 phát biểu lại quy định của BR-003 → marker A-L03 (GX-10, GX-12).
8. Ghi chú 2 giữ ý; viết đầy đủ "ràng buộc của người dùng" (GX-07). OQ-04 giữ làm text (không thuộc tiền tố loại cũ; mục 6).
9. `Căn cứ` → `source: [D-025]` (GX-11).
10. Impacts và Related Work (IDs) bỏ; Used By (IDs) lật sang `assumptions` của 5 item (GX-05).
11. `status: Open` giữ, kèm marker A-L01 (GX-09).
12. `Cách kiểm chứng`: section mới, để `FILL_LATER` (quyết định 3).

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| A-004.Ghi chú | W-026 | Bỏ: A-004 bị xóa (`project`); nội dung là ghi chú quy trình ("Retired sau W-026") |
| A-004.Ghi chú | W-034 | Bỏ: cùng lý do; "Architecture baseline sẽ được chọn… qua W-034" là kế hoạch công việc |
| A-004.Ghi chú | W-035 | Bỏ: cùng lý do |

Ngoài ba tham chiếu trên, không item product nào của loại này có tham chiếu `W-`, `L-`, `RK-`, `B-`, `SP-` trong text hay `source`. Cột Related Work (IDs) (15 item có giá trị W-xxx) bị bỏ theo bảng ánh xạ, không tính là tham chiếu trong text.

## 6. Ghi chú cho agent chính

1. **Không có item `CẤU-TRÚC`.** Mọi item product có Review Trigger hoặc câu Assumption dùng từ không có mốc, và section `Cách kiểm chứng` là section mới. A-023 được chọn làm bản dịch đơn giản vì chỉ cần viết lại, không có blocker.
2. **A-L01 đụng schema và CI.** `schema.json` khai báo `required_sections: Cách kiểm chứng from active`, tầng CI (GA-05). Theo quyết định 3, section này để trống ở cả 18 item product, mà PR migrate sửa mọi file, nên CI nội dung sẽ trượt ở cả 18 item nếu chúng giữ Open. Phương án B của A-L01 (status mức `proposed`) xử lý được việc này. Nếu chọn A hoặc C, agent chính cần quyết riêng cách xử lý CI cho PR migrate.
3. **Loại của A-L04.** Không loại blocker nào khớp đúng: vấn đề là ánh xạ cột Review Trigger → `Signpost` không giữ được nghĩa. Tạm gắn `SCHEMA`; agent chính có thể đổi loại.
4. **Review Trigger gần trùng Reopen When của Decision**: A-016/D-009, A-021/D-014 và D-025, A-022/D-015, A-023/D-026, A-011/D-013, A-012/D-017, A-020/D-006 và D-015. Gợi ý xem cùng đánh giá decisions khi quyết A-L04 (phương án B).
5. **"deck dùng được" chưa có định nghĩa** ở A-017, A-021 và ở R-029, D-014, D-025, ACT-001. Ý 3 của A-L06 nên gộp với blocker cùng câu hỏi ở requirements hoặc decisions, hoặc thành một mục glossary.
6. **A-L07 trùng câu hỏi** với D-026 mục 3 và R-027 ("môi trường đích"; Ghi chú "Mức tương thích với từng ứng dụng được học từ file thật sau implementation"). Gợi ý gộp với blocker tương ứng của requirements/decisions.
7. **GA-02, các trường hợp ranh giới không tách** (giả định tự đặt):
   1. A-010: vế "chỉ gõ yêu cầu cho AI có thể bất tiện" là lý do của cùng giả thuyết.
   2. A-018: sheet ghi assumption được kết luận bằng một benchmark và "bị bác bỏ nếu" một trong hai điều kiện sai. Đây là ứng viên tách đầu tiên nếu áp GA-02 chặt hơn: "độ khó khác nhau rõ ràng" và "dùng mức tính toán khác mà không giảm chất lượng" có thể đúng sai độc lập.
   3. A-023: hai điều được chứng minh bằng cùng bộ test tải về.
   4. A-029: vế "vì tải về PPTX giúp họ giữ…" là cơ chế của cùng giả thuyết.
8. **GA-03.** Mọi item product hiện có ≥1 Requirement hoặc Decision trỏ tới. A-018 chỉ có R-035, R-036, R-037 (Proposed, Later), cả ba nằm trong phạm vi G-04; nếu kết quả G-04 bỏ các Requirement này, A-018 mất load-bearing và phải xóa. Nếu G-01 xóa R-041, A-008, A-020, A-022 mất một item dựa vào nhưng vẫn còn item khác.
9. **Ngữ nghĩa quan hệ `assumptions`** ("Requirement chỉ cần thiết khi assumption đúng", lý do của G-07) chưa được kiểm cho từng cặp product, ví dụ R-001 → A-013, R-021 → A-007, R-033 → A-015. Gợi ý subagent requirements kiểm khi lật quan hệ.
10. **Tên không thuộc loại cũ, giữ làm text:** P1 Source Fidelity, P4 Safe Refinement, P5 Output Fidelity (nguyên tắc chất lượng của DOC-001/DOC-002, D-017 liệt kê), OQ-04 (A-013), "Option B (AD6)" (A-018, bỏ khỏi Ghi chú vì là nguồn; `source` vẫn giữ "DOC-001 AD6"). Từ cấm "source" nằm trong tên riêng "P1 Source Fidelity" đã được GL-L05 xử lý.
11. **ACT-001 phát biểu như sự thật điều assumption đang giả định:** Knowledge / Context 4 ("Tương tác chính bằng cách gõ yêu cầu trong chat") ứng với A-009; Constraints 2 ("chỉnh sâu làm bằng công cụ chuyên dụng sau khi tải về") ứng với A-020; Goal 2, Goal 3 ứng với A-007, A-008. Gợi ý gộp với ACT-L02 hoặc để actors tóm tắt kèm ID assumption.
12. **Giả định tự đặt cho Signpost:** Signpost của A-009, A-013, A-017, A-020, A-021, A-022, A-023, A-029 được coi là đúng chiều (dấu hiệu assumption sai), chỉ thiếu ngưỡng. Riêng A-013 và A-023 được coi là đã nêu sự kiện cụ thể.
13. **ID trống** A-024 … A-028 (inventory) không được dùng lại cho item tách mới nếu A-L02 chọn B (GX-01).
14. Mâu thuẫn hai đầu D-030 ↔ A-013 đã được xử lý ở `global-blockers.md` (giữ `D-030.assumptions` có A-013); không tạo blocker.
