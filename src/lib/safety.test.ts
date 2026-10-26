import { describe, expect, it } from "vitest";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import { buildIcs } from "@/lib/calendar";
import { analyzeText } from "@/lib/extract";
import { findOfficialPortal, getPortalByKey } from "@/lib/portals";
import { LANGUAGES } from "@/lib/languages";
import {
  containsValidAadhaar,
  isValidAadhaar,
  isValidCardNumber,
  redactDeep,
  redactSensitiveData,
  scamSignals,
  validateOfficialPortal,
} from "@/lib/safety";
import { languageSchema, portalSchema, analyzeSchema } from "@/lib/webmcp/schemas";

describe("safe public-document boundaries", () => {
  it("redacts Aadhaar, PAN, and long account-like values", () => {
    expect(redactSensitiveData("Aadhaar 1234 5678 9012 PAN ABCDE1234F account 1234567890")).toContain("[redacted]");
    expect(redactSensitiveData("Aadhaar 1234 5678 9012")).not.toContain("1234");
  });

  it("redacts a Luhn-valid card in full, not just its first 12 digits", () => {
    const redacted = redactSensitiveData("Card 4111 1111 1111 1111 statement");
    expect(redacted).toContain("[redacted]");
    expect(redacted).not.toContain("4111");
    expect(redacted).not.toContain("1111");
  });

  it("validates Aadhaar with Verhoeff and cards with Luhn", () => {
    expect(isValidAadhaar("234567890124")).toBe(true);
    expect(isValidAadhaar("2345 6789 0124")).toBe(true);
    expect(isValidAadhaar("123456789012")).toBe(false);
    expect(isValidAadhaar("23456789012")).toBe(false);
    expect(isValidCardNumber("4111 1111 1111 1111")).toBe(true);
    expect(isValidCardNumber("4111111111111112")).toBe(false);
    expect(isValidCardNumber("1234567890")).toBe(false);
  });

  it("flags notices that embed a checksum-valid Aadhaar or card number", () => {
    const valid = { ...analyzeText("notice"), sourceText: "Aadhaar 2345 6789 0124" };
    expect(containsValidAadhaar(valid.sourceText)).toBe(true);
    expect(scamSignals(valid).flags.some((flag) => /checksum-valid/.test(flag))).toBe(true);

    const invalid = { ...analyzeText("notice"), sourceText: "Aadhaar 1234 5678 9012" };
    expect(containsValidAadhaar(invalid.sourceText)).toBe(false);
    expect(scamSignals(invalid).flags.some((flag) => /checksum-valid/.test(flag))).toBe(false);
  });

  it("returns reviewed patterns for a scam-shaped notice", () => {
    const doc = analyzeText(
      "Please share the OTP you received to stop the payment.",
      "en",
    );
    const result = scamSignals(doc);
    expect(result.patternCount).toBeGreaterThan(0);
    expect(result.patterns[0]?.id).toBe("otp-pin-request");
    expect(result.patterns[0]?.verify.some((portal) => portal.url.includes("cybercrime"))).toBe(
      true,
    );
    expect(result.advice).toMatch(/not a fraud verdict/i);
  });

  it("keeps a legitimate notice with no pattern at no_obvious_signals", () => {
    const doc = analyzeText(
      "Notice 12345. Consumer number BU-411038-7781. Pay within 24 hours or a penalty applies. Helpline 1912.",
      "en",
    );
    const result = scamSignals(doc);
    expect(result.patternCount).toBe(0);
    expect(result.risk).toBe("no_obvious_signals");
    expect(result.advice).toMatch(/No reviewed pattern matched/);
  });

  it("redacts nested strings in tool-log structures", () => {
    const logged = redactDeep({
      query: "bill for PAN ABCDE1234F",
      items: ["account 1234567890", { note: "card 4111 1111 1111 1111" }],
      count: 2,
    });
    const serialized = JSON.stringify(logged);
    expect(serialized).not.toContain("ABCDE1234F");
    expect(serialized).not.toContain("1234567890");
    expect(serialized).not.toContain("4111");
    expect(logged.count).toBe(2);
  });

  it("returns only a reviewed official MSEDCL host", () => {
    const result = findOfficialPortal("msedcl", "bill_payment", "Maharashtra");
    expect(result.verified).toBe(true);
    expect(new URL(result.officialUrl as string).hostname).toBe("wss.mahadiscom.in");
  });

  it("refuses unknown or mismatched portal requests", () => {
    expect(findOfficialPortal("unknown", "bill_payment", "Maharashtra").verified).toBe(false);
    expect(findOfficialPortal("msedcl", "bank_login", "Maharashtra").verified).toBe(false);
  });

  it("creates a reviewable ICS reminder with an exclusive next-day end", () => {
    const ics = buildIcs("Review bill; deadline", "2026-09-02");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260902");
    expect(ics).toContain("DTEND;VALUE=DATE:20260903");
    expect(ics).toContain("UID:");
    expect(ics).toContain("DTSTAMP:");
    expect(ics).toContain("Nagrik Saathi");
    expect(ics).toContain("SUMMARY:Review bill deadline");
  });

  it("keeps calendar titles on one property line", () => {
    const ics = buildIcs("Bill due\r\nATTENDEE:mailto:attacker@example.com", "2026-12-31");
    expect(ics.split("\r\n").some((line) => line.startsWith("ATTENDEE:"))).toBe(false);
    expect(ics).toContain("SUMMARY:Bill due ATTENDEE:mailto:attacker@example.com");
  });

  it("rolls the ICS end date across month boundaries", () => {
    expect(buildIcs("Month end", "2026-12-31")).toContain("DTEND;VALUE=DATE:20270101");
    expect(buildIcs("Leap day", "2028-02-28")).toContain("DTEND;VALUE=DATE:20280229");
  });

  it("keeps every curated portal on HTTPS with allowed hostnames", () => {
    expect(VERIFIED_PORTALS.length).toBeGreaterThanOrEqual(30);
    for (const portal of VERIFIED_PORTALS) {
      expect(validateOfficialPortal(portal)).toBe(true);
      expect(portal.portalUrl.startsWith("https://")).toBe(true);
    }
  });

  it("resolves the curated MSEDCL portal key", () => {
    const portal = getPortalByKey("msedcl_power");
    expect(portal?.verifiedDomain).toBe("wss.mahadiscom.in");
    expect(portal && validateOfficialPortal(portal)).toBe(true);
  });

  it("validates WebMCP tool schemas", () => {
    expect(languageSchema.parse({})).toEqual({ language: "en" });
    expect(portalSchema.parse({ department: "MSEDCL", service: "bill_payment", state: "Maharashtra" }).department).toBe("MSEDCL");
    expect(() => portalSchema.parse({ department: "MSEDCL", service: "bill_payment" })).toThrow();
    expect(analyzeSchema.parse({ sourceText: "MSEDCL bill ₹100 due 2026-09-02" }).sourceText).toContain("MSEDCL");
    expect(() => analyzeSchema.parse({})).toThrow();
  });

  it("extracts MSEDCL fields from free-form notice text", () => {
    const result = analyzeText(
      "MSEDCL Pune Urban Circle. Consumer number BU-411038-9921. Amount due ₹2,430. Please pay by 02 September 2026.",
    );
    expect(result.officialDepartmentKey).toBe("msedcl_power");
    expect(result.amountDue).toBe(2430);
    expect(result.deadlineDate).toBe("2026-09-02");
    expect(result.referenceNumber).toBe("BU-411038-9921");
    expect(result.summary.en).not.toMatch(/sample/i);
  });

  it("returns an empty case for blank input", () => {
    expect(analyzeText("").id).toBe("empty");
  });

  it("produces a non-empty brief in all eight supported languages", () => {
    const analysis = analyzeText(
      "MSEDCL Pune Urban Circle. Amount due ₹2,430. Please pay by 02 September 2026.",
    );
    for (const language of LANGUAGES) {
      expect(analysis.summary[language].trim().length, `language ${language}`).toBeGreaterThan(0);
    }
  });
});
