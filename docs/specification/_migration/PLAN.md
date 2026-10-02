# Kế hoạch dịch sheet sang spec (Pha A)

Sinh từ `tools/spec/migrate_sheet.py` (A1, A3), phân loại A2, và 8 file `work/assess-<loại>.md` (A4, A5). Blocker đánh số `BLK-xxx` ở `BLOCKERS.md`; field/section để trống ở `FILL_LATER.md`.

## 1. Kiểm kê

| Loại | Tab | Status | Số item |
|---|---|---|---|
| actors | Actors | Active | 3 |
| **actors** | | **Tổng** | **3** |
| constraints | Constraints | Active | 3 |
| constraints | Constraints | Retired | 4 |
| **constraints** | | **Tổng** | **7** |
| assumptions | Assumptions | Open | 22 |
| assumptions | Assumptions | Retired | 1 |
| assumptions | Assumptions | Supported | 1 |
| **assumptions** | | **Tổng** | **24** |
| use-cases | Use Cases | Active | 8 |
| use-cases | Use Cases | Deprecated | 1 |
| use-cases | Use Cases | Draft | 6 |
| use-cases | Use Cases | Proposed | 9 |
| **use-cases** | | **Tổng** | **24** |
| business-rules | Business Rules | Active | 13 |
| business-rules | Business Rules | Draft | 1 |
| business-rules | Business Rules | Proposed | 4 |
| **business-rules** | | **Tổng** | **18** |
| requirements | Requirements | Active | 28 |
| requirements | Requirements | Draft | 5 |
| requirements | Requirements | Proposed | 21 |
| **requirements** | | **Tổng** | **54** |
| decisions | Decisions | Active | 23 |
| decisions | Decisions | Superseded | 3 |
| **decisions** | | **Tổng** | **26** |
| **glossary** | Operating Rules | GL-xxx | **25** |

### Đối chiếu với sheet

| Tab | Hàng có giá trị ở cột ID | Hàng khớp mẫu ID (= item) | Hàng bị bỏ (không phải ID) |
|---|---|---|---|
| Actors | 3 | 3 | — |
| Constraints | 7 | 7 | — |
| Assumptions | 24 | 24 | — |
| Use Cases | 24 | 24 | — |
| Business Rules | 18 | 18 | — |
| Requirements | 54 | 54 | — |
| Decisions | 26 | 26 | — |
| Operating Rules (GL-) | — | 25 | — |

ID trùng: không có

### Giá trị không có trong enum của schema.json

| Loại | ID | Cột | Giá trị | Ghi chú |
|---|---|---|---|---|
| requirements | R-041 | Type | Constraint | type không có trong schema → blocker DOI_LOAI |
| requirements | R-027 | Area | CI | area không có trong schema |
| requirements | R-032 | Area | Infra | area không có trong schema |
| requirements | R-035 | Area | Infra | area không có trong schema |
| requirements | R-037 | Area | Infra | area không có trong schema |
| requirements | R-041 | Area | Schedule | area không có trong schema |
| requirements | R-042 | Area | Infra | area không có trong schema |
| requirements | R-051 | Area | Infra | area không có trong schema |
| requirements | R-053 | Area | Infra | area không có trong schema |

Xử lý: R-041 Type → BLK-020; Area → BLK-064.

### Khoảng trống trong dãy ID (đã trống từ trước, không do Pha A)

- actors: max ACT-003; không trống
- constraints: max C-007; không trống
- assumptions: max A-029; trống: A-024, A-025, A-026, A-027, A-028
- use-cases: max UC-025; trống: UC-006
- business-rules: max BR-018; không trống
- requirements: max R-054; không trống
- decisions: max D-030; trống: D-019, D-020, D-021, D-022

## 2. Danh sách xóa

Item vận hành dự án (quyết định 2 của Pha A). Lý do lấy từ `work/classification.json`.

| ID | Tên / nội dung | Lý do |
|---|---|---|
| A-001 | Phạm vi V1 có thể được làm rõ trong Sprint 1 để tạo input ổn định cho Architecture, Testin | Giả định về việc làm rõ phạm vi trong Sprint 1 để lập kế hoạch: nói về cách team làm việc |
| A-002 | Team dùng được một development flow chung dù mỗi thành viên dùng Agent hoặc công cụ khác n | Giả định về development flow chung giữa các Agent/công cụ của team |
| A-003 | GitHub hỗ trợ được các rule team cần cho branch, PR và CI. | Giả định về khả năng của GitHub cho branch, PR, CI của team |
| A-004 | Architecture hiện tại có thể được chuẩn hóa thành baseline mà chưa cần thiết kế lại lớn tr | Giả định về việc chuẩn hóa Architecture hiện tại thành baseline: kế hoạch kỹ thuật của team, không nói DeckAgent làm gì |
| A-005 | Tập trung Testing vào critical behavior và contract sẽ phát hiện được các lỗi nghiêm trọng | Giả định về chiến lược Testing của team |
| A-006 | Các Skill lấy từ bên ngoài có thể được chọn lọc và điều chỉnh thay vì dùng nguyên bộ. | Giả định về việc chọn lọc Skill bên ngoài cho Agent của team |
| D-001 | Sprint 1 tập trung Project Baseline & Setup, không triển khai tính năng V1. | Phạm vi Sprint 1 |
| D-002 | GitHub là nơi chính thức lưu code, branch, PR, test và CI. | Chọn GitHub làm nơi lưu code, PR, CI |
| D-003 | Mọi thay đổi vào main phải đi qua PR. | Quy trình PR vào main |
| D-004 | Agent bị ràng buộc ở boundary, contract và điều kiện kiểm chứng; không bị ép cách triển kh | Cách ràng buộc Agent khi phát triển |
| D-005 | Tài liệu Architecture của DeckAgent phải thể hiện dependency, boundary và contract để team | Yêu cầu với tài liệu Architecture của team |
| D-018 | V1 chạy theo Hybrid mode: một delivery slice phải chạy từ đầu tới cuối, còn các điều chưa  | Cách tổ chức delivery (Hybrid mode, Spike) |
| D-023 | Sprint 2 dừng tại Architecture Decision và Testing Approach baseline; Detailed Design và t | Điểm dừng của Sprint 2 |
| GL-025 | Agent | Thuật ngữ về công cụ viết code của thành viên (vận hành dự án); `work/assess-glossary.md` |

### ID đã nghỉ

A-001, A-002, A-003, A-004, A-005, A-006, D-001, D-002, D-003, D-004, D-005, D-018, D-023.

GL-025 không có trong danh sách này vì `glossary.md` không giữ ID thuật ngữ.

### Chờ blocker quyết định xóa hay giữ

| ID | Tên / nội dung | Lý do chưa chắc | Blocker |
|---|---|---|---|
| C-006 |  | Quy tắc về thời điểm team được chốt lựa chọn implementation (quy trình), nhưng ghi dưới dạng giới hạn lên thiết kế sản phẩm; đã Retired | BLK-030 |
| C-007 |  | Quy tắc về thời điểm team được đặt ngưỡng định lượng (quy trình), nhưng R-030, R-032 đang trỏ tới; đã Retired | BLK-030 |
| D-010 | Nhiều định dạng tải về là constraint của project; độ nhất quán giữa các định dạng là quali | Quyết định cách phân loại item trong spec (nhiều định dạng là constraint, nhất quán là quality): meta về spec, nhưng nội dung đã nằm ở C-003, R-025 | BLK-031 |
| D-011 | Không chốt trước cơ chế Architecture hoặc ngưỡng định lượng khi chưa có acceptance criteri | Quyết định không chốt cơ chế Architecture/ngưỡng trước khi có evidence: quy trình ra quyết định, nhưng nhiều item sản phẩm có thể dựa vào | BLK-030 |
| D-028 | 1. W-026 không tạo thêm Hard Gate chỉ vì research thấy một failure mode tồn tại.
2. Một ti | Quy tắc khi nào tiêu chí chất lượng thành Hard Gate, gắn với W-026/W-032: lẫn giữa acceptance của sản phẩm và quy trình research | BLK-032 |
| R-041 | Không xây editor chỉnh slide chuyên nghiệp | Có thể xóa vì trùng D-015 | BLK-020 |

## 3. Quan hệ

- Cặp (ô, ID) trong các cột quan hệ của sheet (trước khi lật, gồm cả cột chiều ngược và `Căn cứ`): **957**
- Quan hệ sau khi lật và khử trùng (trong relations.json): **782**

| Field | direct | flipped | derived |
|---|---|---|---|
| addresses | 76 | 0 | 0 |
| assumptions | 24 | 73 | 0 |
| business_rules | 0 | 36 | 0 |
| constraints | 10 | 29 | 0 |
| depends_on | 41 | 0 | 0 |
| documents | 24 | 0 | 0 |
| extend | 13 | 0 | 0 |
| follows | 18 | 0 | 0 |
| include | 20 | 0 | 0 |
| primary_actor | 24 | 0 | 0 |
| related | 19 | 0 | 0 |
| shapes | 0 | 17 | 0 |
| source | 216 | 0 | 0 |
| split_from | 5 | 0 | 0 |
| supporting_actors | 0 | 0 | 10 |
| use_cases | 44 | 83 | 0 |

Cột `via`: `direct` = ghi ở đúng phía nguồn như sheet; `flipped` = lật từ phía kia; `derived` = `supporting_actors` suy ra từ cột Related Use Cases của Actor. Số trước khi lật tính cả `Căn cứ` và các cột chiều ngược chỉ dùng để đối chiếu; số sau khi lật đã khử trùng.

### Mâu thuẫn hai đầu: 2 chỗ, đã tự xử lý, không thành blocker

1. UC-005 ghi Primary Actor = ACT-001 nhưng Related Use Cases của ACT-001 không có UC-005. `primary_actor` nằm ở phía Use Case nên giữ; UC-005 đã Deprecated.
2. D-030.Assumption chính có A-013 nhưng A-013.Used By không có D-030. `assumptions` nằm ở phía Decision và D-030 ghi rõ, nên giữ.
3. Đối chiếu hai chiều của cột Quan hệ UC (Include ↔ Được include bởi, Extend ↔ Extend bởi, Trước đó ↔ Tiếp theo, Tách từ ↔ Tách ra): không lệch.
4. Tham chiếu gãy (ID không tồn tại): 0. Quan hệ sai loại đích: 0 (một báo nhầm R-041 trong phần giải thích của Quan hệ UC đã được sửa trong script).

Mâu thuẫn hai đầu do subagent phát hiện ở mức nội dung (ví dụ Permissions của Actor so với bước Use Case, `related` ghi ở cả hai Use Case) nằm trong `BLOCKERS.md` loại MAU_THUAN_QH hoặc trong mục 4.

### Item Active dựa vào item hết hiệu lực (GX-04): 12 quan hệ

| Nguồn (status) | Field | Đích (status) | Cột gốc |
|---|---|---|---|
| R-041 (Active) | use_cases | UC-005 (Deprecated) | Use Cases.Related Requirements |
| R-042 (Active) | use_cases | UC-018 (Draft) | Use Cases.Related Requirements |
| R-029 (Active) | constraints | C-001 (Retired) | Constraints.Related Requirements |
| R-041 (Active) | constraints | C-001 (Retired) | Constraints.Related Requirements |
| D-006 (Active) | constraints | C-001 (Retired) | Constraints.Related Decisions |
| D-015 (Active) | constraints | C-001 (Retired) | Constraints.Related Decisions |
| R-003 (Active) | constraints | C-005 (Retired) | Constraints.Related Requirements |
| R-004 (Active) | constraints | C-005 (Retired) | Constraints.Related Requirements |
| D-011 (Active) | constraints | C-006 (Retired) | Constraints.Related Decisions |
| R-030 (Active) | constraints | C-007 (Retired) | Constraints.Related Requirements |
| R-032 (Active) | constraints | C-007 (Retired) | Constraints.Related Requirements |
| R-041 (Active) | assumptions | A-004 (Retired) | Assumptions.Used By (IDs) |

Các quan hệ này được gom vào BLK-025, BLK-026, BLK-030, BLK-027, BLK-028.

### Level của Use Case

| UC | level | Được include bởi |
|---|---|---|
| UC-001 | user-goal | — |
| UC-002 | user-goal | — |
| UC-003 | user-goal | — |
| UC-004 | user-goal | — |
| UC-005 | user-goal | — |
| UC-007 | user-goal | — |
| UC-008 | user-goal | — |
| UC-009 | user-goal | — |
| UC-010 | user-goal | — |
| UC-011 | user-goal | — |
| UC-012 | user-goal | — |
| UC-013 | user-goal | — |
| UC-014 | subfunction | UC-001, UC-002, UC-003, UC-004, UC-008, UC-023, UC-025 |
| UC-015 | subfunction | UC-001, UC-002, UC-003, UC-004, UC-007, UC-008, UC-012, UC-013, UC-017, UC-022, UC-023, UC-024, UC-025 |
| UC-016 | user-goal | — |
| UC-017 | user-goal | — |
| UC-018 | user-goal | — |
| UC-019 | user-goal | — |
| UC-020 | user-goal | — |
| UC-021 | user-goal | — |
| UC-022 | user-goal | — |
| UC-023 | user-goal | — |
| UC-024 | user-goal | — |
| UC-025 | user-goal | — |

UC không có trong bảng trên được include bởi ≤1 UC, nên `level: user-goal`. Chi tiết ở `work/relation-issues.json`.

### Cột bị bỏ

| Tab | Cột | Số ô có dữ liệu | Xử lý |
|---|---|---|---|
| Constraints | Impacts | 7 | bỏ |
| Assumptions | Impacts | 24 | bỏ |
| Assumptions | Related Work (IDs) | 15 | bỏ |
| Use Cases | Related Work | 9 | bỏ |
| Requirements | Related Work (IDs) | 32 | bỏ |
| Requirements | Related Tests | 0 | bỏ |
| Decisions | Related Work | 26 | bỏ |
| Actors | Related Use Cases | 3 | không ghi, dùng để suy ra/đối chiếu |

Tab Operating Rules: chỉ lấy dòng `GL-xxx`; các dòng `OR-xxx`, `WR-xxx` không migrate. Các tab Learnings, Risks, Sprints, Work, Bugs, Updates, Documents, _Config, Home không migrate.

## 4. Kế hoạch dịch

| Loại | Số item | CẤU-TRÚC | VIẾT-LẠI | BLOCKER | XÓA |
|---|---|---|---|---|---|
| actors | 3 | 0 | 0 | 3 | 0 |
| constraints | 7 | 2 | 0 | 5 | 0 |
| assumptions | 24 | 0 | 1 | 17 | 6 |
| use-cases | 24 | 1 | 10 | 13 | 0 |
| business-rules | 18 | 1 | 2 | 15 | 0 |
| requirements | 54 | 3 | 5 | 46 | 0 |
| decisions | 26 | 1 | 8 | 10 | 7 |
| glossary | 25 | 12 | 3 | 9 | 1 |
| **Tổng** | **181** | **20** | **29** | **118** | **14** |

### actors

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| ACT-001 | BLOCKER | `kind: human` (GACT-02). Gộp Goal 3 ý thành 1–2 câu (GACT-03). Đổi "tài liệu" → "tài liệu có sẵn", "mục tiêu, audience" → "ý định", "gõ" → "gõ yêu cầu trong chat" (GX-07). Chuyển "DOC-001" từ Notes sang `source`, bỏ câu nguồn khỏi `Ghi chú` (GX-11, GX-12). Constraints đổi sang dạng tóm tắt kèm ID chủ sở hữu (GX-10, chờ BLK-036). Permissions đồng bộ với bước Use Case (GACT-08, chờ BLK-021) | BLK-021, BLK-036 |
| ACT-002 | BLOCKER | `kind: external-system` (GACT-02). Tạo section `Hành vi lỗi` từ Needs 1 và Constraints 1, tách thành từng cách hỏng (GACT-05, quyết định 5). Goal: "yêu cầu từ DeckAgent" → "dữ liệu DeckAgent gửi trong một lượt xử lý AI" vì "yêu cầu" là thuật ngữ cho nội dung người dùng gõ (GX-07). Knowledge 2 viết thành tóm tắt kèm R-042, có chủ ngữ (GX-10, GX-16). "bước kiểm tra" → "kiểm tra kết quả" (GX-07). Bỏ `Ghi chú` vì tóm tắt lại Hành vi lỗi và liệt kê nhóm Use Case (GX-12, GACT-07) | BLK-021, BLK-037, BLK-001, BLK-030 |
| ACT-003 | BLOCKER | `kind: human` (GACT-02). Tách Permissions thành 4 việc, mỗi việc một dòng (GACT-04). Tách Knowledge thành 2 ý (GX-14). Constraints thêm chủ ngữ là tên actor (GX-16). Permissions thiếu "xem danh sách tài khoản" của UC-020 (GACT-08, chờ BLK-021) | BLK-021 |

### constraints

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| C-001 | CẤU-TRÚC | Retired (Closed): chỉ chuyển vào template, không đổi nghĩa (GX-15). `short_name` mới "AI-first, không làm editor chuyên nghiệp"; Reason / Context → `Lý do không đổi được`; bỏ "(OR-045)" trong Ghi chú, giữ nguyên câu (mục 5). Impacts bỏ. BLK-025 được xử lý ở phía item dựa vào C-001, không đổi nội dung C-001 | BLK-025 |
| C-002 | BLOCKER | `short_name` mới "Kiến trúc vừa nguồn lực đồ án". "quá lớn" và "design system lớn" chưa có ranh giới (GC-02, GC-08) → BLK-003. Ghi chú 2 ("DOC-001 coi Architecture không khả thi… là không đạt") chuyển sang `Lý do không đổi được` vì là lý do, không phải lưu ý (GX-12, GC-03). Review Trigger bỏ "rõ rệt", viết thành sự kiện quan sát được (GC-06, GX-08). Giữ type Resource vì R-041 trỏ tới (GC-07), nhưng phụ thuộc kết quả BLK-020/BLK-027 (mục 6) | BLK-003 |
| C-003 | BLOCKER | `short_name` mới "Nhiều định dạng tải về theo đồ án"; `imposed_by` chuyển từ cột Constraint ("theo yêu cầu của đồ án") (GC-01). Câu Constraint đổi chủ ngữ sang DeckAgent, chỉ giữ giới hạn (GC-02, GX-16); vế "không phải vấn đề người dùng đã được chứng minh" chuyển sang Ghi chú. "nhiều định dạng" chưa có ranh giới, đồ án bắt buộc hay chỉ khuyến khích chưa rõ (GC-08, GX-09) → BLK-004. Lý do 2 chép lại quyết định của D-026 (GX-10) → BLK-038. Ghi chú: "hard acceptance" → "điều kiện nghiệm thu bắt buộc" (GX-07) | BLK-004, BLK-038 |
| C-004 | BLOCKER | `short_name` mới "Khả năng khác nhau giữa định dạng tải về". Câu Constraint bỏ vế mô tả "Các định dạng tải về có khả năng khác nhau" (đã có ở Lý do 1), giữ "<Đối tượng> không được…" (GC-02). Lý do 1 bỏ cụm mở "và các định dạng khác", thay bằng "ví dụ" (GX-08). Lý do 2 là nội dung quy định của R-025 (GX-10) → BLK-038. Ghi chú bỏ "DOC-001 chủ động" (GX-12). Review Trigger thay "chúng" bằng danh từ (GX-17) | BLK-038 |
| C-005 | CẤU-TRÚC | Retired (Closed): chỉ chuyển vào template (GX-15). `short_name` mới "Vai trò file không theo loại file"; Reason / Context → `Lý do không đổi được`. Impacts bỏ. BLK-026 xử lý ở phía R-003, R-004 | BLK-026 |
| C-006 | BLOCKER | Chờ BLK-030 (giữ hay xóa). Nếu giữ: Retired, chỉ chuyển cấu trúc (GX-15), `short_name` mới "Chưa chốt cơ chế implementation sớm". Nếu xóa: quan hệ D-011 → C-006 bỏ theo BLK-030 | BLK-030 |
| C-007 | BLOCKER | Chờ BLK-030. Nếu giữ: Retired, chỉ chuyển cấu trúc (GX-15), `short_name` mới "Chưa đặt ngưỡng định lượng khi thiếu evidence". Nếu xóa: quan hệ từ R-030, R-032, R-035, R-036, R-037 bỏ theo BLK-030 | BLK-030 |

### assumptions

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| A-001 | XÓA | Phân loại `project` (A2): giả định về việc làm rõ phạm vi V1 trong Sprint 1. Status Supported có `source` DOC-002 nên đạt GA-07, nhưng không chuyển | — |
| A-002 | XÓA | `project`: development flow chung giữa các Agent. Không Requirement hay Decision nào dựa vào | — |
| A-003 | XÓA | `project`: rule GitHub cho branch, PR, CI. Không Requirement hay Decision nào dựa vào | — |
| A-004 | XÓA | `project`, Retired. Tham chiếu W-026, W-034, W-035 trong Ghi chú bỏ cùng item (mục 5). Quan hệ R-041 → A-004 xử lý ở BLK-027 | BLK-027 |
| A-005 | XÓA | `project`: chiến lược Testing. 9 Requirement Active đang dựa vào, xử lý ở BLK-029 | BLK-029 |
| A-006 | XÓA | `project`: chọn lọc Skill cho Agent. Không Requirement hay Decision nào dựa vào | — |
| A-007 | BLOCKER | Câu gộp ba đặc điểm của nhóm người dùng (trùng ACT-001, một vế trùng A-008) với lựa chọn "nên phục vụ" không bác bỏ được (GA-01, GA-02, GX-10) → BLK-018; "chuyên sâu" (GX-08). Signpost: "khác rõ rệt" chưa có ngưỡng (GA-04) → BLK-005; vế "team chọn nhóm người dùng hẹp hơn" là sự kiện quyết định, không phải dấu hiệu sai → BLK-065. Ghi chú 3 bỏ tên nguồn DOC-001, DOC-002, giữ ý "chưa có evidence thực tế" (GX-12) | BLK-046, BLK-018, BLK-065, BLK-005 |
| A-008 | BLOCKER | "phần lớn" chưa có đại lượng nên câu chưa bác bỏ được (GA-01, GX-08) → BLK-005. Signpost: "nhiều hơn" (GA-04) → BLK-005; vế "AI-first không giảm được việc thủ công" đo hiệu quả của AI, không đo điều người dùng muốn → BLK-065. Ghi chú 2: "nếu sai, mục tiêu và ranh giới V1 có thể phải mở lại" chuyển sang `Nếu sai` (GA-06); "Là nền của quyết định…" bỏ vì quan hệ D-006, D-012 → A-008 đã ghi (GX-12) | BLK-046, BLK-065, BLK-005 |
| A-009 | BLOCKER | "hợp với người dùng" mơ hồ, câu chưa chỉ ra quan sát bác bỏ (GA-01, GX-08) → BLK-005. Signpost tách 3 tín hiệu thành danh sách (GX-14); "gõ lại nhiều lần", "hiệu quả hơn" chưa có ngưỡng (GA-04) → BLK-005. Ghi chú giữ (giới hạn phạm vi) | BLK-046, BLK-005 |
| A-010 | BLOCKER | Viết thành một giả thuyết, bỏ "có thể" (GA-01); "lỗi nhỏ" chưa có danh sách (GX-08) → BLK-006. Signpost: "hiếm khi", "thường xuyên" (GA-04) → BLK-006; vế "thường xuyên cần sửa trước khi tải về" là tín hiệu xác nhận → BLK-065. Ghi chú: bỏ nguồn DOC-002 (GX-12); "không được kéo V1 sang xây editor web" là quy định của D-015 → BLK-039; "Theo dõi cho UC-005" giữ làm text | BLK-046, BLK-039, BLK-065, BLK-006 |
| A-011 | BLOCKER | "nhu cầu cốt lõi" và "capability phụ" chưa có đại lượng (GA-01) → BLK-008. Signpost: vế "nhu cầu sửa deck có sẵn lớn" là tín hiệu xác nhận, vế "chi phí… quá cao so với giá trị" là tín hiệu chi phí → BLK-065; "lớn", "quá cao" (GA-04) → BLK-008. Ghi chú giữ | BLK-046, BLK-065, BLK-008 |
| A-012 | BLOCKER | Bỏ vế "nên DeckAgent cần đầu tư vào việc giữ nguyên phần ngoài phạm vi sửa" (quy định của R-022, GX-10) → BLK-039; "thường xuyên" chưa có tần suất (GA-01, GX-08) → BLK-009. Signpost: vế "trở thành vấn đề lớn" là tín hiệu xác nhận → BLK-065; "lớn" → BLK-009. Ghi chú giữ; "P4 Safe Refinement" giữ làm tên riêng | BLK-046, BLK-039, BLK-065, BLK-009 |
| A-013 | BLOCKER | Viết thành giả thuyết "nếu DeckAgent không giữ… thì trải nghiệm giảm", chủ động (GA-01, GX-16); vế "cần được giữ" và Ghi chú 1 phát biểu lại BR-003 → BLK-039; "giảm rõ rệt" chưa có đại lượng (GA-01, GX-08) → BLK-009. Review Trigger tách 2 tín hiệu (GX-14); "khi đó cần xác định thời hạn theo từng loại ràng buộc" chuyển sang `Nếu sai` (GA-06). Dịch thử ở mục 4 | BLK-046, BLK-039, BLK-009 |
| A-014 | BLOCKER | "nhận được giá trị" chưa có đại lượng (GA-01) → BLK-008. Signpost: "ít loại file", "độ phức tạp lớn mà ít giá trị" (GA-04) → BLK-008; vế độ phức tạp là tín hiệu chi phí → BLK-065. Ghi chú 1 đã tóm tắt D-007, D-024 kèm ID, giữ (GX-10) | BLK-046, BLK-065, BLK-008 |
| A-015 | BLOCKER | Bỏ vế "nên DeckAgent phải phân biệt rõ…" (quy định của R-008) → BLK-039; "tài liệu" → "tài liệu có sẵn" (GX-07); "quan tâm" chưa có đại lượng (GA-01) → BLK-007. Signpost: "luồng tạo từ tài liệu ít được dùng" đo mức dùng, không đo điều người dùng coi trọng → BLK-065; "tự do hơn dự kiến" → BLK-007. Ghi chú 3 chuyển sang `Cách kiểm chứng` (một phần); "P1 Source Fidelity" giữ làm tên riêng (BLK-069) | BLK-046, BLK-039, BLK-065, BLK-007 |
| A-016 | BLOCKER | Câu so sánh hai mức coi trọng nhưng chưa có đại lượng (GA-01) → BLK-007. Signpost: "Yêu cầu đồ án… đòi hỏi" và "một định dạng cần contract riêng" không phải dấu hiệu người dùng coi trọng khác → BLK-065; "cao hơn" → BLK-007. Ghi chú 2 "V1 không yêu cầu PPTX và PDF giống nhau từng pixel" là quy định của D-009 → BLK-039 | BLK-046, BLK-039, BLK-065, BLK-007 |
| A-017 | BLOCKER | "đáng tin", "dùng được" (GA-01, GX-08) → BLK-007. Signpost "khác nhau rõ rệt" (GA-04) → BLK-007. Ghi chú 2: vế "nếu sai, luồng Xem trước → Giữ → Tải về phải thay đổi" chuyển sang `Nếu sai` (GA-06); vế còn lại giữ | BLK-046, BLK-007 |
| A-018 | BLOCKER | "khác nhau rõ ràng", "chất lượng bắt buộc" chưa có đại lượng (GA-01, GX-08) → BLK-010. Review Trigger: "Sau benchmark về thời gian, chi phí, khả năng model và chất lượng" chuyển sang `Cách kiểm chứng` (một phần); 2 điều kiện bác bỏ giữ trong Signpost (GX-14), "lớn hơn lợi ích" → BLK-010. Ghi chú 2 bỏ nguồn "Option B (AD6) trong DOC-001" (GX-12), giữ "không phải mục tiêu chính của V1" | BLK-046, BLK-010 |
| A-019 | BLOCKER | "phân biệt được rõ" chưa có đại lượng (GA-01, GX-08) → BLK-010; danh sách 6 loại giữ nguyên. Signpost "quá mơ hồ", "không giúp" (GA-04) → BLK-010. Ghi chú 2 bỏ tên nguồn DOC-001, giữ ý "mô hình tư duy hiện tại, chưa được chứng minh" (GX-12); Ghi chú 3 đã tóm tắt D-025 kèm ID, giữ | BLK-046, BLK-010 |
| A-020 | BLOCKER | "chỉnh tay chuyên sâu", "công cụ chuyên dụng" (GX-08) → BLK-006. Signpost tách 3 tín hiệu (GX-14); "nhiều hơn dự kiến" → BLK-006; "file PPTX bàn giao không dùng được" cùng câu hỏi với A-022 → BLK-044. Ghi chú 2 bỏ (quan hệ D-015 → A-020 đã ghi, GX-12) | BLK-046, BLK-006, BLK-044 |
| A-021 | BLOCKER | "mức dùng được" chưa có tiêu chí (GA-01, GX-08) → BLK-006. Signpost "quá thường xuyên", "mất kiểm soát" (GA-04) → BLK-006. Ghi chú phát biểu lại D-025 → tóm tắt kèm ID (GX-10) | BLK-046, BLK-006 |
| A-022 | BLOCKER | Bỏ vế "nhờ đó V1 không cần xây editor chuyên nghiệp" (quy định của D-015) → BLK-039; "dùng được để bàn giao" chưa có ứng dụng đích và tiêu chí (GA-01) → BLK-044. Signpost "mở ổn định", "khó sửa", "làm lại nhiều" (GA-04) → BLK-044. Ghi chú 1 tóm tắt D-026 kèm ID; Ghi chú 2 chuyển sang `Cách kiểm chứng` (một phần) | BLK-046, BLK-039, BLK-044 |
| A-023 | VIẾT-LẠI | Nêu tên PPTX, PDF thay cho "hai định dạng, một sửa được và một chỉ xem"; vế "dù tầm nhìn sản phẩm…" chuyển sang Ghi chú (GA-01). Signpost tách 2 sự kiện (GX-14), bỏ "ngay" (GX-08). Ghi chú phát biểu lại D-026 → tóm tắt kèm ID (GX-10). Dịch thử ở mục 4 | — |
| A-029 | BLOCKER | Giữ một item: vế "vì tải về PPTX giúp họ giữ…" là cơ chế của cùng giả thuyết (GA-02, mục 6). Signpost "thường mất", "thường cần quay lại" (GA-04) → BLK-009. Ghi chú 2 "Nếu sai, cần mở R-048" chuyển sang `Nếu sai` (GA-06); Ghi chú 1 là lịch sử và quan hệ D-027 → bỏ (GX-12) | BLK-046, BLK-009 |

### use-cases

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| UC-001 | BLOCKER | Tiêu đề thêm chủ ngữ "Người dùng", "không có file" → "không kèm tài liệu có sẵn" (GUC-01, GX-07). Tình huống theo mẫu "Tôi có…, tôi muốn…, để…", bỏ "ngay" (GUC-04, GX-08). Tách 4B "AI lỗi hoặc quá thời gian" thành hai nhánh theo điều kiện phát hiện được (GUC-11). Nhánh theo dạng chuẩn: thêm chủ ngữ cho 1A, bỏ "sau đó", "kết thúc UC" → "kết thúc Use Case" (GUC-10, GX-16). Thêm tham chiếu BR-010 (Postconditions 1), BR-014 (4A, 4B), R-033 (5A) (GUC-15, GX-10). `level: user-goal`, `supporting_actors: [ACT-002]` | BLK-047, BLK-001, BLK-053 |
| UC-002 | BLOCKER | Tiêu đề bỏ danh sách loại file vì GL-003 đã định nghĩa "tài liệu có sẵn" (GUC-01). Tình huống theo mẫu, bỏ "nó" (GUC-04, GX-17). Bước 3 bỏ "nó", tham chiếu BR-008 (GX-17, GUC-15). 1A tham chiếu BR-009; bước 6 và Postconditions 2–3 tham chiếu BR-002 thay cho "P1" (GUC-15, GX-10). Tách 5C (GUC-11). Bỏ "sau đó" trước "quay lại bước" (GUC-10). Câu hỏi mở 2 bỏ "(W-032)", nơi xử lý đổi sang R-007 (GUC-18, mục 5). Ghi chú 2 tham chiếu BR-009; Ghi chú 3 bỏ "(L-001)" (mục 5) | BLK-047, BLK-001, BLK-011, BLK-049, BLK-045, BLK-053 |
| UC-003 | BLOCKER | Tiêu đề thêm chủ ngữ, dùng "deck có sẵn" (GL-004) (GUC-01, GX-07). Tình huống theo mẫu, vế "để" lấy từ Mục tiêu (GUC-04). Ghi chú 1 tham chiếu BR-009 (GUC-15). Câu hỏi mở gán nơi xử lý R-005 (mục 6, ghi chú 5). Nhánh 4A thiếu điểm kết thúc: chưa bắt buộc ở Proposed (GUC-10 áp từ Active), ghi ở mục 6 | BLK-011 |
| UC-004 | BLOCKER | Tiêu đề: "(độ dài, giọng văn, thứ tự, nội dung)" là danh sách thiếu 3 trong 7 loại sửa → dùng thuật ngữ "sửa cả deck" (GL-014) (GUC-01, GX-07, GX-08). Tình huống theo mẫu (GUC-04). Đánh số lại bước "2'" thành bước 3 và dời số các bước sau (GUC-08, CI đánh số). Bước 3 (cũ) bỏ "(nếu có)" (GUC-08). Tách 2A và 2B thành từng dòng một điểm kết thúc (GUC-10). Tách 3B (GUC-11). 2C tham chiếu BR-013 (GUC-15). Bỏ "nó" (GX-17). Phần quy tắc ranh giới commit và rollback, điểm kết thúc của Main Flow, câu hỏi A-013: chờ blocker | BLK-047, BLK-001, BLK-035, BLK-050, BLK-043 |
| UC-005 | BLOCKER | Closed: chỉ chuyển vào template, không sửa nội dung, kể cả tiêu đề (GX-15). `related: [UC-008]` giữ ở UC-005 (GX-05, mục 6 ghi chú 3). Không cần `Bảo đảm tối thiểu` (section bắt buộc từ Active) | BLK-027 |
| UC-007 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). 2B tham chiếu BR-013 (GUC-15). Bỏ "sau đó" (GUC-10). Câu hỏi mở gán nơi xử lý R-010 (mục 6). Giải thích `related: [UC-017]` đã có ở Ghi chú 1 | BLK-022 |
| UC-008 | BLOCKER | Xem dịch thử ở mục 4. Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). Mục tiêu bỏ "dùng được" (GX-08). Bước 7 có "Nếu" → nhánh 6A (GUC-08). 1A đổi sang điều kiện phát hiện được (GUC-11). Tách 3A và 4A theo từng điều kiện và điểm kết thúc (GUC-10, GUC-11). Bước 4 tham chiếu BR-006; Postconditions 3 "P5" → BR-007 (GUC-15, GX-10). Postconditions 2 tách: vế thành công giữ lại, vế "chỉ khi tải về thành công" chuyển sang Bảo đảm tối thiểu. Postconditions 5 chuyển sang Ghi chú, tham chiếu BR-012 (GUC-13). `related` UC-005 ghi ở UC-005 (mục 6) | BLK-048, BLK-044, BLK-051 |
| UC-009 | VIẾT-LẠI | Draft: chỉ áp gate cấu trúc. Tiêu đề thêm chủ ngữ: "Người dùng đăng nhập vào tài khoản DeckAgent" (GUC-01). `source` giữ mã "Benchmark 27/09/2026" mà relations.json không ghi (GX-11, mục 6). `related: [UC-020]` giữ ở UC-009 | — |
| UC-010 | VIẾT-LẠI | Draft. Tiêu đề: "Người dùng đăng xuất, hoặc bị đăng xuất khi phiên đăng nhập hết hạn" (GUC-01, GX-07: dùng đúng thuật ngữ "phiên đăng nhập"). Ghi chú 2 bỏ "(GL-012, GL-013)", giữ tên hai thuật ngữ (mục 5). `related: [UC-014]` giữ ở UC-010 | — |
| UC-011 | BLOCKER | Tiêu đề thêm chủ ngữ, giữ điểm phân biệt "deck chưa tải về bị mất" (GUC-01). Tình huống theo mẫu (GUC-04). 2A ghi điểm kết thúc "tiếp tục bước 5" thay cho "bỏ qua bước 3 và 4" (GUC-10). 1A tham chiếu BR-014; bước 3 và Postconditions 2 tham chiếu BR-012 (GUC-15). Bỏ "sau đó" (GUC-10). Câu hỏi mở giữ, nơi xử lý R-042 (GUC-18). Giải thích "(dừng lượt xử lý AI đang chạy)" của `related: [UC-014]` chuyển vào Ghi chú. Nhánh 1B: chờ blocker | BLK-052 |
| UC-012 | VIẾT-LẠI | Tiêu đề thêm chủ ngữ, "deck đã làm trước đó" → "deck đã lưu" (GUC-01, khớp R-049). Tình huống theo mẫu, bỏ "nó" (GUC-04, GX-17). Bỏ Precondition 2 "Deck gốc còn tồn tại" vì nhánh 1A kiểm lại (GUC-07). Câu hỏi mở gán nơi xử lý R-049 (mục 6). Bước 2 còn "nếu có": phải sửa trước khi lên Active (GUC-08) | — |
| UC-013 | VIẾT-LẠI | Tiêu đề: "Người dùng bỏ bản chờ duyệt để quay về bản đã chấp nhận trước lần sửa" (GUC-01, GX-07). Tình huống theo mẫu, bỏ "ngay" (GUC-04, GX-08). Bỏ Precondition 1 "Có bản chờ duyệt" vì nhánh 1A kiểm lại (GUC-07, đúng ví dụ trong `_CRITERIA.md`). Bỏ Postconditions 3 "Người dùng gửi được yêu cầu sửa khác" vì là "có thể làm gì tiếp" (GUC-13). "kết thúc UC" → "kết thúc Use Case" (GUC-10) | — |
| UC-014 | BLOCKER | Tiêu đề: "Người dùng theo dõi tiến độ lượt xử lý và dừng lượt xử lý AI giữa chừng" (GUC-01, GX-07). Tình huống theo mẫu, bỏ "nó", "ngay" (GUC-04, GX-17, GX-08). Mục tiêu: "dừng được khi cần" → "dừng được lượt xử lý AI trước khi lượt đó xong" (lấy từ R-046) (GX-08). Tách 2B (GUC-11). 2A tham chiếu BR-014 (GUC-15). "kết thúc UC" → "kết thúc Use Case". `level: subfunction` (được include bởi 7 Use Case) | BLK-047, BLK-001, BLK-048, BLK-030 |
| UC-015 | VIẾT-LẠI | Tiêu đề: "Người dùng xem trước deck trong DeckAgent trước khi giữ, sửa hoặc tải về" (GUC-01, bỏ "ngay" theo GX-08). Tình huống theo mẫu (GUC-04). 1A: "Không hiển thị được deck" → "Hệ thống không dựng được bản xem trước của deck" (GUC-11). "kết thúc UC" → "kết thúc Use Case". Bỏ Ghi chú 1 vì lặp Mục tiêu (GX-12). `related` chỉ giữ UC-019; bỏ UC-004, UC-008, UC-013 vì đã có `include` từ phía kia (GX-05, mục 6). `level: subfunction` | — |
| UC-016 | VIẾT-LẠI | Draft. Tiêu đề thêm chủ ngữ (GUC-01), "dàn ý" đã đúng GL-018. `source` giữ "Benchmark 27/09/2026" (GX-11) | — |
| UC-017 | BLOCKER | Tiêu đề bỏ "(màu, font, logo)" vì GL-020 đã định nghĩa "bộ nhận diện" (GUC-01). Tình huống theo mẫu (GUC-04). Mục tiêu đang lặp Postconditions 1 → viết theo kết quả người dùng nhận, lấy từ Tình huống: "chọn một lần cho cả deck" (GUC-05). Postconditions 1 tham chiếu BR-017 (GUC-15). Câu hỏi mở 2 "template PPTX" → "file PPTX của tổ chức" (GX-07, GL-019). Câu hỏi mở gán nơi xử lý R-047 (mục 6). Ghi chú 1 bỏ "đang được theo dõi ở L-002" (mục 5). `related` UC-007 ghi ở UC-007 | BLK-062 |
| UC-018 | BLOCKER | Draft. Tiêu đề thêm chủ ngữ (GUC-01). `source` giữ "Benchmark 27/09/2026" (GX-11) | BLK-028 |
| UC-019 | VIẾT-LẠI | Draft. Tiêu đề thêm chủ ngữ (GUC-01). `source` giữ "Benchmark 27/09/2026" (GX-11). Ghi chú cho lần lên Proposed ở mục 6 (hai mục tiêu, "người xem" chưa phải actor) | — |
| UC-020 | CẤU-TRÚC | Draft, tiêu đề đã có chủ ngữ. Chỉ chuyển vào template. `related` UC-009 ghi ở UC-009 (GX-05, mục 6). Xem dịch thử ở mục 4 | — |
| UC-021 | VIẾT-LẠI | Tiêu đề: "Người dùng mở lại deck đã lưu từ lần làm việc trước" (GUC-01, GX-07 "lần làm việc"). Tình huống theo mẫu (GUC-04). Bỏ "sau đó" (GUC-10). Câu hỏi mở gán nơi xử lý R-048 (mục 6) | — |
| UC-022 | VIẾT-LẠI | Tiêu đề bỏ "bất kỳ", thêm chủ ngữ: "Người dùng xem lịch sử các bản đã chấp nhận và khôi phục một bản" (GUC-01, GX-08). Tình huống theo mẫu (GUC-04). Mục tiêu bỏ "bất kỳ", "ngay": "một bản đã chấp nhận trong lịch sử, không chỉ bản trước lần sửa gần nhất" (GX-08). 4A tham chiếu BR-005 (GUC-15). Câu hỏi mở gán nơi xử lý R-016 (mục 6) | — |
| UC-023 | VIẾT-LẠI | Tiêu đề dùng thuật ngữ "sửa cục bộ" (GL-015): "Người dùng yêu cầu AI sửa cục bộ một slide hoặc một thành phần" (GUC-01, GX-07). Tình huống theo mẫu (GUC-04). Postconditions 1 và 3A tham chiếu BR-004; 3B tham chiếu BR-005 (GUC-15). Ghi chú 2 bỏ "(L-002)" (mục 5) | — |
| UC-024 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). 2A tham chiếu BR-005 (GUC-15). Câu hỏi mở bỏ "(L-001)", nơi xử lý R-017 (mục 5, mục 6). Ghi chú 1 nhắc ID đã nghỉ UC-006: giữ (mục 6) | BLK-062 |
| UC-025 | BLOCKER | Tiêu đề thêm chủ ngữ (GUC-01). Tình huống theo mẫu (GUC-04). Câu hỏi mở gán nơi xử lý R-044 (R-044 Acceptance 2 đã ghi điều này được chốt khi đưa vào phạm vi) (mục 6) | BLK-062 |

### business-rules

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| BR-001 | BLOCKER | Tách Rule thành 2 mệnh đề: xác định vai trò theo mục đích; đuôi file không quyết định vai trò (GBR-03, GX-14). Exceptions không phải ngoại lệ mà là giới hạn V1 kèm một yêu cầu "công bố": xử lý theo BLK-055 (GBR-06). Ghi chú "R-004 mô tả hành vi…" bỏ hoặc giữ tùy BLK-033 (GX-12) | BLK-033, BLK-034, BLK-055 |
| BR-002 | BLOCKER | Mệnh đề 1 thêm chủ thể "hệ thống" (GX-16, GBR-02). Exceptions là quyền bổ sung nội dung, không phải trường hợp rule không áp dụng: gộp vào Rule thành mệnh đề riêng (GBR-06, GBR-03) | BLK-033 |
| BR-003 | BLOCKER | Thêm tân ngữ cho "tiếp tục áp dụng" (GX-17); dùng "ràng buộc của người dùng" (GX-07, GBR-09). Exceptions bổ sung 2 trường hợp tóm tắt kèm ID từ BR-010 (yêu cầu bị hủy hoặc từ chối trước ranh giới commit; người dùng bỏ bản chờ duyệt) (GBR-06, GX-10). "sẽ được định nghĩa sau" → BLK-043 | BLK-033, BLK-043 |
| BR-004 | BLOCKER | Câu thoát "trừ khi việc đó cần thiết" (GX-08, GBR-06) → BLK-012. Rule giữ mẫu "Khi …, hệ thống không được …" (GBR-02 đã đạt). Ghi chú giữ (giới hạn phạm vi) | BLK-033, BLK-012 |
| BR-005 | BLOCKER | Đổi `short_name` bỏ "Luôn", "dùng được" (GX-08, GBR-11). Exceptions nói về cơ chế (snapshot, diff), không phải ngoại lệ → chuyển sang Ghi chú (GBR-04, GBR-06). "giữ hoặc khôi phục" khi tải về thất bại phải thống nhất với BR-010 mục 6 → BLK-035 | BLK-033, BLK-035 |
| BR-006 | BLOCKER | Tách 2 mệnh đề (GBR-03). Exceptions: "nó" → "định dạng đích" (GX-17); "giới hạn đã biết của định dạng" → BLK-002. Ghi chú bỏ lịch sử đổi status và ngày `27/09/2026` (GX-12, GX-18), giữ lưu ý "bản đang xem trước có thể là bản chờ duyệt (BR-010)" | BLK-033, BLK-035, BLK-002 |
| BR-007 | BLOCKER | Thêm chủ thể "hệ thống" (GX-16); tách vế "không bắt buộc giống …" thành mệnh đề riêng (GBR-03). Exceptions "sẽ có quy tắc riêng" không phải ngoại lệ hiện có → chuyển sang Ghi chú như việc để sau (GBR-06, GX-12); "use case" → "Use Case" | BLK-033, BLK-034 |
| BR-008 | BLOCKER | Vế 2 đổi chủ ngữ sang "hệ thống không được để nội dung đó …" (GX-16, GBR-02). Exceptions "Không có ngoại lệ…" → xóa section; ý tài liệu nội bộ được tin cậy chuyển sang Ghi chú (GBR-06, GX-12); "(nếu có sau này)" giữ nguyên trong Ghi chú | BLK-033 |
| BR-009 | BLOCKER | Mệnh đề 2 viết lại "Khi người dùng đưa PPTX làm tài liệu có sẵn, hệ thống chỉ được lấy nội dung, không được giữ bố cục" (GBR-02, GX-16); "giữ bố cục thuộc UC-003" → Ghi chú (GX-12). Ghi chú L-001 giữ làm text (mục 5) | BLK-034 |
| BR-010 | BLOCKER | Viết lại 8 mệnh đề thành 19 mệnh đề nguyên tử, bỏ phụ thuộc "Với trường hợp 3b" (GBR-03) và trình tự "theo thứ tự" (GBR-04); thêm `Bảng chuyển trạng thái` (GBR-05); "nó" → danh từ (GX-17); "kiểm tra" → "kiểm tra kết quả" (GX-07); Exceptions chuyển sang Ghi chú (GBR-06). Chi tiết ở mục 4 | BLK-034, BLK-035, BLK-054 |
| BR-011 | BLOCKER | Thêm vế "Khi yêu cầu sửa nhắm vào một slide" lấy từ `short_name` (GBR-02); giữ thuật ngữ "cố gắng, không đảm bảo" (GL-022) | BLK-034 |
| BR-012 | BLOCKER | Mệnh đề 1 không có "phải / không được": chọn mức cam kết → BLK-056 (GBR-02). Mệnh đề 2 giữ, đã đạt mẫu | BLK-033, BLK-034, BLK-056 |
| BR-013 | VIẾT-LẠI | Tách thành 2 mệnh đề: phải báo giới hạn; không được bỏ qua âm thầm hoặc trả kết quả sai (GBR-03). Giữ nguyên danh sách trong ngoặc. Đổi `short_name` "Không giả vờ làm được" thành tên nêu nội dung, ví dụ "Báo giới hạn khi chưa làm được yêu cầu" (GBR-11). Ghi chú "Áp dụng cho mọi luồng tạo, sửa và tải về" giữ (giới hạn phạm vi) | — |
| BR-014 | BLOCKER | Mệnh đề 1 → "Hệ thống không được chạy đồng thời hai lượt xử lý AI tạo hoặc sửa deck trong cùng một lần làm việc" (GBR-02, GX-16). Mệnh đề 2 → "Khi lượt xử lý AI bị dừng hoặc lỗi, hệ thống không được tạo bản mới" (GBR-02). Ghi chú giữ (hệ quả cho người dùng) | BLK-034, BLK-035 |
| BR-015 | VIẾT-LẠI | Tách 2 mệnh đề: phải tạo bản sao; sửa bản sao không được làm đổi deck gốc (GBR-03). Ghi chú bỏ mục 2 (tóm tắt lại quan hệ và trỏ OR-045, GX-12). R-049 phải tóm tắt kèm ID BR-015 thay vì phát biểu lại (GX-10, việc của loại requirements) | — |
| BR-016 | BLOCKER | Tách 2 mệnh đề: không được xóa bản khác; bản bị thay vẫn nằm trong lịch sử (GBR-03). Câu thoát "trong giới hạn lưu trữ" → BLK-013. Ghi chú bỏ mục 2 (OR-045, GX-12) | BLK-013 |
| BR-017 | BLOCKER | Tách 2 mệnh đề: mỗi slide dùng cùng theme; theme giữ qua các lần sửa và khi tải về (GBR-03); "mọi slide" → "mỗi slide của deck" (GX-08). Ghi chú bỏ (chỉ có OR-045) → xóa section. `source` có L-002 → BLK-062 | BLK-062 |
| BR-018 | CẤU-TRÚC | Chỉ chuyển vào template. Draft nên chỉ chịu gate cấu trúc | — |

### requirements

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| R-001 | BLOCKER | Đưa điều kiện lên đầu câu theo EARS (GR-01, GR-03). Thay "thành trạng thái các bước sau dùng được" bằng "để các bước tạo và sửa sau đọc được", lấy từ Acceptance 2 (GX-08). "yêu cầu riêng" là cụm mở (GX-08) → BLK-043. Viết Acceptance ở thể chủ động (GX-16). Rút gọn short_name (GR-16) | BLK-043 |
| R-002 | BLOCKER | Viết theo mẫu "Nếu … thì DeckAgent … hỏi lại" (GR-01, GR-03). Item Active dùng "nên" và "có thể" (GR-02) → BLK-057. Điều kiện "thông tin có thể làm deck đi sai hướng" chưa có danh sách (GX-08, GR-03) → BLK-015. Viết Acceptance ở thể chủ động (GX-16) | BLK-057, BLK-015 |
| R-003 | BLOCKER | Giữ nguyên câu Yêu cầu, vì việc liệt kê đối tượng được GR-04 cho phép. Ghi chú bỏ "(L-001)" và giữ phần text. Viết Acceptance ở thể chủ động (GX-16). Trùng D-024 mục 1 (GX-10) → BLK-041. Dựa vào C-005 đã Retired → BLK-026 | BLK-041, BLK-026 |
| R-004 | BLOCKER | Chuyển Acceptance 3 ("chưa bắt buộc trong V1") sang Ghi chú, vì đó là giới hạn phạm vi (GR-07, GX-12). Acceptance 2 là câu phủ định (GR-12): gợi ý `verification: inspection`. Rút gọn short_name (GR-16). Trùng BR-001 → BLK-033; trùng D-007 → BLK-041. Dựa vào C-005 → BLK-026 | BLK-033, BLK-041, BLK-026 |
| R-005 | VIẾT-LẠI | Viết Acceptance ở thể chủ động, chủ ngữ là người dùng (GX-16, GR-07). Phần còn lại chỉ chuyển vào template | — |
| R-006 | BLOCKER | Viết theo EARS: "Khi người dùng gửi yêu cầu tạo deck, DeckAgent phải…" (GR-01, GR-03). "nhiều slide" trong Acceptance 1 không có mốc (GX-08) → BLK-016. Viết Acceptance ở thể chủ động (GX-16). Giữ Ghi chú định nghĩa "hoàn chỉnh" làm lưu ý khi đọc | BLK-016 |
| R-007 | BLOCKER | Chuyển điều kiện "Bắt buộc đạt khi deck được tạo từ tài liệu có sẵn" từ Ghi chú vào đầu câu Yêu cầu (GR-03, GX-12). Tiêu chí đo đang chờ W-032 (GX-09, GR-10) → BLK-058, BLK-063. Trùng BR-002 mục 1 → BLK-033. Acceptance 3 trùng R-008 → BLK-040. `source` có D-028 → BLK-032. `assumptions` có A-005 → BLK-029 | BLK-058, BLK-033, BLK-040, BLK-063, BLK-032, BLK-029 |
| R-008 | BLOCKER | Viết theo mẫu "Nếu tài liệu có sẵn không có căn cứ cho nội dung được yêu cầu thì DeckAgent phải…" (GR-01, GR-03). "Hỏi lại hoặc đánh dấu" là hai cách đáp ứng cùng một năng lực, giữ nguyên. Cách hiển thị chưa chốt (GX-09) → BLK-045. Trùng BR-002 mục 2 → BLK-033. Rút gọn short_name (GR-16) | BLK-045, BLK-033 |
| R-009 | BLOCKER | Viết theo EARS: "Khi tạo hoặc sửa deck, DeckAgent phải…" (GR-01). Acceptance "thể hiện mục đích, audience…" chỉ phán được bằng ý kiến chủ quan (GR-07) → BLK-058. Chuyển "P2 User Intent Fidelity" từ Ghi chú sang `source` dưới dạng `DOC-001 P2` (GX-11, GX-12) | BLK-058 |
| R-010 | BLOCKER | Thay "nó" bằng "deck mẫu" (GX-17). Viết Acceptance ở thể chủ động (GX-16). Ghi chú "Còn ở mức thăm dò" trái với nghĩa của Proposed → BLK-061 | BLK-061 |
| R-011 | BLOCKER | Viết theo EARS: "Khi người dùng mô tả thay đổi trong chat, DeckAgent phải…" (GR-01). Acceptance 1 và 3 trùng D-025 mục 1 và 3 → BLK-041. Acceptance 2 trùng BR-010 mục 2, Acceptance 3 trùng BR-011 → BLK-033. Loại sửa "trau chuốt" trùng R-013 → BLK-040. Rút gọn short_name (GR-16) | BLK-033, BLK-040, BLK-041 |
| R-012 | BLOCKER | Câu "phạm vi hệ thống công bố hỗ trợ" trong Acceptance là câu thoát (GR-11) → BLK-014. Chuyển "P4 Safe Refinement" từ Ghi chú sang `source` dưới dạng `DOC-001 P4` (GX-12) | BLK-014 |
| R-013 | BLOCKER | Chuyển "(gọn hơn, rõ hơn, chuyên nghiệp hơn)" ra khỏi Yêu cầu và đưa vào Bối cảnh làm ví dụ về yêu cầu của người dùng (GX-08). Viết theo EARS: "Khi người dùng yêu cầu trau chuốt cả deck…" (GR-01). Acceptance 2 trùng R-031; phần "trau chuốt" trùng R-011 → BLK-040 | BLK-040 |
| R-014 | BLOCKER | Một câu chứa năm hành vi: thêm, xóa, nhân bản, sắp xếp slide và thay hình ảnh (GR-04) → BLK-019. "Các thao tác trên" là cụm thay thế (GX-17). Rút gọn short_name; tên hiện tại thiếu "nhân bản" (GR-16, GX-13) | BLK-019 |
| R-015 | BLOCKER | "lỗi đơn giản" và "editor chuyên nghiệp" là từ mơ hồ (GX-08). Acceptance "danh sách thao tác … được công bố" không có danh sách (GR-11) → BLK-014 | BLK-014 |
| R-016 | BLOCKER | Viết theo mẫu "Nếu lần sửa không như ý hoặc thất bại thì…" (GR-01, GR-03). "bản gần đây còn dùng được" là cụm mơ hồ (GX-08). "trong phạm vi hệ thống hỗ trợ" là câu thoát (GR-11) → BLK-014 | BLK-014 |
| R-017 | VIẾT-LẠI | Viết theo mẫu "Khi người dùng cung cấp hình ảnh…" (GR-01, GR-03). Viết Acceptance ở thể chủ động (GX-16). Bỏ L-001 khỏi `source`, vì vẫn còn `DOC-001 FR17`. Ghi chú bỏ ID L-001 và giữ phần text | — |
| R-018 | BLOCKER | "Tạo" và "tìm" là hai hành vi khác nhau (GR-04) → BLK-019. "khi deck cần" (GX-08) và "các loại hình được công bố" (GR-11) → BLK-014. Bỏ L-002 khỏi `source`, vì vẫn còn `DOC-001 FR18` | BLK-014, BLK-019 |
| R-019 | VIẾT-LẠI | Đưa điều kiện lên đầu câu theo EARS (GR-01, GR-03). Bỏ Ghi chú vì lặp Bối cảnh (GX-12). Viết Acceptance dạng kịch bản (GR-07) | — |
| R-020 | BLOCKER | Câu có hai hành vi nối bằng ";": tạo file từ bản đang xem trước, và thời điểm bản chờ duyệt thành bản đã chấp nhận (GR-04) → BLK-019. Trùng BR-006 và BR-010 mục 3c, 6 → BLK-033. Giữ Ghi chú lịch sử làm lưu ý khi đọc | BLK-019, BLK-033 |
| R-021 | BLOCKER | "mức dùng được", "nghiêm trọng", "rõ ràng", "tối thiểu" là từ mơ hồ (GX-08). Ngưỡng đang chờ W-032 (GX-09, GR-09) → BLK-058, BLK-063. Chuyển Acceptance 2 sang `Đo lường` dưới dạng "Ngưỡng đạt: Chưa chốt" (chỉ chuyển chỗ). Acceptance 1 trùng D-028 Rationale 1 → BLK-041. Text và `source` trích D-028 → BLK-032. Có A-005 → BLK-029 | BLK-058, BLK-041, BLK-063, BLK-032, BLK-029 |
| R-022 | BLOCKER | "hạn chế" là từ mơ hồ (GX-08). "trong các trường hợp kiểm tra được" là câu thoát (GR-11) → BLK-014. Trùng BR-004 → BLK-033; trùng R-023 → BLK-040. Chuyển P4 từ Ghi chú sang `source` (GX-12) | BLK-014, BLK-033, BLK-040 |
| R-023 | BLOCKER | "trong giới hạn hệ thống hỗ trợ" là câu thoát (GR-11) → BLK-014. Trùng BR-004 → BLK-033; trùng R-022 → BLK-040. Rút gọn short_name (GR-16) | BLK-014, BLK-033, BLK-040 |
| R-024 | BLOCKER | Dịch thử ở mục 4. Viết theo EARS (GR-01, GR-03). Thay "trạng thái đã chấp nhận", "baseline", "rollback" bằng thuật ngữ glossary (GX-07). Tách Acceptance 2 thành hai điều (GX-14). Chuyển Ghi chú sang Câu hỏi mở. Thời hạn và xung đột của ràng buộc còn mở → BLK-043. Acceptance 2–4 trùng BR-010 và D-030 → BLK-033, BLK-041. Có A-005 → BLK-029 | BLK-043, BLK-033, BLK-041, BLK-029 |
| R-025 | BLOCKER | "trong giới hạn của từng định dạng" là câu thoát (GR-11) → BLK-002. "của cùng một bản đã chấp nhận" lệch với R-020 → BLK-023. Trùng BR-007 → BLK-033. Chuyển "(P5)" sang `source` dưới dạng `DOC-001 P5` (GX-12). Có D-028 → BLK-032; có A-005 → BLK-029 | BLK-002, BLK-023, BLK-033, BLK-032, BLK-029 |
| R-026 | BLOCKER | "cách dự đoán được" và "trường hợp mất hoặc đổi đã biết" chưa có danh sách (GX-08, GR-11) → BLK-002. Hai hành vi "xử lý" và "báo" (GR-04) → BLK-019. Acceptance 2 cho phép "hoặc hệ thống ghi lại", lệch với Yêu cầu và BR-013 → BLK-024. Trùng BR-013 → BLK-033. Rút gọn short_name (GR-16) | BLK-002, BLK-019, BLK-024, BLK-033 |
| R-027 | BLOCKER | "môi trường đích", "dùng được", "luồng làm việc được V1 kiểm chứng" (GX-08, GR-11). Acceptance 2 ghi "chưa được chốt" (GX-09) → BLK-044. Có A-005 → BLK-029. Area `CI` nằm ngoài enum → BLK-064 | BLK-044, BLK-029, BLK-064 |
| R-028 | BLOCKER | "trong giới hạn của định dạng" và "trong phạm vi đã kiểm chứng" là câu thoát (GR-11) → BLK-002. "bản xem trước đã chấp nhận" lệch với R-020 → BLK-023. Ghi chú bỏ ID W-032 và giữ phần text. Có D-028 → BLK-032; có A-005 → BLK-029 | BLK-002, BLK-023, BLK-032, BLK-029 |
| R-029 | BLOCKER | "deck dùng được" và "kiến thức chỉnh slide chuyên nghiệp" là cụm mơ hồ (GX-08) → BLK-058. Gợi ý `verification: demonstration`. Dựa vào C-001 đã Retired → BLK-025 | BLK-058, BLK-025 |
| R-030 | BLOCKER | Item Active dùng "nên" (GR-02) → BLK-057. Hai hành vi có điều kiện khác nhau (GR-04) → BLK-019. "kéo dài" và "lỗi thường gặp" không có mốc hay danh sách (GX-08) → BLK-001. Có C-007 → BLK-030. Rút gọn short_name (GR-16) | BLK-057, BLK-001, BLK-019, BLK-030 |
| R-031 | BLOCKER | Thay "không qua kiểm tra" bằng "không qua kiểm tra kết quả" (GX-07). Acceptance 1 trùng BR-005 và BR-010 mục 7; Acceptance 2 trùng BR-010 mục 5 → BLK-033. Trùng D-030 → BLK-041. Trùng R-046 Acceptance 2 → BLK-040. Có A-005 → BLK-029 | BLK-033, BLK-040, BLK-041, BLK-029 |
| R-032 | BLOCKER | Ngưỡng quá thời gian và số lần thử lại "chưa được chốt" (GX-09). "trạng thái xác định" chưa có danh sách trạng thái (GX-08) → BLK-001. Acceptance 2 trùng BR-005 → BLK-033. Có C-007 và text trích D-011 → BLK-030; có A-005 → BLK-029; area `Infra` → BLK-064. Rút gọn short_name (GR-16) | BLK-001, BLK-033, BLK-030, BLK-029, BLK-064 |
| R-033 | BLOCKER | Thay "nó" bằng "kết quả đó" (GX-17). Dùng thuật ngữ "kiểm tra kết quả" (GX-07). Cách kiểm tra "chưa quyết định" (GX-09) → BLK-059. Có A-005 → BLK-029. Rút gọn short_name (GR-16) | BLK-059, BLK-029 |
| R-034 | BLOCKER | "các loại sửa cục bộ đã công bố" là câu thoát (GR-11) → BLK-014. Viết Acceptance ở thể chủ động (GX-16) | BLK-014 |
| R-035 | BLOCKER | "tương xứng", "luôn", "chất lượng bắt buộc không giảm" là cụm mơ hồ (GX-08) → BLK-014. Có C-007 → BLK-030; area `Infra` → BLK-064. Rút gọn short_name (GR-16) | BLK-014, BLK-030, BLK-064 |
| R-036 | BLOCKER | Viết lại thành "Với mỗi lượt xử lý AI, DeckAgent nên ghi lại…" (GR-01). Viết Acceptance ở thể chủ động (GX-16). Có C-007 → BLK-030 | BLK-030 |
| R-037 | BLOCKER | "tài nguyên chính", "cách xác định", "dự đoán được" là cụm mơ hồ (GX-08). Giá trị giới hạn chờ benchmark; ở Proposed được ghi "Chưa chốt" → BLK-001. `source` có D-011, có C-007 → BLK-030; area `Infra` → BLK-064 | BLK-001, BLK-030, BLK-064 |
| R-038 | BLOCKER | "sửa rộng" và "chủ yếu" là từ mơ hồ (GX-08) → BLK-014. Bối cảnh bỏ ID L-001. Ghi chú bỏ W-028 và giữ "không phải acceptance của V1". Gợi ý `verification: analysis` | BLK-014 |
| R-039 | BLOCKER | "chủ yếu" là từ mơ hồ (GX-08) → BLK-014. Ghi chú bỏ W-028 và giữ phần text. Gợi ý `verification: analysis` | BLK-014 |
| R-040 | BLOCKER | "hạn chế", "sâu" (GX-08) và "trong phạm vi hỗ trợ" (GR-11) → BLK-014. Ghi chú bỏ W-028. Rút gọn short_name (GR-16) | BLK-014 |
| R-041 | BLOCKER | Type = `Constraint` → BLK-020. Từ "chuyên nghiệp" (GX-08) và câu phủ định (GR-12) để xử lý sau BLK-020. Trùng D-006 và D-015 → BLK-041. Có C-001 → BLK-025; có A-004, UC-005 → BLK-027; UC ghi "Liên quan: R-041" → G-09 (đã rút lại, không phải blocker); area `Schedule` → BLK-064 | BLK-041, BLK-020, BLK-025, BLK-027, BLK-064 |
| R-042 | BLOCKER | "ngoài những gì thiết kế cho phép" là câu thoát (GR-11), và việc gửi nội dung cho nhà cung cấp AI còn chờ xem xét (GX-09) → BLK-060. Ghi chú trỏ W-028 → BLK-063. Câu phủ định được giữ vì là yêu cầu bảo mật (GR-12). Dựa vào UC-018 (Draft) → BLK-028; area `Infra` → BLK-064 | BLK-060, BLK-063, BLK-028, BLK-064 |
| R-043 | BLOCKER | Gần như trùng nguyên văn BR-008 → BLK-033. Acceptance phủ định được giữ vì là bảo mật (GR-12). Rút gọn short_name (GR-16). `Đo lường` theo GR-10 → FILL_LATER | BLK-033 |
| R-044 | VIẾT-LẠI | Viết theo EARS: "Khi người dùng yêu cầu dịch cả deck, DeckAgent nên…" (GR-01). Chuyển Acceptance 2 (điều để chốt sau) sang Câu hỏi mở (GR-07). Bỏ W-026 khỏi `source`, vì vẫn còn D-025 | — |
| R-045 | BLOCKER | Viết Acceptance dạng kịch bản (GR-07). Bỏ Ghi chú quy trình "Duy cập nhật sau" (GX-12). Trùng BR-012 mục 2 → BLK-033. Rút gọn short_name (GR-16) | BLK-033 |
| R-046 | BLOCKER | Thay "baseline" bằng "bản đã chấp nhận làm cơ sở" (GX-07, cùng cách viết với BR-010). Acceptance 2 trùng BR-010 mục 5, Acceptance 3 trùng BR-014 mục 2 → BLK-033. Acceptance 2 trùng R-031 → BLK-040. Trùng D-029 → BLK-041 | BLK-033, BLK-040, BLK-041 |
| R-047 | BLOCKER | Viết Acceptance ở thể chủ động (GX-16). Bỏ L-002 khỏi `source` và bỏ ID khỏi Ghi chú. Acceptance 2 trùng BR-017 → BLK-033 | BLK-033 |
| R-048 | VIẾT-LẠI | Rút gọn short_name (GR-16). Viết Acceptance ở thể chủ động (GX-16). Đổi "tài liệu" thành "tài liệu có sẵn" cho thống nhất với BR-012 (GX-07) | — |
| R-049 | BLOCKER | Acceptance 2 trùng BR-015 → BLK-033. `source` chỉ có "Benchmark 27/09/2026" (GX-11, xem mục 6) | BLK-033 |
| R-050 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template (dịch thử ở mục 4) | — |
| R-051 | BLOCKER | Item Draft: chỉ chuyển vào template. Area `Infra` → BLK-064 | BLK-064 |
| R-052 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template | — |
| R-053 | BLOCKER | Item Draft: chỉ chuyển vào template. Area `Infra` → BLK-064 | BLK-064 |
| R-054 | CẤU-TRÚC | Item Draft: chỉ chuyển vào template | — |

### decisions

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| D-001 | XÓA | Item `project` (A2: phạm vi Sprint 1). Status Superseded nhưng text không nêu Decision thay thế; vì item bị xóa nên không cần `superseded_by` (mục 6) | — |
| D-002 | XÓA | Item `project` (GitHub là nơi lưu code, PR, CI) | — |
| D-003 | XÓA | Item `project` (mọi thay đổi vào main đi qua PR) | — |
| D-004 | XÓA | Item `project` (cách ràng buộc Agent) | — |
| D-005 | XÓA | Item `project` (yêu cầu với tài liệu Architecture). Quan hệ `addresses: R-041` mất theo; quan hệ nằm ở phía D nên R-041 không bị ảnh hưởng | — |
| D-006 | BLOCKER | Decision: thay "editor chỉnh slide chuyên nghiệp" bằng "editor chỉnh slide thay thế PowerPoint, Canva hay Figma", danh sách lấy từ Rationale 1 (GX-08); chuyển phương án "xây bản thay thế PowerPoint, Canva hay Figma" từ Rationale sang `Phương án đã xét` (GD-03); Reopen When còn "không mang lại giá trị", "chuyên nghiệp" (GD-07) | BLK-017, BLK-020, BLK-025 |
| D-007 | VIẾT-LẠI | Decision sang thể chủ động, chủ ngữ DeckAgent (GD-01, GX-16); chuyển phương án "suy vai trò cứng từ đuôi file" từ Rationale 1 sang `Phương án đã xét` (GD-03); Reopen When "đánh đổi đó" → lặp lại danh từ (GX-17) | — |
| D-008 | CẤU-TRÚC | Closed, chỉ chuyển vào template, không đổi nội dung (GX-15); `superseded_by: [D-013]` lấy từ Rationale 2 và Reopen When (GD-09) | — |
| D-009 | BLOCKER | Chuyển Context 2 (đòi mọi file giống hệt về pixel, font… "là không thực tế") sang `Phương án đã xét` (GD-03); Decision giữ ở mức lựa chọn, quy tắc chi tiết thuộc BR-007 qua `shapes` (GD-10); Reopen When "yêu cầu đồ án thay đổi" là dạng "khi có thay đổi" (GD-07) | BLK-017 |
| D-010 | BLOCKER | `unclear` (BLK-031). Nếu giữ: đánh số 3 vế (GX-14); nội dung đã nằm ở C-003, R-025 (GD-10); Reopen When "yêu cầu đồ án thay đổi" (GD-07); chưa có phương án thay thế trong text | BLK-031 |
| D-011 | BLOCKER | `unclear` (BLK-030). Nếu giữ: chuyển "chốt cơ chế quá sớm" từ Rationale sang `Phương án đã xét` (GD-03); GX-04 với C-006 (Retired) nằm trong BLK-030; `addresses: R-041` phụ thuộc BLK-020 | BLK-030, BLK-020 |
| D-012 | VIẾT-LẠI | Chuyển Context 2 ("không cố chứng minh toàn bộ tầm nhìn sản phẩm cùng lúc") sang `Phương án đã xét` (GD-03); "file dùng được" trong Rationale bị Lint báo (GX-08, xem mục 6) | — |
| D-013 | VIẾT-LẠI | Decision bắt đầu bằng phạm vi "V1", thay "capability này" bằng danh từ (GD-01, GX-17); chuyển phương án "V1 gồm nhập và sửa deck có sẵn" (Context 2, Rationale 2) sang `Phương án đã xét` (GD-03) | — |
| D-014 | BLOCKER | Chuyển phương án "sửa cục bộ từng thành phần" (Rationale 2) sang `Phương án đã xét` (GD-03); Reopen When "mất kiểm soát rõ rệt" (GD-07, GX-08) | BLK-017 |
| D-015 | BLOCKER | Chuyển phương án "xây canvas hoặc editor" (Context 2, Rationale 2) sang `Phương án đã xét`, gọi là "editor chỉnh tay trên web" theo chính câu Decision thay cho "chuyên nghiệp" (GD-03, GX-08); GX-04 với C-001 (BLK-025); `addresses: R-041` phụ thuộc BLK-020 | BLK-020, BLK-025 |
| D-016 | VIẾT-LẠI | Closed, chỉ sửa hình thức (GX-15): bỏ ID W-026 ở Rationale 2, giữ ý làm text; `superseded_by: [D-026]` lấy từ Rationale 2 và Reopen When (GD-09) | — |
| D-017 | BLOCKER | Chuyển phương án "P4 là hard acceptance" (Rationale 2) sang `Phương án đã xét` (GD-03); "Critical behavior", "hard acceptance" chưa có trong glossary (GX-07, mục 6); Reopen When "V1 dùng được" (GD-07) | BLK-017 |
| D-018 | XÓA | Item `project` (Hybrid mode, Spike). 5 quan hệ `addresses` mất theo | — |
| D-023 | XÓA | Item `project` (điểm dừng của Sprint 2) | — |
| D-024 | VIẾT-LẠI | Giữ 3 vế (đạt GD-01); vế 1, 2 ở mức lựa chọn, R-003 và BR-009 sở hữu hành vi qua `shapes` (GD-10, mục 7); chuyển các loại tài liệu để sau (Context 2, Rationale 2) sang `Phương án đã xét` (GD-03); Rationale 3 "D-007 vẫn Active" là lưu ý khi đọc → `Ghi chú` (GX-12); W-026, L-001 giữ làm text (mục 5) | — |
| D-025 | BLOCKER | Vế 3 sang thể chủ động (GX-16); Rationale 3 tóm tắt kèm BR-011 (GX-10); chuyển Undo nhiều bước, sửa cục bộ, lịch sử nhiều bản (Context, Rationale 2) và dịch deck, đổi phong cách, hình do AI tạo (Rationale 4) sang `Phương án đã xét` (GD-03); W-026, L-002 giữ làm text; Reopen When "deck dùng được", "phụ thuộc nhiều" (GD-07) | BLK-017 |
| D-026 | VIẾT-LẠI | Vế 2, 3 thêm chủ ngữ và sang thể chủ động (GD-01, GX-16); chuyển phương án "bắt buộc PowerPoint, Google Slides, LibreOffice, Keynote trước khi có file thật" (Rationale 2) sang `Phương án đã xét` (GD-03); W-026 giữ làm text | — |
| D-027 | VIẾT-LẠI | Chuyển host cloud, lưu trữ lâu dài, nhiều người dùng (Context 1, Rationale 3) sang `Phương án đã xét` (GD-03); vế 2 ở mức lựa chọn, BR-012 qua `shapes` (GD-10); W-028 giữ làm text; evidence "Advisor xác nhận" chưa có ID (GD-04 → `source` FILL_LATER) | — |
| D-028 | BLOCKER | `unclear` (BLK-032). Nếu giữ: W-026, W-032 trong Decision và Reopen When (đã nằm trong BLK-032 phương án C); "Chưa chốt ngưỡng" (GX-09); "nghiêm trọng" (GX-08); dòng dài hơn 200 ký tự (GX-14) | BLK-032 |
| D-029 | VIẾT-LẠI | Chuyển Rationale 4 ("Phương án bị loại…") sang `Phương án đã xét` (GD-03); Context 3 (DOC-004, DOC-008 chưa phản ánh) là việc để sau → `Ghi chú` (GX-12); "capability này", "luồng này" → lặp lại danh từ (GX-17) | — |
| D-030 | BLOCKER | Decision 7 câu, 838 ký tự (GD-01), trùng BR-010 mục 3b, 4, 5 (GD-10); Context 2 sang `Phương án đã xét` (GD-03); thay request, user, Cancel, constraint, version, rollback, baseline, pre-flight bằng thuật ngữ glossary (GX-07); đánh số từng dòng Context, Rationale (GX-14); Reopen When "gây khó hiểu" (GD-07) | BLK-034, BLK-017 |

### glossary

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| GL-001 | CẤU-TRÚC | Chuyển nguyên `_term`, `_definition`, `_not_use`. Từ cấm `presentation` đang nằm trong tên riêng "P3 Presentation Quality" ở D-017 (xem BLK-069) | — |
| GL-002 | CẤU-TRÚC | Chuyển nguyên. Câu thứ hai ("Chữ “trang” vẫn dùng cho tài liệu và trang web") là lưu ý phạm vi của cột Không dùng, không phải quy định; giữ vì bỏ đi thì người đọc tưởng "trang" bị cấm | — |
| GL-003 | CẤU-TRÚC | Chuyển nguyên; danh sách định dạng là tóm tắt kèm ID D-024 (GX-10 cho phép). Từ cấm `source` nằm trong tên riêng "P1 Source Fidelity" ở A-015, D-017 (BLK-069) | — |
| GL-004 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-005 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng có điều kiện trong ngoặc "reference (khi nói về deck hoặc slide mẫu)" (GX-07, quy ước cột Không dùng) | BLK-066 |
| GL-006 | VIẾT-LẠI | Đổi "Khác “Requirement” (dòng trong sheet Requirements)" thành "Khác Requirement (item trong `06-requirements/`)": sau migrate sheet không còn là nơi lưu Requirement nên câu cũ trỏ tới chỗ không tồn tại. Chỉ đổi nơi chỉ tới, không đổi nghĩa | — |
| GL-007 | CẤU-TRÚC | Chuyển nguyên. Định nghĩa dùng từ "audience" chưa có trong glossary (xem FILL_LATER) | — |
| GL-008 | VIẾT-LẠI | Đổi "Khác Constraint của project" thành "Khác Constraint (item trong `02-constraints/`)". Phần "còn hiệu lực qua các lần sửa (BR-003)" là tóm tắt kèm ID item sở hữu, giữ (GX-10) | — |
| GL-009 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-010 | CẤU-TRÚC | Chuyển nguyên; "(BR-010)" là ID item sở hữu (GX-10) | — |
| GL-011 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-012 | BLOCKER | Tách mệnh đề quy định thành câu riêng kèm ID: "Ở V1, deck chỉ tồn tại trong một lần làm việc (D-027)" (GX-10). Từ cấm `session` trùng với GL-013 | BLK-042 |
| GL-013 | BLOCKER | Đổi "(chỉ có khi product có account)" thành "(chỉ có khi DeckAgent có tài khoản)", cùng cách viết với ACT-003, UC-010 (GX-07, chỉ dịch từ tiếng Anh). Cột Không dùng có điều kiện và trùng `session` với GL-012 | BLK-042, BLK-066 |
| GL-014 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-015 | CẤU-TRÚC | Chuyển nguyên; "(UC-023, Later)" giữ | — |
| GL-016 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "preview (trong câu văn)" có điều kiện | BLK-066 |
| GL-017 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "export (trong câu văn)" có điều kiện | BLK-066 |
| GL-018 | CẤU-TRÚC | Chuyển nguyên (dịch thử mục 4) | — |
| GL-019 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "style, template (khi nói về giao diện)": có điều kiện, và không rõ điều kiện áp cho `template` hay cả `style` | BLK-066, BLK-067 |
| GL-020 | CẤU-TRÚC | Chuyển nguyên. Từ cấm `brand`, `brand kit` nằm trong tên tính năng "Brand Kit" ở UC-017 (BLK-069) | — |
| GL-021 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "validate, validation (trong câu văn)": có điều kiện, không rõ phạm vi điều kiện | BLK-066, BLK-067 |
| GL-022 | VIẾT-LẠI | Tách phần "(dùng cho sửa theo slide ở V1)" (cách dùng, không phải định nghĩa) thành câu riêng kèm ID item sở hữu (GX-10). Thuật ngữ có dấu phẩy: cột Thuật ngữ không tách theo dấu phẩy (dịch thử mục 4) | — |
| GL-023 | BLOCKER | Chuyển nguyên. Thuật ngữ "Hệ thống" và tên `DeckAgent` (schema.json `system_name`, mẫu câu GR-01) là hai tên của một khái niệm (GX-07) | BLK-068 |
| GL-024 | BLOCKER | Đổi "AI model/provider bên ngoài" thành "model AI của nhà cung cấp bên ngoài" (bỏ dấu `/`, dùng "nhà cung cấp" như ACT-002). Cột Không dùng "LLM, agent (khi nói về phần AI bên trong DeckAgent)": có điều kiện, không rõ phạm vi điều kiện | BLK-066, BLK-067 |
| GL-025 | XÓA | Thuật ngữ vận hành dự án: công cụ AI viết code của thành viên (Claude Code), ví dụ đạt nói về PR. Xóa làm mất xung đột "Agent" là thuật ngữ của GL-025 nhưng là từ cấm (có điều kiện) của GL-024 | — |

## 5. Mẫu dịch thử

Mỗi loại 2 mẫu: một item đơn giản và một item có nhiều chỗ viết lại. Bản dịch đặt `<!-- FILL_LATER -->` ở section mới, `<!-- BLOCKER BLK-xxx -->` ở chỗ chờ quyết định.

### actors

#### ACT-003 (đơn giản)

##### Bản gốc
- ID: ACT-003
- Actor: Quản trị viên tài khoản
- Type: Secondary
- Goal: Quản lý tài khoản và quyền truy cập của người dùng.
- Needs / Pain Points: 1. Tạo, khóa và xóa tài khoản mà không can thiệp vào nội dung deck.
- Knowledge / Context: 1. Hiểu cách tổ chức phân quyền; không cần kiến thức thiết kế deck.
- Permissions / Capabilities: 1. Tạo, khóa, mở khóa và xóa tài khoản.
- Constraints: 1. Chỉ tồn tại khi DeckAgent có tài khoản.
- Notes: 1. Chưa có trong V1 vì V1 không có tài khoản (D-027).
- Related Use Cases: UC-020

##### Bản dịch
```markdown
---
id: ACT-003
name: Quản trị viên tài khoản
kind: human
status: Active
source: []  # FILL_LATER
---

## Goal

Quản lý tài khoản và quyền truy cập của người dùng.

## Needs / Pain Points

1. Tạo, khóa và xóa tài khoản mà không can thiệp vào nội dung deck.

## Knowledge / Context

1. Hiểu cách tổ chức phân quyền.
2. Không cần kiến thức thiết kế deck.

## Permissions / Capabilities

<!-- BLOCKER BLK-021 -->

1. Tạo tài khoản.
2. Khóa tài khoản.
3. Mở khóa tài khoản.
4. Xóa tài khoản.

## Constraints

1. Quản trị viên tài khoản chỉ tồn tại khi DeckAgent có tài khoản.

## Ghi chú

1. Chưa có trong V1 vì V1 không có tài khoản (D-027).
```

##### Thay đổi
1. `Type: Secondary` → `kind: human`; không ghi vai trò secondary ở actor (GACT-02).
2. `status: Active` vì sheet không có status (quyết định của brief).
3. Không ghi Related Use Cases; UC-020 trỏ tới ACT-003 qua `primary_actor` (GACT-07, GACT-06 đạt).
4. Knowledge tách "hiểu cách tổ chức phân quyền" và "không cần kiến thức thiết kế deck" thành 2 dòng (GX-14).
5. Permissions tách thành 4 việc, mỗi việc ứng với một test phân quyền ngược (GACT-04).
6. Constraints thêm chủ ngữ "Quản trị viên tài khoản" (GX-16).
7. Bỏ section `Hành vi lỗi` vì actor là con người (template).
8. Chỗ `BLOCKER BLK-021`: UC-020 bước 1 cho actor "xem danh sách tài khoản", chưa có trong Permissions (GACT-08).

#### ACT-002 (nhiều chỗ viết lại)

##### Bản gốc
- ID: ACT-002
- Actor: AI model hoặc nhà cung cấp AI bên ngoài
- Type: External
- Goal: Nhận yêu cầu từ DeckAgent và trả kết quả tạo hoặc sửa nội dung deck.
- Needs / Pain Points: 1. DeckAgent phải xử lý được khi nhà cung cấp chậm, lỗi, trả kết quả sai định dạng hoặc thay đổi hành vi giữa các phiên bản model. 2. Kết quả của AI không được tự động trở thành bản đã chấp nhận.
- Knowledge / Context: 1. Chỉ biết những gì DeckAgent gửi đi. 2. Nội dung người dùng gửi ra ngoài phải giới hạn trong phạm vi thiết kế cho phép (R-042).
- Permissions / Capabilities: 1. Chỉ trả kết quả; không trực tiếp thay đổi bản đã chấp nhận, vì kết quả phải qua bước kiểm tra (R-033).
- Constraints: 1. Có thể lỗi hoặc quá thời gian (R-032). 2. Thời gian phản hồi và chi phí chưa được đo (D-011). 3. V1 không cần hỗ trợ nhiều nhà cung cấp (R-040).
- Notes: 1. Là nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về.
- Related Use Cases: UC-001, UC-002, UC-003, UC-004, UC-014, UC-016, UC-017, UC-023, UC-024, UC-025

##### Bản dịch
```markdown
---
id: ACT-002
name: AI model hoặc nhà cung cấp AI bên ngoài
kind: external-system
status: Active
source: []  # FILL_LATER
---

## Goal

Nhận dữ liệu DeckAgent gửi trong một lượt xử lý AI và trả kết quả tạo hoặc sửa nội dung deck.

## Needs / Pain Points

<!-- BLOCKER BLK-037 -->

1. Kết quả của AI không được tự động trở thành bản đã chấp nhận.

## Knowledge / Context

1. Chỉ biết dữ liệu DeckAgent gửi đi.
2. Chỉ nhận phần nội dung người dùng mà R-042 cho phép gửi ra ngoài.

## Permissions / Capabilities

<!-- BLOCKER BLK-021 -->

1. Chỉ trả kết quả của lượt xử lý AI cho DeckAgent.
2. Không trực tiếp thay đổi bản đã chấp nhận; kết quả phải qua kiểm tra kết quả trước (R-033).

## Constraints

1. <!-- BLOCKER BLK-030 --> Thời gian phản hồi và chi phí của AI model hoặc nhà cung cấp AI chưa được đo (D-011).
2. V1 không cần hỗ trợ nhiều nhà cung cấp AI (R-040).

## Hành vi lỗi

1. Không trả kết quả trong ngưỡng quá thời gian (R-032). <!-- BLOCKER BLK-001 -->
2. Trả lỗi thay vì kết quả (R-032).
3. Trả kết quả sai định dạng.
4. Thay đổi hành vi giữa các phiên bản model.
```

##### Thay đổi
1. `Type: External` → `kind: external-system` (GACT-02).
2. `status: Active` vì sheet không có status (quyết định của brief).
3. Không ghi Related Use Cases; 10 Use Case trỏ tới ACT-002 qua `supporting_actors` (relations.json, via=derived) (GACT-07, GACT-06 đạt).
4. Goal: "Nhận yêu cầu từ DeckAgent" → "Nhận dữ liệu DeckAgent gửi trong một lượt xử lý AI". Glossary định nghĩa "yêu cầu" là nội dung người dùng gõ trong chat (GL-006), nên dùng cho dữ liệu DeckAgent gửi AI là sai nghĩa; "lượt xử lý AI" theo GL-009 (GX-07).
5. Needs 1 chuyển sang `Hành vi lỗi`, tách thành 4 cách hỏng: chậm, lỗi, sai định dạng, thay đổi hành vi (GACT-05, quyết định 5). Bỏ vế "DeckAgent phải xử lý được": nghĩa này đã nằm trong định nghĩa của section `Hành vi lỗi` ("các cách actor có thể hỏng mà hệ thống phải xử lý") và do R-032 sở hữu (GX-10).
6. Constraints 1 "Có thể lỗi hoặc quá thời gian (R-032)" chuyển sang `Hành vi lỗi` 1 và 2, gộp với "chậm" và "lỗi" của Needs 1 để không lặp (GACT-05). Gộp "chậm" vào "quá thời gian" chưa được chốt: `BLOCKER BLK-001`.
7. Needs 2 giữ nguyên văn, chờ `BLOCKER BLK-037` (mâu thuẫn BR-010 Rule 1).
8. Knowledge 1: "những gì" → "dữ liệu" (GX-17, tránh đại từ mơ hồ).
9. Knowledge 2 viết thành tóm tắt kèm ID của chủ sở hữu, chủ ngữ là actor; bỏ cụm "phạm vi thiết kế cho phép" vì R-042 định nghĩa phạm vi đó (GX-10, GX-16, GX-08).
10. Permissions tách 1 ý ghép thành 2 dòng; "bước kiểm tra" → "kiểm tra kết quả" theo GL-021 (GACT-04, GX-07, GX-14).
11. Constraints 2: chủ ngữ ghi rõ tên actor (GX-16); giữ D-011 và gắn `BLOCKER BLK-030`, vì BLK-030 quyết định D-011 có còn trong spec sản phẩm không.
12. Constraints 3: "nhà cung cấp" → "nhà cung cấp AI" để đọc riêng câu vẫn hiểu (GX-17).
13. Bỏ `Ghi chú`: câu "nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về" tóm tắt lại `Hành vi lỗi` và liệt kê nhóm Use Case, mà danh sách Use Case do công cụ sinh (GX-12, GACT-07). Xem mục 6 về chữ "tải về".

### constraints

#### C-005 (đơn giản)

##### Bản gốc
- ID: C-005 · Status: Retired · Type: Product
- Constraint: "Vai trò của file không được gán cứng theo loại file; cùng một file có thể là tài liệu có sẵn, deck cần sửa, deck mẫu, hình ảnh để chèn hoặc vai trò khác tùy mục đích sử dụng."
- Reason / Context: "1. Nếu gắn cứng PDF là tài liệu có sẵn, PPTX là deck cần sửa, ảnh là hình để chèn, nhiều luồng hợp lệ bị khóa ngay từ Architecture.\n2. Ví dụ một PPTX có thể vừa là tài liệu có sẵn, vừa là deck mẫu, hoặc là deck cần sửa tiếp."
- Impacts: "Mô hình input, luồng đọc file, cách biểu diễn metadata, ranh giới Architecture"
- Review Trigger: "Review nếu phạm vi sản phẩm cố ý thu hẹp tới mức mỗi loại file chỉ còn một vai trò."
- Ghi chú: "1. Vừa giới hạn thiết kế vừa bảo vệ một nhận định cốt lõi của DOC-001: loại file không quyết định vai trò của file."
- Căn cứ: "DOC-001 Product Context, DOC-001 AD1"
- Related Requirements: "R-003, R-004, R-005, R-010, R-017" · Related Decisions: trống

##### Bản dịch
```markdown
---
id: C-005
short_name: "Vai trò file không theo loại file"
type: Product
status: Retired
imposed_by: ""            # Closed: không bắt buộc
source: ["DOC-001 Product Context", "DOC-001 AD1"]
---

## Constraint

Vai trò của file không được gán cứng theo loại file; cùng một file có thể là tài liệu có sẵn, deck cần sửa, deck mẫu, hình ảnh để chèn hoặc vai trò khác tùy mục đích sử dụng.

## Lý do không đổi được

1. Nếu gắn cứng PDF là tài liệu có sẵn, PPTX là deck cần sửa, ảnh là hình để chèn, nhiều luồng hợp lệ bị khóa ngay từ Architecture.
2. Ví dụ một PPTX có thể vừa là tài liệu có sẵn, vừa là deck mẫu, hoặc là deck cần sửa tiếp.

## Cách kiểm tuân thủ

<!-- FILL_LATER -->

## Review Trigger

Review nếu phạm vi sản phẩm cố ý thu hẹp tới mức mỗi loại file chỉ còn một vai trò.

## Ghi chú

1. Vừa giới hạn thiết kế vừa bảo vệ một nhận định cốt lõi của DOC-001: loại file không quyết định vai trò của file.
```

##### Thay đổi
1. Đặt `short_name` mới từ câu Constraint (GX-13; quyết định 5).
2. Reason / Context → `Lý do không đổi được`, giữ nguyên văn (GX-15).
3. Căn cứ → `source` dạng danh sách mã nguồn (GX-11).
4. `imposed_by` và `Cách kiểm tuân thủ` để trống: field/section mới, không bắt buộc ở Closed (schema.json; quyết định 3).
5. Impacts bỏ (bảng ánh xạ). Related Requirements không ghi ở C-005: đã lật thành `constraints` của R-003, R-004, R-005, R-010, R-017 (GX-05).
6. Không sửa câu chữ: item Closed chỉ được sửa hình thức (GX-15). Quan hệ R-003, R-004 → C-005 thuộc BLK-026.

#### C-003 (nhiều chỗ viết lại)

##### Bản gốc
- ID: C-003 · Status: Active · Type: Academic
- Constraint: "Project phải hỗ trợ tải deck về nhiều định dạng theo yêu cầu của đồ án; đây là constraint của project, không phải vấn đề người dùng đã được chứng minh."
- Reason / Context: "1. Team không được chọn chỉ một định dạng nếu đồ án bắt buộc nhiều định dạng.\n2. V1 đầu tiên dùng PPTX và PDF.\n3. Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định."
- Impacts: "Architecture phần tải về, Testing, cách biểu diễn deck, lập kế hoạch phạm vi"
- Review Trigger: "Review khi môn học hoặc advisor làm rõ số lượng hay loại định dạng bắt buộc, hoặc evidence implementation cho thấy cần đổi ranh giới định dạng."
- Ghi chú: "1. D-026 không biến mọi định dạng ứng viên thành hard acceptance của V1 đầu tiên."
- Căn cứ: "DOC-001 Multi-format Note, DOC-001 FR20"
- Related Requirements: "R-020, R-025, R-026, R-027, R-028, R-039" · Related Decisions: "D-026"

##### Bản dịch
```markdown
---
id: C-003
short_name: "Nhiều định dạng tải về theo đồ án"
type: Academic
status: Active            # BLOCKER BLK-004 (giữ Active hay hạ Proposed)
imposed_by: "yêu cầu của đồ án"
source: ["DOC-001 Multi-format Note", "DOC-001 FR20"]
---

## Constraint

DeckAgent phải cho phép người dùng tải deck về nhiều định dạng <!-- BLOCKER BLK-004 --> theo yêu cầu của đồ án.

## Lý do không đổi được

1. Team không được chọn chỉ một định dạng nếu đồ án bắt buộc nhiều định dạng. <!-- BLOCKER BLK-004 -->
2. V1 đầu tiên dùng PPTX và PDF. <!-- BLOCKER BLK-038 -->
3. Advisor khuyến khích thêm định dạng khi khả thi nhưng chưa xác nhận số lượng cố định. <!-- BLOCKER BLK-004 -->

## Cách kiểm tuân thủ

<!-- FILL_LATER -->

## Review Trigger

Môn học hoặc advisor làm rõ số lượng hay loại định dạng bắt buộc, hoặc evidence implementation cho thấy cần đổi ranh giới định dạng.

## Ghi chú

1. C-003 là giới hạn của project, không phải vấn đề người dùng đã được chứng minh.
2. D-026 không biến mọi định dạng ứng viên thành điều kiện nghiệm thu bắt buộc của V1 đầu tiên.
```

##### Thay đổi
1. Đặt `short_name` mới từ câu Constraint (GX-13; quyết định 5).
2. `imposed_by` = "yêu cầu của đồ án", chuyển từ cột Constraint ("theo yêu cầu của đồ án"), không thêm thông tin (GC-01; quyết định 3, ngoại lệ chuyển chỗ).
3. Câu Constraint: chủ ngữ "Project" → "DeckAgent", "hỗ trợ tải deck về" → "cho phép người dùng tải deck về"; giới hạn đặt lên sản phẩm, đúng mẫu "<Đối tượng> phải…" (GC-02, GX-16).
4. Vế "đây là constraint của project, không phải vấn đề người dùng đã được chứng minh" tách khỏi Constraint, chuyển sang Ghi chú 1 vì là lưu ý khi đọc, không phải giới hạn (GC-02, GX-12); "đây" thay bằng "C-003" (GX-17).
5. "nhiều định dạng" chưa có ranh giới, và Lý do 1, 3 cho thấy đồ án chưa xác nhận là bắt buộc: giữ nguyên chữ, đánh dấu BLK-004 (GC-08, GX-09, GC-01).
6. Lý do 2 chép lại quyết định của D-026: giữ tại chỗ, đánh dấu BLK-038 (GX-10, GC-03).
7. Lý do 3 giữ "khi khả thi" vì là lời advisor được thuật lại; bỏ đi là đổi nghĩa (GX-08 chấp nhận khi Review).
8. Review Trigger bỏ tiền tố "Review khi", viết thành sự kiện quan sát được (GC-06).
9. Ghi chú gốc: "hard acceptance" → "điều kiện nghiệm thu bắt buộc" (GX-07); "mọi" giữ vì đúng nghĩa câu gốc (GX-08 chỉ cảnh báo).
10. Căn cứ → `source` dạng danh sách mã nguồn (GX-11). Impacts bỏ. Related Requirements và Related Decisions không ghi ở C-003: đã lật thành `constraints` của R-020, R-025, R-026, R-027, R-028, R-039 và D-026 (GX-05).
11. `Cách kiểm tuân thủ` để trống (quyết định 3), xem gợi ý ở mục 3. Section này bắt buộc từ Active nhưng không tính vào GX-09 (quyết định 6).

### assumptions

Không có item product nào thuộc nhóm `CẤU-TRÚC` (mục 6, ý 1). A-023 là item ít thay đổi nhất, nên dùng làm bản dịch đơn giản.

#### A-023 (đơn giản)
##### Bản gốc
- ID: A-023
- Status: Open
- Assumption: "Hai định dạng, một sửa được và một chỉ xem, cho phép V1 chứng minh việc tải về từ đầu tới cuối và P5 Output Fidelity, dù tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng hơn."
- Impacts: "Phạm vi, tải về, Testing, Architecture"
- Review Trigger: "Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng ngay trong V1, hoặc PPTX và PDF không kiểm chứng được hành vi tải về cần có."
- Ghi chú: "1. D-026 đã chốt V1 đầu tiên dùng PPTX (sửa được) và PDF (chỉ xem); hỗ trợ thêm định dạng là hướng mở rộng."
- Căn cứ: "D-026"
- Used By (IDs): "R-020, R-025, R-026, R-027, R-028, D-016, D-026"
- Related Work (IDs): "W-001, W-003, W-026"

##### Bản dịch
```markdown
---
id: A-023
short_name: Hai định dạng tải về của V1
status: Open
source: [D-026]
---

## Assumption

Hai định dạng tải về PPTX (sửa được) và PDF (chỉ xem) cho phép V1 chứng minh việc tải về từ đầu tới cuối và P5 Output Fidelity.

## Signpost

1. Yêu cầu đồ án hoặc advisor bắt buộc thêm định dạng tải về trong V1.
2. Có hành vi tải về mà V1 cần có nhưng không kiểm chứng được bằng PPTX và PDF.

## Cách kiểm chứng

<!-- FILL_LATER -->

## Nếu sai

<!-- FILL_LATER -->

## Ghi chú

1. Tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng tải về hơn; V1 đầu tiên chỉ dùng PPTX và PDF theo D-026.
```

Quan hệ không ghi trong file A-023 (GX-05): R-020, R-025, R-026, R-027, R-028, D-016, D-026 mang `assumptions: [A-023]` ở file của mình.

##### Thay đổi
1. `short_name` đặt mới từ câu Assumption (GA-08).
2. "Hai định dạng, một sửa được và một chỉ xem" → nêu tên PPTX và PDF; tên lấy từ Review Trigger và Ghi chú của chính item, không thêm thông tin (GX-08, GX-17).
3. Vế "dù tầm nhìn sản phẩm có thể hỗ trợ nhiều định dạng hơn" chuyển từ `Assumption` sang `Ghi chú`, vì là giới hạn phạm vi, không phải điều được khẳng định (GA-01, GX-12).
4. Review Trigger → `Signpost`, tách thành danh sách 2 sự kiện (GA-04, GX-14); bỏ "ngay" (GX-08).
5. Ghi chú: câu phát biểu lại D-026 viết thành tóm tắt kèm ID sở hữu, gộp với vế ở thay đổi 3 (GX-10, GX-12).
6. `Căn cứ` → `source: [D-026]` (GX-11).
7. Impacts và Related Work (IDs) bỏ; Used By (IDs) lật sang `assumptions` của 7 item dựa vào (GX-05).
8. `Cách kiểm chứng`, `Nếu sai`: section mới, để `FILL_LATER` (quyết định 3; gợi ý ở mục 3).
9. Giữ một item dù câu nêu hai điều được chứng minh (tải về từ đầu tới cuối, P5 Output Fidelity), vì cả hai được kiểm bằng cùng bộ test tải về V1 trên PPTX và PDF (GA-02; mục 6, ý 7).

#### A-013 (nhiều chỗ viết lại)
##### Bản gốc
- ID: A-013
- Status: Open
- Assumption: "Ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) cần được giữ qua nhiều lần sửa; nếu bị quên, trải nghiệm giảm rõ rệt."
- Impacts: "Mô hình trạng thái, quản lý context, hành vi khi sửa deck, Testing"
- Review Trigger: "Testing cho thấy không phải ràng buộc nào cũng cần giữ, hoặc giữ tất cả gây xung đột; khi đó cần xác định thời hạn theo từng loại ràng buộc."
- Ghi chú: "1. D-025 xác nhận ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck. 2. Câu hỏi OQ-04 về thời hạn và cách xử lý xung đột vẫn cố ý để mở vì chưa chặn Architecture."
- Căn cứ: "D-025"
- Used By (IDs): "R-001, R-009, R-024, D-017, D-025"
- Related Work (IDs): "W-001, W-003, W-026"

##### Bản dịch
```markdown
---
id: A-013
short_name: Quên ý định và ràng buộc làm giảm trải nghiệm
status: Open   # BLOCKER BLK-046
source: [D-025]
---

## Assumption

Nếu DeckAgent không giữ ý định và ràng buộc của người dùng (audience, ngôn ngữ, độ dài, mục đích) qua các lần sửa, trải nghiệm của người dùng giảm <!-- BLOCKER BLK-009: đại lượng và mức giảm thay cho "rõ rệt" -->.

<!-- BLOCKER BLK-039: vế gốc "cần được giữ qua nhiều lần sửa" là quy định của BR-003; chờ quyết định bỏ hay giữ -->

## Signpost

1. Kết quả test cho thấy có loại ràng buộc của người dùng không cần giữ qua các lần sửa.
2. Kết quả test cho thấy giữ mọi ràng buộc của người dùng qua các lần sửa gây xung đột giữa các ràng buộc.

## Cách kiểm chứng

<!-- FILL_LATER -->

## Nếu sai

1. Xác định thời hạn áp dụng theo từng loại ràng buộc của người dùng.

## Ghi chú

1. <!-- BLOCKER BLK-039: Ghi chú gốc 1 "D-025 xác nhận ràng buộc còn hiệu lực tiếp tục áp dụng khi sửa cả deck" phát biểu lại quy định của BR-003 -->
2. Thời hạn áp dụng và cách xử lý xung đột giữa các ràng buộc của người dùng cố ý để mở ở câu hỏi OQ-04, vì câu hỏi này chưa chặn Architecture.
```

Quan hệ không ghi trong file A-013 (GX-05): R-001, R-009, R-024, D-017, D-025 (lật từ Used By) và D-030 (đã có ở Assumption chính của D-030) mang `assumptions: [A-013]`.

##### Thay đổi
1. `short_name` đặt mới từ câu Assumption (GA-08).
2. Câu Assumption viết thành một giả thuyết "nếu… thì" kiểm bằng một phép quan sát (GA-01, GA-02). Vế "nếu bị quên" ở thể bị động đổi sang chủ ngữ DeckAgent, thể chủ động (GX-16). "nhiều lần sửa" → "các lần sửa".
3. "trải nghiệm giảm rõ rệt": "rõ rệt" chưa có đại lượng → marker BLK-009 (GA-01, GX-08). Không tự đặt con số.
4. Vế "cần được giữ qua nhiều lần sửa" là quy định do BR-003 sở hữu (R-024 cùng nội dung) → marker BLK-039, không tự bỏ (GX-10).
5. Review Trigger → `Signpost`, tách thành 2 tín hiệu (GA-04, GX-14). "Testing cho thấy" → "Kết quả test cho thấy"; "không phải ràng buộc nào cũng cần giữ" → "có loại ràng buộc… không cần giữ" (cùng nghĩa). "tất cả" → "mọi": Lint GX-08 sẽ cảnh báo, nhưng tín hiệu đúng là "giữ toàn bộ", nên giữ có chủ ý.
6. Vế "khi đó cần xác định thời hạn theo từng loại ràng buộc" là việc team sẽ làm khi assumption sai → chuyển từ Review Trigger sang `Nếu sai` (GA-06; áp tương tự quyết định 5).
7. Ghi chú 1 phát biểu lại quy định của BR-003 → marker BLK-039 (GX-10, GX-12).
8. Ghi chú 2 giữ ý; viết đầy đủ "ràng buộc của người dùng" (GX-07). OQ-04 giữ làm text (không thuộc tiền tố loại cũ; mục 6).
9. `Căn cứ` → `source: [D-025]` (GX-11).
10. Impacts và Related Work (IDs) bỏ; Used By (IDs) lật sang `assumptions` của 5 item (GX-05).
11. `status: Open` giữ, kèm marker BLK-046 (GX-09).
12. `Cách kiểm chứng`: section mới, để `FILL_LATER` (quyết định 3).

### use-cases

#### UC-020 (đơn giản)

##### Bản gốc
- ID: UC-020
- Use Case: Quản trị viên tạo, khóa và xóa tài khoản người dùng
- Release Scope: Later
- Status: Draft
- Tình huống: Một thành viên đã rời dự án. Là quản trị viên, tôi muốn khóa tài khoản của bạn ấy ngay.
- Primary Actor: ACT-003
- Goal / Outcome: Quản trị viên kiểm soát ai được dùng DeckAgent.
- Trigger: Quản trị viên mở trang quản lý tài khoản.
- Preconditions: 1. Quản trị viên đã đăng nhập bằng tài khoản có quyền quản trị.
- Main Flow: 1. Quản trị viên xem danh sách tài khoản. 2. Quản trị viên tạo, khóa, mở khóa hoặc xóa tài khoản. 3. Hệ thống lưu thay đổi.
- Alternative / Failure Flows: 2A. Xóa tài khoản còn deck: Hệ thống báo các deck sẽ bị xóa theo và yêu cầu xác nhận.
- Postconditions: 1. Thay đổi có hiệu lực ngay; tài khoản bị khóa không đăng nhập được.
- Open Questions: 1. Quản trị tài khoản làm trong DeckAgent hay qua hệ thống bên ngoài? 2. Khi khóa tài khoản, deck của người đó được giữ hay xóa?
- Ghi chú: 1. Chỉ cần khi DeckAgent có tài khoản.
- Căn cứ: D-027, R-054
- Product Reference: 1. Presenton: quản trị viên tạo, đặt lại, xóa tài khoản. 2. Claude Design: quản trị viên bật hoặc tắt tính năng cho tổ chức Enterprise.
- Quan hệ UC: 1. Liên quan: UC-009
- Related Requirements: R-054

##### Bản dịch
```markdown
---
id: UC-020
title: "Quản trị viên tạo, khóa và xóa tài khoản người dùng"
status: Draft
scope: Later
level: user-goal
source: [D-027, R-054]
primary_actor: ACT-003
supporting_actors: []
constraints: []
include: []
extend: []
follows: []
split_from: []
related: []               # UC-009 ↔ UC-020 ghi một phía ở UC-009 (GX-05)
superseded_by: []
---

## Tình huống

Một thành viên đã rời dự án. Là quản trị viên, tôi muốn khóa tài khoản của bạn ấy ngay.

## Mục tiêu

Quản trị viên kiểm soát ai được dùng DeckAgent.

## Trigger

Quản trị viên mở trang quản lý tài khoản.

## Preconditions

1. Quản trị viên đã đăng nhập bằng tài khoản có quyền quản trị.

## Main Flow

1. Quản trị viên xem danh sách tài khoản.
2. Quản trị viên tạo, khóa, mở khóa hoặc xóa tài khoản.
3. Hệ thống lưu thay đổi.

## Alternative / Failure Flows

2A. Xóa tài khoản còn deck: Hệ thống báo các deck sẽ bị xóa theo và yêu cầu xác nhận.

## Postconditions

1. Thay đổi có hiệu lực ngay; tài khoản bị khóa không đăng nhập được.

## Bảo đảm tối thiểu

<!-- FILL_LATER -->

## Câu hỏi mở

1. Quản trị tài khoản làm trong DeckAgent hay qua hệ thống bên ngoài?
2. Khi khóa tài khoản, deck của người đó được giữ hay xóa?

## Sản phẩm tham khảo

1. Presenton: quản trị viên tạo, đặt lại, xóa tài khoản.
2. Claude Design: quản trị viên bật hoặc tắt tính năng cho tổ chức Enterprise.

## Ghi chú

1. Chỉ cần khi DeckAgent có tài khoản.
```

##### Thay đổi
1. Cột sheet chuyển vào frontmatter và section theo bảng ánh xạ; tên section theo template (`Goal / Outcome` → `Mục tiêu`, `Open Questions` → `Câu hỏi mở`, `Product Reference` → `Sản phẩm tham khảo`) (GX-06).
2. `level: user-goal`: UC-020 không được include bởi Use Case nào (`uc_levels`) (GUC-03).
3. `supporting_actors: []`: relations.json không có quan hệ derived cho UC-020 (GUC-02).
4. `related: []`: UC-009 và UC-020 cùng ghi "Liên quan" tới nhau; quan hệ chỉ ghi một lần, ở UC-009 (GX-05, mục 6 ghi chú 3). Related Requirements R-054 không ghi ở UC, đã lật thành `R-054.use_cases` (GX-05).
5. Thêm section `Bảo đảm tối thiểu` để trống (GUC-14, quyết định 3).
6. Không viết lại câu: item Draft chỉ qua gate cấu trúc. "ngay" ở Tình huống và Postconditions, Tình huống chưa theo mẫu, nhánh 2A chưa có điểm kết thúc, câu hỏi mở chưa có nơi xử lý: sửa khi lên Proposed hoặc Active (GX-08, GUC-04, GUC-10, GUC-18 đều áp từ Proposed hoặc Active).

#### UC-008 (nhiều chỗ viết lại)

##### Bản gốc
- ID: UC-008
- Use Case: Tải deck về máy dạng PPTX hoặc PDF
- Release Scope: V1
- Status: Active
- Tình huống: Deck đã ổn và chiều nay tôi phải trình bày trên máy phòng họp. Tôi muốn tải file PPTX để chỉnh thêm vài chỗ trong PowerPoint, và một bản PDF để gửi trước cho sếp.
- Primary Actor: ACT-001
- Goal / Outcome: Người dùng có file PPTX hoặc PDF đúng với deck đã xem trước, dùng được ngoài DeckAgent.
- Trigger: Người dùng chọn tải về và chọn định dạng.
- Preconditions: 1. Lần làm việc có deck ở bản đã chấp nhận hoặc có bản chờ duyệt.
- Main Flow: 1. Người dùng xem trước deck (UC-015). 2. Người dùng chọn tải về và chọn PPTX hoặc PDF. 3. Hệ thống kiểm tra các thành phần không giữ được trong định dạng đã chọn. 4. Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung. 5. Hệ thống kiểm tra file mở được. 6. Người dùng nhận file. 7. Nếu file được tạo từ bản chờ duyệt, bản đó trở thành bản đã chấp nhận (BR-010).
- Alternative / Failure Flows: 1A. Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa (UC-004), kết thúc UC. 3A. Định dạng không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi; người dùng chọn tiếp tục hoặc hủy. Nếu hủy, bản chờ duyệt vẫn là bản chờ duyệt, kết thúc UC. 4A. Tạo file thất bại hoặc file không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc UC.
- Postconditions: 1. File được tạo từ đúng bản người dùng đã xem trước. 2. Bản chờ duyệt (nếu có) chỉ trở thành bản đã chấp nhận khi tải về thành công. 3. File PPTX và PDF giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (P5). 4. Chữ, hình khối và bảng trong PPTX sửa được trong PowerPoint. 5. File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc.
- Open Questions: 1. Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice?
- Ghi chú: 1. V1 chỉ có hai định dạng PPTX và PDF. 2. Chỉnh tay chuyên sâu làm trong PowerPoint sau khi tải về, nên PPTX phải sửa được.
- Căn cứ: D-015, D-026, D-027, DOC-001 FR19, DOC-001 FR20, DOC-001 NFR-O01, DOC-001 NFR-O02, DOC-001 NFR-O03, DOC-001 NFR-O04
- Product Reference: 1. Claude Design: tải về PDF, URL, PPTX, HTML; gửi sang Canva. 2. Gamma: tải về PDF, PPTX, PNG, Google Slides; báo giới hạn bố cục khi tải PPTX. 3. Presenton: tải về PPTX, PDF, PNG. 4. OpenSlide: tải về PDF và PPTX.
- Quan hệ UC: 1. Include: UC-014, UC-015 2. Trước đó: UC-001, UC-002, UC-003, UC-004, UC-012, UC-021 3. Tiếp theo: UC-011 4. Liên quan: UC-005 (sửa chuyên sâu làm trong PowerPoint sau khi tải về PPTX, R-041)
- Related Requirements: R-019, R-020, R-025, R-026, R-027, R-028, R-041
- Related Business Rules: BR-005, BR-006, BR-007, BR-010, BR-013
- Related Constraints: C-002, C-003, C-004
- Related Work: W-026, W-027

##### Bản dịch
```markdown
---
id: UC-008
title: "Người dùng tải deck về máy dạng PPTX hoặc PDF"
status: Active
scope: V1
level: user-goal
source: [D-015, D-026, D-027, "DOC-001 FR19", "DOC-001 FR20", "DOC-001 NFR-O01", "DOC-001 NFR-O02", "DOC-001 NFR-O03", "DOC-001 NFR-O04"]
primary_actor: ACT-001
supporting_actors: []
constraints: [C-002, C-003, C-004]
include: [UC-014, UC-015]
extend: []
follows: [UC-001, UC-002, UC-003, UC-004, UC-012, UC-021]
split_from: []
related: []               # UC-005 ↔ UC-008 ghi một phía ở UC-005 (GX-05); xem G-09 (đã rút lại, không phải blocker)
superseded_by: []
---

## Tình huống

Tôi có deck đã ổn cho buổi trình bày chiều nay trên máy phòng họp, tôi muốn tải về một file PPTX và một bản PDF, để chỉnh thêm vài chỗ trong PowerPoint và gửi trước bản PDF cho sếp.

## Mục tiêu

Người dùng có file PPTX hoặc PDF đúng với deck đã xem trước, để dùng ngoài DeckAgent.

## Trigger

Người dùng chọn tải về và chọn định dạng. <!-- BLOCKER BLK-051 -->

## Preconditions

1. Lần làm việc có deck ở bản đã chấp nhận hoặc có bản chờ duyệt.

## Main Flow

1. Người dùng xem trước deck (UC-015). <!-- BLOCKER BLK-051 -->
2. Người dùng chọn tải về và chọn PPTX hoặc PDF.
3. Hệ thống kiểm tra các thành phần không giữ được trong định dạng đã chọn.
4. Hệ thống tạo file từ đúng bản đang xem trước, không để AI tạo lại nội dung (BR-006).
5. Hệ thống kiểm tra file mở được. <!-- BLOCKER BLK-044 -->
6. Người dùng nhận file.

## Alternative / Failure Flows

1A. Người dùng chưa vừa ý deck: Người dùng gửi yêu cầu sửa, chuyển sang UC-004. <!-- BLOCKER BLK-051 -->
3A. Định dạng đã chọn không giữ được một phần deck: Hệ thống liệt kê phần sẽ bị mất hoặc thay đổi (BR-013) và người dùng chọn tiếp tục, tiếp tục bước 4.
3B. Người dùng chọn hủy sau danh sách của 3A: Bản chờ duyệt vẫn là bản chờ duyệt (BR-010 điều 6), kết thúc Use Case.
4A. Hệ thống tạo file thất bại: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case.
5A. File vừa tạo không mở được: Hệ thống báo lỗi, không giao file hỏng; bản đã chấp nhận và bản chờ duyệt giữ nguyên, kết thúc Use Case. <!-- BLOCKER BLK-044 -->
6A. File được tạo từ bản chờ duyệt: Hệ thống chuyển bản chờ duyệt thành bản đã chấp nhận (BR-010 điều 3c), kết thúc Use Case.
<!-- BLOCKER BLK-048 -->

## Postconditions

1. File được tạo từ đúng bản người dùng đã xem trước (BR-006).
2. Bản người dùng đã tải về là bản đã chấp nhận (BR-010 điều 3c).
3. File PPTX và file PDF giữ facts, số liệu, thứ tự trình bày và ý nghĩa của deck (BR-007).
4. Chữ, hình khối và bảng trong file PPTX sửa được trong PowerPoint. <!-- BLOCKER BLK-044 -->

## Bảo đảm tối thiểu

1. Bản chờ duyệt chỉ trở thành bản đã chấp nhận khi tải về thành công; lượt tải về bị hủy hoặc thất bại không làm thay đổi bản đã chấp nhận và bản chờ duyệt (BR-010 điều 6).
<!-- FILL_LATER -->

## Câu hỏi mở

1. Ứng dụng nào dùng để kiểm chứng PPTX đầu tiên: PowerPoint, Google Slides hay LibreOffice? <!-- BLOCKER BLK-044 -->

## Sản phẩm tham khảo

1. Claude Design: tải về PDF, URL, PPTX, HTML; gửi sang Canva.
2. Gamma: tải về PDF, PPTX, PNG, Google Slides; báo giới hạn bố cục khi tải PPTX.
3. Presenton: tải về PPTX, PDF, PNG.
4. OpenSlide: tải về PDF và PPTX.

## Ghi chú

1. V1 chỉ có hai định dạng tải về: PPTX và PDF.
2. Chỉnh tay chuyên sâu làm trong PowerPoint sau khi tải về, nên file PPTX phải sửa được.
3. File tải về là cách duy nhất giữ deck sau khi lần làm việc kết thúc (BR-012).
```

##### Thay đổi
1. Tiêu đề thêm chủ ngữ "Người dùng" theo công thức [Ai] + [làm gì] + [với cái gì] (GUC-01).
2. Tình huống gộp hai câu theo mẫu "Tôi có…, tôi muốn…, để…", giữ đủ chi tiết (chiều nay, máy phòng họp, PPTX để chỉnh, PDF gửi sếp) (GUC-04).
3. Mục tiêu: "dùng được ngoài DeckAgent" → "để dùng ngoài DeckAgent" (GX-08 "dùng được"; cách nói theo GL-017).
4. Bước 4 thêm tham chiếu BR-006, vì quy tắc "tải về đúng bản đang xem trước" do BR-006 sở hữu (GUC-15, GX-10).
5. Bước 7 "Nếu file được tạo từ bản chờ duyệt…" chuyển thành nhánh 6A với điều kiện phát hiện được; Main Flow còn 6 bước, không còn "nếu" (GUC-08). Tham chiếu cụ thể BR-010 điều 3c.
6. 1A: chủ ngữ và "kết thúc UC" chuẩn hóa thành "chuyển sang UC-004" (GUC-10). Điều kiện "chưa vừa ý" chưa phát hiện được: chờ BLK-051 (GUC-11).
7. 3A tách thành 3A (tiếp tục, quay lại luồng chính tại bước 4) và 3B (hủy, kết thúc), mỗi dòng một điểm kết thúc; bỏ "Nếu" (GUC-10). 3A tham chiếu BR-013; 3B tham chiếu BR-010 điều 6 (GUC-15).
8. 4A "Tạo file thất bại hoặc file không mở được" tách thành 4A (bước 4) và 5A (bước 5), vì là hai điều kiện ở hai bước khác nhau, mỗi điều kiện cần một cách giả lập riêng trong test (GUC-11). Hành động giữ nguyên văn.
9. "kết thúc UC" → "kết thúc Use Case" (GUC-10).
10. Postconditions 1 thêm tham chiếu BR-006 (GUC-15).
11. Postconditions 2 "Bản chờ duyệt (nếu có) chỉ trở thành bản đã chấp nhận khi tải về thành công" tách hai vế: vế đúng khi thành công giữ ở Postconditions 2 ("Bản người dùng đã tải về là bản đã chấp nhận"); vế "chỉ khi thành công" là điều đúng khi thất bại, chuyển sang `Bảo đảm tối thiểu` 1 (GUC-13, GUC-14, quyết định 3 ngoại lệ: nội dung đã có trong sheet). Bỏ "(nếu có)".
12. Postconditions 3: "(P5)" là mã nguyên tắc trong DOC-001; thay bằng BR-007, item sở hữu quy tắc nhất quán giữa định dạng (căn cứ của BR-007 là DOC-001 Output Fidelity, tức P5) (GX-10).
13. Postconditions 5 "File tải về là cách duy nhất giữ deck…" không phải điều kiểm chứng được khi Use Case kết thúc, mà là hệ quả của BR-012 → chuyển sang Ghi chú 3, kèm BR-012 (GUC-13, GX-10).
14. Thêm section `Bảo đảm tối thiểu` (GUC-14); ngoài điều 1 chuyển từ Postconditions 2, phần còn lại `FILL_LATER`.
15. `related: []`: quan hệ UC-005 ↔ UC-008 đang ghi ở cả hai đầu; giữ ở UC-005 (GX-05). Chữ "R-041" trong lời giải thích quan hệ thuộc G-09 (đã rút lại, không phải blocker).
16. `follows` lấy từ "Trước đó"; "Tiếp theo: UC-011" không ghi ở đây vì UC-011 đã ghi `follows: [UC-008]` (GX-05, GUC-17).
17. Related Requirements, Related Business Rules không ghi ở UC: đã lật thành `use_cases` của R và BR (GX-05). Related Work bỏ theo bảng ánh xạ.
18. `source` giữ đủ mã mục của DOC-001 (relations.json gộp thành "DOC-001") (GX-11).
19. Chỗ đánh dấu `BLOCKER BLK-048`: nhánh dừng lượt tạo file tải về, tùy quyết định BLK-048 (GUC-12).

### business-rules

#### BR-018 (đơn giản)

##### Bản gốc

| Cột | Giá trị |
|---|---|
| ID | BR-018 |
| Tên ngắn | Mỗi người dùng chỉ thấy dữ liệu của mình |
| Scope | Later |
| Status | Draft |
| Rule | Khi DeckAgent có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình. |
| Exceptions | 1. Dữ liệu được chủ sở hữu chủ động chia sẻ. |
| Ghi chú | 1. Áp dụng khi DeckAgent có tài khoản. |
| Căn cứ | R-051 |
| Related Use Cases | UC-009, UC-018 |
| Related Requirements | R-051 |
| Related Decisions | (trống) |

##### Bản dịch

```markdown
---
id: BR-018
short_name: "Mỗi người dùng chỉ thấy dữ liệu của mình"
status: Draft
scope: Later
source: [R-051]
use_cases: [UC-009, UC-018]
---

## Rule

1. Khi DeckAgent có tài khoản, mỗi người dùng chỉ được xem và thao tác trên deck, tài liệu và lần làm việc của chính mình.

## Exceptions

1. Dữ liệu được chủ sở hữu chủ động chia sẻ.

## Ghi chú

1. Áp dụng khi DeckAgent có tài khoản.
```

##### Thay đổi

1. Cột ID, Tên ngắn, Status, Scope → `id`, `short_name`, `status`, `scope`; tên file `BR-018.md` trùng `id` (GX-01). Giá trị `Draft`, `Later` có trong `schema.json` (GX-02).
2. Căn cứ "R-051" → `source: [R-051]` (GX-11).
3. Related Use Cases → `use_cases` (Áp lên).
4. Related Requirements (R-051) không ghi trong file này: quan hệ đã lật sang `R-051.business_rules` (GX-05).
5. Rule đánh số "1." theo template; câu giữ nguyên.
6. Xóa các section không áp dụng: `Bảng quyết định`, `Bảng chuyển trạng thái`, `Câu hỏi mở` (template cho phép xóa).
7. Không viết lại câu: item Draft chỉ chịu gate cấu trúc (GX-01, GX-02, GX-03, GX-05). Ghi chú lặp vế "Khi" của Rule; điều này vi phạm GX-12, nhưng GX-12 chỉ áp từ Proposed, nên để lại cho lúc nâng status.

#### BR-010 (nhiều chỗ viết lại)

##### Bản gốc

| Cột | Giá trị |
|---|---|
| ID | BR-010 |
| Tên ngắn | Khi nào một bản trở thành bản đã chấp nhận |
| Scope | V1 |
| Status | Active |
| Căn cứ | D-025, R-020, R-031, D-030 |
| Related Use Cases | UC-001, UC-002, UC-004, UC-008, UC-013, UC-022 |
| Related Requirements | R-020, R-031 |
| Related Decisions | D-025, D-030 |
| Exceptions | 1. Xem và khôi phục nhiều bản cũ thuộc UC-022. |
| Ghi chú | (trống) |

Rule (nguyên văn):

> 1. Khi AI tạo deck lần đầu thành công, deck đó trở thành bản đã chấp nhận ngay.
> 2. Khi AI sửa deck, kết quả là bản chờ duyệt.
> 3. Bản chờ duyệt trở thành bản đã chấp nhận khi:
> a. người dùng giữ bản đó;
> b. một yêu cầu sửa mới đạt ranh giới commit ngay trước khi lượt xử lý AI mới bắt đầu;
> c. hoặc file tải về từ bản đó được tạo thành công và giao cho người dùng.
> 4. Với trường hợp 3b, nếu yêu cầu sửa mới còn cần hỏi lại, cảnh báo hoặc xác nhận, bản chờ duyệt hiện tại vẫn là bản chờ duyệt trong các bước đó. Nếu yêu cầu bị hủy hoặc bị từ chối trước ranh giới commit, bản chờ duyệt không trở thành bản đã chấp nhận và ràng buộc của yêu cầu mới không được giữ lại. Nếu không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất, ranh giới commit đạt ngay trước khi lượt xử lý AI bắt đầu; hệ thống không thêm bước xác nhận riêng.
> 5. Tại ranh giới commit của 3b, theo thứ tự: bản chờ duyệt hiện tại trở thành bản đã chấp nhận; ràng buộc của nó trở thành tập ràng buộc của bản đã chấp nhận; ràng buộc của yêu cầu mới được áp dụng; sau đó lượt xử lý AI bắt đầu. Nếu lượt này bị dừng, lỗi hoặc không qua kiểm tra, deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit, không quay về bản cũ hơn.
> 6. Nếu lượt tải về bị hủy hoặc thất bại, bản chờ duyệt vẫn là bản chờ duyệt.
> 7. Khi người dùng bỏ bản chờ duyệt, deck quay về bản đã chấp nhận làm cơ sở cho lần sửa đó, và ràng buộc mới nêu trong yêu cầu dẫn tới bản chờ duyệt cũng bị hủy.
> 8. Hệ thống chỉ bắt buộc giữ một bản đã chấp nhận làm cơ sở khôi phục cho bản chờ duyệt hoặc lượt xử lý đang chạy. Khi một bản chờ duyệt được chấp nhận để làm cơ sở cho lượt sửa mới, bản đó trở thành cơ sở khôi phục hiện tại; hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn để khôi phục nhiều bước.

##### Bản dịch

```markdown
---
id: BR-010
short_name: "Khi nào một bản trở thành bản đã chấp nhận"
status: Active            # <!-- BLOCKER BLK-054 -->
scope: V1
source: [D-025, R-020, R-031, D-030]
use_cases: [UC-001, UC-002, UC-004, UC-008, UC-013, UC-022]
---

## Rule

<!-- BLOCKER BLK-034 -->
<!-- BLOCKER BLK-035 -->

1. Khi AI tạo deck lần đầu thành công, hệ thống phải coi deck đó là bản đã chấp nhận.
2. Khi AI sửa deck, hệ thống phải coi kết quả sửa là bản chờ duyệt.
3. Khi người dùng giữ bản chờ duyệt, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
4. Khi một yêu cầu sửa mới đạt ranh giới commit trong lúc đang có bản chờ duyệt, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
5. Khi file tải về từ bản chờ duyệt được tạo thành công và giao cho người dùng, bản chờ duyệt đó phải trở thành bản đã chấp nhận.
6. Ranh giới commit của một yêu cầu sửa mới đạt ngay trước khi lượt xử lý AI cho yêu cầu đó bắt đầu, và chỉ khi yêu cầu đó không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất.
7. Khi yêu cầu sửa mới còn bước hỏi lại, cảnh báo hoặc xác nhận cần hoàn tất, bản chờ duyệt hiện tại phải vẫn là bản chờ duyệt.
8. Khi yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, bản chờ duyệt hiện tại phải vẫn là bản chờ duyệt.
9. Khi yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, hệ thống không được giữ lại ràng buộc của người dùng nêu trong yêu cầu đó.
10. Hệ thống không được thêm bước xác nhận riêng để đạt ranh giới commit.
11. Tại ranh giới commit, tập ràng buộc của bản đã chấp nhận phải là tập ràng buộc của bản chờ duyệt vừa được chấp nhận, không gồm ràng buộc của người dùng nêu trong yêu cầu sửa mới.
12. Lượt xử lý AI bắt đầu sau ranh giới commit phải áp dụng ràng buộc của người dùng nêu trong yêu cầu sửa mới.
13. Khi lượt xử lý AI bắt đầu sau ranh giới commit bị dừng, lỗi hoặc không qua kiểm tra kết quả, hệ thống phải đưa deck và tập ràng buộc về bản đã chấp nhận tại ranh giới commit đó, không về bản đã chấp nhận cũ hơn.
14. Khi lượt tải về từ bản chờ duyệt bị hủy hoặc thất bại, bản chờ duyệt đó phải vẫn là bản chờ duyệt.
15. Khi người dùng bỏ bản chờ duyệt, hệ thống phải đưa deck về bản đã chấp nhận làm cơ sở cho lần sửa tạo ra bản chờ duyệt đó.
16. Khi người dùng bỏ bản chờ duyệt, hệ thống phải hủy ràng buộc của người dùng nêu trong yêu cầu sửa tạo ra bản chờ duyệt đó.
17. Khi có bản chờ duyệt hoặc lượt xử lý AI đang chạy, hệ thống phải giữ một bản đã chấp nhận làm cơ sở khôi phục.
18. Khi bản chờ duyệt được chấp nhận tại ranh giới commit, bản đó phải trở thành cơ sở khôi phục hiện tại.
19. Hệ thống không bắt buộc giữ các bản đã chấp nhận cũ hơn cơ sở khôi phục hiện tại.

## Bảng chuyển trạng thái

| Trạng thái hiện tại | Sự kiện | Điều kiện | Trạng thái sau |
|---|---|---|---|
| Chưa có deck | AI tạo deck lần đầu thành công | — | Chỉ có bản đã chấp nhận (mục 1) |
| Chưa có deck | Lượt tạo deck bị dừng, lỗi hoặc không qua kiểm tra kết quả | — | Chưa có deck (UC-001 4A, 4B, 5A) |
| Chỉ có bản đã chấp nhận | Người dùng gửi yêu cầu sửa | Yêu cầu bị hủy hoặc bị từ chối | Không đổi (UC-004 2A, 2B, 2C) |
| Chỉ có bản đã chấp nhận | Lượt xử lý AI sửa deck bắt đầu | — | Lượt xử lý AI đang chạy; cơ sở khôi phục là bản đã chấp nhận hiện tại (mục 17) |
| Chỉ có bản đã chấp nhận | Người dùng bỏ bản chờ duyệt | — | Không đổi; hệ thống báo không còn lần sửa nào để bỏ (UC-013 1A) |
| Chỉ có bản đã chấp nhận | Tải về thành công, bị hủy hoặc thất bại | — | Không đổi (UC-008 4A) |
| Có bản chờ duyệt | Người dùng giữ | — | Chỉ có bản đã chấp nhận; bản chờ duyệt thành bản đã chấp nhận (mục 3) |
| Có bản chờ duyệt | Người dùng bỏ | — | Chỉ có bản đã chấp nhận là bản làm cơ sở cho lần sửa; ràng buộc mới của lần sửa bị hủy (mục 15, 16) |
| Có bản chờ duyệt | Tải về từ bản chờ duyệt thành công, file giao cho người dùng | — | Chỉ có bản đã chấp nhận; bản chờ duyệt thành bản đã chấp nhận (mục 5) |
| Có bản chờ duyệt | Lượt tải về bị hủy hoặc thất bại | — | Không đổi (mục 14) |
| Có bản chờ duyệt | Người dùng gửi yêu cầu sửa mới | Còn bước hỏi lại, cảnh báo hoặc xác nhận | Chờ hoàn tất yêu cầu sửa mới; bản chờ duyệt giữ nguyên (mục 7) |
| Có bản chờ duyệt | Người dùng gửi yêu cầu sửa mới | Không bị từ chối, không còn bước hỏi lại, cảnh báo hoặc xác nhận | Lượt xử lý AI đang chạy; bản chờ duyệt thành bản đã chấp nhận và là cơ sở khôi phục (mục 4, 6, 11, 18) |
| Chờ hoàn tất yêu cầu sửa mới | Các bước hỏi lại, cảnh báo, xác nhận hoàn tất | Yêu cầu không bị từ chối | Lượt xử lý AI đang chạy; bản chờ duyệt thành bản đã chấp nhận và là cơ sở khôi phục (mục 4, 6, 11, 18) |
| Chờ hoàn tất yêu cầu sửa mới | Yêu cầu bị hủy hoặc bị từ chối | — | Có bản chờ duyệt; ràng buộc của yêu cầu mới không được giữ (mục 8, 9) |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng giữ bản chờ duyệt | — | <!-- BLOCKER BLK-054 --> |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng bỏ bản chờ duyệt | — | <!-- BLOCKER BLK-054 --> |
| Chờ hoàn tất yêu cầu sửa mới | Người dùng tải về | — | <!-- BLOCKER BLK-054 --> |
| Lượt xử lý AI đang chạy | AI sửa deck xong, kết quả qua kiểm tra kết quả | — | Có bản chờ duyệt (mục 2) |
| Lượt xử lý AI đang chạy | Lượt bị dừng, lỗi hoặc không qua kiểm tra kết quả | — | Chỉ có bản đã chấp nhận là cơ sở khôi phục của lượt; tập ràng buộc về theo bản đó (mục 13; UC-004 3A, 3B, 4A) |
| Lượt xử lý AI đang chạy | Người dùng gửi yêu cầu mới | — | Không đổi; hệ thống yêu cầu chờ hoặc dừng lượt hiện tại (BR-014; UC-014 2C) |
| Lượt xử lý AI đang chạy | Người dùng tải về | — | <!-- BLOCKER BLK-054 --> |

## Ghi chú

1. Xem và khôi phục nhiều bản cũ thuộc UC-022, không thuộc rule này.
```

##### Thay đổi

1. Frontmatter: Căn cứ → `source`; Related Use Cases → `use_cases`. Related Requirements (R-020, R-031) không ghi: đã lật sang `R.business_rules` (GX-05). Related Decisions (D-025, D-030) không ghi: đã lật sang `D.shapes` (GX-05).
2. `status: Active` gắn BLK-054: bảng còn 4 ô chưa suy ra được (GX-09, GBR-05).
3. Mục gốc 3 (một câu, ba vế a/b/c) tách thành mục 3, 4, 5, mỗi mục tự đứng được (GBR-03).
4. Mục gốc 4 bắt đầu "Với trường hợp 3b" phụ thuộc mục trước; tách thành mục 6, 7, 8, 9, 10, mỗi mục tự nêu điều kiện (GBR-03).
5. Mục gốc 5 "theo thứ tự: …; sau đó lượt xử lý AI bắt đầu" là trình tự bước; viết lại thành điều phải đúng tại ranh giới commit (mục 11, 12) và khi lượt lỗi (mục 13) (GBR-04). Vế "không gồm ràng buộc của người dùng nêu trong yêu cầu sửa mới" ở mục 11 suy ra từ thứ tự gốc (tập ràng buộc được chốt trước khi áp ràng buộc mới), không thêm thông tin.
6. "ràng buộc của nó" → "tập ràng buộc của bản chờ duyệt vừa được chấp nhận" (GX-17).
7. "ràng buộc của yêu cầu mới" → "ràng buộc của người dùng nêu trong yêu cầu sửa mới" (GX-07, GL-008).
8. "không qua kiểm tra" → "không qua kiểm tra kết quả" (GX-07, GL-021).
9. "trở thành bản đã chấp nhận ngay" → "phải coi deck đó là bản đã chấp nhận": bỏ "ngay" (GX-08), vì trạng thái gắn trực tiếp với sự kiện tạo thành công.
10. Mục gốc 1, 2, 6, 7 thêm chủ thể và "phải / không được" (GBR-02, GX-16). Mục gốc 7 có hai vế (quay về deck; hủy ràng buộc) nên tách thành mục 15, 16 (GBR-03).
11. Mục gốc 8 tách thành mục 17, 18, 19 (GBR-03). "chỉ bắt buộc giữ một bản" viết thành "phải giữ một bản" (mục 17) cộng "không bắt buộc giữ các bản cũ hơn" (mục 19), cùng nghĩa.
12. Thêm `Bảng chuyển trạng thái` (GBR-05). Mọi dòng có ô kết quả đều ghi mục Rule hoặc luồng UC làm căn cứ. Các dòng lấy từ UC-001, UC-004, UC-008, UC-013, UC-014 là tóm tắt kèm ID, không phát biểu lại như quy định mới (GX-10). Tên trạng thái "Chưa có deck", "Chỉ có bản đã chấp nhận", "Có bản chờ duyệt", "Chờ hoàn tất yêu cầu sửa mới", "Lượt xử lý AI đang chạy" là nhãn đặt cho các tình huống sheet đã mô tả, không phải trạng thái mới. 4 ô không có căn cứ ghi `BLOCKER BLK-054`.
13. Exceptions "Xem và khôi phục nhiều bản cũ thuộc UC-022" không phải trường hợp rule không áp dụng mà là giới hạn phạm vi → chuyển sang Ghi chú, xóa section Exceptions (GBR-06, GX-12).
14. Rule gắn BLK-034 (mục 4, 6–13 trùng D-030) và BLK-035 (mục 13–19 chồng BR-005, BR-014 mục 2) (GX-10, GBR-08).
15. "ranh giới commit" chưa có trong glossary (GBR-09); mục 6 nêu định nghĩa lấy từ mục gốc 4. Xem mục 6 của file này.
16. `short_name` giữ nguyên. Đếm theo khoảng trắng là 10 tiếng, vượt ngưỡng 8 của GBR-11 nếu đếm theo tiếng; xem mục 6.
17. Xóa section `Bảng quyết định` (không có ≥3 điều kiện kết hợp) và `Câu hỏi mở` (nếu BLK-054 chọn A).

### requirements

#### R-050 (đơn giản)

##### Bản gốc
- ID: R-050
- Tên ngắn: Duyệt dàn ý trước khi tạo deck
- Scope: Later
- Status: Draft
- Type: Functional
- Yêu cầu: DeckAgent có thể cho người dùng xem và sửa dàn ý trước khi AI tạo cả deck.
- Bối cảnh / Lý do: Sửa dàn ý nhanh hơn nhiều so với tạo lại cả deck khi cấu trúc sai.
- Acceptance Note: 1. Người dùng xem và sửa được dàn ý trước khi tạo deck. 2. Deck được tạo theo dàn ý đã xác nhận.
- Ghi chú: 1. Ý tưởng từ benchmark, chưa có trong DOC-001.
- Căn cứ: Benchmark 27/09/2026
- Area: Planning, AI, Web
- Depends On (IDs): R-001
- Related Work (IDs): (trống). Related Tests: (trống).
- Quan hệ lật (relations.json): `use_cases` UC-016 (từ Use Cases.Related Requirements).

##### Bản dịch
```markdown
---
id: R-050
short_name: "Duyệt dàn ý trước khi tạo deck"
type: Functional
status: Draft
scope: Later
verification:             # FILL_LATER (gợi ý: test)
inputs:                   # FILL_LATER (gợi ý: true — dàn ý do người dùng sửa)
area: [Planning, AI, Web]
source: ["Benchmark 27/09/2026"]
use_cases: [UC-016]
business_rules: []
constraints: []
assumptions: []
depends_on: [R-001]
---

## Yêu cầu

DeckAgent có thể cho người dùng xem và sửa dàn ý trước khi AI tạo cả deck.

## Bối cảnh / Lý do

Sửa dàn ý nhanh hơn nhiều so với tạo lại cả deck khi cấu trúc sai.

## Miền đầu vào

<!-- FILL_LATER -->

## Đo lường

<!-- FILL_LATER -->

## Acceptance

1. Người dùng xem và sửa được dàn ý trước khi tạo deck.
2. Deck được tạo theo dàn ý đã xác nhận.

## Câu hỏi mở

<!-- Không có nội dung: xóa section theo _TEMPLATE.md -->

## Ghi chú

1. Ý tưởng từ benchmark, chưa có trong DOC-001.
```

##### Thay đổi
1. Chuyển ID, Tên ngắn, Status, Scope, Type, Area sang frontmatter. Type `Functional` thuộc nhóm hành vi (GR-14); 3 giá trị Area đều có trong enum (GX-02).
2. Thêm `verification`, `inputs` để trống kèm gợi ý, vì sheet không có (FILL_LATER, quyết định 3).
3. `source` lấy nguyên mã "Benchmark 27/09/2026" (GX-11; xem mục 6 về việc chuẩn hóa mã).
4. `use_cases: [UC-016]` lấy từ relations.json (lật từ Use Cases.Related Requirements, GX-05). `depends_on` lấy từ cột Depends On.
5. Bỏ Related Work, Related Tests (trống).
6. Không viết lại câu nào. Item Draft chỉ chịu gate cấu trúc; GR-01, GR-02, GX-12, GX-16 áp từ Proposed hoặc Active. "có thể" hợp lệ ở Draft (GR-02).
7. Thêm `Miền đầu vào`, `Đo lường` với FILL_LATER; `Câu hỏi mở` không có nội dung nên xóa khi ghi file thật.

#### R-024 (nhiều chỗ viết lại)

##### Bản gốc
- ID: R-024
- Tên ngắn: Giữ ràng buộc của người dùng qua các lần sửa
- Scope: V1
- Status: Active
- Type: Quality
- Yêu cầu: DeckAgent phải tiếp tục áp dụng ràng buộc của người dùng còn hiệu lực qua các lần sửa, cho tới khi người dùng đổi hoặc hủy.
- Bối cảnh / Lý do: Qua nhiều lần sửa, audience, ngôn ngữ hay độ dài người dùng đã nêu không được tự biến mất.
- Acceptance Note:
  1. Sau nhiều lần sửa liên tiếp, ràng buộc còn hiệu lực vẫn đúng trên deck.
  2. Trước ranh giới commit của một yêu cầu sửa mới, các ràng buộc mới của yêu cầu đó không được áp dụng vào trạng thái đã chấp nhận. Nếu yêu cầu bị hủy hoặc bị từ chối trước thời điểm này, các ràng buộc mới không được giữ lại.
  3. Tại ranh giới commit, ràng buộc của bản chờ duyệt (nếu có) trở thành tập ràng buộc của bản đã chấp nhận trước khi ràng buộc của yêu cầu mới được áp dụng.
  4. Nếu lượt sửa sau commit bị dừng, lỗi hoặc kết quả không qua kiểm tra, các ràng buộc mới của yêu cầu đó bị hủy khi rollback; hệ thống khôi phục tập ràng buộc của bản đã chấp nhận tại ranh giới commit và không quay về baseline cũ hơn.
- Ghi chú: 1. Thời hạn và cách xử lý xung đột giữa các loại ràng buộc còn mở (A-013), không chặn W-028.
- Căn cứ: DOC-001 NFR-Q05, D-025, D-030
- Area: Core, Planning, AI
- Depends On (IDs): R-001, R-011
- Related Work (IDs): W-002, W-028, W-032. Related Tests: (trống).
- Quan hệ lật (relations.json): `use_cases` UC-001, UC-004; `business_rules` BR-003; `assumptions` A-005, A-009, A-013.

##### Bản dịch
```markdown
---
id: R-024
short_name: "Giữ ràng buộc của người dùng khi sửa"
type: Quality
status: Active            # <!-- BLOCKER BLK-043 --> giữ Active hay hạ Proposed
scope: V1
verification:             # FILL_LATER (gợi ý: test)
inputs:                   # FILL_LATER (gợi ý: true — yêu cầu sửa có nêu ràng buộc)
area: [Core, Planning, AI]
source: [DOC-001 NFR-Q05, D-025, D-030]
use_cases: [UC-001, UC-004]
business_rules: [BR-003]  # <!-- BLOCKER BLK-033 --> thêm BR-010 nếu chọn phương án A
constraints: []
assumptions: [A-005, A-009, A-013]   # <!-- BLOCKER BLK-029 --> A-005 là assumption về project
depends_on: [R-001, R-011]
---

## Yêu cầu

Khi DeckAgent thực hiện một lần sửa deck, DeckAgent phải áp dụng mỗi ràng buộc của người dùng còn hiệu lực cho tới khi người dùng đổi hoặc hủy ràng buộc đó. <!-- BLOCKER BLK-043 --> <!-- BLOCKER BLK-033 -->

## Bối cảnh / Lý do

Audience, ngôn ngữ hay độ dài người dùng đã nêu không được tự biến mất qua nhiều lần sửa.

## Miền đầu vào

<!-- FILL_LATER -->

## Đo lường

<!-- FILL_LATER -->

## Acceptance

1. Cho deck có ràng buộc của người dùng còn hiệu lực, khi người dùng sửa deck nhiều lần liên tiếp mà không đổi hoặc hủy ràng buộc đó, thì deck sau mỗi lần sửa vẫn thỏa ràng buộc đó.
2. Cho một yêu cầu sửa mới chưa đạt ranh giới commit, thì tập ràng buộc của bản đã chấp nhận chưa chứa ràng buộc mới của yêu cầu đó. <!-- BLOCKER BLK-033 --> <!-- BLOCKER BLK-041 -->
3. Cho một yêu cầu sửa mới bị hủy hoặc bị từ chối trước ranh giới commit, thì DeckAgent không giữ lại ràng buộc mới của yêu cầu đó. <!-- BLOCKER BLK-033 --> <!-- BLOCKER BLK-041 -->
4. Cho một bản chờ duyệt đang có, khi yêu cầu sửa mới đạt ranh giới commit, thì tập ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận trước khi DeckAgent áp dụng ràng buộc của yêu cầu mới. <!-- BLOCKER BLK-033 --> <!-- BLOCKER BLK-041 -->
5. Cho một lượt sửa đã qua ranh giới commit, khi lượt đó bị dừng, lỗi hoặc kết quả không qua kiểm tra kết quả, thì DeckAgent hủy ràng buộc mới của yêu cầu đó và khôi phục tập ràng buộc của bản đã chấp nhận tại ranh giới commit, không khôi phục về bản đã chấp nhận cũ hơn. <!-- BLOCKER BLK-033 --> <!-- BLOCKER BLK-041 -->

## Câu hỏi mở

1. Ràng buộc của người dùng hết hiệu lực khi nào, ngoài trường hợp người dùng đổi hoặc hủy, và DeckAgent xử lý xung đột giữa các loại ràng buộc thế nào? (A-013) <!-- BLOCKER BLK-043 -->
```

##### Thay đổi
1. Rút short_name từ 10 xuống 8 tiếng, vẫn giữ thuật ngữ "ràng buộc của người dùng" (GR-16, GX-07).
2. Đưa điều kiện "Khi DeckAgent thực hiện một lần sửa deck" lên đầu câu theo EARS (GR-01, GR-03). Đổi "tiếp tục áp dụng … qua các lần sửa" thành "áp dụng … cho tới khi", cùng nghĩa. Thêm "ràng buộc đó" sau "đổi hoặc hủy" cho rõ tân ngữ (GX-17).
3. Viết Acceptance 1 dạng Cho / Khi / Thì (GR-07). Đổi "vẫn đúng trên deck" thành "deck … vẫn thỏa", có chủ ngữ rõ (GX-16). Điều kiện "mà không đổi hoặc hủy" lấy từ câu Yêu cầu, không phải thông tin mới.
4. Tách Acceptance 2 gốc thành điều 2 và 3, vì gốc có hai điều kiện và hai kết quả (GX-14, GR-07).
5. Đổi "trạng thái đã chấp nhận" thành "tập ràng buộc của bản đã chấp nhận". Glossary ghi "accepted state" là "Không dùng" và dùng "bản đã chấp nhận" (GX-07).
6. Đổi "(nếu có)" thành điều kiện tường minh "Cho một bản chờ duyệt đang có" (GX-08, GR-03).
7. Đổi "rollback" thành "khôi phục"; "baseline cũ hơn" thành "bản đã chấp nhận cũ hơn", theo cách viết của BR-010 mục 8 (GX-07).
8. Đổi "không qua kiểm tra" thành "không qua kiểm tra kết quả", dùng thuật ngữ glossary (GX-07).
9. Đổi "Nếu lượt sửa sau commit…" thành "Cho một lượt sửa đã qua ranh giới commit…", để thống nhất một cụm "ranh giới commit" (GX-07).
10. Chuyển Ghi chú (thời hạn, xung đột, A-013) sang `Câu hỏi mở`, viết dạng câu hỏi có "?" (GX-09, GX-12). Bỏ "không chặn W-028", vì đó là ghi chú quy trình (mục 5). `Ghi chú` trống nên xóa.
11. Tách `Căn cứ` thành danh sách `source`. Lấy `use_cases`, `business_rules`, `assumptions` từ relations.json (GX-05). Bỏ Related Work.
12. Gắn marker blocker: BLK-043 (status và Câu hỏi mở), BLK-033 (Yêu cầu trùng BR-003; Acceptance 2–5 trùng BR-010 mục 4–5), BLK-041 (Acceptance 2–5 trùng D-030), BLK-029 (A-005).
13. Chưa sửa và chưa giải quyết được: `Bối cảnh / Lý do` gần như lặp câu Yêu cầu (GR-06), nhưng sheet không có lý do khác nên không viết thêm. Acceptance 3 là câu phủ định (GR-12), giữ vì không có cách quan sát thay thế trong sheet.

### decisions

#### D-008 (đơn giản)

##### Bản gốc
- ID: D-008
- Status: Superseded
- Decision: "Deck có sẵn được coi là deck có thể tiếp tục sửa bằng AI."
- Date: 2026-09-17
- Recorded By: Duy
- Context: "1. Product baseline ban đầu coi việc nhập và dùng lại deck có sẵn là capability cốt lõi.\n2. V1 sau đó được thu hẹp thành luồng ưu tiên tạo mới."
- Rationale / Evidence: "1. Decision đạt đúng điều kiện reopen của chính nó khi DOC-002 chọn V1 ưu tiên tạo mới.\n2. D-013 thay thế để phản ánh ranh giới mới mà không xóa khả năng làm sau."
- Reopen When: "Không mở lại trực tiếp; xem D-013."
- Requirement chính: "R-005, R-012, R-023"
- Assumption chính: "A-011"
- Related Work: "W-001, W-004"
- Detailed Doc: "DOC-001, DOC-002"

##### Bản dịch
```markdown
---
id: D-008
short_name: Deck có sẵn sửa tiếp bằng AI
status: Superseded
date: 2026-09-17
decided_by: Duy
source: []
addresses: [R-005, R-012, R-023]   # cần duyệt addresses hay shapes (mục 7)
assumptions: [A-011]
constraints: []
shapes: []
documents: [DOC-001, DOC-002]
superseded_by: [D-013]
---

## Decision

Deck có sẵn được coi là deck có thể tiếp tục sửa bằng AI.

## Context

1. Product baseline ban đầu coi việc nhập và dùng lại deck có sẵn là capability cốt lõi.
2. V1 sau đó được thu hẹp thành luồng ưu tiên tạo mới.

## Phương án đã xét

<!-- FILL_LATER -->

## Rationale / Evidence

1. Decision đạt đúng điều kiện reopen của chính nó khi DOC-002 chọn V1 ưu tiên tạo mới.
2. D-013 thay thế để phản ánh ranh giới mới mà không xóa khả năng làm sau.

## Hệ quả

<!-- FILL_LATER -->

## Xác nhận tuân thủ

<!-- FILL_LATER -->

## Reopen When

Không mở lại trực tiếp; xem D-013.
```

##### Thay đổi
1. Thêm `short_name` đặt từ câu Decision (GD-11).
2. `superseded_by: [D-013]` lấy từ Rationale 2 ("D-013 thay thế") và Reopen When ("xem D-013") (GD-09).
3. Requirement chính → `addresses`, gắn cờ duyệt ở mục 7 (quyết định 4).
4. Assumption chính → `assumptions`; Detailed Doc → `documents`; Recorded By → `decided_by`.
5. Related Work bỏ theo bảng ánh xạ.
6. Không sửa câu chữ nào: item Closed chỉ được sửa hình thức (GX-15). Section mới để FILL_LATER; ở Closed không bắt buộc (schema `required_sections` chỉ tính tới mức active).
7. Bỏ section `Ghi chú` vì trống (template).

#### D-030 (nhiều chỗ viết lại)

##### Bản gốc
- ID: D-030
- Status: Active
- Decision: "Khi người dùng đang xem bản chờ duyệt và gửi yêu cầu sửa mới, bản chờ duyệt chưa được chấp nhận nếu yêu cầu còn cần hỏi lại, cảnh báo hoặc xác nhận. Trong các bước đó, nếu người dùng hủy hoặc yêu cầu bị từ chối thì bản hiện tại vẫn là bản chờ duyệt. Bản chờ duyệt được chấp nhận tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu. Ranh giới này đạt ngay khi yêu cầu không bị từ chối và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất; nếu có các bước đó, ranh giới commit chỉ đạt sau khi chúng hoàn tất. Không thêm bước xác nhận riêng khi không cần. Tại ranh giới commit, ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận, sau đó ràng buộc của yêu cầu mới được áp dụng. Nếu lượt xử lý sau đó bị dừng, lỗi hoặc không qua kiểm tra thì deck và ràng buộc quay về baseline vừa được chấp nhận."
- Date: 2026-09-29
- Recorded By: Duy
- Context: "1. Khi prototype hóa UC-004 và BR-010, phát hiện cụm “gửi yêu cầu sửa tiếp” chưa xác định chính xác thời điểm bản chờ duyệt được chấp nhận. 2. Hai cách hiểu khả dĩ là chấp nhận ngay khi user gửi request, hoặc chỉ chấp nhận khi request đã qua clarification/confirmation và thực sự được commit để bắt đầu lượt sửa mới."
- Rationale / Evidence: "1. Chọn thời điểm commit muộn hơn để việc hỏi lại, cảnh báo hoặc hủy request không tự làm thay đổi trạng thái version. \n2. Giữ quyền kiểm soát cho người dùng: Cancel trước khi AI bắt đầu không đồng nghĩa với việc chấp nhận bản đang chờ duyệt. \n3. Tạo ranh giới rõ giữa việc người dùng thể hiện ý định và việc một lượt sửa mới thực sự bắt đầu. 4. Làm rollback và constraint lifecycle dễ xác định hơn: pre-flight không đổi version state, commit mới tạo baseline mới."
- Reopen When: "Khi testing hoặc feedback người dùng cho thấy việc giữ bản ở trạng thái chờ duyệt trong các bước clarification/confirmation gây khó hiểu, hoặc khi lifecycle revision được thay đổi theo cách không còn cần bước implicit accept trước lượt sửa tiếp."
- Requirement chính: "R-024, R-031"
- Assumption chính: "A-013"
- Related Work: "W-028, W-032, W-037"
- Detailed Doc: "DOC-002"
- Quan hệ lật vào D-030 (relations.json): `shapes: [BR-005, BR-010]` từ Business Rules.Related Decisions

##### Bản dịch
```markdown
---
id: D-030
short_name: Chấp nhận bản chờ duyệt tại ranh giới commit
status: Active
date: 2026-09-29
decided_by: Duy
source: []                 # FILL_LATER
addresses: [R-024, R-031]  # cần duyệt addresses hay shapes (mục 7)
assumptions: [A-013]
constraints: []
shapes: [BR-005, BR-010]
documents: [DOC-002]
superseded_by: []
---

## Decision

<!-- BLOCKER BLK-034 -->
<!-- Bản dưới chỉ sửa thuật ngữ, chủ ngữ và đánh số; vẫn quá 3 vế (GD-01) và trùng BR-010 mục 3b, 4, 5. Theo phương án A của BLK-034, chỉ giữ ý của dòng 1 và 3, các dòng còn lại thay bằng "Chi tiết: BR-010 mục 3b, 4, 5". -->

1. Khi người dùng đang xem bản chờ duyệt và gửi yêu cầu sửa mới, DeckAgent chưa chấp nhận bản chờ duyệt nếu yêu cầu còn cần hỏi lại, cảnh báo hoặc xác nhận.
2. Trong các bước hỏi lại, cảnh báo hoặc xác nhận, nếu người dùng hủy hoặc yêu cầu bị từ chối thì bản hiện tại vẫn là bản chờ duyệt.
3. DeckAgent chấp nhận bản chờ duyệt tại ranh giới commit, ngay trước khi lượt xử lý AI mới bắt đầu.
4. Ranh giới commit đạt ngay khi yêu cầu không bị từ chối và không còn bước hỏi lại, cảnh báo hoặc xác nhận nào cần hoàn tất; nếu còn, ranh giới commit chỉ đạt sau khi các bước này hoàn tất.
5. Khi không còn bước hỏi lại, cảnh báo hoặc xác nhận nào, DeckAgent không thêm bước xác nhận riêng.
6. Tại ranh giới commit, ràng buộc của bản chờ duyệt trở thành tập ràng buộc của bản đã chấp nhận; sau đó DeckAgent áp dụng ràng buộc của yêu cầu mới.
7. Nếu lượt xử lý AI sau ranh giới commit bị dừng, lỗi hoặc không qua kiểm tra kết quả, deck và tập ràng buộc quay về bản đã chấp nhận tại ranh giới commit.

## Context

1. Khi prototype UC-004 và BR-010, team phát hiện cụm "gửi yêu cầu sửa tiếp" chưa xác định thời điểm bản chờ duyệt trở thành bản đã chấp nhận.
2. Câu hỏi cần trả lời: bản chờ duyệt được chấp nhận vào thời điểm nào khi người dùng gửi yêu cầu sửa tiếp.

## Phương án đã xét

| Phương án | Chọn / Loại | Lý do |
|---|---|---|
| Chấp nhận bản chờ duyệt ngay khi người dùng gửi yêu cầu sửa mới | Loại | Việc hỏi lại, cảnh báo hoặc hủy yêu cầu sẽ làm thay đổi trạng thái phiên bản; người dùng hủy trước khi AI bắt đầu vẫn bị tính là đã chấp nhận bản chờ duyệt |
| Chấp nhận tại ranh giới commit, sau khi yêu cầu qua các bước hỏi lại, cảnh báo, xác nhận và lượt sửa mới thực sự bắt đầu | Chọn | Xem Rationale 1–4 |

## Rationale / Evidence

1. Thời điểm commit muộn hơn giúp việc hỏi lại, cảnh báo hoặc hủy yêu cầu không tự làm thay đổi trạng thái phiên bản.
2. Người dùng giữ quyền kiểm soát: hủy yêu cầu trước khi AI bắt đầu không đồng nghĩa với chấp nhận bản chờ duyệt.
3. Có ranh giới giữa việc người dùng gửi yêu cầu sửa và việc một lượt sửa mới thực sự bắt đầu.
4. Việc quay về bản đã chấp nhận và vòng đời của ràng buộc của người dùng dễ xác định hơn: các bước trước ranh giới commit không đổi trạng thái phiên bản; chỉ ranh giới commit tạo bản đã chấp nhận mới.

## Hệ quả

<!-- FILL_LATER -->

## Xác nhận tuân thủ

<!-- FILL_LATER -->

## Reopen When

Khi testing hoặc phản hồi của người dùng cho thấy việc giữ bản chờ duyệt trong các bước hỏi lại và xác nhận gây khó hiểu <!-- BLOCKER BLK-017 -->, hoặc khi vòng đời phiên bản thay đổi tới mức lượt sửa tiếp không còn cần bước chấp nhận ngầm bản chờ duyệt.
```

##### Thay đổi
1. `short_name` đặt từ câu Decision (GD-11).
2. Decision: đánh dấu `BLOCKER BLK-034` (GD-01 quá 3 vế, GD-10 trùng BR-010); trong lúc chờ, chỉ sửa không đổi nghĩa: tách 7 câu thành danh sách đánh số (GX-14); "bản chờ duyệt được chấp nhận" → "DeckAgent chấp nhận bản chờ duyệt" (GD-01, GX-16); "Trong các bước đó", "chúng" → lặp lại danh từ (GX-17); "khi không cần" → điều kiện cụ thể lấy từ chính câu 4 và BR-010 mục 4 (GX-08 câu thoát); "không qua kiểm tra" → "không qua kiểm tra kết quả" (GX-07); "baseline vừa được chấp nhận" → "bản đã chấp nhận tại ranh giới commit" (GX-07).
3. Context 1: thêm chủ ngữ "team" cho "phát hiện" (GX-16); bỏ "chính xác" để câu trung tính, không đổi nghĩa (GD-02).
4. Context 2: hai cách hiểu chuyển sang `Phương án đã xét` (quyết định 5, GD-03); Context giữ câu hỏi trung tính (GD-02).
5. `Phương án đã xét`: lý do loại phương án 1 chuyển từ Rationale 1 và 2, không thêm ý mới (GD-03).
6. Rationale: "request" → "yêu cầu", "Cancel" → "hủy", "version" → "phiên bản", "rollback" → "quay về bản đã chấp nhận", "constraint lifecycle" → "vòng đời của ràng buộc của người dùng", "pre-flight" → "các bước trước ranh giới commit", "baseline" → "bản đã chấp nhận" (GX-07); "thể hiện ý định" → "gửi yêu cầu sửa", vì glossary định nghĩa "ý định" là chủ đề, mục đích, audience (GX-07); bỏ "rõ" trong "ranh giới rõ" (GX-08); tách dòng 3 và 4 đang dính nhau (GX-14).
7. Reopen When: "feedback" → "phản hồi", "clarification/confirmation" → "hỏi lại và xác nhận", "lifecycle revision" → "vòng đời phiên bản", "implicit accept" → "chấp nhận ngầm" (GX-07); "gây khó hiểu" đánh dấu `BLOCKER BLK-017` (GD-07).
8. Quan hệ: Requirement chính → `addresses` gắn cờ (mục 7); `shapes: [BR-005, BR-010]` từ bước lật; `assumptions: [A-013]` giữ theo cách đã xử lý mâu thuẫn trong global-blockers.md.
9. `Hệ quả`, `Xác nhận tuân thủ`, `source` để FILL_LATER (quyết định 3; gợi ý ở mục 3). Bỏ section `Ghi chú` vì trống; Related Work bỏ.

### glossary

#### GL-018 (đơn giản)

##### Bản gốc

| Cột sheet | Nội dung |
|---|---|
| Nhóm | dàn ý |
| Quy tắc chuẩn | Dùng “dàn ý”. |
| Ý nghĩa / Cách hiểu | Danh sách slide và ý chính trước khi AI tạo nội dung chi tiết. |
| Ví dụ đạt | Duyệt dàn ý trước khi tạo deck. |
| Ví dụ chưa đạt | Không dùng: outline |

##### Bản dịch

```markdown
| dàn ý | Danh sách slide và ý chính trước khi AI tạo nội dung chi tiết. | outline |
```

##### Thay đổi

1. `Nhóm` → cột Thuật ngữ; `Ý nghĩa / Cách hiểu` → cột Định nghĩa; phần sau "Không dùng:" → cột Không dùng (ánh xạ của brief).
2. Bỏ `Rule ID`, `Quy tắc chuẩn`, `Ví dụ đạt`, `Sheet`, `Cột`, `Áp dụng cho`: bảng `glossary.md` không có cột tương ứng.
3. Không viết lại câu nào. Định nghĩa không chứa từ cấm của dòng khác (GX-07).

#### GL-022 (nhiều chỗ viết lại)

##### Bản gốc

| Cột sheet | Nội dung |
|---|---|
| Nhóm | cố gắng, không đảm bảo |
| Quy tắc chuẩn | Dùng “cố gắng, không đảm bảo”. |
| Ý nghĩa / Cách hiểu | Hệ thống thử làm đúng nhưng không cam kết kết quả (dùng cho sửa theo slide ở V1). |
| Ví dụ đạt | Sửa theo slide ở V1 là cố gắng, không đảm bảo. |
| Ví dụ chưa đạt | Không dùng: best effort |

##### Bản dịch

```markdown
| cố gắng, không đảm bảo | Mức cam kết trong đó Hệ thống thử làm đúng nhưng không cam kết kết quả. Ở V1, sửa theo slide ở mức này (D-025, BR-011). | best effort |
```

##### Thay đổi

1. Tách phần trong ngoặc "(dùng cho sửa theo slide ở V1)" thành câu riêng. Phần này nói nơi khái niệm được áp dụng, không phải định nghĩa; để trong ngoặc thì đọc như một quy định ẩn (GX-10).
2. Thêm "Mức cam kết trong đó" ở đầu để câu định nghĩa có danh từ chính (định nghĩa một khái niệm, không phải mô tả hành vi). Không đổi nghĩa.
3. Thêm ID item sở hữu "(D-025, BR-011)": GX-10 yêu cầu tóm tắt quy định ở nơi khác phải kèm ID của item sở hữu. Hai ID lấy từ A-021.Ghi chú ("D-025 tạo phạm vi test…; sửa theo slide chỉ ở mức cố gắng, không đảm bảo") và UC-023.Ghi chú ("(UC-004, BR-011)"). Nếu agent chính coi việc thêm ID là thêm thông tin thì bỏ ngoặc này.
4. "sửa theo slide" chưa có trong glossary: để nguyên chữ, ghi vào FILL_LATER (thêm thuật ngữ là thông tin mới).
5. Thuật ngữ chứa dấu phẩy. Quy ước của `glossary.md` chỉ tách theo dấu phẩy ở cột Không dùng, nên giữ nguyên tên. Công cụ Lint (GBR-09) phải coi cả ô Thuật ngữ là một cụm (ghi ở mục 6).
6. Bỏ `Quy tắc chuẩn`, `Ví dụ đạt` và các cột meta như GL-018.

## 6. Decision cần duyệt `addresses` hay `shapes`

Cột "Requirement chính" đã được ánh xạ tạm vào `addresses` (quyết định 4). Đề xuất của subagent decisions; người dùng duyệt từng dòng.

| D-ID | Requirement | Đề xuất | Lý do |
|---|---|---|---|
| D-005 | R-041 | bỏ (D-005 XÓA) | Item `project`; quan hệ mất theo |
| D-006 | R-006 | addresses | R-006 có từ DOC-001 FR06; AI-first là cách đáp ứng việc tạo deck |
| D-006 | R-011 | addresses | R-011 có từ FR11; AI-first là cách đáp ứng sửa deck qua chat |
| D-006 | R-029 | addresses | AI-first là cách để người không biết thiết kế tạo được deck (NFR-U01) |
| D-006 | R-041 | shapes | R-041 phát biểu đúng hệ quả "không xây editor" của D-006. Phụ thuộc BLK-020 (mục 6, ý 2) |
| D-007 | R-003 | addresses | Quan hệ yếu: D-007 quy định cách hiểu vai trò của file mà R-003 nhận; R-003 sinh từ D-024, không từ D-007. Cân nhắc bỏ |
| D-007 | R-004 | shapes | R-004 phát biểu lại D-007 thành hành vi; `Căn cứ` của R-004 có D-007 |
| D-008 | R-005 | shapes | D-008 coi deck có sẵn là sửa tiếp được, tức là capability của R-005. D-008 Closed nên không lan ảnh hưởng |
| D-008 | R-012 | addresses | R-012 (phạm vi lần sửa) không riêng cho deck có sẵn; D-008 không sinh ra R-012 |
| D-008 | R-023 | shapes | R-023 chỉ có nghĩa khi deck có sẵn là sửa được |
| D-009 | R-025 | shapes | R-025 dùng đúng tiêu chí của D-009 (facts, số liệu, thứ tự, ý nghĩa) |
| D-009 | R-026 | addresses | R-026 có từ NFR-O02; D-009 chấp nhận mất mát, R-026 quy định cách xử lý mất mát |
| D-009 | R-028 | addresses | Quan hệ yếu: R-028 nói về xem trước với file tải về, D-009 nói giữa các định dạng |
| D-010 | R-020 | addresses | Quan hệ yếu. Phụ thuộc BLK-031 |
| D-010 | R-025 | shapes | D-010 xếp độ nhất quán giữa định dạng thành quality requirement, đúng nội dung R-025. Phụ thuộc BLK-031 |
| D-010 | R-026 | shapes | Cùng lý do với R-025 (NFR-O). Phụ thuộc BLK-031 |
| D-011 | R-041 | addresses | Quan hệ yếu, nội dung D-011 không liên quan trực tiếp tới editor; cân nhắc bỏ. Phụ thuộc BLK-030, BLK-020 |
| D-012 | R-001 | shapes | D-012 đặt phạm vi V1; R-001 thuộc V1 vì luồng tạo mới được chọn. D-012 đổi thì phải xem lại scope của R |
| D-012 | R-006 | shapes | R-006 là lõi của luồng AI-first tạo deck mà D-012 chọn |
| D-012 | R-009 | shapes | Cùng lý do với R-001 |
| D-012 | R-019 | shapes | "Xem trước" là một bước của luồng trong Rationale của D-012 |
| D-012 | R-020 | shapes | "Tải về" là một bước của luồng trong Rationale của D-012 |
| D-012 | R-021 | shapes | Cùng lý do với R-001 |
| D-012 | R-029 | shapes | Cùng lý do với R-001 |
| D-013 | R-005 | shapes | D-013 đưa R-005 về Later; `Căn cứ` của R-005 có D-013 |
| D-013 | R-012 | shapes | D-013 đưa sửa cục bộ trên deck có sẵn ra khỏi V1; R-012 ở Later |
| D-013 | R-023 | shapes | D-013 đưa R-023 về Later; `Căn cứ` của R-023 có D-013 |
| D-014 | R-011 | shapes | D-014 thu hẹp việc sửa qua chat thành sửa cả deck (tên R-011 "Sửa cả deck bằng yêu cầu gõ trong chat") |
| D-014 | R-013 | addresses | Trau chuốt cả deck vốn là sửa cả deck từ FR13; D-014 không thu hẹp R-013 |
| D-015 | R-020 | addresses | D-015 dựa vào tải về đúng bản xem trước làm điểm bàn giao sang chỉnh tay |
| D-015 | R-027 | addresses | Reopen When của D-015 dựa vào việc file PPTX bàn giao dùng được (R-027) |
| D-015 | R-029 | addresses | Không có editor trên web vẫn phải đáp ứng việc người không biết thiết kế dùng được |
| D-015 | R-041 | shapes | `Căn cứ` của R-041 có D-015; R-041 là hệ quả của D-015. Phụ thuộc BLK-020 |
| D-016 | R-020 | addresses | Closed; D-016 chọn định dạng để đáp ứng việc tải về |
| D-016 | R-025 | addresses | Closed; D-016 chưa chốt định dạng chỉ xem nên không thu hẹp R-025 |
| D-016 | R-026 | addresses | Closed; cùng lý do với R-025 |
| D-016 | R-027 | shapes | Closed; D-016 chốt định dạng sửa được là PPTX, thu hẹp R-027 |
| D-016 | R-028 | addresses | Closed; quan hệ yếu |
| D-017 | R-007 | shapes | D-017 chọn P1 làm hard acceptance của V1; `Căn cứ` của R-007 có D-017 |
| D-017 | R-021 | shapes | D-017 chọn P3 làm hard acceptance |
| D-017 | R-024 | shapes | D-017 chọn P2 làm hard acceptance |
| D-017 | R-025 | shapes | D-017 chọn P5 làm hard acceptance |
| D-017 | R-027 | shapes | Cùng lý do với R-025 (P5) |
| D-017 | R-028 | shapes | Cùng lý do với R-025 (P5) |
| D-018 | R-006 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-019 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-020 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-031 | bỏ (D-018 XÓA) | Item `project` |
| D-018 | R-032 | bỏ (D-018 XÓA) | Item `project` |
| D-024 | R-003 | shapes | R-003 chép nguyên vế 1 của D-024; `Căn cứ` của R-003 có D-024 |
| D-024 | R-004 | shapes | V1 chỉ nhận vai trò tài liệu có sẵn (BR-001 Exceptions); `Căn cứ` của R-004 có D-024 |
| D-024 | R-007 | addresses | R-007 có từ FR07; chọn loại tài liệu đọc trực tiếp được là cách giữ đúng số liệu (Rationale 1) |
| D-024 | R-008 | addresses | R-008 có từ FR08; D-024 không thu hẹp R-008 |
| D-024 | R-017 | shapes | Vế 3 đưa việc dùng lại ảnh nhúng ra khỏi V1; R-017 ở Later |
| D-024 | R-042 | addresses | Quan hệ yếu; giới hạn loại tài liệu giới hạn dữ liệu cần bảo vệ |
| D-024 | R-043 | addresses | Quan hệ yếu; R-043 áp cho mọi loại tài liệu có sẵn mà D-024 chọn |
| D-025 | R-011 | shapes | Acceptance của R-011 liệt kê đúng 7 loại sửa của D-025; `Căn cứ` có D-025 |
| D-025 | R-013 | shapes | Trau chuốt là một trong 7 loại sửa của D-025; `Căn cứ` có D-025 |
| D-025 | R-024 | addresses | D-025 không đổi nội dung R-024; ràng buộc phải giữ qua mọi loại sửa D-025 chọn |
| D-025 | R-031 | shapes | Vế 2 thu hẹp việc quay lại thành một bước về bản đã chấp nhận gần nhất; `Căn cứ` có D-025 |
| D-026 | R-020 | addresses | D-026 chọn định dạng; R-020 (tải về đúng bản xem trước) không bị thu hẹp |
| D-026 | R-025 | shapes | D-026 thu hẹp "các định dạng" thành PPTX và PDF (tên R-025) |
| D-026 | R-026 | addresses | R-026 có từ NFR-O02; định dạng D-026 chọn quyết định phần nào không giữ được |
| D-026 | R-027 | shapes | R-027 ghi "tạo file PPTX và PDF", đúng lựa chọn của D-026 |
| D-026 | R-028 | addresses | R-028 có từ NFR-O04; D-026 không thu hẹp R-028 |
| D-027 | R-031 | addresses | Quan hệ yếu; R-031 áp trong lần làm việc mà D-027 giới hạn |
| D-027 | R-042 | addresses | Chạy trên máy người dùng là cách đáp ứng bảo vệ dữ liệu (Ghi chú của R-042 trích D-027) |
| D-027 | R-045 | shapes | R-045 sinh ra vì deck chỉ tồn tại trong lần làm việc; `Căn cứ` của R-045 chỉ có D-027 |
| D-028 | R-007 | shapes | D-028 quyết định tiêu chí nào thành Hard Gate. Phụ thuộc BLK-032 |
| D-028 | R-021 | shapes | Cùng lý do với R-007. Phụ thuộc BLK-032 |
| D-028 | R-025 | shapes | Cùng lý do với R-007. Phụ thuộc BLK-032 |
| D-028 | R-027 | shapes | Cùng lý do với R-007. Phụ thuộc BLK-032 |
| D-028 | R-028 | shapes | Cùng lý do với R-007. Phụ thuộc BLK-032 |
| D-029 | R-046 | shapes | R-046 sinh ra từ D-029 (Context 2: chưa có Requirement nào); `Căn cứ` của R-046 chỉ có D-029 |
| D-030 | R-024 | addresses | D-030 chọn thời điểm commit để giữ đúng ràng buộc của người dùng qua lần sửa tiếp (Rationale 4); R-024 không đổi nội dung |
| D-030 | R-031 | addresses | D-030 chọn ranh giới commit làm cách xác định "bản đã chấp nhận gần nhất" khi lượt xử lý lỗi |

## 7. Tham chiếu tới loại cũ

Chỉ tính các cột được giữ lại (cột bị bỏ như Related Work không tính). Mã `OR-xxx` (rule không migrate) và `GL-xxx` cũng được liệt kê.

| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| `C-001.Ghi chú` | OR-045 (rule không migrate) | Giữ làm text: bỏ "(OR-045)", giữ câu "đây là lựa chọn của team, không phải giới hạn từ bên ngoài". Ý đã nằm trong câu nên bỏ ID không mất nghĩa; chỉ là sửa hình thức nên hợp GX-15 |
| A-004.Ghi chú | W-026 | Bỏ: A-004 bị xóa (`project`); nội dung là ghi chú quy trình ("Retired sau W-026") |
| A-004.Ghi chú | W-034 | Bỏ: cùng lý do; "Architecture baseline sẽ được chọn… qua W-034" là kế hoạch công việc |
| A-004.Ghi chú | W-035 | Bỏ: cùng lý do |
| `UC-002.Open Questions` | W-032 | Giữ làm text: bỏ "(W-032)", nơi xử lý của câu hỏi 2 đổi sang R-007 (R-007 sở hữu tiêu chí đo; Ghi chú của R-007 đang trỏ cùng W-032). Câu hỏi không ảnh hưởng Postconditions 2, vì "mọi số liệu khớp với tài liệu" kiểm được mà không cần định nghĩa "thông tin quan trọng" |
| `UC-002.Ghi chú` | L-001 | Giữ làm text: "Ảnh nhúng trong tài liệu có sẵn chưa được dùng lại." Bỏ ID; giới hạn đã chốt ở D-024 điều 3 |
| `UC-017.Ghi chú` | L-002 | Giữ làm text: "Đổi phong cách cả deck không thuộc Use Case này." Bỏ "đang được theo dõi ở L-002" (ghi chú quy trình) |
| `UC-017.Căn cứ` | L-002 | Blocker BLK-062 |
| `UC-023.Ghi chú` | L-002 | Giữ làm text: "Mở lại khi nhiều người dùng cần sửa đúng một slide." Bỏ ID |
| `UC-024.Open Questions` | L-001 | Giữ làm text: bỏ "(L-001)", nơi xử lý đổi sang R-017 (Ghi chú của R-017 đang trỏ L-001 cho cùng chủ đề) |
| `UC-024.Căn cứ` | L-001 | Blocker BLK-062 |
| `UC-025.Căn cứ` | W-026 | Blocker BLK-062 |
| `UC-010.Ghi chú` | GL-012, GL-013 | Giữ làm text: "“Phiên đăng nhập” khác “lần làm việc” (glossary.md)." GL-ID không còn trong `glossary.md`. Không thuộc legacy-refs.json, ghi để đủ |
| `*.Related Work` | W-026, W-027, W-032 | Bỏ theo bảng ánh xạ (cột Related Work không migrate) |
| BR-009.Ghi chú | L-001 ("Nhiều tài liệu cho một deck là câu hỏi ở L-001.") | Giữ làm text: "Dùng nhiều tài liệu có sẵn cho một deck chưa thuộc V1 và đang là câu hỏi chưa xử lý." Bỏ ID không làm mất thông tin về hành vi hay nguồn |
| BR-015.Ghi chú | OR-045 ("xem lại theo OR-045 khi UC-012 được đưa vào làm") | Bỏ. Ghi chú quy trình; số chỗ dùng đã kiểm bằng GBR-01 (UC-012 + R-049 = 2, đạt). Vế "Hiện chỉ gắn UC-012 và R-049" tóm tắt lại quan hệ nên cũng bỏ (GX-12) |
| BR-016.Ghi chú | OR-045 | Bỏ, cùng lý do (UC-022 + R-016 = 2, đạt GBR-01) |
| BR-017.Ghi chú | OR-045 | Bỏ, cùng lý do (UC-017 + R-047 = 2, đạt GBR-01). Ghi chú còn trống nên xóa section |
| BR-017.Căn cứ | L-002 | Blocker BLK-062 |
| R-003.Ghi chú | L-001 | Giữ làm text: giữ danh sách "OCR, XLSX/CSV, … chưa thuộc V1", bỏ "(L-001)" |
| R-007.Ghi chú | W-032 | Blocker BLK-063 (nơi xử lý của tiêu chí đo chưa chốt) |
| R-017.Ghi chú | L-001 | Giữ làm text: "… dùng lại ảnh nhúng chưa thuộc phạm vi", bỏ ID |
| R-017.Căn cứ | L-001 | Bỏ: `source` vẫn còn `DOC-001 FR17` |
| R-018.Căn cứ | L-002 | Bỏ: `source` vẫn còn `DOC-001 FR18` |
| R-021.Acceptance Note | W-032 | Blocker BLK-063 (nơi xử lý của ngưỡng chưa chốt) |
| R-024.Ghi chú | W-028 | Bỏ: "không chặn W-028" là ghi chú quy trình |
| R-028.Ghi chú | W-032 | Giữ làm text: "Kiến trúc phải cho quan sát được bố cục và file tải về để kiểm chứng requirement này", bỏ ID |
| R-038.Bối cảnh / Lý do | L-001 | Giữ làm text: "Sau V1 sẽ mở thêm loại tài liệu", bỏ ID |
| R-038.Ghi chú | W-028 | Giữ làm text: "Không phải acceptance của V1", bỏ "Kiến trúc vẫn cân nhắc qua W-028" |
| R-039.Ghi chú | W-028 | Giữ làm text: như R-038 |
| R-040.Ghi chú | W-028 | Giữ làm text: như R-038 |
| R-042.Ghi chú | W-028 | Blocker BLK-063 (nơi xử lý của câu hỏi về việc gửi nội dung cho nhà cung cấp AI; gắn với BLK-060) |
| R-044.Căn cứ | W-026 | Bỏ: `source` vẫn còn D-025, và D-025 Rationale 4 ghi chính nội dung này |
| R-047.Ghi chú | L-002 | Giữ làm text: "Nhu cầu đổi phong cách cả deck còn là câu hỏi mở", bỏ ID |
| R-047.Căn cứ | L-002 | Bỏ: `source` còn "Benchmark 27/09/2026" (xem mục 6) |
| D-016.Rationale / Evidence | W-026 | Giữ làm text: "Được thay bằng D-026 sau khi chốt PPTX và PDF và làm rõ hướng tương thích." Bỏ ID là sửa hình thức, hợp GX-15 |
| D-024.Context | W-026 | Giữ làm text: "Cần chốt loại tài liệu có sẵn để Architecture không phải tự đoán." |
| D-024.Rationale / Evidence | L-001 | Giữ làm text: ý "OCR, XLSX/CSV… được giữ làm câu hỏi" chuyển sang `Phương án đã xét` (Loại cho V1, để sau). L-001 cũng được R-003, R-017, R-038, UC-002, UC-024, BR-009 trích; xem mục 6 |
| D-025.Context | W-026 | Giữ làm text: "Cần xác định các loại sửa tối thiểu mà không mở sửa cục bộ hay lịch sử nhiều bản." |
| D-025.Rationale / Evidence | L-002 | Giữ làm text: "đổi phong cách cả deck và hình do AI tạo cần tìm hiểu thêm" → `Phương án đã xét` (Loại cho V1). L-002 cũng được R-018, R-047, UC-017, UC-023, BR-017 trích; xem mục 6 |
| D-026.Context | W-026 | Giữ làm text: "Cần chốt định dạng sửa được và chỉ xem để Architecture và Testing có ranh giới cụ thể." |
| D-027.Context | W-028 | Giữ làm text: "… để Architecture không phải tự giả định triển khai cloud hay lưu trữ lâu dài." |
| D-028.Decision | W-026 | Phụ thuộc BLK-032 (phương án C của BLK-032 đã ghi "W-026, W-032 viết lại thành text"). Không tạo blocker mới |
| D-028.Decision | W-032 | Phụ thuộc BLK-032 |
| D-028.Context | W-028 | Phụ thuộc BLK-032; nếu giữ: giữ làm text "Architecture" |
| D-028.Rationale / Evidence | W-028 | Phụ thuộc BLK-032; nếu giữ: giữ làm text "Architecture" |
| D-028.Reopen When | W-032 | Phụ thuộc BLK-032. Nếu giữ D-028, mất ID làm điều kiện mở lại không còn nguồn quan sát; nên gộp câu hỏi này vào BLK-032 |
| UC-010.Ghi chú | "“Phiên đăng nhập” khác “lần làm việc” (GL-012, GL-013)." | giữ làm text: "“Phiên đăng nhập” khác “lần làm việc” (xem `glossary.md`)." Không mất nghĩa vì hai thuật ngữ được gọi bằng tên |

## 8. Giới hạn và giả định của Pha A

1. **Section bắt buộc để trống sẽ làm CI trượt ở Pha B.** Theo quyết định 3, section mới (Cách kiểm chứng, Cách kiểm tuân thủ, Bảo đảm tối thiểu, Hệ quả, Xác nhận tuân thủ, Acceptance khi thiếu) được để trống. `schema.json` bắt buộc các section này từ mức Active, nên item Active ghi ra với section trống sẽ trượt GX-06. Cần chọn trước Pha B: điền FILL_LATER trước khi ghi, ghi item và chấp nhận CI đỏ ở PR migrate, hay tạm hạ status. Riêng Assumption không có status mức thấp hơn Open (xem BLK-046).
2. **`source` phải lấy từ cột Căn cứ gốc.** `relations.json` chỉ giữ phần ID (ví dụ `DOC-001 FR01` thành `DOC-001`; `Benchmark 27/09/2026` không được ghi). Pha B lấy `source` từ cột `Căn cứ` trong `work/items/*.json`.
3. **Số item ở bảng tóm tắt của `BLOCKERS.md` là ước tính** (đếm ID ở dòng Item; nếu dòng Item ít hơn 2 ID thì đếm thêm ở Hiện trạng).
4. **Phân loại A2 do agent chính đề xuất** từ câu phát biểu của từng item; 5 item chưa chắc đã thành blocker XOA_ITEM. Glossary do subagent tự phân loại.
5. **Đề xuất của subagent cần xem lại khi duyệt:** bản dịch thử GL-022 thêm ID item sở hữu (D-025, BR-011) lấy từ item khác, có thể coi là thêm thông tin; bản dịch thử BR-010 dựng bảng chuyển trạng thái, các ô không có căn cứ trong sheet được để BLK-054; Use Case thêm primary actor làm chủ ngữ của `title` theo GUC-01.
6. **Cách đếm từ của `short_name`** (3–8 từ, GX-13, GBR-11, GR-16) chưa rõ với tiếng Việt: đếm theo âm tiết thì 7 `short_name` của Business Rule vượt 8. Chưa thành blocker; chọn cách đếm khi viết validator.
7. **Giả định về Lint GX-07:** chỉ quét nội dung section, không quét frontmatter và giá trị enum (nếu không, từ cấm "draft" khớp status `Draft`).
8. **Mâu thuẫn hai đầu do script phát hiện** được tự xử lý theo hợp đồng quan hệ (field ở phía nguồn là đúng), xem mục 3.
9. **Subagent requirements** dừng vì giới hạn lượt gọi API sau khi đã ghi đủ `work/assess-requirements.md`; file đã được kiểm đủ 54 ID và 6 mục.
