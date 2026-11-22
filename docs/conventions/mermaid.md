# Mermaid

Đọc file này để biết khi nào dùng diagram, chọn loại Mermaid diagram nào và viết nhãn diagram sao cho không tạo nguồn dữ liệu thứ hai.

Quy tắc chung của mọi tài liệu nằm trong [Documentation Conventions](docs.md).

## Khi nào dùng diagram

Dùng diagram cho luồng, trạng thái và cấu trúc: thứ tự thông điệp giữa các bên, vòng đời của một đối tượng, quan hệ giữa các thành phần. Không dùng diagram cho giá trị và rule; giá trị và rule nằm trong bảng. Văn bản quanh diagram không kể lại diagram, chỉ nói điều diagram không thể hiện được.

| Nội dung | Loại diagram |
| --- | --- |
| Luồng giữa actor và hệ thống, giữa các thành phần | `sequenceDiagram` |
| Vòng đời của một đối tượng (link, phiên, job, kết nối) | `stateDiagram-v2` |
| Actor và use case, thành phần và phụ thuộc (C4 Context, Container) | `flowchart` |
| Mô hình dữ liệu | `erDiagram` |

## Quy tắc

1. Diagram nằm trong code block ` ```mermaid ` để GitHub render được.
2. Mỗi diagram thể hiện một kịch bản và có tối đa 10 participant hoặc node. Kịch bản lớn hơn thì tách thành nhiều diagram.
3. Nhãn không chép con số của rule. Nhãn là cụm nội dung, kèm ID của rule trong ngoặc khi rule có ID, theo [ID không đứng một mình](docs.md#id). Ví dụ: `File quá lớn (UP-03)`, không viết `File lớn hơn 20 MB`.
4. Luồng thay thế nằm trong `alt`/`else` của cùng sequence khi diagram vẫn dưới 10 participant và dễ đọc. Khi không, tách thành diagram riêng.
5. Diagram trong `docs/UCs/` coi hệ thống là hộp đen; quy tắc chi tiết nằm trong [Use Case Documentation](use-cases.md#diagram-trong-use-case).
6. Nhãn và ghi chú viết bằng tiếng Việt. Tên participant giữ nguyên tên riêng của hệ thống và dịch vụ bên ngoài.
