---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Basis register — workspace theo folder và chat mới"
milestone: mvp
created: 09-11-2026
---

# Basis register — workspace theo folder và chat mới

<!-- Một phần của test analysis, nằm cạnh test-analysis.md (dev/development/test-strategy.md "Test basis register"). File này chỉ giữ các dòng của register; số đếm và ambiguity nằm ở test-analysis.md; scope ruling ở mục "Items not tested" của traceability-matrix.md. Đơn vị spec mà mỗi item được cắt ra nằm ở sentence-map.md.
     Build file viết bằng tiếng Việt với thuật ngữ tiếng Anh (dev/mvp/builds/_STYLE.md). ID của basis item do register đặt: FR-071.3 là item thứ ba cắt từ FR-071; FR-071.N1 cắt từ mục Notes; UC-013.A2a là phần đầu của luồng phụ A2 (phần sau là A2b). -->

## Contents

- [At a glance](#at-a-glance)
- [FR-071 · Thêm workspace và chuyển workspace](#fr-071--thêm-workspace-và-chuyển-workspace)
- [FR-072 · Workspace mặc định từ lần khởi động đầu](#fr-072--workspace-mặc-định-từ-lần-khởi-động-đầu)
- [FR-073 · Xoá workspace](#fr-073--xoá-workspace)
- [FR-074 · Báo project folder không đọc được](#fr-074--báo-project-folder-không-đọc-được)
- [FR-083 · Chọn project folder khác cho workspace](#fr-083--chọn-project-folder-khác-cho-workspace)
- [FR-142 · Báo folder khác ở chỗ của project folder](#fr-142--báo-folder-khác-ở-chỗ-của-project-folder)
- [FR-084 · Giữ nguyên file của project folder](#fr-084--giữ-nguyên-file-của-project-folder)
- [FR-141 · Đổi tên workspace](#fr-141--đổi-tên-workspace)
- [FR-143 · Từ chối thao tác thay đổi trạng thái từ client không được phép](#fr-143--từ-chối-thao-tác-thay-đổi-trạng-thái-từ-client-không-được-phép)
- [FR-053 · Bắt đầu chat mới](#fr-053--bắt-đầu-chat-mới)
- [FR-048 · Hiện các chat cũ](#fr-048--hiện-các-chat-cũ)
- [FR-038 · Giữ draft của chat](#fr-038--giữ-draft-của-chat)
- [NFR-008 · Giữ trạng thái đã lưu sau khi kết thúc bất ngờ](#nfr-008--giữ-trạng-thái-đã-lưu-sau-khi-kết-thúc-bất-ngờ)
- [BR-004 · Chat được giữ làm công việc cũ](#br-004--chat-được-giữ-làm-công-việc-cũ)
- [BR-019 · Folder không thể làm project folder](#br-019--folder-không-thể-làm-project-folder)
- [BR-020 · Tên bị từ chối cho workspace](#br-020--tên-bị-từ-chối-cho-workspace)
- [UC-013 · Giữ công việc của deck trong workspace của các folder](#uc-013--giữ-công-việc-của-deck-trong-workspace-của-các-folder)
- [UC-012 · Bắt đầu chat mới cho một deck khác](#uc-012--bắt-đầu-chat-mới-cho-một-deck-khác)

## At a glance

- **Mục đích:** **mọi basis item** của spec trong scope, đơn vị của **requirement coverage**. Condition, AC và test case **trích các ID này**.
- **Số đếm:** [test-analysis.md](./test-analysis.md) mục 1 · **Scope ruling:** [traceability-matrix.md](../traceability-matrix.md) mục "Items not tested" · **Sentence map:** [sentence-map.md](./sentence-map.md)
- **Status:** _180 basis item (114 to test · 64 deferred · 2 excluded) · 0 pending_

<!-- Một dòng cho mỗi basis item. Risk lấy từ dòng FR hoặc NFR trong testing-plan.md (BR lấy mức cao nhất của các FR trích nó; flow của UC lấy mức cao nhất của các FR nó dùng). Scope: to test | deferred | excluded; mục deferred hoặc excluded ghi SR-n, trỏ tới mục "Items not tested" của traceability-matrix.md. Approval: approved (scope của item đã được duyệt) | pending (chưa duyệt; pending không làm nhỏ mẫu số coverage). Approval chỉ nói scope đã được duyệt, không nói item đã được thiết kế test. Ambiguity trỏ về mục 4 của test-analysis.md. Danh sách đóng trong một giá trị của BR là một item; các phần tử là test data. -->

## FR-071 · Thêm workspace và chuyển workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-071.1 | FR-071 | Khi người dùng chọn một folder đọc được, DeckAgent thiết lập một workspace cho folder đó. | lifecycle | high | nhóm UNC deferred (SR-12) | to test | approved |
| FR-071.2 | FR-071 | DeckAgent đặt tên workspace theo tên folder, và cắt còn tên dài nhất (BR-020) khi tên folder dài hơn. | range or format | high | AM-2 | to test | approved |
| FR-071.3 | FR-071 | DeckAgent làm workspace mới thành workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-071.4 | FR-071 | Khi folder đã là project folder của một workspace, DeckAgent làm workspace đó thành workspace đang dùng và không thiết lập workspace thứ hai. | multi-condition rule | high | | to test | approved |
| FR-071.5 | FR-071 | Khi folder đó đã được dời sang chỗ khác, workspace nhận chỗ mới làm project folder. | lifecycle | high | | to test | approved |
| FR-071.6 | FR-071 | Chuyển sang một workspace đã thiết lập thì DeckAgent không hỏi folder. | lifecycle | high | | to test | approved |
| FR-071.7 | FR-071 | Folder không đọc được thì DeckAgent không thiết lập workspace. | multi-condition rule | high | AM-9 | to test | approved |
| FR-071.8 | FR-071 | Folder không thể làm project folder (BR-019) thì DeckAgent không thiết lập workspace, nói lý do, và nói rằng người dùng chọn được folder bên trong khi folder bên trong được phép. | multi-condition rule | high | | to test | approved |
| FR-071.9 | FR-071 | Thêm hoặc chuyển workspace giữ nguyên chat hiện tại và draft của nó. | invariant | high | | to test | approved |
| FR-071.10 | FR-071 | Thêm hoặc chuyển workspace không đổi file nào của người dùng. | invariant | high | | to test | approved |
| FR-071.11 | FR-071 | Thêm hoặc chuyển workspace không đọc file nào của folder. | invariant | high | | to test | approved |
| FR-071.12 | FR-071 | Thêm hoặc chuyển workspace không gửi gì tới model. | invariant | high | chưa có model | deferred (SR-1) | approved |
| FR-071.13 | FR-071 | Thêm hoặc chuyển workspace không dừng request nào. | invariant | high | chưa có request | deferred (SR-1) | approved |
| FR-071.14 | FR-071 | Chat mới vào workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-071.15 | FR-071 | Tên workspace lấy từ folder ở dạng NFC và không bị bỏ khoảng trắng nào (BR-020); folder giữ nguyên tên và path của nó. | range or format | high | AM-1, AM-2 | to test | approved |
| FR-071.N1 | FR-071 Notes; FR-073 Notes; UC-013 Notes | Folder từng có một workspace đã xoá thì thiết lập một workspace mới; chat của workspace đã xoá vẫn là ungrouped chat. | lifecycle | high | | to test | approved |

## FR-072 · Workspace mặc định từ lần khởi động đầu

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
| FR-072.7b | FR-072 | Chat của default workspace giữ conversation mà không cần folder. | invariant | normal | | deferred (SR-8a) | approved |
| FR-072.7c | FR-072 | Chat của default workspace giữ deck mà không cần folder. | invariant | normal | | deferred (SR-8c) | approved |

## FR-073 · Xoá workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-073.1 | FR-073 | DeckAgent chỉ xoá một workspace không phải default sau khi người dùng xác nhận. | lifecycle | high | AM-6 | to test | approved |
| FR-073.2 | FR-073 | Trước khi xoá, DeckAgent nói rằng project folder và chat của workspace vẫn còn. | lifecycle | high | | to test | approved |
| FR-073.3 | FR-073 | Xoá workspace không đổi folder và file nào của người dùng. | invariant | high | | to test | approved |
| FR-073.4a | FR-073 | Mỗi chat của workspace bị xoá trở thành một ungrouped chat. | lifecycle | high | | to test | approved |
| FR-073.4b | FR-073 | Ungrouped chat giữ selected model của nó (BR-004). | invariant | high | | deferred (SR-8b) | approved |
| FR-073.4c | FR-073 | Ungrouped chat giữ conversation của nó (BR-004). | invariant | high | | deferred (SR-8a) | approved |
| FR-073.4d | FR-073 | Ungrouped chat giữ deck của nó (BR-004). | invariant | high | | deferred (SR-8c) | approved |
| FR-073.5 | FR-073 | Khi workspace bị xoá đang là workspace đang dùng, default workspace trở thành workspace đang dùng. | lifecycle | high | | to test | approved |
| FR-073.6a | FR-073 | Khi một request trong chat của workspace đang chạy, DeckAgent không xoá gì. | lifecycle | high | | deferred (SR-1) | approved |
| FR-073.6b | FR-073 | Khi đó DeckAgent nói rằng request phải kết thúc trước. | lifecycle | high | | deferred (SR-1) | approved |
| FR-073.6c | FR-073 | Khi đó DeckAgent không dừng request nào. | invariant | high | | deferred (SR-1) | approved |
| FR-073.N1a | FR-073 Notes | Ungrouped chat không có project folder, như chat của default workspace. | lifecycle | high | | to test | approved |
| FR-073.N1b | FR-073 Notes | Agent không tới folder nào khi chưa được duyệt, với ungrouped chat (FR-077 sở hữu hành vi này). | invariant | high | | deferred (SR-2) | approved |
| FR-073.N2a | FR-073 Notes | Ungrouped chat không thuộc workspace nào, kể cả default workspace. | lifecycle | high | | to test | approved |

## FR-074 · Báo project folder không đọc được

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-074.1 | FR-074 | Khi project folder của một workspace không đọc được, DeckAgent nói như vậy. | multi-condition rule | high | | to test | approved |
| FR-074.2 | FR-074 | DeckAgent nêu tên workspace. | multi-condition rule | high | | to test | approved |
| FR-074.3 | FR-074 | DeckAgent nói người dùng làm gì tiếp, ví dụ đặt folder về chỗ cũ, cấp lại quyền hoặc chọn folder khác. | multi-condition rule | high | | to test | approved |
| FR-074.4 | FR-074 | DeckAgent không nêu nguyên nhân mà nó không biết, ví dụ việc xoá. | invariant | high | | to test | approved |
| FR-074.5 | FR-074 | DeckAgent không đọc file nào của folder trong lúc folder không đọc được. | invariant | high | | to test | approved |
| FR-074.6 | FR-074 | Workspace vẫn được thiết lập. | lifecycle | high | | to test | approved |
| FR-074.7a | FR-074 | Mỗi chat của workspace vẫn đọc được. | lifecycle | high | | to test | approved |
| FR-074.7b | FR-074 | Mỗi chat đó giữ conversation. | invariant | high | | deferred (SR-8a) | approved |
| FR-074.7c | FR-074 | Mỗi chat đó giữ deck. | invariant | high | | deferred (SR-8c) | approved |

## FR-083 · Chọn project folder khác cho workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-083.1 | FR-083 | Khi người dùng chọn folder khác cho một workspace không phải default, DeckAgent làm folder đó thành project folder của workspace. | lifecycle | high | AM-3 | to test | approved |
| FR-083.2 | FR-083 | DeckAgent giữ workspace, tên của nó và chat của nó. | invariant | high | | to test | approved |
| FR-083.3 | FR-083 | DeckAgent không đọc file nào của folder chỉ vì lần chọn đó. | invariant | high | | to test | approved |
| FR-083.4 | FR-083 | DeckAgent không bao giờ tự đổi project folder. | invariant | high | | to test | approved |
| FR-083.5 | FR-083 | Khi folder được chọn là project folder của workspace khác, DeckAgent không đổi workspace nào và nói workspace nào dùng folder đó. | multi-condition rule | high | | to test | approved |
| FR-083.6 | FR-083 | Khi folder được chọn không đọc được, DeckAgent không đổi workspace nào và nói folder không đọc được. | multi-condition rule | high | AM-9 | to test | approved |
| FR-083.7 | FR-083 | Khi folder được chọn không thể làm project folder (BR-019), DeckAgent không đổi workspace nào và nói vì sao. | multi-condition rule | high | | to test | approved |
| FR-083.8a | FR-083 | Khi một request trong chat của workspace đang chạy, DeckAgent không đổi project folder. | lifecycle | high | | deferred (SR-1) | approved |
| FR-083.8b | FR-083 | Khi đó DeckAgent nói rằng request phải kết thúc trước. | lifecycle | high | | deferred (SR-1) | approved |
| FR-083.8c | FR-083 | Khi đó DeckAgent không dừng request nào. | invariant | high | | deferred (SR-1) | approved |
| FR-083.9 | FR-083 | Khi người dùng chọn folder cho default workspace, DeckAgent từ chối, không đổi trạng thái nào và nói vì sao: default workspace không có project folder. | multi-condition rule | high | AM-3 | to test | approved |

## FR-142 · Báo folder khác ở chỗ của project folder

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-142.1 | FR-142 | Khi chỗ của project folder chứa một folder không phải folder người dùng đã chọn, DeckAgent nói có folder khác ở đó. | multi-condition rule | high | | to test | approved |
| FR-142.2 | FR-142 | DeckAgent nêu tên workspace. | multi-condition rule | high | | to test | approved |
| FR-142.3 | FR-142 | DeckAgent không đọc file nào của folder khác đó. | invariant | high | | to test | approved |
| FR-142.4 | FR-142 | Người dùng dùng được folder đó cho workspace; khi đó DeckAgent làm nó thành project folder theo cùng điều kiện như chọn folder khác (FR-083). | lifecycle | high | | to test | approved |
| FR-142.5 | FR-142 | Cho đến lúc đó workspace vẫn được thiết lập. | lifecycle | high | | to test | approved |
| FR-142.6a | FR-142 | Mỗi chat của workspace vẫn đọc được. | lifecycle | high | | to test | approved |
| FR-142.6b | FR-142 | Mỗi chat đó giữ conversation. | invariant | high | | deferred (SR-8a) | approved |
| FR-142.6c | FR-142 | Mỗi chat đó giữ deck. | invariant | high | | deferred (SR-8c) | approved |
| FR-142.N3 | FR-142 Notes | Thêm folder khác đó như một workspace thiết lập một workspace mới; workspace đầu tiên tiếp tục báo có folder khác. | lifecycle | high | | to test | approved |

## FR-084 · Giữ nguyên file của project folder

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-084.1a | FR-084 | Khi DeckAgent giữ công việc của chat, nó không tạo, đổi, dời hay xoá file nào trong project folder, kể cả file ẩn. | invariant | high | | to test | approved |
| FR-084.1b | FR-084 | Khi DeckAgent xử lý một request, nó không tạo, đổi, dời hay xoá file nào trong project folder. | invariant | high | | deferred (SR-2) | approved |
| FR-084.1c | FR-084 | Khi DeckAgent hiện một deck, nó không tạo, đổi, dời hay xoá file nào trong project folder. | invariant | high | | deferred (SR-8c) | approved |
| FR-084.2 | FR-084 | File người dùng đưa làm attachment giữ nguyên như người dùng đưa. | invariant | high | | deferred (SR-6) | approved |
| FR-084.3 | FR-084 | Một file chỉ xuất hiện trong project folder qua việc export người dùng chọn. | invariant | high | | deferred (SR-11) | approved |

## FR-141 · Đổi tên workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-141.1 | FR-141 | Khi người dùng đặt tên mới cho một workspace, DeckAgent đặt tên đó cho workspace, kể cả default workspace. | lifecycle | normal | | to test | approved |
| FR-141.2 | FR-141 | Đổi tên giữ project folder và chat của workspace. | invariant | normal | | to test | approved |
| FR-141.3 | FR-141 | Đổi tên không đổi folder và file nào của người dùng. | invariant | normal | | to test | approved |
| FR-141.4 | FR-141 | Đổi tên không dừng request nào. | invariant | normal | | deferred (SR-2) | approved |
| FR-141.5 | FR-141 | Hai workspace được phép trùng tên. | multi-condition rule | normal | | to test | approved |
| FR-141.6 | FR-141 | DeckAgent bỏ khoảng trắng ở hai đầu của tên mới (BR-020 V-3: các ký tự mà `String.prototype.trim()` của JavaScript bỏ). | range or format | normal | AM-1 | to test | approved |
| FR-141.7 | FR-141 | Tên bị từ chối (BR-020) không đổi gì: workspace giữ tên cũ. | multi-condition rule | normal | | to test | approved |
| FR-141.8 | FR-141 | DeckAgent nói vì sao tên bị từ chối. | multi-condition rule | normal | | to test | approved |
| FR-141.9 | FR-141 | DeckAgent giữ tên mới ở dạng NFC (BR-020). | range or format | normal | AM-2 | to test | approved |

## FR-143 · Từ chối thao tác thay đổi trạng thái từ client không được phép

<!-- Requirement mới theo AM-5 (QR-8). Rủi ro chưa đặt trong testing-plan.md nên mặc định high. -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-143.1 | FR-143 | Khi một thao tác thay đổi trạng thái workspace hoặc chat đến từ client mà DeckAgent không cho phép, DeckAgent từ chối thao tác và không đổi workspace nào, chat nào. | multi-condition rule | high | AM-5 | to test | approved |
| FR-143.2 | FR-143 | Một trang web bên ngoài DeckAgent không phải client được phép. | multi-condition rule | high | AM-5 | to test | approved |

## FR-053 · Bắt đầu chat mới

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-053.1a | FR-053 | Bắt đầu chat mới giữ nguyên mọi chat khác. | invariant | normal | | to test | approved |
| FR-053.1b | FR-053 | Bắt đầu chat mới giữ nguyên deck của các chat khác. | invariant | normal | | deferred (SR-8c) | approved |
| FR-053.1c | FR-053 | Bắt đầu chat mới giữ nguyên draft của các chat khác. | invariant | normal | | to test | approved |
| FR-053.2 | FR-053 | Bắt đầu chat mới không dừng request nào. | invariant | normal | | deferred (SR-1) | approved |
| FR-053.3 | FR-053 | Chat mới trở thành chat hiện tại trong workspace đang dùng. | lifecycle | normal | | to test | approved |
| FR-053.4 | FR-053 | Chat mới không có conversation, không có deck và có draft rỗng. | lifecycle | normal | | to test | approved |
| FR-053.5 | FR-053 | Chat mới không lấy gì từ chat khác. | invariant | normal | | to test | approved |
| FR-053.6 | FR-053 | Chat mới nhận selected model và reasoning level của lần chọn model gần nhất ở bất kỳ chat nào, khi model đó còn selectable (BR-005). | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.7a | FR-053 | Khi chưa từng chọn model nào, chat mới không có selected model. | multi-condition rule | normal | | to test | approved |
| FR-053.7b | FR-053 | Khi model của lần chọn gần nhất không còn selectable, chat mới không có selected model. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1a | FR-053 Notes | DeckAgent không lùi về các lần chọn model trước đó. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1b | FR-053 Notes | Một model bị gỡ rồi thêm lại được tính khi nó selectable. | multi-condition rule | normal | | deferred (SR-5) | approved |
| FR-053.N1c | FR-053 Notes | Tầm với của agent giống nhau ở mọi chat (FR-077 sở hữu hành vi này). | invariant | normal | | deferred (SR-2) | approved |
| FR-053.N2 | FR-053 Notes; UC-012 Notes | Một chat chứa nhiều nhất một deck, nên deck khác bắt đầu ở chat mới. | invariant | normal | | deferred (SR-8c) | approved |

## FR-048 · Hiện các chat cũ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-048.1 | FR-048 | Khi người dùng xin công việc cũ, DeckAgent hiện các chat cũ của workspace đang dùng mà người dùng được mở (BR-004). | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.2 | FR-048 | Danh sách gồm cả chat từ trước lần DeckAgent khởi động gần nhất. | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.3 | FR-048 | DeckAgent hiện ungrouped chat tách riêng, dù workspace nào đang dùng. | lifecycle | normal | | deferred (SR-3) | approved |
| FR-048.4 | FR-048 | DeckAgent đặt tên mỗi chat theo nội dung của nó. | multi-condition rule | normal | | deferred (SR-3) | approved |
| FR-048.5 | FR-048 | DeckAgent nói chat đổi lần cuối khi nào. | multi-condition rule | normal | | deferred (SR-3) | approved |
| FR-048.6 | FR-048 | DeckAgent nói chat có slide hay không. | multi-condition rule | normal | | deferred (SR-4) | approved |
| FR-048.7 | FR-048 | Khi không có chat cũ nào, DeckAgent nói như vậy, và chat hiện tại cùng draft của nó giữ nguyên. | multi-condition rule | normal | | to test | approved |

## FR-038 · Giữ draft của chat

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| FR-038.1a | FR-038 | DeckAgent giữ draft của mỗi chat khi người dùng ở chat khác, và hiện nguyên vẹn khi người dùng quay lại. | lifecycle | normal | | to test | approved |
| FR-038.1b | FR-038 | DeckAgent giữ draft của mỗi chat khi người dùng ở màn setup, và hiện nguyên vẹn khi người dùng quay lại. | lifecycle | normal | | deferred (SR-9) | approved |
| FR-038.2 | FR-038 | DeckAgent giữ draft khi interface được tải lại, hoặc đóng rồi mở lại. | lifecycle | normal | | to test | approved |
| FR-038.3 | FR-038 | Mọi interface đang mở hiện cùng draft của một chat. | lifecycle | normal | | to test | approved |
| FR-038.4a | FR-038 | Việc đi chỗ khác không thêm gì vào draft. | invariant | normal | | to test | approved |
| FR-038.4b | FR-038 | Việc đi chỗ khác không gửi gì. | invariant | normal | | deferred (SR-2) | approved |
| FR-038.5 | FR-038 | DeckAgent không giữ draft sau khi DeckAgent dừng. | lifecycle | normal | | to test | approved |

## NFR-008 · Giữ trạng thái đã lưu sau khi kết thúc bất ngờ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| NFR-008.1a | NFR-008 | Khi DeckAgent kết thúc bất ngờ, trạng thái đã lưu gần nhất của mỗi chat được giữ. | reliability | high | AM-7 | to test | approved |
| NFR-008.1b | NFR-008 | Trạng thái đã lưu gần nhất của deck được giữ. | reliability | high | | deferred (SR-8d) | approved |
| NFR-008.1c | NFR-008 | Trạng thái đã lưu gần nhất của setup provider và model được giữ. | reliability | high | | deferred (SR-9) | approved |
| NFR-008.2a | NFR-008 | Sau khi DeckAgent khởi động lại, mỗi chat mở ở trạng thái đã lưu gần nhất. | reliability | high | | to test | approved |
| NFR-008.2b | NFR-008 | Sau khi khởi động lại, mỗi chat nhận một request mới. | reliability | high | | deferred (SR-7) | approved |
| NFR-008.3 | NFR-008 | Thay đổi chưa xong của một slide không hiện như kết quả đã xong. | reliability | high | | deferred (SR-8d) | approved |

## BR-004 · Chat được giữ làm công việc cũ

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BR-004.V1 | BR-004 | DeckAgent giữ mọi chat mà người dùng đã gửi ít nhất một request; chat chưa gửi request không bắt buộc phải hiện. | multi-condition rule | high | | deferred (SR-3) | approved |
| BR-004.V2 | BR-004 | DeckAgent không xoá chat, conversation hay deck nào vì tuổi của chúng. | invariant | high | | excluded (SR-10) | approved |
| BR-004.V3 | BR-004 | Mọi chat của workspace bị xoá được giữ, như ungrouped chat. | lifecycle | high | | to test | approved |

## BR-019 · Folder không thể làm project folder

<!-- Các danh sách đóng (V-2 phần ba folder, V-4 phần năm key folder) là một item mỗi danh sách; phần tử của danh sách là test data. Ở mức rủi ro high, tiêu chí của strategy là mỗi phần tử có một test (test-strategy.md "Closed lists"). V-1 không phải danh sách đóng (AM-8; spec V-1 đã bỏ dòng "Closed list."): root của mọi drive là một lớp giá trị, `C:\` và `D:\` chỉ là ví dụ, và test design chia lớp theo dạng drive. -->

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

## BR-020 · Tên bị từ chối cho workspace

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| BR-020.R | BR-020 | DeckAgent so tên với luật sau khi chuẩn hoá NFC và, với tên người dùng đặt, sau khi bỏ khoảng trắng ở hai đầu. | range or format | high | AM-1, AM-2, CG-10 | to test | approved |
| BR-020.V1 | BR-020 | DeckAgent từ chối tên không có ký tự nào sau khi bỏ khoảng trắng ở hai đầu. | range or format | high | | to test | approved |
| BR-020.V2a | BR-020 | DeckAgent nhận tên dài tối đa 100 ký tự, gồm cả 100, và từ chối tên dài hơn. | range or format | high | CG-8 | to test | approved |
| BR-020.V2b | BR-020 | Một ký tự là một Unicode code point sau khi chuẩn hoá NFC, nên "Việt" dài 4 ký tự. | range or format | high | AM-2, CG-9 | to test | approved |
| BR-020.V2c | BR-020 | DeckAgent chuẩn hoá tên thành NFC trước khi đếm ký tự, áp giới hạn độ dài và lưu tên, cho cả tên lấy từ folder và tên người dùng đặt; folder giữ nguyên tên của nó. | range or format | high | AM-2 | to test | approved |
| BR-020.V3 | BR-020 | Khoảng trắng là các ký tự mà `String.prototype.trim()` của JavaScript bỏ ở hai đầu (dấu cách, tab, no-break space U+00A0, ideographic space U+3000). DeckAgent bỏ chúng khỏi tên người dùng đặt và không bỏ gì khỏi tên lấy từ folder. | range or format | high | AM-1, CG-10 | to test | approved |

## UC-013 · Giữ công việc của deck trong workspace của các folder

<!-- Mỗi step và mỗi alternative là một item (flow). Một flow gồm hành vi thuộc nhiều phạm vi (cần request, model, conversation hoặc deck, và không cần) thì tách thành các item a, b, c, d, mỗi item một phạm vi, để scope đúng với toàn bộ item. Các câu bên trong chúng được ánh xạ ở sentence-map.md. -->

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| UC-013.S1 | UC-013 | Người dùng chọn làm việc ở workspace khác; DeckAgent hiện mỗi workspace theo tên, default workspace trong đó, và workspace nào đang dùng; chat hiện tại và draft giữ nguyên. | flow | high | | to test | approved |
| UC-013.S2a | UC-013 | Người dùng chọn một folder cho workspace mới; DeckAgent thiết lập workspace, đặt tên theo folder, làm nó đang dùng, không đọc file của folder, không đổi file của người dùng, và giữ chat hiện tại cùng draft. | flow | high | | to test | approved |
| UC-013.S2b | UC-013 | Khi đó DeckAgent không gửi gì tới model và giữ mọi request đang chạy trong chat của chúng. | flow | high | | deferred (SR-1) | approved |
| UC-013.S3a | UC-013 | Người dùng làm việc trong workspace đang dùng; DeckAgent đặt mỗi chat mới vào workspace đó, và không tạo, đổi hay xoá file trong project folder. | flow | high | | to test | approved |
| UC-013.S3b | UC-013 | DeckAgent hiện các chat của workspace đang dùng như công việc cũ (BR-004). | flow | normal | | deferred (SR-3) | approved |
| UC-013.A1 | UC-013 | Khi folder đã là project folder của một workspace, DeckAgent làm workspace đó đang dùng và không thiết lập workspace thứ hai; tiếp tục ở S3. | flow | high | | to test | approved |
| UC-013.A2a | UC-013 | Khi người dùng xoá một workspace không phải default và không có request đang chạy, DeckAgent nói folder và chat vẫn còn, rồi hỏi xác nhận; khi xác nhận thì xoá workspace, không đổi file của người dùng, đổi chat của nó thành ungrouped chat, và làm default workspace đang dùng nếu workspace bị xoá đang dùng; khi huỷ thì không xoá gì. | flow | high | | to test | approved |
| UC-013.A2b | UC-013 | Ungrouped chat giữ selected model của nó (BR-004). | flow | high | | deferred (SR-8b) | approved |
| UC-013.A2c | UC-013 | Ungrouped chat giữ conversation của nó (BR-004). | flow | high | | deferred (SR-8a) | approved |
| UC-013.A2d | UC-013 | Ungrouped chat giữ deck của nó (BR-004). | flow | high | | deferred (SR-8c) | approved |
| UC-013.A3 | UC-013 | Khi project folder của một workspace không đọc được, DeckAgent nói như vậy, nêu tên workspace, nói người dùng làm gì tiếp, không nêu nguyên nhân nó không biết, và giữ workspace cùng chat đọc được. | flow | high | | to test | approved |
| UC-013.A5 | UC-013 | Khi người dùng xoá workspace hoặc chọn folder khác trong lúc một request của workspace đang chạy, DeckAgent không đổi workspace nào, nói request phải kết thúc trước và không dừng request. | flow | high | | deferred (SR-1) | approved |
| UC-013.A6a | UC-013 | Khi người dùng chọn một folder khác đọc được mà chưa workspace nào có, cho workspace không phải default và không có request đang chạy, DeckAgent làm nó thành project folder, giữ workspace và chat, và không đọc file của folder. | flow | high | | to test | approved |
| UC-013.A6b | UC-013 | Khi đó DeckAgent không gửi gì tới model. | flow | high | | deferred (SR-2) | approved |
| UC-013.A7a | UC-013 | Khi người dùng chọn một workspace đã thiết lập, DeckAgent làm nó đang dùng, không hỏi folder, không đổi file của người dùng, và giữ chat hiện tại cùng draft; tiếp tục ở S3. | flow | high | | to test | approved |
| UC-013.A7b | UC-013 | Khi đó DeckAgent giữ mọi request đang chạy trong chat của chúng. | flow | high | | deferred (SR-1) | approved |
| UC-013.A8 | UC-013 | Khi folder được chọn cho một workspace là folder của workspace khác, không đọc được hoặc bị từ chối, DeckAgent không đổi workspace nào và nói lý do. | flow | high | | to test | approved |
| UC-013.A9 | UC-013 | Khi người dùng không chọn folder, hoặc folder không đọc được hoặc không thể làm project folder, DeckAgent không thiết lập workspace, giữ workspace đang dùng, và nói lý do. | flow | high | | to test | approved |
| UC-013.A10 | UC-013 | Khi DeckAgent khởi động lần đầu, nó làm default workspace đang dùng và không hỏi folder; tiếp tục ở S3. | flow | normal | | to test | approved |
| UC-013.A11a | UC-013 | Khi người dùng đặt tên mới cho workspace, DeckAgent đặt tên đó, giữ project folder và chat, và không đổi file của người dùng. | flow | normal | | to test | approved |
| UC-013.A11b | UC-013 | Khi đó DeckAgent giữ mọi request đang chạy trong chat của workspace. | flow | normal | | deferred (SR-2) | approved |
| UC-013.A12 | UC-013 | Khi chỗ của project folder chứa một folder người dùng chưa chọn, DeckAgent nói có folder khác, nêu tên workspace, không đọc file, đề nghị dùng folder đó cho workspace (tiếp tục như A6), và giữ workspace cùng chat đọc được. | flow | high | | to test | approved |
| UC-013.A13 | UC-013 | Khi tên người dùng đặt bị từ chối (BR-020), DeckAgent giữ tên cũ, nói vì sao tên bị từ chối và không đổi file. | flow | normal | | to test | approved |
| UC-013.G1 | UC-013 | Mọi file của người dùng trong project folder giữ nguyên, và DeckAgent không đổi, dời hay xoá file nào của người dùng. | invariant | high | | to test | approved |
| UC-013.G2a | UC-013 | DeckAgent không xoá chat nào. | invariant | high | | to test | approved |
| UC-013.G2b | UC-013 | DeckAgent không xoá conversation nào. | invariant | high | | deferred (SR-8a) | approved |
| UC-013.G2c | UC-013 | DeckAgent không xoá deck nào. | invariant | high | | deferred (SR-8c) | approved |
| UC-013.G3 | UC-013 | Không request đang chạy nào bị dừng. | invariant | high | | deferred (SR-2) | approved |
| UC-013.N1 | UC-013 Notes | Agent của chat đọc file của project folder mà không hỏi (FR-077 sở hữu hành vi này). | invariant | high | | deferred (SR-2) | approved |
| UC-013.N2 | UC-013 Notes | File của project folder được gọi tên trong text của request; DeckAgent không có tham chiếu đặt tên riêng (UC-003 sở hữu hành vi này). | multi-condition rule | high | | deferred (SR-2) | approved |

## UC-012 · Bắt đầu chat mới cho một deck khác

| ID | Source | Item | Kind | Risk | Ambiguity | Scope | Approval |
|---|---|---|---|---|---|---|---|
| UC-012.S1a | UC-012 | Người dùng chọn bắt đầu chat mới; DeckAgent giữ chat vừa rời cùng draft của nó, đặt chat mới thành chat hiện tại trong workspace đang dùng với không conversation, không deck, draft rỗng, và không lấy gì từ chat khác. | flow | normal | | to test | approved |
| UC-012.S1b | UC-012 | DeckAgent giữ deck của chat vừa rời. | flow | normal | | deferred (SR-8c) | approved |
| UC-012.S1c | UC-012 | DeckAgent giữ request đang chạy ở chat vừa rời. | flow | normal | | deferred (SR-1) | approved |
| UC-012.S2a | UC-012 | DeckAgent hiện selected model của chat mới theo lần chọn model gần nhất (BR-005). | flow | normal | | deferred (SR-5) | approved |
| UC-012.S2b | UC-012 | DeckAgent không gửi gì và nhận request đầu tiên. | flow | normal | | deferred (SR-2) | approved |
| UC-012.S2c | UC-012 | DeckAgent không dựng deck cho chat mới. | flow | normal | | to test | approved |
| UC-012.A1a | UC-012 | Khi chưa từng chọn model, DeckAgent để chat mới không có selected model, nói như vậy và không tự chọn model khác. | flow | normal | | to test | approved |
| UC-012.A1b | UC-012 | Khi model của lần chọn gần nhất không còn selectable, DeckAgent để chat mới không có selected model, nói như vậy và không tự chọn model khác. | flow | normal | | deferred (SR-5) | approved |
| UC-012.N1 | UC-012 Notes | Archive nguồn đã export, đính kèm vào chat mới, là material như mọi attachment; không có gì được import thành deck để sửa. | multi-condition rule | normal | | deferred (SR-13) | approved |
