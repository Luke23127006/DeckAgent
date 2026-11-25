# Các trục chịu tải

Đọc file này để biết phần nào của DeckAgent chịu tải kiến trúc, và vì sao kiểu layer controller, service, repository chỉ hợp với HTTP edge và các module CRUD.

DeckAgent là một agent application. Phần lớn rủi ro của nó không nằm ở CRUD. Tiêu chí mỗi phần dùng kiểu cấu trúc hợp với nó (TS-04 trong [Tiêu chí của cấu trúc đích](criteria.md)) dựa trên sáu trục dưới đây. Trục chuẩn bị run trở thành trục chịu tải khi có skill do hệ thống chọn và design system áp vào generation ([Áp lực từ feature còn thiếu](feature-pressure.md)).

## Sáu trục

| Trục | Làm gì | Hiện nằm ở đâu |
| --- | --- | --- |
| Vòng đời run | Một request đi qua admission, chuẩn bị tool, chạy runtime, phát event, chờ approval, cancel, rồi kết thúc ở đúng một terminal status | `packages/host/api/src/lifecycle/request-controller.ts` (397 dòng) |
| Ranh giới capability | Một component cấp capability cho request. Một component khác thực thi tool trong phạm vi capability đã cấp. Đây là ranh giới bảo mật | `prepareTools` trong lifecycle contracts, `apps/web/src/features/sources/`, `packages/tools/filesystem/` |
| Runtime adapter | OpenCode chạy thành process ngoài và nói chuyện với DeckAgent qua MCP bridge. Runtime phải thay được | `apps/web/src/integrations/opencode/` (11 file, gồm `mcp-bridge.ts` và `runtime.ts`) |
| Event log và stream | SSE đọc từ event log. Khi kết nối lại, stream tiếp tục sau cursor `Last-Event-ID`, không mất event và không lặp event | `parseCursor` trong `packages/host/api/src/transport/http-io.ts`, `packages/host/api/src/transport/sse.ts`, request persistence trong `packages/session/persistence/` |
| State machine của deck | Brief, outline, generation và publication chỉ đổi trạng thái qua các transition hợp lệ, có invariant ở từng bước | `packages/presentation/deck/src/`, workflow trong `apps/web/src/features/deck/` |
| Chuẩn bị run | Trước khi runtime chạy, hệ thống quyết run nhận instruction, tool, skill và resource nào | Nằm rải trong `apps/web/src/features/deck/deck-prompts.ts`, `generation-prompts.ts`, `apps/web/src/features/requests/prepare-runtime.ts` và `apps/web/src/integrations/opencode/resources.ts` |

Convention Project Structure đã đặt owner cho các trục này: Request Lifecycle, Agent Runtime, tool permission authority, tool executor và Local Transport [[1]](#ref-1). Layout đích giữ nguyên các owner này, chỉ đổi chỗ đặt code của chúng.

## Vì sao layer chỉ hợp với edge

Kiểu layer controller, service, repository hợp với HTTP edge và các module CRUD như workspaces, chats, provider settings. Nó không hợp với sáu trục trên, vì hai lý do.

- Folder `repositories/` dùng chung phá tính liền khối của deck. `deck-publication.ts` ghi dữ liệu bên trong `host.transaction(...)`. Transaction đó là một phần của invariant: revision được publish và trạng thái của deck phải cùng đổi hoặc cùng không đổi. Khi chuyển SQL sang folder khác, rule bị tách làm hai nơi. Trong modular monolith, mỗi module sở hữu bảng của chính nó.
- Folder `controllers/` dùng chung thành pass-through. Với Express, route handler chỉ ba đến năm dòng và chính nó là controller. open-design cũng không có folder controllers ([Codebase tham khảo](reference-codebases.md)).

Vòng đời run, ranh giới capability và runtime adapter cần ports và adapters. Vòng đời run phụ thuộc vào port `AgentRuntime` và port `ToolExecutor`. OpenCode và các tool filesystem là adapter đứng sau hai port đó. Convention Project Structure đã quy định Agent Runtime không quyết terminal status của request, và tool executor không cấp capability [[1]](#ref-1).

## Điểm còn mở

`Open`: hình dạng cụ thể của port `AgentRuntime` và port `ToolExecutor` chưa được thiết kế. Muốn thiết kế phải đọc kỹ `request-controller.ts` và `apps/web/src/features/requests/prepare-runtime.ts`.

## References

1. <a id="ref-1"></a>[Project Structure](../../../conventions/project-structure.md)
