"""Thay token {ID} trong file Markdown bằng "ID (ý chính)" lấy từ gloss.json.

Dùng cho báo cáo Pha B: mỗi lần nhắc ID đều kèm ý chính trong ngoặc.
Chạy: python tools/spec/expand_ids.py <gloss.json> <file nguồn> <file đích>
"""
import json
import re
import sys
from pathlib import Path


def main() -> None:
    gloss = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    text = Path(sys.argv[2]).read_text(encoding="utf-8")
    missing = set()

    def repl(m: re.Match) -> str:
        key = m.group(1)
        if key not in gloss:
            missing.add(key)
            return key
        return f"{key} ({gloss[key]})"

    out = re.sub(r"\{([A-Z]{1,4}-?\d*[a-e]?-?\d*)\}", repl, text)
    Path(sys.argv[3]).write_text(out, encoding="utf-8", newline="\n")
    if missing:
        sys.exit("Thiếu ý chính cho: " + ", ".join(sorted(missing)))


if __name__ == "__main__":
    main()
