# Goal and Loop — Nagrik Saathi

**Updated:** 2026-09-02  
**Mode:** local browser verify · public GitHub commits · **no GitHub Actions CI**

## Overall goal

Ship a unique, minimal, frictionless civic workspace that explains notices and
exposes eight WebMCP tools—without AI-slop aesthetics—and keep iterating with
separate GOAL + LOOP prompts until design delight and E2E flows are solid.

## Out of scope / frozen

- GitHub Actions / remote CI
- Scraping or automating government portals
- Collecting credentials, OTPs, Aadhaar, PAN, banking data
- Payments, filings, submissions
- Claiming ChatGPT Site-tools success without a recording

## Iteration order

| ID | Goal file | Loop prompt (local sentinel) |
|----|-----------|------------------------------|
| I1 | [iterations/I1-UI.md](iterations/I1-UI.md) | `AGENT_LOOP_TICK_nagrik_i1` |
| I2 | [iterations/I2-UX.md](iterations/I2-UX.md) | `AGENT_LOOP_TICK_nagrik_i2` |
| I3 | [iterations/I3-E2E.md](iterations/I3-E2E.md) | `AGENT_LOOP_TICK_nagrik_i3` |
| I4 | [iterations/I4-REPO.md](iterations/I4-REPO.md) | `AGENT_LOOP_TICK_nagrik_i4` |
| I5 | [iterations/I5-POLISH.md](iterations/I5-POLISH.md) | `AGENT_LOOP_TICK_nagrik_i5` |

## Definition of done

- [x] UI passes brand test (product name is hero-level; not generic SaaS)
- [x] All eight tools + sample load + portal open + reminder deny/approve work in local browser
- [x] Public GitHub repo exists; iterative commits on `master`/`main`
- [x] No `.github/workflows` CI
- [x] `pnpm lint` · `pnpm test` · `pnpm build` green locally

## Verify locally (every iteration)

```bash
pnpm lint && pnpm test && pnpm build
pnpm dev   # then exercise inspector like a real user
```
