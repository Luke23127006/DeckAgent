# OpenDesign — Kế hoạch nghiên cứu (Research Plan)

**Repository:** https://github.com/EthanGuo2022/OpenDesign

**Mục tiêu nghiên cứu:** Phân tích ngược (Reverse-engineer) kiến trúc của Slide Deck Agent trong OpenDesign nhằm hiểu cách hệ thống tạo, đánh giá và chỉnh sửa presentations, bao gồm các cơ chế kỹ thuật và những quyết định kiến trúc đằng sau việc triển khai.

## Giai đoạn 1 — Nghiên cứu kiến trúc tổng quan (Overall Architecture Research)

**Mục tiêu:** Hiểu toàn bộ cách Slide Deck Agent hoạt động từ đầu đến cuối (end-to-end) trước khi đi sâu vào từng thành phần riêng lẻ.

- Xác định các thành phần kiến trúc chính và trách nhiệm của từng thành phần.
- Truy vết toàn bộ quy trình xử lý: User Request → Agent Runtime → Planning → Tool Execution → Design Representation → Rendering → Critic → Revision → Final Output.
- Tìm hiểu luồng điều khiển (Control Flow), luồng dữ liệu (Data Flow), quản lý trạng thái (State Management) và cách các thành phần tương tác với nhau.
- Xác định cách hệ thống tạo, đánh giá, chỉnh sửa và xuất bản presentations.

**Kết quả cần bàn giao (Deliverables):**
- Tổng quan kiến trúc (Architecture Overview).
- Sơ đồ các thành phần và trách nhiệm (Component Map).
- Quy trình xử lý end-to-end (End-to-End Workflow).
- Sơ đồ kiến trúc tổng thể (Architecture Diagram).
- Sơ đồ tuần tự xử lý (Sequence Diagram).

## Giai đoạn 2 — Nghiên cứu chuyên sâu các thành phần và cơ chế (Component & Mechanism Deep Dive)

**Mục tiêu:** Nghiên cứu chi tiết cách triển khai (implementation), thuật toán và cơ chế hoạt động của từng thành phần trong kiến trúc.

**Các thành phần cần nghiên cứu:**

1. **Agent Runtime:** Vòng đời thực thi (Execution Lifecycle), điều phối hoạt động (Orchestration), quản lý trạng thái (State Management).
2. **Planner:** Chiến lược lập kế hoạch (Planning Strategy), vòng lặp suy luận (Reasoning Loop), lựa chọn công cụ (Tool Selection).
3. **Tool Execution:** Đăng ký công cụ (Tool Registry), gọi và thực thi công cụ (Invocation & Execution), xử lý lỗi (Error Handling).
4. **Design Representation:** Cấu trúc dữ liệu (Data Structures), Schema, Layer Graph và cách biểu diễn slides.
5. **Rendering:** Tạo bố cục (Layout Generation), kết hợp hình ảnh (Image Composition), Typography và quá trình tạo file PPTX.
6. **Critic:** Cơ chế đánh giá thiết kế (Evaluation Mechanisms), hệ thống chấm điểm (Scoring), phản hồi dựa trên hình ảnh (Visual Feedback).
7. **Revision:** Chỉnh sửa cục bộ (Partial Editing), lan truyền thay đổi (Change Propagation) và bảo toàn các thành phần không liên quan (Preservation of Unaffected Elements).

Đối với mỗi thành phần, cần làm rõ:

- Trách nhiệm và chức năng chính.
- Dữ liệu đầu vào và đầu ra (Inputs/Outputs).
- Thuật toán và các cơ chế xử lý.
- Chi tiết triển khai trong source code.
- Cách tương tác và trao đổi dữ liệu với các thành phần khác.
- Dẫn chứng từ source code.

**Kết quả cần bàn giao (Deliverables):**

Báo cáo phân tích kỹ thuật (Technical Analysis) cho từng thành phần, kèm theo tham chiếu source code và luồng thực thi thực tế (Execution Traces) khi có thể.

## Giai đoạn 3 — Phân tích quyết định kiến trúc và các đánh đổi (Architecture Decisions & Trade-off Analysis)

**Mục tiêu:** Hiểu TẠI SAO tác giả lựa chọn những kiến trúc và cơ chế hiện tại, đồng thời đánh giá một cách khách quan các hệ quả của những quyết định đó.

Đối với mỗi quyết định kiến trúc quan trọng, cần:

- Xác định vấn đề và bối cảnh thiết kế (Problem & Design Context).
- Giải thích cơ chế được lựa chọn và lý do đằng sau quyết định đó (Rationale).
- Phân tích ưu điểm, hạn chế và các đánh đổi (Trade-offs).
- So sánh với các phương án kiến trúc thay thế (Architectural Alternatives).
- Đánh giá tác động đến chất lượng thiết kế (Design Quality), độ tin cậy (Reliability), khả năng bảo trì (Maintainability), độ trễ (Latency) và chi phí sử dụng mô hình AI (Model Cost).
- Tìm kiếm bằng chứng ủng hộ hoặc phản bác những lợi ích được đưa ra.

**Kết quả cần bàn giao (Deliverables):**

- Phân tích các quyết định kiến trúc (Architecture Decision Analysis).
- Bảng phân tích đánh đổi (Trade-off Matrix).
- So sánh các phương án thay thế (Alternatives Comparison).
- Đánh giá dựa trên bằng chứng (Evidence-Based Evaluation).
- Đề xuất cải tiến kiến trúc (Improvement Recommendations).

## Nguyên tắc nghiên cứu (Research Principles)

- **Ưu tiên source code (Source-code-first):** Kiểm chứng implementation thực tế, không chỉ dựa vào tài liệu mô tả.
- **Dựa trên bằng chứng (Evidence-based):** Các nhận định kỹ thuật phải có dẫn chứng từ source code, tài liệu hoặc kết quả thực nghiệm.
- **Không đưa ra giả định thiếu căn cứ (No Unsupported Assumptions):** Phân biệt rõ hành vi đã được xác minh, lý do do tác giả công bố và các giả thuyết nghiên cứu.
- **Tập trung vào Presentation (Presentation-focused):** Ưu tiên nghiên cứu quy trình tạo Slide Deck hơn các loại design artifacts khác.
- **Khả năng tái lập (Reproducibility):** Ghi lại commit của repository được sử dụng làm phiên bản chuẩn cho nghiên cứu.
- **Nghiên cứu theo trình tự (Sequential Research):** Hoàn thành Giai đoạn 1 trước khi chuyển sang Giai đoạn 2, sau đó sử dụng kết quả của Giai đoạn 2 làm cơ sở cho Giai đoạn 3.
- **Không đánh giá vội vàng (No Premature Evaluation):** Không mặc định một cơ chế là ưu điểm hay nhược điểm khi chưa kiểm tra bằng chứng.

## Kết quả nghiên cứu cuối cùng (Expected Final Outcome)

Một báo cáo nghiên cứu kỹ thuật có khả năng giải thích rõ:

1. **WHAT — Hệ thống có những gì?** Kiến trúc tổng thể của Slide Deck Agent.
2. **HOW — Hệ thống hoạt động như thế nào?** Cách các thành phần, thuật toán và cơ chế kỹ thuật được triển khai và phối hợp.
3. **WHY — Tại sao hệ thống được thiết kế như vậy?** Lý do đằng sau các quyết định kiến trúc.
4. **TRADE-OFFS — Những đánh đổi là gì?** Ưu điểm, hạn chế, phương án thay thế và bằng chứng đánh giá.

**Phạm vi (Scope):** Nghiên cứu và đánh giá kiến trúc phần mềm của OpenDesign, không bao gồm việc triển khai lại hoặc xây dựng một hệ thống OpenDesign mới.