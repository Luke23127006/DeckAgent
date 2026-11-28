# Áp lực từ feature còn thiếu

Đọc file này để biết DeckAgent còn thiếu những feature nào so với use case, và mỗi nhóm feature đó buộc cấu trúc đích phải đổi ở đâu.

Danh sách dưới đây đối chiếu ba nguồn: mục ngoài phạm vi và bảng gap trong các file use case [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3) [[4]](#ref-4) [[5]](#ref-5) [[6]](#ref-6), các câu hỏi mở được link từ những bảng đó, và code hiện tại (route trong `packages/host/api/`, các bảng SQLite tạo bằng `CREATE TABLE`, kết quả grep). App không được chạy khi kiểm, nên "chưa có" nghĩa là không thấy route, bảng hay code liên quan.

## Feature còn thiếu

### Trong phạm vi nhưng code chưa có

| Feature | Bằng chứng | Mức chắc |
| --- | --- | --- |
| Người dùng thiết lập, thay đổi và xoá design system tự tạo (UC-010) [[5]](#ref-5) | Không có bảng design system và không có route. `packages/presentation/design/` chỉ có catalog tĩnh qua `listDesignSystems()` | Đã biết |
| Hệ thống tự chọn skill cho một request [[1]](#ref-1) | Grep `skill` trong `apps/` và `packages/` không có kết quả | Đã biết là code không có. `Open`: chưa rõ spec cần feature này ngay hay sau |

### Gap đang mở, nhiều khả năng thành feature

- Hai giao diện cùng thay đổi một đối tượng ([OQ-061](../../../open-questions.md#oq-061)). Gap này xuất hiện trong năm file use case: deck, chat, provider, design system và workspace.
- Chạy lại một request lỗi hoặc đã dừng ([OQ-064](../../../open-questions.md#oq-064)), và báo khi request ở chat khác kết thúc ([OQ-065](../../../open-questions.md#oq-065)).
- Giới hạn tài nguyên mà một request dùng ([OQ-069](../../../open-questions.md#oq-069)), và xem trạng thái cùng mức sử dụng của provider ([OQ-028](../../../open-questions.md#oq-028)).
- Thời gian chờ provider ([OQ-062](../../../open-questions.md#oq-062)) và phân loại lỗi của provider ([OQ-063](../../../open-questions.md#oq-063)).
- File chứa secret trong thư mục dự án ([OQ-068](../../../open-questions.md#oq-068)), link trong thư mục dự án trỏ ra ngoài ([OQ-071](../../../open-questions.md#oq-071)), và giới hạn của file nén ([OQ-066](../../../open-questions.md#oq-066)).

### Ngoài phạm vi hiện tại nhưng đã có ID

- Tự sửa deck bằng tay mà không hỏi model (UC-007), và quay lại một trạng thái trước của deck (UC-008) [[2]](#ref-2). Tự sửa bằng tay chính là canvas có editing tools.
- Xuất deck ra file (UC-004, FR-085) và tiếp tục sửa một deck đã xuất (UC-019) [[2]](#ref-2). `packages/presentation/pptx/src/index.ts` đã có 143 dòng, tức là code đi trước spec ở điểm này.
- Chạy model qua một coding agent CLI đã có trên máy người dùng (UC-005-A18) [[3]](#ref-3). Đây là agent runtime thứ hai.
- Hiển thị mức dùng context của một chat (FR-078), và tài liệu lấy từ dịch vụ bên ngoài đã kết nối như cloud drive [[1]](#ref-1).
- Xuất session của một chat (UC-016), và đổi tên hoặc xoá chat (UC-018) [[4]](#ref-4).

## Ảnh hưởng tới cấu trúc đích

| # | Ảnh hưởng | Feature gây ra | Thay đổi trong [Layout đích](target-layout.md) |
| --- | --- | --- | --- |
| 1 | Run không được gắn cứng với chat. `request-controller.ts` dùng `sessionId` 23 lần, và lifecycle contract bắt buộc có `sessionId`. Việc hệ thống đề xuất design system từ file thương hiệu nhiều khả năng cần agent (`Inferred`: luồng của UC-010 có trạng thái đề xuất). Run đó không thuộc chat nào | Thiết lập design system (UC-010) | `runs/` nhận một owner tổng quát (chat, design system), không nhận `sessionId`. Đây là thay đổi contract, phải quyết trước khi chuyển code |
| 2 | Cần một cơ chế báo thay đổi dùng chung. Deck đã có pattern: `version` cộng stream `deck-changed` trong `packages/host/api/src/transport/deck-routes.ts`. Các đối tượng khác chưa có | Hai giao diện cùng thay đổi một đối tượng (OQ-061), báo request kết thúc ở chat khác (OQ-065), tự sửa deck bằng tay (UC-007) | Tổng quát hoá pattern của deck: mỗi store tăng `version` và phát notice qua một channel chung. Lệnh ghi kiểm `version` (optimistic concurrency) |
| 3 | Port `AgentRuntime` phải nhận nhiều runtime, báo mức dùng và trả lỗi có phân loại. Lifecycle contract hiện tại không có trường usage | Runtime thứ hai (UC-005-A18), mức dùng context (FR-078), mức sử dụng provider (OQ-028), thời gian chờ và loại lỗi provider (OQ-062, OQ-063), giới hạn tài nguyên (OQ-069) | Port có ba phần: event, usage, error category. Mỗi runtime một folder `runtimes/<name>/`. Ngân sách tài nguyên của run nằm trong `runs/` |
| 4 | Bước chuẩn bị run là bắt buộc. Prompt, tool và resource của một run hiện nằm rải trong `deck-prompts.ts`, `generation-prompts.ts`, `prepare-runtime.ts` và `integrations/opencode/resources.ts` | Skill do hệ thống chọn, design system áp vào generation, connector | `runs/preparation/`: mỗi module góp instruction, tool, skill và resource qua một contract chung, đăng ký tại composition root |
| 5 | `tools/` cần tách bên trong | File chứa secret (OQ-068), link trỏ ra ngoài (OQ-071), file nén (OQ-066), connector | `tools/policy/` quyết được đọc gì, `tools/executors/` thực thi, `tools/sources/` cho filesystem và connector |

Hai feature có ảnh hưởng nhẹ hơn vì nền đã có:

- Tự sửa deck bằng tay và quay lại trạng thái trước (UC-007, UC-008) dựa trên các bảng `revisions` và `artifact_revisions` đã có. Cấu trúc chỉ cần thêm rule một đường ghi duy nhất cho cả người dùng và agent (TS-11 trong [Tiêu chí của cấu trúc đích](criteria.md)).
- Xuất deck và tiếp tục sửa deck đã xuất (UC-004, UC-019) có thể buộc FormatAdapter chạy hai chiều (`Inferred`). Chưa cần quyết khi dựng cấu trúc.

Các feature sau chỉ là việc bên trong một module và không đổi cấu trúc: đổi tên hoặc xoá chat (UC-018), trình chiếu deck toàn màn hình ([OQ-057](../../../open-questions.md#oq-057)), khoảng trắng và độ dài của key ([OQ-025](../../../open-questions.md#oq-025)), độ dài tên design system ([OQ-033](../../../open-questions.md#oq-033)).

## Điểm chưa chắc

- `Open`: chưa kiểm OpenCode nhận skill theo format nào.
- `Open`: chưa rõ chạy qua coding agent CLI có sẵn trên máy (UC-005-A18) cần port khác port của OpenCode tới mức nào.

## References

1. <a id="ref-1"></a>[Gửi request](../../../UCs/requests.md)
2. <a id="ref-2"></a>[Deck](../../../UCs/deck.md)
3. <a id="ref-3"></a>[Provider và model](../../../UCs/providers.md)
4. <a id="ref-4"></a>[Chat](../../../UCs/chats.md)
5. <a id="ref-5"></a>[Design system](../../../UCs/design-systems.md)
6. <a id="ref-6"></a>[Workspace](../../../UCs/workspaces.md)
