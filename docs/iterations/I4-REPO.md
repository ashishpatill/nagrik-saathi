# I4 — Public GitHub repo (no Actions)

## Goal

Create a public GitHub repository and keep committing iteratively. Do **not**
add GitHub Actions workflows; verify only locally.

## In scope

- `gh repo create` public from local master
- Semantic commits per iteration
- README points to local verify, not CI badges

## Out of scope

- Any `.github/workflows/*`
- Required status checks

## Loop prompt

```text
Nagrik I4 repo loop: ensure public remote exists, push latest commits, confirm
no Actions workflows. Do not add CI. Stop when remote is public and commits
are visible.
```

## Done when

- [ ] Public repo URL live
- [ ] No Actions workflows
