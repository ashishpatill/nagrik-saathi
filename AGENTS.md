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
- `pnpm mcp` (HTTP or stdio entrypoint; see the gotcha below)

## Conventions
- Keep WebMCP registration in top-level client components.
- Validate every agent argument as untrusted input.
- Use the verified portal registry; never accept model-supplied URLs.
- Require visible user approval for downloads and reminders.
- Keep document handling local by default.

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
