import { describe, expect, it } from "vitest";
import { VERIFIED_PORTALS } from "@/data/official-portals";
import { buildIcs } from "@/lib/calendar";
import { findOfficialPortal, getPortalByKey } from "@/lib/portals";
import { redactSensitiveData, validateOfficialPortal } from "@/lib/safety";
import { languageSchema, portalSchema } from "@/lib/webmcp/schemas";

describe("safe public-document boundaries", () => {
  it("redacts Aadhaar, PAN, and long account-like values", () => {
    expect(redactSensitiveData("Aadhaar 1234 5678 9012 PAN ABCDE1234F account 1234567890")).toContain("[redacted]");
    expect(redactSensitiveData("Aadhaar 1234 5678 9012")).not.toContain("1234");
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

  it("creates a reviewable ICS reminder", () => {
    const ics = buildIcs("Review bill; deadline", "2026-09-02");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260902");
    expect(ics).toContain("Nagrik Saathi");
    expect(ics).toContain("SUMMARY:Review bill  deadline");
  });

  it("keeps every curated portal on HTTPS with allowed hostnames", () => {
    expect(VERIFIED_PORTALS.length).toBeGreaterThanOrEqual(30);
    for (const portal of VERIFIED_PORTALS) {
      expect(validateOfficialPortal(portal)).toBe(true);
      expect(portal.portalUrl.startsWith("https://")).toBe(true);
    }
  });

  it("resolves the sample MSEDCL portal key", () => {
    const portal = getPortalByKey("msedcl_power");
    expect(portal?.verifiedDomain).toBe("wss.mahadiscom.in");
    expect(portal && validateOfficialPortal(portal)).toBe(true);
  });

  it("validates WebMCP tool schemas", () => {
    expect(languageSchema.parse({})).toEqual({ language: "en" });
    expect(portalSchema.parse({ department: "MSEDCL", service: "bill_payment", state: "Maharashtra" }).department).toBe("MSEDCL");
    expect(() => portalSchema.parse({ department: "MSEDCL", service: "bill_payment" })).toThrow();
  });
});
