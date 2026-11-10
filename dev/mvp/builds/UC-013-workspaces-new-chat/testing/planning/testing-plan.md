---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Testing plan — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Testing plan — workspace theo thư mục và chat mới

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Derived from dev/development/test-strategy.md: risk sets the depth, each kind of requirement picks its technique and coverage criterion. The plan applies the strategy; it does not restate its rules.
     Planning decisions only, decided at Gate 1 with test-analysis.md. The AC, measures, eval cases and manual checks live in ../design/acceptance-criteria.md (Gate 2); the driver, fixtures and test-stub tickets in ../../implementation/test-implementation.md.
     Scope rulings live in the matrix's "Items not tested" and readings of ambiguities in test-analysis.md only; gaps, deviations and the design rulings live in test-design.md only. A ruling's result is written here as current fact. -->

## At a glance

- **Tài liệu này là gì:** **test plan** của build: **các quyết định Planning** và **design input** chuyển sang Gate 2 (mục 2.3). **AC và measure** nằm ở [acceptance-criteria.md](../design/acceptance-criteria.md); **driver, fixture và test-stub ticket** nằm ở [test-implementation.md](../../implementation/test-implementation.md).
- **Use cases:** UC-013, UC-012
- **Steps:** all
- **Alternatives:** all, **trừ** các phần **dời sang build sau** ([traceability-matrix.md](../traceability-matrix.md), mục "Items not tested"). **BR-004, BR-019, BR-020** được test **qua các FR trích dẫn chúng**.
- **Test analysis (Gate 1):** [test-analysis.md](../analysis/test-analysis.md): basis item, quality risk, test type và automation feasibility của build
- **Spine:** [traceability-matrix.md](../traceability-matrix.md)
- **Test design (Gate 2):** [test-design.md](../design/test-design.md)
- **AC và measure hiện có** là **bản nháp trước STLC** ([acceptance-criteria.md](../design/acceptance-criteria.md)): chúng **chưa qua Test Design** và **không phải bằng chứng coverage**.
- **Requirement coverage target:** **114 / 114** basis item `to test`; excluded 2, deferred 64 (mục 3.4)
- **Planned coverage, tiers, checklist C1–C8:** _chờ Gate 2_

## 1. Test objectives

Mỗi objective nói **test của build này dùng để làm gì**. Objective **không phải AC**; AC nằm ở phần Test design.

| ID | Objective | Bằng chứng ở Gate 3 |
|---|---|---|
| O1 | **Xác nhận** mỗi basis item `to test` (114 item) qua **acceptance test đã khoá**, viết **từ spec** trước implementation. | Requirement coverage **114 / 114**; pass coverage |
| O2 | **Tìm lỗi** ở các quality risk mức **high** (QR-1, QR-2, QR-3, QR-4, QR-5, QR-7, QR-8, QR-10) bằng **technique mà risk level đòi**. | Test design coverage; mutation score của module high risk |
| O3 | **Chứng minh** các bất biến "**không đọc file**" và "**không đổi file**" của project folder **phát hiện được vi phạm**, nhờ **positive control**. | Self-test của audit và snapshot **xanh trên CI**; mechanism M3, M9 `verified` |
| O4 | **Đo** phần **chat** của NFR-008: chat **giữ trạng thái đã lưu** khi DeckAgent bị kill giữa các bước ghi. | Integration test của measure M-1 **pass ở mọi điểm kill** |
| O5 | **Từ chối** thao tác thay đổi trạng thái từ **client không được phép** (FR-143). | Acceptance test của FR-143 (AC viết ở Gate 2) |
| O6 | **Giữ** hành vi đã chấp nhận cho **các build sau**: bộ test đã khoá **chặn merge** trên mọi PR. | Step CI `test:acceptance` là **check bắt buộc** |
| O7 | **Cho PO đủ bằng chứng** để quyết **build verdict** ở Gate 3. | `test-summary.md`: bảng coverage, defect, residual risk, status của mechanism |

**Acceptance test có hai vai trò** (test-strategy.md "Test levels"). **Theo phạm vi**, chúng chạy **cả DeckAgent server** qua driver, như một system test. **Theo basis và objective**, chúng **xác nhận từng AC** đã duyệt. **Build verdict** ở Gate 3 dựa trên **mọi bằng chứng**, không chỉ trên bộ acceptance test.

**Ngoài objective của build này:**
- **Performance**: QR-9 là **known risk**; build **không đo** hiệu năng (test-analysis.md mục 2).
- **Usability**: build **chưa thiết kế giao diện**; nội dung thông báo được kiểm **qua field có cấu trúc**.
- **Hệ điều hành khác Windows**: build **không tuyên bố** đã kiểm chứng (AM-4).
- **Browser khác Chromium**: chưa được chọn; Phase 3 chốt framework E2E.
- **Folder trên ổ không phải NTFS** (USB exFAT, ổ mạng): ID folder có thể **không ổn định** (QR-4); môi trường test **chỉ có NTFS**, và đường dẫn UNC **đã dời** (SR-12). Phạm vi platform **trong spec giữ nguyên**: build **không tuyên bố** DeckAgent chỉ hỗ trợ NTFS, và **không thêm** cam kết hỗ trợ exFAT hay ổ rời. Gate 3 ghi file system khác NTFS là **coverage limitation**: chưa kiểm chứng, không phải ngoài phạm vi sản phẩm.

## 2. Items, risk và techniques

Mục này **suy ra** technique từ [test-analysis.md](../analysis/test-analysis.md) và [basis-register.md](../analysis/basis-register.md), theo **luật P1 đến P5** của test-strategy.md "Planning decisions"; **không dùng AC hay test case nháp**. Bảng 2.1 là **bằng chứng**, bảng 2.2 là **tóm tắt** theo item, bảng 2.3 là **đầu vào của Test Design**.

### 2.1 Technique selection

<!-- Một dòng cho mỗi cặp item và kind, đọc từ register: chỉ item to test. Rule: P1 sàn (mỗi item một condition và dòng Catches); P2 kind ở high; P3 kind ở normal; P4 type và quality risk; P5 đặc điểm hành vi, trích chữ của item, kind của register giữ nguyên. "qua Dn" nghĩa là coverage item của technique mà một item high đã chọn (P3). -->

| Item | Kind | Item to test | Risk | Rule | Technique | Design input |
|---|---|---|---|---|---|---|
| FR-071 | lifecycle | .1, .3, .5, .6, .14, .N1 | high | P2 | state transition | D1 |
| FR-071 | range or format | .2, .15 | high | P2; P4 (QR-7, platform) | EP + BVA, nguồn tên folder | D5 |
| FR-071 | multi-condition rule | .4, .7, .8 | high | P2; P4 (QR-1) cho .4, .8 | decision table; **dạng đường dẫn** cho .4 và .8 | D2, D4 |
| FR-071 | invariant | .9, .10, .11 | high | P2 | invariant check | D6 |
| FR-072 | lifecycle | .1, .2, .3, .4a, .7a | normal | P3 | P1; state và event **nằm trong** vòng đời workspace | qua D1 |
| FR-072 | flow | .5 | normal | P3 | use case testing | D7 |
| FR-072 | invariant | .6 | normal | P3 | P1; event "xoá default workspace" là **ô bị từ chối** của vòng đời | qua D1 |
| FR-073 | lifecycle | .1, .2, .4a, .5, .N1a, .N2a | high | P2 | state transition | D1 |
| FR-073 | invariant | .3 | high | P2 | invariant check | D6 |
| FR-074 | multi-condition rule | .1, .2, .3 | high | P2; P4 (QR-10) | decision table, oracle là **lý do và việc làm tiếp** | D3 |
| FR-074 | invariant | .4, .5 | high | P2 | invariant check | D6 |
| FR-074 | lifecycle | .6, .7a | high | P2 | state transition | D1 |
| FR-083 | lifecycle | .1 | high | P2 | state transition | D1 |
| FR-083 | invariant | .2, .3, .4 | high | P2 | invariant check | D6 |
| FR-083 | multi-condition rule | .5, .6, .7, .9 | high | P2; P4 (QR-1) cho .5, .7; P4 (QR-10) | decision table; **dạng đường dẫn** cho .5 và .7 | D2, D4 |
| FR-142 | multi-condition rule | .1, .2 | high | P2 | decision table | D3 |
| FR-142 | invariant | .3 | high | P2 | invariant check | D6 |
| FR-142 | lifecycle | .4, .5, .6a, .N3 | high | P2 | state transition | D1 |
| FR-084 | invariant | .1a | high | P2 | invariant check | D6 |
| FR-141 | lifecycle | .1 | normal | P3 | P1; event "đổi tên" nằm trong vòng đời workspace | qua D1 |
| FR-141 | invariant | .2, .3 | normal | P3 | P1; .2 qua vòng đời workspace; .3 qua invariant check của UC-013.G1 | qua D1, D6 |
| FR-141 | multi-condition rule | .5, .7, .8 | normal | P3; P4 (QR-10 cho .8) | P1; luật tên của BR-020 | qua D5 |
| FR-141 | range or format | .6, .9 | normal | P3 | P1; luật tên của BR-020 ở nguồn tên người dùng đặt | qua D5 |
| FR-143 | multi-condition rule | .1, .2 | high | P2; P4 (security — authorization) | decision table; threat-based | D9, D8 |
| FR-053 | invariant | .1a, .1c, .5 | normal | P3 | P1 | D7 |
| FR-053 | lifecycle | .3, .4 | normal | P3 | P1; qua flow UC-012.S1a | D7 |
| FR-053 | multi-condition rule | .7a | normal | P3 | P1; qua flow UC-012.A1a | D7 |
| FR-048 | multi-condition rule | .7 | normal | P3 | P1 | D7 |
| FR-038 | lifecycle | .1a, .2, .3, .5 | normal | P3 | P1 | D7 |
| FR-038 | invariant | .4a | normal | P3 | P1 | D7 |
| NFR-008 | reliability | .1a, .2a | high | P2 (NFR kind) | fault injection | D10 |
| BR-004 | lifecycle | V3 | high | P2 | state transition (event xoá workspace) | D1 |
| BR-019 | multi-condition rule | R0, R1, V2a, V2b, V2c, V3a, V3b, V4a, V4b, V5a, V5b, V5c | high | P2; closed list cho V2a, V4a; P4 (security — confidentiality) cho R0; **P5** ("chính folder", "bên trong", "chứa") cho quan hệ chứa | decision table; mỗi phần tử của closed list; threat-based cho R0; **EP + BVA của quan hệ chứa** cho V2b, V2c, V3a, V3b, V4a, V4b, V5a, V5b, V5c | D2, D8, D4 |
| BR-019 | range or format | V1 | high | P2 | EP theo dạng drive (AM-8) | D4 |
| BR-020 | range or format | R, V1, V2a, V2b, V2c, V3 | high | P2; P4 (QR-7); **P5** ("với tên người dùng đặt", "không bỏ gì khỏi tên lấy từ folder") cho R, V2c, V3 | EP + BVA ở hai nguồn tên; **decision table** theo nguồn tên | D5 |
| UC-013 | flow | S1, S2a, S3a, A1, A2a, A3, A6a, A7a, A8, A9, A10, A11a, A12, A13 | high | P2 | use case testing, có tổ hợp alternative | D7 |
| UC-013 | invariant | G1, G2a | high | P2 | invariant check | D6 |
| UC-012 | flow | S1a, S2c, A1a | normal | P3 | use case testing | D7 |

**Kiểm:** 38 dòng, **114 item**; register có **114 item `to test`**, mỗi item **một kind**, nên mỗi item nằm ở **đúng một dòng**. Cách đếm lại: lọc register theo `to test`, gom theo FR và kind.

### 2.2 Items

<!-- Một dòng cho mỗi FR và NFR trong scope; PO đặt Risk (test-strategy.md "Risk and depth"; chưa đặt thì là high). Dòng BR và UC lấy risk từ register (../analysis/basis-register.md): BR lấy mức cao nhất của các FR trích nó; flow của UC lấy mức cao nhất của các FR nó dùng. Kinds lấy từ cột Kind của register. Techniques: risk high dùng mọi technique khớp với kind; risk normal dùng use case testing và dòng Catches, technique khác chỉ cho gap PO chỉ định. Coverage criterion là của strategy ("Technique per requirement"). Level: nơi AC hoặc measure của item được kiểm (mục 3.1). Record Gate 2: AC hoặc measure của item (acceptance-criteria.md), và design input (mục 2.3) sẽ giữ condition của item. Mọi FR, NFR, BR và UC của test basis có một dòng. Số coverage item và planned coverage là việc của Gate 2. -->

| Item | Risk | Basis item to test (deferred, excluded) | Kinds trong register | Techniques | Coverage criterion | Level | Record Gate 2 |
|---|---|---|---|---|---|---|---|
| FR-071 | high | 14 (2, 0) | lifecycle, range or format, multi-condition rule, invariant | **state transition**, **EP + BVA**, **decision table**, **invariant check** | mọi event ở mọi state; mọi partition và mỗi biên ở ba giá trị; mọi leaf; assert sau mọi hành động, có positive control | acceptance | AC của FR-071; D1, D2, D4, D5, D6 |
| FR-072 | normal | 7 (2, 1) | lifecycle, flow, invariant | **use case testing** | mọi step và alternative có end state khác | acceptance | AC của FR-072; D1, D7 |
| FR-073 | high | 7 (7, 0) | lifecycle, invariant | **state transition**, **invariant check** | như FR-071 | acceptance | AC của FR-073; D1, D6 |
| FR-074 | high | 7 (2, 0) | multi-condition rule, invariant, lifecycle | **decision table**, **invariant check**, **state transition** | như FR-071 | acceptance | AC của FR-074; D1, D3, D6 |
| FR-083 | high | 8 (3, 0) | lifecycle, invariant, multi-condition rule | **state transition**, **invariant check**, **decision table** | như FR-071 | acceptance | AC của FR-083; D1, D2, D4, D6 |
| FR-142 | high | 7 (2, 0) | multi-condition rule, invariant, lifecycle | **decision table**, **invariant check**, **state transition** | như FR-071 | acceptance | AC của FR-142; D1, D3, D6 |
| FR-084 | high | 1 (4, 0) | invariant | **invariant check** | assert sau mọi hành động của vùng, có positive control | acceptance | AC của FR-084; D6 |
| FR-141 | normal | 8 (1, 0) | lifecycle, invariant, multi-condition rule, range or format | **use case testing**; gap **tên 1 ký tự** dùng **BVA**; luật tên theo BR-020 | mọi step và alternative có end state khác | acceptance | AC của FR-141; D1, D5, D7 |
| FR-143 | high | 2 (0, 0) | multi-condition rule | **decision table**, **threat-based** | mọi leaf; mỗi threat scenario được giữ có test | acceptance | AC của FR-143 (chưa có, Z-19); D8, D9 |
| FR-053 | normal | 6 (8, 0) | invariant, lifecycle, multi-condition rule | **use case testing** | mọi step và alternative có end state khác | acceptance | AC của FR-053; D7 |
| FR-048 | normal | 1 (6, 0) | multi-condition rule | **use case testing** | như FR-053 | acceptance | AC của FR-048; D7 |
| FR-038 | normal | 5 (2, 0) | lifecycle, invariant | **use case testing** | như FR-053 | acceptance | AC của FR-038; D7 |
| NFR-008 | high | 2 (4, 0) | reliability | **fault injection** | mọi điểm chèn lỗi × failure mode **do yêu cầu quy định**: kill tại mỗi bước ghi của xoá workspace và tạo chat | integration; unit | Measure M-1; D10 |
| BR-004 | high (từ FR-073) | 1 (1, 1) | lifecycle | **state transition** (qua FR-073) | như FR-073 | acceptance, qua FR-073 | AC của FR-073; D1 |
| BR-019 | high (từ FR-071, FR-083) | 13 (0, 0) | multi-condition rule, range or format | **decision table**, **EP + BVA** (V-1 chia lớp theo dạng drive, AM-8), **threat-based** (R0: đi theo link) | mọi leaf; mọi partition; **closed list**: mỗi phần tử có test (V-2a, V-4a); mỗi threat scenario được giữ có test | acceptance, qua FR-071, FR-083, FR-142 | AC của các FR đó; D2, D4, D8 |
| BR-020 | high (từ FR-071) | 6 (0, 0) | range or format | **EP + BVA**, **decision table**, qua **hai nguồn tên** | mọi partition và mỗi biên ở ba giá trị, kể cả biến phụ (đơn vị đếm, NFC, trim), **ở mỗi nguồn tên**; mọi leaf | acceptance, qua FR-071 và FR-141 | AC của FR-071 và FR-141; D5 |
| UC-013 | high | 16 (14, 0) | flow, invariant | **use case testing**, có **tổ hợp alternative có tương tác**; **invariant check** cho G1, G2a | mọi step và alternative có end state khác; mỗi tổ hợp đạt **hai điều kiện** ở "Ba điều về độ sâu" điểm 3; assert sau mọi hành động của UC-013, có positive control | acceptance; E2E (mục 8) | AC của các FR của nó; mục 8; D6, D7 |
| UC-012 | normal | 3 (6, 0) | flow | **use case testing** | như FR-053 | acceptance; E2E (mục 8) | AC của FR-053, FR-048, FR-038; mục 8; D7 |
| **Tổng** | | **114 (64, 2)** | | | | | |

**Mọi item** còn dùng **error guessing**: mỗi AC có dòng **`Catches`**, và plan áp dụng **shared error list** của strategy.

**Ba điều về độ sâu:**
- **FR-072, FR-141 và FR-053 ở mức normal**, nhưng **state và event** của chúng **nằm trong** state × event matrix của **vòng đời workspace và folder** (FR-071, FR-073, FR-074, FR-083, FR-142, mức high). Ô của matrix là coverage item **của technique ở mức high**, không phải độ sâu riêng của FR normal.
- **BR-020 ở mức high** áp dụng cho **cả hai nguồn tên**. **Tên lấy từ folder** (FR-071.2, FR-071.15) đi qua **thêm workspace**: biến là **NFC**, **đơn vị đếm**, **cắt còn 100 ký tự**, và **không trim** (BR-020.V3). **Tên người dùng đặt** (FR-141) đi qua **đổi tên**: biến là **trim**, **NFC**, **đơn vị đếm**, **từ chối** khi rỗng hoặc quá dài (V-1, V-2). Mỗi nguồn có **partition và biên riêng**; một biên đã test ở nguồn này **không thay** biên của nguồn kia. Độ sâu riêng của FR-141 **vẫn là normal**.
- **Tổ hợp alternative của UC-013** chỉ được test khi **cả hai điều kiện** đúng. Điều kiện 1: hai alternative **tác động lên cùng một workspace hoặc folder**, và state do alternative này để lại **làm đổi kết quả** của alternative kia. Điều kiện 2: **spec nêu kết quả** của tổ hợp, nên tổ hợp **cite được basis item**. Tổ hợp có tương tác mà **spec không nêu kết quả** là **gap cho PO**, không phải test case. Ví dụ tổ hợp đạt cả hai: folder không đọc được (A3) rồi xoá (A2), chọn folder khác (A6) hoặc đổi tên (A11); các ô này đã có ở state × event matrix.

**Chat và draft ở mức normal:** FR-053 và FR-038 dùng **P1 và use case testing** (D7), **không dùng state transition**.

### 2.3 Design inputs

<!-- Đầu vào của Gate 2 (test-strategy.md "Planning decisions"): một dòng cho mỗi section technique của test-design.md. test-design.md trích mã Dn, không nhắc lại lý do chọn. Design chỉ bắt đầu một section khi cột "Chờ" trống. -->

| Mã | Section technique | Basis item (từ 2.1) | Criterion và tham số độ sâu | Level (luật) | Mechanism | Candidate gap | Chờ |
|---|---|---|---|---|---|---|---|
| D1 | **State transition**: vòng đời workspace và folder | FR-071, FR-073, FR-074, FR-083, FR-142 (lifecycle); BR-004.V3; qua D1: FR-072, FR-141 | Mọi event ở mọi state, kể cả event bị từ chối; event của item normal là ô của matrix này (2.2, "Ba điều về độ sâu" điểm 1); state của folder kiểm **trên NTFS**, file system khác là **coverage limitation** | acceptance (L1) | M1, M2, M8, M10, M12, M14 | — | — |
| D2 | **Decision table**: kết quả khi thêm hoặc chọn folder | FR-071.4, .7, .8; FR-083.5, .6, .7, .9; BR-019 (multi-condition rule) | Mọi leaf; **closed list ở high**: mỗi phần tử của V2a (3) và V4a (5) có test; mỗi leaf từ chối assert **lý do** (QR-10) | acceptance (L1), qua FR-071 và FR-083 | M1, M2, M10, M12 | CG-1, CG-5 | — |
| D3 | **Decision table**: báo folder không đọc được hoặc bị thay | FR-074.1, .2, .3; FR-142.1, .2 | Mọi leaf; oracle là **tên workspace, việc làm tiếp** và **không nêu nguyên nhân** (QR-10, FR-074.4) | acceptance (L1) | M8, M10 | — | — |
| D4 | **EP + BVA**: đường dẫn folder | BR-019.V1; dạng đường dẫn cho FR-071.4, .8, FR-083.5, .7, BR-019.R0; quan hệ chứa của BR-019 V2b đến V5c; đường dẫn dài (FR-071.1) | Mọi partition, mỗi biên ở ba giá trị; dạng drive theo AM-8; dạng đường dẫn **ở cả hai điểm vào** (thêm, chọn folder khác), **mỗi dạng một lần ở mỗi điểm vào**, không nhân với mọi value của BR-019; quan hệ chứa gồm **chính folder**, **con trực tiếp**, **sâu hơn**, **folder chứa**, và **folder anh em có tên bắt đầu giống** (ví dụ `C:\Windows2`) | acceptance (L1) | M4, M5, M6, M7, M10, M17 | CG-2, CG-3, CG-4, CG-6 | — |
| D5 | **EP + BVA** và **decision table**: tên workspace (pilot ở [D5-workspace-name.md](../design/techniques/D5-workspace-name.md)) | BR-020; FR-071.2, .15; qua D5: FR-141.5 đến .9 | Mọi partition và biên ở ba giá trị, **ở mỗi nguồn tên**; biến phụ đơn vị đếm, NFC, trim (QR-7); leaf từ chối assert **lý do** (QR-10) | acceptance (L1), qua FR-071 và FR-141 | M1, M2, M10, **M19** | CG-8, CG-9, CG-10 | — |
| D6 | **Invariant check**: "không đọc, không đổi file", "không xoá chat" | FR-071.9 đến .11; FR-073.3; FR-074.4, .5; FR-083.2 đến .4; FR-142.3; FR-084.1a; UC-013.G1, G2a; qua D6: FR-141.3 | Assert **sau mọi hành động** của vùng, có **positive control**; vùng của G1 là **mọi hành động của UC-013** | acceptance (L1) | M3, M9 | — | — |
| D7 | **Use case testing**: flow của UC-013 và UC-012 | UC-013 (flow), UC-012 (flow), FR-072.5; P1 của FR-053, FR-048, FR-038 | Mọi step và alternative có end state khác; tổ hợp alternative theo "Ba điều về độ sâu" điểm 3 | acceptance (L1); E2E (L2, mục 8) | M14, M16 | — | — |
| D8 | **Threat-based**: link và client không được phép | BR-019.R0 (confidentiality); FR-143.1, .2 (authorization) | Mỗi threat scenario được giữ có test; scenario bị loại ghi lý do | acceptance (L1) | M4, M5, M17, M18 | CG-7 | — |
| D9 | **Decision table**: thao tác thay đổi trạng thái theo client | FR-143.1, .2 | Mọi leaf | acceptance (L1) | M18 | — | — |
| D10 | **Fault injection**: kill giữa các bước ghi | NFR-008.1a, .2a | Mỗi điểm kill của xác nhận xoá workspace và tạo chat mới × kill tiến trình (do yêu cầu quy định) | integration (L3); unit (L4) | M13 | — | — |

**Kiểm:** mỗi dòng của 2.1 trỏ tới ít nhất một Dn; mỗi Dn có basis item, criterion, level kèm luật, và mechanism có dòng ở test-analysis.md mục 3. Cột "Chờ" **trống ở mọi dòng**: mọi design input đủ điều kiện entry (mục 6).

## 3. Test approach

### 3.1 Levels

<!-- Level là object được test (test-strategy.md "Test levels"). Tier nói cái gì chặn merge hoặc chặn build (WORKFLOW "Test tiers"). -->

| Level | Object và phạm vi của build này | Khi viết | Ai viết | Tier |
|---|---|---|---|---|
| **Acceptance** | **Cả DeckAgent server** qua driver, cho mọi basis item `to test` **trừ** NFR-008 | Phase 2, **trước** implementation | Developer **không implement** FR đó | ci |
| **Unit** | **Mỗi module** của code mới qua public interface; gồm **unit test chèn lỗi** của transaction xoá workspace | Phase 5, trong implementation ticket | Implementer | ci |
| **Integration** | NFR-008 **M-1** (fault injection, kill thật rồi khởi động lại); thêm các **seam do Phase 3 quyết** (test-strategy.md "Going back") | Phase 5, `phase:post-impl` | Developer **không implement** các module đó | ci |
| **E2E** | Flow của UC-013 và UC-012 từ **interface thật trên browser** tới trạng thái đã lưu (mục 8) | Phase 5, sau mọi implementation | Developer **không implement** flow đó | ci |
| **Mutation** (đo **độ mạnh** của test, không phải level riêng) | Các **module high risk**; **chỉ ở build đầu tiên** | Phase 6 | Agent chạy, PO ruling mutant | — |

### 3.2 Types theo level và approach

<!-- Type và approach đã chọn ở test-analysis.md mục 2 (Gate 1). Bảng này chỉ nói mỗi type được kiểm ở level nào và bằng technique nào. -->

| Type đã chọn | Basis item (luật P4) | Level | Approach | Technique (design input) |
|---|---|---|---|---|
| Functional | mọi item `to test` | acceptance, E2E, unit | scripted automated | theo 2.1 |
| Security — confidentiality | BR-019 (mọi value), FR-071.8, FR-083.7; "không đọc file": FR-071.11, FR-074.5, FR-083.3, FR-142.3 | acceptance; exploratory ở Phase 6 | scripted automated, exploratory | **decision table** (D2); **threat-based**: link, junction, ổ `subst`, tiền tố `\\?\`, đường dẫn tương đối, symlink (D8; CG-7, M17); **invariant check** (D6) |
| Security — integrity | FR-084.1a, FR-071.10, FR-073.3, UC-013.G1 | acceptance | scripted automated | **invariant check**: snapshot trước và sau, có positive control (D6) |
| Security — authorization | FR-143.1, .2 | acceptance; exploratory ở Phase 6 | scripted automated, exploratory | **threat-based** (D8) và **decision table** (D9); cơ chế do Phase 3 quyết (M18) |
| Reliability and recovery | NFR-008.1a, .2a | integration, unit | scripted automated | **fault injection** (D10) |
| Platform (Windows) | Nguồn của type là QR-1, QR-4, QR-7: FR-071.1, .4, .8, FR-083.5, .7, BR-019.R0, V1 (dạng đường dẫn, độ dài, drive); FR-074, FR-142 (ID folder trên NTFS); BR-020, FR-071.2, .15 (NFC và NFD) | acceptance trên `windows-2022` | scripted automated | **EP + BVA** theo đặc điểm nền tảng: độ dài đường dẫn, tên 8.3, hoa thường, NFC và NFD (D4, D5); state của folder (D1) |
| Structural | Code mới, không có basis item | unit | scripted automated | **branch coverage**; **mutation** ở Phase 6 |
| Change-related | Bộ test đã khoá, không có basis item riêng | mọi level đã khoá, trên mọi PR | scripted automated | **retest** sau mỗi lần sửa; **regression** test cho mỗi bug fix |

**Exploratory:** **charter** viết ở Gate 2, **session** chạy ở Phase 6. Exploratory **không tạo test khoá**; phát hiện của nó vào **defect issue** hoặc **ruling**.

### 3.3 Quality risks theo approach

| Quality risk | Risk level | Basis item (nguồn của risk, và item thêm theo P4) | Được xử lý bằng (design input) |
|---|---|---|---|
| QR-1 · nhiều dạng đường dẫn tới một folder | high | FR-071.4, BR-019.R0; thêm FR-071.8, FR-083.5, .7 | **EP** các dạng đường dẫn (D4) và **threat-based** (D8); fixture M4, M5, M6 |
| QR-2 · folder quá rộng hoặc chứa key | high | BR-019 (mọi value), FR-071.8 | **decision table** và **closed list** của BR-019 (D2); exploratory confidentiality |
| QR-3 · ghi vào hoặc đọc project folder | high | FR-084.1a, FR-071.10, FR-071.11, BR-019.V5a, .V5b, .V5c | **invariant check** (D6; M3, M9) sau mọi hành động của vùng; data folder bên trong (D2) |
| QR-4 · định danh folder đổi theo thời gian | high | FR-074, FR-142 | **state transition** của vòng đời folder (D1) trên NTFS; file system khác là **coverage limitation** |
| QR-5 · kill giữa xoá workspace hoặc tạo chat | high | NFR-008.1a, .2a; FR-073 | **fault injection** ở integration (M-1) và unit (D10) |
| QR-6 · nhiều interface lệch nhau | normal | FR-038.3, FR-053.3, FR-071.3 | **use case testing** với hai interface (D7; M14); FR-071.3 còn ở D1 |
| QR-7 · tên Unicode | high | BR-020, FR-071.2, .15; FR-141.6, .9 (normal, nhận biến này theo P4) | **EP + BVA** với biến phụ đơn vị đếm, NFC, trim (D5) |
| QR-8 · client không được phép | high | FR-143.1, .2 | **threat-based** (D8) và **decision table** (D9) (M18); exploratory authorization |
| QR-9 · ổ chậm làm chậm danh sách | normal | — | **Không test** (known risk); xem lại khi Phase 3 quyết thời điểm kiểm folder (RQ-6) |
| QR-10 · lý do từ chối sai hoặc trống | high | FR-074.4, FR-071.8, FR-083.5 đến .7; FR-141.8 (normal, nhận oracle này theo P4) | **oracle** của mỗi leaf từ chối (D2, D3, D5): assert `error.code` và **value của BR**; assert **không có field `cause`** |

### 3.4 Coverage targets

<!-- Năm measure của test-strategy.md "Coverage". Mẫu số lấy từ scope đã duyệt; không dùng số AC hay test case cũ. -->

| Measure | Mẫu số của build này | Target | Đo ở |
|---|---|---|---|
| **Requirement coverage** | **114** basis item `to test` (scope đã duyệt) | **114 / 114**; báo riêng **excluded 2, deferred 64** | Gate 2 (link), Gate 3 |
| **Test design coverage** (planned coverage) | Coverage item mà technique và risk level đòi; **số này chốt ở Gate 2** | **100 %**; mục thiếu là **deviation** có ruling của PO | Gate 2 |
| **Execution coverage** | Test case, **mỗi biến thể độc lập là một case** | **100 %** chạy | Phase 6 |
| **Pass coverage** | Test case | **100 %** pass; dòng còn fail **không được tick Verified** (sửa bằng light build, hoặc dời behavior vào spec backlog) | Gate 3 |
| **Structural coverage** | Branch của code mới | **Ngưỡng PO đặt** ở implementation plan (Phase 3); _chưa đặt_ | Phase 5 |

**Thêm ở Phase 6:** mutation testing trên **module high risk**; mỗi **mutant sống sót** bị **giết bằng test mới** hoặc được PO **ruling là equivalent**.

**Execution coverage và pass coverage** chỉ có nghĩa **khi hai measure thiết kế** (requirement, test design) **đã chốt và đạt**.

## 4. Environment

| Thành phần | Giá trị | Ghi chú |
|---|---|---|
| Hệ điều hành CI | GitHub runner `windows-2022` | Image **không ghim tuyệt đối** (R2) |
| File system | **NTFS** trên ổ `C:`, **tên 8.3 bật** | R1; file system khác NTFS là **coverage limitation**, không phải ngoài phạm vi sản phẩm (mục 1) |
| Runtime | Node `22.19.0`; pnpm theo `package.json` | Đã ghim trong `.github/workflows/workspace.yml` |
| Runner | Vitest `4.1.12` (DEC-013), lệnh `pnpm test:acceptance` | M1 |
| Storage | `better-sqlite3` (DEC-011), build native trên runner | M15 |
| Folder test | Mọi folder tạm dưới `C:\deckagent-test\<runId>`, **mỗi test một folder con** | M10 |
| Folder của máy | **Folder thay thế** cho folder người dùng, key folder, data folder, system folder; **một test** với system folder **thật** | M12; checklist C7 |
| Quyền | **Không cần admin**, trừ fixture **symlink** nếu Gate 2 giữ nó | M17, R9 |
| E2E | **Playwright với Chromium**, mỗi worker **data folder và port riêng** | M16; Phase 3 chốt framework |
| Máy dev | Windows 11, NTFS. Fixture **chỉ skip** khi có `DECKAGENT_ALLOW_FIXTURE_SKIP=1` | Checklist C3 |

**Test data:** fixture **tạo mọi folder và file** cần cho test. Test **không dùng file thật** của người dùng. **Không có model và provider** trong build này, nên **không có fixture ghi lại response của model**.

**Environment validation:** **self-test của fixture** (có positive control) chạy **trong mỗi lần chạy suite**; kết quả của nó là **CI result** của ticket T0b, **không có record riêng** (test-strategy.md "Checks that are not gates").

## 5. Dependencies

<!-- Status của mỗi mechanism nằm ở test-analysis.md mục 3; bảng này không nhắc lại status. Cột "Chặn" nói việc gì không làm được khi dependency chưa xong. -->

| Dependency | Được giải quyết ở | Chặn |
|---|---|---|
| **PO duyệt Gate 2** | Phase 2 | AC cuối mà test PR được duyệt theo; ticket **#59 đến #69** |
| Runner Vitest (M1) | Ticket T0c ([#58](https://github.com/Luke23127006/DeckAgent/issues/58)) | **Mọi ticket test** khác |
| Driver theo contract (M2, phần phía test) | Ticket T0a ([#59](https://github.com/Luke23127006/DeckAgent/issues/59)) | T1 đến T9 |
| Fixture Windows và self-test (M4 đến M10) | Ticket T0b ([#60](https://github.com/Luke23127006/DeckAgent/issues/60)) | T1 đến T9 |
| **Cấu hình folder lúc khởi động** và **port 0** (M12) | Implementation plan (Phase 3) | Nối driver; chạy song song |
| **Điểm chèn lỗi** xác định được (M13) | Implementation plan (Phase 3) | Integration test của M-1 |
| **Cơ chế cho phép client** (M18) | Implementation plan (Phase 3) | Đổi `it.fails` sang `it` cho AC của FR-143; **xem lại level** của FR-143 |
| **Ngưỡng branch coverage** | Implementation plan (Phase 3) | Exit của Phase 5 |
| **Framework E2E** (M16) | Implementation plan (Phase 3) | E2E ở mục 8 |
| **Ticket nối driver** (M2, nối interface thật) | Phase 4 | **Mọi** lần đổi `it.fails` sang `it` |
| **Ticket preload của fs audit** (M3) | Phase 4 | Đổi `it.fails` sang `it` cho AC dùng `fsAudit` |
| **Step CI `test:acceptance`** (M11) | Thay đổi riêng, PO duyệt | Bộ test khoá **chặn merge** (O6); phải có **trước PR implementation đầu tiên** của Phase 5 |
| Kênh đẩy sự kiện tới nhiều interface (M14) | Implementation (DEC-012) | AC nhiều interface |

## 6. Entry và exit criteria

<!-- Exit của Phase 2, 5 và 6 là cột Exit của test-strategy.md "Phases"; bảng này áp dụng chúng cho build. Gate 2 và Gate 3 là gate của PO; entry và exit khác là check, không phải gate. -->

| Activity | Entry | Exit |
|---|---|---|
| **Test design** (Gate 2) | Gate 1 **đã duyệt**. **Theo từng design input**: một file evidence chỉ bắt đầu khi dòng của nó ở mục 2.3 **không còn delta chờ**. | Mỗi design input có **file evidence** với **output trung gian** của từng bước theo methodology của technique, **completion check** (mọi coverage item có test case hoặc ruling) và **reconciliation** với AC nháp. **Mọi coverage criterion** của mục 2 **đạt**, hoặc được **ruling là deviation**. **Link rules** của strategy đúng. Mọi mục ở test-design.md mục 2 **có outcome**. CG-1 đến CG-10 **được kiểm bằng technique**. Checklist **C1–C8 đạt** trên AC cuối. **PO duyệt Gate 2**. |
| **Test implementation** (test-stub ticket) | Gate 2 **đã duyệt**; body của #59 đến #69 **đã cập nhật** theo Test Design đã duyệt. T0c (#58) **đã merge** trước ticket khác; #58 được đi trước Gate 2 **nếu độc lập** với AC và driver contract. | Mọi test ci là **`it.fails`**, **mỗi biến thể độc lập một `it.fails`**, tên test **bắt đầu bằng ID của test case** (acceptance-criteria.md, mục "AC, measure và test case"). **Self-test của fixture xanh trên CI**. Checklist C1–C8 đạt trên mỗi PR. PO **duyệt và khoá** từng test. Mọi DEC trong scope **được ít nhất một test dùng**. |
| **Execution** (Phase 5) | Implementation plan **đã duyệt**. Step CI `test:acceptance` **đã có**. Ticket nối driver **đã merge** trước lần đổi `it` đầu tiên. | **Commit đầu** của mỗi PR implementation cho thấy test của nó **fail vì assertion**. `it.fails` của PR **đã đổi sang `it`** và **xanh**. **Branch coverage** đạt ngưỡng; branch chưa phủ **được test hoặc giải thích**. Mọi ticket `phase:impl` và `phase:post-impl` **đã đóng**. |
| **Closure** (Gate 3) | Mọi ticket của Phase 5 **đã đóng**. | **Không còn `it.fails`**. **Mọi mechanism** của một test được tính **là `verified`**. Mutant sống sót **bị giết** hoặc **ruling equivalent**. Exploratory session **đã chạy** và có kết quả. `test-summary.md` **có đủ** bảng coverage, defect, residual risk. **Mọi dòng matrix** được Verified, hoặc behavior **dời vào spec backlog**. |

**Tạm dừng và tiếp tục:**
- Khi **self-test của một fixture fail trên CI**, test dùng fixture đó **không được tính là bằng chứng**; việc tính **tiếp tục** khi self-test **xanh lại**.
- Khi một mechanism chuyển sang **`blocked`**, việc lập kế hoạch **quay lại mục 3**: level hoặc tier của test cần nó **đổi** (test-strategy.md "Going back").

## 7. Testing risks

Đây là rủi ro của **chính việc test**, không phải rủi ro của sản phẩm (cột Risk ở mục 2): điều có thể làm một test **không chạy được**, hoặc **pass mà không chứng minh gì**. Với rủi ro đến từ một mechanism, **status của mechanism** nằm ở [test-analysis.md](../analysis/test-analysis.md) mục 3; bảng dưới **không nhắc lại status**.

| ID | Rủi ro | Hậu quả nếu xảy ra | Cách giảm | Ai lo |
|---|---|---|---|---|
| R1 | Ổ `C:` của runner **tắt tên 8.3**. | Self-test của `shortName` fail, nên **CI đỏ**; trường hợp tên 8.3 **không chạy được**. | Self-test **fail rõ ràng**, không skip ngầm. GitHub runner hiện **có bật** 8.3 (folder tạm `RUNNER~1`). Nếu runner tắt 8.3, PO quyết: bật lại bằng `fsutil 8dot3name set`, hoặc bỏ trường hợp 8.3. | Người viết T0b (#60) |
| R2 | Image `windows-2022` của GitHub **đổi phiên bản** (image này không ghim tuyệt đối). | Hành vi của ACL, `subst` hoặc junction đổi, nên fixture **hỏng** hoặc test **pass sai**. | **Self-test của fixture** chạy trong mỗi lần chạy suite và chỉ ra fixture nào hỏng. | PO, khi duyệt step CI |
| R3 | **Ticket preload** của fs audit **chưa merge**. | Các AC dùng `fsAudit` **không chứng minh được** chúng fail vì assertion, nên **chưa đổi được** sang `it`. | `fsAudit` throw `AuditNotEnabledError`. Phase 4 có **ticket preload riêng**, và ticket đó chặn việc đổi `it.fails` thành `it` của các AC này. | Implementation plan (Phase 3) |
| R4 | `denyRead` **không đặt được ACL**, hoặc **không trả lại quyền** sau test. | Test "mất quyền đọc" **pass mà không có folder bị chặn**, hoặc để lại một folder **bị khoá** cho lần chạy sau. | Self-test kiểm `fs.readdir` **thật sự fail**. Quyền được trả lại trong `finally`. Global setup **`icacls /reset`** các folder mà registry của suite ghi lại. | Người viết T0b (#60) |
| R5 | Hai lần chạy song song **lấy cùng một ký tự ổ** `subst`. | Một test trỏ vào **folder của test khác**, nên kết quả **sai** hoặc **flaky**. | Lấy ký tự ổ **dưới lock** của suite, **thử lại** khi ký tự vừa bị lấy, **gỡ** ổ sau test, và chỉ dọn ổ **có trong registry**. | Người viết T0b (#60) |
| R6 | **Step CI `test:acceptance` chưa có** trong workflow (một thay đổi riêng, chờ PO duyệt). | Test đã khoá **không chặn merge**: một PR làm hỏng hành vi **vẫn merge được**. | PO duyệt step CI **trước khi PR implementation đầu tiên** của Phase 5 merge. | PO |
| R7 | **Positive control của `fsAudit` chỉ chứng minh audit thấy một `stat`** (mechanism M3). | Audit có thể không thấy một lệnh đọc file đi qua worker thread, tiến trình con hoặc native module, nên test "không đọc file" **pass mà không chứng minh gì**. | Positive control phải chứng minh (M3) audit **phát hiện được một thao tác đọc file bị cấm**. Nếu không quan sát được các đường đọc liên quan, test này **chưa được dùng làm bằng chứng đạt AC**. Contract ở [test-implementation.md](../../implementation/test-implementation.md) mục "Test driver and fixtures" **vẫn ghi `stat`**, nên phải sửa **trước khi PO duyệt T0a** (Z-20). | Người viết T0a (#59) và ticket preload |
| R8 | **Không có cách xác định để kill đúng giữa hai bước ghi** (mechanism M13). | Measure M-1 **không chạy được ổn định**; yêu cầu reliability rủi ro cao **không có test**. | Phase 3 xác định các điểm chèn lỗi và cách kích hoạt failure một cách xác định được. Build 2 và build 6 thêm điểm chèn riêng cho đường ghi setup, deck và slide. | Implementation plan (Phase 3) |
| R9 | **CI không tạo được symlink** (mechanism M17). | Một AC cho symlink (CG-7) **bị chặn**, hoặc bị **bỏ qua ngầm**. | Gate 2 nêu phương án thay thế hoặc ghi một deviation; **không skip ngầm**. | PO, ở Gate 2 |
| R10 | **Ticket #58 đến #69** được tạo **từ AC trước STLC**. | Developer viết và khoá test theo **AC chưa qua Test Design**, ví dụ FR-071 AC-12 **trái** quy tắc NFC (Z-18), nên test **khoá một hành vi sai**. | Test PR **chỉ được duyệt theo AC cuối** của Gate 2. **#59 đến #69 chờ Gate 2**, rồi body được cập nhật theo Test Design đã duyệt; chỉ **#58** đi trước, khi độc lập với AC và driver contract. | PO |
| R11 | **Một người đọc** làm cả basis register và sentence map; con số "0 đơn vị normative chưa có item" là **tự đếm**. | Một mệnh đề bị **bỏ sót** thì **không có test**, và coverage vẫn báo **114 / 114**. | **Error guessing** trên mọi AC; **exploratory session** ở Phase 6; defect thoát được **quay lại record gây ra nó** (test-strategy.md "Going back"). | Agent; PO đọc khác biệt |

## 8. Post-implementation tests

E2E chạy qua **interface thật trên browser**: acceptance test kiểm **hành vi qua field**; E2E kiểm rằng **người dùng thật sự thấy** thông tin và hành động tương ứng, **không so câu chữ**. **Đầu vào cho Phase 3** (open-design, research item 12): **Playwright với Chromium**; mỗi worker có **data folder và port riêng**; **thử lại 1 lần trên CI** và **báo** test nào **chỉ pass nhờ thử lại**; **chờ tín hiệu sẵn sàng**, **không chờ thời gian cố định**; run lỗi thì **giữ log và data folder**. PO **chốt framework ở Phase 3**.

| Level | Target | Technique | What it checks | Smoke |
|---|---|---|---|---|
| E2E | UC-013 main flow S1-S3 | use case testing | Người dùng mở DeckAgent lần đầu, **thêm `Proj`**, **tạo chat** trong workspace đó, **chuyển sang default workspace**, rồi **chuyển lại**. Test kiểm rằng người dùng **thấy chat đó** trong danh sách. | yes |
| E2E | UC-013 A2 | use case testing | Người dùng **yêu cầu xoá** một workspace có chat. Test kiểm rằng người dùng **thấy câu hỏi xác nhận**, và câu hỏi nói folder và chat **vẫn còn**. Người dùng **xác nhận**. Test kiểm rằng chat **thành ungrouped chat**, và default workspace **là workspace đang dùng**. | |
| E2E | UC-013 A3, A12 | use case testing | Folder của workspace **bị dời đi**. Test kiểm rằng người dùng **thấy báo lỗi** kèm **ít nhất một việc làm tiếp dùng được**. Một **folder mới được tạo ở chỗ cũ**. Test kiểm rằng người dùng **thấy báo có folder khác**, rồi **dùng được** folder đó. | |
| E2E | UC-013 A6, A11, A13 | use case testing | Người dùng **chọn folder khác**, **đổi tên** workspace, rồi đưa **một tên bị từ chối**. Test kiểm rằng người dùng **thấy lý do** từ chối, và chat **vẫn còn** trong workspace. | |
| E2E | UC-013 S3, FR-048 AC-2 | use case testing | Workspace **chưa có chat cũ**; người dùng **xem chat cũ**. Test kiểm rằng người dùng **thấy báo không có chat cũ**. | |
| E2E | UC-012 main flow, A1 | use case testing | Người dùng **tạo chat mới** từ một chat có draft. Test kiểm rằng draft cũ **giữ nguyên**, chat mới **rỗng**, và người dùng **thấy báo chưa có model**. | yes |
| Integration | NFR-008 M-1 | fault injection | Như **measure M-1** ở phần Measures. | |

**Phase 4 phải có**, ngoài các implementation ticket theo module:
- **một ticket nối driver** (`deckagent.ts` gọi interface thật); nó **chặn mọi lần đổi `it.fails` thành `it`**, và mỗi implementation PR **cho thấy ở commit đầu** rằng test của nó **fail vì assertion** (test-strategy.md);
- **một ticket preload của fs audit**; các AC dùng `fsAudit` **chỉ đổi sang `it`** sau ticket này;
- **một ticket integration** cho NFR-008 M-1 (`phase:post-impl`), cùng **unit test chèn lỗi** của transaction xoá workspace trong implementation ticket của nó.

## 9. Planning deltas cho PO

<!-- Mỗi dòng là một chỗ phần Test planning khác hoặc thêm vào bản Gate 1 đã duyệt, hoặc một chỗ mâu thuẫn với Gate 1, kèm đề xuất. Outcome: kết quả như sự thật hiện tại, hoặc "pending"; delta đã quyết được ghi vào mục nó thay đổi và bỏ khỏi bảng. -->

Không có delta đang chờ.
