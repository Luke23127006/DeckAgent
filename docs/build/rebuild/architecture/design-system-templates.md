# Design System & Templates

**Architecture source:** [ADR-0007](../adr/0007-design-system-templates.md). Logical contracts để lập Build Roadmap; chưa phải implementation schema hay CSS contract cuối cùng.

## 1. Separation & ownership

```text
Built-in Catalog (repo/package)         DeckAgent Application Storage
  |-- Design Systems (immutable)         |-- Custom Design Systems
  |-- Templates by generation format     |-- Deck effective theme snapshot
  |       +-- compatible layouts         |-- Deck selected template/version
  +-- logo/font/theme assets             +-- Generated slide artifacts
            \                                  /
             +---- DeckAgent Host ------------+
                   |-- Theme resolver
                   |-- Layout candidates
                   |-- Publication validator
                   +-- OpenCode tool context
```

- **Design System**: theme roles/values, rules in words, logo/font assets.
- **Template**: built-in layouts, supported generation format, content kinds/capacity.
- **Deck**: own resolved theme snapshot + chosen template/format; không thay đổi tự động khi custom Design System bị sửa/xóa.
- **Agent**: dùng layouts/theme được Host cung cấp; không tự sửa Registry hoặc vượt phase/scope.

## 2. Minimum contracts

| Contract | Data và trách nhiệm | Source |
|---|---|---|
| `DesignSystem` | ID, built-in/custom, complete theme roles, rules, brand asset refs | BR-017, FR-097 |
| `ThemeSchema` | Role names/validation; all themes complete | BR-017 V-1 **pending** |
| `Template` | ID/version, generation format, built-in layouts + matching criteria | BR-018, FR-022 |
| `EffectiveTheme` | Snapshot of applied theme values/rules/assets for one Deck | FR-106 |
| `LayoutCandidates` | Compatible layouts for planned slide, without letting Agent bypass template logic | FR-022 |
| `DeckVisualContext` | Locked format, template identity, effective theme for generation/edit | BR-011, FR-116 |

## 3. Generation path

1. Trong interview, user chọn format, template và Design System hoặc dùng defaults (BR-011/013/018/003).
2. Outline Review lưu các lựa chọn này trong brief; chưa tạo slide trước confirm (UC-001, FR-003).
3. Khi bắt đầu generation, Host lock generation format và snapshot effective theme/template refs vào Deck (FR-116/106).
4. Với từng planned slide, Host lọc compatible layouts theo content kind/capacity; OpenCode lựa chọn layout trong tập này và tạo nội dung (FR-022).
5. Nếu không layout nào phù hợp, cho phép tạo layout mới trong theme, nhưng validation vẫn phải kiểm tra faults đã biết trước publication (FR-092).
6. Published revisions dùng persisted theme/assets, không phụ thuộc mutable registry hoặc user project folder.

## 4. Custom Design System path

- Bắt đầu bằng built-in, custom hiện có hoặc theme snapshot của Deck; copy đủ theme values.
- User đưa rules in words / brand files. Model hỗ trợ đọc và đề xuất; code kiểm tra required roles và inconsistencies đã biết.
- Trước save: preview một sample slide, hiển thị rules không dùng được và conflicts (FR-096).
- Save custom trong application storage. Không mutate built-in, các Deck khác hoặc project folder.
- Edit/remove một custom system không cập nhật theme của Deck đã tạo; dùng explicit subsequent selection để apply (FR-106).

## 5. Implementation cut line

**Minimum trước Outline/Generation:** default built-in Design System, role schema, một compatible HTML template, selection+snapshot contracts. Product phải set BR-003 V-1, BR-017 V-1, BR-018 V-1/V-2 ở build tạo template/translator đầu tiên. Mọi giá trị chưa set vẫn là gap, không tự suy luận từ OpenDesign.

**Có thể sau:** custom Design System authoring UI, brand-file ingestion, multiple templates per format, non-HTML format adapters, advanced template curation. Các tính năng thuộc MVP vẫn phải được map vào later build, không tự chuyển vào backlog.

## 6. Build verification

- Generated deck sử dụng đúng selected/default format, template, theme.
- Unsupported format/template mismatch bị từ chối rõ ràng, không silent fallback.
- Layout candidates match planned slide; novel layout chỉ khi không có candidate phù hợp.
- Slide không publish khi còn known blocking theme faults.
- Update/delete custom Design System không đổi existing deck preview/source/theme.
- Không thay đổi files trong workspace project folder.

## Sources

- [ADR-0007](../adr/0007-design-system-templates.md)
- [DeckAgent specs](https://github.com/Luke23127006/DeckAgent/tree/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec)
- [OpenDesign Design System registry](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/design-systems/index.ts)
