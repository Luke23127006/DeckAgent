---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Test implementation — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Test implementation — workspace theo thư mục và chat mới

<!-- Contract triển khai test của build: driver, fixture và test-stub ticket. Nó được kiểm theo từng ticket (test-strategy.md "Checks"). Luật chung nằm ở test-strategy.md "Test infrastructure rules". -->

## At a glance

- **Status:** **baseline**. Contract phía test và fixture **đã chốt**; Phase 3 **chỉ quyết cách nối** driver vào DeckAgent.
- **Không giới hạn Test Design:** Test Design suy ra condition **từ basis item và plan**, không từ function hay fixture có sẵn. Khi test design cần một function, field hay fixture **chưa có**, contract **được mở rộng**; khi AC cuối khác AC mà ticket dựa vào, ticket **được sửa theo AC cuối**.
- **Còn mở:** cách `foreignClient` gửi request **khớp với cơ chế** DeckAgent chọn cho FR-143; chốt **khi implement FR-143**.
- **Ticket:** **#58** (T0c, test runner) đi tiếp **nếu độc lập** với AC và driver contract; **#59 đến #69 chờ AC cuối của vùng mình**, rồi body được cập nhật theo test design.
- **Ticket GitHub:** body của #58 đến #69 **chưa đổi**; chúng còn trỏ đường dẫn cũ `dev/mvp/builds/UC-013-workspaces-new-chat/testing-plan.md`.

## Test driver and fixtures

> **Test implementation contract**: **điểm khởi đầu** của driver và fixture. Người viết test **mở rộng** nó khi test cần một function, field hay fixture chưa có.

Luật chung của driver và fixture nằm ở [test-strategy.md](../../../../development/test-strategy.md) "Test infrastructure rules". Mục này chỉ ghi **phần riêng của build**. **Contract phía test** (function, field, quy tắc dưới đây) và **fixture** được **chốt cùng test design**; **Phase 3 chỉ quyết** cách **nối driver vào interface thật**.

Driver nằm ở `tests/acceptance/support/deckagent.ts`. Mọi response **có cấu trúc**; test **assert field**, **không so chữ hiển thị**. Mọi function nhận **interface** làm ngữ cảnh: mặc định là interface đầu tiên; test nhiều interface gọi qua `openInterface()`.

| Driver function | Used by |
|---|---|
| `start({ dataDir, userDir, keyDirs, systemDirs?, cwd })`: `cwd` là folder chạy server. **`systemDirs` thay thế toàn bộ** danh sách system folder (BR-019 V-2); **bỏ trống** thì dùng **danh sách thật** | mọi test; bỏ trống `systemDirs` chỉ ở test `C:\Windows` thật (FR-071 AC-7) |
| `stop()` (trả về khi **tiến trình đã thoát** và **file handle đã nhả**), `restart()` (cùng data folder) | FR-072 AC-2, FR-073 AC-7, FR-083 AC-6, FR-142 AC-1, AC-2, FR-038 AC-4, FR-084 AC-1 |
| `openInterface()` (trả về khi client **đã đăng ký nhận event**), `reload(interface)` | FR-071 AC-10, FR-053 AC-4, FR-038 AC-2, AC-3 |
| `addFolder(path)`, `switchTo(id)`, `listWorkspaces()`, `inUse()` | FR-071, FR-072, FR-073, FR-074, FR-142 |
| `rename(id, name)`, `chooseFolder(id, path)`, `useDifferentFolder(id)` | FR-141, FR-083, FR-142 |
| `requestRemove(id)` trả về **trạng thái chờ xác nhận do server tạo**; `confirmRemove(id)`, `cancelRemove(id)` gửi **quyết định của người dùng** | FR-072 AC-3, FR-073 |
| `newChat()`, `openChat(id)`, `currentChat()`, `setDraft(text)` (trả về khi server **xác nhận đã lưu**), `getDraft(chatId)`, `earlierWork()`, `ungroupedChats()` | FR-053, FR-048, FR-038, FR-073 |
| `waitForEvent(interface, name, timeoutMs)` | FR-071 AC-10 |
| `fsAudit(path)` | FR-071 AC-8, FR-074 AC-1, AC-2, FR-083 AC-1, FR-142 AC-1 |
| `foreignClient(origin)` trả về một client có **cùng các function thay đổi trạng thái** như interface, nhưng request **mang Origin `origin`** và **không mang gì** DeckAgent chỉ cấp cho interface thật; response có `refused: true` khi bị từ chối (M18) | FR-143 AC-1 |

| Field | Meaning |
|---|---|
| `error.code` | `folder_unreadable`, `folder_refused`, `folder_taken`, `no_folder`, `name_refused` |
| `refusal.rules` | các value của BR, ví dụ `["BR-019 V-1", "BR-019 V-2"]` |
| `refusal.insideAllowed` | `true` \| `false` |
| `unreadable.actions` | tập con của `restore`, `grantAccess`, `chooseFolder` |
| `takenBy` | workspace đang giữ folder đó |
| workspace | `id`, `name`, `folder`, `status` (`readable` \| `unreadable` \| `differentFolder`), `isDefault` |
| `removal` | trạng thái chờ xác nhận, với `folderStays` và `chatsStay` |
| chat | `id`, `workspaceId` (rỗng với ungrouped chat), `model`, `draft` |
| `currentChat()` | `{ chatId }` **của chính interface đó** |
| event `workspaceInUse` | `{ workspaceId }` |
| `notice` | `noModel`, `noEarlierChats` |
| `raw` | **response gốc**, **chưa đổi tên field**. AC "không có field `cause`" kiểm trên `raw` |

**Quy tắc riêng của build:**
- **So đường dẫn** sau `realpathSync.native` ở **cả hai vế**, vì folder tạm có thể là **đường dẫn 8.3**. **Ngoại lệ:** đường dẫn **không còn tồn tại** được so **như chuỗi** với **giá trị DeckAgent đã trả trước đó** (FR-083 AC-6).
- **fs audit:** chế độ test chạy server với **một module preload** ghi **mọi lệnh `fs`** và đường dẫn của nó. `fsAudit(path)` trả về các lệnh trên đường dẫn **nằm trong `path`**, so sau khi **chuẩn hoá cả hai vế**: `realpathSync.native` khi đường dẫn tồn tại, nếu không thì `path.resolve` và **không phân biệt hoa thường**. Như vậy một lệnh **qua junction hoặc đường dẫn 8.3** vẫn bị bắt. **Được phép:** `stat`, `access`, `opendir` trên **chính project folder**. **Không được phép:** `open`, `readFile`, `createReadStream` trên **bất kỳ file nào bên trong**. **Positive control:** một **self-test** của audit cho server **đọc cố ý một file** bên trong một folder fixture (qua một hook **chỉ có ở chế độ test**), rồi `fsAudit` của folder đó **phải chứa** lệnh đọc này; thấy `stat` **không đủ**. Self-test này **chạy trên CI** cùng các AC dùng `fsAudit`. Khi preload **chưa bật**, `fsAudit` throw **`AuditNotEnabledError`**, nên AC dùng nó **chỉ là bằng chứng** khi preload đã bật và self-test **xanh**. **Giới hạn:** lệnh đọc từ worker thread, tiến trình con hoặc native module (SQLite) **không đi qua** preload (M3).
- **Folder thay thế:** driver khởi động DeckAgent với **folder thay thế** cho **folder của người dùng**, **các key folder**, **data folder** và **system folder**. Chúng là **fixture**: **folder thật trên đĩa**, **không mock** hành vi DeckAgent. **Hai yêu cầu cho Phase 3:** DeckAgent **đọc các đường dẫn này từ cấu hình lúc khởi động**, **không đọc lúc load module**; server **nhận port 0** để chạy **nhiều server song song** ([open-design-earlier-work.md](../../../research/open-design-earlier-work.md) item 12).
- **Runner:** **Vitest** `4.1.12`, ghim version (DEC-013). Lệnh chạy là `pnpm test:acceptance`.
- **CI:** test chạy qua **một step `test:acceptance` mới** trong `.github/workflows/workspace.yml`, là **một thay đổi riêng**, **PO duyệt**. Workflow đã **ghim Node `22.19.0`**, **ghim action theo SHA**, lấy **pnpm theo `package.json`**; riêng **image `windows-2022`** **không ghim tuyệt đối**.

Fixture nằm ở `tests/acceptance/support/winfs.ts`. **Mọi folder tạm** nằm dưới **một root trên ổ `C:`** (`C:\deckagent-test\<runId>`), vì FR-071 AC-6 cần `userDir` và `systemDirs` **cùng ổ với `C:\`**.

| Fixture | Sets up | Self-test |
|---|---|---|
| `root()` | root của lần chạy trên `C:`; **mỗi test một folder con riêng** bên dưới | root **nằm trên ổ `C:`**; nếu không, **fail** |
| `junction(target)` | junction tới `target` | `realpathSync.native` của junction **bằng** `target` |
| `substDrive(target)` | ổ `subst` trỏ vào `target`, lấy letter **dưới lock** của suite, **thử lại** khi letter vừa bị lấy, **gỡ** sau test | ổ mới **đọc được** và trỏ đúng `target` |
| `shortName(path)` | đường dẫn **8.3** của `path` | đường dẫn 8.3 **khác chuỗi** và **trỏ cùng folder**; nếu volume tắt 8.3: **fail trên CI** |
| `longPath(length)` | folder có đường dẫn **đúng `length` ký tự** | `fs.statSync` folder đó **thành công** |
| `denyRead(path)` | chặn quyền đọc; **trả lại trong `finally`** | `fs.readdir` **thật sự fail**; nếu không: **fail trên CI**, trên máy dev **skip kèm lý do** chỉ khi `DECKAGENT_ALLOW_FIXTURE_SKIP=1` |
| `move(from, to)` | dời folder, **thử lại** khi EPERM | `from` **không còn**, `to` **có** |
| `snapshot(path)` | ghi **mọi file và folder**, kể cả folder rỗng: tên, kích thước, **hash nội dung**, thuộc tính (ẩn, chỉ đọc), **ADS**; **không ghi thời gian** của chính folder | **Positive control:** khi test đổi một byte, một thuộc tính hoặc một ADS, snapshot mới phải **khác** snapshot cũ |
| `namedFolder(name)` (M19) | folder có **tên đúng chuỗi code point** `name`, kể cả NFD, ký tự ngoài BMP, khoảng trắng ở đầu | `readdir` của folder cha trả về **đúng chuỗi code point** đã tạo |
| global setup | **chỉ gỡ** ổ `subst` và **chỉ `icacls /reset`** các folder mà **registry của suite** (`root\registry.json`) ghi từ lần chạy trước, **dưới lock file** của suite | ổ `subst` **không có trong registry** **không bị đụng** |


## Test-stub tickets

Mỗi ticket **đổi tối đa 3 file**, label `tier:ci`. Trừ T0c, mọi file nằm trong `tests/acceptance/`. **T0c chặn mọi ticket khác**; **T0a và T0b chặn T1 đến T9**. Mọi acceptance test viết bằng **`it.fails`** của **Vitest** (DEC-013).

| Ticket | Criteria | Files | Fixtures | Blocked by |
|---|---|---|---|---|
| [#58](https://github.com/Luke23127006/DeckAgent/issues/58) T0c · test runner | — | `package.json` (Vitest `4.1.12`, script `test:acceptance`), `pnpm-lock.yaml`, `vitest.config.ts` | — | — |
| [#59](https://github.com/Luke23127006/DeckAgent/issues/59) T0a · test driver | — | `support/deckagent.ts`, `support/errors.ts` | — | T0c |
| [#60](https://github.com/Luke23127006/DeckAgent/issues/60) T0b · Windows fixture | — | `support/winfs.ts`, `support/winfs.test.ts`, `support/global-setup.ts` | mọi fixture và self-test của chúng | T0c |
| [#61](https://github.com/Luke23127006/DeckAgent/issues/61) T1 · thêm và chuyển workspace | FR-071 AC-1..5, 8, 9, 11, 12, 15 | `workspaces-add-switch.test.ts` | `junction`, `substDrive`, `shortName`, `longPath`, `denyRead`, `move` | T0a, T0b |
| [#62](https://github.com/Luke23127006/DeckAgent/issues/62) T2 · refused folder (security) | FR-071 AC-6, 7; FR-083 AC-4 | `refused-folders.test.ts` | `root`, `junction`, `substDrive` | T0a, T0b |
| [#63](https://github.com/Luke23127006/DeckAgent/issues/63) T3 · nhiều interface | FR-071 AC-10; FR-053 AC-4; FR-038 AC-3 | `several-interfaces.test.ts` | — | T0a, T0b |
| [#64](https://github.com/Luke23127006/DeckAgent/issues/64) T4 · default workspace và xoá workspace | FR-072 AC-1..4; FR-073 AC-1..5, 7 | `default-and-remove.test.ts` | — | T0a, T0b |
| [#65](https://github.com/Luke23127006/DeckAgent/issues/65) T5 · folder mất hoặc bị thay | FR-074 AC-1..5; FR-142 AC-1..5 | `folder-gone-or-replaced.test.ts` | `move`, `junction`, `denyRead` | T0a, T0b |
| [#66](https://github.com/Luke23127006/DeckAgent/issues/66) T6 · đổi folder và đổi tên | FR-083 AC-1..3, 5, 6; FR-141 AC-1..7 | `change-folder-rename.test.ts` | `junction`, `move` | T0a, T0b |
| [#67](https://github.com/Luke23127006/DeckAgent/issues/67) T7 · project folder không đổi | FR-084 AC-1, 2 | `project-folder-untouched.test.ts` | `snapshot`, `move` | T0a, T0b |
| [#68](https://github.com/Luke23127006/DeckAgent/issues/68) T8 · chat mới, chat cũ, draft | FR-053 AC-1..3, 5; FR-048 AC-2; FR-038 AC-1, 2, 4 | `chats-and-drafts.test.ts` | — | T0a, T0b |
| [#69](https://github.com/Luke23127006/DeckAgent/issues/69) T9 · hành động khi folder lỗi | FR-071 AC-13, 14; FR-073 AC-6; FR-083 AC-7; FR-141 AC-8 | `actions-on-broken-folder.test.ts` | `move`, `snapshot` | T0a, T0b |
