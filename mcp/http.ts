import { randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createNagrikMcpServer } from "./create-server";

export type HttpServerOptions = {
  host?: string;
  port?: number;
  /** Bearer token. Required when binding beyond loopback. */
  authToken?: string | null;
  /** CORS origin. Defaults to `*`; set a specific origin in production. */
  allowedOrigin?: string;
  /** Maximum live protocol sessions. Defaults to 32. */
  maxSessions?: number;
  /** Close a session after this much inactivity. Defaults to 30 minutes. */
  sessionIdleMs?: number;
};

export type RunningHttpServer = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

type Session = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  lastSeen: number;
};

const DEFAULT_MAX_SESSIONS = 32;
const DEFAULT_SESSION_IDLE_MS = 30 * 60_000;

export function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}

function setCors(res: ServerResponse, origin: string) {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID",
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
}

function authorized(req: IncomingMessage, token: string | null): boolean {
  if (!token) return true;
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(token);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function writeJson(res: ServerResponse, status: number, body: unknown) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function requestSessionId(req: IncomingMessage): string | undefined {
  const header = req.headers["mcp-session-id"];
  return Array.isArray(header) ? header[0] : header;
}

/**
 * Start a Streamable HTTP MCP endpoint plus a small health endpoint.
 *
 * Sessions are stateful so notifications and subsequent calls work correctly.
 * Each session gets its own McpServer instance. The tool bodies remain
 * stateless: callers send `sourceText` on every call.
 *
 * Bind to loopback by default. A non-loopback bind without `MCP_AUTH_TOKEN` is
 * rejected so a misconfiguration cannot expose an unauthenticated tool server.
 */
export async function startHttpServer(options: HttpServerOptions = {}): Promise<RunningHttpServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 8787;
  const authToken = options.authToken?.trim() || null;
  const allowedOrigin = options.allowedOrigin?.trim() || "*";
  const maxSessions = options.maxSessions ?? DEFAULT_MAX_SESSIONS;
  const sessionIdleMs = options.sessionIdleMs ?? DEFAULT_SESSION_IDLE_MS;

  if (!Number.isInteger(maxSessions) || maxSessions < 1) {
    throw new Error("maxSessions must be a positive integer.");
  }
  if (!Number.isInteger(sessionIdleMs) || sessionIdleMs < 1_000) {
    throw new Error("sessionIdleMs must be an integer of at least 1000.");
  }

  if (!isLoopbackHost(host) && !authToken) {
    throw new Error(
      "MCP_AUTH_TOKEN is required when binding beyond loopback. Set a long random token or keep MCP_HOST=127.0.0.1.",
    );
  }

  const sessions = new Map<string, Session>();
  // Servers that have not completed `initialize` yet. Closed on shutdown so a
  // client that connects and disappears cannot leak a session.
  const unclaimed = new Set<McpServer>();

  function reapSessions() {
    const cutoff = Date.now() - sessionIdleMs;
    for (const [sessionId, session] of sessions) {
      if (session.lastSeen >= cutoff) continue;
      sessions.delete(sessionId);
      void session.server.close().catch(() => undefined);
    }
  }

  const reaper = setInterval(reapSessions, Math.min(60_000, sessionIdleMs));
  reaper.unref?.();

  async function createSession(): Promise<Omit<Session, "lastSeen">> {
    const server = createNagrikMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      maxRequestBodySize: 1_000_000,
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, { server, transport, lastSeen: Date.now() });
        unclaimed.delete(server);
      },
      onsessionclosed: (sessionId) => {
        sessions.delete(sessionId);
        void server.close().catch(() => undefined);
      },
    });
    unclaimed.add(server);
    await server.connect(transport);
    return { server, transport };
  }

  const httpServer = createServer((req, res) => {
    void (async () => {
      setCors(res, allowedOrigin);

      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }

      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

      if (pathname === "/health" && req.method === "GET") {
        writeJson(res, 200, {
          status: "ok",
          transport: "http",
          auth: Boolean(authToken),
          sessions: sessions.size,
          endpoint: "/mcp",
        });
        return;
      }

      if (pathname !== "/mcp") {
        writeJson(res, 404, { error: "Not found. Use /mcp or /health." });
        return;
      }

      if (!authorized(req, authToken)) {
        res.setHeader("WWW-Authenticate", 'Bearer realm="nagrik-saathi"');
        writeJson(res, 401, { error: "Unauthorized." });
        return;
      }

      const sessionId = requestSessionId(req);
      const existing = sessionId ? sessions.get(sessionId) : undefined;
      if (sessionId && !existing) {
        writeJson(res, 404, { error: "Unknown MCP session." });
        return;
      }

      if (existing) {
        existing.lastSeen = Date.now();
        await existing.transport.handleRequest(req, res);
        return;
      }

      // A request without a session ID must be an initialize request. Let the
      // transport decide; if it does not create a session, clean it up.
      reapSessions();
      if (sessions.size + unclaimed.size >= maxSessions) {
        res.setHeader("Retry-After", "60");
        writeJson(res, 503, {
          error: "Too many active MCP sessions. Retry after the current sessions expire.",
        });
        return;
      }
      const fresh = await createSession();
      try {
        await fresh.transport.handleRequest(req, res);
      } finally {
        if (!fresh.transport.sessionId) {
          unclaimed.delete(fresh.server);
          await fresh.server.close().catch(() => undefined);
        }
      }
    })().catch((error: unknown) => {
      console.error("MCP HTTP request failed:", error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        writeJson(res, 500, { error: "Internal server error." });
      } else {
        res.end();
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      httpServer.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      httpServer.off("error", onError);
      resolve();
    };
    httpServer.once("error", onError);
    httpServer.once("listening", onListening);
    httpServer.listen(port, host);
  });

  const address = httpServer.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const displayHost = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;

  let closed = false;
  return {
    url: `http://${displayHost}:${actualPort}`,
    port: actualPort,
    close: async () => {
      if (closed) return;
      closed = true;
      clearInterval(reaper);
      const all = [...sessions.values()].map((session) => session.server);
      sessions.clear();
      all.push(...unclaimed);
      unclaimed.clear();
      await Promise.all(all.map((server) => server.close().catch(() => undefined)));
      httpServer.closeAllConnections?.();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}
