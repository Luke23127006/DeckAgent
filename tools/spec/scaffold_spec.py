"""Pha B, bước B3: sinh khung file spec từ dữ liệu Pha A và quyết định ở APPLY.md.

Đọc docs/specification/_migration/work/items/*.json và relations.json (do migrate_sheet.py
sinh ra), áp các quyết định của bước B2 (khai báo ở đầu file), rồi ghi một file cho mỗi item
vào docs/specification/0X-*/: frontmatter theo _TEMPLATE.md, quan hệ chỉ ở phía nguồn (GX-05),
và đủ heading theo section_order của schema.json. Thân section để trống; B4 viết nội dung.

Chạy: python tools/spec/scaffold_spec.py [--force]
Không ghi đè file đã có, trừ khi có --force.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = ROOT / "docs" / "specification"
WORK = SPEC / "_migration" / "work"

TYPE_FILES = {
    "actor": "actors", "constraint": "constraints", "assumption": "assumptions",
    "use_case": "use-cases", "business_rule": "business-rules",
    "requirement": "requirements", "decision": "decisions",
}
PREFIX = {"ACT": "actor", "C": "constraint", "A": "assumption", "UC": "use_case",
          "BR": "business_rule", "R": "requirement", "D": "decision"}
ITEM_ID = re.compile(r"^(ACT|UC|BR|C|A|R|D)-\d{3,}$")
ACTOR_KIND = {"Primary": "human", "Secondary": "human", "External": "external-system"}

# --- Quyết định của B2 (APPLY.md) -------------------------------------------------------

# APPLY.md mục 5: 20 ID item bị xóa.
DELETED = {"A-001", "A-002", "A-003", "A-004", "A-005", "A-006",
           "D-001", "D-002", "D-003", "D-004", "D-005", "D-018", "D-023",
           "C-006", "C-007", "D-011", "D-010", "D-028", "R-041", "BR-005"}

# APPLY.md mục 1: status đổi so với sheet.
STATUS = {"R-026": "Proposed", "R-028": "Proposed", "R-010": "Draft",
          "C-003": "Retired", "D-026": "Superseded", "A-023": "Retired"}

# Mã loại cũ bỏ khỏi source (BLK-062); nếu source rỗng thì thay bằng Decision tương ứng.
LEGACY_SOURCE = {"L-001": "D-024", "L-002": "D-025", "W-026": "D-025"}

# Quan hệ bỏ theo quyết định cụ thể (ngoài các luật chung trong drop_reason()).
DROP_PAIRS = {
    ("R-042", "use_cases", "UC-018"): "BLK-028",
    ("R-030", "business_rules", "BR-013"): "BLK-019 (chuyển sang R-057)",
}

# Quan hệ thêm (APPLY.md mục 6 và mục 7).
ADD = [
    ("D-015", "constraints", "C-002", "BLK-020"),
    ("R-011", "business_rules", "BR-010", "BLK-033"),
    ("R-024", "business_rules", "BR-010", "BLK-033"),
    ("R-046", "business_rules", "BR-010", "BLK-033"),
    ("UC-007", "supporting_actors", "ACT-002", "BLK-022"),
    ("D-026", "superseded_by", "D-031", "Q1"),
    ("R-032", "business_rules", "BR-010", "CX-1 (thay BR-005)"),
    ("BR-010", "use_cases", "UC-014", "CX-1"),
] + [(i, "source", "D-031", "Q1") for i in
     ("R-020", "R-025", "R-026", "R-027", "R-028", "R-039", "UC-008")]

# Quan hệ trỏ tới BR-005 chuyển sang BR-010 (CX-1).
REDIRECT = {"BR-005": "BR-010"}

# APPLY.md mục 4: ID mới.
NEW_ITEMS = {
    "R-055": {"from": "R-014", "short_name": "Thay hình ảnh trong slide", "status": "Proposed",
              "scope": "Later", "type": "Functional", "area": ["Editing", "Core"],
              "rel": {"use_cases": ["UC-024"], "depends_on": ["R-006"]}},
    "R-056": {"from": "R-018", "short_name": "Tìm hình minh họa có sẵn", "status": "Proposed",
              "scope": "Later", "type": "Functional", "area": ["Assets", "AI", "Data"],
              "rel": {"use_cases": ["UC-024"], "depends_on": ["R-006"]}},
    "R-057": {"from": "R-030", "short_name": "Thông báo lỗi kèm bước làm tiếp theo",
              "status": "Active", "scope": "V1", "type": "Quality",
              "area": ["Web", "AI", "Reliability"],
              "rel": {"use_cases": ["UC-001", "UC-002", "UC-004", "UC-014"],
                      "business_rules": ["BR-013"]}},
    "R-058": {"from": None, "short_name": "Đẩy deck lên Google Drive", "status": "Proposed",
              "scope": "Later", "type": "Functional", "area": ["Export"],
              "rel": {"source": ["D-031"], "use_cases": ["UC-008"]}},
    "D-031": {"from": None, "short_name": "Bốn định dạng tải về của V1", "status": "Active",
              "date": "2026-10-03", "decided_by": "Duy",
              "rel": {"source": ["D-026", "Benchmark Napkin AI 2026-10-03"],
                      "addresses": ["R-020", "R-025", "R-026", "R-027", "R-028"],
                      "shapes": ["BR-006", "BR-013", "R-058"], "assumptions": ["A-022"]}},
}

# --- Khung field theo _TEMPLATE.md ---------------------------------------------------------

FIELDS = {
    "actor": ["id", "name", "kind", "status", "source"],
    "constraint": ["id", "short_name", "type", "status", "imposed_by", "source"],
    "assumption": ["id", "short_name", "status", "source"],
    "use_case": ["id", "title", "status", "scope", "level", "source", "primary_actor",
                 "supporting_actors", "constraints", "include", "extend", "follows",
                 "split_from", "related", "superseded_by"],
    "business_rule": ["id", "short_name", "status", "scope", "source", "use_cases"],
    "requirement": ["id", "short_name", "type", "status", "scope", "verification", "inputs",
                    "area", "source", "use_cases", "business_rules", "constraints",
                    "assumptions", "depends_on"],
    "decision": ["id", "short_name", "status", "date", "decided_by", "source", "addresses",
                 "assumptions", "constraints", "shapes", "documents", "superseded_by"],
}
LIST_FIELDS = {"source", "supporting_actors", "constraints", "include", "extend", "follows",
               "split_from", "related", "superseded_by", "use_cases", "business_rules",
               "assumptions", "depends_on", "addresses", "shapes", "documents", "area"}


def type_of(id_):
    return PREFIX[id_.split("-")[0]]


def load():
    schema = json.loads((SPEC / "schema.json").read_text(encoding="utf-8"))
    items = {}
    for t, f in TYPE_FILES.items():
        for it in json.loads((WORK / "items" / f"{f}.json").read_text(encoding="utf-8")):
            items[it["ID"]] = it
    rels = json.loads((WORK / "relations.json").read_text(encoding="utf-8"))
    return schema, items, rels


def status_of(id_, items):
    if id_ in STATUS:
        return STATUS[id_]
    if id_ in NEW_ITEMS:
        return NEW_ITEMS[id_]["status"]
    if type_of(id_) == "actor":
        return "Active"
    return items[id_]["Status"]


def readiness(schema, id_, status):
    for s in schema["item_types"][type_of(id_)]["statuses"]:
        if s["name"] == status:
            return s["readiness"], s["effective"]
    raise ValueError(f"{id_}: status lạ {status}")


def raw_source(item):
    """source lấy từ ô Căn cứ gốc, giữ cả phần mã sau ID (vd 'DOC-001 FR01')."""
    raw = item.get("Căn cứ") or ""
    out = []
    for tok in re.split(r"[,\n;]", raw):
        tok = tok.strip()
        if not tok:
            continue
        tok = re.sub(r"Benchmark (\d{2})/(\d{2})/(\d{4})", r"Benchmark \3-\2-\1", tok)  # GX-18
        out.append(tok)
    return out


def clean_source(id_, src, log):
    out, legacy = [], []
    for tok in src:
        head = tok.split()[0]
        if head in LEGACY_SOURCE:
            legacy.append(head)
            log.append((id_, "source", tok, "bỏ", "BLK-062"))
            continue
        if head in DELETED:
            log.append((id_, "source", tok, "bỏ", "item đã xóa (APPLY.md mục 5)"))
            continue
        out.append(tok)
    if not out and legacy:
        out = sorted({LEGACY_SOURCE[l] for l in legacy})
        log.append((id_, "source", ",".join(out), "thêm", "BLK-062 (source rỗng)"))
    return out


def build(schema, items, rels):
    """Trả về {id: {field: [targets]}} sau khi áp quyết định, và nhật ký thay đổi quan hệ."""
    out = defaultdict(lambda: defaultdict(list))
    log = []
    keep_ids = [i for i in items if i not in DELETED] + list(NEW_ITEMS)
    status = {i: status_of(i, items) for i in keep_ids}

    for r in rels:
        s, f, t = r["source"], r["field"], r["target"]
        if f == "source":
            continue  # source lấy từ ô Căn cứ gốc
        if s in DELETED:
            continue
        if t in REDIRECT:
            new_t = REDIRECT[t]
            log.append((s, f, t, f"chuyển sang {new_t}", "CX-1"))
            t = new_t
        if t in DELETED:
            log.append((s, f, t, "bỏ", "đích đã xóa (APPLY.md mục 5)"))
            continue
        if (s, f, t) in DROP_PAIRS:
            log.append((s, f, t, "bỏ", DROP_PAIRS[(s, f, t)]))
            continue
        if r["kind"] == "depends" and ITEM_ID.match(t):
            s_ready, _ = readiness(schema, s, status[s])
            t_ready, _ = readiness(schema, t, status[t])
            if t_ready == "closed" and s_ready != "closed":
                log.append((s, f, t, "bỏ", f"đích đã đóng ({status[t]}), GX-04 / P4"))
                continue
        if t not in out[s][f]:
            out[s][f].append(t)

    for s, f, t, why in ADD:
        if t not in out[s][f]:
            out[s][f].append(t)
            log.append((s, f, t, "thêm", why))

    for i in keep_ids:
        if i in NEW_ITEMS:
            continue
        out[i]["source"] = clean_source(i, raw_source(items[i]), log) + \
            [x for x in out[i]["source"] if x == "D-031"]

    for i, spec in NEW_ITEMS.items():
        for f, ts in spec["rel"].items():
            out[i][f] = list(ts)
        if spec["from"]:
            out[i]["source"] = [spec["from"]] + [
                x for x in out[spec["from"]]["source"] if x != spec["from"]]
    return out, log, status


def yaml_value(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, list):
        return "[" + ", ".join(f'"{x}"' if (" " in x or ":" in x) else x for x in v) + "]"
    if v is None or v == "":
        return '""'
    s = str(v)
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s) or ITEM_ID.match(s) or s in ("V1", "Later"):
        return s
    if re.match(r"^[A-Za-z][A-Za-z/-]*$", s):
        return s
    return '"' + s.replace('"', '\\"') + '"'


def fields_for(id_, items, rels, status, levels):
    t = type_of(id_)
    it = items.get(id_, {})
    new = NEW_ITEMS.get(id_, {})
    r = rels[id_]
    v = {"id": id_, "status": status[id_]}
    if t == "actor":
        v["name"] = it["Actor"]
        v["kind"] = ACTOR_KIND[it["Type"]]
    elif t == "constraint":
        v["short_name"] = ""
        v["type"] = it["Type"]
        v["imposed_by"] = ""
    elif t == "assumption":
        v["short_name"] = ""
    elif t == "use_case":
        v["title"] = it["Use Case"]
        v["scope"] = it["Release Scope"]
        v["level"] = levels.get(id_, "user-goal")
    elif t == "business_rule":
        v["short_name"] = it["Tên ngắn"]
        v["scope"] = it["Scope"]
    elif t == "requirement":
        v["short_name"] = new.get("short_name") or it["Tên ngắn"]
        v["type"] = new.get("type") or it["Type"]
        v["scope"] = new.get("scope") or it["Scope"]
        v["verification"] = "test"
        v["inputs"] = False
        area = new.get("area") or [a.strip() for a in (it.get("Area") or "").split(",") if a.strip()]
        mapped = []
        for a in area:
            a = "CI/Infra" if a in ("CI", "Infra") else a  # BLK-064
            if a != "Schedule" and a not in mapped:
                mapped.append(a)
        v["area"] = mapped
    elif t == "decision":
        v["short_name"] = new.get("short_name", "")
        v["date"] = new.get("date") or it.get("Date") or ""
        v["decided_by"] = new.get("decided_by") or it.get("Recorded By") or ""
    for f in FIELDS[t]:
        if f in LIST_FIELDS and f not in v:
            v[f] = list(r.get(f, []))
    if t == "use_case":
        v["primary_actor"] = (r.get("primary_actor") or [""])[0]
    if t == "decision" and not new:
        v["documents"] = list(r.get("documents", []))
    return v


def render(id_, v, schema):
    t = type_of(id_)
    lines = ["---"]
    for f in FIELDS[t]:
        lines.append(f"{f}: {yaml_value(v.get(f, ''))}")
    lines.append("---")
    body = []
    for h in schema["item_types"][t]["section_order"]:
        if t == "actor" and h == "Hành vi lỗi" and v["kind"] != "external-system":
            continue
        body.append(f"## {h}\n")
    return "\n".join(lines) + "\n\n" + "\n".join(body)


def main():
    force = "--force" in sys.argv
    schema, items, rels = load()
    out, log, status = build(schema, items, rels)
    levels = {"UC-014": "subfunction", "UC-015": "subfunction"}  # PLAN.md mục 3
    written = skipped = 0
    for id_ in list(status):
        t = type_of(id_)
        d = SPEC / schema["item_types"][t]["dir"]
        path = d / f"{id_}.md"
        if path.exists() and not force:
            skipped += 1
            continue
        v = fields_for(id_, items, out, status, levels)
        path.write_text(render(id_, v, schema), encoding="utf-8", newline="\n")
        written += 1
    lines = ["| Nguồn | Field | Đích hoặc giá trị | Thay đổi | Căn cứ |", "|---|---|---|---|---|"]
    lines += [f"| {a} | {b} | {c} | {d} | {e} |" for a, b, c, d, e in log]
    (WORK / "scaffold-relation-log.md").write_text(
        "# Quan hệ và source thay đổi khi sinh khung (B3)\n\n" + "\n".join(lines) + "\n",
        encoding="utf-8", newline="\n")
    print(f"ghi {written} file, bỏ qua {skipped}; {len(log)} thay đổi quan hệ/source")


if __name__ == "__main__":
    main()
