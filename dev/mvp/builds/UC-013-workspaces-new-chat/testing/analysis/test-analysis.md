---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Test analysis — workspace theo folder và chat mới"
milestone: mvp
created: 09-11-2026
---

# Test analysis — workspace theo folder và chat mới

<!-- Record của Gate 1 (dev/development/test-strategy.md "Test basis register", "Test types and approaches", "Automation feasibility", "Gates"). Các dòng của register nằm ở basis-register.md (cách đặt ID của basis item ghi ở đầu file đó); sentence map ở sentence-map.md; item không test, cùng scope ruling của chúng, ở mục "Items not tested" của matrix. File này giữ số đếm, quality risk và test type, mechanism, ambiguity và candidate gap.
     Build file viết bằng tiếng Việt với thuật ngữ tiếng Anh (dev/mvp/builds/_STYLE.md). -->

## Contents

- [At a glance](#at-a-glance)
- [1. Test basis register](#1-test-basis-register)
- [2. Quality risks và test types](#2-quality-risks-và-test-types)
- [3. Automation feasibility](#3-automation-feasibility)
- [4. Ambiguities và candidate gaps](#4-ambiguities-và-candidate-gaps)
  - [Ambiguities](#ambiguities)
  - [Candidate gaps](#candidate-gaps)

## At a glance

- **Use case:** UC-013, UC-012
- **Steps:** all
- **Alternatives:** all, trừ các item **không test** ở build này ([matrix](../traceability-matrix.md), mục "Items not tested")
- **Spine:** [traceability-matrix.md](../traceability-matrix.md) · **Approach, levels, targets:** [testing-plan.md](../planning/testing-plan.md)
- **Nguồn:** UC-013, UC-012, FR-038, FR-048, FR-053, FR-071, FR-072, FR-073, FR-074, FR-083, FR-084, FR-141, FR-142, FR-143, NFR-008, BR-004, BR-019, BR-020, DEC-010 đến DEC-013, research-checklist.md, windows-folders.md. FR-065, FR-068 và BR-005 **nằm ngoài scope**.
- **Status:** _180 basis item (114 to test · 64 deferred · 2 excluded · 0 pending) · mẫu số requirement coverage 114 · 230 đơn vị spec (178 normative, 19 explanatory, 33 definition) · 0 đơn vị normative chưa có item · 10 quality risk · 8 type (6 chọn) và 6 aspect của security (3 chọn) · 19 mechanism (19 assumed) · 9 ambiguity (0 pending) · 10 candidate gap_

## 1. Test basis register

- **Register:** [basis-register.md](./basis-register.md), một dòng cho mỗi basis item · **Sentence map:** [sentence-map.md](./sentence-map.md), mọi đơn vị của spec trong scope · **Items not tested:** [traceability-matrix.md](../traceability-matrix.md)

<!-- Một dòng cho mỗi spec, theo thứ tự của register. Mọi số đếm đọc từ hai file trên: Items, To test, Deferred, Excluded và Pending từ register; Đơn vị và Normative chưa có item từ sentence map. Pending: item excluded hoặc deferred mà PO chưa duyệt scope; chúng vẫn ở trong mẫu số coverage, là To test + Pending. -->

| Spec | Items | To test | Deferred | Excluded | Pending | Đơn vị | Normative chưa có item |
|---|---|---|---|---|---|---|---|
| [FR-071](./basis-register.md#fr-071--thêm-workspace-và-chuyển-workspace) · Thêm workspace và chuyển workspace | 16 | 14 | 2 | 0 | 0 | 11 | 0 |
| [FR-072](./basis-register.md#fr-072--workspace-mặc-định-từ-lần-khởi-động-đầu) · Workspace mặc định từ lần khởi động đầu | 10 | 7 | 2 | 1 | 0 | 4 | 0 |
| [FR-073](./basis-register.md#fr-073--xoá-workspace) · Xoá workspace | 14 | 7 | 7 | 0 | 0 | 6 | 0 |
| [FR-074](./basis-register.md#fr-074--báo-project-folder-không-đọc-được) · Báo project folder không đọc được | 9 | 7 | 2 | 0 | 0 | 5 | 0 |
| [FR-083](./basis-register.md#fr-083--chọn-project-folder-khác-cho-workspace) · Chọn project folder khác cho workspace | 11 | 8 | 3 | 0 | 0 | 4 | 0 |
| [FR-142](./basis-register.md#fr-142--báo-folder-khác-ở-chỗ-của-project-folder) · Báo folder khác ở chỗ của project folder | 9 | 7 | 2 | 0 | 0 | 11 | 0 |
| [FR-084](./basis-register.md#fr-084--giữ-nguyên-file-của-project-folder) · Giữ nguyên file của project folder | 5 | 1 | 4 | 0 | 0 | 5 | 0 |
| [FR-141](./basis-register.md#fr-141--đổi-tên-workspace) · Đổi tên workspace | 9 | 8 | 1 | 0 | 0 | 6 | 0 |
| [FR-143](./basis-register.md#fr-143--từ-chối-thao-tác-thay-đổi-trạng-thái-từ-client-không-được-phép) · Từ chối thao tác thay đổi trạng thái từ client không được phép | 2 | 2 | 0 | 0 | 0 | 7 | 0 |
| [FR-053](./basis-register.md#fr-053--bắt-đầu-chat-mới) · Bắt đầu chat mới | 14 | 6 | 8 | 0 | 0 | 9 | 0 |
| [FR-048](./basis-register.md#fr-048--hiện-các-chat-cũ) · Hiện các chat cũ | 7 | 1 | 6 | 0 | 0 | 4 | 0 |
| [FR-038](./basis-register.md#fr-038--giữ-draft-của-chat) · Giữ draft của chat | 7 | 5 | 2 | 0 | 0 | 4 | 0 |
| [NFR-008](./basis-register.md#nfr-008--giữ-trạng-thái-đã-lưu-sau-khi-kết-thúc-bất-ngờ) · Giữ trạng thái đã lưu sau khi kết thúc bất ngờ | 6 | 2 | 4 | 0 | 0 | 6 | 0 |
| [BR-004](./basis-register.md#br-004--chat-được-giữ-làm-công-việc-cũ) · Chat được giữ làm công việc cũ | 3 | 1 | 1 | 1 | 0 | 7 | 0 |
| [BR-019](./basis-register.md#br-019--folder-không-thể-làm-project-folder) · Folder không thể làm project folder | 13 | 13 | 0 | 0 | 0 | 14 | 0 |
| [BR-020](./basis-register.md#br-020--tên-bị-từ-chối-cho-workspace) · Tên bị từ chối cho workspace | 6 | 6 | 0 | 0 | 0 | 10 | 0 |
| [UC-013](./basis-register.md#uc-013--giữ-công-việc-của-deck-trong-workspace-của-các-folder) · Giữ công việc của deck trong workspace của các folder | 30 | 16 | 14 | 0 | 0 | 89 | 0 |
| [UC-012](./basis-register.md#uc-012--bắt-đầu-chat-mới-cho-một-deck-khác) · Bắt đầu chat mới cho một deck khác | 9 | 3 | 6 | 0 | 0 | 28 | 0 |
| **Tổng** | **180** | **114** | **64** | **2** | **0** | **230** | **0** |

## 2. Quality risks và test types

<!-- Quality risk là rủi ro về chất lượng mà spec có thể không gọi tên. Risk level giống mức risk của FR; chưa đặt thì là high. -->

| ID | Quality risk | Nguồn | Risk level |
|---|---|---|---|
| QR-1 | Một folder đến được bằng nhiều dạng đường dẫn (khác hoa thường, `/` thay `\`, tiền tố `\\?\`, tên 8.3, junction, ổ `subst`), nên DeckAgent tạo workspace thứ hai hoặc để lọt một folder bị từ chối. | FR-071.4, BR-019.R0, đặc điểm đường dẫn Windows ([windows-folders.md](../../../../research/windows-folders.md) mục 1) | high |
| QR-2 | DeckAgent nhận làm project folder một folder quá rộng hoặc chứa key; ở build 3 agent sẽ đọc mọi file của folder và gửi cho provider. | BR-019 (Why), FR-071.8 | high |
| QR-3 | DeckAgent ghi vào project folder (data folder nằm bên trong, file ẩn hay file tạm), hoặc đọc file của folder lúc thêm. | FR-084.1a, FR-071.10, FR-071.11, BR-019.V5 | high |
| QR-4 | Định danh của folder đổi theo thời gian: folder bị dời, bị thay bằng folder khác ở chỗ cũ, mất quyền đọc; ID folder có thể không ổn định trên USB exFAT hay ổ mạng. | FR-074, FR-142; [windows-folders.md](../../../../research/windows-folders.md) mục 2 (chỉ chạy trên NTFS) | high |
| QR-5 | DeckAgent bị kill giữa lúc xoá workspace hoặc tạo chat, nên một chat trỏ vào workspace đã xoá hoặc nằm ở hai chỗ. | NFR-008, FR-073, RQ-10 | high |
| QR-6 | Nhiều interface mở cùng lúc lệch nhau về workspace đang dùng, chat hiện tại và draft. | DEC-012, FR-038.3, FR-053 | normal |
| QR-7 | Tên Unicode: đơn vị đếm (code point, UTF-16), chuẩn hoá NFC hay NFD, ký tự ngoài BMP, cắt tên giữa một chuỗi ký tự. | BR-020, FR-071.2 | high |
| QR-8 | Server local có thể bị **trang web bên ngoài**, tiến trình khác hoặc người dùng khác gọi tới, rồi thêm, đổi tên, xoá workspace hoặc đổi chat. Hành vi mong đợi là FR-143. | DEC-010 (server local với trình duyệt), FR-143 | high |
| QR-9 | Ổ chậm hoặc ổ mạng làm chậm việc kiểm "đọc được" của mỗi workspace khi hiện danh sách. **Known risk**: Build 1 **không đo** hiệu năng; xem lại khi implementation plan chọn **thời điểm kiểm folder** (RQ-6). | RQ-6 | normal |
| QR-10 | Người dùng thấy lý do sai hoặc trống cho một folder bị từ chối, một folder không đọc được hoặc một tên bị từ chối, kể cả lý do nêu một nguyên nhân mà DeckAgent không biết. | FR-074.4, FR-071.8, FR-083.5 đến FR-083.7, FR-141.8 | high |

<!-- Selected: yes (kèm nguồn) | no (kèm lý do). Oracle status: asserted | recorded-only. Approach: scripted automated | scripted manual | exploratory (một type có thể dùng nhiều approach). -->

| Type | Selected | Nguồn hoặc lý do | Oracle status | Approach |
|---|---|---|---|---|
| Functional | yes | Mọi FR, BR và flow trong scope (mục 1) | asserted | scripted automated: acceptance qua driver, E2E ở Phase 5 |
| Performance | no | QR-9 là **known risk**. Spec **không có ngưỡng thời gian**. Thời gian chạy của cả một test trong CI gồm khởi động server, fixture, thao tác, đọc trạng thái và cleanup, và tải của runner thay đổi giữa các lần chạy, nên **không đo được** thời gian DeckAgent thực hiện một thao tác. Một phép đo hợp lệ phải nêu operation, metric và điều kiện đo. | — | — |
| Security — confidentiality | yes | QR-2, BR-019 (Why). Build này kiểm phần **từ chối folder** và **"không đọc file"**; việc gửi nội dung cho provider thuộc build 3. | asserted | scripted automated (threat scenario: link, junction, ổ `subst`, tiền tố `\\?\`, đường dẫn tương đối); exploratory (charter ở Gate 2) |
| Security — integrity | yes | QR-3, FR-084.1a, FR-071.10 | asserted | scripted automated (snapshot trước và sau, có positive control) |
| Security — authentication | no | Spec **không có tài khoản** hay đăng nhập; DeckAgent chạy trên máy một người dùng (precondition của UC-013). Việc server local bị gọi từ nơi khác nằm ở hàng authorization. | — | — |
| Security — authorization | yes | QR-8, FR-143. Cơ chế (session token, Origin validation hay khác) do **implementation plan** chọn. **Ngoài phạm vi:** tiến trình khác chạy **cùng quyền hệ điều hành**. | asserted | scripted automated (request từ client không được phép **bị từ chối** và **không đổi trạng thái**; mechanism M18); exploratory (charter ở Gate 2) |
| Security — availability | no | Phần DeckAgent còn chạy được sau khi kết thúc bất ngờ nằm ở hàng Reliability (NFR-008). | — | — |
| Security — non-repudiation | no | Spec không có yêu cầu về dấu vết hay truy cứu trách nhiệm; một người dùng. | — | — |
| Reliability and recovery | yes | QR-5, NFR-008 | asserted | scripted automated (fault injection: kill tại mỗi bước ghi của xoá workspace và tạo chat) |
| Configuration, platform, installation | yes, phần platform | QR-1, QR-4, QR-7. Mục tiêu là **Windows** (AM-4). Spec không có yêu cầu cài đặt; browser khác Chromium chưa được chọn. | asserted | scripted automated (chia lớp theo đặc điểm nền tảng: độ dài đường dẫn, tên 8.3, hoa thường, NFC và NFD) |
| Usability | no | Build này **chưa thiết kế giao diện**. Nội dung thông báo được kiểm như hành vi qua **field có cấu trúc**; câu chữ chờ build có giao diện. | — | — |
| Structural | yes | Phase 5: unit test cho mỗi module và branch coverage theo ngưỡng của implementation plan | asserted | scripted automated |
| Change-related (retest, regression) | yes | Bộ acceptance test bị khoá chạy trên mọi PR; mỗi lần sửa lỗi có retest | asserted | scripted automated |

## 3. Automation feasibility

<!-- Status: verified (đã chạy, có bằng chứng) | assumed (có cơ sở, chưa chạy) | blocked (chưa có cách đáng tin) | not applicable. "Bằng chứng" của hàng assumed ghi cơ sở và nơi bằng chứng sẽ xuất hiện. Một test không được tính là bằng chứng của AC ở Gate 3 khi mechanism nó cần chưa verified. -->

| ID | Mechanism | Cần cho | Status | Bằng chứng hoặc cơ sở | Nếu chưa verified |
|---|---|---|---|---|---|
| M1 | Vitest `4.1.12` với `it.fails` (DEC-013) | Mọi test ci | assumed | DEC-013; repo chưa có Vitest. Bằng chứng xuất hiện khi ticket T0c merge và chạy xanh. | Không test nào của build chạy được; T0c chặn mọi ticket khác. |
| M2 | Driver `tests/acceptance/support/deckagent.ts` nối vào interface thật | Mọi AC acceptance | assumed | Driver ném `NotWiredError` cho đến khi có ticket nối driver ở Phase 4. | AC không chứng minh được fail vì assertion; không đổi được `it.fails` sang `it`. |
| M3 | Audit `fs` bằng module preload: ghi mọi lệnh `fs` và đường dẫn của nó | FR-071.11, FR-074.5, FR-083.3, FR-142.3 (T1, T5, T6) | assumed | Chưa có preload. Audit chỉ thấy các lệnh đi qua hàm `fs` được vá; lệnh từ worker thread, tiến trình con hoặc native module (SQLite) không đi qua. **Positive control** phải chứng minh audit **phát hiện được một thao tác đọc file bị cấm**, không chỉ nhìn thấy `stat` (Z-20). | Nếu audit không quan sát được các đường đọc liên quan, test "không đọc file" **không được dùng làm bằng chứng** đạt AC. `denyRead` trên một file bên trong chỉ bắt được khi DeckAgent báo lỗi đọc ra ngoài. |
| M4 | Fixture `junction` (`mklink /J`) | FR-071.4, BR-019.R0; FR-083.5, FR-083.7 | assumed | Đã chạy trên máy dev Windows 11 NTFS ([windows-folders.md](../../../../research/windows-folders.md) mục 1); chưa chạy trên runner CI. Bằng chứng xuất hiện qua self-test của T0b. | Mất các trường hợp junction của AC thêm cùng folder và AC `.ssh`. |
| M5 | Fixture `substDrive` (ổ `subst`, lock và thử lại) | FR-071.4, BR-019.R0, BR-019.V1; FR-083.5, FR-083.7 | assumed | Đã chạy `subst Q:` trên máy dev (windows-folders.md mục 1); chưa chạy trên CI. R5 trong testing plan. | Mất các trường hợp ổ `subst`. |
| M6 | Fixture `shortName` (tên 8.3) | FR-071.4; FR-083.5, FR-083.7 | assumed | R1: runner GitHub có bật 8.3 (folder tạm `RUNNER~1`), chưa kiểm bằng self-test. | PO chọn: bật lại bằng `fsutil 8dot3name set`, hoặc bỏ trường hợp 8.3. |
| M7 | Fixture `longPath` (đường dẫn 259, 260, 261 và 300 ký tự) | FR-071.1 (đường dẫn dài) | assumed | Chưa chạy. Setup phụ thuộc vào cách Node và Windows xử lý đường dẫn dài. | Mất AC đường dẫn dài. |
| M8 | Fixture `denyRead` (ACL chặn đọc, trả lại trong `finally`) | FR-071.7, FR-074, FR-083.6, FR-142 | assumed | R4. Self-test kiểm `fs.readdir` thật sự fail. Chưa chạy trên CI. | Mất các trường hợp "mất quyền đọc". |
| M9 | Fixture `snapshot` (mọi file, hash, thuộc tính, ADS, kể cả folder rỗng) | FR-084.1a, FR-071.10 | assumed | Đọc ADS cần công cụ ngoài `fs` (PowerShell hoặc tương đương); chưa thử. Positive control: đổi một byte, một thuộc tính hay một ADS thì snapshot đổi. | Bất biến "không đổi file" yếu đi: không thấy việc thêm ADS. |
| M10 | Fixture `move`, `root()`, global setup với registry và lock | Mọi test dùng folder | assumed | Chưa chạy. Self-test nằm trong T0b. | Test chạy không cô lập; rủi ro R4 và R5. |
| M11 | Image `windows-2022` của GitHub và step CI `test:acceptance` | Mọi test ci | assumed | R2, R6. Step CI chưa có trong workflow; PO phải duyệt. | Test đã khoá không chặn merge. |
| M12 | DeckAgent đọc userDir, keyDirs, systemDirs, dataDir từ cấu hình lúc khởi động, và nhận port 0 | Mọi AC dùng folder thay thế | assumed | Yêu cầu cho Phase 3. Chưa có code. | Test phải dùng folder thật của máy; vi phạm C7 và không cô lập được. |
| M13 | Điểm chèn lỗi giữa các bước ghi của xoá workspace và tạo chat | NFR-008.1a, NFR-008.2a (M-1); sau này NFR-008.1c (build 2), NFR-008.1b và NFR-008.3 (build 6, SR-8d) | assumed | Chưa có cách quyết định để kill đúng giữa hai bước ghi nếu sản phẩm không có điểm chèn. **Phase 3 phải xác định** các injection point và cách **kích hoạt failure một cách xác định được** (ví dụ một biến môi trường). Đường ghi setup và đường ghi deck và slide thêm điểm chèn riêng ở build của chúng. | M-1 không chạy được ổn định; yêu cầu reliability có rủi ro cao mà không có test. |
| M14 | Hai interface thật cùng lúc và kênh đẩy sự kiện `workspaceInUse` | FR-038.3, FR-053.3, FR-071.3 | assumed | DEC-012: server đẩy thay đổi tới mọi interface. Chưa có code. | Mất các AC nhiều interface (T3). |
| M15 | `better-sqlite3` build native trên `windows-2022` | Chạy được sản phẩm trên CI | assumed | DEC-011: open-design làm như vậy trên Windows. Chưa chạy ở repo này. | Không chạy được sản phẩm trên CI. |
| M16 | Playwright với Chromium | E2E (Phase 5) | assumed | open-design-earlier-work.md item 12; framework chốt ở Phase 3. | Mất E2E; AC acceptance không bị ảnh hưởng. |
| M17 | Fixture `symlink` | BR-019.R0 (CG-7) | assumed | [windows-folders.md](../../../../research/windows-folders.md) mục 1: tạo symlink cần **quyền administrator** trên máy dev; runner CI có thể chạy với quyền đó. Chưa chạy. | Nếu CI không tạo được symlink, Gate 2 phải nêu **phương án thay thế** hoặc ghi **deviation**, không skip ngầm. AC cho symlink bị chặn khi fixture không chạy. |
| M18 | Driver gửi một thao tác thay đổi workspace hoặc chat từ một client mà DeckAgent không cho phép (ví dụ request mang Origin của trang khác, hoặc không mang thông tin xác thực) vào server local | Security — authorization (QR-8, FR-143) | assumed | DEC-010 chọn server local với trình duyệt, nên một request từ trình duyệt mang **Origin khác** là tình huống thật. Client nào được phép do **implementation plan** quyết, nên chưa chạy được. | Không test nào chứng minh FR-143; yêu cầu bảo mật chỉ còn exploratory. |
| M19 | Fixture `namedFolder(name)`: tạo folder có **tên chính xác theo code point** (tên NFD, ký tự ngoài BMP, khoảng trắng ở đầu, tên chỉ gồm U+00A0, tên dài hơn 100 code point) | Nguồn tên folder của BR-020 (FR-071.2, FR-071.15; design input D5) | assumed | NTFS lưu tên folder **theo code point**, không chuẩn hoá; chưa chạy. Self-test trong T0b: `readdir` của folder cha trả về **đúng chuỗi code point** đã tạo. | Partition theo nguồn tên folder (NFD, ngoài BMP, khoảng trắng) **không chạy được**, hoặc chạy trên tên **khác** tên đã định. |

## 4. Ambiguities và candidate gaps

<!-- Ambiguity là chỗ spec nói chưa rõ. "Đọc là" là cách đọc mà test dùng, hoặc "pending" khi PO chưa quyết. Spec entry: "không cần" | file spec phải đổi, chờ PO cho phép sửa (dev/mvp/spec/ là đường dẫn protected) | "trong spec". Chưa dùng cách đọc làm expected result khi Spec entry chưa là "không cần" hoặc "trong spec". Candidate gap là điều nghi là thiếu test; nó là đầu vào cho Gate 2, không phải finding, và không thêm test case chỉ vì gap được liệt kê. -->

### Ambiguities

| ID | Nơi | Điều chưa rõ | Đọc là | Spec entry |
|---|---|---|---|---|
| AM-1 | FR-141.6, BR-020.R | "Khoảng trắng" ở hai đầu gồm ký tự nào, và luật có áp dụng cho tên lấy từ folder không? | Khoảng trắng là các ký tự mà `String.prototype.trim()` của JavaScript bỏ. Tên **người dùng đặt** khi đổi tên **bị trim**; tên **lấy từ folder** **không bị trim**. Cả hai được **chuẩn hoá NFC**; path của folder không đổi. AC cần rà: FR-141 AC-4, AC-7 (chỉ dùng dấu cách). | Trong spec: BR-020 (Statement, V-1, V-3), FR-141 (statement 4), FR-071 (statement 1) |
| AM-2 | FR-071.2, BR-020.V2b | DeckAgent lưu tên theo dạng người dùng đưa hay chuẩn hoá NFC; tên bị cắt giữ dạng gốc hay dạng NFC? | Tên workspace được **chuẩn hoá NFC** trước khi **đếm**, **giới hạn độ dài** và **lưu**, cho cả tên lấy từ folder và tên người dùng đặt. AC cần sửa: FR-071 AC-12 (Z-18). | Trong spec: BR-020 (Statement, V-2), FR-071 (statement 1), FR-141 (statement 5) |
| AM-3 | FR-083.1 | FR-083 chỉ nói cho workspace không phải default; nó không nói điều gì xảy ra khi người dùng chọn folder cho default workspace. | Default workspace **không có project folder**. Khi người dùng chọn folder cho nó, DeckAgent **từ chối**, **không đổi trạng thái** và **nói lý do** (FR-083.9). AC cần rà: FR-083 AC-5 (chưa kiểm việc từ chối và lý do). | Trong spec: FR-083 (statement 4) |
| AM-4 | Toàn build | Spec không nêu hệ điều hành mục tiêu. | Build 1 chỉ kiểm trên **Windows**; CI dùng `windows-2022`. Build **không tuyên bố** hệ điều hành khác đã được kiểm. | Không cần |
| AM-5 | QR-8 | Ai được gọi server local: tiến trình khác, người dùng khác, trang web? | Chỉ **client được DeckAgent cho phép** mới thực hiện được thao tác **thay đổi trạng thái** workspace và chat; **trang web bên ngoài** không thực hiện được qua server local (FR-143). **Ngoài phạm vi:** tiến trình khác chạy cùng quyền hệ điều hành, và hệ thống đăng nhập. | Trong spec: FR-143 |
| AM-6 | FR-073.1 | Spec không nói điều gì xảy ra với đổi tên, chọn folder, chuyển workspace khi DeckAgent đang chờ xác nhận xoá. | **Không test**; interface quyết cách hỏi. | Không cần |
| AM-7 | NFR-008.1a | NFR-008 chỉ nói về trạng thái của mỗi chat; nó không nói về workspace nửa chừng khi kill giữa thêm, đổi tên hay chọn folder. | Chỉ có **unit test chèn lỗi** của transaction **xoá**; NFR-008 **không mở rộng** sang mọi transaction. | Không cần |
| AM-8 | BR-019 V-1 | V-1 nói "root của mọi drive, ví dụ `C:\` và `D:\`" nhưng lại ghi là closed list. | V-1 là **root của mọi drive**, một **lớp giá trị** (kind range or format). `C:\` và `D:\` **chỉ là ví dụ**; tiêu chí closed list **không áp dụng**, Gate 2 áp dụng EP theo các dạng drive. | Trong spec: BR-019 V-1 |
| AM-9 | FR-071.7, FR-083.6 | Spec không nói điều gì xảy ra khi người dùng đưa **một file** hoặc **một đường dẫn tương đối** thay cho folder. | Cả hai được coi là **folder không đọc được**. | Không cần |

### Candidate gaps

<!-- Nguồn: review trước (BR-019, BR-020) và việc đọc spec. Gate 2 kiểm từng gap bằng technique ghi ở cột cuối. -->

| ID | Item | Điều nghi ngờ | Technique sẽ kiểm |
|---|---|---|---|
| CG-1 | BR-019.V4a | Chỉ `.ssh` thấy trong FR-071 AC-7; bốn key folder còn lại (`.aws`, `.gnupg`, `.kube`, `.docker`) chưa thấy. Danh sách đóng ở mức high đòi mỗi phần tử có test. | EP, tiêu chí "closed lists" |
| CG-2 | BR-019.V4a | Value nói key folder "trong folder của người dùng". Chưa thấy test cho `.ssh` nằm ngoài folder của người dùng (không bị value này từ chối). | EP, biên của "trong folder người dùng" |
| CG-3 | BR-019.V3b | Chưa thấy test cho một folder bình thường bên trong folder người dùng được nhận (value này chỉ từ chối chính nó). | BVA, biên "chỉ chính nó" |
| CG-4 | BR-019.V1 | Chỉ `C:\` thấy trong FR-071 AC-6. Root của drive khác chưa thấy; fixture `substDrive` có thể cung cấp. V1 không phải danh sách đóng (AM-8). | EP theo các dạng drive |
| CG-5 | BR-019.V2a | FR-071 AC-7 dùng một system folder thay thế; từng phần tử trong ba folder (kể cả `Program Files (x86)`) chưa có test riêng. | EP, tiêu chí "closed lists" |
| CG-6 | BR-019.V5c | "Mọi folder chứa data folder" gồm cả `C:\Users` và mọi folder trung gian; FR-071 AC-6 chỉ thấy `C:\`, folder người dùng và `AppData`. | EP, biên của "folder chứa" |
| CG-7 | BR-019.R0 | "Đi theo link" gồm cả symbolic link; fixture hiện có là junction, ổ `subst` và tiền tố `\\?\`. | Threat-based |
| CG-8 | BR-020.V2a | Strategy đòi biên kiểm tại, dưới và trên. Plan có 0, 1, 100, 101; chưa thấy 2 và 99. | BVA ba giá trị |
| CG-9 | BR-020.V2b | FR-141 AC-6 phủ NFC với NFD; chưa thấy ký tự ngoài BMP (code point khác đơn vị UTF-16). | EP, biến phụ "đơn vị đếm" |
| CG-10 | BR-020.R | FR-141 AC-7 phủ trim ở biên dưới (`" x "`); chưa thấy tên 100 ký tự có khoảng trắng hai đầu (lỗi "đếm trước khi trim"). | BVA, biến phụ "trim" |
