from __future__ import annotations

from dataclasses import replace

from project_hub.config import ColumnSpec, TableSpec
from project_hub.normalize import NormalizedTable
from project_hub.validation import run_validation


def _tables(requirement_rows, work_rows):
    return {
        "requirements": NormalizedTable(
            "requirements", ("id", "requirement"), tuple(requirement_rows)
        ),
        "work": NormalizedTable("work", ("id", "title", "requirement_ids"), tuple(work_rows)),
    }


def test_duplicate_and_missing_ids_are_reported(small_config) -> None:
    tables = _tables(
        [
            {"id": "R-001", "requirement": "First"},
            {"id": "R-001", "requirement": "Duplicate"},
            {"id": "", "requirement": "Missing ID"},
            {"id": "R-01", "requirement": "Malformed ID"},
            {"id": "R-002", "requirement": ""},
        ],
        [],
    )

    codes = [issue.code for issue in run_validation(small_config, tables)]

    assert codes.count("duplicate_id") == 2
    assert "missing_id" in codes
    assert "malformed_id" in codes
    assert "missing_required_field" in codes


def test_broken_malformed_and_wrong_target_references_are_reported(small_config) -> None:
    tables = _tables(
        [{"id": "R-001", "requirement": "First"}],
        [
            {"id": "W-001", "title": "Broken", "requirement_ids": "R-999"},
            {"id": "W-002", "title": "Malformed", "requirement_ids": "R-001;not-an-id"},
            {"id": "W-003", "title": "Wrong type", "requirement_ids": "W-001"},
        ],
    )

    issues = run_validation(small_config, tables)
    codes = {issue.code for issue in issues}

    assert "broken_reference" in codes
    assert "malformed_reference" in codes
    assert "invalid_relation_edge" in codes


def test_valid_tables_pass(small_config) -> None:
    tables = _tables(
        [{"id": "R-001", "requirement": "First"}],
        [{"id": "W-001", "title": "Build", "requirement_ids": "R-001"}],
    )

    assert run_validation(small_config, tables) == []


def test_table_without_stable_id_skips_id_checks_but_still_validates_rows(small_config) -> None:
    updates_spec = TableSpec(
        key="updates",
        sheet="Updates",
        filename="updates.tsv",
        id_pattern="",
        columns=(
            ColumnSpec("Date", "date", required=True),
            ColumnSpec("Work", "work_id", references=("work",)),
        ),
        has_id=False,
    )
    config = replace(small_config, tables=small_config.tables + (updates_spec,))
    tables = _tables(
        [{"id": "R-001", "requirement": "First"}],
        [{"id": "W-001", "title": "Build", "requirement_ids": "R-001"}],
    )
    tables["updates"] = NormalizedTable(
        "updates",
        ("date", "work_id"),
        (
            {"date": "", "work_id": "W-001"},
            {"date": "2026-09-22", "work_id": "W-999"},
        ),
    )

    issues = run_validation(config, tables)
    codes = {issue.code for issue in issues}

    assert "missing_id" not in codes
    assert "malformed_id" not in codes
    assert "duplicate_id" not in codes
    assert "missing_required_field" in codes
    assert "broken_reference" in codes


def test_id_like_text_is_only_validated_in_configured_relationship_fields(small_config) -> None:
    tables = _tables(
        [{"id": "R-001", "requirement": "Prose mentions R-999 but is not a relation"}],
        [{"id": "W-001", "title": "Also mentions R-999", "requirement_ids": "R-001"}],
    )

    assert run_validation(small_config, tables) == []


def test_malformed_reference_is_a_warning_and_other_codes_are_errors(small_config) -> None:
    tables = _tables(
        [{"id": "R-001", "requirement": "First"}],
        [
            {"id": "W-001", "title": "Note", "requirement_ids": "Many requirements, see doc"},
            {"id": "W-002", "title": "Broken", "requirement_ids": "R-999"},
        ],
    )

    severities = {issue.code: issue.severity for issue in run_validation(small_config, tables)}

    assert severities["malformed_reference"] == "warning"
    assert severities["broken_reference"] == "error"
