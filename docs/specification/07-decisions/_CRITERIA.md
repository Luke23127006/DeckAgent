# Gate: Decision

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Decision là gì, không là gì

**Decision ghi một lựa chọn về cách làm, kèm các phương án đã cân nhắc và lý do chọn.** Khi ở Proposed, đó là lựa chọn **được đề xuất**; khi Active, đó là lựa chọn **đã được chấp thuận**. Thông thường có ít nhất hai phương án khả dĩ. Nếu chỉ có một phương án khả thi, Decision vẫn được ghi, nhưng phải nêu vì sao các phương án khác không khả thi (GD-03). Như vậy người đọc sau biết đã có cân nhắc, không phải lựa chọn mặc định.

Gate dựa trên ba nguồn:
- **ADR của Nygard:** mỗi record một quyết định; context trung tính; quyết định viết ở thể chủ động; ghi đủ hệ quả, kể cả hệ quả xấu.
- **MADR:** bổ sung Phương án đã xét, Decision Drivers, và Confirmation (cách xác nhận implementation theo đúng quyết định).
- **Definition of Done của Zimmermann (ecADR):** Evidence, Criteria (≥2 phương án), Agreement, Documentation, Realization/Review.

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Giới hạn áp từ bên ngoài, team không tự ý thay đổi | Constraint |
| Hành vi hệ thống phải có (hệ quả của quyết định) | Requirement, được Decision trỏ qua `shapes`. Decision không viết lại hành vi đó |
| Quy tắc chi tiết rút ra từ quyết định | Business Rule, được trỏ qua `shapes`. Decision giữ lựa chọn, rule giữ điều phải đúng |
| Quyết định về cách team làm việc (sprint, review, công cụ) | Tài liệu quản lý dự án, trừ khi có Requirement hoặc Constraint trong spec dựa vào |

## 2. Quan hệ của Decision

Decision có quan hệ theo cả hai hướng ảnh hưởng, nên field được tách theo loại trong `_COMMON_CRITERIA.md` mục 2:

| Field | Loại | Nghĩa | Khi nào phải xem lại Decision hoặc item đích |
|---|---|---|---|
| `addresses` | Dựa vào | Requirement mà Decision chọn cách đáp ứng | Requirement đổi → xem lại Decision |
| `assumptions` | Dựa vào | Decision chỉ đúng khi assumption đúng | Assumption bị Invalidated → xem lại Decision |
| `constraints` | Dựa vào | Giới hạn mà Decision tôn trọng | Constraint đổi → xem lại Decision |
| `shapes` | Áp lên | Requirement hoặc Business Rule sinh ra hay bị thu hẹp từ Decision | Decision đổi → xem lại item đích |
| `documents`, `source` | Tham chiếu | Evidence, phân tích chi tiết | Không lan ảnh hưởng |
| `superseded_by` | Tham chiếu | Decision thay thế | Không lan ảnh hưởng; được trỏ tới Decision đã đóng |

## 3. Decision và testing

Decision không được test trực tiếp. Nó nối với testing qua hai chỗ:
- **Xác nhận tuân thủ** (MADR Confirmation): review, test hoặc check cho biết implementation đi đúng **từng vế** của quyết định.
- **Reopen When:** điều kiện quan sát được để mở lại quyết định, thường là kết quả của test, benchmark hoặc user test.

## 4. Áp gate theo vòng đời

| Status của Decision | Mức sẵn sàng | Hiệu lực | Gate |
|---|---|---|---|
| Proposed (lựa chọn đề xuất) | Proposed | Có | GD-01, GD-02, GD-03, GD-11 |
| Active (lựa chọn đã chấp thuận) | Active | Có | Đầy đủ |
| Reopened (đang xem lại) | Active | Có; Lint cảnh báo item dựa vào nó | Đầy đủ |
| Superseded | Closed | Không | Chỉ cấu trúc, cộng GD-09 |

## 5. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GD-01 | Section `Decision` nêu **lựa chọn** (đề xuất hoặc đã chấp thuận, theo status), thể chủ động, bắt đầu bằng chủ thể hoặc phạm vi. Không ghi lý do ở đây. Tối đa 3 vế đánh số; nhiều hơn thì tách thành nhiều Decision | Quyết định lẫn lý do; một record chứa nhiều quyết định | Lint (>3 vế hoặc >~400 ký tự) + Review | Proposed | Nygard ("one decision", "We will…") |
| GD-02 | Section `Context`: vấn đề hoặc câu hỏi dẫn tới quyết định, và các lực tác động. Viết trung tính, chưa nghiêng về phương án nào | Không biết quyết định giải bài toán gì; khó đánh giá khi nào hết hiệu lực | CI (section) + Review | Proposed | Nygard (value-neutral), MADR |
| GD-03 | Section `Phương án đã xét`: ≥2 phương án kèm lý do chọn hoặc loại. Nếu chỉ một phương án khả thi, ghi các phương án đã nghĩ tới và lý do chúng không khả thi | Không biết phương án bị loại vì sao, nên phương án đó dễ bị đề xuất lại | CI (section) + Review | Proposed | ecADR (Criteria), MADR (Considered Options) |
| GD-04 | `Rationale / Evidence` dựa trên evidence có ID trong `source` hoặc `documents` (tài liệu, báo cáo benchmark, kết quả spike), hoặc trên tiêu chí nêu rõ. Không chỉ là "hợp lý nhất" | Quyết định theo cảm giác; evidence không tìm lại được | Review | Active | ecADR (Evidence) |
| GD-05 | Section `Hệ quả` gồm cả mặt tốt **và** mặt xấu: đánh đổi, việc phải làm thêm, khả năng bị mất | Chỉ ghi mặt tốt, đánh đổi bị quên | CI (section) + Lint (không có dòng "Đánh đổi") | Active | Nygard ("all consequences… not just the positive ones"), MADR |
| GD-06 | Section `Xác nhận tuân thủ`: với **mỗi vế** của Decision và mỗi đánh đổi cần kiểm soát, có review, test hoặc check cho biết implementation đi đúng. Decision chỉ về phạm vi sản phẩm thì ghi "Không áp dụng: <lý do>" | Quyết định được ghi rồi bị code lờ đi; chỉ một phần quyết định được kiểm | CI (section) + Review | Active | MADR (Confirmation), ecADR (Realization) |
| GD-07 | `Reopen When`: điều kiện quan sát được. Không dùng "khi có thay đổi" | Không bao giờ xem lại, hoặc xem lại tùy hứng | Lint (GX-08) + Review | Active | ecADR (Review) |
| GD-08 | Có `date` và `decided_by` | Không biết ai chịu trách nhiệm, quyết định lúc nào | CI | Active | ecADR (Agreement) |
| GD-09 | Decision Superseded có `superseded_by` trỏ tới Decision thay thế; nội dung cũ giữ nguyên (GX-15) | Không lần ra quyết định đang hiệu lực | CI | Closed | Nygard, MADR (status "superseded by") |
| GD-10 | Không lặp hành vi đã có trong Requirement, hay quy tắc đã có trong Business Rule; trỏ qua `shapes` và tóm tắt kèm ID (GX-10) | Hai nguồn sự thật | Review | Active | GX-10 |
| GD-11 | `short_name` 3–8 từ, phân biệt được | Không scan được danh sách | Lint | Mọi status | INCOSE C13 |

## 6. Ví dụ minh họa (hệ thống đặt vé giả định)

**Decision đạt gate Active.**

> ```markdown
> id: D-901
> short_name: Giữ chỗ 10 phút trước thanh toán
> status: Active
> date: 2026-03-14
> decided_by: Trưởng nhóm kỹ thuật
> addresses: [R-903]          # R-903: hệ thống không bán vượt số vé của sự kiện
> assumptions: [A-901]
> constraints: [C-903]
> shapes: [R-901, BR-902]     # R-901: giữ chỗ 10 phút; BR-902: vòng đời đơn
> documents: [DOC-901]
>
> ## Decision
> Hệ thống giữ vé cho người mua trong 10 phút kể từ khi bắt đầu thanh toán, thay vì chỉ trừ vé sau khi thanh toán thành công.
>
> ## Context
> 1. Sự kiện lớn mở bán có hàng nghìn người cùng mua trong vài phút đầu.
> 2. Nếu chỉ trừ vé sau khi thanh toán, nhiều người cùng trả tiền cho những vé cuối cùng.
>
> ## Phương án đã xét
> | Phương án | Chọn / Loại | Lý do |
> |---|---|---|
> | Trừ vé sau khi thanh toán thành công | Loại | Bán vượt số vé (DOC-901); phải hoàn tiền cho người trả sau |
> | Giữ chỗ có thời hạn khi bắt đầu thanh toán | Chọn | Không bán vượt; người mua biết chắc vé của mình trong lúc trả tiền |
> | Hàng đợi ảo trước khi vào trang mua | Loại | Đúng bài toán nhưng cần hạ tầng vượt giới hạn chi phí C-903 |
>
> ## Rationale / Evidence
> 1. DOC-901 (báo cáo thử tải): với 2.000 người mua đồng thời, phương án trừ vé sau thanh toán bán vượt 37 vé; phương án giữ chỗ không bán vượt.
>
> ## Hệ quả
> - Tốt: không bán vượt số vé.
> - Đánh đổi: vé bị khóa tới 10 phút; sự kiện có thể hiện "hết vé" rồi lại có vé khi giữ chỗ hết hạn.
> - Đánh đổi: phải xử lý kết quả thanh toán đến sau khi giữ chỗ hết hạn (BR-902).
>
> ## Xác nhận tuân thủ
> 1. Không bán vượt: test tải trong CI, 500 người mua đồng thời cho 100 vé, kiểm số vé bán ra không vượt 100.
> 2. Giữ đúng 10 phút: test với đồng hồ giả lập, kiểm vé vẫn bị giữ ở phút 9:59 và được nhả ở phút 10:00.
> 3. Nhả vé khi hết hạn: test kiểm số vé còn lại tăng lại đúng bằng số vé của đơn Hết hạn.
> 4. Thanh toán đến muộn: test giả lập cổng thanh toán báo thành công sau khi đơn Hết hạn, kiểm đơn vẫn Hết hạn và có lệnh hoàn toàn bộ tiền trong 1 giờ (BR-902).
>
> ## Reopen When
> A-901 bị Invalidated (tỷ lệ thanh toán trong 10 phút < 85%), hoặc C-903 thay đổi đủ để triển khai hàng đợi ảo.
> ```

Mục `Xác nhận tuân thủ` có một test cho mỗi vế của quyết định (không bán vượt, đúng 10 phút, nhả vé), và một test cho đánh đổi cần kiểm soát (thanh toán đến muộn). Evidence là một tài liệu có ID, không phải câu mô tả.

**GD-01: lý do lẫn vào quyết định.**

> Chưa đạt: "Vì sợ bán vượt và người dùng phàn nàn, cộng với việc cổng thanh toán đôi khi chậm, nhóm thống nhất là sẽ giữ chỗ một thời gian, chắc khoảng 10 phút, sau đó nếu chưa trả tiền thì nhả."
> Đạt: câu Decision của D-901 ở trên. Lý do chuyển sang `Context` và `Rationale`; thời hạn được ghi chắc chắn.

**GD-05: thiếu hệ quả xấu.**

> Chưa đạt: "Hệ quả: không còn bán vượt số vé."
> Bản này bỏ qua đánh đổi "vé bị khóa tới 10 phút". Đánh đổi đó chính là lý do A-901 tồn tại. Nếu không ghi ra, không ai theo dõi nó.

**GD-06: xác nhận chỉ một phần.**

> Chưa đạt: `Xác nhận tuân thủ` chỉ có test tải "không bán vượt 100 vé".
> Test này không phát hiện được implementation giữ chỗ 5 phút thay vì 10, hay quên nhả vé khi hết hạn. Hai vế đó của quyết định vẫn bị code lờ đi được.
