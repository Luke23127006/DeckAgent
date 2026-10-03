# Blocker của Pha A

Ô **Quyết định** của từng blocker đã điền ở Pha B (bước B2) từ `DECISIONS.md`. Chỗ ghi `CẦN XEM` chờ người dùng trả lời (`trash/phase-b-can-xem.md`).
Mỗi blocker là một câu hỏi; item bị ảnh hưởng liệt kê ở dòng Item. Dòng "ID tạm" cho biết blocker đến từ đâu (`G-` liên loại từ A1–A3, `M-` gộp từ nhiều loại, `<loại>-L` từ `work/assess-<loại>.md`).

## Tóm tắt: 69 blocker

| Loại blocker | Số blocker |
|---|---|
| SO_LIEU | 17 |
| TACH_ITEM | 2 |
| DOI_LOAI | 1 |
| MAU_THUAN_QH | 4 |
| PHU_THUOC_DONG | 4 |
| PHU_THUOC_XOA | 1 |
| XOA_ITEM | 3 |
| TRUNG_SO_HUU | 10 |
| TRANG_THAI | 19 |
| THAM_CHIEU_LOAI_CU | 2 |
| SCHEMA | 6 |

| BLK | Loại | Tiêu đề | Số item (đếm ID ở dòng Item, ước tính) |
|---|---|---|---|
| BLK-001 | SO_LIEU | Ngưỡng quá thời gian và trạng thái kết thúc của lượt xử lý AI | 8 |
| BLK-002 | SO_LIEU | "Giới hạn của định dạng" khi tải về chưa được định nghĩa | 7 |
| BLK-003 | SO_LIEU | Ranh giới "hệ thống con quá lớn" của C-002 | 1 |
| BLK-004 | SO_LIEU | Đồ án bắt buộc bao nhiêu định dạng tải về (C-003) | 3 |
| BLK-005 | SO_LIEU | Đại lượng và ngưỡng cho assumption về nhóm người dùng và cách tương tác chính | 3 |
| BLK-006 | SO_LIEU | Ranh giới chỉnh sửa trong và ngoài DeckAgent | 3 |
| BLK-007 | SO_LIEU | Đại lượng cho assumption về độ trung thực đầu ra và xem trước | 3 |
| BLK-008 | SO_LIEU | Đại lượng cho assumption về nhu cầu đầu vào | 2 |
| BLK-009 | SO_LIEU | Đại lượng cho assumption về giữ nguyên và giữ trạng thái | 3 |
| BLK-010 | SO_LIEU | Tiêu chí benchmark cho phân loại lượt xử lý AI | 2 |
| BLK-011 | SO_LIEU | Giới hạn kích thước và số trang của file tải lên | 2 |
| BLK-012 | SO_LIEU | Câu thoát "trừ khi việc đó cần thiết" ở BR-004 | 1 |
| BLK-013 | SO_LIEU | Câu thoát "trong giới hạn lưu trữ" ở BR-016 | 1 |
| BLK-014 | SO_LIEU | Câu thoát "đã công bố / hệ thống hỗ trợ" ở các requirement Later | 11 |
| BLK-015 | SO_LIEU | Thông tin nào thiếu thì DeckAgent phải hỏi lại | 1 |
| BLK-016 | SO_LIEU | Số slide tối thiểu của một deck hoàn chỉnh | 1 |
| BLK-017 | SO_LIEU | Reopen When dùng điều kiện không quan sát được | 6 |
| BLK-018 | TACH_ITEM | A-007 gộp mô tả nhóm người dùng với lựa chọn phân khúc | 8 |
| BLK-019 | TACH_ITEM | Requirement gộp nhiều hành vi | 5 |
| BLK-020 | DOI_LOAI | R-041 có type Constraint | 5 |
| BLK-021 | MAU_THUAN_QH | Permissions lệch với bước Use Case | 3 |
| BLK-022 | MAU_THUAN_QH | UC-007 có bước AI nhưng không có ACT-002 | 2 |
| BLK-023 | MAU_THUAN_QH | R-025, R-028 vẫn nói "bản đã chấp nhận" sau khi R-020 đổi sang tải về từ bản đang xem trước | 4 |
| BLK-024 | MAU_THUAN_QH | R-026 Acceptance 2 yếu hơn Yêu cầu và BR-013 | 2 |
| BLK-025 | PHU_THUOC_DONG | Item Active dựa vào C-001 đã Retired | 7 |
| BLK-026 | PHU_THUOC_DONG | Item Active dựa vào C-005 đã Retired | 6 |
| BLK-027 | PHU_THUOC_DONG | R-041 dựa vào A-004 (Retired, project) và UC-005 (Deprecated) | 3 |
| BLK-028 | PHU_THUOC_DONG | R-042 dựa vào UC-018 đang Draft | 2 |
| BLK-029 | PHU_THUOC_XOA | 9 Requirement dựa vào A-005 (giả định về chiến lược Testing) | 10 |
| BLK-030 | XOA_ITEM | Quy tắc "chưa chốt cơ chế và ngưỡng khi chưa có evidence" (C-006, C-007, D-011) | 10 |
| BLK-031 | XOA_ITEM | D-010 phân loại khái niệm trong spec | 4 |
| BLK-032 | XOA_ITEM | D-028 khi nào tiêu chí chất lượng thành Hard Gate | 5 |
| BLK-033 | TRUNG_SO_HUU | Business Rule và Requirement phát biểu cùng một quy định | 32 |
| BLK-034 | TRUNG_SO_HUU | Business Rule lặp lại câu Decision (gồm D-030 ↔ BR-010) | 14 |
| BLK-035 | TRUNG_SO_HUU | Item sở hữu vòng đời bản deck (ranh giới commit, khôi phục, dừng, lỗi) | 9 |
| BLK-036 | TRUNG_SO_HUU | Constraints của ACT-001 phát biểu lại phạm vi sản phẩm | 5 |
| BLK-037 | TRUNG_SO_HUU | "Kết quả của AI không tự động thành bản đã chấp nhận" mâu thuẫn BR-010 | 3 |
| BLK-038 | TRUNG_SO_HUU | Constraint chép lại nội dung quy định của D-026 và R-025 | 4 |
| BLK-039 | TRUNG_SO_HUU | Mệnh đề quy định nằm trong Assumption | 6 |
| BLK-040 | TRUNG_SO_HUU | Requirement trùng requirement khác | 8 |
| BLK-041 | TRUNG_SO_HUU | Requirement trùng Decision | 16 |
| BLK-042 | TRUNG_SO_HUU | Từ cấm "session" thuộc hai thuật ngữ | 2 |
| BLK-043 | TRANG_THAI | Loại, thời hạn và xung đột của ràng buộc của người dùng | 5 |
| BLK-044 | TRANG_THAI | Ứng dụng đích dùng để kiểm chứng file PPTX | 5 |
| BLK-045 | TRANG_THAI | Hỏi lại hay đánh dấu nội dung do AI bổ sung | 3 |
| BLK-046 | TRANG_THAI | Assumption Open chưa có ngưỡng nhưng không có status mức thấp hơn | 17 |
| BLK-047 | TRANG_THAI | Nhánh cho Hành vi lỗi của ACT-002 | 11 |
| BLK-048 | TRANG_THAI | Lượt tạo file tải về có dừng được không | 2 |
| BLK-049 | TRANG_THAI | PDF không có text layer rơi vào nhánh nào | 2 |
| BLK-050 | TRANG_THAI | UC-004 kết thúc thành công ở đâu | 3 |
| BLK-051 | TRANG_THAI | Trigger của UC-008 đứng sau bước 1 | 3 |
| BLK-052 | TRANG_THAI | Nhánh 1B của UC-011 không có điểm kết thúc | 3 |
| BLK-053 | TRANG_THAI | Người dùng hủy khi hệ thống hỏi lại | 3 |
| BLK-054 | TRANG_THAI | Bảng chuyển trạng thái của BR-010 còn ô không suy ra được | 6 |
| BLK-055 | TRANG_THAI | Exceptions của BR-001 có hai cách hiểu | 1 |
| BLK-056 | TRANG_THAI | Mức cam kết của BR-012 mục 1 | 1 |
| BLK-057 | TRANG_THAI | Requirement Active dùng "nên" hoặc "có thể" | 2 |
| BLK-058 | TRANG_THAI | Tiêu chí chất lượng của deck và của kết quả AI đang chờ nghiên cứu (W-032) | 4 |
| BLK-059 | TRANG_THAI | Kiểm tra kết quả AI chưa định nghĩa | 1 |
| BLK-060 | TRANG_THAI | Luồng nào được phép đưa nội dung người dùng ra ngoài | 1 |
| BLK-061 | TRANG_THAI | R-010 ở Proposed nhưng ghi "còn ở mức thăm dò" | 1 |
| BLK-062 | THAM_CHIEU_LOAI_CU | Mã L-xxx, W-xxx trong `source` | 8 |
| BLK-063 | THAM_CHIEU_LOAI_CU | Mã task W-xxx đang làm nơi xử lý cho điều chưa chốt | 3 |
| BLK-064 | SCHEMA | Area ngoài enum | 8 |
| BLK-065 | SCHEMA | Review Trigger chứa tín hiệu không cho thấy assumption sai | 8 |
| BLK-066 | SCHEMA | Từ cấm có điều kiện trong ngoặc ở cột Không dùng | 8 |
| BLK-067 | SCHEMA | Điều kiện ở cuối danh sách áp cho từ nào | 3 |
| BLK-068 | SCHEMA | "Hệ thống" và "DeckAgent" là hai tên của một khái niệm | 1 |
| BLK-069 | SCHEMA | Từ cấm nằm trong tên riêng hoặc tên tính năng của sản phẩm khác | 13 |

### BLK-001 · SO_LIEU · Ngưỡng quá thời gian và trạng thái kết thúc của lượt xử lý AI
- ID tạm: M-01
- Gộp từ: BLK-001, BLK-001, BLK-001
- Item: R-030, R-032 (Active); R-037 (Proposed); ACT-002; UC-001 (4B), UC-002 (5C), UC-004 (3B), UC-014 (2B, Câu hỏi mở 2)
- Tiêu chí: GX-09, GX-08, GR-09, GUC-11, GUC-18, GACT-05
- Hiện trạng:
  - R-032 Ghi chú: "Ngưỡng quá thời gian và số lần thử lại chưa được chốt (D-011)." Acceptance: "trạng thái lượt xử lý xác định", không có danh sách trạng thái.
  - R-030: "lượt xử lý kéo dài", "Lỗi thường gặp có thông báo…". R-037 Ghi chú: "Giá trị giới hạn chỉ đặt sau benchmark (D-011)."
  - UC-014 Câu hỏi mở 2: "Ngưỡng quá thời gian là bao nhiêu? (đặt sau benchmark, D-011)". Các nhánh UC ghi "AI lỗi hoặc quá thời gian".
  - ACT-002 Needs 1 "nhà cung cấp chậm, lỗi, …"; Constraints 1 "Có thể lỗi hoặc quá thời gian (R-032)".
- Điều chưa biết hoặc cần chọn:
  1. Con số: thời gian tối đa của một lượt xử lý, số lần thử lại, mốc "kéo dài", danh sách "lỗi thường gặp", danh sách trạng thái kết thúc, giới hạn tài nguyên của R-037.
  2. Nơi sở hữu con số (đề xuất: R-032; Use Case và Actor chỉ tham chiếu).
  3. "Chậm" ở ACT-002 là một cách hỏng riêng hay chính là "quá thời gian".
  4. Trong lúc chưa có con số, item nào phải hạ status.
- Phương án:
  - A. R-032 sở hữu ngưỡng; "chậm" gộp vào "quá thời gian". R-030, R-032 hạ Proposed với "Chưa chốt (benchmark)"; R-037 ghi tương tự. Use Case (UC-001, 002, 004, 014) giữ Active, nhánh ghi "ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032"; câu hỏi mở 2 của UC-014 chuyển về R-032. `Hành vi lỗi` của ACT-002 tham chiếu R-032.
  - B. Như A, nhưng người dùng cung cấp ngay các con số và danh sách để R-030, R-032 giữ Active.
  - C. Như A, nhưng tách "chậm" (ngưỡng cảnh báo) và "quá thời gian" (ngưỡng dừng) thành hai cách hỏng, cả hai ngưỡng do R-032 sở hữu.
  - D. Hạ cả UC-014 và các Use Case gọi nó xuống Proposed tới khi có benchmark.
- Đề xuất: A, vì sheet ghi rõ ngưỡng chỉ đặt sau benchmark, GR-09 không cho đặt số khi chưa có dữ liệu, và một ngưỡng dùng chung cho 4 Use Case cần một nơi sở hữu (GX-10). Nơi xử lý của "Chưa chốt" phụ thuộc BLK-030 (D-011). Nếu chọn A thì R-046 (Active) dựa vào R-030 (Proposed): không vi phạm GX-04 vì Proposed còn hiệu lực.
- Quyết định: R-032 sở hữu mọi con số của lượt xử lý AI; "chậm" gộp vào "quá thời gian". Ngưỡng quá thời gian, đã tính thời gian thử lại: lượt tạo deck 180 giây [tạm 2026-10-03 · xem lại: theo CX-2], lượt sửa deck 120 giây [tạm 2026-10-03 · xem lại: theo CX-2]. Thử lại tự động tối đa 1 lần, chỉ khi nhà cung cấp AI trả lỗi tạm thời (hết thời gian kết nối, lỗi máy chủ, vượt giới hạn tần suất); không thử lại khi kết quả không qua R-033. Trạng thái kết thúc: Hoàn tất, Đã dừng, Lỗi (đã có ở UC-014). R-030 hiển thị tên bước đang chạy khi lượt chạy quá 2 giây [tạm 2026-10-03 · xem lại: theo CX-2]. "Lỗi thường gặp" (thuộc R-057 sau khi tách theo BLK-019), mỗi lỗi có thông báo kèm bước làm tiếp theo: quá thời gian; không kết nối được nhà cung cấp AI; kết quả không qua kiểm tra; không đọc được tài liệu. R-030, R-032 giữ Active. UC-001, UC-002, UC-004, UC-014 và ACT-002 chỉ tham chiếu R-032; Câu hỏi mở 2 của UC-014 bỏ vì đã có ngưỡng. R-037 giữ "Chưa chốt" ở Proposed theo P2. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1a của DECISIONS.md)

### BLK-002 · SO_LIEU · "Giới hạn của định dạng" khi tải về chưa được định nghĩa
- ID tạm: M-06
- Gộp từ: BLK-002, BLK-002
- Item: BR-006, R-025, R-026, R-028; liên quan BR-007, BR-013, D-026
- Tiêu chí: GR-11, GBR-06, GX-08, GX-09
- Hiện trạng:
  - BR-006 Exceptions: "Định dạng đích được làm mất phần nó không thể hiện được, nếu phần đó nằm trong giới hạn đã biết của định dạng (BR-013)." BR-013 không liệt kê giới hạn nào.
  - R-025 Acceptance: "…trong giới hạn của từng định dạng." R-028: "…trong giới hạn của định dạng"; Acceptance "…trong phạm vi đã kiểm chứng."
  - R-026: "xử lý theo cách dự đoán được"; "Mỗi trường hợp mất hoặc đổi đã biết có cách xử lý xác định."
  - D-026 mục 3: mức tương thích "được học từ implementation và Testing".
- Điều chưa biết hoặc cần chọn: giới hạn của PPTX và PDF được định nghĩa ở đâu; danh sách mất hoặc đổi đã biết; phạm vi kiểm chứng của R-028.
- Phương án:
  - A. BR-006 đọc "(BR-013)" là điều kiện báo: "Khi định dạng đích không thể hiện được một phần deck, file tải về được thiếu phần đó nếu hệ thống đã báo phần đó cho người dùng theo BR-013" (khớp UC-008 3A). R-025 thay "trong giới hạn của từng định dạng" bằng tham chiếu BR-007. R-026, R-028 ghi danh sách mất hoặc đổi là "Chưa chốt" và hạ Proposed tới khi có evidence implementation (D-026 mục 3).
  - B. Người dùng cung cấp ngay danh sách giới hạn và mất hoặc đổi theo từng định dạng; giữ cả bốn item ở Active.
  - C. Hạ cả bốn item xuống Proposed.
- Đề xuất: A, vì BR-007 đã định nghĩa phần không bắt buộc giống nhau, cách đọc "đã báo" phán được đạt hay không mà không cần danh sách đóng, và D-026 đã chọn học danh sách từ implementation. Cần người dùng xác nhận cách đọc "(BR-013)" ở BR-006.
- Quyết định: BR-006 Exceptions: khi định dạng đích không thể hiện được một phần deck, file tải về được thiếu phần đó nếu hệ thống đã báo phần đó cho người dùng theo BR-013. R-025 thay "trong giới hạn của từng định dạng" bằng tham chiếu BR-007 và giữ Active. R-026 và R-028 ghi danh sách phần bị mất hoặc đổi là "Chưa chốt (nơi xử lý: kết quả test file tải về khi implementation)" và hạ xuống Proposed. Theo Q1, các danh sách này tính cho cả 4 định dạng V1: PPTX, PDF, PNG, SVG. (theo P2 của DECISIONS.md)

### BLK-003 · SO_LIEU · Ranh giới "hệ thống con quá lớn" của C-002
- ID tạm: C-L01 (`work/assess-constraints.md`)
- Item: C-002
- Tiêu chí: GC-02, GC-08, GX-08, GX-09 (C-002 đang Active)
- Hiện trạng: Constraint: "Architecture không được đòi team xây các hệ thống con quá lớn chỉ để đạt kết quả cốt lõi của sản phẩm." Lý do 2 liệt kê ví dụ: "editor hoàn chỉnh, bản sao PowerPoint, cộng tác thời gian thực, hạ tầng SaaS phân tán hoặc design system lớn". Sheet không có số thành viên, thời hạn hay danh sách đóng.
- Điều chưa biết hoặc cần chọn: ranh giới nào cho phép phán một Architecture đã vượt C-002 hay chưa. Danh sách ở Lý do 2 là ví dụ ("có thể đúng về lý thuyết nhưng không khả thi"), nên coi đó là danh sách đầy đủ là chọn một cách hiểu.
- Phương án:
  - A. Dùng danh sách ở Lý do 2 làm danh sách đóng các hệ thống con mà Architecture không được đòi team tự xây; người dùng xác nhận danh sách đủ và làm rõ "design system lớn". Giữ Active.
  - B. Người dùng cung cấp ranh giới từ phía bên áp đặt: số thành viên, thời hạn đồ án (và nếu có, số giờ công). Câu Constraint nêu các con số đó; Review Trigger thành "các con số này thay đổi". Giữ Active.
  - C. Chỉ giữ phần nguồn lực đo được (như B) trong C-002; phần "không tự xây hệ thống con lớn" là đánh giá của team, chuyển sang Decision (GC-01). Phương án này tạo hoặc đổi ID.
  - D. Hạ C-002 về Proposed tới khi có ranh giới (TRANG_THAI). Lưu ý GC-02 (bounded) vẫn áp từ Proposed.
- Đề xuất: A, vì dùng thông tin đã có trong sheet và chỉ cần người dùng xác nhận danh sách; khớp với cách D-006, D-015, R-041 đã loại editor chuyên nghiệp. Nên quyết cùng BLK-020 (mục 6).
- Quyết định: Lý do 2 của C-002 thành danh sách đóng các hệ thống con mà Architecture không được đòi team tự xây: editor hoàn chỉnh, bản sao PowerPoint, cộng tác thời gian thực, hạ tầng SaaS phân tán, design system lớn. Người dùng đã xác nhận danh sách đủ. C-002 giữ Active. (theo P2 của DECISIONS.md)

### BLK-004 · SO_LIEU · Đồ án bắt buộc bao nhiêu định dạng tải về (C-003)
- ID tạm: C-L02 (`work/assess-constraints.md`)
- Item: C-003 (liên quan R-039, D-026)
- Tiêu chí: GC-02, GC-08, GX-09 (C-003 đang Active), GC-01
- Hiện trạng: Constraint: "Project phải hỗ trợ tải deck về nhiều định dạng theo yêu cầu của đồ án". Lý do 1: "Team không được chọn chỉ một định dạng **nếu** đồ án bắt buộc nhiều định dạng." Lý do 3: "Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định." R-039.Bối cảnh: "Yêu cầu đồ án **khuyến khích** hỗ trợ nhiều định dạng (C-003)."
- Điều chưa biết hoặc cần chọn: (1) đồ án bắt buộc hay chỉ khuyến khích nhiều định dạng; (2) nếu bắt buộc thì ranh giới là bao nhiêu hoặc những định dạng nào. Đọc "nhiều" = "ít nhất 2" là chọn một cách hiểu.
- Phương án:
  - A. Đồ án bắt buộc; "nhiều" = ít nhất 2 định dạng (khớp D-026: PPTX và PDF). Câu Constraint ghi "ít nhất 2 định dạng"; Lý do 1 bỏ "nếu". Giữ Active.
  - B. Người dùng cung cấp số lượng hoặc danh sách định dạng mà môn học hoặc advisor bắt buộc. Giữ Active.
  - C. Chưa xác nhận được với môn học hoặc advisor: hạ C-003 về Proposed (TRANG_THAI). Review Trigger hiện tại đã chờ đúng sự kiện này.
  - D. Đồ án chỉ khuyến khích: không còn là giới hạn áp từ bên ngoài (GC-01). Retire C-003; ý "nhiều định dạng" do D-026 và R-039 sở hữu. Kéo theo quan hệ của R-020, R-025–R-028, R-039, D-026 tới C-003.
- Đề xuất: A nếu người dùng xác nhận đồ án bắt buộc, vì D-026 đã cam kết 2 định dạng nên ranh giới "ít nhất 2" kiểm tuân thủ được ngay; nếu chưa xác nhận được thì C. Sau khi chốt, R-039.Bối cảnh cần sửa theo cho khớp.
- Quyết định: Không chọn A, C hay D. Danh sách định dạng tải về là lựa chọn của team, lấy theo benchmark Napkin AI, không phải yêu cầu áp từ môn học hay advisor. V1 tải về 4 định dạng: PPTX (sửa được trong Microsoft PowerPoint); PDF (in, lưu trữ, chia sẻ); PNG (mỗi slide một ảnh, đóng gói thành file .zip); SVG (mỗi slide một ảnh vector, đóng gói thành file .zip). Release Later: đẩy deck vào Google Drive của người dùng dưới dạng file Google Slides; người dùng đăng nhập Google để cấp quyền. Tạo D-031 sở hữu danh sách này; D-026 chuyển Superseded, `superseded_by: [D-031]`. C-003 chuyển Retired; ý "advisor khuyến khích nhiều định dạng" ghi vào Context của D-031. Tạo R-058 (Later, Proposed) cho việc đẩy lên Google Drive; Câu hỏi mở của R-058: khi đưa vào release phải mở lại D-027 và thêm luồng Google vào R-042. Bảng áp theo từng item ở `APPLY.md` mục 2. (theo Q1 của DECISIONS.md)

### BLK-005 · SO_LIEU · Đại lượng và ngưỡng cho assumption về nhóm người dùng và cách tương tác chính
- ID tạm: A-L05 (`work/assess-assumptions.md`)
- Item: A-007, A-008, A-009
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-007 Signpost "nhu cầu thực tế khác rõ rệt". A-008 "AI làm phần lớn việc tạo và sửa deck"; Signpost "muốn tự kiểm soát trực tiếp nhiều hơn". A-009 "cách tương tác chính hợp với người dùng"; Signpost "khó mô tả ý định…, phải gõ lại nhiều lần, hoặc cách tương tác khác hiệu quả hơn".
- Điều chưa biết hoặc cần chọn: với từng item, đại lượng đo (ví dụ tỷ lệ người tham gia, tỷ lệ thao tác giao cho AI, số lần gõ lại một yêu cầu) và ngưỡng làm assumption sai.
- Phương án:
  - A. Người dùng cung cấp đại lượng và ngưỡng cho từng item ngay.
  - B. Chưa có số: giữ chữ gốc kèm `<!-- BLOCKER BLK-005 -->`, xử lý status theo BLK-046, bổ sung khi lập kế hoạch nghiên cứu người dùng.
- Đề xuất: B nếu BLK-046 chọn B; A nếu BLK-046 chọn A.
- Quyết định: A-007, A-008, A-009 dùng quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. Câu Assumption, Signpost và Cách kiểm chứng viết cụ thể cho từng item theo quy trình này. Ba item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-006 · SO_LIEU · Ranh giới chỉnh sửa trong và ngoài DeckAgent
- ID tạm: A-L06 (`work/assess-assumptions.md`)
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
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo BLK-046. Tiêu chí "deck dùng được" lấy theo blocker cùng câu hỏi ở requirements hoặc decisions nếu có.
- Đề xuất: B, và gộp ý 3 với blocker "deck dùng được" của loại khác (mục 6).
- Quyết định: A-010, A-020, A-021 dùng quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. Định nghĩa thêm: "lỗi nhỏ" ở A-010 là sai chính tả, sai một con số, thay một từ hoặc một câu; "chỉnh tay chuyên sâu" ở A-020 là đổi bố cục, hình khối, animation hoặc định dạng của từng thành phần. A-021 dùng thuật ngữ "deck dùng được" của glossary: deck đạt R-021, và đạt thêm R-007 khi được tạo từ tài liệu có sẵn. Ba item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d và P1c của DECISIONS.md)

### BLK-007 · SO_LIEU · Đại lượng cho assumption về độ trung thực đầu ra và xem trước
- ID tạm: A-L08 (`work/assess-assumptions.md`)
- Item: A-015, A-016, A-017
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-015 "Người dùng quan tâm tới việc giữ đúng thông tin từ tài liệu"; Signpost "chấp nhận AI bổ sung tự do hơn dự kiến". A-016 "coi trọng việc các file tải về giống nhau về ý nghĩa hơn là giống nhau về pixel…"; Signpost "đòi hỏi độ giống hình ảnh cao hơn". A-017 "Xem trước đáng tin để người dùng quyết định deck đã dùng được"; Signpost "khác nhau rõ rệt".
- Điều chưa biết hoặc cần chọn: đại lượng và ngưỡng cho từng item (ví dụ tỷ lệ người dùng xếp hạng ưu tiên, tỷ lệ người dùng đổi quyết định sau khi mở file tải về).
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo BLK-046.
- Đề xuất: B nếu BLK-046 chọn B; A nếu BLK-046 chọn A.
- Quyết định: A-015, A-016, A-017 dùng quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. Câu Assumption, Signpost và Cách kiểm chứng viết cụ thể cho từng item. Ba item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-008 · SO_LIEU · Đại lượng cho assumption về nhu cầu đầu vào
- ID tạm: A-L09 (`work/assess-assumptions.md`)
- Item: A-011, A-014
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-011 "Nhập và sửa tiếp deck có sẵn là nhu cầu cốt lõi, không chỉ là capability phụ"; Signpost "nhu cầu… lớn", "chi phí… quá cao so với giá trị". A-014 "Người dùng nhận được giá trị khi cùng một loại file được dùng với nhiều vai trò"; Signpost "chỉ cần ít loại file hoặc vai trò", "độ phức tạp lớn mà ít giá trị".
- Điều chưa biết hoặc cần chọn: đại lượng phân biệt "cốt lõi" với "phụ" (A-011) và đo "giá trị" của nhiều vai trò (A-014), cùng ngưỡng.
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo BLK-046. Cả hai item đang "để sau" ở V1.
- Đề xuất: B, vì cả hai item có mức ảnh hưởng V1 là "để sau".
- Quyết định: A-011, A-014 dùng quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. Câu Assumption, Signpost và Cách kiểm chứng viết cụ thể cho từng item. Hai item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-009 · SO_LIEU · Đại lượng cho assumption về giữ nguyên và giữ trạng thái
- ID tạm: A-L10 (`work/assess-assumptions.md`)
- Item: A-012, A-013, A-029
- Tiêu chí: GA-01, GA-04, GX-08
- Hiện trạng: A-012 "là vấn đề người dùng gặp thường xuyên"; Signpost "vấn đề lớn". A-013 "nếu bị quên, trải nghiệm giảm rõ rệt". A-029 Signpost "thường mất deck ngoài ý muốn hoặc thường cần quay lại deck qua nhiều lần làm việc".
- Điều chưa biết hoặc cần chọn: tần suất làm A-012 đúng; đại lượng "trải nghiệm" và mức giảm (A-013); tần suất "thường" (A-029).
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chưa có số: giữ chữ gốc kèm marker, xử lý status theo BLK-046.
- Đề xuất: B nếu BLK-046 chọn B; A nếu BLK-046 chọn A.
- Quyết định: A-012, A-013, A-029 dùng quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. Câu Assumption, Signpost và Cách kiểm chứng viết cụ thể cho từng item. Ba item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-010 · SO_LIEU · Tiêu chí benchmark cho phân loại lượt xử lý AI
- ID tạm: A-L11 (`work/assess-assumptions.md`)
- Item: A-018, A-019
- Tiêu chí: GA-01, GA-04, GA-05, GX-08
- Hiện trạng: A-018 "Các lượt xử lý AI có độ khó khác nhau rõ ràng… mà không giảm chất lượng bắt buộc"; Review Trigger "Sau benchmark về thời gian, chi phí, khả năng model và chất lượng; bị bác bỏ nếu khó phân loại độ khó hoặc chi phí phân loại lớn hơn lợi ích". A-019 "phân biệt được rõ"; Signpost "ranh giới giữa các nhóm quá mơ hồ".
- Điều chưa biết hoặc cần chọn: "khác nhau rõ ràng" và "phân biệt được rõ" đo bằng gì (ví dụ mức đồng thuận khi nhiều người gán nhãn); "chất lượng bắt buộc" theo tiêu chí nào; "khó phân loại" và "lớn hơn lợi ích" theo ngưỡng nào.
- Phương án:
  - A. Người dùng cung cấp ngay.
  - B. Chờ benchmark: giữ chữ gốc kèm marker, xử lý status theo BLK-046.
- Đề xuất: B, vì chính sheet ghi assumption được kết luận "sau benchmark", và cả hai item có mức ảnh hưởng V1 là "để sau".
- Quyết định: A-018: Supported nếu thời gian hoặc chi phí trung bình của nhóm lượt xử lý khó gấp ≥ 2 lần nhóm dễ [tạm 2026-10-03 · xem lại: theo CX-2], đồng thời nhóm dễ vẫn đạt R-021; đo trên bộ đánh giá chung của P1c. A-019: 2 người gán nhãn độc lập cho 30 yêu cầu sửa [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu mức đồng thuận ≥ 80% [tạm 2026-10-03 · xem lại: theo CX-2]. Với cả hai item, đủ mẫu mà không đạt ngưỡng Supported thì Invalidated. Hai item giữ Open. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-011 · SO_LIEU · Giới hạn kích thước và số trang của file tải lên
- ID tạm: UC-L04 (`work/assess-use-cases.md`)
- Item: UC-002 (2B, Câu hỏi mở 1), UC-003 (1A)
- Tiêu chí: GUC-11, GX-09 (UC-002 Active), GX-08
- Hiện trạng: UC-002 2B "File vượt giới hạn kích thước: Hệ thống báo giới hạn…"; Câu hỏi mở 1 "Giới hạn kích thước và số trang của tài liệu là bao nhiêu?" (không có nơi xử lý). UC-003 1A cùng điều kiện cho deck có sẵn. Không item nào trong sheet có con số này (đã tìm trong requirements, decisions, constraints, assumptions).
- Điều chưa biết hoặc cần chọn: giới hạn kích thước (MB) và số trang; item nào sở hữu con số.
- Phương án:
  - A. Người dùng cung cấp con số, ghi vào một Requirement (R-003 hoặc Requirement mới); nhánh 2B ghi "File vượt giới hạn kích thước hoặc số trang của R-xxx". UC-003 dùng cùng Requirement hoặc con số riêng khi quay lại phạm vi.
  - B. Chưa có con số: giữ câu hỏi với nơi xử lý là R-003, hạ UC-002 xuống Proposed.
  - C. Bỏ nhánh 2B (không giới hạn kích thước ở V1): đổi hành vi, cần người dùng xác nhận.
- Đề xuất: A, vì nhánh 2B không tạo lại được trong test khi chưa có con số (GUC-11). Gộp với blocker cùng chủ đề bên requirements nếu có.
- Quyết định: R-003 sở hữu giới hạn đầu vào trong section `Miền đầu vào`: file tải lên ≤ 20 MB; DOCX và PDF ≤ 50 trang; PPTX ≤ 50 slide; text dán vào, TXT, Markdown ≤ 100.000 ký tự. Cả bốn con số là ngưỡng tạm, nhãn `[tạm 2026-10-03 · xem lại: lần benchmark đầu tiên với tài liệu thật]`. Nhánh 2B của UC-002 ghi "File vượt giới hạn của R-003"; Câu hỏi mở 1 của UC-002 bỏ; UC-002 giữ Active. UC-003 nhánh 1A dùng cùng giới hạn khi quay lại phạm vi. (theo P1b của DECISIONS.md)

### BLK-012 · SO_LIEU · Câu thoát "trừ khi việc đó cần thiết" ở BR-004
- ID tạm: BR-L09 (`work/assess-business-rules.md`)
- Item: BR-004
- Tiêu chí: GX-08, GBR-06
- Hiện trạng: "…không được thay đổi phần deck ngoài phạm vi, trừ khi việc đó cần thiết và đã được người dùng xác nhận."
- Điều chưa biết hoặc cần chọn: những trường hợp nào thay đổi ngoài phạm vi được coi là "cần thiết"
- Phương án:
  - A. Người dùng liệt kê các trường hợp; chuyển thành ngoại lệ đánh số trong Exceptions
  - B. Bỏ "cần thiết", chỉ giữ điều kiện "đã được người dùng xác nhận" (nới rộng ngoại lệ, đổi nghĩa)
  - C. Giữ Proposed; câu "trừ khi …" giữ nguyên kèm câu hỏi trong `Câu hỏi mở`: "Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết?", nơi xử lý UC-023
- Đề xuất: C, vì BR-004 là Later, đang Proposed và gắn UC-023 chưa làm; mức Proposed cho phép điều chưa chốt kèm nơi xử lý. Khi đưa UC-023 vào làm thì phải trả lời trước khi lên Active
- Quyết định: BR-004 giữ Proposed. Câu "trừ khi việc đó cần thiết và đã được người dùng xác nhận" giữ nguyên, kèm câu hỏi trong `Câu hỏi mở`: "Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết?", nơi xử lý UC-023. (theo P2 của DECISIONS.md)

### BLK-013 · SO_LIEU · Câu thoát "trong giới hạn lưu trữ" ở BR-016
- ID tạm: BR-L10 (`work/assess-business-rules.md`)
- Item: BR-016
- Tiêu chí: GX-08
- Hiện trạng: "…bản bị thay vẫn nằm trong lịch sử, trong giới hạn lưu trữ."
- Điều chưa biết hoặc cần chọn: giới hạn lưu trữ lịch sử là bao nhiêu (số bản, thời gian hoặc dung lượng) và bản nào bị loại khi vượt giới hạn
- Phương án:
  - A. Người dùng cho con số và quy tắc loại bản
  - B. Bỏ "trong giới hạn lưu trữ" (đổi nghĩa thành giữ vô hạn)
  - C. Giữ Proposed; vế "trong giới hạn lưu trữ" giữ kèm câu hỏi trong `Câu hỏi mở`, nơi xử lý UC-022
- Đề xuất: C, vì BR-016 là Later, Proposed, gắn UC-022 chưa làm
- Quyết định: BR-016 giữ Proposed. Vế "trong giới hạn lưu trữ" giữ nguyên, kèm câu hỏi trong `Câu hỏi mở`: "Giới hạn lưu trữ lịch sử là bao nhiêu, và bản nào bị loại khi vượt giới hạn?", nơi xử lý UC-022. (theo P2 của DECISIONS.md)

### BLK-014 · SO_LIEU · Câu thoát "đã công bố / hệ thống hỗ trợ" ở các requirement Later
- ID tạm: R-L10 (`work/assess-requirements.md`)
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
- Quyết định: Ở R-012, R-015, R-016, R-018, R-022, R-023, R-034, R-035, R-038, R-039, R-040 và R-056 (tách từ R-018), câu thoát được thay bằng "Chưa chốt"; câu hỏi tương ứng đưa vào `Câu hỏi mở`, nơi xử lý: khi năng lực đó quay lại phạm vi release (ghi vào `_FILL_LATER.md`). Các item giữ Proposed, scope Later. (theo P2 của DECISIONS.md)

### BLK-015 · SO_LIEU · Thông tin nào thiếu thì DeckAgent phải hỏi lại
- ID tạm: R-L11 (`work/assess-requirements.md`)
- Item: R-002
- Tiêu chí: GR-03, GX-08, GR-08
- Hiện trạng: Yêu cầu "khi yêu cầu thiếu thông tin có thể làm deck đi sai hướng". Acceptance 1 chỉ nêu một trường hợp: "Khi không xác định được chủ đề hoặc mục đích của deck…"
- Điều chưa biết hoặc cần chọn: danh sách thông tin mà thiếu thì bắt buộc hỏi lại. Lấy Acceptance 1 làm điều kiện đầy đủ là thu hẹp nghĩa của Yêu cầu.
- Phương án:
  - A. Điều kiện hỏi lại = thiếu chủ đề hoặc thiếu mục đích (đúng như Acceptance 1, khớp R-006 Acceptance 1).
  - B. Người dùng bổ sung thêm thông tin vào danh sách (ví dụ: audience, ngôn ngữ).
- Đề xuất: A, vì đây là điều duy nhất sheet đã nêu cụ thể và R-006 dùng cùng điều kiện. Vẫn cần người dùng xác nhận là không có thêm trường hợp nào.
- Quyết định: R-002 hỏi lại khi yêu cầu thiếu chủ đề hoặc thiếu mục đích của deck. Người dùng xác nhận không có trường hợp nào khác. (theo P2 của DECISIONS.md)

### BLK-016 · SO_LIEU · Số slide tối thiểu của một deck hoàn chỉnh
- ID tạm: R-L12 (`work/assess-requirements.md`)
- Item: R-006
- Tiêu chí: GX-08, GR-07
- Hiện trạng: Acceptance 1 "…hệ thống tạo deck có nhiều slide và xem trước được."
- Điều chưa biết hoặc cần chọn: "nhiều slide" là bao nhiêu.
- Phương án:
  - A. "≥ 2 slide" (cách hiểu tối thiểu của "nhiều").
  - B. Bỏ điều kiện số slide, chỉ giữ "xem trước được, sửa và tải về được" (đúng Ghi chú định nghĩa "hoàn chỉnh").
  - C. Người dùng đặt một số tối thiểu khác.
- Đề xuất: B, vì Ghi chú của chính R-006 định nghĩa "hoàn chỉnh" bằng xem trước, sửa và tải về, không bằng số slide.
- Quyết định: R-006 bỏ điều kiện "nhiều slide". Acceptance chỉ giữ: deck xem trước được, sửa được và tải về được, đúng định nghĩa "hoàn chỉnh" trong Ghi chú của R-006. (theo P1e của DECISIONS.md)

### BLK-017 · SO_LIEU · Reopen When dùng điều kiện không quan sát được
- ID tạm: D-L02 (`work/assess-decisions.md`)
- Item: D-006, D-009, D-014, D-017, D-025, D-030
- Tiêu chí: GD-07, GX-08
- Hiện trạng:
  - D-006: "user testing cho thấy AI-first không mang lại giá trị cho người dùng nếu thiếu chỉnh sửa sâu… hoặc hướng sản phẩm chuyển sang công cụ thiết kế chuyên nghiệp"
  - D-009: "… hoặc yêu cầu đồ án thay đổi"
  - D-014: "… hoặc sửa cả deck làm mất kiểm soát rõ rệt"
  - D-017: "… P4 là điều kiện cần cho V1 dùng được"
  - D-025: "… không giúp người dùng đạt deck dùng được, người dùng phụ thuộc nhiều vào sửa cục bộ…"
  - D-030: "… gây khó hiểu"
- Điều chưa biết hoặc cần chọn: GD-07 (áp từ Active) đòi điều kiện quan sát được, cấm dạng "khi có thay đổi". Các cụm trên không có mốc. Viết lại cho đạt phải đặt ngưỡng (ví dụ tỷ lệ người dùng trong user test) hoặc chọn cách hiểu (D-009: "yêu cầu đồ án" là C-003 hay yêu cầu khác), đều là thêm thông tin.
- Phương án:
  - A. Giữ điều kiện định tính như sheet. Người review bỏ qua cảnh báo Lint kèm lý do "điều kiện dựa trên kết quả user test hoặc testing chưa có chỉ số"; ghi việc đặt chỉ số vào `Ghi chú` của từng item.
  - B. Người dùng bổ sung mốc cho từng item (chỉ số, nguồn quan sát, ngưỡng).
  - C. Riêng D-009: thay "yêu cầu đồ án thay đổi" bằng "C-003 thay đổi" (C-003 là giới hạn từ đồ án lên số định dạng tải về), kết hợp với A hoặc B cho các item còn lại.
- Đề xuất: A cho D-006, D-014, D-017, D-025, D-030, cộng C cho D-009, vì các ngưỡng phụ thuộc user test chưa thực hiện, còn D-009 có sẵn một Constraint khớp nghĩa nên chỉ cần người dùng xác nhận cách hiểu.
- Quyết định: Reopen When của D-006, D-014, D-017, D-025, D-030 viết theo quy trình kiểm chứng chung: mở lại khi ≥ 2/5 người [tạm 2026-10-03 · xem lại: theo CX-2] trong buổi thử với ≥ 5 người thuộc ACT-001 cho thấy điều kiện mở lại của từng Decision. D-009: đổi "yêu cầu đồ án thay đổi" thành "C-003 thay đổi". CẦN XEM CX-3: Q1 chuyển C-003 sang Retired, nên điều kiện "C-003 thay đổi" không còn xảy ra được. Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-018 · TACH_ITEM · A-007 gộp mô tả nhóm người dùng với lựa chọn phân khúc
- ID tạm: A-L02 (`work/assess-assumptions.md`)
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
  - A. Giữ một item, đổi câu thành một khẳng định về nhu cầu của nhóm người dùng mô tả ở ACT-001 (dạng "Người dùng cá nhân có đặc điểm như ACT-001 có nhu cầu tạo và sửa deck bằng DeckAgent", ngưỡng theo BLK-005). Đặc điểm nhóm do ACT-001 sở hữu; vế 1 do A-008 sở hữu; vế 4 bỏ vì là lựa chọn, đã thể hiện qua việc ACT-001 là Primary Actor. Không tạo ID mới.
  - B. Tách: A-007 giữ vế 2, item mới cho vế 3; vế 1 gộp vào A-008; vế 4 bỏ. Tạo một ID mới và phải chia lại 5 Requirement đang dựa vào A-007.
  - C. Giữ nguyên câu (vi phạm GA-01, GA-02).
- Đề xuất: A, vì không tạo ID, bỏ trùng với A-008 và ACT-001 (GX-10), và để lại một khẳng định kiểm được bằng cùng loại quan sát mà Signpost hiện có đã nêu ("Phỏng vấn người dùng, usability test hoặc feedback cho thấy nhu cầu thực tế khác…").
- Quyết định: A-007 chỉ giữ một khẳng định: nhóm người dùng mà ACT-001 mô tả có nhu cầu tạo và sửa deck chủ yếu bằng AI. Đặc điểm của nhóm do ACT-001 sở hữu; vế "AI làm phần lớn việc" do A-008 sở hữu; vế "là nhóm DeckAgent nên phục vụ" bỏ vì là lựa chọn. Ngưỡng theo P1d. Không tạo ID mới. (theo P5 của DECISIONS.md)

### BLK-019 · TACH_ITEM · Requirement gộp nhiều hành vi
- ID tạm: R-L13 (`work/assess-requirements.md`)
- Item: R-014, R-018, R-020, R-026, R-030
- Tiêu chí: GR-04
- Hiện trạng và đề xuất từng item:

| Item | Status | Các hành vi đang gộp | Đề xuất |
|---|---|---|---|
| R-014 | Proposed | thêm, xóa, nhân bản, sắp xếp slide; thay hình ảnh | Tách 2: thao tác trên slide (thêm, xóa, nhân bản, sắp xếp) và thay hình ảnh. Bốn thao tác đầu cùng đối tượng là slide, nên coi là liệt kê thao tác của một năng lực |
| R-018 | Proposed | tạo hình mới; tìm hình có sẵn | Tách 2: tạo và tìm |
| R-020 | Active | tạo file từ bản đang xem trước; bản chờ duyệt thành bản đã chấp nhận khi tải về thành công | Không tách: bỏ vế 2 và Acceptance 3, trỏ BR-010 mục 3c, 6 (gắn với BLK-033) |
| R-026 | Active | xử lý theo cách dự đoán được; báo người dùng | Không tách: giữ "báo người dùng" làm hành vi; "xử lý dự đoán được" thuộc danh sách của BLK-002 |
| R-030 | Active | hiển thị tiến độ của lượt xử lý kéo dài; cho biết bước tiếp theo khi có lỗi | Tách 2: tiến độ và lỗi. R-046 đang `depends_on` R-030 vì phần tiến độ (UC-014) |

- Điều chưa biết hoặc cần chọn: có tạo ID mới cho các phần tách hay không. Với R-020, R-026, có chấp nhận bỏ vế thay vì tách hay không.
- Phương án:
  - A. Làm theo cột Đề xuất: tạo ID mới cho R-014, R-018, R-030 (3 ID mới); R-020, R-026 bỏ vế, không tách.
  - B. Không tách item nào, chấp nhận Lint GR-04 cảnh báo, ghi lý do trong Ghi chú.
  - C. Tách tất cả 5 item.
- Đề xuất: A. Hai vế của R-030 có điều kiện khác nhau và đạt hoặc trượt độc lập, đúng ví dụ GR-04 trong `_CRITERIA.md`. R-020 vế 2 đã có chủ sở hữu ở BR-010.
- Quyết định: Tách 3 item, mỗi phần tách ra nhận ID mới: R-014 giữ thao tác trên slide (thêm, xóa, nhân bản, sắp xếp), R-055 nhận thay hình ảnh; R-018 giữ tạo hình mới, R-056 nhận tìm hình có sẵn; R-030 giữ hiển thị tiến độ, R-057 nhận thông báo lỗi kèm bước làm tiếp theo. R-020 bỏ vế 2 và Acceptance 3 vì BR-010 sở hữu. R-026 bỏ vế "xử lý theo cách dự đoán được", giữ "báo người dùng". Status, scope và quan hệ của ID mới ở `APPLY.md` mục 4. (theo P5 của DECISIONS.md)

### BLK-020 · DOI_LOAI · R-041 có type Constraint
- ID tạm: G-01
- Item: R-041; D-006, D-011, D-015 (có `addresses: [R-041]`); C-002 (R-041 là Requirement duy nhất trỏ tới C-002, cần cho GC-07)
- Tiêu chí: GR-14, GX-02, GX-10, GC-07
- Hiện trạng: Type = `Constraint`. Yêu cầu: "DeckAgent phải đạt mục tiêu của V1 mà không cần xây một editor chỉnh slide chuyên nghiệp trong ứng dụng." Bối cảnh: "Thời gian và số người của đồ án có hạn và V1 ưu tiên tạo mới". Căn cứ: D-015, C-002.
- Điều chưa biết hoặc cần chọn: Requirement không có nhóm "constraint" (GR-14). Nội dung là giới hạn phạm vi, đã được D-006 và D-015 sở hữu như lựa chọn của team; C-001 cùng nội dung đã bị Retired vì "đây là lựa chọn của team, không phải giới hạn từ bên ngoài".
- Phương án:
  - A. Xóa R-041, đưa vào "ID đã nghỉ". Nội dung thuộc D-015 (lựa chọn) và C-002 (giới hạn nguồn lực).
  - B. Giữ R-041 là Requirement, đổi `type: Quality`, `verification: inspection` (kiểm phạm vi V1 không có editor chỉnh slide).
  - C. Chuyển thành Constraint mới (ID C-008) với `imposed_by` là nguồn lực đồ án.
- Đề xuất: A, vì cùng nội dung đã bị Retired khỏi Constraint với lý do là lựa chọn của team, và D-015 đang sở hữu lựa chọn đó (GX-10). Nếu chọn A thì BLK-027 tự hết, `addresses: [R-041]` của D-006, D-011, D-015 bị bỏ, và C-002 chỉ còn Use Case trỏ tới: C-002 (type Resource, nhóm dự án) khi đó trượt GC-07 (Lint) nếu không có Requirement hoặc Decision nào khác trỏ tới. Nếu chọn C thì `addresses` của 3 Decision trỏ sai loại và phải đổi sang `constraints`.
- Quyết định: Xóa R-041 và đưa vào danh sách ID đã nghỉ; nội dung thuộc D-015. Hệ quả: BLK-027 tự đóng; bỏ `addresses: [R-041]` ở D-006 và D-015 (D-011 bị xóa theo BLK-030). Thêm `constraints: [C-002]` vào D-015, để C-002 vẫn đạt GC-07. (theo P5 của DECISIONS.md)

### BLK-021 · MAU_THUAN_QH · Permissions lệch với bước Use Case
- ID tạm: ACT-L01 (`work/assess-actors.md`)
- Item: ACT-001, ACT-002, ACT-003
- Tiêu chí: GACT-08 (cả hai chiều), GACT-04
- Hiện trạng:
  - Chiều thuận (quyền không khớp bước nào): ACT-001 Permissions 4 "Quyết định khi nào deck dùng được." Không Use Case nào có bước tương ứng; gần nhất là "giữ" (UC-015 bước 3) và "tải về" (UC-008), đã có ở Permissions 3.
  - Chiều ngược, Use Case Active (V1) cho ACT-001 làm việc ngoài danh sách:
    1. Dừng lượt xử lý AI (UC-014 2A; UC-001 4A; UC-002 5B; UC-004 3A).
    2. Bắt đầu deck mới và xác nhận bỏ deck cũ (UC-011 bước 1 và 4).
    3. Chọn tiếp tục hoặc hủy khi hệ thống cảnh báo (UC-004 2B, UC-008 3A, UC-011 4A).
  - Chiều ngược, Use Case Proposed hoặc Draft (Later) cho ACT-001 làm việc ngoài danh sách: mở deck có sẵn (UC-003), đưa deck mẫu (UC-007), đăng nhập và đăng xuất (UC-009, UC-010), lấy deck cũ làm điểm xuất phát (UC-012), duyệt và sửa dàn ý (UC-016), chọn theme hoặc bộ nhận diện (UC-017), xem và xóa tài liệu đã tải lên (UC-018), chia sẻ deck (UC-019), mở lại deck cũ (UC-021), xem và khôi phục bản cũ (UC-022), sửa cục bộ (UC-023), thêm, xóa, sắp xếp slide và chèn hình (UC-024), dịch deck (UC-025).
  - Chiều ngược, ACT-002: Permissions 1 "Chỉ trả kết quả", nhưng UC-002 5A ghi "AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung".
  - Chiều ngược, ACT-003: UC-020 (Draft) bước 1 "Quản trị viên xem danh sách tài khoản" không có trong Permissions "Tạo, khóa, mở khóa và xóa tài khoản".
- Điều chưa biết hoặc cần chọn: Permissions của actor phải khớp với tập Use Case nào (chỉ Active, hay mọi Use Case chưa Deprecated), và bổ sung từ Use Case vào actor hay sửa Use Case cho khớp actor. Đồng thời: giữ, chuyển hay bỏ ACT-001 Permissions 4.
- Phương án:
  - A. Đồng bộ với mọi Use Case chưa Deprecated, bổ sung vào actor, mỗi việc ghi kèm ID Use Case để thấy phạm vi (ví dụ "Chia sẻ deck qua link (UC-019)"). ACT-001 thêm dừng lượt xử lý AI, bắt đầu deck mới, chọn tiếp tục hoặc hủy khi có cảnh báo, và các việc Later ở trên. ACT-002 thêm "Hỏi lại người dùng khi tài liệu có sẵn thiếu thông tin cho nội dung được yêu cầu (UC-002)". ACT-003 thêm "Xem danh sách tài khoản (UC-020)". ACT-001 Permissions 4 bỏ, vì việc quyết định đã thể hiện qua "giữ" và "tải về" ở Permissions 3.
  - B. Chỉ đồng bộ với Use Case Active (V1). Việc của Use Case Proposed hoặc Draft được thêm vào actor khi Use Case đó lên Active. ACT-003 giữ nguyên vì UC-020 là Draft. ACT-001 Permissions 4 xử lý như A.
  - C. Như A hoặc B, nhưng sửa Use Case thay vì actor ở chỗ chủ ngữ có thể sai: UC-002 5A đổi "AI hỏi người dùng" thành "Hệ thống hỏi người dùng", để ACT-002 vẫn "chỉ trả kết quả".
- Đề xuất: A, vì GACT-08 ghi "không Use Case nào cho actor làm việc ngoài danh sách", không giới hạn theo status; actor không có field `scope` nên ghi ID Use Case là cách duy nhất để thấy phạm vi. Riêng UC-002 5A nên hỏi thêm người viết Use Case xem chủ ngữ "AI" có chủ ý không (phương án C).
- Quyết định: Permissions của ACT-001, ACT-002, ACT-003 đồng bộ với mọi Use Case chưa Deprecated, mỗi việc ghi kèm ID Use Case. ACT-001 thêm: dừng lượt xử lý AI, bắt đầu deck mới, chọn tiếp tục hoặc hủy khi có cảnh báo, và các việc của Use Case Later (UC-003, UC-007, UC-009, UC-010, UC-012, UC-016, UC-017, UC-018, UC-019, UC-021, UC-022, UC-023, UC-024, UC-025); bỏ Permissions 4 "Quyết định khi nào deck dùng được". ACT-002 thêm "Hỏi lại người dùng khi tài liệu có sẵn thiếu thông tin cho nội dung được yêu cầu (UC-002)". ACT-003 thêm "Xem danh sách tài khoản (UC-020)". (theo P6 của DECISIONS.md)

### BLK-022 · MAU_THUAN_QH · UC-007 có bước AI nhưng không có ACT-002
- ID tạm: UC-L14 (`work/assess-use-cases.md`)
- Item: UC-007, ACT-002
- Tiêu chí: GUC-02 (`supporting_actors` đủ), GUC-12
- Hiện trạng: UC-007 bước 3 "AI tạo hoặc sửa deck theo phần đã chọn của deck mẫu." GL-024: "AI … gọi tới AI model/provider bên ngoài (ACT-002)". ACT-002.Related Use Cases không có UC-007, nên `supporting_actors` suy ra từ relations.json (via=derived) để trống.
- Điều chưa biết hoặc cần chọn: UC-007 có `supporting_actors: [ACT-002]` không.
- Phương án:
  - A. Thêm ACT-002 vào `supporting_actors` của UC-007.
  - B. Giữ trống; ghi lý do trong Ghi chú.
- Đề xuất: A, vì bước 3 gọi AI giống UC-001, UC-002, UC-004, đều có ACT-002.
- Quyết định: Thêm ACT-002 vào `supporting_actors` của UC-007. (theo P6 của DECISIONS.md)

### BLK-023 · MAU_THUAN_QH · R-025, R-028 vẫn nói "bản đã chấp nhận" sau khi R-020 đổi sang tải về từ bản đang xem trước
- ID tạm: R-L14 (`work/assess-requirements.md`)
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
- Quyết định: R-025 và R-028 đổi "bản đã chấp nhận" thành "bản người dùng đang xem trước", khớp R-020 và BR-006. (theo P6 của DECISIONS.md)

### BLK-024 · MAU_THUAN_QH · R-026 Acceptance 2 yếu hơn Yêu cầu và BR-013
- ID tạm: R-L15 (`work/assess-requirements.md`)
- Item: R-026, BR-013 (R-026 `business_rules` có BR-013)
- Tiêu chí: GR-15, GR-07
- Hiện trạng: Yêu cầu "…và báo cho người dùng khi định dạng tải về không giữ được một phần deck." Acceptance 2 "Người dùng được báo, hoặc hệ thống ghi lại, phần bị mất hoặc đổi." BR-013 "…hệ thống phải báo giới hạn thay vì bỏ qua âm thầm…"
- Điều chưa biết hoặc cần chọn: chỉ ghi log mà không báo người dùng thì có đạt không.
- Phương án:
  - A. Bỏ "hoặc hệ thống ghi lại": bắt buộc báo người dùng, khớp Yêu cầu và BR-013.
  - B. Giữ "hoặc ghi lại", đồng thời sửa Yêu cầu và xem lại BR-013.
- Đề xuất: A, vì Yêu cầu, Bối cảnh ("người dùng cần biết phần nào đã đổi") và BR-013 đều đòi báo người dùng.
- Quyết định: R-026 Acceptance 2 bỏ "hoặc hệ thống ghi lại": hệ thống bắt buộc báo người dùng phần bị mất hoặc đổi, không chỉ ghi log. (theo P6 của DECISIONS.md)

### BLK-025 · PHU_THUOC_DONG · Item Active dựa vào C-001 đã Retired
- ID tạm: G-02
- Item: C-001; R-029, R-041, D-006, D-015 (Active); R-014, R-015 (Proposed, cùng câu hỏi)
- Tiêu chí: GX-04
- Hiện trạng: C-001 Ghi chú: "Retired ngày 27/09/2026: đây là lựa chọn của team, không phải giới hạn từ bên ngoài (OR-045); nội dung đã được ghi ở D-006 và D-015." Cột Related Requirements/Decisions của C-001 vẫn còn R-014, R-015, R-029, R-041, D-006, D-015.
- Điều chưa biết hoặc cần chọn: Giữ quan hệ `constraints → C-001` thì vi phạm GX-04.
- Phương án:
  - A. Bỏ quan hệ `constraints: [C-001]` ở cả 6 item. C-001 giữ Retired để truy vết.
  - B. Kích hoạt lại C-001 (Active) và giữ quan hệ.
  - C. Hạ R-029, R-041, D-006, D-015 về Proposed.
- Đề xuất: A, vì C-001 bị Retired có chủ đích và nội dung đã chuyển sang D-006, D-015.
- Quyết định: Bỏ `constraints: [C-001]` ở R-014, R-015, R-029, D-006, D-015 (R-041 bị xóa theo BLK-020). C-001 giữ Retired để truy vết; nội dung đã nằm ở D-006 và D-015. (theo P4 của DECISIONS.md)

### BLK-026 · PHU_THUOC_DONG · Item Active dựa vào C-005 đã Retired
- ID tạm: G-03
- Item: C-005; R-003, R-004 (Active); R-005, R-010, R-017 (Proposed, cùng câu hỏi)
- Tiêu chí: GX-04, GX-10
- Hiện trạng: C-005 "Vai trò của file không được gán cứng theo loại file" ở trạng thái Retired, không ghi lý do retire. Cùng nội dung có ở D-007 (Active), BR-001 (Active) và R-004.
- Điều chưa biết hoặc cần chọn: Lý do C-005 bị Retired không có trong sheet. Giữ quan hệ thì vi phạm GX-04.
- Phương án:
  - A. Bỏ quan hệ `constraints: [C-005]` ở 5 Requirement; quy tắc do BR-001 sở hữu (R đã có thể trỏ BR-001 qua `business_rules`).
  - B. Kích hoạt lại C-005 và giữ quan hệ.
- Đề xuất: A, vì D-007 và BR-001 đang sở hữu nội dung này, và một lựa chọn của team không phải Constraint (GC-01).
- Quyết định: Bỏ `constraints: [C-005]` ở R-003, R-004, R-005, R-010, R-017. C-005 giữ Retired; nội dung do D-007 và BR-001 sở hữu. (theo P4 của DECISIONS.md)

### BLK-027 · PHU_THUOC_DONG · R-041 dựa vào A-004 (Retired, project) và UC-005 (Deprecated)
- ID tạm: G-08
- Item: R-041, A-004, UC-005
- Tiêu chí: GX-04
- Hiện trạng: A-004 Used By: R-041. UC-005 Related Requirements: R-015, R-041. A-004 Retired ("repo chưa có product code và chưa chọn Architecture nào"); UC-005 Deprecated.
- Điều chưa biết hoặc cần chọn: Chỉ còn ý nghĩa nếu BLK-020 không chọn xóa R-041.
- Phương án:
  - A. Bỏ quan hệ `R-041.assumptions → A-004` và `R-041.use_cases → UC-005`.
  - B. Hạ R-041 về Proposed và giữ quan hệ.
- Đề xuất: A, vì A-004 bị xóa (project) và UC-005 đã ngừng.
- Quyết định: Bỏ `R-041.assumptions → A-004` và `R-041.use_cases → UC-005`. Blocker tự đóng vì R-041 bị xóa theo BLK-020. (theo P4 và P5 của DECISIONS.md)

### BLK-028 · PHU_THUOC_DONG · R-042 dựa vào UC-018 đang Draft
- ID tạm: G-10
- Item: R-042, UC-018
- Tiêu chí: GX-04
- Hiện trạng: UC-018 (Draft, Later) có Related Requirements R-042, R-048, R-052, nên R-042 (Active, V1) nhận `use_cases: [UC-018]`. Ghi chú UC-018: "Trong V1, việc không để lộ dữ liệu qua log và file tạm thuộc R-042."
- Điều chưa biết hoặc cần chọn: R-042 không cần UC-018 để có nghĩa; UC-018 chỉ ghi chú rằng R-042 sở hữu phần V1.
- Phương án:
  - A. Không ghi `R-042.use_cases → UC-018`. Ghi chú của UC-018 giữ câu tham chiếu R-042.
  - B. Ghi quan hệ và hạ R-042 về Proposed.
- Đề xuất: A.
- Quyết định: Không ghi `R-042.use_cases → UC-018`. Ghi chú của UC-018 giữ câu tham chiếu R-042. R-042 giữ Active. (theo P4 của DECISIONS.md)

### BLK-029 · PHU_THUOC_XOA · 9 Requirement dựa vào A-005 (giả định về chiến lược Testing)
- ID tạm: G-07
- Item: A-005; R-007, R-021, R-024, R-025, R-027, R-028, R-031, R-032, R-033
- Tiêu chí: GX-04, GA-03, mục 1 của 03-assumptions/_CRITERIA.md
- Hiện trạng: A-005 "Tập trung Testing vào critical behavior và contract sẽ phát hiện được các lỗi nghiêm trọng mà chưa cần phủ test toàn hệ thống." Used By: 9 Requirement Active.
- Điều chưa biết hoặc cần chọn: A-005 là giả định về cách team test, nên bị xóa theo quyết định 2. Quan hệ `assumptions` nghĩa là "Requirement chỉ cần thiết khi assumption đúng", điều không đúng với 9 Requirement này: chúng vẫn cần dù chiến lược Testing đổi.
- Phương án:
  - A. Xóa A-005 và bỏ 9 quan hệ.
  - B. Giữ A-005 trong spec như assumption sản phẩm và giữ 9 quan hệ.
- Đề xuất: A, vì không Requirement nào trong 9 mất lý do tồn tại khi A-005 sai.
- Quyết định: Xóa A-005 (giả định về cách team test) và đưa vào danh sách ID đã nghỉ. Bỏ quan hệ `assumptions → A-005` ở R-007, R-021, R-024, R-025, R-027, R-028, R-031, R-032, R-033. (theo P4 của DECISIONS.md)

### BLK-030 · XOA_ITEM · Quy tắc "chưa chốt cơ chế và ngưỡng khi chưa có evidence" (C-006, C-007, D-011)
- ID tạm: G-04
- Item: C-006, C-007, D-011; quan hệ từ R-030, R-032, R-035, R-036, R-037 (→ C-007) và D-011 (→ C-006); text trích D-011 ở ACT-002, UC-014, R-032, R-037; R-037 có D-011 trong `source`
- Tiêu chí: GX-04, GC-01, GC-07, mục 1 của 07-decisions/_CRITERIA.md (quyết định về cách team làm việc)
- Hiện trạng: C-006 (Retired): "Các lựa chọn implementation như IR …, scene model, … chưa được coi là constraint hay giải pháp bắt buộc." C-007 (Retired): "Ngưỡng định lượng … không được đặt tùy ý trước khi có benchmark hoặc evidence." D-011 (Active): "Không chốt trước cơ chế Architecture hoặc ngưỡng định lượng khi chưa có acceptance criteria của V1, benchmark hoặc evidence trade-off."
- Điều chưa biết hoặc cần chọn: Ba item là quy tắc về cách team ra quyết định, không nói DeckAgent làm gì. Bộ tiêu chí mới đã chứa ý tương tự (GR-09: "không đặt số khi chưa có dữ liệu"; GC-04). Nhưng nhiều Requirement đang dựa vào C-007 (đã Retired, vi phạm GX-04) và trích D-011.
- Phương án:
  - A. Xóa cả ba (ID đã nghỉ). Bỏ quan hệ tới C-006, C-007. Text trích D-011 viết lại thành "chưa chốt" kèm nơi xử lý, không dùng ID.
  - B. Giữ C-006, C-007 ở Retired để truy vết, xóa D-011. Vẫn phải bỏ quan hệ R → C-007 vì GX-04.
  - C. Giữ D-011 là Decision sản phẩm (Active), giữ C-006, C-007 Retired, bỏ quan hệ R → C-007.
- Hệ quả phụ: A-018 chỉ được R-035, R-036, R-037 dựa vào. Nếu bỏ quan hệ của nhóm này thì A-018 vẫn còn (quan hệ `assumptions` không đổi), nhưng nếu các R đó bị hạ hay bỏ thì A-018 có thể không còn ai trỏ tới (GA-03). Nếu giữ D-011 hoặc D-028 (BLK-032) ở Active thì chúng chứa "chưa chốt", sẽ cần thêm blocker TRANG_THAI ở Pha B.
- Đề xuất: A, vì nội dung là quy trình của team và đã được GR-09 của bộ tiêu chí thay thế.
- Quyết định: Xóa C-006, C-007, D-011 và đưa vào danh sách ID đã nghỉ; P0 (ngưỡng tạm) thay cho quy tắc của ba item này. Bỏ quan hệ tới C-006, C-007 (từ D-011, R-030, R-032, R-035, R-036, R-037). Chỗ trích D-011 ở ACT-002, UC-014, R-032, R-037 và `source` của R-037: bỏ phần trích, hoặc thay bằng ID item đang sở hữu nội dung (R-032 cho ngưỡng của lượt xử lý AI). (theo P0 và P4 của DECISIONS.md)

### BLK-031 · XOA_ITEM · D-010 phân loại khái niệm trong spec
- ID tạm: G-05
- Item: D-010 (addresses tạm: R-020, R-025, R-026)
- Tiêu chí: mục 1 của 07-decisions/_CRITERIA.md, GX-10
- Hiện trạng: "Nhiều định dạng tải về là constraint của project; độ nhất quán giữa các định dạng là quality requirement; bản thân việc có nhiều định dạng không phải đóng góp của sản phẩm."
- Điều chưa biết hoặc cần chọn: D-010 quyết định cách xếp loại item, không quyết định hành vi sản phẩm. Sau migrate, hai nửa của D-010 đã được C-003 (Constraint) và R-025 (Quality) thể hiện.
- Phương án:
  - A. Xóa D-010 (ID đã nghỉ).
  - B. Giữ D-010, viết lại thành Decision về phạm vi: "V1 không coi nhiều định dạng tải về là giá trị của sản phẩm", với `shapes: [R-025]`.
- Đề xuất: A, vì nội dung đã nằm trong cách phân loại C-003 và R-025.
- Quyết định: Xóa D-010 (cách phân loại "nhiều định dạng" trong spec) và đưa vào danh sách ID đã nghỉ. (theo P4 của DECISIONS.md)

### BLK-032 · XOA_ITEM · D-028 khi nào tiêu chí chất lượng thành Hard Gate
- ID tạm: G-06
- Item: D-028; R-007, R-021, R-025, R-028 (trích D-028 trong `source` hoặc text)
- Tiêu chí: mục 1 của 07-decisions/_CRITERIA.md, GD-01, GX-10
- Hiện trạng: Decision: "1. W-026 không tạo thêm Hard Gate chỉ vì research thấy một failure mode tồn tại. 2. Một tiêu chí chất lượng chỉ thành Hard Gate khi V1 baseline đã cam kết mức tối thiểu đó, hoặc tiêu chí thuộc P1 hay P5. 3. Phần còn thiếu evidence được giữ làm candidate criterion hoặc research gap cho W-032." Danh sách 4 lỗi tối thiểu đã có nguyên văn trong Acceptance Note của R-021.
- Điều chưa biết hoặc cần chọn: Vế 1 và 3 nói về việc research của team (W-026, W-032). Vế 2 là chính sách nghiệm thu chất lượng. Danh sách lỗi tối thiểu (nội dung sản phẩm) đã thuộc R-021.
- Phương án:
  - A. Xóa D-028. R-021 giữ danh sách lỗi tối thiểu; "D-028 đã chốt" trong R-021 viết lại không có ID; bỏ D-028 khỏi `source` của R-007, R-021, R-025, R-028.
  - B. Giữ D-028 chỉ với vế 2 (sản phẩm), bỏ vế 1 và 3. Bỏ vế là đổi nghĩa, nên cần người dùng duyệt.
  - C. Giữ D-028 nguyên ba vế; W-026, W-032 viết lại thành text.
- Đề xuất: A, vì phần sản phẩm đã nằm ở R-021 và phần còn lại là quy trình research.
- Quyết định: Xóa D-028 và đưa vào danh sách ID đã nghỉ. Danh sách 4 lỗi tối thiểu chuyển hẳn sang R-021; câu "D-028 đã chốt" trong R-021 viết lại không có ID; bỏ D-028 khỏi `source` của R-007, R-021, R-025, R-028. (theo P4 của DECISIONS.md)

### BLK-033 · TRUNG_SO_HUU · Business Rule và Requirement phát biểu cùng một quy định
- ID tạm: M-02
- Gộp từ: BLK-033, BLK-033
- Item: các cặp trong bảng
- Tiêu chí: GX-10, GBR-08, GR-15; mục 1 của `05-business-rules/_CRITERIA.md` (rule giữ "điều phải đúng") và `06-requirements/_CRITERIA.md` (requirement giữ "năng lực phải có")
- Hiện trạng: mỗi cặp nói gần như cùng một câu. BR-001 Ghi chú tự nhận "R-004 mô tả hành vi; rule này giữ nguyên tắc chung". Cặp BR-004/R-022 còn khác mức cam kết: BR-004 "không được thay đổi phần deck ngoài phạm vi", R-022 "nên hạn chế thay đổi ngoài phạm vi".

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
| R-025 | BR-007 vế 1 | Giữ facts, số liệu, thứ tự, ý nghĩa giữa các định dạng |
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

- Điều chưa biết hoặc cần chọn: bên nào sở hữu nội dung quy định. Nếu bên còn lại chỉ còn câu tóm tắt kèm ID, có thể bên đó không còn nội dung riêng (R-004, R-007, R-024, R-043; hoặc BR-006, BR-008), và giữ hay xóa item đó là quyết định đổi ID.
- Phương án:
  - A. BR sở hữu quy tắc. R giữ câu Yêu cầu nêu hành vi quan sát được và Acceptance để kiểm chứng, trỏ BR qua `business_rules`. Chỗ R chép chi tiết của BR (R-020 vế 2, R-024 Acc 2–4, R-031 Acc 2, R-046 Acc 2–3) thay bằng tóm tắt kèm ID BR. Thêm quan hệ còn thiếu R-011, R-024, R-046 → BR-010. Mức cam kết của BR-004/R-022 lấy theo BR-004 ("không được"). R nào không còn nội dung riêng thì mở XOA_ITEM ở Pha B.
  - B. R sở hữu. BR bỏ phần trùng, chỉ giữ Exceptions và chi tiết R không có. BR không còn gì thì xóa (đổi ID, ảnh hưởng `use_cases` và `shapes` của Decision).
  - C. Quyết định riêng từng dòng.
- Đề xuất: A, vì bộ tiêu chí cho phép BR chi tiết hơn R (GR-15), BR được nhiều UC và R cùng trỏ tới, và quan hệ `R.business_rules → BR` đã có nên không mất truy vết. R vẫn có Acceptance riêng nên vẫn kiểm chứng được. Không tính R-051 Acc 2 ↔ BR-018 vì R-051 là Draft (GX-10 áp từ Proposed).
- Quyết định: Business Rule sở hữu quy tắc. Requirement giữ câu Yêu cầu nêu hành vi quan sát được và Acceptance để kiểm chứng, trỏ Business Rule qua `business_rules`. R-020 vế 2, R-024 Acceptance 2–4, R-031 Acceptance 2, R-046 Acceptance 2–3 rút về tóm tắt kèm ID Business Rule. Thêm quan hệ R-011, R-024, R-046 → BR-010. Mức cam kết của R-022 lấy theo BR-004 ("không được"). Không xóa ID nào trong nhóm này. (theo P3 của DECISIONS.md)

### BLK-034 · TRUNG_SO_HUU · Business Rule lặp lại câu Decision (gồm D-030 ↔ BR-010)
- ID tạm: M-03
- Gộp từ: BLK-034, BLK-034
- Item: BR-001/D-007, BR-007/D-009, BR-009 (mục 1)/D-024 (mục 2), BR-010 (mục 3b, 4, 5)/D-030, BR-011/D-025 (mục 3), BR-012 (mục 1)/D-027 (mục 2), BR-014 (mục 2)/D-029
- Tiêu chí: GBR-08, GD-10, GX-10, GD-01
- Hiện trạng: BR-001 "… theo mục đích …; đuôi file … không quyết định vai trò" và D-007 "Vai trò của file được xác định theo mục đích sử dụng, không suy ra cứng từ đuôi file"; BR-009 "Mỗi deck chỉ dùng một tài liệu có sẵn" và D-024 mục 2 "Mỗi deck dùng một tài liệu có sẵn". D-030.Decision gồm 7 câu (838 ký tự), cả 7 ý đều có trong BR-010 mục 3b, 4, 5; giữ nguyên còn vi phạm GD-01 (quá 3 vế).
- Điều chưa biết hoặc cần chọn: item nào phát biểu quy định; câu Decision có được rút về "lựa chọn + tóm tắt kèm ID BR" không.
- Phương án:
  - A. BR giữ phát biểu điều phải đúng. Câu Decision giữ lựa chọn và tóm tắt kèm ID BR; quan hệ `D.shapes → BR` đã có. Riêng D-030 rút về tối đa 3 vế: (1) DeckAgent chấp nhận bản chờ duyệt tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu; (2) ranh giới commit chỉ đạt sau khi các bước hỏi lại, cảnh báo hoặc xác nhận hoàn tất; chi tiết ghi "theo BR-010 mục 3b, 4, 5".
  - B. Decision giữ nguyên câu; BR viết lại thành tóm tắt kèm ID D. D-030 vẫn quá 3 vế.
  - C. Tách D-030 thành nhiều Decision (ID mới); BR-010 vẫn trùng.
- Đề xuất: A, vì GBR-08 ghi rõ "Decision giữ lựa chọn và lý do; rule giữ điều phải đúng", và BR-010 đã chứa đủ 7 ý của D-030 nên rút gọn D-030 không mất thông tin.
- Quyết định: Business Rule giữ phát biểu điều phải đúng; quan hệ `D.shapes → BR` đã có. Câu Decision của D-007, D-009, D-024, D-025, D-027, D-029 giữ nguyên chữ, thêm ID Business Rule trong ngoặc (khớp cả BLK-041: không viết lại Decision). D-030 rút về tối đa 3 vế: (1) bản chờ duyệt được chấp nhận tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu; (2) ranh giới commit chỉ đạt sau khi các bước hỏi lại, cảnh báo hoặc xác nhận hoàn tất; chi tiết ghi "theo BR-010". (theo P3 của DECISIONS.md)

### BLK-035 · TRUNG_SO_HUU · Item sở hữu vòng đời bản deck (ranh giới commit, khôi phục, dừng, lỗi)
- ID tạm: M-04
- Gộp từ: BLK-035, BLK-035
- Item: BR-005, BR-010, BR-014 (mục 2), UC-004; liên quan BR-006, R-024, R-031, R-046, D-030
- Tiêu chí: GX-10, GBR-08, GBR-05, GUC-15
- Hiện trạng:
  - BR-005: "Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, hệ thống phải giữ hoặc khôi phục bản đã chấp nhận gần nhất."
  - BR-010 mục 5 (lượt lỗi sau ranh giới commit → quay về bản tại ranh giới commit), mục 6 ("Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt"), mục 7, mục 8.
  - BR-014 mục 2: "Lượt xử lý bị dừng hoặc lỗi không tạo bản mới."
  - UC-004 viết lại BR-010 mục 3b, 4, 5 tại bước "2'", nhánh 1A, các nhánh 3A, 3B, 4A và Postconditions 1–2.
- Điều chưa biết hoặc cần chọn:
  1. Item nào sở hữu các chuyển trạng thái khi thất bại, dừng và bỏ.
  2. Cách đọc BR-005 khi tải về từ bản chờ duyệt thất bại: "khôi phục bản đã chấp nhận gần nhất" mâu thuẫn BR-010 mục 6; "giữ (không làm mất) bản đã chấp nhận" thì không.
  3. UC-004 có được bỏ nhánh 1A và thay đoạn quy tắc bằng tham chiếu không.
- Phương án:
  - A. BR-010 sở hữu toàn bộ vòng đời trong một `Bảng chuyển trạng thái`. BR-005 và BR-014 mục 2 rút về tóm tắt kèm ID BR-010; khi tải về thất bại áp BR-010 mục 6. UC-004: bước mới "Hệ thống đạt ranh giới commit và áp dụng ràng buộc của yêu cầu mới (BR-010 mục 4–5)", bỏ nhánh 1A, các nhánh 3A, 3B, 4A và Postconditions 1–2 tham chiếu BR-010.
  - B. BR-010 chỉ sở hữu "khi nào một bản thành bản đã chấp nhận"; BR-005 sở hữu khôi phục khi thất bại hoặc bỏ, có bảng chuyển trạng thái riêng; UC-004 tham chiếu cả hai.
  - C. Giữ chồng lấn, thêm câu dẫn chiếu qua lại (vi phạm GX-10).
- Đề xuất: A, vì test theo state transition (GBR-05) cần một bảng duy nhất xét đủ cặp trạng thái × sự kiện, và BR-010 đã áp lên 6 Use Case (GUC-15). Với A, BR-005 gần như chỉ còn tóm tắt; xóa BR-005 là XOA_ITEM riêng, không tự làm.
- Quyết định: BR-010 sở hữu toàn bộ vòng đời bản deck (commit, khôi phục, dừng, lỗi) trong một `Bảng chuyển trạng thái`. BR-014 mục 2 rút về tóm tắt kèm ID BR-010; khi tải về thất bại áp BR-010 mục 6. UC-004: bước mới "Hệ thống đạt ranh giới commit và áp dụng ràng buộc của yêu cầu mới (BR-010)"; bỏ nhánh 1A; các nhánh 3A, 3B, 4A và Postconditions 1–2 tham chiếu BR-010. BR-005 rút về tóm tắt kèm ID BR-010 thì không còn nội dung riêng: CẦN XEM CX-1 (giữ, xóa hay giữ dạng khác). (theo P3 của DECISIONS.md)

### BLK-036 · TRUNG_SO_HUU · Constraints của ACT-001 phát biểu lại phạm vi sản phẩm
- ID tạm: ACT-L02 (`work/assess-actors.md`)
- Item: ACT-001; chủ sở hữu đề xuất: R-029, D-006, D-015, D-027
- Tiêu chí: GX-10; template Actor ("Giới hạn cấp project thuộc Constraint")
- Hiện trạng:
  1. "Không bắt buộc có kỹ năng thiết kế chuyên nghiệp." ↔ R-029 "DeckAgent phải cho người không có kỹ năng thiết kế tạo và sửa được deck…". Trong ACT-001 cũng lặp với Needs 2 và Knowledge 3.
  2. "DeckAgent không thay thế toàn bộ PowerPoint, Canva hay Figma; chỉnh sâu làm bằng công cụ chuyên dụng sau khi tải về." ↔ D-006 (không nhằm trở thành editor chỉnh slide chuyên nghiệp) và D-015 (V1: chỉnh tay chuyên sâu làm sau khi tải về).
  3. "Không có cộng tác thời gian thực hay nhiều người cùng sửa một deck." ↔ D-027 "V1 … không cần host, tài khoản hay cộng tác". ACT-001 không giới hạn V1; D-027 chỉ nói V1.
  4. "V1 không có tài khoản (D-027)." Đã ở dạng tóm tắt kèm ID.
- Điều chưa biết hoặc cần chọn: giữ các ý 1–3 ở actor dưới dạng tóm tắt kèm ID chủ sở hữu, hay bỏ khỏi actor. Với ý 3: "không có cộng tác" chỉ áp cho V1 (theo D-027) hay áp cho cả sản phẩm.
- Phương án:
  - A. Giữ ở actor dạng tóm tắt kèm ID: "1. Không cần kỹ năng thiết kế (R-029). 2. Chỉnh tay chuyên sâu làm bằng PowerPoint hoặc công cụ chuyên dụng sau khi tải về (D-006, D-015). 3. V1 không có cộng tác hay nhiều người cùng sửa một deck (D-027). 4. V1 không có tài khoản (D-027)." Ý 3 thu hẹp về V1 cho khớp D-027.
  - B. Như A, nhưng ý 3 giữ không giới hạn V1. Khi đó nội dung "không bao giờ có cộng tác" không có item sở hữu, phải tạo Decision hoặc Constraint mới (ID mới).
  - C. Bỏ ý 1–3 khỏi actor; chỉ giữ ý 4.
- Đề xuất: A, vì giữ được ngữ cảnh cho người đọc actor mà không tạo bản quy định thứ hai. Ý 3 thu hẹp về V1 là đổi nghĩa, nên cần người dùng xác nhận. Lưu ý R-029, D-006, D-015 đang dính BLK-025 (dựa vào C-001 Retired).
- Quyết định: ACT-001 Constraints chỉ giữ 4 dòng tóm tắt kèm ID: 1. Không cần kỹ năng thiết kế (R-029). 2. Chỉnh tay chuyên sâu làm bằng PowerPoint hoặc công cụ chuyên dụng sau khi tải về (D-006, D-015). 3. V1 không có cộng tác hay nhiều người cùng sửa một deck (D-027). 4. V1 không có tài khoản (D-027). Ý "không cộng tác" chỉ áp cho V1. (theo P3 và Q3 của DECISIONS.md)

### BLK-037 · TRUNG_SO_HUU · "Kết quả của AI không tự động thành bản đã chấp nhận" mâu thuẫn BR-010
- ID tạm: ACT-L03 (`work/assess-actors.md`)
- Item: ACT-002; liên quan BR-010, R-033
- Tiêu chí: GX-10; GX-04 (nhất quán giữa các item)
- Hiện trạng: ACT-002 Needs 2 "Kết quả của AI không được tự động trở thành bản đã chấp nhận." BR-010 Rule 1 "Khi AI tạo deck lần đầu thành công, deck đó trở thành bản đã chấp nhận ngay." ACT-002 Permissions 1 "không trực tiếp thay đổi bản đã chấp nhận, vì kết quả phải qua bước kiểm tra (R-033)."
- Điều chưa biết hoặc cần chọn: Needs 2 nghĩa là "kết quả phải qua kiểm tra kết quả trước" (khớp R-033 và BR-010) hay "người dùng phải giữ thì mới thành bản đã chấp nhận" (mâu thuẫn BR-010 Rule 1 với lần tạo đầu).
- Phương án:
  - A. Hiểu theo R-033. Gộp Needs 2 vào Permissions 2: "Không trực tiếp thay đổi bản đã chấp nhận; kết quả chỉ thành bản chờ duyệt hoặc bản đã chấp nhận sau kiểm tra kết quả (R-033), theo BR-010." Chủ sở hữu: R-033 (kiểm tra) và BR-010 (khi nào thành bản đã chấp nhận).
  - B. Hiểu theo nghĩa người dùng phải giữ. Giữ Needs 2, và BR-010 Rule 1 phải sửa (thuộc loại business-rules).
  - C. Bỏ Needs 2 vì Permissions 1 đã nói ý không trực tiếp thay đổi bản đã chấp nhận.
- Đề xuất: A, vì BR-010 Active đã quy định rõ lần tạo đầu, và R-033 là nơi sở hữu bước kiểm tra. Nếu chọn A hoặc C thì section `Needs / Pain Points` của ACT-002 trống (Needs 1 đã chuyển sang `Hành vi lỗi`); xem mục 6.
- Quyết định: Hiểu theo R-033. Câu "kết quả AI không tự thành bản đã chấp nhận" ghi vào Permissions của ACT-002: "Không trực tiếp thay đổi bản đã chấp nhận; kết quả chỉ thành bản chờ duyệt hoặc bản đã chấp nhận sau kiểm tra kết quả (R-033), theo BR-010." Needs 2 của ACT-002 bỏ. (theo P3 của DECISIONS.md)

### BLK-038 · TRUNG_SO_HUU · Constraint chép lại nội dung quy định của D-026 và R-025
- ID tạm: C-L03 (`work/assess-constraints.md`)
- Item: C-003 ↔ D-026; C-004 ↔ R-025
- Tiêu chí: GX-10, GC-03
- Hiện trạng:
  - C-003.Lý do 2: "V1 đầu tiên dùng PPTX và PDF." D-026.Decision 1: "V1 tải về 2 định dạng: PPTX (sửa được) và PDF (chỉ xem)."
  - C-004.Lý do 2: "Vì vậy yêu cầu nhất quán phải tập trung vào nội dung, số liệu, mạch trình bày và ý nghĩa, không đòi mọi file giống hệt nhau." R-025.Yêu cầu: "DeckAgent phải giữ facts, số liệu, thứ tự trình bày và ý nghĩa giống nhau giữa các định dạng tải về…"
- Điều chưa biết hoặc cần chọn: item nào sở hữu từng nội dung, và Constraint giữ lại ở dạng nào. Hai câu trên đều không phải lý do giới hạn không đổi được (GC-03).
- Phương án:
  - A. D-026 sở hữu danh sách định dạng V1; R-025 sở hữu phạm vi nhất quán. C-003, C-004 chuyển câu sang `Ghi chú` dạng tóm tắt kèm ID: "V1 tải về PPTX và PDF (D-026)."; "Phạm vi nhất quán giữa các định dạng tải về do R-025 quy định."
  - B. Bỏ hẳn hai câu khỏi C-003, C-004; liên kết đã có qua `R-025.constraints`, `D-026.constraints`.
  - C. Constraint sở hữu; D-026, R-025 tóm tắt lại. Không hợp lý vì D-026 là lựa chọn của team và R-025 là hành vi nghiệm thu được.
- Đề xuất: A, vì giữ được ngữ cảnh khi đọc riêng Constraint mà không phát biểu lại quy định (GX-10).
- Quyết định: D-026 sở hữu danh sách định dạng (nay chuyển sang D-031 theo Q1), R-025 sở hữu phạm vi nhất quán. C-003 và C-004 chuyển câu trùng sang `Ghi chú` dạng tóm tắt kèm ID: C-003 "V1 tải về PPTX và PDF (D-026)." (C-003 đồng thời chuyển Retired theo Q1); C-004 "Phạm vi nhất quán giữa các định dạng tải về do R-025 quy định." (theo P3 của DECISIONS.md)

### BLK-039 · TRUNG_SO_HUU · Mệnh đề quy định nằm trong Assumption
- ID tạm: A-L03 (`work/assess-assumptions.md`)
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
  | A-022 | Assumption | "nhờ đó V1 không cần xây editor chuyên nghiệp trong ứng dụng" | D-015 (R-041 cùng nội dung, đang chờ BLK-020) |

- Điều chưa biết hoặc cần chọn: Assumption chỉ khẳng định điều team coi là đúng; hệ quả "DeckAgent phải / không cần…" là nội dung của Requirement, Business Rule hoặc Decision đang dựa vào assumption đó. Cần xác nhận bỏ các mệnh đề này khỏi Assumption và xác nhận item sở hữu.
- Phương án:
  - A. Bỏ mệnh đề khỏi section `Assumption` và `Ghi chú`; quan hệ dựa vào đã nằm ở phía item sở hữu. Ghi chú chỉ giữ một câu tóm tắt kèm ID sở hữu khi câu đó giúp đọc (ví dụ "Phạm vi editor của V1 do D-015 quy định").
  - B. Giữ nguyên trong Ghi chú nhưng thêm ID sở hữu; chỉ bỏ khỏi section `Assumption`.
  - C. Giữ nguyên (vi phạm GX-10).
- Đề xuất: A, vì phần khẳng định còn lại của từng item vẫn đủ nghĩa và bác bỏ được, còn mệnh đề quy định đã có chủ ở bảng trên. Với A-022, nếu BLK-020 giữ R-041 thì người dùng chọn D-015 hay R-041 làm item sở hữu.
- Quyết định: Bỏ mệnh đề quy định khỏi section `Assumption` và `Ghi chú` của A-010, A-012, A-013, A-015, A-016, A-022. Item sở hữu: D-015 (A-010, A-022), R-022 (A-012), BR-003 (A-013), R-008 (A-015), D-009 (A-016). Ghi chú chỉ giữ một câu tóm tắt kèm ID item sở hữu khi câu đó giúp đọc. (theo P3 của DECISIONS.md)

### BLK-040 · TRUNG_SO_HUU · Requirement trùng requirement khác
- ID tạm: R-L17 (`work/assess-requirements.md`)
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
- Quyết định: Bỏ phần trùng ở một bên, thay bằng ID: R-007 bỏ Acceptance 3, Ghi chú trỏ R-008; R-011 Acceptance 1 ghi "trau chuốt (R-013)"; R-013 bỏ Acceptance 2 (R-031 sở hữu); R-023 chỉ giữ phần thuộc tính của deck có sẵn (R-022 sở hữu nguyên tắc); R-046 Acceptance 2 tóm tắt kèm ID R-031. Không xóa ID nào. (theo P3 của DECISIONS.md)

### BLK-041 · TRUNG_SO_HUU · Requirement trùng Decision
- ID tạm: R-L18 (`work/assess-requirements.md`)
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
- Đề xuất: A. Decision ghi vì sao chọn, Requirement ghi hệ thống phải làm gì. Các cặp trên đều đã có D trong `source` của R hoặc R trong "Requirement chính" của D. Nên gộp với blocker tương ứng của decisions. R-041 phụ thuộc BLK-020; R-021 phụ thuộc BLK-032.
- Quyết định: Requirement sở hữu quy định; Decision giữ nguyên làm bản ghi lựa chọn và lý do. Requirement ghi Decision trong `source`; Decision trỏ Requirement qua `addresses` hoặc `shapes`. Không viết lại câu Decision vì lý do trùng với Requirement. Hai cặp đã có quyết định khác: R-041 ↔ D-006, D-015 (R-041 bị xóa theo BLK-020); R-021 ↔ D-028 (D-028 bị xóa theo BLK-032). (theo P3 của DECISIONS.md)

### BLK-042 · TRUNG_SO_HUU · Từ cấm "session" thuộc hai thuật ngữ
- ID tạm: GL-L01 (`work/assess-glossary.md`)
- Item: GL-012 (lần làm việc), GL-013 (phiên đăng nhập)
- Tiêu chí: quy ước `glossary.md` (mỗi dòng một khái niệm), GX-07
- Hiện trạng: GL-012 Không dùng "session, phiên làm việc, working state"; GL-013 Không dùng "session (khi nói về đăng nhập)". Hiện chưa item nào dùng "session" (0 lần).
- Điều chưa biết hoặc cần chọn: khi Lint gặp "session", từ này thay bằng thuật ngữ nào. Bảng hiện tại gán một từ cấm cho hai thuật ngữ.
- Phương án:
  - A. Giữ "session" ở cả hai dòng. Lint báo một lần và gợi ý cả hai thuật ngữ; người review chọn theo ngữ cảnh. Cần thêm một dòng vào quy ước đọc bảng: "một từ có thể bị cấm ở nhiều dòng; khi đó Lint gợi ý mọi thuật ngữ tương ứng".
  - B. Chỉ GL-012 giữ "session"; GL-013 Không dùng thành `—`. Mất thông tin "session" về đăng nhập phải gọi là "phiên đăng nhập".
  - C. Chỉ GL-013 giữ "session"; GL-012 bỏ "session". Mất thông tin "session" theo nghĩa lần làm việc bị cấm.
- Đề xuất: A, vì không mất thông tin của dòng nào và không cần Lint hiểu ngữ cảnh. Phụ thuộc BLK-066: nếu BLK-066 chọn B (bỏ từ có điều kiện) thì GL-013 tự mất "session" và blocker này đóng theo.
- Quyết định: Giữ "session" ở cột Không dùng của cả "lần làm việc" và "phiên đăng nhập". Quy ước đọc bảng của `glossary.md` thêm: một từ có thể bị cấm ở nhiều dòng; Lint gợi ý mọi thuật ngữ tương ứng. Đã làm ở B1. (theo P9 của DECISIONS.md)

### BLK-043 · TRANG_THAI · Loại, thời hạn và xung đột của ràng buộc của người dùng
- ID tạm: M-05
- Gộp từ: BLK-043, BLK-043, BLK-043
- Item: BR-003, R-001, R-024, UC-004; liên quan A-013
- Tiêu chí: GX-09, GX-08, GBR-06, GUC-18
- Hiện trạng:
  - BR-003 Exceptions: "Ràng buộc chỉ dành cho một lần sửa thì hết hiệu lực sau lần sửa đó; cách phân biệt sẽ được định nghĩa sau."
  - R-001: "(chủ đề, mục đích, audience, ngôn ngữ, độ dài, yêu cầu riêng)". "yêu cầu riêng" là cụm mở.
  - R-024 Ghi chú: "Thời hạn và cách xử lý xung đột giữa các loại ràng buộc còn mở (A-013)…"
  - UC-004 Câu hỏi mở: "Ràng buộc của người dùng hết hiệu lực khi nào, và xử lý thế nào khi hai ràng buộc mâu thuẫn? (A-013)". A-013 Ghi chú: "cố ý để mở".
- Điều chưa biết hoặc cần chọn: (1) danh sách đầy đủ các loại ràng buộc; (2) cách nhận biết ràng buộc chỉ dành cho một lần sửa và khi nào ràng buộc hết hiệu lực; (3) quy tắc khi hai ràng buộc xung đột. Thiếu (2), (3) thì không phán được ngoại lệ của BR-003 và Acceptance 1 của R-024.
- Phương án:
  - A. Hạ BR-003 và R-024 xuống Proposed; (2), (3) vào `Câu hỏi mở`, nơi xử lý A-013. R-001 giữ Active nếu người dùng thay được "yêu cầu riêng" bằng danh sách cụ thể, nếu không thì hạ cùng. UC-004 giữ Active, bước sửa tham chiếu BR-003 cho "ràng buộc còn hiệu lực"; câu hỏi chuyển về BR-003.
  - B. Giữ tất cả ở Active, người dùng chốt ngay (1), (2), (3).
  - C. Giữ Active, thu hẹp: ràng buộc còn hiệu lực tới khi người dùng đổi hoặc hủy, bỏ ngoại lệ ràng buộc một lần, xung đột để ngoài phạm vi. Đây là đổi nghĩa.
- Đề xuất: A, vì sheet ghi rõ câu hỏi "cố ý để mở" (A-013), và đây là thông tin ảnh hưởng hành vi bắt buộc nên không được ở Active (GX-09). Proposed còn hiệu lực nên UC-004 dựa vào BR-003 không vi phạm GX-04.
- Quyết định: BR-003, R-001, R-024 giữ Active, với hành vi mới: loại ràng buộc của người dùng gồm ngôn ngữ, độ dài (số slide), audience, mục đích, giọng văn, yêu cầu riêng. Ràng buộc chỉ áp cho một lần sửa khi yêu cầu có cụm "chỉ lần này", "lần này thôi" hoặc tương đương; ràng buộc đó hết hiệu lực khi lượt sửa kết thúc. Hai ràng buộc cùng loại xung đột thì ràng buộc mới thay ràng buộc cũ; ràng buộc khác loại không thay nhau. Câu hỏi mở về ràng buộc ở UC-004 bỏ. (theo P2 của DECISIONS.md)

### BLK-044 · TRANG_THAI · Ứng dụng đích dùng để kiểm chứng file PPTX
- ID tạm: M-07
- Gộp từ: BLK-044, BLK-044, BLK-044
- Item: R-027, UC-008 (bước 5, Postconditions 4, Câu hỏi mở 1), A-022, A-020 (vế Signpost); liên quan D-026
- Tiêu chí: GX-09, GX-08, GR-11, GUC-13, GUC-18, GA-04
- Hiện trạng:
  - R-027: "…hợp lệ, mở và dùng được trong môi trường đích." Acceptance 2: "Cam kết tương thích với từng ứng dụng cụ thể chưa được chốt trước implementation."
  - UC-008 Postconditions 4: "Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint." Câu hỏi mở 1: "Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice?" (không có nơi xử lý).
  - A-022 Signpost: "không mở ổn định, khó sửa, mất cấu trúc slide…"; Ghi chú dẫn D-026 chưa chốt mức tương thích.
  - D-026 mục 3: mức tương thích PPTX không chốt trước Architecture.
- Điều chưa biết hoặc cần chọn: "mở được" và "sửa được" kiểm trên ứng dụng nào. UC-008 đã ghi PowerPoint, còn R-027 và D-026 để mở.
- Phương án:
  - A. Chốt PowerPoint là ứng dụng kiểm chứng của V1. R-027, UC-008, A-022 ghi theo; bỏ câu hỏi mở của UC-008. Đây là bổ sung thông tin vào R-027 và có thể mâu thuẫn D-026 mục 3, nên cần người dùng chốt.
  - B. Giữ chưa chốt theo D-026: R-027 hạ Proposed, câu hỏi mở về danh sách ứng dụng đích (nơi xử lý D-026); UC-008 bỏ chữ "PowerPoint" khỏi Postconditions 4 (đổi nghĩa) và hạ Proposed; A-022 xử lý status theo blocker status của Assumption.
  - C. Chốt một ứng dụng khác hoặc nhiều ứng dụng.
- Đề xuất: Cần người dùng chọn giữa A và B. Subagent use-cases đề xuất A (Tình huống và Ghi chú của UC-008 đều nhắm PowerPoint); subagent requirements và assumptions đề xuất B (giữ đúng D-026). Agent chính nghiêng về A nếu D-026 mục 3 chỉ nói về mức tương thích chi tiết, không nói về ứng dụng đích; ngược lại là B.
- Quyết định: Ứng dụng kiểm chứng PPTX của V1 là Microsoft PowerPoint. R-027 có Acceptance riêng cho từng định dạng (Q1): PPTX mở và sửa được trong Microsoft PowerPoint; PDF mở được bằng trình xem PDF; PNG và SVG mở được bằng trình duyệt. UC-008 bỏ Câu hỏi mở 1; A-022 ghi theo. Google Slides và LibreOffice nằm ngoài cam kết V1. (theo Q2 của DECISIONS.md)

### BLK-045 · TRANG_THAI · Hỏi lại hay đánh dấu nội dung do AI bổ sung
- ID tạm: M-09
- Gộp từ: BLK-045, BLK-045
- Item: R-008, UC-002 (5A); liên quan BR-002
- Tiêu chí: GX-09, GR-05, GUC-11
- Hiện trạng: R-008 "phải hỏi lại người dùng hoặc đánh dấu nội dung do AI bổ sung…"; Ghi chú "Cách hiển thị phần AI bổ sung chưa được chốt." Acceptance 2 "Người dùng thấy được phần nào do AI bổ sung, hoặc được hỏi trước khi AI bổ sung." UC-002 5A: "AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung, rồi tiếp tục bước 5."
- Điều chưa biết hoặc cần chọn: (1) cách hiển thị là quyết định thiết kế hay một phần tiêu chí đạt; (2) khi nào hỏi, khi nào đánh dấu.
- Phương án:
  - A. Giữ Active. Cách hiển thị là quyết định thiết kế (GR-05); Ghi chú R-008 đổi thành "Cách hiển thị là quyết định thiết kế, không thuộc requirement này". "Hỏi hoặc đánh dấu" là hai hành vi đều chấp nhận được; test kiểm assertion chung của BR-002 (nội dung không có trong tài liệu không được trình bày như lấy từ tài liệu). UC-002 5A tham chiếu R-008.
  - B. Chốt một hành vi mặc định (ví dụ luôn đánh dấu), hành vi kia thành nhánh có điều kiện do người dùng nêu.
  - C. Hạ R-008 xuống Proposed, đưa câu hỏi vào `Câu hỏi mở`.
- Đề xuất: A, vì Acceptance 2 đã phán được đúng sai mà không cần biết cách hiển thị, và R-008, BR-002 đều cho phép cả hai hành vi.
- Quyết định: R-008 giữ Active và chấp nhận cả hai hành vi: hỏi lại người dùng, hoặc đánh dấu nội dung do AI bổ sung. Cách hiển thị là quyết định thiết kế; Ghi chú của R-008 đổi thành "Cách hiển thị là quyết định thiết kế, không thuộc requirement này". UC-002 nhánh 5A tham chiếu R-008. (theo P2 của DECISIONS.md)

### BLK-046 · TRANG_THAI · Assumption Open chưa có ngưỡng nhưng không có status mức thấp hơn
- ID tạm: A-L01 (`work/assess-assumptions.md`)
- Item: A-007, A-008, A-009, A-010, A-011, A-012, A-013, A-014, A-015, A-016, A-017, A-018, A-019, A-020, A-021, A-022, A-029 (17 item)
- Tiêu chí: GX-09, GA-01, GA-04, GA-05; `schema.json` (`item_types.assumption.statuses`); `03-assumptions/_CRITERIA.md` mục 3
- Hiện trạng: 17 item ở status Open, ánh xạ mức sẵn sàng `active`. Câu Assumption hoặc Signpost dùng từ không có mốc ("rõ rệt", "phần lớn", "thường xuyên", "dùng được", "quá cao"), nên chưa phán được Supported hay Invalidated. Con số thay thế không có trong sheet (BLK-005 … BLK-010). `schema.json` chỉ khai báo Open, Supported, Invalidated (`active`) và Retired (`closed`); Assumption không có status nào ở mức `proposed` để hạ xuống như các loại khác.
- Điều chưa biết hoặc cần chọn: giữ Open và bổ sung đủ ngưỡng trước khi migrate, hay thêm một status mức `proposed` cho Assumption.
- Phương án:
  - A. Giữ Open; trả lời hết BLK-005 … BLK-010 trước PR migrate.
  - B. Thêm vào `schema.json` một status mức `proposed`, `effective: true` (ví dụ `Proposed`), và sửa bảng vòng đời ở `03-assumptions/_CRITERIA.md` mục 3. Migrate 17 item ở status đó; chuyển lên Open khi có ngưỡng và `Cách kiểm chứng`. GX-04 của các Requirement và Decision Active vẫn đạt vì status mới còn hiệu lực.
  - C. Giữ Open và ghi ngoại lệ tạm cho PR migrate: 17 item trượt GA-01, GA-04, GA-05 tới khi bổ sung.
- Đề xuất: B, vì ngưỡng của các item này phụ thuộc vào nghiên cứu người dùng hoặc benchmark chưa thiết kế (D-026 còn cố ý để mức tương thích PPTX tới sau implementation). A buộc phải điền khoảng 17 bộ con số ngay; C làm mức `active` mất nghĩa. B cũng xử lý được việc section `Cách kiểm chứng` (bắt buộc từ `active`, tầng CI) sẽ để trống ở mọi item theo quyết định 3. Thay đổi này đụng `schema.json` và `_CRITERIA.md`, nên cần người dùng duyệt.
- Quyết định: 17 Assumption giữ status Open, không thêm status mới vào `schema.json` (bác đề xuất thêm status mức Proposed cho Assumption). Mỗi item có Assumption, Signpost và Cách kiểm chứng cụ thể theo quy trình kiểm chứng chung: buổi thử với ≥ 5 người thuộc nhóm ACT-001 [tạm 2026-10-03 · xem lại: theo CX-2]; Invalidated nếu ≥ 2/5 người cho thấy điều ngược lại [tạm 2026-10-03 · xem lại: theo CX-2]; Supported nếu ≤ 1/5 [tạm 2026-10-03 · xem lại: theo CX-2]; chưa đủ 5 người thì giữ Open. A-018 và A-019 dùng ngưỡng benchmark riêng (BLK-010). Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1d của DECISIONS.md)

### BLK-047 · TRANG_THAI · Nhánh cho Hành vi lỗi của ACT-002
- ID tạm: UC-L01 (`work/assess-use-cases.md`)
- Item: UC-001, UC-002, UC-004, UC-014 (Active, có `supporting_actors: [ACT-002]`). Cùng thiếu nhưng chưa chặn vì GUC-12 áp từ Active: UC-003, UC-017, UC-023, UC-024, UC-025 (Proposed), UC-016 (Draft)
- Tiêu chí: GUC-12, GUC-11
- Hiện trạng: `Hành vi lỗi` dự kiến của ACT-002 (assess-actors, dịch thử ACT-002) có 4 mục: "1. Không trả kết quả trong ngưỡng quá thời gian (R-032). 2. Trả lỗi thay vì kết quả. 3. Trả kết quả sai định dạng. 4. Thay đổi hành vi giữa các phiên bản model." Các Use Case chỉ có nhánh "AI lỗi hoặc quá thời gian" (UC-001 4B, UC-002 5C, UC-004 3B, UC-014 2B) và "Kết quả không qua kiểm tra" (UC-001 5A, UC-002 6A, UC-004 4A). Không Use Case nào nhắc mục 3 và mục 4.
- Điều chưa biết hoặc cần chọn: (a) mục 3 "sai định dạng" có được coi là một trường hợp của nhánh "kết quả không qua kiểm tra" (R-033) không; (b) mục 4 "thay đổi hành vi giữa các phiên bản model" có cần nhánh không, hay ghi lý do bỏ qua trong Ghi chú. Ghi lý do bỏ qua là thêm thông tin, nên không tự viết.
- Phương án:
  - A. Mục 1 và 2 tách thành hai nhánh riêng (đã có trong kế hoạch). Mục 3 ghi vào điều kiện của nhánh kiểm tra kết quả: "Kết quả của ACT-002 sai định dạng hoặc không qua kiểm tra kết quả (R-033)". Mục 4 bỏ qua, Ghi chú của từng Use Case ghi lý do: "Thay đổi hành vi giữa các phiên bản model không phát hiện được trong một lượt xử lý; kết quả sai vẫn bị chặn ở bước kiểm tra kết quả."
  - B. Mỗi mục trong `Hành vi lỗi` có một nhánh riêng ở từng Use Case, kể cả mục 4 (cần nêu hệ thống phát hiện mục 4 bằng cách nào).
  - C. Hạ 4 Use Case xuống Proposed tới khi chốt.
- Đề xuất: A, vì mục 3 đã bị chặn đúng tại bước kiểm tra kết quả hiện có, và mục 4 không phải điều kiện hệ thống phát hiện được trong một lượt (GUC-11). Nên chốt cùng blocker về `Hành vi lỗi` của ACT-002 bên actors.
- Quyết định: Ở UC-001, UC-002, UC-004, UC-014: quá thời gian và lỗi kết nối với nhà cung cấp AI thành hai nhánh riêng. "Trả kết quả sai định dạng" thuộc nhánh kết quả không qua kiểm tra (R-033). "Thay đổi hành vi giữa các phiên bản model" không có nhánh; Ghi chú của từng Use Case ghi lý do: không phát hiện được trong một lượt xử lý, kết quả sai vẫn bị chặn ở bước kiểm tra kết quả. (theo P6 của DECISIONS.md)

### BLK-048 · TRANG_THAI · Lượt tạo file tải về có dừng được không
- ID tạm: UC-L03 (`work/assess-use-cases.md`)
- Item: UC-014 (Câu hỏi mở 1), UC-008
- Tiêu chí: GX-09, GUC-12 ("bước có thể bị hủy giữa chừng phải có nhánh"), GUC-18
- Hiện trạng: UC-014 Trigger gồm cả "bắt đầu tạo file tải về", nhưng nhánh 2A chỉ cho dừng "lượt xử lý AI tạo hoặc sửa deck". Câu hỏi mở 1: "Lượt tạo file tải về có cần dừng được không?", không có nơi xử lý. D-029: "V1 cho người dùng dừng lượt xử lý AI tạo hoặc sửa deck đang chạy"; Reopen When: "khi lượt tải về cũng cần dừng được".
- Điều chưa biết hoặc cần chọn: V1 có cho dừng lượt tạo file tải về không. Câu trả lời quyết định UC-008 và UC-014 có thêm nhánh hay không.
- Phương án:
  - A. V1 không cho dừng lượt tạo file tải về, theo phạm vi của D-029. Câu hỏi mở 1 bỏ; Ghi chú của UC-014 và UC-008 ghi "V1 không dừng được lượt tạo file tải về (D-029)".
  - B. Cho dừng: thêm nhánh ở UC-008 (sau bước 4) và UC-014, kèm Requirement mới hoặc mở rộng R-046.
  - C. Giữ câu hỏi, hạ UC-014 xuống Proposed.
- Đề xuất: A, vì D-029 đã giới hạn rõ phạm vi dừng ở lượt xử lý AI và ghi sẵn điều kiện mở lại cho lượt tải về.
- Quyết định: V1 không cho dừng lượt tạo file tải về, theo phạm vi của D-029. Câu hỏi mở 1 của UC-014 bỏ; Ghi chú của UC-014 và UC-008 ghi "V1 không dừng được lượt tạo file tải về (D-029)". (theo P6 của DECISIONS.md)

### BLK-049 · TRANG_THAI · PDF không có text layer rơi vào nhánh nào
- ID tạm: UC-L05 (`work/assess-use-cases.md`)
- Item: UC-002
- Tiêu chí: GUC-11, GX-09
- Hiện trạng: "2A. File là ảnh, Excel/CSV, link web hoặc PDF scan: Hệ thống báo chưa nhận loại file này và liệt kê 5 loại đang nhận, sau đó quay lại bước 1." và "3A. Không đọc được file (file hỏng, PDF không có text layer): Hệ thống báo lỗi kèm cách xử lý, sau đó quay lại bước 1." PDF scan chính là PDF không có text layer, nên cùng một điều kiện có hai cách xử lý. R-003 Acceptance 2: "Loại file chưa nhận được bị từ chối kèm thông báo liệt kê 5 loại đang nhận."
- Điều chưa biết hoặc cần chọn: PDF không có text layer được báo là "loại chưa nhận" (2A) hay "không đọc được file" (3A).
- Phương án:
  - A. Bỏ "PDF scan" khỏi 2A. 3A giữ "PDF không có text layer".
  - B. Bỏ "PDF không có text layer" khỏi 3A. 2A giữ "PDF scan", dù bước 2 chỉ kiểm loại file nên không phát hiện được PDF scan ở đó.
  - C. Tách nhánh mới tại bước 3: "3B. File PDF không có text layer: Hệ thống báo chưa nhận PDF không có text layer và liệt kê 5 loại tài liệu đang nhận (R-003), quay lại bước 1." Bỏ "PDF scan" khỏi 2A và bỏ "PDF không có text layer" khỏi 3A.
- Đề xuất: C, vì hệ thống chỉ phát hiện được PDF không có text layer khi đọc file (bước 3), còn thông báo theo R-003 là liệt kê 5 loại đang nhận.
- Quyết định: UC-002 thêm nhánh "3B. File PDF không có text layer: Hệ thống báo chưa nhận PDF không có text layer và liệt kê 5 loại tài liệu đang nhận (R-003), quay lại bước 1." Bỏ "PDF scan" khỏi nhánh 2A và bỏ "PDF không có text layer" khỏi nhánh 3A. (theo P6 của DECISIONS.md)

### BLK-050 · TRANG_THAI · UC-004 kết thúc thành công ở đâu
- ID tạm: UC-L08 (`work/assess-use-cases.md`)
- Item: UC-004
- Tiêu chí: GUC-13, GUC-08, GX-09
- Hiện trạng: Mục tiêu: "Người dùng có deck đã sửa theo yêu cầu, và vẫn quay lại được bản trước nếu không vừa ý." Bước 6: "Người dùng xem trước (UC-015), sau đó giữ hoặc bỏ bản chờ duyệt." 6A: bỏ → UC-013. Postconditions 1 điều kiện hóa ("Nếu bản chờ duyệt được người dùng giữ hoặc được chấp nhận tại ranh giới commit để bắt đầu một lượt sửa tiếp…"). Postconditions 3: "Khi kết quả sửa mới trở thành bản chờ duyệt, bản đã chấp nhận làm cơ sở… vẫn quay lại được một bước." Postconditions 3 chỉ đúng khi bản chờ duyệt chưa được giữ, nên mâu thuẫn với Main Flow kết thúc ở "giữ".
- Điều chưa biết hoặc cần chọn: Main Flow kết thúc khi bản chờ duyệt được hiển thị, hay khi người dùng giữ bản đó.
- Phương án:
  - A. Kết thúc khi người dùng xem trước bản chờ duyệt: bước cuối "Người dùng xem trước bản chờ duyệt (UC-015)." Giữ và bỏ là hành động sau (bỏ: UC-013 `extend`; giữ: BR-010 điều 3a). Postconditions: bản chờ duyệt được hiển thị; bản đã chấp nhận làm cơ sở vẫn quay lại được (giữ Postconditions 3). Postconditions 1 chuyển thành tham chiếu BR-010.
  - B. Kết thúc khi người dùng giữ: bước cuối "Người dùng xem trước bản chờ duyệt (UC-015) và giữ bản đó." Postconditions 1: "Bản chờ duyệt người dùng giữ trở thành bản đã chấp nhận mới (BR-010 điều 3a)." Bỏ Postconditions 3.
- Đề xuất: A, vì khớp Mục tiêu ("vẫn quay lại được bản trước") và cách UC-013 `extend` UC-004 tại điểm bỏ bản chờ duyệt.
- Quyết định: UC-004 kết thúc thành công khi người dùng xem trước bản chờ duyệt (UC-015). Giữ và bỏ là hành động sau: bỏ thuộc UC-013 (`extend`), giữ theo BR-010. Postconditions: bản chờ duyệt được hiển thị; bản đã chấp nhận làm cơ sở vẫn quay lại được. Postconditions 1 chuyển thành tham chiếu BR-010. (theo P6 của DECISIONS.md)

### BLK-051 · TRANG_THAI · Trigger của UC-008 đứng sau bước 1
- ID tạm: UC-L11 (`work/assess-use-cases.md`)
- Item: UC-008
- Tiêu chí: GUC-06, GUC-11
- Hiện trạng: Trigger "Người dùng chọn tải về và chọn định dạng." nhưng bước 1 là "Người dùng xem trước deck (UC-015)" và bước 2 mới là "Người dùng chọn tải về…". Nhánh 1A "Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa (UC-004), kết thúc UC." xảy ra trước Trigger, và "chưa vừa ý" không phải điều kiện hệ thống phát hiện được. UC-015 bước 3 đã có lựa chọn "gửi yêu cầu sửa tiếp (UC-004)… hoặc tải về".
- Điều chưa biết hoặc cần chọn: Use Case bắt đầu tại xem trước hay tại lựa chọn tải về.
- Phương án:
  - A. Bắt đầu tại lựa chọn tải về: bước 1 chuyển thành Precondition "Người dùng đang xem trước deck (UC-015)"; bỏ nhánh 1A vì trùng UC-015 bước 3; bỏ `include: UC-015` (đổi quan hệ).
  - B. Giữ bước 1 và `include: UC-015`; đổi Trigger thành sự kiện của bước 1 (người dùng cần chọn câu chữ); 1A đổi điều kiện thành "Người dùng gửi yêu cầu sửa thay vì chọn tải về: Hệ thống chuyển sang UC-004."
  - C. Giữ nguyên, chấp nhận lệch GUC-06.
- Đề xuất: B, vì không đổi quan hệ và không bỏ nhánh; chỉ cần người dùng duyệt câu Trigger mới. Dịch thử ở mục 4 giữ nguyên Trigger và đánh dấu blocker.
- Quyết định: UC-008 giữ bước 1 "Người dùng xem trước deck (UC-015)" và `include: [UC-015]`. Trigger viết lại thành sự kiện của bước 1: "Người dùng mở xem trước deck hiện tại (UC-015)." Nhánh 1A đổi thành "1A. Người dùng gửi yêu cầu sửa thay vì chọn tải về: Hệ thống chuyển sang UC-004." Người dùng duyệt câu Trigger trong diff. (theo P6 của DECISIONS.md)

### BLK-052 · TRANG_THAI · Nhánh 1B của UC-011 không có điểm kết thúc
- ID tạm: UC-L12 (`work/assess-use-cases.md`)
- Item: UC-011. Liên quan R-045, BR-012
- Tiêu chí: GUC-10, GUC-12
- Hiện trạng: "1B. Người dùng tải lại trang hoặc đóng ứng dụng: Trình duyệt hiển thị cảnh báo rời trang nếu deck chưa tải về." Không có điểm kết thúc, có "nếu", và không nói điều gì xảy ra khi người dùng xác nhận hay hủy. R-045 Acceptance 1: "…người dùng thấy cảnh báo và hủy được hành động." Acceptance 2: "Không hiển thị cảnh báo khi không có deck nào chưa tải về."
- Điều chưa biết hoặc cần chọn: sau cảnh báo rời trang, mỗi lựa chọn kết thúc ở đâu; sau khi tải lại trang, DeckAgent có mở lần làm việc mới trống như Postconditions 1 không.
- Phương án:
  - A. Tách thành các nhánh theo R-045: "1B. Người dùng tải lại trang hoặc đóng ứng dụng khi deck chưa tải về bản mới nhất: Trình duyệt hiển thị cảnh báo rời trang (R-045); người dùng xác nhận, lần làm việc kết thúc, kết thúc Use Case." và "1C. Người dùng hủy ở cảnh báo rời trang: Lần làm việc hiện tại giữ nguyên, kết thúc Use Case." Không khẳng định có lần làm việc mới sau khi tải lại.
  - B. Bỏ "tải lại trang hoặc đóng ứng dụng" khỏi Trigger và nhánh 1B; Ghi chú ghi cảnh báo rời trang thuộc R-045.
  - C. Tách luồng tải lại hoặc đóng ra Use Case riêng (tạo ID mới).
- Đề xuất: A, vì chỉ dùng hành vi R-045 đã chốt, không thêm thông tin.
- Quyết định: UC-011 tách nhánh 1B theo R-045: "1B. Người dùng tải lại trang hoặc đóng ứng dụng khi deck chưa tải về bản mới nhất: Trình duyệt hiển thị cảnh báo rời trang (R-045); người dùng xác nhận, lần làm việc kết thúc, kết thúc Use Case." và "1C. Người dùng hủy ở cảnh báo rời trang: Lần làm việc hiện tại giữ nguyên, kết thúc Use Case." (theo P6 của DECISIONS.md)

### BLK-053 · TRANG_THAI · Người dùng hủy khi hệ thống hỏi lại
- ID tạm: UC-L13 (`work/assess-use-cases.md`)
- Item: UC-001 (3A), UC-002 (4A, 5A). Cùng thiếu nhưng chưa chặn: UC-007 (2A, Proposed)
- Tiêu chí: GUC-12 ("bước nhận dữ liệu người dùng đưa vào, hoặc có thể bị hủy giữa chừng, phải có nhánh")
- Hiện trạng: "3A. Không xác định được chủ đề hoặc mục đích của deck: Hệ thống hỏi lại người dùng, sau đó quay lại bước 3." Không có nhánh cho trường hợp người dùng hủy thay vì trả lời. UC-004 2A có xử lý này ("Nếu người dùng hủy, bản chờ duyệt (nếu có) vẫn là bản chờ duyệt và UC kết thúc").
- Điều chưa biết hoặc cần chọn: ở UC tạo deck, người dùng có thao tác hủy khi được hỏi lại không, và kết thúc ở trạng thái nào.
- Phương án:
  - A. Thêm nhánh, ví dụ "3B. Người dùng hủy khi được hỏi lại: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case." (tương tự UC-004 2A). Cần người dùng xác nhận vì đây là hành vi mới.
  - B. Không có thao tác hủy: Ghi chú ghi lý do bỏ qua (ví dụ người dùng gửi yêu cầu khác thay cho câu trả lời).
  - C. Hạ UC-001, UC-002 xuống Proposed.
- Đề xuất: A, vì UC-004 đã có cách xử lý tương ứng, và GUC-12 yêu cầu có nhánh.
- Quyết định: UC-001 (sau nhánh 3A) và UC-002 (sau nhánh 4A, 5A) thêm nhánh hủy: "Người dùng hủy khi được hỏi lại: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case." Đây là hành vi mới, người dùng đã xác nhận. (theo P6 của DECISIONS.md)

### BLK-054 · TRANG_THAI · Bảng chuyển trạng thái của BR-010 còn ô không suy ra được
- ID tạm: BR-L04 (`work/assess-business-rules.md`)
- Item: BR-010
- Tiêu chí: GBR-05, GX-09
- Hiện trạng: BR-010 Active, nói về trạng thái "bản chờ duyệt / bản đã chấp nhận" nên phải có `Bảng chuyển trạng thái`. Phần lớn dòng suy ra được từ Rule của BR-010 và các luồng UC-001, UC-004, UC-008, UC-013, UC-014 (bảng ở mục 4). Các cặp trạng thái × sự kiện sau **không có** trong sheet:
  1. Đang chờ hoàn tất yêu cầu sửa mới (còn hỏi lại, cảnh báo hoặc xác nhận) × người dùng giữ bản chờ duyệt
  2. Đang chờ hoàn tất yêu cầu sửa mới × người dùng bỏ bản chờ duyệt
  3. Đang chờ hoàn tất yêu cầu sửa mới × người dùng tải về
  4. Lượt xử lý AI đang chạy × người dùng tải về
- Điều chưa biết hoặc cần chọn: kết quả của 4 cặp trên (chuyển trạng thái hợp lệ, hay không cho phép và hệ thống báo gì)
- Phương án:
  - A. Người dùng điền 4 ô còn thiếu, BR-010 giữ Active
  - B. Hạ BR-010 xuống Proposed; bảng chỉ gồm các dòng suy ra được; 4 cặp ghi vào `Câu hỏi mở`, nơi xử lý UC-004 và UC-008
  - C. Giữ Active, bảng chỉ gồm các dòng suy ra được, bỏ qua 4 cặp (vi phạm GX-09 vì câu hỏi ảnh hưởng hành vi)
- Đề xuất: A, vì BR-010 là rule lõi của V1 (6 UC, R-020, R-031 dựa vào) và 4 câu hỏi đều là quyết định giao diện nhỏ, trả lời được ngay. Gợi ý (chưa có trong sheet, cần người dùng xác nhận): không cho giữ, bỏ hoặc tải về trong lúc chờ hoàn tất yêu cầu sửa mới hoặc khi lượt xử lý đang chạy
- Quyết định: BR-010 giữ Active, bảng chuyển trạng thái điền 4 ô: trong lúc chờ hoàn tất yêu cầu sửa mới (còn hỏi lại, cảnh báo hoặc xác nhận), và khi lượt xử lý AI đang chạy, hệ thống không cho giữ, bỏ hay tải về. Nếu người dùng thử, hệ thống báo "Đang xử lý yêu cầu, hãy chờ hoặc dừng lượt hiện tại" và trạng thái không đổi. (theo P2 và P6 của DECISIONS.md)

### BLK-055 · TRANG_THAI · Exceptions của BR-001 có hai cách hiểu
- ID tạm: BR-L06 (`work/assess-business-rules.md`)
- Item: BR-001
- Tiêu chí: GBR-06, GBR-07, GX-09
- Hiện trạng: Exceptions "V1 chỉ nhận vai trò tài liệu có sẵn; giới hạn này phải được công bố, không gán ngầm."
- Điều chưa biết hoặc cần chọn: (1) đây không phải trường hợp rule không áp dụng mà là một giới hạn V1 kèm một yêu cầu; (2) "công bố" là báo cho người dùng khi họ đưa file với mục đích khác, hay ghi giới hạn sẵn trong giao diện; (3) "không gán ngầm" là cấm coi file đó là tài liệu có sẵn, hay chỉ cấm làm vậy mà không báo
- Phương án:
  - A. Chuyển thành mệnh đề Rule: "Khi người dùng đưa file với mục đích khác tài liệu có sẵn, hệ thống phải báo rằng V1 chỉ nhận vai trò tài liệu có sẵn (BR-013) và không được tự coi file đó là tài liệu có sẵn." Xóa section Exceptions
  - B. Chuyển thành mệnh đề Rule: "Hệ thống phải hiển thị giới hạn 'V1 chỉ nhận tài liệu có sẵn' tại nơi người dùng đưa file vào." Hệ thống được dùng file làm tài liệu có sẵn sau khi đã hiển thị giới hạn
  - C. Giữ nguyên câu trong Exceptions (trượt GBR-06)
- Đề xuất: A, vì khớp với BR-013 (báo giới hạn thay vì xử lý âm thầm) và mẫu UC-004 2C (yêu cầu V1 chưa làm được thì báo giới hạn, không xử lý)
- Quyết định: BR-001 chuyển Exceptions thành mệnh đề Rule: "Khi người dùng đưa file với mục đích khác tài liệu có sẵn, hệ thống phải báo rằng V1 chỉ nhận vai trò tài liệu có sẵn (BR-013) và không được tự coi file đó là tài liệu có sẵn." Xóa section Exceptions. (theo P2 của DECISIONS.md)

### BLK-056 · TRANG_THAI · Mức cam kết của BR-012 mục 1
- ID tạm: BR-L08 (`work/assess-business-rules.md`)
- Item: BR-012
- Tiêu chí: GBR-02, GBR-07
- Hiện trạng: "Deck, tài liệu có sẵn và ràng buộc của người dùng chỉ tồn tại trong lần làm việc hiện tại." Câu mô tả, không có "phải / không được"
- Điều chưa biết hoặc cần chọn: viết theo GBR-02 buộc phải chọn một trong hai nghĩa, và hai nghĩa cho test khác nhau
- Phương án:
  - A. Giới hạn phạm vi: "Hệ thống không bắt buộc giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc." Lưu dữ liệu qua lần làm việc không phải lỗi
  - B. Lệnh cấm: "Hệ thống không được giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc." Test: mở lại ứng dụng không còn dữ liệu cũ
  - C. Giữ câu mô tả, chấp nhận cảnh báo Lint của GBR-02
- Đề xuất: A, vì D-027 mục 2 ghi "chưa mở lại được deck qua nhiều lần làm việc" (giới hạn tạm thời), và Exceptions của BR-012 nói rule hết hiệu lực khi có R-048. Nghĩa B có căn cứ yếu hơn ở UC-008 Postconditions 5 ("File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc")
- Quyết định: BR-012 mục 1 viết thành "Hệ thống không bắt buộc giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc." Đây là giới hạn phạm vi, không phải lệnh cấm lưu. (theo P2 của DECISIONS.md)

### BLK-057 · TRANG_THAI · Requirement Active dùng "nên" hoặc "có thể"
- ID tạm: R-L01 (`work/assess-requirements.md`)
- Item: R-002, R-030
- Tiêu chí: GR-02, GX-09
- Hiện trạng: R-002 "DeckAgent nên hỏi lại người dùng khi yêu cầu thiếu thông tin có thể làm deck đi sai hướng…"; R-030 "DeckAgent nên hiển thị tiến độ của lượt xử lý kéo dài…". Cả hai đang ở Active, scope V1.
- Điều chưa biết hoặc cần chọn: hai hành vi này là bắt buộc (thiếu thì test trượt) hay chỉ là mong muốn. Đổi "nên" thành "phải" là đổi mức cam kết.
- Phương án:
  - A. Đổi thành "phải" và giữ Active (vẫn chịu các blocker khác của từng item: BLK-015, BLK-001, BLK-019).
  - B. Giữ "nên" và hạ cả hai xuống Proposed.
  - C. Quyết định riêng từng item.
- Đề xuất: A, vì cả hai đều có Acceptance dạng bắt buộc, thuộc V1, và R-046 (Active) đang `depends_on` R-030. Hạ R-030 xuống Proposed sẽ làm một item Active dựa vào item chưa sẵn sàng nghiệm thu.
- Quyết định: R-002 và R-030 đổi "nên" thành "phải" và giữ Active. R-057 (tách từ R-030) cũng dùng "phải". (theo P7 của DECISIONS.md)

### BLK-058 · TRANG_THAI · Tiêu chí chất lượng của deck và của kết quả AI đang chờ nghiên cứu (W-032)
- ID tạm: R-L02 (`work/assess-requirements.md`)
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
  - B. Hạ cả bốn xuống Proposed, giữ scope V1. `Đo lường` ghi "Ngưỡng đạt: Chưa chốt (nơi xử lý: xem BLK-063)".
  - C. Giữ Active cho phần đã chốt (R-007: số liệu khớp tuyệt đối; R-021: 4 lỗi của D-028), tách phần ngưỡng chưa chốt thành requirement Proposed mới (tạo ID mới).
- Đề xuất: B. Đây là đúng tình huống mà `_COMMON_CRITERIA.md` mục 1 mô tả: item thuộc release hiện tại nhưng ở Proposed vì ngưỡng nghiệm thu chưa chốt. Không chọn C, vì ngay 4 lỗi của D-028 cũng còn "nghiêm trọng" chưa có ngưỡng. Kết quả còn phụ thuộc BLK-032 (D-028) và BLK-029 (A-005).
- Quyết định: R-007, R-009, R-021, R-029 giữ Active, có section `Đo lường` đầy đủ. Bộ đánh giá chung [tạm 2026-10-03 · xem lại: theo CX-2]: 10 tài liệu mẫu (báo cáo có số liệu, bài giảng, đề xuất dự án; dài 3–20 trang; ≥ 3 tài liệu có bảng số liệu), 10 yêu cầu không kèm tài liệu, mỗi đầu vào chạy 3 lần (60 lượt); lưu trong repo, vị trí đề xuất ở B5. R-007: Scale = số con số và trích dẫn trên slide khác tài liệu, mỗi lượt; Meter = script trích số đối chiếu tài liệu, người chấm xác nhận chỗ không khớp; Ngưỡng = 0 sai lệch ở ≥ 90% lượt có tài liệu và tổng tỷ lệ số liệu sai ≤ 1%. R-021: Scale = số slide mắc ít nhất một trong 4 lỗi tối thiểu (chữ không đọc được hoặc bị cắt, mạch trình bày gãy, slide hỏng hoặc trống ngoài ý muốn, bố cục vỡ); Meter = validator tự động kiểm chữ tràn hoặc bị cắt khỏi khung, cỡ chữ nội dung < 12 pt, slide trống ngoài ý muốn, người chấm kiểm mạch trình bày gãy; Ngưỡng = 0 slide lỗi ở ≥ 90% lượt. R-009: Scale = điểm rubric 1–3 về mức deck phản ánh audience và mục đích; Meter = 2 người chấm độc lập, lấy điểm thấp hơn; Ngưỡng = ≥ 80% lượt đạt ≥ 2 điểm. R-029: `verification: demonstration`; đo số người hoàn thành luồng tạo → xem trước → sửa 1 lần → tải về không cần trợ giúp, trong buổi thử với 5 người không chuyên thiết kế; Ngưỡng = ≥ 4/5 người hoàn thành trong ≤ 15 phút. Mọi ngưỡng trên là ngưỡng tạm. Glossary thêm "deck dùng được" (đã làm ở B1). Sự kiện xem lại của các ngưỡng tạm: CẦN XEM CX-2 (`trash/phase-b-can-xem.md`). (theo P1c của DECISIONS.md)

### BLK-059 · TRANG_THAI · Kiểm tra kết quả AI chưa định nghĩa
- ID tạm: R-L06 (`work/assess-requirements.md`)
- Item: R-033
- Tiêu chí: GX-09, GR-07
- Hiện trạng: Ghi chú "Cách kiểm tra cụ thể chưa quyết định; kiến trúc phải làm bước này kiểm chứng được." Acceptance "Mỗi loại lượt xử lý có bước kiểm tra kết quả tương ứng trước khi kết quả được hiển thị."
- Điều chưa biết hoặc cần chọn: requirement đòi phải có bước kiểm tra (kiểm được bằng cách đưa vào một kết quả hỏng), hay đòi cả nội dung bước kiểm tra (kết quả nào là hỏng).
- Phương án:
  - A. Giữ Active. Acceptance viết lại dạng "Khi kết quả AI không qua kiểm tra kết quả, kết quả đó không trở thành bản chờ duyệt hay bản đã chấp nhận". Danh sách điều kiện kiểm để Decision hoặc thiết kế quyết định. Ghi chú giữ vế "cách kiểm tra là quyết định thiết kế".
  - B. Hạ xuống Proposed tới khi có danh sách điều kiện kiểm cho từng loại lượt xử lý.
- Đề xuất: A, vì Acceptance phán được bằng cách tiêm kết quả hỏng, không cần biết cơ chế (GR-05). Phương án A chỉ viết lại, không thêm thông tin.
- Quyết định: R-033 giữ Active. Acceptance chỉ đòi: kết quả AI không qua kiểm tra kết quả thì không trở thành bản chờ duyệt hay bản đã chấp nhận; test bằng cách đưa vào một kết quả hỏng. Nội dung bước kiểm tra là quyết định thiết kế (giữ trong Ghi chú). (theo P2 của DECISIONS.md)

### BLK-060 · TRANG_THAI · Luồng nào được phép đưa nội dung người dùng ra ngoài
- ID tạm: R-L07 (`work/assess-requirements.md`)
- Item: R-042
- Tiêu chí: GR-11, GX-09, GR-12
- Hiện trạng: "…không để lộ tài liệu và nội dung người dùng qua log, file tạm hoặc xử lý bên ngoài, ngoài những gì thiết kế cho phép." Ghi chú "…việc gửi nội dung cho nhà cung cấp AI vẫn phải được W-028 xem xét."
- Điều chưa biết hoặc cần chọn: danh sách luồng được phép mang nội dung người dùng ra ngoài (ví dụ: gửi tới nhà cung cấp AI qua ACT-002). Không có danh sách này thì requirement không bao giờ fail (GR-11).
- Phương án:
  - A. Hạ xuống Proposed. Câu hỏi mở về danh sách luồng được phép (nơi xử lý: xem BLK-063).
  - B. Giữ Active, người dùng liệt kê ngay các luồng được phép, thay cho cụm "ngoài những gì thiết kế cho phép".
- Đề xuất: B nếu người dùng trả lời được ngay. Ứng dụng V1 chạy trên máy người dùng (D-027), nên danh sách có thể chỉ gồm luồng gửi tới nhà cung cấp AI. Nếu không trả lời được thì chọn A. Kết quả còn phụ thuộc BLK-028.
- Quyết định: R-042 giữ Active. Thay cụm "ngoài những gì thiết kế cho phép" bằng danh sách đóng: chỉ một luồng được đưa nội dung người dùng ra ngoài, là gửi tới nhà cung cấp AI qua ACT-002 để tạo và sửa deck. Log không chứa nội dung tài liệu hay nội dung deck. File tạm bị xóa khi lần làm việc kết thúc. (theo P2 của DECISIONS.md)

### BLK-061 · TRANG_THAI · R-010 ở Proposed nhưng ghi "còn ở mức thăm dò"
- ID tạm: R-L20 (`work/assess-requirements.md`)
- Item: R-010
- Tiêu chí: `_COMMON_CRITERIA.md` mục 1 (Proposed = đã cam kết thuộc sản phẩm; Draft = chưa chắc thuộc sản phẩm)
- Hiện trạng: Status Proposed; Ghi chú "1. Còn ở mức thăm dò."
- Điều chưa biết hoặc cần chọn: R-010 đã được cam kết thuộc sản phẩm hay chưa.
- Phương án:
  - A. Hạ xuống Draft, bỏ Ghi chú vì status đã thể hiện ý này.
  - B. Giữ Proposed, bỏ Ghi chú "còn ở mức thăm dò".
- Đề xuất: A, vì Ghi chú nói đúng nghĩa của Draft. Khác với R-021, nơi chỉ một khía cạnh (thẩm mỹ) còn thăm dò.
- Quyết định: R-010 hạ xuống Draft; bỏ Ghi chú "còn ở mức thăm dò" vì status đã thể hiện ý này. (theo P2 của DECISIONS.md)

### BLK-062 · THAM_CHIEU_LOAI_CU · Mã L-xxx, W-xxx trong `source`
- ID tạm: M-08
- Gộp từ: BLK-062, BLK-062
- Item: BR-017 (L-002), UC-017 (L-002), UC-024 (L-001), UC-025 (W-026), R-017 (L-001), R-018 (L-002), R-044 (W-026), R-047 (L-002)
- Tiêu chí: GX-03, GX-11, GBR-10
- Hiện trạng: ví dụ BR-017 Căn cứ "R-047, L-002"; UC-024 "L-001, R-014, R-017, R-018"; R-044 "W-026, D-025"; R-047 "L-002, Benchmark 27/09/2026". Tab Learnings và Work không được migrate.
- Điều chưa biết hoặc cần chọn: bỏ mã, giữ như mã nguồn dạng text, hay thay bằng item có kết luận tương ứng.
- Phương án:
  - A. Bỏ mã loại cũ khỏi `source`. Item nào sau khi bỏ mà `source` rỗng thì thay bằng Decision có kết luận tương ứng: D-024 (L-001), D-025 (L-002, W-026).
  - B. Giữ mã dạng text như mã nguồn (`allow_codes`). Validator phải chấp nhận mã không trỏ tới item.
  - C. Thay toàn bộ bằng Decision tương ứng (D-024, D-025).
- Đề xuất: A, vì phần lớn item đã có ID khác trong `source` giữ chuỗi truy vết, và D-024, D-025 đã ghi kết luận của L-001, L-002, W-026.
- Quyết định: Bỏ mã L-001, L-002, W-026 khỏi `source` của BR-017, UC-017, UC-024, UC-025, R-017, R-018, R-044, R-047. Item nào sau khi bỏ mà `source` rỗng thì thay bằng Decision có kết luận tương ứng: D-024 (thay L-001), D-025 (thay L-002, W-026). (theo P8 của DECISIONS.md)

### BLK-063 · THAM_CHIEU_LOAI_CU · Mã task W-xxx đang làm nơi xử lý cho điều chưa chốt
- ID tạm: R-L19 (`work/assess-requirements.md`)
- Item: R-007 (Ghi chú, W-032), R-021 (Acceptance Note, W-032), R-042 (Ghi chú, W-028)
- Tiêu chí: GX-09 (câu hỏi mở phải có nơi xử lý: task, issue hoặc decision)
- Hiện trạng: "Tiêu chí đo chi tiết do W-032 nghiên cứu"; "Ngưỡng … do W-032 nghiên cứu"; "…vẫn phải được W-028 xem xét".
- Điều chưa biết hoặc cần chọn: bỏ W-xxx thì mất nơi xử lý của điều chưa chốt. Câu hỏi là spec dạng file trỏ tới task bằng gì.
- Phương án:
  - A. Giữ mã W-xxx dạng text làm nơi xử lý trong `Câu hỏi mở` / `Đo lường` (ví dụ "Chưa chốt (task W-032)"). Validator coi W-xxx là mã ngoài spec, không kiểm tồn tại.
  - B. Thay bằng issue GitHub tương ứng (cần người dùng cho số issue).
  - C. Bỏ mã, chỉ ghi "chờ nghiên cứu tiêu chí chất lượng". Cách này không đạt GX-09, vì thiếu nơi xử lý.
- Đề xuất: A. `_CRITERIA.md` GR-09 dùng chính dạng "Chưa chốt (benchmark ở task #142)". W-xxx là task của project, không phải item spec. Nên gộp với các loại khác cũng dùng W-xxx làm nơi xử lý (ví dụ UC-002 Open Questions W-032).
- Quyết định: Giữ mã W-xxx dạng text làm nơi xử lý, ví dụ "(nơi xử lý: W-032)", cho tới khi Work chuyển thành GitHub Issue. Validator coi W-xxx là mã ngoài spec, không kiểm tồn tại. Với ngưỡng tạm của P1, R-007 và R-021 không còn cần nơi xử lý W-032; R-042 giữ "W-028" trong Ghi chú. (theo P8 của DECISIONS.md)

### BLK-064 · SCHEMA · Area ngoài enum
- ID tạm: G-11
- Item: R-027 (`CI`); R-032, R-035, R-037, R-042, R-051, R-053 (`Infra`); R-041 (`Schedule`)
- Tiêu chí: GX-02
- Hiện trạng: `schema.json` area có `CI/Infra`, không có `CI`, `Infra`, `Schedule`.
- Điều chưa biết hoặc cần chọn: Ánh xạ sang giá trị có sẵn hay mở rộng schema.
- Phương án:
  - A. `CI` và `Infra` → `CI/Infra`; bỏ `Schedule` (lịch trình là việc của dự án).
  - B. Thêm `CI`, `Infra`, `Schedule` vào `schema.json`.
- Đề xuất: A, vì `CI/Infra` đã gộp hai giá trị, và lịch trình không phải area của sản phẩm.
- Quyết định: `CI` và `Infra` ánh xạ sang `CI/Infra` (R-027, R-032, R-035, R-037, R-042, R-051, R-053); bỏ `Schedule` (chỉ có ở R-041, bị xóa). `schema.json` đã có `CI/Infra`, không cần sửa. (theo P9 của DECISIONS.md)

### BLK-065 · SCHEMA · Review Trigger chứa tín hiệu không cho thấy assumption sai
- ID tạm: A-L04 (`work/assess-assumptions.md`)
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
- Quyết định: Vế của Review Trigger không cho thấy assumption sai chuyển sang `Ghi chú` dạng "Xem lại phạm vi khi …" ở A-007, A-008, A-010, A-011, A-012, A-014, A-015, A-016. `Signpost` chỉ giữ vế cho thấy assumption sai. (theo P9 của DECISIONS.md)

### BLK-066 · SCHEMA · Từ cấm có điều kiện trong ngoặc ở cột Không dùng
- ID tạm: GL-L02 (`work/assess-glossary.md`)
- Item: GL-005, GL-013, GL-016, GL-017, GL-019, GL-021, GL-024 (GL-025 cũng có nhưng bị xóa)
- Tiêu chí: quy ước `glossary.md` ("cột Không dùng liệt kê các từ đồng nghĩa bị loại, cách nhau bằng dấu phẩy"), GX-07 (Lint)
- Hiện trạng: "reference (khi nói về deck hoặc slide mẫu)", "session (khi nói về đăng nhập)", "preview (trong câu văn)", "export (trong câu văn)", "template (khi nói về giao diện)", "validation (trong câu văn)", "agent (khi nói về phần AI bên trong DeckAgent)".
- Điều chưa biết hoặc cần chọn: định dạng hiện tại chỉ cho danh sách từ, Lint so chữ nên không xét được điều kiện. Bỏ điều kiện thì lệnh cấm thành tuyệt đối (đổi nghĩa: ví dụ "template PPTX" ở UC-017, nhãn nút "Export"/"Preview", tên sản phẩm "PowerPoint Agent"); bỏ cả từ thì mất thông tin.
- Phương án:
  - A. Giữ điều kiện trong ngoặc ngay sau từ, như sheet. Sửa quy ước đọc bảng của `glossary.md`: "Từ có thể kèm điều kiện trong ngoặc; Lint so phần trước ngoặc và hiện điều kiện trong cảnh báo để người review quyết định". GX-07 là Lint nên báo sai được chấp nhận.
  - B. Bỏ các từ có điều kiện khỏi cột Không dùng, chuyển điều kiện vào Định nghĩa dạng "Từ “preview” không dùng trong câu văn". Lint không bắt được các từ này nữa.
  - C. Bỏ điều kiện, cấm tuyệt đối. Đổi nghĩa; kéo theo viết lại UC-017 (template PPTX), UC-001, UC-004 (tên sản phẩm có "Agent").
- Đề xuất: A, vì giữ nguyên nghĩa, Lint vẫn bắt được từ, và chỉ phải sửa một dòng quy ước trong chính `glossary.md`.
- Quyết định: Giữ điều kiện trong ngoặc ngay sau từ cấm. Quy ước đọc bảng của `glossary.md` thêm: Lint so phần trước ngoặc và hiện điều kiện trong cảnh báo để người review quyết định. Đã làm ở B1. (theo P9 của DECISIONS.md)

### BLK-067 · SCHEMA · Điều kiện ở cuối danh sách áp cho từ nào
- ID tạm: GL-L03 (`work/assess-glossary.md`)
- Item: GL-019, GL-021, GL-024
- Tiêu chí: quy ước `glossary.md`, GX-07
- Hiện trạng: "style, template (khi nói về giao diện)"; "validate, validation (trong câu văn)"; "LLM, agent (khi nói về phần AI bên trong DeckAgent)".
- Điều chưa biết hoặc cần chọn: điều kiện trong ngoặc chỉ áp cho từ đứng ngay trước, hay cho cả danh sách của dòng. Hai cách hiểu cho kết quả Lint khác nhau (ví dụ "style" ở UC-007 bị cấm tuyệt đối hay chỉ khi nói về giao diện).
- Phương án:
  - A. Điều kiện áp cho cả dòng. Viết lại: "style (khi nói về giao diện), template (khi nói về giao diện)"; "validate (trong câu văn), validation (trong câu văn)"; "LLM (khi nói về phần AI bên trong DeckAgent), agent (khi nói về phần AI bên trong DeckAgent)".
  - B. Điều kiện chỉ áp cho từ cuối; từ trước bị cấm tuyệt đối. Giữ nguyên chữ.
  - C. Chọn riêng từng dòng (ví dụ "LLM" và "validate" cấm tuyệt đối vì không có nghĩa khác trong sản phẩm; "style" theo điều kiện).
- Đề xuất: C, theo gợi ý: `style` có điều kiện (cùng nhóm nghĩa với template), `validate` có điều kiện (cùng gốc với validation), `LLM` cấm tuyệt đối (trong DeckAgent luôn chỉ phần AI). Đây là chọn cách hiểu nên cần người dùng duyệt. Chỉ cần quyết khi BLK-066 chọn A.
- Quyết định: Chọn riêng từng dòng: `style` có điều kiện "(khi nói về giao diện)" như `template`; `validate` có điều kiện "(trong câu văn)" như `validation`; `LLM` cấm tuyệt đối. Ghi điều kiện ngay sau từng từ khi viết `glossary.md` ở B5. (theo P9 của DECISIONS.md)

### BLK-068 · SCHEMA · "Hệ thống" và "DeckAgent" là hai tên của một khái niệm
- ID tạm: GL-L04 (`work/assess-glossary.md`)
- Item: GL-023; ảnh hưởng mọi Requirement (mẫu câu GR-01) và 56 item đang dùng "Hệ thống"
- Tiêu chí: GX-07 ("một khái niệm có nhiều tên"), GR-01 (tên hệ thống lấy từ `schema.json`)
- Hiện trạng: GL-023 "Dùng “Hệ thống”" với định nghĩa "DeckAgent nói chung, gồm giao diện và xử lý phía sau". `schema.json` có `"system_name": "DeckAgent"`, và brief đã chốt câu Yêu cầu của Requirement viết "DeckAgent phải …". "DeckAgent" xuất hiện 102 lần trong item, "Hệ thống" ở 56 item.
- Điều chưa biết hoặc cần chọn: hai tên có được cùng tồn tại không, và nếu có thì phân vai thế nào.
- Phương án:
  - A. Giữ GL-023. Coi "DeckAgent" là tên riêng, không phải từ đồng nghĩa bị loại: câu Yêu cầu dùng `DeckAgent` theo `schema.json`; section khác dùng "Hệ thống". Định nghĩa GL-023 giữ nguyên (đã nêu DeckAgent là đối tượng được gọi).
  - B. Đổi `system_name` thành "Hệ thống" để mọi nơi dùng một tên. Câu Yêu cầu thành "Hệ thống phải …"; kéo theo sửa `schema.json`.
  - C. Đổi thuật ngữ GL-023 thành "DeckAgent", đưa "Hệ thống" vào Không dùng. Kéo theo viết lại 56 item.
- Đề xuất: A, vì không phải sửa item hay schema; tên riêng của sản phẩm khác bản chất với từ đồng nghĩa trong cột Không dùng.
- Quyết định: Giữ thuật ngữ "Hệ thống". "DeckAgent" là tên riêng, dùng trong câu Yêu cầu của Requirement theo `system_name` của `schema.json`; các section khác dùng "Hệ thống". (theo P9 của DECISIONS.md)

### BLK-069 · SCHEMA · Từ cấm nằm trong tên riêng hoặc tên tính năng của sản phẩm khác
- ID tạm: GL-L05 (`work/assess-glossary.md`)
- Item: D-017, A-015, R-009 (tên nguyên tắc chất lượng); UC-001, UC-004, UC-007, UC-017 (Product Reference, Open Questions). Liên quan GL-001, GL-003, GL-007, GL-019, GL-020, GL-024
- Tiêu chí: GX-07
- Hiện trạng: "P1 Source Fidelity, P2 User Intent Fidelity, P3 Presentation Quality" (D-017.Decision, A-015.Ghi chú, R-009.Ghi chú); "PowerPoint Agent", "Gamma Agent" (UC-001, UC-004 Product Reference); "dùng template hoặc deck mẫu làm nguồn style, layout" (UC-007 Product Reference, mô tả Copilot); "Brand Kit", "template riêng" (UC-017 Product Reference); "Có nhận template PPTX làm bộ nhận diện không?" (UC-017 Open Questions).
- Điều chưa biết hoặc cần chọn: tên riêng (nguyên tắc P1–P5, tên sản phẩm, tên tính năng của đối thủ) có được miễn GX-07 không. Đổi tên P1–P5 là đổi tên khái niệm đang được trích ở nhiều item, không phải chỉ viết lại câu.
- Phương án:
  - A. Miễn GX-07 cho tên riêng và trích dẫn tên tính năng sản phẩm khác: viết trong backtick hoặc ngoặc kép, Lint bỏ qua; người review xác nhận. Không đổi tên P1–P5.
  - B. Việt hóa tên nguyên tắc (ví dụ "P1 Trung thực với tài liệu có sẵn") và mô tả tính năng đối thủ bằng thuật ngữ glossary. Cần người dùng đặt tên mới.
  - C. Giữ nguyên chữ, không miễn; người review bỏ qua cảnh báo từng lần với lý do.
- Đề xuất: A, vì giữ tên gốc để tra cứu được, không cần đặt tên mới. "template PPTX" ở UC-017 Open Questions là file mẫu PPTX, không phải giao diện; chỉ cần quyết theo BLK-066/BLK-067.
- Quyết định: Tên riêng (P1–P5, tên sản phẩm và tính năng của bên khác) viết trong backtick hoặc ngoặc kép, được miễn GX-07. Không đổi tên P1–P5. Quy ước đọc bảng của `glossary.md` đã thêm ở B1. (theo P9 của DECISIONS.md)
