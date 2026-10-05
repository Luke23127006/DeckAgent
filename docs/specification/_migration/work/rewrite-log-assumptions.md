# Rewrite log: assumptions (Pha B, bước B4)

Item đã viết: A-007, A-008, A-009, A-010, A-011, A-012, A-013, A-014, A-015, A-016, A-017, A-018, A-019, A-020, A-021, A-022, A-023, A-029 (18 item). A-001 … A-006 đã xóa (APPLY.md mục 5), không có file.

## Mẫu chung của `Cách kiểm chứng` (15 item về người dùng)

15 item của P1d (A-007 … A-017, A-020, A-021, A-022, A-029) dùng cùng 6 dòng; chỉ dòng 2 (tử số) viết riêng cho từng item và được ghi ở bảng dưới:

1. Đối tượng và mẫu số: người thuộc nhóm ACT-001 tham gia buổi thử; mẫu số là số người tham gia buổi thử.
2. Tử số: số người tham gia <quan sát cho thấy điều ngược lại với câu Assumption>.
3. Cỡ mẫu tối thiểu: 5 người `[tạm 2026-10-03 · xem lại: buổi thử người dùng đầu tiên với ≥ 5 người thuộc nhóm ACT-001]`.
4. Supported: tử số / mẫu số ≤ 1/5 (cùng nhãn).
5. Invalidated: tử số / mẫu số ≥ 2/5 (cùng nhãn).
6. Buổi thử có ít người hơn cỡ mẫu tối thiểu ở dòng 3, hoặc tử số / mẫu số nằm giữa ngưỡng ở dòng 4 và ngưỡng ở dòng 5: giữ Open.

Căn cứ: P1d, BLK-005 … BLK-009, BLK-046, GA-05, APPLY.md mục 7 (sự kiện xem lại). Dòng 6 vế "nằm giữa hai ngưỡng": xem "Không áp rõ" 1.

Tử số được viết là phủ định trực tiếp của câu Assumption ở từng người (GA-05: cùng đại lượng). `Signpost` giữ các tín hiệu của sheet, viết thành sự kiện quan sát được ở một người tham gia (GA-04).

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| A-007 | Assumption | Người dùng cá nhân muốn tạo và sửa deck chủ yếu bằng AI, không có kỹ năng thiết kế chuyên sâu nhưng vẫn muốn kiểm soát kết quả, là nhóm người dùng DeckAgent nên phục vụ. | Người dùng thuộc nhóm ACT-001 có nhu cầu tạo và sửa deck chủ yếu bằng AI. | BLK-018 (P5: chỉ giữ khẳng định về nhu cầu; đặc điểm nhóm do ACT-001 sở hữu; bỏ vế lựa chọn), P1d, GA-01, GA-02, GX-10 |
| A-007 | Signpost | Phỏng vấn người dùng, usability test hoặc feedback cho thấy nhu cầu thực tế khác rõ rệt | Phỏng vấn người dùng, buổi thử người dùng hoặc feedback ghi nhận người thuộc nhóm ACT-001 không có nhu cầu tạo và sửa deck chủ yếu bằng AI. | BLK-005 (P1d), GA-04 (bỏ "rõ rệt"; tín hiệu đo cùng đại lượng với câu Assumption) |
| A-007 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết không có nhu cầu tạo và sửa deck chủ yếu bằng AI. | P1d, BLK-005, GA-05 |
| A-007 | Ghi chú 1 | Ảnh hưởng V1: liên quan. | Mức ảnh hưởng tới V1: liên quan. | PLAN.md mục 4 (quy tắc chung của assumptions), GX-12 |
| A-007 | Ghi chú 3 | DOC-001 và DOC-002 mới xác định nhóm người dùng, chưa có evidence thực tế. | Nhóm người dùng của ACT-001 đã được xác định nhưng chưa có evidence thực tế. | GX-12 (bỏ tên nguồn), PLAN.md mục 4 (A-007) |
| A-007 | Ghi chú 4 | (Review Trigger) hoặc team chọn nhóm người dùng hẹp hơn. | Xem lại phạm vi khi team chọn nhóm người dùng hẹp hơn. | BLK-065 (P9) |
| A-008 | Assumption | Người dùng muốn AI làm phần lớn việc tạo và sửa deck, thay vì dùng DeckAgent như một editor thủ công có thêm AI. | Người dùng thuộc nhóm ACT-001 muốn giao cho AI phần lớn việc tạo và sửa deck, thay vì dùng Hệ thống như một editor thủ công có thêm AI. | BLK-005 (P1d), BLK-068, GX-16 |
| A-008 | Signpost | User testing cho thấy người dùng muốn tự kiểm soát trực tiếp nhiều hơn | Người tham gia buổi thử muốn tự kiểm soát trực tiếp việc tạo và sửa deck, thay vì giao phần lớn việc tạo và sửa deck cho AI. | BLK-005, GA-04 (bỏ "nhiều hơn"; mốc so sánh là vế "thay vì") |
| A-008 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia chọn dùng Hệ thống như một editor thủ công có thêm AI, thay vì giao cho AI phần lớn việc tạo và sửa deck. | P1d, GA-05 |
| A-008 | Nếu sai | (Ghi chú 2) nếu sai, mục tiêu và ranh giới V1 có thể phải mở lại. | Mở lại mục tiêu và ranh giới V1. | GA-06, PLAN.md mục 4 (A-008) |
| A-008 | Ghi chú 1 | Ảnh hưởng V1: bắt buộc. | Mức ảnh hưởng tới V1: bắt buộc. | PLAN.md mục 4, GX-12 |
| A-008 | Ghi chú 2 | (Ghi chú 2) Là nền của quyết định chọn luồng AI-first từ đầu tới cuối | — (bỏ) | GX-12, GX-05 (quan hệ D-006, D-012 → A-008 đã ghi), PLAN.md mục 4 |
| A-008 | Ghi chú 2 | (Review Trigger) hoặc cách làm AI-first không giảm được việc thủ công. | Xem lại phạm vi khi cách làm AI-first không giảm được việc thủ công. | BLK-065 |
| A-009 | Assumption | Gõ yêu cầu bằng ngôn ngữ tự nhiên là cách tương tác chính hợp với người dùng khi tạo và sửa deck. | Gõ yêu cầu bằng ngôn ngữ tự nhiên là cách tương tác chính hợp với người dùng thuộc nhóm ACT-001 khi tạo và sửa deck: người dùng mô tả được ý định và yêu cầu sửa bằng lời, và không thấy cách tương tác khác hiệu quả hơn gõ yêu cầu. | BLK-005 (P1d), GA-01, GX-08 ("hợp với" được định nghĩa ngay trong câu, lấy từ 2 tín hiệu của Review Trigger) |
| A-009 | Signpost 1 | Usability test cho thấy người dùng khó mô tả ý định hoặc yêu cầu sửa bằng lời | Người tham gia buổi thử không mô tả được ý định hoặc yêu cầu sửa bằng lời. | BLK-005, GA-04, GX-14 |
| A-009 | Signpost 2 | phải gõ lại nhiều lần | Người tham gia buổi thử phải gõ lại cùng một yêu cầu nhiều lần. | GX-14, GX-16; "Không áp rõ" 2 |
| A-009 | Signpost 3 | hoặc cách tương tác khác hiệu quả hơn | Người tham gia buổi thử cho biết một cách tương tác khác hiệu quả hơn gõ yêu cầu. | GA-04, GX-08 (thêm mốc so sánh "gõ yêu cầu") |
| A-009 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia không mô tả được ý định hoặc yêu cầu sửa bằng lời, hoặc cho biết một cách tương tác khác hiệu quả hơn gõ yêu cầu. | P1d, GA-05 |
| A-009 | Ghi chú 1 | Ảnh hưởng V1: bắt buộc. | Mức ảnh hưởng tới V1: bắt buộc. | PLAN.md mục 4, GX-12 |
| A-009 | Ghi chú 2 | V1 dùng chat làm cách tương tác chính để tạo và sửa cả deck; không có nghĩa đây là cách duy nhất về sau. | V1 dùng chat làm cách tương tác chính để tạo và sửa cả deck; chat không nhất thiết là cách tương tác duy nhất ở các release sau. | GX-17 ("đây"), GX-08 ("về sau") |
| A-010 | Assumption | Người dùng vẫn cần tự sửa trực tiếp các lỗi nhỏ; chỉ gõ yêu cầu cho AI có thể bất tiện với những thao tác này. | Người dùng thuộc nhóm ACT-001 vẫn cần tự sửa trực tiếp trong Hệ thống các lỗi nhỏ (sai chính tả, sai một con số, thay một từ hoặc một câu), vì chỉ gõ yêu cầu cho AI là bất tiện với các thao tác sửa lỗi nhỏ. | BLK-006 (P1d: định nghĩa "lỗi nhỏ"), GA-01 (bỏ "có thể"), GX-17 ("những thao tác này"); "trong Hệ thống" lấy từ Ghi chú 1 gốc ("sửa trực tiếp trong ứng dụng") |
| A-010 | Signpost | User testing cho thấy hiếm khi cần sửa trực tiếp vì chỉnh trong PowerPoint sau khi tải về đã giải quyết được | Người tham gia buổi thử cho biết không cần tự sửa trực tiếp lỗi nhỏ trong Hệ thống, vì chỉnh trong `PowerPoint` sau khi tải về đã sửa được lỗi nhỏ. | BLK-006, GA-04 ("hiếm khi" → sự kiện ở từng người), BLK-069 |
| A-010 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết không cần tự sửa trực tiếp lỗi nhỏ trong Hệ thống. | P1d, GA-05 |
| A-010 | Ghi chú 1 | Ảnh hưởng V1: để sau; DOC-002 không ưu tiên sửa trực tiếp trong ứng dụng. | Mức ảnh hưởng tới V1: để sau. | GX-12 (bỏ nguồn DOC-002), BLK-039 (vế "không ưu tiên sửa trực tiếp" là quy định của D-015) |
| A-010 | Ghi chú 2 | Chưa bị bác bỏ, nhưng không được kéo V1 sang xây editor web. | A-010 chưa bị bác bỏ; phạm vi editor của V1 do D-015 quy định. | BLK-039 (P3: bỏ mệnh đề quy định, giữ tóm tắt kèm ID sở hữu D-015), GX-16 |
| A-010 | Ghi chú 3 | Theo dõi cho UC-005. | A-010 được theo dõi cho UC-005. | GX-16 |
| A-010 | Ghi chú 4 | (Review Trigger) hoặc ngược lại người dùng thường xuyên cần sửa trước khi tải về. | Xem lại phạm vi khi người dùng thường xuyên cần sửa trực tiếp trước khi tải về. | BLK-065 |
| A-011 | Assumption | Nhập và sửa tiếp deck có sẵn là nhu cầu cốt lõi, không chỉ là capability phụ sau khi luồng tạo mới đã hoàn thiện. | Với người dùng thuộc nhóm ACT-001, nhập và sửa tiếp deck có sẵn là nhu cầu cốt lõi, không chỉ là capability phụ sau khi luồng tạo deck mới đã hoàn thiện. | BLK-008 (P1d), GX-07 ("tạo deck mới") |
| A-011 | Signpost | — (cả hai vế Review Trigger chuyển sang Ghi chú theo BLK-065) | Người tham gia buổi thử cho biết nhập và sửa tiếp deck có sẵn chỉ là nhu cầu phụ so với tạo deck mới. | BLK-008, BLK-046 (P1d: Signpost viết cụ thể theo quy trình), GA-04 |
| A-011 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết nhập và sửa tiếp deck có sẵn không phải nhu cầu cốt lõi của người tham gia. | P1d, GA-05 |
| A-011 | Ghi chú 1 | Ảnh hưởng V1: để sau; V1 ưu tiên tạo mới. | Mức ảnh hưởng tới V1: để sau; V1 ưu tiên tạo deck mới (D-013). | PLAN.md mục 4, GX-10 (tóm tắt kèm ID sở hữu) |
| A-011 | Ghi chú 2 | Vẫn thuộc hướng sản phẩm nhưng chưa tạo phụ thuộc cho Architecture V1. | Nhập và sửa tiếp deck có sẵn vẫn thuộc hướng sản phẩm nhưng chưa tạo phụ thuộc cho Architecture V1. | GX-16 |
| A-011 | Ghi chú 3 | (Review Trigger) Nghiên cứu hoặc dữ liệu sử dụng cho thấy nhu cầu sửa deck có sẵn lớn, hoặc chi phí nhập và giữ bố cục quá cao so với giá trị. | Xem lại phạm vi khi nghiên cứu hoặc dữ liệu sử dụng cho thấy nhu cầu sửa deck có sẵn lớn, hoặc chi phí nhập và giữ bố cục quá cao so với giá trị. | BLK-065 |
| A-012 | Assumption | “Sửa một chỗ nhưng làm hỏng chỗ khác” là vấn đề người dùng gặp thường xuyên, nên DeckAgent cần đầu tư vào việc giữ nguyên phần ngoài phạm vi sửa. | "Sửa một chỗ nhưng làm hỏng chỗ khác" là vấn đề người dùng thuộc nhóm ACT-001 gặp thường xuyên khi sửa deck. | BLK-039 (bỏ vế quy định, R-022 sở hữu), BLK-009 (P1d); "khi sửa deck" nêu ngữ cảnh của cụm trích; "Không áp rõ" 2 |
| A-012 | Signpost 1 | — | Người tham gia buổi thử cho biết không thường xuyên gặp vấn đề "sửa một chỗ nhưng làm hỏng chỗ khác" khi sửa deck. | BLK-009, P1d, GA-04 |
| A-012 | Signpost 2 | Feedback hoặc thí nghiệm cho thấy … hoặc ngược lại không ảnh hưởng tới acceptance. | Feedback hoặc thí nghiệm cho thấy thay đổi ngoài ý muốn không ảnh hưởng tới acceptance. | GX-14, GX-16 (khôi phục chủ ngữ cho vế tách ra) |
| A-012 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết không thường xuyên gặp vấn đề "sửa một chỗ nhưng làm hỏng chỗ khác" khi sửa deck. | P1d, GA-05 |
| A-012 | Ghi chú 1 | Ảnh hưởng V1: để sau; P4 Safe Refinement không phải critical acceptance của V1. | Mức ảnh hưởng tới V1: để sau; `P4 Safe Refinement` không phải critical acceptance của V1 (D-017). | PLAN.md mục 4, BLK-069, GX-10 |
| A-012 | Ghi chú 2 | Bỏ P4 khỏi V1 không có nghĩa assumption này bị bác bỏ. | Việc bỏ `P4 Safe Refinement` khỏi V1 không có nghĩa A-012 bị bác bỏ. | GX-17, BLK-069, GX-16 |
| A-012 | Ghi chú 3 | — | Việc giữ nguyên phần ngoài phạm vi sửa do R-022 quy định. | BLK-039 (câu tóm tắt kèm ID sở hữu) |
| A-012 | Ghi chú 4 | (Review Trigger) Feedback hoặc thí nghiệm cho thấy thay đổi ngoài ý muốn trở thành vấn đề lớn | Xem lại phạm vi khi feedback hoặc thí nghiệm cho thấy thay đổi ngoài ý muốn trở thành vấn đề lớn. | BLK-065 |
| A-013 | Assumption | Ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) cần được giữ qua nhiều lần sửa; nếu bị quên, trải nghiệm giảm rõ rệt. | Nếu Hệ thống không giữ ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) qua các lần sửa, trải nghiệm của người dùng thuộc nhóm ACT-001 giảm rõ rệt. | BLK-039 (bỏ "cần được giữ", BR-003 sở hữu), BLK-009 (P1d), GX-16, BLK-068, PLAN.md mục 5 |
| A-013 | Signpost 1 | Testing cho thấy không phải ràng buộc nào cũng cần giữ | Kết quả test cho thấy có loại ràng buộc của người dùng không cần giữ qua các lần sửa. | GX-14, GX-07, PLAN.md mục 5 |
| A-013 | Signpost 2 | hoặc giữ tất cả gây xung đột | Kết quả test cho thấy giữ mọi ràng buộc của người dùng qua các lần sửa gây xung đột giữa các ràng buộc. | GX-14, PLAN.md mục 5 |
| A-013 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết trải nghiệm không giảm rõ rệt khi Hệ thống không giữ ý định hoặc ràng buộc của người dùng qua các lần sửa. | P1d, GA-05; "Không áp rõ" 2 |
| A-013 | Nếu sai | (Review Trigger) khi đó cần xác định thời hạn theo từng loại ràng buộc. | Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng. | GA-06, PLAN.md mục 5; "Không áp rõ" 3 |
| A-013 | Ghi chú 1 | 1. D-025 xác nhận ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck. 2. Câu hỏi OQ-04 về thời hạn và cách xử lý xung đột vẫn cố ý để mở vì chưa chặn Architecture. | Việc giữ ràng buộc của người dùng qua các lần sửa, thời hạn áp dụng và cách xử lý xung đột giữa các ràng buộc của người dùng do BR-003 quy định. | BLK-039 (Ghi chú 1 phát biểu lại BR-003), BLK-043 (P2: loại, thời hạn, xung đột nay thuộc BR-003); "Không áp rõ" 3 |
| A-014 | Assumption | Người dùng nhận được giá trị khi cùng một loại file được dùng với nhiều vai trò theo mục đích, thay vì mỗi loại file chỉ có một vai trò cố định. | Người dùng thuộc nhóm ACT-001 nhận được giá trị khi cùng một loại file được dùng với nhiều vai trò theo mục đích, thay vì mỗi loại file chỉ có một vai trò cố định. | BLK-008 (P1d) |
| A-014 | Signpost | V1 thực tế chỉ cần ít loại file hoặc vai trò | Người tham gia buổi thử chỉ cần dùng mỗi loại file với một vai trò. | BLK-008, GA-04 (bỏ "ít"; sự kiện ở từng người); vế "ít loại file" bỏ vì không đo điều câu Assumption khẳng định (GA-05) |
| A-014 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết việc dùng cùng một loại file với nhiều vai trò theo mục đích không mang lại giá trị cho người tham gia. | P1d, GA-05 |
| A-014 | Ghi chú 2 | Giá trị của nhiều vai trò tiếp tục được kiểm chứng sau V1. | Giá trị của việc dùng một loại file với nhiều vai trò tiếp tục được kiểm chứng sau V1. | GX-17 |
| A-014 | Ghi chú 3 | (Review Trigger) hoặc xử lý nhiều vai trò tạo độ phức tạp lớn mà ít giá trị. | Xem lại phạm vi khi xử lý nhiều vai trò tạo độ phức tạp lớn mà ít giá trị. | BLK-065 |
| A-015 | Assumption | Người dùng quan tâm tới việc giữ đúng thông tin từ tài liệu, nên DeckAgent phải phân biệt rõ nội dung lấy từ tài liệu và nội dung do AI bổ sung. | Người dùng thuộc nhóm ACT-001 quan tâm tới việc deck giữ đúng thông tin từ tài liệu có sẵn. | BLK-039 (bỏ vế quy định, R-008 sở hữu), BLK-007 (P1d), GX-07 ("tài liệu có sẵn") |
| A-015 | Signpost | hoặc người dùng chấp nhận AI bổ sung tự do hơn dự kiến | Người tham gia buổi thử chấp nhận để AI bổ sung tự do nội dung không có trong tài liệu có sẵn. | BLK-007, GA-04 (bỏ "hơn dự kiến"; sự kiện ở từng người) |
| A-015 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết không quan tâm tới việc deck giữ đúng thông tin từ tài liệu có sẵn. | P1d, GA-05 |
| A-015 | Ghi chú 1 | Ảnh hưởng V1: bắt buộc; là nền của P1 Source Fidelity. | Mức ảnh hưởng tới V1: bắt buộc; A-015 là nền của `P1 Source Fidelity`. | PLAN.md mục 4, BLK-069, GX-16 |
| A-015 | Ghi chú 2 | Khi deck được tạo từ tài liệu có sẵn, P1 là hard acceptance. | Khi deck được tạo từ tài liệu có sẵn, `P1 Source Fidelity` là hard acceptance (D-017). | BLK-069, GX-10 (tóm tắt kèm ID sở hữu) |
| A-015 | Ghi chú 3 | — | Việc phân biệt nội dung lấy từ tài liệu có sẵn với nội dung do AI bổ sung do R-008 quy định. | BLK-039 (câu tóm tắt kèm ID sở hữu) |
| A-015 | Ghi chú 3 (gốc) | Evidence vẫn cần đến từ test hoặc nghiên cứu người dùng thực tế. | — (bỏ; ý nằm ở `Cách kiểm chứng` dòng 1: buổi thử với người thuộc nhóm ACT-001) | PLAN.md mục 4 (A-015: Ghi chú 3 sang Cách kiểm chứng), P1d |
| A-015 | Ghi chú 4 | (Review Trigger) Nghiên cứu hoặc đánh giá cho thấy luồng tạo từ tài liệu ít được dùng | Xem lại phạm vi khi nghiên cứu hoặc đánh giá cho thấy luồng tạo deck từ tài liệu có sẵn ít được dùng. | BLK-065, GX-07 |
| A-016 | Assumption | Người dùng coi trọng việc các file tải về giống nhau về ý nghĩa hơn là giống nhau về pixel, font, khả năng sửa hoặc tương tác. | Người dùng thuộc nhóm ACT-001 coi trọng việc các file tải về giống nhau về ý nghĩa hơn giống nhau về pixel, font, khả năng sửa hoặc tương tác. | BLK-007 (P1d) |
| A-016 | Signpost | kỳ vọng người dùng … đòi hỏi độ giống hình ảnh cao hơn độ giống ý nghĩa | Người tham gia buổi thử kỳ vọng các file tải về giống nhau về hình ảnh hơn giống nhau về ý nghĩa. | BLK-007, GA-04; "Không áp rõ" 5 |
| A-016 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia coi trọng việc các file tải về giống nhau về pixel, font, khả năng sửa hoặc tương tác hơn giống nhau về ý nghĩa. | P1d, GA-05 |
| A-016 | Ghi chú 1 | Ảnh hưởng V1: liên quan; là nền của P5 Output Fidelity. | Mức ảnh hưởng tới V1: liên quan; A-016 là nền của `P5 Output Fidelity`. | PLAN.md mục 4, BLK-069, GX-16 |
| A-016 | Ghi chú 2 | V1 không yêu cầu PPTX và PDF giống nhau từng pixel. | Mức giống nhau giữa các file tải về do D-009 quy định. | BLK-039 (D-009 sở hữu), APPLY.md mục 2 |
| A-016 | Ghi chú 3 | (Review Trigger) Yêu cầu đồ án, kỳ vọng người dùng hoặc một định dạng cụ thể đòi hỏi độ giống hình ảnh cao hơn độ giống ý nghĩa, hoặc một định dạng cần contract riêng. | Xem lại phạm vi khi kỳ vọng người dùng hoặc một định dạng tải về của D-031 đòi hỏi độ giống hình ảnh cao hơn độ giống ý nghĩa, hoặc một định dạng cần contract riêng. | APPLY.md mục 2 (đúng chữ, bỏ ID gloss), BLK-065, Q1 |
| A-017 | Assumption | Xem trước đáng tin để người dùng quyết định deck đã dùng được trước khi tải về. | Người dùng thuộc nhóm ACT-001 dựa vào xem trước để quyết định giữ và tải về deck. | BLK-007 (P1d), GA-01, GX-08 ("đáng tin", "dùng được"); "Không áp rõ" 6 |
| A-017 | Signpost | Xem trước và file tải về khác nhau rõ rệt đến mức người dùng không dựa vào xem trước để quyết định được. | Người tham gia buổi thử thấy file tải về khác xem trước đến mức không dựa vào xem trước để quyết định được. | BLK-007, GA-04 (bỏ "rõ rệt"; mức khác nhau đo bằng hệ quả ở từng người) |
| A-017 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia không dựa vào xem trước để quyết định giữ và tải về deck. | P1d, GA-05 |
| A-017 | Nếu sai | (Ghi chú 2) nếu sai, luồng Xem trước → Giữ → Tải về phải thay đổi. | Thay đổi luồng Xem trước → Giữ → Tải về. | GA-06, PLAN.md mục 4 (A-017) |
| A-017 | Ghi chú 1 | Ảnh hưởng V1: bắt buộc. | Mức ảnh hưởng tới V1: bắt buộc. | PLAN.md mục 4, GX-12 |
| A-017 | Ghi chú 2 | Luồng chính dùng xem trước làm căn cứ quyết định trước khi tải về; nếu sai, luồng Xem trước → Giữ → Tải về phải thay đổi. | Luồng chính dùng xem trước làm căn cứ quyết định trước khi tải về. | GA-06 (vế sau chuyển sang `Nếu sai`) |
| A-018 | Assumption | Các lượt xử lý AI có độ khó khác nhau rõ ràng, nên sau này có thể dùng mức tính toán khác nhau mà không giảm chất lượng bắt buộc. | Các lượt xử lý AI có độ khó khác nhau rõ ràng: thời gian hoặc chi phí trung bình của nhóm lượt xử lý AI khó gấp ≥ 2 lần `[tạm …]` nhóm dễ, trong khi nhóm dễ vẫn đạt R-021; nhờ đó, sau này Hệ thống có thể dùng mức tính toán khác nhau mà không giảm chất lượng bắt buộc. | BLK-010 (P1d), APPLY.md mục 7 (sự kiện "lần chạy đầu tiên của bộ đánh giá chung (60 lượt)"), GA-01, GX-08 ("rõ ràng" định nghĩa ngay trong câu) |
| A-018 | Signpost 1 | (Review Trigger) bị bác bỏ nếu khó phân loại độ khó | Benchmark cho thấy khó phân loại độ khó của các lượt xử lý AI. | GX-14, GX-16, PLAN.md mục 4 (A-018: 2 điều kiện bác bỏ giữ ở Signpost) |
| A-018 | Signpost 2 | hoặc chi phí phân loại lớn hơn lợi ích | Benchmark cho thấy chi phí phân loại độ khó lớn hơn phần thời gian hoặc chi phí tiết kiệm được nhờ dùng mức tính toán khác nhau. | GX-14, GA-04 ("lợi ích" viết theo điều câu Assumption khẳng định) |
| A-018 | Cách kiểm chứng | (Review Trigger) Sau benchmark về thời gian, chi phí, khả năng model và chất lượng | 7 dòng: đối tượng là lượt xử lý AI của bộ đánh giá chung chia thành nhóm khó và nhóm dễ; phép đo là benchmark về thời gian, chi phí, khả năng model và chất lượng; cỡ mẫu 60 lượt; Supported theo ngưỡng ≥ 2 lần và R-021; Invalidated khi đủ mẫu mà không đạt Supported; chưa đủ mẫu thì giữ Open. | BLK-010, P1c (bộ đánh giá chung 60 lượt), GA-05, APPLY.md mục 7; "Không áp rõ" 4 |
| A-018 | Ghi chú 1 | Ảnh hưởng V1: để sau. | Mức ảnh hưởng tới V1: để sau. | PLAN.md mục 4, GX-12 |
| A-018 | Ghi chú 2 | Là nền của hướng đóng góp Option B (AD6) trong DOC-001, không phải mục tiêu chính của V1. | A-018 là nền của một hướng đóng góp, không phải mục tiêu chính của V1. | GX-12 (bỏ nguồn; `source` giữ "DOC-001 AD6"), GX-16 |
| A-018 | Ghi chú 3 | Architecture V1 không cần giải bài toán này trừ khi implementation buộc phải làm. | Architecture V1 không cần giải bài toán phân loại độ khó của lượt xử lý AI, trừ khi implementation buộc phải làm. | GX-17 ("bài toán này") |
| A-019 | Assumption | Các loại lượt xử lý (sửa chữ, viết lại theo ý, chèn nội dung, trau chuốt cả deck, thiết kế lại, tạo hình) phân biệt được rõ để hỗ trợ thiết kế, đánh giá hoặc chiến lược xử lý. | Sáu loại lượt xử lý AI (sửa chữ, viết lại theo ý, chèn nội dung, trau chuốt cả deck, thiết kế lại, tạo hình) phân biệt được rõ để hỗ trợ thiết kế, đánh giá hoặc chiến lược xử lý: hai người gán nhãn độc lập xếp cùng một loại cho ≥ 80% `[tạm …]` yêu cầu sửa. | BLK-010 (P1d), APPLY.md mục 7 (sự kiện "lần gán nhãn đầu tiên cho 30 yêu cầu sửa"), GA-01, GX-07 ("lượt xử lý AI") |
| A-019 | Signpost 1 | Implementation cho thấy ranh giới giữa các nhóm quá mơ hồ | Implementation cho thấy có yêu cầu sửa không xếp được vào đúng một trong sáu loại lượt xử lý AI. | BLK-010, GA-04 (bỏ "quá mơ hồ"; sự kiện quan sát được) |
| A-019 | Signpost 2 | hoặc cách phân loại không giúp Testing, thiết kế hay xử lý | Implementation cho thấy cách phân loại sáu loại không giúp Testing, thiết kế hay xử lý. | GX-14, GX-16 |
| A-019 | Cách kiểm chứng | — (section mới) | 6 dòng: 2 người gán nhãn độc lập cho 30 yêu cầu sửa; mẫu số là số yêu cầu sửa đã được cả 2 người xếp loại, tử số là số yêu cầu sửa được xếp cùng một loại; Supported khi ≥ 80%; Invalidated khi đủ mẫu mà không đạt Supported; chưa đủ mẫu thì giữ Open. | BLK-010, GA-05, APPLY.md mục 7 |
| A-019 | Ghi chú 1 | Ảnh hưởng V1: để sau, còn ở mức thăm dò. | Mức ảnh hưởng tới V1: để sau; A-019 còn ở mức thăm dò. | PLAN.md mục 4, GX-16 |
| A-019 | Ghi chú 2 | Cách phân loại trong DOC-001 là mô hình tư duy hiện tại, chưa được chứng minh. | Cách phân loại sáu loại lượt xử lý AI là mô hình tư duy hiện tại, chưa được chứng minh. | GX-12 (bỏ tên nguồn DOC-001), PLAN.md mục 4 |
| A-020 | Assumption | Người dùng chấp nhận chỉnh tay chuyên sâu trong PowerPoint hoặc công cụ chuyên dụng sau khi tải về, thay vì kỳ vọng DeckAgent làm toàn bộ việc thiết kế. | Người dùng thuộc nhóm ACT-001 chấp nhận chỉnh tay chuyên sâu (đổi bố cục, hình khối, animation hoặc định dạng của từng thành phần) trong `PowerPoint` hoặc công cụ chuyên dụng sau khi tải về, thay vì kỳ vọng Hệ thống làm toàn bộ việc thiết kế. | BLK-006 (P1d: định nghĩa "chỉnh tay chuyên sâu"), BLK-068, BLK-069; "Không áp rõ" 8 |
| A-020 | Signpost 1 | User testing cho thấy phải rời DeckAgent làm đứt luồng làm việc | Người tham gia buổi thử cho biết việc phải rời Hệ thống để chỉnh tay chuyên sâu làm đứt luồng làm việc. | GX-14, GX-16, BLK-068 |
| A-020 | Signpost 2 | file PPTX bàn giao không dùng được | File PPTX tải về không mở được, hoặc không sửa được chữ, hình khối và bảng trong `Microsoft PowerPoint` (R-027). | BLK-044 (Q2: ứng dụng kiểm chứng và Acceptance PPTX của R-027), GX-08 ("dùng được") |
| A-020 | Signpost 3 | hoặc người dùng cần chỉnh trong ứng dụng nhiều hơn dự kiến | Người tham gia buổi thử cần chỉnh tay chuyên sâu trong Hệ thống trước khi tải về. | BLK-006, GA-04 (bỏ "nhiều hơn dự kiến"; sự kiện ở từng người) |
| A-020 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia không chấp nhận chỉnh tay chuyên sâu trong `PowerPoint` hoặc công cụ chuyên dụng sau khi tải về, mà kỳ vọng Hệ thống làm toàn bộ việc thiết kế. | P1d, GA-05 |
| A-020 | Ghi chú 1 | Ảnh hưởng V1: bắt buộc. | Mức ảnh hưởng tới V1: bắt buộc. | PLAN.md mục 4, GX-12 |
| A-020 | Ghi chú 2 | DOC-002 dựa trực tiếp vào assumption này để loại editor web khỏi V1. | — (bỏ) | GX-12 (nguồn; quan hệ D-015 → A-020 đã ghi), PLAN.md mục 4 (A-020) |
| A-021 | Assumption | Sửa cả deck bằng AI giúp người dùng đưa deck vừa tạo tới mức dùng được trong V1 mà chưa cần sửa cục bộ từng thành phần. | Sửa cả deck bằng AI giúp người dùng thuộc nhóm ACT-001 đưa deck vừa tạo thành deck dùng được trong V1, mà chưa cần sửa cục bộ từng thành phần. | P1c (thuật ngữ "deck dùng được"), BLK-006 (P1d) |
| A-021 | Signpost 1 | Người dùng phải sửa từng slide hoặc thành phần quá thường xuyên | Người tham gia buổi thử phải gửi yêu cầu sửa nhắm vào từng slide hoặc thành phần. | BLK-006, GA-04 (bỏ "quá thường xuyên"; sự kiện ở từng người), GX-07 ("yêu cầu") |
| A-021 | Signpost 2 | sửa cả deck làm mất kiểm soát | Người tham gia buổi thử cho biết sửa cả deck làm mất kiểm soát deck. | GX-14, GX-16 |
| A-021 | Signpost 3 | hoặc người dùng không đạt deck dùng được khi thiếu sửa cục bộ | Người tham gia buổi thử không đạt deck dùng được khi thiếu sửa cục bộ. | GX-14 |
| A-021 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia không đạt deck dùng được chỉ bằng sửa cả deck. | P1d, P1c, GA-05 |
| A-021 | Ghi chú 1 | D-025 tạo phạm vi test cụ thể: 7 loại sửa cả deck; sửa theo slide chỉ ở mức cố gắng, không đảm bảo. | Phạm vi test của sửa cả deck là 7 loại sửa cả deck của D-025; sửa theo slide chỉ ở mức cố gắng, không đảm bảo (D-025). | GX-10 (tóm tắt kèm ID sở hữu), PLAN.md mục 4 (A-021) |
| A-022 | Assumption | File PPTX tải về dùng được để bàn giao sang chỉnh tay sau DeckAgent, nhờ đó V1 không cần xây editor chuyên nghiệp trong ứng dụng. | Người dùng thuộc nhóm ACT-001 tiếp tục chỉnh tay được file PPTX tải về trong `Microsoft PowerPoint` sau khi rời Hệ thống. | BLK-039 (bỏ vế quy định, D-015 sở hữu), BLK-044 (Q2: `Microsoft PowerPoint`), P1d, GX-08 ("dùng được"), BLK-068 |
| A-022 | Signpost 1 | File PPTX không mở ổn định | File PPTX tải về không mở được trong `Microsoft PowerPoint`. | BLK-044 (Q2), GX-14; "Không áp rõ" 7 |
| A-022 | Signpost 2 | khó sửa | Người tham gia buổi thử không sửa được chữ, hình khối hoặc bảng của file PPTX tải về trong `Microsoft PowerPoint`. | BLK-044 (Acceptance PPTX của R-027), GA-04 |
| A-022 | Signpost 3 | mất cấu trúc slide | Slide của file PPTX tải về mất cấu trúc khi mở trong `Microsoft PowerPoint`. | GX-14, GX-16 |
| A-022 | Signpost 4 | hoặc người dùng phải làm lại nhiều trước khi tiếp tục trong công cụ trình chiếu | Người tham gia buổi thử phải làm lại nhiều phần của deck trước khi tiếp tục chỉnh tay. | GX-14; "công cụ trình chiếu" thay bằng việc chỉnh tay trong `Microsoft PowerPoint` của câu Assumption (Q2); "Không áp rõ" 2 |
| A-022 | Cách kiểm chứng 1–2 | (Ghi chú 2) Mức tương thích được học từ file thật. | Đối tượng: người tham gia mở file PPTX thật do Hệ thống tạo trong `Microsoft PowerPoint` rồi chỉnh tay tiếp. Tử số: số người tham gia gặp ít nhất một trong bốn tình huống ở `Signpost`. | PLAN.md mục 4 (A-022: Ghi chú 2 sang Cách kiểm chứng), P1d, GA-05 |
| A-022 | Ghi chú 1 | D-026 giữ PPTX là định dạng sửa được nhưng chưa chốt mức tương thích với từng ứng dụng trước implementation. | PPTX là định dạng sửa được của V1 (D-031); ứng dụng kiểm chứng là `Microsoft PowerPoint` (R-027). | APPLY.md mục 2 (đúng chữ, bỏ ID gloss), Q2, BLK-069 |
| A-022 | Ghi chú 2 | — | Phạm vi editor của V1 do D-015 quy định. | BLK-039 (câu tóm tắt kèm ID sở hữu) |
| A-023 | Assumption | … cho phép V1 chứng minh việc tải về từ đầu tới cuối và P5 Output Fidelity, … | … cho phép V1 chứng minh việc tải về từ đầu tới cuối và `P5 Output Fidelity`, … | BLK-069, GX-15 (chỉ sửa hình thức) |
| A-023 | Signpost | Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng ngay trong V1, hoặc PPTX và PDF không kiểm chứng được hành vi tải về cần có. | 1. Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng ngay trong V1. 2. PPTX và PDF không kiểm chứng được hành vi tải về cần có. | GX-14, GX-15 (chỉ đánh số, giữ nguyên chữ) |
| A-023 | Ghi chú 2 | — | Retired 2026-10-03: V1 tải về 4 định dạng (D-031); giả định về 2 định dạng không còn làm chỗ dựa. | APPLY.md mục 1, mục 2 (ghi chú đóng đúng chữ, bỏ ID gloss), Q1 |
| A-029 | Assumption | Người dùng V1 chấp nhận việc deck chỉ tồn tại trong lần làm việc hiện tại, vì tải về PPTX giúp họ giữ và tiếp tục công việc. | Người dùng thuộc nhóm ACT-001 chấp nhận việc deck chỉ tồn tại trong lần làm việc hiện tại ở V1, vì tải về PPTX giúp người dùng giữ và tiếp tục công việc. | BLK-009 (P1d), GX-17 ("họ") |
| A-029 | Signpost 1 | User testing cho thấy người dùng thường mất deck ngoài ý muốn | Người tham gia buổi thử mất deck ngoài ý muốn. | BLK-009, GA-04 (bỏ "thường"; sự kiện ở từng người) |
| A-029 | Signpost 2 | hoặc thường cần quay lại deck qua nhiều lần làm việc | Người tham gia buổi thử cho biết thường cần quay lại deck qua nhiều lần làm việc. | GX-14, GX-16; "Không áp rõ" 2 |
| A-029 | Cách kiểm chứng 2 | — (section mới) | Tử số: số người tham gia cho biết không chấp nhận việc deck chỉ tồn tại trong lần làm việc hiện tại. | P1d, GA-05 |
| A-029 | Nếu sai | (Ghi chú 2) Nếu sai, cần mở R-048 (lưu và mở lại deck qua nhiều lần làm việc). | Kích hoạt R-048 (lưu và mở lại deck qua nhiều lần làm việc). | GA-06, PLAN.md mục 4 (A-029) |
| A-029 | Ghi chú | 1. Là assumption nền của D-027, trước đây chưa được ghi ra. | — (bỏ; section `Ghi chú` bị xóa vì trống) | GX-12 (lịch sử; quan hệ D-027 → A-029 đã ghi), PLAN.md mục 4, `_TEMPLATE.md` |

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| A-007 … A-022, A-023, A-029 | Assumption | `Assumption` (viết lại, xem bảng trên; riêng A-023 chỉ sửa hình thức) |
| A-007 … A-022, A-023, A-029 | Review Trigger, vế cho thấy assumption sai | `Signpost` |
| A-007, A-008, A-010, A-011, A-012, A-014, A-015, A-016 | Review Trigger, vế không cho thấy assumption sai | `Ghi chú`, dạng "Xem lại phạm vi khi …" (BLK-065) |
| A-018 | Review Trigger, vế "Sau benchmark về thời gian, chi phí, khả năng model và chất lượng" | `Cách kiểm chứng` dòng 2 |
| A-013 | Review Trigger, vế "khi đó cần xác định thời hạn …" | `Nếu sai` |
| A-008, A-017, A-029 | Ghi chú, vế "nếu sai …" | `Nếu sai` |
| A-022 | Ghi chú 2 | `Cách kiểm chứng` dòng 1 |
| A-007 | Ghi chú 2 ("ACT-001 vẫn là Primary Actor của V1.") | `Ghi chú` 2, giữ nguyên chữ |
| A-014 | Ghi chú 1 | `Ghi chú` 1, giữ nguyên chữ |
| A-019 | Ghi chú 3 | `Ghi chú` 3, giữ nguyên chữ |
| A-023 | Ghi chú 1 | `Ghi chú` 1, giữ nguyên chữ |

Cột bỏ: Impacts, Related Work (IDs) (PLAN.md mục 3, Cột bị bỏ). Used By (IDs) đã lật sang field `assumptions` của Requirement và Decision ở B3. Căn cứ đã thành `source` ở B3 (không đổi).

Field frontmatter: điền `short_name` cho 18 item (3–8 từ, GA-08); `id`, `status`, `source` giữ như khung B3.

`Nếu sai` để `<!-- điền sau: FILL_LATER -->` ở 13 item mà sheet không có ý "nếu sai thì …": A-007, A-009, A-010, A-011, A-012, A-014, A-015, A-016, A-018, A-019, A-020, A-021, A-022. Gợi ý ở `FILL_LATER.md` không được dùng làm nội dung. A-023 (Retired) giữ heading `Cách kiểm chứng` và `Nếu sai` với thân trống, theo cách constraints xử lý item Closed (rewrite-log-constraints.md, "Không áp rõ" 4).

## Sửa quan hệ

Không có. Assumption chỉ có field `source`; khung B3 đã đúng.

## Cần sửa ở loại khác

1. D-014, D-025 (decisions): Reopen When dùng quy trình P1d. Nên dùng cùng quan sát với tử số của A-021 ("không đạt deck dùng được chỉ bằng sửa cả deck") để Decision và Assumption không bị kết luận bằng hai phép đo khác nhau.
2. D-006, D-015 (decisions): Reopen When "file PPTX bàn giao không dùng được" nên viết theo Signpost của A-022 (mở và sửa được chữ, hình khối, bảng trong `Microsoft PowerPoint`, R-027), theo Q2.
3. Bộ đánh giá chung (requirements, B5): P1c để Pha B đề xuất vị trí và chưa nêu item sở hữu. `Cách kiểm chứng` của A-018 gọi là "bộ đánh giá chung dùng cho R-007, R-009, R-021". Khi một Requirement được chọn làm nơi sở hữu, A-018 nên trỏ tới ID đó.
4. ACT-001 (actors, đã dịch): Knowledge / Context 4 ("Tương tác chính bằng cách gõ yêu cầu trong chat") và Constraints 2 ("Chỉnh tay chuyên sâu làm bằng `PowerPoint` …") phát biểu như sự thật điều A-009 và A-020 đang giả định (assess-assumptions.md mục 6 ý 11). Có thể thêm ID A-009, A-020 vào hai dòng đó.
5. BR-003 (business-rules): A-013 `Ghi chú` nay trỏ BR-003 làm nơi sở hữu thời hạn và xung đột của ràng buộc của người dùng (BLK-043). BR-003 cần chứa đủ ba phần (loại, thời hạn "chỉ lần này", xung đột cùng loại) để câu tóm tắt của A-013 đúng.
6. Glossary (B5): "buổi thử" (buổi thử người dùng với người thuộc nhóm ACT-001) được dùng ở 15 Assumption và ở Reopen When của 6 Decision mà chưa có trong glossary. Có thể thêm thuật ngữ để Signpost và `Cách kiểm chứng` cùng nghĩa.

## Không áp rõ

1. **Kết quả nằm giữa hai ngưỡng (15 item người dùng).** P1d chỉ nói "chưa đủ 5 người thì giữ Open". Với đúng 5 người, ngưỡng ≤ 1/5 và ≥ 2/5 phủ mọi kết quả; với hơn 5 người (ví dụ 2/7) tỷ lệ có thể nằm giữa hai ngưỡng. GA-05 đòi nêu cách xử lý trường hợp này.
   - Phương án: (a) giữ Open (đã làm, dòng 6); (b) chỉ tính 5 người đầu tiên; (c) tính theo số người, Invalidated khi ≥ 2 người.
   - Đề xuất: (a). Cần người dùng xác nhận vì là mở rộng của quyết định.
2. **Từ chỉ tần suất hoặc mức độ còn lại ở quan sát từng người.** P1d cho ngưỡng trên số người, không cho ngưỡng trong từng người. Đã giữ chữ sheet ở: A-009 Signpost 2 ("nhiều lần"), A-012 Assumption, Signpost 1, tử số ("thường xuyên", người tham gia tự đánh giá), A-013 Assumption và tử số ("rõ rệt", người tham gia tự đánh giá), A-022 Signpost 4 ("nhiều phần"), A-029 Signpost 2 ("thường"). Ở các item khác, từ loại này được bỏ vì quan sát ở từng người đã là sự kiện (ví dụ A-021 "quá thường xuyên", A-029 Signpost 1 "thường mất").
   - Phương án: (a) giữ, tính theo tự đánh giá của người tham gia (đã làm); (b) người dùng cho số lần cụ thể cho từng chỗ.
   - Đề xuất: (a) cho buổi thử đầu tiên; xem lại cùng sự kiện xem lại của ngưỡng tạm.
3. **A-013: Ghi chú 2 (OQ-04) và `Nếu sai`.** Sheet ghi OQ-04 về thời hạn và xung đột "cố ý để mở"; BLK-043 (P2) đã quyết loại, thời hạn và cách xử lý xung đột, áp cho BR-003. Đã thay hai ghi chú bằng một câu tóm tắt kèm ID BR-003 (BLK-039). `Nếu sai` vẫn giữ chữ sheet "Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng", dù BR-003 nay đã có quy tắc thời hạn.
   - Phương án: (a) như đã làm; (b) giữ nguyên câu OQ-04 (mâu thuẫn BLK-043); (c) đổi `Nếu sai` thành "Mở lại BR-003 để xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng".
   - Đề xuất: (a) cho Ghi chú, (c) cho `Nếu sai`; (c) thêm ID nên cần người dùng xác nhận.
4. **A-018: cách chia nhóm khó và nhóm dễ.** BLK-010 cho ngưỡng (≥ 2 lần, nhóm dễ đạt R-021) nhưng không nói lượt xử lý AI được xếp vào nhóm khó hay nhóm dễ theo tiêu chí nào, và nhóm dễ có chạy với mức tính toán thấp hơn hay không. `Cách kiểm chứng` ghi "chia thành nhóm khó và nhóm dễ" mà không nêu tiêu chí; "nhóm dễ đạt R-021" hiểu là các lượt của nhóm dễ đạt ngưỡng của R-021.
   - Phương án: (a) để như đã làm, tiêu chí chia nhóm chốt khi thiết kế benchmark; (b) người dùng nêu tiêu chí (ví dụ theo loại sửa cả deck của D-025).
   - Đề xuất: (b) trước lần chạy đầu tiên của bộ đánh giá chung.
5. **A-016: câu "Xem lại phạm vi" của APPLY.md trùng một phần Signpost.** APPLY.md mục 2 đưa cả vế "kỳ vọng người dùng … đòi hỏi độ giống hình ảnh cao hơn" sang `Ghi chú`, trong khi bảng của BLK-065 chỉ nêu "Yêu cầu đồ án" và "một định dạng cần contract riêng" là vế không cho thấy assumption sai. Đã giữ câu APPLY.md đúng chữ ở `Ghi chú` 3 và viết vế "kỳ vọng người dùng" thành Signpost.
   - Phương án: (a) như đã làm (trùng một phần, GX-12); (b) bỏ "kỳ vọng người dùng hoặc" khỏi `Ghi chú` 3.
   - Đề xuất: (b).
6. **A-017: "deck đã dùng được".** P1c không liệt kê A-017 trong các item dùng thuật ngữ "deck dùng được"; dùng thuật ngữ sẽ buộc người dùng phán theo tiêu chí của R-021 và R-007. Đã viết "quyết định giữ và tải về deck", theo luồng Xem trước → Giữ → Tải về ở `Ghi chú` 2 và `Nếu sai`.
   - Phương án: (a) như đã làm; (b) dùng thuật ngữ "deck dùng được".
   - Đề xuất: (a).
7. **A-022: "không mở ổn định" → "không mở được".** Đã cụ thể hóa "mở ổn định" và "khó sửa" theo Acceptance PPTX của R-027 (BLK-044). Chữ "ổn định" (mở được nhiều lần, không lỗi giữa chừng) không còn.
   - Phương án: (a) như đã làm; (b) thêm tín hiệu "File PPTX tải về báo lỗi khi mở lại trong `Microsoft PowerPoint`".
   - Đề xuất: (a), vì R-027 là nơi sở hữu tiêu chí mở được.
8. **A-020: "công cụ chuyên dụng".** P1d chỉ định nghĩa "chỉnh tay chuyên sâu"; "công cụ chuyên dụng" (assess-assumptions.md, BLK-006 ý 2) chưa có danh sách. Đã giữ chữ sheet. ACT-001 Constraints 2 và D-015 dùng cùng cụm.
   - Đề xuất: giữ; Lint GX-08 không báo cụm này.
9. **A-007 và A-008 có thể cho cùng quan sát.** BLK-018 giữ "chủ yếu bằng AI" ở A-007 và giao vế "AI làm phần lớn việc" cho A-008. Đã tách theo đại lượng: A-007 đo nhu cầu (người tham gia cho biết có hay không có nhu cầu), A-008 đo lựa chọn giữa giao việc cho AI và editor thủ công có thêm AI. Một người không có nhu cầu dùng AI có thể được tính ở tử số của cả hai item.
   - Đề xuất: giữ; xem lại khi thiết kế câu hỏi của buổi thử đầu tiên.

## Sửa của agent chính sau khi subagent trả về

| ID | Section | Câu của subagent | Câu sau khi sửa | Lý do |
|---|---|---|---|---|
| A-022 | Signpost | 1. File PPTX tải về không mở được trong `Microsoft PowerPoint`. | 1. File PPTX tải về không mở ổn định trong `Microsoft PowerPoint`. | Giữ nghĩa "không mở ổn định" của sheet; "không mở được" thu hẹp nghĩa |
