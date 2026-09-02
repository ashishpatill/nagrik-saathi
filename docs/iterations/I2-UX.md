# I2 — Frictionless UX

## Goal

Make the demo path one-breath: sample → language → portal → reminder, with
tool presets so judges never edit JSON by hand unless they want to.

## In scope

- Preset buttons for the four demo tools (summary MR, portal, reminder, brief)
- Clear language switch that also drives summary view
- One-click sample reload; quieter inspector defaults
- Approval modal copy that is short and human

## Loop prompt

```text
Nagrik I2 UX loop: remove friction from the sample demo path. Add/fix tool
presets, keep inspector secondary, verify Marathi summary + portal + reminder
deny/approve without hand-editing JSON. Commit. Stop when a cold user can
finish the demo in under two minutes.
```

## Done when

- [x] Demo prompt path needs no raw JSON
- [x] Inspector never blocks the left-rail reading flow
