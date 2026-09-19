# Project Hub support tool

This directory owns the deterministic, read-only Project Hub developer tool. It is not DeckAgent
product code or a DeckAgent runtime dependency.

Contents:

- `src/project_hub/`: OAuth, Google Sheets reads, normalization, snapshots, and validation.
- `tests/`: sanitized unit tests and a mocked Google Sheets integration boundary.
- `config/project-hub.json`: committed DeckAgent Project Hub schema and Spreadsheet ID.
- `pyproject.toml` and `uv.lock`: an isolated Python environment for this tool only.

Developers and agents should use the stable repository-level wrappers:

```text
./scripts/project-hub <command>
./scripts/project-hub.ps1 <command>   # Windows PowerShell
```

Operational setup is documented once at `docs/tooling/project-hub.md`.
