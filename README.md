# Nagrik Saathi

Nagrik Saathi is a Safe Public-Document Copilot: it explains notices,
extracts dates and amounts, builds a checklist, and points people to reviewed
official channels without acting on government portals.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The preloaded sample is deliberately fake:
`SAMPLE-BU-411038-9921`, MSEDCL Pune Urban, ₹2,430 due on 2 September 2026.

## Test and build

```bash
pnpm lint
pnpm test
pnpm build
pnpm start
```

## Deploy

Local verify only for now (`pnpm lint`, `pnpm test`, `pnpm build`, browser).
There is intentionally **no GitHub Actions CI**. Optional HTTPS deploy notes live
in [docs/DEPLOY.md](docs/DEPLOY.md).

## Goals

Iteration goals and loop prompts: [docs/GOAL_AND_LOOP.md](docs/GOAL_AND_LOOP.md).
Living status: [docs/STATUS.md](docs/STATUS.md).

## WebMCP

The home page registers eight top-level tools through
`document.modelContext`. Native WebMCP is preferred; the MCP-B polyfill makes
local inspection possible when the browser has no native implementation.
Chrome local testing uses `chrome://flags/#enable-webmcp-testing` and the
Model Context Tool Inspector. ChatGPT Site tools require its desktop built-in
browser and an eligible model/account rollout.

## Safety

This app does not collect credentials, OTPs, Aadhaar, PAN, or banking details.
It does not make payments, file grievances, submit forms, send letters, or
automate official sites. Read [docs/SAFETY.md](docs/SAFETY.md) before adding
features.
