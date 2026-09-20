# Claude Code adapter

Read and follow `AGENTS.md`, including its instruction-ownership and merge/preservation policy.
Keep this file limited to Claude-specific routing rather than copying portable rules or full
workflows here.

Claude discovers the committed `.claude/skills/` mirror. Its canonical content lives in
`.agents/skills/`; edit the canonical copy and run `python .agents/scripts/sync_skill_mirrors.py`.

For Project Hub comparisons use the `project-hub-review` skill; for a broad consistency scan use
`project-hub-audit` and, when useful, the read-only `project-hub-auditor` subagent. Canonical
procedures live in `docs/agents/workflows/`.
