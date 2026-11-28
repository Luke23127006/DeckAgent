# Baseline: Workspace

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Workspace".

## Ghi chú phạm vi của subagent

Subagent không đọc repo. Vì vậy "workspace" ở đây theo cách subagent suy luận từ loại sản phẩm này: workspace là nơi người dùng gom tài liệu nguồn, các chat và các deck của một chủ đề. Nếu project định nghĩa workspace khác (ví dụ: workspace = thư mục trên máy), thì phải kiểm lại BL-WS-3 "Thêm tài liệu" và BL-WS-6 "Xóa workspace". Workspace không gọi provider hay dịch vụ bên ngoài trực tiếp. Vì vậy câu hỏi ngoại lệ về provider chỉ áp dụng khi tài liệu cần được xử lý trước khi dùng (trích nội dung).

## BL-WS-1: Tạo workspace

- **Trigger:** Người dùng chọn tạo workspace mới.
- **Precondition:** Ứng dụng đang chạy.
- **Thành công:** Có một workspace mới với tên người dùng đặt. Workspace đó đang mở, chưa có tài liệu, chưa có chat. Workspace có trong danh sách workspace.
- **Thất bại:** Không có workspace mới. Danh sách workspace không đổi. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn tạo workspace.
2. Ứng dụng hỏi tên workspace.
3. Người dùng nhập tên và xác nhận.
4. Ứng dụng tạo workspace, mở workspace đó và hiện workspace trong danh sách.

**Luồng ngoại lệ**
- 3a. Tên rỗng hoặc chỉ có khoảng trắng: ứng dụng không tạo workspace, báo cần nhập tên, giữ form.
- 3b. Tên quá dài (độ dài tên có giới hạn): ứng dụng báo giới hạn và không cắt tên một cách âm thầm.
- 3c. Tên chứa ký tự không hợp lệ: ứng dụng báo ký tự nào không được dùng.
- 3d. Tên trùng với workspace đã có: ứng dụng báo trùng và cho người dùng đổi tên. (Chưa chắc: sản phẩm có thể cho phép trùng tên. Cần chốt.)
- 3e. Số workspace đã đạt giới hạn (số workspace có giới hạn): ứng dụng báo giới hạn và không tạo.
- 3f. Người dùng nhấn xác nhận nhiều lần: ứng dụng chỉ tạo một workspace.
- 3g. Người dùng hủy hoặc rời form: ứng dụng không tạo workspace. Khi người dùng quay lại, form trống.
- 4a. Ứng dụng dừng trong lúc tạo: sau khi khởi động lại, workspace có đầy đủ hoặc không có. Không có workspace tạo dở.
- 4b. Hai giao diện cùng mở: giao diện kia thấy workspace mới trong danh sách mà không cần khởi động lại.

## BL-WS-2: Mở hoặc chuyển workspace

- **Trigger:** Người dùng chọn một workspace trong danh sách, hoặc khởi động ứng dụng.
- **Precondition:** Có ít nhất một workspace.
- **Thành công:** Workspace được chọn đang mở. Người dùng thấy tài liệu, chat và deck của workspace đó. Không thấy nội dung của workspace khác.
- **Thất bại:** Workspace đang mở trước đó giữ nguyên. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng mở danh sách workspace.
2. Ứng dụng hiện các workspace.
3. Người dùng chọn một workspace.
4. Ứng dụng mở workspace và hiện tài liệu, chat, deck của workspace đó.

**Luồng ngoại lệ**
- 2a. Chưa có workspace nào: ứng dụng mời người dùng tạo workspace (BL-WS-1).
- 2b. Danh sách dài (số workspace hiện được có giới hạn): ứng dụng cho tìm theo tên.
- 3a. Workspace được chọn đã bị xóa ở giao diện khác: ứng dụng báo workspace không còn và làm mới danh sách.
- 3b. Người dùng chọn workspace đang mở: ứng dụng không làm gì thêm.
- 3c. Workspace hiện tại có request đang chạy: ứng dụng báo request tiếp tục chạy trong workspace cũ. Người dùng thấy kết quả khi quay lại. (Suy luận. Cũng có thể sản phẩm chặn chuyển workspace hoặc hủy request. Cần chốt.)
- 4a. Dữ liệu của workspace không đọc được: ứng dụng báo workspace bị lỗi và không hiện nội dung sai. Các workspace khác vẫn mở được.
- 4b. Ứng dụng khởi động lại: ứng dụng mở lại workspace dùng gần nhất. Nếu workspace đó không còn, ứng dụng hiện danh sách.

## BL-WS-3: Thêm tài liệu vào workspace

- **Trigger:** Người dùng chọn thêm tài liệu, hoặc kéo file vào workspace.
- **Precondition:** Một workspace đang mở.
- **Thành công:** Tài liệu có trong workspace với trạng thái "sẵn sàng". Agent dùng được tài liệu đó trong chat và khi tạo deck.
- **Thất bại:** Tài liệu không được thêm, hoặc có mặt với trạng thái "lỗi" và lý do. Các tài liệu khác không đổi.

**Luồng chính**
1. Người dùng chọn một hoặc nhiều file.
2. Ứng dụng kiểm tra từng file.
3. Ứng dụng thêm file vào workspace và hiện trạng thái "đang xử lý".
4. Ứng dụng trích nội dung của file.
5. Ứng dụng hiện tài liệu với trạng thái "sẵn sàng".

**Luồng ngoại lệ**
- 1a. Người dùng không chọn file: ứng dụng không làm gì.
- 2a. Định dạng file không được hỗ trợ: ứng dụng báo định dạng không hỗ trợ và nêu các định dạng được hỗ trợ. Các file hợp lệ khác vẫn được thêm.
- 2b. File rỗng: ứng dụng báo file không có nội dung và không thêm.
- 2c. File quá lớn (dung lượng file có giới hạn), hoặc workspace đã đạt giới hạn (số tài liệu hoặc tổng dung lượng có giới hạn): ứng dụng báo giới hạn nào bị vượt.
- 2d. File bị hỏng, có mật khẩu, hoặc không đọc được: ứng dụng báo lý do cho file đó.
- 2e. File đã có trong workspace: ứng dụng báo trùng và cho người dùng chọn thay thế, giữ cả hai, hoặc bỏ qua.
- 3a. Người dùng thêm lại cùng file khi file đang xử lý: ứng dụng không tạo bản trùng.
- 4a. Việc trích nội dung cần provider hoặc dịch vụ bên ngoài (ví dụ: đọc chữ trong ảnh), và dịch vụ không trả lời hoặc trả lỗi: tài liệu có trạng thái "lỗi" kèm lý do và nút thử lại.
- 4b. Việc trích mất nhiều thời gian: ứng dụng hiện tiến độ. Người dùng tiếp tục làm việc khác trong workspace.
- 4c. Nội dung trích ra quá dài so với giới hạn mà agent dùng được (lượng nội dung có giới hạn): ứng dụng báo agent chỉ dùng được một phần. (Chưa chắc cách xử lý đúng. Cần chốt.)
- 4d. Người dùng rời workspace rồi quay lại: trạng thái xử lý vẫn đúng.
- 4e. Ứng dụng dừng trong lúc xử lý: sau khi khởi động lại, tài liệu không kẹt ở "đang xử lý". Ứng dụng xử lý tiếp, hoặc đặt trạng thái "lỗi" kèm nút thử lại.
- 5a. Hai giao diện cùng mở workspace: cả hai thấy tài liệu mới và cùng một trạng thái.
- 5b. Một chat đang chạy khi tài liệu được thêm: ứng dụng nói rõ tài liệu mới có được dùng cho request đang chạy hay chỉ từ request sau. (Cần chốt.)

## BL-WS-4: Xóa tài liệu khỏi workspace

- **Trigger:** Người dùng chọn xóa một tài liệu.
- **Precondition:** Workspace đang mở và có ít nhất một tài liệu.
- **Thành công:** Tài liệu không còn trong workspace. Agent không dùng tài liệu đó cho request mới. Các deck đã tạo không đổi.
- **Thất bại:** Tài liệu vẫn còn. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn xóa tài liệu.
2. Ứng dụng hỏi xác nhận.
3. Người dùng xác nhận.
4. Ứng dụng xóa tài liệu và cập nhật danh sách.

**Luồng ngoại lệ**
- 2a. Người dùng hủy: tài liệu giữ nguyên.
- 3a. Tài liệu đang được một request dùng: ứng dụng báo request đó đang dùng tài liệu và cho người dùng chờ, hoặc vẫn xóa (tài liệu chỉ bị loại khỏi request sau). (Cần chốt.)
- 3b. Tài liệu đã bị xóa ở giao diện khác: ứng dụng báo tài liệu không còn và làm mới danh sách. Ứng dụng không báo lỗi gây hiểu nhầm.
- 3c. Người dùng nhấn xóa nhiều lần: kết quả giống một lần.
- 4a. Ứng dụng dừng trong lúc xóa: sau khi khởi động lại, tài liệu còn đầy đủ hoặc đã mất hẳn.

## BL-WS-5: Đổi tên workspace

- **Trigger:** Người dùng chọn đổi tên workspace.
- **Precondition:** Workspace tồn tại.
- **Thành công:** Workspace có tên mới ở mọi nơi hiện tên đó. Nội dung không đổi.
- **Thất bại:** Tên cũ giữ nguyên. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn đổi tên.
2. Người dùng nhập tên mới và xác nhận.
3. Ứng dụng lưu tên mới và hiện tên mới.

**Luồng ngoại lệ**
- 2a. Tên rỗng, quá dài (độ dài có giới hạn), có ký tự không hợp lệ, hoặc trùng tên: ứng dụng xử lý như BL-WS-1 bước 3a–3d.
- 2b. Tên mới giống tên cũ: ứng dụng không báo lỗi và không đổi gì.
- 2c. Người dùng rời form: tên cũ giữ nguyên.
- 3a. Giao diện khác đổi tên cùng lúc: tên cuối cùng hiện giống nhau ở cả hai giao diện.
- 3b. Workspace đã bị xóa ở giao diện khác: ứng dụng báo workspace không còn.

## BL-WS-6: Xóa workspace

- **Trigger:** Người dùng chọn xóa một workspace.
- **Precondition:** Workspace tồn tại.
- **Thành công:** Workspace cùng tài liệu, chat và deck của workspace đó không còn trong ứng dụng. Các workspace khác không đổi.
- **Thất bại:** Workspace giữ nguyên đầy đủ. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn xóa workspace.
2. Ứng dụng hiện những gì sẽ mất (số tài liệu, chat, deck) và hỏi xác nhận.
3. Người dùng xác nhận.
4. Ứng dụng xóa workspace và chuyển người dùng sang danh sách workspace.

**Luồng ngoại lệ**
- 2a. Người dùng hủy: workspace giữ nguyên.
- 3a. Workspace có request đang chạy: ứng dụng báo và cho người dùng dừng request trước, hoặc dừng request rồi xóa.
- 3b. Người dùng xác nhận nhiều lần: kết quả giống một lần.
- 3c. Workspace đã bị xóa ở giao diện khác: ứng dụng báo workspace không còn và làm mới danh sách.
- 4a. Giao diện khác đang mở workspace này: giao diện đó báo workspace đã bị xóa và chuyển sang danh sách.
- 4b. Ứng dụng dừng trong lúc xóa: sau khi khởi động lại, workspace còn đầy đủ hoặc đã mất hẳn. Không có workspace còn một nửa.
- 4c. Đây là workspace cuối cùng: ứng dụng hiện trạng thái chưa có workspace (BL-WS-2, 2a).

## Các điểm subagent để ngỏ

- Tên workspace có được trùng không.
- Chuyển workspace khi request đang chạy thì làm gì.
- Request đang chạy có dùng tài liệu mới thêm vào, hoặc vừa bị xóa không.
- Tài liệu dài hơn giới hạn của agent thì xử lý thế nào.
- Xóa workspace có thể hoàn tác (thùng rác) hay xóa hẳn. Bản trên giả định xóa hẳn.
