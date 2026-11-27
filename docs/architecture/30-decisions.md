# Quyết định kiến trúc

Đọc file này để biết các quyết định kiến trúc của DeckAgent, phương án đã xét, trade-off và điều kiện phải xét lại từng quyết định.

## ADR-001: Run thuộc về một owner có kiểu và ID, và mỗi owner chỉ có một run đang chạy

**Status:** Accepted

### Bối cảnh

Lifecycle contract hiện tại gắn run với chat qua trường `sessionId`. Chẩn đoán run owner [[1]](#ref-1) đếm 51 chỗ dùng `sessionId` trong vòng đời request và adapter OpenCode: 19 trường của contract, 9 chỗ kiểm rule "mỗi chat chỉ có một request đang chạy", 6 chỗ dùng chat làm khoá của bản ghi, 4 chỗ là session ID native của OpenCode và 11 chỗ chỉ truyền tiếp. Không chỗ nào đọc hay ghi state của deck bằng `sessionId`.

Rule một request đang chạy cho mỗi chat được kiểm ở hai tầng. `RequestController.submit` kiểm bốn lần: tập `admitting`, map `busy`, lần chờ tối đa 5000 ms cho execution đã dừng, và `store.activeFor`. Store khoá rule bằng unique index `requests_one_active` trên `requests(session_id)` với status `active` hoặc `waiting_approval`, trong transaction `admit`. Các chat khác nhau chạy song song. Host nhận tối đa 16 chat đang chạy cùng lúc (`HOST_BUSY`, `request-controller.ts:90`).

Contract của run không được có `sessionId` và `runs/` không được import module chats (TS-13) [[2]](#ref-2). Run đề xuất design system từ file thương hiệu có thể không thuộc chat nào (UC-010) [[3]](#ref-3). `runs/` không phụ thuộc SQL driver [[4]](#ref-4).

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| A. `runs/` áp một rule chung: mỗi owner có tối đa một run đang chạy | Rule vẫn atomic nhờ unique index trong cùng transaction admit, như hiện tại. `runs/` không cần biết chat. Owner kind mới có rule này mà không thêm code | Một owner kind cần nhiều run song song phải đổi rule chung |
| B. Module sở hữu owner kind đăng ký một admission guard | Mỗi owner kind có rule riêng | Guard phải chạy trong transaction của store của run, nên module phải biết transaction đó. 9 chỗ kiểm hiện có phải chuyển sang hook |
| C. Giữ `sessionId` và thêm trường owner tuỳ chọn | Ít đổi code nhất | Contract vẫn gắn với chat và không đạt rule run có owner tổng quát (TS-13) |

### Quyết định

- Owner của run có kiểu `RunOwner = { kind: RunOwnerKind; id: string }`. `RunOwnerKind` là union literal trong `apps/host/src/runs/ports.ts`. Hiện chỉ có member `'chat'`. Một owner kind mới thêm một member khi module của nó có code.
- Contract của run dùng `owner` thay cho `sessionId`: kế hoạch run, input của runtime, `ToolContext` và binding session native của runtime.
- `runs/` áp rule: mỗi owner có tối đa một run ở status `active` hoặc `waiting_approval`. Các guard trong bộ nhớ dùng khoá `` `${owner.kind}:${owner.id}` ``. Store của run khoá rule bằng unique index trên `(owner_kind, owner_id)` với hai status đó.
- Các owner khác nhau chạy song song. Giới hạn số owner đang chạy cùng lúc là rule chung của `runs/` và giữ code `HOST_BUSY`.
- Khi owner đã có run đang chạy, `runs/` trả code `RUN_OWNER_BUSY`. Module gửi run cho owner kind đó map code này sang code wire của nó: module chats map sang `SESSION_BUSY`.
- Kiểm tra "request đã lưu thuộc chat khác" (`GENERATION_LINK_CONFLICT`) so sánh `owner` của request đã lưu với `owner` của kế hoạch run.
- Module workspaces hỏi `runs/` owner nào đang có run, qua danh sách chat mà module chats trả về, để giữ rule `WORKSPACE_REQUEST_ACTIVE`.
- HTTP wire contract giữ trường `sessionId` và các code lỗi hiện tại. Module chats chuyển `sessionId` thành `{ kind: 'chat', id: sessionId }`.
- `runs/ports.ts` khai báo port `RunStore`. `SqliteRunStore` trong `apps/host/src/db/run-store.ts` hiện thực port này trên `sessions.sqlite` (schema v9 với unique index trên `(owner_kind, owner_id)` và bảng `runtime_bindings` dùng khoá `owner_key`).
- Thao tác admit ghi `requests`, `messages` và `attachments` atomic trong một transaction của `SessionDatabase` qua `RunStoreHooks` nối tại `apps/host/src/server.ts`, nên `db/` không import `modules/`.

### Lý do

Phương án A giữ nguyên cách khoá rule đang chạy đúng: một unique index trong cùng transaction admit. Nó cho đúng hành vi cần có: một chat chỉ có một run đang chạy, nhiều chat chạy song song. Phương án B thêm một hook mà owner kind duy nhất hiện có không cần. Phương án C không đạt rule run có owner tổng quát (TS-13).

### Rủi ro chấp nhận

- Owner kind cần nhiều run song song cho cùng một owner phải có ADR mới.
- Đổi cột `session_id` của bảng `requests` sang `owner_kind` và `owner_id` và `runtime_bindings` sang `owner_key` cần migration lên schema v9 của `sessions.sqlite`.

### Hệ quả

- Dễ hơn: thêm owner kind mới (design system) chỉ thêm một member của union, không thêm rule.
- Khó hơn: module chats map hai chiều giữa `sessionId` của wire và `owner` của run, và map `RUN_OWNER_BUSY` sang `SESSION_BUSY`.
- Xét lại khi một owner kind cần nhiều run song song, hoặc khi việc thiết lập design system (UC-010) không cần agent.

## ADR-002: Port AgentRuntime trả event, usage và lỗi có phân loại

**Status:** Accepted

### Bối cảnh

Runtime hiện tại trả `RuntimeOutcome`: `completed` với `commit` tuỳ chọn, hoặc `failed` với `errorCode` là một string tự do. Chẩn đoán port AgentRuntime [[5]](#ref-5) tìm thấy 40 code: 7 code từ event của provider, 9 code của adapter, 16 code của lifecycle, 1 notice và 7 code chưa phân loại. Outcome không có trường usage. `parseEvent` bỏ trường `tokens` của event `step_finish`. Fixture OpenCode giả có `tokens`, nhưng output thật của OpenCode 1.19.5 chưa được kiểm. Adapter có bộ đếm `modelSteps` nhưng không báo ra ngoài.

Thời gian chờ là đồng hồ của mỗi attempt trong adapter, mặc định `600_000` ms (`runtime.ts:227`). Đồng hồ dừng trong lúc chờ approval. Khi hết giờ, adapter trả `REQUEST_TIMEOUT`.

Các loại lỗi provider mà sản phẩm cần phân biệt chưa được quyết ([OQ-063](../open-questions.md#oq-063)). Code hiện tại chỉ có điều kiện cho bốn loại: key bị từ chối, giới hạn tần suất, hết thời gian chờ, và nội dung bị chặn trong bước tóm tắt. Không điều kiện nào cho hết quota hay mất mạng. Runtime thứ hai, ví dụ coding agent CLI đã có trên máy (UC-005-A18) [[6]](#ref-6), phải implement cùng port.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| A. Port trả `RunError` gồm category đóng và code, cùng usage trong kết quả và trong lúc chạy | `runs/` đọc category mà không biết code của từng runtime. Runtime thứ hai dùng cùng tập category | Adapter phải map từng điều kiện sang category |
| B. Giữ `errorCode` tự do, `runs/` map code sang category | Adapter không đổi | `runs/` phải biết code của OpenCode, ngược chiều phụ thuộc |
| C. Adapter throw một error class cho mỗi category | Quen thuộc với code TypeScript | Lỗi đi qua hai đường (kết quả và exception). Usage của run lỗi bị mất |

### Quyết định

- `AgentRuntime` có `name`, `availability()` và `run(input, sink)`. `run` trả `RunResult`.
- Event của run gồm ba loại hiện có: `activity`, `text` và `notice`. Chỉ Host ghi event `status` và `approval`.
- `sink.usage(total)` nhận usage cộng dồn trong lúc chạy. `RunResult` có usage cuối. `RunUsage` có `modelCalls` (bắt buộc) và `inputTokens`, `outputTokens` (tuỳ chọn, vì output thật của OpenCode chưa được kiểm).
- Run lỗi trả `RunError = { category, code }`. `code` giữ string hiện tại, ví dụ `PROVIDER_AUTH`, để HTTP wire không đổi. `category` là một member của union `RunErrorCategory`.
- Code của lifecycle (admission, ghi store) không phải category của runtime. Text của `ToolResult` (`TOOL_NOT_ALLOWED`, `TOOL_FAILED`) thuộc port `ToolExecutor`.
- Đồng hồ thời gian chờ ở lại trong adapter, và có category `timeout`.
- `runs/budget/` đọc usage và dừng run qua abort signal khi vượt giới hạn. Hiện chưa có giá trị giới hạn, vì giới hạn tài nguyên của một request chưa được quyết ([OQ-069](../open-questions.md#oq-069)).
- Category `provider-quota` và `provider-network` có trong union nhưng chưa có điều kiện nào tạo ra. Adapter thêm điều kiện khi có bằng chứng từ provider thật.

### Lý do

Phương án A giữ chiều phụ thuộc đúng: adapter biết OpenCode, `runs/` chỉ biết port. Usage đi cùng kết quả nên run lỗi vẫn báo mức dùng. Giữ `code` hiện tại cho phép đổi port mà không đổi HTTP wire.

### Rủi ro chấp nhận

- Hai category chưa có điều kiện tạo ra. Lỗi hết quota hiện rơi vào `provider-other`.
- Token có thể luôn thiếu cho đến khi output thật của OpenCode được kiểm.

### Hệ quả

- Dễ hơn: thêm runtime thứ hai, hiển thị mức dùng context (FR-078) [[7]](#ref-7), đặt giới hạn tài nguyên.
- Khó hơn: mỗi adapter phải giữ bảng map từ điều kiện sang category.
- Xét lại khi sản phẩm quyết các loại lỗi provider ([OQ-063](../open-questions.md#oq-063)) với một loại không có trong union, hoặc khi runtime thứ hai không báo được `modelCalls`.

## ADR-003: Module góp phần chuẩn bị run qua contribution đăng ký tại composition root

**Status:** Accepted

### Bối cảnh

Chẩn đoán chuẩn bị run [[8]](#ref-8) tìm thấy 51 chỗ dựng một phần của run: 23 chỗ trong `features/deck`, 17 chỗ trong `integrations/opencode`, 4 chỗ trong `features/sources`, 4 chỗ trong lifecycle, và 1 chỗ mỗi nơi trong `features/requests`, `features/providers` và composition root. Request lifecycle chạy `prepareTools` của source tool trước. Deck workflow sau đó lấy tool từ `run.tools`, bọc lại, và lọc source tool theo nguồn của Brief (`isSourceToolAllowed`, `sourceToolNames`). Một run deck có thể có pass recovery thứ hai (`executeRecoveryRun`). Adapter không bao giờ đọc grant của generation. Code hiện tại chưa có skill.

Hai đường vào cùng kết thúc tại `RequestController.submit`: route gửi request và route xác nhận deck. Đường xác nhận đưa vào một `PreparedRequest` đã dựng sẵn.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| A. Grant quyết trước. Contribution đăng ký tại `server.ts` và contribution của module khởi chạy cùng đọc grant, rồi trả phần của nó. `runs/preparation/` gộp theo thứ tự cố định | Một chỗ để thêm skill hoặc design system. Lọc source tool trở thành grant, không còn bọc tool | Module khởi chạy phải đưa nguồn của Brief vào grant trước khi chuẩn bị |
| B. Module khởi chạy tự dựng toàn bộ run, như hiện tại | Không đổi code | Skill và design system phải thêm vào từng module khởi chạy |
| C. Chuỗi middleware: mỗi contribution sửa phần của contribution trước | Linh hoạt | Kết quả phụ thuộc thứ tự, và việc lọc ẩn trong lớp bọc, giống vấn đề hiện tại |

### Quyết định

- Module khởi chạy run gửi một `RunPlan`: owner, input, model selection, grant, contribution riêng của run, và hook tuỳ chọn cho pass tiếp theo và text kết thúc.
- `RunGrants` có `publicResearch` và `sourceKinds`. Module khởi chạy quyết grant trước khi chuẩn bị. Deck đưa nguồn của Brief vào `sourceKinds`. Source contribution chỉ trả tool của các nguồn trong `sourceKinds`.
- `RunContribution` có `name` và `contribute(context)`. `contribute` trả `RunParts`: instruction, tool set và resource.
- `runs/preparation/` gọi contribution đăng ký tại `server.ts` theo thứ tự đăng ký, rồi contribution của `RunPlan` theo thứ tự trong plan. Instruction nối theo thứ tự đó. Tên tool trùng nhau làm chuẩn bị thất bại.
- Lịch sử hội thoại là resource `conversation`, do contribution của module chats góp. Adapter quyết dùng resource này khi không resume được session native.
- Grant riêng của deck (`GenerationGrant`, `GenerationCapability`) ở trong contribution của deck cho run đó. `runs/` không đọc chúng.
- Một run có thể có nhiều pass. Sau một pass `completed`, `runs/` gọi `RunPlan.next(result)`. Hook trả một `RunPlan` mới cho pass tiếp theo, hoặc `undefined` để kết thúc.
- Giới hạn số bước model là `RunPlan.stepLimit`. Giá trị mặc định 8 bước đến từ `config.ts:73`. Generation của deck dùng `'none'`, thay cho cách adapter tìm tên tool `publish_slide`.
- Model selection đổi thành provider settings qua port `ProviderResolver` do module providers hiện thực. Key không đi vào `RunPlan`.
- Ở lại trong adapter: cấu hình OpenCode, biến môi trường cô lập, MCP bridge, tham số dòng lệnh, việc tìm và kiểm executable, hash cho resume guard, và prompt khung khi không có tool bridge.
- Skill chưa có trong `RunParts`. Trường cho skill được thêm khi module skills có code. Format skill mà OpenCode nhận là `Open`.
- Bộ test `apps/host/tests/deck-run-plan.test.mjs` đã kiểm đủ 16 tổ hợp tương đương của `sourceKinds`. Các hàm cũ `isSourceToolAllowed`, `sourceToolNames` và `executeRecoveryRun` đã bị xoá.

### Lý do

Phương án A biến việc lọc tool đang ẩn trong lớp bọc thành dữ liệu kiểm được: grant. Contribution không sửa phần của nhau, nên thứ tự chỉ ảnh hưởng thứ tự instruction. Contribution riêng của run giữ grant riêng của deck trong module deck, nên `runs/` không import deck.

### Rủi ro chấp nhận

- Pass recovery dùng hook `next` trên `RunPlan` thay cho lời gọi `start` thứ hai bên trong deck. Thay đổi mới với luồng recovery phải giữ nguyên trạng thái đã kiểm.

### Hệ quả

- Dễ hơn: skill do hệ thống chọn và design system áp vào generation chỉ thêm một contribution.
- Khó hơn: module khởi chạy phải tính grant trước, thay vì lọc sau.
- Xét lại khi một contribution cần đọc phần của contribution khác, hoặc khi skill cần một kiểu phần mới.

## ADR-004: Mỗi aggregate người dùng thấy có một version và phát change notice sau khi commit

**Status:** Accepted

### Bối cảnh

Chẩn đoán change notice [[9]](#ref-9) chia 29 bảng thành 8 bảng có cột `version`, 10 bảng người dùng ghi, 7 bảng người dùng đọc và 4 bảng nội bộ. Chỉ deck phát notice: `deck-changed` mang `version`. Route SSE gửi notice với `version` hiện tại khi kết nối. Browser đọc lại deck khi notice mới hơn snapshot. Transaction tăng `decks.version` cũng ghi `slides`, `revisions`, `publications`, `artifact_revisions` và `generation_intents`. Ba lời gọi `notify` truyền số `1` thay cho `version` đã lưu (`deck-authoring.ts:61`, `deck-authoring.ts:267`, `deck-generation.ts:73`). Không lệnh ghi deck nào nhận `version` mong đợi. Brief và Outline kiểm `version` của chúng (`BRIEF_STALE`, `OUTLINE_STALE`). Draft trong bộ nhớ kiểm `revision` (`DRAFT_CONFLICT`) và không phát notice. Request event dùng SSE với cursor `sequence`.

Mọi đối tượng người dùng thấy phải dùng chung một cơ chế báo thay đổi và kiểm `version` khi ghi (TS-12) [[2]](#ref-2). Người dùng thấy gì khi lệnh ghi có `version` cũ là câu hỏi sản phẩm ([OQ-061](../open-questions.md#oq-061)). Câu hỏi này không chặn quyết định, vì store từ chối lệnh ghi trong mọi câu trả lời. Canvas cho người dùng tự sửa deck (UC-007) [[10]](#ref-10) là một đường ghi thứ hai vào deck.

### Phương án đã xét

| Phương án | Dễ hơn | Khó hơn |
| --- | --- | --- |
| A. Một `version` và một topic notice cho mỗi aggregate mà người dùng thấy. Bảng con tăng `version` của aggregate cha | Khớp với pattern deck hiện tại. Một màn hình theo dõi một notice | Một thay đổi nhỏ trong bảng con làm Browser đọc lại cả aggregate |
| B. Một `version` và một notice cho mỗi bảng | Notice chi tiết | Browser phải ghép nhiều notice cho một màn hình. Nhiều bảng phải đổi schema |
| C. Notice mang toàn bộ state mới | Browser không cần đọc lại | Hai nguồn dữ liệu cho cùng state. Notice trở thành event log, ngược với thiết kế hiện tại của deck |

### Quyết định

- Change notice có kiểu `ChangeNotice = { topic: ChangeTopic; key: string; version: number }` trong `packages/contracts`. Notice là tín hiệu đọc lại, không mang state.
- Aggregate, topic và khoá là: `deck`, `brief`, `outline` và `draft` theo chat. `chats`, `workspaces`, `providers` và `preferences` cho cả Host. Bảng thuộc mỗi aggregate nằm trong [Agent core](10-agent-core.md#aggregate-và-change-notice).
- Store tăng `version` trong cùng transaction với lệnh ghi. Store phát notice sau commit, với `version` đã lưu, không dùng hằng số.
- Aggregate có hàng gốc mang cột `version` dùng cột đó. Aggregate không có hàng gốc dùng một bảng `change_versions(topic, key, version)` trong database của module sở hữu.
- Lệnh ghi qua HTTP route gửi `expectedVersion`. Store từ chối lệnh ghi khi `version` đã đổi. Code hiện có giữ nguyên: `BRIEF_STALE`, `OUTLINE_STALE`, `DRAFT_CONFLICT`. Aggregate mới dùng code `<TOPIC>_STALE`, ví dụ `WORKSPACES_STALE`.
- Topic `chats` là ngoại lệ. Lệnh ghi chat không gửi `expectedVersion`, và không có code `CHATS_STALE`. Mỗi tin nhắn trong một chat cũng tăng `version` của danh sách chat. Nếu store kiểm `version`, lệnh tạo chat và lệnh đổi model bị từ chối khi không có xung đột thật. Lệnh tạo chat chỉ thêm một chat, và lệnh đổi model chỉ đổi một chat.
- Store nhận hàm `publish` qua constructor tại `server.ts`. `ChangeFeed` trong `apps/host/src/http/` chuyển notice tới Browser qua SSE. Listener nào throw thì bị xoá, như `DeckRuntime.notify` hiện tại.
- Các topic phạm vi Host (`chats`, `workspaces`, `providers`, `preferences`) stream trên `GET /api/changes`. Các topic phạm vi chat (`draft`, `brief`, `outline`, `deck`) stream trên `GET /api/sessions/:sessionId/changes`. Route SSE của deck giữ nguyên path và tên event `deck-changed`.
- Request, event, approval và các bảng mà run ghi dùng event log với cursor `sequence`, không dùng change notice.

### Lý do

Phương án A tổng quát hoá pattern đã chạy đúng cho deck, và giữ một nguồn dữ liệu: Browser luôn đọc lại state từ route đọc. Phương án B tăng số notice mà không giúp màn hình nào. Phương án C tạo nguồn dữ liệu thứ hai.

### Rủi ro chấp nhận

- Màn hình đọc lại cả aggregate sau mỗi thay đổi. Chấp nhận cho đến khi có số đo cho thấy chậm.
- Các field `hasDraft`, `activeRequestId`, `hasSlides` và `selectable` của danh sách chat lấy từ store khác. Chúng không tăng `version` của `chats`. Browser giữ cách đọc lại hiện tại cho các field này.
- Lệnh ghi của agent qua tool chưa gửi `expectedVersion`. Module deck quyết cách kiểm cho tool khi canvas có code.

### Hệ quả

- Dễ hơn: thêm một đối tượng có hai giao diện cùng sửa, và test lệnh ghi có `version` cũ cho mỗi module.
- Khó hơn: mỗi store phải nhận `publish`, và mỗi route ghi phải nhận `expectedVersion`.
- Xét lại khi một màn hình cần biết phần nào của aggregate đã đổi, hoặc khi việc đọc lại cả aggregate quá chậm.

## References

1. <a id="ref-1"></a>[Task 3: Diagnose the run owner report](../build/refactor/target-structure/reports/task-03-diagnose-run-owner.md)
2. <a id="ref-2"></a>[Tiêu chí của cấu trúc đích](../build/refactor/target-structure/criteria.md)
3. <a id="ref-3"></a>[Design system](../UCs/design-systems.md)
4. <a id="ref-4"></a>[Project Structure](../conventions/project-structure.md)
5. <a id="ref-5"></a>[Task 4: Diagnose the AgentRuntime port report](../build/refactor/target-structure/reports/task-04-diagnose-agent-runtime-port.md)
6. <a id="ref-6"></a>[Provider và model](../UCs/providers.md)
7. <a id="ref-7"></a>[Gửi request](../UCs/requests.md)
8. <a id="ref-8"></a>[Task 5: Diagnose run preparation report](../build/refactor/target-structure/reports/task-05-diagnose-run-preparation.md)
9. <a id="ref-9"></a>[Task 6: Diagnose the change notice and version report](../build/refactor/target-structure/reports/task-06-diagnose-change-notice.md)
10. <a id="ref-10"></a>[Deck](../UCs/deck.md)
