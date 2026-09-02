"use client";

import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { buildIcs, calendarDataUrl } from "@/lib/calendar";
import { actionsForCase, analyzeText } from "@/lib/extract";
import { findOfficialPortal } from "@/lib/portals";
import { redactSensitiveData, scamSignals, truncateForTool } from "@/lib/safety";
import { installFallbackModelContext } from "@/lib/webmcp/fallback-context";
import {
  analyzeSchema,
  jsonSchemas,
  languageSchema,
  letterSchema,
  portalSchema,
  reminderSchema,
} from "@/lib/webmcp/schemas";
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
      initializeWebMCPPolyfill({ installTestingShim: true });
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
  return document.modelContext ?? navigator.modelContext ?? null;
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
    args,
    result,
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

  const tool = (
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    execute: WebMCPTool["execute"],
    readOnlyHint: boolean,
    untrustedContentHint = false,
  ): WebMCPTool => ({
    name,
    description,
    inputSchema,
    execute: async (input, client) => {
      try {
        const result = await execute(input, client);
        const cancelled =
          typeof result === "object" &&
          result !== null &&
          "status" in result &&
          (result as { status?: string }).status === "cancelled_by_user";
        logTool(onLog, name, input, result, cancelled ? "cancelled" : "success");
        return truncateForTool(result);
      } catch (error) {
        const result = {
          status: "error",
          message: error instanceof Error ? error.message : "Tool failed.",
        };
        logTool(onLog, name, input, result, "error");
        throw error;
      }
    },
    annotations: { readOnlyHint, untrustedContentHint },
  });

  const tools: WebMCPTool[] = [
    tool(
      "get_notice_summary",
      "Read the current notice summary in English, Hindi, or Marathi.",
      jsonSchemas.language,
      async (input) => {
        const currentCase = getCase();
        const { language } = languageSchema.parse(input);
        // Re-parse pasted text so Explain-* never echoes a stale/wrong saved case.
        const refreshed =
          currentCase.sourceText.trim().length > 0
            ? { ...analyzeText(currentCase.sourceText, language), id: currentCase.id }
            : currentCase;
        if (refreshed.id === currentCase.id && refreshed.sourceText) {
          setCase(refreshed);
        }
        return {
          documentType: refreshed.documentType,
          issuer: refreshed.issuer,
          referenceNumber: refreshed.referenceNumber,
          deadline: refreshed.deadlineDate,
          amountDue: refreshed.amountDue,
          urgency: refreshed.urgency,
          scamStatus: refreshed.scamRiskScore,
          summary: refreshed.summary[language],
          actions: actionsForCase(refreshed, language),
          disclaimer:
            language === "mr"
              ? "हे मार्गदर्शन आहे; अधिकृत सरकारी निर्णय नाही."
              : language === "hi"
                ? "यह मार्गदर्शन है; आधिकारिक सरकारी निर्णय नहीं।"
                : "This is guidance, not an official government decision.",
        };
      },
      true,
      true,
    ),
    tool(
      "find_official_portal",
      "Find a reviewed official portal and helpline for a department and service.",
      jsonSchemas.portal,
      async (input) => {
        const args = portalSchema.parse(input);
        return findOfficialPortal(args.department, args.service, args.state);
      },
      true,
    ),
    tool(
      "check_scam_signals",
      "Check the current notice for common scam signals and safe next steps.",
      jsonSchemas.language,
      async () => scamSignals(getCase()),
      true,
      true,
    ),
    tool(
      "analyze_notice",
      "Analyze supplied notice text and update the current workspace case.",
      jsonSchemas.analyze,
      async (input) => {
        const args = analyzeSchema.parse(input);
        if (!args.sourceText?.trim()) {
          throw new Error("Provide notice text in sourceText. This app does not use sample notices.");
        }
        const next = analyzeText(args.sourceText, args.language);
        setCase(next);
        return {
          status: "analyzed",
          caseId: next.id,
          issuer: next.issuer,
          deadline: next.deadlineDate,
          risk: next.scamRiskScore,
        };
      },
      false,
      true,
    ),
    tool(
      "create_action_plan",
      "Create a safe checklist and required-document list for the current notice.",
      jsonSchemas.language,
      async () => {
        const currentCase = getCase();
        return {
          status: "ready",
          checklist: currentCase.requiredActionItems,
          requiredDocuments: currentCase.requiredDocuments,
          boundary: "The app does not make payments, submit forms, or contact officials.",
        };
      },
      false,
      true,
    ),
    tool(
      "schedule_reminder",
      "Create a calendar reminder after explicit user approval.",
      jsonSchemas.reminder,
      async (input, client) => {
        const args = reminderSchema.parse(input);
        const approved = await confirm(client, requestApproval, "Schedule calendar reminder", args);
        if (!approved) return { status: "cancelled_by_user", reason: "User denied the reminder." };
        return {
          status: "success",
          title: args.title,
          date: args.date,
          ics: buildIcs(args.title, args.date),
          calendarLink: calendarDataUrl(args.title, args.date),
        };
      },
      false,
    ),
    tool(
      "export_family_brief",
      "Export a redacted one-page family brief after explicit user approval.",
      jsonSchemas.language,
      async (input, client) => {
        const currentCase = getCase();
        const { language } = languageSchema.parse(input);
        const brief = `${currentCase.summary[language]}\n\nWhat to do next:\n${actionsForCase(currentCase, language).map((item) => `- ${item}`).join("\n")}`;
        const redacted = redactSensitiveData(brief);
        const approved = await confirm(client, requestApproval, "Export redacted family brief", { language });
        if (!approved) return { status: "cancelled_by_user" };
        return {
          status: "success",
          fileName: "nagrik-saathi-family-brief.txt",
          content: redacted,
        };
      },
      false,
      true,
    ),
    tool(
      "draft_citizen_letter",
      "Draft a review-only citizen letter; never send it.",
      jsonSchemas.letter,
      async (input) => {
        const currentCase = getCase();
        const { language, tone } = letterSchema.parse(input);
        const opening =
          language === "mr"
            ? "प्रति,\nसंबंधित अधिकारी,"
            : language === "hi"
              ? "सेवा में,\nसंबंधित अधिकारी,"
              : "To,\nThe concerned officer,";
        const body =
          currentCase.documentType === "payment_receipt"
            ? language === "mr"
              ? `माझ्या व्यवहार/पावती क्रमांक ${currentCase.referenceNumber} बाबत ही पेमेंट पावती आहे (तारीख ${currentCase.deadlineDate ?? "नमूद नाही"}, रक्कम ${currentCase.amountDue ?? "—"}). कृपया नोंद घ्या; पुन्हा शुल्क आकारू नये.`
              : language === "hi"
                ? `मेरे लेनदेन/रसीद संख्या ${currentCase.referenceNumber} की यह भुगतान रसीद है (तिथि ${currentCase.deadlineDate ?? "उल्लेख नहीं"}, राशि ${currentCase.amountDue ?? "—"})। कृपया दर्ज करें; दोबारा शुल्क न लें।`
                : `This is a payment receipt for transaction/receipt ${currentCase.referenceNumber} (date ${currentCase.deadlineDate ?? "not stated"}, amount ${currentCase.amountDue ?? "—"}). Please note it on record; do not charge again.`
            : language === "mr"
              ? `माझ्या संदर्भ क्रमांक ${currentCase.referenceNumber} बाबत कृपया मार्गदर्शन करावे. अंतिम तारीख ${currentCase.deadlineDate ?? "नमूद नाही"} आहे.`
              : language === "hi"
                ? `संदर्भ संख्या ${currentCase.referenceNumber} के संबंध में कृपया मार्गदर्शन करें। अंतिम तिथि ${currentCase.deadlineDate ?? "उल्लेख नहीं है"} है।`
                : `Please provide guidance regarding reference ${currentCase.referenceNumber}. The deadline is ${currentCase.deadlineDate ?? "not stated"}.`;
        return {
          status: "draft_only",
          tone,
          content: `${opening}\n\n${body}\n\nRegards,\n[Your name]\n\nDo not send automatically. Review and submit through the official channel yourself.`,
        };
      },
      false,
      true,
    ),
  ];

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
