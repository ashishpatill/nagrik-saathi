# Nagrik Saathi

**A safe public-document copilot for Indian government notices.**

Paste or photograph a notice. Get the amount, the deadline, and the reference
number in plain language, a scam check, a checklist, the reviewed official
portal, and the steps to follow. Nothing is uploaded for the core flow. No
account. No login, payment, filing, or submission on your behalf.

Live demo: https://nagrik-saathi.vercel.app
Demo video (2:49, narrated): https://youtu.be/g4Iyh4i2k10
Repository: https://github.com/ashishpatill/nagrik-saathi

## The problem is not information. It is the moment of confusion.

A notice arrives. It has a deadline, an amount, a reference number, and a
threat of penalty. It may be in English or in legal shorthand. The citizen has
to answer four questions quickly:

1. Is this notice real, or is it a scam?
2. What exactly is due, and by when?
3. Which official portal or office is the right one?
4. What happens if I ignore it, and what should I carry when I go?

Search results are full of lookalike domains, paid agents, and payment links.
Existing tools often make the same mistake: they ask the citizen to create an
account, upload the document, and trust a middleman to "handle it." That
concentrates risk at the exact moment the citizen is most vulnerable.

Nagrik Saathi takes the opposite position.

> Do not become another middleman. Make the citizen capable.

## The idea: understand, verify, hand the action back

Three rules shape every feature:

1. **Understand on the device.** Notice text and photos are processed in the
   browser. The core flow does not upload the document.
2. **Verify the destination.** Only a human-reviewed registry of official
   portals can be presented as official. A model-supplied URL is never trusted.
3. **Hand the action back.** The app explains what to do and opens the official
   portal. The citizen logs in, pays, files, or submits there. Nagrik Saathi
   never does it for them.

That boundary is not a limitation bolted on at the end. It is the product.

## How it solves the problem

### 1. Get the notice in, without an account

Paste text, attach a PDF, or photograph the notice. Photo text is read on the
device with OCR. There is no signup, no upload step, and no sample notice
preloaded into the workspace.

### 2. Extract what matters

The app identifies the issuer, amount due, deadline, reference number, urgency,
and the documents the notice asks for. It writes a plain-language brief and
keeps the original text beside it, so the citizen can check the summary against
the source.

### 3. Explain it in a language the citizen actually uses

The brief is available in English, Hindi, Marathi, Tamil, Kannada, Gujarati,
Telugu, and Bengali. The site language and the explanation language are set
separately, so a Marathi reader can keep an English interface or the reverse.

### 4. Check for scam signals before money moves

The scam check looks for pressure tactics, payment red flags, mismatched
issuer details, and checksum-valid identifiers embedded in the notice. It does
not declare a notice "safe." It surfaces the signals and points to the
reviewed portal or the printed helpline.

### 5. Turn the notice into a checklist

Instead of a wall of text, the citizen gets a short sequence: what to carry,
what to confirm, what to pay or contest, and which office or portal to use.
The checklist can be exported as a print-ready document.

### 6. Open only the reviewed official portal

`find_official_portal` accepts a department, service, and state, never a URL.
It checks the result against the reviewed registry, verifies HTTPS and the
hostname allowlist, and otherwise tells the citizen to use the printed
helpline or visit the office. When live discovery is enabled, web results are
filtered through the same registry, and the count of rejected results is shown
on screen.

### 7. Know the process before entering the portal

Sixteen versioned playbooks cover the top 15 workflows plus an Aadhaar
guidance page. Each one explains the likely steps, required documents, fees,
timelines, common rejection reasons, helplines, and the reviewed portal for
each stage. The Aadhaar page never asks for, stores, or verifies a number.

### 8. Keep the case, without handing it to a server

Saved cases resume in the same browser. For another device, the citizen can
download an encrypted backup: PBKDF2-SHA-256 with 600,000 iterations derives a
key from their passphrase, and AES-GCM-256 encrypts the bundle before the file
is written. The passphrase never leaves the device. Restoring is explicit, and
"delete everything" clears every saved case and the active case pointer.

### 9. Keep working when the network or a portal does not

The app is an offline-capable PWA. After one visit, the core pages and all
sixteen playbooks are cached under a versioned cache. An uncached route opens
`/offline`. The public `/status` page measures every reviewed portal, shows the
HTTP result, latency, helpline, and a last-known-good result from this browser,
and is careful to call a blocked automated check "blocked," not "down."

## Who this helps

| Situation | What the citizen gets | What stays out of it |
| --- | --- | --- |
| A parent receives a property tax notice in Marathi | A Marathi brief, the amount and deadline, the documents to carry, and the municipal portal | The notice itself. It is processed on the phone. |
| A shop owner gets a GST notice with a seven-day deadline | A scam check, a short action list, the reviewed GST portal, and a reminder they approve | An account, an upload, or an agent who files for them |
| A worker gets an SMS with a challan payment link | A domain check against the reviewed traffic registry, the official portal, and the helpline | A payment made from the app, or a lookalike link presented as official |
| A son or daughter helps a relative in another city | An encrypted backup that can be restored on another device with the passphrase | A cloud case store or a plaintext export |
| A volunteer helps at a camp with weak connectivity | Cached playbooks, the offline page, and the last measured portal status | A blank screen when the network drops |
| Someone already uses an AI assistant | Twelve WebMCP tools and ten read-only MCP tools that follow the same trust rules | Any write action, payment, or submission through the agent |

## Why this can be a gamechanger

### Trust is the adoption barrier, and the architecture removes it

Civic tools usually ask for trust before they deliver value: make an account,
upload your document, let us handle the payment. Nagrik Saathi delivers value
first. The document stays on the device, there is no account, and there is no
write access to any government system. A citizen can try it with a real notice
without taking a leap of faith.

### It sits at the moment of confusion, not after it

Most guidance arrives too late, after a deadline is missed or money is sent to
the wrong place. This tool is built for the five minutes after the notice
arrives: what is due, by when, is it real, where do I go, what do I carry.

### It is agent-native without giving the agent the keys

The same twelve tools power the browser, the public playground, and the MCP
server. An assistant can read a bill, check scam signals, build a checklist,
and find the reviewed portal. It cannot pay, file, or submit. Side-effect tools
stay in the browser behind visible approval, and the MCP surface exposes only
the ten read-only tools. That is a practical answer to the question every
agent product is about to face: what is the agent allowed to do on my behalf?

### The content is reviewable, versioned, and correctable

Playbooks live as YAML, validate against a schema, carry a version and a
`lastReviewed` date, and link to portals by registry key, never by raw URL.
The portal registry records who reviewed an entry and when. A correction flow
exists. A stale generated file fails CI. This is slower than scraping, and it
is the reason the guidance can be trusted.

### It works on the devices and networks people actually have

No account, no upload, a small client bundle, OCR on the device, a service
worker that precaches the guidance, and a status page that shows a saved result
instead of a blank failure. The product is designed for a mid-range phone on a
weak connection, not a demo on a fast laptop.

### Language is a first-class feature, not a translation layer

Eight explanation languages, with the interface language chosen separately.
The playbooks carry English, Hindi, and Marathi overviews today; step detail is
English with a visible fallback. The gap is documented rather than hidden.

### Honesty compounds

The status page says what it measured and what it cannot prove. A blocked
automated check is not called "down." A failed recheck is labelled as saved in
this browser. The Aadhaar page is guidance-only. The backup page says the
passphrase cannot be recovered. In a domain full of overclaiming, a product
that states its limits is easier to recommend.

## The trust boundary, stated plainly

Nagrik Saathi:

- does not collect credentials, OTPs, Aadhaar, PAN, or banking details;
- does not log in, pay, file, submit, or send anything on the citizen's behalf;
- does not accept a model-supplied URL as official;
- does not store cases on a server or sync them automatically;
- does not claim to be a government service, a legal adviser, or an uptime
  monitor.

What it does instead: it explains, checks, prepares, and points to the official
door. The citizen walks through it.

## What is live today

| Surface | What works now |
| --- | --- |
| Notice workspace | Paste, PDF, or photo input; on-device OCR; extracted amount, deadline, reference, and issuer; eight explanation languages; scam signals; checklist and letter drafts; saved case resumes in the browser |
| Process playbooks | Sixteen validated YAML playbooks, English/Hindi/Marathi overviews, steps, documents, fees, timelines, rejection reasons, reviewed portal links |
| Portal status | On-demand measurement of 39 registry entries (38 unique URLs), four-second timeout, `up` / `restricted` / `down`, filter, recheck, browser-local last-known-good |
| Offline PWA | 25 precached URLs, versioned `nagrik-static-<hash>` cache, `/offline` fallback, 5xx and lost-connection handling, connection banner, `/api/*` never cached |
| Your data | Passphrase-encrypted backup and restore, explicit delete-all, a plain inventory of what is stored and where |
| Agent surface | Twelve WebMCP tools, ten read-only MCP tools, public `/playground`, native Chrome evidence in the repo |
| Delivery | Lint, tests, build, `playbooks:check`, dependency audit, CycloneDX SBOM, CI on every push and pull request |

### What is not built yet

- Passkey identity and a server-side encrypted case store.
- Automatic cross-device sync. The encrypted file is the cross-device path
  today.
- Scheduled portal probes, persistent health history, latency percentiles, and
  server-side snapshots. The current check is on demand with edge caching.
- Deeper translation of playbook step detail beyond the English source.
- Any government write automation. This is deliberately out of scope.

The live status file keeps the exact verification record:
[docs/STATUS.md](docs/STATUS.md).

## Try it in two minutes

1. Open the live demo. No signup and no key are needed.
2. Paste the sample electricity notice from the demo video, or any real notice,
   and click **Analyze**. Read the brief, switch the explanation to Hindi or
   Marathi, and run the scam signal check.
3. Open `/playbooks/passport` to see a reviewed workflow, then `/status` to see
   the measured portal check.
4. Open `/privacy` to make an encrypted backup or delete the saved case.
5. From the repo, run `pnpm install` and `pnpm test`. The registry filter and
   backup encryption are covered by automated tests, so the core trust rules
   can be verified with no external key.

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
pnpm playbooks:build   # regenerate the playbook JSON, precache manifest, and worker
pnpm playbooks:check   # fail if any generated file is stale
```

## Architecture at a glance

| Layer | Implementation |
| --- | --- |
| Web app | Next.js App Router, React, TypeScript, Tailwind CSS |
| Document input | `pdfjs-dist` for PDFs, `tesseract.js` for on-device photo OCR |
| Agent contract | One Zod-backed registry in `src/lib/agent/tools.ts`; WebMCP adapter, playground, and MCP server share it |
| MCP server | Official MCP SDK, stdio and Streamable HTTP, bearer auth, loopback guard |
| Local state | IndexedDB for cases, localStorage for the active case and preferences |
| Backup crypto | WebCrypto PBKDF2-SHA-256 (600,000 iterations) and AES-GCM-256 |
| Offline layer | Generated service worker, versioned cache, 25 precache URLs, `/offline` |
| Delivery | GitHub Actions, dependency audit, CycloneDX SBOM, Vercel deployment |

## Live official-portal discovery (SerpApi)

Nagrik Saathi normally answers from a static, reviewed registry of official
government portals. Live discovery adds current search results on top of that
registry, without weakening the rule that only a reviewed official source is
ever presented as official.

![Live discovery results for a traffic e-challan query: three verified official results shown, six non-official results filtered out](docs/live-discovery.png)

How it works:

1. The user asks for a document or service.
2. The app calls `GET /api/discover?q=<query>`, which queries SerpApi (Google
   engine, India location) server-side. The API key is read from the
   `SERPAPI_API_KEY` environment variable and is never committed.
3. Every result is filtered against the verified portal registry. A result is
   shown only if its hostname matches a reviewed portal's verified domain or
   allowed hostnames. Everything else is counted and dropped, never shown as a
   link.
4. Responses are cached per query for 10 minutes, so repeated questions do not
   burn search credits.

Error behaviour, plainly:

- Invalid query: `400`
- `SERPAPI_API_KEY` not configured: `503` ("Live discovery is not configured on
  this server.")
- SerpApi request fails: `502`, with a fallback message pointing to the
  reviewed portal directory
- No live result matches a reviewed portal: the app says so plainly and points
  to the printed helpline or the department office instead of guessing a link

Setup: copy `.env.example` to `.env` and set `SERPAPI_API_KEY` to a key from a
free SerpApi account, then run `pnpm install` and `pnpm dev`.

Public deployments (BYOK): the server key is optional. A deployment can run
with no `SERPAPI_API_KEY` at all. Visitors who want live discovery paste their
own free SerpApi key into the field above the search box. The key is stored
only in their browser and sent per request; the operator carries no key and
cannot be charged for anyone's searches.

Built for the SerpApi India Hackathon 2026 as a feature on top of the
pre-existing Nagrik Saathi project.

## Deploy

Live on Vercel (free Hobby tier): https://nagrik-saathi.vercel.app

The deployment runs with no environment variables and no server-side SerpApi
key. To deploy with a server key instead, set `SERPAPI_API_KEY` in the host's
environment.

Local verify: `pnpm lint`, `pnpm test`, `pnpm playbooks:check`, `pnpm build`.
CI runs the same checks plus `pnpm audit` and a CycloneDX SBOM on pushes to
`master` and on pull requests; see [docs/CI.md](docs/CI.md). Optional HTTPS
deploy notes live in [docs/DEPLOY.md](docs/DEPLOY.md).

## Documentation

- [Living status and verification record](docs/STATUS.md)
- [Safety boundary and DPDP posture](docs/SAFETY.md)
- [Process playbook schema and review flow](docs/PLAYBOOKS.md)
- [WebMCP tool contract](docs/WEBMCP.md)
- [CI and release checks](docs/CI.md)
- [Improvement plan](docs/nagrik-saathi-improvement-plan.html)
- [Goal and loop history](docs/GOAL_AND_LOOP.md)

## Safety

This app does not collect credentials, OTPs, Aadhaar, PAN, or banking details.
It does not make payments, file grievances, submit forms, send letters, or
automate official sites. Read [docs/SAFETY.md](docs/SAFETY.md) before adding
features.
