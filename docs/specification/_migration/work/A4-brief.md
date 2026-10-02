# Brief cho subagent A4 + A5 (đánh giá nội dung và dịch thử một loại item)

Bạn đánh giá **một loại item** của DeckAgent trước khi migrate từ Google Sheet sang spec dạng file. Đây là Pha A: **chỉ đánh giá và lập kế hoạch, không ghi spec thật**.

## Được ghi đúng một file

`docs/specification/_migration/work/assess-<loại>.md`. Không tạo, sửa hay xóa file nào khác. Không chạy git. Không đọc file xlsx (dữ liệu đã được xuất ra JSON).

## Đầu vào (đọc hết trước khi đánh giá)

Đường dẫn tương đối từ gốc repo `C:\Users\Duy\Desktop\DeckAgent`:
1. `docs/specification/_COMMON_CRITERIA.md`
2. `docs/specification/<folder loại>/_CRITERIA.md` và `_TEMPLATE.md`
3. `docs/specification/schema.json` (phần của loại mình)
4. `docs/specification/_migration/work/items/<loại>.json`: dữ liệu gốc, key là tên cột sheet
5. `docs/specification/_migration/work/relations.json`: lọc các quan hệ có `source` hoặc `target` là item của loại mình. Quan hệ đã được lật chiều; `column` là cột gốc, `via` = direct / flipped / derived
6. `docs/specification/_migration/work/relation-issues.json`: GX-04, mâu thuẫn, level của UC, kind của actor
7. `docs/specification/_migration/work/classification.json`: phân loại product / project / unclear của từng item (A2)
8. `docs/specification/_migration/work/global-blockers.md`: blocker liên loại đã có (`G-xx`). **Không tạo lại**, chỉ tham chiếu
9. `docs/specification/_migration/work/items/glossary.json`: thuật ngữ (`_term`, `_definition`, `_not_use`)
10. `docs/specification/_migration/work/legacy-refs.json`: tham chiếu tới loại cũ trong text
11. Khi cần đối chiếu trùng nội dung với loại khác (GX-10), được đọc `items/<loại khác>.json`

## Quyết định đã chốt (không hỏi lại, không thành blocker)

1. Nội dung được **viết lại** cho đạt gate (mẫu câu, đơn nhất, thuật ngữ glossary, bỏ từ mơ hồ), **không đổi nghĩa, không thêm thông tin**. Chỗ chỉ đạt gate được khi phải bịa thông tin (con số, biên, giới hạn), phải chọn giữa các cách hiểu, hoặc phải tạo, xóa hay đổi ID → **blocker**.
2. Chỉ giữ item về sản phẩm. Item `project` sẽ bị xóa (vẫn ghi vào bảng kế hoạch với Nhóm = `XÓA`). Item `unclear` đã có blocker `G-xx`.
3. Field hoặc section mới mà sheet không có (ví dụ `verification`, `inputs`, `imposed_by`, Bảo đảm tối thiểu, Phương án đã xét, Hệ quả, Xác nhận tuân thủ, Cách kiểm chứng, Cách kiểm tuân thủ, Nếu sai) **để trống và ghi vào FILL_LATER**. Không phải blocker. Được ghi gợi ý, đánh dấu "gợi ý:". Ngoại lệ: nếu nội dung cho field/section đó **đã nằm sẵn** trong cột khác của sheet thì chuyển chỗ (không phải bịa) và ghi rõ là chuyển từ cột nào.
4. "Requirement chính" của Decision được ánh xạ vào `addresses` và gắn cờ cho từng Decision để người dùng duyệt (addresses hay shapes).
5. Chuyển chỗ được phép (không tính là thêm thông tin): ý về lỗi của actor hệ thống bên ngoài → `Hành vi lỗi`; ý "nếu sai thì…" trong Ghi chú của Assumption → `Nếu sai`; phương án thay thế trong Context/Rationale của Decision → `Phương án đã xét`; Constraint.Reason/Context → `Lý do không đổi được`. Đặt `short_name` mới từ câu phát biểu không tính là thêm thông tin.
6. Status: item **Active** mà sau khi dịch vẫn không đạt GX-09 (còn TBD, "chưa chốt", câu hỏi mở ảnh hưởng hành vi, ngưỡng chưa có) → blocker `TRANG_THAI` (giữ Active rồi bổ sung, hay hạ Proposed). Section bắt buộc mới bị để trống theo quyết định 3 **không** tính vào GX-09.

## Bảng ánh xạ cột → spec

Xem phần của loại mình ở cuối file này.

## Việc phải làm với **mỗi item** (A4)

1. Xếp vào đúng một nhóm:
   - `CẤU-TRÚC`: chỉ chuyển vào template, không phải viết lại câu;
   - `VIẾT-LẠI`: tóm tắt 1–2 dòng sẽ sửa gì, kèm ID tiêu chí (ví dụ "Tách câu Yêu cầu theo mẫu EARS (GR-01); bỏ 'phù hợp' (GX-08)");
   - `BLOCKER`: có ít nhất một blocker; vẫn ghi phần sẽ viết lại;
   - `XÓA`: item `project` (A2).
2. Liệt kê field/section phải để trống → FILL_LATER.
3. Kiểm và tạo blocker (ID cục bộ `<TIỀN TỐ>-Lnn`, ví dụ `R-L01`):
   - `TRANG_THAI`: Active nhưng sẽ không đạt GX-09;
   - `TRUNG_SO_HUU`: trùng nội dung quy định với item khác (GX-10), kể cả khác loại. Ghi cả hai ID và đề xuất item nào sở hữu;
   - `TACH_ITEM`: cụm phải tách thành nhiều item (GR-04, GA-02, GBR-03, GD-01). Tách tạo ID mới nên luôn là blocker;
   - `SO_LIEU`: câu thoát hoặc con số / biên / ngưỡng còn thiếu (GR-08, GR-09, GR-11, GC-08), khi không có trong sheet;
   - `THAM_CHIEU_LOAI_CU`: tham chiếu tới `W-`, `L-`, `RK-`, `B-`, `SP-` trong text hoặc `source` **mà không tự xử lý được** (xem mục dưới);
   - `MAU_THUAN_QH`, `THAM_CHIEU_GAY`, `PHU_THUOC_DONG`, `PHU_THUOC_XOA`, `XOA_ITEM`, `DOI_LOAI`, `SCHEMA`: chỉ khi phát hiện điều **mới** chưa có trong `global-blockers.md`.
4. **Một điều cần hỏi = một blocker**, kể cả khi nhiều item cùng bị ảnh hưởng: gom chung, liệt kê các item. Ví dụ: 15 requirement cùng thiếu ngưỡng vì cùng chờ một benchmark → một blocker; 15 requirement thiếu 15 con số độc lập → nên gom theo câu hỏi thật sự cần người dùng trả lời (ví dụ theo nhóm: "giới hạn kích thước tài liệu đầu vào"), không gom tùy tiện.
5. Tham chiếu loại cũ: với mỗi tham chiếu trong `legacy-refs.json` thuộc loại mình, đề xuất một trong: **bỏ** (chỉ là ghi chú quy trình), **giữ làm text** (mô tả lại không có ID, không mất nghĩa), hoặc **blocker** `THAM_CHIEU_LOAI_CU` (mất ID làm mất thông tin cần cho hành vi hoặc nguồn).

## Dịch thử (A5)

Chọn **2 item**: một item đơn giản (nên là `CẤU-TRÚC`) và một item có nhiều chỗ cần viết lại. Không chọn item `XÓA`. Với mỗi item:
1. Bản gốc: các cột liên quan của sheet (trích nguyên văn).
2. Bản dịch hoàn chỉnh theo `_TEMPLATE.md` (frontmatter + mọi section; section mới không có dữ liệu thì ghi `<!-- FILL_LATER -->`; blocker chưa quyết thì ghi `<!-- BLOCKER <id> -->` tại chỗ đó, không tự chọn).
3. Danh sách từng thay đổi, mỗi dòng kèm ID tiêu chí.

## Định dạng file `assess-<loại>.md` (bắt buộc đúng heading)

```
# Đánh giá: <loại>

## 1. Kế hoạch dịch
| ID | Nhóm | Thay đổi dự kiến (tiêu chí) | Blocker |
|---|---|---|---|
(mỗi item đúng một dòng, theo thứ tự ID; cột Blocker ghi ID cục bộ và/hoặc G-xx, hoặc —)

## 2. Blocker cục bộ
### <ID cục bộ> · <loại blocker> · <tiêu đề ngắn>
- Item: …
- Tiêu chí: …
- Hiện trạng: <trích ngắn nội dung gốc>
- Điều chưa biết hoặc cần chọn: …
- Phương án:
  - A. …
  - B. …
- Đề xuất: A, vì …
- Quyết định:

## 3. FILL_LATER
| ID | Field/Section | Gợi ý |
|---|---|---|
(gợi ý ghi "gợi ý: …" hoặc để "—")

## 4. Dịch thử
### <ID> (đơn giản)
#### Bản gốc
#### Bản dịch
#### Thay đổi
### <ID> (nhiều chỗ viết lại)
…

## 5. Tham chiếu tới loại cũ
| Vị trí | Tham chiếu | Đề xuất |
|---|---|---|
(Vị trí = `<ID>.<cột>`)

## 6. Ghi chú cho agent chính
(điều không làm được, giả định đã tự đặt, gợi ý gộp blocker với loại khác)
```

Riêng **decisions** thêm:

```
## 7. Decision cần duyệt addresses hay shapes
| D-ID | Requirement | Đề xuất | Lý do |
|---|---|---|---|
(một dòng cho mỗi cặp D–R lấy từ cột "Requirement chính"; Đề xuất = addresses hoặc shapes)
```

Ô "Quyết định:" luôn để trống. Viết bằng tiếng Việt, giọng văn như các file criteria. Không đọc file xlsx. Kết thúc bằng một tin nhắn ngắn: số item theo nhóm, số blocker theo loại, đường dẫn file.

---

## Bảng ánh xạ theo loại

Cột "Lật" nghĩa là quan hệ đang nằm ở phía mà hợp đồng quan hệ không cho ghi; script đã ghi sang item kia trong `relations.json`.

### actors (tab `Actors`, folder `01-actors`)
| Cột sheet | Đích |
|---|---|
| ID | `id` |
| Actor | `name` |
| Type | `kind`: Primary và Secondary → `human`; External và System → `external-system` |
| Goal / Needs / Pain Points / Knowledge / Context / Permissions / Capabilities / Constraints | section cùng tên (template gộp: `Needs / Pain Points`, `Knowledge / Context`, `Permissions / Capabilities`) |
| Notes | `Ghi chú` |
| Related Use Cases | Không ghi. Đã dùng để suy ra `supporting_actors` của UC (relations.json, via=derived) |

Sheet không có status: dùng `Active`. Actor hệ thống bên ngoài cần section `Hành vi lỗi`: chuyển các ý về lỗi đang nằm trong Needs hoặc Constraints sang.

### constraints (tab `Constraints`, folder `02-constraints`)
| Cột sheet | Đích |
|---|---|
| ID, Status, Type | `id`, `status`, `type` |
| Constraint | section `Constraint`; `short_name` đặt mới |
| Reason / Context | `Lý do không đổi được` |
| Review Trigger | `Review Trigger` |
| Ghi chú | `Ghi chú` |
| Căn cứ | `source` |
| Impacts | Bỏ |
| Related Requirements | Lật → `constraints` của R |
| Related Decisions | Lật → `constraints` của D |

### assumptions (tab `Assumptions`, folder `03-assumptions`)
| Cột sheet | Đích |
|---|---|
| ID, Status | `id`, `status` |
| Assumption | section `Assumption`; `short_name` đặt mới |
| Review Trigger | `Signpost` |
| Căn cứ | `source` |
| Ghi chú | `Ghi chú`. Ý dạng "nếu sai thì…" chuyển sang `Nếu sai` |
| Impacts | Bỏ |
| Related Work (IDs) | Bỏ |
| Used By (IDs) | Lật → `assumptions` của R hoặc D |

### use-cases (tab `Use Cases`, folder `04-use-cases`)
| Cột sheet | Đích |
|---|---|
| ID, Use Case, Release Scope, Status | `id`, `title`, `scope`, `status` |
| Primary Actor | `primary_actor` |
| Tình huống | `Tình huống` |
| Goal / Outcome | `Mục tiêu` |
| Trigger / Preconditions / Main Flow / Alternative / Failure Flows / Postconditions | section cùng tên |
| Open Questions | `Câu hỏi mở` |
| Product Reference | `Sản phẩm tham khảo` |
| Ghi chú | `Ghi chú` |
| Căn cứ | `source` |
| Related Constraints | `constraints` |
| Related Requirements | Lật → `use_cases` của R |
| Related Business Rules | Lật → `use_cases` của BR (đã gộp với BR.Related Use Cases) |
| Related Work | Bỏ |
| Quan hệ UC | Đã parse: `include`, `extend`, `follows`, `split_from`, `related` (giải thích trong Ghi chú nếu có). Chiều ngược chỉ dùng đối chiếu |

`level` = `subfunction` nếu được include bởi ≥2 UC (xem `uc_levels` trong relation-issues.json), ngược lại `user-goal`. `supporting_actors` lấy từ relations.json (via=derived).

### business-rules (tab `Business Rules`, folder `05-business-rules`)
| Cột sheet | Đích |
|---|---|
| ID, Tên ngắn, Status, Scope | `id`, `short_name`, `status`, `scope` |
| Rule / Exceptions / Ghi chú | section cùng tên |
| Căn cứ | `source` |
| Related Use Cases | `use_cases` |
| Related Requirements | Lật → `business_rules` của R |
| Related Decisions | Lật → `shapes` của D |

### requirements (tab `Requirements`, folder `06-requirements`)
| Cột sheet | Đích |
|---|---|
| ID, Tên ngắn, Status, Scope | `id`, `short_name`, `status`, `scope` |
| Type | `type`. Giá trị `Constraint` → đã có G-01 |
| Yêu cầu | `Yêu cầu` |
| Bối cảnh / Lý do | `Bối cảnh / Lý do` |
| Acceptance Note | `Acceptance` |
| Ghi chú | `Ghi chú` |
| Căn cứ | `source` |
| Area | `area` (giá trị ngoài enum đã có G-11) |
| Depends On (IDs) | `depends_on` |
| Related Work, Related Tests | Bỏ |

Field nhận thêm từ bước lật: `use_cases`, `business_rules`, `constraints`, `assumptions`. `verification` và `inputs` không có trong sheet → FILL_LATER (gợi ý được). Tên hệ thống trong câu Yêu cầu là `DeckAgent` (schema.json `system_name`). Câu dùng "nên"/"có thể" ở item Active vi phạm GR-02: đổi sang "phải" là đổi nghĩa (mức cam kết) → blocker `TRANG_THAI` hoặc gom một blocker chung cho các item này.

### decisions (tab `Decisions`, folder `07-decisions`)
| Cột sheet | Đích |
|---|---|
| ID, Status, Decision | `id`, `status`, section `Decision`; `short_name` đặt mới |
| Date | `date` (YYYY-MM-DD, đã chuẩn hóa trong JSON) |
| Recorded By | `decided_by` |
| Context / Rationale / Evidence / Reopen When | section cùng tên (`Rationale / Evidence` là một section). Phương án thay thế trong Context hoặc Rationale chuyển sang `Phương án đã xét` |
| Requirement chính | `addresses`, gắn cờ duyệt (mục 7) |
| Assumption chính | `assumptions` |
| Detailed Doc | `documents` |
| Related Work | Bỏ |

Field nhận thêm từ bước lật: `constraints`, `shapes`. Decision Superseded cần `superseded_by` (GD-09): tìm trong text; không tìm được → blocker.

### glossary (tab `Operating Rules`, dòng `GL-xxx`, đích `docs/specification/glossary.md`)
| Cột sheet | Đích |
|---|---|
| Nhóm | Thuật ngữ (`_term`) |
| Ý nghĩa / Cách hiểu | Định nghĩa (`_definition`) |
| Phần sau "Không dùng:" trong "Ví dụ chưa đạt" | Cột Không dùng (`_not_use`) |

Glossary chỉ giữ thuật ngữ về sản phẩm. Thuật ngữ về vận hành dự án (Work, Sprint, PR, Agent, Skill…) → `XÓA`. Đối chiếu từng thuật ngữ với cách item các loại khác đang dùng (grep `items/*.json`): thuật ngữ "Không dùng" đang xuất hiện trong item nào thì ghi để agent chính biết phạm vi viết lại. GL-ID không được giữ trong `glossary.md` (bảng không có cột ID) — ghi điều này ở mục 6 nếu thấy cần.
