# Kiểm không đổi nghĩa: business-rules

- Item đã kiểm: 18 (BR-001, BR-002, BR-003, BR-004, BR-005 (đã xóa, đối chiếu qua BR-010), BR-006, BR-007, BR-008, BR-009, BR-010, BR-011, BR-012, BR-013, BR-014, BR-015, BR-016, BR-017, BR-018)
- Chỗ bị đánh dấu: 7 (cao: 1, thấp: 6)

| # | ID | Section | Ô sheet (trích) | Câu mới (trích) | Vấn đề | Mức | Đề xuất sửa |
|---|---|---|---|---|---|---|---|
| 1 | BR-002 | Rule 3 | Exceptions 1: "AI được bổ sung nội dung không có trong tài liệu nếu phân biệt được với nội dung từ tài liệu." (không có điều kiện về luồng) | "Khi tạo deck từ tài liệu có sẵn, AI được bổ sung nội dung không có trong tài liệu có sẵn nếu …" | đổi nghĩa: quyền bổ sung bị thu hẹp từ mọi lúc nội dung deck lấy từ tài liệu (Rule 1 của sheet, gồm cả lượt sửa dùng tài liệu làm căn cứ ở UC-004 bước 4) xuống chỉ lúc tạo deck. Đọc theo câu mới, khi sửa deck có tài liệu có sẵn thì không có mệnh đề nào cho AI bổ sung nội dung. Căn cứ trong log là PLAN.md mục 4, không thuộc nguồn được phép | cao | "3. Khi nội dung deck lấy từ tài liệu có sẵn, AI được bổ sung nội dung không có trong tài liệu có sẵn nếu nội dung bổ sung phân biệt được với nội dung lấy từ tài liệu có sẵn." (dùng cùng vế "Khi" với mệnh đề 1) |
| 2 | BR-009 | Ghi chú 2 | "Nhiều tài liệu cho một deck là câu hỏi ở L-001." | "Kết luận về việc dùng nhiều tài liệu có sẵn cho một deck nằm ở D-024." | đổi nghĩa: sheet ghi đây là câu hỏi còn mở. D-024 (sheet, Rationale 2) cũng ghi "nhiều tài liệu cho một deck … được giữ làm câu hỏi ở L-001", và bản dịch D-024 ghi "Để sau V1; còn là câu hỏi mở". Chữ "Kết luận" biến câu hỏi mở thành việc đã chốt. P8 chỉ cho bỏ mã L-001 | thấp | "Dùng nhiều tài liệu có sẵn cho một deck để sau V1 và còn là câu hỏi mở (D-024)." |
| 3 | BR-010 | Bảng chuyển trạng thái, dòng "Lượt tạo deck đang chạy × … lượt lỗi" và dòng "Lượt sửa deck đang chạy × … lượt lỗi" | Sheet BR-014 mục 2 "Lượt xử lý bị dừng hoặc lỗi không tạo bản mới"; BR-010 Rule 5 "bị dừng, lỗi hoặc không qua kiểm tra" (mọi lỗi) | "Người dùng dừng lượt, hoặc lượt lỗi (quá thời gian, lỗi kết nối)" | đổi nghĩa: phần trong ngoặc đọc được như danh sách đóng, nên hẹp hơn "lỗi" của mệnh đề 13, 14. Phần này cũng bỏ trường hợp ACT-002 trả lỗi thay vì kết quả, là trường hợp có ở UC-001 4C, UC-002 5D và UC-004 4C mà chính hai dòng này dẫn | thấp | "Người dùng dừng lượt, hoặc lượt lỗi (quá thời gian, ACT-002 trả lỗi, không kết nối được ACT-002)", hoặc bỏ phần trong ngoặc |
| 4 | BR-010 | `use_cases` (UC-023); `Bảng chuyển trạng thái` dòng "Lượt sửa deck đang chạy × dừng hoặc lỗi" (dẫn "UC-023 3B") | Sheet BR-010 Related Use Cases không có UC-023. Sheet UC-023 chỉ trỏ BR-004, BR-011; nhánh 3B của sheet không ghi BR nào. Sheet BR-005 không có UC-023 | `use_cases: [… UC-023]`; căn cứ dòng bảng "… UC-023 3B" | thông tin không truy được: log (Sửa quan hệ 1) ghi UC-023 3B "trước trỏ BR-005", nhưng quan hệ đó đến từ PLAN.md mục 4 (log use-cases dòng UC-023 3B), không có trong sheet. CX-1 chỉ chuyển các quan hệ đang trỏ tới BR-005 trong sheet | thấp | Giữ, vì nội dung sheet của UC-023 3B ("Sửa thất bại: … bản đã chấp nhận giữ nguyên") là trường hợp "lượt sửa thất bại" của Rule BR-005 trong sheet, và nội dung này chuyển sang BR-010 mệnh đề 15 theo CX-1. Log cần ghi căn cứ này thay cho PLAN.md. Nếu người dùng muốn xử lý như CX-8 (UC Later) thì bỏ UC-023 khỏi `use_cases` và khỏi căn cứ của dòng bảng |
| 5 | BR-015 | Ghi chú (bỏ Ghi chú 2) | "Hiện chỉ gắn UC-012 và R-049; xem lại theo OR-045 khi UC-012 được đưa vào làm." | — (bỏ cả câu) | thiếu ý: GX-12 cho bỏ vế tóm tắt quan hệ, và mã OR-045 thuộc tab không migrate. Vế "xem lại khi UC-012 được đưa vào làm" là việc để sau, loại nội dung GX-12 cho giữ trong `Ghi chú`. Không có quyết định nào cho bỏ vế này | thấp | Thêm "2. Xem lại BR-015 khi UC-012 được đưa vào làm." |
| 6 | BR-016 | Ghi chú (bỏ Ghi chú 2) | "Hiện chỉ gắn UC-022 và R-016; xem lại theo OR-045 khi UC-022 được đưa vào làm." | — (bỏ cả câu) | thiếu ý: như dòng 5 | thấp | Thêm "2. Xem lại BR-016 khi UC-022 được đưa vào làm." (có thể gộp với `Câu hỏi mở` 1, nơi xử lý cũng là UC-022) |
| 7 | BR-017 | Ghi chú (bỏ Ghi chú 1, xóa section) | "Hiện chỉ gắn UC-017 và R-047; xem lại theo OR-045 khi UC-017 được đưa vào làm." | — (bỏ, xóa section `Ghi chú`) | thiếu ý: như dòng 5 | thấp | Thêm section `Ghi chú`: "1. Xem lại BR-017 khi UC-017 được đưa vào làm." |

## Đối chiếu BR-010 (không tính vào số chỗ bị đánh dấu)

Ngoài dòng 3 và 4 ở trên, mỗi mệnh đề Rule và mỗi dòng của `Bảng chuyển trạng thái` đều truy được về nguồn được phép:

| Câu mới | Căn cứ |
|---|---|
| Mệnh đề 1, 2 | Rule 1, 2 của sheet. Bỏ "ngay" ở mệnh đề 1 không đổi nghĩa: mệnh đề vẫn không có bước người dùng giữ xen vào |
| Mệnh đề 3, 4, 5 | Rule 3a, 3b, 3c của sheet |
| Mệnh đề 6 | Rule 4 câu 3 của sheet; vế "khi yêu cầu không bị từ chối" lấy từ D-030 câu 4. Mệnh đề áp cho mọi yêu cầu sửa mới, không chỉ khi có bản chờ duyệt. Phạm vi này truy được về UC-004 bước 2' và các nhánh 3A, 3B, 4A của sheet ("bản đã chấp nhận tại bước 2' nếu bước đó đã xảy ra"), cùng BLK-035 (bước "Hệ thống đạt ranh giới commit" ở luồng chính UC-004). Người dùng chưa trả lời riêng điểm này (Không áp rõ 3 của log không nằm trong CX-4 … CX-8) |
| Mệnh đề 7, 8, 9, 10 | Rule 4 câu 1, 2, 3 của sheet; D-030 câu 1, 2, 5 |
| Mệnh đề 11, 12, 13 | Rule 5 của sheet; D-030 câu 6, 7. Bỏ trình tự "theo thứ tự … sau đó" (GBR-04) nhưng không mất ý: mệnh đề 11 cho tập ràng buộc của bản đã chấp nhận là tập ràng buộc của bản chờ duyệt, nên khi mệnh đề 13 đưa tập ràng buộc về bản tại ranh giới commit, ràng buộc của yêu cầu mới không còn |
| Mệnh đề 14 | BR-014 Rule 2 của sheet (BLK-035) |
| Mệnh đề 15 | Rule của BR-005 trong sheet (CX-1). Vế "khôi phục" khi lượt sửa lỗi nằm ở mệnh đề 13; vế "người dùng bỏ bản chờ duyệt" nằm ở mệnh đề 17, 18. Đọc "giữ" thành "không làm mất" theo BLK-035 ("khi tải về thất bại áp BR-010 mục 6") |
| Mệnh đề 16 | Rule 6 của sheet |
| Mệnh đề 17, 18 | Rule 7 của sheet |
| Mệnh đề 19, 20, 21 | Rule 8 của sheet. "Chỉ bắt buộc giữ một bản" được tách thành mệnh đề 19 cộng mệnh đề 21, cùng nghĩa |
| Mệnh đề 22–25 | Ô Quyết định BLK-054, đúng chữ cả câu thông báo |
| Dòng bảng: lượt tạo qua / không qua kiểm tra kết quả | Rule 1 của sheet ("thành công"); UC-001 5A, UC-002 6A của sheet ("không hiển thị deck"); BLK-059 (kết quả không qua kiểm tra kết quả thì không thành bản chờ duyệt hay bản đã chấp nhận) |
| Dòng bảng: dừng hoặc lỗi | BR-014 mục 2, Rule 5 của sheet; UC-001 4A, 4B, UC-002 5B, 5C, UC-004 3A, 3B, UC-014 2A của sheet. Các nhánh 4C, 5D, 4A–4C trong file mới được tách theo BLK-047 |
| Dòng bảng: gửi yêu cầu sửa mới (còn bước / bị từ chối / không còn bước), Chờ hoàn tất × hoàn tất / hủy / từ chối | Rule 3b, 4, 5, 8 của sheet; D-030; UC-004 2A, 2B, 2C, 2' của sheet |
| Dòng bảng: giữ, bỏ, tải về khi có bản chờ duyệt | Rule 3a, 3c, 6, 7 của sheet; BR-005 của sheet; UC-008 3A, 4A, UC-013 của sheet |
| Dòng bảng: thử giữ, bỏ, tải về khi chờ hoàn tất hoặc khi lượt đang chạy (6 dòng) | Ô Quyết định BLK-054 ("khi lượt xử lý AI đang chạy" gồm cả lượt tạo) |
| Dòng bảng: "Chỉ có bản đã chấp nhận × tải về thành công → Không đổi" | Suy ra từ Rule 3c của sheet (chỉ áp cho bản chờ duyệt); không thêm hành vi |
| `Ghi chú` 3, 4 | Exceptions 1 và Ghi chú 1 của BR-005 trong sheet (CX-1) |
| `source` thêm "DOC-001 NFR-R01", "DOC-001 NFR-R04"; `use_cases` thêm UC-014 | CX-1 (phần "Sửa của agent chính" trong log) |
| Dòng UC-024 đã bỏ khỏi bảng, UC-024 đã bỏ khỏi `use_cases` | CX-8 |

## Ghi chú của người kiểm (không tính vào số chỗ bị đánh dấu)

1. BR-003: mệnh đề 7, 8 và `Bảng quyết định` khớp CX-4 (`APPLY.md` mục 8). Mệnh đề 7 ("dùng ràng buộc chỉ áp cho một lần sửa trong lượt sửa đó") là cách đọc chữ "chỉ áp cho lượt đó" của CX-4, khớp phương án (a) mà log đã đề xuất. Đọc riêng thì mệnh đề 8 ("không được thay ràng buộc còn hiệu lực") có vẻ trái với mệnh đề 7. Nên thêm "sau lượt sửa đó" hoặc "trong các lần sửa sau" vào mệnh đề 8 cho rõ; nghĩa không đổi. Bốn dòng của bảng suy ra đúng từ các mệnh đề đã dẫn. Tổ hợp "cùng loại, không xung đột" không có trong bảng, và sheet hay BLK-043 cũng không nói tới tổ hợp này. Đây là chỗ thiếu tổ hợp, không phải đổi nghĩa. Log chỉ ghi phần sửa theo CX-4 ở mức tóm tắt, không có bảng câu gốc → câu mới cho mệnh đề 5, 7, 8 (ghi nhận theo bước 4 của brief; nghĩa giữ).
2. BR-003 Exceptions 2, 3, 4 tóm tắt Rule 4, 7, 5 của BR-010 trong sheet, kèm ID (GX-10). BR-003 Rule 2 (6 loại ràng buộc), Rule 3, 4, 5, 6 khớp ô Quyết định BLK-043.
3. Các thay đổi đã đối chiếu và có căn cứ: BR-001 Rule 3 (BLK-055); BR-004 `Câu hỏi mở` (BLK-012); BR-006 Exceptions (BLK-002); BR-007 thêm D-031 và 4 định dạng (`APPLY.md` mục 2); BR-012 Rule 1 và Ghi chú (BLK-056); BR-014 Rule 2 (BLK-035); BR-016 `Câu hỏi mở` (BLK-013); BR-017 bỏ L-002 khỏi `source` (BLK-062); "DeckAgent" → "hệ thống" ở BR-012, BR-015, BR-018 (BLK-068).
4. BR-011 Rule 1 thêm vế "Khi yêu cầu sửa nhắm vào một slide". Vế này truy được về tên ngắn của chính BR-011 trong sheet ("Sửa theo slide …"), D-025 mục 3 và UC-004 2B của sheet. Không đổi nghĩa.
5. BR-013 đổi `short_name` từ "Không giả vờ làm được" sang "Báo giới hạn khi chưa làm được yêu cầu", cùng nghĩa với Rule. Căn cứ trong log là PLAN.md và GBR-11 (Draft).
6. Các vế bị bỏ được ghi nhận và không đánh dấu: BR-006 Ghi chú 1 (lịch sử status, GX-12; status nằm ở frontmatter); BR-008 "Không có ngoại lệ trong luồng thông thường" (bỏ cùng section Exceptions; file không có Exceptions nên vẫn nói đúng ý này); BR-007 Exceptions chuyển sang Ghi chú 1. Lúc này không định dạng nào trong D-031 cần độ giống hình ảnh cao hơn, nên hành vi không đổi.
7. Quan hệ thêm vào `use_cases` của BR-013 (UC-007) và BR-014 (UC-011) truy được về chữ của sheet: UC-007 2B "Hệ thống báo giới hạn và bỏ qua phần đó" là hành vi của BR-013; UC-011 1A "yêu cầu chờ hoặc dừng lượt xử lý trước" trùng Ghi chú 1 của BR-014.
8. Chỗ thiếu của `Bảng chuyển trạng thái` BR-010 (về độ đầy đủ, không phải đổi nghĩa; để người dùng cân nhắc): "Chỉ có bản đã chấp nhận × người dùng bỏ bản chờ duyệt" (UC-013 1A: báo không còn lần sửa nào để bỏ); "Lượt tạo deck đang chạy × người dùng hủy khi AI hỏi lại" (UC-002 5E, BLK-053). Dòng "Chưa có deck × lượt tạo bắt đầu" dẫn mệnh đề 1, 14, nhưng hai mệnh đề này không nói về việc bắt đầu lượt.
9. Mọi câu viết lại khác trong 17 file đều có dòng tương ứng trong rewrite log, gộp theo bảng, theo mục "Chuyển chỗ" hoặc theo quy ước chung.
