# What the agent of a chat reaches, and when it asks

Question: how do the runtime and open-design limit what a coding agent reaches, and when
does the user approve a step? Checked on 05-11-2026 from the published docs of OpenCode
(`https://opencode.ai/docs/permissions/`, `https://opencode.ai/docs/agents/`) and of
open-design (`README.md`, `docs/agent-adapters.md` of `https://github.com/nexu-io/open-design`).
No product was run; source code was not read.

1. Why check this? Legacy UC-014 let the user choose one of two permission presets per
   chat, approve a step once or for the chat until taken back, and revoke it. The review
   of 05-11-2026 asked whether DeckAgent needs that, or whether the runtime already gives
   a mechanism that code configures.

2. How does OpenCode limit a tool step?
   - Observation: each kind of tool step has a permission key: `read`, `edit` (covers
     edit, write and patch), `glob`, `grep`, `list`, `bash`, `task`, `skill`, `webfetch`,
     `websearch`, `external_directory`, `doom_loop` and others. Each key takes `allow`,
     `ask` or `deny`; wildcard patterns are allowed, and the last matching rule wins.
   - Observation: "Most permissions default to "allow"." `doom_loop` and
     `external_directory` default to `ask`.
   - => A step is limited by configuration, not by the model. Code that writes the
     configuration decides what the agent reaches.

3. What does the user see when a step is `ask`?
   - Observation: the answers are `once` (this request), `always` (matching requests "for
     the rest of the current OpenCode session") and `reject`.
   - Not found: a way to take back an `always` answer.
   - => An approval that lasts is bounded by the session in OpenCode. DeckAgent needs only
     `once` and `reject` (owner ruling 4A of 05-11-2026).

4. How are paths outside the project handled, and can the limits differ per agent?
   - Observation: `external_directory` covers "tool calls that touch paths outside the
     working directory where OpenCode was started"; its default is `ask`.
   - Observation: "You can override permissions per agent." The built-in Plan agent is
     restricted: it denies edits except its own plan files, and does not restrict `bash`.
   - Observation: a run flag `--auto` approves every step that is not denied.
   - => With the working directory set to the project folder of the workspace, reading
     there is `allow`, writing there is `deny`, and reading outside is `ask`. Writing the
     work of the chat goes to DeckAgent's own data, which is outside the project folder
     (DEC-006), so it needs its own rule.

5. How does open-design run the agent?
   - Observation: the process of the agent is "spawned in the effective project cwd"; the
     doc adds that this cwd "is an execution root, not a uniform OpenDesign sandbox".
   - Observation: the runs "intentionally choose non-interactive permission modes", for
     example `--permission-mode bypassPermissions` for Claude Code and
     `--dangerously-skip-permissions` for OpenCode when the CLI offers it; the daemon "must
     not rely on an interactive tool-approval prompt".
   - Observation: the harness "writes ordinary files in the OD project cwd".
   - Not found: any step the user approves.
   - => open-design trusts the agent fully inside the project folder. DeckAgent differs: it
     writes nothing in the project folder (FR-084) and asks before a step outside its
     reach (FR-076, FR-077).

6. What does this mean for DeckAgent?
   - Proposal: code sets a fixed reach through the runtime configuration: read the project
     folder and the attachments, write only the work of the chat, use the outside services
     the user set up, ask for everything else, and never reach another chat.
   - Proposal: the Phase 1 runtime research of the first build checks that a configuration
     keeps writes out of the project folder, keeps one chat out of the data of another, and
     shows an `ask` step to DeckAgent so it is able to ask the user.

7. Limits of this check.
   - Only docs were read. Whether `deny` on writes in the working directory also blocks a
     `bash` command that writes there is not checked.
   - Part of `docs/agent-adapters.md` was read through a summary; the quotes above come
     from the parts read in full.

8. What did the legacy code decide about approving a step? Read on 05-11-2026 from
   legacy ADR 0003 "Host owns step approval; file tools enforce the final target" (status
   proposed; deleted, readable at commit `85130c4`).
   - Observation: the Host held the file tool at an approval boundary. An approval had its
     own identity and a separate endpoint, so an ordinary answer to a question could not
     grant access. A missing answer granted nothing.
   - Observation: path checks (canonical target, blocked app folders, links) ran right
     before each read, and an approval could not skip them. A continuing grant named one
     exact file, never a parent folder.
   - Observation: a running request kept the grants it started with; an approval extended
     that request only by the named read. A restart kept the stopped state and did not
     run the tool again.
   - => The spec keeps the outcome (FR-076: allow once or refuse; FR-077: fixed reach),
     not the presets. Two points still apply on OpenCode: an answer to a question is never
     an approval, and path checks run even after an approval.
   - Proposal: the Phase 1 runtime research (item 6) checks both points against how
     OpenCode shows an `ask` step.
