# Xử lý chỗ bị đánh dấu ở B6.4 (kiểm không đổi nghĩa)

| Loại | # | ID | Mức | Vấn đề | Xử lý |
|---|---|---|---|---|---|
| constraints | 1 | C-002 | thấp | Review Trigger bỏ "rõ rệt", mở rộng điều kiện xem lại | Sửa: trả lại "thay đổi rõ rệt" như sheet (chấp nhận cảnh báo Lint GX-08) |
| constraints | 2 | C-001 | thấp | Bỏ "(OR-045)" ở Ghi chú | Giải thích: OR-045 là rule của tab Operating Rules, tab không migrate (PLAN.md mục 3, Cột bị bỏ); câu vẫn giữ nghĩa; item Closed, chỉ sửa hình thức (GX-15) |
| constraints | 3 | C-001 … C-005 | thấp | Bỏ cột Impacts | Giải thích: cột Impacts bị bỏ theo bảng ánh xạ cột của Pha A (PLAN.md mục 3); template Constraint không có section tương ứng |
| actors | 1 | ACT-001 | thấp | Permissions 3 cho "hủy" ở UC-007, UC-023, nơi không có nhánh hủy | Sửa: tách "trả lời" (UC-001, UC-002, UC-004, UC-007, UC-023) và "hủy" (UC-001, UC-002, UC-004) |
| actors | 2 | ACT-002 | thấp | Bỏ chữ "Chỉ" ở Permissions 1 | Giải thích: hệ quả bắt buộc của BLK-021 (thêm "Hỏi lại người dùng (UC-002)"); giới hạn vẫn ở Permissions 3 (BLK-037) |
| actors | 3 | ACT-002 | thấp | Bỏ Ghi chú "Là nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về" | Giải thích: câu tóm tắt quan hệ với Use Case, do công cụ sinh từ `supporting_actors` (GACT-07, GX-12); vế "tải về" còn sai với UC-008, nơi tải về không gọi AI |
| actors | 4 | ACT-003 | thấp | Thiếu quyền xác nhận xóa ở UC-020 nhánh 2A | Sửa: thêm Permissions 6 "Xác nhận xóa tài khoản còn deck sau khi hệ thống báo các deck sẽ bị xóa theo (UC-020)" (BLK-021) |
| decisions | 1 | D-030 | cao | Dòng "Chọn" của `Phương án đã xét` dời thời điểm chấp nhận ra sau khi lượt sửa mới bắt đầu | Sửa: "Chấp nhận tại ranh giới commit: sau khi yêu cầu qua các bước hỏi lại, cảnh báo, xác nhận, ngay trước khi lượt sửa mới bắt đầu" (khớp câu Decision và BR-010) |
| decisions | 2 | D-006 | thấp | Decision thu hẹp "editor chuyên nghiệp" thành danh sách 3 sản phẩm | Sửa: "editor chỉnh slide chuyên nghiệp như `PowerPoint`, `Canva` hay `Figma`" |
| decisions | 3 | D-006 | thấp | Reopen When 2 thu hẹp tương tự | Sửa: "công cụ thiết kế chuyên nghiệp như `PowerPoint`, `Canva` hay `Figma`" |
| decisions | 4 | D-007 | thấp | "Không khóa luồng hợp lệ nào" mạnh hơn sheet | Sửa: "Tránh việc nhiều luồng hợp lệ bị khóa ngay từ đầu" |
| decisions | 5 | D-015 | thấp | Context 2 mở rộng "editor chuyên nghiệp" thành "editor chỉnh tay trên web" | Sửa: trả lại "editor chuyên nghiệp (C-002)" |
| decisions | 6 | D-017 | thấp | "để Later" chuyển sang hai năng lực khác | Sửa: "`P4` phụ thuộc nhiều vào sửa cục bộ và sửa deck có sẵn nên để Later" |
| decisions | 7 | D-017 | thấp | Reopen When 1 đổi "V1 dùng được" thành thuật ngữ "deck dùng được", P1c không liệt kê D-017 | Sửa: giữ cụm của sheet "cho thấy V1 không dùng được khi Hệ thống không đáp ứng `P4 Safe Refinement`"; quy trình buổi thử giữ theo BLK-017 |
| decisions | 8 | D-025 | thấp | Reopen When 3 biến điều kiện mở lại thành lỗi implementation | Sửa: "bỏ lần sửa gần nhất để quay về bản đã chấp nhận trước đó không đủ để người dùng giữ được deck dùng được" |
| decisions | 9 | D-031 | thấp | Lý do "Later vì V1 không có tài khoản" là suy luận | Sửa Rationale 3 và dòng 3 của `Phương án đã xét`: chỉ nêu điều Q1 nói (cần đăng nhập Google; đưa vào release thì phải mở lại D-027) |
| decisions | 10 | D-031 | thấp | `Hệ quả` 2 đổi chủ ngữ việc test thành Hệ thống | Sửa: "Hệ thống phải tạo 4 loại file tải về, và team phải test từng loại theo Acceptance riêng ở R-027" |
| assumptions | 1 | A-017 | cao | Câu Assumption đổi từ tính chất của xem trước sang hành vi của người dùng; tử số rộng hơn Signpost | Sửa: Assumption "Xem trước của Hệ thống đủ khớp với file tải về để người dùng … dựa vào xem trước mà quyết định deck đã dùng được trước khi tải về"; tử số đo đúng Signpost của sheet |
| assumptions | 2 | A-010 | thấp | "có thể bất tiện" thành khẳng định nhân quả | Sửa: câu Assumption chỉ giữ vế đầu; "Chỉ gõ yêu cầu cho AI có thể bất tiện …" chuyển sang Ghi chú 5 |
| assumptions | 3 | A-010 | thấp | Signpost "hiếm khi cần" thành "không cần" | Sửa: trả lại "hiếm khi cần" ở Signpost và tử số |
| assumptions | 4 | A-008 | thấp | "có thể phải mở lại" thành "Mở lại" | Sửa: "Xem xét mở lại mục tiêu và ranh giới V1" |
| assumptions | 5 | A-009 | thấp | Tín hiệu "gõ lại nhiều lần" không vào câu Assumption và tử số | Sửa: thêm "phải gõ lại cùng một yêu cầu nhiều lần" vào cả hai |
| assumptions | 6 | A-014 | thấp | Bỏ vế "ít loại file" | Sửa: Ghi chú 3 "Xem lại phạm vi khi V1 thực tế chỉ cần ít loại file, hoặc …" (theo cách BLK-065) |
| assumptions | 7 | A-015 | thấp | Signpost bỏ mốc "hơn dự kiến" | Sửa: thêm lại "hơn mức dự kiến" |
| assumptions | 8 | A-019 | thấp | Signpost 1 kích hoạt chỉ với một yêu cầu không xếp được | Sửa: đo cùng đại lượng với ngưỡng Supported (tỷ lệ đồng thuận) |
| assumptions | 9 | A-020 | thấp | "chữ, hình khối và bảng" đọc thành cả ba | Sửa: "chữ, hình khối hoặc bảng" (khớp A-022, R-027) |
| assumptions | 10 | A-020 | thấp | Signpost 3 thu hẹp về "chỉnh tay chuyên sâu" và bỏ "nhiều hơn dự kiến" | Sửa: "cho biết cần chỉnh trong Hệ thống trước khi tải về nhiều hơn dự kiến" |
| assumptions | 11 | A-021 | thấp | Signpost 1 bỏ "quá thường xuyên" | Sửa: thêm lại "quá thường xuyên" |
| assumptions | 12 | A-029 | thấp | Signpost 1 bỏ "thường" | Sửa: "cho biết thường mất deck ngoài ý muốn" |
| assumptions | 13 | A-018 | thấp | Hai điều kiện bác bỏ của sheet chỉ còn là Signpost | Giải thích: BLK-010 định nghĩa đủ Invalidated ("đủ mẫu mà không đạt ngưỡng Supported", quyết định B2); giữ hai điều kiện làm tín hiệu xem lại |
| assumptions | 14 | 15 Assumption về người dùng | thấp | Vế "tính lại tử số / mẫu số trên toàn bộ người đã tham gia" vượt trả lời CX-6 | Sửa: bỏ vế này; dòng 7 chỉ còn "giữ Open; được thử thêm người" đúng CX-6 |
| business-rules | 1 | BR-002 | cao | Rule 3 thu hẹp quyền AI bổ sung nội dung về lúc tạo deck | Sửa: điều kiện "Khi nội dung deck lấy từ tài liệu có sẵn" như Rule 1 và như Exceptions không điều kiện của sheet |
| business-rules | 2 | BR-009 | thấp | Ghi chú biến câu hỏi mở thành kết luận đã chốt | Sửa: "Dùng nhiều tài liệu có sẵn cho một deck chưa thuộc V1 và còn là câu hỏi mở (D-024)" |
| business-rules | 3 | BR-010 | thấp | Hai dòng lỗi liệt kê đóng "(quá thời gian, lỗi kết nối)", thiếu ACT-002 trả lỗi | Sửa: thêm "hoặc ACT-002 trả lỗi thay vì kết quả" |
| business-rules | 4 | BR-010 | thấp | UC-023 vào `use_cases` và bảng với căn cứ PLAN.md | Giải thích: nhánh 3B của UC-023 trên sheet là lượt sửa thất bại, đúng trường hợp Rule của BR-005 trên sheet ("lượt … sửa … thất bại"), nay là mệnh đề 15 của BR-010 (CX-1). Khác UC-022 4A và UC-024 2A (CX-8), vốn không thuộc Rule của BR-005 |
| business-rules | 5 | BR-015 | thấp | Bỏ "xem lại khi UC-012 được đưa vào làm" | Sửa: thêm Ghi chú 2 (việc để sau, GX-12); không dẫn OR-045 (tab Operating Rules không migrate) |
| business-rules | 6 | BR-016 | thấp | Bỏ "xem lại khi UC-022 được đưa vào làm" | Sửa: thêm Ghi chú 2 |
| business-rules | 7 | BR-017 | thấp | Bỏ "xem lại khi UC-017 được đưa vào làm" | Sửa: thêm Ghi chú 1 |
| business-rules | ngoài bảng | BR-003 | — | Mệnh đề 8 đọc riêng có vẻ trái mệnh đề 7 | Sửa: thêm "sau lượt sửa đó, ràng buộc còn hiệu lực tiếp tục áp dụng" (đúng CX-4) |
| requirements | 1 | R-001 | thấp | Acceptance 3 thu hẹp "mọi thông tin" thành "6 loại ràng buộc" | Sửa: "đủ ý định và cả 6 loại ràng buộc của người dùng" |
| requirements | 2 | R-002 | thấp | "dễ" yếu đi thành "có thể" | Sửa: trả lại "dễ" (chấp nhận cảnh báo Lint) |
| requirements | 3 | R-017 | thấp | Câu hỏi mở thành "kết luận nằm ở D-024" | Sửa: "chưa thuộc V1 và còn là câu hỏi mở (D-024)" |
| requirements | 4 | R-056 | thấp | Mất điều kiện đưa vào V1 khi tách từ R-018 | Sửa: thêm Ghi chú 2 "R-056 chỉ được đưa vào V1 khi thiếu hình làm deck không đạt R-021" |
| requirements | 5 | R-019 | cao | Acceptance 3 thêm điều kiện "deck chưa tải về" và có thể đọc thành bước xem trước mới | Sửa: "Cho deck hiện tại, trước khi người dùng chọn tải về, thì người dùng xem được deck hiện tại" |
| requirements | 6 | R-020 | thấp | Tóm tắt bỏ vế "bản đã chấp nhận không đổi" | Sửa: "bản đã chấp nhận và bản chờ duyệt … theo BR-010 mệnh đề 5, 15, 16" |
| requirements | 7 | R-024 | thấp | `short_name` mất "qua các lần sửa" | Sửa: "Giữ ràng buộc qua các lần sửa" |
| requirements | 8–10 | R-038, R-039, R-040 | thấp | Bỏ ý "Kiến trúc vẫn cân nhắc" cùng mã W-028 | Sửa: "… không phải acceptance của V1; Kiến trúc vẫn cân nhắc R-0xx" |
| requirements | 11 | R-045 | thấp | Bỏ ghi chú việc còn phải cập nhật DOC-004, DOC-008 | Sửa: thêm Ghi chú "R-045 chưa có trong DOC-004 và DOC-008; Duy cập nhật sau" (việc để sau, GX-12) |
| requirements | 12 | R-046 | cao | "bất kỳ lúc nào trước khi xong" thành "tại một thời điểm" | Sửa: "khi người dùng chọn dừng trước khi lượt xong, dù lượt đang ở bước nào" |
| requirements | 13 | R-047 | thấp | Câu hỏi mở thành "kết luận nằm ở D-025" | Sửa: "chưa thuộc V1 và còn cần tìm hiểu thêm (D-025)" |
| use-cases | (từ requirements) | UC-017 | thấp | Ghi chú 1 do agent chính sửa ở B4 vẫn biến câu hỏi mở thành kết luận | Sửa: "Đổi phong cách cả deck chưa thuộc V1 và còn cần tìm hiểu thêm (D-025)" |
| use-cases | 1 | UC-001 | thấp | Tình huống bỏ "ngay" | Sửa: trả lại "nhận ngay một deck" |
| use-cases | 2 | UC-002 | thấp | Nơi xử lý của Câu hỏi mở 1 đổi từ W-032 sang R-007 | Sửa: trả lại "(nơi xử lý: W-032)" theo BLK-063 |
| use-cases | 3 | UC-008 | thấp | Mục tiêu "dùng được" yếu đi thành "để dùng" | Sửa: trả lại "dùng được ngoài Hệ thống" |
| use-cases | 4 | UC-013 | thấp | Bỏ Postconditions 3 "Người dùng gửi được yêu cầu sửa khác" | Giải thích: GUC-13 cấm ghi "có thể làm gì tiếp" trong Postconditions; trạng thái sau Use Case đã có ở Postconditions 1–2 và BR-010. Quyết định 1 của Pha A cho phép viết lại để đạt gate |
| use-cases | 5 | UC-014 | thấp | Tình huống bỏ "ngay" | Sửa: trả lại "dừng ngay lượt xử lý đó" |
| use-cases | 6 | UC-017 | thấp | Mục tiêu đổi từ "mọi slide thống nhất" sang "chọn một lần" | Sửa: trả lại câu của sheet "Mọi slide trong deck dùng thống nhất một theme hoặc bộ nhận diện người dùng chọn." |
| use-cases | 7 | UC-017 | thấp | "template PPTX" mở rộng thành "file PPTX của tổ chức" | Sửa: trả lại "template PPTX" (từ cấm "template" chỉ áp khi nói về giao diện, BLK-066, BLK-067) |
| use-cases | 8 | UC-022 | thấp | "bất kỳ" thành "một bản trong lịch sử" | Giải thích: BLK-013 giữ giới hạn lưu trữ lịch sử ở BR-016, nên "bất kỳ bản nào" không còn đúng |
| use-cases | 9 | UC-023 | thấp | Thêm chủ ngữ "Use Case này" cho "Mở lại" | Sửa: "Mở lại phạm vi nếu nhiều người dùng cần sửa đúng một slide" |
| use-cases | ngoài bảng | UC-002 | — | Ghi chú có hai mục số 3 (do agent chính chèn ghi chú CX-5) | Sửa: ghi chú CX-5 thành mục 5 |
