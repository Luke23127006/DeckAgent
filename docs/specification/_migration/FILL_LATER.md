# Field và section để trống (FILL_LATER)

Field hoặc section mà sheet không có (quyết định 3 của Pha A). Không phải blocker. Cột Gợi ý chỉ là gợi ý, chưa phải nội dung spec.
Đã bỏ dòng của item bị xóa (vận hành dự án) và của item Closed (Retired, Deprecated, Superseded): theo `schema.json`, item Closed chỉ chịu field `required: true`, nên section mới không áp dụng.
Section bắt buộc ở mức Active mà để trống sẽ làm CI trượt khi ghi item ở Pha B; xem PLAN.md mục 8.

## actors

| ID | Field/Section | Gợi ý |
|---|---|---|
| ACT-002 | `source` | gợi ý: DOC-001 (R-032, R-033 lấy căn cứ từ DOC-001 NFR-R02, NFR-R03), cần người dùng xác nhận |
| ACT-003 | `source` | — |

## constraints

| ID | Field/Section | Gợi ý |
|---|---|---|
| C-002 | `imposed_by` | gợi ý: "môn học / đồ án Software Engineering (thời hạn, số thành viên)", lấy ý từ cột Constraint ("nguồn lực của một đồ án Software Engineering") và Lý do 1. Sheet không nêu ai đặt ra thời hạn và số người, nên chưa chuyển chỗ được |
| C-002 | Cách kiểm tuân thủ | gợi ý: 1. Xác nhận: khi chốt Decision kiến trúc, đối chiếu danh sách hệ thống con team phải tự xây với ranh giới chốt ở BLK-003. 2. Phòng ngừa: dùng C-002 làm tiêu chí khi so sánh candidate architecture (ý của Ghi chú 1) |
| C-003 | `imposed_by` | Không để trống: chuyển từ cột Constraint ("theo yêu cầu của đồ án"). Nếu BLK-004 chọn D thì field này mất ý nghĩa |
| C-003 | Cách kiểm tuân thủ | gợi ý: trước mỗi mốc nộp đồ án, đối chiếu danh sách định dạng tải về thực tế của DeckAgent với ranh giới chốt ở BLK-004 |
| C-004 | `imposed_by` | gợi ý: "đặc tả của các định dạng file tải về (PPTX, PDF)", lấy ý từ Lý do 1 |
| C-004 | Cách kiểm tuân thủ | gợi ý: review acceptance của R-025, R-026, R-027, R-028 để xác nhận không tiêu chí nào đòi các định dạng giống nhau về khả năng sửa, tương tác, animation hoặc cách hiển thị |

## assumptions

| ID | Field/Section | Gợi ý |
|---|---|---|
| A-007 | Cách kiểm chứng | gợi ý: phỏng vấn người dùng có đặc điểm như ACT-001; mẫu số = số người phỏng vấn; ngưỡng theo BLK-005 |
| A-007 | Nếu sai | gợi ý: mở lại mô tả ACT-001 và D-012 |
| A-008 | Cách kiểm chứng | gợi ý: usability test luồng tạo và sửa deck; mẫu số = tổng thao tác tạo và sửa; tử số = thao tác người dùng giao cho AI; ngưỡng theo BLK-005 |
| A-008 | Nếu sai | — (chuyển từ Ghi chú 2: "Mở lại mục tiêu và ranh giới V1") |
| A-009 | Cách kiểm chứng | gợi ý: usability test; mẫu số = số yêu cầu người dùng gõ; tử số = số yêu cầu phải gõ lại; ngưỡng theo BLK-005 |
| A-009 | Nếu sai | gợi ý: mở lại D-014 để xét cách tương tác khác ngoài chat |
| A-010 | Cách kiểm chứng | gợi ý: user test; mẫu số = số lỗi nhỏ (danh sách theo BLK-006) người dùng gặp; tử số = số lỗi người dùng chọn tự sửa trực tiếp |
| A-010 | Nếu sai | gợi ý: bỏ R-015 khỏi hướng sản phẩm |
| A-011 | Cách kiểm chứng | gợi ý: phỏng vấn hoặc dữ liệu sử dụng; tỷ lệ người dùng có nhu cầu sửa tiếp deck có sẵn; ngưỡng theo BLK-008 |
| A-011 | Nếu sai | gợi ý: giữ D-013, bỏ hướng sửa tiếp deck có sẵn khỏi lộ trình |
| A-012 | Cách kiểm chứng | gợi ý: thí nghiệm sửa deck; mẫu số = số lần sửa; tử số = số lần sửa làm đổi phần ngoài phạm vi sửa mà người dùng coi là lỗi |
| A-012 | Nếu sai | gợi ý: hạ ưu tiên R-022, R-034 |
| A-013 | Cách kiểm chứng | gợi ý: so sánh hai bản sửa có giữ và không giữ ràng buộc của người dùng; đại lượng theo BLK-009 |
| A-013 | Nếu sai | — (chuyển từ Review Trigger: "Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng") |
| A-014 | Cách kiểm chứng | gợi ý: tỷ lệ người dùng dùng cùng một loại file với hơn một vai trò; ngưỡng theo BLK-008 |
| A-014 | Nếu sai | gợi ý: mở lại D-007 |
| A-015 | Cách kiểm chứng | Một phần chuyển từ Ghi chú 3: "Evidence đến từ test hoặc nghiên cứu người dùng thực tế". Còn thiếu mẫu số, cỡ mẫu, ngưỡng (BLK-007) |
| A-015 | Nếu sai | gợi ý: mở lại D-017 về việc P1 Source Fidelity là điều kiện nghiệm thu bắt buộc |
| A-016 | Cách kiểm chứng | gợi ý: cho người dùng xếp hạng ưu tiên giữa giống nhau về ý nghĩa và giống nhau về hình ảnh; ngưỡng theo BLK-007 |
| A-016 | Nếu sai | gợi ý: mở lại D-009 |
| A-017 | Cách kiểm chứng | gợi ý: usability test; mẫu số = số lần người dùng tải về sau khi xem trước; tử số = số lần người dùng đổi quyết định sau khi mở file tải về |
| A-017 | Nếu sai | — (chuyển từ Ghi chú 2: "Thay đổi luồng Xem trước → Giữ → Tải về") |
| A-018 | Cách kiểm chứng | Một phần chuyển từ Review Trigger: "Benchmark về thời gian, chi phí, khả năng model và chất lượng". Còn thiếu tập lượt xử lý, cỡ mẫu, ngưỡng (BLK-010) |
| A-018 | Nếu sai | gợi ý: bỏ R-035 khỏi hướng đóng góp |
| A-019 | Cách kiểm chứng | gợi ý: nhiều người gán nhãn độc lập cùng một tập lượt xử lý vào 6 loại; đo mức đồng thuận; ngưỡng theo BLK-010 |
| A-019 | Nếu sai | gợi ý: không dùng cách phân loại 6 loại cho Testing và R-035 |
| A-020 | Cách kiểm chứng | gợi ý: user test sau tải về; tỷ lệ người dùng hoàn tất chỉnh tay trong PowerPoint mà không quay lại DeckAgent; ngưỡng theo BLK-006 |
| A-020 | Nếu sai | gợi ý: mở lại D-006, D-015 |
| A-021 | Cách kiểm chứng | gợi ý: tỷ lệ phiên đạt deck dùng được (tiêu chí theo BLK-006) chỉ bằng sửa cả deck |
| A-021 | Nếu sai | gợi ý: mở lại D-014, D-025 để xét đưa sửa cục bộ vào V1 |
| A-022 | Cách kiểm chứng | Một phần chuyển từ Ghi chú 2: "Mức tương thích được học từ file thật". Còn thiếu ứng dụng đích, cỡ mẫu, ngưỡng (BLK-044) |
| A-022 | Nếu sai | gợi ý: mở lại D-015, D-026 |
| A-023 | Cách kiểm chứng | gợi ý: chạy bộ test tải về của V1 trên PPTX và PDF; Supported khi mọi hành vi tải về của các Requirement dựa vào A-023 kiểm chứng được; Invalidated khi có ít nhất một hành vi không kiểm chứng được |
| A-023 | Nếu sai | gợi ý: mở lại D-026 để thêm định dạng tải về |
| A-029 | Cách kiểm chứng | gợi ý: user test; mẫu số = số người tham gia; tử số = số người mất deck ngoài ý muốn hoặc cần quay lại deck ở lần làm việc sau; ngưỡng theo BLK-009 |
| A-029 | Nếu sai | — (chuyển từ Ghi chú 2: "Kích hoạt R-048 (lưu và mở lại deck qua nhiều lần làm việc)") |

## use-cases

| ID | Field/Section | Gợi ý |
|---|---|---|
| UC-001 | Bảo đảm tối thiểu | gợi ý: 1. Lượt xử lý AI bị dừng, lỗi hoặc không qua kiểm tra kết quả không tạo deck (BR-014). 2. Lần làm việc vẫn ở trạng thái chưa có deck (BR-005) |
| UC-002 | Bảo đảm tối thiểu | gợi ý: như UC-001; thêm "Nội dung tài liệu có sẵn không thay đổi hành vi hệ thống (BR-008)" |
| UC-003 | Bảo đảm tối thiểu | gợi ý: Khi đọc deck có sẵn thất bại, lần làm việc vẫn chưa có deck |
| UC-004 | Bảo đảm tối thiểu | gợi ý: Deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit; nếu hủy trước ranh giới commit, bản chờ duyệt vẫn là bản chờ duyệt (BR-005, BR-010 điều 4–5). Phụ thuộc BLK-035 |
| UC-007 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên (BR-005); nội dung deck mẫu không được đưa vào deck như thông tin thật (chuyển từ Postconditions 2 nếu điều này đúng ở mọi nhánh) |
| UC-008 | Bảo đảm tối thiểu | Điều 1 chuyển từ Postconditions 2 (vế "chỉ khi tải về thành công"). gợi ý thêm: Hệ thống không giao file tạo thất bại hoặc không mở được (BR-010 điều 6) |
| UC-009 | Bảo đảm tối thiểu | gợi ý: Không tạo phiên đăng nhập khi xác thực thất bại |
| UC-010 | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 2 "Deck đã lưu không bị mất" nếu điều này đúng cả khi phiên đăng nhập hết hạn (nhánh 1A) |
| UC-011 | Bảo đảm tối thiểu | gợi ý: Deck chưa tải về chỉ bị bỏ sau khi người dùng đã được cảnh báo và xác nhận (BR-012); chuyển từ Postconditions 2 |
| UC-012 | Bảo đảm tối thiểu | gợi ý: Deck gốc không đổi (BR-015); lần làm việc hiện tại không đổi khi tạo bản sao thất bại (nhánh 2A) |
| UC-013 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận không thay đổi (BR-005) |
| UC-014 | Bảo đảm tối thiểu | gợi ý: chuyển Postconditions 1–2 (đúng ở mọi nhánh): lượt xử lý kết thúc ở một trong ba trạng thái xong, đã dừng, lỗi; không còn deck dở dang (BR-014). Postconditions còn "Lượt xử lý kết thúc ở trạng thái xong" |
| UC-015 | Bảo đảm tối thiểu | gợi ý: Việc xem trước không làm thay đổi deck (chuyển từ Postconditions 2) |
| UC-016 | Bảo đảm tối thiểu | — |
| UC-017 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005) |
| UC-018 | Bảo đảm tối thiểu | gợi ý: Khi xóa thất bại, tài liệu vẫn còn và hệ thống báo lỗi |
| UC-019 | Bảo đảm tối thiểu | gợi ý: Người xem không sửa được deck (chuyển từ Postconditions 1 nếu đúng ở mọi nhánh) |
| UC-020 | Bảo đảm tối thiểu | — |
| UC-021 | Bảo đảm tối thiểu | gợi ý: Deck đã lưu không bị thay đổi khi khôi phục thất bại |
| UC-022 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận hiện tại giữ nguyên khi khôi phục thất bại (nhánh 4A); các bản khác vẫn còn trong lịch sử (BR-016) |
| UC-023 | Bảo đảm tối thiểu | gợi ý: Phần ngoài phạm vi không bị đổi (BR-004); bản đã chấp nhận giữ nguyên (BR-005) |
| UC-024 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi thao tác thất bại (BR-005) |
| UC-025 | Bảo đảm tối thiểu | gợi ý: Bản đã chấp nhận giữ nguyên khi người dùng bỏ bản chờ duyệt (BR-005); số liệu không đổi |

## business-rules

| ID | Field/Section | Gợi ý |
|---|---|---|
| BR-003 | Câu hỏi mở | gợi ý: nếu BLK-043 chọn B: "Hệ thống phân biệt ràng buộc chỉ dành cho một lần sửa với ràng buộc kéo dài bằng cách nào? Nơi xử lý: A-013." |
| BR-004 | Câu hỏi mở | gợi ý: nếu BLK-012 chọn C: "Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết? Nơi xử lý: UC-023." |
| BR-005 | Bảng chuyển trạng thái | gợi ý: chỉ cần nếu BLK-035 chọn B; khi đó lấy các dòng thất bại, dừng, bỏ từ bảng của BR-010 ở mục 4 |
| BR-010 | Câu hỏi mở | gợi ý: nếu BLK-054 chọn B: 4 cặp trạng thái × sự kiện liệt kê trong BLK-054, nơi xử lý UC-004, UC-008 |
| BR-016 | Câu hỏi mở | gợi ý: nếu BLK-013 chọn C: "Giới hạn lưu trữ lịch sử là bao nhiêu bản hoặc bao lâu, và bản nào bị loại khi vượt giới hạn? Nơi xử lý: UC-022." |

## requirements

| ID | Field/Section | Gợi ý |
|---|---|---|
| R-001 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu nêu hoặc không nêu từng loại ràng buộc (danh sách chờ BLK-043). Đo lường (GR-10): bộ yêu cầu mẫu, số lần chạy, tỷ lệ ghi nhận đúng |
| R-002 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu thiếu chủ đề / thiếu mục đích / đủ cả hai (chờ BLK-015). Đo lường (GR-10): tỷ lệ hỏi lại đúng trên bộ yêu cầu thiếu thông tin |
| R-003 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: hợp lệ = 5 loại; không hợp lệ = loại khác, PDF không có text layer (chuyển từ Yêu cầu và Acceptance 2). Biên kích thước và số trang chưa có trong sheet (xem mục 6) |
| R-004 | verification; inputs | gợi ý: inspection (Acceptance 2 là câu phủ định; trong V1 chỉ có một vai trò, theo BR-001 Exceptions); inputs: true |
| R-005 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: file PPTX là deck có sẵn |
| R-006 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu có hoặc không kèm tài liệu có sẵn (chuyển từ Yêu cầu). Đo lường (GR-10): tỷ lệ tạo được deck xem trước được trên bộ yêu cầu mẫu |
| R-007 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: 5 loại tài liệu (R-003). Đo lường (GR-10): validator tự động so số liệu trên slide với tài liệu; Ngưỡng đạt: Chưa chốt (BLK-058, BLK-063) |
| R-008 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: nội dung được yêu cầu có hoặc không có căn cứ trong tài liệu. Đo lường (GR-10): tỷ lệ nội dung AI bổ sung được đánh dấu hoặc hỏi trước |
| R-009 | verification; inputs; Đo lường | gợi ý: test bằng rubric, hoặc demonstration; inputs: true. Đo lường (GR-10): rubric chấm độ sâu kỹ thuật và giọng văn theo audience (chờ BLK-058) |
| R-010 | verification; inputs | gợi ý: test; inputs: true (deck mẫu và phần muốn học theo) |
| R-011 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: hợp lệ = 7 loại sửa của D-025 (chuyển từ Acceptance 1); yêu cầu nhắm vào một slide. Đo lường (GR-10): tỷ lệ lần sửa đúng loại trên bộ yêu cầu mẫu |
| R-012 | verification; inputs; Đo lường | gợi ý: test; inputs: true. Đo lường (GR-10): tỷ lệ xác định đúng phạm vi |
| R-013 | verification; inputs | gợi ý: test; inputs: false |
| R-014 | verification; inputs | gợi ý: test; inputs: true (vị trí slide, hình ảnh thay thế) |
| R-015 | verification; inputs | gợi ý: test; inputs: true |
| R-016 | verification; inputs | gợi ý: test; inputs: false |
| R-017 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: loại file hình ảnh chưa có trong sheet |
| R-018 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-10) nếu tạo hình bằng AI |
| R-019 | verification; inputs | gợi ý: test; inputs: false |
| R-020 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: định dạng ∈ {PPTX, PDF} (theo D-026); bản đang xem trước là bản đã chấp nhận hoặc bản chờ duyệt |
| R-021 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-09, GR-10): Scale = số deck mắc ít nhất một trong 4 lỗi (chuyển từ Acceptance 1); Ngưỡng đạt: Chưa chốt (chuyển từ Acceptance 2; BLK-058, BLK-063) |
| R-022 | verification; inputs; Đo lường | gợi ý: test; inputs: true. Đo lường (GR-10): tỷ lệ lần sửa không đổi phần ngoài phạm vi |
| R-023 | verification; inputs | gợi ý: test; inputs: true |
| R-024 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: yêu cầu sửa có hoặc không nêu ràng buộc mới; bị hủy, bị từ chối hoặc qua ranh giới commit. Đo lường (GR-10): tỷ lệ deck giữ đúng ràng buộc sau N lần sửa |
| R-025 | verification; inputs | gợi ý: test; inputs: false |
| R-026 | verification; inputs | gợi ý: test; inputs: false |
| R-027 | verification; inputs | gợi ý: test; inputs: false (danh sách ứng dụng đích chờ BLK-044) |
| R-028 | verification; inputs; Đo lường | gợi ý: test; inputs: false. Đo lường (GR-09) nếu "khớp bố cục" được đo theo mức độ |
| R-029 | verification; inputs | gợi ý: demonstration với người dùng không có kỹ năng thiết kế; inputs: false |
| R-030 | verification; inputs | gợi ý: test; inputs: false |
| R-031 | verification; inputs | gợi ý: test; inputs: false |
| R-032 | verification; inputs | gợi ý: test bằng cách tiêm lỗi và quá thời gian của dịch vụ ngoài; inputs: false |
| R-033 | verification; inputs | gợi ý: test bằng cách tiêm kết quả AI hỏng; inputs: false |
| R-034 | verification; inputs | gợi ý: test; inputs: false |
| R-035 | verification; inputs; Đo lường | gợi ý: analysis hoặc test; inputs: false. Đo lường (GR-09): mức tính toán theo nhóm lượt xử lý; Ngưỡng: Chưa chốt |
| R-036 | verification; inputs | gợi ý: test hoặc inspection; inputs: false |
| R-037 | verification; inputs; Đo lường | gợi ý: test; inputs: true (giá trị giới hạn cấu hình). Ngưỡng: Chưa chốt (benchmark, chuyển từ Ghi chú) |
| R-038 | verification; inputs | gợi ý: analysis; inputs: false |
| R-039 | verification; inputs | gợi ý: analysis; inputs: false |
| R-040 | verification; inputs | gợi ý: analysis; inputs: false |
| R-041 | verification; inputs | gợi ý: inspection; inputs: false (phụ thuộc BLK-020) |
| R-042 | verification; inputs | gợi ý: test (quét log, file tạm, lưu lượng ra ngoài) kèm inspection; inputs: false |
| R-043 | verification; inputs; Miền đầu vào; Đo lường | gợi ý: test; inputs: true. Miền đầu vào: tài liệu có hoặc không chứa câu lệnh cài sẵn. Đo lường (GR-10): bộ tài liệu tấn công, số lần chạy, tỷ lệ AI không làm theo lệnh cài sẵn |
| R-044 | verification; inputs; Đo lường; Câu hỏi mở (nơi xử lý) | gợi ý: test; inputs: true (ngôn ngữ đích). Đo lường (GR-10): giữ ý nghĩa và số liệu. Nơi xử lý của câu hỏi về font, bố cục, độ trung thực (chuyển từ Acceptance 2) chưa có |
| R-045 | verification; inputs | gợi ý: test; inputs: false |
| R-046 | verification; inputs | gợi ý: test; inputs: false |
| R-047 | verification; inputs; Miền đầu vào | gợi ý: test; inputs: true. Miền đầu vào: theme có sẵn; bộ nhận diện gồm màu, font, logo (chuyển từ Acceptance 1); biên chưa có |
| R-048 | verification; inputs | gợi ý: test; inputs: false |
| R-049 | verification; inputs | gợi ý: test; inputs: false |
| R-050 | verification; inputs | gợi ý: test; inputs: true |
| R-051 | verification; inputs | gợi ý: test; inputs: true |
| R-052 | verification; inputs | gợi ý: test; inputs: false |
| R-053 | verification; inputs | gợi ý: test; inputs: false |
| R-054 | verification; inputs | gợi ý: test; inputs: false |

## decisions

| ID | Field/Section | Gợi ý |
|---|---|---|
| D-006…D-030 (19 item không XÓA) | `source` | Sheet Decisions không có cột Căn cứ. Evidence hiện chỉ nằm ở `documents` (Detailed Doc). Gợi ý riêng xem các dòng dưới |
| D-006 | Hệ quả | gợi ý: Tốt: phạm vi không mở rộng thành bản thay thế PowerPoint, Canva hay Figma (Rationale 1). Đánh đổi: chỉnh tay chuyên sâu phải làm ngoài DeckAgent sau khi tải về (Context 2) |
| D-006 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" (GD-06) |
| D-007 | Hệ quả | gợi ý: Tốt: không khóa luồng hợp lệ ngay từ đầu (Rationale 1). Đánh đổi: phải xác định mục đích từ yêu cầu thay vì đọc đuôi file |
| D-007 | Xác nhận tuân thủ | gợi ý: test đưa cùng một file PPTX với hai mục đích khác nhau, kiểm DeckAgent gán hai vai trò khác nhau (BR-001) |
| D-009 | Hệ quả | gợi ý: Tốt: độ trung thực kiểm được theo facts, số liệu, thứ tự, ý nghĩa. Đánh đổi: các file có thể khác về pixel, font, khả năng sửa, tương tác, animation (BR-007) |
| D-009 | Xác nhận tuân thủ | gợi ý: test so facts, số liệu và thứ tự slide giữa PPTX và PDF của cùng một bản đã chấp nhận (R-025) |
| D-010 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Phụ thuộc BLK-031; text không có phương án thay thế. Nếu giữ theo BLK-031 phương án B: gợi ý "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-011 | Hệ quả, Xác nhận tuân thủ | Phụ thuộc BLK-030 |
| D-012 | Hệ quả | gợi ý: Tốt: Architecture, Implementation, Testing cùng nhắm một luồng (Context 1). Đánh đổi: sửa deck có sẵn ra khỏi V1 (D-013) |
| D-012 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-013 | Hệ quả | gợi ý: Tốt: V1 không gánh chi phí giữ bố cục khi nhập và sửa cục bộ (Context 2). Đánh đổi: người dùng có deck có sẵn phải tạo deck mới trong V1 |
| D-013 | Xác nhận tuân thủ | gợi ý: check R-005, R-012, R-023 có `scope: Later` |
| D-014 | Hệ quả | gợi ý: Tốt: V1 không phải định danh từng thành phần và vá cục bộ (Rationale 2). Đánh đổi: yêu cầu nhắm vào một slide có thể đổi slide khác (BR-011) |
| D-014 | Xác nhận tuân thủ | gợi ý: test gửi yêu cầu sửa một slide, kiểm DeckAgent hiện cảnh báo của BR-011 trước khi chạy |
| D-015 | Hệ quả | gợi ý: Tốt: không dành nguồn lực cho canvas hoặc editor (Context 2). Đánh đổi: chỉnh tay phụ thuộc file PPTX tải về mở được (R-027) |
| D-015 | Xác nhận tuân thủ | gợi ý: "Không áp dụng: quyết định về phạm vi sản phẩm" |
| D-017 | Hệ quả | gợi ý: Tốt: acceptance V1 tập trung vào P1, P2, P3, P5. Đánh đổi: P4 Safe Refinement không được kiểm như hard acceptance |
| D-017 | Xác nhận tuân thủ | gợi ý: check mỗi P1, P2, P3, P5 có ít nhất một Requirement Active có Acceptance (ví dụ R-007, R-024, R-021, R-025) |
| D-024 | Hệ quả | gợi ý: Tốt: Architecture có danh sách loại tài liệu cố định (Context 1). Đánh đổi: PDF scan, ảnh, URL, XLSX/CSV, nhiều tài liệu cho một deck, dùng lại ảnh nhúng chưa có trong V1 |
| D-024 | Xác nhận tuân thủ | gợi ý: vế 1: test nhận từng loại trong 5 loại; vế 2: test tài liệu thứ hai cho cùng deck (BR-009); vế 3: test ảnh nhúng không xuất hiện trong deck |
| D-025 | Hệ quả | gợi ý: Tốt: không cần Undo nhiều bước (Rationale 2). Đánh đổi: sửa theo slide là cố gắng, không đảm bảo (BR-011) |
| D-025 | Xác nhận tuân thủ | gợi ý: vế 1: test từng loại trong 7 loại sửa cả deck; vế 2: test bỏ lần sửa gần nhất quay về bản đã chấp nhận (R-031); vế 3: test cảnh báo BR-011 |
| D-026 | Hệ quả | gợi ý: Tốt: chứng minh bàn giao chỉnh tay, file chỉ xem, độ trung thực (Rationale 1). Đánh đổi: mất mát tương thích PPTX chỉ biết sau implementation (Rationale 3) |
| D-026 | Xác nhận tuân thủ | gợi ý: vế 1: test file PPTX và PDF mở được (R-027); vế 2: check không có định dạng khác trong V1; vế 3: "Không áp dụng: chưa chốt theo chính quyết định" |
| D-027 | `source` | gợi ý: mã buổi trao đổi với advisor kèm ngày (Rationale 1 "Advisor xác nhận không cần host"); người dùng cung cấp ngày |
| D-027 | Hệ quả | gợi ý: Tốt: V1 không cần hạ tầng cloud, tài khoản (Rationale 2, 3). Đánh đổi: deck mất khi kết thúc lần làm việc (BR-012, R-045) |
| D-027 | Xác nhận tuân thủ | gợi ý: vế 1: review không có bước host hay tài khoản; vế 2: test tải lại trang sau cảnh báo, deck không còn |
| D-028 | Phương án đã xét, Hệ quả, Xác nhận tuân thủ | Phụ thuộc BLK-032 |
| D-029 | `source` | gợi ý: rà soát Use Case ngày 2026-09-27 (Context 1) |
| D-029 | Hệ quả | gợi ý: Tốt: người dùng không bị kẹt khi lượt xử lý kéo dài (Rationale 2). Đánh đổi: Architecture phải bảo đảm dừng không để deck dở dang (Reopen When) |
| D-029 | Xác nhận tuân thủ | gợi ý: test dừng giữa lượt xử lý AI, kiểm bản đã chấp nhận không đổi (BR-014) |
| D-030 | `source` | gợi ý: buổi prototype UC-004 và BR-010 (Context 1); chưa có ngày |
| D-030 | Hệ quả | gợi ý: Tốt: hủy yêu cầu trước ranh giới commit không làm đổi trạng thái phiên bản (Rationale 1). Đánh đổi: bản chờ duyệt được chấp nhận ngầm, không có bước xác nhận riêng (Reopen When) |
| D-030 | Xác nhận tuân thủ | gợi ý: test hủy yêu cầu trong bước hỏi lại, kiểm bản vẫn là bản chờ duyệt; test lượt xử lý lỗi sau ranh giới commit, kiểm deck quay về bản vừa chấp nhận |

## glossary

| ID | Field/Section | Gợi ý |
|---|---|---|
| (mới) | Thuật ngữ "ranh giới commit" (6: BR-010, D-030, R-024, R-031, R-046, UC-004) | gợi ý: "Thời điểm ngay trước khi lượt xử lý AI cho một yêu cầu sửa mới bắt đầu; tại đó bản chờ duyệt hiện tại trở thành bản đã chấp nhận (BR-010)". Không dùng: — . Có từ tiếng Anh "commit"; cân nhắc tên tiếng Việt |
| (mới) | Thuật ngữ "lần sửa" (24) / "lượt sửa" (8) | gợi ý: chọn một tên. Hai cụm đang dùng song song, và "lần sửa" có trong định nghĩa GL-008, GL-010, GL-014, GL-015. Quan hệ với "lượt xử lý AI" cần người dùng nói rõ |
| (mới) | Thuật ngữ "sửa theo slide" (5: A-021, BR-011, D-014, D-025, UC-023) | gợi ý: "Lần sửa nhắm vào một slide ở V1, ở mức cố gắng, không đảm bảo; khác sửa cục bộ (D-025, BR-011)". Đang được GL-022 nhắc tới mà chưa định nghĩa |
| (mới) | Thuật ngữ "tập ràng buộc" (4: BR-010, D-030, R-024, UC-004) | gợi ý: "Các ràng buộc của người dùng gắn với một bản deck (BR-010)" |
| (mới) | Thuật ngữ cho Undo (Undo 4: BR-005, D-025, R-016, R-031; "hoàn tác" 1: UC-022) | gợi ý: chọn "hoàn tác" làm thuật ngữ, Không dùng: Undo. Hai tên cho một khái niệm (GX-07) |
| (mới) | Thuật ngữ "thành phần" (16) | gợi ý: "Một phần tử trong slide như tiêu đề, đoạn chữ, hình ảnh, biểu đồ". Đang dùng trong định nghĩa GL-015 |
| (mới) | Thuật ngữ "tài khoản" (11) | gợi ý: "Danh tính người dùng để lưu deck qua nhiều lần làm việc; chỉ có khi DeckAgent có tài khoản (ACT-003)". GL-013 phụ thuộc khái niệm này |
| (mới) | Thuật ngữ "deck đã lưu" (7), "bản sao" (5), "lịch sử" (6) | gợi ý: định nghĩa cùng nhóm tính năng có tài khoản (BR-015, BR-016, UC-012, UC-022) |
| (mới) | Thuật ngữ "vai trò của file" (5) và "hình ảnh để chèn" (3) | gợi ý: "Vai trò của file: tài liệu có sẵn, deck có sẵn, deck mẫu hoặc hình ảnh để chèn, xác định theo mục đích trong yêu cầu (BR-001)" |
| (mới) | Thuật ngữ "audience" (12) | gợi ý: thêm thuật ngữ (giữ "audience" hoặc chọn "người nghe"). Đang dùng trong định nghĩa GL-007, GL-014 |
| (mới) | Thuật ngữ "phạm vi sửa" (3: A-012, BR-004, R-022) | gợi ý: "Phần deck mà một lần sửa được phép thay đổi (BR-004)" |
| (mới) | "lượt tạo" (3), "lượt tải về" (3) | gợi ý: quyết có phải là "lượt xử lý AI" (tạo) và một khái niệm riêng (tải về) không |
| GL-023 | Không dùng: "ứng dụng" (15 item) | gợi ý: "ứng dụng" là bản tiếng Việt của "app" (đã cấm). Thêm vào Không dùng hoặc ghi rõ được dùng khi nói về phần giao diện. Lưu ý GL-012, GL-016 đang dùng "ứng dụng" trong định nghĩa |
