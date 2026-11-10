---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Acceptance criteria và measures — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Acceptance criteria và measures — workspace theo thư mục và chat mới

<!-- Nơi duy nhất giữ AC, measure, eval case, manual check và exploratory charter của build (dev/mvp/WORKFLOW.md "Spec rules" rule 2). Thuộc Test Design. AC và measure được viết hoặc rà SAU KHI technique của test-design.md đã suy ra condition và coverage item từ basis item và plan; AC nháp chỉ được đọc ở bước reconciliation của mỗi technique (test-strategy.md "How a technique is applied"). -->

## At a glance

- **Status:** **bản nháp trước STLC**, **chưa qua test design**. Nội dung dưới đây được **chuyển nguyên** từ testing-plan.md, **không sửa** AC, measure hay test case nào.
- **Dùng thế nào:** Test Design **không lấy** các AC này làm đầu vào. Mỗi technique ở [test-design.md](./test-design.md) suy ra condition và coverage item **từ basis item và plan**; AC ở đây chỉ được đọc ở **bước reconciliation** (match, missing, conflict, unsupported). Chúng **không phải bằng chứng** cho requirement coverage hay test design coverage.
- **Đã đối chiếu với spec qua D5:** FR-071 AC-12, AC-15; FR-141 AC-1, AC-3 đến AC-7. **FR-143** có AC-1, AC-2 viết từ spec.
- **Basis:** [test-analysis.md](../analysis/test-analysis.md) · **Plan:** [testing-plan.md](../planning/testing-plan.md) · **Spine:** [traceability-matrix.md](../traceability-matrix.md) · **Driver, fixture, ticket:** [test-implementation.md](../../implementation/test-implementation.md)

## AC, measure và test case

<!-- Định nghĩa nằm ở test-strategy.md "The chain" và "Test infrastructure rules"; mục này chỉ ghi cách build áp dụng chúng. -->

Ba khái niệm **tách nhau**:
- **AC** nói **điều kiện PO chấp nhận** một hành vi của FR, BR hoặc flow. AC **không phải một input**.
- **Measure** nói **đại lượng hoặc tính chất** quyết định một NFR, với **điều kiện, target và luật pass**. Build này có **một measure**: NFR-008 M-1.
- **Test case** là **một phép kiểm cụ thể** của một AC hoặc một measure: **một biến thể input**, precondition và expected result.

**Cách nhận diện và truy vết một biến thể:**
- Một biến thể là **độc lập** khi nó **khác các biến thể khác ở một coverage item** của condition (một partition, một giá trị biên, một ô state × event, một leaf, một dạng đường dẫn, một phần tử của closed list, một điểm chèn lỗi), và nó **pass hoặc fail được một mình**. Ví dụ: bảy dạng đường dẫn của FR-071 AC-2 là **bảy test case**.
- Mỗi AC hoặc measure có dòng **`Variants`**: mỗi biến thể một **nhãn** (`V1`, `V2`…) kèm **coverage item** của nó. AC chỉ có một input thì có `V1`.
- **ID của test case** là ID của AC hoặc measure **cộng nhãn**: `FR-071 AC-2 V6`, `NFR-008 M-1 V3`. Nhãn **không đánh số lại**.
- **Tên test trong code** bắt đầu bằng **ID của test case**; mỗi biến thể có **`it.fails` riêng**, ví dụ qua parameterized test.
- [test-design.md](./test-design.md) nối **mỗi coverage item** với **ID của test case** kiểm nó. Matrix giữ **một dòng cho mỗi AC hoặc measure**; test case truy vết **qua ID** của nó.
- Dòng **`Variants`** của một AC được thêm **khi test của AC đó được thiết kế**, trong technique của vùng nó. Một AC **chưa có** dòng này thì **chưa được tính** biến thể nào.

**Truy vết của measure:**

| Measure | Basis item | Quality risk | Technique và level | Coverage item (biến thể) | Mechanism | Record design |
|---|---|---|---|---|---|---|
| NFR-008 M-1 | NFR-008.1a, NFR-008.2a | QR-5 | **fault injection**; integration, kèm **unit test chèn lỗi** của transaction xoá | **Mỗi điểm kill** của **xác nhận xoá workspace** và **tạo chat mới**, với failure mode **kill tiến trình**; danh sách điểm được chốt **khi implementation có điểm chèn lỗi** (M13), nên **số biến thể chưa biết** | M13 | Dòng `Serves` và `Variants` của M-1; section fault injection (D10); dòng của M-1 trong matrix |

Basis item **deferred** của NFR-008 (NFR-008.1b, NFR-008.1c, NFR-008.2b, NFR-008.3) **không thuộc** M-1; build nhận của chúng ghi ở test-analysis.md (SR-7, SR-8d, SR-9).


## Acceptance criteria

> **Status:** một AC **dùng được** khi người viết test **đã đối chiếu nó với spec**; AC đã đối chiếu qua D5 ghi ở "At a glance". Khi technique của một vùng được thiết kế, nó **rà AC của vùng đó** và **thêm dòng `Serves` và `Variants`** (mục "AC, measure và test case" ở trên).

<!-- Given/When/Then/Catches/Check/Tier. "Cùng folder" theo windows-folders.md mục 1: cùng dev:ino; khi không đọc được ID thì cùng đường dẫn realpathSync.native. -->

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
- **Then:** tên của **cả hai** workspace là `Việt` ở **dạng NFC**
- **Then:** tên của **cả hai** folder trên đĩa **không đổi**
- **Catches:** DeckAgent **chuẩn hoá NFC đường dẫn**, nên folder thứ hai **bị coi là folder thứ nhất**
- **Catches:** DeckAgent cho workspace **trỏ sai folder**
- **Catches:** DeckAgent **lưu tên ở dạng NFD**, hoặc **đổi tên folder** trên đĩa
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
- **Then:** workspace của folder 150 ký tự có tên **đúng 100 ký tự**, là **một đoạn liền** của tên folder (AM-11: test **không assert** đoạn nào)
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

### FR-143

_Cách DeckAgent **phân biệt client được phép** do implementation chọn (FR-143 Notes). Driver mô phỏng client không được phép bằng `foreignClient(origin)` ([test-implementation.md](../../implementation/test-implementation.md)). Các **threat scenario** khác (ví dụ request không mang Origin) thuộc **D8**._

#### AC-1 · Từ chối thay đổi từ trang web bên ngoài

- **Given:** workspace `W` cho folder `Proj`, đang dùng; chat `C` trong `W` có draft `"abc"`; một workspace khác `X`
- **When:** `foreignClient("https://example.com")` gửi **một thao tác thay đổi trạng thái** tới server local
- **Then:** DeckAgent **từ chối** thao tác đó
- **Then:** danh sách workspace, tên, project folder và workspace đang dùng **không đổi**
- **Then:** danh sách chat, chat hiện tại của interface thật và draft của `C` **không đổi**
- **Variants:** mỗi thao tác là một biến thể: `V1` thêm folder, `V2` chuyển sang `X`, `V3` đổi tên `W`, `V4` chọn folder khác cho `W`, `V5` yêu cầu xoá `W`, `V6` xác nhận xoá `W` (thêm precondition: **interface thật đã yêu cầu xoá** `W` và đang chờ xác nhận), `V7` tạo chat mới, `V8` lưu draft của `C`
- **Catches:** DeckAgent **nhận thao tác từ mọi client** trên máy, nên một trang web **thêm, đổi tên hay xoá** workspace và chat
- **Catches:** DeckAgent **chỉ kiểm một số thao tác**, nên một thao tác còn lại **lọt qua**
- **Catches:** DeckAgent **từ chối nhưng vẫn ghi một phần** trạng thái
- **Check:** deterministic
- **Tier:** ci

#### AC-2 · Interface thật vẫn thay đổi được trạng thái

- **Given:** như AC-1
- **When:** **interface thật** của DeckAgent gửi cùng thao tác của từng biến thể ở AC-1
- **Then:** thao tác **thành công** và trạng thái **đổi đúng** như FR của nó
- **Variants:** `V1` đến `V8` như AC-1
- **Catches:** DeckAgent **từ chối cả interface thật**, nên AC-1 pass mà sản phẩm **không dùng được** (positive control của AC-1)
- **Check:** deterministic
- **Tier:** ci

## Measures

### NFR-008

_Build này chỉ test phần **chat** của NFR-008. Deck và setup provider thuộc **build sau**; vế "**nhận request mới**" **dời sang build 3** (SR-7 ở traceability-matrix.md)._

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

