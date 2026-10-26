import { VERIFIED_PORTALS } from "@/data/official-portals";
import { SCAM_PATTERNS, type ScamPattern } from "@/data/scam-patterns";
import type { OfficialPortal } from "@/lib/types";

export interface ScamMatch {
  pattern: ScamPattern;
  ruleIds: string[];
}

const SEVERITY_RANK: Record<ScamPattern["severity"], number> = {
  high: 0,
  medium: 1,
};

/**
 * Match a notice against the reviewed pattern library.
 *
 * A pattern with `match: "all"` needs every rule to match. A pattern with
 * `match: "any"` needs at least one. Individual rules own their negation
 * handling and test fixtures, so a broad regex cannot silently flag a notice
 * that tells the reader not to do the thing.
 */
export function detectScamPatterns(text: string): ScamMatch[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];

  const matches: ScamMatch[] = [];
  for (const pattern of SCAM_PATTERNS) {
    const ruleIds = pattern.rules
      .filter((candidate) => candidate.test(normalized))
      .map((candidate) => candidate.id);
    const matched =
      pattern.match === "all"
        ? ruleIds.length === pattern.rules.length
        : ruleIds.length > 0;
    if (matched) matches.push({ pattern, ruleIds });
  }

  return matches.sort(
    (left, right) =>
      SEVERITY_RANK[left.pattern.severity] - SEVERITY_RANK[right.pattern.severity] ||
      left.pattern.title.localeCompare(right.pattern.title),
  );
}

export function getScamPattern(id: string): ScamPattern | null {
  return SCAM_PATTERNS.find((pattern) => pattern.id === id) ?? null;
}

export function reviewedPortalsForPattern(pattern: ScamPattern): OfficialPortal[] {
  return pattern.officialPortalKeys
    .map((key) => VERIFIED_PORTALS.find((portal) => portal.key === key))
    .filter((portal): portal is OfficialPortal => Boolean(portal));
}

export function summarizeScamMatches(matches: ScamMatch[]): string {
  if (matches.length === 0) {
    return "No reviewed scam pattern matched. This is not a safety guarantee. Confirm the issuer and destination using a printed bill or official helpline before you act.";
  }
  const titles = matches.slice(0, 2).map((match) => match.pattern.title);
  const extra = matches.length > 2 ? ` and ${matches.length - 2} more` : "";
  return `${titles.join("; ")}${extra}. Signals are not a fraud verdict. Verify the issuer and destination before you act.`;
}
