# Baseline: Design system

Đọc file này để biết các use case mà một subagent viết độc lập, không đọc spec, cho vùng "Design system".

## BL-DS-01: Tạo design system từ tài liệu mẫu

Mục tiêu: người dùng có một bộ quy tắc trình bày (màu, font, bố cục slide, logo) lấy từ tài liệu mẫu của họ, ví dụ deck cũ, brand guideline hoặc ảnh chụp slide.

- Trigger: người dùng chọn "Tạo design system từ tài liệu mẫu" trong workspace.
- Precondition: người dùng đã mở một workspace. Workspace có ít nhất một provider đã kết nối và còn dùng được.
- Thành công: workspace có một design system mới. Design system có tên, bảng màu, font, các layout slide mẫu và ảnh preview. Người dùng thấy design system này trong danh sách và chọn được nó cho deck.
- Thất bại: workspace không có design system mới hoặc design system dở dang. Người dùng thấy lý do và biết cách làm tiếp (thử lại, đổi file, đổi provider).

Luồng chính:
1. Người dùng chọn một hoặc nhiều file mẫu.
2. Ứng dụng kiểm tra file và hiện danh sách file đã nhận.
3. Người dùng nhập tên cho design system và gửi request.
4. Agent đọc file mẫu bằng model của provider. Ứng dụng hiện tiến độ.
5. Ứng dụng hiện bản nháp: bảng màu, font, layout mẫu và một slide preview cho mỗi layout.
6. Người dùng xem bản nháp và chọn "Lưu".
7. Ứng dụng lưu design system và thêm nó vào danh sách của workspace.

Luồng ngoại lệ:
- Bước 1:
  - 1a. Người dùng không chọn file nào: ứng dụng không cho gửi request và nhắc chọn file.
  - 1b. File sai định dạng (không phải loại ứng dụng đọc được): ứng dụng từ chối file đó, nêu tên file và các định dạng được nhận. Các file hợp lệ khác vẫn giữ.
  - 1c. File quá lớn hoặc số file vượt giới hạn: ứng dụng nêu giới hạn về dung lượng mỗi file và số file mỗi lần tạo, và từ chối phần vượt.
  - 1d. File rỗng, hỏng hoặc có mật khẩu: ứng dụng báo không đọc được file đó.
  - 1e. Người dùng chọn lại cùng một file: ứng dụng không thêm bản trùng.
- Bước 3:
  - 3a. Tên rỗng: ứng dụng đề xuất một tên mặc định hoặc yêu cầu nhập tên.
  - 3b. Tên quá dài: ứng dụng báo tên có giới hạn về số ký tự.
  - 3c. Tên trùng với design system đã có trong workspace: ứng dụng báo trùng và đề nghị tên khác.
  - 3d. Người dùng bấm gửi nhiều lần: ứng dụng chỉ chạy một request và hiện request đang chạy.
- Bước 4:
  - 4a. Provider không trả lời hoặc trả lỗi (key hết hạn, hết hạn mức, model không có): ứng dụng dừng request, nêu lỗi của provider bằng lời dễ hiểu và cho người dùng thử lại hoặc chọn provider khác. File đã chọn vẫn giữ.
  - 4b. Request chạy lâu: ứng dụng vẫn hiện tiến độ và cho người dùng hủy. Khi quá giới hạn thời gian chờ, ứng dụng dừng và báo hết thời gian.
  - 4c. Tài liệu mẫu quá dài so với giới hạn nội dung mà model nhận: ứng dụng báo chỉ dùng được một phần, hoặc đề nghị bớt file.
  - 4d. Tài liệu không có đủ thông tin trình bày (ví dụ chỉ có chữ): agent tạo bản nháp với giá trị mặc định và ứng dụng đánh dấu các phần được đoán.
  - 4e. Người dùng rời màn hình rồi quay lại: request vẫn chạy, ứng dụng hiện lại tiến độ hoặc kết quả.
  - 4f. Ứng dụng dừng rồi khởi động lại trong lúc chạy: ứng dụng báo request bị gián đoạn và cho chạy lại với cùng file và tên.
- Bước 5:
  - 5a. Font trong mẫu không có trên máy: ứng dụng báo font thiếu và hiện font thay thế trong preview.
  - 5b. Người dùng không hài lòng: người dùng sửa bằng lời trong chat hoặc sửa trực tiếp (xem BL-DS-03) trước khi lưu.
- Bước 6:
  - 6a. Người dùng bấm "Lưu" nhiều lần: ứng dụng chỉ tạo một design system.
  - 6b. Người dùng đóng bản nháp không lưu: ứng dụng hỏi xác nhận bỏ bản nháp.
  - 6c. Ứng dụng dừng trước khi lưu: khi mở lại, ứng dụng cho khôi phục bản nháp hoặc bỏ nó.
- Bước 7:
  - 7a. Trong lúc chờ, một giao diện khác đã tạo design system cùng tên: ứng dụng báo trùng tên và yêu cầu đổi tên trước khi lưu.
  - 7b. Lưu thất bại (ví dụ ổ đĩa đầy): ứng dụng báo lỗi và giữ bản nháp.

## BL-DS-02: Tạo design system từ mô tả bằng lời

Mục tiêu: người dùng không có tài liệu mẫu nhưng muốn có một phong cách riêng, ví dụ "tối giản, màu xanh lá, cho bài giảng sinh học".

- Trigger: người dùng chọn "Tạo design system từ mô tả".
- Precondition: như BL-DS-01.
- Thành công: như BL-DS-01.
- Thất bại: như BL-DS-01. Mô tả đã nhập vẫn giữ để thử lại.

Luồng chính:
1. Người dùng nhập mô tả phong cách, và có thể đính kèm logo hoặc ảnh tham khảo.
2. Người dùng nhập tên và gửi request.
3. Agent tạo một hoặc nhiều phương án. Ứng dụng hiện tiến độ.
4. Ứng dụng hiện các phương án với preview.
5. Người dùng chọn một phương án, và có thể yêu cầu chỉnh thêm bằng lời.
6. Người dùng chọn "Lưu". Ứng dụng thêm design system vào danh sách.

Luồng ngoại lệ:
- Bước 1:
  - 1a. Mô tả rỗng: ứng dụng không cho gửi.
  - 1b. Mô tả quá dài: ứng dụng báo mô tả có giới hạn về độ dài.
  - 1c. Mô tả mâu thuẫn hoặc quá mơ hồ: agent hỏi lại trong chat trước khi tạo.
  - 1d. Ảnh đính kèm sai định dạng hoặc quá lớn: như BL-DS-01 bước 1b, 1c.
- Bước 2: tên rỗng, quá dài, trùng, bấm nhiều lần: như BL-DS-01 bước 3a–3d.
- Bước 3:
  - 3a. Provider lỗi hoặc không trả lời, request chạy lâu, ứng dụng khởi động lại, người dùng rời rồi quay lại: như BL-DS-01 bước 4a, 4b, 4e, 4f.
  - 3b. Mô tả yêu cầu ảnh nền mà dịch vụ ảnh chưa được thiết lập: agent tạo phương án không có ảnh và ứng dụng báo cần thiết lập dịch vụ ảnh để có ảnh.
  - 3c. Dịch vụ ảnh không trả lời hoặc trả lỗi: ứng dụng hiện phương án không có ảnh, báo lỗi của dịch vụ và cho thử tạo lại ảnh.
- Bước 4:
  - 4a. Màu chữ và màu nền có độ tương phản thấp: ứng dụng cảnh báo phần chữ khó đọc.
- Bước 5:
  - 5a. Người dùng yêu cầu chỉnh nhiều lần: mỗi lần ứng dụng hiện phương án mới và cho quay về phương án trước.
  - 5b. Hai giao diện mở cùng một chat và cùng gửi yêu cầu chỉnh: ứng dụng xử lý từng yêu cầu theo thứ tự và hai giao diện hiện cùng một kết quả mới nhất.
- Bước 6: bấm lưu nhiều lần, rời không lưu, ứng dụng dừng trước khi lưu, lưu lỗi: như BL-DS-01 bước 6a–6c, 7a, 7b.

## BL-DS-03: Xem và chỉnh sửa design system

Mục tiêu: người dùng sửa một design system đã có, ví dụ đổi màu chính, đổi font, thêm hoặc bỏ một layout.

- Trigger: người dùng mở một design system trong danh sách và chọn "Sửa".
- Precondition: workspace có ít nhất một design system. Sửa bằng lời cần một provider dùng được; sửa trực tiếp thì không cần.
- Thành công: design system có giá trị mới. Ứng dụng nói rõ deck nào đang dùng design system này và cho người dùng chọn áp dụng thay đổi cho các deck đó hay không.
- Thất bại: design system giữ giá trị cũ. Người dùng thấy lý do.

Luồng chính:
1. Ứng dụng hiện chi tiết: bảng màu, font, logo, layout và preview.
2. Người dùng sửa trực tiếp một giá trị, hoặc mô tả thay đổi bằng lời cho agent.
3. Ứng dụng cập nhật preview ngay.
4. Người dùng chọn "Lưu".
5. Ứng dụng hiện danh sách deck đang dùng design system này và hỏi có áp dụng cho chúng không.
6. Người dùng chọn. Ứng dụng lưu và áp dụng theo lựa chọn.

Luồng ngoại lệ:
- Bước 2:
  - 2a. Mã màu sai định dạng: ứng dụng đánh dấu ô đó và không cập nhật preview.
  - 2b. Cỡ chữ ở giới hạn trên hoặc dưới: ứng dụng báo cỡ chữ có giới hạn về giá trị nhỏ nhất và lớn nhất.
  - 2c. Người dùng xóa layout cuối cùng: ứng dụng không cho xóa, vì design system cần ít nhất một layout.
  - 2d. Logo mới sai định dạng hoặc quá lớn: ứng dụng từ chối và nêu lý do.
  - 2e. Sửa bằng lời mà provider lỗi hoặc không trả lời: ứng dụng báo lỗi, giữ các sửa trực tiếp đã làm và cho thử lại.
- Bước 3:
  - 3a. Người dùng hoàn tác: ứng dụng quay về giá trị trước.
- Bước 4:
  - 4a. Một giao diện khác đã sửa và lưu cùng design system trong lúc này: ứng dụng báo có phiên bản mới hơn, hiện khác biệt và cho người dùng chọn giữ bản nào.
  - 4b. Design system đã bị xóa ở giao diện khác: ứng dụng báo không còn design system và cho lưu thành design system mới.
  - 4c. Người dùng rời màn hình khi chưa lưu: ứng dụng hỏi lưu hay bỏ thay đổi.
  - 4d. Ứng dụng dừng khi chưa lưu: khi mở lại, ứng dụng cho khôi phục thay đổi hoặc bỏ.
  - 4e. Không có thay đổi nào: ứng dụng không tạo bản lưu mới.
- Bước 6:
  - 6a. Một deck đang được agent tạo hoặc sửa: ứng dụng không đổi deck đó lúc này và báo sẽ áp dụng khi agent xong, hoặc để người dùng áp dụng sau.
  - 6b. Áp dụng làm nội dung tràn khỏi slide (ví dụ font lớn hơn): ứng dụng đánh dấu các slide bị tràn.
  - 6c. Áp dụng thất bại cho một số deck: ứng dụng nêu deck nào lỗi. Các deck khác vẫn được cập nhật.

## BL-DS-04: Áp dụng design system cho deck

Mục tiêu: người dùng có deck trình bày theo design system mình chọn, khi tạo deck mới hoặc đổi cho deck đã có.

- Trigger: người dùng chọn design system khi gửi request tạo deck, hoặc chọn "Đổi design system" trên một deck đã có.
- Precondition: workspace có ít nhất một design system. Với deck đã có: deck tồn tại và không có request nào đang chạy trên deck. Nếu cần agent sắp xếp lại nội dung thì cần provider dùng được.
- Thành công: mọi slide của deck dùng màu, font và layout của design system đã chọn. Nội dung của slide không đổi nghĩa.
- Thất bại: deck giữ design system cũ và không bị hỏng nửa chừng.

Luồng chính:
1. Người dùng mở danh sách design system và xem preview của từng cái.
2. Người dùng chọn một design system.
3. Ứng dụng hiện preview vài slide của deck với design system mới.
4. Người dùng xác nhận.
5. Agent gán layout mới cho từng slide và trình bày lại. Ứng dụng hiện tiến độ.
6. Ứng dụng hiện deck đã đổi và cho hoàn tác.

Luồng ngoại lệ:
- Bước 1:
  - 1a. Workspace chưa có design system: ứng dụng dùng design system mặc định của ứng dụng và gợi ý tạo mới (BL-DS-01, BL-DS-02).
- Bước 2:
  - 2a. Người dùng chọn đúng design system deck đang dùng: ứng dụng báo deck đã dùng design system này và không chạy lại.
  - 2b. Design system bị xóa ở giao diện khác trong lúc chọn: ứng dụng báo không còn và làm mới danh sách.
- Bước 4:
  - 4a. Người dùng bấm xác nhận nhiều lần: ứng dụng chỉ chạy một lần.
  - 4b. Deck đang có request khác chạy (ví dụ agent đang viết outline hoặc slide): ứng dụng không cho đổi và báo chờ request xong.
- Bước 5:
  - 5a. Provider lỗi hoặc không trả lời: ứng dụng dừng, giữ deck như trước và cho thử lại.
  - 5b. Một slide không có layout phù hợp trong design system mới: ứng dụng dùng layout gần nhất và đánh dấu slide đó để người dùng xem lại.
  - 5c. Nội dung tràn slide sau khi đổi: ứng dụng đánh dấu slide bị tràn.
  - 5d. Deck có nhiều slide nên chạy lâu: ứng dụng hiện tiến độ theo số slide và cho hủy. Khi hủy, deck quay về như trước.
  - 5e. Người dùng sửa slide ở giao diện khác trong lúc đổi: ứng dụng báo deck đang được đổi design system và chỉ cho xem.
  - 5f. Người dùng rời rồi quay lại: ứng dụng hiện tiến độ hoặc kết quả.
  - 5g. Ứng dụng dừng rồi khởi động lại: deck ở trạng thái trước khi đổi, ứng dụng báo việc đổi bị gián đoạn và cho chạy lại.
- Bước 6:
  - 6a. Người dùng hoàn tác: deck quay về design system cũ và trình bày cũ.
  - 6b. Font của design system không có trên máy: như BL-DS-01 bước 5a.

## BL-DS-05: Đặt design system mặc định cho workspace

Mục tiêu: deck mới trong workspace tự dùng một design system, người dùng không phải chọn mỗi lần.

- Trigger: người dùng chọn "Đặt làm mặc định" trên một design system.
- Precondition: workspace có design system đó.
- Thành công: ứng dụng đánh dấu design system này là mặc định. Request tạo deck mới chọn sẵn design system này. Deck đã có không đổi.
- Thất bại: mặc định cũ giữ nguyên.

Luồng chính:
1. Người dùng chọn một design system và chọn "Đặt làm mặc định".
2. Ứng dụng đánh dấu nó là mặc định và bỏ dấu mặc định của cái cũ.

Luồng ngoại lệ:
- Bước 1:
  - 1a. Design system đã là mặc định: ứng dụng không làm gì thêm và hiện là đã mặc định.
  - 1b. Hai giao diện cùng đặt hai design system khác nhau làm mặc định: lần đặt sau cùng có hiệu lực, cả hai giao diện hiện cùng kết quả.
  - 1c. Design system bị xóa ở giao diện khác: ứng dụng báo không còn.
- Bước 2:
  - 2a. Một request tạo deck đang chạy: request đó giữ design system đã chọn lúc gửi.
  - 2b. Ứng dụng khởi động lại: mặc định vẫn giữ.

## BL-DS-06: Xóa design system

Mục tiêu: người dùng bỏ một design system không còn dùng.

- Trigger: người dùng chọn "Xóa" trên một design system.
- Precondition: workspace có design system đó.
- Thành công: design system không còn trong danh sách. Deck đã dùng nó vẫn giữ trình bày hiện tại.
- Thất bại: design system vẫn còn.

Luồng chính:
1. Người dùng chọn "Xóa".
2. Ứng dụng hiện số deck đang dùng design system này và hỏi xác nhận.
3. Người dùng xác nhận. Ứng dụng xóa design system khỏi danh sách.

Luồng ngoại lệ:
- Bước 2:
  - 2a. Design system là mặc định: ứng dụng báo workspace sẽ dùng design system mặc định của ứng dụng sau khi xóa.
  - 2b. Một request đang dùng design system này: ứng dụng không cho xóa và báo chờ request xong.
  - 2c. Người dùng hủy: không có thay đổi.
- Bước 3:
  - 3a. Người dùng bấm xác nhận nhiều lần, hoặc design system đã bị xóa ở giao diện khác: ứng dụng không báo lỗi, chỉ hiện là design system không còn.
  - 3b. Người dùng muốn lấy lại: ứng dụng cho hoàn tác ngay sau khi xóa trong một khoảng thời gian có giới hạn.
  - 3c. Ứng dụng dừng trong lúc xóa: khi mở lại, design system hoặc còn đủ hoặc đã bị xóa hết, không ở trạng thái nửa chừng.

## Ghi chú của subagent

- Đã biết: subagent chỉ dùng thông tin trong prompt và không đọc repo.
- Suy luận: dịch vụ ngoài chỉ liên quan ở BL-DS-02 (dịch vụ ảnh). Dịch vụ tìm kiếm có thể không thuộc vùng này. Subagent giả định có "design system mặc định của ứng dụng", có hoàn tác, và có giới hạn về dung lượng file, số file, độ dài tên/mô tả, cỡ chữ, thời gian chờ, thời gian hoàn tác.
- Chưa chắc: design system thuộc workspace hay dùng chung cho mọi workspace; có xuất/nhập design system giữa các máy không (subagent không viết use case này); sửa design system có tự áp dụng cho deck đang dùng không (subagent để người dùng chọn).
