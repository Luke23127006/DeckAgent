---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Traceability matrix — workspace theo folder và chat mới"
milestone: mvp
created: 08-11-2026
---

# Traceability matrix — workspace theo folder và chat mới

**Traceability spine** của build. Phase 1 có **một dòng cho mỗi FR và BR** trong scope; sau Phase 2 có **một dòng cho mỗi acceptance criterion**. Một dòng **thiếu link** thường là **việc bị quên** (dev/mvp/WORKFLOW.md "Traceability").

## At a glance

- **Requirement text:** statement nằm ở `dev/mvp/spec/`; acceptance criteria nằm ở [acceptance-criteria.md](./design/acceptance-criteria.md) (Phase 2)
- **Use cases:** **workspace theo folder** (UC-013) and **bắt đầu chat mới** (UC-012), **mọi step và alternative**
- **NFR:** NFR-008, **chỉ phần chat** ([acceptance-criteria.md](./design/acceptance-criteria.md) M-1)
- **Research:** [research-checklist.md](../research/research-checklist.md)
- **Status:** _65 dòng AC + 1 dòng measure + 3 dòng BR · 63 dòng AC có test-stub ticket · 0 đã implement · 0 đã verify_. Cột Test link tới **test-stub ticket** của mỗi dòng; **mã T** của ticket nằm ở [test-implementation.md](../implementation/test-implementation.md) mục "Test-stub tickets".

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
| FR-143 AC-1 · từ chối thay đổi từ trang web bên ngoài | ci | — | DEC-010, DEC-012 | — | | | [ ] |
| FR-143 AC-2 · interface thật vẫn thay đổi được trạng thái | ci | — | DEC-010, DEC-012 | — | | | [ ] |
| NFR-008 M-1 · chat giữ trạng thái đã lưu khi DeckAgent chết giữa chừng | ci | RQ-10 | DEC-011 | ticket integration ở Phase 4 | | | [ ] |
| BR-004 · chat nào được giữ | — | RQ-2 | DEC-006, DEC-011 | qua FR-073 AC-2 (V-3); V-1, V-2 ở build 3 | | | [ ] |
| BR-019 · folder không được làm project folder | — | RQ-3 | | qua FR-071 AC-6, AC-7, FR-083 AC-4 và FR-142 AC-3 | | | [ ] |
| BR-020 · tên workspace bị từ chối | — | RQ-7 | | qua FR-141 AC-5, AC-6 | | | [ ] |

## Items not tested

Mỗi behavior được **test ở build đầu tiên test được nó** (RQ-15, [#56](https://github.com/Luke23127006/DeckAgent/issues/56)). Các basis item dưới đây **không có criterion trong build này** và **không được tính là đã phủ**; **testing plan của build nhận** lấy chúng. Approval của từng item nằm ở [basis-register.md](./analysis/basis-register.md).

| ID | Items | Status | Cần | Build |
|---|---|---|---|---|
| SR-1 | FR-071.12, FR-071.13, FR-053.2, FR-073.6a, FR-073.6b, FR-073.6c, FR-083.8a, FR-083.8b, FR-083.8c, UC-013.S2b, UC-013.A5, UC-013.A7b, UC-012.S1c | deferred | **Request đang chạy**, hoặc **model nhận dữ liệu**. Build 1 chưa có, nên assert **luôn pass**. | Build 3 |
| SR-2 | FR-141.4, UC-013.A11b, UC-013.A6b, FR-038.4b, FR-084.1b, UC-013.G3, UC-012.S2b, UC-013.N1, UC-013.N2, FR-073.N1b, FR-053.N1c | deferred | **Request** hoặc **agent**, ở các sự kiện đổi tên, chọn folder, rời chat, quy tắc chung của UC-013 và FR-084. | Build 3 |
| SR-3 | FR-048.1, FR-048.2, FR-048.3, FR-048.4, FR-048.5, BR-004.V1, UC-013.S3b | deferred | **Request đã gửi**: danh sách chat cũ, tên chat (RQ-13, [#55](https://github.com/Luke23127006/DeckAgent/issues/55)) và quy tắc "chat nào được giữ". | Build 3 |
| SR-4 | FR-048.6 | deferred | **Deck**: nói chat có slide hay không. | Build 5 |
| SR-5 | FR-053.6, FR-053.7b, FR-053.N1a, FR-053.N1b, UC-012.S2a, UC-012.A1b | deferred | **Provider**: chat mới lấy selected model của lần chọn gần nhất. | Build 2 |
| SR-6 | FR-084.2 | deferred | **Attachment**: file người dùng đưa làm attachment. | Build 3 |
| SR-7 | NFR-008.2b | deferred | **Request**: chat nhận request mới sau khi DeckAgent kết thúc bất ngờ. | Build 3 |
| SR-8a | FR-072.7b, FR-073.4c, FR-074.7b, FR-142.6b, UC-013.A2c, UC-013.G2b | deferred | **Conversation**, chỉ có khi request gửi được. | Build 3 |
| SR-8b | FR-073.4b, UC-013.A2b | deferred | **Model selection**. | Build 2 |
| SR-8c | FR-072.7c, FR-073.4d, FR-074.7c, FR-142.6c, UC-013.A2d, UC-013.G2c, FR-053.1b, FR-084.1c, UC-012.S1b, FR-053.N2 | deferred | **Deck**. | Build 5 |
| SR-8d | NFR-008.1b, NFR-008.3 | deferred | **Deck** và **điểm chèn lỗi** trên đường ghi deck và slide (M13 mở rộng). Khi implementation plan của build 5 có điểm chèn đáng tin, phép kiểm **về build 5**. | Build 6 |
| SR-9 | FR-038.1b, NFR-008.1c | deferred | **Màn setup** và **provider**. | Build 2 |
| SR-10 | FR-072.4b, BR-004.V2 | excluded | Một lần chạy test **không quan sát được** điều này, hoặc người dùng **không tạo được** tình huống. | — |
| SR-11 | FR-084.3 | deferred | **Export** (UC-004, FR-085 ở backlog). Vế "không file nào khác xuất hiện" **đã kiểm qua FR-084.1a**. | Khi export vào scope |
| SR-12 | FR-071.1, **chỉ nhóm UNC** | deferred | **Đường dẫn mạng UNC**: câu trả lời ở open-questions.md mục 20 và **share SMB trên CI**. Phần còn lại của FR-071.1 **to test**. | Chưa có build |
| SR-13 | UC-012.N1 | deferred | **Attachment**: archive đã export đính kèm vào chat mới. | Build 3 |

**Item rủi ro high bị dời:** FR-084.1b (build 3), FR-084.1c (build 5), FR-073.4b đến FR-073.4d (build 2, 3, 5). Tới build nhận, chúng **chỉ được bảo vệ** bởi **acceptance test** của build này.

## Orphan check (cuối mỗi phase)

- [ ] **Mỗi FR và NFR trong scope có một dòng** (Phase 1); **mỗi AC và measure có một dòng và một tier** (sau Phase 2).
- [ ] **Mỗi dòng có ít nhất một test** (sau Phase 2).
- [ ] **Người implement khác test author** của cùng dòng, hoặc dòng ghi lý do.
- [ ] **Mỗi DEC trong scope được dùng** bởi ít nhất một dòng (test hoặc impl).
- [ ] **Mỗi RQ đã trả lời dẫn tới một DEC** hoặc một dòng dùng kết quả của nó.
- [ ] **Không có test ticket hay implementation ticket nào thiếu dòng trong matrix**.