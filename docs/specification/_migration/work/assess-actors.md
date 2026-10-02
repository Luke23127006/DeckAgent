# Đánh giá: actors

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| ACT-001 | BLOCKER | `kind: human` (GACT-02). Gộp Goal 3 ý thành 1–2 câu (GACT-03). Đổi "tài liệu" → "tài liệu có sẵn", "mục tiêu, audience" → "ý định", "gõ" → "gõ yêu cầu trong chat" (GX-07). Chuyển "DOC-001" từ Notes sang `source`, bỏ câu nguồn khỏi `Ghi chú` (GX-11, GX-12). Constraints đổi sang dạng tóm tắt kèm ID chủ sở hữu (GX-10, chờ ACT-L02). Permissions đồng bộ với bước Use Case (GACT-08, chờ ACT-L01) | ACT-L01, ACT-L02 |
| ACT-002 | BLOCKER | `kind: external-system` (GACT-02). Tạo section `Hành vi lỗi` từ Needs 1 và Constraints 1, tách thành từng cách hỏng (GACT-05, quyết định 5). Goal: "yêu cầu từ DeckAgent" → "dữ liệu DeckAgent gửi trong một lượt xử lý AI" vì "yêu cầu" là thuật ngữ cho nội dung người dùng gõ (GX-07). Knowledge 2 viết thành tóm tắt kèm R-042, có chủ ngữ (GX-10, GX-16). "bước kiểm tra" → "kiểm tra kết quả" (GX-07). Bỏ `Ghi chú` vì tóm tắt lại Hành vi lỗi và liệt kê nhóm Use Case (GX-12, GACT-07) | ACT-L01, ACT-L03, ACT-L04, G-04 |
| ACT-003 | BLOCKER | `kind: human` (GACT-02). Tách Permissions thành 4 việc, mỗi việc một dòng (GACT-04). Tách Knowledge thành 2 ý (GX-14). Constraints thêm chủ ngữ là tên actor (GX-16). Permissions thiếu "xem danh sách tài khoản" của UC-020 (GACT-08, chờ ACT-L01) | ACT-L01 |

## 2. Blocker cục bộ

### ACT-L01 · MAU_THUAN_QH · Permissions lệch với bước Use Case
- Item: ACT-001, ACT-002, ACT-003
- Tiêu chí: GACT-08 (cả hai chiều), GACT-04
- Hiện trạng:
  - Chiều thuận (quyền không khớp bước nào): ACT-001 Permissions 4 "Quyết định khi nào deck dùng được." Không Use Case nào có bước tương ứng; gần nhất là "giữ" (UC-015 bước 3) và "tải về" (UC-008), đã có ở Permissions 3.
  - Chiều ngược, Use Case Active (V1) cho ACT-001 làm việc ngoài danh sách:
    1. Dừng lượt xử lý AI (UC-014 2A; UC-001 4A; UC-002 5B; UC-004 3A).
    2. Bắt đầu deck mới và xác nhận bỏ deck cũ (UC-011 bước 1 và 4).
    3. Chọn tiếp tục hoặc hủy khi hệ thống cảnh báo (UC-004 2B, UC-008 3A, UC-011 4A).
  - Chiều ngược, Use Case Proposed hoặc Draft (Later) cho ACT-001 làm việc ngoài danh sách: mở deck có sẵn (UC-003), đưa deck mẫu (UC-007), đăng nhập và đăng xuất (UC-009, UC-010), lấy deck cũ làm điểm xuất phát (UC-012), duyệt và sửa dàn ý (UC-016), chọn theme hoặc bộ nhận diện (UC-017), xem và xóa tài liệu đã tải lên (UC-018), chia sẻ deck (UC-019), mở lại deck cũ (UC-021), xem và khôi phục bản cũ (UC-022), sửa cục bộ (UC-023), thêm, xóa, sắp xếp slide và chèn hình (UC-024), dịch deck (UC-025).
  - Chiều ngược, ACT-002: Permissions 1 "Chỉ trả kết quả", nhưng UC-002 5A ghi "AI hỏi người dùng, hoặc đánh dấu nội dung đó là do AI bổ sung".
  - Chiều ngược, ACT-003: UC-020 (Draft) bước 1 "Quản trị viên xem danh sách tài khoản" không có trong Permissions "Tạo, khóa, mở khóa và xóa tài khoản".
- Điều chưa biết hoặc cần chọn: Permissions của actor phải khớp với tập Use Case nào (chỉ Active, hay mọi Use Case chưa Deprecated), và bổ sung từ Use Case vào actor hay sửa Use Case cho khớp actor. Đồng thời: giữ, chuyển hay bỏ ACT-001 Permissions 4.
- Phương án:
  - A. Đồng bộ với mọi Use Case chưa Deprecated, bổ sung vào actor, mỗi việc ghi kèm ID Use Case để thấy phạm vi (ví dụ "Chia sẻ deck qua link (UC-019)"). ACT-001 thêm dừng lượt xử lý AI, bắt đầu deck mới, chọn tiếp tục hoặc hủy khi có cảnh báo, và các việc Later ở trên. ACT-002 thêm "Hỏi lại người dùng khi tài liệu có sẵn thiếu thông tin cho nội dung được yêu cầu (UC-002)". ACT-003 thêm "Xem danh sách tài khoản (UC-020)". ACT-001 Permissions 4 bỏ, vì việc quyết định đã thể hiện qua "giữ" và "tải về" ở Permissions 3.
  - B. Chỉ đồng bộ với Use Case Active (V1). Việc của Use Case Proposed hoặc Draft được thêm vào actor khi Use Case đó lên Active. ACT-003 giữ nguyên vì UC-020 là Draft. ACT-001 Permissions 4 xử lý như A.
  - C. Như A hoặc B, nhưng sửa Use Case thay vì actor ở chỗ chủ ngữ có thể sai: UC-002 5A đổi "AI hỏi người dùng" thành "Hệ thống hỏi người dùng", để ACT-002 vẫn "chỉ trả kết quả".
- Đề xuất: A, vì GACT-08 ghi "không Use Case nào cho actor làm việc ngoài danh sách", không giới hạn theo status; actor không có field `scope` nên ghi ID Use Case là cách duy nhất để thấy phạm vi. Riêng UC-002 5A nên hỏi thêm người viết Use Case xem chủ ngữ "AI" có chủ ý không (phương án C).
- Quyết định:

### ACT-L02 · TRUNG_SO_HUU · Constraints của ACT-001 phát biểu lại phạm vi sản phẩm
- Item: ACT-001; chủ sở hữu đề xuất: R-029, D-006, D-015, D-027
- Tiêu chí: GX-10; template Actor ("Giới hạn cấp project thuộc Constraint")
- Hiện trạng:
  1. "Không bắt buộc có kỹ năng thiết kế chuyên nghiệp." ↔ R-029 "DeckAgent phải cho người không có kỹ năng thiết kế tạo và sửa được deck…". Trong ACT-001 cũng lặp với Needs 2 và Knowledge 3.
  2. "DeckAgent không thay thế toàn bộ PowerPoint, Canva hay Figma; chỉnh sâu làm bằng công cụ chuyên dụng sau khi tải về." ↔ D-006 (không nhằm trở thành editor chỉnh slide chuyên nghiệp) và D-015 (V1: chỉnh tay chuyên sâu làm sau khi tải về).
  3. "Không có cộng tác thời gian thực hay nhiều người cùng sửa một deck." ↔ D-027 "V1 … không cần host, tài khoản hay cộng tác". ACT-001 không giới hạn V1; D-027 chỉ nói V1.
  4. "V1 không có tài khoản (D-027)." Đã ở dạng tóm tắt kèm ID.
- Điều chưa biết hoặc cần chọn: giữ các ý 1–3 ở actor dưới dạng tóm tắt kèm ID chủ sở hữu, hay bỏ khỏi actor. Với ý 3: "không có cộng tác" chỉ áp cho V1 (theo D-027) hay áp cho cả sản phẩm.
- Phương án:
  - A. Giữ ở actor dạng tóm tắt kèm ID: "1. Không cần kỹ năng thiết kế (R-029). 2. Chỉnh tay chuyên sâu làm bằng PowerPoint hoặc công cụ chuyên dụng sau khi tải về (D-006, D-015). 3. V1 không có cộng tác hay nhiều người cùng sửa một deck (D-027). 4. V1 không có tài khoản (D-027)." Ý 3 thu hẹp về V1 cho khớp D-027.
  - B. Như A, nhưng ý 3 giữ không giới hạn V1. Khi đó nội dung "không bao giờ có cộng tác" không có item sở hữu, phải tạo Decision hoặc Constraint mới (ID mới).
  - C. Bỏ ý 1–3 khỏi actor; chỉ giữ ý 4.
- Đề xuất: A, vì giữ được ngữ cảnh cho người đọc actor mà không tạo bản quy định thứ hai. Ý 3 thu hẹp về V1 là đổi nghĩa, nên cần người dùng xác nhận. Lưu ý R-029, D-006, D-015 đang dính G-02 (dựa vào C-001 Retired).
- Quyết định:

### ACT-L03 · TRUNG_SO_HUU · "Kết quả của AI không tự động thành bản đã chấp nhận" mâu thuẫn BR-010
- Item: ACT-002; liên quan BR-010, R-033
- Tiêu chí: GX-10; GX-04 (nhất quán giữa các item)
- Hiện trạng: ACT-002 Needs 2 "Kết quả của AI không được tự động trở thành bản đã chấp nhận." BR-010 Rule 1 "Khi AI tạo deck lần đầu thành công, deck đó trở thành bản đã chấp nhận ngay." ACT-002 Permissions 1 "không trực tiếp thay đổi bản đã chấp nhận, vì kết quả phải qua bước kiểm tra (R-033)."
- Điều chưa biết hoặc cần chọn: Needs 2 nghĩa là "kết quả phải qua kiểm tra kết quả trước" (khớp R-033 và BR-010) hay "người dùng phải giữ thì mới thành bản đã chấp nhận" (mâu thuẫn BR-010 Rule 1 với lần tạo đầu).
- Phương án:
  - A. Hiểu theo R-033. Gộp Needs 2 vào Permissions 2: "Không trực tiếp thay đổi bản đã chấp nhận; kết quả chỉ thành bản chờ duyệt hoặc bản đã chấp nhận sau kiểm tra kết quả (R-033), theo BR-010." Chủ sở hữu: R-033 (kiểm tra) và BR-010 (khi nào thành bản đã chấp nhận).
  - B. Hiểu theo nghĩa người dùng phải giữ. Giữ Needs 2, và BR-010 Rule 1 phải sửa (thuộc loại business-rules).
  - C. Bỏ Needs 2 vì Permissions 1 đã nói ý không trực tiếp thay đổi bản đã chấp nhận.
- Đề xuất: A, vì BR-010 Active đã quy định rõ lần tạo đầu, và R-033 là nơi sở hữu bước kiểm tra. Nếu chọn A hoặc C thì section `Needs / Pain Points` của ACT-002 trống (Needs 1 đã chuyển sang `Hành vi lỗi`); xem mục 6.
- Quyết định:

### ACT-L04 · SO_LIEU · Ngưỡng "chậm" và "quá thời gian" của AI provider
- Item: ACT-002; liên quan R-032, UC-014, G-04 (C-007, D-011)
- Tiêu chí: GACT-05 (mỗi cách hỏng là điều kiện fault injection), GX-08 ("chậm")
- Hiện trạng: Needs 1 "nhà cung cấp chậm, lỗi, …"; Constraints 1 "Có thể lỗi hoặc quá thời gian (R-032)". R-032 Ghi chú: "Ngưỡng quá thời gian và số lần thử lại chưa được chốt (D-011)". UC-014 Open Questions 2: "Ngưỡng quá thời gian là bao nhiêu? (đặt sau benchmark, D-011)".
- Điều chưa biết hoặc cần chọn: ngưỡng quá thời gian là bao nhiêu và item nào sở hữu con số; "chậm" là một cách hỏng riêng (chậm nhưng chưa quá thời gian, cần ngưỡng riêng) hay chính là "quá thời gian".
- Phương án:
  - A. Gộp "chậm" vào "quá thời gian". Con số do R-032 sở hữu; `Hành vi lỗi` 1 ghi "Không trả kết quả trong ngưỡng quá thời gian của R-032". Item giữ blocker tới khi R-032 có con số.
  - B. Tách hai cách hỏng: "phản hồi chậm hơn <ngưỡng cảnh báo>" và "không phản hồi trong <ngưỡng quá thời gian>", cả hai ngưỡng do R-032 sở hữu.
  - C. Chờ G-04: nếu C-007/D-011 là quy tắc sản phẩm thì chưa được đặt ngưỡng trước benchmark; `Hành vi lỗi` 1 ghi tham chiếu R-032 và để Lint cảnh báo.
- Đề xuất: A, vì sheet chỉ có một ngưỡng được nhắc tới (R-032, UC-014) và ví dụ GACT-05 dùng một ngưỡng duy nhất. Con số vẫn phải chờ benchmark; nên gộp với blocker ngưỡng của R-032 và UC-014.
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
| ACT-002 | `source` | gợi ý: DOC-001 (R-032, R-033 lấy căn cứ từ DOC-001 NFR-R02, NFR-R03), cần người dùng xác nhận |
| ACT-003 | `source` | — |

ACT-001 không có FILL_LATER: `source` lấy từ Notes 1 (DOC-001). Sheet Actors không có cột nguồn, nên `source` là field duy nhất có thể trống.

## 4. Dịch thử

### ACT-003 (đơn giản)

#### Bản gốc
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

#### Bản dịch
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

<!-- BLOCKER ACT-L01 -->

1. Tạo tài khoản.
2. Khóa tài khoản.
3. Mở khóa tài khoản.
4. Xóa tài khoản.

## Constraints

1. Quản trị viên tài khoản chỉ tồn tại khi DeckAgent có tài khoản.

## Ghi chú

1. Chưa có trong V1 vì V1 không có tài khoản (D-027).
```

#### Thay đổi
1. `Type: Secondary` → `kind: human`; không ghi vai trò secondary ở actor (GACT-02).
2. `status: Active` vì sheet không có status (quyết định của brief).
3. Không ghi Related Use Cases; UC-020 trỏ tới ACT-003 qua `primary_actor` (GACT-07, GACT-06 đạt).
4. Knowledge tách "hiểu cách tổ chức phân quyền" và "không cần kiến thức thiết kế deck" thành 2 dòng (GX-14).
5. Permissions tách thành 4 việc, mỗi việc ứng với một test phân quyền ngược (GACT-04).
6. Constraints thêm chủ ngữ "Quản trị viên tài khoản" (GX-16).
7. Bỏ section `Hành vi lỗi` vì actor là con người (template).
8. Chỗ `BLOCKER ACT-L01`: UC-020 bước 1 cho actor "xem danh sách tài khoản", chưa có trong Permissions (GACT-08).

### ACT-002 (nhiều chỗ viết lại)

#### Bản gốc
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

#### Bản dịch
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

<!-- BLOCKER ACT-L03 -->

1. Kết quả của AI không được tự động trở thành bản đã chấp nhận.

## Knowledge / Context

1. Chỉ biết dữ liệu DeckAgent gửi đi.
2. Chỉ nhận phần nội dung người dùng mà R-042 cho phép gửi ra ngoài.

## Permissions / Capabilities

<!-- BLOCKER ACT-L01 -->

1. Chỉ trả kết quả của lượt xử lý AI cho DeckAgent.
2. Không trực tiếp thay đổi bản đã chấp nhận; kết quả phải qua kiểm tra kết quả trước (R-033).

## Constraints

1. <!-- BLOCKER G-04 --> Thời gian phản hồi và chi phí của AI model hoặc nhà cung cấp AI chưa được đo (D-011).
2. V1 không cần hỗ trợ nhiều nhà cung cấp AI (R-040).

## Hành vi lỗi

1. Không trả kết quả trong ngưỡng quá thời gian (R-032). <!-- BLOCKER ACT-L04 -->
2. Trả lỗi thay vì kết quả (R-032).
3. Trả kết quả sai định dạng.
4. Thay đổi hành vi giữa các phiên bản model.
```

#### Thay đổi
1. `Type: External` → `kind: external-system` (GACT-02).
2. `status: Active` vì sheet không có status (quyết định của brief).
3. Không ghi Related Use Cases; 10 Use Case trỏ tới ACT-002 qua `supporting_actors` (relations.json, via=derived) (GACT-07, GACT-06 đạt).
4. Goal: "Nhận yêu cầu từ DeckAgent" → "Nhận dữ liệu DeckAgent gửi trong một lượt xử lý AI". Glossary định nghĩa "yêu cầu" là nội dung người dùng gõ trong chat (GL-006), nên dùng cho dữ liệu DeckAgent gửi AI là sai nghĩa; "lượt xử lý AI" theo GL-009 (GX-07).
5. Needs 1 chuyển sang `Hành vi lỗi`, tách thành 4 cách hỏng: chậm, lỗi, sai định dạng, thay đổi hành vi (GACT-05, quyết định 5). Bỏ vế "DeckAgent phải xử lý được": nghĩa này đã nằm trong định nghĩa của section `Hành vi lỗi` ("các cách actor có thể hỏng mà hệ thống phải xử lý") và do R-032 sở hữu (GX-10).
6. Constraints 1 "Có thể lỗi hoặc quá thời gian (R-032)" chuyển sang `Hành vi lỗi` 1 và 2, gộp với "chậm" và "lỗi" của Needs 1 để không lặp (GACT-05). Gộp "chậm" vào "quá thời gian" chưa được chốt: `BLOCKER ACT-L04`.
7. Needs 2 giữ nguyên văn, chờ `BLOCKER ACT-L03` (mâu thuẫn BR-010 Rule 1).
8. Knowledge 1: "những gì" → "dữ liệu" (GX-17, tránh đại từ mơ hồ).
9. Knowledge 2 viết thành tóm tắt kèm ID của chủ sở hữu, chủ ngữ là actor; bỏ cụm "phạm vi thiết kế cho phép" vì R-042 định nghĩa phạm vi đó (GX-10, GX-16, GX-08).
10. Permissions tách 1 ý ghép thành 2 dòng; "bước kiểm tra" → "kiểm tra kết quả" theo GL-021 (GACT-04, GX-07, GX-14).
11. Constraints 2: chủ ngữ ghi rõ tên actor (GX-16); giữ D-011 và gắn `BLOCKER G-04`, vì G-04 quyết định D-011 có còn trong spec sản phẩm không.
12. Constraints 3: "nhà cung cấp" → "nhà cung cấp AI" để đọc riêng câu vẫn hiểu (GX-17).
13. Bỏ `Ghi chú`: câu "nguồn của phần lớn luồng lỗi trong các UC tạo, sửa và tải về" tóm tắt lại `Hành vi lỗi` và liệt kê nhóm Use Case, mà danh sách Use Case do công cụ sinh (GX-12, GACT-07). Xem mục 6 về chữ "tải về".

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| — | — | Không có. `legacy-refs.json` không có mục nào thuộc actors; text của 3 actor không chứa `W-`, `L-`, `RK-`, `B-`, `SP-`. |

## 6. Ghi chú cho agent chính
1. **Loại blocker của ACT-L01.** Danh sách loại trong brief không có loại cho "quyền ở actor lệch với bước Use Case" (GACT-08). Tôi dùng `MAU_THUAN_QH` vì đây là mâu thuẫn giữa hai item có quan hệ `primary_actor` / `supporting_actors`. Đổi loại nếu cần.
2. **Không dùng `TRANG_THAI` cho actor.** `schema.json` chỉ cho Actor hai status: Active và Deprecated. Không có Proposed để hạ xuống, nên chỗ chưa đạt gate của actor được ghi bằng blocker nội dung (ACT-L01, ACT-L04) hoặc G-04. ACT-002 Constraints 2 ("chưa được đo") gần với GX-09, nhưng section Constraints của actor không thuộc danh sách section quy định của GX-09, và nội dung đã nằm trong G-04.
3. **Section trống sau ACT-L03.** Nếu chọn A hoặc C ở ACT-L03, `Needs / Pain Points` của ACT-002 trống. Template không ghi "xóa section nếu trống" cho section này, và schema không bắt buộc nó. Cần chọn: xóa section, hay để `<!-- FILL_LATER -->`.
4. **ACT-001 Goal còn "dùng được".** Sau khi gộp 3 ý thành 2 câu (GACT-03), cụm "deck dùng được" vẫn bị Lint GX-08 cảnh báo. Goal mô tả mong muốn, không phải tiêu chí đạt, nên tôi đề xuất người review bỏ qua cảnh báo kèm lý do. R-029 (Active) cũng dùng "deck dùng được" trong câu Yêu cầu; ở đó cụm này ảnh hưởng nghiệm thu. Nên gộp với blocker của R-029 nếu loại requirements có.
5. **Notes 1 của ACT-001.** "Là actor được DOC-001 mô tả rõ nhất" được chuyển thành `source: [DOC-001]`; phần so sánh "rõ nhất" bị bỏ vì `Ghi chú` không ghi nguồn (GX-11, GX-12). Tôi coi đây là chuyển chỗ, không phải bỏ thông tin quy định.
6. **Ghi chú của ACT-002 nhắc "tải về".** ACT-002 không nằm trong `supporting_actors` của UC-008 (tải về), và UC-008 bước 4 ghi "không để AI tạo lại nội dung". Câu ghi chú bị bỏ (mục 4, thay đổi 13), nên mâu thuẫn này không đi vào spec. ACT-002 có trong UC-014, mà UC-014 có cả lượt tạo file tải về; agent use-cases nên kiểm xem ACT-002 có thật sự tham gia UC-014 ở nhánh tải về không.
7. **GUC-12 cho agent use-cases.** Mỗi Use Case có ACT-002 phải có nhánh cho từng dòng `Hành vi lỗi`. Từ sheet: "quá thời gian" và "lỗi" ứng với nhánh "AI lỗi hoặc quá thời gian"; "sai định dạng" ứng với nhánh "Kết quả không qua kiểm tra". "Thay đổi hành vi giữa các phiên bản model" chưa có nhánh nào trong Use Case.
8. **ACT-003 và UC-020.** ACT-003 Needs 1 ghi "không can thiệp vào nội dung deck", trong khi UC-020 2A ghi xóa tài khoản thì deck bị xóa theo, và UC-020 còn câu hỏi mở "khóa tài khoản thì deck được giữ hay xóa". Không tạo blocker ở actor vì UC-020 là Draft; agent use-cases nên đối chiếu.
9. **ACT-003 Active nhưng mọi Use Case của nó là Draft/Later.** Không vi phạm GX-04: quan hệ dựa vào đi từ UC-020 tới ACT-003, không ngược lại. R-054 (Draft) cũng phát biểu cùng 4 quyền; Permissions của actor là nơi tiêu chí yêu cầu ghi quyền (GACT-08), nên tôi không coi đây là trùng sở hữu.
10. **Gợi ý gộp blocker liên loại.**
    - ACT-L04 với blocker ngưỡng quá thời gian của R-032 và UC-014 (Open Questions 2), nếu loại requirements và use-cases tạo. Cả ba cùng chờ benchmark và cùng phụ thuộc G-04.
    - ACT-L03 với bất kỳ blocker nào về BR-010 Rule 1 hoặc R-033 bên business-rules và requirements.
    - ACT-L02: R-029, D-006, D-015 đang dính G-02; nếu G-02 dẫn tới sửa hoặc đóng các item này thì phương án A của ACT-L02 phải đổi ID tham chiếu.
11. **Không dịch thử ACT-001.** ACT-001 phụ thuộc cả ACT-L01 và ACT-L02, nên bản dịch sẽ chủ yếu là marker blocker.
