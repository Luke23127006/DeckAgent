# Baseline: Provider và model

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Provider và model".

## BL-P1: Kết nối provider bằng key riêng

- **Trigger:** Người dùng muốn dùng một provider mà chưa kết nối, hoặc ứng dụng báo chưa có provider nào khi người dùng tạo request.
- **Precondition:** Ứng dụng đang chạy. Người dùng có tài khoản và key của provider.
- **Thành công:** Provider hiện ở trạng thái "đã kết nối" và có danh sách model dùng được. Key không hiện lại dạng đầy đủ, chỉ hiện dạng che.
- **Thất bại:** Provider vẫn ở trạng thái "chưa kết nối". Người dùng thấy lý do và biết cần làm gì tiếp. Dữ liệu đã nhập không được lưu thành kết nối dùng được.

**Luồng chính**
1. Người dùng mở phần cài đặt provider.
2. Ứng dụng hiện danh sách provider được hỗ trợ và trạng thái của từng provider.
3. Người dùng chọn một provider.
4. Người dùng nhập key, và thông tin bổ sung nếu provider cần.
5. Người dùng bấm kết nối.
6. Ứng dụng kiểm tra key với provider.
7. Ứng dụng báo kết nối thành công và hiện danh sách model của provider.

**Ngoại lệ**
- 2a. Không có provider nào được hỗ trợ trên máy này (ví dụ ứng dụng chạy chế độ hạn chế): ứng dụng hiện thông báo và không cho tiếp tục.
- 3a. Provider đã kết nối trước đó: ứng dụng hiện trạng thái hiện có và đề nghị thay key (xem BL-P2), không tạo kết nối thứ hai.
- 4a. Key rỗng: nút kết nối bị khóa hoặc ứng dụng báo "chưa nhập key".
- 4b. Key sai định dạng của provider (ví dụ thiếu tiền tố, có khoảng trắng, có xuống dòng khi dán): ứng dụng bỏ khoảng trắng ở đầu và cuối. Nếu key vẫn sai định dạng, ứng dụng báo lỗi định dạng trước khi gọi provider.
- 4c. Key dài hơn giới hạn độ dài: ứng dụng từ chối và báo key quá dài.
- 6a. Provider từ chối key (key sai, key đã bị thu hồi): ứng dụng báo "key không hợp lệ", giữ form để người dùng sửa.
- 6b. Key đúng nhưng tài khoản không dùng được (hết quota, hết tiền, không có quyền với model nào): ứng dụng báo đúng lý do này và phân biệt lý do này với lỗi key sai.
- 6c. Provider không trả lời trong giới hạn thời gian chờ: ứng dụng báo "provider không phản hồi". Người dùng có thể thử lại. Kết nối chưa được lưu.
- 6d. Máy không có mạng: ứng dụng báo lỗi mạng và phân biệt lỗi này với lỗi key.
- 6e. Provider trả lời bị lỗi hoặc trả nội dung ứng dụng không hiểu: ứng dụng báo lỗi chung từ provider, không báo key sai.
- 5a. Người dùng bấm kết nối nhiều lần khi đang kiểm tra: ứng dụng chỉ chạy một lần kiểm tra. Nút ở trạng thái đang xử lý.
- 6f. Người dùng đóng màn hình cài đặt trong lúc kiểm tra: khi quay lại, ứng dụng hiện kết quả cuối cùng (đã kết nối hoặc chưa kết nối). Ứng dụng không giữ trạng thái "đang kiểm tra" mãi.
- 6g. Ứng dụng dừng trong lúc kiểm tra: sau khi khởi động lại, provider ở trạng thái chưa kết nối. Người dùng cần kết nối lại. Ứng dụng không hiện kết nối dở dang.
- 6h. Hai giao diện cùng mở cài đặt và cùng kết nối một provider: chỉ một kết nối tồn tại. Giao diện còn lại cập nhật trạng thái mới, không ghi đè ngầm.
- 7a. Provider không trả về model nào dùng được: ứng dụng báo kết nối thành công nhưng chưa có model, nên chưa tạo request được.

## BL-P2: Thay key hoặc ngắt kết nối provider

- **Trigger:** Key hết hạn, key bị lộ, người dùng đổi tài khoản, hoặc người dùng không muốn dùng provider nữa.
- **Precondition:** Provider đang ở trạng thái đã kết nối.
- **Thành công:** Khi thay key, provider dùng key mới cho request kế tiếp. Khi ngắt kết nối, key bị xóa khỏi ứng dụng, provider về trạng thái chưa kết nối, và model của provider không còn chọn được.
- **Thất bại:** Kết nối cũ giữ nguyên như trước. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng mở provider đã kết nối.
2. Người dùng chọn "thay key" hoặc "ngắt kết nối".
3. Khi thay key: người dùng nhập key mới, ứng dụng kiểm tra key như BL-P1 bước 6, rồi ứng dụng dùng key mới thay key cũ.
4. Khi ngắt kết nối: ứng dụng hỏi xác nhận và nêu ảnh hưởng (ví dụ các chat đang chọn model của provider này). Người dùng xác nhận.
5. Ứng dụng báo kết quả.

**Ngoại lệ**
- 3a. Key mới bị từ chối, hoặc provider không phản hồi: ứng dụng giữ key cũ và báo lỗi. Ứng dụng không để provider ở trạng thái không có key.
- 3b. Key mới thuộc tài khoản khác có ít model hơn: ứng dụng báo các model không còn dùng được và các chat bị ảnh hưởng.
- 4a. Có request đang chạy bằng provider này: ứng dụng cảnh báo. Người dùng chọn đợi request xong hoặc dừng request. Ứng dụng không cắt ngầm request đang chạy.
- 4b. Người dùng bấm ngắt kết nối hai lần, hoặc provider đã được ngắt ở giao diện khác: ứng dụng báo provider đã ở trạng thái chưa kết nối, không báo lỗi.
- 4c. Ứng dụng dừng ngay sau khi người dùng xác nhận: sau khi khởi động lại, provider ở một trạng thái rõ ràng (đã ngắt hẳn hoặc vẫn kết nối đủ), không ở trạng thái nửa vời.
- 4d. Chat sau đó mở lại khi model đã chọn không còn: ứng dụng báo model không còn dùng được và yêu cầu chọn model khác (BL-P3).

## BL-P3: Chọn model cho chat

- **Trigger:** Người dùng bắt đầu chat mới, hoặc muốn đổi model trong chat hiện có.
- **Precondition:** Ít nhất một provider đã kết nối và có model dùng được.
- **Thành công:** Chat hiện model đã chọn. Request kế tiếp trong chat chạy bằng model đó.
- **Thất bại:** Chat giữ model cũ, hoặc chưa có model. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng mở bộ chọn model trong chat.
2. Ứng dụng hiện các model dùng được, nhóm theo provider, với thông tin mà người dùng cần để chọn (ví dụ khả năng đọc ảnh, giới hạn độ dài ngữ cảnh).
3. Người dùng chọn một model.
4. Ứng dụng gán model cho chat và hiện model đó trên chat.

**Ngoại lệ**
- 2a. Không có provider nào đã kết nối: ứng dụng hiện lối tắt tới BL-P1 thay vì hiện danh sách rỗng.
- 2b. Danh sách model của provider đã cũ (provider thêm hoặc bỏ model): người dùng có thể làm mới danh sách. Khi làm mới lỗi, ứng dụng giữ danh sách cũ và báo lỗi.
- 3a. Model không đáp ứng yêu cầu của request (ví dụ tài liệu cần đọc ảnh nhưng model không đọc được ảnh, hoặc tài liệu vượt giới hạn độ dài ngữ cảnh của model): ứng dụng cảnh báo trước khi người dùng gửi request.
- 3b. Người dùng chọn lại đúng model đang dùng: không có thay đổi, ứng dụng không báo lỗi.
- 3c. Người dùng đổi model khi request trong chat đang chạy: request đang chạy giữ model cũ. Model mới áp dụng cho request kế tiếp. Ứng dụng nói rõ điều này.
- 4a. Hai giao diện mở cùng một chat và chọn hai model khác nhau: lựa chọn sau cùng có hiệu lực, và cả hai giao diện hiện cùng model đó.
- 4b. Ứng dụng khởi động lại: chat vẫn hiện model đã chọn. Nếu model không còn dùng được, ứng dụng báo khi người dùng mở chat.

## BL-P4: Chạy request bằng model đã chọn và xử lý lỗi provider

Người dùng thấy use case này như một phần của việc tạo deck. Phần ở đây chỉ gồm hành vi liên quan tới provider và model.

- **Trigger:** Người dùng gửi request trong chat (ví dụ tạo outline hoặc tạo slide từ tài liệu).
- **Precondition:** Chat có model dùng được. Provider của model đang kết nối.
- **Thành công:** Agent trả kết quả. Người dùng thấy request chạy bằng model nào.
- **Thất bại:** Request dừng và ghi rõ lý do từ provider. Phần kết quả đã có trước đó (ví dụ outline) không bị mất. Người dùng có thể thử lại hoặc đổi model.

**Luồng chính**
1. Người dùng gửi request.
2. Ứng dụng hiện request đang chạy và model đang dùng.
3. Agent gọi model nhiều lần trong lúc làm việc. Người dùng thấy tiến độ.
4. Agent trả kết quả và request kết thúc.

**Ngoại lệ**
- 1a. Request vượt giới hạn độ dài ngữ cảnh của model: ứng dụng báo trước khi gửi, hoặc ngay khi provider từ chối, và gợi ý đổi model hoặc rút gọn tài liệu.
- 1b. Người dùng gửi cùng request hai lần: ứng dụng không chạy hai request song song ngoài ý muốn. Ứng dụng khóa nút gửi hoặc hỏi lại người dùng.
- 3a. Provider báo giới hạn tần suất (rate limit): ứng dụng có thể đợi rồi thử lại trong giới hạn số lần thử lại. Người dùng thấy ứng dụng đang đợi provider. Sau giới hạn số lần thử lại, request dừng và ứng dụng báo lý do.
- 3b. Hết quota hoặc hết tiền giữa chừng: request dừng. Ứng dụng báo đúng lý do này và nói rõ phần nào đã làm xong.
- 3c. Key bị thu hồi giữa chừng: request dừng. Ứng dụng báo key không còn hợp lệ và chỉ tới BL-P2.
- 3d. Provider không trả lời trong giới hạn thời gian chờ, hoặc mất mạng: request dừng với lỗi rõ ràng. Request không ở trạng thái "đang chạy" mãi.
- 3e. Model bị provider gỡ bỏ: request dừng. Ứng dụng yêu cầu chọn model khác (BL-P3).
- 3f. Provider trả nội dung bị chặn bởi bộ lọc nội dung của provider: ứng dụng báo nội dung bị provider từ chối và không báo đây là lỗi của ứng dụng.
- 3g. Người dùng rời chat rồi quay lại: request vẫn chạy, hoặc ứng dụng hiện kết quả cuối cùng của request.
- 3h. Hai giao diện mở cùng chat: cả hai giao diện thấy cùng trạng thái và cùng tiến độ của request.
- 3i. Ứng dụng dừng giữa chừng: sau khi khởi động lại, request hiện trạng thái "bị gián đoạn", không hiện "đang chạy". Người dùng có thể chạy lại.
- 3j. Người dùng dừng request: ứng dụng ngừng gọi provider và giữ phần kết quả đã có.
- 4a. Thử lại sau lỗi: request chạy lại với model hiện tại của chat. Request không tạo trùng kết quả đã hoàn tất.

## BL-P5: Thiết lập dịch vụ bên ngoài (tìm kiếm, ảnh)

- **Trigger:** Người dùng muốn agent tìm thông tin trên web hoặc tạo/tìm ảnh cho slide.
- **Precondition:** Người dùng có tài khoản và key của dịch vụ.
- **Thành công:** Dịch vụ ở trạng thái đã kết nối. Agent có thể dùng dịch vụ trong request kế tiếp.
- **Thất bại:** Dịch vụ vẫn chưa kết nối. Request vẫn chạy được, nhưng request không dùng dịch vụ đó.

**Luồng chính**
1. Người dùng mở cài đặt dịch vụ bên ngoài.
2. Người dùng chọn loại dịch vụ (tìm kiếm hoặc ảnh) và nhà cung cấp dịch vụ.
3. Người dùng nhập key.
4. Ứng dụng kiểm tra key với dịch vụ.
5. Ứng dụng báo thành công.

**Ngoại lệ**
- 3a. Key rỗng, sai định dạng, hoặc dài hơn giới hạn độ dài: các trường hợp giống BL-P1 bước 4a đến 4c.
- 4a. Dịch vụ từ chối key, dịch vụ không phản hồi, hoặc dịch vụ trả lỗi: các trường hợp giống BL-P1 bước 6a đến 6e. Ứng dụng không lưu kết nối.
- 4b. Dịch vụ đã kết nối trước đó: ứng dụng đề nghị thay key hoặc ngắt kết nối, giống BL-P2.
- 4c. Bấm nhiều lần, rời màn hình, ứng dụng khởi động lại, hai giao diện cùng thao tác: các trường hợp giống BL-P1.
- Khi dùng trong request: nếu dịch vụ lỗi hoặc hết quota, agent tiếp tục request mà không dùng dịch vụ (ví dụ slide có chỗ trống cho ảnh). Agent báo rõ phần nào thiếu và vì sao. Request không thất bại toàn bộ chỉ vì dịch vụ phụ lỗi.

## BL-P6: Xem trạng thái và mức sử dụng của provider

- **Trigger:** Người dùng muốn biết vì sao request lỗi, hoặc muốn biết mình đã dùng bao nhiêu.
- **Precondition:** Ít nhất một provider hoặc một dịch vụ đã được thiết lập.
- **Thành công:** Người dùng thấy trạng thái từng kết nối (hoạt động, key lỗi, hết quota, không phản hồi), lỗi gần nhất, và mức sử dụng mà ứng dụng ghi nhận được theo request hoặc theo chat.
- **Thất bại:** Ứng dụng nói rõ thông tin nào không lấy được. Ứng dụng không hiện số liệu sai.

**Luồng chính**
1. Người dùng mở trang trạng thái provider.
2. Ứng dụng hiện trạng thái hiện tại và lỗi gần nhất của từng kết nối.
3. Người dùng có thể bấm kiểm tra lại một kết nối.
4. Ứng dụng hiện mức sử dụng ghi nhận được.

**Ngoại lệ**
- 2a. Trạng thái đã cũ: ứng dụng ghi thời điểm kiểm tra gần nhất.
- 3a. Kiểm tra lại bị lỗi hoặc không có phản hồi: ứng dụng cập nhật trạng thái lỗi và giữ thông tin cũ kèm thời điểm. Bấm kiểm tra nhiều lần chỉ chạy một lần kiểm tra.
- 4a. Provider không cung cấp số liệu sử dụng: ứng dụng chỉ hiện số liệu ứng dụng tự ghi nhận và nói rõ đây là ước tính.
- 4b. Sau khi ứng dụng khởi động lại: lịch sử sử dụng đã ghi nhận vẫn còn.

## Ghi chú của subagent

Các điểm subagent tự suy luận: phạm vi của BL-P6 (theo dõi mức sử dụng có thuộc MVP không), hành vi "thử lại tự động khi gặp rate limit" ở BL-P4 3a, và quy tắc "lựa chọn sau cùng có hiệu lực" khi hai giao diện cùng sửa (BL-P3 4a).
