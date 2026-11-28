# Baseline: Chat

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Chat".

## BL-CHAT-1: Bắt đầu chat mới để tạo deck

**Trigger:** Người dùng chọn tạo chat mới trong một workspace.
**Precondition:** Ứng dụng đang chạy. Người dùng đã mở một workspace. Người dùng đã kết nối ít nhất một provider.
**Kết quả khi thành công:** Workspace có một chat mới. Chat trống và sẵn sàng nhận request đầu tiên. Chat hiện model đang được chọn.
**Kết quả khi thất bại:** Ứng dụng không tạo chat. Người dùng thấy lý do và cách sửa. Danh sách chat cũ không thay đổi.

**Luồng chính:**
1. Người dùng chọn "Chat mới".
2. Ứng dụng tạo chat và mở chat đó.
3. Ứng dụng hiện provider và model mặc định cho chat.
4. Người dùng thấy ô nhập request.

**Luồng ngoại lệ:**
- 1a. Người dùng chưa kết nối provider nào: ứng dụng không tạo chat và đưa người dùng đến phần kết nối provider.
- 1b. Người dùng nhấn "Chat mới" nhiều lần liên tiếp: ứng dụng tạo một chat cho mỗi lần nhấn có chủ đích, hoặc mở lại chat trống chưa dùng. Ứng dụng không tạo nhiều chat trống trùng nhau.
- 2a. Workspace đã đạt giới hạn số chat (nếu có giới hạn): ứng dụng báo giới hạn và đề nghị xóa hoặc lưu trữ chat cũ.
- 2b. Ứng dụng dừng trong lúc tạo chat: sau khi khởi động lại, người dùng thấy chat đã tạo xong, hoặc không thấy chat nào. Người dùng không thấy chat hỏng một nửa.
- 3a. Model mặc định không còn khả dụng (provider đã bị ngắt kết nối hoặc key hết hạn): ứng dụng báo và yêu cầu người dùng chọn model khác.
- 4a. Hai giao diện mở cùng workspace: chat mới hiện ở cả hai giao diện.

## BL-CHAT-2: Gửi request và nhận deck

**Trigger:** Người dùng nhập request (kèm hoặc không kèm tài liệu) và gửi.
**Precondition:** Chat đang mở. Provider và model đã chọn khả dụng.
**Kết quả khi thành công:** Agent trả lời trong chat. Người dùng thấy tiến độ từng bước, outline và deck với các slide. Request và kết quả được giữ trong lịch sử chat.
**Kết quả khi thất bại:** Người dùng thấy request đã gửi, phần kết quả đã có (nếu có) và lý do lỗi. Người dùng có thể gửi lại request.

**Luồng chính:**
1. Người dùng nhập request.
2. Người dùng đính kèm tài liệu nguồn (không bắt buộc).
3. Người dùng gửi request.
4. Ứng dụng hiện request trong chat và báo agent đang làm việc.
5. Agent đọc tài liệu và gửi yêu cầu đến model của provider.
6. Agent dùng dịch vụ bên ngoài (tìm kiếm, ảnh) khi cần.
7. Ứng dụng hiện tiến độ và outline trong lúc agent làm việc.
8. Agent tạo deck. Ứng dụng hiện deck và các slide.
9. Ứng dụng báo request đã hoàn thành.

**Luồng ngoại lệ:**
- 1a. Request rỗng hoặc chỉ có khoảng trắng: ứng dụng không cho gửi.
- 1b. Request vượt giới hạn độ dài request: ứng dụng báo giới hạn trước khi gửi và giữ nguyên text đã nhập.
- 2a. Tài liệu sai định dạng hoặc không đọc được: ứng dụng báo tên tài liệu bị lỗi và không gửi tài liệu đó. Người dùng có thể bỏ tài liệu hoặc chọn tài liệu khác.
- 2b. Tài liệu vượt giới hạn dung lượng tài liệu hoặc số tài liệu đính kèm: ứng dụng báo giới hạn trước khi gửi.
- 2c. Tài liệu rỗng: ứng dụng cảnh báo và hỏi người dùng có gửi tiếp hay không.
- 3a. Người dùng nhấn gửi nhiều lần: ứng dụng chỉ tạo một request.
- 3b. Chat đang có request chạy: ứng dụng không chạy song song request thứ hai trong cùng chat. Ứng dụng báo request đang chạy, hoặc xếp request mới vào hàng chờ và hiện trạng thái chờ.
- 5a. Provider không trả lời: sau một khoảng thời gian chờ, ứng dụng báo provider không phản hồi và cho thử lại.
- 5b. Provider trả lỗi key sai, hết hạn hoặc hết hạn mức: ứng dụng báo lỗi bằng lời dễ hiểu và chỉ đến phần cài đặt provider. Request dừng.
- 5c. Provider giới hạn tần suất: ứng dụng báo phải chờ, rồi thử lại hoặc cho người dùng thử lại.
- 5d. Tài liệu và request vượt giới hạn context của model: ứng dụng báo và đề nghị rút gọn tài liệu hoặc chọn model khác.
- 6a. Dịch vụ bên ngoài không trả lời hoặc trả lỗi: agent tiếp tục khi có thể (ví dụ slide không có ảnh) và báo phần bị thiếu. Nếu người dùng chưa thiết lập dịch vụ, agent bỏ qua bước đó và báo cho người dùng.
- 7a. Request chạy lâu: ứng dụng vẫn hiện tiến độ để người dùng biết request chưa bị treo.
- 7b. Người dùng rời chat hoặc chuyển chat khác rồi quay lại: request vẫn chạy và người dùng thấy tiến độ hiện tại.
- 7c. Hai giao diện mở cùng chat: cả hai thấy cùng request, cùng tiến độ và cùng kết quả.
- 7d. Ứng dụng dừng trong lúc request chạy: sau khi khởi động lại, người dùng thấy request ở trạng thái bị gián đoạn, cùng phần kết quả đã có. Người dùng có thể chạy lại. Ứng dụng không hiện request là "đang chạy" khi request không còn chạy.
- 8a. Agent tạo deck không đầy đủ: ứng dụng hiện các slide đã có và báo phần lỗi.
- 9a. Kết nối provider mất giữa chừng: ứng dụng giữ phần kết quả đã có và báo lỗi.

## BL-CHAT-3: Sửa deck bằng request tiếp theo

**Trigger:** Người dùng gửi request sửa deck đã có trong chat (ví dụ "rút gọn slide 3", "đổi giọng văn").
**Precondition:** Chat đã có một deck.
**Kết quả khi thành công:** Ứng dụng hiện phiên bản deck mới. Người dùng vẫn xem được phiên bản trước.
**Kết quả khi thất bại:** Deck trước không thay đổi. Người dùng thấy lý do lỗi.

**Luồng chính:**
1. Người dùng nhập request sửa. Người dùng chọn slide cần sửa (không bắt buộc).
2. Người dùng gửi request.
3. Agent dùng lịch sử chat và deck hiện tại để sửa.
4. Ứng dụng hiện deck đã sửa và chỉ ra phần thay đổi.

**Luồng ngoại lệ:**
- 1a. Request sửa nói đến slide không tồn tại: agent hỏi lại người dùng hoặc báo slide không tồn tại.
- 1b. Request mơ hồ: agent hỏi lại trước khi sửa.
- 2a. Gửi lặp lại cùng request: ứng dụng chỉ chạy một lần.
- 3a. Lịch sử chat vượt giới hạn context của model: ứng dụng báo agent chỉ dùng một phần lịch sử, hoặc đề nghị bắt đầu chat mới từ deck hiện tại.
- 3b. Provider lỗi hoặc không trả lời: deck cũ giữ nguyên. Ứng dụng cho thử lại.
- 3c. Người dùng đã sửa deck bằng tay ở nơi khác trước đó: agent sửa trên deck mới nhất, không ghi đè thay đổi bằng tay.
- 4a. Hai giao diện cùng gửi request sửa: ứng dụng chạy lần lượt từng request và hiện kết quả giống nhau ở cả hai giao diện.
- 4b. Ứng dụng dừng giữa lần sửa: sau khi khởi động lại, deck trước vẫn còn nguyên.

## BL-CHAT-4: Dừng request đang chạy

**Trigger:** Người dùng chọn "Dừng" khi agent đang làm việc.
**Precondition:** Chat có request đang chạy.
**Kết quả khi thành công:** Agent dừng. Ứng dụng hiện request ở trạng thái đã dừng, cùng phần kết quả đã có.
**Kết quả khi thất bại:** Ứng dụng báo không dừng được. Request tiếp tục chạy hoặc kết thúc như bình thường.

**Luồng chính:**
1. Người dùng chọn "Dừng".
2. Ứng dụng yêu cầu agent dừng.
3. Ứng dụng hiện trạng thái "đã dừng" và giữ phần kết quả đã có.

**Luồng ngoại lệ:**
- 1a. Request vừa hoàn thành trước khi người dùng nhấn: ứng dụng hiện kết quả hoàn thành, không báo lỗi.
- 1b. Người dùng nhấn "Dừng" nhiều lần: ứng dụng xử lý như một lần.
- 2a. Provider hoặc dịch vụ bên ngoài không phản hồi lệnh dừng: ứng dụng vẫn dừng phía người dùng và bỏ kết quả đến sau. Ứng dụng có thể báo rằng provider vẫn có thể tính phí phần đã chạy.
- 3a. Hai giao diện mở cùng chat: cả hai thấy trạng thái "đã dừng".
- 3b. Ứng dụng dừng ngay sau lệnh dừng: sau khi khởi động lại, request ở trạng thái đã dừng hoặc bị gián đoạn, không ở trạng thái đang chạy.

## BL-CHAT-5: Chạy lại một request bị lỗi hoặc bị dừng

**Trigger:** Người dùng chọn "Thử lại" trên request bị lỗi, bị dừng hoặc bị gián đoạn.
**Precondition:** Chat có request ở trạng thái lỗi, đã dừng hoặc bị gián đoạn.
**Kết quả khi thành công:** Request chạy lại và có kết quả mới trong chat.
**Kết quả khi thất bại:** Ứng dụng báo lỗi mới. Kết quả cũ (nếu có) giữ nguyên.

**Luồng chính:**
1. Người dùng chọn "Thử lại".
2. Người dùng đổi model hoặc provider (không bắt buộc).
3. Ứng dụng chạy lại request với cùng nội dung và tài liệu.
4. Ứng dụng hiện kết quả như BL-CHAT-2.

**Luồng ngoại lệ:**
- 1a. Nhấn "Thử lại" nhiều lần: ứng dụng chỉ chạy một lần.
- 1b. Request đã được chạy lại thành công trước đó (ví dụ ở giao diện khác): ứng dụng hiện kết quả đó và không chạy thêm.
- 3a. Tài liệu đính kèm ban đầu không còn: ứng dụng báo và yêu cầu đính kèm lại.
- 3b. Lỗi cũ vẫn còn (ví dụ key vẫn sai): ứng dụng báo cùng lỗi và chỉ cách sửa.
- 3c. Ứng dụng dừng giữa lần chạy lại: xử lý như 7d của BL-CHAT-2.

## BL-CHAT-6: Đổi provider hoặc model cho chat

**Trigger:** Người dùng mở phần chọn model trong chat.
**Precondition:** Chat đang mở. Người dùng đã kết nối ít nhất một provider.
**Kết quả khi thành công:** Các request tiếp theo trong chat dùng model mới. Chat hiện model đang dùng.
**Kết quả khi thất bại:** Chat giữ model cũ. Người dùng thấy lý do.

**Luồng chính:**
1. Người dùng mở danh sách model.
2. Ứng dụng hiện các model của các provider đã kết nối.
3. Người dùng chọn một model.
4. Ứng dụng lưu lựa chọn cho chat.

**Luồng ngoại lệ:**
- 2a. Provider không trả danh sách model hoặc trả lỗi: ứng dụng báo lỗi và hiện danh sách đã biết trước đó (nếu có).
- 2b. Danh sách rỗng: ứng dụng đưa người dùng đến phần kết nối provider.
- 3a. Đổi model khi request đang chạy: request hiện tại chạy tiếp với model cũ. Model mới áp dụng cho request sau. Ứng dụng nói rõ điều này.
- 3b. Model mới có giới hạn context nhỏ hơn lịch sử chat: ứng dụng cảnh báo.
- 3c. Người dùng chọn lại model đang dùng: không có thay đổi.
- 4a. Hai giao diện đổi model khác nhau: lựa chọn sau cùng được áp dụng và cả hai giao diện hiện cùng model.
- 4b. Ứng dụng khởi động lại: chat vẫn dùng model đã chọn.

## BL-CHAT-7: Mở lại và tiếp tục một chat cũ

**Trigger:** Người dùng chọn một chat trong danh sách chat của workspace.
**Precondition:** Workspace có ít nhất một chat.
**Kết quả khi thành công:** Người dùng thấy toàn bộ lịch sử request, câu trả lời và deck mới nhất. Người dùng có thể gửi request tiếp.
**Kết quả khi thất bại:** Ứng dụng báo không mở được chat. Các chat khác không bị ảnh hưởng.

**Luồng chính:**
1. Người dùng mở danh sách chat.
2. Người dùng chọn một chat.
3. Ứng dụng hiện lịch sử và deck mới nhất.
4. Người dùng tiếp tục bằng BL-CHAT-2 hoặc BL-CHAT-3.

**Luồng ngoại lệ:**
- 1a. Danh sách chat rỗng: ứng dụng đề nghị tạo chat mới.
- 2a. Chat đã bị xóa ở giao diện khác: ứng dụng báo chat không còn và cập nhật danh sách.
- 3a. Lịch sử dài: ứng dụng vẫn mở được chat và hiện phần mới nhất trước.
- 3b. Chat có request bị gián đoạn do ứng dụng dừng trước đó: ứng dụng hiện trạng thái gián đoạn và nút "Thử lại".
- 3c. Model đã chọn của chat không còn khả dụng: ứng dụng báo và yêu cầu chọn model khác trước khi gửi.
- 3d. Dữ liệu chat bị hỏng: ứng dụng báo chat không mở được, không làm hỏng các chat khác.

## BL-CHAT-8: Đổi tên chat

**Trigger:** Người dùng chọn "Đổi tên" trên một chat.
**Precondition:** Chat tồn tại.
**Kết quả khi thành công:** Chat có tên mới ở mọi giao diện.
**Kết quả khi thất bại:** Chat giữ tên cũ. Người dùng thấy lý do.

**Luồng chính:**
1. Người dùng chọn "Đổi tên".
2. Người dùng nhập tên mới.
3. Người dùng xác nhận.
4. Ứng dụng hiện tên mới.

**Luồng ngoại lệ:**
- 2a. Tên rỗng: ứng dụng không chấp nhận, hoặc giữ tên cũ.
- 2b. Tên vượt giới hạn độ dài tên: ứng dụng báo giới hạn.
- 2c. Tên trùng chat khác: ứng dụng chấp nhận nhưng người dùng vẫn phân biệt được các chat (nếu project không quy định khác).
- 3a. Người dùng hủy: tên cũ giữ nguyên.
- 4a. Hai giao diện đổi tên cùng lúc: tên sau cùng được áp dụng ở cả hai.

## BL-CHAT-9: Xóa chat

**Trigger:** Người dùng chọn "Xóa" trên một chat.
**Precondition:** Chat tồn tại.
**Kết quả khi thành công:** Chat không còn trong danh sách ở mọi giao diện.
**Kết quả khi thất bại:** Chat vẫn còn và không thay đổi. Người dùng thấy lý do.

**Luồng chính:**
1. Người dùng chọn "Xóa".
2. Ứng dụng hỏi xác nhận và nói rõ deck của chat có bị xóa theo hay không.
3. Người dùng xác nhận.
4. Ứng dụng xóa chat và cập nhật danh sách.

**Luồng ngoại lệ:**
- 2a. Chat có request đang chạy: ứng dụng cảnh báo rằng request sẽ dừng.
- 3a. Người dùng hủy: chat giữ nguyên.
- 3b. Người dùng xác nhận nhiều lần: ứng dụng chỉ xóa một lần, không báo lỗi.
- 4a. Chat đã bị xóa ở giao diện khác: ứng dụng không báo lỗi và cập nhật danh sách.
- 4b. Giao diện khác đang mở chat: giao diện đó báo chat đã bị xóa.
- 4c. Ứng dụng dừng giữa lúc xóa: sau khi khởi động lại, chat còn nguyên hoặc đã xóa hết, không ở trạng thái nửa chừng.

## Ghi chú của subagent

Các hành vi subagent suy luận, prompt không nói:
- Một chat có chạy song song nhiều request không (3b của BL-CHAT-2). Subagent giả định không.
- Sửa deck tạo phiên bản mới và giữ phiên bản cũ (BL-CHAT-3). Đây là giả định.
- Xóa chat có xóa deck hay không (BL-CHAT-9).
- Có giới hạn số chat trong workspace hay không (2a của BL-CHAT-1).
- Xuất deck ra file và quản lý tài liệu nguồn không nằm trong vùng Chat. Subagent không viết các use case này.
