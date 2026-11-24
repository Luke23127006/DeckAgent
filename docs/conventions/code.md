# Coding Guidelines

Đọc file này để biết cách viết code production trong DeckAgent: naming, TypeScript, comment, validation, state và error handling.

Vị trí đặt code, public API và dependency được phép nằm trong [Project Structure](project-structure.md). Cách viết test nằm trong [Testware](testware.md). Khi framework hoặc tool đang dùng đã có convention, áp dụng convention đó. File này chỉ quy định phần framework không quy định.

Mỗi quy tắc ghi công cụ chặn nó trong ngoặc. Không ghi một quy tắc là đã chặn bằng máy khi check đó chưa có trong repo.

## Naming

- Function mang tên operation hoặc kết quả mà caller nhận. Operation có side effect quan trọng mang tên cho caller thấy side effect đó, ví dụ `publishDeck`, không phải `processDeck` *(review)*.
- Type và interface mang tên contract hoặc khái niệm mà chúng biểu diễn *(review)*.
- Boolean mang tên một điều kiện đúng hoặc sai, ví dụ `isPublished` *(review)*.
- Một khái niệm có một tên trong mọi module. Không đổi tên chỉ để tránh lặp từ *(review)*.
- Không dùng `data`, `manager`, `handler`, `service` khi tên đó không phân biệt được trách nhiệm. Hậu tố `Controller`, `Service`, `Repository` chỉ dùng khi hậu tố mô tả đúng vai trò *(review)*.

## TypeScript

- Khi state có tập giá trị xác định, dùng union hoặc discriminated union. Khi mỗi state có dữ liệu riêng, type gắn dữ liệu với state tương ứng *(review)*.
- Không tạo type phức tạp khi chỉ runtime validation xác định được dữ liệu hợp lệ *(review)*.
- Invariant mà type bảo vệ được thì đặt vào type, không đặt vào comment *(review)*.
- Không dùng `any` *(lint: oxlint `typescript/no-explicit-any`)*, type assertion hoặc non-null assertion *(review)* để bỏ qua một lỗi type. Khi operation cần một giá trị, kiểm precondition hoặc sửa contract để bảo đảm giá trị đó *(review)*.
- Phân biệt "không tồn tại", "chưa cung cấp" và `null` khi ba trường hợp có nghĩa khác nhau. Không thêm optional field chỉ để một object dùng chung cho nhiều operation không liên quan *(review)*.

TypeScript không thay runtime validation. Dữ liệu từ HTTP, file, database, model hoặc external service phải được kiểm tại boundary (xem [Validation](#validation)) *(review)*.

## Comments

Comment chỉ ghi điều mà tên, type và cấu trúc code không thể hiện được *(review)*:

- Security invariant hoặc trust assumption.
- Lý do một operation phải giữ thứ tự.
- Ràng buộc của external protocol hoặc dependency.
- Lý do code không dùng được cách đơn giản hơn.
- Điều kiện phải giữ để bảo vệ compatibility hoặc recovery.

Không viết comment lặp lại câu lệnh bên dưới. Khi sửa code làm comment sai, sửa hoặc xoá comment đó *(review)*. Comment đầu file test thuộc [Testware](testware.md).

## Contracts và data

### Contract

- Public contract chỉ chứa dữ liệu và operation mà consumer cần. Không đưa private detail vào contract để consumer tiện truy cập *(review)*.
- Không tạo interface cho mỗi class hoặc function khi interface không bảo vệ một boundary thực *(review)*.
- Hai operation có precondition hoặc authority khác nhau dùng hai contract khác nhau *(review)*.
- Contract không cấp authority cho caller chỉ vì caller tạo được object cùng hình dạng *(review)*.
- Khi sửa public contract, kiểm mọi consumer của contract đó *(typecheck, review)*. Typecheck chỉ thấy consumer nằm trong `tsc -b`.

### Validation

Kiểm dữ liệu tại boundary nơi dữ liệu không còn được một trusted contract bảo đảm. Mỗi boundary kiểm điều kiện riêng, nên validation ở boundary này không thay validation ở boundary khác *(review)*.

| Boundary | Kiểm |
| --- | --- |
| Local HTTP transport | Shape, syntax, transport constraint của request |
| Application workflow | Application precondition |
| Domain operation | Domain invariant, state transition |
| Agent tool execution | Tool argument, capability của request |
| Filesystem access | Path, file identity, resource restriction |
| External integration | Protocol message, external response |
| Browser transport | Shape của response trước khi UI dùng |

Không dùng dữ liệu do model trả về để xác định user permission hoặc resource authority *(review)*.

### Representation

Wire, domain, persistence và external protocol là bốn representation có thể khác nhau. Chỉ tạo mapper khi hai representation khác nhau về quyền truy cập, validation hoặc compatibility. Khi đó, chuyển đổi tại boundary giữa chúng *(review)*.

Không đưa credential, private storage field hoặc internal error detail vào public representation *(review)*.

## State, async và side effect

- Component thay đổi state kiểm precondition trước transition. Không component nào sửa dữ liệu trực tiếp mà bỏ qua transaction hoặc operation của owner. Owner của từng state nằm trong [Project Structure](project-structure.md#authority) *(review)*.
- Không thay durable state bằng in-memory state khi contract yêu cầu persistence. Không coi nhiều storage operation là atomic khi chúng không cùng một transaction *(review)*.
- Không báo hoàn tất trước khi điều kiện hoàn tất của contract đã đạt, kể cả khi dữ liệu đã ghi một phần *(review)*.
- Khi operation có thể chạy lại sau lỗi hoặc restart, định nghĩa kết quả của lần chạy lặp *(review)*.
- Truyền cancellation signal tới mọi operation phải dừng được. Kiểm cancellation trước side effect mà việc dừng phải ngăn. Cancellation không rollback side effect đã xong *(review)*.
- Mỗi operation đóng file handle, process và stream của nó khi kết thúc hoặc thất bại. Mỗi background operation có một owner quản lý lifecycle và failure. Không bỏ qua Promise rejection của operation có ảnh hưởng tới state *(review)*.
- Khi test cần mô phỏng clock, process hoặc external service, operation nhận dependency đó qua boundary. Cách test dùng fake nằm trong [Testware](testware.md) *(review)*.
- Không sửa production contract chỉ để một test phụ thuộc implementation detail tiếp tục pass *(review)*.

## Error handling

### Biểu diễn

Error mô tả failure theo ngữ nghĩa của component phát hiện lỗi:

| Component | Error mô tả |
| --- | --- |
| Domain | Domain operation không hợp lệ hoặc thất bại |
| Integration | Failure của runtime hoặc external protocol |
| Application workflow | Operation không hoàn thành theo workflow policy |
| Local Transport | Failure trả cho caller qua transport, dưới dạng wire error payload |
| Browser | Thông báo lỗi hiển thị cho người dùng |

Không dùng HTTP status làm error contract của domain, Request Lifecycle hoặc agent runtime *(review)*. Chọn error representation theo cách caller cần xử lý lỗi. Không bắt buộc custom error class cho mọi error code. Không tạo một Error Service chung sở hữu mọi lỗi *(review)*.

### Chuyển lỗi và recovery

- Caller nhận đủ thông tin để thực hiện failure policy của mình. Không gộp một failure mà caller cần phân biệt vào một lỗi chung *(review)*.
- Khi chuyển đổi error, giữ nghĩa của failure. Error translation không thay đổi domain state. Không biến operation thất bại thành kết quả thành công *(review)*.
- Không bỏ qua error để operation chạy tiếp. Không coi mọi exception là recoverable *(review)*.
- Component sở hữu operation quyết định retry, rollback, cleanup hoặc terminal failure. Integration adapter không quyết định terminal status của request ([Project Structure](project-structure.md#authority)) *(review)*.
- Chỉ retry khi chạy lặp đúng với ngữ nghĩa của operation. Không retry side effect có thể tạo bản trùng khi chưa có cơ chế chống trùng *(review)*.
- Recovery dùng operation của authoritative owner. Sau failure, owner của partial result quyết định giữ, đánh dấu hay xoá result đó *(review)*.

### Log và response

- Log ghi đủ thông tin để chẩn đoán lỗi. Log không ghi credential, nội dung riêng của người dùng hoặc dữ liệu nhạy cảm *(review)*.
- Không trả raw external error, stack trace hoặc internal detail cho untrusted caller *(review)*.

## Pattern không bắt buộc

DeckAgent không bắt buộc class thay function, interface cho mỗi implementation, DI framework, layer Controller/Service/Repository, mapper giữa mọi representation, Result type cho mọi operation, factory cho mọi object, hoặc folder riêng cho từng loại utility. Dùng một pattern khi pattern đó bảo vệ một contract, invariant hoặc dependency boundary, hoặc giải quyết một nhu cầu triển khai cụ thể. Không tạo abstraction trước khi có consumer. Không tạo abstraction chỉ để mock internal module. Không bỏ một abstraction đang bảo vệ boundary chỉ vì abstraction đó mới có một implementation *(review)*. Quy tắc về layer và folder nằm trong [Project Structure](project-structure.md#khi-nào-tạo-folder-hoặc-package).
