# ADR-0007 — Design System & Templates

**Status:** Accepted — architecture direction  
**Date:** 2026-11-10  
**Decision:** TD-07  
**Depends on:** [ADR-0001](0001-local-storage.md), [ADR-0005](0005-deck-artifacts-revisions.md)

## Context

DeckAgent phân biệt hai khái niệm theo spec: **Design System** quy định theme values, brand assets và rules in words; **Template** cung cấp các layout có thể dùng để xây slide trong một generation format. FR-022 yêu cầu chọn layout phù hợp trước khi model điền nội dung; chỉ tự tạo layout khi không có layout phù hợp. UC-010 yêu cầu người dùng tạo custom Design System, không phải custom Template.

OpenDesign tách `design-systems/` khỏi `design-templates/`. Design System có token contract và brand assets; HTML presentation template có layout/source files và hướng dẫn authoring. Đây là reference cho separation, **không có nghĩa là semantics/template selection của OpenDesign giống hệt DeckAgent**.

## Decision

1. **Hai domain riêng:** `DesignSystem` (theme roles, values, rules in words, logo/font refs) và `Template` (generation format, built-in layout definitions, content kinds/capacity). Không nhập chung Style Preset, không thêm Template editor hay user-saved templates.
2. **Built-in catalog versioned, local:** Các built-in Design Systems và Templates đi kèm repo/package của DeckAgent. Custom Design Systems được lưu trong application storage. Không đặt dữ liệu custom vào user project folder. Built-in không bị sửa/xóa; user tạo bản custom từ built-in hoặc từ theme của Deck hiện có.
3. **Format-aware template selection:** Template phải tương thích với generation format. Format categories từ BR-011 không được nhầm thành executable format adapters; chỉ các format đã implement mới xuất hiện dưới dạng selectable format. Default generation format là HTML theo BR-011. Không tự giả định hỗ trợ các format khác.
4. **Stable theme roles:** Host dùng một schema các semantic theme roles cho mọi Design System. Mỗi Design System chứa đủ required roles; custom copy giữ lại giá trị chưa được sửa. Rules in words được lưu cùng các theme values, nhưng không tự biến thành hard-coded layout constraints. **Danh sách roles vẫn chưa được set tại BR-017 V-1**; build đầu tiên có theme translator phải chốt danh sách này vào spec trước khi code dựa trên nó.
5. **Layout contract:** Mỗi built-in Template khai báo supported format, các layout, content kinds và capacity. Host lọc layouts phù hợp; model chọn trong options và điền nội dung. Khi không layout nào phù hợp, model có thể tạo một layout mới nhưng vẫn phải tuân thủ theme và các checks FR-092. Không khẳng định toàn bộ chất lượng trực quan có thể quyết định bằng code.
6. **Deck theme snapshot:** Khi deck bắt đầu generation, lưu immutable effective theme snapshot (theme values + rules/brand asset refs) và template identity/version. Update/remove custom Design System không đổi Deck đã tồn tại; Deck chỉ nhận changes khi later request chọn lại (FR-106). Source artifacts và preview đọc snapshot, không luôn trỏ tới latest mutable Design System.
7. **Host validates publication:** Theme values do model tự chọn phải hợp lệ; đối với lỗi đã biết theo FR-092, không publish slide lỗi. Preview trước khi save custom Design System hiển thị sample slide và các conflicts theo FR-096. Approval/phase gates theo ADR-0003/0005.

## Reuse decisions

- **OpenDesign**: reuse tư duy tách `design-systems/` và `design-templates/`, semantic token schema, file-based built-in catalogs và template-local assets; adapt cho DeckAgent local-first.
- **Không copy nguyên** OpenDesign token tiers A1/A2/B/C, marketplace/plugin registry, toàn bộ HTML-PPT skill suite hoặc multi-surface features; chúng không phải requirement của DeckAgent.
- **DeckAgent**: dùng các requirement đã chốt để định nghĩa API/theme translator. Reuse UI/legacy contracts nếu phù hợp sau code review, không coi code cũ là chính sách sản phẩm.

## Consequences / implementation contracts

- Interfaces tối thiểu: `listDesignSystems`, `getDesignSystem`, `saveCustomDesignSystem`, `listTemplates(format)`, `resolveEffectiveTheme`, `findCompatibleLayouts`, `snapshotDeckTheme`, `validateSlideTheme`.
- Built-in defaults, theme role schema và template catalog phải nhất quán với BR-003 V-1, BR-017 V-1, BR-018 V-1/V-2. **Chưa chốt các giá trị này trong ADR**; là product values, phải cập nhật spec khi lựa chọn dựa trên implementation thực tế.
- Có thể bắt đầu MVP với **một built-in HTML template** theo BR-018, miễn có default Design System và role schema hoàn chỉnh. Không cần hoàn thành custom Design System UI trước slide-generation đầu tiên.
- Tests theo build: theme/default selection, layout compatibility, template fallback, format mismatch, custom System copy/edit/delete không ảnh hưởng Deck cũ, preservation của theme snapshot, no publish khi known invalid theme value, logo/fonts được resolve trong preview.

## Evidence

- [DeckAgent BR-003](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-003.md), [BR-017](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-017.md), [BR-018](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/04-business-rules/BR-018.md), [FR-022](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-022.md), [FR-097](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-097.md), [FR-106](https://github.com/Luke23127006/DeckAgent/blob/a0d204a613d0decab2d627a9d5868d9c9e162b9e/docs/spec/03-requirements/fr/FR-106.md).
- [OpenDesign token contract](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/packages/contracts/src/design-systems/token-schema.ts), [Design System registry](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/apps/daemon/src/design-systems/index.ts), [HTML PPT template example](https://github.com/nexu-io/open-design/blob/aae63c89dd5787c258f47f2742bb79572330bf5c/design-templates/html-ppt-pitch-deck/SKILL.md).

**Evidence level:** source-code review, chưa chạy integration tests.
