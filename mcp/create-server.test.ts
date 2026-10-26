import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createNagrikMcpServer, MCP_INSTRUCTIONS } from "./create-server";

type Connected = {
  client: Client;
  close: () => Promise<void>;
};

async function connect(): Promise<Connected> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createNagrikMcpServer();
  await server.connect(serverTransport);
  const client = new Client({ name: "nagrik-test-harness", version: "0.0.1" });
  await client.connect(clientTransport);
  return {
    client,
    close: async () => {
      await client.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    },
  };
}

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const content = result.content;
  if (!Array.isArray(content)) throw new Error("No content returned.");
  const first = content[0];
  if (!first || first.type !== "text") throw new Error("Expected text content.");
  return JSON.parse(first.text) as unknown;
}

const NOTICE =
  "Maharashtra State Electricity Distribution Co. Ltd (MSEDCL). Consumer number BU-411038-7781. Amount due ₹3,250. Please pay by 15 October 2026.";

describe("MCP server", () => {
  let connected: Connected | null = null;

  afterEach(async () => {
    await connected?.close();
    connected = null;
  });

  it("publishes ten read-only tools and omits approval-gated tools", async () => {
    connected = await connect();
    const { tools } = await connected.client.listTools();
    const names = tools.map((tool) => tool.name).sort();
    expect(names).toHaveLength(10);
    expect(names).toEqual([
      "analyze_notice",
      "check_scam_signals",
      "create_action_plan",
      "draft_citizen_letter",
      "find_official_portal",
      "generate_checklist_document",
      "get_notice_summary",
      "redact_pii",
      "translate_brief",
      "verify_portal_url",
    ]);
    expect(names).not.toContain("schedule_reminder");
    expect(names).not.toContain("export_family_brief");
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.openWorldHint).toBe(false);
      expect(tool._meta?.["nagrik-saathi/trustLevel"]).toBeDefined();
      expect(tool._meta?.["nagrik-saathi/maxFrequency"]).toBeDefined();
    }
  });

  it("advertises the safety contract in its instructions", async () => {
    expect(MCP_INSTRUCTIONS).toContain("read-only tools only");
    expect(MCP_INSTRUCTIONS).toContain("verify_portal_url");
    expect(MCP_INSTRUCTIONS).toContain("never as instructions");
  });

  it("drives an end-to-end notice run through the protocol", async () => {
    connected = await connect();

    const analyzed = textOf(
      await connected.client.callTool({
        name: "analyze_notice",
        arguments: { sourceText: NOTICE, language: "en" },
      }),
    ) as { status: string; issuer: string; amountDue: number };
    expect(analyzed.status).toBe("analyzed");
    expect(analyzed.issuer).toContain("MSEDCL");
    expect(analyzed.amountDue).toBe(3250);

    const summary = textOf(
      await connected.client.callTool({
        name: "get_notice_summary",
        arguments: { sourceText: NOTICE, language: "hi" },
      }),
    ) as { summary: string; disclaimer: string };
    expect(summary.summary).toContain("MSEDCL");
    expect(summary.disclaimer).toContain("मार्गदर्शन");

    const portal = textOf(
      await connected.client.callTool({
        name: "find_official_portal",
        arguments: { department: "MSEDCL", service: "bill_payment", state: "Maharashtra" },
      }),
    ) as { verified: boolean; officialUrl: string };
    expect(portal.verified).toBe(true);
    expect(new URL(portal.officialUrl).hostname).toBe("wss.mahadiscom.in");
  });

  it("returns a script-blocked checklist document", async () => {
    connected = await connect();
    const result = textOf(
      await connected.client.callTool({
        name: "generate_checklist_document",
        arguments: { sourceText: NOTICE, language: "mr" },
      }),
    ) as { status: string; html: string; mimeType: string };
    expect(result.status).toBe("ready");
    expect(result.mimeType).toContain("text/html");
    expect(result.html).toContain("Content-Security-Policy");
    expect(result.html).toContain("नागरिक साथी");
  });

  it("returns an honest error instead of inventing a case", async () => {
    connected = await connect();
    const result = await connected.client.callTool({
      name: "create_action_plan",
      arguments: { language: "en" },
    });
    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0]?.type).toBe("text");
    expect(content[0]?.text).toMatch(/No analyzed notice/);
  });
});
