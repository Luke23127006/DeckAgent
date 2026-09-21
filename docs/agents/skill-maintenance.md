# Shared agent skill maintenance

`.agents/skills/` is the source of truth for repository-owned, tool-neutral skills.
`.claude/skills/` and `.codex/skills/` are committed generated mirrors; never edit
them directly. The inventory and provenance record is
[`.agents/skill-manifest.json`](../../.agents/skill-manifest.json), and selectable
workflow triggers live in the [skill router](skill-router.md).

For OpenCodeReview installation and usage, see
[OpenCodeReview](../tooling/open-code-review.md).

## Add or update a skill

1. Add or update `.agents/skills/<skill-name>/`.
2. Ensure `SKILL.md` has a valid `name` and discriminating `description`. Retain
   required supporting files and licenses.
3. Record the source, pinned version or commit, license, dependencies,
   compatibility decision, and local adaptations in
   `.agents/skill-manifest.json`.
4. Add or update the trigger in `docs/agents/skill-router.md` when the skill
   represents a selectable workflow phase.
5. Regenerate the committed mirrors:

   ```powershell
   python .agents/scripts/sync_skill_mirrors.py
   ```

6. Validate that no mirror drift remains:

   ```powershell
   python .agents/scripts/sync_skill_mirrors.py --check
   ```

7. Review `git status --short` and commit the canonical skill, manifest, router,
   and both generated mirrors together.

## Remove or retire a skill

1. Confirm the exact skill name, then remove `.agents/skills/<skill-name>/`.
2. Remove its entry from `.agents/skill-manifest.json` and remove any router,
   workflow, or documentation references that no longer apply.
3. Remove the now-obsolete committed mirrors explicitly:

   ```powershell
   python .agents/scripts/sync_skill_mirrors.py --prune
   ```

4. If pruning reports local mirror changes, inspect and preserve them before
   retrying. Use `--prune --force` only when those changes are intentionally
   disposable.
5. Run `python .agents/scripts/sync_skill_mirrors.py --check`, review
   `git status --short`, and commit the canonical removal, manifest/router updates,
   and both mirror removals together.

## Synchronization safety

By default, the synchronizer refuses a skill that exists only in a mirror. Promote
an accidental mirror-only skill into `.agents/skills/`, or follow the retirement
workflow when its canonical copy was intentionally removed.

The synchronizer also refuses to replace or prune a mirror containing tracked,
untracked, or ignored local changes. Move intended edits into `.agents/skills/`
or restore the mirror first. Use `--force` only after inspecting and deciding to
discard those mirror-only changes.

Keep instructions, references, scripts, and assets used by only one skill inside
that skill's `.agents/skills/<name>/` directory. Put a procedure in
`docs/agents/workflows/` when it is repository-owned and shared by multiple skills,
agent adapters, or roles, or when it needs a stable repository-level link independent
of generated mirrors. Keep `SKILL.md` as the concise entrypoint to a shared procedure.

## Team update workflow

Both generated mirrors are committed, so team members do not need a setup command
after pulling skill-only changes. Run the mirror check before committing any skill
change.

## Troubleshooting mirror drift

Edit `.agents/skills/`, run the sync command, and then run `--check`. Do not repair
`.claude/skills/` or `.codex/skills/` manually.
