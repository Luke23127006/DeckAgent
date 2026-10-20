# Foundation source provenance

TASK-001 imports source from [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317), commit `687f282e8625c6b8d11ff58211a90524be2e4317` (verified 20-10-2026). The retained MIT notice is in [UPSTREAM-LICENSE](UPSTREAM-LICENSE); package-specific notices remain alongside their source. This is selective source reuse, not a copy of the full Harness application.

| Imported path | Package |
| --- | --- |
| `vendor/cosmokit` | `@deepseek-ai/cosmokit` |
| `vendor/cordis` | `@deepseek-ai/cordis` |
| `vendor/schemastery` | `@deepseek-ai/schemastery` |
| `vendor/loader` | `@deepseek-ai/cordis-plugin-loader` |
| `vendor/include` | `@deepseek-ai/cordis-plugin-include` |
| `vendor/group` | `@deepseek-ai/cordis-plugin-group` |
| `packages/util/atomic-write` | `@deepseek-ai/dsh-atomic-write` |
| `packages/util/package-manifest` | `@deepseek-ai/dsh-package-manifest` |
| `packages/util/home-paths` | `@deepseek-ai/dsh-home-paths` |
| `packages/util/launch-environment` | `@deepseek-ai/dsh-launch-environment` |
| `packages/boot/app-boot` | `@deepseek-ai/dsh-app-boot` |

The inventory follows workspace `dependencies` and `peerDependencies` from `app-boot`, including optional Cordis peers so Include/Loader/Group can boot together. Third-party dependencies are installed from the registry and pinned by `pnpm-lock.yaml`. Loader's `node-addon-require-builtin` platform prebuilt is needed for bare package resolution on Windows. The Cordis/Include peer cycle is inherited; a successful install can report it.

## Adaptations

- Imported `src/` trees, package identities, versions, runtime dependencies, peer dependencies, exports and package TypeScript configurations are unchanged from the pinned Harness snapshot. These libraries already contain Harness modifications to their original upstreams; see its [vendor modification log](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/README.md).
- Package `devDependencies` are omitted: they belong to Harness development/tests, including Agent packages outside TASK-001. DeckAgent declares the build tools and declaration dependencies it actually uses at the root. Imported upstream test suites are not included or claimed as executed.
- Root workspace and TypeScript files are DeckAgent-specific. The strict compiler options follow the pinned Harness base, with path aliases/references limited to the imported closure and local fixture/application. Package-specific compiler exceptions remain as upstream defined them.
- [scripts/build-foundation.mjs](scripts/build-foundation.mjs) replaces the full Harness build pipeline with `tsc -b` followed by tsdown over this closure. It retains Schemastery's ESM/CJS exports, embeds Include in app-boot while keeping Loader external, and builds the worker bootstrap with `resolve.exports` bundled. It does not run Typert, native-system, browser or desktop builds.
- Node `^22.19.0 || >=24.0.0` and pnpm `11.28.5` follow the source manifest. Build dependency ranges also follow that manifest; resolved versions are in the lockfile. The existing review tooling stays pinned at `1.12.7`. Its install script selects the platform package, with checksum-validated download as fallback; pnpm explicitly permits that version's script. The builtin-access package's install script stays disabled as upstream specifies; platform optional dependencies must remain installed.
- pnpm owns the workspace lockfile, replacing the former tooling-only npm lockfile. Use pnpm for both application and review tooling; existing `ocr` scripts remain available.

## Local foundation contract

`packages/testing/foundation-fixture` and `apps/foundation` are DeckAgent-owned smoke scaffolding. They establish no Agent, Deck Domain or Web API boundary.

- `startFoundation(probe, configPath?)` invokes the imported `boot()` with an absolute YAML configuration path; the default is `apps/foundation/cordis.yml`.
- The caller supplies `foundationProbe.record(event)`. The provider exposes `foundationGreeting.greet(name)`. The consumer injects that service, records its result and exposes `foundationReady` only after activation.
- Both plugins register disposers through the public Cordis fiber lifecycle. Root unload removes their services and runs cleanup once.
- Harness startup rejects its own required-entry failures but only warns for other inactive entries. This assembly additionally requires its fixture greeting/readiness services and disposes the context before rejecting if they are unavailable. The negative smoke deliberately emits a pending-service warning before this rejection.

A owns root manifests, lockfile, build wiring and application composition; B owns imported boot dependency inventory; C owns the fixture and integration smoke. This TASK-001 working tree implements all three on one feature branch at the task owner's request. Future changes should retain the normal subtask branch/PR ownership workflow.

## Verification scope

Gate candidate checks are `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:foundation` and `pnpm start:foundation` on Windows. Run `node tests/ux-02-prototype.test.cjs` when validating the package-manager transition against the existing prototype. Record actual results and the tested revision in [PROGRESS.md](docs/v1-plan/PROGRESS.md).

The CLI intentionally boots the fixture, prints its greeting and unloads it. The tests cover service registration/injection, cleanup including repeated unload, and rejection when the provider is missing. They do not validate profile management, worker runtime resolution, all upstream APIs or cross-platform behavior. Imported worker output is built to preserve the app-boot export, but is not runtime-tested here.
