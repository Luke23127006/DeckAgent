---
id: R-000
short_name: ""            # 3–8 từ, phân biệt được (GR-16)
type: ""                  # giá trị theo schema.json, ánh xạ vào nhóm hành vi | chất lượng | giao diện | dữ liệu (GR-14)
status: Draft             # giá trị theo schema.json
scope: ""                 # release theo schema.json
verification: test        # test | demonstration | inspection | analysis
inputs: false             # true nếu requirement nhận đầu vào → bắt buộc section Miền đầu vào (GR-08)
area: []                  # tùy chọn, giá trị theo schema.json
source: []                # ID hoặc mã nguồn (GX-11)
# Quan hệ: chỉ ghi ở phía này, chiều ngược do công cụ sinh (GX-05). Loại: xem _COMMON_CRITERIA.md mục 2
use_cases: []             # Dựa vào: Use Case mà requirement làm rõ
business_rules: []        # Dựa vào: rule mà requirement phải tuân theo
constraints: []           # Dựa vào: giới hạn chứa requirement
assumptions: []           # Dựa vào: requirement chỉ cần khi assumption đúng
depends_on: []            # Dựa vào: requirement khác cần có trước
---

## Yêu cầu

<!-- Một câu (GR-01, GR-04): [Khi …, | Trong khi …, | Nếu … thì | Ở nơi có …,] <Hệ thống> phải <hành vi hoặc chất lượng quan sát được>. -->

## Bối cảnh / Lý do

<!-- 1–3 câu hoặc danh sách: vì sao cần, giải vấn đề gì của người dùng. Không lặp câu Yêu cầu (GR-06). -->

## Miền đầu vào

<!-- Chỉ khi inputs: true (GR-08). Xóa section nếu không áp dụng.
| Đầu vào | Hợp lệ | Không hợp lệ | Biên |
|---|---|---|---|
-->

## Đo lường

<!-- Chỉ khi requirement mô tả mức độ (GR-09) hoặc kết quả do AI sinh (GR-10). Xóa section nếu không áp dụng.
- Scale: <đại lượng + đơn vị>
- Meter: <đo thế nào, trên dữ liệu nào, mấy lần chạy, ai hoặc cái gì chấm>
- Ngưỡng đạt: <con số>   (ở Proposed được ghi: Chưa chốt (<nơi đang đo>); ở Active bắt buộc là con số — GX-09)
-->

## Acceptance

<!-- Danh sách đánh số (GR-07). Mỗi điều: điều quan sát được + kết quả phán được đúng sai.
     Dạng rule: "1. Khi <đầu vào>, hệ thống <kết quả>."
     Dạng kịch bản: "1. Cho <trạng thái>, khi <hành động>, thì <kết quả>." -->

1.

## Câu hỏi mở

<!-- Mỗi câu kết thúc bằng "?" và có nơi xử lý: task, issue hoặc decision (GX-09). Xóa section nếu trống. -->

## Ghi chú

<!-- Giới hạn phạm vi, lưu ý khi đọc, việc để sau (GX-12). Xóa section nếu trống. -->
