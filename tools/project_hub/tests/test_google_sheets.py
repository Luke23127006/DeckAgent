from __future__ import annotations

from project_hub.google_sheets import fetch_project_hub


class _Call:
    def __init__(self, response):
        self.response = response

    def execute(self):
        return self.response


class _Values:
    def __init__(self, owner):
        self.owner = owner

    def batchGet(self, **kwargs):
        self.owner.batch_kwargs = kwargs
        return _Call(
            {
                "valueRanges": [
                    {"values": [["ID", "Requirement"], ["R-001", "One"]]},
                    {"values": [["ID", "Title", "Requirement"], ["W-001", "Build", "R-001"]]},
                ]
            }
        )


class _Spreadsheets:
    def __init__(self):
        self.get_kwargs = None
        self.batch_kwargs = None

    def get(self, **kwargs):
        self.get_kwargs = kwargs
        return _Call(
            {
                "properties": {"title": "Private Project Hub"},
                "sheets": [
                    {"properties": {"title": "Requirements"}},
                    {"properties": {"title": "Work"}},
                ],
            }
        )

    def values(self):
        return _Values(self)


class _Service:
    def __init__(self):
        self.resource = _Spreadsheets()

    def spreadsheets(self):
        return self.resource


def test_fetch_uses_batched_effective_read_only_values(small_config) -> None:
    service = _Service()

    remote = fetch_project_hub(service, "sheet-id", small_config.tables)

    assert remote.title == "Private Project Hub"
    assert remote.values_by_sheet["Requirements"][1][0] == "R-001"
    assert service.resource.batch_kwargs == {
        "spreadsheetId": "sheet-id",
        "ranges": ["'Requirements'", "'Work'"],
        "majorDimension": "ROWS",
        "valueRenderOption": "FORMATTED_VALUE",
    }
