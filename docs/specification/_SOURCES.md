# Nguồn của bộ tiêu chí

File này ghi lại các tiêu chí trong `_COMMON_CRITERIA.md` và các file `_CRITERIA.md` lấy gì, từ nguồn nào. Đọc file này khi cần biết căn cứ của một tiêu chí, hoặc khi muốn thêm hay bỏ tiêu chí.

## Requirement

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **ISO/IEC/IEEE 29148** (§5.2) | **Đặc tính của từng requirement:** necessary, implementation free, unambiguous, consistent, complete, singular, feasible, traceable, verifiable.<br>**Đặc tính của cả tập requirement:** complete (không có TBD), consistent, affordable, bounded.<br>**Từ cần tránh:** superlatives, subjective language, vague pronouns, ambiguous adverbs, open-ended terms, comparative phrases, loopholes, negative statements.<br>**Thuộc tính đi kèm:** identification, priority, dependency, risk, source, rationale, type | GX-01, 03, 04, 08, 09, 11, 17; GR-02, 04, 05, 06, 11, 12, 13, 14, 15 |
| **INCOSE Guide to Writing Requirements v4** | 15 characteristics (C1–C15) và 42 rules (R1–R42), trong đó R33 (khoảng giá trị) và R34 (hiệu năng đo được) là nền cho phần testability | Hầu hết GX và GR |
| **EARS** (Mavin) | Các mẫu câu: ubiquitous, state-driven (While), event-driven (When), optional feature (Where), unwanted behaviour (If… then), complex | GR-01, GR-03 |
| **Volere** (Robertson) | Fit criterion: phép đo cho phép kiểm **không chủ quan** xem giải pháp có đạt requirement hay không | GR-06, GR-07 |
| **Planguage** (Gilb) | Định lượng chất lượng bằng Scale (đơn vị), Meter (cách đo) và ngưỡng | GR-09 |
| **NASA SWE-050** | Requirement phải hữu hạn, có giới hạn hoặc biên, testable; xác định chiến lược kiểm chứng ngay khi viết requirement | GR-08, field `verification` |
| **ISTQB CTFL 4.0** | Phân tích test basis để tìm chỗ mơ hồ, thiếu, mâu thuẫn. Kỹ thuật black-box (equivalence partitioning, boundary value analysis, decision table, state transition) và thông tin mỗi kỹ thuật cần từ spec. Hai dạng acceptance criteria: kịch bản và rule | GR-07, GR-08, GBR-05, phần testing của Use Case |
| **ATDD cho hệ thống LLM** (arXiv 2606.02755) | Acceptance cho tính năng dùng LLM cần bộ đánh giá (dataset, rubric, validator tất định), và phải đo trên nhiều lần chạy | GR-10 |

**Vì sao không bắt mọi requirement phải "test" được.** Các chuẩn trên thống nhất hai điểm:
- **Mọi** requirement phải verifiable.
- Verifiable có bốn phương pháp: test, demonstration, inspection, analysis.

Vì vậy gate có hai lớp:
- **Lớp chung** (GR-03, GR-07) áp cho mọi requirement: điều kiện áp dụng phải tường minh, và Acceptance phải phán được đúng hay sai.
- **Lớp riêng** áp theo điều kiện:
  - GR-08 (miền đầu vào): khi `verification: test` và requirement nhận đầu vào.
  - GR-09 (Scale/Meter): khi requirement mô tả một mức độ.
  - GR-10 (bộ đánh giá): khi kết quả do AI sinh.

Ở mức Proposed, biên và ngưỡng được phép "Chưa chốt". Ở mức Active thì phải chốt (GX-09). Lý do: test chỉ phán được đạt hay không khi đã có ngưỡng.

## Use Case

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **Cockburn, Writing Effective Use Cases** | Goal levels. Main success scenario 3–9 bước, viết theo dạng chủ ngữ – động từ – tân ngữ, nêu ý định thay vì mô tả giao diện. Extension chỉ gồm điều kiện **hệ thống phát hiện được**, và phải liệt kê đầy đủ. Preconditions không bị kiểm lại trong luồng. Minimal guarantee và success guarantee. Primary actor và supporting actor là vai trò trong từng use case | GUC-01 tới GUC-14, GACT-02 |
| **Use-Case 2.0** (Jacobson, Spence, Kerr) | Use Case tạo ra kết quả quan sát được, có giá trị. Story là một đường đi qua các luồng. Slice là đơn vị làm việc, có test case riêng | Định nghĩa, GUC-03, GUC-16 |
| **UML** | Actor là một vai trò | GUC-02 |

## Business Rule

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **Business Rules Manifesto** | Rule là "first-class citizen"; rule tường minh, phát biểu khai báo bằng câu tự nhiên, kiểm được tính đúng, đối chiếu được với nhau để tìm mâu thuẫn; ít rule tốt hơn nhiều rule | GBR-03, 04, 07, 08, 09 |
| **RuleSpeak** (Ross), qua Nijpels | Rule phải nguyên tử; rule là quy tắc chứ không phải cơ chế thực thi | GBR-02, GBR-03 |
| **ISTQB** | Decision table testing, state transition testing | GBR-05 |

## Constraint

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **ISO 29148** | Constraint là giới hạn **áp từ bên ngoài** lên requirement, thiết kế, implementation hoặc quy trình | GC-01 |
| **Wiegers** | Hỏi vì sao constraint tồn tại, ghi lại lý do, tách constraint thật khỏi ý tưởng giải pháp | GC-01, 03, 04, 06 |
| **arc42 §2** | Constraint giới hạn quyền tự do thiết kế; phân loại kỹ thuật và tổ chức | GC-02, 05, 07 |

## Assumption

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **Assumption-Based Planning** (Dewar, RAND) | Load-bearing và vulnerable assumption; signpost, shaping action, hedging action | GA-03 tới GA-06 |
| **NASA SWE-184** | Ghi assumption kèm tiêu chí kiểm chứng | GA-05 |
| **Assumption mapping** (Lean) | Assumption phải phát biểu được thành điều kiểm chứng được và có thể bị bác bỏ | GA-01 |

## Decision

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **Nygard, Documenting Architecture Decisions** | Context trung tính; quyết định ở thể chủ động; ghi mọi hệ quả, kể cả hệ quả xấu; mỗi record một quyết định; giữ lại record đã bị thay | GD-01, 02, 05, 09; GX-15 |
| **MADR** | Considered Options, Decision Drivers, Consequences (tốt và xấu), Confirmation, trạng thái "superseded by" | GD-03, 05, 06, 09 |
| **Zimmermann, Definition of Done cho architectural decision (ecADR)** | Evidence, Criteria (≥2 phương án), Agreement, Documentation, Realization/Review | GD-03, 04, 06, 07, 08 |

## Actor

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **UML** | Actor là vai trò mà người dùng hoặc hệ thống khác đóng | GACT-01 |
| **Cockburn** | Stakeholders & interests; supporting actor | GACT-02, 03, 05 |
| **NASA SWE-184** | Fault injection: giả lập lỗi của thành phần bên ngoài | GACT-05 |

## Lưu trữ spec dạng file

| Nguồn | Lấy gì | Dùng ở |
|---|---|---|
| **Doorstop**, **elspais** | Mỗi item là một file trong Git; link một chiều từ item con lên item cha; công cụ tự kiểm tính toàn vẹn | GX-05, GUC-17, GACT-07 |
| **Doorstop** (suspect link), **Jama Connect** (suspect links) | Khi item cha đổi, link từ item con bị đánh dấu nghi vấn để người xem lại. Đây là cơ sở của hướng lan ảnh hưởng theo loại quan hệ | `_COMMON_CRITERIA.md` mục 2 |
| **Quy ước của bộ tiêu chí** | Hai trục mức sẵn sàng và hiệu lực; ba loại quan hệ (dựa vào, áp lên, tham chiếu); phạm vi kiểm của CI. Không có chuẩn bên ngoài quy định trực tiếp các điểm này. Chúng được đặt ra để các tiêu chí có nguồn ở trên thực thi được trên spec dạng file | `_COMMON_CRITERIA.md` mục 1–3 |
| **ISO 8601** | Định dạng ngày `YYYY-MM-DD` | GX-18 |

## Links

- [INCOSE Guide to Writing Requirements V4 – Summary Sheet](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf)
- [ISO/IEC/IEEE 29148:2011](https://nirmt.com/storage/uploads/E-BOOK_BE-INDUSTRIAL-AND-SAFETY/29148-2011%20-%20ISOIECIEEE%20International%20Standard%20-%20Systems%20and%20software%20engineering%20--%20Life%20cycle%20processes%20--Requirements.pdf)
- [Alistair Mavin – EARS](https://alistairmavin.com/ears/)
- [Volere – Atomic requirements (Robertson)](https://www.cse.chalmers.se/~feldt/courses/reqeng/robertson_on_atomic_requirements_in_volere.pdf)
- [Specifying Quality Requirements With Planguage](https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/2926/Specifying-Quality-Requirements-With-Planguage.aspx)
- [NASA SWE-050 – Software Requirements](https://swehb.nasa.gov/spaces/SWEHBVC/pages/50888900/SWE-050+-+Software+Requirements)
- [NASA SWE-184 – Software-related Constraints and Assumptions](https://swehb.nasa.gov/spaces/SWEHBVD/pages/102695520/SWE-184+-+Software-related+Constraints+and+Assumptions)
- [ISTQB CTFL Syllabus v4.0.1](https://astqb.org/assets/documents/ISTQB_CTFL_Syllabus_v4.0.1.pdf)
- [Acceptance-Test-Driven Evaluation Protocols for Business-Centric LLM Systems (arXiv 2606.02755)](https://arxiv.org/pdf/2606.02755)
- [Cockburn – Writing Effective Use Cases](https://people.inf.elte.hu/molnarba/Informaciorendszerek_ELTE/Writing_effective_Use_cases_Cockburn.pdf)
- [Use-Case 2.0](https://www.ivarjacobson.com/files/field_iji_file/article/use-case_2.0_final_rev3.pdf)
- [Actor (UML)](https://en.wikipedia.org/wiki/Actor_(UML))
- [(Re)discovering the Business Rules Manifesto](https://modeling-languages.com/rediscovering-business-rules-manifesto/)
- [Business Rules in Requirements Analysis – Nijpels](https://www.brcommunity.com/articles.php?id=b259)
- [Coloring Inside the Lines: Constraints in Software Development – Wiegers](https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/6663/Coloring-Inside-the-Lines-Constraints-in-Software-Development.aspx)
- [arc42 – Architecture Constraints](https://docs.arc42.org/section-2/)
- [Assumption-Based Planning](https://www.mindtools.com/a11lhe8/assumption-based-planning/)
- [Nygard – Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [MADR](https://adr.github.io/madr/)
- [Zimmermann – A Definition of Done for Architectural Decision Making](https://ozimmer.ch/practices/2020/05/22/ADDefinitionOfDone.html)
- [Doorstop](https://github.com/doorstop-dev/doorstop)
- [Doorstop – Validating Requirements (suspect links)](https://doorstop.readthedocs.io/en/v2.0/cli/validation/)
- [Jama Connect – Clear suspect links](https://help.jamasoftware.com/en/manage-content/coverage-and-traceability/relationships/clear-suspect-links.html)
- [elspais](https://pypi.org/project/elspais/0.11.0/)
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)
