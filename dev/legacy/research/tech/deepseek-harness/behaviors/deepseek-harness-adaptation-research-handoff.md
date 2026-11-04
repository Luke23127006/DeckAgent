---
title: "DeckAgent — DeepSeek Harness Reuse & Adaptation Research Handoff"
project: DeckAgent
status: "Implementation reference — decisions may be revised using code evidence"
research_snapshot: "2026-10-19"
upstream_repository: "https://github.com/deepseek-ai/deepseek-harness"
deckagent_repository: "https://github.com/Luke23127006/DeckAgent"
deckagent_research_branch: "research/deepseek-harness"
upstream_base_commit: "NOT SELECTED — record the exact SHA when importing/forking"
---

# DeckAgent — DeepSeek Harness Reuse & Adaptation Research Handoff

> **Mục đích:** Giữ lại những gì đã nghiên cứu để nhóm **fork/adapt DeepSeek Harness, demo DeckAgent sớm**, và tra cứu khi cần quyết định **reuse / configure / extend / replace / remove**. Đây **không phải** implementation specification bắt buộc phải hoàn thành toàn bộ trước demo.
>
> **Cách đọc:** Bắt đầu từ mục 1–5 để code. Khi gặp vấn đề mới, tra cứu mục 6–11. Những gì chưa kiểm chứng được ghi rõ `ĐỀ XUẤT` , `ỨNG VIÊN` , `CẦN KIỂM CHỨNG` ; không biến chúng thành sự thật về source.

## 1. Quyết định hiện tại — dùng để bắt đầu demo

**Phương pháp:** **Fork & Adapt theo Use Case**, không build from scratch, cũng không xóa hàng loạt các tính năng trước khi demo.

**Hướng đang thử (B):** Giữ DeepSeek `AppFrame` + `Conversation` . Tạo **tab `Deck` bên trong Right Sidebar** bằng extension API. Chưa làm Custom Main Workspace; so sánh hiệu quả ngay trong implementation, không mở một nhánh PoC nghiên cứu mới.

**Vertical slice ưu tiên:** **UC-001**: nhập request/tài liệu → tạo outline → xác nhận outline → Agent tạo từng HTML/CSS slide → `publish_slide` → Deck tab hiện từng slide → lưu để reload/reopen. Nếu reuse được nhiều hơn thì mở rộng UC-002 (follow-up edit) và UC-006 (reopen chat), **nhưng không trì hoãn demo vì các use case mở rộng**.

**Mô hình tối thiểu:**

```text
Original DeepSeek: model/providers + Session + Conversation + tool runtime + fs tools
      |
      v
DeckAgent additions: outline/confirmation behavior + publish_slide
      |
      v
Minimal Host-owned Deck Service (SessionId -> deck state)
      |
      +-> durable state (ctx.storageDomain)
      +-> immutable slide source/artifact (candidate: ctx.attachments)
      |
      v
Existing Host Remote + Client model (snapshot and updates)
      |
      v
Existing Right Sidebar -> new Deck tab -> HTML slide renderer
```

**Chọn để code, không phải quyết định vĩnh viễn:** HTML-first, một slide là một đơn vị publish/revision. Chưa xây custom structured slide engine, full element editor, Visual Critic, hệ thống export PPTX, hoặc Universal Renderer.

**Ba ranh giới đáng giữ đúng từ đầu:**

1. Agent có thể tạo/sửa *candidate* bằng filesystem tools, nhưng **không trực tiếp thay đổi published deck**.
2. Host sở hữu slide ID, current revision và việc publish. Slide ngoài phạm vi không bị thay đổi khi Agent sửa một slide.
3. HTML do model tạo phải được hiển thị an toàn; không chạy model-generated JavaScript với quyền truy cập Host, ứng dụng hoặc dữ liệu riêng.

**Không được hiểu sai:** Mốc demo UC-001 vertical slice **khác** với việc đạt tất cả V1 acceptance conditions. Đặc biệt image generation mới, các nhánh lỗi và chất lượng visual cần được theo dõi như các khoảng trống còn lại.

## 2. Bảng Reuse / Adapt / Remove (tra cứu khi trace code)

| Thành phần / tính năng | Hướng | Có sẵn / bằng chứng | Việc của DeckAgent / lưu ý |
|---|---|---|---|
| Cordis Plugin System, `Context` , services, dependency injection | **KEEP** | `docs/cordis-tutorial/` và `docs/cordis-primer.md` | Đăng ký capability bổ sung bằng plugin; không thay runtime. |
| Agent Loop / Tool Runtime | **KEEP** | `docs/subsystems/tools.md` | Model quyết định tool calls; harness dispatch/execution; tránh viết lại loop. |
| `dsh-tool-fs` , filesystem providers, sandbox | **KEEP** | `packages/fs/tool-fs/README.md` | Agent dùng file tools hiện có để tạo/đọc/sửa HTML; không cho ghi thẳng vào authoritative Deck Store. |
| Models, Providers, Key Settings | **KEEP trước** | Các packages hiện tại của DeepSeek | Dùng được cho demo nếu cấu hình thực tế khớp; yêu cầu UC-005 về nhiều provider configs/custom APIs vẫn cần đối chiếu, không mặc định đạt hết. |
| Chat, Composer, Activity/Conversation history | **KEEP + ADAPT chỗ cần** | `packages/client/ui-conversation/src/client/apply.ts` , Session subsystem | Tránh viết lại; chỉ tùy chỉnh trải nghiệm outline/status/activities không khớp DeckAgent. |
| Session lifecycle, persistence | **KEEP** | `docs/subsystems/session.md` , `persistence.md` | Stop/errors/history từ DeepSeek là nền tảng; deck publication vẫn phải có state riêng. |
| Left Sidebar / Existing AppFrame | **KEEP** | `packages/client/ui-layout/src/client/*` | Không thay frame chỉ để có Canvas. |
| Right Sidebar / Tabs / Docking | **KEEP + EXTEND** | `packages/client/ui-sidebar-right/README.md` | Đăng ký **một Deck tab**: tab mới, không thay hệ thống docking. |
| Document Preview cho HTML/PDF/PPTX | **REUSE SELECTIVELY** | `packages/client/ui-sidebar-documentpreview/README.md` | Có thể mở trực tiếp file để smoke test; không buộc generic File Preview thành Deck Domain. |
| `ctx.storageDomain` | **KEEP, dùng cho deck** | `packages/storage/storage-domain/README.md` | Host lưu current deck state theo Session. |
| `ctx.attachments` | **CANDIDATE REUSE** | `docs/subsystems/attachment.md` | Immutable content-addressed slide artifacts; phải kiểm tra định dạng/assets/GC. |
| Host API Gateway + Typed Remote + Client models | **KEEP + EXTEND** | `docs/api-gateway.md` , `docs/subsystems/web-client.md` | Thêm một đường đọc deck và nhận updates, không tự xây transport mới. |
| `WorkspaceFeed` | **REUSE PATTERN** | `packages/api/workspace-controller/src/feed.ts` | Ví dụ snapshot baseline + changes từ `domain/changed` ; chưa có Deck feed có sẵn. |
| Plan Mode / Plan Review UI | **STUDY, NOT DIRECT REUSE** | `packages/client/ui-plan/README.md` và `dsh-plan-mode` | UC-001 outline có request kết thúc rồi confirmation ở request mới; không tự ý đổi semantics theo Plan Mode. |
| Goal Service | **REFERENCE, not mandatory** | `packages/goal/goal/README.md` | Ví dụ Session-backed state + compare-and-set; không cần Goal Service để xây UC-001. |
| `present` file tool | **KEEP generic, không thay publish_slide** | `packages/deliverables/tool-present/README.md` | Công bố đường dẫn file; **không** cung cấp slide identities/revisions. |
| Plugins page/installer ( `ui-plugin-manager` ) | **HIDE/DISABLE trước; REMOVE có kiểm tra** | `packages/client/ui-plugin-manager/README.md` | DeckAgent không chọn marketplace. **Không nhầm với Cordis Plugin Infrastructure**, cái sau cần giữ. |
| Other DeepSeek-centric UX/branding/features | **CASE-BY-CASE** | `cordis.yml` composition và package tree | Gỡ khỏi bundle/config nếu không cần, sau đó dọn source khi dependency graph đã rõ. |
| Deck Service / `publish_slide` / slide revision | **NEW** | Không có sẵn presentation domain tương đương | Phần đóng góp cốt lõi của DeckAgent. |
| Deck Canvas + slide navigation | **NEW** | `Right Sidebar` chỉ là nơi chứa | Render HTML slides, completed/pending, keep selected slide, persistence. |

### Quy tắc lựa chọn thực dụng

* **KEEP:** hoạt động phù hợp → không sửa.
* **CONFIGURE/DISABLE:** có thể tắt bằng composition → tắt trước, không xóa code trước demo.
* **EXTEND:** DeepSeek có infrastructure, DeckAgent thiếu domain behavior → thêm plugin/tool/tab.
* **REPLACE:** chỉ khi đã có xung đột rõ với expected behavior.
* **DELETE:** sau khi xác minh không còn được dùng hoặc không còn trong dependency path quan trọng.

**Source quan trọng:** [Composition and HMR — `disabled: true` ](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md). Đây là cách **unmount plugin**; nó không có nghĩa việc tắt một plugin luôn không ảnh hưởng dependency khác.

## 3. Kiến thức DeepSeek Harness đã xác minh

### 3.1 Cordis / Tools / Agent

* `cordis.yml` chọn plugin tree. Plugin đăng ký services/capabilities; dependencies được inject qua `Context`. Có thể cấu hình bật/tắt entry; cần chú ý dependency và lifecycle của plugin.
* Agent/model **gọi Tools**. Plugin là cách lắp đặt capability; một plugin có thể đăng ký tool, service, event listener hoặc UI. **Plugin != Tool != Agent Runtime**.
* Agent Runtime điều phối model ↔ tools, tool execution, events và lifecycle. Không nên viết runtime riêng chỉ để model tạo HTML hoặc gọi `publish_slide`.
* `dsh-tool-fs` đã có atomic file create/replace và targeted literal edits. File do Agent tạo trong Session workspace là **candidate**, không phải nguồn sự thật của published deck.
* `dsh-fs-observation-policy` có thể được thêm để yêu cầu read-before-write/edit cho file tools; không tự giải quyết publication semantics.

**Sources:** [Cordis tutorial](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cordis-tutorial), [Tools](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/tools.md), [FS tools](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md).

### 3.2 Client architecture và Right Sidebar

* DeepSeek Client chia thành Host authoritative services, Remote API, Client models, UI adapters, React slot composition; không cần viết lại các tầng này khi chỉ bổ sung Deck Tab.
* Main Conversation được đăng ký trong `main` slot; UI composition dựa trên slots.
* Right Sidebar có **một docking surface theo Session**, cho tabs: resize, split/float, normal push/fullscreen; giữ same content tree khi đổi normal↔fullscreen. `ctx.sidebarRightTabs.register({id,kind,title,...})` đăng ký loại tab;  `ctx.slots.register({name:'sidebar.right.pane.tab',key:id}, Body)` đăng ký view;  `ctx.sidebarRight.openTab(kind)` mở page tab.
* Mẫu extension có thật: `packages/client/ui-plan/src/client/index.ts` (tab `plan`,    `PlanPreview`, title), không phải chỉ là API tồn tại trong README.
* `keepMounted: true` hỗ trợ giữ tab body đã từng mở qua hide/switch Session; **không tự thay persistence cho deck**.
* Layout Rightbar: mặc định ~45% frame, giới hạn tối đa 70%; min width 300px; center min 400px khi đủ chỗ. Dưới 768px sidebar mở fullscreen tự động. Phải đánh giá UX thực tế bằng kích thước slide 16:9 và Chat.
* Sidebar lưu layout/tab state **trong browser localStorage**, theo Session; không lưu nội dung deck ở đây. Sau Host restart, Deck content phải đến từ Deck Service.

**Sources:** [Web Client](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md), [Slots](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/slots.md), [Right Sidebar](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md), [AppFrame](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-layout/src/client/AppFrame.tsx), [column dimensions](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-layout/src/client/columns.ts), [ui-plan example](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plan/src/client/index.ts).

### 3.3 Document Preview: có thể tận dụng, không nên ép thành Deck Service

* Generic File Preview đọc file qua workspace-file Remote, theo dõi resource changes và auto reload.
* Có renderer cho HTML, PDF, hình ảnh, Office (PPTX → PDF) và văn bản.
* Static HTML Preview dùng DOMPurify + sandbox/CSP chặn scripts/external resources; interactive mode dùng `sandbox="allow-scripts"` không có `allow-same-origin` và có policy riêng.
* Preview là **file viewer**, không có slide identity/ordering, approved outline, revision hoặc UC-002 scope semantics.
* **Option A (không chọn làm final UX):** ghi `deck.html` và mở bằng generic Preview → ít thay đổi, tốt để smoke test.
* **Option B (đang chọn):** Deck-specific tab trong chính Right Sidebar → giữ UX hệ thống, tự quản slide navigation và updates.

**Source:** [Document Preview README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-documentpreview/README.md).

### 3.4 Host-owned Deck Domain và persistence

**Kết luận kiến trúc đã đạt:** Để deck không phụ thuộc một Agent turn hoặc workspace temp file, **Host cần sở hữu published deck state**. Đây là trách nhiệm riêng, không phải yêu cầu tự xây database/framework.

Các tầng **khác nhau**, không nên gọi là ba architecture alternatives tương đương:

* **Filesystem** là nơi Agent tạo candidate và có thể chứa artifact.
* **Session Event Projection** là cách dẫn xuất trạng thái từ Session Log.
* **Deck Domain** là **nơi quyết định** mutation/publish nào được phép và revision nào là hiện tại.

Hai ứng viên lưu Deck Domain từng so sánh:

| Ứng viên | Authority | Đánh giá |
|---|---|---|
| **C1 — Session-backed** | Session typed events + projection; immutable artifacts ở ngoài | Có precedence là Goal Service. Nhưng Session events được lưu write-behind; cần flush checkpoint và xử lý event/client visibility. |
| **C2 — Domain-backed** | Deck record trong `ctx.storageDomain` ; Session log vẫn giữ Chat/Tool history | **Ứng viên chính:** phù hợp dữ liệu deck bền vững, tách khỏi Agent lifecycle; tận dụng storage đã có. |

`ctx.storageDomain` hỗ trợ typed tables, per-record `put/update` , durable write trước khi `domain/changed` được gửi; **atomic update chỉ trong phạm vi từng record**, không có cross-store transaction.

Một record cho current deck theo Session là **đề xuất đơn giản**, không phải benchmark đã xác nhận. Backend JSON hoặc SQLite chưa chọn; phải kiểm tra kích thước và tần suất ghi nếu scale tăng.

`ctx.attachments` hỗ trợ immutable content-addressed files. Thuật toán publish đề xuất: **save artifact trước → validate → atomic update Deck Record/reference → notify**. Nếu crash giữa artifact save và Deck Record commit, có thể có **orphan artifact** nhưng chưa đổi current deck; cleanup/GC để sau. Thứ tự logic Validate và Save tùy loại validation; bảo đảm cuối cùng là published references phải trỏ đến các artifact đã lưu bền vững.

**Đừng hiểu sai** `table.update()` là automatic compare-and-swap theo nghiệp vụ. `expectedRevision` / idempotency / scope vẫn cần logic DeckAgent. `domain/changed` là event Host-local; cần Remote để chuyển tới Client. Không lấy trạng thái Deck từ `tools/result` vì tool có thể báo ABORTED sau khi Host đã commit.

Source links: [storage subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/storage.md), [storage-domain README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/README.md), [domain implementation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/src/domain.ts), [attachment subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/attachment.md), [attachment-local](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/attachment/attachment-local/README.md), [Session persistence](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/persistence.md), [Goal Service](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md).

### 3.5 Remote / reconnect

* Dùng Host Remote Controller/Client Model của DeepSeek; không tự tạo WebSocket stack nếu không cần.
* `WorkspaceFeed` đã có **baseline + ordered increments**, subscribe `domain/changed` rồi stream sang Client. Đây là **implementation precedent**, không phải Deck Feed có sẵn.
* Với mốc demo, chọn cách sync đơn giản mà đảm bảo slide vừa publish được hiển thị. Nếu làm live feed khó hơn dự kiến, có thể bắt đầu bằng snapshot/refetch sau notification, nhưng vẫn phải kiểm thử reconnect/reload.
* Xem deck đã lưu không nên buộc Agent runtime resume chỉ để đọc: cần đọc từ Deck Service/Host, có Session access checks.

**Sources:** [API Gateway](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/api-gateway.md), [web-client architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/web-client.md), [WorkspaceFeed source](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/src/feed.ts), [Workspace-files API](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-files/README.md).

### 3.6 Outline vs DeepSeek Plan Mode

* `ui-plan` mở plan review ở Right Sidebar và có UI review/approval, state/persistence behavior riêng.
* **UC-001 của DeckAgent khác:** S3 outline là một response trong Conversation và turn kết thúc; S4 confirmation **gửi request mới**. Outline là checkpoint và không tạo slide trước khi được xác nhận. Confirm current outline, không confirm stale proposal.
* Vì thế **reuse ý tưởng UI, events hoặc controls khi phù hợp**, không reuse nguyên `Plan Mode` policy/state transition khi chưa chứng minh semantics tương đương.
* Outline cần overview + expandable per-slide details (FR-069), confirmed outline read-only; UI outline chưa được DeepSeek cung cấp đúng đặc tả DeckAgent.

**Sources:** [DeepSeek UI Plan](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plan/README.md), [DeckAgent UC-001](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-001.md), [FR-069](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-069.md).

## 4. UC-001: mapping expected behavior → implementation

| Bước | Expected DeckAgent | DeepSeek reuse | Thứ phải bổ sung |
|---|---|---|---|
| S1/S2 | User cung cấp request/tài liệu, gửi | Conversation/Input/Attachments/Agent Loop | Deck-specific instructions tối thiểu. |
| S3 | Agent tạo outline trong chat, xem detail, sửa/confirm/cancel; **chưa tạo slides** | Conversation, interaction/view extension patterns | Outline data & presentation; current/stale confirmation rule. |
| S4 | Confirm current outline, một request mới; confirmed outline read-only | Session and request submission | Persist confirmed outline; Agent instruction tiếp tục từ đó. |
| S5 | Mở Canvas ở Right Sidebar; từng slide hoàn thành hiển thị; không đổi slide đang xem | `ui-sidebar-right` , `dsh-tool-fs` | `Deck` tab, `publish_slide` , minimal Deck Service, Client updates. |
| S6 | Review deck đầy đủ; closing message đúng những gì đã làm | Conversation final message | Completion counts/disclosures gắn với dữ liệu Host. |
| Stop/error/reload | Giữ slides hoàn thành; không publish candidate dở; reopen thấy deck | Session cancel/error/persistence + sidebar | Deck state persistence; publish boundary; reconnect/refetch. |

**Phải nhớ:** `UC-001.md` đang chọn các alternative flows V1 bằng frontmatter. Demo vertical slice không được tự động đánh dấu tất cả flows hoàn tất. **Không tự ý sửa spec để hợp thức hóa phần chưa triển khai.**

**Các requirement/caveat đặc biệt:**

* FR-025 giữ slides hoàn thành sau stop/failure; unfinished edit không thay revision cũ.
* FR-026 báo đúng số lượng slide đã hoàn thành.
* FR-028 dùng confirmed outline + finished slides khi user yêu cầu tiếp tục sau failure.
* FR-049 lưu chat/deck sau Host restart; FR-068 browser reload không hủy request ở Host.
* FR-027 (UC-002) chỉ sửa trong user-requested scope, slide ngoài phạm vi giữ nguyên, kể cả nội dung deck có thể không nhất quán.
* NFR-004 không thực thi model-generated code với quyền ứng dụng; NFR-009 kiểm tra display integrity, tiếng Việt/English; NFR-013 yêu cầu accessibility cho text.
* FR-066 yêu cầu dùng images từ attachments và **có thể tạo ảnh mới**. Cơ chế tạo ảnh mới chưa được chọn, phụ thuộc provider/model và các giới hạn đã chốt. Đây là **gap thật** để hoàn tất tất cả V1 acceptance conditions.

**Product spec:** [V1 SCOPE.md](https://github.com/Luke23127006/DeckAgent/blob/main/docs/versions/v1/SCOPE.md) (Local Web, Windows-first, một deck/chat, một default workspace, no direct editing và no export trong V1).

## 5. Lộ trình implementation ngắn để demo

### Stage 0 — Nhập source và giữ provenance

* Chọn một upstream commit SHA cố định. Ghi `BASE_UPSTREAM_SHA` vào tài liệu/README, không tự đoán.
* Import/fork source **không xóa Git history hoặc thông tin bản quyền**. Nếu repo DeckAgent đã có docs/spec/research thì bảo toàn chúng trước khi đưa source vào.
* Boot baseline trên môi trường Windows nhóm dùng; test provider login/config, Chat, send/stop, reload Session.
* Tạo nhánh adaptation và commit baseline **riêng** với những commits tự xây để có thể phân biệt đóng góp.

### Stage 1 — Product surface + Deck tab

* Giữ `AppFrame` và `ui-conversation` nguyên bản.
* Đăng ký `Deck` tab trong Right Sidebar; render 3 static HTML slides; test resize, fullscreen, chọn slide, tab reopen, Session switching.
* Tắt/hide entry UI ngoài scope (ví dụ Plugins manager) bằng composition nếu an toàn; **chưa xóa hàng loạt source**.

### Stage 2 — UC-001 vertical slice

* Implement Outline → Confirm gate, không tạo slide trước khi confirm.
* Agent dùng existing FS tools để tạo từng slide HTML candidate.
* Thêm `publish_slide` (kiểm tra session/slide/revision, copy/save artifact, commit Deck State) rồi notify UI.
* Deck Tab lấy current deck từ Host; load completed/pending states và giữ selected slide.
* Kiểm tra security HTML isolation; file ảnh/fonts local nếu cần phải được resolve một cách ổn định.

### Stage 3 — Mốc demo và regression nhỏ

* Demo: request → outline → confirm → 3 slides xuất hiện lần lượt trong Canvas.
* Bấm Stop sau slide 2: vẫn còn 2 slides; slide 3 chưa công bố không được hiện.
* Reload trang khi Host còn chạy: request không bị hủy; mở lại chat nhận slides đã công bố.
* Restart Host: chat và slides đã công bố vẫn tồn tại; việc đang chạy không cần tiếp tục.
* Chuyển session/Right Sidebar/tab mà không làm thay đổi current deck hoặc mất dữ liệu.
* Kiểm tra console/backend logs và git diff cho chính các packages đã sửa.

### Stage 4 — Chỉ khi Stage 3 ổn

* UC-002: đọc current HTML của slide, thay candidate, publish revision mới, slide ngoài scope không đổi.
* UC-006: polish reopen/recovery; nhiều behavior Session History đã được reuse nhưng phải test deck-specific state.
* Xóa source implementation không còn dùng sau khi kiểm tra module dependency tree và smoke/regression.
* Hoàn thiện image generation, validation, provider-settings deviation, toàn bộ UCs/FRs/NFRs theo scope chính thức.

## 6. Right Sidebar: đo hiệu quả hướng B trong lúc build

**Không tạo PoC so sánh UI riêng.** Thu thập các quan sát sau ngay trong PRs/commits:

| Chỉ số / câu hỏi | Cách quan sát | Khi nào cân nhắc chuyển khỏi B |
|---|---|---|
| Số dòng/packages upstream phải sửa chỉ vì đặt Canvas vào Sidebar | Git diff so với upstream SHA | Phải can thiệp sâu AppFrame/dockkit để giữ UX cơ bản. |
| Canvas 16:9 có đủ không gian khi Chat bên cạnh? | Test desktop 1366px / 1920px, panel resize/fullscreen | Slide không đọc được ở normal size, phải fullscreen cho mọi thao tác. |
| Reconnect/Switch Session/Tab có giữ đúng deck? | Browser integration test | Tab state khiến deck data mất hoặc sai Session. |
| Canvas có bị tranh chấp focus với file-preview tabs? | Manual UX + test tab open/update | Tự động giật focus trong lúc Agent làm việc. |
| Có reuse được existing HTML viewer hay cần iframe riêng? | Xem `ui-sidebar-documentpreview` trong implementation | File Preview yêu cầu workaround phức tạp hơn Deck tab renderer nhỏ. |

**Điều kiện chuyển về Custom Main Workspace:** có bằng chứng B không đáp ứng UX chính hoặc buộc sửa sâu code lõi. Không chuyển chỉ vì một mô hình UI mới trông đẹp hơn.

## 7. DeepSeek tính năng ngoài scope: hướng xử lý thực tế

**Case: không muốn plugin marketplace/manager trong DeckAgent.**

* DeepSeek có `@deepseek-ai/dsh-client-ui-plugin-manager`, cung cấp Plugins page, bundle install/enable/configuration.
* Có thể bỏ UI/entry mà **vẫn giữ Cordis runtime/plugin graph**. Không nhầm “bỏ marketplace” với “bỏ plugins”.
* Tìm composition entry/package mount; thử `disabled: true` hoặc bỏ khỏi DeckAgent bundle; kiểm tra bootstrap, providers, tools, Session, sidebar navigation. Nếu plugin khác inject UI slots chỉ tồn tại trong Manager, xác định dependency trước.
* Chỉ xóa code/dependency có căn cứ sau khi UC-001 chạy ổn. Ghi nhận packages đã tắt, các package bị remove, regression status.

**Case: Workspace/Session History.**

* DeepSeek có workspace/session-related capabilities; DeckAgent V1 dùng một workspace mặc định và nhiều chats, mỗi chat một deck.
* Đừng xóa toàn bộ Workspace subsystem chỉ vì DeckAgent không cho user chọn folder. Tìm phần UI selection có thể disable/configure trước; kiểm tra routing files và session persistence.
* DeepSeek Session History không tự biết Deck Domain; Deck UI vẫn cần load deck theo Session ID.

**Case: Provider Settings.**

* Reuse hiện có. Đừng sửa theo cách riêng trước demo trừ khi không thể chọn model và chạy request.
* V1 spec chi tiết hơn DeepSeek ở các trường hợp nhiều provider configurations/custom model API. Đối chiếu sau; không tuyên bố đã đạt toàn bộ UC-005 nếu chưa test.

**Sources:** [Plugin Manager](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plugin-manager/README.md), [Cordis composition](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md), [DeckAgent V1 scope](https://github.com/Luke23127006/DeckAgent/blob/main/docs/versions/v1/SCOPE.md).

## 8. Research alternatives đã xét — giữ để cân nhắc, không implement ngay

### 8.1 UI hosting

| Option | Điểm mạnh | Vấn đề | Trạng thái |
|---|---|---|---|
| Custom Main Workspace (Chat + Canvas) | Tự do layout, Canvas là primary surface | Cần custom ghép Conversation và geometry/lifecycle | **Không chọn trước** vì có thể tận dụng Right Sidebar. |
| Generic File Preview `deck.html` | Gần như có sẵn renderer/reload | File viewer không có deck semantics/slide revisions; ép tất cả vào một file | **Chỉ smoke test** nếu tiện. |
| **B — Custom Deck tab trong Right Sidebar** | Reuse tab, fullscreen, resize, session-aware state | Canvas bị giới hạn bởi docking/tab UX; cần deck component riêng | **ĐANG THỬ / chọn để implementation**. |

### 8.2 Slide representation/generation

| Option | Tham chiếu | Ưu điểm | Rủi ro | Trạng thái |
|---|---|---|---|---|
| G1: PPTX-first | DeepSeek office-pptx | Reuse Python/PPTX workflow | Web Canvas phải convert, fidelity/latency | **Baseline nghiên cứu, không chọn cho demo**. |
| **G2: HTML/CSS-first** | Presenton Smart HTML, Slidev | Browser-native preview, layout flexibility | Multi-turn editing stability, CSS deps, security, accessibility | **Chọn tạm để code nhanh**. |
| G3: Structured Slide Model + Renderer | OpenDesign, Presenton Template V2 | Structured edits, validation, potential direct editing | Tự xây schema/renderer, hạn chế visual freedom | **Chưa xây**; xem lại khi G2 có lỗi lặp lại thực tế. |

**Chú ý:** Free-form vs template-constrained generation là **trục quyết định khác** HTML vs PPTX vs Structured Model. Không mặc định HTML phải free-form, hay structured phải dùng template cố định.

References: [DeepSeek office-pptx skill](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-office/assets/office-pptx/SKILL.md), [OpenDesign schema](https://github.com/EthanGuo2022/OpenDesign/blob/main/open_design/schema.py), [OpenDesign renderer](https://github.com/EthanGuo2022/OpenDesign/blob/main/open_design/tools/pptx_renderer.py), [Presenton Template V2](https://github.com/presenton/presenton/blob/main/docs/template-v2.md), [Presenton Smart HTML](https://github.com/presenton/presenton/blob/main/servers/fastapi/services/chat/prompts.py), [Slidev](https://github.com/slidevjs/slidev).

### 8.3 Editing (để sau UC-001)

| Mechanism | Đặc điểm | Khi nào dùng |
|---|---|---|
| E1 — Whole-slide rewrite | Agent tạo full candidate mới; Host chỉ thay một slide revision | **Mặc định đơn giản cho UC-002 ban đầu**; semantic preservation vẫn cần kiểm tra. |
| E2 — Text/source patch | Agent sửa đoạn HTML/code | Dùng khi sửa nhỏ có target rõ, nhưng patch nhỏ có thể ảnh hưởng CSS chung. |
| E3 — Structured operations | `replaceText` / `setImage` bằng element IDs + Host validation | Chỉ xây nếu targeted edit không ổn định và lợi ích được đo rõ. |

* UC-002 không bắt buộc **element ID cho mọi DOM node**, nhưng cần slide ID/revision và đúng scope.
* Shared CSS/assets có thể làm slides ngoài scope đổi giao diện dù source không đổi. Cân nhắc immutable/versioned references cho themes và assets nếu gặp tình huống đó.
* OpenDesign `edit_layer` hỗ trợ targeted diff ở text layer state; không tự chứng minh edit toàn bộ deck/PPTX source đầy đủ.
* Presenton Smart HTML yêu cầu whole-HTML replacement; Template V2 có element operations. Hai chiến lược cùng tồn tại nhưng chưa có benchmark đủ để kết luận chiến lược tốt hơn.

References: [OpenDesign edit_layer](https://github.com/EthanGuo2022/OpenDesign/blob/main/open_design/tools/edit_layer.py), [Presenton Smart prompt](https://github.com/presenton/presenton/blob/main/servers/fastapi/services/chat/prompts.py), [Presenton HTML edit](https://github.com/presenton/presenton/blob/main/servers/fastapi/utils/llm_calls/edit_slide_html.py), [Presenton model editor](https://github.com/presenton/presenton/blob/main/servers/fastapi/utils/llm_calls/edit_slide.py).

### 8.4 Quality and validation (không dựng hệ thống lớn trước demo)

* File hợp lệ không bảo đảm slide đẹp hay text không overflow. Browser screenshot của chính renderer giúp nhìn lỗi thật, không cần build quality engine tổng quát trước.
* Chỉ giữ validation tối thiểu có khả năng ảnh hưởng đến tính đúng đắn của published slide: artifact tồn tại, không empty, format/sandbox/resource an toàn, slide render được ở mức baseline.
* Đánh giá visual / overflow / content fidelity qua scenario demo, sau đó nâng cấp bằng feedback thực tế.
* OpenDesign preview PNG dùng Pillow được mô tả không pixel-accurate so với PPTX; đừng trộn hai rendering paths rồi giả định visual quality luôn giống nhau.
* Không mặc định chọn model/provider khác để tạo hình ảnh hoặc visual judge: V1 giới hạn việc chuyển provider ngoài yêu cầu.

## 9. Technical risks cần nhớ — không phải backlog bắt buộc trước demo

| Rủi ro | Hệ quả | Xử lý tối thiểu / khi nào quay lại |
|---|---|---|
| Agent writes into published filesystem directly | Slide bị đổi giữa chừng, failure mất bản trước | Không dùng filesystem workspace làm authority; công bố qua Deck Service. |
| Session events not yet flushed | Canvas có thể thấy event chưa đạt durability | Dùng Domain-backed C2 cho current deck, hoặc nếu chọn C1 thì kiểm chứng flush policy. |
| `domain/changed` is Host-local | Client không nhận update chỉ bằng cách subscribe Event Bus | Remote/feed/refetch path. |
| Concurrent/retried publish | Duplicate slide, stale overwrite | `expectedRevision` , `operationId` /idempotency; reject stale changes. |
| Candidate saved, Domain not committed | Orphan blob | Không ảnh hưởng deck hiện tại; cleanup sau. |
| Tool reports `ABORTED` after commit | Agent tưởng publish fail dù deck đã đổi | Host deck state là authority; idempotent retry. |
| Browser tab layout persisted, deck not | Sau restart tab còn nhưng deck rỗng | Load current deck từ Host storage. |
| Shared mutable CSS/media | Slide ngoài scope đổi theo | Local/versioned resources, không publish mutable shared deps. |
| HTML unsafe behavior | Model content truy cập app origin/network | Sandboxed renderer/CSP; không thực thi model-generated JS với quyền app. |
| Fonts/image dependencies | Reload khác kết quả render | Save/resolve deps ổn định, kiểm tra missing resources. |
| Rendering/accessibility | Screenshot đẹp nhưng screen reader không đọc đúng | NFR-013: kiểm tra semantic text order khi hoàn thiện scope. |
| Artifact version/migration | Sau này đổi format khó mở slide cũ | Lưu format/version in metadata, giữ compatibility plan khi engine thay đổi. |
| Delete plugins before seeing dependencies | Baseline hỏng khó debug | Disable trước, boot/regression test, delete sau. |

## 10. Public repo / giấy phép / chứng minh đóng góp

**Đã xác minh:** upstream `LICENSE` là **MIT License**, `Copyright (c) 2026 DeepSeek` ; cho phép copy, modify, publish, distribute theo điều kiện giữ copyright và license notice trong các bản sao hoặc phần đáng kể. Đây là thông tin giấy phép phần code upstream; không phải quyết định của hội đồng đồ án.

**Phải làm khi fork/public:**

* Giữ file `LICENSE`/copyright MIT notice; rà soát `THIRD_PARTY_NOTICES.md`, package licenses và assets nếu có.
* Không nói DeckAgent là sản phẩm chính thức của DeepSeek.
* Ghi upstream URL và **exact imported commit SHA** trong `UPSTREAM.md`/`ADAPTATION.md` hoặc README; giữ phân biệt phần reuse và phần do nhóm tự làm.
* Không claim tự xây Agent Runtime, Provider Infrastructure, Session Persistence, Docking UI nếu thực tế reuse.
* Dùng commits/PRs/tests/demo scenarios thể hiện đóng góp: Deck Canvas,  `publish_slide`, Deck State, Outline Confirmation, UC-specific behavior, loại bỏ product features dư thừa.
* Hỏi thầy về **tiêu chí đánh giá đóng góp đồ án**. MIT cho phép công bố source không có nghĩa tự động đủ tiêu chí tốt nghiệp.

**Source:** [DeepSeek LICENSE](https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE), [upstream repository](https://github.com/deepseek-ai/deepseek-harness), [THIRD_PARTY_NOTICES.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/THIRD_PARTY_NOTICES.md).

## 11. Workflow tra cứu khi implementation phát sinh vấn đề

**Không đọc cả repository trước.** Mỗi task bắt đầu từ một behavior cụ thể.

```text
(1) Chọn behavior cần làm (UC-001 S3/S4/S5 hoặc error path cụ thể).
(2) Mở expected behavior từ DeckAgent spec.
(3) Xác định plugin/service/slot DeepSeek hiện tại thực hiện hành vi gần nhất.
(4) Phân loại KEEP / CONFIGURE / EXTEND / REPLACE / REMOVE.
(5) Chọn thay đổi nhỏ nhất giữ được behavior và không phá dependency.
(6) Code + test behavior + ghi rõ upstream parts đã reuse.
(7) Chỉ tra lại research ở mục 3/8/9 khi gặp blocker hoặc một trade-off thực tế.
```

**Ghi chép tối thiểu cho mỗi thay đổi:**

| Field | Cần ghi |
|---|---|
| UC / Acceptance condition | Ví dụ UC-001 S5, FR-025 AC-1 |
| DeepSeek source | Repo path + SHA đang dùng |
| Expected DeckAgent behavior | Kết quả UI/Host cần đạt |
| Decision | Reuse / Configure / Extend / Replace / Remove |
| Change | Package/config cụ thể |
| Evidence | Test/manual demo/diff |
| Open issue | Chỉ issue ảnh hưởng behavior tiếp theo |

## 12. Nguồn DeckAgent ưu tiên đọc

* [V1 scope — SCOPE.md](https://github.com/Luke23127006/DeckAgent/blob/main/docs/versions/v1/SCOPE.md)
* [UC-001 — Generate initial draft](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-001.md)
* [UC-002 — Change my draft deck](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-002.md)
* [UC-003 — Send a request](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/03-use-cases/UC-003.md)
* [FR-025 — preserve finished slides](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-025.md)
* [FR-027 — change only requested scope](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-027.md)
* [FR-066 — images](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-066.md)
* [FR-069 — outline details](https://github.com/Luke23127006/DeckAgent/blob/research/deepseek-harness/docs/spec/04-requirements/fr/FR-069.md)
* [DeepSeek Cordis tutorial](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cordis-tutorial)

---

## Lưu ý sử dụng tài liệu

1. Đây là **snapshot research ngày 2026-10-19**, không phải bản mô tả chính xác của mọi commit DeepSeek sau này. Khi fork, chọn một SHA cố định; nên đổi tất cả source references thành pinned SHA khi cần tái lập kết quả.
2. Những quyết định đã thay đổi trong nghiên cứu cũ được giữ để giải thích trade-off, **không cạnh tranh** với hướng đang triển khai. Hiện tại: **Right Sidebar Deck Tab (B), Fork & Adapt, UC-001-first, HTML-first, minimal Host Deck State**.
3. **Không tự sửa V1 product scope** chỉ vì implementation chưa đủ. Phải phân biệt demo vertical slice và V1 acceptance hoàn chỉnh.
4. Không biến file này thành danh sách research bắt buộc trước demo. **Đọc đúng section khi implementation gặp vấn đề.**
