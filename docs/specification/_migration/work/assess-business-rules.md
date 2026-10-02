# Đánh giá: business-rules

Phạm vi: 18 item `BR-001` … `BR-018` (13 Active, 4 Proposed, 1 Draft). A2 phân loại cả 18 là `product`, nên không có item `XÓA`.

Số chỗ dùng (GBR-01) = số Use Case trong `use_cases` + số Requirement trỏ tới qua `business_rules` (relations.json). Mọi item đều đạt ngưỡng 2; thấp nhất là BR-015, BR-016, BR-017 (1 UC + 1 R). Không item nào cần lý do giữ trong Ghi chú.

## 1. Kế hoạch dịch

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| BR-001 | BLOCKER | Tách Rule thành 2 mệnh đề: xác định vai trò theo mục đích; đuôi file không quyết định vai trò (GBR-03, GX-14). Exceptions không phải ngoại lệ mà là giới hạn V1 kèm một yêu cầu "công bố": xử lý theo BR-L06 (GBR-06). Ghi chú "R-004 mô tả hành vi…" bỏ hoặc giữ tùy BR-L01 (GX-12) | BR-L01, BR-L02, BR-L06 |
| BR-002 | BLOCKER | Mệnh đề 1 thêm chủ thể "hệ thống" (GX-16, GBR-02). Exceptions là quyền bổ sung nội dung, không phải trường hợp rule không áp dụng: gộp vào Rule thành mệnh đề riêng (GBR-06, GBR-03) | BR-L01 |
| BR-003 | BLOCKER | Thêm tân ngữ cho "tiếp tục áp dụng" (GX-17); dùng "ràng buộc của người dùng" (GX-07, GBR-09). Exceptions bổ sung 2 trường hợp tóm tắt kèm ID từ BR-010 (yêu cầu bị hủy hoặc từ chối trước ranh giới commit; người dùng bỏ bản chờ duyệt) (GBR-06, GX-10). "sẽ được định nghĩa sau" → BR-L05 | BR-L01, BR-L05 |
| BR-004 | BLOCKER | Câu thoát "trừ khi việc đó cần thiết" (GX-08, GBR-06) → BR-L09. Rule giữ mẫu "Khi …, hệ thống không được …" (GBR-02 đã đạt). Ghi chú giữ (giới hạn phạm vi) | BR-L01, BR-L09 |
| BR-005 | BLOCKER | Đổi `short_name` bỏ "Luôn", "dùng được" (GX-08, GBR-11). Exceptions nói về cơ chế (snapshot, diff), không phải ngoại lệ → chuyển sang Ghi chú (GBR-04, GBR-06). "giữ hoặc khôi phục" khi tải về thất bại phải thống nhất với BR-010 mục 6 → BR-L03 | BR-L01, BR-L03 |
| BR-006 | BLOCKER | Tách 2 mệnh đề (GBR-03). Exceptions: "nó" → "định dạng đích" (GX-17); "giới hạn đã biết của định dạng" → BR-L07. Ghi chú bỏ lịch sử đổi status và ngày `27/09/2026` (GX-12, GX-18), giữ lưu ý "bản đang xem trước có thể là bản chờ duyệt (BR-010)" | BR-L01, BR-L03, BR-L07 |
| BR-007 | BLOCKER | Thêm chủ thể "hệ thống" (GX-16); tách vế "không bắt buộc giống …" thành mệnh đề riêng (GBR-03). Exceptions "sẽ có quy tắc riêng" không phải ngoại lệ hiện có → chuyển sang Ghi chú như việc để sau (GBR-06, GX-12); "use case" → "Use Case" | BR-L01, BR-L02 |
| BR-008 | BLOCKER | Vế 2 đổi chủ ngữ sang "hệ thống không được để nội dung đó …" (GX-16, GBR-02). Exceptions "Không có ngoại lệ…" → xóa section; ý tài liệu nội bộ được tin cậy chuyển sang Ghi chú (GBR-06, GX-12); "(nếu có sau này)" giữ nguyên trong Ghi chú | BR-L01 |
| BR-009 | BLOCKER | Mệnh đề 2 viết lại "Khi người dùng đưa PPTX làm tài liệu có sẵn, hệ thống chỉ được lấy nội dung, không được giữ bố cục" (GBR-02, GX-16); "giữ bố cục thuộc UC-003" → Ghi chú (GX-12). Ghi chú L-001 giữ làm text (mục 5) | BR-L02 |
| BR-010 | BLOCKER | Viết lại 8 mệnh đề thành 19 mệnh đề nguyên tử, bỏ phụ thuộc "Với trường hợp 3b" (GBR-03) và trình tự "theo thứ tự" (GBR-04); thêm `Bảng chuyển trạng thái` (GBR-05); "nó" → danh từ (GX-17); "kiểm tra" → "kiểm tra kết quả" (GX-07); Exceptions chuyển sang Ghi chú (GBR-06). Chi tiết ở mục 4 | BR-L02, BR-L03, BR-L04 |
| BR-011 | BLOCKER | Thêm vế "Khi yêu cầu sửa nhắm vào một slide" lấy từ `short_name` (GBR-02); giữ thuật ngữ "cố gắng, không đảm bảo" (GL-022) | BR-L02 |
| BR-012 | BLOCKER | Mệnh đề 1 không có "phải / không được": chọn mức cam kết → BR-L08 (GBR-02). Mệnh đề 2 giữ, đã đạt mẫu | BR-L01, BR-L02, BR-L08 |
| BR-013 | VIẾT-LẠI | Tách thành 2 mệnh đề: phải báo giới hạn; không được bỏ qua âm thầm hoặc trả kết quả sai (GBR-03). Giữ nguyên danh sách trong ngoặc. Đổi `short_name` "Không giả vờ làm được" thành tên nêu nội dung, ví dụ "Báo giới hạn khi chưa làm được yêu cầu" (GBR-11). Ghi chú "Áp dụng cho mọi luồng tạo, sửa và tải về" giữ (giới hạn phạm vi) | — |
| BR-014 | BLOCKER | Mệnh đề 1 → "Hệ thống không được chạy đồng thời hai lượt xử lý AI tạo hoặc sửa deck trong cùng một lần làm việc" (GBR-02, GX-16). Mệnh đề 2 → "Khi lượt xử lý AI bị dừng hoặc lỗi, hệ thống không được tạo bản mới" (GBR-02). Ghi chú giữ (hệ quả cho người dùng) | BR-L02, BR-L03 |
| BR-015 | VIẾT-LẠI | Tách 2 mệnh đề: phải tạo bản sao; sửa bản sao không được làm đổi deck gốc (GBR-03). Ghi chú bỏ mục 2 (tóm tắt lại quan hệ và trỏ OR-045, GX-12). R-049 phải tóm tắt kèm ID BR-015 thay vì phát biểu lại (GX-10, việc của loại requirements) | — |
| BR-016 | BLOCKER | Tách 2 mệnh đề: không được xóa bản khác; bản bị thay vẫn nằm trong lịch sử (GBR-03). Câu thoát "trong giới hạn lưu trữ" → BR-L10. Ghi chú bỏ mục 2 (OR-045, GX-12) | BR-L10 |
| BR-017 | BLOCKER | Tách 2 mệnh đề: mỗi slide dùng cùng theme; theme giữ qua các lần sửa và khi tải về (GBR-03); "mọi slide" → "mỗi slide của deck" (GX-08). Ghi chú bỏ (chỉ có OR-045) → xóa section. `source` có L-002 → BR-L11 | BR-L11 |
| BR-018 | CẤU-TRÚC | Chỉ chuyển vào template. Draft nên chỉ chịu gate cấu trúc | — |

## 2. Blocker cục bộ

### BR-L01 · TRUNG_SO_HUU · Business Rule và Requirement phát biểu cùng một quy định
- Item: BR-001/R-004, BR-002 (mục 1)/R-007, BR-003/R-024, BR-004/R-022, BR-005/R-031, BR-006/R-020, BR-007 (vế 1)/R-025, BR-008/R-043, BR-012 (mục 2)/R-045
- Tiêu chí: GX-10, GBR-08; `_CRITERIA.md` mục 1 (rule giữ "điều phải đúng", Requirement giữ "năng lực hệ thống phải có")
- Hiện trạng: mỗi cặp nói gần như cùng một câu. Ví dụ BR-001 "hệ thống phải xác định vai trò của file … theo mục đích …; đuôi file … không quyết định vai trò" và R-004 "DeckAgent phải xác định vai trò của mỗi file … theo mục đích sử dụng, không suy ra cứng từ đuôi file". BR-001 Ghi chú tự nhận "R-004 mô tả hành vi; rule này giữ nguyên tắc chung". Cặp BR-004/R-022 còn khác mức cam kết: BR-004 "không được thay đổi phần deck ngoài phạm vi", R-022 "nên hạn chế thay đổi ngoài phạm vi"
- Điều chưa biết hoặc cần chọn: item nào sở hữu nội dung quy định của từng cặp. Nếu bên còn lại chỉ còn câu tóm tắt kèm ID, có thể bên đó rỗng nội dung riêng (đặc biệt R-004, R-007, R-024, R-043), và việc giữ hay xóa item đó là quyết định đổi ID
- Phương án:
  - A. BR sở hữu điều phải đúng. Requirement giữ phần năng lực hoặc phần đặc thù (nếu có), tóm tắt quy định kèm ID BR và giữ `business_rules` trỏ tới BR. Requirement nào rỗng sau khi tóm tắt thì loại requirements mở blocker XOA_ITEM riêng
  - B. Requirement sở hữu. BR viết lại thành câu tóm tắt kèm ID R; BR nào rỗng thì xóa (đổi ID, ảnh hưởng `use_cases` và `shapes` của Decision)
  - C. Quyết định riêng từng cặp
- Đề xuất: A, vì `_CRITERIA.md` mục 1 tách rõ "điều phải đúng" (BR) với "năng lực phải có" (R), BR là nơi được nhiều UC và R cùng trỏ tới, và quan hệ `R.business_rules → BR` đã có sẵn nên không mất truy vết. Với BR-004/R-022, mức cam kết lấy theo BR-004 ("không được"); R-022 chỉ còn câu tóm tắt. Nên gom với blocker GX-10 của loại requirements
- Quyết định:

### BR-L02 · TRUNG_SO_HUU · Business Rule lặp lại câu Decision
- Item: BR-001/D-007, BR-007/D-009, BR-009 (mục 1)/D-024 (mục 2), BR-010 (mục 3b, 4, 5)/D-030, BR-011/D-025 (mục 3), BR-012 (mục 1)/D-027 (mục 2), BR-014 (mục 2)/D-029 (vế "dừng không làm thay đổi bản đã chấp nhận")
- Tiêu chí: GBR-08, GX-10
- Hiện trạng: BR-001 "… theo mục đích …; đuôi file … không quyết định vai trò" và D-007 "Vai trò của file được xác định theo mục đích sử dụng, không suy ra cứng từ đuôi file"; BR-009 "Mỗi deck chỉ dùng một tài liệu có sẵn" và D-024 mục 2 "Mỗi deck dùng một tài liệu có sẵn"; BR-010 mục 4–5 gần như chép D-030 (ranh giới commit, thứ tự áp ràng buộc, quay về baseline)
- Điều chưa biết hoặc cần chọn: câu Decision có được viết lại thành "lựa chọn + tóm tắt kèm ID BR" hay không. Việc này sửa nội dung của loại decisions
- Phương án:
  - A. BR giữ phát biểu điều phải đúng. Câu Decision giữ lựa chọn (chọn phương án nào, giữa những gì) và tóm tắt quy định kèm ID BR; quan hệ `D.shapes → BR` đã có
  - B. Decision giữ nguyên câu; BR viết lại thành tóm tắt kèm ID D
  - C. Giữ cả hai như hiện tại (vi phạm GBR-08)
- Đề xuất: A, vì GBR-08 ghi rõ "Decision giữ lựa chọn và lý do; rule giữ điều phải đúng", và chiều `shapes` (Decision áp lên BR) khớp với việc BR là nơi phát biểu quy định. Nên gom với agent decisions
- Quyết định:

### BR-L03 · TRUNG_SO_HUU · Vòng đời của bản deck nằm rải ở BR-005, BR-010, BR-014
- Item: BR-005, BR-010, BR-014; liên quan BR-006
- Tiêu chí: GX-10, GBR-08, GBR-05
- Hiện trạng:
  - BR-005: "Khi lượt tạo, sửa hoặc tải về thất bại, hoặc người dùng bỏ bản chờ duyệt, hệ thống phải giữ hoặc khôi phục bản đã chấp nhận gần nhất."
  - BR-010 mục 5 (lượt lỗi sau ranh giới commit → quay về bản tại ranh giới commit), mục 6 ("Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt"), mục 7 (bỏ bản chờ duyệt → quay về bản làm cơ sở), mục 8 (chỉ bắt buộc giữ một bản làm cơ sở khôi phục)
  - BR-014 mục 2: "Lượt xử lý bị dừng hoặc lỗi không tạo bản mới."
  - BR-005 Ghi chú "Không yêu cầu Undo nhiều bước" trùng ý BR-010 mục 8
- Điều chưa biết hoặc cần chọn:
  1. Item nào sở hữu các chuyển trạng thái khi thất bại, dừng và bỏ.
  2. Hệ quả của lựa chọn trên: khi tải về từ bản chờ duyệt thất bại, BR-005 đọc theo nghĩa "khôi phục bản đã chấp nhận gần nhất" thì mâu thuẫn với BR-010 mục 6 (bản chờ duyệt vẫn được giữ). Đọc theo nghĩa "giữ (không làm mất) bản đã chấp nhận" thì không mâu thuẫn. Item nào sở hữu cũng phải chốt cách đọc này
- Phương án:
  - A. BR-010 sở hữu toàn bộ vòng đời (một `Bảng chuyển trạng thái` gồm tạo, sửa, giữ, bỏ, tải về, dừng, lỗi). BR-005 rút về nguyên tắc tóm tắt kèm ID BR-010 ("bản đã chấp nhận gần nhất không bị mất khi …, theo BR-010"); BR-014 mục 2 tóm tắt kèm ID BR-010. Khi tải về thất bại, áp dụng BR-010 mục 6
  - B. Tách theo chủ đề: BR-010 chỉ sở hữu "khi nào một bản trở thành bản đã chấp nhận" (đúng `short_name`); BR-005 sở hữu khôi phục khi thất bại hoặc bỏ (nhận mục 5 vế sau, 7, 8 của BR-010) và cần bảng chuyển trạng thái riêng; BR-014 mục 2 tóm tắt kèm ID BR-005
  - C. Giữ chồng lấn, chỉ thêm câu dẫn chiếu qua lại
- Đề xuất: A, vì test theo state transition (GBR-05) cần một bảng duy nhất xét đủ các cặp trạng thái × sự kiện; tách bảng ra hai item thì các cặp ở ranh giới dễ bị bỏ sót. Lưu ý: với A, BR-005 gần như chỉ còn tóm tắt; nếu muốn xóa BR-005 thì đó là XOA_ITEM (đổi ID, ảnh hưởng `R-031`, `R-032` và 6 UC), không tự làm
- Quyết định:

### BR-L04 · TRANG_THAI · Bảng chuyển trạng thái của BR-010 còn ô không suy ra được
- Item: BR-010
- Tiêu chí: GBR-05, GX-09
- Hiện trạng: BR-010 Active, nói về trạng thái "bản chờ duyệt / bản đã chấp nhận" nên phải có `Bảng chuyển trạng thái`. Phần lớn dòng suy ra được từ Rule của BR-010 và các luồng UC-001, UC-004, UC-008, UC-013, UC-014 (bảng ở mục 4). Các cặp trạng thái × sự kiện sau **không có** trong sheet:
  1. Đang chờ hoàn tất yêu cầu sửa mới (còn hỏi lại, cảnh báo hoặc xác nhận) × người dùng giữ bản chờ duyệt
  2. Đang chờ hoàn tất yêu cầu sửa mới × người dùng bỏ bản chờ duyệt
  3. Đang chờ hoàn tất yêu cầu sửa mới × người dùng tải về
  4. Lượt xử lý AI đang chạy × người dùng tải về
- Điều chưa biết hoặc cần chọn: kết quả của 4 cặp trên (chuyển trạng thái hợp lệ, hay không cho phép và hệ thống báo gì)
- Phương án:
  - A. Người dùng điền 4 ô còn thiếu, BR-010 giữ Active
  - B. Hạ BR-010 xuống Proposed; bảng chỉ gồm các dòng suy ra được; 4 cặp ghi vào `Câu hỏi mở`, nơi xử lý UC-004 và UC-008
  - C. Giữ Active, bảng chỉ gồm các dòng suy ra được, bỏ qua 4 cặp (vi phạm GX-09 vì câu hỏi ảnh hưởng hành vi)
- Đề xuất: A, vì BR-010 là rule lõi của V1 (6 UC, R-020, R-031 dựa vào) và 4 câu hỏi đều là quyết định giao diện nhỏ, trả lời được ngay. Gợi ý (chưa có trong sheet, cần người dùng xác nhận): không cho giữ, bỏ hoặc tải về trong lúc chờ hoàn tất yêu cầu sửa mới hoặc khi lượt xử lý đang chạy
- Quyết định:

### BR-L05 · TRANG_THAI · BR-003 chưa định nghĩa cách phân biệt ràng buộc một lần
- Item: BR-003
- Tiêu chí: GBR-06, GX-09
- Hiện trạng: Exceptions "Ràng buộc chỉ dành cho một lần sửa thì hết hiệu lực sau lần sửa đó; cách phân biệt sẽ được định nghĩa sau." Ghi chú "Thiếu quy tắc thời hạn rõ ràng có thể làm hệ thống vừa quên ràng buộc cũ vừa giữ ràng buộc quá lâu." A-013 (Open) ghi câu hỏi thời hạn "vẫn cố ý để mở"
- Điều chưa biết hoặc cần chọn: cách hệ thống nhận biết một ràng buộc chỉ dành cho một lần sửa. Thiếu điều này thì không phán được đạt hay không cho ngoại lệ
- Phương án:
  - A. Người dùng định nghĩa cách phân biệt; BR-003 giữ Active
  - B. Hạ BR-003 xuống Proposed; Exceptions giữ trường hợp "ràng buộc chỉ dành cho một lần sửa hết hiệu lực sau lần sửa đó"; câu hỏi cách phân biệt chuyển sang `Câu hỏi mở`, nơi xử lý A-013
  - C. Giữ Active, bỏ ngoại lệ ràng buộc một lần (đổi nghĩa, cần người dùng chấp nhận)
- Đề xuất: B, vì sheet ghi rõ câu hỏi đang cố ý để mở (A-013). Hạ Proposed không gây lỗi GX-04 cho R-024 (Active) vì Proposed vẫn còn hiệu lực. R-024 có cùng câu hỏi mở: nên gom với blocker của R-024 bên requirements
- Quyết định:

### BR-L06 · TRANG_THAI · Exceptions của BR-001 có hai cách hiểu
- Item: BR-001
- Tiêu chí: GBR-06, GBR-07, GX-09
- Hiện trạng: Exceptions "V1 chỉ nhận vai trò tài liệu có sẵn; giới hạn này phải được công bố, không gán ngầm."
- Điều chưa biết hoặc cần chọn: (1) đây không phải trường hợp rule không áp dụng mà là một giới hạn V1 kèm một yêu cầu; (2) "công bố" là báo cho người dùng khi họ đưa file với mục đích khác, hay ghi giới hạn sẵn trong giao diện; (3) "không gán ngầm" là cấm coi file đó là tài liệu có sẵn, hay chỉ cấm làm vậy mà không báo
- Phương án:
  - A. Chuyển thành mệnh đề Rule: "Khi người dùng đưa file với mục đích khác tài liệu có sẵn, hệ thống phải báo rằng V1 chỉ nhận vai trò tài liệu có sẵn (BR-013) và không được tự coi file đó là tài liệu có sẵn." Xóa section Exceptions
  - B. Chuyển thành mệnh đề Rule: "Hệ thống phải hiển thị giới hạn 'V1 chỉ nhận tài liệu có sẵn' tại nơi người dùng đưa file vào." Hệ thống được dùng file làm tài liệu có sẵn sau khi đã hiển thị giới hạn
  - C. Giữ nguyên câu trong Exceptions (trượt GBR-06)
- Đề xuất: A, vì khớp với BR-013 (báo giới hạn thay vì xử lý âm thầm) và mẫu UC-004 2C (yêu cầu V1 chưa làm được thì báo giới hạn, không xử lý)
- Quyết định:

### BR-L07 · SO_LIEU · "Giới hạn đã biết của định dạng" ở BR-006 chưa có danh sách
- Item: BR-006
- Tiêu chí: GBR-06, GX-08, GX-09
- Hiện trạng: Exceptions "Định dạng đích được làm mất phần nó không thể hiện được, nếu phần đó nằm trong giới hạn đã biết của định dạng (BR-013)." BR-013 không liệt kê giới hạn nào. D-026 mục 3 ghi mức tương thích PPTX "được học từ implementation và Testing"
- Điều chưa biết hoặc cần chọn: tập "giới hạn đã biết" là gì, nên chưa phán được khi nào file tải về được thiếu một phần deck
- Phương án:
  - A. Hiểu "(BR-013)" là điều kiện báo: viết lại "Khi định dạng đích không thể hiện được một phần deck, file tải về được thiếu phần đó nếu hệ thống đã báo phần đó cho người dùng theo BR-013." Căn cứ: UC-008 3A (hệ thống liệt kê phần sẽ bị mất, người dùng chọn tiếp tục hoặc hủy)
  - B. Người dùng cung cấp danh sách giới hạn đã biết của PPTX và PDF
  - C. Hạ BR-006 xuống Proposed, câu hỏi chuyển sang `Câu hỏi mở`, nơi xử lý D-026
- Đề xuất: A, vì không cần danh sách đóng mà vẫn phán được đạt hay không (có báo hay không), và khớp với UC-008 3A. Cần người dùng xác nhận đây đúng là nghĩa của "(BR-013)". Nên gom với R-028 ("trong giới hạn của định dạng") nếu loại requirements có blocker tương tự
- Quyết định:

### BR-L08 · TRANG_THAI · Mức cam kết của BR-012 mục 1
- Item: BR-012
- Tiêu chí: GBR-02, GBR-07
- Hiện trạng: "Deck, tài liệu có sẵn và ràng buộc của người dùng chỉ tồn tại trong lần làm việc hiện tại." Câu mô tả, không có "phải / không được"
- Điều chưa biết hoặc cần chọn: viết theo GBR-02 buộc phải chọn một trong hai nghĩa, và hai nghĩa cho test khác nhau
- Phương án:
  - A. Giới hạn phạm vi: "Hệ thống không bắt buộc giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc." Lưu dữ liệu qua lần làm việc không phải lỗi
  - B. Lệnh cấm: "Hệ thống không được giữ deck, tài liệu có sẵn và ràng buộc của người dùng sau khi lần làm việc kết thúc." Test: mở lại ứng dụng không còn dữ liệu cũ
  - C. Giữ câu mô tả, chấp nhận cảnh báo Lint của GBR-02
- Đề xuất: A, vì D-027 mục 2 ghi "chưa mở lại được deck qua nhiều lần làm việc" (giới hạn tạm thời), và Exceptions của BR-012 nói rule hết hiệu lực khi có R-048. Nghĩa B có căn cứ yếu hơn ở UC-008 Postconditions 5 ("File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc")
- Quyết định:

### BR-L09 · SO_LIEU · Câu thoát "trừ khi việc đó cần thiết" ở BR-004
- Item: BR-004
- Tiêu chí: GX-08, GBR-06
- Hiện trạng: "…không được thay đổi phần deck ngoài phạm vi, trừ khi việc đó cần thiết và đã được người dùng xác nhận."
- Điều chưa biết hoặc cần chọn: những trường hợp nào thay đổi ngoài phạm vi được coi là "cần thiết"
- Phương án:
  - A. Người dùng liệt kê các trường hợp; chuyển thành ngoại lệ đánh số trong Exceptions
  - B. Bỏ "cần thiết", chỉ giữ điều kiện "đã được người dùng xác nhận" (nới rộng ngoại lệ, đổi nghĩa)
  - C. Giữ Proposed; câu "trừ khi …" giữ nguyên kèm câu hỏi trong `Câu hỏi mở`: "Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết?", nơi xử lý UC-023
- Đề xuất: C, vì BR-004 là Later, đang Proposed và gắn UC-023 chưa làm; mức Proposed cho phép điều chưa chốt kèm nơi xử lý. Khi đưa UC-023 vào làm thì phải trả lời trước khi lên Active
- Quyết định:

### BR-L10 · SO_LIEU · Câu thoát "trong giới hạn lưu trữ" ở BR-016
- Item: BR-016
- Tiêu chí: GX-08
- Hiện trạng: "…bản bị thay vẫn nằm trong lịch sử, trong giới hạn lưu trữ."
- Điều chưa biết hoặc cần chọn: giới hạn lưu trữ lịch sử là bao nhiêu (số bản, thời gian hoặc dung lượng) và bản nào bị loại khi vượt giới hạn
- Phương án:
  - A. Người dùng cho con số và quy tắc loại bản
  - B. Bỏ "trong giới hạn lưu trữ" (đổi nghĩa thành giữ vô hạn)
  - C. Giữ Proposed; vế "trong giới hạn lưu trữ" giữ kèm câu hỏi trong `Câu hỏi mở`, nơi xử lý UC-022
- Đề xuất: C, vì BR-016 là Later, Proposed, gắn UC-022 chưa làm
- Quyết định:

### BR-L11 · THAM_CHIEU_LOAI_CU · L-002 trong `source` của BR-017
- Item: BR-017
- Tiêu chí: GX-03, GX-11, GBR-10
- Hiện trạng: Căn cứ "R-047, L-002". Loại `L-` không được migrate. R-047 Ghi chú: "Nhu cầu đổi phong cách cả deck đang được theo dõi ở L-002"
- Điều chưa biết hoặc cần chọn: bỏ L-002 có làm mất nguồn của rule không. Không rõ L-002 dựa trên tài liệu hay buổi phỏng vấn nào
- Phương án:
  - A. Bỏ L-002, `source: [R-047]`. Nguồn vẫn truy được qua R-047
  - B. Thay L-002 bằng mã nguồn gốc mà L-002 dựa vào (người dùng cung cấp)
  - C. Giữ chuỗi "L-002" như mã nguồn (`allow_codes`). Rủi ro: chuỗi khớp mẫu ID của loại đã bỏ nên validator có thể báo tham chiếu gãy
- Đề xuất: A, vì R-047 là nguồn trực tiếp và mang cùng nhu cầu. Điều kiện: phía requirements không làm mất dấu nguồn của R-047. Nên gom vào một quyết định chung cho mọi tham chiếu `L-xxx` (R-003, R-017, R-047, UC-002, UC-023 và các Decision có L-xxx)
- Quyết định:

## 3. FILL_LATER

Không có field hay section bắt buộc mới nào phải để trống. `schema.json` không khai báo `required_sections` cho `business_rule`, và mọi field trong frontmatter (`id`, `short_name`, `status`, `scope`, `source`, `use_cases`) đều có dữ liệu trong sheet. `Bảng chuyển trạng thái` của BR-010 dựng từ nội dung đã có (chuyển chỗ từ cột Rule và các luồng UC), phần thiếu đã thành BR-L04. Các dòng dưới chỉ phát sinh tùy theo quyết định blocker:

| ID | Field/Section | Gợi ý |
|---|---|---|
| BR-003 | Câu hỏi mở | gợi ý: nếu BR-L05 chọn B: "Hệ thống phân biệt ràng buộc chỉ dành cho một lần sửa với ràng buộc kéo dài bằng cách nào? Nơi xử lý: A-013." |
| BR-004 | Câu hỏi mở | gợi ý: nếu BR-L09 chọn C: "Những trường hợp nào thay đổi ngoài phạm vi sửa được coi là cần thiết? Nơi xử lý: UC-023." |
| BR-005 | Bảng chuyển trạng thái | gợi ý: chỉ cần nếu BR-L03 chọn B; khi đó lấy các dòng thất bại, dừng, bỏ từ bảng của BR-010 ở mục 4 |
| BR-010 | Câu hỏi mở | gợi ý: nếu BR-L04 chọn B: 4 cặp trạng thái × sự kiện liệt kê trong BR-L04, nơi xử lý UC-004, UC-008 |
| BR-016 | Câu hỏi mở | gợi ý: nếu BR-L10 chọn C: "Giới hạn lưu trữ lịch sử là bao nhiêu bản hoặc bao lâu, và bản nào bị loại khi vượt giới hạn? Nơi xử lý: UC-022." |

## 4. Dịch thử

### BR-018 (đơn giản)

#### Bản gốc

| Cột | Giá trị |
|---|---|
| ID | BR-018 |
| Tên ngắn | Mỗi người dùng chỉ thấy dữ liệu của mình |
| Scope | Later |
| Status | Draft |
| Rule | Khi DeckAgent có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình. |
| Exceptions | 1. Dữ liệu được chủ sở hữu chủ động chia sẻ. |
| Ghi chú | 1. Áp dụng khi DeckAgent có tài khoản. |
| Căn cứ | R-051 |
| Related Use Cases | UC-009, UC-018 |
| Related Requirements | R-051 |
| Related Decisions | (trống) |

#### Bản dịch

```markdown
---
id: BR-018
short_name: "Mỗi người dùng chỉ thấy dữ liệu của mình"
status: Draft
scope: Later
source: [R-051]
use_cases: [UC-009, UC-018]
---

## Rule

1. Khi DeckAgent có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình.

## Exceptions

1. Dữ liệu được chủ sở hữu chủ động chia sẻ.

## Ghi chú

1. Áp dụng khi DeckAgent có tài khoản.
```

#### Thay đổi

1. Cột ID, Tên ngắn, Status, Scope → `id`, `short_name`, `status`, `scope`; tên file `BR-018.md` trùng `id` (GX-01). Giá trị `Draft`, `Later` có trong `schema.json` (GX-02).
2. Căn cứ "R-051" → `source: [R-051]` (GX-11).
3. Related Use Cases → `use_cases` (Áp lên).
4. Related Requirements (R-051) không ghi trong file này: quan hệ đã lật sang `R-051.business_rules` (GX-05).
5. Rule đánh số "1." theo template; câu giữ nguyên.
6. Xóa các section không áp dụng: `Bảng quyết định`, `Bảng chuyển trạng thái`, `Câu hỏi mở` (template cho phép xóa).
7. Không viết lại câu: item Draft chỉ chịu gate cấu trúc (GX-01, GX-02, GX-03, GX-05). Ghi chú lặp vế "Khi" của Rule; điều này vi phạm GX-12, nhưng GX-12 chỉ áp từ Proposed, nên để lại cho lúc nâng status.

### BR-010 (nhiều chỗ viết lại)

#### Bản gốc

| Cột | Giá trị |
|---|---|
| ID | BR-010 |
| Tên ngắn | Khi nào một bản trở thành bản đã chấp nhận |
| Scope | V1 |
| Status | Active |
| Căn cứ | D-025, R-020, R-031, D-030 |
| Related Use Cases | UC-001, UC-002, UC-004, UC-008, UC-013, UC-022 |
| Related Requirements | R-020, R-031 |
| Related Decisions | D-025, D-030 |
| Exceptions | 1. Xem và khôi phục nhiều bản cũ thuộc UC-022. |
| Ghi chú | (trống) |

Rule (nguyên văn):

> 1. Khi AI tạo deck lần đầu thành công, deck đó trở thành bản đã chấp nhận ngay.
> 2. Khi AI sửa deck, kết quả là bản chờ duyệt.
> 3. Bản chờ duyệt trở thành bản đã chấp nhận khi:
> a. người dùng giữ bản đó;
> b. một yêu cầu sửa mới đạt ranh giới commit ngay trước khi lượt xử lý AI mới bắt đầu;
> c. hoặc file tải về từ bản đó được tạo thành công và giao cho người dùng.
> 4. Với trường hợp 3b, nếu yêu cầu sửa mới còn cần hỏi lại, cảnh báo hoặc xác nhận, bản chờ duyệt hiện tại vẫn là bản chờ duyệt trong các bước đó. Nếu yêu cầu bị hủy hoặc bị từ chối trước ranh giới commit, bản chờ duyệt không trở thành bản đã chấp nhận và ràng buộc của yêu cầu mới không được giữ lại. Nếu không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất, ranh giới commit đạt ngay trước khi lượt xử lý AI bắt đầu; hệ thống không thêm bước xác nhận riêng.
> 5. Tại ranh giới commit của 3b, theo thứ tự: bản chờ duyệt hiện tại trở thành bản đã chấp nhận; ràng buộc của nó trở thành tập ràng buộc của bản đã chấp nhận; ràng buộc của yêu cầu mới được áp dụng; sau đó lượt xử lý AI bắt đầu. Nếu lượt này bị dừng, lỗi hoặc không qua kiểm tra, deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit, không quay về bản cũ hơn.
> 6. Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt.
> 7. Khi người dùng bỏ bản chờ duyệt, deck quay về bản đã chấp nhận làm cơ sở cho lần sửa đó, và ràng buộc mới nêu trong yêu cầu dẫn tới bản chờ duyệt cũng bị hủy.
> 8. Hệ thống chỉ bắt buộc giữ một bản đã chấp nhận làm cơ sở khôi phục cho bản chờ duyệt hoặc lượt xử lý đang chạy. Khi một bản chờ duyệt được chấp nhận để làm cơ sở cho lượt sửa mới, bản đó trở thành cơ sở khôi phục hiện tại; hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn để khôi phục nhiều bước.

#### Bản dịch

```markdown
---
id: BR-010
short_name: "Khi nào một bản trở thành bản đã chấp nhận"
status: Active            # <!-- BLOCKER BR-L04 -->
scope: V1
source: [D-025, R-020, R-031, D-030]
use_cases: [UC-001, UC-002, UC-004, UC-008, UC-013, UC-022]
---

## Rule

<!-- BLOCKER BR-L02 -->
<!-- BLOCKER BR-L03 -->

1. Khi AI tạo deck lần đầu thành công, hệ thống phải coi deck đó là bản đã chấp nhận.
2. Khi AI sửa deck, hệ thống phải coi kết quả sửa là bản chờ duyệt.
3. Khi người dùng giữ bản chờ duyệt, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
4. Khi một yêu cầu sửa mới đạt ranh giới commit trong lúc đang có bản chờ duyệt, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
5. Khi file tải về từ bản chờ duyệt được tạo thành công và giao cho người dùng, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
6. Ranh giới commit của một yêu cầu sửa mới đạt ngay trước khi lượt xử lý AI cho yêu cầu đó bắt đầu, và chỉ khi yêu cầu đó không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất.
7. Khi yêu cầu sửa mới còn bước hỏi lại, cảnh báo hoặc xác nhận cần hoàn tất, bản chờ duyệt hiện tại phải vẫn là bản chờ duyệt.
8. Khi yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, bản chờ duyệt hiện tại phải vẫn là bản chờ duyệt.
9. Khi yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, hệ thống không được giữ lại ràng buộc của người dùng nêu trong yêu cầu đó.
10. Hệ thống không được thêm bước xác nhận riêng để đạt ranh giới commit.
11. Tại ranh giới commit, tập ràng buộc của bản đã chấp nhận phải là tập ràng buộc của bản chờ duyệt vừa được chấp nhận, không gồm ràng buộc của người dùng nêu trong yêu cầu sửa mới.
12. Lượt xử lý AI bắt đầu sau ranh giới commit phải áp dụng ràng buộc của người dùng nêu trong yêu cầu sửa mới.
13. Khi lượt xử lý AI bắt đầu sau ranh giới commit bị dừng, lỗi hoặc không qua kiểm tra kết quả, hệ thống phải đưa deck và tập ràng buộc về bản đã chấp nhận tại ranh giới commit đó, không về bản đã chấp nhận cũ hơn.
14. Khi lượt tải về từ bản chờ duyệt bị hủy hoặc thất bại, bản chờ duyệt đó phải vẫn là bản chờ duyệt.
15. Khi người dùng bỏ bản chờ duyệt, hệ thống phải đưa deck về bản đã chấp nhận làm cơ sở cho lần sửa tạo ra bản chờ duyệt đó.
16. Khi người dùng bỏ bản chờ duyệt, hệ thống phải hủy ràng buộc của người dùng nêu trong yêu cầu sửa tạo ra bản chờ duyệt đó.
17. Khi có bản chờ duyệt hoặc lượt xử lý AI đang chạy, hệ thống phải giữ một bản đã chấp nhận làm cơ sở khôi phục.
18. Khi bản chờ duyệt được chấp nhận tại ranh giới commit, bản đó phải trở thành cơ sở khôi phục hiện tại.
19. Hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn cơ sở khôi phục hiện tại.

## Bảng chuyển trạng thái

| Trạng thái hiện tại | Sự kiện | Điều kiện | Trạng thái sau |
|---|---|---|---|
| Chưa có deck | AI tạo deck lần đầu thành công | — | Chỉ có bản đã chấp nhận (mục 1) |
| Chưa có deck | Lượt tạo deck bị dừng, lỗi hoặc không qua kiểm tra kết quả | — | Chưa có deck (UC-001 4A, 4B, 5A) |
| Chỉ có bản đã chấp nhận | Người dùng gửi yêu cầu sửa | Yêu cầu bị hủy hoặc bị từ chối | Không đổi (UC-004 2A, 2B, 2C) |
| Chỉ có bản đã chấp nhận | Lượt xử lý AI sửa deck bắt đầu | — | Lượt xử lý AI đang chạy; cơ sở khôi phục là bản đã chấp nhận hiện tại (mục 17) |
| Chỉ có bản đã chấp nhận | Người dùng bỏ bản chờ duyệt | — | Không đổi; hệ thống báo không còn lần sửa nào để bỏ (UC-013 1A) |
| Chỉ có bản đã chấp nhận | Tải về thành công, bị hủy hoặc thất bại | — | Không đổi (UC-008 4A) |
| Có bản chờ duyệt | Người dùng giữ | — | Chỉ có bản đã chấp nhận; bản chờ duyệt thành bản đã chấp nhận (mục 3) |
| Có bản chờ duyệt | Người dùng bỏ | — | Chỉ có bản đã chấp nhận là bản làm cơ sở cho lần sửa; ràng buộc mới của lần sửa bị hủy (mục 15, 16) |
| Có bản chờ duyệt | Tải về từ bản chờ duyệt thành công, file giao cho người dùng | — | Chỉ có bản đã chấp nhận; bản chờ duyệt thành bản đã chấp nhận (mục 5) |
| Có bản chờ duyệt | Lượt tải về bị hủy hoặc thất bại | — | Không đổi (mục 14) |
| Có bản chờ duyệt | Người dùng gửi yêu cầu sửa mới | Còn bước hỏi lại, cảnh báo hoặc xác nhận | Chờ hoàn tất yêu cầu sửa mới; bản chờ duyệt giữ nguyên (mục 7) |
| Có bản chờ duyệt | Người dùng gửi yêu cầu sửa mới | Không bị từ chối, không còn bước hỏi lại, cảnh báo hoặc xác nhận | Lượt xử lý AI đang chạy; bản chờ duyệt thành bản đã chấp nhận và là cơ sở khôi phục (mục 4, 6, 11, 18) |
| Chờ hoàn tất yêu cầu sửa mới | Các bước hỏi lại, cảnh báo, xác nhận hoàn tất | Yêu cầu không bị từ chối | Lượt xử lý AI đang chạy; bản chờ duyệt thành bản đã chấp nhận và là cơ sở khôi phục (mục 4, 6, 11, 18) |
| Chờ hoàn tất yêu cầu sửa mới | Yêu cầu bị hủy hoặc bị từ chối | — | Có bản chờ duyệt; ràng buộc của yêu cầu mới không được giữ (mục 8, 9) |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng giữ bản chờ duyệt | — | <!-- BLOCKER BR-L04 --> |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng bỏ bản chờ duyệt | — | <!-- BLOCKER BR-L04 --> |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng tải về | — | <!-- BLOCKER BR-L04 --> |
| Lượt xử lý AI đang chạy | AI sửa deck xong, kết quả qua kiểm tra kết quả | — | Có bản chờ duyệt (mục 2) |
| Lượt xử lý AI đang chạy | Lượt bị dừng, lỗi hoặc không qua kiểm tra kết quả | — | Chỉ có bản đã chấp nhận là cơ sở khôi phục của lượt; tập ràng buộc về theo bản đó (mục 13; UC-004 3A, 3B, 4A) |
| Lượt xử lý AI đang chạy | Người dùng gửi yêu cầu mới | — | Không đổi; hệ thống yêu cầu chờ hoặc dừng lượt hiện tại (BR-014; UC-014 2C) |
| Lượt xử lý AI đang chạy | Người dùng tải về | — | <!-- BLOCKER BR-L04 --> |

## Ghi chú

1. Xem và khôi phục nhiều bản cũ thuộc UC-022, không thuộc rule này.
```

#### Thay đổi

1. Frontmatter: Căn cứ → `source`; Related Use Cases → `use_cases`. Related Requirements (R-020, R-031) không ghi: đã lật sang `R.business_rules` (GX-05). Related Decisions (D-025, D-030) không ghi: đã lật sang `D.shapes` (GX-05).
2. `status: Active` gắn BR-L04: bảng còn 4 ô chưa suy ra được (GX-09, GBR-05).
3. Mục gốc 3 (một câu, ba vế a/b/c) tách thành mục 3, 4, 5, mỗi mục tự đứng được (GBR-03).
4. Mục gốc 4 bắt đầu "Với trường hợp 3b" phụ thuộc mục trước; tách thành mục 6, 7, 8, 9, 10, mỗi mục tự nêu điều kiện (GBR-03).
5. Mục gốc 5 "theo thứ tự: …; sau đó lượt xử lý AI bắt đầu" là trình tự bước; viết lại thành điều phải đúng tại ranh giới commit (mục 11, 12) và khi lượt lỗi (mục 13) (GBR-04). Vế "không gồm ràng buộc của người dùng nêu trong yêu cầu sửa mới" ở mục 11 suy ra từ thứ tự gốc (tập ràng buộc được chốt trước khi áp ràng buộc mới), không thêm thông tin.
6. "ràng buộc của nó" → "tập ràng buộc của bản chờ duyệt vừa được chấp nhận" (GX-17).
7. "ràng buộc của yêu cầu mới" → "ràng buộc của người dùng nêu trong yêu cầu sửa mới" (GX-07, GL-008).
8. "không qua kiểm tra" → "không qua kiểm tra kết quả" (GX-07, GL-021).
9. "trở thành bản đã chấp nhận ngay" → "phải coi deck đó là bản đã chấp nhận": bỏ "ngay" (GX-08), vì trạng thái gắn trực tiếp với sự kiện tạo thành công.
10. Mục gốc 1, 2, 6, 7 thêm chủ thể và "phải / không được" (GBR-02, GX-16). Mục gốc 7 có hai vế (quay về deck; hủy ràng buộc) nên tách thành mục 15, 16 (GBR-03).
11. Mục gốc 8 tách thành mục 17, 18, 19 (GBR-03). "chỉ bắt buộc giữ một bản" viết thành "phải giữ một bản" (mục 17) cộng "không bắt buộc giữ các bản cũ hơn" (mục 19), cùng nghĩa.
12. Thêm `Bảng chuyển trạng thái` (GBR-05). Mọi dòng có ô kết quả đều ghi mục Rule hoặc luồng UC làm căn cứ. Các dòng lấy từ UC-001, UC-004, UC-008, UC-013, UC-014 là tóm tắt kèm ID, không phát biểu lại như quy định mới (GX-10). Tên trạng thái "Chưa có deck", "Chỉ có bản đã chấp nhận", "Có bản chờ duyệt", "Chờ hoàn tất yêu cầu sửa mới", "Lượt xử lý AI đang chạy" là nhãn đặt cho các tình huống sheet đã mô tả, không phải trạng thái mới. 4 ô không có căn cứ ghi `BLOCKER BR-L04`.
13. Exceptions "Xem và khôi phục nhiều bản cũ thuộc UC-022" không phải trường hợp rule không áp dụng mà là giới hạn phạm vi → chuyển sang Ghi chú, xóa section Exceptions (GBR-06, GX-12).
14. Rule gắn BR-L02 (mục 4, 6–13 trùng D-030) và BR-L03 (mục 13–19 chồng BR-005, BR-014 mục 2) (GX-10, GBR-08).
15. "ranh giới commit" chưa có trong glossary (GBR-09); mục 6 nêu định nghĩa lấy từ mục gốc 4. Xem mục 6 của file này.
16. `short_name` giữ nguyên. Đếm theo khoảng trắng là 10 tiếng, vượt ngưỡng 8 của GBR-11 nếu đếm theo tiếng; xem mục 6.
17. Xóa section `Bảng quyết định` (không có ≥3 điều kiện kết hợp) và `Câu hỏi mở` (nếu BR-L04 chọn A).

## 5. Tham chiếu tới loại cũ

| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| BR-009.Ghi chú | L-001 ("Nhiều tài liệu cho một deck là câu hỏi ở L-001.") | Giữ làm text: "Dùng nhiều tài liệu có sẵn cho một deck chưa thuộc V1 và đang là câu hỏi chưa xử lý." Bỏ ID không làm mất thông tin về hành vi hay nguồn |
| BR-015.Ghi chú | OR-045 ("xem lại theo OR-045 khi UC-012 được đưa vào làm") | Bỏ. Ghi chú quy trình; số chỗ dùng đã kiểm bằng GBR-01 (UC-012 + R-049 = 2, đạt). Vế "Hiện chỉ gắn UC-012 và R-049" tóm tắt lại quan hệ nên cũng bỏ (GX-12) |
| BR-016.Ghi chú | OR-045 | Bỏ, cùng lý do (UC-022 + R-016 = 2, đạt GBR-01) |
| BR-017.Ghi chú | OR-045 | Bỏ, cùng lý do (UC-017 + R-047 = 2, đạt GBR-01). Ghi chú còn trống nên xóa section |
| BR-017.Căn cứ | L-002 | Blocker BR-L11 |

## 6. Ghi chú cho agent chính

1. **Chồng lấn một phần với Requirement, không thành blocker.** Các cặp sau chỉ trùng một vế. Theo `_CRITERIA.md` mục 1, BR sở hữu vế đó, nên không cần người dùng chọn. Phía requirements chỉ cần tóm tắt vế đó kèm ID BR (GX-10): R-003 (PPTX chỉ lấy nội dung ↔ BR-009 mục 2), R-008 (nội dung AI bổ sung ↔ BR-002 mục 2), R-023 (giữ phần ngoài phạm vi sửa ↔ BR-004), R-026 (báo phần không giữ được ↔ BR-013), R-047 (theme thống nhất ↔ BR-017), R-049 (không làm đổi deck gốc ↔ BR-015). Cặp R-051/BR-018 cùng là Draft nên chưa áp GX-10.
2. **Có thể lệch giữa R-025 và BR-006 / R-020.** R-025 ghi "giữa các định dạng tải về của cùng một bản đã chấp nhận". BR-006 và R-020 đã đổi ngày 27/09/2026 sang "bản đang xem trước (có thể là bản chờ duyệt)". Đề nghị agent requirements kiểm tra. BR-007 dùng "cùng một deck" nên không bị ảnh hưởng.
3. **BR-002 và R-008.** BR-002 (Active) dựa vào việc nội dung AI bổ sung "phân biệt được" với nội dung từ tài liệu, trong khi R-008 Ghi chú ghi "Cách hiển thị phần AI bổ sung chưa được chốt". Câu của BR-002 tự nó không chứa điều chưa chốt nên tôi không mở TRANG_THAI. Nếu blocker của R-008 kết luận rằng chưa phán được đạt hay không, BR-002 nên đi theo cùng quyết định đó.
4. **Glossary (GBR-09, GX-07).**
   - "ranh giới commit" (BR-010) chưa có trong glossary và có chữ tiếng Anh "commit". Đề nghị agent glossary thêm thuật ngữ, định nghĩa lấy từ BR-010 mục gốc 4 và D-030.
   - BR-015, BR-016 dùng "deck đã lưu", "bản sao", "deck gốc", "bản cũ", "lịch sử" chưa có trong glossary. Hai item này là Proposed nên Lint sẽ cảnh báo.
   - GL-008 "ràng buộc của người dùng" liệt kê "ngôn ngữ, độ dài, giọng văn"; BR-003 (và A-013) liệt kê "audience, ngôn ngữ, độ dài, mục đích". Theo GL-007, "mục đích" và "audience" thuộc "ý định". Tôi giữ nguyên danh sách của BR-003, vì đổi sang "ý định và ràng buộc của người dùng" là chọn cách hiểu. Agent glossary cần thống nhất.
   - Không item nào dùng từ trong cột "Không dùng" của glossary.
5. **Cách đếm từ cho GBR-11.** Đếm theo khoảng trắng (mỗi tiếng một từ), 7 `short_name` vượt 8: BR-001 (9), BR-003 (12), BR-007 (12), BR-008 (10), BR-010 (10), BR-011 (10), BR-018 (9). Đếm theo từ ghép thì phần lớn đạt. Đây là câu hỏi cho cả bộ tiêu chí, áp cho mọi loại, nên tôi không mở blocker và không đổi tên vì lý do này. Chỉ đề xuất đổi `short_name` của BR-005 (GX-08) và BR-013 (không nêu nội dung).
6. **Giả định đã tự đặt (không mở blocker).**
   - BR-008 Exceptions "Không có ngoại lệ trong luồng thông thường; tài liệu nội bộ được tin cậy (nếu có sau này) …": tôi hiểu "luồng thông thường" là để đối lập với trường hợp tài liệu nội bộ được tin cậy nêu ngay sau, nên hiện không có ngoại lệ. Nếu "luồng không thông thường" có nghĩa khác thì cần blocker.
   - BR-011: vế "Khi yêu cầu sửa nhắm vào một slide" lấy từ `short_name` ("Sửa theo slide…") và từ chính câu Rule ("các slide khác có thể bị thay đổi"); UC-004 2B cũng mô tả đúng như vậy.
   - BR-013: danh sách trong ngoặc "(loại file, loại sửa, thành phần không giữ được khi tải về)" được giữ nguyên, không biến thành danh sách đóng.
   - BR-014 Ghi chú "Người dùng phải chờ hoặc dừng lượt hiện tại trước khi gửi yêu cầu mới" giữ ở Ghi chú như hệ quả khi đọc, không nâng thành mệnh đề Rule.
7. **Gợi ý gom blocker với loại khác.** BR-L01 gom với blocker GX-10 của requirements. BR-L02 gom với decisions. BR-L05 gom với blocker về R-024 / A-013. BR-L07 gom với R-028 ("trong giới hạn của định dạng") và R-026. BR-L11 gom thành một quyết định chung cho mọi `L-xxx`.
8. **GX-04.** Business Rule không có quan hệ *dựa vào*, nên không phát sinh lỗi GX-04 phía BR. Nếu hạ BR-003 hoặc BR-010 xuống Proposed, các R Active trỏ tới (R-024; R-020, R-031) vẫn hợp lệ, vì Proposed còn hiệu lực.
9. **schema.json.** `business_rule.required_sections` rỗng, nên section `Rule` không bắt buộc ở tầng CI. Các loại khác cũng không khai báo section phát biểu chính (`Constraint`, `Yêu cầu`, `Decision`…), nên tôi coi đây là chủ ý thiết kế, không mở blocker SCHEMA. Agent chính nên xác nhận.
10. **UC trích BR-010.** UC-004, UC-008, UC-013 mô tả lại nhiều mệnh đề của BR-010 kèm ID BR-010. Như vậy là hợp lệ theo GX-10, nhưng khi BR-L03 hoặc BR-L04 thay đổi BR-010 thì các UC này cần xem lại.
