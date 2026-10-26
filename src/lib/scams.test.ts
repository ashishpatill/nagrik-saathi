import { describe, expect, it } from "vitest";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import {
  SCAM_LIBRARY_REVIEWED,
  SCAM_LIBRARY_VERSION,
  SCAM_PATTERNS,
} from "@/data/scam-patterns";
import { analyzeText } from "@/lib/extract";
import {
  detectScamPatterns,
  getScamPattern,
  reviewedPortalsForPattern,
  summarizeScamMatches,
} from "@/lib/scams";

const REVIEW_DATE = new Date("2026-10-26T00:00:00Z");

describe("reviewed scam pattern library", () => {
  it("has unique, complete, reviewable patterns", () => {
    expect(SCAM_LIBRARY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(SCAM_LIBRARY_REVIEWED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(SCAM_PATTERNS.length).toBeGreaterThanOrEqual(8);

    const ids = SCAM_PATTERNS.map((pattern) => pattern.id);
    expect(new Set(ids).size).toBe(ids.length);

    const knownPortals = new Set(VERIFIED_PORTALS.map((portal) => portal.key));
    for (const pattern of SCAM_PATTERNS) {
      expect(pattern.title.length, pattern.id).toBeGreaterThan(10);
      expect(["high", "medium"]).toContain(pattern.severity);
      expect(["any", "all"]).toContain(pattern.match);
      expect(["credentials", "payment", "link", "pressure", "identity"]).toContain(
        pattern.category,
      );
      expect(pattern.summary.length, pattern.id).toBeGreaterThan(40);
      expect(pattern.signals.length, pattern.id).toBeGreaterThanOrEqual(2);
      expect(pattern.whyItMatters.length, pattern.id).toBeGreaterThan(30);
      expect(pattern.safeAction.length, pattern.id).toBeGreaterThan(30);
      expect(pattern.verifyHint.length, pattern.id).toBeGreaterThan(20);
      expect(pattern.sourceNote.length, pattern.id).toBeGreaterThan(10);
      expect(pattern.rules.length, pattern.id).toBeGreaterThanOrEqual(1);
      expect(new Date(pattern.lastReviewed).getTime()).toBeLessThanOrEqual(
        REVIEW_DATE.getTime(),
      );

      for (const key of pattern.officialPortalKeys) {
        expect(knownPortals.has(key), `${pattern.id} -> ${key}`).toBe(true);
      }
      expect(reviewedPortalsForPattern(pattern)).toHaveLength(
        pattern.officialPortalKeys.length,
      );

      for (const rule of pattern.rules) {
        expect(rule.id).toMatch(/^[a-z0-9-]+$/);
        expect(rule.examples.length, `${pattern.id}/${rule.id}`).toBeGreaterThanOrEqual(1);
        expect(
          rule.counterexamples.length,
          `${pattern.id}/${rule.id}`,
        ).toBeGreaterThanOrEqual(1);
        for (const example of rule.examples) {
          expect(rule.test(example), `${pattern.id}/${rule.id}: ${example}`).toBe(true);
        }
        for (const counterexample of rule.counterexamples) {
          expect(
            rule.test(counterexample),
            `${pattern.id}/${rule.id}: ${counterexample}`,
          ).toBe(false);
        }
      }
    }
  });

  it("matches the pattern it names in a realistic notice", () => {
    const cases: Array<[string, string]> = [
      ["otp-pin-request", "Please share the OTP you received to stop the payment."],
      [
        "digital-arrest",
        "This is CBI. Join the video call and do not tell your family. A warrant has been issued.",
      ],
      ["personal-upi", "Send ₹500 to ramesh@okhdfcbank to clear the bill."],
      [
        "electricity-disconnection",
        "Your electricity will be disconnected tonight. Call 9876543210.",
      ],
      ["shortened-link", "Pay at bit.ly/3xyzabc before the deadline."],
      ["fee-to-release", "Pay a processing fee of ₹500 to release your refund."],
      ["document-over-chat", "Send your Aadhaar photo on WhatsApp."],
      [
        "urgency-threat",
        "Pay within 24 hours or your connection will be disconnected.",
      ],
      ["whatsapp-only-contact", "Contact us on WhatsApp at 9876543210."],
      ["qr-code-payment", "This QR code is the only way to pay the bill."],
    ];

    for (const [id, text] of cases) {
      const matches = detectScamPatterns(text);
      expect(matches.some((match) => match.pattern.id === id), `${id}: ${text}`).toBe(true);
    }
  });

  it("does not flag a legitimate notice or a sentence that warns against the pattern", () => {
    const benign =
      "MSEDCL bill. Consumer number BU-411038-7781. Amount due ₹3,250. Pay by 15 October 2026 on the official Mahadiscom website.";
    expect(detectScamPatterns(benign)).toEqual([]);
    expect(detectScamPatterns("Never share your OTP with anyone.")).toEqual([]);
    expect(detectScamPatterns("There is no processing fee for this refund.")).toEqual([]);
    expect(detectScamPatterns("Scan the QR code to view the notice.")).toEqual([]);
    expect(detectScamPatterns("Scan this QR code to pay the bill.")).toEqual([]);
    expect(
      detectScamPatterns(
        "Consumer number BU-411038-7781. Pay within 24 hours or face a penalty. Helpline 1912.",
      ),
    ).toEqual([]);
    expect(
      detectScamPatterns(
        "Your electricity connection will be disconnected. Call the helpline 1912. Pay by 30 November 2026.",
      ),
    ).toEqual([]);
    expect(
      detectScamPatterns("The department does not use WhatsApp for official notices."),
    ).toEqual([]);
  });

  it("sets a suspicious risk only when a reviewed pattern matches", () => {
    const benign = analyzeText(
      "MSEDCL bill. Amount due ₹3,250. Pay by 15 October 2026.",
      "en",
    );
    expect(benign.scamRiskScore).toBe("safe");
    expect(benign.riskReason).toMatch(/No reviewed scam pattern matched/);

    const suspicious = analyzeText(
      "Please share the OTP you received to stop the payment.",
      "en",
    );
    expect(suspicious.scamRiskScore).toBe("suspicious");
    expect(suspicious.riskReason).toMatch(/OTP/);
    expect(suspicious.riskReason).toMatch(/not a fraud verdict/);
  });

  it("summarizes matches without declaring a verdict", () => {
    const summary = summarizeScamMatches(
      detectScamPatterns("Please share the OTP. Contact us on WhatsApp."),
    );
    expect(summary).toMatch(/Signals are not a fraud verdict/);
    expect(summary).toMatch(/OTP/);
    expect(summary).toMatch(/WhatsApp/);
  });

  it("looks up a pattern by id", () => {
    expect(getScamPattern("otp-pin-request")?.title).toMatch(/OTP/);
    expect(getScamPattern("missing")).toBeNull();
  });
});
