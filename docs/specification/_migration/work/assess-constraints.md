# Đánh giá: constraints

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| C-001 | CẤU-TRÚC | Retired (Closed): chỉ chuyển vào template, không đổi nghĩa (GX-15). `short_name` mới "AI-first, không làm editor chuyên nghiệp"; Reason / Context → `Lý do không đổi được`; bỏ "(OR-045)" trong Ghi chú, giữ nguyên câu (mục 5). Impacts bỏ. G-02 được xử lý ở phía item dựa vào C-001, không đổi nội dung C-001 | G-02 |
| C-002 | BLOCKER | `short_name` mới "Kiến trúc vừa nguồn lực đồ án". "quá lớn" và "design system lớn" chưa có ranh giới (GC-02, GC-08) → C-L01. Ghi chú 2 ("DOC-001 coi Architecture không khả thi… là không đạt") chuyển sang `Lý do không đổi được` vì là lý do, không phải lưu ý (GX-12, GC-03). Review Trigger bỏ "rõ rệt", viết thành sự kiện quan sát được (GC-06, GX-08). Giữ type Resource vì R-041 trỏ tới (GC-07), nhưng phụ thuộc kết quả G-01/G-08 (mục 6) | C-L01 |
| C-003 | BLOCKER | `short_name` mới "Nhiều định dạng tải về theo đồ án"; `imposed_by` chuyển từ cột Constraint ("theo yêu cầu của đồ án") (GC-01). Câu Constraint đổi chủ ngữ sang DeckAgent, chỉ giữ giới hạn (GC-02, GX-16); vế "không phải vấn đề người dùng đã được chứng minh" chuyển sang Ghi chú. "nhiều định dạng" chưa có ranh giới, đồ án bắt buộc hay chỉ khuyến khích chưa rõ (GC-08, GX-09) → C-L02. Lý do 2 chép lại quyết định của D-026 (GX-10) → C-L03. Ghi chú: "hard acceptance" → "điều kiện nghiệm thu bắt buộc" (GX-07) | C-L02, C-L03 |
| C-004 | BLOCKER | `short_name` mới "Khả năng khác nhau giữa định dạng tải về". Câu Constraint bỏ vế mô tả "Các định dạng tải về có khả năng khác nhau" (đã có ở Lý do 1), giữ "<Đối tượng> không được…" (GC-02). Lý do 1 bỏ cụm mở "và các định dạng khác", thay bằng "ví dụ" (GX-08). Lý do 2 là nội dung quy định của R-025 (GX-10) → C-L03. Ghi chú bỏ "DOC-001 chủ động" (GX-12). Review Trigger thay "chúng" bằng danh từ (GX-17) | C-L03 |
| C-005 | CẤU-TRÚC | Retired (Closed): chỉ chuyển vào template (GX-15). `short_name` mới "Vai trò file không theo loại file"; Reason / Context → `Lý do không đổi được`. Impacts bỏ. G-03 xử lý ở phía R-003, R-004 | G-03 |
| C-006 | BLOCKER | Chờ G-04 (giữ hay xóa). Nếu giữ: Retired, chỉ chuyển cấu trúc (GX-15), `short_name` mới "Chưa chốt cơ chế implementation sớm". Nếu xóa: quan hệ D-011 → C-006 bỏ theo G-04 | G-04 |
| C-007 | BLOCKER | Chờ G-04. Nếu giữ: Retired, chỉ chuyển cấu trúc (GX-15), `short_name` mới "Chưa đặt ngưỡng định lượng khi thiếu evidence". Nếu xóa: quan hệ từ R-030, R-032, R-035, R-036, R-037 bỏ theo G-04 | G-04 |

## 2. Blocker cục bộ

### C-L01 · SO_LIEU · Ranh giới "hệ thống con quá lớn" của C-002
- Item: C-002
- Tiêu chí: GC-02, GC-08, GX-08, GX-09 (C-002 đang Active)
- Hiện trạng: Constraint: "Architecture không được đòi team xây các hệ thống con quá lớn chỉ để đạt kết quả cốt lõi của sản phẩm." Lý do 2 liệt kê ví dụ: "editor hoàn chỉnh, bản sao PowerPoint, cộng tác thời gian thực, hạ tầng SaaS phân tán hoặc design system lớn". Sheet không có số thành viên, thời hạn hay danh sách đóng.
- Điều chưa biết hoặc cần chọn: ranh giới nào cho phép phán một Architecture đã vượt C-002 hay chưa. Danh sách ở Lý do 2 là ví dụ ("có thể đúng về lý thuyết nhưng không khả thi"), nên coi đó là danh sách đầy đủ là chọn một cách hiểu.
- Phương án:
  - A. Dùng danh sách ở Lý do 2 làm danh sách đóng các hệ thống con mà Architecture không được đòi team tự xây; người dùng xác nhận danh sách đủ và làm rõ "design system lớn". Giữ Active.
  - B. Người dùng cung cấp ranh giới từ phía bên áp đặt: số thành viên, thời hạn đồ án (và nếu có, số giờ công). Câu Constraint nêu các con số đó; Review Trigger thành "các con số này thay đổi". Giữ Active.
  - C. Chỉ giữ phần nguồn lực đo được (như B) trong C-002; phần "không tự xây hệ thống con lớn" là đánh giá của team, chuyển sang Decision (GC-01). Phương án này tạo hoặc đổi ID.
  - D. Hạ C-002 về Proposed tới khi có ranh giới (TRANG_THAI). Lưu ý GC-02 (bounded) vẫn áp từ Proposed.
- Đề xuất: A, vì dùng thông tin đã có trong sheet và chỉ cần người dùng xác nhận danh sách; khớp với cách D-006, D-015, R-041 đã loại editor chuyên nghiệp. Nên quyết cùng G-01 (mục 6).
- Quyết định:

### C-L02 · SO_LIEU · Đồ án bắt buộc bao nhiêu định dạng tải về (C-003)
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
- Quyết định:

### C-L03 · TRUNG_SO_HUU · Constraint chép lại nội dung quy định của D-026 và R-025
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
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
| C-001 | `imposed_by` | — (Closed: không bắt buộc. Ghi chú gốc nói đây là lựa chọn của team, nên không có bên áp đặt) |
| C-001 | Cách kiểm tuân thủ | — (Closed: không bắt buộc) |
| C-002 | `imposed_by` | gợi ý: "môn học / đồ án Software Engineering (thời hạn, số thành viên)", lấy ý từ cột Constraint ("nguồn lực của một đồ án Software Engineering") và Lý do 1. Sheet không nêu ai đặt ra thời hạn và số người, nên chưa chuyển chỗ được |
| C-002 | Cách kiểm tuân thủ | gợi ý: 1. Xác nhận: khi chốt Decision kiến trúc, đối chiếu danh sách hệ thống con team phải tự xây với ranh giới chốt ở C-L01. 2. Phòng ngừa: dùng C-002 làm tiêu chí khi so sánh candidate architecture (ý của Ghi chú 1) |
| C-003 | `imposed_by` | Không để trống: chuyển từ cột Constraint ("theo yêu cầu của đồ án"). Nếu C-L02 chọn D thì field này mất ý nghĩa |
| C-003 | Cách kiểm tuân thủ | gợi ý: trước mỗi mốc nộp đồ án, đối chiếu danh sách định dạng tải về thực tế của DeckAgent với ranh giới chốt ở C-L02 |
| C-004 | `imposed_by` | gợi ý: "đặc tả của các định dạng file tải về (PPTX, PDF)", lấy ý từ Lý do 1 |
| C-004 | Cách kiểm tuân thủ | gợi ý: review acceptance của R-025, R-026, R-027, R-028 để xác nhận không tiêu chí nào đòi các định dạng giống nhau về khả năng sửa, tương tác, animation hoặc cách hiển thị |
| C-005 | `imposed_by`, Cách kiểm tuân thủ | — (Closed: không bắt buộc) |
| C-006 | `imposed_by`, Cách kiểm tuân thủ | — (Closed: không bắt buộc; chờ G-04) |
| C-007 | `imposed_by`, Cách kiểm tuân thủ | — (Closed: không bắt buộc; chờ G-04) |

## 4. Dịch thử

### C-005 (đơn giản)

#### Bản gốc
- ID: C-005 · Status: Retired · Type: Product
- Constraint: "Vai trò của file không được gán cứng theo loại file; cùng một file có thể là tài liệu có sẵn, deck cần sửa, deck mẫu, hình ảnh để chèn hoặc vai trò khác tùy mục đích sử dụng."
- Reason / Context: "1. Nếu gắn cứng PDF là tài liệu có sẵn, PPTX là deck cần sửa, ảnh là hình để chèn, nhiều luồng hợp lệ bị khóa ngay từ Architecture.\n2. Ví dụ một PPTX có thể vừa là tài liệu có sẵn, vừa là deck mẫu, hoặc là deck cần sửa tiếp."
- Impacts: "Mô hình input, luồng đọc file, cách biểu diễn metadata, ranh giới Architecture"
- Review Trigger: "Review nếu phạm vi sản phẩm cố ý thu hẹp tới mức mỗi loại file chỉ còn một vai trò."
- Ghi chú: "1. Vừa giới hạn thiết kế vừa bảo vệ một nhận định cốt lõi của DOC-001: loại file không quyết định vai trò của file."
- Căn cứ: "DOC-001 Product Context, DOC-001 AD1"
- Related Requirements: "R-003, R-004, R-005, R-010, R-017" · Related Decisions: trống

#### Bản dịch
```markdown
---
id: C-005
short_name: "Vai trò file không theo loại file"
type: Product
status: Retired
imposed_by: ""            # Closed: không bắt buộc
source: ["DOC-001 Product Context", "DOC-001 AD1"]
---

## Constraint

Vai trò của file không được gán cứng theo loại file; cùng một file có thể là tài liệu có sẵn, deck cần sửa, deck mẫu, hình ảnh để chèn hoặc vai trò khác tùy mục đích sử dụng.

## Lý do không đổi được

1. Nếu gắn cứng PDF là tài liệu có sẵn, PPTX là deck cần sửa, ảnh là hình để chèn, nhiều luồng hợp lệ bị khóa ngay từ Architecture.
2. Ví dụ một PPTX có thể vừa là tài liệu có sẵn, vừa là deck mẫu, hoặc là deck cần sửa tiếp.

## Cách kiểm tuân thủ

<!-- FILL_LATER -->

## Review Trigger

Review nếu phạm vi sản phẩm cố ý thu hẹp tới mức mỗi loại file chỉ còn một vai trò.

## Ghi chú

1. Vừa giới hạn thiết kế vừa bảo vệ một nhận định cốt lõi của DOC-001: loại file không quyết định vai trò của file.
```

#### Thay đổi
1. Đặt `short_name` mới từ câu Constraint (GX-13; quyết định 5).
2. Reason / Context → `Lý do không đổi được`, giữ nguyên văn (GX-15).
3. Căn cứ → `source` dạng danh sách mã nguồn (GX-11).
4. `imposed_by` và `Cách kiểm tuân thủ` để trống: field/section mới, không bắt buộc ở Closed (schema.json; quyết định 3).
5. Impacts bỏ (bảng ánh xạ). Related Requirements không ghi ở C-005: đã lật thành `constraints` của R-003, R-004, R-005, R-010, R-017 (GX-05).
6. Không sửa câu chữ: item Closed chỉ được sửa hình thức (GX-15). Quan hệ R-003, R-004 → C-005 thuộc G-03.

### C-003 (nhiều chỗ viết lại)

#### Bản gốc
- ID: C-003 · Status: Active · Type: Academic
- Constraint: "Project phải hỗ trợ tải deck về nhiều định dạng theo yêu cầu của đồ án; đây là constraint của project, không phải vấn đề người dùng đã được chứng minh."
- Reason / Context: "1. Team không được chọn chỉ một định dạng nếu đồ án bắt buộc nhiều định dạng.\n2. V1 đầu tiên dùng PPTX và PDF.\n3. Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định."
- Impacts: "Architecture phần tải về, Testing, cách biểu diễn deck, lập kế hoạch phạm vi"
- Review Trigger: "Review khi môn học hoặc advisor làm rõ số lượng hay loại định dạng bắt buộc, hoặc evidence implementation cho thấy cần đổi ranh giới định dạng."
- Ghi chú: "1. D-026 không biến mọi định dạng ứng viên thành hard acceptance của V1 đầu tiên."
- Căn cứ: "DOC-001 Multi-format Note, DOC-001 FR20"
- Related Requirements: "R-020, R-025, R-026, R-027, R-028, R-039" · Related Decisions: "D-026"

#### Bản dịch
```markdown
---
id: C-003
short_name: "Nhiều định dạng tải về theo đồ án"
type: Academic
status: Active            # BLOCKER C-L02 (giữ Active hay hạ Proposed)
imposed_by: "yêu cầu của đồ án"
source: ["DOC-001 Multi-format Note", "DOC-001 FR20"]
---

## Constraint

DeckAgent phải cho phép người dùng tải deck về nhiều định dạng <!-- BLOCKER C-L02 --> theo yêu cầu của đồ án.

## Lý do không đổi được

1. Team không được chọn chỉ một định dạng nếu đồ án bắt buộc nhiều định dạng. <!-- BLOCKER C-L02 -->
2. V1 đầu tiên dùng PPTX và PDF. <!-- BLOCKER C-L03 -->
3. Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định. <!-- BLOCKER C-L02 -->

## Cách kiểm tuân thủ

<!-- FILL_LATER -->

## Review Trigger

Môn học hoặc advisor làm rõ số lượng hay loại định dạng bắt buộc, hoặc evidence implementation cho thấy cần đổi ranh giới định dạng.

## Ghi chú

1. C-003 là giới hạn của project, không phải vấn đề người dùng đã được chứng minh.
2. D-026 không biến mọi định dạng ứng viên thành điều kiện nghiệm thu bắt buộc của V1 đầu tiên.
```

#### Thay đổi
1. Đặt `short_name` mới từ câu Constraint (GX-13; quyết định 5).
2. `imposed_by` = "yêu cầu của đồ án", chuyển từ cột Constraint ("theo yêu cầu của đồ án"), không thêm thông tin (GC-01; quyết định 3, ngoại lệ chuyển chỗ).
3. Câu Constraint: chủ ngữ "Project" → "DeckAgent", "hỗ trợ tải deck về" → "cho phép người dùng tải deck về"; giới hạn đặt lên sản phẩm, đúng mẫu "<Đối tượng> phải…" (GC-02, GX-16).
4. Vế "đây là constraint của project, không phải vấn đề người dùng đã được chứng minh" tách khỏi Constraint, chuyển sang Ghi chú 1 vì là lưu ý khi đọc, không phải giới hạn (GC-02, GX-12); "đây" thay bằng "C-003" (GX-17).
5. "nhiều định dạng" chưa có ranh giới, và Lý do 1, 3 cho thấy đồ án chưa xác nhận là bắt buộc: giữ nguyên chữ, đánh dấu C-L02 (GC-08, GX-09, GC-01).
6. Lý do 2 chép lại quyết định của D-026: giữ tại chỗ, đánh dấu C-L03 (GX-10, GC-03).
7. Lý do 3 giữ "khi khả thi" vì là lời advisor được thuật lại; bỏ đi là đổi nghĩa (GX-08 chấp nhận khi Review).
8. Review Trigger bỏ tiền tố "Review khi", viết thành sự kiện quan sát được (GC-06).
9. Ghi chú gốc: "hard acceptance" → "điều kiện nghiệm thu bắt buộc" (GX-07); "mọi" giữ vì đúng nghĩa câu gốc (GX-08 chỉ cảnh báo).
10. Căn cứ → `source` dạng danh sách mã nguồn (GX-11). Impacts bỏ. Related Requirements và Related Decisions không ghi ở C-003: đã lật thành `constraints` của R-020, R-025, R-026, R-027, R-028, R-039 và D-026 (GX-05).
11. `Cách kiểm tuân thủ` để trống (quyết định 3), xem gợi ý ở mục 3. Section này bắt buộc từ Active nhưng không tính vào GX-09 (quyết định 6).

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| `C-001.Ghi chú` | OR-045 (rule không migrate) | Giữ làm text: bỏ "(OR-045)", giữ câu "đây là lựa chọn của team, không phải giới hạn từ bên ngoài". Ý đã nằm trong câu nên bỏ ID không mất nghĩa; chỉ là sửa hình thức nên hợp GX-15 |

Không có tham chiếu `W-`, `L-`, `RK-`, `B-`, `SP-` trong các cột được giữ của Constraint. Cột Impacts (bị bỏ) có các từ quy trình "chia Work", "Spike", không cần xử lý.

## 6. Ghi chú cho agent chính
1. **Cách xếp nhóm của item Retired.** C-001 và C-005 được xếp `CẤU-TRÚC` dù có G-02 và G-03, vì hai blocker này xử lý ở phía item dựa vào (R, D). Nội dung C-001 và C-005 không đổi theo bất kỳ phương án nào. C-006 và C-007 được xếp `BLOCKER` vì G-04 quyết định item còn tồn tại hay không.
2. **Gợi ý cho G-03.** Nội dung của C-005 đã có item sở hữu: D-007 ("vai trò của file xác định theo mục đích"), BR-001 ("đuôi file… không quyết định vai trò") và R-004. Nếu G-03 chọn mở lại C-005 về Active, C-005 sẽ trượt GC-01 vì đây là lựa chọn của team. Nên chọn bỏ quan hệ `constraints` của R-003, R-004 tới C-005.
3. **Gợi ý cho G-02.** Ghi chú C-001 nói nội dung đã ở D-006 và D-015, nhưng chính D-006 và D-015 đang có `constraints` → C-001. Nên bỏ các quan hệ này; R-029 và R-041 cũng chỉ cần bỏ quan hệ.
4. **C-002 phụ thuộc G-01, G-08.** Requirement duy nhất trỏ tới C-002 là R-041 (cả `constraints` và `source`). Ngoài ra C-002 chỉ được UC-001, UC-002, UC-003, UC-004, UC-005, UC-007, UC-008 trỏ tới, mà GC-07 chỉ tính Requirement hoặc Decision. Nếu G-01 xóa R-041 hoặc đổi R-041 sang loại khác, C-002 (type Resource, nhóm dự án) có thể trượt GC-07. Đề xuất quyết G-01 và C-L01 cùng lúc: ý "không xây editor chỉnh slide chuyên nghiệp" của R-041 là một phần tử của danh sách ở C-L01 phương án A.
5. **Gợi ý cho G-04.** A-004.Ghi chú (Retired) có text "(C-006, D-011)". Nếu G-04 xóa C-006, đây là tham chiếu text bị gãy, chưa có trong danh sách của G-04.
6. **Gợi ý cho G-05.** Ghi chú 1 của C-003 ("giới hạn của project, không phải vấn đề người dùng đã được chứng minh") trùng ý phân loại của D-010. Nếu D-010 được giữ, Ghi chú này nên tóm tắt kèm ID D-010 (GX-10); nếu D-010 bị xóa, giữ làm text như bản dịch thử.
7. **Gợi ý cho glossary.** Thuật ngữ "tải về" được định nghĩa là "xuất deck thành file PPTX hoặc PDF", trong khi C-003 và C-004 nói tới định dạng tải về khác (HTML, ảnh, video). Nếu C-L02 chọn B hoặc mở rộng định dạng, định nghĩa glossary cần sửa theo.
8. **Thuật ngữ trong item Closed.** C-005 dùng "deck cần sửa"; glossary có "deck có sẵn" nhưng "deck cần sửa" không nằm trong cột Không dùng. Đã giữ nguyên vì item Closed (GX-15). Ghi chú C-001 có ngày "27/09/2026"; schema chưa khai báo định dạng ngày trong văn bản (GX-18) nên giữ nguyên.
9. **Section mới ở item Closed.** Đã ghi `<!-- FILL_LATER -->` cho `Cách kiểm tuân thủ` và để trống `imposed_by` ở item Retired. Các chỗ này sẽ không bao giờ được điền vì GX-15 không cho thêm nghĩa. Đề xuất áp một quy ước chung cho mọi loại: với item Closed thì bỏ hẳn section mới, hoặc ghi chú "không áp dụng", thay vì giữ FILL_LATER.
10. **Giả định đã tự đặt.** `source` ghi dạng "DOC-001 <mục>" theo cột Căn cứ (relations.json gộp về DOC-001). Với C-003, `imposed_by` được điền bằng chuyển chỗ thay vì FILL_LATER, vì câu Constraint đã nêu bên áp đặt.
