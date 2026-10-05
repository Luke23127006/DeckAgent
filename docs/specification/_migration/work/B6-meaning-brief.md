# Brief kiểm "không đổi nghĩa" (Pha B, bước B6.4)

Bạn là người kiểm độc lập. Bạn **không** tham gia dịch. Việc của bạn: so từng ô của sheet gốc với nội dung mới trong file spec của **một loại item**, và đánh dấu mọi chỗ đổi nghĩa hoặc có thông tin không truy được về sheet hay về quyết định của người dùng.

Repo: `C:\Users\Duy\Desktop\DeckAgent`. `M` = `docs/specification/_migration`. Đọc và ghi UTF-8.

## Đầu vào

1. Dữ liệu gốc: `M/work/items/<loại>.json` (key là tên cột sheet).
2. File spec đã dịch: `docs/specification/0X-<loại>/<ID>.md`.
3. Nhật ký viết lại: `M/work/rewrite-log-<loại>.md` (câu gốc → câu mới → căn cứ; có cả phần "Sửa của agent chính").
4. Nguồn được phép thêm thông tin, và chỉ những nguồn này:
   - `M/DECISIONS.md` (P0–P9, Q1–Q3);
   - `M/APPLY.md` (mục 1–8, gồm trả lời của người dùng CX-1 … CX-8);
   - ô `Quyết định:` trong `M/BLOCKERS.md`;
   - nội dung item khác của sheet (`M/work/items/*.json`), khi câu mới chỉ tóm tắt item đó kèm ID của nó (GX-10).
5. Để hiểu cách viết được yêu cầu: `docs/specification/_COMMON_CRITERIA.md` và `_CRITERIA.md` của loại.

## Cách kiểm

Với **mỗi** item của loại (kể cả item đã đóng), đối chiếu từng ô có nội dung của sheet với section tương ứng của file mới:
1. Ý nào của sheet bị mất mà không có quyết định cho phép bỏ (ví dụ P3 tóm tắt kèm ID, P4 bỏ trích item đã xóa, P8 bỏ mã L-, W-)?
2. Câu mới có nói mạnh hơn hoặc yếu hơn câu gốc không (đổi "nên" ↔ "phải", "thường" ↔ "luôn", thu hẹp hoặc mở rộng phạm vi, đổi chủ ngữ làm đổi ai chịu trách nhiệm)? Đổi mức cam kết chỉ hợp lệ khi có quyết định (ví dụ P7).
3. Có thông tin mới (con số, danh sách, điều kiện, hành vi, nhánh, ID tham chiếu) mà không truy được về sheet hay về các nguồn ở mục 4 không?
4. Câu có được ghi ở rewrite log không? Câu viết lại mà không có trong log thì ghi nhận (không tính là đổi nghĩa nếu nghĩa giữ nguyên).

Không đánh dấu: sửa hình thức (thuật ngữ glossary, đánh số, tách câu giữ nghĩa, chuyển chỗ sang section đúng), thay "DeckAgent" bằng "Hệ thống" ngoài câu Yêu cầu (BLK-068), backtick cho tên riêng (BLK-069), marker `<!-- điền sau: FILL_LATER -->` cho chỗ sheet không có.

## Đầu ra

Ghi `M/work/meaning-check-<loại>.md`:

```markdown
# Kiểm không đổi nghĩa: <loại>

- Item đã kiểm: <số> (<danh sách ID>)
- Chỗ bị đánh dấu: <số>

| # | ID | Section | Ô sheet (trích) | Câu mới (trích) | Vấn đề | Mức | Đề xuất sửa |
|---|---|---|---|---|---|---|---|
```

- `Vấn đề`: `đổi nghĩa`, `thông tin không truy được`, hoặc `thiếu ý`.
- `Mức`: `cao` (đổi hành vi, phạm vi hoặc tiêu chí đạt của item Active), `thấp` (còn lại).
- `Đề xuất sửa`: câu cụ thể nên dùng, hoặc "giữ, vì <căn cứ>" nếu bạn thấy có căn cứ nhưng log thiếu.

Không sửa file nào ngoài `M/work/meaning-check-<loại>.md`. Không chạy git. Câu trả lời cuối: số item đã kiểm, số chỗ bị đánh dấu theo mức, một dòng cho mỗi chỗ mức `cao`.
