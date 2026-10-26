# Foundation libraries

These packages are copied from the vendor ecosystem of
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317)
at pinned commit `687f282e8625c6b8d11ff58211a90524be2e4317`:

| Imported path | Package |
| --- | --- |
| `vendor/cosmokit` | `@deepseek-ai/cosmokit` |
| `vendor/cordis` | `@deepseek-ai/cordis` |
| `vendor/schemastery` | `@deepseek-ai/schemastery` |
| `vendor/loader` | `@deepseek-ai/cordis-plugin-loader` |
| `vendor/include` | `@deepseek-ai/cordis-plugin-include` |
| `vendor/group` | `@deepseek-ai/cordis-plugin-group` |

The applications use Cordis directly; they do not activate Loader, Include or
Group. The Cordis/Include peer cycle is inherited from the snapshot and may
appear during install.

## Adaptations

- Imported `src/` trees, package identities, versions, runtime and peer
  dependencies, exports, and package TypeScript configurations are unchanged
  from the pinned snapshot; these libraries already carry Harness modifications
  to their original upstreams (see its
  [vendor modification log](https://github.com/deepseek-ai/deepseek-harness/blob/687f282e8625c6b8d11ff58211a90524be2e4317/vendor/README.md)).
- Package `devDependencies` are omitted: they belong to upstream development
  and tests. Imported upstream test suites are not included and are not claimed
  as executed.
- Third-party dependencies stay pinned by `pnpm-lock.yaml`.
- The retained MIT notice is in [UPSTREAM-LICENSE](../UPSTREAM-LICENSE);
  package-specific notices remain alongside their source.

Keep imported `src/` unchanged when configuration or a public extension API
suffices. Record every future source divergence and its reason in the
Adaptations list above before updating the snapshot.
