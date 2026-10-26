# DeckAgent × DeepSeek Harness — Research and V1 Opportunity Plan

**Status:** Proposed — research plan, not an Architecture Decision  
**Target location in DeckAgent:** `docs/research/deepseek-harness/deckagent-v1-deepseek-harness-research-plan.md`  
**Research repositories:**
- DeckAgent: https://github.com/Luke23127006/DeckAgent
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness

## 1. Mục tiêu

Nghiên cứu **từ yêu cầu V1 của DeckAgent sang DeepSeek Harness**, đồng thời **từ khả năng sẵn có của DeepSeek quay lại xem xét các flows ngoài V1**. Không đọc tuần tự toàn bộ repository DeepSeek. Kết quả phải trả lời được:

1. DeckAgent V1 thực sự cần những khả năng kỹ thuật nào?
2. DeepSeek Harness đã có những khả năng nào? Chúng nằm ở package, plugin, service, tool, hook hoặc giao diện nào?
3. Với từng khả năng, DeckAgent nên **Reuse / Configure / Extend / Replace / Build / Exclude** phần nào?
4. Cần đọc code hoặc chạy PoC nào để kiểm chứng các giả thuyết còn thiếu bằng chứng?
5. DeepSeek đã có capability nào giúp triển khai sớm một flow ngoài V1, hoặc gợi ý một flow mang lại UX tốt hơn?
6. Nếu đề xuất thêm hoặc sửa flow V1, những hành vi, dependencies và UX nào có thể bị ảnh hưởng hoặc đi lùi?
7. Nên nghiên cứu và build theo thứ tự nào để có một V1 chạy được sớm, mà không tự khóa kiến trúc phát triển về sau?

**Không đặt mục tiêu hiểu hết codebase DeepSeek Harness.** Chỉ đi sâu vào implementation khi nó ảnh hưởng đến một quyết định cụ thể cho DeckAgent.

## 2. Phạm vi và nguyên tắc

- **V1 là baseline đã chốt để kiểm tra độ phủ, không phải bộ lọc loại bỏ mọi ý tưởng ngoài V1.** Chất lượng slides vẫn là tiêu chí dài hạn.
- **Nghiên cứu hai chiều:** (A) V1 cần gì → DeepSeek có gì; (B) DeepSeek có gì → DeckAgent có flow nào ngoài V1 đáng đưa vào sớm hoặc đáng thiết kế lại để UX tốt hơn.
- Quét các flows ngoài V1 ở mức đủ để phát hiện cơ hội; chỉ đào sâu khi có bằng chứng về giá trị người dùng, chi phí triển khai thấp hoặc cải thiện UX rõ ràng.
- Không mặc định capability có sẵn đồng nghĩa với flow phù hợp: cần xét tương tác người dùng, lỗi, bảo mật, chi phí duy trì và mức độ phức tạp của V1.
- Không chọn Architecture baseline chỉ vì một package đã có sẵn. Mỗi lựa chọn phải gắn với yêu cầu, bằng chứng và trade-off.
- Ban đầu giả định **fork hoặc tái sử dụng DeepSeek Harness làm nền**, nhưng chưa mặc định phải sao chép toàn bộ `packages/`, xóa package hoặc sửa `agent-loop`.
- Ưu tiên cấu hình và extension points trước; chỉ đề xuất sửa implementation khi đã xác nhận chúng không đủ.
- **Không tự ý đổi V1 Scope.** Có thể chủ động đề xuất thêm, thay hoặc điều chỉnh flows; chỉ cập nhật `versions.V1`, FR/NFR/BR và các tài liệu liên quan sau khi chủ dự án phê duyệt.
- Đề xuất cải thiện UX có thể thay thế một flow V1 hiện tại, không chỉ thêm flow. Bắt buộc phân tích regression trước khi đề xuất.
- Chưa sửa code, xóa package, tạo ADR chính thức hay quyết định stack trong giai đoạn mapping.
- Phân biệt rõ **điều tài liệu xác nhận**, **suy luận kỹ thuật**, và **giả thuyết cần PoC**.

## 3. Nguồn sự thật và cách chốt phạm vi V1

### 3.1. DeckAgent

Đọc theo thứ tự:

1. [`docs/versions/v1/SCOPE.md`](https://github.com/Luke23127006/DeckAgent/blob/main/docs/versions/v1/SCOPE.md): mục tiêu, success criteria, các chọn lựa sản phẩm và flow V1 nhận của V1.
2. [`docs/spec/03-use-cases/_CRITERIA.md`](https://github.com/Luke23127006/DeckAgent/blob/main/docs/spec/03-use-cases/_CRITERIA.md): quy tắc viết use case và quy tắc của file scope version.
3. Từng file `docs/spec/03-use-cases/UC-xxx.md`: đọc Main Flow (`MF`), Alternative Flows (`Ax`) mà scope V1 nhận, `includes` và preconditions. **Đồng thời lập danh sách flows không thuộc V1** để dùng cho nhánh Opportunity Discovery.
4. Các FR, NFR và Business Rules **được những flow V1 trích dẫn**, cùng NFR cấp phiên bản trong `docs/versions/v1/SCOPE.md`.
5. `docs/spec/_STYLE.md` và Product Vision khi cần giải nghĩa thuật ngữ; không dùng Vision để tự thêm scope V1.

**Quy tắc bắt buộc:** spec trong `docs/spec/` không chọn flow. Chỉ file scope của version trong `docs/versions/<version>/` mới chọn flow. Không coi mọi `Ax` trong một UC là V1. Khi một UC `includes` UC khác, kiểm tra dependency và flow được chọn của UC đó theo `_CRITERIA.md`.

**Danh sách UC có flow trong V1:** `UC-001`, `UC-002`, `UC-003`, `UC-005`, `UC-006`, `UC-012`. Các UC còn lại trong `UC-001` đến `UC-012` chưa có flow nào thuộc một version. Phải xác minh lại trên commit được chốt trước khi phân tích chi tiết.

### 3.2. DeepSeek Harness

Bắt đầu bằng kiến trúc và public contracts, sau đó mới đọc source code liên quan:

- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md): profiles, bundles, ownership, capability seams, extension points.
- [`docs/agent-lifecycle.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/agent-lifecycle.md): trình tự Turn/Step.
- `docs/subsystems/`: agent/core, tools, session, system-prompt, web-client, conversation, LLM và các subsystem liên quan.
- `packages/core/agent-loop/README.md`, `packages/core/tools/`, `packages/core/session/`, `packages/preset/`, Web packages, model adapters và các package thực sự cần cho mapping.
- Tests và Architecture Decision Notes khi cần xác nhận behavior, edge cases hoặc trade-offs.

**Lưu ý thuật ngữ:** package `agent-tool-presentation` trong DeepSeek nói về **cách trình bày tool schemas cho model** (`native`/`ptc`), không phải engine tạo slide. Không suy luận chức năng từ tên package.

### 3.3. Khóa phiên bản để truy vết

Ở đầu mỗi research output, ghi repository, branch, **commit SHA**, ngày truy cập và đường dẫn file. Snapshot tham khảo lúc lập kế hoạch:

- DeckAgent `main`: `796a039529392d0a83602423ef0df522b523c547`
- DeepSeek Harness `master`: `687f282e8625c6b8d11ff58211a90524be2e4317`

Nếu sử dụng commit mới hơn, ghi rõ và không trộn bằng chứng từ các phiên bản khác nhau mà không chú thích.

## 4. Quy trình nghiên cứu

### Phase 0 — Establish scope and evidence baseline

**Việc làm**
- Chốt hai commit SHA.
- Tính đúng tập flow V1 từ `versions.V1`; xác định các `includes` và dependencies.
- Liên kết mỗi flow đến FR/NFR/BR liên quan.
- Lập bảng `Scope Trace`: `UC / Flow / User-visible behavior / Requirement IDs / Source link`.

**Outcomes:** (1) Danh sách hành vi V1 có dẫn chứng; (2) **Non-V1 Flow Index** ghi những flows chưa được chọn và lý do/chưa rõ lý do. Hai danh sách phải tách biệt.

**Điều kiện hoàn thành:** Mọi hành vi V1 dùng để mapping truy ngược được về flow V1 hoặc ràng buộc cấp phiên bản. Các flow ngoài V1 có ID và trạng thái scope rõ ràng, chưa bị coi là cam kết.

### Phase 1 — Translate V1 behavior into technical capabilities

**Việc làm**
- Gom các hành vi V1 thành **technical capabilities**; một capability có thể phục vụ nhiều flows.
- Với mỗi capability, mô tả input, output, trạng thái cần lưu, tương tác với model, tương tác UI và các trường hợp lỗi.
- Tách **yêu cầu đã chốt** khỏi **phương án triển khai đề xuất**.

**Các capability candidates cần kiểm tra, không coi là danh sách đầy đủ:**

| Candidate | Câu hỏi cần làm rõ |
|---|---|
| Conversation-to-deck execution | Agent tạo draft từ input và nhận phản hồi sửa deck ra sao? |
| Clarification and approval | Khi nào agent cần hỏi lại, chờ người dùng xác nhận outline hoặc bổ sung thông tin? |
| Deck artifact state and editing | Một chat gắn với một deck; cập nhật từng phần mà không sửa ngoài phạm vi bằng cách nào? |
| Slide rendering and preview | Deck được tạo, render và đồng bộ với canvas ra sao? |
| Model/provider selection | Model được chọn theo chat; custom model API và credentials đi qua lớp nào? |
| Persistence and recovery | Lưu chat/deck sau restart; phân biệt reload browser với restart ứng dụng thế nào? |
| Attachments and image generation | Đưa tài liệu và ảnh vào workflow; xử lý ảnh không tạo được thế nào? |
| Local Web runtime | Host, Web UI và background execution giao tiếp thế nào trên Windows? |

**Outcomes:** `V1 Technical Capability Inventory` và danh sách **Candidate Capabilities** chưa thuộc V1 nhưng có thể mang lại giá trị.

**Điều kiện hoàn thành:** Mỗi capability trong baseline có nguồn V1; các candidate ngoài V1 được đánh dấu riêng và có giả thuyết giá trị người dùng, không tự động được xem là yêu cầu.

### Phase 2 — Map capabilities to DeepSeek Harness

Với từng capability, tìm theo thứ tự:

1. Public contract / subsystem documentation.
2. Package ownership và cấu hình mount (Profile, Bundle, Preset).
3. Plugin / Service / Tool / Hook / Session Event / Web integration tương ứng.
4. Tests và source code tại đúng điểm mở rộng hoặc giới hạn cần xác minh.
5. Nếu không tìm thấy: ghi **Not found in reviewed sources**, không vội khẳng định DeepSeek không có.

**Outcome:** `V1 → DeepSeek Capability Matrix`, cùng nhánh **DeepSeek → DeckAgent Opportunity Scan** (xem Phase 2B).

Mỗi hàng của matrix phải có:

| Trường | Nội dung |
|---|---|
| V1 evidence | UC/Flow/FR/NFR/BR và link |
| Required capability | Khả năng kỹ thuật cần có |
| DeepSeek evidence | Package, file, API/hook và link đến commit |
| Coverage | Confirmed / Partial / Not found / Unknown |
| Proposed action | Reuse / Configure / Extend / Replace / Build / Exclude |
| DeckAgent value | Bạn có thể làm gì hoặc quyết định gì nhờ cơ chế này? |
| Risk / trade-off | Giới hạn, coupling, chi phí fork và nâng cấp |
| Validation | Câu hỏi còn mở, test hoặc PoC cần làm |
| Confidence | Confirmed by code/test / Docs only / Hypothesis |

### Phase 2B — Discover opportunities beyond V1 (parallel with Phase 2)

**Mục tiêu:** Không bỏ qua một flow chỉ vì nó chưa được chọn vào V1, nếu DeepSeek đã có capability tương ứng hoặc có thể tạo UX tốt hơn với ít công sức.

**Việc làm**
- Đọc **tất cả flows ngoài V1 ở mức sàng lọc** (không cần phân tích source code sâu ngay). Chú ý cả các flow của UC đã có một phần trong V1 và các UC có `versions: {}`.
- Khi đọc DeepSeek, ghi lại capability hữu ích **dù chưa có yêu cầu V1 tương ứng**: ví dụ session fork, resume, history, tool policy, model capabilities, UI interaction hoặc observability. Đây chỉ là gợi ý tìm kiếm, không phải danh sách tính năng được đề xuất.
- Mapping hai chiều: `DeepSeek capability → DeckAgent non-V1 flow / possible new UX flow`. Nếu không có flow tương ứng, mô tả như **UX hypothesis**, không tự tạo UC chính thức.
- Đánh giá sơ bộ: (1) giá trị người dùng; (2) cải thiện UX so với V1 hiện tại; (3) mức reuse thực tế; (4) effort và dependency; (5) nguy cơ làm chậm V1 hoặc tăng maintenance.
- Không xem "DeepSeek đã làm được" là bằng chứng đủ để thêm vào V1. Cần xác nhận capability đó thực sự dùng được trong DeckAgent, đặc biệt trên Windows và Local Web.

**Outcome:** `Non-V1 Opportunity Register` với các trạng thái `Discover / Investigate / Propose for V1 / Defer / Reject`.

**Điều kiện hoàn thành:** Mỗi opportunity có nguồn flow hoặc UX hypothesis, link DeepSeek, lý do đáng xem xét và câu hỏi còn mở. Không có scope change tự động.

### Phase 3 — Identify change points and boundaries

Với các capability quan trọng, trả lời:

- Muốn DeckAgent hành xử khác, **chỉnh ở đâu trước**: config, preset, prompt, tool, service, event/hook, UI hay core implementation?
- Thay đổi đó có tác động đến Agent Loop, Session Model, Tool Pipeline, Web Host hoặc persistence không?
- Có thể giữ public interface khi thay implementation không?
- Nếu bỏ một plugin/package, những dependencies và behaviors nào sẽ mất?
- Việc fork có khiến cập nhật upstream trở nên khó hơn không?

**Phân biệt ba mức thay đổi:**

1. **Workflow:** đổi công việc và thứ tự tool/model actions; có thể không đổi Agent Loop.
2. **Control rules:** thêm điều kiện tiếp tục/dừng, quality gate hoặc approval; thử hooks/workflow trước.
3. **Execution mechanism:** đổi cách tạo Steps, schedule Tools, cancellation hoặc state machine; có thể cần custom Agent Loop.

**Outcome:** `Reuse / Customize / Replace / Build Assessment` và `Change-Point Map`.

### Phase 3B — Review V1 changes and UX regression (for shortlisted opportunities)

Với mỗi opportunity đủ hấp dẫn để cân nhắc đưa vào V1, **không chỉ hỏi có thêm được không**, mà còn hỏi **thêm/sửa flow này có làm UX hiện tại đi lùi không**.

- So sánh **As-is V1 flow** với **Proposed flow**: hành động của người dùng, số bước, điểm cần chờ, khả năng hiểu trạng thái và khả năng sửa sai.
- Phân biệt **Add** (thêm flow), **Replace** (thay flow), **Modify** (sửa flow) và **Reuse only** (tận dụng kỹ thuật nhưng không thay đổi hành vi người dùng).
- Kiểm tra những flow khác bị ảnh hưởng: `includes`, preconditions, alternative flows, FR/NFR/BR, chat/deck persistence, clarification, editing scope và model selection.
- Kiểm tra regression: yêu cầu rõ có còn được làm đúng không; nội dung ngoài phạm vi chỉnh sửa có được giữ nguyên không; người dùng có bị buộc thêm bước không; việc reload/reopen có đổi hành vi không; có phát sinh rủi ro mất deck hoặc nhầm trạng thái không.
- Ghi cả **UX gain** và **UX cost**. Nếu flow mới nhanh hơn nhưng làm mất khả năng kiểm soát hoặc làm khó việc sửa deck, phải nêu rõ trade-off.
- Đưa ra một trong bốn đề xuất: **Adopt in V1 / Trial in PoC / Defer / Reject**. Đây là đề xuất, không phải quyết định đã chốt.
- Chỉ sau **owner approval** mới đề xuất thay đổi `versions.V1` trong UC, cập nhật FR/NFR/BR và traceability theo `docs/spec/03-use-cases/_CRITERIA.md`.

**Outcome:** `V1 Change & UX Regression Review` cho từng opportunity được shortlist, gồm before/after flow, affected IDs, trade-offs và owner decision status.

### Phase 4 — Prioritize research spikes and PoCs

Chỉ đưa một vấn đề vào nghiên cứu sâu nếu ít nhất một điều đúng:

- Chưa biết có thể đáp ứng một hành vi V1 hay không.
- Có từ hai phương án kiến trúc với trade-off đáng kể.
- Một giới hạn của DeepSeek có thể buộc sửa core.
- Rủi ro dữ liệu, mất trạng thái, sai phạm vi chỉnh sửa hoặc lỗi khi render ảnh hưởng trực tiếp đến V1.
- Có thể kiểm chứng bằng PoC nhỏ thay vì đọc thêm nhiều packages.
- Một capability của DeepSeek có thể giúp đưa flow ngoài V1 vào sớm, hoặc thay flow V1 hiện tại bằng UX tốt hơn, và đã qua sàng lọc Phase 2B.

**Ví dụ PoC candidates (chưa phải quyết định triển khai):**

- Tạo Agent với Presentation Tool, cho model gọi tool qua Agent Loop mặc định.
- Tạo deck → render preview → nhận phản hồi → sửa một phần deck; kiểm tra nội dung ngoài phạm vi có được giữ nguyên.
- Reload browser khi Agent đang chạy; kiểm tra execution và UI reconnect.
- Restart toàn bộ ứng dụng; kiểm tra chat/deck được lưu, nhưng công việc dang dở không tự resume.
- Đổi model cho chat; kiểm tra model route, tool schemas và history.
- Thử quality gate trước khi Turn kết thúc; xác định hooks đủ hay cần thay loop.

**Outcome:** PoC plan theo mức ưu tiên, mỗi PoC có hypothesis, expected result, pass/fail criteria và quyết định mà nó phục vụ. Với PoC cho flow ngoài V1, kiểm tra cả UX regression và ảnh hưởng đến các flows V1 liên quan.

### Phase 5 — Produce the new research roadmap

Sắp xếp nghiên cứu theo **mức độ chặn việc build**, không theo thứ tự packages hoặc tài liệu của DeepSeek.

Mỗi research item cần:

- **Research question:** Câu hỏi kỹ thuật cụ thể.
- **Why it matters:** Sau khi biết câu trả lời, DeckAgent có thể quyết định hoặc làm gì?
- **Evidence to inspect:** Links đến files, tests, docs, notes.
- **Validation:** Cách kiểm chứng khi tài liệu chưa đủ.
- **Stop condition:** Khi nào đã đủ bằng chứng để dừng đọc và chuyển sang build.
- **Output:** File nghiên cứu, matrix update, PoC hoặc ADR candidate.

**Outcome cuối:** `Prioritized DeepSeek Research Roadmap` gồm **V1 delivery blockers**, **V1 improvement opportunities** và **future architecture risks**. Cơ hội ngoài V1 được xếp hạng theo lợi ích/chi phí, không bị loại chỉ vì chưa thuộc V1.

## 5. Câu hỏi quyết định xuyên suốt

1. **Reuse boundary:** Có thể giữ những phần nào của DeepSeek Harness mà không sửa source?
2. **Agent Loop boundary:** Presentation workflow chỉ cần Tools/Prompts/Hooks hay phải thay Driver?
3. **Artifact boundary:** Session History và Deck State có phải hai nguồn dữ liệu riêng? Ai sở hữu trạng thái deck hiện tại?
4. **UI boundary:** Có thể tái sử dụng Host, Conversation, streaming và persistence đến mức nào khi thêm slide canvas?
5. **Model boundary:** Làm sao giữ lựa chọn model theo chat và dùng custom providers mà không phá Tool Calling?
6. **Reliability boundary:** Nếu một tool đã sửa deck nhưng request thất bại, làm sao tránh sửa lặp hoặc mất trạng thái?
7. **Upstream boundary:** Cấu hình, extension hay fork core — lựa chọn nào có chi phí duy trì thấp nhất?
8. **Opportunity boundary:** DeepSeek có capability nào cho phép thêm một flow ngoài V1 với ít công sức hoặc cải thiện UX đáng kể?
9. **Regression boundary:** Thêm/thay flow có làm giảm instruction fidelity, clarification, iterative convergence hoặc khiến người dùng phải thực hiện thêm bước không?

Không được trả lời các câu hỏi này chỉ bằng suy đoán từ tên package.

## 6. Tài liệu đầu ra và cấu trúc lưu trữ đề xuất

```text
docs/research/deepseek-harness/
├── deckagent-v1-deepseek-harness-research-plan.md   # Tài liệu này
├── v1-scope-trace.md                               # Phase 0: V1 flows
├── non-v1-flow-index.md                            # Phase 0: outside-V1 flows
├── v1-technical-capabilities.md                    # Phase 1
├── v1-deepseek-capability-matrix.md                 # Phase 2
├── non-v1-opportunity-register.md                   # Phase 2B
├── deepseek-change-point-map.md                    # Phase 3
├── v1-change-ux-regression-review.md               # Phase 3B
├── validation-spikes.md                            # Phase 4
├── prioritized-research-roadmap.md                 # Phase 5
└── use-cases/                                      # Nghiên cứu chuyên sâu khi cần
```

Tên và số lượng file đầu ra có thể được điều chỉnh sau Phase 1. Không tạo file rỗng chỉ để đủ cấu trúc nếu chưa cần.

## 7. Quy tắc ghi kết luận

Mỗi kết luận kỹ thuật cần được viết theo mẫu:

> **DeckAgent cần hoặc đang cân nhắc:** [hành vi/capability, V1 flow hoặc non-V1 flow/UX hypothesis].  
> **DeepSeek có:** [cơ chế được xác nhận, link commit].  
> **Bạn có thể làm:** [hành động cụ thể với DeckAgent].  
> **Chưa rõ:** [giới hạn hoặc giả thuyết].  
> **Kiểm chứng bằng:** [test/PoC/source].  
> **Quyết định tạm thời:** [Reuse / Configure / Extend / Replace / Build / Exclude / Undecided].
> **Nếu đề xuất đổi V1:** [before/after UX, affected flows, regression risks, owner approval status].

Không dùng những kết luận chung chung như “giúp đánh giá khả năng mở rộng” nếu chưa nói rõ **mở rộng ở đâu và để làm gì**.

## 8. Điều kiện hoàn thành toàn bộ nghiên cứu

Nghiên cứu đủ để bắt đầu thiết kế và build khi:

- Tất cả behaviors V1 được chọn đã được mapping đến capabilities hoặc ghi rõ gap.
- Các flows ngoài V1 đã được quét để tìm cơ hội tận dụng DeepSeek; các cơ hội đáng cân nhắc được shortlist và đánh giá, không yêu cầu nghiên cứu sâu tất cả.
- Mỗi capability quan trọng có vị trí kỹ thuật dự kiến và evidence link.
- Những quyết định có thể gây sửa Agent Loop, Session hoặc Web Host đã có phương án và cách kiểm chứng.
- Có danh sách PoCs tối thiểu để xác nhận các giả thuyết còn rủi ro.
- Có thứ tự build đề xuất, cùng những phần được phép hoãn nghiên cứu sâu.
- Mọi đề xuất thêm hoặc thay flow V1 đều có phân tích UX regression và trạng thái phê duyệt rõ ràng; không thay đổi scope khi chưa được chủ dự án chấp thuận.
- Chưa coi một hypothesis hay research note là ADR đã được phê duyệt.

## 9. Bước thực hiện ngay

**Bắt đầu Phase 0**, không đọc thêm `packages/core/agent-loop/src/agent.ts` lúc này.

1. Khóa commit của DeckAgent và DeepSeek Harness.
2. Tính tập flow V1 từ từng `UC-xxx.md` **và lập chỉ mục các flows ngoài V1**.
3. Truy vết FR/NFR/BR được các flow V1 sử dụng.
4. Viết `v1-scope-trace.md` và `non-v1-flow-index.md`.
5. Sau đó chạy song song V1 Capability Mapping và Opportunity Discovery; chỉ shortlist cơ hội đủ giá trị để phân tích sâu.

---

**Ghi chú:** Kế hoạch này là tài liệu định hướng nghiên cứu. Các capability candidates, change points, UX opportunities và PoCs chưa phải kết luận kiến trúc hoặc cam kết tính năng mới của V1. Việc đề xuất mở rộng V1 là một outcome hợp lệ của nghiên cứu; việc phê duyệt và cập nhật scope là bước riêng.
