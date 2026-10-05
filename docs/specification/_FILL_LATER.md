# Việc điền sau migrate

Backlog các field và section còn để trống sau khi migrate spec từ Google Sheet (2026-10-05). Mỗi dòng là một chỗ trong file item đang có `<!-- điền sau: FILL_LATER -->` hoặc một field bắt buộc còn rỗng. Khi điền xong, xóa marker trong file item và xóa dòng ở đây.

Cột Gợi ý lấy từ đánh giá lúc migrate, chưa phải nội dung spec; gợi ý có nhắc `BLK-xxx` trỏ tới quyết định migrate, lưu trong lịch sử git ở `docs/specification/_migration/BLOCKERS.md` (commit trước khi thư mục này bị xóa).

Item Active còn chỗ điền sau sẽ trượt tiêu chí tầng CI tương ứng (section bắt buộc trống, field bắt buộc rỗng) cho tới khi điền xong.

## Field và section theo item

| Item | Status | Field / Section | Gợi ý |
|---|---|---|---|
| ACT-002 | Active | Needs / Pain Points | — |
| C-002 | Active | `imposed_by` | gợi ý: "môn học / đồ án Software Engineering (thời hạn, số thành viên)", lấy ý từ cột Constraint ("nguồn lực của một đồ án Software Engineering") và Lý do 1. Sheet không nêu ai đặt ra thời hạn và số người, nên chưa chuyển chỗ được |
| C-002 | Active | Cách kiểm tuân thủ | gợi ý: 1. Xác nhận: khi chốt Decision kiến trúc, đối chiếu danh sách hệ thống con team phải tự xây với ranh giới chốt ở BLK-003. 2. Phòng ngừa: dùng C-002 làm tiêu chí khi so sánh candidate architecture (ý của Ghi chú 1) |
| C-004 | Active | `imposed_by` | gợi ý: "đặc tả của các định dạng file tải về (PPTX, PDF)", lấy ý từ Lý do 1 |
| C-004 | Active | Cách kiểm tuân thủ | gợi ý: review acceptance của R-025, R-026, R-027, R-028 để xác nhận không tiêu chí nào đòi các định dạng giống nhau về khả năng sửa, tương tác, animation hoặc cách hiển thị |
| A-007 | Open | Nếu sai | gợi ý: mở lại mô tả ACT-001 và D-012 |
| A-009 | Open | Nếu sai | gợi ý: mở lại D-014 để xét cách tương tác khác ngoài chat |
| A-010 | Open | Nếu sai | gợi ý: bỏ R-015 khỏi hướng sản phẩm |
| A-011 | Open | Nếu sai | gợi ý: giữ D-013, bỏ hướng sửa tiếp deck có sẵn khỏi lộ trình |
| A-012 | Open | Nếu sai | gợi ý: hạ ưu tiên R-022, R-034 |
| A-014 | Open | Nếu sai | gợi ý: mở lại D-007 |
| A-015 | Open | Nếu sai | gợi ý: mở lại D-017 về việc P1 Source Fidelity là điều kiện nghiệm thu bắt buộc |
| A-016 | Open | Nếu sai | gợi ý: mở lại D-009 |
| A-018 | Open | Cách kiểm chứng (dòng: 1. Đối tượng: các lượt xử lý AI của bộ đánh giá chung dùng cho R-007, R-009, R-0) | Một phần chuyển từ Review Trigger: "Benchmark về thời gian, chi phí, khả năng model và chất lượng". Còn thiếu tập lượt xử lý, cỡ mẫu, ngưỡng (BLK-010) |
| A-018 | Open | Nếu sai | gợi ý: bỏ R-035 khỏi hướng đóng góp |
| A-019 | Open | Nếu sai | gợi ý: không dùng cách phân loại 6 loại cho Testing và R-035 |
| A-020 | Open | Nếu sai | gợi ý: mở lại D-006, D-015 |
| A-021 | Open | Nếu sai | gợi ý: mở lại D-014, D-025 để xét đưa sửa cục bộ vào V1 |
| A-022 | Open | Nếu sai | gợi ý: mở lại D-015, D-026 |
| UC-001 | Active | Bảo đảm tối thiểu | gợi ý: 1. Lượt xử lý AI bị dừng, lỗi hoặc không qua kiểm tra kết quả không tạo deck (BR-014). 2. Lần làm việc vẫn ở trạng thái chưa có deck (BR-005) |
| UC-002 | Active | Bảo đảm tối thiểu | gợi ý: như UC-001; thêm "Nội dung tài liệu có sẵn không thay đổi hành vi hệ thống (BR-008)" |
| UC-003 | Proposed | Bảo đảm tối thiểu | gợi ý: Khi đọc deck có sẵn thất bại, lần làm việc vẫn chưa có deck |
| UC-004 | Active | Bảo đảm tối thiểu | gợi ý: Deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit; nếu hủy trước ranh giới commit, bản chờ duyệt vẫn là bản chờ duyệt (BR-005, BR-010 điều 4–5). Phụ thuộc BLK-035 |
| UC-007 | Proposed | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên (BR-005); nội dung deck mẫu không được đưa vào deck như thông tin thật (chuyển từ Postconditions 2 nếu điều này đúng ở mọi nhánh) |
| UC-008 | Active | Bảo đảm tối thiểu | Điều 1 chuyển từ Postconditions 2 (vế "chỉ khi tải về thành công"). gợi ý thêm: Hệ thống không giao file tạo thất bại hoặc không mở được (BR-010 điều 6) |
| UC-009 | Draft | Bảo đảm tối thiểu | gợi ý: Không tạo phiên đăng nhập khi xác thực thất bại |
| UC-010 | Draft | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 2 "Deck đã lưu không bị mất" nếu điều này đúng cả khi phiên đăng nhập hết hạn (nhánh 1A) |
| UC-011 | Active | Bảo đảm tối thiểu | gợi ý: Deck chưa tải về chỉ bị bỏ sau khi người dùng đã được cảnh báo và xác nhận (BR-012); chuyển từ Postconditions 2 |
| UC-012 | Proposed | Bảo đảm tối thiểu | gợi ý: Deck gốc không đổi (BR-015); lần làm việc hiện tại không đổi khi tạo bản sao thất bại (nhánh 2A) |
| UC-013 | Active | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận không thay đổi (BR-005) |
| UC-014 | Active | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 1–2 (đúng ở mọi nhánh): lượt xử lý kết thúc ở một trong ba trạng thái xong, đã dừng, lỗi; không còn deck dở dang (BR-014). Postconditions còn "Lượt xử lý kết thúc ở trạng thái xong" |
| UC-015 | Active | Bảo đảm tối thiểu | gợi ý: Việc xem trước không làm thay đổi deck (chuyển từ Postconditions 2) |
| UC-016 | Draft | Bảo đảm tối thiểu | — |
| UC-017 | Proposed | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005) |
| UC-018 | Draft | Bảo đảm tối thiểu | gợi ý: Khi xóa thất bại, tài liệu vẫn còn và hệ thống báo lỗi |
| UC-019 | Draft | Bảo đảm tối thiểu | gợi ý: Người xem không sửa được deck (chuyển từ Postconditions 1 nếu đúng ở mọi nhánh) |
| UC-020 | Draft | Bảo đảm tối thiểu | — |
| UC-021 | Proposed | Bảo đảm tối thiểu | gợi ý: Deck đã lưu không bị thay đổi khi khôi phục thất bại |
| UC-022 | Proposed | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận hiện tại giữ nguyên khi khôi phục thất bại (nhánh 4A); các bản khác vẫn còn trong lịch sử (BR-016) |
| UC-023 | Proposed | Bảo đảm tối thiểu | gợi ý: Phần ngoài phạm vi không bị đổi (BR-004); bản đã chấp nhận giữ nguyên (BR-005) |
| UC-024 | Proposed | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi thao tác thất bại (BR-005) |
| UC-025 | Proposed | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005); số liệu không đổi |
| R-001 | Active | Miền đầu vào | — |
| R-001 | Active | Đo lường | — |
| R-002 | Active | Miền đầu vào | — |
| R-002 | Active | Đo lường | — |
| R-005 | Proposed | Miền đầu vào | — |
| R-006 | Active | Miền đầu vào | — |
| R-006 | Active | Đo lường | — |
| R-007 | Active | Miền đầu vào | — |
| R-008 | Active | Miền đầu vào | — |
| R-008 | Active | Đo lường | — |
| R-009 | Active | Miền đầu vào | — |
| R-010 | Draft | Miền đầu vào | — |
| R-011 | Active | Miền đầu vào | — |
| R-011 | Active | Đo lường | — |
| R-012 | Proposed | Miền đầu vào | — |
| R-012 | Proposed | Đo lường | — |
| R-014 | Proposed | Miền đầu vào | — |
| R-015 | Proposed | Miền đầu vào | — |
| R-017 | Proposed | Miền đầu vào | — |
| R-018 | Proposed | Đo lường | — |
| R-020 | Active | Miền đầu vào | — |
| R-022 | Proposed | Miền đầu vào | — |
| R-022 | Proposed | Đo lường | — |
| R-023 | Proposed | Miền đầu vào | — |
| R-024 | Active | Miền đầu vào | — |
| R-024 | Active | Đo lường | — |
| R-028 | Proposed | Đo lường | — |
| R-035 | Proposed | Đo lường | — |
| R-037 | Proposed | Miền đầu vào | — |
| R-037 | Proposed | Đo lường | — |
| R-043 | Active | Miền đầu vào | — |
| R-043 | Active | Đo lường | — |
| R-044 | Proposed | Miền đầu vào | — |
| R-044 | Proposed | Đo lường | — |
| R-047 | Proposed | Miền đầu vào | — |
| R-050 | Draft | Miền đầu vào | — |
| R-050 | Draft | Đo lường | — |
| R-051 | Draft | Miền đầu vào | — |
| R-055 | Proposed | Miền đầu vào | — |
| D-006 | Active | Hệ quả | gợi ý: Tốt: phạm vi không mở rộng thành bản thay thế PowerPoint, Canva hay Figma (Rationale 1). Đánh đổi: chỉnh tay chuyên sâu phải làm ngoài DeckAgent sau khi tải về (Context 2) |
| D-006 | Active | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" (GD-06) |
| D-007 | Active | Hệ quả | gợi ý: Tốt: không khóa luồng hợp lệ ngay từ đầu (Rationale 1). Đánh đổi: phải xác định mục đích từ yêu cầu thay vì đọc đuôi file |
| D-007 | Active | Xác nhận tuân thủ | gợi ý: test đưa cùng một file PPTX với hai mục đích khác nhau, kiểm DeckAgent gán hai vai trò khác nhau (BR-001) |
| D-009 | Active | Hệ quả | gợi ý: Tốt: độ trung thực kiểm được theo facts, số liệu, thứ tự, ý nghĩa. Đánh đổi: các file có thể khác về pixel, font, khả năng sửa, tương tác, animation (BR-007) |
| D-009 | Active | Xác nhận tuân thủ | gợi ý: test so facts, số liệu và thứ tự slide giữa PPTX và PDF của cùng một bản đã chấp nhận (R-025) |
| D-012 | Active | Hệ quả | gợi ý: Tốt: Architecture, Implementation, Testing cùng nhắm một luồng (Context 1). Đánh đổi: sửa deck có sẵn ra khỏi V1 (D-013) |
| D-012 | Active | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-013 | Active | Hệ quả | gợi ý: Tốt: V1 không gánh chi phí giữ bố cục khi nhập và sửa cục bộ (Context 2). Đánh đổi: người dùng có deck có sẵn phải tạo deck mới trong V1 |
| D-013 | Active | Xác nhận tuân thủ | gợi ý: check R-005, R-012, R-023 có `scope: Later` |
| D-014 | Active | Hệ quả | gợi ý: Tốt: V1 không phải định danh từng thành phần và vá cục bộ (Rationale 2). Đánh đổi: yêu cầu nhắm vào một slide có thể đổi slide khác (BR-011) |
| D-014 | Active | Xác nhận tuân thủ | gợi ý: test gửi yêu cầu sửa một slide, kiểm DeckAgent hiện cảnh báo của BR-011 trước khi chạy |
| D-015 | Active | Hệ quả | gợi ý: Tốt: không dành nguồn lực cho canvas hoặc editor (Context 2). Đánh đổi: chỉnh tay phụ thuộc file PPTX tải về mở được (R-027) |
| D-015 | Active | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-017 | Active | Hệ quả | gợi ý: Tốt: acceptance V1 tập trung vào P1, P2, P3, P5. Đánh đổi: P4 Safe Refinement không được kiểm như hard acceptance |
| D-017 | Active | Xác nhận tuân thủ | gợi ý: check mỗi P1, P2, P3, P5 có ít nhất một Requirement Active có Acceptance (ví dụ R-007, R-024, R-021, R-025) |
| D-024 | Active | Hệ quả | gợi ý: Tốt: Architecture có danh sách loại tài liệu cố định (Context 1). Đánh đổi: PDF scan, ảnh, URL, XLSX/CSV, nhiều tài liệu cho một deck, dùng lại ảnh nhúng chưa có trong V1 |
| D-024 | Active | Xác nhận tuân thủ | gợi ý: vế 1: test nhận từng loại trong 5 loại; vế 2: test tài liệu thứ hai cho cùng deck (BR-009); vế 3: test ảnh nhúng không xuất hiện trong deck |
| D-025 | Active | Hệ quả | gợi ý: Tốt: không cần Undo nhiều bước (Rationale 2). Đánh đổi: sửa theo slide là cố gắng, không đảm bảo (BR-011) |
| D-025 | Active | Xác nhận tuân thủ | gợi ý: vế 1: test từng loại trong 7 loại sửa cả deck; vế 2: test bỏ lần sửa gần nhất quay về bản đã chấp nhận (R-031); vế 3: test cảnh báo BR-011 |
| D-027 | Active | Hệ quả | gợi ý: Tốt: V1 không cần hạ tầng cloud, tài khoản (Rationale 2, 3). Đánh đổi: deck mất khi kết thúc lần làm việc (BR-012, R-045) |
| D-027 | Active | Xác nhận tuân thủ | gợi ý: vế 1: review không có bước host hay tài khoản; vế 2: test tải lại trang sau cảnh báo, deck không còn |
| D-029 | Active | Hệ quả | gợi ý: Tốt: người dùng không bị kẹt khi lượt xử lý kéo dài (Rationale 2). Đánh đổi: Architecture phải bảo đảm dừng không để deck dở dang (Reopen When) |
| D-029 | Active | Xác nhận tuân thủ | gợi ý: test dừng giữa lượt xử lý AI, kiểm bản đã chấp nhận không đổi (BR-014) |
| D-030 | Active | Hệ quả | gợi ý: Tốt: hủy yêu cầu trước ranh giới commit không làm đổi trạng thái phiên bản (Rationale 1). Đánh đổi: bản chờ duyệt được chấp nhận ngầm, không có bước xác nhận riêng (Reopen When) |
| D-030 | Active | Xác nhận tuân thủ | gợi ý: test hủy yêu cầu trong bước hỏi lại, kiểm bản vẫn là bản chờ duyệt; test lượt xử lý lỗi sau ranh giới commit, kiểm deck quay về bản vừa chấp nhận |

## Việc điền sau từ quyết định migrate

| Item | Status | Việc | Ghi chú |
|---|---|---|---|
| A-018 | Open | Cách kiểm chứng: tiêu chí chia lượt xử lý AI vào nhóm khó và nhóm dễ | Phải điền trước khi bất kỳ requirement Later nào dựa vào A-018 (R-035, R-036, R-037) lên Active. Gợi ý: chia theo loại lượt xử lý mà A-019 liệt kê |
| UC-022 | Proposed | Alternative / Failure Flows, nhánh 4A (khôi phục thất bại) | Chọn Business Rule sở hữu trạng thái sau khi khôi phục thất bại (BR-016 hoặc BR-010) trước khi UC-022 lên Active |
| UC-024 | Proposed | Alternative / Failure Flows, nhánh 2A (thao tác thêm, xóa, sắp xếp slide hoặc thay hình thất bại) | Chọn Business Rule sở hữu trạng thái sau khi thao tác thất bại (BR-010 hoặc rule mới) trước khi UC-024 lên Active |
| D-031 | Active | `documents` | Lưu ảnh chụp hoặc ghi chú benchmark Napkin AI thành tài liệu có DOC-ID, rồi trỏ D-031 tới đó. |
| R-021 | Active | Bộ đánh giá chung (`tests/eval/`) | Thu thập 10 tài liệu mẫu (báo cáo có số liệu, bài giảng, đề xuất dự án; dài 3–20 trang; ≥ 3 tài liệu có bảng số liệu) và viết 10 yêu cầu không kèm tài liệu, theo `tests/eval/README.md`. Chưa có tài liệu thì R-007, R-009, R-021 chưa nghiệm thu được |

## Thuật ngữ đề xuất cho `glossary.md`

Thuật ngữ đang được dùng trong item nhưng chưa có trong `glossary.md`. Thêm thuật ngữ là quyết định của người dùng.

| Thuật ngữ | Gợi ý |
|---|---|
| Thuật ngữ "ranh giới commit" (6: BR-010, D-030, R-024, R-031, R-046, UC-004) | gợi ý: "Thời điểm ngay trước khi lượt xử lý AI cho một yêu cầu sửa mới bắt đầu; tại đó bản chờ duyệt hiện tại trở thành bản đã chấp nhận (BR-010)". Không dùng: — . Có từ tiếng Anh "commit"; cân nhắc tên tiếng Việt |
| Thuật ngữ "lần sửa" (24) / "lượt sửa" (8) | gợi ý: chọn một tên. Hai cụm đang dùng song song, và "lần sửa" có trong định nghĩa GL-008, GL-010, GL-014, GL-015. Quan hệ với "lượt xử lý AI" cần người dùng nói rõ |
| Thuật ngữ "sửa theo slide" (5: A-021, BR-011, D-014, D-025, UC-023) | gợi ý: "Lần sửa nhắm vào một slide ở V1, ở mức cố gắng, không đảm bảo; khác sửa cục bộ (D-025, BR-011)". Đang được GL-022 nhắc tới mà chưa định nghĩa |
| Thuật ngữ "tập ràng buộc" (4: BR-010, D-030, R-024, UC-004) | gợi ý: "Các ràng buộc của người dùng gắn với một bản deck (BR-010)" |
| Thuật ngữ cho Undo (Undo 4: BR-005, D-025, R-016, R-031; "hoàn tác" 1: UC-022) | gợi ý: chọn "hoàn tác" làm thuật ngữ, Không dùng: Undo. Hai tên cho một khái niệm (GX-07) |
| Thuật ngữ "thành phần" (16) | gợi ý: "Một phần tử trong slide như tiêu đề, đoạn chữ, hình ảnh, biểu đồ". Đang dùng trong định nghĩa GL-015 |
| Thuật ngữ "tài khoản" (11) | gợi ý: "Danh tính người dùng để lưu deck qua nhiều lần làm việc; chỉ có khi DeckAgent có tài khoản (ACT-003)". GL-013 phụ thuộc khái niệm này |
| Thuật ngữ "deck đã lưu" (7), "bản sao" (5), "lịch sử" (6) | gợi ý: định nghĩa cùng nhóm tính năng có tài khoản (BR-015, BR-016, UC-012, UC-022) |
| Thuật ngữ "vai trò của file" (5) và "hình ảnh để chèn" (3) | gợi ý: "Vai trò của file: tài liệu có sẵn, deck có sẵn, deck mẫu hoặc hình ảnh để chèn, xác định theo mục đích trong yêu cầu (BR-001)" |
| Thuật ngữ "audience" (12) | gợi ý: thêm thuật ngữ (giữ "audience" hoặc chọn "người nghe"). Đang dùng trong định nghĩa GL-007, GL-014 |
| Thuật ngữ "phạm vi sửa" (3: A-012, BR-004, R-022) | gợi ý: "Phần deck mà một lần sửa được phép thay đổi (BR-004)" |
| "lượt tạo" (3), "lượt tải về" (3) | gợi ý: quyết có phải là "lượt xử lý AI" (tạo) và một khái niệm riêng (tải về) không |
| buổi thử | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| bộ đánh giá chung | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| lượt tạo deck, lượt sửa deck | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| trạng thái kết thúc Hoàn tất, Đã dừng, Lỗi | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| lỗi thường gặp | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| cơ sở khôi phục | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| chỉnh tay chuyên sâu | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
| AI-first | Do subagent dịch đề xuất ở B4; dùng trong nhiều item, chưa có định nghĩa |
