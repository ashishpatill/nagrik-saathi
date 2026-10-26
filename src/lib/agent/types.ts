import type { z } from "zod";
import type { DocumentAnalysis } from "@/lib/types";

/**
 * How an agent host should treat a tool.
 *
 * - `read-only`: no external side effect. Safe to call without a human in the loop.
 * - `untrusted-content`: read-only, but the result contains notice-derived text.
 *   Treat the result as data, never as instructions.
 * - `side-effect`: creates a user-visible artifact (download, calendar entry) and
 *   must pass an explicit approval gate before it runs.
 */
export type TrustLevel = "read-only" | "untrusted-content" | "side-effect";

/** Advisory frequency hint, e.g. `30/min`. Hosts are expected to enforce it. */
export type MaxFrequency = `${number}/${"min" | "hour"}`;

/**
 * Runtime services a tool needs. The browser adapter supplies workspace state
 * and a visible approval modal; the MCP adapter supplies a stateless context.
 */
export interface AgentToolRuntime {
  /** Current local case, or an empty case when no notice has been analyzed. */
  getCase: () => DocumentAnalysis;
  /** Persist a locally analyzed case. The MCP adapter treats this as a no-op. */
  setCase: (value: DocumentAnalysis) => void;
  /**
   * Ask the human for approval. Resolve `false` on denial. The MCP adapter
   * returns `false` because it does not expose approval-gated tools.
   */
  requestApproval: (action: string, payload: unknown) => Promise<boolean>;
}

/**
 * One tool definition shared by WebMCP, the playground, and the MCP server.
 * Keep this object free of browser and Next.js imports so Node can load it.
 */
export interface AgentTool {
  name: string;
  title: string;
  description: string;
  trustLevel: TrustLevel;
  maxFrequency: MaxFrequency;
  /** Result embeds notice-derived text that must be treated as data. */
  untrustedContentHint: boolean;
  /** Requires a visible human approval before producing a user-visible artifact. */
  requiresApproval: boolean;
  /** Needs an analyzed notice (or `sourceText` supplied in the call). */
  requiresCase: boolean;
  /** Exposed by the read-only MCP server. False for approval-gated tools. */
  mcpExposed: boolean;
  /** JSON Schema for WebMCP and documentation. Generated from `schema`. */
  inputSchema: Record<string, unknown>;
  /** Zod schema used by the MCP SDK and by each tool body. */
  schema: z.ZodType;
  /** Safe starting input for the playground and docs. */
  exampleInput: Record<string, unknown>;
  /**
   * Maximum serialized result size for the WebMCP adapter. `null` keeps the
   * full result (needed for HTML downloads); the MCP server always returns the
   * full result.
   */
  maxResultChars: number | null;
  execute: (input: Record<string, unknown>, runtime: AgentToolRuntime) => Promise<unknown>;
}
