---
name: write-use-case
description: Write or update a use case file in docs/UCs/ or the quality attribute scenarios in docs/UCs/quality-attributes.md. Gives the method. Find the actors and goals. Write the main flow as a black box. Find the exception flows step by step. Write each rule with a measure and a source. Keep the IDs. Compare with an independent baseline for the gap analysis. Use when a feature area starts development, when its behavior changes, or when the user asks to write, migrate or review a use case. The format of the file is in docs/conventions/use-cases.md, and this skill does not repeat it.
---

# Write a use case

This skill gives the method. The format of the output is in the convention files. Read them first and follow them:

- `docs/conventions/use-cases.md`: sections, rule table, flow table, gap analysis, quality attribute scenario.
- `docs/conventions/docs.md`: title and purpose line, citations, IDs, sources of values.
- `docs/conventions/mermaid.md`: diagrams.

Also read the lessons in `LESSONS.md` with the scope `Documentation`, `Testing` or `General`.

## Steps

Copy this checklist. Mark each step when you complete it.

```
- [ ] 1. Sources collected, with the version of each
- [ ] 2. Existing IDs found
- [ ] 3. Actors, goals and scope written
- [ ] 4. Main flow of each use case written as a black box
- [ ] 5. Exception flows found step by step
- [ ] 6. Rules written with measure, source and status
- [ ] 7. Each fact passed the boundary test
- [ ] 8. Gap analysis against an independent baseline
- [ ] 9. check:docs passes and the review has no open finding
- [ ] 10. Agent-proposed values reported to the user one by one
```

### 1. Collect the sources

Read the sources of the feature area:

- The current file of the area in `docs/UCs/`, if it exists.
- The requirement that the product owner gives: an issue, a message or a meeting note. Ask the product owner for it when you do not have it.
- The questions in `docs/open-questions.md`.
- The ADRs in `docs/architecture/30-decisions.md`, if the file exists.
- A design or a prototype in `docs/design/`, if one exists for the area.

Record the commit or the link of each source that you read. Put this record in the report, not in the use case file.

A prototype or a design shows the interface, not the product behavior. A behavior that only a prototype or a design shows gets the status `Inferred`, not `Confirmed`.

### 2. Find the existing IDs

Search `apps/`, `docs/testing/`, `docs/architecture/` and `docs/open-questions.md` for the IDs of this area. The code cites IDs in more than one form, for example `UC-003 A11` and `UC-003.A11`. Search for each form. A test case or a defect that points to an ID must keep pointing to the same behavior. Keep each existing ID and its meaning. Give a new rule the next number in its group. When one old rule says two things, keep the old ID for the first and give the second a new ID.

### 3. Write the actors, the goals and the scope

- An actor is a person or a system outside DeckAgent that has a goal or that the user sees. Examples: the user, a provider, an external service.
- Each use case is one goal that the actor can finish in one session, for example "Gửi request và chờ công việc". A step of a goal (for example "thêm file đính kèm") is not a use case.
- Write what is out of scope, so that the reader does not look for it.

### 4. Write the main flow as a black box

Write the steps that the actor sees, from the trigger to the goal. The system is one participant: DeckAgent. Do not write the internal parts (API, database, library, endpoint). They belong to `docs/architecture/`. Draw the main flow as a `sequenceDiagram`, with the labels that `docs/conventions/mermaid.md` gives.

### 5. Find the exception flows step by step

Go through each step of the main flow. For each step, ask how it can fail:

- The input is empty, has a wrong format, is too long, or is at a limit.
- DeckAgent, a provider or an external service does not answer or gives an error.
- The actor sends the request again, too many times, or after the limit.
- Time passes: the actor does not answer, or a wait has no end.
- The action was already done: the same file added again, a suggestion chosen again, an outline that the user approved before.
- A second interface shows the same chat at the same time.
- DeckAgent stops and starts again during the flow.
- The actor leaves the flow and comes back (reload, another chat, close the interface).

Each answer that changes what the actor sees is a row of the flow table. When no source gives the result of an answer, do not make up the behavior. Add an open question to `docs/open-questions.md` and link to it from the section of the use case. When an object has a lifecycle (an attachment, a request, a deck, a workspace), draw a `stateDiagram-v2` and check that each transition has a rule.

### 6. Write the rules

- A rule tells one thing that a test can check. Split a rule that says two things.
- A rule with a quantity gets a number, a unit and the point of measure. Example: "3.600 giây, từ lúc gửi email tới lúc mở link". Replace each vague word with a measure.
- Each value has a source. Do not make up a value. Sometimes the sources do not give a value that the flow needs. Then propose a value and record it as `docs/conventions/docs.md` gives for an agent-proposed value.
- Give each rule the status that the product owner gave it. Do not raise a status because the rule looks obvious.

### 7. Do the boundary test for each fact

Ask: can the user or a tester see this fact from outside the system? If yes, it stays in the use case. If no (a library, a table, a configuration, a middleware), move it to the file in `docs/architecture/`. Write the ID that it answers in that file. A fact must not be in two files.

### 8. Compare with an independent baseline

The spec, the prototype, the code and the tests have one origin. A comparison between them finds only where they differ, not what all of them omit. Choose a baseline from outside that origin:

- A standard of the domain. Use WCAG for accessibility. Use OWASP ASVS for input handling and for access to files. Use the SEI quality attribute scenario for quality requirements.
- A set of use cases that a person or a subagent writes without reading the spec. Give the subagent only the goal of the area and the actors.

Take the item IDs and levels from the original text of the standard, not from a summary. For each item in scope, record one result. The result is full, partial, missing, or not applicable. Each item without a full result becomes a row of the gap table. For each row, make a new rule, record an accepted risk with the reason, or add an open question.

### 9. Check the result

Run `corepack pnpm@11.28.5 check:docs`. Fix each problem as its message says. Then do a review with the skill `open-code-review-delegate`. The review finds what the check cannot find, for example a rule that says two things or a fact in the wrong folder.

### 10. Report

Review the file for open questions. An open question is an item that has no decision. Examples: two rules that give different results for the same condition, a condition that no rule covers, and a word that a tester cannot check. Add each question to `docs/open-questions.md`, and do not change a rule to solve it.

In the reply to the user, list separately each value that you proposed, with its reason and the change from the source. The user approves each value one by one. Also list each ID that you added or split.

## Quality attribute scenarios

For `docs/UCs/quality-attributes.md`, write one scenario for each concern of the architectural drivers in the project brief. A quality attribute name alone ("the system must be scalable") is not a scenario. Give a specific example with a measure. Cover the three types of scenario that `docs/conventions/use-cases.md` gives. For each driver, ask three questions: how do users use it, how will it change, and what stress can break it?

## Sources of this method

- M. Barbacci et al., *Quality Attribute Workshops (QAWs), Third Edition*, CMU/SEI-2003-TR-016, §3.5 and §3.8: the six parts of a scenario and the three types of scenarios.
- OWASP ASVS 5.0: an example of an independent baseline for input handling and access control.
- `LESSONS.md` LL-001 and LL-002: the baseline rule and the rule for agent-proposed values.
