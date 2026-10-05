# Rewrite log: actors (Pha B, bước B4)

Item đã viết: ACT-001, ACT-002, ACT-003.

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| ACT-001 | Goal | 1. Có deck dùng được mà không phải tự dựng từng slide hay tự căn từng thành phần. 2. Mô tả mục tiêu và đưa tài liệu cần thiết để AI làm phần lớn công việc. 3. Vẫn kiểm soát kết quả: xem trước, giữ hoặc bỏ, và yêu cầu sửa tiếp. | Người dùng muốn có deck dùng được mà không phải tự dựng từng slide hay tự căn từng thành phần, bằng cách mô tả ý định và đưa tài liệu có sẵn cần thiết để AI làm phần lớn công việc. Người dùng vẫn kiểm soát kết quả: xem trước, giữ hoặc bỏ, và gửi yêu cầu sửa tiếp. | GACT-03 (gộp 3 ý thành 2 câu), P1c (thuật ngữ "deck dùng được"), GX-07 ("mục tiêu" → "ý định", "tài liệu" → "tài liệu có sẵn"), GX-16 |
| ACT-001 | Needs / Pain Points 3 | Khi dùng AI, dễ gặp: AI quên yêu cầu ban đầu, làm sai thông tin từ tài liệu, sửa một chỗ làm hỏng chỗ khác, kết quả không nhất quán. | Khi dùng AI, dễ gặp: AI quên yêu cầu ban đầu, làm sai thông tin từ tài liệu có sẵn, sửa một chỗ làm hỏng chỗ khác, kết quả không nhất quán. | GX-07, PLAN.md mục 4 (ACT-001) |
| ACT-001 | Knowledge / Context 2 | Không nhất thiết biết cách chuyển những điều đó thành bố cục và thiết kế. | Không nhất thiết biết cách chuyển mục đích, audience và nội dung của deck thành bố cục và thiết kế. | GX-17 (thay "những điều đó" bằng danh từ của Knowledge 1) |
| ACT-001 | Permissions / Capabilities 1 | Gõ mục tiêu, audience, nội dung mong muốn và góp ý. | Gõ yêu cầu trong chat, gồm ý định, nội dung mong muốn và góp ý (UC-001, UC-002, UC-004). | GX-07, PLAN.md mục 4 (ACT-001), BLK-021 (ghi ID Use Case) |
| ACT-001 | Permissions / Capabilities 2 | Đưa tài liệu có sẵn thuộc loại hệ thống nhận. | Đưa tài liệu có sẵn thuộc loại hệ thống nhận (UC-002). | BLK-021 |
| ACT-001 | Permissions / Capabilities 5 (gốc 3) | Xem trước, giữ hoặc bỏ kết quả, yêu cầu sửa tiếp hoặc tải về. | Xem trước deck, giữ hoặc bỏ bản chờ duyệt, gửi yêu cầu sửa tiếp hoặc tải về (UC-015, UC-004, UC-013, UC-008). | GX-07 ("kết quả" được giữ hoặc bỏ là bản chờ duyệt), BLK-021 |
| ACT-001 | Permissions / Capabilities (gốc 4) | Quyết định khi nào deck dùng được. | — (bỏ) | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 3 | — (thêm mới) | Trả lời hoặc hủy khi hệ thống hỏi lại (UC-001, UC-002, UC-004, UC-007, UC-023). | BLK-021 (P6), BLK-053 (nhánh hủy khi được hỏi lại) |
| ACT-001 | Permissions / Capabilities 4 | — (thêm mới) | Dừng lượt xử lý AI đang chạy (UC-001, UC-002, UC-004, UC-014). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 6 | — (thêm mới) | Chọn tiếp tục hoặc hủy khi hệ thống cảnh báo (UC-003, UC-004, UC-008, UC-010, UC-011, UC-017, UC-018). | BLK-021 (P6), BLK-052 (cảnh báo rời trang ở UC-011) |
| ACT-001 | Permissions / Capabilities 7 | — (thêm mới) | Bắt đầu deck mới (UC-011). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 8 | — (thêm mới) | Đưa deck có sẵn để AI sửa tiếp và giữ nguyên bố cục gốc (UC-003). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 9 | — (thêm mới) | Đưa deck mẫu để AI học theo cấu trúc, bố cục hoặc giọng văn (UC-007). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 10 | — (thêm mới) | Đăng nhập và đăng xuất (UC-009, UC-010). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 11 | — (thêm mới) | Chọn deck đã lưu làm điểm xuất phát cho deck mới (UC-012). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 12 | — (thêm mới) | Xem, sửa hoặc xác nhận dàn ý, hoặc bỏ qua bước duyệt dàn ý (UC-016). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 13 | — (thêm mới) | Chọn theme, hoặc tải lên màu, font và logo của bộ nhận diện (UC-017). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 14 | — (thêm mới) | Xem và xóa tài liệu đã tải lên (UC-018). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 15 | — (thêm mới) | Chia sẻ deck qua link, thu hồi link, hoặc trình chiếu deck trong trình duyệt (UC-019). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 16 | — (thêm mới) | Xem danh sách deck đã lưu; mở lại, đổi tên hoặc xóa deck đã lưu (UC-021). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 17 | — (thêm mới) | Xem các bản cũ của deck và khôi phục một bản (UC-022). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 18 | — (thêm mới) | Chọn slide hoặc thành phần rồi gửi yêu cầu sửa cục bộ (UC-023). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 19 | — (thêm mới) | Thêm, xóa, nhân bản, sắp xếp slide; thêm hoặc thay hình ảnh trong slide (UC-024). | BLK-021 (P6) |
| ACT-001 | Permissions / Capabilities 20 | — (thêm mới) | Chọn ngôn ngữ đích và yêu cầu dịch cả deck (UC-025). | BLK-021 (P6) |
| ACT-001 | Constraints 1 | Không bắt buộc có kỹ năng thiết kế chuyên nghiệp. | Không cần kỹ năng thiết kế (R-029). | BLK-036 (P3) |
| ACT-001 | Constraints 2 | DeckAgent không thay thế toàn bộ PowerPoint, Canva hay Figma; chỉnh sâu làm bằng công cụ chuyên dụng sau khi tải về. | Chỉnh tay chuyên sâu làm bằng `PowerPoint` hoặc công cụ chuyên dụng sau khi tải về (D-006, D-015). | BLK-036 (P3), BLK-069 (backtick cho tên sản phẩm) |
| ACT-001 | Constraints 3 | Không có cộng tác thời gian thực hay nhiều người cùng sửa một deck. | V1 không có cộng tác hay nhiều người cùng sửa một deck (D-027). | BLK-036 (P3), Q3 (chỉ áp cho V1) |
| ACT-002 | Goal | Nhận yêu cầu từ DeckAgent và trả kết quả tạo hoặc sửa nội dung deck. | Nhận dữ liệu hệ thống gửi trong một lượt xử lý AI và trả kết quả tạo hoặc sửa nội dung deck. | GX-07 ("yêu cầu" là nội dung người dùng gõ; "lượt xử lý AI"), BLK-068 |
| ACT-002 | Hành vi lỗi 1–4 (từ Needs 1) | DeckAgent phải xử lý được khi nhà cung cấp chậm, lỗi, trả kết quả sai định dạng hoặc thay đổi hành vi giữa các phiên bản model. | 1. Không trả kết quả trong ngưỡng quá thời gian của R-032. 2. Trả lỗi thay vì kết quả, hoặc không kết nối được (R-032). 3. Trả kết quả sai định dạng. 4. Thay đổi hành vi giữa các phiên bản model. | GACT-05, P1a và BLK-001 ("chậm" gộp vào "quá thời gian", R-032 sở hữu ngưỡng), BLK-047 (quá thời gian và lỗi kết nối là hai cách hỏng riêng); vế "DeckAgent phải xử lý được" bỏ vì đã nằm trong định nghĩa section `Hành vi lỗi` (GX-10) |
| ACT-002 | Hành vi lỗi 1, 2 (từ Constraints 1) | Có thể lỗi hoặc quá thời gian (R-032). | Gộp vào Hành vi lỗi 1 và 2 (xem dòng trên). | GACT-05, P1a |
| ACT-002 | Needs / Pain Points 2 | Kết quả của AI không được tự động trở thành bản đã chấp nhận. | — (bỏ; ý chuyển vào Permissions / Capabilities 3) | BLK-037 (P3) |
| ACT-002 | Needs / Pain Points | (2 dòng gốc) | `<!-- điền sau: FILL_LATER -->` (section trống sau khi Needs 1 chuyển sang `Hành vi lỗi` và Needs 2 bị bỏ) | APPLY.md mục 3 (ACT-002) |
| ACT-002 | Knowledge / Context 1 | Chỉ biết những gì DeckAgent gửi đi. | Chỉ biết dữ liệu hệ thống gửi đi. | GX-17, BLK-068 |
| ACT-002 | Knowledge / Context 2 | Nội dung người dùng gửi ra ngoài phải giới hạn trong phạm vi thiết kế cho phép (R-042). | Chỉ nhận phần nội dung người dùng mà R-042 cho phép gửi ra ngoài. | GX-10 (R-042 sở hữu phạm vi), GX-16, GX-08 |
| ACT-002 | Permissions / Capabilities 1 | Chỉ trả kết quả; không trực tiếp thay đổi bản đã chấp nhận, vì kết quả phải qua bước kiểm tra (R-033). | 1. Trả kết quả tạo hoặc sửa nội dung deck cho hệ thống (UC-001, UC-002, UC-004, UC-007, UC-016, UC-017, UC-023, UC-024, UC-025). 3. Không trực tiếp thay đổi bản đã chấp nhận; kết quả chỉ thành bản chờ duyệt hoặc bản đã chấp nhận sau kiểm tra kết quả (R-033), theo BR-010. | BLK-021 (ghi ID Use Case), BLK-037 (câu 3 đúng chữ ô Quyết định), GX-14; bỏ chữ "Chỉ" ở câu 1: xem "Không áp rõ" 1 |
| ACT-002 | Permissions / Capabilities 2 | — (thêm mới) | Hỏi lại người dùng khi tài liệu có sẵn thiếu thông tin cho nội dung được yêu cầu (UC-002). | BLK-021 (P6) |
| ACT-002 | Constraints 1 (gốc 2) | Thời gian phản hồi và chi phí chưa được đo (D-011). | Thời gian phản hồi và chi phí của AI model hoặc nhà cung cấp AI chưa được đo. | BLK-030 (bỏ trích D-011), APPLY.md mục 5, GX-16 |
| ACT-002 | Constraints 2 (gốc 3) | V1 không cần hỗ trợ nhiều nhà cung cấp (R-040). | V1 không cần hỗ trợ nhiều nhà cung cấp AI (R-040). | GX-17 |
| ACT-002 | Ghi chú 1 | Là nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về. | — (bỏ section) | GX-12 (tóm tắt lại `Hành vi lỗi`), GACT-07 (nhóm Use Case do công cụ sinh), PLAN.md mục 4 (ACT-002) |
| ACT-003 | Knowledge / Context | 1. Hiểu cách tổ chức phân quyền; không cần kiến thức thiết kế deck. | 1. Hiểu cách tổ chức phân quyền. 2. Không cần kiến thức thiết kế deck. | GX-14 |
| ACT-003 | Permissions / Capabilities | 1. Tạo, khóa, mở khóa và xóa tài khoản. | 1. Xem danh sách tài khoản (UC-020). 2. Tạo tài khoản (UC-020). 3. Khóa tài khoản (UC-020). 4. Mở khóa tài khoản (UC-020). 5. Xóa tài khoản (UC-020). | GACT-04 (mỗi việc một dòng), BLK-021 (thêm "Xem danh sách tài khoản (UC-020)", ghi ID Use Case) |
| ACT-003 | Constraints 1 | Chỉ tồn tại khi DeckAgent có tài khoản. | Quản trị viên tài khoản chỉ tồn tại khi hệ thống có tài khoản. | GX-16, BLK-068 |
| ACT-003 | Ghi chú 1 | Chưa có trong V1 vì V1 không có tài khoản (D-027). | Quản trị viên tài khoản chưa có trong V1 vì V1 không có tài khoản (D-027). | GX-16 |

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| ACT-001, ACT-002, ACT-003 | Goal, Needs / Pain Points, Knowledge / Context, Permissions / Capabilities, Constraints | Section cùng tên |
| ACT-001, ACT-003 | Notes | `Ghi chú` |
| ACT-001 | Notes 1 ("Là actor được DOC-001 mô tả rõ nhất.") | `source: ["DOC-001"]`; câu bị bỏ khỏi `Ghi chú` vì `Ghi chú` không ghi nguồn (GX-11, GX-12, PLAN.md mục 4) |
| ACT-001 | Notes 2 | `Ghi chú` 1 (đánh số lại) |
| ACT-002 | Needs / Pain Points 1, Constraints 1 | `Hành vi lỗi` (viết lại, xem bảng trên) |

Cột bỏ: Type (đã thành `kind` trong khung B3, GACT-02); Related Use Cases (do công cụ sinh từ `primary_actor` và `supporting_actors` của Use Case, GACT-07).

Field frontmatter: `source` của ACT-001 điền `["DOC-001"]` từ Notes 1. `source` của ACT-002 và ACT-003 để `[]` theo FILL_LATER. Schema của Actor không có `short_name`.

## Sửa quan hệ

Không có. Actor chỉ có `source`.

## Cần sửa ở loại khác

1. UC-003 (use-cases): `supporting_actors` có ACT-002 nhưng không bước nào của UC-003 cho ACT-002 làm việc; bước sửa đi qua UC-004. Cần xác nhận giữ ACT-002 (kèm lý do) hay bỏ. Vì vậy Permissions 1 của ACT-002 không ghi UC-003.
2. UC-014 (use-cases): ACT-002 chỉ xuất hiện ở nhánh lỗi 2B; Trigger gồm cả lượt tạo file tải về, mà UC-008 bước 4 không gọi AI. Nhánh của ACT-002 nên chỉ áp cho lượt xử lý AI tạo hoặc sửa deck. Permissions 1 của ACT-002 không ghi UC-014.
3. UC-001, UC-002, UC-004, UC-014 (use-cases): `Hành vi lỗi` 2 của ACT-002 gồm cả "trả lỗi thay vì kết quả" (lỗi máy chủ, vượt giới hạn tần suất theo P1a) và "không kết nối được". Điều kiện của nhánh "lỗi kết nối" (BLK-047) nên bao cả hai, ví dụ "ACT-002 trả lỗi hoặc không kết nối được".
4. UC-001, UC-002, UC-004, UC-014 (use-cases): nhánh "Kết quả không qua kiểm tra" ghi rõ có gồm kết quả sai định dạng (`Hành vi lỗi` 3); Ghi chú ghi lý do bỏ qua `Hành vi lỗi` 4 (BLK-047).
5. UC-020 (use-cases): nhánh 2A "xóa tài khoản còn deck thì deck bị xóa theo" lệch với ACT-003 Needs 1 "không can thiệp vào nội dung deck" (assess-actors mục 6 ý 8). UC-020 là Draft; nên đối chiếu khi viết.
6. UC-019 (use-cases): bước 3 "Người xem mở link và xem deck" dùng một vai trò chưa có actor. Cần thêm actor hoặc viết lại bước. UC-019 là Draft.
7. UC-002 nhánh 5A (use-cases): chủ ngữ "AI hỏi người dùng" khớp ACT-002 Permissions 2; ACT-001 trả lời theo Permissions 3. Không cần đổi chủ ngữ sang "Hệ thống".

## Không áp rõ

1. **ACT-002 Permissions 1: chữ "Chỉ".** Sheet ghi "Chỉ trả kết quả"; BLK-021 thêm "Hỏi lại người dùng … (UC-002)". Giữ "Chỉ trả kết quả" thì hai dòng mâu thuẫn nhau.
   - Phương án: (a) bỏ "Chỉ"; danh sách Permissions đã đóng theo GACT-08, và ý "không tự thay đổi bản đã chấp nhận" nằm ở dòng 3 (BLK-037); (b) giữ "Chỉ trả kết quả" và thêm dòng hỏi lại, chấp nhận mâu thuẫn chữ; (c) đổi chủ ngữ UC-002 5A sang "Hệ thống" (phương án C của BLK-021, ô Quyết định không chọn).
   - Đã làm (a). Đề xuất: giữ (a).
2. **ACT-002 Constraints 1: "chưa được đo" sau khi bỏ D-011.** Câu không còn item sở hữu. Ngưỡng quá thời gian nay là ngưỡng tạm ở R-032 (P1a), nên "thời gian phản hồi chưa được đo" vẫn đúng nhưng dễ đọc nhầm là chưa có ngưỡng.
   - Phương án: (a) giữ câu, bỏ ID (đã làm, gần chữ sheet nhất); (b) viết "Chi phí chưa được đo; ngưỡng quá thời gian là ngưỡng tạm của R-032"; (c) bỏ dòng.
   - Đề xuất: (b), cần người dùng xác nhận vì thêm thông tin.
3. **ACT-002 Hành vi lỗi 2: "lỗi" của sheet và "lỗi kết nối" của BLK-047.** Sheet ghi "lỗi" chung; ô Quyết định gọi cách hỏng này là "lỗi kết nối". Đã gộp hai ý vào một dòng: "Trả lỗi thay vì kết quả, hoặc không kết nối được (R-032)".
   - Phương án: (a) một dòng như đã làm, khớp một nhánh Use Case; (b) tách thành hai dòng, mỗi dòng một test fault injection.
   - Đề xuất: (a), vì Use Case có một nhánh cho cả hai (BLK-047).
