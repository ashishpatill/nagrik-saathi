# Nagrik Saathi

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, WebMCP, MCP SDK, Vitest.

## Run / test
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm audit`
- `pnpm sbom`
- `pnpm playbooks:build` (regenerate the playbook JSON, precache manifest, and service worker)
- `pnpm playbooks:check` (fail if any generated file is stale; CI runs this)
- `pnpm mcp` (HTTP or stdio entrypoint; see the gotcha below)

## Conventions
- Keep WebMCP registration in top-level client components.
- Validate every agent argument as untrusted input.
- Use the verified portal registry; never accept model-supplied URLs.
- Require visible user approval for downloads and reminders.
- Keep document handling local by default.

## Process playbooks

`content/playbooks/*.yaml` is the source of truth for the 15 reviewed workflows
plus the `aadhaar-update` guidance page. `pnpm playbooks:build` generates
`src/data/playbooks.generated.json`, `public/precache-manifest.json`, and
`public/sw.js`; never edit a generated file by hand. Edit
`scripts/sw-template.js` for service-worker behavior.

Rules for adding or changing a playbook:

- Keep `portalKeys` and `steps[].portalKey` as keys into
  `src/data/official-portals.ts`. Never put a raw URL in a playbook.
- `title`, `summary`, `feeNote`, and `timelineNote` require `en`, `hi`, and
  `mr`. Step details, documents, and rejection reasons require `en`.
- Only `aadhaar-update` may set `guidanceOnly: true`, and no playbook may ask
  for, collect, store, or verify an Aadhaar number.
- Bump `version` for a substantive correction and set `lastReviewed` only when
  a human has checked the content.
- Run `pnpm playbooks:build` and commit all three generated files with the YAML
  change. `pnpm playbooks:check`, `pnpm test`, and CI fail if any is stale.
- Update `docs/PLAYBOOKS.md` when the schema, rules, or contribution flow change.

## Resilience and offline

- Portal health is measured, never asserted: show the HTTP result, latency,
  reviewed date, and helpline. A `401`, `403`, `405`, or `429` is
  `restricted`, not `down`. Never present the dashboard as an official uptime
  guarantee.
- The health API accepts at most 12 registry keys per request, rejects unknown
  keys, and is rate-limited. Do not add a path that probes arbitrary URLs.
- A failed recheck may show the last successful result only with a visible
  timestamp and a "saved in this browser" label.
- The service worker must never cache `/api/*`. Navigations fall back to the
  cached document on a lost connection or a `5xx`; uncached routes open
  `/offline`.
- Cache names are versioned (`nagrik-static-<hash>`) and activation removes
  older `nagrik-` caches. Change the template, not the generated worker.

## Your data and backups

- Never store, log, transmit, or request a backup passphrase. It exists only in
  the form field for the operation the citizen started.
- The backup envelope is versioned. A change to the KDF, cipher, envelope
  fields, or authenticated data requires a version bump and tests for wrong
  passphrase, tampering, malformed input, and unsupported versions.
- Imported files are untrusted. Validate the strict schema, duplicate IDs, the
  8 MB file cap, and the 200-case cap before writing to IndexedDB.
- "Delete everything" must clear every saved case and the active-case pointer.
  Never claim a server-side deletion when there is no server-side store.
- The encrypted file is the only cross-device path today. Do not describe it
  as automatic sync, zero-knowledge cloud storage, or recovery-capable.
- Keep the `/privacy` inventory and `docs/SAFETY.md` aligned with what storage
  actually does.

## Agent tool contract

`src/lib/agent/tools.ts` is the single source of truth for 12 tools. The WebMCP
adapter (`src/lib/webmcp/runtime.ts`), the `/playground` page, and the MCP
server (`mcp/`) all call the same registry. Never register a tool anywhere else.

| Tool | Trust | Max frequency | Approval | Needs notice | MCP |
| --- | --- | --- | --- | --- | --- |
| `get_notice_summary` | untrusted-content | 30/min | no | yes | yes |
| `find_official_portal` | read-only | 30/min | no | no | yes |
| `check_scam_signals` | untrusted-content | 30/min | no | yes | yes |
| `analyze_notice` | untrusted-content | 12/min | no | no | yes |
| `create_action_plan` | untrusted-content | 30/min | no | yes | yes |
| `schedule_reminder` | side-effect | 10/hour | **yes** | no | no |
| `export_family_brief` | side-effect | 10/hour | **yes** | yes | no |
| `draft_citizen_letter` | untrusted-content | 30/min | no | yes | yes |
| `verify_portal_url` | read-only | 30/min | no | no | yes |
| `redact_pii` | read-only | 30/min | no | no | yes |
| `translate_brief` | untrusted-content | 30/min | no | yes | yes |
| `generate_checklist_document` | untrusted-content | 12/min | no | yes | yes |

Rules for adding or changing a tool:

- Every tool declares `trustLevel`, `maxFrequency`, `untrustedContentHint`,
  `requiresApproval`, `requiresCase`, `mcpExposed`, `maxResultChars`, a Zod
  `schema`, and a safe `exampleInput`.
- `side-effect` tools must set `requiresApproval: true` and
  `mcpExposed: false`. The MCP server has no human to ask.
- The JSON Schema is generated from the Zod schema with `z.strictObject`
  (`additionalProperties: false`). Do not hand-maintain a second schema.
- MCP callers are stateless. They must send `sourceText` on every
  case-dependent call. Browser callers may use the current workspace case.
- Update this table, `docs/WEBMCP.md`, and `public/llms.txt` in the same change.
- Add a regression test in `src/lib/agent/tools.test.ts` for any new behavior.

## Gotchas

WebMCP is experimental and requires HTTPS or localhost. The canonical API is
`document.modelContext`; `navigator.modelContext` is only a compatibility fallback.
The polyfill package exports `installWebMCP`, not `initializeWebMCPPolyfill`.

`pnpm mcp` prints the pnpm script banner to stdout, which corrupts stdio
JSON-RPC. For a stdio client use:

```sh
node_modules/.bin/tsx --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts
```

The HTTP transport is local-only today. It binds to loopback by default and
refuses a non-loopback bind without `MCP_AUTH_TOKEN`. See `mcp/README.md`.

## ICM topic
`project-nagrik-saathi`

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
