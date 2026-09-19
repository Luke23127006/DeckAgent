from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

from project_hub.normalize import NormalizedTable
from project_hub.snapshot import read_snapshot, verify_manifest, write_snapshot


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
