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
Each member receives a separate OAuth token at `token.json` beside their local client file. Never
share member tokens, commit the client JSON, or commit `.project-hub/snapshot/`. A validation exit
code of 1 can represent deterministic issues in current project data; it is distinct from an OAuth,
remote-access, or schema failure (exit code 2).

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
The tool attempts owner-only permissions and writes token updates atomically. On Windows, protection
also depends on the current user's directory ACL.

The OAuth flow uses a localhost loopback callback for a Desktop application. `--no-browser` prints
the URL but still requires opening it on the same machine; deprecated copy/paste OAuth is not used.

## Repository configuration

The committed configuration at `tools/project_hub/config/project-hub.json` points to DeckAgent's
private Project Hub Spreadsheet ID, `13CmZuYEccwQ3zOHTjPiFdSjV-ypW7hmMnWBZQyGejcM`. The ID is a
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

Table-level `headerRow`, `idColumn`, `unknownColumns`, `dropIdOnlyRows`, and `hasId` values may
override the defaults when a real Sheet convention differs. Python changes are reserved for a
genuinely new normalization primitive, validation rule kind, Google API behavior, or reference
token grammar—not for ordinary rows, reordered columns, mapped fields, or standard new tables.

- **A logical table has no stable ID column** (for example a plain activity log): set
  `"hasId": false` on that table and omit `idPattern`. `headerRow` must then be configured
  explicitly (table-level or via `schemaDefaults`) because header auto-detection relies on
  locating the configured ID column's source header. ID presence/format/duplicate checks and
  `dropIdOnlyRows` template filtering are skipped for that table; required-field, controlled-value,
  and relationship validation still run normally. No other logical table may declare a `references`
  target pointing at an ID-less table, since it has no stable ID for other rows to point to.

## Daily use

Install and test:

```bash
uv sync --project tools/project_hub --extra dev
./scripts/project-hub auth
./scripts/project-hub sync
./scripts/project-hub validate
```

On Windows PowerShell, replace the wrapper with `./scripts/project-hub.ps1`. The root wrappers
contain no Project Hub behavior; they delegate to the isolated uv project under
`tools/project_hub/`.

`sync` always performs a full remote metadata read plus one batched values read, so running it is the
force-refresh operation. It asks Google for `FORMATTED_VALUE`: formulas are returned as their
effective/calculated values in the spreadsheet locale, not as formula text. It then:

1. finds and maps semantic headers;
2. drops wholly empty and generated-ID-only template rows;
3. normalizes tabs/newlines/whitespace inside cells;
4. converts valid multi-ID fields to sorted, deduplicated semicolon lists;
5. validates IDs, required fields, references, enums, and traceability edges;
6. only if validation passes: commits stale-file removal (for tables no longer declared in
   config), changed table rewrites, and the `manifest.json` update (UTC sync time, row counts,
   hashes, changed tables, removed files) as one unit — every file touched is backed up first,
   and if any step fails, everything touched in that attempt is restored to its prior content
   (or removed, if it did not exist before), so a failed sync never leaves a mix of new and old
   snapshot state.

A data validation failure does not touch `.project-hub/snapshot/` at all: the previously published,
already-validated snapshot is left exactly as it was, sync reports the issues, and it returns exit
code 1. This keeps an invalid remote edit from silently clobbering the last-known-good local
snapshot; fix the source data and rerun `sync` to publish. A remote schema mismatch does not update
the snapshot and returns exit code 2.

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

These are implementation assumptions inferred from the `.xlsx` reference export (last reconciled
2026-09-22, schemaVersion 2):

- Logical headers are on row 2; `Home`, `Operating Rules`, and hidden `_Config` are not snapshot
  tables — they hold narrative text or dropdown-source lists, not row-based entities.
- IDs are calculated down long template ranges. Row inclusion uses effective values and drops rows
  whose semantic record is blank apart from a generated ID; it does not depend on column A.
- Stable prefixes are `ACT`, `UC`, `R`, `C`, `BR`, `A`, `D`, `L`, `RK`, `SP`, `W`, `B`, and `DOC`,
  followed by a hyphen and at least three digits. The `Updates` table (`hasId: false`) has no
  stable ID; rows are the raw activity log and are identified positionally.
- Spreadsheet multi-reference cells currently use comma-separated IDs. Snapshot TSV uses semicolons
  so values are deterministic and grep-friendly.
- `_Config` helper formulas and dropdown ranges establish relation targets and controlled-value
  domains, but `_Config` values are not exported. Several sheet columns share one `_Config` dropdown
  range (for example `Scope` on Requirements, Business Rules, and Documents); the configured
  `allowedValues` follow the dropdown's actual domain, not a narrower value set assumed per field.
- `Traceability`, `Evidence`, `Daily`, and `Weekly` (present in earlier schema versions) were removed
  from the live spreadsheet; there is no successor table for `Evidence` or `Weekly`. `Daily` was
  replaced by the ID-less `Updates` table. Columns that referenced the removed `evidence` table
  (`Assumptions.Support / Source`, `Learnings.Supporting Artifact`) are now free text, not relation
  fields. `Decisions.Related IDs`, `Risks.Related IDs`, and `Requirements.Related Tests` were removed
  outright with no replacement column.
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
