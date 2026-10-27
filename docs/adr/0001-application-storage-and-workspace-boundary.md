---
status: accepted
---

# Application storage is separate from project folders

DeckAgent keeps Workspace identity, Chat history, decks, outlines and internal Agent working data in application-owned storage, conceptually under `~/.deckagent/`. A Workspace refers to an optional user project folder; it is not the place where DeckAgent stores its own history. We chose this boundary so Chat and Deck data remain available when a source folder moves, and so slide generation does not create or change files in that source folder.

## Consequences

- The default storage path is stable and is not relative to the process working directory.
- Workspace ID and Chat ID identify saved work independently of the project-folder path.
- The Agent's temporary working files remain separate from user source files and from durable Chat/Deck data.
- Existing data stored under a legacy relative `.deckagent/` needs a non-destructive migration path.
- Project-folder access is read-only by default; only an explicit user export can write an output where permitted.
- This ADR does not choose a database schema or final set of storage subdirectories.
