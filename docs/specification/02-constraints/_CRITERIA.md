# Gate: Constraint

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Constraint là gì, không là gì

**Constraint là giới hạn áp từ bên ngoài lên requirement, thiết kế, implementation hoặc quy trình, mà team không tự chọn** (ISO 29148). arc42 mô tả constraint là thứ giới hạn quyền tự do thiết kế của team.

Có hai lỗi thường gặp:
- **Lựa chọn của team bị ghi thành Constraint.** Lựa chọn của team thuộc Decision: team tự cân nhắc các phương án và tự mở lại khi cần. Constraint thì team **không tự ý thay đổi**. Constraint chỉ đổi khi bên áp đặt đổi, hoặc khi team thương lượng được với bên đó. Vì vậy mỗi Constraint ghi rõ bên áp đặt (GC-01) và điều kiện để xem lại (GC-06).
- **Ý tưởng giải pháp đội lốt Constraint.** Wiegers khuyên luôn hỏi "vì sao giới hạn này tồn tại" và ghi lại ai hoặc cái gì áp đặt nó. Nhiều "constraint" sau khi hỏi lại hóa ra chỉ là thói quen hoặc sở thích công nghệ.

## 2. Constraint và testing

Constraint không được test như một hành vi. Nó được **kiểm tuân thủ**: một review, một inspection hoặc một check tự động xác nhận thiết kế và code không vượt giới hạn. Vì vậy gate yêu cầu mỗi Constraint nêu **cách kiểm tuân thủ** (GC-05). Nếu không chỉ ra được cách kiểm, giới hạn đó còn quá mơ hồ để ràng buộc được ai.

## 3. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GC-01 | Giới hạn **áp từ bên ngoài**. Field `imposed_by` nêu ai hoặc cái gì áp đặt: khách hàng, quy định pháp lý, nền tảng, đối tác, ngân sách được cấp. Nếu là lựa chọn của team thì chuyển sang Decision | Lựa chọn của team bị khóa cứng như luật | CI (`imposed_by` không rỗng) + Review | Proposed | ISO 29148 (constraint), Wiegers |
| GC-02 | Section `Constraint` dài 1–2 câu, nêu **cái gì bị giới hạn và ranh giới ở đâu**, theo dạng "<Đối tượng> phải / không được <giới hạn>" | Giới hạn chung chung, không biết đã vượt hay chưa | Review | Proposed | ISO 29148 (bounded), arc42 |
| GC-03 | Section `Lý do không đổi được`: giới hạn đến từ đâu, vì sao team không đổi được | Constraint đã lỗi thời vẫn được tuân thủ | CI (section) + Review | Proposed | Wiegers ("ask why, record rationale") |
| GC-04 | Không phải giải pháp kỹ thuật đội lốt ("phải dùng X"), trừ khi X thực sự do bên ngoài áp đặt | Khóa kiến trúc trước khi có evidence | Review | Proposed | Wiegers |
| GC-05 | Section `Cách kiểm tuân thủ` có ít nhất một cách **xác nhận** trực tiếp rằng giới hạn không bị vượt (đối chiếu số liệu thực tế, inspection, check tự động). Biện pháp phòng ngừa (cảnh báo sớm, review trước khi làm) được ghi thêm, nhưng không thay được bước xác nhận | Constraint chỉ tồn tại trên giấy; hoặc chỉ có cảnh báo mà không ai biết giới hạn thực tế đã bị vượt | CI (section) + Review | Active | arc42, ISO 29148 (verifiable) |
| GC-06 | `Review Trigger` là một sự kiện quan sát được khiến cần xem lại Constraint. Thường đó là thay đổi ở phía bên áp đặt, như hợp đồng mới, ngân sách mới hoặc phiên bản nền tảng mới | Constraint không bao giờ được xem lại, hoặc bị team tự bỏ qua khi thấy bất tiện | Review | Active | Wiegers (kiểm assumption lỗi thời) |
| GC-07 | `type` phân biệt giới hạn lên **sản phẩm** (kỹ thuật, nền tảng, pháp lý, đối tác) với giới hạn lên **dự án** (thời gian, nhân lực, ngân sách). Giới hạn lên dự án chỉ nằm trong spec khi có Requirement hoặc Decision trỏ tới; nếu không thì thuộc tài liệu quản lý dự án | Spec lẫn với quản lý dự án | Lint (giới hạn dự án không có tham chiếu tới) | Active | arc42 (technical / organizational constraints) |
| GC-08 | Ranh giới đo được hoặc liệt kê được; không dùng "quá lớn", "phù hợp" | Không phán được đã vượt hay chưa | Lint (GX-08) + Review | Active | INCOSE R7 |

## 4. Ví dụ minh họa (hệ thống đặt vé giả định)

**GC-01: lựa chọn của team đội lốt Constraint.**

> Chưa đạt: C-901 "Hệ thống phải dùng PostgreSQL", với `imposed_by` để trống.
> Sau khi hỏi "vì sao": team chọn PostgreSQL vì quen dùng. Đây là Decision, có phương án khác và mở lại được.
> Nếu khách hàng yêu cầu chạy trên hạ tầng cơ sở dữ liệu sẵn có của họ, thì là Constraint thật: `imposed_by: khách hàng`, và câu Constraint nêu đúng điều khách hàng yêu cầu.

**GC-02, GC-05, GC-08: ranh giới và cách kiểm.**

> Chưa đạt: "Hệ thống không được tốn quá nhiều chi phí hạ tầng."
> Đạt:
>
> ```markdown
> id: C-903
> short_name: Chi phí hạ tầng tối đa mỗi tháng
> imposed_by: ngân sách được cấp cho dự án
>
> ## Constraint
> Chi phí hạ tầng cloud hằng tháng của môi trường production không được vượt 50 USD.
>
> ## Lý do không đổi được
> 1. Ngân sách đã được duyệt cho cả năm và không có nguồn bổ sung.
>
> ## Cách kiểm tuân thủ
> 1. Đầu mỗi tháng, người phụ trách hạ tầng đối chiếu hóa đơn cloud của tháng trước với giới hạn 50 USD và ghi kết quả vào issue theo dõi chi phí.
> 2. Phòng ngừa: cảnh báo ngân sách của nhà cung cấp cloud đặt ở mức 40 USD.
> 3. Phòng ngừa: review kiến trúc ước tính chi phí trước khi thêm dịch vụ trả phí mới.
>
> ## Review Trigger
> Ngân sách năm sau được duyệt, hoặc lượng người dùng vượt mức dùng để ước tính ban đầu.
> ```

C-903 là giới hạn lên dự án (ngân sách). Theo GC-07, nó được giữ trong spec vì D-901 dựa vào nó để loại phương án hàng đợi ảo. Cũng cần phân biệt hai loại việc trong `Cách kiểm tuân thủ`: mục 1 xác nhận chi phí thực tế không vượt giới hạn; mục 2 và 3 chỉ là phòng ngừa (GC-05).

**GC-02: giới hạn từ đối tác.**

> C-902 "Màn hình và trình duyệt được hỗ trợ": "Vé điện tử phải hiển thị được trên Chrome và Safari hai phiên bản mới nhất, màn hình rộng từ 360 px", với `imposed_by: hợp đồng với ban tổ chức`.

Requirement viết "trên các trình duyệt liệt kê ở C-902" thay vì "trên các trình duyệt phổ biến". Nhờ vậy requirement có ranh giới kiểm được (xem GR-11).
