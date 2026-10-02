"""Pha A của việc migrate Project Hub (Google Sheet export) sang docs/specification/.

Script chỉ đọc file xlsx và ghi vào docs/specification/_migration/work/:
- items/<loại>.json: mỗi item một object, key là tên cột gốc (thêm `_row` = số hàng trong sheet);
- relations.json: quan hệ sau khi lật chiều theo hợp đồng quan hệ (_COMMON_CRITERIA.md mục 2);
- inventory.md, relations-report.md, legacy-refs.json: báo cáo cơ học cho PLAN.md.

Phần cần phán đoán (product/project, đánh giá nội dung, dịch thử) không làm ở đây.

Chạy: python tools/spec/migrate_sheet.py
"""

from __future__ import annotations

import datetime as dt
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "trash" / "old_sheet" / "Project Hub - DeckAgent (2).xlsx"
SPEC = ROOT / "docs" / "specification"
WORK = SPEC / "_migration" / "work"

# loại item -> (tab, mẫu ID, khóa trong schema.json)
TYPES = {
    "actors": ("Actors", r"ACT-\d{3,}", "actor"),
    "constraints": ("Constraints", r"C-\d{3,}", "constraint"),
    "assumptions": ("Assumptions", r"A-\d{3,}", "assumption"),
    "use-cases": ("Use Cases", r"UC-\d{3,}", "use_case"),
    "business-rules": ("Business Rules", r"BR-\d{3,}", "business_rule"),
    "requirements": ("Requirements", r"R-\d{3,}", "requirement"),
    "decisions": ("Decisions", r"D-\d{3,}", "decision"),
}
GLOSSARY_TAB = "Operating Rules"
PREFIX_TYPE = {"ACT": "actors", "C": "constraints", "A": "assumptions", "UC": "use-cases",
               "BR": "business-rules", "R": "requirements", "D": "decisions"}
# Tiền tố của loại không còn tồn tại sau migrate (yêu cầu A4) và của tab không migrate
LEGACY_PREFIXES = ["W", "L", "RK", "B", "SP"]
OTHER_UNMIGRATED = ["OR", "WR", "GL", "DOC"]

ID_RE = re.compile(r"(?<![A-Za-z0-9])(ACT|UC|BR|DOC|RK|SP|OR|WR|GL|[CARDWLB])-(\d{3,})(?!\d)")

ACTOR_KIND = {"Primary": "human", "Secondary": "human", "External": "external-system",
              "System": "external-system"}

# Cột bị bỏ theo bảng ánh xạ (tab -> cột)
DROPPED = {
    "Constraints": ["Impacts"],
    "Assumptions": ["Impacts", "Related Work (IDs)"],
    "Use Cases": ["Related Work"],
    "Requirements": ["Related Work (IDs)", "Related Tests"],
    "Decisions": ["Related Work"],
}
# Cột không ghi vào spec nhưng được dùng để suy ra hoặc đối chiếu
NOT_WRITTEN = {"Actors": ["Related Use Cases"]}

UC_FORWARD = {"Include": "include", "Extend": "extend", "Trước đó": "follows",
              "Tách từ": "split_from", "Superseded by": "superseded_by",
              "Liên quan": "related", "Dẫn tới": "related", "Phân biệt với": "related"}
# nhãn chiều ngược -> nhãn chiều xuôi tương ứng ở UC kia
UC_REVERSE = {"Được include bởi": "Include", "Extend bởi": "Extend", "Tiếp theo": "Trước đó",
              "Tách ra": "Tách từ"}


def cell_text(v):
    if v is None:
        return None
    if isinstance(v, dt.datetime):
        return v.date().isoformat()
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    s = str(v).strip()
    return s or None


def ids_in(text):
    return [f"{m.group(1)}-{m.group(2)}" for m in ID_RE.finditer(text or "")]


def prefix(id_):
    return id_.rsplit("-", 1)[0]


def load_schema():
    return json.loads((SPEC / "schema.json").read_text(encoding="utf-8"))


def read_tab(wb, tab):
    ws = wb[tab]
    header = [cell_text(c.value) for c in ws[2]]
    rows = []
    for r_idx, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
        first = cell_text(row[0]) if row else None
        if not first:
            continue
        obj = {"_row": r_idx}
        for h, v in zip(header, row):
            if h:
                obj[h] = cell_text(v)
        rows.append(obj)
    return header, rows


def export_items(wb):
    items, row_check, non_id_rows = {}, {}, {}
    for key, (tab, pat, _) in TYPES.items():
        _, rows = read_tab(wb, tab)
        rx = re.compile(rf"^{pat}$")
        kept = [r for r in rows if rx.match(r.get("ID") or "")]
        non_id_rows[tab] = [r.get("ID") for r in rows if not rx.match(r.get("ID") or "")]
        items[key] = kept
        row_check[tab] = (len(rows), len(kept))
    _, rows = read_tab(wb, GLOSSARY_TAB)
    items["glossary"] = [r for r in rows if re.match(r"^GL-\d{3,}$", r["Rule ID"])]
    gl_out = []
    for r in items["glossary"]:
        bad = r.get("Ví dụ chưa đạt") or ""
        m = re.search(r"Không dùng\s*:\s*(.*)", bad, re.S)
        gl_out.append({**r, "_term": r.get("Nhóm"), "_definition": r.get("Ý nghĩa / Cách hiểu"),
                       "_not_use": m.group(1).strip() if m else None})
    items["glossary"] = gl_out
    row_check[GLOSSARY_TAB + " (GL-)"] = (None, len(gl_out))
    return items, row_check, non_id_rows


def status_of(item, key):
    return "Active" if key == "actors" else item.get("Status")


def status_info(schema, key):
    st = schema["item_types"][TYPES[key][2]]["statuses"]
    return {s["name"]: s for s in st}


def inventory(items, schema, row_check, non_id_rows):
    lines = ["# Kiểm kê (sinh bởi tools/spec/migrate_sheet.py)", ""]
    lines += ["## Số item theo loại × status", "", "| Loại | Tab | Status | Số item |", "|---|---|---|---|"]
    for key, (tab, _, _) in TYPES.items():
        c = Counter(status_of(i, key) or "(trống)" for i in items[key])
        for s, n in sorted(c.items()):
            lines.append(f"| {key} | {tab} | {s} | {n} |")
        lines.append(f"| **{key}** | | **Tổng** | **{len(items[key])}** |")
    lines.append(f"| **glossary** | {GLOSSARY_TAB} | GL-xxx | **{len(items['glossary'])}** |")

    lines += ["", "## Đối chiếu số hàng", "",
              "| Tab | Hàng có giá trị ở cột ID | Hàng khớp mẫu ID (= item) | Hàng bị bỏ (không phải ID) |", "|---|---|---|---|"]
    for tab, (all_n, kept) in row_check.items():
        dropped = ", ".join(non_id_rows.get(tab, [])) or "—"
        lines.append(f"| {tab} | {all_n if all_n is not None else '—'} | {kept} | {dropped} |")

    dup = []
    for key in list(TYPES) + ["glossary"]:
        idk = "Rule ID" if key == "glossary" else "ID"
        c = Counter(i[idk] for i in items[key])
        dup += [f"{k} ×{v}" for k, v in c.items() if v > 1]
    lines += ["", f"ID trùng: {', '.join(dup) or 'không có'}"]

    # ID trống giữa dãy (ứng viên "ID đã nghỉ" từ trước, chỉ để tham khảo)
    lines += ["", "## Khoảng trống trong dãy ID", ""]
    for key in TYPES:
        nums = sorted(int(i["ID"].rsplit("-", 1)[1]) for i in items[key])
        gaps = [n for n in range(1, nums[-1] + 1) if n not in set(nums)] if nums else []
        pre = prefix(items[key][0]["ID"]) if items[key] else ""
        lines.append(f"- {key}: max {pre}-{nums[-1]:03d}" + (f"; trống: {', '.join(f'{pre}-{n:03d}' for n in gaps)}" if gaps else "; không trống"))

    anomalies = enum_anomalies(items, schema)
    lines += ["", "## Giá trị không có trong enum của schema.json", "",
              "| Loại | ID | Cột | Giá trị | Ghi chú |", "|---|---|---|---|---|"]
    lines += [f"| {a['type']} | {a['id']} | {a['column']} | {a['value']} | {a['note']} |" for a in anomalies] or ["| — | — | — | — | không có |"]
    return "\n".join(lines) + "\n", anomalies


def enum_anomalies(items, schema):
    out = []
    it = schema["item_types"]
    scopes, areas = set(schema["scope"]), set(schema["area"])

    def add(t, i, col, val, note):
        out.append({"type": t, "id": i["ID"], "column": col, "value": val, "note": note})

    for key in TYPES:
        sch = it[TYPES[key][2]]
        valid = {s["name"] for s in sch["statuses"]}
        for i in items[key]:
            if key != "actors" and i.get("Status") not in valid:
                add(key, i, "Status", i.get("Status"), "status không có trong schema")
            for col in ("Scope", "Release Scope"):
                if col in i and i[col] not in scopes:
                    add(key, i, col, i[col], "scope không có trong schema")
    for i in items["actors"]:
        if i.get("Type") not in ACTOR_KIND:
            add("actors", i, "Type", i.get("Type"), "không ánh xạ được sang kind")
    for key, col in (("constraints", "Type"), ("requirements", "Type")):
        valid = set(it[TYPES[key][2]]["fields"]["type"]["values"])
        for i in items[key]:
            if i.get(col) not in valid:
                add(key, i, col, i.get(col), "type không có trong schema" + (" → blocker DOI_LOAI" if i.get(col) == "Constraint" else ""))
    for i in items["requirements"]:
        for tok in split_list(i.get("Area")):
            if tok not in areas:
                add("requirements", i, "Area", tok, "area không có trong schema")
    for i in items["decisions"]:
        d = i.get("Date")
        if d and not re.match(r"^\d{4}-\d{2}-\d{2}$", d):
            add("decisions", i, "Date", d, "không đổi được sang YYYY-MM-DD")
    return out


def split_list(s):
    return [t.strip() for t in re.split(r"[,\n;]", s or "") if t.strip()]


# ---------------------------------------------------------------- quan hệ

def build_relations(items, schema):
    by_id = {}
    for key in TYPES:
        for i in items[key]:
            by_id[i["ID"]] = (key, i)
    rels, raw_pairs, issues = [], 0, defaultdict(list)
    rel_kind = {}
    for t, sch in schema["item_types"].items():
        for f, spec in sch["relations"].items():
            rel_kind[(t, f)] = spec["kind"]
    allowed = {}
    for t, sch in schema["item_types"].items():
        for f, spec in sch["relations"].items():
            allowed[(t, f)] = spec["targets"]
    key_of_schema = {v[2]: k for k, v in TYPES.items()}

    def add(src, field, dst, column, via, note=None):
        skey = by_id[src][0]
        rel = {"source": src, "field": field, "target": dst,
               "kind": rel_kind.get((TYPES[skey][2], field)), "column": column, "via": via}
        if note:
            rel["note"] = note
        rels.append(rel)

    def target_ok(src_key, field, dst):
        p = prefix(dst)
        targets = allowed[(TYPES[src_key][2], field)]
        if "any" in targets or "document" in targets:
            return True
        return PREFIX_TYPE.get(p) in {key_of_schema[t] for t in targets}

    def handle(src, field, dst, column, via, note=None):
        """Ghi quan hệ src.field -> dst sau khi kiểm tồn tại và đúng loại."""
        skey = by_id[src][0]
        p = prefix(dst)
        if field in ("source", "documents"):
            if p in PREFIX_TYPE and dst not in by_id:
                issues["broken"].append((src, column, dst, "ID không tồn tại"))
            add(src, field, dst, column, via, note)
            return
        if not target_ok(skey, field, dst):
            issues["wrong_type"].append((src, column, dst, f"field `{field}` không nhận loại {p}"))
            return
        if dst not in by_id:
            issues["broken"].append((src, column, dst, "ID không tồn tại"))
            return
        add(src, field, dst, column, via, note)

    def cell_ids(i, col):
        nonlocal raw_pairs
        ids = ids_in(i.get(col))
        raw_pairs += len(ids)
        return ids

    # source của mọi loại
    for key, (tab, _, _) in TYPES.items():
        for i in items[key]:
            for d in cell_ids(i, "Căn cứ"):
                handle(i["ID"], "source", d, f"{tab}.Căn cứ", "direct")

    # Actors.Related Use Cases: không ghi; dùng để đối chiếu và suy ra supporting_actors
    actor_ucs = {}
    for a in items["actors"]:
        actor_ucs[a["ID"]] = cell_ids(a, "Related Use Cases")

    # Use Cases
    uc_forward = defaultdict(lambda: defaultdict(set))   # uc -> label -> {ids}
    uc_reverse = defaultdict(lambda: defaultdict(set))
    unknown_labels = []
    for u in items["use-cases"]:
        uid = u["ID"]
        pa = cell_ids(u, "Primary Actor")
        if len(pa) != 1:
            issues["primary_actor"].append((uid, "Use Cases.Primary Actor", ", ".join(pa) or "(trống)", "cần đúng một actor"))
        for a in pa:
            handle(uid, "primary_actor", a, "Use Cases.Primary Actor", "direct")
        for c in cell_ids(u, "Related Constraints"):
            handle(uid, "constraints", c, "Use Cases.Related Constraints", "direct")
        for r in cell_ids(u, "Related Requirements"):
            if r in by_id and by_id[r][0] == "requirements":
                handle(r, "use_cases", uid, "Use Cases.Related Requirements", "flipped")
            else:
                issues["broken" if r not in by_id else "wrong_type"].append((uid, "Use Cases.Related Requirements", r, "ID không tồn tại" if r not in by_id else "không phải Requirement"))
        for line in (u.get("Quan hệ UC") or "").splitlines():
            line = re.sub(r"^\s*\d+\.\s*", "", line).strip()
            if not line or ":" not in line:
                continue
            label, rest = line.split(":", 1)
            label = re.sub(r"\s*\(.*\)$", "", label.strip())
            # ID trong ngoặc là lời giải thích, không phải đích quan hệ
            ids = ids_in(re.sub(r"\([^)]*\)", "", rest))
            note = rest.strip()
            if label in UC_FORWARD:
                for d in ids:
                    uc_forward[uid][label].add(d)
                    handle(uid, UC_FORWARD[label], d, f"Use Cases.Quan hệ UC ({label})", "direct",
                           note=note if "(" in note or label in ("Dẫn tới", "Phân biệt với") else None)
            elif label in UC_REVERSE:
                for d in ids:
                    uc_reverse[uid][label].add(d)
            else:
                unknown_labels.append((uid, label))
            raw_pairs += len(ids)

    # Actors -> supporting_actors và đối chiếu primary
    uc_primary = {u["ID"]: (ids_in(u.get("Primary Actor")) or [None])[0] for u in items["use-cases"]}
    for aid, ucs in actor_ucs.items():
        for uc in ucs:
            if uc not in by_id:
                issues["broken"].append((aid, "Actors.Related Use Cases", uc, "ID không tồn tại"))
            elif uc_primary.get(uc) != aid:
                handle(uc, "supporting_actors", aid, "Actors.Related Use Cases", "derived")
    for uc, pa in uc_primary.items():
        if pa and pa in actor_ucs and uc not in actor_ucs[pa]:
            issues["conflict"].append({"kind": "actor-primary", "a": uc, "b": pa,
                                       "detail": f"{uc} ghi Primary Actor = {pa}, nhưng Related Use Cases của {pa} không có {uc}"})

    # Đối chiếu hai chiều Quan hệ UC
    for uid, labels in uc_reverse.items():
        for rlabel, srcs in labels.items():
            flabel = UC_REVERSE[rlabel]
            for s in srcs:
                if uid not in uc_forward.get(s, {}).get(flabel, set()):
                    issues["conflict"].append({"kind": "uc-uc", "a": uid, "b": s,
                                               "detail": f"{uid} ghi '{rlabel}: {s}', nhưng {s} không ghi '{flabel}: {uid}'"})
    rev_map = {v: k for k, v in UC_REVERSE.items()}
    for uid, labels in uc_forward.items():
        for flabel, dsts in labels.items():
            if flabel not in rev_map:
                continue
            for d in dsts:
                if d in by_id and uid not in uc_reverse.get(d, {}).get(rev_map[flabel], set()):
                    issues["conflict"].append({"kind": "uc-uc", "a": uid, "b": d,
                                               "detail": f"{uid} ghi '{flabel}: {d}', nhưng {d} không ghi '{rev_map[flabel]}: {uid}'"})

    # Business Rules (gộp với UC.Related Business Rules)
    uc_br = defaultdict(set)
    for u in items["use-cases"]:
        for b in cell_ids(u, "Related Business Rules"):
            uc_br[b].add(u["ID"])
    for b in items["business-rules"]:
        bid = b["ID"]
        own = set(cell_ids(b, "Related Use Cases"))
        for uc in sorted(own | uc_br.get(bid, set())):
            via = "direct" if uc in own else "flipped"
            col = "Business Rules.Related Use Cases" if uc in own else "Use Cases.Related Business Rules"
            handle(bid, "use_cases", uc, col, via)
        for uc in sorted(own - uc_br.get(bid, set())):
            if uc in by_id:
                issues["conflict"].append({"kind": "br-uc", "a": bid, "b": uc,
                                           "detail": f"{bid}.Related Use Cases có {uc}, nhưng {uc}.Related Business Rules không có {bid}"})
        for uc in sorted(uc_br.get(bid, set()) - own):
            issues["conflict"].append({"kind": "br-uc", "a": bid, "b": uc,
                                       "detail": f"{uc}.Related Business Rules có {bid}, nhưng {bid}.Related Use Cases không có {uc}"})
        for r in cell_ids(b, "Related Requirements"):
            flip(handle, by_id, issues, bid, r, "requirements", "business_rules", "Business Rules.Related Requirements")
        for d in cell_ids(b, "Related Decisions"):
            flip(handle, by_id, issues, bid, d, "decisions", "shapes", "Business Rules.Related Decisions")
    for b in uc_br:
        if b not in by_id:
            for uc in uc_br[b]:
                issues["broken"].append((uc, "Use Cases.Related Business Rules", b, "ID không tồn tại"))

    # Constraints
    for c in items["constraints"]:
        for r in cell_ids(c, "Related Requirements"):
            flip(handle, by_id, issues, c["ID"], r, "requirements", "constraints", "Constraints.Related Requirements")
        for d in cell_ids(c, "Related Decisions"):
            flip(handle, by_id, issues, c["ID"], d, "decisions", "constraints", "Constraints.Related Decisions")

    # Assumptions.Used By -> R.assumptions / D.assumptions; đối chiếu với D.Assumption chính
    a_used_by_d = defaultdict(set)
    for a in items["assumptions"]:
        for x in cell_ids(a, "Used By (IDs)"):
            p = prefix(x)
            if p == "R":
                flip(handle, by_id, issues, a["ID"], x, "requirements", "assumptions", "Assumptions.Used By (IDs)")
            elif p == "D":
                a_used_by_d[x].add(a["ID"])
                if x not in by_id:
                    issues["broken"].append((a["ID"], "Assumptions.Used By (IDs)", x, "ID không tồn tại"))
            else:
                issues["used_by_other"].append((a["ID"], "Assumptions.Used By (IDs)", x, f"tiền tố {p}: không phải R/D, bị bỏ"))

    # Requirements
    for r in items["requirements"]:
        for d in cell_ids(r, "Depends On (IDs)"):
            handle(r["ID"], "depends_on", d, "Requirements.Depends On (IDs)", "direct")

    # Decisions
    for d in items["decisions"]:
        did = d["ID"]
        for r in cell_ids(d, "Requirement chính"):
            handle(did, "addresses", r, "Decisions.Requirement chính", "direct", note="cần duyệt: addresses hay shapes")
        own_a = set(cell_ids(d, "Assumption chính"))
        for a in sorted(own_a | a_used_by_d.get(did, set())):
            via = "direct" if a in own_a else "flipped"
            col = "Decisions.Assumption chính" if a in own_a else "Assumptions.Used By (IDs)"
            handle(did, "assumptions", a, col, via)
        for a in sorted(own_a - a_used_by_d.get(did, set())):
            if a in by_id:
                issues["conflict"].append({"kind": "d-a", "a": did, "b": a,
                                           "detail": f"{did}.Assumption chính có {a}, nhưng {a}.Used By không có {did}"})
        for a in sorted(a_used_by_d.get(did, set()) - own_a):
            issues["conflict"].append({"kind": "d-a", "a": did, "b": a,
                                       "detail": f"{a}.Used By có {did}, nhưng {did}.Assumption chính không có {a}"})
        for doc in cell_ids(d, "Detailed Doc"):
            handle(did, "documents", doc, "Decisions.Detailed Doc", "direct")

    # Khử trùng lặp (cùng source, field, target) và giữ cột gốc đầu tiên
    seen, dedup = {}, []
    for r in rels:
        k = (r["source"], r["field"], r["target"])
        if k in seen:
            seen[k]["column"] += f"; {r['column']}"
            continue
        seen[k] = r
        dedup.append(r)
    return dedup, raw_pairs, issues, unknown_labels, by_id


def flip(handle, by_id, issues, orig, target, want_key, field, column):
    """Quan hệ đang nằm ở `orig`, phải ghi ở `target`.field -> orig."""
    if target not in by_id:
        issues["broken"].append((orig, column, target, "ID không tồn tại"))
    elif by_id[target][0] != want_key:
        issues["wrong_type"].append((orig, column, target, f"không phải {want_key}"))
    else:
        handle(target, field, orig, column, "flipped")


def uc_levels(rels, items):
    inc = defaultdict(set)
    for r in rels:
        if r["field"] == "include":
            inc[r["target"]].add(r["source"])
    return {u["ID"]: ("subfunction" if len(inc[u["ID"]]) >= 2 else "user-goal", sorted(inc[u["ID"]]))
            for u in items["use-cases"]}


def gx04(rels, by_id, schema):
    out, closed_targets = [], []
    for r in rels:
        if r["kind"] not in ("depends", "applies"):
            continue
        skey, s = by_id[r["source"]]
        tkey, t = by_id[r["target"]]
        sst = status_info(schema, skey).get(status_of(s, skey))
        tst = status_info(schema, tkey).get(status_of(t, tkey))
        if not sst or not tst:
            continue
        if r["kind"] == "depends" and sst["readiness"] == "active" and sst["effective"] and not tst["effective"]:
            out.append((r, status_of(s, skey), status_of(t, tkey)))
        if r["kind"] == "applies" and tst["readiness"] == "closed":
            closed_targets.append((r, status_of(s, skey), status_of(t, tkey)))
    return out, closed_targets


def dropped_report(wb):
    out = []
    for tab, cols in list(DROPPED.items()) + list(NOT_WRITTEN.items()):
        _, rows = read_tab(wb, tab)
        pat = re.compile(rf"^{next(v[1] for v in TYPES.values() if v[0] == tab)}$")
        rows = [r for r in rows if pat.match(r.get("ID") or "")]
        for c in cols:
            n = sum(1 for r in rows if r.get(c))
            out.append((tab, c, n, "không ghi, dùng để suy ra/đối chiếu" if tab in NOT_WRITTEN else "bỏ"))
    return out


def legacy_refs(items):
    """Tham chiếu tới loại không còn tồn tại, trong các cột được giữ lại (cột bị bỏ không tính)."""
    out = []
    for key in list(TYPES) + ["glossary"]:
        idk = "Rule ID" if key == "glossary" else "ID"
        skip = set(DROPPED.get(TYPES[key][0], [])) if key in TYPES else set()
        for i in items[key]:
            for col, val in i.items():
                if col.startswith("_") or col in ("ID", "Rule ID") or col in skip or not val:
                    continue
                for m in ID_RE.finditer(val):
                    p = m.group(1)
                    if p in LEGACY_PREFIXES or p in ("OR", "WR"):
                        s = max(0, m.start() - 60)
                        out.append({"item": i[idk], "type": key, "column": col, "ref": m.group(0),
                                    "category": "loại cũ" if p in LEGACY_PREFIXES else "rule không migrate",
                                    "context": val[s:m.end() + 60].replace("\n", " ")})
    return out


def relations_report(rels, raw_pairs, issues, unknown_labels, levels, gx, closed, dropped, by_id):
    L = ["# Báo cáo quan hệ (sinh bởi tools/spec/migrate_sheet.py)", ""]
    L += [f"- Cặp (ô, ID) trong các cột quan hệ của sheet (trước khi lật, gồm cả cột chiều ngược và `Căn cứ`): **{raw_pairs}**",
          f"- Quan hệ sau khi lật và khử trùng (trong relations.json): **{len(rels)}**"]
    c = Counter((r["field"], r["via"]) for r in rels)
    L += ["", "| Field | direct | flipped | derived |", "|---|---|---|---|"]
    for f in sorted({k[0] for k in c}):
        L.append(f"| {f} | {c[(f,'direct')]} | {c[(f,'flipped')]} | {c[(f,'derived')]} |")

    L += ["", f"## Mâu thuẫn hai đầu ({len(issues['conflict'])})", "", "| Loại | Item A | Item B | Chi tiết |", "|---|---|---|---|"]
    L += [f"| {x['kind']} | {x['a']} | {x['b']} | {x['detail']} |" for x in issues["conflict"]] or ["| — | | | không có |"]

    L += ["", f"## Tham chiếu gãy ({len(issues['broken'])})", "", "| Item | Cột | ID trỏ tới | Lý do |", "|---|---|---|---|"]
    L += [f"| {a} | {b} | {c_} | {d} |" for a, b, c_, d in issues["broken"]] or ["| — | | | không có |"]
    L += ["", f"## Sai loại đích ({len(issues['wrong_type'])})", "", "| Item | Cột | ID | Lý do |", "|---|---|---|---|"]
    L += [f"| {a} | {b} | {c_} | {d} |" for a, b, c_, d in issues["wrong_type"]] or ["| — | | | không có |"]
    L += ["", f"## Used By trỏ tới loại khác R/D ({len(issues['used_by_other'])})", ""]
    L += [f"- {a}: {c_} ({d})" for a, b, c_, d in issues["used_by_other"]] or ["- không có"]
    L += ["", f"## Primary Actor không đúng một ({len(issues['primary_actor'])})", ""]
    L += [f"- {a}: {c_}" for a, b, c_, d in issues["primary_actor"]] or ["- không có"]
    L += ["", "## Nhãn Quan hệ UC không nhận ra", ""]
    L += [f"- {u}: {l}" for u, l in unknown_labels] or ["- không có"]

    L += ["", f"## GX-04: item Active dựa vào item hết hiệu lực ({len(gx)})", "",
          "| Nguồn (status) | Field | Đích (status) | Cột gốc |", "|---|---|---|---|"]
    L += [f"| {r['source']} ({s}) | {r['field']} | {r['target']} ({t}) | {r['column']} |" for r, s, t in gx] or ["| — | | | không có |"]
    L += ["", f"## Áp lên item đã Closed (Lint cảnh báo) ({len(closed)})", "",
          "| Nguồn (status) | Field | Đích (status) |", "|---|---|---|"]
    L += [f"| {r['source']} ({s}) | {r['field']} | {r['target']} ({t}) |" for r, s, t in closed] or ["| — | | không có |"]

    L += ["", "## Level của Use Case (từ `Include` của UC khác)", "", "| UC | level | Được include bởi |", "|---|---|---|"]
    L += [f"| {u} | {lv} | {', '.join(by) or '—'} |" for u, (lv, by) in levels.items()]

    L += ["", "## Cột bị bỏ", "", "| Tab | Cột | Số ô có dữ liệu | Xử lý |", "|---|---|---|---|"]
    L += [f"| {t} | {c_} | {n} | {x} |" for t, c_, n, x in dropped]
    return "\n".join(L) + "\n"


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def write_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def main():
    schema = load_schema()
    wb = openpyxl.load_workbook(XLSX, read_only=False, data_only=True)
    items, row_check, non_id_rows = export_items(wb)
    for key, rows in items.items():
        write_json(WORK / "items" / f"{key}.json", rows)

    inv, anomalies = inventory(items, schema, row_check, non_id_rows)
    write_text(WORK / "inventory.md", inv)
    write_json(WORK / "enum-anomalies.json", anomalies)

    rels, raw_pairs, issues, unknown_labels, by_id = build_relations(items, schema)
    levels = uc_levels(rels, items)
    gx, closed = gx04(rels, by_id, schema)
    write_json(WORK / "relations.json", rels)
    write_json(WORK / "relation-issues.json", {
        "conflicts": issues["conflict"],
        "broken": [dict(zip(("item", "column", "ref", "reason"), x)) for x in issues["broken"]],
        "wrong_type": [dict(zip(("item", "column", "ref", "reason"), x)) for x in issues["wrong_type"]],
        "used_by_other": [dict(zip(("item", "column", "ref", "reason"), x)) for x in issues["used_by_other"]],
        "gx04": [{**r, "source_status": s, "target_status": t} for r, s, t in gx],
        "applies_to_closed": [{**r, "source_status": s, "target_status": t} for r, s, t in closed],
        "uc_levels": {u: {"level": lv, "included_by": by} for u, (lv, by) in levels.items()},
        "actor_kind": {a["ID"]: ACTOR_KIND.get(a.get("Type")) for a in items["actors"]},
    })
    write_text(WORK / "relations-report.md",
               relations_report(rels, raw_pairs, issues, unknown_labels, levels, gx, closed, dropped_report(wb), by_id))
    write_json(WORK / "legacy-refs.json", legacy_refs(items))

    print("items:", {k: len(v) for k, v in items.items()})
    print("enum anomalies:", len(anomalies))
    print("relations:", raw_pairs, "->", len(rels))
    print("conflicts:", len(issues["conflict"]), "broken:", len(issues["broken"]),
          "wrong_type:", len(issues["wrong_type"]), "gx04:", len(gx))


if __name__ == "__main__":
    main()
