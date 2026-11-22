# Baseline: Gửi request

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Gửi request".

## BL-REQ-A: Gửi request tạo deck từ tài liệu

- **Trigger:** Người dùng nhập yêu cầu trong một chat. Người dùng có thể đính kèm tài liệu. Sau đó người dùng bấm Gửi.
- **Precondition:** Workspace đang mở. Người dùng đã kết nối ít nhất một provider bằng key hợp lệ và đã chọn một model. Chat không có request nào đang chạy.
- **Kết quả khi thành công:** Người dùng thấy request trong chat và thấy tiến trình của agent. Sau đó người dùng thấy deck mới, có thể xem từng slide.
- **Kết quả khi thất bại:** Người dùng thấy request ở trạng thái lỗi, kèm lý do và cách xử lý. Nội dung đã nhập và tài liệu đã đính kèm vẫn còn, nên người dùng gửi lại được. Không có deck dở dang nào được hiển thị như một deck hoàn chỉnh.

**Luồng chính**
1. Người dùng nhập yêu cầu và đính kèm tài liệu.
2. Người dùng bấm Gửi.
3. Ứng dụng hiện request trong chat ở trạng thái "đang chạy". Ứng dụng khóa nút Gửi của chat này.
4. Agent đọc tài liệu và hiện tiến trình: đang đọc, đang lập outline, đang tạo slide.
5. Agent gọi dịch vụ bên ngoài (tìm kiếm, ảnh) khi cần. Người dùng thấy bước này trong tiến trình.
6. Agent tạo xong deck. Ứng dụng hiện deck và đổi request sang trạng thái "hoàn thành".
7. Ứng dụng mở lại nút Gửi.

**Luồng ngoại lệ**
- 1a. Yêu cầu rỗng và không có tài liệu: nút Gửi bị khóa, ứng dụng ghi rõ cần nhập gì.
- 1b. Yêu cầu có giới hạn về độ dài: khi vượt giới hạn, ứng dụng báo độ dài hiện tại so với giới hạn và không cho gửi.
- 1c. Tài liệu sai định dạng hoặc không đọc được: ứng dụng báo tên file và các định dạng được hỗ trợ. Người dùng có thể bỏ file đó và gửi phần còn lại.
- 1d. Tài liệu có giới hạn về dung lượng và số file đính kèm: khi vượt giới hạn, ứng dụng báo file nào vượt giới hạn.
- 1e. Tài liệu rỗng hoặc không có chữ (ví dụ bản scan): ứng dụng cảnh báo trước khi gửi rằng agent có thể không lấy được nội dung.
- 2a. Người dùng bấm Gửi nhiều lần liên tiếp: ứng dụng chỉ tạo một request.
- 2b. Provider chưa kết nối, key đã bị thu hồi, hoặc model không còn: ứng dụng báo lỗi và đưa người dùng tới phần kết nối provider. Nội dung đã nhập vẫn còn.
- 2c. Người dùng rời chat trước khi bấm Gửi rồi quay lại: bản nháp và file đính kèm vẫn còn.
- 3a. Hai giao diện mở cùng một chat: cả hai giao diện thấy cùng request đang chạy. Giao diện thứ hai không gửi được request mới vào chat này cho tới khi request hiện tại kết thúc. Giao diện này hiện lý do.
- 3b. Chat đã có request đang chạy (gửi từ trước): ứng dụng không cho gửi thêm và chỉ tới request đang chạy.
- 4a. Provider không trả lời: ứng dụng hiện "đang chờ provider". Sau một khoảng chờ có giới hạn, request chuyển sang lỗi "provider không phản hồi" và người dùng có nút Thử lại.
- 4b. Provider trả lỗi (key sai, hết hạn mức, quá tải, nội dung bị từ chối): ứng dụng hiện lỗi theo từng loại. Ứng dụng cho biết người dùng cần sửa key, chờ, hay đổi model.
- 4c. Tài liệu quá dài so với giới hạn ngữ cảnh của model: ứng dụng báo agent chỉ dùng được một phần tài liệu hoặc đề nghị đổi model. Ứng dụng không im lặng bỏ nội dung.
- 4d. Request chạy lâu: tiến trình vẫn cập nhật để người dùng biết request chưa bị treo. Người dùng có thể hủy (xem BL-REQ-B).
- 5a. Dịch vụ bên ngoài không trả lời hoặc trả lỗi: agent tiếp tục khi không có kết quả đó. Ứng dụng ghi rõ slide nào thiếu ảnh hoặc thiếu nguồn tìm kiếm. Request không thất bại toàn bộ chỉ vì lỗi này.
- 5b. Dịch vụ bên ngoài chưa được thiết lập: agent không dùng dịch vụ đó. Ứng dụng báo một lần rằng deck sẽ không có ảnh hoặc không có nguồn tìm kiếm.
- 4–6a. Người dùng rời chat hoặc chuyển workspace rồi quay lại: request vẫn chạy. Khi người dùng quay lại, ứng dụng hiện trạng thái hiện tại hoặc kết quả.
- 4–6b. Ứng dụng dừng hoặc khởi động lại trong lúc request chạy: sau khi khởi động, request hiện trạng thái "bị gián đoạn" (không hiện "đang chạy" mãi mãi). Người dùng có nút Thử lại. Nội dung yêu cầu và tài liệu vẫn còn.
- 6a. Agent chỉ tạo được một phần deck: ứng dụng ghi rõ deck chưa đầy đủ và các phần còn thiếu.
- 6b. Request hoàn thành khi người dùng ở chat khác: ứng dụng báo cho người dùng biết request đã xong.

## BL-REQ-B: Hủy request đang chạy

- **Trigger:** Người dùng bấm Dừng trên request đang chạy.
- **Precondition:** Chat có một request đang chạy.
- **Kết quả khi thành công:** Request chuyển sang "đã hủy". Agent dừng và không gọi thêm provider hoặc dịch vụ bên ngoài. Kết quả đã có được hiện là chưa hoàn chỉnh. Nút Gửi mở lại.
- **Kết quả khi thất bại:** Ứng dụng báo không hủy được. Request vẫn hiện trạng thái thật của nó.

**Luồng chính**
1. Người dùng bấm Dừng.
2. Ứng dụng hiện "đang dừng".
3. Agent dừng. Request chuyển sang "đã hủy".
4. Ứng dụng mở lại nút Gửi.

**Luồng ngoại lệ**
- 1a. Người dùng bấm Dừng nhiều lần: ứng dụng xử lý như một lần bấm.
- 1b. Request đã hoàn thành ngay trước khi người dùng bấm: ứng dụng giữ kết quả "hoàn thành" và báo không còn gì để dừng.
- 1c. Hai giao diện cùng mở chat: bấm Dừng ở một giao diện thì cả hai giao diện thấy "đã hủy".
- 3a. Provider không phản hồi lệnh dừng: sau một khoảng chờ có giới hạn, ứng dụng vẫn đánh dấu "đã hủy" và bỏ mọi kết quả đến sau.
- 3b. Ứng dụng dừng trong lúc đang hủy: sau khi khởi động, request hiện "đã hủy" hoặc "bị gián đoạn", không hiện "đang chạy".

## BL-REQ-C: Thử lại request bị lỗi hoặc bị gián đoạn

- **Trigger:** Người dùng bấm Thử lại trên request có trạng thái lỗi, đã hủy, hoặc bị gián đoạn.
- **Precondition:** Request đó còn nội dung yêu cầu và tài liệu gốc. Chat không có request nào đang chạy.
- **Kết quả khi thành công:** Một lần chạy mới bắt đầu với cùng nội dung, rồi đi theo BL-REQ-A từ bước 3. Ứng dụng vẫn giữ lần chạy cũ để người dùng xem.
- **Kết quả khi thất bại:** Ứng dụng báo lý do. Request cũ không bị thay đổi.

**Luồng chính**
1. Người dùng bấm Thử lại. Người dùng có thể đổi model trước khi bấm.
2. Ứng dụng kiểm tra provider, model và tài liệu.
3. Ứng dụng chạy lại theo BL-REQ-A từ bước 3.

**Luồng ngoại lệ**
- 1a. Người dùng bấm Thử lại nhiều lần: ứng dụng chỉ tạo một lần chạy.
- 1b. Request đã được thử lại và lần chạy mới đang chạy: nút Thử lại bị khóa.
- 2a. Tài liệu gốc không còn (file bị xóa hoặc bị di chuyển): ứng dụng báo file nào bị thiếu và cho người dùng đính kèm lại.
- 2b. Lỗi trước là do key hoặc hạn mức, và người dùng chưa sửa: ứng dụng cảnh báo rằng lỗi có thể xảy ra lại, nhưng vẫn cho thử lại.
- 2c. Hai giao diện cùng bấm Thử lại: ứng dụng chỉ tạo một lần chạy. Cả hai giao diện thấy lần chạy đó.

## BL-REQ-D: Gửi request chỉnh sửa deck đã có

- **Trigger:** Trong chat đã có deck, người dùng nhập yêu cầu sửa (ví dụ "rút gọn slide 3", "đổi outline") và bấm Gửi.
- **Precondition:** Chat có deck hoàn thành. Provider và model sẵn sàng. Chat không có request nào đang chạy.
- **Kết quả khi thành công:** Người dùng thấy deck đã sửa. Người dùng biết slide nào thay đổi và vẫn quay lại được bản trước đó.
- **Kết quả khi thất bại:** Deck trước đó không bị thay đổi. Ứng dụng báo lý do lỗi.

**Luồng chính**
1. Người dùng nhập yêu cầu sửa. Người dùng có thể chọn slide cần sửa.
2. Người dùng bấm Gửi.
3. Agent sửa deck và hiện tiến trình.
4. Ứng dụng hiện deck mới, đánh dấu các slide đã đổi, và giữ bản trước đó.

**Luồng ngoại lệ**
- 1a. Yêu cầu rỗng hoặc vượt giới hạn độ dài: xử lý như BL-REQ-A 1a, 1b.
- 1b. Yêu cầu nói tới slide không tồn tại: ứng dụng hoặc agent báo slide đó không tồn tại và không sửa gì.
- 1c. Người dùng đã tự sửa deck bằng tay trong lúc soạn yêu cầu: agent sửa trên bản mới nhất. Agent không ghi đè lên phần người dùng vừa sửa.
- 2a. Hai giao diện cùng sửa deck: request đến sau bị từ chối cho tới khi request trước kết thúc. Giao diện thứ hai thấy deck mới nhất.
- 3a. Provider hoặc dịch vụ bên ngoài lỗi, không trả lời, hoặc ứng dụng khởi động lại: xử lý như BL-REQ-A 4a–4b, 5a, 4–6b. Deck trước đó giữ nguyên.
- 3b. Người dùng hủy giữa chừng: deck trước đó giữ nguyên. Ứng dụng không trộn phần sửa dở vào deck.
- 4a. Agent không thay đổi gì: ứng dụng báo rõ rằng deck không thay đổi.

## Ghi chú của subagent

Suy luận, chưa kiểm chứng: subagent giả định mỗi chat chỉ có một request chạy tại một thời điểm, và chưa giả định hàng đợi. Subagent cũng giả định một lần thử lại giữ lại lần chạy cũ.
