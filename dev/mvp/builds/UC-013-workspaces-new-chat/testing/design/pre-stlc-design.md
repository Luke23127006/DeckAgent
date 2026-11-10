---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "Thiết kế trước STLC — workspace theo thư mục và chat mới"
milestone: mvp
created: 08-11-2026
---

# Thiết kế trước STLC — workspace theo thư mục và chat mới

<!-- Bản ghi của phần thiết kế viết trước khi áp dụng STLC (kế thừa review-flows.md). Không phải record của test design và không phải đầu vào của Test Design. -->

## At a glance

- **Status:** **bản nháp trước STLC**, chuyển nguyên từ test-design.md; các mã W, F, C, Q và K ở đây **trỏ vào AC nháp** của [acceptance-criteria.md](./acceptance-criteria.md).
- **Dùng thế nào:** Test Design **không đọc** file này khi suy ra condition. File chỉ được dùng ở **bước reconciliation** của mỗi technique, cùng AC nháp, để **không mất** những gì đã tìm được trước đây.
- **Cách đọc một chủ đề:** đọc **sơ đồ** trước; mỗi mũi tên có **một mã** (W1, F1, C1). Sau đó đọc khung **Luôn đúng**: các điều DeckAgent phải giữ **ở mọi mũi tên**. Cuối cùng đọc **bảng mũi tên**: mỗi mũi tên một dòng, ghi **khi nào** nó xảy ra, **DeckAgent phải làm gì**, và **lỗi nào** của DeckAgent mà test bắt được.
- **Ký hiệu:** mũi tên **nét đứt** là **dời sang build sau**. Các event **giữ nguyên state** gom vào **một ô "Ở lại …"** nối bằng **nét chấm**, thay cho mũi tên vòng về chính nó.
- **Chỗ khác plan đã biết:** mục 1 dưới đây áp **state transition** cho chat và draft, và **threat-based** cho integrity; plan không chọn hai việc đó ([testing-plan.md](../planning/testing-plan.md) mục 2.2).

## 1. Kỹ thuật đã áp dụng và tổng quan (bản cũ)

<!-- Bảng ghi technique đã có section trong file này. Cột basis item và số coverage item chưa điền: đó là việc của test design (Z-23). -->

| Technique | Áp dụng cho | Vì sao | Coverage criterion | Coverage items | Section |
|---|---|---|---|---|---|
| State transition | FR-071, FR-072, FR-073, FR-074, FR-083, FR-141, FR-142 (vòng đời workspace, folder); FR-053, FR-038 (chat, draft) | Vòng đời của workspace và folder; risk high | Mọi event ở mọi state, kể cả event bị từ chối | test design pending | 2, 3, 4, 5 |
| Decision table | FR-071, FR-083, FR-142 với BR-019 (đường dẫn folder); FR-141 với BR-020 (tên workspace) | Luật nhiều điều kiện; risk high | Mỗi leaf một outcome và ít nhất một test | test design pending | 6, 7 |
| EP + BVA | Đường dẫn folder; tên workspace (BR-020) | Đầu vào có format và giới hạn | Mọi partition; mỗi biên ở ba giá trị | test design pending | 6, 7 |
| Invariant check | FR-084, FR-071, FR-074, FR-083, FR-142 | Câu "không đọc file", "không đổi folder", "giữ chat" | Assert sau mọi hành động của vùng, có positive control | test design pending | Khung "Luôn đúng" ở 2, 3 |
| Use case testing | Flow của UC-013 và UC-012 | Testing plan chọn cho mọi FR | Mọi step và alternative có end state khác | test design pending | **Chưa có section** (Z-25) |
| Threat-based | Security: confidentiality, integrity, authorization (FR-143) | Test type đã chọn ở test analysis | Mỗi threat scenario được giữ có test | test design pending | **Chưa có section** (Z-25) |
| Fault injection | NFR-008 M-1 | Reliability; risk high | Điểm chèn lỗi × failure mode đã chọn | test design pending | **Chưa có section** (Z-25) |

```mermaid
flowchart LR
  WS["2 · Vòng đời workspace"]
  FG["3 · Folder bị mất hoặc bị thay"]
  SE["4 · Kiểm tra đủ:<br/>mọi event ở mọi state"]
  CH["5 · Chat và draft"]
  QF{{"6 · Cây quyết định:<br/>đường dẫn folder"}}
  QN{{"7 · Cây quyết định:<br/>tên workspace"}}
  WS -->|"thêm, đổi folder"| QF
  WS -->|"đổi tên"| QN
  WS -->|"folder đổi trên đĩa"| FG
  FG -->|"dùng folder khác"| QF
  WS --> SE
  FG --> SE
  WS -->|"chat thuộc workspace"| CH
```

## 2. Vòng đời workspace

```mermaid
flowchart TD
  START(["DeckAgent chạy lần đầu"])
  D["Default workspace đang dùng<br/>không có folder"]
  W["Workspace W đang dùng<br/>folder đọc được"]
  ASK["DeckAgent hỏi xác nhận xoá W"]
  REQ["Có request đang chạy"]
  DS["Ở lại default<br/>W3 · thêm folder bị từ chối, cây 6<br/>W4 · làm việc không cần folder<br/>W5 · đổi tên default<br/>W6 · chọn folder cho default<br/>W7 · yêu cầu xoá default<br/>W19 · khởi động lại"]
  WS["Ở lại W<br/>W8 · thêm lại cùng folder<br/>W10 · đổi tên, cây 7<br/>W11 · chọn folder khác, cây 6<br/>W12 · khởi động lại"]

  START -->|"W1"| D
  DS -.- D
  D -->|"W2 · thêm folder<br/>W16 · thêm lại folder của W đã xoá<br/>W20 · chuyển sang W có sẵn"| W
  W -->|"W9 · chuyển sang default"| D
  WS -.- W
  W -->|"W13 · yêu cầu xoá"| ASK
  ASK -->|"W14 · huỷ<br/>W18 · khởi động lại"| W
  ASK -->|"W15 · xác nhận"| D
  W -.->|"W17 · build 3"| REQ
```

**Luôn đúng** ở mọi mũi tên:
- **FR-084 AC-1:** sau mỗi hành động, project folder **không đổi**: mọi file và folder bên trong **giống hệt** lúc đầu.
- **FR-071 AC-8:** khi thêm workspace, DeckAgent **không mở và không đọc file nào** bên trong folder.
- **FR-071 AC-9:** khi người dùng thêm hoặc chuyển workspace, **chat hiện tại** vẫn là chat cũ, và **draft** của nó **không đổi**.

| Mũi tên | AC | Khi | DeckAgent phải | Lỗi test bắt được |
|---|---|---|---|---|
| W1 | FR-072 AC-1 | DeckAgent **khởi động lần đầu**, data folder **rỗng**. | Tạo **đúng một workspace**, là **default workspace**. Default workspace **không có project folder**. Nó **có tên**. Nó là **workspace đang dùng**. | DeckAgent **bắt người dùng chọn folder** ở lần chạy đầu. DeckAgent cho default workspace **project folder là folder chạy server**. |
| W2 | FR-071 AC-1 | Người dùng **thêm folder `Proj`**; folder này đọc được và chưa workspace nào giữ. | Tạo **một workspace mới** có project folder là `Proj`. Đặt **tên workspace là `Proj`**. Chuyển nó thành **workspace đang dùng**. | DeckAgent đặt tên workspace theo **cả đường dẫn**. DeckAgent thêm xong nhưng **không chuyển** workspace đang dùng. |
| W3 | cây 6 | Người dùng thêm một folder mà DeckAgent **phải từ chối**. | **Không tạo workspace**. Báo **lý do** theo nhánh của cây 6. | Xem từng nhánh ở mục 6. |
| W4 | FR-072 AC-4 | Ở lần chạy đầu, người dùng **tạo một chat và viết draft**, **chưa chọn folder nào**. | Đặt chat vào **default workspace**. Giữ **draft** đó trong chat. | DeckAgent **báo lỗi khi tạo chat**, vì default workspace **không có folder**. |
| W5 | FR-141 AC-2 | Người dùng **đổi tên default workspace** thành `Mine`. | Đổi tên thành `Mine`. Workspace đó **vẫn là default workspace**. | DeckAgent **không cho đổi tên** default workspace. |
| W6 | FR-083 AC-5 | Người dùng **chọn một folder** cho default workspace. | Giữ default workspace **không có project folder**. | DeckAgent **gán project folder** cho default workspace. |
| W7 | FR-072 AC-3 | Người dùng **yêu cầu xoá default workspace**, rồi xác nhận. | **Giữ** default workspace. **Không đổi** chat của nó, workspace đang dùng và danh sách workspace. | DeckAgent **cho xoá** default workspace. DeckAgent từ chối xoá nhưng **đã lỡ đổi** workspace đang dùng. |
| W8 | FR-071 AC-2 | Người dùng **thêm lại `Proj`** bằng **7 dạng đường dẫn khác** của cùng folder (khác hoa thường, `\` ở cuối, `/`, `\\?\`, 8.3, junction, ổ `subst`). | **Không tạo workspace mới**. Chuyển `W` thành **workspace đang dùng**. | DeckAgent **so đường dẫn như chuỗi**, nên một dạng đường dẫn tạo ra **workspace thứ hai**. |
| W9, W20 | FR-071 AC-3 | Người dùng **chuyển sang một workspace có sẵn**, không đưa folder nào. | Chuyển workspace đó thành **workspace đang dùng**. **Không đổi** danh sách workspace. | DeckAgent **bắt chọn lại folder** khi chuyển. DeckAgent **tạo workspace mới** khi chuyển. |
| W10 | FR-141 AC-1, AC-3, AC-4 | Người dùng **đổi tên `W`**: thành `New`; thành tên **trùng** một workspace khác; thành `"  New  "`. | Đổi tên `W`. **Giữ** project folder và chat của `W`. **Nhận** tên trùng. **Bỏ khoảng trắng** ở hai đầu tên. | DeckAgent đổi tên làm **mất liên kết** với folder hoặc chat. DeckAgent **từ chối tên trùng**. DeckAgent **lưu nguyên khoảng trắng**. |
| W11 | FR-083 AC-1 | Người dùng **chọn folder khác `Proj2`** cho `W`. | Đổi project folder của `W` thành `Proj2`. **Giữ tên** và **chat** của `W`. **Không đọc file nào** trong `Proj2`. | DeckAgent **đổi luôn tên** theo folder mới. DeckAgent **tạo workspace mới** thay vì sửa `W`. |
| W12, W19 | FR-072 AC-2 | DeckAgent **dừng rồi khởi động lại**: lần đầu khi `W` đang dùng, lần sau khi default workspace đang dùng. | Giữ **workspace đang dùng** như trước khi dừng, ở cả hai lần. | DeckAgent **luôn quay về default workspace** khi khởi động lại. |
| W13 | FR-073 AC-1 | Người dùng **yêu cầu xoá `W`**. | **Hỏi xác nhận** trước. Câu hỏi nói rằng **project folder vẫn còn** và **chat vẫn còn**. **Chưa xoá** `W`. | DeckAgent **xoá ngay**, không hỏi. |
| W14 | FR-073 AC-4 | Người dùng **huỷ** việc xoá. | **Không đổi** `W`. Chat vẫn **nằm trong `W`**. | DeckAgent **vẫn xoá** dù người dùng huỷ. DeckAgent làm chat **rời khỏi `W`**. |
| W15 | FR-073 AC-2, AC-3 | Người dùng **xác nhận** việc xoá. | **Xoá** `W`. Chuyển mỗi chat của `W` thành **ungrouped chat**, giữ **draft** của nó. Nếu `W` đang dùng, chuyển **default workspace** thành workspace đang dùng. | DeckAgent **xoá luôn các chat**. DeckAgent để workspace đang dùng **trỏ vào workspace đã xoá**. |
| W16 | FR-073 AC-5 | Người dùng **thêm lại folder** của `W` đã xoá. | Tạo **một workspace mới**, **không có chat nào**. Các chat cũ **vẫn là ungrouped chat**. | DeckAgent **hồi sinh `W`** và **kéo chat cũ về**. |
| W18 | FR-073 AC-7 | DeckAgent **dừng rồi khởi động lại** khi người dùng **chưa xác nhận** việc xoá. | **Giữ `W`** và chat của nó. | DeckAgent **xoá trước rồi mới hỏi**, nên dừng giữa chừng làm **mất `W`**. |
| W17 | — | Một **request đang chạy** trong chat của `W`. | Build 3 test phần này. | — |

## 3. Folder bị mất hoặc bị thay

```mermaid
flowchart TD
  W["W: folder đọc được"]
  U["W báo: folder không đọc được"]
  X["W báo: có folder khác ở chỗ cũ"]
  REF["Từ chối, W không đổi"]
  GONE["W đã xoá, chat thành ungrouped chat"]
  V["Workspace mới V cho folder mới<br/>W vẫn báo folder khác"]
  US["Ở lại không đọc được<br/>F3 · mở chat của W<br/>F5 · khởi động lại<br/>F11 · đổi tên<br/>F19 · chuyển sang workspace khác"]
  XS["Ở lại folder khác<br/>F8 · mở chat của W<br/>F11 · đổi tên<br/>F16 · khởi động lại<br/>F19 · chuyển sang workspace khác"]

  W -->|"F1 · folder bị dời đi<br/>F2 · mất quyền đọc"| U
  W -->|"F7 · folder mới ở chỗ cũ"| X
  U --->|"F4 · folder về chỗ cũ<br/>F6 · chọn folder khác, cây 6<br/>F14 · thêm folder đã dời"| W
  X --->|"F9 · dùng folder đó<br/>F13 · chọn folder khác, cây 6"| W
  U -.- US
  X -.- XS
  U -->|"F12 · xoá, xác nhận"| GONE
  X -->|"F12 · xoá, xác nhận"| GONE
  X -->|"F10 · dùng folder đó, bị từ chối, cây 6"| REF
  REF --> X
  X -->|"F15 · thêm folder mới ở chỗ cũ"| V
  U -->|"F17 · có folder mới ở chỗ cũ"| X
  X ---->|"F18 · folder mới bị dời đi"| U
```

**Luôn đúng** ở mọi mũi tên:
- **FR-084 AC-1, AC-2:** project folder **không đổi**, và folder mới ở chỗ cũ **cũng không đổi**.
- **FR-074 AC-1, AC-2, FR-083 AC-1, FR-142 AC-1:** DeckAgent **không mở và không đọc file nào** của folder, **kể cả khi** đang báo folder lỗi.

| Mũi tên | AC | Khi | DeckAgent phải | Lỗi test bắt được |
|---|---|---|---|---|
| F1 | FR-074 AC-1 | Project folder của `W` **bị dời đi**, rồi người dùng **xem danh sách workspace**. | Báo `W` **không đọc được** (`status` là `unreadable`). Đưa **ít nhất một việc người dùng làm tiếp**, và mỗi việc thuộc `restore`, `grantAccess` hoặc `chooseFolder`. **Không nêu nguyên nhân** (không có field `cause`). **Không đọc file nào** ở chỗ cũ và chỗ mới. | DeckAgent báo **"folder đã bị xoá"** dù không biết nguyên nhân. DeckAgent báo lỗi mà **không kèm việc làm tiếp**. |
| F2 | FR-074 AC-2 | Project folder của `W` **mất quyền đọc**, rồi người dùng xem danh sách workspace. | Báo **giống F1**. | DeckAgent chỉ phát hiện folder **bị mất**, **không phát hiện** folder **mất quyền đọc**. |
| F3 | FR-074 AC-3 | `W` đang **không đọc được**; người dùng **chuyển sang `W`** và **mở chat** của nó. | **Giữ** `W` trong danh sách. **Mở chat** với **draft** của nó. | DeckAgent **gỡ** workspace không đọc được. DeckAgent **không mở được** chat của nó. |
| F4 | FR-074 AC-4 | Folder **được dời về chỗ cũ**. | Báo `W` **đọc được** (`status` là `readable`). | DeckAgent **đánh dấu lỗi mãi**, kể cả khi folder đã về. |
| F5 | FR-083 AC-6 | DeckAgent **khởi động lại** khi folder của `W` **đã bị dời đi**. | Giữ **đúng đường dẫn cũ** làm project folder của `W`. Vẫn báo `W` **không đọc được**. | DeckAgent **tự đổi project folder** sang chỗ mới của folder. |
| F6, F13 | FR-083 AC-7 | `W` đang **không đọc được** (F6) hoặc **có folder khác ở chỗ cũ** (F13); người dùng **chọn folder `Proj3`** cho `W`. | Đổi project folder của `W` thành `Proj3`. Báo `W` **đọc được**. **Giữ chat** trong `W`. | DeckAgent **chỉ cho đổi folder** khi folder cũ **còn đọc được**, nên người dùng **không sửa được** workspace lỗi. |
| F7, F16 | FR-142 AC-1 | Folder của `W` bị dời đi, rồi **một folder mới được tạo ở cùng đường dẫn**; sau đó DeckAgent **khởi động lại** (F16). | Báo `W` **có folder khác ở chỗ cũ** (`status` là `differentFolder`), **trước và sau** khi khởi động lại. **Không đọc file nào** của folder mới. | DeckAgent **coi folder mới là folder cũ** vì chỉ so đường dẫn. DeckAgent báo nó là **"không đọc được"**. DeckAgent **tự nhận** folder mới sau khi khởi động lại. |
| F8 | FR-142 AC-4 | `W` đang **có folder khác ở chỗ cũ**; người dùng **mở chat** của `W`. | **Giữ** `W`. **Mở chat** với **draft** của nó. | DeckAgent **khoá** workspace hoặc chat. |
| F9 | FR-142 AC-2, FR-084 AC-2 | Người dùng chọn **dùng folder mới** cho `W`, rồi DeckAgent **khởi động lại**. | Báo `W` **đọc được**, **trước và sau** khi khởi động lại. **Không đổi** file nào trong folder mới. | DeckAgent **không lưu ID** của folder mới, nên sau khi khởi động lại **lại báo folder khác**. DeckAgent **ghi marker** vào folder mới. |
| F10 | FR-142 AC-3 | Người dùng chọn **dùng folder mới**, nhưng folder đó là: **junction tới folder của workspace khác**; folder **bị chặn quyền đọc**; **junction tới `.ssh`**. | **Không đổi** `W`. Trả lỗi lần lượt là `folder_taken`, `folder_unreadable`, `folder_refused`. | DeckAgent cho "dùng folder này" **bỏ qua các kiểm tra** của việc chọn folder. |
| F11 | FR-141 AC-8 | `W` đang **không đọc được** hoặc **có folder khác ở chỗ cũ**; người dùng **đổi tên `W`**. | **Đổi tên** `W`. **Giữ nguyên** `status` của `W`. **Giữ chat** trong `W`. | DeckAgent **khoá mọi thao tác** trên workspace lỗi. DeckAgent đổi tên thì **xoá trạng thái lỗi**. |
| F12 | FR-073 AC-6 | `W` đang **không đọc được** hoặc **có folder khác ở chỗ cũ**; người dùng **yêu cầu xoá `W`**, rồi xác nhận. | **Hỏi xác nhận** trước. Sau khi xác nhận, **xoá** `W` và chuyển chat thành **ungrouped chat**. **Không đổi** folder nào trên đĩa. | DeckAgent **không cho xoá** workspace lỗi. DeckAgent **dọn folder** khi xoá. |
| F14 | FR-071 AC-13 | `W` đang **không đọc được** vì folder bị dời; người dùng **thêm folder ở chỗ mới**. | **Không tạo workspace mới**. Chuyển `W` thành **workspace đang dùng**. Đổi project folder của `W` sang **chỗ mới**, và báo `W` **đọc được**. **Giữ chat** trong `W`. | DeckAgent **so đường dẫn thay vì ID folder**, nên tạo **workspace thứ hai**. DeckAgent chuyển sang `W` nhưng **giữ đường dẫn cũ**. |
| F15 | FR-071 AC-14 | `W` đang **có folder khác ở chỗ cũ**; người dùng **thêm đường dẫn đó** làm workspace. | Tạo **một workspace mới** cho folder mới và chuyển nó thành workspace đang dùng. `W` **vẫn báo** có folder khác ở chỗ cũ. | DeckAgent **chuyển sang `W`** và **gắn folder mới vào `W`** mà người dùng **không chọn**. |
| F17 | FR-142 AC-5 | `W` đang báo **không đọc được**, và người dùng **đã thấy** điều đó trong danh sách; rồi **một folder mới được tạo** ở chỗ cũ. | Báo `W` **có folder khác ở chỗ cũ** (`status` là `differentFolder`). **Không đọc file nào** của folder mới. | DeckAgent **giữ `status` đã báo** lần trước, **không kiểm lại** chỗ cũ. |
| F18 | FR-074 AC-5 | `W` đang báo **có folder khác ở chỗ cũ**, và người dùng **đã thấy** điều đó; rồi **folder mới đó bị dời đi**. | Báo `W` **không đọc được** (`status` là `unreadable`). **Không đọc file nào** ở chỗ cũ và chỗ mới. | DeckAgent **giữ `status` đã báo** lần trước, **không kiểm lại** chỗ cũ. |
| F19 | FR-071 AC-3 | `W` đang **không đọc được** hoặc **có folder khác ở chỗ cũ**; người dùng **chuyển sang workspace khác**. | Chuyển workspace kia thành **workspace đang dùng**. **Giữ nguyên** `status` của `W`. | DeckAgent **không cho rời** workspace lỗi. DeckAgent chuyển xong thì `W` **mất `status` lỗi**. |

## 4. Kiểm tra đủ: mọi event ở mọi state

**Dùng để làm gì:** sơ đồ ở mục 2 và 3 chỉ vẽ **những mũi tên đã có**, nên một **mũi tên bị thiếu không hiện ra** trên sơ đồ. Bảng này đặt **mọi event** theo hàng và **mọi state** theo cột, để **mỗi ô phải có câu trả lời**. Kỹ thuật **state transition** đòi đúng điều này.

**Cách đọc một ô:**
- **Mã và vài chữ** (ví dụ "W12 · giữ W đang dùng"): event này **đã có AC**; mã trỏ về **bảng mũi tên** ở mục 2 hoặc 3.
- **"—" kèm lý do:** event này **không thể xảy ra** ở state đó.
- **Không test:** spec không nói DeckAgent làm gì ở ô này.

State là **state của workspace `W`**. Cột "chờ xác nhận xoá" là lúc DeckAgent **đang hỏi xác nhận xoá `W`**, khi `W` **đọc được**. Với `W` đang lỗi, việc **yêu cầu xoá rồi xác nhận** nằm chung trong một mũi tên (F12).

| Event | Default workspace | `W` đọc được | `W` không đọc được | `W` có folder khác ở chỗ cũ | Chờ xác nhận xoá `W` |
|---|---|---|---|---|---|
| **Mở chat** của workspace | W4 · tạo chat, giữ draft | C1, C3 · chat mới vào `W`, giữ draft | F3 · mở chat, giữ draft | F8 · mở chat, giữ draft | không test |
| **Chuyển sang workspace khác** | W20 · `W` thành đang dùng | W9 · default thành đang dùng | F19 · giữ `status` của `W` | F19 · giữ `status` của `W` | không test |
| **Thêm lại folder** của chính workspace | — · default không có folder | W8 · không tạo workspace mới | F14 · `W` nhận chỗ mới | F15 · tạo workspace mới | không test |
| **Đổi tên** | W5 · vẫn là default | W10 · giữ folder và chat | F11 · giữ `status` | F11 · giữ `status` | không test |
| **Chọn folder khác** | W6 · vẫn không có folder | W11 · giữ tên và chat | F6 · `W` đọc được | F13 · `W` đọc được | không test |
| **Dùng folder đang ở chỗ cũ** | — · không có chỗ cũ | — · chỗ cũ là folder của `W` | — · chỗ cũ không có folder | F9 · `W` đọc được; F10 · bị từ chối | — · chỗ cũ là folder của `W` |
| **Yêu cầu xoá** | W7 · giữ default | W13 · hỏi xác nhận | F12 · hỏi, rồi xoá | F12 · hỏi, rồi xoá | — · đang hỏi |
| **Xác nhận xoá** | — · chưa hỏi | — · chưa hỏi | — · nằm trong F12 | — · nằm trong F12 | W15 · xoá `W`, chat thành ungrouped |
| **Huỷ xoá** | — · chưa hỏi | — · chưa hỏi | — · chưa hỏi | — · chưa hỏi | W14 · giữ `W` |
| **Khởi động lại** | W19 · giữ default đang dùng | W12 · giữ `W` đang dùng | F5 · giữ đường dẫn cũ | F16 · vẫn báo folder khác | W18 · giữ `W` |
| **Folder trên đĩa thay đổi** | — · default không có folder | F1 · bị dời đi; F2 · mất quyền đọc; F7 · có folder mới ở chỗ cũ | F4 · folder về chỗ cũ; F17 · có folder mới ở chỗ cũ | F18 · folder mới bị dời đi | không test |

## 5. Chat và draft

```mermaid
flowchart TD
  C["Chat C hiện tại, draft 'abc'"]
  O["Chat khác"]
  N["Chat mới: rỗng, hiện tại,<br/>trong workspace đang dùng"]
  L["Xem chat cũ"]
  S["DeckAgent dừng rồi chạy lại"]
  M["Chat mới lấy model<br/>của lần chọn gần nhất"]
  LL["Danh sách chat cũ có nội dung"]
  CS["Ở lại C<br/>C4 · reload interface"]
  NS["Ở lại chat mới<br/>C2 · chưa có model"]

  C -.- CS
  C -->|"C1 · tạo chat mới"| N
  N -.- NS
  C <-->|"C3 · sang chat khác rồi quay lại"| O
  C -->|"C5"| S
  C -->|"C6 · workspace chưa có chat cũ"| L
  N -.->|"build 2"| M
  L -.->|"build 3, build 5"| LL
```

| Mũi tên | AC | Khi | DeckAgent phải | Lỗi test bắt được |
|---|---|---|---|---|
| C1 | FR-053 AC-1, AC-2, AC-3 | Chat `C` có draft `"abc"`; người dùng **tạo chat mới**. | Chuyển chat mới thành **chat hiện tại**. Để draft của chat mới **rỗng**. Đặt chat mới vào **workspace đang dùng**. Giữ draft của `C` là `"abc"`. | DeckAgent cho chat mới **mang theo draft** của `C`. DeckAgent **làm mất draft** của `C`. DeckAgent đặt chat mới vào **default workspace** thay vì workspace đang dùng. |
| C2 | FR-053 AC-5 | **Chưa model nào từng được chọn**; người dùng tạo chat mới. | Để chat mới **không có model** (`model` là null). **Báo** rằng chưa có model (`notice` là `noModel`). | DeckAgent **tự chọn một model mặc định**. DeckAgent để trống mà **không báo**. |
| C3 | FR-038 AC-1 | Người dùng **sang chat khác**, rồi **quay lại `C`**. | Giữ draft của `C` là `"abc"`. | DeckAgent **xoá draft** khi người dùng chuyển chat. |
| C4 | FR-038 AC-2 | Interface **bị đóng rồi mở lại**, trong lúc DeckAgent vẫn chạy. | Giữ draft của `C` là `"abc"`. | DeckAgent chỉ giữ draft **trong bộ nhớ của trang**, nên reload **làm mất draft**. |
| C5 | FR-038 AC-4 | DeckAgent **dừng rồi khởi động lại**. | Để draft của `C` **rỗng**. | DeckAgent **lưu draft vào database**, nên draft **còn lại** sau khi khởi động lại. |
| C6 | FR-048 AC-2 | Workspace đang dùng **chưa có chat cũ nào**; người dùng **xem chat cũ**. | Trả về **danh sách rỗng**. **Báo** rằng không có chat cũ (`notice` là `noEarlierChats`). **Giữ** chat hiện tại và draft của nó. | DeckAgent trả danh sách rỗng mà **không báo gì**. DeckAgent **đổi chat hiện tại** khi người dùng xem chat cũ. |

### 5b. Nhiều interface

```mermaid
sequenceDiagram
  participant I1 as Interface 1
  participant S as DeckAgent
  participant I2 as Interface 2
  I1->>S: I1 · chuyển sang workspace B
  S-->>I2: event workspaceInUse: B
  Note over I2: FR-071 AC-10: I2.inUse() là B
  I1->>S: I2 · tạo chat mới
  Note over I2: FR-053 AC-4: currentChat() của I2 không đổi
  I1->>S: I3 · đặt draft của C thành "abc"
  S-->>I1: đã lưu
  I2->>S: đọc draft của C
  Note over I2: FR-038 AC-3: được "abc"
```

| Bước | AC | Khi | DeckAgent phải | Lỗi test bắt được |
|---|---|---|---|---|
| I1 | FR-071 AC-10 | Hai interface `I1`, `I2` đang mở; `I1` **chuyển sang workspace `B`**. | **Báo cho `I2`** rằng `B` là workspace đang dùng (event `workspaceInUse`), **không cần reload**. | DeckAgent chỉ cập nhật **interface gây ra thay đổi**; `I2` **vẫn hiện workspace cũ** đến khi reload. |
| I2 | FR-053 AC-4 | Cả hai interface ở chat `C`; `I1` **tạo chat mới**. | Đặt chat mới vào workspace đang dùng. **Giữ** chat hiện tại của `I2` là `C`. | DeckAgent **kéo `I2` sang** chat mới mà `I1` vừa tạo. |
| I3 | FR-038 AC-3 | `I1` **đặt draft** của `C` thành `"abc"`, và DeckAgent **xác nhận đã lưu**. | Trả draft `"abc"` khi `I2` **đọc draft** của `C`. | DeckAgent giữ draft **riêng cho từng interface**, nên `I2` **không thấy** draft của `I1`. |

## 6. Cây quyết định: đường dẫn folder

Dùng cho **thêm workspace** (FR-071), **chọn folder khác** (FR-083) và **dùng folder khác ở chỗ cũ** (FR-142). Thứ tự câu hỏi **từ trên xuống** chỉ để **vẽ**, **không phải hành vi bắt buộc**.

```mermaid
flowchart TD
  IN(["Đường dẫn người dùng đưa"])
  Q0{"Chọn folder cho<br/>default workspace?"}
  Q1{"Rỗng hoặc chỉ<br/>khoảng trắng?"}
  Q2{"Không tồn tại, là file,<br/>là đường dẫn tương đối,<br/>hoặc bị chặn quyền đọc?"}
  Q3{"Sau khi theo link: thuộc<br/>một protected folder?"}
  Q4{"Drive root, folder người dùng,<br/>hoặc bao quanh một<br/>protected folder?"}
  Q5{"Cùng folder với một<br/>workspace có sẵn?"}
  Q6{"Đang làm gì?"}
  R0["Không đổi gì<br/>FR-083 AC-5"]
  R1["no_folder<br/>FR-071 AC-5"]
  R2["folder_unreadable<br/>FR-071 AC-4 · FR-083 AC-3 · FR-142 AC-3"]
  R3["folder_refused<br/>insideAllowed = false<br/>FR-071 AC-7 · FR-083 AC-4 · FR-142 AC-3"]
  R4["folder_refused<br/>insideAllowed = true<br/>FR-071 AC-6 · FR-083 AC-4"]
  R5["Chuyển sang workspace đó<br/>FR-071 AC-2"]
  R6["folder_taken, takenBy<br/>FR-083 AC-2 · FR-142 AC-3"]
  R7["Nhận folder<br/>FR-071 AC-1 · FR-083 AC-1, AC-7 · FR-142 AC-2"]

  IN --> Q0
  Q0 -->|"có"| R0
  Q0 -->|"không"| Q1
  Q1 -->|"có"| R1
  Q1 -->|"không"| Q2
  Q2 -->|"có"| R2
  Q2 -->|"không"| Q3
  Q3 -->|"có"| R3
  Q3 -->|"không"| Q4
  Q4 -->|"có"| R4
  Q4 -->|"không"| Q5
  Q5 -->|"có"| Q6
  Q5 -->|"không"| R7
  Q6 -->|"thêm workspace"| R5
  Q6 -->|"đổi folder, dùng folder khác"| R6
```

**Đọc cây:**
- **Protected folder** là system folder (BR-019 V-2), key folder (V-4) và DeckAgent data folder (V-5). **Refused folder** là folder DeckAgent **không nhận làm project folder**.
- **"Thuộc"**: chính nó là protected folder, hoặc nằm bên trong một protected folder. DeckAgent **không gợi ý** chọn folder bên trong. Ví dụ `C:\Windows`, `C:\Users\<tên>\.ssh`.
- **"Bao quanh"**: bản thân nó không thuộc protected folder nào, nhưng **có một protected folder bên trong**; **drive root** (V-1) và **folder của người dùng** (V-3) cũng vậy. DeckAgent **có gợi ý** chọn folder bên trong. Ví dụ `C:\`, `C:\Users\<tên>`.
- Khi từ chối, DeckAgent **liệt kê mọi value của BR-019** mà folder vi phạm, không chỉ value đầu tiên.
- **"Cùng folder"**: hai đường dẫn là cùng folder khi chúng có **cùng ID folder** (`dev:ino`). Khi DeckAgent **không đọc được ID**, hai đường dẫn là cùng folder khi chúng **trỏ tới cùng đường dẫn thật** (`realpathSync.native`).
- Một đường dẫn **trỏ vào file** được coi là **folder không đọc được**. Một **đường dẫn tương đối** cũng được coi là **folder không đọc được** (FR-071, DEC-010).
- Một folder có thể **rơi vào hai nhánh** cùng lúc; khi đó kết quả **tuỳ thứ tự kiểm**, mà **spec không nói thứ tự**. Vì vậy mỗi test **chỉ dùng folder rơi vào đúng một nhánh**.

**Phân lớp đường dẫn** (kỹ thuật EP + BVA). Các lớp này **chỉ được test qua thao tác thêm workspace**. Thao tác đổi folder và dùng folder khác **đi qua các nhánh lá** của cây, nên vẫn được test ở mỗi nhánh.

| Lớp đường dẫn | Ví dụ | DeckAgent phải | AC |
|---|---|---|---|
| Đường dẫn tuyệt đối thường | `C:\...\Proj` | **Nhận** folder. | FR-071 AC-1 |
| Đường dẫn **khác dạng** tới **cùng một folder** | khác hoa thường; `\` ở cuối; `/` thay `\`; tiền tố `\\?\`; tên 8.3; junction; ổ `subst` | Nhận ra đó là **cùng folder**, **không tạo workspace thứ hai**. | FR-071 AC-2 |
| Đường dẫn **khác dạng** tới **`.ssh`** | junction; ổ `subst`; tiền tố `\\?\` | **Từ chối**, như với chính `.ssh`. | FR-071 AC-7 |
| Đường dẫn **không đọc được** | tương đối; trỏ vào file; không tồn tại; bị chặn quyền đọc | **Từ chối** với lỗi `folder_unreadable`. | FR-071 AC-4 |
| Đường dẫn **rỗng** | rỗng; chỉ có khoảng trắng | **Từ chối** với lỗi `no_folder`. | FR-071 AC-5 |
| Đường dẫn **dài** quanh giới hạn 260 ký tự của Windows | 259, 260, 261 và 300 ký tự | **Nhận** folder. | FR-071 AC-11 |
| Đường dẫn **mạng UNC** | `\\server\share` | Chưa test: **dời lại** (SR-12, open-questions.md item 20). | — |

