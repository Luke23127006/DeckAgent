---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Test analysis — workspace theo folder và chat mới"
milestone: mvp
created: 09-11-2026
---

# Test analysis — workspace theo folder và chat mới

<!-- Các bản ghi của Gate 1 (dev/development/test-strategy.md "Test basis register", "Test types and approaches", "Automation feasibility", "Gates"). PO duyệt chúng cùng các mục approach của testing-plan.md trước khi thiết kế bắt đầu.
     Build file viết bằng tiếng Việt với thuật ngữ tiếng Anh (dev/mvp/builds/_STYLE.md). ID của basis item do register đặt: FR-071.3 là item thứ ba cắt từ FR-071; FR-071.N1 cắt từ mục Notes; UC-013.A2a là phần đầu của luồng phụ A2 (phần sau là A2b). Bảng "Sentence map" nối từng đơn vị của spec với item của nó. -->

## At a glance

- **Mục đích:** PO quyết định ở **Gate 1** xem ta đã **tìm đủ cái cần test** chưa, và **type, level, độ sâu** nào phù hợp. File này giữ **bằng chứng**.
- **Use case:** UC-013, UC-012
- **Steps:** all
- **Alternatives:** all, trừ phần dời sang build sau ([matrix](./traceability-matrix.md), mục "Moved to a later build")
- **Spine:** [traceability-matrix.md](./traceability-matrix.md)
- **Approach, levels, targets:** [testing-plan.md](./testing-plan.md), mục "Test approach"
- **Nguồn đã đọc đủ nội dung:** UC-013, UC-012, FR-038, FR-048, FR-053, FR-071, FR-072, FR-073, FR-074, FR-083, FR-084, FR-141, FR-142, NFR-008, BR-004, BR-019, BR-020, DEC-010 đến DEC-013, research-checklist.md, windows-folders.md. **Chỉ đọc statement** của FR-065, FR-068, BR-005 và tiêu đề của NFR-001 đến NFR-012 (các mục này nằm ngoài scope).
- **Status:** _180 basis item (scope: 114 to test · 64 deferred · 2 excluded) · approval: PO đã approve scope của cả 180 item, 0 pending · mẫu số requirement coverage 114 · 230 đơn vị spec (178 normative, 19 explanatory, 33 definition) · 0 đơn vị normative chưa có item · 10 quality risk · 8 type (6 chọn, 2 không) và 6 aspect của security (3 chọn, 3 không) · 18 mechanism (18 assumed, 0 verified, 0 blocked) · 8 ambiguity (8 đã có ruling, 0 chờ vào spec) · 12 candidate gap_
- **Gate 1:** _Approved_ (PO, 09-11-2026). Gate 1 **đã đóng**. Các thay đổi bắt buộc đã áp dụng ở file này và ở mục "Test approach" của [testing-plan.md](./testing-plan.md); PO đã xác nhận build nhận của các item tách (SR-8a đến SR-8d), AM-1 và M18, và cho phép cập nhật spec cho AM-1, AM-2, AM-3, AM-5 và AM-8. Bước tiếp theo là Gate 2: Test Design trong [test-design.md](./test-design.md).

**Giới hạn cần biết sau khi đóng Gate 1:**
- **Scope, type và cách hiểu ambiguity đã có ruling của PO (09-11-2026).** Cột "PO ruling" của bảng Scope rulings và bảng Ambiguities cho thấy nguồn từng ruling. **Approval chỉ nói PO đã duyệt scope**, không nói item đã được Test Design bao phủ: việc đó thuộc Gate 2.
- **Năm quyết định hành vi của PO đã vào spec** (09-11-2026: AM-1, AM-2, AM-3, AM-5 và AM-8; xem cột Spec entry của bảng Ambiguities), nên dùng được làm expected result khi viết AC ở Gate 2. **AC hiện có chưa được sửa theo**, và Gate 2 phải rà chúng; xung đột đã biết là FR-071 AC-12 (tên giống từng byte tên folder) với tên folder NFD (AM-2).
- **Một người đọc làm cả bảng.** Con số "0 đơn vị normative chưa có item" là kết quả **tự đếm** của agent, và bảng Sentence map cho phép PO đếm lại. PO đã chấp nhận phương pháp ánh xạ hiện tại cho Gate 1 và không yêu cầu tái suy diễn độc lập 219 đơn vị ban đầu; 11 đơn vị thêm khi spec được cập nhật (09-11-2026) do agent ánh xạ cùng cách. Script kiểm cấu trúc bảng và cụm mở đầu nguyên văn; nó **không chứng minh** mọi yêu cầu đã được hiểu đúng về ngữ nghĩa.
- **Chưa kiểm AC hiện có.** Bảng dưới nói **mệnh đề nào cần test**, không nói AC nào đã phủ mệnh đề đó. Việc đó thuộc Gate 2.
- **Mọi candidate gap** ở mục 4 là **ứng viên**. PO approve CG-1 đến CG-10 làm đầu vào Gate 2; Gate 2 kiểm chúng bằng technique và **không thêm test case chỉ vì gap được liệt kê**.

## 1. Test basis register

<!-- Một dòng cho mỗi basis item. Risk lấy từ dòng FR hoặc NFR trong testing-plan.md (BR lấy mức cao nhất của các FR trích nó; flow của UC lấy mức cao nhất của các FR nó dùng). Scope: to test | deferred | excluded; mục deferred hoặc excluded ghi SR-n, trỏ tới bảng Scope rulings bên dưới. Approval: approved (PO đã ruling về scope của item) | pending (chưa có ruling; pending không làm nhỏ mẫu số coverage). Approval chỉ nói scope đã được duyệt, không nói item đã được thiết kế test. Ambiguity trỏ về mục 4. Danh sách đóng trong một giá trị của BR là một item; các phần tử là test data. -->

### FR-071 · Thêm workspace và chuyển workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-071.1 | FR-071 | Khi người dùng chọn một folder đọc được, DeckAgent thiết lập một workspace cho folder đó. | lifecycle | high | UNC dời (Z-10) | to test | approved |
| FR-071.2 | FR-071 | DeckAgent đặt tên workspace theo tên folder, và cắt còn tên dài nhất (BR-020) khi tên folder dài hơn. | range or format | high | AM-2 | to test | approved |
| FR-071.3 | FR-071 | DeckAgent làm workspace mới thành workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-071.4 | FR-071 | Khi folder đã là project folder của một workspace, DeckAgent làm workspace đó thành workspace đang dùng và không thiết lập workspace thứ hai. | multi-condition rule | high | | to test | approved |
| FR-071.5 | FR-071 | Khi folder đó đã được dời sang chỗ khác, workspace nhận chỗ mới làm project folder. | lifecycle | high | | to test | approved |
| FR-071.6 | FR-071 | Chuyển sang một workspace đã thiết lập thì DeckAgent không hỏi folder. | lifecycle | high | | to test | approved |
| FR-071.7 | FR-071 | Folder không đọc được thì DeckAgent không thiết lập workspace. | multi-condition rule | high | | to test | approved |
| FR-071.8 | FR-071 | Folder không thể làm project folder (BR-019) thì DeckAgent không thiết lập workspace, nói lý do, và nói rằng người dùng chọn được folder bên trong khi folder bên trong được phép. | multi-condition rule | high | | to test | approved |
| FR-071.9 | FR-071 | Thêm hoặc chuyển workspace giữ nguyên chat hiện tại và draft của nó. | invariant | high | | to test | approved |
| FR-071.10 | FR-071 | Thêm hoặc chuyển workspace không đổi file nào của người dùng. | invariant | high | | to test | approved |
| FR-071.11 | FR-071 | Thêm hoặc chuyển workspace không đọc file nào của folder. | invariant | high | | to test | approved |
| FR-071.12 | FR-071 | Thêm hoặc chuyển workspace không gửi gì tới model. | invariant | high | chưa có model | deferred (SR-1) | approved |
| FR-071.13 | FR-071 | Thêm hoặc chuyển workspace không dừng request nào. | invariant | high | chưa có request | deferred (SR-1) | approved |
| FR-071.14 | FR-071 | Chat mới vào workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-071.15 | FR-071 | Tên workspace lấy từ folder ở dạng NFC và không bị bỏ khoảng trắng nào (BR-020); folder giữ nguyên tên và path của nó. | range or format | high | AM-1, AM-2 | to test | approved |
| FR-071.N1 | FR-071 Notes; FR-073 Notes; UC-013 Notes | Folder từng có một workspace đã xoá thì thiết lập một workspace mới; chat của workspace đã xoá vẫn là ungrouped chat. | lifecycle | high | | to test | approved |

### FR-072 · Workspace mặc định từ lần khởi động đầu

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-072.1 | FR-072 | Từ lần khởi động đầu, DeckAgent có một default workspace không có project folder. | lifecycle | normal | | to test | approved |
| FR-072.2 | FR-072 | Default workspace có một tên do DeckAgent đặt. | lifecycle | normal | | to test | approved |
| FR-072.3 | FR-072 | Default workspace là workspace đang dùng cho đến khi người dùng chọn workspace khác. | lifecycle | normal | | to test | approved |
| FR-072.4a | FR-072 | Ở mỗi lần khởi động sau, workspace đang dùng là workspace đang dùng lúc DeckAgent dừng, khi workspace đó còn được thiết lập. | lifecycle | normal | | to test | approved |
| FR-072.4b | FR-072 | Nếu workspace đó không còn được thiết lập, workspace đang dùng là default workspace. | lifecycle | normal | | excluded (SR-10) | approved |
| FR-072.5 | FR-072 | Người dùng làm việc trong default workspace mà không chọn folder. | flow | normal | | to test | approved |
| FR-072.6 | FR-072 | DeckAgent không bao giờ xoá default workspace. | invariant | normal | | to test | approved |
| FR-072.7a | FR-072 | Chat của default workspace tồn tại mà không cần folder. | lifecycle | normal | | to test | approved |
| FR-072.7b | FR-072 | Chat của default workspace giữ conversation mà không cần folder. | invariant | normal | CG-11 | deferred (SR-8a) | approved |
| FR-072.7c | FR-072 | Chat của default workspace giữ deck mà không cần folder. | invariant | normal | CG-11 | deferred (SR-8c) | approved |

### FR-073 · Xoá workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-073.1 | FR-073 | DeckAgent chỉ xoá một workspace không phải default sau khi người dùng xác nhận. | lifecycle | high | AM-6 | to test | approved |
| FR-073.2 | FR-073 | Trước khi xoá, DeckAgent nói rằng project folder và chat của workspace vẫn còn. | lifecycle | high | | to test | approved |
| FR-073.3 | FR-073 | Xoá workspace không đổi folder và file nào của người dùng. | invariant | high | | to test | approved |
| FR-073.4a | FR-073 | Mỗi chat của workspace bị xoá trở thành một ungrouped chat. | lifecycle | high | | to test | approved |
| FR-073.4b | FR-073 | Ungrouped chat giữ selected model của nó (BR-004). | invariant | high | CG-11 | deferred (SR-8b) | approved |
| FR-073.4c | FR-073 | Ungrouped chat giữ conversation của nó (BR-004). | invariant | high | CG-11 | deferred (SR-8a) | approved |
| FR-073.4d | FR-073 | Ungrouped chat giữ deck của nó (BR-004). | invariant | high | CG-11 | deferred (SR-8c) | approved |
| FR-073.5 | FR-073 | Khi workspace bị xoá đang là workspace đang dùng, default workspace trở thành workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-073.6a | FR-073 | Khi một request trong chat của workspace đang chạy, DeckAgent không xoá gì. | lifecycle | high | | deferred (SR-1) | approved |
| FR-073.6b | FR-073 | Khi đó DeckAgent nói rằng request phải kết thúc trước. | lifecycle | high | | deferred (SR-1) | approved |
| FR-073.6c | FR-073 | Khi đó DeckAgent không dừng request nào. | invariant | high | | deferred (SR-1) | approved |
| FR-073.N1a | FR-073 Notes | Ungrouped chat không có project folder, như chat của default workspace. | lifecycle | high | | to test | approved |
| FR-073.N1b | FR-073 Notes | Agent không tới folder nào khi chưa được duyệt, với ungrouped chat (FR-077 sở hữu hành vi này). | invariant | high | | deferred (SR-2) | approved |
| FR-073.N2a | FR-073 Notes | Ungrouped chat không thuộc workspace nào, kể cả default workspace. | lifecycle | high | | to test | approved |

### FR-074 · Báo project folder không đọc được

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-074.1 | FR-074 | Khi project folder của một workspace không đọc được, DeckAgent nói như vậy. | multi-condition rule | high | | to test | approved |
| FR-074.2 | FR-074 | DeckAgent nêu tên workspace. | multi-condition rule | high | | to test | approved |
| FR-074.3 | FR-074 | DeckAgent nói người dùng làm gì tiếp, ví dụ đặt folder về chỗ cũ, cấp lại quyền hoặc chọn folder khác. | multi-condition rule | high | | to test | approved |
| FR-074.4 | FR-074 | DeckAgent không nêu nguyên nhân mà nó không biết, ví dụ việc xoá. | invariant | high | | to test | approved |
| FR-074.5 | FR-074 | DeckAgent không đọc file nào của folder trong lúc folder không đọc được. | invariant | high | | to test | approved |
| FR-074.6 | FR-074 | Workspace vẫn được thiết lập. | lifecycle | high | | to test | approved |
| FR-074.7a | FR-074 | Mỗi chat của workspace vẫn đọc được. | lifecycle | high | | to test | approved |
| FR-074.7b | FR-074 | Mỗi chat đó giữ conversation. | invariant | high | CG-11 | deferred (SR-8a) | approved |
| FR-074.7c | FR-074 | Mỗi chat đó giữ deck. | invariant | high | CG-11 | deferred (SR-8c) | approved |

### FR-083 · Chọn project folder khác cho workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-083.1 | FR-083 | Khi người dùng chọn folder khác cho một workspace không phải default, DeckAgent làm folder đó thành project folder của workspace. | lifecycle | high | AM-3 | to test | approved |
| FR-083.2 | FR-083 | DeckAgent giữ workspace, tên của nó và chat của nó. | invariant | high | | to test | approved |
| FR-083.3 | FR-083 | DeckAgent không đọc file nào của folder chỉ vì lần chọn đó. | invariant | high | | to test | approved |
| FR-083.4 | FR-083 | DeckAgent không bao giờ tự đổi project folder. | invariant | high | | to test | approved |
| FR-083.5 | FR-083 | Khi folder được chọn là project folder của workspace khác, DeckAgent không đổi workspace nào và nói workspace nào dùng folder đó. | multi-condition rule | high | | to test | approved |
| FR-083.6 | FR-083 | Khi folder được chọn không đọc được, DeckAgent không đổi workspace nào và nói folder không đọc được. | multi-condition rule | high | | to test | approved |
| FR-083.7 | FR-083 | Khi folder được chọn không thể làm project folder (BR-019), DeckAgent không đổi workspace nào và nói vì sao. | multi-condition rule | high | | to test | approved |
| FR-083.8a | FR-083 | Khi một request trong chat của workspace đang chạy, DeckAgent không đổi project folder. | lifecycle | high | | deferred (SR-1) | approved |
| FR-083.8b | FR-083 | Khi đó DeckAgent nói rằng request phải kết thúc trước. | lifecycle | high | | deferred (SR-1) | approved |
| FR-083.8c | FR-083 | Khi đó DeckAgent không dừng request nào. | invariant | high | | deferred (SR-1) | approved |
| FR-083.9 | FR-083 | Khi người dùng chọn folder cho default workspace, DeckAgent từ chối, không đổi trạng thái nào và nói vì sao: default workspace không có project folder. | multi-condition rule | high | AM-3 | to test | approved |

### FR-142 · Báo folder khác ở chỗ của project folder

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-142.1 | FR-142 | Khi chỗ của project folder chứa một folder không phải folder người dùng đã chọn, DeckAgent nói có folder khác ở đó. | multi-condition rule | high | | to test | approved |
| FR-142.2 | FR-142 | DeckAgent nêu tên workspace. | multi-condition rule | high | | to test | approved |
| FR-142.3 | FR-142 | DeckAgent không đọc file nào của folder khác đó. | invariant | high | | to test | approved |
| FR-142.4 | FR-142 | Người dùng dùng được folder đó cho workspace; khi đó DeckAgent làm nó thành project folder theo cùng điều kiện như chọn folder khác (FR-083). | lifecycle | high | | to test | approved |
| FR-142.5 | FR-142 | Cho đến lúc đó workspace vẫn được thiết lập. | lifecycle | high | | to test | approved |
| FR-142.6a | FR-142 | Mỗi chat của workspace vẫn đọc được. | lifecycle | high | | to test | approved |
| FR-142.6b | FR-142 | Mỗi chat đó giữ conversation. | invariant | high | CG-11 | deferred (SR-8a) | approved |
| FR-142.6c | FR-142 | Mỗi chat đó giữ deck. | invariant | high | CG-11 | deferred (SR-8c) | approved |
| FR-142.N3 | FR-142 Notes | Thêm folder khác đó như một workspace thiết lập một workspace mới; workspace đầu tiên tiếp tục báo có folder khác. | lifecycle | high | | to test | approved |

### FR-084 · Giữ nguyên file của project folder

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-084.1a | FR-084 | Khi DeckAgent giữ công việc của chat, nó không tạo, đổi, dời hay xoá file nào trong project folder, kể cả file ẩn. | invariant | high | | to test | approved |
| FR-084.1b | FR-084 | Khi DeckAgent xử lý một request, nó không tạo, đổi, dời hay xoá file nào trong project folder. | invariant | high | CG-11 | deferred (SR-2) | approved |
| FR-084.1c | FR-084 | Khi DeckAgent hiện một deck, nó không tạo, đổi, dời hay xoá file nào trong project folder. | invariant | high | CG-11 | deferred (SR-8c) | approved |
| FR-084.2 | FR-084 | File người dùng đưa làm attachment giữ nguyên như người dùng đưa. | invariant | high | | deferred (SR-6) | approved |
| FR-084.3 | FR-084 | Một file chỉ xuất hiện trong project folder qua việc export người dùng chọn. | invariant | high | | deferred (SR-11) | approved |

### FR-141 · Đổi tên workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-141.1 | FR-141 | Khi người dùng đặt tên mới cho một workspace, DeckAgent đặt tên đó cho workspace, kể cả default workspace. | lifecycle | normal | | to test | approved |
| FR-141.2 | FR-141 | Đổi tên giữ project folder và chat của workspace. | invariant | normal | | to test | approved |
| FR-141.3 | FR-141 | Đổi tên không đổi folder và file nào của người dùng. | invariant | normal | | to test | approved |
| FR-141.4 | FR-141 | Đổi tên không dừng request nào. | invariant | normal | CG-11 | deferred (SR-2) | approved |
| FR-141.5 | FR-141 | Hai workspace được phép trùng tên. | multi-condition rule | normal | | to test | approved |
| FR-141.6 | FR-141 | DeckAgent bỏ khoảng trắng ở hai đầu của tên mới (BR-020 V-3: các ký tự mà `String.prototype.trim()` của JavaScript bỏ). | range or format | normal | AM-1 | to test | approved |
| FR-141.7 | FR-141 | Tên bị từ chối (BR-020) không đổi gì: workspace giữ tên cũ. | multi-condition rule | normal | | to test | approved |
| FR-141.8 | FR-141 | DeckAgent nói vì sao tên bị từ chối. | multi-condition rule | normal | | to test | approved |
| FR-141.9 | FR-141 | DeckAgent giữ tên mới ở dạng NFC (BR-020). | range or format | normal | AM-2 | to test | approved |

### FR-143 · Từ chối thao tác thay đổi trạng thái từ client không được phép

<!-- Requirement mới theo AM-5 (QR-8). Rủi ro chưa đặt trong testing-plan.md nên mặc định high. -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-143.1 | FR-143 | Khi một thao tác thay đổi trạng thái workspace hoặc chat đến từ client mà DeckAgent không cho phép, DeckAgent từ chối thao tác và không đổi workspace nào, chat nào. | multi-condition rule | high | AM-5 | to test | approved |
| FR-143.2 | FR-143 | Một trang web bên ngoài DeckAgent không phải client được phép. | multi-condition rule | high | AM-5 | to test | approved |

### FR-053 · Bắt đầu chat mới

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-053.1a | FR-053 | Bắt đầu chat mới giữ nguyên mọi chat khác. | invariant | normal | | to test | approved |
| FR-053.1b | FR-053 | Bắt đầu chat mới giữ nguyên deck của các chat khác. | invariant | normal | CG-11 | deferred (SR-8c) | approved |
| FR-053.1c | FR-053 | Bắt đầu chat mới giữ nguyên draft của các chat khác. | invariant | normal | | to test | approved |
| FR-053.2 | FR-053 | Bắt đầu chat mới không dừng request nào. | invariant | normal | | deferred (SR-1) | approved |
| FR-053.3 | FR-053 | Chat mới trở thành chat hiện tại trong workspace đang dùng. | lifecycle | normal | | to test | approved |
| FR-053.4 | FR-053 | Chat mới không có conversation, không có deck và có draft rỗng. | lifecycle | normal | | to test | approved |
| FR-053.5 | FR-053 | Chat mới không lấy gì từ chat khác. | invariant | normal | | to test | approved |
| FR-053.6 | FR-053 | Chat mới nhận selected model và reasoning level của lần chọn model gần nhất ở bất kỳ chat nào, khi model đó còn selectable (BR-005). | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.7a | FR-053 | Khi chưa từng chọn model nào, chat mới không có selected model. | multi-condition rule | normal | CG-12 | to test | approved |
| FR-053.7b | FR-053 | Khi model của lần chọn gần nhất không còn selectable, chat mới không có selected model. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1a | FR-053 Notes | DeckAgent không lùi về các lần chọn model trước đó. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1b | FR-053 Notes | Một model bị gỡ rồi thêm lại được tính khi nó selectable. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1c | FR-053 Notes | Tầm với của agent giống nhau ở mọi chat (FR-077 sở hữu hành vi này). | invariant | normal | | deferred (SR-2) | approved |
| FR-053.N2 | FR-053 Notes; UC-012 Notes | Một chat chứa nhiều nhất một deck, nên deck khác bắt đầu ở chat mới. | invariant | normal | | deferred (SR-8c) | approved |

### FR-048 · Hiện các chat cũ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-048.1 | FR-048 | Khi người dùng xin công việc cũ, DeckAgent hiện các chat cũ của workspace đang dùng mà người dùng được mở (BR-004). | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.2 | FR-048 | Danh sách gồm cả chat từ trước lần DeckAgent khởi động gần nhất. | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.3 | FR-048 | DeckAgent hiện ungrouped chat tách riêng, dù workspace nào đang dùng. | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.4 | FR-048 | DeckAgent đặt tên mỗi chat theo nội dung của nó. | multi-condition rule | normal | | deferred (SR-3) | approved |
| FR-048.5 | FR-048 | DeckAgent nói chat đổi lần cuối khi nào. | multi-condition rule | normal | | deferred (SR-3) | approved |
| FR-048.6 | FR-048 | DeckAgent nói chat có slide hay không. | multi-condition rule | normal | | deferred (SR-4) | approved |
| FR-048.7 | FR-048 | Khi không có chat cũ nào, DeckAgent nói như vậy, và chat hiện tại cùng draft của nó giữ nguyên. | multi-condition rule | normal | | to test | approved |

### FR-038 · Giữ draft của chat

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-038.1a | FR-038 | DeckAgent giữ draft của mỗi chat khi người dùng ở chat khác, và hiện nguyên vẹn khi người dùng quay lại. | lifecycle | normal | | to test | approved |
| FR-038.1b | FR-038 | DeckAgent giữ draft của mỗi chat khi người dùng ở màn setup, và hiện nguyên vẹn khi người dùng quay lại. | lifecycle | normal | CG-11 | deferred (SR-9) | approved |
| FR-038.2 | FR-038 | DeckAgent giữ draft khi interface được tải lại, hoặc đóng rồi mở lại. | lifecycle | normal | | to test | approved |
| FR-038.3 | FR-038 | Mọi interface đang mở hiện cùng draft của một chat. | lifecycle | normal | | to test | approved |
| FR-038.4a | FR-038 | Việc đi chỗ khác không thêm gì vào draft. | invariant | normal | | to test | approved |
| FR-038.4b | FR-038 | Việc đi chỗ khác không gửi gì. | invariant | normal | CG-11 | deferred (SR-2) | approved |
| FR-038.5 | FR-038 | DeckAgent không giữ draft sau khi DeckAgent dừng. | lifecycle | normal | | to test | approved |

### NFR-008 · Giữ trạng thái đã lưu sau khi kết thúc bất ngờ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| NFR-008.1a | NFR-008 | Khi DeckAgent kết thúc bất ngờ, trạng thái đã lưu gần nhất của mỗi chat được giữ. | reliability | high | AM-7 | to test | approved |
| NFR-008.1b | NFR-008 | Trạng thái đã lưu gần nhất của deck được giữ. | reliability | high | | deferred (SR-8d) | approved |
| NFR-008.1c | NFR-008 | Trạng thái đã lưu gần nhất của setup provider và model được giữ. | reliability | high | | deferred (SR-9) | approved |
| NFR-008.2a | NFR-008 | Sau khi DeckAgent khởi động lại, mỗi chat mở ở trạng thái đã lưu gần nhất. | reliability | high | | to test | approved |
| NFR-008.2b | NFR-008 | Sau khi khởi động lại, mỗi chat nhận một request mới. | reliability | high | | deferred (SR-7) | approved |
| NFR-008.3 | NFR-008 | Thay đổi chưa xong của một slide không hiện như kết quả đã xong. | reliability | high | | deferred (SR-8d) | approved |

### BR-004 · Chat được giữ làm công việc cũ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BR-004.V1 | BR-004 | DeckAgent giữ mọi chat mà người dùng đã gửi ít nhất một request; chat chưa gửi request không bắt buộc phải hiện. | multi-condition rule | high | | deferred (SR-3) | approved |
| BR-004.V2 | BR-004 | DeckAgent không xoá chat, conversation hay deck nào vì tuổi của chúng. | invariant | high | | excluded (SR-10) | approved |
| BR-004.V3 | BR-004 | Mọi chat của workspace bị xoá được giữ, như ungrouped chat. | lifecycle | high | | to test | approved |

### BR-019 · Folder không thể làm project folder

<!-- Các danh sách đóng (V-2 phần ba folder, V-4 phần năm key folder) là một item mỗi danh sách; phần tử của danh sách là test data. Ở mức rủi ro high, tiêu chí của strategy là mỗi phần tử có một test (test-strategy.md "Closed lists"). V-1 không phải danh sách đóng (AM-8; spec V-1 đã bỏ dòng "Closed list."): root của mọi drive là một lớp giá trị, `C:\` và `D:\` chỉ là ví dụ, và Gate 2 chia lớp theo dạng drive. -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BR-019.R0 | BR-019 | DeckAgent so sánh folder sau khi đi theo link. | multi-condition rule | high | CG-7 | to test | approved |
| BR-019.R1 | BR-019 | Folder bị từ chối bởi một value thì bị từ chối bất kể các value khác nói gì. | multi-condition rule | high | | to test | approved |
| BR-019.V1 | BR-019 | DeckAgent từ chối root của mọi drive. `C:\` và `D:\` chỉ là ví dụ, không phải hai phần tử của một danh sách đóng. | range or format | high | AM-8, CG-4 | to test | approved |
| BR-019.V2a | BR-019 | DeckAgent từ chối `C:\Windows`, `C:\Program Files` và `C:\Program Files (x86)` (danh sách đóng, ba phần tử). | multi-condition rule | high | CG-5 | to test | approved |
| BR-019.V2b | BR-019 | DeckAgent từ chối mọi folder bên trong ba folder đó. | multi-condition rule | high | | to test | approved |
| BR-019.V2c | BR-019 | DeckAgent từ chối mọi folder chứa một trong ba folder đó. | multi-condition rule | high | | to test | approved |
| BR-019.V3a | BR-019 | DeckAgent từ chối chính folder của người dùng, ví dụ `C:\Users\<tên>`. | multi-condition rule | high | | to test | approved |
| BR-019.V3b | BR-019 | DeckAgent không từ chối, theo value này, một folder bên trong folder của người dùng. | multi-condition rule | high | CG-3 | to test | approved |
| BR-019.V4a | BR-019 | DeckAgent từ chối `.ssh`, `.aws`, `.gnupg`, `.kube` và `.docker` nằm trong folder của người dùng (danh sách đóng, năm phần tử). | multi-condition rule | high | CG-1, CG-2 | to test | approved |
| BR-019.V4b | BR-019 | DeckAgent từ chối mọi folder bên trong năm folder đó. | multi-condition rule | high | | to test | approved |
| BR-019.V5a | BR-019 | DeckAgent từ chối chính data folder của DeckAgent. | multi-condition rule | high | | to test | approved |
| BR-019.V5b | BR-019 | DeckAgent từ chối mọi folder bên trong data folder. | multi-condition rule | high | | to test | approved |
| BR-019.V5c | BR-019 | DeckAgent từ chối mọi folder chứa data folder. | multi-condition rule | high | CG-6 | to test | approved |

### BR-020 · Tên bị từ chối cho workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BR-020.R | BR-020 | DeckAgent so tên với luật sau khi chuẩn hoá NFC và, với tên người dùng đặt, sau khi bỏ khoảng trắng ở hai đầu. | range or format | high | AM-1, AM-2, CG-10 | to test | approved |
| BR-020.V1 | BR-020 | DeckAgent từ chối tên không có ký tự nào sau khi bỏ khoảng trắng ở hai đầu. | range or format | high | | to test | approved |
| BR-020.V2a | BR-020 | DeckAgent nhận tên dài tối đa 100 ký tự, gồm cả 100, và từ chối tên dài hơn. | range or format | high | CG-8 | to test | approved |
| BR-020.V2b | BR-020 | Một ký tự là một Unicode code point sau khi chuẩn hoá NFC, nên "Việt" dài 4 ký tự. | range or format | high | AM-2, CG-9 | to test | approved |
| BR-020.V2c | BR-020 | DeckAgent chuẩn hoá tên thành NFC trước khi đếm ký tự, áp giới hạn độ dài và lưu tên, cho cả tên lấy từ folder và tên người dùng đặt; folder giữ nguyên tên của nó. | range or format | high | AM-2 | to test | approved |
| BR-020.V3 | BR-020 | Khoảng trắng là các ký tự mà `String.prototype.trim()` của JavaScript bỏ ở hai đầu (dấu cách, tab, no-break space U+00A0, ideographic space U+3000). DeckAgent bỏ chúng khỏi tên người dùng đặt và không bỏ gì khỏi tên lấy từ folder. | range or format | high | AM-1, CG-10 | to test | approved |

### UC-013 · Giữ công việc của deck trong workspace của các folder

<!-- Mỗi step và mỗi alternative là một item (flow). Một flow gồm hành vi thuộc nhiều phạm vi (cần request, model, conversation hoặc deck, và không cần) thì tách thành các item a, b, c, d, mỗi item một phạm vi, để scope đúng với toàn bộ item. Các câu bên trong chúng được ánh xạ ở Sentence map; mục Cross-reference mismatches nêu chỗ không khớp. -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| UC-013.S1 | UC-013 | Người dùng chọn làm việc ở workspace khác; DeckAgent hiện mỗi workspace theo tên, default workspace trong đó, và workspace nào đang dùng; chat hiện tại và draft giữ nguyên. | flow | high | X1 | to test | approved |
| UC-013.S2a | UC-013 | Người dùng chọn một folder cho workspace mới; DeckAgent thiết lập workspace, đặt tên theo folder, làm nó đang dùng, không đọc file của folder, không đổi file của người dùng, và giữ chat hiện tại cùng draft. | flow | high | | to test | approved |
| UC-013.S2b | UC-013 | Khi đó DeckAgent không gửi gì tới model và giữ mọi request đang chạy trong chat của chúng. | flow | high | | deferred (SR-1) | approved |
| UC-013.S3a | UC-013 | Người dùng làm việc trong workspace đang dùng; DeckAgent đặt mỗi chat mới vào workspace đó, và không tạo, đổi hay xoá file trong project folder. | flow | high | | to test | approved |
| UC-013.S3b | UC-013 | DeckAgent hiện các chat của workspace đang dùng như công việc cũ (BR-004). | flow | normal | | deferred (SR-3) | approved |
| UC-013.A1 | UC-013 | Khi folder đã là project folder của một workspace, DeckAgent làm workspace đó đang dùng và không thiết lập workspace thứ hai; tiếp tục ở S3. | flow | high | | to test | approved |
| UC-013.A2a | UC-013 | Khi người dùng xoá một workspace không phải default và không có request đang chạy, DeckAgent nói folder và chat vẫn còn, rồi hỏi xác nhận; khi xác nhận thì xoá workspace, không đổi file của người dùng, đổi chat của nó thành ungrouped chat, và làm default workspace đang dùng nếu workspace bị xoá đang dùng; khi huỷ thì không xoá gì. | flow | high | | to test | approved |
| UC-013.A2b | UC-013 | Ungrouped chat giữ selected model của nó (BR-004). | flow | high | CG-11 | deferred (SR-8b) | approved |
| UC-013.A2c | UC-013 | Ungrouped chat giữ conversation của nó (BR-004). | flow | high | CG-11 | deferred (SR-8a) | approved |
| UC-013.A2d | UC-013 | Ungrouped chat giữ deck của nó (BR-004). | flow | high | CG-11 | deferred (SR-8c) | approved |
| UC-013.A3 | UC-013 | Khi project folder của một workspace không đọc được, DeckAgent nói như vậy, nêu tên workspace, nói người dùng làm gì tiếp, không nêu nguyên nhân nó không biết, và giữ workspace cùng chat đọc được. | flow | high | | to test | approved |
| UC-013.A5 | UC-013 | Khi người dùng xoá workspace hoặc chọn folder khác trong lúc một request của workspace đang chạy, DeckAgent không đổi workspace nào, nói request phải kết thúc trước và không dừng request. | flow | high | | deferred (SR-1) | approved |
| UC-013.A6a | UC-013 | Khi người dùng chọn một folder khác đọc được mà chưa workspace nào có, cho workspace không phải default và không có request đang chạy, DeckAgent làm nó thành project folder, giữ workspace và chat, và không đọc file của folder. | flow | high | | to test | approved |
| UC-013.A6b | UC-013 | Khi đó DeckAgent không gửi gì tới model. | flow | high | | deferred (SR-2) | approved |
| UC-013.A7a | UC-013 | Khi người dùng chọn một workspace đã thiết lập, DeckAgent làm nó đang dùng, không hỏi folder, không đổi file của người dùng, và giữ chat hiện tại cùng draft; tiếp tục ở S3. | flow | high | | to test | approved |
| UC-013.A7b | UC-013 | Khi đó DeckAgent giữ mọi request đang chạy trong chat của chúng. | flow | high | | deferred (SR-1) | approved |
| UC-013.A8 | UC-013 | Khi folder được chọn cho một workspace là folder của workspace khác, không đọc được hoặc bị từ chối, DeckAgent không đổi workspace nào và nói lý do. | flow | high | | to test | approved |
| UC-013.A9 | UC-013 | Khi người dùng không chọn folder, hoặc folder không đọc được hoặc không thể làm project folder, DeckAgent không thiết lập workspace, giữ workspace đang dùng, và nói lý do. | flow | high | X2 | to test | approved |
| UC-013.A10 | UC-013 | Khi DeckAgent khởi động lần đầu, nó làm default workspace đang dùng và không hỏi folder; tiếp tục ở S3. | flow | normal | | to test | approved |
| UC-013.A11a | UC-013 | Khi người dùng đặt tên mới cho workspace, DeckAgent đặt tên đó, giữ project folder và chat, và không đổi file của người dùng. | flow | normal | | to test | approved |
| UC-013.A11b | UC-013 | Khi đó DeckAgent giữ mọi request đang chạy trong chat của workspace. | flow | normal | | deferred (SR-2) | approved |
| UC-013.A12 | UC-013 | Khi chỗ của project folder chứa một folder người dùng chưa chọn, DeckAgent nói có folder khác, nêu tên workspace, không đọc file, đề nghị dùng folder đó cho workspace (tiếp tục như A6), và giữ workspace cùng chat đọc được. | flow | high | | to test | approved |
| UC-013.A13 | UC-013 | Khi tên người dùng đặt bị từ chối (BR-020), DeckAgent giữ tên cũ, nói vì sao tên bị từ chối và không đổi file. | flow | normal | | to test | approved |
| UC-013.G1 | UC-013 | Mọi file của người dùng trong project folder giữ nguyên, và DeckAgent không đổi, dời hay xoá file nào của người dùng. | invariant | high | | to test | approved |
| UC-013.G2a | UC-013 | DeckAgent không xoá chat nào. | invariant | high | | to test | approved |
| UC-013.G2b | UC-013 | DeckAgent không xoá conversation nào. | invariant | high | CG-11 | deferred (SR-8a) | approved |
| UC-013.G2c | UC-013 | DeckAgent không xoá deck nào. | invariant | high | CG-11 | deferred (SR-8c) | approved |
| UC-013.G3 | UC-013 | Không request đang chạy nào bị dừng. | invariant | high | | deferred (SR-2) | approved |
| UC-013.N1 | UC-013 Notes | Agent của chat đọc file của project folder mà không hỏi (FR-077 sở hữu hành vi này). | invariant | high | | deferred (SR-2) | approved |
| UC-013.N2 | UC-013 Notes | File của project folder được gọi tên trong text của request; DeckAgent không có tham chiếu đặt tên riêng (UC-003 sở hữu hành vi này). | multi-condition rule | high | | deferred (SR-2) | approved |

### UC-012 · Bắt đầu chat mới cho một deck khác

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| UC-012.S1a | UC-012 | Người dùng chọn bắt đầu chat mới; DeckAgent giữ chat vừa rời cùng draft của nó, đặt chat mới thành chat hiện tại trong workspace đang dùng với không conversation, không deck, draft rỗng, và không lấy gì từ chat khác. | flow | normal | | to test | approved |
| UC-012.S1b | UC-012 | DeckAgent giữ deck của chat vừa rời. | flow | normal | CG-11 | deferred (SR-8c) | approved |
| UC-012.S1c | UC-012 | DeckAgent giữ request đang chạy ở chat vừa rời. | flow | normal | | deferred (SR-1) | approved |
| UC-012.S2a | UC-012 | DeckAgent hiện selected model của chat mới theo lần chọn model gần nhất (BR-005). | flow | normal | | deferred (SR-5) | approved |
| UC-012.S2b | UC-012 | DeckAgent không gửi gì và nhận request đầu tiên. | flow | normal | X3 | deferred (SR-2) | approved |
| UC-012.S2c | UC-012 | DeckAgent không dựng deck cho chat mới. | flow | normal | | to test | approved |
| UC-012.A1a | UC-012 | Khi chưa từng chọn model, DeckAgent để chat mới không có selected model, nói như vậy và không tự chọn model khác. | flow | normal | X4 | to test | approved |
| UC-012.A1b | UC-012 | Khi model của lần chọn gần nhất không còn selectable, DeckAgent để chat mới không có selected model, nói như vậy và không tự chọn model khác. | flow | normal | X4 | deferred (SR-5) | approved |
| UC-012.N1 | UC-012 Notes | Archive nguồn đã export, đính kèm vào chat mới, là material như mọi attachment; không có gì được import thành deck để sửa. | multi-condition rule | normal | | deferred (SR-13) | approved |

### Scope rulings

<!-- Mỗi dòng là một lý do khiến item bị excluded hoặc deferred. PO ruling ghi ruling đã có kèm nguồn và ngày, hoặc "pending" khi PO chưa quyết; item chỉ có hiệu lực excluded hoặc deferred sau ruling. † đánh dấu item mà nguồn của ruling trước ngày 09-11-2026 chưa gọi tên nguyên văn. Z-n là ruling thiết kế đã ghi ở test-design.md của build này; ở build mới, ruling phạm vi ghi thẳng ở đây. -->

| ID | Lý do | Build nhận | PO ruling | Items |
|---|---|---|---|---|
| SR-1 | Hành vi cần một request đang chạy, hoặc một model nhận dữ liệu. Build này chưa có request và model, nên assert luôn pass. | Build 3 | **Đã có**: matrix "Moved to a later build" hàng 1 và hàng 2 (RQ-15, [#56](https://github.com/Luke23127006/DeckAgent/issues/56)); test-design Z-12 (09-11-2026). Các vế "nói request phải kết thúc trước" và "không dừng request" của FR-073 và FR-083 cùng mệnh đề với hàng 1, mà matrix ghi ở mức mệnh đề. | FR-071.12, FR-071.13, FR-053.2, FR-073.6a, FR-073.6b, FR-073.6c, FR-083.8a, FR-083.8b, FR-083.8c, UC-013.S2b, UC-013.A5, UC-013.A7b, UC-012.S1c |
| SR-2 | Cùng nguyên nhân với SR-1 (cần request hoặc model), nhưng ở sự kiện mà matrix chưa liệt kê: đổi tên, chọn folder cho workspace, rời chat, quy tắc chung của UC và FR-084. | Build 3 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Các hành vi cần request hoặc agent chưa kiểm chứng đầy đủ ở Build 1. | FR-141.4, UC-013.A11b, UC-013.A6b, FR-038.4b, FR-084.1b, UC-013.G3, UC-012.S2b, UC-013.N1, UC-013.N2, FR-073.N1b, FR-053.N1c |
| SR-3 | Danh sách chat cũ, tên chat và quy tắc "chat nào được giữ" cần request đã gửi. | Build 3 | **Đã có**: matrix hàng FR-048 (P-2, 08-11-2026), hàng AC-1 của FR-048 (Z-13, 09-11-2026), hàng đặt tên chat (RQ-13) và dòng BR-004 ("V-1, V-2 ở build 3"). Mục † là step của UC nhắc lại FR-048: PO, 09-11-2026 (duyệt Gate 1), cùng hành vi với FR-048. | FR-048.1, FR-048.2, FR-048.3, FR-048.4, FR-048.5, BR-004.V1, UC-013.S3b† |
| SR-4 | Việc nói chat có slide hay không cần deck. | Build 5 | **Đã có**: matrix hàng "nói chat có slide không" (P-2, 08-11-2026). | FR-048.6 |
| SR-5 | Chat mới lấy selected model của lần chọn gần nhất cần provider. | Build 2 | **Đã có**: matrix hàng "Chat mới lấy model của lần chọn gần nhất" (FR-053.6). Mục † là mệnh đề khác của cùng quy tắc hoặc step của UC nhắc lại nó: PO, 09-11-2026 (duyệt Gate 1), provider và model selection là dependency phù hợp. | FR-053.6, FR-053.7b†, FR-053.N1a†, FR-053.N1b†, UC-012.S2a†, UC-012.A1b† |
| SR-6 | File người dùng đưa làm attachment cần attachment. | Build 3 | **Đã có**: test-design Z-3 (08-11-2026) và matrix. | FR-084.2 |
| SR-7 | Chat nhận request mới sau khi DeckAgent kết thúc bất ngờ cần request. | Build 3 | **Đã có**: test-design Z-14 (09-11-2026) và matrix. | NFR-008.2b |
| SR-8a | Việc giữ **conversation** của chat cần conversation, mà conversation chỉ có từ khi request gửi được. | Build 3 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Item nêu nhiều thành phần được tách theo dependency, mỗi phần ở build đầu tiên test được (RQ-15), không đợi build có thành phần muộn nhất. Build nhận của từng phần do agent gán từ mvp-build-order.md mục 10; PO đã xác nhận (09-11-2026). | FR-072.7b, FR-073.4c, FR-074.7b, FR-142.6b, UC-013.A2c, UC-013.G2b |
| SR-8b | Việc giữ **selected model** của chat cần model selection. | Build 2 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Item nêu nhiều thành phần được tách theo dependency, mỗi phần ở build đầu tiên test được (RQ-15), không đợi build có thành phần muộn nhất. Build nhận của từng phần do agent gán từ mvp-build-order.md mục 10; PO đã xác nhận (09-11-2026). | FR-073.4b, UC-013.A2b |
| SR-8c | Việc giữ hoặc hiện **deck** cần deck, mà deck chỉ có từ build dựng slide. | Build 5 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Item nêu nhiều thành phần được tách theo dependency, mỗi phần ở build đầu tiên test được (RQ-15), không đợi build có thành phần muộn nhất. Build nhận của từng phần do agent gán từ mvp-build-order.md mục 10; PO đã xác nhận (09-11-2026). | FR-072.7c, FR-073.4d, FR-074.7c, FR-142.6c, UC-013.A2d, UC-013.G2c, FR-053.1b, FR-084.1c, UC-012.S1b, FR-053.N2 |
| SR-8d | Phép kiểm **deck và slide sau khi DeckAgent kết thúc bất ngờ** cần deck (build 5) và điểm chèn lỗi trên đường ghi deck và slide (M13). M13 mới có kế hoạch cho chat và chưa verified, nên build 5 chưa có cơ chế kiểm đáng tin; mvp-build-order.md mục 10 gán NFR-008 cho build 6, build có mục đích giữ dữ liệu qua lần khởi động lại. **Dependency:** M13 mở rộng tới đường ghi deck và slide. Nếu implementation plan của build 5 có điểm chèn đáng tin, PO có thể kéo phép kiểm về build 5. | Build 6 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Item nêu nhiều thành phần được tách theo dependency, mỗi phần ở build đầu tiên test được (RQ-15), không đợi build có thành phần muộn nhất. Build nhận của từng phần do agent gán từ mvp-build-order.md mục 10; PO đã xác nhận (09-11-2026). | NFR-008.1b, NFR-008.3 |
| SR-9 | Việc giữ trạng thái khi ở màn setup, và giữ setup provider và model sau khi kết thúc bất ngờ, cần màn setup và provider. | Build 2 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). Cần màn setup và provider. | FR-038.1b, NFR-008.1c |
| SR-10 | Excluded: một lần chạy test không quan sát được điều này, hoặc người dùng không tạo được tình huống. | — | **Đã có**: test-design Z-5 (FR-072.4b) và Z-6 (BR-004.V2), 08-11-2026. | FR-072.4b, BR-004.V2 |
| SR-11 | Deferred: export thuộc backlog (UC-004, FR-085) và chưa có trong spec của MVP. Vế "không file nào khác xuất hiện" đã nằm ở FR-084.1a. Item không bị xoá và không bị loại bỏ vĩnh viễn. | Chưa có build (khi export vào scope) | **Đã có**: PO, 09-11-2026 (duyệt Gate 1): đổi từ excluded sang deferred. Bất biến "không tự ghi file vào project folder" vẫn được kiểm qua FR-084.1a. | FR-084.3 |
| SR-12 | Một nhóm dữ liệu của FR-071.1: folder trên đường dẫn mạng UNC. Đây không phải scope của cả item; phần còn lại của FR-071.1 vẫn to test. | Chưa có build | **Đã có**: test-design Z-10 (09-11-2026) và matrix; open-questions.md mục 20. | FR-071.1 (chỉ nhóm UNC) |
| SR-13 | Archive đã export đính kèm vào chat mới là attachment. Cần attachment. | Build 3 | **Đã có**: PO, 09-11-2026 (duyệt Gate 1). | UC-012.N1 |

**Tóm lại:** trong 66 item excluded hoặc deferred, **66 item approved** và **0 item pending**: 25 item theo ruling có từ trước, 33 item từng pending nay có ruling của PO ngày 09-11-2026, và 8 item tách ra từ SR-8 theo ruling đó. **114 item to test** được approve ở mức Test Scope (107 item từ đầu, cộng 7 item sinh ra khi AM-1, AM-2, AM-3 và AM-5 vào spec); việc này chưa có nghĩa chúng đã được Test Design bao phủ. Mẫu số requirement coverage theo công thức của strategy là 114 (không còn item pending nào ở lại trong mẫu số). PO đã đóng Gate 1 (09-11-2026), nên 114 là số chính thức của Build 1.

### Scope review of the 33 items that were pending

<!-- Kiểm từng item từng pending, không duyệt hàng loạt. Cột "Build đầu tiên test được" lấy từ bảng gán build ở mvp-build-order.md mục 10. Cột "Kết quả kiểm" là kết quả đối chiếu của agent; cột "PO ruling" là ruling của PO. Dòng SR-8 liệt kê item gốc cùng các phần tách ra từ nó. -->

| Nhóm | Item | Cần | Build đầu tiên test được | Ruling gần nhất | Kết quả kiểm | PO ruling |
|---|---|---|---|---|---|---|
| SR-2 | FR-141.4 | request | B3 (FR-012) | Hàng 2 của matrix nêu chuyển workspace và tạo chat mới, không nêu đổi tên | Lý do đúng: Build 1 chưa có request nên assert luôn pass (như Z-12) | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-013.A11b | request | B3 | Như FR-141.4 | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-013.A6b | model, request | B3 | Z-12 chỉ nêu FR-071 | Đúng; câu này chỉ có trong UC-013, FR-083 không nêu | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | FR-038.4b | gửi request | B3 (FR-015) | Z-12 chỉ nêu FR-071 | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | FR-084.1b | request | B3 | Không có | Đúng lý do. Item rủi ro high (ghi vào folder của người dùng): tới B3 chỉ có FR-084.1a bảo vệ; B3 phải giữ test đã khoá (build order mục 9) | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-013.G3 | request | B3 | Hàng 2 của matrix | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-012.S2b | request | B3 (FR-012) | Không có | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-013.N1 | agent | B3 (FR-077) | Không có | Đúng; build order gán FR-077 cho B3 | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | UC-013.N2 | request | B3 | Không có | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | FR-073.N1b | agent | B3 (FR-076, FR-077) | Không có | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-2 | FR-053.N1c | agent | B3 (FR-077) | Không có | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-3 † | UC-013.S3b | request đã gửi | B3 | Hàng FR-048 của matrix (P-2) | Đúng; step của UC nhắc lại FR-048 | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |
| SR-5 † | FR-053.7b | provider (gỡ model) | B2 (FR-059) | Hàng 3 của matrix | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-5 † | FR-053.N1a | provider | B2 (FR-055) | Hàng 3 của matrix | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-5 † | FR-053.N1b | provider | B2 (FR-058, FR-059) | Hàng 3 của matrix | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-5 † | UC-012.S2a | provider | B2 (FR-055) | Hàng 3 của matrix | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-5 † | UC-012.A1b | provider | B2 | Hàng 3 của matrix | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-8a, SR-8c | FR-072.7b (conversation), FR-072.7c (deck) | conversation, deck | B3 (conversation), B5 (deck) | Không có (CG-11) | Tách: Build 1 không tạo được conversation và deck. Hai phần có build đầu tiên khác nhau. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8b, SR-8a, SR-8c | FR-073.4b (selected model), FR-073.4c (conversation), FR-073.4d (deck) | selected model, conversation, deck | B2 (selected model), B3 (conversation), B5 (deck) | Không có | Tách. Item rủi ro high (mất dữ liệu khi xoá workspace): phần selected model và conversation được kiểm ở B2 và B3, sớm hơn B5. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8a, SR-8c | FR-074.7b (conversation), FR-074.7c (deck) | conversation, deck | B3, B5 | Không có | Tách. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8a, SR-8c | FR-142.6b (conversation), FR-142.6c (deck) | conversation, deck | B3, B5 | Không có | Tách. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8b, SR-8a, SR-8c | UC-013.A2b (selected model), UC-013.A2c (conversation), UC-013.A2d (deck) | selected model, conversation, deck | B2, B3, B5 | Không có | Tách như FR-073.4b đến FR-073.4d. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8a, SR-8c | UC-013.G2b (conversation), UC-013.G2c (deck) | conversation, deck | B3, B5 | Không có | Tách. | Approved: tách theo dependency (PO, 09-11-2026). |
| SR-8c | FR-053.1b | deck của chat khác | B5 | Không có | Một thành phần, không tách. | Approved: item deferred, build nhận 5 (PO, 09-11-2026). |
| SR-8c | FR-084.1c | hiện deck | B5 | Không có | Một thành phần. Item rủi ro high (ghi vào folder của người dùng): tới B5 chỉ có FR-084.1a và FR-084.1b bảo vệ. | Approved: item deferred, build nhận 5 (PO, 09-11-2026). |
| SR-8c | UC-012.S1b | deck | B5 | Không có | Một thành phần. | Approved: item deferred, build nhận 5 (PO, 09-11-2026). |
| SR-8c | FR-053.N2 | deck | B5 | Không có | Một thành phần. Việc xếp câu glossary này là normative do PO giữ nguyên (09-11-2026). | Approved: item deferred, build nhận 5 (PO, 09-11-2026). |
| SR-8d | NFR-008.1b | deck, kill rồi khởi động lại | B6 (dependency: M13) | mvp-build-order.md mục 10 gán NFR-008 cho B6; Z-14 chỉ duyệt phần chat ở Build 1 | Phép kiểm cần điểm chèn lỗi trên đường ghi deck. M13 mới có kế hoạch cho chat và chưa verified, nên B5 chưa có cơ chế đáng tin. Dependency được ghi ở SR-8d và M13. | Ruling của PO (09-11-2026): đối chiếu với build 6 trong mvp-build-order.md; nếu build 5 chưa có cơ chế kiểm recovery đáng tin, ghi dependency và dời phép kiểm sang build 6. Agent đánh giá build 5 chưa có cơ chế đó (xem cột Kết quả kiểm); PO đã xác nhận đánh giá này và áp dụng SR-8d cho build 6 (09-11-2026). |
| SR-8d | NFR-008.3 | slide chưa xong, kill rồi khởi động lại | B6 (dependency: M13) | Như NFR-008.1b | Như NFR-008.1b. | Ruling của PO (09-11-2026): đối chiếu với build 6 trong mvp-build-order.md; nếu build 5 chưa có cơ chế kiểm recovery đáng tin, ghi dependency và dời phép kiểm sang build 6. Agent đánh giá build 5 chưa có cơ chế đó (xem cột Kết quả kiểm); PO đã xác nhận đánh giá này và áp dụng SR-8d cho build 6 (09-11-2026). |
| SR-9 | FR-038.1b | màn setup | B2 (FR-039, FR-044) | Không có | Đúng | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-9 | NFR-008.1c | setup provider và model | B2 | Không có | Đúng. Phép kiểm kill cũng cần M13 mở rộng tới đường ghi setup. | Approved: item deferred, build nhận 2 (PO, 09-11-2026). |
| SR-11 | FR-084.3 | export | Backlog (UC-004, FR-085) | Note của FR-084 | Đúng lý do. Vế "không file nào khác xuất hiện" đã nằm ở FR-084.1a. | Đổi từ excluded sang deferred, approved (PO, 09-11-2026). Item không bị xoá và không bị loại bỏ vĩnh viễn; phần export được test khi export vào scope. |
| SR-13 | UC-012.N1 | attachment | B3 (FR-016) | Z-3 chỉ nêu FR-084.2 | Đúng | Approved: item deferred, build nhận 3 (PO, 09-11-2026). |

Hai ghi chú cho PO. **Thứ nhất**, ba item rủi ro high bị dời (FR-084.1b ở build 3, FR-084.1c ở build 5, và nhóm FR-073.4b đến FR-073.4d ở build 2, 3 và 5) chỉ được bảo vệ ở các build sau nếu các test đã khoá được giữ. **Thứ hai**, với SR-8d, PO đã xác nhận (09-11-2026) rằng build 5 chưa có cơ chế kiểm recovery đáng tin, nên dependency (M13) được ghi và phép kiểm đặt ở build 6.

### Sentence map

<!-- Mọi đơn vị (câu, hoặc mệnh đề kết thúc bằng ";") của mọi spec trong scope, theo thứ tự đọc. Locator: mục của spec và số thứ tự của đơn vị trong mục đó; chữ cái a, b, c đánh các mệnh đề cách nhau bằng ";" trong cùng một câu. Class: N normative, E explanatory, D definition, quyết định theo nội dung của đơn vị, không theo scope. Cột Items là các item mà đơn vị N cấp dữ liệu, kể cả đơn vị mà một spec ngoài build sở hữu hành vi (item của nó deferred). Đơn vị D chỉ trỏ sang spec khác hoặc nêu ranh giới. Mục "Product evidence" của UC là bản ghi nghiên cứu nên không đếm. Bảng Steps của UC chỉ là ánh xạ UC sang FR nên không đếm. -->

Cột "Normative chưa có item" đếm từ bảng dưới: đơn vị N không dẫn tới item nào. Một người đọc làm bảng này, nên con số 0 là kết quả tự đếm; PO đếm lại được từ bảng.

| Spec | Đơn vị | Normative | Explanatory | Definition | Normative chưa có item |
|---|---|---|---|---|---|
| UC-013 | 89 | 75 | 3 | 11 | 0 |
| UC-012 | 28 | 18 | 2 | 8 | 0 |
| FR-071 | 11 | 9 | 0 | 2 | 0 |
| FR-072 | 4 | 4 | 0 | 0 | 0 |
| FR-073 | 6 | 6 | 0 | 0 | 0 |
| FR-074 | 5 | 3 | 0 | 2 | 0 |
| FR-083 | 4 | 4 | 0 | 0 | 0 |
| FR-084 | 5 | 3 | 0 | 2 | 0 |
| FR-141 | 6 | 6 | 0 | 0 | 0 |
| FR-142 | 11 | 6 | 2 | 3 | 0 |
| FR-053 | 9 | 8 | 1 | 0 | 0 |
| FR-048 | 4 | 4 | 0 | 0 | 0 |
| FR-038 | 4 | 4 | 0 | 0 | 0 |
| NFR-008 | 6 | 3 | 2 | 1 | 0 |
| BR-004 | 7 | 5 | 1 | 1 | 0 |
| BR-019 | 14 | 10 | 4 | 0 | 0 |
| BR-020 | 10 | 8 | 2 | 0 | 0 |
| FR-143 | 7 | 2 | 2 | 3 | 0 |
| **Tổng** | **230** | **178** | **19** | **33** | **0** |

#### UC-013

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Diagram S1 · step | Choose to work in another workspace | N | UC-013.S1 |
| Diagram S1 · 1 | Shows each workspace that is set up | N | UC-013.S1 |
| Diagram S1 · 2 | Keeps the current chat and its draft | N | UC-013.S1 |
| Diagram S2 · step | Choose a folder on the computer | N | UC-013.S2a, UC-013.S2b |
| Diagram S2 · 1 | Sets up a workspace for the folder | N | UC-013.S2a |
| Diagram S2 · 2 | Reads no file of the folder and sends nothing | N | UC-013.S2a, UC-013.S2b |
| Diagram S2 · 3 | Changes no file of the user | N | UC-013.S2a |
| Diagram S2 · 4 | Keeps the current chat and its draft | N | UC-013.S2a |
| Diagram S2 · 5 | Keeps every active request running | N | UC-013.S2b |
| Diagram S3 · step | Work in the workspace in use | N | UC-013.S3a, UC-013.S3b |
| Diagram S3 · 1 | Shows the chats of the workspace in use | N | UC-013.S3b |
| Diagram S3 · 2 | Puts each new chat in the workspace | N | UC-013.S3a |
| Diagram S3 · 3 | Creates, changes and deletes no file | N | UC-013.S3a |
| A1 · When | The chosen folder is the project folder | N | UC-013.A1 |
| A1 · System 1 | Makes that workspace the workspace in use | N | UC-013.A1 |
| A1 · System 2 | Sets up no second workspace | N | UC-013.A1 |
| A2 · When | The user removes a workspace other than the default | N | UC-013.A2a |
| A2 · System 1 | Says that its project folder and its chats stay | N | UC-013.A2a |
| A2 · System 2 | On confirm: removes the workspace | N | UC-013.A2a |
| A2 · System 3 | Makes its chats ungrouped chats | N | UC-013.A2a, UC-013.A2b, UC-013.A2c, UC-013.A2d |
| A2 · System 4 | When it was the workspace in use | N | UC-013.A2a |
| A2 · System 5 | On cancel: removes nothing | N | UC-013.A2a |
| A3 · When | The project folder of a workspace cannot be read | N | UC-013.A3 |
| A3 · System 1 | Says that the files of the folder cannot be read | N | UC-013.A3 |
| A3 · System 2 | Says what the user does next | N | UC-013.A3 |
| A3 · System 3 | Names no cause it does not know | N | UC-013.A3 |
| A3 · System 4 | Keeps the workspace set up and every chat of it | N | UC-013.A3 |
| A5 · When | The user removes a workspace, or chooses another folder | N | UC-013.A5 |
| A5 · System 1 | Changes no workspace | N | UC-013.A5 |
| A5 · System 2 | Says that the request must end first | N | UC-013.A5 |
| A5 · System 3 | Stops no request | N | UC-013.A5 |
| A6 · When | For a workspace other than the default | N | UC-013.A6a, UC-013.A6b |
| A6 · System 1 | Makes the chosen folder the project folder | N | UC-013.A6a |
| A6 · System 2 | Keeps the workspace and its chats | N | UC-013.A6a |
| A6 · System 3 | Reads no file of the folder and sends nothing | N | UC-013.A6a, UC-013.A6b |
| A7 · When | The user chooses a workspace that is set up | N | UC-013.A7a, UC-013.A7b |
| A7 · System 1 | Makes it the workspace in use | N | UC-013.A7a |
| A7 · System 2 | Asks for no folder and changes no file | N | UC-013.A7a |
| A7 · System 3 | Keeps the current chat and its draft | N | UC-013.A7a |
| A7 · System 4 | Keeps every active request running | N | UC-013.A7b |
| A8 · When | The folder the user chooses for a workspace is | N | UC-013.A8 |
| A8 · System 1 | Changes neither workspace | N | UC-013.A8 |
| A8 · System 2 | Says which workspace has the folder | N | UC-013.A8 |
| A9 · When | The user chooses no folder, or the chosen folder | N | UC-013.A9 |
| A9 · System 1 | Sets up no workspace | N | UC-013.A9 |
| A9 · System 2 | Keeps the workspace in use as it was | N | UC-013.A9 |
| A9 · System 3 | For a folder that cannot be read: says so | N | UC-013.A9 |
| A9 · System 4 | For a folder that cannot be a project folder | N | UC-013.A9 |
| A10 · When | DeckAgent starts on the computer for the first time | N | UC-013.A10 |
| A10 · System 1 | Makes the default workspace the workspace in use | N | UC-013.A10 |
| A10 · System 2 | Asks for no folder | N | UC-013.A10 |
| A11 · When | The user gives a workspace a new name | N | UC-013.A11a, UC-013.A11b |
| A11 · System 1 | Gives the workspace that name | N | UC-013.A11a |
| A11 · System 2 | Keeps its project folder and its chats | N | UC-013.A11a |
| A11 · System 3 | Changes no file of the user | N | UC-013.A11a |
| A11 · System 4 | Keeps every active request running | N | UC-013.A11b |
| A12 · When | The place of the project folder of a workspace holds | N | UC-013.A12 |
| A12 · System 1 | Says that a different folder is now there | N | UC-013.A12 |
| A12 · System 2 | Reads no file of that folder | N | UC-013.A12 |
| A12 · System 3 | Offers to use that folder for the workspace | N | UC-013.A12 |
| A12 · System 4 | Keeps the workspace set up and every chat of it | N | UC-013.A12 |
| A13 · When | The name the user gives a workspace (A11) | N | UC-013.A13 |
| A13 · System 1 | Keeps the name of the workspace | N | UC-013.A13 |
| A13 · System 2 | Says why the name is refused | N | UC-013.A13 |
| A13 · System 3 | Changes no file of the user | N | UC-013.A13 |
| Situation and goal · 1 | The user keeps the files of each project | E | — |
| Situation and goal · 2 | They want the chats of a project grouped | E | — |
| Situation and goal · 3 | They also want to start before choosing any folder | E | — |
| Trigger · 1 | The user chooses to work in another workspace, to choose | D | Mở đầu các flow UC-013.S1, A2a, A6a, A11a (đã là item) |
| Trigger · 2 | or DeckAgent starts on the computer for the first time | D | Mở đầu flow UC-013.A10 |
| Precondition · 1 | DeckAgent runs on the user's computer | D | Xem AM-4 |
| Outcome · 1 | The workspace in use is the one the user chose | N | UC-013.S2a, UC-013.A7a |
| Outcome · 2 | Every file of the user in its project folder is as it was | N | UC-013.G1 |
| Minimal guarantee · 1 | No file of the user is changed, moved or deleted | N | UC-013.G1 |
| Minimal guarantee · 2 | No chat, conversation or deck is deleted | N | UC-013.G2a, UC-013.G2b, UC-013.G2c |
| Minimal guarantee · 3 | No active request stops | N | UC-013.G3 |
| Notes · 1 | Where the deck source and the work of a chat are kept | D | Thuộc DEC-006 (open) |
| Notes · 2a | The agent of a chat reads the files ... and writes none there | N | UC-013.N1, UC-013.S3a |
| Notes · 2b | Starting a new chat is UC-012 | D | Thuộc UC-012 |
| Notes · 3a | A file of the project folder is named in the request text | N | UC-013.N2 |
| Notes · 3b | there is no named reference | N | UC-013.N2 |
| Notes · 3c | A file that cannot be read is UC-003 A43 | D | Thuộc UC-003 |
| Notes · 4a | Opening an earlier chat ... is UC-006 | D | Thuộc UC-006 |
| Notes · 4b | An ungrouped chat joins no workspace | N | FR-073.N2a |
| Notes · 4c | adding its former project folder again sets up a new workspace | N | FR-071.N1 |
| Notes · 5a | Renaming or deleting a chat is not a flow of this case | D | Thuộc UC-018 (backlog) |
| Notes · 5b | It is in the backlog (UC-018) | D | Thuộc UC-018 (backlog) |
| Notes · 6a | Next free flow ID: A14 | D | — |
| Notes · 6b | A number below it that this file does not hold is not used | D | — |

#### UC-012

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Diagram S1 · step | Choose to start a new chat | N | UC-012.S1a, UC-012.S1b, UC-012.S1c |
| Diagram S1 · 1 | Keeps the chat the user leaves, its deck and its draft | N | UC-012.S1a, UC-012.S1b |
| Diagram S1 · 2 | Keeps its active request running there | N | UC-012.S1c |
| Diagram S1 · 3 | Makes a new chat the current chat | N | UC-012.S1a |
| Diagram S1 · 4 | Takes nothing from another chat | N | UC-012.S1a |
| Diagram S2 · step | Get ready to write the first request | N | UC-012.S2a, UC-012.S2b, UC-012.S2c |
| Diagram S2 · 1 | Shows the selected model of the new chat | N | UC-012.S2a |
| Diagram S2 · 2 | Sends nothing and builds no deck | N | UC-012.S2b, UC-012.S2c |
| Diagram S2 · 3 | Accepts a first request | N | UC-012.S2b |
| A1 · When | No model was ever chosen, or the model of the most recent choice | N | UC-012.A1a, UC-012.A1b |
| A1 · System 1 | Leaves the new chat with no selected model and says so | N | UC-012.A1a, UC-012.A1b |
| A1 · System 2 | Chooses no other model by itself | N | UC-012.A1a, UC-012.A1b |
| Situation and goal · 1 | The user worked on one deck | E | — |
| Situation and goal · 2 | They want the new work free of the earlier conversation | E | — |
| Trigger · 1 | The user chooses to start a new chat | D | Mở đầu flow UC-012.S1a |
| Precondition · 1 | DeckAgent runs on the user's computer | D | Xem AM-4 |
| Outcome · 1 | A new, empty chat of the workspace in use is the current chat | N | UC-012.S1a, UC-012.S2a, UC-012.A1a |
| Outcome · 2 | Every other chat is as it was | N | UC-012.S1a |
| Minimal guarantee · 1 | Every other chat, its deck and its draft are as they were | N | UC-012.S1a, UC-012.S1b, UC-012.S1c |
| Notes · 1a | Drafting the first deck in the new chat is UC-001 | D | Thuộc UC-001 |
| Notes · 1b | going back to an earlier chat is UC-006 | D | Thuộc UC-006 |
| Notes · 1c | the workspace a new chat joins is UC-013 | D | Thuộc UC-013 |
| Notes · 2a | Sending a request in a chat with no selected model is UC-003 A17 | D | Thuộc UC-003 |
| Notes · 2b | choosing another model for the chat is UC-005 A16 | D | Thuộc UC-005 |
| Notes · 3 | A chat holds at most one deck | N | FR-053.N2 |
| Notes · 4a | An exported source archive attached in a new chat | N | UC-012.N1 |
| Notes · 4b | nothing is imported as a deck to change | N | UC-012.N1 |
| Notes · 4c | Carrying on with an exported deck is in the backlog | D | Thuộc UC-019 (backlog) |

#### FR-071

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user chooses a readable folder | N | FR-071.1, FR-071.2, FR-071.3, FR-071.15 |
| Statement · 2 | a folder that is already the project folder | N | FR-071.4 |
| Statement · 3 | When that folder was moved to another place | N | FR-071.5 |
| Statement · 4 | Switching to a workspace that is set up asks for no folder | N | FR-071.6, FR-071.7 |
| Statement · 5 | A folder that cannot be a project folder [BR-019] | N | FR-071.8 |
| Statement · 6 | the system says why and that a folder inside it | N | FR-071.8 |
| Statement · 7 | Adding or switching keeps the current chat and its draft | N | FR-071.9, FR-071.10, FR-071.11, FR-071.12, FR-071.13, FR-071.14 |
| Notes · 1 | Renaming a workspace is FR-141 | D | Thuộc FR-141 |
| Notes · 2a | A folder that had a removed workspace sets up a new workspace | N | FR-071.N1 |
| Notes · 2b | the chats of the removed one stay ungrouped chats | N | FR-071.N1 |
| Notes · 3 | Starting a new chat is FR-053 | D | Thuộc FR-053 |

#### FR-072

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | From the first start on the computer | N | FR-072.1, FR-072.2, FR-072.3 |
| Statement · 2 | On every later start, the workspace in use | N | FR-072.4a, FR-072.4b |
| Statement · 3 | The user works in it without choosing a folder | N | FR-072.5 |
| Statement · 4 | The system never removes the default workspace | N | FR-072.6, FR-072.7a, FR-072.7b, FR-072.7c |

#### FR-073

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The system removes a workspace other than the default | N | FR-073.1, FR-073.2 |
| Statement · 2 | Removing changes no folder and no file | N | FR-073.3, FR-073.4a, FR-073.4b, FR-073.4c, FR-073.4d, FR-073.5 |
| Statement · 3 | While a request in a chat of the workspace is active | N | FR-073.6a, FR-073.6b, FR-073.6c |
| Notes · 1 | An ungrouped chat has no project folder | N | FR-073.N1a, FR-073.N1b |
| Notes · 2a | An ungrouped chat joins no workspace | N | FR-073.N2a |
| Notes · 2b | Adding its former project folder again | N | FR-071.N1 |

#### FR-074

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the project folder of a workspace cannot be read | N | FR-074.1, FR-074.2, FR-074.3 |
| Statement · 2 | It names no cause it does not know | N | FR-074.4, FR-074.5 |
| Statement · 3 | The workspace stays set up | N | FR-074.6, FR-074.7a, FR-074.7b, FR-074.7c |
| Notes · 1 | A file of the folder that a request needs | D | Thuộc FR-067 |
| Notes · 2 | A different folder at the place of the project folder | D | Thuộc FR-142 |

#### FR-083

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user chooses another folder for a workspace | N | FR-083.1, FR-083.2, FR-083.3, FR-083.4 |
| Statement · 2 | When the chosen folder is the project folder of another workspace | N | FR-083.5, FR-083.6, FR-083.7 |
| Statement · 3 | While a request in a chat of the workspace is active | N | FR-083.8a, FR-083.8b, FR-083.8c |
| Statement · 4 | The default workspace has no project folder | N | FR-083.9 |

#### FR-084

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | While the system works on a request | N | FR-084.1a, FR-084.1b, FR-084.1c |
| Statement · 2 | A file the user gave as an attachment | N | FR-084.2 |
| Statement · 3 | A file appears in the project folder only through an export | N | FR-084.3 |
| Notes · 1 | Where the deck source and the rest of the work | D | Thuộc DEC-006 (open) |
| Notes · 2 | Export ... is in the backlog | D | Thuộc UC-004, FR-085 (backlog) |

#### FR-141

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user gives a workspace a new name | N | FR-141.1 |
| Statement · 2 | Renaming keeps the project folder and the chats | N | FR-141.2, FR-141.3, FR-141.4 |
| Statement · 3 | Two workspaces are allowed to have the same name | N | FR-141.5 |
| Statement · 4 | The system drops the whitespace at both ends | N | FR-141.6 |
| Statement · 5 | The system keeps the name in NFC form | N | FR-141.9 |
| Statement · 6 | A name the system refuses [BR-020] | N | FR-141.7, FR-141.8 |

#### FR-142

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the place of the project folder of a workspace holds | N | FR-142.1, FR-142.2, FR-142.3 |
| Statement · 2 | The user can use that folder for the workspace | N | FR-142.4 |
| Statement · 3 | on that choice the system makes it the project folder | N | FR-142.4 |
| Statement · 4 | Until then, the workspace stays set up | N | FR-142.5, FR-142.6a, FR-142.6b, FR-142.6c |
| Why · 1 | A folder at the old place looks like the chosen folder | E | — |
| Why · 2 | using it without asking would let the agent read files | E | — |
| Notes · 1 | When two paths are the same folder | D | Thuộc windows-folders.md |
| Notes · 2a | The conditions of choosing another folder are FR-083 | D | Thuộc FR-083 |
| Notes · 2b | a folder that cannot be read at all is FR-074 | D | Thuộc FR-074 |
| Notes · 3a | Adding the different folder as a workspace | N | FR-142.N3 |
| Notes · 3b | the first workspace keeps reporting a different folder | N | FR-142.N3 |

#### FR-053

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | Starting a new chat keeps every other chat | N | FR-053.1a, FR-053.1b, FR-053.1c, FR-053.2 |
| Statement · 2 | The new chat becomes the current chat | N | FR-053.3, FR-053.4, FR-053.5 |
| Statement · 3 | It gets the selected model and the reasoning level | N | FR-053.6, FR-053.7a, FR-053.7b |
| Why · 1 | Carry on with the model the user chose last | E | — |
| Notes · 1a | The system does not walk back through earlier choices | N | FR-053.N1a |
| Notes · 1b | The draft of each chat is kept whole | N | FR-053.1c, FR-038.1a |
| Notes · 1c | A model removed and added again counts | N | FR-053.N1b |
| Notes · 1d | The reach of the agent is the same for every chat | N | FR-053.N1c |
| Notes · 2 | A chat holds at most one deck (glossary) | N | FR-053.N2 |

#### FR-048

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user asks for earlier work | N | FR-048.1, FR-048.2, FR-048.3 |
| Statement · 2 | It names each chat from its content | N | FR-048.4, FR-048.5, FR-048.6 |
| Statement · 3 | With no such chat it says so | N | FR-048.7 |
| Notes · 1 | A chat of a removed workspace becomes an ungrouped chat | N | FR-073.4a |

#### FR-038

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The system keeps the draft of each chat | N | FR-038.1a, FR-038.1b |
| Statement · 2 | It also keeps the draft when the interface is reloaded | N | FR-038.2, FR-038.3 |
| Statement · 3 | Going elsewhere adds nothing to the draft | N | FR-038.4a, FR-038.4b |
| Statement · 4 | The draft is not kept after DeckAgent stops | N | FR-038.5 |

#### NFR-008

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Quality attribute · 1 | data integrity | D | Tên thuộc tính chất lượng |
| Statement · 1 | When DeckAgent ends unexpectedly | N | NFR-008.1a, NFR-008.1b, NFR-008.1c |
| Statement · 2 | After DeckAgent starts again | N | NFR-008.2a, NFR-008.2b |
| Statement · 3 | No unfinished change to a slide | N | NFR-008.3 |
| Notes · 1 | It makes no promise that a result shown just before the end | E | — |
| Notes · 2 | The draft of a chat is not covered | E | — |

#### BR-004

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The rule sets which chats the system keeps | D | Mô tả phạm vi của luật |
| V-1 · 1 | Every chat in which the user sent at least one request | N | BR-004.V1 |
| V-1 · 2 | A chat with no sent request is not required to appear | N | BR-004.V1 |
| V-2 · 1 | No time limit | N | BR-004.V2 |
| V-2 · 2 | The system deletes no chat, conversation or deck because of its age | N | BR-004.V2 |
| V-3 · 1 | Every chat of a removed workspace is kept | N | BR-004.V3 |
| Notes · 1 | No time limit is no promise against a loss | E | — |

#### BR-019

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The folders that the system refuses as a project folder | N | BR-019.R0 |
| Statement · 2 | A folder refused by one value is refused | N | BR-019.R1 |
| Why · 1 | The agent reads every file of the project folder | E | — |
| Why · 2 | a folder too wide or holding keys | E | — |
| Why · 3 | DeckAgent writes nothing in a project folder | E | — |
| V-1 · 1 | the root of every drive | N | BR-019.V1 |
| V-2 · 1 | C:\Windows, C:\Program Files and C:\Program Files (x86) | N | BR-019.V2a, BR-019.V2b, BR-019.V2c |
| V-2 · 2 | Closed list | N | BR-019.V2a |
| V-3 · 1 | the user's own folder (such as `C:\Users\<name>`) | N | BR-019.V3a |
| V-3 · 2 | a folder inside it is not refused by this value | N | BR-019.V3b |
| V-4 · 1 | .ssh, .aws, .gnupg, .kube and .docker in the user's own folder | N | BR-019.V4a, BR-019.V4b |
| V-4 · 2 | Closed list | N | BR-019.V4a |
| V-5 · 1 | the folder of DeckAgent's own data | N | BR-019.V5a, BR-019.V5b, BR-019.V5c |
| Notes · 1 | V-1 to V-5 follow open-design | E | — |

#### BR-020

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The names that the system refuses for a workspace | N | BR-020.R |
| Why · 1 | A name with no character cannot be told apart | E | — |
| Why · 2 | a very long name breaks the list | E | — |
| V-1 · 1 | a name with no character once the whitespace | N | BR-020.V1 |
| V-2 · 1 | at most 100 characters, inclusive | N | BR-020.V2a |
| V-2 · 2 | a longer name is refused | N | BR-020.V2a |
| V-2 · 3 | A character is one Unicode code point after NFC | N | BR-020.V2b |
| V-2 · 4 | The name is normalized to NFC before its characters | N | BR-020.V2c |
| V-3 · 1 | the characters that JavaScript String.prototype.trim() drops | N | BR-020.V3 |
| V-3 · 2 | The system drops them from a name the user gives | N | BR-020.V3 |

#### FR-143

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When an operation that changes the state of a workspace | N | FR-143.1 |
| Statement · 2 | A web page outside DeckAgent is not an allowed client | N | FR-143.2 |
| Why · 1 | The system runs on the user's computer | E | — |
| Why · 2 | without this, a web page the user opens | E | — |
| Notes · 1 | The system does not protect against another process | D | Giới hạn đã khai của AM-5 (ranh giới của FR-143) |
| Notes · 2 | The system has no user login | D | Ranh giới của FR-143 |
| Notes · 3 | How the system tells an allowed client from another | D | Thuộc implementation plan |

### Cross-reference mismatches

<!-- So UC step và alternative, FR, BR value với nhau. Một chỗ lệch là candidate gap, không phải lỗi spec. -->

| ID | Chỗ lệch | Vì sao ổn, hoặc nêu lên như |
|---|---|---|
| X1 | UC-013 S1 nói DeckAgent hiện mỗi workspace theo tên và workspace đang dùng; không mệnh đề FR nào nói việc hiện danh sách. | Ổn ở mức test: step của UC là basis item (UC-013.S1). Nêu lên PO ở mức thấp: không FR nào sở hữu hành vi này. |
| X2 | UC-013 A9 nói "không chọn folder" thì không thiết lập workspace, và folder không đọc được thì DeckAgent "nói như vậy". FR-071 chỉ nói folder không đọc được thì không thiết lập workspace, và không nêu "không chọn folder". | Ổn ở mức test: alternative của UC là basis item (UC-013.A9). Nêu lên PO ở mức thấp. |
| X3 | UC-012 S2 nói chat mới "không gửi gì" và "nhận request đầu tiên". FR-053 nói chat mới không có deck, không nói "không gửi gì". | "Nhận request đầu tiên" thuộc UC-001. "Không gửi gì" chỉ kiểm được từ build 3. Nêu lên PO ở mức thấp. |
| X4 | UC-012 A1 nói DeckAgent "nói" chat mới không có selected model. FR-053 chỉ nói chat mới không có selected model; FR-065 nói "nói điều đó" nhưng cho chat có model bị gỡ, và FR-065 nằm ngoài scope của build. | **PO đã ruling (CG-12, 09-11-2026)**: giữ FR-065 ngoài scope. Câu "nói" có Test Basis từ UC-012 A1: UC-012.A1a to test, UC-012.A1b deferred sang build 2 (SR-5). Plan đang kiểm câu này ở FR-053 AC-5. |
| X5 | UC-013 S1, S2, A7 trích FR-068 (request tiếp tục chạy khi chuyển workspace). FR-068 nằm ngoài scope. | Ổn: phần "request tiếp tục chạy" đã dời sang build 3 ([matrix](./traceability-matrix.md)). |
| X6 | Các câu "giữ conversation, deck, selected model" ở FR-072, FR-073, FR-074, FR-142, FR-053, UC-013 và NFR-008 cần conversation (build 3), deck (build 5) hay model (build 2). Bảng "Moved to a later build" của matrix không liệt kê chúng. | **PO đã ruling (09-11-2026)**: tách theo dependency và dời tới build đầu tiên test được (SR-8a đến SR-8d); phần setup ở SR-9. Matrix chưa cập nhật theo ruling này (việc của Gate 2). |
| X7 | "Không dừng request" ở FR-141.4 và UC-013 A11, "không gửi gì" ở FR-038.4b, và các câu "xử lý request, hiện deck" ở FR-084.1b, FR-084.1c: matrix liệt kê hành vi dời cho chuyển workspace và chat mới, không liệt kê các câu này. | **PO đã ruling (09-11-2026)**: các item nằm ở SR-2 (build 3) và SR-8c (build 5). Matrix chưa cập nhật theo ruling này (việc của Gate 2). |

## 2. Quality risks và test types

<!-- Quality risk là rủi ro về chất lượng mà spec có thể không gọi tên; PO đặt level giống mức risk của FR. Level mặc định là high khi chưa đặt. -->

| ID | Quality risk | Nguồn | Risk level |
|---|---|---|---|
| QR-1 | Một folder đến được bằng nhiều dạng đường dẫn (khác hoa thường, `/` thay `\`, tiền tố `\\?\`, tên 8.3, junction, ổ `subst`), nên DeckAgent tạo workspace thứ hai hoặc để lọt một folder bị từ chối. | FR-071.4, BR-019.R0, đặc điểm đường dẫn Windows ([windows-folders.md](../../research/windows-folders.md) mục 1) | high |
| QR-2 | DeckAgent nhận làm project folder một folder quá rộng hoặc chứa key; ở build 3 agent sẽ đọc mọi file của folder và gửi cho provider. | BR-019 (Why), FR-071.8 | high |
| QR-3 | DeckAgent ghi vào project folder (data folder nằm bên trong, file ẩn hay file tạm), hoặc đọc file của folder lúc thêm. | FR-084.1a, FR-071.10, FR-071.11, BR-019.V5 | high |
| QR-4 | Định danh của folder đổi theo thời gian: folder bị dời, bị thay bằng folder khác ở chỗ cũ, mất quyền đọc; ID folder có thể không ổn định trên USB exFAT hay ổ mạng. | FR-074, FR-142; [windows-folders.md](../../research/windows-folders.md) mục 2 (chỉ chạy trên NTFS) | high |
| QR-5 | DeckAgent bị kill giữa lúc xoá workspace hoặc tạo chat, nên một chat trỏ vào workspace đã xoá hoặc nằm ở hai chỗ. | NFR-008, FR-073, RQ-10 | high |
| QR-6 | Nhiều interface mở cùng lúc lệch nhau về workspace đang dùng, chat hiện tại và draft. | DEC-012, FR-038.3, FR-053 | normal |
| QR-7 | Tên Unicode: đơn vị đếm (code point, UTF-16), chuẩn hoá NFC hay NFD, ký tự ngoài BMP, cắt tên giữa một chuỗi ký tự. | BR-020, FR-071.2 | high |
| QR-8 | Server chạy local có thể bị trang web bên ngoài, tiến trình khác hoặc người dùng khác gọi tới, rồi thêm, đổi tên hay xoá workspace hoặc đổi chat. Trước AM-5, spec không có câu nào về việc này. PO đã chọn mục tiêu hành vi (AM-5), hành vi đã vào spec là FR-143, và PO coi đây là rủi ro bảo mật thực sự. | DEC-010 (phương án A: server local với trình duyệt); AM-5 | chưa đặt (mặc định high) |
| QR-9 | Ổ chậm hoặc ổ mạng làm chậm việc kiểm "đọc được" của mỗi workspace khi hiện danh sách. **Known risk** (PO, 09-11-2026): Build 1 không đo hiệu năng; xem lại khi implementation plan xác định thời điểm và cách kiểm folder. | RQ-6 (implementation plan chọn thời điểm kiểm) | normal |
| QR-10 | Người dùng thấy lý do sai hoặc trống cho một folder bị từ chối, một folder không đọc được hoặc một tên bị từ chối, kể cả lý do nêu một nguyên nhân mà DeckAgent không biết. | FR-074.4, FR-071.8, FR-083.5 đến FR-083.7, FR-141.8 | high |

**PO ruling (09-11-2026):** approve QR-1 đến QR-7, QR-9 và QR-10 làm đầu vào Test Planning. QR-8 được xử lý như một rủi ro bảo mật thực sự và có mục tiêu hành vi ở AM-5, không để ở trạng thái chưa có oracle. QR-9 là known risk.

<!-- Selected: yes (kèm nguồn) | no (kèm lý do). Oracle status: asserted | recorded-only. Approach: scripted automated | scripted manual | exploratory (một type có thể dùng nhiều approach). -->

| Type | Selected | Nguồn hoặc lý do | Oracle status | Approach |
|---|---|---|---|---|
| Functional | yes | Mọi FR, BR và flow trong scope (mục 1) | asserted | scripted automated: acceptance qua driver, E2E ở Phase 5 |
| Performance | no | QR-9 là known risk, không phải type đã chọn (PO chọn phương án (a), 09-11-2026). Spec không có ngưỡng thời gian. Thời gian chạy của cả một test trong CI gồm khởi động server, fixture, thao tác, đọc trạng thái và cleanup, và runner CI có tải thay đổi giữa các lần chạy, nên không đo được thời gian DeckAgent thực hiện một thao tác. Một phép đo hợp lệ phải nêu operation, metric và điều kiện đo. Xem lại khi implementation plan quyết thời điểm kiểm "đọc được" (RQ-6). | — | — |
| Security — confidentiality | yes | QR-2, BR-019 (Why). Build này kiểm phần từ chối folder và "không đọc file"; việc gửi nội dung cho provider thuộc build 3. | asserted | scripted automated (threat scenario: link, junction, ổ `subst`, tiền tố `\\?\`, đường dẫn tương đối); exploratory (charter ở Gate 2) |
| Security — integrity | yes | QR-3, FR-084.1a, FR-071.10 | asserted | scripted automated (snapshot trước và sau, có positive control) |
| Security — authentication | no | Spec không có tài khoản hay đăng nhập; DeckAgent chạy trên máy một người dùng (precondition của UC-013). Việc server local bị gọi từ nơi khác nằm ở hàng authorization. | — | — |
| Security — authorization | yes | QR-8. Mục tiêu hành vi do PO chọn (AM-5): chỉ các client được DeckAgent cho phép mới thực hiện được thao tác thay đổi trạng thái workspace và chat, và một trang web bên ngoài không tự ý thực hiện được các thao tác đó qua server local. Cơ chế (session token, Origin validation hay khác) do implementation plan quyết. **Giới hạn đã khai:** build này không bảo vệ trước tiến trình khác chạy cùng quyền hệ điều hành, và không có hệ thống đăng nhập. | asserted (hành vi đã vào spec là FR-143; AC viết ở Gate 2) | scripted automated (acceptance: một request từ client không được phép bị từ chối và không đổi trạng thái; mechanism M18); exploratory (charter ở Gate 2) |
| Security — availability | no | Phần DeckAgent còn chạy được sau khi kết thúc bất ngờ nằm ở hàng Reliability (NFR-008). | — | — |
| Security — non-repudiation | no | Spec không có yêu cầu về dấu vết hay truy cứu trách nhiệm; một người dùng. | — | — |
| Reliability and recovery | yes | QR-5, NFR-008 | asserted | scripted automated (fault injection do yêu cầu quy định: kill tại mỗi bước ghi của xoá workspace và tạo chat) |
| Configuration, platform, installation | yes, phần platform | QR-1, QR-4, QR-7. Mục tiêu là Windows (BR-019 nêu folder của Windows, CI chạy `windows-2022`); các hệ điều hành khác không có câu nào trong spec (AM-4). Không có yêu cầu cài đặt trong spec; browser khác Chromium chưa được chọn ở Phase 3. | asserted | scripted automated (chia lớp theo đặc điểm nền tảng: độ dài đường dẫn, tên 8.3, hoa thường, NFC và NFD) |
| Usability | no | Build này chưa thiết kế giao diện (walking skeleton "không cần đẹp"). Nội dung thông báo được kiểm như hành vi qua field có cấu trúc; đánh giá câu chữ chờ build có giao diện. | — | — |
| Structural | yes | Phase 5: unit test cho mỗi module và branch coverage theo ngưỡng PO đặt ở implementation plan | asserted | scripted automated |
| Change-related (retest, regression) | yes | Bộ acceptance test bị khoá chạy trên mọi PR; mỗi lần sửa lỗi có retest | asserted | scripted automated |

**PO ruling (09-11-2026):** Functional, Security (confidentiality, integrity, authorization), Reliability and recovery, Platform, Structural (cho Phase 5) và Change-related được chọn. Performance, Security (authentication, non-repudiation), Usability không được chọn cho Build 1; authentication không chọn đối với cơ chế đăng nhập người dùng. Security availability không có kế hoạch riêng, vì các rủi ro hiện tại được kiểm ở hàng Reliability and recovery.

## 3. Automation feasibility

<!-- Status: verified (đã chạy, có bằng chứng) | assumed (có cơ sở, chưa chạy) | blocked (chưa có cách đáng tin) | not applicable. "Bằng chứng" của hàng assumed ghi cơ sở và nơi bằng chứng sẽ xuất hiện. Một test không được tính là bằng chứng của AC ở Gate 3 khi mechanism nó cần chưa verified. -->

| ID | Mechanism | Cần cho | Status | Bằng chứng hoặc cơ sở | Nếu chưa verified |
|---|---|---|---|---|---|
| M1 | Vitest `4.1.12` với `it.fails` (DEC-013) | Mọi test ci | assumed | DEC-013; repo chưa có Vitest. Bằng chứng xuất hiện khi ticket T0c merge và chạy xanh. | Không test nào của build chạy được; T0c chặn mọi ticket khác. |
| M2 | Driver `tests/acceptance/support/deckagent.ts` nối vào interface thật | Mọi AC acceptance | assumed | Driver ném `NotWiredError` cho đến khi có ticket nối driver ở Phase 4. | AC không chứng minh được fail vì assertion; không đổi được `it.fails` sang `it`. |
| M3 | Audit `fs` bằng module preload: ghi mọi lệnh `fs` và đường dẫn của nó | FR-071.11, FR-074.5, FR-083.3, FR-142.3 (T1, T5, T6) | assumed | Chưa có preload. Audit chỉ thấy các lệnh đi qua hàm `fs` được vá; lệnh từ worker thread, tiến trình con hoặc native module (SQLite) không đi qua. **Yêu cầu của PO (09-11-2026):** positive control phải chứng minh audit phát hiện được một thao tác đọc file bị cấm, không chỉ nhìn thấy `stat`. Driver trong testing-plan.md hiện chỉ đòi `stat` làm positive control; mục "Test driver and fixtures" thuộc Gate 2 và phải đổi theo yêu cầu này. | Nếu audit không quan sát được các đường đọc liên quan, test "không đọc file" chưa được dùng làm bằng chứng đạt AC. `denyRead` trên một file bên trong chỉ bắt được khi DeckAgent báo lỗi đọc ra ngoài. |
| M4 | Fixture `junction` (`mklink /J`) | FR-071.4, BR-019.R0 | assumed | Đã chạy trên máy dev Windows 11 NTFS ([windows-folders.md](../../research/windows-folders.md) mục 1); chưa chạy trên runner CI. Bằng chứng xuất hiện qua self-test của T0b. | Mất các trường hợp junction của AC thêm cùng folder và AC `.ssh`. |
| M5 | Fixture `substDrive` (ổ `subst`, lock và thử lại) | FR-071.4, BR-019.R0, BR-019.V1 | assumed | Đã chạy `subst Q:` trên máy dev (windows-folders.md mục 1); chưa chạy trên CI. R5 trong testing plan. | Mất các trường hợp ổ `subst`. |
| M6 | Fixture `shortName` (tên 8.3) | FR-071.4 | assumed | R1: runner GitHub có bật 8.3 (folder tạm `RUNNER~1`), chưa kiểm bằng self-test. | PO quyết bật lại bằng `fsutil 8dot3name set` hoặc bỏ trường hợp 8.3. |
| M7 | Fixture `longPath` (đường dẫn 259, 260, 261 và 300 ký tự) | FR-071.1 (đường dẫn dài) | assumed | Chưa chạy. Setup phụ thuộc vào cách Node và Windows xử lý đường dẫn dài. | Mất AC đường dẫn dài. |
| M8 | Fixture `denyRead` (ACL chặn đọc, trả lại trong `finally`) | FR-071.7, FR-074, FR-083.6, FR-142 | assumed | R4. Self-test kiểm `fs.readdir` thật sự fail. Chưa chạy trên CI. | Mất các trường hợp "mất quyền đọc". |
| M9 | Fixture `snapshot` (mọi file, hash, thuộc tính, ADS, kể cả folder rỗng) | FR-084.1a, FR-071.10 | assumed | Đọc ADS cần công cụ ngoài `fs` (PowerShell hoặc tương đương); chưa thử. Positive control: đổi một byte, một thuộc tính hay một ADS thì snapshot đổi. | Bất biến "không đổi file" yếu đi: không thấy việc thêm ADS. |
| M10 | Fixture `move`, `root()`, global setup với registry và lock | Mọi test dùng folder | assumed | Chưa chạy. Self-test nằm trong T0b. | Test chạy không cô lập; rủi ro R4 và R5. |
| M11 | Image `windows-2022` của GitHub và step CI `test:acceptance` | Mọi test ci | assumed | R2, R6. Step CI chưa có trong workflow; PO phải duyệt. | Test đã khoá không chặn merge. |
| M12 | DeckAgent đọc userDir, keyDirs, systemDirs, dataDir từ cấu hình lúc khởi động, và nhận port 0 | Mọi AC dùng folder thay thế | assumed | Yêu cầu cho Phase 3. Chưa có code. | Test phải dùng folder thật của máy; vi phạm C7 và không cô lập được. |
| M13 | Điểm chèn lỗi giữa các bước ghi của xoá workspace và tạo chat | NFR-008.1a, NFR-008.2a (M-1); sau này NFR-008.1c (build 2), NFR-008.1b và NFR-008.3 (build 6, SR-8d) | assumed | Chưa có cách quyết định để kill đúng giữa hai bước ghi nếu sản phẩm không có điểm chèn. **Yêu cầu của PO (09-11-2026):** Phase 3 phải xác định các injection point và cách kích hoạt failure một cách xác định được (ví dụ một biến môi trường kích hoạt). Đường ghi setup và đường ghi deck và slide thêm điểm chèn riêng ở build của chúng. | M-1 không chạy được ổn định; yêu cầu reliability có rủi ro cao mà không có test. |
| M14 | Hai interface thật cùng lúc và kênh đẩy sự kiện `workspaceInUse` | FR-038.3, FR-053.3, FR-071.3 | assumed | DEC-012: server đẩy thay đổi tới mọi interface. Chưa có code. | Mất các AC nhiều interface (T3). |
| M15 | `better-sqlite3` build native trên `windows-2022` | Chạy được sản phẩm trên CI | assumed | DEC-011: open-design làm như vậy trên Windows. Chưa chạy ở repo này. | Không chạy được sản phẩm trên CI. |
| M16 | Playwright với Chromium | E2E (Phase 5) | assumed | open-design-earlier-work.md item 12; PO chốt framework ở Phase 3. | Mất E2E; AC acceptance không bị ảnh hưởng. |
| M17 | Fixture `symlink` | BR-019.R0 (CG-7) | assumed | Chưa nằm trong plan. [windows-folders.md](../../research/windows-folders.md) mục 1: tạo symlink cần quyền administrator trên máy dev; runner CI có thể chạy với quyền đó. Chưa chạy. PO giữ assumed (09-11-2026). | Nếu CI không tạo được symlink, Gate 2 phải nêu phương án thay thế hoặc ghi deviation, không skip ngầm. Nếu thêm AC cho symlink mà fixture không chạy, AC bị chặn. |
| M18 | Driver gửi một thao tác thay đổi workspace hoặc chat từ một client mà DeckAgent không cho phép (ví dụ request mang Origin của trang khác, hoặc không mang thông tin xác thực) vào server local | Security — authorization (QR-8, AM-5), AC của Gate 2 | assumed | **Agent thêm sau ruling QR-8; PO xác nhận (09-11-2026).** Cơ sở: DEC-010 chọn server local với trình duyệt, nên một request từ trình duyệt mang Origin khác là tình huống thật. Client nào được phép là quyết định của implementation plan, nên chưa chạy được. | Không có test nào chứng minh hành vi AM-5; yêu cầu bảo mật mới chỉ có exploratory. |

**PO ruling (09-11-2026):** giữ cả 17 mechanism của bản trước và M18 ở trạng thái `assumed` tại Gate 1, vì strategy cho phép duyệt Test Plan khi cơ chế chưa được triển khai, miễn là dependency và rủi ro được ghi rõ. M18 do agent thêm cho QR-8 và PO đã xác nhận (09-11-2026). Không chạy spike trước khi đóng Gate 1. Mỗi dependency phải có nơi thực hiện và kiểm chứng trước khi test của nó được dùng làm bằng chứng chấp nhận build.

## 4. Ambiguities và candidate gaps

<!-- Ambiguity là chỗ spec nói chưa rõ; PO quyết (sửa spec trước, hoặc quyết hướng hiểu). Candidate gap là điều agent nghi là thiếu test hoặc thiếu phạm vi; nó là đầu vào cho Gate 2, chưa xác nhận. -->

### Ambiguities

<!-- Cột Spec entry: "không cần" | file spec phải đổi, chờ PO cho phép sửa (dev/mvp/spec/ là đường dẫn protected, và hành vi mới vào spec trước khi build dùng nó: WORKFLOW "Spec rules" rule 3) | "đã vào spec". Chưa dùng ruling làm expected result khi cột này chưa là "không cần" hoặc "đã vào spec". -->

| ID | Nơi | Điều chưa rõ | Plan đọc thế nào | PO ruling | Spec entry |
|---|---|---|---|---|---|
| AM-1 | FR-141.6, BR-020.R | "Khoảng trắng" ở hai đầu gồm ký tự nào: chỉ dấu cách, hay mọi ký tự trắng của Unicode (tab, NBSP, U+3000)? Và ruling có áp dụng cho tên lấy từ folder không? | Đọc theo ruling. Tên người dùng đặt khi đổi tên: bỏ khoảng trắng như `String.prototype.trim()` của JavaScript. Tên lấy từ folder (FR-071.2): không bỏ khoảng trắng nào. AC hiện chỉ dùng dấu cách (FR-141 AC-4, AC-7); Gate 2 review. | **Đã có** (PO, 09-11-2026): khoảng trắng ở hai đầu tên workspace theo Unicode whitespace như `String.prototype.trim()` của JavaScript. Tên lấy từ folder không bị trim; tên người dùng nhập khi đổi tên bị trim. Cả hai được chuẩn hoá NFC, không đổi path folder thực tế. | **Đã vào spec** (09-11-2026): BR-020 (Statement, V-1, V-3), FR-141 (statement 4) và FR-071 (statement 1). |
| AM-2 | FR-071.2, BR-020.V2b | DeckAgent lưu tên theo dạng người dùng đưa hay chuẩn hoá NFC; và tên bị cắt giữ dạng gốc hay dạng NFC? | Đọc theo ruling. FR-071 AC-12 đòi tên workspace giống từng byte tên folder khi tên không bị cắt, nên không khớp spec với folder tên NFD; FR-141 AC-6 so sánh sau NFC. Gate 2 review, không sửa AC ở Gate 1. | **Đã có** (PO, 09-11-2026): chuẩn hoá tên workspace thành NFC trước khi đếm, giới hạn độ dài và lưu tên; áp dụng nhất quán cho tên lấy từ folder và tên người dùng đặt. | **Đã vào spec** (09-11-2026): BR-020 (Statement, V-2), FR-071 (statement 1) và FR-141 (statement 5). |
| AM-3 | FR-083.1 | FR-083 chỉ nói cho workspace không phải default. Nó không nói điều gì xảy ra khi người dùng chọn folder cho default workspace. | Đọc theo ruling. FR-083 AC-5 chỉ kiểm default workspace vẫn không có project folder, chưa kiểm việc từ chối và lý do; Gate 2 review. Register có item FR-083.9 cho hành vi này. | **Đã có** (PO, 09-11-2026): default workspace không được gán project folder. Nếu người dùng cố chọn folder cho default workspace, hệ thống từ chối, không đổi trạng thái và giải thích lý do. | **Đã vào spec** (09-11-2026): FR-083 (statement 4). |
| AM-4 | Toàn build | Spec không nêu hệ điều hành mục tiêu. | Đọc theo ruling. Plan, CI và BR-019 dùng Windows. | **Đã có** (PO, 09-11-2026): Build 1 tập trung vào Windows. CI dùng `windows-2022`; build không tuyên bố hệ điều hành khác đã được kiểm chứng. | Không cần: ruling chỉ giới hạn điều build tuyên bố đã kiểm chứng. |
| AM-5 | QR-8 | Ai được gọi server local (tiến trình khác, người dùng khác, trang web): trước ruling, spec không có câu nào. | Đọc theo ruling. Security — authorization được chọn; hành vi là FR-143 (FR-143.1, FR-143.2). Cơ chế (session token, Origin validation hay khác) do implementation plan quyết. | **Đã có** (PO, 09-11-2026): chỉ các client được DeckAgent cho phép mới được thực hiện thao tác thay đổi trạng thái workspace và chat. Một trang web bên ngoài không được tự ý thực hiện các thao tác đó qua server local. **Giới hạn khai rõ:** không bảo vệ trước tiến trình khác chạy cùng quyền hệ điều hành. Build 1 không thiết kế hệ thống đăng nhập. | **Đã vào spec** (09-11-2026): FR-143, requirement mới; ID là next free ID của FR (FR-143), PO cho phép chọn. |
| AM-6 | FR-073.1 | Spec không nói điều gì xảy ra với đổi tên, chọn folder, chuyển workspace khi DeckAgent đang chờ xác nhận xoá. | Z-9: không test. | Đã có: Z-9, không test (PO, 09-11-2026); PO giữ ruling (09-11-2026) | Không cần. |
| AM-7 | NFR-008.1a | NFR-008 chỉ nói về trạng thái của mỗi chat. Nó không nói về workspace nửa chừng khi kill giữa thêm, đổi tên hay chọn folder. | Z-14: chỉ có unit test chèn lỗi của transaction xoá. | Đã có: Z-14, duyệt như đề xuất (PO, 09-11-2026); PO giữ ruling, không mở rộng NFR-008 sang mọi transaction (09-11-2026) | Không cần. |
| AM-8 | BR-019 V-1 | V-1 nói "root của mọi drive, ví dụ `C:\` và `D:\`" rồi "Closed list.". Hai câu mâu thuẫn: một lớp giá trị không phải danh sách hữu hạn. | Đọc theo ruling. BR-019.V1 là một lớp giá trị (kind range or format); tiêu chí closed list không áp dụng; Gate 2 áp dụng EP theo các dạng drive. | **Đã có** (PO, 09-11-2026): V-1 là root của mọi drive. `C:\` và `D:\` chỉ là ví dụ, không phải hai phần tử của một danh sách đóng. | **Đã vào spec** (09-11-2026): BR-019 V-1 đã bỏ dòng "Closed list.". |

### Candidate gaps

<!-- Nguồn: review trước (BR-019, BR-020) và việc đọc spec lần này. Chưa xác nhận; plan có thể đã phủ ở AC tôi chưa đọc. Gate 2 kiểm bằng technique. -->

| ID | Item | Điều nghi ngờ | Technique sẽ kiểm |
|---|---|---|---|
| CG-1 | BR-019.V4a | Chỉ `.ssh` thấy trong FR-071 AC-7; bốn key folder còn lại (`.aws`, `.gnupg`, `.kube`, `.docker`) chưa thấy. Danh sách đóng ở mức high đòi mỗi phần tử có test. | EP, tiêu chí "closed lists" |
| CG-2 | BR-019.V4a | Value nói key folder "trong folder của người dùng". Chưa thấy test cho `.ssh` nằm ngoài folder của người dùng (không bị value này từ chối). | EP, biên của "trong folder người dùng" |
| CG-3 | BR-019.V3b | Chưa thấy test cho một folder bình thường bên trong folder người dùng được nhận (value này chỉ từ chối chính nó). | BVA, biên "chỉ chính nó" |
| CG-4 | BR-019.V1 | Chỉ `C:\` thấy trong FR-071 AC-6. Root của drive khác chưa thấy; fixture `substDrive` có thể cung cấp. V1 không phải danh sách đóng (AM-8), nên không áp dụng tiêu chí "mỗi phần tử một test". | EP theo các dạng drive |
| CG-5 | BR-019.V2a | FR-071 AC-7 dùng một system folder thay thế; từng phần tử trong ba folder (kể cả `Program Files (x86)`) chưa có test riêng. | EP, tiêu chí "closed lists" |
| CG-6 | BR-019.V5c | "Mọi folder chứa data folder" gồm cả `C:\Users` và mọi folder trung gian; FR-071 AC-6 chỉ thấy `C:\`, folder người dùng và `AppData`. | EP, biên của "folder chứa" |
| CG-7 | BR-019.R0 | "Đi theo link" gồm cả symbolic link; fixture hiện có là junction, ổ `subst` và tiền tố `\\?\`. | Threat-based |
| CG-8 | BR-020.V2a | Strategy đòi biên kiểm tại, dưới và trên. Plan có 0, 1, 100, 101; chưa thấy 2 và 99. | BVA ba giá trị |
| CG-9 | BR-020.V2b | FR-141 AC-6 phủ NFC với NFD; chưa thấy ký tự ngoài BMP (code point khác đơn vị UTF-16). | EP, biến phụ "đơn vị đếm" |
| CG-10 | BR-020.R | FR-141 AC-7 phủ trim ở biên dưới (`" x "`); chưa thấy tên 100 ký tự có khoảng trắng hai đầu (lỗi "đếm trước khi trim"). | BVA, biến phụ "trim" |
| CG-11 | X6, X7 | Các câu giữ conversation, deck, selected model, "không dừng request" khi đổi tên, "không gửi gì" khi đổi draft: chưa có trong bảng "Moved to a later build". | **Đã xử lý** (PO, 09-11-2026): SR-2, SR-8a đến SR-8d và SR-9, theo quy tắc RQ-15 (test ở build đầu tiên test được) |
| CG-12 | X4 | FR-065 nằm ngoài scope, nhưng câu "nói chat không có selected model" của UC-012 A1 đang được kiểm bằng FR-053 AC-5. | **Đã có ruling** (PO, 09-11-2026): giữ FR-065 ngoài scope Build 1; UC-012 A1 là Test Basis của câu này |

**PO ruling (09-11-2026):** approve CG-1 đến CG-10 làm đầu vào Test Design tại Gate 2, không approve chúng thành test case. CG-11 và CG-12 đã được xử lý như ghi trong bảng. Gate 2 áp dụng EP theo các dạng drive cho BR-019.V1 (CG-4).
