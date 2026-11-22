# Open Questions

Đọc file này để biết những câu hỏi sản phẩm và kỹ thuật chưa được quyết, mức ưu tiên, việc mà mỗi câu đang chặn, và kết quả của các câu đã giải quyết.

## Quy ước

- **ID** có dạng `OQ-XXX`, tăng dần, không đổi và không tái sử dụng. Link tới một câu bằng `open-questions.md#oq-xxx`.
- **Ưu tiên:**
  - **High:** chặn kiến trúc, contract dữ liệu hoặc expected value của test. Phải quyết trước khi code module đó.
  - **Medium:** chặn API hoặc flow của một module.
  - **Low:** chi tiết UI, quyết khi làm tới màn hình đó.
- **Chặn:** phần việc không thể hoàn thành khi câu hỏi chưa có câu trả lời.
- **Vòng đời:** câu Open nằm trong section theo module, trong bảng `ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn`. Khi được quyết, nội dung chốt được ghi vào tài liệu chính hoặc ADR, còn câu hỏi chuyển xuống [Resolved & Dropped](#resolved--dropped) kèm trích dẫn tới nơi đã ghi. Câu không còn cần thiết chuyển sang Dropped kèm lý do. Không xoá câu hỏi.

## Use cases

| ID | Câu hỏi | Điều đã biết | Chặn | Ưu tiên | Nguồn |
| --- | --- | --- | --- | --- | --- |
| <a id="oq-001"></a>OQ-001 | Baseline độc lập nào dùng cho gap analysis của từng file trong `docs/UCs/`? | Spec cũ chỉ được so với sản phẩm khác (open-design, Napkin AI), không với chuẩn ngành hay bộ use case viết độc lập. | Gap analysis của mọi file trong `docs/UCs/` | High | `LESSONS.md` LL-001 |

## Resolved & Dropped
