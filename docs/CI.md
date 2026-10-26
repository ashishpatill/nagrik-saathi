# CI and supply-chain gates

The repository now has one mandatory GitHub Actions workflow:
`.github/workflows/ci.yml`.

Every push to `master` and every pull request runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. `pnpm audit --audit-level high`
6. `pnpm sbom` (CycloneDX JSON via `cdxgen` against `pnpm-lock.yaml`) and
   uploads the result as an artifact

## Local commands

```sh
pnpm lint
pnpm test
pnpm build
pnpm audit
pnpm sbom          # writes sbom.json (gitignored)
```

`sbom.json` is generated, not committed. The CI artifact is the reviewable
record for a release.

## Current advisory state

The dependency upgrades cleared the known high/critical advisories by updating
Next.js (16.4.3), Zod (4.6.7), Vite/Vitest, and adding narrow pnpm overrides
for `brace-expansion`, `source-map-js`, and `body-parser`. `pnpm audit
--audit-level high` currently reports no known vulnerabilities. Re-run
`pnpm audit` after every dependency change; do not silence a finding without a
documented reason.

## Lighthouse

Lighthouse is a release check, not a per-PR check yet. Against a local
production build on 2026-10-26:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 97 | 100 | 100 | 100 |
| `/playground` | 97 | 100 | 100 | 100 |

Headless Chrome on a display-less macOS host needs
`--force-prefers-reduced-motion`; otherwise the entry animation prevents a
First Contentful Paint and Lighthouse reports `NO_FCP`. Do not disable the
animation for users to work around a test-runner limitation.

If a deployment preview is added, wire Lighthouse CI to that URL rather than
running a browser in every pull request. Deployed header/`llms.txt` checks are
still open.
