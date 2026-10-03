# Bảng thuật ngữ

File này ghi mỗi khái niệm của DeckAgent bằng một tên duy nhất, để mọi item trong `specification/` gọi cùng một khái niệm bằng cùng một từ. Lint GX-07 đọc bảng bên dưới: item không được dùng từ nằm ở cột `Không dùng`. Business Rule dùng GBR-09 để đối chiếu danh từ nghiệp vụ với cột `Thuật ngữ`.

Quy ước đọc bảng:
- Mỗi dòng là một khái niệm. Cột `Không dùng` liệt kê các từ đồng nghĩa bị loại, cách nhau bằng dấu phẩy; để `—` nếu không có.
- Một từ có thể nằm ở cột `Không dùng` của nhiều dòng. Khi gặp từ đó, Lint gợi ý mọi thuật ngữ tương ứng; người review chọn theo ngữ cảnh.
- Một từ ở cột `Không dùng` có thể kèm điều kiện trong ngoặc ngay sau nó, ví dụ `preview (trong câu văn)`. Điều kiện chỉ áp cho từ đứng ngay trước ngoặc; từ không kèm điều kiện bị cấm ở mọi ngữ cảnh. Lint so phần trước ngoặc và hiện điều kiện trong cảnh báo để người review quyết định.
- Tên riêng viết trong backtick hoặc ngoặc kép được miễn GX-07: tên nguyên tắc chất lượng (P1–P5), tên sản phẩm và tên tính năng của bên khác. Lint bỏ qua chữ nằm trong backtick hoặc ngoặc kép; người review xác nhận đó là tên riêng.

| Thuật ngữ | Định nghĩa | Không dùng |
|---|---|---|
| deck dùng được | Deck đạt R-021 (chất lượng deck tối thiểu); khi deck được tạo từ tài liệu có sẵn, deck đạt thêm R-007 (giữ đúng số liệu từ tài liệu) | — |
