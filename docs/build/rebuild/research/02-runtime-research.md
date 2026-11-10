# Runtime Research — DeckAgent Rebuild

**Ngày:** 2026-11-10  
**Đầu vào:** `docs/build/BASELINE.md` ; `clean-main` tại `a0d204a613d0decab2d627a9d5868d9c9e162b9e`

**Trạng thái:** Research complete for initial decision; implementation compatibility NOT VERIFIED.

## 1. Kết luận và giá trị của bước này

**Chọn hướng reuse Agent Loop của OpenCode, không xây Agent Loop bằng Cordis.** DeckAgent vẫn cần một lớp application để thực thi product behaviors trong `docs/spec` và kết nối UI được giữ từ `clean-main` .

Nghiên cứu chưa đủ để chọn ngay **CLI**, **server/client**, hay **embedded SDK**. Cần một spike nhỏ trên phiên bản OpenCode được pin trước khi chốt cách tích hợp.

**Đầu ra cho Code Inventory:** bảng ranh giới trách nhiệm (mục 2), các phương án tích hợp (mục 3), và checklist kiểm chứng (mục 5). Nhờ đó, bước sau có căn cứ để phân loại Keep / Adapt / Rebuild / Remove, thay vì xóa code theo tên thư mục.

## 2. Ranh giới trách nhiệm

| Nhu cầu | OpenCode cung cấp / có extension point | DeckAgent phải sở hữu | Cần kiểm chứng |
|---|---|---|---|
| Agent execution | Agent Loop, model/tool execution, session và events | Admission cho request và quy tắc product | Stop/retry/resume đúng spec |
| Model | Provider/model integration | Model Settings UI và các hành vi được spec yêu cầu | BYOK, model switching, capability/error parity |
| Tools | Built-in tools, custom tools, MCP, permission rules | Presentation tools, deck mutation, checks ở application boundary | Chặn tool ngoài phạm vi, không chỉ dựa vào prompt |
| Chat/context | Native session/context mechanisms | Chat/deck identity và lịch sử sản phẩm nếu spec cần | Ai là source of truth; restart và context behavior |
| Presentation | Không cung cấp domain behavior DeckAgent | Outline confirmation, slide generation/publish, revision, preview | Không publish trước confirmation; slide scope |
| UI | Runtime API/events | Giữ giao diện `clean-main` ; UI adapter | Event/state mapping, error, loading, stop |
| Storage/security | Runtime state và config riêng | Application data, user permissions, data boundaries | Quyền OS, file access, credential isolation |

**Nguyên tắc:** Một product rule phải được thực thi ở application boundary có thể kiểm thử. Prompt và permission của runtime là lớp hỗ trợ, không phải bằng chứng duy nhất.

## 3. Ba lựa chọn tích hợp OpenCode

| Hướng | Dữ kiện đã xác minh | Lợi ích | Đánh đổi / rủi ro |
|---|---|---|---|
| **A. CLI adapter** | OpenCode có CLI; OpenDesign gọi `opencode run --format json` và đọc event stream. | Dễ tách process, không fork source; đã có POC trong `feat/v2-opencode` . | Lifecycle, binary distribution, event parsing, platform support. |
| **B. Server + client** | OpenCode có server API và typed client. | Có API/session/event cho UI/Host; thuận lợi khi nhiều yêu cầu. | Phải quản lý server, auth, lifecycle và version compatibility. |
| **C. Embedded SDK** | Build docs mô tả `@opencode/sdk` tạo host in-process. | Không phải chạy HTTP listener riêng; API tích hợp trực tiếp. | API/package/version và nền tảng chạy cần spike; không giả định dùng được với stack hiện tại. |

**Quyết định tạm thời:** lấy **A** làm baseline so sánh vì POC sẵn có, nhưng **chưa chốt A làm production design**. Thử B/C ở mức tối thiểu, chọn theo bằng chứng chứ không theo độ mới của API. Tài liệu OpenCode có các thế hệ V1/V2 và tên package khác nhau; phải pin version cùng tài liệu/API tương ứng, không trộn ví dụ.

## 4. OpenDesign đã giải quyết bài toán thế nào?

OpenDesign tổ chức theo **Web UI → product daemon → runtime registry/adapter → agent CLI**. Product daemon sở hữu project, file, persistence, routes và streaming. Adapter sở hữu cách phát hiện/chạy agent, cung cấp prompt, đọc events và điều khiển lifecycle. Đây là **mẫu phân chia trách nhiệm**, không phải lời khuyên copy toàn bộ OpenDesign.

Đã đọc source:
* `apps/daemon/src/runtimes/registry.ts`: danh mục runtime definitions.
* `apps/daemon/src/runtimes/defs/opencode.ts`: CLI,     `run --format json`, prompt qua stdin, đọc native session ID và resume bằng `-s`, MCP injection.
* `apps/daemon/src/runtimes/defs/byok-opencode.ts`: mapping BYOK qua OpenCode, không tạo Agent Loop thay thế.

**Bài học có thể reuse cho DeckAgent:** tách Product/Application khỏi Runtime Adapter; xác định event/permission/session contracts rõ ràng; giữ application làm chủ artifact. **Không nên copy:** multi-agent registry, marketplace, daemon rộng hoặc các tính năng không xuất hiện trong `docs/spec` mới.

## 5. Các kiểm chứng tối thiểu trước khi chốt Architecture

1. **Runtime bootstrap:** chạy bản OpenCode được pin trên môi trường target; xác minh install/update/license và khởi động/dừng sạch.
2. **Session:** tạo Chat, gửi nhiều turn, restart; so sánh native resume và việc dựng lại context; kiểm tra mapping Chat ID ↔ runtime session ID.
3. **Events/Stop:** nhận model/tool events theo thời gian; Stop giữa tool call; không ghi slide ngoài ý muốn sau Stop.
4. **Tool & permission isolation:** chỉ expose presentation tools được phép; thử deny/ask, workspace boundaries, prompt injection và tool sai phase.
5. **Product workflow:** clarify → outline → user confirm → generate slides → revise đúng slide. Runtime không được tự bỏ qua confirmation.
6. **Providers:** ít nhất một live model; test settings, model switch, errors; các provider còn thiếu credentials phải ghi NOT VERIFIED.
7. **UI integration:** nối thử một Chat và một Deck Canvas hiện có với runtime event contract, không redesign UI.
8. **Performance / operations:** đo startup, turn latency, tài nguyên, context overhead và recovery; dùng cùng một test case cho các hướng A/B/C.

**Quy tắc chọn:** phương án thắng phải qua các checks cốt lõi và có tổng chi phí tích hợp/vận hành phù hợp MVP. Không chấp nhận lựa chọn chỉ vì POC chạy một happy path.

## 6. Handoff sang bước 3 — Code Inventory

Với từng package/file trong `clean-main` và mã thử nghiệm `feat/v2-opencode` , gắn một trong bốn nhãn:

* **Keep:** độc lập runtime và phù hợp spec mới (ưu tiên UI visuals/components, presentation domain nếu đạt).
* **Adapt:** có giá trị nhưng cần đổi integration/API contract.
* **Rebuild:** hành vi cần thiết nhưng hiện buộc vào Cordis/custom loop hoặc sai spec mới.
* **Remove:** legacy Agent Loop, Cordis bootstrap và chức năng ngoài scope khi không còn consumer.

Mỗi kết luận phải ghi **file, lý do, spec/behavior liên quan, dependency, và cách kiểm chứng**. Không xóa `packages/agent/runtime` hoặc các package khác chỉ vì tên của chúng: trước tiên tách reusable contracts/tool/domain code khỏi custom loop.

**Ready cho bước 3:** đủ cơ sở làm Code Inventory. **Chưa ready để xóa runtime cũ hoặc triển khai architecture:** cần kết quả spike và bản đồ dependency.

## References

* OpenCode Build SDK: https://opencode.ai/docs/build/sdk
* OpenCode JavaScript client: https://opencode.ai/docs/build/client/
* OpenCode permissions: https://opencode.ai/docs/en/permissions/
* OpenCode MCP: https://opencode.ai/docs/mcp-servers
* OpenDesign architecture: https://github.com/nexu-io/open-design/blob/main/docs/architecture.md
* OpenDesign adapter design: https://github.com/nexu-io/open-design/blob/main/docs/agent-adapters.md
* OpenDesign OpenCode adapter: https://github.com/nexu-io/open-design/blob/main/apps/daemon/src/runtimes/defs/opencode.ts
* OpenDesign BYOK adapter: https://github.com/nexu-io/open-design/blob/main/apps/daemon/src/runtimes/defs/byok-opencode.ts
* DeckAgent POC code: https://github.com/Luke23127006/DeckAgent/tree/feat/v2-opencode/apps/local-web/src/opencode
