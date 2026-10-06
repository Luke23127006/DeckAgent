# Claude Code adapter

Read and follow `AGENTS.md`, including its instruction-ownership and merge/preservation policy.
Keep this file limited to Claude-specific routing rather than copying portable rules or full
workflows here.

Claude discovers the committed `.claude/skills/` mirror. Its canonical content lives in
`.agents/skills/`; edit the canonical copy and run `python .agents/scripts/sync_skill_mirrors.py`.
