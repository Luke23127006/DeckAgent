---
name: write-architecture-doc
description: Write or update a file in docs/architecture/ or an ADR in docs/architecture/30-decisions.md. Gives the method. Start from the use case and quality attribute IDs that the file must answer. Choose the C4 levels that the reader needs. Open the black box of each use case flow. Record the decisions with their trade-offs. Check each claim about the current code. Use when a feature area needs a design, when a design decision changes, or when the user asks to write or review architecture documentation. The format of the file is in docs/conventions/architecture.md, and this skill does not repeat it.
---

# Write an architecture document

This skill gives the method. The format of the output is in the convention files. Read them first and follow them:

- `docs/conventions/architecture.md`: sections, Drivers table, ADR parts and status.
- `docs/conventions/docs.md`: title and purpose line, citations, IDs.
- `docs/conventions/mermaid.md`: diagrams.
- `docs/conventions/project-structure.md` and the Tech Stack in `AGENTS.md`: the constraints that the design must keep.

Also read the lessons in `LESSONS.md` with the scope `Documentation`, `Code` or `General`.

## Steps

Copy this checklist. Mark each step when you complete it.

```
- [ ] 1. Drivers listed from docs/UCs
- [ ] 2. Views chosen for the reader
- [ ] 3. Black box of each key use case opened
- [ ] 4. Decisions recorded; trade-offs in ADRs
- [ ] 5. Claims about current code checked at the source
- [ ] 6. No value copied from docs/UCs
- [ ] 7. README matrix updated
- [ ] 8. pnpm check:docs passes and review-change has no open finding
```

### 1. Start from the drivers

Read the use case files and `docs/UCs/quality-attributes.md`. List the rules and scenarios that this file must answer. Each one becomes a row of the Drivers table: a phrase that tells the content, the ID, and the mechanism. A mechanism with no driver is a design without a reason. Remove it or find its driver. A driver with no mechanism is a gap. Write it as `Open` and add a question to `docs/open-questions.md`.

When a driver has no measure (for example "low latency"), do not invent one in the architecture file. Add the measure to the scenario in `docs/UCs/quality-attributes.md` with the method of the skill `write-use-case`.

### 2. Choose the views for the reader

Draw only the views that a reader of this file needs:

- C4 Context and Container are enough for most of the team. `00-system.md` has them.
- Draw a Component view only when the inside of one container is the subject of the file, for example the Strategy engine.
- Keep one abstraction level in each diagram. Do not mix containers and classes.

### 3. Open the black box

For each key use case, take its `sequenceDiagram` in `docs/UCs/` and draw the same flow with the internal parts: Web, API, Worker, database, queue, external services. Keep the rule IDs in the labels, so that the reader can go from a step to its rule. For each quality attribute scenario, show the path of the stimulus through the parts, and the part that gives the response measure.

### 4. Record the decisions

- A decision without a real alternative goes in the `Quyết định` table of the file.
- A decision with a trade-off between options goes in an ADR. Before you write a new ADR, search `30-decisions.md` for an ADR on the same subject. When a decision changes, follow the ADR rules in `docs/conventions/architecture.md`.
- Write each option with what it makes easier and what it makes harder. Write the condition that makes the team look at the decision again.

### 5. Check each claim about the current code

The architecture file tells the intended design. Some sentences tell the current state of the code, for example a library version, a configuration, or "the API does X now". For each such sentence, read the place that decides it: the code, `pnpm-lock.yaml`, `.env.example`, the CI file. Write that place as the source. When you cannot check it, write that it is not checked. Use `graphify query` to find the code.

### 6. Do not copy values from the use cases

A value that the user can see (a limit, a duration, a message) belongs to the rule in `docs/UCs/`. In the architecture file, write the content and the ID of the rule, for example "giới hạn số lần Sign in (SI-06)". When the mechanism needs the value, the code reads it from the configuration. The document links to the rule.

### 7. Update the README matrix

Add or change the row of the driver in the matrix of `docs/architecture/README.md`.

### 8. Check the result

Run `pnpm check:docs`. Fix each problem as its message says. Then run the skill `review-change`.

## Sources of this method

- The C4 model: Context and Container are enough for most teams. Use one abstraction level per diagram.
- M. Barbacci et al., *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, §3.4: architectural drivers come before the scenarios and the design.
- MADR (Markdown Architectural Decision Records): the parts of an ADR.
- `LESSONS.md` LL-006: check each claim about the environment at the place that decides it.
