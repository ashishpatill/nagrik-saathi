import { describe, expect, it } from "vitest";
import { analyzeText, hasAnalyzedNotice, portalHintsForCase } from "@/lib/extract";

describe("analyzeText", () => {
  it("extracts fields from a real-looking MSEDCL notice without sample defaults", () => {
    const text = `
      Maharashtra State Electricity Distribution Co. Ltd (MSEDCL)
      Consumer number BU-411038-7781
      Amount due ₹3,250
      Please pay by 15 October 2026 on the official Mahadiscom website.
    `;
    const result = analyzeText(text, "en");
    expect(hasAnalyzedNotice(result)).toBe(true);
    expect(result.issuer).toContain("MSEDCL");
    expect(result.amountDue).toBe(3250);
    expect(result.deadlineDate).toBe("2026-10-15");
    expect(result.referenceNumber).toBe("BU-411038-7781");
    expect(result.officialDepartmentKey).toBe("msedcl_power");
    expect(result.summary.en).not.toMatch(/sample/i);
    expect(portalHintsForCase(result)).toEqual({
      department: "MSEDCL",
      service: "bill_payment",
      state: "Maharashtra",
    });
  });

  it("returns empty analysis for blank input", () => {
    expect(hasAnalyzedNotice(analyzeText("   "))).toBe(false);
  });
});
