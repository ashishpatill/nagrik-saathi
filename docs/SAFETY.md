# Safety boundary

Nagrik Saathi helps a person understand a document. It is not a government
service, legal decision-maker, payment processor, or filing agent.

## Refusals

- No government, banking, email, or identity credentials
- No Aadhaar, PAN, OTP, PIN, or sensitive account collection
- No scraping, autofill, login, payment, filing, grievance submission, or
  outbound message
- No model-supplied URLs
- No claim that generated guidance is an official decision

## Portal verification

`find_official_portal` accepts a department, service, and state. It does not
accept a URL. It searches `src/data/official-portals.ts`, checks HTTPS, checks
the hostname against that entry's reviewed hostname list, and otherwise
returns a no-match instruction to use the printed helpline or office.

The registry should be reviewed by a human whenever an entry is added or
changed. An official-looking domain is not enough evidence by itself.

### Re-review policy

Every registry entry carries a `lastReviewed` date, shown to users in the
matched-portal card and the browsable directory. The rules:

- A new or changed entry must be verified by a human (HTTPS, hostname,
  helpline, department identity) on the day of the change; `lastReviewed`
  records that day.
- Re-verify every entry at least quarterly. A domain that goes dark,
  changes hands, or starts serving different content must be removed or
  corrected the same day — a wrong entry here means the scam-checker itself
  points people at a scam.
- The UI surfaces the oldest `lastReviewed` in the directory header, so a
  stale registry is visible to users, not hidden.

## Document privacy

The demo stores cases in the browser's IndexedDB. The optional analysis route
receives only pasted text and does not persist it. Family briefs redact common
Aadhaar, PAN, and account-like patterns before export. Redaction is a safety
aid, not a guarantee; users should still avoid uploading unnecessary personal
data.

Redaction checks checksums where the format has one: payment cards are
redacted in full only when Luhn-valid, and Aadhaar validity (Verhoeff) feeds
the scam-signal check when a notice embeds a checksum-valid number. The
redaction pipeline itself stays deliberately over-broad — formatted
Aadhaar-like groups and 9–18-digit account-like runs are redacted without a
checksum requirement. Tool-call logs (IndexedDB) pass through the same
pipeline (`redactDeep`) before they persist.

## Data protection (DPDP Act 2023 posture)

The default flow processes documents on-device and stores cases only in the
user's own browser: Nagrik Saathi acts as neither a Data Fiduciary nor a
Data Processor for that data — it never receives it. Two boundaries keep
that true:

- `/api/analyze` receives pasted text transiently for stateless analysis and
  persists nothing.
- If a server-side case store, cloud sync, or any cross-device feature is
  ever added, it must ship only with explicit opt-in consent, a stated
  purpose, retention limits, a deletion endpoint, and field-level encryption
  with per-user keys — until then this app stays out of DPDP fiduciary
  scope by architecture, not by policy.

## Agent safety

Tool arguments and document text are untrusted. Schemas are narrow, outputs
are short, and state-changing downloads/reminders require visible approval.
Tool activity stays off the default citizen UI. Open `/?inspector=1` only when
debugging WebMCP tool calls.
