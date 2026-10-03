# Gate chung cho mọi item trong `specification/`

File này chứa các quy định áp dụng cho **mọi** loại item: Actor, Constraint, Assumption, Use Case, Business Rule, Requirement, Decision. Mỗi folder có thêm `_CRITERIA.md` cho riêng loại item đó. Khi viết hoặc sửa một item, đọc file này trước, sau đó đọc `_CRITERIA.md` của loại item.

Bộ tiêu chí không gắn với project cụ thể. Những thứ thay đổi theo project được khai báo trong `schema.json` của project, không viết cứng vào tiêu chí:
- tên status, type, release, area;
- mẫu ID;
- tên hệ thống dùng trong câu requirement.

Tiêu chí chỉ quy định **nghĩa** mà `schema.json` phải ánh xạ vào.

Ví dụ trong bộ tiêu chí dùng một **hệ thống đặt vé sự kiện giả định**, không phải item thật của project nào. ID trong ví dụ bắt đầu bằng `9xx` để dễ nhận ra.

## 1. Hai câu hỏi tách riêng: mức sẵn sàng và hiệu lực

Mỗi status trả lời hai câu hỏi khác nhau. `schema.json` khai báo cả hai cho từng status.

**Mức sẵn sàng**: item phải qua những gate nào.

| Mức | Ý nghĩa | Gate áp dụng |
|---|---|---|
| **Draft** | Ý tưởng, chưa chắc thuộc sản phẩm | Chỉ cấu trúc: ID, field bắt buộc, enum, tham chiếu tồn tại |
| **Proposed** | Đã cam kết thuộc sản phẩm, nội dung đang hoàn thiện. Được phép còn điều "Chưa chốt", kèm nơi xử lý | Thêm: câu phát biểu đạt chuẩn, có lý do, có nguồn |
| **Active** | Đủ để code và nghiệm thu: mọi thông tin quyết định đạt hay không đạt đã chốt | Toàn bộ gate |
| **Closed** | Đã đóng, giữ để truy vết | Chỉ cấu trúc; không sửa nội dung (GX-15) |

Mức sẵn sàng **không** phải release. Item thuộc release nào thì ghi ở field `scope`. Một item có thể thuộc release hiện tại mà vẫn ở Proposed, vì ngưỡng nghiệm thu chưa chốt. Đó chính là tín hiệu cần xử lý trước khi code.

**Hiệu lực**: item còn được làm căn cứ cho item khác hay không. Một item có thể đã qua đủ gate mà vẫn hết hiệu lực. Ví dụ: Assumption đã Invalidated có đủ evidence, nhưng không còn được phép làm chỗ dựa.

| Ví dụ status | Mức sẵn sàng | Hiệu lực |
|---|---|---|
| Draft | Draft | Không |
| Proposed | Proposed | Có |
| Active | Active | Có |
| Deprecated, Retired | Closed | Không |
| Assumption Open, Supported | Active | Có |
| Assumption Invalidated | Active (phải có evidence) | **Không** |
| Decision Reopened | Active | Có, nhưng Lint cảnh báo item dựa vào nó |
| Decision Superseded | Closed | Không |

## 2. Hợp đồng quan hệ

Mỗi field quan hệ thuộc đúng một trong ba **loại**. Loại quyết định hai thứ: hướng lan của ảnh hưởng khi một item thay đổi, và điều kiện về trạng thái của item đích.

| Loại | Nghĩa | Khi item thay đổi, ảnh hưởng lan tới | Điều kiện về item đích |
|---|---|---|---|
| **Dựa vào** | Item nguồn chỉ đúng khi item đích còn đúng | Đích đổi → **nguồn** cần xem lại | Nguồn Active thì đích phải còn hiệu lực (GX-04) |
| **Áp lên** | Item nguồn quy định hoặc định hình item đích | Nguồn đổi → **đích** cần xem lại | Đích đã Closed thì Lint cảnh báo |
| **Tham chiếu** | Nguồn gốc, evidence, lịch sử, liên quan | Không lan | Không điều kiện; được trỏ tới item đã Closed |

Bảng dưới là danh sách đầy đủ các field quan hệ. Field nằm ở phía item **nguồn**; chiều ngược do công cụ sinh ra (GX-05). `schema.json` phải khai báo đúng loại cho từng field theo bảng này.

| Loại item | Field | Đích | Loại | Nghĩa |
|---|---|---|---|---|
| Mọi loại | `source` | ID bất kỳ hoặc mã nguồn | Tham chiếu | Nội dung được rút ra từ đâu |
| Use Case | `primary_actor` | Actor | Dựa vào | Actor mà Use Case phục vụ |
| Use Case | `supporting_actors` | Actor | Dựa vào | Actor tham gia để Use Case hoàn thành (dịch vụ ngoài, người duyệt) |
| Use Case | `constraints` | Constraint | Dựa vào | Giới hạn mà luồng phải tôn trọng |
| Use Case | `include` | Use Case | Dựa vào | Use Case này gọi Use Case đích như một phần bắt buộc |
| Use Case | `extend` | Use Case | Dựa vào | Use Case này mở rộng Use Case đích tại một điểm |
| Use Case | `follows`, `split_from`, `related`, `superseded_by` | Use Case | Tham chiếu | Thứ tự thường gặp, nguồn gốc tách, liên quan, thay thế |
| Business Rule | `use_cases` | Use Case | Áp lên | Rule quy định hành vi trong các Use Case này |
| Requirement | `use_cases` | Use Case | Dựa vào | Requirement làm rõ một phần của Use Case |
| Requirement | `business_rules` | Business Rule | Dựa vào | Requirement phải tuân theo rule |
| Requirement | `constraints` | Constraint | Dựa vào | Requirement nằm trong giới hạn này |
| Requirement | `assumptions` | Assumption | Dựa vào | Requirement chỉ cần thiết khi assumption đúng |
| Requirement | `depends_on` | Requirement | Dựa vào | Requirement cần requirement đích để có nghĩa |
| Decision | `addresses` | Requirement | Dựa vào | Decision chọn cách đáp ứng requirement này |
| Decision | `shapes` | Requirement, Business Rule | Áp lên | Requirement hoặc rule được sinh ra hay thu hẹp từ decision |
| Decision | `constraints` | Constraint | Dựa vào | Decision tôn trọng giới hạn này |
| Decision | `assumptions` | Assumption | Dựa vào | Decision chỉ đúng khi assumption đúng |
| Decision | `documents` | Tài liệu | Tham chiếu | Phân tích chi tiết, evidence |
| Decision | `superseded_by` | Decision | Tham chiếu | Decision thay thế |

**Phân tích ảnh hưởng** khi item X thay đổi gồm hai tập:
- **Phải xem:** item có quan hệ *dựa vào* trỏ tới X, và item mà X *áp lên*.
- **Nên xem:** lặp lại cách tính trên thêm một bậc.

Quan hệ *tham chiếu* không lan ảnh hưởng.

## 3. Phạm vi kiểm của CI

CI kiểm hai nhóm, với phạm vi khác nhau.

| Nhóm | Gồm | Phạm vi | PR bị chặn khi |
|---|---|---|---|
| **Toàn vẹn đồ thị** | GX-01, GX-02, GX-03, GX-04, GX-05 | Toàn bộ spec **sau** khi áp PR | PR làm phát sinh lỗi **mới** so với nhánh đích |
| **Nội dung** | Các tiêu chí còn lại có tầng CI | Chỉ file bị sửa trong PR | File bị sửa trượt tiêu chí |

Toàn vẹn đồ thị phải kiểm trên toàn bộ spec, vì lỗi thường xuất hiện ở file **không** bị sửa. Ví dụ: một PR đóng Actor, trong khi Use Case Active đang dựa vào Actor đó không đổi. Lỗi nằm ở Use Case, nhưng PR mới là nguyên nhân.

Lỗi toàn vẹn có từ trước được liệt kê trong báo cáo nhưng không chặn PR. Khi đưa spec cũ vào hệ thống, nên sửa hết nhóm lỗi này trong PR đầu tiên, vì chúng sửa được bằng máy và thường ít.

Nội dung chỉ kiểm trên file bị sửa. Lý do: khi áp gate lên spec đã có, các tiêu chí đòi section mới sẽ trượt ở gần như mọi item cũ; chặn toàn bộ thì mọi PR đều đỏ. Ai sửa item nào thì đưa item đó đạt gate trong cùng PR, nhờ vậy spec được nâng chuẩn dần.

## 4. Cách đọc bảng tiêu chí

**Tầng**:

| Tầng | Ai kiểm | Khi vi phạm |
|---|---|---|
| **CI** | Validator, kiểm được chắc chắn bằng máy | PR bị chặn |
| **Lint** | Validator, dùng heuristic nên có thể báo sai | Cảnh báo trên PR. Người review xác nhận hoặc bỏ qua kèm lý do |
| **Review** | Người review, hoặc AI review theo checklist | Người review quyết định |

Tầng CI chỉ dùng cho điều kiểm được bằng cấu trúc: có section hay không, giá trị enum, ID, chuỗi cố định. Điều cần hiểu nghĩa câu thì dùng Lint để phát hiện, và Review để quyết định.

**Áp từ** là mức sẵn sàng thấp nhất mà tiêu chí bắt đầu áp dụng.

**Nguồn** là căn cứ của tiêu chí; danh sách có link nằm ở `_SOURCES.md`. Tiêu chí ghi "Quy ước" không đến từ chuẩn bên ngoài, mà là quy ước để spec dạng file trong Git vận hành được. Với các tiêu chí này, phần "Ngăn vấn đề gì" chính là lý do của chúng.

## 5. Tiêu chí chung

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GX-01 | Tên file trùng `id`; `id` khớp mẫu ID của loại item; ID không trùng và không dùng lại ID đã nghỉ | Hai item cùng ID, tham chiếu trỏ nhầm | CI (toàn vẹn) | Draft | ISO 29148 (identification) |
| GX-02 | Đủ field bắt buộc; field enum chỉ nhận giá trị đã khai báo trong `schema.json` | Status hoặc type lạ làm hỏng lọc và phân tích ảnh hưởng | CI (toàn vẹn) | Draft | Quy ước |
| GX-03 | Mọi ID được tham chiếu đều tồn tại và đúng loại mà field cho phép (mục 2) | Tham chiếu gãy | CI (toàn vẹn) | Draft | ISO 29148 (traceable) |
| GX-04 | Item Active chỉ **dựa vào** item còn hiệu lực (mục 1, mục 2). Quan hệ tham chiếu được trỏ tới item đã đóng | Item đang dùng dựa trên quyết định hoặc giả định đã bị bỏ | CI (toàn vẹn) | Active | ISO 29148 (consistent) |
| GX-05 | Mỗi quan hệ chỉ ghi một lần, ở field của item nguồn theo mục 2. Không có field cho chiều ngược | Ghi ở hai đầu thì sớm muộn hai đầu sẽ mâu thuẫn | CI (toàn vẹn) | Draft | Doorstop, elspais |
| GX-06 | Đủ các section bắt buộc của loại item, đúng tên heading, đúng thứ tự | Người, agent và công cụ không tìm thấy nội dung | CI | Theo loại | INCOSE R42 |
| GX-07 | Thuật ngữ đúng `glossary.md`. Không dùng từ mà glossary ghi là "Không dùng" | Một khái niệm có nhiều tên | Lint | Draft | INCOSE R4, R36 |
| GX-08 | Không dùng từ mơ hồ, câu thoát, cụm mở hoặc so sánh không có mốc, **trừ khi** ngay trong câu có danh sách cụ thể hoặc ID định nghĩa nó. Danh sách từ ở mục 6 | Mỗi người hiểu một kiểu; không test được | Lint | Proposed | ISO 29148 §5.2.7, INCOSE R7, R8, R9 |
| GX-09 | Item Active không còn thông tin chưa chốt ảnh hưởng tới hành vi bắt buộc, miền đầu vào hoặc tiêu chí đạt / không đạt. Các section quy định (Yêu cầu, Miền đầu vào, Đo lường, Acceptance, Rule, các bảng, các luồng, Postconditions) không chứa "Chưa chốt", "TBD" hay "định nghĩa sau". `Câu hỏi mở` chỉ còn câu hỏi không ảnh hưởng các phần đó, và mỗi câu có nơi xử lý. Ngưỡng tạm có nhãn đúng định dạng (mục 7) được tính là đã chốt. Chưa chốt được thì item ở lại Proposed | Item được đánh dấu sẵn sàng nghiệm thu nhưng không phán được đạt hay không | CI (chuỗi cấm trong section quy định; câu hỏi có nơi xử lý) + Review (câu hỏi còn lại có thật sự không ảnh hưởng) | Active | ISO 29148 §5.2.6 (set không có TBD) |
| GX-10 | Mỗi nội dung quy định có **một item sở hữu**. Item khác được tóm tắt lại kèm ID của item sở hữu, nhưng không phát biểu lại như một quy định độc lập | Sửa nơi sở hữu, quên bản chép ở nơi khác | Review | Proposed | INCOSE R30 |
| GX-11 | Field `source` chỉ chứa ID hoặc mã nguồn (tài liệu, mục, buổi phỏng vấn có ngày), không viết câu | Không lọc và truy vết được nguồn | Lint | Draft | ISO 29148 (source) |
| GX-12 | `Ghi chú` chỉ ghi giới hạn phạm vi, lưu ý khi đọc, việc để sau. Không ghi nguồn, không tóm tắt lại các section khác | Ghi chú thành bãi chứa | Review | Proposed | Quy ước |
| GX-13 | Tên item (`short_name`, `title` hoặc `name`) phân biệt được với mọi item cùng loại chỉ bằng chính nó | Nhầm item khi trao đổi và khi tìm kiếm | Lint (trùng tên) + Review | Draft | INCOSE C13 |
| GX-14 | Section có từ 2 ý trở lên viết thành danh sách đánh số; mỗi dòng không quá khoảng 200 ký tự | Đoạn văn dài, khó review và khó đọc diff | Lint | Proposed | Quy ước |
| GX-15 | Item Closed chỉ được sửa hình thức (thuật ngữ, đánh số). Không đổi ý nghĩa | Viết lại lịch sử | Review | Closed | Nygard (giữ nguyên record cũ) |
| GX-16 | Câu có chủ ngữ rõ (người dùng, hệ thống, tên actor) và ở thể chủ động | Không biết ai chịu trách nhiệm hành vi | Review | Proposed | INCOSE R2 |
| GX-17 | Không dùng đại từ thay cho đối tượng ("nó", "điều này", "như trên") | Đọc riêng một câu thì không hiểu | Lint | Proposed | ISO 29148 §5.2.7, INCOSE R24 |
| GX-18 | Ngày trong frontmatter viết `YYYY-MM-DD`; ngày trong văn bản viết theo một định dạng thống nhất của project | Sắp xếp sai, hiểu nhầm ngày | CI (frontmatter) / Lint (văn bản) | Draft | ISO 8601 |

## 6. Danh sách từ cho GX-08 và GX-17

Lint đối chiếu bằng chữ thường. Nếu ngay sau từ có danh sách cụ thể hoặc ID (ví dụ "trong giới hạn của C-902"), Lint không báo.

| Nhóm | Từ cần kiểm | Thay bằng |
|---|---|---|
| Mơ hồ, chủ quan | dùng được, phù hợp, hợp lý, đủ, tốt, tốt hơn, chuyên nghiệp, thân thiện, dễ, nhanh, chậm, gọn, rõ ràng, đáng kể, nghiêm trọng, tối thiểu, tối ưu | Số đo kèm đơn vị, danh sách cụ thể, hoặc ID định nghĩa |
| Câu thoát | nếu cần, nếu có thể, khi cần, khi phù hợp, tùy trường hợp, trong giới hạn hệ thống hỗ trợ, trong phạm vi đã kiểm chứng | Liệt kê điều kiện, hoặc tham chiếu ID định nghĩa giới hạn |
| Cụm mở | v.v., ..., và các … khác, bao gồm nhưng không giới hạn, một số | Liệt kê đủ (INCOSE R22) |
| Tuyệt đối | mọi, tất cả, bất kỳ, luôn luôn, không bao giờ, 100% | "mỗi" kèm điều kiện áp dụng (INCOSE R26, R32) |
| Thời gian không rõ | ngay, sớm, kịp thời, sau đó | Mốc hoặc khoảng thời gian, hoặc thứ tự bước (INCOSE R35) |
| Đại từ (GX-17) | nó, điều này, điều đó, cái này, như trên | Lặp lại danh từ |

"Mọi" và "bất kỳ" không bị cấm tuyệt đối. Lint chỉ cảnh báo để người viết tự hỏi: có ngoại lệ không, và có kiểm được toàn bộ không.

> **Ví dụ**
>
> Chưa đạt: "Hệ thống phải xử lý thanh toán nhanh và báo lỗi phù hợp."
>
> Đạt: "Khi cổng thanh toán trả kết quả thất bại, hệ thống phải hiển thị mã lỗi và nút Thử lại trong vòng 2 giây."
>
> Câu chưa đạt có hai từ mơ hồ ("nhanh", "phù hợp") và gộp hai yêu cầu làm một.

## 7. Ngưỡng tạm

**Ngưỡng tạm** là con số team đặt khi chưa có evidence, để item vẫn phán được đạt hay không đạt. Mỗi ngưỡng tạm mang nhãn theo định dạng:

`<giá trị> [tạm YYYY-MM-DD · xem lại: <sự kiện quan sát được>]`

1. Ngưỡng tạm được tính là **đã chốt**. Item Active được dùng ngưỡng tạm ở mọi section quy định (GX-09), trong `Đo lường` của Requirement (GR-09) và trong `Cách kiểm chứng` của Assumption (GA-05).
2. Nhãn phải có ngày đặt ngưỡng và một sự kiện xem lại quan sát được. Thiếu một trong hai thì con số không phải ngưỡng tạm và bị coi là chưa chốt.
3. Ngưỡng tạm vẫn phân biệt được với con số có evidence: validator tìm mọi ngưỡng tạm qua chuỗi `[tạm`.
4. Khi sự kiện xem lại xảy ra, thay ngưỡng tạm bằng con số có evidence (bỏ nhãn), hoặc đặt lại ngưỡng tạm với ngày và sự kiện xem lại mới.
5. Không dùng ngưỡng tạm cho thông tin do bên ngoài áp đặt (môn học, khách hàng, đối tác, quy định pháp lý). Thông tin đó chưa biết thì item ở lại Proposed.

> **Ví dụ**
>
> Đạt: "- Ngưỡng đạt: ≤ 2 giây ở phân vị 95 [tạm 2026-03-01 · xem lại: benchmark tìm kiếm ở task #142 có kết quả]."
>
> Chưa đạt: "- Ngưỡng đạt: ≤ 2 giây [tạm]." Nhãn thiếu ngày và sự kiện xem lại, nên con số này bị coi là chưa chốt.
