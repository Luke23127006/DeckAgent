# Task 1: Align comment policy and enable TypeScript safety rules in oxlint

Read this file to learn the steps of Task 1, which aligns the comment policy with `docs/conventions/code.md` and enables TypeScript safety rules in `.oxlintrc.json`.

**Read first:**
- [Global Constraints](README.md#global-constraints) in `README.md`
- `docs/conventions/code.md` (lines 17-38)
- `docs/conventions/docs.md`
- `docs/build/refactor/rules/plan/README.md` (lines 15-55 and lines 81-96)
- `.oxlintrc.json`
- `.agents/skills/asd-ste100/SKILL.md`

**Files:**
- Change: `docs/build/refactor/rules/plan/README.md` (lines 24, 29-41, 49, 86-87)
- Change: `.oxlintrc.json` (lines 1-11)
- Change: this task file, for its completion checkboxes only.

**Interfaces:**
- Uses: nothing from earlier tasks.
- Produces: `.oxlintrc.json` with `typescript/ban-ts-comment` and `typescript/no-explicit-any` set to `error`.

**STOP when:**
- The output of a command does not match `Expected`.
- A file is different from the description in this task.
- The task needs a decision that this task does not contain.
- The same step failed two times.

**Forbidden:**
- Change a file that is not in the `Files` block.
- Delete, skip or weaken a test or a check.
- Add a comment, a lint-disable directive or `@ts-expect-error`.
- Commit or push.

- [x] **Step 1: Update the comment policy in `docs/build/refactor/rules/plan/README.md`**

Make these four edits in `docs/build/refactor/rules/plan/README.md`:

1. Replace line 24 (`| Comments in code | ... |`) with:

```markdown
| Comments in code | Comments obey `docs/conventions/code.md` (five listed reasons only). Lint-disable directives and TypeScript suppression comments (`@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`) remain forbidden. |
```

2. Replace lines 29-41 (the `## Comment scope` section) with:

```markdown
## Comment scope

The suppression ban applies to each file that git tracks or that is new and not ignored, in `apps/`, `packages/`, `scripts/` and `tests/`, with one of these extensions: `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`.

The rule does not apply to:

- Text in strings and template literals.
- Paths that contain `/lib/`, `/dist/` or `node_modules/`.
- `docs/00-old/`.

Forbidden directives: lint-disable directives, `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck` and commented-out code. Other comments obey the five allowed reasons in `docs/conventions/code.md`.
```

3. Replace line 49 (`- New code files contain no comments of any kind. Names, types and tests carry the meaning.`) with:

```markdown
- Comments in new code files obey `docs/conventions/code.md`. Lint-disable directives and TypeScript suppression comments are forbidden.
```

4. Replace lines 86-87 (`- Add the oxlint rule ...` and `- Remove the existing comments ...`) with:

```markdown
- Audit existing comments with a KEEP/REMOVE decision table against `docs/conventions/code.md` (moved to `docs/build/refactor/codebase/plan/README.md`).
```

- [x] **Step 2: Check Markdown and STE-100 rules on the updated plan README**

Run: `node scripts/check-docs.mjs`
Expected: PASS. The output contains `0 error(s) in 0 file(s)`.

Run: `uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py docs/build/refactor/rules/plan/README.md`
Expected: PASS. The command exits with code 0 and prints `0 violations`.

- [x] **Step 3: Enable `typescript/ban-ts-comment` and `typescript/no-explicit-any` in `.oxlintrc.json`**

Replace `.oxlintrc.json` with this exact content:

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "error"
  },
  "rules": {
    "eslint/no-shadow": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/prefer-add-event-listener": "off",
    "typescript/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": true,
        "ts-ignore": true,
        "ts-nocheck": true
      }
    ],
    "typescript/no-explicit-any": "error"
  }
}
```

- [x] **Step 4: Run oxlint across the repository**

Run: `corepack pnpm@11.28.5 lint`
Expected: PASS. The command exits with code 0 and prints `Found 0 warnings and 0 errors.`.

- [x] **Step 5: Check that `typescript/ban-ts-comment` and `typescript/no-explicit-any` reject a violation**

Run:

```bash
node -e "const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');const d=fs.mkdtempSync(path.join(os.tmpdir(),'ox-t1-'));const f=path.join(d,'bad.ts');fs.writeFileSync(f,'// @ts-expect-error test\nexport const x: any = 1\n');const r=cp.spawnSync(path.resolve('node_modules/.bin/oxlint.cmd'),['-c',path.resolve('.oxlintrc.json'),f],{encoding:'utf8',shell:true});console.log('exit='+r.status);console.log(r.stdout);fs.rmSync(d,{recursive:true,force:true});"
```

Expected: The output contains `exit=1`, `ban-ts-comment` and `no-explicit-any`.

- [x] **Step 6: Report and stop**

Send this report:
- Files changed: list of paths
- Commands run, with the last 20 lines of output of each command
- Items that a decision table sent to the report (write `None`)
- What the commands do not prove
