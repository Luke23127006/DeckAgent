# DeckAgent — Định hướng xây dựng lại

## 1. Tóm tắt

DeckAgent sẽ được xây dựng lại trên **OpenCode Agent Runtime**, thay vì tiếp tục phát triển hoặc duy trì Agent Runtime tự xây dựng dựa trên Cordis.

`docs/spec/` trong branch `clean-main` là **nguồn chuẩn cho hành vi sản phẩm cần đạt được**. UI hiện có trong `clean-main` là **thiết kế và trải nghiệm cần bảo tồn**. Source code cũ chỉ được tái sử dụng khi thực sự phù hợp với kiến trúc mới.

Đây là việc **xây dựng lại nền tảng kỹ thuật, không phải thiết kế lại sản phẩm**. DeckAgent không nên tự phát triển những khả năng runtime mà OpenCode đã cung cấp. Đồng thời, DeckAgent vẫn chịu trách nhiệm cho các quy tắc và hành vi riêng của sản phẩm.

## 2. Vai trò của các nguồn code

| Nguồn | Vai trò |
| --- | --- |
| [ `clean-main` ](https://github.com/Luke23127006/DeckAgent/tree/clean-main) — `docs/spec/` | Source of truth cho các hành vi sản phẩm mục tiêu. |
| `clean-main` — UI | Nguồn chuẩn về giao diện và trải nghiệm người dùng; cần bảo tồn. |
| `clean-main` — Backend/Cordis | Legacy implementation để kiểm tra, không mặc định được giữ trong kiến trúc mới. |
| [ `feat/v2-opencode` ](https://github.com/Luke23127006/DeckAgent/tree/feat/v2-opencode) | Bản thử nghiệm tích hợp OpenCode. Chỉ tham khảo có chọn lọc; không lấy cả branch làm nền tảng mới. |
| [OpenCode](https://github.com/anomalyco/opencode) | Agent Runtime dự kiến sử dụng; không tự xây lại Agent Loop. |
| [ `nexu-io/open-design` ](https://github.com/nexu-io/open-design) | Sản phẩm tham khảo cách tích hợp Agent Runtime và phát triển các chức năng riêng. Không mặc định sao chép kiến trúc. |

`clean-main` là baseline của việc xây dựng lại. Source code mới hơn ở branch khác không tự động thay thế spec hoặc UI đã chọn.

## 3. Vấn đề của hướng triển khai trước

`feat/v2-opencode` bổ sung OpenCode CLI Adapter nhưng vẫn giữ nhiều thành phần của runtime cũ. Cách làm đó có giá trị để thử nghiệm tích hợp, nhưng **không phải nền tảng cuối cùng mong muốn**.

Nếu tiếp tục phát triển từ cấu trúc đó, DeckAgent có nguy cơ duy trì song song hai đường chạy runtime và giữ những dependencies không còn cần thiết. Trách nhiệm giữa OpenCode và DeckAgent cũng dễ bị chồng chéo.

Mục tiêu mới **không phải gắn OpenCode vào custom Agent Runtime hiện tại**, mà là thiết kế implementation xoay quanh OpenCode và loại bỏ phần Agent Loop/Cordis cũ.

Tuy nhiên, **xóa custom Agent Runtime không có nghĩa là xóa toàn bộ Backend**. Những chức năng thuộc về DeckAgent vẫn cần được xây dựng hoặc tái sử dụng.

## 4. Ranh giới trách nhiệm mong muốn

### OpenCode chịu trách nhiệm

* Agent Loop và việc điều phối các bước gọi model/tool trong phạm vi OpenCode hỗ trợ.
* Các khả năng runtime có sẵn mà DeckAgent có thể sử dụng một cách phù hợp.
* Những cơ chế session, context và execution chỉ sau khi đã xác minh được hành vi thực tế và chi phí tích hợp.

Chưa chốt cách kết nối: CLI, SDK, server API hay một giao diện chính thức khác. Cần nghiên cứu trước khi quyết định.

### DeckAgent chịu trách nhiệm

* Product behaviors trong `docs/spec/`.
* Workspace, Chat và các chức năng riêng của sản phẩm.
* User confirmation, permissions và business rules cần được kiểm soát ở application, không chỉ bằng prompt.
* Quản lý Outline, Deck, Slides, revisions, validation và dữ liệu theo yêu cầu của spec.
* UI và việc kết nối UI với các application services.

Đây là **phân chia trách nhiệm ở mức định hướng**, chưa phải kiến trúc hay folder structure đã chốt.

## 5. Bảo tồn UI, không bảo tồn sự phụ thuộc vào runtime cũ

UI trong `clean-main` là thành quả cần giữ. Tuy nhiên, giữ UI không có nghĩa là bắt buộc giữ tất cả frontend code.

| Phần | Định hướng |
| --- | --- |
| Visual design và user interactions | Giữ làm baseline, đồng thời đối chiếu với spec mới. |
| UI components, styles, layouts, animations | Ưu tiên tái sử dụng nếu không phụ thuộc vào kiến trúc cũ. |
| Frontend state, API integration, code phụ thuộc Host/runtime cũ | Điều chỉnh hoặc xây lại khi cần. |

Trước khi xóa hoặc thay code, cần **chốt commit `clean-main` làm mốc tham chiếu bất biến**. Có thể bổ sung screenshots, mô tả màn hình và các interaction flows quan trọng để so sánh với UI mới. Git giữ source code; các tài liệu tham chiếu giúp sử dụng lại dễ hơn.

Không mặc định viết lại UI từ đầu chỉ vì thay runtime.

## 6. Cách quyết định tái sử dụng code

Phân loại từng thành phần theo trách nhiệm và sự phụ thuộc, không kết luận chỉ dựa vào tên thư mục.

| Phân loại | Ý nghĩa |
| --- | --- |
| **Keep** | Đang hoạt động tốt, phù hợp spec mới, không mang dependency không mong muốn. |
| **Adapt** | Có giá trị tái sử dụng, nhưng cần đổi contract hoặc cách kết nối. |
| **Rebuild** | Thiết kế cũ xung đột với kiến trúc mới, hoặc viết lại rõ ràng và ít tốn kém hơn. |
| **Remove** | Trùng với khả năng của OpenCode, không còn được yêu cầu, hoặc thuộc runtime cũ cần loại bỏ. |

Áp dụng cùng cách đánh giá với code trong `feat/v2-opencode` . Một POC chạy được là **bằng chứng kỹ thuật**, không đồng nghĩa toàn bộ code POC nên đưa vào sản phẩm.

Đặc biệt, không được tự động xóa hết tools, domain logic hoặc shared contracts chỉ vì chúng đang nằm trong package có tên `agent-runtime` . Cần tách những phần có giá trị khỏi phần Agent Loop và Cordis đã lỗi thời.

## 7. Trình tự công việc đề xuất

1. **Establish Baseline:** Chốt commit `clean-main`, xác định các spec mục tiêu và lưu trạng thái UI để tham chiếu.
2. **Architecture Research:** Nghiên cứu các khả năng của OpenCode, cách kết nối phù hợp và cách OpenDesign tổ chức phần application riêng.
3. **Code Inventory:** Lần theo dependencies rồi phân loại code hiện tại thành Keep, Adapt, Rebuild hoặc Remove.
4. **New Architecture:** Thiết kế ranh giới trách nhiệm, contracts, quản lý dữ liệu, permissions, execution lifecycle và cách kết nối UI. Xác định cách loại bỏ runtime cũ.
5. **Implementation & Testing Plan:** Chia việc theo hành vi sản phẩm và các phần có thể kiểm tra độc lập. Test dựa trên `docs/spec/`, không chỉ dựa trên behavior cũ.
6. **Build & Integration:** Xây nền tảng và các chức năng theo từng phần, kết nối UI được bảo tồn, kiểm tra hành vi và loại bỏ code không còn cần thiết.

Đây là trình tự định hướng, **chưa phải implementation plan chi tiết** và chưa xác định sẵn package structure.

## 8. Nguyên tắc và những việc không hướng tới

**Nguyên tắc**

* Spec mới quyết định behavior cần đạt; legacy code không quyết định product goal.
* Tái sử dụng OpenCode Runtime thay vì xây thêm Agent Loop.
* Các business rules đặc thù của DeckAgent vẫn do DeckAgent kiểm soát.
* Bảo vệ công sức xây UI, nhưng không giữ coupling không cần thiết.
* Đánh giá reuse theo giá trị, dependencies và bằng chứng; không giữ code chỉ vì code đã tồn tại.
* Dùng testing và các luồng chạy thực tế để xác nhận behavior.

**Không phải mục tiêu**

* Duy trì Cordis/custom runtime và OpenCode như hai runtime production lâu dài.
* Copy toàn bộ `feat/v2-opencode` sang implementation mới.
* Fork hoặc viết lại OpenCode khi chưa chứng minh được nhu cầu.
* Thiết kế lại UI chỉ vì thay runtime.
* Xem POC thành công hoặc test legacy PASS là bằng chứng đáp ứng spec mới.

## 9. Những quyết định chưa chốt

* Sử dụng giao diện tích hợp OpenCode nào?
* Phần session, context, tools và permissions nào sẽ dùng cơ chế sẵn có của OpenCode, phần nào DeckAgent cần sở hữu?
* Module nào của backend và UI hiện tại có thể tái sử dụng mà không kéo theo Cordis?
* Cách bảo toàn dữ liệu cũ và trải nghiệm UI trong quá trình xây lại?
* Các mốc implementation/test nhỏ nhất để đạt hành vi trong `docs/spec/` là gì?

Các câu hỏi này cần được giải quyết bằng nghiên cứu và kiểm tra code thực tế trước khi chốt kiến trúc chi tiết.

## 10. Kết quả mong muốn

Một DeckAgent mới đáp ứng đồng thời các điều kiện:

1. Thực hiện đúng product behaviors trong `clean-main/docs/spec/`.
2. Sử dụng OpenCode làm Agent Runtime, không còn Cordis/custom Agent Loop trong đường chạy production.
3. Giữ được thiết kế UI và trải nghiệm chủ đích từ `clean-main`.
4. Chỉ tái sử dụng code cũ khi điều đó giúp hệ thống đơn giản hơn và dễ kiểm tra hơn.

---

**Phạm vi tài liệu:** File này ghi lại *định hướng xây dựng lại DeckAgent*. Đây chưa phải Architecture Decision Record, bản thiết kế kiến trúc cuối cùng hay implementation plan.
