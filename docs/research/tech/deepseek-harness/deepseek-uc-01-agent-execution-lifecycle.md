# Nghiên cứu UC-01 của DeepSeek Harness - Agent nhận và hoàn thành 1 yêu cầu

## Cách nghiên cứu được đề xuất

Chia UC-01 thành bốn phần. Đường dẫn bên dưới thuộc repository DeepSeek Harness, không phải repository DeckAgent.

| Phần | Tài liệu cần đọc | Câu hỏi cần trả lời |
| --- | --- | --- |
| A — Turn và Step Lifecycle | `docs/agent-lifecycle.md`, phần Turn Flow trong `docs/architecture.md` | Turn và Step bắt đầu ở đâu, kết thúc khi nào? Một yêu cầu chạy nhiều Step ra sao? Điều kiện nào khiến Agent Loop tiếp tục gọi model? |
| B — Agent Loop Implementation | `packages/core/agent-loop`, `docs/subsystems/core.md` | Nơi nhận queued messages, nơi khởi chạy driver, nơi gọi `ctx.llm`, nơi gọi `ctx.tools`, logic quyết định tiếp tục hoặc dừng nằm ở đâu? |
| C — Dữ liệu và Events | `docs/subsystems/session.md`, `docs/subsystems/system-prompt.md` | Model request, session events, live agent events và tool results khác nhau thế nào? Dữ liệu nào được lưu, dữ liệu nào chỉ tồn tại trong quá trình thực thi? |
| D — Kết nối Web UI | `docs/subsystems/web-client.md` | Browser gửi yêu cầu tới Host và Host truyền kết quả về browser bằng cách nào? Chỉ theo đường đi của dữ liệu, chưa cần React components hay UI styling. |

Ghi nhận từ tài liệu Web Client: browser cũng chạy một ứng dụng Cordis riêng. Host sở hữu authoritative state và persistence, còn browser dùng API Gateway và Conversation để hiển thị dữ liệu. Đây là điểm đáng chú ý cho giả thuyết tái sử dụng DeepSeek Harness Web UI cho DeckAgent.

## A - Turn & Step Lifecycle

### docs/agent-lifecycle.md

Tài liệu chứa một Sequence Diagram mô tả cách Agent nhận yêu cầu, gọi Model, thực thi Tools, ghi Session Events và kết thúc Turn.

Ảnh dưới đây là bản Action-Based được rút ra từ Technical Diagram trong `docs/agent-lifecycle.md`.

![Agent Turn & Step Lifecycle - Action-Based Diagram](../images/Agent%20Turn%20&%20Step%20Lifecycle%20-%20Action-Based%20Diagram.png)

#### File này trả lời được những câu hỏi nào?

Đối chiếu với 9 câu hỏi nghiên cứu UC-01:

| ID | Câu hỏi nghiên cứu | Mức độ trả lời | Giá trị nghiên cứu đối với DeckAgent |
| --- | --- | --- | --- |
| Q1 | Ai tạo Agent instance và sở hữu lifecycle của nó? | Chưa trả lời | Xác định DeckAgent nên tạo, quản lý và hủy Agent ở đâu. Từ đó quyết định có tái sử dụng cơ chế quản lý Agent của DeepSeek hay cần xây dựng riêng. |
| Q2 | `Agent.followup()` đưa user message vào đâu? | Phần lớn | Hiểu cách Agent tiếp nhận yêu cầu khi đang thực thi. Giúp thiết kế hành vi khi người dùng gửi yêu cầu chỉnh sửa slides trong lúc Agent chưa hoàn thành công việc trước đó. |
| Q3 | Điều kiện nào làm Agent Loop bắt đầu chạy? | Phần lớn | Xác định cách khởi hoạt Agent từ các hành động của người dùng hoặc sự kiện hệ thống. Ví dụ: bắt đầu tạo presentation, tiếp tục chỉnh sửa sau, hoặc tiếp tục công việc đang chờ. |
| Q4 | System Prompt, Tool Schemas và Model History được lắp ráp thế nào? | Một phần | Xác định cách cung cấp cho Model: các Presentation Tools, yêu cầu thiết kế và trạng thái slides hiện tại. Giúp quyết định cách tổ chức Context để Model có đủ thông tin mà không phải gửi lại toàn bộ presentation mỗi lần. |
| Q5 | Model response được chuyển thành Tool Calls thế nào? | Một phần | Xác định cách Model yêu cầu thực thi các thao tác như `create_slide`, `edit_slide`, `render_slide`. Giúp đánh giá liệu Tool Pipeline hiện tại có đủ cho Presentation Generation hay cần cơ chế thực thi chuyên biệt. |
| Q6 | Tool Results được đưa vào model request tiếp theo ra sao? | Một phần | Xác định cách Model nhận kết quả tạo slides, lỗi render hoặc kết quả đánh giá chất lượng. Giúp thiết kế vòng lặp Generate → Render → Evaluate → Revise mà không cần thay Agent Loop nếu cơ chế hiện tại đáp ứng được. |
| Q7 | Agent Loop quyết định tiếp tục hoặc dừng theo điều kiện gì? | Phần lớn | Xác định liệu DeckAgent có thể bắt buộc hoàn thành các bước kiểm tra presentation trước khi kết thúc Turn. Đây là cơ sở để quyết định giữ nguyên, mở rộng bằng Hooks hay thay thế Agent Loop. |
| Q8 | Session Events và Live Agent Events khác nhau thế nào? | Rõ ràng | Xác định dữ liệu nào cần lưu để khôi phục quá trình tạo slides và dữ liệu nào chỉ phục vụ cập nhật UI. Giúp thiết kế Session History, theo dõi tiến độ và khả năng tiếp tục công việc sau gián đoạn. |
| Q9 | Browser nhận streaming output và khôi phục conversation ra sao? | Một phần | Xác định cách DeckAgent Web UI hiển thị tiến độ tạo slides, Tool Calls và kết quả theo thời gian thực. Giúp quyết định có thể tái sử dụng cơ chế giao tiếp Web UI của DeepSeek đến mức nào. |

#### Giả thuyết hình thành

> **DeckAgent sẽ cần một Agent Lifecycle chuyên biệt cho Presentation Generation. Nhưng chưa chắc phải viết lại Agent Loop của DeepSeek Harness.**
> **NOTE: File này chỉ nói về "step order" của UC-01 này, khác với Agent Loop là "cơ chế thực thi của Agent" để tạo ra được step order đó.**

Ba mức độ thay đổi Agent Lifecycle:

| Mức độ | Ví dụ với DeckAgent | Muốn xử lý khác đi có dẫn đến thay đổi của Agent Loop? |
| --- | --- | --- |
| 1. Thay đổi Workflow | Thay đổi thứ tự tạo slides: Generate → Render → Evaluate → Revise. | Không nhất thiết. Agent Loop vẫn thực thi các Model Steps và Tool Calls như cũ. Chỉ thay đổi công việc mà Agent thực hiện. |
| 2. Thay đổi quy tắc điều khiển (Control Logic) | Bắt buộc Agent kiểm tra chất lượng slides trước khi kết thúc Turn. Nếu chưa đạt, Agent phải tiếp tục chỉnh sửa. | Có, ở mức hành vi điều khiển. Có thể mở rộng bằng Hooks hoặc Workflow Service mà không sửa implementation của Agent Loop. |
| 3. Thay đổi cơ chế thực thi (Execution Mechanism) | Thay đổi cách Agent tạo Steps, lên lịch Tool Calls, thực thi song song hoặc quản lý Turn. | Có, ở mức cơ chế cốt lõi. Có thể phải sửa hoặc thay thế Agent Loop implementation. |

### docs/architecture.md

Tài liệu mô tả kiến trúc tổng thể của DeepSeek Harness, cách các thành phần được tổ chức và tương tác, cơ chế thực thi Agent Loop, quản lý Session và các điểm mở rộng (Extension Points) để bổ sung hoặc thay đổi hành vi của hệ thống.

#### Giá trị bổ sung so với agent-lifecycle.md

| ID | Câu hỏi nghiên cứu | `docs/architecture.md` bổ sung gì so với `docs/agent-lifecycle.md`? | Giá trị sử dụng cho DeckAgent |
| --- | --- | --- | --- |
| Q1 | Ai tạo Agent instance và sở hữu lifecycle của nó? | Phân biệt `core/agent` (Agent Interface, Registry) và `core/agent-loop` (Driver Implementation). Agent Loop có thể được thay thế. | Có thể kiểm tra Agent Loop hiện tại có phù hợp với cách DeckAgent cần hoạt động không. Nếu không, có thể thay Agent Loop mà không nhất thiết phải thiết kế lại Agent Interface. |
| Q2 | `Agent.followup()` đưa user message vào đâu? | Xác nhận một Inbox cung cấp công việc cho Driver. Injected Context cần một message để kích hoạt xử lý. | Có thể quyết định cách DeckAgent nhận yêu cầu mới khi đang tạo slides: đưa vào hàng đợi, chờ hoàn thành hay can thiệp vào công việc đang chạy. |
| Q3 | Điều kiện nào làm Agent Loop bắt đầu chạy? | Agent phải hoàn thành `agent/created` initialization trước khi xử lý công việc. Nếu initialization thất bại, quá trình tạo Agent được rollback. | Nếu DeckAgent cần khởi tạo Presentation Services hoặc trạng thái presentation trước khi chạy, có thể nghiên cứu gắn chúng vào giai đoạn khởi tạo Agent. |
| Q4 | System Prompt, Tool Schemas và Model History được lắp ráp thế nào? | Model History được tạo từ Session Log. System Prompt được đối chiếu với trạng thái đã lưu. `prepareCall()` xác định khả năng của Model trước khi ghi dữ liệu. | Có thể nghiên cứu cách đưa nội dung slides, trạng thái presentation và Presentation Tools vào Model Context, thay vì tự xây dựng toàn bộ cơ chế tạo Model Request. |
| Q5 | Model response được chuyển thành Tool Calls thế nào? | Bổ sung ba điểm can thiệp: `tools/pre-execute`, `tools/execute`, `tools/post-execute`. | Nếu DeckAgent cần kiểm tra tham số trước khi tạo slides hoặc kiểm tra kết quả sau khi Tool chạy, có thể thử dùng các Hooks này thay vì sửa Tool Pipeline. |
| Q6 | Tool Results được đưa vào model request tiếp theo ra sao? | Session Log được dùng để tạo Model History. Agent Loop tiếp tục khi Tools còn yêu cầu Model Request tiếp theo. | Có thể nghiên cứu cách để Model nhận kết quả tạo slides, render và đánh giá chất lượng ở Step tiếp theo, nhằm xây dựng vòng lặp Generate → Render → Evaluate → Revise. |
| Q7 | Agent Loop quyết định tiếp tục hoặc dừng theo điều kiện gì? | Làm rõ hai nguyên nhân tiếp tục Step và điểm can thiệp `agent/turn-stopping`. | Nếu DeckAgent yêu cầu bắt buộc render và kiểm tra slides trước khi kết thúc, có thể thử dùng Hooks để thực thi quy tắc đó. Nếu Hooks không đủ, cần cân nhắc thay Agent Loop. |
| Q8 | Session Events và Live Agent Events khác nhau thế nào? | Bổ sung nguyên tắc `Model-visible means logged`. Model History phải có thể tái dựng từ Session Log. | Có thể quyết định thông tin nào về presentation cần ghi vào Session để Model tiếp tục chỉnh sửa, khôi phục công việc hoặc debug mà không mất ngữ cảnh. |
| Q9 | Browser nhận streaming output và khôi phục conversation ra sao? | Xác nhận Web Session-follow Adapter nhận live `agent/assistant-stream` từ xa. | Có thể tận dụng hướng truyền streaming hiện tại để xây dựng UI hiển thị tiến độ tạo slides. Tuy nhiên, vẫn cần nghiên cứu thêm cơ chế truyền và đồng bộ Slide Preview. |

Nội dung đối chiếu dựa trên các phần Core Packages, Turn Flow, Session Log và Events của `docs/architecture.md`.

## Thay đổi hướng nghiên cứu DeepSeek Harness

DeckAgent fork DeepSeek Harness để xây dựng sản phẩm, không phải để trở thành maintainer của DeepSeek Harness. Vì vậy mục tiêu là biến DeepSeek Harness thành DeckAgent với ít thay đổi cốt lõi nhất có thể.

Vì vậy, các phần A–D ở trên vẫn giữ nguyên giá trị như bản đồ đọc code, nhưng câu hỏi nghiên cứu được viết lại. Không còn là:

> Agent Loop thực thi Turn và Step bằng thuật toán gì?

Mà là:

> Nếu muốn DeckAgent hoạt động khác DeepSeek Harness, mình phải chỉnh thành phần nào, chỉnh bằng cơ chế gì, và những thành phần nào sẽ bị ảnh hưởng?

### Bốn bước tiếp cận

| Bước | Nội dung | Trả lời câu hỏi |
| --- | --- | --- |
| Reuse | Lấy codebase DeepSeek Harness làm nền tảng, gồm `packages/` và các thành phần cần thiết để chạy ứng dụng. | Thành phần nào giữ nguyên được? |
| Remove | Xác định packages, plugins và capabilities không phục vụ DeckAgent để loại bỏ hoặc không kích hoạt. | Phần nào không cần nạp? |
| Customize | Chỉnh những thành phần liên quan đến Presentation Generation: Agent Preset, Tools, System Prompt, Web UI. | Muốn đổi hành vi thì đặt cấu hình hoặc plugin ở đâu? |
| Modify | Khi workflow mặc định không đáp ứng yêu cầu, tìm đúng chỗ cần chỉnh trong Agent Loop hoặc các extension points. | Cơ chế hiện tại không đủ ở đâu? |

Bốn bước này không phải một chuỗi chạy một lần. Reuse và Customize là vòng lặp chính; Modify chỉ mở ra khi một extension point đã được kiểm chứng là không đủ, chứ không phải lựa chọn mặc định.

Ba mức độ thay đổi ở phần "Giả thuyết hình thành" ánh xạ vào ba câu hỏi mới như sau:

| Mức độ thay đổi (phần trên) | Câu hỏi mới tương ứng |
| --- | --- |
| 1. Thay đổi Workflow | Customize — Agent Preset, Skills, System Prompt, Presentation Tools. Không chạm Agent Loop. |
| 2. Thay đổi Control Logic | Customize bằng Hooks hoặc Workflow Service; nếu Hooks không đủ thì chuyển sang Replace. |
| 3. Thay đổi Execution Mechanism | Replace — sửa hoặc thay Agent Loop implementation. |

### Bảng tra: muốn DeckAgent làm gì thì tìm ở đâu trước

| DeckAgent cần làm gì | Nơi nên tìm hiểu trước |
| --- | --- |
| Thêm khả năng tạo và chỉnh sửa slides | Presentation Tools đăng ký qua `ctx.tools` |
| Thay đổi cách Agent suy nghĩ và sử dụng Tools | Agent Preset, System Prompt, Skills |
| Bắt buộc Render → Evaluate trước khi hoàn thành | Workflow Service, `agent/turn-stopping`, Agent Loop |
| Thay đổi điều kiện tiếp tục hoặc kết thúc Turn | `packages/core/agent-loop/src/agent.ts` |
| Cho phép tạo nhiều slides song song | `packages/core/agent-loop/src/tool-calls.ts` và thiết kế Presentation Tools |
| Chỉnh cách Agent nhận yêu cầu trong lúc đang chạy | `packages/core/agent-loop/src/inbox.ts` |
| Thay giao diện chat thành giao diện tạo presentation | Web Client và Conversation subsystem |

Các vị trí trên là điểm bắt đầu nghiên cứu, không có nghĩa mỗi thay đổi đều bắt buộc phải sửa trực tiếp file tương ứng.

### Điều không nên làm: sao chép toàn bộ `packages/` rồi xóa dần

DeepSeek Harness dùng Profiles, Bundles và Cordis Configuration để lắp các plugins. Vì vậy, việc không kích hoạt một package có thể đơn giản hơn nhiều so với xóa source code của nó. Giữ source nguyên vẹn cũng làm việc lấy cập nhật từ DeepSeek Harness dễ hơn.

Cách làm được chọn:

- Ban đầu giữ nguyên upstream codebase để có một baseline chạy được.
- Tạo cấu hình và các Presentation Plugins riêng cho DeckAgent.
- Chỉ sửa implementation gốc khi các extension points không đáp ứng được.
- Loại bỏ code không sử dụng sau khi đã xác định dependencies và chạy kiểm thử.

> **Chưa chốt:** danh sách packages và plugins thực sự bị loại bỏ. Chỉ quyết định sau khi có baseline chạy được, bản đồ dependencies và kết quả kiểm thử.

### Ba câu hỏi nghiên cứu mới

| ID | Câu hỏi | Sản phẩm cần có để coi là đã trả lời |
| --- | --- | --- |
| R1 — Reuse | Thành phần nào của DeepSeek Harness có thể giữ nguyên cho DeckAgent? | Danh sách giữ nguyên kèm lý do, tách theo từng nhóm: khung Cordis, Agent Loop, Session và persistence, Web Client, LLM adapter. |
| R2 — Customize | Muốn thay đổi một hành vi cụ thể, cần chỉnh ở đâu và dùng cơ chế nào? | Với từng hành vi mong muốn: thành phần hoặc extension point, cơ chế dùng (config, preset, tool, event hook, workflow service) và ảnh hưởng của nó. |
| R3 — Replace | Khi nào cơ chế hiện tại không đủ, buộc phải thay implementation? | Điều kiện "đủ" và "không đủ" của từng extension point, kèm phạm vi ảnh hưởng nếu phải thay. |

Chín câu hỏi Q1–Q9 ở trên không bị bỏ. Chúng trở thành dữ kiện đầu vào cho ba câu hỏi mới:

| Câu hỏi cũ | Phục vụ câu hỏi mới nào |
| --- | --- |
| Q1 — Ai tạo và sở hữu Agent lifecycle | R1 (giữ cơ chế quản lý Agent) và R3 (nếu DeckAgent cần lifecycle riêng) |
| Q2 — `Agent.followup()` đưa message vào đâu | R2 (nhận yêu cầu chỉnh sửa khi Agent đang chạy) |
| Q3 — Điều kiện khởi chạy Agent Loop | R2 (khởi tạo Presentation Services trong giai đoạn khởi tạo Agent) |
| Q4 — Lắp ráp System Prompt, Tool Schemas, Model History | R2 (đưa nội dung slides và trạng thái presentation vào model request) |
| Q5 — Model response thành Tool Calls | R2 (đăng ký Presentation Tools qua `ctx.tools`) |
| Q6 — Tool Results vào request tiếp theo | R2 (vòng lặp Generate → Render → Evaluate → Revise) |
| Q7 — Điều kiện tiếp tục hoặc dừng | R2 qua `agent/turn-stopping`; R3 nếu Hooks không đủ |
| Q8 — Session Events và Live Agent Events | R1 (dữ liệu nào cần lưu, dữ liệu nào chỉ phục vụ UI) |
| Q9 — Browser nhận streaming và khôi phục conversation | R1 (tái dùng Web Client) và R2 (bổ sung Slide Preview) |

### Phạm vi đủ cho `packages/core/agent-loop`

Với riêng `packages/core/agent-loop`, chỉ cần đọc đủ để phân loại ba nhóm hành vi:

- Hành vi cấu hình được: những gì điều chỉnh bằng config, preset hoặc `cordis.yml` mà không sửa code.
- Hành vi mở rộng được bằng Hooks: ví dụ `tools/pre-execute`, `tools/execute`, `tools/post-execute`, `tools/result`, `agent/turn-stopping`.
- Hành vi nằm cố định trong Driver: thứ tự Step, cách lên lịch Tool Calls, điều kiện dừng của Agent Loop.

Chưa cần hiểu sâu request freezing, KV Cache hay Session Migration, trừ khi chúng ảnh hưởng trực tiếp đến cách xây dựng DeckAgent.

### Điều kiện hoàn thành nghiên cứu UC-01 theo hướng mới

Với mỗi hành vi DeckAgent cần khác DeepSeek Harness, tài liệu phải nói được bốn điều: thành phần chịu trách nhiệm; cơ chế thay đổi (config, preset, tool, hook hay sửa core); mức thay đổi (workflow, control logic hay execution mechanism); và những thành phần bị ảnh hưởng.

Viết lại được thuật toán của Agent Loop không phải điều kiện hoàn thành. Điều kiện hoàn thành là biết chỗ can thiệp đúng và chi phí của lần can thiệp đó.

