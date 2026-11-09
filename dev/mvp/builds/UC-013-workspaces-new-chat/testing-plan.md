---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Testing plan — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Testing plan — workspace theo thư mục và chat mới

<!-- Document rules (dev/mvp/WORKFLOW.md "Document rules"): front-load the "At a glance" block, reference FRs by ID (don't restate the statement), keep the section order below.
     Derived from dev/development/test-strategy.md: risk sets the depth, each kind of requirement picks its technique and coverage criterion. The plan applies the strategy; it does not restate its rules.
     This is the one home of the acceptance criteria and measures of the build (dev/mvp/WORKFLOW.md "Spec rules"); the length budget does not count them.
     Gaps, deviations and the PO's rulings live in review-flows.md only. A ruling's result is written here as current fact.
     Written by the PO (the agent drafts). Developers write the tests from this plan; the PO approves each test before it is locked (dev/mvp/WORKFLOW.md "Phase 2"). -->

## At a glance

- **Use cases:** UC-013, UC-012
- **Steps:** all
- **Alternatives:** all, **trừ** các phần **dời sang build sau** ([matrix](./traceability-matrix.md), mục "Moved to a later build"). **BR-004, BR-019, BR-020** được test **qua các FR trích dẫn chúng**.
- **Spine:** [traceability-matrix.md](./traceability-matrix.md), **một dòng cho mỗi AC và measure**
- **PO review view:** [review-flows.md](./review-flows.md): sơ đồ, bảng kiểm tra đủ (mọi event ở mọi state), cây quyết định, các bảng phân lớp, **gaps và rulings**
- **Tiers:** _63 AC ci · 1 measure ci · 0 eval · 0 manual_
- **Technical checklist (C1–C8):** _8 / 8 pass sau các sửa C-2_ (review-flows.md mục 8); **chạy lại** sau khi áp các ruling mới

<!-- Coverage: số mục coverage (bước UC, ô state × event, nhánh lá, lớp đầu vào, bất biến) đã có AC / số mục mà risk level đòi, trừ các mục PO đã ruling không test hoặc dời. Một ô thuộc FR của AC phủ nó; ô không test thuộc FR định nghĩa event. Ruling nằm ở review-flows.md mục 8. -->

| Item | Risk | Kinds and techniques | Coverage met / required |
|---|---|---|---|
| FR-071 | high | Flow của use case dùng **use case testing**. Vòng đời workspace dùng **state transition**. Luật chọn folder dùng **decision table**. Đường dẫn và tên folder dùng **EP + BVA**. "Không đọc file" và "giữ chat" dùng **invariant check**. | 38 / 38 (dời: Z-10, Z-12) |
| FR-072 | normal | Flow của use case dùng **use case testing**. | 7 / 7 |
| FR-073 | high | Flow của use case dùng **use case testing**. Vòng đời workspace dùng **state transition**. "Chat giữ nguyên" dùng **invariant check**. | 8 / 8 (không test: Z-9) |
| FR-074 | high | Flow của use case dùng **use case testing**. Vòng đời của folder dùng **state transition**. "Không đọc file" dùng **invariant check**. | 7 / 7 |
| FR-083 | high | Flow của use case dùng **use case testing**. Vòng đời workspace dùng **state transition**. Luật chọn folder dùng **decision table**. "Không đọc file" dùng **invariant check**. | 14 / 14 |
| FR-142 | high | Flow của use case dùng **use case testing**. Vòng đời của folder dùng **state transition**. Luật chọn folder dùng **decision table**. "Không đọc file" dùng **invariant check**. | 12 / 12 |
| FR-084 | high | "Project folder không đổi" dùng **invariant check**, có **positive control**. | 10 / 10 |
| FR-141 | normal | Flow của use case dùng **use case testing**. PO **chỉ định thêm** một gap: tên 1 ký tự, dùng **BVA**. | 6 / 6 |
| FR-053 | normal | Flow của use case dùng **use case testing**. | 3 / 3 |
| FR-048 | normal | Flow của use case dùng **use case testing**. | 1 / 1 |
| FR-038 | normal | Flow của use case dùng **use case testing**. | 4 / 4 |
| NFR-008 | high | Reliability dùng **fault injection**. | 2 / 2 (phần request: Z-14) |
| **Tổng** | | | **112 / 112** (3 mục không test hoặc dời) |

## Test driver and fixtures

Luật chung của driver và fixture nằm ở [test-strategy.md](../../../development/test-strategy.md) "Test infrastructure rules". Mục này chỉ ghi **phần riêng của build**. **Contract phía test** (function, field, quy tắc dưới đây) và **fixture** được **quyết khi PO duyệt plan này**; **Phase 3 chỉ quyết** cách **nối driver vào interface thật**.

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
- **fs audit:** chế độ test chạy server với **một module preload** ghi **mọi lệnh `fs`** và đường dẫn của nó. `fsAudit(path)` trả về các lệnh trên đường dẫn **nằm trong `path`**, so sau khi **chuẩn hoá cả hai vế**: `realpathSync.native` khi đường dẫn tồn tại, nếu không thì `path.resolve` và **không phân biệt hoa thường**. Như vậy một lệnh **qua junction hoặc đường dẫn 8.3** vẫn bị bắt. **Được phép:** `stat`, `access`, `opendir` trên **chính project folder**. **Không được phép:** `open`, `readFile`, `createReadStream` trên **bất kỳ file nào bên trong**. **Positive control:** mỗi lần dùng phải thấy **ít nhất một `stat`** trên project folder. Khi preload **chưa bật**, `fsAudit` throw **`AuditNotEnabledError`**. Vì vậy các AC dùng `fsAudit` **chỉ chứng minh được** fail vì assertion, và **chỉ đổi sang `it`**, **sau** khi **implementation ticket của preload** merge.
- **Folder thay thế:** driver khởi động DeckAgent với **folder thay thế** cho **folder của người dùng**, **các key folder**, **data folder** và **system folder**. Chúng là **fixture**: **folder thật trên đĩa**, **không mock** hành vi DeckAgent. **Hai yêu cầu cho Phase 3:** DeckAgent **đọc các đường dẫn này từ cấu hình lúc khởi động**, **không đọc lúc load module**; server **nhận port 0** để chạy **nhiều server song song** ([open-design-earlier-work.md](../../research/open-design-earlier-work.md) item 12).
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
| global setup | **chỉ gỡ** ổ `subst` và **chỉ `icacls /reset`** các folder mà **registry của suite** (`root\registry.json`) ghi từ lần chạy trước, **dưới lock file** của suite | ổ `subst` **không có trong registry** **không bị đụng** |

## Acceptance criteria

<!-- Given/When/Then/Catches/Check/Tier. "Cùng folder" theo windows-folders.md mục 1 (PO quyết ở #52): cùng dev:ino; khi không đọc được ID thì cùng đường dẫn realpathSync.native. -->

### FR-071

#### AC-1 · Thêm folder đọc được

- **Given:** lần chạy đầu; folder `Proj` đọc được, chưa workspace nào giữ
- **When:** người dùng thêm `Proj`
- **Then:** có một workspace mới với **project folder `Proj`**
- **Then:** tên workspace là **`Proj`**
- **Then:** nó là **workspace đang dùng**
- **Catches:** DeckAgent đặt tên workspace theo **cả đường dẫn** thay vì tên folder; hoặc thêm xong **không chuyển** workspace đang dùng
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Cùng folder, đường dẫn khác

- **Given:** workspace `W` cho folder `Proj`; trước mỗi lần thêm, người dùng **chuyển sang default workspace**
- **When:** người dùng thêm lại `Proj` bằng từng đường dẫn sau: **khác chữ hoa và thường**; **có `\` ở cuối**; **dùng `/` thay `\`**; **có tiền tố `\\?\`**; **đường dẫn 8.3**; **qua một junction**; **qua một ổ `subst`**
- **Then:** response **không có `error`**
- **Then:** số workspace **không đổi**
- **Then:** `W` **trở thành** workspace đang dùng
- **Catches:** DeckAgent **so đường dẫn như chuỗi**, nên một trong bảy dạng thành **workspace thứ hai**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Chuyển sang workspace có sẵn

- **Given:** workspace `A` (đang dùng) và `B`, với ba trường hợp của `A`: `A` **đọc được**; `A` **không đọc được** (như FR-074 AC-1); `A` **có folder khác ở chỗ cũ** (như FR-142 AC-1)
- **When:** người dùng chuyển sang `B`, **không đưa folder nào**
- **Then:** `B` là workspace đang dùng
- **Then:** danh sách workspace **không đổi**
- **Then:** `status` của `A` **giống trước khi chuyển**
- **Catches:** DeckAgent **bắt chọn lại folder** khi chuyển. DeckAgent **tạo workspace mới** khi chuyển. DeckAgent **không cho rời** một workspace đang lỗi. DeckAgent chuyển xong thì `A` **mất `status` lỗi**.
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Folder không đọc được

- **Given:** workspace `A` đang dùng. Bốn đường dẫn: **không tồn tại**; folder **bị chặn quyền đọc**; **trỏ vào file**; **đường dẫn tương đối** `.\Proj`. Server chạy với **`cwd` có sẵn một folder `Proj` đọc được**
- **When:** người dùng thêm từng đường dẫn
- **Then:** **không workspace nào** được thêm
- **Then:** `A` vẫn là workspace đang dùng
- **Then:** `error.code` là `folder_unreadable`
- **Catches:** DeckAgent **tạo workspace** cho đường dẫn không tồn tại, cho **một file**, hoặc cho đường dẫn tương đối **tính theo folder chạy server**
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Không chọn folder

- **Given:** workspace `A` đang dùng
- **When:** người dùng thêm **một đường dẫn rỗng**, rồi **một đường dẫn chỉ có khoảng trắng**
- **Then:** **không workspace nào** được thêm
- **Then:** `A` vẫn là workspace đang dùng
- **Then:** `error.code` là `no_folder`
- **Catches:** DeckAgent coi đường dẫn rỗng là **folder chạy server** và tạo workspace cho folder đó
- **Check:** deterministic
- **Tier:** ci

#### AC-6 · Refused folder bao quanh protected folder

- **Given:** workspace `A` đang dùng; folder thay thế sắp xếp như máy thật: `userDir` chứa `userDir\AppData\DeckAgent` (data folder) và các key folder; `systemDirs` là folder tạm; tất cả dưới root trên ổ `C:`
- **When:** người dùng thêm từng folder: **drive root** `C:\`; `userDir`; `userDir\AppData`
- **Then:** **không workspace nào** được thêm
- **Then:** `A` vẫn là workspace đang dùng
- **Then:** `refusal.rules` **đúng bằng**: với `C:\` là V-1, V-2, V-5; với `userDir` là V-3, V-5; với `userDir\AppData` là V-5
- **Then:** `refusal.insideAllowed` là `true`
- **Catches:** DeckAgent từ chối `C:\` nhưng **không cho biết** có thể chọn folder bên trong; hoặc **chỉ báo value đầu tiên** tìm thấy
- **Check:** deterministic
- **Tier:** ci

#### AC-7 · Refused folder thuộc protected folder

- **Given:** workspace `A` đang dùng; folder thay thế như AC-6
- **When:** người dùng thêm từng folder: một **system folder** thay thế và một folder **bên trong** nó; `userDir\.ssh` và `userDir\.ssh\sub`; data folder và một folder **bên trong** nó; `userDir\.ssh` qua **junction**, qua **ổ `subst`** và qua **tiền tố `\\?\`**. Một test riêng, **không truyền `systemDirs`**, thêm **`C:\Windows` thật**
- **Then:** **không workspace nào** được thêm
- **Then:** `A` vẫn là workspace đang dùng
- **Then:** `refusal.rules` **đúng bằng**: với system folder, folder bên trong nó và `C:\Windows` là V-2; với `.ssh`, `.ssh\sub` và ba dạng đường dẫn tới `.ssh` là V-4; với data folder và folder bên trong là V-5
- **Then:** `refusal.insideAllowed` là `false`
- **Catches:** DeckAgent **so chuỗi**, nên `.ssh` **lọt qua** một junction, một ổ `subst` hoặc tiền tố `\\?\`; hoặc **gợi ý chọn folder bên trong** `C:\Windows`
- **Check:** deterministic
- **Tier:** ci

#### AC-8 · Không đọc file của folder

- **Given:** folder `Proj` có một file `secret.txt` **bị chặn quyền đọc**
- **When:** người dùng thêm `Proj`
- **Then:** workspace được thêm
- **Then:** `fsAudit(Proj)` **không có lệnh mở hay đọc file nào**
- **Then:** `secret.txt` **không xuất hiện** ở bất kỳ chỗ nào trong response
- **Catches:** DeckAgent **mở file trong folder** khi thêm, ví dụ để đoán tên hoặc tìm file entry
- **Check:** deterministic
- **Tier:** ci

#### AC-9 · Giữ chat hiện tại và draft khi thêm hoặc chuyển

- **Given:** chat hiện tại `C` có draft `"hello"`, trong workspace `A`
- **When:** người dùng thêm một folder, rồi chuyển lại về `A`
- **Then:** sau mỗi hành động, chat hiện tại vẫn là `C`
- **Then:** sau mỗi hành động, draft của `C` vẫn là `"hello"`
- **Catches:** thêm folder thì **tạo chat mới** và **bỏ draft** của chat đang mở
- **Check:** deterministic
- **Tier:** ci

#### AC-10 · Mọi interface theo workspace đang dùng

- **Given:** **hai interface đang mở** `I1`, `I2`; workspace `A` đang dùng
- **When:** `I1` chuyển sang `B`
- **Then:** `I2` nhận event `workspaceInUse` với `workspaceId` là `B`, **không cần reload**
- **Then:** sau event đó, `I2.inUse()` là `B`
- **Catches:** chỉ interface gây ra thay đổi được cập nhật; interface kia **vẫn hiện workspace cũ** đến khi reload
- **Check:** deterministic
- **Tier:** ci

#### AC-11 · Đường dẫn dài

- **Given:** ba folder đọc được có đường dẫn **đúng 259, 260 và 261 ký tự**, và một folder **300 ký tự**
- **When:** người dùng thêm từng folder
- **Then:** mỗi folder có **một workspace mới**, **không có `error`**
- **Then:** project folder của mỗi workspace **trỏ đúng folder đó**
- **Catches:** DeckAgent dùng API **giới hạn 260 ký tự** (MAX_PATH), nên báo folder dài là **không đọc được**
- **Check:** deterministic
- **Tier:** ci

#### AC-12 · Tên folder khác nhau chỉ ở chuẩn hoá Unicode

- **Given:** cùng một folder cha có hai folder `Việt`: một tên ở **dạng NFC**, một ở **dạng NFD**; NTFS coi đây là **hai folder khác nhau**
- **When:** người dùng thêm folder NFC, rồi folder NFD
- **Then:** có **hai workspace**
- **Then:** project folder của mỗi workspace **trỏ đúng folder** đã thêm
- **Then:** tên mỗi workspace **giống từng byte** tên folder của nó
- **Catches:** DeckAgent **chuẩn hoá NFC đường dẫn**, nên folder thứ hai **bị coi là folder thứ nhất**, hoặc workspace **trỏ sai folder**
- **Check:** deterministic
- **Tier:** ci

#### AC-13 · Thêm folder đã bị dời đi

- **Given:** workspace `W` cho `Proj`, có chat `C`; `Proj` bị dời sang `Moved`, nên `W` là `unreadable`; default workspace đang dùng
- **When:** người dùng thêm `Moved`
- **Then:** số workspace **không đổi**
- **Then:** `W` là workspace đang dùng
- **Then:** project folder của `W` là `Moved`, và `status` của `W` là `readable`
- **Then:** `C` vẫn nằm trong `W`
- **Catches:** DeckAgent **so đường dẫn thay vì ID folder**, nên tạo **workspace thứ hai** cho folder đã dời; hoặc chuyển sang `W` nhưng **vẫn giữ đường dẫn cũ**
- **Check:** deterministic
- **Tier:** ci

#### AC-14 · Thêm folder mới ở chỗ cũ

- **Given:** workspace `W` cho `Proj`; `Proj` bị dời đi, rồi **một folder mới được tạo ở cùng đường dẫn**, nên `W` là `differentFolder`
- **When:** người dùng thêm đường dẫn `Proj`
- **Then:** có **một workspace mới** cho folder mới, và nó là workspace đang dùng
- **Then:** `W` **vẫn là `differentFolder`**, với chat của nó
- **Catches:** DeckAgent **so đường dẫn thay vì ID folder**, nên **chuyển sang `W`** và **gắn folder mới vào `W`** mà người dùng **không chọn**
- **Check:** deterministic
- **Tier:** ci

#### AC-15 · Tên folder dài hơn tên dài nhất

- **Given:** folder đọc được có tên **150 ký tự ASCII**; một folder khác có tên **đúng 100 ký tự**
- **When:** người dùng thêm từng folder
- **Then:** workspace của folder 150 ký tự có tên là **100 ký tự đầu** của tên folder
- **Then:** workspace của folder 100 ký tự có tên **đúng bằng** tên folder
- **Then:** cả hai lần **không có `error`**
- **Catches:** DeckAgent **từ chối thêm** folder có tên dài, **lưu tên dài hơn 100 ký tự**, hoặc **cắt cả tên vừa đủ 100**
- **Check:** deterministic
- **Tier:** ci

### FR-072

#### AC-1 · Default workspace ở lần chạy đầu

- **Given:** **data folder rỗng**
- **When:** DeckAgent khởi động
- **Then:** có đúng **một workspace**, là **default workspace**
- **Then:** nó **không có project folder**
- **Then:** nó **có tên**
- **Then:** nó là workspace đang dùng
- **Catches:** lần chạy đầu **bắt chọn folder**, hoặc default workspace **trỏ vào folder chạy server**
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Khởi động lại giữ workspace đang dùng

- **Given:** workspace `B` đang dùng; lần thứ hai: default workspace đang dùng
- **When:** DeckAgent **dừng rồi khởi động lại** trên cùng data folder
- **Then:** workspace đang dùng **giống trước khi dừng**, ở cả hai lần
- **Catches:** khởi động lại **luôn quay về default workspace**, hoặc **luôn về workspace dùng gần nhất có folder**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Không bao giờ xoá default workspace

- **Given:** default workspace
- **When:** người dùng yêu cầu xoá nó, rồi xác nhận
- **Then:** default workspace **vẫn còn**
- **Then:** các chat của nó **không đổi**
- **Then:** workspace đang dùng **không đổi**
- **Then:** danh sách workspace **không đổi**
- **Catches:** DeckAgent **cho xoá default workspace**; hoặc từ chối xoá nhưng **đã lỡ đổi workspace đang dùng**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Làm việc không cần folder

- **Given:** lần chạy đầu
- **When:** người dùng tạo một chat và viết draft, **không chọn folder nào**
- **Then:** chat nằm trong default workspace
- **Then:** chat có draft đó
- **Catches:** tạo chat **lỗi** vì default workspace **không có folder**
- **Check:** deterministic
- **Tier:** ci

### FR-073

#### AC-1 · Hỏi trước khi xoá

- **Given:** workspace `W` có project folder `Proj` và chat `C`
- **When:** người dùng yêu cầu xoá `W`
- **Then:** server trả về **trạng thái chờ xác nhận** `removal`
- **Then:** `removal.folderStays` là `true`
- **Then:** `removal.chatsStay` là `true`
- **Then:** `W` **vẫn còn**
- **Catches:** DeckAgent **xoá ngay**, không hỏi xác nhận
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Xoá sau khi xác nhận

- **Given:** như AC-1; workspace `A` đang dùng; chat `C` có draft `"x"`
- **When:** người dùng xác nhận xoá `W`
- **Then:** `W` **không còn**
- **Then:** `C` là **ungrouped chat** (BR-004 V-3)
- **Then:** draft của `C` vẫn là `"x"`
- **Then:** `A` vẫn là workspace đang dùng
- **Catches:** DeckAgent **xoá luôn các chat** của workspace, hoặc chat **mất draft**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Xoá workspace đang dùng

- **Given:** workspace `W` đang dùng
- **When:** người dùng xoá `W` và xác nhận
- **Then:** **default workspace** là workspace đang dùng
- **Catches:** xoá workspace đang dùng nhưng workspace đang dùng **vẫn trỏ vào ID đã xoá**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Huỷ thì không xoá gì

- **Given:** như AC-1
- **When:** người dùng yêu cầu xoá `W`, rồi **huỷ**
- **Then:** `W` **không đổi**
- **Then:** `C` vẫn nằm trong `W`
- **Catches:** **huỷ vẫn xoá**, hoặc huỷ làm chat **rời khỏi workspace**
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Thêm lại folder cũ

- **Given:** workspace `W` của `Proj` đã bị xoá; chat `C` của nó là ungrouped chat
- **When:** người dùng thêm lại `Proj`
- **Then:** có **một workspace mới** cho `Proj`, **không có chat nào**
- **Then:** `C` vẫn là **ungrouped chat**
- **Catches:** thêm lại folder cũ thì **hồi sinh workspace cũ** và **kéo ungrouped chat về**
- **Check:** deterministic
- **Tier:** ci

#### AC-6 · Xoá khi folder không đọc được hoặc bị thay

- **Given:** workspace `W` có chat `C`; lần đầu `W` là `unreadable` (folder bị dời đi), lần sau `W` là `differentFolder`
- **When:** người dùng yêu cầu xoá `W`, rồi xác nhận
- **Then:** server trả về `removal` trước khi xoá
- **Then:** sau xác nhận, `W` **không còn** và `C` là **ungrouped chat**
- **Then:** folder đã dời và folder mới ở chỗ cũ **không đổi** (`snapshot`)
- **Catches:** DeckAgent **không cho xoá** workspace có folder lỗi, hoặc **dọn folder** khi xoá
- **Check:** deterministic
- **Tier:** ci

#### AC-7 · Dừng khi đang chờ xác nhận

- **Given:** người dùng đã yêu cầu xoá `W`, **chưa xác nhận**
- **When:** DeckAgent **dừng rồi khởi động lại**
- **Then:** `W` **vẫn còn**, với chat của nó
- **Catches:** DeckAgent **xoá trước rồi mới hỏi**, nên dừng giữa chừng **mất workspace**
- **Check:** deterministic
- **Tier:** ci

### FR-074

#### AC-1 · Folder bị dời đi

- **Given:** workspace `W` cho `Proj`
- **When:** `Proj` bị **dời sang chỗ khác**, rồi người dùng xem danh sách workspace
- **Then:** `status` của `W` là `unreadable`
- **Then:** `unreadable.actions` **không rỗng**
- **Then:** mọi phần tử của `unreadable.actions` thuộc tập `restore`, `grantAccess`, `chooseFolder`
- **Then:** `raw` của report **không có field `cause`**
- **Then:** `fsAudit` của đường dẫn `Proj` và của **chỗ mới `Moved`** **không có lệnh mở hay đọc file nào**
- **Catches:** DeckAgent báo **"folder đã bị xoá"** dù không biết nguyên nhân; hoặc báo lỗi **không kèm việc người dùng làm tiếp**
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Mất quyền đọc

- **Given:** workspace `W` cho `Proj`
- **When:** quyền đọc `Proj` **bị chặn**, rồi người dùng xem danh sách workspace
- **Then:** giống AC-1
- **Catches:** DeckAgent chỉ phát hiện folder **mất**, **không phát hiện mất quyền đọc**
- **Check:** deterministic
- **Tier:** ci

_FR-074 **cố ý không nêu nguyên nhân**, và các hành động trong statement chỉ là **ví dụ** ("such as"). Vì vậy AC-1 và AC-2 **cùng kết quả mong đợi**._

#### AC-3 · Workspace và chat vẫn còn

- **Given:** `W` không đọc được (như AC-1); chat `C` của nó có draft `"x"`
- **When:** người dùng chuyển sang `W` và mở `C`
- **Then:** `W` **vẫn còn**
- **Then:** `C` mở ra với draft `"x"`
- **Catches:** workspace không đọc được **bị gỡ**, hoặc chat của nó **không mở được**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Folder được đặt lại chỗ cũ

- **Given:** `W` không đọc được vì `Proj` đã bị dời đi
- **When:** `Proj` được **dời về chỗ cũ**
- **Then:** `status` của `W` là `readable`
- **Catches:** một lần không đọc được thì **đánh dấu mãi**
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Folder mới ở chỗ cũ bị dời đi

- **Given:** `W` có folder khác ở chỗ cũ (như FR-142 AC-1); người dùng **đã xem danh sách workspace** và thấy `status` của `W` là `differentFolder`
- **When:** folder mới ở chỗ cũ **bị dời sang chỗ khác**, rồi người dùng **xem lại** danh sách workspace
- **Then:** `status` của `W` là `unreadable`
- **Then:** `fsAudit` của đường dẫn `Proj` và của **chỗ mới** của folder mới **không có lệnh mở hay đọc file nào**
- **Catches:** DeckAgent **giữ `status` đã báo** lần trước, **không kiểm lại** chỗ cũ.
- **Check:** deterministic
- **Tier:** ci

### FR-083

#### AC-1 · Chọn folder khác

- **Given:** workspace `W` tên `Old` cho `Proj`, có chat `C`; folder `Proj2` đọc được, chưa workspace nào giữ
- **When:** người dùng chọn `Proj2` cho `W`
- **Then:** project folder của `W` là `Proj2`
- **Then:** `W` vẫn tên `Old`
- **Then:** `C` vẫn nằm trong `W`
- **Then:** `fsAudit(Proj2)` **không có lệnh mở hay đọc file nào**
- **Catches:** đổi folder thì **đổi luôn tên** theo folder mới, hoặc **tạo workspace mới** thay vì sửa workspace cũ
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Folder của workspace khác

- **Given:** workspace `W` cho `Proj`, workspace `V` cho `Proj2`
- **When:** người dùng chọn cho `W` đường dẫn `Proj2`, rồi một junction tới `Proj2`
- **Then:** **cả hai** workspace **không đổi**
- **Then:** `error.code` là `folder_taken`
- **Then:** `takenBy` là `V`
- **Catches:** DeckAgent cho **hai workspace cùng một folder**, hoặc báo lỗi **không nói workspace nào** giữ folder
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Folder không đọc được

- **Given:** workspace `W` cho `Proj`; server chạy với **`cwd` có sẵn một folder `Proj2` đọc được**
- **When:** người dùng chọn cho `W` lần lượt: một **đường dẫn không tồn tại**; một đường dẫn **trỏ vào file**; **đường dẫn tương đối** `.\Proj2`
- **Then:** `W` **không đổi**
- **Then:** `error.code` là `folder_unreadable`
- **Catches:** DeckAgent **nhận đường dẫn không tồn tại**, một file, hoặc đường dẫn tương đối **tính theo folder chạy server**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Refused folder

- **Given:** workspace `W` cho `Proj`; folder thay thế như FR-071 AC-6
- **When:** người dùng chọn cho `W` từng folder của FR-071 AC-6 và AC-7, **trừ `C:\Windows` thật**
- **Then:** `W` **không đổi**
- **Then:** `refusal.rules` và `refusal.insideAllowed` **giống** FR-071 AC-6 và AC-7
- **Catches:** DeckAgent kiểm BR-019 khi **thêm** workspace nhưng **quên kiểm khi đổi folder**
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Không áp dụng cho default workspace

- **Given:** default workspace
- **When:** người dùng chọn một folder đọc được cho nó
- **Then:** default workspace **vẫn không có project folder**
- **Catches:** DeckAgent **cho default workspace một project folder**
- **Check:** deterministic
- **Tier:** ci

#### AC-6 · Không tự đổi folder

- **Given:** workspace `W` cho `Proj`; test **ghi lại `folder`** mà DeckAgent trả cho `W`; rồi `Proj` bị dời sang `Moved`
- **When:** DeckAgent **khởi động lại**
- **Then:** `folder` của `W` **bằng đúng chuỗi** đã ghi lại
- **Then:** `status` của `W` là `unreadable`
- **Catches:** khi folder bị dời, DeckAgent **tự đổi project folder** sang chỗ mới
- **Check:** deterministic
- **Tier:** ci

#### AC-7 · Chọn folder khác khi folder không đọc được hoặc bị thay

- **Given:** workspace `W` có chat `C`; lần đầu `W` là `unreadable`, lần sau `W` là `differentFolder`; folder `Proj3` đọc được, chưa workspace nào giữ
- **When:** người dùng chọn `Proj3` cho `W`
- **Then:** project folder của `W` là `Proj3`
- **Then:** `status` của `W` là `readable`
- **Then:** `C` vẫn nằm trong `W`
- **Catches:** DeckAgent **chỉ cho đổi folder** khi folder cũ **còn đọc được**, nên người dùng **không sửa được** workspace lỗi
- **Check:** deterministic
- **Tier:** ci

### FR-142

#### AC-1 · Báo folder khác

- **Given:** workspace `W` cho `Proj`; `Proj` bị dời đi, rồi **một folder mới được tạo ở cùng đường dẫn**
- **When:** người dùng xem danh sách workspace, rồi DeckAgent **khởi động lại** và người dùng xem lại
- **Then:** cả hai lần, `status` của `W` là `differentFolder`
- **Then:** `fsAudit` của folder mới **không có lệnh mở hay đọc file nào**
- **Catches:** DeckAgent coi folder mới ở chỗ cũ **là folder cũ** (chỉ so đường dẫn), báo nó là **"không đọc được"**, hoặc **tự nhận** nó sau khi khởi động lại
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Dùng folder khác

- **Given:** như AC-1
- **When:** người dùng chọn **dùng folder đó** cho `W`, rồi DeckAgent **khởi động lại một lần**
- **Then:** sau khi chọn, `status` của `W` là `readable`
- **Then:** sau khi khởi động lại, `status` của `W` là `readable`
- **Catches:** dùng folder mới nhưng **không lưu ID mới**, nên sau khởi động lại **lại báo folder khác**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Dùng folder khác vẫn theo luật chọn folder

- **Given:** như AC-1, với ba biến thể của folder mới: **junction tới folder của workspace `V`**; folder **bị chặn quyền đọc**; **junction tới `userDir\.ssh`**
- **When:** người dùng chọn **dùng folder đó** cho `W`
- **Then:** với mỗi biến thể, `W` **không đổi**
- **Then:** `error.code` lần lượt là `folder_taken`, `folder_unreadable`, `folder_refused` (với `refusal.rules` là V-4)
- **Catches:** "dùng folder này" **bỏ qua các kiểm tra** của việc chọn folder
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Trước khi chọn, workspace và chat vẫn còn

- **Given:** như AC-1; chat `C` của `W` có draft `"x"`
- **When:** người dùng mở `C`
- **Then:** `W` **vẫn còn**
- **Then:** `C` mở ra với draft `"x"`
- **Catches:** khi báo folder khác, DeckAgent **khoá workspace hoặc chat**
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Folder mới xuất hiện khi workspace đang không đọc được

- **Given:** workspace `W` cho `Proj`; `Proj` bị dời đi; người dùng **đã xem danh sách workspace** và thấy `status` của `W` là `unreadable`
- **When:** **một folder mới được tạo** ở cùng đường dẫn `Proj`, rồi người dùng **xem lại** danh sách workspace
- **Then:** `status` của `W` là `differentFolder`
- **Then:** `fsAudit` của folder mới **không có lệnh mở hay đọc file nào**
- **Catches:** DeckAgent **giữ `status` đã báo** lần trước, **không kiểm lại** chỗ cũ.
- **Check:** deterministic
- **Tier:** ci

### FR-084

#### AC-1 · Project folder không đổi sau mọi hành động của build này

- **Given:** folder `Proj` có **một file, một subfolder và một file ẩn**; `snapshot` của nó
- **When:** người dùng lần lượt: thêm `Proj`; chuyển đi rồi chuyển về; đổi tên workspace; tạo chat; viết draft; khởi động lại DeckAgent; chọn `Proj2` rồi chọn lại `Proj`; xoá workspace
- **Then:** mỗi hành động **thành công**: response **không có `error`**, và state đổi như hành động đó yêu cầu
- **Then:** sau mỗi hành động, `snapshot` của `Proj` **giống hệt** ban đầu
- **Catches:** DeckAgent **ghi file** vào project folder (marker, cache, lock), hoặc **đổi file** khi xoá workspace
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Folder mới ở chỗ cũ không đổi khi dùng nó

- **Given:** như FR-142 AC-1; folder mới có **một file**; `snapshot` của folder mới
- **When:** người dùng chọn **dùng folder đó** cho `W`
- **Then:** `status` của `W` là `readable`
- **Then:** `snapshot` của folder mới **giống hệt** ban đầu
- **Catches:** khi nhận folder mới, DeckAgent **ghi marker** vào đó để nhớ ID
- **Check:** deterministic
- **Tier:** ci

### FR-141

#### AC-1 · Đổi tên

- **Given:** workspace `W` tên `Old` cho `Proj`, có chat `C`
- **When:** người dùng đổi tên `W` thành `New`
- **Then:** `W` tên `New`
- **Then:** project folder của `W` là `Proj`
- **Then:** `C` vẫn nằm trong `W`
- **Catches:** đổi tên làm **mất liên kết** với folder hoặc chat
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Đổi tên default workspace

- **Given:** default workspace
- **When:** người dùng đổi tên nó thành `Mine`
- **Then:** nó tên `Mine`
- **Then:** nó **vẫn là default workspace**
- **Catches:** DeckAgent **không cho đổi tên default workspace**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Cho phép trùng tên

- **Given:** workspace `A` và `B`
- **When:** người dùng đổi tên `B` thành tên của `A`
- **Then:** **cả hai** workspace mang tên đó
- **Catches:** DeckAgent **từ chối tên trùng**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Bỏ khoảng trắng hai đầu

- **Given:** workspace `W` tên `Old`
- **When:** người dùng đổi tên `W` thành `"  New  "`
- **Then:** `W` tên `New`
- **Catches:** DeckAgent **lưu nguyên khoảng trắng** hai đầu
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Tên bị từ chối

- **Given:** workspace `W` tên `Old`
- **When:** người dùng đổi tên `W` thành `"   "` (BR-020 V-1), rồi thành một tên **101 ký tự** (V-2)
- **Then:** sau mỗi lần, `W` **vẫn tên `Old`**
- **Then:** lần đầu, `error.code` là `name_refused` và `refusal.rules` là `BR-020 V-1`
- **Then:** lần sau, `error.code` là `name_refused` và `refusal.rules` là `BR-020 V-2`
- **Catches:** DeckAgent **lưu tên rỗng hoặc quá dài**; hoặc từ chối **không nói lý do**
- **Check:** deterministic
- **Tier:** ci

#### AC-6 · Tên dài nhất vẫn được nhận

- **Given:** workspace `W` tên `Old`
- **When:** người dùng đổi tên `W` thành một tên viết bằng **chữ tiếng Việt ở dạng NFD**, có **100 code point sau NFC** và **hơn 100 code point trước NFC**
- **Then:** `W` được đổi tên, **không có `error`**
- **Then:** tên của `W`, sau khi chuẩn hoá NFC, **bằng** tên đã nhập sau khi chuẩn hoá NFC
- **Catches:** DeckAgent **đếm trước khi chuẩn hoá NFC**, nên **từ chối nhầm** tên tiếng Việt hợp lệ
- **Check:** deterministic
- **Tier:** ci

#### AC-7 · Tên một ký tự

- **Given:** workspace `W` tên `Old`
- **When:** người dùng đổi tên `W` thành `"x"`, rồi thành `" x "`
- **Then:** cả hai lần, `W` tên `x`, **không có `error`**
- **Catches:** DeckAgent **đặt giới hạn dưới sai** (ví dụ từ chối tên ngắn hơn 2 ký tự), hoặc **kiểm tên đã bỏ khoảng trắng** nhưng **lưu tên chưa bỏ**
- **Check:** deterministic
- **Tier:** ci

#### AC-8 · Đổi tên khi folder không đọc được hoặc bị thay

- **Given:** workspace `W` tên `Old`, có chat `C`; lần đầu `W` là `unreadable`, lần sau `W` là `differentFolder`
- **When:** người dùng đổi tên `W` thành `New`
- **Then:** `W` tên `New`
- **Then:** `status` của `W` **không đổi**
- **Then:** `C` vẫn nằm trong `W`
- **Catches:** DeckAgent **khoá mọi thao tác** trên workspace có folder lỗi, hoặc đổi tên thì **xoá trạng thái lỗi**
- **Check:** deterministic
- **Tier:** ci

### FR-053

#### AC-1 · Chat mới rỗng và là chat hiện tại

- **Given:** workspace `A` đang dùng
- **When:** người dùng tạo chat mới
- **Then:** chat mới là **chat hiện tại**
- **Then:** nó nằm trong `A`
- **Then:** draft của nó **rỗng**
- **Catches:** chat mới **mang theo draft** của chat trước, hoặc tạo chat **không đổi chat hiện tại**
- **Check:** deterministic
- **Tier:** ci

_"Không có conversation" và "không có deck" **dời sang build 3 và build 5**: build này **chưa tạo được** conversation hay deck._

#### AC-2 · Chat khác không đổi

- **Given:** chat `C` có draft `"hello"`
- **When:** người dùng tạo chat mới
- **Then:** draft của `C` vẫn là `"hello"`
- **Then:** draft của chat mới **rỗng**
- **Catches:** tạo chat mới **làm mất draft** của chat cũ
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Chat mới vào workspace đang dùng

- **Given:** workspace `A` và `B`; người dùng đã chuyển sang `B`
- **When:** người dùng tạo chat mới
- **Then:** chat nằm trong `B`
- **Catches:** chat mới vào **default workspace** thay vì workspace đang dùng
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Interface khác giữ chat hiện tại của nó

- **Given:** hai interface đang mở, cả hai ở chat `C`; workspace `A` đang dùng
- **When:** `I1` tạo chat mới
- **Then:** chat mới nằm trong `A`
- **Then:** `currentChat()` của `I2` vẫn là `C` (DEC-012: mỗi interface **giữ chat hiện tại riêng**)
- **Catches:** tạo chat ở một interface **kéo interface kia** sang chat mới
- **Check:** deterministic
- **Tier:** ci

#### AC-5 · Chưa có model để dùng tiếp

- **Given:** **chưa model nào từng được chọn**
- **When:** người dùng tạo chat mới
- **Then:** `model` của chat là `null`
- **Then:** `notice` là `noModel`
- **Catches:** DeckAgent **tự chọn một model mặc định**; hoặc để trống mà **không báo**
- **Check:** deterministic
- **Tier:** ci

### FR-048

_AC-1 ("chỉ chat của workspace đang dùng") **dời sang build 3**: trước build 3 **chưa chat nào là chat cũ** (BR-004 V-1), nên assert đó **luôn pass**. Build 3 viết AC-1._

#### AC-2 · Không có chat cũ

- **Given:** workspace không có chat cũ nào; chat hiện tại có draft `"x"`
- **When:** người dùng xem chat cũ
- **Then:** kết quả **rỗng**, và `notice` là `noEarlierChats`
- **Then:** chat hiện tại không đổi
- **Then:** draft của nó vẫn là `"x"`
- **Catches:** danh sách rỗng mà **không báo gì**, hoặc xem chat cũ **làm đổi chat hiện tại**
- **Check:** deterministic
- **Tier:** ci

### FR-038

#### AC-1 · Giữ draft khi ở chỗ khác

- **Given:** chat `C1` có draft `"abc"`
- **When:** người dùng sang chat `C2`, rồi quay lại `C1`
- **Then:** draft của `C1` là `"abc"`
- **Catches:** draft **bị xoá** khi chuyển chat
- **Check:** deterministic
- **Tier:** ci

_"Không gửi gì" **dời sang build 3**: build này **chưa gửi được** request._

#### AC-2 · Giữ draft khi reload

- **Given:** chat `C` có draft `"abc"`
- **When:** interface **bị đóng rồi mở lại**, trong lúc DeckAgent vẫn chạy
- **Then:** draft của `C` là `"abc"`
- **Catches:** draft chỉ giữ **trong bộ nhớ trang**, nên reload **mất draft**
- **Check:** deterministic
- **Tier:** ci

#### AC-3 · Mọi interface thấy cùng draft

- **Given:** hai interface đang mở, cả hai ở chat `C`
- **When:** `I1` đặt draft thành `"abc"`, và DeckAgent **xác nhận đã lưu** draft
- **Then:** sau xác nhận đó, `I2` đọc draft của `C` và được `"abc"`
- **Catches:** draft giữ **theo từng interface**, interface khác **không thấy**
- **Check:** deterministic
- **Tier:** ci

#### AC-4 · Không giữ draft sau khi DeckAgent dừng

- **Given:** chat `C` có draft `"abc"`
- **When:** DeckAgent **dừng rồi khởi động lại**
- **Then:** draft của `C` **rỗng**
- **Catches:** DeckAgent **lưu draft vào database**, nên draft **còn sau khi khởi động lại**
- **Check:** deterministic
- **Tier:** ci

## Measures

### NFR-008

_Build này chỉ test phần **chat** của NFR-008. Deck và setup provider thuộc **build sau**; vế "**nhận request mới**" **dời sang build 3** (review-flows.md Z-14)._

#### M-1 · Chat giữ trạng thái đã lưu khi DeckAgent chết giữa chừng

- **Condition:** DeckAgent **bị kill** (không dừng êm) tại **mỗi bước ghi** của hai hành động thay đổi chat: **xác nhận xoá workspace** (chat chuyển thành ungrouped chat) và **tạo chat mới**. Điểm kill được **chèn bằng fault injection** giữa các bước ghi; mỗi điểm một lần chạy
- **Measure:** sau khi khởi động lại, **mỗi chat** **mở được**, và nó nằm **đúng một chỗ**: trong workspace cũ **hoặc** là ungrouped chat; danh sách chat **hoặc giống trước hành động**, **hoặc giống sau hành động**
- **How to measure:** chạy hành động với điểm kill thứ `n`, khởi động lại, đọc mọi chat và workspace qua driver; lặp cho mọi `n`
- **Target:** **không có** chat nào **mất**, **không mở được** hoặc **nằm hai chỗ**, ở **mọi điểm kill**
- **Passes when:** mọi điểm kill đạt target
- **Tier:** ci

## Eval cases (eval tier)

None. **Đặt tên chat**, phần duy nhất do model tạo, đã **dời sang build 3** (#55, #56).

## Manual checks (manual tier)

None.

## Post-implementation tests

E2E chạy qua **interface thật trên browser**: acceptance test kiểm **hành vi qua field**; E2E kiểm rằng **người dùng thật sự thấy** thông tin và hành động tương ứng, **không so câu chữ**. **Đầu vào cho Phase 3** (open-design, research item 12): **Playwright với Chromium**; mỗi worker có **data folder và port riêng**; **thử lại 1 lần trên CI** và **báo** test nào **chỉ pass nhờ thử lại**; **chờ tín hiệu sẵn sàng**, **không chờ thời gian cố định**; run lỗi thì **giữ log và data folder**. PO **chốt framework ở Phase 3**.

| Level | Target | Technique | What it checks | Smoke |
|---|---|---|---|---|
| E2E | UC-013 main flow S1-S3 | use case testing | Người dùng mở DeckAgent lần đầu, **thêm `Proj`**, **tạo chat** trong workspace đó, **chuyển sang default workspace**, rồi **chuyển lại**. Test kiểm rằng người dùng **thấy chat đó** trong danh sách. | yes |
| E2E | UC-013 A2 | use case testing | Người dùng **yêu cầu xoá** một workspace có chat. Test kiểm rằng người dùng **thấy câu hỏi xác nhận**, và câu hỏi nói folder và chat **vẫn còn**. Người dùng **xác nhận**. Test kiểm rằng chat **thành ungrouped chat**, và default workspace **là workspace đang dùng**. | |
| E2E | UC-013 A3, A12 | use case testing | Folder của workspace **bị dời đi**. Test kiểm rằng người dùng **thấy báo lỗi** kèm **ít nhất một việc làm tiếp dùng được**. Một **folder mới được tạo ở chỗ cũ**. Test kiểm rằng người dùng **thấy báo có folder khác**, rồi **dùng được** folder đó. | |
| E2E | UC-013 A6, A11, A13 | use case testing | Người dùng **chọn folder khác**, **đổi tên** workspace, rồi đưa **một tên bị từ chối**. Test kiểm rằng người dùng **thấy lý do** từ chối, và chat **vẫn còn** trong workspace. | |
| E2E | UC-013 S3, FR-048 AC-2 | use case testing | Workspace **chưa có chat cũ**; người dùng **xem chat cũ**. Test kiểm rằng người dùng **thấy báo không có chat cũ**. | |
| E2E | UC-012 main flow, A1 | use case testing | Người dùng **tạo chat mới** từ một chat có draft. Test kiểm rằng draft cũ **giữ nguyên**, chat mới **rỗng**, và người dùng **thấy báo chưa có model**. | yes |
| Integration | NFR-008 M-1 | fault injection | Như **measure M-1** ở trên. | |

## Test-stub tickets

Mỗi ticket **đổi tối đa 3 file**, label `tier:ci`, mọi file nằm trong `tests/acceptance/`. **T0a và T0b chặn mọi ticket khác.** Mọi acceptance test viết bằng **`it.fails`**.

| Ticket | Criteria | Files | Fixtures | Blocked by |
|---|---|---|---|---|
| T0a · test driver | — | `support/deckagent.ts`, `support/errors.ts` | — | — |
| T0b · Windows fixture | — | `support/winfs.ts`, `support/winfs.test.ts`, `support/global-setup.ts` | mọi fixture và self-test của chúng | — |
| T1 · thêm và chuyển workspace | FR-071 AC-1..5, 8, 9, 11, 12, 15 | `workspaces-add-switch.test.ts` | `junction`, `substDrive`, `shortName`, `longPath`, `denyRead`, `move` | T0a, T0b |
| T2 · refused folder (security) | FR-071 AC-6, 7; FR-083 AC-4 | `refused-folders.test.ts` | `root`, `junction`, `substDrive` | T0a, T0b |
| T3 · nhiều interface | FR-071 AC-10; FR-053 AC-4; FR-038 AC-3 | `several-interfaces.test.ts` | — | T0a, T0b |
| T4 · default workspace và xoá workspace | FR-072 AC-1..4; FR-073 AC-1..5, 7 | `default-and-remove.test.ts` | — | T0a, T0b |
| T5 · folder mất hoặc bị thay | FR-074 AC-1..5; FR-142 AC-1..5 | `folder-gone-or-replaced.test.ts` | `move`, `junction`, `denyRead` | T0a, T0b |
| T6 · đổi folder và đổi tên | FR-083 AC-1..3, 5, 6; FR-141 AC-1..7 | `change-folder-rename.test.ts` | `junction`, `move` | T0a, T0b |
| T7 · project folder không đổi | FR-084 AC-1, 2 | `project-folder-untouched.test.ts` | `snapshot`, `move` | T0a, T0b |
| T8 · chat mới, chat cũ, draft | FR-053 AC-1..3, 5; FR-048 AC-2; FR-038 AC-1, 2, 4 | `chats-and-drafts.test.ts` | — | T0a, T0b |
| T9 · hành động khi folder lỗi | FR-071 AC-13, 14; FR-073 AC-6; FR-083 AC-7; FR-141 AC-8 | `actions-on-broken-folder.test.ts` | `move`, `snapshot` | T0a, T0b |

**Phase 4 phải có**, ngoài các implementation ticket theo module:
- **một ticket nối driver** (`deckagent.ts` gọi interface thật); nó **chặn mọi lần đổi `it.fails` thành `it`**, và mỗi implementation PR **cho thấy ở commit đầu** rằng test của nó **fail vì assertion** (test-strategy.md);
- **một ticket preload của fs audit**; các AC dùng `fsAudit` ở **T1, T5 và T6** **chỉ đổi sang `it`** sau ticket này;
- **một ticket integration** cho NFR-008 M-1 (`phase:post-impl`), cùng **unit test chèn lỗi** của transaction xoá workspace trong implementation ticket của nó.
