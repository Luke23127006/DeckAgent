# Knowledge Documentation

Đọc file này để biết một file kiến thức trong `docs/knowledge/` phải trông thế nào: chủ đề, cấu trúc, nguồn, nhãn và link.

Quy tắc chung cho mọi tài liệu nằm trong [Documentation Conventions](docs.md). File này chỉ thêm quy tắc riêng của tầng Knowledge. Quy tắc áp dụng cho file kiến thức. `README.md` của folder theo Documentation Conventions và không cần section `## Tóm tắt`.

## Quy tắc

1. Mỗi file một chủ đề. Tên file tiếng Anh, viết thường, nối bằng dấu gạch ngang, ví dụ `test-gaming-anti-patterns.md`.
2. Section đầu sau dòng mục đích là `## Tóm tắt`: kết luận trước, mỗi ý một bullet.
3. Mỗi nhận định có trích dẫn theo [Trích dẫn nguồn](docs.md#trích-dẫn-nguồn), hoặc mang một nhãn ở quy tắc 4. Nguồn web ghi ngày truy cập trong References.
4. Nội dung không lấy từ nguyên văn của nguồn gốc mang nhãn ngay tại câu, dòng bảng hoặc câu dẫn của bảng mà nhãn áp dụng:
   - `Thứ cấp`: lấy từ bản tóm tắt hoặc bài viết lại, chưa đối chiếu nguồn gốc.
   - `Inferred`: agent suy ra từ nguồn, nguồn không nói trực tiếp. Ghi nguồn và cách suy ra.
   - `Agent đề xuất`: không có nguồn ngoài. Ghi lý do.
5. Một con số đi kèm ngữ cảnh đo của nó: thí nghiệm hoặc benchmark, model, đại lượng đo. Không ghép hai con số từ hai thí nghiệm khác điều kiện thành một kết luận mà không có nhãn `Inferred`.
6. Ví dụ dùng code hoặc tài liệu của repo phải đúng với repo. Ví dụ giả định ghi rõ là giả định. Ví dụ từ nguồn ngoài giữ nguyên nghĩa của nguồn.
7. File kiến thức mô tả, không đặt quy tắc cho repo. Biện pháp chặn được mô tả như một biện pháp, ví dụ "Rule lint giới hạn việc đọc biến môi trường", không viết thành lệnh như "chỉ được phép" hoặc "không được". Quy tắc sinh từ kiến thức nằm ở tầng sở hữu nó và trích file kiến thức làm nguồn [[1]](#ref-1).
8. File kiến thức chỉ link tới nguồn của nó. Không link tới nơi áp dụng kiến thức, để không phải giữ một chỉ mục ngược đồng bộ bằng tay.

## References

1. <a id="ref-1"></a>[Conventions](README.md)
