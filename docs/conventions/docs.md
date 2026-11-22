# Documentation Conventions

Đọc file này để biết một file tài liệu trong `docs/` phải trông thế nào: cấu trúc, ngôn ngữ, trích dẫn, ID và cách nhắc tới đối tượng.

Quy tắc ở đây áp dụng cho mọi tài liệu trong `docs/`. Mỗi loại tài liệu có thêm quy tắc riêng trong file convention của loại đó (xem [Theo loại tài liệu](#theo-loại-tài-liệu)). Khi hai file mâu thuẫn, file này được ưu tiên.

Quy tắc được `corepack pnpm@11.28.5 check:docs` kiểm được đánh dấu *(check-docs)*. Phạm vi của check: mọi file `.md` trong `docs/` (trừ `docs/00-old/`), `AGENTS.md` và `LESSONS.md`. Mỗi file trong `docs/` (trừ `README.md`) phải có link từ `README.md` gần nhất *(check-docs)*.

## Cấu trúc file

1. Dòng 1 là heading cấp 1 (`# Title`). Dòng nội dung đầu tiên sau heading là đúng một câu mô tả mục đích của file, bắt đầu bằng "Đọc file này để biết …", "Đọc file này để …" hoặc "Đọc file này giúp …". File viết bằng tiếng Anh bắt đầu bằng "Read this file to …" *(check-docs)*.
2. File chưa có nội dung chỉ có heading cấp 1 và dòng mục đích. Không thêm section `Purpose`, `Status` hoặc placeholder.
3. Không áp dụng hai quy tắc trên cho source code, file được generate và file có định dạng riêng (ví dụ evidence của test, file vendored).
4. Không chia quá nhiều heading nhỏ. Dùng đoạn văn cho lập luận, bullet cho ý song song, bảng cho so sánh và cho tập rule có ID, diagram khi hình giúp hiểu nhanh hơn chữ. Quy tắc viết diagram nằm trong [Mermaid](mermaid.md).

## Ngôn ngữ và văn phong

1. Tài liệu viết bằng tiếng Việt. Giữ thuật ngữ chuyên ngành bằng tiếng Anh khi thuật ngữ đó phổ biến hoặc chính xác hơn bản dịch. Ngoại lệ: mọi file trong `.agents/`, `.claude/` và `docs/build/` viết hoàn toàn bằng tiếng Anh.
2. Viết rõ, tự nhiên và chính xác. Không dùng văn phong máy móc, không phóng đại, không thêm nội dung không mang lại giá trị cho người đọc.
3. Mỗi file có đủ ngữ cảnh để đọc riêng. Các ý liên kết với nhau và một khái niệm chỉ có một tên trong toàn bộ tài liệu.
4. Giọng văn, mức chi tiết và cách trình bày theo mục đích của từng tài liệu; không áp một khuôn chung cho mọi tài liệu.
5. Không tự tạo thông tin. Không trình bày giả định như sự thật: điều chưa xác nhận mang nhãn `Proposed`, `Inferred` hoặc `Open` theo quy ước của loại tài liệu.

## Nhắc tới đối tượng

Mỗi câu xác định rõ đối tượng, hành động hoặc quyết định mà nó nói tới, kể cả trong heading, bảng, bullet và chú thích hình. Khi nhắc tới một quyết định, giải pháp hoặc hành vi, nêu nội dung cụ thể hoặc link tới nơi định nghĩa nó. Cụm như "cơ chế này", "phương án trên" chỉ dùng khi đối tượng đã được nêu trong câu hoặc đoạn ngay trước đó.

| Không viết | Viết |
| --- | --- |
| "Hệ thống sử dụng phương án được nhóm đề xuất." | "Hệ thống lưu file tải lên vào thư mục của workspace, không lưu vào database." |
| "Khi xảy ra lỗi, hệ thống sẽ xử lý phù hợp." | "Khi dịch vụ bên ngoài không phản hồi, hệ thống đánh dấu yêu cầu là `FAILED` và hiện nút thử lại." |

## Chỉ ghi nội dung của chủ đề

File chỉ chứa nội dung về chủ đề của nó. Không ghi nguồn gốc của đoạn văn ("chuyển từ file X"), lịch sử chỉnh sửa, lý do sắp xếp lại hoặc trạng thái hoàn thiện ("chưa chuẩn hoá"). Những thông tin này thuộc commit message, `CHANGELOG.md` hoặc câu trả lời gửi người dùng. Không thêm câu dẫn hoặc disclaimer mà không cung cấp thông tin người đọc cần để hiểu đúng nội dung.

Ngoại lệ: một quyết định do agent chốt theo ủy quyền của product owner được ghi kèm "theo ủy quyền của product owner" và lý do, để người dùng có thể phủ quyết. Đây là thông tin về trạng thái của quyết định, không phải ghi chú quy trình.

## Giá trị cụ thể có nguồn

Mỗi giá trị cụ thể (ngưỡng, thời hạn, giới hạn, số lần) có nguồn: requirement, prototype, chuẩn ngành kèm số mục, mặc định của thư viện kèm version, hoặc "agent đề xuất" kèm lý do. Khi giá trị nằm trong bảng rule, nguồn nằm ở cột `Nguồn` của dòng đó.

## ID

1. ID có dạng `<TIỀN TỐ>-<số>`, ví dụ `UP-03`. Mỗi file định nghĩa ID có bảng tiền tố với cột `Tiền tố`, `Nhóm` và `Nguồn`. Mỗi tiền tố ứng với đúng một nhóm trong một section của tài liệu nguồn.
2. Không đánh lại số của ID đã cấp. Item mới nhận số kế tiếp trong nhóm, kể cả khi thứ tự số không còn theo thứ tự của luồng. Item bị bỏ giữ ID và chuyển trạng thái, không xóa. Chỉ đổi tiền tố khi chưa có test case, defect hay tài liệu nào khác trỏ tới ID đó.
3. Tiền tố không trùng tiền tố mà repo đã dùng cho đối tượng khác, để một ID chỉ có một nghĩa trong toàn repo.
4. **ID không đứng một mình.** Mỗi lần nhắc một ID, viết trước nó một cụm nêu nội dung, rồi đặt ID trong ngoặc: "file tải lên không vượt dung lượng tối đa (UP-03)". Không dùng ID làm chủ ngữ hay tân ngữ ("UP-03 quy định …", "bị chặn theo UP-03"). Trong diagram, nhãn là cụm nội dung, ID là phần phụ. Ngoại lệ: cột ID của bảng, và bảng tra cứu mà mỗi dòng đã có cột nội dung.

| Không viết | Viết |
| --- | --- |
| "File bị từ chối theo UP-03." | "File bị từ chối khi vượt dung lượng tối đa của file tải lên (UP-03)." |
| `S-->>U: UP-03` | `S-->>U: Từ chối file vượt dung lượng tối đa (UP-03)` |

## Trích dẫn nguồn

Trích dẫn kiểu paper khi một câu, dòng bảng hoặc bullet dựa vào nội dung của tài liệu khác (yêu cầu, quyết định, số liệu, hành vi). Không áp dụng cho bảng Table of Contents trong `README.md` và link tới heading trong cùng file.

- Trong văn bản, chỉ viết số: `[[n]](#ref-n)`. Không ghi vị trí trong file nguồn. Mỗi file nguồn có đúng một số. Khi câu cần chỉ tới một heading cụ thể, viết link tới heading đó trong câu, không dùng trích dẫn *(check-docs)*.
- `## References` là section cuối của file. Mỗi file nguồn có đúng một số, đánh liên tục theo thứ tự xuất hiện lần đầu trong văn bản. Tên hiển thị là heading cấp 1 của file nguồn. Mỗi `[[n]]` có anchor `ref-n` trong References, và mỗi mục trong References được trích ít nhất một lần *(check-docs)*.
- Mọi link tương đối trỏ tới file có thật; link tới heading trỏ tới heading có thật *(check-docs)*.

```markdown
File tải lên vượt dung lượng tối đa bị từ chối [[1]](#ref-1) [[2]](#ref-2).

## References

1. <a id="ref-1"></a>[Project Brief](../UCs/sources/project-brief.md)
2. <a id="ref-2"></a>[Upload](../UCs/upload.md)
```

## Câu hỏi mở

Câu hỏi chưa được quyết chỉ được ghi trong [`open-questions.md`](../open-questions.md), theo quy ước ở đầu file đó. File khác nhắc tới câu hỏi bằng link theo ID (`open-questions.md#oq-xxx`), không chép nội dung câu hỏi.

- Khi một câu được quyết, ghi nội dung đã chốt vào tài liệu chính, hoặc vào ADR trong `docs/architecture/30-decisions.md` nếu là quyết định kiến trúc có trade-off. Sau đó chuyển câu xuống bảng Resolved & Dropped, kèm trích dẫn tới nơi đã ghi.
- Không xoá câu hỏi. Câu không còn cần thiết chuyển sang Dropped, kèm lý do.

## Theo loại tài liệu

| Thư mục | Convention riêng |
| --- | --- |
| `docs/UCs/` | [Use Case Documentation](use-cases.md) |
| `docs/architecture/` | [Architecture Documentation](architecture.md) |
| Diagram trong mọi tài liệu | [Mermaid](mermaid.md) |
| `docs/knowledge/` | [Knowledge Documentation](knowledge.md) |
