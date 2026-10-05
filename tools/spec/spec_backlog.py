"""Sinh _PROVISIONAL.md (mọi ngưỡng tạm) từ các file item trong docs/specification/.

Ngưỡng tạm có nhãn `<giá trị> [tạm YYYY-MM-DD · xem lại: <sự kiện>]` (_COMMON_CRITERIA.md mục 7).
Chạy lại script mỗi khi thêm, sửa hoặc bỏ ngưỡng tạm.

Chạy: python tools/spec/spec_backlog.py
"""
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "docs" / "specification"
LABEL = re.compile(r"\[tạm (\d{4}-\d{2}-\d{2}) · xem lại: ([^\]]+)\]")
ITEM_FILE = re.compile(r"^(ACT|UC|BR|C|A|R|D)-\d{3,}\.md$")


def item_files():
    for d in sorted(SPEC.glob("0*-*")):
        for f in sorted(d.iterdir()):
            if ITEM_FILE.match(f.name):
                yield f


def value_before(line, start):
    """Phần chữ đứng ngay trước nhãn: từ dấu ':', ';', '|', '(' hoặc đầu dòng gần nhất."""
    left = line[:start].rstrip()
    cut = max(left.rfind(s) for s in (": ", "; ", "| ", "(", "[", "*"))
    text = left[cut + 1:] if cut >= 0 else left
    text = re.sub(r"^\s*\d+\.\s*", "", text).strip(" -*:")
    return text[-120:]


def scan():
    rows = []
    for f in item_files():
        section = ""
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.startswith("## "):
                section = line[3:].strip()
            for m in LABEL.finditer(line):
                rows.append((f.stem, section, value_before(line, m.start()), m.group(1), m.group(2)))
    return rows


def main():
    rows = scan()
    by_event = defaultdict(set)
    for item, _, _, _, event in rows:
        by_event[event].add(item)
    out = [
        "# Ngưỡng tạm",
        "",
        "Danh sách mọi ngưỡng tạm trong spec (`_COMMON_CRITERIA.md` mục 7), sinh bằng `python tools/spec/spec_backlog.py`.",
        "Không sửa tay: sửa ngưỡng trong file item rồi chạy lại script. Khi sự kiện xem lại xảy ra, thay ngưỡng tạm bằng con số có evidence, hoặc đặt lại nhãn với ngày và sự kiện mới.",
        "",
        f"Tổng: {len(rows)} ngưỡng tạm ở {len({r[0] for r in rows})} item, {len(by_event)} sự kiện xem lại.",
        "",
        "## Theo sự kiện xem lại",
        "",
        "| Sự kiện xem lại | Số item | Item |",
        "|---|---|---|",
    ]
    for event, items in sorted(by_event.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        out.append(f"| {event} | {len(items)} | {', '.join(sorted(items))} |")
    out += ["", "## Theo item", "", "| Item | Section | Giá trị | Ngày đặt | Sự kiện xem lại |", "|---|---|---|---|---|"]
    for item, section, value, date, event in rows:
        out.append(f"| {item} | {section} | {value.replace('|', '/')} | {date} | {event} |")
    (SPEC / "_PROVISIONAL.md").write_text("\n".join(out) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(rows)} ngưỡng tạm, {len(by_event)} sự kiện")


if __name__ == "__main__":
    main()
