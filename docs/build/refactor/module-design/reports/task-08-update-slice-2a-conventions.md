# Task 8: Slice 2A Project Structure Conventions Report

Read this file to review the Slice 2A ownership and dependency rule updates applied to `docs/conventions/project-structure.md` and the documentation check output [[1]](#ref-1) [[2]](#ref-2).

## Summary of convention updates

| Finding | Section | Line(s) in `docs/conventions/project-structure.md` | Change |
| --- | --- | --- | --- |
| F15 | `### packages/`, `### Runtime` | 95, 127 | Clarified that `host/api/` does not own domain package runtime logic and `Local Host transport` may depend on type-level domain reader ports (`DeckReader`, `OutlineReader`) but not domain runtime classes or functions |
| F16 | `### packages/` | 95, 96 | Moved pure wire JSON payload decoding (`decodeAgentRequest`) from `host/api/` to `host/contracts/`, keeping HTTP framing in `host/api/` |
| P8 | `### packages/` | 111 | Documented independent request type copies in `host/contracts/` and `session/persistence/` with compile-time parity checking in `host/api/` (`tsc -b`) |
| P9 | `### packages/` | 102 | Excluded volatile in-memory draft state from `session/persistence/` (`apps/web/` owns it) |

## Verification

Command:

```bash
corepack pnpm@11.28.5 check:docs
```

Output (exit code `0`):

```text
$ node scripts/check-docs.mjs
check-docs: 100 file(s) checked, 0 error(s) in 0 file(s)
```

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 8 Plan](../plan/task-08-update-slice-2a-conventions.md)
