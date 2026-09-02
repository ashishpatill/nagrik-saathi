# Status — Nagrik Saathi

**Updated:** 2026-09-02  
**Authority:** this file + [GOAL_AND_LOOP.md](GOAL_AND_LOOP.md)

## Done

- Scaffold, 8 WebMCP tools, allowlist, docs, local lint/test/build
- Local inspector fallback when `originAgentCluster` blocks polyfill
- **I1** Brand-first civic UI (Literata/Figtree, ash paper, hero product name)
- **I2** Numbered presets, human approval copy, inspector secondary
- **I3** Browser E2E on `localhost:3000` (paste/analyze real notice, EN/HI/MR, portal HTTPS, reminder deny/approve, family brief, draft_only, 8 tools)
- **I4** Public repo [ashishpatill/nagrik-saathi](https://github.com/ashishpatill/nagrik-saathi) — **no** `.github/workflows`
- **I5** Escape-to-deny modal, larger touch targets, docs closed out
- Fixed Strict Mode remount wiping `document.modelContext` tool registry
- **No mock preload** — empty start; paste/upload + Analyze only; sample files removed

## Remaining

None for the current ship loop. Deferred items stay deferred.

## Deferred

- ChatGPT Site-tools recording
- Vercel HTTPS deploy (optional)

## I3 evidence (local browser)

- Marathi + Hindi summaries switch correctly
- Portal link `https://wss.mahadiscom.in/wss/wss`
- `schedule_reminder` cancelled then success; `export_family_brief` success
- Inspector shows `8 tools · Local`; `draft_citizen_letter` → `status: draft_only`
- Safety line visible; no credential fields
- After remount fix, `getTools()` returns all 8 tools
