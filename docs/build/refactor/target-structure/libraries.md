# Thư viện

Đọc file này để biết thư viện nào thay hạ tầng tự viết trong DeckAgent, mỗi thư viện thay được bao nhiêu code và tốn chi phí gì.

Số dòng đo trên working tree ngày 2026-11-25. Số đếm gồm file TypeScript source, không gồm test và `lib/`.

| Khu vực | Hiện tại | Đề xuất | Lợi ích | Chi phí và rủi ro |
| --- | --- | --- | --- | --- |
| HTTP server | `node:http` với routing bằng regex trong `packages/host/api/` (khoảng 1.500 dòng, tính cả lifecycle) | Express 5, `multer` cho upload, `helmet` cho security header | Vừa phải. Route đọc được dạng `router.post('/sessions/:id/attachments', ...)`. Ước lượng bớt vài trăm dòng | Thấp. Các test HTTP trong `e2e/*-http.test.mjs` và `packages/host/api/tests/host-api.test.mjs` gọi server qua HTTP thật |
| UI | DOM tạo tay trong `apps/web/src/browser/` (khoảng 8.800 dòng), CSS nằm trong string của `apps/web/src/ui-assets.ts` | React với Vite | Lớn nhất. Thay gần hết `dom.ts`, `boot.ts` và các file `*-view.ts` | Cao. Phần lớn `e2e/browser-smoke.test.mjs` phải viết lại |
| Server state ở UI | Tự fetch và tự cập nhật DOM | TanStack Query cho các lệnh đọc (workspaces, chats, settings). SSE stream vẫn là custom hook | Bớt code đồng bộ state | Thấp, sau khi đã có React |
| Database | `node:sqlite` với SQL viết tay: 288 lệnh `prepare` hoặc `exec` trong khoảng 3.300 dòng code store | Drizzle, chỉ sau khi tra docs và chạy thử | Schema typed, row typed, tool cho migration | Trung bình đến cao, xem bên dưới |

## Express 5

Express 5 tự bắt lỗi của async handler, không cần wrapper. open-design dùng `express` 5.2.1 cho cùng loại daemon chạy local ([Codebase tham khảo](reference-codebases.md)). Fastify và Hono có type tốt hơn, nhưng team đã quen Express, và mục tiêu của đợt refactor là code mà team đọc dễ.

Express không thay được các phần sau:

- SSE stream có resume theo `Last-Event-ID`,
- `RequestController` và vòng đời run của nó (397 dòng business logic),
- bảng map lỗi sang HTTP status trong `apps/web/src/local-transport.ts` (304 dòng): bảng này chỉ chuyển thành error middleware,
- kiểm tra origin và bearer token: hai phần này thành middleware khoảng mười dòng.

## React với Vite, không dùng Next.js

open-design dùng Next.js. DeckAgent không cần Next.js: Browser là single-page application chạy trên localhost, và Host phục vụ các file tĩnh của nó. DeckAgent không cần server-side rendering và không cần server router. Vite với React đơn giản hơn (`Inferred`: chưa kiểm cách open-design phục vụ bản build Next.js của họ).

Có thể chuyển dần từng màn hình. `Open`: chưa có lần thử nào cho thấy React và code DOM hiện tại cùng chạy trên một trang như thế nào.

## Drizzle

Database là thay đổi chưa chắc chắn nhất, vì hai lý do:

- Drizzle hỗ trợ `better-sqlite3`. `Open`: chưa tra docs của Drizzle để biết nó có hỗ trợ `node:sqlite` không. Đổi sang `better-sqlite3` sẽ thêm một native module có binary gắn với version Node, trong khi `start:local` chạy `node@22.19.0` qua `npm exec`. Quyết định về local storage đã để ngỏ lựa chọn giữa `node:sqlite` và `better-sqlite3` [[1]](#ref-1).
- `Inferred`: một phần lớn code store là invariant và transaction của domain, ví dụ `deck-publication.ts`, `generation-store.ts` và `requests.ts`. ORM không thay được phần code đó. Tỉ lệ SQL boilerplate thuần chưa được đo.

Thứ tự: làm Express và layout của Host trước, chuyển React từng màn hình sau, Drizzle làm cuối cùng và chỉ làm khi tra docs và chạy thử cho thấy có lợi.

## References

1. <a id="ref-1"></a>[ADR-0001 — Local Storage & Data Ownership](../../../00-old/build/rebuild/adr/0001-local-storage.md)
