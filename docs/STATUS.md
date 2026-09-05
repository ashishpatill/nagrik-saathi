# Status — Nagrik Saathi

**Updated:** 2026-09-05  
**Authority:** this file + [GOAL_AND_LOOP.md](GOAL_AND_LOOP.md)

## Done

- Scaffold, 8 WebMCP tools, allowlist, docs, local lint/test/build
- Local inspector fallback when `originAgentCluster` blocks polyfill
- **I1** Brand-first civic UI (Literata/Figtree, ash paper, hero product name)
- **I2** Numbered action presets, human approval copy, inspector secondary
- **I3** Browser E2E on `localhost:3000` (paste/analyze real notice, EN/HI/MR, portal HTTPS, reminder deny/approve, family brief, draft_only, 8 tools)
- **I4** Public repo [ashishpatill/nagrik-saathi](https://github.com/ashishpatill/nagrik-saathi) — **no** `.github/workflows`
- **I5** Mobile-friendly stacks, labeled controls, Escape/backdrop deny, portal browse directory, docs closed
- Fixed Strict Mode remount wiping `document.modelContext` tool registry
- **No mock preload** — empty start; paste/upload + Analyze only
- Broader issuer matching + searchable reviewed-portal directory
- On-device photo OCR; dual **site language** vs **explain language** (en/hi/mr/ta/kn/gu/te/bn)

## Remaining

- Expand reviewed portal coverage beyond Maharashtra + national seeds (WebMCP-friendly mapping of cumbersome state portals)

## Deferred

- ChatGPT Site-tools recording
- Vercel HTTPS deploy (optional)
- Hindi/Tamil OCR language packs beyond English Tesseract

## I3 evidence (local browser)

- Marathi + Hindi summaries switch correctly
- Portal link `https://wss.mahadiscom.in/wss/wss`
- `schedule_reminder` cancelled then success; `export_family_brief` success
- Inspector shows `8 tools · Local`; `draft_citizen_letter` → `status: draft_only`
- Safety line visible; no credential fields
- After remount fix, `getTools()` returns all 8 tools
