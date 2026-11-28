# Architecture Documentation

Đọc file này để biết cách tổ chức tài liệu kiến trúc theo mục tiêu của người đọc, liên kết với use case và trình bày quyết định kiến trúc.

Quy tắc chung của mọi tài liệu nằm trong [Documentation Conventions](docs.md).

## Phạm vi của `docs/architecture/`

`docs/architecture/` mô tả cơ chế bên trong giúp hệ thống đáp ứng use case và quality attribute: thành phần, luồng giữa các thành phần, dữ liệu, contract, quyết định và rủi ro. Hành vi quan sát được từ bên ngoài và số đo của hành vi đó nằm trong `docs/UCs/` [[1]](#ref-1).

- File architecture trỏ tới ID trong `docs/UCs/` bằng cụm nội dung kèm ID, ví dụ "file tải lên không vượt dung lượng tối đa (UP-03)". Không chép giá trị của rule; khi cần con số, link tới rule đó.
- Phân biệt yêu cầu của tài liệu đầu vào trong `docs/UCs/sources/` với phương án kiến trúc do nhóm đề xuất.
- Quyết định chưa thống nhất mang nhãn `Proposed` hoặc `Open`.
- Mỗi file chỉ mô tả quyết định trong phạm vi của nó. Chi tiết đã có ở file khác thì link tới file đó.
- Cấu trúc tài liệu không phải cấu trúc bắt buộc của source code. Cấu trúc source code nằm trong [Project Structure](project-structure.md).

## Câu hỏi và ranh giới nội dung

File kiến trúc toàn hệ thống giữ phạm vi theo chủ đề của file qua các increment. Chức năng đã triển khai cung cấp dữ liệu cho góc nhìn đó. Người viết không thu hẹp mục đích của file thành chức năng vừa làm. Người viết phải phân biệt trạng thái hiện tại với thiết kế chưa triển khai. Người viết không được lấy việc chưa có code làm lý do để tự chốt thiết kế.

| File | Câu hỏi phải trả lời | Chi tiết thuộc file khác |
| --- | --- | --- |
| `00-system.md` | Hệ thống phục vụ ai, gồm những container nào, trách nhiệm và kết nối của chúng là gì, phần nào đã triển khai? | Danh sách endpoint, cột DB, hook của một tính năng |
| `20-state-machine.md` | Đối tượng và process nào có vòng đời, ai sở hữu trạng thái, sự kiện nào chuyển trạng thái, lỗi và kết thúc được xử lý thế nào? | Nội dung từng màn hình, catalog endpoint, thuật toán nghiệp vụ |
| `21-database.md` | Hệ thống lưu gì, entity liên hệ thế nào, ai sở hữu dữ liệu, constraints/index bảo vệ gì, migration và persistence hoạt động ra sao? | Trình tự xử lý của một tính năng, render UI |
| `22-api-endpoints.md` | Contract nào đi qua ranh giới hệ thống, bên nào gọi, input/output/error và điều kiện truy cập là gì? | Cách truy vấn bảng, orchestration bên trong một tính năng |
| `23-security.md` | Tài sản, trust boundary và đường tấn công nào được bảo vệ, cơ chế đặt ở đâu, còn gap hoặc rủi ro nào? | Lặp lại toàn bộ endpoint hoặc ERD |
| `10`–`16` | Module thuộc domain đó phân rã và phối hợp thế nào để đáp ứng driver? | Hành vi hộp đen đã do use case sở hữu |
| `30-decisions.md` | Vì sao chọn phương án kiến trúc, trade-off và điều kiện xét lại là gì? | Catalog trạng thái triển khai hoặc bản sao mô tả cơ chế |

Mỗi section, bảng và diagram phải giúp người đọc trả lời câu hỏi của file. Chi tiết thuộc câu hỏi khác được dẫn tới file sở hữu. Mức đầy đủ của tài liệu được đánh giá bằng việc người đọc có hiểu được cấu trúc, cơ chế, quyết định và giới hạn liên quan đến chủ đề hay không. Review kiểm ý nghĩa này; máy chỉ kiểm được cấu trúc và tham chiếu.

## Khung của file architecture

Khung dưới đây gợi ý các nhóm nội dung thường hữu ích. Người viết chọn, gộp, tách, đặt tên và sắp xếp section theo cách giúp người đọc hiểu chủ đề tốt nhất. Người viết có thể bổ sung nhóm nội dung khác khi cần. Chẳng hạn, file Database có thể tổ chức quanh mô hình dữ liệu, quyền sở hữu, constraints và migration. File Lifecycle có thể tổ chức theo từng đối tượng có trạng thái.

Phần dùng chung gồm tiêu đề và dòng mục đích theo Documentation Conventions. File chưa có nội dung chỉ cần hai phần này. File có nội dung (trừ `README.md` và `30-decisions.md`) giữ section `## Drivers` để truy vết tới yêu cầu; các nhóm còn lại được trình bày ở nơi phù hợp trong tài liệu. References áp dụng theo quy tắc trích dẫn chung.

| Nhóm nội dung gợi ý | Giúp người đọc hiểu | Cách trình bày phù hợp |
| --- | --- | --- |
| Drivers | Yêu cầu nào dẫn tới cơ chế đang mô tả | Bảng Driver và Cơ chế đáp ứng; use case, rule hoặc quality attribute có cụm nội dung kèm ID và link |
| Thành phần và ranh giới | Mỗi phần chịu trách nhiệm gì, phụ thuộc và giao tiếp với phần nào | Văn bản, bảng trách nhiệm, `flowchart` ở mức C4 phù hợp |
| Luồng xử lý | Các phần phối hợp thế nào trong kịch bản cần giải thích cơ chế bên trong | `sequenceDiagram` cho kịch bản có ý nghĩa với câu hỏi của file |
| Dữ liệu | Entity, quan hệ, quyền sở hữu và ràng buộc lưu trữ | `erDiagram`, bảng constraints hoặc mô tả persistence |
| Trạng thái và vòng đời | Đối tượng đổi trạng thái khi nào, ai quản lý và xử lý lỗi ra sao | `stateDiagram-v2` hoặc bảng transition |
| Quyết định | Hệ thống chọn cơ chế nào và vì sao | Đoạn giải thích hoặc bảng; quyết định có trade-off lớn dẫn tới ADR |
| Rủi ro và giới hạn | Cơ chế còn thiếu gì, có giới hạn nào và rủi ro nào được chấp nhận | Văn bản hoặc bảng, dẫn tới quyết định chấp nhận khi có |

Chọn diagram theo thông tin cần truyền đạt: tổng quan hệ thống dùng C4 Context/Container, mô hình dữ liệu dùng ERD, catalog API dùng bảng endpoint. Diagram và mức chi tiết phải phục vụ câu hỏi của file; một file có thể dùng nhiều cách trình bày cho những phần nội dung khác nhau.

`README.md` có ma trận `Driver | File` từ mỗi file use case và từ `quality-attributes.md` tới file architecture đáp ứng nó.

## Architectural Decision Record

ADR nằm trong `30-decisions.md`, ID dạng `ADR-XXX`, không đổi và không dùng lại. Heading định danh và Status giữ định dạng dưới đây để tra cứu. Các nhóm nội dung còn lại giúp người đọc đánh giá quyết định; có thể gộp, tách hoặc đổi tên section miễn nội dung cần thiết được trình bày rõ.

| Phần | Nội dung |
| --- | --- |
| `## ADR-XXX: <quyết định>` | Heading nêu chính quyết định, không nêu chủ đề chung chung |
| `**Status:**` | `Proposed`, `Accepted (YYYY-MM-DD)`, `Superseded by ADR-YYY` hoặc `Deprecated` |
| `### Bối cảnh` | Vấn đề, ràng buộc, driver (cụm nội dung kèm ID) |
| `### Phương án đã xét` | Các phương án và trade-off. Bỏ phần này khi chỉ có một phương án khả thi, và nêu lý do trong Bối cảnh |
| `### Quyết định` | Điều được chọn, đủ cụ thể để kiểm được |
| `### Lý do` | Vì sao phương án được chọn hơn các phương án khác |
| `### Rủi ro chấp nhận` | Khi có |
| `### Hệ quả` | Điều dễ hơn, điều khó hơn, điều kiện phải xét lại quyết định |

ADR đã Accepted không được sửa nội dung quyết định. Khi quyết định thay đổi, viết ADR mới và đổi Status của ADR cũ thành `Superseded by ADR-YYY`.

## References

1. <a id="ref-1"></a>[Use Case Documentation](use-cases.md)
