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

### Stage 3 — process playbooks

- 16 versioned YAML playbooks in `content/playbooks/`: the 15 planned
  workflows plus `aadhaar-update`, the only `guidanceOnly` page.
- Zod contract in `src/lib/playbooks/schema.ts`; generated registry in
  `src/data/playbooks.generated.json`; helpers in
  `src/lib/playbooks/registry.ts`.
- `pnpm playbooks:build` validates every source and rewrites the JSON;
  `pnpm playbooks:check` fails when the committed JSON is stale. CI runs the
  check before lint.
- Portal links are registry keys only. Nine reviewed portals were added to
  `src/data/official-portals.ts` so no playbook carries a raw URL.
- Public reader: `/playbooks` grouped by category, `/playbooks/[slug]` with
  English, Hindi, and Marathi overview tabs, steps, documents, helplines,
  rejection reasons, and reviewed portal links. Step detail and document
  lists are English-only for now, with a visible fallback note.
- `/sitemap.xml` is generated by `src/app/sitemap.ts` and covers every
  playbook; `public/sitemap.xml` was removed. `public/llms.txt` has a
  playbook discovery section.
- Community pipeline: `.github/ISSUE_TEMPLATE/playbook-correction.yml` and
  `docs/PLAYBOOKS.md` document the source-of-truth, schema, review rules, and
  contribution flow.
- Tests in `src/lib/playbooks/playbooks.test.ts`: schema, generated-file
  parity, required slugs, portal references, guidance-only rule,
  localization, ordering, and fallback behavior.
- `lookup_process_playbook` is deliberately deferred to Stage 4, consistent
  with the plan's tool order.

### Stage 4 — resilience, portal health, and offline PWA

- On-demand portal health instead of a scheduled fleet:
  `src/lib/portal-health.ts` probes each reviewed portal once with a
  four-second timeout and a bounded worker pool. `401`, `403`, `405`, and
  `429` are `restricted` because the portal answered but refused an automated
  client; other `4xx`/`5xx` responses and timeouts are `down`.
- `GET /api/portal-health` probes at most 12 registry keys per request,
  rejects unknown keys and unbounded requests, rate-limits 20 checks per IP,
  and caches the response at the edge for two minutes. The dashboard sends
  four parallel batches for the 39-portal registry (38 unique URLs).
- `/status` is a public dashboard: summary counts, per-portal HTTP status,
  latency, reviewed date, helpline, filter, recheck button, and a plain
  "what this measures" note. It is not an official uptime guarantee.
- Last-known-good: each successful check is stored in `localStorage`. If a
  later check fails, the dashboard shows the saved rows with a visible
  timestamp and a "saved in this browser" label, plus an alert. A saved row
  is never presented as live.
- PWA: `/manifest.webmanifest`, `/offline`, a production-only registrar, and
  a connection banner. `scripts/sw-template.js` is the source;
  `pnpm playbooks:build` generates `public/sw.js` with a build hash so every
  content or worker change produces a byte-different worker.
- Cache versions are explicit: `nagrik-static-<hash>`. Install precaches the
  core routes plus all 16 playbooks (24 URLs at Stage 4; 25 after `/privacy`
  was added in Stage 5); activate removes older `nagrik-` caches. Navigations
  are network-first with a `5xx`/offline fallback to the cached document or
  `/offline`; static chunks are cache-first; other same-origin assets are
  stale-while-revalidate; `/api/*` is never cached.
- `pnpm playbooks:build` now writes the playbook JSON,
  `public/precache-manifest.json`, and `public/sw.js`;
  `pnpm playbooks:check` fails if any of the three is stale, and CI runs it
  before lint.
- Navigation and discovery: `/status` is linked from the home header and the
  playbook/playground pages, included in the sitemap, and the PWA manifest
  sets the theme color.
- Tests: `src/lib/portal-health.test.ts` covers status classification,
  restricted/down, timeouts, concurrency/order, and summaries;
  `src/lib/playbooks/playbooks.test.ts` covers the precache manifest and the
  generated worker hash.

### Stage 5 — encrypted case backup and local deletion

- `src/lib/case-vault.ts` defines a versioned, client-side backup envelope.
  The user's passphrase is stretched with PBKDF2-SHA-256 (600,000
  iterations) and a random 16-byte salt; the case bundle is encrypted with
  AES-GCM-256 and a random 12-byte IV. The format, version, and creation time
  are bound as additional authenticated data, so editing the envelope breaks
  decryption.
- The passphrase is never stored, logged, sent, or placed in a URL. The file is
  written as ciphertext, and there is no recovery path if the passphrase is
  lost.
- Import treats the selected file as untrusted. A strict Zod schema validates
  every case field, duplicate IDs are rejected, the file is capped at 8 MB and
  200 cases, and unsupported versions, malformed files, and wrong passphrases
  return distinct error codes.
- `src/lib/storage.ts` gains `listCases`, `importCases`, and `deleteAllCases`.
  Import is idempotent by case ID and activates the first restored case.
  Delete clears the whole case store and the active-case pointer, and says
  plainly that it cannot reach a downloaded backup or another browser.
- `/privacy` is a public data page: an inventory of what is stored and where,
  encrypted export, restore, and a two-step delete control. It states that
  passkey identity, a server-side case store, and automatic sync are not
  built, so the encrypted file is the only cross-device path today.
- `/privacy` is linked from the workspace, playbooks, and playground headers,
  added to the sitemap, and included in the precache list. The generated
  worker cache now holds 25 URLs.
- Tests: `src/lib/case-vault.test.ts` covers round-trip fidelity, plaintext
  absence, wrong passphrase, tampered ciphertext, authenticated envelope
  changes, short passphrases, unsupported versions, malformed files, and the
  size and case caps.

### Stage 6 — scam pattern library (partial slice)

- `src/data/scam-patterns.ts` is the reviewed source of truth for ten patterns:
  `otp-pin-request`, `digital-arrest`, `personal-upi`,
  `electricity-disconnection`, `shortened-link`, `fee-to-release`,
  `document-over-chat`, `urgency-threat`, `whatsapp-only-contact`, and
  `qr-code-payment`.
- Every pattern declares a category, a severity, `match: "any" | "all"`,
  citizen-facing signals, why it matters, a safe action, a verification hint,
  registry keys, a source note, a review date, and deterministic rules.
- Every rule carries at least one positive example and one counterexample.
  `src/lib/scams.test.ts` fails if an example does not match or a counterexample
  does, so a broad regex cannot ship a false positive unnoticed. The rules are
  deliberately narrow: a genuine disconnection notice with a published helpline
  and a future date, an ordinary bill QR code, and a final notice with a
  reference number are counterexamples, not matches.
- `src/lib/scams.ts` runs the rules, sorts matches by severity, resolves portal
  keys through the reviewed registry, and writes the summary. The wording never
  declares a notice safe or fraudulent.
- `analyzeText` now derives `scamRiskScore` and `riskReason` from the library
  instead of a four-word regex. `check_scam_signals` returns the matched
  patterns, their safe actions, and reviewed verification links.
- `/scams` publishes the library: the signal framing, every pattern, the review
  rules, what to do after a payment, and the limits. It is linked from the
  workspace, playbooks, and playground headers, added to the sitemap, and added
  to the precache list. The generated worker cache now holds 26 URLs.
- `docs/SCAMS.md` records the schema, detection semantics, review and correction
  flow, and boundaries. `docs/SAFETY.md`, `AGENTS.md`, `public/llms.txt`, and
  the README carry the same rule: a match is a signal, not a verdict.
- Not built in this slice: the response studio (guided replies, objections,
  appeals) and the grievance routing graph (reviewed escalation paths). The
  plan's Stage 6 exit criterion is therefore only partly met.

### Verification — Stage 3 (local, 2026-10-26)

- `pnpm playbooks:check` — 16 playbooks valid, generated file current
- `pnpm exec tsc --noEmit` — clean
- `pnpm lint` — 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test` — **68 tests across 10 files** pass
- `pnpm build` — passes; `/playbooks`, all 16 `/playbooks/[slug]` routes, and
  `/sitemap.xml` are prerendered, plus `/playground` and `/icon.svg`
- Browser check on the production build: `/playbooks` lists all 16; the
  passport page switches to Hindi while step detail falls back to English with
  a visible note; the Aadhaar page shows the guidance banner and has zero
  input or textarea fields
- `pnpm sbom` — passes; CycloneDX 1.7; `sbom.json` is gitignored
- `pnpm audit --audit-level high` — no known vulnerabilities
- Lighthouse (accessibility / best practices / SEO) on `/playbooks`,
  `/playbooks/passport`, and `/playbooks/aadhaar-update` — 100 on all three
  after raising the footnote contrast from 4.28:1 to the stronger ink color

### Verification — Stage 4 (local, 2026-10-26)

- `pnpm playbooks:check` — 16 playbooks valid; JSON registry, precache
  manifest, and service worker current
- `pnpm exec tsc --noEmit` — clean
- `pnpm lint` — 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test` — **78 tests across 11 files** pass
- `pnpm build` — passes; 29 routes emitted, including `/status`, `/offline`,
  `/manifest.webmanifest`, `/api/portal-health`, and all 16 playbook pages
- API: a three-key batch returned measured results; no-key, 13-key, and
  unknown-key requests returned `400`; the response carried
  `s-maxage=120, stale-while-revalidate=600`
- `/status` on the production build: 39 rows, filter returned the passport
  row, summary updated to the live result, no browser console errors
- Lighthouse on `/status` — accessibility, best practices, and SEO all 100
- Offline, with the origin process stopped: a real in-page navigation to
  `/playbooks/passport` rendered the cached page; `/status` rendered with 39
  saved rows and the "live check failed" alert; an uncached route returned
  `/offline`; a dispatched offline event showed the connection banner
- Service worker: the versioned cache held all 24 precache URLs, the older
  cache was removed on activation, and `fetch('/playbooks/passport')` while
  the origin was down returned the 26 KB cached document
- Honest gap: this host has no bandwidth-throttling control, so the offline
  pass used a stopped origin and a disconnected event rather than a
  throttled profile. Scheduled probes, persistent history, and server-side
  snapshots still need a durable store and scheduler.

### Verification: Stage 5 (local, 2026-10-26)

- `pnpm playbooks:check`: 16 playbooks valid; registry, precache manifest, and
  service worker current
- `pnpm exec tsc --noEmit`: clean
- `pnpm lint`: 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test`: **88 tests across 12 files** pass, including 10 backup tests
- `pnpm build`: passes; 30 routes emitted, including `/privacy`
- Browser, production build, one real Pune property-tax notice seeded through
  the workspace:
  - `/privacy` showed 1 saved case and the six-row data inventory
  - export produced a 6,508-byte `nagrik-saathi-backup-2026-10-26.json`; a
    plaintext scan for issuer, reference number, amount, and the embedded
    Aadhaar-like number returned 0 matches; the envelope carried format,
    version 1, PBKDF2-SHA-256 at 600,000 iterations, and AES-GCM, and both
    passphrase fields were cleared
  - delete removed 1 case and the active pointer; the count fell to 0 and the
    delete button disabled
  - a wrong passphrase showed the "did not decrypt" alert and wrote nothing;
    the correct passphrase restored 1 case, set it active, and cleared the
    field
  - reopening the workspace loaded the restored notice, issuer, and amount with
    no console errors
- PWA: the single `nagrik-static-997f67b0c4` cache contained all 25 precache
  entries, including `/privacy`, alongside runtime static chunks
- Lighthouse on `/privacy`: the first run scored accessibility 96 because the
  table header used muted text at 4.28:1 on the wash background. The header now
  uses the stronger ink color and the rerun scored **100 accessibility, 100
  best practices, 100 SEO**.
- Honest gaps: the backup is a manual file transfer, not automatic sync;
  passkey identity and a server-side encrypted store are not built; there is no
  backup-format migration path yet, so a future version bump must add one.

### Verification — Stage 6 scam library (local, 2026-10-26)

- `pnpm playbooks:check`: 16 playbooks valid; generated registry, precache
  manifest, and service worker current
- `pnpm exec tsc --noEmit`: clean
- `pnpm lint`: 0 errors, 1 pre-existing `<img>` warning in `Workspace.tsx`
- `pnpm test`: **97 tests across 13 files** pass, including the pattern metadata
  and example/counterexample suite
- `pnpm build`: passes; 31 routes emitted, including `/scams`
- `/scams` on the production build: 10 pattern cards in editorial order, all
  registry verification links resolve, and the page states the signal-versus-
  verdict boundary
- Browser, production build, a scam-shaped electricity notice:
  - the workspace linked to `/scams` beside the playbooks, status, privacy, and
    playground links; `/playbooks` and `/playground` carried the same link
  - Analyze set the case to `suspicious`; **Check scam signals** returned
    `Risk: needs_review` and named the top four matched patterns (electricity,
    personal UPI, OTP, urgency) with the safe action for each
  - benign regression checks: a legitimate final notice with a reference
    number and published helpline, and an ordinary bill QR code, both stayed at
    **Reviewed cues** and returned `Risk: no_obvious_signals` with no matched
    pattern
  - the first pass exposed a real regression: the richer payload exceeded the
    old 1,400-character tool cap, so the panel received a truncated envelope
    and showed `Risk: unknown`. The cap is now 5,000 and a test asserts a dense
    notice stays within it; a truncated envelope now produces an honest message
    instead of a partial result
- `/scams` is in `sitemap.xml`; the generated precache manifest holds 26 URLs
  including `/scams`; the activated worker cache is `nagrik-static-a6d8f451b9`
  and holds `/scams`, `/privacy`, and `/offline`
- Lighthouse on `/scams`: **100 accessibility, 100 best practices, 100 SEO**
- Honest gaps: the response studio and grievance routing graph are not built;
  the library is English-only.

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

### Stage 4 follow-up

- Scheduled portal probes and persistent history need a durable store plus a
  scheduler; the current dashboard is on-demand with edge caching and
  browser last-known-good.
- Periodic text/metadata snapshots per domain, login/form render checks, and
  latency percentiles.
- Contextual per-user banners tied to the citizen's case.
- `lookup_process_playbook` remains deferred; adding it changes the 12-tool
  contract, the MCP surface, docs, and tests.

### Stage 5 follow-up

- Passkey identity, a server-side field-encrypted case store, automatic
  cross-device sync, retention caps, and a server-side deletion endpoint need a
  durable store and a hosted auth service. The plan's full exit target is not
  met by the encrypted-file path alone; the file path and local wipe are
  shipped.
- Add a backup-format migration path before changing the envelope version.
  Today an unsupported version is rejected rather than converted.
- Consider Argon2id for passphrase stretching if a reviewed WASM dependency is
  acceptable; PBKDF2-SHA-256 at 600,000 iterations is the current choice.

### Stage 6 follow-up

- Build the response studio: guided replies, objections, and appeals with a
  reviewed template per notice type and an explicit draft-only boundary.
- Build the grievance routing graph: a reviewed escalation path from the first
  desk to the appellate authority for each playbook.
- Translate the scam library beyond English with the same source note and
  counterexample review rule.
- Add the library to the quarterly review alongside the portal registry and
  playbooks.

### Later stages

- Stage 7 security audit, Stage 8 government integration prep, Stage 9 Phase 2.
- Stage 4's scheduled/history/snapshot items are listed above; the on-demand
  dashboard and offline PWA are shipped.
- Stage 3 follow-up: translate step detail beyond English and run the
  quarterly playbook re-review.
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
