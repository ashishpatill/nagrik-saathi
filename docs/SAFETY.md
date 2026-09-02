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

## Document privacy

The demo stores cases in the browser's IndexedDB. The optional analysis route
receives only pasted text and does not persist it. Family briefs redact common
Aadhaar, PAN, and account-like patterns before export. Redaction is a safety
aid, not a guarantee; users should still avoid uploading unnecessary personal
data.

## Agent safety

Tool arguments and document text are untrusted. Schemas are narrow, outputs
are short, and state-changing downloads/reminders require visible approval.
Tool activity stays off the default citizen UI. Open `/?inspector=1` only when
debugging WebMCP tool calls.
