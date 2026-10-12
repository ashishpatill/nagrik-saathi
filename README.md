# Nagrik Saathi

Nagrik Saathi is a Safe Public-Document Copilot: it explains notices,
extracts dates and amounts, builds a checklist, and points people to reviewed
official channels without acting on government portals.

Live demo: https://nagrik-saathi.vercel.app
Demo video (2:49, narrated): https://youtu.be/g4Iyh4i2k10
Repository: https://github.com/ashishpatill/nagrik-saathi

No key is needed for the main flows. For live discovery, paste any SerpApi
key into the bring your own key field on the live site, or watch the demo
video.

## What it does

- Paste or photograph a government notice. The app extracts the amount due,
  the deadline and the reference number, and writes a plain language brief.
- The same brief is available in Hindi, Marathi and other Indian languages.
  The site language and the explanation language are set separately.
- A scam signal check flags pressure tactics and payment red flags in a
  notice before the user acts.
- The notice is turned into a clear checklist of next steps.
- When a payment or service page is genuinely needed, the app points to the
  official portal from its reviewed registry. It never logs in, pays or
  submits anything for the user.
- Live discovery (SerpApi) searches the live web for current official
  pages and shows only results that match the reviewed registry. Everything
  else is counted and dropped, and the count is shown on screen.
- Documents are handled on the device. Nothing is uploaded for the core
  flows.
- WebMCP tools let AI agents call the app inside the same trust rules.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Paste or upload a real notice, then click
**Analyze**. Nothing is preloaded.

## Test and build

```bash
pnpm lint
pnpm test
pnpm build
pnpm start
```

## Deploy

Live on Vercel (free Hobby tier): https://nagrik-saathi.vercel.app

The deployment runs with no environment variables and no server side
SerpApi key. Live discovery on the public site is bring your own key:
visitors paste their own free SerpApi key, stored only in their browser,
so the operator cannot be charged for anyone's searches. To deploy with a
server key instead, set SERPAPI_API_KEY in the host's environment.

Local verify: pnpm lint, pnpm test, pnpm build. There is intentionally no
GitHub Actions CI. Optional HTTPS deploy notes live in docs/DEPLOY.md.

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

## Live official-portal discovery (SerpApi)

Nagrik Saathi normally answers from a static, reviewed registry of official
government portals. Live discovery adds current search results on top of
that registry — without weakening the project's rule that only a reviewed
official source is ever presented as official.

![Live discovery results for a traffic e-challan query: three verified official results shown, six non-official results filtered out](docs/live-discovery.png)

How it works:

1. The user asks for a document or service.
2. The app calls `GET /api/discover?q=<query>`, which queries SerpApi
   (Google engine, India location) server-side. The API key is read from
   the `SERPAPI_API_KEY` environment variable and is never committed.
3. Every result is filtered against the verified portal registry: a result
   is shown only if its hostname matches a reviewed portal's verified
   domain or allowed hostnames. Everything else is counted and dropped —
   never shown as a link.
4. Responses are cached per query for 10 minutes, so repeated questions
   do not burn search credits.

Error behaviour, plainly:

- Invalid query → `400`
- `SERPAPI_API_KEY` not configured → `503` ("Live discovery is not
  configured on this server.")
- SerpApi request fails → `502`, with a fallback message pointing to the
  reviewed portal directory
- No live result matches a reviewed portal → the app says so plainly and
  points the user to the printed helpline or the department office,
  instead of guessing a link.

Setup: copy `.env.example` to `.env` and set `SERPAPI_API_KEY` to a key
from a free SerpApi account, then run `pnpm install` and `pnpm dev`.

Public deployments (BYOK): the server key is optional. A deployment can
run with no `SERPAPI_API_KEY` at all — visitors who want live discovery
paste their own free SerpApi key into the field above the search box.
The key is stored only in their browser and sent per request; the
operator carries no key and cannot be charged for anyone's searches.

Built for the SerpApi India Hackathon 2026 as a feature on top of the
pre-existing Nagrik Saathi project.

## Try it in two minutes (judges)

1. Open the live demo link above. No signup, no key.
2. Paste the sample electricity notice from the demo video, or any real
   notice, and click Analyze. Read the brief, switch the explanation to
   Hindi, and run the scam signal check.
3. In the live discovery section, search for "Maharashtra traffic
   e-challan payment". With a SerpApi key in the BYOK field you will see
   verified official results and a line counting the non official results
   that were filtered out. Without a key, the demo video shows the same
   flow recorded against the live API.
4. From the repo: pnpm install, pnpm test. The registry filter is covered
   by automated tests with mocked SerpApi responses, so the core trust
   rule can be verified with no key at all.

## Safety

This app does not collect credentials, OTPs, Aadhaar, PAN, or banking details.
It does not make payments, file grievances, submit forms, send letters, or
automate official sites. Read [docs/SAFETY.md](docs/SAFETY.md) before adding
features.
