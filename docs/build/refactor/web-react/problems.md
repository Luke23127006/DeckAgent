# Browser Problems

Read this file to know the problems of `apps/web/` before Phase 5 of the Target Structure Refactor, with the evidence for each problem and its direction.

This file records a scan of `apps/web/` on 2026-11-27 on branch `refactor` at commit `c0368df`. The rules that fix the problems are in [Browser Rules](web-rules.md). The labels are the same as in [Reference Products](reference-products.md): `Measured`, `Inferred`, `Proposed` and `Open`.

| Prefix | Group | Source |
| --- | --- | --- |
| `WB` | Browser problems in [Problems](#problems) | Scan of `apps/web/` on 2026-11-27 |

## Problems

| ID | Problem | Evidence (`Measured` unless labeled) | Direction |
| --- | --- | --- | --- |
| WB-01 | Every screen builds DOM by hand | 316 calls of the `element()` helper in `apps/web/src/browser/`. Helpers in `dom.ts`, `shell-dom.ts` and `features/providers/settings-dom.ts`. Criterion TS-07 (use common libraries) forbids this [[1]](#ref-1) | React components, one screen per revision |
| WB-02 | The package `@deckagent/local-web` holds Node code that the Host runs | `apps/web/src/index.ts` (310 lines) imports `node:fs/promises` and `node:path`, holds the HTML page and the CSS as strings, and exports `loadWebAssets`. `apps/host/src/server.ts` imports `loadWebAssets` from `@deckagent/local-web` | The Vite build makes the assets. The Host serves the build folder. `apps/web/` has no Node code |
| WB-03 | The Browser imports a domain package | `apps/web/src/browser/transport/deck-client.ts` imports `decodeSlideDocument`, `decodeArtifactDescriptor` and `decodeContentOrigins` from `@deckagent/presentation-document`. The project structure allows only `packages/contracts` [[2]](#ref-2) | Decided: the contracts package exports a decoder for each deck payload that the Browser reads. The decoder calls the decoder of `@deckagent/presentation-document`, which keeps the validation of `SlideDocument`. `check:boundaries` still allows the document package for the Browser in `BROWSER_ALLOWED_PACKAGES`. Phase 7 removes it from the list |
| WB-04 | Hand-written decoders exist next to the Zod decoders of the contracts package | `transport/management-decoders.ts` has 303 lines and 11 exported functions. Other clients already use `decode*` from `@deckagent/host-contracts` | Each response goes through a `decode*` function of the contracts package |
| WB-05 | All styles are one CSS string in a TypeScript file | `style` in `apps/web/src/index.ts`, with the tokens of `apps/web/DESIGN.md` | Theme variables in `src/styles/`. Component styles in Tailwind classes. Primitives from shadcn/ui ([Browser Rules](web-rules.md#styles)) |
| WB-06 | Server state has no owner | `boot.ts` (472 lines), `request-runner.ts` (377 lines), `draft-sync.ts` and `change-watcher.ts` each read the Host and keep copies | TanStack Query owns server state. A change notice invalidates the query of its topic |
| WB-07 | The Browser uses "session" for the chat concept | `WebSession` and `sessionId` in Browser code. `sessionId` occurs 246 times in `apps/web/src/` [[3]](#ref-3) | New code uses `Chat` for types and symbols. `sessionId` stays in the wire until Phase 8 of the Naming and Grouping Refactor [[3]](#ref-3) |
| WB-08 | Tests run on the build output and cannot render a component | 7 `*.test.mjs` files in `apps/web/tests/` with `node:test`. There is no DOM environment | Decided: Vitest with jsdom, Testing Library and MSW in Node. See [Browser Rules](web-rules.md#tests) |
| WB-09 | Two TypeScript projects split one package | `tsconfig.json` builds `src/` without `src/browser/**`. `tsconfig.browser.json` builds `src/browser/` with the `DOM` lib | One Vite project with one `tsconfig` for the Browser |
| WB-10 | The folder rules of the Browser describe a feature layout | The project structure and the target layout use `apps/web/src/features/<name>/` [[2]](#ref-2) [[4]](#ref-4). The `check:boundaries` rules `browser-feature-private-import`, `browser-feature-cycle` and `browser-transport-ui-import` follow that layout | Change the target to the layer layout in [Browser Rules](web-rules.md#layout). Replace each rule with a folder rule that has a negative fixture |
| WB-11 | Motion uses a library that React code may not need | `animejs` 4.5.0 in `devDependencies`, `motion.ts` has 353 lines | `Open`: keep `animejs`, use CSS transitions, or use `motion`. Decide in the phase that moves the screen with the motion |

## References

1. <a id="ref-1"></a>[Target Structure Criteria](../target-structure/criteria.md)
2. <a id="ref-2"></a>[Project Structure](../../../conventions/project-structure.md)
3. <a id="ref-3"></a>[Naming and Grouping Refactor](../naming-and-grouping/README.md)
4. <a id="ref-4"></a>[Target Layout](../target-structure/target-layout.md)
