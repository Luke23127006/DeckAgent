# Manual context smoke

Status: basic Compact/continue smoke owner-confirmed PASS on 4 November 2026.
The quick scenario checks four remembered facts, the retained draft, readable history
and the checkpoint label. This is aggregate confirmation without separate artifacts.
Stop, restart/model isolation and source-backed deck editing remain unconfirmed by
the owner. G-005 remains NOT VERIFIED. Automated evidence stays separate.

Restart the same isolated profile as earlier to keep the Chat under test:

```powershell
pnpm.cmd start:opencode --data-dir "<previous Test profile path>" --material-max-bytes 1048576 --material-max-count 3
```

Use its actual profile path, not the placeholder. Do not add --fresh for a restart.
The example keeps the earlier trial material bounds for a material-backed Chat.

1. Open a Chat with some conversation and a selectable model. Type an unsent draft.
   Read Context below the Composer. It says estimate or unknown; details explain
   missing costs. Merely opening it starts no model request.
2. Select Compact while idle. Stop remains available during the request. On success,
   the checkpoint label says how many earlier messages were summarized. Full
   conversation and the unsent draft remain unchanged.
3. Send a new question about a unique fact or edit restriction recorded earlier.
   Check that the answer keeps it. For a deck, compare slide-one HTML/revision
   when requesting an edit to slide two only.
4. Start another Compact and choose Stop while it runs. The previous checkpoint
   stays. Starting Compact during another running/awaiting request is refused.
5. Restart using the same profile. Checkpoint, history, deck and materials remain;
   no request replays. Another Chat has no checkpoint from this Chat. Changing
   model uses full history until that selection has a valid checkpoint.

Unknown usage before a matching prompt observation is expected. Unknown context
window means no percentage. Images or unread reference content have unknown costs.
At a calculable estimate of at least 85 percent, the suggestion starts no Compact.
UTF-8 bytes divided by four is an estimate, not a tokenizer or provider token report.

Record browser, model/protocol, candidate, per-case results and any failure code.
Do not include API keys or private source contents in evidence.

Automated commands after a build:

```powershell
pnpm.cmd test:context
pnpm.cmd test:context:cli
pnpm.cmd test:context:live
```

The CLI command uses local provider fixtures and a real pinned executable/browser.
The live command uses Gemini credentials from the safe environment/optional .env;
it includes both controlled-history fidelity and the full source-to-deck scenario.
The recorded full live scenario failed before Compact; a focused live PASS does
not replace it. G-005 remains NOT VERIFIED, including pending entry gates.
