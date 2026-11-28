# Task 15: Slice 2B Project Structure Conventions Report

Read this file to review the Slice 2B contract-parity rule update applied to `docs/conventions/project-structure.md` and the documentation and STE check output [[1]](#ref-1) [[2]](#ref-2).

## Summary of convention updates

| Finding | Section | Line(s) in `docs/conventions/project-structure.md` | Change |
| --- | --- | --- | --- |
| D8 | `### packages/` | 106, 111 | Replaced the `host/contracts/` and `session/persistence/` two-copy request rule with one rule for `host/contracts/`: it keeps an independent wire DTO copy shared with `session/persistence/`, `presentation/deck/`, and `presentation/design/`, guarded at compile time by `tsc -b` in `host/api/src/contract-sync.ts` |
| D14 | `### packages/` | 106, 111 | Covered by the same rule: it extends the parity scope from `session/persistence/` to `presentation/deck/` and `presentation/design/` |
| D8, D14 | `### packages/` | 106 | Changed the lead-in from `Ba điểm dễ sai trong các package trên:` to `Bốn điểm dễ sai trong các package trên:` because the section now lists four bullets |

## Verification

Command:

```bash
corepack pnpm@11.28.5 check:docs
```

Output (exit code `0`):

```text
$ node scripts/check-docs.mjs
check-docs: 112 file(s) checked, 0 error(s) in 0 file(s)
```

Command:

```bash
uv run python -I .agents/skills/asd-ste100/scripts/ste-lint.py --baseline 5 docs/conventions/project-structure.md
```

Output (exit code `0`):

```text
docs/conventions/project-structure.md:3:1 long-sentence: Sentence has 34 words (cap 25). Split it. [34 words]
docs/conventions/project-structure.md:47:3 long-sentence: Sentence has 33 words (cap 25). Split it. [33 words]
docs/conventions/project-structure.md:95:81 long-sentence: Sentence has 28 words (cap 25). Split it. [28 words]
docs/conventions/project-structure.md:95:283 long-sentence: Sentence has 27 words (cap 25). Split it. [27 words]
docs/conventions/project-structure.md:154:74 semicolon: STE bans the semicolon (Rule 8.1). Split into separate sentences. [;]

5 violations (5 hard, baseline 5), 1866 words, 0.3 per 100 words
Hedges/modality (may, might, could) are never flagged: confidence is content.
```

The 5 hard violations are pre-existing. They are at lines 3, 47, 95, and 154, outside the edited lines 106 and 111. The `--baseline 5` value equals this pre-existing count. The task file plan named a `ste-lint-vi.py` script. That script does not exist in the repository, and the `ste-vi` skill states that Vietnamese has no linter. The owner approved `ste-lint.py --baseline 5` as the check, and the task file now names that script [[2]](#ref-2).

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 15 Plan](../plan/task-15-update-slice-2b-conventions.md)
