# WebMCP integration

## What is implemented

The top-level home page registers **12 tools** for agents. The same registry
also powers `/playground` and the MCP server, so the browser and server cannot
drift apart.

Source of truth: [`../src/lib/agent/tools.ts`](../src/lib/agent/tools.ts).
The WebMCP adapter is [`../src/lib/webmcp/runtime.ts`](../src/lib/webmcp/runtime.ts).

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

Photo notices use on-device OCR (`tesseract.js`); files are not uploaded to a
server.

### Trust levels

- `read-only` — no external side effect.
- `untrusted-content` — read-only, but the result contains notice-derived text.
  The result is data, never instructions.
- `side-effect` — creates a user-visible artifact (calendar entry, downloaded
  file) and must pass the visible approval modal.

`trustLevel` and `maxFrequency` are explicit fields in the local registry. The
adapter also maps them to the polyfill's known annotations:

- `readOnlyHint` — true for every non-side-effect tool
- `untrustedContentHint` — true when the result embeds notice text
- `consequentialHint` — true for side-effect tools

Native WebMCP implementations may drop non-standard top-level metadata.
Treat `trustLevel` and `maxFrequency` as Nagrik Saathi's declared contract, not
as something the browser enforces. A host that cares should read the registry
or the `/playground` metadata.

### Untrusted content and URLs

Tool inputs are validated with Zod and generated JSON Schemas use
`additionalProperties: false`. Notice text is treated as untrusted data:

- No tool accepts a model-supplied URL as an official destination.
  `find_official_portal` and `verify_portal_url` read the human-reviewed
  registry only.
- `verify_portal_url` checks HTTPS, credentials, ports, lookalike hosts, and
  whether the exact path was reviewed. It returns the registry URL, never the
  supplied URL as official.
- `untrustedContentHint: true` tells hosts that result text may contain
  injection attempts copied from a notice.

### Approval flow

Mutating tools are marked `readOnlyHint: false` and pause for the visible
approval modal using `requestUserInteraction` when the client provides it. If
the user denies, the tool returns `status: "cancelled_by_user"` and the
workspace logs a cancelled entry.

## Playground

`/playground` is a public, no-sample tool runner for all 12 tools. It shows the
trust level, frequency, approval requirement, case requirement, MCP exposure,
input schema, and result. Side-effect tools use the same approval modal.
Downloads happen only after an explicit click.

## Local inspection

1. Run `pnpm dev`.
2. In Chrome, enable `chrome://flags/#enable-webmcp-testing`.
3. Reload `http://localhost:3000`.
4. Confirm the badge shows Native or Polyfill when the browser allows
   `document.modelContext` registration. Some embedded browsers report
   `originAgentCluster === false` and reject polyfill access; in that case the
   page keeps a Local inspector fallback with the same 12 tools.
5. Inspect `await document.modelContext.getTools()` in DevTools when Native or
   Polyfill mode is active, or open `/?inspector=1` for the built-in manual tool
   panel (hidden from the default citizen UI).
6. Open `/playground` to run any tool without going through the citizen flow.
7. Execute the Marathi summary, MSEDCL portal lookup, `verify_portal_url`,
   `redact_pii`, reminder denial, and reminder approval flows.

## Origin-Agent-Cluster

WebMCP requires origin isolation. This app sends `Origin-Agent-Cluster: ?1`.
If a browser has already decided that an origin is not origin-keyed, reload on a
fresh host/port or restart the browser. Restricted embedded browsers may keep
`originAgentCluster === false`; Nagrik Saathi then installs a local fallback
registry so the inspector still works, while Chrome/ChatGPT use the real API
when origin isolation is available.

## Registries and strict mode

Registration is feature-detected, uses an `AbortSignal` for React cleanup, and
never exposes cross-origin tools. A Strict Mode remount re-registers tools; the
local fallback keeps the last writer so cleanup of the older signal does not
empty the registry.

## ChatGPT Site tools

ChatGPT discovers tools from the top-level page in its desktop built-in
browser. It currently does not discover declarative form tools or iframe tools.
When available for the account, use an eligible Site tools model and verify
the site-tools list in the browser chrome. Do not describe ChatGPT testing as
successful until it has been recorded on the deployed HTTPS URL.

## Limitations

- WebMCP is experimental; API names and annotation sets can change.
- A native Chrome 154 run is recorded in
  [`iterations/STAGE1-CLOSEOUT.md`](iterations/STAGE1-CLOSEOUT.md): the testing
  feature was enabled with `--enable-features=WebMCP`, and all 12 tools ran
  through `document.modelContext.executeTool`. A production origin-trial token
  is still needed for ordinary visitors until Chrome ships the feature.
- No ChatGPT Site-tools run has been recorded. That remains blocked on an
  eligible account and the desktop built-in browser.
- The public playground and local browser use the MCP-B polyfill or the local
  fallback when native WebMCP is absent; the runtime badge now distinguishes
  Native, Polyfill, Local, and Unavailable.
- Frequency hints are advisory. The browser and MCP server do not enforce them.
- The MCP server is local-only today. See [`../mcp/README.md`](../mcp/README.md).
