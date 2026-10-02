# Tiến độ Pha A — migrate sheet sang spec

Đọc file này trước khi làm tiếp sau khi session bị ngắt. Không làm lại bước đã `Xong`.

- Tham số: `TYPES = all`
- Branch: `spec/migrate-sheet` (tạo từ `docs/spec-criteria`, không push)
- Nguồn: `trash/old_sheet/Project Hub - DeckAgent (2).xlsx` (chỉ đọc)
- Script: `tools/spec/migrate_sheet.py`

| Bước | Nội dung | Trạng thái | File đầu ra |
|---|---|---|---|
| A0 | Tạo branch, đọc README, `_COMMON_CRITERIA.md`, `schema.json`, `_CRITERIA.md` + `_TEMPLATE.md` của 7 loại | Xong | `PROGRESS.md` |
| A1 | Kiểm kê bằng script | Xong | `work/items/*.json`, `work/inventory.md`, `work/enum-anomalies.json` |
| A2 | Phân loại product / project | Xong | `work/classification.json` (138 product, 13 project, 5 unclear) |
| A3 | Quan hệ: lật chiều, mâu thuẫn, tham chiếu gãy, GX-04 | Xong | `work/relations.json`, `work/relation-issues.json`, `work/relations-report.md`, `work/legacy-refs.json`, `work/global-blockers.md` |
| A4 | Đánh giá nội dung (subagent mỗi loại) | Xong (8 file; subagent requirements bị rate limit sau khi đã ghi đủ file, đã kiểm đủ 54 ID và 6 mục) | `work/assess-<loại>.md` |
| A5 | Dịch thử (cùng subagent) | Xong | mục 4 của `work/assess-<loại>.md` |
| A6 | Gộp `PLAN.md`, `BLOCKERS.md`, `FILL_LATER.md` | Xong: 69 blocker (10 liên loại, 9 gộp từ nhiều loại, 50 riêng loại) | `PLAN.md`, `BLOCKERS.md`, `FILL_LATER.md`, `work/global-blockers-full.md`, `work/merged-blockers.md`, `work/a6-summary.json` (bảng đổi ID tạm → BLK) |
| A7 | Tự kiểm tra, commit | Xong: 181 dòng (156 item + 25 thuật ngữ) mỗi dòng đúng một lần ở PLAN.md mục 4; 69 blocker đủ phương án, đề xuất, ô Quyết định trống; số item khớp số hàng có ID trong sheet; chỉ `_migration/` và script được commit | commit trên `spec/migrate-sheet` |

**Pha A dừng ở đây.** Chờ người dùng điền cột Quyết định trong `BLOCKERS.md`. Không bắt đầu Pha B.

## Ghi chú vận hành

- Trước khi bắt đầu, working tree đã có thay đổi không thuộc task này: `docs/specification/schema.json` (một dấu cách cuối dòng) và hai thư mục chưa track `docs/agents/`, `docs/tooling/`. Không stage, không sửa các thay đổi đó.
- Repo không có `toolings/` hay `tools/`, nên script đặt ở `tools/spec/`.
