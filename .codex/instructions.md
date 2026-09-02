# Nagrik Saathi build instructions

Nagrik Saathi is a safe public-document companion. It explains notices,
extracts deadlines, drafts next steps, and links to reviewed official sites.
It must never pay, submit, scrape, imitate a government portal, or request
government or banking credentials.

## WebMCP

Use the current imperative API:

```ts
const context = document.modelContext ?? navigator.modelContext;
await context?.registerTool(
  {
    name: "get_notice_summary",
    description: "Read the current notice summary.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => ({ status: "ok" }),
  },
  { signal: controller.signal },
);
```

Use `document.modelContext` first. `navigator.modelContext` is a deprecated
compatibility fallback. Registration must be feature-detected and abortable;
there is no supported `unregisterTool()` method. Register tools from a
top-level client component because ChatGPT Site tools do not discover iframe
or declarative-form tools.

All inputs are untrusted. Use narrow JSON schemas with
`additionalProperties: false`, concise descriptions, output truncation, and
`readOnlyHint` / `untrustedContentHint`. Mutating tools must use
`requestUserInteraction` before execution. Keep the app functional without
native WebMCP, the polyfill, or an AI API.

## Verification

Run `pnpm lint`, `pnpm test`, and `pnpm build`. In Chrome localhost, enable
`chrome://flags/#enable-webmcp-testing`, inspect `document.modelContext.getTools()`,
and exercise summary, portal lookup, reminder denial, and reminder approval.
