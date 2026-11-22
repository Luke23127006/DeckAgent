# Tools & Permissions Architecture

**Decision:** [ADR-0003](../adr/0003-tools-permissions.md)  
**Scope:** Host ↔ OpenCode CLI ↔ request-local MCP ↔ DeckAgent domain. Không mô tả code/API hoàn chỉnh.

## 1. Boundaries

```text
UI: request / approve once / refuse / stop
       |
       v
DeckAgent Host
  request context: chat, workspace, phase, scope, approvals, abort signal
       |
       +--> OpenCode CLI Adapter → opencode run (native tools denied)
       |                              |
       |                    current-request MCP tool calls
       |                              v
       +<-- Request-local MCP Bridge <+
                   | check identity + allowed tool + approval + abort
                   v
             DeckAgent Domain Services
                   | check path / workflow / slide scope / revision
                   v
             App-managed files + SQLite

Workspace project folder: read-only source, NEVER write target.
Other Chat data: never accessible through tools.
```

## 2. Tool contract tối thiểu

Mỗi tool có: `name`, input schema, allowed phase, required capability, allowed read/write targets, validation/error behavior. Mỗi call mang Host-side context từ request, **không tin các identity/scope do model tự khai**.

1. **Tool listing:** trả về đúng tools được phép trong phase hiện tại. List không thay thế checks tại thời điểm call.
2. **Call admission:** reject khi request đã stop, token không hợp lệ, tool không được cấp, sai phase, sai Chat hoặc args invalid.
3. **Approval:** action ngoài default reach chờ `allow once` hoặc `refuse`; approval gắn vào operation + canonical target, được consume một lần, không mang qua request mới.
4. **Read paths:** canonicalize/resolve path và kiểm tra folder boundary, symlink, workspace status; project folder là read-only. Không cho phép đọc data của Chat khác, kể cả approve.
5. **Writes:** chỉ vào app-managed work của Chat; Outline confirmation, editing scope, revision và Stop state đều kiểm tra lại ngay trước commit.
6. **Outputs/errors:** chỉ expose kết quả cần thiết; không trả raw secrets, bearer tokens hoặc provider credentials.

## 3. Permission matrix

| Operation | Default | User approval | Always blocked |
|---|---|---|---|
| Đọc sources trong project folder của Workspace đang gắn Chat | Allow | Không | Đọc folder của Workspace/Chat khác |
| Đọc Chat attachments và work của chính Chat | Allow | Không | Đọc data của Chat khác |
| Đọc file ngoài default scope | Ask once | Mỗi attempt mới | Những targets đã bị spec cấm |
| Tạo/sửa/deleting file trong project folder người dùng | Deny | Không thể override | Có |
| Ghi Outline/Deck trong app storage của Chat | Allow khi phase/scope hợp lệ | Product confirmation theo workflow | Pre-confirm generation; stale revision; out-of-scope edit |
| Read-only Deck Q&A | Read-only tools | Không | Mutation tools |
| Stop/revoked request | Deny tiếp mọi tool action | Không | Late writes |

**Phân biệt hai loại confirmation:** `confirm outline` chuyển product workflow sang generation; `approve once` chỉ cấp quyền cho một tool step. Không dùng một loại thay thế loại kia.

## 4. Contracts với các phần khác

- [Session](session.md): mỗi CLI turn có fresh authorization set, kể cả khi resume native session bằng `-s`.
- [Data](data.md): product writes chỉ đến application-managed storage; project folder chỉ là source.
- **TD-04 Events:** cần events cho permission pending, allow/refuse, tool started/done/failed/stopped, status khi abort. Phải giữ request active trong lúc chờ approval.
- **TD-05 Deck:** chịu trách nhiệm cụ thể về slide revision, publish transaction và artifact location.

## 5. Testing tại build tương ứng

- Fixture tests: allowlist, arguments, invalid token, path canonicalization, approval once/refuse và revision guard.
- Real CLI integration: inspect effective native tools/config; không để OpenCode bypass MCP bằng shell/file tools; stop khi tool đang chạy không phát sinh late writes.
- UI tests: question ends request, approval **không** kết thúc request; state hiển thị đúng và Stop vẫn hoạt động khi chờ approval.

**Limit:** Không tuyên bố OS-level sandbox. Runtime chạy local dưới OS user identity; security assertions phải phản ánh đúng lớp bảo vệ thực tế.
