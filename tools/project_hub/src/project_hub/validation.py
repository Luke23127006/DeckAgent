from __future__ import annotations

import json
import re
from collections.abc import Iterable
from dataclasses import asdict, dataclass

from project_hub.config import ProjectConfig, TableSpec
from project_hub.normalize import NormalizedTable, parse_reference_tokens


@dataclass(frozen=True, order=True)
class ValidationIssue:
    table: str
    row: int
    code: str
    field: str
    entity_id: str
    message: str


def structural_issue(message: str, *, table: str = "snapshot") -> ValidationIssue:
    return ValidationIssue(
        table=table,
        row=0,
        code="schema_mismatch",
        field="",
        entity_id="",
        message=message,
    )


def validate_tables(
    config: ProjectConfig, tables: dict[str, NormalizedTable]
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    specs = config.table_map
    ids_by_table: dict[str, set[str]] = {key: set() for key in specs}
    id_locations: dict[str, list[tuple[str, int]]] = {}

    for table_key, spec in specs.items():
        table = tables.get(table_key)
        if table is None:
            issues.append(structural_issue(f"Missing logical table {table_key!r}", table=table_key))
            continue
        if table.headers != spec.headers:
            issues.append(
                structural_issue(
                    f"Expected headers {list(spec.headers)!r}; found {list(table.headers)!r}",
                    table=table_key,
                )
            )
            continue
        pattern = re.compile(spec.id_pattern)
        for row_number, row in enumerate(table.rows, start=2):
            entity_id = row.get(spec.id_column_name, "").strip()
            if not entity_id:
                issues.append(
                    _issue(
                        table_key,
                        row_number,
                        "missing_id",
                        spec.id_column_name,
                        "",
                        "Stable ID is required",
                    )
                )
            elif not pattern.fullmatch(entity_id):
                issues.append(
                    _issue(
                        table_key,
                        row_number,
                        "malformed_id",
                        spec.id_column_name,
                        entity_id,
                        f"Expected ID matching {spec.id_pattern!r}",
                    )
                )
            else:
                ids_by_table[table_key].add(entity_id)
                id_locations.setdefault(entity_id, []).append((table_key, row_number))

    for entity_id, locations in sorted(id_locations.items()):
        if len(locations) < 2:
            continue
        location_text = ", ".join(f"{table}:{row}" for table, row in locations)
        for table_key, row_number in locations:
            issues.append(
                _issue(
                    table_key,
                    row_number,
                    "duplicate_id",
                    specs[table_key].id_column_name,
                    entity_id,
                    f"Stable ID occurs more than once ({location_text})",
                )
            )

    for table_key, spec in specs.items():
        table = tables.get(table_key)
        if table is None or table.headers != spec.headers:
            continue
        issues.extend(_validate_rows(spec, table, ids_by_table, specs))

    return sorted(set(issues))


def _validate_rows(
    spec: TableSpec,
    table: NormalizedTable,
    ids_by_table: dict[str, set[str]],
    specs: dict[str, TableSpec],
) -> Iterable[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for row_number, row in enumerate(table.rows, start=2):
        entity_id = row.get(spec.id_column_name, "").strip()
        for column in spec.columns:
            value = row.get(column.name, "").strip()
            if column.required and not value:
                issues.append(
                    _issue(
                        spec.key,
                        row_number,
                        "missing_required_field",
                        column.name,
                        entity_id,
                        f"Required field {column.name!r} is empty",
                    )
                )
            if value and column.allowed_values and value not in column.allowed_values:
                issues.append(
                    _issue(
                        spec.key,
                        row_number,
                        "invalid_value",
                        column.name,
                        entity_id,
                        f"Expected one of {list(column.allowed_values)!r}; found {value!r}",
                    )
                )
            if not value or not column.references:
                continue
            tokens, error = parse_reference_tokens(value)
            if error:
                issues.append(
                    _issue(
                        spec.key,
                        row_number,
                        "malformed_reference",
                        column.name,
                        entity_id,
                        error,
                    )
                )
                continue
            if "," in value:
                issues.append(
                    _issue(
                        spec.key,
                        row_number,
                        "noncanonical_reference_separator",
                        column.name,
                        entity_id,
                        "Snapshot multi-references must use semicolons",
                    )
                )
            allowed_ids = set().union(*(ids_by_table[target] for target in column.references))
            for token in tokens:
                matching_target = any(
                    re.fullmatch(specs[target].id_pattern, token) for target in column.references
                )
                if not matching_target:
                    expected = ", ".join(column.references)
                    issues.append(
                        _issue(
                            spec.key,
                            row_number,
                            "invalid_relation_edge",
                            column.name,
                            entity_id,
                            f"Reference {token!r} does not target allowed table(s): {expected}",
                        )
                    )
                elif token not in allowed_ids:
                    issues.append(
                        _issue(
                            spec.key,
                            row_number,
                            "broken_reference",
                            column.name,
                            entity_id,
                            f"Referenced ID does not exist: {token}",
                        )
                    )
                if column.no_self_reference and token == entity_id:
                    issues.append(
                        _issue(
                            spec.key,
                            row_number,
                            "invalid_relation_edge",
                            column.name,
                            entity_id,
                            "An entity cannot reference itself in this relation",
                        )
                    )

        for rule in spec.row_rules:
            has_any = any(row.get(field, "").strip() for field in rule.fields)
            if rule.kind == "atLeastOne" and not has_any:
                issues.append(
                    _issue(
                        spec.key,
                        row_number,
                        "invalid_relation_edge",
                        ",".join(rule.fields),
                        entity_id,
                        f"At least one relation target is required: {', '.join(rule.fields)}",
                    )
                )

    return issues


def run_validation(
    config: ProjectConfig, tables: dict[str, NormalizedTable]
) -> list[ValidationIssue]:
    return validate_tables(config, tables)


def format_issues_text(issues: Iterable[ValidationIssue]) -> str:
    values = list(issues)
    if not values:
        return "Validation passed: no structural issues found."
    lines = []
    for issue in values:
        location = issue.table
        if issue.row:
            location += f":{issue.row}"
        identity = f" {issue.entity_id}" if issue.entity_id else ""
        field = f" [{issue.field}]" if issue.field else ""
        lines.append(f"ERROR {issue.code} {location}{identity}{field}: {issue.message}")
    lines.append(f"Validation failed: {len(values)} issue(s).")
    return "\n".join(lines)


def format_issues_json(issues: Iterable[ValidationIssue]) -> str:
    values = list(issues)
    return json.dumps(
        {"valid": not values, "issueCount": len(values), "issues": [asdict(v) for v in values]},
        ensure_ascii=False,
        indent=2,
    )


def _issue(
    table: str,
    row: int,
    code: str,
    field: str,
    entity_id: str,
    message: str,
) -> ValidationIssue:
    return ValidationIssue(table, row, code, field, entity_id, message)
