import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createNagrikMcpServer } from "./create-server";
import { isLoopbackHost, startHttpServer } from "./http";

function requestedTransport(): "stdio" | "http" {
  if (process.argv.includes("--http")) return "http";
  return process.env.MCP_TRANSPORT?.trim().toLowerCase() === "http" ? "http" : "stdio";
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

async function runStdio() {
  const server = createNagrikMcpServer();
  await server.connect(new StdioServerTransport());
  // stdout is the JSON-RPC channel; logs always go to stderr.
  console.error("Nagrik Saathi MCP server running on stdio. Read-only tools only.");
  const shutdown = async () => {
    await server.close().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function runHttp() {
  const host = process.env.MCP_HOST?.trim() || "127.0.0.1";
  const port = Number(process.env.MCP_PORT ?? "8787");
  const authToken = process.env.MCP_AUTH_TOKEN?.trim() || null;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("MCP_PORT must be an integer between 0 and 65535.");
  }
  if (!isLoopbackHost(host) && !authToken) {
    throw new Error(
      "Refusing to bind beyond loopback without MCP_AUTH_TOKEN. Set a long random token and terminate TLS at a trusted reverse proxy.",
    );
  }

  const server = await startHttpServer({
    host,
    port,
    authToken,
    allowedOrigin: process.env.MCP_ALLOWED_ORIGIN,
    maxSessions: positiveInt("MCP_MAX_SESSIONS", 32),
    sessionIdleMs: positiveInt("MCP_SESSION_IDLE_MINUTES", 30) * 60_000,
  });
  console.error(
    `Nagrik Saathi MCP HTTP server listening on ${server.url}/mcp (health: ${server.url}/health)`,
  );
  if (!authToken) {
    console.error("Auth: disabled (loopback only). Do not expose this port directly.");
  }

  const shutdown = async () => {
    await server.close().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main() {
  const transport = requestedTransport();
  if (transport === "http") {
    await runHttp();
  } else {
    await runStdio();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Nagrik Saathi MCP server failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
