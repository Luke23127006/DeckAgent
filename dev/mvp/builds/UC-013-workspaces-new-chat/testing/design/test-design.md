---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Test design — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Test design — workspace theo thư mục và chat mới

## At a glance

- **Dùng để làm gì:** **bản tổng hợp** của Test Design Specification ([test-strategy.md](../../../../../development/test-strategy.md) mục "Test design specification"), record của **Gate 2**. File này giữ **mục lục các technique** (mỗi technique một file evidence trong [techniques/](./techniques/)), **số coverage item**, và **nhật ký gap, deviation và design ruling**. **Lý do chọn technique** và **design input** nằm ở [testing-plan.md](../planning/testing-plan.md) mục 2; **scope ruling** ở [test-analysis.md](../analysis/test-analysis.md); **AC và measure** ở [acceptance-criteria.md](./acceptance-criteria.md).
- **Gate 2:** _Not started_. Chưa technique nào được áp dụng đủ theo phương pháp mới. Phần thiết kế viết **trước STLC** được giữ ở [pre-stlc-design.md](./pre-stlc-design.md), **chỉ dùng ở bước reconciliation**. Các việc còn lại ghi ở [mục 2](#2-gaps-deviations-và-rulings), phần "**Gate 2 pending**".
- **Status:** con số cũ (planned coverage **112 / 112**, checklist C1–C8 **8 / 8**) tính trên **AC và coverage trước STLC** (Z-21), **không phải** kết quả của Gate 2. Các ruling Z-1 đến Z-17 đã có; **Z-18 đến Z-28 pending**.

## 1. Technique đã áp dụng

<!-- Một dòng cho mỗi design input của testing-plan.md mục 2.3. Không nhắc lại basis item, lý do hay criterion. Section mở khi cột "Chờ" của design input trống. -->

| Design input | Technique | File evidence | Coverage item (có test case / cần) | Trạng thái |
|---|---|---|---|---|
| D1 | State transition: vòng đời workspace và folder | — | — | chưa bắt đầu |
| D2 | Decision table: kết quả khi thêm hoặc chọn folder | — | — | chưa bắt đầu |
| D3 | Decision table: báo folder không đọc được hoặc bị thay | — | — | chưa bắt đầu |
| D4 | EP + BVA: đường dẫn folder | — | — | chưa bắt đầu |
| D5 | EP + BVA và decision table: tên workspace | [D5-workspace-name.md](./techniques/D5-workspace-name.md) | EP 36 Covered, 1 Blocked · BVA requirement 37 Covered, 2 Blocked; transformation 3 Blocked; platform 4 (ngoài criterion) · DT 5 / 5 | **đã sửa theo review** (F-01 đến F-05); **chờ PO review lại**, chưa approved |
| D6 | Invariant check | — | — | chưa bắt đầu |
| D7 | Use case testing | — | — | chưa bắt đầu |
| D8 | Threat-based | — | — | chưa bắt đầu |
| D9 | Decision table: thao tác theo client | — | — | chưa bắt đầu |
| D10 | Fault injection | — | — | chưa bắt đầu |

## 2. Gaps, deviations và rulings

**Kind:** **gap** (spec không trả lời), **deviation** (không áp dụng một kỹ thuật hoặc coverage criterion mà risk level đòi), **checklist** (lỗi C1–C8), **infra** (lựa chọn về hạ tầng test). Kết quả của một ruling được ghi **như sự thật hiện tại** vào file sở hữu nội dung đó: [testing-plan.md](../planning/testing-plan.md), [acceptance-criteria.md](./acceptance-criteria.md) hoặc [test-implementation.md](../../implementation/test-implementation.md). Mã W, F, C, Q, K trong các ruling cũ trỏ vào [pre-stlc-design.md](./pre-stlc-design.md).

### Gate 2 pending

Các vấn đề này **đã được nhận diện** khi đóng Gate 1 và đổi artifact. **Chưa có đề xuất**; Test Design của Gate 2 xử lý chúng. **Không sửa AC** và **không thêm test case** trước bước đó.

| ID | Kind | What | PO ruling |
|---|---|---|---|
| Z-18 | checklist | **FR-071 AC-12** đòi tên workspace **giống từng byte** tên folder NFD, **mâu thuẫn** với quy tắc **NFC** của ruling AM-2 (FR-071, BR-020 đã sửa). **Khuyến nghị của PO (review D5, 09-11-2026):** sửa AC theo BR-020 ở Gate 2, **không đổi spec**. | pending |
| Z-19 | deviation | **FR-143** (từ chối thay đổi workspace và chat từ client không được phép) **chưa có AC** và **chưa có dòng** trong [traceability-matrix.md](../traceability-matrix.md). | pending |
| Z-20 | infra | Mục "Test driver and fixtures" (trước ở testing-plan.md, nay ở [test-implementation.md](../../implementation/test-implementation.md)) **vẫn ghi `stat`** là positive control của `fsAudit`, **trái ruling M3** ở [test-analysis.md](../analysis/test-analysis.md). | pending |
| Z-21 | deviation | **Planned coverage** ở At a glance của testing-plan.md **vẫn tính trên AC và coverage cũ**, chưa trên coverage item của file này. | pending |
| Z-22 | deviation | Một AC **chứa nhiều biến thể độc lập** (ví dụ FR-071 AC-2 có 7 dạng đường dẫn). Mỗi biến thể phải là **một test case riêng**, có **kết quả riêng**. | pending |
| Z-23 | deviation | Condition của file này **có mã** nhưng **chưa liên kết** tới **basis item** của test-analysis.md và tới **test case**; bảng ở mục 1 **chưa có số coverage item**. | pending |
| Z-24 | gap | Candidate gap **CG-1 đến CG-10** (BR-019, BR-020) ở test-analysis.md là **đầu vào** của Test Design: kiểm từng cái **bằng technique** đã ghi, **không tự chuyển** thành test case. | pending |
| Z-25 | deviation | **Use case testing**, **threat-based** (security, gồm FR-143) và **fault injection** (NFR-008 M-1) **chưa có section** trong file này. | pending |
| Z-26 | gap | **Tên folder chỉ gồm khoảng trắng** mà Windows cho phép (ví dụ một U+00A0), khi thêm workspace (K18 ở [D5-workspace-name.md](./techniques/D5-workspace-name.md)). Statement của BR-020 và V-3 nói tên lấy từ folder **không bị trim**, nên tên này **có 1 ký tự** và **được nhận**. Nhưng V-1 định nghĩa tên rỗng là tên **không còn ký tự nào sau khi bỏ khoảng trắng ở hai đầu**, mà không nói nguồn, nên cũng đọc được là tên này **rỗng**. FR-071 **không có nhánh từ chối** vì tên. **Đề xuất:** đọc theo statement và V-3 (nhận tên, không trim), và thêm vào V-1 một câu: V-1 **chỉ áp dụng** cho tên người dùng đặt. **Đánh giá lại (D5, sau review):** statement của BR-020 chỉ bỏ khoảng trắng với tên người dùng đặt; V-1 đo "sau khi bỏ khoảng trắng (V-3)"; V-3 không bỏ gì khỏi tên folder; FR-071 không bỏ khoảng trắng nào và không có nhánh từ chối. Ba câu cùng hướng: tên được nhận. **Đề xuất mới:** PO xác nhận cách đọc này, **không sửa spec**. Đến khi đó EC34 và TC42 của D5 **Blocked**. | pending |
| Z-27 | gap | **Tiêu chí phủ tập khoảng trắng** của V-3. Tập này là **mọi ký tự** mà `String.prototype.trim()` bỏ (khoảng 25 code point); V-3 nêu tên **bốn ký tự** làm ví dụ. Plan **chưa nói** tập này theo tiêu chí closed list (mỗi phần tử một test) hay theo đại diện. **Đề xuất:** dùng đại diện là **bốn ký tự V-3 nêu tên**, cộng **một ký tự ngoài tập** (U+200B, K7). Lý do: chọn mọi phần tử chỉ là **kiểm lại `trim()`** của JavaScript, không phải kiểm logic của DeckAgent. **Theo hướng của PO (review D5):** tập là **toàn bộ** ký tự `trim()` bỏ (25 ký tự trên Node 22.19, Unicode 16.0); bốn ký tự V-3 nêu tên là ví dụ; độ sâu theo Planning đã duyệt (một representative cho mỗi class, vì V-3 không được plan đánh dấu closed list). D5 đã áp dụng. **Đề xuất mới:** đóng Z-27 theo hướng này. | pending |
| Z-28 | gap | **Khi cắt tên folder dài hơn 100 code point, phần nào được giữ.** FR-071 nói tên workspace "**bị cắt còn tên dài nhất**", BR-020 V-2 nói **100 code point sau NFC**, và ruling Z-11 nói "**cắt còn 100 code point** sau NFC". Không câu nào nói giữ **phần đầu**. FR-071 AC-15 nháp đòi "**100 ký tự đầu**", nên AC đó **thêm một hành vi** spec chưa có (tìm ra ở D5, EC23). **Đề xuất:** giữ **100 code point đầu** của dạng NFC, và thêm câu đó vào FR-071 hoặc BR-020 V-2. Test case bị ảnh hưởng: TC35, TC51 đến TC62 của D5 (độ dài 100 vẫn được assert). **Theo review của PO:** đây là **quyết định product behavior**, cần PO duyệt thay đổi spec trước khi dùng giá trị chính xác. Test case Blocked: TC35, TC53, TC59, TC60, TC61, TC62. | pending |

### Ruling ngày 09-11-2026

PO **duyệt mọi đề xuất** dưới đây. Z-16 và Z-17 do **bảng kiểm tra đủ ở mục 4** tìm ra.

| ID | Kind | What, đề xuất | PO ruling |
|---|---|---|---|
| Z-7 | gap | **Thêm folder đã bị dời đi** khi `W` đang không đọc được. Theo luật "cùng folder" (`dev:ino`), folder đã dời **là folder của `W`**, nên FR-071 **chuyển sang `W`**; spec **không nói** `W` có nhận **đường dẫn mới** không. **A.** chuyển sang `W`, `W` **giữ đường dẫn cũ**, người dùng sửa bằng chọn folder khác. **B.** chuyển sang `W` và **`W` nhận đường dẫn mới**, vì người dùng **vừa chỉ ra folder**. **Đề xuất B**; cần **một câu trong FR-071** | Theo đề xuất |
| Z-8 | gap | **Thêm folder mới ở chỗ cũ** khi `W` đang báo folder khác. Folder mới **có ID khác**, nên theo luật là **folder khác**: thêm nó tạo **workspace mới cùng đường dẫn** với `W`. **A.** tạo workspace mới, theo luật có sẵn. **B.** từ chối và **chỉ người dùng tới** "dùng folder đó cho `W`". **Đề xuất A**: **không cần luật mới**; ghi một note ở FR-142 | Theo đề xuất |
| Z-9 | gap | **Event khác khi đang chờ xác nhận xoá** (đổi tên, chọn folder, chuyển workspace). Spec **không nói**. **Đề xuất: không test**; interface quyết cách hỏi | Theo đề xuất |
| Z-10 | gap | **Đường dẫn mạng UNC** (`\\server\share`). Spec **không nói** folder mạng có được làm project folder không; test cần **share SMB hoặc quyền admin**, trái checklist C7. **Đề xuất: dời**, thêm vào `open-questions.md`; tiền tố `\\?\` **đã test** | Theo đề xuất |
| Z-11 | gap | **Tên folder dài hơn 100 ký tự** khi thêm workspace: FR-071 đặt tên theo folder, BR-020 V-2 giới hạn 100. **A.** **cắt còn 100 code point** sau NFC. **B.** **nhận nguyên tên**. **C.** **từ chối thêm**. **Đề xuất A**, vì lý do của BR-020 là tên dài **làm vỡ danh sách**; cần sửa **FR-071 hoặc BR-020** | Theo đề xuất |
| Z-12 | deviation | FR-071 "**không gửi gì tới model**" và "**không dừng request**": build này **chưa có model và request**, nên assert **luôn pass**. **Đề xuất: dời sang build 3**, ghi trong matrix | Theo đề xuất |
| Z-13 | deviation | **FR-048 AC-1** ("chỉ chat của workspace đang dùng") **luôn pass** trước build 3. **Đề xuất: dời sang build 3**; plan đã bỏ AC-1, **build 3 viết AC-1** | Theo đề xuất |
| Z-14 | gap | **NFR-008 trong scope** (PO đã duyệt risk high): chỉ phần **chat**, đo bằng **M-1** (kill khi xác nhận xoá và khi tạo chat mới). Vế "**nhận request mới**" **dời sang build 3**. **Workspace nửa chừng** khi thêm, đổi tên hay chọn folder: NFR-008 **không nói**, nên **chỉ có unit test chèn lỗi** của transaction xoá. **Đề xuất: duyệt như trên** | Theo đề xuất |
| Z-15 | deviation | **Lớp đường dẫn chỉ test qua thêm workspace**; đổi folder và dùng folder khác **đi qua các nhánh lá** của cây 6, nên lỗi "**chỉ kiểm ở một entry point**" vẫn bị bắt. **Đề xuất: chấp nhận** | Theo đề xuất |
| Z-16 | deviation | **Folder trên đĩa thay đổi khi `W` đang lỗi.** Spec **đã trả lời**, nhưng hai ô **chưa có AC**. **Ô 1:** `W` đang **không đọc được**, rồi **có folder mới ở chỗ cũ**; theo FR-142, DeckAgent phải chuyển sang báo **folder khác**. **Ô 2:** `W` đang **có folder khác ở chỗ cũ**, rồi **folder mới đó bị dời đi**; theo FR-074, DeckAgent phải chuyển sang báo **không đọc được**. Lỗi mà hai ô này bắt: DeckAgent **giữ `status` cũ** sau khi đã báo một lần. **Đề xuất:** thêm **FR-142 AC-5** (F17) và **FR-074 AC-5** (F18). Hai AC vào **T5**: chúng là **thay đổi trên đĩa**, cùng concern với T5 (T9 là **hành động của người dùng**) | Theo đề xuất |
| Z-17 | deviation | **Chuyển từ `W` đang lỗi sang workspace khác.** FR-071 AC-3 chỉ test việc chuyển từ một workspace **đọc được**. Lỗi bị bỏ sót: DeckAgent **không cho rời** workspace lỗi, hoặc chuyển xong thì `W` **mất `status`**. **Đề xuất:** thêm vào FR-071 AC-3 hai trường hợp, khi `A` **không đọc được** và khi `A` **có folder khác ở chỗ cũ**; Then thêm: `status` của `A` **không đổi** (F19). T1 thêm fixture `move` | Theo đề xuất |
| G-3 | infra | **Đỏ đúng lý do.** Lần chạy ngay sau khi nối driver **không chứng minh được**, vì API chưa có thì test fail vì `DriverContractError`. **Đề xuất A:** **commit đầu** của mỗi implementation PR chạy test của nó và cho thấy chúng **fail vì assertion** (API đã có, behavior chưa), rồi mới đổi `it.fails` thành `it`. Phase 6 **không còn `it.fails`** (đã có ở strategy). Cần **sửa bullet "Not wired yet"** của test-strategy.md | Theo đề xuất |
| C-1 | checklist | Các sửa từ lần review kỹ thuật thứ hai, **đã áp dụng** vào plan: `cwd` cho FR-083 AC-3; FR-083 AC-6 so với **chuỗi đã ghi**; `fsAudit` **chuẩn hoá hai vế** và `AuditNotEnabledError`; `systemDirs` **thay thế** danh sách, test `C:\Windows` thật **riêng**; root trên **ổ `C:`**; global setup **chỉ dọn theo registry**, **dưới lock**; tên event `workspaceInUse` và `currentChat()`; Phase 4 có **ticket nối driver** và **ticket preload**; `Catches` của FR-053 AC-1 và FR-038 AC-1 **bỏ phần không bắt được**. **Đề xuất: PO xác nhận** | Theo đề xuất |
| C-2 | checklist | Lần chạy checklist trên bản này tìm ra 4 lỗi; cả 4 **đã sửa** trong plan. **C1:** FR-084 AC-1 và AC-2 **pass cả khi hành động lỗi**, vì folder vẫn giống hệt; plan thêm Then "**hành động thành công**". **C1:** FR-074 AC-1 chỉ audit **đường dẫn cũ**, mà chỗ đó **đã rỗng**, nên test **luôn pass**; plan audit thêm **chỗ mới `Moved`**. **C2:** dòng `Catches` của FR-141 AC-7 nêu một lỗi mà test **không bắt được**; plan sửa lại dòng đó. **C6:** các test **dùng chung một folder gốc**; plan cho **mỗi test một folder con**. **Rủi ro còn lại (C7):** runner **tắt tên 8.3**; xem testing-plan.md, mục "Testing risks", R1. **Đề xuất: PO xác nhận** | Theo đề xuất |

### Đã có ruling

| ID | Kind | What | PO ruling (08-11-2026) |
|---|---|---|---|
| P-1 | gap | Tên bị từ chối khi đổi tên | Các tên bị từ chối nằm ở **BR-020**. Khi từ chối, FR-141 **giữ tên cũ**. UC-013 có luồng **A13** cho trường hợp này. |
| P-2 | deviation | FR-048 chỉ có phần test được ngay | Phần còn lại của FR-048 **dời sang build 3 và build 5**, ghi trong matrix. |
| P-3, P-4, D-5 | infra | Test driver, fs audit, folder thay thế | Ba thứ này theo mục "Test driver and fixtures" của plan (nay ở [test-implementation.md](../../implementation/test-implementation.md)). **Contract phía test** được quyết **khi PO duyệt plan**. Phase 3 **chỉ quyết cách nối** driver vào DeckAgent. |
| P-5 | infra | CI | Test chạy qua **một step `test:acceptance` mới**. Step đó là **một thay đổi riêng**, PO duyệt. |
| P-6 | gap | Chat chưa có model | Plan **giữ FR-053 AC-5**. Build 2 thêm các AC về "**lần chọn model gần nhất**". |
| D-1 | gap | Chat hiện tại khi nhiều interface | Mỗi interface **giữ chat hiện tại riêng** (DEC-012). |
| D-2 | gap | Gợi ý chọn folder bên trong refused folder | Luật chia theo **vị trí** so với protected folder: **"thuộc"** hoặc **"bao quanh"** (mục 6). |
| D-4 | gap | Đếm ký tự của tên | DeckAgent đếm **code point**, **sau khi chuẩn hoá NFC** (BR-020 V-2). |
| D-7 | deviation | Không có resilience test riêng | Ruling này **được thay bằng Z-14**. |
| E-1 | gap | File và đường dẫn tương đối | Cả hai được coi là **folder không đọc được**. Spec **không cần sửa**. |
| Z-1 | deviation | "Không đọc file" ở mọi đường | FR-074 AC-1, AC-2, FR-083 AC-1 và FR-142 AC-1 có thêm **một dòng `fsAudit`**. |
| Z-2 | deviation | "Dùng folder khác" chưa đi đủ nhánh cây 6 | FR-142 AC-3 thêm hai trường hợp: folder **bị chặn quyền đọc**, và **junction tới `.ssh`**. |
| Z-3 | deviation | Attachment giữ nguyên | Phần này **dời sang build 3**, ghi trong matrix. |
| Z-4 | gap | Folder rơi vào hai nhánh cây 6 | Mỗi test **chỉ dùng folder rơi vào đúng một nhánh**. Spec **không cần sửa**. |
| Z-5 | deviation | FR-072 "otherwise the default workspace" | **Không test**, vì người dùng **không làm cho nó xảy ra được**. |
| Z-6 | deviation | BR-004 V-2 "không giới hạn thời gian" | **Không test**, vì một lần chạy test **không quan sát được** điều này. |
| G-1, G-2 | infra | `it.fails`; tách T0 | Test viết bằng `it.fails` theo WORKFLOW và test-strategy.md. Ticket T0 tách thành **T0a** (driver) và **T0b** (fixture). |
