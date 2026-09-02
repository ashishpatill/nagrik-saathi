"use client";

import type { ModelContext, WebMCPTool } from "@/types/webmcp";

type Registered = {
  tool: WebMCPTool;
  signal?: AbortSignal;
};

const registry = new Map<string, Registered>();

function activeTools() {
  return [...registry.values()]
    .filter((entry) => !entry.signal?.aborted)
    .map((entry) => entry.tool)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createFallbackModelContext(): ModelContext & { __isWebMCPPolyfill?: boolean; __isNagrikFallback?: boolean } {
  return {
    __isNagrikFallback: true,
    async registerTool(tool, options) {
      if (!tool.name || !tool.description || typeof tool.execute !== "function") {
        throw new TypeError("Invalid WebMCP tool descriptor.");
      }
      const signal = options?.signal;
      // Last writer wins so React Strict Mode remounts can re-register before the
      // previous effect cleanup aborts the older signal.
      registry.set(tool.name, { tool, signal });
      signal?.addEventListener("abort", () => {
        const current = registry.get(tool.name);
        if (current?.signal === signal) {
          registry.delete(tool.name);
        }
      });
    },
    async getTools() {
      return activeTools();
    },
    async executeTool(tool, input) {
      const registered = registry.get(tool.name)?.tool ?? tool;
      const parsed = input ? (JSON.parse(input) as Record<string, unknown>) : {};
      return registered.execute(parsed);
    },
  };
}

export function installFallbackModelContext() {
  if (typeof document === "undefined") return;
  const fallback = createFallbackModelContext();
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: fallback,
  });
  Object.defineProperty(navigator, "modelContext", {
    configurable: true,
    enumerable: true,
    get() {
      return fallback;
    },
  });
}
