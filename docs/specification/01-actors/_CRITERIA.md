# Gate: Actor

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Actor là gì, không là gì

**Actor là một vai trò mà người dùng hoặc hệ thống khác đóng khi tương tác với hệ thống** (UML). Actor là vai trò, không phải một người cụ thể: một người có thể đóng nhiều vai trò, và nhiều người có thể đóng cùng một vai trò.

Actor được phân loại theo **bản chất** (`kind`): con người hay hệ thống bên ngoài. Actor là **primary** hay **supporting** thì không phải thuộc tính của Actor. Đó là vai trò trong từng Use Case, ghi ở `primary_actor` và `supporting_actors` của Use Case. Cùng một Actor có thể là primary ở Use Case này và supporting ở Use Case khác. Ví dụ: Ban tổ chức là primary khi tạo sự kiện, và là supporting khi duyệt yêu cầu hoàn tiền đặc biệt.

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Một nhóm người dùng chưa có mục tiêu hay hành vi khác biệt so với nhóm khác | Không tách actor; ghi trong `Ghi chú` của actor hiện có |
| Giới hạn chung của project | Constraint |
| Một thành phần bên trong hệ thống | Không phải actor |

## 2. Actor và testing

Actor không được test. Nó cung cấp cho test hai thứ:
- **Actor là con người:** `Permissions / Capabilities` cho biết actor được làm gì. Đây là cơ sở cho test phân quyền: thử thao tác ngoài quyền và kiểm hệ thống từ chối.
- **Actor là hệ thống bên ngoài** (dịch vụ, hệ thống đối tác, AI provider): `Hành vi lỗi` liệt kê các cách actor có thể hỏng. Mỗi cách hỏng là một điều kiện cần giả lập trong test (fault injection). Mỗi Use Case có actor này trong `primary_actor` hoặc `supporting_actors` phải có nhánh tương ứng (GUC-12).

## 3. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GACT-01 | `name` là tên **vai trò**, phân biệt được với actor khác | Actor trùng nhau, hoặc là tên một người | Review | Draft | UML |
| GACT-02 | `kind` lấy từ `schema.json`, mỗi giá trị ánh xạ vào **con người** hoặc **hệ thống bên ngoài**. Không ghi primary hay supporting ở Actor; vai trò đó ghi tại Use Case (GUC-02) | Trộn bản chất với vai trò; Actor bị gán cứng là primary dù chỉ hỗ trợ ở nhiều Use Case | CI (enum và ánh xạ) | Draft | UML, Cockburn (primary / supporting là vai trò trong use case) |
| GACT-03 | `Goal` dài 1–2 câu: actor muốn đạt gì khi dùng hệ thống, hoặc hệ thống bên ngoài cung cấp gì | Không biết Use Case nào phục vụ hoặc cần actor | Review | Active | Cockburn (stakeholders & interests) |
| GACT-04 | `Needs / Pain Points`, `Knowledge / Context`, `Permissions / Capabilities` là danh sách cụ thể. Không dùng "toàn quyền", "người dùng bình thường" | Không suy ra được thiết kế trải nghiệm và test phân quyền | Lint (GX-08) + Review | Active | INCOSE R7 |
| GACT-05 | Actor thuộc nhóm hệ thống bên ngoài có section `Hành vi lỗi`: các cách actor có thể hỏng mà hệ thống phải xử lý | Use Case thiếu nhánh lỗi; không có điều kiện để fault injection | CI (section) | Active | Cockburn (supporting actors), NASA SWE-184 (fault injection) |
| GACT-06 | Có ≥1 Use Case trỏ tới actor này qua `primary_actor` hoặc `supporting_actors` | Actor thừa | Lint | Active | Quy ước |
| GACT-07 | File actor không giữ danh sách Use Case liên quan. Danh sách đó do công cụ sinh từ cả `primary_actor` và `supporting_actors` của Use Case | Hai đầu lệch nhau; bỏ sót Use Case mà actor chỉ tham gia hỗ trợ | CI | Draft | GX-05 |
| GACT-08 | Mỗi việc trong `Permissions / Capabilities` khớp với ít nhất một bước trong Use Case. Ngược lại, không Use Case nào cho actor làm việc ngoài danh sách | Quyền trên giấy khác quyền trong luồng | Review | Active | ISO 29148 (set consistent) |

## 4. Ví dụ minh họa (hệ thống đặt vé giả định)

**GACT-05: hệ thống bên ngoài.**

> ```markdown
> id: ACT-902
> name: Cổng thanh toán đối tác
> kind: external-system
>
> ## Goal
> Nhận yêu cầu thanh toán và trả kết quả giao dịch cho hệ thống.
>
> ## Hành vi lỗi
> 1. Không phản hồi trong 30 giây.
> 2. Từ chối giao dịch, kèm mã lý do.
> 3. Gửi cùng một kết quả thanh toán hai lần.
> 4. Gửi kết quả thành công sau khi giữ chỗ của đơn đã hết hạn.
> ```

ACT-902 nằm trong `supporting_actors` của Use Case mua vé (primary là Người mua vé). Mỗi dòng `Hành vi lỗi` là một test giả lập cổng thanh toán, và ứng với một nhánh của Use Case mua vé hoặc một dòng trong bảng chuyển trạng thái của đơn (BR-902): dòng 3 là kết quả gửi lặp, dòng 4 là thanh toán đến muộn.

**GACT-01, GACT-04: vai trò và quyền cụ thể.**

> Chưa đạt: `name: Anh Minh (admin)`; `Permissions: Toàn quyền.`
> Đạt: `name: Ban tổ chức sự kiện`; `Permissions:` "1. Tạo và sửa sự kiện của chính mình. 2. Xem danh sách đơn của sự kiện mình tổ chức. 3. Hủy sự kiện chưa diễn ra."

Bản đạt cho tester ngay ba test phân quyền ngược: sửa sự kiện của ban tổ chức khác, xem đơn của sự kiện khác, hủy sự kiện đã diễn ra. Cả ba phải bị từ chối.
