# Đánh giá: glossary

Nguồn: tab `Operating Rules`, 25 dòng `GL-001`…`GL-025` (`items/glossary.json`). Đích: bảng `Thuật ngữ | Định nghĩa | Không dùng` trong `docs/specification/glossary.md`. Không có frontmatter, `_CRITERIA.md` hay `_TEMPLATE.md` riêng; tiêu chí áp dụng là quy ước đọc bảng trong `glossary.md`, GX-07 (`_COMMON_CRITERIA.md`), GX-10 và GBR-09 (`05-business-rules/_CRITERIA.md`).

`classification.json` không có dòng GL nào, nên phân loại product / project dưới đây do bước này tự làm.

## 1. Kế hoạch dịch

| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
| GL-001 | CẤU-TRÚC | Chuyển nguyên `_term`, `_definition`, `_not_use`. Từ cấm `presentation` đang nằm trong tên riêng "P3 Presentation Quality" ở D-017 (xem GL-L05) | — |
| GL-002 | CẤU-TRÚC | Chuyển nguyên. Câu thứ hai ("Chữ “trang” vẫn dùng cho tài liệu và trang web") là lưu ý phạm vi của cột Không dùng, không phải quy định; giữ vì bỏ đi thì người đọc tưởng "trang" bị cấm | — |
| GL-003 | CẤU-TRÚC | Chuyển nguyên; danh sách định dạng là tóm tắt kèm ID D-024 (GX-10 cho phép). Từ cấm `source` nằm trong tên riêng "P1 Source Fidelity" ở A-015, D-017 (GL-L05) | — |
| GL-004 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-005 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng có điều kiện trong ngoặc "reference (khi nói về deck hoặc slide mẫu)" (GX-07, quy ước cột Không dùng) | GL-L02 |
| GL-006 | VIẾT-LẠI | Đổi "Khác “Requirement” (dòng trong sheet Requirements)" thành "Khác Requirement (item trong `06-requirements/`)": sau migrate sheet không còn là nơi lưu Requirement nên câu cũ trỏ tới chỗ không tồn tại. Chỉ đổi nơi chỉ tới, không đổi nghĩa | — |
| GL-007 | CẤU-TRÚC | Chuyển nguyên. Định nghĩa dùng từ "audience" chưa có trong glossary (xem FILL_LATER) | — |
| GL-008 | VIẾT-LẠI | Đổi "Khác Constraint của project" thành "Khác Constraint (item trong `02-constraints/`)". Phần "còn hiệu lực qua các lần sửa (BR-003)" là tóm tắt kèm ID item sở hữu, giữ (GX-10) | — |
| GL-009 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-010 | CẤU-TRÚC | Chuyển nguyên; "(BR-010)" là ID item sở hữu (GX-10) | — |
| GL-011 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-012 | BLOCKER | Tách mệnh đề quy định thành câu riêng kèm ID: "Ở V1, deck chỉ tồn tại trong một lần làm việc (D-027)" (GX-10). Từ cấm `session` trùng với GL-013 | GL-L01 |
| GL-013 | BLOCKER | Đổi "(chỉ có khi product có account)" thành "(chỉ có khi DeckAgent có tài khoản)", cùng cách viết với ACT-003, UC-010 (GX-07, chỉ dịch từ tiếng Anh). Cột Không dùng có điều kiện và trùng `session` với GL-012 | GL-L01, GL-L02 |
| GL-014 | CẤU-TRÚC | Chuyển nguyên | — |
| GL-015 | CẤU-TRÚC | Chuyển nguyên; "(UC-023, Later)" giữ | — |
| GL-016 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "preview (trong câu văn)" có điều kiện | GL-L02 |
| GL-017 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "export (trong câu văn)" có điều kiện | GL-L02 |
| GL-018 | CẤU-TRÚC | Chuyển nguyên (dịch thử mục 4) | — |
| GL-019 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "style, template (khi nói về giao diện)": có điều kiện, và không rõ điều kiện áp cho `template` hay cả `style` | GL-L02, GL-L03 |
| GL-020 | CẤU-TRÚC | Chuyển nguyên. Từ cấm `brand`, `brand kit` nằm trong tên tính năng "Brand Kit" ở UC-017 (GL-L05) | — |
| GL-021 | BLOCKER | Chuyển nguyên phần định nghĩa. Cột Không dùng "validate, validation (trong câu văn)": có điều kiện, không rõ phạm vi điều kiện | GL-L02, GL-L03 |
| GL-022 | VIẾT-LẠI | Tách phần "(dùng cho sửa theo slide ở V1)" (cách dùng, không phải định nghĩa) thành câu riêng kèm ID item sở hữu (GX-10). Thuật ngữ có dấu phẩy: cột Thuật ngữ không tách theo dấu phẩy (dịch thử mục 4) | — |
| GL-023 | BLOCKER | Chuyển nguyên. Thuật ngữ "Hệ thống" và tên `DeckAgent` (schema.json `system_name`, mẫu câu GR-01) là hai tên của một khái niệm (GX-07) | GL-L04 |
| GL-024 | BLOCKER | Đổi "AI model/provider bên ngoài" thành "model AI của nhà cung cấp bên ngoài" (bỏ dấu `/`, dùng "nhà cung cấp" như ACT-002). Cột Không dùng "LLM, agent (khi nói về phần AI bên trong DeckAgent)": có điều kiện, không rõ phạm vi điều kiện | GL-L02, GL-L03 |
| GL-025 | XÓA | Thuật ngữ vận hành dự án: công cụ AI viết code của thành viên (Claude Code), ví dụ đạt nói về PR. Xóa làm mất xung đột "Agent" là thuật ngữ của GL-025 nhưng là từ cấm (có điều kiện) của GL-024 | — |

## 2. Blocker cục bộ

### GL-L01 · TRUNG_SO_HUU · Từ cấm "session" thuộc hai thuật ngữ

- Item: GL-012 (lần làm việc), GL-013 (phiên đăng nhập)
- Tiêu chí: quy ước `glossary.md` (mỗi dòng một khái niệm), GX-07
- Hiện trạng: GL-012 Không dùng "session, phiên làm việc, working state"; GL-013 Không dùng "session (khi nói về đăng nhập)". Hiện chưa item nào dùng "session" (0 lần).
- Điều chưa biết hoặc cần chọn: khi Lint gặp "session", từ này thay bằng thuật ngữ nào. Bảng hiện tại gán một từ cấm cho hai thuật ngữ.
- Phương án:
  - A. Giữ "session" ở cả hai dòng. Lint báo một lần và gợi ý cả hai thuật ngữ; người review chọn theo ngữ cảnh. Cần thêm một dòng vào quy ước đọc bảng: "một từ có thể bị cấm ở nhiều dòng; khi đó Lint gợi ý mọi thuật ngữ tương ứng".
  - B. Chỉ GL-012 giữ "session"; GL-013 Không dùng thành `—`. Mất thông tin "session" về đăng nhập phải gọi là "phiên đăng nhập".
  - C. Chỉ GL-013 giữ "session"; GL-012 bỏ "session". Mất thông tin "session" theo nghĩa lần làm việc bị cấm.
- Đề xuất: A, vì không mất thông tin của dòng nào và không cần Lint hiểu ngữ cảnh. Phụ thuộc GL-L02: nếu GL-L02 chọn B (bỏ từ có điều kiện) thì GL-013 tự mất "session" và blocker này đóng theo.
- Quyết định:

### GL-L02 · SCHEMA · Từ cấm có điều kiện trong ngoặc ở cột Không dùng

- Item: GL-005, GL-013, GL-016, GL-017, GL-019, GL-021, GL-024 (GL-025 cũng có nhưng bị xóa)
- Tiêu chí: quy ước `glossary.md` ("cột Không dùng liệt kê các từ đồng nghĩa bị loại, cách nhau bằng dấu phẩy"), GX-07 (Lint)
- Hiện trạng: "reference (khi nói về deck hoặc slide mẫu)", "session (khi nói về đăng nhập)", "preview (trong câu văn)", "export (trong câu văn)", "template (khi nói về giao diện)", "validation (trong câu văn)", "agent (khi nói về phần AI bên trong DeckAgent)".
- Điều chưa biết hoặc cần chọn: định dạng hiện tại chỉ cho danh sách từ, Lint so chữ nên không xét được điều kiện. Bỏ điều kiện thì lệnh cấm thành tuyệt đối (đổi nghĩa: ví dụ "template PPTX" ở UC-017, nhãn nút "Export"/"Preview", tên sản phẩm "PowerPoint Agent"); bỏ cả từ thì mất thông tin.
- Phương án:
  - A. Giữ điều kiện trong ngoặc ngay sau từ, như sheet. Sửa quy ước đọc bảng của `glossary.md`: "Từ có thể kèm điều kiện trong ngoặc; Lint so phần trước ngoặc và hiện điều kiện trong cảnh báo để người review quyết định". GX-07 là Lint nên báo sai được chấp nhận.
  - B. Bỏ các từ có điều kiện khỏi cột Không dùng, chuyển điều kiện vào Định nghĩa dạng "Từ “preview” không dùng trong câu văn". Lint không bắt được các từ này nữa.
  - C. Bỏ điều kiện, cấm tuyệt đối. Đổi nghĩa; kéo theo viết lại UC-017 (template PPTX), UC-001, UC-004 (tên sản phẩm có "Agent").
- Đề xuất: A, vì giữ nguyên nghĩa, Lint vẫn bắt được từ, và chỉ phải sửa một dòng quy ước trong chính `glossary.md`.
- Quyết định:

### GL-L03 · SCHEMA · Điều kiện ở cuối danh sách áp cho từ nào

- Item: GL-019, GL-021, GL-024
- Tiêu chí: quy ước `glossary.md`, GX-07
- Hiện trạng: "style, template (khi nói về giao diện)"; "validate, validation (trong câu văn)"; "LLM, agent (khi nói về phần AI bên trong DeckAgent)".
- Điều chưa biết hoặc cần chọn: điều kiện trong ngoặc chỉ áp cho từ đứng ngay trước, hay cho cả danh sách của dòng. Hai cách hiểu cho kết quả Lint khác nhau (ví dụ "style" ở UC-007 bị cấm tuyệt đối hay chỉ khi nói về giao diện).
- Phương án:
  - A. Điều kiện áp cho cả dòng. Viết lại: "style (khi nói về giao diện), template (khi nói về giao diện)"; "validate (trong câu văn), validation (trong câu văn)"; "LLM (khi nói về phần AI bên trong DeckAgent), agent (khi nói về phần AI bên trong DeckAgent)".
  - B. Điều kiện chỉ áp cho từ cuối; từ trước bị cấm tuyệt đối. Giữ nguyên chữ.
  - C. Chọn riêng từng dòng (ví dụ "LLM" và "validate" cấm tuyệt đối vì không có nghĩa khác trong sản phẩm; "style" theo điều kiện).
- Đề xuất: C, theo gợi ý: `style` có điều kiện (cùng nhóm nghĩa với template), `validate` có điều kiện (cùng gốc với validation), `LLM` cấm tuyệt đối (trong DeckAgent luôn chỉ phần AI). Đây là chọn cách hiểu nên cần người dùng duyệt. Chỉ cần quyết khi GL-L02 chọn A.
- Quyết định:

### GL-L04 · SCHEMA · "Hệ thống" và "DeckAgent" là hai tên của một khái niệm

- Item: GL-023; ảnh hưởng mọi Requirement (mẫu câu GR-01) và 56 item đang dùng "Hệ thống"
- Tiêu chí: GX-07 ("một khái niệm có nhiều tên"), GR-01 (tên hệ thống lấy từ `schema.json`)
- Hiện trạng: GL-023 "Dùng “Hệ thống”" với định nghĩa "DeckAgent nói chung, gồm giao diện và xử lý phía sau". `schema.json` có `"system_name": "DeckAgent"`, và brief đã chốt câu Yêu cầu của Requirement viết "DeckAgent phải …". "DeckAgent" xuất hiện 102 lần trong item, "Hệ thống" ở 56 item.
- Điều chưa biết hoặc cần chọn: hai tên có được cùng tồn tại không, và nếu có thì phân vai thế nào.
- Phương án:
  - A. Giữ GL-023. Coi "DeckAgent" là tên riêng, không phải từ đồng nghĩa bị loại: câu Yêu cầu dùng `DeckAgent` theo `schema.json`; section khác dùng "Hệ thống". Định nghĩa GL-023 giữ nguyên (đã nêu DeckAgent là đối tượng được gọi).
  - B. Đổi `system_name` thành "Hệ thống" để mọi nơi dùng một tên. Câu Yêu cầu thành "Hệ thống phải …"; kéo theo sửa `schema.json`.
  - C. Đổi thuật ngữ GL-023 thành "DeckAgent", đưa "Hệ thống" vào Không dùng. Kéo theo viết lại 56 item.
- Đề xuất: A, vì không phải sửa item hay schema; tên riêng của sản phẩm khác bản chất với từ đồng nghĩa trong cột Không dùng.
- Quyết định:

### GL-L05 · SCHEMA · Từ cấm nằm trong tên riêng hoặc tên tính năng của sản phẩm khác

- Item: D-017, A-015, R-009 (tên nguyên tắc chất lượng); UC-001, UC-004, UC-007, UC-017 (Product Reference, Open Questions). Liên quan GL-001, GL-003, GL-007, GL-019, GL-020, GL-024
- Tiêu chí: GX-07
- Hiện trạng: "P1 Source Fidelity, P2 User Intent Fidelity, P3 Presentation Quality" (D-017.Decision, A-015.Ghi chú, R-009.Ghi chú); "PowerPoint Agent", "Gamma Agent" (UC-001, UC-004 Product Reference); "dùng template hoặc deck mẫu làm nguồn style, layout" (UC-007 Product Reference, mô tả Copilot); "Brand Kit", "template riêng" (UC-017 Product Reference); "Có nhận template PPTX làm bộ nhận diện không?" (UC-017 Open Questions).
- Điều chưa biết hoặc cần chọn: tên riêng (nguyên tắc P1–P5, tên sản phẩm, tên tính năng của đối thủ) có được miễn GX-07 không. Đổi tên P1–P5 là đổi tên khái niệm đang được trích ở nhiều item, không phải chỉ viết lại câu.
- Phương án:
  - A. Miễn GX-07 cho tên riêng và trích dẫn tên tính năng sản phẩm khác: viết trong backtick hoặc ngoặc kép, Lint bỏ qua; người review xác nhận. Không đổi tên P1–P5.
  - B. Việt hóa tên nguyên tắc (ví dụ "P1 Trung thực với tài liệu có sẵn") và mô tả tính năng đối thủ bằng thuật ngữ glossary. Cần người dùng đặt tên mới.
  - C. Giữ nguyên chữ, không miễn; người review bỏ qua cảnh báo từng lần với lý do.
- Đề xuất: A, vì giữ tên gốc để tra cứu được, không cần đặt tên mới. "template PPTX" ở UC-017 Open Questions là file mẫu PPTX, không phải giao diện; chỉ cần quyết theo GL-L02/GL-L03.
- Quyết định:

## 3. FILL_LATER

Glossary không có field hay section mới. Mục này ghi **thuật ngữ sản phẩm đang dùng nhiều trong item nhưng chưa có trong glossary**. Thêm thuật ngữ là thông tin mới nên chỉ là gợi ý, không phải blocker. Cột ID ghi `(mới)`; số trong ngoặc là số item đang dùng (đếm trên các cột text sẽ migrate).

Các cụm agent chính nêu làm ví dụ ("bản chờ duyệt", "bản đã chấp nhận", "lượt xử lý AI", "lần làm việc", "tài liệu có sẵn", "deck mẫu") **đã có** trong glossary (GL-011, GL-010, GL-009, GL-012, GL-003, GL-005); lần lượt dùng ở 18, 27, 13, 24, 29, 7 item.

| ID | Field/Section | Gợi ý |
|---|---|---|
| (mới) | Thuật ngữ "ranh giới commit" (6: BR-010, D-030, R-024, R-031, R-046, UC-004) | gợi ý: "Thời điểm ngay trước khi lượt xử lý AI cho một yêu cầu sửa mới bắt đầu; tại đó bản chờ duyệt hiện tại trở thành bản đã chấp nhận (BR-010)". Không dùng: — . Có từ tiếng Anh "commit"; cân nhắc tên tiếng Việt |
| (mới) | Thuật ngữ "lần sửa" (24) / "lượt sửa" (8) | gợi ý: chọn một tên. Hai cụm đang dùng song song, và "lần sửa" có trong định nghĩa GL-008, GL-010, GL-014, GL-015. Quan hệ với "lượt xử lý AI" cần người dùng nói rõ |
| (mới) | Thuật ngữ "sửa theo slide" (5: A-021, BR-011, D-014, D-025, UC-023) | gợi ý: "Lần sửa nhắm vào một slide ở V1, ở mức cố gắng, không đảm bảo; khác sửa cục bộ (D-025, BR-011)". Đang được GL-022 nhắc tới mà chưa định nghĩa |
| (mới) | Thuật ngữ "tập ràng buộc" (4: BR-010, D-030, R-024, UC-004) | gợi ý: "Các ràng buộc của người dùng gắn với một bản deck (BR-010)" |
| (mới) | Thuật ngữ cho Undo (Undo 4: BR-005, D-025, R-016, R-031; "hoàn tác" 1: UC-022) | gợi ý: chọn "hoàn tác" làm thuật ngữ, Không dùng: Undo. Hai tên cho một khái niệm (GX-07) |
| (mới) | Thuật ngữ "thành phần" (16) | gợi ý: "Một phần tử trong slide như tiêu đề, đoạn chữ, hình ảnh, biểu đồ". Đang dùng trong định nghĩa GL-015 |
| (mới) | Thuật ngữ "tài khoản" (11) | gợi ý: "Danh tính người dùng để lưu deck qua nhiều lần làm việc; chỉ có khi DeckAgent có tài khoản (ACT-003)". GL-013 phụ thuộc khái niệm này |
| (mới) | Thuật ngữ "deck đã lưu" (7), "bản sao" (5), "lịch sử" (6) | gợi ý: định nghĩa cùng nhóm tính năng có tài khoản (BR-015, BR-016, UC-012, UC-022) |
| (mới) | Thuật ngữ "vai trò của file" (5) và "hình ảnh để chèn" (3) | gợi ý: "Vai trò của file: tài liệu có sẵn, deck có sẵn, deck mẫu hoặc hình ảnh để chèn, xác định theo mục đích trong yêu cầu (BR-001)" |
| (mới) | Thuật ngữ "audience" (12) | gợi ý: thêm thuật ngữ (giữ "audience" hoặc chọn "người nghe"). Đang dùng trong định nghĩa GL-007, GL-014 |
| (mới) | Thuật ngữ "phạm vi sửa" (3: A-012, BR-004, R-022) | gợi ý: "Phần deck mà một lần sửa được phép thay đổi (BR-004)" |
| (mới) | "lượt tạo" (3), "lượt tải về" (3) | gợi ý: quyết có phải là "lượt xử lý AI" (tạo) và một khái niệm riêng (tải về) không |
| GL-023 | Không dùng: "ứng dụng" (15 item) | gợi ý: "ứng dụng" là bản tiếng Việt của "app" (đã cấm). Thêm vào Không dùng hoặc ghi rõ được dùng khi nói về phần giao diện. Lưu ý GL-012, GL-016 đang dùng "ứng dụng" trong định nghĩa |

GBR-09 (Lint, áp từ Proposed): các Business Rule Active đang dùng danh từ chưa có trong glossary và sẽ bị Lint cảnh báo: BR-001 (vai trò của file, hình ảnh để chèn), BR-003, BR-017 (lần sửa), BR-005 (lượt tạo), BR-010 (ranh giới commit, tập ràng buộc, cơ sở khôi phục, lượt tải về, lần sửa), BR-011 (sửa theo slide, lượt sửa), BR-013 (thành phần); BR-015, BR-016, BR-018 (deck đã lưu, bản sao, lịch sử, tài khoản; Proposed/Draft).

## 4. Dịch thử

### GL-018 (đơn giản)

#### Bản gốc

| Cột sheet | Nội dung |
|---|---|
| Nhóm | dàn ý |
| Quy tắc chuẩn | Dùng “dàn ý”. |
| Ý nghĩa / Cách hiểu | Danh sách slide và ý chính trước khi AI tạo nội dung chi tiết. |
| Ví dụ đạt | Duyệt dàn ý trước khi tạo deck. |
| Ví dụ chưa đạt | Không dùng: outline |

#### Bản dịch

```markdown
| dàn ý | Danh sách slide và ý chính trước khi AI tạo nội dung chi tiết. | outline |
```

#### Thay đổi

1. `Nhóm` → cột Thuật ngữ; `Ý nghĩa / Cách hiểu` → cột Định nghĩa; phần sau "Không dùng:" → cột Không dùng (ánh xạ của brief).
2. Bỏ `Rule ID`, `Quy tắc chuẩn`, `Ví dụ đạt`, `Sheet`, `Cột`, `Áp dụng cho`: bảng `glossary.md` không có cột tương ứng.
3. Không viết lại câu nào. Định nghĩa không chứa từ cấm của dòng khác (GX-07).

### GL-022 (nhiều chỗ viết lại)

#### Bản gốc

| Cột sheet | Nội dung |
|---|---|
| Nhóm | cố gắng, không đảm bảo |
| Quy tắc chuẩn | Dùng “cố gắng, không đảm bảo”. |
| Ý nghĩa / Cách hiểu | Hệ thống thử làm đúng nhưng không cam kết kết quả (dùng cho sửa theo slide ở V1). |
| Ví dụ đạt | Sửa theo slide ở V1 là cố gắng, không đảm bảo. |
| Ví dụ chưa đạt | Không dùng: best effort |

#### Bản dịch

```markdown
| cố gắng, không đảm bảo | Mức cam kết trong đó Hệ thống thử làm đúng nhưng không cam kết kết quả. Ở V1, sửa theo slide ở mức này (D-025, BR-011). | best effort |
```

#### Thay đổi

1. Tách phần trong ngoặc "(dùng cho sửa theo slide ở V1)" thành câu riêng. Phần này nói nơi khái niệm được áp dụng, không phải định nghĩa; để trong ngoặc thì đọc như một quy định ẩn (GX-10).
2. Thêm "Mức cam kết trong đó" ở đầu để câu định nghĩa có danh từ chính (định nghĩa một khái niệm, không phải mô tả hành vi). Không đổi nghĩa.
3. Thêm ID item sở hữu "(D-025, BR-011)": GX-10 yêu cầu tóm tắt quy định ở nơi khác phải kèm ID của item sở hữu. Hai ID lấy từ A-021.Ghi chú ("D-025 tạo phạm vi test…; sửa theo slide chỉ ở mức cố gắng, không đảm bảo") và UC-023.Ghi chú ("(UC-004, BR-011)"). Nếu agent chính coi việc thêm ID là thêm thông tin thì bỏ ngoặc này.
4. "sửa theo slide" chưa có trong glossary: để nguyên chữ, ghi vào FILL_LATER (thêm thuật ngữ là thông tin mới).
5. Thuật ngữ chứa dấu phẩy. Quy ước của `glossary.md` chỉ tách theo dấu phẩy ở cột Không dùng, nên giữ nguyên tên. Công cụ Lint (GBR-09) phải coi cả ô Thuật ngữ là một cụm (ghi ở mục 6).
6. Bỏ `Quy tắc chuẩn`, `Ví dụ đạt` và các cột meta như GL-018.

## 5. Tham chiếu tới loại cũ

`legacy-refs.json` không có tham chiếu nào thuộc glossary. Định nghĩa của GL-003, GL-004, GL-005, GL-008, GL-010, GL-012, GL-014, GL-015, GL-021, GL-024 trích D-024, UC-003, UC-007, BR-003, BR-010, D-027, D-025, UC-023, R-033, ACT-002; tất cả đều là item `product` trong `classification.json`, giữ nguyên.

GL-ID sẽ không còn sau migrate (bảng `glossary.md` không có cột ID), nên tham chiếu tới GL-ID trong item khác phải xử lý:

| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
| UC-010.Ghi chú | "“Phiên đăng nhập” khác “lần làm việc” (GL-012, GL-013)." | giữ làm text: "“Phiên đăng nhập” khác “lần làm việc” (xem `glossary.md`)." Không mất nghĩa vì hai thuật ngữ được gọi bằng tên |

## 6. Ghi chú cho agent chính

### Phạm vi viết lại do từ cấm (GX-07)

Đếm trên các cột text sẽ migrate của mọi `items/*.json` (bỏ cột quan hệ, ID, enum và các cột bị bỏ như Related Work, Impacts). So khớp không phân biệt hoa thường, theo ranh giới từ ("DeckAgent" không khớp "agent").

| Từ cấm (dòng GL) | Số item | Item product / unclear | Item project (sẽ xóa) | Ghi chú |
|---|---|---|---|---|
| presentation (GL-001) | 1 | D-017 | — | Tên riêng "P3 Presentation Quality" → GL-L05 |
| source (GL-003) | 2 | A-015, D-017 | — | Tên riêng "P1 Source Fidelity" → GL-L05 |
| intent (GL-007) | 2 | D-017, R-009 | — | Tên riêng "P2 User Intent Fidelity" → GL-L05 |
| style (GL-019) | 1 | UC-007 | — | Product Reference mô tả Copilot → GL-L03, GL-L05 |
| template (GL-019) | 2 | UC-007, UC-017 | — | UC-017 Open Questions "template PPTX" là file mẫu, không phải giao diện → GL-L02 |
| brand, brand kit (GL-020) | 1 | UC-017 | — | Tên tính năng "Brand Kit" của Copilot, OpenSlide → GL-L05 |
| agent (GL-024) | 8 | C-006, UC-001, UC-004 | A-002, A-006, D-001, D-003, D-004 | C-006 "kiến trúc agent" (unclear, G-04) cần viết lại nếu C-006 được giữ; UC-001, UC-004 là tên sản phẩm → GL-L05; 5 item project dùng "Agent" theo nghĩa GL-025, xóa cùng GL-025 |
| Các từ còn lại | 0 | — | — | draft, working artifact, bài trình chiếu, page, trang slide, content source, tài liệu nguồn, existing presentation, imported artifact, reference deck, reference, prompt, instruction, user constraint, active constraint, operation, generation, AI operation, accepted state, authoritative state, pending result, kết quả chờ review, session, phiên làm việc, working state, deck-level refinement, refine, localized editing, element-level editing, scoped modification, preview, export, outline, validate, validation, best effort, app, tool, platform, LLM |

Tổng: 8 item product/unclear có từ cấm (A-015, C-006, D-017, R-009, UC-001, UC-004, UC-007, UC-017). Ngoại trừ C-006 ("kiến trúc agent") và "template PPTX" ở UC-017.Open Questions, mọi chỗ khớp đều là tên riêng hoặc trích sản phẩm khác (GL-L05). Item đã được viết khá sạch theo glossary trước đó; phạm vi viết lại do GX-07 nhỏ.

### Giả định đã tự đặt

1. Lint GX-07 chỉ quét phần nội dung (body) của item, không quét frontmatter, tên field hay giá trị enum. Nếu không, `draft` (GL-001) sẽ khớp status `Draft`, `source` (GL-003) khớp field `source`, `template` khớp `_TEMPLATE.md`. Cần ghi điều này vào đặc tả validator.
2. Cột Thuật ngữ không bị tách theo dấu phẩy (GL-022 "cố gắng, không đảm bảo").
3. GL-025 xếp `XÓA` (không phải `XOA_ITEM`) vì định nghĩa và ví dụ đạt ("Agent phải chạy test trước khi mở PR") nói rõ là công cụ viết code của thành viên. Không dòng GL nào khác là thuật ngữ vận hành dự án; dòng `unclear`: 0.
4. "Áp dụng cho: Toàn bộ Project Hub" ở mọi dòng là phạm vi áp dụng trong sheet, không phải nội dung thuật ngữ; bỏ.

### Việc khác khi ghi `glossary.md`

1. Xóa dòng `[VÍ DỤ] Đơn đặt vé` và câu "Chưa có thuật ngữ thật…" theo quy ước của chính file.
2. Thứ tự dòng: giữ theo GL-ID (nhóm theo deck → đầu vào → xử lý → đầu ra → hệ thống), vì bảng không có cột ID để sắp lại.
3. Nếu GL-L02 chọn A hoặc GL-L01 chọn A, sửa đoạn "Quy ước đọc bảng" của `glossary.md` trong cùng PR.
4. GL-006 "yêu cầu" (nội dung người dùng gõ trong chat) trùng chữ với heading `Yêu cầu` của Requirement và động từ "yêu cầu". Lint không bị ảnh hưởng vì "yêu cầu" không nằm ở cột Không dùng; chỉ là rủi ro đọc nhầm. Không tạo blocker; nếu muốn đổi tên thuật ngữ (ví dụ "yêu cầu trong chat") thì đó là thông tin mới.

### Gợi ý gộp blocker với loại khác

1. GL-L05 nên gộp với đánh giá decisions (D-017 sở hữu tên P1–P5) và use-cases (Product Reference của UC-001, UC-004, UC-007, UC-017), vì quyết định áp cho text của các item đó.
2. GL-L04 liên quan đánh giá requirements (mẫu câu GR-01 với `DeckAgent`).
3. C-006 "kiến trúc agent" đã thuộc G-04; nếu G-04 giữ C-006 thì thêm việc viết lại theo GL-024 (phụ thuộc GL-L02/GL-L03).
