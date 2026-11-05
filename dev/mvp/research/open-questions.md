# Open questions

Open questions about the MVP. Each one names the phase that answers it. When a question is answered, remove it here and record the answer in a research file, a decision or the spec. Open decisions are listed in [decisions/README.md](../decisions/README.md), not here.

## Runtime research (Phase 1 of the first build that touches the part)

1. Does OpenCode own provider keys, their storage and a model catalog? A model catalog is the list of models a provider offers, with the context window, the reasoning levels and the input kinds of each (for example from `models.dev`).
   - Belief of the PO, not verified: OpenCode owns keys and a catalog with the context window, reasoning levels and default values.
   - If there is no catalog, reconsider the parked FR-062 and FR-081 (`dev/mvp/spec/05-backlog/`).
   - Also check how a key is kept (FR-040) and whether a model can run through a local coding-agent CLI with its own login, as open-design does (UC-005 Note, parked UC-005-A18).
   - Reference for model settings, chosen by the PO: DeepSeek Harness. Observation: its DeepSeek models have a 1,048,576-token context, reasoning efforts off / low / high / max with `high` as the default, at most 256,000 output tokens and a fallback context of 1,000,000; choosing a model applies its default effort; the GUI offers only catalog models; a key is only format-checked before it is saved.

2. Can an OpenCode configuration give the reach that FR-077 fixes? Reach means the files and services a request may use.
   - Allow reads in the project folder and deny writes there, including through bash.
   - Keep one chat out of the data of another chat.
   - Let DeckAgent write the chat work in its own data.
   - Surface an `ask` step to DeckAgent, so that UC-003 A51 can ask the user.
   - See [agent-permissions.md](agent-permissions.md) items 6 and 7.

3. How does OpenCode keep sessions (UC-006, NFR-008)?
   - Is one chat one session?
   - Where is the deck kept, and what survives a restart?

4. What happens to a conversation after OpenCode compacts it (UC-003 A52, FR-079)? Compacting means replacing the earlier conversation the model reads with a summary.
   - Do earlier messages stay readable? If not, DeckAgent keeps its own copy (DEC-006).
   - What does the summary keep of the brief, the outline and the deck?
   - Does OpenCode report the context usage of a session? If yes, reconsider the parked FR-078.
   - Set `compaction.auto` as DEC-008 decides. See [context-compaction.md](context-compaction.md).

5. Is the rate of check faults acceptable when the model writes the deck source within a template (DEC-005 Consequences)? A check fault is a write that the code check refuses.
   - Proposal: a spike with 1 HTML template and 1 theme, a first draft and 3 follow-up requests, counting check faults. The PO reopens DEC-005 if the rate is not acceptable.

6. How does the model state the source of each content that needs one (BR-015) while it writes the deck source, and where does code keep that record (DEC-009, with DEC-006)?

7. Who reads whether a reply confirms the outline or asks for a revision: the model, code, or a dedicated confirm action (UC-001, FR-003)? Observation: the legacy code used a regular expression in `editing-workflow.ts` that blocked ordinary Vietnamese replies. Answer in the implementation plan of the UC-001 build.

## Product questions (MVP planning)

8. Which built-in design systems DeckAgent offers, and which one is the default (BR-003). The theme values a design system holds (BR-017 V-1) are set with the first template.

9. Which built-in templates each generation format has, and the default template of each format (BR-018 V-1, V-2).

10. Switching the template of an existing deck through a follow-up request (UC-002) is not specified.

11. Changing the generation format in the interview after a template was chosen (FR-113) is not specified. A template belongs to one format.

12. How a ZIP attachment is used is not specified. BR-001 accepts ZIP, but no FR says what the system does with it. An exported HTML deck can be attached only as a ZIP, since BR-001 V-1 has no HTML.

13. Attachment limits (BR-001 number and size, BR-002 request length and its unit) are not set. They wait for technical evidence.
    - Trial values, not approved: 10 new attachments in one request, 20 MiB per file, types TXT, MD, PDF, DOCX, PNG, JPEG and PPTX.
    - Evidence to collect: a file just below, at and above the trial size; 9, 10 and 11 attachments; every accepted type including a valid PPTX; invalid, protected, damaged and decompression-heavy documents; preparation, parsing and memory use on supported hardware; a refused file keeps the draft request intact.
    - A file of the project folder is not an attachment. Its read limit needs its own measurement.

14. Key storage (FR-040) and BR-006 V-1 are not answered.

## Other product and runtime questions

15. Workspace names (UC-013): what name a new workspace gets, whether the user can change it, and whether names must be unique. Whether adding the same folder again as a workspace brings back the chats it had, or starts without them.

16. Requests that stopped or failed (UC-003 A11, FR-019): the spec has no try-again action; the user sends a new request, which starts from the last finished deck. Does the MVP need a try-again action? If yes: what runs again, and how the system avoids making the same change twice (for example adding the same slide again). Also: which causes of a failure keep the user from sending a new request.

17. Providers (BR-006): what each built-in provider needs besides a key, which of its default settings the user can change, and where its base URL can change. How the system knows that a custom model API needs a key, and whether the user can change the API protocol of a saved custom model API. Each answer waits for checks with the provider and with OpenCode (item 1).

18. Conditions of the NFR measures, decided in the testing plan of the build that takes each NFR:
    - the computers on which the performance targets hold (NFR-001, NFR-011, NFR-012, NFR-014), and the providers and models (NFR-002, NFR-012);
    - the Windows versions, hardware and browsers for building and running (NFR-014);
    - the languages DeckAgent commits to beyond Vietnamese and English, which are checked first (NFR-009);
    - whether other programs of the same user can read a saved key (NFR-006).

19. Runtime limits, for the implementation plan:
    - several open views or windows, and several running copies of DeckAgent;
    - a work loop with no bound, and a request whose provider sends nothing;
    - the use of the model, of money and of the computer by one request;
    - how a new image is made and by which part of the product; how the system knows a valid way is available; what it does with a model that takes no image input; how images reach the agent within the reach of NFR-003 and NFR-007;
    - how the image abilities of each provider and model are checked;
    - how a saved key is protected from other programs on the computer.

