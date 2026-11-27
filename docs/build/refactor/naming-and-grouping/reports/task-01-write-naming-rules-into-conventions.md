# Task 1 Report: Write the naming rules into the conventions

Read this file to know what Task 1 changed in the Coding Guidelines and the Project Structure, and which checks passed.

## Files changed

- `docs/conventions/code.md`, section `Naming`: the bullet about unclear names and role suffixes, and the new subsections `File vai trò và symbol` and `Tên cho khái niệm kỹ thuật`.
- `docs/conventions/code.md`, other sections: two bullets in `TypeScript` (no `enum`, no `I` prefix or `_` suffix), one bullet in `Contract` (ports `<Consumer><Provider>`), and one paragraph in `Validation` (Zod and `decode*`).
- `docs/conventions/code.md`, section `Error handling`: the new subsection `Đặt tên error`.
- `docs/conventions/project-structure.md`: the lines of `modules/<name>/` and `db/` in `Cấu trúc đích`, the row `src/db/` in `apps/host/`, and `Hình dạng module` (four files, `<name>.errors.ts`, `<name>.run-contribution.ts`, `<name>.migrations.ts`, link to the role file table).
- `docs/build/refactor/target-structure/README.md`: the first row of `Carried items`.

## Commands run

| Command | Exit code | Key output |
| --- | --- | --- |
| `corepack pnpm@11.28.5 check:docs` | 0 | `0 error(s) in 0 file(s)` |
| `uv run python -I "$USERPROFILE/.agents/skills/asd-ste100/scripts/ste-lint-vi.py" docs/conventions/code.md docs/conventions/project-structure.md` | 1 | One violation: `project-structure.md:3` sentence length. Line 3 is the purpose line, which this task did not change. No violation on a line that this task added |
| `git grep -n -E "typescript-enum\|role-file-symbol\|no-const-enum" -- docs/conventions` | 0 | Two lines, both in `docs/conventions/code.md` |

## STOP and retry

The command for the Vietnamese linter in Step 5 named `.agents/skills/asd-ste100/scripts/ste-lint-vi.py`. That file is not in the repository. It is in `$USERPROFILE/.agents/skills/asd-ste100/scripts/`. The planner changed the command in the task file, and the step ran one time with the new path.

## What the commands do not prove

- The checks do not prove that the Vietnamese text has the same meaning as [Naming Rules](../naming-rules.md). A person must compare the two.
- `role-file-symbol` applies only to the modules in `ROLE_FILE_MODULES`. The list is empty after Phase 1. Thus no module in the repository is checked yet, and the tag in `code.md` says so.
