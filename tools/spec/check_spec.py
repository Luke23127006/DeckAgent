"""Script kiểm tạm các tiêu chí tầng CI của spec (chưa phải validator chính thức).

Kiểm trên docs/specification/0X-*/:
1. Frontmatter: field bắt buộc theo mức sẵn sàng, enum theo schema.json, id khớp tên file và mẫu ID,
   ID không nằm trong _RETIRED_IDS.md (GX-01, GX-02).
2. Section bắt buộc và thứ tự heading theo section_order (GX-06).
3. ID tham chiếu tồn tại và đúng loại mà field cho phép (GX-03).
4. Item Active chỉ dựa vào item còn hiệu lực (GX-04).
5. Không có field lạ hoặc quan hệ ghi hai lần ở hai phía (GX-05).
6. Item Active không chứa "Chưa chốt", "TBD", "định nghĩa sau" trong section quy định; nhãn [tạm phải
   đúng định dạng của _COMMON_CRITERIA.md mục 7 (GX-09).

Chỗ còn `<!-- điền sau: FILL_LATER -->` hoặc field bắt buộc rỗng có trong _FILL_LATER.md được liệt kê riêng,
không tính là lỗi.

Chạy: python tools/spec/check_spec.py [--report <file.md>]
Mã thoát 1 nếu còn lỗi.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "docs" / "specification"
PREFIX = {"ACT": "actor", "C": "constraint", "A": "assumption", "UC": "use_case",
          "BR": "business_rule", "R": "requirement", "D": "decision"}
ITEM_ID = re.compile(r"^(ACT|UC|BR|C|A|R|D)-\d{3,}$")
ORDER = ["draft", "proposed", "active", "closed"]
MARKER = "điền sau: FILL_LATER"
FORBIDDEN = re.compile(r"chưa chốt|\bTBD\b|định nghĩa sau", re.I)
LABEL_OK = re.compile(r"\[tạm \d{4}-\d{2}-\d{2} · xem lại: [^\]]+\]")
REGULATED = {"Yêu cầu", "Miền đầu vào", "Đo lường", "Acceptance", "Rule", "Bảng quyết định",
             "Bảng chuyển trạng thái", "Exceptions", "Main Flow", "Alternative / Failure Flows",
             "Postconditions", "Bảo đảm tối thiểu", "Constraint", "Cách kiểm tuân thủ",
             "Assumption", "Cách kiểm chứng", "Decision"}


def parse(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError("thiếu frontmatter")
    head, body = text[4:].split("\n---\n", 1)
    fm = {}
    for line in head.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        k, v = line.split(":", 1)
        v = v.split(" #")[0].strip()
        if v.startswith("["):
            fm[k] = [x.strip().strip('"') for x in v[1:-1].split(",") if x.strip()]
        elif v in ("true", "false"):
            fm[k] = v == "true"
        else:
            fm[k] = v.strip('"')
    sections, cur = [], None
    for line in body.splitlines():
        if line.startswith("## "):
            cur = [line[3:].strip(), []]
            sections.append(cur)
        elif cur is not None:
            cur[1].append(line)
    return fm, sections


def retired_ids():
    f = SPEC / "_RETIRED_IDS.md"
    if not f.exists():
        return set()
    return set(re.findall(r"^\| ((?:ACT|UC|BR|C|A|R|D)-\d{3,}) \|", f.read_text(encoding="utf-8"), re.M))


def fill_later_rows():
    f = SPEC / "_FILL_LATER.md"
    rows = set()
    if f.exists():
        for m in re.finditer(r"^\| ((?:ACT|UC|BR|C|A|R|D)-\d{3,}) \| [^|]+ \| `([a-z_]+)` \|",
                             f.read_text(encoding="utf-8"), re.M):
            rows.add((m.group(1), m.group(2)))
    return rows


def cond_true(cond, fm, values):
    if "all" in cond:
        return all(cond_true(c, fm, values) for c in cond["all"])
    v = fm.get(cond["field"])
    if "in" in cond:
        return v in cond["in"]
    if "group" in cond:
        return values.get(v, {}).get("group") == cond["group"]
    return False


def main():
    schema = json.loads((SPEC / "schema.json").read_text(encoding="utf-8"))
    retired = retired_ids()
    later = fill_later_rows()
    items, errors, deferred = {}, [], []

    def err(i, rule, msg):
        errors.append((i, rule, msg))

    for d in sorted(SPEC.glob("0*-*")):
        for f in sorted(d.glob("*.md")):
            if f.name.startswith("_"):
                continue
            try:
                fm, sections = parse(f)
            except ValueError as e:
                err(f.stem, "GX-02", str(e))
                continue
            items[f.stem] = (f, fm, sections)

    status_of = {}
    for i, (f, fm, _) in items.items():
        t = PREFIX.get(i.split("-")[0])
        ts = schema["item_types"].get(t) if t else None
        if not ts or not ITEM_ID.match(i):
            err(i, "GX-01", "tên file không phải ID item hợp lệ")
            continue
        st = next((s for s in ts["statuses"] if s["name"] == fm.get("status")), None)
        status_of[i] = st

    for i, (f, fm, sections) in items.items():
        t = PREFIX[i.split("-")[0]]
        ts = schema["item_types"][t]
        st = status_of.get(i)
        if fm.get("id") != i or not re.match(ts["id_pattern"], i):
            err(i, "GX-01", f"id `{fm.get('id')}` không khớp tên file hoặc mẫu ID")
        if i in retired:
            err(i, "GX-01", "ID nằm trong _RETIRED_IDS.md")
        if st is None:
            err(i, "GX-02", f"status lạ `{fm.get('status')}`")
            continue
        rd = st["readiness"]
        known = set(ts["fields"]) | set(ts["relations"])
        for k in fm:
            if k not in known:
                err(i, "GX-05", f"field lạ hoặc chiều ngược `{k}`")

        def needed(spec):
            if spec.get("required") is True:
                return True
            if rd == "closed":
                return False
            rf = spec.get("required_from")
            if rf and ORDER.index(rd) >= ORDER.index(rf):
                return True
            rw = spec.get("required_when")
            return bool(rw and cond_true(rw, fm, {}))

        for name, spec in {**ts["fields"], **ts["relations"]}.items():
            v = fm.get(name)
            if needed(spec) and (v is None or v == "" or v == []) and spec.get("type") != "boolean":
                (deferred if (i, name) in later else errors).append((i, "GX-02", f"field bắt buộc rỗng `{name}`"))
            if name not in fm and spec.get("type") == "boolean" and needed(spec):
                err(i, "GX-02", f"thiếu field `{name}`")
        for name, spec in ts["fields"].items():
            v = fm.get(name)
            if v in (None, "", []):
                continue
            if spec.get("type") == "enum":
                allowed = schema[spec["values_from"]] if "values_from" in spec else list(spec["values"])
                if v not in allowed:
                    err(i, "GX-02", f"`{name}: {v}` ngoài enum")
            if spec.get("type") == "enum_list":
                for x in v:
                    if x not in schema[spec["values_from"]]:
                        err(i, "GX-02", f"`{name}` có `{x}` ngoài enum")
            if spec.get("type") == "boolean" and not isinstance(v, bool):
                err(i, "GX-02", f"`{name}` không phải true/false")
            if spec.get("type") == "date" and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(v)):
                err(i, "GX-18", f"`{name}` không theo YYYY-MM-DD")

        # Quan hệ: tồn tại, đúng loại, GX-04
        for name, spec in ts["relations"].items():
            vals = fm.get(name, [])
            vals = [vals] if isinstance(vals, str) and vals else (vals or [])
            if spec.get("cardinality") == "one" and len(vals) > 1:
                err(i, "GX-03", f"`{name}` chỉ được một giá trị")
            for v in vals:
                head = v.split()[0]
                if not ITEM_ID.match(head):
                    if "any" not in spec["targets"] and "document" not in spec["targets"]:
                        err(i, "GX-03", f"`{name}` trỏ tới `{v}` không phải ID item")
                    continue
                if head not in items:
                    err(i, "GX-03", f"`{name}` trỏ tới `{head}` không tồn tại"
                        + (" (ID đã nghỉ)" if head in retired else ""))
                    continue
                tt = PREFIX[head.split("-")[0]]
                if "any" not in spec["targets"] and tt not in spec["targets"]:
                    err(i, "GX-03", f"`{name}` trỏ tới `{head}` sai loại ({tt})")
                if spec["kind"] == "depends" and rd == "active":
                    tst = status_of.get(head)
                    if tst and not tst["effective"]:
                        err(i, "GX-04", f"`{name}` dựa vào `{head}` ({tst['name']}) đã hết hiệu lực")

        # Section
        names = [s[0] for s in sections]
        order = ts["section_order"]
        for n in names:
            if n not in order:
                err(i, "GX-06", f"heading lạ `{n}`")
        idx = [order.index(n) for n in names if n in order]
        if idx != sorted(idx) or len(set(names)) != len(names):
            err(i, "GX-06", "heading sai thứ tự hoặc lặp")
        body = {s[0]: "\n".join(s[1]).strip() for s in sections}
        if rd != "closed":
            for req in ts["required_sections"]:
                if ORDER.index(rd) < ORDER.index(req["from"]):
                    continue
                if "when" in req and not cond_true(req["when"], fm, ts["fields"].get(req["when"].get("field", ""), {}).get("values", {})):
                    continue
                h = req["heading"]
                if h not in body:
                    err(i, "GX-06", f"thiếu section bắt buộc `{h}`")
                elif not re.sub(r"<!--.*?-->", "", body[h], flags=re.S).strip():
                    (deferred if MARKER in body[h] else errors).append(
                        (i, "GX-06", f"section bắt buộc `{h}` " + ("còn điền sau" if MARKER in body[h] else "trống")))
        for h, b in body.items():
            if not b:
                err(i, "GX-06", f"section `{h}` trống, không có marker điền sau")
            elif MARKER in b and not any(r[0] == i and h in r[2] for r in deferred):
                deferred.append((i, "điền sau", f"section `{h}`"))

        # GX-09 và nhãn ngưỡng tạm
        for h, b in body.items():
            for line in b.splitlines():
                if "[tạm" in line and len(LABEL_OK.findall(line)) != line.count("[tạm"):
                    err(i, "GX-09", f"nhãn ngưỡng tạm sai định dạng ở `{h}`")
                if rd == "active" and h in REGULATED and FORBIDDEN.search(re.sub(r"<!--.*?-->", "", line)):
                    err(i, "GX-09", f"`{h}` của item Active có chuỗi chưa chốt: {line.strip()[:90]}")
            if h == "Đo lường" and MARKER not in b:
                for key in ("Scale", "Meter", "Ngưỡng đạt"):
                    if key not in b:
                        err(i, "GR-09", f"`Đo lường` thiếu dòng {key}")

    # GX-05: cùng quan hệ ghi ở hai phía
    def rel(i, f):
        v = items[i][1].get(f, [])
        return v if isinstance(v, list) else [v]
    for i in items:
        if not i.startswith("UC-"):
            continue
        for j in rel(i, "related"):
            if j in items and i in rel(j, "related") and i < j:
                err(i, "GX-05", f"`related` {i} ↔ {j} ghi ở cả hai phía")
            if j in items and (i in rel(j, "include") or i in rel(j, "extend")):
                err(i, "GX-05", f"`related: {j}` là chiều ngược của `include`/`extend` ở {j}")

    lines = ["# Kết quả kiểm tạm tầng CI", "", f"- Item: {len(items)}", f"- Lỗi: {len(errors)}",
             f"- Điền sau (liệt kê riêng, không tính lỗi): {len(deferred)}", "", "## Lỗi", "",
             "| Item | Tiêu chí | Chi tiết |", "|---|---|---|"]
    lines += [f"| {a} | {b} | {c} |" for a, b, c in sorted(errors)]
    lines += ["", "## Điền sau", "", "| Item | Loại | Chi tiết |", "|---|---|---|"]
    lines += [f"| {a} | {b} | {c} |" for a, b, c in sorted(deferred)]
    report = "\n".join(lines) + "\n"
    if "--report" in sys.argv:
        Path(sys.argv[sys.argv.index("--report") + 1]).write_text(report, encoding="utf-8", newline="\n")
    print(f"{len(items)} item, {len(errors)} lỗi, {len(deferred)} điền sau")
    for e in sorted(errors):
        print(" ", *e)
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
