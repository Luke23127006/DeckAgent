# Context usage and compaction

Question: how do the OpenCode runtime and open-design keep a long conversation within the
context of the model, and do they show the user how full it is? Checked on 05-11-2026 for
the review of legacy UC-015, from `https://opencode.ai/docs/config`, `/docs/tui` and
`/docs/server`. The pages were read through a fetch tool that returns a summary, so the
quotes below are close to the page text, not guaranteed word for word. No product was run;
source code was not read.

1. Why check this? Legacy UC-015 let the user see the context usage of a chat and compact
   the conversation, and said the system never compacts by itself. Compacting means
   replacing the earlier conversation the model reads with a shorter summary. The review
   needs to know whether the runtime already compacts, and on whose start.

2. What does OpenCode do?
   - Observation: `/docs/config`, Compaction: `"compaction": { "auto": true, "prune": false, "reserved": 10000 }`.
     `auto`: "Automatically compact the session when context is full (default: `true`)."
     `prune`: "Remove old tool outputs to save tokens (default: `false`)." `reserved`:
     "Token buffer for compaction"; no default is stated.
   - Observation: `/docs/tui`: the command `/compact`, alias `/summarize`, "Compact the
     current session".
   - Observation: `/docs/server`: `POST /session/:id/summarize`, "Summarize the session",
     body `{ providerID, modelID }`.
   - Observation: none of the three pages mentions a context usage number, a token count
     or a percentage shown to the user, or an API that returns one.
   - => By default the runtime compacts by itself when the context is full, and also on
     request. Showing context usage is not documented.

3. What happens to the earlier messages after a compaction?
   - Observation: not documented on these pages. They say the session is compacted or
     summarized, not whether earlier messages stay readable.
   - Inference: if OpenCode replaces the messages, DeckAgent must keep its own copy of the
     conversation for the user to read, which ties into
     [DEC-006](../decisions/DEC-006-where-chat-work-is-kept.md).
   - Proposal: the runtime research of the first build that runs requests checks it, and
     checks what the summary keeps of the brief, the outline and the deck.

4. What does open-design do?
   - Observation: none recorded. open-design runs a coding agent; that agent likely
     compacts by its own rules `[assumed]`.
   - => open-design coverage is unverified.

5. What does this mean for DeckAgent?
   - Proposal (ruled by the PO on 05-11-2026): the system summarizes by itself when the
     context is full and says so in the conversation (FR-079, UC-003 A52); context usage is
     parked (dev/mvp/spec/05-backlog/FR-078.md); who starts the summary is
     [DEC-008](../decisions/DEC-008-who-starts-a-conversation-summary.md).

6. Limits of this check.
   - The pages were read through summaries; the exact wording is not guaranteed.
   - The OpenCode TUI was not run, so a context number it shows without documenting it is
     not ruled out.
