# Use Case Documentation

Đọc file này để biết một file trong `docs/UCs/` phải gồm những phần nào, viết rule có số đo ra sao và ghi gap analysis thế nào.

Quy tắc chung của mọi tài liệu nằm trong [Documentation Conventions](docs.md).

## Phạm vi của `docs/UCs/`

`docs/UCs/` mô tả hành vi mà người dùng hoặc tester quan sát được từ bên ngoài hệ thống, kèm số đo của hành vi đó. Cơ chế bên trong (thư viện, endpoint, bảng dữ liệu, cấu hình) nằm trong `docs/architecture/` [[1]](#ref-1).

Phép thử cho một fact: người dùng hoặc tester có quan sát được fact đó từ bên ngoài không? Có thì fact thuộc UC. Không thì fact thuộc architecture. Response header và thuộc tính cookie quan sát được qua HTTP, nên yêu cầu về chúng thuộc UC; việc cấu hình thư viện nào để tạo ra chúng thuộc architecture.

Mỗi fact chỉ nằm ở một nơi. Link đi một chiều: architecture và testing trỏ tới ID trong UC; file UC không mô tả cơ chế và không link tới mô tả cơ chế. File UC được trích một ADR làm nguồn của quyết định, ví dụ mức bảo mật đã chọn.

| File | Nội dung |
| --- | --- |
| `README.md` | Overview của domain, actor, use case map, danh sách file |
| `quality-attributes.md` | Quality attribute scenario toàn hệ thống (tiền tố `QA-`) |
| `<vùng-chức-năng>.md` | Use case của một vùng chức năng, ví dụ `upload.md` |
| `sources/` | Tài liệu đầu vào (đề bài, mô tả domain). Chỉ đọc; không áp dụng quy tắc của file này |

## Khung của file use case

Các section theo thứ tự sau. Section không áp dụng thì bỏ, trừ `Gap analysis` và `References`.

| Section | Nội dung | Diagram |
| --- | --- | --- |
| `# <Vùng chức năng>` + dòng mục đích | theo [Cấu trúc file](docs.md#cấu-trúc-file) | |
| `## Tổng quan` | Actor, phạm vi, điều nằm ngoài phạm vi, bảng tiền tố ID | `flowchart`: actor → các use case trong file |
| `## Quy tắc dùng chung` | Bảng rule áp dụng cho nhiều use case | |
| `## <Tên use case>` (mỗi use case một section) | Trigger, precondition, kết quả khi thành công, kết quả khi thất bại; luồng chính đánh số; bảng luồng thay thế và luồng ngoại lệ; bảng rule riêng | `sequenceDiagram` cho luồng chính; `stateDiagram-v2` khi đối tượng có vòng đời |
| `## Gap analysis` | Baseline độc lập, mức áp dụng, bảng gap | |
| `## References` | theo [Trích dẫn nguồn](docs.md#trích-dẫn-nguồn) | |

Mỗi file use case có ít nhất một `sequenceDiagram`.

## Rule có số đo

Rule nằm trong bảng có các cột sau:

| ID | Rule | Giá trị | Đo tại | Nguồn | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| `UP-03` | File tải lên không vượt dung lượng tối đa | 20 MB | Kích thước file khi người dùng chọn file | Agent đề xuất: ví dụ minh họa | Proposed |

- **Rule** là một câu khẳng định kiểm chứng được, chỉ nói một điều.
- **Giá trị** là số kèm đơn vị khi rule có đại lượng (thời gian, số lần, độ dài, kích thước, tỷ lệ). Rule không có đại lượng ghi `—` ở cả cột Giá trị và cột Đo tại. Giá trị khác `—` phải chứa chữ số, và khi đó cột Đo tại không được rỗng.
- **Đo tại** nêu điểm bắt đầu và điểm kết thúc của phép đo, hoặc nơi quan sát giá trị.
- **Nguồn** theo [Giá trị cụ thể có nguồn](docs.md#giá-trị-cụ-thể-có-nguồn); không để trống.
- **Trạng thái** là `Confirmed` (product owner đã xác nhận, kể cả khi agent chốt theo ủy quyền), `Inferred` (suy ra từ prototype, chưa xác nhận) `Proposed` (đề xuất, chưa xác nhận) hoặc `Dropped` (product owner đã bỏ rule; giữ ID, ghi lý do sau trạng thái).
- Cột Rule không dùng từ mơ hồ không đo được: "nhanh", "chậm", "kịp thời", "hợp lý", "phù hợp", "vài", "một số", "tối ưu", "thân thiện", "dễ dùng", "linh hoạt", "nếu cần", "khi cần", "v.v.", "đáng kể". Thay từ đó bằng số đo.

Luồng thay thế và luồng ngoại lệ nằm trong bảng `ID | Điều kiện | Phản hồi người dùng thấy | Nguồn | Trạng thái`.

## Diagram trong use case

Diagram trong `docs/UCs/` coi hệ thống là hộp đen: participant chỉ gồm actor, hệ thống và hệ thống bên ngoài mà người dùng thấy. Diagram không có tên công nghệ, endpoint hay thành phần bên trong. Quy tắc chung nằm trong [Mermaid](mermaid.md).

## Gap analysis

Mỗi file use case có section `## Gap analysis`. Section mở đầu bằng baseline độc lập đã dùng và mức áp dụng: chuẩn ngành của domain (ví dụ OWASP ASVS cho authentication và session, WCAG cho accessibility), hoặc bộ use case do người chưa đọc spec viết. Baseline không được là prototype, code hay test của chính hệ thống, vì chúng có cùng nguồn gốc với spec. ID và mức của chuẩn lấy từ bản gốc của chuẩn, không lấy từ bản tóm tắt.

Gap nằm trong bảng `ID | Gap | Baseline | Quyết định | Trạng thái`. Trạng thái là `Closed` (đã thành rule, ghi ID của rule ở cột Quyết định), `Accepted` (chấp nhận rủi ro, ghi lý do) hoặc `Open` (link tới một câu còn mở trong `open-questions.md`, không tới câu trong Resolved & Dropped) *(check-docs)*.

## Quality attribute scenario

`quality-attributes.md` chứa yêu cầu chất lượng toàn hệ thống. Yêu cầu chất lượng chỉ thuộc một use case nằm trong bảng rule của use case đó.

Mỗi scenario có sáu phần của quality attribute scenario [[2]](#ref-2): nguồn kích thích (thực thể tạo ra kích thích), kích thích (điều kiện tác động lên hệ thống), môi trường (điều kiện khi kích thích xảy ra), artifact (phần bị kích thích), phản hồi (hoạt động sinh ra từ kích thích) và số đo của phản hồi (thước đo để đánh giá phản hồi). Mỗi nhóm thuộc tính (Performance, Reliability, Modifiability, …) là một section có bảng `ID | Nguồn kích thích | Kích thích | Môi trường | Artifact | Phản hồi | Số đo | Nguồn | Trạng thái`. Số đo nêu giá trị, đơn vị và điểm đo.

Một tên thuộc tính đứng riêng ("hệ thống phải dễ mở rộng") không phải scenario; scenario nêu một ví dụ cụ thể của thuộc tính đó [[2]](#ref-2). Bộ scenario có đủ ba loại: use case scenario (cách dùng dự kiến), growth scenario (thay đổi dự kiến, ví dụ thêm một định dạng output mới) và exploratory scenario (áp lực ngoài dự kiến) [[2]](#ref-2).

## References

1. <a id="ref-1"></a>[Architecture Documentation](architecture.md)
2. <a id="ref-2"></a>M. Barbacci và cộng sự, *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, Software Engineering Institute, 2003. <https://www.sei.cmu.edu/library/quality-attribute-workshops-qaws-third-edition/>
