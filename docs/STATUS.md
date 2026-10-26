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
- PR [#1](https://github.com/ashishpatill/nagrik-saathi/pull/1) merged to
  `master` as `6790f62`; the feature branch was deleted. The first CI run on
  `master` is green
  ([40316807095](https://github.com/ashishpatill/nagrik-saathi/actions/runs/40316807095)).
- Production is live at <https://nagrik-saathi.vercel.app>. Verified over
  HTTPS: CSP (no `unsafe-eval`), HSTS, `frame-ancestors 'none'`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: tools=(self)`, `X-Content-Type-Options: nosniff`.
  `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/agent-card.json`,
  and `/playground` all return 200.
- Deployed Lighthouse (2026-10-26, after the playground font-size pass):
  - `/` — performance 95, accessibility 100, best practices 100, SEO 100
  - `/playground` — performance 95, accessibility 100, best practices 100,
    SEO 100
  - Performance varied between runs (home 82–96, playground 91–100); the
    numbers above are the last full run. The earlier playground legibility
    deduction is gone.
  - `/playground` intermittently fails the `robots.txt` audit in combined
    runs because Lighthouse's internal fetch times out after two seconds;
    direct `curl` and an SEO-only run both pass. Documented in `docs/CI.md`.
  - Run with `--force-prefers-reduced-motion` in headless Chrome; the entry
    animation otherwise prevents FCP in this display-less environment.
- Agent Card is served with an explicit skeleton note and
  `endpointDeployed: false`; its `url` is a production placeholder, not
  loopback.

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
- Native Chrome close-out (2026-10-26): Chrome 154.0.8037.93, local
  production build, WebMCP feature enabled. The inspector reported
  **12 tools · Native**. All 12 tools were executed through native
  `document.modelContext.executeTool`; both side-effect tools showed the
  approval modal and succeeded after approval. Evidence and the screenshot
  are in [iterations/STAGE1-CLOSEOUT.md](iterations/STAGE1-CLOSEOUT.md).
- Fixed the runtime mode label: the MCP-B polyfill no longer reports itself
  as “Native” when it is the active context.

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
- `public/.well-known/agent-card.json` is an honest skeleton with a
  production placeholder URL, `endpointDeployed: false`, and an explicit
  "no A2A endpoint is deployed" note.
- Stdio smoke-tested from outside the repo with
  `tsx --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts`.
- Custom-harness runs recorded in [iterations/STAGE2-MCP.md](iterations/STAGE2-MCP.md):
  HTTP with bearer auth (`/health` 200, missing token 401, 10 tools,
  `verify_portal_url` and `redact_pii`), and stdio via the official SDK client
  (10 tools, Marathi summary).

### Verification (local, 2026-10-26)

- `pnpm lint` — 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test` — **58 tests across 9 files** pass
- `pnpm build` — passes; `/playground` is emitted as a static route, plus `/icon.svg`
- `pnpm sbom` — passes; 774 components in CycloneDX 1.7; `sbom.json` is gitignored
- `pnpm audit --audit-level high` — no known vulnerabilities

## Remaining

### Stage 2 close-out

- Deploy the HTTP transport to an always-on host with TLS and a bearer token.
- Record a real Claude Desktop stdio run. Claude Desktop is not installed on
  this host; the existing profile directory is a leftover, and the `claude`
  CLI is Claude Code, not Desktop.

### Stage 1 follow-up

- Record a ChatGPT Site-tools run only if an eligible account is available.
- Request a production origin-trial token so native WebMCP works for ordinary
  visitors before Chrome ships it broadly.

### Later stages

- Stage 3 process playbooks (15 workflows), Stage 4 resilience/PWA/health fleet,
  Stage 5 identity + encrypted cloud cases, Stage 6 language/accessibility
  depth, Stage 7 security audit, Stage 8 government integration prep,
  Stage 9 Phase 2.
- Expand reviewed portal coverage beyond Maharashtra + national seeds.
- Add Dependabot/Renovate, OSV scan, and Lighthouse CI against production
  (preview URLs are SSO-protected; use a protection bypass or the public
  production URL).
- OAuth/per-user identity and server-side frequency enforcement for MCP.

## Deferred

- ChatGPT Site-tools recording
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
