---
id: UC-000
title: ""                 # [Ai] + [làm gì] + [với cái gì] + [điểm phân biệt], ≤ ~15 từ (GUC-01)
status: Draft             # giá trị theo schema.json
scope: ""                 # release đầu tiên giao Main Flow (GUC-16)
level: user-goal          # user-goal | subfunction (chỉ khi được include bởi ≥2 Use Case) (GUC-03)
source: []                # Tham chiếu: ID hoặc mã nguồn (GX-11)
# Quan hệ: khai báo một phía, phía ngược do công cụ sinh. Loại: xem _COMMON_CRITERIA.md mục 2
primary_actor: ACT-000    # Dựa vào: đúng một actor mà Use Case phục vụ (GUC-02)
supporting_actors: []     # Dựa vào: actor tham gia để hoàn thành, ví dụ dịch vụ bên ngoài (GUC-02, GUC-12)
constraints: []           # Dựa vào
include: []               # Dựa vào: Use Case này gọi UC-xxx như phần bắt buộc
extend: []                # Dựa vào: Use Case này mở rộng UC-xxx
follows: []               # Tham chiếu: thường diễn ra sau UC-xxx
split_from: []            # Tham chiếu: tách từ UC-xxx
related: []               # Tham chiếu: liên quan hoặc cần phân biệt (giải thích trong Ghi chú)
superseded_by: []         # Tham chiếu: chỉ dùng khi đã Closed
---

## Tình huống

<!-- 1–2 câu: "Tôi có …, tôi muốn …, để …" với chi tiết cụ thể (GUC-04). -->

## Mục tiêu

<!-- 1 câu: kết quả actor nhận được khi thành công (GUC-05). -->

## Trigger

<!-- 1 câu: sự kiện quan sát được, bắt đầu bằng chủ ngữ (GUC-06). -->

## Preconditions

<!-- Điều đã đúng trước bước 1, luồng không kiểm lại (GUC-07). -->

1.

## Main Flow

<!-- Danh sách đánh số, nên 3–9 bước, không có "nếu" (GUC-08). Mỗi bước: actor/hệ thống + động từ + đối tượng (GUC-09). -->

1.
2.
3.

## Alternative / Failure Flows

<!-- <bước><A-Z>. <điều kiện hệ thống phát hiện được>: <hệ thống làm gì>, <quay lại bước X | kết thúc Use Case | chuyển sang UC-xxx>. (GUC-10, 11, 12)
     Mỗi Hành vi lỗi của supporting_actors cần một nhánh hoặc lý do bỏ qua. -->

## Postconditions

<!-- Điều chắc chắn đúng khi thành công, mỗi điều kiểm chứng được (GUC-13). -->

1.

## Bảo đảm tối thiểu

<!-- Điều vẫn đúng khi Use Case thất bại ở bất kỳ nhánh nào; chỉ ghi điều hệ thống kiểm soát được; có thể tham chiếu Business Rule (GUC-14). -->

1.

## Câu hỏi mở

<!-- Mỗi câu có "?" và nơi xử lý. Ở Active chỉ còn câu hỏi không ảnh hưởng luồng và kết quả (GX-09). Xóa section nếu trống. -->

## Sản phẩm tham khảo

<!-- Tùy chọn: "[Sản phẩm]: [tính năng tương ứng]". Xóa section nếu không dùng. -->

## Ghi chú

<!-- Giới hạn phạm vi, nhánh thuộc release sau (GUC-16), giải thích quan hệ related (GX-12). Xóa section nếu trống. -->
