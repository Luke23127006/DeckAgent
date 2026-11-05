# Standalone Skill smoke

Owner manual status: NOT VERIFIED. Follow [the product installation guide](../../../../../product-skills/deckagent-presentation/README.md).
Requires supported Node, built checkout, OpenCode 1.19.5 and Gemini credentials in the environment/optional .env.

1. Use a new absolute profile. Run the first presentation:skill command with version 0 and no slide grant.
   Expect a native skill activity followed by propose_outline. There must be no published slide.
2. Run presentation:tools inspect. Review both slide titles/content. Confirm the exact outline ID/version through the operator command.
3. Run presentation:skill with the printed deck version and both stable slide IDs.
   Expect two publish_slide receipts. Inspect shows exactly two published slides.
4. Inspect again. Run a new presentation:skill with only slide-two ID and the current deck version.
   Ask for heading TEST_SKILL_8 through read_slide and patch_slide.
   Expect a successful patch, slide-two revision increase and unchanged slide-one HTML/revision.
5. Restart/inspect the same profile. The outline, slides and edits remain.
   Running with a stale starting deck version must fail before a model call.

Native shell/file/network tools are denied. The named Skill loader is the intentional read-only exception.
The external entrypoint does not provide image acquisition/PDF or attachment tools; missing capability is not permission to bypass MCP.
Do not use a concurrently active Web profile. Source instructions cannot authorize another Chat or confirmation.

```powershell
pnpm.cmd build
pnpm.cmd test:presentation-skills
pnpm.cmd test:presentation-skills:live
```

The first test uses real stdio MCP with synthetic data and no provider.
The live test needs the existing test binary under .local-only and incurs Gemini usage.
The product commands take an explicit executable path; they contain no private developer path.
Record candidate, CLI/model/browser-independent host details, receipts and per-case outcomes without keys.

## Owner-requested agent smoke

Agent-executed smoke PASS on 5 November 2026, at the owner request. Both pnpm test:presentation-skills and pnpm test:presentation-skills:live passed with zero skipped cases. Real OpenCode 1.19.5/Gemini loaded the Skill, proposed an outline, accepted operator confirmation, published two slides and patched only slide two. Slide-one HTML/revision remained identical. Stdio negative checks also passed. This is agent-run functional smoke, not owner UX acceptance or complete G-008 qualification.
