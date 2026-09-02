# Nagrik Saathi

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, WebMCP, Vitest.

## Run / test
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Conventions
- Keep WebMCP registration in top-level client components.
- Validate every agent argument as untrusted input.
- Use the verified portal registry; never accept model-supplied URLs.
- Require visible user approval for downloads and reminders.
- Keep document handling local by default.

## Gotchas
WebMCP is experimental and requires HTTPS or localhost. The canonical API is
`document.modelContext`; `navigator.modelContext` is only a compatibility fallback.

## ICM topic
`project-nagrik-saathi`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
