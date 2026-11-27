# Reference Products for the Browser

Read this file to know what the Browsers of open-design and crypto-force teach DeckAgent.

The file also tells whether a setup like crypto-force can give a result equal to open-design. open-design is the reference product of DeckAgent. crypto-force is the reference for the folder layout and the conventions. The file uses four labels:

- `Measured`: a value from the file tree, a `package.json` or a file of the repository at the given commit.
- `Inferred`: a conclusion from the facts that the facts do not prove.
- `Proposed`: a direction that is not a decision yet.
- `Open`: a question that needs a decision of the PO.

## Answer

`Inferred`: Yes. A Vite and React setup with the crypto-force layout can give a Browser that is equal to the Browser of open-design for the DeckAgent scope. The reasons:

- The result of open-design comes from product features and from libraries for each feature (editors, preview, streaming). It does not come from its framework. open-design uses Next.js only as a shell for a single-page application (SPA). One catch-all route renders one client component. A small router of its own selects the screen [[1]](#ref-1). A Vite SPA gives the same runtime shape.
- The two parts that make the open-design workspace good are a sandboxed `srcDoc` iframe preview and a chat with a streamed execution record [[1]](#ref-1). DeckAgent already has the sandboxed `srcdoc` preview with a CSP (`apps/web/src/browser/features/deck/deck-canvas.ts`). The streamed request already comes from the Host over SSE.
- open-design has no library for server state. It writes fetch, de-duplication and backoff by hand in `state/` and `lib/` [[1]](#ref-1). TanStack Query, which DeckAgent selected, does this work with less code.

open-design has four conventions that crypto-force does not have. They are CSS ownership, shared UI primitives, pure logic out of components, and a typed text dictionary. [Browser Rules](web-rules.md) adds them.

## open-design Browser

Facts from `nexu-io/open-design` at commit `10f3f96` [[1]](#ref-1). All values are `Measured`.

| Part | open-design | Note |
| --- | --- | --- |
| Framework | `next` 16.2.6, `react` 18.3.1 | Production CLI build is a static export. `app/[[...slug]]/page.tsx` renders `ClientApp` for every URL |
| Routing | `src/router.ts`, no React Router | The file comment says: "We avoid pulling in react-router", because they need few routes |
| Server state | Hand-written: `state/projects.ts` (2,970 lines), `providers/daemon.ts` (2,871 lines), `lib/coalesced-get.ts`, `lib/backoff.ts` | No TanStack Query, no SWR |
| Styles | CSS Modules next to the component (121 `*.module.css` files), global tokens in `src/styles/`, Tailwind 4.3.0 | `AGENTS.md` makes CSS Modules the default for new component styles |
| UI primitives | Package `@open-design/components` (button, dialog, form controls, visually hidden) | Product layout stays in the app, not in the package |
| Pure logic | `src/runtime/` (109 files), for example `runtime/chat/` | `components/chat/AGENTS.md`: logic without JSX and DOM goes to `runtime/chat/` |
| Text | `src/i18n/`, typed `Dict` in `types.ts`, 19 locales | A missing key is a type error |
| Tests | Vitest 4.1.6, Testing Library 16.3.2, jsdom, in `apps/web/tests/`. Playwright in `e2e/ui/` | No test files in `src/` |
| Feature libraries | `lexical` (rich text), `@excalidraw/excalidraw`, `@xterm/xterm`, `shiki`, `dompurify`, `motion`, `lucide-react` | One library for each editor or viewer |
| Size | `App.tsx` 6,482 lines, `components/FileViewer.tsx` 20,759 lines, 291 `.tsx` files in `src/`, 528 files in `src/components/` | |

### Learn from open-design

- The preview runs in a sandboxed iframe. Bridges inject only through the `srcDoc` path. Both iframes stay mounted, and CSS visibility swaps them, so a mode change does not reload the frame [[2]](#ref-2).
- An element that shows and hides stays mounted and changes a CSS class, because an unmount skips the exit transition [[2]](#ref-2).
- Pure logic goes out of components into a folder without JSX and DOM. Then a test checks it without a renderer [[3]](#ref-3).
- Global styles hold only tokens, reset and app shell [[2]](#ref-2). open-design puts component styles in CSS Modules. DeckAgent puts them in Tailwind classes ([Browser Rules](web-rules.md#styles)).
- New UI uses a shared primitive before a styled plain element [[2]](#ref-2).
- All user-visible text goes through one typed dictionary [[2]](#ref-2).
- Tests live in `tests/`, not in `src/`. UI automation lives in `e2e/` [[2]](#ref-2). DeckAgent already has this rule.

### Do not copy from open-design

- Files of thousands of lines (`App.tsx`, `FileViewer.tsx`, `state/projects.ts`). `Inferred`: a folder layout without an owner for server state and without a page boundary let these files grow.
- A flat `components/` folder with 528 files and no page colocation.
- Next.js. DeckAgent has no server rendering, and the Host serves the Browser assets. open-design routes every URL to one client component, so Next.js gives it no routing either.
- Hand-written fetch caches. TanStack Query replaces them.
- 19 locales. DeckAgent writes UI text in Vietnamese. `Proposed`: keep one typed text table, and add locales only when the product needs them.

## crypto-force Browser

Facts from the project structure of crypto-force [[4]](#ref-4).

| Part | crypto-force |
| --- | --- |
| Framework | React Router framework mode, root folder `app/` |
| Layout | By layer, with page colocation: `routes.ts`, `routes/`, `pages/<Page>/components/`, `components/`, `components/ui/`, `hooks/`, `api/`, `layouts/`, `contexts/`, `types/`, `utils/` |
| UI primitives | shadcn/ui in `components/ui/` |
| Server state | TanStack Query in `hooks/` |
| Mocks | MSW in `mocks/`. Only `entry.client.tsx` starts the browser mocks. Production build rejects mock chunks |
| Data flow | Page → query hook or route loader → `app/api/` → HTTP |

### Learn from crypto-force

- The layer layout with page colocation. A component moves up to `components/` only when two pages use it.
- One data flow: page → hook → `api/` → HTTP. `api/` has no React and no business logic.
- Mocks are development code, and production code does not import them (lint).

### Do not copy from crypto-force without a decision

- React Router framework mode. Framework mode "wraps Data Mode with a Vite plugin" [[5]](#ref-5). The React Router docs say: "Use Declarative Mode if you: want to use React Router as simply as possible" [[5]](#ref-5). Decided: declarative mode, because DeckAgent has few screens and TanStack Query owns the data loading. Then the root folder stays `src/` ([Browser Rules](web-rules.md#routing)).
- shadcn/ui and Tailwind. Decided: DeckAgent uses Tailwind with shadcn/ui, and not the CSS Modules of open-design. The tokens of `apps/web/DESIGN.md` become the theme variables of shadcn/ui ([Browser Rules](web-rules.md#styles)).
- `utils/`. The project structure of DeckAgent forbids a `utils` folder [[6]](#ref-6).

## Gap between DeckAgent and open-design

| Capability of open-design | DeckAgent today | Where it goes |
| --- | --- | --- |
| Sandboxed preview with `srcDoc` | Has it, with hand-built DOM | Page `deck`, component that owns the iframe |
| Streamed chat with execution record | Has a request row and feedback, hand-built DOM | Page `chat`, hook for the request stream |
| Rich text editor (`lexical`) | Plain `textarea` | `Open`: only when a use case needs rich text |
| Canvas editing | Not yet (UC-007, the use case for editing a deck on a canvas) | Editor core without React, and components that use it ([Browser Rules](web-rules.md#editor-core)) |
| Typed text dictionary | Text in each view file | One text table ([Browser Rules](web-rules.md#text-and-errors)) |
| Shared primitives | Global CSS for `button`, `input` and `select` | shadcn/ui primitives in `components/ui/` |

## References

1. <a id="ref-1"></a>[open-design repository at 10f3f96](https://github.com/nexu-io/open-design/tree/10f3f96e7d3cadcadd25b2b2f3a188c96877be0e)
2. <a id="ref-2"></a>[AGENTS.md of open-design](https://github.com/nexu-io/open-design/blob/10f3f96e7d3cadcadd25b2b2f3a188c96877be0e/AGENTS.md)
3. <a id="ref-3"></a>[components/chat/AGENTS.md of open-design](https://github.com/nexu-io/open-design/blob/10f3f96e7d3cadcadd25b2b2f3a188c96877be0e/apps/web/src/components/chat/AGENTS.md)
4. <a id="ref-4"></a>[Project Structure (crypto-force)](https://github.com/BuhDuy256/crypto-force/blob/main/docs/conventions/project-structure.md)
5. <a id="ref-5"></a>[React Router: Picking a Mode](https://reactrouter.com/start/modes)
6. <a id="ref-6"></a>[Project Structure](../../../conventions/project-structure.md)
