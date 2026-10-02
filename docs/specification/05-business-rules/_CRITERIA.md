# Gate: Business Rule

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Business Rule là gì, không là gì

**Business Rule là quy tắc nghiệp vụ được tách ra thành một item riêng để có một nơi sở hữu duy nhất.** Thường đó là quy tắc dùng chung cho nhiều Use Case hoặc Requirement. Rule nói **điều gì phải đúng**, không nói hệ thống làm theo thứ tự nào.

Business Rules Manifesto đặt ra hai yêu cầu cho cách viết rule:
- Rule phát biểu **khai báo (declarative)** bằng câu tự nhiên, để người nghiệp vụ kiểm được tính đúng.
- Các rule phải đối chiếu được với nhau để phát hiện mâu thuẫn.

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Hành vi chỉ của một Use Case | Main Flow hoặc nhánh của Use Case đó |
| Lựa chọn team đã chốt giữa nhiều phương án, kèm lý do | Decision. Rule chỉ giữ phần "điều phải đúng" |
| Năng lực hệ thống phải có | Requirement |

## 2. Business Rule và testing

Một rule tốt chuyển thẳng được thành test theo một trong hai kỹ thuật của ISTQB:
- **Decision table testing:** khi rule có nhiều điều kiện kết hợp. Mỗi cột hoặc mỗi dòng của bảng là một test case.
- **State transition testing:** khi rule nói về việc một đối tượng đổi trạng thái. Mỗi chuyển trạng thái hợp lệ là một test case; mỗi chuyển trạng thái không hợp lệ cũng là một test case.

Nếu rule có từ 3 điều kiện trở lên mà vẫn viết thành đoạn văn, người viết test phải tự dựng lại bảng, và mỗi người sẽ dựng một kiểu. Vì vậy GBR-05 yêu cầu viết sẵn bảng vào spec.

## 3. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GBR-01 | Rule được dùng ở ít nhất 2 nơi: số Use Case trong `use_cases` cộng số Requirement trỏ tới rule qua `business_rules` từ 2 trở lên. Nếu chỉ một nơi dùng, cân nhắc đưa nội dung vào chính Use Case hoặc Requirement đó. Rule chỉ một nơi dùng vẫn được giữ khi có chủ sở hữu nghiệp vụ riêng (ví dụ chính sách hoàn tiền do bộ phận khác quyết định); ghi lý do trong Ghi chú | Hành vi của một Use Case bị tách ra thành rule, gây phân mảnh | Lint + Review | Active | Quy ước (con số 2 là ngưỡng gợi ý để phát hiện rule có thể bị tách thừa, không đến từ chuẩn) |
| GBR-02 | Mỗi mệnh đề theo dạng "Khi [điều kiện], [chủ thể] phải / không được [hành vi]". Rule luôn đúng thì bỏ vế "Khi" | Không biết rule áp dụng lúc nào | Lint (mẫu) | Proposed | RuleSpeak (Ross) |
| GBR-03 | **Nguyên tử:** mỗi mệnh đề đánh số là một rule tự đứng được. Không có mệnh đề phụ thuộc ngầm vào mệnh đề trước ("trong trường hợp đó…") | Sửa một vế làm sai nghĩa vế khác | Review | Proposed | Business Rules Manifesto; Nijpels ("a rule must be atomic") |
| GBR-04 | **Khai báo, không thủ tục:** nêu điều phải đúng, không nêu trình tự bước hay cơ chế implement | Rule biến thành thiết kế; khóa cách implement | Review | Proposed | Business Rules Manifesto ("expressed declaratively") |
| GBR-05 | Rule có từ 3 điều kiện kết hợp trở lên thì thêm `Bảng quyết định` (điều kiện × kết quả). Rule về chuyển trạng thái thì thêm `Bảng chuyển trạng thái` (trạng thái hiện tại, sự kiện, điều kiện, trạng thái sau) | Test thiếu tổ hợp; mỗi người hiểu thứ tự một kiểu | Lint (>3 mệnh đề có "khi") + Review | Active | ISTQB (decision table, state transition) |
| GBR-06 | `Exceptions` liệt kê đủ từng trường hợp rule không áp dụng. Không dùng "tùy trường hợp" hay "sẽ định nghĩa sau"; điều chưa biết đưa vào `Câu hỏi mở` kèm nơi xử lý | Ngoại lệ không test được | Lint + CI (GX-09) | Active | ISO 29148 (không TBD) |
| GBR-07 | Từ rule viết được ít nhất một test có điều kiện vào và kết quả phán được đúng sai | Rule đúng ý nhưng không kiểm được | Review | Active | Business Rules Manifesto ("validated for correctness"), INCOSE C7 |
| GBR-08 | Không mâu thuẫn với rule khác, không lặp nguyên văn một Decision. Decision giữ lựa chọn và lý do; rule giữ điều phải đúng | Hai nơi cùng định nghĩa một quy tắc | Review | Proposed | Business Rules Manifesto (consistency), GX-10 |
| GBR-09 | Mọi danh từ nghiệp vụ trong rule có trong `glossary.md` | Rule đúng chữ nhưng sai nghĩa | Lint | Proposed | Business Rules Manifesto (tách vocabulary khỏi logic) |
| GBR-10 | Có `source` | Không biết rule đến từ đâu | CI | Active | ISO 29148 (source) |
| GBR-11 | `short_name` 3–8 từ, nêu nội dung quy tắc | Không scan được danh sách | Lint | Draft | INCOSE C13 |

## 4. Ví dụ minh họa (hệ thống đặt vé giả định)

**GBR-05: bảng quyết định.**

> Chưa đạt (BR-901 "Mức hoàn tiền khi hủy vé"):
> "Khi người mua hủy vé, hệ thống hoàn 100% nếu hủy trước sự kiện hơn 7 ngày, vé VIP thì hoàn 90%, còn trong 7 ngày thì hoàn 50% trừ vé khuyến mãi không hoàn, và trong 24 giờ thì không hoàn."
>
> Đạt:
>
> ```markdown
> ## Rule
> 1. Khi người mua hủy vé, hệ thống phải hoàn tiền theo Bảng quyết định.
> 2. Vé khuyến mãi không được hoàn tiền.
>
> ## Bảng quyết định
> | Thời điểm hủy trước sự kiện | Vé thường | Vé VIP | Vé khuyến mãi |
> |---|---|---|---|
> | > 7 ngày | 100% | 90% | 0% |
> | 24 giờ – 7 ngày | 50% | 50% | 0% |
> | < 24 giờ | 0% | 0% | 0% |
> ```

Bản văn xuôi có ba chỗ hiểu hai kiểu: vé VIP được hoàn 90% ở mọi mốc thời gian, hay chỉ ở mốc trên 7 ngày? Mốc "trong 7 ngày" có bao gồm 24 giờ cuối không? Vé khuyến mãi hủy sớm có được hoàn không? Bảng buộc người viết trả lời từng ô. Bảng có 9 ô, tương ứng 9 test case. Tester còn thêm test ở các biên 7 ngày và 24 giờ.

**GBR-05: bảng chuyển trạng thái.**

> BR-902 "Vòng đời của đơn đặt vé":
>
> ```markdown
> ## Bảng chuyển trạng thái
> | Trạng thái hiện tại | Sự kiện | Điều kiện | Trạng thái sau |
> |---|---|---|---|
> | Giữ chỗ | Thanh toán thành công | Trong 10 phút giữ chỗ | Đã thanh toán |
> | Giữ chỗ | Hết 10 phút | Chưa thanh toán | Hết hạn |
> | Giữ chỗ | Người mua hủy | — | Đã hủy |
> | Đã thanh toán | Người mua hủy | Trước giờ diễn ra sự kiện | Đã hủy (hoàn tiền theo BR-901) |
> | Hết hạn | Thanh toán thành công (kết quả đến muộn) | — | Hết hạn; hệ thống tạo lệnh hoàn toàn bộ số tiền trong vòng 1 giờ |
> | Đã thanh toán | Thanh toán thành công (kết quả gửi lặp) | — | Không đổi; không ghi nhận lần thu thứ hai |
> ```

Hai dòng cuối là những chuyển trạng thái mà văn xuôi rất hay bỏ sót: kết quả thanh toán đến sau khi giữ chỗ đã hết hạn, và cổng thanh toán gửi lặp cùng một kết quả. Viết thành bảng buộc người viết xét từng cặp trạng thái và sự kiện. Mỗi sự kiện trong bảng ứng với một mục trong `Hành vi lỗi` của Actor cổng thanh toán.

**GBR-02, GBR-04: khai báo, có điều kiện.**

> Chưa đạt: "Hệ thống kiểm tra tuổi rồi mới cho chọn vé sự kiện 18+."
> Đạt: "Khi sự kiện có giới hạn 18+, hệ thống không được bán vé cho tài khoản chưa xác minh đủ 18 tuổi."

Bản chưa đạt mô tả thứ tự bước (thủ tục). Bản đạt nêu điều phải đúng, và đặt điều kiện ngay trong câu.
