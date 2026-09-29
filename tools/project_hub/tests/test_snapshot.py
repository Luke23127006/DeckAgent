from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from project_hub import snapshot as snapshot_module
from project_hub.config import ColumnSpec, TableSpec
from project_hub.errors import SnapshotError
from project_hub.normalize import NormalizedTable, normalize_table
from project_hub.snapshot import (
    escape_tsv_value,
    read_snapshot,
    serialize_tsv,
    unescape_tsv_value,
    verify_manifest,
    write_snapshot,
)


def _tables(requirement: str = "First"):
    return {
        "requirements": NormalizedTable(
            "requirements",
            ("id", "requirement"),
            ({"id": "R-001", "requirement": requirement},),
        ),
        "work": NormalizedTable(
            "work",
            ("id", "title", "requirement_ids"),
            ({"id": "W-001", "title": "Build", "requirement_ids": "R-001"},),
        ),
    }


def test_hash_change_and_unchanged_table_is_not_rewritten(small_config) -> None:
    now = datetime(2026, 9, 19, tzinfo=UTC)
    first = write_snapshot(small_config, _tables(), now=now)
    requirement_path = small_config.snapshot_dir / "requirements.tsv"
    work_path = small_config.snapshot_dir / "work.tsv"
    fixed_seconds = 1_600_000_000
    os.utime(requirement_path, (fixed_seconds, fixed_seconds))
    os.utime(work_path, (fixed_seconds, fixed_seconds))

    unchanged = write_snapshot(small_config, _tables(), now=now + timedelta(minutes=1))

    assert unchanged["changedTables"] == []
    assert requirement_path.stat().st_mtime_ns == fixed_seconds * 1_000_000_000
    assert work_path.stat().st_mtime_ns == fixed_seconds * 1_000_000_000

    requirement_path.write_text("corrupt", encoding="utf-8")
    repaired = write_snapshot(small_config, _tables(), now=now + timedelta(minutes=2))
    assert repaired["changedTables"] == ["requirements"]

    changed = write_snapshot(
        small_config, _tables(requirement="Changed"), now=now + timedelta(minutes=3)
    )

    assert changed["changedTables"] == ["requirements"]
    assert changed["tables"]["requirements"]["hash"] != first["tables"]["requirements"]["hash"]
    assert work_path.stat().st_mtime_ns == fixed_seconds * 1_000_000_000
    loaded, errors = read_snapshot(small_config)
    assert errors == []
    assert loaded["requirements"].rows[0]["requirement"] == "Changed"
    assert verify_manifest(small_config) == []


def test_write_snapshot_removes_stale_tsv_files_no_longer_in_config(small_config) -> None:
    small_config.snapshot_dir.mkdir(parents=True, exist_ok=True)
    stale_path = small_config.snapshot_dir / "legacy-table.tsv"
    stale_path.write_text("id\tvalue\n", encoding="utf-8")

    manifest = write_snapshot(small_config, _tables())

    assert not stale_path.exists()
    assert manifest["removedFiles"] == ["legacy-table.tsv"]
    # Tables still declared in config are unaffected by the cleanup.
    assert (small_config.snapshot_dir / "requirements.tsv").is_file()
    assert (small_config.snapshot_dir / "work.tsv").is_file()


def test_write_snapshot_wraps_stale_file_removal_errors(monkeypatch, small_config) -> None:
    small_config.snapshot_dir.mkdir(parents=True, exist_ok=True)
    stale_path = small_config.snapshot_dir / "legacy-table.tsv"
    stale_path.write_text("id\tvalue\n", encoding="utf-8")

    original_unlink = Path.unlink

    def _flaky_unlink(self, *args, **kwargs):
        if self.name == "legacy-table.tsv":
            raise OSError("permission denied")
        return original_unlink(self, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", _flaky_unlink)

    with pytest.raises(SnapshotError, match="Cannot remove stale snapshot file"):
        write_snapshot(small_config, _tables())

    # The stale file must still be present: the failed removal was not swallowed.
    assert stale_path.exists()


def test_write_snapshot_rolls_back_everything_when_a_later_write_fails(
    monkeypatch, small_config
) -> None:
    write_snapshot(small_config, _tables())  # publish an initial known-good snapshot
    stale_path = small_config.snapshot_dir / "legacy-table.tsv"
    stale_path.write_text("id\tvalue\n", encoding="utf-8")

    requirements_path = small_config.snapshot_dir / "requirements.tsv"
    work_path = small_config.snapshot_dir / "work.tsv"
    manifest_path = small_config.snapshot_dir / "manifest.json"
    original_requirements_bytes = requirements_path.read_bytes()
    original_work_bytes = work_path.read_bytes()
    original_manifest_bytes = manifest_path.read_bytes()

    changed_tables = {
        "requirements": NormalizedTable(
            "requirements",
            ("id", "requirement"),
            ({"id": "R-001", "requirement": "Changed"},),
        ),
        "work": NormalizedTable(
            "work",
            ("id", "title", "requirement_ids"),
            ({"id": "W-001", "title": "Changed too", "requirement_ids": "R-001"},),
        ),
    }

    original_atomic_write = snapshot_module._atomic_write

    def _flaky_atomic_write(path, content, *args, **kwargs):
        if path.name == "work.tsv":
            raise SnapshotError("simulated disk failure")
        return original_atomic_write(path, content, *args, **kwargs)

    monkeypatch.setattr(snapshot_module, "_atomic_write", _flaky_atomic_write)

    with pytest.raises(SnapshotError, match="simulated disk failure"):
        write_snapshot(small_config, changed_tables)

    # requirements.tsv was genuinely rewritten (it precedes work.tsv in config order)
    # before work.tsv failed, and the stale file was genuinely removed before either
    # table write ran. Both must be rolled back, and the manifest must stay untouched,
    # so the failed attempt leaves no trace of new state mixed with old.
    assert stale_path.exists()
    assert stale_path.read_text(encoding="utf-8") == "id\tvalue\n"
    assert requirements_path.read_bytes() == original_requirements_bytes
    assert work_path.read_bytes() == original_work_bytes
    assert manifest_path.read_bytes() == original_manifest_bytes


@pytest.mark.parametrize(
    ("value", "escaped"),
    [
        ("A\nB", "A\\nB"),
        ("Use \\n literally", "Use \\\\n literally"),
        ("C:\\path\\to", "C:\\\\path\\\\to"),
        ("a\tb", "a\\tb"),
        ("a\rb", "a\\rb"),
        ("trailing \\", "trailing \\\\"),
        ("\\\n", "\\\\\\n"),
        ("Tiếng Việt “ổn”", "Tiếng Việt “ổn”"),
    ],
)
def test_tsv_escaping_is_reversible(value: str, escaped: str) -> None:
    assert escape_tsv_value(value) == escaped
    assert unescape_tsv_value(escaped) == value
    assert not {"\n", "\r", "\t"} & set(escaped)


def test_real_newline_and_literal_backslash_n_serialize_differently() -> None:
    real, literal = "A\nB", "A\\nB"

    assert escape_tsv_value(real) != escape_tsv_value(literal)
    assert unescape_tsv_value(escape_tsv_value(literal)) == literal


@pytest.mark.parametrize("escaped", ["bad \\x escape", "lone \\"])
def test_unknown_or_truncated_escape_is_rejected(escaped: str) -> None:
    with pytest.raises(ValueError, match="invalid escape sequence"):
        unescape_tsv_value(escaped)


def _work_table(title: str) -> NormalizedTable:
    return NormalizedTable("work", ("id", "title"), ({"id": "W-001", "title": title},))


def _record_line(content: bytes) -> str:
    lines = content.decode("utf-8").split("\n")
    assert lines[-1] == "" and len(lines) == 3  # header + one record, one physical line each
    return lines[1]


def test_multiline_cell_is_escaped_exactly_once_through_the_pipeline() -> None:
    spec = TableSpec(
        key="work",
        sheet="Work",
        filename="work.tsv",
        id_pattern=r"^W-\d{3,}$",
        columns=(ColumnSpec("ID", "id", required=True), ColumnSpec("Title", "title")),
    )

    table = normalize_table(spec, [["ID", "Title"], ["W-001", "A\r\nB"]])
    renormalized = normalize_table(spec, [["ID", "Title"], ["W-001", table.rows[0]["title"]]])

    assert table.rows[0]["title"] == "A\nB"
    assert _record_line(serialize_tsv(table)) == "W-001\tA\\nB"
    assert serialize_tsv(renormalized) == serialize_tsv(table)


@pytest.mark.parametrize(
    "title",
    [
        "1. Foo\n2. Bar",
        "5. Finish Sprint 1.\n6. Start Sprint 2.",
        "Spec v1 final.pdf\nhttps://example.test/a b",
        "Use \\n literally\nthen a real line",
    ],
)
def test_line_boundaries_are_recoverable_from_the_physical_record(title: str) -> None:
    record = _record_line(serialize_tsv(_work_table(title)))
    _id, cell = record.split("\t")

    assert unescape_tsv_value(cell).split("\n") == title.split("\n")


def test_snapshot_round_trip_returns_semantic_values_and_is_stable(small_config) -> None:
    title = "1. Làm A\n2. Use \\n literally\n\n3. Sprint 1."
    tables = _tables()
    tables["work"] = NormalizedTable(
        "work",
        ("id", "title", "requirement_ids"),
        ({"id": "W-001", "title": title, "requirement_ids": "R-001"},),
    )
    first = write_snapshot(small_config, tables)
    work_bytes = (small_config.snapshot_dir / "work.tsv").read_bytes()

    loaded, errors = read_snapshot(small_config)
    again = write_snapshot(small_config, loaded)

    assert errors == []
    assert loaded["work"].rows[0]["title"] == title
    assert again["changedTables"] == []
    assert again["tables"] == first["tables"]
    assert (small_config.snapshot_dir / "work.tsv").read_bytes() == work_bytes
    assert serialize_tsv(loaded["work"]) == serialize_tsv(tables["work"])
    assert verify_manifest(small_config) == []


def test_line_boundaries_change_the_table_hash_deterministically(small_config) -> None:
    multiline = write_snapshot(small_config, _tables(requirement="1. Foo\n2. Bar"))
    repeated = write_snapshot(small_config, _tables(requirement="1. Foo\r\n2. Bar"))
    flattened = write_snapshot(small_config, _tables(requirement="1. Foo 2. Bar"))

    assert repeated["tables"] == multiline["tables"]
    assert repeated["changedTables"] == []
    multiline_hash = multiline["tables"]["requirements"]["hash"]
    assert flattened["tables"]["requirements"]["hash"] != multiline_hash


def test_read_snapshot_reports_invalid_cell_escapes(small_config) -> None:
    write_snapshot(small_config, _tables())
    (small_config.snapshot_dir / "requirements.tsv").write_text(
        "id\trequirement\nR-001\tbad \\q\n", encoding="utf-8"
    )

    loaded, errors = read_snapshot(small_config)

    assert loaded["requirements"].rows == ()
    assert errors == [
        "Snapshot cell encoding error for requirements line 2: invalid escape sequence '\\\\q'"
    ]
