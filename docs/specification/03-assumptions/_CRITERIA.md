# Gate: Assumption

Đọc cùng `../_COMMON_CRITERIA.md`. Mẫu file nằm ở `_TEMPLATE.md`.

## 1. Assumption là gì, không là gì

**Assumption là điều team đang coi là đúng nhưng chưa có đủ evidence, trong khi có Requirement hoặc Decision đang dựa trên nó.**

Assumption-Based Planning (Dewar, RAND) chỉ ra hai loại assumption cần quản lý chủ động:
- **Load-bearing:** nếu assumption sai, kế hoạch phải đổi đáng kể.
- **Vulnerable:** assumption dễ bị thực tế làm sai.

Với mỗi assumption thuộc hai loại trên, cần có ba thứ:
- **Signpost:** dấu hiệu sớm cho thấy assumption đang sai.
- **Shaping action:** việc làm để kiểm chứng hoặc củng cố assumption.
- **Hedging action:** việc sẽ làm nếu assumption sai.

| Nếu nội dung là… | Thì thuộc |
|---|---|
| Câu hỏi chưa có giả thuyết | Task nghiên cứu (spike), không phải Assumption |
| Điều đã có evidence và team đã chốt | Decision, hoặc Assumption chuyển sang Supported |
| Giả định về cách team làm việc (công cụ, quy trình) mà không Requirement hay Decision sản phẩm nào dựa vào | Tài liệu quản lý dự án, không thuộc spec |

## 2. Assumption và testing

Assumption không được test như phần mềm. Nó được **kiểm chứng bằng evidence**: user test, benchmark, spike, số liệu vận hành. Gate yêu cầu hai thứ:
- Câu phát biểu **bác bỏ được** (falsifiable).
- Có **cách kiểm chứng**: ai làm gì, quan sát gì, thì assumption chuyển sang Supported hoặc Invalidated.

Khi một assumption chuyển sang Invalidated, đó là lúc chạy phân tích ảnh hưởng để xem lại mọi Requirement và Decision đang dựa vào nó.

## 3. Áp gate theo vòng đời

Assumption có vòng đời riêng. `_COMMON_CRITERIA.md` mục 1 tách hai câu hỏi: item phải qua gate nào (mức sẵn sàng), và item còn được làm chỗ dựa không (hiệu lực). Assumption trả lời hai câu hỏi đó như sau:

| Status của Assumption | Mức sẵn sàng | Hiệu lực | Ghi chú |
|---|---|---|---|
| Open | Active | Có | Gate đầy đủ, trừ evidence |
| Supported | Active | Có | Thêm evidence (GA-07) |
| Invalidated | Active | **Không** | Thêm evidence (GA-07). Mọi item Active còn **dựa vào** assumption này vi phạm GX-04, và phải được xem lại |
| Retired | Closed | Không | Chỉ cấu trúc |

Invalidated phải qua gate đầy đủ, vì kết luận "sai" cũng cần evidence chắc như kết luận "đúng". Nhưng nó không còn hiệu lực. Nếu chỉ dùng một trục Active/Closed, hai ý này sẽ lẫn vào nhau: một Requirement có thể tiếp tục dựa vào assumption đã bị bác bỏ mà không ai phát hiện.

## 4. Tiêu chí

| ID | Tiêu chí | Ngăn vấn đề gì | Tầng | Áp từ | Nguồn |
|---|---|---|---|---|---|
| GA-01 | Section `Assumption` là **một câu khẳng định bác bỏ được**: chỉ ra được quan sát nào sẽ chứng minh nó sai. Không phải câu hỏi, không phải mong muốn | Assumption không bao giờ kiểm được, nên không bao giờ sai | Lint (kết thúc bằng "?") + Review | Open | Assumption mapping (Lean), Dewar |
| GA-02 | **Đơn nhất:** một item chỉ chứa những gì được Supported hoặc Invalidated **cùng nhau**. Nếu câu chứa hai khẳng định có thể đúng sai độc lập, tách thành hai item. Một giả thuyết dạng "nếu… thì" được kiểm bằng một phép quan sát duy nhất thì vẫn là một item | Một vế đúng một vế sai, không biết đổi status thế nào | Review | Open | INCOSE C5 (áp tương tự) |
| GA-03 | **Load-bearing:** có ≥1 Requirement hoặc Decision trỏ tới. Không ai dựa vào thì không giữ trong spec | Danh sách assumption phình ra mà không ai theo dõi | Lint (không có tham chiếu tới) | Open | Dewar (load-bearing assumptions) |
| GA-04 | Section `Signpost`: tín hiệu quan sát được, có ngưỡng hoặc sự kiện cụ thể. Không dùng "định kỳ", "rõ rệt", "khi cần" | Không ai biết lúc nào phải xem lại | Lint (GX-08) + Review | Open | Dewar (signposts) |
| GA-05 | Section `Cách kiểm chứng` nêu: đối tượng quan sát và **mẫu số**; cỡ mẫu tối thiểu; ngưỡng dẫn tới Supported và ngưỡng dẫn tới Invalidated, **đo trên cùng đại lượng mà câu Assumption khẳng định**; và cách xử lý khi evidence chưa đủ để kết luận (chưa đủ mẫu, kết quả nằm giữa hai ngưỡng). Cỡ mẫu và ngưỡng chưa có evidence được ghi dạng ngưỡng tạm có nhãn (`_COMMON_CRITERIA.md` mục 7) | Assumption ở Open mãi; hoặc được kết luận bằng một phép đo khác với điều nó khẳng định | CI (section) + Review | Open | NASA SWE-184 ("explicit assumptions with validation criteria"), Dewar (shaping actions) |
| GA-06 | Section `Nếu sai`: việc team sẽ làm (mở lại Decision, kích hoạt Requirement, đổi scope). Không liệt kê lại các item bị ảnh hưởng, vì công cụ tính được từ quan hệ | Phát hiện sai mà không có phương án | Review | Open | Dewar (hedging actions) |
| GA-07 | Status Supported hoặc Invalidated phải có `source` trỏ tới evidence (tài liệu, kết quả test có ngày, issue ghi kết quả spike) | Đổi status theo cảm giác | CI | Supported, Invalidated | ISO 29148 (source) |
| GA-08 | `short_name` 3–8 từ | Không scan được danh sách | Lint | Mọi status | INCOSE C13 |

## 5. Ví dụ minh họa (hệ thống đặt vé giả định)

**GA-01, GA-04, GA-05, GA-06: assumption đầy đủ.**

> ```markdown
> id: A-901
> short_name: Người mua thanh toán xong trong 10 phút
>
> ## Assumption
> Ít nhất 85% đơn giữ chỗ được thanh toán thành công trong vòng 10 phút kể từ lúc giữ chỗ.
>
> ## Signpost
> Trong bất kỳ tuần nào, tỷ lệ đơn giữ chỗ thanh toán thành công trong 10 phút xuống dưới 85%.
>
> ## Cách kiểm chứng
> 1. Đối tượng: mọi đơn chuyển sang trạng thái Giữ chỗ trong 2 tuần mở bán thử. Mẫu số là số đơn đó; tử số là số đơn chuyển sang Đã thanh toán trong 10 phút. Đơn bị người mua chủ động hủy được loại khỏi cả tử số lẫn mẫu số.
> 2. Cỡ mẫu tối thiểu: 500 đơn.
> 3. Supported: tỷ lệ ≥ 85% trên ≥ 500 đơn.
> 4. Invalidated: tỷ lệ < 85% trên ≥ 500 đơn.
> 5. Chưa đủ 500 đơn sau 2 tuần: giữ Open, kéo dài thêm 2 tuần và ghi kết quả tạm vào issue theo dõi.
>
> ## Nếu sai
> 1. Mở lại D-901 (thời gian giữ chỗ) để xét giữ chỗ 15 phút hoặc giữ chỗ có gia hạn.
> ```

Câu Assumption, Signpost và ngưỡng kiểm chứng cùng đo một đại lượng: tỷ lệ đơn thanh toán thành công trong 10 phút. Mẫu số được định nghĩa rõ. Trường hợp chưa đủ evidence có hướng xử lý, nên assumption không bị kết luận vội. R-901 (giữ chỗ 10 phút) và D-901 dựa vào A-901, nên A-901 là load-bearing (GA-03).

**GA-01: không bác bỏ được.**

> Chưa đạt: "Người dùng sẽ thích tính năng chọn ghế."
> Đạt: "Ít nhất 40% người mua vé hạng ngồi sẽ tự chọn ghế thay vì để hệ thống xếp."

Bản chưa đạt không chỉ ra được quan sát nào sẽ chứng minh nó sai.

**GA-02: hai khẳng định trong một câu.**

> Chưa đạt: "Người mua chủ yếu dùng điện thoại, nên họ không cần tải vé dạng PDF."
> Đạt: tách thành hai assumption. "Ít nhất 80% đơn được đặt từ điện thoại." "Ít nhất 90% lượt soát vé dùng mã QR hiển thị trên điện thoại thay vì vé in."

Hai vế được đo bằng hai phép quan sát khác nhau (nguồn đặt đơn, cách xuất trình vé), và có thể đúng sai độc lập: người mua đặt trên điện thoại nhưng vẫn in vé.

> Vẫn là một item: "Nếu trang mua vé hiển thị đồng hồ đếm ngược thời gian giữ chỗ, tỷ lệ đơn Hết hạn giảm ít nhất 5 điểm phần trăm so với trang không có đồng hồ."

Câu có "nếu… thì", nhưng chỉ là một giả thuyết, được kiểm bằng một thí nghiệm A/B duy nhất. Không cần tách.
