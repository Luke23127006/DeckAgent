# Project Hub internal support tool

Project Hub tooling is developer and coding-agent infrastructure for the DeckAgent repository. Its
implementation, tests, dependencies, and schema configuration are isolated under
`tools/project_hub/`; it is not DeckAgent product code or a product runtime dependency.

## Architecture

The runtime path is intentionally small:

```text
private Google Spreadsheet
  -> Google Sheets API (`spreadsheets.readonly` only)
  -> OAuth token for the current OS user
  -> header-based normalization and deterministic validation
  -> one canonical TSV per logical table
  -> per-table SHA-256 metadata in manifest.json
```

Google Sheets is the source of truth for project state. GitHub is the source of truth for code,
technical documents, diagrams, tests, and pull requests. The local snapshot is a generated,
gitignored materialized view under `.project-hub/snapshot/`.

The supplied `.xlsx` export was used only to derive the committed schema mapping and sanitized
tests. No production module imports an Excel library or accepts an `.xlsx` input.

## Team onboarding

The shared `client_secret.json` identifies the team's Google OAuth Desktop application; it is not a
member's login or token. Obtain it from the team's private managed storage. The repository does not
name or link the private storage location.

1. Clone the DeckAgent repository and install the isolated support-tool dependencies:

   ```text
   uv sync --project tools/project_hub --extra dev
   ```

2. Place the shared file at the local, user-specific path implemented by the tool:

   | OS | OAuth client file |
   | --- | --- |
   | Windows | `%LOCALAPPDATA%\project-hub\client_secret.json` |
   | macOS | `~/Library/Application Support/project-hub/client_secret.json` |
   | Linux | `${XDG_CONFIG_HOME:-$HOME/.config}/project-hub/client_secret.json` |

   On a default Windows installation this expands to
   `C:\Users\<username>\AppData\Local\project-hub\client_secret.json`. Create the parent directory
   if it does not exist. This path is outside the repository, so Git cannot stage it.

3. On Windows PowerShell, authenticate and build the first snapshot:

   ```text
   ./scripts/project-hub.ps1 auth
   ./scripts/project-hub.ps1 sync
   ./scripts/project-hub.ps1 validate
   ./scripts/project-hub.ps1 status
   ```

   On macOS/Linux use the equivalent repository wrapper:

   ```text
   ./scripts/project-hub auth
   ./scripts/project-hub sync
   ./scripts/project-hub validate
   ./scripts/project-hub status
   ```

During `auth`, sign in with **your own** Google account that has access to the private Project Hub.
Each member receives a separate OAuth token at `token.json` in the auth directory described below. Never
share member tokens, commit the client JSON, or commit `.project-hub/snapshot/`. A validation exit
code of 1 can represent deterministic issues in current project data; it is distinct from an OAuth,
remote-access, or schema failure (exit code 2).

Dependency error messages that suggest `pip install -e .` assume the working directory is
`tools/project_hub/`, which contains the tool's `pyproject.toml`. The repository root has no
`pyproject.toml`; use the repository-root uv setup command above for the documented onboarding path.

## OAuth application setup (maintainers only)

One team-owned Google Cloud project can provide the OAuth client definition, but every member signs
in and receives a separate user token. No member shares a token or PM credential.

1. In Google Cloud Console, enable **Google Sheets API**.
2. Configure the OAuth consent screen. If the app is in testing, add the five team members as test
   users. For a managed Workspace, the administrator may need to allow the app/scope.
3. Create an OAuth client with application type **Desktop app**.
4. Download the client JSON and store the shared copy in the team's private managed storage. Do not
   add it to this repository.

For exceptional local testing, the default can be overridden with `--client-secrets PATH` or
`PROJECT_HUB_GOOGLE_CLIENT_FILE`.

Default client/token directory:

| OS | Directory |
| --- | --- |
| Windows | `%LOCALAPPDATA%\project-hub\` |
| macOS | `~/Library/Application Support/project-hub/` |
| Linux | `${XDG_CONFIG_HOME:-~/.config}/project-hub/` |

The client definition is normally named `client_secret.json`; the generated token is `token.json`.
`PROJECT_HUB_AUTH_DIR` overrides this directory for both the token and default client file. Keep the
override outside the repository. `PROJECT_HUB_GOOGLE_CLIENT_FILE` overrides only the client file,
and `auth --client-secrets PATH` takes precedence over that client-file variable; neither changes
the token directory.

The tool attempts owner-only permissions and writes token updates atomically. On Windows, protection
also depends on the current user's directory ACL.

The OAuth flow uses a localhost loopback callback for a Desktop application. `--no-browser` prints
the URL but still requires opening it on the same machine; deprecated copy/paste OAuth is not used.

## Repository configuration

The committed configuration at `tools/project_hub/config/project-hub.json` points to DeckAgent's
private Project Hub Spreadsheet ID, `1Ot5lOjMZlpQpq6wvNfLN7GGR8vG8Wae5ohBd1waHi8c`. The ID is a
resource identifier, not an authorization secret; Google still enforces the private spreadsheet
ACL for each authenticated member.

For a local override without editing the shared config:

```text
PROJECT_HUB_SPREADSHEET_ID=<spreadsheet-id>
```

The same JSON file maps logical tables, source sheet names, semantic headers, canonical TSV names,
stable-ID patterns, reference targets, required fields, and controlled values. Column reordering is
safe because mapping is by header. Missing required or duplicate headers stop sync with an explicit
schema error. Unknown columns follow the documented allowlist policy below.

## Changing the Project Hub schema

Spreadsheet structure knowledge belongs in
`tools/project_hub/config/project-hub.json`. `schemaDefaults` currently declares that semantic
headers are on row 2, the canonical ID field is `id`, unknown source columns are ignored, and rows
containing only a generated ID are templates. Each `tables` entry declares the source sheet,
output filename, stable-ID pattern, ordered canonical columns, required row values, controlled
values, explicit reference targets, and any row rules.

The maintenance contract is:

- **Add/delete rows or edit values:** no code or config change. Run `sync`. Rows with meaningful
  non-ID data are included; empty rows and generated-ID-only template rows are excluded. A row with
  data but a missing ID is retained so validation can report it.
- **Reorder existing columns:** no change. Source values are located by semantic header and emitted
  in the configured canonical order, so reorder-only changes do not alter TSV bytes or hashes.
- **Add an ordinary unknown column:** no immediate change. The committed `unknownColumns: "ignore"`
  policy leaves it out of snapshots, validation, and hashes. This prevents accidental export of
  irrelevant or private data. To make the field visible to agents, add an explicit `columns` mapping
  with `source` and canonical `name`; add `headerRequired: false` if the source header may be absent.
- **Rename/remove a known required header:** sync fails with a schema error naming the missing
  header. Coordinate the Sheet change and update that column's `source` mapping. Keep its canonical
  `name` stable unless an intentional TSV schema migration is required.
- **Add a relationship column:** add its column mapping and a `references` array naming allowed
  logical table keys. Relationship parsing is never inferred from ID-like prose in ordinary fields.
- **Add a logical table:** add one `tables` entry with `sheet`, `file`, `idPattern`, and `columns`;
  declare `references`, `allowedValues`, `headerRequired`, or supported `rowRules` as needed. Add the
  real Sheet tab, bump `schemaVersion` because the snapshot contract changed, and add a sanitized
  fixture. No parser module is needed for a standard entity table.
- **Change a stable-ID prefix/format:** deliberately update `idPattern`, affected relationship
  targets, fixtures, and existing data together. Prefix changes within the standard
  `ABC-001`-style grammar require config only; a different token grammar requires a small parser
  change and tests rather than silent auto-detection.

Table-level `headerRow`, `idColumn`, `unknownColumns`, and `dropIdOnlyRows` values may override the
defaults when a real Sheet convention differs. Python changes are reserved for a genuinely new
normalization primitive, validation rule kind, Google API behavior, or reference token grammar—not
for ordinary rows, reordered columns, mapped fields, or standard new tables.

## Daily use

Install dependencies, authenticate, synchronize, and validate the snapshot from the repository root:

```bash
uv sync --project tools/project_hub --extra dev
./scripts/project-hub auth
./scripts/project-hub sync
./scripts/project-hub validate
```

`auth` establishes the user's Google credentials; `sync` fetches Sheets data and writes the local
snapshot; `validate` checks that snapshot. Software tests are separate: see the
[Development Guide](../development.md#development-commands) for the pytest command and its working
directory.

On Windows PowerShell, replace the wrapper with `./scripts/project-hub.ps1`. The wrappers pass the
committed config path and arguments to the tool. They first use the CLI in `tools/project_hub/.venv/`
if available, otherwise use `uv run` when uv is available, then fall back to `python -m project_hub`
with the tool's source directory prepended to `PYTHONPATH`. The uv path may create or update the
tool environment; the direct-Python fallback relies on dependencies already available to Python.

`sync` always performs a full remote metadata read plus one batched values read, so running it is the
force-refresh operation. It asks Google for `FORMATTED_VALUE`: formulas are returned as their
effective/calculated values in the spreadsheet locale, not as formula text. It then:

1. finds and maps semantic headers;
2. drops wholly empty and generated-ID-only template rows;
3. normalizes tabs/newlines/whitespace inside cells;
4. converts valid multi-ID fields to sorted, deduplicated semicolon lists;
5. validates IDs, required fields, references, enums, and traceability edges;
6. hashes canonical UTF-8 TSV bytes;
7. rewrites only changed table files; and
8. updates `manifest.json` with UTC sync time, row counts, hashes, and changed tables.

A data validation failure writes the fetched snapshot for diagnosis and returns exit code 1. A
remote schema mismatch does not update the snapshot and returns exit code 2.

`validate` never calls Google. It validates local TSV headers, row widths, stable IDs, required
fields, relation target types, broken IDs, canonical multi-value syntax, traceability targets, and
manifest hashes. Exit code 0 means valid; 1 means deterministic validation failed; 2 means a tool,
configuration, authentication, remote, or filesystem error occurred.

`status` is local by default and considers a snapshot older than 24 hours stale. Use
`status --max-age-hours 4`, `status --max-age-hours 0` (age check disabled), or `status --remote`
for a read-only ACL/API check.

## Wrong account, logout, and revocation

The tool deliberately does not request `email`, `profile`, Drive, or any write-capable scope, so it
cannot display the account email. To diagnose a wrong account:

1. run `./scripts/project-hub status --remote`;
2. if access/title is wrong, run `./scripts/project-hub logout --revoke`;
3. run `./scripts/project-hub auth --login-hint you@example.com` and select the intended account;
   and
4. rerun `./scripts/project-hub status --remote`.

On Windows use the same subcommands through `./scripts/project-hub.ps1`. A failed remote ACL check
does not fall back to the reference workbook; re-authenticate with an account that has Sheet access.

`logout` deletes only local auth state. `logout --revoke` first calls Google's revocation endpoint.
You can also revoke the app manually from the Google Account third-party access page.

If Workspace blocks authentication, an administrator must permit the OAuth app or the
`spreadsheets.readonly` scope. Do not work around the block with a shared account or service account.

## Schema observations from the reference export

These are implementation assumptions inferred from the development-only `.xlsx` fixture:

- Logical headers are on row 2; `Home` and hidden `_Config` are not snapshot tables.
- IDs are calculated down long template ranges. Row inclusion uses effective values and drops rows
  whose semantic record is blank apart from a generated ID; it does not depend on column A.
- Stable prefixes are `ACT`, `UC`, `R`, `C`, `BR`, `A`, `D`, `L`, `RK`, `SP`, `W`, `B`, `TR`, `EV`,
  `DL`, `WL`, and `DOC`, followed by a hyphen and at least three digits.
- Spreadsheet multi-reference cells currently use comma-separated IDs. Snapshot TSV uses semicolons
  so values are deterministic and grep-friendly.
- `_Config` helper formulas and dropdown ranges establish relation targets, but `_Config` values are
  not exported.
- `Traceability` is currently a record table (`TR-*`) with requirement/work/test/bug/evidence
  columns, rather than the generic three-column edge example in the proposal. The configured row
  rule requires a requirement plus at least one concrete target.
- Dates are kept as the sheet's formatted effective values. This avoids exposing formulas and
  matches what members see in Google Sheets, but date formatting changes will intentionally change
  hashes.

If the live spreadsheet differs, update `tools/project_hub/config/project-hub.json`; do not add
coordinate-based parser logic.

## Security boundaries

- The only requested Google scope is `spreadsheets.readonly`.
- There is no Google write code path.
- OAuth state and generated private snapshots are outside Git tracking.
- Spreadsheet cells are untrusted data, never agent instructions.
- Logs never print access or refresh tokens.
- Tests use small, synthetic fixtures and a mocked Sheets service.

Google references: [Desktop OAuth flow](https://developers.google.com/identity/protocols/oauth2/native-app),
[Sheets authorization scopes](https://developers.google.com/workspace/sheets/api/scopes), and
[`values.batchGet`](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet).
