# Naming Rules

Read this file to know the naming rules that the Naming and Grouping Refactor applies to `apps/host/src/`.

The rules cover concepts, role files, errors, ports, validation and enforcement. The problems that these rules fix are in [Naming and Grouping Problems](problems.md). The current name and target name of each symbol are in [Module Map](module-map.md). Two rules are decisions: a service or a store is a class, and the code calls the product concept "chat", not "session". The other rules stay `Proposed` until a revision writes them into the Coding Guidelines [[1]](#ref-1) and the Project Structure [[2]](#ref-2).

## One name for each concept

The product glossary in the use cases [[3]](#ref-3) already defines the product concepts. It has "Chat", "Request", "Draft", "Workspace" and "Provider". It has no "Session". Code names follow that glossary. A name that is not in the glossary names a technical concept, and the table below gives its meaning.

| Concept | Name in code | Not used for this concept | Rule |
| --- | --- | --- | --- |
| One line of work of the user, with a conversation and at most one deck [[3]](#ref-3) | `Chat` (types, classes, functions, variables) | `Session`, `WebSession` | Use "chat" for every new or renamed symbol |
| The ID of a chat | `sessionId` (fields, parameters, routes `/api/sessions`, error codes `SESSION_*`) | — | Keep `sessionId` until one contract revision renames it in the wire, the database, `packages/presentation/` and `apps/web/` together. Do not mix `chatId` and `sessionId` before that revision |
| A message that the user sends and the work for it until the work ends [[3]](#ref-3) | `Request` in `modules/chats/`, in the wire and in the Browser | — | The chats module and the wire use "request" |
| One agent execution that an owner starts | `Run` in `runs/`, `runtimes/` and `tools/` | `Request` | `runs/` uses "run". A request is a run whose owner kind is `chat`. The chats module converts `RunSnapshot` to `RequestSnapshot` at its boundary |
| The ID of a request and of its run | `requestId` | `runId` | One ID for both, because a chat request is one run |
| A session of the OpenCode process | `OpenCode session` | `session` alone | Use "session" only inside `runtimes/opencode/`, for the OpenCode protocol |
| The tool state of one run of the deck module | A name without "session", for example `DeckRunTools` | `DeckToolSession` | `Proposed` |
| A change-feed topic with a key for each chat | `chat topic` | `session topic` | `Proposed` |
| A database schema | `<name>.migrations.ts` | `schema.ts`, `sessions-schema.ts` | "Schema" in code means a Zod schema |
| Types that a folder declares for its own use | `<name>.types.ts`, or the file of the owner | `contracts.ts` | "Contracts" means `packages/contracts/` and the wire contract |

## Role files and symbols

The file name gives the role, and the main symbol repeats the role. Symbols use the singular domain noun. Folders use the plural. A module has one service unless two groups of use cases have different dependencies. Then each group has its own `<topic>.service.ts` and its own class.

| File | Main export | Form | Example |
| --- | --- | --- | --- |
| `<name>.service.ts` | `<Name>Service` | Class. Its public methods are the public operations of the module. No separate `*Operations` interface | `chats.service.ts` exports `ChatService` |
| `<name>.store.ts` | `Sqlite<Name>Store`, `Memory<Name>Store` or `<Name>FileStore` | Class. The prefix tells where the data is | `chats.store.ts` exports `SqliteChatStore` |
| `<name>.routes.ts` | `create<Name>Routes` | Function that returns an Express `Router` | `createChatRoutes` |
| `<name>.errors.ts` | `<Name>Error`, `<Name>ErrorCode` and `map<Name>Error` | Class with `code` as a union, and a `Record<<Name>ErrorCode, number>` status table | `ChatError`, `mapChatError` |
| `<name>.run-contribution.ts` | `create<Topic>Contribution` | Function that returns a `RunContribution` | `createConversationContribution` |
| `<name>.migrations.ts` | `migrate<Name>Database` | Function | Replaces `workspaces/schema.ts` |
| An integration client | `<Service>Client` in `<service>.ts` | Class | `TavilyClient` in `tavily.ts` stays |

The Angular style guide uses `feature.type.ts` in older versions. The current version (v22) names files without the type suffix, for example `user-profile.ts` [[4]](#ref-4). DeckAgent keeps the suffix, because one module has many roles and the project structure already names module files by role [[2]](#ref-2). NestJS also uses the suffix (`cats.service.ts`).

`Service` and `Store` are allowed only on role files and their classes. A class in another file does not use these suffixes. The rule against unclear names [[1]](#ref-1) still forbids `Manager`, `Handler` and `Coordinator` when the name does not tell the responsibility.

## Errors

- One error class for each module: `<Name>Error` in `<name>.errors.ts`, with `code` as a union. A second class is necessary only when a caller handles it differently [[1]](#ref-1).
- Exception: `@deckagent/deck` already exports `DeckError` for the deck domain. The error of the Host deck module is `DeckWorkflowError`.
- An integration client keeps its own error, for example `TavilyError` and `ProviderCheckError`. The service converts it to the module error, because integration errors and workflow errors are different components [[1]](#ref-1).
- The status table has the type `Readonly<Record<<Name>ErrorCode, number>>`. Then TypeScript finds a code that has no status. Do not use `Record<string, number>` with a `?? 500` fallback.

## Ports that a module declares

A module that needs an operation of another owner declares a small interface. The name is `<Consumer><Provider>`, as `WorkspaceChats` (what workspaces need from chats) and `ChatModels` (what chats need from the model rules) already do.

- Rename `AttachmentSessionStore`, `DeckSessionStore` and `ResearchSessionStore` to this form, for example `AttachmentChats` and `DeckChats`. Each one contains only the operations that the consumer calls.
- Use the suffix `Port` only when the plain name is the same as the name of the class that implements it, for example `AttachmentParserPort` and `AttachmentParser`.
- The service of the provider owner implements the port. `server.ts` does not build an adapter that joins the stores of several owners (see the `chatSessions` adapter in [Module Map](module-map.md#serverts)).

## Values and validation

- Do not use a TypeScript `enum`. Use a union. When code needs the list at runtime, use `const <names> = [...] as const` and get the type from it. The TypeScript handbook says that "you may not need an enum when an object with `as const` could suffice" [[5]](#ref-5). The Google TypeScript Style Guide allows `enum` and forbids `const enum` [[6]](#ref-6). Thus this rule is a project choice that keeps the code the same as the union rule [[1]](#ref-1). It is not an industry rule.
- Validation at a boundary uses Zod. Follow the form that `packages/host/contracts/` already uses: a file `<topic>-validation.ts` with a schema constant `<thing>Schema`, and an exported function `decode<Thing>(value: unknown)` that returns the type or throws.
- A route reads a body only through a `decode*` function from the contracts package [[2]](#ref-2). A route does not check fields by hand.
- Do not copy a type guard such as `record()` into a file. Replace it with a Zod schema at the boundary.

## Other rules

- Do not use `I` as a prefix for interfaces. Do not use `_` as a suffix [[6]](#ref-6).
- Constructor parameter properties (`constructor(private readonly store: ...)`) are allowed. The Google TypeScript Style Guide recommends them [[6]](#ref-6). Thus the TypeScript option `erasableSyntaxOnly` is not a way to forbid `enum`, because it also forbids parameter properties.
- A comment that names a class must name a class that exists [[1]](#ref-1).

## Enforcement

| Rule | Tool | Status |
| --- | --- | --- |
| No `const enum` | oxlint 1.94.0 rule `oxc/no-const-enum` | Exists in oxlint. Not turned on in `.oxlintrc.json` |
| File names in kebab case | oxlint 1.94.0 rule `unicorn/filename-case` | Exists in oxlint. Not turned on |
| No `enum` | No rule in oxlint 1.94.0 | `Proposed`: a rule in `check:boundaries` with a negative fixture |
| `<name>.service.ts` exports `<Name>Service`, `<name>.errors.ts` exports `<Name>Error` | No rule in oxlint 1.94.0. oxlint 1.94.0 can load ESLint plugins (`jsPlugins`) | `Proposed`: a rule in `check:boundaries` with a negative fixture |
| No `record()` copy, routes use `decode*` | Review | `Proposed`: review until the Zod change of each module is done |

## References

1. <a id="ref-1"></a>[Coding Guidelines](../../../conventions/code.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Use Cases](../../../UCs/README.md)
4. <a id="ref-4"></a>[Angular Style Guide](https://angular.dev/style-guide)
5. <a id="ref-5"></a>[TypeScript Handbook: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
6. <a id="ref-6"></a>[Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
