# Independent Baseline for the Use Case Gap Analysis

Đọc file này để biết baseline độc lập dùng cho gap analysis của `docs/UCs/` gồm những gì, được viết thế nào và dùng khi nào.

## Cách baseline được viết

- Mỗi vùng chức năng có một bộ use case do một subagent riêng viết, theo step 8 của skill `write-use-case` và lesson LL-001 trong `LESSONS.md`.
- Subagent chỉ nhận tên vùng, mô tả ngắn của DeckAgent và danh sách actor. Subagent không nhận câu mục tiêu của vùng, vì các câu đó lấy từ spec.
- Subagent không đọc repo. Mỗi subagent gọi 0 tool.
- Output không chứa ID của spec hoặc tên file trong `docs/`. Nhãn `BL-…` là nhãn riêng của baseline và không liên quan đến ID của spec.
- Nội dung giữ nguyên như output của subagent. Các mục "cần PO chốt" là suy luận của subagent, không phải quyết định của project.

## Chuẩn ngành dùng kèm

| Chuẩn | Phạm vi |
| --- | --- |
| OWASP ASVS | Truy cập file trong workspace, lưu và dùng key. Chỉ các mục trong phạm vi |
| OWASP Top 10 for LLM Applications (2025) | Gửi request, Deck, Provider và model |
| Microsoft HAX Guidelines for Human-AI Interaction | Gửi request, Deck, Chat |
| SEI quality attribute scenario | `docs/UCs/quality-attributes.md` |
| ISO/IEC 25010:2023 | `docs/UCs/quality-attributes.md` |
| WCAG | Chưa áp dụng: DeckAgent chưa có giao diện để so |

ID và mức của mục trong chuẩn phải lấy từ bản gốc của chuẩn khi làm gap analysis, không lấy từ bản tóm tắt.

## Các file

| Vùng | File |
| --- | --- |
| Gửi request | [requests.md](requests.md) |
| Deck | [deck.md](deck.md) |
| Provider và model | [providers.md](providers.md) |
| Chat | [chats.md](chats.md) |
| Design system | [design-systems.md](design-systems.md) |
| Workspace | [workspaces.md](workspaces.md) |

## Khi nào dùng

Gap analysis chỉ bắt đầu sau Task 7 của [plan](../plan/README.md).
