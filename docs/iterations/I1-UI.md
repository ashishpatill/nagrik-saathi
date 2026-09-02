# I1 — Unique minimal civic UI

## Goal

Replace the generic teal/card SaaS look with a distinctive, quiet civic
workspace: brand-first, paper atmosphere, minimal chrome, delightful motion.
Must not look like AI-generated UI.

## In scope

- Distinct type + color system (no purple SaaS, no cream/terracotta cliché)
- One composition first viewport: brand, one line, one CTA group
- Open analysis layout; cards only where interaction needs a container
- Soft motion (load, modal, tool log)

## Loop prompt

```text
Nagrik I1 UI loop: review Workspace + globals against brand test and anti-slop
rules. Fix remaining visual noise, weak branding, or dashboard feel. Run
pnpm lint/test. Browser-check localhost:3000. Commit if improved. Stop when
brand test passes and chrome is minimal.
```

## Done when

- [x] Brand “Nagrik Saathi” dominates first viewport
- [x] No stacked marketing cards / pill clusters / icon rows in hero
- [x] Local screenshot review feels calm and specific to civic docs
