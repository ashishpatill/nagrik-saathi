import { describe, expect, it } from "vitest";
import { createFallbackModelContext } from "@/lib/webmcp/fallback-context";
import type { WebMCPTool } from "@/types/webmcp";

function fakeTool(name: string, marker: string): WebMCPTool {
  return {
    name,
    description: `${name} tool`,
    inputSchema: { type: "object", properties: {} },
    execute: async () => ({ status: "ok", marker }),
    annotations: { readOnlyHint: true },
  };
}

describe("fallback model context", () => {
  it("lets a remount replace a live registration before the old signal aborts", async () => {
    const context = createFallbackModelContext();
    const first = new AbortController();
    const second = new AbortController();

    await context.registerTool(fakeTool("demo_tool", "first"), { signal: first.signal });
    await context.registerTool(fakeTool("demo_tool", "second"), { signal: second.signal });

    first.abort();
    const tools = await context.getTools!();
    expect(tools).toHaveLength(1);
    expect(await tools[0]?.execute({})).toEqual({ status: "ok", marker: "second" });

    second.abort();
    expect(await context.getTools!()).toEqual([]);
  });
});
