import type { DocumentAnalysis, OfficialPortal } from "@/lib/types";

const sensitivePatterns = [
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  /\b[A-Z]{5}\d{4}[A-Z]\b/gi,
  /\b\d{9,18}\b/g,
];

export function redactSensitiveData(value: string): string {
  return sensitivePatterns.reduce((result, pattern) => result.replace(pattern, "[redacted]"), value);
}

export function truncateForTool(value: unknown, max = 1400): unknown {
  const text = typeof value === "string" ? value : JSON.stringify(value);
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
  const flags: string[] = [];
  if (/\b(upi|otp|pin|password|click urgently)\b/i.test(doc.sourceText)) {
    flags.push("The message mentions credentials, OTP, payment handles, or urgent clicking.");
  }
  if (doc.scamRiskScore !== "safe") flags.push(doc.riskReason);
  if (!doc.deadlineDate) flags.push("No clear deadline was found; verify the notice through a printed helpline.");
  return {
    risk: flags.length ? "needs_review" : "no_obvious_signals",
    flags,
    advice: "Do not share OTPs or credentials. Verify the issuer using a printed notice or reviewed portal.",
  };
}
