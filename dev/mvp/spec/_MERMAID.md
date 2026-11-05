# Gate: Mermaid

Applies to **every Mermaid diagram** embedded in `dev/mvp/spec/` (the use case sequence diagram and any other flowchart or state diagram). A diagram is a **view**: the **source of truth is the text blocks**. **Never hand-edit a diagram** to make it "match".

"Check" is the **intended layer**: *Lint* = machine-checkable, *Review* = human judgment, *CI* = cross-check. There is **no tool yet**, so **review currently does both Lint and CI**.

| ID | Criterion | Prevents | Check |
|---|---|---|---|
| MG-01 | Valid Mermaid syntax, renders on GitHub and VS Code (the conservative subset in the `mermaid-markdown` skill) | A diagram that breaks when viewed | Lint |
| MG-02 | The diagram is a view. The source block is the truth. Change the source, then regenerate the diagram — do not edit the diagram to match the source | Two sources drifting apart | CI |
| MG-03 | Each participant/node/message maps 1-to-1 to a source element. Nothing extra, nothing missing, nothing duplicated | The diagram ceasing to be a faithful view | CI |
| MG-04 | Labels are short, single-meaning, and follow the language policy (`_STYLE.md`); IDs stay in English | A label two readers read two ways | Review |
| MG-05 | No hardcoded colors, theme, class, HTML, or style. Readable on both light and dark backgrounds | A diagram that only looks right on one theme | Lint |
| MG-06 | Branches use the right Mermaid structure (`alt`/`opt`/`loop`), not "flattened" in a way that loses meaning. A branch that does not express cleanly (e.g. "back to S2") is noted under the diagram | A branch lost when drawn | Review |
| MG-07 | Arrow direction is correct (user → system is a request, system → user is a response). Each participant is declared exactly once | Wrong direction misreading the interaction | Review |
| MG-08 | The diagram answers the main question at a glance. Secondary detail stays in prose | The diagram becoming a wall of text | Review |
| MG-09 | A change to a source block regenerates the diagram in the same change | The diagram lagging the source | CI |
| MG-10 | No beta features or features unsupported by the target renderer | A diagram that runs on only one renderer | Review |

## Illustrations

**MG-03 and MG-06: faithful diagram with branches.**

> Fail: a sequence diagram draws only the main flow and drops the "lost connection" branch because it is `Returns to S2`.
> Pass: the main flow is drawn linearly; under the diagram is `*Not drawn (back-to-step branch): A3.*`, and block `A3` still keeps its full `At/Ends/When/System`.

**MG-04: single-meaning label, not interface.**

> Fail: `User->>System: click the Play button` — the label describes a widget.
> Pass: `User->>System: request playback` — the label is the intent.
