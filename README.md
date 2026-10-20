# DeckAgent

AI-powered presentation editor that turns user intent into structured slide plans, editable
content, and exportable presentations.

## Foundation workspace (TASK-001)

Use Node `^22.19.0 || >=24.0.0` and pnpm `11.28.5`. From the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm test:foundation
pnpm start:foundation
```

The foundation CLI loads Cordis plugins, prints `Hello, DeckAgent`, then unloads
them. It is the boot baseline for later Agent and Web implementation. Keep
optional dependencies enabled for the Loader's Windows native prebuilt. See
[source provenance and fixture contract](UPSTREAM.md) and
[current progress](docs/v1-plan/PROGRESS.md) for handoff and verification limits.

[Foundation CI](.github/workflows/foundation.yml) runs these four checks plus the
UX prototype regression on Windows for PRs targeting `dev`/`main` and pushes to
those branches. Each run records the tested SHA and check results in its summary.
Use the successful push run on the merged `dev` SHA as Gate 001 evidence in the
progress dashboard. The workflow can also be started manually once available in
GitHub Actions. Branch protection is configured separately in repository settings.

## Development tooling

- OpenCodeReview workspace tooling: [docs/tooling/open-code-review.md](docs/tooling/open-code-review.md)
- Shared agent skill maintenance: [docs/agents/skill-maintenance.md](docs/agents/skill-maintenance.md)
