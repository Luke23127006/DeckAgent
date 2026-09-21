# OpenCodeReview

This guide explains how team members install and use the repository-local
OpenCodeReview integration. OpenCodeReview is development tooling, not a DeckAgent
runtime dependency. For canonical skill and mirror maintenance, see
[Shared agent skill maintenance](../agents/skill-maintenance.md).

## One-time setup after cloning

Requirements:

- Git 2.41 or newer;
- Node.js 18 or newer;
- npm.

Install the locked workspace dependencies from the repository root:

```powershell
# Windows PowerShell
npm.cmd ci
```

```bash
# macOS or Linux
npm ci
```

Do not install OpenCodeReview globally. `node_modules/` stays uncommitted;
`package.json` and `package-lock.json` provide the reproducible setup. Delegation
mode uses the active coding agent as the reviewer, so no separate OCR API key or
LLM endpoint is required.

Verify the local CLI:

```powershell
npm.cmd run ocr -- version
```

Use `npm` instead of `npm.cmd` on macOS or Linux.

## Ask an agent to review

The normal interface is a request such as:

```text
Review the current changes.
Use OpenCodeReview to review this branch against main.
Review commit <sha> and report findings only.
Review and fix high-confidence findings in the current changes.
```

The agent loads `open-code-review-delegate`, asks OCR which files and rules apply,
reviews every selected diff, and reports findings with coverage. A review request
alone does not authorize fixes; say "review and fix" when fixes are wanted.

## Run the selection commands manually

Manual commands are useful for inspecting or troubleshooting what the agent will
review. They do not call an LLM and do not perform the review themselves.

Preview current staged, unstaged, and untracked changes:

```powershell
npm.cmd run ocr:preview -- --background "Project Hub tooling changes"
```

Preview a commit:

```powershell
npm.cmd run ocr:preview -- --commit <sha> --background "Reason for the change"
```

Preview a branch range:

```powershell
npm.cmd run ocr:preview -- --from main --to <branch> --background "Reason for the change"
```

Inspect the rule applied to files:

```powershell
npm.cmd run ocr:rules -- tools/project_hub/src/project_hub/cli.py
```

On macOS or Linux, replace `npm.cmd` with `npm`. Project-specific filters and
rules live in `.opencodereview/rule.json`. Generated Claude/Codex skill mirrors
are excluded so the canonical `.agents/skills/` copy is reviewed once.

## Team update workflow

After pulling changes, run `npm ci` when `package-lock.json` changed. Do not
commit `node_modules/`, credentials, OCR user configuration, or review output
containing sensitive code.

## Troubleshooting

### PowerShell blocks npm.ps1

Use `npm.cmd`, as shown above. Do not weaken the machine execution policy just
for this repository.

### OCR command is missing

Run `npm ci` from the repository root, then retry
`npm.cmd run ocr -- version`. Do not fall back to a global installation.

### npm reports `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

This usually means an antivirus or company proxy is inspecting HTTPS. Configure
npm/Node to use the organization-approved CA certificate, or ask IT to exempt the
npm registry according to team policy. Keep TLS verification enabled; do not use
`strict-ssl=false`. The CA belongs to the machine or organization and must not be
committed to this repository.
