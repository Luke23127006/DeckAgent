# Trang quyết định cho 69 blocker của Pha A — ĐÃ ĐIỀN (03/10/2026)

## Cách dùng
1. **Trả lời từng chính sách.** Mỗi chính sách (P0–P9) và mỗi câu hỏi lẻ (Q1–Q3) có một dòng `Quyết định:`. Ghi `Đồng ý`, hoặc `Sửa: <nội dung>`.
2. **Claude Code áp xuống từng blocker.** Ở đầu Pha B, Claude Code áp các quyết định của bạn xuống từng blocker trong `BLOCKERS.md`. Nếu một blocker không khớp rõ với chính sách nào, nó đánh dấu `CẦN XEM` và dừng lại hỏi.
3. **Con số tạm.** Mọi con số trong trang này là **đề xuất tạm cho V1**, có đánh dấu `[tạm]`. Bạn sửa trực tiếp nếu thấy chưa hợp lý.
4. **Cách đọc ID.** Mỗi ID đều kèm ý chính trong ngoặc. Nhóm ID:
   - `G…-xx` là tiêu chí trong bộ gate;
   - `R-`, `UC-`, `BR-`, `C-`, `A-`, `D-`, `ACT-` là item spec lấy từ sheet;
   - `BLK-` là blocker của Pha A;
   - `W-`, `L-` là task và learning cũ của sheet.

---

## P0. Cho phép ngưỡng tạm (làm trước mọi việc khác)

**Vấn đề.** Hai tiêu chí hiện cấm đặt số khi chưa có dữ liệu:
- GR-09 (requirement mô tả một mức độ phải có Scale, Meter và Ngưỡng đạt; không đặt số khi chưa có dữ liệu);
- GX-09 (item Active không được còn chỗ "chưa chốt" ảnh hưởng tới việc phán đạt hay không đạt).

Vì vậy mọi blocker về số hiện chỉ có một lối thoát là hạ status. Hướng mới của bạn là đặt số tạm cho V1 rồi đổi lại theo kết quả thí nghiệm. Muốn vậy, bộ tiêu chí phải công nhận "số tạm" là đã chốt, nhưng vẫn phân biệt được với số đã có evidence.

**Hướng đề xuất**
- **Định dạng.** Mọi con số chưa có evidence viết như sau:
  `≤ 180 giây [tạm 2026-10-03 · xem lại: <sự kiện cụ thể>]`
  Chuỗi `[tạm` giúp máy tìm ra mọi số tạm.
- **Sửa bộ tiêu chí:**
  - GR-09 (Scale/Meter/Ngưỡng) và GX-09 (Active không còn chỗ chưa chốt): ngưỡng có nhãn `[tạm …]` được tính là **đã chốt** ở mức Active. Nhãn phải có ngày và sự kiện xem lại quan sát được.
  - GA-05 (Assumption phải có cách kiểm chứng: mẫu số, cỡ mẫu, ngưỡng Supported và Invalidated): cũng chấp nhận ngưỡng `[tạm]`.
  - `_COMMON_CRITERIA.md` (gate chung): thêm một đoạn ngắn định nghĩa ngưỡng tạm.
- **Báo cáo.** Pha B tạo `docs/specification/_PROVISIONAL.md` liệt kê mọi ngưỡng tạm (item, giá trị, sự kiện xem lại). File này được giữ lại sau migrate, làm backlog cho các thí nghiệm.
- **Không áp cho sự thật bên ngoài.** Thông tin do môn học, advisor hay đối tác áp đặt (ví dụ Q1) không được đặt số tạm.

**Hệ quả.** Ba item sau đều nói "không chốt số khi chưa có evidence", nên bị xóa theo P4:
- D-011 (không chốt cơ chế hay ngưỡng khi chưa có benchmark);
- C-006 (chưa coi lựa chọn implementation nào là bắt buộc);
- C-007 (không đặt ngưỡng định lượng trước benchmark).

Quy tắc mới thay chúng: "chốt số tạm, có nhãn và sự kiện xem lại".

**Quyết định:** Đồng ý.

---

## P1. Thiếu con số hoặc ngưỡng → đặt ngưỡng tạm cho V1

Item được giữ nguyên status, chỉ nhận thêm ngưỡng `[tạm]`.

Blocker thuộc nhóm này:
- BLK-001 (ngưỡng quá thời gian và trạng thái kết thúc của lượt xử lý AI)
- BLK-005 (ngưỡng cho assumption về nhóm người dùng và cách tương tác)
- BLK-006 (ranh giới chỉnh sửa trong và ngoài DeckAgent)
- BLK-007 (ngưỡng cho assumption về độ trung thực đầu ra và xem trước)
- BLK-008 (ngưỡng cho assumption về nhu cầu đầu vào)
- BLK-009 (ngưỡng cho assumption về giữ nguyên và giữ trạng thái)
- BLK-010 (tiêu chí benchmark cho phân loại lượt xử lý AI)
- BLK-011 (giới hạn kích thước và số trang của file tải lên)
- BLK-016 (số slide tối thiểu của một deck hoàn chỉnh)
- BLK-017 (Reopen When của Decision chưa quan sát được)
- BLK-046 (17 Assumption chưa có ngưỡng)
- BLK-058 (tiêu chí chất lượng của deck và kết quả AI đang chờ nghiên cứu)

### P1a. Lượt xử lý AI (BLK-001: ngưỡng quá thời gian)

- **Nơi sở hữu con số:** R-032 (xử lý lỗi của AI và dịch vụ bên ngoài). Các item sau chỉ tham chiếu R-032:
  - UC-001 (tạo deck chỉ từ yêu cầu gõ), UC-002 (tạo deck từ tài liệu có sẵn), UC-004 (yêu cầu AI sửa cả deck), UC-014 (xem tiến độ AI và dừng giữa chừng);
  - ACT-002 (AI model hoặc nhà cung cấp AI bên ngoài).

  "Chậm" được gộp vào "quá thời gian".
- **Ngưỡng quá thời gian:**
  - lượt tạo deck: **180 giây** `[tạm]`;
  - lượt sửa deck: **120 giây** `[tạm]`;
  - đã tính cả thời gian thử lại.
- **Thử lại tự động:** tối đa **1 lần**, chỉ khi nhà cung cấp AI trả lỗi tạm thời (hết thời gian kết nối, lỗi máy chủ, vượt giới hạn tần suất). Không thử lại khi kết quả không qua R-033 (kiểm tra kết quả AI trước khi hiển thị).
- **Trạng thái kết thúc:** một trong ba trạng thái `Hoàn tất`, `Đã dừng`, `Lỗi`. Danh sách này đã có trong UC-014 (xem tiến độ và dừng).
- **Hiển thị tiến độ** cho R-030 (hiển thị tiến độ và lỗi có hướng xử lý): lượt chạy quá **2 giây** `[tạm]` thì hiển thị tên bước đang chạy.
- **"Lỗi thường gặp"**, mỗi lỗi có thông báo kèm bước làm tiếp theo:
  - quá thời gian;
  - không kết nối được nhà cung cấp AI;
  - kết quả không qua kiểm tra;
  - không đọc được tài liệu.
- **Ngoại lệ:** R-037 (giới hạn tài nguyên cấu hình được) thuộc release Later, nên giữ "Chưa chốt" theo P2.

**Quyết định:** Đồng ý.

### P1b. Giới hạn đầu vào (BLK-011: giới hạn kích thước và số trang)

- **Nơi sở hữu:** R-003 (nhận 5 loại tài liệu có sẵn), qua section `Miền đầu vào`. Nhánh 2B của UC-002 (tạo deck từ tài liệu có sẵn) tham chiếu R-003 (nhận 5 loại tài liệu).
- **Giới hạn:**
  - file tải lên: ≤ **20 MB** `[tạm]`;
  - DOCX và PDF: ≤ **50 trang** `[tạm]`;
  - PPTX: ≤ **50 slide** `[tạm]`;
  - text dán vào, TXT, Markdown: ≤ **100.000 ký tự** `[tạm]`.
- **Lý do:** khoảng 50 trang vẫn vừa context của một lượt gọi AI. Sự kiện xem lại: lần benchmark đầu tiên với tài liệu thật.
- UC-003 (mở PPTX có sẵn để AI sửa tiếp, thuộc Later) dùng cùng giới hạn khi quay lại phạm vi.

**Quyết định:** Đồng ý.

### P1c. Chất lượng đầu ra AI (BLK-058)

Áp cho bốn item:
- R-007 (giữ đúng số liệu từ tài liệu);
- R-009 (dùng mục đích, audience và bối cảnh);
- R-021 (chất lượng deck tối thiểu);
- R-029 (không cần kỹ năng thiết kế).

Cả bốn giữ Active và có section `Đo lường` đầy đủ.

**Bộ đánh giá chung** `[tạm]`:
- 10 tài liệu mẫu: báo cáo có số liệu, bài giảng, đề xuất dự án; dài 3–20 trang; ít nhất 3 tài liệu có bảng số liệu;
- 10 yêu cầu không kèm tài liệu;
- mỗi đầu vào chạy 3 lần, tổng cộng 60 lượt;
- bộ này lưu trong repo, vị trí do Pha B đề xuất.

| Item | Scale (đo cái gì) | Meter (đo thế nào) | Ngưỡng `[tạm]` |
|---|---|---|---|
| R-007 (giữ đúng số liệu từ tài liệu) | Số con số và trích dẫn trên slide lấy từ tài liệu mà khác tài liệu, tính trên mỗi lượt | Script trích số trên slide, đối chiếu với tài liệu; người chấm xác nhận các chỗ không khớp | 0 sai lệch ở ≥ 90% lượt có tài liệu; tổng tỷ lệ số liệu sai ≤ 1% |
| R-021 (chất lượng deck tối thiểu) | Số slide mắc ít nhất một trong 4 lỗi tối thiểu: chữ không đọc được hoặc bị cắt, mạch trình bày gãy, slide hỏng hoặc trống ngoài ý muốn, bố cục vỡ | Validator tự động kiểm chữ tràn hoặc bị cắt khỏi khung, cỡ chữ nội dung < 12 pt, slide trống ngoài ý muốn; người chấm kiểm mạch trình bày gãy | 0 slide lỗi ở ≥ 90% lượt |
| R-009 (dùng mục đích, audience, bối cảnh) | Điểm rubric 1–3 về mức deck phản ánh audience và mục đích đã nêu | 2 người chấm độc lập, lấy điểm thấp hơn | ≥ 80% lượt đạt ≥ 2 điểm |
| R-029 (không cần kỹ năng thiết kế) | Đổi sang `verification: demonstration` (kiểm chứng bằng thao tác trước người xem). Đo số người hoàn thành luồng tạo → xem trước → sửa 1 lần → tải về mà không cần trợ giúp | Buổi thử với 5 người không chuyên thiết kế | ≥ 4/5 người hoàn thành trong ≤ 15 phút |

**Thêm thuật ngữ "deck dùng được"** vào glossary, với nghĩa: deck đạt R-021 (chất lượng tối thiểu), và đạt thêm R-007 (đúng số liệu) khi được tạo từ tài liệu. Các item sau dùng thuật ngữ này thay cho cách nói định tính:
- A-021 (sửa cả deck đủ đưa deck tới mức dùng được trong V1);
- D-014 (V1 chỉ cam kết sửa cả deck);
- D-025 (7 loại sửa cả deck của V1);
- ACT-001 (người dùng cá nhân tạo và sửa deck bằng AI).

**Quyết định:** Đồng ý.

### P1d. Assumption và Reopen When (BLK-005 tới BLK-010, BLK-017, BLK-046)

Thay vì đặt 17 bộ số riêng, áp **một quy trình kiểm chứng chung** `[tạm]`.

**Assumption về người dùng:**
- kiểm chứng bằng buổi thử với **≥ 5 người** thuộc nhóm ACT-001 (người dùng cá nhân tạo và sửa deck bằng AI);
- **Invalidated** nếu **≥ 2/5** người cho thấy điều ngược lại;
- **Supported** nếu **≤ 1/5**;
- chưa đủ 5 người thì giữ Open.

Áp cho 15 assumption sau:
- A-007: người dùng cá nhân muốn tạo và sửa deck chủ yếu bằng AI
- A-008: người dùng muốn AI làm phần lớn việc, không muốn một editor thủ công có thêm AI
- A-009: gõ yêu cầu bằng ngôn ngữ tự nhiên là cách tương tác chính phù hợp
- A-010: người dùng vẫn cần tự sửa các lỗi nhỏ
- A-011: nhập và sửa tiếp deck có sẵn là nhu cầu cốt lõi
- A-012: "sửa một chỗ hỏng chỗ khác" là vấn đề người dùng gặp thường xuyên
- A-013: ràng buộc của người dùng cần được giữ qua nhiều lần sửa
- A-014: một loại file dùng được với nhiều vai trò thì có giá trị
- A-015: người dùng quan tâm tới việc giữ đúng thông tin từ tài liệu
- A-016: giống nhau về ý nghĩa quan trọng hơn giống nhau về pixel
- A-017: xem trước đủ tin cậy để người dùng quyết định
- A-020: người dùng chấp nhận chỉnh tay chuyên sâu sau khi tải về
- A-021: sửa cả deck đủ để có deck dùng được
- A-022: file PPTX tải về đủ để chuyển sang chỉnh tay
- A-029: người dùng chấp nhận việc deck chỉ tồn tại trong lần làm việc

**Assumption cần benchmark:**
- A-018 (các lượt xử lý AI có độ khó khác nhau rõ ràng): Supported nếu thời gian hoặc chi phí trung bình của nhóm khó gấp ≥ 2 lần nhóm dễ, và nhóm dễ vẫn đạt R-021 (chất lượng tối thiểu). Dùng bộ đánh giá chung ở P1c.
- A-019 (các loại lượt xử lý phân biệt được rõ): 2 người gán nhãn độc lập cho 30 yêu cầu sửa; Supported nếu mức đồng thuận ≥ 80%.

**Định nghĩa còn thiếu** (BLK-006: ranh giới chỉnh sửa):
- "Lỗi nhỏ" ở A-010: sai chính tả, sai một con số, thay một từ hoặc một câu.
- "Chỉnh tay chuyên sâu" ở A-020: đổi bố cục, hình khối, animation hoặc định dạng của từng thành phần.

**Cách áp:**
- Claude Code dùng quy trình trên để viết câu Assumption, Signpost và Cách kiểm chứng cụ thể cho từng item.
- 17 assumption giữ status Open. **Không thêm status mới vào schema**; tức là bác phương án B của BLK-046 (đề xuất thêm một status mức Proposed cho Assumption).
- **Reopen When** của Decision (BLK-017) dùng cùng quy trình, ví dụ "≥ 2/5 người trong buổi thử …". Áp cho:
  - D-006 (DeckAgent là sản phẩm AI-first, không phải editor chuyên nghiệp)
  - D-014 (V1 chỉ cam kết sửa cả deck)
  - D-017 (các critical behavior P1, P2, P3, P5 của V1)
  - D-025 (7 loại sửa cả deck của V1)
  - D-030 (thời điểm bản chờ duyệt được chấp nhận)
- Riêng D-009 (nhiều định dạng ưu tiên giữ ý nghĩa, không đòi giống pixel): đổi "yêu cầu đồ án thay đổi" thành "C-003 (đồ án yêu cầu nhiều định dạng) thay đổi" (C-003: đồ án yêu cầu nhiều định dạng tải về).

**Quyết định:** Đồng ý.

### P1e. Bỏ điều kiện số khi định nghĩa đã đủ (BLK-016: số slide tối thiểu)

R-006 (tạo deck hoàn chỉnh) bỏ điều kiện "nhiều slide". Ghi chú của chính R-006 (tạo deck hoàn chỉnh) đã định nghĩa "hoàn chỉnh" là xem trước, sửa và tải về được.

**Quyết định:** Đồng ý.

---

## P2. Thiếu định nghĩa hoặc danh sách mà team tự quyết được

**Với item thuộc V1:** dùng định nghĩa rút từ nội dung đã có, theo phương án Pha A đề xuất.

- **BLK-002 (giới hạn định dạng khi tải về chưa định nghĩa)** → A:
  - BR-006 (tải về đúng bản đang xem trước) cho phép file thiếu một phần, *nếu* hệ thống đã báo phần đó cho người dùng theo BR-013 (không giả vờ làm được).
  - R-025 (nhất quán nội dung giữa PPTX và PDF) tham chiếu BR-007 (nhất quán ý nghĩa, không đòi giống pixel).
  - R-026 (báo thành phần không giữ được) và R-028 (xem trước khớp file tải về) ghi danh sách mất hoặc đổi là "Chưa chốt" và hạ xuống Proposed, cho tới khi có evidence từ implementation.
- **BLK-003 (ranh giới "hệ thống con quá lớn" của C-002 (giới hạn nguồn lực đồ án), giới hạn nguồn lực đồ án)** → A: danh sách ở Lý do 2 của C-002 (giới hạn nguồn lực đồ án) thành danh sách đóng gồm editor hoàn chỉnh, bản sao PowerPoint, cộng tác thời gian thực, hạ tầng SaaS phân tán, design system lớn. Bạn xác nhận danh sách đã đủ.
- **BLK-015 (thông tin nào thiếu thì phải hỏi lại)** → A: R-002 (hỏi lại khi yêu cầu thiếu thông tin) hỏi lại khi thiếu chủ đề hoặc thiếu mục đích.
- **BLK-045 (hỏi lại hay đánh dấu nội dung do AI bổ sung)** → A: R-008 (không gán nội dung AI bổ sung cho tài liệu) chấp nhận cả hai hành vi. Cách hiển thị là quyết định thiết kế.
- **BLK-055 (Exceptions của BR-001 (vai trò file theo mục đích) có hai cách hiểu)** → A: BR-001 (vai trò file theo mục đích sử dụng) thêm mệnh đề: khi người dùng đưa file với mục đích khác, hệ thống báo rằng V1 chỉ nhận vai trò tài liệu có sẵn, và không tự coi file đó là tài liệu có sẵn.
- **BLK-056 (mức cam kết của BR-012)** → A: BR-012 (deck chỉ tồn tại trong lần làm việc) viết thành "hệ thống *không bắt buộc* giữ dữ liệu sau khi lần làm việc kết thúc". Đây là giới hạn phạm vi, không phải lệnh cấm lưu.
- **BLK-059 (kiểm tra kết quả AI chưa định nghĩa)** → A: R-033 (kiểm tra kết quả AI trước khi hiển thị) chỉ đòi rằng kết quả không qua kiểm tra thì không thành bản chờ duyệt. Test bằng cách đưa vào một kết quả hỏng. Nội dung bước kiểm tra là quyết định thiết kế.
- **BLK-061 (R-010 (dùng deck mẫu) ở Proposed nhưng ghi "còn thăm dò")** → A: R-010 (dùng deck mẫu để học theo) hạ xuống Draft.

**Với item thuộc release Later:** giữ "Chưa chốt" kèm câu hỏi mở, ở mức Proposed.
- **BLK-012 (câu thoát ở BR-004)** (câu thoát "trừ khi cần thiết" ở BR-004 (không đổi ngoài phạm vi sửa), không thay đổi ngoài phạm vi sửa) → C.
- **BLK-013 (câu thoát ở BR-016)** (câu thoát "trong giới hạn lưu trữ" ở BR-016 (khôi phục bản cũ không xóa lịch sử), khôi phục bản cũ không xóa lịch sử) → C.
- **BLK-014 (câu thoát ở 11 requirement Later)** (câu thoát "đã công bố / hệ thống hỗ trợ" ở 11 requirement Later) → A.
- R-037 (giới hạn tài nguyên) ở P1a cũng theo cách này.

**Ba chỗ cần hành vi mới chưa có trong sheet.** Đề xuất dưới đây, bạn xác nhận từng chỗ:

- **BLK-043: loại, thời hạn và xung đột của ràng buộc người dùng.** Áp cho BR-003 (ràng buộc còn hiệu lực qua các lần sửa), R-001 (ghi nhận ý định và ràng buộc), R-024 (giữ ràng buộc qua các lần sửa); cả ba giữ Active.
  - Loại ràng buộc: ngôn ngữ, độ dài (số slide), audience, mục đích, giọng văn, yêu cầu riêng.
  - Ràng buộc chỉ áp cho một lần sửa khi yêu cầu có cụm "chỉ lần này", "lần này thôi" hoặc tương đương. Ràng buộc đó hết hiệu lực khi lượt sửa kết thúc.
  - Hai ràng buộc cùng loại xung đột thì ràng buộc mới thay ràng buộc cũ. Ràng buộc khác loại không thay nhau.
- **BLK-060: luồng nào được đưa nội dung người dùng ra ngoài.** Áp cho R-042 (bảo vệ dữ liệu người dùng), giữ Active.
  - Chỉ một luồng được phép: gửi tới nhà cung cấp AI qua ACT-002 (nhà cung cấp AI bên ngoài) để tạo và sửa deck.
  - Log không chứa nội dung tài liệu hay nội dung deck.
  - File tạm bị xóa khi lần làm việc kết thúc.
- **BLK-054: 4 ô trống trong bảng chuyển trạng thái của BR-010 (khi nào bản thành bản đã chấp nhận)** (khi nào một bản trở thành bản đã chấp nhận). Trong lúc chờ hoàn tất yêu cầu sửa mới, hoặc khi lượt xử lý AI đang chạy, hệ thống không cho giữ, bỏ hay tải về. Nếu người dùng thử, hệ thống báo "Đang xử lý yêu cầu, hãy chờ hoặc dừng lượt hiện tại".

**Quyết định:** Đồng ý.

---

## P3. Nội dung trùng: ai sở hữu (BLK-033 tới BLK-041)

Theo GX-10 (mỗi nội dung quy định có một item sở hữu; nơi khác chỉ tóm tắt kèm ID).

**Thứ tự sở hữu:**

| Nội dung | Item sở hữu | Item còn lại |
|---|---|---|
| Quy tắc chi tiết áp cho nhiều luồng | Business Rule | Requirement giữ năng lực và Acceptance riêng, trỏ tới BR |
| Lựa chọn và lý do | Decision | Rút về "lựa chọn + tóm tắt kèm ID" |
| Vòng đời bản deck (commit, khôi phục, dừng, lỗi) | BR-010 (khi nào một bản thành bản đã chấp nhận), dưới dạng bảng chuyển trạng thái | Tham chiếu BR-010: BR-005 (luôn giữ được bản dùng được gần nhất), BR-014 (mỗi lúc một lượt xử lý AI) mục 2 (mỗi lúc một lượt xử lý AI), UC-004 (yêu cầu AI sửa cả deck) |
| Phạm vi sản phẩm được nhắc lại trong Actor, Constraint, Assumption | Item quy định gốc | Chỉ tóm tắt kèm ID; bỏ mệnh đề "phải / không cần" khỏi Assumption |
| Requirement trùng Requirement | Mỗi item giữ phần năng lực riêng | Bỏ phần trùng, thay bằng ID |
| Requirement trùng Decision | Requirement giữ quy định; Decision giữ lý do | Không xóa, không viết lại Decision cũ |

**Áp phương án A cho từng blocker:**
- **BLK-033 (BR và Requirement nói cùng một quy định):** BR sở hữu quy tắc. R-020 (tải về đúng bản đang xem trước) vế 2, R-024 (giữ ràng buộc qua các lần sửa) Acceptance 2–4, R-031 (quay về bản đã chấp nhận gần nhất) Acceptance 2 và R-046 (dừng lượt xử lý AI) Acceptance 2–3 rút về tóm tắt kèm ID của BR. Thêm quan hệ R-011 (sửa cả deck bằng chat), R-024 (giữ ràng buộc qua các lần sửa), R-046 → BR-010 (khi nào bản thành bản đã chấp nhận).
- **BLK-034 (BR lặp câu Decision):** BR giữ điều phải đúng. D-030 (thời điểm chấp nhận bản chờ duyệt) rút về tối đa 3 vế, phần chi tiết ghi "theo BR-010 (khi nào bản thành bản đã chấp nhận)".
- **BLK-035 (item sở hữu vòng đời bản deck):** BR-010 (khi nào bản thành bản đã chấp nhận) sở hữu toàn bộ, trong một bảng chuyển trạng thái. UC-004 (yêu cầu AI sửa cả deck) bỏ nhánh 1A và tham chiếu BR-010 (khi nào bản thành bản đã chấp nhận).
- **BLK-036 (Constraints của ACT-001 (người dùng cá nhân) nhắc lại phạm vi):** ACT-001 (người dùng cá nhân) chỉ giữ 4 dòng tóm tắt kèm ID. Ý "không có cộng tác" xem Q3.
- **BLK-037 (ACT-002 (nhà cung cấp AI bên ngoài) nói "kết quả AI không tự thành bản đã chấp nhận", mâu thuẫn BR-010):** hiểu theo R-033 (kiểm tra kết quả trước khi hiển thị); ghi câu này vào phần Permissions của ACT-002 (nhà cung cấp AI bên ngoài).
- **BLK-038 (Constraint chép nội dung của D-026 (V1 tải về PPTX và PDF) và R-025):** D-026 (V1 tải về PPTX và PDF) và R-025 (nhất quán nội dung giữa định dạng) sở hữu. C-003 (đồ án yêu cầu nhiều định dạng) và C-004 (các định dạng có khả năng khác nhau) chỉ tóm tắt trong Ghi chú.
- **BLK-039 (mệnh đề "phải" nằm trong Assumption):** bỏ mệnh đề đó khỏi Assumption; item sở hữu giữ quy định.
- **BLK-040 (Requirement trùng Requirement):** bỏ phần trùng ở một bên, thay bằng ID.
- **BLK-041 (Requirement trùng Decision):** Requirement sở hữu; Decision giữ nguyên làm bản ghi lựa chọn.

**Ngoại lệ:** không xóa ID nào trong nhóm này. Nếu BR-005 (luôn giữ bản dùng được gần nhất) sau khi rút gọn không còn nội dung riêng, Claude Code đánh dấu `CẦN XEM` thay vì tự xóa.

**Quyết định:** Đồng ý.

---

## P4. Quan hệ tới item đã đóng hoặc item quy trình (BLK-025 tới BLK-032)

Theo GX-04 (item Active chỉ được dựa vào item còn hiệu lực).

**Bỏ quan hệ** (item đích đã đóng, hoặc đã có chủ sở hữu khác):
- **BLK-025:** bỏ quan hệ tới C-001 (AI-first, không phải editor chuyên nghiệp; đã Retired). Nội dung đã nằm ở D-006 (AI-first, không phải editor) và D-015 (không ưu tiên editor trên web).
- **BLK-026:** bỏ quan hệ tới C-005 (vai trò file không gán theo loại file; đã Retired). Nội dung đã nằm ở D-007 (vai trò file theo mục đích) và BR-001 (vai trò file theo mục đích).
- **BLK-027:** bỏ quan hệ tới A-004 (Architecture hiện tại chuẩn hóa được; Retired) và UC-005 (tự tay sửa chữ; Deprecated).
- **BLK-028:** bỏ quan hệ R-042 (bảo vệ dữ liệu người dùng) → UC-018 (xem và xóa tài liệu đã tải lên; đang Draft).

**Xóa item quy trình** (đưa vào danh sách ID đã nghỉ):
- **BLK-029:** A-005 (tập trung test vào critical behavior là đủ). Đây là giả định về cách team test, nên bỏ luôn quan hệ từ 9 Requirement tới nó.
- **BLK-030:** C-006 (chưa coi lựa chọn implementation nào là bắt buộc), C-007 (không đặt ngưỡng trước benchmark), D-011 (không chốt cơ chế hay ngưỡng khi chưa có evidence). Được thay bằng P0.
- **BLK-031:** D-010 (cách phân loại "nhiều định dạng" trong spec).
- **BLK-032:** D-028 (khi nào tiêu chí chất lượng thành Hard Gate). Danh sách 4 lỗi tối thiểu chuyển hẳn sang R-021 (chất lượng deck tối thiểu).

Mọi chỗ đang trích D-011 (không chốt ngưỡng khi chưa có evidence) hay D-028 (khi nào thành Hard Gate) trong text hoặc `source` thì bỏ phần trích, hoặc thay bằng ID của item đang sở hữu nội dung đó.

**Quyết định:** Đồng ý.

---

## P5. Tách, gộp, đổi loại

**Quy tắc chung:**
- Hai vế có thể đạt hoặc trượt độc lập thì tách thành **ID mới**, tiếp số sau ID lớn nhất hiện có. Theo GR-04 (requirement đơn nhất) và GA-02 (assumption đơn nhất).
- Vế đã có chủ sở hữu ở item khác thì **bỏ vế đó**, không tách.

**Áp vào từng blocker:**
- **BLK-019 (Requirement gộp nhiều hành vi)** → A:
  - Tách thành 3 ID mới: R-014 (thêm, xóa, sắp xếp slide và thay hình), R-018 (tạo hoặc tìm hình minh họa), R-030 (hiển thị tiến độ và lỗi có hướng xử lý).
  - R-020 (tải về đúng bản đang xem trước) bỏ vế 2, vì BR-010 (khi nào bản thành bản đã chấp nhận) đã sở hữu.
  - R-026 (báo thành phần không giữ được) bỏ vế trùng.
- **BLK-020 (R-041 (không xây editor chuyên nghiệp) có type Constraint)** → A: xóa R-041 (không xây editor chỉnh slide chuyên nghiệp). Nội dung thuộc D-015 (V1 không ưu tiên editor chỉnh tay trên web).
  - Hệ quả: BLK-027 (R-041 dựa vào item đã đóng) tự đóng, và bỏ `addresses: [R-041]` ở D-006 (AI-first, không phải editor), D-011 (không chốt ngưỡng khi chưa có evidence), D-015 (không ưu tiên editor trên web).
  - Để C-002 (giới hạn nguồn lực đồ án) vẫn đạt GC-07 (Constraint về dự án chỉ được giữ trong spec khi có Requirement hoặc Decision trỏ tới), thêm `constraints: [C-002]` vào D-015 (không ưu tiên editor trên web), vì lý do của D-015 (không ưu tiên editor trên web) vốn dựa vào giới hạn nguồn lực.
- **BLK-018 (A-007 (nhu cầu của nhóm người dùng) gộp mô tả nhóm người dùng với lựa chọn phân khúc)** → A: A-007 (nhu cầu của nhóm người dùng) chỉ giữ một khẳng định về nhu cầu của nhóm người dùng mà ACT-001 (người dùng cá nhân) mô tả. Ngưỡng theo P1d.

**Quyết định:** Đồng ý.

---

## P6. Hoàn thiện luồng Use Case

Nguyên tắc: chỉ dùng hành vi đã có ở các item khác. Áp GUC-12 (mỗi lỗi của actor hỗ trợ phải có nhánh tương ứng, hoặc lý do bỏ qua).

| Blocker | Chọn | Nội dung |
|---|---|---|
| BLK-021 (Permissions của actor lệch với bước Use Case) | A | Đồng bộ Permissions của ACT-001 (người dùng cá nhân), ACT-002 (nhà cung cấp AI bên ngoài), ACT-003 (quản trị viên tài khoản) với mọi Use Case chưa Deprecated, ghi kèm ID Use Case |
| BLK-022 (UC-007 (đưa deck mẫu cho AI học), đưa deck mẫu cho AI học theo, có bước AI nhưng thiếu ACT-002) | A | Thêm ACT-002 (nhà cung cấp AI bên ngoài) vào `supporting_actors` của UC-007 (đưa deck mẫu cho AI học) |
| BLK-023 (R-025 (nhất quán PPTX và PDF), R-028 (xem trước khớp file tải về) vẫn nói "bản đã chấp nhận") | A | Đổi thành "bản người dùng đang xem trước", khớp R-020 (tải về đúng bản đang xem trước) |
| BLK-024 (R-026 (báo phần không giữ được) Acceptance 2 yếu hơn Yêu cầu) | A | Bắt buộc báo người dùng, không chỉ ghi log |
| BLK-047 (thiếu nhánh cho Hành vi lỗi của ACT-002) | A | Quá thời gian và lỗi kết nối thành hai nhánh riêng. "Sai định dạng" thuộc nhánh không qua R-033 (kiểm tra kết quả AI). "Đổi hành vi giữa các phiên bản model" ghi lý do bỏ qua trong Ghi chú |
| BLK-048 (lượt tạo file tải về có dừng được không) | A | V1 không cho dừng, theo phạm vi của D-029 (V1 chỉ cho dừng lượt xử lý AI) |
| BLK-049 (PDF không có text layer rơi vào nhánh nào) | C | UC-002 (tạo deck từ tài liệu) thêm nhánh 3B: báo chưa nhận PDF không có text layer, quay lại bước 1 |
| BLK-050 (UC-004 (yêu cầu AI sửa cả deck) kết thúc thành công ở đâu) | A | Kết thúc khi người dùng xem trước bản chờ duyệt |
| BLK-051 (Trigger của UC-008 (tải deck về), tải deck về, đứng sau bước 1) | B | Claude Code viết câu Trigger mới; bạn duyệt trong diff |
| BLK-052 (nhánh 1B của UC-011 (bắt đầu deck mới), bắt đầu deck mới, không có điểm kết thúc) | A | Tách thành nhánh xác nhận rời trang và nhánh hủy, theo R-045 (cảnh báo trước khi mất deck chưa tải về) |
| BLK-053 (người dùng hủy khi hệ thống hỏi lại) | A | UC-001 (tạo deck chỉ từ yêu cầu) và UC-002 (tạo deck từ tài liệu) thêm nhánh hủy: không tạo deck, kết thúc Use Case. **Đây là hành vi mới, cần bạn xác nhận** |
| BLK-054 (4 ô trống trong bảng trạng thái của BR-010) | A | Theo đề xuất ở P2 |

**Quyết định:** Đồng ý.

---

## P7. Mức cam kết (BLK-057)

Áp GR-02 (requirement Active dùng "phải"; "nên" và "có thể" chỉ dùng ở Proposed hoặc Draft). Chọn A: R-002 (hỏi lại khi yêu cầu thiếu thông tin) và R-030 (hiển thị tiến độ và lỗi) đổi "nên" thành "phải", vì cả hai thuộc V1 và đều có Acceptance dạng bắt buộc.

**Quyết định:** Đồng ý.

---

## P8. Mã cũ W-xxx, L-xxx

- **BLK-062 (mã L-, W- trong `source`)** → A: bỏ các mã này khỏi `source`. Kết luận của chúng đã nằm trong D-024 (5 loại tài liệu V1 nhận) và D-025 (7 loại sửa cả deck). Các mã bị bỏ:
  - L-001: nên mở thêm loại tài liệu nào sau V1;
  - L-002: có cần đổi phong cách cả deck hay hình do AI tạo không;
  - W-026: giải quyết câu hỏi product ảnh hưởng Architecture.
- **BLK-063 (W-xxx đang làm nơi xử lý cho điều chưa chốt)** → A: giữ W-xxx dạng text, ví dụ `(nơi xử lý: W-032)` (W-032: soạn Testing Approach ban đầu), cho tới khi Work chuyển thành GitHub Issue. Với P1, phần lớn các chỗ này sẽ biến mất vì đã có ngưỡng tạm.

**Quyết định:** Đồng ý.

---

## P9. Quy ước glossary và schema

Liên quan GX-07 (dùng đúng thuật ngữ trong glossary, không dùng từ trong cột "Không dùng").

| Blocker | Chọn | Nội dung |
|---|---|---|
| BLK-042 ("session" là từ cấm của hai thuật ngữ: "lần làm việc" và "phiên đăng nhập") | A | Giữ ở cả hai; Lint gợi ý cả hai thuật ngữ |
| BLK-064 (Area ngoài enum) | A | `CI` và `Infra` → `CI/Infra`; bỏ `Schedule` |
| BLK-065 (Review Trigger chứa tín hiệu không cho thấy assumption sai) | A | Chuyển vế đó sang Ghi chú, dạng "xem lại phạm vi khi …" |
| BLK-066 (từ cấm kèm điều kiện trong ngoặc) | A | Giữ điều kiện; Lint hiện điều kiện để người review quyết định |
| BLK-067 (điều kiện ở cuối danh sách áp cho từ nào) | C | `style` có điều kiện, `validate` có điều kiện, `LLM` cấm tuyệt đối |
| BLK-068 ("Hệ thống" và "DeckAgent" là hai tên của một khái niệm) | A | "DeckAgent" là tên riêng, dùng trong câu Yêu cầu; các section khác dùng "Hệ thống" |
| BLK-069 (từ cấm nằm trong tên riêng) | A | Tên riêng (P1–P5, tên sản phẩm và tính năng của bên khác) viết trong backtick hoặc ngoặc kép, được miễn GX-07 (dùng đúng thuật ngữ glossary) |

**Quyết định:** Đồng ý. Bổ sung: lint từ vựng (GX-07: dùng đúng thuật ngữ glossary) phải chạy tự động trong CI mỗi khi có PR sửa `docs/specification/**`. Việc này làm ở task validator + CI sau Pha B, không làm trong Pha B.

---

## Câu hỏi lẻ (không gom được)

### Q1. BLK-004: đồ án bắt buộc bao nhiêu định dạng tải về?

Liên quan C-003 (đồ án yêu cầu nhiều định dạng tải về) và D-026 (V1 tải về PPTX và PDF). Đây là sự thật bên ngoài, nên không đặt số tạm được.
- Môn học hoặc advisor **bắt buộc** → chọn A: "ít nhất 2 định dạng", khớp với D-026 (V1 tải về PPTX và PDF).
- Chỉ **khuyến khích** → chọn D: Retire C-003 (đồ án yêu cầu nhiều định dạng), ý "nhiều định dạng" do D-026 (V1 tải về PPTX và PDF) sở hữu.
- Chưa hỏi được → chọn C: hạ C-003 (đồ án yêu cầu nhiều định dạng) về Proposed.

**Quyết định:** Sửa. Không chọn A, C hay D như đề xuất ban đầu. Quyết định:
1. Danh sách định dạng là **lựa chọn của team**, lấy theo benchmark Napkin AI. Đây không phải yêu cầu áp từ môn học hay advisor.
2. **V1** tải về 4 định dạng:
   - PPTX (sửa được trong Microsoft PowerPoint);
   - PDF (để in, lưu trữ, chia sẻ);
   - PNG: mỗi slide một ảnh, đóng gói thành file .zip;
   - SVG: mỗi slide một ảnh vector, đóng gói thành file .zip.
3. **Release Later:** đẩy deck vào Google Drive của người dùng dưới dạng file Google Slides. Người dùng đăng nhập Google để cấp quyền.
4. Hệ quả:
   - Tạo Decision mới (ID kế tiếp sau ID Decision lớn nhất) sở hữu danh sách định dạng ở mục 2 và mục 3. D-026 (V1 tải về PPTX và PDF) chuyển sang Superseded, có `superseded_by` trỏ tới Decision mới.
   - C-003 (đồ án yêu cầu nhiều định dạng) chuyển sang Retired, vì không còn là giới hạn áp từ bên ngoài. Ý "advisor khuyến khích nhiều định dạng" ghi vào Context của Decision mới.
   - Tạo một Requirement Later, status Proposed, cho việc đẩy lên Google Drive. Câu hỏi mở của Requirement này ghi: khi đưa vào release phải mở lại D-027 (V1 không có tài khoản) và thêm luồng Google vào R-042 (bảo vệ dữ liệu người dùng).

### Q2. BLK-044: kiểm chứng PPTX trên ứng dụng nào?

Liên quan R-027 (file tải về mở được), UC-008 (tải deck về PPTX hoặc PDF), A-022 (PPTX tải về đủ để chỉnh tay), D-026 (V1 tải về PPTX và PDF; mức tương thích chưa chốt).

Đề xuất **A: PowerPoint**. Tình huống và Ghi chú của UC-008 (tải deck về) đều nhắm PowerPoint. D-026 (V1 tải về PPTX và PDF) mục 3 chỉ để mở *mức* tương thích, không để mở *ứng dụng*. Google Slides và LibreOffice nằm ngoài cam kết V1.

**Quyết định:** Đồng ý: Microsoft PowerPoint.

### Q3. BLK-036: "không có cộng tác thời gian thực" áp cho V1 hay cả sản phẩm?

Liên quan ACT-001 (người dùng cá nhân) và D-027 (V1 chạy trên máy người dùng, không host, không tài khoản, không cộng tác).

Đề xuất **A: chỉ V1**, khớp D-027 (V1 chạy local, không tài khoản, không cộng tác). Nếu chọn áp cho cả sản phẩm (B), Pha B phải tạo một Decision mới để sở hữu lựa chọn đó.

**Quyết định:** Đồng ý: chỉ áp cho V1.
