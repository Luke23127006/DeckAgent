# Brief chung cho subagent dịch nội dung (Pha B, bước B4)

Bạn dịch nội dung **một loại item** từ dữ liệu sheet cũ vào các file khung đã có trong `docs/specification/0X-<loại>/`. Khung (frontmatter, quan hệ, heading) do `tools/spec/scaffold_spec.py` sinh ở B3. Bạn viết thân các section và các field frontmatter còn trống.

Repo chạy trên Windows. Đọc và ghi UTF-8, xuống dòng LF. Dùng công cụ Read/Edit/Write; nếu dùng Python thì dùng `pathlib` và `newline="\n"`.

## Đầu vào (đọc trước khi viết)

Mọi đường dẫn tính từ gốc repo `C:\Users\Duy\Desktop\DeckAgent`. `M` = `docs/specification/_migration`.

1. `docs/specification/_COMMON_CRITERIA.md` (gồm mục 7: ngưỡng tạm), rồi `_CRITERIA.md` và `_TEMPLATE.md` trong folder của loại bạn.
2. `docs/specification/schema.json`: enum, field bắt buộc, `required_sections`, `section_order`.
3. `M/DECISIONS.md`: nguồn quyết định của người dùng (P0–P9, Q1–Q3).
4. `M/APPLY.md`: quyết định đã áp xuống item. Mục 1 status; mục 2 thay đổi theo Q1; mục 3 mâu thuẫn đã giải; mục 4 ID mới; mục 6 quan hệ; **mục 7 trả lời của người dùng cho 3 điểm cần xem, gồm bảng sự kiện xem lại của ngưỡng tạm**.
5. `M/BLOCKERS.md`: ô `Quyết định:` của từng blocker. Blocker liên quan tới từng item ghi ở cột Blocker của `M/PLAN.md` mục 4.
6. `M/PLAN.md` mục 4 (dòng của loại bạn: kế hoạch dịch từng item) và mục 5 (mẫu dịch thử của loại bạn).
7. `M/work/assess-<loại>.md`: đánh giá chi tiết và bản dịch thử của Pha A. Bản dịch thử được viết **trước** khi có quyết định; nếu khác `DECISIONS.md`, `APPLY.md` hay ô Quyết định thì theo quyết định.
8. `M/FILL_LATER.md`: field và section để trống.
9. Dữ liệu gốc: `M/work/items/<loại>.json` (key là tên cột sheet). Dữ liệu loại khác cũng ở `M/work/items/`.
10. Thuật ngữ: `docs/specification/glossary.md` (quy ước đọc bảng) và danh sách thuật ngữ sẽ đưa vào glossary ở B5: `M/work/items/glossary.json`, các cột `_term`, `_definition`, `_not_use` (bỏ GL-025). Dùng đúng cột `_term`; không dùng từ ở `_not_use`, theo điều kiện trong ngoặc nếu có.
11. File của các loại đã dịch trước bạn (thứ tự: constraints, actors, assumptions, use-cases, business-rules, requirements, decisions). Bạn được tham chiếu tới chúng.

## Quy tắc dịch

1. **Không đổi nghĩa, không thêm thông tin.** Ngoại lệ duy nhất là giá trị mà `DECISIONS.md`, `APPLY.md` (gồm mục 7) hoặc ô Quyết định trong `BLOCKERS.md` cho phép: con số tạm, định nghĩa, danh sách, hành vi mới của P2 và P6, nội dung của Q1, trả lời CX-1, CX-2, CX-3.
2. **Ngưỡng tạm:** mọi con số chưa có evidence mang nhãn đúng định dạng `<giá trị> [tạm 2026-10-03 · xem lại: <sự kiện>]`. Sự kiện lấy đúng chữ trong bảng "Sự kiện xem lại của ngưỡng tạm" ở `APPLY.md` mục 7 (giới hạn đầu vào: "lần benchmark đầu tiên với tài liệu thật").
3. **Điền sau:** field hoặc section mà `FILL_LATER.md` ghi "điền sau" thì giữ heading (hoặc key), thân để `<!-- điền sau: FILL_LATER -->` (field chuỗi để `""`). Nếu `DECISIONS.md` / `APPLY.md` đã cho giá trị thì điền luôn (ví dụ `verification: demonstration` của R-029; Cách kiểm chứng của Assumption theo P1d).
4. **Section:** giữ đúng heading và thứ tự của khung. Section bắt buộc (`required_sections` của `schema.json` ở mức status của item) không được xóa. Section tùy chọn mà template ghi "Xóa section nếu trống" thì xóa khi không có nội dung và không thuộc `FILL_LATER.md`.
5. **Frontmatter:** không đổi `id`, `status` và các field quan hệ mà khung đã ghi, trừ khi một quyết định nói rõ điều khác cho item của bạn mà khung chưa làm; khi đó sửa và ghi vào mục "Sửa quan hệ" của rewrite log. Điền các field còn trống: `short_name` (3–8 từ, phân biệt được; dùng tên đề xuất ở PLAN mục 4 nếu có), `imposed_by` (Constraint), `verification` và `inputs` (Requirement; giữ `test` nếu không có lý do đổi). `source` chỉ chứa ID hoặc mã nguồn, không viết câu (GX-11).
6. **Cách viết:** câu có chủ ngữ rõ, thể chủ động (GX-16); không dùng đại từ thay đối tượng (GX-17); tránh từ mơ hồ và câu thoát ở `_COMMON_CRITERIA.md` mục 6 (GX-08); section có từ 2 ý trở lên viết danh sách đánh số, mỗi dòng không quá khoảng 200 ký tự (GX-14); `Ghi chú` không ghi nguồn và không tóm tắt section khác (GX-12). Ngày trong văn bản viết `YYYY-MM-DD` (GX-18).
7. **Tên hệ thống (BLK-068):** câu `Yêu cầu` của Requirement dùng "DeckAgent"; mọi section khác dùng "Hệ thống". Tên riêng (P1–P5 như `P1 Source Fidelity`, tên sản phẩm và tính năng của bên khác) viết trong backtick hoặc ngoặc kép (BLK-069).
8. **Một nơi sở hữu (GX-10, P3):** nội dung do item khác sở hữu thì chỉ tóm tắt kèm ID, không phát biểu lại như quy định độc lập.
9. **Item đã đóng** (Retired, Deprecated, Superseded): chỉ dịch hình thức (thuật ngữ, đánh số, cấu trúc), không đổi ý nghĩa (GX-15). Thêm ghi chú đóng khi `APPLY.md` yêu cầu (C-003, A-023, D-026).
10. **Item Active:** các section quy định (Yêu cầu, Miền đầu vào, Đo lường, Acceptance, Rule, bảng, luồng, Postconditions) không chứa "Chưa chốt", "TBD", "định nghĩa sau", trừ ngưỡng có nhãn `[tạm`. `Câu hỏi mở` chỉ còn câu hỏi không ảnh hưởng các phần đó, mỗi câu có nơi xử lý.
11. **Mã W-xxx** giữ dạng text làm nơi xử lý, ví dụ "(nơi xử lý: W-032)" (BLK-063). Không đưa W-, L- vào `source`.
12. **ID đã xóa** (APPLY.md mục 5) không được xuất hiện trong file item. Chỗ trích ID đã xóa: bỏ phần trích, hoặc thay bằng ID item đang sở hữu nội dung (P4).

## Đầu ra

1. Các file item của loại bạn, viết xong.
2. `M/work/rewrite-log-<loại>.md`, gồm:
   - Bảng **viết lại câu**: `| ID | Section | Câu gốc | Câu mới | Căn cứ |`. Ghi **mọi** chỗ viết lại câu (đổi chữ, gộp, tách, thêm giá trị theo quyết định). Không ghi việc chỉ chuyển nguyên câu sang section khác; việc đó ghi ở bảng "Chuyển chỗ" (`| ID | Từ cột sheet | Sang section |`). Căn cứ là ID tiêu chí, ID blocker, ID chính sách hoặc mục của `APPLY.md`.
   - Mục **Sửa quan hệ** (nếu có).
   - Mục **Cần sửa ở loại khác**: điều bạn thấy cần sửa ở item loại khác (bạn không sửa file loại khác).
   - Mục **Không áp rõ**: chỗ quyết định không áp rõ được hoặc mâu thuẫn. Với mỗi chỗ: ID, vấn đề, các phương án, đề xuất. Không tự đoán: giữ chữ gần nhất với sheet ở chỗ đó và làm tiếp item khác.

## Phạm vi

- Chỉ sửa file item của loại bạn và tạo `M/work/rewrite-log-<loại>.md`. Không sửa file nào khác (kể cả `_CRITERIA.md`, `_TEMPLATE.md`, `schema.json`, `glossary.md`, `APPLY.md`, `BLOCKERS.md`, file của loại khác). Không chạy git.
- Câu trả lời cuối của bạn (gửi cho agent chính) ngắn: số item đã viết; số dòng viết lại; danh sách "Không áp rõ" (một dòng mỗi chỗ); danh sách "Cần sửa ở loại khác".
