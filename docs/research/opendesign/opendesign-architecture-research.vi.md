# OpenDesign Architecture Research — Bản đọc nhanh tiếng Việt

> Đây là bản giải thích ngắn gọn, dễ đọc dành cho researcher và các thành viên trong team.
> Tài liệu evidence chuẩn, đầy đủ source/inference/citation là
> [`opendesign-architecture-research.md`](./opendesign-architecture-research.md).

## 1. Phạm vi nghiên cứu

- Task: W-031 — Research OpenDesign Architecture
- Repository chính thức: `https://github.com/nexu-io/open-design`
- Phiên bản được pin: tag `open-design-v0.24.0`
- Commit: `0d3a14c1df6dc5017f3cc3ef05b24558250c220b`
- Kết quả coverage: **17/17 RQ đã trả lời**
- Mục tiêu: cung cấp evidence cho W-033, không đề xuất kiến trúc cho DeckAgent.

Lưu ý phiên bản: tag là `v0.24.0`, nhưng `package.json` ở root và daemon tại commit này vẫn ghi `0.23.1`. Vì vậy, kết quả nghiên cứu được gắn với commit cụ thể ở trên.

## 2. OD Next là gì?

OD Next là **strategy tích hợp sẵn để thực thi tác vụ thiết kế trong OpenDesign**, không phải một sản phẩm riêng hay tên phiên bản của OpenDesign.

Có thể hiểu đơn giản:

1. Người dùng đưa yêu cầu và tài liệu đầu vào.
2. OD Next xác định loại tác vụ như prototype, slide deck, marketing image hoặc video.
3. Strategy đi qua các bước `discovery → plan → generate`.
4. Strategy chọn `direct_edit` hoặc `full_plan`, tùy route được xác định cho tác vụ.
5. Filesystem runtime đọc và sửa file trực tiếp. Text-artifact runtime trả về một artifact hoàn chỉnh để host ghi vào workspace.

OD Next có prompt, task profile, state machine và contract riêng. Nó là một execution path tách khỏi legacy prompt stack. Vì vậy, kết luận về OD Next không tự động đúng cho mọi legacy run hoặc mọi agent adapter của OpenDesign.

Nguồn định nghĩa: `plugins/_official/scenarios/od-next-strategy/open-design.json`, `packages/contracts/src/plugins/strategy-v2.ts` và `apps/daemon/src/prompts/system.ts` tại commit đã pin. Citation đầy đủ nằm trong §1.1 của bản tiếng Anh.

## 3. Mental model của kiến trúc OpenDesign

Có thể hình dung luồng chính của OpenDesign như sau:

```text
Người dùng / Web / CLI
          │
          ▼
       Daemon
  API · prompt · run · state
     │
     ├── SQLite: conversation, message, run metadata
     │
     └── Agent runtime / model provider
             │
             ├── Filesystem runtime: agent sửa workspace trực tiếp
             └── Text-artifact runtime: host ghi artifact vào workspace

Project workspace: HTML · CSS · assets
     │
     ├── Preview: sandboxed iframe
     ├── Version history: HTML theo từng file
     └── Export paths: Electron/Chromium → PPTX/PDF/ảnh
```

Điểm quan trọng nhất: **file trong project workspace là working deliverable**. SQLite giữ metadata xung quanh. Preview đọc project file đang được chọn; export đọc file hiện tại hoặc một HTML version được chỉ định.

## 4. Tóm tắt các finding

### F-OD-01 — OD Next coi attachment là task data, nhưng model vẫn có thể truy cập

**Trọng tâm:** OD Next tách attachment metadata khỏi nội dung file và yêu cầu model coi attachment là dữ liệu. Đây là quy tắc trong prompt, không phải bảo đảm kỹ thuật rằng model luôn tuân theo. Tùy runtime và provider được chọn, nội dung người dùng có thể đi qua nhiều nơi và có thể rời máy local.

- User instruction đi theo luồng: API request → SQLite message/run state → prompt composition → agent runtime → model/provider.
- Attachment được copy vào managed snapshot chỉ đọc, có size/digest và được agent truy cập ngoài prompt qua `OD_TASK_INPUT_DIR`.
- Một số adapter ghi toàn bộ composed prompt vào `prompt.md` trong thư mục tạm của OS rồi xóa best-effort.
- Không tìm thấy daemon log thông thường cố ý in raw user prompt. Tuy nhiên, Antigravity có log tạm riêng của agent.
- Khi bật cả telemetry metrics và content consent, prompt/output/tool data đã giới hạn hoặc redact có thể được gửi tới OpenDesign relay hoặc Langfuse.
- Không tìm thấy local cache riêng chứa raw per-turn instruction. OD Next có cấu trúc dành cho upstream provider prompt cache; chính sách retention phía provider không nằm trong repository.
- Internal tool dùng token theo run và endpoint có giới hạn. External MCP do người dùng cấu hình vẫn có thể nhận nội dung thông qua tool argument.

**Điều cần nhớ:** Code đã kiểm tra có guard cho từng đường riêng lẻ, nhưng chưa thiết lập được một bảo đảm end-to-end về retention, log scrubbing hoặc dữ liệu gửi qua tool cho mọi runtime, provider và MCP do người dùng cấu hình.

**Liên quan:** RQ-01 · AC-02 · AC-11.

### F-OD-02 — Media type không phải semantic role

**Trọng tâm:** Hệ thống biết attachment là `file` hay `image` và biết media type, nhưng không lưu rõ “file này là content, template, reference hay asset”.

- Task type và output constraint nằm trong cấu hình riêng.
- Vai trò thực tế của attachment chủ yếu do prompt và agent diễn giải.
- Vì role không machine-readable, downstream code khó truy vấn chắc chắn một PDF được dùng để làm gì.

**Điều cần nhớ:** Attachment contract đã kiểm tra không có general input-role model để phần mềm truy vấn hoặc kiểm thử trực tiếp.

**Liên quan:** RQ-02 · AC-13.

### F-OD-03 — Intent tổng quát được giữ rõ; constraint chi tiết vẫn phân tán

**Trọng tâm:** OpenDesign lưu một số intent signal ở cấp conversation để chúng không mất khi transcript bị rút gọn. Các deck constraint chi tiết vẫn không nằm trong một object duy nhất.

- Các signal `deck`, `media`, `platform` và `devicePlatform` được latch cho toàn conversation.
- Prompt còn ghép transcript, project/user instruction, skill, template, design system, memory và metadata.
- Audience, deck length, language và các constraint chi tiết khác phụ thuộc vào transcript hoặc context được đưa vào prompt sau đó.

**Điều cần nhớ:** Intent tổng quát có thể sống qua việc cắt ngắn transcript và đổi agent trong cùng conversation. Constraint chi tiết linh hoạt hơn, nhưng khó kiểm tra conflict và thời gian còn hiệu lực.

**Liên quan:** RQ-03 · AC-04.

### F-OD-04 — Daemon điều phối, các runtime cùng hội tụ vào project file

**Trọng tâm:** Daemon là trung tâm orchestration; các runtime khác nhau cùng hội tụ vào project file.

- Web và CLI gọi chung daemon API.
- Daemon chọn runtime, compose prompt, quản lý run, persistence và export.
- Filesystem agent sửa file trực tiếp; text-artifact runtime trả artifact để host ghi vào workspace.

**Điều cần nhớ:** Boundary dùng chung là file deliverable và normalized event. Runtime definition giữ nhiều khác biệt runtime trong một khu vực, nhưng capability của provider vẫn có thể ảnh hưởng orchestration. Thay đổi HTML/deck convention có thể chạm tới prompt, template, preview, validation hoặc export; phạm vi thực tế phụ thuộc vào thay đổi cụ thể.

**Liên quan:** RQ-04 · AC-01 · AC-23.

### F-OD-05 — Provenance liên kết version với prompt/message, chưa tới content fragment

**Trọng tâm:** OpenDesign biết HTML version nào được tạo bởi AI/manual/restore, thường giữ prompt của AI version và cố gắng liên kết version ID trở lại artifact reference của assistant message. Bước liên kết này là best-effort. Một số external-plugin version còn có liên kết trực tiếp tới run. Version schema không lưu nguồn của từng câu hoặc claim.

- Version lưu source, prompt, digest, parent/restore history và optional plugin origin.
- `runId` chỉ nằm trực tiếp trong version khi optional origin có giá trị này.
- `source: ai` mô tả loại thay đổi file, không chứng minh nguồn ý nghĩa của nội dung.

**Điều cần nhớ:** Lịch sử file version và việc theo dõi nguồn của từng câu hoặc claim là hai khả năng khác nhau.

**Liên quan:** RQ-05 · AC-03 · AC-16.

### F-OD-06 — Working state là project file

**Trọng tâm:** HTML/CSS/assets trong project directory là trạng thái làm việc có thẩm quyền; SQLite chỉ giữ metadata.

- Preview render file được chọn.
- Export đọc current file hoặc một `versionId` cụ thể.
- Luồng đã kiểm tra không cho thấy một deck object riêng có cơ chế cập nhật all-or-nothing.

**Điều cần nhớ:** Với deck nằm trong một file HTML, preview và export có thể đọc cùng source byte. Luồng đã kiểm tra không cung cấp cập nhật all-or-nothing cho deck gồm nhiều file.

**Liên quan:** RQ-06 · AC-05 · AC-15.

### F-OD-07 — Restore không đồng nghĩa với candidate/accepted state

**Trọng tâm:** HTML version history cho phép khôi phục file, nhưng mutation xảy ra trước và rollback chỉ theo từng file.

- Run thành công tạo version cho HTML đã chạm.
- Restore ghi version cũ vào live file và tạo thêm một restore version.
- Luồng đã kiểm tra không cho thấy candidate deck riêng để người dùng accept hoặc reject trước khi thay working state.

**Điều cần nhớ:** History/restore không phải rollback toàn bộ run trong một bước và không khôi phục HTML cùng các asset như một thay đổi duy nhất.

**Liên quan:** RQ-07 · AC-06 · AC-07 · AC-17.

### F-OD-08 — Refinement dùng Direct Edit cho thay đổi cục bộ và Full Plan cho thay đổi rộng

**Trọng tâm:** Mỗi refinement là một run mới. OD Next chủ động đưa yêu cầu rõ và cục bộ vào Direct Edit; thay đổi rộng hoặc khó giới hạn đi qua Full Plan.

- Direct Edit chỉ hợp lệ khi có editable baseline, phạm vi rõ, deliverable ổn định và dependency có thể giới hạn.
- Trước khi sửa, route này ghi minimal-change contract, gồm phạm vi được phép và nội dung cần bảo vệ. Agent được yêu cầu chỉ sửa phạm vi đó.
- Nếu phạm vi phát sinh rộng hơn sau khi Build bắt đầu, agent phải dừng thay vì tự mở rộng thay đổi.
- Sau khi ghi file, filesystem diff xác nhận path nào thay đổi nhưng không kiểm chứng semantics ở cấp slide hoặc element.

**Điều cần nhớ:** OpenDesign có cơ chế rõ ràng để hướng agent sửa đúng phạm vi; đây là lý do refinement thường chỉ đổi phần người dùng yêu cầu. Giới hạn còn lại nằm ở bước kiểm chứng: host chưa chứng minh tự động rằng mọi slide hoặc element ngoài phạm vi giữ nguyên hoàn toàn.

**Liên quan:** RQ-08 · AC-01 · AC-04 · AC-27.

### F-OD-09 — Completion gate kiểm tra integrity của deliverable, không kiểm tra deck correctness

**Trọng tâm:** Run được coi là hoàn tất khi artifact đúng loại, tồn tại, đọc được và thực sự bị run chạm tới; gate không kiểm tra deck có đúng nội dung hoặc đẹp hay không.

- Gate từ chối một số trường hợp output cũ, thiếu hoặc không đọc được.
- Nó không kiểm tra factual fidelity, slide completeness hay layout correctness.
- P0 lint finding được gửi lại để agent có thể tự sửa ở lượt sau.
- Gate và lint chạy trên file đã là working state; chúng không duyệt một candidate deck riêng.

**Điều cần nhớ:** Completion gate và lint cung cấp kiểm tra cùng feedback hữu ích, nhưng delivery integrity validation vẫn khác content/layout acceptance validation.

**Liên quan:** RQ-09 · AC-06 · AC-10.

### F-OD-10 — Quality check kết hợp nhiều cơ chế

**Trọng tâm:** OpenDesign kết hợp source lint, preview telemetry, Chromium capture và fidelity audit tùy chọn.

- Lint phát hiện một số pattern trong HTML/CSS.
- Preview báo runtime error, resource error, white screen và geometry bất thường.
- Electron có thể render toàn deck.
- Audit HTML↔PPTX là workflow riêng, không tự chạy trong normal acceptance.

**Điều cần nhớ:** Có nhiều tín hiệu chất lượng hữu ích, nhưng các completion, export và audit path đã kiểm tra không cho thấy một automatic quality gate thống nhất cho preview, PPTX và PDF.

**Liên quan:** RQ-10 · AC-14 · AC-18 · AC-25.

### F-OD-11 — Export đọc HTML đã lưu thay vì sinh lại nội dung

**Trọng tâm:** Các export path đã kiểm tra không gọi model để sinh lại deck; chúng render HTML hiện tại hoặc HTML version được chỉ định.

- Screenshot PPTX và raster PDF dùng cùng luồng Chromium capture.
- Vector PDF dùng browser print.
- Editable PPTX dùng DOM conversion riêng.

**Điều cần nhớ:** `versionId` xác định chính xác HTML snapshot dùng để export. Tuy nhiên, source đã kiểm tra không chứng minh preview cũng được pin vào version đó. Nếu người dùng review live file rồi export mà không truyền `versionId`, file có thể thay đổi giữa hai thời điểm.

**Caution:** Screenshot PPTX không editable; raster PDF không có selectable text.

**Liên quan:** RQ-11 · AC-05 · AC-09 · AC-15.

### F-OD-12 — Output mới có thể reuse một phần, không phải toàn bộ

**Trọng tâm:** Các format dựa trên ảnh có thể dùng lại phần lớn capture pipeline, nhưng vẫn cần code đóng gói riêng. Format editable hoặc cần giữ cấu trúc còn cần conversion và fidelity check riêng.

- HTML, PDF, PPTX, ZIP, Markdown và image đều có path hỗ trợ.
- Screenshot PPTX/raster PDF chia sẻ slide capture.
- Editable PPTX, selectable text, notes hoặc animation cần xử lý riêng theo từng format.

**Điều cần nhớ:** Chi phí thêm export format phụ thuộc vào việc format chỉ đóng gói pixel hay phải bảo toàn cấu trúc có thể chỉnh sửa.

**Liên quan:** RQ-12 · AC-26.

### F-OD-13 — Export flow đã kiểm tra không tự động ghi quality loss

**Trọng tâm:** Normal export đã kiểm tra không tự so PPTX/PDF với HTML và không lưu quality loss theo slide.

- Screenshot export có thể giảm layout drift do chuyển đổi sang native shape vì mỗi slide được đưa vào output dưới dạng ảnh.
- Fidelity audit có thể phát hiện, báo cáo hoặc hỗ trợ sửa drift theo yêu cầu, nhưng là skill riêng.
- Trong các export, renderer, telemetry và audit path đã kiểm tra, không thấy quality-loss record được tự động lưu cho mỗi lần export.

**Điều cần nhớ:** Giảm sai khác bằng thiết kế và đo, lưu sai khác sau export là hai khả năng khác nhau.

**Liên quan:** RQ-13 · AC-19.

### F-OD-14 — Retry bị giới hạn, nhưng filesystem baseline không thể rollback file

**Trọng tâm:** OpenDesign phân loại failure và hạn chế retry sau side effect. Nếu agent đã ghi một phần deck trước khi failure hoặc cancellation, thay đổi đó có thể còn lại. Filesystem baseline không thể khôi phục byte cũ.

- Mặc định chỉ retry tối đa một lần với selected transient failure.
- Same-run retry thông thường bị chặn sau tool call, artifact write, visible output hoặc cancellation.
- Với runtime hỗ trợ native session, một số failure sau tool call có thể tiếp tục từ session cũ mà không lặp lại tool call đã hoàn tất.
- Filesystem baseline chỉ giữ fingerprint để phát hiện thay đổi, không giữ bản sao để rollback.

**Điều cần nhớ:** Native-session continuation có thể giữ lại tiến độ của operation. Tuy nhiên, kiểm soát retry và rollback artifact vẫn là hai vấn đề riêng; baseline không thể khôi phục byte cũ.

**Liên quan:** RQ-14 · AC-08 · AC-09 · AC-20.

### F-OD-15 — Không cần professional slide editor trong core loop

**Trọng tâm:** Người dùng tạo và refine deck qua brief/chat; agent chỉnh HTML/CSS; OpenDesign preview và export.

- Code là editable medium chính.
- Object-level editing chỉ bổ sung và chưa hoàn chỉnh.
- Chỉnh sâu có thể chuyển sang code tool hoặc file PPTX bên ngoài.

**Điều cần nhớ:** Core workflow không yêu cầu một full slide editor, nhưng người dùng không chuyên phải dựa nhiều vào việc mô tả thay đổi bằng ngôn ngữ tự nhiên. Default screenshot PPTX cũng không có object có thể chỉnh sửa.

**Liên quan:** RQ-15 · AC-12.

### F-OD-16 — Runtime adapter giữ nhiều khác biệt cục bộ; screenshot export dùng chung renderer

**Trọng tâm:** Runtime registry đưa nhiều khác biệt giữa agent/model vào runtime definition chung. Screenshot PPTX và raster PDF cùng phụ thuộc vào Electron/Chromium desktop.

- Runtime adapter chuẩn hóa launch, auth, model selection và stream event.
- Bare daemon không tự làm screenshot export; đường này cần desktop renderer.
- `pptxgenjs` và `pdf-lib` đóng gói image; editable PPTX thêm DOM conversion.

**Điều cần nhớ:** AI dependency và rendering dependency có cách tích hợp và điểm lỗi khác nhau. Lỗi ở shared desktop renderer có thể ảnh hưởng cả screenshot PPTX và raster PDF.

**Liên quan:** RQ-16 · AC-21 · AC-22.

### F-OD-17 — Cấu trúc hệ thống và cơ chế export đã thay đổi theo thời gian

**Trọng tâm:** Tài liệu lịch sử cho thấy OpenDesign đã thay một số lựa chọn quan trọng về cấu trúc hệ thống và export.

- Bản thiết kế đầu tiên từng phác thảo browser-only, WebSocket, in-memory state và `history.jsonl`; implementation hiện tại dùng HTTP/SSE, daemon có SQLite, registry theo request và sidecar.
- Plugin core và desktop wrapper từng được rebuild.
- PPTX export chuyển từ agent/`python-pptx` sang deterministic capture/assembly.

**Điều cần nhớ:** Các thay đổi hướng tới headless reuse, plugin support, durable state và export lặp lại được. Lịch sử cho thấy nhiều khu vực từng thay đổi, nhưng source không chứng minh một coupling cụ thể là nguyên nhân, không cung cấp effort và cũng không mô tả đầy đủ tác động compatibility.

**Liên quan:** RQ-17 · AC-23 · AC-24.

## 5. Bản đồ RQ → finding

| RQ | Trạng thái | Finding | Chủ đề ngắn |
|---|---|---|---|
| RQ-01 | Đã trả lời | F-OD-01 | Đường đi và exposure của user content |
| RQ-02 | Đã trả lời | F-OD-02 | Media type và semantic role |
| RQ-03 | Đã trả lời | F-OD-03 | Nơi lưu intent/constraint |
| RQ-04 | Đã trả lời | F-OD-04 | Generation architecture |
| RQ-05 | Đã trả lời | F-OD-05 | Provenance |
| RQ-06 | Đã trả lời | F-OD-06 | Working state và ownership |
| RQ-07 | Đã trả lời | F-OD-07 | Versioning/restore |
| RQ-08 | Đã trả lời | F-OD-08 | Refinement flow |
| RQ-09 | Đã trả lời | F-OD-09 | Completion validation |
| RQ-10 | Đã trả lời | F-OD-10 | Quality mechanisms |
| RQ-11 | Đã trả lời | F-OD-11 | Preview/export source identity |
| RQ-12 | Đã trả lời | F-OD-12 | Output extensibility |
| RQ-13 | Đã trả lời | F-OD-13 | Degradation observability |
| RQ-14 | Đã trả lời | F-OD-14 | Failure/retry/rollback |
| RQ-15 | Đã trả lời | F-OD-15 | Editor dependency |
| RQ-16 | Đã trả lời | F-OD-16 | Dependency isolation/cost |
| RQ-17 | Đã trả lời | F-OD-17 | Architecture evolution |

## 6. Những điểm team nên nhớ

1. OpenDesign là **file-first workspace**; deck flow đã kiểm tra không cho thấy một canonical deck object riêng.
2. Daemon là authority cho orchestration và metadata; project directory là authority cho artifact byte.
3. OD Next có prompt/task contract riêng nhưng chỉ là một execution path; không đại diện cho mọi legacy path.
4. Direct Edit dùng eligibility check và minimal-change contract để giữ refinement cục bộ; Full Plan xử lý thay đổi rộng hoặc khó giới hạn.
5. Preview đọc project file đang chọn; export đọc live file hoặc một HTML version được chỉ định. Tài liệu đã kiểm tra không chứng minh preview được pin cùng `versionId` với export.
6. HTML history hỗ trợ restore; các path đã kiểm tra không cho thấy candidate/accepted state hoặc rollback nhiều file trong một bước.
7. Default screenshot PPTX đặt mỗi slide dưới dạng ảnh nên không có native object để chỉnh sửa.
8. Quality, provenance và quality-loss evidence tồn tại ở nhiều mức, nhưng các path đã kiểm tra chưa hợp nhất chúng thành một acceptance mechanism duy nhất.
9. Input exposure không chỉ có model provider: còn SQLite, workspace, snapshot, temp prompt/log, telemetry opt-in và external tools/MCP.

## 7. Caution khi dùng làm evidence cho DeckAgent

- OpenDesign là platform đa runtime, đa artifact và hỗ trợ project bền vững; DeckAgent V1 có scope hẹp hơn.
- Không dùng các finding trên như một quyết định hoặc đề xuất kiến trúc cho DeckAgent.
- Không suy ra rằng cơ chế OpenDesign đáp ứng hoặc không đáp ứng AC; AC chỉ được dùng để xác định relevance.
- Chi tiết source code, line range, mức confidence và ranh giới giữa `Source says`/`Inference` phải được lấy từ bản tiếng Anh chuẩn.
- Project Hub snapshot chưa có và `sync` thiếu user token, nên D-023–D-028 chưa được đọc lại độc lập từ Google Sheets source of truth. Đây là evidence gap của review, không phải blocker của phần nghiên cứu OpenDesign.
