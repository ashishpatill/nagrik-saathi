# WebMCP integration

## What is implemented

The top-level home page registers:

- `get_notice_summary`
- `find_official_portal`
- `check_scam_signals`
- `analyze_notice`
- `create_action_plan`
- `schedule_reminder`
- `export_family_brief`
- `draft_citizen_letter`

The implementation uses the current `document.modelContext` API and falls
back to `navigator.modelContext` for older experimental runtimes. Registration
is feature-detected, uses an `AbortSignal` for React cleanup, and never exposes
cross-origin tools.

Mutating workspace actions are marked with `readOnlyHint: false` and pause for
the visible approval modal using `requestUserInteraction` when the client
provides it. Inputs are validated with Zod and JSON Schemas set
`additionalProperties: false`.

## Local inspection

1. Run `pnpm dev`.
2. In Chrome, enable `chrome://flags/#enable-webmcp-testing`.
3. Reload `http://localhost:3000`.
4. Confirm the badge shows Native or Polyfill when the browser allows
   `document.modelContext` registration. Some embedded browsers report
   `originAgentCluster === false` and reject polyfill access; in that case
   the page keeps a Local inspector fallback with the same eight tools.
5. Inspect `await document.modelContext.getTools()` in DevTools when Native
   or Polyfill mode is active, or open `/?inspector=1` for the built-in manual
   tool panel (hidden from the default citizen UI).
6. Execute the Marathi summary, MSEDCL portal lookup, reminder denial, and
   reminder approval flows.

## Origin-Agent-Cluster

WebMCP requires origin isolation. This app sends `Origin-Agent-Cluster: ?1`.
If a browser has already decided that an origin is not origin-keyed, reload on a
fresh host/port or restart the browser. Restricted embedded browsers may keep
`originAgentCluster === false`; Nagrik Saathi then installs a local fallback
registry so the inspector still works, while Chrome/ChatGPT use the real API
when origin isolation is available.

## ChatGPT Site tools

ChatGPT discovers tools from the top-level page in its desktop built-in
browser. It currently does not discover declarative form tools or iframe tools.
When available for the account, use an eligible Site tools model and verify
the site-tools list in the browser chrome. Do not describe ChatGPT testing as
successful until it has been recorded on the deployed HTTPS URL.
