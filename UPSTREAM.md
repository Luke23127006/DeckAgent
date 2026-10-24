# Cordis source provenance

DeckAgent reuses Cordis and its existing vendor ecosystem from [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317), commit `687f282e8625c6b8d11ff58211a90524be2e4317`. The original import happened in TASK-001. The task owner clarified on 20-10-2026 that the Agent Harness must be DeckAgent code. TASK-002-A therefore removes Harness app-boot and its four utility packages, and implements its own Agent Runtime, model/storage contracts, tools, and bootstrap. The retained MIT notice is in [UPSTREAM-LICENSE](UPSTREAM-LICENSE); package-specific notices remain alongside their source.

| Imported path | Package |
| --- | --- |
| `vendor/cosmokit` | `@deepseek-ai/cosmokit` |
| `vendor/cordis` | `@deepseek-ai/cordis` |
| `vendor/schemastery` | `@deepseek-ai/schemastery` |
| `vendor/loader` | `@deepseek-ai/cordis-plugin-loader` |
| `vendor/include` | `@deepseek-ai/cordis-plugin-include` |
| `vendor/group` | `@deepseek-ai/cordis-plugin-group` |

The six vendor packages keep their original identities and optional peer dependencies. The applications use Cordis directly; they do not activate Loader, Include or Group. The remaining vendor plugins and Schemastery are retained from the foundation import, not replaced or silently renamed. Third-party dependencies are pinned by `pnpm-lock.yaml`. The Cordis/Include peer cycle is inherited and may appear during install.

## Adaptations

- Imported `src/` trees, package identities, versions, runtime dependencies, peer dependencies, exports and package TypeScript configurations are unchanged from the pinned Harness snapshot. These libraries already contain Harness modifications to their original upstreams; see its [vendor modification log](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/README.md).
- Package `devDependencies` are omitted: they belong to upstream development/tests. DeckAgent declares the build tools and declaration dependencies it uses at the root. Imported upstream test suites are not included or claimed as executed.
- Root workspace and TypeScript files are DeckAgent-specific. The strict compiler options follow the pinned Harness base, with path aliases/references limited to the imported closure and local fixture/application. Package-specific compiler exceptions remain as upstream defined them.
- [scripts/build-workspace.mjs](scripts/build-workspace.mjs) builds the retained vendor packages and DeckAgent-owned packages/apps using `tsc -b` followed by tsdown. It retains Schemastery's ESM/CJS exports and emits both CLI entry points. There is no Harness boot, Typert, worker, browser or desktop build.
- Node `^22.19.0 || >=24.0.0` and pnpm `11.28.5` follow the source manifest. Build dependency ranges also follow that manifest; resolved versions are in the lockfile. The existing review tooling stays pinned at `1.12.7`. Its install script selects the platform package, with checksum-validated download as fallback; pnpm explicitly permits that version's script. The builtin-access package's install script stays disabled as upstream specifies; platform optional dependencies must remain installed.
- pnpm owns the workspace lockfile, replacing the former tooling-only npm lockfile. Use pnpm for both application and review tooling; existing `ocr` scripts remain available.

## Local Cordis smoke contract

`packages/testing/cordis-fixture` and `apps/cordis-smoke` are DeckAgent-owned smoke scaffolding. They establish no Deck Domain or Web API boundary.

- `startCordisSmoke(probe, options?)` creates a Cordis context and mounts the provider and consumer directly with `ctx.plugin()`. `options.withProvider: false` supplies the negative smoke scenario. This replaces the former YAML-path argument; both repository callers/tests are updated and the obsolete YAML fixtures are removed.
- The caller supplies `cordisSmokeProbe.record(event)`. The provider exposes `cordisSmokeGreeting.greet(name)`. The consumer injects that service, records its result and exposes `cordisSmokeReady` only after activation.
- Both plugins register disposers through the public Cordis fiber lifecycle. Root unload removes their services and runs cleanup once.
- The application requires its fixture greeting/readiness services and disposes the context before rejecting a partial composition. The missing-provider test continues to verify dependency failure instead of accepting a pending consumer as a successful boot.

A owns Runtime and application wiring for TASK-002-A. Real providers/credentials belong to TASK-002-B; durable storage/restart verification belong to TASK-002-C. See [Runtime contracts and handoff](docs/v1-plan/task-002-a-agent-runtime.md). Runtime source is newly authored DeckAgent code; no DeepSeek Agent Loop, LLM, Tool Runtime or Session implementation is imported.

## Verification scope

Gate candidate checks are `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:cordis-smoke` and `pnpm start:cordis-smoke` on Windows. Run `node tests/ux-02-prototype.test.cjs` when validating the package-manager transition against the existing prototype. Record actual results and the tested revision in [PROGRESS.md](docs/v1-plan/PROGRESS.md).

The Cordis smoke CLI prints its greeting and unloads. Its tests cover service registration/injection, repeated cleanup and missing dependencies. `pnpm test:agent-runtime` verifies DeckAgent's Harness using test fixtures; the fake model demo and `start:agent-runtime` script were removed in TASK-002-C. `pnpm chat` uses the real provider adapters and DeckAgent's SQLite Session backend (`node:sqlite`, no external production dependency). `pnpm test:session-persistence` verifies storage and separate-process CLI restart using local HTTP. These checks do not prove authenticated cloud restart, Web behavior or cross-platform support. Gate 002 remains open until the integrated dev baseline is verified. See [Session Persistence](docs/v1-plan/task-002-c-session-persistence.md).
