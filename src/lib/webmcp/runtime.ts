"use client";

import { installWebMCP } from "@mcp-b/webmcp-polyfill";
import { createAgentTools } from "@/lib/agent/tools";
import type { AgentToolRuntime } from "@/lib/agent/types";
import { redactDeep, truncateForTool } from "@/lib/safety";
import { installFallbackModelContext } from "@/lib/webmcp/fallback-context";
import type { DocumentAnalysis, ToolLog } from "@/lib/types";
import type { ModelContext, WebMCPClient, WebMCPTool } from "@/types/webmcp";

let polyfillInitialized = false;

export type WebMCPRuntimeMode = "native" | "polyfill" | "local" | "unavailable";

export type RegisteredTools = {
  tools: WebMCPTool[];
  mode: WebMCPRuntimeMode;
  dispose: () => void;
};

export function initializeWebMCP() {
  if (typeof window === "undefined" || polyfillInitialized) return;
  const originKeyedOff = (globalThis as { originAgentCluster?: boolean }).originAgentCluster === false;
  if (originKeyedOff) {
    // Polyfill rejects or hangs when originAgentCluster is false; use local fallback.
    installFallbackModelContext();
  } else {
    try {
      installWebMCP();
    } catch {
      installFallbackModelContext();
    }
    if (!document.modelContext?.registerTool) {
      installFallbackModelContext();
    }
  }
  polyfillInitialized = true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("WebMCP registration timed out.")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function registerAll(context: ModelContext | null, tools: WebMCPTool[], signal: AbortSignal) {
  if (!context?.registerTool) throw new Error("No model context available.");
  await Promise.all(tools.map((registeredTool) => context.registerTool(registeredTool, { signal })));
}

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  // The polyfill's upstream WebMCP types describe registered tools without the
  // execute callback, which our local adapter needs. Registration is checked
  // structurally at the call sites.
  const context = (document.modelContext ?? navigator.modelContext) as unknown as
    | ModelContext
    | undefined;
  return context ?? null;
}

export function describeRuntimeMode(registeredViaContext: boolean): WebMCPRuntimeMode {
  const context = getModelContext() as (ModelContext & { __isWebMCPPolyfill?: boolean; __isNagrikFallback?: boolean }) | null;
  if (!context?.registerTool) return registeredViaContext ? "local" : "unavailable";
  if (!registeredViaContext) return "local";
  if (context.__isNagrikFallback) return "local";
  return context.__isWebMCPPolyfill ? "polyfill" : "native";
}

type RegisterOptions = {
  getCase: () => DocumentAnalysis;
  setCase: (value: DocumentAnalysis) => void;
  onLog: (log: ToolLog) => void;
  requestApproval: (action: string, payload: unknown) => Promise<boolean>;
};

function logTool(
  onLog: RegisterOptions["onLog"],
  name: string,
  args: unknown,
  result: unknown,
  status: ToolLog["status"] = "success",
) {
  onLog({
    id: crypto.randomUUID(),
    name,
    // Tool logs may outlive the tab (IndexedDB). Args and results pass the
    // redaction pipeline so Aadhaar/PAN/card/account values never persist.
    args: redactDeep(args),
    result: redactDeep(result),
    timestamp: new Date().toISOString(),
    status,
  });
}

async function confirm(
  client: WebMCPClient | undefined,
  requestApproval: RegisterOptions["requestApproval"],
  action: string,
  payload: unknown,
) {
  if (client?.requestUserInteraction) {
    return Boolean(await client.requestUserInteraction(() => requestApproval(action, payload)));
  }
  return requestApproval(action, payload);
}

export async function registerWebMCPTools(options: RegisterOptions): Promise<RegisteredTools> {
  const controller = new AbortController();
  const { getCase, setCase, onLog, requestApproval } = options;

  const runtime: AgentToolRuntime = { getCase, setCase, requestApproval };

  const tools: WebMCPTool[] = createAgentTools().map((agentTool) => ({
    name: agentTool.name,
    title: agentTool.title,
    description: agentTool.description,
    inputSchema: agentTool.inputSchema,
    trustLevel: agentTool.trustLevel,
    maxFrequency: agentTool.maxFrequency,
    annotations: {
      readOnlyHint: agentTool.trustLevel !== "side-effect",
      untrustedContentHint: agentTool.untrustedContentHint,
      consequentialHint: agentTool.trustLevel === "side-effect",
    },
    execute: async (input, client) => {
      try {
        const result = await agentTool.execute(input, {
          ...runtime,
          requestApproval: (action, payload) => confirm(client, requestApproval, action, payload),
        });
        const cancelled =
          typeof result === "object" &&
          result !== null &&
          "status" in result &&
          (result as { status?: string }).status === "cancelled_by_user";
        logTool(onLog, agentTool.name, input, result, cancelled ? "cancelled" : "success");
        return agentTool.maxResultChars === null
          ? result
          : truncateForTool(result, agentTool.maxResultChars);
      } catch (error) {
        const result = {
          status: "error",
          message: error instanceof Error ? error.message : "Tool failed.",
        };
        logTool(onLog, agentTool.name, input, result, "error");
        throw error;
      }
    },
  }));

  let registeredViaContext = false;
  const liveContext = getModelContext();
  try {
    await withTimeout(registerAll(liveContext, tools, controller.signal), 900);
    registeredViaContext = true;
  } catch {
    installFallbackModelContext();
    try {
      await withTimeout(registerAll(getModelContext(), tools, controller.signal), 900);
      registeredViaContext = true;
    } catch {
      registeredViaContext = false;
    }
  }

  return {
    tools,
    mode: describeRuntimeMode(registeredViaContext),
    dispose: () => controller.abort(),
  };
}
