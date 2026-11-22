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
| <a id="oq-002"></a>OQ-002 | Điều gì bắt đầu việc tóm tắt hội thoại khi cuộc hội thoại không còn vừa context của model đã chọn: DeckAgent hay runtime chạy agent? | Hệ thống tự tóm tắt, người dùng không có lệnh tóm tắt (FR-079). Tài liệu của OpenCode không nói các tin nhắn trước đó còn đọc được sau khi tóm tắt hay không. | Kiểm chứng điểm bắt đầu tóm tắt và việc người dùng vẫn đọc toàn bộ cuộc hội thoại (FR-079.b) | Medium | [Gửi request](UCs/requests.md) |
| <a id="oq-003"></a>OQ-003 | Công việc của một request chạy ở đâu, để việc tải lại, đóng giao diện hoặc mất kết nối không dừng request? | Hành vi người dùng thấy đã chốt: request tiếp tục chạy khi giao diện mất đi (FR-068). Theo tài liệu của OpenCode, session chạy trong OpenCode server, không chạy trong client; nghiên cứu runtime của build đầu chưa kiểm chứng điều này. | Kiến trúc của việc giữ request chạy khi giao diện mất đi (FR-068) | High | [Gửi request](UCs/requests.md) |
| <a id="oq-004"></a>OQ-004 | Khi DeckAgent dừng, draft chưa gửi của một chat còn hay mất? | Kết quả khi thất bại của việc gửi request nói hệ thống giữ nội dung trong draft khi request chưa gửi, và người dùng không phải nhập lại. Rule giữ draft (FR-038.c) nói draft không được giữ sau khi DeckAgent dừng. Hai câu cho kết quả khác nhau khi DeckAgent dừng. | Expected value của test giữ draft (FR-038) và của kết quả khi thất bại của việc gửi request (UC-003) | High | [Gửi request](UCs/requests.md) |
| <a id="oq-005"></a>OQ-005 | Khi nào một câu trả lời gợi ý hoặc bản sửa gợi ý "không còn áp dụng" cho chat? | Hệ thống không nhận gợi ý không còn hợp với chat (FR-013.c), nhưng không rule nào nêu điều kiện đó. Chưa rõ người dùng có chọn được một gợi ý cũ trong lúc có request đang chạy hay không (FR-014). | Test của việc chọn gợi ý (FR-013.c) | Medium | [Gửi request](UCs/requests.md) |
| <a id="oq-006"></a>OQ-006 | Sau khi hệ thống không viết được tóm tắt hội thoại, người dùng làm gì để tiếp tục chat? | Request không xong và cuộc hội thoại giữ nguyên (FR-079.c). Cuộc hội thoại vẫn không vừa context, nên chưa rõ mỗi request sau có cũng không xong hay không. | Luồng sau lỗi tóm tắt hội thoại (FR-079.c) | Medium | [Gửi request](UCs/requests.md) |
| <a id="oq-007"></a>OQ-007 | Khi hai giao diện đang mở cùng gửi request trong một chat, người dùng ở giao diện thứ hai thấy gì? | Mọi giao diện đang mở hiển thị cùng một draft (FR-038.b). Mỗi chat chỉ có một request đang chạy (FR-014). Không rule nào nêu phản hồi cho request bị gửi sau. | Test gửi request từ hai giao diện (FR-014) | Low | [Gửi request](UCs/requests.md) |
| <a id="oq-008"></a>OQ-008 | Một request chờ phê duyệt có thời hạn không? Khi người dùng không trả lời, request ở trạng thái chờ phê duyệt bao lâu? | Request vẫn đang chạy trong lúc chờ, và người dùng được dừng request (FR-076). Không rule nào nêu thời hạn chờ. Trong lúc chờ, chat không nhận request mới (FR-014). | Vòng đời của request chờ phê duyệt (FR-076) | Medium | [Gửi request](UCs/requests.md) |
| <a id="oq-009"></a>OQ-009 | Khi người dùng thêm cùng một file hai lần vào draft, hệ thống làm gì? | Không rule nào nêu trường hợp này. Mỗi file đính kèm mới được tính vào số file tối đa của một request (BR-001.V2). | Test thêm file đính kèm (FR-016, BR-001.V2) | Low | [Gửi request](UCs/requests.md) |

## Resolved & Dropped

| ID | Câu hỏi | Trạng thái | Kết quả | Nơi ghi |
| --- | --- | --- | --- | --- |
| <a id="oq-001"></a>OQ-001 | Baseline độc lập nào dùng cho gap analysis của từng file trong `docs/UCs/`? | Resolved | Mỗi vùng chức năng có một bộ use case do subagent viết. Subagent chỉ nhận tên vùng, không đọc spec. Chuẩn ngành dùng kèm: OWASP ASVS (truy cập file, key), OWASP Top 10 for LLM Applications, Microsoft HAX Guidelines, SEI quality attribute scenario và ISO/IEC 25010 (quality attributes). WCAG chưa áp dụng vì chưa có giao diện. | [Baseline](build/refactor/UCs/baseline/README.md) |
