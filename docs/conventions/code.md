# Coding Guidelines

Đọc file này để biết các quy tắc viết code production, phân chia trách nhiệm và xử lý dữ liệu khi implement DeckAgent.

## Phạm vi và ưu tiên

1. Tuân thủ Tech Stack trong `AGENTS.md` [[1]](#ref-1) và dependency boundaries trong [Project Structure](project-structure.md) [[2]](#ref-2).
2. Strict boundaries, flexible implementation: bảo vệ trách nhiệm của từng phần nhưng không tạo class, interface, mapper hay folder chỉ để đủ template.
3. Không đưa workflow thực thi của agent vào file này; workflow thuộc tầng Skill [[3]](#ref-3). Ví dụ code chỉ minh họa conventions, không phải implementation bắt buộc.
4. Quy tắc nào kiểm tra được bằng máy thì enforce bằng type hoặc lint; file này chỉ giải thích lý do và cách sửa.

## Naming conventions

## TypeScript

## Comments

## Contracts, validation và data representation

## Error handling và testing

## Những điều không bắt buộc

## References

1. <a id="ref-1"></a>[Project: DeckAgent](../../AGENTS.md)
2. <a id="ref-2"></a>[Project Structure](project-structure.md)
3. <a id="ref-3"></a>[Conventions](README.md)
