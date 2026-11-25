# Tiêu chí của cấu trúc đích

Đọc file này để biết một folder structure đích cho DeckAgent phải đạt những tiêu chí nào, vì sao cần từng tiêu chí và kiểm từng tiêu chí bằng cách nào.

Dùng các tiêu chí này để chấm mọi phương án cấu trúc, kể cả phương án trong [Layout đích](target-layout.md). Tiêu chí rút ra từ bốn nguồn: code hiện tại ([Khoảng cách hiện tại](current-gap.md)), các phần chịu tải của một agent application ([Các trục chịu tải](agent-load-axes.md)), các codebase tham khảo ([Codebase tham khảo](reference-codebases.md)) và convention Project Structure hiện tại [[1]](#ref-1).

## Tiêu chí

| ID | Tiêu chí | Lý do | Cách kiểm |
| --- | --- | --- | --- |
| TS-01 | Lần theo một endpoint mà không mở quá ba file: route, service, store | Hiện tại một endpoint nằm rải ở bốn chỗ, trong hai workspace ([Khoảng cách hiện tại](current-gap.md)) | Lần theo ba endpoint (tạo workspace, tải file đính kèm, gửi request), đếm số file và số workspace phải mở |
| TS-02 | Route, service và SQL của một feature nằm trong cùng một module | Folder `repositories/` dùng chung tách transaction khỏi invariant mà nó bảo vệ, ví dụ transaction publish trong `packages/presentation/deck/src/deck-publication.ts` | Sửa một feature mà không phải đụng folder của layer khác |
| TS-03 | Không có tầng pass-through: không có folder hay file chỉ để chuyển tiếp lời gọi | Express handler dài ba đến năm dòng đã là controller. Folder `controllers/` riêng chỉ thêm một lần nhảy file mà không thêm hành vi | Không có file nào mà mọi hàm của nó chỉ gọi sang một hàm khác với cùng tham số |
| TS-04 | Mỗi phần dùng kiểu cấu trúc hợp với nó: module CRUD dùng layer bên trong module, lõi agent dùng ports và adapters | Phần chịu tải của DeckAgent là vòng đời run, ranh giới capability, runtime adapter, event log và state machine của deck, không phải CRUD ([Các trục chịu tải](agent-load-axes.md)) | `runs/` không import Express và không import SQL driver. Agent runtime chỉ được gọi qua một port |
| TS-05 | Lõi agent có ranh giới rõ: vòng đời run, cấp capability tách khỏi thực thi tool, runtime adapter | Ranh giới capability là ranh giới bảo mật. OpenCode phải thay được | Lint chặn `tools/` tự cấp capability và chặn `runs/` import adapter cụ thể |
| TS-06 | Browser và Host là hai application, chỉ dùng chung `contracts` | Hiện tại `features/` mang hai nghĩa: Browser UI trong `apps/web/src/browser/features/` và Host workflow trong `apps/web/src/features/` | `apps/web` không import gì từ `apps/host`. `check:boundaries` hiện tại đã kiểm được loại import này |
| TS-07 | Hạ tầng dùng thư viện phổ biến: Express cho HTTP, React cho UI | Routing HTTP tự viết và DOM tạo tay khó đọc. Team đã quen cả hai thư viện ([Thư viện](libraries.md)) | Không còn bảng routing bằng regex và không còn helper tạo DOM bằng tay |
| TS-08 | Các module có chung một hình dạng, và một module chỉ thêm file khi có trách nhiệm thật | Hiện tại `apps/web/src/features/workspaces/` chỉ có `index.ts`, còn `apps/web/src/features/deck/` có 15 file xếp phẳng | Một đoạn văn mô tả được hình dạng module. Module nào khác hình dạng đó thì có lý do ghi ra |
| TS-09 | Boundary do tool chặn, không chỉ dựa vào review | open-design dùng Express và React mà vẫn có `server.ts` dài 18.959 dòng và route import thẳng SQL driver ([Codebase tham khảo](reference-codebases.md)). DeckAgent đã có `check:boundaries` và không được mất lớp bảo vệ này | Mỗi rule về chiều phụ thuộc có một lint rule hoặc check, và một negative fixture chứng minh check bắt được vi phạm |
| TS-10 | Code mới có chỗ đặt rõ ràng mà không cần tạo folder mới ở top level | open-design có 132 file ở top level của `apps/daemon/src/` vì code mới không có chỗ đặt định sẵn | Đặt thử các feature trong [Áp lực từ feature còn thiếu](feature-pressure.md): agent runtime thứ hai, skill do hệ thống chọn, canvas, design system tự tạo, connector, format export mới. Mỗi feature có đúng một chỗ đặt rõ ràng |
| TS-11 | Mỗi domain state chỉ có một đường ghi, dùng chung cho người dùng và agent | Canvas cho người dùng sửa deck bằng tay (UC-007), trong khi agent sửa deck qua tool. Hai đường ghi riêng sẽ làm invariant lệch nhau | Lint chặn route và tool ghi thẳng vào store của module khác. Route và tool của cùng một state gọi cùng một edit operation |
| TS-12 | Mọi đối tượng người dùng thấy dùng chung một cơ chế báo thay đổi và kiểm `version` khi ghi | Gap hai giao diện cùng thay đổi một đối tượng xuất hiện trong năm file use case ([Áp lực từ feature còn thiếu](feature-pressure.md)). Deck đã có pattern `version` cộng notice `deck-changed` | Mỗi store phát notice có `version`. Một test cho mỗi module chứng minh lệnh ghi có `version` cũ bị từ chối |
| TS-13 | Run có owner tổng quát, không gắn cứng với chat | Việc đề xuất design system từ file thương hiệu (UC-010) có thể cần một run không thuộc chat nào. Lifecycle contract hiện tại bắt buộc có `sessionId` | `runs/` không import module chats và contract của run không có trường `sessionId` |

## Không phải mục tiêu

- Không chép crypto-force hay open-design. Cả hai chỉ là nguồn tham khảo: học rule đích của họ, không học trạng thái hiện tại.
- Không đổi kiến trúc chỉ để đổi. Convention Project Structure hiện tại [[1]](#ref-1) đã gần với đích về mặt khái niệm. Mục tiêu là đặt code vào đúng chỗ và thay hạ tầng tự viết bằng thư viện.
- Không bắt buộc dùng ORM hay query builder. Chỉ dùng khi docs xác nhận hỗ trợ SQLite driver hiện tại và một lần thử cho thấy bớt được code ([Thư viện](libraries.md)). open-design cũng không dùng ORM.
- Không dừng làm feature để rewrite. Cấu trúc mới phải cho phép code cũ và code mới cùng chạy trong lúc chuyển.

## Trạng thái chấm điểm

`Proposed`: trên giấy, layout trong [Layout đích](target-layout.md) đạt các tiêu chí từ lần theo endpoint dễ dàng (TS-01) đến dùng thư viện phổ biến (TS-07) và hình dạng module chung (TS-08).

`Proposed`: bảng chỗ đặt code mới trong [Layout đích](target-layout.md) cho mỗi feature trong bài đặt thử một chỗ đặt (TS-10).

`Open`: chưa có bằng chứng cho boundary do tool chặn (TS-09). Lint rule chưa được viết. Một đường ghi cho mỗi state (TS-11), cơ chế báo thay đổi chung (TS-12) và owner tổng quát của run (TS-13) mới là rule trên giấy. Hình dạng contract của chúng chưa được thiết kế.

## References

1. <a id="ref-1"></a>[Project Structure](../../../conventions/project-structure.md)
