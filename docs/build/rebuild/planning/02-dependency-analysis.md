# Rebuild Planning — 02. Dependency & Technical Gap Analysis

**Status:** Dependency analysis complete; TD-01–TD-07 đã có ADR; Build Roadmap được tạo (2026-11-10); product values còn pending.  
**Spec baseline:** `clean-main` @ `a0d204a613d0decab2d627a9d5868d9c9e162b9e`  
**Input:** `01-behavior-map.md` (BF-01…BF-10, TD-01…TD-07).  
**Architecture đã chốt:** local-first, Local Web UI, OpenCode CLI `opencode run`, không dùng Cordis/custom Agent Loop.

## 1. Kết luận để lập plan

**Không implement tuần tự theo UC hoặc theo tất cả behavior family.** Xây **minimum shared contracts** trước, sau đó hoàn thiện từng product behavior theo dependency thực tế. Cùng một family có thể đi qua nhiều builds.

Ba technical foundations chi phối nhiều nhóm behavior:

1. **Application State & Identity** — Workspace/Chat/Request/Deck có identity ổn định, persisted state và khả năng recovery; product data không ghi vào project folder.
2. **OpenCode CLI Boundary** — process execution, Chat ↔ runtime session, events, permission/tool execution và Stop; không xây lại Agent Loop.
3. **Deck Domain & Artifact Boundary** — Outline/Brief, confirmation, Slide revisions, persisted artifact và contract để UI preview/edit.

Đây là **dependency**, không phải quyết định chọn sẵn framework/DB/tool transport. Các quyết định còn mở được ghi ở mục 3.

## 2. Dependency Map theo behavior

| Behavior family | Minimum prerequisites để bắt đầu | Các phần có thể hoàn thiện sau | Verification sớm |
|---|---|---|---|
| **BF-01 Workspace** | Workspace ID, registry, folder reference, rule không ghi project files | Rename/remove/relink, orphaned chats, folder edge cases | Create/select workspace; project folder không bị mutate; BR-019 denial |
| **BF-02 Chat & Persistence** | Chat ID, product storage, active request state, per-chat draft/deck relationship | Search history, ungrouped chats, recovery UI đầy đủ | New chat isolation; reopen after restart; unfinished request remains unfinished |
| **BF-03 Model & Services** | Provider/model configuration contract, secure credential boundary, CLI model selection | Full catalog management, custom provider variations, error cases | User-selected model được truyền đúng vào request, không tự fallback |
| **BF-04 Request Lifecycle** | Chat + model selection, Host request state, CLI subprocess adapter, events/Stop contract | Reconnect/replay UI events, extensive failure scenarios | Send → activity → done/failed/stopped; không có concurrent request cùng Chat |
| **BF-05 Sources & Attachments** | Attachment identity/validation, file-read permissions, request input contract | Rich parsing, conflict/missing-source analysis, external services | Rejected files không được gửi; accepted sources đến đúng Chat |
| **BF-06 Outline & Confirmation** | Chat/request, sources + interview inputs, Outline/Brief persistence, confirmation gate, minimum generation-format/design-system metadata | Revision/history UX, sophisticated suggestions | Không tạo slide trước confirm; format lock khi confirm |
| **BF-07 Generation & Deck State** | Confirmed outline, artifact/slide schema, authorized tool path, revision/publish contract, UI preview | Advanced layouts, templates và additional formats | Một slide được tạo/persist/preview; Stop giữ finished slides |
| **BF-08 Follow-up Editing** | Existing deck + saved slide revisions, scoped tool authorization, request lifecycle | Region editing, notes/layout, more complex edits | Chỉ slide trong scope thay đổi; unaffected slide giữ nguyên |
| **BF-09 Read-only Deck Q&A** | Existing deck, read-only tool boundary, request + provenance references | Detailed contradiction/provenance checks | Q&A không mutate slide/outline/brief |
| **BF-10 Design System & Templates** | Minimum theme/template references phải có trước Outline/Generation | Custom systems, brand ingestion, editing, preview and management | Built-in system được chọn và ghi trong brief; deck áp dụng đúng theme |

### Đường phụ thuộc trọng tâm

```text
Local Host + UI reference
       |
       +--> State/Identity + Storage -----------> Workspace + Chat
       |                                             |
       +--> OpenCode CLI + Model/Events/Tools ------> Request lifecycle
                                                     |
                                Sources + minimum Design System/Format
                                                     |
                                               Outline + Confirm
                                                     |
                                       Deck Artifact + Generation
                                                     |
                                    +----------------+---------------+
                                    |                                |
                              Scoped Editing                  Read-only Q&A

Custom Design System, advanced Workspace management, provider settings
và attachment edge cases có thể mở rộng theo từng build sau contracts tối thiểu.
```

**Dependency ≠ thứ tự cứng:** Workspace registry, model setup UI, request adapter và artifact domain có thể được phát triển song song khi contracts/fixtures đã thống nhất. Chỉ tích hợp các behavior khi prerequisites của chúng có thật.

## 3. Technical Decision Priority

| Decision | Priority | Cần chốt ở mức nào trước build nền tảng? | Research và kết quả cần có |
|---|---|---|---|
| **TD-01 Storage / data ownership** | **P0** | Chốt nơi lưu product data, data model boundary, cách migrate/recover; không đụng project folder | Đọc **OpenDesign storage implementation** và legacy DeckAgent; ADR + `architecture/data.md`. **SQLite đã được chọn trong [ADR-0001](../adr/0001-local-storage.md).** |
| **TD-02 Session identity/history** | **P0** | Chốt quan hệ Chat ID ↔ Request ID ↔ OpenCode native Session ID và source of truth cho history | **Đã chọn native resume có guard** theo [ADR-0002](../adr/0002-chat-session-history.md) và [`architecture/session.md`](../architecture/session.md); đối chiếu OpenDesign với `feat/v2-opencode`. |
| **TD-03 Tools & permissions** | **P0** | Chốt tool boundary và cách Host enforce confirm/scope/revision trước mutation | Đã chọn request-scoped MCP + Host-enforced permissions theo [ADR-0003](../adr/0003-tools-permissions.md) và [`architecture/tools-permissions.md`](../architecture/tools-permissions.md); test trong builds |
| **TD-04 Request events/lifecycle** | **P0** | Chốt request states, event mapping và phương thức UI nhận/reconnect | **Đã chốt** Host-owned lifecycle + persisted normalized events trong [ADR-0004](../adr/0004-request-events-lifecycle.md) và [`architecture/events.md`](../architecture/events.md); transport route cụ thể chốt khi implement |
| **TD-05 Deck artifact/revisions** | **P0/P1** | Chốt tối thiểu trước build Generation; có thể nghiên cứu song song Foundation | **Đã chốt** artifact metadata trong SQLite + source ở application-managed filesystem, immutable revisions, Host publication boundary theo [ADR-0005](../adr/0005-deck-artifacts-revisions.md) và [`architecture/deck-artifacts.md`](../architecture/deck-artifacts.md); test trong builds |
| **TD-06 Credentials & models** | **P1** | Chốt trước khi kết nối model live; local credential handling không được lùi sang release | **Đã chốt** Host-owned provider/model selection + dedicated credential store + run-scoped OpenCode secret injection trong [ADR-0006](../adr/0006-credentials-models.md) và [`architecture/credentials-models.md`](../architecture/credentials-models.md); exact at-rest mechanism chốt trong credentials build |
| **TD-07 Design System/templates** | **P1** | Chốt minimum built-in design system/template interface trước Outline/Generation | **Đã chốt** Design System và Template là hai domain riêng theo [ADR-0007](../adr/0007-design-system-templates.md) và [`architecture/design-system-templates.md`](../architecture/design-system-templates.md). BR-003/017/018 vẫn thiếu default/role/template values. |

**Priority có nghĩa:** P0 ảnh hưởng nhiều components/build đầu tiên; P1 cần chốt trước build sử dụng nó. Không đồng nghĩa tất cả P0 phải nghiên cứu xong trước khi bắt đầu code bất kỳ module độc lập nào.

## 4. Technical gaps khác ADR

Các giá trị product chưa chốt trong `01-behavior-map.md` **không tự động tạo ADR**: BR-001 (attachment limits), BR-002 (text length), BR-003 (default built-in design system), BR-006 (provider setup), BR-017 (theme roles), BR-018 (templates). Gắn chúng vào build sở hữu behavior; cập nhật spec/decision record của sản phẩm đúng thẩm quyền. Chỉ viết ADR nếu quyết định tạo ra ảnh hưởng kiến trúc đáng kể.

Không mở lại lựa chọn OpenCode CLI hoặc local-first distribution; những quyết định này có thể được **ghi ADR hồi tố** để làm nguồn tra cứu, không cần nghiên cứu lại.

## 5. Trình tự giải quyết ADR và Architecture

1. **Research P0 theo nhóm dependency**, ưu tiên đọc code OpenDesign/OpenCode trước và kiểm tra xem hành vi có phù hợp spec DeckAgent hay không.
2. **Record decision** bằng ADR ngắn: Context → Decision → Why/Reference → Consequences. Đánh dấu `Accepted` chỉ với decision thực sự đã chốt.
3. **Update architecture** theo tác động thực tế: `data.md`, `runtime.md`, `deck.md` hoặc `overview.md`. Không tạo file trống hay lặp cùng một quyết định ở nhiều nơi.
4. **Derive Build Roadmap** từ các prerequisites. Chi tiết hóa build gần nhất, chưa cần thiết kế mọi function của những build xa.

## 6. Handoff → Build Roadmap (completed)

**TD-01 đến TD-07 đã có ADR cùng architecture documents.** Build Decomposition đã được ghi trong [`../implementation-plan.md`](../implementation-plan.md): B01–B08 theo Dependency Map, không theo số UC. [`../builds/B01.md`](../builds/B01.md) là build đầu tiên đã được chi tiết hóa; B02–B08 giữ ở roadmap level đến khi có evidence từ build trước.

Các gaps cần gắn vào build tương ứng: BR-001/002 (request/attachment bounds), BR-003/017/018 (default design system, theme roles, templates), BR-006 (provider requirements), và OS credential at-rest mechanism (ADR-0006). Không tạo thêm research gate độc lập nếu evidence đủ để implement.

**Chưa làm:** chưa triển khai code, chưa sửa GitHub source, chưa chạy runtime tests. Roadmap và B01 task-level plan đã có; B02–B08 chưa chi tiết hóa.

## References

- [`01-behavior-map.md`](01-behavior-map.md) — product behavior/dependency input.
- [DeckAgent spec baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec)
- [OpenDesign repository](https://github.com/nexu-io/open-design)
- [DeckAgent `feat/v2-opencode`](https://github.com/Luke23127006/DeckAgent/tree/feat/v2-opencode)
