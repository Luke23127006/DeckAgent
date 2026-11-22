# Coding Guidelines

Đọc file này để biết cách viết code production trong DeckAgent, bảo vệ contracts, kiểm tra dữ liệu và xử lý lỗi mà không tạo abstraction không cần thiết.

## Phạm vi và ưu tiên

1. Tuân thủ Tech Stack trong [Project: DeckAgent](../../AGENTS.md) [[1]](#ref-1) và dependency boundaries trong [Project Structure](project-structure.md) [[2]](#ref-2).
2. Strict boundaries, flexible implementation: bảo vệ trách nhiệm của từng component nhưng không bắt buộc class, interface, mapper hoặc layer theo template.
3. File này quy định cách triển khai code. Vị trí đặt code, public API ownership và allowed dependencies thuộc [Project Structure](project-structure.md) [[2]](#ref-2). Tầng rule của repo nằm trong [Conventions](README.md) [[3]](#ref-3).
4. Quy tắc kiểm tra được bằng máy phải được enforce bằng type, lint hoặc check phù hợp. Không ghi một quy tắc là đã được enforce nếu check chưa tồn tại.
5. Test code tuân theo [Testware](testware.md). File này chỉ quy định những yêu cầu của production code có ảnh hưởng đến khả năng kiểm thử.

## Naming conventions

Tên phải thể hiện ý nghĩa của dữ liệu, hành vi hoặc responsibility.

* Function dùng tên mô tả operation hoặc kết quả mà caller nhận được.
* Type và interface dùng tên mô tả contract hoặc khái niệm được biểu diễn.
* Boolean dùng tên thể hiện điều kiện có thể xác định là đúng hoặc sai.
* Các operation có side effect phải có tên giúp caller nhận biết tác động quan trọng.
* Không sử dụng tên chung như `data`,   `manager`,  `handler` hoặc `service` khi tên đó không giúp phân biệt responsibility.
* Giữ tên nhất quán cho cùng một khái niệm giữa các module.

Không bắt buộc hậu tố `Controller` , `Service` , `Repository` , `Manager` hoặc `Handler` . Chỉ sử dụng khi tên đó mô tả đúng vai trò của component.

Không đổi tên một khái niệm chỉ để tránh lặp từ.

## TypeScript

### Contracts và trạng thái

Sử dụng TypeScript để biểu diễn những trạng thái và operation hợp lệ.

* Dùng union type hoặc discriminated union khi các trạng thái có tập giá trị xác định.
* Khi các trạng thái có dữ liệu khác nhau, type phải thể hiện mối quan hệ giữa trạng thái và dữ liệu tương ứng.
* Không biểu diễn một invariant quan trọng chỉ bằng comment nếu type có thể bảo vệ invariant đó.
* Không tạo type phức tạp khi runtime validation vẫn là cơ chế duy nhất có thể xác định tính hợp lệ.
* Không dùng `any` hoặc type assertion để bỏ qua một lỗi type chưa được giải quyết.

TypeScript không thay thế runtime validation. Dữ liệu từ HTTP, file, database, model hoặc external service vẫn phải được kiểm tra tại boundary thích hợp.

### Nullability và optional values

Phân biệt dữ liệu không tồn tại, dữ liệu chưa được cung cấp và dữ liệu có giá trị `null` khi các trường hợp có ý nghĩa khác nhau.

Không dùng non-null assertion chỉ vì caller kỳ vọng dữ liệu luôn tồn tại. Nếu operation yêu cầu dữ liệu, phải kiểm tra precondition hoặc thiết kế contract bảo đảm điều kiện đó.

Không thêm optional fields chỉ để một object có thể sử dụng trong nhiều operation không liên quan.

### Async operations và resource lifetime

Một operation bất đồng bộ phải xác định ai sở hữu cancellation và resource cleanup.

* Truyền cancellation signal qua những operation cần hỗ trợ dừng.
* Kiểm tra cancellation trước side effect khi việc dừng phải ngăn side effect đó.
* Không coi cancellation là rollback của một side effect đã hoàn tất.
* Đóng file handle, process, stream và resource khác khi operation kết thúc hoặc thất bại.
* Không tạo background operation không có owner quản lý lifecycle và failure.
* Không bỏ qua Promise rejection của operation có ảnh hưởng đến state hoặc dữ liệu.

Khi operation thay đổi durable state, không được báo hoàn tất trước khi điều kiện hoàn tất mà contract yêu cầu đã được bảo đảm.

## Comments

Comment giải thích thông tin mà tên, type và cấu trúc code không thể hiện đầy đủ.

Các trường hợp phù hợp gồm:

* Security invariant hoặc trust assumption.
* Lý do một operation phải giữ thứ tự thực hiện.
* Ràng buộc của external protocol hoặc dependency.
* Lý do một implementation không thể sử dụng cách đơn giản hơn.
* Điều kiện cần giữ để bảo vệ compatibility hoặc recovery.

Không dùng comment chỉ để diễn đạt lại câu lệnh ngay bên dưới.

Khi code thay đổi làm comment không còn chính xác, cập nhật hoặc bỏ comment đó.

Quy tắc comment đầu file test thuộc [Testware](testware.md), không thuộc section này.

## Contracts, validation và data representation

### Contract ownership

Mỗi contract phải có owner rõ ràng theo [Project Structure](project-structure.md).

* Public contract chỉ công bố dữ liệu và operations mà consumer cần.
* Private implementation details không được đưa vào public contract chỉ để consumer truy cập thuận tiện.
* Không tạo interface cho mỗi class hoặc function nếu interface không bảo vệ một boundary thực tế.
* Không dùng một contract chung cho nhiều operation khi các operation có preconditions hoặc authority khác nhau.
* Khi thay đổi public contract, kiểm tra các consumer và compatibility requirements liên quan.

Contract không được cấp thêm authority cho caller chỉ vì caller có thể tạo object cùng hình dạng.

### Runtime validation

Kiểm tra dữ liệu tại boundary nơi dữ liệu không còn được bảo đảm bởi một trusted contract.

Ví dụ:

| Boundary | Nội dung cần kiểm tra |
|---|---|
| Local HTTP transport | Request shape, syntax và transport constraints |
| Application workflow | Application preconditions |
| Domain operation | Domain invariants và state transitions |
| Agent tool execution | Tool arguments và request-scoped capability |
| Filesystem access | Path, file identity và resource restrictions |
| External integration | Protocol messages và external responses |
| Browser transport | Response shape trước khi dùng trong UI |

Validation ở một boundary không thay thế validation của boundary khác khi hai boundary bảo vệ các điều kiện khác nhau.

Không dựa vào dữ liệu do model cung cấp để xác định user permission hoặc resource authority.

### Data representation

Phân biệt các representation khi chúng có trách nhiệm khác nhau.

* Wire representation mô tả dữ liệu được phép trao đổi giữa Browser và Local Host.
* Domain representation mô tả dữ liệu và invariant thuộc domain owner.
* Persistence representation mô tả cách dữ liệu được lưu.
* External protocol representation mô tả dữ liệu của integration.

Không bắt buộc tạo mapper giữa hai representation giống nhau về ý nghĩa và constraints.

Khi hai representation có khác biệt về quyền truy cập, validation hoặc compatibility, việc chuyển đổi phải được thực hiện tại boundary phù hợp.

Không đưa credentials, private storage fields hoặc internal error details vào public representation chỉ vì các fields đó có trong internal object.

### State và side effects

Component thay đổi state phải bảo vệ invariants thuộc responsibility của mình.

* Kiểm tra preconditions trước state transition.
* Không bỏ qua transaction hoặc state operation của owner để sửa dữ liệu trực tiếp.
* Không dùng in-memory state thay cho durable state khi contract yêu cầu persistence.
* Không giả định nhiều storage operations là atomic nếu chúng không thuộc cùng transaction.
* Khi operation có thể được gọi lại sau lỗi hoặc restart, xác định hành vi đối với repeated execution.
* Không công bố kết quả hoàn tất khi dữ liệu vẫn ở trạng thái chưa hoàn tất.

## Error handling và testing

### Error representation

Error phải mô tả failure theo ngữ nghĩa của component phát hiện lỗi.

* Domain error mô tả domain operation không hợp lệ hoặc thất bại.
* Integration error mô tả failure của runtime hoặc external protocol.
* Application failure mô tả operation không thể hoàn thành theo workflow policy.
* Transport error mô tả failure được biểu diễn cho caller qua transport.

Không dùng HTTP status code làm error contract nội bộ của domain hoặc agent runtime.

Không bắt buộc tạo custom error class cho mọi error code. Chọn error representation phù hợp với contract và cách caller cần xử lý.

### Error propagation

Caller phải nhận đủ thông tin để thực hiện failure policy thuộc trách nhiệm của caller.

* Không chuyển một failure có ý nghĩa thành lỗi chung nếu caller cần phân biệt failure đó.
* Không trả internal error details cho untrusted caller.
* Không để error translation thay đổi domain state.
* Không coi mọi exception là recoverable.
* Không bỏ qua error chỉ để operation tiếp tục chạy.

Khi cần chuyển đổi error, giữ nguyên ý nghĩa của failure. Không biến một operation thất bại thành kết quả thành công.

### Recovery và cancellation

Component sở hữu operation quyết định retry, rollback, cleanup hoặc terminal failure.

* Retry chỉ được thực hiện khi repeated execution phù hợp với operation semantics.
* Không retry side effect có thể tạo kết quả trùng lặp nếu chưa có cơ chế bảo vệ.
* Cancellation không tự động hoàn tác durable changes đã hoàn tất.
* Recovery phải sử dụng operation của authoritative state owner.
* Không để integration adapter tự quyết định terminal state của application request.
* Khi một operation thất bại sau khi đã tạo partial results, xử lý các kết quả đó theo lifecycle contract.

### Error reporting

Error reporting phải cung cấp thông tin cần thiết để chẩn đoán nhưng không làm lộ dữ liệu được bảo vệ.

Không ghi credentials, private user content hoặc dữ liệu nhạy cảm vào log chỉ để thuận tiện debug.

Không đưa raw external error hoặc stack trace vào public response nếu chúng có thể chứa thông tin nội bộ.

### Testability

Production code phải cho phép kiểm tra hành vi qua public operations và các boundary có thể kiểm soát.

* Không export private implementation chỉ để test truy cập.
* Không tạo abstraction chỉ để mock internal modules.
* Khi operation phụ thuộc clock, external service hoặc process, cho phép kiểm soát dependency tại boundary phù hợp nếu test cần mô phỏng hành vi.
* Không thay đổi production contract chỉ để một test phụ thuộc implementation details tiếp tục pass.

Cách viết test, fake, assertion và test environment thuộc [Testware](testware.md).

## Những điều không bắt buộc

DeckAgent không bắt buộc sử dụng các pattern sau cho mọi component:

* Class thay cho function.
* Interface cho mỗi implementation.
* Dependency injection framework.
* Controller/Service/Repository layers.
* Mapper giữa mọi representation.
* Result type cho mọi operation.
* Custom error class cho mọi failure.
* Factory cho mọi object.
* Folder riêng cho từng loại utility.
* Abstraction được tạo trước khi có consumer hoặc dependency requirement.

Sử dụng pattern khi nó bảo vệ một contract, invariant, dependency boundary hoặc giải quyết một nhu cầu triển khai cụ thể.

Không loại bỏ abstraction đang bảo vệ một boundary chỉ vì hiện tại abstraction đó có một implementation.

## References

1. <a id="ref-1"></a>[Project: DeckAgent](../../AGENTS.md)
2. <a id="ref-2"></a>[Project Structure](project-structure.md)
3. <a id="ref-3"></a>[Conventions](README.md)
