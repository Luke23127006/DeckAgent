# Baseline: Deck

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Deck".

Subagent chọn 5 mục tiêu. Mỗi mục tiêu là việc người dùng làm xong trong một lần dùng: tạo deck mới, sửa deck đã có, dừng một request đang chạy, xem và trình chiếu deck, xuất deck. Bước duyệt outline nằm trong BL-D1, vì người dùng không có mục tiêu "chỉ làm outline". Đây là suy luận của subagent.

## BL-D1: Tạo deck từ tài liệu

- **Trigger:** Người dùng gửi một request tạo deck trong một chat và đính kèm hoặc chọn tài liệu.
- **Precondition:** Người dùng đã mở một workspace. Người dùng đã kết nối ít nhất một provider và chọn một model.
- **Kết quả khi thành công:** Chat có một deck mới. Deck có các slide theo outline mà người dùng đã duyệt. Người dùng xem được deck.
- **Kết quả khi thất bại:** Ứng dụng không tạo deck hỏng hoặc thiếu slide mà không báo. Người dùng thấy lý do và một hành động để làm tiếp (thử lại, đổi model, sửa input). Request và tài liệu vẫn còn trong chat.

**Luồng chính**
1. Người dùng nhập yêu cầu (chủ đề, đối tượng, số slide mong muốn, giọng văn) và thêm tài liệu.
2. Ứng dụng nhận tài liệu và cho thấy danh sách tài liệu đã nhận.
3. Người dùng gửi request.
4. Agent đọc tài liệu. Nếu người dùng đã thiết lập dịch vụ tìm kiếm, agent có thể tìm thêm thông tin. Ứng dụng cho thấy tiến độ.
5. Agent đề xuất một outline: danh sách slide, mỗi slide có tiêu đề và ý chính.
6. Người dùng sửa outline (thêm, xóa, đổi thứ tự, sửa ý) hoặc yêu cầu agent làm lại, rồi duyệt outline.
7. Agent tạo từng slide theo outline. Nếu người dùng đã thiết lập dịch vụ ảnh, agent có thể lấy ảnh. Ứng dụng cho thấy slide nào đã xong.
8. Ứng dụng báo deck đã xong và mở deck.

**Luồng ngoại lệ**
- **Bước 1:**
  - Yêu cầu rỗng và không có tài liệu: ứng dụng không cho gửi và nói người dùng cần nhập gì.
  - Yêu cầu quá dài: có giới hạn về độ dài yêu cầu. Ứng dụng báo trước khi gửi, không cắt ngầm.
  - Số slide mong muốn bằng 0, âm, hoặc vượt giới hạn: có giới hạn về số slide trong một deck. Ứng dụng báo và đề xuất giá trị hợp lệ.
- **Bước 2:**
  - Tài liệu sai định dạng hoặc ứng dụng không hỗ trợ định dạng đó: ứng dụng báo tên file và các định dạng được hỗ trợ. Các tài liệu khác vẫn được nhận.
  - Tài liệu rỗng, hỏng, có mật khẩu, hoặc chỉ có ảnh mà ứng dụng không đọc được chữ: ứng dụng báo riêng cho từng file.
  - Tài liệu quá lớn, hoặc quá nhiều tài liệu: có giới hạn về dung lượng mỗi file, số file và tổng lượng nội dung mà model nhận được. Ứng dụng báo giới hạn nào bị vượt.
  - Người dùng thêm cùng một file hai lần: ứng dụng báo trùng và giữ một bản.
- **Bước 3:**
  - Người dùng bấm gửi nhiều lần: ứng dụng chỉ tạo một request.
  - Chat đã có một request đang chạy: ứng dụng báo và cho người dùng chọn đợi hoặc dừng request cũ (BL-D3).
  - Provider chưa kết nối, key sai, key hết hạn hoặc bị thu hồi: ứng dụng báo trước khi chạy và dẫn người dùng tới chỗ kết nối provider.
- **Bước 4:**
  - Provider không trả lời, trả lỗi, hết hạn mức, hoặc giới hạn tốc độ: ứng dụng báo lỗi bằng lời dễ hiểu và cho thử lại hoặc đổi model. Phần agent đã đọc không mất.
  - Dịch vụ tìm kiếm không trả lời hoặc trả lỗi: agent làm tiếp chỉ với tài liệu. Ứng dụng báo rằng agent không dùng được nguồn ngoài.
  - Luồng chạy lâu: ứng dụng vẫn cho thấy tiến độ. Có giới hạn về thời gian chờ provider. Khi quá thời gian đó, ứng dụng báo và cho thử lại.
  - Người dùng rời chat rồi quay lại: request vẫn chạy và chat cho thấy trạng thái hiện tại.
  - Ứng dụng dừng rồi khởi động lại: chat cho thấy request đã bị ngắt. Người dùng chọn chạy lại. Ứng dụng không tự chạy lại và không tự tính thêm chi phí cho người dùng.
- **Bước 5:**
  - Agent trả outline rỗng, hoặc số slide khác với yêu cầu: ứng dụng cho thấy outline đó và cho người dùng yêu cầu làm lại.
  - Nội dung tài liệu không đủ cho chủ đề: agent nói rõ phần nào thiếu nguồn.
- **Bước 6:**
  - Người dùng xóa hết slide trong outline: ứng dụng không cho duyệt outline rỗng.
  - Người dùng yêu cầu làm lại nhiều lần: mỗi lần làm lại thay outline cũ. Người dùng thấy rằng các phần đã sửa tay sẽ mất.
  - Hai giao diện mở cùng chat và cùng sửa outline: người dùng không mất thay đổi mà không biết. Giao diện kia cho thấy bản mới hoặc báo xung đột.
  - Người dùng duyệt outline hai lần, hoặc duyệt từ hai giao diện: ứng dụng chỉ bắt đầu tạo slide một lần.
  - Người dùng rời luồng lâu rồi quay lại: outline đang sửa vẫn còn.
- **Bước 7:**
  - Provider lỗi khi đang tạo slide: các slide đã xong vẫn còn. Ứng dụng cho tạo tiếp từ slide bị lỗi, không bắt tạo lại từ đầu.
  - Dịch vụ ảnh lỗi hoặc không có ảnh phù hợp: slide vẫn được tạo, không có ảnh, và ứng dụng đánh dấu slide đó.
  - Nội dung một slide quá dài so với bố cục: có giới hạn về lượng chữ trên một slide. Agent chia nội dung hoặc rút gọn, và ứng dụng cho người dùng thấy việc đó.
  - Ứng dụng dừng giữa chừng: sau khi khởi động lại, người dùng thấy deck dở dang với các slide đã xong và chọn tạo tiếp.
- **Bước 8:**
  - Hai giao diện cùng mở chat: cả hai giao diện cho thấy cùng một deck đã xong.

## BL-D2: Sửa deck bằng chat

- **Trigger:** Người dùng gửi một yêu cầu sửa trong chat đã có deck. Ví dụ: "rút gọn slide 3", "thêm một slide tổng kết", "đổi giọng văn trang trọng hơn".
- **Precondition:** Chat có một deck đã tạo. Provider và model dùng được.
- **Kết quả khi thành công:** Deck có các thay đổi người dùng yêu cầu. Các slide không liên quan giữ nguyên. Người dùng thấy slide nào đã đổi và quay lại được bản trước.
- **Kết quả khi thất bại:** Deck giữ nguyên bản trước khi sửa. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn phạm vi sửa (cả deck hoặc một số slide) và nhập yêu cầu.
2. Người dùng gửi request.
3. Agent sửa các slide trong phạm vi đó. Ứng dụng cho thấy tiến độ.
4. Ứng dụng cho thấy các slide đã đổi.
5. Người dùng giữ thay đổi, hoặc quay lại bản trước.

**Luồng ngoại lệ**
- **Bước 1:**
  - Yêu cầu rỗng: ứng dụng không cho gửi.
  - Yêu cầu nói tới slide không có (ví dụ "slide 20" trong khi deck có 10 slide): agent hoặc ứng dụng hỏi lại, không đoán.
  - Thêm slide vượt giới hạn: có giới hạn về số slide trong một deck. Ứng dụng báo.
  - Yêu cầu quá dài: có giới hạn về độ dài yêu cầu. Ứng dụng báo.
- **Bước 2:**
  - Người dùng gửi cùng yêu cầu nhiều lần: ứng dụng chỉ chạy một lần.
  - Chat đang có request khác chạy: ứng dụng cho đợi hoặc dừng request cũ.
  - Hai giao diện cùng gửi yêu cầu sửa: ứng dụng chạy lần lượt hoặc từ chối yêu cầu thứ hai và báo lý do. Không có thay đổi nào mất mà người dùng không biết.
- **Bước 3:**
  - Provider hoặc dịch vụ ảnh lỗi hoặc không trả lời: deck giữ bản cũ, hoặc người dùng thấy rõ slide nào đã sửa xong.
  - Ứng dụng dừng giữa chừng: sau khi khởi động lại, deck ở trạng thái nhất quán (bản cũ, hoặc bản cũ cộng các slide đã sửa xong có đánh dấu). Người dùng chọn chạy lại.
  - Người dùng rời chat rồi quay lại: người dùng thấy trạng thái hiện tại của request.
- **Bước 4:**
  - Agent không đổi gì, hoặc đổi cả slide ngoài phạm vi: ứng dụng cho người dùng thấy và cho quay lại bản trước.
- **Bước 5:**
  - Người dùng quay lại bản trước hai lần: lần thứ hai không làm mất bản nào khác.
  - Có giới hạn về số bản trước mà ứng dụng giữ. Ứng dụng báo khi bản cũ nhất sẽ mất.
  - Người dùng đã sửa tay slide trong lúc agent đang sửa: ứng dụng báo xung đột, không ghi đè ngầm.

## BL-D3: Dừng request đang chạy

- **Trigger:** Người dùng bấm dừng khi agent đang tạo hoặc sửa deck.
- **Precondition:** Chat có một request đang chạy.
- **Kết quả khi thành công:** Agent dừng. Ứng dụng không gửi thêm yêu cầu tới provider cho request đó. Các slide đã xong vẫn còn. Người dùng thấy request đã dừng.
- **Kết quả khi thất bại:** Người dùng thấy request vẫn chạy và được bấm dừng lại.

**Luồng chính**
1. Người dùng bấm dừng.
2. Ứng dụng cho thấy request đang dừng.
3. Ứng dụng báo request đã dừng và cho thấy phần đã xong.
4. Người dùng chọn làm tiếp từ chỗ đã dừng, hoặc để nguyên.

**Luồng ngoại lệ**
- **Bước 1:**
  - Request đã xong ngay trước khi người dùng bấm dừng: ứng dụng báo request đã xong. Deck không bị xóa.
  - Người dùng bấm dừng nhiều lần, hoặc bấm từ hai giao diện: kết quả giống như bấm một lần.
- **Bước 2:**
  - Provider không trả lời trong lúc dừng: ứng dụng vẫn cho thấy request đã dừng ở phía người dùng sau một thời gian chờ có giới hạn.
  - Ứng dụng dừng trong lúc đang dừng request: sau khi khởi động lại, request ở trạng thái đã dừng.
- **Bước 4:**
  - Người dùng làm tiếp sau một thời gian dài, và trong lúc đó key provider đã hết hạn: ứng dụng báo lỗi kết nối provider như BL-D1, bước 3.

## BL-D4: Xem và trình chiếu deck

- **Trigger:** Người dùng mở một deck trong chat hoặc trong workspace.
- **Precondition:** Deck có ít nhất một slide.
- **Kết quả khi thành công:** Người dùng xem từng slide và trình chiếu toàn màn hình theo thứ tự.
- **Kết quả khi thất bại:** Ứng dụng báo deck hoặc slide nào không hiển thị được. Các slide khác vẫn xem được.

**Luồng chính**
1. Người dùng mở deck.
2. Ứng dụng cho thấy danh sách slide và slide đang chọn.
3. Người dùng chuyển giữa các slide.
4. Người dùng bắt đầu trình chiếu.
5. Người dùng chuyển slide khi trình chiếu rồi thoát.

**Luồng ngoại lệ**
- **Bước 1:**
  - Deck đang được tạo hoặc sửa: ứng dụng cho thấy các slide đã xong và đánh dấu deck chưa xong.
  - Ứng dụng vừa khởi động lại: deck mở lại giống trước khi ứng dụng dừng.
- **Bước 2:**
  - Một slide có ảnh không tải được: slide vẫn hiển thị và có chỗ trống được đánh dấu.
  - Hai giao diện mở cùng deck, và một giao diện sửa deck: giao diện kia cho thấy bản mới hoặc báo rằng có bản mới.
- **Bước 3:**
  - Người dùng ở slide đầu hoặc slide cuối rồi chuyển tiếp: ứng dụng không lỗi và giữ nguyên slide.
- **Bước 5:**
  - Deck bị sửa trong lúc đang trình chiếu: ứng dụng không làm gián đoạn buổi trình chiếu mà không báo.

## BL-D5: Xuất deck

- **Trigger:** Người dùng chọn xuất deck.
- **Precondition:** Deck có ít nhất một slide và không có request nào đang sửa deck.
- **Kết quả khi thành công:** Người dùng có một file deck ở chỗ đã chọn. Nội dung file giống deck mà người dùng thấy.
- **Kết quả khi thất bại:** Ứng dụng không để lại file hỏng mà không báo. Người dùng thấy lý do.

**Luồng chính**
1. Người dùng chọn định dạng xuất.
2. Người dùng chọn tên file và chỗ lưu.
3. Ứng dụng xuất deck và cho thấy tiến độ.
4. Ứng dụng báo đã xuất xong và cho mở file hoặc thư mục.

**Luồng ngoại lệ**
- **Bước 1:**
  - Định dạng không giữ được một số thành phần của deck: ứng dụng báo trước thành phần nào sẽ mất hoặc bị đổi.
  - Deck đang được tạo hoặc sửa: ứng dụng cho đợi, hoặc cho xuất bản đã xong gần nhất và nói rõ đó là bản nào.
- **Bước 2:**
  - Tên file rỗng, có ký tự không hợp lệ, hoặc quá dài: có giới hạn về độ dài tên file. Ứng dụng báo.
  - File cùng tên đã có: ứng dụng hỏi người dùng có ghi đè không.
  - Chỗ lưu không ghi được hoặc không đủ dung lượng: ứng dụng báo và cho chọn chỗ khác.
- **Bước 3:**
  - Người dùng bấm xuất nhiều lần: ứng dụng chỉ xuất một lần, hoặc báo rằng việc xuất đang chạy.
  - Deck lớn và xuất lâu: ứng dụng vẫn cho thấy tiến độ.
  - Ảnh trong deck không còn lấy được từ dịch vụ ảnh: ứng dụng báo slide nào thiếu ảnh và cho xuất tiếp hoặc hủy.
  - Ứng dụng dừng giữa chừng: sau khi khởi động lại, không có file dở dang nào trông như file đã xong.
- **Bước 4:**
  - Người dùng rời màn hình rồi quay lại: người dùng vẫn thấy kết quả xuất.

## Các điểm subagent để ngỏ

- Có cần use case riêng để sửa slide bằng tay (không qua agent) không? Subagent chỉ nói tới việc đó như một nguồn xung đột trong BL-D2.
- Ứng dụng xuất được định dạng nào? Prompt không nói, nên subagent để chung là "định dạng xuất".
- Khi ứng dụng khởi động lại, subagent chọn "không tự chạy lại, người dùng chọn", vì chạy lại tốn tiền trên key của người dùng. Đây là suy luận, chưa phải quyết định đã chốt.
- Khi hai giao diện gửi request cùng lúc, subagent để mở hai cách: ứng dụng chạy lần lượt, hoặc từ chối request thứ hai.
