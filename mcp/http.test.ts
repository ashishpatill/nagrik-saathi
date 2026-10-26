import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { isLoopbackHost, startHttpServer, type RunningHttpServer } from "./http";

const servers: RunningHttpServer[] = [];

afterEach(async () => {
  while (servers.length) {
    await servers.pop()?.close();
  }
});

async function start(options: Parameters<typeof startHttpServer>[0] = {}) {
  const server = await startHttpServer({ port: 0, ...options });
  servers.push(server);
  return server;
}

async function connectClient(url: string, headers?: Record<string, string>) {
  const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`), {
    requestInit: { headers },
  });
  const client = new Client({ name: "http-test-harness", version: "0.0.1" });
  await client.connect(transport);
  return client;
}

describe("MCP HTTP transport", () => {
  it("serves health and completes a protocol run over HTTP", async () => {
    const server = await start();
    const health = await fetch(`${server.url}/health`);
    expect(health.status).toBe(200);
    expect((await health.json()) as { status: string }).toMatchObject({
      status: "ok",
      transport: "http",
      auth: false,
    });

    const client = await connectClient(server.url);
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(10);

    const result = await client.callTool({
      name: "verify_portal_url",
      arguments: { url: "https://wss.mahadiscom.in/wss/wss" },
    });
    const content = result.content as Array<{ type: string; text?: string }>;
    expect(content[0]?.type).toBe("text");
    if (content[0]?.text) {
      const parsed = JSON.parse(content[0].text) as { verified: boolean; match: string };
      expect(parsed.verified).toBe(true);
      expect(parsed.match).toBe("registered_path");
    }
    await client.close();
  });

  it("requires a bearer token on /mcp when configured", async () => {
    const server = await start({ authToken: "test-token-not-a-real-secret" });

    const unauthorized = await fetch(`${server.url}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(unauthorized.status).toBe(401);

    const client = await connectClient(server.url, {
      Authorization: "Bearer test-token-not-a-real-secret",
    });
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(10);
    await client.close();
  });

  it("caps live sessions instead of growing without bound", async () => {
    const server = await start({ maxSessions: 1 });
    const client = await connectClient(server.url);
    await client.listTools();

    const refused = await fetch(`${server.url}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "second-client", version: "0.0.1" },
        },
      }),
    });
    expect(refused.status).toBe(503);
    expect(refused.headers.get("retry-after")).toBe("60");

    await client.close();
  });

  it("does not expose the MCP endpoint on unknown paths", async () => {
    const server = await start();
    const response = await fetch(`${server.url}/admin`);
    expect(response.status).toBe(404);
  });

  it("refuses an unauthenticated non-loopback bind", async () => {
    await expect(startHttpServer({ host: "0.0.0.0", port: 0 })).rejects.toThrow(
      /MCP_AUTH_TOKEN is required/,
    );
  });

  it("recognises only loopback host spellings", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("::1")).toBe(true);
    expect(isLoopbackHost("0.0.0.0")).toBe(false);
    expect(isLoopbackHost("10.0.0.1")).toBe(false);
  });
});
