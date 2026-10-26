# Scam pattern library

`src/data/scam-patterns.ts` is the reviewed source of truth for the scam
signals the app can explain. `/scams` is the public page. The
`check_scam_signals` tool returns the matched patterns, not just a score.

The library is a set of signals, not a fraud investigation. A match means the
text uses a pattern that scammers also use. It does not prove the notice is
fake, and a notice with no match can still be fraudulent.

## What a pattern contains

Every entry has:

- `id`: a stable, lowercase, hyphenated identifier.
- `title`, `summary`, `signals`, `whyItMatters`, `safeAction`, and
  `verifyHint`: the citizen-facing explanation.
- `category`: `credentials`, `payment`, `link`, `pressure`, or `identity`.
- `severity`: `high` (a strong signal) or `medium` (a review signal).
- `match`: `any` or `all`, describing how the rules combine.
- `officialPortalKeys`: keys into `src/data/official-portals.ts`. Never a raw
  URL.
- `sourceNote` and `lastReviewed`: what the pattern is based on and when a
  human last checked it.
- `rules`: one or more deterministic tests.

A rule has an `id`, a `label`, a `test` function, at least one `example`, and at
least one `counterexample`. The test suite runs every rule against both sets.
An example must match. A counterexample must not. A broad regex that flags a
legitimate notice fails CI before it reaches a citizen.

## Detection semantics

`detectScamPatterns(text)` runs every pattern against the notice text.

- `match: "any"` means one rule is enough.
- `match: "all"` means every rule must match.
- Rules may use `positiveSentences` to ignore a sentence that tells the reader
  not to do something. "Never share your OTP" must not match the same rule as
  "Share your OTP".
- A pattern that promises a refund does not match a sentence that says there is
  no processing fee.
- Matches are sorted by severity, then title.

The result is intentionally conservative in language. `summarizeScamMatches`
returns "Signals are not a fraud verdict" for a match, and "This is not a
safety guarantee" for no match.

## Adding or changing a pattern

1. Add or edit the entry in `src/data/scam-patterns.ts`.
2. Use a registry key for every official link. If the department is missing,
   add it to the registry first, with a review date and a helpline.
3. Write at least one positive example and one counterexample for every rule.
4. Run `pnpm test`. The library test verifies ids, dates, categories, registry
   keys, examples, and counterexamples.
5. Run `pnpm playbooks:build` if the pattern changes the precache list. It
   normally does not, but `/scams` is part of the core precache set.
6. Update the public page if the pattern count or the review date changes.
   `SCAM_LIBRARY_VERSION` and `SCAM_LIBRARY_REVIEWED` are shown on `/scams`.
7. Update `docs/STATUS.md` and the plan when the change is a milestone rather
   than a correction.

## Review and correction flow

A pattern is reviewed against public guidance from the issuing department, a
regulator, or the national Cyber Crime Portal. The `sourceNote` records the
kind of guidance, not a fabricated circular number. The `lastReviewed` date is
set only when a human has checked the claim.

A correction should name the pattern id and include the notice text with
personal details removed. If a pattern causes a false positive on a legitimate
notice, add that notice as a counterexample before narrowing the rule.

Quarterly review should check:

- Every `officialPortalKeys` entry still resolves to a reviewed registry entry.
- Every `lastReviewed` date is current.
- The reporting route (Cyber Crime Portal and 1930) is still correct.
- No pattern asks for, collects, stores, or verifies Aadhaar, PAN, OTP, PIN,
  passwords, or banking details.

## Current patterns

The library ships ten patterns:

1. `otp-pin-request`
2. `digital-arrest`
3. `personal-upi`
4. `electricity-disconnection`
5. `shortened-link`
6. `fee-to-release`
7. `document-over-chat`
8. `urgency-threat`
9. `whatsapp-only-contact`
10. `qr-code-payment`

The public page lists them in the same editorial order.

## Boundaries

The library does not:

- upload, store, or transmit the notice;
- call a number, message an official, pay, file, or report for the citizen;
- declare a notice safe or fraudulent;
- replace the Cyber Crime Portal, a bank, a lawyer, or the issuing department;
- provide legal advice.

If a citizen has already paid, the safe route is to call the bank or wallet
provider, report at the national Cyber Crime Portal or 1930, keep the evidence,
and avoid paying more to recover the first payment.

## Tests

`src/lib/scams.test.ts` covers:

- unique and complete pattern metadata;
- valid registry keys;
- a positive example and counterexample for every rule;
- a realistic notice for every pattern;
- benign notices and warning sentences that must not match;
- the `analyzeText` risk integration;
- the summary wording and lookup helper.

`src/lib/safety.test.ts` covers the `scamSignals` response, including the
reviewed portal attached to a matched pattern.
