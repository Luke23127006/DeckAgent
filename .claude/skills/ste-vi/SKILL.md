---
name: ste-vi
description: "Viết lại text tiếng Việt mà agent/máy sẽ đọc (system prompt, prompt cho subagent, tool description, error message, CLAUDE.md, SKILL.md, tài liệu hướng dẫn) để không thể hiểu sai. Chuyển các quy tắc cấu trúc của ASD-STE100 sang tiếng Việt. Dùng khi viết hoặc sửa text tiếng Việt cho agent đọc, hoặc khi được yêu cầu: viết rõ nghĩa, khử mơ hồ, đơn giản hoá câu, STE tiếng Việt. Không dùng cho văn sáng tác, marketing, hoặc câu trả lời hội thoại."
---

# STE tiếng Việt (chuyển thể từ ASD-STE100)

ASD-STE100 chỉ định nghĩa cho tiếng Anh. Skill này là bản chuyển thể, không phải chuẩn chính thức. Skill giữ mục tiêu của STE: một câu chỉ có một cách hiểu. Người đọc là agent hoặc hệ thống, và người đọc không hỏi lại được.

Với text tiếng Anh, dùng skill `asd-ste100` (`.agents/skills/asd-ste100/SKILL.md`).

## Hai chế độ

- **Strict:** system prompt, prompt cho subagent, tool description, error/log/status message, chỉ dẫn giữa các agent. Áp dụng mọi quy tắc.
- **Nhẹ:** CLAUDE.md, SKILL.md, README, PR description, tài liệu giải thích. Áp dụng quy tắc cấu trúc. Quy tắc từ vựng chỉ là định hướng.

## Quy tắc cấu trúc

| Quy tắc | Nên | Không nên |
|---|---|---|
| Câu ngắn | Hướng dẫn: tối đa khoảng 30 tiếng (âm tiết). Mô tả: tối đa khoảng 40 tiếng. | Câu dài nhiều mệnh đề phụ. |
| Một chỉ dẫn mỗi câu | "Mở file. Đọc dòng 3." | "Mở file và đọc dòng 3 rồi kiểm tra xem có khớp không." |
| Nêu rõ chủ ngữ | "Khi job chạy xong, agent gửi báo cáo." | "Chạy xong thì báo." (ai chạy, ai báo?) |
| Chủ động | "Agent xoá file." | "File bị xoá bởi agent." Chỉ dùng "bị/được" khi không biết hoặc không cần biết ai làm. |
| Động từ, không danh từ hoá | "Kiểm tra log." | "Tiến hành việc kiểm tra log." "Thực hiện sự phân tích." |
| Không dấu chấm phẩy | Tách thành câu riêng. | Nối hai ý bằng dấu ";". |
| Mốc thời gian rõ | Dùng "đã/đang/sẽ" khi thời điểm ảnh hưởng nghĩa. | Bỏ mốc thời gian khi thời điểm quan trọng ("Job lỗi" = đã lỗi hay đang lỗi?). |
| Giữ mức độ chắc chắn | "Request có thể đã lỗi" giữ nguyên "có thể". | Đổi "có thể" thành khẳng định, hoặc thêm điều nguồn không nói. |
| Danh sách cho chuỗi | Từ 3 bước hoặc 3 điều kiện trở lên: dùng danh sách đánh số hoặc bullet. | Nhét chuỗi bước vào một câu. |
| Đoạn ngắn | Một chủ đề mỗi đoạn, tối đa 6 câu. | Đoạn nhiều chủ đề. |
| Phủ định đơn | "Chỉ xoá file tạm." | "Không được không kiểm tra..." (phủ định kép). |

## Quy tắc từ vựng (định hướng)

- **Một khái niệm, một tên.** Chọn một từ và dùng lại mãi. Không xoay vòng "kiểm tra / xác minh / rà soát" cho cùng một hành động.
- **Một dạng cho thuật ngữ.** Chọn "file" hoặc "tệp", không dùng lẫn. Thuật ngữ tiếng Anh khó dịch thì giữ tiếng Anh, giải thích một lần ở lần đầu.
- **Cẩn thận từ đa nghĩa.** "cho" (đưa / để / dành cho), "được" (bị động / có thể / đồng ý), "với" (cùng / đối với). Khi câu có thể hiểu hai cách, đổi từ hoặc đổi cấu trúc câu.
- **Bỏ khuôn hành chính.** "nhằm mục đích", "đối với việc", "trong trường hợp mà", "tiến hành", "thực hiện việc" → động từ trực tiếp.
- **Bỏ tính từ quảng cáo.** "mạnh mẽ", "vượt trội", "tối ưu", "liền mạch", "toàn diện" → bỏ, hoặc thay bằng con số chứng minh.
- **Viết tắt.** Giải thích ở lần dùng đầu, trừ khi người đọc chắc chắn biết.

## Danh sách kiểm tra nhanh

Trước khi viết lại, quét 6 lỗi sau:

1. Xoay vòng từ đồng nghĩa cho cùng một thứ.
2. Chồng nhiều từ rào đón: "có lẽ có thể phần nào giúp".
3. Danh từ hoá: "tiến hành", "thực hiện việc", "sự", "việc" đứng trước động từ.
4. Tính từ quảng cáo.
5. Câu dài nối bằng dấu ";" hoặc dấu gạch ngang.
6. Câu thiếu chủ ngữ ở chỗ có hai tác nhân trở lên.

## Quy trình

1. Chọn chế độ (Strict hoặc Nhẹ) theo loại text.
2. Đọc toàn bộ text để nắm nghĩa trước khi sửa.
3. Đi từng câu. Đánh dấu mọi vi phạm theo các bảng trên.
4. Viết lại câu vi phạm. Giữ nguyên mọi fact, điều kiện, phạm vi, con số, và mức độ chắc chắn. Nếu câu ngắn hơn làm mất độ chính xác, giữ câu dài và ghi chú.
5. Nếu text đã đạt, nói rõ là đạt. Không sửa cho có.

Không có linter tiếng Việt. Tự kiểm tra bằng danh sách ở trên.

## Định dạng đầu ra

Mặc định: chỉ in text đã viết lại. Nếu có chỗ cố ý giữ câu dài, thêm một dòng `Giữ nguyên:` nêu cụm từ và lý do.

Khi người dùng hỏi "show diff", "giải thích thay đổi", "trước/sau", in bảng:

| Quy tắc vi phạm | Gốc | Viết lại |
|---|---|---|

## Giới hạn

- Skill sửa hình thức, không sửa nội dung. Một đoạn rỗng viết lại vẫn rỗng. Khi gặp đoạn rỗng, nói thẳng.
- Không rút gọn quá mức rõ nghĩa. Mục tiêu là hết mơ hồ, không phải ngắn nhất.
- Không áp dụng cho câu trả lời hội thoại gửi người dùng. Câu trả lời theo phần style trong CLAUDE.md.
