# Lessons Learned

Đọc file này để biết những lỗi đã gặp trong project DeckAgent và quy tắc cụ thể để tránh lặp lại các lỗi đó.

File này là nguồn dữ liệu chính (single source of truth) cho Lesson Learned. Chỉ thêm hoặc sửa bài học khi người dùng đã chấp thuận. Chỉ ghi bài học cho lỗi trong quá trình làm việc mà nhìn file kết quả không thấy được, và không chặn được bằng kiến trúc, type, lint hoặc test. Quy tắc kiểm được trên file kết quả thuộc [Conventions](docs/conventions/README.md).

## Quy ước

- **ID** có dạng `LL-XXX`, tăng dần, không đổi và không tái sử dụng, kể cả khi bài học bị loại bỏ.
- Bài học không có dòng `Status` là còn hiệu lực. Khi bài học không còn áp dụng, thêm dòng `- **Status:** Deprecated — <lý do>`, không xóa khỏi file.
- **Scope** dùng một trong các giá trị: `Documentation`, `Code`, `Testing`, `General`.

Mỗi bài học theo mẫu:

```markdown
### LL-XXX: <Title>

- **Scope:** <Documentation | Code | Testing | General>
- **Status:** Deprecated — <lý do> (tùy chọn, chỉ thêm khi bài học không còn áp dụng)
- **Problem:** <Lỗi đã gặp và vì sao lỗi đó gây ra vấn đề>
- **Rule:** <Quy tắc cụ thể, có thể kiểm tra được>
- **Examples:** (khi phù hợp)
  - Before: ...
  - After: ...
```

## Lessons

### LL-001: Requirement Completeness Without an Independent Baseline

- **Scope:** Testing
- **Problem:** Khi đánh giá một bộ requirement đã đủ để thiết kế test hay chưa, agent chỉ so các tài liệu và sản phẩm có cùng nguồn gốc với nhau, ví dụ spec viết lại từ prototype, chính prototype đó, code và test viết theo spec. So như vậy chỉ thấy chỗ chúng lệch nhau, không thấy những tình huống mà tất cả cùng bỏ sót. Kết quả là requirement được coi là đầy đủ trong khi còn thiếu luồng thay thế, luồng ngoại lệ và yêu cầu bảo mật. Agent cũng trích ID và mức của chuẩn từ bản tóm tắt, nên gán sai mức cho yêu cầu.
- **Rule:** Trước khi kết luận một bộ requirement đã đủ để thiết kế test, đối chiếu nó với ít nhất một baseline độc lập với nguồn đã sinh ra nó: chuẩn ngành của domain (ví dụ OWASP ASVS cho authentication và session, WCAG cho accessibility), hoặc use case do tác giả chưa đọc spec viết. Ghi trong tài liệu phân tích: baseline đã dùng, mức áp dụng và danh sách gap tìm được. ID và mức của yêu cầu trong chuẩn phải lấy từ bản gốc, không lấy từ bản tóm tắt.
- **Examples:**
  - Before: "Đối chiếu spec Authentication với prototype và code: 43/49 requirement đã đủ để viết test."
  - After: "Baseline độc lập: OWASP ASVS 5.0 L1 (V6, V7, V3.3–3.7) và bộ use case viết độc lập. Kết quả: 14 nhóm gap, một trong số đó là lỗi đang có trong code. Requirement chỉ được coi là đủ sau khi đã chốt các gap."

### LL-002: Unsourced Agent-Proposed Values

- **Scope:** General
- **Problem:** Agent đề xuất giá trị cụ thể (ngưỡng rate limit, thời hạn, giới hạn độ dài) mà không ghi nguồn hay lý do, rồi gộp chung với nhiều quyết định khác để người dùng duyệt một lần. Giá trị đó được ghi vào spec như đã chốt dù không có requirement nào sinh ra nó. Khi thay giá trị cũ, agent còn âm thầm đổi ý nghĩa của hành vi gốc, ví dụ từ đếm lần nhập sai sang đếm mọi lần bấm. Người dùng không có căn cứ để đánh giá con số, nên quyết định phải mở lại sau khi đã implement.
- **Rule:** Mỗi giá trị cụ thể do agent đề xuất phải ghi kèm ba thông tin: nguồn (requirement, prototype, chuẩn ngành kèm số mục, mặc định của thư viện, hoặc "agent đề xuất"), lý do chọn giá trị đó, và hành vi thay đổi thế nào so với nguồn hiện có. Khi trình nhiều quyết định cùng lúc, tách riêng các giá trị do agent đề xuất để người dùng duyệt từng giá trị.
- **Examples:**
  - Before: "D3: Giới hạn Sign in 5 lần trong 15 phút theo IP (Recommended)."
  - After: "Giới hạn Sign in. Prototype: khóa sau 3 lần sai. Mặc định của Better Auth: 3 request/10 giây/IP. Agent đề xuất: 5 request/15 phút/IP, đếm mọi lần bấm, tức là khác prototype ở cách đếm. Lý do: …"
