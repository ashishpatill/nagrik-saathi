# Nagrik Saathi MCP server

A TypeScript MCP server that reuses the same tool registry as the browser
surface (`src/lib/agent/tools.ts`). It is an adapter, not a second
implementation.

> **Status: local only.** The stdio transport has been smoke-tested. The HTTP
> transport passes protocol tests against the official SDK client. No public
> deployment exists, and no Claude Desktop run has been recorded yet. Do not
> describe this server as hosted or production-ready.

## Surface

Ten read-only tools are exposed over MCP:

| Tool | Purpose |
| --- | --- |
| `analyze_notice` | Extract issuer, amount, deadline, and reference from notice text |
| `get_notice_summary` | Localized summary, actions, and required documents |
| `check_scam_signals` | Heuristic scam review, not a fraud verdict |
| `find_official_portal` | Look up a reviewed portal and helpline |
| `verify_portal_url` | Check a supplied URL against the reviewed registry |
| `create_action_plan` | Checklist and document list for the notice |
| `draft_citizen_letter` | Review-only letter draft; never sends it |
| `redact_pii` | Local pattern redaction for Aadhaar-like, PAN, card, account numbers |
| `translate_brief` | Localize via reviewed templates, not machine translation |
| `generate_checklist_document` | Print-ready, escaped HTML checklist |

`schedule_reminder` and `export_family_brief` are deliberately **not** exposed.
Both are `side-effect` tools that require a visible browser approval gate, and
the server has no human to ask. They remain browser-only.

### Stateless tool calls

The server does not remember a previous notice. Every case-dependent call must
include `sourceText`:

```json
{
  "name": "get_notice_summary",
  "arguments": {
    "sourceText": "MSEDCL notice ... amount due ₹3,250 ...",
    "language": "hi"
  }
}
```

Calling a case-dependent tool without `sourceText` returns an honest error
rather than inventing a case.

## stdio transport

Recommended for Claude Desktop, Cursor, and other local clients.

```sh
node_modules/.bin/tsx mcp/server.ts
```

From another working directory, pass the repo's tsconfig explicitly so the
`@/` path alias resolves:

```sh
node_modules/.bin/tsx --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts
```

Do **not** use `pnpm mcp` for a stdio client. pnpm prints its script banner to
stdout, which corrupts the JSON-RPC stream. `pnpm mcp` is fine for a manual
terminal session where you only care about stderr.

`stdout` is reserved for JSON-RPC. Logs go to `stderr`.

### Claude Desktop configuration

Use absolute paths in the client config. Replace `<repo>` with the checkout
path:

```json
{
  "mcpServers": {
    "nagrik-saathi": {
      "command": "<repo>/node_modules/.bin/tsx",
      "args": [
        "--tsconfig",
        "<repo>/tsconfig.json",
        "<repo>/mcp/server.ts"
      ]
    }
  }
}
```

Restart the client after editing the config. If the server fails to appear,
run the stdio command directly and read stderr.

## HTTP transport

Reachable by remote clients on a small always-on host. Do **not** deploy this
to a Vercel serverless function: it needs a persistent Node process and
in-memory sessions.

```sh
MCP_TRANSPORT=http \
MCP_HOST=127.0.0.1 \
MCP_PORT=8787 \
node_modules/.bin/tsx mcp/server.ts
```

### Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `MCP_TRANSPORT` | `stdio` | Set to `http` (or pass `--http`) |
| `MCP_HOST` | `127.0.0.1` | Bind address |
| `MCP_PORT` | `8787` | Port; `0` picks a free port |
| `MCP_AUTH_TOKEN` | unset | Bearer token required on `/mcp` |
| `MCP_ALLOWED_ORIGIN` | `*` | CORS `Access-Control-Allow-Origin` |
| `MCP_MAX_SESSIONS` | `32` | Cap on live protocol sessions; new sessions get `503` |
| `MCP_SESSION_IDLE_MINUTES` | `30` | Close a session after this much inactivity |

Endpoints:

- `GET /health` — unauthenticated liveness JSON. It reports whether auth is
  enabled and how many sessions exist.
- `/mcp` — Streamable HTTP transport. Bearer auth when `MCP_AUTH_TOKEN` is set.
  `GET`, `POST`, and `DELETE` are forwarded to the transport.
- Any other path returns `404`.

### Safety behavior

- A non-loopback bind without `MCP_AUTH_TOKEN` is refused at startup.
- The server itself speaks plain HTTP. Terminate TLS at a trusted reverse
  proxy; never expose the Node port directly to the internet.
- Protocol sessions are stateful and in memory. A restart drops them. Tool
  bodies are still stateless, so a client can reconnect and resend
  `sourceText`.
- Live sessions are capped at `MCP_MAX_SESSIONS` and reaped after
  `MCP_SESSION_IDLE_MINUTES` so a client that disappears cannot exhaust memory
  or block every later connection.
- Request bodies are capped at 1 MB.
- CORS defaults to `*`. Set `MCP_ALLOWED_ORIGIN` to a specific origin before a
  browser client uses it.
- Auth is a shared bearer token, not OAuth. There is no per-user identity,
  quota, or audit trail yet.
- `maxFrequency` and `trustLevel` are published as `_meta` hints. The server
  does **not** enforce frequency limits; the host must.

### Privacy boundary

The browser app keeps notice processing on-device. A **remote** HTTP MCP server
does not: it receives the notice text and processes it in the server process.
Only run or offer a remote server when the user explicitly consents to that
transfer, and keep TLS and auth on. Local stdio preserves the on-device
property because text never leaves the machine.

## Tests

```sh
pnpm test
```

Coverage includes:

- an end-to-end run over `InMemoryTransport`
- a real `StreamableHTTPClientTransport` client against the HTTP server
- bearer auth rejection and acceptance
- health, unknown-path, and non-loopback-bind guards
- tool surface parity: exactly 10 MCP tools, no approval-gated tools

## Related

- [`../src/lib/agent/tools.ts`](../src/lib/agent/tools.ts) — single tool registry
- [`../docs/WEBMCP.md`](../docs/WEBMCP.md) — browser surface
- [`../public/.well-known/agent-card.json`](../public/.well-known/agent-card.json) — A2A skeleton, not a live endpoint
