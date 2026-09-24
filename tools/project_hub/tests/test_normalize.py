from __future__ import annotations

import pytest

from project_hub.config import ColumnSpec, TableSpec
from project_hub.errors import SchemaError
from project_hub.normalize import NormalizedTable, normalize_cell, normalize_table
from project_hub.snapshot import content_hash, serialize_tsv


def _spec(*, unknown_columns: str = "error", header_row: int | None = None) -> TableSpec:
    return TableSpec(
        key="work",
        sheet="Work",
        filename="work.tsv",
        id_pattern=r"^W-\d{3,}$",
        columns=(
            ColumnSpec("ID", "id", required=True),
            ColumnSpec("Title", "title", required=True),
            ColumnSpec("Requirements", "requirement_ids", references=("requirements",)),
        ),
        unknown_columns=unknown_columns,
        header_row=header_row,
    )


def test_header_mapping_supports_reordered_columns_and_blank_rows() -> None:
    values = [
        ["Project Hub export"],
        ["Requirements", "Title", "ID"],
        ["R-002, R-001, R-001", " Build\tthing\nnow ", "W-001"],
        ["", "", ""],
        [],
    ]

    table = normalize_table(_spec(), values)

    assert table.headers == ("id", "title", "requirement_ids")
    assert table.rows == (
        {"id": "W-001", "title": "Build thing now", "requirement_ids": "R-001;R-002"},
    )


def test_schema_mismatch_names_missing_and_unexpected_headers_in_strict_mode() -> None:
    values = [["ID", "Title", "Wrong"], ["W-001", "Build", "value"]]

    with pytest.raises(SchemaError, match="missing: Requirements.*unexpected: Wrong"):
        normalize_table(_spec(), values)


def test_additional_rows_and_formula_only_template_rows_need_no_schema_change() -> None:
    values = [
        ["Project Hub"],
        ["ID", "Title", "Requirements"],
        ["W-001", "First", "R-001"],
        ["W-002", "Second", "R-002"],
        ["W-003", "", ""],  # generated ID in an otherwise empty template row
    ]

    table = normalize_table(_spec(header_row=2), values)

    assert [row["id"] for row in table.rows] == ["W-001", "W-002"]


def test_unknown_columns_are_ignored_without_changing_canonical_hash() -> None:
    original = [
        ["ID", "Title", "Requirements"],
        ["W-001", "Build R-001 summary", "R-002, R-001"],
    ]
    reordered_with_unknown = [
        ["Private Notes", "Requirements", "ID", "Title"],
        ["not exported", "R-001; R-002", "W-001", "Build R-001 summary"],
    ]

    first = normalize_table(_spec(unknown_columns="ignore"), original)
    second = normalize_table(_spec(unknown_columns="ignore"), reordered_with_unknown)

    assert first == second
    assert second.rows[0]["title"] == "Build R-001 summary"
    assert "Private Notes" not in second.headers
    assert content_hash(serialize_tsv(first)) == content_hash(serialize_tsv(second))


def test_registered_optional_header_can_be_absent() -> None:
    spec = TableSpec(
        key="notes",
        sheet="Notes",
        filename="notes.tsv",
        id_pattern=r"^N-\d{3,}$",
        columns=(
            ColumnSpec("ID", "id", required=True),
            ColumnSpec("Title", "title", required=True),
            ColumnSpec("Comment", "comment", header_required=False),
        ),
    )

    table = normalize_table(spec, [["ID", "Title"], ["N-001", "One"]])

    assert table.headers == ("id", "title", "comment")
    assert table.rows[0]["comment"] == ""


def test_renamed_required_header_has_clear_schema_error() -> None:
    values = [["ID", "Summary", "Requirements"], ["W-001", "Build", "R-001"]]

    with pytest.raises(SchemaError, match="missing: Title"):
        normalize_table(_spec(unknown_columns="ignore"), values)


def test_duplicate_header_is_rejected() -> None:
    values = [["ID", "Title", "Requirements", "Title"]]

    with pytest.raises(SchemaError, match="duplicate header"):
        normalize_table(_spec(), values)


def test_table_without_stable_id_keeps_rows_with_any_data() -> None:
    spec = TableSpec(
        key="updates",
        sheet="Updates",
        filename="updates.tsv",
        id_pattern="",
        columns=(
            ColumnSpec("Date", "date", required=True),
            ColumnSpec("Member", "member", required=True),
            ColumnSpec("Work", "work_id", references=("work",)),
        ),
        header_row=2,
        has_id=False,
    )
    values = [
        ["Project Hub"],
        ["Date", "Member", "Work"],
        ["2026-09-22", "Duy", "W-001"],
        ["", "", ""],
    ]

    table = normalize_table(spec, values)

    assert table.headers == ("date", "member", "work_id")
    assert table.rows == ({"date": "2026-09-22", "member": "Duy", "work_id": "W-001"},)


def test_table_without_stable_id_requires_explicit_header_row() -> None:
    spec = TableSpec(
        key="updates",
        sheet="Updates",
        filename="updates.tsv",
        id_pattern="",
        columns=(ColumnSpec("Date", "date", required=True),),
        has_id=False,
    )

    with pytest.raises(SchemaError, match="headerRow must be configured explicitly"):
        normalize_table(spec, [["Date"], ["2026-09-22"]])


def test_tsv_normalizes_tabs_and_newlines_to_one_physical_line() -> None:
    table = NormalizedTable(
        key="work",
        headers=("id", "title"),
        rows=({"id": "W-001", "title": 'a\tb\nc "quoted"'},),
    )

    content = serialize_tsv(table).decode("utf-8")

    assert content.count("\n") == 2
    assert content.splitlines()[1].count("\t") == 1
    assert normalize_cell(" a\r\n b\t c ") == "a b c"
