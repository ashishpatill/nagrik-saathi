# I3 — End-to-end feature verify

## Goal

Every shipped feature works flawlessly in a real browser session on localhost.

## Checklist

1. Paste a real notice (empty start — no mock preload)
2. Switch EN / HI / MR summaries
3. Analyze pasted text
4. Open official portal link (HTTPS allowlist)
5. Inspector: all 8 tools listed
6. `get_notice_summary` language mr
7. `find_official_portal` for the detected department
8. `schedule_reminder` deny then approve → ICS download
9. `export_family_brief` approve → txt download
10. `draft_citizen_letter` returns draft_only
11. Safety banner visible; no credential fields

## Loop prompt

```text
Nagrik I3 E2E loop: run the I3 checklist in the browser like a real user.
Fix any broken tool, modal, download, or portal link. Re-run pnpm test/build.
Commit fixes. Stop when the full checklist passes once without errors.
```

## Done when

- [x] Checklist complete with evidence (notes in STATUS)
