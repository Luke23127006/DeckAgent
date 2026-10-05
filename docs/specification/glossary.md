# Bảng thuật ngữ

File này ghi mỗi khái niệm của DeckAgent bằng một tên duy nhất, để mọi item trong `specification/` gọi cùng một khái niệm bằng cùng một từ. Lint GX-07 đọc bảng bên dưới: item không được dùng từ nằm ở cột `Không dùng`. Business Rule dùng GBR-09 để đối chiếu danh từ nghiệp vụ với cột `Thuật ngữ`.

Quy ước đọc bảng:
- Mỗi dòng là một khái niệm. Cột `Không dùng` liệt kê các từ đồng nghĩa bị loại, cách nhau bằng dấu phẩy; để `—` nếu không có.
- Một từ có thể nằm ở cột `Không dùng` của nhiều dòng. Khi gặp từ đó, Lint gợi ý mọi thuật ngữ tương ứng; người review chọn theo ngữ cảnh.
- Một từ ở cột `Không dùng` có thể kèm điều kiện trong ngoặc ngay sau nó, ví dụ `preview (trong câu văn)`. Điều kiện chỉ áp cho từ đứng ngay trước ngoặc; từ không kèm điều kiện bị cấm ở mọi ngữ cảnh. Lint so phần trước ngoặc và hiện điều kiện trong cảnh báo để người review quyết định.
- Tên riêng viết trong backtick hoặc ngoặc kép được miễn GX-07: tên nguyên tắc chất lượng (P1–P5), tên sản phẩm và tên tính năng của bên khác. Lint bỏ qua chữ nằm trong backtick hoặc ngoặc kép; người review xác nhận đó là tên riêng.

| Thuật ngữ | Định nghĩa | Không dùng |
|---|---|---|
| deck | Sản phẩm đầu ra mà người dùng tạo, xem, sửa và tải về, gồm nhiều slide. | presentation, draft, working artifact, bài trình chiếu |
| slide | Một trang trong deck. Chữ “trang” vẫn dùng cho tài liệu và trang web. | page, trang slide |
| tài liệu có sẵn | File hoặc text người dùng đưa vào để AI lấy nội dung tạo deck: DOCX, PDF có text layer, TXT/Markdown, text dán vào, hoặc PPTX chỉ lấy nội dung (D-024). | source, content source, tài liệu nguồn |
| deck có sẵn | File PPTX người dùng muốn AI sửa tiếp và giữ nguyên bố cục gốc (UC-003). Khác “tài liệu có sẵn” ở chỗ bố cục được giữ. | existing presentation, imported artifact |
| deck mẫu | Deck hoặc slide người dùng đưa vào để AI học theo cấu trúc hoặc cách trình bày, không lấy làm nội dung (UC-007). | reference deck, reference (khi nói về deck hoặc slide mẫu) |
| yêu cầu | Nội dung người dùng gõ trong chat để tạo hoặc sửa deck. Khác Requirement (item trong `06-requirements/`). | prompt, instruction |
| ý định | Chủ đề, mục đích và audience mà người dùng muốn deck phục vụ. | intent |
| ràng buộc của người dùng | Điều kiện người dùng đặt cho deck, thuộc một trong 6 loại của BR-003: ngôn ngữ, độ dài (số slide), audience, mục đích, giọng văn, yêu cầu riêng; còn hiệu lực qua các lần sửa (BR-003). Khác Constraint (item trong `02-constraints/`). | user constraint, active constraint |
| lượt xử lý AI | Một lần AI tạo, sửa hoặc dịch deck, từ lúc bắt đầu tới lúc xong, bị dừng hoặc lỗi. | operation, generation, AI operation |
| bản đã chấp nhận | Phiên bản deck người dùng đã giữ; là bản để quay lại khi bỏ lần sửa (BR-010). | accepted state, authoritative state |
| bản chờ duyệt | Kết quả sửa mới nhất của AI mà người dùng chưa giữ hoặc bỏ. | pending result, kết quả chờ review |
| lần làm việc | Khoảng thời gian từ lúc mở ứng dụng hoặc bắt đầu deck mới tới lúc đóng hoặc bắt đầu deck khác. Ở V1, deck chỉ tồn tại trong một lần làm việc (D-027). | session, phiên làm việc, working state |
| phiên đăng nhập | Khoảng thời gian người dùng đăng nhập vào tài khoản (chỉ có khi DeckAgent có tài khoản). | session (khi nói về đăng nhập) |
| sửa cả deck | Lần sửa áp dụng cho toàn bộ deck: độ dài, giọng văn, audience, thứ tự, trau chuốt, thay đổi nội dung lớn, tạo lại cả deck (D-025). | deck-level refinement, refine |
| sửa cục bộ | Lần sửa chỉ được thay đổi đúng slide hoặc thành phần người dùng chỉ định (UC-023, Later). | localized editing, element-level editing, scoped modification |
| xem trước | Hiển thị deck trong ứng dụng trước khi người dùng giữ, sửa tiếp hoặc tải về. | preview (trong câu văn) |
| tải về | Xuất deck thành file theo một định dạng của D-031 (PPTX, PDF, PNG, SVG) để dùng ngoài DeckAgent. | export (trong câu văn) |
| dàn ý | Danh sách slide và ý chính trước khi AI tạo nội dung chi tiết. | outline |
| theme | Bộ màu, font và bố cục áp dụng thống nhất cho cả deck. | style (khi nói về giao diện), template (khi nói về giao diện) |
| bộ nhận diện | Màu, font và logo của một tổ chức mà deck phải theo. | brand, brand kit |
| kiểm tra kết quả | Bước hệ thống kiểm tra đầu ra của AI trước khi đưa cho người dùng (R-033). | validate (trong câu văn), validation (trong câu văn) |
| cố gắng, không đảm bảo | Mức cam kết trong đó Hệ thống thử làm đúng nhưng không cam kết kết quả. Ở V1, sửa theo slide ở mức này (BR-011). | best effort |
| Hệ thống | DeckAgent nói chung, gồm giao diện và xử lý phía sau. Tên riêng `DeckAgent` dùng trong câu Yêu cầu của Requirement, theo `system_name` của `schema.json`; các section khác dùng “Hệ thống”. | app, tool, platform |
| AI | Phần model sinh hoặc sửa nội dung; gọi tới model AI của nhà cung cấp bên ngoài (ACT-002). | LLM, agent (khi nói về phần AI bên trong DeckAgent) |
| deck dùng được | Deck đạt R-021 (chất lượng deck tối thiểu); khi deck được tạo từ tài liệu có sẵn, deck đạt thêm R-007 (giữ đúng số liệu từ tài liệu) | — |
