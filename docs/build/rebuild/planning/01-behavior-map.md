# Rebuild Planning — 01. Behavior Map

**Status:** Product scope map (first pass), chưa phải Build Roadmap hay technical decisions.  
**Spec baseline:** `clean-main` @ `a0d204a613d0decab2d627a9d5868d9c9e162b9e`  
**Architecture đã chọn:** Local-first DeckAgent + Local Web UI + OpenCode CLI `opencode run`; loại bỏ Cordis/custom Agent Loop.

## 1. Kết quả

Đã phân nhóm 9 UC đang nằm trong `docs/spec/02-use-cases/`, thay vì tạo một build cho mỗi UC. Mỗi nhóm dưới đây là một **behavior family** để phân tích dependencies và lên build.

| ID | Behavior family | Người dùng nhận được gì? | Source UC | FR/BR trọng tâm (không exhaustive) |
|---|---|---|---|---|
| BF-01 | Workspace | Tạo, chọn, đổi tên/đổi folder hoặc remove workspace; không thay đổi project files | UC-013 | FR-071–074, FR-083–084; BR-004, BR-019, BR-020 |
| BF-02 | Chat & Persistence | Bắt đầu chat độc lập, tìm/reopen chat cũ, giữ draft, history, deck và unfinished work | UC-012, UC-006, UC-003 | FR-038, FR-048–053, FR-065, FR-068, FR-070; BR-004 |
| BF-03 | Model & Services | Thêm provider bằng key, chọn/add models, chọn model per-chat, xử lý config lỗi | UC-005, UC-003 | FR-039–046, FR-058–059, FR-065; BR-005, BR-006, BR-008, BR-016 |
| BF-04 | Request Lifecycle | Soạn/gửi request, activities, stop, fail, reconnect; không tự resume work sau crash | UC-003 | FR-012–019, FR-042, FR-068, FR-070; BR-001, BR-002 |
| BF-05 | Sources & Attachments | Thêm material, validate, dùng làm nguồn cho outline/deck, xử lý conflict/thiếu dữ kiện | UC-001, UC-003, UC-002, UC-009 | FR-009–011, FR-016–017, FR-037, FR-088–089; BR-001, BR-013–015 |
| BF-06 | Outline & Confirmation | Interview phần thiếu, đề xuất outline+brief, revise, confirm rồi mới generate | UC-001 | FR-001, FR-003, FR-005, FR-007–008, FR-021–022, FR-113, FR-116–117, FR-124, FR-126–129; BR-003, BR-011, BR-013, BR-018 |
| BF-07 | Generation & Deck State | Tạo deck/slide theo format đã chọn; từng slide hoàn thành hiện trên UI; giữ finished work khi stop/fail | UC-001 | FR-018–025, FR-091–093, FR-116, FR-138; BR-011, BR-015, BR-018 |
| BF-08 | Follow-up Editing | Chỉnh đúng slides/regions được chỉ định, giữ untouched slides, add slides, edit notes/layout | UC-002 | FR-027–031, FR-036, FR-107, FR-130–132, FR-136; BR-015 |
| BF-09 | Read-only Deck Q&A | Trả lời câu hỏi, kiểm tra provenance/contradictions, không mutate outline hoặc deck | UC-009 | FR-070, FR-128, FR-137–140; BR-015 |
| BF-10 | Design System & Templates | Built-in/custom design system, theme values, brand files, preview; áp dụng vào deck đúng rules | UC-010, UC-001, UC-002 | FR-096–099, FR-106–107, FR-112, FR-135–136; BR-003, BR-017–018 |

**Lưu ý scope:** Các file trong `docs/spec/05-backlog/` không được đưa tự động vào MVP. Đặc biệt, export/import, các format và tính năng bổ sung phải được quyết định scope theo spec cụ thể, không suy ra từ tên feature hoặc UI legacy.

## 2. Những behavior ràng buộc qua nhiều nhóm

- **Chat isolation:** Chat mới không nhận context/deck/material từ Chat khác; selected model chỉ được kế thừa theo rule (UC-012). Remove workspace không xóa Chat/Deck; chúng thành ungrouped (UC-013, BR-004).
- **Host-owned lifecycle:** Một Chat không nhận request mới khi đang có active request; reload UI không dừng request; restart khi đang chạy phải hiển thị unfinished, không auto-retry (UC-003, UC-006).
- **Authorization:** Register workspace không tự đọc file; project folder không bị ghi/sửa/xóa; folder phải qua BR-019 (UC-013). Quyền đọc file khi request chạy là behavior khác với việc đăng ký workspace.
- **Confirmation gate:** Draft outline không đồng nghĩa được ghi slides; user confirmation quyết định thời điểm generation; generation format được lock lúc confirm (UC-001).
- **Partial progress:** Stop/fail giữ confirmed outline, finished slides và revision đã commit; không giả vờ toàn bộ deck đã hoàn thành (UC-001, UC-002, UC-003).
- **Safe mutation:** Follow-up chỉ thay đổi slides/regions đúng scope; question-only không được mutate deck (UC-002, UC-009).
- **Provenance:** Content cần nguồn theo BR-015 không được chỉ dựa vào model knowledge; material conflict và missing facts cần được thể hiện rõ (UC-001, UC-009).

## 3. Technical decision backlog — đầu vào bước kế tiếp

Các mục dưới đây **chưa được chốt**. Khi thực sự cần decision, đọc OpenDesign/OpenCode implementation trước rồi mới viết ADR; không viết ADR cho mọi file hay setting.

| ID | Decision cần giải quyết | Vì sao ảnh hưởng plan? | Nguồn nghiên cứu ưu tiên | Artifact sau khi chốt |
|---|---|---|---|---|
| TD-01 | Application storage: SQLite, filesystem, artifact layout, backup/migrations | Workspace/Chat/Deck phải giữ dữ liệu sau restart, folder nguồn không bị viết | OpenDesign storage + legacy DeckAgent + BR-004, UC-013 | ADR + `architecture/data.md` |
| TD-02 | Chat ID / OpenCode session ID / request ID ownership; native resume vs fresh session | Quyết định context, recovery, Chat isolation và lịch sử UI | OpenDesign CLI adapter + `feat/v2-opencode` | ADR nếu tradeoff lớn + `architecture/runtime.md` |
| TD-03 | Tool exposure và authorization boundary (MCP, workspace read, slide writes) | Không thể chỉ dựa vào prompt; quyết định Tool contracts và permission checks | OpenDesign + OpenCode CLI + DeckAgent existing tools | ADR + `architecture/runtime.md` |
| TD-04 | Product request states, event mapping và UI delivery | Reload/Stop/events/partial progress liên quan nhiều builds | OpenCode event stream + existing UI/Host contracts | Architecture contract; ADR nếu có choice kiến trúc lớn |
| TD-05 | Deck artifact format, revision và source-of-truth | Generation, editing, preview và persistence phụ thuộc chung một model | OpenDesign project/file model + legacy Deck service + spec | ADR + `architecture/deck.md` khi cần |
| TD-06 | Provider credentials & settings isolation | Local-first BYOK và model selection phải không leak credentials | OpenCode CLI config + OpenDesign BYOK + UC-005 | ADR nếu thay security/data boundary + architecture contract |
| TD-07 | Design system/template representation theo generation format | Phục vụ confirm outline và generate/edit mà không trói UI vào runtime | Spec + OpenDesign rendering design + existing DeckAgent UI | ADR nếu quyết định format/model nền tảng |

**Đã chốt, không mở lại:** OpenCode CLI `opencode run`, local-first clone/install/run, giữ Local Web UI làm reference, bỏ custom Cordis Agent Loop khỏi target architecture.

## 4. Product values còn thiếu, không phải ADR mặc định

| Rule | Giá trị chưa chốt trong spec | Ảnh hưởng |
|---|---|---|
| BR-001 | Maximum new attachments/request và maximum size/file | Input validation, attachment tests |
| BR-002 | Maximum request text length | Composer validation, Host contracts |
| BR-003 | Default built-in design system | Outline brief và first-deck flow |
| BR-006 | Setup requirements cụ thể cho từng built-in provider | Provider settings/validation |
| BR-017 | Danh sách theme-value roles | Design System schema và preview |
| BR-018 | Built-in template set và default template/format | Generation/Design System implementation |

Những giá trị này cần được resolve tại thời điểm build liên quan; nếu quyết định làm thay đổi kiến trúc lớn thì mới tạo ADR. Không tự điền vào spec trong bước mapping.

## 5. Handoff → Dependency & Technical Gap Analysis

**Input có sẵn:** BF-01…BF-10, cross-cutting behaviors, TD-01…TD-07, inventory và selected Architecture.

**Bước tiếp theo cần tạo:**
1. Dependency Map theo **prerequisites thực tế** (product state, contracts, code), không dựa trên thứ tự UC ID.
2. Technical Decision Priority: chỉ resolve decisions chặn việc xây nền tảng hoặc build đầu tiên; OpenDesign-first research.
3. Xác định những behavior có thể test sớm bằng vertical slice và những behavior phụ thuộc phần khác.

**Chưa làm ở bước này:** Gán số build, file implementation, estimates, ADR decisions, hoặc xác nhận coverage toàn bộ FR. Các FR được liệt kê trong bảng là **references trọng tâm**, chưa phải exhaustive traceability matrix.

## References

- [Use Cases — clean-main baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/02-use-cases)
- [Requirements — clean-main baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements)
- [Business Rules — clean-main baseline](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules)
