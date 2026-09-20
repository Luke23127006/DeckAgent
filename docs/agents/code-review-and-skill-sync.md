# Code review and skill synchronization

This guide explains how team members use the repository-local OpenCodeReview integration and maintain the shared agent skills. OpenCodeReview is development tooling, not a DeckAgent runtime dependency.

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

Do not install OpenCodeReview globally. `node_modules/` stays uncommitted; `package.json` and `package-lock.json` provide the reproducible setup. Delegation mode uses the active coding agent as the reviewer, so no separate OCR API key or LLM endpoint is required.

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

The agent loads `open-code-review-delegate`, asks OCR which files and rules apply, reviews every selected diff, and reports findings with coverage. A review request alone does not authorize fixes; say “review and fix” when fixes are wanted.

## Run the selection commands manually

Manual commands are useful for inspecting or troubleshooting what the agent will review. They do not call an LLM and do not perform the review themselves.

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

On macOS or Linux, replace `npm.cmd` with `npm`. Project-specific filters and rules live in `.opencodereview/rule.json`. Generated Claude/Codex skill mirrors are excluded so the canonical `.agents/skills/` copy is reviewed once.

## Add or update a skill

`.agents/skills/` is the source of truth. Never edit `.claude/skills/` or `.codex/skills/` directly.

1. Add or update `.agents/skills/<skill-name>/`.
2. Ensure `SKILL.md` has a valid `name` and discriminating `description`. Retain required supporting files and licenses.
3. Record the source, pinned version or commit, license, dependencies, compatibility decision, and local adaptations in `.agents/skill-manifest.yaml`.
4. Add or update the trigger in `docs/agents/development-workflow.md` when the skill represents a selectable workflow phase.
5. Regenerate the committed mirrors:

   ```powershell
   python .agents/scripts/sync_skill_mirrors.py
   ```

6. Validate that no mirror drift remains:

   ```powershell
   python .agents/scripts/sync_skill_mirrors.py --check
   ```

7. Review `git status --short` and commit the canonical skill, manifest, router, and both generated mirrors together.

The synchronizer refuses to remove a skill that exists only in a mirror. Promote that skill into `.agents/skills/` before syncing.
It also refuses to replace a mirror containing tracked, untracked, or ignored local
changes. Move intended edits into `.agents/skills/` or restore the mirror first.
Use `--force` only when those mirror-only changes are known to be disposable.

## Team update workflow

After pulling changes:

- run `npm ci` when `package-lock.json` changed;
- no npm command is needed when only skills changed, because both mirrors are committed;
- run the mirror check before committing any skill change.

Do not commit `node_modules/`, credentials, OCR user configuration, or review output containing sensitive code.

## Troubleshooting

### PowerShell blocks npm.ps1

Use `npm.cmd`, as shown above. Do not weaken the machine execution policy just for this repository.

### OCR command is missing

Run `npm ci` from the repository root, then retry `npm.cmd run ocr -- version`. Do not fall back to a global installation.

### npm reports `UNABLE_TO_VERIFY_LEAF_SIGNATURE`

This usually means an antivirus or company proxy is inspecting HTTPS. Configure
npm/Node to use the organization-approved CA certificate, or ask IT to exempt the
npm registry according to team policy. Keep TLS verification enabled; do not use
`strict-ssl=false`. The CA belongs to the machine or organization and must not be
committed to this repository.

### A mirror differs from the canonical skill

Edit `.agents/skills/`, run the sync command, and then run `--check`. Do not repair `.claude/skills/` or `.codex/skills/` manually.
