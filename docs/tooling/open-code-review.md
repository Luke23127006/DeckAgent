# OpenCodeReview

This guide explains how team members install and use the repository-local
OpenCodeReview integration. OpenCodeReview is development tooling, not a DeckAgent
runtime dependency. For canonical skill and mirror maintenance, see
[Shared agent skill maintenance](../agents/skill-maintenance.md).

## Review scope

OpenCodeReview's delegation mode reviews the changed files in the workspace diff.
The project rule file [`.opencodereview/rule.json`](../../.opencodereview/rule.json)
does two things:

- it excludes the generated Claude/Codex skill mirrors and `node_modules/`; and
- it adds a DeckAgent-specific rule for `.agents/**/*` (canonical skill ownership,
  manifest consistency, portable instructions, provenance, license handling, and
  mirror synchronization), merged with OCR's built-in system rules.

Files outside `.agents/**/*` — including DeckAgent application code, config, tests,
and CI — are reviewed against OCR's built-in system rules. Keep this scope unless a
confirmed defect requires a change.

## One-time setup after cloning

Requirements:

- Git 2.41 or newer;
- Node.js matching `package.json` `engines`;
- pnpm `11.28.5` (pinned by `package.json` `packageManager`).

Install the locked workspace dependencies from the repository root:

```powershell
# Windows PowerShell
pnpm.cmd install --frozen-lockfile
```

```bash
# macOS or Linux
pnpm install --frozen-lockfile
```

Do not install OpenCodeReview globally. `node_modules/` stays uncommitted;
`package.json` and `pnpm-lock.yaml` provide the reproducible setup. Delegation
mode uses the active coding agent as the reviewer, so no separate OCR API key or
LLM endpoint is required.

`pnpm-workspace.yaml` records the build allowances this pin needs: the pinned
OpenCodeReview version installs its platform binary, with a checksum-validated
download as fallback, and `node-addon-require-builtin` keeps its install hook
disabled as upstream specifies. Keep the platform optional dependencies
installed; do not prune them.

Verify the local CLI:

```powershell
pnpm.cmd ocr --version
```

Use `pnpm` instead of `pnpm.cmd` on macOS or Linux.

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
pnpm.cmd ocr:preview --background "Reason for the change"
```

Preview a commit:

```powershell
pnpm.cmd ocr:preview --commit <sha> --background "Reason for the change"
```

Preview a branch range:

```powershell
pnpm.cmd ocr:preview --from main --to <branch> --background "Reason for the change"
```

Inspect the rule applied to files:

```powershell
pnpm.cmd ocr:rules .agents/scripts/sync_skill_mirrors.py
```

On macOS or Linux, replace `pnpm.cmd` with `pnpm`. Project-specific filters and
rules live in `.opencodereview/rule.json`. Generated Claude/Codex skill mirrors
are excluded so the canonical `.agents/skills/` copy is reviewed once.

## Team update workflow

After pulling changes, run `pnpm install --frozen-lockfile` when `pnpm-lock.yaml`
changed. Do not commit `node_modules/`, credentials, OCR user configuration, or
review output containing sensitive code.

## Troubleshooting

### PowerShell blocks pnpm.ps1

Use `pnpm.cmd`, as shown above. Do not weaken the machine execution policy just
for this repository.

### OCR command is missing

Run `pnpm install --frozen-lockfile` from the repository root, then retry
`pnpm.cmd ocr --version`. Do not fall back to a global installation.

### pnpm reports UNABLE_TO_VERIFY_LEAF_SIGNATURE

This usually means an antivirus or company proxy is inspecting HTTPS. Configure
pnpm/Node to use the organization-approved CA certificate, or ask IT to exempt the
npm registry according to team policy. Keep TLS verification enabled; do not use
`strict-ssl=false`. The CA belongs to the machine or organization and must not be
committed to this repository.
