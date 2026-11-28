# Codebase tham khảo

Đọc file này để biết DeckAgent học gì và không học gì từ open-design và crypto-force.

## open-design

open-design là một design agent chạy local-first. Nó phát hiện agent CLI đã cài trên máy, chạy CLI đó và stream artifact ra một preview chạy trong sandbox. Hình dạng của nó gần với DeckAgent: một daemon chạy local trong `apps/daemon`, một web UI trong `apps/web`, và contract dùng chung trong `packages/contracts` [[1]](#ref-1).

Các dữ kiện dưới đây lấy từ cây file của repository và từ `apps/daemon/AGENTS.md` tại commit `5fdcc3d` [[1]](#ref-1).

| Phần | open-design | Thư viện |
| --- | --- | --- |
| HTTP server | `apps/daemon` | `express` 5.2.1, `multer` 2.2.0 |
| UI | `apps/web` | `next` 16.2.6, `react` 18.3.1, `tailwindcss` 4.3.0 |
| Database | `apps/daemon/src/db.ts` | `better-sqlite3` 12.10.0, không có ORM hay query builder |
| Agent runtime | `apps/daemon/src/runtimes/`, mỗi agent CLI một file trong `runtimes/defs/` | `@modelcontextprotocol/sdk` 1.29.0 |

Daemon chia theo domain, có một HTTP edge mỏng, không chia theo layer kỹ thuật:

- `server.ts` là composition root: tạo service dùng cho toàn process, gắn middleware và đăng ký các route module.
- `routes/` có một registrar cho mỗi domain, dạng `registerXRoutes(app, deps)`. Mỗi registrar khai báo một kiểu dependency hẹp, chỉ gồm các key của server context mà route đó dùng.
- `http/` chứa phần HTTP dùng chung: origin guard, error envelope, giới hạn kích thước body, message stream.
- `services/` chứa service không phụ thuộc vào request hay response của Express.
- `runtimes/` lo việc spawn agent, tìm executable và parse stream.
- Các folder domain như `plugins/`, `connectors/`, `critique/`, `media/` và `storage/` sở hữu domain mang tên của chúng.

Không có folder `controllers/` và không có folder `repositories/`. Route parse và validate input ngay tại boundary của route, rồi gọi service.

Trạng thái hiện tại của open-design không phải mẫu để chép:

- `server.ts` dài 18.959 dòng, `db.ts` dài 6.007 dòng.
- `routes/runs.ts` dài 3.506 dòng và import thẳng `better-sqlite3`.
- Top level của `apps/daemon/src/` có 132 file. `AGENTS.md` của daemon tự ghi top level đang quá đông, và phần lớn file đó là hướng dẫn dọn dần [[1]](#ref-1).

Bài học: Express và React không tự tạo ra cấu trúc. open-design dùng cả hai mà vẫn có những file rất lớn trộn nhiều trách nhiệm. DeckAgent học các rule đích mà open-design viết ra:

- composition root chỉ làm việc wiring,
- mỗi domain một route registrar, với kiểu dependency hẹp,
- folder domain là chỗ mặc định cho code mới,
- `packages/contracts` thuần, không chứa type của Node, SQLite hay Express.

## crypto-force

crypto-force là một backend web dạng hosted, phần lớn là luồng CRUD trên PostgreSQL. API của nó chia thành các layer Route, Middleware, Controller, Service và Repository, dùng Express và Drizzle [[2]](#ref-2). Kiểu layer đó hợp với workload của nó.

DeckAgent học hai rule từ crypto-force: contract dùng chung nằm trong một package và không khai báo lại thành DTO, và import rule được chặn bằng `no-restricted-imports` [[2]](#ref-2). DeckAgent không học các folder `controllers/` và `repositories/` dùng chung, vì các lý do trong [Các trục chịu tải](agent-load-axes.md).

## References

1. <a id="ref-1"></a>[apps/daemon/AGENTS.md (open-design)](https://github.com/nexu-io/open-design/blob/5fdcc3db1e31bd4fa70f673041b78e87977507c3/apps/daemon/AGENTS.md)
2. <a id="ref-2"></a>[Project Structure (crypto-force)](https://github.com/BuhDuy256/crypto-force/blob/main/docs/conventions/project-structure.md)
