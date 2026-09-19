from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from project_hub.config import TableSpec
from project_hub.errors import RemoteError, SchemaError


@dataclass(frozen=True)
class RemoteSpreadsheet:
    title: str
    values_by_sheet: dict[str, list[list[Any]]]


def build_service(credentials: Any) -> Any:
    try:
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise RemoteError(
            "Google Sheets dependency is missing. Install with `pip install -e .`."
        ) from exc
    try:
        return build("sheets", "v4", credentials=credentials, cache_discovery=False)
    except Exception as exc:
        raise RemoteError(f"Could not initialize the Google Sheets API client: {exc}") from exc


def fetch_project_hub(
    service: Any,
    spreadsheet_id: str,
    specs: Sequence[TableSpec],
) -> RemoteSpreadsheet:
    try:
        metadata = (
            service.spreadsheets()
            .get(
                spreadsheetId=spreadsheet_id,
                includeGridData=False,
                fields="properties(title),sheets(properties(title))",
            )
            .execute()
        )
        sheet_names = {
            item.get("properties", {}).get("title") for item in metadata.get("sheets", [])
        }
        expected = {spec.sheet for spec in specs}
        missing = sorted(expected - sheet_names)
        if missing:
            raise SchemaError(f"Remote spreadsheet is missing sheet(s): {', '.join(missing)}")

        ranges = [_quote_sheet(spec.sheet) for spec in specs]
        response = (
            service.spreadsheets()
            .values()
            .batchGet(
                spreadsheetId=spreadsheet_id,
                ranges=ranges,
                majorDimension="ROWS",
                valueRenderOption="FORMATTED_VALUE",
            )
            .execute()
        )
    except SchemaError:
        raise
    except Exception as exc:
        raise RemoteError(
            "Google Sheets read failed. Check the Spreadsheet ID, selected Google account, "
            f"Sheets API enablement, and sharing ACL. Details: {exc}"
        ) from exc

    value_ranges = response.get("valueRanges", [])
    if len(value_ranges) != len(specs):
        raise RemoteError(
            f"Google Sheets returned {len(value_ranges)} ranges for {len(specs)} requested tables"
        )
    values_by_sheet = {
        spec.sheet: value_range.get("values", [])
        for spec, value_range in zip(specs, value_ranges, strict=True)
    }
    return RemoteSpreadsheet(
        title=str(metadata.get("properties", {}).get("title", "")),
        values_by_sheet=values_by_sheet,
    )


def fetch_metadata(service: Any, spreadsheet_id: str) -> dict[str, Any]:
    try:
        return (
            service.spreadsheets()
            .get(
                spreadsheetId=spreadsheet_id,
                includeGridData=False,
                fields="properties(title,locale,timeZone),sheets(properties(title))",
            )
            .execute()
        )
    except Exception as exc:
        raise RemoteError(
            "Remote access check failed. Verify the Spreadsheet ID and authenticated account. "
            f"Details: {exc}"
        ) from exc


def _quote_sheet(sheet_name: str) -> str:
    return "'" + sheet_name.replace("'", "''") + "'"
