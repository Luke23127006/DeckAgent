# Task 33: Slice 2D Project Structure Conventions Report

Read this file to review the Slice 2D browser transport error rule applied to `docs/conventions/project-structure.md` and the documentation and STE check output [[1]](#ref-1) [[2]](#ref-2) [[3]](#ref-3) [[4]](#ref-4).

## Convention change

Line 84 of `docs/conventions/project-structure.md` gave `error hiển thị cho Browser` to `src/browser/transport/`. That wording conflicted with the error ownership table in [Coding Guidelines](../../../../conventions/code.md), where Browser owns `Thông báo lỗi hiển thị cho người dùng` (BB9, BD7) [[5]](#ref-5) [[3]](#ref-3) [[4]](#ref-4). The wording also let UI error copy move into `transport/image-review-client.ts` (BB9) [[3]](#ref-3).

The new rule splits the two responsibilities. The transport layer maps HTTP/SSE failures to typed client error codes. The UI layer writes the error text that a user reads.

| Finding | Column | Before | After |
| --- | --- | --- | --- |
| BB9, BD7 | `Sở hữu` | ``HTTP/SSE client, serialize request, decode response, error hiển thị cho Browser`` | ``HTTP/SSE client, serialize request, decode response, ánh xạ lỗi HTTP/SSE sang mã lỗi typed của client. Thông báo lỗi cho người dùng thuộc `src/browser/` hoặc `src/browser/features/` `` |
| BB9, BD7 | `Không sở hữu` | `Permission policy, Request Lifecycle, domain state transition` | `Permission policy, Request Lifecycle, domain state transition, bảng văn bản lỗi UI` |

This change keeps the `Câu hỏi` column of line 84 as it was.

## Verification

Command:

```bash
corepack pnpm@11.28.5 check:docs
```

Output (exit code `0`):

```text
$ node scripts/check-docs.mjs
check-docs: 151 file(s) checked, 0 error(s) in 0 file(s)
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

5 violations (5 hard, baseline 5), 1884 words, 0.3 per 100 words
Hedges/modality (may, might, could) are never flagged: confidence is content.
```

The 5 hard violations are pre-existing, at lines 3, 47, 95, and 154. Line 84 adds no hard violation. The `--baseline 5` value equals this pre-existing count.

## What the commands do not prove

- `check:docs` checks the file structure, the purpose line, relative links, heading links, and citations in `docs/`. It does not check that the sentence is true for the code, and it does not prove that `src/browser/transport/` holds no UI copy today. Task 35 moves `imageFailure` into `browser/features/deck/` (BB3, BD1).
- `ste-lint.py` checks structural rules only: sentence length, semicolons, phrasal verbs, nominalization, passive voice, and compound tenses. It does not check word meaning, and it does not prove that a reader cannot misread the new Vietnamese sentence. The repository has no Vietnamese linter.
- Neither command fails when a later edit puts UI copy back into `src/browser/transport/`. Only review enforces the rule after this task.

## References

1. <a id="ref-1"></a>[Module Design Refactor Implementation Plan](../plan/README.md)
2. <a id="ref-2"></a>[Task 33: Update Project Structure conventions for Slice 2D](../plan/task-33-update-slice-2d-conventions.md)
3. <a id="ref-3"></a>[Task 30: Browser Boot, Shell Utilities, and Transport Diagnosis Report](task-30-diagnose-browser-boot-shell-and-transport.md)
4. <a id="ref-4"></a>[Task 31: Browser Features Deck Diagnosis Report](task-31-diagnose-browser-deck-feature.md)
5. <a id="ref-5"></a>[Coding Guidelines](../../../../conventions/code.md)
