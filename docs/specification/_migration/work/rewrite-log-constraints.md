# Rewrite log: constraints (Pha B, bước B4)

Item đã viết: C-001, C-002, C-003, C-004, C-005. C-006, C-007 đã xóa (`APPLY.md` mục 5), không có file.

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| C-001 | Constraint | DeckAgent là công cụ làm deck theo hướng AI-first, không phải editor chỉnh slide chuyên nghiệp; thiết kế chuyên sâu làm bằng PowerPoint hoặc công cụ chuyên dụng sau khi tải về. | Hệ thống là công cụ làm deck theo hướng AI-first, không phải editor chỉnh slide chuyên nghiệp; thiết kế chuyên sâu làm bằng `PowerPoint` hoặc công cụ chuyên dụng sau khi tải về. | BLK-068, BLK-069, GX-15 (chỉ hình thức) |
| C-001 | Lý do không đổi được 1 | Nếu DeckAgent cung cấp khả năng chỉnh sửa ngang PowerPoint, Canva hoặc Figma, phạm vi sản phẩm và implementation tăng rất mạnh. | Nếu hệ thống cung cấp khả năng chỉnh sửa ngang `PowerPoint`, `Canva` hoặc `Figma`, phạm vi sản phẩm và implementation tăng rất mạnh. | BLK-068, BLK-069, GX-15 |
| C-001 | Ghi chú 2 | DOC-001 xác định DeckAgent không nhằm trở thành bản sao PowerPoint, Canva hay Figma. | DOC-001 xác định hệ thống không nhằm trở thành bản sao `PowerPoint`, `Canva` hay `Figma`. | BLK-068, BLK-069, GX-15 |
| C-001 | Ghi chú 3 | Retired ngày 27/09/2026: đây là lựa chọn của team, không phải giới hạn từ bên ngoài (OR-045); nội dung đã được ghi ở D-006 và D-015. | Retired ngày 2026-09-27: đây là lựa chọn của team, không phải giới hạn từ bên ngoài; nội dung đã được ghi ở D-006 và D-015. | GX-18, PLAN.md mục 7 (bỏ OR-045), GX-15 |
| C-002 | Constraint | Implementation phải vừa với nguồn lực của một đồ án Software Engineering; Architecture không được đòi team xây các hệ thống con quá lớn chỉ để đạt kết quả cốt lõi của sản phẩm. | 1. Implementation phải vừa với nguồn lực của một đồ án Software Engineering. 2. Architecture không được đòi team tự xây một hệ thống con thuộc danh sách đóng ở `Lý do không đổi được` mục 2 chỉ để đạt kết quả cốt lõi của sản phẩm. | BLK-003 (P2), GC-02, GC-08, GX-14 |
| C-002 | Lý do không đổi được 2 | Một Architecture buộc team tự xây editor hoàn chỉnh, bản sao PowerPoint, cộng tác thời gian thực, hạ tầng SaaS phân tán hoặc design system lớn có thể đúng về lý thuyết nhưng không khả thi trong project này. | Một Architecture buộc team tự xây một trong 5 hệ thống con sau có thể đúng về lý thuyết nhưng không khả thi trong project này. Danh sách đóng: 1. editor hoàn chỉnh; 2. bản sao `PowerPoint`; 3. cộng tác thời gian thực; 4. hạ tầng SaaS phân tán; 5. design system lớn. | BLK-003 (P2), GX-14, BLK-069 |
| C-002 | Review Trigger | Review nếu nguồn lực, thời gian hoặc phạm vi đồ án thay đổi rõ rệt. | Nguồn lực, thời gian hoặc phạm vi của đồ án thay đổi. | GC-06, GX-08, PLAN.md mục 4 (C-002) |
| C-002 | Ghi chú 1 | Là constraint nền khi so sánh candidate architecture. | C-002 là Constraint nền khi so sánh candidate architecture. | GX-16 |
| C-003 | Ghi chú 1 | D-026 không biến mọi định dạng ứng viên thành hard acceptance của V1 đầu tiên. | D-026 không biến mọi định dạng ứng viên thành điều kiện nghiệm thu bắt buộc của V1 đầu tiên. | PLAN.md mục 4 (C-003), GX-07, GX-15 (thuật ngữ) |
| C-003 | Ghi chú 2 (từ Lý do 2) | V1 đầu tiên dùng PPTX và PDF. | V1 tải về PPTX và PDF (D-026). | BLK-038 (P3) |
| C-003 | Ghi chú 3 | — (thêm mới) | Retired 2026-10-03: danh sách định dạng tải về là lựa chọn của team (D-031), không phải giới hạn áp từ bên ngoài. | APPLY.md mục 2, Q1 |
| C-004 | Constraint | Các định dạng tải về có khả năng khác nhau; hệ thống không được giả định mọi định dạng đều giữ cùng mức khả năng sửa, tương tác, animation hoặc cách hiển thị. | Hệ thống không được giả định mọi định dạng tải về đều giữ cùng mức khả năng sửa, tương tác, animation hoặc cách hiển thị. | PLAN.md mục 4 (C-004), GC-02 |
| C-004 | Lý do không đổi được 1 | PPTX, PDF, HTML, ảnh, video và các định dạng khác vốn không có cùng khả năng. | Các định dạng file, ví dụ PPTX, PDF, HTML, ảnh và video, vốn không có cùng khả năng. | PLAN.md mục 4 (C-004), GX-08 (cụm mở) |
| C-004 | Ghi chú 2 (từ Lý do 2) | Vì vậy yêu cầu nhất quán phải tập trung vào nội dung, số liệu, mạch trình bày và ý nghĩa, không đòi mọi file giống hệt nhau. | Phạm vi nhất quán giữa các định dạng tải về do R-025 quy định. | BLK-038 (P3) |
| C-004 | Review Trigger | Review khi danh sách định dạng tải về hoặc khả năng của chúng thay đổi. | Danh sách định dạng tải về (D-031) hoặc khả năng của các định dạng tải về thay đổi. | APPLY.md mục 2, GX-17, GC-06 |
| C-004 | Ghi chú 1 | DOC-001 chủ động không yêu cầu giống từng pixel, cùng font, cùng khả năng sửa, cùng tương tác hoặc cùng animation giữa các file. | Theo BR-007, các file tải về của cùng một deck không bắt buộc giống nhau về pixel, font, khả năng sửa, tương tác hoặc animation. | GX-12 (bỏ "DOC-001 chủ động"), GX-10 và P3 (BR-007 sở hữu quy tắc) |

C-005: không viết lại câu nào (GX-15).

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| C-001, C-002, C-003, C-004, C-005 | Căn cứ | `source` (danh sách mã nguồn, GX-11) |
| C-001, C-002, C-003, C-004, C-005 | Reason / Context | `Lý do không đổi được` |
| C-001, C-002, C-003, C-004, C-005 | Constraint, Review Trigger, Ghi chú | Section cùng tên |
| C-002 | Ghi chú 2 ("DOC-001 coi Architecture không khả thi trong phạm vi đồ án là Architecture không đạt.") | `Lý do không đổi được` mục 3 (PLAN.md mục 4: GX-12, GC-03) |
| C-003 | Reason / Context 3 | `Lý do không đổi được` mục 2 (đánh số lại sau khi Lý do 2 chuyển sang Ghi chú) |

Cột bỏ: Impacts (bảng ánh xạ của Pha A); Related Requirements, Related Decisions (đã lật thành field quan hệ ở item nguồn, GX-05).

Field frontmatter đã điền: `short_name` của 5 item theo tên đề xuất ở PLAN.md mục 4. `imposed_by` để `""`: C-002, C-004 theo FILL_LATER; C-001, C-003, C-005 vì Closed (xem "Không áp rõ" 4).

## Sửa quan hệ

Không có. Khung đã đúng: C-001..C-005 chỉ có `source`; C-003 đã Retired trong khung; `D-015.constraints: [C-002]` đã có (BLK-020).

## Cần sửa ở loại khác

1. BR-007 (business-rules): Ghi chú 1 của C-004 tóm tắt quy tắc "không bắt buộc giống nhau về pixel, font, khả năng sửa, tương tác hoặc animation" kèm ID BR-007. Câu Rule của BR-007 cần giữ đủ 5 thứ này; nếu bớt, Ghi chú của C-004 phải sửa theo.
2. D-031 (decisions): Context cần có ý "advisor khuyến khích thêm định dạng khi khả thi" lấy từ Lý do 2 (Lý do 3 ở sheet) của C-003 (Q1, APPLY.md mục 2). C-003 giữ câu này vì đã Closed.

## Không áp rõ

1. **C-002: vị trí danh sách đóng.** BLK-003 ghi "Lý do 2 của C-002 thành danh sách đóng", còn GC-02 đòi section `Constraint` nêu ranh giới.
   - Phương án: (a) giữ danh sách ở Lý do 2, câu Constraint trỏ tới; (b) chuyển danh sách vào câu Constraint, Lý do 2 chỉ giữ lý do.
   - Đã làm (a), gần chữ sheet và chữ quyết định nhất. Đề xuất: (b) nếu người review muốn đọc được ranh giới chỉ từ section `Constraint`.
2. **C-002: "design system lớn".** Phương án A của BLK-003 đề nghị làm rõ chữ "lớn", nhưng ô Quyết định giữ nguyên cụm. Đã giữ nguyên cụm. GC-08 có thể bị nêu ở Review.
   - Đề xuất: người dùng nêu ranh giới, ví dụ số thành phần, hoặc chấp nhận cụm này như tên một loại hệ thống con.
3. **C-002, C-004 (Active) thiếu `imposed_by` và `Cách kiểm tuân thủ`.** FILL_LATER để trống cả hai, nên GC-01 (CI: `imposed_by` không rỗng từ Proposed) và GC-05 sẽ trượt. Đây là việc PLAN.md mục 8 ý 1 để ngỏ.
   - Phương án: điền theo gợi ý của FILL_LATER sau khi người dùng xác nhận; chấp nhận CI đỏ ở PR migrate; hạ status.
   - Đề xuất: điền theo gợi ý ở B5 sau khi người dùng xác nhận. Gợi ý của C-002 phải đổi "ranh giới chốt ở BLK-003" thành "danh sách đóng ở Lý do 2". Gợi ý của C-004 ("PPTX, PDF") phải mở rộng theo 4 định dạng của D-031.
4. **Item Closed (C-001, C-003, C-005): `imposed_by` và `Cách kiểm tuân thủ`.** Template không cho xóa `Cách kiểm tuân thủ`, và chưa có quy ước cho section mới ở item Closed. Đã giữ heading, thân trống, `imposed_by: ""`.
   - Riêng C-003: FILL_LATER còn 2 dòng (`imposed_by` "Không để trống: chuyển từ cột Constraint"; `Cách kiểm tuân thủ`). Hai dòng này viết khi C-003 còn Active. Đã không áp vì C-003 nay Closed và Q1 xác định danh sách định dạng không do bên ngoài áp đặt.
   - Đề xuất: B5 bỏ 2 dòng C-003 khỏi `_FILL_LATER.md`; đặt một quy ước chung cho mọi loại (giữ heading trống, hoặc bỏ section mới ở item Closed).
5. **C-003: không viết lại câu theo bản dịch thử của Pha A.** Bản dịch thử (đổi chủ ngữ sang DeckAgent, tách vế "không phải vấn đề người dùng…" sang Ghi chú) viết khi C-003 còn Active. Sau Q1, C-003 là Closed nên chỉ sửa hình thức (GX-15). Câu Constraint, Lý do và Review Trigger giữ nguyên chữ sheet.
6. **Mức "hình thức" ở item Closed.** Ở C-001 đã đổi "DeckAgent" → "hệ thống" (BLK-068), thêm backtick cho tên sản phẩm (BLK-069), đổi ngày sang `YYYY-MM-DD` (GX-18). Đã giữ đại từ "Điều đó" ở Lý do 2 và "đây" ở Ghi chú 3, vì GX-17 chỉ áp từ Proposed.
   - Nếu người review coi việc đổi tên hệ thống là vượt GX-15, trả "hệ thống" về "DeckAgent" ở 3 câu của C-001.
