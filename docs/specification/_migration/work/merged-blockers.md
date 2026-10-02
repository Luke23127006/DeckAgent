# Blocker gộp từ nhiều loại (ID tạm M-xx; đánh số BLK ở A6)

Mỗi blocker dưới đây thay cho các blocker cục bộ ghi ở dòng "Gộp từ". Tham chiếu tới ID cục bộ cũ được đổi sang BLK của blocker gộp.

### M-01 · SO_LIEU · Ngưỡng quá thời gian và trạng thái kết thúc của lượt xử lý AI
- Gộp từ: ACT-L04, UC-L02, R-L08
- Item: R-030, R-032 (Active); R-037 (Proposed); ACT-002; UC-001 (4B), UC-002 (5C), UC-004 (3B), UC-014 (2B, Câu hỏi mở 2)
- Tiêu chí: GX-09, GX-08, GR-09, GUC-11, GUC-18, GACT-05
- Hiện trạng:
  - R-032 Ghi chú: "Ngưỡng quá thời gian và số lần thử lại chưa được chốt (D-011)." Acceptance: "trạng thái lượt xử lý xác định", không có danh sách trạng thái.
  - R-030: "lượt xử lý kéo dài", "Lỗi thường gặp có thông báo…". R-037 Ghi chú: "Giá trị giới hạn chỉ đặt sau benchmark (D-011)."
  - UC-014 Câu hỏi mở 2: "Ngưỡng quá thời gian là bao nhiêu? (đặt sau benchmark, D-011)". Các nhánh UC ghi "AI lỗi hoặc quá thời gian".
  - ACT-002 Needs 1 "nhà cung cấp chậm, lỗi, …"; Constraints 1 "Có thể lỗi hoặc quá thời gian (R-032)".
- Điều chưa biết hoặc cần chọn:
  1. Con số: thời gian tối đa của một lượt xử lý, số lần thử lại, mốc "kéo dài", danh sách "lỗi thường gặp", danh sách trạng thái kết thúc, giới hạn tài nguyên của R-037.
  2. Nơi sở hữu con số (đề xuất: R-032; Use Case và Actor chỉ tham chiếu).
  3. "Chậm" ở ACT-002 là một cách hỏng riêng hay chính là "quá thời gian".
  4. Trong lúc chưa có con số, item nào phải hạ status.
- Phương án:
  - A. R-032 sở hữu ngưỡng; "chậm" gộp vào "quá thời gian". R-030, R-032 hạ Proposed với "Chưa chốt (benchmark)"; R-037 ghi tương tự. Use Case (UC-001, 002, 004, 014) giữ Active, nhánh ghi "ACT-002 không trả kết quả trong ngưỡng quá thời gian của R-032"; câu hỏi mở 2 của UC-014 chuyển về R-032. `Hành vi lỗi` của ACT-002 tham chiếu R-032.
  - B. Như A, nhưng người dùng cung cấp ngay các con số và danh sách để R-030, R-032 giữ Active.
  - C. Như A, nhưng tách "chậm" (ngưỡng cảnh báo) và "quá thời gian" (ngưỡng dừng) thành hai cách hỏng, cả hai ngưỡng do R-032 sở hữu.
  - D. Hạ cả UC-014 và các Use Case gọi nó xuống Proposed tới khi có benchmark.
- Đề xuất: A, vì sheet ghi rõ ngưỡng chỉ đặt sau benchmark, GR-09 không cho đặt số khi chưa có dữ liệu, và một ngưỡng dùng chung cho 4 Use Case cần một nơi sở hữu (GX-10). Nơi xử lý của "Chưa chốt" phụ thuộc G-04 (D-011). Nếu chọn A thì R-046 (Active) dựa vào R-030 (Proposed): không vi phạm GX-04 vì Proposed còn hiệu lực.
- Quyết định:

### M-02 · TRUNG_SO_HUU · Business Rule và Requirement phát biểu cùng một quy định
- Gộp từ: BR-L01, R-L16
- Item: các cặp trong bảng
- Tiêu chí: GX-10, GBR-08, GR-15; mục 1 của `05-business-rules/_CRITERIA.md` (rule giữ "điều phải đúng") và `06-requirements/_CRITERIA.md` (requirement giữ "năng lực phải có")
- Hiện trạng: mỗi cặp nói gần như cùng một câu. BR-001 Ghi chú tự nhận "R-004 mô tả hành vi; rule này giữ nguyên tắc chung". Cặp BR-004/R-022 còn khác mức cam kết: BR-004 "không được thay đổi phần deck ngoài phạm vi", R-022 "nên hạn chế thay đổi ngoài phạm vi".

| Requirement (phần) | Business Rule (phần) | Nội dung trùng |
|---|---|---|
| R-004 | BR-001 | Vai trò của file theo mục đích, không theo đuôi file |
| R-007 | BR-002 mục 1 | Giữ đúng facts, số liệu, ý nghĩa, trích dẫn từ tài liệu |
| R-008 | BR-002 mục 2, Exceptions | Không trình bày nội dung AI bổ sung như lấy từ tài liệu |
| R-011 Acc 2 | BR-010 mục 2 | Mỗi lần sửa tạo một bản chờ duyệt |
| R-011 Acc 3 | BR-011 | Báo sửa theo slide là cố gắng, không đảm bảo |
| R-020 vế 1, Acc 1–2 | BR-006 | Tải về từ đúng bản đang xem trước, AI không tạo lại |
| R-020 vế 2, Acc 3 | BR-010 mục 3c, 6 | Bản chờ duyệt thành bản đã chấp nhận khi tải về thành công |
| R-022, R-023 | BR-004 | Không thay đổi ngoài phạm vi sửa |
| R-024 Yêu cầu, Acc 1 | BR-003 | Ràng buộc còn hiệu lực qua các lần sửa |
| R-024 Acc 2–4 | BR-010 mục 4–5 | Ràng buộc tại ranh giới commit |
| R-025 | BR-007 vế 1 | Giữ facts, số liệu, thứ tự, ý nghĩa giữa các định dạng |
| R-026 | BR-013 | Báo phần không giữ được khi tải về |
| R-031 Acc 1 | BR-005, BR-010 mục 7 | Quay về bản đã chấp nhận khi bỏ hoặc thất bại |
| R-031 Acc 2 | BR-010 mục 5 | Quay về bản đã chấp nhận tại ranh giới commit |
| R-032 Acc 2 | BR-005 | Deck vẫn khôi phục được khi lỗi |
| R-043 | BR-008 | Gần như nguyên văn |
| R-045 | BR-012 mục 2 | Cảnh báo trước khi mất deck chưa tải về |
| R-046 Acc 2 | BR-010 mục 5 | Quay về bản đã chấp nhận tại ranh giới commit khi dừng |
| R-046 Acc 3 | BR-014 mục 2 | Lượt bị dừng không tạo bản mới |
| R-047 Acc 2 | BR-017 | Mọi slide cùng theme, giữ qua sửa và tải về |
| R-049 Acc 2 | BR-015 | Sửa bản sao không làm đổi deck gốc |

- Điều chưa biết hoặc cần chọn: bên nào sở hữu nội dung quy định. Nếu bên còn lại chỉ còn câu tóm tắt kèm ID, có thể bên đó không còn nội dung riêng (R-004, R-007, R-024, R-043; hoặc BR-006, BR-008), và giữ hay xóa item đó là quyết định đổi ID.
- Phương án:
  - A. BR sở hữu quy tắc. R giữ câu Yêu cầu nêu hành vi quan sát được và Acceptance để kiểm chứng, trỏ BR qua `business_rules`. Chỗ R chép chi tiết của BR (R-020 vế 2, R-024 Acc 2–4, R-031 Acc 2, R-046 Acc 2–3) thay bằng tóm tắt kèm ID BR. Thêm quan hệ còn thiếu R-011, R-024, R-046 → BR-010. Mức cam kết của BR-004/R-022 lấy theo BR-004 ("không được"). R nào không còn nội dung riêng thì mở XOA_ITEM ở Pha B.
  - B. R sở hữu. BR bỏ phần trùng, chỉ giữ Exceptions và chi tiết R không có. BR không còn gì thì xóa (đổi ID, ảnh hưởng `use_cases` và `shapes` của Decision).
  - C. Quyết định riêng từng dòng.
- Đề xuất: A, vì bộ tiêu chí cho phép BR chi tiết hơn R (GR-15), BR được nhiều UC và R cùng trỏ tới, và quan hệ `R.business_rules → BR` đã có nên không mất truy vết. R vẫn có Acceptance riêng nên vẫn kiểm chứng được. Không tính R-051 Acc 2 ↔ BR-018 vì R-051 là Draft (GX-10 áp từ Proposed).
- Quyết định:

### M-03 · TRUNG_SO_HUU · Business Rule lặp lại câu Decision (gồm D-030 ↔ BR-010)
- Gộp từ: BR-L02, D-L01
- Item: BR-001/D-007, BR-007/D-009, BR-009 (mục 1)/D-024 (mục 2), BR-010 (mục 3b, 4, 5)/D-030, BR-011/D-025 (mục 3), BR-012 (mục 1)/D-027 (mục 2), BR-014 (mục 2)/D-029
- Tiêu chí: GBR-08, GD-10, GX-10, GD-01
- Hiện trạng: BR-001 "… theo mục đích …; đuôi file … không quyết định vai trò" và D-007 "Vai trò của file được xác định theo mục đích sử dụng, không suy ra cứng từ đuôi file"; BR-009 "Mỗi deck chỉ dùng một tài liệu có sẵn" và D-024 mục 2 "Mỗi deck dùng một tài liệu có sẵn". D-030.Decision gồm 7 câu (838 ký tự), cả 7 ý đều có trong BR-010 mục 3b, 4, 5; giữ nguyên còn vi phạm GD-01 (quá 3 vế).
- Điều chưa biết hoặc cần chọn: item nào phát biểu quy định; câu Decision có được rút về "lựa chọn + tóm tắt kèm ID BR" không.
- Phương án:
  - A. BR giữ phát biểu điều phải đúng. Câu Decision giữ lựa chọn và tóm tắt kèm ID BR; quan hệ `D.shapes → BR` đã có. Riêng D-030 rút về tối đa 3 vế: (1) DeckAgent chấp nhận bản chờ duyệt tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu; (2) ranh giới commit chỉ đạt sau khi các bước hỏi lại, cảnh báo hoặc xác nhận hoàn tất; chi tiết ghi "theo BR-010 mục 3b, 4, 5".
  - B. Decision giữ nguyên câu; BR viết lại thành tóm tắt kèm ID D. D-030 vẫn quá 3 vế.
  - C. Tách D-030 thành nhiều Decision (ID mới); BR-010 vẫn trùng.
- Đề xuất: A, vì GBR-08 ghi rõ "Decision giữ lựa chọn và lý do; rule giữ điều phải đúng", và BR-010 đã chứa đủ 7 ý của D-030 nên rút gọn D-030 không mất thông tin.
- Quyết định:

### M-04 · TRUNG_SO_HUU · Item sở hữu vòng đời bản deck (ranh giới commit, khôi phục, dừng, lỗi)
- Gộp từ: BR-L03, UC-L07
- Item: BR-005, BR-010, BR-014 (mục 2), UC-004; liên quan BR-006, R-024, R-031, R-046, D-030
- Tiêu chí: GX-10, GBR-08, GBR-05, GUC-15
- Hiện trạng:
  - BR-005: "Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, hệ thống phải giữ hoặc khôi phục bản đã chấp nhận gần nhất."
  - BR-010 mục 5 (lượt lỗi sau ranh giới commit → quay về bản tại ranh giới commit), mục 6 ("Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt"), mục 7, mục 8.
  - BR-014 mục 2: "Lượt xử lý bị dừng hoặc lỗi không tạo bản mới."
  - UC-004 viết lại BR-010 mục 3b, 4, 5 tại bước "2'", nhánh 1A, các nhánh 3A, 3B, 4A và Postconditions 1–2.
- Điều chưa biết hoặc cần chọn:
  1. Item nào sở hữu các chuyển trạng thái khi thất bại, dừng và bỏ.
  2. Cách đọc BR-005 khi tải về từ bản chờ duyệt thất bại: "khôi phục bản đã chấp nhận gần nhất" mâu thuẫn BR-010 mục 6; "giữ (không làm mất) bản đã chấp nhận" thì không.
  3. UC-004 có được bỏ nhánh 1A và thay đoạn quy tắc bằng tham chiếu không.
- Phương án:
  - A. BR-010 sở hữu toàn bộ vòng đời trong một `Bảng chuyển trạng thái`. BR-005 và BR-014 mục 2 rút về tóm tắt kèm ID BR-010; khi tải về thất bại áp BR-010 mục 6. UC-004: bước mới "Hệ thống đạt ranh giới commit và áp dụng ràng buộc của yêu cầu mới (BR-010 mục 4–5)", bỏ nhánh 1A, các nhánh 3A, 3B, 4A và Postconditions 1–2 tham chiếu BR-010.
  - B. BR-010 chỉ sở hữu "khi nào một bản thành bản đã chấp nhận"; BR-005 sở hữu khôi phục khi thất bại hoặc bỏ, có bảng chuyển trạng thái riêng; UC-004 tham chiếu cả hai.
  - C. Giữ chồng lấn, thêm câu dẫn chiếu qua lại (vi phạm GX-10).
- Đề xuất: A, vì test theo state transition (GBR-05) cần một bảng duy nhất xét đủ cặp trạng thái × sự kiện, và BR-010 đã áp lên 6 Use Case (GUC-15). Với A, BR-005 gần như chỉ còn tóm tắt; xóa BR-005 là XOA_ITEM riêng, không tự làm.
- Quyết định:

### M-05 · TRANG_THAI · Loại, thời hạn và xung đột của ràng buộc của người dùng
- Gộp từ: BR-L05, R-L04, UC-L09
- Item: BR-003, R-001, R-024, UC-004; liên quan A-013
- Tiêu chí: GX-09, GX-08, GBR-06, GUC-18
- Hiện trạng:
  - BR-003 Exceptions: "Ràng buộc chỉ dành cho một lần sửa thì hết hiệu lực sau lần sửa đó; cách phân biệt sẽ được định nghĩa sau."
  - R-001: "(chủ đề, mục đích, audience, ngôn ngữ, độ dài, yêu cầu riêng)". "yêu cầu riêng" là cụm mở.
  - R-024 Ghi chú: "Thời hạn và cách xử lý xung đột giữa các loại ràng buộc còn mở (A-013)…"
  - UC-004 Câu hỏi mở: "Ràng buộc của người dùng hết hiệu lực khi nào, và xử lý thế nào khi hai ràng buộc mâu thuẫn? (A-013)". A-013 Ghi chú: "cố ý để mở".
- Điều chưa biết hoặc cần chọn: (1) danh sách đầy đủ các loại ràng buộc; (2) cách nhận biết ràng buộc chỉ dành cho một lần sửa và khi nào ràng buộc hết hiệu lực; (3) quy tắc khi hai ràng buộc xung đột. Thiếu (2), (3) thì không phán được ngoại lệ của BR-003 và Acceptance 1 của R-024.
- Phương án:
  - A. Hạ BR-003 và R-024 xuống Proposed; (2), (3) vào `Câu hỏi mở`, nơi xử lý A-013. R-001 giữ Active nếu người dùng thay được "yêu cầu riêng" bằng danh sách cụ thể, nếu không thì hạ cùng. UC-004 giữ Active, bước sửa tham chiếu BR-003 cho "ràng buộc còn hiệu lực"; câu hỏi chuyển về BR-003.
  - B. Giữ tất cả ở Active, người dùng chốt ngay (1), (2), (3).
  - C. Giữ Active, thu hẹp: ràng buộc còn hiệu lực tới khi người dùng đổi hoặc hủy, bỏ ngoại lệ ràng buộc một lần, xung đột để ngoài phạm vi. Đây là đổi nghĩa.
- Đề xuất: A, vì sheet ghi rõ câu hỏi "cố ý để mở" (A-013), và đây là thông tin ảnh hưởng hành vi bắt buộc nên không được ở Active (GX-09). Proposed còn hiệu lực nên UC-004 dựa vào BR-003 không vi phạm GX-04.
- Quyết định:

### M-06 · SO_LIEU · "Giới hạn của định dạng" khi tải về chưa được định nghĩa
- Gộp từ: BR-L07, R-L09
- Item: BR-006, R-025, R-026, R-028; liên quan BR-007, BR-013, D-026
- Tiêu chí: GR-11, GBR-06, GX-08, GX-09
- Hiện trạng:
  - BR-006 Exceptions: "Định dạng đích được làm mất phần nó không thể hiện được, nếu phần đó nằm trong giới hạn đã biết của định dạng (BR-013)." BR-013 không liệt kê giới hạn nào.
  - R-025 Acceptance: "…trong giới hạn của từng định dạng." R-028: "…trong giới hạn của định dạng"; Acceptance "…trong phạm vi đã kiểm chứng."
  - R-026: "xử lý theo cách dự đoán được"; "Mỗi trường hợp mất hoặc đổi đã biết có cách xử lý xác định."
  - D-026 mục 3: mức tương thích "được học từ implementation và Testing".
- Điều chưa biết hoặc cần chọn: giới hạn của PPTX và PDF được định nghĩa ở đâu; danh sách mất hoặc đổi đã biết; phạm vi kiểm chứng của R-028.
- Phương án:
  - A. BR-006 đọc "(BR-013)" là điều kiện báo: "Khi định dạng đích không thể hiện được một phần deck, file tải về được thiếu phần đó nếu hệ thống đã báo phần đó cho người dùng theo BR-013" (khớp UC-008 3A). R-025 thay "trong giới hạn của từng định dạng" bằng tham chiếu BR-007. R-026, R-028 ghi danh sách mất hoặc đổi là "Chưa chốt" và hạ Proposed tới khi có evidence implementation (D-026 mục 3).
  - B. Người dùng cung cấp ngay danh sách giới hạn và mất hoặc đổi theo từng định dạng; giữ cả bốn item ở Active.
  - C. Hạ cả bốn item xuống Proposed.
- Đề xuất: A, vì BR-007 đã định nghĩa phần không bắt buộc giống nhau, cách đọc "đã báo" phán được đạt hay không mà không cần danh sách đóng, và D-026 đã chọn học danh sách từ implementation. Cần người dùng xác nhận cách đọc "(BR-013)" ở BR-006.
- Quyết định:

### M-07 · TRANG_THAI · Ứng dụng đích dùng để kiểm chứng file PPTX
- Gộp từ: R-L05, UC-L10, A-L07
- Item: R-027, UC-008 (bước 5, Postconditions 4, Câu hỏi mở 1), A-022, A-020 (vế Signpost); liên quan D-026
- Tiêu chí: GX-09, GX-08, GR-11, GUC-13, GUC-18, GA-04
- Hiện trạng:
  - R-027: "…hợp lệ, mở và dùng được trong môi trường đích." Acceptance 2: "Cam kết tương thích với từng ứng dụng cụ thể chưa được chốt trước implementation."
  - UC-008 Postconditions 4: "Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint." Câu hỏi mở 1: "Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice?" (không có nơi xử lý).
  - A-022 Signpost: "không mở ổn định, khó sửa, mất cấu trúc slide…"; Ghi chú dẫn D-026 chưa chốt mức tương thích.
  - D-026 mục 3: mức tương thích PPTX không chốt trước Architecture.
- Điều chưa biết hoặc cần chọn: "mở được" và "sửa được" kiểm trên ứng dụng nào. UC-008 đã ghi PowerPoint, còn R-027 và D-026 để mở.
- Phương án:
  - A. Chốt PowerPoint là ứng dụng kiểm chứng của V1. R-027, UC-008, A-022 ghi theo; bỏ câu hỏi mở của UC-008. Đây là bổ sung thông tin vào R-027 và có thể mâu thuẫn D-026 mục 3, nên cần người dùng chốt.
  - B. Giữ chưa chốt theo D-026: R-027 hạ Proposed, câu hỏi mở về danh sách ứng dụng đích (nơi xử lý D-026); UC-008 bỏ chữ "PowerPoint" khỏi Postconditions 4 (đổi nghĩa) và hạ Proposed; A-022 xử lý status theo blocker status của Assumption.
  - C. Chốt một ứng dụng khác hoặc nhiều ứng dụng.
- Đề xuất: Cần người dùng chọn giữa A và B. Subagent use-cases đề xuất A (Tình huống và Ghi chú của UC-008 đều nhắm PowerPoint); subagent requirements và assumptions đề xuất B (giữ đúng D-026). Agent chính nghiêng về A nếu D-026 mục 3 chỉ nói về mức tương thích chi tiết, không nói về ứng dụng đích; ngược lại là B.
- Quyết định:

### M-08 · THAM_CHIEU_LOAI_CU · Mã L-xxx, W-xxx trong `source`
- Gộp từ: BR-L11, UC-L15
- Item: BR-017 (L-002), UC-017 (L-002), UC-024 (L-001), UC-025 (W-026), R-017 (L-001), R-018 (L-002), R-044 (W-026), R-047 (L-002)
- Tiêu chí: GX-03, GX-11, GBR-10
- Hiện trạng: ví dụ BR-017 Căn cứ "R-047, L-002"; UC-024 "L-001, R-014, R-017, R-018"; R-044 "W-026, D-025"; R-047 "L-002, Benchmark 27/09/2026". Tab Learnings và Work không được migrate.
- Điều chưa biết hoặc cần chọn: bỏ mã, giữ như mã nguồn dạng text, hay thay bằng item có kết luận tương ứng.
- Phương án:
  - A. Bỏ mã loại cũ khỏi `source`. Item nào sau khi bỏ mà `source` rỗng thì thay bằng Decision có kết luận tương ứng: D-024 (L-001), D-025 (L-002, W-026).
  - B. Giữ mã dạng text như mã nguồn (`allow_codes`). Validator phải chấp nhận mã không trỏ tới item.
  - C. Thay toàn bộ bằng Decision tương ứng (D-024, D-025).
- Đề xuất: A, vì phần lớn item đã có ID khác trong `source` giữ chuỗi truy vết, và D-024, D-025 đã ghi kết luận của L-001, L-002, W-026.
- Quyết định:

### M-09 · TRANG_THAI · Hỏi lại hay đánh dấu nội dung do AI bổ sung
- Gộp từ: R-L03, UC-L06
- Item: R-008, UC-002 (5A); liên quan BR-002
- Tiêu chí: GX-09, GR-05, GUC-11
- Hiện trạng: R-008 "phải hỏi lại người dùng hoặc đánh dấu nội dung do AI bổ sung…"; Ghi chú "Cách hiển thị phần AI bổ sung chưa được chốt." Acceptance 2 "Người dùng thấy được phần nào do AI bổ sung, hoặc được hỏi trước khi AI bổ sung." UC-002 5A: "AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung, rồi tiếp tục bước 5."
- Điều chưa biết hoặc cần chọn: (1) cách hiển thị là quyết định thiết kế hay một phần tiêu chí đạt; (2) khi nào hỏi, khi nào đánh dấu.
- Phương án:
  - A. Giữ Active. Cách hiển thị là quyết định thiết kế (GR-05); Ghi chú R-008 đổi thành "Cách hiển thị là quyết định thiết kế, không thuộc requirement này". "Hỏi hoặc đánh dấu" là hai hành vi đều chấp nhận được; test kiểm assertion chung của BR-002 (nội dung không có trong tài liệu không được trình bày như lấy từ tài liệu). UC-002 5A tham chiếu R-008.
  - B. Chốt một hành vi mặc định (ví dụ luôn đánh dấu), hành vi kia thành nhánh có điều kiện do người dùng nêu.
  - C. Hạ R-008 xuống Proposed, đưa câu hỏi vào `Câu hỏi mở`.
- Đề xuất: A, vì Acceptance 2 đã phán được đúng sai mà không cần biết cách hiển thị, và R-008, BR-002 đều cho phép cả hai hành vi.
- Quyết định:
