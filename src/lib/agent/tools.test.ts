import { describe, expect, it, vi } from "vitest";
import { buildChecklistHtml, escapeHtml } from "@/lib/agent/checklist";
import { createAgentTools } from "@/lib/agent/tools";
import type { AgentTool, AgentToolRuntime } from "@/lib/agent/types";
import { EMPTY_CASE } from "@/lib/extract";
import type { DocumentAnalysis } from "@/lib/types";

function makeRuntime(current: DocumentAnalysis = EMPTY_CASE, approve = true) {
  let caseValue = current;
  const requestApproval = vi.fn(async () => approve);
  const runtime: AgentToolRuntime = {
    getCase: () => caseValue,
    setCase: (value) => {
      caseValue = value;
    },
    requestApproval,
  };
  return {
    runtime,
    requestApproval,
    get current() {
      return caseValue;
    },
  };
}

function byName(tools: AgentTool[], name: string): AgentTool {
  const tool = tools.find((item) => item.name === name);
  if (!tool) throw new Error(`Missing tool ${name}`);
  return tool;
}

const NOTICE = `
  Maharashtra State Electricity Distribution Co. Ltd (MSEDCL)
  Consumer number BU-411038-7781
  Amount due ₹3,250
  Please pay by 15 October 2026 on the official Mahadiscom website.
`;

describe("agent tool registry", () => {
  const tools = createAgentTools();

  it("exposes twelve unique, explicit contracts", () => {
    expect(tools).toHaveLength(12);
    expect(new Set(tools.map((tool) => tool.name)).size).toBe(12);
    for (const tool of tools) {
      expect(["read-only", "untrusted-content", "side-effect"]).toContain(tool.trustLevel);
      expect(tool.maxFrequency).toMatch(/^\d+\/(?:min|hour)$/);
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.exampleInput).toBeTypeOf("object");
    }
  });

  it("keeps approval-gated tools out of the MCP surface", () => {
    const sideEffects = tools.filter((tool) => tool.trustLevel === "side-effect");
    expect(sideEffects.map((tool) => tool.name).sort()).toEqual([
      "export_family_brief",
      "schedule_reminder",
    ]);
    for (const tool of sideEffects) {
      expect(tool.requiresApproval).toBe(true);
      expect(tool.mcpExposed).toBe(false);
    }
    expect(tools.filter((tool) => tool.mcpExposed)).toHaveLength(10);
  });

  it("analyzes supplied text and returns a localized summary", async () => {
    const session = makeRuntime();
    const analyze = byName(tools, "analyze_notice");
    const analysis = (await analyze.execute({ sourceText: NOTICE, language: "en" }, session.runtime)) as {
      status: string;
      issuer: string;
      amountDue: number;
    };
    expect(analysis.status).toBe("analyzed");
    expect(analysis.issuer).toContain("MSEDCL");
    expect(analysis.amountDue).toBe(3250);

    const summary = byName(tools, "get_notice_summary");
    const hindi = (await summary.execute({ language: "hi" }, session.runtime)) as {
      summary: string;
      requiredDocuments: string[];
      disclaimer: string;
    };
    expect(hindi.summary).toContain("MSEDCL");
    expect(hindi.requiredDocuments[0]).toMatch(/बिल|नोटिस/);
    expect(hindi.disclaimer).toContain("मार्गदर्शन");
  });

  it("returns reviewed scam patterns from check_scam_signals within its result cap", async () => {
    const session = makeRuntime();
    const analyze = byName(tools, "analyze_notice");
    await analyze.execute(
      {
        sourceText:
          "Your electricity connection will be disconnected tonight. Please share the OTP you received. Pay a processing fee of ₹500 to ramesh@okhdfcbank. Contact us on WhatsApp at 9876543210 immediately.",
        language: "en",
      },
      session.runtime,
    );
    const check = byName(tools, "check_scam_signals");
    const result = (await check.execute({ language: "en" }, session.runtime)) as {
      risk: string;
      patternCount: number;
      patterns: Array<{ id: string; verify: Array<{ url: string }> }>;
      boundary: string;
    };
    expect(result.risk).toBe("needs_review");
    expect(result.patternCount).toBeGreaterThanOrEqual(4);
    expect(result.patterns.some((pattern) => pattern.id === "otp-pin-request")).toBe(true);
    expect(
      result.patterns.some((pattern) =>
        pattern.verify.some((portal) => portal.url.includes("cybercrime")),
      ),
    ).toBe(true);
    expect(result.boundary).toMatch(/Heuristic review/);
    expect(check.maxResultChars).not.toBeNull();
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(
      check.maxResultChars as number,
    );
  });

  it("refuses case-dependent calls without a notice", async () => {
    const session = makeRuntime();
    await expect(
      byName(tools, "create_action_plan").execute({ language: "en" }, session.runtime),
    ).rejects.toThrow(/No analyzed notice/);
  });

  it("verifies only reviewed portal hosts and paths", async () => {
    const verify = byName(tools, "verify_portal_url");
    const exact = (await verify.execute(
      { url: "https://wss.mahadiscom.in/wss/wss" },
      makeRuntime().runtime,
    )) as { verified: boolean; match: string; officialUrl: string };
    expect(exact.verified).toBe(true);
    expect(exact.match).toBe("registered_path");
    expect(exact.officialUrl).toBe("https://wss.mahadiscom.in/wss/wss");

    const otherPath = (await verify.execute(
      { url: "https://wss.mahadiscom.in/some-other-page" },
      makeRuntime().runtime,
    )) as { verified: boolean; match: string };
    expect(otherPath.verified).toBe(true);
    expect(otherPath.match).toBe("official_domain");

    for (const url of [
      "https://wss.mahadiscom.in.evil.example/wss",
      "http://wss.mahadiscom.in/wss/wss",
      "https://user:pass@wss.mahadiscom.in/wss/wss",
      "https://example.com/wss",
    ]) {
      const result = (await verify.execute({ url }, makeRuntime().runtime)) as { verified: boolean };
      expect(result.verified, url).toBe(false);
    }
  });

  it("redacts identifiers locally without echoing them", async () => {
    const result = (await byName(tools, "redact_pii").execute(
      { text: "Aadhaar 2345 6789 0124 PAN ABCDE1234F card 4111 1111 1111 1111" },
      makeRuntime().runtime,
    )) as { text: string; changed: boolean; redactions: number };
    expect(result.changed).toBe(true);
    expect(result.redactions).toBeGreaterThanOrEqual(3);
    expect(result.text).not.toContain("2345 6789 0124");
    expect(result.text).not.toContain("ABCDE1234F");
    expect(result.text).not.toContain("4111");
  });

  it("localizes the brief using reviewed templates", async () => {
    const result = (await byName(tools, "translate_brief").execute(
      { sourceText: "MSEDCL bill of ₹500 due 20 November 2026", language: "mr" },
      makeRuntime().runtime,
    )) as { summary: string; checklist: string[]; method: string };
    expect(result.summary.length).toBeGreaterThan(20);
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(result.method).toBe("reviewed_language_template");
  });

  it("requires approval before creating a reminder", async () => {
    const denied = makeRuntime(EMPTY_CASE, false);
    const result = (await byName(tools, "schedule_reminder").execute(
      { title: "Review notice", date: "2026-12-31" },
      denied.runtime,
    )) as { status: string };
    expect(result.status).toBe("cancelled_by_user");
    expect(denied.requestApproval).toHaveBeenCalledOnce();

    const approved = makeRuntime(EMPTY_CASE, true);
    const created = (await byName(tools, "schedule_reminder").execute(
      { title: "Review notice", date: "2026-12-31" },
      approved.runtime,
    )) as { status: string; ics: string };
    expect(created.status).toBe("success");
    expect(created.ics).toContain("DTSTART;VALUE=DATE:20261231");
  });

  it("rejects impossible reminder dates", async () => {
    await expect(
      byName(tools, "schedule_reminder").execute(
        { title: "Review notice", date: "2026-02-31" },
        makeRuntime().runtime,
      ),
    ).rejects.toThrow();
  });

  it("generates escaped, script-blocked checklist HTML", async () => {
    const session = makeRuntime({
      ...EMPTY_CASE,
      id: "case-test",
      documentType: "other",
      issuer: '<script>alert("issuer")</script>',
      referenceNumber: "\"><img src=x onerror=alert(1)>",
      deadlineDate: "2026-12-31",
      amountDue: 500,
      sourceText: "notice",
    });
    const result = (await byName(tools, "generate_checklist_document").execute(
      { language: "hi" },
      session.runtime,
    )) as { status: string; fileName: string; html: string; mimeType: string };
    expect(result.status).toBe("ready");
    expect(result.fileName).toBe("nagrik-saathi-checklist-hi.html");
    expect(result.mimeType).toContain("text/html");
    expect(result.html).toContain("नागरिक साथी चेकलिस्ट");
    expect(result.html).not.toContain('<script>alert("issuer")</script>');
    expect(result.html).not.toContain("<img src=x onerror");
    expect(result.html).toContain("Content-Security-Policy");
  });

  it("escapes every HTML-sensitive character", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
    expect(buildChecklistHtml(EMPTY_CASE, "en")).toContain("Nagrik Saathi checklist");
  });
});
