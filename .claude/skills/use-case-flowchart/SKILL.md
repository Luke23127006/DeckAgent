---
name: use-case-flowchart
description: Generate or update the "Flow at a glance" Mermaid flowchart of a use case file in docs/spec/02-use-cases/ from its step and alternative-flow blocks. Use after any change to a use case's steps, alternative flows, or their At or End fields, and when the generated block is missing or stale. Not for other diagrams; use mermaid-markdown for those.
---

# Use case flowchart

The diagram is a view. The step blocks and flow blocks are the source. Never change a block to make the diagram fit.

Follow the steps in order and apply the rules literally. The same file must always give the same output. If a case is not covered by a rule, stop and report it; do not choose.

Reference output: the block in `docs/spec/02-use-cases/UC-001.md`. Input and rules here must reproduce it exactly.

## 1. Parse

Read the target use case file only.

- Step: heading `### S<n> · <name>` under `## Main flow`. Keep file order.
- Alternative flow: heading `### A<n> · <name>` under `## Alternative flows`. Read its `- **At:**` and `- **End:**` lines.
- `At`: split on `,` and trim. Each part is a step ID.
- `End`: if it has the form `S<n>: <value> · S<m>: <value>`, there is one value per `At` step. Otherwise the one value applies to every `At` step.
- A value is exactly one of:

| Value | Meaning |
|---|---|
| `Returns to S<n>` or `Continues at S<n>` | target is step `S<n>` |
| `Same step` | no edge |
| `Ends` | target is `DONE` |
| `Goes to UC-<id>` | target is the use case node `UC-<id>` |
| `Goes to UC-? (<topic>)` | target is a use case that is not written yet. The topic names it |

Stop and report, writing nothing, when: a heading has no name; a `Goes to UC-?` has no topic; `At` or `End` is missing; `At` or `End` names a step that does not exist; a value is not in the table; an `End` with per-step values lacks one of the `At` steps; an ID appears twice; there is no step.

## 2. Build edges

1. Make one pair `(start step, target)` for each `At` step of each flow.
2. For a `Same step` pair, add the flow ID to the not-drawn list. Make no edge.
3. Group pairs that have the same start and target. List their flow IDs in numeric order.
4. Edge label: the IDs joined by `, `. Write a run of 3 or more consecutive numbers as a range (`A2-A6`). Write a run of 1 or 2 as single IDs (`A18, A19`).
5. Order edges by start step number, then by the lowest flow number in the group.

## 3. Write the Mermaid text

Indent every line inside the block by 2 spaces. Use these lines in this order:

1. `flowchart TD`
2. One node per step, in order: `S1["S1 · <name>"]`. Replace any `"` in a name with `'`.
3. `DONE(["Use case ends"])`, only if some edge targets `DONE`.
4. One node per use case target, in order of first edge. For `UC-005`: `UC005["UC-005"]`. For `UC-? (<topic>)`: `UCQ1["UC-? · <topic>"]`, then `UCQ2`, and so on in that order. The same topic text is the same node.
5. One chain line `S1 --> S2 --> ... --> S<n>`, only if there are 2 or more steps.
6. The edges from section 2: `S1 -.->|"A1"| S2`.

Use no other node, style, class, color or HTML. Never use `end` as a node ID.

## 4. Write the block

The block is exactly these lines:

````
<!-- BEGIN generated: use-case-flowchart -->
```mermaid
<text from section 3>
```

*Solid arrows are the main flow. Dotted arrows are alternative flows, labelled with their IDs.*
*Not drawn (the flow stays at the same step): <list>.*
<!-- END generated: use-case-flowchart -->
````

`<list>`: `none` when empty; `A12` for one; `A12 and A13` for two; `A12, A13 and A24` for more. Sort numerically.

## 5. Write to the file

- Read the file first. Use one Edit. Its `old_string` runs from the BEGIN line to the END line, both included. Its `new_string` is the whole new block and starts with the BEGIN line. (A Claude Code hook skips edits that start this way.)
- If the markers are missing, insert `## Flow at a glance`, a blank line, and the block right after the frontmatter, before the first other heading.
- Change nothing outside the markers.

## 6. Portability

Follow "Portability defaults" in [mermaid-markdown](../mermaid-markdown/SKILL.md). Readers use GitHub and VS Code 1.121 or later (built-in Mermaid preview).

## 7. Verify and report

- Every step is a node. Every `(At step, End)` pair of every flow is in one edge label or in the not-drawn list. No edge exists without a pair.
- If `npx` is available, check the syntax with Mermaid CLI. Say whether you ran it.
- More than 15 nodes: report it. Do not split the diagram.
- Report: the file, the number of edges, the not-drawn list, and the checks you ran.
