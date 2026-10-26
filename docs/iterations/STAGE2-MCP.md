# Stage 2 — local MCP evidence

**Date:** 2026-10-26  
**Surface:** ten read-only tools from the shared registry  
**Transports:** stdio and Streamable HTTP

## HTTP custom harness

Started locally with a bearer token:

```sh
MCP_TRANSPORT=http MCP_HOST=127.0.0.1 MCP_PORT=8787 \
MCP_AUTH_TOKEN=test-token-not-a-real-secret pnpm exec tsx mcp/server.ts
```

Observed:

| Check | Result |
| --- | --- |
| `GET /health` | `200 {"status":"ok","transport":"http","auth":true,"sessions":0,"endpoint":"/mcp"}` |
| `POST /mcp` without a token | `401`, `WWW-Authenticate: Bearer realm="nagrik-saathi"` |
| `listTools()` with the token | 10 tools |
| `verify_portal_url` | verified MSEDCL registry entry, `match: registered_path` |
| `redact_pii` | 2 redactions |

The ten tools are the `mcpExposed` subset. `schedule_reminder` and
`export_family_brief` are absent by design because MCP has no human approval
surface.

## stdio custom harness

Started without the pnpm banner:

```sh
node_modules/.bin/tsx --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts
```

The official SDK `StdioClientTransport` connected, listed the same ten tools,
and `get_notice_summary` returned a Marathi summary with the expected issuer,
₹2,430 amount, `2026-09-02` deadline, four actions, and two documents.

## Still open

- No always-on deployment with TLS and a bearer token.
- No real Claude Desktop run. Claude Desktop is not installed on this host; the
  existing `~/Library/Application Support/Claude` directory is a leftover
  profile, and the `claude` binary is Claude Code, not Claude Desktop.
- No server-side per-user frequency enforcement; the MCP server has no
  identity layer yet.
