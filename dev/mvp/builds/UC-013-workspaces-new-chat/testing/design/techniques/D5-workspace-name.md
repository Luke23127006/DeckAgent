---
scope: "Workspace theo thư mục (UC-013) và chat mới (UC-012)"
title: "D5 · Tên workspace: EP, BVA và decision table"
milestone: mvp
created: 09-11-2026
---

# D5 · Tên workspace: EP, BVA và decision table

<!-- Evidence của design input D5 (testing-plan.md mục 2.3). Phương pháp: skill equivalence-partitioning, boundary-value-analysis và decision-table-testing. Mỗi bước giữ output riêng, theo thứ tự; test case chỉ dùng output của các bước trước; AC nháp chỉ được đọc ở mục "Reconciliation". Trạng thái coverage item và test case theo test-strategy.md "How a technique is applied". -->

- **Design input:** [testing-plan.md](../../planning/testing-plan.md) mục 2.3, dòng **D5**: criterion là **mọi partition** và **mỗi biên ở ba giá trị**, **ở mỗi nguồn tên**, có biến phụ **đơn vị đếm, NFC, trim** (QR-7); **mọi rule** của decision table; leaf từ chối assert **lý do** (QR-10). Mechanism: M1, M2, M10, M19.
- **Status:** chờ PO review.
- **Coverage status:**

  | Technique | Covered | Blocked | Uncovered | Infeasible |
  |---|---|---|---|---|
  | EP (class) | 36 | 1 (EC34, Z-26) | 0 | 1 (EC21) |
  | BVA, biên requirement | 37 | 2 (Z-28) | 0 | 0 |
  | BVA, biên transformation | 0 | 3 (BD4, Z-28) | 0 | 0 |
  | BVA, biên platform (ngoài criterion) | 4 | 0 | 0 | 2 |
  | DT (rule) | 5 | 0 | 0 | 3 tổ hợp |

- **Test case:** **68** bản ghi: **61 Ready**, **7 Blocked** (TC35, TC42, TC53, TC59, TC60, TC61, TC62).
- **Cách kiểm lại phép tính:** `node D5-workspace-name.check.js` trong folder này. File chỉ chứa ký tự ASCII trong code; mọi ký tự đặc biệt viết bằng số code point. Lần chạy ngày 10-11-2026 khớp mọi dòng dưới đây. Đây là bằng chứng **computed**, không phải bằng chứng về hành vi của DeckAgent (mục "Loại bằng chứng").
- **Giới hạn:** người thiết kế **đã đọc AC cũ** ở các session trước; completion check do **cùng người thiết kế** chạy, và **F-01 đến F-04 do PO tìm ra**, không phải do check.

## Phạm vi

**Basis items:** BR-020.R, BR-020.V1, BR-020.V2a, BR-020.V2b, BR-020.V2c, BR-020.V3; FR-071.2, FR-071.15; FR-141.1 (phần đặt tên), FR-141.5, FR-141.6, FR-141.7, FR-141.8, FR-141.9; UC-013.A13 (phần tên bị từ chối).

**Ngoài D5, kèm design input sở hữu:**
- Đổi tên **default workspace** (FR-141.1, "kể cả default"): một ô của vòng đời workspace, **D1**.
- Đổi tên **giữ project folder và chat** (FR-141.2): **D1**.
- Tên bị từ chối **không đổi file** (UC-013.A13), đổi tên **không đổi file** (FR-141.3): **D6**.
- **Hai folder khác nhau** có tên giống nhau sau NFC (một NFC, một NFD) là **hai folder hay một**: luật nhận diện folder, **D2**.

## EP-1 · Biến

| Code | Biến | Input hay output | Luật tác động | Basis items |
|---|---|---|---|---|
| V1 | **Nguồn tên**: tên **người dùng đặt** (đổi tên) hoặc tên **lấy từ folder** (thêm workspace) | input | Nguồn tên quyết định **có trim không** và **tên quá dài bị từ chối hay bị cắt** | BR-020.R, BR-020.V3, FR-071.2, FR-141.7 |
| V2 | **Chuỗi tên gốc**: chuỗi người dùng đưa, hoặc tên folder trên đĩa | input | NFC, trim theo nguồn, giới hạn rỗng, giới hạn 100 code point, cắt | BR-020.R, BR-020.V1, BR-020.V2a, BR-020.V2b, BR-020.V2c, BR-020.V3, FR-071.2 |
| V3 | **Tên của các workspace khác** đang có | input | Hai workspace **được trùng tên** | FR-141.5 |
| O1 | **Tên workspace được lưu** | output | Dạng NFC; tên người dùng đặt **đã trim**; tên lấy từ folder **không trim** và **bị cắt** khi dài hơn 100 | BR-020.V2c, FR-071.2, FR-071.15, FR-141.1, FR-141.6, FR-141.9 |
| O2 | **Kết quả**: đặt tên, đặt tên sau khi cắt, hoặc từ chối | output | Từ chối **chỉ ở** nguồn người dùng đặt; cắt **chỉ ở** nguồn folder | FR-071.2, FR-141.7 |
| O3 | **Lý do từ chối**: value của BR-020 bị vi phạm | output | DeckAgent **nói vì sao**; oracle là value bị vi phạm (QR-10) | FR-141.8, UC-013.A13 |
| O4 | **Tên của workspace** sau một lần từ chối | output | Tên bị từ chối **không đổi gì** | FR-141.7, UC-013.A13 |
| O5 | **Tên và path của folder** trên đĩa sau khi thêm | output | Folder **giữ tên và path** của nó, kể cả khi tên workspace là dạng NFC | FR-071.15, BR-020.V2c |

## EP-2 · Domain, dimension và quan hệ

**Domain của V2:**
- **Nguồn người dùng đặt:** mọi chuỗi Unicode **hợp lệ** (AS-1).
- **Nguồn folder:** những tên mà **NTFS cho phép**: **không rỗng**, **tối đa 255 đơn vị UTF-16**, **không có** ký tự U+0000 đến U+001F và `<>:"/\|?*`. Tên **có thể bắt đầu** bằng khoảng trắng; tên **kết thúc** bằng dấu cách **chỉ tạo được** qua tiền tố `\\?\`. Đây là **giới hạn của platform**, không phải của spec (AS-2, AS-3).

**Tập khoảng trắng của V-3.** V-3 định nghĩa khoảng trắng là **các ký tự mà `String.prototype.trim()` bỏ**; bốn ký tự V-3 nêu tên **chỉ là ví dụ**. Script liệt kê tập của runtime (Node `22.19.0`, Unicode 16.0): **25 ký tự**, gồm U+0009 đến U+000D, U+0020, U+00A0, U+1680, U+2000 đến U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF. **20** trong số đó NTFS cho phép làm tên folder (trừ U+0009 đến U+000D). Tập phụ thuộc **phiên bản Unicode** của runtime (AS-6).

**Dimension** (mỗi dimension là một phép chia **rời nhau** và **phủ hết** domain):

| Code | Dimension | Nguồn áp dụng | Vì sao nó quan trọng | Basis hoặc fault hypothesis |
|---|---|---|---|---|
| DM1 | **L**: số code point của tên **sau xử lý của nguồn** (người dùng đặt: NFC và trim; folder: NFC) | cả hai | Luật rỗng và luật 100 áp lên L | BR-020.R, BR-020.V1, BR-020.V2a, BR-020.V2b |
| DM2 | Quan hệ giữa chuỗi gốc và **dạng NFC** của nó | cả hai | Tên được lưu và được đếm ở dạng NFC | BR-020.V2c, FR-141.9, FR-071.2; lỗi "count before normalization" |
| DM3 | Số **đơn vị UTF-16** so với số **code point** | cả hai | Spec đếm code point; `length` của JavaScript đếm đơn vị UTF-16 | BR-020.V2b; QR-7 |
| DM4 | Số **code point** so với số **grapheme** | cả hai | Spec đếm code point, không đếm ký tự hiển thị | BR-020.V2b; QR-7 |
| DM5a | Có **ký tự của tập `trim()`** ở đầu hoặc cuối | cả hai | Người dùng đặt: **bỏ**; folder: **không bỏ** | BR-020.V3, FR-141.6, FR-071.15; lỗi "value trimmed in the wrong layer" |
| DM5b | Có **ký tự vô hình ngoài tập `trim()`** (U+200B) ở đầu hoặc cuối | người dùng đặt | Ký tự ngoài tập **được giữ và được đếm** | BR-020.V3, BR-020.V2b |
| DM6 | Có **khoảng trắng ở giữa** tên | cả hai | V-3 chỉ bỏ khoảng trắng **ở hai đầu** | BR-020.V3 |
| DM7 | Một workspace khác có **cùng tên** (sau xử lý) | cả hai | Trùng tên **được phép** | FR-141.5 |

**DM5b ở nguồn folder không tạo class:** nguồn folder **không bỏ ký tự nào**, nên U+200B có **cùng hành vi** với ký tự thường.

**Quan hệ giữa các biến:**
- **RL1 · Nguồn tên quyết định trim:** người dùng đặt **bị trim**; folder **không** (BR-020.V3).
- **RL2 · Nguồn tên quyết định kết quả của tên quá dài:** người dùng đặt **bị từ chối** (BR-020.V2a, FR-141.7); folder **bị cắt** (FR-071.2).
- **RL3 · Ở nguồn folder, L không bằng 0:** domain **không rỗng** (AS-2), tên **không bị trim** (RL1), và NFC **không biến** chuỗi khác rỗng thành rỗng.
- **RL4 · Giới hạn đo trên tên đã xử lý:** NFC trước khi đếm (BR-020.V2c); với người dùng đặt, **sau cả trim** (BR-020.R).
- **RL5 · Thứ tự trim và NFC không đổi kết quả**, nên **không tạo class**. Script thử **mọi ký tự BMP** ở năm vị trí: **0** khác biệt.

## EP-3 · Equivalence class

"Base" là class mà một tên bình thường rơi vào. "Ở biên" là class chỉ **quan sát được gần giới hạn**, nên được **giao cho BVA**.

**Nguồn người dùng đặt (đổi tên).** Cover: DM1 là {0} ∪ [1, 100] ∪ [101, ∞), với L = 0 chia theo chuỗi gốc rỗng hay không.

| Code | Dim. | Class | Valid | Expected behavior (spec) | Basis items | Vì sao có class |
|---|---|---|---|---|---|---|
| EC1 | DM1 | L = 0, chuỗi gốc **rỗng** | no | DeckAgent **từ chối**; lý do **V-1**; workspace **giữ tên cũ** | BR-020.V1, FR-141.7, FR-141.8, UC-013.A13 | Luật V-1 |
| EC2 | DM1 | L = 0, chuỗi gốc **chỉ gồm ký tự của tập `trim()`** | no | Như EC1 | BR-020.V1, BR-020.V3, FR-141.7, FR-141.8 | Đường xử lý khác EC1: rỗng **sau trim** |
| EC3 | DM1 | 1 ≤ L ≤ 100 (base) | yes | DeckAgent **đặt tên** đã xử lý cho workspace | BR-020.V2a, FR-141.1 | Luật V-2, phần nhận |
| EC4 | DM1 | L ≥ 101 | no | DeckAgent **từ chối**; lý do **V-2**; workspace **giữ tên cũ** | BR-020.V2a, FR-141.7, FR-141.8 | Luật V-2, phần từ chối |
| EC5 | DM2 | NFC **không đổi** chuỗi (base) | yes | Tên lưu bằng chuỗi đã trim | FR-141.9 | Class đối chứng |
| EC6 | DM2 | NFC **đổi** chuỗi và **ngắn đi** | yes | Tên lưu ở **dạng NFC**; L đếm trên dạng NFC (**ở biên**) | BR-020.V2b, BR-020.V2c, FR-141.9 | Đếm hoặc lưu trước NFC |
| EC7 | DM2 | NFC **đổi** chuỗi, **cùng độ dài** | yes | Tên lưu ở **dạng NFC** | BR-020.V2c, FR-141.9 | Lưu chuỗi gốc khi độ dài không đổi |
| EC8 | DM2 | NFC **đổi** chuỗi và **dài ra** | yes | Tên lưu ở **dạng NFC**; L đếm trên dạng NFC (**ở biên**) | BR-020.V2b, BR-020.V2c, FR-141.9 | Đếm trước NFC theo chiều ngược lại |
| EC9 | DM3 | Chỉ ký tự BMP (base) | yes | Như EC3 | BR-020.V2b | Class đối chứng |
| EC10 | DM3 | Có ký tự **ngoài BMP** | yes | Mỗi ký tự ngoài BMP là **một** ký tự (**ở biên**); tên lưu nguyên vẹn | BR-020.V2b | Đếm bằng đơn vị UTF-16 |
| EC11 | DM4 | Code point bằng grapheme (base) | yes | Như EC3 | BR-020.V2b | Class đối chứng |
| EC12 | DM4 | Có chuỗi combining **không có dạng ghép** | yes | Mỗi code point là **một** ký tự (**ở biên**); tên lưu nguyên vẹn | BR-020.V2b | Đếm grapheme |
| EC13 | DM5a | Không có ký tự của tập ở hai đầu (base) | yes | Như EC3 | BR-020.V3 | Class đối chứng |
| EC14 | DM5a | Có ký tự của **tập `trim()`** (25 ký tự) ở **cả hai đầu** | yes | DeckAgent **bỏ** chúng trước khi đếm và lưu | BR-020.R, BR-020.V3, FR-141.6 | Luật V-3 |
| EC15 | DM5b | Không có ký tự vô hình ngoài tập (base) | yes | Như EC3 | BR-020.V3 | Class đối chứng |
| EC16 | DM5b | Có **U+200B** ở hai đầu | yes | DeckAgent **giữ** và **đếm** chúng | BR-020.V3, BR-020.V2b | Biên của tập trong V-3 |
| EC17 | DM6 | Không có khoảng trắng ở giữa (base) | yes | Như EC3 | BR-020.V3 | Class đối chứng |
| EC18 | DM6 | Có khoảng trắng **ở giữa** | yes | DeckAgent **giữ** khoảng trắng ở giữa | BR-020.V3 | V-3 chỉ nói hai đầu |
| EC19 | DM7 | Không trùng (base) | yes | Như EC3 | FR-141.5 | Class đối chứng |
| EC20 | DM7 | **Trùng** tên một workspace khác | yes | DeckAgent **đặt tên**; cả hai workspace mang tên đó | FR-141.5 | Luật trùng tên |

**Nguồn folder (thêm workspace).** Cover: DM1 là {0} ∪ [1, 100] ∪ [101, ∞), với {0} infeasible; DM5a chia ba phần: không có, có và còn ký tự khác, chỉ gồm ký tự của tập. Mọi class nguồn folder còn có **O5: folder giữ tên và path** (FR-071.15).

| Code | Dim. | Class | Valid | Expected behavior (spec) | Basis items | Vì sao có class |
|---|---|---|---|---|---|---|
| EC21 | DM1 | L = 0 | — | **Infeasible**: RL3 | — | Phủ domain |
| EC22 | DM1 | 1 ≤ L ≤ 100 (base) | yes | Tên workspace là **dạng NFC** của tên folder, **không cắt**; workspace được thiết lập | BR-020.V2a, FR-071.2, FR-071.15 | Luật V-2, phần nhận |
| EC23 | DM1 | L ≥ 101 | yes | Tên **còn đúng 100 code point** của dạng NFC; workspace **vẫn được thiết lập**. **Phần nào được giữ: gap Z-28** | BR-020.V2a, FR-071.2 | Luật cắt của FR-071 |
| EC24 | DM2 | NFC không đổi (base) | yes | Như EC22 | FR-071.15 | Class đối chứng |
| EC25 | DM2 | NFC đổi, **ngắn đi** | yes | Tên workspace **dạng NFC**; folder **giữ tên gốc** (**ở biên** cho phần đếm) | BR-020.V2c, FR-071.15 | Lưu chuỗi gốc; đổi tên folder |
| EC26 | DM2 | NFC đổi, **cùng độ dài** | yes | Tên workspace dạng NFC; folder giữ tên gốc | BR-020.V2c, FR-071.15 | Như EC7 |
| EC27 | DM2 | NFC đổi, **dài ra** | yes | Tên workspace dạng NFC (**ở biên** cho phần đếm và cắt) | BR-020.V2b, BR-020.V2c, FR-071.2 | Như EC8 |
| EC28 | DM3 | Chỉ BMP (base) | yes | Như EC22 | BR-020.V2b | Class đối chứng |
| EC29 | DM3 | Có ký tự **ngoài BMP** | yes | Đếm là **một** ký tự; tên nguyên vẹn (**ở biên**) | BR-020.V2b | Đếm hoặc cắt theo UTF-16 |
| EC30 | DM4 | Code point bằng grapheme (base) | yes | Như EC22 | BR-020.V2b | Class đối chứng |
| EC31 | DM4 | Có chuỗi combining không có dạng ghép | yes | Mỗi code point là một ký tự (**ở biên**) | BR-020.V2b | Đếm grapheme |
| EC32 | DM5a | Không có ký tự của tập ở hai đầu (base) | yes | Như EC22 | FR-071.15 | Class đối chứng |
| EC33 | DM5a | Có ký tự của tập ở **cả hai đầu**, còn ký tự khác | yes | DeckAgent **giữ nguyên** mọi ký tự; **không bỏ** khoảng trắng nào | BR-020.V3, FR-071.15 | Trim nhầm nguồn |
| EC34 | DM5a | **Chỉ gồm** ký tự của tập (ví dụ một U+00A0) | yes | **Blocked, gap Z-26.** Theo DT, tên này rơi vào **DR5** (nhận, giữ nguyên); expected **chưa được dùng** cho đến khi PO xác nhận cách đọc V-1 | BR-020.V1, BR-020.V3, FR-071.2 | V-1 đọc được hai cách |
| EC35 | DM6 | Không có khoảng trắng ở giữa (base) | yes | Như EC22 | BR-020.V3 | Class đối chứng |
| EC36 | DM6 | Có khoảng trắng ở giữa | yes | Giữ nguyên | BR-020.V3, FR-071.15 | Như EC18 |
| EC37 | DM7 | Không trùng (base) | yes | Như EC22 | FR-141.5 | Class đối chứng |
| EC38 | DM7 | Trùng tên một workspace khác (folder khác) | yes | DeckAgent **thiết lập** workspace mới mang **cùng tên** | FR-141.5 | Luật trùng tên |

## EP-4 · Representative

Base của nguồn người dùng đặt là `Toán` (U+0054 U+006F U+00E1 U+006E, L = 4); base của nguồn folder là folder tên `Toán`. Một representative **chỉ khác base ở dimension** nó đại diện. Mọi giá trị được **tính lại bằng script**.

**Representative của class khoảng trắng** (EC2, EC14, EC33) lấy ký tự **trải qua các nhóm** của tập `trim()`, không chỉ bốn ký tự V-3 nêu tên. Các nhóm là: ký tự V-3 nêu tên, ký tự điều khiển khoảng trắng, line terminator, Zs khác, và U+FEFF. Criterion của D5 là **một representative cho mỗi class**: plan **không** đánh dấu V-3 là closed list. Mọi ký tự được chọn đều **không đổi dưới NFC** (script đã kiểm).

| Class | Representative | Đo được | Vì sao đại diện cho class |
|---|---|---|---|
| EC1 | chuỗi rỗng | gốc 0, L 0 | Thành viên duy nhất có chuỗi gốc rỗng |
| EC2 | U+0020 U+000B U+2029 U+205F | gốc 4, L 0 | Một ký tự V-3 nêu tên, một ký tự điều khiển, một line terminator, một Zs khác |
| EC3, EC5, EC9, EC11, EC13, EC15, EC17, EC19 | `Toán` | L 4 | Base |
| EC4 | 150 chữ `a` | L 150 | Ở giữa class, xa biên 101 |
| EC6 | `Toa` + U+0301 + `n` (NFD) | gốc 5, L 4 | NFC ghép `a` + U+0301 thành U+00E1 |
| EC7 | U+212B + `x` | gốc 2, L 2; NFC là U+00C5 + `x` | U+212B đổi thành U+00C5, độ dài không đổi |
| EC8 | U+0958 + `a` | gốc 2, L 3 | U+0958 tách thành U+0915 U+093C dưới NFC |
| EC10 | `Toán` + U+1F600 | L 5, UTF-16 6 | Một ký tự ngoài BMP |
| EC12 | `T` + `x` + U+0301 | L 3, grapheme 2 | `x` + U+0301 không có dạng ghép |
| EC14 | U+FEFF U+2028 U+0009 + `Toán` + U+3000 U+1680 U+000A | gốc 10, L 4 | Hai đầu có ký tự của năm nhóm |
| EC16 | U+200B + `Toán` + U+200B | L 6 | U+200B không thuộc tập `trim()` |
| EC18 | `Toán học` | L 8 | Một dấu cách ở giữa |
| EC20 | `Toán`, khi workspace khác tên `Toán` | L 4 | Trùng đúng tên |
| EC22, EC24, EC28, EC30, EC32, EC35, EC37 | folder `Toán` | L 4 | Base |
| EC23 | folder `a` lặp 100 lần + `b` lặp 50 lần | L 150 | Giữ **100 đầu** hay **100 cuối** cho **kết quả khác nhau**, nên case này trả lời được Z-28 khi có ruling |
| EC25 | folder `Toa` + U+0301 + `n` | gốc 5, L 4 | Như EC6 |
| EC26 | folder U+212B + `x` | L 2 | Như EC7 |
| EC27 | folder U+0958 + `a` | gốc 2, L 3 | Như EC8 |
| EC29 | folder `Toán` + U+1F600 | L 5, UTF-16 6 | Như EC10 |
| EC31 | folder `T` + `x` + U+0301 | L 3 | Như EC12 |
| EC33 | folder U+00A0 U+FEFF + `Toán` + U+2028 U+0020 | L 8 | Hai đầu có ký tự NTFS cho phép, từ ba nhóm; dấu cách cuối cần `\\?\` (AS-3) |
| EC34 | folder U+00A0 | L 1 | Thành viên nhỏ nhất của class |
| EC36 | folder `Toán học` | L 8 | Như EC18 |
| EC38 | folder `Toán`, khi workspace khác tên `Toán` | L 4 | Như EC20 |

## EP-5 · Coverage item của EP

**37** class khả thi (EC1 đến EC20, EC22 đến EC38) và **EC21** infeasible (RL3). Trạng thái sau khi có test case: **36 Covered**, **EC34 Blocked** (Z-26). **Giao cho BVA:** EC6, EC8, EC10, EC12, EC14, EC25, EC27, EC29, EC31.

## BVA-1 · Biên

Đại lượng đo là **L** (EP-2, RL4). Thứ tự xử lý theo spec: người dùng đặt thì NFC và trim (thứ tự không quan trọng, RL5), rồi đếm; folder thì NFC, đếm, rồi cắt.

| Code | Loại | Biên | Nguồn | Điểm biên | Mục tiêu kiểm | Criterion đòi |
|---|---|---|---|---|---|---|
| BD1 | requirement | Dưới, người dùng đặt; giữa EC1, EC2 và EC3 | BR-020.V1 | L = 1 là giá trị nhỏ nhất được nhận | DeckAgent nhận nhầm tên rỗng, hoặc từ chối tên một ký tự | có |
| BD2 | requirement | Trên, người dùng đặt; giữa EC3 và EC4 | BR-020.V2a ("tối đa 100, gồm cả 100") | L = 100 được nhận | Sai một đơn vị ở so sánh, hoặc đo trên đại lượng sai | có |
| BD3 | requirement | Cắt, folder; giữa EC22 và EC23 | BR-020.V2a, FR-071.2 | L = 100 không cắt; L = 101 cắt | Cắt cả tên vừa đủ 100, hoặc không cắt tên 101 | có |
| BD4 | transformation | Vị trí của ký tự ngoài BMP so với **điểm cắt**, trong EC23 | FR-071.2, BR-020.V2b | Code point **cuối được giữ** | DeckAgent cắt theo đơn vị UTF-16, để lại surrogate lẻ hoặc tên 99 code point. **Điểm cắt phụ thuộc Z-28**, nên mọi giá trị **Blocked** | có (QR-7) |
| BD5 | platform | Mép dưới của domain, folder; EC21 infeasible và EC22 | AS-2 | L = 1 là tên folder ngắn nhất | Tên folder ngắn nhất được nhận nguyên vẹn | không; đếm riêng |
| BD6 | platform | Mép trên của domain, folder; trong EC23 | AS-2, AS-4 | 255 đơn vị UTF-16 là tên folder dài nhất | Luật cắt vẫn đúng ở tên dài nhất platform cho phép | không; đếm riêng |

## BVA-2 · Giá trị biên

**Variant matrix.** Mỗi ô là một variant hoặc "không" kèm lý do. Cột là các phép biến đổi plan nêu (trim, NFC, đơn vị đếm) và các class EP giao sang.

| Biên | Trim | NFC ngắn đi | NFC dài ra | UTF-16 (ngoài BMP) | Grapheme (combining) |
|---|---|---|---|---|---|
| BD1 | **BD1-T**: chuỗi gốc khác rỗng có thể thành L = 0 | không: NFC không biến chuỗi khác rỗng thành rỗng | không: cùng lý do | không: L ≥ 1 kéo theo UTF-16 ≥ 1 | không: L ≥ 1 kéo theo grapheme ≥ 1 |
| BD2 | **BD2-T** | **BD2-N−** | **BD2-N+** | **BD2-U** | **BD2-G** |
| BD3 | không: nguồn folder không trim; lỗi trim nhầm bị EC33 bắt | **BD3-N−** | **BD3-N+** | **BD3-U** | **BD3-G** |
| BD4 | không: như BD3 | không: vị trí đo trên dạng NFC | không: như cột trước | **chính là BD4** | không: điểm cắt theo code point, không theo grapheme |
| BD5 | không: như BD3 | không: không qua được biên 0 và 1 | không | không | không |
| BD6 | không: một giá trị ở mép domain | không | không | không | không |

**Giá trị.** "Gốc" là số code point của chuỗi gốc; số trong ngoặc ở BD2-U và BD3-U là đơn vị UTF-16.

| Biên | Ngay dưới | Đúng biên | Ngay trên | Cách tạo |
|---|---|---|---|---|
| BD1 | L 0: chuỗi rỗng (EC1) | L 1: `T` | L 2: `To` | — |
| BD1-T | L 0: đại diện EC2 (gốc 4) | L 1: dấu cách + `T` + dấu cách (gốc 3) | L 2: dấu cách + `To` + dấu cách (gốc 4) | Một dấu cách mỗi đầu |
| BD2 | L 99 | L 100 | L 101 | `a` lặp L lần |
| BD2-T | L 99 (gốc 101) | L 100 (gốc 102) | L 101 (gốc 103) | `a` lặp L lần, một dấu cách mỗi đầu |
| BD2-N− | L 99 (gốc 198) | L 100 (gốc 200) | L 101 (gốc 202) | `a` + U+0301 lặp L lần |
| BD2-N+ | L 99 (gốc 50) | L 100 (gốc 50) | L 101 (gốc 51) | U+0958 lặp 49 lần + `a`; lặp 50 lần; lặp 50 lần + `a` |
| BD2-U | L 99 (198) | L 100 (200) | L 101 (202) | U+1F600 lặp L lần |
| BD2-G | L 99 | L 100 | L 101 | `x` + U+0301 lặp 49 lần + `a`; lặp 50 lần; lặp 50 lần + `a` |
| BD3 | L 99, không cắt | L 100, không cắt | L 101, cắt còn 100 | folder `a` lặp L lần |
| BD3-N− | L 99 (gốc 198) | L 100 (gốc 200) | L 101 (gốc 202), cắt còn 100 | folder `a` + U+0301 lặp L lần |
| BD3-N+ | L 99 (gốc 50) | L 100 (gốc 50) | L 101 (gốc 51), cắt còn 100 | như BD2-N+ |
| BD3-U | L 99 (198) | L 100 (200) | L 101 (202), cắt còn 100 | folder U+1F600 lặp L lần |
| BD3-G | L 99 | L 100 | L 101, cắt còn 100 | như BD2-G |
| BD4 | U+1F600 ở vị trí 99 | ở vị trí 100 | ở vị trí 101 | `a` đệm cho L = 101 |
| BD5 | L 0: infeasible | L 1: folder `T` | L 2: folder `To` | — |
| BD6 | 254 đơn vị | 255 đơn vị | 256: infeasible (AS-2) | folder `a` lặp; cần đường dẫn dài (AS-4) |

Expected của mỗi giá trị là expected của **class nó rơi vào** (EP-3). Ở BD4, script cho thấy cắt theo **đơn vị UTF-16** để lại **surrogate lẻ** khi U+1F600 ở vị trí 100, và cho tên **99 code point** khi nó ở vị trí 99.

## BVA-3 · Coverage item của BVA

| Loại biên | Giá trị khả thi | Covered | Blocked | Infeasible |
|---|---|---|---|---|
| requirement (BD1, BD1-T, BD2 và 5 variant, BD3 và 4 variant) | 39 | 37 | 2: BD3-N+.trên, BD3-G.trên (Z-28) | 0 |
| transformation (BD4) | 3 | 0 | 3 (Z-28) | 0 |
| platform (BD5, BD6), ngoài criterion | 4 | 4 | 0 | 2 |

BD3.trên, BD3-N−.trên và BD3-U.trên là **Covered**: chuỗi của chúng chỉ gồm **một ký tự lặp lại**, nên giữ phần nào thì kết quả **cũng như nhau** (script đã kiểm).

## DT-1 · Condition và action

**Condition** (định nghĩa theo spec **như đang viết**, không theo cách đọc chờ ruling):
- **C1 · nguồn tên** (V1): người dùng đặt, hoặc folder. Basis BR-020.R, BR-020.V3, FR-071.2, FR-141.7.
- **C2 · L = 0**, với L đo **sau xử lý mà nguồn đó nhận**: NFC cho cả hai nguồn; trim **chỉ** cho nguồn người dùng đặt (BR-020.R, BR-020.V1, BR-020.V3). Người dùng đặt: C2 có khi tên ở EC1 hoặc EC2.
- **C3 · L ≥ 101**: người dùng đặt thì EC4; folder thì EC23. Basis BR-020.V2a. C3 chỉ có thể có khi C2 không.

**Action:**
- **A1 · chuẩn hoá NFC** (BR-020.R, BR-020.V2c).
- **A2 · bỏ ký tự của tập `trim()` ở hai đầu** (BR-020.V3).
- **A3 · cắt còn 100 code point** (FR-071.2).
- **A4 · lưu tên làm tên workspace** (FR-141.1, FR-071.2).
- **A5 · từ chối và giữ tên cũ** (FR-141.7, UC-013.A13).
- **A6 · nói lý do: value bị vi phạm** (FR-141.8; oracle theo QR-10).
- **A7 · thiết lập workspace cho folder** (FR-071.2).

**Z-26 không nằm trong condition:** tên folder chỉ gồm khoảng trắng (EC34) có L ≥ 1 theo C2, nên rơi vào **DR5**. Câu hỏi của Z-26 là spec **có một luật từ chối riêng** cho tên đó hay không; câu hỏi đó thuộc **expected của EC34** (Blocked), không làm đổi nghĩa của C2.

## DT-2 · Mọi tổ hợp

2 × 2 × 2 = **8** tổ hợp.

| Tổ hợp | C1 | C2 | C3 | Kết luận |
|---|---|---|---|---|
| CB1 | người dùng đặt | có | có | infeasible |
| CB2 | người dùng đặt | có | không | DR1 |
| CB3 | người dùng đặt | không | có | DR2 |
| CB4 | người dùng đặt | không | không | DR3 |
| CB5 | folder | có | có | infeasible |
| CB6 | folder | có | không | infeasible |
| CB7 | folder | không | có | DR4 |
| CB8 | folder | không | không | DR5 |

## DT-3 · Tổ hợp infeasible

- **CB1, CB5:** L = 0 thì **không thể** lớn hơn 100 (định nghĩa của L).
- **CB6:** ở nguồn folder, **L ≥ 1** theo **RL3**: domain không rỗng (AS-2, **assumed**), không trim (BR-020.V3), và NFC không biến chuỗi khác rỗng thành rỗng.

## DT-4 · Merge

**Không merge tổ hợp nào.** Không cặp tổ hợp khả thi nào có cùng mọi action.

## DT-5 · Rule và action

| Rule | C1 | C2 | C3 | A1 NFC | A2 trim | A3 cắt | A4 lưu | A5 từ chối | A6 lý do | A7 thiết lập | Basis items |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DR1 | người dùng đặt | có | không | có | có | không | không | có | V-1 | không | BR-020.V1, FR-141.7, FR-141.8 |
| DR2 | người dùng đặt | không | có | có | có | không | không | có | V-2 | không | BR-020.V2a, FR-141.7, FR-141.8 |
| DR3 | người dùng đặt | không | không | có | có | không | có | không | không | không | BR-020.R, BR-020.V3, FR-141.1, FR-141.9 |
| DR4 | folder | không | có | có | không | có | có | không | không | có | FR-071.2, BR-020.V2a, BR-020.V3 |
| DR5 | folder | không | không | có | không | không | có | không | không | có | FR-071.2, FR-071.15, BR-020.V3 |

**Nhất quán:** không có hai rule cùng giá trị condition mà khác action.

## DT-6 · Coverage item của DT

**5** rule, **3** tổ hợp infeasible. Trạng thái: **5 Covered** (DR4 qua TC47, vì nội dung của TC47 không phụ thuộc Z-28).

## Test cases

Mỗi test case một dòng. Input trỏ về **một** dòng của EP-4 hoặc BVA-2. "Ready" là mọi phần của expected đều có basis; "Blocked" là có phần chờ ruling, và cột expected ghi cả phần **đã biết**.

**Nguồn người dùng đặt.** Precondition chung: workspace `W`, không phải default, tên `Cũ`. Action chung: đổi tên `W` thành input. "Đặt tên X": tên của `W` là X và thao tác không bị từ chối. "Từ chối V-n": thao tác bị từ chối, lý do là **BR-020 V-n**, `W` **vẫn tên `Cũ`**.

| Test case | Input | Coverage items | Expected result | Nguồn | Status |
|---|---|---|---|---|---|
| TC1 | đại diện EC3 | EC3, EC5, EC9, EC11, EC13, EC15, EC17, EC19, DR3 | đặt tên `Toán` | FR-141.1 | Ready |
| TC2 | đại diện EC1 | EC1, BD1.dưới, DR1 | từ chối V-1 | BR-020.V1, FR-141.7, FR-141.8 | Ready |
| TC3 | đại diện EC2 | EC2, BD1-T.dưới, DR1 | từ chối V-1 | BR-020.V1, BR-020.V3 | Ready |
| TC4 | đại diện EC4 | EC4, DR2 | từ chối V-2 | BR-020.V2a, FR-141.7, FR-141.8 | Ready |
| TC5 | đại diện EC6 | EC6 | đặt tên `Toán` dạng NFC (U+00E1) | BR-020.V2c, FR-141.9 | Ready |
| TC6 | đại diện EC7 | EC7 | đặt tên U+00C5 + `x` | BR-020.V2c, FR-141.9 | Ready |
| TC7 | đại diện EC8 | EC8 | đặt tên U+0915 U+093C + `a` | BR-020.V2c, FR-141.9 | Ready |
| TC8 | đại diện EC10 | EC10 | đặt tên `Toán` + U+1F600 | BR-020.V2b | Ready |
| TC9 | đại diện EC12 | EC12 | đặt tên `T` + `x` + U+0301 | BR-020.V2b | Ready |
| TC10 | đại diện EC14 | EC14 | đặt tên `Toán` | BR-020.V3, FR-141.6 | Ready |
| TC11 | đại diện EC16 | EC16 | đặt tên U+200B + `Toán` + U+200B | BR-020.V3 | Ready |
| TC12 | đại diện EC18 | EC18 | đặt tên `Toán học` | BR-020.V3 | Ready |
| TC13 | đại diện EC20; thêm precondition: workspace `X` tên `Toán` | EC20 | đặt tên `Toán`; `X` vẫn tên `Toán` | FR-141.5 | Ready |
| TC14 | BD1.đúng: `T` | BD1.đúng | đặt tên `T` | BR-020.V1, BR-020.V2a | Ready |
| TC15 | BD1.trên: `To` | BD1.trên | đặt tên `To` | BR-020.V2a | Ready |
| TC16 | BD2.dưới: `a` lặp 99 | BD2.dưới | đặt tên `a` lặp 99 | BR-020.V2a | Ready |
| TC17 | BD2.đúng: `a` lặp 100 | BD2.đúng | đặt tên `a` lặp 100 | BR-020.V2a | Ready |
| TC18 | BD2.trên: `a` lặp 101 | BD2.trên, DR2 | từ chối V-2 | BR-020.V2a, FR-141.8 | Ready |
| TC19 | BD2-T.dưới | BD2-T.dưới | đặt tên `a` lặp 99 | BR-020.R, BR-020.V3 | Ready |
| TC20 | BD2-T.đúng | BD2-T.đúng | đặt tên `a` lặp 100 | BR-020.R, BR-020.V3 | Ready |
| TC21 | BD2-T.trên | BD2-T.trên | từ chối V-2 | BR-020.R, BR-020.V2a | Ready |
| TC22 | BD2-N−.dưới | BD2-N−.dưới, EC6 | đặt tên U+00E1 lặp 99 | BR-020.V2b, BR-020.V2c | Ready |
| TC23 | BD2-N−.đúng | BD2-N−.đúng, EC6 | đặt tên U+00E1 lặp 100 | BR-020.V2b, BR-020.V2c | Ready |
| TC24 | BD2-N−.trên | BD2-N−.trên, EC6 | từ chối V-2 | BR-020.V2a, BR-020.V2c | Ready |
| TC25 | BD2-N+.dưới | BD2-N+.dưới, EC8 | đặt tên U+0915 U+093C lặp 49 + `a` | BR-020.V2b, BR-020.V2c | Ready |
| TC26 | BD2-N+.đúng | BD2-N+.đúng, EC8 | đặt tên U+0915 U+093C lặp 50 | BR-020.V2b, BR-020.V2c | Ready |
| TC27 | BD2-N+.trên | BD2-N+.trên, EC8 | từ chối V-2 | BR-020.V2a, BR-020.V2c | Ready |
| TC28 | BD2-U.dưới | BD2-U.dưới, EC10 | đặt tên U+1F600 lặp 99 | BR-020.V2b | Ready |
| TC29 | BD2-U.đúng | BD2-U.đúng, EC10 | đặt tên U+1F600 lặp 100 | BR-020.V2b | Ready |
| TC30 | BD2-U.trên | BD2-U.trên, EC10 | từ chối V-2 | BR-020.V2a, BR-020.V2b | Ready |
| TC31 | BD2-G.dưới | BD2-G.dưới, EC12 | đặt tên đúng input (99 code point) | BR-020.V2b | Ready |
| TC32 | BD2-G.đúng | BD2-G.đúng, EC12 | đặt tên đúng input (100 code point) | BR-020.V2b | Ready |
| TC33 | BD2-G.trên | BD2-G.trên, EC12 | từ chối V-2 | BR-020.V2a, BR-020.V2b | Ready |
| TC67 | BD1-T.đúng | BD1-T.đúng | đặt tên `T` | BR-020.R, BR-020.V3 | Ready |
| TC68 | BD1-T.trên | BD1-T.trên | đặt tên `To` | BR-020.R, BR-020.V3 | Ready |

**Nguồn folder.** Precondition chung: folder tạo bằng **M19** (`namedFolder`) dưới root của test, đọc được, chưa là project folder của workspace nào. Action chung: thêm folder. Expected chung của mọi case: **O5**, tức tên folder trên đĩa (đúng chuỗi code point) và path **không đổi** (FR-071.15). "Thiết lập, tên X": workspace mới được thiết lập cho folder, và tên của nó là X.

| Test case | Input | Coverage items | Expected result | Nguồn | Status |
|---|---|---|---|---|---|
| TC34 | đại diện EC22 | EC22, EC24, EC28, EC30, EC32, EC35, EC37, DR5 | thiết lập, tên `Toán` | FR-071.2, FR-071.15 | Ready |
| TC35 | đại diện EC23 | EC23 | thiết lập, tên **100 code point**; **nội dung** chờ Z-28 | FR-071.2, BR-020.V2a | Blocked (Z-28) |
| TC36 | đại diện EC25 | EC25 | thiết lập, tên `Toán` dạng NFC; folder **vẫn tên NFD** | BR-020.V2c, FR-071.15 | Ready |
| TC37 | đại diện EC26 | EC26 | thiết lập, tên U+00C5 + `x`; folder vẫn tên U+212B + `x` | BR-020.V2c, FR-071.15 | Ready |
| TC38 | đại diện EC27 | EC27 | thiết lập, tên U+0915 U+093C + `a`; folder vẫn tên U+0958 + `a` | BR-020.V2c, FR-071.15 | Ready |
| TC39 | đại diện EC29 | EC29 | thiết lập, tên `Toán` + U+1F600 | BR-020.V2b | Ready |
| TC40 | đại diện EC31 | EC31 | thiết lập, tên `T` + `x` + U+0301 | BR-020.V2b | Ready |
| TC41 | đại diện EC33 | EC33 | thiết lập, tên **đúng chuỗi** U+00A0 U+FEFF `Toán` U+2028 U+0020 | BR-020.V3, FR-071.15 | Ready |
| TC42 | đại diện EC34 | EC34 | **chưa dùng expected**: chờ Z-26 (theo DT là DR5: thiết lập, tên U+00A0) | BR-020.V1, BR-020.V3 | Blocked (Z-26) |
| TC43 | đại diện EC36 | EC36 | thiết lập, tên `Toán học` | BR-020.V3 | Ready |
| TC44 | đại diện EC38; thêm precondition: workspace `X` tên `Toán` cho một folder khác | EC38 | thiết lập workspace thứ hai, tên `Toán`; `X` vẫn tên `Toán` | FR-141.5 | Ready |
| TC45 | BD3.dưới | BD3.dưới | thiết lập, tên `a` lặp 99 | FR-071.2 | Ready |
| TC46 | BD3.đúng | BD3.đúng | thiết lập, tên `a` lặp 100, không cắt | FR-071.2, BR-020.V2a | Ready |
| TC47 | BD3.trên | BD3.trên, EC23, DR4 | thiết lập, tên `a` lặp 100 | FR-071.2, BR-020.V2a | Ready |
| TC48 | BD3-N−.dưới | BD3-N−.dưới, EC25 | thiết lập, tên U+00E1 lặp 99 | BR-020.V2c, FR-071.2 | Ready |
| TC49 | BD3-N−.đúng | BD3-N−.đúng, EC25 | thiết lập, tên U+00E1 lặp 100, không cắt | BR-020.V2c, FR-071.2 | Ready |
| TC50 | BD3-N−.trên | BD3-N−.trên, EC25 | thiết lập, tên U+00E1 lặp 100 | BR-020.V2c, FR-071.2 | Ready |
| TC51 | BD3-N+.dưới | BD3-N+.dưới, EC27 | thiết lập, tên U+0915 U+093C lặp 49 + `a` | BR-020.V2c, FR-071.2 | Ready |
| TC52 | BD3-N+.đúng | BD3-N+.đúng, EC27 | thiết lập, tên U+0915 U+093C lặp 50, không cắt | BR-020.V2c, FR-071.2 | Ready |
| TC53 | BD3-N+.trên | BD3-N+.trên, EC27 | thiết lập, tên **100 code point**; **nội dung** chờ Z-28 | BR-020.V2c, FR-071.2 | Blocked (Z-28) |
| TC54 | BD3-U.dưới | BD3-U.dưới, EC29 | thiết lập, tên U+1F600 lặp 99 | BR-020.V2b | Ready |
| TC55 | BD3-U.đúng | BD3-U.đúng, EC29 | thiết lập, tên U+1F600 lặp 100, không cắt | BR-020.V2b, FR-071.2 | Ready |
| TC56 | BD3-U.trên | BD3-U.trên, EC29 | thiết lập, tên U+1F600 lặp 100, **không surrogate lẻ** | BR-020.V2b, FR-071.2 | Ready |
| TC57 | BD3-G.dưới | BD3-G.dưới, EC31 | thiết lập, tên đúng input (99 code point) | BR-020.V2b | Ready |
| TC58 | BD3-G.đúng | BD3-G.đúng, EC31 | thiết lập, tên đúng input (100 code point), không cắt | BR-020.V2b, FR-071.2 | Ready |
| TC59 | BD3-G.trên | BD3-G.trên, EC31 | thiết lập, tên **100 code point**; **nội dung** chờ Z-28 | BR-020.V2b, FR-071.2 | Blocked (Z-28) |
| TC60 | BD4.dưới | BD4.dưới | thiết lập, tên **100 code point**, **không surrogate lẻ**; nội dung chờ Z-28 | BR-020.V2b, FR-071.2 | Blocked (Z-28) |
| TC61 | BD4.đúng | BD4.đúng | như TC60 | BR-020.V2b, FR-071.2 | Blocked (Z-28) |
| TC62 | BD4.trên | BD4.trên | như TC60 | BR-020.V2b, FR-071.2 | Blocked (Z-28) |
| TC63 | BD5.đúng: folder `T` | BD5.đúng | thiết lập, tên `T` | FR-071.2 | Ready |
| TC64 | BD5.trên: folder `To` | BD5.trên | thiết lập, tên `To` | FR-071.2 | Ready |
| TC65 | BD6.dưới: folder `a` lặp 254 | BD6.dưới | thiết lập, tên `a` lặp 100 | FR-071.2, BR-020.V2a | Ready |
| TC66 | BD6.đúng: folder `a` lặp 255 | BD6.đúng | thiết lập, tên `a` lặp 100 | FR-071.2, BR-020.V2a | Ready |

## Completion checks

Loại bằng chứng theo mục kế tiếp. Check do **chính người thiết kế** chạy, nên **vẫn cần PO review**.

| Check | Kết quả | Loại bằng chứng | Ghi chú |
|---|---|---|---|
| EP-C1 · biến | pass | design-checked | O5 có từ FR-071.15 |
| EP-C2 · cover | pass | design-checked | Mỗi dimension có câu cover |
| EP-C3 · nguồn | pass | design-checked | EC23 (phần được giữ) và EC34 ghi gap |
| EP-C4 · infeasible | pass | design-checked, assumed | EC21 dựa trên RL3, trong đó có AS-2 |
| EP-C5 · representative | pass | computed | Representative EC23 cho **kết quả khác nhau** khi giữ 100 đầu hay 100 cuối |
| EP-C6 · coverage | pass | design-checked | EC34 **Blocked**: TC42 chưa có expected (Z-26) |
| EP-C7 · attribution | pass | design-checked | TC2, TC3, TC4: một class invalid, dimension khác ở base |
| EP-C8 · traceability | pass | design-checked | Mỗi ID một dòng, có status |
| EP-C9 · giao cho BVA | pass | design-checked | — |
| EP-C10 · loại bằng chứng | pass | design-checked | Mục "Loại bằng chứng" |
| BVA-C1 · suy ra | pass | design-checked | Mỗi biên có loại, nguồn, mục tiêu và criterion |
| BVA-C2 · đại lượng đo | pass | design-checked | — |
| BVA-C3 · giá trị | pass | computed | — |
| BVA-C4 · variant | pass | design-checked | Có BD1-T |
| BVA-C5 · gồm cả biên | pass | design-checked | — |
| BVA-C6 · coverage | pass | design-checked, computed | 5 giá trị Blocked (Z-28); script xác định giá trị nào **không** phụ thuộc Z-28 |
| BVA-C7 · tách biệt | pass | design-checked | — |
| DT-C1 · condition | pass | design-checked | C2 đo theo xử lý của **từng nguồn**; Z-26 là expected của EC34 |
| DT-C2 · liệt kê | pass | design-checked | 8 tổ hợp |
| DT-C3 · infeasible | pass | design-checked, assumed | CB6 dựa trên AS-2 |
| DT-C4 · merge | pass | design-checked | — |
| DT-C5 · action | pass | design-checked | — |
| DT-C6 · nhất quán | pass | design-checked | — |
| DT-C7 · coverage | pass | design-checked | DR1 đến DR5 Covered |
| DT-C8 · một rule | pass | design-checked | — |


## Loại bằng chứng

| Loại | Gồm | Không chứng minh |
|---|---|---|
| **design-checked** | Mọi bảng EP, BVA, DT; trạng thái coverage; completion check | Cách đọc spec là đúng; không có dimension nào bị bỏ sót |
| **computed** (script `D5-workspace-name.check.js`) | Độ dài đo được và kết quả theo luật của mọi input; NFC đổi chuỗi hay không; tập `trim()` của runtime; RL5; hiệu ứng của việc cắt theo UTF-16; case nào phụ thuộc Z-28 | DeckAgent làm đúng như vậy; fixture tạo được input |
| **assumed** | AS-1 đến AS-6 | Chúng đúng; mỗi cái có nơi xác nhận |
| **awaiting execution** | Mọi expected result về hành vi của DeckAgent; M19 tạo được mọi folder của nguồn folder | Có gì cho đến khi test chạy (Phase 5) |

## Reconciliation với AC nháp

Đọc **sau khi** mọi mục trên đã xong. AC: [acceptance-criteria.md](../acceptance-criteria.md).

| Coverage item | AC nháp | Kết quả | Ghi chú |
|---|---|---|---|
| EC3, DR3 | FR-141 AC-1 | match | Phần giữ folder và chat của AC-1 thuộc D1 |
| EC20 | FR-141 AC-3 | match | — |
| EC14 | FR-141 AC-4 | match | AC chỉ dùng dấu cách; class là cả tập `trim()` |
| EC2, BD2.trên, DR1, DR2 | FR-141 AC-5 | match | Lý do `BR-020 V-1` và `V-2` khớp A6 |
| BD2-N−.đúng | FR-141 AC-6 | match | — |
| BD1.đúng, BD1-T.đúng | FR-141 AC-7 | match | — |
| BD3.đúng | FR-071 AC-15 | match | Phần "tên đúng 100 ký tự" |
| EC23, BD3.trên | FR-071 AC-15 | **conflict** | AC đòi **"100 ký tự đầu"**; spec chỉ nói **cắt còn 100** (Z-28) |
| EC25 | FR-071 AC-12 | **conflict** | AC đòi tên **giống từng byte** tên folder NFD; spec đòi **dạng NFC** (Z-18) |
| — | FR-071 AC-12 (hai workspace, trỏ đúng folder) | unsupported trong D5 | Thuộc D2 |
| EC1, EC4, EC6 (lưu NFC), EC7, EC8, EC10, EC12, EC16, EC18 | — | missing | Chưa AC nào kiểm |
| EC22, EC24, EC26 đến EC33, EC35 đến EC38, O5 | — | missing | Chưa AC nào kiểm tên folder theo các class này |
| BD1, BD2, BD2-T, BD2-N+, BD2-U, BD2-G (trừ giá trị đã match) | — | missing | — |
| BD3-N−, BD3-N+, BD3-U, BD3-G, BD4, BD5, BD6, DR4, DR5 | — | missing | — |

**AC không được sửa** ở bước này: việc viết lại AC đợi outcome của Z-18, Z-26, Z-28 và PO review D5.

## Assumption

| Code | Assumption | Điều làm nó sai | Nơi xác nhận |
|---|---|---|---|
| AS-1 | Interface **không gửi** chuỗi có surrogate lẻ trong tên người dùng đặt | Driver hoặc interface cho phép gửi chuỗi JavaScript bất kỳ | Contract của driver; nếu sai, thêm class và gap |
| AS-2 | Domain tên folder là tên NTFS cho phép (không rỗng, tối đa 255 đơn vị UTF-16) | Folder trên file system khác (coverage limitation) | Self-test của M19 |
| AS-3 | M19 tạo được tên **có ký tự khoảng trắng ở cuối** (dấu cách, U+2028) qua `\\?\` | Fixture không tạo được, hoặc DeckAgent không đọc được folder đó | Self-test của M19; nếu sai, EC33 chỉ còn đầu tên và ghi deviation |
| AS-4 | Folder tên 255 đơn vị tạo và đọc được dưới root của test | Đường dẫn vượt giới hạn mà fixture không xử lý | Self-test của M19 và M7 (`longPath`) |
| AS-5 | Một **phần đầu** của chuỗi NFC vẫn là NFC, nên tên đã cắt **vẫn ở dạng NFC** | Một chuỗi mà phần đầu không còn NFC | Script thử mọi chữ cơ sở và hai dấu combining trong U+0300 đến U+036F: **không thấy** phản ví dụ; **không phải chứng minh** |
| AS-6 | Tập `trim()` của DeckAgent là tập của Node `22.19.0` (Unicode 16.0, 25 ký tự) | DeckAgent chạy trên runtime có phiên bản Unicode khác | Phiên bản Node được **ghim** ở CI (testing-plan.md mục 4) |

## Gaps đang mở

Đề xuất của mỗi gap nằm ở [test-design.md](../test-design.md) mục 2. Ảnh hưởng lên D5:

- **Z-26 · tên folder chỉ gồm khoảng trắng:** EC34 và TC42 **Blocked**; theo đề xuất, tên U+00A0 **có một ký tự** và **được nhận** (DR5).
- **Z-27 · tập khoảng trắng:** D5 dùng **toàn bộ** tập `trim()` (25 ký tự), **một representative cho mỗi class** (EP-2, EP-4).
- **Z-28 · cắt tên folder:** TC35, TC53, TC59, TC60, TC61, TC62 **Blocked**; độ dài 100 vẫn được assert như phần đã biết.
- **Z-18 · FR-071 AC-12 trái NFC:** conflict EC25 ở reconciliation.
