# Bộ đánh giá chung

Bộ đầu vào cố định để đo chất lượng đầu ra AI của DeckAgent. Bộ này là Meter của các requirement sau trong `docs/specification/06-requirements/`:

| Requirement | Đo gì | Cách chấm |
|---|---|---|
| R-007 | Số con số và trích dẫn trên slide khác tài liệu, mỗi lượt có tài liệu | Script trích số trên slide, đối chiếu tài liệu; người chấm xác nhận chỗ không khớp |
| R-009 | Điểm rubric 1–3 về mức deck phản ánh audience và mục đích đã nêu | 2 người chấm độc lập, lấy điểm thấp hơn |
| R-021 | Số slide mắc ít nhất một trong 4 lỗi tối thiểu | Validator tự động (chữ tràn hoặc bị cắt, cỡ chữ nội dung, slide trống ngoài ý muốn); người chấm kiểm mạch trình bày gãy |

A-018 cũng dùng bộ này để so thời gian và chi phí giữa nhóm lượt xử lý khó và dễ.

Cỡ bộ, ngưỡng đạt và sự kiện xem lại do các requirement trên sở hữu (R-021 mục `Đo lường`). File này chỉ mô tả cấu trúc thư mục và cách chạy. Khi con số trong requirement đổi, sửa requirement trước, rồi sửa file này cho khớp.

## Trạng thái

Chưa có tài liệu mẫu và yêu cầu mẫu. Việc thu thập nằm trong `docs/specification/_FILL_LATER.md`. Chưa có đủ đầu vào thì R-007, R-009, R-021 chưa nghiệm thu được.

## Cấu trúc

```text
tests/eval/
├── README.md
├── documents/      # 10 tài liệu mẫu (đầu vào có tài liệu)
│   └── manifest.md # mỗi tài liệu: tên file, loại, số trang, có bảng số liệu hay không, nguồn và quyền dùng
├── prompts/        # 10 yêu cầu không kèm tài liệu, mỗi yêu cầu một file .md
├── rubric/         # rubric 1–3 điểm của R-009, có ví dụ cho từng mức điểm
└── runs/           # kết quả từng lần chạy: <YYYY-MM-DD>-<mô tả>/, không commit file deck lớn
```

## Số lượng (theo R-021)

| Thành phần | Số lượng | Điều kiện |
|---|---|---|
| Tài liệu mẫu | 10 | Gồm báo cáo có số liệu, bài giảng, đề xuất dự án; dài 3–20 trang; ít nhất 3 tài liệu có bảng số liệu; thuộc 5 loại tài liệu có sẵn của R-003 và nằm trong giới hạn của R-003 |
| Yêu cầu không kèm tài liệu | 10 | Mỗi yêu cầu nêu chủ đề và mục đích (R-002) |
| Số lần chạy mỗi đầu vào | 3 | Tổng 60 lượt |

## Cách chạy

Chưa có script chạy. Khi viết script, mỗi lần chạy:

1. Tạo deck cho từng đầu vào trong `documents/` và `prompts/`, mỗi đầu vào 3 lần.
2. Lưu cho mỗi lượt: đầu vào, deck tải về dạng PPTX, thời gian chạy, chi phí gọi AI, trạng thái kết thúc.
3. Chạy phần chấm tự động của R-007 và R-021; ghi kết quả từng lượt vào `runs/<lần chạy>/results.md`.
4. Người chấm hoàn tất phần chấm tay (R-007 xác nhận chỗ không khớp, R-009 rubric, R-021 mạch trình bày).
5. So kết quả với `Ngưỡng đạt` của từng requirement. Lần chạy đầu tiên là sự kiện xem lại của các ngưỡng tạm liên quan (`docs/specification/_PROVISIONAL.md`).
