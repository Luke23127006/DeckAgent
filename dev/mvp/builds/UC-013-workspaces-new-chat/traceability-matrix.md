---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Traceability matrix — workspace theo folder và chat mới"
milestone: mvp
created: 08-11-2026
---

# Traceability matrix — workspace theo folder và chat mới

**Traceability spine** của build. Phase 1 có **một dòng cho mỗi FR và BR** trong scope; sau Phase 2 có **một dòng cho mỗi acceptance criterion**. **Không gate nào đóng** khi một dòng còn **thiếu link mà phase đó phải tạo** (dev/mvp/WORKFLOW.md "Traceability").

## At a glance

- **Requirement text:** statement nằm ở `dev/mvp/spec/`; acceptance criteria nằm ở [testing-plan.md](./testing-plan.md) (Phase 2)
- **Use cases:** **workspace theo folder** (UC-013) and **bắt đầu chat mới** (UC-012), **mọi step và alternative**
- **NFR:** NFR-008, **chỉ phần chat** ([testing-plan.md](./testing-plan.md) M-1)
- **Research:** [research-checklist.md](./research-checklist.md)
- **Status:** _63 dòng AC + 1 dòng measure + 3 dòng BR · 63 dòng AC có test-stub ticket · 0 đã implement · 0 đã verify_. Cột Test link tới **test-stub ticket** của mỗi dòng; **mã T** của ticket nằm ở [testing-plan.md](./testing-plan.md) mục "Test-stub tickets".

## Matrix

| FR / AC | Tier | RQ | DEC | Test (ticket) | Test author | Impl (ticket / PR) | Verified |
|---|---|---|---|---|---|---|---|
| FR-071 AC-1 · thêm folder đọc được | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-2 · cùng folder, đường dẫn khác | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-3 · chuyển sang workspace có sẵn | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-4 · folder không đọc được | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-5 · không chọn folder | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-6 · refused folder bao quanh protected folder (BR-019) | ci | RQ-1, RQ-4 | DEC-010 | [#62](https://github.com/Luke23127006/DeckAgent/issues/62) | | | [ ] |
| FR-071 AC-7 · refused folder thuộc protected folder (BR-019) | ci | RQ-1, RQ-4 | DEC-010 | [#62](https://github.com/Luke23127006/DeckAgent/issues/62) | | | [ ] |
| FR-071 AC-8 · không đọc file của folder | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-9 · giữ chat hiện tại và draft | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-10 · mọi giao diện theo workspace đang dùng | ci | RQ-1, RQ-4 | DEC-010, DEC-012 | [#63](https://github.com/Luke23127006/DeckAgent/issues/63) | | | [ ] |
| FR-071 AC-11 · đường dẫn dài | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-12 · tên folder khác nhau chỉ ở chuẩn hoá Unicode | ci | RQ-1, RQ-4 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-071 AC-13 · thêm folder đã bị dời đi | ci | RQ-1, RQ-4, RQ-5 | DEC-010 | [#69](https://github.com/Luke23127006/DeckAgent/issues/69) | | | [ ] |
| FR-071 AC-14 · thêm folder mới ở chỗ cũ | ci | RQ-1, RQ-4, RQ-5 | DEC-010 | [#69](https://github.com/Luke23127006/DeckAgent/issues/69) | | | [ ] |
| FR-071 AC-15 · tên folder dài hơn tên dài nhất (BR-020) | ci | RQ-1, RQ-7 | DEC-010 | [#61](https://github.com/Luke23127006/DeckAgent/issues/61) | | | [ ] |
| FR-072 AC-1 · workspace mặc định lần đầu chạy | ci | RQ-8 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-072 AC-2 · khởi động lại giữ workspace đang dùng | ci | RQ-8 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-072 AC-3 · không xoá được workspace mặc định | ci | RQ-8 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-072 AC-4 · làm việc không cần folder | ci | RQ-8 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-1 · hỏi trước khi xoá | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-2 · xoá đã xác nhận, chat thành ungrouped chat (BR-004 V-3) | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-3 · xoá workspace đang dùng | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-4 · huỷ thì không xoá gì | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-5 · thêm lại folder cũ | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-073 AC-6 · xoá khi folder không đọc được hoặc bị thay | ci | RQ-10 | DEC-011 | [#69](https://github.com/Luke23127006/DeckAgent/issues/69) | | | [ ] |
| FR-073 AC-7 · dừng khi đang chờ xác nhận | ci | RQ-10 | DEC-011 | [#64](https://github.com/Luke23127006/DeckAgent/issues/64) | | | [ ] |
| FR-074 AC-1 · folder bị dời đi | ci | RQ-5 | DEC-006 | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-074 AC-2 · mất quyền đọc | ci | RQ-5 | DEC-006 | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-074 AC-3 · workspace và chat vẫn còn | ci | RQ-5 | DEC-006 | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-074 AC-4 · folder được đặt lại | ci | RQ-5 | DEC-006 | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-074 AC-5 · folder mới ở chỗ cũ bị dời đi | ci | RQ-5 | DEC-006 | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-083 AC-1 · chọn folder khác | ci | RQ-3, RQ-4 | DEC-010 | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-083 AC-2 · folder của workspace khác | ci | RQ-3, RQ-4 | DEC-010 | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-083 AC-3 · folder không đọc được | ci | RQ-3, RQ-4 | DEC-010 | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-083 AC-4 · folder bị từ chối (BR-019) | ci | RQ-3, RQ-4 | DEC-010 | [#62](https://github.com/Luke23127006/DeckAgent/issues/62) | | | [ ] |
| FR-083 AC-5 · không áp dụng cho workspace mặc định | ci | RQ-3, RQ-4 | DEC-010 | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-083 AC-6 · không tự đổi folder | ci | RQ-3, RQ-4 | DEC-010 | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-083 AC-7 · chọn folder khác khi folder không đọc được hoặc bị thay | ci | RQ-3, RQ-4 | DEC-010 | [#69](https://github.com/Luke23127006/DeckAgent/issues/69) | | | [ ] |
| FR-142 AC-1 · báo folder khác | ci | RQ-4, RQ-5 |  | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-142 AC-2 · dùng folder khác | ci | RQ-4, RQ-5 |  | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-142 AC-3 · dùng folder khác theo luật chọn folder | ci | RQ-4, RQ-5 |  | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-142 AC-4 · workspace và chat vẫn còn | ci | RQ-4, RQ-5 |  | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-142 AC-5 · folder mới xuất hiện khi workspace đang không đọc được | ci | RQ-4, RQ-5 |  | [#65](https://github.com/Luke23127006/DeckAgent/issues/65) | | | [ ] |
| FR-084 AC-1 · project folder không đổi sau mọi hành động | ci | RQ-2, RQ-3 | DEC-006, DEC-011 | [#67](https://github.com/Luke23127006/DeckAgent/issues/67) | | | [ ] |
| FR-084 AC-2 · folder mới ở chỗ cũ không đổi khi dùng nó | ci | RQ-2, RQ-3 | DEC-006 | [#67](https://github.com/Luke23127006/DeckAgent/issues/67) | | | [ ] |
| FR-141 AC-1 · đổi tên | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-2 · đổi tên workspace mặc định | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-3 · cho phép trùng tên | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-4 · bỏ khoảng trắng hai đầu | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-5 · tên bị từ chối (BR-020) | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-6 · tên dài nhất được nhận (BR-020) | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-7 · tên một ký tự (BR-020) | ci | RQ-7 |  | [#66](https://github.com/Luke23127006/DeckAgent/issues/66) | | | [ ] |
| FR-141 AC-8 · đổi tên khi folder không đọc được hoặc bị thay | ci | RQ-7 |  | [#69](https://github.com/Luke23127006/DeckAgent/issues/69) | | | [ ] |
| FR-053 AC-1 · chat mới rỗng và là chat hiện tại | ci | RQ-14 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-053 AC-2 · chat khác giữ nguyên | ci | RQ-14 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-053 AC-3 · vào workspace đang dùng | ci | RQ-14 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-053 AC-4 · giao diện khác giữ chat hiện tại | ci | RQ-14 | DEC-012 | [#63](https://github.com/Luke23127006/DeckAgent/issues/63) | | | [ ] |
| FR-053 AC-5 · chưa có model thì báo | ci | RQ-14 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-048 AC-2 · không có chat cũ thì báo | ci | RQ-13 |  | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-038 AC-1 · giữ khi ở chỗ khác | ci | RQ-12 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-038 AC-2 · giữ khi tải lại | ci | RQ-12 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| FR-038 AC-3 · mọi giao diện cùng draft | ci | RQ-12 | DEC-012 | [#63](https://github.com/Luke23127006/DeckAgent/issues/63) | | | [ ] |
| FR-038 AC-4 · không giữ sau khi DeckAgent dừng | ci | RQ-12 | DEC-012 | [#68](https://github.com/Luke23127006/DeckAgent/issues/68) | | | [ ] |
| NFR-008 M-1 · chat giữ trạng thái đã lưu khi DeckAgent chết giữa chừng | ci | RQ-10 | DEC-011 | ticket integration ở Phase 4 | | | [ ] |
| BR-004 · chat nào được giữ | — | RQ-2 | DEC-006, DEC-011 | qua FR-073 AC-2 (V-3); V-1, V-2 ở build 3 | | | [ ] |
| BR-019 · folder không được làm project folder | — | RQ-3 | | qua FR-071 AC-6, AC-7, FR-083 AC-4 và FR-142 AC-3 | | | [ ] |
| BR-020 · tên workspace bị từ chối | — | RQ-7 | | qua FR-141 AC-5, AC-6 | | | [ ] |

## Moved to a later build

PO đã quyết (RQ-15, [#56](https://github.com/Luke23127006/DeckAgent/issues/56)): mỗi behavior được **test ở build đầu tiên test được nó**. Các phần dưới đây **không có criterion trong build này**; **testing plan của build kia nhận chúng**.

| Behavior | FR | Cần | Test ở |
|---|---|---|---|
| **Không xoá workspace và không đổi folder** khi workspace có **request đang chạy** | FR-073, FR-083 | **Request** | Build 3 |
| **Request vẫn chạy** khi người dùng **chuyển workspace** hoặc **tạo chat mới** | FR-071, FR-053 | **Request** | Build 3 |
| Chat mới lấy **model của lần chọn gần nhất** | FR-053 | **Provider** | Build 2 |
| FR-048: hiện **chat từ trước lần khởi động lại**, hiện **ungrouped chat riêng**, nói **chat đổi lần cuối khi nào** (testing plan P-2) | FR-048 | **Request đã gửi** (BR-004 V-1) | Build 3 |
| FR-084: **file người dùng đưa làm attachment** giữ nguyên (test design Z-3) | FR-084 | **Attachment** | Build 3 |
| FR-048: nói **chat có slide không** (testing plan P-2) | FR-048 | **Deck** | Build 5 |
| FR-048 AC-1: **chỉ chat của workspace đang dùng** (test design Z-13) | FR-048 | **Request đã gửi** (BR-004 V-1) | Build 3 |
| FR-071: **không gửi gì tới model**, **không dừng request** khi thêm hoặc chuyển workspace (test design Z-12) | FR-071 | **Model, request** | Build 3 |
| NFR-008: chat **nhận request mới** sau khi DeckAgent chết giữa chừng (test design Z-14) | NFR-008 | **Request** | Build 3 |
| FR-071: folder trên **đường dẫn mạng UNC** (test design Z-10, open-questions.md item 20) | FR-071 | **Câu trả lời của PO** và **share SMB trên CI** | Chưa có build |
| **Đặt tên chat** theo nội dung: **model đặt tên** trong câu trả lời đầu tiên; khi model không đặt, **code lấy vài chữ đầu** của request (RQ-13, [#55](https://github.com/Luke23127006/DeckAgent/issues/55)) | FR-048 | **Request** | Build 3 |

## Orphan check (chạy ở mỗi gate)

- [ ] **Mỗi FR và NFR trong scope có một dòng** (Phase 1); **mỗi AC và measure có một dòng và một tier** (sau Phase 2).
- [ ] **Mỗi dòng có ít nhất một test** (sau Phase 2).
- [ ] **Người implement không phải test author** của cùng dòng.
- [ ] **Mỗi DEC trong scope được dùng** bởi ít nhất một dòng (test hoặc impl).
- [ ] **Mỗi RQ đã trả lời dẫn tới một DEC** hoặc một dòng dùng kết quả của nó.
- [ ] **Không có test ticket hay implementation ticket nào thiếu dòng trong matrix**.