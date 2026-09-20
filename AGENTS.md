# DeckAgent — Minimum Rules for Coding Agents

These rules apply to every coding agent used to develop DeckAgent, regardless of tool. The team has not finalized the system architecture. Follow decisions that are actually recorded, and label unresolved design choices as proposals rather than approved project rules.

## Context Loading

Before starting a task, read this file.

Identify the files and boundaries affected by the task.

If the target directory or one of its parent directories contains another `AGENTS.md`, read the closest applicable file before editing. More specific rules extend root rules.

Read a contract, schema, or design document only when the task changes an API, database structure, shared type, configuration contract, or another module boundary.

Use a Skill only when the task needs a specialised workflow. Choose Skills by the type of work, not by the AI tool.

After reading affected code, tests, and relevant decisions, consult `docs/agents/development-workflow.md` when a specialised workflow is needed, then load only the relevant `SKILL.md` from `.agents/skills/`.

Load the minimum context needed for the task. Do not read unrelated rules, documentation, or Skills.

If the required architecture or contract does not exist, inspect the current codebase first. Do not assume an architecture or create a new boundary without evidence.

## Understand the task and preserve existing work

- Read the task, acceptance criteria, relevant code, tests, and available project decisions before editing. If an instruction conflicts with an existing contract or decision, identify the conflict instead of silently choosing one.
- Inspect the working tree before editing. Preserve other contributors' uncommitted work. Do not revert, overwrite, stage, or include changes unrelated to your task.

## Stay within scope while exercising judgment

- You may choose algorithms, internal structure, naming, and focused tests within the assigned task. Use existing patterns when appropriate. You may make directly necessary changes to callers, tests, and documentation without seeking approval for each routine edit.
- Do not add unrelated features, refactors, broad formatting changes, or dependency upgrades. If a related issue blocks completion, explain why it is necessary and keep the additional change as small as possible. Report independent issues separately.
- Do not add a new production dependency or change a shared configuration merely for convenience. Explain its purpose and impact when the task requires one.

## Protect boundaries and contracts

- Respect module responsibilities, data ownership, and dependency directions that the team has recorded. Do not reach into another component's private implementation to bypass its public interface.
- Treat APIs, schemas, shared types, file formats, and other interfaces used by multiple components as contracts. Do not change them silently. If the assigned task requires a contract change, update affected producers, consumers, tests, and documentation together; explain any compatibility impact.
- When an interface or boundary has not been agreed yet, do not invent a permanent rule for it. Implement the task through a small, explicit seam when possible and record the design assumption. Escalate a choice that affects multiple components or would be costly to reverse.

## Handle architecture impact explicitly

- Before implementing a choice that establishes or changes a system-wide boundary, module responsibility, data owner, dependency direction, or deployment approach, describe the options, affected components, and trade-offs to the task owner. Pause only the work that depends on that decision; continue independent work. Do not claim the proposed architecture is approved until the team decides.

## Verify honestly

- Run checks relevant to the change using commands that actually exist in the repository. Include focused tests and any applicable type, lint, build, contract, or integration checks. If no suitable automated check exists, describe the manual verification performed and its limits.
- Do not delete or disable tests, weaken assertions, suppress errors, or skip required checks to make a change appear successful. Update tests when the task changes expected behavior, and explain why. Report failures even if they existed before your change.
- State exactly what was run and its outcome. Never report a check as passed if it was not run or did not pass.

## Protect secrets and shared environments

- Never put passwords, tokens, API keys, or other secrets in source code, fixtures, logs, commits, or responses. Use existing configuration mechanisms and harmless placeholders. If you encounter a secret, do not reproduce its value.
- Do not run destructive operations on shared data or environments, publish changes, or alter access settings unless the task explicitly authorizes that action. Prefer reversible local work while implementing the task.

## Handoff

- Review the final diff for unrelated edits, unintended contract changes, and exposed secrets. Report the behavior changed, affected interfaces or components, checks and results, unresolved assumptions, and decisions needed from the team.
