# Đánh giá: use-cases

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| UC-001 | BLOCKER | Tiêu đề thêm chủ ngữ "Người dùng", "không có file" → "không kèm tài liệu có sẵn" (GUC-01, GX-07). Tình huống theo mẫu "Tôi có…, tôi muốn…, để…", bỏ "ngay" (GUC-04, GX-08). Tách 4B "AI lỗi hoặc quá thời gian" thành hai nhánh theo điều kiện phát hiện được (GUC-11). Nhánh theo dạng chuẩn: thêm chủ ngữ cho 1A, bỏ "sau đó", "kết thúc UC" → "kết thúc Use Case" (GUC-10, GX-16). Thêm tham chiếu BR-010 (Postconditions 1), BR-014 (4A, 4B), R-033 (5A) (GUC-15, GX-10). `level: user-goal`, `supporting_actors: [ACT-002]` | UC-L01, UC-L02, UC-L13 |
| UC-002 | BLOCKER | Tiêu đề bỏ danh sách loại file vì GL-003 đã định nghĩa "tài liệu có sẵn" (GUC-01). Tình huống theo mẫu, bỏ "nó" (GUC-04, GX-17). Bước 3 bỏ "nó", tham chiếu BR-008 (GX-17, GUC-15). 1A tham chiếu BR-009; bước 6 và Postconditions 2–3 tham chiếu BR-002 thay cho "P1" (GUC-15, GX-10). Tách 5C (GUC-11). Bỏ "sau đó" trước "quay lại bước" (GUC-10). Câu hỏi mở 2 bỏ "(W-032)", nơi xử lý đổi sang R-007 (GUC-18, mục 5). Ghi chú 2 tham chiếu BR-009; Ghi chú 3 bỏ "(L-001)" (mục 5) | UC-L01, UC-L02, UC-L04, UC-L05, UC-L06, UC-L13 |
| UC-003 | BLOCKER | Tiêu đề thêm chủ ngữ, dùng "deck có sẵn" (GL-004) (GUC-01, GX-07). Tình huống theo mẫu, vế "để" lấy từ Mục tiêu (GUC-04). Ghi chú 1 tham chiếu BR-009 (GUC-15). Câu hỏi mở gán nơi xử lý R-005 (mục 6, ghi chú 5). Nhánh 4A thiếu điểm kết thúc: chưa bắt buộc ở Proposed (GUC-10 áp từ Active), ghi ở mục 6 | UC-L04 |
| UC-004 | BLOCKER | Tiêu đề: "(độ dài, giọng văn, thứ tự, nội dung)" là danh sách thiếu 3 trong 7 loại sửa → dùng thuật ngữ "sửa cả deck" (GL-014) (GUC-01, GX-07, GX-08). Tình huống theo mẫu (GUC-04). Đánh số lại bước "2'" thành bước 3 và dời số các bước sau (GUC-08, CI đánh số). Bước 3 (cũ) bỏ "(nếu có)" (GUC-08). Tách 2A và 2B thành từng dòng một điểm kết thúc (GUC-10). Tách 3B (GUC-11). 2C tham chiếu BR-013 (GUC-15). Bỏ "nó" (GX-17). Phần quy tắc ranh giới commit và rollback, điểm kết thúc của Main Flow, câu hỏi A-013: chờ blocker | UC-L01, UC-L02, UC-L07, UC-L08, UC-L09 |
| UC-005 | BLOCKER | Closed: chỉ chuyển vào template, không sửa nội dung, kể cả tiêu đề (GX-15). `related: [UC-008]` giữ ở UC-005 (GX-05, mục 6 ghi chú 3). Không cần `Bảo đảm tối thiểu` (section bắt buộc từ Active) | G-08, G-09 |
| UC-007 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). 2B tham chiếu BR-013 (GUC-15). Bỏ "sau đó" (GUC-10). Câu hỏi mở gán nơi xử lý R-010 (mục 6). Giải thích `related: [UC-017]` đã có ở Ghi chú 1 | UC-L14 |
| UC-008 | BLOCKER | Xem dịch thử ở mục 4. Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). Mục tiêu bỏ "dùng được" (GX-08). Bước 7 có "Nếu" → nhánh 6A (GUC-08). 1A đổi sang điều kiện phát hiện được (GUC-11). Tách 3A và 4A theo từng điều kiện và điểm kết thúc (GUC-10, GUC-11). Bước 4 tham chiếu BR-006; Postconditions 3 "P5" → BR-007 (GUC-15, GX-10). Postconditions 2 tách: vế thành công giữ lại, vế "chỉ khi tải về thành công" chuyển sang Bảo đảm tối thiểu. Postconditions 5 chuyển sang Ghi chú, tham chiếu BR-012 (GUC-13). `related` UC-005 ghi ở UC-005 (mục 6) | UC-L03, UC-L10, UC-L11, G-09 |
| UC-009 | VIẾT-LẠI | Draft: chỉ áp gate cấu trúc. Tiêu đề thêm chủ ngữ: "Người dùng đăng nhập vào tài khoản DeckAgent" (GUC-01). `source` giữ mã "Benchmark 27/09/2026" mà relations.json không ghi (GX-11, mục 6). `related: [UC-020]` giữ ở UC-009 | — |
| UC-010 | VIẾT-LẠI | Draft. Tiêu đề: "Người dùng đăng xuất, hoặc bị đăng xuất khi phiên đăng nhập hết hạn" (GUC-01, GX-07: dùng đúng thuật ngữ "phiên đăng nhập"). Ghi chú 2 bỏ "(GL-012, GL-013)", giữ tên hai thuật ngữ (mục 5). `related: [UC-014]` giữ ở UC-010 | — |
| UC-011 | BLOCKER | Tiêu đề thêm chủ ngữ, giữ điểm phân biệt "deck chưa tải về bị mất" (GUC-01). Tình huống theo mẫu (GUC-04). 2A ghi điểm kết thúc "tiếp tục bước 5" thay cho "bỏ qua bước 3 và 4" (GUC-10). 1A tham chiếu BR-014; bước 3 và Postconditions 2 tham chiếu BR-012 (GUC-15). Bỏ "sau đó" (GUC-10). Câu hỏi mở giữ, nơi xử lý R-042 (GUC-18). Giải thích "(dừng lượt xử lý AI đang chạy)" của `related: [UC-014]` chuyển vào Ghi chú. Nhánh 1B: chờ blocker | UC-L12 |
| UC-012 | VIẾT-LẠI | Tiêu đề thêm chủ ngữ, "deck đã làm trước đó" → "deck đã lưu" (GUC-01, khớp R-049). Tình huống theo mẫu, bỏ "nó" (GUC-04, GX-17). Bỏ Precondition 2 "Deck gốc còn tồn tại" vì nhánh 1A kiểm lại (GUC-07). Câu hỏi mở gán nơi xử lý R-049 (mục 6). Bước 2 còn "nếu có": phải sửa trước khi lên Active (GUC-08) | — |
| UC-013 | VIẾT-LẠI | Tiêu đề: "Người dùng bỏ bản chờ duyệt để quay về bản đã chấp nhận trước lần sửa" (GUC-01, GX-07). Tình huống theo mẫu, bỏ "ngay" (GUC-04, GX-08). Bỏ Precondition 1 "Có bản chờ duyệt" vì nhánh 1A kiểm lại (GUC-07, đúng ví dụ trong `_CRITERIA.md`). Bỏ Postconditions 3 "Người dùng gửi được yêu cầu sửa khác" vì là "có thể làm gì tiếp" (GUC-13). "kết thúc UC" → "kết thúc Use Case" (GUC-10) | — |
| UC-014 | BLOCKER | Tiêu đề: "Người dùng theo dõi tiến độ lượt xử lý và dừng lượt xử lý AI giữa chừng" (GUC-01, GX-07). Tình huống theo mẫu, bỏ "nó", "ngay" (GUC-04, GX-17, GX-08). Mục tiêu: "dừng được khi cần" → "dừng được lượt xử lý AI trước khi lượt đó xong" (lấy từ R-046) (GX-08). Tách 2B (GUC-11). 2A tham chiếu BR-014 (GUC-15). "kết thúc UC" → "kết thúc Use Case". `level: subfunction` (được include bởi 7 Use Case) | UC-L01, UC-L02, UC-L03, G-04 |
| UC-015 | VIẾT-LẠI | Tiêu đề: "Người dùng xem trước deck trong DeckAgent trước khi giữ, sửa hoặc tải về" (GUC-01, bỏ "ngay" theo GX-08). Tình huống theo mẫu (GUC-04). 1A: "Không hiển thị được deck" → "Hệ thống không dựng được bản xem trước của deck" (GUC-11). "kết thúc UC" → "kết thúc Use Case". Bỏ Ghi chú 1 vì lặp Mục tiêu (GX-12). `related` chỉ giữ UC-019; bỏ UC-004, UC-008, UC-013 vì đã có `include` từ phía kia (GX-05, mục 6). `level: subfunction` | — |
| UC-016 | VIẾT-LẠI | Draft. Tiêu đề thêm chủ ngữ (GUC-01), "dàn ý" đã đúng GL-018. `source` giữ "Benchmark 27/09/2026" (GX-11) | — |
| UC-017 | BLOCKER | Tiêu đề bỏ "(màu, font, logo)" vì GL-020 đã định nghĩa "bộ nhận diện" (GUC-01). Tình huống theo mẫu (GUC-04). Mục tiêu đang lặp Postconditions 1 → viết theo kết quả người dùng nhận, lấy từ Tình huống: "chọn một lần cho cả deck" (GUC-05). Postconditions 1 tham chiếu BR-017 (GUC-15). Câu hỏi mở 2 "template PPTX" → "file PPTX của tổ chức" (GX-07, GL-019). Câu hỏi mở gán nơi xử lý R-047 (mục 6). Ghi chú 1 bỏ "đang được theo dõi ở L-002" (mục 5). `related` UC-007 ghi ở UC-007 | UC-L15 |
| UC-018 | BLOCKER | Draft. Tiêu đề thêm chủ ngữ (GUC-01). `source` giữ "Benchmark 27/09/2026" (GX-11) | G-10 |
| UC-019 | VIẾT-LẠI | Draft. Tiêu đề thêm chủ ngữ (GUC-01). `source` giữ "Benchmark 27/09/2026" (GX-11). Ghi chú cho lần lên Proposed ở mục 6 (hai mục tiêu, "người xem" chưa phải actor) | — |
| UC-020 | CẤU-TRÚC | Draft, tiêu đề đã có chủ ngữ. Chỉ chuyển vào template. `related` UC-009 ghi ở UC-009 (GX-05, mục 6). Xem dịch thử ở mục 4 | — |
| UC-021 | VIẾT-LẠI | Tiêu đề: "Người dùng mở lại deck đã lưu từ lần làm việc trước" (GUC-01, GX-07 "lần làm việc"). Tình huống theo mẫu (GUC-04). Bỏ "sau đó" (GUC-10). Câu hỏi mở gán nơi xử lý R-048 (mục 6) | — |
| UC-022 | VIẾT-LẠI | Tiêu đề bỏ "bất kỳ", thêm chủ ngữ: "Người dùng xem lịch sử các bản đã chấp nhận và khôi phục một bản" (GUC-01, GX-08). Tình huống theo mẫu (GUC-04). Mục tiêu bỏ "bất kỳ", "ngay": "một bản đã chấp nhận trong lịch sử, không chỉ bản trước lần sửa gần nhất" (GX-08). 4A tham chiếu BR-005 (GUC-15). Câu hỏi mở gán nơi xử lý R-016 (mục 6) | — |
| UC-023 | VIẾT-LẠI | Tiêu đề dùng thuật ngữ "sửa cục bộ" (GL-015): "Người dùng yêu cầu AI sửa cục bộ một slide hoặc một thành phần" (GUC-01, GX-07). Tình huống theo mẫu (GUC-04). Postconditions 1 và 3A tham chiếu BR-004; 3B tham chiếu BR-005 (GUC-15). Ghi chú 2 bỏ "(L-002)" (mục 5) | — |
| UC-024 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). 2A tham chiếu BR-005 (GUC-15). Câu hỏi mở bỏ "(L-001)", nơi xử lý R-017 (mục 5, mục 6). Ghi chú 1 nhắc ID đã nghỉ UC-006: giữ (mục 6) | UC-L15 |
| UC-025 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). Câu hỏi mở gán nơi xử lý R-044 (R-044 Acceptance 2 đã ghi điều này được chốt khi đưa vào phạm vi) (mục 6) | UC-L15 |

## 2. Blocker cục bộ

### UC-L01 · TRANG_THAI · Nhánh cho Hành vi lỗi của ACT-002
- Item: UC-001, UC-002, UC-004, UC-014 (Active, có `supporting_actors: [ACT-002]`). Cùng thiếu nhưng chưa chặn vì GUC-12 áp từ Active: UC-003, UC-017, UC-023, UC-024, UC-025 (Proposed), UC-016 (Draft)
- Tiêu chí: GUC-12, GUC-11
- Hiện trạng: `Hành vi lỗi` dự kiến của ACT-002 (assess-actors, dịch thử ACT-002) có 4 mục: "1. Không trả kết quả trong ngưỡng quá thời gian (R-032). 2. Trả lỗi thay vì kết quả. 3. Trả kết quả sai định dạng. 4. Thay đổi hành vi giữa các phiên bản model." Các Use Case chỉ có nhánh "AI lỗi hoặc quá thời gian" (UC-001 4B, UC-002 5C, UC-004 3B, UC-014 2B) và "Kết quả không qua kiểm tra" (UC-001 5A, UC-002 6A, UC-004 4A). Không Use Case nào nhắc mục 3 và mục 4.
- Điều chưa biết hoặc cần chọn: (a) mục 3 "sai định dạng" có được coi là một trường hợp của nhánh "kết quả không qua kiểm tra" (R-033) không; (b) mục 4 "thay đổi hành vi giữa các phiên bản model" có cần nhánh không, hay ghi lý do bỏ qua trong Ghi chú. Ghi lý do bỏ qua là thêm thông tin, nên không tự viết.
- Phương án:
  - A. Mục 1 và 2 tách thành hai nhánh riêng (đã có trong kế hoạch). Mục 3 ghi vào điều kiện của nhánh kiểm tra kết quả: "Kết quả của ACT-002 sai định dạng hoặc không qua kiểm tra kết quả (R-033)". Mục 4 bỏ qua, Ghi chú của từng Use Case ghi lý do: "Thay đổi hành vi giữa các phiên bản model không phát hiện được trong một lượt xử lý; kết quả sai vẫn bị chặn ở bước kiểm tra kết quả."
  - B. Mỗi mục trong `Hành vi lỗi` có một nhánh riêng ở từng Use Case, kể cả mục 4 (cần nêu hệ thống phát hiện mục 4 bằng cách nào).
  - C. Hạ 4 Use Case xuống Proposed tới khi chốt.
- Đề xuất: A, vì mục 3 đã bị chặn đúng tại bước kiểm tra kết quả hiện có, và mục 4 không phải điều kiện hệ thống phát hiện được trong một lượt (GUC-11). Nên chốt cùng blocker về `Hành vi lỗi` của ACT-002 bên actors.
- Quyết định:

### UC-L02 · SO_LIEU · Ngưỡng quá thời gian của lượt xử lý AI
- Item: UC-001 (4B), UC-002 (5C), UC-004 (3B), UC-014 (2B, Câu hỏi mở 2). Liên quan R-032, G-04 (D-011), ACT-L04
- Tiêu chí: GUC-11, GX-09, GUC-18
- Hiện trạng: Nhánh ghi "AI lỗi hoặc quá thời gian". UC-014 Câu hỏi mở 2: "Ngưỡng quá thời gian là bao nhiêu? (đặt sau benchmark, D-011)". R-032 Ghi chú: "Ngưỡng quá thời gian và số lần thử lại chưa được chốt (D-011)".
- Điều chưa biết hoặc cần chọn: con số ngưỡng; item nào sở hữu con số; UC-014 Active có được giữ câu hỏi này không.
- Phương án:
  - A. R-032 sở hữu con số. Nhánh của Use Case ghi "ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032". Câu hỏi mở 2 của UC-014 bỏ khỏi Use Case, chuyển về R-032. Use Case giữ Active; việc chưa có con số là GX-09 của R-032.
  - B. Chốt con số ngay, ghi vào R-032, Use Case tham chiếu như A.
  - C. Hạ UC-014 (và các Use Case gọi nó) xuống Proposed tới khi có benchmark.
- Đề xuất: A, vì con số là chất lượng hệ thống nên thuộc Requirement (`_CRITERIA.md` mục 1), và một ngưỡng dùng chung cho 4 Use Case phải có một nơi sở hữu (GX-10). Gộp với ACT-L04, blocker ngưỡng của R-032 và G-04.
- Quyết định:

### UC-L03 · TRANG_THAI · Lượt tạo file tải về có dừng được không
- Item: UC-014 (Câu hỏi mở 1), UC-008
- Tiêu chí: GX-09, GUC-12 ("bước có thể bị hủy giữa chừng phải có nhánh"), GUC-18
- Hiện trạng: UC-014 Trigger gồm cả "bắt đầu tạo file tải về", nhưng nhánh 2A chỉ cho dừng "lượt xử lý AI tạo hoặc sửa deck". Câu hỏi mở 1: "Lượt tạo file tải về có cần dừng được không?", không có nơi xử lý. D-029: "V1 cho người dùng dừng lượt xử lý AI tạo hoặc sửa deck đang chạy"; Reopen When: "khi lượt tải về cũng cần dừng được".
- Điều chưa biết hoặc cần chọn: V1 có cho dừng lượt tạo file tải về không. Câu trả lời quyết định UC-008 và UC-014 có thêm nhánh hay không.
- Phương án:
  - A. V1 không cho dừng lượt tạo file tải về, theo phạm vi của D-029. Câu hỏi mở 1 bỏ; Ghi chú của UC-014 và UC-008 ghi "V1 không dừng được lượt tạo file tải về (D-029)".
  - B. Cho dừng: thêm nhánh ở UC-008 (sau bước 4) và UC-014, kèm Requirement mới hoặc mở rộng R-046.
  - C. Giữ câu hỏi, hạ UC-014 xuống Proposed.
- Đề xuất: A, vì D-029 đã giới hạn rõ phạm vi dừng ở lượt xử lý AI và ghi sẵn điều kiện mở lại cho lượt tải về.
- Quyết định:

### UC-L04 · SO_LIEU · Giới hạn kích thước và số trang của file tải lên
- Item: UC-002 (2B, Câu hỏi mở 1), UC-003 (1A)
- Tiêu chí: GUC-11, GX-09 (UC-002 Active), GX-08
- Hiện trạng: UC-002 2B "File vượt giới hạn kích thước: Hệ thống báo giới hạn…"; Câu hỏi mở 1 "Giới hạn kích thước và số trang của tài liệu là bao nhiêu?" (không có nơi xử lý). UC-003 1A cùng điều kiện cho deck có sẵn. Không item nào trong sheet có con số này (đã tìm trong requirements, decisions, constraints, assumptions).
- Điều chưa biết hoặc cần chọn: giới hạn kích thước (MB) và số trang; item nào sở hữu con số.
- Phương án:
  - A. Người dùng cung cấp con số, ghi vào một Requirement (R-003 hoặc Requirement mới); nhánh 2B ghi "File vượt giới hạn kích thước hoặc số trang của R-xxx". UC-003 dùng cùng Requirement hoặc con số riêng khi quay lại phạm vi.
  - B. Chưa có con số: giữ câu hỏi với nơi xử lý là R-003, hạ UC-002 xuống Proposed.
  - C. Bỏ nhánh 2B (không giới hạn kích thước ở V1): đổi hành vi, cần người dùng xác nhận.
- Đề xuất: A, vì nhánh 2B không tạo lại được trong test khi chưa có con số (GUC-11). Gộp với blocker cùng chủ đề bên requirements nếu có.
- Quyết định:

### UC-L05 · TRANG_THAI · PDF không có text layer rơi vào nhánh nào
- Item: UC-002
- Tiêu chí: GUC-11, GX-09
- Hiện trạng: "2A. File là ảnh, Excel/CSV, link web hoặc PDF scan: Hệ thống báo chưa nhận loại file này và liệt kê 5 loại đang nhận, sau đó quay lại bước 1." và "3A. Không đọc được file (file hỏng, PDF không có text layer): Hệ thống báo lỗi kèm cách xử lý, sau đó quay lại bước 1." PDF scan chính là PDF không có text layer, nên cùng một điều kiện có hai cách xử lý. R-003 Acceptance 2: "Loại file chưa nhận được bị từ chối kèm thông báo liệt kê 5 loại đang nhận."
- Điều chưa biết hoặc cần chọn: PDF không có text layer được báo là "loại chưa nhận" (2A) hay "không đọc được file" (3A).
- Phương án:
  - A. Bỏ "PDF scan" khỏi 2A. 3A giữ "PDF không có text layer".
  - B. Bỏ "PDF không có text layer" khỏi 3A. 2A giữ "PDF scan", dù bước 2 chỉ kiểm loại file nên không phát hiện được PDF scan ở đó.
  - C. Tách nhánh mới tại bước 3: "3B. File PDF không có text layer: Hệ thống báo chưa nhận PDF không có text layer và liệt kê 5 loại tài liệu đang nhận (R-003), quay lại bước 1." Bỏ "PDF scan" khỏi 2A và bỏ "PDF không có text layer" khỏi 3A.
- Đề xuất: C, vì hệ thống chỉ phát hiện được PDF không có text layer khi đọc file (bước 3), còn thông báo theo R-003 là liệt kê 5 loại đang nhận.
- Quyết định:

### UC-L06 · TRANG_THAI · Nhánh 5A: hỏi lại hay đánh dấu nội dung AI bổ sung
- Item: UC-002 (5A). Liên quan R-008, BR-002
- Tiêu chí: GUC-11, GX-09
- Hiện trạng: "5A. Tài liệu không có thông tin cho một nội dung người dùng yêu cầu: AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung, rồi tiếp tục bước 5." R-008: "phải hỏi lại người dùng hoặc đánh dấu nội dung do AI bổ sung…"; R-008 Ghi chú: "Cách hiển thị phần AI bổ sung chưa được chốt."
- Điều chưa biết hoặc cần chọn: khi nào hỏi, khi nào đánh dấu. Test không biết phải chờ hành vi nào.
- Phương án:
  - A. Chốt một hành vi mặc định (ví dụ luôn đánh dấu và tiếp tục), hành vi kia thành nhánh có điều kiện riêng do người dùng nêu.
  - B. Tách hai nhánh 5A, 5B với điều kiện phân biệt (cần người dùng nêu điều kiện).
  - C. Giữ "hoặc" như hai hành vi đều chấp nhận được. Test kiểm assertion chung: nội dung không có trong tài liệu không được trình bày như lấy từ tài liệu (BR-002, Postconditions 3). Viết lại thành "…: AI hỏi người dùng hoặc đánh dấu nội dung đó là do AI bổ sung (R-008), tiếp tục bước 5."
- Đề xuất: C, vì R-008 và BR-002 Active đều cho phép cả hai, và assertion cuối vẫn kiểm được. Gộp với blocker của R-008 bên requirements nếu có.
- Quyết định:

### UC-L07 · TRUNG_SO_HUU · Quy tắc ranh giới commit và rollback viết lại trong UC-004
- Item: UC-004 và BR-010. Cùng nội dung còn ở R-024 (Acceptance 2–4), R-031 (Acceptance 2), R-046 (Acceptance 2), D-030
- Tiêu chí: GX-10, GUC-15
- Hiện trạng: UC-004 viết lại quy tắc của BR-010 điều 3b, 4, 5 tại bước "2'" ("Nếu yêu cầu không bị từ chối ở 2C và không còn bước hỏi lại… hệ thống đạt ranh giới commit. Nếu đang có bản chờ duyệt, hệ thống chấp nhận bản đó…"), nhánh 1A (chỉ là phát biểu lại BR-010 điều 4, không có điều kiện rẽ nhánh riêng), các nhánh 3A, 3B, 4A ("deck quay về bản đã chấp nhận tại bước 2' nếu bước đó đã xảy ra… tập ràng buộc quay về baseline của bản đó") và Postconditions 1–2.
- Điều chưa biết hoặc cần chọn: item nào sở hữu quy tắc; UC-004 được bỏ nhánh 1A và thay đoạn quy tắc bằng tham chiếu không.
- Phương án:
  - A. BR-010 sở hữu. UC-004: bước 3 mới "Hệ thống đạt ranh giới commit và áp dụng ràng buộc của yêu cầu mới (BR-010 điều 4–5)."; bỏ nhánh 1A; 3A, 3B, 4A ghi "deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit (BR-010 điều 5)"; Postconditions 1–2 thành tham chiếu BR-010. R-024, R-031, R-046 cũng tóm tắt kèm BR-010 (việc của requirements).
  - B. UC-004 sở hữu, BR-010 rút điều 3b, 4, 5 về tham chiếu UC-004. Trái GUC-15 vì quy tắc bản đã chấp nhận áp cho 6 Use Case.
  - C. Giữ nguyên ở cả hai nơi (vi phạm GX-10).
- Đề xuất: A, vì BR-010 đã áp lên UC-001, UC-002, UC-004, UC-008, UC-013, UC-022 (GUC-15). Gộp với blocker cùng nội dung bên business-rules (BR-010) và requirements (R-024, R-031, R-046).
- Quyết định:

### UC-L08 · TRANG_THAI · UC-004 kết thúc thành công ở đâu
- Item: UC-004
- Tiêu chí: GUC-13, GUC-08, GX-09
- Hiện trạng: Mục tiêu: "Người dùng có deck đã sửa theo yêu cầu, và vẫn quay lại được bản trước nếu không vừa ý." Bước 6: "Người dùng xem trước (UC-015), sau đó giữ hoặc bỏ bản chờ duyệt." 6A: bỏ → UC-013. Postconditions 1 điều kiện hóa ("Nếu bản chờ duyệt được người dùng giữ hoặc được chấp nhận tại ranh giới commit để bắt đầu một lượt sửa tiếp…"). Postconditions 3: "Khi kết quả sửa mới trở thành bản chờ duyệt, bản đã chấp nhận làm cơ sở… vẫn quay lại được một bước." Postconditions 3 chỉ đúng khi bản chờ duyệt chưa được giữ, nên mâu thuẫn với Main Flow kết thúc ở "giữ".
- Điều chưa biết hoặc cần chọn: Main Flow kết thúc khi bản chờ duyệt được hiển thị, hay khi người dùng giữ bản đó.
- Phương án:
  - A. Kết thúc khi người dùng xem trước bản chờ duyệt: bước cuối "Người dùng xem trước bản chờ duyệt (UC-015)." Giữ và bỏ là hành động sau (bỏ: UC-013 `extend`; giữ: BR-010 điều 3a). Postconditions: bản chờ duyệt được hiển thị; bản đã chấp nhận làm cơ sở vẫn quay lại được (giữ Postconditions 3). Postconditions 1 chuyển thành tham chiếu BR-010.
  - B. Kết thúc khi người dùng giữ: bước cuối "Người dùng xem trước bản chờ duyệt (UC-015) và giữ bản đó." Postconditions 1: "Bản chờ duyệt người dùng giữ trở thành bản đã chấp nhận mới (BR-010 điều 3a)." Bỏ Postconditions 3.
- Đề xuất: A, vì khớp Mục tiêu ("vẫn quay lại được bản trước") và cách UC-013 `extend` UC-004 tại điểm bỏ bản chờ duyệt.
- Quyết định:

### UC-L09 · TRANG_THAI · Câu hỏi mở về thời hạn ràng buộc ở UC-004 Active
- Item: UC-004. Liên quan BR-003, A-013, R-024
- Tiêu chí: GX-09, GUC-18
- Hiện trạng: Câu hỏi mở: "Ràng buộc của người dùng hết hiệu lực khi nào, và xử lý thế nào khi hai ràng buộc mâu thuẫn? (A-013)". Bước 3 (cũ): "AI sửa cả deck, giữ các ràng buộc của người dùng còn hiệu lực". BR-003 Exceptions: "cách phân biệt sẽ được định nghĩa sau". R-024 Ghi chú: "còn mở (A-013), không chặn W-028". A-013 Ghi chú: "cố ý để mở vì chưa chặn Architecture".
- Điều chưa biết hoặc cần chọn: câu hỏi này có ảnh hưởng hành vi bắt buộc của UC-004 không. Nếu có thì UC-004 không đạt GX-09.
- Phương án:
  - A. Giữ Active. Bước 3 tham chiếu BR-003 cho "ràng buộc còn hiệu lực"; câu hỏi giữ trong `Câu hỏi mở`, nơi xử lý A-013. Phần chưa chốt thuộc GX-09 của BR-003.
  - B. Hạ UC-004 xuống Proposed tới khi A-013 có kết quả.
- Đề xuất: A, vì người dùng đã cố ý để mở câu hỏi này (A-013, R-024), và UC-004 chỉ dùng khái niệm "ràng buộc còn hiệu lực" do BR-003 sở hữu. Gộp với blocker GX-09 của BR-003 bên business-rules nếu có.
- Quyết định:

### UC-L10 · TRANG_THAI · Ứng dụng kiểm chứng file PPTX
- Item: UC-008 (bước 5, Postconditions 4, Câu hỏi mở 1). Liên quan R-027, D-026
- Tiêu chí: GX-09, GUC-13, GUC-18
- Hiện trạng: Bước 5 "Hệ thống kiểm tra file mở được." Postconditions 4 "Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint." Câu hỏi mở 1 "Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice?", không có nơi xử lý. R-027 Acceptance 2 "Cam kết tương thích với từng ứng dụng cụ thể chưa được chốt trước implementation." D-026 điều 3: mức tương thích PPTX "không chốt trước Architecture".
- Điều chưa biết hoặc cần chọn: "mở được" và "sửa được" kiểm trên ứng dụng nào. Postconditions 4 đã ghi PowerPoint, trong khi câu hỏi mở và R-027 chưa chốt.
- Phương án:
  - A. Chốt PowerPoint là ứng dụng kiểm chứng của V1. Bỏ câu hỏi mở; bước 5 ghi "mở được trong PowerPoint"; R-027 cập nhật theo.
  - B. Giữ chưa chốt: bước 5 và Postconditions 4 tham chiếu R-027 ("trong luồng làm việc V1 kiểm chứng"), bỏ chữ "PowerPoint" khỏi Postconditions 4 (đổi nghĩa), hạ UC-008 xuống Proposed.
  - C. Chốt một ứng dụng khác hoặc nhiều ứng dụng.
- Đề xuất: A, vì UC-008 Ghi chú 2 và Tình huống đều nhắm việc chỉnh tay trong PowerPoint. Gộp với blocker của R-027 bên requirements.
- Quyết định:

### UC-L11 · TRANG_THAI · Trigger của UC-008 đứng sau bước 1
- Item: UC-008
- Tiêu chí: GUC-06, GUC-11
- Hiện trạng: Trigger "Người dùng chọn tải về và chọn định dạng." nhưng bước 1 là "Người dùng xem trước deck (UC-015)" và bước 2 mới là "Người dùng chọn tải về…". Nhánh 1A "Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa (UC-004), kết thúc UC." xảy ra trước Trigger, và "chưa vừa ý" không phải điều kiện hệ thống phát hiện được. UC-015 bước 3 đã có lựa chọn "gửi yêu cầu sửa tiếp (UC-004)… hoặc tải về".
- Điều chưa biết hoặc cần chọn: Use Case bắt đầu tại xem trước hay tại lựa chọn tải về.
- Phương án:
  - A. Bắt đầu tại lựa chọn tải về: bước 1 chuyển thành Precondition "Người dùng đang xem trước deck (UC-015)"; bỏ nhánh 1A vì trùng UC-015 bước 3; bỏ `include: UC-015` (đổi quan hệ).
  - B. Giữ bước 1 và `include: UC-015`; đổi Trigger thành sự kiện của bước 1 (người dùng cần chọn câu chữ); 1A đổi điều kiện thành "Người dùng gửi yêu cầu sửa thay vì chọn tải về: Hệ thống chuyển sang UC-004."
  - C. Giữ nguyên, chấp nhận lệch GUC-06.
- Đề xuất: B, vì không đổi quan hệ và không bỏ nhánh; chỉ cần người dùng duyệt câu Trigger mới. Dịch thử ở mục 4 giữ nguyên Trigger và đánh dấu blocker.
- Quyết định:

### UC-L12 · TRANG_THAI · Nhánh 1B của UC-011 không có điểm kết thúc
- Item: UC-011. Liên quan R-045, BR-012
- Tiêu chí: GUC-10, GUC-12
- Hiện trạng: "1B. Người dùng tải lại trang hoặc đóng ứng dụng: Trình duyệt hiển thị cảnh báo rời trang nếu deck chưa tải về." Không có điểm kết thúc, có "nếu", và không nói điều gì xảy ra khi người dùng xác nhận hay hủy. R-045 Acceptance 1: "…người dùng thấy cảnh báo và hủy được hành động." Acceptance 2: "Không hiển thị cảnh báo khi không có deck nào chưa tải về."
- Điều chưa biết hoặc cần chọn: sau cảnh báo rời trang, mỗi lựa chọn kết thúc ở đâu; sau khi tải lại trang, DeckAgent có mở lần làm việc mới trống như Postconditions 1 không.
- Phương án:
  - A. Tách thành các nhánh theo R-045: "1B. Người dùng tải lại trang hoặc đóng ứng dụng khi deck chưa tải về bản mới nhất: Trình duyệt hiển thị cảnh báo rời trang (R-045); người dùng xác nhận, lần làm việc kết thúc, kết thúc Use Case." và "1C. Người dùng hủy ở cảnh báo rời trang: Lần làm việc hiện tại giữ nguyên, kết thúc Use Case." Không khẳng định có lần làm việc mới sau khi tải lại.
  - B. Bỏ "tải lại trang hoặc đóng ứng dụng" khỏi Trigger và nhánh 1B; Ghi chú ghi cảnh báo rời trang thuộc R-045.
  - C. Tách luồng tải lại hoặc đóng ra Use Case riêng (tạo ID mới).
- Đề xuất: A, vì chỉ dùng hành vi R-045 đã chốt, không thêm thông tin.
- Quyết định:

### UC-L13 · TRANG_THAI · Người dùng hủy khi hệ thống hỏi lại
- Item: UC-001 (3A), UC-002 (4A, 5A). Cùng thiếu nhưng chưa chặn: UC-007 (2A, Proposed)
- Tiêu chí: GUC-12 ("bước nhận dữ liệu người dùng đưa vào, hoặc có thể bị hủy giữa chừng, phải có nhánh")
- Hiện trạng: "3A. Không xác định được chủ đề hoặc mục đích của deck: Hệ thống hỏi lại người dùng, sau đó quay lại bước 3." Không có nhánh cho trường hợp người dùng hủy thay vì trả lời. UC-004 2A có xử lý này ("Nếu người dùng hủy, bản chờ duyệt (nếu có) vẫn là bản chờ duyệt và UC kết thúc").
- Điều chưa biết hoặc cần chọn: ở UC tạo deck, người dùng có thao tác hủy khi được hỏi lại không, và kết thúc ở trạng thái nào.
- Phương án:
  - A. Thêm nhánh, ví dụ "3B. Người dùng hủy khi được hỏi lại: Hệ thống không tạo deck, lần làm việc vẫn chưa có deck, kết thúc Use Case." (tương tự UC-004 2A). Cần người dùng xác nhận vì đây là hành vi mới.
  - B. Không có thao tác hủy: Ghi chú ghi lý do bỏ qua (ví dụ người dùng gửi yêu cầu khác thay cho câu trả lời).
  - C. Hạ UC-001, UC-002 xuống Proposed.
- Đề xuất: A, vì UC-004 đã có cách xử lý tương ứng, và GUC-12 yêu cầu có nhánh.
- Quyết định:

### UC-L14 · MAU_THUAN_QH · UC-007 có bước AI nhưng không có ACT-002
- Item: UC-007, ACT-002
- Tiêu chí: GUC-02 (`supporting_actors` đủ), GUC-12
- Hiện trạng: UC-007 bước 3 "AI tạo hoặc sửa deck theo phần đã chọn của deck mẫu." GL-024: "AI … gọi tới AI model/provider bên ngoài (ACT-002)". ACT-002.Related Use Cases không có UC-007, nên `supporting_actors` suy ra từ relations.json (via=derived) để trống.
- Điều chưa biết hoặc cần chọn: UC-007 có `supporting_actors: [ACT-002]` không.
- Phương án:
  - A. Thêm ACT-002 vào `supporting_actors` của UC-007.
  - B. Giữ trống; ghi lý do trong Ghi chú.
- Đề xuất: A, vì bước 3 gọi AI giống UC-001, UC-002, UC-004, đều có ACT-002.
- Quyết định:

### UC-L15 · THAM_CHIEU_LOAI_CU · Mã L-001, L-002, W-026 trong `source`
- Item: UC-017 (`source`: L-002), UC-024 (`source`: L-001), UC-025 (`source`: W-026)
- Tiêu chí: GX-11, GX-03
- Hiện trạng: "L-002, R-047, Benchmark 27/09/2026"; "L-001, R-014, R-017, R-018"; "R-044, W-026". Loại `L-` và `W-` không được migrate, nên mã này không trỏ được tới item nào.
- Điều chưa biết hoặc cần chọn: giữ mã loại cũ trong `source` như mã nguồn, hay bỏ.
- Phương án:
  - A. Bỏ mã loại cũ. Nguồn vẫn truy được qua Requirement đã có trong `source`: R-047 (căn cứ L-002), R-017 (căn cứ L-001), R-044; D-025 Rationale 4 ghi kết quả của W-026.
  - B. Giữ như mã nguồn dạng text (validator phải chấp nhận mã không khớp mẫu ID nào).
  - C. Thay bằng Decision có ghi kết luận tương ứng: D-024 (L-001), D-025 (L-002, W-026).
- Đề xuất: A, vì không mất nguồn: Requirement trong `source` đã giữ chuỗi truy vết. Nên quyết định một lần cho mọi loại có `L-`, `W-` trong `source` (R-017, R-018, R-047, BR-017).
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
| UC-001 | Bảo đảm tối thiểu | gợi ý: 1. Lượt xử lý AI bị dừng, lỗi hoặc không qua kiểm tra kết quả không tạo deck (BR-014). 2. Lần làm việc vẫn ở trạng thái chưa có deck (BR-005) |
| UC-002 | Bảo đảm tối thiểu | gợi ý: như UC-001; thêm "Nội dung tài liệu có sẵn không thay đổi hành vi hệ thống (BR-008)" |
| UC-003 | Bảo đảm tối thiểu | gợi ý: Khi đọc deck có sẵn thất bại, lần làm việc vẫn chưa có deck |
| UC-004 | Bảo đảm tối thiểu | gợi ý: Deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit; nếu hủy trước ranh giới commit, bản chờ duyệt vẫn là bản chờ duyệt (BR-005, BR-010 điều 4–5). Phụ thuộc UC-L07 |
| UC-007 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên (BR-005); nội dung deck mẫu không được đưa vào deck như thông tin thật (chuyển từ Postconditions 2 nếu điều này đúng ở mọi nhánh) |
| UC-008 | Bảo đảm tối thiểu | Điều 1 chuyển từ Postconditions 2 (vế "chỉ khi tải về thành công"). gợi ý thêm: Hệ thống không giao file tạo thất bại hoặc không mở được (BR-010 điều 6) |
| UC-009 | Bảo đảm tối thiểu | gợi ý: Không tạo phiên đăng nhập khi xác thực thất bại |
| UC-010 | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 2 "Deck đã lưu không bị mất" nếu điều này đúng cả khi phiên đăng nhập hết hạn (nhánh 1A) |
| UC-011 | Bảo đảm tối thiểu | gợi ý: Deck chưa tải về chỉ bị bỏ sau khi người dùng đã được cảnh báo và xác nhận (BR-012); chuyển từ Postconditions 2 |
| UC-012 | Bảo đảm tối thiểu | gợi ý: Deck gốc không đổi (BR-015); lần làm việc hiện tại không đổi khi tạo bản sao thất bại (nhánh 2A) |
| UC-013 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận không thay đổi (BR-005) |
| UC-014 | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 1–2 (đúng ở mọi nhánh): lượt xử lý kết thúc ở một trong ba trạng thái xong, đã dừng, lỗi; không còn deck dở dang (BR-014). Postconditions còn "Lượt xử lý kết thúc ở trạng thái xong" |
| UC-015 | Bảo đảm tối thiểu | gợi ý: Việc xem trước không làm thay đổi deck (chuyển từ Postconditions 2) |
| UC-016 | Bảo đảm tối thiểu | — |
| UC-017 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005) |
| UC-018 | Bảo đảm tối thiểu | gợi ý: Khi xóa thất bại, tài liệu vẫn còn và hệ thống báo lỗi |
| UC-019 | Bảo đảm tối thiểu | gợi ý: Người xem không sửa được deck (chuyển từ Postconditions 1 nếu đúng ở mọi nhánh) |
| UC-020 | Bảo đảm tối thiểu | — |
| UC-021 | Bảo đảm tối thiểu | gợi ý: Deck đã lưu không bị thay đổi khi khôi phục thất bại |
| UC-022 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận hiện tại giữ nguyên khi khôi phục thất bại (nhánh 4A); các bản khác vẫn còn trong lịch sử (BR-016) |
| UC-023 | Bảo đảm tối thiểu | gợi ý: Phần ngoài phạm vi không bị đổi (BR-004); bản đã chấp nhận giữ nguyên (BR-005) |
| UC-024 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi thao tác thất bại (BR-005) |
| UC-025 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005); số liệu không đổi |

UC-005 không có FILL_LATER: Deprecated thuộc mức Closed, `Bảo đảm tối thiểu` chỉ bắt buộc từ Active và GX-15 không cho thêm nội dung.

## 4. Dịch thử

### UC-020 (đơn giản)

#### Bản gốc
- ID: UC-020
- Use Case: Quản trị viên tạo, khóa và xóa tài khoản người dùng
- Release Scope: Later
- Status: Draft
- Tình huống: Một thành viên đã rời dự án. Là quản trị viên, tôi muốn khóa tài khoản của bạn ấy ngay.
- Primary Actor: ACT-003
- Goal / Outcome: Quản trị viên kiểm soát ai được dùng DeckAgent.
- Trigger: Quản trị viên mở trang quản lý tài khoản.
- Preconditions: 1. Quản trị viên đã đăng nhập bằng tài khoản có quyền quản trị.
- Main Flow: 1. Quản trị viên xem danh sách tài khoản. 2. Quản trị viên tạo, khóa, mở khóa hoặc xóa tài khoản. 3. Hệ thống lưu thay đổi.
- Alternative / Failure Flows: 2A. Xóa tài khoản còn deck: Hệ thống báo các deck sẽ bị xóa theo và yêu cầu xác nhận.
- Postconditions: 1. Thay đổi có hiệu lực ngay; tài khoản bị khóa không đăng nhập được.
- Open Questions: 1. Quản trị tài khoản làm trong DeckAgent hay qua hệ thống bên ngoài? 2. Khi khóa tài khoản, deck của người đó được giữ hay xóa?
- Ghi chú: 1. Chỉ cần khi DeckAgent có tài khoản.
- Căn cứ: D-027, R-054
- Product Reference: 1. Presenton: quản trị viên tạo, đặt lại, xóa tài khoản. 2. Claude Design: quản trị viên bật hoặc tắt tính năng cho tổ chức Enterprise.
- Quan hệ UC: 1. Liên quan: UC-009
- Related Requirements: R-054

#### Bản dịch
```markdown
---
id: UC-020
title: "Quản trị viên tạo, khóa và xóa tài khoản người dùng"
status: Draft
scope: Later
level: user-goal
source: [D-027, R-054]
primary_actor: ACT-003
supporting_actors: []
constraints: []
include: []
extend: []
follows: []
split_from: []
related: []               # UC-009 ↔ UC-020 ghi một phía ở UC-009 (GX-05)
superseded_by: []
---

## Tình huống

Một thành viên đã rời dự án. Là quản trị viên, tôi muốn khóa tài khoản của bạn ấy ngay.

## Mục tiêu

Quản trị viên kiểm soát ai được dùng DeckAgent.

## Trigger

Quản trị viên mở trang quản lý tài khoản.

## Preconditions

1. Quản trị viên đã đăng nhập bằng tài khoản có quyền quản trị.

## Main Flow

1. Quản trị viên xem danh sách tài khoản.
2. Quản trị viên tạo, khóa, mở khóa hoặc xóa tài khoản.
3. Hệ thống lưu thay đổi.

## Alternative / Failure Flows

2A. Xóa tài khoản còn deck: Hệ thống báo các deck sẽ bị xóa theo và yêu cầu xác nhận.

## Postconditions

1. Thay đổi có hiệu lực ngay; tài khoản bị khóa không đăng nhập được.

## Bảo đảm tối thiểu

<!-- FILL_LATER -->

## Câu hỏi mở

1. Quản trị tài khoản làm trong DeckAgent hay qua hệ thống bên ngoài?
2. Khi khóa tài khoản, deck của người đó được giữ hay xóa?

## Sản phẩm tham khảo

1. Presenton: quản trị viên tạo, đặt lại, xóa tài khoản.
2. Claude Design: quản trị viên bật hoặc tắt tính năng cho tổ chức Enterprise.

## Ghi chú

1. Chỉ cần khi DeckAgent có tài khoản.
```

#### Thay đổi
1. Cột sheet chuyển vào frontmatter và section theo bảng ánh xạ; tên section theo template (`Goal / Outcome` → `Mục tiêu`, `Open Questions` → `Câu hỏi mở`, `Product Reference` → `Sản phẩm tham khảo`) (GX-06).
2. `level: user-goal`: UC-020 không được include bởi Use Case nào (`uc_levels`) (GUC-03).
3. `supporting_actors: []`: relations.json không có quan hệ derived cho UC-020 (GUC-02).
4. `related: []`: UC-009 và UC-020 cùng ghi "Liên quan" tới nhau; quan hệ chỉ ghi một lần, ở UC-009 (GX-05, mục 6 ghi chú 3). Related Requirements R-054 không ghi ở UC, đã lật thành `R-054.use_cases` (GX-05).
5. Thêm section `Bảo đảm tối thiểu` để trống (GUC-14, quyết định 3).
6. Không viết lại câu: item Draft chỉ qua gate cấu trúc. "ngay" ở Tình huống và Postconditions, Tình huống chưa theo mẫu, nhánh 2A chưa có điểm kết thúc, câu hỏi mở chưa có nơi xử lý: sửa khi lên Proposed hoặc Active (GX-08, GUC-04, GUC-10, GUC-18 đều áp từ Proposed hoặc Active).

### UC-008 (nhiều chỗ viết lại)

#### Bản gốc
- ID: UC-008
- Use Case: Tải deck về máy dạng PPTX hoặc PDF
- Release Scope: V1
- Status: Active
- Tình huống: Deck đã ổn và chiều nay tôi phải trình bày trên máy phòng họp. Tôi muốn tải file PPTX để chỉnh thêm vài chỗ trong PowerPoint, và một bản PDF để gửi trước cho sếp.
- Primary Actor: ACT-001
- Goal / Outcome: Người dùng có file PPTX hoặc PDF đúng với deck đã xem trước, dùng được ngoài DeckAgent.
- Trigger: Người dùng chọn tải về và chọn định dạng.
- Preconditions: 1. Lần làm việc có deck ở bản đã chấp nhận hoặc có bản chờ duyệt.
- Main Flow: 1. Người dùng xem trước deck (UC-015). 2. Người dùng chọn tải về và chọn PPTX hoặc PDF. 3. Hệ thống kiểm tra các thành phần không giữ được trong định dạng đã chọn. 4. Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung. 5. Hệ thống kiểm tra file mở được. 6. Người dùng nhận file. 7. Nếu file được tạo từ bản chờ duyệt, bản đó trở thành bản đã chấp nhận (BR-010).
- Alternative / Failure Flows: 1A. Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa (UC-004), kết thúc UC. 3A. Định dạng không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi; người dùng chọn tiếp tục hoặc hủy. Nếu hủy, bản chờ duyệt vẫn là bản chờ duyệt, kết thúc UC. 4A. Tạo file thất bại hoặc file không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc UC.
- Postconditions: 1. File được tạo từ đúng bản người dùng đã xem trước. 2. Bản chờ duyệt (nếu có) chỉ trở thành bản đã chấp nhận khi tải về thành công. 3. File PPTX và PDF giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (P5). 4. Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint. 5. File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc.
- Open Questions: 1. Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice?
- Ghi chú: 1. V1 chỉ có hai định dạng PPTX và PDF. 2. Chỉnh tay chuyên sâu làm trong PowerPoint sau khi tải về, nên PPTX phải sửa được.
- Căn cứ: D-015, D-026, D-027, DOC-001 FR19, DOC-001 FR20, DOC-001 NFR-O01, DOC-001 NFR-O02, DOC-001 NFR-O03, DOC-001 NFR-O04
- Product Reference: 1. Claude Design: tải về PDF, URL, PPTX, HTML; gửi sang Canva. 2. Gamma: tải về PDF, PPTX, PNG, Google Slides; báo giới hạn bố cục khi tải PPTX. 3. Presenton: tải về PPTX, PDF, PNG. 4. OpenSlide: tải về PDF và PPTX.
- Quan hệ UC: 1. Include: UC-014, UC-015 2. Trước đó: UC-001, UC-002, UC-003, UC-004, UC-012, UC-021 3. Tiếp theo: UC-011 4. Liên quan: UC-005 (sửa chuyên sâu làm trong PowerPoint sau khi tải về PPTX, R-041)
- Related Requirements: R-019, R-020, R-025, R-026, R-027, R-028, R-041
- Related Business Rules: BR-005, BR-006, BR-007, BR-010, BR-013
- Related Constraints: C-002, C-003, C-004
- Related Work: W-026, W-027

#### Bản dịch
```markdown
---
id: UC-008
title: "Người dùng tải deck về máy dạng PPTX hoặc PDF"
status: Active
scope: V1
level: user-goal
source: [D-015, D-026, D-027, "DOC-001 FR19", "DOC-001 FR20", "DOC-001 NFR-O01", "DOC-001 NFR-O02", "DOC-001 NFR-O03", "DOC-001 NFR-O04"]
primary_actor: ACT-001
supporting_actors: []
constraints: [C-002, C-003, C-004]
include: [UC-014, UC-015]
extend: []
follows: [UC-001, UC-002, UC-003, UC-004, UC-012, UC-021]
split_from: []
related: []               # UC-005 ↔ UC-008 ghi một phía ở UC-005 (GX-05); xem G-09
superseded_by: []
---

## Tình huống

Tôi có deck đã ổn cho buổi trình bày chiều nay trên máy phòng họp, tôi muốn tải về một file PPTX và một bản PDF, để chỉnh thêm vài chỗ trong PowerPoint và gửi trước bản PDF cho sếp.

## Mục tiêu

Người dùng có file PPTX hoặc PDF đúng với deck đã xem trước, để dùng ngoài DeckAgent.

## Trigger

Người dùng chọn tải về và chọn định dạng. <!-- BLOCKER UC-L11 -->

## Preconditions

1. Lần làm việc có deck ở bản đã chấp nhận hoặc có bản chờ duyệt.

## Main Flow

1. Người dùng xem trước deck (UC-015). <!-- BLOCKER UC-L11 -->
2. Người dùng chọn tải về và chọn PPTX hoặc PDF.
3. Hệ thống kiểm tra các thành phần không giữ được trong định dạng đã chọn.
4. Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung (BR-006).
5. Hệ thống kiểm tra file mở được. <!-- BLOCKER UC-L10 -->
6. Người dùng nhận file.

## Alternative / Failure Flows

1A. Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa, chuyển sang UC-004. <!-- BLOCKER UC-L11 -->
3A. Định dạng đã chọn không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi (BR-013) và người dùng chọn tiếp tục, tiếp tục bước 4.
3B. Người dùng chọn hủy sau danh sách của 3A: Bản chờ duyệt vẫn là bản chờ duyệt (BR-010 điều 6), kết thúc Use Case.
4A. Hệ thống tạo file thất bại: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case.
5A. File vừa tạo không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case. <!-- BLOCKER UC-L10 -->
6A. File được tạo từ bản chờ duyệt: Hệ thống chuyển bản chờ duyệt thành bản đã chấp nhận (BR-010 điều 3c), kết thúc Use Case.
<!-- BLOCKER UC-L03 -->

## Postconditions

1. File được tạo từ đúng bản người dùng đã xem trước (BR-006).
2. Bản người dùng đã tải về là bản đã chấp nhận (BR-010 điều 3c).
3. File PPTX và file PDF giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (BR-007).
4. Chữ, hình khối và bảng trong file PPTX sửa được trong PowerPoint. <!-- BLOCKER UC-L10 -->

## Bảo đảm tối thiểu

1. Bản chờ duyệt chỉ trở thành bản đã chấp nhận khi tải về thành công; lượt tải về bị hủy hoặc thất bại không làm thay đổi bản đã chấp nhận và bản chờ duyệt (BR-010 điều 6).
<!-- FILL_LATER -->

## Câu hỏi mở

1. Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice? <!-- BLOCKER UC-L10 -->

## Sản phẩm tham khảo

1. Claude Design: tải về PDF, URL, PPTX, HTML; gửi sang Canva.
2. Gamma: tải về PDF, PPTX, PNG, Google Slides; báo giới hạn bố cục khi tải PPTX.
3. Presenton: tải về PPTX, PDF, PNG.
4. OpenSlide: tải về PDF và PPTX.

## Ghi chú

1. V1 chỉ có hai định dạng tải về: PPTX và PDF.
2. Chỉnh tay chuyên sâu làm trong PowerPoint sau khi tải về, nên file PPTX phải sửa được.
3. File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc (BR-012).
```

#### Thay đổi
1. Tiêu đề thêm chủ ngữ "Người dùng" theo công thức [Ai] + [làm gì] + [với cái gì] (GUC-01).
2. Tình huống gộp hai câu theo mẫu "Tôi có…, tôi muốn…, để…", giữ đủ chi tiết (chiều nay, máy phòng họp, PPTX để chỉnh, PDF gửi sếp) (GUC-04).
3. Mục tiêu: "dùng được ngoài DeckAgent" → "để dùng ngoài DeckAgent" (GX-08 "dùng được"; cách nói theo GL-017).
4. Bước 4 thêm tham chiếu BR-006, vì quy tắc "tải về đúng bản đang xem trước" do BR-006 sở hữu (GUC-15, GX-10).
5. Bước 7 "Nếu file được tạo từ bản chờ duyệt…" chuyển thành nhánh 6A với điều kiện phát hiện được; Main Flow còn 6 bước, không còn "nếu" (GUC-08). Tham chiếu cụ thể BR-010 điều 3c.
6. 1A: chủ ngữ và "kết thúc UC" chuẩn hóa thành "chuyển sang UC-004" (GUC-10). Điều kiện "chưa vừa ý" chưa phát hiện được: chờ UC-L11 (GUC-11).
7. 3A tách thành 3A (tiếp tục, quay lại luồng chính tại bước 4) và 3B (hủy, kết thúc), mỗi dòng một điểm kết thúc; bỏ "Nếu" (GUC-10). 3A tham chiếu BR-013; 3B tham chiếu BR-010 điều 6 (GUC-15).
8. 4A "Tạo file thất bại hoặc file không mở được" tách thành 4A (bước 4) và 5A (bước 5), vì là hai điều kiện ở hai bước khác nhau, mỗi điều kiện cần một cách giả lập riêng trong test (GUC-11). Hành động giữ nguyên văn.
9. "kết thúc UC" → "kết thúc Use Case" (GUC-10).
10. Postconditions 1 thêm tham chiếu BR-006 (GUC-15).
11. Postconditions 2 "Bản chờ duyệt (nếu có) chỉ trở thành bản đã chấp nhận khi tải về thành công" tách hai vế: vế đúng khi thành công giữ ở Postconditions 2 ("Bản người dùng đã tải về là bản đã chấp nhận"); vế "chỉ khi thành công" là điều đúng khi thất bại, chuyển sang `Bảo đảm tối thiểu` 1 (GUC-13, GUC-14, quyết định 3 ngoại lệ: nội dung đã có trong sheet). Bỏ "(nếu có)".
12. Postconditions 3: "(P5)" là mã nguyên tắc trong DOC-001; thay bằng BR-007, item sở hữu quy tắc nhất quán giữa định dạng (căn cứ của BR-007 là DOC-001 Output Fidelity, tức P5) (GX-10).
13. Postconditions 5 "File tải về là cách duy nhất giữ deck…" không phải điều kiểm chứng được khi Use Case kết thúc, mà là hệ quả của BR-012 → chuyển sang Ghi chú 3, kèm BR-012 (GUC-13, GX-10).
14. Thêm section `Bảo đảm tối thiểu` (GUC-14); ngoài điều 1 chuyển từ Postconditions 2, phần còn lại `FILL_LATER`.
15. `related: []`: quan hệ UC-005 ↔ UC-008 đang ghi ở cả hai đầu; giữ ở UC-005 (GX-05). Chữ "R-041" trong lời giải thích quan hệ thuộc G-09.
16. `follows` lấy từ "Trước đó"; "Tiếp theo: UC-011" không ghi ở đây vì UC-011 đã ghi `follows: [UC-008]` (GX-05, GUC-17).
17. Related Requirements, Related Business Rules không ghi ở UC: đã lật thành `use_cases` của R và BR (GX-05). Related Work bỏ theo bảng ánh xạ.
18. `source` giữ đủ mã mục của DOC-001 (relations.json gộp thành "DOC-001") (GX-11).
19. Chỗ đánh dấu `BLOCKER UC-L03`: nhánh dừng lượt tạo file tải về, tùy quyết định UC-L03 (GUC-12).

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| `UC-002.Open Questions` | W-032 | Giữ làm text: bỏ "(W-032)", nơi xử lý của câu hỏi 2 đổi sang R-007 (R-007 sở hữu tiêu chí đo; Ghi chú của R-007 đang trỏ cùng W-032). Câu hỏi không ảnh hưởng Postconditions 2, vì "mọi số liệu khớp với tài liệu" kiểm được mà không cần định nghĩa "thông tin quan trọng" |
| `UC-002.Ghi chú` | L-001 | Giữ làm text: "Ảnh nhúng trong tài liệu có sẵn chưa được dùng lại." Bỏ ID; giới hạn đã chốt ở D-024 điều 3 |
| `UC-017.Ghi chú` | L-002 | Giữ làm text: "Đổi phong cách cả deck không thuộc Use Case này." Bỏ "đang được theo dõi ở L-002" (ghi chú quy trình) |
| `UC-017.Căn cứ` | L-002 | Blocker UC-L15 |
| `UC-023.Ghi chú` | L-002 | Giữ làm text: "Mở lại khi nhiều người dùng cần sửa đúng một slide." Bỏ ID |
| `UC-024.Open Questions` | L-001 | Giữ làm text: bỏ "(L-001)", nơi xử lý đổi sang R-017 (Ghi chú của R-017 đang trỏ L-001 cho cùng chủ đề) |
| `UC-024.Căn cứ` | L-001 | Blocker UC-L15 |
| `UC-025.Căn cứ` | W-026 | Blocker UC-L15 |
| `UC-010.Ghi chú` | GL-012, GL-013 | Giữ làm text: "“Phiên đăng nhập” khác “lần làm việc” (glossary.md)." GL-ID không còn trong `glossary.md`. Không thuộc legacy-refs.json, ghi để đủ |
| `*.Related Work` | W-026, W-027, W-032 | Bỏ theo bảng ánh xạ (cột Related Work không migrate) |

## 6. Ghi chú cho agent chính

1. **Giả định về tiêu đề (GUC-01).** Công thức có [Ai], và ví dụ UC-901 "Người mua mua vé cho một sự kiện" có chủ ngữ. Tôi thêm chủ ngữ lấy từ `primary_actor` cho mọi tiêu đề chưa có. Chủ ngữ suy từ field có sẵn nên không tính là thêm thông tin. Không áp cho UC-005 (Closed, GX-15). Nếu người dùng muốn tiêu đề không có chủ ngữ thì UC-009, UC-016, UC-019 (VIẾT-LẠI chỉ vì tiêu đề) chuyển về CẤU-TRÚC, và các item khác bỏ phần sửa tiêu đề.
2. **`source` phải giữ mã đầy đủ.** relations.json gộp "DOC-001 FR01" thành "DOC-001" và bỏ "Benchmark 27/09/2026" vì không phải ID. Khi ghi file, lấy `source` từ cột Căn cứ gốc. Item có "Benchmark 27/09/2026": UC-009, UC-016, UC-017, UC-018, UC-019.
3. **Quan hệ `related` ghi ở cả hai đầu (GX-05), chưa có trong global-blockers.** Script đã parse cả hai phía của "Liên quan", nên 6 cặp có hai bản ghi: UC-005↔UC-008, UC-007↔UC-017, UC-009↔UC-020, UC-010↔UC-014, UC-011↔UC-014, UC-015↔UC-019. Giả định: giữ ở item có ID nhỏ hơn. Quy tắc này máy làm được nên tôi không tạo blocker. Ngoài ra "Dẫn tới" của UC-015 được parse thành `related` tới UC-004, UC-008, UC-013, trong khi ba Use Case này đã `include` UC-015. Đề xuất bỏ ba quan hệ này, chỉ giữ `UC-015.related: [UC-019]`. Lời giải thích của `related` chuyển vào Ghi chú khi item ở Proposed trở lên (GX-12); hiện chỉ UC-011 có lời giải thích ("dừng lượt xử lý AI đang chạy") cần chuyển.
4. **"Tiếp theo", "Extend bởi", "Được include bởi", "Tách ra"** là chiều ngược và đã khớp với chiều thuận ở mọi cặp tôi đối chiếu. Không có mâu thuẫn mới.
5. **Nơi xử lý của câu hỏi mở ở Use Case Proposed (giả định, không tạo blocker).** Mức Proposed cho phép còn điều chưa chốt nếu có nơi xử lý. Tôi gán nơi xử lý là Requirement mà Use Case đã liên kết và Ghi chú của Requirement đó đã nói cùng chủ đề: UC-003 → R-005; UC-007 → R-010; UC-012 → R-049; UC-017 → R-047; UC-021 → R-048; UC-022 → R-016; UC-024 → R-017; UC-025 → R-044. Nếu agent chính coi đây là "chọn giữa các cách hiểu" thì gom thành một blocker với bảng này. Item Draft (UC-009, UC-010, UC-016, UC-018, UC-019, UC-020) chưa cần nơi xử lý.
6. **Chuẩn hóa máy làm được, áp cho mọi item ở Proposed trở lên:** "kết thúc UC" → "kết thúc Use Case"; "sau đó quay lại bước X" → "quay lại bước X"; nhánh thiếu chủ ngữ ("Chuyển sang UC-002") thêm chủ ngữ (GUC-10, GX-16).
7. **Nhánh Proposed thiếu điểm kết thúc hoặc có điều kiện chung chung** (chưa chặn vì GUC-10, GUC-11 áp từ Active): UC-003 4A, UC-017 2A, UC-023 3A và 3B ("Sửa thất bại"), UC-024 1A, 1B và 2A, UC-025 3A, UC-022 4A ("Khôi phục thất bại"). UC-012 bước 2 còn "nếu có" (GUC-08). Phải xử lý trước khi các item này lên Active.
8. **Precondition "AI không đang chạy lượt xử lý khác"** ở UC-001, UC-002, UC-004 trong khi UC-014 2C có nhánh cho việc gửi yêu cầu khi đang chạy (BR-014). Hai chỗ nhất quán nếu hiểu UC-014 2C là điểm chặn trước khi UC-001/002/004 bắt đầu. Tôi giữ nguyên; người review GUC-07 nên xác nhận.
9. **Gợi ý cho lần lên Proposed của các item Draft:** UC-019 gộp hai mục tiêu (chia sẻ qua link, trình chiếu) và có "Người xem", chưa phải actor (GUC-02, GUC-03). UC-021 có nhánh 1A đổi tên và 1B xóa deck, là mục tiêu riêng của việc quản lý danh sách deck (GUC-03). Không tạo TACH_ITEM vì chưa tới gate.
10. **UC-024 Ghi chú 1 nhắc UC-006 (ID đã nghỉ).** Giữ nguyên vì đây là thông tin truy vết. Nếu validator GX-03 quét ID trong văn bản thì cần danh sách ID đã nghỉ để không báo gãy.
11. **Thuật ngữ (GX-07).** Không có từ "Không dùng" nào trong section quy định của Use Case. "ứng dụng" (UC-011, UC-015) giữ nguyên vì định nghĩa GL-012 cũng dùng "mở ứng dụng"; nếu glossary coi "ứng dụng" là "app" thì đổi sang "DeckAgent". "Agent", "Brand Kit", "template" trong `Sản phẩm tham khảo` là tên tính năng của sản phẩm khác, giữ nguyên. "template PPTX" ở UC-017 Câu hỏi mở 2 đổi theo GL-019.
12. **Quy tắc dùng chung chưa có Business Rule.** "Hỏi lại khi không xác định được chủ đề hoặc mục đích" có ở UC-001, UC-002, UC-004, UC-007 và do R-002 sở hữu (Requirement, không phải BR). Tôi không coi đây là vi phạm GUC-15, nhưng R-002 dùng "nên" ở item Active (GR-02), việc của requirements.
13. **UC-013 sau khi bỏ Precondition duy nhất** thì section `Preconditions` trống. Template không ghi "xóa section nếu trống" cho Preconditions; đề xuất xóa section (không thuộc section bắt buộc trong schema).
14. **Gợi ý gộp blocker với loại khác:** UC-L01 với blocker `Hành vi lỗi` của ACT-002 bên actors. UC-L02 với ACT-L04, blocker ngưỡng của R-032 và G-04. UC-L04 với R-003. UC-L06 với R-008. UC-L07 với BR-010 (business-rules) và R-024, R-031, R-046 (requirements). UC-L09 với GX-09 của BR-003. UC-L10 với R-027, D-026. UC-L15 với mọi `source` có `L-`, `W-` (R-017, R-018, R-047, BR-017). ACT-L01 bên actors đang dẫn các bước của UC-001, UC-002, UC-004, UC-011, UC-014; nếu đánh số lại bước UC-004 (bước "2'") thì cập nhật số bước ở đó.
15. **G-xx ảnh hưởng Use Case:** G-04 (UC-014 trích D-011 ở Câu hỏi mở 2), G-08 và G-09 (UC-005, UC-008), G-10 (UC-018). G-08 sửa ở phía R-041, nhưng UC-005 nằm trong danh sách item của G-08 nên tôi vẫn ghi.
