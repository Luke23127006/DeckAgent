# Khoảng cách hiện tại

Đọc file này để biết code hiện tại còn cách layout trong [Layout đích](target-layout.md) bao xa, và mỗi folder hiện tại sẽ chuyển về đâu.

Về mặt khái niệm, convention Project Structure hiện tại [[1]](#ref-1) đã gần với đích. Nó đã có application workflow trong `apps/web/src/features/`, external adapter trong `apps/web/src/integrations/`, Request Lifecycle tách riêng, wire contract thuần trong `packages/host/contracts/` và wiring trong `apps/web/src/index.ts`.

Khoảng cách có hai loại. Phần ngoài lõi agent chỉ cần gom code về đúng chỗ và thay hạ tầng bằng thư viện ([Bốn khoảng cách về chỗ đặt](#bốn-khoảng-cách-về-chỗ-đặt)). Phần lõi agent cần thay đổi contract thật, vì các feature còn thiếu đòi hỏi điều mà contract hiện tại không có ([Thay đổi contract ở lõi agent](#thay-đổi-contract-ở-lõi-agent)). Phần thứ hai là thiết kế mới, không phải di chuyển file.

## Bốn khoảng cách về chỗ đặt

| Khoảng cách | Ví dụ trong code | Cách sửa |
| --- | --- | --- |
| Một endpoint nằm rải ở bốn chỗ, trong hai workspace | Route nằm trong `packages/host/api/src/transport/`. Route gọi interface `WebManagement` trong `packages/host/api/src/transport/contracts.ts`. Implementation nằm trong `apps/web/src/features/`. Bảng map HTTP status nằm trong `apps/web/src/local-transport.ts` | Đặt route registrar cạnh service trong `modules/<name>/`. Bỏ package `packages/host/api` và các interface trung gian lớn |
| `features/` mang hai nghĩa | `apps/web/src/browser/features/` chứa Browser UI. `apps/web/src/features/` chứa Host workflow | Tách thành `apps/host` và `apps/web` |
| Module không có hình dạng chung | `apps/web/src/features/workspaces/` chỉ có `index.ts`, logic nằm ở `packages/workspace/registry/`. `apps/web/src/features/deck/` có 15 file xếp phẳng | Quy định một hình dạng module và chỉ thêm file khi có trách nhiệm thật |
| Hạ tầng tự viết | `node:http` với routing bằng regex trong `packages/host/api/`. DOM tạo tay trong `apps/web/src/browser/` (khoảng 8.800 dòng) | Express 5 và React ([Thư viện](libraries.md)) |

## Thay đổi contract ở lõi agent

| Contract hiện tại | Contract đích | Lý do |
| --- | --- | --- |
| Lifecycle contract bắt buộc có `sessionId`, và `request-controller.ts` dùng `sessionId` 23 lần | Run có owner tổng quát (TS-13 trong [Tiêu chí của cấu trúc đích](criteria.md)) | Run đề xuất design system (UC-010) có thể không thuộc chat nào |
| Lifecycle contract không có trường usage và không phân loại lỗi của runtime | Port `AgentRuntime` có event, usage và error category | Runtime thứ hai, mức dùng context, giới hạn tài nguyên và phân loại lỗi provider ([Áp lực từ feature còn thiếu](feature-pressure.md)) |
| Prompt, tool và resource của run nằm rải trong `deck-prompts.ts`, `generation-prompts.ts`, `prepare-runtime.ts` và `integrations/opencode/resources.ts` | `runs/preparation/` gom phần góp của các module | Skill do hệ thống chọn và design system áp vào generation cần một chỗ góp chung |
| Chỉ deck có `version` và notice thay đổi | Mọi store có `version` và notice thay đổi (TS-12) | Hai giao diện cùng thay đổi một đối tượng, canvas |

Thiết kế các contract này trước khi chuyển `packages/host/api/src/lifecycle/` sang `apps/host/src/runs/`. Nếu chuyển trước, code sẽ phải sửa lần thứ hai ngay sau khi chuyển.

## Bảng chuyển folder

| Hiện tại | Đích |
| --- | --- |
| `packages/host/api/src/index.ts`, `transport/http-io.ts`, `transport/error-response.ts`, `transport/sse.ts` | `apps/host/src/http/` |
| `packages/host/api/src/transport/*-routes.ts` | `apps/host/src/modules/<name>/<name>.routes.ts` |
| `packages/host/api/src/lifecycle/` | `apps/host/src/runs/` |
| `apps/web/src/local-transport.ts` | Error handler trong `apps/host/src/http/` hoặc trong từng module ([Layout đích](target-layout.md#điểm-còn-mở)) |
| `apps/web/src/features/<name>/` | `apps/host/src/modules/<name>/` |
| `apps/web/src/integrations/opencode/` | `apps/host/src/runtimes/opencode/` |
| `apps/web/src/integrations/{images,research,rendering,credentials,providers}/` | Module dùng adapter đó, hoặc `apps/host/src/runtimes/` nếu adapter phục vụ runtime |
| `packages/session/persistence/` | Store của `modules/chats/`, `modules/attachments/` và `runs/`, cùng với `apps/host/src/db/` |
| `packages/workspace/registry/` | `apps/host/src/modules/workspaces/` |
| `packages/tools/filesystem/` | `apps/host/src/tools/` |
| `packages/presentation/deck/` | Giữ làm package hoặc chuyển vào `modules/deck/` ([Layout đích](target-layout.md#điểm-còn-mở)) |
| `apps/web/src/browser/transport/` | `apps/web/src/api/` |
| `apps/web/src/browser/**`, `apps/web/src/ui-assets.ts` | Component và page React trong `apps/web/src/` |
| `packages/host/contracts/` | `packages/contracts/` |
| `packages/presentation/{design,document,html,pptx}/` | Giữ nguyên |

## Rủi ro

Khi các persistence package thành store bên trong `apps/host`, boundary cấp package mà `check:boundaries` đang chặn sẽ mất. Các rule "service không import SQL driver" và "module không đọc store của module khác" phải viết lại thành `no-restricted-imports` theo folder, mỗi rule có một negative fixture (TS-09 trong [Tiêu chí của cấu trúc đích](criteria.md)). Thiếu các rule này, đợt refactor sẽ làm yếu đi các boundary mà đợt boundary refactor đã dựng.

## References

1. <a id="ref-1"></a>[Project Structure](../../../conventions/project-structure.md)
