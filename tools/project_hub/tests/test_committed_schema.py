"""Behavioral tests for the committed Project Hub schema (schemaVersion 4).

Every fixture here is synthetic: sheet values are generated from the committed config so the
tests exercise real header mappings, controlled values, and references without copying any
private Project Hub content.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from project_hub.config import ProjectConfig, TableSpec, load_config
from project_hub.errors import SchemaError
from project_hub.normalize import normalize_all, normalize_table
from project_hub.snapshot import serialize_tsv
from project_hub.validation import run_validation

REPO_CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "project-hub.json"


@pytest.fixture(scope="module")
def config() -> ProjectConfig:
    return load_config(REPO_CONFIG_PATH)


def _first_id(spec: TableSpec) -> str:
    prefix = re.match(r"\^([A-Z]+)-", spec.id_pattern)
    assert prefix, spec.id_pattern
    return f"{prefix.group(1)}-001"


def _valid_row(spec: TableSpec, specs: dict[str, TableSpec]) -> dict[str, str]:
    """One synthetic source row keyed by source header, valid under the committed config."""
    row: dict[str, str] = {}
    for column in spec.columns:
        if spec.has_id and column.name == spec.id_column_name:
            row[column.source] = _first_id(spec)
        elif column.allowed_values:
            row[column.source] = column.allowed_values[0]
        elif column.references:
            row[column.source] = (
                "" if column.no_self_reference else _first_id(specs[column.references[0]])
            )
        else:
            row[column.source] = f"synthetic {column.name}"
    return row


def _sheet(
    headers: list[str], rows: list[dict[str, str]], *, title: str = "Title banner"
) -> list[list[str]]:
    """Row 1 is a title banner and row 2 holds headers, matching `headerRow: 2`."""
    return [[title], headers, *[[row.get(header, "") for header in headers] for row in rows]]


def _hub(
    config: ProjectConfig, overrides: dict[str, dict[str, str]] | None = None
) -> dict[str, list[list[str]]]:
    specs = config.table_map
    values: dict[str, list[list[str]]] = {}
    for spec in config.tables:
        row = _valid_row(spec, specs)
        row.update((overrides or {}).get(spec.key, {}))
        values[spec.sheet] = _sheet(list(spec.source_headers), [row])
    return values


def _codes(config: ProjectConfig, values: dict[str, list[list[str]]]) -> list[tuple[str, str]]:
    tables = normalize_all(config.tables, values)
    return [(issue.code, issue.field) for issue in run_validation(config, tables)]


def test_synthetic_hub_built_from_committed_config_validates_cleanly(config) -> None:
    assert _codes(config, _hub(config)) == []


def test_config_references_resolve_to_declared_logical_tables(config) -> None:
    table_map = config.table_map
    for table in config.tables:
        for column in table.columns:
            for target in column.references:
                assert target in table_map, (table.key, column.name, target)
                assert table_map[target].has_id, (table.key, column.name, target)


def test_operating_rules_is_not_a_snapshot_table(config) -> None:
    assert "operating_rules" not in config.table_map
    assert {"Operating Rules", "Home", "_Config"}.isdisjoint(t.sheet for t in config.tables)


def test_ghi_chu_maps_to_canonical_notes_in_every_table_with_notes(config) -> None:
    tables_with_notes = [t for t in config.tables if "notes" in t.headers]
    assert len(tables_with_notes) == 12
    for table in tables_with_notes:
        notes = next(column for column in table.columns if column.name == "notes")
        assert notes.source == "Ghi chú", table.key


def test_legacy_notes_header_is_now_a_clear_schema_error(config) -> None:
    spec = config.table_map["actors"]
    headers = ["Notes" if header == "Ghi chú" else header for header in spec.source_headers]

    with pytest.raises(SchemaError, match="missing: Ghi chú"):
        normalize_table(spec, _sheet(headers, []))


def test_renamed_requirement_headers_keep_stable_canonical_fields(config) -> None:
    spec = config.table_map["requirements"]
    # Physical order of the new sheet, including an unmapped helper column.
    headers = [
        "ID",
        "Tên ngắn",
        "Scope",
        "Status",
        "Type",
        "Yêu cầu",
        "Bối cảnh / Lý do",
        "Acceptance Note",
        "Ghi chú",
        "Căn cứ",
        "Area",
        "Depends On (IDs)",
        "Related Work (IDs)",
        "Related Tests",
        "Unmapped helper",
    ]
    row = {
        "ID": "R-001",
        "Tên ngắn": "Short label",
        "Scope": "V1",
        "Status": "Active",
        "Type": "Functional",
        "Yêu cầu": "The system must do X",
        "Bối cảnh / Lý do": "Why",
        "Acceptance Note": "Accepted when",
        "Ghi chú": "A note",
        "Căn cứ": "DOC-001 FR01, D-001",
        "Area": "Input, Planning",
        "Depends On (IDs)": "",
        "Related Work (IDs)": "W-002, W-001",
        "Related Tests": "tests/test_x.py",
        "Unmapped helper": "must not leak",
    }

    table = normalize_table(spec, _sheet(headers, [row]))

    assert table.headers == (
        "id",
        "short_name",
        "requirement",
        "context_rationale",
        "type",
        "status",
        "scope",
        "source",
        "acceptance_note",
        "depends_on_ids",
        "impacts",
        "related_work_ids",
        "related_tests",
        "notes",
    )
    record = table.rows[0]
    assert record["requirement"] == "The system must do X"
    assert record["short_name"] == "Short label"
    assert record["source"] == "DOC-001 FR01, D-001"  # provenance text, not a relation
    assert record["impacts"] == "Input, Planning"
    assert record["notes"] == "A note"
    assert record["related_work_ids"] == "W-001;W-002"
    assert "must not leak" not in record.values()


@pytest.mark.parametrize(
    ("table_key", "canonical"),
    [
        ("requirements", "source"),
        ("constraints", "source"),
        ("business_rules", "source"),
        ("use_cases", "source"),
        ("assumptions", "support_source"),
    ],
)
def test_can_cu_is_plain_provenance_text(config, table_key: str, canonical: str) -> None:
    column = next(c for c in config.table_map[table_key].columns if c.source == "Căn cứ")
    assert column.name == canonical
    assert column.references == ()

    # Mixed IDs and source codes must not raise relation findings.
    overrides = {table_key: {"Căn cứ": "DOC-001 FR01, D-999"}}
    assert _codes(config, _hub(config, overrides)) == []


def test_new_use_case_fields_are_exported(config) -> None:
    spec = config.table_map["use_cases"]
    row = _valid_row(spec, config.table_map)
    row.update(
        {
            "Release Scope": "Later",
            "Tình huống": "I have X, I want Y, so that Z",
            "Căn cứ": "D-001, DOC-001 FR01",
            "Product Reference": "1. Product: feature",
            "Quan hệ UC": "1. Include: UC-002\n2. Extend bởi: UC-003",
        }
    )

    record = normalize_table(spec, _sheet(list(reversed(spec.source_headers)), [row])).rows[0]

    assert record["release_scope"] == "Later"
    assert record["scenario"] == "I have X, I want Y, so that Z"
    assert record["source"] == "D-001, DOC-001 FR01"
    assert record["product_reference"] == "1. Product: feature"
    assert record["use_case_relations"] == "1. Include: UC-002\n2. Extend bởi: UC-003"


def test_labelled_use_case_relations_stay_text_without_relation_findings(config) -> None:
    column = next(c for c in config.table_map["use_cases"].columns if c.source == "Quan hệ UC")
    assert column.name == "use_case_relations"
    assert column.references == ()

    overrides = {"use_cases": {"Quan hệ UC": "1. Include: UC-999\n2. Tách từ: UC-001"}}
    assert _codes(config, _hub(config, overrides)) == []


@pytest.mark.parametrize("table_key", ["use_cases", "requirements", "business_rules"])
def test_spec_status_domain(config, table_key: str) -> None:
    for status in ("Draft", "Proposed", "Active", "Deprecated"):
        assert _codes(config, _hub(config, {table_key: {"Status": status}})) == []

    codes = _codes(config, _hub(config, {table_key: {"Status": "Changed"}}))
    assert codes == [("invalid_value", "status")]


@pytest.mark.parametrize(
    ("table_key", "header", "field"),
    [
        ("requirements", "Scope", "scope"),
        ("business_rules", "Scope", "scope"),
        ("use_cases", "Release Scope", "release_scope"),
    ],
)
def test_release_scope_domain(config, table_key: str, header: str, field: str) -> None:
    for scope in ("V1", "Later"):
        assert _codes(config, _hub(config, {table_key: {header: scope}})) == []
    for retired in ("Product", "Project", "Milestone"):
        codes = _codes(config, _hub(config, {table_key: {header: retired}}))
        assert codes == [("invalid_value", field)]


def test_documents_keep_their_own_scope_domain(config) -> None:
    assert _codes(config, _hub(config, {"documents": {"Scope": "Milestone"}})) == []


def test_multi_value_requirement_area_is_intentionally_unvalidated(config) -> None:
    column = next(c for c in config.table_map["requirements"].columns if c.source == "Area")
    assert column.name == "impacts"
    assert column.allowed_values == ()

    overrides = {"requirements": {"Area": "Input, Planning, Editing, AI"}}
    assert _codes(config, _hub(config, overrides)) == []


@pytest.mark.parametrize("table_key", ["decisions", "work", "requirements", "use_cases"])
def test_reordered_columns_produce_identical_canonical_tsv(config, table_key: str) -> None:
    spec = config.table_map[table_key]
    row = _valid_row(spec, config.table_map)
    configured_order = list(spec.source_headers)
    reordered = [*reversed(configured_order), "Unknown extra column"]
    row_with_extra = {**row, "Unknown extra column": "ignored"}

    first = normalize_table(spec, _sheet(configured_order, [row]))
    second = normalize_table(spec, _sheet(reordered, [row_with_extra]))

    assert first == second
    assert serialize_tsv(first) == serialize_tsv(second)
    assert "ignored" not in serialize_tsv(second).decode("utf-8")
