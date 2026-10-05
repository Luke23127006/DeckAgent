# Rewrite log: decisions (Pha B, bước B4)

Item đã viết: D-006, D-007, D-008, D-009, D-012, D-013, D-014, D-015, D-016, D-017, D-024, D-025, D-026, D-027, D-029, D-030, D-031 (17 item). D-001 … D-005, D-010, D-011, D-018, D-023, D-028 đã xóa (`APPLY.md` mục 5), không có file và không được trích.

## Quy ước áp chung

1. "DeckAgent" ngoài câu `Yêu cầu` của Requirement đổi thành "Hệ thống" (BLK-068). Tên sản phẩm và tính năng của bên khác (`PowerPoint`, `Microsoft PowerPoint`, `Canva`, `Figma`, `Google Slides`, `Google Drive`, `LibreOffice`, `Keynote`, `Napkin AI`, `Export All Slides`) và tên nguyên tắc `P1`–`P5` viết trong backtick (BLK-069). Chỉ đổi định dạng thì không ghi từng dòng.
2. `Phương án đã xét` của item Active lấy từ phương án đã nằm sẵn trong Context hoặc Rationale (quyết định 5 của Pha A, GD-03). Không thêm phương án hay lý do mà sheet không có. Mỗi bảng được ghi một dòng ở bảng dưới.
3. `Hệ quả` và `Xác nhận tuân thủ` của 13 item Active từ sheet để `<!-- điền sau: FILL_LATER -->` (FILL_LATER.md mục decisions). D-031 viết đủ theo brief, suy ra từ R-020, R-025, R-026, R-027, R-028, R-058.
4. Item Superseded (D-008, D-016, D-026) chỉ dịch hình thức (GX-15): giữ chữ của Decision, Context, Rationale, Reopen When; giữ heading `Phương án đã xét`, `Hệ quả`, `Xác nhận tuân thủ` với thân trống, như C-001, A-023, UC-005 đã làm.
5. `Reopen When` có từ 2 điều kiện viết thành danh sách đánh số sau câu dẫn "Mở lại D-xxx khi xảy ra một trong các điều kiện sau:" (GX-14); chữ của từng điều kiện giữ như sheet hoặc như quyết định, trừ chỗ ghi ở bảng dưới.
6. Reopen When theo P1d (D-006, D-014, D-017, D-025, D-030, D-031): hai con số "≥ 5 người" và "≥ 2/5 người" mỗi số mang nhãn `[tạm 2026-10-03 · xem lại: buổi thử người dùng đầu tiên với ≥ 5 người thuộc nhóm ACT-001]` (APPLY.md mục 7). Quan sát lấy từ Assumption mà Decision dựa vào khi có: tử số và Signpost của A-021 (D-014, D-025), Signpost 3 của A-020 (D-006), R-027 Acceptance 1 theo A-022 (D-015). Bảng dưới viết tắt nhãn là `[tạm …]`.
7. `source` của item Active từ sheet giữ `[]` (FILL_LATER.md: sheet Decisions không có cột Căn cứ). `short_name` lấy từ `assess-decisions.md` mục 6 ý 16, sửa 5 tên (xem bảng "Tên ngắn").
8. ID Business Rule thêm trong ngoặc ở câu Decision theo BLK-034: D-007 (BR-001), D-009 (BR-007), D-024 mục 2 (BR-009), D-025 mục 3 (BR-011), D-027 mục 2 (BR-012), D-029 (BR-010 mệnh đề 13, 14; đã đối chiếu `05-business-rules/BR-010.md`: mệnh đề 13 quay về bản đã chấp nhận tại ranh giới commit khi lượt bị dừng, mệnh đề 14 lượt bị dừng không tạo bản mới).

## Tên ngắn

| ID | Đề xuất của Pha A | Tên dùng | Căn cứ |
|---|---|---|---|
| D-006 | DeckAgent AI-first, không xây editor slide | Sản phẩm AI-first, không xây editor slide | BLK-068 |
| D-015 | V1 không có editor chỉnh tay web | V1 không ưu tiên editor chỉnh tay web | Giữ đúng nghĩa câu Decision ("không ưu tiên") |
| D-016 | V1 một định dạng sửa được, một chỉ xem | V1: định dạng sửa được và chỉ xem | GD-11 (9 từ → 8 từ) |
| D-027 | V1 chạy trên máy, deck theo lần làm việc | Chạy trên máy, deck theo lần làm việc | GD-11 (9 từ → 8 từ) |
| D-030 | Chấp nhận bản chờ duyệt tại ranh giới commit | Thời điểm chấp nhận bản chờ duyệt | GD-11 (9 từ → 7 từ) |

D-031 giữ tên của khung ("Bốn định dạng tải về của V1", APPLY.md mục 4).

## Viết lại câu

| ID | Section | Câu gốc | Câu mới | Căn cứ |
|---|---|---|---|---|
| D-006 | Decision | DeckAgent là sản phẩm AI-first; không nhằm trở thành editor chỉnh slide chuyên nghiệp. | Hệ thống là sản phẩm AI-first; Hệ thống không nhằm trở thành editor chỉnh slide thay thế `PowerPoint`, `Canva` hay `Figma`. | PLAN.md mục 4 (D-006: danh sách lấy từ Rationale 1), GX-08 ("chuyên nghiệp"), GX-16, BLK-068 |
| D-006 | Context 2 | Chỉnh tay chuyên sâu tiếp tục trong PowerPoint hoặc công cụ chuyên dụng sau khi tải về. | Người dùng tiếp tục chỉnh tay chuyên sâu trong `PowerPoint` hoặc công cụ chuyên dụng sau khi tải về. | GX-16 |
| D-006 | Phương án đã xét | — (Rationale 1: "để project không mở rộng thành việc xây một bản thay thế PowerPoint, Canva hay Figma") | Bảng 2 dòng: chọn sản phẩm AI-first; loại "xây một bản thay thế `PowerPoint`, `Canva` hay `Figma`" vì project mở rộng ra ngoài ranh giới AI-first mà DOC-001, DOC-002 giữ | GD-03, PLAN.md mục 4 (D-006) |
| D-006 | Reopen When | Khi user testing cho thấy AI-first không mang lại giá trị cho người dùng nếu thiếu chỉnh sửa sâu trong ứng dụng, hoặc hướng sản phẩm chuyển sang công cụ thiết kế chuyên nghiệp. | 1. Trong buổi thử với ≥ 5 người [tạm …] thuộc nhóm ACT-001, ≥ 2/5 người [tạm …] cho biết cách làm AI-first không mang lại giá trị cho họ khi Hệ thống không có chỉnh tay chuyên sâu. 2. Hướng sản phẩm chuyển sang công cụ thiết kế thay thế `PowerPoint`, `Canva` hay `Figma`. | P1d, BLK-017, GD-07, GX-14, GX-08 ("chuyên nghiệp" thay bằng danh sách như câu Decision); "chỉnh sửa sâu trong ứng dụng" → "chỉnh tay chuyên sâu" (định nghĩa ở A-020, BLK-006) |
| D-007 | Decision | Vai trò của file được xác định theo mục đích sử dụng, không suy ra cứng từ đuôi file. | Vai trò của file được xác định theo mục đích sử dụng, không suy ra cứng từ đuôi file (BR-001). | BLK-034, BLK-041 (giữ nguyên chữ) |
| D-007 | Phương án đã xét | — (Rationale 1) | Bảng 2 dòng: chọn xác định vai trò theo mục đích; loại "suy vai trò cứng từ đuôi file: PPTX là deck cần sửa, PDF là tài liệu có sẵn, ảnh là hình để chèn" vì nhiều luồng hợp lệ bị khóa ngay từ đầu | GD-03, PLAN.md mục 4 (D-007) |
| D-007 | Reopen When | Khi phạm vi sản phẩm được cố ý thu hẹp tới mức mỗi loại file chỉ có một vai trò và team chấp nhận đánh đổi đó. | Phạm vi sản phẩm được cố ý thu hẹp tới mức mỗi loại file chỉ có một vai trò, và team chấp nhận việc nhiều luồng hợp lệ bị khóa ngay từ đầu. | GX-17 ("đánh đổi đó" → danh từ, lấy từ Rationale 1), PLAN.md mục 4 (D-007) |
| D-009 | Decision | Khi tải về nhiều định dạng, DeckAgent ưu tiên giữ nội dung cốt lõi, số liệu, mạch trình bày và ý nghĩa; không yêu cầu giống từng pixel. | Khi tải về nhiều định dạng, Hệ thống ưu tiên giữ nội dung cốt lõi, số liệu, mạch trình bày và ý nghĩa; không yêu cầu giống từng pixel (BR-007). | BLK-034, BLK-068 |
| D-009 | Phương án đã xét (từ Context 2) | Yêu cầu mọi file giống hệt nhau về pixel, font, khả năng sửa, tương tác hoặc animation là không thực tế. | Bảng 2 dòng: chọn giữ nội dung cốt lõi, số liệu, mạch trình bày, ý nghĩa; loại "yêu cầu mọi file giống hệt nhau về pixel, font, khả năng sửa, tương tác hoặc animation" vì không thực tế (Context 1) | GD-03, PLAN.md mục 4 (D-009) |
| D-009 | Reopen When | Khi một định dạng hoặc use case cụ thể cần độ giống hình ảnh hoặc hành vi cao hơn, hoặc yêu cầu đồ án thay đổi. | 1. Một định dạng hoặc use case cụ thể cần độ giống hình ảnh hoặc hành vi cao hơn. 2. Danh sách định dạng tải về của D-031 thay đổi. | CX-3 (APPLY.md mục 2, mục 7), BLK-017, GX-14 |
| D-012 | Phương án đã xét (từ Context 2) | V1 không cố chứng minh toàn bộ tầm nhìn sản phẩm cùng lúc. | Bảng 2 dòng: chọn chứng minh luồng AI-first tạo deck từ đầu tới cuối; loại "chứng minh toàn bộ tầm nhìn sản phẩm cùng lúc trong V1" vì không cho V1 mục tiêu hẹp mà Context 1 cần | GD-03, PLAN.md mục 4 (D-012) |
| D-012 | Rationale / Evidence 1 | V1 chứng minh người dùng đưa yêu cầu hoặc tài liệu có sẵn, nhận deck, xem trước, sửa bằng AI và tải về file dùng được. | V1 chứng minh người dùng đưa yêu cầu hoặc tài liệu có sẵn, nhận deck, xem trước, sửa bằng AI và tải về file dùng được (R-027). | GX-08 (từ "dùng được" kèm ID định nghĩa), PLAN.md mục 4 (D-012) |
| D-012 | Reopen When | Khi luồng ưu tiên tạo mới không còn đại diện cho hướng sản phẩm, hoặc evidence cho thấy luồng khác cần ưu tiên hơn. | 1. Luồng ưu tiên tạo mới không còn đại diện cho hướng sản phẩm. 2. Evidence cho thấy một luồng khác cần ưu tiên hơn luồng ưu tiên tạo mới. | GX-14, GX-08 (so sánh có mốc) |
| D-013 | Decision | Sửa deck có sẵn không thuộc luồng chính của V1; capability này để Later. | V1 không đưa sửa deck có sẵn vào luồng chính; sửa deck có sẵn thuộc release Later. | GD-01 (bắt đầu bằng phạm vi), GX-17, PLAN.md mục 4 (D-013) |
| D-013 | Context 2 | V1 không gánh chi phí của việc giữ bố cục khi nhập và sửa cục bộ. | Nhập và sửa deck có sẵn kéo theo chi phí giữ bố cục khi nhập và khi sửa cục bộ. | GD-02 (Context trung tính; lựa chọn chuyển sang `Phương án đã xét`), PLAN.md mục 4 (D-013) |
| D-013 | Phương án đã xét | — (Context 2, Rationale 1, 2) | Bảng 2 dòng: chọn V1 ưu tiên tạo mới, sửa deck có sẵn thuộc Later; loại "V1 gồm nhập và sửa deck có sẵn" vì chi phí giữ bố cục (Context 2) và nhiều phụ thuộc chưa cần cho acceptance của V1 (Rationale 2) | GD-03, PLAN.md mục 4 (D-013) |
| D-013 | Reopen When | Khi evidence người dùng cho thấy sửa deck có sẵn là bắt buộc để V1 có giá trị, hoặc chỉ tạo mới không đại diện được DeckAgent. | 1. Evidence người dùng cho thấy sửa deck có sẵn là bắt buộc để V1 có giá trị. 2. Luồng chỉ tạo mới không đại diện được Hệ thống. | GX-14, GX-16, BLK-068 |
| D-014 | Decision | V1 chỉ cam kết AI sửa cả deck; không cam kết sửa cục bộ từng thành phần. | V1 chỉ cam kết AI sửa cả deck; V1 không cam kết sửa cục bộ từng thành phần. | GX-16 |
| D-014 | Rationale / Evidence 2 | Tránh kéo V1 vào việc định danh từng thành phần, sửa vá cục bộ và độ phức tạp của việc giữ nguyên phần ngoài phạm vi. | Chỉ sửa cả deck tránh kéo V1 vào việc định danh từng thành phần, sửa vá cục bộ và độ phức tạp của việc giữ nguyên phần ngoài phạm vi. | GX-16 |
| D-014 | Phương án đã xét | — (Rationale 1, 2) | Bảng 2 dòng: chọn chỉ cam kết sửa cả deck; loại "cam kết sửa cục bộ từng thành phần trong V1" vì lý do ở Rationale 2 | GD-03, PLAN.md mục 4 (D-014) |
| D-014 | Reopen When | Khi người dùng không đạt deck dùng được nếu thiếu sửa theo slide hoặc thành phần, hoặc sửa cả deck làm mất kiểm soát rõ rệt. | 1. Trong buổi thử với ≥ 5 người [tạm …] thuộc nhóm ACT-001, ≥ 2/5 người [tạm …] không đạt deck dùng được chỉ bằng sửa cả deck. 2. Trong buổi thử ở điều kiện 1, ≥ 2/5 người [tạm …] cho biết sửa cả deck làm mất kiểm soát deck. | P1d, BLK-017, P1c ("deck dùng được"), GD-07, GX-08 ("rõ rệt" thay bằng ngưỡng); quan sát theo tử số và Signpost 2 của A-021 |
| D-015 | Decision | V1 không ưu tiên editor chỉnh tay trên web; chỉnh tay chuyên sâu làm sau khi tải về bằng PowerPoint hoặc công cụ chuyên dụng. | V1 không ưu tiên editor chỉnh tay trên web; người dùng chỉnh tay chuyên sâu sau khi tải về, bằng `PowerPoint` hoặc công cụ chuyên dụng. | GX-16, GD-01 |
| D-015 | Context 2 | V1 không dành nguồn lực xây canvas hoặc editor chuyên nghiệp. | V1 không dành nguồn lực xây canvas hoặc editor chỉnh tay trên web (C-002). | PLAN.md mục 4 (D-015: "editor chỉnh tay trên web" thay "chuyên nghiệp"), GX-08, BLK-020 (C-002 là giới hạn nguồn lực mà D-015 dựa vào) |
| D-015 | Phương án đã xét | — (Context 2, Rationale 1, 2) | Bảng 2 dòng: chọn không ưu tiên editor chỉnh tay trên web; loại "xây canvas hoặc editor chỉnh tay trên web trong V1" vì Context 2 và Rationale 2 | GD-03, PLAN.md mục 4 (D-015) |
| D-015 | Reopen When | Khi file PPTX bàn giao không dùng được, hoặc user testing cho thấy chỉnh tay trong ứng dụng là điều kiện cần để hoàn thành luồng chính. | 1. File PPTX tải về không đạt R-027 Acceptance 1: không mở được, hoặc không sửa được chữ, hình khối và bảng trong `Microsoft PowerPoint`. 2. Buổi thử người dùng cho thấy chỉnh tay trong Hệ thống là điều kiện cần để hoàn thành luồng chính. | Brief (quan sát theo Signpost của A-022, R-027), Q2, GX-08 ("dùng được"), GX-14, BLK-068 |
| D-016 | Rationale / Evidence 2 | Được thay bằng D-026 sau khi W-026 chốt PPTX và PDF và làm rõ hướng tương thích. | Được thay bằng D-026 sau khi chốt PPTX và PDF và làm rõ hướng tương thích. | P8 (BLK-063: W-xxx chỉ giữ khi làm nơi xử lý), GX-15 (chỉ hình thức), PLAN.md mục 4 (D-016) |
| D-017 | Decision | Critical behavior của V1 là P1 Source Fidelity, P2 User Intent Fidelity, P3 Presentation Quality và P5 Output Fidelity; P4 Safe Refinement không phải hard acceptance. | Critical behavior của V1 là `P1 Source Fidelity`, `P2 User Intent Fidelity`, `P3 Presentation Quality` và `P5 Output Fidelity`; `P4 Safe Refinement` không phải hard acceptance của V1. | BLK-069, GD-01 (vế 2 nêu phạm vi V1 như vế 1) |
| D-017 | Phương án đã xét (từ Rationale 2) | P4 phụ thuộc nhiều vào sửa cục bộ và sửa deck có sẵn nên để Later. | Bảng 2 dòng: chọn `P1`, `P2`, `P3`, `P5` là critical behavior; loại "`P4 Safe Refinement` là hard acceptance của V1" vì `P4` phụ thuộc nhiều vào sửa cục bộ và sửa deck có sẵn, hai năng lực để Later. Rationale 2 giữ nguyên | GD-03, PLAN.md mục 4 (D-017) |
| D-017 | Reopen When | Khi Testing hoặc evidence người dùng cho thấy P4 là điều kiện cần cho V1 dùng được, hoặc một critical behavior hiện tại không còn liên quan luồng chính. | 1. Trong buổi thử với ≥ 5 người [tạm …] thuộc nhóm ACT-001, ≥ 2/5 người [tạm …] không đạt deck dùng được khi Hệ thống không đáp ứng `P4 Safe Refinement`. 2. Một trong `P1`, `P2`, `P3`, `P5` không còn liên quan tới luồng chính của V1. | P1d, BLK-017, GD-07, GX-08 ("V1 dùng được" → "deck dùng được"); xem Không áp rõ 4 |
| D-024 | Decision 2 | Mỗi deck dùng một tài liệu có sẵn. | Mỗi deck dùng một tài liệu có sẵn (BR-009). | BLK-034, BLK-041 (giữ nguyên chữ) |
| D-024 | Context 1 | W-026 cần chốt loại tài liệu để Architecture không phải tự đoán. | Architecture cần danh sách loại tài liệu có sẵn đã chốt để không phải tự đoán. | P8 (BLK-062, BLK-063: W-026 không làm nơi xử lý nên bỏ mã), GX-16, `assess-decisions.md` mục 5 |
| D-024 | Phương án đã xét (từ Rationale 2) | OCR, XLSX/CSV, hiểu ảnh, URL, nhiều tài liệu cho một deck và dùng lại ảnh nhúng được giữ làm câu hỏi ở L-001. | Bảng 4 dòng: chọn 5 loại tài liệu đọc trực tiếp được, một tài liệu cho mỗi deck, không tách ảnh nhúng; loại (để sau V1, còn là câu hỏi mở) "OCR, XLSX/CSV, hiểu ảnh hoặc URL", "nhiều tài liệu có sẵn cho một deck", "tách hoặc dùng lại ảnh nhúng" | GD-03, P8 (BLK-062: bỏ mã L-001, giữ kết luận; R-017, BR-009 trỏ tới kết luận này), PLAN.md mục 4 (D-024) |
| D-024 | Reopen When | Sau demo V1 đầu tiên, khi feedback của advisor hoặc evidence implementation cho thấy một loại tài liệu đang để sau cần được ưu tiên. | Sau demo V1 đầu tiên, phản hồi của advisor hoặc evidence implementation cho thấy một loại tài liệu đang để sau cần được ưu tiên. | Việt hóa "feedback" (cùng cách D-030 ở PLAN.md mục 5) |
| D-025 | Decision 3 | Yêu cầu nhắm vào một slide được xử lý theo cách cố gắng, không đảm bảo. | Yêu cầu nhắm vào một slide được xử lý theo cách cố gắng, không đảm bảo (BR-011). | BLK-034, BLK-041 (giữ nguyên chữ) |
| D-025 | Context 1 | W-026 cần xác định tối thiểu các loại sửa mà không mở sửa cục bộ hay lịch sử nhiều bản. | V1 cần xác định tối thiểu các loại sửa mà không mở sửa cục bộ hay lịch sử nhiều bản. | P8 (BLK-062, BLK-063), GX-16 |
| D-025 | Rationale / Evidence 3 | Sửa theo slide không mở lại D-014, và giới hạn phải được báo cho người dùng. | Sửa theo slide không mở lại D-014; Hệ thống báo giới hạn của sửa theo slide cho người dùng theo BR-011. | GX-10 (BR-011 sở hữu quy tắc báo trước), GX-16, PLAN.md mục 4 (D-025) |
| D-025 | Phương án đã xét (từ Context 1, Rationale 1, 2, 4) | Rationale 4: Dịch deck là capability tương lai đã chắc chắn; đổi phong cách cả deck và hình do AI tạo cần học thêm (L-002). | Bảng 5 dòng: chọn 7 loại sửa, bỏ lần sửa gần nhất, sửa theo slide ở mức cố gắng; loại sửa cục bộ (Rationale 1, 3), Undo nhiều bước hoặc lịch sử nhiều bản (Rationale 2), dịch deck trong V1 (năng lực tương lai đã chắc chắn, không thuộc V1), đổi phong cách cả deck và hình do AI tạo (còn cần tìm hiểu thêm) | GD-03, P8 (BLK-062: bỏ mã L-002, giữ kết luận; R-047, UC-017 trỏ tới kết luận này), PLAN.md mục 4 (D-025) |
| D-025 | Reopen When | Khi demo hoặc testing cho thấy sửa cả deck không giúp người dùng đạt deck dùng được, người dùng phụ thuộc nhiều vào sửa cục bộ, hoặc bỏ một bước không bảo vệ được bản dùng được. | 1. Trong buổi thử với ≥ 5 người [tạm …] thuộc nhóm ACT-001, ≥ 2/5 người [tạm …] không đạt deck dùng được chỉ bằng sửa cả deck. 2. Trong buổi thử ở điều kiện 1, ≥ 2/5 người [tạm …] phải gửi yêu cầu sửa nhắm vào từng slide hoặc thành phần. 3. Demo hoặc test cho thấy việc bỏ lần sửa gần nhất không đưa deck về bản đã chấp nhận trước đó. | P1d, BLK-017, P1c, GD-07, GX-08 ("phụ thuộc nhiều"); quan sát theo tử số và Signpost 1 của A-021; xem Không áp rõ 5 |
| D-026 | Context 1 | W-026 cần chốt định dạng sửa được và chỉ xem để Architecture và Testing có ranh giới cụ thể. | Cần chốt định dạng sửa được và định dạng chỉ xem để Architecture và Testing có ranh giới cụ thể. | P8 (BLK-063), GX-15 (chỉ hình thức), `assess-decisions.md` mục 5 |
| D-026 | Ghi chú 1 | — (thêm mới) | Superseded 2026-10-03: thay bằng D-031. | Q1, APPLY.md mục 1, 2, brief; xem Không áp rõ 2 |
| D-027 | Decision 2 | Deck chỉ tồn tại trong lần làm việc đang mở; chưa mở lại được deck qua nhiều lần làm việc. | Deck chỉ tồn tại trong lần làm việc đang mở; chưa mở lại được deck qua nhiều lần làm việc (BR-012). | BLK-034, BLK-041 (giữ nguyên chữ) |
| D-027 | Context 1 | Cần làm rõ môi trường chạy và ranh giới trạng thái để W-028 không phải tự giả định triển khai cloud hay lưu trữ lâu dài. | Architecture cần môi trường chạy và ranh giới trạng thái đã chốt để không phải tự giả định về triển khai và lưu trữ. | P8 (BLK-063: W-028 → "Architecture"), GX-16, GD-02 (phương án cloud, lưu trữ lâu dài chuyển sang `Phương án đã xét`), PLAN.md mục 4 (D-027) |
| D-027 | Phương án đã xét | — (Context 1, Rationale 1–3) | Bảng 4 dòng: chọn ứng dụng web chạy trên máy, deck trong lần làm việc; loại triển khai cloud (Rationale 1, 3), lưu trữ deck lâu dài (Rationale 2), nhiều người dùng (Rationale 3) | GD-03, PLAN.md mục 4 (D-027) |
| D-027 | Reopen When | Sau demo V1, khi có nhu cầu làm tiếp deck qua nhiều lần làm việc, quản lý project hoặc lịch sử, hoặc cần host ngoài máy người dùng. | Mở lại D-027 khi, sau demo V1, xuất hiện một trong các nhu cầu sau: 1. Làm tiếp deck qua nhiều lần làm việc. 2. Quản lý project hoặc lịch sử. 3. Host Hệ thống ngoài máy người dùng. | GX-14 |
| D-029 | Decision | V1 cho người dùng dừng lượt xử lý AI tạo hoặc sửa deck đang chạy; dừng không làm thay đổi bản đã chấp nhận. | V1 cho người dùng dừng lượt xử lý AI tạo hoặc sửa deck đang chạy; dừng không làm thay đổi bản đã chấp nhận (BR-010 mệnh đề 13, 14). | BLK-034, BLK-035 (BR-010 sở hữu vòng đời; BR-014 mục 2 chỉ còn tóm tắt), brief |
| D-029 | Context 1 | Ngày 27/09/2026, rà soát Use Case thêm luồng dừng lượt xử lý AI vào UC-014. | Ngày 2026-09-27, đợt rà soát Use Case thêm luồng dừng lượt xử lý AI vào UC-014. | GX-18, GX-16 |
| D-029 | Context 2 | Chưa có Decision hay Requirement nào làm căn cứ cho luồng này. | Chưa có Decision hay Requirement nào làm căn cứ cho luồng dừng lượt xử lý AI. | GX-17 |
| D-029 | Ghi chú 1 (từ Context 3) | DOC-004 và DOC-008 chưa phản ánh capability này. | DOC-004 và DOC-008 chưa phản ánh việc dừng lượt xử lý AI. | GX-12 (việc để sau), GX-17, PLAN.md mục 4 (D-029) |
| D-029 | Rationale / Evidence 1 | Chi phí thấp, gắn trực tiếp với R-030 (hiển thị tiến độ) và R-032 (xử lý lỗi bên ngoài). | Việc dừng lượt xử lý AI có chi phí thấp, gắn trực tiếp với R-030 (hiển thị tiến độ) và R-032 (xử lý lỗi bên ngoài). | GX-16 |
| D-029 | Rationale / Evidence 3 | Giữ đúng R-031: dừng không để lại deck dở dang. | Việc dừng giữ đúng R-031: dừng không để lại deck dở dang. | GX-16 |
| D-029 | Phương án đã xét (từ Rationale 4) | Phương án bị loại: bắt người dùng chờ tới khi xong hoặc lỗi. | Bảng 2 dòng: chọn cho người dùng dừng lượt xử lý AI; loại "bắt người dùng chờ tới khi lượt xử lý AI xong hoặc lỗi" vì người dùng bị kẹt khi lượt xử lý kéo dài hoặc đi sai hướng (Rationale 2) | GD-03, PLAN.md mục 4 (D-029) |
| D-029 | Reopen When | Khi Architecture cho thấy dừng giữa chừng để lại deck ở trạng thái không xác định, hoặc khi lượt tải về cũng cần dừng được. | 1. Architecture cho thấy dừng giữa chừng để lại deck ở trạng thái không xác định. 2. Lượt tải về cũng cần dừng được. | GX-14 |
| D-030 | Decision | (7 câu, 838 ký tự, xem `assess-decisions.md` mục 4) | 1. Bản chờ duyệt được chấp nhận tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu. 2. Ranh giới commit chỉ đạt sau khi các bước hỏi lại, cảnh báo hoặc xác nhận hoàn tất. Chi tiết theo BR-010. | BLK-034 (P3), GD-01, GD-10 |
| D-030 | Context 1 | Khi prototype hóa UC-004 và BR-010, phát hiện cụm "gửi yêu cầu sửa tiếp" chưa xác định chính xác thời điểm bản chờ duyệt được chấp nhận. | Khi prototype UC-004 và BR-010, team phát hiện cụm "gửi yêu cầu sửa tiếp" chưa xác định thời điểm bản chờ duyệt trở thành bản đã chấp nhận. | GX-16, GD-02, PLAN.md mục 5 (D-030) |
| D-030 | Context 2 | Hai cách hiểu khả dĩ là chấp nhận ngay khi user gửi request, hoặc chỉ chấp nhận khi request đã qua clarification/confirmation và thực sự được commit để bắt đầu lượt sửa mới. | Câu hỏi cần trả lời: bản chờ duyệt được chấp nhận vào thời điểm nào khi người dùng gửi yêu cầu sửa tiếp. Hai cách hiểu chuyển thành 2 dòng của `Phương án đã xét`, lý do lấy từ Rationale 1, 2 | GD-02, GD-03, GX-07, PLAN.md mục 5 (D-030) |
| D-030 | Rationale / Evidence 1 | Chọn thời điểm commit muộn hơn để việc hỏi lại, cảnh báo hoặc hủy request không tự làm thay đổi trạng thái version. | Thời điểm commit muộn hơn giúp việc hỏi lại, cảnh báo hoặc hủy yêu cầu không tự làm thay đổi trạng thái phiên bản. | GX-07, PLAN.md mục 5 (D-030) |
| D-030 | Rationale / Evidence 2 | Giữ quyền kiểm soát cho người dùng: Cancel trước khi AI bắt đầu không đồng nghĩa với việc chấp nhận bản đang chờ duyệt. | Người dùng giữ quyền kiểm soát: hủy yêu cầu trước khi AI bắt đầu không đồng nghĩa với chấp nhận bản chờ duyệt. | GX-07, GX-16, PLAN.md mục 5 (D-030) |
| D-030 | Rationale / Evidence 3 | Tạo ranh giới rõ giữa việc người dùng thể hiện ý định và việc một lượt sửa mới thực sự bắt đầu. | Có ranh giới giữa việc người dùng gửi yêu cầu sửa và việc một lượt sửa mới thực sự bắt đầu. | GX-07 ("ý định" của glossary là chủ đề, mục đích, audience), GX-08, PLAN.md mục 5 (D-030) |
| D-030 | Rationale / Evidence 4 | Làm rollback và constraint lifecycle dễ xác định hơn: pre-flight không đổi version state, commit mới tạo baseline mới. | Việc quay về bản đã chấp nhận và vòng đời của ràng buộc của người dùng dễ xác định hơn: các bước trước ranh giới commit không đổi trạng thái phiên bản; chỉ ranh giới commit tạo bản đã chấp nhận mới. | GX-07, GX-14 (tách dòng 3, 4 đang dính nhau), PLAN.md mục 5 (D-030) |
| D-030 | Reopen When | Khi testing hoặc feedback người dùng cho thấy việc giữ bản ở trạng thái chờ duyệt trong các bước clarification/confirmation gây khó hiểu, hoặc khi lifecycle revision được thay đổi theo cách không còn cần bước implicit accept trước lượt sửa tiếp. | 1. Trong buổi thử với ≥ 5 người [tạm …] thuộc nhóm ACT-001, ≥ 2/5 người [tạm …] cho biết việc giữ bản chờ duyệt trong các bước hỏi lại và xác nhận gây khó hiểu cho họ. 2. Vòng đời bản deck do BR-010 quy định thay đổi tới mức lượt sửa tiếp không còn cần bước chấp nhận ngầm bản chờ duyệt. | P1d, BLK-017, GD-07, GX-07, BLK-035 (BR-010 sở hữu vòng đời bản deck) |
| D-031 | Decision | — (mới) | 1. V1 tải về 4 định dạng: PPTX (sửa được trong `Microsoft PowerPoint`); PDF (in, lưu trữ, chia sẻ); PNG (mỗi slide một ảnh, đóng gói thành file .zip); SVG (mỗi slide một ảnh vector, đóng gói thành file .zip). 2. Release Later: Hệ thống đẩy deck vào `Google Drive` của người dùng dưới dạng file `Google Slides`; người dùng đăng nhập Google để cấp quyền. | Q1, APPLY.md mục 2, 4 |
| D-031 | Context | — (mới) | 1. D-026 chỉ có 2 định dạng tải về: PPTX và PDF. 2. Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định (C-003). 3. Danh sách định dạng tải về là lựa chọn của team, không phải yêu cầu áp từ môn học hay advisor. | Q1, APPLY.md mục 2; dòng 2 lấy nguyên câu Lý do 3 (sheet) của C-003 |
| D-031 | Phương án đã xét | — (mới) | Bảng 3 dòng: loại giữ 2 định dạng của D-026; chọn 4 định dạng theo benchmark `Napkin AI`; loại cho V1 (đưa sang release Later) việc đẩy lên `Google Drive` dạng `Google Slides`, vì cần đăng nhập Google mà V1 không có tài khoản (D-027) | Brief (GD-03, chỉ phương án có căn cứ), Q1 |
| D-031 | Rationale / Evidence | — (mới) | 1. `Benchmark Napkin AI 2026-10-03`: hộp thoại `Export All Slides` của `Napkin AI` gồm `PowerPoint`, `Google Slides`, PDF, `PNGs`, `SVGs`. 2. V1 lấy 4 định dạng tương ứng trong danh sách đó. 3. Đẩy deck vào `Google Drive` dạng `Google Slides` cần đăng nhập Google; V1 không có tài khoản (D-027), nên việc này thuộc release Later. | APPLY.md mục 2, mục 7 ý 4, Q1 |
| D-031 | Hệ quả | — (mới) | 1 dòng Tốt (người dùng tải deck về theo mục đích, R-027); 4 dòng Đánh đổi: tạo và kiểm 4 loại file (R-027); kiểm nhất quán trên 4 định dạng (R-025); danh sách phần bị mất hoặc đổi còn chờ kết quả test, R-026 và R-028 ở Proposed; đẩy lên `Google Drive` cần đăng nhập Google, kéo theo mở lại D-027 và thêm luồng vào R-042 (R-058) | GD-05, brief |
| D-031 | Xác nhận tuân thủ | — (mới) | 8 dòng: vế 1 review UC-008 bước 2 (đúng 4 định dạng) và test R-027 Acceptance 1–4 (từng định dạng); đánh đổi nhất quán: test R-025 Acceptance 1; đánh đổi phần bị mất hoặc đổi: test R-026 Acceptance 2; vế 2 "Không áp dụng cho V1" (R-058 Later, Proposed) | GD-06, brief |
| D-031 | Reopen When | — (mới) | 1. Buổi thử người dùng đầu tiên với ≥ 5 người [tạm …] thuộc nhóm ACT-001 cho thấy ≥ 2/5 người [tạm …] cần một định dạng ngoài danh sách. 2. R-058 được đưa vào release V1. | APPLY.md mục 7 ý 4, BLK-004, GX-14 (tách tại "hoặc", giữ chữ) |

D-008: không viết lại câu nào (GX-15).

## Chuyển chỗ

| ID | Từ cột sheet | Sang section |
|---|---|---|
| 16 item từ sheet | Decision, Context, Rationale / Evidence, Reopen When | Section cùng tên |
| 16 item từ sheet | Date, Recorded By | `date`, `decided_by` |
| 16 item từ sheet | Requirement chính, Assumption chính, Detailed Doc | `addresses`, `assumptions`, `documents` (đã có ở khung B3) |
| D-024 | Rationale / Evidence 3 ("D-007 vẫn Active: …") | `Ghi chú` 1 (lưu ý khi đọc, GX-12; PLAN.md mục 4) |
| D-029 | Context 3 | `Ghi chú` 1 (việc để sau, GX-12; câu đã viết lại, xem bảng trên) |
| D-009, D-012 | Context 2 | `Phương án đã xét` (xem bảng trên) |
| D-024, D-025, D-029 | Rationale / Evidence 2 (D-024), 4 (D-025, D-029) | `Phương án đã xét` (xem bảng trên) |

Cột bỏ: Related Work (W-xxx, bảng ánh xạ của Pha A).

## Sửa quan hệ

| ID | Field | Khung | Sau | Căn cứ |
|---|---|---|---|---|
| D-008 | `superseded_by` | `[]` | `[D-013]` | GD-09 và `schema.json` (`superseded_by` bắt buộc khi Superseded, tầng CI); PLAN.md mục 4 và mục 5 (D-008: "lấy từ Rationale 2 và Reopen When") |
| D-016 | `superseded_by` | `[]` | `[D-026]` | GD-09, `schema.json`; PLAN.md mục 4 (D-016: "lấy từ Rationale 2 và Reopen When") |

Khung B3 bỏ sót hai giá trị này; sheet ghi Decision thay thế ngay trong Rationale và Reopen When của hai item. Không đổi quan hệ nào khác.

## Cần sửa ở loại khác

1. R-017 (requirements): Ghi chú 1 ghi "Kết luận về hiểu ảnh, dùng ảnh làm asset và dùng lại ảnh nhúng nằm ở D-024". D-024 chỉ có kết luận về hiểu ảnh và dùng lại ảnh nhúng (Rationale 2 của sheet); "dùng ảnh làm asset" không có trong D-024. Nên bỏ "dùng ảnh làm asset" khỏi câu, hoặc chỉ ra item khác giữ kết luận đó.
2. `_FILL_LATER.md` (B5): dòng D-026 `Hệ quả`, `Xác nhận tuân thủ` không còn áp dụng vì D-026 đã Superseded. Dòng D-009 `Xác nhận tuân thủ` gợi ý "giữa PPTX và PDF" cần mở rộng theo 4 định dạng của D-031. Thêm dòng D-031 `documents` theo APPLY.md mục 7 ý 4.
3. Glossary (B5): D-006, D-015 dùng "chỉnh tay chuyên sâu" theo định nghĩa ở A-020 (BLK-006); nên đưa vào glossary cùng các thuật ngữ đã có trong FILL_LATER.md ("ranh giới commit", "sửa theo slide", "tập ràng buộc", Undo). D-017 còn dùng "critical behavior", "hard acceptance"; D-006, D-012, D-015 dùng "AI-first" (`assess-decisions.md` mục 6 ý 11).

## Không áp rõ

1. **D-008, D-016: thêm `superseded_by`.** Brief chỉ cho sửa quan hệ khi một quyết định nói rõ. Căn cứ đã dùng là PLAN.md mục 4 cộng GD-09 (CI chặn nếu thiếu).
   - Phương án: (a) giữ như đã làm; (b) trả về `[]` và để agent chính sửa khung.
   - Đề xuất: (a).
2. **D-026 Ghi chú đóng.** Brief ghi "thay bằng D-031 ngày 2026-10-03 theo Q1". Đã viết "Superseded 2026-10-03: thay bằng D-031." và bỏ "theo Q1", vì Q1 là mã của `_migration/` sẽ bị xóa ở B7 và GX-12 không cho ghi nguồn trong Ghi chú (ghi chú đóng của C-003, A-023 cũng không ghi Q1).
   - Phương án: (a) giữ như đã làm; (b) thêm "theo Q1".
   - Đề xuất: (a).
3. **D-006: quan sát theo A-022.** Brief gộp D-006 với D-015 cho quan sát "file PPTX bàn giao không dùng được", nhưng Reopen When của D-006 trong sheet không có vế về file PPTX. Đã không thêm vế đó; vế user test viết theo Signpost 3 của A-020 ("chỉnh tay chuyên sâu").
   - Phương án: (a) giữ như đã làm; (b) thêm vế "File PPTX tải về không đạt R-027 Acceptance 1" như D-015 (thêm thông tin so với sheet).
   - Đề xuất: (a).
4. **D-017 Reopen When.** "P4 là điều kiện cần cho V1 dùng được" được viết thành "không đạt deck dùng được khi Hệ thống không đáp ứng `P4 Safe Refinement`". "Testing hoặc evidence người dùng" thu về buổi thử của P1d, nên mất nguồn quan sát "Testing".
   - Phương án: (a) giữ như đã làm; (b) thêm điều kiện "Kết quả test cho thấy …" không có ngưỡng.
   - Đề xuất: (a); người review xác nhận cách hiểu "V1 dùng được" = "deck dùng được".
5. **D-025 Reopen When vế 3.** "bỏ một bước không bảo vệ được bản dùng được" được hiểu là "bỏ lần sửa gần nhất không đưa deck về bản đã chấp nhận trước đó" (Decision mục 2). Vế này là kết quả demo hoặc test, không phải quan sát người dùng, nên không gắn ngưỡng P1d.
   - Đề xuất: người review xác nhận "bản dùng được" = bản đã chấp nhận.
6. **Câu Decision giữ thể bị động.** D-007, D-024 mục 3, D-025 mục 3 và D-030 (theo chữ của ô Quyết định BLK-034) giữ thể bị động, nên GD-01 và GX-16 có thể bị nêu ở Review. Riêng D-009 đã đổi "DeckAgent" → "Hệ thống" (BLK-068) dù BLK-034 ghi "giữ nguyên chữ".
   - Phương án: (a) giữ; (b) đổi sang thể chủ động với chủ ngữ "Hệ thống" (đổi chữ, trái BLK-034, BLK-041).
   - Đề xuất: (a).
7. **D-029: `shapes` chỉ có BR-014.** Câu Decision nay trỏ BR-010 mệnh đề 13, 14 (brief, BLK-035), còn BR-014 mục 2 chỉ là tóm tắt kèm ID BR-010.
   - Phương án: (a) thêm BR-010 vào `shapes` của D-029; (b) giữ.
   - Đề xuất: (a), để thay đổi D-029 lan tới BR-010. Chưa làm vì không có quyết định nêu rõ.
8. **D-025 mục 2 không thêm ID BR-010.** `rewrite-log-business-rules.md` gợi ý "D-025 mục 2 → BR-010" (mệnh đề 17), nhưng brief và ô Quyết định BLK-034 chỉ nêu D-025 mục 3. Đã không thêm.
   - Đề xuất: thêm "(BR-010 mệnh đề 17)" nếu agent chính đồng ý; không đổi chữ khác.
9. **D-027 Reopen When không nhắc R-058.** Câu hỏi mở 1 của R-058 lấy D-027 làm nơi xử lý khi R-058 vào release; điều kiện 2 của D-031 mở lại D-031 trong trường hợp đó, nhưng D-027 không có điều kiện tương ứng.
   - Phương án: (a) thêm điều kiện "R-058 được đưa vào release" vào D-027; (b) giữ, dựa vào câu hỏi mở của R-058.
   - Đề xuất: (a) nếu người dùng đồng ý (thêm thông tin so với sheet).
10. **Context không trung tính (GD-02).** Context của D-006, D-014 (mục 2), D-017 nêu lựa chọn hơn là câu hỏi. Đã giữ chữ sheet, không tự đặt câu hỏi mới. Review có thể nêu GD-02.
11. **GX-14: dòng dài.** Mỗi Reopen When theo P1d có 2 nhãn `[tạm …]` (khoảng 95 ký tự mỗi nhãn), nên dòng điều kiện dài 300–340 ký tự. Nhãn là bắt buộc (`_COMMON_CRITERIA.md` mục 7). D-031 Decision mục 1 dài 208 ký tự.
12. **GD-05, GD-06 với 13 item Active từ sheet.** `Hệ quả` và `Xác nhận tuân thủ` để "điền sau" theo FILL_LATER.md, nên CI (section có nội dung) sẽ trượt cho tới khi B5 hoặc người dùng điền, giống tình trạng C-002, C-004 ở `rewrite-log-constraints.md`.
