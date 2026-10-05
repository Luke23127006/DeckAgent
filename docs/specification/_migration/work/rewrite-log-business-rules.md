# Rewrite log: business-rules (Pha B, bước B4)

Item đã viết (17): BR-001, BR-002, BR-003, BR-004, BR-006, BR-007, BR-008, BR-009, BR-010, BR-011, BR-012, BR-013, BR-014, BR-015, BR-016, BR-017, BR-018. BR-005 đã xóa (CX-1, `APPLY.md` mục 5), không có file.

## Quy ước áp chung

1. Rule viết thành mệnh đề đánh số, mỗi mệnh đề tự đứng được (GBR-03), có chủ thể "hệ thống" (GX-16) và dạng "Khi …, hệ thống phải / không được …" (GBR-02).
2. "DeckAgent" ngoài câu `Yêu cầu` đổi thành "hệ thống" (BLK-068), kể cả item Draft BR-018 (theo quy ước 2 của `rewrite-log-use-cases.md`).
3. Section trống không thuộc `FILL_LATER.md` thì xóa theo template: `Bảng quyết định` (cả 17 item; không item nào có ≥ 3 điều kiện kết hợp ngoài phần trạng thái của BR-010), `Bảng chuyển trạng thái` (trừ BR-010), `Exceptions` (BR-001, BR-002, BR-007, BR-008, BR-009, BR-010, BR-013, BR-014, BR-015, BR-016), `Câu hỏi mở` (trừ BR-004, BR-016), `Ghi chú` (BR-002, BR-017).
4. `FILL_LATER.md` mục business-rules chỉ có gợi ý phụ thuộc phương án B/C của blocker. Quyết định chọn A cho BLK-043, BLK-035, BLK-054 nên dòng của BR-003, BR-005, BR-010 không áp; dòng của BR-004 (BLK-012 chọn C) và BR-016 (BLK-013 chọn C) thành `Câu hỏi mở` theo đúng chữ ô Quyết định.
5. ID đã xóa không xuất hiện trong file item. Nội dung của BR-005 nằm ở BR-010 (CX-1); bảng chuyển trạng thái dẫn căn cứ bằng số mệnh đề của BR-010 và nhánh Use Case, không dẫn BR-005.
6. Nơi xử lý của câu hỏi mở viết "(nơi xử lý: <ID>)" theo dạng của BLK-063.

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| BR-001 | Rule 1, 2 | Khi người dùng đưa file vào, hệ thống phải xác định vai trò của file (tài liệu có sẵn, deck có sẵn, deck mẫu, hình ảnh để chèn) theo mục đích trong yêu cầu; đuôi file chỉ giới hạn khả năng kỹ thuật, không quyết định vai trò. | 1. Khi người dùng đưa file vào, hệ thống phải xác định vai trò của file (…) theo mục đích trong yêu cầu. 2. Khi xác định vai trò của file, hệ thống không được quyết định vai trò theo đuôi file; đuôi file chỉ giới hạn khả năng kỹ thuật. | GBR-03, GBR-02, GX-14 |
| BR-001 | Exceptions 1 → Rule 3 | V1 chỉ nhận vai trò tài liệu có sẵn; giới hạn này phải được công bố, không gán ngầm. | Khi người dùng đưa file với mục đích khác tài liệu có sẵn, hệ thống phải báo rằng V1 chỉ nhận vai trò tài liệu có sẵn (BR-013) và không được tự coi file đó là tài liệu có sẵn. | BLK-055 (P2), đúng chữ ô Quyết định; xóa section Exceptions |
| BR-001 | Ghi chú 1 | R-004 mô tả hành vi; rule này giữ nguyên tắc chung cho mọi luồng có file. | R-004 mô tả hành vi xác định vai trò của file; BR-001 giữ nguyên tắc chung cho mọi luồng có file. | GX-17 ("rule này"), BLK-033 (BR sở hữu quy tắc, R giữ hành vi) |
| BR-002 | Rule 1 | Khi nội dung deck lấy từ tài liệu có sẵn, facts, số liệu, ý nghĩa và trích dẫn phải giữ đúng với tài liệu. | Khi nội dung deck lấy từ tài liệu có sẵn, hệ thống phải giữ facts, số liệu, ý nghĩa và trích dẫn đúng với tài liệu có sẵn. | GX-16, GBR-02, GX-07 |
| BR-002 | Rule 2 | Nội dung do AI bổ sung không được trình bày như lấy từ tài liệu. | Hệ thống không được trình bày nội dung do AI bổ sung như nội dung lấy từ tài liệu có sẵn. | GX-16, GBR-02 |
| BR-002 | Exceptions 1 → Rule 3 | AI được bổ sung nội dung không có trong tài liệu nếu phân biệt được với nội dung từ tài liệu. | Khi tạo deck từ tài liệu có sẵn, AI được bổ sung nội dung không có trong tài liệu có sẵn nếu nội dung bổ sung phân biệt được với nội dung lấy từ tài liệu có sẵn. | GBR-06, GBR-03, PLAN.md mục 4 (quyền bổ sung, không phải ngoại lệ) |
| BR-003 | Rule 1 | Khi người dùng đã nêu ràng buộc (audience, ngôn ngữ, độ dài, mục đích), hệ thống phải tiếp tục áp dụng qua các lần sửa cho tới khi người dùng đổi, thay thế hoặc hủy. | Khi người dùng đã nêu ràng buộc của người dùng, hệ thống phải tiếp tục áp dụng ràng buộc đó qua các lần sửa cho tới khi người dùng đổi, thay thế hoặc hủy ràng buộc đó. | GX-07, GX-17 (thêm tân ngữ), GBR-09; danh sách loại chuyển sang Rule 2 |
| BR-003 | Rule 2 | (audience, ngôn ngữ, độ dài, mục đích) | Ràng buộc của người dùng gồm 6 loại: ngôn ngữ, độ dài (số slide), audience, mục đích, giọng văn, yêu cầu riêng. | BLK-043 (P2), danh sách đúng ô Quyết định |
| BR-003 | Exceptions 1 → Rule 3, 4 | Ràng buộc chỉ dành cho một lần sửa thì hết hiệu lực sau lần sửa đó; cách phân biệt sẽ được định nghĩa sau. | 3. Khi yêu cầu sửa có cụm "chỉ lần này", "lần này thôi" hoặc cụm tương đương, hệ thống phải chỉ áp dụng ràng buộc của người dùng nêu trong yêu cầu đó cho một lần sửa. 4. Khi lượt sửa có ràng buộc chỉ áp cho một lần sửa kết thúc, hệ thống không được tiếp tục áp dụng ràng buộc đó. | BLK-043 (P2), GX-09 (bỏ "định nghĩa sau"), GBR-03 |
| BR-003 | Rule 5, 6 | — (thêm mới) | 5. Khi người dùng nêu ràng buộc mới cùng loại và xung đột với ràng buộc còn hiệu lực, hệ thống phải dùng ràng buộc mới thay ràng buộc cũ. 6. Khi người dùng nêu ràng buộc mới khác loại với ràng buộc còn hiệu lực, hệ thống không được dùng ràng buộc mới thay ràng buộc cũ. | BLK-043 (P2) |
| BR-003 | Exceptions 1 | — (thêm mới) | Ràng buộc của người dùng chỉ áp cho một lần sửa (mệnh đề 3, 4). | GBR-06, BLK-043 |
| BR-003 | Exceptions 2, 3, 4 | — (thêm mới) | 2. Ràng buộc nêu trong yêu cầu sửa bị hủy hoặc bị từ chối trước ranh giới commit không được giữ lại (BR-010). 3. Bỏ bản chờ duyệt thì ràng buộc nêu trong yêu cầu sửa tạo ra bản đó bị hủy (BR-010). 4. Lượt sửa bị dừng, lỗi hoặc không qua kiểm tra kết quả thì tập ràng buộc về theo bản đã chấp nhận tại ranh giới commit (BR-010). | PLAN.md mục 4 (2 trường hợp đầu), GX-10 (tóm tắt kèm ID); trường hợp 4 thêm cho đủ GBR-06, tóm tắt BR-010 mệnh đề 13 |
| BR-003 | Ghi chú 1 | Thiếu quy tắc thời hạn rõ ràng có thể làm hệ thống vừa quên ràng buộc cũ vừa giữ ràng buộc quá lâu. | Thiếu quy tắc thời hạn thì hệ thống có thể vừa quên ràng buộc cũ vừa giữ ràng buộc quá lâu; mệnh đề 3, 4 đặt quy tắc thời hạn cho ràng buộc của người dùng. | BLK-043 (quy tắc thời hạn nay đã có), GX-12 |
| BR-004 | Exceptions 1 | Yêu cầu trau chuốt hoặc thiết kế lại cả deck được thay đổi rộng vì chính người dùng yêu cầu. | Khi người dùng yêu cầu trau chuốt hoặc thiết kế lại cả deck, hệ thống được thay đổi rộng vì chính người dùng yêu cầu. | GX-16 |
| BR-004 | Câu hỏi mở 1 | — (thêm mới) | Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết? (nơi xử lý: UC-023) | BLK-012 (P2, chọn C); Rule giữ nguyên câu "trừ khi việc đó cần thiết và đã được người dùng xác nhận" |
| BR-004 | Ghi chú 1 | Áp dụng khi có UC-023 (sửa cục bộ). | BR-004 áp dụng khi hệ thống có UC-023 (sửa cục bộ). | GX-16 |
| BR-006 | Rule 1, 2 | Khi người dùng tải deck về, file phải được tạo từ đúng bản người dùng đang xem trước; hệ thống không được để AI tạo lại deck có nội dung hoặc ý nghĩa khác. | 1. Khi người dùng tải deck về, hệ thống phải tạo file từ đúng bản người dùng đang xem trước. 2. Khi người dùng tải deck về, hệ thống không được để AI tạo lại deck có nội dung hoặc ý nghĩa khác bản người dùng đang xem trước. | GBR-03, GX-16 |
| BR-006 | Exceptions 1 | Định dạng đích được làm mất phần nó không thể hiện được, nếu phần đó nằm trong giới hạn đã biết của định dạng (BR-013). | Khi định dạng đích không thể hiện được một phần deck, file tải về được thiếu phần đó nếu hệ thống đã báo phần đó cho người dùng theo BR-013. | BLK-002 (P2), đúng chữ ô Quyết định; áp cho 4 định dạng (APPLY.md mục 2) |
| BR-006 | Ghi chú 1 | Status đổi từ Proposed sang Active ngày 27/09/2026 vì R-020 và D-026 đang Active. | — (bỏ) | GX-12 (lịch sử status), PLAN.md mục 4 |
| BR-006 | Ghi chú 2 → 1 | Đổi ngày 27/09/2026: tải về từ bản đang xem trước (có thể là bản chờ duyệt) thay vì chỉ từ bản đã chấp nhận; xem BR-010. | Bản người dùng đang xem trước có thể là bản chờ duyệt, không chỉ bản đã chấp nhận; trạng thái của bản đó sau khi tải về theo BR-010. | GX-12 (bỏ lịch sử đổi), GX-18, PLAN.md mục 4 |
| BR-007 | Rule 1, 2 | Khi cùng một deck được tải về nhiều định dạng, các file phải giữ cùng facts, số liệu, thứ tự trình bày và ý nghĩa; không bắt buộc giống nhau về pixel, font, khả năng sửa, tương tác hoặc animation. | 1. Khi cùng một deck được tải về nhiều định dạng của D-031 (PPTX, PDF, PNG, SVG), hệ thống phải giữ cùng facts, số liệu, thứ tự trình bày và ý nghĩa giữa các file tải về. 2. Khi … (cùng điều kiện), hệ thống không bắt buộc giữ các file tải về giống nhau về pixel, font, khả năng sửa, tương tác hoặc animation. | APPLY.md mục 2 (thêm D-031, 4 định dạng), GX-16, GBR-03; giữ đủ 5 thứ cho Ghi chú của C-004 |
| BR-007 | Exceptions 1 → Ghi chú 1 | Định dạng hoặc use case cần độ giống hình ảnh cao hơn sẽ có quy tắc riêng. | Định dạng tải về hoặc Use Case cần độ giống hình ảnh cao hơn sẽ có quy tắc riêng, ngoài BR-007. | GBR-06 (không phải ngoại lệ hiện có), GX-12 (việc để sau), GX-07 ("Use Case") |
| BR-007 | Ghi chú 1 → 2 | Tránh tiêu chí không thể đạt kiểu “mọi định dạng phải giống hệt nhau”. | BR-007 tránh tiêu chí không thể đạt kiểu “mọi định dạng phải giống hệt nhau”. | GX-16 |
| BR-008 | Rule 1, 2 | Khi AI đọc tài liệu có sẵn, file hoặc link bên ngoài, hệ thống phải coi nội dung đó là dữ liệu; nội dung đó không được thay đổi hành vi hệ thống hay quyền của AI. | 1. Khi AI đọc …, hệ thống phải coi nội dung đọc được là dữ liệu. 2. Khi AI đọc …, hệ thống không được để nội dung đọc được thay đổi hành vi của hệ thống hay quyền của AI. | GBR-03, GX-16, GBR-02, PLAN.md mục 4 |
| BR-008 | Exceptions 1 → Ghi chú 1 | Không có ngoại lệ trong luồng thông thường; tài liệu nội bộ được tin cậy (nếu có sau này) phải được phân loại bằng cơ chế riêng. | Tài liệu nội bộ được tin cậy (nếu có sau này) phải được phân loại bằng cơ chế riêng, ngoài BR-008. | GBR-06, GX-12, PLAN.md mục 4; vế "Không có ngoại lệ…" bỏ vì section Exceptions bị xóa |
| BR-009 | Rule 1 | Mỗi deck chỉ dùng một tài liệu có sẵn. | Hệ thống chỉ được dùng một tài liệu có sẵn cho mỗi deck. | GX-16, GBR-02 |
| BR-009 | Rule 2 | PPTX dùng làm tài liệu có sẵn chỉ được lấy nội dung, không giữ bố cục; giữ bố cục thuộc UC-003. | Khi người dùng đưa PPTX làm tài liệu có sẵn, hệ thống chỉ được lấy nội dung, không được giữ bố cục. | GBR-02, GX-16, PLAN.md mục 4 |
| BR-009 | Rule 2 → Ghi chú 1 | giữ bố cục thuộc UC-003 | Giữ bố cục của PPTX thuộc UC-003. | GX-12, PLAN.md mục 4 |
| BR-009 | Ghi chú 1 → 2 | Nhiều tài liệu cho một deck là câu hỏi ở L-001. | Kết luận về việc dùng nhiều tài liệu có sẵn cho một deck nằm ở D-024. | BLK-062 (P8: kết luận của L-001 nằm ở D-024), cùng cách agent chính sửa UC-017 Ghi chú 1 |
| BR-010 | Rule 1 | Khi AI tạo deck lần đầu thành công, deck đó trở thành bản đã chấp nhận ngay. | Khi AI tạo deck lần đầu thành công, hệ thống phải coi deck đó là bản đã chấp nhận. | GBR-02, GX-16, GX-08 ("ngay") |
| BR-010 | Rule 2 | Khi AI sửa deck, kết quả là bản chờ duyệt. | Khi AI sửa deck, hệ thống phải coi kết quả sửa là bản chờ duyệt. | GBR-02, GX-16 |
| BR-010 | Rule 3, 4, 5 | 3. Bản chờ duyệt trở thành bản đã chấp nhận khi: a. người dùng giữ bản đó; b. một yêu cầu sửa mới đạt ranh giới commit ngay trước khi lượt xử lý AI mới bắt đầu; c. hoặc file tải về từ bản đó được tạo thành công và giao cho người dùng. | 3. Khi người dùng giữ bản chờ duyệt, hệ thống phải chuyển bản chờ duyệt đó thành bản đã chấp nhận. 4. Khi một yêu cầu sửa mới đạt ranh giới commit trong lúc có bản chờ duyệt, … 5. Khi file tải về từ bản chờ duyệt được tạo thành công và giao cho người dùng, … | GBR-03 (một câu ba vế a/b/c), GBR-02; vế "ngay trước khi lượt xử lý AI mới bắt đầu" chuyển sang mệnh đề 6 |
| BR-010 | Rule 6–10 | 4. Với trường hợp 3b, nếu yêu cầu sửa mới còn cần hỏi lại, cảnh báo hoặc xác nhận, bản chờ duyệt hiện tại vẫn là bản chờ duyệt trong các bước đó. Nếu yêu cầu bị hủy hoặc bị từ chối trước ranh giới commit, bản chờ duyệt không trở thành bản đã chấp nhận và ràng buộc của yêu cầu mới không được giữ lại. Nếu không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất, ranh giới commit đạt ngay trước khi lượt xử lý AI bắt đầu; hệ thống không thêm bước xác nhận riêng. | 6. Ranh giới commit của một yêu cầu sửa mới đạt ngay trước khi lượt xử lý AI cho yêu cầu đó bắt đầu, khi yêu cầu không bị từ chối và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất. 7. Khi yêu cầu sửa mới còn bước … cần hoàn tất, hệ thống phải giữ bản chờ duyệt hiện tại là bản chờ duyệt. 8. Khi yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, hệ thống phải giữ bản chờ duyệt hiện tại là bản chờ duyệt. 9. … hệ thống không được giữ lại ràng buộc của người dùng nêu trong yêu cầu đó. 10. Hệ thống không được thêm bước xác nhận riêng để đạt ranh giới commit. | GBR-03 (bỏ phụ thuộc "Với trường hợp 3b"), GBR-02, GX-07; vế "khi yêu cầu không bị từ chối" lấy từ D-030 (BLK-034); mệnh đề 6 áp cho mọi yêu cầu sửa mới theo BLK-035 (UC-004 bước 3), xem Không áp rõ 3 |
| BR-010 | Rule 11, 12, 13 | 5. Tại ranh giới commit của 3b, theo thứ tự: bản chờ duyệt hiện tại trở thành bản đã chấp nhận; ràng buộc của nó trở thành tập ràng buộc của bản đã chấp nhận; ràng buộc của yêu cầu mới được áp dụng; sau đó lượt xử lý AI bắt đầu. Nếu lượt này bị dừng, lỗi hoặc không qua kiểm tra, deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit, không quay về bản cũ hơn. | 11. Khi yêu cầu sửa mới đạt ranh giới commit trong lúc có bản chờ duyệt, hệ thống phải lấy tập ràng buộc của bản chờ duyệt đó làm tập ràng buộc của bản đã chấp nhận. 12. Khi yêu cầu sửa mới đạt ranh giới commit, hệ thống phải áp dụng ràng buộc của người dùng nêu trong yêu cầu đó cho lượt xử lý AI bắt đầu sau ranh giới commit. 13. Khi lượt xử lý AI sửa deck bị dừng, lỗi hoặc không qua kiểm tra kết quả, hệ thống phải đưa deck và tập ràng buộc về bản đã chấp nhận tại ranh giới commit của lượt đó, không về bản cũ hơn. | GBR-04 (bỏ trình tự "theo thứ tự … sau đó"), GX-17 ("của nó", "lượt này"), GX-07 ("kiểm tra kết quả"); vế "bản chờ duyệt trở thành bản đã chấp nhận" đã ở mệnh đề 4. Không thêm vế "không gồm ràng buộc của yêu cầu mới" của bản dịch thử (suy luận, không có chữ trong sheet) |
| BR-010 | Rule 14 | (BR-014 Rule 2) Lượt xử lý bị dừng hoặc lỗi không tạo bản mới. | Khi lượt xử lý AI tạo hoặc sửa deck bị dừng hoặc lỗi, hệ thống không được tạo bản mới. | BLK-035 (BR-010 sở hữu vòng đời; BR-014 mục 2 rút về tóm tắt), GBR-02, GX-07 |
| BR-010 | Rule 15 | (BR-005 Rule) Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, hệ thống phải giữ hoặc khôi phục bản đã chấp nhận gần nhất. | Khi lượt tạo, sửa hoặc tải về thất bại, hệ thống phải giữ bản đã chấp nhận gần nhất. | CX-1, BLK-035 (đọc "giữ" là không làm mất; khi tải về thất bại áp mệnh đề 16); vế "người dùng bỏ bản chờ duyệt … khôi phục" đã có ở mệnh đề 17, vế "khôi phục" khi lượt sửa lỗi đã có ở mệnh đề 13 |
| BR-010 | Rule 16 | 6. Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt. | Khi lượt tải về từ bản chờ duyệt bị hủy hoặc thất bại, hệ thống phải giữ bản chờ duyệt đó là bản chờ duyệt. | GBR-02, GX-16 |
| BR-010 | Rule 17, 18 | 7. Khi người dùng bỏ bản chờ duyệt, deck quay về bản đã chấp nhận làm cơ sở cho lần sửa đó, và ràng buộc mới nêu trong yêu cầu dẫn tới bản chờ duyệt cũng bị hủy. | 17. Khi người dùng bỏ bản chờ duyệt, hệ thống phải đưa deck về bản đã chấp nhận làm cơ sở cho lần sửa tạo ra bản chờ duyệt đó. 18. Khi người dùng bỏ bản chờ duyệt, hệ thống phải hủy ràng buộc của người dùng nêu trong yêu cầu sửa tạo ra bản chờ duyệt đó. | GBR-03, GX-16, GX-07 |
| BR-010 | Rule 19, 20, 21 | 8. Hệ thống chỉ bắt buộc giữ một bản đã chấp nhận làm cơ sở khôi phục cho bản chờ duyệt hoặc lượt xử lý đang chạy. Khi một bản chờ duyệt được chấp nhận để làm cơ sở cho lượt sửa mới, bản đó trở thành cơ sở khôi phục hiện tại; hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn để khôi phục nhiều bước. | 19. Khi có bản chờ duyệt hoặc lượt xử lý AI đang chạy, hệ thống phải giữ một bản đã chấp nhận làm cơ sở khôi phục. 20. Khi bản chờ duyệt được chấp nhận tại ranh giới commit, hệ thống phải dùng bản vừa được chấp nhận làm cơ sở khôi phục hiện tại. 21. Hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn cơ sở khôi phục hiện tại để khôi phục nhiều bước. | GBR-03, GX-17 ("bản đó"); "chỉ bắt buộc giữ một bản" viết thành mệnh đề 19 cộng 21, cùng nghĩa |
| BR-010 | Rule 22–25 | — (thêm mới) | 22, 23. Khi yêu cầu sửa mới còn bước hỏi lại, cảnh báo hoặc xác nhận cần hoàn tất / khi lượt xử lý AI đang chạy, hệ thống không được cho người dùng giữ bản chờ duyệt, bỏ bản chờ duyệt hay tải về. 24, 25. Khi người dùng thử giữ, bỏ hay tải về trong hai lúc đó, hệ thống phải báo "Đang xử lý yêu cầu, hãy chờ hoặc dừng lượt hiện tại" và giữ nguyên trạng thái. | BLK-054 (P2, P6), đúng 4 ô và câu thông báo của ô Quyết định; tách theo điều kiện cho GBR-03 |
| BR-010 | Bảng chuyển trạng thái | — (thêm mới) | Bảng 27 dòng; mỗi dòng ghi số mệnh đề Rule và nhánh Use Case làm căn cứ. | GBR-05, BLK-035; dòng theo mục "Kiểm nhánh Use Case trỏ BR-010" dưới đây |
| BR-010 | Exceptions 1 → Ghi chú 2 | Xem và khôi phục nhiều bản cũ thuộc UC-022. | Xem và khôi phục nhiều bản cũ thuộc UC-022, ngoài BR-010. | GBR-06 (giới hạn phạm vi, không phải ngoại lệ), GX-12, PLAN.md mục 5 |
| BR-010 | Ghi chú 1 | — (thêm mới) | Tên trạng thái trong `Bảng chuyển trạng thái` là nhãn đặt cho các tình huống mà Rule mô tả, không phải khái niệm mới. | GX-12 (lưu ý khi đọc), PLAN.md mục 5 thay đổi 12 |
| BR-011 | Rule 1 | Hệ thống phải báo trước rằng việc sửa là cố gắng, không đảm bảo và các slide khác có thể bị thay đổi, trước khi người dùng quyết định có tiếp tục lượt sửa hay không. | Khi yêu cầu sửa nhắm vào một slide, hệ thống phải báo rằng việc sửa là cố gắng, không đảm bảo và các slide khác có thể bị thay đổi, trước khi người dùng quyết định có tiếp tục lượt sửa hay không. | GBR-02 (vế "Khi" lấy từ `short_name` và UC-004 2B, PLAN.md mục 4); bỏ "trước" thứ nhất vì trùng "trước khi" |
| BR-011 | Exceptions 1 | Không áp dụng khi đã có UC-023 (sửa cục bộ). | BR-011 không áp dụng khi hệ thống đã có UC-023 (sửa cục bộ). | GX-16 |
| BR-011 | Ghi chú 1 | Mục đích: không ngầm hứa chỉ sửa đúng một slide. | BR-011 nhằm để hệ thống không ngầm hứa chỉ sửa đúng một slide. | GX-16 |
| BR-012 | Rule 1 | Deck, tài liệu có sẵn và ràng buộc của người dùng chỉ tồn tại trong lần làm việc hiện tại. | Hệ thống không bắt buộc giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc. | BLK-056 (P2), đúng chữ ô Quyết định |
| BR-012 | Rule 2 | Trước khi một hành động làm mất deck chưa tải về, hệ thống phải cảnh báo và cho người dùng hủy. | Trước khi một hành động làm mất deck chưa tải về, hệ thống phải cảnh báo và cho người dùng hủy hành động đó. | GX-17 (thêm tân ngữ) |
| BR-012 | Exceptions 1 | Hết hiệu lực khi DeckAgent lưu được deck qua nhiều lần làm việc (R-048). | Khi hệ thống lưu được deck qua nhiều lần làm việc (R-048), BR-012 hết hiệu lực. | BLK-068, GX-16 |
| BR-012 | Ghi chú 1 | — (thêm mới) | Mệnh đề 1 là giới hạn phạm vi, không phải lệnh cấm lưu. | BLK-056 (P2: "Đây là giới hạn phạm vi, không phải lệnh cấm lưu") |
| BR-013 | `short_name` | Không giả vờ làm được | Báo giới hạn khi chưa làm được yêu cầu | GBR-11, PLAN.md mục 4 (tên đề xuất) |
| BR-013 | Rule 1, 2 | Khi người dùng yêu cầu điều hệ thống chưa làm được (loại file, loại sửa, thành phần không giữ được khi tải về), hệ thống phải báo giới hạn thay vì bỏ qua âm thầm hoặc trả kết quả sai. | 1. Khi … (giữ nguyên điều kiện và danh sách), hệ thống phải báo giới hạn cho người dùng. 2. Khi … (cùng điều kiện), hệ thống không được bỏ qua âm thầm hoặc trả kết quả sai. | GBR-03, PLAN.md mục 4 |
| BR-013 | Ghi chú 1 | Áp dụng cho mọi luồng tạo, sửa và tải về. | BR-013 áp dụng cho mọi luồng tạo, sửa và tải về. | GX-16 |
| BR-014 | Rule 1 | Mỗi lần làm việc chỉ có một lượt xử lý AI tạo hoặc sửa deck chạy tại một thời điểm. | Hệ thống không được chạy đồng thời hai lượt xử lý AI tạo hoặc sửa deck trong cùng một lần làm việc. | GBR-02, GX-16, PLAN.md mục 4 |
| BR-014 | Rule 2 | Lượt xử lý bị dừng hoặc lỗi không tạo bản mới. | Trạng thái của bản deck khi lượt xử lý AI bị dừng hoặc lỗi do BR-010 quy định (tóm tắt: lượt bị dừng hoặc lỗi không tạo bản mới). | BLK-035 (rút về tóm tắt kèm ID BR-010), GX-10 |
| BR-015 | Rule 1, 2 | Khi người dùng dùng deck đã lưu làm điểm xuất phát, hệ thống phải tạo bản sao; sửa bản sao không được làm đổi deck gốc. | 1. Khi người dùng dùng deck đã lưu làm điểm xuất phát, hệ thống phải tạo bản sao của deck đã lưu. 2. Khi người dùng sửa bản sao tạo từ deck đã lưu, hệ thống không được làm đổi deck gốc. | GBR-03, GX-16, PLAN.md mục 4 |
| BR-015 | Ghi chú 1 | Áp dụng khi DeckAgent lưu deck qua nhiều lần làm việc. | BR-015 áp dụng khi hệ thống lưu deck qua nhiều lần làm việc. | BLK-068, GX-16 |
| BR-015 | Ghi chú 2 | Hiện chỉ gắn UC-012 và R-049; xem lại theo OR-045 khi UC-012 được đưa vào làm. | — (bỏ) | GX-12 (tóm tắt quan hệ, mã quy trình OR-045), PLAN.md mục 4 và mục 5 của assess |
| BR-016 | Rule 1, 2 | Khi người dùng khôi phục một bản cũ, hệ thống không được xóa các bản khác; bản bị thay vẫn nằm trong lịch sử, trong giới hạn lưu trữ. | 1. Khi người dùng khôi phục một bản cũ, hệ thống không được xóa các bản khác. 2. Khi người dùng khôi phục một bản cũ, hệ thống phải giữ bản bị thay trong lịch sử, trong giới hạn lưu trữ. | GBR-03, GX-16; vế "trong giới hạn lưu trữ" giữ nguyên theo BLK-013 |
| BR-016 | Câu hỏi mở 1 | — (thêm mới) | Giới hạn lưu trữ lịch sử là bao nhiêu, và bản nào bị loại khi vượt giới hạn? (nơi xử lý: UC-022) | BLK-013 (P2, chọn C), đúng chữ ô Quyết định |
| BR-016 | Ghi chú 1 | Áp dụng khi có lịch sử nhiều bản (UC-022). | BR-016 áp dụng khi hệ thống có lịch sử nhiều bản (UC-022). | GX-16 |
| BR-016 | Ghi chú 2 | Hiện chỉ gắn UC-022 và R-016; xem lại theo OR-045 khi UC-022 được đưa vào làm. | — (bỏ) | GX-12, PLAN.md mục 4 |
| BR-017 | Rule 1, 2 | Khi người dùng áp dụng theme, mọi slide phải dùng cùng theme, và theme phải giữ nguyên qua các lần sửa và khi tải về. | 1. Khi người dùng áp dụng theme, hệ thống phải dùng cùng theme cho mỗi slide của deck. 2. Khi người dùng đã áp dụng theme, hệ thống phải giữ nguyên theme qua các lần sửa và khi tải về. | GBR-03, GX-08 ("mọi slide" → "mỗi slide của deck"), GX-16 |
| BR-017 | Ghi chú 1 | Hiện chỉ gắn UC-017 và R-047; xem lại theo OR-045 khi UC-017 được đưa vào làm. | — (bỏ; xóa section) | GX-12, PLAN.md mục 4 |
| BR-018 | Rule 1 | Khi DeckAgent có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình. | Khi hệ thống có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình. | BLK-068 (Draft: chỉ đổi tên hệ thống) |
| BR-018 | Ghi chú 1 | Áp dụng khi DeckAgent có tài khoản. | Áp dụng khi hệ thống có tài khoản. | BLK-068 |

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| BR-005 (đã xóa) | Exceptions 1 "Cách khôi phục có thể khác nhau theo loại lượt xử lý; không bắt buộc cơ chế snapshot hay diff." | BR-010 `Ghi chú` 3 (CX-1) |
| BR-005 (đã xóa) | Ghi chú 1 "Không yêu cầu Undo nhiều bước." | BR-010 `Ghi chú` 4 (CX-1) |
| BR-004 | Rule (nguyên câu) | `Rule` 1 |
| BR-014 | Ghi chú 1 | `Ghi chú` 1 |
| BR-017 | Exceptions 1 | `Exceptions` 1 |
| BR-018 | Exceptions 1 | `Exceptions` 1 |

## Kiểm nhánh Use Case trỏ BR-010

Tìm "BR-010" trong `04-use-cases/`. Mỗi nhánh dưới đây có dòng trong `Bảng chuyển trạng thái` của BR-010, trừ chỗ ghi ở Không áp rõ.

| Use Case, chỗ trỏ | Dòng của bảng (trạng thái hiện tại × sự kiện) | Căn cứ trong nguồn cho phép |
|---|---|---|
| UC-001 4A, 4B, 4C; UC-002 5B, 5C, 5D | Lượt tạo deck đang chạy × dừng hoặc lỗi | BR-014 mục 2 (mệnh đề 14) |
| UC-001 5A, UC-002 6A (không ghi BR-010, brief yêu cầu kiểm) | Lượt tạo deck đang chạy × kết quả không qua kiểm tra kết quả | Rule 1 sheet (chỉ lần tạo thành công thành bản đã chấp nhận) |
| UC-001, UC-002 Postconditions 1 | Lượt tạo deck đang chạy × kết quả qua kiểm tra kết quả | Rule 1 sheet |
| UC-004 bước 3 | Chỉ có bản đã chấp nhận / Có bản chờ duyệt × gửi yêu cầu sửa mới không còn bước hỏi lại; Chờ hoàn tất × các bước hoàn tất | Rule 3b, 4, 5, 8 sheet; D-030 |
| UC-004 2D, 2E | Chờ hoàn tất yêu cầu sửa mới × hủy hoặc bị từ chối | Rule 4 sheet; D-030 |
| UC-004 2A, 2B, 2C (không ghi BR-010) | Gửi yêu cầu sửa mới × còn bước hỏi lại / bị từ chối | Rule 4 sheet; D-030 |
| UC-004 4A, 4B, 4C | Lượt sửa deck đang chạy × dừng hoặc lỗi | Rule 5 sheet; BR-014 mục 2 |
| UC-004 5A | Lượt sửa deck đang chạy × kết quả không qua kiểm tra kết quả | Rule 5 sheet |
| UC-004 Postconditions 2, 3 | Có bản chờ duyệt × gửi yêu cầu sửa mới; Lượt sửa deck đang chạy × kết quả qua kiểm tra | Rule 2, 5 sheet |
| UC-008 3B | Có bản chờ duyệt × lượt tải về bị hủy | Rule 6 sheet |
| UC-008 4A, 5A (không ghi BR-010) | Có bản chờ duyệt / Chỉ có bản đã chấp nhận × lượt tải về thất bại | Rule 6 sheet; BR-005 cũ (mệnh đề 15) |
| UC-008 6A, Postconditions 2, Bảo đảm tối thiểu 1 | Có bản chờ duyệt × file tải về được tạo thành công và giao | Rule 3c sheet |
| UC-013 Postconditions 2 | Có bản chờ duyệt × người dùng bỏ | Rule 7 sheet |
| UC-014 2A | Lượt tạo / Lượt sửa deck đang chạy × người dùng dừng | BR-014 mục 2; Rule 5 sheet |
| UC-022 4A | — | Không áp rõ 1 |
| UC-023 3B | Lượt sửa deck đang chạy × lượt lỗi | BR-005 cũ (mệnh đề 15), Rule 5 sheet |
| UC-024 2A | Chỉ có bản đã chấp nhận × thao tác slide hoặc hình ảnh thất bại | BR-005 cũ (mệnh đề 15); xem Không áp rõ 2 |
| BLK-054 (4 ô) | Chờ hoàn tất × thử giữ / bỏ / tải về; Lượt tạo, Lượt sửa deck đang chạy × thử giữ, bỏ, tải về | Ô Quyết định BLK-054 |

## Sửa quan hệ

1. BR-010 `use_cases` thêm UC-023 (nhánh 3B "Sửa thất bại: … bản đã chấp nhận giữ nguyên (BR-010)") và UC-024 (nhánh 2A "Thao tác thất bại: … bản đã chấp nhận giữ nguyên (BR-010)"). Hai nhánh này trước trỏ BR-005; CX-1 chuyển quan hệ sang BR-010.
2. BR-013 `use_cases` thêm UC-007 (nhánh 2B "Hệ thống báo giới hạn (BR-013) và bỏ qua phần đó").
3. BR-014 `use_cases` thêm UC-011 (nhánh 1A "Hệ thống yêu cầu chờ hoặc dừng lượt xử lý trước (UC-014, BR-014)").
4. Không thêm UC-008 vào BR-012: UC-008 chỉ trỏ BR-012 ở `Ghi chú` 3, không ở luồng (xem Không áp rõ 7).

## Cần sửa ở loại khác

1. UC-022 (use-cases): nhánh 4A "Khôi phục thất bại: … bản đã chấp nhận hiện tại giữ nguyên (BR-010)" không có dòng nào trong BR-010 (BR-010 Ghi chú 2: khôi phục nhiều bản thuộc UC-022). Xem Không áp rõ 1.
2. Requirements (BLK-033): tóm tắt kèm ID theo số mệnh đề mới của BR-010: R-020 vế 2 → BR-010 mệnh đề 5, 16; R-024 Acceptance 2–4 → mệnh đề 9, 11, 12, 13; R-031 Acceptance 1 → mệnh đề 15, 17, 18; R-031 Acceptance 2 → mệnh đề 13; R-032 Acceptance 2 (trước trỏ BR-005) → mệnh đề 13, 15; R-046 Acceptance 2 → mệnh đề 13; R-046 Acceptance 3 → mệnh đề 14.
3. Requirements: R-001 liệt kê loại ràng buộc phải khớp BR-003 mệnh đề 2 (6 loại của BLK-043). R-022 dùng mức "không được" của BR-004 (BLK-033). R-004, R-007, R-008, R-025, R-026, R-043, R-045, R-047, R-049 tóm tắt phần trùng kèm ID BR-001, BR-002, BR-002, BR-007, BR-013, BR-008, BR-012, BR-017, BR-015.
4. Decisions (BLK-034): D-030 rút về tối đa 3 vế "theo BR-010" (chi tiết ở BR-010 mệnh đề 4, 6–13). D-029 ("dừng không làm thay đổi bản đã chấp nhận") thêm ID BR trong ngoặc: nội dung nay ở BR-010 mệnh đề 13, 14, không ở BR-014 (BR-014 mục 2 chỉ còn tóm tắt). D-007 → BR-001, D-009 → BR-007, D-024 → BR-009, D-025 mục 2 → BR-010, D-025 mục 3 → BR-011, D-027 → BR-012.
5. Glossary (B5): "bản đã chấp nhận" đang định nghĩa "Phiên bản deck người dùng đã giữ", hẹp hơn BR-010 (lần tạo đầu, ranh giới commit, tải về thành công cũng tạo bản đã chấp nhận). "ràng buộc của người dùng" liệt kê "ngôn ngữ, độ dài, giọng văn", khác 6 loại ở BR-003 mệnh đề 2. Thuật ngữ mới dùng trong BR: "ranh giới commit", "tập ràng buộc", "cơ sở khôi phục" (BR-010); "vai trò của file", "hình ảnh để chèn" (BR-001); "phạm vi sửa" (BR-004); "deck đã lưu", "bản sao", "deck gốc", "lịch sử" (BR-015, BR-016); "Undo" (BR-010 Ghi chú 4, chuyển nguyên chữ theo CX-1).
6. `FILL_LATER.md` (bước sau, không phải item): gợi ý `Bảo đảm tối thiểu` của UC-001, UC-004, UC-007, UC-013, UC-017, UC-023, UC-024, UC-025 còn trỏ BR-005; khi điền nên trỏ BR-010 (mệnh đề 13, 14, 15, 17).
7. UC-008 (use-cases): `Ghi chú` 3 "File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc (BR-012)". BR-012 mệnh đề 1 nay là "không bắt buộc giữ" (giới hạn phạm vi, BLK-056); câu "cách duy nhất" mạnh hơn. Cân nhắc "File tải về là cách V1 cam kết để giữ deck sau khi lần làm việc kết thúc (BR-012)".

## Không áp rõ

1. **UC-022 4A không có dòng trong BR-010.** Khôi phục thất bại không thuộc "lượt tạo, sửa hoặc tải về" của BR-005 cũ, và BR-010 (Rule 8, Exceptions gốc) để khôi phục nhiều bản cho UC-022.
   - Phương án: (a) UC-022 4A bỏ "(BR-010)" và không trỏ rule; (b) thêm mệnh đề "khôi phục thất bại thì bản đã chấp nhận hiện tại giữ nguyên" vào BR-016 khi UC-022 lên Active; (c) mở rộng BR-010 mệnh đề 15 thêm "khôi phục" (thêm thông tin).
   - Đề xuất: (b), kèm (a) trong lúc UC-022 còn Proposed. Đã giữ UC-022 trong `use_cases` của BR-010 như khung.
2. **UC-024 2A là "lượt sửa" của BR-005 cũ?** Thao tác thêm, xóa, nhân bản, sắp xếp slide hoặc thay hình ảnh không phải lượt xử lý AI. Đã đọc là một lần sửa deck và thêm dòng "Chỉ có bản đã chấp nhận × thao tác … thất bại → Không đổi" theo mệnh đề 15.
   - Phương án: (a) giữ dòng (đã làm); (b) bỏ dòng và bỏ "(BR-010)" ở UC-024 2A.
   - Đề xuất: (a); người dùng xác nhận cách đọc.
3. **Ranh giới commit khi không có bản chờ duyệt.** Sheet Rule 4 mở đầu "Với trường hợp 3b" và D-030 mở đầu "Khi người dùng đang xem bản chờ duyệt"; BLK-035 lại đặt bước "Hệ thống đạt ranh giới commit" vào luồng chính UC-004 cho mọi yêu cầu sửa. Đã viết mệnh đề 6, 12, 13 cho mọi yêu cầu sửa mới; mệnh đề 4, 11, 20 chỉ áp "trong lúc có bản chờ duyệt".
   - Phương án: (a) giữ (đã làm); (b) chỉ dùng ranh giới commit khi có bản chờ duyệt, và viết riêng trường hợp không có bản chờ duyệt bằng "cơ sở khôi phục" (mệnh đề 19).
   - Đề xuất: (a), vì khớp UC-004 bước 3 và các nhánh 4A–5A đã dịch.
4. **`source` của BR-010 chưa có nguồn của BR-005.** CX-1 chuyển quan hệ trỏ *tới* BR-005, không nói `source` của BR-005 ("DOC-001 NFR-R01", "DOC-001 NFR-R04"). Mệnh đề 15 lấy từ BR-005 nên mất dấu nguồn DOC-001. Không sửa vì brief cấm đổi quan hệ khi chưa có quyết định.
   - Phương án: (a) thêm hai mã vào `source` của BR-010; (b) giữ.
   - Đề xuất: (a).
5. **BR-003: ràng buộc "chỉ lần này" xung đột cùng loại với ràng buộc còn hiệu lực.** BLK-043 cho quy tắc thời hạn và quy tắc xung đột riêng, không nói tổ hợp: ví dụ ràng buộc kéo dài "tiếng Anh" và yêu cầu "chỉ lần này viết tiếng Việt". Theo mệnh đề 5, ràng buộc mới thay ràng buộc cũ; theo mệnh đề 3, 4, ràng buộc mới hết hiệu lực sau lượt sửa, khi đó ràng buộc cũ có còn không thì chưa rõ. Câu hỏi ảnh hưởng hành vi nên không đưa vào `Câu hỏi mở` của item Active (GX-09); cũng chưa đủ căn cứ cho `Bảng quyết định`.
   - Phương án: (a) ràng buộc một lần chỉ thay ràng buộc cũ trong lượt sửa đó, sau lượt sửa ràng buộc cũ áp dụng lại; (b) ràng buộc một lần thay hẳn ràng buộc cũ, sau lượt sửa loại đó không còn ràng buộc; (c) hạ BR-003 xuống Proposed với câu hỏi mở (nơi xử lý: A-013).
   - Đề xuất: (a), người dùng chọn; khi chọn xong thêm `Bảng quyết định` (cùng loại / khác loại × kéo dài / một lần).
6. **BR-003 Exceptions 4** (lượt sửa bị dừng, lỗi, không qua kiểm tra thì tập ràng buộc về theo ranh giới commit) thêm ngoài 2 trường hợp PLAN.md mục 4 nêu. Đây là tóm tắt BR-010 mệnh đề 13, không thêm thông tin. Đề xuất giữ.
7. **BR-012 và UC-008.** UC-008 trỏ BR-012 ở `Ghi chú` 3, không ở luồng, nên không thêm UC-008 vào `use_cases` của BR-012. Phương án: (a) giữ (đã làm); (b) thêm UC-008. Đề xuất (a).
8. **BR-011 Exceptions và `use_cases`.** Exceptions "không áp dụng khi hệ thống đã có UC-023" trong khi `use_cases` có UC-023 (khung giữ quan hệ của sheet). Giữ cả hai. Đề xuất: khi UC-023 lên Active, bỏ UC-023 khỏi `use_cases` hoặc đổi Exceptions; người dùng quyết.
9. **BR-002 mệnh đề 3 dạng "được".** Mệnh đề quyền (AI được bổ sung …) không theo mẫu "phải / không được" của GBR-02 (Lint). Giữ đúng nghĩa sheet; PLAN.md mục 4 chỉ yêu cầu gộp vào Rule.
10. **`short_name` vượt 8 tiếng (GBR-11).** BR-001, BR-003, BR-007, BR-008, BR-010, BR-011, BR-018 giữ tên sheet; câu hỏi cách đếm từ là của bộ tiêu chí (assess-business-rules.md mục 6 ý 5). Chỉ đổi tên BR-013 theo PLAN.md mục 4.

## Sửa của agent chính sau khi subagent trả về

| ID | Chỗ sửa | Thay đổi | Lý do |
|---|---|---|---|
| BR-010 | `source` | thêm "DOC-001 NFR-R01", "DOC-001 NFR-R04" | CX-1: chuyển mọi quan hệ trỏ tới BR-005 sang BR-010; `source` của BR-005 là quan hệ tham chiếu |

## Áp trả lời CX-4…CX-8 của người dùng (agent chính, 2026-10-05)

Xem `APPLY.md` mục 8. File sửa: BR-003 (mệnh đề 5, thêm mệnh đề 7, 8, `Bảng quyết định`; CX-4); BR-010 (bỏ dòng UC-024 2A khỏi bảng, bỏ UC-024 khỏi `use_cases`; CX-8).
