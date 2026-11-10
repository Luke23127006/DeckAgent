# Code Inventory — DeckAgent Rebuild

**Baseline:** `clean-main` at `a0d204a613d0decab2d627a9d5868d9c9e162b9e` (10/11/2026).  
**Goal:** Đưa ra quyết định tái sử dụng code trước khi thiết kế DeckAgent mới trên OpenCode.  
**Status:** Preliminary static inventory. Chưa chạy build, browser tests hoặc dependency graph tự động. **Không xóa code ở bước này.**

## 1. Kết quả chính

* **Remove:** Custom Agent Loop, Cordis và các ứng dụng/test chỉ tồn tại để chạy runtime cũ, **sau khi** code mới đã thay thế phần phụ thuộc.
* **Keep as reference:** UI và design hiện tại trên `clean-main`. Bảo tồn hành vi và diện mạo, không mặc định giữ nguyên mọi dòng code.
* **Adapt:** Host, workflow, tools, Deck, Session, provider settings và frontend integration. Đây là logic ứng dụng, không phải Agent Loop; cần đối chiếu `docs/spec` mới.
* **Rebuild:** Lớp kết nối OpenCode, cấu hình session, quyền sử dụng tools, mapping events/errors và contracts phía DeckAgent.
* **Không lấy `feat/v2-opencode` làm code nền.** Chỉ tham khảo các giải pháp đã kiểm chứng rồi đánh giá lại dưới kiến trúc mới.

## 2. Inventory theo component

| Component / path ( `clean-main` ) | Nhóm | Lý do và hành động tiếp theo |
|---|---|---|
| `docs/spec/` | **Keep — authority** | Nguồn hành vi mục tiêu. Tách V1 hiện hành khỏi `05-backlog` ; không suy diễn code cũ là đúng spec mới. |
| `apps/local-web/DESIGN.md` , `PRODUCT.md` | **Keep — UI reference** | Ghi nhận design tokens, responsive layout, theme, motion và UI behavior. Nếu khác spec, spec quyết định product behavior. |
| `apps/local-web/src/ui-assets.ts` , `outline-style.ts` | **Adapt — preserve visuals** | Bảo tồn stylesheet, markup và layout; kiểm tra các phụ thuộc vào API/state cũ. |
| `packages/client/runtime/src/{layout,conversation-view,deck-canvas,deck-tab,deck-resizer,settings-panel,model-picker,theme,motion,...}.ts` | **Adapt — preserve UI** | Giữ trải nghiệm. Kiểm tra từng component và gỡ coupling đến contracts/flow cũ. |
| `packages/client/runtime/src/{boot,host-client,management-client,deck-client,outline-client}.ts` | **Rebuild integration** | Tập trung kết nối API và lifecycle; chỉ giữ component logic không lệ thuộc backend cũ. |
| `apps/local-web/src/{index,cli,web-request}.ts` | **Rebuild composition** | Hiện lắp Host + custom AgentRuntime; phải thay bằng composition mới với OpenCode. Không tự động loại bỏ logic sản phẩm đang nằm xen trong đây. |
| `apps/local-web/src/{editing-workflow,outline-workflow,outline-interaction,web-state,provider-settings}.ts` | **Adapt / review** | Có logic sản phẩm, state và setup. Đối chiếu từng behavior với spec rồi quyết định giữ thuật toán hay xây lại. |
| `packages/agent/runtime/src/{agent-runtime,plugin,prompt}.ts` | **Remove after replacement** | Custom Agent Loop và Cordis plugin không thuộc kiến trúc đích. |
| `packages/agent/runtime/src/{contracts,tool-registry,tool-failure,memory-session}.ts` | **Extract / adapt** | Có contract và logic tái dùng, nhưng package hiện gắn tên runtime. Tách contract/tool validation khỏi legacy trước khi bỏ package. |
| `apps/agent-runtime/` | **Review then remove/rewrite** | CLI/app khởi tạo AgentRuntime cũ; V1 `PRODUCT.md` loại TUI. Xác định còn entrypoint nào cần trong scope mới. |
| `apps/cordis-smoke/` , `packages/testing/cordis-fixture/` | **Remove after migration** | Chỉ phục vụ Cordis. |
| `vendor/{cordis,cosmokit,loader,include,group,schemastery}/` | **Remove after dependency audit** | Vendor từ DeepSeek Harness. Chỉ xóa khi không còn imports/runtime/dependency sử dụng chúng. |
| `packages/llm/providers/src/{chat-completions,anthropic-messages,gemini,wire}.ts` | **Replace / review** | Các protocol adapter của runtime tự xây có khả năng trùng OpenCode. Không tự viết lại tính năng OpenCode đã cung cấp. |
| `packages/llm/providers/src/{credential-protection,model-catalog}.ts` | **Adapt if needed** | Kiểm tra nhu cầu quản lý model, catalog và credential theo spec; tránh nhân đôi OpenCode provider management. |
| `packages/host/api/` | **Adapt** | API và request lifecycle là trách nhiệm DeckAgent; giữ contract có ích, bỏ assumptions về custom AgentHandle khi cần. |
| `packages/presentation/deck/` | **Adapt / likely reuse** | Deck, Outline, HTML policy, revision và persistence là logic sản phẩm. Chỉ giữ behavior tương thích spec. |
| `packages/session/persistence/` | **Adapt** | Quyết định Chat history và OpenCode native session ownership trước khi chọn data model cuối. |
| `packages/tools/{filesystem,presentation}/` | **Adapt** | Giữ thao tác và validation đặc thù DeckAgent, thay registration/transport bằng OpenCode tool/MCP contract. |
| `tests/` | **Classify by behavior** | Giữ/rewrite regression tests về UX, business rules, storage; thay tests phụ thuộc Cordis/Agent Loop. Không xóa test chỉ vì import legacy. |
| `package.json` , `pnpm-workspace.yaml` , `tsconfig*` , build scripts | **Rebuild dependency setup** | Xóa workspace/vendor scripts cũ khi đã có graph mới. Giữ các công cụ dev có giá trị độc lập. |

**Ý nghĩa các nhóm:** **Keep** = nguồn chuẩn/asset; **Adapt** = tận dụng có chỉnh sửa; **Rebuild** = làm implementation mới; **Remove** = bỏ sau khi không còn consumer. Đây là phân loại sơ bộ theo component, **không phải lệnh xóa file ngay**.

## 3. Coupling cần tháo trước khi xóa

1. `apps/local-web/src/web-request.ts` trực tiếp import `Context` của `@deepseek-ai/cordis`,  `runtimePlugin` và `ToolRegistry`; tạo `ctx` và `ctx.agentRuntime.createAgent()`. Đây là đường nối legacy quan trọng nhất.
2. `apps/local-web/src/index.ts` dùng `@deckagent/agent-runtime` contracts và nối `openWebRequest` vào Host. Bỏ package runtime trước khi thay composition sẽ làm vỡ ứng dụng.
3. `packages/tools/*` dùng `ToolRegistry` types/registration từ `@deckagent/agent-runtime`. Cần chọn tool interface mới và giữ validation/permission checks riêng của DeckAgent.
4. `packages/llm/providers` implement `ModelAdapter` của runtime cũ. Cần phân biệt provider connection/settings của UI với model inference mà OpenCode đã cung cấp.
5. Client `boot.ts` phụ thuộc `@deckagent/host-api` và `@deckagent/deck`; bảo tồn UI không có nghĩa giữ nguyên API contracts.

## 4. UI preservation contract — đầu ra bắt buộc trước rebuild

**Nguồn cố định:** commit baseline ở trên; `apps/local-web/DESIGN.md` , `PRODUCT.md` , `src/ui-assets.ts` , `packages/client/runtime/src/` và browser tests trên cùng commit.

**Cần tạo bằng chứng thực thi:** build UI cũ và chụp reference cho welcome/chat, sidebar, theme sáng/tối, model settings, outline clarification/confirmation, deck canvas, responsive layout và các trạng thái running/awaiting/failed. Nếu không chạy được phải ghi `NOT VERIFIED` , không tự khẳng định UI đã bảo tồn.

**Tiêu chí reuse:** UI mới giữ thiết kế và tương tác đã chọn, nhưng behavior nào trái `docs/spec` sẽ được sửa theo spec. Visual snapshots chỉ là reference, không thay thế test hành vi.

## 5. Quyết định cần trả lời ở Architecture

| Câu hỏi | Giá trị cho bước kế tiếp |
|---|---|
| OpenCode dùng CLI, server/client hay SDK? | Chọn cách tích hợp bằng POC có kiểm chứng về tools, Stop, session, events và deploy. |
| Ai sở hữu Chat/session/history? | Chọn persistence và cách resume, tránh duplicate state. |
| Product permissions kiểm soát ở lớp nào? | Xác định enforcement trong DeckAgent và runtime tool grants. |
| Tools chuyển sang MCP hay OpenCode native plugins? | Xác định transport và validation boundary. |
| API contracts nào giữ để bảo tồn UI? | Giảm số UI components phải viết lại. |
| Thế nào là loại bỏ runtime cũ thành công? | Không còn Cordis/custom-loop consumers, runtime tests thay thế và UI/spec tests đạt. |

## 6. Handoff cho bước 4 — Architecture

**Input:** `docs/spec` tại baseline commit; bảng inventory trên; Runtime Research; UI reference.  
**Output cần tạo:** sơ đồ architecture và ownership; runtime integration choice có evidence; contracts cho Session, Events, Tools, Permissions, Host ↔ UI; sequence của request → outline → confirm → slide; kế hoạch cô lập legacy và điểm chuyển sang code mới.  
**Không làm trong bước này:** xóa vendor/Cordis, code OpenCode adapter mới, commit hoặc push, tuyên bố tests PASS.

**Verification gap:** Inventory này kiểm tra cấu trúc và một số đường import/entrypoint trên GitHub, chưa chứng minh toàn bộ dependency graph, khả năng tái sử dụng của UI, hay độ phù hợp của từng function với spec. Các quyết định cuối phải dựa trên kiểm tra sâu hơn và tests.
