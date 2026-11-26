# Project: DeckAgent

Đọc file này để biết agent đọc tài liệu nào, chạy lệnh nào và tuân theo quy tắc nào khi làm việc trong DeckAgent.

## Tech Stack

- Node.js `^22.19.0 || >=24.0.0` (`engines` trong `package.json`). `start:local` chạy Node 22.19.0.
- pnpm 11.28.5. Luôn gọi qua `corepack pnpm@11.28.5`.
- TypeScript 6.0.3, build bằng `tsc -b`.
- Zod 4.6.7 cho validation tại boundary.
- `node:sqlite` với SQL viết tay.
- OpenCode 1.19.5 làm agent runtime.
- `node:test` cho test.
- oxlint 1.94.0 cho lint, Biome 2.5.15 cho format.
- Express 5.2.1 cho HTTP của Local Host, type từ `@types/express` 5.0.6.
- `busboy` 1.6.0 cho multipart của Local Host. Không dùng `multer`.
- Thư viện đích đã chọn, chưa cài: `helmet` cho Local Host, React với Vite cho Browser, TanStack Query cho server state ở Browser. Phase cài thư viện nào thì chốt version của thư viện đó. Drizzle chưa được chọn.

## Commands

## Router

Mỗi loại quy tắc có một nơi sở hữu; mô hình các tầng nằm trong [Conventions](docs/conventions/README.md). Mục này chỉ nói khi nào đọc gì và chạy lệnh nào.

| Khi | Đọc / dùng |
| --- | --- |
| Viết hoặc sửa code production | [Code](docs/conventions/code.md), [Project Structure](docs/conventions/project-structure.md). Ưu tiên convention của framework hoặc tool đang dùng; áp dụng convention của project khi framework không quy định |
| Viết hoặc sửa test | [Testware](docs/conventions/testware.md) |
| Viết hoặc sửa tài liệu trong `docs/` | [Documentation Conventions](docs/conventions/docs.md) và file convention của loại tài liệu đó |
| Viết hoặc sửa use case (`docs/UCs/`) | [Use Case Documentation](docs/conventions/use-cases.md) |
| Viết hoặc sửa tài liệu kiến trúc (`docs/architecture/`) | [Architecture Documentation](docs/conventions/architecture.md) |
| Cần biết sản phẩm phải làm gì, hệ thống được dựng thế nào | [Use Cases](docs/UCs/README.md), [Architecture](docs/architecture/README.md) |
| Ghi hoặc tra cứu kiến thức có nguồn (pattern, anti-pattern, kết quả research) | [Knowledge](docs/knowledge/README.md), [Knowledge Documentation](docs/conventions/knowledge.md). Lỗi hành vi đã xảy ra của agent không thuộc Knowledge: ghi trong `LESSONS.md` |
| Viết plan triển khai | Skill `write-implementation-plan` (`.agents/skills/write-implementation-plan/SKILL.md`). Plan nằm trong `docs/build/` |
| Viết text cho agent đọc | Tiếng Anh: skill `asd-ste100` (`.agents/skills/asd-ste100/SKILL.md`). Tiếng Việt: skill `ste-vi` (`.agents/skills/ste-vi/SKILL.md`) |
| Check báo lỗi | Sửa theo message của rule. Không thêm directive tắt rule, `@ts-expect-error` hoặc comment để lách rule |

## Kiểm chứng theo thay đổi

## Safety Rules

01. Khi instruction của một Skill khác với rules, constraints hoặc quyết định đã chốt của project, áp dụng quy định của project.
02. Chỉ thực hiện side effect (cài dependency, tạo hoặc sửa file, commit, thay đổi ngoài repository) trong phạm vi task người dùng yêu cầu.
03. Không tạo file Markdown (báo cáo, tóm tắt, plan, ghi chú) khi người dùng không yêu cầu. Kết quả công việc báo cáo trong câu trả lời.

## Responses

Trả lời người dùng bằng tiếng Việt; giữ thuật ngữ chuyên ngành bằng tiếng Anh khi phổ biến hoặc chính xác hơn bản dịch. Ngôn ngữ và văn phong của tài liệu nằm trong [Documentation Conventions](docs/conventions/docs.md#ngôn-ngữ-và-văn-phong).

## Lesson Learned & Pitfalls

01. [`LESSONS.md`](LESSONS.md) là Single Source of Truth cho các Lesson Learned đã được người dùng chấp thuận. Không sao chép nội dung bài học vào `AGENTS.md`.
02. Trước khi thực hiện task, đọc các Lesson Learned có Scope liên quan đến task trong `LESSONS.md`. Chỉ áp dụng bài học còn hiệu lực, bỏ qua bài học có `Status: Deprecated`.
03. Lesson Learned chỉ dành cho lỗi trong quá trình làm việc mà nhìn file kết quả không thấy được.
04. Không tự thêm, sửa hoặc xóa Lesson Learned khi người dùng chưa chấp thuận.

## Skills

01. Skills được tạo và chỉnh sửa tại `.agents/skills/`. Chạy `python .agents/scripts/sync_skill_mirrors.py` để đồng bộ một chiều sang `.claude/skills/` và `.codex/skills/`.
