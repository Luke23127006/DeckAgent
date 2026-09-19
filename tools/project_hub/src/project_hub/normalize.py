from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from project_hub.config import TableSpec
from project_hub.errors import SchemaError

WHITESPACE_RE = re.compile(r"\s+")
REFERENCE_ID_RE = re.compile(r"[A-Z][A-Z0-9]*-\d{3,}")
REFERENCE_SPLIT_RE = re.compile(r"\s*[,;]\s*")


@dataclass(frozen=True)
class NormalizedTable:
    key: str
    headers: tuple[str, ...]
    rows: tuple[dict[str, str], ...]


def normalize_cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    text = str(value).replace("\ufeff", "")
    return WHITESPACE_RE.sub(" ", text).strip()


def parse_reference_tokens(value: str) -> tuple[list[str], str | None]:
    """Parse a reference field and explain why a non-empty value is malformed."""
    normalized = normalize_cell(value)
    if not normalized:
        return [], None
    parts = REFERENCE_SPLIT_RE.split(normalized)
    if any(not part for part in parts):
        return [], "contains an empty reference between separators"
    invalid = [part for part in parts if not REFERENCE_ID_RE.fullmatch(part)]
    if invalid:
        return [], f"contains non-ID token(s): {', '.join(repr(value) for value in invalid)}"
    return parts, None


def normalize_reference_value(value: str) -> str:
    tokens, error = parse_reference_tokens(value)
    if error:
        return normalize_cell(value)
    return ";".join(sorted(set(tokens)))


def _locate_header_row(values: Sequence[Sequence[Any]], spec: TableSpec) -> int:
    if spec.header_row is not None:
        index = spec.header_row - 1
        if index >= len(values):
            raise SchemaError(
                f"Sheet {spec.sheet!r}: configured header row {spec.header_row} is missing"
            )
        return index

    candidates: list[tuple[int, list[str]]] = []
    for index, row in enumerate(values[:25]):
        normalized = [normalize_cell(value) for value in row]
        if spec.id_column.source in normalized:
            candidates.append((index, normalized))
    if not candidates:
        raise SchemaError(
            f"Sheet {spec.sheet!r}: could not find a semantic header row containing "
            f"{spec.id_column.source!r}"
        )
    expected = set(spec.source_headers)
    return max(candidates, key=lambda item: len(expected.intersection(item[1])))[0]


def normalize_table(spec: TableSpec, values: Sequence[Sequence[Any]]) -> NormalizedTable:
    header_index = _locate_header_row(values, spec)
    source_header = [normalize_cell(value) for value in values[header_index]]
    while source_header and not source_header[-1]:
        source_header.pop()

    duplicates = sorted(
        {header for header in source_header if header and source_header.count(header) > 1}
    )
    if duplicates:
        raise SchemaError(f"Sheet {spec.sheet!r}: duplicate header(s): {', '.join(duplicates)}")

    expected = set(spec.source_headers)
    required = {column.source for column in spec.columns if column.header_required}
    actual = {header for header in source_header if header}
    missing = sorted(required - actual)
    unexpected = sorted(actual - expected)
    if missing or (unexpected and spec.unknown_columns == "error"):
        details: list[str] = []
        if missing:
            details.append(f"missing: {', '.join(missing)}")
        if unexpected and spec.unknown_columns == "error":
            details.append(f"unexpected: {', '.join(unexpected)}")
        raise SchemaError(f"Sheet {spec.sheet!r} schema mismatch ({'; '.join(details)})")

    source_indexes = {header: index for index, header in enumerate(source_header) if header}
    rows: list[dict[str, str]] = []
    for source_row in values[header_index + 1 :]:
        mapped: dict[str, str] = {}
        for column in spec.columns:
            index = source_indexes.get(column.source)
            raw_value = source_row[index] if index is not None and index < len(source_row) else ""
            normalized = normalize_cell(raw_value)
            if column.references and normalized:
                normalized = normalize_reference_value(normalized)
            mapped[column.name] = normalized
        if not any(mapped.values()):
            continue
        # Formula-filled template ranges can expose a calculated ID even when the
        # rest of the semantic record is empty. The per-table policy keeps those
        # placeholders out while still retaining rows with data but a missing ID
        # so deterministic validation can report them.
        non_id_values = (value for name, value in mapped.items() if name != spec.id_column_name)
        if spec.drop_id_only_rows and not any(non_id_values):
            continue
        rows.append(mapped)

    return NormalizedTable(key=spec.key, headers=spec.headers, rows=tuple(rows))


def normalize_all(
    specs: Sequence[TableSpec], values_by_sheet: dict[str, Sequence[Sequence[Any]]]
) -> dict[str, NormalizedTable]:
    missing_sheets = [spec.sheet for spec in specs if spec.sheet not in values_by_sheet]
    if missing_sheets:
        raise SchemaError(f"Missing source sheet(s): {', '.join(missing_sheets)}")
    return {spec.key: normalize_table(spec, values_by_sheet[spec.sheet]) for spec in specs}
