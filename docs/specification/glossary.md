# Bảng thuật ngữ

File này ghi mỗi khái niệm của DeckAgent bằng một tên duy nhất, để mọi item trong `specification/` gọi cùng một khái niệm bằng cùng một từ. Lint GX-07 đọc bảng bên dưới: item không được dùng từ nằm ở cột `Không dùng`. Business Rule dùng GBR-09 để đối chiếu danh từ nghiệp vụ với cột `Thuật ngữ`.

Quy ước đọc bảng:
- Mỗi dòng là một khái niệm. Cột `Không dùng` liệt kê các từ đồng nghĩa bị loại, cách nhau bằng dấu phẩy; để `—` nếu không có.
- Dòng có `Thuật ngữ` bắt đầu bằng `[VÍ DỤ]` chỉ để minh họa định dạng. Lint bỏ qua dòng này; xóa dòng khi thêm thuật ngữ thật đầu tiên.

Chưa có thuật ngữ thật. Thuật ngữ sẽ được đưa vào khi migrate nội dung từ Google Sheet.

| Thuật ngữ | Định nghĩa | Không dùng |
|---|---|---|
| [VÍ DỤ] Đơn đặt vé | Yêu cầu mua một hoặc nhiều vé của một sự kiện, do một người mua tạo (ví dụ minh họa, không thuộc DeckAgent) | đơn hàng, order, booking |
