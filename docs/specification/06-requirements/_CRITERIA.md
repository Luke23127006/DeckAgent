# Gate: Requirement

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Requirement là gì, không là gì

**Requirement là một hành vi hoặc một chất lượng mà hệ thống phải có, và kiểm chứng được.**

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Giới hạn áp từ bên ngoài, team không tự chọn | Constraint |
| Lựa chọn team đã chốt giữa nhiều phương án, kèm lý do | Decision |
| Quy tắc nghiệp vụ chi tiết áp cho từ 2 Use Case hoặc Requirement trở lên | Business Rule (được phép chi tiết hơn Requirement) |
| Luồng tương tác từng bước giữa actor và hệ thống | Use Case |
| Điều team coi là đúng nhưng chưa có evidence | Assumption |

## 2. Kiểm chứng và testability

**Mọi** requirement phải **kiểm chứng được** (verifiable). ISO 29148 và INCOSE C7 coi đây là đặc tính bắt buộc. Kiểm chứng có bốn phương pháp, và mỗi requirement khai báo phương pháp chính trong field `verification`:

| `verification` | Nghĩa | Khi nào dùng | Ví dụ (hệ thống đặt vé) |
|---|---|---|---|
| `test` | Chạy hệ thống với đầu vào xác định, so kết quả với kỳ vọng | Hành vi hoặc chất lượng quan sát được khi chạy | Giới hạn số vé mỗi đơn; thời gian giữ chỗ |
| `demonstration` | Thao tác trước người xem và quan sát kết quả, không đo định lượng | Khả năng dùng, luồng người dùng | Người mua lần đầu hoàn tất mua vé mà không cần hướng dẫn |
| `inspection` | Đọc code, cấu hình hoặc tài liệu để xác nhận | Ràng buộc cấu trúc, phạm vi | Số thẻ đầy đủ không được lưu trong cơ sở dữ liệu |
| `analysis` | Lập luận hoặc mô hình hóa, không chạy trực tiếp được | Khả năng mở rộng, bảo trì | Thêm một cổng thanh toán mới chỉ sửa module thanh toán |

**Requirement Active có `verification: test` phải đủ thông tin để tester tự viết test case mà không cần hỏi lại.** Theo kỹ thuật black-box của ISTQB, tester cần bốn thứ. Mỗi thứ có tiêu chí và điều kiện áp dụng riêng:

| Thứ tester cần | Tiêu chí | Áp cho |
|---|---|---|
| **Điều kiện áp dụng**: khi nào, ở trạng thái nào hành vi xảy ra (phục vụ decision table, state transition testing) | GR-03 | Mọi requirement |
| **Kết quả mong đợi phán được đúng sai** (test oracle) | GR-07 | Mọi requirement |
| **Miền đầu vào có biên** (phục vụ equivalence partitioning, boundary value analysis) | GR-08 | `verification: test` và `inputs: true` |
| **Cách đo và ngưỡng** | GR-09; GR-10 nếu do AI sinh | Requirement mô tả một mức độ, với mọi phương pháp kiểm chứng trừ `inspection` |

Ở mức Proposed, biên và ngưỡng được phép ghi "Chưa chốt" kèm nơi xử lý. Lên Active thì phải chốt (GX-09); ngưỡng tạm có nhãn đúng định dạng (`_COMMON_CRITERIA.md` mục 7) được tính là đã chốt. Một requirement có kế hoạch đo nhưng chưa có ngưỡng là **đủ để lên kế hoạch, chưa đủ để nghiệm thu**.

## 3. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GR-01 | Section `Yêu cầu` là **một câu** theo mẫu: `[Khi <sự kiện>, \| Trong khi <trạng thái>, \| Nếu <tình huống không mong muốn> thì \| Ở nơi có <tính năng>,] <Hệ thống> phải/nên/có thể <hành vi hoặc chất lượng quan sát được>.` Tên hệ thống khai báo trong `schema.json` | Câu tự do: không rõ điều kiện, không rõ ai làm | Lint (mẫu câu) | Proposed | EARS (Mavin), INCOSE R1 |
| GR-02 | Requirement Active dùng "phải". "Nên" và "có thể" chỉ dùng ở Proposed hoặc Draft | Không biết thiếu hành vi đó thì test fail hay pass | Lint | Active | ISO 29148 (shall / should / may) |
| GR-03 | Điều kiện áp dụng viết tường minh trong câu ("Khi", "Trong khi", "Nếu… thì"), không để người đọc tự suy | Test thiếu điều kiện vào; hai người hiểu hai phạm vi | Review | Proposed | INCOSE R27, R28, EARS |
| GR-04 | **Đơn nhất**: một năng lực hoặc một chất lượng. Không nối hai hành vi bằng "và", "hoặc", ";". Liệt kê **đối tượng** của cùng một hành vi thì được phép | Một phần đạt một phần không; test và truy vết bị nhập nhằng | Lint (`;` hoặc nhiều "phải") + Review | Proposed | ISO 29148 (singular), INCOSE C5, R18, R19 |
| GR-05 | Không nêu cách implement (tên thư viện, cấu trúc dữ liệu, kiến trúc), trừ khi chính cách đó là Constraint | Khóa thiết kế quá sớm | Review | Proposed | ISO 29148 (implementation free), INCOSE R31 |
| GR-06 | Có section `Bối cảnh / Lý do`: vì sao requirement tồn tại, giải vấn đề gì của người dùng. Không lặp câu Yêu cầu | Không biết khi nào được bỏ hoặc đổi requirement | CI (section) + Review | Proposed | ISO 29148 (rationale), Volere |
| GR-07 | Có section `Acceptance`, đánh số. Mỗi điều nêu **điều quan sát được và kết quả mong đợi phán được đúng sai** mà không cần ý kiến chủ quan. Dùng dạng rule (danh sách hoặc bảng vào → ra) hoặc dạng kịch bản (Cho / Khi / Thì) | Tester phải đoán thế nào là đạt | CI (có section, ≥1 điều) + Review | Active | Volere (fit criterion), ISTQB CTFL 4.0 §4.5 |
| GR-08 | Requirement có `verification: test` và nhận đầu vào (`inputs: true`) phải có section `Miền đầu vào`. Mỗi đầu vào nêu phân vùng hợp lệ, phân vùng không hợp lệ và giá trị biên. Ở Proposed, biên chưa biết được ghi "Chưa chốt" kèm câu hỏi trong `Câu hỏi mở`; ở Active, mọi biên phải đã chốt (GX-09) | Không thiết kế được equivalence partitioning và boundary test; hệ thống không có giới hạn | CI (có section khi `inputs: true`) + Review | Proposed | INCOSE R33, ISTQB (EP, BVA), NASA SWE-050 |
| GR-09 | Requirement mô tả một **mức độ** (thời gian, tỷ lệ, độ chính xác, độ giống…) có section `Đo lường` gồm: **Scale** (đại lượng và đơn vị), **Meter** (đo thế nào, trên dữ liệu nào), **Ngưỡng đạt**. Ở Proposed, ngưỡng được ghi "Chưa chốt" kèm nơi đang đo. Không đặt số khi chưa có dữ liệu, trừ khi số đó là ngưỡng tạm có nhãn (`_COMMON_CRITERIA.md` mục 7). Ở Active, ngưỡng phải là con số: có evidence, hoặc là ngưỡng tạm (GX-09). Requirement có kết quả nhị phân không cần section này, vì Acceptance đã phán được đúng sai | "Chất lượng tốt" không test được; con số đặt bừa; hoặc nghiệm thu khi chưa có ngưỡng | CI (có section thì phải đủ 3 dòng; Active thì không có "Chưa chốt"; số có nhãn `[tạm` phải đủ ngày và sự kiện xem lại) + Lint (loại chất lượng mà không có section) + Review | Proposed | Planguage (Gilb), INCOSE R34 |
| GR-10 | Requirement về **kết quả do AI sinh** (không tất định) nêu trong `Đo lường`: tập đánh giá, cách chấm (validator tất định, rubric hoặc người chấm), số lần chạy, và tỷ lệ đạt yêu cầu. Ở Active, tỷ lệ đạt phải là con số (GX-09) | Một lần chạy pass không chứng minh gì; test chập chờn (flaky) | Review | Proposed | ATDD cho hệ thống LLM (arXiv 2606.02755) |
| GR-11 | `Yêu cầu` và `Acceptance` không có câu thoát hay giới hạn mơ hồ ("trong giới hạn hệ thống hỗ trợ", "trong phạm vi đã kiểm chứng"), trừ khi giới hạn được định nghĩa bằng ID ngay trong câu | Requirement không bao giờ fail, vì giới hạn tự co lại theo kết quả | Lint (phát hiện cụm câu thoát) + Review (quyết định giới hạn đã được định nghĩa hay chưa) | Proposed | ISO 29148 §5.2.7 (loopholes), INCOSE R8 |
| GR-12 | Tránh phủ định làm hành vi chính ("không được…"). Được phép với yêu cầu an toàn hoặc bảo mật, khi Acceptance nêu cách quan sát vi phạm | Không test được việc "không xảy ra" | Lint | Proposed | ISO 29148 (negative statements), INCOSE R16 |
| GR-13 | Có `source` (≥1 ID hoặc mã nguồn). Requirement thuộc nhóm hành vi trỏ ≥1 Use Case; nhóm chất lượng không bắt buộc | Không biết requirement đến từ đâu, có còn cần không | CI (`source`) + Lint (nhóm hành vi thiếu Use Case) | Proposed | ISO 29148 (traceable), INCOSE C8 |
| GR-14 | `type` lấy từ `schema.json`. Mỗi giá trị được ánh xạ vào một trong bốn nhóm: **hành vi** (functional), **chất lượng** (quality), **giao diện** (interface), **dữ liệu** (data). Các tiêu chí khác dùng nhóm, không dùng tên type. Không có nhóm "constraint": giới hạn áp từ ngoài thuộc Constraint, lựa chọn của team thuộc Decision | Trùng khái niệm giữa Requirement, Constraint và Decision | CI (enum và ánh xạ nhóm) | Draft | ISO 29148 (requirement types) |
| GR-15 | Không trùng và không mâu thuẫn với requirement khác. Business Rule được phép chi tiết hơn Requirement | Hai nguồn sự thật | Review | Proposed | ISO 29148 (consistent), INCOSE R30 |
| GR-16 | `short_name` 3–8 từ, nêu năng lực hoặc chất lượng | Không scan được danh sách | Lint | Draft | INCOSE C13 |

## 4. Ví dụ minh họa (hệ thống đặt vé giả định)

**GR-04: đơn nhất.**

> Chưa đạt: "Hệ thống phải giữ chỗ cho người mua trong 10 phút và gửi email xác nhận khi thanh toán thành công."
> Đạt (tách thành hai requirement):
> R-901: "Khi người mua bắt đầu thanh toán, hệ thống phải giữ các vé đã chọn trong 10 phút."
> R-902: "Khi thanh toán thành công, hệ thống phải gửi email xác nhận tới địa chỉ của người mua."

Hai hành vi có điều kiện khác nhau và có thể đạt hoặc trượt độc lập. Gộp lại thì không biết requirement "đạt một nửa" là đạt hay trượt.

**GR-08: miền đầu vào có biên.**

> Chưa đạt: "Hệ thống phải cho người mua chọn số lượng vé."
> Đạt:
>
> ```markdown
> ## Yêu cầu
> Khi người mua chọn số lượng vé, hệ thống phải chấp nhận số lượng trong miền hợp lệ và từ chối số lượng ngoài miền kèm thông báo nêu miền hợp lệ.
>
> ## Miền đầu vào
> | Đầu vào | Hợp lệ | Không hợp lệ | Biên |
> |---|---|---|---|
> | Số vé mỗi đơn | 1–10, số nguyên | ≤ 0; > 10; số thập phân; để trống | 0, 1, 10, 11 |
> | Số vé còn lại của sự kiện | ≥ số vé chọn | < số vé chọn | còn đúng bằng số vé chọn; còn ít hơn 1 vé |
> ```

Bản đạt cho tester ngay sáu phân vùng và bốn giá trị biên của equivalence partitioning và boundary value analysis.

**GR-09: chất lượng đo được.**

> Chưa đạt (mọi mức): "Hệ thống phải tìm kiếm sự kiện nhanh."
>
> Đạt mức **Proposed**: có kế hoạch đo, ngưỡng chưa chốt.
>
> ```markdown
> ## Đo lường
> - Scale: thời gian từ lúc người dùng gửi truy vấn tới lúc trang kết quả hiển thị đủ, tính bằng giây, ở phân vị thứ 95.
> - Meter: chạy 500 truy vấn từ bộ truy vấn mẫu, trên dữ liệu 10.000 sự kiện, đo từ trình duyệt kiểm thử.
> - Ngưỡng đạt: Chưa chốt (benchmark ở task #142).
> ```
>
> Đạt mức **Active**: sau khi benchmark xong, ngưỡng là con số.
>
> ```markdown
> - Ngưỡng đạt: ≤ 1,5 giây ở phân vị 95.
> ```

Meter định nghĩa mốc bắt đầu và mốc kết thúc của phép đo, nên hai người đo sẽ ra cùng một con số. Khi chưa có ngưỡng, requirement chưa nghiệm thu được, nên phải ở lại Proposed. Đây là tín hiệu cần chạy benchmark trước khi code tính năng đó. Nếu team cần nghiệm thu trước khi có benchmark, team đặt ngưỡng tạm, ví dụ `- Ngưỡng đạt: ≤ 2 giây ở phân vị 95 [tạm 2026-03-01 · xem lại: benchmark ở task #142 có kết quả]`, và requirement được lên Active.

**GR-10: kết quả do AI sinh.**

> Chưa đạt: "AI phải tạo mô tả sự kiện chính xác."
> Đạt (phần `Đo lường`):
> - Scale: tỷ lệ mô tả có ít nhất một ngày, giờ, địa điểm hoặc giá vé khác với thông tin ban tổ chức nhập.
> - Meter: bộ 50 sự kiện mẫu, mỗi sự kiện sinh 5 lần; validator tự động so ngày, giờ, địa điểm, giá với dữ liệu gốc.
> - Ngưỡng đạt: 0 sai lệch trên 250 lần sinh.

**GR-11: câu thoát.**

> Chưa đạt: "Vé điện tử phải hiển thị đúng trên điện thoại, trong phạm vi đã kiểm chứng."
> Đạt: "Vé điện tử phải hiển thị đủ mã QR, tên sự kiện và số ghế trên các trình duyệt và kích thước màn hình liệt kê ở C-902."

Ở câu chưa đạt, phạm vi do chính người test quyết định sau khi test, nên requirement không bao giờ fail.

## 5. Không thuộc gate này

- **Test đã tồn tại hay chưa** (coverage) là báo cáo theo release, không phải điều kiện để viết spec. Spec được viết trước test.
- **Task nào làm requirement này** do task trỏ ngược về requirement. Requirement không ghi danh sách task.
