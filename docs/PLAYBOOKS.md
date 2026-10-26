# Process playbooks

The playbooks explain how a citizen usually moves through a government
workflow: the steps, documents, fees, timelines, common rejection reasons, and
the reviewed official portal for each stage. They are guidance, not a filing
service. Nagrik Saathi never logs in, pays, submits, or sends anything on the
citizen's behalf.

## Source of truth

YAML files in [`content/playbooks/`](../content/playbooks) are the source of
truth. `src/data/playbooks.generated.json` is generated; never edit it by hand.

| Command | Purpose |
| --- | --- |
| `pnpm playbooks:build` | Validate every YAML file and regenerate the JSON registry |
| `pnpm playbooks:check` | Validate and fail if the generated file is stale (CI) |
| `pnpm test` | Schema, registry, portal-reference, and localization tests |

The build script also checks that all 15 planned workflows plus the Aadhaar
guidance page are present, that every portal key exists in
`src/data/official-portals.ts`, and that only `aadhaar-update` is marked
`guidanceOnly`.

## File shape

```yaml
schemaVersion: 1
slug: passport
version: 1
order: 2
lastReviewed: "2026-10-26"
category: travel
guidanceOnly: false
title:
  en: Apply for or renew an Indian passport
  hi: भारतीय पासपोर्ट के लिए आवेदन या नवीनीकरण
  mr: भारतीय पासपोर्टसाठी अर्ज किंवा नूतनीकरण
summary:
  en: A short plain-language overview.
  hi: संक्षिप्त हिंदी सारांश।
  mr: संक्षिप्त मराठी सारांश.
feeNote:
  en: What the fee depends on, and where to confirm it.
  hi: शुल्क किस पर निर्भर है और कहाँ पुष्टि करें।
  mr: शुल्क कशावर अवलंबून आहे आणि कुठे तपासावे.
timelineNote:
  en: A typical range, with the main source of delay.
  hi: सामान्य अवधि और देरी का मुख्य कारण।
  mr: साधारण कालावधी आणि उशिराचे मुख्य कारण.
portalKeys:
  - passportindia
helplines:
  - "1800-258-1800 (Passport Seva national call centre)"
documents:
  - en: "Proof of identity from the accepted list"
steps:
  - title:
      en: Register and fill the form
    detail:
      en: Use the official portal and keep the application number.
    portalKey: passportindia
rejectionReasons:
  - en: "Name or date of birth does not match the supporting documents"
```

## Rules

### Portal links come from the registry only

`portalKeys` and `steps[].portalKey` must name an entry in
[`src/data/official-portals.ts`](../src/data/official-portals.ts). Do not put a
raw URL in a playbook. To add a new official portal, add it to the registry in
the same pull request, with the reviewed hostname and helpline. The UI renders
the registry URL, never a URL from the YAML.

### Localization

- `title`, `summary`, `feeNote`, and `timelineNote` require English, Hindi, and
  Marathi (`en`, `hi`, `mr`).
- Step titles, step details, documents, and rejection reasons require English.
  Translators may add `hi`, `mr`, or any of the other supported languages; the
  UI falls back to English and shows a visible note when a language is partial.
- Do not machine-translate legal or fee wording without a human review. Keep
  the English source and the translation in the same pull request so reviewers
  can compare them.

### Honesty about fees and timelines

- Say what a fee depends on and where to confirm it. Do not present a stale
  number as authoritative.
- Give a range when the process varies by state, load, category, or office.
- Link the official portal in `portalKeys`; do not cite a private agent,
  coaching site, or news article as the source of truth.
- Set `lastReviewed` to the date a human actually checked the content.
- Bump `version` for a substantive correction. Small typo fixes may keep the
  version but must still pass validation.

### Aadhaar is guidance-only

`aadhaar-update` is the only playbook allowed to set `guidanceOnly: true`.
It must never ask for, collect, store, or verify an Aadhaar number. The same
rule applies to every playbook: describe the process, never turn the page into
an identity form.

### No write automation

Playbooks may explain how to file, pay, or appeal. They must not add a button
or agent tool that performs the action. The boundary is visible on every page:
the citizen opens the official portal and acts there.

## Contribution flow

1. Open the **Playbook correction** issue form with the playbook slug, the
   exact text to change, and an official source URL.
2. Fork the repository and edit the YAML file. If the change needs a new
   official portal, update `src/data/official-portals.ts` too.
3. Run:

   ```sh
   pnpm playbooks:build
   pnpm playbooks:check
   pnpm lint
   pnpm test
   pnpm build
   ```

4. Open a pull request. Include the official source, the reason for the change,
   and whether the Hindi/Marathi overview changed.
5. A reviewer checks the source, the safety boundary, the registry key, and the
   translation before merging.

## Review cadence

- Re-check every playbook at least quarterly, and sooner when a linked portal
  changes its process, fee, or URL.
- If a portal is unreachable or has moved, update the registry entry first and
  then the playbook. Do not leave a dead link in a "reviewed" playbook.
- The `lastReviewed` date and the `version` are shown to readers. Do not update
  either without an actual review.
