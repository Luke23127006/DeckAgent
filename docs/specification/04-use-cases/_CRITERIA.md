# Gate: Use Case

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Use Case là gì, không là gì

**Use Case là toàn bộ các cách một actor dùng hệ thống để đạt một mục tiêu, kết thúc bằng một kết quả quan sát được có giá trị với actor đó** (Use-Case 2.0). Use Case gồm một luồng thành công (Main Flow) và các nhánh (Alternative / Failure Flows).

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Quy tắc áp cho từ 2 Use Case trở lên | Business Rule; flow chỉ tham chiếu ID của rule |
| Chất lượng hệ thống: thời gian, độ chính xác, độ sẵn sàng | Requirement loại Quality |
| Một bước kỹ thuật không có giá trị riêng với actor (ví dụ "kiểm tra định dạng email") | Một bước trong Use Case, không phải Use Case riêng |

## 2. Use Case và testing

Mỗi luồng của Use Case là một **test scenario**. Main Flow là một scenario, và mỗi nhánh là một scenario khác. Đây là kỹ thuật use case testing của ISTQB. Use-Case 2.0 gọi mỗi đường đi qua các luồng là một *story*; mỗi slice gồm vài story và có test case riêng.

Vì vậy gate của Use Case tập trung vào ba điều:
- Điểm rẽ nhánh là **điều kiện hệ thống phát hiện được** (Cockburn), để tester tạo lại được đúng điều kiện đó.
- Mỗi nhánh nói rõ **kết thúc ở đâu**.
- Postconditions và Bảo đảm tối thiểu **kiểm chứng được**. Đây chính là các assertion cuối của scenario.

## 3. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GUC-01 | `title` theo công thức [Ai] + [làm gì] + [với cái gì cụ thể] + [điểm phân biệt], tối đa khoảng 15 từ, dùng từ của người dùng | Không biết Use Case này khác Use Case gần nó ở đâu | Lint (độ dài) + Review | Draft | Cockburn |
| GUC-02 | Đúng một `primary_actor`: actor mà Use Case phục vụ. Actor khác tham gia để Use Case hoàn thành (dịch vụ bên ngoài, người duyệt) ghi ở `supporting_actors`. Vai trò primary hay supporting được xác định **tại từng Use Case**, không phải thuộc tính cố định của Actor | Không biết Use Case phục vụ ai; công cụ không tìm được Use Case bị ảnh hưởng khi một dịch vụ bên ngoài thay đổi | CI (`primary_actor` đúng một) + Review (`supporting_actors` đủ) | Draft | UML, Cockburn (primary / supporting actor) |
| GUC-03 | Mục tiêu ở **mức user goal**: actor hoàn thành trong một lần sử dụng và nhận một kết quả có giá trị. Ngoại lệ: Use Case **subfunction** được include bởi từ 2 Use Case trở lên; khi đó ghi `level: subfunction` | Use Case quá vụn hoặc quá to, khó test và khó chia nhỏ để làm | Review | Proposed | Cockburn (goal levels), Use-Case 2.0 |
| GUC-04 | `Tình huống` theo dạng "Tôi có…, tôi muốn…, để…", có chi tiết cụ thể | Người đọc và tester không hình dung được dữ liệu test | Lint (mẫu) | Proposed | Quy ước |
| GUC-05 | `Mục tiêu` là một câu về kết quả actor nhận được. Không mô tả hệ thống làm gì, không lặp Postconditions | Trùng thông tin | Review | Proposed | Cockburn, GX-10 |
| GUC-06 | `Trigger` là một sự kiện quan sát được, bắt đầu bằng chủ ngữ | Không biết test bắt đầu từ đâu | Review | Proposed | Cockburn |
| GUC-07 | `Preconditions` là điều **đã đúng trước bước 1**, và luồng không kiểm lại. Chỉ ghi điều riêng của Use Case này | Precondition lẫn với bước kiểm tra; setup test sai trạng thái | Review | Proposed | Cockburn |
| GUC-08 | `Main Flow` là danh sách đánh số, không chứa "nếu". Nên có 3–9 bước; ngoài khoảng này thì xem lại mức mục tiêu (GUC-03) | Luồng quá vụn, hoặc nhánh bị nhồi vào luồng chính | CI (đánh số) + Lint (số bước, "nếu") + Review | Active | Cockburn (3–9 bước là hướng dẫn, không phải giới hạn cứng) |
| GUC-09 | Mỗi bước là [actor hoặc hệ thống] + động từ + đối tượng, nêu **ý định hoặc kết quả quan sát được**; không mô tả chi tiết giao diện hay cách implement | Spec khóa giao diện; bước không test được | Review | Proposed | Cockburn |
| GUC-10 | Mỗi dòng trong `Alternative / Failure Flows` theo dạng `<số bước><A-Z>. <điều kiện>: <hệ thống làm gì>, <quay lại bước X \| kết thúc Use Case \| chuyển sang UC-xxx>.` | Nhánh không biết đi tiếp đâu; test không có kết quả cuối | CI (dạng, có điểm kết thúc) | Active | Cockburn |
| GUC-11 | Điều kiện của mỗi nhánh là điều **hệ thống phát hiện được**, cụ thể tới mức tạo lại được trong test. Không viết chung chung "lỗi" hay "không hợp lệ" | Tester không tạo được điều kiện | Lint (từ chung chung) + Review | Active | Cockburn ("conditions the system can detect") |
| GUC-12 | Xét đủ nhánh. Với mỗi actor trong `supporting_actors`, mỗi mục trong `Hành vi lỗi` của actor đó có nhánh tương ứng hoặc lý do bỏ qua trong Ghi chú. Mỗi bước nhận dữ liệu người dùng đưa vào, hoặc có thể bị hủy giữa chừng, cũng phải có nhánh | Thiếu luồng lỗi; test chỉ phủ đường thành công | Review | Active | Cockburn ("exhaustively list extension conditions") |
| GUC-13 | `Postconditions` liệt kê điều chắc chắn đúng khi Use Case **thành công**, mỗi điều kiểm chứng được. Không lặp Mục tiêu, không ghi "có thể làm gì tiếp" | Không có assertion cuối cho test | Review | Active | Cockburn (success guarantee) |
| GUC-14 | Có section `Bảo đảm tối thiểu`: điều vẫn đúng khi Use Case **thất bại** ở bất kỳ nhánh nào. Được phép chỉ tham chiếu một Business Rule | Test luồng lỗi không biết phải kiểm gì | CI (section) | Active | Cockburn (minimal guarantee) |
| GUC-15 | Quy tắc dùng chung cho từ 2 Use Case trở lên không viết lại trong flow, mà tham chiếu ID của Business Rule | Một quy tắc bị viết lệch ở nhiều Use Case | Review | Proposed | Business Rules Manifesto, GX-10 |
| GUC-16 | `scope` là release đầu tiên giao **Main Flow** của Use Case. Nhánh hoặc phần mở rộng giao ở release sau được quản lý bằng một trong hai cách, không nhân bản Use Case: (a) Use Case riêng `extend` Use Case gốc, có `scope` riêng; hoặc (b) slice trong kế hoạch release trỏ tới mã nhánh. Nhánh chưa thuộc release hiện tại ghi rõ trong Ghi chú | Không biết release hiện tại phải test gì; Use Case bị chép thành nhiều bản lệch nhau | Review | Proposed | Use-Case 2.0 (slicing) |
| GUC-17 | Quan hệ giữa các Use Case khai báo **một phía** trong frontmatter, đúng loại theo `_COMMON_CRITERIA.md` mục 2: `include`, `extend` là dựa vào; `follows`, `split_from`, `related`, `superseded_by` là tham chiếu. Phía ngược do công cụ sinh | Hai phía lệch nhau; phân tích ảnh hưởng lan sai hướng | CI | Draft | GX-05 |
| GUC-18 | Use Case Active chỉ còn những `Câu hỏi mở` có nơi xử lý | Chỗ trống bị giấu trong Use Case đang làm | CI | Active | GX-09 |

## 4. Ví dụ minh họa (hệ thống đặt vé giả định)

**GUC-10, GUC-11: nhánh viết đạt.**

> Chưa đạt: "4A. Thanh toán lỗi: Hệ thống báo lỗi."
> Đạt:
> "4A. Cổng thanh toán từ chối giao dịch: Hệ thống hiển thị lý do từ chối do cổng trả về và giữ nguyên vé đang giữ chỗ, quay lại bước 3."
> "4B. Cổng thanh toán không phản hồi sau 30 giây: Hệ thống hủy giao dịch, nhả các vé đang giữ chỗ, kết thúc Use Case."

"Lỗi" ở bản chưa đạt gộp nhiều điều kiện khác nhau, và mỗi điều kiện cần một cách giả lập riêng trong test. Bản đạt tách theo điều hệ thống phát hiện được, và mỗi nhánh có điểm kết thúc.

**GUC-08: "nếu" trong Main Flow.**

> Chưa đạt: "5. Nếu người mua có mã giảm giá, hệ thống áp dụng mã."
> Đạt: Main Flow giữ đường không có mã giảm giá. Thêm nhánh "3A. Người mua nhập mã giảm giá còn hiệu lực: Hệ thống trừ giá trị mã vào tổng tiền, quay lại bước 4."

**GUC-14: Bảo đảm tối thiểu.**

> UC-901 "Người mua mua vé cho một sự kiện":
> ```markdown
> ## Bảo đảm tối thiểu
> 1. Đơn kết thúc ở một trong các trạng thái của BR-902: Đã thanh toán, Hết hạn hoặc Đã hủy. Không có đơn nào dừng ở trạng thái khác.
> 2. Vé đang giữ chỗ được nhả lại khi đơn chuyển sang Hết hạn hoặc Đã hủy.
> 3. Nếu cổng thanh toán đã thu tiền cho một đơn không ở trạng thái Đã thanh toán, hệ thống tạo lệnh hoàn toàn bộ số tiền đó trong vòng 1 giờ (BR-902).
> ```

Ba điều này là assertion chung của mọi test luồng lỗi, nên không lặp lại ở từng nhánh. Lưu ý điều 3: hệ thống **không** cam kết "người mua không bao giờ bị trừ tiền". Cổng thanh toán có thể thu tiền xong rồi mới báo kết quả, sau khi đơn đã hết hạn. Hệ thống không ngăn được việc đó, nhưng kiểm soát được nghĩa vụ xử lý sau đó: trạng thái nào, hoàn bao nhiêu, trong bao lâu. Bảo đảm tối thiểu chỉ ghi điều hệ thống thực sự kiểm soát được.

**GUC-07: precondition lẫn với bước kiểm tra.**

> Chưa đạt: "1. Sự kiện còn vé." Trong khi bước 2 của Main Flow lại là "Hệ thống kiểm tra số vé còn lại."
> Đạt: bỏ dòng này khỏi Preconditions, vì luồng có kiểm tra. Hết vé là một nhánh: "2A. Sự kiện không còn đủ số vé người mua chọn: …"
