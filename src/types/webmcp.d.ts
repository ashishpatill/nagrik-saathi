import type { MaxFrequency, TrustLevel } from "@/lib/agent/types";
import type { Language } from "@/lib/types";

export interface WebMCPClient {
  signal?: AbortSignal;
  requestUserInteraction?: <T>(callback: () => Promise<T> | T) => Promise<T>;
}

export interface WebMCPTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  /** Local registry metadata. Native WebMCP may drop unknown fields. */
  trustLevel?: TrustLevel;
  maxFrequency?: MaxFrequency;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    /** Present in the current polyfill's known annotation set. */
    consequentialHint?: boolean;
    debugging?: boolean;
  };
  execute: (input: Record<string, unknown>, client?: WebMCPClient) => Promise<unknown>;
}

export interface ModelContext {
  registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => Promise<void>;
  getTools?: () => Promise<WebMCPTool[]>;
  executeTool?: (tool: WebMCPTool, input: string, options?: { signal?: AbortSignal }) => Promise<unknown>;
  addEventListener?: (name: string, listener: EventListener) => void;
  removeEventListener?: (name: string, listener: EventListener) => void;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export type ToolLanguage = Language;
