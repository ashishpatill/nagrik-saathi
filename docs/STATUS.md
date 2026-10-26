# Status — Nagrik Saathi

**Updated:** 2026-10-26

**Authority:** this file + [nagrik-saathi-improvement-plan.html](nagrik-saathi-improvement-plan.html) (v2).

[GOAL_AND_LOOP.md](GOAL_AND_LOOP.md) is kept as v1 history.

## Done

### v1 baseline (hackathon)

- Scaffold, 8 WebMCP tools, allowlist, docs, local lint/test/build
- Local inspector fallback when `originAgentCluster` blocks polyfill
- **I1** Brand-first civic UI (Literata/Figtree, ash paper, hero product name)
- **I2** Numbered action presets, human approval copy, inspector secondary
- **I3** Browser E2E on `localhost:3000` (paste/analyze real notice, EN/HI/MR, portal HTTPS, reminder deny/approve, family brief, draft_only, 8 tools)
- **I4** Public repo [ashishpatill/nagrik-saathi](https://github.com/ashishpatill/nagrik-saathi)
- **I5** Mobile-friendly stacks, labeled controls, Escape/backdrop deny, portal browse directory, docs closed
- Fixed Strict Mode remount wiping `document.modelContext` tool registry
- **No mock preload** — empty start; paste/upload + Analyze only
- Broader issuer matching + searchable reviewed-portal directory
- On-device photo OCR; dual **site language** vs **explain language** (en/hi/mr/ta/kn/gu/te/bn)

### Stage 0 — foundation

- Dependency security upgrades: Next 16.4.3, React 19.3.1, Zod 4.6.7,
  `@mcp-b/webmcp-polyfill` 6.0.3, pdfjs 6.4.299, Vite 8.3.5, Vitest 4.1.12,
  jsdom 30.1.3; narrow pnpm overrides for `brace-expansion`, `source-map-js`,
  and `body-parser`.
- `pnpm audit --audit-level high` reports **no known vulnerabilities**.
- `.github/workflows/ci.yml`: install, lint, test, build, audit, CycloneDX SBOM
  upload via `cdxgen`. Lighthouse is documented as a release check, not a
  per-PR job.
- `docs/CI.md`, `pnpm audit` / `pnpm sbom` scripts, `sbom.json` gitignored.
- CSP/HSTS/frame-ancestors/Referrer-Policy, per-IP rate limit, Verhoeff/Luhn
  redaction, `robots.txt`, `llms.txt`, `sitemap.xml`.
- Local Lighthouse against the production build (2026-10-26):
  - `/` — accessibility 100, best practices 100, SEO 100, performance 97
  - `/playground` — accessibility 100, best practices 100, SEO 100, performance 97
  - Run with `--force-prefers-reduced-motion` in headless Chrome; the entry
    animation otherwise prevents FCP in this display-less environment.

### Stage 1 — WebMCP depth

- One shared registry: `src/lib/agent/tools.ts`, with browser/Node-safe types
  in `src/lib/agent/types.ts`.
- 12 tools, up from 8. New: `verify_portal_url`, `redact_pii`,
  `translate_brief`, `generate_checklist_document`.
- Explicit metadata on every tool: `trustLevel`, `maxFrequency`,
  `untrustedContentHint`, `requiresApproval`, `requiresCase`, `mcpExposed`,
  `maxResultChars`, `exampleInput`.
- Schemas are `z.strictObject` and JSON Schemas are generated with
  `z.toJSONSchema`; `additionalProperties: false` everywhere.
- Real-date validation for reminders; URL verification handles lookalike hosts,
  HTTP, credentials, non-standard ports, and unreviewed paths.
- Registry `verifyPortalUrl` added to `src/lib/portals.ts`.
- Localized required-document lists via `requiredDocumentsForCase`.
- `/playground` public tool runner: all 12 tools, metadata, JSON input,
  approval modal, result preview, explicit download button, no sample preload.
- Playground linked from the workspace header.
- Browser interaction on `/playground` (2026-10-26): ran `redact_pii` on
  synthetic Aadhaar/PAN/card/account text; result reported
  `status: "redacted"` with four redactions, and the console had no errors.

### Stage 2 — MCP server foundation

- Official MCP SDK 1.32.2; `tsx` 4.23.15.
- `mcp/create-server.ts` registers the 10 `mcpExposed` tools and publishes
  `trustLevel` / `maxFrequency` as `_meta` hints.
- `mcp/http.ts`: Streamable HTTP, per-session MCP servers, bearer auth,
  loopback guard, `/health`, CORS, 1 MB body cap, 404 on unknown paths.
- `mcp/server.ts`: stdio and HTTP entrypoints; logs to stderr only.
- `mcp/README.md` documents local stdio/HTTP use, auth, privacy boundary, and
  the 10-tool surface.
- Tests: end-to-end over `InMemoryTransport` and a real
  `StreamableHTTPClientTransport` client.
- `public/.well-known/agent-card.json` is an honest skeleton with a loopback
  placeholder URL and an explicit "no A2A endpoint is deployed" note.
- Stdio smoke-tested from outside the repo with
  `tsx --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts`.

### Verification (local, 2026-10-26)

- `pnpm lint` — 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test` — **58 tests across 9 files** pass
- `pnpm build` — passes; `/playground` is emitted as a static route, plus `/icon.svg`
- `pnpm sbom` — passes; 774 components in CycloneDX 1.7; `sbom.json` is gitignored
- `pnpm audit --audit-level high` — no known vulnerabilities

## Remaining

### Stage 0 close-out

- Push the CI workflow and confirm the first GitHub Actions run is green.
- Repeat the Lighthouse check on the deployed HTTPS URL for `/` and
  `/playground`.
- Verify headers, `llms.txt`, `sitemap.xml`, and the Agent Card on the deployed
  HTTPS URL.

### Stage 1 close-out

- Run the 12-tool surface in a Chrome origin-trial build and record the
  inspector result. Current evidence is the local playground and unit tests.
- Record a ChatGPT Site-tools run only if an eligible account is available.

### Stage 2 close-out

- Deploy the HTTP transport to an always-on host with TLS and a bearer token.
- Record a real Claude Desktop stdio run and a custom-harness HTTP run.

### Later stages

- Stage 3 process playbooks (15 workflows), Stage 4 resilience/PWA/health fleet,
  Stage 5 identity + encrypted cloud cases, Stage 6 language/accessibility
  depth, Stage 7 security audit, Stage 8 government integration prep,
  Stage 9 Phase 2.
- Expand reviewed portal coverage beyond Maharashtra + national seeds.
- Add Dependabot/Renovate, OSV scan, and Lighthouse CI once a preview URL exists.
- OAuth/per-user identity and server-side frequency enforcement for MCP.

## Deferred

- ChatGPT Site-tools recording
- Vercel HTTPS deploy (optional)
- Hindi/Tamil OCR language packs beyond English Tesseract
- True PDF export for `generate_checklist_document`; it currently returns
  print-ready HTML so Indic fonts stay in the browser instead of being embedded
  in a generated PDF.

## v1 I3 evidence (local browser, historical)

- Marathi + Hindi summaries switch correctly
- Portal link `https://wss.mahadiscom.in/wss/wss`
- `schedule_reminder` cancelled then success; `export_family_brief` success
- Inspector shows `8 tools · Local`; `draft_citizen_letter` → `status: draft_only`
- Safety line visible; no credential fields
- After remount fix, `getTools()` returns all 8 tools

This evidence predates the 12-tool registry. It must not be cited as proof of
the Stage 1 surface.
