# Đánh giá: decisions

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| D-001 | XÓA | Item `project` (A2: phạm vi Sprint 1). Status Superseded nhưng text không nêu Decision thay thế; vì item bị xóa nên không cần `superseded_by` (mục 6) | — |
| D-002 | XÓA | Item `project` (GitHub là nơi lưu code, PR, CI) | — |
| D-003 | XÓA | Item `project` (mọi thay đổi vào main đi qua PR) | — |
| D-004 | XÓA | Item `project` (cách ràng buộc Agent) | — |
| D-005 | XÓA | Item `project` (yêu cầu với tài liệu Architecture). Quan hệ `addresses: R-041` mất theo; quan hệ nằm ở phía D nên R-041 không bị ảnh hưởng | — |
| D-006 | BLOCKER | Decision: thay "editor chỉnh slide chuyên nghiệp" bằng "editor chỉnh slide thay thế PowerPoint, Canva hay Figma", danh sách lấy từ Rationale 1 (GX-08); chuyển phương án "xây bản thay thế PowerPoint, Canva hay Figma" từ Rationale sang `Phương án đã xét` (GD-03); Reopen When còn "không mang lại giá trị", "chuyên nghiệp" (GD-07) | D-L02, G-01, G-02 |
| D-007 | VIẾT-LẠI | Decision sang thể chủ động, chủ ngữ DeckAgent (GD-01, GX-16); chuyển phương án "suy vai trò cứng từ đuôi file" từ Rationale 1 sang `Phương án đã xét` (GD-03); Reopen When "đánh đổi đó" → lặp lại danh từ (GX-17) | — |
| D-008 | CẤU-TRÚC | Closed, chỉ chuyển vào template, không đổi nội dung (GX-15); `superseded_by: [D-013]` lấy từ Rationale 2 và Reopen When (GD-09) | — |
| D-009 | BLOCKER | Chuyển Context 2 (đòi mọi file giống hệt về pixel, font… "là không thực tế") sang `Phương án đã xét` (GD-03); Decision giữ ở mức lựa chọn, quy tắc chi tiết thuộc BR-007 qua `shapes` (GD-10); Reopen When "yêu cầu đồ án thay đổi" là dạng "khi có thay đổi" (GD-07) | D-L02 |
| D-010 | BLOCKER | `unclear` (G-05). Nếu giữ: đánh số 3 vế (GX-14); nội dung đã nằm ở C-003, R-025 (GD-10); Reopen When "yêu cầu đồ án thay đổi" (GD-07); chưa có phương án thay thế trong text | G-05 |
| D-011 | BLOCKER | `unclear` (G-04). Nếu giữ: chuyển "chốt cơ chế quá sớm" từ Rationale sang `Phương án đã xét` (GD-03); GX-04 với C-006 (Retired) nằm trong G-04; `addresses: R-041` phụ thuộc G-01 | G-04, G-01 |
| D-012 | VIẾT-LẠI | Chuyển Context 2 ("không cố chứng minh toàn bộ tầm nhìn sản phẩm cùng lúc") sang `Phương án đã xét` (GD-03); "file dùng được" trong Rationale bị Lint báo (GX-08, xem mục 6) | — |
| D-013 | VIẾT-LẠI | Decision bắt đầu bằng phạm vi "V1", thay "capability này" bằng danh từ (GD-01, GX-17); chuyển phương án "V1 gồm nhập và sửa deck có sẵn" (Context 2, Rationale 2) sang `Phương án đã xét` (GD-03) | — |
| D-014 | BLOCKER | Chuyển phương án "sửa cục bộ từng thành phần" (Rationale 2) sang `Phương án đã xét` (GD-03); Reopen When "mất kiểm soát rõ rệt" (GD-07, GX-08) | D-L02 |
| D-015 | BLOCKER | Chuyển phương án "xây canvas hoặc editor" (Context 2, Rationale 2) sang `Phương án đã xét`, gọi là "editor chỉnh tay trên web" theo chính câu Decision thay cho "chuyên nghiệp" (GD-03, GX-08); GX-04 với C-001 (G-02); `addresses: R-041` phụ thuộc G-01 | G-01, G-02 |
| D-016 | VIẾT-LẠI | Closed, chỉ sửa hình thức (GX-15): bỏ ID W-026 ở Rationale 2, giữ ý làm text; `superseded_by: [D-026]` lấy từ Rationale 2 và Reopen When (GD-09) | — |
| D-017 | BLOCKER | Chuyển phương án "P4 là hard acceptance" (Rationale 2) sang `Phương án đã xét` (GD-03); "Critical behavior", "hard acceptance" chưa có trong glossary (GX-07, mục 6); Reopen When "V1 dùng được" (GD-07) | D-L02 |
| D-018 | XÓA | Item `project` (Hybrid mode, Spike). 5 quan hệ `addresses` mất theo | — |
| D-023 | XÓA | Item `project` (điểm dừng của Sprint 2) | — |
| D-024 | VIẾT-LẠI | Giữ 3 vế (đạt GD-01); vế 1, 2 ở mức lựa chọn, R-003 và BR-009 sở hữu hành vi qua `shapes` (GD-10, mục 7); chuyển các loại tài liệu để sau (Context 2, Rationale 2) sang `Phương án đã xét` (GD-03); Rationale 3 "D-007 vẫn Active" là lưu ý khi đọc → `Ghi chú` (GX-12); W-026, L-001 giữ làm text (mục 5) | — |
| D-025 | BLOCKER | Vế 3 sang thể chủ động (GX-16); Rationale 3 tóm tắt kèm BR-011 (GX-10); chuyển Undo nhiều bước, sửa cục bộ, lịch sử nhiều bản (Context, Rationale 2) và dịch deck, đổi phong cách, hình do AI tạo (Rationale 4) sang `Phương án đã xét` (GD-03); W-026, L-002 giữ làm text; Reopen When "deck dùng được", "phụ thuộc nhiều" (GD-07) | D-L02 |
| D-026 | VIẾT-LẠI | Vế 2, 3 thêm chủ ngữ và sang thể chủ động (GD-01, GX-16); chuyển phương án "bắt buộc PowerPoint, Google Slides, LibreOffice, Keynote trước khi có file thật" (Rationale 2) sang `Phương án đã xét` (GD-03); W-026 giữ làm text | — |
| D-027 | VIẾT-LẠI | Chuyển host cloud, lưu trữ lâu dài, nhiều người dùng (Context 1, Rationale 3) sang `Phương án đã xét` (GD-03); vế 2 ở mức lựa chọn, BR-012 qua `shapes` (GD-10); W-028 giữ làm text; evidence "Advisor xác nhận" chưa có ID (GD-04 → `source` FILL_LATER) | — |
| D-028 | BLOCKER | `unclear` (G-06). Nếu giữ: W-026, W-032 trong Decision và Reopen When (đã nằm trong G-06 phương án C); "Chưa chốt ngưỡng" (GX-09); "nghiêm trọng" (GX-08); dòng dài hơn 200 ký tự (GX-14) | G-06 |
| D-029 | VIẾT-LẠI | Chuyển Rationale 4 ("Phương án bị loại…") sang `Phương án đã xét` (GD-03); Context 3 (DOC-004, DOC-008 chưa phản ánh) là việc để sau → `Ghi chú` (GX-12); "capability này", "luồng này" → lặp lại danh từ (GX-17) | — |
| D-030 | BLOCKER | Decision 7 câu, 838 ký tự (GD-01), trùng BR-010 mục 3b, 4, 5 (GD-10); Context 2 sang `Phương án đã xét` (GD-03); thay request, user, Cancel, constraint, version, rollback, baseline, pre-flight bằng thuật ngữ glossary (GX-07); đánh số từng dòng Context, Rationale (GX-14); Reopen When "gây khó hiểu" (GD-07) | D-L01, D-L02 |

## 2. Blocker cục bộ

### D-L01 · TRUNG_SO_HUU · D-030 phát biểu lại quy tắc chi tiết của BR-010
- Item: D-030, BR-010
- Tiêu chí: GD-10, GX-10, GD-01
- Hiện trạng: D-030.Decision gồm 7 câu (838 ký tự): chưa chấp nhận bản chờ duyệt khi còn hỏi lại, cảnh báo, xác nhận; hủy hoặc bị từ chối thì vẫn là bản chờ duyệt; chấp nhận tại ranh giới commit; điều kiện đạt ranh giới commit; không thêm bước xác nhận riêng; thứ tự áp ràng buộc tại ranh giới commit; quay về khi lượt xử lý dừng, lỗi hoặc không qua kiểm tra. Cả 7 ý đều có trong BR-010 mục 3b, 4, 5 (BR-010 có `Căn cứ: D-025, R-020, R-031, D-030`).
- Điều chưa biết hoặc cần chọn: item nào sở hữu quy tắc chi tiết về ranh giới commit. Giữ ở cả hai nơi vi phạm GX-10; giữ nguyên Decision vi phạm GD-01 (quá 3 vế, quá ~400 ký tự).
- Phương án:
  - A. BR-010 sở hữu quy tắc. D-030.Decision chỉ giữ lựa chọn, tối đa 3 vế: (1) DeckAgent chấp nhận bản chờ duyệt tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu, không chấp nhận ngay khi người dùng gửi yêu cầu sửa mới; (2) ranh giới commit chỉ đạt sau khi các bước hỏi lại, cảnh báo hoặc xác nhận hoàn tất. Chi tiết tóm tắt kèm "BR-010 mục 3b, 4, 5", nối qua `shapes: [BR-010]` (đã có). Không tạo hay đổi ID.
  - B. D-030 sở hữu. BR-010 mục 4, 5 thay bằng tóm tắt kèm D-030. Trái với mục 1 của `_CRITERIA.md` ("Decision giữ lựa chọn, rule giữ điều phải đúng"), và D-030 vẫn quá 3 vế.
  - C. Giữ chi tiết trong Decision và tách D-030 thành nhiều Decision (ID mới, TACH_ITEM). BR-010 vẫn trùng nội dung.
- Đề xuất: A, vì BR-010 đã chứa đủ 7 ý của D-030 nên bỏ khỏi D-030 không mất thông tin, và đúng phân vai Decision giữ lựa chọn, Business Rule giữ điều phải đúng.
- Quyết định:

### D-L02 · SO_LIEU · Reopen When dùng điều kiện không quan sát được
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
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
| D-006…D-030 (19 item không XÓA) | `source` | Sheet Decisions không có cột Căn cứ. Evidence hiện chỉ nằm ở `documents` (Detailed Doc). Gợi ý riêng xem các dòng dưới |
| D-006 | Hệ quả | gợi ý: Tốt: phạm vi không mở rộng thành bản thay thế PowerPoint, Canva hay Figma (Rationale 1). Đánh đổi: chỉnh tay chuyên sâu phải làm ngoài DeckAgent sau khi tải về (Context 2) |
| D-006 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" (GD-06) |
| D-007 | Hệ quả | gợi ý: Tốt: không khóa luồng hợp lệ ngay từ đầu (Rationale 1). Đánh đổi: phải xác định mục đích từ yêu cầu thay vì đọc đuôi file |
| D-007 | Xác nhận tuân thủ | gợi ý: test đưa cùng một file PPTX với hai mục đích khác nhau, kiểm DeckAgent gán hai vai trò khác nhau (BR-001) |
| D-008 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Không bắt buộc ở Closed (schema chỉ đòi section tới mức active). Để trống, không viết thêm (GX-15) |
| D-009 | Hệ quả | gợi ý: Tốt: độ trung thực kiểm được theo facts, số liệu, thứ tự, ý nghĩa. Đánh đổi: các file có thể khác về pixel, font, khả năng sửa, tương tác, animation (BR-007) |
| D-009 | Xác nhận tuân thủ | gợi ý: test so facts, số liệu và thứ tự slide giữa PPTX và PDF của cùng một bản đã chấp nhận (R-025) |
| D-010 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Phụ thuộc G-05; text không có phương án thay thế. Nếu giữ theo G-05 phương án B: gợi ý "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-011 | Hệ quả, Xác nhận tuân thủ | Phụ thuộc G-04 |
| D-012 | Hệ quả | gợi ý: Tốt: Architecture, Implementation, Testing cùng nhắm một luồng (Context 1). Đánh đổi: sửa deck có sẵn ra khỏi V1 (D-013) |
| D-012 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-013 | Hệ quả | gợi ý: Tốt: V1 không gánh chi phí giữ bố cục khi nhập và sửa cục bộ (Context 2). Đánh đổi: người dùng có deck có sẵn phải tạo deck mới trong V1 |
| D-013 | Xác nhận tuân thủ | gợi ý: check R-005, R-012, R-023 có `scope: Later` |
| D-014 | Hệ quả | gợi ý: Tốt: V1 không phải định danh từng thành phần và vá cục bộ (Rationale 2). Đánh đổi: yêu cầu nhắm vào một slide có thể đổi slide khác (BR-011) |
| D-014 | Xác nhận tuân thủ | gợi ý: test gửi yêu cầu sửa một slide, kiểm DeckAgent hiện cảnh báo của BR-011 trước khi chạy |
| D-015 | Hệ quả | gợi ý: Tốt: không dành nguồn lực cho canvas hoặc editor (Context 2). Đánh đổi: chỉnh tay phụ thuộc file PPTX tải về mở được (R-027) |
| D-015 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-016 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Không bắt buộc ở Closed. Để trống (GX-15) |
| D-017 | Hệ quả | gợi ý: Tốt: acceptance V1 tập trung vào P1, P2, P3, P5. Đánh đổi: P4 Safe Refinement không được kiểm như hard acceptance |
| D-017 | Xác nhận tuân thủ | gợi ý: check mỗi P1, P2, P3, P5 có ít nhất một Requirement Active có Acceptance (ví dụ R-007, R-024, R-021, R-025) |
| D-024 | Hệ quả | gợi ý: Tốt: Architecture có danh sách loại tài liệu cố định (Context 1). Đánh đổi: PDF scan, ảnh, URL, XLSX/CSV, nhiều tài liệu cho một deck, dùng lại ảnh nhúng chưa có trong V1 |
| D-024 | Xác nhận tuân thủ | gợi ý: vế 1: test nhận từng loại trong 5 loại; vế 2: test tài liệu thứ hai cho cùng deck (BR-009); vế 3: test ảnh nhúng không xuất hiện trong deck |
| D-025 | Hệ quả | gợi ý: Tốt: không cần Undo nhiều bước (Rationale 2). Đánh đổi: sửa theo slide là cố gắng, không đảm bảo (BR-011) |
| D-025 | Xác nhận tuân thủ | gợi ý: vế 1: test từng loại trong 7 loại sửa cả deck; vế 2: test bỏ lần sửa gần nhất quay về bản đã chấp nhận (R-031); vế 3: test cảnh báo BR-011 |
| D-026 | Hệ quả | gợi ý: Tốt: chứng minh bàn giao chỉnh tay, file chỉ xem, độ trung thực (Rationale 1). Đánh đổi: mất mát tương thích PPTX chỉ biết sau implementation (Rationale 3) |
| D-026 | Xác nhận tuân thủ | gợi ý: vế 1: test file PPTX và PDF mở được (R-027); vế 2: check không có định dạng khác trong V1; vế 3: "Không áp dụng: chưa chốt theo chính quyết định" |
| D-027 | `source` | gợi ý: mã buổi trao đổi với advisor kèm ngày (Rationale 1 "Advisor xác nhận không cần host"); người dùng cung cấp ngày |
| D-027 | Hệ quả | gợi ý: Tốt: V1 không cần hạ tầng cloud, tài khoản (Rationale 2, 3). Đánh đổi: deck mất khi kết thúc lần làm việc (BR-012, R-045) |
| D-027 | Xác nhận tuân thủ | gợi ý: vế 1: review không có bước host hay tài khoản; vế 2: test tải lại trang sau cảnh báo, deck không còn |
| D-028 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Phụ thuộc G-06 |
| D-029 | `source` | gợi ý: rà soát Use Case ngày 2026-09-27 (Context 1) |
| D-029 | Hệ quả | gợi ý: Tốt: người dùng không bị kẹt khi lượt xử lý kéo dài (Rationale 2). Đánh đổi: Architecture phải bảo đảm dừng không để deck dở dang (Reopen When) |
| D-029 | Xác nhận tuân thủ | gợi ý: test dừng giữa lượt xử lý AI, kiểm bản đã chấp nhận không đổi (BR-014) |
| D-030 | `source` | gợi ý: buổi prototype UC-004 và BR-010 (Context 1); chưa có ngày |
| D-030 | Hệ quả | gợi ý: Tốt: hủy yêu cầu trước ranh giới commit không làm đổi trạng thái phiên bản (Rationale 1). Đánh đổi: bản chờ duyệt được chấp nhận ngầm, không có bước xác nhận riêng (Reopen When) |
| D-030 | Xác nhận tuân thủ | gợi ý: test hủy yêu cầu trong bước hỏi lại, kiểm bản vẫn là bản chờ duyệt; test lượt xử lý lỗi sau ranh giới commit, kiểm deck quay về bản vừa chấp nhận |

`Phương án đã xét` của các item Active còn lại (D-006, D-007, D-009, D-012…D-015, D-017, D-024…D-027, D-029, D-030) được điền bằng cách chuyển từ Context hoặc Rationale (quyết định 5), không để trống.

## 4. Dịch thử

### D-008 (đơn giản)

#### Bản gốc
- ID: D-008
- Status: Superseded
- Decision: "Deck có sẵn được coi là deck có thể tiếp tục sửa bằng AI."
- Date: 2026-09-17
- Recorded By: Duy
- Context: "1. Product baseline ban đầu coi việc nhập và dùng lại deck có sẵn là capability cốt lõi.\n2. V1 sau đó được thu hẹp thành luồng ưu tiên tạo mới."
- Rationale / Evidence: "1. Decision đạt đúng điều kiện reopen của chính nó khi DOC-002 chọn V1 ưu tiên tạo mới.\n2. D-013 thay thế để phản ánh ranh giới mới mà không xóa khả năng làm sau."
- Reopen When: "Không mở lại trực tiếp; xem D-013."
- Requirement chính: "R-005, R-012, R-023"
- Assumption chính: "A-011"
- Related Work: "W-001, W-004"
- Detailed Doc: "DOC-001, DOC-002"

#### Bản dịch
```markdown
---
id: D-008
short_name: Deck có sẵn sửa tiếp bằng AI
status: Superseded
date: 2026-09-17
decided_by: Duy
source: []
addresses: [R-005, R-012, R-023]   # cần duyệt addresses hay shapes (mục 7)
assumptions: [A-011]
constraints: []
shapes: []
documents: [DOC-001, DOC-002]
superseded_by: [D-013]
---

## Decision

Deck có sẵn được coi là deck có thể tiếp tục sửa bằng AI.

## Context

1. Product baseline ban đầu coi việc nhập và dùng lại deck có sẵn là capability cốt lõi.
2. V1 sau đó được thu hẹp thành luồng ưu tiên tạo mới.

## Phương án đã xét

<!-- FILL_LATER -->

## Rationale / Evidence

1. Decision đạt đúng điều kiện reopen của chính nó khi DOC-002 chọn V1 ưu tiên tạo mới.
2. D-013 thay thế để phản ánh ranh giới mới mà không xóa khả năng làm sau.

## Hệ quả

<!-- FILL_LATER -->

## Xác nhận tuân thủ

<!-- FILL_LATER -->

## Reopen When

Không mở lại trực tiếp; xem D-013.
```

#### Thay đổi
1. Thêm `short_name` đặt từ câu Decision (GD-11).
2. `superseded_by: [D-013]` lấy từ Rationale 2 ("D-013 thay thế") và Reopen When ("xem D-013") (GD-09).
3. Requirement chính → `addresses`, gắn cờ duyệt ở mục 7 (quyết định 4).
4. Assumption chính → `assumptions`; Detailed Doc → `documents`; Recorded By → `decided_by`.
5. Related Work bỏ theo bảng ánh xạ.
6. Không sửa câu chữ nào: item Closed chỉ được sửa hình thức (GX-15). Section mới để FILL_LATER; ở Closed không bắt buộc (schema `required_sections` chỉ tính tới mức active).
7. Bỏ section `Ghi chú` vì trống (template).

### D-030 (nhiều chỗ viết lại)

#### Bản gốc
- ID: D-030
- Status: Active
- Decision: "Khi người dùng đang xem bản chờ duyệt và gửi yêu cầu sửa mới, bản chờ duyệt chưa được chấp nhận nếu yêu cầu còn cần hỏi lại, cảnh báo hoặc xác nhận. Trong các bước đó, nếu người dùng hủy hoặc yêu cầu bị từ chối thì bản hiện tại vẫn là bản chờ duyệt. Bản chờ duyệt được chấp nhận tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu. Ranh giới này đạt ngay khi yêu cầu không bị từ chối và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất; nếu có các bước đó, ranh giới commit chỉ đạt sau khi chúng hoàn tất. Không thêm bước xác nhận riêng khi không cần. Tại ranh giới commit, ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận, sau đó ràng buộc của yêu cầu mới được áp dụng. Nếu lượt xử lý sau đó bị dừng, lỗi hoặc không qua kiểm tra thì deck và ràng buộc quay về baseline vừa được chấp nhận."
- Date: 2026-09-29
- Recorded By: Duy
- Context: "1. Khi prototype hóa UC-004 và BR-010, phát hiện cụm “gửi yêu cầu sửa tiếp” chưa xác định chính xác thời điểm bản chờ duyệt được chấp nhận. 2. Hai cách hiểu khả dĩ là chấp nhận ngay khi user gửi request, hoặc chỉ chấp nhận khi request đã qua clarification/confirmation và thực sự được commit để bắt đầu lượt sửa mới."
- Rationale / Evidence: "1. Chọn thời điểm commit muộn hơn để việc hỏi lại, cảnh báo hoặc hủy request không tự làm thay đổi trạng thái version. \n2. Giữ quyền kiểm soát cho người dùng: Cancel trước khi AI bắt đầu không đồng nghĩa với việc chấp nhận bản đang chờ duyệt. \n3. Tạo ranh giới rõ giữa việc người dùng thể hiện ý định và việc một lượt sửa mới thực sự bắt đầu. 4. Làm rollback và constraint lifecycle dễ xác định hơn: pre-flight không đổi version state, commit mới tạo baseline mới."
- Reopen When: "Khi testing hoặc feedback người dùng cho thấy việc giữ bản ở trạng thái chờ duyệt trong các bước clarification/confirmation gây khó hiểu, hoặc khi lifecycle revision được thay đổi theo cách không còn cần bước implicit accept trước lượt sửa tiếp."
- Requirement chính: "R-024, R-031"
- Assumption chính: "A-013"
- Related Work: "W-028, W-032, W-037"
- Detailed Doc: "DOC-002"
- Quan hệ lật vào D-030 (relations.json): `shapes: [BR-005, BR-010]` từ Business Rules.Related Decisions

#### Bản dịch
```markdown
---
id: D-030
short_name: Chấp nhận bản chờ duyệt tại ranh giới commit
status: Active
date: 2026-09-29
decided_by: Duy
source: []                 # FILL_LATER
addresses: [R-024, R-031]  # cần duyệt addresses hay shapes (mục 7)
assumptions: [A-013]
constraints: []
shapes: [BR-005, BR-010]
documents: [DOC-002]
superseded_by: []
---

## Decision

<!-- BLOCKER D-L01 -->
<!-- Bản dưới chỉ sửa thuật ngữ, chủ ngữ và đánh số; vẫn quá 3 vế (GD-01) và trùng BR-010 mục 3b, 4, 5. Theo phương án A của D-L01, chỉ giữ ý của dòng 1 và 3, các dòng còn lại thay bằng "Chi tiết: BR-010 mục 3b, 4, 5". -->

1. Khi người dùng đang xem bản chờ duyệt và gửi yêu cầu sửa mới, DeckAgent chưa chấp nhận bản chờ duyệt nếu yêu cầu còn cần hỏi lại, cảnh báo hoặc xác nhận.
2. Trong các bước hỏi lại, cảnh báo hoặc xác nhận, nếu người dùng hủy hoặc yêu cầu bị từ chối thì bản hiện tại vẫn là bản chờ duyệt.
3. DeckAgent chấp nhận bản chờ duyệt tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu.
4. Ranh giới commit đạt ngay khi yêu cầu không bị từ chối và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất; nếu còn, ranh giới commit chỉ đạt sau khi các bước này hoàn tất.
5. Khi không còn bước hỏi lại, cảnh báo hoặc xác nhận nào, DeckAgent không thêm bước xác nhận riêng.
6. Tại ranh giới commit, ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận; sau đó DeckAgent áp dụng ràng buộc của yêu cầu mới.
7. Nếu lượt xử lý AI sau ranh giới commit bị dừng, lỗi hoặc không qua kiểm tra kết quả, deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit.

## Context

1. Khi prototype UC-004 và BR-010, team phát hiện cụm "gửi yêu cầu sửa tiếp" chưa xác định thời điểm bản chờ duyệt trở thành bản đã chấp nhận.
2. Câu hỏi cần trả lời: bản chờ duyệt được chấp nhận vào thời điểm nào khi người dùng gửi yêu cầu sửa tiếp.

## Phương án đã xét

| Phương án | Chọn / Loại | Lý do |
|---|---|---|
| Chấp nhận bản chờ duyệt ngay khi người dùng gửi yêu cầu sửa mới | Loại | Việc hỏi lại, cảnh báo hoặc hủy yêu cầu sẽ làm thay đổi trạng thái phiên bản; người dùng hủy trước khi AI bắt đầu vẫn bị tính là đã chấp nhận bản chờ duyệt |
| Chấp nhận tại ranh giới commit, sau khi yêu cầu qua các bước hỏi lại, cảnh báo, xác nhận và lượt sửa mới thực sự bắt đầu | Chọn | Xem Rationale 1–4 |

## Rationale / Evidence

1. Thời điểm commit muộn hơn giúp việc hỏi lại, cảnh báo hoặc hủy yêu cầu không tự làm thay đổi trạng thái phiên bản.
2. Người dùng giữ quyền kiểm soát: hủy yêu cầu trước khi AI bắt đầu không đồng nghĩa với chấp nhận bản chờ duyệt.
3. Có ranh giới giữa việc người dùng gửi yêu cầu sửa và việc một lượt sửa mới thực sự bắt đầu.
4. Việc quay về bản đã chấp nhận và vòng đời của ràng buộc của người dùng dễ xác định hơn: các bước trước ranh giới commit không đổi trạng thái phiên bản; chỉ ranh giới commit tạo bản đã chấp nhận mới.

## Hệ quả

<!-- FILL_LATER -->

## Xác nhận tuân thủ

<!-- FILL_LATER -->

## Reopen When

Khi testing hoặc phản hồi của người dùng cho thấy việc giữ bản chờ duyệt trong các bước hỏi lại và xác nhận gây khó hiểu <!-- BLOCKER D-L02 -->, hoặc khi vòng đời phiên bản thay đổi tới mức lượt sửa tiếp không còn cần bước chấp nhận ngầm bản chờ duyệt.
```

#### Thay đổi
1. `short_name` đặt từ câu Decision (GD-11).
2. Decision: đánh dấu `BLOCKER D-L01` (GD-01 quá 3 vế, GD-10 trùng BR-010); trong lúc chờ, chỉ sửa không đổi nghĩa: tách 7 câu thành danh sách đánh số (GX-14); "bản chờ duyệt được chấp nhận" → "DeckAgent chấp nhận bản chờ duyệt" (GD-01, GX-16); "Trong các bước đó", "chúng" → lặp lại danh từ (GX-17); "khi không cần" → điều kiện cụ thể lấy từ chính câu 4 và BR-010 mục 4 (GX-08 câu thoát); "không qua kiểm tra" → "không qua kiểm tra kết quả" (GX-07); "baseline vừa được chấp nhận" → "bản đã chấp nhận tại ranh giới commit" (GX-07).
3. Context 1: thêm chủ ngữ "team" cho "phát hiện" (GX-16); bỏ "chính xác" để câu trung tính, không đổi nghĩa (GD-02).
4. Context 2: hai cách hiểu chuyển sang `Phương án đã xét` (quyết định 5, GD-03); Context giữ câu hỏi trung tính (GD-02).
5. `Phương án đã xét`: lý do loại phương án 1 chuyển từ Rationale 1 và 2, không thêm ý mới (GD-03).
6. Rationale: "request" → "yêu cầu", "Cancel" → "hủy", "version" → "phiên bản", "rollback" → "quay về bản đã chấp nhận", "constraint lifecycle" → "vòng đời của ràng buộc của người dùng", "pre-flight" → "các bước trước ranh giới commit", "baseline" → "bản đã chấp nhận" (GX-07); "thể hiện ý định" → "gửi yêu cầu sửa", vì glossary định nghĩa "ý định" là chủ đề, mục đích, audience (GX-07); bỏ "rõ" trong "ranh giới rõ" (GX-08); tách dòng 3 và 4 đang dính nhau (GX-14).
7. Reopen When: "feedback" → "phản hồi", "clarification/confirmation" → "hỏi lại và xác nhận", "lifecycle revision" → "vòng đời phiên bản", "implicit accept" → "chấp nhận ngầm" (GX-07); "gây khó hiểu" đánh dấu `BLOCKER D-L02` (GD-07).
8. Quan hệ: Requirement chính → `addresses` gắn cờ (mục 7); `shapes: [BR-005, BR-010]` từ bước lật; `assumptions: [A-013]` giữ theo cách đã xử lý mâu thuẫn trong global-blockers.md.
9. `Hệ quả`, `Xác nhận tuân thủ`, `source` để FILL_LATER (quyết định 3; gợi ý ở mục 3). Bỏ section `Ghi chú` vì trống; Related Work bỏ.

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| D-016.Rationale / Evidence | W-026 | Giữ làm text: "Được thay bằng D-026 sau khi chốt PPTX và PDF và làm rõ hướng tương thích." Bỏ ID là sửa hình thức, hợp GX-15 |
| D-024.Context | W-026 | Giữ làm text: "Cần chốt loại tài liệu có sẵn để Architecture không phải tự đoán." |
| D-024.Rationale / Evidence | L-001 | Giữ làm text: ý "OCR, XLSX/CSV… được giữ làm câu hỏi" chuyển sang `Phương án đã xét` (Loại cho V1, để sau). L-001 cũng được R-003, R-017, R-038, UC-002, UC-024, BR-009 trích; xem mục 6 |
| D-025.Context | W-026 | Giữ làm text: "Cần xác định các loại sửa tối thiểu mà không mở sửa cục bộ hay lịch sử nhiều bản." |
| D-025.Rationale / Evidence | L-002 | Giữ làm text: "đổi phong cách cả deck và hình do AI tạo cần tìm hiểu thêm" → `Phương án đã xét` (Loại cho V1). L-002 cũng được R-018, R-047, UC-017, UC-023, BR-017 trích; xem mục 6 |
| D-026.Context | W-026 | Giữ làm text: "Cần chốt định dạng sửa được và chỉ xem để Architecture và Testing có ranh giới cụ thể." |
| D-027.Context | W-028 | Giữ làm text: "… để Architecture không phải tự giả định triển khai cloud hay lưu trữ lâu dài." |
| D-028.Decision | W-026 | Phụ thuộc G-06 (phương án C của G-06 đã ghi "W-026, W-032 viết lại thành text"). Không tạo blocker mới |
| D-028.Decision | W-032 | Phụ thuộc G-06 |
| D-028.Context | W-028 | Phụ thuộc G-06; nếu giữ: giữ làm text "Architecture" |
| D-028.Rationale / Evidence | W-028 | Phụ thuộc G-06; nếu giữ: giữ làm text "Architecture" |
| D-028.Reopen When | W-032 | Phụ thuộc G-06. Nếu giữ D-028, mất ID làm điều kiện mở lại không còn nguồn quan sát; nên gộp câu hỏi này vào G-06 |

Cột Related Work của cả 26 item (W-xxx) bị bỏ theo bảng ánh xạ, không tính là tham chiếu cần xử lý.

## 6. Ghi chú cho agent chính

1. **D-001 Superseded không có `superseded_by`.** Text chỉ ghi "không còn là định nghĩa chính thức cho sprint hoặc giai đoạn tiếp theo", không nêu Decision thay thế. Không tạo blocker vì D-001 là `project` (XÓA). Nếu người dùng giữ D-001 thì cần blocker GD-09.
2. **G-01 lan sang Decision.** D-006, D-015 (và D-011) có `addresses: R-041`. Nếu G-01 chọn A (xóa R-041) thì bỏ quan hệ này; nếu chọn C (R-041 thành Constraint) thì quan hệ phải chuyển sang `constraints` vì `addresses` chỉ nhận Requirement (GX-03). Nên ghi D-006, D-015, D-011 vào danh sách item của G-01.
3. **D-028, D-011 nếu được giữ.** D-028.Rationale 2 có "Chưa chốt ngưỡng"; D-011 là quy tắc "không chốt". Cả hai sẽ thành `TRANG_THAI` nếu giữ Active. Nên thêm điều này vào phương án giữ của G-06 và G-04 thay vì tạo blocker riêng.
4. **Nguyên tắc dùng ở mục 7.** `shapes` khi Requirement được sinh ra từ Decision (thường có Decision trong `Căn cứ`) hoặc bị Decision đặt scope, thu hẹp hay chọn làm acceptance. Decision phạm vi (D-012, D-013, D-017, D-024…D-027) phần lớn là `shapes`. `addresses` khi Requirement có từ DOC-001 trước và Decision chọn cách đáp ứng, hoặc Decision dựa vào Requirement (ví dụ Reopen When của D-015 dựa vào R-027). Quan hệ yếu được ghi rõ để người dùng cân nhắc bỏ.
5. **Requirement trích Decision trong `Căn cứ` nhưng không có trong "Requirement chính".** Đây là ứng viên `shapes` mà sheet không ghi: R-008, R-009, R-012, R-022 (D-017); R-012, R-034 (D-014); R-014, R-015 (D-015); R-044 (D-025); R-048, R-051 (D-027); R-037 (D-011). Thêm vào là tạo quan hệ mới, nên tôi chưa đưa vào kế hoạch. Agent chính quyết định có hỏi người dùng hay không.
6. **GD-10 ở mức lựa chọn, không thành blocker.** D-024 (R-003, BR-009), D-027 (BR-012), D-009 (BR-007), D-029 (BR-014, R-046), D-025 (BR-011, R-031) phát biểu lựa chọn ở cùng mức với hành vi của R/BR, giống ví dụ D-901 và R-901 trong `_CRITERIA.md`. Xử lý bằng `shapes` và tóm tắt kèm ID. Chỉ D-030 lặp quy tắc chi tiết nên thành blocker D-L01.
7. **GD-01 với D-024…D-028.** Cả năm item có ≤3 vế đánh số nên đạt Lint. Review có thể thấy D-026 vế 3 (mức tương thích PPTX) và D-027 vế 2 (deck chỉ tồn tại trong lần làm việc) là quyết định độc lập. Theo tiêu chí hiện tại tôi không coi là TACH_ITEM.
8. **D-026 vế 3 hoãn mức tương thích PPTX** ("không chốt trước Architecture"). Đây là lựa chọn có chủ đích của Decision, không phải TBD của D-026. Hệ quả nằm ở R-027 ("môi trường đích" chưa định nghĩa). Assessment của requirements nên xử lý.
9. **Từ "dùng được"** xuất hiện ở D-012 (Rationale), D-017, D-025 (Reopen When) và là khái niệm trung tâm của R-021, R-029. Nên gộp với blocker của requirements về định nghĩa "deck dùng được" nếu có. Phần Reopen When đã nằm trong D-L02.
10. **"editor chỉnh slide chuyên nghiệp".** Tôi viết lại D-006 bằng danh sách có sẵn trong Rationale của chính D-006 ("thay thế PowerPoint, Canva hay Figma"). R-041 (nếu còn) và Context của D-015 nên dùng cùng cách diễn đạt.
11. **Thuật ngữ chưa có trong glossary**, Decision đang dùng: "ranh giới commit" (D-030, BR-010), "Critical behavior", "hard acceptance" (D-017, D-018, A-xx), "Hard Gate" (D-028), tên P1–P5 (D-016, D-017, D-028), "AI-first" (D-006, D-012, D-015), "định dạng sửa được / chỉ xem" (D-016, D-026). Gợi ý cho assessment glossary.
12. **Ngày trong văn bản**: D-001 Context "14/09/2026", D-029 Context "27/09/2026" dùng DD/MM/YYYY. `schema.json` chưa khai báo định dạng ngày trong văn bản (GX-18). Tôi giữ nguyên.
13. **Reopen When định tính nhưng không chứa từ trong danh sách GX-08**: D-012 ("không còn đại diện cho hướng sản phẩm"), D-013 ("chỉ tạo mới không đại diện được DeckAgent"). Tôi không đưa vào D-L02. Nếu người dùng chọn phương án B của D-L02 thì nên áp cho cả hai.
14. **D-006 Context 2 và D-015.Decision** cùng nói "chỉnh tay chuyên sâu làm sau khi tải về bằng PowerPoint hoặc công cụ chuyên dụng". Context không phải section quy định nên không tính là trùng sở hữu; D-015 sở hữu phát biểu cho V1.
15. **Tham chiếu L-001, L-002** cũng xuất hiện ở loại khác: L-001 ở R-003, R-017, R-038, UC-002, UC-024, BR-009; L-002 ở R-018, R-047, UC-017, UC-023, BR-017. Mất ID thì mất nơi theo dõi câu hỏi mở về ảnh, theme. Với Decision thì không mất hành vi, nên tôi đề xuất giữ làm text; agent chính nên thống nhất cách xử lý L-001, L-002 giữa các loại.
16. **`short_name` đề xuất** (GD-11, 3–8 từ):
    - D-006: DeckAgent AI-first, không xây editor slide
    - D-007: Vai trò file theo mục đích sử dụng
    - D-008: Deck có sẵn sửa tiếp bằng AI
    - D-009: Độ trung thực tải về theo ý nghĩa
    - D-010: Phân loại nhiều định dạng tải về
    - D-011: Chưa chốt cơ chế khi thiếu evidence
    - D-012: V1 chứng minh luồng tạo deck AI-first
    - D-013: Sửa deck có sẵn để Later
    - D-014: V1 chỉ sửa cả deck
    - D-015: V1 không có editor chỉnh tay web
    - D-016: V1 một định dạng sửa được, một chỉ xem
    - D-017: Critical behavior của V1
    - D-024: Tài liệu có sẵn đầu vào của V1
    - D-025: Các loại sửa cả deck của V1
    - D-026: V1 tải về PPTX và PDF
    - D-027: V1 chạy trên máy, deck theo lần làm việc
    - D-028: Điều kiện thành Hard Gate chất lượng
    - D-029: Người dùng dừng được lượt xử lý AI
    - D-030: Chấp nhận bản chờ duyệt tại ranh giới commit

## 7. Decision cần duyệt addresses hay shapes
| D-ID | Requirement | Đề xuất | Lý do |
|---|---|---|---|
| D-005 | R-041 | bỏ (D-005 XÓA) | Item `project`; quan hệ mất theo |
| D-006 | R-006 | addresses | R-006 có từ DOC-001 FR06; AI-first là cách đáp ứng việc tạo deck |
| D-006 | R-011 | addresses | R-011 có từ FR11; AI-first là cách đáp ứng sửa deck qua chat |
| D-006 | R-029 | addresses | AI-first là cách để người không biết thiết kế tạo được deck (NFR-U01) |
| D-006 | R-041 | shapes | R-041 phát biểu đúng hệ quả "không xây editor" của D-006. Phụ thuộc G-01 (mục 6, ý 2) |
| D-007 | R-003 | addresses | Quan hệ yếu: D-007 quy định cách hiểu vai trò của file mà R-003 nhận; R-003 sinh từ D-024, không từ D-007. Cân nhắc bỏ |
| D-007 | R-004 | shapes | R-004 phát biểu lại D-007 thành hành vi; `Căn cứ` của R-004 có D-007 |
| D-008 | R-005 | shapes | D-008 coi deck có sẵn là sửa tiếp được, tức là capability của R-005. D-008 Closed nên không lan ảnh hưởng |
| D-008 | R-012 | addresses | R-012 (phạm vi lần sửa) không riêng cho deck có sẵn; D-008 không sinh ra R-012 |
| D-008 | R-023 | shapes | R-023 chỉ có nghĩa khi deck có sẵn là sửa được |
| D-009 | R-025 | shapes | R-025 dùng đúng tiêu chí của D-009 (facts, số liệu, thứ tự, ý nghĩa) |
| D-009 | R-026 | addresses | R-026 có từ NFR-O02; D-009 chấp nhận mất mát, R-026 quy định cách xử lý mất mát |
| D-009 | R-028 | addresses | Quan hệ yếu: R-028 nói về xem trước với file tải về, D-009 nói giữa các định dạng |
| D-010 | R-020 | addresses | Quan hệ yếu. Phụ thuộc G-05 |
| D-010 | R-025 | shapes | D-010 xếp độ nhất quán giữa định dạng thành quality requirement, đúng nội dung R-025. Phụ thuộc G-05 |
| D-010 | R-026 | shapes | Cùng lý do với R-025 (NFR-O). Phụ thuộc G-05 |
| D-011 | R-041 | addresses | Quan hệ yếu, nội dung D-011 không liên quan trực tiếp tới editor; cân nhắc bỏ. Phụ thuộc G-04, G-01 |
| D-012 | R-001 | shapes | D-012 đặt phạm vi V1; R-001 thuộc V1 vì luồng tạo mới được chọn. D-012 đổi thì phải xem lại scope của R |
| D-012 | R-006 | shapes | R-006 là lõi của luồng AI-first tạo deck mà D-012 chọn |
| D-012 | R-009 | shapes | Cùng lý do với R-001 |
| D-012 | R-019 | shapes | "Xem trước" là một bước của luồng trong Rationale của D-012 |
| D-012 | R-020 | shapes | "Tải về" là một bước của luồng trong Rationale của D-012 |
| D-012 | R-021 | shapes | Cùng lý do với R-001 |
| D-012 | R-029 | shapes | Cùng lý do với R-001 |
| D-013 | R-005 | shapes | D-013 đưa R-005 về Later; `Căn cứ` của R-005 có D-013 |
| D-013 | R-012 | shapes | D-013 đưa sửa cục bộ trên deck có sẵn ra khỏi V1; R-012 ở Later |
| D-013 | R-023 | shapes | D-013 đưa R-023 về Later; `Căn cứ` của R-023 có D-013 |
| D-014 | R-011 | shapes | D-014 thu hẹp việc sửa qua chat thành sửa cả deck (tên R-011 "Sửa cả deck bằng yêu cầu gõ trong chat") |
| D-014 | R-013 | addresses | Trau chuốt cả deck vốn là sửa cả deck từ FR13; D-014 không thu hẹp R-013 |
| D-015 | R-020 | addresses | D-015 dựa vào tải về đúng bản xem trước làm điểm bàn giao sang chỉnh tay |
| D-015 | R-027 | addresses | Reopen When của D-015 dựa vào việc file PPTX bàn giao dùng được (R-027) |
| D-015 | R-029 | addresses | Không có editor trên web vẫn phải đáp ứng việc người không biết thiết kế dùng được |
| D-015 | R-041 | shapes | `Căn cứ` của R-041 có D-015; R-041 là hệ quả của D-015. Phụ thuộc G-01 |
| D-016 | R-020 | addresses | Closed; D-016 chọn định dạng để đáp ứng việc tải về |
| D-016 | R-025 | addresses | Closed; D-016 chưa chốt định dạng chỉ xem nên không thu hẹp R-025 |
| D-016 | R-026 | addresses | Closed; cùng lý do với R-025 |
| D-016 | R-027 | shapes | Closed; D-016 chốt định dạng sửa được là PPTX, thu hẹp R-027 |
| D-016 | R-028 | addresses | Closed; quan hệ yếu |
| D-017 | R-007 | shapes | D-017 chọn P1 làm hard acceptance của V1; `Căn cứ` của R-007 có D-017 |
| D-017 | R-021 | shapes | D-017 chọn P3 làm hard acceptance |
| D-017 | R-024 | shapes | D-017 chọn P2 làm hard acceptance |
| D-017 | R-025 | shapes | D-017 chọn P5 làm hard acceptance |
| D-017 | R-027 | shapes | Cùng lý do với R-025 (P5) |
| D-017 | R-028 | shapes | Cùng lý do với R-025 (P5) |
| D-018 | R-006 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-019 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-020 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-031 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-032 | bỏ (D-018 XÓA) | Item `project` |
| D-024 | R-003 | shapes | R-003 chép nguyên vế 1 của D-024; `Căn cứ` của R-003 có D-024 |
| D-024 | R-004 | shapes | V1 chỉ nhận vai trò tài liệu có sẵn (BR-001 Exceptions); `Căn cứ` của R-004 có D-024 |
| D-024 | R-007 | addresses | R-007 có từ FR07; chọn loại tài liệu đọc trực tiếp được là cách giữ đúng số liệu (Rationale 1) |
| D-024 | R-008 | addresses | R-008 có từ FR08; D-024 không thu hẹp R-008 |
| D-024 | R-017 | shapes | Vế 3 đưa việc dùng lại ảnh nhúng ra khỏi V1; R-017 ở Later |
| D-024 | R-042 | addresses | Quan hệ yếu; giới hạn loại tài liệu giới hạn dữ liệu cần bảo vệ |
| D-024 | R-043 | addresses | Quan hệ yếu; R-043 áp cho mọi loại tài liệu có sẵn mà D-024 chọn |
| D-025 | R-011 | shapes | Acceptance của R-011 liệt kê đúng 7 loại sửa của D-025; `Căn cứ` có D-025 |
| D-025 | R-013 | shapes | Trau chuốt là một trong 7 loại sửa của D-025; `Căn cứ` có D-025 |
| D-025 | R-024 | addresses | D-025 không đổi nội dung R-024; ràng buộc phải giữ qua mọi loại sửa D-025 chọn |
| D-025 | R-031 | shapes | Vế 2 thu hẹp việc quay lại thành một bước về bản đã chấp nhận gần nhất; `Căn cứ` có D-025 |
| D-026 | R-020 | addresses | D-026 chọn định dạng; R-020 (tải về đúng bản xem trước) không bị thu hẹp |
| D-026 | R-025 | shapes | D-026 thu hẹp "các định dạng" thành PPTX và PDF (tên R-025) |
| D-026 | R-026 | addresses | R-026 có từ NFR-O02; định dạng D-026 chọn quyết định phần nào không giữ được |
| D-026 | R-027 | shapes | R-027 ghi "tạo file PPTX và PDF", đúng lựa chọn của D-026 |
| D-026 | R-028 | addresses | R-028 có từ NFR-O04; D-026 không thu hẹp R-028 |
| D-027 | R-031 | addresses | Quan hệ yếu; R-031 áp trong lần làm việc mà D-027 giới hạn |
| D-027 | R-042 | addresses | Chạy trên máy người dùng là cách đáp ứng bảo vệ dữ liệu (Ghi chú của R-042 trích D-027) |
| D-027 | R-045 | shapes | R-045 sinh ra vì deck chỉ tồn tại trong lần làm việc; `Căn cứ` của R-045 chỉ có D-027 |
| D-028 | R-007 | shapes | D-028 quyết định tiêu chí nào thành Hard Gate. Phụ thuộc G-06 |
| D-028 | R-021 | shapes | Cùng lý do với R-007. Phụ thuộc G-06 |
| D-028 | R-025 | shapes | Cùng lý do với R-007. Phụ thuộc G-06 |
| D-028 | R-027 | shapes | Cùng lý do với R-007. Phụ thuộc G-06 |
| D-028 | R-028 | shapes | Cùng lý do với R-007. Phụ thuộc G-06 |
| D-029 | R-046 | shapes | R-046 sinh ra từ D-029 (Context 2: chưa có Requirement nào); `Căn cứ` của R-046 chỉ có D-029 |
| D-030 | R-024 | addresses | D-030 chọn thời điểm commit để giữ đúng ràng buộc của người dùng qua lần sửa tiếp (Rationale 4); R-024 không đổi nội dung |
| D-030 | R-031 | addresses | D-030 chọn ranh giới commit làm cách xác định "bản đã chấp nhận gần nhất" khi lượt xử lý lỗi |
