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

  it("matches traffic challan notices to the traffic portal", () => {
    const result = analyzeText(
      "Maharashtra Traffic Police e-challan notice. Challan number MH-TR-998812. Amount due ₹500. Pay by 2026-11-01.",
      "en",
    );
    expect(result.officialDepartmentKey).toBe("mahatraffic");
    expect(result.documentType).toBe("traffic_challan");
    expect(portalHintsForCase(result).service).toBe("traffic_challan");
  });

  it("matches DigiLocker notices to the DigiLocker portal", () => {
    const result = analyzeText("Your DigiLocker document request is pending. Reference DL-778821.", "en");
    expect(result.officialDepartmentKey).toBe("digilocker");
  });

  it("parses an MSEDCL paid receipt without inventing a payment deadline", () => {
    const text = `
Thank you for using Online Payment facility for paying your MSEDCL Energy Bill.
Please use your Transaction ID for any queries/complaints related to this transaction in future.

Transaction Reference No.:	PP016177BX5TW1FJT889
Payment Receip No.:	2606260000166840925
Bill Type:	LT
Consumer No.:	020853943747
Amount:	180/-
Transaction Date & Times:	6/26/2026 6:33:30 PM
`;
    const result = analyzeText(text, "en");
    expect(result.documentType).toBe("payment_receipt");
    expect(result.issuer).toContain("MSEDCL");
    expect(result.amountDue).toBe(180);
    expect(result.deadlineDate).toBe("2026-06-26");
    expect(result.referenceNumber).toBe("PP016177BX5TW1FJT889");
    expect(result.urgency).toBe("low");
    expect(result.summary.en).toMatch(/payment receipt/i);
    expect(result.summary.en).not.toMatch(/deadline/i);
    expect(result.summary.mr).toMatch(/पेमेंट पावती/);
    expect(result.summary.ta).toMatch(/ரசீத/);
    expect(result.summary.bn).toMatch(/রসিদ/);
    expect(result.summary.en).toMatch(/180/);
    expect(result.summary.mr).toMatch(/PP016177BX5TW1FJT889/);
    expect(result.summary.mr).not.toMatch(/अंतिम तारीख|unspecified|no clear reference/i);
    expect(result.requiredActionItems.some((item) => /do not pay again/i.test(item))).toBe(true);
  });
});
