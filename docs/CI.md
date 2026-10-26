# CI and supply-chain gates

The repository now has one mandatory GitHub Actions workflow:
`.github/workflows/ci.yml`.

Every push to `master` and every pull request runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm playbooks:check` (validates every YAML playbook and fails if the
   generated JSON registry is stale)
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`
6. `pnpm audit --audit-level high`
7. `pnpm sbom` (CycloneDX JSON via `cdxgen` against `pnpm-lock.yaml`) and
   uploads the result as an artifact

## Local commands

```sh
pnpm playbooks:build   # rewrite src/data/playbooks.generated.json
pnpm playbooks:check   # validate + fail if the generated file is stale
pnpm lint
pnpm test
pnpm build
pnpm audit
pnpm sbom             # writes sbom.json (gitignored)
```

`sbom.json` is generated, not committed. The CI artifact is the reviewable
record for a release.

## Playbook gate

`content/playbooks/*.yaml` is the source of truth. The build script checks the
schema, the required 15 workflows plus the Aadhaar guidance page, unique slugs
and order values, portal keys against `src/data/official-portals.ts`, and that
only `aadhaar-update` is guidance-only. `src/data/playbooks.generated.json` is
committed so the UI can import it without a build step; `playbooks:check`
compares a fresh serialization with the committed file.

A stale generated file fails CI with:

```text
src/data/playbooks.generated.json is stale. Run `pnpm playbooks:build` and commit the result.
```

Run `pnpm playbooks:build` after any YAML change and commit both files
together. The tests also re-validate the YAML sources and compare them with
the generated registry, so a hand-edited JSON file fails twice.

## Current advisory state

The dependency upgrades cleared the known high/critical advisories by updating
Next.js (16.4.3), Zod (4.6.7), Vite/Vitest, and adding narrow pnpm overrides
for `brace-expansion`, `source-map-js`, and `body-parser`. `pnpm audit
--audit-level high` currently reports no known vulnerabilities. Re-run
`pnpm audit` after every dependency change; do not silence a finding without a
documented reason.

## Lighthouse

Lighthouse is a release check, not a per-PR check yet. Against production
(`https://nagrik-saathi.vercel.app`) on 2026-10-26, after the playground
font-size pass:

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 95 | 100 | 100 | 100 |
| `/playground` | 95 | 100 | 100 | 100 |

Performance varied between runs on this network (home 82–96, playground
91–100); the table records the last full run. Accessibility, best practices,
and SEO were 100 apart from the caveat below. The earlier playground deduction
(“document doesn't use legible font sizes”, 13.9% legible) is gone after
raising 9–11px text to 12px.

`/playground` intermittently reports `robots.txt is not valid` with
“Lighthouse was unable to download a robots.txt file” in combined-category
runs. The file is valid: direct `curl` returns 200 over IPv4 and IPv6, a
`--only-categories=seo` run scores it 1, and the next full run passed. The
cause is Lighthouse's internal `Network.loadNetworkResource` fetch, which
times out after two seconds under load. Treat it as runner flake, not a site
defect, and re-run before filing an issue.

Headless Chrome on a display-less macOS host needs
`--force-prefers-reduced-motion`; otherwise the entry animation prevents a
First Contentful Paint and Lighthouse reports `NO_FCP`. Do not disable the
animation for users to work around a test-runner limitation.

If a deployment preview is added, wire Lighthouse CI to the public production
URL (or a protection-bypassed preview) rather than running a browser in every
pull request. Production header and discovery-file checks are recorded in
[`STATUS.md`](STATUS.md).
