import type { DocumentAnalysis, OfficialPortal } from "@/lib/types";
import { detectScamPatterns, reviewedPortalsForPattern } from "@/lib/scams";

// --- Checksum validators ----------------------------------------------------
// Verhoeff (Aadhaar/UIDAI) and Luhn (payment cards). Used for full-run card
// redaction and for scam signals when a notice embeds a checksum-valid
// sensitive number. Redaction itself stays deliberately over-broad: a
// redaction aid should fail closed, so formatted Aadhaar-like groups and
// account-like digit runs are redacted without any checksum requirement.

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(digits)) return false;
  let checksum = 0;
  const reversed = [...digits].reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    checksum = VERHOEFF_D[checksum][VERHOEFF_P[i % 8][Number(reversed[i])]];
  }
  return checksum === 0;
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits.charCodeAt(i) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

// --- Redaction ---------------------------------------------------------------

const PAN_PATTERN = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
// Card candidates run before the Aadhaar pattern so a 16-digit Luhn-valid
// card is redacted in full instead of losing its first 12 digits to the
// 4-4-4 Aadhaar shape.
const CARD_CANDIDATE = /\b(?:\d[ -]?){13,18}\d\b/g;
const AADHAAR_FORMATTED = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const ACCOUNT_LIKE = /\b\d{9,18}\b/g;

export function redactSensitiveData(value: string): string {
  return value
    .replace(PAN_PATTERN, "[redacted]")
    .replace(CARD_CANDIDATE, (match) => (isValidCardNumber(match) ? "[redacted]" : match))
    .replace(AADHAAR_FORMATTED, "[redacted]")
    .replace(ACCOUNT_LIKE, "[redacted]");
}

/** Redact every string in an arbitrary structure (tool-log hygiene). */
export function redactDeep<T>(value: T): T {
  if (typeof value === "string") return redactSensitiveData(value) as T;
  if (Array.isArray(value)) return value.map((item) => redactDeep(item)) as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactDeep(item)]),
    ) as T;
  }
  return value;
}

export function containsValidAadhaar(value: string): boolean {
  const candidates = value.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g) ?? [];
  return candidates.some(isValidAadhaar);
}

export function containsValidCardNumber(value: string): boolean {
  const candidates = value.match(new RegExp(CARD_CANDIDATE.source, "g")) ?? [];
  return candidates.some(isValidCardNumber);
}

// --- Boundaries ----------------------------------------------------------------

export function truncateForTool(value: unknown, max = 1400): unknown {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
  if (text.length <= max) return value;
  return { status: "truncated", message: `${text.slice(0, max - 40)}…`, fullDetailsInWorkspace: true };
}

export function validateOfficialPortal(portal: OfficialPortal): boolean {
  try {
    const url = new URL(portal.portalUrl);
    return (
      url.protocol === "https:" &&
      portal.allowedHostnames.some(
        (hostname) => url.hostname === hostname || url.hostname.endsWith(`.${hostname}`),
      )
    );
  } catch {
    return false;
  }
}

export function scamSignals(doc: DocumentAnalysis) {
  const matches = detectScamPatterns(doc.sourceText);
  const flags: string[] = [];
  if (/\b(upi|otp|pin|password|click urgently)\b/i.test(doc.sourceText)) {
    flags.push("The message mentions credentials, OTP, payment handles, or urgent clicking.");
  }
  if (containsValidAadhaar(doc.sourceText) || containsValidCardNumber(doc.sourceText)) {
    flags.push(
      "The notice embeds a checksum-valid Aadhaar or card number. Treat it as sensitive and never re-enter it anywhere.",
    );
  }
  if (!doc.deadlineDate && doc.documentType !== "payment_receipt") {
    flags.push(
      "No calendar date was found in the notice; confirm the deadline on the printed notice or the department portal.",
    );
  }

  const patterns = matches.slice(0, 4).map(({ pattern, ruleIds }) => ({
    id: pattern.id,
    title: pattern.title,
    severity: pattern.severity,
    summary: pattern.summary,
    safeAction: pattern.safeAction,
    matchedRules: ruleIds,
    verify: reviewedPortalsForPattern(pattern).map((portal) => ({
      name: portal.departmentName,
      url: portal.portalUrl,
      helpline: portal.helpline,
    })),
  }));

  return {
    risk: matches.length ? "needs_review" : "no_obvious_signals",
    patternCount: matches.length,
    patterns,
    flags,
    advice: matches.length
      ? "Signals are not a fraud verdict. Do not share OTPs or credentials. Verify the issuer through the reviewed portal or the printed helpline."
      : "No reviewed pattern matched. This is not a safety guarantee. Do not share OTPs or credentials, and verify the issuer before you act.",
    boundary: "Heuristic review only. Report fraud at the national Cyber Crime Portal or 1930.",
  };
}
